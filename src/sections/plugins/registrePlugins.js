/**
 * registrePlugins.js — P7-A · Onada 4, setena passada (ordre del Mestre,
 * 261004; prompt 261004_0015 T2/T3 i directriu 261003_2320) · Les utilitats
 * (plugins) del Panell de Control en UNA sola taula: la font de veritat de la
 * seua pàgina (/plugin/<id>, PluginPage.jsx) i de la graella del Control
 * (bloc B, que només la llig). Peça C (ordre del Mestre, 261007, prompt
 * 261007_1628) · Eren dotze: les onze de l'ordre del 261004 i el Panell de
 * Disseny ('disseny'), que MarIA hi va afegir després.
 * Ordre del Mestre (261007) · Bàscula descartada: «LA BÀSCULA: Queda
 * descartada per ara. No té sentit en aquest moment. Llévala de la interfície
 * actual i descarta la seua implementació. Limita't a anotar-la
 * exclusivament a la fulla de ruta (roadmap) per al futur.» Ara són onze, i
 * la Bàscula de Cooperativa és una llavor del Full de ruta (PAGE_COPY.roadmap
 * i 02_saber/00_full_de_ruta.md). La seua il·lustració,
 * public/assets/ui/plugins/bascula_vinyeta.jpg, es conserva al disc: cap
 * esborrat. /plugin/bascula ja és la 404 de sempre.
 * Onada 8 (261009; requeriments 261009_1300, punt 2: «Consola Termodinàmica»,
 * «El Cervell» i «Panell de Disseny» «són pàgines, no plugins») · Ixen del
 * registre, com la Bàscula: ara en són huit, i /plugin/consola,
 * /plugin/cervell i /plugin/disseny són la 404 de sempre. Són pàgines del
 * sistema (SYSTEM_PAGES de config/systemPages.js i PAGE_COPY): la Consola i
 * el Cervell, a /page/consola i /page/cervell amb el seu botó «Obrir…» cap a
 * /consola i /consola/explorador; Disseny, a /disseny, amb el títol i la
 * imatge de PAGE_COPY. El Panell les pintava a «Maquinària i Sistema» amb la
 * targeta del Mur; DEROGAT per l'Onada 10 (261010; pla 261010_1121; decisió
 * del Mestre del 261010): les tres targetes ixen del Panell de Control i
 * viuen només al Mur (ho aplica el front del Panell, ControlSection.jsx). Les
 * il·lustracions es conserven al disc: consola_vinyeta i
 * cervell_vinyeta són ara la imatge de la seua pàgina, i disseny_vinyeta la
 * fa servir l'espècimen del Panell del catàleg (EspecimenPanell.jsx).
 *
 * Cada plugin: { id, titol, subtitol, entradilla, imatge, imatgeAlt, obrir,
 * entorn, espai, etiquetaObrir, data, etiquetes }.
 *   · espai  · Onada 2 de la Gestoria (261004) · l'espai del Panell on viu
 *     la targeta, «L'empresa» o «La llar» (ESPAIS_PLUGINS), o null.
 *   · data i etiquetes · Onada 10 (261010; pla 261010_1121; decisió del
 *     Mestre del 261010, M4: «totes les targetes de plugin del Panell passen
 *     a targeta canònica») · El que li faltava a la targeta de plugin per a
 *     ser la canònica: la franja taronja amb data i hora, i les etiquetes
 *     Categoria i Etiqueta (skill sdp-universal-page, §4).
 *       data      · una cadena ISO amb desplaçament, com les de PAGE_COPY
 *                   («2026-10-04T00:15:00+02:00»), o null. La lligen la
 *                   targeta del Panell i la barra taronja de la pàgina
 *                   (PluginPage.jsx), totes dues amb dataHoraDeBarra: targeta
 *                   i pàgina diuen el mateix (ordre del Mestre, 261001). El
 *                   criteri i l'evidència, a DATA_DE_L_ORDRE, més avall.
 *       etiquetes · una llista congelada d'objectes congelats { text,
 *                   className }; buida si el plugin no en porta. Sense
 *                   `href` (D3 del Panell: cap enllaç que no siga el perfil,
 *                   els drets o /plugin/<id>) i sense cap xifra.
 *     Les porten els cinc que tenen targeta de plugin al Panell: gestoria,
 *     rebost, salut, rss i tpv. Mapa, Vehicle Compartit i Animalets NO: la
 *     seua targeta del Panell és la de dalt, la de publicació (W4-08), que
 *     llig la data de PAGE_COPY; ací es queden amb null i la llista buida, i
 *     la seua pàgina no canvia ni un píxel.
 *     DEROGADES EN PART per l'ordre del Mestre del 261010 (M4), només per a
 *     estes targetes: la regla R1 dels espais («targetes estàtiques: cap
 *     xifra ni data»), la D6 de l'Onada 8 («cap data per a les eines») i la
 *     P6 («cap etiqueta al Panell»). L'ordre nova: la targeta de plugin porta
 *     la data FIXA del registre i les dues etiquetes. La data del registre no
 *     és una dada de la persona: no ix de cap apunt, de cap comptador ni de
 *     cap eina, i és la mateixa per a tothom i a qualsevol amfitrió. La resta
 *     de R1 continua sencera: cap xifra, comptador, data d'un apunt ni avís
 *     que isca de les dades.
 *   · El text llarg de la pàgina (els sis paràgrafs del Rebost i de Salut,
 *     M4) NO viu ací: és a presentacioPlugins.js, perquè este registre viatja
 *     amb el Panell i eixe text només ha de viatjar amb la pàgina.
 *   · imatge · la il·lustració de MarIA, /assets/ui/plugins/<id>_vinyeta.jpg
 *     (public/). És la portada (Hero) de la pàgina i la imatge de la targeta.
 *     Gauntlet 261016 (Bloc 1, Llei del Quadrat) · La del TPV del Bar és
 *     tpv_vinyeta.webp (extensioImatge); la resta, .jpg com sempre.
 *     Ordre del Mestre (261021, torn fase 2, Mòdul B, P0-14) · Les del Mapa,
 *     Vehicle Compartit, Animalets, el Rebost i Salut ja només viuen com a
 *     WebP (la bessona, amb les mateixes mides; l'original .jpg ix de
 *     public/): també porten extensioImatge 'webp'. La Gestoria i l'RSS
 *     continuen en .jpg.
 *   · obrir  · la ruta de l'app o de la secció QUE JA EXISTIX, o null («en
 *     obres»). Cap ruta inventada: registrePlugins.test.js comprova que cada
 *     una la servix App de veres. Una ruta /app/<id>/… és d'una app de la
 *     plataforma: en temps d'execució passa pels interruptors (build, entorn,
 *     amfitrió, persona) a useDestiDelPlugin.js, i si l'app no es pot obrir
 *     ací el botó és inert (cap enllaç mort).
 *   · Els textos són ESBORRANYS per al Mestre (nota de laboratori
 *     PLUGINS_P7.txt): curts, la paraula clau primer i sense prometre res que
 *     no existisca.
 *
 * Evidència de cada «obrir» (fitxer:línia, 261004):
 *   rebost  → /app/nevera/casa · apps/nevera/manifest.js:15 (id 'nevera') i
 *             :22 (entrada 'casa'); vistes/Casa.jsx:2 «A CASA (la nevera i el
 *             rebost)». El rebost domèstic és eixa entrada.
 *   salut   → /app/salut · apps/salut/manifest.js:22. RutaApps la canonitza a
 *             l'entrada per defecte ('diari', :43).
 *   consola, cervell i disseny · Onada 8 (261009) · ja no són del registre
 *             (vegeu més amunt). Les seues rutes viuen a SYSTEM_PAGES.
 *   rss     → /app/lector · apps/lector/manifest.js:17 (Notícies del Poble).
 *             Peça C (261007) · El manifest del Lector porta entorn
 *             'desenvolupament' (:29): fora de DEV la plataforma l'apaga
 *             encara que el build el compile (VITE_SDP_APP_LECTOR=1), i sense
 *             el literal no és al paquet ('no-compilada'). Este plugin no
 *             porta `entorn`: el decidix l'app.
 *   tpv     → /app/bar · apps/bar/manifest.js:16 (El Bar, TPV d'hostaleria).
 *   gestoria → /app/gestoria · apps/gestoria/manifest.js (id 'gestoria',
 *             entrades 'tauler' i 'aprendre'). Ordre del Mestre, 261004
 *             («contaminació crítica de rutes/estats entre Gestoria i Wiki»):
 *             la Gestoria ja no viu dins de la Wiki (la decisió D3 deixava
 *             «/app/gestoria, més avant; /gestoria, mai»). L'app porta entorn
 *             'desenvolupament' i el plugin també: fora de DEV,
 *             useDestiDelPlugin deixa el botó inert («(no disponible ací)»)
 *             i la pàgina diu que està en obres. Cap consulta ni dada a la
 *             ruta (MAPA §2.2, R4).
 *   mapa, vehicle, animalets → null. Mapa, Vehicle Compartit i Animalets no
 *     tenen secció (control/destinsControl.js:29-31).
 *
 * Pur: sense React ni xarxa. Les rutes d'app es fan amb rutaDeApp (la mateixa
 * de la plataforma), que ja és al paquet principal (PlataformaContext).
 * Onada 8 (261009) · La ruta literal de la Consola se n'ha anat amb el seu
 * plugin: ara és a SYSTEM_PAGES, i systemPages.test.js la confronta amb
 * RUTA_CONSOLA.
 */
