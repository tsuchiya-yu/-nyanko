// Router route patterns (for <Route path=...>)
export const routePatterns = {
  home: '/',
  userProfile: '/profile/:id',
  catProfile: '/cats/:path',
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

// Centralized path builders derived from routePatterns
export const paths = {
  home: () => routePatterns.home,
  catProfile: (profPathId: string) => {
    const path = `/cats/${encodeURIComponent(profPathId)}`;
    console.log('🔗 paths.catProfile called with:', { profPathId, generatedPath: path });
    return path;
  },
  editCat: (catId: string) => routePatterns.editCat.replace(':id', encodeURIComponent(catId)),
  catPhotos: (catId: string) => routePatterns.catPhotos.replace(':id', encodeURIComponent(catId)),
  registerCat: () => routePatterns.registerCat,
  userProfile: (userId: string) =>
    routePatterns.userProfile.replace(':id', encodeURIComponent(userId)),
  columns: () => routePatterns.columns,
  columnDetail: (slug: string) =>
    routePatterns.columnDetail.replace(':slug', encodeURIComponent(slug)),
  news: () => routePatterns.news,
  newsDetail: (slug: string) => routePatterns.newsDetail.replace(':slug', encodeURIComponent(slug)),
  terms: () => routePatterns.terms,
  privacy: () => routePatterns.privacy,
};
