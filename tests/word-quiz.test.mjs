import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source = readFileSync(new URL('../src/word-quiz.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
});
const { shuffle, parseWebWords, nextBatch, readingQuiz, fetchN3, N3_SOURCE } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
);
const rows = Array.from({ length: 60 }, (_, i) => ({
  id: `word-${i}`,
  word: `語${i}`,
  reading: `ご${i}`,
  meanings: [`meaning ${i}`],
  level: 'N3',
}));

test('shuffle returns a permutation without modifying saved IDs or choices', () => {
  const items = Object.freeze([12, 16, 24, 28]);
  const originalRandom = Math.random;
  try {
    Math.random = () => 0;
    assert.deepEqual(shuffle(items), [16, 24, 28, 12]);
    assert.deepEqual(items, [12, 16, 24, 28]);
  } finally {
    Math.random = originalRandom;
  }
});

test('remote parser rejects malformed payloads and filters non-N3 or duplicate entries', () => {
  assert.throws(() => parseWebWords('<html>login</html>'));
  assert.throws(() => parseWebWords([{ word: 'bad' }]));
  const parsed = parseWebWords([
    ...rows,
    rows[0],
    { ...rows[0], id: 'duplicate-word' },
    { ...rows[0], id: 'n4', level: 'N4' },
    null,
  ]);
  assert.equal(parsed.length, 60);
  assert.equal(new Set(parsed.map((word) => word.id)).size, 60);
});

test('new batches exclude the previous batch when enough words exist', () => {
  const words = parseWebWords(rows);
  const first = nextBatch(words);
  const second = nextBatch(words, first);
  assert.equal(first.length, 20);
  assert.equal(second.length, 20);
  assert.ok(second.every((word) => !first.some((old) => old.id === word.id)));
});

test('reading quizzes have one correct answer and no duplicate readings', () => {
  const words = parseWebWords([...rows, { ...rows[0], id: 'homophone', word: '同音' }]);
  const quiz = readingQuiz(words, words, 10);
  assert.equal(quiz.length, 10);
  assert.equal(new Set(quiz.map(({ item }) => item.id)).size, 10);
  for (const { item, choices } of quiz) {
    assert.equal(choices.length, 4);
    assert.equal(new Set(choices).size, 4);
    assert.equal(choices.filter((reading) => reading === item.reading).length, 1);
  }
});

test('fetch sends no cookies or referrer and rejects failed or invalid responses', async () => {
  const signal = new AbortController().signal;
  const words = await fetchN3(signal, async (url, options) => {
    assert.equal(url, N3_SOURCE);
    assert.equal(options.credentials, 'omit');
    assert.equal(options.referrerPolicy, 'no-referrer');
    assert.equal(options.signal, signal);
    return new Response(JSON.stringify(rows), { status: 200 });
  });
  assert.equal(words.length, 60);
  await assert.rejects(fetchN3(signal, async () => new Response('fail', { status: 503 })));
  await assert.rejects(fetchN3(signal, async () => new Response('<html>error</html>')));
});
