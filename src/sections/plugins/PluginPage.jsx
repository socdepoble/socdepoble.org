/**
 * PluginPage.jsx — P7-A · Onada 4, setena passada (ordre del Mestre, 261004;
 * prompt 261004_0015 T3 i directriu 261003_2320) · La pàgina de cada
 * utilitat (plugin): /plugin/:id.
 *
 * Una UniversalPage genèrica, la mateixa per a tots els del registre
 * (registrePlugins.js, l'única taula; huit des de l'Onada 8, 261009, que en
 * va traure la Consola, el Cervell i el Panell de Disseny, pàgines del
 * sistema; abans, la Bàscula, descartada per ara per l'ordre del Mestre del
 * 261007 i només una llavor del Full de ruta). Un id que no és del registre
 * és la 404 de sempre (NotFoundPage): també /plugin/bascula, /plugin/consola,
 * /plugin/cervell i /plugin/disseny.
 *
 * De dalt a baix:
 *   · Portada: la il·lustració de MarIA a sang (Hero), PLEGABLE i visible per
 *     defecte (portadaPlegable, clau 'plugin:<id>'): qui hi torna a treballar
 *     la pot amagar i la pàgina ho recorda per a eixa persona i eixe plugin.
 *   · Barra taronja: signa Sóc de Poble, com les pàgines de publicació
 *     (l'autoria per defecte de PageFrame). Si el plugin porta `data`, la
 *     pastilla pinta la mateixa data i hora que la seua targeta del Panell
 *     (dataHoraDeBarra, com propsDePaginaDeText). Sense `data`, cap pastilla:
 *     no se n'inventa cap (T51).
 *   · Bloc blanc de l'H1 (header.page-title, «la Decoració de l'H1» de la
 *     skill sdp-universal-page): el logotip, l'H1, les `etiquetes` del
 *     registre si en porta (la Categoria i l'Etiqueta de la targeta), el botó
 *     «Obrir…» de dalt si el plugin té presentació i la porta es pot obrir
 *     (vegeu M2, baix), i el copyright.
 *   · H2 i entradilla del registre (.page-intro).
 *   · El cos: la presentació del plugin, si en té (presentacioPlugins.js: sis
 *     blocs, un títol H3 i el seu paràgraf, per al Rebost, Salut, Gestoria i RSS),
 *     pintada per CosDeLaPagina, la peça de les pàgines de text, que saneja
 *     l'HTML.
 *   · L'avís en text, si el botó no es pot obrir.
 *   · Al final, el gran botó blau «Obrir …» (PortaDePagina, la mateixa porta
 *     de les pàgines de publicació), dins de div.sdp-pagina-accio, que és
 *     SEMPRE l'últim fill de l'article: amb destí, un enllaç del router
 *     (Link, amb la base de l'amfitrió i el router en memòria de WordPress);
 *     sense destí, una eina amb app de la plataforma (la Gestoria, el Rebost,
 *     Salut, el Lector RSS i el TPV del Bar) no pinta cap «Obrir…»: diu què
 *     pot fer la persona i oferix «Desactiva esta eina» (EinaNoDisponible;
 *     vegeu Gauntlet 261022_0225, baix). Les eines en obres, sense app ni
 *     destí (el Mapa, Vehicle Compartit i Animalets), conserven el botó
 *     inert, l'avís en text i el toast: l'ordre parla de l'estat buit d'una
 *     eina que esta web no porta, i elles encara no en tenen cap.
 *
 * Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010) ·
 *   · M4 · Targeta i pàgina diuen el mateix (ordre del Mestre, 261001): la
 *     pàgina pinta la data i les etiquetes que el registre dona a la targeta
 *     canònica. DEROGAT, per a la Gestoria, el Rebost, Salut, el Lector RSS i
 *     el TPV del Bar, «sense etiquetes» (les etiquetes buides fixes d'esta
 *     pàgina) i «sense data»: l'ordre nova és la del registre. Mapa, Vehicle
 *     Compartit i Animalets, que no en porten, queden com abans.
 *   · M4 · El Rebost i Salut porten sis blocs de presentació (H3 i
 *     paràgraf, vegeu baix) entre l'entradilla i el botó.
 *   · M2 · A la pàgina del Rebost i a la de Salut el botó «Obrir…» va DALT I
 *     AL FINAL, com a les pàgines de Publicar (Treball, Mapa…): la mateixa
 *     PortaDePagina amb la mateixa porta, dins del bloc blanc de l'H1 (la
 *     ranura accioPrincipal d'UniversalPage: header.page-title >
 *     div.page-title-accio) i repetida després del cos. Si el destí no es
 *     pot obrir, tots dos són inerts i l'avís es diu una sola vegada.
 *     DEROGAT «un sol botó, al final» per a estes dues pàgines. Les pàgines
 *     dels plugins sense presentació conserven un sol botó, baix, i el DOM
 *     de l'article d'abans: la decisió M2 no les nomena.
 *     DEROGAT, per l'ordre del Mestre del 261021 (prompt 261021_2345, tasca
 *     2: l'estat buit no pot tindre un «Obrir» que no funciona; Gauntlet
 *     261022_0225, F2), «si el destí no es pot obrir, tots dos són inerts»:
 *     sense destí no hi ha cap «Obrir…», ni dalt ni baix, i baix va
 *     EinaNoDisponible. Amb destí, el Rebost i Salut continuen amb els dos.
 *     EXTENSIÓ (d31c1ccd; Gauntlet 261022_0225, F8): la Gestoria i el Lector
 *     RSS, que des del 261021 també porten presentació, reben el botó de
 *     dalt quan es poden obrir. M2 només nomenava el Rebost i Salut: pendent
 *     que el Mestre ho confirme.
 *
 * Gauntlet 261022_0225 (troballes F1, F2, F4, F6, F7 i F8; auditoria
 *   didàctica de /plugin/gestoria i /plugin/rss) · L'estat sense destí
 *   d'una eina de la plataforma:
 *   · F2 · Es decidix amb la dada, no amb una llista d'ids: tota eina amb
 *     app de la plataforma i destí 'no-disponible' pinta EinaNoDisponible.
 *   · Hui no hi ha cap manera d'instal·lar una eina, ni per a la persona ni
 *     per a qui porta la web en temps d'execució: no hi ha cap botó
 *     «Instal·la». El text diu, segons el motiu, qui la pot posar
 *     (CAMI_DEL_MOTIU); si l'ha desactivada la persona, el camí és el botó.
 *     NO FET, pendent del Mestre: el botó «Descarrega / Instal·la l'extensió
 *     a este node» (prompt 261021_2345, Instrucció del torn 2). Cap mecanisme
 *     d'instal·lació existix (auditoria Codex 261022_0141, punt 5: «No es
 *     fabrica un botó de descàrrega sense destí real»); un botó així mentiria
 *     (auditoria didàctica, Gauntlet 261022_0225).
 *   · F4 · Dos preferències, cada una amb la seua entrada: «Desactiva esta
 *     eina» escriu només la del Panell (utilitatsActives.js, la mateixa que
 *     el Perfil), i el portal /app («Vull vore») només el seu interruptor
 *     (preferenciesApps.js). Esta pàgina detecta qualsevol de les dues, i
 *     «Torna a activar esta eina» les desfà totes dues. La nota segueix la
 *     preferència que l'ha desactivada: la del Panell (notaDesactivada) o
 *     només la del portal (notaApagada, que no parla del Panell).
 *   · F6 · Si en tornar-la a activar l'eina es pot obrir, el botó premut
 *     desapareix i el focus passa al nou «Obrir…» de baix, no al <body>.
 *   · F1 i F7 · Tots els textos són claus de les cinc llengües, en paraules
 *     de qualsevol veí: res de «node», «app» ni «instal·lar amb un clic».
 *
 * Ordre del Mestre (261021, prompt 261021_0015, tasca 6; pla §7.3) · Cada
 *   paràgraf de la presentació porta davant el seu títol H3: el cos comença
 *   en H3, davall de l'H2 i l'entradilla del registre (sdp-universal-page
 *   §1.E.4, core-llegibilitat-text §2). Ni codi ni CSS nous: l'HTML viu a
 *   presentacioPlugins.js i l'H3 global de base.css ja és el canònic.
 *
 * L'arquitectura de plugins sencera (injecció, cicle de vida, aïllament) és
 * de la pròxima onada (directriu 261003_2320): ací només hi ha la pàgina.
 */
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useParams } from '../../app/contexts/RouterContext';
import { Boto, Pila } from '../../components/PedraSeca/index.js';
import { useApagaApp, usePreferenciesApps } from '../../apps/plataforma/PlataformaContext.jsx';
import { desaUtilitatActiva, estaAlPanell, subscriuUtilitatsActives } from '../profile/utilitatsActives.js';
import { useUIActions } from '../../app/contexts/UIContext';
import { Alerta } from '../../components/PedraSeca/molecules/Alerta.jsx';
import { PortaDePagina } from '../../components/PedraSeca/organismes/PortesTargeta.jsx';
import { COPYRIGHT_SDP, dataHoraDeBarra } from '../../components/universal/editorial.js';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { resolveAsset } from '../../config/assetResolver';
import { CAP_SOCIAL_BASE } from '../../config/imatgeSocial.js';
import { metadadesDePlugin } from '../../config/metadadesSocials.js';
import { opcionsDeLaImatgeSocial } from '../../config/opcionsImatgeSocial.js';
import { useSEO } from '../../hooks/useSEO';
import NotFoundPage from '../../pages/NotFoundPage';
import { CosDeLaPagina } from '../text/TextSection.jsx';
import { presentacioDelPlugin } from './presentacioPlugins.js';
import { appDelPlugin, clauPortadaDelPlugin, pluginPerId } from './registrePlugins.js';
import { portaDelPlugin, useDestiDelPlugin } from './useDestiDelPlugin.js';

