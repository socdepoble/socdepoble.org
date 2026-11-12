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
 * entorn, espai, etiquetaObrir, data, etiquetes, estat } (`estat`, R18 · T2
 * (P0-101): vegeu més avall).
 *   · espai  · Onada 2 de la Gestoria (261004) · l'espai del Panell on viu
 *     la targeta, «Economia i Empresa» (abans «L'empresa»; R16-W1) o «La
 *     llar» (ESPAIS_PLUGINS), o null.
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
 *     Les porten els set que tenen targeta de plugin al Panell: gestoria,
 *     rebost, salut, genealogia, avisador, rss i tpv. Mapa, Vehicle Compartit i Animalets NO: la
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
 *   genealogia → /app/genealogia · R19 · T3 (ordre del Mestre, 261111; pla
 *             261111_1720) · apps/genealogia/manifest.js (id 'genealogia',
 *             entrada per defecte 'entrevista'), registrat a
 *             plataforma/registreApps.js (MANIFESTS_INTERNS). RutaApps la
 *             canonitza a /app/genealogia/entrevista. Com Salut, porta
 *             dadesPersonals 'salut': només s'obri al document propi
 *             (amaDelDocument), i el paquet de l'amfitrió la fixa a '0'
 *             (vite.standalone.config.js, definicionsDeLesApps). Ho decidix la
 *             plataforma, a useDestiDelPlugin.js, com per a la resta d'apps.
 *   consola, cervell i disseny · Onada 8 (261009) · ja no són del registre
 *             (vegeu més amunt). Les seues rutes viuen a SYSTEM_PAGES.
 *   rss     → /app/lector · apps/lector/manifest.js:17 (Notícies del Poble).
 *             Este plugin no porta `entorn`: el decidix l'app. P0-113 (ordre
 *             del Mestre, 261111) · El manifest del Lector s'obri en
 *             producció; només un build amb VITE_SDP_APP_LECTOR=0 el trau del
 *             paquet ('no-compilada').
 *   tpv     → /app/bar · apps/bar/manifest.js:16 (El Bar, TPV d'hostaleria).
 *   gestoria → /app/gestoria · apps/gestoria/manifest.js (id 'gestoria',
 *             entrades 'tauler' i 'aprendre'). Ordre del Mestre, 261004
 *             («contaminació crítica de rutes/estats entre Gestoria i Wiki»):
 *             la Gestoria ja no viu dins de la Wiki (la decisió D3 deixava
 *             «/app/gestoria, més avant; /gestoria, mai»). Cap consulta ni
 *             dada a la ruta (MAPA §2.2, R4).
 *             DEROGAT per P0-113 (ordre del Mestre, 261111: «ENCÉN en
 *             producció … Gestoria (`/app/gestoria`)») «el plugin també porta
 *             entorn 'desenvolupament'»: ja no en porta cap, i qui decidix si
 *             s'obri és la plataforma, com per a la resta d'apps. La guarda
 *             amaDelDocument (dades financeres) continua sencera.
 *   mapa → /mapa, animalets → /animalets · Fusió del kit v3.0.0 de Gemini
 *             (AH-04, ordre del Mestre del 261104: «Calendari, Mapa i
 *             Animalets encara ixen desactivats amb la icona d'obres») · El
 *             Panell ja hi publica (/notes?ambit=mapa|animalets) i App.jsx
 *             en servix la secció (<Route path="mapa|animalets"> amb
 *             SeccioVertical): la guarda de llibre-deutes-02 demana que el
 *             registre diga el mateix. Abans: null («en obres»).
 *   vehicle → /vehicle · llibre-deutes-02 (261104) · IDEA-61 (T0, prompt
 *             261102_1532) li va donar secció: App.jsx, <Route
 *             path="vehicle"> amb SeccioVertical (ActorRoutes), la mateixa
 *             que el Panell (destinsControl.js, `seccio`). No és cap app de
 *             la plataforma: cap interruptor, s'obri en qualsevol entorn.
 *             Abans: null («en obres»), que IDEA-61 va deixar obsolet.
 *
 * R18 · T2 (P0-101; prompt 261111_0148, encàrrec T2) · `estat` i la insígnia
 * «En proves · Beta oberta». Un camp declaratiu més: 'proves' per a una eina
 * que es pot obrir i encara és experimental (les seues dades viuen només al
 * dispositiu o la funció és parcial), o null. No és cap etiqueta del
 * registre: `etiquetes` continua portant EXACTAMENT la Categoria i
 * l'Etiqueta. La tercera píndola la posa etiquetesAmbEstat(plugin, idioma),
 * més avall, que lligen la targeta del Panell (ControlSection.jsx) i la
 * pàgina (PluginPage.jsx): targeta i pàgina diuen el mateix.
 * Tractor-promesa · La insígnia diu «oberta»: només la pot portar una eina
 * que la persona pot obrir ara en producció.
 *   · P0-113 (ordre del Mestre, 261111: «ENCÉN en producció TPV del Bar,
 *     Rebost Domèstic, Salut, Lector RSS i Gestoria com a eines gratuïtes
 *     obertes … i insígnia «En proves · Beta oberta» (`estat: 'proves'` a
 *     `registrePlugins.js`)») · Les cinc eines d'una app de la plataforma
 *     (Gestoria, TPV del Bar, Rebost, Salut i Lector RSS) porten `estat`
 *     'proves': el seu manifest les obri en producció i ve encés per defecte,
 *     i les cinc guarden les dades en este dispositiu (Gestoria: «Dades
 *     financeres que no ixen d'este ordinador»; Bar: «IndexedDB del
 *     dispositiu, sense sincronitzar»; Nevera: «les llistes viuen només en
 *     este dispositiu»; Salut: AVIS_SALUT, «Es queden en este dispositiu»;
 *     Lector: «el que la persona llig, desa o seguix viu només en este
 *     dispositiu»; capçaleres dels manifests). registrePlugins.test.js fixa
 *     la implicació: app oberta en producció amb dades al dispositiu ⇒
 *     'proves'; app tancada ⇒ null. Abans (T2): cap, perquè les cinc eren de
 *     desenvolupament.
 *   · R19 · T3 (ordre del Mestre, 261111; pla 261111_1720: «encesa de
 *     /app/genealogia a registrePlugins.js») · L'Arbre Genealògic s'encén
 *     com les cinc de P0-113: `obrir` rutaDeApp('genealogia') i `estat`
 *     'proves'. El seu manifest l'obri en producció (entorn 'produccio',
 *     actiuPerDefecte true, `carrega` darrere del literal
 *     VITE_SDP_APP_GENEALOGIA !== '0') i les dades viuen en este dispositiu
 *     (textos.js, «Les dades es queden en este dispositiu, en este
 *     navegador.»; AppGenealogia.jsx: «Cap backend, cap xarxa»). DEROGAT
 *     «L'Arbre Genealògic no té destí (obrir null): el text diu que està en
 *     obres i parla en futur del que farà, i no porta cap insígnia.»: hui
 *     cap plugin del registre es queda sense destí.
 *     Arbitratge del carril (P1) · Un build que no porta l'app no pot dur la
 *     insígnia: amb VITE_SDP_APP_<ID>=0, la Gestoria, Salut i l'Arbre
 *     Genealògic perden `estat` i `espai` (GESTORIA_COMPILADA, SALUT_COMPILADA
 *     i GENEALOGIA_COMPILADA, més avall). El paquet de l'amfitrió ho fa sempre
 *     amb les tres.
 *   · P0-114 (ordre del Mestre, 261111: «RESTITUÏX IMMEDIATAMENT «L'Avisador
 *     · Batec de Vida» A «La llar» DE /control») · L'Avisador torna al
 *     registre, a «La llar» (Salut, Arbre Genealògic, L'Avisador), amb
 *     `estat` 'proves': s'obri en producció (/page/avisador, la seua pàgina a
 *     App.jsx) i els seus ajustos viuen en este dispositiu
 *     (avisadorPreferencies.js, storage local). Les tres condicions de la
 *     correcció de la T2 ja es complixen: la vinyeta és a public/
 *     (avisador_vinyeta.webp, Kit R17.3, copiada per MarIA), la seua variant
 *     social també (imatgeSocial.js, VARIANTS_SOCIALS) i l'interruptor
 *     declaratiu de build AVISADOR_COMPILAT (més avall) el desendolla del
 *     tot. No és cap app de la plataforma (appDelPlugin null): la seua
 *     insígnia no ix de cap manifest. DEROGAT «L'Avisador (/page/avisador) NO
 *     és del registre (correcció de la T2) … Torna quan hi siguen les tres
 *     coses.».
 * El Mestre va llevar la píndola «EN OBRES» de les targetes (P6, directriu
 * 261003_2325; ControlSection.test.jsx): `estat` no en torna cap.
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
/** R18 · T2 (P0-101) · L'únic valor d'`estat`: una eina que es pot obrir i encara és en proves. */
export const ESTAT_PROVES = 'proves';
/** R18 · T2 (P0-101) · La classe de la insígnia (la CSS és del Kit R18.3, components.css). */
export const CLASSE_BETA_OBERTA = 'sdp-insignia-beta-oberta';

/* entorn · 'desenvolupament' si el destí només funciona al servidor local de
   desenvolupament (com el camp `entorn` dels manifests d'app); null si no.
   Fora de dev, useDestiDelPlugin deixa el botó inert: cap enllaç que porte
   a «Entrar» o a una eina sense dades. La Consola i el Cervell, que el
   portaven per /__iaia/* (en viu, només el servix `vite serve`,
   tooling/vite/consola-iaia.mjs; des del 31-10-2026 el build web en publica
   la instantània sanejada), ja no són del registre (Onada 8). P0-113 (ordre
   del Mestre, 261111) · La Gestoria, l'última que el portava, s'obri en
   producció: hui cap plugin el porta, i el camp es conserva per a un destí
   futur que només funcione en desenvolupament.
   espai · l'espai del Panell de Control on viu la targeta ('empresa' o
   'llar', ESPAIS_PLUGINS), o null si no viu en cap espai. R16-W1 · La graella
   d'Utilitats ja no es pinta: amb null, la targeta de baix només es pinta si
   és de «Maquinària i Sistema» (ControlSection.jsx, IDS_MAQUINARIA). Un sol
   valor per plugin: cap targeta pot viure en dos espais.
   data i etiquetes · Onada 10 (261010; pla 261010_1121; decisió del Mestre
   del 261010, M4) · opcionals: sense, null i una llista buida (el plugin es
   pinta com sempre). La llista i cada etiqueta ixen congelades, i de cada
   etiqueta només passen `text` i `className`: cap `href` ni cap gestor pot
   entrar al registre per ací.
   extensioImatge · Gauntlet 261016 (Bloc 1, Llei del Quadrat) · opcional:
   l'extensió de la il·lustració, 'jpg' si no ve (la imatge de sempre). Només
   decidix la ruta de `imatge`: no és cap camp nou del plugin.
   estat · R18 · T2 (P0-101) · opcional: 'proves' (ESTAT_PROVES) o null.
   Qualsevol altre valor queda en null: cap insígnia que no diga la taula. */
const plugin = ({
  id, titol, subtitol, entradilla, imatgeAlt, obrir = null, entorn = null, espai = null, etiquetaObrir,
  data = null, etiquetes = [], estat = null, extensioImatge = 'jpg'
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
  etiquetes: Object.freeze(etiquetes.map(({ text, className }) => Object.freeze({ text, className }))),
  estat: estat === ESTAT_PROVES ? ESTAT_PROVES : null
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

/* P0-114 (ordre del Mestre, 261111) · La data de L'Avisador no és la de
   l'ordre del 261004: no hi era. És la del Kit R17.2, que el va portar
   (encàrrec P0-114: «data honesta del Kit R17.2»). Cap data inventada. */
const DATA_DEL_KIT_R17_2 = '2026-11-11T00:30:52+01:00';

/* P0-114 (ordre del Mestre, 261111: «afegeix l'interruptor declaratiu
   necessari … perquè no desaparega mai del Panell de Control») ·
   L'interruptor de build de L'Avisador, amb el mateix literal d'exclusió que
   les apps de P0-113 (import.meta.env.VITE_SDP_APP_<ID> !== '0'): per
   defecte hi és SEMPRE; només un build amb VITE_SDP_APP_AVISADOR=0 el trau.
   El mateix literal governa, a App.jsx, la ruta /page/avisador i el
   muntatge del vigilant (AvisadorAjornat), i a profile/aplicacions.js la
   seua fitxa del Perfil. Ací decidix el destí (`obrir`), l'espai del Panell
   (`espai`) i la pàgina /plugin/avisador (pluginPerId): amb =0, cap targeta,
   cap pàgina (la 404 de sempre) i cap «Obrir». L'entrada continua a la taula
   PLUGINS perquè el productor del manifest social (build-social-manifest.mjs)
   la llig sense executar-la i no admet cap element que no siga un plugin({…})
   literal. registrePlugins.test.js fixa el literal i el comportament. */
const AVISADOR_COMPILAT = import.meta.env.VITE_SDP_APP_AVISADOR !== '0';

/* R19 · Arbitratge del carril Genealogia + Perfil (P1, tractor-promesa) · Els interruptors de build de les tres
   apps que el paquet de l'amfitrió no porta MAI: la Gestoria (dades financeres), Salut i l'Arbre Genealògic
   (dadesPersonals 'salut'). vite.standalone.config.js (definicionsDeLesApps, DADES_NOMES_AL_DOCUMENT_PROPI) hi
   fixa la variable a '0' «Sempre … Cap variable de l'entorn ho canvia». És el mateix literal que el `carrega` del
   seu manifest. Amb =0 la persona no la pot obrir en eixe paquet, i la insígnia «En proves · Beta oberta» diria
   el contrari: la targeta ix del Panell (`espai` null, com L'Avisador) i no porta cap insígnia (`estat` null).
   `obrir` es queda: /plugin/<id> continua dient, amb el motiu de la plataforma, per què ací no s'obri
   (useDestiDelPlugin). El Perfil fa el mateix amb la seua fitxa (profile/aplicacions.js). registrePlugins.test.js
   fixa els literals i el comportament amb vi.stubEnv. */
const GESTORIA_COMPILADA = import.meta.env.VITE_SDP_APP_GESTORIA !== '0';
const SALUT_COMPILADA = import.meta.env.VITE_SDP_APP_SALUT !== '0';
const GENEALOGIA_COMPILADA = import.meta.env.VITE_SDP_APP_GENEALOGIA !== '0';

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
   R16-W1 · «L'empresa» es diu «Economia i Empresa», i els dos espais van entre
   «Publica al poble» i «Maquinària i Sistema»: la graella d'Utilitats ja no
   es pinta. DEROGAT M3 per al Rebost Domèstic, que passa de «La llar» a
   «Economia i Empresa» (camp `espai`); Salut continua a «La llar».
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
    titol: 'Economia i Empresa',
    entradeta: 'Les eines de l’activitat: la gestoria, el TPV del bar i el rebost domèstic. El Panell no mostra cap xifra de les teues dades; les dades només es veuen dins de cada eina.'
  }),
  Object.freeze({
    id: 'llar',
    titol: 'La llar',
    entradeta: 'Les eines de casa: el quadern de salut i la memòria de la família. Viuen separades de les de l’empresa, i el Panell no mostra cap dada teua.'
  })
]);

