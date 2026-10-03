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
 */
import { llegeixC43, textDelsConceptes, totsElsMoviments } from '../../gestoria/nucli/c43.js';
import { concilia } from '../../gestoria/nucli/concilia.js';
import { formatData } from '../../gestoria/nucli/dates.js';
import { llegeixModelCsv } from '../../gestoria/nucli/fullModel.js';
import { validaFactura } from '../../gestoria/nucli/model.js';
import { fusionaMoviments, llegeixMovimentsCsv } from '../../gestoria/nucli/movimentsBanc.js';
import { avis, contingutDe, esObjecte, eurosDe, extensioDe, fitxersTriats, nomDe, primers, severitatDe, textDe } from './comu.js';
import { FONTS_COMUNES, definixSentinella } from './contracte.js';

const EXTENSIONS_C43 = new Set(['n43', 'c43', 'q43', 'aeb', 'csb']);
const LLINDARS = Object.freeze({ maxLiniesInforme: 40 });
const REGISTRE_C43 = 80;
const BOM = String.fromCharCode(0xfeff);
const BOM_UTF8 = [0xef, 0xbb, 0xbf];
const codiDe = (prefix, codi) => `${prefix}-${String(codi).toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;

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

/**
 * @param {{ fitxers: Array<{ nom: string, bytes?: Uint8Array, text?: string }> }} entrada
 */
export function observaTriturador(entrada) {
  const avisos = [];
  const llegits = [];
  const lectures = [];
  const filesBanc = [];
  const factures = [];
  const fitxers = (esObjecte(entrada) && Array.isArray(entrada.fitxers) ? entrada.fitxers : []).filter(esObjecte);

  for (const fitxer of fitxers) {
    const nom = nomDe(fitxer);
    const ext = extensioDe(nom);
    if (ext === 'pdf') {
      avisos.push(avis('TRI-PDF', 'info', `«${nom}»: els PDF de factures els llig el tractor «Gestoria · Full trimestral de factures», amb la seua aprovació. Porta’n el full CSV que proposa i el creuaré amb el banc.`, nom));
      continue;
    }
    if (esNorma43(fitxer)) {
      const lectura = llegeixC43(contingutDe(fitxer));
      lectures.push(lectura);
      llegits.push(`${nom}: Norma 43, ${totsElsMoviments(lectura).length} moviments`);
      for (const a of lectura.avisos) {
        avisos.push(avis(codiDe('TRI-C43', a.codi), severitatDe(a.severitat), a.missatge, a.linia ? `${nom}:${a.linia}` : nom));
      }
      continue;
    }
    if (ext === 'csv' || ext === 'txt') {
      const text = textDe(contingutDe(fitxer));
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
      if (delFull.length) {
        factures.push(...delFull);
        llegits.push(`${nom}: full trimestral, ${delFull.length} factures`);
        for (const a of full.avisos) avisos.push(avis(codiDe('TRI-FULL', a.codi), severitatDe(a.severitat), a.missatge, nom));
        continue;
      }
      avisos.push(avis('TRI-NO-RECONEGUT', 'groga', `«${nom}» no és ni un CSV de moviments del banc ni un full trimestral: no l’he llegit.`, nom));
      continue;
    }
    avisos.push(avis('TRI-IGNORAT', 'info', `«${nom}»: format que el triturador no llig (només Norma 43, CSV i el full trimestral).`, nom));
  }

  /* El banc: la Norma 43 mana; el CSV hi afig el comerç de les compres amb targeta. */
  let moviments = [];
  if (lectures.length) {
    const delC43 = lectures.flatMap(totsElsMoviments);
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

  /* L'IVA de cada factura del full: el que no quadra queda pendent d'Aprovar. */
  for (const f of factures) {
    for (const incidencia of validaFactura(f)) {
      if (incidencia.codi !== 'IVA_INCOHERENT' && incidencia.codi !== 'TIPUS_IVA_INUSUAL') continue;
      const severitat = incidencia.codi === 'IVA_INCOHERENT' || incidencia.severitat === 'alta' ? 'roja' : 'groga';
      avisos.push(avis(codiDe('TRI-IVA', incidencia.codi), severitat, `Factura ${nomFactura(f)}: ${incidencia.missatge} Queda pendent d’«Aprovar».`, f.origen?.fitxer || 'full'));
    }
  }

  const informe = [`Fitxers llegits (${llegits.length}):`, ...llegits.map((l) => `- ${l}`)];
  if (!fitxers.length) avisos.push(avis('TRI-SENSE-FITXERS', 'info', 'No hi ha cap fitxer a triturar.', 'entrada'));

  if (moviments.length && factures.length) {
    const resultat = concilia({ moviments, factures });
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
      ...primers(resultat.facturesSensePagament.map(nomFactura), LLINDARS.maxLiniesInforme).map((l) => `- ${l}`)
    );
  } else if (moviments.length) {
    avisos.push(avis('TRI-SENSE-FACTURES', 'info', `${moviments.length} moviments i cap full de factures: porta el full CSV del tractor de factures per a proposar-ne els assentaments.`, 'conciliacio'));
    informe.push('', `Moviments del banc: ${moviments.length}.`, ...primers(moviments.map(liniaMoviment), LLINDARS.maxLiniesInforme).map((l) => `- ${l}`));
  } else if (factures.length) {
    avisos.push(avis('TRI-SENSE-BANC', 'info', `${factures.length} factures i cap moviment del banc: porta l’extracte en Norma 43 o el CSV del banc per a conciliar-les.`, 'conciliacio'));
  }
  informe.push('', 'Res no s’ha anotat, mogut ni esborrat: cada proposta espera que la revises i l’aproves a la Gestoria.');
  return { avisos, informe: informe.join('\n') };
}

/* Els fitxers tal com els ha triat la persona: el triturador els classifica ell. */
const preparaTriturador = (fitxers) => ({ fitxers: fitxersTriats(fitxers) });

const MODULS_GESTORIA = [
  'c43.js', 'cataleg.js', 'concilia.js', 'csv.js', 'dates.js', 'diners.js', 'fullModel.js', 'model.js', 'movimentsBanc.js',
  'nif.js', 'plantilla.js', 'proveidors.js'
].map((f) => `src/sections/gestoria/nucli/${f}`);

export const SENTINELLA_TRITURADOR = definixSentinella({
  id: 'sentinella.triturador-financer',
  nom: 'Sentinella Triturador Financer · Trituradora de Documents Locals',
  versio: '1.0.0',
  descripcio: 'Llig en lot, en este ordinador, els extractes en Norma 43, els CSV del banc i el full trimestral de factures que tries; proposa assentaments i assenyala les discrepàncies d’IVA, tot pendent d’Aprovar.',
  disparador: [
    { tipus: 'carpeta', detall: 'Quan deixes un lot de fitxers a la carpeta del trimestre i els tries amb el selector.' }
  ],
  llig: ['Els fitxers que tries: extractes en Norma 43, CSV de moviments del banc i el full trimestral CSV del tractor de factures'],
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
    etiqueta: 'Lot de documents (Norma 43, CSV del banc i full trimestral)',
    ajuda: 'Pots triar-ne diversos alhora. Els PDF de factures passen pel tractor de factures.',
    accepta: '.n43,.c43,.q43,.aeb,.csb,.txt,.csv,.pdf',
    multiple: true,
    prepara: preparaTriturador
  },
  observa: observaTriturador
});
