import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'nunmatchum',
  permissions: [
    { name: 'camera', access: 'access' },
    { name: 'photos', access: 'read' },
  ],
  // 첫 화면 기준. 화면마다 src/main.js의 setNav()가 NavigationBar.setOptions로 바꿔요.
  navigationBar: {
    withTitle: true,
    withBackButton: false,
    withHomeButton: false,
  },
  webView: {
    allowsInlineMediaPlayback: true, // iOS 카메라 미리보기를 화면 안에서 재생
    mediaPlaybackRequiresUserAction: false,
    bounces: false,
    overScrollMode: 'never',
  },
  webBundleDir: 'dist',
});
