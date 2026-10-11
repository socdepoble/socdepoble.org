/**
 * trituradorFinancer.js — Sentinella 2 · Triturador Financer (la «Trituradora
 * de Documents Locals»).
 *
 * Orquestra en lot els fitxers que la persona deixa: extractes en Norma 43,
 * CSV de moviments del banc i el full trimestral CSV que proposa el tractor
 * de factures de la Gestoria. Fa servir els mòduls purs de la Gestoria
 * (c43.js, movimentsBanc.js, concilia.js, fullModel.js i model.js): la porta
 * de privacitat (gestoria/privacitat.test.js) permet que el carril dels
 * tractors els importe, perquè els dos carrils comparteixen frontera (cap
 * xarxa, cap emmagatzematge, només la Wiki en desenvolupament). Els PDF no
 * els llig: són del tractor de factures, amb la seua aprovació i signatura.
 *
 * L0: proposa assentaments i assenyala discrepàncies d'IVA; tot queda
 * pendent d'«Aprovar» a la Gestoria. No esborra, no mou i no anota res.
 *
 * Onada 12 (261011; ordres 261011_0130, punt 6: «auditories de pagaments»,
 * «categoritzar targetes de crèdit» i una Gestoria «enxufable»):
 *   · Els extractes entren pel port dels moviments (gestoria/nucli/
 *     fontMoviments.js): dos extractes que se solapen, o el mateix fitxer triat
 *     dues vegades, ja no compten dos colps.
 *   · Un CSV que no és el del banc de sempre ni un full trimestral es llig amb
 *     el lector tolerant (extracteCsv.js): l'extracte de la targeta de crèdit o
 *     el d'un altre banc, amb punt i coma, coma decimal i dates dd/mm/aa. Els
 *     seus moviments s'afigen als del compte, no s'hi fusionen.
 *   · Un CSV de moviments amb la primera columna «Fecha» ja no es pren per un
 *     full trimestral de factures buides: un full porta números o totals.
 *   · Amb banc i full, l'informe porta l'auditoria de pagaments de cada
 *     trimestre (auditoriaPagaments.js); només amb el full, el seu resum.
 */
import { auditaPagaments, informePagaments } from '../../gestoria/nucli/auditoriaPagaments.js';
import { textDelsConceptes } from '../../gestoria/nucli/c43.js';
import { formatData, rangTrimestre, trimestreDe } from '../../gestoria/nucli/dates.js';
import { comprovaFont, fontDeC43, fontDeCsv, llegixFonts } from '../../gestoria/nucli/fontMoviments.js';
import { llegeixModelCsv } from '../../gestoria/nucli/fullModel.js';
import { hashFnv1a, validaFactura } from '../../gestoria/nucli/model.js';
import { fusionaMoviments, llegeixMovimentsCsv } from '../../gestoria/nucli/movimentsBanc.js';
import { avis, contingutDe, esObjecte, eurosDe, extensioDe, fitxersTriats, nomDe, primers, severitatDe, textDe } from './comu.js';
import { FONTS_COMUNES, definixSentinella } from './contracte.js';

