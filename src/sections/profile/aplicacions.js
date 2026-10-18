import { BookOpen, Coffee, HeartHandshake, Landmark, Receipt, ShoppingCart } from 'lucide-react';

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
                   plugins (sections/plugins/registrePlugins.js) o
                   'snippet'. Sense, el mateix id (opcional). Un `null`
                   EXPLÍCIT vol dir que la utilitat no té targeta al Panell:
                   la seua fitxa no oferix cap preferència (Onada 10)
     · intern      true: maquinària interna de desenvolupament; el Perfil
                   només la mostra a qui és superadmin (opcional; sense,
                   la veu tothom)

   Ordre del Mestre (261007, prompt 261007_1628, peça C) · El Perfil escrivia
   la preferència amb l'id de l'aplicació i el Panell l'amagava per l'id del
   registre: «Ocultar del Panell» de la Consola de Mètriques ('metriques') i
   del Lector RSS ('lector-rss') no feia res. La correspondència viu NOMÉS
   ací (`panell`): DetallEspai llig i escriu amb ella, i utilitatsActives.js
   tradueix les preferències desades abans amb l'id vell (ALIES_DEL_PANELL).
   L'id de l'aplicació no canvia: és el de la navegació del Perfil.

   Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010) · Les
   targetes «Consola Termodinàmica» i «El Cervell» ixen del Panell de Control
   i viuen només al Mur. La «Consola de Mètriques» i el «Cervell (Node
   Graph)» es queden a la navegació del Perfil, però amb `panell: null`: ja
   no hi ha cap targeta que mostrar ni que ocultar, i un botó que no fa res
   està vetat (DetallEspai.jsx; és la mateixa falla que va arreglar la peça
   C). DEROGAT, per a estes dues: `panell: 'consola'` per a les Mètriques
   (peça C) i l'id 'cervell' com a clau del Panell (Onada 8, quan les pintava
   «Maquinària i Sistema»). Les preferències que algú ja tinga desades amb
   'consola', 'cervell', 'disseny' o 'metriques' es queden al storage, sense
   efecte: no s'esborra res.

   Gauntlet 261016 (Bloc 3.4; ordre del Mestre: «retirar definitivament la
   maquinària interna de desenvolupament de l'aside en pantalles d'usuari») ·
   La Consola de Mètriques («Monitorització i auditoria de la IA») i el
   Cervell (el mateix codi l'anomena «maquinària interna del Mas») porten
   `intern: true`: l'aside APLICACIONS del Perfil només les mostra a qui és
   superadmin (PerfilShell.jsx), com la ruta /consola en producció. No
   s'esborra cap preferència desada.

   Encàrrec d'harmonització (261018, ordre del Mestre) · El catàleg és el
   complet del Panell de Control, en este ordre: Gestoria de Poble, Rebost
   Domèstic, Salut, Lector RSS (abans «Curation AI (Lector RSS)»: un nom llarg
   que es tallava a la columna), TPV del Bar i Snippet. La Consola de Mètriques
   i el Cervell, internes, van darrere i només per a superadmin.

   Cap encara no té una ruta connectada des del Perfil: totes són 'pendent'.
   La fitxa de les que tenen targeta al Panell permet triar si hi apareixen,
   sense prometre que el servei estiga disponible; la de les dues internes
   només en diu l'estat.
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
    panell: 'gestoria',
  }),
  Object.freeze({
    id: 'rebost',
    nom: 'Rebost Domèstic',
    descripcio: 'La nevera i el rebost de casa.',
    icona: ShoppingCart,
    estat: 'pendent',
    panell: 'rebost',
  }),
  Object.freeze({
    id: 'salut',
    nom: 'Salut',
    descripcio: 'Un quadern per a cuidar dels nostres.',
    icona: HeartHandshake,
    estat: 'pendent',
    panell: 'salut',
  }),
  Object.freeze({
    id: 'lector-rss',
    nom: 'Lector RSS',
    descripcio: 'Les notícies de les entitats del poble, juntes.',
    icona: BookOpen,
    estat: 'pendent',
    panell: 'rss',
  }),
  Object.freeze({
    id: 'tpv',
    nom: 'TPV del Bar',
    descripcio: 'La caixa del bar o del casino.',
    icona: Coffee,
    estat: 'pendent',
    panell: 'tpv',
  }),
  Object.freeze({
    id: 'snippet',
    nom: 'Snippet',
    descripcio: 'Extensió de Chrome per a desar webs al Bloc.',
    icona: BookOpen,
    estat: 'pendent',
  }),
  Object.freeze({
    id: 'metriques',
    nom: 'Consola de Mètriques',
    descripcio: 'Monitorització i auditoria de la IA.',
    icona: Landmark, // TODO proper icon
    estat: 'pendent',
    /* Onada 10 (261010) · Sense targeta al Panell: cap preferència. Abans, 'consola'. */
    panell: null,
    /* Gauntlet 261016 (Bloc 3.4) · Maquinària interna: només superadmin. */
    intern: true,
  }),
  Object.freeze({
    id: 'cervell',
    nom: 'Cervell (Node Graph)',
    descripcio: 'Mapa visual de relacions i categories.',
    icona: Landmark,
    estat: 'pendent',
    /* Onada 10 (261010) · Sense targeta al Panell: cap preferència. Abans, el seu id. */
    panell: null,
    /* Gauntlet 261016 (Bloc 3.4) · Maquinària interna: només superadmin. */
    intern: true,
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
 * Onada 10 (261010; decisió del Mestre del 261010) · Un `null` EXPLÍCIT es
 * conserva: la utilitat no té targeta al Panell. Només el null: sense el
 * camp, o amb qualsevol altre valor que no siga un id vàlid (undefined, '',
 * majúscules), continua caient al mateix id, així una llista federada que
 * no el declara es comporta com abans.
 * Gauntlet 261016 (Bloc 3.4) · `intern` només s'hi posa quan és true: una
 * entrada sense la marca no porta cap clau nova (el mateix objecte de sempre).
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
      panell: entrada.panell === null || ID_VALID.test(String(entrada.panell ?? '')) ? entrada.panell : entrada.id,
      ...(entrada.intern === true ? { intern: true } : null),
    }));
  }
  return valides;
}

/**
 * Peça C (ordre del Mestre, 261007) · Les preferències desades abans amb l'id
 * de l'aplicació en lloc del del Panell: { 'lector-rss': 'rss' }. Ix de la
 * mateixa taula (APLICACIONS), cap segona font; utilitatsActives.js les
 * respecta mentre l'id del Panell no en tinga cap de pròpia.
 * Onada 10 (261010; decisió del Mestre del 261010) · DEROGAT l'àlies
 * 'metriques' → 'consola': la Consola ja no té targeta al Panell. Una
 * utilitat amb `panell: null` no fa cap àlies; sense este filtre, la
 * preferència vella es copiaria a una clau «null» del storage.
 */
export const ALIES_DEL_PANELL = Object.freeze(Object.fromEntries(
  aplicacionsValides(APLICACIONS).filter((aplicacio) => aplicacio.panell !== null && aplicacio.panell !== aplicacio.id)
    .map((aplicacio) => [aplicacio.id, aplicacio.panell])
));
