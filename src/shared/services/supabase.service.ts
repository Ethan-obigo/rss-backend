import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  BUCKET_NAME,
} from '../../common/config/constants';
import { Database } from '../../types/database.types';
import * as fs from 'fs';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient<Database>;

  constructor() {
    this.supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  async uploadToSupabase(
    localFilePath: string,
    storageFileKey: string,
  ): Promise<string> {
    const fileContent = fs.readFileSync(localFilePath);

    const { error } = await this.supabase.storage
      .from(BUCKET_NAME)
      .upload(storageFileKey, fileContent, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (error) {
      console.error('Supabase 업로드 실패:', error);
      throw new Error(`Supabase 업로드 오류: ${error.message}`);
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${storageFileKey}`;

    return publicUrl;
  }

  getClient(): SupabaseClient<Database> {
    return this.supabase;
  }
}
