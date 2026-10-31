/**
 * maquinaria.js · Gauntlet 261016 (Bloc 3.4; ordre del Mestre: «retirar
 * definitivament la maquinària interna de desenvolupament de l'aside en
 * pantalles d'usuari») · Qui veu la carpeta «Maquinària de la IAIA» de la
 * Wiki de Poble, amb la Consola Termodinàmica incrustada i, en
 * desenvolupament, les eines locals.
 *
 * La Wiki és pública (/wikidepoble no porta RequireAuth) i la Consola, per la
 * seua ruta, només s'obri a qui és superadmin fora de desenvolupament
 * (guardaConsola.js, retirada el 31-10-2026). La carpeta segueix el mateix criteri: en
 * desenvolupament sempre (on les eines locals ja hi viuen) i, en qualsevol
 * build, només per a qui és superadmin.
 *
 * Pur i sense dependències: el llig la Wiki i la pantalla «Assignar» d'Emojis
 * XL (AssignacioEmoji.jsx), que no pot importar WikiDePobleSection en estàtic.
 * Rep els valors en lloc de llegir import.meta.env o la sessió, com feia
 * consolaDemanaSessio: així les dues branques es proven (a vitest DEV sempre
 * és true). Només un true literal obri; qualsevol altra cosa tanca.
 *
 * Pla 261027_0845 (Guarda Nocturna), §3 · Transparència radical: a la Wiki,
 * fora de desenvolupament, la carpeta ix també per a tothom amb la
 * documentació pública de Tractors, Sentinelles i el BIOS
 * (WikiDePobleSection · documentacioMaquinariaActiva). Esta funció continua
 * decidint el que no és públic: la Consola incrustada i, en desenvolupament,
 * les eines amb botons. La pantalla «Assignar» encara la llig per a la
 * carpeta sencera.
 *
 * Ordre del Mestre (30-10-2026, prompt 2208, T2.2) · «dejar público lo máximo
 * posible… incluso hasta los datos de la Consola»: la Consola incrustada és a
 * la vista de tothom, en qualsevol entorn i sense sessió, com la ruta /consola
 * (App.jsx, sense RequireAuth ni guarda). Les eines amb botons d'escriptura local no depenen
 * d'esta funció i continuen només de desenvolupament: modulsLocalsActius i
 * EINES_LOCALS (WikiDePobleSection.jsx) i carregaEinesLocals
 * (AssignacioEmoji.jsx) només les donen amb DEV === true. Derogat: «la
 * Consola, només en desenvolupament o per a qui és superadmin» i «només un
 * true literal obri». Els qui la criden encara li passen DEV i esSuperadmin;
 * no els mira.
 * Decisió del Mestre (31-10-2026) · Fora de DEV, la Consola incrustada llig
 * la instantània sanejada que publica el build web a /__iaia/*.json (GET al
 * mateix origen, sense credencials: useFontDev i fontsConsola.js); un paquet
 * sense instantània (WordPress, l'app) no hi demana res. Derogat: «Fora de
 * DEV, la Consola no demana res a /__iaia/*».
 *
 * @returns {boolean} sempre true
 */
export function maquinariaALaVista() {
  return true;
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
