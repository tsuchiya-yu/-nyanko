export interface CatDiary {
  id: string;
  cat_id: string;
  content: string;
  image_urls: string[] | null;
  created_at: string; // ISO string
  updated_at: string; // ISO string
}

export interface LatestDiaryItem extends CatDiary {
  cats?: {
    id: string;
    name: string;
    prof_path_id: string;
    image_url: string;
  } | null;
}

