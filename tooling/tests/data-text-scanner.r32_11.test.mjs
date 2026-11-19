import test from 'node:test';
import assert from 'node:assert/strict';
import { darreraDataDelText } from '../seo/triaImatgeSeo.js';
import { normalizeDateText } from '../seo/data-text-scanner.mjs';

// Differential oracle is the pre-R32.11 grammar, independent of the scanner.
const months = {gener:'01',febrer:'02',marc:'03','març':'03',abril:'04',maig:'05',juny:'06',juliol:'07',agost:'08',setembre:'09',octubre:'10',novembre:'11',desembre:'12'};
function legacyDate(text, defaultYear = null) {
  if (typeof text !== 'string' || !text.trim()) return null;
  const net = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  const dates = [];
  for (const m of net.matchAll(/\b(20\d{2})-(\d{2})-(\d{2})\b/g)) dates.push(`${m[1]}-${m[2]}-${m[3]}`);
  for (const m of net.matchAll(/((?:\b\d{1,2}\b(?:\s*(?:,|i|y|al|a|-|–)\s*)?)+)\s*(?:de\s+|d['’])?(gener|febrer|març|marc|abril|maig|juny|juliol|agost|setembre|octubre|novembre|desembre)(?:\s+(?:de\s+|del\s+)?(20\d{2}))?/gi)) {
    const year = m[3] || defaultYear;
    if (!year) continue;
    for (const day of [...m[1].matchAll(/\b(\d{1,2})\b/g)].map(d => Number(d[1])).filter(d => d >= 1 && d <= 31)) dates.push(`${year}-${months[m[2].toLowerCase()]}-${String(day).padStart(2,'0')}`);
  }
  if (defaultYear) for (const m of net.matchAll(/\b(\d{1,2})\/(\d{1,2})(?:\/(20\d{2}))?\b/g)) {
    const day = Number(m[1]), month = Number(m[2]), year = m[3] || defaultYear;
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) dates.push(`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`);
  }
  dates.sort();
  return dates.length ? dates[dates.length-1] : null;
}
const same = (text, year) => assert.equal(darreraDataDelText(text, year), legacyDate(text, year), JSON.stringify({text, year}));

test('date parser preserves legacy ISO/slash/year and HTML contracts', () => {
  assert.equal(darreraDataDelText('2026-99-99'), '2026-99-99');
  assert.equal(darreraDataDelText('14/11/2026'), null);
  assert.equal(darreraDataDelText('14/11/2026', 2027), '2026-11-14');
  assert.equal(darreraDataDelText('32, 0 i 14 de novembre de 2026'), '2026-11-14');
  for (const text of [null, undefined, false, {}, '', ' \r\n\t ', '<><<1 juny 2026> 2 març 2027', '2000-01-01 31 desembre 2099 1/1/2098', 'a1 maig 2026', 'ç1 maig 2026', '1 maig2026', '1 maig de del 2026', '1abril2026', '1a2abril2026']) {
    for (const year of [null, 2026, '2027', 0, '', false, true]) same(text, year);
  }
});

test('all legacy months, separators, prefixes, case and date boundaries', () => {
  for (const month of Object.keys(months)) for (const named of [month, month.toUpperCase()]) {
    for (const separator of [',', 'i', 'I', 'y', 'Y', 'al', 'AL', 'a', 'A', '-', '–', ' , ', ' i ', ' al ', ' a ', ' ']) {
      for (const prefix of ['', ' ', ' de ', " d'", ' d’', ' DE ']) {
        for (const suffix of ['', ' 2026', ' de 2026', ' del 2026', ' DE 2026', ' DEL 2026', '2026', ' 20261']) {
          same(`!1${separator}2${prefix}${named}${suffix}?`, 2027);
        }
      }
    }
  }
});

test('normalizer has identical whitespace, tag and incomplete-tag bytes', () => {
  const chars=['a','<','>',' ','\r','\n','\t','\v','\f','\u0085','\u00a0','\u1680','\u2000','\u2028','\u2029','\u202f','\u205f','\u3000','\ufeff','ç','😀','\ud800'];
  let seed=0x7157;
  for (let n=0;n<15000;n++) {
    let text='';seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    for(let i=0;i<seed%40;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;text+=chars[seed%chars.length];}
    assert.equal(normalizeDateText(text),text.replace(/<[^>]*>/g,' ').replace(/\s+/g,' '));
  }
});

test('deterministic token fuzz preserves complete greedy results', () => {
  const tokens=['0','1','2','9','14','20','31','32','99','123','2026','2001-99-99','/','1/2/2026','i','y','al','a','d',"d'",'d’','de','del',' ', '\n','\t','_', 'x','ç','ſ','K','İ','[',']','<','>','😀',',','-','–',...Object.keys(months)];
  let seed=0x12345;
  for(let n=0;n<40000;n++){
    let text='';seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    for(let i=0;i<1+seed%14;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;text+=tokens[seed%tokens.length];}
    same(text,[null,2026,'2027',false,true][n%5]);
  }
});

test('long malformed lists and tags retain results without recursive retry', () => {
  for(const size of [16384,32768,65536]){
    assert.equal(darreraDataDelText('<'.repeat(size),2026),null);
    assert.equal(darreraDataDelText('1, '.repeat(Math.ceil(size/3)).slice(0,size),2026),null);
    assert.equal(darreraDataDelText('1, '.repeat(Math.ceil(size/3))+'14 novembre 2026',2026),'2026-11-14');
  }
});
