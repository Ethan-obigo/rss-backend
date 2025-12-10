import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ChannelDbService } from '../../shared/services/channel-db.service';
import { YoutubeService } from './youtube.service';
import { PodbbangService } from '../podbbang/podbbang.service';
import { SpotifyService } from '../spotify/spotify.service';

@Controller('api')
export class ChannelController {
  constructor(
    private readonly channelDbService: ChannelDbService,
    private readonly youtubeService: YoutubeService,
    private readonly podbbangService: PodbbangService,
    private readonly spotifyService: SpotifyService,
  ) {}

  @Get('health')
  async health() {
    try {
      const channels = await this.channelDbService.getAllChannels();
      return {
        status: 'ok',
        message: 'YouTube RSS Maker is running',
        channels: channels.length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('channels')
  async getChannels() {
    try {
      const channels = await this.channelDbService.getAllChannels();
      return { channels };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('channel')
  async addChannel(@Body() body: { channelUrl: string; limit?: number }) {
    const { channelUrl, limit = 0 } = body;

    if (!channelUrl) {
      throw new HttpException('channelUrl is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const channelInfo = await this.youtubeService.getChannelInfo(channelUrl);
      const videos = await this.youtubeService.getChannelVideos(
        channelUrl,
        limit,
      );

      if (videos.length === 0) {
        throw new HttpException('No videos found', HttpStatus.NOT_FOUND);
      }

      const channelId =
        channelInfo.type === 'playlist'
          ? `playlist_${channelInfo.id}`
          : channelInfo.id;

      const channel = await this.channelDbService.addChannel({
        id: channelId,
        title: channelInfo.title,
        url: channelUrl,
        description: channelInfo.description || '',
        thumbnail: channelInfo.thumbnail || '',
        type: channelInfo.type || 'channel',
        language: 'ko',
      });

      await this.channelDbService.updateChannelVideos(channelId, videos);

      return {
        success: true,
        channel,
        videos: videos.length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('download/:channelId')
  async downloadGet(@Param('channelId') channelId: string) {
    return this.downloadHandler(channelId);
  }

  @Post('download/:channelId')
  async downloadPost(@Param('channelId') channelId: string) {
    return this.downloadHandler(channelId);
  }

  private async downloadHandler(channelId: string) {
    try {
      const channel = await this.channelDbService.getChannel(channelId);

      if (!channel) {
        throw new HttpException(
          '채널이 존재하지 않습니다.',
          HttpStatus.NOT_FOUND,
        );
      }

      const results: Array<
        | { videoId: string; success: true; path: string }
        | { videoId: string; success: false; error: string }
      > = [];

      for (const video of channel.videos) {
        try {
          const audioPath = await this.youtubeService.downloadAudio(
            video.url,
            video.id,
          );
          results.push({ videoId: video.id, success: true, path: audioPath });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          results.push({
            videoId: video.id,
            success: false,
            error: errorMessage,
          });
        }
      }

      const updatedVideos = channel.videos.map((video) => {
        const result = results.find((r) => r.videoId === video.id && r.success);
        if (result && result.success) {
          return { ...video, audioPath: result.path };
        }
        return video;
      });

      await this.channelDbService.updateChannelVideos(channelId, updatedVideos);

      return {
        success: true,
        downloaded: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      };
    } catch (error) {
      console.error('Error downloading audio:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete('channel/:channelId')
  async deleteChannel(@Param('channelId') channelId: string) {
    try {
      const channel = await this.channelDbService.getChannel(channelId);
      if (!channel) {
        throw new HttpException('Channel not found', HttpStatus.NOT_FOUND);
      }

      await this.channelDbService.deleteChannel(channelId);
      return { success: true, message: 'Channel deleted successfully' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('podbbang/channel')
  async addPodbbangChannel(@Body() body: { channelId: string }) {
    const { channelId } = body;

    if (!channelId) {
      throw new HttpException('channelId is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const { channelInfo, episodes } =
        await this.podbbangService.fetchPodbbangChannel(channelId);

      const channelData = {
        ...channelInfo,
        id: `podbbang_${channelId}`,
        type: 'podbbang',
      };

      const channel = await this.channelDbService.addChannel(channelData);

      await this.channelDbService.updateChannelVideos(
        `podbbang_${channelId}`,
        episodes,
      );

      return {
        success: true,
        channel,
        episodes: episodes.length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('podbbang/update/:channelId')
  async updatePodbbangChannel(@Param('channelId') channelId: string) {
    const fullChannelId = `podbbang_${channelId}`;

    try {
      const channel = await this.channelDbService.getChannel(fullChannelId);

      if (!channel) {
        throw new HttpException(
          '채널이 존재하지 않습니다.',
          HttpStatus.NOT_FOUND,
        );
      }

      const episodes =
        await this.podbbangService.updatePodbbangChannel(channelId);
      await this.channelDbService.updateChannelVideos(fullChannelId, episodes);

      return {
        success: true,
        updated: episodes.length,
      };
    } catch (error) {
      console.error('Error updating Podbbang channel:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('spotify/show')
  async addSpotifyShow(@Body() body: { showUrl: string }) {
    const { showUrl } = body;

    if (!showUrl) {
      throw new HttpException('showUrl is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const { channelInfo, episodes } =
        await this.spotifyService.fetchSpotifyShow(showUrl);

      const channelData = {
        ...channelInfo,
        id: `spotify_${channelInfo.id}`,
        type: 'spotify',
      };

      const channel = await this.channelDbService.addChannel(channelData);
      await this.channelDbService.updateChannelVideos(
        `spotify_${channelInfo.id}`,
        episodes,
      );

      return {
        success: true,
        channel,
        episodes: episodes.length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('spotify/update/:showId')
  async updateSpotifyShow(@Param('showId') showId: string) {
    const fullChannelId = `spotify_${showId}`;

    try {
      const channel = await this.channelDbService.getChannel(fullChannelId);

      if (!channel) {
        throw new HttpException(
          '채널이 존재하지 않습니다.',
          HttpStatus.NOT_FOUND,
        );
      }

      const showUrl = `https://open.spotify.com/show/${showId}`;
      const episodes = await this.spotifyService.updateSpotifyShow(showUrl);
      await this.channelDbService.updateChannelVideos(fullChannelId, episodes);

      return {
        success: true,
        updated: episodes.length,
      };
    } catch (error) {
      console.error('Error updating Spotify show:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
