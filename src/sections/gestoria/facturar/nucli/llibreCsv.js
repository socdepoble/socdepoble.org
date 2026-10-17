/**
 * llibreCsv.js — el llibre registre de factures expedides d'un període, en
 * CSV per a la gestoria. Pur.
 *
 * Gauntlet 261016, Onada 3 (el llibre net a l'estil Holded i FacturaDirecta,
 * que el donen cada trimestre): les files de filesDelLlibre d'un període
 * (resumDelLlibre), en l'ordre del llibre (la més antiga primer), una fila
 * per factura. El format és el que obri un full de càlcul en valencià o en
 * castellà sense preguntar res: separador «;», coma decimal sense separador
 * de milers, salts de línia CRLF i la marca BOM d'UTF-8 al principi, perquè
 * Excel llija bé els accents.
 *
 * Cap serialitzador nou: escriu amb serialitzaCsv de gestoria/nucli/csv.js
 * (cometes només on calen, les de dins doblades, CRLF i BOM) i neutralitza
 * cada text amb protegeixFormula, la defensa contra la injecció de fórmules:
 * un nom de client que comença per «=», «+», «-», «@» o un tabulador porta un
 * apòstrof davant. csv.js és font del tractor gestoria.tauler: s'importa,
 * mai s'edita. Els imports no passen per protegeixFormula: són xifres, i un
 * negatiu ha de continuar sent un número.
 *
 * Columnes: el número, les dates, el tipus (el codi de l'AEAT i el nom), la
 * manera de la rectificativa, les factures que corregix o substituïx, el NIF i
 * el nom del client, la base i l'IVA de cada tipus que hi ha al període (i la
 * base de cada exempció), la base imposable, l'IVA, el total, la retenció
 * d'IRPF, el total a pagar i l'estat. Les anul·lades hi són, marcades: el
 * llibre no amaga res. Els imports d'eixes columnes són els de cada factura,
 * tal com és.
 * Revisió adversarial del Carril E (261016): al final, sense moure cap de les
 * columnes d'abans, el que cada factura SUMA al període («efecte» de
 * filesDelLlibre: 0,00 en una anul·lada; la diferència en una F3 o en una
 * rectificativa per substitució) i, en les rectificatives per substitució,
 * l'import rectificat (la base i l'IVA de les rectificades, el mateix
 * ImporteRectificacion de l'XML de l'AEAT). La suma de la columna «Total que
 * suma al període» és el «Total del període» del peu de la pantalla
 * (resumDelLlibre): la gestoria no compta dues vegades la mateixa venda.
 *
 * Privacitat: porta els noms i els NIF dels clients. Ix SENSE xifrar, i la
 * pantalla ho diu abans de descarregar-lo (AVIS_SENSE_XIFRAR_LLIBRE, com
 * AVIS_SENSE_XIFRAR del llibre de l'Històric). El nom del fitxer només porta
 * el període, cap dada del titular ni dels clients. Cap XLSX:
 * gestoria/privacitat.test.js només deixa importar l'escriptor de fulls des
 * del llibre de l'Històric.
 * Sense DOM, React ni xarxa.
 */
import { protegeixFormula, serialitzaCsv } from '../../nucli/csv.js';
import { dataCurta } from './formulari.js';

/** El tipus del fitxer. */
export const TIPUS_CSV = 'text/csv;charset=utf-8';

/** L'avís de la pantalla abans de descarregar-lo. */
export const AVIS_SENSE_XIFRAR_LLIBRE = 'El llibre de factures ix d’este ordinador SENSE xifrar: porta els noms i els NIF dels teus clients, '
  + 'i qui tinga el fitxer els podrà llegir. Guarda’l en un lloc segur i envia’l a la gestora per un canal de confiança.';

const SEPARADOR = ';';
const TRIMESTRE = Object.freeze({ 1: '1t', 2: '2t', 3: '3t', 4: '4t' });
const MANERA = Object.freeze({ S: 'Per substitució', I: 'Per diferències' });

/**
 * Un import en cèntims amb coma decimal i sense separador de milers: -104 → «-1,04». '' si no és un enter.
 * @param {number} centims
 * @returns {string}
 */
export function importCsv(centims) {
  if (!Number.isSafeInteger(centims)) return '';
  const abs = Math.abs(centims);
  return `${centims < 0 ? '-' : ''}${Math.floor(abs / 100)},${String(abs % 100).padStart(2, '0')}`;
}

/**
 * El nom del fitxer: el període i prou, cap dada personal, en minúscules com els de la còpia i l'XML.
 * «llibre-factures-emeses-2026-3t.csv», «llibre-factures-emeses-2026.csv» o «llibre-factures-emeses.csv».
 * @param {{ any?: number|null, trimestre?: number|null }} [periode]
 * @returns {string}
 */
