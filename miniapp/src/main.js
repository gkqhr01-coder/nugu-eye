import { NavigationBar, Share, File as AitFile, requestPermission, openCamera, getOperationalEnvironment } from '@apps-in-toss/web-framework';

(() => {

/* 토스 앱(또는 샌드박스) 안인지. 밖에서는 웹 기능으로 동작해요. */
const IN_TOSS = (() => { try { return !!getOperationalEnvironment(); } catch (e) { return false; } })();

/* 화면별 토스 내비게이션 바: 시작·결과는 흰 배경, 카메라·권한 없음은 투명 + 어두운 테마 */
const NAV = {
  home:   { withBackButton:false, withTitle:true,  transparentBackground:false, theme:'light' },
  result: { withBackButton:true,  withTitle:true,  transparentBackground:false, theme:'light' },
  cam:    { withBackButton:true,  withTitle:false, transparentBackground:true,  theme:'dark' },
  denied: { withBackButton:true,  withTitle:false, transparentBackground:true,  theme:'dark' },
};
function setNav(id){ if(!IN_TOSS || !NAV[id]) return; NavigationBar.setOptions(NAV[id]).catch(()=>{}); }

async function saveCard(){
  await AitFile.saveBase64({ data: state.cardURL.split(',')[1], fileName: `눈맞춤-${Date.now()}.jpg`, mimeType: 'image/jpeg' });
}
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

/* ---------- 데이터 ---------- */
const ICON = {
  baby:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 5c0-1.6 1.6-2.4 2.6-1.4"/><path d="M9.5 15.5c1.4 1.2 3.6 1.2 5 0"/><circle cx="9.5" cy="12" r=".7" fill="currentColor"/><circle cx="14.5" cy="12" r=".7" fill="currentColor"/></svg>',
  dog:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 8c-2-1-4 1-4 4s1 4 2.5 3.5"/><path d="M17 8c2-1 4 1 4 4s-1 4-2.5 3.5"/><path d="M7 8.5C7.5 6 9.5 5 12 5s4.5 1 5 3.5l.5 5.5c0 3-2.5 5-5.5 5s-5.5-2-5.5-5z"/><circle cx="10" cy="11.5" r=".7" fill="currentColor"/><circle cx="14" cy="11.5" r=".7" fill="currentColor"/><path d="M11 15h2l-1 1z"/></svg>',
  cat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4l3 4h8l3-4v9c0 4-3 7-7 7s-7-3-7-7z"/><circle cx="9.5" cy="12" r=".7" fill="currentColor"/><circle cx="14.5" cy="12" r=".7" fill="currentColor"/><path d="M11 15h2l-1 1z"/></svg>'
};
const CHEV='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B95A1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
const CHECK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>';

const HUMAN = {cpd:30,cvd:0,tri:0,sat:1,con:1,gam:1,gain:1,vig:9};
const AGES = [
  {name:'신생아', p:{cpd:1.0,cvd:0,tri:1,sat:.10,con:.45,gam:1,gain:1,vig:.22}, stat:'시력 0.03 정도 · 색은 거의 못 봐요',
   tip:'신생아는 20~30cm 앞 얼굴의 윤곽과 명암을 알아봐요. 색은 아직 거의 구분하지 못해요.',
   kv:[['시력','약 20/400~20/800'],['색','밝고 어두운 차이 위주'],['잘 보이는 거리','20~30cm']],
   desc:'눈앞 얼굴의 윤곽과 밝고 어두운 대비를 먼저 알아봐요. 시야도 좌우 30° 안팎으로 좁아요.'},
  {name:'3개월', p:{cpd:2.5,cvd:0,tri:.6,sat:.6,con:.7,gam:1,gain:1,vig:.55}, stat:'시력 0.05~0.1 정도',
   tip:'3개월쯤엔 움직이는 걸 눈으로 따라가고, 색이 조금씩 또렷해져요.',
   kv:[['시력','약 20/200~20/400'],['색','점점 또렷해져요'],['새로 생긴 능력','움직임 따라보기']],
   desc:'빨강·초록부터 구분하기 시작하고, 파랑·노랑 계열은 조금 더 늦게 또렷해져요.'},
  {name:'6개월', p:{cpd:5,cvd:0,tri:.25,sat:.85,con:.82,gam:1,gain:1,vig:.78}, stat:'시력 0.1~0.25 정도',
   tip:'6개월쯤엔 색을 어른과 비슷하게 보고, 거리감도 생기기 시작해요.',
   kv:[['시력','약 20/80~20/200'],['색','어른과 비슷해요'],['새로 생긴 능력','거리감']],
   desc:'두 눈을 함께 쓰면서 무엇이 가깝고 먼지 느끼기 시작해요.'},
  {name:'12개월', p:{cpd:9,cvd:0,tri:0,sat:1,con:.94,gam:1,gain:1,vig:9}, stat:'시력 0.25~0.4 정도',
   tip:'돌 무렵엔 꽤 선명하게 봐요. 어른만큼 보려면 몇 년이 더 걸려요.',
   kv:[['시력','약 20/50~20/80'],['색','어른과 비슷해요'],['어른만큼 보는 시기','3~5살쯤']],
   desc:'기어다니며 멀리 있는 물건도 알아봐요. 선명도는 몇 년에 걸쳐 계속 좋아져요.'}
];
const MODES = {
  baby:{name:'아기', sub:'신생아부터 12개월까지 자라는 시력을 봐요',
        guide:'아이를 안았을 때처럼 20~30cm 앞에서 내 얼굴을 비춰보세요',
        cant:'아기는 20~30cm 거리에 초점이 가장 잘 맞아요. 카메라는 거리를 알 수 없어서 거리마다 다른 흐림은 담지 못해요.',
        src:'참고: 영아 시력 발달 기준(선호주시법 측정값). 아이마다 차이가 커요.'},
  dog:{name:'강아지', sub:'빨강과 초록이 비슷한 색으로 보여요', p:{cpd:8,cvd:1,tri:0,sat:1,con:.85,gam:.88,gain:1.08,vig:9},
       stat:'시력 0.3 정도 · 파랑과 노랑 위주로 봐요', guide:'휴대폰을 무릎 높이로 내려 나를 올려다보며 찍어보세요',
       tip:'강아지는 빨강과 초록을 비슷한 누런색으로 봐요. 잔디 위 빨간 공보다 파란 공을 더 잘 찾는 이유예요.',
       kv:[['구분하는 색','파랑·노랑 두 계열'],['선명도','사람의 약 4분의 1'],['사람보다 잘 보는 것','어두운 곳, 움직임']],
       desc:'빨강·주황·초록이 비슷한 누런색으로 보여요. 잔디밭에서 공을 던져줄 땐 파란 공이 잘 보여요.',
       cant:'강아지의 시야는 휴대폰 카메라보다 훨씬 넓어요.',
       src:'참고: Caves 외(2018) 동물 시력 비교, Machado 외(2009) 색각 모델. 재미로 보는 근사치예요.'},
  cat:{name:'고양이', sub:'색은 옅게, 어두운 곳은 밝게 봐요', p:{cpd:8.6,cvd:1,tri:0,sat:.6,con:.8,gam:.75,gain:1.15,vig:9},
       stat:'시력 0.15 정도 · 어두운 곳에 강해요', guide:'바닥 가까이에서 나를 올려다보며 찍어보세요. 불을 조금 꺼도 좋아요',
       tip:'고양이는 색을 옅게 보는 대신, 어두운 곳을 사람보다 훨씬 밝게 봐요.',
       kv:[['구분하는 색','강아지와 비슷, 더 옅게'],['선명도','사람의 약 7분의 1'],['사람보다 잘 보는 것','어두운 곳']],
       desc:'색은 옅게 보지만 아주 적은 빛으로도 볼 수 있어요. 밤에 눈이 빛나는 것도 빛을 한 번 더 모으는 구조 덕분이에요.',
       cant:'고양이는 아주 가까운 물체에 초점을 잘 맞추지 못한다고 알려져 있어요. 카메라는 거리를 알 수 없어서 담지 못해요.',
       src:'참고: Caves 외(2018) 동물 시력 비교, Machado 외(2009) 색각 모델. 재미로 보는 근사치예요.'}
};
const ORDER=['baby','dog','cat'];
const state = { mode:'dog', age:2, compare:true, split:.5, facing:'user', stream:null,
                src:null, srcW:0, srcH:0, isVideo:false, mirror:false, dirty:true,
                still:null, members:{baby:true,dog:true,cat:true}, names:{baby:'',dog:'',cat:''}, call:'엄마', cardURL:'' };
const CALLS=['엄마','아빠'];
const SUB = k => k==='baby' ? AGES[state.age].name : MODES[k].name;
const VOICE = {
  baby: c => state.age>=3 ? `이제 ${c} 얼굴이 꽤 또렷하게 보여요` : `세상은 아직 흐릿한데, ${c} 얼굴은 보여요`,
  dog:  () => '색은 잘 몰라도, 웃는 얼굴은 알아봐요',
  cat:  c => `불을 꺼도, ${c}는 내가 제일 잘 찾아요`
};
const P = () => state.mode==='baby' ? AGES[state.age].p : MODES[state.mode].p;
const modeLabel = (k=state.mode) => k==='baby' ? `아기 · ${AGES[state.age].name}` : MODES[k].name;

/* ---------- 화면 전환 ---------- */
let current='home';
function show(id){
  $$('.screen').forEach(s=>s.classList.toggle('on', s.id==='s-'+id));
  setNav(id);
  current=id; document.body.classList.toggle('isdark', id==='cam'||id==='denied');
  document.querySelector('meta[name=theme-color]').content = (id==='cam'||id==='denied') ? '#101114' : '#FFFFFF';
  if(id!=='cam') stopCam();
  window.scrollTo(0,0); state.dirty=true;
}
function go(id){ history.pushState({s:id},'' ); show(id); }
addEventListener('popstate', e=>{ closeSheet(); show(e.state?.s || 'home'); });
history.replaceState({s:'home'},'');
$$('[data-back]').forEach(b=>b.onclick=()=>history.back());

let toastT; function toast(m){ const t=$('#toast'); t.textContent=m; t.classList.add('on'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('on'),3200); }

/* ---------- 홈 ---------- */
$('#homeList').innerHTML = ORDER.map(k=>`<button class="it" data-mode="${k}"><span class="ph"><img src="assets/ex-${k}.jpg" alt="왼쪽은 내 눈, 오른쪽은 ${MODES[k].name} 눈으로 본 얼굴"><span class="pill l">내 눈</span><span class="pill r">${MODES[k].name}</span></span><span class="tx"><span><b>${MODES[k].name}의 눈</b><small>${MODES[k].sub}</small></span>${CHEV}</span></button>`).join('');
$$('#homeList .it').forEach(b=>b.onclick=()=>{ state.mode=b.dataset.mode; refreshCam(); startCam(); });
$('#startBtn').onclick=()=>{ refreshCam(); startCam(); };

/* ---------- 카메라 UI ---------- */
$('#seg').innerHTML = ORDER.map(k=>`<button data-k="${k}">${MODES[k].name}</button>`).join('');
$$('#seg button').forEach(b=>b.onclick=()=>{ state.mode=b.dataset.k; refreshCam(); });
function refreshCam(){
  $$('#seg button').forEach(b=>b.setAttribute('aria-pressed', b.dataset.k===state.mode));
  const baby = state.mode==='baby';
  $('#sub').innerHTML = (baby ? AGES.map((a,i)=>`<button class="chip" data-a="${i}" aria-pressed="${i===state.age}">${a.name}</button>`).join('') : '')
    + `<button class="chip cmp" id="cmpChip" aria-pressed="${state.compare}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M12 5v14"/></svg>반반 보기</button>`;
  if(baby) $$('#sub .chip[data-a]').forEach(c=>c.onclick=()=>{ state.age=+c.dataset.a; refreshCam(); });
  $('#cmpChip').onclick=()=>{ state.compare=!state.compare; refreshCam(); };
  $('#vf').classList.toggle('cmp', state.compare);
  $('#lblR').textContent = modeLabel();
  const d = baby ? AGES[state.age] : MODES[state.mode];
  $('#tipStat').textContent = d.stat; $('#tip').textContent = d.tip;
  $('#guide').textContent = MODES[state.mode].guide;
  state.dirty=true;
}

/* 비교선: 화면을 끌어서 옮겨요 (canvas는 object-fit: cover라 표시 영역 기준으로 환산) */
function coverBox(){ const r=gc.getBoundingClientRect(); const W=gc.width||1, H=gc.height||1;
  const s=Math.max(r.width/W, r.height/H); return {r, x0:(r.width-W*s)/2, dw:W*s}; }
function placeSplit(){ const b=coverBox(); $('#split').style.left = (b.x0 + state.split*b.dw)+'px'; }
let dragging=false;
function moveSplit(e){ const b=coverBox(); const u=(e.clientX-b.r.left-b.x0)/b.dw;
  state.split=Math.min(.92,Math.max(.08,u)); placeSplit(); state.dirty=true; }
$('#vf').addEventListener('pointerdown',e=>{ if(!state.compare || e.target.closest('.tip')) return; dragging=true; $('#vf').setPointerCapture(e.pointerId); moveSplit(e); });
$('#vf').addEventListener('pointermove',e=>{ if(dragging) moveSplit(e); });
['pointerup','pointercancel'].forEach(t=>$('#vf').addEventListener(t,()=>dragging=false));
addEventListener('resize',placeSplit);

/* ---------- 카메라 / 사진 ---------- */
const video=document.createElement('video'); video.playsInline=true; video.muted=true; video.setAttribute('playsinline',''); video.setAttribute('webkit-playsinline','');
function stopCam(){ if(state.stream){ state.stream.getTracks().forEach(t=>t.stop()); state.stream=null; } }
function setSource(el,w,h,isVideo,mirror){ state.src=el; state.srcW=w; state.srcH=h; state.isVideo=isVideo; state.mirror=mirror; state.dirty=true; }
async function startCam(){
  if(current!=='cam') go('cam');
  try{
    if(IN_TOSS){ const st=await requestPermission({name:'camera',access:'access'}); if(st!=='allowed') throw new Error('denied'); }
    if(!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');
    stopCam();
    state.stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:state.facing,width:{ideal:1280},height:{ideal:720}},audio:false});
    video.srcObject=state.stream; await video.play();
    const ok=()=>setSource(video,video.videoWidth,video.videoHeight,true,state.facing==='user');
    video.videoWidth ? ok() : (video.onloadedmetadata=ok);
  }catch(e){
    $('#deniedMsg').textContent = IN_TOSS
      ? '카메라를 허용하면 바로 볼 수 있어요. 허용하지 않아도 앨범 사진으로 볼 수 있어요.'
      : window.isSecureContext
        ? '휴대폰 설정에서 이 브라우저의 카메라를 허용하면 바로 볼 수 있어요. 앨범 사진으로도 볼 수 있어요.'
        : '카메라는 https 주소에서 열 수 있어요. 앨범 사진으로는 지금 바로 볼 수 있어요.';
    history.replaceState({s:'denied'},''); show('denied');
  }
}
$('#retryBtn').onclick=async()=>{ if(IN_TOSS){ try{ if(await openCamera.openPermissionDialog()!=='allowed') return; }catch(e){} } history.replaceState({s:'cam'},''); show('cam'); startCam(); };
$('#flipBtn').onclick=()=>{ state.facing = state.facing==='user'?'environment':'user'; startCam(); };
$$('.fileIn').forEach(inp=>inp.onchange=e=>{
  const f=e.target.files[0]; if(!f) return; e.target.value='';
  const img=new Image();
  img.onload=()=>{ stopCam(); setSource(img,img.naturalWidth,img.naturalHeight,false,false);
    if(current==='denied'){ history.replaceState({s:'cam'},''); show('cam'); } else if(current!=='cam') go('cam');
    refreshCam(); };
  img.src=URL.createObjectURL(f);
});

