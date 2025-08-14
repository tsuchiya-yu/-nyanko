export const paths = {
  home: () => '/',
  catProfile: (catId: string) => `/cats/${encodeURIComponent(catId)}`,
  editCat: (catId: string) => `/cats/${encodeURIComponent(catId)}/edit`,
  catPhotos: (catId: string) => `/cats/${encodeURIComponent(catId)}/photos`,
  registerCat: () => '/register-cat',
  userProfile: (userId: string) => `/profile/${encodeURIComponent(userId)}`,
  columns: () => '/columns',
  columnDetail: (slug: string) => `/columns/${encodeURIComponent(slug)}`,
  news: () => '/news',
  newsDetail: (slug: string) => `/news/${encodeURIComponent(slug)}`,
  terms: () => '/terms',
  privacy: () => '/privacy',
};

// Router route patterns (for <Route path=...>)
export const routePatterns = {
  home: '/',
  userProfile: '/profile/:id',
  catProfile: '/cats/:id',
  editCat: '/cats/:id/edit',
  catPhotos: '/cats/:id/photos',
  registerCat: '/register-cat',
  columns: '/columns',
  columnDetail: '/columns/:slug',
  news: '/news',
  newsDetail: '/news/:slug',
  terms: '/terms',
  privacy: '/privacy',
} as const;
