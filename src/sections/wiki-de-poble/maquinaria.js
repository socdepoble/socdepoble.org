/**
 * maquinaria.js · Gauntlet 261016 (Bloc 3.4; ordre del Mestre: «retirar
 * definitivament la maquinària interna de desenvolupament de l'aside en
 * pantalles d'usuari») · Qui veu la carpeta «Maquinària de la IAIA» de la
 * Wiki de Poble, amb la Consola Termodinàmica incrustada i, en
 * desenvolupament, les eines locals.
 *
 * La Wiki és pública (/wikidepoble no porta RequireAuth) i la Consola, per la
 * seua ruta, només s'obri a qui és superadmin fora de desenvolupament
 * (guardaConsola.js). La carpeta segueix el mateix criteri: en
 * desenvolupament sempre (on les eines locals ja hi viuen) i, en qualsevol
 * build, només per a qui és superadmin.
 *
 * Pur i sense dependències: el llig la Wiki i la pantalla «Assignar» d'Emojis
 * XL (AssignacioEmoji.jsx), que no pot importar WikiDePobleSection en estàtic.
 * Rep els valors en lloc de llegir import.meta.env o la sessió, com
 * consolaDemanaSessio: així les dues branques es proven (a vitest DEV sempre
 * és true). Només un true literal obri; qualsevol altra cosa tanca.
 *
 * @param {{ DEV?: unknown, esSuperadmin?: unknown }} [entorn]
 * @returns {boolean}
 */
export function maquinariaALaVista(entorn) {
  return entorn?.DEV === true || entorn?.esSuperadmin === true;
}

/**
 * Revisió adversarial del carril D (261016, problema 2) · Si la Wiki ha
 * d'esperar el rol abans de donar-se per llesta. La sessió arrenca en
 * 'comprovant' i el rol arriba de manera asíncrona (sessionService.js ·
 * elMeuRol). Si en eixe interval la Wiki es donava per llesta, el workspace no
 * trobava l'ítem de la Maquinària, el donava per absent, queia a la portada i
 * reescrivia la URL: un superadmin que obria en fred l'enllaç de la Consola el
 * perdia per sempre. Només s'espera quan les tres coses són certes: la
 * Maquinària encara no és a la vista, el rol és pendent (cap rol resolt del
 * mateix compte per heretar: hooks/useSuperadminEstable.js) i la URL la demana.
 * Qualsevol altra URL, i qualsevol altre estat de la sessió, no esperen res.
 *
 * @param {{ aLaVista?: unknown, rolPendent?: unknown, demana?: unknown }} [cas]
 * @returns {boolean}
 */
export function esperaElRol(cas) {
  return cas?.aLaVista !== true && cas?.rolPendent === true && cas?.demana === true;
}
