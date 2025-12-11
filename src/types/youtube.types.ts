export interface VideoInfo {
  videoId: string;
  title: string;
  description: string | null;
  thumbnail: string;
  author: string;
  publishedAt: string;
  audioUrl: string;
  audioSize?: number;
  duration: number;
}
