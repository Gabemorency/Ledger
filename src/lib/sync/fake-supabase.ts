/** Minimal in-memory stand-in for the parts of the Supabase client the sync uses. */
type Row = Record<string, unknown>;

export function fakeSupabase(userId: string) {
  const tables: Record<string, Map<string, Row>> = {};
  const calls: string[] = [];
  let failNext = 0;
  const t = (name: string) => (tables[name] ||= new Map());
  const keyOf = (name: string, r: Row) => (name === "settings" ? String(r.user_id) : `${r.user_id}|${r.id}`);
  const fail = () => (failNext > 0 ? (failNext--, { message: "network down" }) : null);

  const from = (name: string) => ({
    upsert(rows: Row | Row[]) {
      calls.push(`upsert ${name}`);
      const error = fail();
      if (!error) for (const r of ([] as Row[]).concat(rows)) t(name).set(keyOf(name, r), { ...r });
      return Promise.resolve({ error });
    },
    update(patch: Row) {
      return {
        eq(col: string, v: unknown) {
          calls.push(`update ${name}`);
          const error = fail();
          if (!error) for (const r of t(name).values()) if (r[col] === v) Object.assign(r, patch);
          return Promise.resolve({ error });
        },
      };
    },
    delete() {
      const filters: [string, unknown][] = [];
      const q = {
        eq(col: string, v: unknown) {
          filters.push([col, v]);
          return q;
        },
        in(col: string, vs: unknown[]) {
          calls.push(`delete ${name}`);
          const error = fail();
          if (!error)
            for (const [k, r] of t(name))
              if (filters.every(([c, v]) => r[c] === v) && vs.includes(r[col])) t(name).delete(k);
          return Promise.resolve({ error });
        },
      };
      return q;
    },
    select() {
      const mine = () => [...t(name).values()].filter((r) => r.user_id === userId);
      const q = {
        order: () => q,
        range: (a: number, b: number) =>
          Promise.resolve({
            data: mine()
              .sort((x, y) => String(x.id).localeCompare(String(y.id)))
              .slice(a, b + 1),
            error: null,
          }),
        maybeSingle: () => Promise.resolve({ data: mine()[0] ?? null, error: null }),
      };
      return q;
    },
  });

  return {
    client: { from } as never,
    tables,
    calls,
    failTimes: (n: number) => (failNext = n),
  };
}
