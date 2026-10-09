import { BookOpen, Landmark, Receipt } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════
   APLICACIONS DEL PERFIL · configuració pura (sense React)

   Cada entrada és una utilitat que el Perfil mostra al grup APLICACIONS
   de la primera columna. Una utilitat nova s'endolla afegint-hi una
   entrada; una altra instància federada de Sóc de Poble pot passar la
   seua pròpia llista a PerfilShell (propietat `aplicacions`).

     · id          identificador estable: minúscules, xifres i guions
     · nom         el que es llig a la navegació i al títol de la pàgina
     · descripcio  una frase: què fa
     · icona       component de lucide-react (opcional)
     · estat       'pendent' (este node no té la secció) o 'connectada'
     · ruta        només amb 'connectada': la ruta interna de la secció
     · panell      l'id amb què el Panell de Control llig la preferència
                   «Mostrar al Panell» d'esta utilitat: el del registre de
                   plugins (sections/plugins/registrePlugins.js), el d'una
                   pàgina de la maquinària (PAGINES_MAQUINARIA de
                   control/destinsControl.js: la Consola i el Cervell, des
                   de l'Onada 8) o 'snippet'. Sense, el mateix id (opcional)

   Ordre del Mestre (261007, prompt 261007_1628, peça C) · El Perfil escrivia
   la preferència amb l'id de l'aplicació i el Panell l'amagava per l'id del
   registre: «Ocultar del Panell» de la Consola de Mètriques ('metriques') i
   del Lector RSS ('lector-rss') no feia res. La correspondència viu NOMÉS
   ací (`panell`): DetallEspai llig i escriu amb ella, i utilitatsActives.js
   tradueix les preferències desades abans amb l'id vell (ALIES_DEL_PANELL).
   L'id de l'aplicació no canvia: és el de la navegació del Perfil.

   Estes cinc utilitats encara no tenen una ruta connectada des del Perfil.
   Totes són 'pendent'; la seua fitxa permet triar si apareixen al Panell,
   sense prometre que el servei estiga disponible.
   ═══════════════════════════════════════════════════════════════════ */

export const ESTATS_APLICACIO = Object.freeze({
  pendent: 'Pendent de connectar en este node',
  connectada: 'Connectada en este node',
});

export const APLICACIONS = Object.freeze([
  Object.freeze({
    id: 'gestoria',
    nom: 'Gestoria de Poble',
    descripcio: 'Comptabilitat i facturació trimestral.',
    icona: Receipt,
    estat: 'pendent',
  }),
  Object.freeze({
    id: 'metriques',
    nom: 'Consola de Mètriques',
    descripcio: 'Monitorització i auditoria de la IA.',
    icona: Landmark, // TODO proper icon
    estat: 'pendent',
    panell: 'consola',
  }),
  Object.freeze({
    id: 'lector-rss',
    nom: 'Curation AI (Lector RSS)',
    descripcio: 'Agregador de notícies i resums intel·ligents.',
    icona: BookOpen,
    estat: 'pendent',
    panell: 'rss',
  }),
  Object.freeze({
    id: 'cervell',
    nom: 'Cervell (Node Graph)',
    descripcio: 'Mapa visual de relacions i categories.',
    icona: Landmark,
    estat: 'pendent',
  }),
  Object.freeze({
    id: 'snippet',
    nom: 'Snippet',
    descripcio: 'Extensió de Chrome per a desar webs al Bloc.',
    icona: BookOpen,
    estat: 'pendent',
  }),
]);

const ID_VALID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const esText = (valor) => typeof valor === 'string' && valor.trim() !== '';
const esRutaInterna = (ruta) => typeof ruta === 'string' && ruta.startsWith('/') && !ruta.startsWith('//');
const esComponent = (icona) => typeof icona === 'function' || (typeof icona === 'object' && icona !== null);

/**
 * La llista que el Perfil pot pintar sense prometre res: fora les entrades
 * sense id vàlid o sense nom i els ids repetits (guanya la primera). Una
 * utilitat 'connectada' sense ruta interna es pinta com a 'pendent'.
 * Peça C (261007) · `panell` sempre hi és: el declarat si és un id vàlid i,
 * si no, el mateix id. DetallEspai no ha de saber-ne la regla.
 */
export function aplicacionsValides(llista) {
  if (!Array.isArray(llista)) return [];
  const vistos = new Set();
  const valides = [];
  for (const entrada of llista) {
    if (!entrada || !ID_VALID.test(String(entrada.id ?? '')) || !esText(entrada.nom) || vistos.has(entrada.id)) continue;
    vistos.add(entrada.id);
    const connectada = entrada.estat === 'connectada' && esRutaInterna(entrada.ruta);
    valides.push(Object.freeze({
      id: entrada.id,
      nom: entrada.nom.trim(),
      descripcio: esText(entrada.descripcio) ? entrada.descripcio.trim() : '',
      icona: esComponent(entrada.icona) ? entrada.icona : null,
      estat: connectada ? 'connectada' : 'pendent',
      ruta: connectada ? entrada.ruta : null,
      panell: ID_VALID.test(String(entrada.panell ?? '')) ? entrada.panell : entrada.id,
    }));
  }
  return valides;
}

/**
 * Peça C (ordre del Mestre, 261007) · Les preferències desades abans amb l'id
 * de l'aplicació en lloc del del Panell: { 'metriques': 'consola',
 * 'lector-rss': 'rss' }. Ix de la mateixa taula (APLICACIONS), cap segona
 * font; utilitatsActives.js les respecta mentre l'id del Panell no en tinga
 * cap de pròpia.
 */
export const ALIES_DEL_PANELL = Object.freeze(Object.fromEntries(
  aplicacionsValides(APLICACIONS).filter((aplicacio) => aplicacio.panell !== aplicacio.id)
    .map((aplicacio) => [aplicacio.id, aplicacio.panell])
));
