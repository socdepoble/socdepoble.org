import { useMemo } from 'react';
import CatalegWorkspace from '../../components/universal/CatalegWorkspace.jsx';
import { useSessioOpcional } from '../../app/contexts/SessionContext.jsx';
import { UniversalPage } from '../../components/universal/UniversalPage.jsx';
import { usePublicadorsBarraRecurs } from '../../hooks/usePublicadorsBarraRecurs.js';
import { resolRecursPropi } from '../../config/assetResolver.js';
import { useSEO } from '../../hooks/useSEO.js';
import { OBRA_QUE_DINEM, RECEPTES_QUE_DINEM, laminaDeRecepta } from '../../data/patrimoni/queDinem.js';
import TextSection from '../text/TextSection';
import CreditsQueDinem from './CreditsQueDinem.jsx';
import { useUIActions } from '../../app/contexts/UIContext';
import { etiquetaDApartat } from './cercaReceptes.js';
import { traductorPatrimoni } from './textosPatrimoni.js';
import { COPYRIGHT_QUE_DINEM, PaginaDeRecepta } from './ReceptaDetailSection.jsx';
import { adoptaFullDiferit } from '../../config/fullDiferit.js';
import { etiquetesDePaginaPublica } from '../../data/taxonomia/classificacioPaginesPubliques.js';
import cssReceptes from '../../css/diferit-receptes.css?inline';

const adoptaEstilsReceptes = (node) => { if (node) adoptaFullDiferit(node, 'receptes', cssReceptes); };

export const ID_LLIBRE_QUE_DINEM = 'que-dinem';
export const PORTADA_LLIBRE_QUE_DINEM = '/assets/uploads/patrimoni/portada_que_dinem_muro.webp';

/* C26-2 #4 (Gauntlet c13) · IDEA-365 (21:58, punt 1: paritat absoluta Card ↔ UniversalPage) i IDEA-367 (23:06,
   punt 3: «Què dinem?» porta Mur + Catàlegs + PDF, FORA Sistema) · La portada del llibre porta les MATEIXES
   Categories de Sistema que la seua card del /mur (targetesMur.js, la mateixa clau pública), en la llengua de
   la interfície, i darrere el lloc i l'any de l'edició. Eixa darrera és una metadada del registre, no
   taxonomia (D3 de l'integrador): text inert, sense /categoria/muro-el-comtat-2019. */
export function etiquetesDeLaPortadaQueDinem(idioma = 'ca') {
  return [
    ...etiquetesDePaginaPublica(ID_LLIBRE_QUE_DINEM, [], idioma),
    { text: `${OBRA_QUE_DINEM.lloc} · ${OBRA_QUE_DINEM.any}`, className: 'sdp-badge-category', inerta: true }
  ];
}

/* Onada R15b (RV-06) · El text alternatiu de la làmina de cada targeta diu la pàgina on és impresa (la 79 → p. 89,
   la 115 → p. 127), en la llengua de la interfície: la mateixa regla que ReceptaDetailSection i ReceptesQueDinemSection
   (R15 P3-1), que /page/receptes ja no munta des que hi va el Workspace. */
const targetaDeLamina = (recepta, tr) => {
  const lamina = laminaDeRecepta(recepta);
  return { imageUrl: lamina?.src, imageAlt: lamina ? tr('patrimoni.receptes.altLamina', 'Làmina de la pàgina {n} del llibre', { n: lamina.pagina }) : '' };
};

function PortadaLlibreQueDinem({ tr, idioma, onTorna }) {
  const obra = OBRA_QUE_DINEM;
  const portadaSrc = resolRecursPropi(PORTADA_LLIBRE_QUE_DINEM);
  const { publicadorsRegistrats } = usePublicadorsBarraRecurs({
    recursTipus: 'llibre_cataleg',
    recursId: ID_LLIBRE_QUE_DINEM
  });
  useSEO({
    title: `${obra.titol} · Receptari de Muro`,
    description: `Les ${RECEPTES_QUE_DINEM.length} receptes del llibre «${obra.titol}», editat a ${obra.lloc} el ${obra.any} per l’${obra.associacio}.`,
    image: PORTADA_LLIBRE_QUE_DINEM,
    index: true
  });
  return (
    <UniversalPage
      chrome="full"
      title={obra.titol}
      subtitle={`El receptari de ${obra.lloc} (${obra.any}), amb el text i les làmines del llibre`}
      lead={`Les ${RECEPTES_QUE_DINEM.length} receptes del llibre «${obra.titol}», que l’${obra.associacio} va editar a ${obra.lloc} el ${obra.any}: cada recepta amb els ingredients i l’elaboració i, quan en té, la làmina del llibre i el vídeo del canal de l’associació.`}
      llenguaDelContingut="ca"
      heroImage={portadaSrc}
      heroAlt={`Portada del llibre «${obra.titol}» de l’${obra.associacio} (${obra.lloc}, ${obra.any})`}
      heroWidth={1200}
      heroHeight={675}
      heroFetchPriority="high"
      showLogos={true}
      topBarData={{
        showPin: false,
        ...(publicadorsRegistrats ? { publicadorsRegistrats } : null)
      }}
      onBack={onTorna}
      copyright={COPYRIGHT_QUE_DINEM}
      labels={etiquetesDeLaPortadaQueDinem(idioma)}
    >
      <div ref={adoptaEstilsReceptes} className="sdp-recepta">
        <p lang="ca">
          Tria un apartat a la primera columna o qualsevol de les <strong>{RECEPTES_QUE_DINEM.length} receptes</strong> a la segona columna per obrir-ne la fitxa completa amb la seua adreça compartible.
        </p>
        <CreditsQueDinem tr={tr} nivell="h3" />
      </div>
    </UniversalPage>
  );
}

