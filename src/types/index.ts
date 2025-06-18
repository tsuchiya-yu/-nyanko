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
  is_public?: boolean;
}

export interface Owner {
  id: string;
  name: string;
  cats: Cat[];
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface News {
  id: string;
  title: string;
  content: string;
  published_at: string;
  slug: string;
  is_published: boolean;
}

export interface Column {
  id: string;
  slug: string;
  title: string;
  content: string;
  image_url: string | null;
  published_at: string;
}
