/** MB from what is stored: 2048, or "3GB" / "500MB" on older rows. */
function storedMb(value: string | number | null | undefined): number {
  const match = String(value ?? '').match(/^\s*([\d.]+)\s*(gb|mb)?\s*$/i);
  if (!match) return 0;
  const n = Number(match[1]);
  return match[2]?.toLowerCase() === 'gb' ? n * 1024 : n;
}

function roundedSize(mb: number): string {
  if (mb >= 1024) return `${parseFloat((mb / 1024).toFixed(2))} GB`;
  return `${Math.round(mb)} MB`;
}

type EsimData = {
  dataUsed?: string | number | null;
  dataTotal?: string | number | null;
  addedDataMb?: number | null;
  plan?: { dataMb?: number | string | null } | null;
};

/** The supplier's total, never below the plan and its top-ups; 0 = no limit. */
export function esimTotalMb(esim: EsimData): number {
  const planMb = Number(esim.plan?.dataMb) || 0;
  return Math.max(storedMb(esim.dataTotal), planMb + (esim.addedDataMb ?? 0));
}

/** "24 MB / 2 GB": used of the plan and what top-ups added (vande-0411 #047). */
export function esimDataLabel(esim: EsimData): string {
  const total = esimTotalMb(esim);
  const used = roundedSize(storedMb(esim.dataUsed));
  return total > 0 ? `${used} / ${roundedSize(total)}` : `${used} / Không giới hạn`;
}
