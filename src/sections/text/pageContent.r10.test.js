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
   for (const fact of ['PostgreSQL 17.11','40','32',String(key==='versions'?46:Object.keys(CAPACITATS).length),String(key==='versions'?138:CONTRACTE_BACKEND.length),String(key==='versions'?190:CASOS.length),'R5','R6','R8','R9','R-5','3-2-1','Supabase','Nix','SKOS']) expect(body.body.textContent).toContain(fact);
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
  const phrases={ca:'51 capacitats i 148 mètodes amb 210 casos',es:'51 capacidades y 148 métodos con 210',en:'51 capabilities and 148 methods with 210',eu:'51 gaitasun eta 148 metodo ditu 210',gl:'51 capacidades e 148 métodos con 210'};
  expect(Object.keys(CAPACITATS)).toHaveLength(51);
  expect(CONTRACTE_BACKEND).toHaveLength(148);
  expect(CASOS).toHaveLength(210);
  expect(text).toContain(phrases[language]);
  const notes=[...doc(localitzaPagina(PAGE_COPY.fediversity,language).html).querySelectorAll('p')].filter(p=>p.textContent.includes(phrases[language])&&p.textContent.includes('46/138/190'));
  expect(notes).toHaveLength(1);const note=notes[0];
  expect(note.textContent).toContain(phrases[language]);
  expect(note.textContent).toContain('46/138/190');
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
 test('P0-38 / IDEA-157 · Regla del Cosí Guillermo: /anima, /projecte, /disseny i /anatomia-rural usen l’imaginari i conceptes «de poble» en les 5 llengües', () => {
  expect(PAGE_COPY.projecte.html).not.toContain('La IAIA usa les imatges del poble per a explicar la tecnologia.');
  expect(PAGE_COPY.projecte.html).toContain("La IAIA utilitza l'imaginari de poble per a explicar la tecnologia.");
  expect(PAGE_COPY.projecte.html).toContain('una <strong>utilitat social</strong> bàsica amb vocació de poble.');
  expect(PAGE_COPY.projecte.html).toContain('Són <strong>eines de poble</strong> que anem construint i revisant');
  expect(PAGE_COPY.projecte.html).toContain('fer arribar els <strong>canvis</strong> a tota la gent de poble.');
  expect(PAGE_COPY.disseny.html).toContain('<h3>El llenguatge visual de poble</h3>');
  expect(PAGE_COPY.disseny.html).toContain('<p>La veu de poble s’escriu amb <strong>Noto Sans</strong>.');
  /* P0-45 / IDEA-176 (261107) · La pàgina ja només parla del Pou de la Neu del Rentonar: el títol de
     secció conserva el concepte «de poble», ara en les 5 llengües (TRADUCCIONS_ANATOMIA). */
  const anatomia = {
   ca: '<h3>Per dins d’una obra de poble</h3>',
   es: '<h3>Por dentro de una obra de pueblo</h3>',
   en: '<h3>Inside a piece of village engineering</h3>',
   eu: '<h3>Herriko obra baten barruan</h3>',
   gl: '<h3>Por dentro dunha obra de vila</h3>'
  };
  for (const [lang, h3] of Object.entries(anatomia)) {
   expect(localitzaPagina(PAGE_COPY['anatomia-rural'], lang).html).toContain(h3);
  }
  expect(PAGE_COPY.anima.lead).toContain("La IAIA utilitza l'imaginari de poble per a explicar la tecnologia.");
  expect(PAGE_COPY.anima.html).toContain('El relat dona a la IAIA un <strong>propòsit</strong> clar amb vocació de <strong>poble</strong>');
  expect(PAGE_COPY.anima.html).toContain('aproxima el llenguatge informàtic a les experiències de <strong>poble</strong>.');
  expect(PAGE_COPY.anima.html).toContain('per a explicar la <strong>tecnologia</strong> amb paraules de <strong>poble</strong>.');
  const esperat = {
   ca: "La IAIA utilitza l'imaginari de poble per a explicar la tecnologia.",
   es: 'La IAIA utiliza el imaginario de pueblo para explicar la tecnología.',
   en: 'IAIA uses the village imaginary to explain technology.',
   eu: 'IAIAk herriko iruditeria erabiltzen du teknologia azaltzeko.',
   gl: 'A IAIA utiliza o imaxinario de vila para explicar a tecnoloxía.'
  };
  for (const [lang, frase] of Object.entries(esperat)) {
   expect(localitzaPagina(PAGE_COPY.anima, lang).lead).toContain(frase);
  }
 });
});