import { analitzaRuta } from '../../apps/plataforma/registreApps.js';
import { rutaDeApp } from '../../apps/plataforma/manifestApp.js';

/** On viuen les il·lustracions (public/). */
export const IMATGES_PLUGINS = '/assets/ui/plugins';
/** El prefix de la ruta de les pàgines: /plugin/<id>. */
export const RUTA_PLUGINS = '/plugin';

/* entorn · 'desenvolupament' si el destí només funciona al servidor local de
   desenvolupament (com el camp `entorn` dels manifests d'app); null si no.
   Fora de dev, useDestiDelPlugin deixa el botó inert: cap enllaç que porte
   a «Entrar» o a una eina sense dades. Hui només el porta la Gestoria: la
   Consola i el Cervell, que el portaven per /__iaia/* (només el servix `vite
   serve`, tooling/vite/consola-iaia.mjs), ja no són del registre (Onada 8).
   espai · l'espai del Panell de Control on viu la targeta ('empresa' o
   'llar', ESPAIS_PLUGINS), o null si va a les graelles d'Utilitats o de
   Maquinària. Un sol valor per plugin: cap targeta pot viure en dos espais.
   data i etiquetes · Onada 10 (261010; pla 261010_1121; decisió del Mestre
   del 261010, M4) · opcionals: sense, null i una llista buida (el plugin es
   pinta com sempre). La llista i cada etiqueta ixen congelades, i de cada
   etiqueta només passen `text` i `className`: cap `href` ni cap gestor pot
   entrar al registre per ací.
   extensioImatge · Gauntlet 261016 (Bloc 1, Llei del Quadrat) · opcional:
   l'extensió de la il·lustració, 'jpg' si no ve (la imatge de sempre). Només
   decidix la ruta de `imatge`: no és cap camp nou del plugin. */
