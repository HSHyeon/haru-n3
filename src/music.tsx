import { useState } from 'react';
import { ArrowRight, Check, Headphones, Moon, Music2, Volume2 } from 'lucide-react';

export const musicWords = [
  {
    word: '音',
    reading: 'おと',
    pronunciation: '오토',
    meaning: '소리',
    example: '雨の音を聞いています。',
    translation: '빗소리를 듣고 있어요.',
    choices: ['소리', '밤', '하늘', '바람'],
  },
  {
    word: '声',
    reading: 'こえ',
    pronunciation: '코에',
    meaning: '목소리',
    example: 'あの人の声が好きです。',
    translation: '그 사람의 목소리를 좋아해요.',
    choices: ['이름', '목소리', '마음', '노래'],
  },
  {
    word: '夜',
    reading: 'よる',
    pronunciation: '요루',
    meaning: '밤',
    example: '夜に音楽を聞きます。',
    translation: '밤에 음악을 들어요.',
    choices: ['아침', '여름', '밤', '하늘'],
  },
  {
    word: '風',
    reading: 'かぜ',
    pronunciation: '카제',
    meaning: '바람',
    example: '窓から風が入ってきます。',
    translation: '창문으로 바람이 들어와요.',
    choices: ['구름', '비', '빛', '바람'],
  },
  {
    word: '空',
    reading: 'そら',
    pronunciation: '소라',
    meaning: '하늘',
    example: '青い空を見ています。',
    translation: '푸른 하늘을 보고 있어요.',
    choices: ['하늘', '바다', '길', '꽃'],
  },
  {
    word: '歌',
    reading: 'うた',
    pronunciation: '우타',
    meaning: '노래',
    example: '好きな歌を歌います。',
    translation: '좋아하는 노래를 불러요.',
    choices: ['이야기', '노래', '소리', '꿈'],
  },
];

export function RecordArt() {
  return (
    <div className="record-scene" aria-hidden="true">
      <div className="moon-disc" />
      <span className="star star-one">✧</span>
      <span className="star star-two">✦</span>
      <div className="record-sleeve">
        <span>OTOBA RECORDS</span>
        <div className="sleeve-window">
          <div className="sleeve-moon" />
          <div className="sleeve-hill" />
        </div>
        <div className="sleeve-title">好き、から始まる。</div>
        <small>JAPANESE · SIDE A</small>
      </div>
      <div className="vinyl">
        <div>
          音<span>33 RPM</span>
        </div>
      </div>
      <div className="record-caption">a little japanese, a little music.</div>
    </div>
  );
}

export function MusicRoom({
  start,
  speak,
  learned,
}: {
  start: () => void;
  speak: (value: string) => void;
  learned: number;
}) {
  const [showGuide, setShowGuide] = useState(true);
  const [note, setNote] = useState(() => {
    try {
      return localStorage.getItem('haru-listening-note') || '';
    } catch {
      return '';
    }
  });
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);
  function saveNote() {
    try {
      localStorage.setItem('haru-listening-note', note);
      setSaved(true);
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }
  return (
    <div className="music-room">
      <section className="music-intro">
        <div>
          <span className="eyebrow">SIDE A / FIRST WORDS</span>
          <h2>
            좋아하는 음악이,
            <br />
            공부의 시작이 되도록.
          </h2>
          <p>
            요루시카를 좋아하는 나를 위한 작은 일본어 방.
            <br />
            우선 소리, 밤, 바람처럼 쉬운 단어부터 만나 봐요.
          </p>
          <div className="music-intro-tags">
            <span>
              <Headphones size={13} /> J-POP과 함께
            </span>
            <span>기초 · 6개 단어</span>
            <span>{learned} / 6 학습</span>
          </div>
        </div>
        <div className="room-symbol" aria-hidden="true">
          <Moon size={65} strokeWidth={0.7} />
          <Music2 size={24} strokeWidth={1} />
        </div>
      </section>
      <div className="music-toolbar">
        <div>
          <h2>듣고 싶은 말, 읽을 수 있는 말</h2>
          <p>직접 만든 학습 예문으로, 한 단어씩 천천히.</p>
        </div>
        <label className="guide-toggle">
          <input
            type="checkbox"
            checked={showGuide}
            onChange={(e) => setShowGuide(e.target.checked)}
          />{' '}
          발음 힌트
        </label>
      </div>
      <div className="music-word-grid">
        {musicWords.map((word, i) => (
          <article className="music-word" key={word.word}>
            <div className="music-word-top">
              <span>TRACK 0{i + 1}</span>
              <button
                className="sound"
                aria-label={`${word.word} 발음 듣기`}
                onClick={() => speak(word.reading)}
              >
                <Volume2 size={17} />
              </button>
            </div>
            <div className="music-word-body">
              <span className="music-kanji" lang="ja">
                {word.word}
              </span>
              <div>
                <span lang="ja">{word.reading}</span>
                {showGuide && <small>{word.pronunciation}</small>}
                <h3>{word.meaning}</h3>
              </div>
            </div>
            <p lang="ja">{word.example}</p>
            <small>{word.translation}</small>
          </article>
        ))}
      </div>
      <div className="music-practice">
        <div>
          <span className="eyebrow">ONE SMALL LISTEN</span>
          <h3>익숙해졌다면, 기억해 볼까요?</h3>
          <p>방금 만난 단어로 6문제. 헷갈린 단어는 오답 복습에 모여요.</p>
        </div>
        <button className="primary" onClick={start}>
          음악 단어 퀴즈 <ArrowRight size={17} />
        </button>
      </div>
      <section className="listening-note">
        <div className="section-title">
          <h2>
            <Headphones size={17} /> 나의 감상 노트
          </h2>
          <span className="tiny-label">PERSONAL LINER NOTES</span>
        </div>
        <label htmlFor="listening-note">
          오늘 들은 곡, 기억하고 싶은 단어, 떠오른 장면을 적어 보세요.
        </label>
        <textarea
          id="listening-note"
          maxLength={2000}
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            setSaved(false);
          }}
          placeholder="오늘 들은 곡은…\n들리는 단어를 하나 발견했다!"
        />
        <div className="note-actions">
          <span role="status">
            {saveError
              ? '저장 공간을 확인해 주세요.'
              : saved
                ? '이 브라우저에 저장했어요.'
                : '내 브라우저에만 보관하는 작은 기록'}
          </span>
          <button className="note-save" onClick={saveNote}>
            {saved && <Check size={14} />} {saved ? '저장 완료' : '노트 저장'}
          </button>
        </div>
      </section>
      <p className="music-credit">
        음악을 좋아하는 마음에서 만든 개인 학습 코스예요. 예문은 학습용 창작 문장입니다.
        <br />
        한국어 발음 힌트는 대략적인 소리 안내예요. 듣기는 브라우저의 일본어 음성으로 재생됩니다.
      </p>
    </div>
  );
}
