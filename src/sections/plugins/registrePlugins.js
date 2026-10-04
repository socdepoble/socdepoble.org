/**
 * registrePlugins.js — P7-A · Onada 4, setena passada (ordre del Mestre,
 * 261004; prompt 261004_0015 T2/T3 i directriu 261003_2320) · Les onze
 * utilitats (plugins) del Panell de Control en UNA sola taula: la font de
 * veritat de la seua pàgina (/plugin/<id>, PluginPage.jsx) i de la graella
 * del Control (bloc B, que només la llig).
 *
 * Cada plugin: { id, titol, subtitol, entradilla, imatge, imatgeAlt, obrir,
 * etiquetaObrir }.
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
 *   tpv     → /app/bar · apps/bar/manifest.js:16 (El Bar, TPV d'hostaleria).
 *   gestoria, bascula, mapa, vehicle, animalets → null. La Gestoria només
 *     viu dins de la Wiki en desenvolupament, sense ruta pròpia (decisió D3:
 *     wiki-de-poble/WikiDePobleSection.jsx:53-54 i :75); Mapa, Vehicle
 *     Compartit i Animalets no tenen secció (control/destinsControl.js:29-31);
 *     la Bàscula no té cap codi.
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
   una Consola sense dades. */
const plugin = ({ id, titol, subtitol, entradilla, imatgeAlt, obrir = null, entorn = null, etiquetaObrir }) => Object.freeze({
  id,
  titol,
  subtitol,
  entradilla,
  imatge: `${IMATGES_PLUGINS}/${id}_vinyeta.jpg`,
  imatgeAlt,
  obrir,
  entorn,
  etiquetaObrir
});

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
    entradilla: 'Eina en obres: encara no es pot obrir des d’ací. No guarda ni envia cap factura.',
    imatgeAlt: 'Un llaurador i una gestora segellen papers en una taula al carrer, entre fulls que volen',
    etiquetaObrir: 'Obrir la Gestoria'
  }),
  plugin({
    id: 'rebost',
    titol: 'Rebost Domèstic',
    subtitol: 'La nevera i el rebost de casa',
    entradilla: 'Apunta el que tens a casa i el que cal comprar, dins de La Nevera de Casa. Les llistes es guarden només en este dispositiu.',
    imatgeAlt: 'Dues iaies etiqueten pots de conserva en un rebost ple de botifarres, tomaques i olives',
    obrir: rutaDeApp('nevera', 'casa'),
    etiquetaObrir: 'Obrir el Rebost'
  }),
  plugin({
    id: 'salut',
    titol: 'Salut',
    subtitol: 'Un quadern per a cuidar dels nostres',
    entradilla: 'Apunta com beu, dorm i està la persona que cuides, i ensenya-ho al metge en un full clar. No diagnostica ni envia res.',
    imatgeAlt: 'Un metge pren la tensió a un iaio assegut en una cadira de bova, al carrer, entre gats i gossos',
    obrir: rutaDeApp('salut'),
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
  }),
  plugin({
    id: 'bascula',
    titol: 'Bàscula de Cooperativa',
    subtitol: 'Les pesades de la collita',
    entradilla: 'Eina en obres: encara no pesa ni guarda res.',
    imatgeAlt: 'Un llaurador pesa un cove de collita en la bàscula gegant de la cooperativa, i una iaia ho apunta en una llibreta',
    etiquetaObrir: 'Obrir la Bàscula'
  })
]);

/** Els ids, en l'ordre de la taula. */
export const IDS_PLUGINS = Object.freeze(PLUGINS.map((p) => p.id));

/** El plugin d'un id (només ids propis de la taula), o null. */
export function pluginPerId(id) {
  if (typeof id !== 'string' || !id) return null;
  return PLUGINS.find((p) => p.id === id) || null;
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
