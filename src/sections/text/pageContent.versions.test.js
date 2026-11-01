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
import { CAPACITATS_NO_DECLARADES } from '../../data/local/adaptadorLocal.js';
// T8 · D-12: la capçalera es contrasta amb package.json i amb la capçalera del connector.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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
/* L'entrega de la nit de l'1 de novembre (Gauntlet 2 261101). Des de l'assalt de la tarda (pla
   261101_1246) ja no és la primera: es busca pel seu títol sencer, que comença per «· v». */
const entrega261101 = blocDe('1 de novembre de 2026 · v');
/* L'entrega de l'assalt al 10/10 (pla 261101_1246), la primera. */
const entregaAssalt = blocDe('1 de novembre de 2026, tarda');
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
  test('és la segona entrada, darrere de la de l’assalt, amb el format de les altres', () => {
    const titols = [...html.matchAll(/<h3>([^<]+)<\/h3>/g)].map((m) => m[1]);
    expect(titols[1]).toMatch(/^1 de novembre de 2026 · v/);
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
    /* T2 · D04/D10 (assalt 261101) · L'entrega de l'1 de novembre és la del format 1.1.0: el registre és
       històric, i la 1.2.0 (memòria oral i restaurador) va en una entrada pròpia. */
    expect(text(entrega261101)).toContain("a l'Open Data (format 1.1.0)");
    expect(VERSIO_FORMAT).toBe('1.2.0');
  });

  test('l’Open Data no promet el que no exporta, i la memòria oral no promet cap model de llenguatge', () => {
    /* Gauntlet transversal 261101 (H4-01) · L'entrada és història: diu en passat el que exportava, i no
       contradiu /page/fediversity, que ja porta les notícies i l'agenda (format 1.2.0, carril T2). */
    expect(text(entrega261101)).toContain("En esta entrega, la fitxa del poble encara només hi exportava el directori d'entitats; la lectura pública de les notícies i de l'agenda arriba amb el format 1.2.0, en una entrega posterior.");
    expect(text(entrega261101)).not.toMatch(/Hui la fitxa del poble|només hi exporta el directori/);
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

/* T8 · D-12 (pla 261101_1246, decisió del Mestre) · La capçalera de /versions és estàtica: un
   text de pageContent.js no pot saber quin build hi ha desplegat (la frontissa l'importa des de
   Node, sense Vite), i per això no en nomena cap. Diu la versió de package.json i la del
   connector publicada a WordPress.org, que no pot ser més nova que la del connector d'este
   repositori. L'entrada de les Rondes 1, 2 i 3 (31-10) porta el build que servia socdepoble.org
   en escriure-la, 261101 (assets/versio-Cuzo1lYB.js amb const t="261101" i index.html amb
   last-modified 2026-11-01T00:39:59Z, comprovat l'1-11-2026), i cada frase s'ha contrastat amb
   els trossos de producció d'eixe build. És història: es fixa literal i no es deriva del codi
   d'ara, que continuarà canviant. */
const llegix = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const PAQUET = JSON.parse(llegix('package.json'));
const entregaRondes = blocDe("31 d'octubre de 2026");
/** a ≤ b, per a versions X.Y.Z. */
const noMesNova = (a, b) => {
  const [x, y] = [a, b].map((v) => v.split('.').map(Number));
  const i = x.findIndex((n, j) => n !== y[j]);
  return i < 0 || x[i] < y[i];
};

describe('T8 · D-12 · capçalera estàtica i entrada de les Rondes 1, 2 i 3', () => {
  test('la capçalera diu la versió de package.json i la del connector publicada, sense cap build', () => {
    const { subtitle, labels } = PAGE_COPY.versions;
    const capcalera = subtitle.match(/^Versió actual: v(\d+\.\d+\.\d+) · Connector WordPress v(\d+\.\d+\.\d+) a WordPress\.org$/);
    expect(capcalera?.[1]).toBe(PAQUET.version);
    const publicada = capcalera[2];
    expect(labels.map((l) => l.text)).toEqual([`v${PAQUET.version} · WP v${publicada}`, 'Registre de canvis', 'Sistema']);
    for (const t of [subtitle, ...labels.map((l) => l.text)]) expect(t).not.toMatch(/build|\b\d{6}\b/i);
    /* La publicada és la que diu l'entrada més recent que nomena una versió a WordPress.org (la
       primera del registre, que va de la més nova a la més vella): les entrades velles són història
       i no es reescriuen quan es publica una versió nova. No pot ser més nova que la del connector. */
    const darreraPublicada = html.match(/<code>socdepoble<\/code>, en la versió (\d+\.\d+\.\d+)/)?.[1];
    expect(publicada).toBe(darreraPublicada);
    const connector = llegix('wordpress-plugin/socdepoble-enxufe.php').match(/^ \* Version:\s+(\d+\.\d+\.\d+)\s*$/m)?.[1];
    expect(noMesNova(publicada, connector), `${publicada} ≤ ${connector}`).toBe(true);
  });

  test('l’entrada va entre la de l’1 de novembre i la del 29 d’octubre, amb el format de les altres', () => {
    const posicio = (titol) => html.indexOf(`<h3>${titol}`);
    expect(posicio('1 de novembre de 2026')).toBeLessThan(posicio("31 d'octubre de 2026"));
    expect(posicio("31 d'octubre de 2026")).toBeLessThan(posicio("29 d'octubre de 2026"));
    expect(entregaRondes).toMatch(/^<h3>31 d'octubre de 2026 · v1\.0\.0 \(build 261101\) · Connector WordPress v1\.1\.10<\/h3>\n {6}<p>/);
    expect([...entregaRondes.matchAll(/<h4>([^<]+)<\/h4>\n {6}<ul>/g)].map((m) => m[1])).toEqual(['Novetats', 'Millorat', 'Corregit']);
    const elements = entregaRondes.match(/<li>[\s\S]*?<\/li>/g) ?? [];
    for (const li of elements) expect(li).toMatch(/^<li><strong>[^<]+(?:<a [^>]+>[^<]+<\/a>\))?:<\/strong> /);
    expect(elements.map((li) => text(li.match(/^<li><strong>([\s\S]*?)<\/strong>/)[1]))).toEqual([
      'Consola pública (/consola):', 'Tauler del comptador de visites (/legal):', 'Federació de només lectura:', 'Dades obertes del poble:',
      'Telemetria més clara:', 'Fletxes del teclat a les graelles de targetes:', 'Perfil públic en cinc llengües:', 'Atles de la IAIA:',
      'Fitxers del núvol:', 'Llistes:', "Fitxa d'empreses, entitats i ajuntaments:"
    ]);
    expect(entregaRondes.endsWith('</ul>\n\n      ')).toBe(true);
  });

  test('només el que ja servia producció: res de migracions sense aplicar, del xifratge ni dels rebuts d’entrega', () => {
    const pla = text(entregaRondes);
    expect(pla).toContain("publicada a socdepoble.org la matinada de l'1 de novembre");
    // Els rebuts d'entrega del Xat necessiten l'RPC xat_marca_rebut, que cap migració aplicada no crea.
    expect(pla).not.toMatch(/\bxifra(?:t|tge)\b|E2EE|rebut|migraci|pendent de desplegar/i);
    // El que encara no fa, ho diu.
    expect(pla).toContain('seguir o respondre des del Fedivers encara està pendent');
    /* Gauntlet transversal 261101 (H4-01) · El que exportava el paquet d'eixe build, en passat: hui ja hi
       van les notícies i l'agenda (/page/fediversity), i l'entrada no pot dir el contrari en present. */
    expect(pla).toContain("En esta entrega, el paquet portava el directori públic d'entitats; les notícies, l'agenda i la memòria cultural encara no s'hi exportaven.");
    expect(pla).not.toMatch(/Hui porta el directori|encara no s'hi exporten/);
    expect(pla).toContain('El registre final no es pot comprovar des del navegador.');
    // Les fletxes del Bloc de Notes ja hi eren: la Ronda 2 només les va posar a Pobles, al Mur i a la Consola.
    expect(text(entregaRondes.match(/<li><strong>Fletxes[\s\S]*?<\/li>/)[0])).not.toMatch(/Notes/);
    // DT-LLISTES-D1 (modules.css) lleva el marge de cada li (--sdp-li-gap), no cap marge de paràgraf.
    const llistes = text(entregaRondes.match(/<li><strong>Llistes:[\s\S]*?<\/li>/)[0]);
    expect(llistes).toContain('el marge de cada element de llista');
    expect(llistes).not.toMatch(/paràgraf/);
  });

  test('els enllaços interns porten a rutes de l’aplicació', () => {
    const interns = [...entregaRondes.matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1]);
    expect(interns).toEqual(['/consola', '/legal']);
    const rutes = llegix('src/app/App.jsx');
    for (const ruta of interns) expect(rutes).toMatch(new RegExp(`<Route path="${ruta}(?:/\\*)?" `));
  });
});

/* Assalt 10/10 (pla 261101_1246, torn_3f5652a2) · L'entrada de la tarda de l'1 de novembre: la
   primera, amb el format de les altres, i cap mentida bella. Res no és desplegat ni publicat, les
   migracions noves no estan aplicades i el xifratge continua apagat: el text ho diu, i cada peça
   que es pot derivar del codi se'n deriva. */
describe('Assalt 10/10 · /versions té l’entrada honesta de la tarda de l’1 de novembre', () => {
  const pla = text(entregaAssalt);

  test('és la primera entrada, amb el format de les altres', () => {
    expect(html.indexOf('<h3>')).toBe(html.indexOf('<h3>1 de novembre de 2026, tarda'));
    expect(entregaAssalt).toMatch(/^<h3>1 de novembre de 2026, tarda · v\d+\.\d+\.\d+ \(build pendent de desplegar\) · Connector WordPress v(\d+\.\d+\.\d+) al repositori<\/h3>\n {6}<p>/);
    expect([...entregaAssalt.matchAll(/<h4>([^<]+)<\/h4>\n {6}<ul>/g)].map((m) => m[1])).toEqual(['Novetats', 'Millorat', 'Corregit']);
    for (const li of entregaAssalt.match(/<li>[\s\S]*?<\/li>/g)) expect(li).toMatch(/^<li><strong>[^<]+:<\/strong> /);
    expect(entregaAssalt.endsWith('</ul>\n\n      ')).toBe(true);
  });

  test('el connector del títol és el del repositori, i no es diu publicat', () => {
    const connector = llegix('wordpress-plugin/socdepoble-enxufe.php').match(/^ \* Version:\s+(\d+\.\d+\.\d+)\s*$/m)?.[1];
    expect(entregaAssalt).toContain(`Connector WordPress v${connector} al repositori</h3>`);
    expect(pla).toContain(`Connector WordPress ${connector}: és al repositori`);
    expect(pla).toContain('pendent de publicar a WordPress.org');
    expect(entregaAssalt).not.toContain('en la versió'); // la capçalera llig la publicada d'una altra entrada
  });

  test('pendent de desplegar, migracions sense aplicar, xifratge apagat i bústia sense servei', () => {
    expect(E2EE_ACTIU_PER_DEFECTE).toBe(false);
    expect(pla).toContain('està pendent de desplegar');
    expect(pla).toContain("pendents d'aplicar");
    expect(pla).toContain('continua apagat');
    expect(pla).toContain('Cap conversa no es xifra encara.');
    expect(pla).toContain("Encara no s'ha desplegat cap bústia d'entrada");
    expect(pla).toContain('El build portarà la data del desplegament.');
    expect(pla).not.toMatch(/\bdesplegad[ae]s?\b|ja és en viu|ja està en producció|activaci[óo] autom[àa]tica/i);
  });

  test('les peces que es poden derivar del codi', () => {
    expect(VERSIO_FORMAT).toBe('1.2.0');
    expect(pla).toContain('Dades obertes 1.2.0 i restaurador:');
    expect(CAPACITATS_NO_DECLARADES).toEqual(['versioClient']);
    expect(pla).toContain("llevat de la versió mínima de l'app");
    expect(pla).toContain('<code>src/data/federacio/inboxActivityPub.js</code>'.replace(/<[^>]+>/g, ''));
  });

  test('cap enllaç intern ni «masia»', () => {
    expect([...entregaAssalt.matchAll(/href="(\/[^"]*)"/g)]).toHaveLength(0);
    expect(entregaAssalt).not.toMatch(/masia/i);
  });
});
