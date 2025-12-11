// backend/src/modules/youtube/youtube.controller.ts
import {
  Controller,
  Post,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { YoutubeService } from './youtube.service';

@Controller('youtube')
export class YoutubeController {
  private readonly BASE_URL: string;

  constructor(private readonly youtubeService: YoutubeService) {
    const port = process.env.PORT || '3000';
    this.BASE_URL = process.env.BASE_URL || `http://localhost:${port}`;
  }

  @Post('process')
  async processUrl(@Body('url') url: string) {
    const rssUrl = await this.youtubeService.processAndSave(url, this.BASE_URL);
    return { rssUrl };
  }

  @Post('update/:channelId')
  async updateChannel(
    @Param('channelId') channelId: string,
    @Body('url') url: string,
  ) {
    try {
      if (!url) {
        throw new HttpException('url is required', HttpStatus.BAD_REQUEST);
      }

      const updated = await this.youtubeService.updateChannel(channelId, url);
      return {
        success: true,
        updated: updated.newEpisodes,
        total: updated.totalEpisodes,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
