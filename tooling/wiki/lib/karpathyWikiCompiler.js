/**
 * Compilador documental extractiu de la Wiki (IDEA-104d).
 * Cap model, xarxa, rellotge, publicació ni inferència de parentiu.
 * Conserva la font íntegra i emet esborranys privats amb cites i SHA-256.
 */
export const VERSIO_COMPILADOR = '1.0.0';
export const LIMITS_COMPILADOR = Object.freeze({ fonts: 500, bytesFont: 2 * 1024 * 1024, bytesTotal: 16 * 1024 * 1024 });
const TIPUS = new Set(['memoria-oral', 'cronica', 'genealogia']);
const idValid = value => typeof value === 'string' && /^[a-z0-9][a-z0-9_-]{0,79}$/.test(value);
const compara = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const codifica = value => new TextEncoder().encode(value);
const md = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\\`*_{}[\]()#+.!|~-]/g, '\\$&');
const text = (value, nom, max = 500) => {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) throw new TypeError(`Camp invàlid: ${nom}`);
  return value;
};
/** JSON canònic: rebutja objectes amb comportament i dades no JSON. */
export function serialitzaCanonica(value, vistos = new Set()) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (typeof value !== 'object' || vistos.has(value)) throw new TypeError('La font ha de ser JSON finit i sense cicles');
  const proto = Object.getPrototypeOf(value);
  const esArray = Array.isArray(value);
  if (esArray ? proto !== Array.prototype && proto !== null : proto !== Object.prototype && proto !== null) throw new TypeError('Objecte JSON invàlid');
  if (Object.getOwnPropertySymbols(value).length) throw new TypeError('Símbols prohibits en font JSON');
  vistos.add(value);
  let result;
  if (esArray) {
    // Ni Array.from ni .map: un array pot substituir l'iterador o tindre
    // accessors als índexs. Llegim descriptors abans d'obrir cap dada.
    const longitud = Object.getOwnPropertyDescriptor(value, 'length').value;
    if (Object.getOwnPropertyNames(value).some(key => key !== 'length' && !/^(0|[1-9][0-9]*)$/.test(key))) throw new TypeError('Propietat aliena en array JSON');
    const elements = [];
    for (let i = 0; i < longitud; i += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(i));
      if (!descriptor || !Object.hasOwn(descriptor, 'value')) throw new TypeError('Accessor o buit prohibit en array');
      elements.push(serialitzaCanonica(descriptor.value, vistos));
    }
    result = '[' + elements.join(',') + ']';
  }
  else result = '{' + Object.keys(value).sort(compara).map(key => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !Object.hasOwn(descriptor, 'value')) throw new TypeError('Accessor prohibit en font');
    return JSON.stringify(key) + ':' + serialitzaCanonica(descriptor.value, vistos);
  }).join(',') + '}';
  vistos.delete(value);
  return result;
}
async function sha256(value) {
  const bytes = await globalThis.crypto.subtle.digest('SHA-256', codifica(value));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}
const normalitza = value => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

function conceptesDelText(relat, tesaurus) {
  const termes = new Map();
  for (const terme of tesaurus) {
    if (!idValid(terme.slug) || typeof terme.name !== 'string' || terme.isDeprecatedSynonym) continue;
    if (termes.has(terme.slug)) throw new TypeError('Slug SKOS duplicat');
    const formes = [terme.name, ...(terme.useFor ?? [])].filter(f => typeof f === 'string' && f.length >= 3);
    termes.set(terme.slug, { terme, formes });
  }
  const normal = normalitza(relat);
  const result = [];
  for (const { terme, formes } of termes.values()) {
    const proves = formes.filter(forma => {
      const agulla = normalitza(forma);
      let offset = normal.indexOf(agulla);
      while (offset >= 0) {
        const abans = normal.slice(0, offset).match(/[\p{L}\p{N}]$/u);
        const despres = /^[\p{L}\p{N}]/u.test(normal.slice(offset + agulla.length));
        if (!abans && !despres) return true;
        offset = normal.indexOf(agulla, offset + 1);
      }
      return false;
    });
    if (proves.length) result.push({ id: terme.slug, prefLabel: terme.name, proves: [...new Set(proves)].sort(compara), metode: 'coincidencia-lexica-no-validacio-semantica' });
  }
  return result.sort((a, b) => compara(a.id, b.id));
}

function validaGenealogia(value) {
  if (!value || !Array.isArray(value.persones) || !Array.isArray(value.relacions)) throw new TypeError('Genealogia sense persones/relacions');
  const persones = new Map();
  for (const persona of value.persones) {
    if (!idValid(persona.id) || persones.has(persona.id)) throw new TypeError('Identitat genealògica invàlida o duplicada');
    text(persona.nom, 'persona.nom');
    for (const camp of ['naixement', 'defuncio']) {
      if (persona[camp] !== undefined && (!Number.isInteger(persona[camp]) || persona[camp] < 1 || persona[camp] > 9999)) throw new TypeError('Any invàlid');
    }
    persones.set(persona.id, persona);
  }
  const avisos = [];
  for (const persona of persones.values()) {
    if (persona.defuncio < persona.naixement) avisos.push(`cronologia:${persona.id}:defuncio-anterior`);
  }
  const claus = new Set();
  for (const relacio of value.relacions) {
    if (!['progenitor', 'parella', 'germa'].includes(relacio.tipus) || !persones.has(relacio.origen) || !persones.has(relacio.desti) || relacio.origen === relacio.desti) throw new TypeError('Relació genealògica invàlida');
    if (!['confirmat', 'aproximat', 'falta-confirmar', 'contradiccio'].includes(relacio.certesa)) throw new TypeError('Falta certesa explícita');
    text(relacio.font, 'relacio.font');
    const clau = [relacio.tipus, relacio.origen, relacio.desti].join(':');
    if (claus.has(clau)) throw new TypeError('Relació duplicada');
    claus.add(clau);
    const origen = persones.get(relacio.origen), desti = persones.get(relacio.desti);
    if (relacio.tipus === 'progenitor' && origen.naixement !== undefined && desti.naixement !== undefined && origen.naixement >= desti.naixement) avisos.push(`cronologia:${clau}:progenitor-no-anterior`);
  }
  return avisos.sort(compara);
}

/**
 * fonts: [{id, tipus, titol, text?, okf?:{frontmatter,cos}, genealogia?}].
 * Les fonts s'ordenen per id; no es fusionen persones ni s'omplin buits.
 * `tesaurus` és injectable; per defecte usa el catàleg viu amb import diferit.
 */
export async function compilaWikiKarpathy(fonts, opcions = {}) {
  if (!Array.isArray(fonts) || fonts.length > LIMITS_COMPILADOR.fonts) throw new TypeError('Nombre de fonts invàlid');
  // La llista exterior i el tesaurus també són dades JSON, amb les mateixes
  // garanties que cada font. Cap getter s'executa abans de la còpia.
  const fontsPlanes = JSON.parse(serialitzaCanonica(fonts));
  const opcionsPlanes = JSON.parse(serialitzaCanonica(opcions));
  const tesaurus = opcionsPlanes.tesaurus ?? (await import('../../../src/data/taxonomia/tesaurusDoctoralSocDePoble.js')).FACETA_4_ETIQUETES_SKOS;
  if (!Array.isArray(tesaurus)) throw new TypeError('Tesaurus invàlid');
  const ids = new Set(), articles = [], originals = [];
  let total = 0;
  // Serialització abans de qualsevol lectura de propietats: cap getter executable.
  const copies = fontsPlanes.map(font => {
    const raw = serialitzaCanonica(font);
    const mida = codifica(raw).length;
    total += mida;
    if (mida > LIMITS_COMPILADOR.bytesFont || total > LIMITS_COMPILADOR.bytesTotal) throw new RangeError('Corpus massa gran');
    return { font: JSON.parse(raw), raw };
  }).sort((a, b) => compara(a.font.id, b.font.id));
  for (const { font, raw } of copies) {
    if (!idValid(font.id) || ids.has(font.id) || !TIPUS.has(font.tipus)) throw new TypeError('Font invàlida o duplicada');
    ids.add(font.id);
    text(font.titol, 'titol');
    let relat, avisos = [];
    if (font.tipus === 'genealogia') {
      avisos = validaGenealogia(font.genealogia);
      relat = serialitzaCanonica(font.genealogia);
    } else if (font.okf) {
      const fm = font.okf.frontmatter;
      if (font.tipus !== 'memoria-oral' || !fm || typeof fm.type !== 'string' || !Array.isArray(fm.sources) || !fm.sources.length) throw new TypeError('Fitxa OKF v0.2 invàlida');
      if (font.okf.okf_version !== undefined && font.okf.okf_version !== '0.2') throw new TypeError('Versió OKF incompatible');
      relat = text(font.okf.cos, 'okf.cos', LIMITS_COMPILADOR.bytesFont);
    } else relat = text(font.text, 'text', LIMITS_COMPILADOR.bytesFont);
    const fontJson = raw + '\n';
    // La cita apunta a un fitxer: el hash ha de cobrir els bytes entregats,
    // inclòs el salt final, perquè shasum puga verificar la font enllaçada.
    const hash = await sha256(fontJson);
    const conceptes = conceptesDelText(relat, tesaurus);
    const frontmatter = { type: 'Article Wiki de Poble', title: font.titol, status: 'draft', visibility: 'private', generated: { by: `socdepoble-karpathy-wiki/${VERSIO_COMPILADOR}` }, sources: [{ id: font.id, resource: `../fonts/${font.id}.json`, sha256: hash }], tags: conceptes.map(c => c.id) };
    const cites = relat.split(/\r?\n/).map(linia => '> ' + md(linia)).join('\n');
    const markdown = ['---', ...Object.entries(frontmatter).map(([clau, valor]) => `${clau}: ${JSON.stringify(valor)}`), '---', '', '# ' + md(font.titol), '', '## Font documental', '', cites, '', `Font íntegra: [${font.id}](../fonts/${font.id}.json) · SHA-256: ${hash}`, '', '## Enllaços lèxics al tesaurus', '', ...conceptes.map(c => `* [${md(c.prefLabel)}](/page/tesaurus#${c.id}) — coincidència lèxica; cal revisió semàntica.`), '', '## Revisió', '', 'Esborrany privat. Les cites són testimonis documentals; el compilador no les confirma ni inferix parentius.', ...avisos.map(avis => '* ' + avis), ''].join('\n');
    articles.push({ id: font.id, cami: `articles/${font.id}.md`, frontmatter, conceptes, avisos, markdown, sha256: await sha256(markdown) });
    originals.push({ id: font.id, cami: `fonts/${font.id}.json`, json: fontJson, sha256: hash, contingutSha256: await sha256(raw) });
  }
  const index = ['---', 'okf_version: "0.2"', '---', '', '# Wiki de Poble', '', ...articles.map(a => `* [${md(a.frontmatter.title)}](${a.cami})`), ''].join('\n');
  const registre = articles.map(a => `${a.id}\t${a.sha256}\t${a.frontmatter.sources[0].sha256}\tdraft/private`).join('\n') + (articles.length ? '\n' : '');
  const manifest = { schema: 'sdp.karpathy-wiki.v1', compilador: VERSIO_COMPILADOR, fitxers: [...articles.map(a => ({ cami: a.cami, sha256: a.sha256 })), ...originals.map(f => ({ cami: f.cami, sha256: f.sha256 })), { cami: 'index.md', sha256: await sha256(index) }, { cami: 'log.md', sha256: await sha256(registre) }].sort((a, b) => compara(a.cami, b.cami)) };
  return { versio: VERSIO_COMPILADOR, okfVersion: '0.2', articles, fonts: originals, index, registre, manifest };
}
export const compilaKarpathyWiki = compilaWikiKarpathy;
export const compilaWikiDePoble = compilaWikiKarpathy;
