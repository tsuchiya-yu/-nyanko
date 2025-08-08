export const paths = {
  home: () => '/',
  catProfile: (catId: string) => `/cats/${catId}`,
  editCat: (catId: string) => `/cats/${catId}/edit`,
  catPhotos: (catId: string) => `/cats/${catId}/photos`,
  registerCat: () => '/register-cat',
  userProfile: (userId: string) => `/profile/${userId}`,
  columns: () => '/columns',
  columnDetail: (slug: string) => `/columns/${slug}`,
  news: () => '/news',
  newsDetail: (slug: string) => `/news/${slug}`,
  terms: () => '/terms',
  privacy: () => '/privacy',
};
