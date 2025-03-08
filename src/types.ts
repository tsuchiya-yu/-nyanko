export interface Cat {
  id: string;
  name: string;
  birthdate: string;
  breed: string;
  description: string;
  image_url: string;
  catchphrase: string;
  instagram_url: string | null;
  x_url: string | null;
  homepage_url: string | null;
  owner_id: string;
  gender: string | null;
  is_birthdate_estimated: boolean;
}

export interface Favorite {
  id: string;
  user_id: string;
  cat_id: string;
  created_at: string;
}
