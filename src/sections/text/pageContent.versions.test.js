/* QA-R2-09 (Codex, Ronda 2; P2 editorial) · /versions no pot proclamar una
   «activació automàtica» del xat xifrat d'extrem a extrem mentre la bandera
   està apagada (src/config/xifratXat.js: E2EE_ACTIU_PER_DEFECTE = false). El
   text ha de dir que la implementació sdp-xat-v1 està preparada darrere d'una
   bandera apagada i pendent d'activació. Si un dia s'encén la bandera, esta
   prova obliga a tornar a escriure el text (no se'n deriva cap). El text de
   /versions només existix en valencià (PAGE_COPY no té traduccions).
   Gauntlet 2 261101 (carril Y; correcció del crític) · L'entrega de l'1 de
   novembre ja té la seua entrada, la primera. El bloc del 29 d'octubre es
   busca pel seu títol, no per la posició. */
import { describe, expect, test } from 'vitest';
import { E2EE_ACTIU_PER_DEFECTE } from '../../config/xifratXat.js';
import { CANALS_DE_BOTIGA } from '../../config/canalsDeBotiga.js';
import { VERSIO_FORMAT } from '../../data/exportaMunicipiOpenData.js';
import { VIGENCIA_ALERTA_MS } from '../mur/alertesMunicipals.js';
import { PAGE_COPY } from './pageContent.js';

const html = String(PAGE_COPY.versions?.html ?? '');
/* Un bloc d'entrega: del seu <h3> fins al <h3> següent (o fins al final). */
const blocDe = (titol) => {
  const inici = html.indexOf(`<h3>${titol}`);
  if (inici < 0) return '';
  const seguent = html.indexOf('<h3>', inici + 1);
  return html.slice(inici, seguent < 0 ? undefined : seguent);
};
/* L'entrega del 29 d'octubre, on parla de l'E2EE. */
const entrega261029 = blocDe("29 d'octubre de 2026");
/* L'entrega de l'1 de novembre (Gauntlet 2 261101), la primera. */
const entrega261101 = blocDe('1 de novembre de 2026');
const text = (fragment) => fragment.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');

describe('QA-R2-09 · /versions diu la veritat sobre l’E2EE', () => {
  test('la bandera continua apagada', () => {
    expect(E2EE_ACTIU_PER_DEFECTE).toBe(false);
  });

  test('cap activació automàtica ni «consolidat» mentre la bandera és apagada', () => {
    expect(entrega261029).toContain('xifrat d\'extrem a extrem');
    expect(html).not.toMatch(/activaci[óo] autom[àa]tica/i);
    expect(entrega261029).not.toMatch(/consolida el <strong>xifratge/);
  });

  test('diu que sdp-xat-v1 està preparat darrere d’una bandera apagada i pendent d’activació', () => {
    expect(entrega261029).toContain('<code>sdp-xat-v1</code>');
    expect(entrega261029).toContain('<code>E2EE_ACTIU_PER_DEFECTE = false</code>');
    expect(entrega261029).toMatch(/preparad[ae]/);
    expect(entrega261029).toContain('pendent d\'activació');
  });
});

/* Gauntlet 2 261101 (carril Y) · L'entrega de l'1 de novembre: el mateix format que les altres
   (un <h3> amb la data, la versió, el build i el connector; un paràgraf; Novetats, Millorat i
   Corregit) i cap mentida bella. El build el posa el desplegament: mentre no s'ha desplegat, el
   títol diu «pendent de desplegar» i cap frase no diu que ja siga al lloc publicat. Cada xifra
   que es pot derivar del codi, se'n deriva: si la peça canvia, la prova cau. */
describe('Gauntlet 2 261101 · /versions té l’entrada honesta de l’1 de novembre', () => {
  test('és la primera entrada, amb el format de les altres', () => {
    expect(html.indexOf('<h3>')).toBe(html.indexOf('<h3>1 de novembre de 2026'));
    expect(entrega261101).toMatch(/^<h3>1 de novembre de 2026 · v\d+\.\d+\.\d+ \(build pendent de desplegar\) · Connector WordPress v1\.1\.10<\/h3>\n {6}<p>/);
    const apartats = [...entrega261101.matchAll(/<h4>([^<]+)<\/h4>\n {6}<ul>/g)].map((m) => m[1]);
    expect(apartats).toEqual(['Novetats', 'Millorat', 'Corregit']);
    /* Cada element de llista, amb el seu nom en negreta i dos punts, com a les altres entrades. */
    for (const li of entrega261101.match(/<li>[\s\S]*?<\/li>/g)) expect(li).toMatch(/^<li><strong>[^<]+(?:<a [^>]+>[^<]+<\/a>\))?:<\/strong> /);
    expect(entrega261101.endsWith('</ul>\n\n      ')).toBe(true);
  });

  test('pendent de desplegar: cap frase no diu que ja siga al lloc publicat, tret del connector de WordPress.org', () => {
    expect(text(entrega261101)).toContain('està pendent de desplegar');
    expect(text(entrega261101)).toContain('El build portarà la data del desplegament.');
    expect(entrega261101).not.toMatch(/build \d{6}/);
    expect(text(entrega261101)).not.toMatch(/\bdesplegad[ae]s?\b|ja és en viu|ja està en producció/i);
  });

  test('el connector: l’adreça és la del canal obert de WordPress.org, amb target i rel', () => {
    const wordpress = CANALS_DE_BOTIGA.find((c) => c.id === 'wordpress-org');
    expect(wordpress.url).toBe('https://wordpress.org/plugins/socdepoble/');
    expect(entrega261101).toContain(`<a href="${wordpress.url}" target="_blank" rel="noopener noreferrer">wordpress.org/plugins/socdepoble</a>`);
    expect(entrega261101).toContain('<code>socdepoble</code>, en la versió 1.1.10');
  });

  test('les xifres derivades del codi: 72 hores d’alerta i el format Open Data', () => {
    expect(VIGENCIA_ALERTA_MS).toBe(72 * 60 * 60 * 1000);
    expect(text(entrega261101)).toContain(`fins a ${VIGENCIA_ALERTA_MS / 3600000} hores després de la seua data`);
    expect(text(entrega261101)).toContain(`a l'Open Data (format ${VERSIO_FORMAT})`);
  });

  test('l’Open Data no promet el que no exporta, i la memòria oral no promet cap model de llenguatge', () => {
    expect(text(entrega261101)).toContain("Hui la fitxa del poble encara només hi exporta el directori d'entitats");
    expect(text(entrega261101)).toContain('sense xarxa ni models de llenguatge');
    expect(text(entrega261101)).toContain('naix com a esborrany');
  });

  test('cap «masia» a /versions', () => {
    expect(html).not.toMatch(/masia/i);
  });

  test('els enllaços interns porten a rutes de l’aplicació', () => {
    const interns = [...entrega261101.matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1]);
    expect(interns).toEqual(['/descarregues', '/page/fediversity', '/multimedia']);
  });
});