const EXTENSIONS_C43 = new Set(['n43', 'c43', 'q43', 'aeb', 'csb']);
const LLINDARS = Object.freeze({ maxLiniesInforme: 40 });
const REGISTRE_C43 = 80;
const BOM = String.fromCharCode(0xfeff);
const BOM_UTF8 = [0xef, 0xbb, 0xbf];
const codiDe = (prefix, codi) => `${prefix}-${String(codi).toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
/* Les incidències de l'auditoria de pagaments que alcen bandera. La resta ja les diuen la conciliació
   (TRI-CONCILIA-IMPORT_DIFERENT), TRI-ASSENTAMENTS i TRI-SENSE-PAGAMENT, i totes són a l'informe. */
const AVISOS_DE_PAGAMENTS = Object.freeze({
  TRIMESTRE_INVALID: 'TRI-TRIMESTRE-INVALID',
  PAGAMENT_DUPLICAT: 'TRI-PAGAMENT-DUPLICAT',
  FORA_TRIMESTRE: 'TRI-FORA-TRIMESTRE',
  EMESA_SENSE_COBRAMENT: 'TRI-EMESA-SENSE-COBRAMENT'
});

/* L'inici del fitxer (sense BOM), si porta salts de línia (sense comptar el final) i la llargària útil. */
function formaDe(contingut) {
  if (typeof contingut === 'string') {
    const net = contingut.startsWith(BOM) ? contingut.slice(1) : contingut;
    const cos = net.replace(/(?:\r\n|\n|\r)$/, '');
    return { inici: net.slice(0, REGISTRE_C43 + 2), salts: /[\r\n]/.test(cos), llargaria: cos.length };
  }
  const bytes = contingut instanceof ArrayBuffer ? new Uint8Array(contingut) : contingut;
  if (!(bytes instanceof Uint8Array)) return null;
  const des = BOM_UTF8.every((b, i) => bytes[i] === b) ? BOM_UTF8.length : 0;
  let fins = bytes.length;
  if (bytes[fins - 1] === 0x0a) fins -= 1;
  if (fins > des && bytes[fins - 1] === 0x0d) fins -= 1;
  return {
    inici: String.fromCharCode(...bytes.subarray(des, des + REGISTRE_C43 + 2)),
    salts: bytes.subarray(des, fins).some((b) => b === 0x0a || b === 0x0d),
    llargaria: fins - des
  };
}

/* Un fitxer és Norma 43 si ho diu l'extensió o si comença (després d'un BOM) per una capçalera 11
   i fa registres de 80 caràcters: la primera línia de 80, o tot seguit sense salts i múltiple de 80,
   que és el que la Gestoria (c43.js) talla cada 80 caràcters. */
function esNorma43(fitxer) {
  if (EXTENSIONS_C43.has(extensioDe(fitxer.nom))) return true;
  const forma = formaDe(contingutDe(fitxer));
  if (!forma || !/^11\d{18}/.test(forma.inici)) return false;
  if (/^.{80}(?:\r\n|\n|\r|$)/.test(forma.inici)) return true;
  return !forma.salts && forma.llargaria > REGISTRE_C43 && forma.llargaria % REGISTRE_C43 === 0;
}

/* Un moviment del CSV del banc, amb la forma mínima que entén la conciliació. */
const movimentDeFila = (fila) => ({
  linia: fila.fila,
  dataOperacio: fila.dataOperacio,
  dataValor: fila.dataValor,
  centims: fila.centims,
  conceptes: [{ codi: '01', camps: [fila.concepte ?? '', ''] }],
  ...(fila.comerc ? { comerc: fila.comerc } : {})
});

const concepteDe = (m) => (m.comerc || textDelsConceptes(m) || '').slice(0, 60);
const liniaMoviment = (m) => `${formatData(m.dataOperacio) || 'sense data'} · ${eurosDe(m.centims)} · ${concepteDe(m) || 'sense concepte'}`;
const nomFactura = (f) => `${f.num || 'sense número'} (${f.tipus === 'ingres' ? 'ingrés' : 'despesa'}, ${eurosDe(f.total)})`;

/* El període que es mira del banc quan hi ha fulls: del primer dia del trimestre d'abans del primer full a
   l'últim del trimestre de després de l'últim (pel trimestre que diu cada full i per les dates de les seues
   factures). Sense fulls, {}: tot. */
function rangDelsFulls(fulls) {
  const index = [];
  for (const full of fulls) {
    if (rangTrimestre(full.any, full.t)) index.push(full.any * 4 + full.t - 1);
    for (const f of [...full.ingressos, ...full.despeses]) {
      if (trimestreDe(f.data)) index.push(f.data.a * 4 + trimestreDe(f.data) - 1);
    }
  }
  if (!index.length) return {};
  const trimestre = (i) => rangTrimestre(Math.floor(i / 4), (i % 4) + 1);
  return { des: trimestre(Math.min(...index) - 1).inici, fins: trimestre(Math.max(...index) + 1).fi };
}

/**
 * @param {{ fitxers: Array<{ nom: string, bytes?: Uint8Array, text?: string }> }} entrada
 */
export function observaTriturador(entrada) {
  const avisos = [];
  const llegits = [];
  const fontsC43 = [];
  const fontsCsv = [];
  const filesBanc = [];
  const fulls = [];
  const factures = [];
  const fitxers = (esObjecte(entrada) && Array.isArray(entrada.fitxers) ? entrada.fitxers : []).filter(esObjecte);
  /* Correcció 261011 (refutador, punts 2 i 5): un CSV amb el mateix contingut que un altre del lot (el mateix
     extracte o el mateix full triat dos colps, es diga com es diga) només es llig una vegada. */
  const textosVistos = new Set();
  /* Punt 12: cada font passa el kit de conformitat del port abans de llegir-se; si no el passa, no entra. */
  const conforme = (font, nom) => {
    const errors = comprovaFont(font);
    if (errors.length) avisos.push(avis('TRI-FONT-NO-CONFORME', 'roja', `«${nom}» no complix el contracte dels moviments (${errors[0]}): no l’he llegit.`, nom));
    return errors.length === 0;
  };

  for (const fitxer of fitxers) {
    const nom = nomDe(fitxer);
    const ext = extensioDe(nom);
    if (ext === 'pdf') {
      avisos.push(avis('TRI-PDF', 'info', `«${nom}»: els PDF de factures els llig el tractor «Gestoria · Full trimestral de factures», amb la seua aprovació. Porta’n el full CSV que proposa i el creuaré amb el banc.`, nom));
      continue;
    }
    if (esNorma43(fitxer)) {
      const font = fontDeC43(contingutDe(fitxer), { nom });
      if (!conforme(font, nom)) continue;
      fontsC43.push(font);
      llegits.push(`${nom}: Norma 43, ${font.llegixMoviments().length} moviments`);
      for (const a of font.avisos) {
        avisos.push(avis(codiDe('TRI-C43', a.codi), severitatDe(a.severitat), a.missatge, a.linia ? `${nom}:${a.linia}` : nom));
      }
      continue;
    }
    if (ext === 'csv' || ext === 'txt') {
      const text = textDe(contingutDe(fitxer));
      const empremta = hashFnv1a(text);
      if (textosVistos.has(empremta)) {
        avisos.push(avis('TRI-FITXER-REPETIT', 'info', `«${nom}» té el mateix contingut que un altre fitxer del lot: només s’ha llegit una vegada.`, nom));
        continue;
      }
      textosVistos.add(empremta);
      const banc = llegeixMovimentsCsv(text);
      const noEsBanc = banc.avisos.some((a) => a.codi === 'CAPCALERA' || a.codi === 'CSV_BUIT');
      if (!noEsBanc) {
        filesBanc.push(...banc.moviments);
        llegits.push(`${nom}: CSV del banc, ${banc.moviments.length} files`);
        for (const a of banc.avisos) avisos.push(avis(codiDe('TRI-CSV', a.codi), severitatDe(a.severitat), a.missatge, a.fila ? `${nom}:${a.fila}` : nom));
        continue;
      }
      const full = llegeixModelCsv(text, { fitxer: nom });
      const delFull = [...full.ingressos, ...full.despeses];
      /* Un full de factures porta números o totals: un CSV de moviments amb la columna «Fecha» no n'és cap. */
      if (delFull.some((f) => f.num !== '' || Number.isSafeInteger(f.total))) {
        factures.push(...delFull);
        fulls.push(full);
        llegits.push(`${nom}: full trimestral, ${delFull.length} factures`);
        for (const a of full.avisos) avisos.push(avis(codiDe('TRI-FULL', a.codi), severitatDe(a.severitat), a.missatge, nom));
        continue;
      }
      /* L'extracte de la targeta o d'un altre banc: el lector tolerant, pel port dels moviments. */
      const font = fontDeCsv(text, { nom });
      const delExtracte = font.llegixMoviments();
      /* Un extracte que s'ha reconegut però no s'ha volgut llegir (dates amb el mes davant) no és «no reconegut». */
      const refusat = font.avisos.some((a) => a.codi === 'DATES_MES_DIA');
      if (delExtracte.length || refusat) {
        for (const a of font.avisos) avisos.push(avis(codiDe('TRI-EXTRACTE', a.codi), severitatDe(a.severitat), a.missatge, a.fila ? `${nom}:${a.fila}` : nom));
        if (refusat) {
          llegits.push(`${nom}: extracte en CSV que NO s’ha llegit (dates amb el mes davant del dia)`);
          continue;
        }
        if (!conforme(font, nom)) continue;
        fontsCsv.push(font);
        llegits.push(`${nom}: extracte en CSV ${font.targeta ? 'de targeta' : 'de compte'} (separat per ${font.format.delimitador}), ${delExtracte.length} moviments`);
        continue;
      }
      avisos.push(avis('TRI-NO-RECONEGUT', 'groga', `«${nom}» no és ni un extracte de moviments (del banc o de la targeta) ni un full trimestral: no l’he llegit.`, nom));
      continue;
    }
    avisos.push(avis('TRI-IGNORAT', 'info', `«${nom}»: format que el triturador no llig (només Norma 43, CSV i el full trimestral).`, nom));
  }

  /* El banc: la Norma 43 mana; el CSV hi afig el comerç de les compres amb targeta. */
  let moviments = [];
  /* Punt 12: amb fulls, només es lligen els moviments dels seus trimestres i dels dos veïns (una factura es pot
     cobrar el trimestre següent); la resta no entra a la conciliació, i es diu quants en són. */
  const rang = rangDelsFulls(fulls);
  /* Punt 3: un extracte amb el signe dubtós no entra ni a la conciliació ni a cap resum fins que es confirme. */
  const fontsBones = fontsCsv.filter((font) => !font.format.signeDubtos);
  const fontsDubtoses = fontsCsv.filter((font) => font.format.signeDubtos);
  const delPort = llegixFonts(fontsC43, rang);
  const delsExtractes = llegixFonts(fontsBones, rang);
  const pendentsDeSigne = llegixFonts(fontsDubtoses).moviments;
  const foraDelPeriode = llegixFonts(fontsC43).moviments.length + llegixFonts(fontsBones).moviments.length
    - delPort.moviments.length - delsExtractes.moviments.length;
  if (foraDelPeriode > 0) {
    avisos.push(avis('TRI-FORA-DEL-PERIODE', 'info',
      `${foraDelPeriode} moviments són de fora dels trimestres dels fulls (i dels dos veïns, del ${formatData(rang.des)} al ${formatData(rang.fins)}): no s’han mirat.`, 'banc'));
  }
  const repetits = delPort.repetits + delsExtractes.repetits;
  if (repetits > 0) {
    avisos.push(avis('TRI-MOVIMENTS-REPETITS', 'info', `${repetits} moviments eren en més d’un extracte del mateix compte (se solapen o has triat el mateix fitxer dos colps): només compten una vegada.`, 'banc'));
  }
  /* Punt 2: entre extractes sense compte conegut no es lleva res en silenci. */
  if (delsExtractes.dubtosos > 0) {
    avisos.push(avis('TRI-MOVIMENTS-DUBTOSOS', 'groga',
      `${delsExtractes.dubtosos} moviments ixen iguals (dia, import i concepte) en dos extractes en CSV que no diuen de quin compte o targeta són. S’han conservat tots: si és el mateix extracte baixat dues vegades, compten doble; si són dues targetes, està bé. Comprova-ho.`, 'banc'));
  }
  /* Punt 7: el que no és en euros no es concilia ni se suma amb la resta: es llista a part. */
  const enEuros = (m) => m.moneda === 'EUR';
  const enAltraMoneda = [...delPort.moviments, ...delsExtractes.moviments].filter((m) => !enEuros(m));
  if (enAltraMoneda.length) {
    avisos.push(avis('TRI-ALTRA-MONEDA', 'groga', `${enAltraMoneda.length} moviments no són en euros: no han entrat a la conciliació ni als totals, i són a l’informe a part.`, 'banc'));
  }
  const delCompte = delPort.moviments.filter(enEuros);
  /* Punt 2: el mateix compte en Norma 43 i en un CSV d'un altre format. Un moviment d'un extracte de COMPTE (no
     de targeta) que coincidix en dia i import amb un de la Norma 43 es pren pel mateix: compta el de la Norma 43. */
  const perDiaIImport = new Map();
  const clauDe = (m) => `${formatData(m.data, 'aaaa-mm-dd')}|${m.import}`;
  for (const m of delCompte) perDiaIImport.set(clauDe(m), (perDiaIImport.get(clauDe(m)) ?? 0) + 1);
  const esDeTargeta = new Map(fontsBones.map((font) => [font.id, font.targeta]));
  let solapats = 0;
  const delsAltres = delsExtractes.moviments.filter(enEuros).filter((m) => {
    const lliures = perDiaIImport.get(clauDe(m)) ?? 0;
    if (esDeTargeta.get(m.origen.font) || lliures === 0) return true;
    perDiaIImport.set(clauDe(m), lliures - 1);
    solapats += 1;
    return false;
  });
  if (solapats > 0) {
    avisos.push(avis('TRI-EXTRACTE-SOLAPAT', 'groga',
      `${solapats} moviments d’un extracte de compte en CSV coincidixen en dia i import amb la Norma 43: pareixen del mateix compte i només compten una vegada (el de la Norma 43). Si són d’un altre compte, tria’ls a part.`, 'banc'));
  }
  if (fontsC43.length) {
    const delC43 = delCompte.map((m) => m.detall);
    if (filesBanc.length) {
      const fusio = fusionaMoviments(delC43, filesBanc);
      moviments = fusio.moviments;
      if (fusio.senseParella.csv.length) {
        avisos.push(avis('TRI-CSV-SENSE-PARELLA', 'info', `${fusio.senseParella.csv.length} files del CSV no tenen moviment a la Norma 43: potser són d’un altre període.`, 'csv'));
      }
    } else {
      moviments = delC43;
    }
  } else {
    moviments = filesBanc.map(movimentDeFila);
  }
  /* Els de la targeta (o d'un altre banc) no són a la Norma 43 un per un: s'hi afigen. */
  moviments = [...moviments, ...delsAltres.map((m) => m.detall)];

  /* L'IVA de cada factura del full: el que no quadra queda pendent d'Aprovar. */
  for (const f of factures) {
    for (const incidencia of validaFactura(f)) {
      if (incidencia.codi !== 'IVA_INCOHERENT' && incidencia.codi !== 'TIPUS_IVA_INUSUAL') continue;
      const severitat = incidencia.codi === 'IVA_INCOHERENT' || incidencia.severitat === 'alta' ? 'roja' : 'groga';
      avisos.push(avis(codiDe('TRI-IVA', incidencia.codi), severitat, `Factura ${nomFactura(f)}: ${incidencia.missatge} Queda pendent d’«Aprovar».`, f.origen?.fitxer || 'full'));
    }
  }

  /* Punt 3: el que no es pot donar per bo va DALT de tot de l'informe, abans de cap xifra. */
  const liniaDelPort = (m) => liniaMoviment(m.detall);
  const alertes = [];
  if (pendentsDeSigne.length) {
    alertes.push(
      `ATENCIÓ · signe dubtós a ${fontsDubtoses.map((font) => `«${font.nom}»`).join(', ')}: quasi tots els imports són positius i l’extracte no porta saldo ni diu que és d’una targeta. Poden ser compres escrites en positiu. No han entrat a la conciliació ni a cap resum: confirma-ho amb l’extracte (si és d’una targeta, posa «tarjeta» al nom del fitxer i torna’l a triar).`,
      `Pendents de confirmar el signe (${pendentsDeSigne.length}):`,
      ...primers(pendentsDeSigne.map(liniaDelPort), LLINDARS.maxLiniesInforme).map((l) => `- ${l}`),
      ''
    );
  }
  if (enAltraMoneda.length) {
    alertes.push(
      `En una altra moneda, fora de la conciliació (${enAltraMoneda.length}):`,
      ...primers(enAltraMoneda.map((m) => `${liniaDelPort(m)} · import en ${m.moneda}, no en euros`), LLINDARS.maxLiniesInforme).map((l) => `- ${l}`),
      ''
    );
  }
  const informe = [...alertes, `Fitxers llegits (${llegits.length}):`, ...llegits.map((l) => `- ${l}`)];
  if (!fitxers.length) avisos.push(avis('TRI-SENSE-FITXERS', 'info', 'No hi ha cap fitxer a triturar.', 'entrada'));

  /* L'auditoria de pagaments: una sola conciliació amb tots els fulls i tots els moviments, i un resum per trimestre. */
  const auditoria = factures.length ? auditaPagaments({ fulls, moviments }) : null;
  for (const i of auditoria?.incidencies ?? []) {
    if (!(i.codi in AVISOS_DE_PAGAMENTS) || (!moviments.length && i.codi !== 'FORA_TRIMESTRE' && i.codi !== 'TRIMESTRE_INVALID')) continue;
    avisos.push(avis(AVISOS_DE_PAGAMENTS[i.codi], severitatDe(i.severitat), i.missatge, i.any ? `${i.t}T ${i.any}` : 'full'));
  }

  if (moviments.length && factures.length) {
    const resultat = auditoria.conciliacio;
    for (const i of resultat.incidencies) {
      avisos.push(avis(codiDe('TRI-CONCILIA', i.codi), severitatDe(i.severitat), i.missatge, i.fitxer || (i.linia ? `moviment:${i.linia}` : 'conciliacio')));
    }
    if (resultat.movimentsSenseFactura.length) {
      avisos.push(avis('TRI-ASSENTAMENTS', 'groga', `${resultat.movimentsSenseFactura.length} moviments sense factura: tens els assentaments proposats a l’informe, pendents d’«Aprovar».`, 'conciliacio'));
    }
    if (resultat.facturesSensePagament.length) {
      avisos.push(avis('TRI-SENSE-PAGAMENT', 'groga', `${resultat.facturesSensePagament.length} factures no tenen cap moviment al banc: revisa si estan pagades o cobrades.`, 'conciliacio'));
    }
    informe.push(
      '',
      `Conciliació: ${resultat.parelles.length} parelles proposades, ${resultat.movimentsSenseFactura.length} moviments sense factura i ${resultat.facturesSensePagament.length} factures sense pagament.`,
      'Assentaments proposats (pendents d’«Aprovar» a la Gestoria):',
      ...primers(resultat.movimentsSenseFactura.map(liniaMoviment), LLINDARS.maxLiniesInforme).map((l) => `- ${l}`),
      'Factures sense pagament:',
      ...primers(resultat.facturesSensePagament.map(nomFactura), LLINDARS.maxLiniesInforme).map((l) => `- ${l}`),
      '',
      'Auditoria de pagaments per trimestre (indicis per a revisar, no veredictes):',
      ...informePagaments(auditoria)
    );
  } else if (moviments.length) {
    avisos.push(avis('TRI-SENSE-FACTURES', 'info', `${moviments.length} moviments i cap full de factures: porta el full CSV del tractor de factures per a proposar-ne els assentaments.`, 'conciliacio'));
    informe.push('', `Moviments del banc: ${moviments.length}.`, ...primers(moviments.map(liniaMoviment), LLINDARS.maxLiniesInforme).map((l) => `- ${l}`));
  } else if (factures.length) {
    avisos.push(avis('TRI-SENSE-BANC', 'info', `${factures.length} factures i cap moviment del banc: porta l’extracte en Norma 43 o el CSV del banc per a conciliar-les.`, 'conciliacio'));
    informe.push('', 'Resum del full per trimestre (sense banc):', ...informePagaments(auditoria, { ambBanc: false }));
  }
  informe.push('', 'Res no s’ha anotat, mogut ni esborrat: cada proposta espera que la revises i l’aproves a la Gestoria.');
  return { avisos, informe: informe.join('\n') };
}

/* Els fitxers tal com els ha triat la persona: el triturador els classifica ell. */
const preparaTriturador = (fitxers) => ({ fitxers: fitxersTriats(fitxers) });

const MODULS_GESTORIA = [
  'auditoriaPagaments.js', 'c43.js', 'cataleg.js', 'concilia.js', 'csv.js', 'dates.js', 'diners.js', 'extracteCsv.js',
  'fontMoviments.js', 'fullModel.js', 'model.js', 'movimentsBanc.js', 'nif.js', 'plantilla.js', 'proveidors.js'
].map((f) => `src/sections/gestoria/nucli/${f}`);

export const SENTINELLA_TRITURADOR = definixSentinella({
  id: 'sentinella.triturador-financer',
  nom: 'Sentinella Triturador Financer · Trituradora de Documents Locals',
  versio: '1.1.0',
  descripcio: 'Llig en lot, en este ordinador, els extractes en Norma 43, els CSV del banc o de la targeta i els fulls trimestrals de factures que tries; proposa assentaments, assenyala les discrepàncies d’IVA i fa l’auditoria de pagaments de cada trimestre, tot pendent d’Aprovar.',
  disparador: [
    { tipus: 'carpeta', detall: 'Quan deixes un lot de fitxers a la carpeta del trimestre i els tries amb el selector.' }
  ],
  llig: ['Els fitxers que tries: extractes en Norma 43, CSV de moviments del banc o de la targeta de crèdit i els fulls trimestrals CSV del tractor de factures'],
  escriu: ['Res: les propostes i les discrepàncies només es mostren a la pantalla'],
  xarxa: 'cap',
  dadesPersonals: true,
  nivell: 'L0',
  eixida: ['bandera', 'informe'],
  superficie: { tipus: 'departament', departaments: ['Bancs', 'Facturació', 'Impostos'] },
  portaHumana: 'Cada assentament i cada discrepància d’IVA queda pendent d’Aprovar a la Gestoria; cap pagament ni enviament ix d’ací.',
  proves: ['src/sections/tractors/sentinelles/trituradorFinancer.test.js'],
  llindars: { ...LLINDARS },
  fitxa: 'src/sections/tractors/sentinelles/fitxes/sentinella_triturador_financer.md',
  fonts: [...FONTS_COMUNES, 'src/sections/tractors/sentinelles/trituradorFinancer.js', ...MODULS_GESTORIA],
  entrada: {
    etiqueta: 'Lot de documents (Norma 43, CSV del banc o de la targeta i fulls trimestrals)',
    ajuda: 'Pots triar-ne diversos alhora, també els fulls de més d’un trimestre. Els PDF de factures passen pel tractor de factures.',
    accepta: '.n43,.c43,.q43,.aeb,.csb,.txt,.csv,.pdf',
    multiple: true,
    prepara: preparaTriturador
  },
  observa: observaTriturador
});
