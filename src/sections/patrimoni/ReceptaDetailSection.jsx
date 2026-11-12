import { lazy, Suspense, useId, useMemo, useState } from 'react';
import { Link, useParams } from '../../app/contexts/RouterContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { usePublicadorsBarraRecurs } from '../../hooks/usePublicadorsBarraRecurs.js';
import { VideoEditorial } from '../../components/universal/VideoEditorial.jsx';
import { Alerta, Boto } from '../../components/PedraSeca/index.js';
import { resolRecursPropi } from '../../config/assetResolver.js';
import { useSEO } from '../../hooks/useSEO.js';
import NotFoundPage from '../../pages/NotFoundPage';
import { OBRA_QUE_DINEM, laminaDeRecepta, receptaPerSlug } from '../../data/patrimoni/queDinem.js';
import CreditsQueDinem from './CreditsQueDinem.jsx';
import { DRETS_QUE_DINEM } from '../text/pageContent.dretsPatrimoni.js';
import { CandidatsAlergens } from '../../components/PedraSeca/molecules/CandidatsAlergens.jsx';
import { candidatsReceptaQueDinem } from '../../data/menjarIBeure/candidatsAlergens.js';
import { etiquetaDApartat, RUTA_DEL_RECEPTARI } from './cercaReceptes.js';
import { traductorPatrimoni } from './textosPatrimoni.js';

/* Onada R14 + Onada R17 (AH-R17-05, AH-R17-06) · /receptes/:slug: la pàgina pròpia d'una recepta del llibre
   «Què dinem?» (ItemDetailSection la carrega en un tros diferit quan sectionId és 'receptes').
   · Hero (UniversalPage): fotografia real del plat quan en tinga (recepta.foto), làmina il·lustrada de la recepta
     (148 de les 149, amb ample/alt de LAMINES_QUE_DINEM i fetchpriority="high") o fallback canònic a la vinyeta
     de portada de «Què dinem?» (/assets/uploads/patrimoni/portada_que_dinem_muro.webp), sense duplicar cap <Lamina>
     dins del cos i amb l'atribució CC BY-NC-SA 4.0 de l'Associació «Fins rebentar com Sangonereta».
   · Pestanyes Pedra Seca (role="tablist" / role="tab", aria-selected, icona amb .sdp-fitxa-emoji-xl): prémer una
     pestanya mostra només eixe bloc; tornar-la a prémer ho mostra tot.
   · Al·lèrgens: proposta assistida de candidatsAlergens.js amb avís honest de validació humana pendent.
   · MotorHoritzontalRecepta: carregat exclusivament en un tros diferit darrere del literal plegable de
     VITE_SDP_APP_NEVERA, el mateix que src/apps/nevera/manifest.js. P0-113 (ordre del Mestre, 261111): la Nevera
     és oberta per defecte, i el motor entra al build per defecte; amb VITE_SDP_APP_NEVERA=0 Vite el trau. */
/* Les mides de la portada són les que registra pageContent.patrimoniR14.js per a PORTADA_IMAGE (1200×675). */
const PORTADA_FALLBACK_QUE_DINEM = '/assets/uploads/patrimoni/portada_que_dinem_muro.webp';
/* Onada R20 (DRETS_QUE_DINEM) · La font només acredita «permís d’ús»: el copyright de la pàgina és el de l'obra, el mateix dels crèdits. */
export const COPYRIGHT_QUE_DINEM = DRETS_QUE_DINEM;

const MotorDeLaRecepta = import.meta.env.VITE_SDP_APP_NEVERA !== '0'
  ? lazy(() => import('./MotorHoritzontalRecepta.jsx').then((modul) => ({ default: modul.MotorDeReceptaEditorial })))
  : null;

const BLOCS = [
  { id: 'ingredients', icona: '🧺', te: () => true },
  { id: 'elaboracio', icona: '🥘', te: () => true },
  { id: 'notes', icona: '📝', te: (r) => r.notes.length > 0 },
  { id: 'video', icona: '▶️', te: (r) => Boolean(r.youtubeId) },
  { id: 'alergens', icona: '⚠️', te: () => true }
];

