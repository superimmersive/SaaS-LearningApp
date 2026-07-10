import { MOBILE_APP, getExpoGoScanUrl } from './mobile-config.js';

async function loadQrCode() {
  return import('https://cdn.jsdelivr.net/npm/qrcode@1.5.4/+esm');
}

async function drawQr(canvas, url) {
  const QRCode = await loadQrCode();
  await QRCode.toCanvas(canvas, url, {
    width: 260,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#1a3a5c', light: '#ffffff' },
  });
}

async function renderQr() {
  const canvas = document.getElementById('appQr');
  const wrap = document.getElementById('appQrWrap');
  const openBtn = document.getElementById('appOpenBtn');
  const link = document.getElementById('appOpenLink');
  const expoSection = document.getElementById('expoSection');
  const comingSoon = document.getElementById('appComingSoon');

  if (!MOBILE_APP.projectId || !canvas) {
    expoSection?.classList.add('hidden');
    comingSoon?.classList.remove('hidden');
    return;
  }

  const scanUrl = getExpoGoScanUrl();
  openBtn.href = scanUrl;
  link.href = scanUrl;
  link.textContent = 'Tik hier om in Expo Go te open';

  try {
    await drawQr(canvas, scanUrl);
  } catch (err) {
    console.error('QR render failed:', err);
    wrap.innerHTML = `<p class="app-qr-fallback">Kon nie QR-kode wys nie. <a href="${scanUrl}">Tik hier om in Expo Go te open</a>.</p>`;
  }
}

async function renderDevBuildQrPair({ url, canvasId, wrapId, linkId, label }) {
  const canvas = document.getElementById(canvasId);
  const wrap = document.getElementById(wrapId);
  const link = document.getElementById(linkId);
  if (!url || !canvas) return false;

  if (link) link.href = url;
  try {
    await drawQr(canvas, url);
    return true;
  } catch (err) {
    console.error(`${label} dev build QR render failed:`, err);
    if (wrap) {
      wrap.innerHTML = `<p class="app-qr-fallback">Kon nie QR-kode wys nie. <a href="${url}">Maak die ${label} dev build oop</a>.</p>`;
    }
    return true;
  }
}

async function renderDevBuildQr() {
  const { iosDevBuildUrl, androidDevBuildUrl } = MOBILE_APP;
  const section = document.getElementById('devBuildSection');
  const androidCard = document.getElementById('androidDevBuildCard');

  if (!section) return;

  const iosOk = await renderDevBuildQrPair({
    url: iosDevBuildUrl,
    canvasId: 'iosDevBuildQr',
    wrapId: 'iosDevBuildQrWrap',
    linkId: 'iosDevBuildLink',
    label: 'iOS',
  });
  const androidOk = await renderDevBuildQrPair({
    url: androidDevBuildUrl,
    canvasId: 'androidDevBuildQr',
    wrapId: 'androidDevBuildQrWrap',
    linkId: 'androidDevBuildLink',
    label: 'Android',
  });

  if (iosOk || androidOk) section.classList.remove('hidden');
  if (!androidOk && androidCard) androidCard.classList.add('hidden');
}

function renderStoreButtons() {
  const { appStoreUrl, playStoreUrl } = MOBILE_APP;
  const section = document.getElementById('storeSection');
  const appStoreBtn = document.getElementById('appStoreBtn');
  const playStoreBtn = document.getElementById('playStoreBtn');
  let visible = false;

  if (appStoreUrl) {
    appStoreBtn.href = appStoreUrl;
    appStoreBtn.classList.remove('hidden');
    visible = true;
  }
  if (playStoreUrl) {
    playStoreBtn.href = playStoreUrl;
    playStoreBtn.classList.remove('hidden');
    visible = true;
  }
  if (visible) section?.classList.remove('hidden');
}

async function renderUserTestingQr() {
  const url = MOBILE_APP.androidUserTestingFolderUrl;
  const section = document.getElementById('userTestingSection');
  const canvas = document.getElementById('userTestingQr');
  const wrap = document.getElementById('userTestingQrWrap');
  const link = document.getElementById('userTestingLink');
  if (!url || !section || !canvas) return;

  if (link) link.href = url;
  try {
    await drawQr(canvas, url);
  } catch (err) {
    console.error('User testing QR render failed:', err);
    if (wrap) {
      wrap.innerHTML = `<p class="app-qr-fallback">Kon nie QR wys nie. <a href="${url}" target="_blank" rel="noopener noreferrer">Open die Android testing folder</a>.</p>`;
    }
  }
}

renderQr();
renderDevBuildQr();
renderUserTestingQr();
renderStoreButtons();
