import { useId, useMemo, useState } from 'react';
import { Link, useParams } from '../../app/contexts/RouterContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { VideoEditorial } from '../../components/universal/VideoEditorial.jsx';
import { Alerta, Boto } from '../../components/PedraSeca/index.js';
import { resolRecursPropi } from '../../config/assetResolver.js';
import { useSEO } from '../../hooks/useSEO.js';
import NotFoundPage from '../../pages/NotFoundPage';
import { OBRA_QUE_DINEM, receptaPerSlug } from '../../data/patrimoni/queDinem.js';
import CreditsQueDinem from './CreditsQueDinem.jsx';
import { etiquetaDApartat, RUTA_DEL_RECEPTARI } from './cercaReceptes.js';
import { traductorPatrimoni } from './textosPatrimoni.js';

/* Onada R14 · /receptes/:slug: la pàgina pròpia d'una recepta del llibre «Què dinem?» (ItemDetailSection la carrega
   en un tros diferit quan sectionId és 'receptes'). La recepta es busca pel slug exacte (receptaPerSlug): un slug que
   no existix dona el «no trobat» canònic (NotFoundPage, amb noindex), mai una altra recepta.
   · Capçalera: el vídeo del llibre (VideoEditorial: youtube-nocookie i façana de clic) si en té; si no, la làmina.
     Si en té tots dos, un commutador centrat tria què es veu a dalt.
   · Una fila de quadrats-botó (la pell del quadrat de les targetes, .sp-card-calendar-badge) amb aria-pressed:
     prémer-ne un mostra només eixe bloc; tornar-lo a prémer ho mostra tot. Els blocs que la recepta no té
     (notes, vídeo, làmina) no tenen quadrat.
   · Ingredients, elaboració i notes: el text literal del llibre, amb lang="ca"; els títols de bloc que porta el
     llibre (p. ex. «Variant») es conserven. La interfície és a les claus patrimoni.receptes.* dels 5 diccionaris.
   · Al·lèrgens: el llibre no en diu res i ací no se n'inventa cap; només un avís honest. */
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

function Lamina({ recepta, tr }) {
  return (
    <figure className="sdp-recepta__lamina">
      <img
        src={resolRecursPropi(recepta.lamina)}
        alt={tr('patrimoni.receptes.altLamina', 'Làmina de la pàgina {n} del llibre', { n: recepta.pagina })}
        loading="lazy"
        decoding="async"
      />
    </figure>
  );
}

/* La tria del commutador (vista) viu a la pàgina: un filtre que amaga la capçalera no l'oblida. */
function Capcalera({ recepta, filtre, vista, setVista, noms, tr }) {
  const ambVideo = Boolean(recepta.youtubeId);
  const ambLamina = Boolean(recepta.lamina);
  if (!ambVideo && !ambLamina) return null;
  const mode = filtre === 'video' || filtre === 'lamina' ? filtre : vista;
  return (
    <div className="sdp-recepta__capcalera">
      {mode === 'video' && ambVideo
        ? <VideoEditorial id={recepta.youtubeId} title={tr('patrimoni.receptes.titolVideo', 'Elaboració de «{titol}»', { titol: recepta.titol })} />
        : ambLamina && <Lamina recepta={recepta} tr={tr} />}
      {filtre === null && ambVideo && ambLamina && (
        <div className="sdp-recepta__commutador" role="group" aria-label={tr('patrimoni.receptes.vista', 'Què vols vore a dalt?')}>
          <Boto varietat={vista === 'video' ? 'primari' : 'secundari'} aria-pressed={vista === 'video'} onClick={() => setVista('video')}>
            {noms.video}
          </Boto>
          <Boto varietat={vista === 'lamina' ? 'primari' : 'secundari'} aria-pressed={vista === 'lamina'} onClick={() => setVista('lamina')}>
            {tr('patrimoni.receptes.vista.lamina', 'Làmina del llibre')}
          </Boto>
        </div>
      )}
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

function PaginaDeRecepta({ recepta }) {
  const { t } = useUIActions();
  const tr = useMemo(() => traductorPatrimoni(t), [t]);
  const [filtre, setFiltre] = useState(null);
  const [vista, setVista] = useState(recepta.youtubeId ? 'video' : 'lamina');
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
          <Link to={RUTA_DEL_RECEPTARI}>{tr('patrimoni.receptes.totes', 'Totes les receptes')}</Link>
        </p>
        {(filtre === null || filtre === 'video' || filtre === 'lamina') && (
          <Capcalera recepta={recepta} filtre={filtre} vista={vista} setVista={setVista} noms={noms} tr={tr} />
        )}
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
        {visible('alergens') && (
          <section aria-label={noms.alergens} data-bloc="alergens">
            <h2>{noms.alergens}</h2>
            <Alerta to="avis" viva={false}>
              {tr('patrimoni.receptes.alergens', 'Al·lèrgens no revisats: consulta la llista d’ingredients; si tens una al·lèrgia, pregunta-ho a qui cuina.')}
            </Alerta>
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
