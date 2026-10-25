/** "1 ngày 17 giờ", "2 giờ 5 phút", "12 phút" — the two largest units that matter. */
export function formatSpan(ms: number): string {
  const totalMinutes = Math.max(1, Math.floor(Math.abs(ms) / 60_000));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return hours > 0 ? `${days} ngày ${hours} giờ` : `${days} ngày`;
  if (hours > 0) return minutes > 0 ? `${hours} giờ ${minutes} phút` : `${hours} giờ`;
  return `${minutes} phút`;
}
