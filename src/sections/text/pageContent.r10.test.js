import { describe, expect, test } from 'vitest';
import { PAGE_COPY } from './pageContent.js';
import { localitzaPagina } from './pageContent.r10.js';
import { sanitizeHtml } from '../../utils/sanitize.js';
import { CAPACITATS, CONTRACTE_BACKEND } from '../../data/contracte.js';
import { CASOS } from '../../data/conformitat/kit.js';
const languages = ['ca','es','en','eu','gl'];
const keys = ['habitatge','treball','publicar_mapa','fedivers','fediversity','node-zero','versions'];
const doc = html => new DOMParser().parseFromString(sanitizeHtml(html),'text/html');
describe('AH-22 · rural content and dated production balance in five languages', () => {
 test.each(languages)('%s has complete authored pages and a single hero', language => {
  for (const key of keys) {
   const page=localitzaPagina(PAGE_COPY[key], language);
   expect(page.contentLanguage).toBe(language);
   expect(page.title.length).toBeGreaterThan(3);
   const body=doc(page.html);
   expect(body.querySelector('h3')).not.toBeNull();
   expect(body.querySelector('h1,h2,script,iframe')).toBeNull();
   if (['habitatge','treball','publicar_mapa'].includes(key)) {
    expect([...body.querySelectorAll('img')].some(img=>img.getAttribute('src')===page.image)).toBe(false);
    expect(body.querySelectorAll('h5')).toHaveLength(3);
   }
  }
 });
 test.each(languages)('%s distinguishes production, sealed kits and open custody', language => {
  for (const key of ['fedivers','fediversity','node-zero','versions']) {
   const page=localitzaPagina(PAGE_COPY[key], language), body=doc(page.html);
   for (const fact of ['PostgreSQL 17.11','40','32',String(Object.keys(CAPACITATS).length),String(CONTRACTE_BACKEND.length),String(CASOS.length),'R5','R6','R8','R9','R-5','3-2-1','Supabase','Nix','SKOS']) expect(body.body.textContent).toContain(fact);
   expect(body.querySelector('a[href="https://socdepoble.cat/api/v1/node0/status"]')).not.toBeNull();
   expect(body.querySelector('a[href="https://mastodont.cat/@depoble"]')).not.toBeNull();
   expect(body.querySelector('table')).toBeNull();
  }
  for (const key of ['fedivers','fediversity','node-zero']) {
   const page=localitzaPagina(PAGE_COPY[key], language), text=doc(page.html).body.textContent;
   for (const aiFact of ['BM25','src/data/iaiaLocal.js','Ollama','OpenCode','Qwen 2.5 Coder 14B','SuperWhisper','Parakeet','Apertium','Claude Opus','GPT Codex','Gemini Pro']) {
    expect(text).toContain(aiFact);
   }
  }
 });
 test.each(languages)('%s keeps contract counts aligned with code without announcing activation', language => {
  const text=doc(localitzaPagina(PAGE_COPY.fediversity,language).html).body.textContent;
  const phrases={ca:'45 capacitats i 136 mètodes amb 188 casos',es:'45 capacidades y 136 métodos con 188',en:'45 capabilities and 136 methods with 188',eu:'45 gaitasun eta 136 metodo ditu 188',gl:'45 capacidades e 136 métodos con 188'};
  expect(Object.keys(CAPACITATS)).toHaveLength(45);
  expect(CONTRACTE_BACKEND).toHaveLength(136);
  expect(CASOS).toHaveLength(188);
  expect(text).toContain(phrases[language]);
  expect(text).not.toMatch(/43 (?:capacitats|capacidades|capabilities|gaitasun)/);
  // El canvi és un inventari local; els pendents reals conserven la seua
  // qualificació i no es convertixen en èxits de desplegament.
  const local={ca:'codi local',es:'código local',en:'local code',eu:'tokiko kodeko',gl:'código local'};
  expect(text).toContain(local[language]);
  expect(text).toContain('R-5');expect(text).toContain('Nix');
 });
 test.each(languages)('%s documents examples without inventing homes or jobs', language => {
  const homes=doc(localitzaPagina(PAGE_COPY.habitatge,language).html);
  expect(homes.querySelector('a[href="https://www.ine.es/prensa/censo_2021_jun.pdf"]')).not.toBeNull();
  expect(homes.querySelector('a[href="https://www.diba.cat/ca/web/hua/masoveria"]')).not.toBeNull();
  const jobs=doc(localitzaPagina(PAGE_COPY.treball,language).html);
  expect(jobs.querySelector('a[href^="https://oficinac.es/"]')).not.toBeNull();
  expect(jobs.querySelector('a[href^="https://www.mapa.gob.es/"]')).not.toBeNull();
 });
 test('custom pages retain their content and unsupported languages fall back safely', () => {
  const custom={title:'Custom',html:'<p>Own copy</p>'};
  expect(localitzaPagina(custom,'es')).toBe(custom);
  expect(localitzaPagina(PAGE_COPY.habitatge,'fr')).toBe(PAGE_COPY.habitatge);
 });
 test('historical changelog stays intact and tagged with its original language', () => {
  expect(PAGE_COPY.versions.html).toContain('3 de novembre de 2026 · v1.1.0');
  expect(doc(localitzaPagina(PAGE_COPY.versions,'es').html).querySelector('div[lang="ca"]')).not.toBeNull();
 });
});