/* Les etiquetes de la portada plegable, traduïbles (el valencià és la reserva). */
const TEXTOS_PORTADA = Object.freeze({
  amaga: Object.freeze(['pagina.portada.amaga', 'Amaga la portada']),
  mostra: Object.freeze(['pagina.portada.mostra', 'Mostra la portada'])
});

/* Gauntlet 261022_0225 (F1, F7) · Els textos de l'estat sense destí,
   traduïbles (el valencià és la reserva), en paraules de qualsevol veí. Un
   sol parell de verbs a tota la plataforma: «desactivar» i «tornar a
   activar» (el mateix del motiu 'persona-apagada', PortalApps.jsx). */
export const TEXTOS_EINA = Object.freeze({
  desactiva: Object.freeze(['section.plugin.eina.desactiva', 'Desactiva esta eina']),
  reactiva: Object.freeze(['section.plugin.eina.reactiva', 'Torna a activar esta eina']),
  notaActiva: Object.freeze(['section.plugin.eina.notaActiva', 'Desactivar-la només la trau del teu Panell, en este navegador. No s’esborra res del que hi tingues.']),
  notaDesactivada: Object.freeze(['section.plugin.eina.notaDesactivada', 'Està desactivada per a tu, només en este navegador. Si la tornes a activar, tornarà al teu Panell.']),
  notaApagada: Object.freeze(['section.plugin.eina.notaApagada', 'L’has desactivada a la llista d’eines, només en este navegador. Si la tornes a activar, la podràs tornar a obrir ací quan esta web la tinga.']),
  camiPosar: Object.freeze(['section.plugin.eina.camiPosar', 'Tu no has d’instal·lar ni baixar res. Esta eina només la pot afegir qui porta esta web, quan estiga a punt. Llavors, ací mateix tindràs el botó per a obrir-la.']),
  camiDemanar: Object.freeze(['section.plugin.eina.camiDemanar', 'Tu no has d’instal·lar ni pagar res. Només la pot posar en marxa qui porta esta web: si la vols fer servir, demana-li-ho.']),
  errorDesa: Object.freeze(['section.plugin.eina.errorDesa', 'No s’ha pogut guardar el canvi. Torna-ho a provar.'])
});

