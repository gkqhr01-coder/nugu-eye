"""웹 버전 index.html을 미니앱(miniapp/)으로 옮긴다. 원본은 건드리지 않음."""
import re, sys, pathlib

root = pathlib.Path(sys.argv[1])
src = (root / 'index.html').read_text(encoding='utf-8')
out = root / 'miniapp'

html, js = src.split('<script>\n', 1)
js, tail = js.split('</script>', 1)


def sub(pat, rep, s, count=1, flags=re.S):
    new, n = re.subn(pat, rep, s, count=count, flags=flags)
    if n == 0:
        raise SystemExit(f'pattern not found: {pat[:60]}')
    return new


# ---------- HTML ----------
html = sub(r'content="width=device-width, initial-scale=1, viewport-fit=cover"',
           'content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"', html)
html = sub(r'<link rel="stylesheet" href="https://cdn\.jsdelivr\.net[^>]*>\n', '', html)
# 직접 만든 상단 바 전부 제거 (토스 내비게이션 바를 씀)
# 한 줄짜리 바를 먼저, 여러 줄 바는 그 다음에 (여러 줄 패턴이 한 줄 바 뒤 블록까지 먹지 않게)
html = re.sub(r'\n  <div class="bar"[^>\n]*>[^\n]*</div>(?=\n)', '', html)
html = re.sub(r'\n  <div class="bar">\n(?:    [^\n]*\n)+?  </div>', '', html)
if 'class="bar"' in html:
    raise SystemExit('bar left')
# 정보 버튼 → 설명 칸 자체를 버튼으로
html = sub(r'<div class="tip"><b id="tipStat"></b><span id="tip"></span></div>',
           '<button class="tip" id="tipBtn" aria-label="이 눈에 대해 자세히 보기"><b id="tipStat"></b><span id="tip"></span><em>자세히 보기</em></button>', html)
html = sub(r'  \.tip\{([^}]*)pointer-events:none\}', r'  .tip{\1text-align:left;color:#fff}', html)
html = sub(r'  \.tip span\{[^}]*\}', '  .tip span{font-size:14px;line-height:1.5;color:var(--g200)}\n  .tip em{font-style:normal;font-size:13px;font-weight:700;color:var(--darkTx);margin-top:2px}', html)
# 투명 내비게이션 바 아래로 콘텐츠가 들어가는 어두운 화면은 위쪽 여백 확보
html = sub(r'  \.dark\{background:var\(--dark\);color:#fff\}',
           '  .dark{background:var(--dark);color:#fff}\n  .screen.dark{padding-top:calc(env(safe-area-inset-top) + var(--navH,56px))}\n  .screen:not(.dark){padding-top:12px}', html)
html = html.rstrip() + '\n'
html = html.replace('</body>', '')  # 꼬리는 아래에서 다시 붙임

# ---------- JS ----------
js = sub(r"\$\('#infoBtn'\)\.onclick=openSheet;", "$('#tipBtn').onclick=openSheet;", js)
js = sub(r"\$\('#vf'\)\.addEventListener\('pointerdown',e=>\{ if\(!state\.compare\) return;",
         "$('#vf').addEventListener('pointerdown',e=>{ if(!state.compare || e.target.closest('.tip')) return;", js)
# 화면 전환 때 내비게이션 바 바꾸기
js = sub(r"  current=id; document\.body",
         "  setNav(id);\n  current=id; document.body", js)
# 카메라 권한: 토스 안에서는 앱인토스 권한부터
js = sub(r"    if\(!navigator\.mediaDevices\?\.getUserMedia\) throw new Error\('unsupported'\);",
         "    if(IN_TOSS){ const st=await requestPermission({name:'camera',access:'access'}); if(st!=='allowed') throw new Error('denied'); }\n"
         "    if(!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');", js)
js = sub(r"    \$\('#deniedMsg'\)\.textContent = window\.isSecureContext\n.*?;\n",
         "    $('#deniedMsg').textContent = IN_TOSS\n"
         "      ? '카메라를 허용하면 바로 볼 수 있어요. 허용하지 않아도 앨범 사진으로 볼 수 있어요.'\n"
         "      : window.isSecureContext\n"
         "        ? '휴대폰 설정에서 이 브라우저의 카메라를 허용하면 바로 볼 수 있어요. 앨범 사진으로도 볼 수 있어요.'\n"
         "        : '카메라는 https 주소에서 열 수 있어요. 앨범 사진으로는 지금 바로 볼 수 있어요.';\n", js)
js = sub(r"\$\('#retryBtn'\)\.onclick=\(\)=>\{",
         "$('#retryBtn').onclick=async()=>{ if(IN_TOSS){ try{ if(await openCamera.openPermissionDialog()!=='allowed') return; }catch(e){} }", js)
# 저장: 토스 안에서는 File.saveBase64
js = sub(r"\$\('#saveBtn'\)\.onclick=async\(\)=>\{\n",
         "$('#saveBtn').onclick=async()=>{\n"
         "  if(IN_TOSS){ try{ await saveCard(); toast('저장했어요. 가족에게도 보내보세요'); }catch(e){ toast('저장하지 못했어요. 카드를 길게 눌러 저장해 주세요'); } return; }\n", js)
# 보내기: 이미지 공유가 되면 이미지로, 아니면 카드 저장 + 미니앱 링크 메시지
js = sub(r"\$\('#shareBtn'\)\.onclick=async\(\)=>\{\n",
         "$('#shareBtn').onclick=async()=>{\n"
         "  if(IN_TOSS){\n"
         "    try{ const f=new File([await cardBlob()],'눈맞춤.jpg',{type:'image/jpeg'});\n"
         "      if(navigator.canShare?.({files:[f]})){ await navigator.share({files:[f],title:'눈맞춤'}); return; } }catch(e){ if(e.name==='AbortError') return; }\n"
         "    try{ await saveCard(); }catch(e){}\n"
         "    try{ const link=await Share.createLink({path:'intoss://nunmatchum'});\n"
         "      await Share.sendMessage({message:`${cardTitle()}\\n눈맞춤에서 우리 가족 눈에 비친 나를 만들어 보세요\\n${link}`});\n"
         "      toast('카드는 저장해 뒀어요. 메시지에 사진을 함께 붙여 보내보세요'); }catch(e){ toast('보내지 못했어요. 저장한 카드를 직접 보내주세요'); }\n"
         "    return;\n"
         "  }\n", js)

head = """import { NavigationBar, Share, File as AitFile, requestPermission, openCamera, getOperationalEnvironment } from '@apps-in-toss/web-framework';

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
"""
# state·cardTitle은 IIFE 안에 있으므로, 헬퍼를 IIFE 안 맨 앞에 넣는다
js = sub(r"^\(\(\) => \{\n", "(() => {\n" + head.split('\n', 1)[1].replace('\n', '\n', ), js)
js = head.split('\n', 1)[0] + '\n\n' + js

(out / 'src').mkdir(exist_ok=True)
(out / 'src' / 'main.js').write_text(js, encoding='utf-8')
(out / 'index.html').write_text(html + '<script type="module" src="/src/main.js"></script>\n</body>\n</html>\n', encoding='utf-8')
print('ok', len(html), len(js))
