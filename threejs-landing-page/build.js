const fs   = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');
const { minify: minifyHTML } = require('html-minifier-terser');
const JavaScriptObfuscator = require('javascript-obfuscator');

const ROOT   = __dirname;
const DIST   = path.join(ROOT, 'dist');
const ASSETS = path.join(DIST, 'assets');

// ─── helpers ──────────────────────────────────────────────────────────────────

function ensure(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ─── read source ──────────────────────────────────────────────────────────────

const src = fs.readFileSync(path.join(ROOT, 'ether-design.html'), 'utf-8');

// ─── 1. extract CSS ───────────────────────────────────────────────────────────

const cssMatch = src.match(/<style>([\s\S]*?)<\/style>/);
if (!cssMatch) throw new Error('No <style> block found');
const rawCSS = cssMatch[1];

// ─── 2. extract THREE.js module script ───────────────────────────────────────

const moduleMatch = src.match(/<script type="module">([\s\S]*?)<\/script>/);
if (!moduleMatch) throw new Error('No module script found');
const rawModuleJS = moduleMatch[1];

// ─── 3. extract main inline script (last <script> with no src/type) ──────────

// Find the last <script> tag that has no attributes
const lastInlineRe = /<script>\s*([\s\S]*?)<\/script>\s*<\/body>/;
const lastInlineMatch = src.match(lastInlineRe);
if (!lastInlineMatch) throw new Error('No main inline script found');
const rawMainJS = lastInlineMatch[1];

// ─── 4. minify CSS ────────────────────────────────────────────────────────────

console.log('Minifying CSS...');
const minCSS = new CleanCSS({ level: 2 }).minify(rawCSS).styles;

// ─── 5. obfuscate JS ─────────────────────────────────────────────────────────

const obfOpts = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.4,
  numbersToExpressions: true,
  simplify: true,
  stringArrayShuffle: true,
  splitStrings: true,
  splitStringsChunkLength: 6,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayThreshold: 0.8,
  unicodeEscapeSequence: false,
  renameGlobals: false,
  identifierNamesGenerator: 'hexadecimal',
};

console.log('Obfuscating THREE.js module...');
const obfModuleJS = JavaScriptObfuscator.obfuscate(rawModuleJS, {
  ...obfOpts,
  sourceType: 'module',
}).getObfuscatedCode();

console.log('Obfuscating main script...');
const obfMainJS = JavaScriptObfuscator.obfuscate(rawMainJS, obfOpts).getObfuscatedCode();

// ─── 6. build output HTML ────────────────────────────────────────────────────

// Replace <style>…</style> → <link>
let html = src.replace(
  /<style>[\s\S]*?<\/style>/,
  '<link rel="stylesheet" href="assets/style.css">'
);

// Replace inline module script → external src
html = html.replace(
  /<script type="module">[\s\S]*?<\/script>/,
  '<!-- three-scene injected below -->'
);

// Replace last inline script + CDN scripts block → external srcs
// Keep CDN srcs, swap only the inline script
html = html.replace(
  /<script>\s*[\s\S]*?<\/script>\s*<\/body>/,
  '<script src="assets/main.js"></script>\n</body>'
);

// Remove the placeholder comment and inject module after CDN libs
html = html.replace(
  /<!-- three-scene injected below -->/,
  '<script type="module" src="assets/three-scene.js"></script>'
);

// ─── 7. minify HTML ───────────────────────────────────────────────────────────

console.log('Minifying HTML...');
minifyHTML(html, {
  collapseWhitespace: true,
  removeComments: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: false,
  minifyCSS: true,
  minifyJS: false, // already obfuscated externally
  conservativeCollapse: false,
}).then(minHTML => {

  // ─── 8. write dist ────────────────────────────────────────────────────────

  ensure(ASSETS);

  fs.writeFileSync(path.join(ASSETS, 'style.css'),       minCSS);
  fs.writeFileSync(path.join(ASSETS, 'three-scene.js'),  obfModuleJS);
  fs.writeFileSync(path.join(ASSETS, 'main.js'),         obfMainJS);
  fs.writeFileSync(path.join(DIST,   'index.html'),      minHTML);

  // vercel.json for the dist folder
  fs.writeFileSync(path.join(DIST, 'vercel.json'), JSON.stringify({
    rewrites: [{ source: '/', destination: '/index.html' }]
  }, null, 2));

  console.log('\nBuild complete → dist/');
  console.log('  dist/index.html          ', (Buffer.byteLength(minHTML, 'utf-8') / 1024).toFixed(1), 'KB');
  console.log('  dist/assets/style.css    ', (Buffer.byteLength(minCSS,  'utf-8') / 1024).toFixed(1), 'KB');
  console.log('  dist/assets/three-scene.js', (Buffer.byteLength(obfModuleJS, 'utf-8') / 1024).toFixed(1), 'KB');
  console.log('  dist/assets/main.js      ', (Buffer.byteLength(obfMainJS,    'utf-8') / 1024).toFixed(1), 'KB');
  console.log('\nDeploy: cd dist && vercel --prod');

}).catch(err => { console.error('HTML minify failed:', err); process.exit(1); });