const plugin = ({
  id, titol, subtitol, entradilla, imatgeAlt, obrir = null, entorn = null, espai = null, etiquetaObrir,
  data = null, etiquetes = [], extensioImatge = 'jpg'
}) => Object.freeze({
  id,
  titol,
  subtitol,
  entradilla,
  imatge: `${IMATGES_PLUGINS}/${id}_vinyeta.${extensioImatge}`,
  imatgeAlt,
  obrir,
  entorn,
  espai,
  etiquetaObrir,
  data,
  etiquetes: Object.freeze(etiquetes.map(({ text, className }) => Object.freeze({ text, className })))
});

/* Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010, M4) ·
   LA DATA de la targeta canònica dels plugins. Cap data inventada (regla T51
   del Mestre, editorial.js; D6 de l'Onada 8).
   Criteri: el de les targetes de dalt del Panell, «l'hora del document de
   l'ordre» (pageContent.js: les sis pàgines de publicació porten les 22:45
   del document 261003_2245, i Treball i Habitatge, la 01:10 del 261004;
   destinsControl.test.js les fixa). Ací, l'hora del prompt 261004_0015, que
   ordena la llista (T2) i la pàgina (T3) dels plugins.
   Evidència: la capçalera d'este fitxer i la de PluginPage.jsx («ordre del
   Mestre, 261004; prompt 261004_0015 T2/T3») i .agents/ESTAT.md, relleus de
   Codex del 2026-10-04: a les 00:27, «Passada 6 rebuda: pla0014/prompt0015»,
   i a les 01:04, «Onze pàgines disponibles a font».
   Val per als cinc: la Gestoria, el Lector RSS i el TPV del Bar són de les
   «onze de l'ordre del 261004», com el Rebost i Salut (amb la Consola, el
   Cervell i la Bàscula, que ja no hi són; el Panell de Disseny, el dotzé, va
   vindre després). Cap dels cinc té una data pròpia documentada: els
   manifests de les apps on porten (gestoria, nevera, salut, lector i bar) no
   en tenen cap, i les ordres que hi citen (261004, 261006 i 261009) són de
   funcions de l'app, no del naixement del plugin (la del mateix 261004 per a
   la Gestoria només li canvia el destí, de la Wiki a la seua app).
   Alternativa, si el Mestre preferix la doctrina de git de pageContent.js:
   les 05:13:54 del mateix dia, HEAD:237 f23dcf2b (1791083634 +0200), el
   primer commit posterior, «feat(onada4): commit consolidat de tots els
   canvis d'Onada 4». No s'ha triat perquè cap font lliga este fitxer a eixe
   commit (coincidir en el dia no és evidència).
   Pendent del Mestre: confirmar-la o canviar-la per la del commit. */
