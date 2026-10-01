import { sanejaEtiqueta } from '../../config/configAmfitrio.js';

/* ═══════════════════════════════════════════════════════════════════
   NODES DEL PERFIL · configuració pura (sense React)

   T9 (ordre del Mestre, 261001) · «Els nodes» diu on és la persona:
     · amb nomPoble (l'App viu dins de la web d'un amfitrió): eixe node,
       l'actiu, i Sóc de Poble, que guarda les dades;
     · sense nomPoble (socdepoble.org): només Sóc de Poble, actiu.
   «Actiu» vol dir el node on estàs ara, no el servidor de dades. Una
   instància federada pot passar nodes de més (PerfilShell, propietat
   `nodes`): es validen com les aplicacions i mai es declaren actius, perquè
   una dada de configuració no pot dir on estàs. Cap hostname del backend.
   ═══════════════════════════════════════════════════════════════════ */

export const NODE_PRINCIPAL = Object.freeze({
  id: 'soc-de-poble',
  nom: 'Sóc de Poble',
  descripcio: 'El node principal: guarda les dades dels pobles connectats.',
});

const ID_AMFITRIO = 'amfitrio';
const DESCRIPCIO_AMFITRIO = 'La web on estàs ara. Allotja l’App; les dades les guarda Sóc de Poble.';

const ID_VALID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const esText = (valor) => typeof valor === 'string' && valor.trim() !== '';

/** Els nodes de més que una instància declara: vàlids, sense repetits i mai actius. */
function nodesDeMes(llista, vistos) {
  if (!Array.isArray(llista)) return [];
  const valids = [];
  for (const entrada of llista) {
    const id = String(entrada?.id ?? '');
    const nom = sanejaEtiqueta(entrada?.nom);
    if (!ID_VALID.test(id) || !nom || vistos.has(id)) continue;
    vistos.add(id);
    valids.push(Object.freeze({
      id,
      nom,
      descripcio: esText(entrada.descripcio) ? entrada.descripcio.trim() : '',
      actiu: false,
    }));
  }
  return valids;
}

/** La llista que pinta LlistaNodes, en l'ordre en què es llig. */
export function nodesDelPerfil({ nomPoble, extra = [] } = {}) {
  const nom = sanejaEtiqueta(nomPoble);
  const base = nom
    ? [
      Object.freeze({ id: ID_AMFITRIO, nom, descripcio: DESCRIPCIO_AMFITRIO, actiu: true }),
      Object.freeze({ ...NODE_PRINCIPAL, actiu: false }),
    ]
    : [Object.freeze({ ...NODE_PRINCIPAL, actiu: true })];
  /* Els dos ids propis queden reservats encara que no es pinten: un node de
     més no es pot fer passar per l'amfitrió ni pel principal. */
  const vistos = new Set([ID_AMFITRIO, NODE_PRINCIPAL.id]);
  return [...base, ...nodesDeMes(extra, vistos)];
}