export default function ReceptesWorkspaceSection({ page, accioPrincipal, children, itemSlug = null, sincronitzaRuta = false }) {
  const { t, language = 'ca' } = useUIActions();
  const esSuperadmin = useSessioOpcional()?.esSuperadmin === true;
  const tr = useMemo(() => traductorPatrimoni(t), [t]);
  const model = useMemo(() => ({
    status: 'ready',
    /* Onada R29 · R29-02-1b · El receptari és estàtic i complet: una ?fitxa= que no hi és mostra
       «L’element no és accessible o ja no existix.» (sense cap reserva, per canAutoSelect), no un error
       de càrrega amb un Reintentar inútil. Una referència publicada que arribe després s'obri sola. */
    itemsComplete: true,
    canAutoSelect: () => false,
    categories: [
      {
        id: ID_LLIBRE_QUE_DINEM,
        slugRuta: ID_LLIBRE_QUE_DINEM,
        label: `${OBRA_QUE_DINEM.titol} · Muro (${OBRA_QUE_DINEM.any})`,
        count: RECEPTES_QUE_DINEM.length,
        expandOnSelect: true,
        selectOnRepeat: true
      },
      ...OBRA_QUE_DINEM.apartats.map(a => ({
        id: a.id,
        parentId: ID_LLIBRE_QUE_DINEM,
        llibreId: ID_LLIBRE_QUE_DINEM,
        label: a.titol || a.nom || a.id,
        count: RECEPTES_QUE_DINEM.filter(r => r.apartat === a.id).length
      }))
    ],
    items: RECEPTES_QUE_DINEM.map(recepta => ({
      id: recepta.slug,
      slugRuta: recepta.slug,
      title: recepta.titol,
      subtitle: `${etiquetaDApartat(tr, recepta.apartat)} · p. ${recepta.pagina}`,
      lead: `${OBRA_QUE_DINEM.titol} · ${OBRA_QUE_DINEM.lloc} (${OBRA_QUE_DINEM.any})`,
      categoryIds: [ID_LLIBRE_QUE_DINEM, recepta.apartat],
      glyph: '🍲',
      recepta,
      ...targetaDeLamina(recepta, tr),
      searchText: [recepta.titol, ...recepta.ingredients.flatMap(bloc => bloc.linies)].join(' ')
    }))
  }), [tr]);

  return (
    <CatalegWorkspace
      font="receptes"
      destiPublicacio="receptes"
      id="receptes-p069"
      ruta="/page/receptes"
      model={model}
      inclouDescendents
      afegirCataleg={esSuperadmin}
      permetreAfigCataleg
      itemSlug={itemSlug}
      sincronitzaRuta={sincronitzaRuta}
      labels={{ categories: 'Catàlegs', items: 'Receptes', all: `Totes les receptes (${RECEPTES_QUE_DINEM.length})` }}
      renderDetail={({ item, selection, onClose }) => {
        if (item) {
          return <PaginaDeRecepta key={item.id} recepta={item.recepta} onTornaAlReceptari={onClose} />;
        }
        const esDinsDelLlibre = selection?.categoryId && selection.categoryId !== '__all__';
        if (esDinsDelLlibre) {
          return <PortadaLlibreQueDinem tr={tr} idioma={language} onTorna={onClose} />;
        }
        return (
          <TextSection page={page} pageKey="receptes" accioPrincipal={accioPrincipal}>
            <CreditsQueDinem tr={tr} />
            {children}
          </TextSection>
        );
      }}
    />
  );
}
