/**
 * full.js — el full per al metge (nucli pur): el model de fulls de
 * src/utils/fulls a partir dels apunts d'un període.
 *
 *   1. Resum       capçalera (persona, període i avís) i una fila per jornada, més la mitjana
 *   2. Diari       cronològic, una fila per apunt
 *   3. Conducta    els episodis amb el registre ABC sencer
 *   4. Medicació   les preses
 *   5. Diccionari  cada camp amb la seua definició, perquè el metge entenga cada columna
 *
 * Cada columna nomena la seua font al diccionari (`font`): una prova comprova
 * que totes hi existixen. La vista de la pantalla i l'exportació ixen del
 * mateix model: el que es veu és el que s'envia.
 */
import { dataCurta, dataDe, etiquetaData, horaDe, limitsJornada, ordenaPerInstant, periodeDe, sumaDies } from './hores.js';
import { datesDe, metriquesPeriode, textCobertura } from './metriques.js';
import {
  CAMPS_COMUNS, ENTITATS, campDe, etiquetaValor, opcionsDe, resumApunt, textDecimes, tipusDe
} from './diccionari.js';

export const AVIS_FULL = 'Registre domèstic. No és un informe clínic ni un producte sanitari.';
export const NOMS_FULLES = Object.freeze(['Resum', 'Diari', 'Conducta', 'Medicació', 'Diccionari']);

const col = (titol, tipus, font, extra = {}) => Object.freeze({ titol, tipus, font, ...extra });

export const COLUMNES_RESUM = Object.freeze([
  col('Dia', 'text', 'jornada.data', { amplada: 30 }),
  col('Completa', 'text', 'jornada.completa'),
  col('Cobertura', 'text', 'metriques.cobertura'),
  col('Vegades de dia', 'decimal', 'metriques.frequenciaDiurna', { decimals: 1 }),
  col('Vegades de nit', 'decimal', 'metriques.nicturia', { decimals: 1 }),
  col('Orina 24 h (ml)', 'nombre', 'metriques.volum24h'),
  col('Orina de nit (ml)', 'nombre', 'metriques.volumNocturn'),
  col('Part de nit (%)', 'decimal', 'metriques.indexPoliuriaNocturna', { decimals: 1 }),
  col('Índex de nit (Ni)', 'decimal', 'metriques.indexNicturia', { decimals: 2 }),
  col('Màxim (ml)', 'nombre', 'metriques.volumMaxim'),
  col('Mitjana (ml)', 'nombre', 'metriques.volumMitja'),
  col('Begut (ml)', 'nombre', 'metriques.ingestaTotal'),
  col('Escapaments', 'decimal', 'entitat.escapament', { decimals: 1 }),
  col('Absorbents', 'decimal', 'entitat.absorbent', { decimals: 1 }),
  col('Deposicions', 'decimal', 'entitat.deposicio', { decimals: 1 }),
  col('Episodis', 'decimal', 'entitat.conducta', { decimals: 1 })
]);

export const COLUMNES_DIARI = Object.freeze([
  col('Data', 'data', 'comuns.moment'),
  col('Hora', 'hora', 'derivats.hora'),
  col('Dia o nit', 'text', 'derivats.periode'),
  col('Beguda', 'text', 'ingesta.beguda'),
  col('Begut (ml)', 'nombre', 'ingesta.volumMl'),
  col('Orina (ml)', 'nombre', 'miccio.volumMl'),
  col('Mesura', 'text', 'miccio.mesura'),
  col('Urgència (0–4)', 'nombre', 'miccio.urgencia'),
  col('Escapament', 'text', 'escapament.quantitat'),
  col('Absorbent', 'text', 'absorbent.estat'),
  col('Deposició (Bristol)', 'nombre', 'deposicio.bristol'),
  col('Conducta', 'text', 'conducta.intensitat', { amplada: 40 }),
  col('Medicació', 'text', 'medicacio.nom', { amplada: 30 }),
  col('Notes', 'text', 'comuns.nota', { amplada: 40 })
]);

