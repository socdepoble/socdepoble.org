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
 *
 * Cada plugin: { id, titol, subtitol, entradilla, imatge, imatgeAlt, obrir,
 * entorn, espai, etiquetaObrir }.
 *   · espai  · Onada 2 de la Gestoria (261004) · l'espai del Panell on viu
 *     la targeta, «L'empresa» o «La llar» (ESPAIS_PLUGINS), o null.
 *   · imatge · la il·lustració de MarIA, /assets/ui/plugins/<id>_vinyeta.jpg
 *     (public/). És la portada (Hero) de la pàgina i la imatge de la targeta.
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
 *   consola → /consola · App.jsx, <Route path="/consola/*">;
 *             consola/consolaPagines.js:20 (RUTA_CONSOLA).
 *   cervell → /consola/explorador · consolaPagines.js:28 ('explorador') i
 *             :133 (ruta); consola/mapa/ExploradorMapa.jsx:12 «L'Explorador
 *             del cervell: el graf d'Obsidian aplicat als agents del Mas».
 *   consola i cervell porten entorn 'desenvolupament': les seues dades
 *             (/__iaia/*) només les servix `vite serve` (consola-iaia.mjs:13).
 *   rss     → /app/lector · apps/lector/manifest.js:17 (Notícies del Poble).
 *             Peça C (261007) · El manifest del Lector porta entorn
 *             'desenvolupament' (:29): fora de DEV la plataforma l'apaga
 *             encara que el build el compile (VITE_SDP_APP_LECTOR=1), i sense
 *             el literal no és al paquet ('no-compilada'). Este plugin no
 *             porta `entorn`: el decidix l'app.
 *   tpv     → /app/bar · apps/bar/manifest.js:16 (El Bar, TPV d'hostaleria).
 *   disseny → /disseny · Peça C (261007) · App.jsx, ActorRoutes,
 *             <Route path="disseny"> (DesignSection, sections/disseny/). Una
 *             secció d'App, no una app de la plataforma: cap interruptor.
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
 * de la plataforma), que ja és al paquet principal (PlataformaContext). La de
 * la Consola és literal perquè importar consolaPagines.js arrossegaria el Mapa
 * sencer al tros de qui llig esta taula; la prova la confronta amb
 * RUTA_CONSOLA.
 */
import { analitzaRuta } from '../../apps/plataforma/registreApps.js';
import { rutaDeApp } from '../../apps/plataforma/manifestApp.js';

const RUTA_CONSOLA = '/consola';

/** On viuen les il·lustracions (public/). */
export const IMATGES_PLUGINS = '/assets/ui/plugins';
/** El prefix de la ruta de les pàgines: /plugin/<id>. */
export const RUTA_PLUGINS = '/plugin';

/* entorn · 'desenvolupament' si el destí només funciona al servidor local de
   desenvolupament (com el camp `entorn` dels manifests d'app); null si no.
   Revisió P7-A: la Consola i el Cervell lligen /__iaia/consola.json i
   /__iaia/mapa.json, que només servix el middleware de dev
   (tooling/vite/consola-iaia.mjs, `apply: 'serve'`). Fora de dev,
   useDestiDelPlugin deixa el botó inert: cap enllaç que porte a «Entrar» o a
   una Consola sense dades.
   espai · l'espai del Panell de Control on viu la targeta ('empresa' o
   'llar', ESPAIS_PLUGINS), o null si va a les graelles d'Utilitats o de
   Maquinària. Un sol valor per plugin: cap targeta pot viure en dos espais. */
const plugin = ({ id, titol, subtitol, entradilla, imatgeAlt, obrir = null, entorn = null, espai = null, etiquetaObrir }) => Object.freeze({
  id,
  titol,
  subtitol,
  entradilla,
  imatge: `${IMATGES_PLUGINS}/${id}_vinyeta.jpg`,
  imatgeAlt,
  obrir,
  entorn,
  espai,
  etiquetaObrir
});

/* Onada 2 de la Gestoria (MAPA_EMPRESA_GESTORIA.txt §2.2; decisió A11 del
   Mestre, 261004: només les targetes que ja funcionen) · Els dos espais nous
   del Panell de Control, en l'ordre del Panell: entre «Publica al poble» i
   les Utilitats. Mateix panell, dos espais separats i cap targeta compartida
   (R3: la llar mai es barreja amb l'empresa). Per W4-08, el que viu en un
   espai ix de les graelles d'Utilitats i de Maquinària.
   Targetes ESTÀTIQUES (R1): cap xifra, comptador, data d'un apunt ni avís que
   isca de les dades. El Panell també es munta dins de l'amfitrió
   (WordPress): les xifres només viuen dins de cada eina, mai ací. */
export const ESPAIS_PLUGINS = Object.freeze([
  Object.freeze({
    id: 'empresa',
    titol: 'L’empresa',
    entradeta: 'Les eines de l’activitat: el que es declara o es justifica davant d’Hisenda i de la gestoria. El Panell no en mostra cap xifra; les dades només es veuen dins de cada eina.'
  }),
  Object.freeze({
    id: 'llar',
    titol: 'La llar',
    entradeta: 'Les eines de casa: el rebost, la compra i el quadern de salut. Viuen separades de les de l’empresa, i el Panell no en mostra cap dada.'
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
    etiquetaObrir: 'Obrir el Mapa'
  }),
  plugin({
    id: 'vehicle',
    titol: 'Vehicle Compartit',
    subtitol: 'Seients buits per a pujar i baixar del poble',
    entradilla: 'Eina en obres: encara no es pot publicar cap trajecte. Un trajecte publicat diu a tothom el teu horari i el teu camí; les despeses les acordeu entre vosaltres, fora de l’app.',
    imatgeAlt: 'Una furgoneta plena de veïns, caixes de tomaques i un acordió baixa pel camí del poble',
    etiquetaObrir: 'Obrir Vehicle Compartit'
  }),
  plugin({
    id: 'animalets',
    titol: 'Animalets',
    subtitol: 'Animals perduts, trobats i en adopció',
    entradilla: 'Eina en obres: encara no es pot publicar cap avís. El telèfon o el contacte que poses en un avís el veurà tothom.',
    imatgeAlt: 'Una iaia baixa un gatet d’una olivera amb l’ajuda d’un veí, entre gossos, gallines i un ase',
    etiquetaObrir: 'Obrir Animalets'
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
    etiquetaObrir: 'Obrir la Gestoria'
  }),
  plugin({
    id: 'rebost',
    titol: 'Rebost Domèstic',
    subtitol: 'La nevera i el rebost de casa',
    entradilla: 'Apunta el que tens a casa i el que cal comprar, dins de La Nevera de Casa. Les llistes es guarden només en este dispositiu.',
    imatgeAlt: 'Dues iaies etiqueten pots de conserva en un rebost ple de botifarres, tomaques i olives',
    obrir: rutaDeApp('nevera', 'casa'),
    espai: 'llar',
    etiquetaObrir: 'Obrir el Rebost'
  }),
  plugin({
    id: 'salut',
    titol: 'Salut',
    subtitol: 'Un quadern per a cuidar dels nostres',
    entradilla: 'Apunta com beu, dorm i està la persona que cuides, i ensenya-ho al metge en un full clar. No diagnostica ni envia res.',
    imatgeAlt: 'Un metge pren la tensió a un iaio assegut en una cadira de bova, al carrer, entre gats i gossos',
    obrir: rutaDeApp('salut'),
    espai: 'llar',
    etiquetaObrir: 'Obrir Salut'
  }),
  plugin({
    id: 'consola',
    titol: 'Consola Termodinàmica',
    subtitol: 'Què gasta i què falla dins del Mas',
    entradilla: 'El tauler d’administració: consums, rebuts, skills i avisos de salut del sistema. Només funciona al servidor local de desenvolupament.',
    imatgeAlt: 'Una iaia amb ulleres de soldar maneja una màquina de vapor plena de rellotges, i un veí l’apreta amb una clau',
    obrir: RUTA_CONSOLA,
    entorn: 'desenvolupament',
    etiquetaObrir: 'Obrir la Consola'
  }),
  plugin({
    id: 'cervell',
    titol: 'El Cervell',
    subtitol: 'Qui es relaciona amb qui, en un graf',
    entradilla: 'El mapa de relacions del Mas: skills, rutes i agents units per fils. Viu dins de la Consola, a l’Explorador.',
    imatgeAlt: 'Un cervell ple d’engranatges i bombetes dins d’una bóta, connectat a una màquina d’escriure, davant de veïns bocabadats',
    obrir: `${RUTA_CONSOLA}/explorador`,
    entorn: 'desenvolupament',
    etiquetaObrir: 'Obrir el Cervell'
  }),
  plugin({
    id: 'disseny',
    titol: 'Panell de Disseny',
    subtitol: 'Sistema de disseny i contrast',
    entradilla: 'Gestiona el contrast extrem (Mode Bancal), la tipografia i les ombres del sistema. Utilitats per modelar l\'arquitectura de pedra seca.',
    imatgeAlt: 'Un arquitecte i una iaia traçant els plànols del poble sobre una gran taula de pedra, amb eines de dibuix',
    obrir: '/disseny',
    etiquetaObrir: 'Obrir el Panell de Disseny'
  }),
  plugin({
    id: 'rss',
    titol: 'Lector RSS',
    subtitol: 'Les notícies de les entitats del poble, juntes',
    entradilla: 'Seguix les fonts que t’interessen i llig-les en un sol lloc, dins de Notícies del Poble. El que llegeixes i el que deses es queda en este dispositiu.',
    imatgeAlt: 'El carter crida les notícies amb un corn, dalt d’una caixa, a la plaça plena de veïns',
    obrir: rutaDeApp('lector'),
    etiquetaObrir: 'Obrir el Lector'
  }),
  plugin({
    id: 'tpv',
    titol: 'TPV del Bar',
    subtitol: 'La caixa del bar o del casino',
    entradilla: 'Comandes, taules, tiquets i tancament del torn. Les dades es guarden en este dispositiu.',
    imatgeAlt: 'El cambrer apunta comandes a la barra del Bar Casino, ple de veïns, entrepans i embotits penjats',
    obrir: rutaDeApp('bar'),
    etiquetaObrir: 'Obrir el Bar'
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
