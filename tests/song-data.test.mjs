import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const courses = JSON.parse(readFileSync(new URL('../src/data/song-courses.json', import.meta.url)));

test('song word IDs keep old records and never reuse removed course IDs', () => {
  assert.equal(courses.find((course) => course.id === 'sunny').wordOffset, 12);
  assert.equal(courses.find((course) => course.id === 'flower').wordOffset, 16);
  const ids = courses.flatMap((course) => course.words.map((_, i) => course.wordOffset + i));
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every((id) => id < 20 || id >= 24));
  assert.deepEqual(
    courses.find((course) => course.id === 'hirutobi').words.map((_, i) => 24 + i),
    [24, 25, 26, 27],
  );
});

test('course quizzes have valid unique choices and answer indices', () => {
  for (const course of courses) {
    for (const word of course.words) {
      assert.equal(word.choices.length, 4);
      assert.equal(new Set(word.choices).size, 4);
      assert.equal(word.choices.filter((choice) => choice === word.meaning).length, 1);
    }
    for (const grammar of course.grammar) {
      assert.equal(new Set(grammar.choices).size, 4);
      assert.ok(Number.isInteger(grammar.answer) && grammar.answer >= 0 && grammar.answer < 4);
    }
  }
});
