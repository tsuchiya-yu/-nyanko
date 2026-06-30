import {
  createCatProfileMetadata,
  createFallbackCatMetadata,
  createMissingCatMetadata,
  injectRouteMetadata,
} from '../catProfileMetadata';

const htmlShell = `<!doctype html>
<html>
  <head>
    <!-- ROUTE_META_START -->
    <title>Default title</title>
    <!-- ROUTE_META_END -->
  </head>
  <body><div id="root"></div></body>
</html>`;

describe('catProfileMetadata', () => {
  it('creates escaped metadata for a public cat profile', () => {
    const metadata = createCatProfileMetadata(
      {
        name: 'ミケ <script>',
        catchphrase: '元気な "猫"',
        description: '毎日楽しく暮らしています。',
        image_url: 'https://example.com/cat image.jpg',
        prof_path_id: 'mike_cat',
      },
      'https://cat-link.catnote.tokyo'
    );

    expect(metadata).toContain('<title data-rh="true">ミケ &lt;script&gt;のプロフィール');
    expect(metadata).toContain('元気な &quot;猫&quot; 毎日楽しく暮らしています。');
    expect(metadata).toContain('content="https://example.com/cat%20image.jpg"');
    expect(metadata).toContain('href="https://cat-link.catnote.tokyo/cats/mike_cat"');
    expect(metadata).toContain('<meta data-rh="true" property="og:type" content="profile" />');
    expect(metadata).toContain(
      '<meta data-rh="true" name="twitter:site" content="@catnote_tokyo" />'
    );
  });

  it('uses the default OGP image when the profile image is unsafe', () => {
    const metadata = createCatProfileMetadata(
      {
        name: 'ミケ',
        catchphrase: null,
        description: '',
        image_url: 'javascript:alert(1)',
        prof_path_id: 'mike',
      },
      'https://cat-link.catnote.tokyo'
    );

    expect(metadata).toContain('https://cat-link.catnote.tokyo/images/ogp.png');
    expect(metadata).not.toContain('javascript:');
  });

  it('replaces only the marked metadata block', () => {
    const metadata = createMissingCatMetadata(
      'https://cat-link.catnote.tokyo/cats/missing',
      'https://cat-link.catnote.tokyo'
    );
    const html = injectRouteMetadata(htmlShell, metadata);

    expect(html).toContain('猫プロフィールが見つかりません');
    expect(html).toContain('content="noindex, nofollow"');
    expect(html).not.toContain('Default title');
    expect(html).toContain('<body><div id="root"></div></body>');
  });

  it('keeps the requested URL when profile data is temporarily unavailable', () => {
    const metadata = createFallbackCatMetadata(
      'https://cat-link.catnote.tokyo/cats/tsukushi',
      'https://cat-link.catnote.tokyo'
    );

    expect(metadata).toContain('href="https://cat-link.catnote.tokyo/cats/tsukushi"');
    expect(metadata).toContain('content="index, follow"');
    expect(metadata).toContain('https://cat-link.catnote.tokyo/images/ogp.png');
  });

  it('throws when the HTML shell does not contain metadata markers', () => {
    expect(() => injectRouteMetadata('<html></html>', 'metadata')).toThrow(
      'Route metadata markers were not found'
    );
  });
});
