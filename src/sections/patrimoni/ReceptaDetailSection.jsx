import { lazy, Suspense, useId, useMemo, useState } from 'react';
import { Link, useParams } from '../../app/contexts/RouterContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { VideoEditorial } from '../../components/universal/VideoEditorial.jsx';
import { Alerta, Boto } from '../../components/PedraSeca/index.js';
import { resolRecursPropi } from '../../config/assetResolver.js';
import { useSEO } from '../../hooks/useSEO.js';
import NotFoundPage from '../../pages/NotFoundPage';
import { OBRA_QUE_DINEM, laminaDeRecepta, receptaPerSlug } from '../../data/patrimoni/queDinem.js';
import CreditsQueDinem from './CreditsQueDinem.jsx';
import { CandidatsAlergens } from '../../components/PedraSeca/molecules/CandidatsAlergens.jsx';
import { candidatsReceptaQueDinem } from '../../data/menjarIBeure/candidatsAlergens.js';
import { etiquetaDApartat, RUTA_DEL_RECEPTARI } from './cercaReceptes.js';
import { traductorPatrimoni } from './textosPatrimoni.js';

/* Onada R14 · /receptes/:slug: la pàgina pròpia d'una recepta del llibre «Què dinem?» (ItemDetailSection la carrega
   en un tros diferit quan sectionId és 'receptes'). La recepta es busca pel slug exacte (receptaPerSlug): un slug que
   no existix dona el «no trobat» canònic (NotFoundPage, amb noindex), mai una altra recepta.
   · Capçalera: la làmina del llibre, si en té (148 de les 149). És la candidata a LCP de la pàgina: porta l'ample i
     l'alt de la WebP (LAMINES_QUE_DINEM, la pàgina no salta en carregar-la), loading="eager" i
     fetchpriority="high". El text alternatiu diu la pàgina on és impresa la làmina, que no sempre és la primera de
     la recepta (la 79 → p. 89, la 115 → p. 127).
   · Una fila de quadrats-botó (la pell del quadrat de les targetes, .sp-card-calendar-badge) amb aria-pressed:
     prémer-ne un mostra només eixe bloc; tornar-lo a prémer ho mostra tot. Els blocs que la recepta no té
     (notes, vídeo, làmina) no tenen quadrat.
   · Onada R15 (P3-4) · Un sol botó «Vídeo»: el quadrat. El vídeo és un bloc com els altres, davall de les notes,
     i hi va la façana de VideoEditorial (youtube-nocookie): res de YouTube no es carrega fins que el veí prem
     «Veure el vídeo». Abans hi havia, a més, un commutador «Vídeo / Làmina del llibre» a la capçalera, que
     repetia el quadrat.
   · Ingredients, elaboració i notes: el text literal del llibre, amb lang="ca"; els títols de bloc que porta el
     llibre (p. ex. «Variant») es conserven. La interfície és a les claus patrimoni.receptes.* dels 5 diccionaris.
   · Al·lèrgens: el llibre no en diu res. Onada R15b (RV-01, RV-02) · Damunt de l'avís honest, la proposta assistida
     del lèxic tancat (CandidatsAlergens), amb l'etiqueta «Proposta assistida · Pendent de validació humana» en la
     llengua de la interfície: «•», «T» o «? Sense dada», mai una absència. Llig els ingredients paraula a paraula, i
     l'elaboració i les notes només hi afigen indicis. Sense la línia d'escandall: la fitxa pública no en té.
   · Onada R15 (P1-02, R15-REG-06, P2-04) · «Calcula i prepara la compra» (MotorHoritzontalRecepta, amb el catàleg i
     els preus de Mercadona) va amb la Nevera: la mateixa porta de compilació que src/apps/nevera/manifest.js, com a
     literal exacte que Vite plega. Sense VITE_SDP_APP_NEVERA=1, el build públic no porta ni el botó, ni el motor, ni
     el tros de Mercadona, i la pàgina és la del R14 més la proposta d'al·lèrgens. En desenvolupament, sí. */
const MotorDeLaRecepta = import.meta.env.DEV || import.meta.env.VITE_SDP_APP_NEVERA === '1'
  ? lazy(() => import('./MotorHoritzontalRecepta.jsx').then((modul) => ({ default: modul.MotorDeReceptaEditorial })))
  : null;
const BLOCS = [
  { id: 'ingredients', icona: '🧺', te: () => true },
  { id: 'elaboracio', icona: '🥘', te: () => true },
  { id: 'notes', icona: '📝', te: (r) => r.notes.length > 0 },
  { id: 'video', icona: '▶️', te: (r) => Boolean(r.youtubeId) },
  { id: 'lamina', icona: '🖼️', te: (r) => Boolean(r.lamina) },
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

/* La làmina de capçalera: les mides reserven el lloc i, com que és la imatge gran de dalt, es demana de seguida. */
function Lamina({ lamina, tr }) {
  return (
    <div className="sdp-recepta__capcalera">
      <figure className="sdp-recepta__lamina">
        <img
          src={resolRecursPropi(lamina.src)}
          alt={tr('patrimoni.receptes.altLamina', 'Làmina de la pàgina {n} del llibre', { n: lamina.pagina })}
          width={lamina.ample}
          height={lamina.alt}
          loading="eager"
          fetchpriority="high"
        />
      </figure>
    </div>
  );
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
  useSEO({
    title: `${recepta.titol} · ${obra.titol}`,
    description: tr('patrimoni.receptes.seo', 'Recepta {n} del llibre «{llibre}» ({lloc}, {any}): ingredients i elaboració amb el text del llibre.',
      { n: recepta.numero, llibre: obra.titol, lloc: obra.lloc, any: obra.any }),
    index: true
  });
  const noms = nomsDeBloc(tr);
  const blocs = BLOCS.filter((b) => b.te(recepta));
  const visible = (id) => filtre === null || filtre === id;
  return (
    <UniversalPage
      title={recepta.titol}
      llenguaDelContingut="ca"
      labels={[{ text: etiquetaDApartat(tr, recepta.apartat), className: 'sdp-badge-category' }]}
    >
      <div className="sdp-recepta">
        <p>
          {tr('patrimoni.receptes.situacio', 'Recepta {n} de «{llibre}», pàgina {pagina}', { n: recepta.numero, llibre: obra.titol, pagina: recepta.pagina })}
          {' · '}
          <Link to={RUTA_DEL_RECEPTARI} onClick={onTornaAlReceptari}>{tr('patrimoni.receptes.totes', 'Totes les receptes')}</Link>
        </p>
        {lamina && visible('lamina') && <Lamina lamina={lamina} tr={tr} />}
        <div className="sdp-recepta__quadrats" role="group" aria-label={tr('patrimoni.receptes.filtre', 'Tria què vols vore')} aria-describedby={idAjuda}>
          {blocs.map((b) => (
            <button
              key={b.id}
              type="button"
              className="sp-card-calendar-badge"
              aria-pressed={filtre === b.id}
              data-bloc={b.id}
              onClick={() => setFiltre((actual) => (actual === b.id ? null : b.id))}
            >
              <span className="sdp-recepta__quadrat-icona" aria-hidden="true">{b.icona}</span>
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