/* El camí que li queda a la persona, segons el motiu de la plataforma
   (interruptors.js). Cap instal·lació: hui no n'hi ha cap mecanisme. Sense
   camí, res més que el motiu de l'avís: 'persona-apagada' (el camí és el
   botó de baix) i les dades de salut o financeres (l'avís ja diu on s'obri). */
const CAMI_DEL_MOTIU = Object.freeze({
  'no-compilada': TEXTOS_EINA.camiPosar,
  'entorn-desenvolupament': TEXTOS_EINA.camiPosar,
  'amfitrio-no-la-declara': TEXTOS_EINA.camiDemanar,
  'apagada-per-defecte': TEXTOS_EINA.camiDemanar,
  'sense-capacitat': TEXTOS_EINA.camiDemanar,
  'sense-dret': TEXTOS_EINA.camiDemanar
});

function EinaNoDisponible({ plugin, motiu, onReactivada }) {
  const { t } = useUIActions();
  const [error, setError] = useState(false);
  const apaga = useApagaApp();
  const preferencies = usePreferenciesApps();
  const idApp = appDelPlugin(plugin);
  const visible = useSyncExternalStore(subscriuUtilitatsActives, () => estaAlPanell(plugin.id), () => true);
  const apagada = preferencies.apps[idApp] === false;
  const desactivada = apagada || !visible;
  const cami = typeof motiu === 'string' && Object.hasOwn(CAMI_DEL_MOTIU, motiu) ? CAMI_DEL_MOTIU[motiu] : null;
  /* F4 · Desactivar escriu només la preferència del Panell (la del Perfil).
     Tornar a activar la torna al Panell i desfà, si n'hi ha, l'apagada del
     portal /app: les dues entrades que la poden haver desactivada. */
  const canvia = () => {
    if (!desaUtilitatActiva(plugin.id, desactivada)) {
      setError(true);
      return;
    }
    setError(false);
    if (!apagada) return;
    // F6 · Només el motiu 'persona-apagada' canvia en desfer l'apagada: la pàgina mourà el focus.
    if (motiu === 'persona-apagada') onReactivada();
    apaga(idApp, false);
  };
  /* La nota diu el que és cert per a la preferència que l'ha desactivada:
     amagada del Panell, o només apagada al portal (la targeta del Panell no
     se n'ha mogut). */
  const nota = !visible ? TEXTOS_EINA.notaDesactivada : apagada ? TEXTOS_EINA.notaApagada : TEXTOS_EINA.notaActiva;
  /* El camí, fora de la Pila: conserva el ritme del paràgraf, i el gap
     només separa el botó de la seua nota. */
  return (
    <>
      {cami ? <p>{t(...cami)}</p> : null}
      <Pila gap={3} className="sdp-align-start">
        <Boto onClick={canvia}>{t(...(desactivada ? TEXTOS_EINA.reactiva : TEXTOS_EINA.desactiva))}</Boto>
        <p>{t(...nota)}</p>
        {error ? <Alerta to="error">{t(...TEXTOS_EINA.errorDesa)}</Alerta> : null}
      </Pila>
    </>
  );
}

