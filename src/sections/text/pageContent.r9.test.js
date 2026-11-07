/**
 * Onada R9 (ordre del Mestre del 261106, 14:06) · Carril C1.
 *
 * 1. El balanç datat de /fedivers, /page/fediversity i /page/node-zero passa al
 *    6 de novembre (producció R1–R8). Cada afirmació nova s'ancora al codi: si
 *    una migració desapareix, si l'E2EE s'encén o si algú escriu el dictat de
 *    veu, la prova cau i el text s'ha de tornar a escriure. Les negacions del
 *    balanç («no s'han aplicat», «cap consumidor», «continua apagat», «sense
 *    les quals … no poden arribar», «este balanç no l'acredita») es fixen amb la
 *    frase exacta de cada llengua (R9V-C1-03, R9V-C1-05). L'entrada «5 de
 *    novembre · v1.2.0» de /versions és història i no es reescriu.
 * 2. R7G-5-05 · La traducció no es presenta com a local ni sense fugida: el text
 *    públic ix cap a Apertium (o MyMemory, de Translated, per a l'euskera i
 *    l'alemany) amb l'IP del visitant, i la introducció no diu que no isca cap
 *    dada privada (R9V-C1-01, R9V-C1-02).
 * 3. R7G-9-02 · El dictat amb SuperWhisper i Parakeet és un pla, no una funció.
 * 4. /page/herbari en les 5 llengües de la interfície, amb el mateix text que el
 *    valencià i les frases de consum de textosHerbari.js (G6-03).
 * 5. Gauntlet de l'arbre R9 (arreglador FA i àrbitre) · G1-01 i FAV-04: la
 *    lectura del 6-11 dona la 2611051930 a producció (taula note_folders). G1-06 i G3-N02:
 *    què falta de veres per a les connexions (la migració i l'interruptor) i
 *    per al push (lectura del 6-11: les taules hi són; falta la clau VAPID, i
 *    FAV-01: no s'ha comprovat ni la funció notifica-xat ni push_xat_actiu).
 *    G1-03: els models d'Ollama, com diu la font, i el cens de portes datat.
 *    G1-04: el consum no s'ha mesurat. G1-05: l'Atles té ATLES_OPERATIU.length
 *    entrades. G1-09: retocs de gl i en a les pàgines de patrimoni.
 * 6. Onada R10 · B4 · Veritat d'estat. La lectura REST de producció del 6-11-2026 (22:08, només GET)
 *    troba aplicades la 2611032100, la 2611051930, la 2611052345, la 2611060010 i la 2611061520 (les
 *    cinc que el Mestre diu haver aplicat el 6-11), i també la 2611030330 i la 2611031700. El balanç diu
 *    el fet; les connexions queden enceses en este build (CONNEXIONS_PUBLIQUES_REMOTES_ACTIVES = true).
 *    VFT-02 (negació datada del push), VFT-05 (la 2.5 ja hi és), VFT-06 («si en falta qualsevol»),
 *    VFT-07 (entorns, «cada onada» i l'ancoratge de les proves), VFT-08 (el dossier antic) i VFT-03 (cap
 *    negació d'aplicació al costat d'una migració aplicada, en cap llengua). El títol «producció R1–R8»
 *    era literal de l'ordre del Mestre de R9 (G1-10).
 * 7. Onada R11 (kit R89 de Gemini; ordre del Mestre, ESTAT 261107_0457) · Els títols passen a
 *    «producció R1–R10» i «R5–R10» (literals de l'ordre). Arbitratge R11 (R89-L2-03) · El balanç
 *    passa al 7 de novembre (el COMMIT R10, 09a664171, és del 7-11): el primer paràgraf nomena el
 *    COMMIT R10 i ja no el COMMIT R1–R8, i el pilot socdepoble.cat va amb la lectura HTTP datada
 *    del 7-11 (el seu fragment de pageContent encara no portava el balanç R9–R10).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { PAGE_COPY } from './pageContent.js';
import { localitzaPagina } from './pageContent.r10.js';
import { sanitizeHtml } from '../../utils/sanitize.js';
import { E2EE_ACTIU_PER_DEFECTE } from '../../config/xifratXat.js';
import { pluginPerId } from '../plugins/registrePlugins.js';
import { ESPECIES_HERBARI_LA_TORRE_117 } from '../../data/patrimoni/herbariLaTorre117.js';
import { textosHerbari } from '../patrimoni/textosHerbari.js';
import { MOTORS_TRADUCCIO } from '../../data/traductorLliure.js';
import { contingutNoTraduible } from '../../data/traductor.js';
import { ATLES_OPERATIU } from '../../data/iaiaLocal.js';
import { CONNEXIONS_PUBLIQUES_REMOTES_ACTIVES } from '../../config/connexionsPubliques.js';
import { AVISOS_PUSH_XAT_ACTIUS } from '../../config/avisosPushXat.js';
import { passos } from '../../../tooling/gates/run-portes.mjs';

const ARREL = path.resolve(import.meta.dirname, '../../..');
const llegix = (rel) => readFileSync(path.join(ARREL, rel), 'utf8');
const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];
const PAGINES = ['fedivers', 'fediversity', 'node-zero'];
const doc = (html) => new DOMParser().parseFromString(sanitizeHtml(html), 'text/html');
const pagina = (clau, llengua) => localitzaPagina(PAGE_COPY[clau], llengua);
/* Els nodes d'una secció: del seu H3 fins al següent H3. */
const seccio = (body, titol) => {
  const h3 = [...body.querySelectorAll('h3')].find((h) => h.textContent === titol);
  const nodes = [];
  for (let n = h3?.nextElementSibling; n && n.tagName !== 'H3'; n = n.nextElementSibling) nodes.push(n);
  return nodes;
};

