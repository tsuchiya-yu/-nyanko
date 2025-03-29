import { describe, it, expect, beforeAll } from 'vitest';
import { stripHtml } from '../html';

describe('stripHtml関数', () => {
  beforeAll(() => {
    // DOMの環境をセットアップ
    document.body.innerHTML = '<div id="test"></div>';
  });

  it('HTMLタグを除去してテキストのみを返すこと', () => {
    // 基本的なケース
    expect(stripHtml('<p>テスト</p>')).toBe('テスト');
    
    // 複雑なHTML
    expect(stripHtml('<div><h1>タイトル</h1><p>段落<strong>太字</strong></p></div>'))
      .toBe('タイトル段落太字');
    
    // 属性を含むHTML
    expect(stripHtml('<a href="https://example.com">リンク</a>'))
      .toBe('リンク');
    
    // ネストされたタグ
    expect(stripHtml('<ul><li>項目1</li><li>項目2</li></ul>'))
      .toBe('項目1項目2');
  });

  it('空のHTML文字列を処理できること', () => {
    expect(stripHtml('')).toBe('');
  });

  it('HTMLタグがない場合はそのまま返すこと', () => {
    expect(stripHtml('プレーンテキスト')).toBe('プレーンテキスト');
  });

  it('特殊文字を含むHTMLを処理できること', () => {
    expect(stripHtml('<p>&lt;div&gt; &amp; &quot;引用&quot;</p>'))
      .toBe('<div> & "引用"');
  });
}); 