const DATA_DE_L_ORDRE = '2026-10-04T00:15:00+02:00';

/* Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010, M4) ·
   LES ETIQUETES de la targeta canònica: una Categoria (sdp-badge-category) i
   una Etiqueta (sdp-badge-tag), en eixe ordre, que és el de la skill
   sdp-universal-page (§4). Sense Carpeta: el Panell ja diu on és cada
   targeta, i una píndola no duplica el context.
   Els valors són un ESBORRANY per al Mestre: l'ordre activa els camps i no
   en dicta els textos. Categoria «Eina» per a tots (no repetix el títol de
   cap espai del Panell) i una Etiqueta que diu de què va cada una. */
const classificacio = (etiqueta, categoria = 'Eina') => [
  { text: categoria, className: 'sdp-badge-category' },
  { text: etiqueta, className: 'sdp-badge-tag' }
];

/* Onada 2 de la Gestoria (MAPA_EMPRESA_GESTORIA.txt §2.2; decisió A11 del
   Mestre, 261004: només les targetes que ja funcionen) · Els dos espais nous
   del Panell de Control, en l'ordre del Panell: entre «Publica al poble» i
   les Utilitats. Mateix panell, dos espais separats i cap targeta compartida
   (R3: la llar mai es barreja amb l'empresa). Per W4-08, el que viu en un
   espai ix de les graelles d'Utilitats i de Maquinària.
   Targetes ESTÀTIQUES (R1): cap xifra, comptador, data d'un apunt ni avís que
   isca de les dades. El Panell també es munta dins de l'amfitrió
   (WordPress): les xifres només viuen dins de cada eina, mai ací.
   Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010, M4) ·
   R1 queda derogada en part: la targeta porta la data FIXA del registre
   (DATA_DE_L_ORDRE), que no ix de les dades de ningú. Cap altra xifra.
   Onada 11 (261010; prompt 261010_1730, tasca 6, D6) · Les entradetes diuen
   que el Panell no mostra cap xifra ni cap dada «teua»: la data fixa de la
   targeta no és de ningú, i el text ja no està en tensió amb ella. */