/* R16b (C3-12) · El títol i l'entradeta de cada espai en les cinc llengües de l'App (ca, es, en, eu
   i gl), per l'id de l'espai. El valencià no es copia: és ESPAIS_PLUGINS mateix, l'única font. El
   Panell (ControlSection.jsx, EspaiDelPanell) llig la llengua de la interfície i, si no la troba ací,
   torna a ESPAIS_PLUGINS. */
const textosDeLEspai = (titol, entradeta) => Object.freeze({ titol, entradeta });
export const TEXTOS_ESPAIS_PLUGINS = Object.freeze({
  ca: Object.freeze(Object.fromEntries(ESPAIS_PLUGINS.map(({ id, titol, entradeta }) => [id, textosDeLEspai(titol, entradeta)]))),
  es: Object.freeze({
    empresa: textosDeLEspai(
      'Economía y Empresa',
      'Las herramientas de la actividad: la gestoría, el TPV del bar y la despensa doméstica. El Panel no muestra ninguna cifra de tus datos; los datos solo se ven dentro de cada herramienta.'
    ),
    llar: textosDeLEspai(
      'El hogar',
      'Las herramientas de casa: el cuaderno de salud y la memoria de la familia. Viven separadas de las de la empresa, y el Panel no muestra ningún dato tuyo.'
    )
  }),
  en: Object.freeze({
    empresa: textosDeLEspai(
      'Economy & Business',
      'Activity tools: bookkeeping, bar POS and home pantry. The Panel shows no figures from your data; data is only visible inside each tool.'
    ),
    llar: textosDeLEspai(
      'The Home',
      'Home tools: the health notebook and family memory. They live separate from business tools, and the Panel shows none of your data.'
    )
  }),
  eu: Object.freeze({
    empresa: textosDeLEspai(
      'Ekonomia eta Enpresa',
      'Jardueraren tresnak: gestoria, tabernako TPVa eta etxeko jakitegia. Panelak ez du zure datuen zifrarik erakusten; datuak tresna bakoitzaren barruan bakarrik ikusten dira.'
    ),
    llar: textosDeLEspai(
      'Etxea',
      'Etxeko tresnak: osasun-koadernoa eta familiaren oroimena. Enpresakoetatik bereizita bizi dira, eta Panelak ez du zure daturik erakusten.'
    )
  }),
  gl: Object.freeze({
    empresa: textosDeLEspai(
      'Economía e Empresa',
      'As ferramentas da actividade: a xestoría, o TPV do bar e a despensa doméstica. O Panel non mostra ningunha cifra dos teus datos; os datos só se ven dentro de cada ferramenta.'
    ),
    llar: textosDeLEspai(
      'O fogar',
      'As ferramentas da casa: o caderno de saúde e a memoria da familia. Viven separadas das da empresa, e o Panel non mostra ningún dato teu.'
    )
  })
});

