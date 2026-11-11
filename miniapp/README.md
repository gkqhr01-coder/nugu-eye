# 눈맞춤 미니앱 (앱인토스 WebView)

저장소 루트의 `index.html`(웹 버전, GitHub Pages)을 앱인토스 미니앱으로 옮긴 프로젝트예요. appName은 `nunmatchum`이에요.

## 실행

```bash
npm install
npm run dev     # 로컬 개발 서버. 오른쪽 아래 AIT 패널로 토스 환경을 흉내 내요
npm run build   # dist/ + nunmatchum.ait 생성 → 콘솔에 업로드
```

## 웹 버전과 다른 점

| 웹 버전 | 미니앱 |
|---|---|
| 직접 만든 상단 바·뒤로가기 | 토스 내비게이션 바만 써요. 화면마다 `NavigationBar.setOptions`로 바꿔요 (`src/main.js`의 `NAV`) |
| 카메라 화면 ⓘ 버튼 | 설명 칸 전체가 "자세히 보기" 버튼 |
| 브라우저 카메라 권한 | `requestPermission({name:'camera'})` 먼저, 거절 시 `openCamera.openPermissionDialog()` |
| 다운로드 저장 | `File.saveBase64` |
| 웹 공유 | 이미지 공유가 되면 이미지로. 안 되면 카드를 저장하고 `Share.createLink` + `Share.sendMessage`로 `intoss://nunmatchum` 링크를 보냄 |
| 확대 가능 | viewport `maximum-scale=1, user-scalable=no` |
| Pretendard CDN | 외부 글꼴을 빼고 기기 글꼴 사용 |

`index.html`과 `src/main.js`는 저장소 루트 `index.html`(웹 버전)을 `scripts/port_from_web.py`로 변환해 만든 거예요. 지금은 코드가 두 벌이라, 웹 버전을 고친 뒤에는 저장소 루트에서 `python3 miniapp/scripts/port_from_web.py .`를 다시 실행해 맞춰요. 미니앱 쪽을 직접 고쳤다면 다시 실행하면 덮어써지니 주의해요.

## 실기기에서 꼭 확인할 것

1. **iOS 토스 앱에서 카메라 미리보기가 켜지는지** (가장 큰 위험). 안 켜지면 `openCamera`(촬영만, 실시간 필터 없음)로 바꾸는 안을 검토해요.
2. 카메라 화면 위쪽 여백: 투명 내비게이션 바 높이를 56px로 가정했어요(`--navH`). 실제 높이에 맞춰 조정해요.
3. 토스 내비게이션 바 뒤로가기·안드로이드 백버튼이 화면 단계(카메라 → 시작, 결과 → 카메라)대로 돌아가는지.
4. 앨범에서 사진 고르기(`<input type=file>`)가 토스 웹뷰에서 열리는지. 안 되면 `Device.getPhotos`로 바꿔요.
5. `File.saveBase64`로 저장한 카드가 사진 앱에 보이는지 (토스앱 Android 5.218.0 / iOS 5.216.0 이상).
6. 결과 화면 공유 시트에 이미지가 붙는지, 링크만 가는지.

## 아직 안 한 것

- TDS 컴포넌트로 바꾸기 (카메라 확인 뒤)
- 대표 로고 600×600, 콘솔 앱 정보
