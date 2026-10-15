/**
 * What a partner on an internal tier reads instead of a progress bar
 * (doitac-1410 #024): the tier is negotiated, not earned by revenue.
 */
export function internalTierNote(tierName: string): string {
  return `Hạng ${tierName} dành riêng cho đối tác chiến lược, có quyền lợi cao nhất và nằm ngoài chương trình xếp hạng theo doanh số. Quyền lợi áp dụng theo thỏa thuận hợp tác giữa bạn và esim.vn.`;
}
