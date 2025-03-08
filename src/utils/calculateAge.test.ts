import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateAge } from './calculateAge';

describe('calculateAge関数', () => {
  // 現在の日付をモック
  beforeEach(() => {
    // 2023年1月15日に固定
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2023, 0, 15));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('誕生日から年齢を正しく計算すること', () => {
    // 2020年1月1日生まれ → 3歳
    expect(calculateAge('2020-01-01')).toBe(3);
    
    // 2015年6月15日生まれ → 7歳
    expect(calculateAge('2015-06-15')).toBe(7);
    
    // 2022年12月31日生まれ → 0歳
    expect(calculateAge('2022-12-31')).toBe(0);
  });

  it('誕生日が今月の場合、誕生日前なら年齢-1、誕生日以降なら年齢をそのまま返すこと', () => {
    // 2020年1月10日生まれ → 3歳（誕生日後）
    expect(calculateAge('2020-01-10')).toBe(3);
    
    // 2020年1月20日生まれ → 2歳（誕生日前）
    expect(calculateAge('2020-01-20')).toBe(2);
  });

  it('誕生日が未来の日付の場合、正しく計算すること', () => {
    // 2023年2月1日生まれ → -1歳（未来の日付）
    expect(calculateAge('2023-02-01')).toBe(-1);
  });

  it('日付形式が異なる場合でも正しく計算すること', () => {
    // MM/DD/YYYY形式
    expect(calculateAge('01/01/2020')).toBe(3);
    
    // YYYY/MM/DD形式
    expect(calculateAge('2020/01/01')).toBe(3);
  });
}); 