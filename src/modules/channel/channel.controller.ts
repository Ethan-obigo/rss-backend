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
import { PodbbangService } from '../podbbang/podbbang.service';
import { SpotifyService } from '../spotify/spotify.service';

@Controller('')
export class ChannelController {
  constructor(
    private readonly channelDbService: ChannelDbService,
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
        category: null,
        content_type: null,
        publisher: channelInfo.author,
        host: channelInfo.author,
        tags: [],
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
        category: null,
        content_type: null,
        publisher: channelInfo.author,
        host: channelInfo.author,
        tags: [],
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
