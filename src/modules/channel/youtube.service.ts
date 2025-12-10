import { Injectable } from '@nestjs/common';
import YTDlpWrap from 'yt-dlp-wrap';
import * as path from 'path';
import * as fs from 'fs';
import { SupabaseService } from '../../shared/services/supabase.service';

const YTDlp = (YTDlpWrap as any).default || YTDlpWrap;

@Injectable()
export class YoutubeService {
  private readonly AUDIO_DIR: string;
  private readonly YT_DLP_PATH: string;
  private readonly FFMPEG_PATH: string;

  constructor(private readonly supabaseService: SupabaseService) {
    this.AUDIO_DIR = path.join(process.cwd(), 'storage', 'audio');

    this.YT_DLP_PATH =
      process.env.NODE_ENV === 'production'
        ? 'yt-dlp'
        : path.join(process.cwd(), 'bin', 'yt-dlp.exe');

    this.FFMPEG_PATH = path.join(process.cwd(), 'bin');

    if (!fs.existsSync(this.AUDIO_DIR)) {
      fs.mkdirSync(this.AUDIO_DIR, { recursive: true });
    }
  }

  /**
   * YouTube URL 타입 감지
   */
  private detectYouTubeUrlType(url: string) {
    const playlistMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (playlistMatch) {
      return { type: 'playlist', id: playlistMatch[1] };
    }

    const channelMatch = url.match(/\/@([^/?]+)|\/channel\/([^/?]+)/);
    if (channelMatch) {
      return { type: 'channel', id: channelMatch[1] || channelMatch[2] };
    }

    throw new Error('Invalid YouTube URL format');
  }

  /**
   * YouTube 채널 또는 플레이리스트 정보 가져오기
   */
  async getChannelInfo(url: string) {
    const ytDlp = new YTDlp(this.YT_DLP_PATH);
    const urlType = this.detectYouTubeUrlType(url);

    try {
      if (urlType.type === 'playlist') {
        const metadata = await ytDlp.execPromise([
          url,
          '--flat-playlist',
          '--dump-single-json',
          '--no-warnings',
          '--extractor-args',
          'youtube:lang=ko',
        ]);

        const data = JSON.parse(metadata);

        return {
          id: data.id || urlType.id,
          title: data.title || 'Unknown Playlist',
          description: data.description || '',
          thumbnail: data.thumbnails?.[0]?.url || '',
          type: 'playlist',
          channelId: data.channel_id || data.uploader_id,
          channelName: data.channel || data.uploader || 'Unknown Channel',
          playlistCount: data.playlist_count || data.entries?.length || 0,
        };
      } else {
        const metadata = await ytDlp.execPromise([
          url,
          '--flat-playlist',
          '--dump-json',
          '--playlist-end=1',
          '--no-warnings',
          '--extractor-args',
          'youtube:lang=ko',
        ]);

        const firstLine = metadata.split('\n').find((line) => line.trim());
        if (!firstLine) {
          throw new Error('메타 데이터를 찾을 수 없습니다.');
        }

        const data = JSON.parse(firstLine);

        return {
          id: data.playlist_channel_id || data.channel_id || data.uploader_id,
          title:
            data.playlist_channel ||
            data.channel ||
            data.uploader ||
            'Unknown Channel',
          description: data.description || '',
          thumbnail: data.thumbnails?.[0]?.url || '',
          type: 'channel',
        };
      }
    } catch (error) {
      console.error('Failed to get channel info:', error);
      throw error;
    }
  }

  /**
   * YouTube 채널 또는 플레이리스트의 영상 목록 가져오기 (Shorts 제외)
   */
  async getChannelVideos(url: string, limit = 0) {
    const ytDlp = new YTDlp(this.YT_DLP_PATH);

    try {
      const args = [
        url,
        '--flat-playlist',
        '--dump-json',
        '--no-warnings',
        '--extractor-args',
        'youtube:lang=ko',
      ];

      if (limit > 0) {
        args.push(`--playlist-end=${limit}`);
      }

      const metadata = await ytDlp.execPromise(args);

      const lines = metadata.split('\n').filter((line) => line.trim());
      const videos = lines
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter((v) => v);

      const filteredVideos = videos.filter((video) => {
        const isShorts = video.url && video.url.includes('/shorts/');
        const isShortDuration = video.duration && video.duration <= 60;
        return !isShorts && !isShortDuration;
      });

      return filteredVideos.map((video) => ({
        id: video.id,
        title: video.title,
        url: `https://www.youtube.com/watch?v=${video.id}`,
        uploadDate: video.upload_date || null,
        duration: video.duration || null,
      }));
    } catch (error) {
      console.error('Failed to get channel videos:', error);
      throw error;
    }
  }

  /**
   * YouTube 영상의 오디오 추출 및 Supabase 업로드
   */
  async downloadAudio(videoUrl: string, videoId: string): Promise<string> {
    const ytDlp = new YTDlp(this.YT_DLP_PATH);

    if (!fs.existsSync(this.AUDIO_DIR)) {
      fs.mkdirSync(this.AUDIO_DIR, { recursive: true });
    }

    const tempOutputPath = path.join(this.AUDIO_DIR, `${videoId}.mp3`);

    try {
      console.log(`Downloading audio: ${videoId}...`);

      const ffmpegArgs =
        process.env.NODE_ENV === 'production'
          ? []
          : ['--ffmpeg-location', this.FFMPEG_PATH];

      await ytDlp.execPromise([
        videoUrl,
        ...ffmpegArgs,
        '-x',
        '--audio-format',
        'mp3',
        '--audio-quality',
        '0',
        '-o',
        tempOutputPath.replace('.mp3', '.%(ext)s'),
        '--no-warnings',
        '--no-playlist',
      ]);

      console.log(`Audio downloaded: ${videoId}.mp3`);

      console.log(`Uploading to Supabase: ${videoId}...`);
      const storageFileKey = `episodes/${videoId}`;
      const supabaseUrl = await this.supabaseService.uploadToSupabase(
        tempOutputPath,
        storageFileKey,
      );

      console.log(`Uploaded to Supabase: ${supabaseUrl}`);

      if (fs.existsSync(tempOutputPath)) {
        fs.unlinkSync(tempOutputPath);
        console.log(`Temporary file deleted: ${videoId}.mp3`);
      }

      return supabaseUrl;
    } catch (error) {
      if (fs.existsSync(tempOutputPath)) {
        try {
          fs.unlinkSync(tempOutputPath);
          console.log(`Temporary file deleted after error: ${videoId}.mp3`);
        } catch (unlinkError) {
          console.error(
            `Failed to delete temporary file: ${unlinkError.message}`,
          );
        }
      }

      console.error(`Failed to download/upload audio for ${videoId}:`, error);
      throw error;
    }
  }

  /**
   * 파일명 정제
   */
  sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200);
  }
}
