/**
 * EntitatsDelPoble.jsx · P1-11 (pla 261024_2230, T5B-01; Llibre Mestre
 * P1-11, ordre del Mestre 261024 18:21) · El panell de la segona pestanya de
 * la pàgina d'un poble, «Empreses i entitats»: les empreses, les entitats i
 * els grups públics que declaren eixe poble (organizations.town_name).
 *
 * Cap peça nova: la targeta és la del directori (SectionItemCard, la
 * mateixa de /perfil: «Llegir més» a la fitxa pública, el Connectar
 * centralitzat i el botó gran «Anar al xat» de l'entitat), dins de
 * GraellaTargetes; el Carregant, EstatErrorDades amb «Torna-ho a provar» i
 * el buit amb role=status, com el panell «Gent de …». Cap botó solt de
 * seguir: la relació passa per /connectar (doctrina del Connectar).
 * Les dades, useEntitatsDelPoble (el filtre `poble` del directori, al
 * servidor). El munta la meta de Pobles (detailSectionMeta.jsx) en diferit
 * (lazyRoute) i només quan la persona obri la pestanya: la pàgina del poble
 * no fa cap petició de més si no la mira.
 */
import { useUIActions } from '../../app/contexts/UIContext';
import { useNavigate } from '../../app/contexts/RouterContext';
import SectionItemCard from '../../components/SectionItemCard';
import { Carregant } from '../../components/PedraSeca/atoms/estats.jsx';
import { GraellaTargetes } from '../../components/PedraSeca/organismes/GraellaTargetes.jsx';
import { PortaDePagina } from '../../components/PedraSeca/organismes/PortesTargeta.jsx';
import { SlotErrorBoundary } from '../../components/universal/workspace/SlotErrorBoundary.jsx';
import { objecteDePerfil, rutaConnectarPerfil, rutaDePerfil, rutaXatDePagina } from '../../config/navigation.js';
import { EstatErrorDades } from '../mur/EstatErrorDades.jsx';
import { FalladaDeLHistoric } from '../mur/PublicacionsDeLActor.jsx';
import { useEntitatsDelPoble } from './useEntitatsDelPoble.js';

const senseTraduccio = (_clau, reserva) => reserva;

/* El traductor de l'App, o res fora d'ella (una prova, el catàleg). */
function useTraductor() {
  try {
    return useUIActions().t;
  } catch {
    return senseTraduccio;
  }
}

/* El tipus de la fitxa pública d'una fila del directori (identitatsSeed.js ·
   TIPUS_DE_KIND): un grup és un grup; una empresa o una entitat, entitat. */
const tipusDeKind = (kind) => (kind === 'group' ? 'grup' : 'entitat');

/** Els textos del panell ({ titol, buit, carregant, error, noDisponible, sensePoble }) i les etiquetes de tipus. */
export function textosDeLesEntitats(t = senseTraduccio) {
  const tradueix = typeof t === 'function' ? t : senseTraduccio;
  return {
    titol: '',
    buit: tradueix('section.detail.pobles.entitats.buit', 'Encara no hi ha cap empresa ni entitat d’este poble al directori.'),
    carregant: tradueix('section.detail.pobles.entitats.carregant', 'Carregant les empreses i entitats del poble…'),
    error: tradueix('section.detail.pobles.entitats.error', 'No s’han pogut carregar les empreses i entitats del poble'),
    noDisponible: tradueix('section.detail.pobles.entitats.noDisponible', 'Este servidor encara no llista les empreses i entitats dels pobles.'),
    tipus: {
      company: tradueix('section.detail.pobles.entitats.empresa', 'Empresa'),
      entity: tradueix('section.detail.pobles.entitats.entitat', 'Entitat'),
      group: tradueix('section.detail.pobles.entitats.grup', 'Grup')
    }
  };
}

/* Una fila del directori com a entrada de GraellaTargetes (un id textual propi). */
const entradaDe = (fila) => ({ id: `entitat:${fila.id}`, fila });

function TargetaDeLEntitat({ fila, textos, t, navigate }) {
  const tipus = tipusDeKind(fila.kind);
  const perfil = { tipus, id: fila.id, nom: fila.name };
  const connectar = rutaConnectarPerfil(perfil);
  const desti = rutaXatDePagina(objecteDePerfil(perfil));
  const poble = typeof fila.town_name === 'string' ? fila.town_name.trim() : '';
  return (
    <SectionItemCard
      to={rutaDePerfil(tipus, fila.id)}
      image={fila.logo_url || fila.hero_url || undefined}
      title={fila.name}
      subtitle={fila.lema || undefined}
      excerpt={fila.description || undefined}
      eyebrow={textos.tipus[fila.kind] || textos.tipus.entity}
      buttonLabel={t('common.readMore', 'Llegir més')}
      onConnect={connectar ? () => navigate(connectar) : undefined}
      accio={desti ? <PortaDePagina porta={{ id: 'xat-de-l-entitat', verb: t('section.xat.anarAlXat', 'Anar al xat'), desti, varietat: 'primari' }} /> : null}
      etiquetesAmbAccio
      {...(poble ? { location: poble, avatarUrl: fila.logo_url || undefined } : {})}
    />
  );
}

function EntitatsDelPobleAmbDades({ poble, textos, t }) {
  const navigate = useNavigate();
  const { estat, entitats, error, refresh } = useEntitatsDelPoble(poble);
  if (estat === 'sense-poble' || (estat === 'ready' && !entitats.length)) return <p role="status">{textos.buit}</p>;
  /* C11-01 · Un servidor que no sap el poble de les organitzacions: el mateix avís que sense directori, sense «Torna-ho a provar» fals. */
  if (estat === 'no-disponible' || (estat === 'error' && error?.code === 'NO-DISPONIBLE')) return <p role="status">{textos.noDisponible}</p>;
  if (estat === 'error') return <EstatErrorDades titol={textos.error} error={error} onReintenta={refresh} />;
  if (estat !== 'ready') return <Carregant etiqueta={textos.carregant} />;
  return (
    <GraellaTargetes elements={entitats.map(entradaDe)}>
      {({ id, fila }) => <TargetaDeLEntitat key={id} fila={fila} textos={textos} t={t} navigate={navigate} />}
    </GraellaTargetes>
  );
}

/** Les organitzacions públiques de `poble` (una fitxa de /pobles), dins de la barrera de les targetes. */
export function EntitatsDelPoble({ poble }) {
  const t = useTraductor();
  const textos = textosDeLesEntitats(t);
  return (
    <SlotErrorBoundary
      resetKey={String(poble?.id ?? '')}
      fallback={({ reinicia }) => <FalladaDeLHistoric t={t} textos={textos} reinicia={reinicia} />}
    >
      <EntitatsDelPobleAmbDades poble={poble} textos={textos} t={t} />
    </SlotErrorBoundary>
  );
}

export default EntitatsDelPoble;
