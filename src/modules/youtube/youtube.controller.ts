// backend/src/modules/youtube/youtube.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
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
}
