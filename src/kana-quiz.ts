type Kana = (typeof import('./data/kana.json'))[number];
type Choice = { sound: string; label: string };
export type Question = { item: Kana; choices: Choice[] };
function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function questions(items: Kana[], pool: Kana[], count: number): Question[] {
  const unique = [
    ...new Map(
      pool.map((item) => [
        item.sound,
        { sound: item.sound, label: `${item.korean} · ${item.sound}` },
      ]),
    ).values(),
  ];
  return shuffle(items)
    .slice(0, count)
    .map((item) => ({
      item,
      choices: shuffle([
        { sound: item.sound, label: `${item.korean} · ${item.sound}` },
        ...shuffle(unique.filter((choice) => choice.sound !== item.sound)).slice(0, 3),
      ]),
    }));
}
