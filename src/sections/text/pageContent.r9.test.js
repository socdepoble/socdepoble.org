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
  ca: ['6 de novembre de 2026 · Balanç verificat · producció R1–R8', 'Preparat al codi i novetats integrades en R5–R8', 'Què falta demostrar'],
  es: ['6 de noviembre de 2026 · Balance verificado · producción R1–R8', 'Preparado en el código y novedades integradas en R5–R8', 'Qué falta demostrar'],
  en: ['6 November 2026 · Verified balance · R1–R8 in production', 'Prepared in the code and features integrated in R5–R8', 'What remains to be demonstrated'],
  eu: ['2026ko azaroaren 6a · Egiaztatutako balantzea · R1–R8 produkzioan', 'Kodean prestatuta eta R5–R8 olatuetan integratuta', 'Zer falta da frogatzeko'],
  gl: ['6 de novembro de 2026 · Balance verificado · produción R1–R8', 'Preparado no código e novidades integradas en R5–R8', 'Que falta demostrar']
};
/* Les frases exactes de cada negació (text pintat, sense etiquetes). */
const NEGA = {
  ca: {
    versio: 'la versió depén del connector instal·lat i este balanç no l’acredita',
    consumidor: 'no té cap consumidor de producció', aplicades: 'no s’han aplicat a cap base',
    migracions: 'i aplicar les migracions 2611052345 i 2611060010, que encara tenen quatre troballes d’auditoria per decidir',
    vapid: 'sense ella, cap navegador no s’hi pot subscriure ni rebre cap avís', apagat: 'L’E2EE continua apagat per defecte'
  },
  es: {
    versio: 'la versión depende del conector instalado y este balance no la acredita',
    consumidor: 'no tiene ningún consumidor de producción', aplicades: 'no se han aplicado a ninguna base',
    migracions: 'y aplicar las migraciones 2611052345 y 2611060010, que aún tienen cuatro hallazgos de auditoría por decidir',
    vapid: 'sin ella, ningún navegador puede suscribirse ni recibir avisos', apagat: 'El E2EE sigue apagado por defecto'
  },
  en: {
    versio: 'its version depends on the installed connector and this balance does not certify it',
    consumidor: 'has no production consumer', aplicades: 'have not been applied to any database',
    migracions: 'and applying migrations 2611052345 and 2611060010, which still have four audit findings awaiting a decision',
    vapid: 'without it, no browser can subscribe or receive a notification', apagat: 'E2EE stays off by default'
  },
  eu: {
    versio: 'bertsioa instalatutako konektorearen araberakoa da, eta balantze honek ez du egiaztatzen',
    consumidor: 'ez du produkzioko kontsumitzailerik', aplicades: 'ez dira inongo datu-basetan aplikatu',
    migracions: 'eta 2611052345 eta 2611060010 migrazioak aplikatzea (azken bi horiek ikuskaritzako lau aurkikuntza dituzte erabakitzeko)',
    vapid: 'hori gabe, ezein nabigatzailek ezin du harpidetzarik egin ezta abisurik jaso ere', apagat: 'E2EE lehenespenez itzalita dago'
  },
  gl: {
    versio: 'a versión depende do conector instalado e este balance non a acredita',
    consumidor: 'non ten ningún consumidor de produción', aplicades: 'non se aplicaron a ningunha base',
    migracions: 'e aplicar as migracións 2611052345 e 2611060010, que aínda teñen catro achados de auditoría por decidir',
    vapid: 'sen ela, ningún navegador pode subscribirse nin recibir avisos', apagat: 'O E2EE segue apagado por defecto'
  }
};

