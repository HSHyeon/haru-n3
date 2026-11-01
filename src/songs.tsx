import { useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, ExternalLink, Headphones, Play, RotateCcw, Volume2 } from 'lucide-react';
import courses from './data/song-courses.json';
import { MusicRoom } from './music';
export const songCourses = courses;
export const songWords = courses.flatMap(course=>course.words);
// IDs 0–11 are existing vocabulary. Append new words to preserve old records.
export const SONG_WORD_OFFSET = 12;
export function courseWordIds(index:number) {
  const before = courses.slice(0,index).reduce((n,course)=>n+course.words.length,0);
  return courses[index].words.map((_,i)=>SONG_WORD_OFFSET+before+i);
}
type Course = typeof courses[number];
type Answers = Record<string,number>;
function readAnswers():Answers {
  try { const raw=JSON.parse(localStorage.getItem('haru-song-grammar-v1')||'{}');return raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{}; } catch{return {};}
}

export function SongLibrary({start,speak,done,wrong}:{start:(ids:number[])=>void;speak:(text:string)=>void;done:number[];wrong:number[]}) {
  const [selected,setSelected] = useState<number|null>(null);
  const [foundation,setFoundation] = useState(false);
  const [answers,setAnswers] = useState<Answers>(readAnswers);
  const [storageError,setStorageError] = useState(false);
  const [reviewOnly,setReviewOnly] = useState(false);
  const save=(next:Answers)=>{setAnswers(next);try{localStorage.setItem('haru-song-grammar-v1',JSON.stringify(next));setStorageError(false);}catch{setStorageError(true);}};
  const select=(index:number|null)=>{setSelected(index);setReviewOnly(false);window.scrollTo({top:0,behavior:'instant'});};
  const completed=(index:number)=>{
    const course=courses[index];
    return courseWordIds(index).every(id=>done.includes(id)&&!wrong.includes(id))&&course.grammar.every((g,i)=>answers[`${course.id}-${i}`]===g.answer);
  };
  const mistakes=courses.flatMap((course,index)=>course.grammar.flatMap((g,i)=>{
    const key=`${course.id}-${i}`;return key in answers&&answers[key]!==g.answer?[{courseIndex:index,grammarIndex:i}]:[];
  }));
  if(foundation) return <><button className="back-link" onClick={()=>{setFoundation(false);window.scrollTo(0,0);}}><ArrowLeft size={16}/> 곡 목록으로</button><MusicRoom start={()=>start([6,7,8,9,10,11])} speak={speak} learned={done.filter(id=>id>=6&&id<12).length}/></>;
  return <div className="song-library">
    {selected===null?<>
      <section className="song-library-intro"><div><span className="eyebrow">YORUSHIKA / STUDY COLLECTION 01</span><h2>한 곡을 듣고,<br/>한 문장 더 이해하는 시간.</h2><p>내가 좋아하는 음악에서 시작하는 N3 공부.<br/>3곡의 테마를 따라 단어와 문법을 차곡차곡 익혀요.</p><div className="collection-meta"><span>3 TRACKS</span><span>단어 12개</span><span>문법 6개</span><span>{courses.filter((_,i)=>completed(i)).length} / 3 코스 완료</span></div></div><div className="collection-art" aria-hidden="true"><div/><i/><span>は<br/><small>SIDE N3</small></span></div></section>
      <div className="section-title song-section-title"><h2>나의 학습 플레이리스트</h2><span className="tiny-label">LISTEN → LEARN → REMEMBER</span></div>
      <div className="song-grid">{courses.map((course,index)=><button className="song-card" key={course.id} onClick={()=>select(index)}><div className={`song-cover ${course.color}`} aria-hidden="true"><span>0{index+1} / YORUSHIKA</span><div className="cover-shape"/><b>{course.title}</b><small>ORIGINAL STUDY ART</small></div><div className="song-card-body"><span className="course-tag">{course.season}</span><h3 lang="ja">{course.title}</h3><p>{course.korean} · {course.theme}</p><div className="song-card-tags"><span>N3 학습용</span><span>약 10분</span>{completed(index)&&<span className="song-completed"><Check size={11}/> 완료</span>}</div><div className="song-progress-label"><span>단어 {courseWordIds(index).filter(id=>done.includes(id)).length}/4 · 문법 {course.grammar.filter((_,i)=>`${course.id}-${i}` in answers).length}/2</span><ArrowRight size={17}/></div></div></button>)}</div>
      <div className="song-bottom-actions"><button className="foundation-link" onClick={()=>{setFoundation(true);window.scrollTo(0,0);}}><BookOpen size={20}/><span><b>아직 읽기가 낯설다면</b><small>소리·밤·바람, 기초 음악 단어 6개부터</small></span><ArrowRight size={17}/></button><button className="foundation-link" onClick={()=>setReviewOnly(value=>!value)}><RotateCcw size={20}/><span><b>곡별 문법 오답</b><small>{mistakes.length}문제 다시 풀기</small></span><ArrowRight size={17}/></button></div>
      {reviewOnly&&<section className="song-grammar-review"><h3>헷갈렸던 문법 다시 보기</h3>{mistakes.length?mistakes.map(({courseIndex,grammarIndex})=><button className="grammar-review-link" key={`${courseIndex}-${grammarIndex}`} onClick={()=>select(courseIndex)}><span>{courses[courseIndex].title} · {courses[courseIndex].grammar[grammarIndex].pattern}</span><ArrowRight size={16}/></button>):<p>아직 문법 오답이 없어요. 곡을 선택하고 확인 문제를 풀어 보세요.</p>}</section>}
      <p className="song-disclaimer">곡의 제목과 감상 테마에 연결한 학습용 창작 예문·문제입니다. 실제 가사에서 뽑은 표현이나 가사 해설은 아니에요. 어휘에는 기초 복습을 포함하며, 문법은 N3 대비를 위한 학습 범위로 구성했습니다.</p>
    </>:<SongDetail key={courses[selected].id} course={courses[selected]} index={selected} back={()=>select(null)} speak={speak} start={()=>start(courseWordIds(selected))} done={done} wrong={wrong} answers={answers} choose={(i,value)=>save({...answers,[`${courses[selected].id}-${i}`]:value})} reset={()=>{const next={...answers};courses[selected].grammar.forEach((_,i)=>delete next[`${courses[selected].id}-${i}`]);save(next);}} completed={completed(selected)}/>}
    {storageError&&<p role="alert" className="song-storage-error">학습 결과를 저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.</p>}
  </div>;
}

