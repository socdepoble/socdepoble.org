// @vitest-environment node
/* T11-05 (Gemini, Tall 11; marató 261101_2143; guia de botigues, 14.1.3) · La
   ubicació, la data i les dades de la càmera de les fotos (l'EXIF que P1-64
   deixa conservar) són un tractament: l'apartat 8 de /legal diu què guardem i
   com es tria, i el 13, qui ho veu (el precedent R3-06 de legal.dsa.test.js).
   Cada frase surt del codi, i esta guarda llig el codi: si la casella deixa de
   vindre marcada (al diàleg o a les fotos del cos), si canvia una etiqueta, una
   precisió o la de sèrie, si la foto de perfil deixa d'eixir neta, si un flux
   real oferix geolocalitzar a mà, si l'espai de les fotos publicades deixa de
   ser públic o si algú llig la ubicació del dispositiu, el text menteix i esta
   prova falla. La ubicació no és cap «cosa opcional» de l'apartat 9: la
   casella ve marcada, i un consentiment no pot vindre marcat. */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { legalContent } from './legalContent.js';
import { PRECISIONS, PRECISIO_PER_DEFECTE_PUBLICACIO } from '../../components/universal/enquadrament/geolocalitzacio.js';
import { ETIQUETA_CONSERVA_CAMERA, ETIQUETA_CONSERVA_EXIF, etiquetaConservaExif } from '../../components/universal/enquadrament/exifIncrustat.js';
import { FORMES } from '../../components/universal/enquadrament/useEnquadramentImatge.jsx';
import { TIPUS_DEL_MAPA, esPublicacioDelMapa } from '../mur/puntsDelMapa.js';

const ARREL = process.cwd();
const HTML = legalContent.html;
const pla = (tros) => tros.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const llig = (rel) => readFileSync(path.join(ARREL, rel), 'utf8');

/** L'HTML de l'apartat «N. Títol», fins a l'apartat següent. */
function apartat(numero) {
  const inici = HTML.indexOf(`<h4>${numero}. `);
  const fi = HTML.indexOf(`<h4>${numero + 1}. `, inici);
  expect([numero, inici > 0, fi > inici]).toEqual([numero, true, true]);
  return HTML.slice(inici, fi);
}

const ROTUL = '<strong>Ubicació, data i càmera de les fotos que publiques:</strong>';
/** El text pla de la vinyeta de l'apartat 8. */
function vinyeta() {
  const html = apartat(8);
  const inici = html.indexOf(`<li>${ROTUL}`);
  expect(inici).toBeGreaterThan(0);
  return pla(html.slice(inici, html.indexOf('</li>', inici)));
}

/* Els fitxers de codi de src (sense proves). */
function codiDeSrc(dir = path.join(ARREL, 'src')) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const ruta = path.join(dir, e.name);
    if (e.isDirectory()) return codiDeSrc(ruta);
    return /\.(?:js|jsx|mjs)$/.test(e.name) && !/\.test\.|\.spec\./.test(e.name) ? [ruta] : [];
  });
}
const relatiu = (f) => path.relative(ARREL, f).split(path.sep).join('/');

/* El codi que arriba a producció: sense l'especimen de Disseny, que «no puja res». */
const codiDeProduccio = () => codiDeSrc().filter((f) => !relatiu(f).startsWith('src/sections/disseny/'));

/* La ubicació del dispositiu: l'API del navegador (també destructurada) i el connector natiu. */
const LLIG_EL_DISPOSITIU = /\bgeolocation\b|getCurrentPosition|watchPosition|@capacitor\/geolocation|background-geolocation/;