export const COLUMNES_CONDUCTA = Object.freeze([
  col('Data', 'data', 'comuns.moment'),
  col('Hora', 'hora', 'derivats.hora'),
  col('Durada (min)', 'nombre', 'conducta.duradaMin'),
  col('Intensitat', 'text', 'conducta.intensitat'),
  col('Què ha fet', 'text', 'conducta.conductes', { amplada: 40 }),
  col('Què passava abans', 'text', 'conducta.antecedents', { amplada: 40 }),
  col('Què hem fet', 'text', 'conducta.accions', { amplada: 40 }),
  col('Com ha acabat', 'text', 'conducta.resultat'),
  col('Perill', 'text', 'conducta.risc'),
  col('Notes', 'text', 'comuns.nota', { amplada: 40 })
]);

export const COLUMNES_MEDICACIO = Object.freeze([
  col('Data', 'data', 'comuns.moment'),
  col('Hora', 'hora', 'derivats.hora'),
  col('Nom', 'text', 'medicacio.nom', { amplada: 30 }),
  col('Quantitat', 'text', 'medicacio.dosi'),
  col('Pauta', 'text', 'medicacio.pauta'),
  col('Estat', 'text', 'medicacio.estat'),
  col('Per a què (ho diu la família)', 'text', 'medicacio.etiqueta')
]);

export const COLUMNES_DICCIONARI = Object.freeze([
  col('Entitat', 'text', 'diccionari.entitat'),
  col('Camp', 'text', 'diccionari.camp', { amplada: 30 }),
  col('Columna', 'text', 'diccionari.columna'),
  col('Tipus', 'text', 'diccionari.tipus'),
  col('Unitat', 'text', 'diccionari.unitat'),
  col('Valors admesos', 'text', 'diccionari.valors', { amplada: 50 }),
  col('Definició', 'text', 'diccionari.definicio', { amplada: 60 }),
  col('Per què importa', 'text', 'diccionari.perQueImporta', { amplada: 60 })
]);

const TIPUS_LLEGIBLE = Object.freeze({
  enter: 'nombre sencer', decimes: 'nombre amb un decimal', escala: 'escala', opcio: 'una opció', multiopcio: 'diverses opcions',
  boolea: 'sí o no', text: 'text', moment: 'dia i hora', hora: 'hora', data: 'data', decimal: 'nombre amb decimals'
});

const llista = (definicio, valors) => (valors || []).map((valor) => etiquetaValor(definicio, valor)).join('; ');
const e = (tipus, clau, valor) => (valor === undefined ? '' : etiquetaValor(campDe(tipus, clau), valor));

/** Els valors admesos d'un camp, en text («0–1500», «Sec; Humit; …»). */
export function textValorsAdmesos(definicio) {
  const opcions = opcionsDe(definicio);
  if (opcions.length) return opcions.map((o) => o.etiqueta).join('; ');
  if (definicio.tipus === 'decimes') return `${textDecimes(definicio.min)}–${textDecimes(definicio.max)}`;
  if (Number.isFinite(definicio.min)) return `${definicio.min}–${definicio.max}`;
  if (definicio.maxLlargada) return `fins a ${definicio.maxLlargada} caràcters`;
  return '';
}

/* El que no té columna pròpia va a «Notes», davant de la nota de la família. */
function notesDiari(apunt) {
  const extra = [];
  if (apunt.tipus === 'son' || apunt.tipus === 'observacio') extra.push(resumApunt(apunt));
  if (apunt.tipus === 'ingesta' && apunt.rebutjada) extra.push('No l’ha volguda');
  if (apunt.tipus === 'ingesta' && apunt.estimat) extra.push('Calculat a ull');
  return [...extra, apunt.nota].filter(Boolean).join(' · ');
}

/* La columna «Dia o nit». «Matí següent»: la primera micció de l'endemà de l'últim dia, que tanca la nit. */
const ETIQUETA_PERIODE = Object.freeze({ dia: 'Dia', nit: 'Nit', 'mati-seguent': 'Matí següent' });

