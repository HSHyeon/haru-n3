import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  Layers,
  House,
  RotateCcw,
  Check,
  ChevronRight,
  Flame,
  Headphones,
  Sprout,
  X,
  Volume2,
  Music2,
} from 'lucide-react';
import './style.css';
import { PwaControls } from './pwa';
import { musicWords, RecordArt } from './music';
import { SongLibrary, songWords, songWordEntries, songCourses, SONG_WORD_OFFSET } from './songs';
const n3Words = [
  {
    word: '支度',
    reading: 'したく',
    meaning: '준비',
    example: '旅行の支度をしています。',
    translation: '여행 준비를 하고 있어요.',
    choices: ['준비', '약속', '경험', '계획'],
  },
  {
    word: '約束',
    reading: 'やくそく',
    meaning: '약속',
    example: '友達と会う約束があります。',
    translation: '친구를 만날 약속이 있어요.',
    choices: ['기억', '약속', '설명', '습관'],
  },
  {
    word: '経験',
    reading: 'けいけん',
    meaning: '경험',
    example: '日本で働いた経験があります。',
    translation: '일본에서 일한 경험이 있어요.',
    choices: ['의견', '연락', '경험', '준비'],
  },
  {
    word: '続ける',
    reading: 'つづける',
    meaning: '계속하다',
    example: '毎日、日本語の勉強を続けています。',
    translation: '매일 일본어 공부를 계속하고 있어요.',
    choices: ['멈추다', '고르다', '전하다', '계속하다'],
  },
  {
    word: '間に合う',
    reading: 'まにあう',
    meaning: '시간에 맞추다',
    example: '電車に間に合いました。',
    translation: '전철 시간에 맞췄어요.',
    choices: ['시간에 맞추다', '길을 잃다', '돌아가다', '기다리다'],
  },
  {
    word: '確かめる',
    reading: 'たしかめる',
    meaning: '확인하다',
    example: '出発の時間を確かめてください。',
    translation: '출발 시간을 확인해 주세요.',
    choices: ['잊어버리다', '확인하다', '비교하다', '설명하다'],
  },
];
const words = Object.fromEntries([
  ...[...n3Words, ...musicWords].map((word, id) => [id, word] as const),
  ...songWordEntries,
]);
const allIds = Object.keys(words).map(Number);
const grammar = [
  {
    title: '〜ようにする',
    meaning: '~하도록 하다',
    desc: '어떤 행동을 습관적으로 하거나 노력할 때 사용해요.',
    example: '毎日、日本語を話すようにしています。',
    ko: '매일 일본어로 말하려고 노력하고 있어요.',
  },
  {
    title: '〜たばかり',
    meaning: '막 ~했다',
    desc: '어떤 행동을 끝낸 지 얼마 되지 않았음을 나타내요.',
    example: '昼ご飯を食べたばかりです。',
    ko: '점심을 막 먹었어요.',
  },
  {
    title: '〜ことにする',
    meaning: '~하기로 하다',
    desc: '자신의 의지로 어떤 일을 결정했을 때 사용해요.',
    example: '毎日、日記を書くことにしました。',
    ko: '매일 일기를 쓰기로 했어요.',
  },
];
type Saved = { done: number[]; wrong: number[]; dates: string[] };
function read(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem('haru-n3') || 'null');
    const activeIds = (value: unknown): number[] =>
      Array.isArray(value)
        ? [...new Set(value.filter((id) => Number.isInteger(id) && id >= 0 && id in words))]
        : [];
    return {
      done: activeIds(raw?.done),
      wrong: activeIds(raw?.wrong),
      dates: Array.isArray(raw?.dates)
        ? raw.dates.filter((date: unknown) => typeof date === 'string')
        : [],
    };
  } catch {
    return { done: [], wrong: [], dates: [] };
  }
}
function App() {
  const [tab, setTab] = useState('홈');
  const [saved, setSaved] = useState<Saved>(read);
  const [quiz, setQuiz] = useState<number[] | null>(null);
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [detail, setDetail] = useState<number | null>(null);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [tab]);
  const today = new Date().toLocaleDateString('sv-SE');
  const update = (next: Saved) => {
    setSaved(next);
    localStorage.setItem('haru-n3', JSON.stringify(next));
  };
  const start = (ids: number[]) => {
    setQuiz(ids);
    setStep(0);
    setAnswer(null);
    setFinished(false);
    setCorrect(0);
  };
  const choose = (value: string) => {
    if (answer || !quiz) return;
    setAnswer(value);
    const id = quiz[step],
      ok = value === words[id].meaning;
    if (ok) setCorrect((n) => n + 1);
    update({
      done: [...new Set([...saved.done, id])],
      wrong: ok ? saved.wrong.filter((x) => x !== id) : [...new Set([...saved.wrong, id])],
      dates: [...new Set([...saved.dates, today])],
    });
  };
  const speak = (s: string) => {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(s);
      u.lang = 'ja-JP';
      speechSynthesis.speak(u);
    }
  };
  const percentage = Math.round((saved.done.length / allIds.length) * 100);
  return (
    <div className="shell bg-night text-ink antialiased">
      <aside>
        <a className="logo" href="#" onClick={() => setTab('홈')}>
          <img className="logo-icon" src="/favicon.svg" alt="" aria-hidden="true" />
          <span className="logo-wordmark">
            OTOBA<small lang="ja">音葉</small>
          </span>
        </a>
        <div className="workspace-label">MY LITTLE LISTENING ROOM</div>
        <nav>
          {[
            { name: '홈', icon: House },
            { name: '단어장', icon: Layers },
            { name: '음악 공부방', icon: Music2 },
            { name: '문법 노트', icon: BookOpen },
            { name: '오답 복습', icon: RotateCcw },
          ].map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={tab === name ? 'active' : ''}
              onClick={() => setTab(name)}
            >
              <Icon size={19} />
              {name}
              {name === '오답 복습' && saved.wrong.length > 0 && (
                <span className="badge">{saved.wrong.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="side-note">
          <Sprout size={26} />
          <p>
            좋아하는 노래가
            <br />
            조금 더 들리는 날까지.
          </p>
          <span>좋아하는 마음으로, 조금씩.</span>
        </div>
        <div className="profile">
          <div>나</div>
          <span>
            나의 학습 공간<small>JLPT N3 도전 중</small>
          </span>
          <span className="online" />
        </div>
      </aside>
      <main>
        <header>
          <span className="header-brand">
            <img className="header-logo" src="/favicon.svg" alt="" aria-hidden="true" />
            OTOBA <small lang="ja">音葉</small>
          </span>
          <div>
            <span className="level">JLPT N3</span>
            <span className="avatar">나</span>
          </div>
        </header>
        <div className="content">
          <div key={tab} className="page-view motion-safe:animate-page-enter">
            <div className="greeting">
              <div>
                <div className="eyebrow">OTOBA · 音葉 / JAPANESE, IN BLOOM</div>
                <h1>
                  {tab === '홈'
                    ? '좋아하는 노래가, 나의 언어로'
                    : tab === '단어장'
                      ? '차곡차곡, 나의 단어'
                      : tab === '문법 노트'
                        ? '문장이 보이는 문법'
                        : tab === '음악 공부방'
                          ? '나의 작은 음악 공부방'
                          : '다시 만나면, 내 것이 돼요'}
                  <span className="sun">☾</span>
                </h1>
                <p>
                  {tab === '홈'
                    ? '좋아하는 J-POP으로 배우는 나만의 일본어'
                    : tab === '단어장'
                      ? '읽고, 듣고, 퀴즈로 기억해 보세요.'
                      : tab === '문법 노트'
                        ? '예문과 함께 N3 문법의 쓰임을 익혀 보세요.'
                        : tab === '음악 공부방'
                          ? '좋아하는 곡을 고르고, N3 표현을 하나씩 익혀 보세요.'
                          : '틀려도 괜찮아요. 한 번 더 기억할 기회니까요.'}
                </p>
              </div>
              <span className="date">
                {new Date().toLocaleDateString('ko-KR', {
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                })}
              </span>
            </div>
            {tab === '홈' ? (
              <>
                <section className="hero music-hero">
                  <div className="hero-copy">
                    <span className="pill">
                      <Music2 size={12} /> 오늘의 작은 플레이리스트
                    </span>
                    <h2>
                      좋아하는 노래에,
                      <br />한 단어 더 가까이.
                    </h2>
                    <p>
                      요루시카를 듣는 밤, 일본어를 배우는 나.
                      <br />
                      좋아하는 {songCourses.length}곡으로 N3 단어와 문법을 익혀요.
                    </p>
                    <button className="primary" onClick={() => setTab('음악 공부방')}>
                      음악 공부방 들어가기 <ArrowRight size={18} />
                    </button>
                    <div className="hero-meta">
                      요루시카 {songCourses.length}곡 <span>·</span> 단어 {songWords.length}개 ·
                      문법 {songCourses.reduce((n, course) => n + course.grammar.length, 0)}개
                    </div>
                  </div>
                  <RecordArt />
                </section>
                <button
                  className="listening-banner"
                  onClick={() => start(n3Words.map((_, i) => i))}
                >
                  <span className="listening-banner-icon">
                    <BookOpen size={20} />
                  </span>
                  <span>
                    <b>오늘의 N3 공부도, 차근차근.</b>
                    <small>일상 단어 {n3Words.length}개로 시험 공부 이어가기</small>
                  </span>
                  <ArrowRight size={18} />
                </button>
                <div className="stats">
                  <div>
                    <span className="stat-icon orange">
                      <Flame size={21} />
                    </span>
                    <div>
                      <span>학습한 날</span>
                      <strong>
                        {saved.dates.length}
                        <small>일</small>
                      </strong>
                    </div>
                    <span className="stat-tip">꾸준함의 시작</span>
                  </div>
                  <div>
                    <span className="stat-icon green">
                      <Layers size={21} />
                    </span>
                    <div>
                      <span>만나본 단어</span>
                      <strong>
                        {saved.done.length}
                        <small>/ {allIds.length}개</small>
                      </strong>
                    </div>
                    <div className="mini-progress">
                      <i style={{ width: percentage + '%' }} />
                    </div>
                  </div>
                  <div>
                    <span className="stat-icon purple">
                      <RotateCcw size={21} />
                    </span>
                    <div>
                      <span>복습할 단어</span>
                      <strong>
                        {saved.wrong.length}
                        <small>개</small>
                      </strong>
                    </div>
                    <button
                      className="circle-btn"
                      aria-label="오답 복습 열기"
                      onClick={() => setTab('오답 복습')}
                    >
                      <ArrowUpRight size={19} />
                    </button>
                  </div>
                </div>
                <div className="section-title">
                  <h2>
                    오늘의 학습 코스 <span>나에게 맞는 작은 루틴</span>
                  </h2>
                  <span className="tiny-label">LET'S STUDY</span>
                </div>
                <div className="courses">
                  <button className="course" onClick={() => start(allIds)}>
                    <span className="course-icon green">
                      <Layers />
                    </span>
                    <span className="course-tag">VOCABULARY</span>
                    <h3>단어 한 줌</h3>
                    <p>기초 음악 단어부터 N3 일상 단어까지</p>
                    <div>
                      <span>{allIds.length}개 단어 · 나만의 복습</span>
                      <ArrowUpRight size={20} />
                    </div>
                  </button>
                  <button className="course" onClick={() => setTab('문법 노트')}>
                    <span className="course-icon peach">
                      <BookOpen />
                    </span>
                    <span className="course-tag">GRAMMAR</span>
                    <h3>문법 한 페이지</h3>
                    <p>예문으로 이해하는 문장의 규칙</p>
                    <div>
                      <span>{grammar.length}개 표현 · 약 5분</span>
                      <ArrowUpRight size={20} />
                    </div>
                  </button>
                  <button className="course" onClick={() => setTab('오답 복습')}>
                    <span className="course-icon purple">
                      <RotateCcw />
                    </span>
                    <span className="course-tag">REVIEW</span>
                    <h3>기억 다시 꺼내기</h3>
                    <p>헷갈렸던 단어를 확실한 내 것으로</p>
                    <div>
                      <span>오답 {saved.wrong.length}개 · 나만의 복습</span>
                      <ArrowUpRight size={20} />
                    </div>
                  </button>
                </div>
                <section className="bottom-grid">
                  <div className="expression">
                    <div className="section-title">
                      <h2>음악으로 여는 한 문장</h2>
                      <span className="tiny-label">DAILY JAPANESE</span>
                    </div>
                    <div className="quote-row">
                      <div>
                        <p lang="ja">音楽が好きです。</p>
                        <span>음악을 좋아해요.</span>
                      </div>
                      <button
                        className="sound"
                        aria-label="오늘의 문장 듣기"
                        onClick={() => speak('音楽が好きです')}
                      >
                        <Volume2 size={20} />
                      </button>
                    </div>
                    <div className="expression-foot">
                      <span>おんがくが すきです · 좋아하는 마음을 일본어로 말해 봐요.</span>
                      <Sprout size={22} />
                    </div>
                  </div>
                  <div className="goal">
                    <span>
                      <Sprout size={19} /> 나의 작은 목표
                    </span>
                    <h3>
                      매일 조금씩,
                      <br />
                      끝까지 즐겁게.
                    </h3>
                    <p>완벽한 하루보다 꾸준한 하루를 쌓아요.</p>
                    <div>
                      <span>오늘의 단어 진도</span>
                      <b>{percentage}%</b>
                    </div>
                    <div className="progress">
                      <i style={{ width: percentage + '%' }} />
                    </div>
                  </div>
                </section>
              </>
            ) : tab === '음악 공부방' ? (
              <SongLibrary start={start} speak={speak} done={saved.done} wrong={saved.wrong} />
            ) : tab === '문법 노트' ? (
              <div className="grammar-list">
                {grammar.map((g, i) => (
                  <button className="grammar-card" key={g.title} onClick={() => setDetail(i)}>
                    <span className="course-tag">GRAMMAR 0{i + 1}</span>
                    <h2>{g.title}</h2>
                    <h3>{g.meaning}</h3>
                    <p>{g.desc}</p>
                    <span className="text-link">
                      예문 살펴보기 <ChevronRight size={16} />
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className="list-toolbar">
                  <span>
                    {tab === '오답 복습' ? saved.wrong.length : allIds.length}개의 단어{' '}
                    <small>학습용 샘플</small>
                  </span>
                  <button
                    className="primary"
                    disabled={tab === '오답 복습' && !saved.wrong.length}
                    onClick={() => start(tab === '오답 복습' ? saved.wrong : allIds)}
                  >
                    퀴즈 시작 <ArrowRight size={16} />
                  </button>
                </div>
                {tab === '오답 복습' && !saved.wrong.length ? (
                  <div className="empty">
                    <Sprout size={42} />
                    <h2>아직 복습할 단어가 없어요</h2>
                    <p>단어 퀴즈에서 틀린 단어가 여기에 모여요.</p>
                    <button className="primary" onClick={() => start(allIds)}>
                      단어 퀴즈 풀기
                    </button>
                  </div>
                ) : (
                  <div className="word-grid">
                    {(tab === '오답 복습' ? saved.wrong : allIds).map((id) => (
                      <article className="word-card" key={id}>
                        <div>
                          <span className="course-tag">
                            {id >= SONG_WORD_OFFSET
                              ? '곡별 N3 코스'
                              : id >= n3Words.length
                                ? 'J-POP · 기초'
                                : 'N3 · 단어'}
                          </span>
                          <button
                            className="sound"
                            aria-label={`${words[id].word} 발음 듣기`}
                            onClick={() => speak(words[id].reading)}
                          >
                            <Volume2 size={18} />
                          </button>
                        </div>
                        <h2 lang="ja">{words[id].word}</h2>
                        <span>{words[id].reading}</span>
                        <h3>{words[id].meaning}</h3>
                        <p lang="ja">{words[id].example}</p>
                        <small>{words[id].translation}</small>
                        {saved.done.includes(id) && (
                          <span className="learned">
                            <Check size={13} /> 학습한 단어
                          </span>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          <PwaControls />
          <footer>
            <span className="footer-brand">
              OTOBA <span lang="ja">音葉</span>
            </span>
            <span>좋아하는 J-POP으로 배우는 나만의 일본어</span>
            <small>기초부터 N3까지 · 기록은 현재 브라우저에 저장돼요</small>
          </footer>
        </div>
      </main>
      <nav className="mobile-nav">
        {[
          { name: '홈', icon: House },
          { name: '단어장', icon: Layers },
          { name: '음악 공부방', icon: Music2 },
          { name: '문법 노트', icon: BookOpen },
          { name: '오답 복습', icon: RotateCcw },
        ].map(({ name, icon: Icon }) => (
          <button className={tab === name ? 'active' : ''} onClick={() => setTab(name)} key={name}>
            <Icon size={21} />
            <span>{name}</span>
          </button>
        ))}
      </nav>
      {quiz && (
        <div className="modal-backdrop">
          <section
            key={finished ? 'result' : step}
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="단어 퀴즈"
          >
            <button className="close" aria-label="퀴즈 닫기" onClick={() => setQuiz(null)}>
              <X />
            </button>
            {finished ? (
              <div className="result">
                <Sprout size={48} />
                <span className="eyebrow">ONE STEP FORWARD</span>
                <h2>오늘도 한 걸음 쌓았어요!</h2>
                <p>
                  {quiz.length}문제 중 {correct}문제 정답
                </p>
                <p>틀린 단어는 오답 복습에 저장했어요.</p>
                <button
                  className="primary"
                  onClick={() => {
                    setQuiz(null);
                    setTab('오답 복습');
                  }}
                >
                  복습할 단어 보기 <ArrowRight size={17} />
                </button>
              </div>
            ) : (
              <>
                <span className="eyebrow">
                  WORD QUIZ · {step + 1} / {quiz.length}
                </span>
                <div className="progress">
                  <i style={{ width: (step / quiz.length) * 100 + '%' }} />
                </div>
                <p className="quiz-prompt">이 단어의 뜻은 무엇일까요?</p>
                <h2 className="quiz-word" lang="ja">
                  {words[quiz[step]].word}
                </h2>
                <button className="quiz-reading" onClick={() => speak(words[quiz[step]].reading)}>
                  {words[quiz[step]].reading} <Volume2 size={17} />
                </button>
                <div className="answers">
                  {words[quiz[step]].choices.map((c) => (
                    <button
                      disabled={!!answer}
                      className={
                        answer
                          ? c === words[quiz[step]].meaning
                            ? 'correct'
                            : c === answer
                              ? 'incorrect'
                              : ''
                          : ''
                      }
                      onClick={() => choose(c)}
                      key={c}
                    >
                      {c}
                      {answer && c === words[quiz[step]].meaning && <Check size={18} />}
                    </button>
                  ))}
                </div>
                {answer && (
                  <div className="feedback">
                    <strong>
                      {answer === words[quiz[step]].meaning
                        ? '잘했어요!'
                        : '괜찮아요, 다시 기억해 봐요.'}
                    </strong>
                    <p>{words[quiz[step]].example}</p>
                    <small>{words[quiz[step]].translation}</small>
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
                      {step === quiz.length - 1 ? '결과 보기' : '다음 단어'}
                      <ArrowRight size={17} />
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}
      {detail !== null && (
        <div className="modal-backdrop">
          <section
            className="modal grammar-detail"
            role="dialog"
            aria-modal="true"
            aria-label="문법 설명"
          >
            <button className="close" aria-label="문법 닫기" onClick={() => setDetail(null)}>
              <X />
            </button>
            <span className="eyebrow">GRAMMAR NOTE</span>
            <h2>{grammar[detail].title}</h2>
            <h3>{grammar[detail].meaning}</h3>
            <p>{grammar[detail].desc}</p>
            <div className="example">
              <span>예문</span>
              <p>{grammar[detail].example}</p>
              <small>{grammar[detail].ko}</small>
              <button
                className="sound"
                aria-label="예문 듣기"
                onClick={() => speak(grammar[detail].example)}
              >
                <Headphones size={20} />
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
