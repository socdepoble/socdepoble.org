/* Porta del copy proposat: les entradetes són text pla; strong es compta al cos. */
import { JSDOM } from 'jsdom';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const root = path.resolve(process.argv[2] || process.cwd());
const { PAGE_COPY } = await import(pathToFileURL(path.join(root, 'src/sections/text/pageContent.js')));
const segmenter = new Intl.Segmenter('ca', { granularity: 'word' });
const count = text => [...segmenter.segment(text)].filter(part => part.isWordLike).length;
const scope = new Set(['descarregues', 'projecte', 'disseny', 'anima']);
const census = [], errors = [];
for (const [key, page] of Object.entries(PAGE_COPY)) {
  const dom = new JSDOM(page.html || '');
  const paragraphs = [...dom.window.document.querySelectorAll('p')].map((paragraph, i) => ({
    paragraph: i + 1, words: count(paragraph.textContent),
    boldWords: count([...paragraph.querySelectorAll('strong')].map(node => node.textContent).join(' '))
  }));
  const long = paragraphs.filter(p => p.words >= 20);
  const failures = long.filter(p => p.boldWords < 6 || p.boldWords > 8);
  census.push({ key, subtitle: page.subtitle || '', lead: page.lead || '',
    longParagraphs: long.length, compliant: long.length - failures.length, failures });
  if (scope.has(key)) {
    if (!page.subtitle || !page.lead || /[<>]/.test(page.subtitle + page.lead)) errors.push(`${key}: H2/entradeta no són text pla vàlid`);
    for (const failure of failures) errors.push(`${key}: p${failure.paragraph} té ${failure.boldWords} paraules en negreta`);
    if (key === 'descarregues' && dom.window.document.querySelector('a')) errors.push('Descàrregues conté un enllaç no previst');
    if (key === 'projecte' && !dom.window.document.querySelector('a[href="/wikidepoble?item=el_projecte"]')) errors.push('Falta l’accés a la Wiki');
  }
  dom.window.close();
}
for (const key of scope) if (!Object.hasOwn(PAGE_COPY, key)) errors.push(`Falta la pàgina ${key}`);
console.log(JSON.stringify({ valid: errors.length === 0, thresholdWords: 20,
  absentRequestedKeys: ['quisom', 'manifest'].filter(key => !Object.hasOwn(PAGE_COPY, key)),
  modifiedScope: [...scope], census, errors }, null, 2));
process.exitCode = errors.length ? 1 : 0;
