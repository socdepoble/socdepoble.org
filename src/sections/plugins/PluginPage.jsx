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
 *     «Obrir…» de dalt si el plugin té presentació, i el copyright.
 *   · H2 i entradilla del registre (.page-intro).
 *   · El cos: la presentació del plugin, si en té (presentacioPlugins.js: sis
 *     blocs, un títol H3 i el seu paràgraf, per al Rebost i per a Salut),
 *     pintada per CosDeLaPagina, la peça de les pàgines de text, que saneja
 *     l'HTML.
 *   · L'avís en text, si el botó no es pot obrir.
 *   · Al final, el gran botó blau «Obrir …» (PortaDePagina, la mateixa porta
 *     de les pàgines de publicació), dins de div.sdp-pagina-accio, que és
 *     SEMPRE l'últim fill de l'article: amb destí, un enllaç del router
 *     (Link, amb la base de l'amfitrió i el router en memòria de WordPress);
 *     sense, o amb una app que ací no es pot obrir (useDestiDelPlugin), un
 *     botó inert (aria-disabled) que no navega, amb l'avís en text damunt i
 *     el toast en prémer-lo.
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
import { useParams } from '../../app/contexts/RouterContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { Alerta } from '../../components/PedraSeca/molecules/Alerta.jsx';
import { PortaDePagina } from '../../components/PedraSeca/organismes/PortesTargeta.jsx';
import { COPYRIGHT_SDP, dataHoraDeBarra } from '../../components/universal/editorial.js';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { resolveAsset } from '../../config/assetResolver';
import { useSEO } from '../../hooks/useSEO';
import NotFoundPage from '../../pages/NotFoundPage';
import { CosDeLaPagina } from '../text/TextSection.jsx';
import { presentacioDelPlugin } from './presentacioPlugins.js';
import { clauPortadaDelPlugin, pluginPerId } from './registrePlugins.js';
import { portaDelPlugin, useDestiDelPlugin } from './useDestiDelPlugin.js';

/* Les etiquetes de la portada plegable, traduïbles (el valencià és la reserva). */
const TEXTOS_PORTADA = Object.freeze({
  amaga: Object.freeze(['pagina.portada.amaga', 'Amaga la portada']),
  mostra: Object.freeze(['pagina.portada.mostra', 'Mostra la portada'])
});

function PaginaDelPlugin({ plugin }) {
  const { t } = useUIActions();
  const desti = useDestiDelPlugin(plugin);
  useSEO({
    title: plugin.titol,
    description: plugin.subtitol,
    image: { url: resolveAsset(plugin.imatge), alt: plugin.imatgeAlt }
  });
  const { avis, porta } = portaDelPlugin(plugin, desti, t);
  const presentacio = presentacioDelPlugin(plugin.id);
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
         cap div.page-title-accio. */
      {...(presentacio ? { accioPrincipal: <PortaDePagina porta={porta} /> } : null)}
    >
      {presentacio ? <CosDeLaPagina html={presentacio} /> : null}
      {avis ? <Alerta to="info">{avis}</Alerta> : null}
      <div className="sdp-pagina-accio">
        <PortaDePagina porta={porta} />
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