export const ESPAIS_PLUGINS = Object.freeze([
  Object.freeze({
    id: 'empresa',
    titol: 'L’empresa',
    entradeta: 'Les eines de l’activitat: el que es declara o es justifica davant d’Hisenda i de la gestoria. El Panell no mostra cap xifra de les teues dades; les dades només es veuen dins de cada eina.'
  }),
  Object.freeze({
    id: 'llar',
    titol: 'La llar',
    entradeta: 'Les eines de casa: el rebost, la compra i el quadern de salut. Viuen separades de les de l’empresa, i el Panell no mostra cap dada teua.'
  })
]);

/* L'ordre és el del Mestre (prompt 261004_0015, T2): el de la graella, el del
   DOM i el del focus. */
export const PLUGINS = Object.freeze([
  plugin({
    id: 'mapa',
    titol: 'Mapa',
    subtitol: 'Els llocs del poble, damunt del mapa',
    entradilla: 'Eina en obres: encara no es pot marcar cap lloc. Un punt publicat al mapa serà públic i el podrà localitzar qualsevol, també des d’altres pobles.',
    imatgeAlt: 'Veïns i veïnes claven una agulla de mapa roja i gegant enmig dels tarongers',
    etiquetaObrir: 'Obrir el Mapa',
    /* Mòdul B (261021) · L'original .jpg ix de public/: la vinyeta és la WebP. */
    extensioImatge: 'webp'
  }),
  plugin({
    id: 'vehicle',
    titol: 'Vehicle Compartit',
    subtitol: 'Seients buits per a pujar i baixar del poble',
    entradilla: 'Eina en obres: encara no es pot publicar cap trajecte. Un trajecte publicat diu a tothom el teu horari i el teu camí; les despeses les acordeu entre vosaltres, fora de l’app.',
    imatgeAlt: 'Una furgoneta plena de veïns, caixes de tomaques i un acordió baixa pel camí del poble',
    etiquetaObrir: 'Obrir Vehicle Compartit',
    /* Mòdul B (261021) · L'original .jpg ix de public/: la vinyeta és la WebP. */
    extensioImatge: 'webp'
  }),
  plugin({
    id: 'animalets',
    titol: 'Animalets',
    subtitol: 'Animals perduts, trobats i en adopció',
    entradilla: 'Eina en obres: encara no es pot publicar cap avís. El telèfon o el contacte que poses en un avís el veurà tothom.',
    imatgeAlt: 'Una iaia baixa un gatet d’una olivera amb l’ajuda d’un veí, entre gossos, gallines i un ase',
    etiquetaObrir: 'Obrir Animalets',
    /* Mòdul B (261021) · L'original .jpg ix de public/: la vinyeta és la WebP. */
    extensioImatge: 'webp'
  }),
  plugin({
    id: 'gestoria',
    titol: 'Gestoria',
    subtitol: 'Factures i papers del trimestre',
    entradilla: 'El full de factures del trimestre per a la gestoria i un repàs dels seus conceptes. Encara està en obres: de moment només s’obri en desenvolupament, com a app pròpia. No envia res: enviar-ho a la gestoria ho fas tu.',
    imatgeAlt: 'Un llaurador i una gestora segellen papers en una taula al carrer, entre fulls que volen',
    obrir: rutaDeApp('gestoria'),
    entorn: 'desenvolupament',
    espai: 'empresa',
    etiquetaObrir: 'Obrir la Gestoria',
    data: DATA_DE_L_ORDRE,
    etiquetes: classificacio('Factures')
  }),
  plugin({
    id: 'rebost',
    titol: 'Rebost Domèstic',
    subtitol: 'La nevera i el rebost de casa',
    entradilla: 'Apunta el que tens a casa i el que cal comprar, dins de La Nevera de Casa. Les llistes es guarden només en este dispositiu.',
    imatgeAlt: 'Dues iaies etiqueten pots de conserva en un rebost ple de botifarres, tomaques i olives',
    obrir: rutaDeApp('nevera', 'casa'),
    espai: 'llar',
    etiquetaObrir: 'Obrir el Rebost',
    data: DATA_DE_L_ORDRE,
    etiquetes: classificacio('Compra'),
    /* Mòdul B (261021) · L'original .jpg ix de public/: la vinyeta és la WebP. */
    extensioImatge: 'webp'
  }),
  plugin({
    id: 'salut',
    titol: 'Salut',
    subtitol: 'Un quadern per a cuidar dels nostres',
    entradilla: 'Apunta com beu, dorm i està la persona que cuides, i ensenya-ho al metge en un full clar. No diagnostica ni envia res.',
    imatgeAlt: 'Un metge pren la tensió a un iaio assegut en una cadira de bova, al carrer, entre gats i gossos',
    obrir: rutaDeApp('salut'),
    espai: 'llar',
    etiquetaObrir: 'Obrir Salut',
    data: DATA_DE_L_ORDRE,
    etiquetes: classificacio('Cures'),
    /* Mòdul B (261021) · L'original .jpg ix de public/: la vinyeta és la WebP. */
    extensioImatge: 'webp'
  }),
  /* Onada 8 (261009) · La Consola, el Cervell i el Panell de Disseny ja no
     són plugins: són pàgines del sistema (vegeu la capçalera). */
  plugin({
    id: 'rss',
    titol: 'Lector RSS',
    subtitol: 'Les notícies de les entitats del poble, juntes',
    entradilla: 'Seguix les fonts que t’interessen i llig-les en un sol lloc, dins de Notícies del Poble. El que llegeixes i el que deses es queda en este dispositiu.',
    imatgeAlt: 'El carter crida les notícies amb un corn, dalt d’una caixa, a la plaça plena de veïns',
    obrir: rutaDeApp('lector'),
    etiquetaObrir: 'Obrir el Lector',
    data: DATA_DE_L_ORDRE,
    etiquetes: classificacio('Notícies')
  }),
  plugin({
    id: 'tpv',
    titol: 'TPV del Bar',
    subtitol: 'La caixa del bar o del casino',
    entradilla: 'Comandes, taules, tiquets i tancament del torn. Les dades es guarden en este dispositiu.',
    imatgeAlt: 'El cambrer apunta comandes a la barra del Bar Casino, ple de veïns, entrepans i embotits penjats',
    obrir: rutaDeApp('bar'),
    etiquetaObrir: 'Obrir el Bar',
    data: DATA_DE_L_ORDRE,
    etiquetes: classificacio('Hostaleria'),
    /* Gauntlet 261016 (Bloc 1, Llei del Quadrat) · La vinyeta nova, el
       mateix cambrer: 1.200 × 1.200 en WebP de menys de 80 KB. El .jpg
       d'abans es conserva al disc (cap esborrat). */
    extensioImatge: 'webp'
  })
  /* Ordre del Mestre (261007) · Bàscula descartada per ara: ja no és cap
     plugin. Viu només com a llavor del Full de ruta (vegeu la capçalera). */
]);

