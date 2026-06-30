import handler from './cat-profile';

const htmlShell = `<!doctype html>
<html>
  <head>
    <!-- ROUTE_META_START -->
    <title>ねこプロフィール</title>
    <!-- ROUTE_META_END -->
  </head>
  <body><div id="root"></div></body>
</html>`;

describe('cat profile OGP function', () => {
  const originalSiteUrl = process.env.VITE_SITE_URL;
  const originalSupabaseUrl = process.env.VITE_SUPABASE_URL;
  const originalSupabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  beforeEach(() => {
    process.env.VITE_SITE_URL = 'https://cat-link.catnote.tokyo';
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'public-anon-key';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.VITE_SITE_URL = originalSiteUrl;
    process.env.VITE_SUPABASE_URL = originalSupabaseUrl;
    process.env.VITE_SUPABASE_ANON_KEY = originalSupabaseKey;
  });

  it('returns cat-specific metadata for a public cat', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(htmlShell, { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              name: 'つくし',
              catchphrase: '元気いっぱい',
              description: 'つくしの毎日です。',
              image_url: 'https://example.com/tsukushi.jpg',
              prof_path_id: 'tsukushi',
            },
          ]),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      );

    const response = await handler(
      new Request('https://cat-link.catnote.tokyo/api/cat-profile?path=tsukushi')
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('<title data-rh="true">つくしのプロフィール | ねこプロフィール</title>');
    expect(html).toContain(
      '<meta data-rh="true" property="og:image" content="https://example.com/tsukushi.jpg" />'
    );
    expect(html).toContain(
      '<meta data-rh="true" name="twitter:title" content="つくしのプロフィール'
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0].toString()).toContain('is_public=eq.true');
  });

  it('does not expose metadata for a missing or private cat', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(htmlShell, { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      );

    const response = await handler(
      new Request('https://cat-link.catnote.tokyo/api/cat-profile?path=private_cat')
    );
    const html = await response.text();

    expect(response.status).toBe(404);
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect(html).toContain('指定された猫プロフィールは存在しないか、非公開');
    expect(html).not.toContain('private cat name');
  });

  it('keeps the SPA shell available when Supabase metadata fetching fails', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(htmlShell, { status: 200 }))
      .mockResolvedValueOnce(new Response('upstream error', { status: 500 }));

    const response = await handler(
      new Request('https://cat-link.catnote.tokyo/api/cat-profile?path=tsukushi')
    );

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('<title data-rh="true">猫プロフィール | ねこプロフィール</title>');
    expect(html).toContain('href="https://cat-link.catnote.tokyo/cats/tsukushi"');
  });
});
