import { describe, it, expect } from 'vitest';
import { chronologicalFromLatest } from './message-query.util.js';

describe('chronologicalFromLatest', () => {
  it('returns rows in ascending createdAt order', () => {
    const rows = [
      { id: '3', createdAt: new Date('2024-01-03') },
      { id: '2', createdAt: new Date('2024-01-02') },
      { id: '1', createdAt: new Date('2024-01-01') },
    ];

    const result = chronologicalFromLatest(rows);

    expect(result.map((r) => r.id)).toEqual(['1', '2', '3']);
  });

  it('does not mutate the input array', () => {
    const rows = [
      { id: '2', createdAt: new Date('2024-01-02') },
      { id: '1', createdAt: new Date('2024-01-01') },
    ];
    const copy = [...rows];

    chronologicalFromLatest(rows);

    expect(rows).toEqual(copy);
  });

  it('returns empty array for empty input', () => {
    expect(chronologicalFromLatest([])).toEqual([]);
  });
});
