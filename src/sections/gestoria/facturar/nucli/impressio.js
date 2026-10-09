/**
 * impressio.js — la factura emesa tal com es llig en paper. Pur.
 *
 * Onada 6 (261009, front «gestoria-facturació»: «emetre factures des de Sóc
 * de Poble [...] i estar preparada per a la nova llei VeriFactu»). Del
 * registre d'alta del llibre (que porta la factura sencera, congelada el dia
 * que es va emetre) es trau el que va a la factura impresa, amb les mencions
 * dels articles 6, 7 i 15 del Reglament de facturació (RD 1619/2012):
 *   · número i sèrie, data d'expedició i, si és una altra, la de l'operació;
 *   · emissor i destinatari amb nom, NIF i domicili (la simplificada, sense
 *     destinatari);
 *   · cada línia amb el preu unitari sense IVA (o amb l'IVA inclòs, a la
 *     simplificada que ho diu), el tipus i l'import; el desglossament per
 *     tipus amb la base i la quota; el total; la retenció d'IRPF i el que
 *     queda per pagar, si n'hi ha;
 *   · la menció de l'article de la Llei 37/1992 en cada operació exempta;
 *   · a les rectificatives, que ho són, la causa, la manera (per substitució
 *     o per diferències) i les factures que rectifiquen; a la F3, els tiquets
 *     que substituïx;
 *   · el QR de cotejo (qrDibuix.js) amb el text de la seua adreça (qr.js)
 *     i, mentre no hi haja remissió, l'avís que la seu de l'AEAT no hi
 *     trobarà la factura (AVIS_QR_SENSE_REMISSIO).
 * La inversió del subjecte passiu no hi és: el nucli encara no emet S2
 * (facturaEmesa.js, fase 0), i no se n'inventa la menció.
 * La menció «VERI*FACTU» NO hi va mai d'ací: només es pot posar quan el
 * programa envie cada registre a l'AEAT, i encara no ho fa.
 * Sense DOM, React ni xarxa.
 */
import { RECTIFICATIVES } from '../../facturacio/facturaEmesa.js';
import { textQR } from '../../facturacio/registre/qr.js';
import { camiSvgQR, codificaQR } from '../../facturacio/qrDibuix.js';
import { formatImport } from '../../nucli/diners.js';
import { dataCurta } from './formulari.js';

/* El títol de cada tipus de factura (TipoFactura de l'AEAT). */
const TITOLS = Object.freeze({
  F1: 'Factura', F2: 'Factura simplificada', F3: 'Factura',
  R1: 'Factura rectificativa', R2: 'Factura rectificativa', R3: 'Factura rectificativa', R4: 'Factura rectificativa',
  R5: 'Factura rectificativa simplificada'
});

/* La causa de cada rectificativa, com la diu la factura (art. 80 de la Llei 37/1992). */
export const CAUSES_RECTIFICATIVA = Object.freeze({
  R1: 'Rectificació per un error fonamentat en dret o per l’article 80.1, 80.2 o 80.6 de la Llei 37/1992 (descomptes, devolucions o canvis del preu).',
  R2: 'Rectificació per l’article 80.3 de la Llei 37/1992 (concurs de creditors).',
  R3: 'Rectificació per l’article 80.4 de la Llei 37/1992 (crèdit incobrable).',
  R4: 'Rectificació per una altra causa.',
  R5: 'Rectificació d’una factura simplificada.'
});

/* La menció de cada causa d'exempció (OperacionExenta de l'AEAT). */
export const MENCIONS_EXEMPCIO = Object.freeze({
  E1: 'Operació exempta de l’IVA per l’article 20 de la Llei 37/1992.',
  E2: 'Operació exempta de l’IVA per l’article 21 de la Llei 37/1992.',
  E3: 'Operació exempta de l’IVA per l’article 22 de la Llei 37/1992.',
  E4: 'Operació exempta de l’IVA pels articles 23 i 24 de la Llei 37/1992.',
  E5: 'Operació exempta de l’IVA per l’article 25 de la Llei 37/1992.',
  E6: 'Operació exempta de l’IVA.'
});

/* El text que la norma vol damunt del QR [NO VERIFICAT el literal exacte: a contrastar amb l'Orde HAC/1177/2024]. */
export const RETOL_QR = 'QR tributario:';

/* Correcció de la revisió (261009): mentre el programa no envie els registres a l'AEAT, el paper diu, davall
   de l'adreça del QR, que la seu no hi trobarà la factura. Qui la rep i escaneja el QR ho llig ací, i no
   només qui l'emet a la pantalla. Quina adreça ha de portar un sistema que no remet és pregunta per al
   Mestre [NO VERIFICAT]: de moment, la de qr.js. */
export const AVIS_QR_SENSE_REMISSIO = 'Este programa encara no envia les factures a l’AEAT: si llegiu el QR, la seu electrònica de l’AEAT no hi trobarà esta factura.';

/* «21 %», «10,5 %». */
const percentatge = (valor) => `${String(valor).replace('.', ',')} %`;
/* «2,5», «12 peces». */
const quantitat = (valor, unitat) => `${String(valor).replace('.', ',')}${unitat ? ` ${unitat}` : ''}`;

