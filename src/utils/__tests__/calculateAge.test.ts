import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { calculateAge } from '../calculateAge';

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
    // 2020年1月1日生まれ → 3歳0ヶ月
    expect(calculateAge('2020-01-01').years).toBe(3);
    expect(calculateAge('2020-01-01').months).toBe(0);
    expect(calculateAge('2020-01-01').toString()).toBe('3歳');

    // 2015年6月15日生まれ → 7歳7ヶ月
    expect(calculateAge('2015-06-15').years).toBe(7);
    expect(calculateAge('2015-06-15').months).toBe(7);
    expect(calculateAge('2015-06-15').toString()).toBe('7歳7ヶ月');

    // 2022年12月31日生まれ → 0歳0ヶ月
    expect(calculateAge('2022-12-31').years).toBe(0);
    expect(calculateAge('2022-12-31').months).toBe(0);
    expect(calculateAge('2022-12-31').toString()).toBe('0歳');
  });

  it('誕生日が今月の場合、誕生日前なら年齢-1、誕生日以降なら年齢をそのまま返すこと', () => {
    // 2020年1月10日生まれ → 3歳0ヶ月（誕生日後）
    expect(calculateAge('2020-01-10').years).toBe(3);
    expect(calculateAge('2020-01-10').months).toBe(0);
    expect(calculateAge('2020-01-10').toString()).toBe('3歳');

    // 2020年1月20日生まれ → 2歳11ヶ月（誕生日前）
    expect(calculateAge('2020-01-20').years).toBe(2);
    expect(calculateAge('2020-01-20').months).toBe(11);
    expect(calculateAge('2020-01-20').toString()).toBe('2歳11ヶ月');
  });

  it('誕生日が未来の日付の場合、正しく計算すること', () => {
    // 2023年2月1日生まれ → これから生まれる
    expect(calculateAge('2023-02-01').years).toBe(-1);
    expect(calculateAge('2023-02-01').months).toBe(11);
    expect(calculateAge('2023-02-01').toString()).toBe('これから生まれる');
  });

  it('日付形式が異なる場合でも正しく計算すること', () => {
    // MM/DD/YYYY形式
    expect(calculateAge('01/01/2020').years).toBe(3);
    expect(calculateAge('01/01/2020').months).toBe(0);
    expect(calculateAge('01/01/2020').toString()).toBe('3歳');

    // YYYY/MM/DD形式
    expect(calculateAge('2020/01/01').years).toBe(3);
    expect(calculateAge('2020/01/01').months).toBe(0);
    expect(calculateAge('2020/01/01').toString()).toBe('3歳');
  });
});