/* ---------- WebGL 시선 엔진 ---------- */
const gc=$('#view');
const gl=gc.getContext('webgl',{preserveDrawingBuffer:true,antialias:false});
if(!gl){ toast('이 브라우저는 시선 필터를 지원하지 않아요'); return; }
const VS='attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
const FS_COPY='precision mediump float;varying vec2 uv;uniform sampler2D t;uniform float mirror;void main(){vec2 u=uv;if(mirror>.5)u.x=1.-u.x;gl_FragColor=texture2D(t,u);}';
const FS_BLUR='precision mediump float;varying vec2 uv;uniform sampler2D t;uniform vec2 dir;uniform float w[7];void main(){vec4 c=texture2D(t,uv)*w[0];for(int i=1;i<7;i++){float f=float(i);c+=texture2D(t,uv+dir*f)*w[i];c+=texture2D(t,uv-dir*f)*w[i];}gl_FragColor=c;}';
const FS_FINAL=`precision mediump float;varying vec2 uv;
uniform sampler2D blurT,sharpT;uniform float split,aspect,cvd,tri,sat,con,gam,gain,vig;uniform mat3 M,T;
vec3 lin(vec3 c){return pow(c,vec3(2.2));} vec3 srgb(vec3 c){return pow(max(c,0.),vec3(1./2.2));}
void main(){
  if(split>=0. && uv.x<split){gl_FragColor=texture2D(sharpT,uv);return;}
  vec3 l=lin(texture2D(blurT,uv).rgb);
  l=mix(l,M*l,cvd); l=mix(l,T*l,tri); l=clamp(l,0.,1.);
  float Y=dot(l,vec3(.2126,.7152,.0722)); l=max(mix(vec3(Y),l,sat),0.);
  l=pow(clamp(l*gain,0.,1.),vec3(gam));
  vec3 s=srgb(l); s=(s-.5)*con+.5;
  vec2 d=uv-.5; d.x*=aspect; float r=length(d)/(.5*length(vec2(aspect,1.)));
  s=mix(s,vec3(.45,.43,.4),smoothstep(vig,vig+.35,r)*.8);
  gl_FragColor=vec4(clamp(s,0.,1.),1.);
}`;
function prog(fs){ const p=gl.createProgram();
  [[gl.VERTEX_SHADER,VS],[gl.FRAGMENT_SHADER,fs]].forEach(([t,src])=>{const s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);gl.attachShader(p,s);});
  gl.bindAttribLocation(p,0,'p'); gl.linkProgram(p); const u={}; p.u=n=>(u[n]??=gl.getUniformLocation(p,n)); return p; }