describe('Onada R9 · balanç del 6 de novembre (producció R1–R8)', () => {
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
      expect(text).toContain('R1–R8');
      expect(text).not.toContain('R1–R6');
      // R9V-C1-03 · cap font no diu quina versió servix gentdelatorre.net: el text no la dona per igual.
      expect(text, `${clau} ${llengua}`).toContain(NEGA[llengua].versio);
      expect(text).not.toMatch(/mateixa aplicació|misma aplicación|same application|aplikazio bera|mesma aplicación/);
      const pendent = seccio(body, BALANC[llengua][2]).map((n) => n.textContent).join(' ');
      for (const fet of ['2611032100', '2611052345', '2611060010', 'VAPID', 'E2EE', 'R-5', '3-2-1', 'Nix']) expect(pendent, `${clau} ${llengua} ${fet}`).toContain(fet);
      // R9V-C1-04 i R9V-C1-05 · les migracions pel nom, i les negacions amb la frase exacta.
      for (const frase of ['migracions', 'vapid', 'apagat']) expect(pendent, `${clau} ${llengua} ${frase}`).toContain(NEGA[llengua][frase]);
      expect(pendent).not.toMatch(/dues d’abans|dos anteriores|two above|aurreko biak|dúas anteriores/);
      const preparat = seccio(body, BALANC[llengua][1]).map((n) => n.textContent).join(' ');
      for (const fet of ['2611052345', '2611060010', 'PGlite', 'R5', 'R6', 'R8', 'R9', 'SKOS', 'E2EE']) expect(preparat, `${clau} ${llengua} ${fet}`).toContain(fet);
      for (const frase of ['consumidor', 'aplicades']) expect(preparat, `${clau} ${llengua} ${frase}`).toContain(NEGA[llengua][frase]);
    }
  });

  test('cada afirmació nova té la peça al codi', () => {
    // «no s'han aplicat a cap base»: les migracions existixen al repositori i el text no les dona per aplicades.
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
  test('les dades que diu el text: 117 fitxes, totes amb un rètol de La Canaleta', () => {
    expect(ESPECIES_HERBARI_LA_TORRE_117).toHaveLength(117);
    expect(ESPECIES_HERBARI_LA_TORRE_117.every((e) => e.localitzacionsCanaleta.length > 0)).toBe(true);
    expect(new Set(ESPECIES_HERBARI_LA_TORRE_117.map((e) => e.font.document))).toEqual(new Set(['Herbari de La Torre de les Maçanes']));
  });

  test.each(LLENGUES)('%s · mateixa anatomia que el valencià, la xifra i els topònims, i les frases de consum del visor', (llengua) => {
    const p = pagina('herbari', llengua);
    expect(p.contentLanguage ?? 'ca').toBe(llengua);
    if (llengua !== 'ca') expect(p.title).not.toBe(PAGE_COPY.herbari.title);
    expect(p.subtitle).toContain('117');
    for (const toponim of ['La Canaleta', 'La Torre de les Maçanes']) expect(p.subtitle).toContain(toponim);
    expect(p.lead).toContain('La Torre de les Maçanes');
    const body = doc(p.html).body;
    expect([...body.children].map((n) => n.tagName)).toEqual(['H3', 'P', 'P']);
    expect(body.querySelector('h3').textContent).toContain('La Canaleta');
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
  ca: 'Segons la lectura del 6 de novembre, la migració 2611051930 (edició editorial al servidor i carpetes privades del Bloc de Notes) ja és a producció: hi existix la taula de carpetes que crea.',
  es: 'Según la lectura del 6 de noviembre, la migración 2611051930 (edición editorial en el servidor y carpetas privadas del Bloc de Notas) ya está en producción: existe la tabla de carpetas que crea.',
  en: 'According to the 6 November check, migration 2611051930 (server-side editorial editing and private Notebook folders) is already in production: the folders table it creates exists.',
  eu: 'Azaroaren 6ko irakurketaren arabera, 2611051930 migrazioa (edizio editoriala zerbitzarian eta Koadernoko karpeta pribatuak) produkzioan dago jada: sortzen duen karpeten taula badago.',
  gl: 'Segundo a lectura do 6 de novembro, a migración 2611051930 (edición editorial no servidor e cartafoles privados do Caderno de Notas) xa está en produción: existe a táboa de cartafoles que crea.'
};
const INTERRUPTOR = {
  ca: 'i, després, encendre l’interruptor de les connexions (CONNEXIONS_PUBLIQUES_REMOTES_ACTIVES) en un build nou',
  es: 'y, después, encender el interruptor de las conexiones (CONNEXIONS_PUBLIQUES_REMOTES_ACTIVES) en un build nuevo',
  en: 'and then switching on the connections flag (CONNEXIONS_PUBLIQUES_REMOTES_ACTIVES) in a new build',
  eu: 'eta, ondoren, konexioen etengailua (CONNEXIONS_PUBLIQUES_REMOTES_ACTIVES) build berri batean piztea',
  gl: 'e, despois, acender o interruptor das conexións (CONNEXIONS_PUBLIQUES_REMOTES_ACTIVES) nun build novo'
};
const PUSH = {
  ca: 'Segons la lectura del 6 de novembre, els avisos push del xat ja tenen a producció les taules del servidor (migració 2611020417), però el web no porta cap clau pública VAPID',
  es: 'Según la lectura del 6 de noviembre, los avisos push del chat ya tienen en producción las tablas del servidor (migración 2611020417), pero la web no lleva ninguna clave pública VAPID',
  en: 'According to the 6 November check, chat push notifications already have their server tables in production (migration 2611020417), but the web build carries no public VAPID key',
  eu: 'Azaroaren 6ko irakurketaren arabera, txateko push abisuek badituzte jada zerbitzariko taulak produkzioan (2611020417 migrazioa), baina webak ez du VAPID gako publikorik',
  gl: 'Segundo a lectura do 6 de novembro, os avisos push do chat xa teñen en produción as táboas do servidor (migración 2611020417), pero a web non leva ningunha clave pública VAPID'
};
/* FAV-01 · Què falta per al push: no només la clau. La 2611020417 mana desplegar notifica-xat i el cron i, només
   després, encendre push_xat_actiu (sense, xat_push_desa dona SDP-PUSH-010). Cap nom de secret al text (G3-01). */
const PUSH_FALTA = {
  ca: 'Cal posar la clau pública VAPID al build web. No s’ha comprovat si la funció notifica-xat, que envia els avisos, està desplegada i programada amb les seues claus, ni si l’ajust push_xat_actiu està encés. Sense totes dues coses, no arriba cap avís.',
  es: 'Hay que poner la clave pública VAPID en el build web. No se ha comprobado si la función notifica-xat, que envía los avisos, está desplegada y programada con sus claves, ni si el ajuste push_xat_actiu está encendido. Sin ambas cosas, no llega ningún aviso.',
  en: 'The public VAPID key has to go into the web build. Nobody has checked whether the notifica-xat function, which sends the notifications, is deployed and scheduled with its keys, or whether the push_xat_actiu setting is on. Without both, no notification arrives.',
  eu: 'VAPID gako publikoa web buildean jarri behar da. Ez da egiaztatu notifica-xat funtzioa, abisuak bidaltzen dituena, bere gakoekin hedatuta eta programatuta dagoen, ezta push_xat_actiu ezarpena piztuta dagoen ere. Bi horiek gabe, ez da abisurik iristen.',
  gl: 'Cómpre poñer a clave pública VAPID no build web. Non se comprobou se a función notifica-xat, que envía os avisos, está despregada e programada coas súas claves, nin se o axuste push_xat_actiu está aceso. Sen ambas cousas, non chega ningún aviso.'
};
/* Cap frase no pot dir que la 2611020417 no està aplicada (lectura del 6-11: 401 42501 a xat_dispositius_push). */
const PUSH_NO_APLICADA = /2611020417[^.]*(?:no s’ha aplicat|no se ha aplicado|not (?:been )?applied|ez da aplikatu|non se aplicou|NO aplicada)/i;

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
    }
  });

  test('les peces del codi que sostenen les frases', () => {
    // L'interruptor continua apagat: el balanç diu que cal encendre'l en un build nou. El text el nomena per la
    // constant, no pel camí: connexionsPubliques.test.js vigila que cap mòdul de producció no cite el fitxer.
    expect(CONNEXIONS_PUBLIQUES_REMOTES_ACTIVES).toBe(false);
    expect(llegix('src/config/connexionsPubliques.js')).toContain("ENCENDRE (true) QUAN S'APLIQUE 2611032100");
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
const PROVES = {
  ca: 'més de 33.000 proves automatitzades (Vitest, 6-11-2026)',
  es: 'más de 33.000 pruebas automatizadas (Vitest, 6-11-2026)',
  en: 'more than 33,000 automated tests (Vitest, 6 November 2026)',
  eu: '33.000 proba automatizatu baino gehiagorekin (Vitest, 2026ko azaroaren 6a)',
  gl: 'máis de 33.000 probas automatizadas (Vitest, 6-11-2026)'
};
/* La font: l'auditoria interna del Node 0 del 6-11-2026 (Ollama a la xarxa local, quatre models carregats) i l'acta
   261106_0105 (OpenCode, també amb NVIDIA NIM). Cap font no cita Gemma ni cap adreça 127.0.0.1. */
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
    expect(fonts.filter((f) => /\bollama\b|11434/i.test(readFileSync(path.join(ARREL, 'src', f), 'utf8')))).toEqual([]);
  });
});

