// Return human readable time based on requirement:
// - within 1 week: relative time (e.g., "5分前", "3時間前", "2日前")
// - 1 week or more: absolute date (YYYY/MM/DD HH:mm)
export function formatDiaryTime(iso: string): string {
  const now = new Date();
  const d = new Date(iso);
  const diffMs = now.getTime() - d.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  if (diffMs < week) {
    if (diffMs < minute) return 'たった今';
    if (diffMs < hour) return `${Math.floor(diffMs / minute)}分前`;
    if (diffMs < day) return `${Math.floor(diffMs / hour)}時間前`;
    return `${Math.floor(diffMs / day)}日前`;
  }

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd} ${hh}:${mi}`;
}

