export type WebWord = { id: string; word: string; reading: string; meanings: string[] };
export type ReadingQuestion = { item: WebWord; choices: string[] };
export const N3_SOURCE =
  'https://raw.githubusercontent.com/evanclan/OpenJLPT/main/data/json/vocab/n3.json';
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
const text = (value: unknown, max: number): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= max;
export function parseWebWords(raw: unknown): WebWord[] {
  if (!Array.isArray(raw) || raw.length > 5000) throw new Error('Invalid N3 data');
  const seen = new Set<string>();
  const seenWords = new Set<string>();
  const result: WebWord[] = [];
  for (const row of raw) {
    if (
      !row ||
      typeof row !== 'object' ||
      row.level !== 'N3' ||
      !text(row.id, 64) ||
      !/^[a-zA-Z0-9_-]+$/.test(row.id) ||
      !text(row.word, 100) ||
      !text(row.reading, 120) ||
      !Array.isArray(row.meanings)
    )
      continue;
    const meanings = row.meanings
      .filter((item: unknown): item is string => text(item, 500))
      .slice(0, 4);
    const key = `${row.word.trim()}:${row.reading.trim()}`;
    if (!meanings.length || seen.has(row.id) || seenWords.has(key)) continue;
    seen.add(row.id);
    seenWords.add(key);
    result.push({ id: row.id, word: row.word.trim(), reading: row.reading.trim(), meanings });
  }
  if (new Set(result.map((item) => item.reading)).size < 4)
    throw new Error('Not enough valid N3 words');
  return result;
}
export function nextBatch(words: WebWord[], previous: WebWord[] = [], count = 20): WebWord[] {
  const previousIds = new Set(previous.map((item) => item.id));
  const fresh = shuffle(words.filter((item) => !previousIds.has(item.id)));
  const repeat = shuffle(words.filter((item) => previousIds.has(item.id)));
  return [...fresh, ...repeat].slice(0, count);
}
export function readingQuiz(items: WebWord[], pool: WebWord[], count = 10): ReadingQuestion[] {
  const readings = [...new Set(pool.map((item) => item.reading))];
  return shuffle(items)
    .slice(0, count)
    .map((item) => ({
      item,
      choices: shuffle([
        item.reading,
        ...shuffle(readings.filter((reading) => reading !== item.reading)).slice(0, 3),
      ]),
    }));
}
export async function fetchN3(
  signal: AbortSignal,
  fetcher: typeof fetch = fetch,
): Promise<WebWord[]> {
  const response = await fetcher(N3_SOURCE, {
    signal,
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
    cache: 'no-cache',
  });
  if (!response.ok) throw new Error('N3 source unavailable');
  const body = await response.text();
  if (body.length > 6_000_000) throw new Error('N3 response too large');
  return parseWebWords(JSON.parse(body));
}
