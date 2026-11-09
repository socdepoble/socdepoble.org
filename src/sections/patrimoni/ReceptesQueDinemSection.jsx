import { useMemo, useState } from 'react';
import { Boto, Camp, CampText, Selector, UniversalCard } from '../../components/PedraSeca/index.js';
import { useUIActions, useUIStateOpcional } from '../../app/contexts/UIContext';
import { useNavigate } from '../../app/contexts/RouterContext';
import { traduccioDePaginesDisponible } from '../../components/PedraSeca/hooks/useTraduccioPagina.js';
import { OBRA_QUE_DINEM, RECEPTES_QUE_DINEM, laminaDeRecepta } from '../../data/patrimoni/queDinem.js';
import CreditsQueDinem from './CreditsQueDinem.jsx';
import { etiquetaDApartat, filtraReceptes, rutaDeRecepta } from './cercaReceptes.js';
import { traductorPatrimoni } from './textosPatrimoni.js';

/* Onada R14 · /page/receptes: el receptari «Què dinem?» de l'Associació Gastronòmica i Cultural «Fins rebentar com
   Sangonereta» (Muro, El Comtat, 2019), davall del text breu de PAGE_COPY (PageDetailSection el carrega en un tros
   diferit, com el banc de llavors). Una targeta per recepta, amb la làmina del llibre i el quadrat de la recepta, que
   és un botó i obri la seua pàgina (/receptes/:slug). Només hi ha el que dona el llibre: títol, pàgina, apartat,
   ingredients, elaboració, notes, vídeo i làmina. Cap al·lergen, preu, ració ni estació: el llibre no en dona.
   Tots els recomptes ixen de les dades (RECEPTES_QUE_DINEM): cap xifra escrita a mà. La interfície és a les claus
   patrimoni.receptes.* dels 5 diccionaris; el text del llibre, sempre literal i amb lang="ca". */
const MIDA = 24;

/* El quadrat de la targeta (SquareBadge amb onClick pinta un <button>): «🍲 RECEPTA», el número del llibre i, si en
   té, «▶ VÍDEO». El nom accessible diu què fa. Es construïx ací, al tros diferit: SquareBadge (a l'entrada) no canvia.
   La targeta porta llenguaContingut="ca" (el títol és del llibre); la pàgina i l'apartat, que són de la interfície,
   van a les etiquetes i no al subtítol, que heretaria eixe lang. */
function quadratDeRecepta(recepta, tr, navega) {
  const etiqueta = tr('patrimoni.receptes.quadrat.obri', 'Obri la recepta {n}: {titol}', { n: recepta.numero, titol: recepta.titol });
  return {
    type: 'custom',
    label: recepta.youtubeId ? `${etiqueta} (${tr('patrimoni.receptes.quadrat.ambVideo', 'amb vídeo')})` : etiqueta,
    content: (
      <>
        <span className="sp-card-calendar-badge__mes"><span aria-hidden="true">🍲</span> {tr('patrimoni.receptes.quadrat.recepta', 'RECEPTA')}</span>
        <span className="sp-card-calendar-badge__dia">{recepta.numero}</span>
        {recepta.youtubeId && (
          <span className="sp-card-calendar-badge__any"><span aria-hidden="true">▶</span> {tr('patrimoni.receptes.quadrat.video', 'VÍDEO')}</span>
        )}
      </>
    ),
    onClick: () => navega(rutaDeRecepta(recepta))
  };
}

/* Onada R15 (P3-1) · El text alternatiu de la làmina diu la pàgina on és impresa (la 79 → p. 89, la 115 → p. 127). */
const altDeLamina = (recepta, tr) => {
  const lamina = laminaDeRecepta(recepta);
  return lamina ? tr('patrimoni.receptes.altLamina', 'Làmina de la pàgina {n} del llibre', { n: lamina.pagina }) : '';
};

