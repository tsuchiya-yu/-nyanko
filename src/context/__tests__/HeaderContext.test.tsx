import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { HeaderProvider, useHeaderFooter } from './HeaderContext';

// テスト用のコンポーネント
const TestComponent = () => {
  const { isHeaderFooterVisible, setHeaderFooterVisible } = useHeaderFooter();

  return (
    <div>
      <div data-testid="visibility-status">{isHeaderFooterVisible ? 'visible' : 'hidden'}</div>
      <button onClick={() => setHeaderFooterVisible(true)} data-testid="show-button">
        表示する
      </button>
      <button onClick={() => setHeaderFooterVisible(false)} data-testid="hide-button">
        非表示にする
      </button>
    </div>
  );
};

describe('HeaderContext', () => {
  it('HeaderProviderが子コンポーネントをレンダリングすること', () => {
    render(
      <HeaderProvider>
        <div data-testid="child">テスト</div>
      </HeaderProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('テスト')).toBeInTheDocument();
  });

  it('デフォルトでisHeaderFooterVisibleがtrueであること', () => {
    render(
      <HeaderProvider>
        <TestComponent />
      </HeaderProvider>
    );

    expect(screen.getByTestId('visibility-status')).toHaveTextContent('visible');
  });

  it('setHeaderFooterVisibleでヘッダーとフッターの表示状態を変更できること', () => {
    render(
      <HeaderProvider>
        <TestComponent />
      </HeaderProvider>
    );

    // 初期状態は表示
    expect(screen.getByTestId('visibility-status')).toHaveTextContent('visible');

    // 非表示にする
    fireEvent.click(screen.getByTestId('hide-button'));
    expect(screen.getByTestId('visibility-status')).toHaveTextContent('hidden');

    // 再表示する
    fireEvent.click(screen.getByTestId('show-button'));
    expect(screen.getByTestId('visibility-status')).toHaveTextContent('visible');
  });

  it('HeaderProvider外でuseHeaderFooterを使用するとエラーが発生すること', () => {
    // コンソールエラーを抑制
    const consoleError = console.error;
    console.error = vi.fn();

    // エラーをキャッチするためにtry-catchを使用
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useHeaderFooter must be used within a HeaderProvider');

    // コンソールエラーを元に戻す
    console.error = consoleError;
  });
});