const pCopy=prog(FS_COPY), pBlur=prog(FS_BLUR), pFinal=prog(FS_FINAL);
gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());
gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
function tex(){ const t=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,t);
  [[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]].forEach(([a,b])=>gl.texParameteri(gl.TEXTURE_2D,a,b)); return t; }
function target(o,w,h){ if(o&&o.w===w&&o.h===h) return o; if(o){gl.deleteTexture(o.t);gl.deleteFramebuffer(o.f);}
  const t=tex(); gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
  const f=gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER,f); gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0); return {t,f,w,h}; }
const srcTex=tex(); let S,A,B;
const W7=[0,1,2,3,4,5,6].map(i=>Math.exp(-.5*(i/2)**2)); const WS=W7[0]+2*W7.slice(1).reduce((a,b)=>a+b); const WN=W7.map(x=>x/WS);
const T3=m=>[m[0],m[3],m[6],m[1],m[4],m[7],m[2],m[5],m[8]];
const DEUT=[.367322,.860646,-.227968,.280085,.672501,.047413,-.011820,.042940,.968881];
const TRIT=[1.255528,-.076749,-.178779,-.078411,.930809,.147602,.004733,.691367,.303900];
const BOOST=2, HFOV=65; // 4 → 2: 흐림보다 색·밝기 차이가 보이도록 (E안 결정)
function draw(p,fb,w,h){ gl.useProgram(p); gl.bindFramebuffer(gl.FRAMEBUFFER,fb); gl.viewport(0,0,w,h); gl.drawArrays(gl.TRIANGLE_STRIP,0,4); }
function bindT(u,t){ gl.activeTexture(gl.TEXTURE0+u); gl.bindTexture(gl.TEXTURE_2D,t); }
function render(src,sw,sh,mirror,p,split){
  const sc=Math.min(1,960/Math.max(sw,sh)); const W=Math.round(sw*sc), H=Math.round(sh*sc);
  if(gc.width!==W||gc.height!==H){gc.width=W;gc.height=H;}
  S=target(S,W,H);
  bindT(0,srcTex); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true); gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,src);
  gl.useProgram(pCopy); gl.uniform1i(pCopy.u('t'),0); gl.uniform1f(pCopy.u('mirror'),mirror?1:0); draw(pCopy,S.f,W,H);
  const sig=.34*Math.sqrt(Math.max(0,1/(p.cpd*p.cpd)-1/900))*BOOST*Math.max(W,H)/HFOV;
  const ds=sig>6?sig/4:1, aw=Math.max(2,Math.round(W/ds)), ah=Math.max(2,Math.round(H/ds));
  A=target(A,aw,ah); B=target(B,aw,ah);
  bindT(0,S.t); gl.useProgram(pCopy); gl.uniform1f(pCopy.u('mirror'),0); draw(pCopy,A.f,aw,ah);
  const sd=sig*aw/W;
  if(sd>.3){ gl.useProgram(pBlur); gl.uniform1i(pBlur.u('t'),0); gl.uniform1fv(pBlur.u('w'),WN);
    bindT(0,A.t); gl.uniform2f(pBlur.u('dir'),sd/2/aw,0); draw(pBlur,B.f,aw,ah);
    bindT(0,B.t); gl.uniform2f(pBlur.u('dir'),0,sd/2/ah); draw(pBlur,A.f,aw,ah); }
  gl.useProgram(pFinal); bindT(0,A.t); bindT(1,S.t); const u=n=>pFinal.u(n);
  gl.uniform1i(u('blurT'),0); gl.uniform1i(u('sharpT'),1); gl.uniform1f(u('split'),split); gl.uniform1f(u('aspect'),W/H);
  ['cvd','tri','sat','con','gam','gain','vig'].forEach(k=>gl.uniform1f(u(k),p[k]));
  gl.uniformMatrix3fv(u('M'),false,T3(DEUT)); gl.uniformMatrix3fv(u('T'),false,T3(TRIT));
  draw(pFinal,null,W,H);
}
function loop(){
  if(current==='cam' && state.src && state.srcW && (state.dirty||state.isVideo) && !(state.isVideo && video.readyState<2)){
    render(state.src,state.srcW,state.srcH,state.mirror,P(),state.compare?state.split:-1); state.dirty=false;
    if(state.compare) placeSplit();
  }
  requestAnimationFrame(loop);
}