const BALANC = {
  ca: ['7 de novembre de 2026 · Balanç verificat · producció R1–R10', 'Preparat al codi i novetats integrades en R5–R10', 'Què falta demostrar'],
  es: ['7 de noviembre de 2026 · Balance verificado · producción R1–R10', 'Preparado en el código y novedades integradas en R5–R10', 'Qué falta demostrar'],
  en: ['7 November 2026 · Verified balance · R1–R10 in production', 'Prepared in the code and features integrated in R5–R10', 'What remains to be demonstrated'],
  eu: ['2026ko azaroaren 7a · Egiaztatutako balantzea · R1–R10 produkzioan', 'Kodean prestatuta eta R5–R10 olatuetan integratuta', 'Zer falta da frogatzeko'],
  gl: ['7 de novembro de 2026 · Balance verificado · produción R1–R10', 'Preparado no código e novidades integradas en R5–R10', 'Que falta demostrar']
};
/* Les frases exactes de cada negació (text pintat, sense etiquetes). */
const NEGA = {
  ca: {
    versio: 'la versió depén del connector instal·lat i este balanç no l’acredita',
    consumidor: 'no té cap consumidor de producció', aplicades: 'ja són a producció: el Mestre les hi va aplicar el 6 de novembre, i la lectura REST d’eixe dia en troba les funcions',
    troballes: 'Les quatre troballes d’auditoria que tenien continuen per decidir.',
    connexions: 'la migració 2611032100 és a producció des del 6 de novembre, quan l’hi va aplicar el Mestre; la lectura REST d’eixe dia en troba les consultes públiques',
    vapid: 'sense ella, cap navegador no s’hi pot subscriure ni rebre cap avís', apagat: 'L’E2EE continua apagat per defecte'
  },
  es: {
    versio: 'la versión depende del conector instalado y este balance no la acredita',
    consumidor: 'no tiene ningún consumidor de producción', aplicades: 'ya están en producción: el Mestre las aplicó el 6 de noviembre, y la lectura REST de ese día encuentra sus funciones',
    troballes: 'Los cuatro hallazgos de auditoría que tenían siguen por decidir.',
    connexions: 'la migración 2611032100 está en producción desde el 6 de noviembre, cuando la aplicó el Mestre; la lectura REST de ese día encuentra sus consultas públicas',
    vapid: 'sin ella, ningún navegador puede suscribirse ni recibir avisos', apagat: 'El E2EE sigue apagado por defecto'
  },
  en: {
    versio: 'its version depends on the installed connector and this balance does not certify it',
    consumidor: 'has no production consumer', aplicades: 'are already in production: the Mestre applied them on 6 November, and that day’s REST check finds their functions',
    troballes: 'The four audit findings they carried are still awaiting a decision.',
    connexions: 'migration 2611032100 has been in production since 6 November, when the Mestre applied it; that day’s REST check finds its public queries',
    vapid: 'without it, no browser can subscribe or receive a notification', apagat: 'E2EE stays off by default'
  },
  eu: {
    versio: 'bertsioa instalatutako konektorearen araberakoa da, eta balantze honek ez du egiaztatzen',
    consumidor: 'ez du produkzioko kontsumitzailerik', aplicades: 'produkzioan daude jada: Mestreak azaroaren 6an aplikatu zituen, eta egun horretako REST irakurketak haien funtzioak aurkitzen ditu',
    troballes: 'Zituzten ikuskaritzako lau aurkikuntzak erabakitzeko daude oraindik.',
    connexions: '2611032100 migrazioa produkzioan dago azaroaren 6tik, Mestreak orduan aplikatu baitzuen; egun horretako REST irakurketak haren kontsulta publikoak aurkitzen ditu',
    vapid: 'hori gabe, ezein nabigatzailek ezin du harpidetzarik egin ezta abisurik jaso ere', apagat: 'E2EE lehenespenez itzalita dago'
  },
  gl: {
    versio: 'a versión depende do conector instalado e este balance non a acredita',
    consumidor: 'non ten ningún consumidor de produción', aplicades: 'xa están en produción: o Mestre aplicounas o 6 de novembro, e a lectura REST dese día atopa as súas funcións',
    troballes: 'Os catro achados de auditoría que tiñan seguen por decidir.',
    connexions: 'a migración 2611032100 está en produción desde o 6 de novembro, cando a aplicou o Mestre; a lectura REST dese día atopa as súas consultas públicas',
    vapid: 'sen ela, ningún navegador pode subscribirse nin recibir avisos', apagat: 'O E2EE segue apagado por defecto'
  }
};

/* Arbitratge R11 (R89-L2-03) · El pilot no servix «el mateix COMMIT»: la lectura HTTP del 7-11-2026
   (07:07, només GET) troba el text R9–R10 al fragment de pageContent de socdepoble.org i no al de
   socdepoble.cat. La frase ho diu amb la data de la lectura. */
const PILOT = {
  ca: 'segons la lectura HTTP del 7 de novembre, el pilot socdepoble.cat encara servia una compilació anterior a este balanç',
  es: 'según la lectura HTTP del 7 de noviembre, el piloto socdepoble.cat aún servía una compilación anterior a este balance',
  en: 'according to the 7 November HTTP check, the socdepoble.cat pilot was still serving a build older than this balance',
  eu: 'azaroaren 7ko HTTP irakurketaren arabera, socdepoble.cat pilotuak balantze hau baino lehenagoko konpilazio bat zerbitzatzen zuen oraindik',
  gl: 'segundo a lectura HTTP do 7 de novembro, o piloto socdepoble.cat aínda servía unha compilación anterior a este balance'
};

