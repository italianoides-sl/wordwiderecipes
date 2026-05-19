export async function withDbFallback<T>(promise: Promise<T>, fallback: T, label: string, timeoutMs = 1200): Promise<T> {
  let settled = false;

  const guarded = promise
    .then((value) => {
      settled = true;
      return value;
    })
    .catch((error) => {
      settled = true;
      console.error(`${label} fallback used`, error);
      return fallback;
    });

  return Promise.race([
    guarded,
    new Promise<T>((resolve) => {
      setTimeout(() => {
        if (!settled) console.error(`${label} fallback used: database query timed out`);
        resolve(fallback);
      }, timeoutMs);
    }),
  ]);
}
