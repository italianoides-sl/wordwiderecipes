import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { eq } from 'drizzle-orm';
import { affiliateProducts, db } from '@/lib/db/schema';

type AsinRow = {
  name?: string;
  asin_es?: string;
  asin_mx?: string;
  asin_global?: string;
  asin_br?: string;
};

const CSV_PATH = 'data/asins.csv';

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = '';
  let quoted = false;

  for (const char of line) {
    if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells.map((cell) => cell.replace(/^"|"$/g, ''));
}

function parseCsv(input: string): AsinRow[] {
  const [headerLine, ...lines] = input.split(/\r?\n/).filter((line) => line.trim());
  if (!headerLine) return [];

  const headers = parseCsvLine(headerLine);
  return lines.map((line) => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] || undefined])) as AsinRow;
  });
}

async function main() {
  if (!existsSync(CSV_PATH)) {
    console.log(`No ${CSV_PATH} file found. Create it with columns: name,asin_es,asin_mx,asin_global,asin_br`);
    return;
  }

  const rows = parseCsv(await readFile(CSV_PATH, 'utf8'));
  let updated = 0;

  for (const row of rows) {
    if (!row.name) continue;

    const result = await db
      .update(affiliateProducts)
      .set({
        asinEs: row.asin_es,
        asinMx: row.asin_mx,
        asinGlobal: row.asin_global,
        asinBr: row.asin_br,
      })
      .where(eq(affiliateProducts.name, row.name))
      .returning({ id: affiliateProducts.id });

    updated += result.length;
  }

  console.log(`Updated ${updated} affiliate products from ${CSV_PATH}.`);
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
