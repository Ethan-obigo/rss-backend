import { Module } from '@nestjs/common';
import { ChannelController } from './channel.controller';
import { PodbbangService } from '../podbbang/podbbang.service';
import { SpotifyService } from '../spotify/spotify.service';
import { ApplePodcastsService } from '../apple-podcasts/apple-podcasts.service';

@Module({
  controllers: [ChannelController],
  providers: [PodbbangService, SpotifyService, ApplePodcastsService],
})
export class ChannelModule {}