/* L'últim estat declarat del bucket públic 'mitjans' a les migracions, per ordre de nom. */
function mitjansEsPublic() {
  const dir = path.join(ARREL, 'supabase/migrations');
  const DECLARACIO = /values\s*\(\s*'mitjans'\s*,\s*'mitjans'\s*,\s*(true|false)|set\s+public\s*=\s*(true|false)\s+where\s+id\s*=\s*'mitjans'(?!\w)/gi;
  let estat = null;
  for (const fitxer of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    const sql = readFileSync(path.join(dir, fitxer), 'utf8').split('\n').map((l) => l.replace(/--.*$/, '')).join('\n');
    for (const m of sql.matchAll(DECLARACIO)) estat = (m[1] ?? m[2]).toLowerCase() === 'true';
  }
  return estat;
}

describe('/legal · ubicació, data i càmera de les fotos (T11-05)', () => {
  test('una sola vinyeta, a l’apartat 8, just després de «Contingut que publiques»', () => {
    expect(HTML.split(ROTUL)).toHaveLength(2);
    const html = apartat(8);
    expect(html).toContain(ROTUL);
    const vinyetes = [...html.matchAll(/<li><strong>([^<]+)<\/strong>/g)].map((m) => m[1]);
    expect(vinyetes.indexOf('Ubicació, data i càmera de les fotos que publiques:')).toBe(vinyetes.indexOf('Contingut que publiques:') + 1);
  });

  test('què porten les fotos: el lloc, la data i les dades de la càmera, com les compta exifIncrustat', () => {
    expect(vinyeta()).toContain('el lloc on es van fer, la data i les dades de la càmera (la marca, el model i, de vegades, un número de sèrie o un nom)');
  });

  test('la casella es diu com al codi (les dues etiquetes) i ve marcada al diàleg i a les fotos del cos', () => {
    expect([ETIQUETA_CONSERVA_EXIF, ETIQUETA_CONSERVA_CAMERA]).toEqual(['Conserva la ubicació i la data de la foto', 'Conserva les dades de la càmera de la foto']);
    // Una foto amb ubicació o data, i una que només porta la càmera.
    expect([etiquetaConservaExif({ gps: { lat: 38.56, lng: -0.42 } }), etiquetaConservaExif({ estat: 'publicable', contingut: { ubicacio: false, data: false } })])
      .toEqual([ETIQUETA_CONSERVA_EXIF, ETIQUETA_CONSERVA_CAMERA]);
    expect(vinyeta()).toContain(`la casella «${ETIQUETA_CONSERVA_EXIF}» (o «${ETIQUETA_CONSERVA_CAMERA}», si només porta les de la càmera) ve marcada i la pots desmarcar`);
    // El diàleg d'enquadrament (capçaleres) i la pregunta de les fotos del cos (DocumentEditor), marcades de sèrie.
    const dialeg = llig('src/components/universal/enquadrament/DialegEnquadrament.jsx');
    expect(dialeg.match(/const \[conservaExif, setConservaExif\] = useState\((\w+)\);/)?.[1]).toBe('true');
    const cos = llig('src/components/universal/DocumentEditor.jsx');
    expect([...cos.matchAll(/setPreguntaExif\(\{ exif, conserva: (\w+),/g)].map((m) => m[1])).toEqual(['true']);
    expect(vinyeta()).toContain('Si desmarques la casella, la foto es puja sense res d\'això.');
  });

  test('les tres precisions del codi, ni una més ni una menys; la de sèrie de les fotos, exacta', () => {
    // Si el codi afig, lleva o canvia una precisió, el text s'ha de tornar a escriure.
    expect(PRECISIONS.map((p) => [p.valor, p.etiqueta, p.precisio_m])).toEqual([['exacta', 'Exacta', 1], ['100m', 'Uns 100 m', 100], ['poble', 'Només el poble', 1000]]);
    expect(vinyeta()).toContain(`el lloc el pots deixar exacte o rebaixar-lo a uns ${PRECISIONS[1].precisio_m} metres o només al poble`);
    // «Deixar-lo exacte»: la de sèrie de les fotos de publicació és l'exacta (P1-64, decisió 8).
    expect(PRECISIO_PER_DEFECTE_PUBLICACIO).toBe('exacta');
  });

  test('situar una foto al mapa a mà: el text només ho diu si un flux real ho oferix (hui, cap)', () => {
    const dialeg = llig('src/components/universal/enquadrament/DialegEnquadrament.jsx');
    expect(dialeg).toMatch(/^\s*permetGeolocalitzacio = false,$/m);
    // Les crides de producció al diàleg (sense l'especimen de Disseny).
    const crides = codiDeProduccio().filter((f) => /<DialegEnquadrament\b/.test(readFileSync(f, 'utf8'))).map(relatiu);
    expect(crides).toEqual(expect.arrayContaining(['src/components/universal/UniversalEditorShell.jsx', 'src/components/universal/enquadrament/useEnquadramentImatge.jsx']));
    const oferixen = crides.filter((f) => [...llig(f).matchAll(/permetGeolocalitzacio(=\{false\})?/g)].some((m) => !m[1]));
    const ofereixManual = oferixen.length > 0;
    expect([oferixen, /(?:^|\s)a mà(?=[\s,.;:)])|manualment/.test(vinyeta())]).toEqual([oferixen, ofereixManual]);
  });

  test('on es pot conservar i on ix sempre neta: la capçalera d’una entitat sí; la foto de perfil i el logotip, mai', () => {
    expect(FORMES.capcalera.conservaExif).toBe(true);
    expect([FORMES.avatar.conservaExif, FORMES.avatar.avisGpsEliminat]).toEqual([false, true]);
    expect(FORMES.logotip.conservaExif).toBe(false);
    // La capçalera d'una persona és d'identitat (PerfilEditor: identitat només per a la persona).
    expect(llig('src/sections/profile/PerfilEditor.jsx')).toMatch(/camp: 'heroImage', forma: 'capcalera'[\s\S]{0,200}identitat: mena === 'persona'/);
    expect(vinyeta()).toContain('Quan afiges una foto a una nota o a una publicació, o la poses de capçalera a la fitxa d\'una entitat,');
    expect(vinyeta()).toContain('La foto de perfil, la capçalera del teu perfil i el logotip d\'una entitat es desen sempre sense res d\'això.');
  });

  test('el fitxer d’una foto publicada és en un espai públic: el text ho diu mentre el bucket ho siga', () => {
    // Les fotos de les notes van al bucket privat i, en publicar-les, es promouen al públic sense mirar la visibilitat.
    const storage = llig('src/data/supabase/storage.js');
    expect(storage).toContain("const isPrivate = carpeta === 'notes';");
    expect(storage).toContain("const bucket = isPrivate ? 'mitjans_privats' : 'mitjans';");
    expect(llig('src/sections/notes/NotesContext.jsx').match(/await promoteToPublic\(/g)?.length).toBeGreaterThanOrEqual(3);
    const publicAra = mitjansEsPublic();
    expect(typeof publicAra).toBe('boolean');
    const frase8 = 'Quan publiques una foto, o la poses de capçalera d\'una fitxa, el seu fitxer es guarda en un espai públic: qualsevol persona que arribe al seu enllaç el pot baixar amb tot el que porta dins, encara que la publicació o la fitxa no siguen públiques.';
    const frase13 = 'i també qualsevol persona que arribe a l\'enllaç del fitxer de la foto, encara que la publicació o la fitxa no siguen públiques';
    expect([vinyeta().includes(frase8), pla(apartat(13)).includes(frase13)]).toEqual([publicAra, publicAra]);
  });

  test('el mapa fotogràfic del Mur només pinta publicacions, i el text ho diu així', () => {
    expect(vinyeta()).toContain('la foto d\'una publicació pot eixir al mapa fotogràfic del Mur en eixe punt');
    // Publicacions, actes i patrimoni: cap perfil, cap xat, cap nota privada.
    expect(TIPUS_DEL_MAPA).toEqual(['feed', 'post', 'publicacio', 'event', 'patrimoni']);
    expect([esPublicacioDelMapa({ id: 'p1', type: 'post' }), esPublicacioDelMapa({ id: 'u1', type: 'profile' }), esPublicacioDelMapa({ id: 'n1', type: 'nota' })]).toEqual([true, false, false]);
  });

  test('«No llegim mai la ubicació del teu dispositiu»: ni el web ni les apps natives la demanen', () => {
    expect(vinyeta()).toMatch(/No llegim mai la ubicació del teu dispositiu\.$/);
    const fitxers = codiDeSrc();
    expect(fitxers.length).toBeGreaterThan(500);
    expect(fitxers.filter((f) => LLIG_EL_DISPOSITIU.test(readFileSync(f, 'utf8'))).map(relatiu)).toEqual([]);
    // L'expressió també caça la forma destructurada i el connector natiu.
    for (const mostra of ['const { geolocation } = navigator;', 'navigator . geolocation', "import { Geolocation } from '@capacitor/geolocation';", 'g.watchPosition(f)']) expect(LLIG_EL_DISPOSITIU.test(mostra), mostra).toBe(true);
    expect(LLIG_EL_DISPOSITIU.test('payload.geolocalitzacio')).toBe(false);
    // Cap permís d'ubicació a les apps natives (versionades; una còpia sense natius se les bota, com projecteAndroid.test.js).
    const MANIFEST = 'android/app/src/main/AndroidManifest.xml';
    if (existsSync(path.join(ARREL, MANIFEST))) expect(llig(MANIFEST).replace(/<!--[\s\S]*?-->/g, '')).not.toMatch(/ACCESS_(?:FINE|COARSE|BACKGROUND)_LOCATION/);
    const PLIST = 'ios/App/App/Info.plist';
    if (existsSync(path.join(ARREL, PLIST))) expect(llig(PLIST)).not.toMatch(/NSLocation\w*UsageDescription/);
  });

  test('l’apartat 13 diu qui ho veu; l’apartat 9 no ho posa entre els consentiments', () => {
    expect(pla(apartat(13))).toContain('La ubicació, la data i les dades de la càmera que conserves en una foto les pot veure qui veu la publicació o la fitxa on és,');
    expect(pla(apartat(13))).toContain('; la foto d\'una publicació pot eixir al mapa fotogràfic del Mur.');
    const opcionals = pla(apartat(9).split('<li>').find((li) => li.startsWith('<strong>Coses opcionals</strong>')) ?? '');
    expect(opcionals).toContain('consentiment');
    expect(opcionals).not.toMatch(/ubicació|EXIF|geolocalitz/i);
  });
});