function filaDiari(apunt, periode) {
  const t = apunt.tipus;
  return [
    dataDe(apunt.moment),
    horaDe(apunt.moment),
    ETIQUETA_PERIODE[periode] || ETIQUETA_PERIODE.dia,
    t === 'ingesta' ? e(t, 'beguda', apunt.beguda) : '',
    t === 'ingesta' && !apunt.rebutjada ? apunt.volumMl : null,
    t === 'miccio' ? apunt.volumMl ?? null : null,
    t === 'miccio' ? e(t, 'mesura', apunt.mesura) : '',
    t === 'miccio' ? apunt.urgencia ?? null : null,
    t === 'escapament' ? e(t, 'quantitat', apunt.quantitat) : '',
    t === 'absorbent' ? e(t, 'estat', apunt.estat) : '',
    t === 'deposicio' ? apunt.bristol : null,
    t === 'conducta' ? [e(t, 'intensitat', apunt.intensitat), llista(campDe(t, 'conductes'), apunt.conductes)].filter(Boolean).join(' · ') : '',
    t === 'medicacio' ? [[apunt.nom, apunt.dosi].filter(Boolean).join(' '), e(t, 'estat', apunt.estat)].join(' · ') : '',
    notesDiari(apunt)
  ];
}

const sencer = (valor) => (Number.isFinite(valor) ? Math.round(valor) : null);

/**
 * El model del full d'un període.
 * @param {object} opcions
 * @param {string} opcions.des primera jornada
 * @param {number} opcions.dies
 * @param {object[]} opcions.apunts tots, amb `jornada`
 * @param {Map|object} [opcions.jornades]
 * @param {object} [opcions.persona]
 * @param {string} [opcions.nomPersona] el nom de la capçalera: el que s'escriu en el moment
 *   d'exportar (no es desa) o, a la pantalla, l'àlies. Sense nom, «la persona».
 * @param {Function} [opcions.ofsetDe]
 * @returns {{ model: { fulles: object[] }, periode: object }}
 */