/** Els ids, en l'ordre de la taula. */
export const IDS_PLUGINS = Object.freeze(PLUGINS.map((p) => p.id));

/** El plugin d'un id (només ids propis de la taula), o null. */
export function pluginPerId(id) {
  if (typeof id !== 'string' || !id) return null;
  return PLUGINS.find((p) => p.id === id) || null;
}

/** Els plugins d'un espai del Panell (ESPAIS_PLUGINS), en l'ordre de la taula; [] si l'espai no és propi. */
export function pluginsDeLEspai(espai) {
  if (!ESPAIS_PLUGINS.some((e) => e.id === espai)) return [];
  return PLUGINS.filter((p) => p.espai === espai);
}

/** La ruta de la pàgina d'un plugin: /plugin/<id>. */
export const rutaDelPlugin = (id) => `${RUTA_PLUGINS}/${encodeURIComponent(String(id))}`;

/** La clau de la portada plegable de la pàgina d'un plugin (UniversalPage, portadaPlegable). */
export const clauPortadaDelPlugin = (id) => `plugin:${id}`;

/**
 * L'app de la plataforma on porta «Obrir» (/app/<id>/…), o null si porta a
 * una secció d'App o a cap lloc. Amb ella, useDestiDelPlugin passa pels
 * interruptors de la plataforma.
 */
export function appDelPlugin(p) {
  if (!p || typeof p.obrir !== 'string') return null;
  const { dins, id } = analitzaRuta(p.obrir.split(/[?#]/)[0]);
  return dins && id ? id : null;
}