/* ---------- 색 비교 띠(설명 시트용) ---------- */
function simHex(hex,p){
  let c=[0,2,4].map(i=>Math.pow(parseInt(hex.slice(i,i+2),16)/255,2.2));
  const mul=(m,v)=>[0,1,2].map(r=>m[r*3]*v[0]+m[r*3+1]*v[1]+m[r*3+2]*v[2]);
  const mix=(a,b,t)=>a.map((x,i)=>x+(b[i]-x)*t);
  c=mix(c,mul(DEUT,c),p.cvd); c=mix(c,mul(TRIT,c),p.tri); c=c.map(x=>Math.min(1,Math.max(0,x)));
  const Y=.2126*c[0]+.7152*c[1]+.0722*c[2]; c=c.map(x=>Math.max(0,Y+(x-Y)*p.sat));
  c=c.map(x=>Math.pow(Math.min(1,x*p.gain),p.gam)).map(x=>Math.pow(x,1/2.2)).map(x=>(x-.5)*p.con+.5);
  return '#'+c.map(x=>Math.round(Math.min(1,Math.max(0,x))*255).toString(16).padStart(2,'0')).join('');
}
const SW=['E5484D','F5822A','F5C518','3DAA55','2F6FED','8B5CF6'];

/* ---------- 설명 시트 ---------- */
function openSheet(){
  const k=state.mode, m=MODES[k], d = k==='baby' ? AGES[state.age] : m;
  $('#shTitle').textContent = k==='baby' ? (state.age===0 ? '신생아는 이렇게 봐요' : `${AGES[state.age].name} 아기는 이렇게 봐요`) : `${m.name}는 이렇게 봐요`;
  $('#shKv').innerHTML = d.kv.map(([a,b])=>`<div><span>${a}</span><b>${b}</b></div>`).join('');
  $('#shStrip').innerHTML = `<div class="r"><span>사람</span><div class="c">${SW.map(h=>`<i style="background:#${h}"></i>`).join('')}</div></div>
    <div class="r"><span>${m.name}</span><div class="c">${SW.map(h=>`<i style="background:${simHex(h,P())}"></i>`).join('')}</div></div>`;
  $('#shDesc').textContent = d.desc; $('#shCant').textContent = m.cant; $('#shSrc').textContent = m.src;
  $('#sheet').classList.add('on');
}
function closeSheet(){ $('#sheet').classList.remove('on'); }
$('#tipBtn').onclick=openSheet;
$$('[data-close]').forEach(b=>b.onclick=closeSheet);