export function fullDiari({ des, dies, apunts, jornades, persona = {}, nomPersona, ofsetDe }) {
  const dates = datesDe(des, dies);
  const conjunt = new Set(dates);
  const periode = metriquesPeriode(des, dies, apunts, { persona, jornades, ofsetDe });
  const delPeriode = ordenaPerInstant(apunts.filter((apunt) => conjunt.has(apunt.jornada)));
  const limits = new Map(dates.map((data) => [data, limitsJornada(data, apunts, persona, ofsetDe ? { ofsetDe } : undefined)]));
  const periodeDeApunt = (apunt) => periodeDe(apunt, limits.get(apunt.jornada));
  const fins = sumaDies(des, dies - 1);
  /* La primera micció de l'endemà de l'últim dia entra a l'orina de nit i de
     24 h de l'últim dia (metriques.js): el Diari (i el CSV) també la porten,
     perquè el metge puga quadrar l'última nit amb les files. */
  const endema = sumaDies(fins, 1);
  const primeraEndema = ordenaPerInstant(apunts.filter((apunt) => apunt.tipus === 'miccio' && apunt.jornada === endema))[0] || null;

  /* Només el nom que es passa: l'àlies desat «només es veu ací» i el fitxer no el porta si no es demana. */
  const nom = typeof nomPersona === 'string' && nomPersona.trim() ? nomPersona.trim() : 'la persona';
  const buides = COLUMNES_RESUM.length - 1;
  const capcalera = [
    [`Persona: ${nom}`, ...Array(buides).fill(null)],
    [`Període: ${dataCurta(des)} – ${dataCurta(fins)} (${dies} ${dies === 1 ? 'dia' : 'dies'})`, ...Array(buides).fill(null)],
    [AVIS_FULL, ...Array(buides).fill(null)]
  ];
  const filesJornada = periode.jornades.map((m) => [
    etiquetaData(m.data), m.completa ? 'Sí' : 'No', textCobertura(m),
    m.frequenciaDiurna, m.nicturia, m.volum24h, m.volumNocturn, m.indexPoliuriaNocturna, m.indexNicturia,
    m.volumMaxim, m.volumMitja, m.ingestaTotal, m.escapaments, m.canvisAbsorbent, m.deposicions, m.episodis
  ]);
  const mi = periode.mitjana;
  const filaMitjana = [
    `Mitjana de ${periode.completes} ${periode.completes === 1 ? 'jornada completa' : 'jornades completes'}`, '', '',
    mi.frequenciaDiurna, mi.nicturia, sencer(mi.volum24h), sencer(mi.volumNocturn), mi.indexPoliuriaNocturna, mi.indexNicturia,
    sencer(mi.volumMaxim), sencer(mi.volumMitja), sencer(mi.ingestaTotal), mi.escapaments, mi.canvisAbsorbent, mi.deposicions, mi.episodis
  ];

  const conductes = delPeriode.filter((apunt) => apunt.tipus === 'conducta');
  const preses = delPeriode.filter((apunt) => apunt.tipus === 'medicacio');
  const filesDiccionari = ENTITATS.flatMap((entitat) => entitat.camps.map((c) => [
    entitat.nom, c.etiqueta, c.columna || '', TIPUS_LLEGIBLE[c.tipus] || c.tipus, c.unitat || '', textValorsAdmesos(c), c.definicio, c.perQueImporta
  ]));

  const model = {
    fulles: [
      { nom: 'Resum', columnes: COLUMNES_RESUM, files: [...capcalera, ...filesJornada, filaMitjana] },
      {
        nom: 'Diari',
        columnes: COLUMNES_DIARI,
        files: [
          ...delPeriode.map((apunt) => filaDiari(apunt, periodeDeApunt(apunt))),
          ...(primeraEndema ? [filaDiari(primeraEndema, 'mati-seguent')] : [])
        ]
      },
      {
        nom: 'Conducta',
        columnes: COLUMNES_CONDUCTA,
        files: conductes.map((a) => [
          dataDe(a.moment), horaDe(a.moment), a.duradaMin ?? null, e('conducta', 'intensitat', a.intensitat),
          llista(campDe('conducta', 'conductes'), a.conductes),
          [llista(campDe('conducta', 'antecedents'), a.antecedents), a.antecedentsAltre].filter(Boolean).join('; '),
          llista(campDe('conducta', 'accions'), a.accions), e('conducta', 'resultat', a.resultat),
          llista(campDe('conducta', 'risc'), a.risc), a.nota || ''
        ])
      },
      {
        nom: 'Medicació',
        columnes: COLUMNES_MEDICACIO,
        files: preses.map((a) => [
          dataDe(a.moment), horaDe(a.moment), a.nom, a.dosi || '', e('medicacio', 'pauta', a.pauta), e('medicacio', 'estat', a.estat),
          e('medicacio', 'etiqueta', a.etiqueta)
        ])
      },
      { nom: 'Diccionari', columnes: COLUMNES_DICCIONARI, files: filesDiccionari }
    ]
  };
  return { model, periode };
}

/** Totes les columnes de l'exportació, per fulla (per a la prova del diccionari i el diàleg). */
export const COLUMNES_PER_FULLA = Object.freeze({
  Resum: COLUMNES_RESUM, Diari: COLUMNES_DIARI, Conducta: COLUMNES_CONDUCTA, 'Medicació': COLUMNES_MEDICACIO, Diccionari: COLUMNES_DICCIONARI
});

/** Si una font de columna existix al diccionari. */
export function fontExistix(font) {
  const [ambit, clau] = font.split('.');
  switch (ambit) {
    case 'comuns': return CAMPS_COMUNS.some((c) => c.clau === clau);
    case 'jornada': return ENTITATS.find((x) => x.id === 'jornada').camps.some((c) => c.clau === clau);
    case 'metriques': return ENTITATS.find((x) => x.id === 'metriques').camps.some((c) => c.clau === clau);
    case 'derivats': return ENTITATS.find((x) => x.id === 'derivats').camps.some((c) => c.clau === clau);
    case 'entitat': return Boolean(tipusDe(clau));
    case 'diccionari': return ['entitat', 'camp', 'columna', 'tipus', 'unitat', 'valors', 'definicio', 'perQueImporta'].includes(clau);
    default: return Boolean(tipusDe(ambit) && campDe(ambit, clau));
  }
}
