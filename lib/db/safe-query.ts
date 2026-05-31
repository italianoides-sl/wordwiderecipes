function defaultTimeoutMs() {
  const configured = Number(process.env.DB_FALLBACK_TIMEOUT_MS);
  if (Number.isFinite(configured) && configured > 0) return configured;
  return process.env.NODE_ENV === 'development' ? 8000 : 2500;
}

export async function withDbFallback<T>(
  promise: Promise<T>,
  fallback: T,
  label: string,
  timeoutMs = defaultTimeoutMs(),
): Promise<T> {
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