describe('Gauntlet R9 · G1-09 · gallec i anglés de les pàgines de patrimoni', () => {
  const textDe = (clau, llengua) => {
    const p = pagina(clau, llengua);
    return [p.title, p.subtitle, p.lead, doc(p.html).body.textContent].join(' ');
  };
  test('gallec: «de La Torre de les Maçanes», «de La Canaleta» i «Herbario de La Torre», com el títol de l’herbari', () => {
    for (const clau of ['banc-de-llavors', 'rutes-de-poble', 'arbres-monumentals']) {
      expect(textDe(clau, 'gl'), clau).not.toMatch(/\bda (?:Torre|Canaleta)\b/);
    }
    expect(textDe('rutes-de-poble', 'gl')).toContain('Os 6 itinerarios de La Torre de les Maçanes');
    expect(textDe('arbres-monumentals', 'gl')).toContain('As 19 árbores do catálogo de La Torre de les Maçanes');
    for (const clau of ['banc-de-llavors', 'arbres-monumentals']) {
      expect(textDe(clau, 'gl'), clau).toContain('as plantas de La Canaleta');
      expect(textDe(clau, 'gl'), clau).toContain('Herbario de La Torre');
    }
    expect(pagina('herbari', 'gl').title).toContain('de La Torre');
  });
  test('anglés: sense «municipal» repetit davant de l’Ordenança', () => {
    const text = textDe('arbres-monumentals', 'en');
    expect(text).not.toContain('the municipal Ordenança Municipal');
    expect(text).toContain('it cites the Ordenança Municipal de Protecció d’Arbres d’Interès Local');
  });
});
