// Turns the preview build into one self-contained HTML body (CSS and JS inlined) for hosted previews.
import { readFileSync, writeFileSync } from 'node:fs';

const dir = 'dist-preview';
const html = readFileSync(`${dir}/index.html`, 'utf8');
const css = [...html.matchAll(/href="\/(assets\/[^"]+\.css)"/g)].map((m) => readFileSync(`${dir}/${m[1]}`, 'utf8')).join('\n');
const js = [...html.matchAll(/src="\/(assets\/[^"]+\.js)"/g)].map((m) => readFileSync(`${dir}/${m[1]}`, 'utf8')).join('\n');

const page = `<title>ES Bot Preview</title>
<meta name="description" content="ES Bot app preview">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>:root{color-scheme:light}${css}</style>
<div id="root"></div>
<script type="module">${js.replace(/<\/script/gi, '<\\/script')}</script>
`;
writeFileSync(`${dir}/es-bot-preview.html`, page);
console.log(`es-bot-preview.html · ${(page.length / 1024).toFixed(0)} KB`);
