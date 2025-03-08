export interface Cat {
  id: string;
  name: string;
  age: number;
  breed: string;
  description: string;
  imageUrl: string;
  ownerId: string;
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
