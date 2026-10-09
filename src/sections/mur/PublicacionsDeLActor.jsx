/**
 * PublicacionsDeLActor.jsx — «Ja publicat»: el que l'actor actiu ja té
 * publicat en una secció (Mur, Mercat o Esdeveniments), amb la targeta
 * canònica de cada secció.
 *
 * Esmena 2 del pla 261007_1645 (ordre del Mestre, 261007: «En seleccionar la
 * carpeta 'Mur' o 'Mercat' i el perfil 'Sóc de Poble', la part inferior de la
 * nota hauria de llistar totes les notícies/productes ja publicades en eixe
 * context per al perfil actiu […] Cal portar eixa lògica a tot el sistema») ·
 * Una sola peça per a tot el sistema: les dades les dona
 * usePublicacionsDeLActor (el Mur pel port, filtrat per l'actor) i la pell és
 * la de sempre, sense cap targeta nova:
 *  · mercat → TargetaDelMercat, la UniversalCard de /mercat;
 *  · mur i events → TargetaDelMur, amb el model de l'acte, com MurSection;
 *  · dins de GraellaTargetes (Pedra Seca), la graella de .sdp-card-grid.
 * Mentre carrega, el Carregant de Pedra Seca; si falla, EstatErrorDades amb
 * «Torna-ho a provar» (el refresh del Mur); sense cap element, un text breu.
 * Totes les publicacions, sense límit (pregunta oberta al Mestre).
 *
 * On va · Al Bloc de Notes i a una publicació del MAS oberta, per la ranura
 * `peuDePagina` de PageFrame: dins de la pàgina que fa scroll i fora de
 * l'article, de manera que ni l'Índex de la nota ni la traducció ni el Lector
 * recullen els títols de les targetes.
 */
import { useUIActions } from '../../app/contexts/UIContext';
import { Alerta, Boto, Carregant, GraellaTargetes } from '../../components/PedraSeca/index.js';
import { SlotErrorBoundary } from '../../components/universal/workspace/SlotErrorBoundary.jsx';
import { TargetaDelMercat } from '../mercat/TargetaDelMercat.jsx';
import { EstatErrorDades } from './EstatErrorDades.jsx';
import { TargetaDelMur } from './TargetaDelMur.jsx';
import { textosDeLHistoric, usePublicacionsDeLActor, useVeuHistoric } from './usePublicacionsDeLActor.js';

/* La capçalera de la regió: h2 per defecte (davall de l'H1 de la pàgina);
   un altre nivell només on la pàgina ja en porta de més alts (el catàleg). */
const NIVELLS = new Set(['h2', 'h3', 'h4', 'h5', 'h6']);
/* Mentre el Mur carrega o revalida, les seues llistes són buides: no és cap «buit». */
const PENDENTS = new Set(['loading', 'revalidating']);
const CAP = Object.freeze([]);

/* El traductor de l'App, o res fora d'ella (l'espècimen muntat sol). La forma
   `return useX()` dins d'un try és la que rules-of-hooks accepta. */
function useTraductor() {
  try {
    return useUIActions().t;
  } catch {
    return undefined;
  }
}

/* La targeta canònica de cada secció. Revisió adversarial del 261007 · La
   key la posa esta funció: GraellaTargetes només fa llista.map(pinta).
   Onada 6 (pàgina del poble) · Una llista que barreja seccions (les targetes
   d'un poble: Mur, Agenda i Mercat) porta la secció a cada entrada, i mana
   sobre la de la regió. Sense, la de la regió, com sempre. */
const targetaDe = (seccio) => ({ id, item, esdeveniment, seccio: propia }) => ((propia ?? seccio) === 'mercat'
  ? <TargetaDelMercat key={id} item={item} />
  : <TargetaDelMur key={id} item={item} esdeveniment={esdeveniment} />);

/**
 * La vista, sense dades pròpies: el que pinta la regió per a una font
 * ({ elements, estat, error, refresh }). La munten PublicacionsDeLActor i
 * l'espècimen del catàleg. Una secció sense històric no pinta res.
 * Onada 6 (pàgina del poble) · `textos` ({ titol, buit, carregant, error })
 * substituïx els de l'històric de la secció: la mateixa vista per a una altra
 * font (les publicacions d'un poble, pobles/PublicacionsDelPoble.jsx).
 * Un `titol` buit no pinta cap capçalera. Sense `textos`, com sempre.
 */
