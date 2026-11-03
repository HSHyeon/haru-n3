import { useState } from 'react';
import { ArrowRight, Check, RotateCcw, Volume2 } from 'lucide-react';
import kana from './data/kana.json';
import { questions, type Question } from './kana-quiz';

type Script = 'hiragana' | 'katakana';
type Group = 'basic' | 'voiced' | 'combo';
type Kana = (typeof kana)[number];
type Progress = { known: string[]; wrong: string[] };
const scripts: { id: Script; label: string }[] = [
  { id: 'hiragana', label: '히라가나' },
  { id: 'katakana', label: '가타카나' },
];
const groups: { id: Group; label: string }[] = [
  { id: 'basic', label: '기본 46자' },
  { id: 'voiced', label: '탁음·반탁음' },
  { id: 'combo', label: '요음' },
];
const storageKey = 'otoba-kana-v1';
const validIds = new Set(scripts.flatMap(({ id }) => kana.map((item) => `${id}:${item.id}`)));
const keyOf = (script: Script, item: Kana) => `${script}:${item.id}`;
function read(): Progress {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const list = (value: unknown): string[] =>
      Array.isArray(value)
        ? [
            ...new Set(
              value.filter((id): id is string => typeof id === 'string' && validIds.has(id)),
            ),
          ]
        : [];
    return { known: list(raw?.known), wrong: list(raw?.wrong) };
  } catch {
    return { known: [], wrong: [] };
  }
}