/* El nom de cada bloc en la llengua de la interfície. Crides literals: la prova de les claus les ha de vore. */
const nomsDeBloc = (tr) => ({
  ingredients: tr('patrimoni.receptes.bloc.ingredients', 'Ingredients'),
  elaboracio: tr('patrimoni.receptes.bloc.elaboracio', 'Elaboració'),
  notes: tr('patrimoni.receptes.bloc.notes', 'Notes'),
  video: tr('patrimoni.receptes.bloc.video', 'Vídeo'),
  lamina: tr('patrimoni.receptes.bloc.lamina', 'Làmina'),
  alergens: tr('patrimoni.receptes.bloc.alergens', 'Al·lèrgens')
});

function heroDeRecepta(recepta, lamina, tr, obra) {
  if (typeof recepta?.foto === 'string' && recepta.foto.trim()) {
    return {
      src: resolRecursPropi(recepta.foto.trim()),
      alt: recepta.fotoAlt || recepta.titol,
      ample: recepta.fotoWidth,
      altPx: recepta.fotoHeight
    };
  }
  if (lamina) {
    return {
      src: resolRecursPropi(lamina.src),
      alt: tr('patrimoni.receptes.altLamina', 'Làmina de la pàgina {n} del llibre', { n: lamina.pagina }),
      ample: lamina.ample,
      altPx: lamina.alt
    };
  }
  return {
    src: resolRecursPropi(PORTADA_FALLBACK_QUE_DINEM),
    alt: obra.titol,
    ample: 1200,
    altPx: 675
  };
}

function BlocsDeText({ blocs, llista }) {
  return blocs.map((bloc, i) => (
    <div key={`${i}-${bloc.titol ?? ''}`}>
      {bloc.titol && <h3 lang="ca">{bloc.titol}</h3>}
      {llista
        ? <ul lang="ca">{bloc.linies.map((linia, j) => <li key={`${j}-${linia}`}>{linia}</li>)}</ul>
        : <div lang="ca">{bloc.linies.map((linia, j) => <p key={`${j}-${linia}`}>{linia}</p>)}</div>}
    </div>
  ));
}

/* PRODUCCIO-03 (revisió R15b) · `onTornaAlReceptari`: dins del Workspace de /page/receptes, la recepta oberta amb un
   clic no canvia la URL, i l'enllaç sol no la tancava. La tornada que hi passa ReceptesWorkspaceSection buida la
   selecció; l'enllaç continua anant al receptari (la ?fitxa= se'n va) i obrint-se en una pestanya nova. */
