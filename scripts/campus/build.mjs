import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Marked, Renderer } from 'marked';
import { rooms } from '../../campus/stories.js';
import { stepAnchor } from '../../campus/guide-links.js';

const root = new URL('../../', import.meta.url);
const repo = 'https://github.com/tanure/contoso-copilot-advanced/blob/main/';
const escape = (text) => text.replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export async function buildRoomGuide(room, markdown, imageExists = (path) => readFile(new URL(`docs/images/${path}`, root))) {
  const base = new URL(`labs/${room.slug}/README.md`, repo);
  const images = new Set();
  function safeUrl(raw) {
    try {
      const url = new URL(raw, base);
      return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
    } catch (error) {
      if (!(error instanceof TypeError)) throw error;
      return null;
    }
  }
  const marked = new Marked({
    renderer: {
      html({ text }) {
        return text.startsWith('<!--') ? '' : escape(text);
      },
      heading({ depth, tokens }) {
        const level = Math.max(3, depth);
        return `<h${level}>${this.parser.parseInline(tokens)}</h${level}>\n`;
      },
      code({ text, lang }) {
        const labels = { bash: 'Terminal · Bash', text: 'Plain text', markdown: 'Markdown', md: 'Markdown',
          yaml: 'YAML', json: 'JSON', mermaid: 'Diagram source · Mermaid' };
        const label = Object.hasOwn(labels, lang) ? labels[lang] : 'Code';
        return `<div class="snippet"><div class="snippet-head"><span>${label}</span>
          <button class="button secondary" type="button" data-copy>Copy</button></div><pre><code>${escape(text)}</code></pre></div>\n`;
      },
      table(token) {
        return `<div class="guide-table" tabindex="0" role="region" aria-label="Lab reference table">${Renderer.prototype.table.call(this, token)}</div>`;
      },
      link({ href, tokens, title }) {
        const url = safeUrl(href);
        const label = this.parser.parseInline(tokens);
        return url ? `<a href="${escape(url)}"${title ? ` title="${escape(title)}"` : ''} target="_blank" rel="noopener">${label}</a>` : label;
      },
      image({ href, text }) {
        const url = safeUrl(href);
        const folder = `${repo}docs/images/`;
        if (!url?.startsWith(folder)) return text ? escape(text) : '';
        const path = url.slice(folder.length);
        if (!/^[\w/-]+\.(png|svg|jpe?g|gif|webp)$/i.test(path)) throw new Error(`Unsupported campus image: ${href}`);
        images.add(path);
        return `<button class="button secondary" type="button" data-guide-image="${escape(path)}" aria-haspopup="dialog">${escape(text || 'View image')}</button>`;
      },
    },
  });
  const sections = [];
  let current;
  for (const token of marked.lexer(markdown)) {
    if (token.type === 'heading' && token.depth === 2) {
      current = /^Step \d+ — /.test(token.text) ? { heading: token.text, tokens: [] } : undefined;
      if (current) sections.push(current);
    } else {
      current?.tokens.push(token);
    }
  }
  if (sections.length !== room.scenes.length) throw new Error(`Guide/story step count differs for ${room.id}`);
  const guides = Object.fromEntries(sections.map(({ heading, tokens }, index) => {
    const anchor = heading.toLowerCase().replace(/[^a-z0-9\uFE0F -]/g, '').replaceAll(' ', '-');
    if (anchor !== stepAnchor(room.id, index)) throw new Error(`Update the guide anchor for ${room.id}: ${heading}`);
    while (['space', 'hr'].includes(tokens.at(-1)?.type)) tokens.pop();
    return [room.scenes[index].id, marked.parser(tokens)];
  }));
  await Promise.all([...images].map(imageExists));
  return guides;
}

export async function buildCampus(output) {
  await mkdir(join(output, 'guides'), { recursive: true });
  await Promise.all([
    cp(new URL('campus/', root), output, { recursive: true }),
    cp(new URL('docs/images/', root), join(output, 'lab-images'), { recursive: true }),
    ...rooms.map(async (room) => {
      const markdown = await readFile(new URL(`labs/${room.slug}/README.md`, root), 'utf8');
      const guides = await buildRoomGuide(room, markdown);
      await writeFile(join(output, 'guides', `${room.id}.json`), JSON.stringify(guides));
    }),
  ]);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  if (!process.argv[2]) throw new Error('Usage: node scripts/campus/build.mjs <output-directory>');
  await buildCampus(resolve(process.argv[2]));
}