describe('Onada R9 i R11 · balanç del 7 de novembre (producció R1–R10)', () => {
  test.each(LLENGUES)('%s · les tres pàgines obrin amb el balanç nou i els tres dominis en ordre', (llengua) => {
    for (const clau of PAGINES) {
      const body = doc(pagina(clau, llengua).html).body;
      const titols = [...body.querySelectorAll('h3')].map((h) => h.textContent);
      const inici = clau === 'fediversity' && llengua !== 'ca' ? 1 : 0; // la fediversity traduïda obri amb el bloc NLnet
      expect(titols.slice(inici, inici + 3), `${clau} ${llengua}`).toEqual(BALANC[llengua]);
      const produccio = seccio(body, BALANC[llengua][0]);
      const externs = produccio.flatMap((n) => [...n.querySelectorAll('a[href^="https://"]')].map((a) => a.getAttribute('href')));
      expect(externs.slice(0, 3)).toEqual(['https://socdepoble.org', 'https://gentdelatorre.net', 'https://socdepoble.cat']);
      const text = produccio.map((n) => n.textContent).join(' ');
      // R89-L2-03 · el primer paràgraf nomena el COMMIT R10 (R1–R10), mai el COMMIT R1–R8 d'abans.
      expect(text).toContain('R1–R10');
      expect(text, `${clau} ${llengua}`).toMatch(/COMMIT R10|R10 COMMITa/);
      expect(text, `${clau} ${llengua}`).not.toMatch(/COMMIT R1–R8|R1–R8 COMMITa|mateix COMMIT|mismo COMMIT|same COMMIT|COMMIT bera|mesmo COMMIT/);
      expect(text, `${clau} ${llengua}`).toContain(PILOT[llengua]);
      expect(text).not.toContain('R1–R6');
      // R9V-C1-03 · cap font no diu quina versió servix gentdelatorre.net: el text no la dona per igual.
      expect(text, `${clau} ${llengua}`).toContain(NEGA[llengua].versio);
      expect(text).not.toMatch(/mateixa aplicació|misma aplicación|same application|aplikazio bera|mesma aplicación/);
      const pendent = seccio(body, BALANC[llengua][2]).map((n) => n.textContent).join(' ');
      for (const fet of ['2611032100', '2611061520', 'VAPID', 'E2EE', 'R-5', '3-2-1', 'Nix']) expect(pendent, `${clau} ${llengua} ${fet}`).toContain(fet);
      // R10 · B4 · La 2611052345 i la 2611060010 ja són a producció: no són pendents (van al preparat, amb el fet).
      for (const fet of ['2611052345', '2611060010']) expect(pendent, `${clau} ${llengua} ${fet}`).not.toContain(fet);
      // R9V-C1-04 i R9V-C1-05 · les migracions pel nom, i les negacions amb la frase exacta.
      for (const frase of ['connexions', 'vapid', 'apagat']) expect(pendent, `${clau} ${llengua} ${frase}`).toContain(NEGA[llengua][frase]);
      expect(pendent).not.toMatch(/dues d’abans|dos anteriores|two above|aurreko biak|dúas anteriores/);
      const preparat = seccio(body, BALANC[llengua][1]).map((n) => n.textContent).join(' ');
      for (const fet of ['2611052345', '2611060010', 'PGlite', 'R5', 'R6', 'R8', 'R9', 'SKOS', 'E2EE']) expect(preparat, `${clau} ${llengua} ${fet}`).toContain(fet);
      for (const frase of ['consumidor', 'aplicades', 'troballes']) expect(preparat, `${clau} ${llengua} ${frase}`).toContain(NEGA[llengua][frase]);
    }
  });

  test('cada afirmació nova té la peça al codi', () => {
    // R10 · «ja són a producció» (lectura REST del 6-11-2026): les migracions existixen al repositori i el README les dona
    // aplicades pel Mestre el 6-11, amb la mateixa evidència a la fila i a la vinyeta (catalegMigracions.readme.test.js).
    const readme = llegix('supabase/README.md');
    for (const versio of ['2611032100', '2611051930', '2611052345', '2611060010', '2611061520']) {
      const fila = readme.split('\n').find((l) => l.startsWith('| ') && l.includes(`| \`${versio}\` |`));
      expect(fila, versio).toMatch(/\| Aplicada a producció \(lectura REST del 6-11: [^|]*aplicada pel Mestre el 6-11\) \|/);
    }
    const migracions = readdirSync(path.join(ARREL, 'supabase/migrations'));
    for (const prefix of ['2611032100_', '2611052345_', '2611060010_', '2611020417_']) expect(migracions.some((f) => f.startsWith(prefix)), prefix).toBe(true);
    // «el servidor d'avisos push» espera les claus: la funció existix.
    expect(existsSync(path.join(ARREL, 'supabase/functions/notifica-xat'))).toBe(true);
    // «L'E2EE continua apagat per defecte».
    expect(E2EE_ACTIU_PER_DEFECTE).toBe(false);
    // «els kits R8 i R9 de Codex són al codi des de R5»: el mirall i la prova de resiliència del Node 0.
    expect(existsSync(path.join(ARREL, 'tests/node0-resilience.test.mjs'))).toBe(true);
    expect(existsSync(path.join(ARREL, 'tooling/node0/fitxers-mirall.py'))).toBe(true);
    // «gentdelatorre.net acull l'aplicació amb el paquet propi del connector»: el connector servix el seu bundle.
    // La versió que hi ha instal·lada no consta enlloc del disc: el text ho diu («este balanç no l'acredita»).
    expect(llegix('wordpress-plugin/includes/marcatge.php')).toContain('plugins_url( SOCDEPOBLE_ENXUFE_BUNDLE');
    // «la fitxa de l'Arbre Genealògic»: encara no obri cap app.
    expect(pluginPerId('genealogia').obrir).toBeNull();
    // Les dues pàgines de patrimoni que el balanç anomena existixen.
    expect(Object.hasOwn(PAGE_COPY, 'anatomia-rural') && Object.hasOwn(PAGE_COPY, 'herbari')).toBe(true);
  });

  test('la frase vella dels kits «segellats en còpia aïllada» ja no és al balanç; /versions conserva la història', () => {
    for (const clau of PAGINES) {
      const body = doc(PAGE_COPY[clau].html).body;
      expect(seccio(body, BALANC.ca[1]).map((n) => n.textContent).join(' ')).not.toContain('segellats en còpia aïllada');
    }
    const versions = doc(PAGE_COPY.versions.html).body;
    expect(versions.querySelector('h3').textContent).toBe('5 de novembre de 2026 · v1.2.0 · suplement pendent d’integració');
    expect(versions.textContent).toContain('COMMIT R1–R6');
    expect(versions.textContent).not.toContain('R1–R8');
  });
});

const IP = {
  ca: 'que en veuen l’adreça IP del visitant',
  es: 'que ven la dirección IP del visitante',
  en: 'which see the visitor’s IP address',
  eu: 'bisitariaren IP helbidea ikusten dute',
  gl: 'que ven o enderezo IP do visitante'
};
const DICTAT = {
  ca: 'no porta cap codi de dictat',
  es: 'no lleva código de dictado',
  en: 'contains no dictation code',
  eu: 'ez du diktaketa koderik',
  gl: 'non leva código de ditado'
};
/* R9V-C1-02 · l'euskera i l'alemany van a MyMemory, el servei de Translated (traductorLliure.js:30-31 i :83). */
const MYMEMORY = {
  ca: 'per a l’euskera i l’alemany, cap a MyMemory (el servei de l’empresa italiana Translated)',
  es: 'para el euskera y el alemán, hacia MyMemory (el servicio de la empresa italiana Translated)',
  en: 'for Basque and German, for MyMemory (a service of the Italian company Translated)',
  eu: 'euskararako eta alemanerako, MyMemory-ra (Translated enpresa italiarraren zerbitzua)',
  gl: 'para o éuscaro e o alemán, cara a MyMemory (o servizo da empresa italiana Translated)'
};
/* R9V-C1-01 · la introducció: no ix el contingut privat ni l'E2EE; la traducció del text públic, sí. */
const INTRO = {
  ca: 'sense enviar a tercers cap contingut privat ni de l’E2EE (la traducció del text públic sí que ix del navegador, com explica el punt 1)',
  es: 'sin enviar a terceros ningún contenido privado ni del E2EE (la traducción del texto público sí sale del navegador, como explica el punto 1)',
  en: 'without sending any private or E2EE content to third parties (translation of public text does leave the browser, as point 1 explains)',
  eu: 'eduki pribaturik edo E2EE edukirik hirugarrenei bidali gabe dabiltzan tresnak (testu publikoaren itzulpena, ordea, nabigatzailetik ateratzen da, 1. puntuak azaltzen duen bezala)',
  gl: 'sen enviar a terceiros ningún contido privado nin do E2EE (a tradución do texto público si sae do navegador, como explica o punto 1)'
};

