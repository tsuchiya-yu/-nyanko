export interface Cat {
  id: string;
  created_at: string;
  name: string;
  age: number;
  breed: string;
  description: string;
  image_url: string;
  owner_id: string;
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