export function PaginaDeRecepta({ recepta, onTornaAlReceptari }) {
  const { t, language } = useUIActions();
  const tr = useMemo(() => traductorPatrimoni(t), [t]);
  const proposta = useMemo(() => candidatsReceptaQueDinem(recepta, receptaPerSlug), [recepta]);
  const [filtre, setFiltre] = useState(null);
  const [calculaCompra, setCalculaCompra] = useState(false);
  const lamina = laminaDeRecepta(recepta);
  const idAjuda = useId();
  const obra = OBRA_QUE_DINEM;
  const hero = heroDeRecepta(recepta, lamina, tr, obra);
  useSEO({
    title: `${recepta.titol} · ${obra.titol}`,
    description: tr('patrimoni.receptes.seo', 'Recepta {n} del llibre «{llibre}» ({lloc}, {any}): ingredients i elaboració amb el text del llibre.',
      { n: recepta.numero, llibre: obra.titol, lloc: obra.lloc, any: obra.any }),
    index: true
  });
  const { publicadorsRegistrats: publicadorsRecepta } = usePublicadorsBarraRecurs({
    recursTipus: 'recepta',
    recursId: recepta.slug || String(recepta.numero || '')
  });
  const { publicadorsRegistrats: publicadorsLlibre } = usePublicadorsBarraRecurs({
    recursTipus: 'llibre_cataleg',
    recursId: 'que-dinem'
  });
  const publicadorsRegistrats = publicadorsRecepta ?? publicadorsLlibre;
  const noms = nomsDeBloc(tr);
  const blocs = BLOCS.filter((b) => b.te(recepta));
  const visible = (id) => filtre === null || filtre === id;
  return (
    <UniversalPage
      chrome="full"
      title={recepta.titol}
      llenguaDelContingut="ca"
      heroImage={hero.src}
      heroAlt={hero.alt}
      heroWidth={hero.ample}
      heroHeight={hero.altPx}
      heroFetchPriority="high"
      showLogos={true}
      topBarData={{ showPin: false, ...(publicadorsRegistrats ? { publicadorsRegistrats } : {}) }}
      onBack={onTornaAlReceptari}
      copyright={COPYRIGHT_QUE_DINEM}
      labels={[{ text: etiquetaDApartat(tr, recepta.apartat), className: 'sdp-badge-category' }]}
    >
      <div className="sdp-recepta">
        <p>
          {tr('patrimoni.receptes.situacio', 'Recepta {n} de «{llibre}», pàgina {pagina}', { n: recepta.numero, llibre: obra.titol, pagina: recepta.pagina })}
          {' · '}
          <Link to={RUTA_DEL_RECEPTARI} onClick={onTornaAlReceptari}>{tr('patrimoni.receptes.totes', 'Totes les receptes')}</Link>
        </p>
        <div className="sdp-recepta__quadrats" role="tablist" aria-label={tr('patrimoni.receptes.filtre', 'Tria què vols vore')} aria-describedby={idAjuda}>
          {blocs.map((b) => (
            <button
              key={b.id}
              type="button"
              role="tab"
              className="sp-card-calendar-badge"
              aria-selected={filtre === b.id}
              data-bloc={b.id}
              onClick={() => setFiltre((actual) => (actual === b.id ? null : b.id))}
            >
              <span className="sdp-recepta__quadrat-icona sdp-fitxa-emoji-xl" aria-hidden="true">{b.icona}</span>
              <span className="sdp-recepta__quadrat-text">{noms[b.id]}</span>
            </button>
          ))}
        </div>
        <p id={idAjuda} className="sdp-recepta__ajuda">
          {tr('patrimoni.receptes.ajudaFiltre', 'Prem un quadrat per a vore només eixe bloc; torna’l a prémer per a vore-ho tot.')}
        </p>
        {visible('ingredients') && (
          <section aria-label={noms.ingredients} data-bloc="ingredients">
            <h2>{noms.ingredients}</h2>
            <BlocsDeText blocs={recepta.ingredients} llista />
          </section>
        )}
        {visible('elaboracio') && (
          <section aria-label={noms.elaboracio} data-bloc="elaboracio">
            <h2>{noms.elaboracio}</h2>
            <BlocsDeText blocs={recepta.preparacio} llista={false} />
          </section>
        )}
        {recepta.notes.length > 0 && visible('notes') && (
          <section aria-label={noms.notes} data-bloc="notes">
            <h2>{noms.notes}</h2>
            <ul lang="ca">{recepta.notes.map((nota, i) => <li key={`${i}-${nota}`}>{nota}</li>)}</ul>
          </section>
        )}
        {recepta.youtubeId && visible('video') && (
          <section aria-label={noms.video} data-bloc="video">
            <h2>{noms.video}</h2>
            <VideoEditorial id={recepta.youtubeId} title={tr('patrimoni.receptes.titolVideo', 'Elaboració de «{titol}»', { titol: recepta.titol })} />
          </section>
        )}
        {visible('alergens') && (
          <section aria-label={noms.alergens} data-bloc="alergens">
            <h2>{noms.alergens}</h2>
            <Alerta to="avis" viva={false}>
              {tr('patrimoni.receptes.alergens', 'Al·lèrgens no revisats: consulta la llista d’ingredients; si tens una al·lèrgia, pregunta-ho a qui cuina.')}
            </Alerta>
            <CandidatsAlergens proposta={proposta} llengua={language} escandall={false} />
          </section>
        )}
        {MotorDeLaRecepta && (
          <section aria-label="Prepara una compra amb esta recepta">
            <Boto aria-expanded={calculaCompra} onClick={() => setCalculaCompra(actual => !actual)}>Calcula i prepara la compra</Boto>
            {calculaCompra && (
              <Suspense fallback={null}>
                <MotorDeLaRecepta key={recepta.slug} recepta={recepta} obra={obra} />
              </Suspense>
            )}
          </section>
        )}
        <CreditsQueDinem tr={tr} nivell="h2" />
      </div>
    </UniversalPage>
  );
}

/** /receptes/:slug · el slug ve de la URL (itemId del comodí :sectionId/:itemId). */
export default function ReceptaDetailSection() {
  const { itemId } = useParams();
  const recepta = receptaPerSlug(itemId);
  if (!recepta) return <NotFoundPage />;
  return <PaginaDeRecepta key={recepta.slug} recepta={recepta} />;
}
