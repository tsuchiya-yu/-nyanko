export interface Cat {
  id: string;
  created_at: string;
  name: string;
  birthdate: string;
  is_birthdate_estimated: boolean;
  breed: string;
  catchphrase?: string | null;
  description: string;
  image_url: string;
  instagram_url?: string | null;
  youtube_url?: string | null;
  tiktok_url?: string | null;
  x_url?: string | null;
  homepage_url?: string | null;
  owner_id: string;
  gender?: string | null;
  background_color?: string;
  text_color?: string;
  prof_path_id: string;
  is_public: boolean;
}

export interface Favorite {
  id: string;
  user_id: string;
  cat_id: string;
  created_at: string;
}
