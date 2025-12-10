export interface PodbbangEpisode {
  id: number;
  title: string;
  description?: string;
  media?: {
    url: string;
  };
  thumbnail?: {
    url: string;
  };
  image?: {
    url: string;
  };
  published_at?: string;
  created_at?: string;
  duration?: number;
}

export interface PodbbangEpisodesResponse {
  data: PodbbangEpisode[];
  summary?: {
    totalCount: number;
  };
}

export interface PodbbangChannelResponse {
  title: string;
  description?: string;
  summary?: string;
  image?: string;
  thumbnail?: {
    url: string;
  };
  mc?: string;
  copyright?: string;
  contacts?: {
    email: string;
  };
}
