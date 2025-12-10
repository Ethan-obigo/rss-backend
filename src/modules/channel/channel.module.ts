import { Module } from '@nestjs/common';
import { ChannelController } from './channel.controller';
import { YoutubeService } from './youtube.service';
import { PodbbangService } from '../podbbang/podbbang.service';
import { SpotifyService } from '../spotify/spotify.service';

@Module({
  controllers: [ChannelController],
  providers: [YoutubeService, PodbbangService, SpotifyService],
})
export class ChannelModule {}
