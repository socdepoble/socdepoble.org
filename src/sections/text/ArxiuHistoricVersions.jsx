/**
 * ArxiuHistoricVersions.jsx — Onada v1.2.23 · IDEA-332 (Opció A, Nivell 2)
 *
 * Desplegable diferit (dynamic import()) per a l'arxiu històric complet de
 * /versions (2013 – versions anteriors). El paquet històric (~850 KB de
 * pageContent.versionsHistoric.js) NO es baixa en l'obertura inicial de
 * /versions ni quan es lligen el Mur, la Wiki o altres pàgines de sistema:
 * només es demana quan la persona prem el botó central.
 */
import { useId, useState } from 'react';
import { ChevronUp, History } from 'lucide-react';
import { Alerta } from '../../components/PedraSeca/molecules/Alerta.jsx';
import { Boto } from '../../components/PedraSeca/atoms/Boto.jsx';
import { resolRecursosDeHtml } from '../../config/assetResolver.js';
import { esAppNativa } from '../../config/origenPublic.js';
import { sanitizeHtml } from '../../utils/sanitize.js';
import { etiquetaEnllacosDImatge } from '../detail/etiquetaEnllacosDImatge.js';
import { htmlPerAppNativa } from './perAppNativa.js';

export const TEXTOS_ARXIU_HISTORIC_VERSIONS = Object.freeze({
  ca: Object.freeze({
    obrir: "Consultar l'arxiu històric complet (2013 – versions anteriors)",
    carregant: "S'està carregant l'arxiu històric complet…",
    plegar: "Plegar l'arxiu històric (2013 – versions anteriors)",
    error: "No s'ha pogut carregar l'arxiu històric ara mateix. Torna-ho a provar.",
    regio: "Arxiu històric de versions (2013 – versions anteriors)",
  }),
  es: Object.freeze({
    obrir: 'Consultar el archivo histórico completo (2013 – versiones anteriores)',
    carregant: 'Cargando el archivo histórico completo…',
    plegar: 'Plegar el archivo histórico (2013 – versiones anteriores)',
    error: 'No se ha podido cargar el archivo histórico en este momento. Inténtalo de nuevo.',
    regio: 'Archivo histórico de versiones (2013 – versiones anteriores)',
  }),
  en: Object.freeze({
    obrir: 'View full historical archive (2013 – earlier releases)',
    carregant: 'Loading full historical archive…',
    plegar: 'Collapse historical archive (2013 – earlier releases)',
    error: 'Could not load the historical archive right now. Please try again.',
    regio: 'Historical release archive (2013 – earlier releases)',
  }),
  eu: Object.freeze({
    obrir: 'Kontsultatu artxibo historiko osoa (2013 – aurreko bertsioak)',
    carregant: 'Artxibo historiko osoa kargatzen…',
    plegar: 'Tolestu artxibo historikoa (2013 – aurreko bertsioak)',
    error: 'Ezin izan da artxibo historikoa kargatu une honetan. Saiatu berriro.',
    regio: 'Bertsioen artxibo historikoa (2013 – aurreko bertsioak)',
  }),
  gl: Object.freeze({
    obrir: 'Consultar o arquivo histórico completo (2013 – versións anteriores)',
    carregant: 'Cargando o arquivo histórico completo…',
    plegar: 'Pregar o arquivo histórico (2013 – versións anteriores)',
    error: 'Non se puido cargar o arquivo histórico neste momento. Téntao de novo.',
    regio: 'Arquivo histórico de versións (2013 – versións anteriores)',
  }),
});

const carregaModulPerDefecte = () => import('./pageContent.versionsHistoric.js');

function CosHistoricReserva({ html, lang }) {
  const cos = esAppNativa() ? htmlPerAppNativa(html) : html;
  return (
    <article
      className="cms-preview"
      lang={lang}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(etiquetaEnllacosDImatge(resolRecursosDeHtml(cos)), { enllacosEditorials: true }) }}
    />
  );
}

export default function ArxiuHistoricVersions({
  llengua = 'ca',
  carregador = carregaModulPerDefecte,
  renderCos = null,
}) {
  const codi = String(llengua || 'ca').toLowerCase().split('-')[0];
  const idioma = Object.hasOwn(TEXTOS_ARXIU_HISTORIC_VERSIONS, codi) ? codi : 'ca';
  const textos = TEXTOS_ARXIU_HISTORIC_VERSIONS[idioma];
  const idRegio = useId();

  const [obert, setObert] = useState(false);
  const [carregant, setCarregant] = useState(false);
  const [modulHistoric, setModulHistoric] = useState(null);
  const [errorCarrega, setErrorCarrega] = useState(false);

  const alterna = () => {
    if (obert) {
      setObert(false);
      return;
    }
    setErrorCarrega(false);
    if (modulHistoric) {
      setObert(true);
      return;
    }
    setCarregant(true);
    Promise.resolve(carregador())
      .then((mod) => {
        if (typeof mod?.obteHtmlHistoricVersions !== 'function') {
          throw new Error('Mòdul històric invàlid');
        }
        setModulHistoric(() => mod);
        setObert(true);
      })
      .catch(() => {
        setErrorCarrega(true);
      })
      .finally(() => {
        setCarregant(false);
      });
  };

  const rotulBoto = carregant ? textos.carregant : (obert ? textos.plegar : textos.obrir);
  const htmlHistoric = obert && modulHistoric ? modulHistoric.obteHtmlHistoricVersions(idioma) : '';

  return (
    <div data-testid="versions-bloc-arxiu-historic" lang={idioma}>
      <div className="sdp-accions">
        <Boto
          varietat="secundari"
          mida="gran"
          onClick={alterna}
          disabled={carregant}
          aria-expanded={obert}
          aria-controls={obert && htmlHistoric ? idRegio : undefined}
          title={rotulBoto}
          data-testid="versions-boto-arxiu-historic"
        >
          {obert ? (
            <ChevronUp size={18} aria-hidden="true" focusable="false" />
          ) : (
            <History size={18} aria-hidden="true" focusable="false" />
          )}
          <span>{rotulBoto}</span>
        </Boto>
      </div>
      {errorCarrega ? (
        <Alerta to="avis">{textos.error}</Alerta>
      ) : null}
      {obert && htmlHistoric ? (
        <section id={idRegio} aria-label={textos.regio} data-testid="versions-arxiu-historic">
          {typeof renderCos === 'function' ? (
            renderCos(htmlHistoric)
          ) : (
            <CosHistoricReserva html={htmlHistoric} lang={idioma} />
          )}
          <div className="sdp-accions">
            <Boto
              varietat="secundari"
              mida="gran"
              onClick={() => setObert(false)}
              title={textos.plegar}
              data-testid="versions-boto-plegar-historic"
            >
              <ChevronUp size={18} aria-hidden="true" focusable="false" />
              <span>{textos.plegar}</span>
            </Boto>
          </div>
        </section>
      ) : null}
    </div>
  );
}
