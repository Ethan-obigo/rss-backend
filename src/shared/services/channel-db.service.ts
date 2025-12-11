import { Injectable } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import {
  ChannelInsert,
  ChannelUpdate,
  ChannelRow,
} from '../../types/database.types';
import type { Json } from '../../types/database.types';

export interface Channel {
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
  type: string;
  addedAt: string;
  lastUpdate?: string;
  videos: Video[];
  description?: string;
  summary?: string;
  author?: string;
  copyright?: string;
  owner?: {
    name: string;
    email: string;
  };
  language: string;
}

export interface Video {
  id: string;
  title: string;
  description?: string;
  url: string;
  audioPath?: string;
  audioSize?: number;
  thumbnail?: string;
  uploadDate?: string;
  publishedAt?: string;
  duration?: number | null;
}

@Injectable()
export class ChannelDbService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * 채널 추가
   */
  async addChannel(
    channel: Omit<ChannelInsert, 'added_at' | 'last_update'>,
  ): Promise<Channel> {
    const supabase = this.supabaseService.getClient();

    const { data: existing } = await supabase
      .from('channels')
      .select('*')
      .eq('id', channel.id)
      .single();

    if (existing) {
      return this.formatChannel(existing);
    }

    const newChannel: ChannelInsert = {
      id: channel.id,
      title: channel.title,
      url: channel.url,
      thumbnail: channel.thumbnail || null,
      type: channel.type || 'youtube',
      videos: (channel.videos || []) as unknown as Json,
      description: channel.description || null,
      summary: channel.summary || null,
      author: channel.author || null,
      copyright: channel.copyright || null,
      owner: (channel.owner || null) as unknown as Json,
      language: channel.language || 'ko',
      added_at: new Date().toISOString(),
      last_update: null,
    };

    const { data, error } = await supabase
      .from('channels')
      .insert([newChannel])
      .select()
      .single();

    if (error) {
      console.error('Failed to add channel:', error);
      throw new Error(error.message);
    }

    return this.formatChannel(data);
  }

  /**
   * 모든 채널 가져오기
   */
  async getAllChannels(): Promise<Channel[]> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .order('added_at', { ascending: false });

    if (error) {
      console.error('Failed to get channels:', error);
      throw new Error(error.message);
    }

    return data.map((channel) => this.formatChannel(channel));
  }

  /**
   * 특정 채널 가져오기
   */
  async getChannel(channelId: string): Promise<Channel | null> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .eq('id', channelId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Failed to get channel:', error);
      throw new Error(error.message);
    }

    return this.formatChannel(data);
  }

  /**
   * 채널 영상 목록 업데이트
   */
  async updateChannelVideos(
    channelId: string,
    videos: Video[],
  ): Promise<Channel> {
    const supabase = this.supabaseService.getClient();

    const updateData: ChannelUpdate = {
      videos: videos as unknown as Json,
      last_update: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('channels')
      .update(updateData)
      .eq('id', channelId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update channel videos:', error);
      throw new Error(error.message);
    }

    return this.formatChannel(data);
  }

  /**
   * 채널 삭제
   */
  async deleteChannel(channelId: string): Promise<boolean> {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('channels')
      .delete()
      .eq('id', channelId);

    if (error) {
      console.error('Failed to delete channel:', error);
      throw new Error(error.message);
    }

    return true;
  }

  /**
   * DB 데이터를 기존 형식으로 변환
   */
  private formatChannel(data: ChannelRow): Channel {
    return {
      id: data.id,
      title: data.title,
      url: data.url,
      thumbnail: data.thumbnail || undefined,
      type: data.type,
      addedAt: data.added_at,
      lastUpdate: data.last_update || undefined,
      videos: (data.videos as unknown as Video[]) || [],
      description: data.description || undefined,
      summary: data.summary || undefined,
      author: data.author || undefined,
      copyright: data.copyright || undefined,
      owner: data.owner as unknown as Channel['owner'],
      language: data.language,
    };
  }
}
