import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync('dist/sw.js','utf8');
function worker({login=false,offline=false,navigationLogin=false}={}) {
  const listeners={}, stores=new Map();
  let puts=0;
  const cache={put:async(k,v)=>{stores.set(k,v);puts++;},match:async k=>stores.get(k)};
  const self={location:{origin:'https://haru.test'},addEventListener:(name,cb)=>listeners[name]=cb,clients:{claim:async()=>{}},skipWaiting:()=>{}};
  const fetch=async request=>{
    const path=new URL(typeof request==='string'?request:request.url,'https://haru.test').pathname;
    if(offline)throw new Error('offline');
    if(navigationLogin)return new Response('Sign in',{status:403});
    return new Response(path==='/index.html'?(login?'Sign in':'<meta name="haru-app" content="1">'):'asset',{headers:{'Content-Type':path==='/index.html'?'text/html':'application/octet-stream'}});
  };
  class LocalRequest extends Request {constructor(path,options){super(new URL(path,'https://haru.test'),options);}}
  const context=vm.createContext({self,caches:{open:async()=>cache,keys:async()=>[],delete:async()=>true},fetch,Request:LocalRequest,Response,URL,Set,Promise,Error});
  vm.runInContext(source,context);
  async function lifecycle(type){let done;listeners[type]({waitUntil:p=>done=p});await done;}
  function request(path,mode='navigate') {let response;listeners.fetch({request:{method:'GET',url:'https://haru.test'+path,mode},respondWith:p=>response=p});return response;}
  return {stores,lifecycle,request,puts:()=>puts,cache};
}
test('manifest icons and standalone launch are valid',()=>{
 const manifest=JSON.parse(readFileSync('dist/manifest.webmanifest','utf8'));
 assert.equal(manifest.display,'standalone');assert.equal(manifest.start_url,'/');
 for(const icon of manifest.icons){const file='dist'+icon.src;assert.ok(existsSync(file));const bytes=readFileSync(file);assert.equal(bytes.readUInt32BE(16),Number(icon.sizes.split('x')[0]));}
 assert.ok(source.includes('haru-pwa-'));assert.ok(!source.includes('__PRECACHE_URLS__'));
});
test('precache rejects login HTML atomically',async()=>{const w=worker({login:true});await assert.rejects(w.lifecycle('install'));assert.equal(w.puts(),0);});
test('a complete app downloads before activation',async()=>{const w=worker();await w.lifecycle('install');assert.ok(w.stores.has('/index.html'));assert.ok([...w.stores.keys()].some(k=>k.endsWith('.js')));});
test('offline home opens the saved application',async()=>{const w=worker({offline:true});await w.cache.put('/index.html',new Response('saved app'));assert.equal(await(await w.request('/')).text(),'saved app');});
test('online access denial is not replaced by an offline page',async()=>{const w=worker({navigationLogin:true});await w.cache.put('/index.html',new Response('saved app'));assert.equal((await w.request('/')).status,403);});
test('auth routes, callbacks and external requests are not intercepted',()=>{const w=worker();assert.equal(w.request('/signin-with-chatgpt'),undefined);assert.equal(w.request('/?code=private'),undefined);assert.equal(w.request('/api/session'),undefined);});