function SongDetail({course,index,back,speak,start,done,wrong,answers,choose,reset,completed}:{course:Course;index:number;back:()=>void;speak:(s:string)=>void;start:()=>void;done:number[];wrong:number[];answers:Answers;choose:(i:number,value:number)=>void;reset:()=>void;completed:boolean}) {
  const [step,setStep]=useState(0);
  const [player,setPlayer]=useState(false);
  const [note,setNote]=useState(()=>{try{return localStorage.getItem(`haru-song-note-${course.id}`)||'';}catch{return '';}});
  const [noteStatus,setNoteStatus]=useState('');
  const move=(value:number)=>{setStep(value);window.scrollTo({top:0,behavior:'instant'});};
  const allAnswered=course.grammar.every((_,i)=>`${course.id}-${i}` in answers);
  const score=course.grammar.filter((g,i)=>answers[`${course.id}-${i}`]===g.answer).length;
  return <div className="song-detail">
    <button className="back-link" onClick={back}><ArrowLeft size={16}/> 플레이리스트로</button>
    <section className={`song-detail-heading ${course.color}`}><span className="eyebrow">TRACK 0{index+1} / {course.season}</span><h2 lang="ja">{course.title}</h2><span className="song-title-reading">{course.reading} · {course.korean}</span><p>{course.intro}</p><div className="song-card-tags"><span>N3 학습용</span><span>단어 4개 · 문법 2개</span>{completed&&<span><Check size={12}/> 코스 완료</span>}</div></section>
    <nav className="lesson-steps" aria-label="곡 학습 단계">{['듣기','단어','문법','확인·기록'].map((label,i)=><button key={label} aria-current={step===i?'step':undefined} className={step===i?'selected':''} onClick={()=>move(i)}><span>0{i+1}</span>{label}</button>)}</nav>
    {step===0&&<section className="song-listen"><div className="section-title"><h2>먼저, 좋아하는 곡을 들어요</h2><Headphones size={19}/></div>{player?<div className="video-frame"><iframe title={`${course.title} 공식 음악 영상`} src={`https://www.youtube-nocookie.com/embed/${course.videoId}?playsinline=1`} allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/></div>:<button className={`video-placeholder ${course.color}`} onClick={()=>setPlayer(true)}><span className="play-circle"><Play size={27}/></span><strong lang="ja">{course.title}</strong><span>공식 영상 불러오기</span></button>}<div className="video-links"><a href={`https://www.youtube.com/watch?v=${course.videoId}`} target="_blank" rel="noreferrer">YouTube에서 듣기 <ExternalLink size={13}/></a><a href={course.source} target="_blank" rel="noreferrer">아티스트 공식 출처 <ExternalLink size={13}/></a></div><p className="video-hint">영상은 눌렀을 때 YouTube에서 불러옵니다. 인터넷 연결이 필요하며, 앱 내 재생이 제한되면 YouTube에서 열어 주세요.</p><div className="listening-mission"><span className="eyebrow">TODAY'S LISTENING NOTE</span><h3>어떤 장면이 떠오르나요?</h3><p>모르는 말은 잠시 두고, {course.theme}에 어울리는 장면을 떠올려 보세요. 이어지는 창작 예문으로 그 장면을 말하는 연습을 해요.</p></div><button className="primary" onClick={()=>move(1)}>단어 4개 만나기 <ArrowRight size={16}/></button></section>}
    {step===1&&<section><div className="section-title"><h2>오늘 가져갈 단어 4개</h2><span className="tiny-label">WORDS TO KEEP</span></div><div className="song-vocabulary">{course.words.map((word,i)=><article className="word-card" key={word.word}><div><span className="course-tag">N3 코스 · 복습 포함</span><button className="sound" aria-label={`${word.word} 발음 듣기`} onClick={()=>speak(word.reading)}><Volume2 size={17}/></button></div><h2 lang="ja">{word.word}</h2><span>{word.reading}</span><h3>{word.meaning}</h3><p lang="ja">{word.example}</p><small>{word.translation}</small>{done.includes(courseWordIds(index)[i])&&<span className="learned"><Check size={12}/>{wrong.includes(courseWordIds(index)[i])?'복습이 필요한 단어':'확인한 단어'}</span>}</article>)}</div><div className="lesson-next"><button className="primary" onClick={start}>이 곡의 단어 퀴즈 <ArrowRight size={16}/></button><button className="secondary-button" onClick={()=>move(2)}>문법으로 이어가기 <ArrowRight size={16}/></button></div><p className="song-disclaimer">이 단어와 예문은 코스 주제에 맞춰 선정·작성했어요. 가사에 나오는 단어 목록은 아닙니다.</p></section>}
    {step===2&&<section><div className="section-title"><h2>장면을 문장으로 바꾸는 문법</h2><span className="tiny-label">TWO EXPRESSIONS</span></div><div className="song-grammar">{course.grammar.map((g,i)=><article key={g.pattern}><span className="eyebrow">GRAMMAR 0{i+1}</span><h3>{g.pattern}</h3><b>{g.meaning}</b><p>{g.explanation}</p><div className="grammar-connection">연결 · {g.connection}</div><div className="song-example"><button className="sound" aria-label={`${g.pattern} 예문 듣기`} onClick={()=>speak(g.example)}><Volume2 size={17}/></button><p lang="ja">{g.example}</p><small>{g.translation}</small></div></article>)}</div><div className="lesson-next"><button className="primary" onClick={()=>move(3)}>문법 확인 문제 풀기 <ArrowRight size={16}/></button></div></section>}
    {step===3&&<section><div className="section-title"><h2>이해했는지, 가볍게 확인해요</h2><span className="tiny-label">CHECK & REMEMBER</span></div><div className="song-questions">{course.grammar.map((g,i)=>{const key=`${course.id}-${i}`,answered=key in answers,correct=answers[key]===g.answer;return <article key={key}><span className="eyebrow">QUESTION 0{i+1}</span><h3>{g.question}</h3><p className="question-sentence" lang="ja">{g.sentence}</p><div className="answers">{g.choices.map((value,j)=><button key={value} disabled={answered} className={answered?(j===g.answer?'correct':j===answers[key]?'incorrect':''):''} onClick={()=>choose(i,j)}>{value}{answered&&j===g.answer&&<Check size={16}/>}</button>)}</div>{answered&&<div className="question-explanation" role="status"><strong>{correct?'잘 이해했어요!':'괜찮아요, 이유를 함께 볼까요?'}</strong><p>{g.reason}</p></div>}</article>;})}</div>{allAnswered&&<div className="song-result" role="status"><span><Check size={21}/>문법 {score} / 2 정답</span><p>{score===2?'두 표현을 모두 이해했어요. 단어까지 확인하면 코스 완료예요.':'틀린 문제는 플레이리스트의 문법 오답에 모았어요.'}</p><button className="secondary-button" onClick={reset}><RotateCcw size={14}/> 문법 다시 풀기</button></div>}<section className="listening-note"><h3>이 곡에 남기는 나의 한 줄</h3><label htmlFor="song-note">떠오른 장면이나 오늘 배운 표현을 기록해 보세요.</label><textarea id="song-note" value={note} maxLength={2000} onChange={e=>{setNote(e.target.value);setNoteStatus('');}} placeholder="오늘 기억할 단어는…"/><div className="note-actions"><span role="status">{noteStatus||'이 브라우저에만 저장돼요.'}</span><button className="note-save" onClick={()=>{try{localStorage.setItem(`haru-song-note-${course.id}`,note);setNoteStatus('이 곡의 노트를 저장했어요.');}catch{setNoteStatus('저장 공간을 확인해 주세요.');}}}>노트 저장</button></div></section><div className="lesson-next"><button className="primary" onClick={back}>다른 곡 만나기 <ArrowRight size={16}/></button></div></section>}
  </div>;
}