export function nomDelLlibreCsv({ any = null, trimestre = null } = {}) {
  if (!Number.isSafeInteger(any)) return 'llibre-factures-emeses.csv';
  return `llibre-factures-emeses-${any}${TRIMESTRE[trimestre] ? `-${TRIMESTRE[trimestre]}` : ''}.csv`;
}

/* El desglossament d'una factura (els grups per tipus d'IVA o per exempció). */
const grupsDe = (fila) => (Array.isArray(fila.registre?.factura?.desglossament) ? fila.registre.factura.desglossament : []);

/* Els tipus d'IVA (de menor a major) i les exempcions que hi ha a les files. */
function columnesDelDesglossament(files) {
  const tipus = new Set();
  const exempcions = new Set();
  for (const fila of files) {
    for (const grup of grupsDe(fila)) {
      if (typeof grup?.exempcio === 'string' && grup.exempcio) exempcions.add(grup.exempcio);
      else if (Number.isFinite(grup?.tipusIva)) tipus.add(grup.tipusIva);
    }
  }
  return { tipus: [...tipus].sort((a, b) => a - b), exempcions: [...exempcions].sort() };
}

/* La suma d'un camp dels grups d'una factura que complixen una condició; '' si no n'hi ha cap. */
function delGrup(fila, condicio, camp) {
  const grups = grupsDe(fila).filter(condicio);
  return grups.length ? importCsv(grups.reduce((suma, g) => suma + (Number.isSafeInteger(g[camp]) ? g[camp] : 0), 0)) : '';
}

/* Les factures que corregix (una rectificativa) o substituïx (una F3): «A2026-0001 (07/10/2026)». */
function referenciesDe(factura) {
  const refs = [...(Array.isArray(factura?.rectificades) ? factura.rectificades : []), ...(Array.isArray(factura?.substituides) ? factura.substituides : [])];
  return refs.map((ref) => `${ref.numSerie} (${dataCurta(ref.dataExpedicio)})`).join(', ');
}

/**
 * El CSV del llibre registre de factures expedides d'unes files.
 * @param {ReadonlyArray<object>} files les de filesDelLlibre (o les d'un període de resumDelLlibre), de la més nova a la més antiga
 * @returns {string} el text, amb la marca BOM al principi i CRLF al final de cada línia
 */
export function llibreCsv(files) {
  const llista = [...(Array.isArray(files) ? files : [])].reverse();
  const { tipus, exempcions } = columnesDelDesglossament(llista);
  const capcalera = [
    'Número', 'Data d’expedició', 'Data de l’operació', 'Tipus (AEAT)', 'Tipus', 'Rectificativa', 'Factures que corregix o substituïx',
    'NIF del client', 'Client',
    ...tipus.flatMap((t) => [`Base al ${t} %`, `IVA al ${t} %`]),
    ...exempcions.map((e) => `Base exempta (${e})`),
    'Base imposable', 'IVA', 'Total', 'Retenció d’IRPF', 'Total a pagar', 'Estat',
    'Base que suma al període', 'IVA que suma al període', 'Total que suma al període', 'Base rectificada', 'IVA rectificat'
  ];
  const linies = llista.map((fila) => {
    const factura = fila.registre?.factura ?? {};
    const liquid = Number.isSafeInteger(factura.liquid) ? factura.liquid : fila.importTotal - fila.retencio;
    const efecte = fila.efecte ?? {};
    const rectificat = factura.tipusRectificativa === 'S' ? factura.importRectificat : null;
    const textos = [
      fila.numSerie, fila.data, dataCurta(factura.dataOperacio), fila.tipusFactura, fila.tipus,
      MANERA[factura.tipusRectificativa] ?? '', referenciesDe(factura), fila.nif, factura.destinatari?.nom ?? ''
    ].map(protegeixFormula);
    return [
      ...textos,
      ...tipus.flatMap((t) => [
        delGrup(fila, (g) => !g?.exempcio && g?.tipusIva === t, 'base'),
        delGrup(fila, (g) => !g?.exempcio && g?.tipusIva === t, 'quota')
      ]),
      ...exempcions.map((e) => delGrup(fila, (g) => g?.exempcio === e, 'base')),
      importCsv(fila.base), importCsv(fila.quota), importCsv(fila.importTotal), importCsv(fila.retencio), importCsv(liquid),
      protegeixFormula(fila.anulada ? 'Anul·lada' : 'Emesa'),
      importCsv(efecte.base), importCsv(efecte.quota), importCsv(efecte.total),
      importCsv(rectificat?.base), importCsv(rectificat?.quota)
    ];
  });
  return serialitzaCsv([capcalera, ...linies], { delimitador: SEPARADOR });
}
