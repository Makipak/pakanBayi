export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function todayCatatan<T extends { tanggal: Date }>(rows: T[]): T | undefined {
  const today = new Date();
  return rows.find((r) => isSameDay(new Date(r.tanggal), today));
}