/* ---------- 촬영 → 가족 시선 한 장 ---------- */
$('#shutter').onclick=()=>{
  if(!state.src || !state.srcW){ toast('카메라를 켜거나 앨범에서 사진을 골라주세요'); return; }
  const c=document.createElement('canvas'); const sc=Math.min(1,1280/Math.max(state.srcW,state.srcH));
  c.width=Math.round(state.srcW*sc); c.height=Math.round(state.srcH*sc); const g=c.getContext('2d');
  if(state.mirror){ g.translate(c.width,0); g.scale(-1,1); }
  g.drawImage(state.src,0,0,c.width,c.height);
  state.still=c; buildCard(); go('result');
};
$('#mrows').innerHTML = ORDER.map(k=>`<div class="mrow"><button class="mchip" data-k="${k}">${CHECK}${MODES[k].name}</button>
  <label style="flex:1;min-width:0;display:flex"><span class="sr">${MODES[k].name} 이름</span><input type="text" data-k="${k}" maxlength="8" placeholder="이름 (선택)" autocomplete="off"></label></div>`).join('');
$$('#mrows .mchip').forEach(b=>b.onclick=()=>{ const k=b.dataset.k;
  if(state.members[k] && ORDER.filter(x=>state.members[x]).length===1){ toast('카드에는 한 명 이상 있어야 해요'); return; }
  state.members[k]=!state.members[k]; buildCard(); });