/* Nom, NIF i domicili d'una persona de la factura, en línies. */
function persona(p) {
  if (!p) return null;
  const d = p.domicili;
  return {
    nom: p.nom,
    ...(p.nomComercial ? { nomComercial: p.nomComercial } : {}),
    nif: p.nif,
    domicili: d ? [d.adreca, `${d.codiPostal} ${d.poblacio}${d.provincia ? ` (${d.provincia})` : ''}`] : []
  };
}

/* «A2026-0001 (07/10/2026)», per a una llista de factures referides. */
const referides = (llista) => llista.map((r) => `${r.numSerie} (${dataCurta(r.dataExpedicio)})`).join(', ');

/**
 * El QR de cotejo d'un registre d'alta: l'adreça, la versió i el camí SVG.
 * Llança QR_INVALID si el registre no en pot portar.
 * @param {object} registre l'alta del llibre
 * @param {{ entorn?: 'produccio'|'preproduccio' }} [opcions]
 * @returns {{ url: string, versio: number, costat: number, d: string }}
 */
export function qrDeRegistre(registre, { entorn = 'produccio' } = {}) {
  const url = textQR(registre, { entorn });
  const qr = codificaQR(url);
  return { url, versio: qr.versio, ...camiSvgQR(qr) };
}

/**
 * El que va a la factura impresa d'un registre d'alta del llibre.
 * @param {object} registre l'alta (amb la factura dins)
 * @param {{ anulada?: boolean, ambQr?: boolean, entorn?: 'produccio'|'preproduccio', remesa?: boolean }} [opcions]
 *   `remesa`: el registre ja s'ha enviat a l'AEAT (encara no passa mai); si no, el QR porta l'avís
 * @returns {object}
 */
export function modelDeFactura(registre, { anulada = false, ambQr = true, entorn = 'produccio', remesa = false } = {}) {
  const f = registre?.factura;
  if (!f || registre.tipusRegistre !== 'alta') throw new TypeError('Només es pot imprimir una factura emesa (un registre d’alta del llibre).');
  const rectificativa = RECTIFICATIVES.includes(f.tipus);
  const ivaInclos = f.ivaInclos === true;

  const linies = f.linies.map((l) => ({
    concepte: l.concepte,
    ...(l.detall ? { detall: l.detall } : {}),
    quantitat: quantitat(l.quantitat, l.unitat),
    preu: formatImport(l.preuUnitari),
    iva: l.exempcio ? 'Exempta' : percentatge(l.tipusIva),
    import: formatImport(ivaInclos ? l.import : l.base)
  }));
  const desglossament = f.desglossament.map((g) => ({
    tipus: g.exempcio ? `Exempta (${g.exempcio})` : percentatge(g.tipusIva),
    base: formatImport(g.base),
    quota: formatImport(g.quota)
  }));

  const totals = [
    { etiqueta: 'Base imposable', valor: formatImport(f.baseTotal) },
    { etiqueta: 'IVA', valor: formatImport(f.quotaTotal) },
    { etiqueta: ivaInclos ? 'Total, IVA inclòs' : 'Total de la factura', valor: formatImport(f.importTotal), principal: !f.retencio }
  ];
  if (f.retencio) {
    totals.push({ etiqueta: `Retenció d’IRPF (${percentatge(f.retencio.percentatge)})`, valor: formatImport(-f.retencio.import) });
    totals.push({ etiqueta: 'Total a pagar', valor: formatImport(f.liquid), principal: true });
  }

  const referencies = [];
  if (rectificativa) {
    referencies.push(CAUSES_RECTIFICATIVA[f.tipus]);
    referencies.push(`${f.rectificades.length === 1 ? 'Factura rectificada' : 'Factures rectificades'}: ${referides(f.rectificades)}.`);
    referencies.push(f.tipusRectificativa === 'S'
      ? `Per substitució: esta factura substituïx la rectificada. Import rectificat: base ${formatImport(f.importRectificat.base)}, IVA ${formatImport(f.importRectificat.quota)}.`
      : 'Per diferències: esta factura porta només el que canvia.');
  }
  if (f.tipus === 'F3') referencies.push(`Emesa en substitució de les factures simplificades: ${referides(f.substituides)}.`);

  const exemptes = [...new Set(f.desglossament.filter((g) => g.exempcio).map((g) => g.exempcio))];
  const mencions = exemptes.map((e) => MENCIONS_EXEMPCIO[e]);

  return {
    numero: f.numSerie,
    titol: TITOLS[f.tipus] ?? 'Factura',
    tipus: f.tipus,
    dataExpedicio: dataCurta(f.dataExpedicio),
    dataOperacio: f.dataOperacio && f.dataOperacio !== f.dataExpedicio ? dataCurta(f.dataOperacio) : null,
    venciment: f.venciment ? dataCurta(f.venciment) : null,
    emissor: persona(f.emissor),
    destinatari: persona(f.destinatari),
    descripcio: f.descripcio,
    ivaInclos,
    linies,
    desglossament,
    totals,
    referencies,
    mencions,
    anulada,
    qr: ambQr ? { ...qrDeRegistre(registre, { entorn }), avis: remesa ? null : AVIS_QR_SENSE_REMISSIO } : null
  };
}
