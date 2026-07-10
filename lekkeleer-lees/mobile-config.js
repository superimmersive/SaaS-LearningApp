/**
 * Mobile app links for the Download page (app.html).
 * QR must use Expo Go URL (exp://…) — not exp+slug:// (dev client; iPhone Camera rejects it).
 */
export const MOBILE_APP = {
  projectId: '831bca44-6312-45fe-976a-f840e6ac2f40',
  runtimeVersion: '1.0.0',
  channel: 'main',

  expoDashboardUrl: 'https://expo.dev/accounts/superimmersive/projects/lekkeleer',
  iosDevBuildUrl: 'https://expo.dev/accounts/superimmersive/projects/lekkeleer/builds/a96ab481-47a9-4333-a1fa-9a35e79c049d',
  // Android = standalone PREVIEW APK for external testers (no dev server, no Expo sign-in to
  // download). iOS stays a dev/internal build (external iOS sharing needs TestFlight).
  androidDevBuildUrl: 'https://expo.dev/accounts/superimmersive/projects/lekkeleer/builds/d1173a34-39a6-4426-a02b-d5804cebb981',

  // Internal Android user testing — Google Drive folder with the preview APK (no Expo sign-in).
  androidUserTestingFolderUrl:
    'https://drive.google.com/drive/folders/1d78IzmCf3-1EDdnjdfsnaGQuvHmdbr3i',

  appStoreUrl: '',
  playStoreUrl: '',
};

/** URL encoded in the QR — opens LekkeLeer in Expo Go. */
export function getExpoGoScanUrl() {
  const { projectId, runtimeVersion, channel } = MOBILE_APP;
  return `exp://u.expo.dev/${projectId}?runtime-version=${runtimeVersion}&channel-name=${channel}`;
}
