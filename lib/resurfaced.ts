const WINDOW_RADIUS_DAYS = 3;

export type ResurfacedWindow = {
  label: "1 year ago" | "6 months ago" | "3 months ago";
  start: Date;
  end: Date;
  centerDaysAgo: number;
};

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function shiftMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function daysBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
}

export function getResurfacedWindows(now: Date): ResurfacedWindow[] {
  const centers: { label: ResurfacedWindow["label"]; center: Date }[] = [
    { label: "1 year ago", center: shiftMonths(now, -12) },
    { label: "6 months ago", center: shiftMonths(now, -6) },
    { label: "3 months ago", center: shiftMonths(now, -3) },
  ];

  return centers.map(({ label, center }) => ({
    label,
    start: addDays(center, -WINDOW_RADIUS_DAYS),
    end: addDays(center, WINDOW_RADIUS_DAYS),
    centerDaysAgo: daysBetween(now, center),
  }));
}

export function labelForResurfacedDate(
  createdAt: string,
  now: Date = new Date(),
): ResurfacedWindow["label"] {
  const created = new Date(createdAt);
  const windows = getResurfacedWindows(now);

  let best = windows[0];
  let bestDist = Math.abs(daysBetween(created, now) - best.centerDaysAgo);

  for (const w of windows.slice(1)) {
    const dist = Math.abs(daysBetween(created, now) - w.centerDaysAgo);
    if (dist < bestDist) {
      best = w;
      bestDist = dist;
    }
  }

  return best.label;
}