function PaginaDelPlugin({ plugin }) {
  const { t } = useUIActions();
  const desti = useDestiDelPlugin(plugin);
  const accio = useRef(null);
  const reactivada = useRef(false);
  const obert = Boolean(desti.ruta);
  /* Gauntlet 261022_0225 (F6) · EinaNoDisponible ha demanat moure el focus
     (la persona ha tornat a activar l'eina): quan el destí canvia, si ara es
     pot obrir, el focus va al nou «Obrir…» de baix. Es desfà la demanda
     siga com siga, perquè un canvi posterior no robe el focus. */
  useEffect(() => {
    if (!reactivada.current) return;
    reactivada.current = false;
    if (obert) accio.current?.querySelector('a[href]')?.focus();
  }, [obert, desti.motiu]);
  /* Ordre del Mestre (30-10-2026, prompt 2208, T1.1) · El head de la pàgina
     és el que prerenderitza el build (metadadesDePlugin, compartida amb
     tooling/seo/build-social-manifest.mjs): el títol, l'entradeta i, sense, el
     subtítol, i la il·lustració pel selector social (la WebP va al <head> per la
     seua variant JPEG de 1200x630). La portada que es pinta no canvia. */
  const seo = useMemo(() => {
    const metadades = metadadesDePlugin(plugin, opcionsDeLaImatgeSocial());
    return { title: metadades.title, description: metadades.description, image: metadades.image || resolveAsset(CAP_SOCIAL_BASE.image.url) };
  }, [plugin]);
  useSEO(seo);
  const { avis, porta } = portaDelPlugin(plugin, desti, t);
  const presentacio = presentacioDelPlugin(plugin.id);
  /* Gauntlet 261022_0225 (F2) · Amb la dada, no amb una llista d'ids: tota
     eina amb app de la plataforma que ací no es pot obrir. */
  const senseDesti = desti.estat === 'no-disponible' && Boolean(appDelPlugin(plugin));
  return (
    <UniversalPage
      title={plugin.titol}
      subtitle={plugin.subtitol}
      lead={plugin.entradilla}
      heroImage={plugin.imatge}
      heroAlt={plugin.imatgeAlt}
      labels={plugin.etiquetes}
      copyright={COPYRIGHT_SDP}
      /* Onada 10 (M4) · Només amb data: sense, cap prop (el DOM d'abans), i
         la barra no pinta cap pastilla. */
      {...(plugin.data ? dataHoraDeBarra({ creat: plugin.data }) : null)}
      showLogos={true}
      chrome="full"
      portadaPlegable={{
        clau: clauPortadaDelPlugin(plugin.id),
        etiquetes: { amaga: t(...TEXTOS_PORTADA.amaga), mostra: t(...TEXTOS_PORTADA.mostra) }
      }}
      /* Onada 10 (M2) · El botó de dalt, només amb presentació. Es decidix
         amb la dada, mai amb l'element: sense la prop, PageFrame no pinta
         cap div.page-title-accio. Gauntlet 261022_0225 (F2) · Sense destí,
         cap botó dalt. */
      {...(presentacio && !senseDesti ? { accioPrincipal: <PortaDePagina porta={porta} /> } : null)}
    >
      {presentacio ? <CosDeLaPagina html={presentacio} /> : null}
      {avis ? <Alerta to="info">{avis}</Alerta> : null}
      <div className="sdp-pagina-accio" ref={accio}>
        {senseDesti
          ? <EinaNoDisponible key={plugin.id} plugin={plugin} motiu={desti.motiu} onReactivada={() => { reactivada.current = true; }} />
          : <PortaDePagina porta={porta} />}
      </div>
    </UniversalPage>
  );
}

export default function PluginPage() {
  const { id = '' } = useParams();
  const plugin = pluginPerId(id);
  if (!plugin) return <NotFoundPage />;
  return <PaginaDelPlugin plugin={plugin} />;
}
