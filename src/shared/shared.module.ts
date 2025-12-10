import { Module, Global } from '@nestjs/common';
import { SupabaseService } from './services/supabase.service';
import { ChannelDbService } from './services/channel-db.service';

@Global()
@Module({
  providers: [SupabaseService, ChannelDbService],
  exports: [SupabaseService, ChannelDbService],
})
export class SharedModule {}