/* R18 · T2 (P0-101; prompt 261111_0148) · El text de la insígnia de les eines
   en proves, en les cinc llengües de l'App (ca, es, en, gl i eu), amb el
   mateix patró que TEXTOS_ESPAIS_PLUGINS: el codi d'idioma curt i, sense
   textos per a eixa llengua, el valencià. Diu que l'eina és en proves i
   oberta a qui la vulga provar; no promet cap còpia al servidor ni cap
   sincronització (tractor-promesa). */
export const TEXTOS_BETA_OBERTA = Object.freeze({
  ca: 'En proves · Beta oberta',
  es: 'En pruebas · Beta abierta',
  en: 'In testing · Open beta',
  gl: 'En probas · Beta aberta',
  eu: 'Probetan · Beta irekia'
});

/* Una insígnia congelada per llengua, sense `href` (D3 del Panell), feta una
   sola vegada: la mateixa referència a cada pintat. */
const INSIGNIES_BETA_OBERTA = Object.freeze(Object.fromEntries(
  Object.entries(TEXTOS_BETA_OBERTA).map(([llengua, text]) => [llengua, Object.freeze({ text, className: CLASSE_BETA_OBERTA })])
));

/* El codi curt d'una llengua de la interfície ('es-ES' → 'es'); sense textos per a ella, 'ca'. */
const llenguaDeLaInsignia = (idioma) => {
  const codi = String(idioma || 'ca').toLowerCase().split('-')[0];
  return Object.hasOwn(INSIGNIES_BETA_OBERTA, codi) ? codi : 'ca';
};

