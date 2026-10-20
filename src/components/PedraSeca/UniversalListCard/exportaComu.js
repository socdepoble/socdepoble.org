/**
 * exportaComu.js — Fase E (261020, tasca 2; pla 261020_2045) · la llista
 * d'«El Comú» feta taula: les files de la vista estesa, el CSV per a un full
 * de càlcul (el de src/utils/fulls: punt i coma, BOM d'UTF-8 i protecció de
 * fórmules) i el resum de text per a pegar en un WhatsApp de fora.
 *
 * Els textos arriben ja traduïts per `tr(nom, valors)` (el de la vista), i
 * els diners sempre són cèntims enters que només es formen ací. La capa
 * econòmica (les columnes `economia`, el sou de la banda) només ix per a qui
 * governa la llista. Cap imatge: exportar com a imatge necessitaria una
 * dependència nova (decisió del Mestre).
 *
 * JS pur: sense DOM ni React.
 */
import { serialitzaCsv } from '../../../utils/fulls/csv.js';
import { formatEuros } from '../../../utils/diners.js';
import { modeDe, elementsFiltrats, resumDe } from './nucliComu.js';
import { camelDe } from './textosComu.js';

/** Les columnes del mode que pot vore l'actor (la capa econòmica, només qui governa). */
export function columnesDe(llista, { gestor = false } = {}) {
  const mode = modeDe(llista);
  return mode ? mode.columnes.filter((c) => gestor || !c.economia) : [];
}

/** El text d'una cel·la per a la taula i el WhatsApp. */
function textDeCela(columna, valor, tr) {
  if (valor === null || valor === undefined || valor === '') return '';
  if (columna.cents) return formatEuros(valor);
  if (columna.siNo) return tr(valor ? 'si' : 'no');
  if (columna.clau === 'estat' || columna.clau === 'assistencia') return tr(`estat.${camelDe(valor)}`);
  if (columna.clau === 'vinculacio') return tr(`banda.vinculacio.${valor}`);
  if (columna.clau === 'desti') return tr(`bar.${valor}`);
  if (columna.clau === 'format') return tr(`loteria.${valor}`);
  if (columna.clau === 'pagament') return tr(valor === 'pagat' ? 'banda.pagat' : 'banda.pendentPagar');
  if (typeof valor === 'number') return String(valor).replace('.', ',');
  return String(valor);
}

/** { capcalera: [text], files: [{ id, celes: [text] }] } per a la <Taula> de la vista estesa. */
export function taulaDe(llista, { tr, gestor = false } = {}) {
  const columnes = columnesDe(llista, { gestor });
  return {
    capcalera: columnes.map((c) => tr(`columna.${c.clau}`)),
    files: elementsFiltrats(llista, 'tots').map((e) => ({
      id: e.id,
      celes: columnes.map((c) => textDeCela(c, c.valor(e, llista), tr))
    }))
  };
}

/** El CSV (amb BOM) de la llista: els imports com a nombres en euros, per a poder sumar-los al full. */
export function csvDe(llista, { tr, gestor = false } = {}) {
  const columnes = columnesDe(llista, { gestor });
  const files = elementsFiltrats(llista, 'tots').map((e) => columnes.map((c) => {
    const valor = c.valor(e, llista);
    if (c.cents) return Number.isSafeInteger(valor) ? valor / 100 : null;
    if (typeof valor === 'number') return valor;
    return textDeCela(c, valor, tr);
  }));
  return serialitzaCsv([columnes.map((c) => tr(`columna.${c.clau}`)), ...files]);
}

/** Un nom de fitxer sense accents ni espais: «Compra de dissabte» → «compra-de-dissabte.csv». */
export function nomDeFitxer(llista) {
  const base = String(llista?.titol ?? 'llista').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('ca').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  return `${base || 'llista'}.csv`;
}

/* La marca d'estat de cada línia al WhatsApp: fet o pendent, sense colors. */
const FETS = Object.freeze(['comprat', 'cobrat', 'agafat', 'confirmat', 'liquidat']);

/** El resum per a pegar en un xat de fora: el títol en negreta i una línia per element. */
export function textWhatsAppDe(llista, { tr, gestor = false } = {}) {
  const mode = modeDe(llista);
  if (!mode) return '';
  const columnes = columnesDe(llista, { gestor }).filter((c) => c.clau !== 'nom' && c.clau !== 'estat');
  const linies = elementsFiltrats(llista, 'tots').map((e) => {
    const estat = mode.estatDe(e, llista);
    const marca = FETS.includes(estat) ? '✅' : '⭕';
    const detall = columnes.map((c) => textDeCela(c, c.valor(e, llista), tr)).filter(Boolean).slice(0, 3).join(' · ');
    return `${marca} *${e.nom}*${detall ? ` · ${detall}` : ''} (${tr(`estat.${camelDe(estat)}`)})`;
  });
  const progres = resumDe(llista)?.progres;
  const peu = progres ? [tr(`progres.${camelDe(llista.mode)}`, { fets: progres.fets, total: progres.total })] : [];
  return [`*${llista.titol}*`, ...linies, ...peu].join('\n');
}
