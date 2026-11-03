import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const kana = JSON.parse(readFileSync(new URL('../src/data/kana.json', import.meta.url)));
const source = readFileSync(new URL('../src/kana-quiz.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
});
const { questions } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
);

test('kana catalog pairs both scripts with stable unique identifiers', () => {
  assert.equal(new Set(kana.map((item) => item.id)).size, kana.length);
  for (const [group, count] of [
    ['basic', 46],
    ['voiced', 25],
    ['combo', 33],
  ]) {
    assert.equal(kana.filter((item) => item.group === group).length, count);
  }
  for (const item of kana) {
    const expected = [...item.hiragana]
      .map((char) => String.fromCodePoint(char.codePointAt(0) + 0x60))
      .join('');
    assert.equal(item.katakana, expected);
  }
});

test('quizzes use distinct sounds even for homophones and never mutate the source', () => {
  for (const group of ['basic', 'voiced', 'combo']) {
    const pool = kana.filter((item) => item.group === group);
    const before = JSON.stringify(pool);
    const quiz = questions(pool, pool, 10);
    assert.equal(quiz.length, 10);
    assert.equal(new Set(quiz.map(({ item }) => item.id)).size, 10);
    for (const { item, choices } of quiz) {
      assert.equal(choices.length, 4);
      assert.equal(new Set(choices.map((choice) => choice.sound)).size, 4);
      assert.equal(choices.filter((choice) => choice.sound === item.sound).length, 1);
    }
    assert.equal(JSON.stringify(pool), before);
  }
});

test('a single wrong character can be reviewed with four choices', () => {
  const pool = kana.filter((item) => item.group === 'basic');
  const wrong = pool.find((item) => item.hiragana === 'を');
  const quiz = questions([wrong], pool, 10);
  assert.equal(quiz.length, 1);
  assert.equal(quiz[0].item.id, wrong.id);
  assert.equal(quiz[0].choices.length, 4);
  assert.equal(quiz[0].choices.filter((choice) => choice.sound === 'o').length, 1);
});