/**
 * R18 · T2 (P0-101) · Les etiquetes que pinten la targeta del Panell i la
 * pàgina del plugin: les dues del registre (Categoria i Etiqueta) i, si el
 * plugin és en proves (`estat` 'proves'), una tercera, la insígnia «En proves
 * · Beta oberta» en la llengua `idioma`, sense enllaç. Un plugin estable torna
 * la seua llista del registre tal qual (la mateixa referència: ni un píxel
 * canvia).
 */
export function etiquetesAmbEstat(plugin, idioma) {
  const etiquetes = Array.isArray(plugin?.etiquetes) ? plugin.etiquetes : [];
  if (plugin?.estat !== ESTAT_PROVES) return etiquetes;
  return Object.freeze([...etiquetes, INSIGNIES_BETA_OBERTA[llenguaDeLaInsignia(idioma)]]);
}

/* L'ordre és el del Mestre (prompt 261004_0015, T2): el de la graella, el del
   DOM i el del focus. */
export const PLUGINS = Object.freeze([
  plugin({
    id: 'mapa',
    titol: 'Mapa',
    subtitol: 'Els llocs del poble, damunt del mapa',
    /* Fusió del kit v3.0.0 (AH-04) · Ja no està en obres: el Panell hi
       publica (/notes?ambit=mapa) i la secció és /mapa. Com Vehicle
       (llibre-deutes-02), la primera frase és el subtítol de la secció
       (section.mapa.subtitle) i l'avís de privacitat es queda literal.
       Abans: «Eina en obres: encara no es pot marcar cap lloc.» */
    entradilla: 'Vista geogràfica del projecte i dels seus punts destacats. Un punt publicat al mapa serà públic i el podrà localitzar qualsevol, també des d’altres pobles.',
    imatgeAlt: 'Veïns i veïnes claven una agulla de mapa roja i gegant enmig dels tarongers',
    obrir: '/mapa',
    etiquetaObrir: 'Obrir el Mapa',
    /* Mòdul B (261021) · L'original .jpg ix de public/: la vinyeta és la WebP. */
    extensioImatge: 'webp'
  }),
  plugin({
    id: 'vehicle',
    titol: 'Vehicle Compartit',
    subtitol: 'Seients buits per a pujar i baixar del poble',
    /* llibre-deutes-02 (261104) · Ja no està en obres: IDEA-61 publica els
       trajectes (Publicar del Panell, /notes?ambit=vehicle) i els llista a
       /vehicle. La primera frase és el subtítol de la secció
       (section.vehicle.subtitle); l'avís de privacitat i de despeses es
       queda literal. Abans: «Eina en obres: encara no es pot publicar cap
       trajecte.» */
    entradilla: 'Oferix o busca lloc al cotxe per a anar i tornar del poble. Un trajecte publicat diu a tothom el teu horari i el teu camí; les despeses les acordeu entre vosaltres, fora de l’app.',
    imatgeAlt: 'Una furgoneta plena de veïns, caixes de tomaques i un acordió baixa pel camí del poble',
    obrir: '/vehicle',
    etiquetaObrir: 'Obrir Vehicle Compartit',
    /* Mòdul B (261021) · L'original .jpg ix de public/: la vinyeta és la WebP. */
    extensioImatge: 'webp'
  }),
  plugin({
    id: 'animalets',
    titol: 'Animalets',
    subtitol: 'Animals perduts, trobats i en adopció',
    /* Fusió del kit v3.0.0 (AH-04) · Ja no està en obres: el Panell hi
       publica (/notes?ambit=animalets) i la secció és /animalets. La primera
       frase és el subtítol de la secció (section.animalets.subtitle). L'avís
       de privacitat diu ara el que fa el contracte: el camp «Com contactar»
       d'Animalets és `privat` (publicacioUniversal.js), com el de Treball, i
       el formulari ja ho diu amb les mateixes paraules (idea61-05,
       editor.ambit.contacteVisible). Abans: «Eina en obres: encara no es pot
       publicar cap avís. El telèfon o el contacte que poses en un avís el
       veurà tothom.» honestedat_textos-05 (R21) · Amb la política 2611112005
       el veu qualsevol persona, també sense compte, no només la gent
       registrada del poble. */
    entradilla: 'Adopció, animals perduts, trobats i cura comunitària al poble. El contacte que poses en una fitxa el veurà qualsevol persona, també sense compte, en obrir-la; no ix a la targeta ni a la cerca.',
    imatgeAlt: 'Una iaia baixa un gatet d’una olivera amb l’ajuda d’un veí, entre gossos, gallines i un ase',
    obrir: '/animalets',
    etiquetaObrir: 'Obrir Animalets',
    /* Mòdul B (261021) · L'original .jpg ix de public/: la vinyeta és la WebP. */
    extensioImatge: 'webp'
  }),
  plugin({
    id: 'gestoria',
    titol: 'Gestoria',
    subtitol: 'Factures i papers del trimestre',
    /* P0-113 (ordre del Mestre, 261111) · S'obri en producció, gratuïta i en
       proves: fora `entorn: 'desenvolupament'`, i l'entradilla ja no diu
       que està en obres ni que només s'obri en desenvolupament. Abans: «…
       Encara està en obres: de moment només s’obri en desenvolupament, com a
       app pròpia. …» */
    entradilla: 'El full de factures del trimestre per a la gestoria i un repàs dels seus conceptes. Encara està en proves, i les dades es guarden en este dispositiu. No envia res: enviar-ho a la gestoria ho fas tu.',
    imatgeAlt: 'Un llaurador i una gestora segellen papers en una taula al carrer, entre fulls que volen',
    obrir: rutaDeApp('gestoria'),
    espai: GESTORIA_COMPILADA ? 'empresa' : null,
    etiquetaObrir: 'Obrir la Gestoria',
    data: DATA_DE_L_ORDRE,
    etiquetes: classificacio('Factures'),
    estat: GESTORIA_COMPILADA ? ESTAT_PROVES : null
  }),
  plugin({
    id: 'tpv',
    titol: 'TPV del Bar',
    subtitol: 'La caixa del bar o del casino',
    /* P0-113 (ordre del Mestre, 261111) · En proves i oberta: ho diu, breu. */
    entradilla: 'Comandes, taules, tiquets i tancament del torn. Encara està en proves, i les dades es guarden en este dispositiu.',
    imatgeAlt: 'El cambrer apunta comandes a la barra del Bar Casino, ple de veïns, entrepans i embotits penjats',
    obrir: rutaDeApp('bar'),
    espai: 'empresa',
    etiquetaObrir: 'Obrir el Bar',
    data: DATA_DE_L_ORDRE,
    etiquetes: classificacio('Hostaleria'),
    estat: ESTAT_PROVES,
    /* Gauntlet 261016 (Bloc 1, Llei del Quadrat) · La vinyeta nova, el
       mateix cambrer: 1.200 × 1.200 en WebP de menys de 80 KB. El .jpg
       d'abans es conserva al disc (cap esborrat). */
    extensioImatge: 'webp'
  }),
  plugin({
    id: 'rebost',
    titol: 'Rebost Domèstic',
    subtitol: 'La nevera i el rebost de casa',
    /* P0-113 (ordre del Mestre, 261111) · En proves i oberta: ho diu, breu. */
    entradilla: 'Apunta el que tens a casa i el que cal comprar, dins de La Nevera de Casa. Encara està en proves, i les llistes es guarden només en este dispositiu.',
    imatgeAlt: 'Dues iaies etiqueten pots de conserva en un rebost ple de botifarres, tomaques i olives',
    obrir: rutaDeApp('nevera', 'casa'),
    espai: 'empresa',
    etiquetaObrir: 'Obrir el Rebost',
    data: DATA_DE_L_ORDRE,
    etiquetes: classificacio('Compra'),
    estat: ESTAT_PROVES,
    /* Mòdul B (261021) · L'original .jpg ix de public/: la vinyeta és la WebP. */
    extensioImatge: 'webp'
  }),
  plugin({
    id: 'salut',
    titol: 'Salut',
    subtitol: 'Un quadern per a cuidar dels nostres',
    /* P0-113 (ordre del Mestre, 261111) · En proves i oberta: ho diu, breu,
       amb les paraules de l'avís de l'app (AVIS_SALUT: «Es queden en este
       dispositiu»). Abans no deia on es queden les dades. */
    entradilla: 'Apunta com beu, dorm i està la persona que cuides, i ensenya-ho al metge en un full clar. Encara està en proves, i les dades es queden en este dispositiu. No diagnostica ni envia res.',
    imatgeAlt: 'Un metge pren la tensió a un iaio assegut en una cadira de bova, al carrer, entre gats i gossos',
    obrir: rutaDeApp('salut'),
    espai: SALUT_COMPILADA ? 'llar' : null,
    etiquetaObrir: 'Obrir Salut',
    data: DATA_DE_L_ORDRE,
    etiquetes: classificacio('Cures'),
    estat: SALUT_COMPILADA ? ESTAT_PROVES : null,
    /* Mòdul B (261021) · L'original .jpg ix de public/: la vinyeta és la WebP. */
    extensioImatge: 'webp'
  }),
  plugin({
    id: 'genealogia',
    titol: 'Arbre Genealògic',
    subtitol: 'La memòria de la família, els malnoms i els masos',
    /* R19 · T3 (ordre del Mestre, 261111; pla 261111_1720) · L'app existix i
       s'obri en producció: l'entradilla torna al present i diu només el que fa
       el codi. Cada frase, contra src/apps/genealogia: l'entrevista d'una
       sola pregunta per torn que comença pel malnom de la casa i pel mas o el
       poble (nucli/passosEntrevista.js; textos.js, 'entrevista.regla'),
       l'arbre amb la numeració Sosa (vistes/Arbre.jsx), l'exportació GEDCOM
       (gedcom/escriuGedcom.js; manifest, entrada 'intercanvi'), les dades en
       este dispositiu (textos.js, 'avis.on') i que no cerca als arxius ni
       envia res (textos.js, 'avis.noFa' i 'exporta.preparaNoPublica';
       AppGenealogia.jsx). Sense cap xifra (R1) i com a molt
       LIMIT_DESCRIPCIO caràcters: és també la descripció del <head>.
       DEROGAT (R18 · T2, P0-101) «Encara està en obres. Quan estiga a punt,
       guardarà els noms, els malnoms i els masos dels teus majors amb una
       conversa guiada pas a pas, sense inventar res i amb les dades en este
       dispositiu.»: deia en futur el que ara fa l'app. */
    entradilla: 'Recull la memòria de la família amb una entrevista d’una pregunta cada vegada, des del malnom de la casa i el mas, i ordena-la en un arbre que pots exportar en GEDCOM. Encara està en proves, i les dades es queden en este dispositiu. No cerca als arxius ni envia res.',
    imatgeAlt: 'Una iaia i un iaio conten els malnoms de la família davant d’una olivera plena de retrats antics mentre els nets prenen nota',
    obrir: rutaDeApp('genealogia'),
    espai: GENEALOGIA_COMPILADA ? 'llar' : null,
    etiquetaObrir: 'Obrir l’Arbre Genealògic',
    data: DATA_DE_L_ORDRE,
    etiquetes: classificacio('Família'),
    estat: GENEALOGIA_COMPILADA ? ESTAT_PROVES : null,
    extensioImatge: 'webp'
  }),
  /* P0-114 (ordre del Mestre, 261111) · L'Avisador · Batec de Vida, a «La
     llar», darrere de l'Arbre Genealògic. L'entradilla diu el que fa i el que
     no (textosAvisador.js, `intro` i `limitacions`; services/avisador.js): fins
     a tres persones amb conversa privada al Xat, les hores sense activitat, la
     condició de la sessió oberta i que no substituïx la teleassistència. Sense
     cap xifra (R1): «el telèfon d'emergències» en lloc del número. La vinyeta
     és la de MarIA (Kit R17.3): un iaio dormita a la butaca amb el gat, la
     iaia mira el mòbil amb el cor encés i la neta entra amb la compra. */
  plugin({
    id: 'avisador',
    titol: 'L’Avisador',
    subtitol: 'Batec de Vida',
    /* Com a molt LIMIT_DESCRIPCIO (config/metadadesSocials.js) caràcters: és també la descripció del <head>. */
    entradilla: 'Avisa pel Xat fins a tres persones de confiança quan passen les hores triades sense activitat. Només amb la sessió oberta, Sóc de Poble en marxa i el Xat disponible. Encara està en proves, i els ajustos es guarden en este dispositiu. No substituïx el telèfon d’emergències ni la teleassistència.',
    imatgeAlt: 'Un iaio dormita a la butaca amb el gat a la falda mentre la iaia mira un mòbil amb un cor encés i la neta entra per la porta amb la compra',
    obrir: AVISADOR_COMPILAT ? '/page/avisador' : null,
    espai: AVISADOR_COMPILAT ? 'llar' : null,
    etiquetaObrir: 'Obrir l’Avisador',
    data: DATA_DEL_KIT_R17_2,
    etiquetes: classificacio('Cures'),
    estat: ESTAT_PROVES,
    extensioImatge: 'webp'
  }),
  /* Onada 8 (261009) · La Consola, el Cervell i el Panell de Disseny ja no
     són plugins: són pàgines del sistema (vegeu la capçalera). */
  plugin({
    id: 'rss',
    titol: 'Lector RSS',
    subtitol: 'Les notícies de les entitats del poble, juntes',
    /* P0-113 (ordre del Mestre, 261111) · En proves i oberta: ho diu, breu. */
    entradilla: 'Seguix les fonts que t’interessen i llig-les en un sol lloc, dins de Notícies del Poble. Encara està en proves, i el que llegeixes i el que deses es queda en este dispositiu.',
    imatgeAlt: 'El carter crida les notícies amb un corn, dalt d’una caixa, a la plaça plena de veïns',
    obrir: rutaDeApp('lector'),
    etiquetaObrir: 'Obrir el Lector',
    data: DATA_DE_L_ORDRE,
    etiquetes: classificacio('Notícies'),
    estat: ESTAT_PROVES
  })
  /* Ordre del Mestre (261007) · Bàscula descartada per ara: ja no és cap
     plugin. Viu només com a llavor del Full de ruta (vegeu la capçalera). */
]);

/** Els ids, en l'ordre de la taula. */
export const IDS_PLUGINS = Object.freeze(PLUGINS.map((p) => p.id));

/** El plugin d'un id (només ids propis de la taula), o null.
    P0-114 (ordre del Mestre, 261111) · Amb VITE_SDP_APP_AVISADOR=0
    (AVISADOR_COMPILAT fals), L'Avisador no té pàgina: /plugin/avisador és
    la 404 de sempre, com la de qualsevol id que no és del registre. */
export function pluginPerId(id) {
  if (typeof id !== 'string' || !id) return null;
  if (id === 'avisador' && !AVISADOR_COMPILAT) return null;
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
