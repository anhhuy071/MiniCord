export function chronologicalFromLatest<T extends { createdAt: Date }>(rows: T[]): T[] {
  return [...rows].reverse();
}
