/**
 * variacionsDeProducte.js — les variacions d'un producte del Mercat, una sola
 * regla per a la pàgina (/mercat/:id) i per al lector del MAS, que en criden
 * el mateix renderBody (detail/detailSectionMeta.jsx).
 *
 * Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 1) · «Unifica el
 * producte en un únic node canònic […] selector compacte de variants en
 * píndoles […] amb un sol botó «Afegeix al cabàs» i estat d'estoc
 * («Esgotat»).» Auditoria Codex 2030 (§3.2 i §4.1) · La selecció va per un id
 * ESTABLE, mai per la posició ni pel nom: reordenar o reanomenar les
 * variacions no canvia quina està triada. L'id és el que conserva el
 * mapejador d'escriptura (data/mapejadorSeccions.js · idDeVariacio), i la
 * mateixa regla val ací per a les files que no hi passen (app_content).
 * L'estoc no s'inventa: «Esgotat» és el stock_status declarat.
 * Mòdul pur: cap React, cap global.
 */
import { idDeVariacio } from '../../data/mapejadorSeccions.js';

const text = (valor) => {
  if (typeof valor === 'number' && Number.isFinite(valor)) return String(valor);
  return typeof valor === 'string' ? valor.trim() : '';
};

/* El stock_status és text lliure de qui ven (marketSeed.js porta
   'Esgotat'): es reconeix sense majúscules, accents ni guions baixos, en les
   llengües de l'app. Qualsevol altre valor no és «esgotat» (no se n'inventa
   cap estat). */
const normalitza = (valor) => text(valor).toLowerCase().normalize('NFD')
  .replace(/[̀-ͯ]/g, '').replace(/[\s_]+/g, ' ');
const ESTATS_ESGOTAT = new Set([
  'esgotat', 'esgotada', 'esgotats', 'esgotades', 'agotado', 'agotada', 'out of stock', 'sold out'
]);

/** Cert si la variació declara que està esgotada (stock_status). */
export function esVariacioEsgotada(variacio) {
  return ESTATS_ESGOTAT.has(normalitza(variacio?.stock_status));
}

/* Una clau de llegat porta dos punts: mai coincidix amb un id net (només
   minúscules, xifres i guions). */
const PREFIX_DE_LLEGAT = 'llegat:';

/**
 * Les variacions que es poden triar, en l'ordre de les dades:
 * [{ clau, id, nom, preu, descripcio, esgotada, variacio }].
 *  · id: l'estable (idDeVariacio), o null si no en porta cap de net o si ja
 *    l'ha pres una altra variació del mateix producte (de llegat).
 *  · clau: la de la selecció a la pantalla. L'id, si en porta; si no, una
 *    clau de llegat de la seua posició ('llegat:N'), que només viu a la
 *    memòria del selector: mai s'escriu ni arriba a cap acció (l'acció rep
 *    `id`, null en el llegat). Les files de supabase/seed.sql anteriors a
 *    l'id són d'esta mena fins que es torne a generar.
 *  · variacio: l'objecte de les dades, per a la foto (detailSectionMeta.jsx
 *    hi aplica el mode estricte de les imatges del detall).
 *  · Una cadena és una variació de llegat amb només el nom; el que no és
 *    text ni objecte no és una variació (la regla del mapejador).
 */
export function variacionsDelProducte(item) {
  const crues = Array.isArray(item?.variations) ? item.variations : [];
  const ids = new Set();
  const eixida = [];
  crues.forEach((crua, posicio) => {
    const variacio = typeof crua === 'string' ? { name: crua } : crua;
    if (!variacio || typeof variacio !== 'object' || Array.isArray(variacio)) return;
    const net = idDeVariacio(variacio.id);
    const id = net && !ids.has(net) ? net : null;
    if (id) ids.add(id);
    eixida.push({
      clau: id || `${PREFIX_DE_LLEGAT}${posicio}`,
      id,
      nom: text(variacio.name),
      preu: text(variacio.price),
      descripcio: text(variacio.description),
      esgotada: esVariacioEsgotada(variacio),
      variacio
    });
  });
  return eixida;
}

/** La clau que es tria d'entrada: la primera variació que no està esgotada; si totes ho estan, la primera. */
export function clauInicial(variacions) {
  if (!Array.isArray(variacions) || variacions.length === 0) return null;
  return (variacions.find((v) => !v.esgotada) || variacions[0]).clau;
}

/** La variació activa: la de la clau triada, si encara hi és; si no, la inicial (o null sense variacions). */
export function variacioActiva(variacions, clau) {
  if (!Array.isArray(variacions) || variacions.length === 0) return null;
  const inicial = clauInicial(variacions);
  return variacions.find((v) => v.clau === clau) || variacions.find((v) => v.clau === inicial) || null;
}
