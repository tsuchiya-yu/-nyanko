export function calculateAge(birthdate: string): { years: number; months: number; toString: () => string } {
  const birth = new Date(birthdate);
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  } else if (months === 0 && today.getDate() < birth.getDate()) {
    years--;
    months = 11;
  }

  // 月の経過が1ヶ月未満の場合（前月の同日以降の誕生日）
  if (today.getDate() < birth.getDate() && months === 1) {
    months = 0;
  }

  return {
    years,
    months,
    toString: function() {
      if (this.years < 0 || (this.years === 0 && this.months < 0)) {
        return 'これから生まれる';
      }
      if (this.months === 0) {
        return `${this.years}歳`;
      }
      return `${this.years}歳${this.months}ヶ月`;
    }
  };
}
