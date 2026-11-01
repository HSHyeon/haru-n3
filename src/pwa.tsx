import { useEffect, useState } from 'react';
import { Check, Download, RefreshCw, Smartphone, WifiOff } from 'lucide-react';

type InstallEvent = Event & {prompt:()=>Promise<void>; userChoice:Promise<{outcome:'accepted'|'dismissed'}>};
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & {standalone?:boolean}).standalone === true;
const production = (import.meta as ImportMeta & {env:{PROD:boolean}}).env.PROD;

export function PwaControls() {
  const [install, setInstall] = useState<InstallEvent|null>(null);
  const [installed, setInstalled] = useState(isStandalone);
  const [online, setOnline] = useState(navigator.onLine);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [help, setHelp] = useState(false);
  const [installMessage, setInstallMessage] = useState('');
  const [waiting, setWaiting] = useState<ServiceWorker|null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let live = true;
    let registration:ServiceWorkerRegistration|undefined;
    let reloadRequested = false;
    const connection = () => setOnline(navigator.onLine);
    const prompt = (event:Event) => { event.preventDefault(); setInstall(event as InstallEvent); };
    const appInstalled = () => { setInstalled(true); setInstall(null); setHelp(false); };
    const controllerChange = () => { if (reloadRequested) window.location.reload(); };
    const applyUpdate = () => { reloadRequested = true; };
    window.addEventListener('online',connection);
    window.addEventListener('offline',connection);
    window.addEventListener('beforeinstallprompt',prompt);
    window.addEventListener('appinstalled',appInstalled);
    window.addEventListener('haru-update',applyUpdate);
    const serviceWorker = navigator.serviceWorker;
    const checkCache = (worker:ServiceWorker|null) => {
      if (!worker) return;
      const channel = new MessageChannel();
      const timer = window.setTimeout(()=>channel.port1.close(),5000);
      channel.port1.onmessage = event => {
        clearTimeout(timer); channel.port1.close();
        if (live) setReady(event.data?.ready === true);
      };
      worker.postMessage({type:'CACHE_STATUS'},[channel.port2]);
    };
    if ('serviceWorker' in navigator && production) {
      serviceWorker.addEventListener('controllerchange',controllerChange);
      serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'}).then(reg => {
        if (!live) return;
        registration = reg;
        setWaiting(reg.waiting);
        checkCache(reg.active);
        const observe = () => {
          const worker = reg.installing;
          worker?.addEventListener('statechange',()=>{
            if (!live) return;
            if (worker.state === 'installed' && serviceWorker.controller) setWaiting(reg.waiting || worker);
            if (worker.state === 'activated') {setFailed(false); checkCache(worker);}
            if (worker.state === 'redundant') setFailed(true);
          });
        };
        reg.addEventListener('updatefound',observe);
        if (reg.installing) observe();
        const timer = window.setTimeout(()=>{if(live && !reg.active && !reg.waiting) setFailed(true);},15000);
        serviceWorker.ready.then(active => {clearTimeout(timer); if(live) checkCache(active.active);}).catch(()=>{if(live)setFailed(true);});
      }).catch(()=>{if(live)setFailed(true);});
    }
    const visible = () => {if(document.visibilityState==='visible') registration?.update().catch(()=>{});};
    document.addEventListener('visibilitychange',visible);
    return () => {
      live=false;
      window.removeEventListener('online',connection); window.removeEventListener('offline',connection);
      window.removeEventListener('beforeinstallprompt',prompt); window.removeEventListener('appinstalled',appInstalled);
      window.removeEventListener('haru-update',applyUpdate);
      serviceWorker?.removeEventListener('controllerchange',controllerChange);
      document.removeEventListener('visibilitychange',visible);
    };
  },[]);

  async function installApp() {
    if (!install) {setHelp(value=>!value);return;}
    try {
      await install.prompt();
      const choice=await install.userChoice;
      setInstall(null); setHelp(true);
      setInstallMessage(choice.outcome==='accepted'?'Chrome에 설치를 요청했어요. 설치 완료는 휴대폰에서 확인해 주세요.':'설치를 취소했어요. Chrome 메뉴에서 다시 시도할 수 있어요.');
    } catch {
      setInstall(null);setHelp(true);
      setInstallMessage('설치 요청을 완료하지 못했어요. 아래 안내를 확인해 주세요.');
    }
  }
  function updateApp() {
    if (!waiting) return;
    window.dispatchEvent(new Event('haru-update'));
    setUpdating(true);
    waiting.postMessage({type:'SKIP_WAITING'});
  }
  return <section className="pwa-panel" aria-label="앱 설치와 오프라인 상태">
    <div className="pwa-summary"><div className="pwa-symbol"><Smartphone size={23}/></div><div className="pwa-copy"><h2>{installed?'내 손안의 작은 공부방':'하루를 홈 화면에 담아 보세요'}</h2><p>{installed?'오늘도, 좋아하는 마음으로 한 걸음.':'앱처럼 열고, 저장된 단어는 오프라인에서도 복습해요.'}</p><span className="pwa-status" role="status">{!online?<><WifiOff size={12}/>{ready?'오프라인 학습 중':'인터넷 연결이 필요해요'}</>:ready?<><Check size={12}/>오프라인 준비 완료</>:failed?'오프라인 저장을 마치지 못했어요. 온라인에서 다시 열어 주세요.':production?'오프라인 학습 파일 준비 중…':'설치·오프라인 기능은 배포 버전에서 사용할 수 있어요.'}</span></div>{!installed&&<button className="pwa-action" onClick={installApp}><Download size={14}/>{install?'앱 설치':'설치 방법'}</button>}</div>
    {help&&!installed&&<div className="pwa-help"><h3>휴대폰에서 이렇게 추가해요</h3>{installMessage&&<p role="status">{installMessage}</p>}<p><b>iPhone · Safari</b><br/>공유 메뉴 → 홈 화면에 추가 → 추가</p><p><b>Android · Chrome</b><br/>메뉴(⋮) → 앱 설치 또는 홈 화면에 추가</p><p><b>Chrome에서 설치할 수 없다고 나오나요?</b><br/>먼저 이 페이지를 새로고침하고 로그인 상태를 확인해 주세요. 시크릿 모드나 다른 앱 안의 브라우저 대신 일반 Chrome 탭에서 시도해 주세요. 계속 실패하면 오류 문구를 알려주세요. 브라우저가 제공하는 경우 홈 화면 바로가기로 추가해 사용할 수도 있어요.</p><small>ChatGPT 안의 브라우저라면 주소를 Safari나 Chrome으로 열어 주세요. 최초 로그인과 학습 파일 다운로드에는 인터넷이 필요해요.</small><p className="pwa-private">이 기기에 학습 화면을 저장해요. 공용 기기에서는 설치하지 않는 편이 좋아요. 학습 기록은 기기 간 동기화되지 않아요.</p></div>}
    {waiting&&<div className="pwa-update" role="status"><div><b>새로운 하루가 준비됐어요</b><span>퀴즈와 메모를 마친 뒤 업데이트해 주세요. 화면이 새로고침돼요.</span></div><button className="pwa-action" disabled={updating} onClick={updateApp}><RefreshCw size={14}/>{updating?'업데이트 중…':'업데이트'}</button></div>}
  </section>;
}
