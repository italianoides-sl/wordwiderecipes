export type GoogleServiceAccountCredentials = {
  client_email?: string;
  private_key?: string;
  [key: string]: unknown;
};

function stripWrappingQuotes(value: string) {
  const trimmed = value.trim();
  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];

  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function extractFirstJsonObject(value: string) {
  const start = value.indexOf('{');
  if (start === -1) return value;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < value.length; index += 1) {
    const char = value[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return value.slice(start, index + 1);
    }
  }

  return value;
}

export function getGoogleServiceAccountCredentials(): GoogleServiceAccountCredentials | null {
  const rawCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!rawCredentials) return null;

  const normalized = extractFirstJsonObject(stripWrappingQuotes(rawCredentials));
  const credentials = JSON.parse(normalized) as GoogleServiceAccountCredentials;

  if (typeof credentials.private_key === 'string') {
    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
  }

  return credentials;
}
