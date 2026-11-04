import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Download, RotateCcw, Volume2 } from 'lucide-react';
import {
  fetchN3,
  nextBatch,
  parseWebWords,
  readingQuiz,
  type WebWord,
  type ReadingQuestion,
} from './word-quiz';
const cacheKey = 'otoba-web-n3-cache-v1';
const progressKey = 'otoba-web-n3-progress-v1';
type Cache = { words: WebWord[]; updatedAt: number };
type Progress = { known: string[]; wrong: string[] };
function readCache(): Cache | null {
  try {
    const raw = JSON.parse(localStorage.getItem(cacheKey) || 'null');
    if (!raw || !Number.isFinite(raw.updatedAt) || !Array.isArray(raw.words)) return null;
    const words = parseWebWords(raw.words.map((item: WebWord) => ({ ...item, level: 'N3' })));
    return { words, updatedAt: raw.updatedAt };
  } catch {
    return null;
  }
}
function readProgress(): Progress {
  try {
    const raw = JSON.parse(localStorage.getItem(progressKey) || '{}');
    const list = (value: unknown): string[] =>
      Array.isArray(value)
        ? [
            ...new Set(
              value.filter(
                (id): id is string => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(id),
              ),
            ),
          ].slice(0, 5000)
        : [];
    return { known: list(raw?.known), wrong: list(raw?.wrong) };
  } catch {
    return { known: [], wrong: [] };
  }
}
export function WebVocabulary({ speak }: { speak: (value: string) => void }) {
  const [cache, setCache] = useState<Cache | null>(readCache);
  const [batch, setBatch] = useState<WebWord[]>(() => (cache ? nextBatch(cache.words) : []));
  const [progress, setProgress] = useState<Progress>(readProgress);
  const [loading, setLoading] = useState(!cache);
  const [notice, setNotice] = useState('');
  const [storageError, setStorageError] = useState(false);
  const [quiz, setQuiz] = useState<ReadingQuestion[] | null>(null);
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const refresh = async () => {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    const timeout = window.setTimeout(() => request.abort('timeout'), 12000);
    setLoading(true);
    setNotice('');
    try {
      const words = await fetchN3(request.signal);
      if (request.signal.aborted) return;
      const next = { words, updatedAt: Date.now() };
      setCache(next);
      setBatch(nextBatch(words, batch));
      setQuiz(null);
      try {
        localStorage.setItem(cacheKey, JSON.stringify(next));
        setStorageError(false);
      } catch {
        setStorageError(true);
      }
      setNotice(`${words.length.toLocaleString()}개의 N3 단어를 웹에서 불러왔어요.`);
    } catch {
      if (request.signal.aborted && request.signal.reason !== 'timeout') return;
      setNotice(
        cache
          ? '웹 연결을 확인할 수 없어 마지막으로 불러온 단어를 표시해요.'
          : '웹 단어를 불러오지 못했어요. 다시 시도하거나 내 단어로 학습해 주세요.',
      );
    } finally {
      window.clearTimeout(timeout);
      if (
        controller.current === request &&
        (!request.signal.aborted || request.signal.reason === 'timeout')
      )
        setLoading(false);
    }
  };
  useEffect(() => {
    if (!cache || Date.now() - cache.updatedAt > 86400000) void refresh();
    return () => controller.current?.abort();
  }, []);
  const saveAnswer = (item: WebWord, ok: boolean) => {
    const next = {
      known: ok
        ? [...new Set([...progress.known, item.id])]
        : progress.known.filter((id) => id !== item.id),
      wrong: ok
        ? progress.wrong.filter((id) => id !== item.id)
        : [...new Set([...progress.wrong, item.id])],
    };
    setProgress(next);
    try {
      localStorage.setItem(progressKey, JSON.stringify(next));
    } catch {
      setStorageError(true);
    }
  };
  const start = (wrongOnly = false) => {
    if (!cache || loading) return;
    const items = wrongOnly
      ? cache.words.filter((item) => progress.wrong.includes(item.id))
      : batch;
    if (!items.length) return;
    setQuiz(readingQuiz(items, cache.words, 10));
    setStep(0);
    setAnswer(null);
    setScore(0);
    setFinished(false);
  };
  const knownCount = cache?.words.filter((item) => progress.known.includes(item.id)).length || 0;
  const wrongCount = cache?.words.filter((item) => progress.wrong.includes(item.id)).length || 0;
  const current = quiz?.[step];
  return (
    <div className="web-vocabulary">
      <section className="web-vocab-intro">
        <span className="eyebrow">N3 / FRESH WORDS</span>
        <h2>새로운 단어로, 한 걸음 더.</h2>
        <p>공개 N3 단어에서 매번 다른 20개를 골라요. 읽기 퀴즈는 10문제씩, 선택지도 무작위예요.</p>
        <div className="web-vocab-actions">
          <button
            className="primary"
            disabled={!cache || loading}
            onClick={() => {
              if (cache) {
                setBatch(nextBatch(cache.words, batch));
                setQuiz(null);
              }
            }}
          >
            <RotateCcw size={16} /> 다른 단어 20개
          </button>
          <button className="secondary-button" disabled={loading} onClick={() => void refresh()}>
            <Download size={16} />
            {loading ? '웹에서 불러오는 중…' : '웹 단어 새로고침'}
          </button>
        </div>
        {cache && (
          <small>
            웹 단어 {cache.words.length.toLocaleString()}개 · 확인한 단어 {knownCount}개 · 최근
            불러오기 {new Date(cache.updatedAt).toLocaleDateString('ko-KR')} · 기록은 이 브라우저에
            저장돼요.
          </small>
        )}
        <p className="web-source-note">
          뜻은 원문 사전의 영어로 제공돼요. N3 구분은 공개 학습 목록 기준이며 공식 출제 목록은
          아닙니다.
        </p>
        {notice && <p role="status">{notice}</p>}
        {storageError && (
          <p role="alert">
            브라우저에 저장하지 못했어요. 이번 화면에서는 학습할 수 있지만 새로고침하면 최근 기록이
            사라질 수 있어요.
          </p>
        )}
      </section>
      {!cache && loading && <p role="status">웹에서 N3 단어를 가져오고 있어요.</p>}
      {current && quiz ? (
        <section className="kana-quiz" aria-label="웹 N3 읽기 퀴즈">
          {finished ? (
            <div className="kana-result" role="status">
              <h2>
                {quiz.length}문제 중 {score}문제 정답
              </h2>
              <button className="primary" onClick={() => setQuiz(null)}>
                단어 다시 보기
              </button>
              <button
                className="secondary-button"
                disabled={!wrongCount || loading}
                onClick={() => start(true)}
              >
                웹 단어 오답 {wrongCount}개 복습
              </button>
            </div>
          ) : (
            <>
              <div className="section-title">
                <span className="eyebrow">
                  READING QUIZ · {step + 1} / {quiz.length}
                </span>
                <button className="text-link" onClick={() => setQuiz(null)}>
                  퀴즈 나가기
                </button>
              </div>
              <p>이 단어의 읽는 법을 골라 주세요.</p>
              <h2 className="web-quiz-word" lang="ja">
                {current.item.word}
              </h2>
              <div className="answers">
                {current.choices.map((choice) => (
                  <button
                    key={choice}
                    lang="ja"
                    disabled={answer !== null}
                    className={
                      answer === null
                        ? ''
                        : choice === current.item.reading
                          ? 'correct'
                          : choice === answer
                            ? 'incorrect'
                            : ''
                    }
                    onClick={() => {
                      if (answer !== null) return;
                      const ok = choice === current.item.reading;
                      setAnswer(choice);
                      if (ok) setScore((n) => n + 1);
                      saveAnswer(current.item, ok);
                    }}
                  >
                    {choice}
                    {answer !== null && choice === current.item.reading && <Check size={16} />}
                  </button>
                ))}
              </div>
              {answer !== null && (
                <div className="kana-feedback" role="status">
                  <strong>
                    {answer === current.item.reading
                      ? '잘 읽었어요!'
                      : '발음과 함께 한 번 더 기억해 봐요.'}
                  </strong>
                  <p lang="ja">
                    {current.item.word} · {current.item.reading}
                  </p>
                  <p>영어 뜻 · {current.item.meanings.join('; ')}</p>
                  <button className="secondary-button" onClick={() => speak(current.item.reading)}>
                    <Volume2 size={16} /> 발음 듣기
                  </button>
                  <button
                    className="primary"
                    onClick={() => {
                      if (step === quiz.length - 1) setFinished(true);
                      else {
                        setStep((n) => n + 1);
                        setAnswer(null);
                      }
                    }}
                  >
                    {step === quiz.length - 1 ? '결과 보기' : '다음 단어'} <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      ) : (
        cache && (
          <>
            <div className="list-toolbar">
              <span>이번 단어 {batch.length}개 · 매번 랜덤</span>
              <button className="primary" disabled={loading} onClick={() => start()}>
                랜덤 읽기 퀴즈 <ArrowRight size={16} />
              </button>
            </div>
            <button
              className="text-link"
              disabled={!wrongCount || loading}
              onClick={() => start(true)}
            >
              웹 단어 오답 {wrongCount}개 복습
            </button>
            <div className="word-grid">
              {batch.map((item) => (
                <article className="word-card" key={item.id}>
                  <div>
                    <span className="course-tag">웹 N3 · 영어 뜻</span>
                    <button
                      className="sound"
                      aria-label={`${item.word} 발음 듣기`}
                      onClick={() => speak(item.reading)}
                    >
                      <Volume2 size={18} />
                    </button>
                  </div>
                  <h2 lang="ja">{item.word}</h2>
                  <span>{item.reading}</span>
                  <h3 lang="en">{item.meanings[0]}</h3>
                  {item.meanings.length > 1 && <p lang="en">{item.meanings.slice(1).join('; ')}</p>}
                  {progress.known.includes(item.id) && (
                    <span className="learned">
                      <Check size={13} /> 확인한 단어
                    </span>
                  )}
                </article>
              ))}
            </div>
          </>
        )
      )}
      <p className="web-source-note">
        출처:{' '}
        <a href="https://github.com/evanclan/OpenJLPT" target="_blank" rel="noreferrer">
          OpenJLPT
        </a>{' '}
        · JMdict (EDRDG), Jonathan Waller.{' '}
        <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">
          CC BY-SA 4.0
        </a>{' '}
        ·{' '}
        <a href="/licenses/openjlpt-NOTICE.txt" target="_blank" rel="noreferrer">
          원자료 출처
        </a>
        . 원문에서 표제어·읽기·뜻만 골라 표시하며 예문은 가져오지 않습니다.
      </p>
    </div>
  );
}
