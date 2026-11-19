import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { extractDocumentLinks } from '../lib/document-links.mjs';
import { markdownProse } from '../lib/markdown-prose.mjs';
import { extractWikilinks, parseWikilink } from '../wiki/lib/enllacos.mjs';

function legacyDocumentLinks(content) {
  const clean = markdownProse(content), links = [];
  for (const m of clean.matchAll(/\[\[([^\]]+)\]\]/g)) links.push({kind: 'wiki', target: m[1].replace(/\\(?=[|#])/g, '').split('|')[0].split('#')[0].trim()});
  for (const m of clean.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = m[1].trim().replace(/^<|>$/g, '').split('#')[0];
    links.push({kind: 'markdown', target: target.startsWith('/') ? target : target.split('?')[0]});
  }
  return links.filter(l => l.target && !/^[a-z][a-z0-9+.-]*:/i.test(l.target));
}
function legacyWikilinks(text) {
  return [...text.matchAll(/(!?)\[\[(.*?)\]\]/gs)].map(m => ({raw: m[0], index: m.index, ...parseWikilink(m[0])}));
}
function parity(input) {
  assert.deepEqual(extractDocumentLinks(input), legacyDocumentLinks(input), `document: ${JSON.stringify(input)}`);
  assert.deepEqual(extractWikilinks(input), legacyWikilinks(input), `wiki: ${JSON.stringify(input)}`);
}

test('gramàtiques separades: flat manté títol/primer parèntesi, prioritat wiki i queries', () => {
  assert.deepEqual(extractDocumentLinks('[t](x.md "T") [p](a(b).md) [a](/wiki?item=1#part) [r](x.md?q=1#part) [[z]]'), [
    {kind: 'wiki', target: 'z'}, {kind: 'markdown', target: 'x.md "T"'}, {kind: 'markdown', target: 'a(b'},
    {kind: 'markdown', target: '/wiki?item=1'}, {kind: 'markdown', target: 'x.md'},
  ]);
  assert.deepEqual(extractDocumentLinks('[[ok]] `[[no]]` <!-- [[no]] -->\n```md\n[[no]]\n```\n\\[[literal]]'), [{kind: 'wiki', target: 'ok'}]);
  parity('[[A\\#Part\\|Alias]] [x](mailto:a@b) [x](<a path.md>) [x](.)');
});

test('wikilinks DOTALL, interiors buits, embed i offsets UTF-16', () => {
  const text = '🌱[[]] ![[a.MD#^block|alias]] [[a\nb#part]] \\[[literal]]';
  parity(text);
  const links = extractWikilinks(text);
  assert.equal(links[0].index, 2);
  assert.equal(links[0].target, '');
  assert.equal(links[1].embed, true);
  assert.equal(links[1].blockId, 'block');
  assert.equal(links[2].target, 'a\nb');
  assert.equal(links[3].target, 'literal');
});

test('arguments invàlids continuen llançant TypeError; String conserva el contracte', () => {
  for (const input of [null, undefined, 42, [], {}]) assert.throws(() => extractWikilinks(input), TypeError);
  parity(new String('![[Doc.md|Nom]]'));
});

test('paritat exhaustiva en delimitadors curts, inclosos tancaments i obertures solapats', () => {
  const alphabet = ['[', ']', '(', ')', '!'];
  let level = [''];
  for (let length = 0; length <= 7; length++) {
    for (const input of level) parity(input);
    if (length < 7) level = level.flatMap(s => alphabet.map(c => s + c));
  }
});

test('paritat de fuzz determinista amb Unicode, escapaments, prosa i delimitadors', () => {
  const tokens = ['[', ']', '(', ')', '!', '\\', '#', '|', 'x', ' ', '\n', '\r', '`', '<!--', '-->', '.md', '🌱', 'ç', '\u00a0'];
  let seed = 0x321112;
  const next = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return seed >>> 0; };
  for (let trial = 0; trial < 12_000; trial++) {
    let input = '';
    const n = next() % 80;
    for (let i = 0; i < n; i++) input += tokens[next() % tokens.length];
    parity(input);
  }
});

test('vectors de 16/32/64 KiB amb procés acotat i retorn exacte', () => {
  const documentUrl = new URL('../lib/document-links.mjs', import.meta.url).href;
  const wikiUrl = new URL('../wiki/lib/enllacos.mjs', import.meta.url).href;
  const script = `
    import {performance} from 'node:perf_hooks';
    import assert from 'node:assert/strict';
    import {extractDocumentLinks} from ${JSON.stringify(documentUrl)};
    import {extractWikilinks} from ${JSON.stringify(wikiUrl)};
    const results=[];
    for (const n of [16384,32768,65536]) for (const [name, fn, input] of [
      ['document-wiki',extractDocumentLinks,'['.repeat(n)],
      ['document-markdown',extractDocumentLinks,'[x]('.repeat(n/4)],
      ['wiki',extractWikilinks,'['.repeat(n)],
    ]) {
      const samples=[];
      for(let repeat=0;repeat<5;repeat++) {
        const start=performance.now();const result=fn(input);const ms=performance.now()-start;
        assert.deepEqual(result,[]);samples.push(ms);
      }
      const ordered=[...samples].sort((a,b)=>a-b),median=ordered[2];
      assert.ok(median<25, name+' '+n+' median '+median+'ms');
      results.push({name,n,samples,median});
    }
    process.stdout.write(JSON.stringify(results));
  `;
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', script], {encoding: 'utf8', timeout: 5_000, maxBuffer: 1024 * 1024});
  assert.equal(child.error?.code, undefined, `subprocés: ${child.error?.message}`);
  assert.equal(child.status, 0, child.stderr);
  const rows = JSON.parse(child.stdout);
  assert.equal(rows.length, 9);
});
