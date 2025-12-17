import { Module } from '@nestjs/common';
import { ApplePodcastsService } from './apple-podcasts.service';
import { SpotifyModule } from '../spotify/spotify.module';

@Module({
  imports: [SpotifyModule],
  providers: [ApplePodcastsService],
  exports: [ApplePodcastsService],
})
export class ApplePodcastsModule {}
