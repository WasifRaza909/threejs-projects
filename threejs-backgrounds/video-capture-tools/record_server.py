from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import json
import urllib.parse

ROOT = Path(r'D:\Practice\threejs-projects\threejs-backgrounds')
OUT = ROOT / 'videos' / 'threejs-effects-complete.webm'

EFFECTS = [
    ('01-particle-field.html', 'Interactive Particles'),
    ('02-infinite-tunnel.html', 'Infinite Tunnel'),
    ('03-morphing-blob.html', 'Morphing Blob'),
    ('04-galaxy-spiral.html', 'Galaxy Spiral'),
    ('05-noise-terrain.html', 'Noise Terrain'),
    ('06-shader-gradient.html', 'Shader Gradient'),
    ('07-black-hole.html', 'Black Hole'),
    ('08-constellation-network.html', 'Constellation Network'),
    ('09-particle-text.html', 'Customized Particle Text'),
    ('10-volumetric-smoke.html', 'Volumetric Smoke'),
]

RECORDER_HTML = r'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Three.js Effects Video Recorder</title>
<style>
  html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: #02040a; }
  #stage { width: 100vw; height: 100vh; display: block; background: #02040a; }
  #sourceFrame { position: fixed; left: -10000px; top: 0; width: 1280px; height: 720px; border: 0; }
  #status { position: fixed; left: 18px; top: 14px; z-index: 10; color: #dbeafe; font: 13px/1.4 system-ui, sans-serif; letter-spacing: .04em; text-transform: uppercase; opacity: .72; }
</style>
</head>
<body>
<canvas id="stage" width="1280" height="720"></canvas>
<iframe id="sourceFrame" width="1280" height="720"></iframe>
<div id="status">Preparing recorder...</div>
<script>
const effects = __EFFECTS__;
const durationMs = 3000;
const fps = 30;
const W = 1280, H = 720;
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const frame = document.getElementById('sourceFrame');
const statusEl = document.getElementById('status');
let active = null;
let activeIndex = -1;
let phaseStart = performance.now();
let recordingDone = false;

function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function loadEffect(effect) {
  return new Promise(resolve => {
    frame.onload = () => resolve();
    frame.src = '/effects/' + effect.file + '?videoCapture=' + Date.now();
  });
}
function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function drawLoading() {
  const g = ctx.createRadialGradient(W/2, H/2, 20, W/2, H/2, W*.75);
  g.addColorStop(0, '#122b65');
  g.addColorStop(1, '#02040a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,.82)';
  ctx.font = '700 34px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Loading effect...', W/2, H/2);
}
function drawOverlay(now) {
  if (!active) return;
  const elapsed = now - phaseStart;
  const fade = Math.min(1, elapsed / 420, (durationMs - elapsed) / 420);

  const grad = ctx.createLinearGradient(0, H - 190, 0, H);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,.78)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, H - 190, W, 190);

  ctx.fillStyle = 'rgba(255,255,255,.42)';
  ctx.font = '700 12px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.letterSpacing = '2px';
  ctx.fillText('THREE.JS HERO BACKGROUNDS PACK', 34, H - 78);

  ctx.fillStyle = 'rgba(255,255,255,.96)';
  ctx.font = '700 30px Arial, sans-serif';
  ctx.fillText(active.title, 34, H - 38);

  const badge = String(activeIndex + 1).padStart(2, '0') + ' / 10';
  ctx.font = '700 15px Arial, sans-serif';
  const bw = ctx.measureText(badge).width + 34;
  drawRoundRect(ctx, W - bw - 28, 24, bw, 40, 20);
  ctx.fillStyle = 'rgba(3,8,19,.72)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(142,205,255,.72)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.92)';
  ctx.textAlign = 'center';
  ctx.fillText(badge, W - bw/2 - 28, 50);

  if (fade < 1) {
    ctx.fillStyle = `rgba(0,0,0,${1 - Math.max(0, fade)})`;
    ctx.fillRect(0, 0, W, H);
  }
}
function render(now) {
  ctx.fillStyle = '#02040a';
  ctx.fillRect(0, 0, W, H);
  let sourceCanvas = null;
  try {
    const doc = frame.contentDocument;
    if (doc) sourceCanvas = doc.querySelector('canvas');
  } catch (e) {}
  if (sourceCanvas && sourceCanvas.width && sourceCanvas.height) {
    try {
      ctx.drawImage(sourceCanvas, 0, 0, W, H);
    } catch (e) {
      drawLoading();
    }
  } else {
    drawLoading();
  }
  drawOverlay(now);
  if (!recordingDone) requestAnimationFrame(render);
}
async function run() {
  const supported = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm'
  ].find(type => MediaRecorder.isTypeSupported(type));
  if (!supported) throw new Error('MediaRecorder WebM is not supported in this browser.');

  const stream = canvas.captureStream(fps);
  const chunks = [];
  const recorder = new MediaRecorder(stream, { mimeType: supported, videoBitsPerSecond: 9000000 });
  recorder.ondataavailable = event => { if (event.data && event.data.size) chunks.push(event.data); };
  const stopped = new Promise(resolve => recorder.onstop = resolve);

  requestAnimationFrame(render);
  recorder.start(500);

  for (let i = 0; i < effects.length; i++) {
    activeIndex = i;
    active = effects[i];
    statusEl.textContent = `Recording ${String(i + 1).padStart(2, '0')} / ${effects.length}: ${active.title}`;
    await loadEffect(active);
    await wait(1500);
    phaseStart = performance.now();
    await wait(durationMs);
  }

  recordingDone = true;
  recorder.stop();
  await stopped;
  const blob = new Blob(chunks, { type: supported });
  statusEl.textContent = 'Saving video...';
  const response = await fetch('/save-video', { method: 'POST', headers: { 'Content-Type': supported }, body: blob });
  if (!response.ok) throw new Error(await response.text());
  const data = await response.json();
  window.__recordingResult = data;
  statusEl.textContent = 'Saved: ' + data.path;
}
run().catch(error => {
  window.__recordingError = String(error && error.stack || error);
  statusEl.textContent = 'Error: ' + window.__recordingError;
});
</script>
</body>
</html>'''

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/recorder.html':
            html = RECORDER_HTML.replace('__EFFECTS__', json.dumps([
                {'file': file, 'title': title} for file, title in EFFECTS
            ]))
            data = html.encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return
        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path != '/save-video':
            self.send_error(404)
            return
        length = int(self.headers.get('Content-Length', '0'))
        OUT.parent.mkdir(parents=True, exist_ok=True)
        with OUT.open('wb') as f:
            remaining = length
            while remaining > 0:
                chunk = self.rfile.read(min(1024 * 1024, remaining))
                if not chunk:
                    break
                f.write(chunk)
                remaining -= len(chunk)
        payload = json.dumps({'ok': True, 'path': str(OUT), 'bytes': OUT.stat().st_size}).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

if __name__ == '__main__':
    server = ThreadingHTTPServer(('127.0.0.1', 8124), Handler)
    print('Recorder server running at http://127.0.0.1:8124/recorder.html', flush=True)
    server.serve_forever()
