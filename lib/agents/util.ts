/** Run `fn` over `items` with at most `limit` in flight. Preserves input order. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

export const AGENT_VERSION = "1.0.0";

/** Keep only ids that exist in `valid`. Models sometimes invent citations; those are dropped, never trusted. */
export function validIds(ids: string[] | undefined, valid: Set<string>): string[] {
  return [...new Set((ids ?? []).filter((id) => valid.has(id)))];
}

export function errMsg(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}