export function VistaPublicacionsDeLActor({ seccio, elements = CAP, estat = 'ready', error = null, refresh = null, nivell = 'h2', textos: textosPropis = null }) {
  const t = useTraductor();
  const textos = textosPropis || textosDeLHistoric(seccio, t);
  if (!textos) return null;
  const Titol = NIVELLS.has(nivell) ? nivell : 'h2';
  const llista = Array.isArray(elements) ? elements : CAP;
  let cos;
  if (estat === 'error') cos = <EstatErrorDades titol={textos.error} error={error} onReintenta={refresh} />;
  else if (PENDENTS.has(estat) && !llista.length) cos = <Carregant etiqueta={textos.carregant} />;
  else if (!llista.length) cos = <p role="status">{textos.buit}</p>;
  else cos = <GraellaTargetes elements={llista}>{targetaDe(seccio)}</GraellaTargetes>;
  return (
    <>
      {textos.titol ? <Titol>{textos.titol}</Titol> : null}
      {cos}
    </>
  );
}

/* Si una targeta, o el càlcul de les dades (itemsPublicatsDe, el model de
   l'acte, el moment de cada targeta), peta amb un element remot malformat, la
   regió ho diu i deixa tornar-ho a provar; la pàgina de damunt, i a l'editor
   el cos que s'escriu, continuen (sense, l'EditorErrorBoundary de la closca
   s'enduria l'editor sencer). Res fora de Pedra Seca: Alerta i Boto.
   Onada 6 · Exportada, amb els `textos` propis de qui la munta (la pestanya
   d'un poble); sense, els de l'històric de la secció. */
export function FalladaDeLHistoric({ seccio, t, nivell, reinicia, textos: textosPropis = null }) {
  const textos = textosPropis || textosDeLHistoric(seccio, t);
  if (!textos) return null;
  const tradueix = typeof t === 'function' ? t : (_clau, reserva) => reserva;
  const Titol = NIVELLS.has(nivell) ? nivell : 'h2';
  return (
    <>
      {textos.titol ? <Titol>{textos.titol}</Titol> : null}
      <Alerta to="error" titol={textos.error} accions={<Boto onClick={reinicia}>{tradueix('common.reintenta', 'Torna-ho a provar')}</Boto>}>
        {tradueix('section.notes.historic.fallada', 'La resta de la pàgina continua com sempre.')}
      </Alerta>
    </>
  );
}

/* Les dades i la vista, dins de la barrera. Revisió adversarial del 261007 ·
   El hook es crida ací, i no a PublicacionsDeLActor: un càlcul que peta queda
   dins del SlotErrorBoundary, com una targeta que peta. */
function PublicacionsDeLActorAmbDades({ seccio, exclouId, nivell }) {
  const font = usePublicacionsDeLActor(seccio, { exclouId });
  if (!font.ambActor) return null;
  return <VistaPublicacionsDeLActor seccio={seccio} {...font} nivell={nivell} />;
}

/**
 * Les publicacions de l'actor actiu en `seccio`, sense `exclouId` (l'element
 * que ja està obert damunt). Dins d'un SlotErrorBoundary (la maquinària dels
 * panells del Workspace), que es reinicia en canviar de secció o d'element
 * obert. Decisió per defecte del Mestre (261007) · el Foraster no veu cap
 * històric: sense actor, o amb el convidat que IdentitatContext posa quan no
 * hi ha sessió, res (useVeuHistoric, la mateixa regla que el peu de
 * NotesEditor i de PublicacioDetall).
 */
export function PublicacionsDeLActor({ seccio, exclouId = null, nivell = 'h2' }) {
  const veu = useVeuHistoric(seccio);
  const t = useTraductor();
  if (!veu) return null;
  return (
    <SlotErrorBoundary
      resetKey={`${seccio}:${exclouId ?? ''}`}
      fallback={({ reinicia }) => <FalladaDeLHistoric seccio={seccio} t={t} nivell={nivell} reinicia={reinicia} />}
    >
      <PublicacionsDeLActorAmbDades seccio={seccio} exclouId={exclouId} nivell={nivell} />
    </SlotErrorBoundary>
  );
}

export default PublicacionsDeLActor;
