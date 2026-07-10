const ANDROID_FOLDER_URL =
  'https://drive.google.com/drive/folders/1d78IzmCf3-1EDdnjdfsnaGQuvHmdbr3i';

async function drawQr(canvas, url) {
  const QRCode = await import('https://cdn.jsdelivr.net/npm/qrcode@1.5.4/+esm');
  await QRCode.toCanvas(canvas, url, {
    width: 220,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#1a3a5c', light: '#ffffff' },
  });
}

const canvas = document.getElementById('androidQr');
const link = document.getElementById('androidLink');
const wrap = document.getElementById('androidQrWrap');

if (link) link.href = ANDROID_FOLDER_URL;

if (canvas) {
  drawQr(canvas, ANDROID_FOLDER_URL).catch(() => {
    if (wrap) {
      wrap.innerHTML =
        '<p style="margin:0;padding:1rem;color:var(--text-soft);font-weight:700;">Could not show QR. <a href="' +
        ANDROID_FOLDER_URL +
        '" target="_blank" rel="noopener noreferrer">Open the Android folder</a>.</p>';
    }
  });
}