export function KanaStudy({ speak }: { speak: (text: string) => void }) {
  const [script, setScript] = useState<Script>('hiragana');
  const [group, setGroup] = useState<Group>('basic');
  const [progress, setProgress] = useState<Progress>(read);
  const [storageError, setStorageError] = useState(false);
  const [showReadings, setShowReadings] = useState(true);
  const [selectedId, setSelectedId] = useState(kana[0].id);
  const [size, setSize] = useState('10');
  const [quiz, setQuiz] = useState<Question[] | null>(null);
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const items = kana.filter((item) => item.group === group);
  const selected = items.find((item) => item.id === selectedId) || items[0];
  const known = items.filter((item) => progress.known.includes(keyOf(script, item))).length;
  const wrongItems = items.filter((item) => progress.wrong.includes(keyOf(script, item)));
  const save = (next: Progress) => {
    setProgress(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  };
  const mark = (item: Kana, ok: boolean) => {
    const id = keyOf(script, item);
    save({
      known: ok
        ? [...new Set([...progress.known, id])]
        : progress.known.filter((key) => key !== id),
      wrong: ok
        ? progress.wrong.filter((key) => key !== id)
        : [...new Set([...progress.wrong, id])],
    });
  };
  const start = (onlyWrong: boolean) => {
    const pool = onlyWrong ? wrongItems : items;
    if (!pool.length) return;
    setQuiz(questions(pool, items, size === 'all' ? pool.length : Number(size)));
    setStep(0);
    setAnswer(null);
    setScore(0);
    setFinished(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const current = quiz?.[step];
  const choose = (sound: string) => {
    if (!current || answer !== null) return;
    const ok = sound === current.item.sound;
    setAnswer(sound);
    if (ok) setScore((value) => value + 1);
    mark(current.item, ok);
  };
  const changeScript = (value: Script) => {
    setScript(value);
    setQuiz(null);
  };
  const changeGroup = (value: Group) => {
    setGroup(value);
    setQuiz(null);
  };
  return (
    <div className="kana-study">
      <div className="kana-tabs" aria-label="문자 종류">
        {scripts.map(({ id, label }) => (
          <button
            key={id}
            aria-pressed={script === id}
            className={script === id ? 'selected' : ''}
            onClick={() => changeScript(id)}
          >
            <span lang="ja">{id === 'hiragana' ? 'あ' : 'ア'}</span>
            {label}
          </button>
        ))}
      </div>
      <div className="kana-groups" aria-label="연습 범위">
        {groups.map(({ id, label }) => (
          <button
            key={id}
            aria-pressed={group === id}
            className={group === id ? 'selected' : ''}
            onClick={() => changeGroup(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="kana-progress">
        <span>
          {scripts.find((item) => item.id === script)?.label} ·{' '}
          {groups.find((item) => item.id === group)?.label}
        </span>
        <strong>
          기억한 글자 {known} / {items.length}
        </strong>
        <div className="progress" aria-label={`기억한 글자 ${known}/${items.length}`}>
          <i style={{ width: `${(known / items.length) * 100}%` }} />
        </div>
      </div>
      {storageError && (
        <p role="alert" className="song-storage-error">
          기록을 저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.
        </p>
      )}
      {quiz && current ? (
        <section className="kana-quiz" aria-label="가나 퀴즈">
          {finished ? (
            <div className="kana-result" role="status">
              <span className="eyebrow">ONE SOUND CLOSER</span>
              <h2>소리가 조금 더 익숙해졌어요.</h2>
              <p>
                {quiz.length}문제 중 {score}문제 정답
              </p>
              <button className="primary" onClick={() => start(false)}>
                다시 연습하기 <RotateCcw size={16} />
              </button>
              <button className="secondary-button" onClick={() => setQuiz(null)}>
                문자표로 돌아가기
              </button>
            </div>
          ) : (
            <>
              <div className="section-title">
                <span className="eyebrow">
                  KANA QUIZ · {step + 1} / {quiz.length}
                </span>
                <button className="text-link" onClick={() => setQuiz(null)}>
                  퀴즈 나가기
                </button>
              </div>
              <p>이 글자는 어떻게 읽을까요?</p>
              <h2 className="kana-question" lang="ja">
                {current.item[script]}
              </h2>
              <div className="answers">
                {current.choices.map((choice) => (
                  <button
                    key={choice.sound}
                    disabled={answer !== null}
                    onClick={() => choose(choice.sound)}
                    className={
                      answer === null
                        ? ''
                        : choice.sound === current.item.sound
                          ? 'correct'
                          : choice.sound === answer
                            ? 'incorrect'
                            : ''
                    }
                  >
                    {choice.label}
                    {answer !== null && choice.sound === current.item.sound && <Check size={16} />}
                  </button>
                ))}
              </div>
              {answer !== null && (
                <div className="kana-feedback" role="status">
                  <strong>
                    {answer === current.item.sound
                      ? '잘 기억했어요!'
                      : '한 번 더 소리와 연결해 봐요.'}
                  </strong>
                  <p>
                    <span lang="ja">
                      {current.item.hiragana} / {current.item.katakana}
                    </span>{' '}
                    · {current.item.korean} · {current.item.sound}
                  </p>
                  <button className="secondary-button" onClick={() => speak(current.item.hiragana)}>
                    <Volume2 size={16} /> 정답 발음 듣기
                  </button>
                  <button
                    className="primary"
                    onClick={() => {
                      if (step === quiz.length - 1) setFinished(true);
                      else {
                        setStep((value) => value + 1);
                        setAnswer(null);
                      }
                    }}
                  >
                    {step === quiz.length - 1 ? '결과 보기' : '다음 글자'} <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      ) : (
        <>
          <section className="kana-focus" aria-label="선택한 글자">
            <div className="kana-focus-glyph" lang="ja">
              {selected[script]}
            </div>
            <div>
              <span className="eyebrow">ONE LETTER, ONE SOUND</span>
              <h2>
                {selected.korean} <small>{selected.sound}</small>
              </h2>
              <p lang="ja">
                {selected.hiragana} ↔ {selected.katakana}
              </p>
              <div className="kana-focus-actions">
                <button className="secondary-button" onClick={() => speak(selected.hiragana)}>
                  <Volume2 size={16} /> 발음 듣기
                </button>
                <button
                  className="secondary-button"
                  aria-pressed={progress.known.includes(keyOf(script, selected))}
                  onClick={() => {
                    const id = keyOf(script, selected);
                    if (progress.known.includes(id))
                      save({ ...progress, known: progress.known.filter((key) => key !== id) });
                    else mark(selected, true);
                  }}
                >
                  <Check size={16} />
                  {progress.known.includes(keyOf(script, selected))
                    ? '기억했어요 · 해제'
                    : '기억했어요'}
                </button>
              </div>
            </div>
          </section>
          <section className="kana-practice" aria-label="퀴즈 시작">
            <div>
              <h3>읽는 법을 가리고, 기억을 꺼내 봐요.</h3>
              <p>정답은 기억한 글자로, 오답은 복습할 글자로 기록돼요.</p>
            </div>
            <div className="kana-quiz-actions">
              <label>
                문제 수{' '}
                <select value={size} onChange={(event) => setSize(event.target.value)}>
                  <option value="10">10문제</option>
                  <option value="20">20문제</option>
                  <option value="all">전체</option>
                </select>
              </label>
              <button className="primary" onClick={() => start(false)}>
                가나 퀴즈 시작 <ArrowRight size={16} />
              </button>
              <button
                className="secondary-button"
                disabled={!wrongItems.length}
                onClick={() => start(true)}
              >
                <RotateCcw size={16} /> 헷갈린 글자 {wrongItems.length}개
              </button>
            </div>
          </section>
          <div className="kana-grid-heading">
            <h2>소리와 글자 연결하기</h2>
            <label>
              <input
                type="checkbox"
                checked={showReadings}
                onChange={(event) => setShowReadings(event.target.checked)}
              />{' '}
              읽는 법 표시
            </label>
          </div>
          <div className={`kana-grid ${group === 'combo' ? 'kana-combo-grid' : ''}`}>
            {items.map((item) => (
              <button
                key={item.id}
                style={
                  group === 'basic'
                    ? {
                        gridColumnStart:
                          item.sound === 'n'
                            ? 1
                            : ['a', 'i', 'u', 'e', 'o'].indexOf(item.sound.slice(-1)) + 1,
                      }
                    : undefined
                }
                aria-label={`${item[script]} 자세히 보기`}
                aria-pressed={selected.id === item.id}
                className={selected.id === item.id ? 'selected' : ''}
                onClick={() => setSelectedId(item.id)}
              >
                <span lang="ja">{item[script]}</span>
                {showReadings && (
                  <small>
                    {item.korean} · {item.sound}
                  </small>
                )}
                {progress.known.includes(keyOf(script, item)) && (
                  <Check size={12} aria-label="기억한 글자" />
                )}
                {progress.wrong.includes(keyOf(script, item)) && (
                  <b className="kana-wrong-dot" aria-label="복습할 글자" />
                )}
              </button>
            ))}
          </div>
          <p className="kana-note">
            한글과 로마자는 발음 참고용이에요. 일본어 음성으로 함께 익혀 주세요. を・ヲ는 조사에서
            주로 ‘오’, じ・ぢ와 ず・づ는 각각 같은 소리로 연습해요. は・へ는 조사에서 ‘와・에’로
            읽기도 해요.
          </p>
          <p className="kana-note">
            작은 っ・ッ는 다음 자음을 한 박자 막는 촉음, ー는 앞 모음을 길게 하는 장음 표시예요.
            요음의 작은 ゃ・ゅ・ょ는 앞 글자와 한 소리로 읽어요. 음성은 브라우저의 일본어 음성
            지원에 따라 달라져요.
          </p>
        </>
      )}
    </div>
  );
}