describe('R7G-5-05 i R7G-9-02 · la secció d’IA diu el que fa el codi', () => {
  test.each(LLENGUES)('%s · la traducció ix del navegador i el dictat és un pla', (llengua) => {
    for (const clau of PAGINES) {
      const text = doc(pagina(clau, llengua).html).body.textContent;
      expect(text).not.toMatch(/zero fugida de dades|cero fuga de datos|zero data leakage|datu ihesik ez|sobirania i privacitat/i);
      // L'adreça IP és una dada personal: cap llengua no pot dir que no isca «cap dada privada».
      expect(text).not.toMatch(/cap dada privada|zero private data|no private data|ningún dato privado|datu pribaturik/i);
      expect(text, `${clau} ${llengua}`).toContain(INTRO[llengua]);
      expect(text, `${clau} ${llengua}`).toContain(IP[llengua]);
      expect(text, `${clau} ${llengua}`).toContain(MYMEMORY[llengua]);
      expect(text).not.toMatch(/traducció lliure amb Apertium|traducción libre con Apertium|free translation with Apertium|itzulpen librea Apertiumekin|tradución libre con Apertium/);
      for (const motor of ['Apertium', 'MyMemory', 'DeepL']) expect(text, `${clau} ${llengua} ${motor}`).toContain(motor);
      expect(text, `${clau} ${llengua}`).toContain(DICTAT[llengua]);
      for (const peca of ['SuperWhisper', 'Parakeet']) expect(text).toContain(peca);
    }
  });

  test('el transport real: Apertium i MyMemory des del navegador, DeepL només a l’amfitrió, i cap codi de dictat', () => {
    const lliure = llegix('src/data/traductorLliure.js');
    expect(lliure).toContain("que veu l'adreça IP del visitant");
    expect(lliure).toMatch(/EU \(ca\|eu\) i DE \(ca\|de\)[\s\S]*MyMemory \(Translated S\.r\.l\.\)/);
    // Si una altra llengua passa a MyMemory (o en deixa d'anar-hi), el text de les 5 llengües s'ha de reescriure.
    const ambMyMemory = Object.keys(MOTORS_TRADUCCIO).filter((desti) => MOTORS_TRADUCCIO[desti].motor === 'mymemory').sort();
    expect(ambMyMemory).toEqual(['DE', 'EU']);
    expect(llegix('src/data/traductor.js')).toMatch(/DeepL quan l'amfitrió hi haja configurat clau/);
    // «el contingut privat i el de l'E2EE no s'envien a cap traductor»: la guarda de traductor.js.
    for (const marca of [{ e2ee: true }, { privat: true }, { visibility: 'private' }]) expect(contingutNoTraduible(marca)).toBe(true);
    expect(contingutNoTraduible({ visibility: 'public' })).toBe(false);
    const fonts = readdirSync(path.join(ARREL, 'src'), { recursive: true })
      .map((f) => String(f).split(path.sep).join('/'))
      .filter((f) => /\.(?:js|jsx)$/.test(f) && !f.includes('.test.') && f !== 'sections/text/pageContent.r10.js');
    const ambDictat = fonts.filter((f) => /Whisper|Parakeet|SpeechRecognition/.test(readFileSync(path.join(ARREL, 'src', f), 'utf8')));
    expect(ambDictat).toEqual([]);
  });
});

const CONSUM = {
  ca: 'No mengeu cap planta sense consell expert.',
  es: 'No comáis ninguna planta sin consejo experto.',
  en: 'Do not eat any plant without expert advice.',
  eu: 'Ez jan landarerik aditu baten aholkurik gabe.',
  gl: 'Non comas ningunha planta sen consello experto.'
};

describe('Onada R9 · /page/herbari en les 5 llengües', () => {
  test('les dades que diu el text: 117 fitxes del terme', () => {
    expect(ESPECIES_HERBARI_LA_TORRE_117).toHaveLength(117);
    expect(ESPECIES_HERBARI_LA_TORRE_117.every((e) => e.localitzacionsCanaleta.length > 0)).toBe(true);
    expect(new Set(ESPECIES_HERBARI_LA_TORRE_117.map((e) => e.font.document))).toEqual(new Set(['Herbari de La Torre de les Maçanes']));
  });

  test.each(LLENGUES)('%s · mateixa anatomia que el valencià, la xifra i els topònims, i les frases de consum del visor', (llengua) => {
    const p = pagina('herbari', llengua);
    expect(p.contentLanguage ?? 'ca').toBe(llengua);
    if (llengua !== 'ca') expect(p.title).not.toBe(PAGE_COPY.herbari.title);
    expect(p.subtitle).toContain('117');
    expect(p.subtitle).toContain('La Torre de les Maçanes');
    expect(p.subtitle).not.toContain('La Canaleta');
    expect(p.lead).toContain('La Torre de les Maçanes');
    const body = doc(p.html).body;
    expect([...body.children].map((n) => n.tagName)).toEqual(['H3', 'P', 'P']);
    expect(body.querySelector('h3').textContent).toContain('La Torre');
    expect(body.querySelector('h3').textContent).not.toContain('La Canaleta');
    expect([...body.querySelectorAll('p')].every((n) => n.querySelector('strong'))).toBe(true);
    expect(body.querySelectorAll('strong')).toHaveLength(doc(PAGE_COPY.herbari.html).body.querySelectorAll('strong').length);
    expect(body.querySelector('h1,h2,h4,script,img,a,section')).toBeNull();
    const text = body.textContent.replace(/\s+/g, ' ');
    expect(text).toContain(CONSUM[llengua]);
    // Les mateixes frases que el visor (textosHerbari.js, G6-03 i G6V-02): no són recomanacions de consum.
    const visor = textosHerbari(llengua);
    expect(visor.toxicitatDesconeguda.toLowerCase()).toContain(CONSUM[llengua].toLowerCase());
    const ultimaFraseDocumental = visor.documental.split('. ').at(-1).replace(/\.$/, '').toLowerCase();
    expect(text.toLowerCase()).toContain(ultimaFraseDocumental);
    // Les etiquetes, traduïdes amb les mateixes classes.
    expect(p.labels.map((l) => l.className)).toEqual(PAGE_COPY.herbari.labels.map((l) => l.className));
  });
});

/* Gauntlet de l'arbre R9 · arreglador FA. Cada frase nova, amb la frase exacta de cada llengua, i
   la peça del codi (o la lectura datada) que la sosté. Si el codi canvia, la prova cau i el text
   s'ha de tornar a escriure. */
const EDICIO = {
  ca: 'Segons la lectura REST del 6 de novembre, la migració 2611051930 (edició editorial al servidor i carpetes privades del Bloc de Notes) ja és a producció: el Mestre l’hi va aplicar el 6 de novembre, i hi existixen la taula de carpetes i les dues funcions que crea.',
  es: 'Según la lectura REST del 6 de noviembre, la migración 2611051930 (edición editorial en el servidor y carpetas privadas del Bloc de Notas) ya está en producción: el Mestre la aplicó el 6 de noviembre, y existen la tabla de carpetas y las dos funciones que crea.',
  en: 'According to the 6 November REST check, migration 2611051930 (server-side editorial editing and private Notebook folders) is already in production: the Mestre applied it on 6 November, and the folders table and the two functions it creates exist.',
  eu: 'Azaroaren 6ko REST irakurketaren arabera, 2611051930 migrazioa (edizio editoriala zerbitzarian eta Koadernoko karpeta pribatuak) produkzioan dago jada: Mestreak azaroaren 6an aplikatu zuen, eta sortzen dituen karpeten taula eta bi funtzioak badaude.',
  gl: 'Segundo a lectura REST do 6 de novembro, a migración 2611051930 (edición editorial no servidor e cartafoles privados do Caderno de Notas) xa está en produción: o Mestre aplicouna o 6 de novembro, e existen a táboa de cartafoles e as dúas funcións que crea.'
};
const INTERRUPTOR = {
  ca: 'i este build encén l’interruptor de les connexions (CONNEXIONS_PUBLIQUES_REMOTES_ACTIVES)',
  es: 'y este build enciende el interruptor de las conexiones (CONNEXIONS_PUBLIQUES_REMOTES_ACTIVES)',
  en: 'and this build switches on the connections flag (CONNEXIONS_PUBLIQUES_REMOTES_ACTIVES)',
  eu: 'eta build honek konexioen etengailua (CONNEXIONS_PUBLIQUES_REMOTES_ACTIVES) pizten du',
  gl: 'e este build acende o interruptor das conexións (CONNEXIONS_PUBLIQUES_REMOTES_ACTIVES)'
};
const PUSH = {
  ca: 'Segons la lectura del 6 de novembre, els avisos push del xat ja tenen a producció les taules del servidor (migració 2611020417) i la política de privacitat 2.5 que els explica (migració 2611061520), però el web no porta cap clau pública VAPID',
  es: 'Según la lectura del 6 de noviembre, los avisos push del chat ya tienen en producción las tablas del servidor (migración 2611020417) y la política de privacidad 2.5 que los explica (migración 2611061520), pero la web no lleva ninguna clave pública VAPID',
  en: 'According to the 6 November check, chat push notifications already have their server tables in production (migration 2611020417) and the privacy policy 2.5 that explains them (migration 2611061520), but the web build carries no public VAPID key',
  eu: 'Azaroaren 6ko irakurketaren arabera, txateko push abisuek badituzte jada zerbitzariko taulak produkzioan (2611020417 migrazioa) eta haiek azaltzen dituen pribatutasun politikaren 2.5 bertsioa (2611061520 migrazioa), baina webak ez du VAPID gako publikorik',
  gl: 'Segundo a lectura do 6 de novembro, os avisos push do chat xa teñen en produción as táboas do servidor (migración 2611020417) e a política de privacidade 2.5 que os explica (migración 2611061520), pero a web non leva ningunha clave pública VAPID'
};
/* FAV-01 · Què falta per al push: no només la clau. La 2611020417 mana desplegar notifica-xat i el cron i, només
   després, encendre push_xat_actiu (sense, xat_push_desa dona SDP-PUSH-010). Cap nom de secret al text (G3-01).
   R10 · VFT-02: la negació és datada (la lectura del 6-11 no ho va mirar; l'acta 261102_1456:53 ho dona per fet).
   VFT-06: tres requisits, i si en falta qualsevol, no arriba res. */
const PUSH_FALTA = {
  ca: 'Cal posar la clau pública VAPID al build web. La lectura del 6 de novembre no ha comprovat si la funció notifica-xat, que envia els avisos, està desplegada i programada amb les seues claus, ni si l’ajust push_xat_actiu està encés; l’acta del 2 de novembre ho dona per fet, però no s’ha tornat a verificar. Si en falta qualsevol, no arriba cap avís.',
  es: 'Hay que poner la clave pública VAPID en el build web. La lectura del 6 de noviembre no ha comprobado si la función notifica-xat, que envía los avisos, está desplegada y programada con sus claves, ni si el ajuste push_xat_actiu está encendido; el acta del 2 de noviembre lo da por hecho, pero no se ha vuelto a verificar. Si falta cualquiera de ellas, no llega ningún aviso.',
  en: 'The public VAPID key has to go into the web build. The 6 November check did not verify whether the notifica-xat function, which sends the notifications, is deployed and scheduled with its keys, or whether the push_xat_actiu setting is on; the 2 November minutes take it for granted, but it has not been checked again. If any of these is missing, no notification arrives.',
  eu: 'VAPID gako publikoa web buildean jarri behar da. Azaroaren 6ko irakurketak ez du egiaztatu notifica-xat funtzioa, abisuak bidaltzen dituena, bere gakoekin hedatuta eta programatuta dagoen, ezta push_xat_actiu ezarpena piztuta dagoen ere; azaroaren 2ko aktak egindakotzat jotzen du, baina ez da berriro egiaztatu. Horietako bat falta bada, ez da abisurik iristen.',
  gl: 'Cómpre poñer a clave pública VAPID no build web. A lectura do 6 de novembro non comprobou se a función notifica-xat, que envía os avisos, está despregada e programada coas súas claves, nin se o axuste push_xat_actiu está aceso; a acta do 2 de novembro dao por feito, pero non se volveu verificar. Se falta calquera delas, non chega ningún aviso.'
};
/* Cap frase no pot dir que la 2611020417 no està aplicada (lectura del 6-11: 401 42501 a xat_dispositius_push). */
const PUSH_NO_APLICADA = /2611020417[^.]*(?:no s’ha aplicat|no se ha aplicado|not (?:been )?applied|ez da aplikatu|non se aplicou|NO aplicada)/i;
/* R10 · B4 (VFT-03) · Les migracions que el README dona aplicades (lectura REST del 6-11-2026 o acta 261102_1456).
   Cap frase del text pintat, en cap llengua, no pot posar-hi al costat (davant o darrere) una negació d'aplicació
   o de producció. La guarda mira la frase sencera, no només el que va després del número. */
/* B4 segona ronda (B4V-T4) · La llista es llig de la taula canònica (totes les files «Aplicada…»): si el README
   en dona una de nova per aplicada, la guarda la seguix. Les 13 de la primera ronda hi han de continuar. I les
   negacions naturals que la crítica va deixar passar («s'ha d'aplicar», «pendent», «pending», «aplikatu gabe»…). */
const APLICADES_R10 = ['2611011500', '2611011510', '2611011800', '2611012257', '2611020106', '2611020417', '2611030330', '2611031700', '2611032100', '2611051930', '2611052345', '2611060010', '2611061520'];
const APLICADES = [...llegix('supabase/README.md').matchAll(/^\| \d+ \| `(\d{10})` \| `[^`]+\.sql` \| Aplicada[^|]* \| [^|]+ \|$/gm)].map((m) => m[1]);
const NEGA_APLICACIO = new RegExp([
  'no s[’\']han? aplicat', 'no (?:és|són|està|estan) (?:a|en) producció', 'encara no', 'fins que s[’\']apliqu', 'cal aplicar', 'aplicar(?:-la|-les)? a producció', 'no aplicad', 'pendent d[’\']aplica', 'sense aplicar',
  's[’\']han? d[’\']aplicar', '(?:està|estan|és|són|queda|queden|continua|continuen|encara) pendents?', '\\d{10}\\)? pendents?', 'mentre no s[’\']apliqu', 'qued(?:a|en) per aplicar',
  'no se han? aplicado', 'no están? en producción', 'aún no', 'todavía no', 'hasta que se apliqu', 'hay que aplicar', 'aplicar en producción', 'sin aplicar', 'pendiente de aplica',
  '(?:está|están|sigue|siguen|queda|quedan|aún|todavía) pendientes?', 'qued(?:a|an) por aplicar',
  'not (?:yet )?(?:been )?applied', 'not in production', 'not yet', 'until [^.]*\\bappl', 'applying in production', 'needs? to be applied', 'still to be applied',
  '(?:is|are|still|remains?) pending', 'pending (?:application|deployment)', 'yet to be applied', 'has to be applied',
  'ez da aplikatu', 'ez dira [^.]*aplikatu', 'oraindik ez', 'aplikatu arte', 'aplikatzea', 'ez daude? produkzioan', 'aplikatu gabe', 'aplikatzeke',
  'non se aplic(?:ou|aron)', 'non están? en produción', 'aínda non', 'ata que se apliqu', 'cómpre aplicar', 'aplicar en produción', 'sen aplicar',
  '(?:está|están|segue|seguen|queda|quedan|aínda) pendentes?', 'qued(?:a|an) por aplicar'
].join('|'), 'i');
const frasesDe = (text) => text.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/);
const negacionsAplicades = (text) => frasesDe(text).filter((f) => APLICADES.some((v) => f.includes(v)) && NEGA_APLICACIO.test(f));

describe('Gauntlet R9 · G1-01, G1-06 i G3-N02 · el balanç diu què falta de veres', () => {
  test.each(LLENGUES)('%s · l’edició editorial, les connexions i el push', (llengua) => {
    for (const clau of PAGINES) {
      const body = doc(pagina(clau, llengua).html).body;
      const produccio = seccio(body, BALANC[llengua][0]).map((n) => n.textContent).join(' ');
      expect(produccio, `${clau} ${llengua}`).toContain(EDICIO[llengua]);
      const pendent = seccio(body, BALANC[llengua][2]).map((n) => n.textContent).join(' ');
      for (const fet of ['2611020417', 'notifica-xat', 'push_xat_actiu']) expect(pendent, `${clau} ${llengua} ${fet}`).toContain(fet);
      // FAV-04 · La lectura del 6-11 dona la taula note_folders (només la crea la 2611051930): ja no és pendent.
      expect(pendent, `${clau} ${llengua}`).not.toContain('2611051930');
      expect(pendent, `${clau} ${llengua}`).toContain(INTERRUPTOR[llengua]);
      expect(pendent, `${clau} ${llengua}`).toContain(PUSH[llengua]);
      expect(pendent, `${clau} ${llengua}`).toContain(PUSH_FALTA[llengua]);
      expect(body.textContent, `${clau} ${llengua}`).not.toMatch(/SDP_|VITE_|SECRET/);
      expect(body.textContent).not.toMatch(PUSH_NO_APLICADA);
      // R10 · VFT-03: cap negació d'aplicació al costat d'una migració aplicada, en cap llengua ni en cap lloc de la pàgina.
      expect(negacionsAplicades(body.textContent), `${clau} ${llengua}`).toEqual([]);
      // R10 · VFT-02 i VFT-06: ni la negació absoluta ni «totes dues coses» davant de tres requisits.
      expect(body.textContent).not.toMatch(/Nobody has checked|No s’ha comprovat si|No se ha comprobado si|Ez da egiaztatu|Non se comprobou se|Sense totes dues coses|Sin ambas cosas|Without both|Bi horiek gabe|Sen ambas cousas/);
    }
  });

  test('VFT-03 · la guarda caça la negació davant i darrere del número, en les 5 llengües (M10 i M11 de R9)', () => {
    for (const frase of [
      'La migració dels avisos push (2611020417) encara no és a producció.',
      'L’edició editorial només desa al navegador fins que s’aplique la 2611051930.',
      'Cal aplicar la 2611052345 abans d’encendre l’administració.',
      'La migración 2611060010 aún no está en producción.',
      'Migration 2611061520 has not been applied yet.',
      'Until the Mestre applies 2611032100, nothing happens.',
      '2611031700 migrazioa ez da aplikatu.',
      'A migración 2611030330 aínda non está en produción.'
    ]) expect(negacionsAplicades(frase), frase).toHaveLength(1);
    for (const frase of [
      'La migració 2611051930 ja és a producció: el Mestre l’hi va aplicar el 6 de novembre.',
      'Migration 2611032100 has been in production since 6 November, when the Mestre applied it.',
      'Encara no s’ha mesurat el consum.'
    ]) expect(negacionsAplicades(frase), frase).toEqual([]);
  });

  test('B4V-T4 · la llista ve del README i caça les negacions naturals de la crítica (MV1-MV5), una per llengua', () => {
    expect(APLICADES).toEqual(expect.arrayContaining(APLICADES_R10));
    // Segona ronda (B4V-T3): les quatre que la lectura de les 23:53 troba a producció.
    expect(APLICADES).toEqual(expect.arrayContaining(['2610311500', '2610311800', '2611021800', '2611031500']));
    for (const frase of [
      'La política 2.5 (migració 2611061520) encara s’ha d’aplicar.', // MV1
      'La migración 2611032100 está pendiente.', // MV2
      'Migration 2611052345 is still pending.', // MV3
      '2611060010 migrazioa aplikatu gabe dago.', // MV4
      'A migración 2611061520 está pendente de aplicar.', // MV5
      'Les RPC de la 2611031700 queden per aplicar.',
      'La 2610311800 està pendent.',
      'NO-DISPONIBLE: 2610282100 pendent.'
    ]) expect(negacionsAplicades(frase), frase).toHaveLength(1);
    for (const frase of [
      'Les sol·licituds pendents es lligen amb la seua RPC.',
      'The pending requests are read through their own RPC.',
      // El títol h5 «Pendent» s'enganxa a la frase següent en textContent: no és una negació.
      'Pendent Desplegar l’administració multipoble: la lectura REST del 6 de novembre troba a producció les noves RPC de 2611031700_administracio_multipoble.sql.',
      'Pending The 2611032100 migration is in production.'
    ]) expect(negacionsAplicades(frase), frase).toEqual([]);
  });

  test('les peces del codi que sostenen les frases', () => {
    // R10 · La 2611032100 és a producció (lectura REST del 6-11: les dues consultes públiques responen 200 a anon) i
    // este build encén l'interruptor: el balanç ho diu. El text el nomena per la constant, no pel camí:
    // connexionsPubliques.test.js vigila que cap mòdul de producció no cite el fitxer.
    expect(CONNEXIONS_PUBLIQUES_REMOTES_ACTIVES).toBe(true);
    const connexions = llegix('supabase/migrations/2611032100_connexions_publiques_i_membres.sql');
    expect(connexions).toContain('grant execute on function public.connexions_publiques_de(text,text),public.membres_i_entitats_connectades_de(text,text) to anon;');
    // La 2.5 que explica els avisos push és la de la 2611061520 (lectura REST del 6-11: vigent a producció).
    expect(llegix('supabase/migrations/2611061520_politica_privacitat_2_5.sql')).toContain("'2.5'");
    // L'edició al servidor és la RPC de la 2611051930 (a producció segons la lectura del 6-11: la taula
    // note_folders, que crea el mateix fitxer, existix); sense ella, la revisió es queda al navegador.
    expect(llegix('supabase/migrations/2611051930_edicio_publicacions_editorials.sql')).toContain('create table if not exists public.note_folders');
    expect(llegix('supabase/README.md')).toMatch(/\| 76 \| `2611051930` \| `2611051930_edicio_publicacions_editorials\.sql` \| Aplicada a producció/);
    expect(llegix('supabase/migrations/2611051930_edicio_publicacions_editorials.sql')).toContain('admin_actualitza_publicacio_editorial');
    const revisions = llegix('src/data/revisionsEditorials.js');
    expect(revisions).toContain("if (!teCapacitat('edicioEditorial')) return 'sense-rpc';");
    expect(revisions).toContain("return { desada: true, desti: 'navegador', motiu };");
    // El push: la bandera és encesa, la taula és de la 2611020417 i la clau pública ve del build web.
    expect(AVISOS_PUSH_XAT_ACTIUS).toBe(true);
    const push = llegix('supabase/migrations/2611020417_xat_avisos_push.sql');
    expect(push).toContain('create table if not exists public.xat_dispositius_push');
    // FAV-01 · Sense l'ajust push_xat_actiu = 'si', cap aparell no es pot registrar; i l'ajust va després de la funció.
    expect(push).toContain("where a.clau = 'push_xat_actiu'), '') <> 'si' then\n    raise exception 'SDP-PUSH-010");
    expect(push).toContain("2610201500. Després: el desplegament de notifica-xat i el cron; només\n-- després, 'push_xat_actiu' = 'si'");
    const funcio = JSON.parse(llegix('supabase/ordre_desplegament.json')).portes.find((p) => p.id === 'funcio-notifica-xat');
    expect(funcio.descripcio).toContain('només després, posar push_xat_actiu = si');
    expect(funcio.despres).toEqual(['2611020417']);
    expect(llegix('src/main.jsx')).toContain('import.meta.env.VITE_PUSH_VAPID_PUBLICA');
  });
});

const CENS = {
  ca: 'les 58 portes del cens (run-portes --cens, 6-11-2026)',
  es: 'las 58 puertas del censo (run-portes --cens, 6-11-2026)',
  en: 'the 58 census gates (run-portes --cens, 6 November 2026)',
  eu: 'zentsuko 58 ateekin (run-portes --cens, 2026ko azaroaren 6a)',
  gl: 'as 58 portas do censo (run-portes --cens, 6-11-2026)'
};
/* R10 · VFT-07 · La xifra s'ancora a la font: Vitest sencer de l'arbre R9, 6-11-2026: 33.705 proves (més de 33.000;
   15 roges de base). La passa cada onada (l'àrbitre, sobre l'arbre sencer); el hook de cada commit no. */
const PROVES = {
  ca: 'més de 33.000 proves automatitzades (Vitest, 6-11-2026)',
  es: 'más de 33.000 pruebas automatizadas (Vitest, 6-11-2026)',
  en: 'more than 33,000 automated tests (Vitest, 6 November 2026)',
  eu: '33.000 proba automatizatu baino gehiagorekin (Vitest, 2026ko azaroaren 6a)',
  gl: 'máis de 33.000 probas automatizadas (Vitest, 6-11-2026)'
};
/* La font: l'auditoria interna del Node 0 del 6-11-2026 (Ollama a la xarxa local, quatre models carregats) i l'acta
   261106_0105 (OpenCode, també amb NVIDIA NIM). Cap font no cita Gemma ni cap adreça 127.0.0.1. */
const ONADA = {
  ca: 'cada onada es comprova amb més de 33.000 proves automatitzades',
  es: 'cada oleada se comprueba con más de 33.000 pruebas automatizadas',
  en: 'every wave is checked against more than 33,000 automated tests',
  eu: 'olatu bakoitza 33.000 proba automatizatu baino gehiagorekin',
  gl: 'cada vaga compróbase con máis de 33.000 probas automatizadas'
};
const NO_CONNECTA = {
  ca: 'el codi de l’aplicació web no s’hi connecta',
  es: 'el código de la aplicación web no se conecta a él',
  en: 'the web application code does not connect to it',
  eu: 'web aplikazioaren kodea ez da hara konektatzen',
  gl: 'o código da aplicación web non se conecta a el'
};
const CONSUM_ELECTRIC = {
  ca: 'El consum elèctric del Node 0 encara no s’ha mesurat.',
  es: 'con un consumo eléctrico que aún no se ha medido',
  en: 'whose power use has not been measured yet',
  eu: 'bere kontsumo elektrikoa oraindik ez da neurtu',
  gl: 'cun consumo eléctrico que aínda non se mediu'
};
const ENTRADES_ATLES = String(ATLES_OPERATIU.length);
const ATLES = {
  ca: `les ${ENTRADES_ATLES} entrades de l’Atles operatiu, les fitxes dels pobles i la Wiki`,
  es: `las ${ENTRADES_ATLES} entradas del Atlas operativo, las fichas de los pueblos y la Wiki`,
  en: `the ${ENTRADES_ATLES} entries of the operational Atlas, the village cards and the Wiki`,
  eu: `Atlas operatiboko ${ENTRADES_ATLES} sarreren, herrien fitxen eta Wikiaren gainean`,
  gl: `as ${ENTRADES_ATLES} entradas do Atlas operativo, as fichas dos pobos e a Wiki`
};

describe('Gauntlet R9 · G1-03, G1-04 i G1-05 · la secció d’IA i el Node 0 diuen el que diu la font', () => {
  test.each(LLENGUES)('%s · els models, el cens de portes, el consum i l’Atles', (llengua) => {
    for (const clau of PAGINES) {
      const text = doc(pagina(clau, llengua).html).body.textContent;
      expect(text).not.toMatch(/Gemma|127\.0\.0\.1|11434/);
      expect(text).not.toMatch(/sense que cap conversa dels veïns isca|sin sacar datos del municipio|without data leaving the room|datuak herritik atera gabe|sen sacar datos do municipio/);
      expect(text).not.toMatch(/dins del sistema i del Node 0|dentro de la aplicación y del Node 0|inside the web app and Node 0|aplikazioaren eta Node 0 zerbitzariaren barruan|dentro da aplicación e do Node 0/);
      for (const model of ['Ollama', 'Qwen 2.5 Coder 14B', 'Qwen 3 8B', 'Nemotron Mini', 'iaia-maria', 'OpenCode', 'NVIDIA NIM']) expect(text, `${clau} ${llengua} ${model}`).toContain(model);
      expect(text, `${clau} ${llengua}`).toContain(NO_CONNECTA[llengua]);
      expect(text).not.toMatch(/\b35 (?:portes|puertas|deterministic|ate|portas)\b|constitucional|constitutional|konstituzional/i);
      expect(text, `${clau} ${llengua}`).toContain(CENS[llengua]);
      expect(text, `${clau} ${llengua}`).toContain(PROVES[llengua]);
      expect(text, `${clau} ${llengua}`).toContain(ONADA[llengua]);
      expect(text).not.toMatch(/cada canvi es comprova|cada cambio se comprueba|every change is checked|aldaketa bakoitza|cada cambio compróbase|cinquè auditor/);
      // VFT-07 · quatre entorns, quatre noms: Claude, Codex, Gemini i els models locals del Node 0.
      if (llengua === 'ca') expect(text).toMatch(/quatre entorns complementaris: Claude Opus[^;]*GPT Codex[^;]*Gemini Pro[^;]*i els models locals del Node 0 · Mac mini M4 \(punt 2\) com a auditor addicional;/);
      // VFT-08 · el dossier antic ja no diu que la base de dades pròpia siga una condició a demostrar.
      expect(text, `${clau} ${llengua}`).not.toContain('base de dades pròpia, els dominis');
      expect(text).not.toMatch(/bombeta|bombilla|lámpada|light bulb|low-power/i);
      expect(text, `${clau} ${llengua}`).toContain(CONSUM_ELECTRIC[llengua]);
      expect(text).not.toMatch(/\b40 (?:pàgines|páginas|Atlas pages|páxinas)\b|Atlaseko 40/);
      expect(text, `${clau} ${llengua}`).toContain(ATLES[llengua]);
    }
  });

  test('les peces que sostenen les xifres', () => {
    // El cens del 6-11-2026: 58 portes (totes les que no són bateries de proves). Si en canvia el nombre, cal
    // tornar a passar el cens i reescriure la xifra i la data en les 5 llengües.
    expect(passos.filter((pas) => !pas.prova)).toHaveLength(58);
    // L'índex local és l'Atles operatiu més les fitxes dels pobles de la llavor; la Wiki arriba per import().
    expect(ATLES_OPERATIU.length).toBe(25);
    expect(llegix('src/data/iaiaLocal.js')).toContain('...ATLES_OPERATIU.map(documentDeLAtles), ...MOCK_TOWNS.map(documentDelPoble)');
    // «el codi de l'aplicació web no s'hi connecta»: cap fitxer de src, fora del text d'esta pàgina, no parla amb Ollama.
    const fonts = readdirSync(path.join(ARREL, 'src'), { recursive: true })
      .map((f) => String(f).split(path.sep).join('/'))
      .filter((f) => /\.(?:js|jsx|mjs)$/.test(f) && !f.includes('.test.') && f !== 'sections/text/pageContent.r10.js');
    // El port 11434 com a nombre sencer: no el confon amb les xifres d'una dada generada (68.711434826 a pouNeuOrderKeys.js).
    expect(fonts.filter((f) => /\bollama\b|(?<![\d.])11434(?!\d)/i.test(readFileSync(path.join(ARREL, 'src', f), 'utf8')))).toEqual([]);
  });
});

describe('Gauntlet R9 · G1-09 · gallec i anglés de les pàgines de patrimoni', () => {
  const textDe = (clau, llengua) => {
    const p = pagina(clau, llengua);
    return [p.title, p.subtitle, p.lead, doc(p.html).body.textContent].join(' ');
  };
  test('gallec: «de La Torre de les Maçanes», «do termo» i «Herbario de La Torre», sense La Canaleta', () => {
    for (const clau of ['banc-de-llavors', 'rutes-de-poble', 'arbres-monumentals']) {
      expect(textDe(clau, 'gl'), clau).not.toMatch(/\bda (?:Torre|Canaleta)\b/);
      expect(textDe(clau, 'gl'), clau).not.toContain('Canaleta');
    }
    expect(textDe('rutes-de-poble', 'gl')).toContain('Os 6 itinerarios de La Torre de les Maçanes');
    expect(textDe('arbres-monumentals', 'gl')).toContain('As 19 árbores do catálogo de La Torre de les Maçanes');
    for (const clau of ['banc-de-llavors', 'arbres-monumentals']) {
      expect(textDe(clau, 'gl'), clau).toContain('as plantas do termo');
      expect(textDe(clau, 'gl'), clau).toContain('Herbario de La Torre');
    }
    expect(pagina('herbari', 'gl').title).toContain('de La Torre');
  });
  test('anglés: sense «municipal» repetit davant de l’Ordenança', () => {
    const text = textDe('arbres-monumentals', 'en');
    expect(text).not.toContain('the municipal Ordenança Municipal');
    expect(text).toContain('it cites the Ordenança Municipal de Protecció d’Arbres d’Interès Local');
  });
  test('R89 · clear: both al segon encapçalament de les pàgines amb targetes flotants (fediversity i node-zero)', () => {
    const css = llegix('src/css/modules.css');
    expect(css).toContain('.sdp-amb-targetes .sdp-cos-tros > h2 ~ h2');
    expect(css).toContain('.sdp-amb-targetes .sdp-cos-tros > h3 ~ h3');
    expect(css).toContain('clear: both;');
    // Cadena R11, Loop 3 (L2-01) · L'overflow dels encapçalaments només val quan hi ha columna al
    // costat de la flotant (> 40rem). A 375px, amb la targeta a tota l'amplària, el h2 quedava amb
    // 0px d'ample i el text retallat.
    expect(css).toMatch(/@media \(min-width: 40\.01rem\) \{\s*\.sdp-amb-targetes h2,\s*\.sdp-amb-targetes h3 \{\s*overflow: hidden;\s*\}\s*\}/);
    expect(css.replace(/@media \(min-width: 40\.01rem\) \{\s*\.sdp-amb-targetes h2,\s*\.sdp-amb-targetes h3 \{\s*overflow: hidden;\s*\}\s*\}/, '')).not.toMatch(/\.sdp-amb-targetes h2,\s*\.sdp-amb-targetes h3 \{\s*overflow: hidden;/);
  });
});
