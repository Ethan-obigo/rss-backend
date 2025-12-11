import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { r2Config } from 'src/common/config/r2.config';
import { VideoInfo } from 'src/types/youtube.types';
import { Readable } from 'stream';
import { spawn } from 'child_process';
import ytpl from 'ytpl';
import {
  Video,
  ChannelDbService,
} from 'src/shared/services/channel-db.service';
import type { Json } from 'src/types/database.types';

interface YtDlpVideoInfo {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  uploader?: string;
  channel?: string;
  upload_date?: string;
  duration?: number;
}

@Injectable()
export class YoutubeService {
  private s3Client: S3Client;

  constructor(private readonly channelDbService: ChannelDbService) {
    if (
      !r2Config.endpoint ||
      !r2Config.accessKeyId ||
      !r2Config.secretAccessKey
    ) {
      throw new Error('R2 환경변수 설정을 확인해주세요.');
    }

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: r2Config.endpoint,
      credentials: {
        accessKeyId: r2Config.accessKeyId,
        secretAccessKey: r2Config.secretAccessKey,
      },
    });
  }

  /**
   * URL 타입 판별 (비디오/플레이리스트/채널)
   */
  private getUrlType(
    url: string,
  ): 'video' | 'playlist' | 'channel' | 'unknown' {
    if (url.includes('playlist?list=') || url.includes('/playlist?list=')) {
      return 'playlist';
    }
    if (
      url.includes('/channel/') ||
      url.includes('/@') ||
      url.includes('/c/')
    ) {
      return 'channel';
    }
    if (url.includes('watch?v=') || url.includes('youtu.be/')) {
      return 'video';
    }
    return 'unknown';
  }

  /**
   * 플레이리스트/채널 정보 및 비디오 ID 가져오기
   */
  private async getPlaylistInfo(url: string): Promise<{
    channelInfo: {
      id: string;
      title: string;
      url: string;
      thumbnail?: string;
      author?: string;
      description?: string;
    };
    videoIds: string[];
  }> {
    try {
      const result = await ytpl(url, { limit: Infinity });
      const videoIds = result.items.map((item) => item.id);

      return {
        channelInfo: {
          id: result.id,
          title: result.title,
          url: result.url,
          thumbnail: result.bestThumbnail?.url || undefined,
          author: result.author?.name || undefined,
          description: result.description || undefined,
        },
        videoIds,
      };
    } catch (error) {
      throw new Error(
        `Failed to get playlist info: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * yt-dlp로 YouTube 영상 정보 가져오기
   */
  private async getVideoInfo(videoId: string): Promise<VideoInfo> {
    return new Promise((resolve, reject) => {
      const ytdlp = spawn('yt-dlp', [
        '--dump-json',
        '--no-playlist',
        `https://www.youtube.com/watch?v=${videoId}`,
      ]);

      let output = '';
      let errorOutput = '';

      ytdlp.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      ytdlp.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString();
      });

      ytdlp.on('close', (code) => {
        if (code !== 0) {
          console.error('yt-dlp error:', errorOutput);
          reject(new Error(`yt-dlp exited with code ${code}`));
          return;
        }

        try {
          const info = JSON.parse(output) as YtDlpVideoInfo;
          resolve({
            videoId: info.id,
            title: info.title,
            description: info.description || null,
            thumbnail: info.thumbnail,
            author: info.uploader || info.channel || 'Unknown',
            publishedAt: info.upload_date || new Date().toISOString(),
            audioUrl: '',
            audioSize: 0,
            duration: info.duration || 0,
          });
        } catch (error) {
          reject(
            error instanceof Error
              ? error
              : new Error('Failed to parse video info'),
          );
        }
      });
    });
  }

  /**
   * yt-dlp로 오디오 스트림 가져오기 (stdout)
   */
  private getAudioStream(videoUrl: string): Readable {
    const ytdlp = spawn('yt-dlp', [
      '-f',
      'bestaudio',
      '-o',
      '-', // stdout으로 출력
      '--no-playlist',
      videoUrl,
    ]);

    return ytdlp.stdout;
  }

  /**
   * YouTube 영상의 오디오만 cloudflare 저장
   */
  async uploadAudio(
    videoId: string,
    videoUrl: string,
  ): Promise<{ url: string; size: number }> {
    const audioName = `${videoId}.mp3`;

    try {
      const audioStream = this.getAudioStream(videoUrl);
      const chunks: Buffer[] = [];

      for await (const chunk of audioStream) {
        chunks.push(Buffer.from(chunk));
      }
      const buffer = Buffer.concat(chunks);

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: r2Config.bucketName,
          Key: audioName,
          Body: buffer,
          ContentType: 'audio/mpeg',
          ContentLength: buffer.length,
        }),
      );

      return {
        url: `${r2Config.publicUrl}/${audioName}`,
        size: buffer.length,
      };
    } catch (error) {
      console.error(
        '오디오 업로드 실패:',
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }

  /**
   * YouTube 영상의 오디오 추출 및 메타데이터 반환
   */
  async makeAudioUrl(videoId: string): Promise<VideoInfo> {
    try {
      const videoInfo = await this.getVideoInfo(videoId);
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const audioData = await this.uploadAudio(videoId, videoUrl);

      return {
        ...videoInfo,
        audioUrl: audioData.url,
        audioSize: audioData.size,
      };
    } catch (error) {
      console.error('오디오 URL 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 비디오 ID로 영상 처리 (오디오 추출 및 업로드)
   */
  private async processVideo(videoId: string): Promise<VideoInfo> {
    return await this.makeAudioUrl(videoId);
  }

  /**
   * VideoInfo를 Video 타입으로 변환
   */
  private convertToVideo(videoInfo: VideoInfo): Video {
    return {
      id: videoInfo.videoId,
      title: videoInfo.title,
      description: videoInfo.description || undefined,
      url: `https://www.youtube.com/watch?v=${videoInfo.videoId}`,
      audioPath: videoInfo.audioUrl,
      audioSize: videoInfo.audioSize,
      thumbnail: videoInfo.thumbnail,
      publishedAt: videoInfo.publishedAt,
      uploadDate: videoInfo.publishedAt,
      duration: videoInfo.duration,
    };
  }

  /**
   * URL에서 비디오 ID 추출
   */
  private extractVideoId(url: string): string {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([^&]+)/,
      /(?:youtu\.be\/)([^?]+)/,
      /(?:youtube\.com\/embed\/)([^?]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    throw new Error('Invalid YouTube URL');
  }

  async makeUrl(url: string) {
    const urlType = this.getUrlType(url);

    let videoIds: string[] = [];
    let channelInfo: {
      id: string;
      title: string;
      url: string;
      thumbnail?: string;
      author?: string;
      description?: string;
    } | null = null;

    if (urlType === 'video') {
      const videoId = this.extractVideoId(url);
      videoIds = [videoId];
    } else {
      const playlistData = await this.getPlaylistInfo(url);
      videoIds = playlistData.videoIds;
      channelInfo = playlistData.channelInfo;
    }

    const results: VideoInfo[] = [];
    const errors: { videoId: string; error: string }[] = [];

    for (let i = 0; i < videoIds.length; i++) {
      const videoId = videoIds[i];

      try {
        const result = await this.processVideo(videoId);
        results.push(result);
      } catch (error) {
        errors.push({
          videoId,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      // 요청 간 딜레이 (rate limit 방지)
      if (i < videoIds.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    return {
      type: urlType,
      url,
      channelInfo,
      total: videoIds.length,
      success: results.length,
      failed: errors.length,
      videos: results,
      errors,
    };
  }

  /**
   * YouTube URL 처리 후 DB에 저장하고 RSS URL 반환
   */
  async processAndSave(url: string, baseUrl: string): Promise<string> {
    const result = await this.makeUrl(url);

    // 단일 비디오인 경우 채널 정보 생성
    if (result.type === 'video' && result.videos.length > 0) {
      const firstVideo = result.videos[0];
      const channelId = `youtube-video-${firstVideo.videoId}`;

      await this.channelDbService.addChannel({
        id: channelId,
        title: firstVideo.title,
        url: `https://www.youtube.com/watch?v=${firstVideo.videoId}`,
        thumbnail: firstVideo.thumbnail,
        type: 'youtube',
        videos: result.videos.map((v) =>
          this.convertToVideo(v),
        ) as unknown as Json,
        description: firstVideo.description || undefined,
        author: firstVideo.author,
        language: 'ko',
      });

      return `${baseUrl}/rss/${channelId}`;
    }

    // 플레이리스트/채널인 경우
    if (result.channelInfo) {
      const channelId = `youtube-${result.channelInfo.id}`;

      await this.channelDbService.addChannel({
        id: channelId,
        title: result.channelInfo.title,
        url: result.channelInfo.url,
        thumbnail: result.channelInfo.thumbnail,
        type: 'youtube',
        videos: result.videos.map((v) =>
          this.convertToVideo(v),
        ) as unknown as Json,
        description: result.channelInfo.description,
        author: result.channelInfo.author,
        language: 'ko',
      });

      return `${baseUrl}/rss/${channelId}`;
    }

    throw new Error('Failed to process YouTube URL');
  }
}
