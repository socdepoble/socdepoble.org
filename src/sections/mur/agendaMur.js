/**
 * agendaMur.js — dels actes del Mur al model d'esdeveniment, pur.
 *
 * T6 (ordre del Mestre, 260930) · L'Agenda del Mur pinta els seus actes amb
 * CalendariEsdeveniments (utils/esdeveniment.js). Un acte del Mur porta date
 * ('AAAA-MM-DD') i, si de cas, time ('HH:MM') (mapejadorSeccions.js); no porta
 * fi, zona, uid ni recurrència. Si algun dia el payload els porta (inici, fi,
 * zona, uid, recurrencia), es lligen tal qual: cap migració.
 *
 * El lloc és el de l'acte (location), mai el poble de qui el publica
 * (author_location): cap dada inventada.
 *
 * Privacitat: l'Agenda només rep els actes del Mur, mai les tasques del Mapa
 * de la Consola (descriuen la màquina del Mestre).
 */
import { diaAmbHora } from '../../components/universal/editorial.js';
import { getSectionItemPath } from '../../config/navigation.js';
import { extractPlainText } from '../../utils/contentAdapter.js';
import { dataIsoONull } from '../../utils/calendari.js';
import { clauDia, creaEsdeveniment, llegixDataHora } from '../../utils/esdeveniment.js';

const DIA = /^(\d{4})-(\d{2})-(\d{2})$/;

/* Un moment del payload: l'objecte del model tal qual, o una cadena (un dia
   'AAAA-MM-DD' o una dataHora). creaEsdeveniment el valida. */
function momentDe(valor, zona) {
  if (valor && typeof valor === 'object') return valor;
  if (typeof valor !== 'string' || !valor.trim()) return null;
  const text = valor.trim();
  return DIA.test(text) ? { data: text } : { dataHora: text, zona };
}

/**
 * Un acte del Mur com a esdeveniment, o null si no se'n pot fer cap (sense
 * títol o sense un dia que existisca). L'inici és el del payload o, si no en
 * porta, el dia i l'hora de l'acte (diaAmbHora): amb hora, un acte amb hora;
 * sense, de tot el dia.
 */
export function acteAEsdeveniment(item) {
  if (!item || typeof item !== 'object') return null;
  const zona = item.zona ?? undefined;
  return creaEsdeveniment({
    id: item.id,
    uid: item.uid,
    titol: item.title || item.name,
    descripcio: extractPlainText(item.entradilla || item.summary || item.description || '', Infinity),
    lloc: item.location,
    inici: momentDe(item.inici, zona) ?? momentDe(diaAmbHora(item.date, item.time), zona),
    fi: momentDe(item.fi, zona),
    recurrencia: item.recurrencia ?? null,
    font: { tipus: 'mur', id: item.id, ruta: getSectionItemPath('events', item.id) },
    actualitzat: dataIsoONull(item.updated_at)
  });
}

/* El dia (clau 'AAAA-MM-DD') en què comença, al calendari de qui mira. */
function diaDInici(esd) {
  if (esd.totElDia) return esd.inici.data;
  const d = new Date(llegixDataHora(esd.inici.dataHora).instant);
  return clauDia(d.getFullYear(), d.getMonth(), d.getDate());
}

/** El mes ({ any, mes }) d'una clau 'AAAA-MM-DD' (el ?date= del Mur), o null. */
export function cursorDeClau(clau) {
  const p = typeof clau === 'string' ? DIA.exec(clau) : null;
  return p && Number(p[2]) >= 1 && Number(p[2]) <= 12 ? { any: Number(p[1]), mes: Number(p[2]) - 1 } : null;
}

/**
 * El mes on s'obri l'Agenda: el de l'acte que comença més prompte a partir de
 * hui o, si cap no ha de vindre, el del més recent. null sense actes.
 */
export function mesDeLActeMesProper(esdeveniments, avui = new Date()) {
  const hui = clauDia(avui.getFullYear(), avui.getMonth(), avui.getDate());
  const dies = (esdeveniments ?? []).filter(Boolean).map(diaDInici).sort();
  if (!dies.length) return null;
  return cursorDeClau(dies.find((dia) => dia >= hui) ?? dies[dies.length - 1]);
}