let nameT; $$('#mrows input').forEach(inp=>inp.oninput=()=>{ state.names[inp.dataset.k]=inp.value.trim(); clearTimeout(nameT); nameT=setTimeout(buildCard,300); });
$('#callChips').innerHTML = CALLS.map(c=>`<button class="mchip" data-c="${c}">${CHECK}${c}</button>`).join('');
$$('#callChips .mchip').forEach(b=>b.onclick=()=>{ state.call=b.dataset.c; buildCard(); });
const tagOf = k => state.names[k] ? `${state.names[k]} · ${SUB(k)}` : modeLabel(k);
function cardTitle(){ const on=ORDER.filter(k=>state.members[k]);
  return on.length===1 && state.names[on[0]] ? `${state.names[on[0]]} 눈에 비친 나` : '우리 가족 눈에 비친 나'; }

function rr(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
/* 카드: 줄마다 왼쪽은 내 눈, 오른쪽은 가족의 눈. 아래 한 줄은 그 아이 목소리 */
function buildCard(){
  $$('#mrows .mchip').forEach(b=>b.setAttribute('aria-pressed', !!state.members[b.dataset.k]));
  $$('#callChips .mchip').forEach(b=>b.setAttribute('aria-pressed', b.dataset.c===state.call));
  const title=cardTitle(); $('#rTitle').textContent=title;
  const st=state.still; if(!st) return;
  const on=ORDER.filter(k=>state.members[k]);
  const F='Pretendard, "Apple SD Gothic Neo", sans-serif';
  const CW=1080, PAD=56, SW=CW-PAD*2, SH=on.length===1?Math.round(SW*.8):Math.round(SW/2.8), HEAD=110, ROW=SH+92, GAP=28, FOOT=110;
  const ch=PAD+HEAD+on.length*ROW+(on.length-1)*GAP+FOOT;
  const cv=document.createElement('canvas'); cv.width=CW; cv.height=ch; const g=cv.getContext('2d');
  g.fillStyle='#FFFFFF'; g.fillRect(0,0,CW,ch);
  g.fillStyle='#191F28'; g.font=`800 52px ${F}`; g.textBaseline='alphabetic'; g.fillText(title,PAD,PAD+52);
  const pill=(txt,x,y,right)=>{ g.font=`700 28px ${F}`; const tw=g.measureText(txt).width, w=tw+32;
    const px=right?x-w:x; g.fillStyle='rgba(16,17,20,.78)'; rr(g,px,y,w,48,14); g.fill();
    g.fillStyle='#fff'; g.textBaseline='middle'; g.fillText(txt,px+16,y+25); };
  on.forEach((k,i)=>{
    const p = k==='baby' ? AGES[state.age].p : MODES[k].p;
    render(st,st.width,st.height,false,p,.5);
    const W=gc.width, H=gc.height, ar=SW/SH;
    let cw=W, chh=W/ar; if(chh>H){ chh=H; cw=H*ar; }
    const cx=(W-cw)/2, cy=Math.min(H-chh,Math.max(0,H*.42-chh/2));
    const y=PAD+HEAD+i*(ROW+GAP);
    g.save(); rr(g,PAD,y,SW,SH,28); g.clip(); g.drawImage(gc,cx,cy,cw,chh,PAD,y,SW,SH);
    g.fillStyle='#fff'; g.fillRect(PAD+SW/2-2,y,4,SH); g.restore();
    pill('내 눈',PAD+18,y+18,false); pill(tagOf(k),PAD+SW-18,y+18,true);
    g.fillStyle='#191F28'; g.font=`700 36px ${F}`; g.textBaseline='alphabetic'; g.fillText(VOICE[k](state.call),PAD+4,y+SH+60);
  });
  const d=new Date(); const ds=`${d.getFullYear()}. ${d.getMonth()+1}. ${d.getDate()}`;
  g.textBaseline='middle'; g.fillStyle='#191F28'; g.font=`800 32px ${F}`; g.fillText('눈맞춤',PAD+4,ch-FOOT/2);
  g.textAlign='right'; g.fillStyle='#4E5968'; g.font=`500 28px ${F}`; g.fillText(ds,CW-PAD-4,ch-FOOT/2); g.textAlign='left';
  state.cardURL=cv.toDataURL('image/jpeg',.92); state.cardCanvas=cv; $('#cardImg').src=state.cardURL;
  $('#cardImg').alt = title+'. '+on.map(k=>`${tagOf(k)}: ${VOICE[k](state.call)}`).join(' ');
  state.dirty=true;
}
function cardBlob(){ return new Promise(r=>state.cardCanvas.toBlob(r,'image/jpeg',.92)); }
function download(){ const a=document.createElement('a'); a.href=state.cardURL; a.download=`눈맞춤-${Date.now()}.jpg`; document.body.appendChild(a); a.click(); a.remove(); }
$('#saveBtn').onclick=async()=>{
  if(IN_TOSS){ try{ await saveCard(); toast('저장했어요. 가족에게도 보내보세요'); }catch(e){ toast('저장하지 못했어요. 카드를 길게 눌러 저장해 주세요'); } return; }
  const ios=/iP(hone|ad|od)/.test(navigator.userAgent);
  if(ios && navigator.canShare){ const f=new File([await cardBlob()],'눈맞춤.jpg',{type:'image/jpeg'});
    if(navigator.canShare({files:[f]})){ try{ await navigator.share({files:[f]}); toast('저장했어요. 가족에게도 보내보세요'); }catch(e){} return; } }
  download(); toast('저장했어요. 사진을 길게 눌러 저장할 수도 있어요');
};
$('#shareBtn').onclick=async()=>{
  if(IN_TOSS){
    try{ const f=new File([await cardBlob()],'눈맞춤.jpg',{type:'image/jpeg'});
      if(navigator.canShare?.({files:[f]})){ await navigator.share({files:[f],title:'눈맞춤'}); return; } }catch(e){ if(e.name==='AbortError') return; }
    try{ await saveCard(); }catch(e){}
    try{ const link=await Share.createLink({path:'intoss://nunmatchum'});
      await Share.sendMessage({message:`${cardTitle()}
눈맞춤에서 우리 가족 눈에 비친 나를 만들어 보세요
${link}`});
      toast('카드는 저장해 뒀어요. 메시지에 사진을 함께 붙여 보내보세요'); }catch(e){ toast('보내지 못했어요. 저장한 카드를 직접 보내주세요'); }
    return;
  }
  try{ const f=new File([await cardBlob()],'눈맞춤.jpg',{type:'image/jpeg'});
    if(navigator.canShare?.({files:[f]})){ await navigator.share({files:[f],title:'눈맞춤',text:cardTitle()+' '+location.href}); return; }
    if(navigator.share){ await navigator.share({title:'눈맞춤',text:'우리 아이와 반려동물은 나를 어떻게 볼까요?',url:location.href}); return; }
  }catch(e){ if(e.name==='AbortError') return; }
  download(); toast('이 브라우저는 바로 보내기를 지원하지 않아서 사진으로 저장했어요');
};

refreshCam(); buildCard(); requestAnimationFrame(loop);
})();
