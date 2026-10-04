/**
 * PluginPage.jsx — P7-A · Onada 4, setena passada (ordre del Mestre, 261004;
 * prompt 261004_0015 T3 i directriu 261003_2320) · La pàgina de cada
 * utilitat (plugin): /plugin/:id.
 *
 * Una UniversalPage genèrica, la mateixa per als onze, llegida del registre
 * (registrePlugins.js, l'única taula):
 *   · Portada: la il·lustració de MarIA a sang (Hero), PLEGABLE i visible per
 *     defecte (portadaPlegable, clau 'plugin:<id>'): qui hi torna a treballar
 *     la pot amagar i la pàgina ho recorda per a eixa persona i eixe plugin.
 *   · H1, H2 i entradilla del registre; signada per Sóc de Poble, com les
 *     pàgines de publicació (l'autoria per defecte de PageFrame, els logos i
 *     el copyright de TextSection), sense etiquetes.
 *   · Al final, el gran botó blau «Obrir …» (PortaDePagina, la mateixa porta
 *     de les pàgines de publicació): amb destí, un enllaç del router (Link,
 *     amb la base de l'amfitrió i el router en memòria de WordPress); sense,
 *     o amb una app que ací no es pot obrir (useDestiDelPlugin), un botó
 *     inert (aria-disabled) que no navega, amb l'avís en text damunt i el
 *     toast en prémer-lo.
 * Un id que no és del registre és la 404 de sempre (NotFoundPage).
 *
 * L'arquitectura de plugins sencera (injecció, cicle de vida, aïllament) és
 * de la pròxima onada (directriu 261003_2320): ací només hi ha la pàgina.
 */
import { useParams } from '../../app/contexts/RouterContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { Alerta } from '../../components/PedraSeca/molecules/Alerta.jsx';
import { PortaDePagina } from '../../components/PedraSeca/organismes/PortesTargeta.jsx';
import { COPYRIGHT_SDP } from '../../components/universal/editorial.js';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { resolveAsset } from '../../config/assetResolver';
import { useSEO } from '../../hooks/useSEO';
import NotFoundPage from '../../pages/NotFoundPage';
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
  return (
    <UniversalPage
      title={plugin.titol}
      subtitle={plugin.subtitol}
      lead={plugin.entradilla}
      heroImage={plugin.imatge}
      heroAlt={plugin.imatgeAlt}
      labels={[]}
      copyright={COPYRIGHT_SDP}
      showLogos={true}
      chrome="full"
      portadaPlegable={{
        clau: clauPortadaDelPlugin(plugin.id),
        etiquetes: { amaga: t(...TEXTOS_PORTADA.amaga), mostra: t(...TEXTOS_PORTADA.mostra) }
      }}
    >
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