/** Cos viu de TextSection a /page/receptes. */
export default function ReceptesQueDinemSection() {
  const { t } = useUIActions();
  /* Onada R15 (P3-6) · El botó Traduir només traduïx on hi ha servei (el mateix criteri que useTraduccioPagina i
     /traduccions): al web propi sí; a l'app nativa, no, i el botó ho diu. La frase diu el mateix que el botó. */
  const traduccioDisponible = traduccioDePaginesDisponible(useUIStateOpcional()?.externalConfig?.traductorUrl);
  const navega = useNavigate();
  const tr = useMemo(() => traductorPatrimoni(t), [t]);
  const [apartat, setApartat] = useState('');
  const [cerca, setCerca] = useState('');
  const [limit, setLimit] = useState(MIDA);
  const receptes = useMemo(() => filtraReceptes(apartat, cerca), [apartat, cerca]);
  const total = RECEPTES_QUE_DINEM.length;
  const titol = tr('patrimoni.receptes.titol', 'Les {n} receptes del llibre', { n: total });
  const ambVideo = RECEPTES_QUE_DINEM.filter((r) => r.youtubeId).length;
  const ambLamina = RECEPTES_QUE_DINEM.filter((r) => r.lamina).length;
  const opcions = [
    { valor: '', etiqueta: `${tr('patrimoni.receptes.totsApartats', 'Tots els apartats')} (${total})` },
    ...OBRA_QUE_DINEM.apartats.map((a) => ({
      valor: a.id,
      etiqueta: `${etiquetaDApartat(tr, a.id)} (${RECEPTES_QUE_DINEM.filter((r) => r.apartat === a.id).length})`
    }))
  ];
  return (
    <section aria-label={titol}>
      <h3>{titol}</h3>
      <p>
        {tr('patrimoni.receptes.recompte', '{videos} tenen vídeo i {lamines} porten la làmina del llibre.', { videos: ambVideo, lamines: ambLamina })}{' '}
        {tr('patrimoni.receptes.literal', 'Els títols, els ingredients, l’elaboració i les notes són el text literal del llibre, en la seua llengua, i no s’hi afig res.')}{' '}
        {traduccioDisponible
          ? tr('patrimoni.receptes.traduir', 'El botó Traduir en dona una traducció automàtica.')
          : tr('patrimoni.receptes.traduirNoDisponible', 'Ací la traducció automàtica no està disponible.')}
      </p>
      <CreditsQueDinem tr={tr} />
      <Camp etiqueta={tr('patrimoni.receptes.apartat', 'Apartat del llibre')}>
        <Selector value={apartat} onChange={(e) => { setApartat(e.target.value); setLimit(MIDA); }} opcions={opcions} />
      </Camp>
      <Camp etiqueta={tr('patrimoni.receptes.cerca', 'Cerca pel títol o per un ingredient')}>
        <CampText tipus="search" value={cerca} onChange={(e) => { setCerca(e.target.value); setLimit(MIDA); }} />
      </Camp>
      <p role="status">{tr('patrimoni.font.resultats', '{n} de {total}', { n: receptes.length, total })}</p>
      {receptes.length ? (
        <div className="sdp-card-grid">
          {receptes.slice(0, limit).map((recepta) => (
            <UniversalCard
              key={recepta.slug}
              title={recepta.titol}
              llenguaContingut="ca"
              imageUrl={recepta.lamina || undefined}
              imageAlt={altDeLamina(recepta, tr)}
              mainHref={rutaDeRecepta(recepta)}
              squareBadge={quadratDeRecepta(recepta, tr, navega)}
              labels={[
                { text: etiquetaDApartat(tr, recepta.apartat), className: 'sdp-badge-category' },
                { text: tr('patrimoni.receptes.pagina', 'Pàgina {n} del llibre', { n: recepta.pagina }), className: 'sdp-badge-tag' }
              ]}
              hasFooter={false}
            />
          ))}
        </div>
      ) : <p>{tr('patrimoni.font.buit', 'No hi ha cap resultat amb esta cerca.')}</p>}
      {limit < receptes.length && <Boto onClick={() => setLimit((n) => n + MIDA)}>{tr('patrimoni.font.mes', 'Mostra’n més')}</Boto>}
    </section>
  );
}
