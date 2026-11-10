import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { UniversalCard, Boto, Camp, Selector } from '../PedraSeca/index.js';
import { useNavigate, useSearchParams } from '../../app/contexts/RouterContext';
import { UniversalWorkspace } from './workspace/UniversalWorkspace.jsx';
import { useAppGrid } from '../layout/AppGridShell.jsx';
import { useUIActionsOpcional } from '../../app/contexts/UIContext';
import { textosCatalegWorkspace } from './workspace/textosCatalegWorkspace.js';
import { useProjeccionsCatalegContext } from './workspace/ProjeccionsCatalegContext.js';
import { capturaFontCataleg, itemWorkspaceDeProjeccio, perDestiCataleg, projeccioCatalegDe, rutaFontCataleg } from '../../data/projeccionsCataleg.js';
import SelectorDestinsPublicacio from './workspace/SelectorDestinsPublicacio.jsx';
import { fusionaModelProjeccionsCataleg } from '../../data/modelProjeccionsCataleg.js';
import DetallCataleg from './workspace/DetallCataleg.jsx';
import { Link } from '../../app/contexts/RouterContext';
import { desaVista, vistaDesada } from './workspace/vistaCataleg.js';
import { useModeracio } from '../PedraSeca/hooks/moderacioDePoble.js';
import { BotoModeracio } from '../PedraSeca/organismes/Moderacio.jsx';
import { filtraElementsBloquejats } from '../../config/moderacio.js';
import { useTextCanonicCataleg } from '../../hooks/useTextCanonicCataleg.js';
import { objecteDeProjeccioCataleg } from '../../data/fitxesCanoniquesCataleg.js';

/* Fitxa Gestor F4 (R15b) · CatalegWorkspace és un consumidor del primitiu
   UniversalWorkspace (com NotesSection o PerfilShell) i, per tant, viu fora
   del mòdul src/components/universal/workspace: dins del mòdul només el
   primitiu exposa el slot renderItem (contracte T50). La façana del mòdul
   (workspace/index.js) el continua exportant per a les apps. */

/* PRIVADESA-01 (R15b) · El ⋮ de denúncia i bloqueig d'una referència d'altri a la barra del detall, com el de la
   barra d'una publicació del Mur (PageFrame · ambModeracio), o undefined. Hi és en les dues vistes: la rajola és massa
   petita per al menú (la targeta retalla el que en sobreix) i només la targeta de la Llista el porta. */
function botoModeracioDe(moderacio, objecte, titol) {
  const objectiu = objecte && moderacio?.disponible === true ? moderacio.objectiuDeTargeta?.(objecte) ?? null : null;
  if (!objectiu) return undefined;
  return <BotoModeracio titol={typeof titol === 'string' ? titol : ''} nomAutor={objectiu.autor?.nom} tipusObjectiu={objectiu.tipus}
    potBloquejar={moderacio.potBloquejar === true && objectiu.bloquejable === true}
    onTria={(via, obridor) => (via === 'bloqueja' ? moderacio.demanaBloqueig(objectiu, obridor) : moderacio.demanaDenuncia(objectiu, obridor))} />;
}

/* PRODNM-02, USA-04, RV-05 (R15b) · Cap ruta escrita a mà: cada destí és la
   ruta de la seua font (rutaFontCataleg). El Rebost i el Bar només hi són si
   la seua app és en este build (el mateix literal que el manifest). */
const FONTS_DE_NAVEGACIO = Object.freeze(['herbari', 'llavors', 'receptes', 'nevera', 'bar']);
const destinsDeNavegacio = (textos) => FONTS_DE_NAVEGACIO
  .map(font => ({ valor: rutaFontCataleg(font), etiqueta: textos.destins[font] }))
  .filter(desti => desti.valor !== null);

/* USA-01 · Les tecles d'un recorregut de la columna 2 (IDEA-58): la fitxa es
   desplaça a la vista, però el focus continua a la llista. */
const TECLES_DE_RECORREGUT = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown']);
const movimentReduit = () => {
  try { return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true; } catch { return false; }
};
const enfocable = node => Boolean(node?.isConnected) && !node.closest('[inert], [hidden], [aria-hidden="true"]');
/* Les barres enganxades de la pàgina (la blava i la taronja de PageFrame en
   «ample») tapen el principi del detall: la fitxa s'hi col·loca davall. Només
   es miren els germans anteriors dels ascendents de la fitxa, no tot el DOM. */
function capcalEnganxat(arrel, objectiu) {
  let alcada = 0;
  for (let node = objectiu; node && node !== arrel; node = node.parentElement) {
    for (let germa = node.previousElementSibling; germa; germa = germa.previousElementSibling) {
      const estil = globalThis.getComputedStyle?.(germa);
      if (estil?.position !== 'sticky') continue;
      const dalt = Number.parseFloat(estil.top);
      if (Number.isFinite(dalt) && dalt >= 0) alcada = Math.max(alcada, dalt + germa.getBoundingClientRect().height);
    }
  }
  return alcada;
}
/* Una correcció més gran que les dues barres vol dir que la persona ja s'ha mogut. */
const LIMIT_DE_CORRECCIO = 240;
function desplaca(arrel, top, behavior) {
  if (typeof arrel.scrollTo === 'function') arrel.scrollTo({ top: Math.max(0, top), behavior });
  else arrel.scrollTop = Math.max(0, top);
}
/* El node principal d'un element de la columna 2, sense escapar cap id. */
function elementDeLaLlista(arrel, id) {
  if (!arrel || id == null) return null;
  return [...arrel.querySelectorAll('[data-element]')].find(node => node.getAttribute('data-element') === String(id)
    && node.matches('button, a[href]')) ?? null;
}

/** One catalogue shell; the domain retains its data, actions and inline page. */
export default function CatalegWorkspace({ id, model, labels, renderDetail, ruta, privateItems = false, font = null, destiPublicacio = null, permetreEdicioDestins = false }) {
  const ui = useUIActionsOpcional();
  const textos = textosCatalegWorkspace(ui?.language);
  /* USA-05 · La vista persistix per superfície (vistaCataleg.js). */
  const [vista, setVistaViva] = useState(() => vistaDesada(id));
  const setVista = useCallback(nova => { setVistaViva(nova); desaVista(id, nova); }, [id]);
  const [desti, setDesti] = useState(ruta);
  const [searchParams] = useSearchParams();
  const fitxaEnllacada = searchParams.get('fitxa');
  const [selection, setSelection] = useState({ categoryId: '__all__', itemId: fitxaEnllacada });
  /* USA-01, USA-03 · Què ha de fer el detall després del pintat següent:
     obrir una fitxa (desplaçar-la a la vista i, si l'origen és un gest o un
     enllaç profund, enfocar-ne el títol) o tancar-la (tornar el focus a
     l'element de la llista). `n` fa única cada petició; `atesa` evita que un
     remuntatge del detall la repetisca. */
  const [peticio, setPeticio] = useState(null);
  const serial = useRef(0);
  const atesa = useRef(0);
  const demana = useCallback((tipus, itemId, focus) => {
    serial.current += 1;
    setPeticio({ tipus, id: String(itemId), focus, n: serial.current });
  }, []);
  useEffect(() => {
    setSelection({ categoryId: '__all__', itemId: fitxaEnllacada });
    if (fitxaEnllacada) demana('obri', fitxaEnllacada, true);
  }, [fitxaEnllacada, demana]);
  const teclaDeRecorregut = useRef(false);
  useEffect(() => {
    const doc = globalThis.document;
    if (!doc) return undefined;
    let temporitzador = null;
    const marca = event => {
      if (!TECLES_DE_RECORREGUT.has(event.key)) return;
      teclaDeRecorregut.current = true;
      clearTimeout(temporitzador);
      temporitzador = setTimeout(() => { teclaDeRecorregut.current = false; }, 0);
    };
    doc.addEventListener('keydown', marca, true);
    return () => { doc.removeEventListener('keydown', marca, true); clearTimeout(temporitzador); };
  }, []);
  const canviaSeleccio = useCallback((next, detall) => {
    setSelection(next);
    if (next?.itemId == null) return;
    const deRecorregut = detall?.reason === 'teclat' || teclaDeRecorregut.current;
    demana('obri', next.itemId, !deRecorregut);
  }, [demana]);
  const navega = useNavigate();
  const publicacio = useProjeccionsCatalegContext();
  /* PRIVADESA-01 (R15b) · Com el Mur moderat: sense el que has bloquejat (filtraElementsBloquejats, abans de
     passar a element del workspace, que ja no porta qui signa), amb el text canònic de l'Herbari, el Banc de
     llavors i Què dinem? (mai el de la fila) i amb la via de denúncia i bloqueig a cada referència d'altri. */
  const moderacio = useModeracio();
  const esBloquejat = moderacio?.esElementBloquejat ?? null;
  const files = useMemo(() => filtraElementsBloquejats(perDestiCataleg(publicacio.projeccions, destiPublicacio,
    { ownerId: publicacio.ownerId, privat: privateItems }), esBloquejat),
    [publicacio.projeccions, publicacio.ownerId, destiPublicacio, privateItems, esBloquejat]);
  const canoniques = useTextCanonicCataleg(files, ui?.language);
  const visibles = useMemo(() => canoniques.map(fila => {
    const item = itemWorkspaceDeProjeccio(fila);
    return item && { ...item, objecte: objecteDeProjeccioCataleg(fila, publicacio.ownerId, textos.autoriaReferencia) };
  }).filter(item => item && !(item.projeccio.font.font === font
      && model.items.some(original => String(original.id) === item.projeccio.font.id))),
    [canoniques, publicacio.ownerId, textos.autoriaReferencia, font, model.items]);
  const modelAmbProjeccions = useMemo(() => fusionaModelProjeccionsCataleg(model, visibles, textos.publishedLabel), [model, visibles, textos.publishedLabel]);
  const gestor = <GestorDeLaFitxa peticio={peticio} atesa={atesa} />;
  return <UniversalWorkspace idEspai={id} model={modelAmbProjeccions} labels={{ count: textos.count, ...labels }} tagFilter={false}
    selection={selection} onSelectionChange={canviaSeleccio}
    collapsibleNavigation={false} mestreDetall={{ clau: id, element: fitxaEnllacada }}
    ajustosEnDetall={true}
    titolTornadaAjustos={labels?.items || null}
    className="sdp-cataleg-workspace"
    listClassName={`sdp-cataleg-workspace__${vista}`}
    accionsLlista={[
      { id: 'llista', etiqueta: textos.llista, pressed: vista === 'llista', icona: List, onAcciona: () => setVista('llista'), className: 'sdp-cataleg-workspace__commutador' },
      { id: 'rajola', etiqueta: textos.rajola, pressed: vista === 'rajola', icona: LayoutGrid, onAcciona: () => setVista('rajola'), className: 'sdp-cataleg-workspace__commutador' }
    ]}
    peuNavegacio={<DestinsCataleg textos={textos} desti={desti} setDesti={setDesti} navega={navega}
      onHome={() => setSelection({ categoryId: '__all__', itemId: null })} />}
    renderItem={({ item, active, onSelect }) => { const moderable = vista === 'llista' && Boolean(item.objecte); return <UniversalCard
      variant={vista === 'llista' ? 'pla' : 'default'} headingLevel="h3"
      title={item.title} subtitle={item.subtitle} body={vista === 'llista' ? item.lead : undefined}
      imageUrl={item.imageUrl} imageAlt={item.imageAlt || ''}
      llenguaContingut={item.lang || 'ca'} imatgePrivada={privateItems}
      squareBadge={!item.imageUrl ? { type: 'custom', label: `${textos.fitxa}: ${item.title}`, content: <span aria-hidden="true">{item.glyph || '📖'}</span>, onClick: onSelect } : null}
      labels={item.labels || []} actual={active} idElement={item.id}
      onMainClick={onSelect} showShare={!privateItems} hasFooter={false}
      {...(moderable ? { objecte: item.objecte, ambModeracio: true, className: 'sdp-referencia-cataleg' } : null)}
    />; }}
    renderDetail={props => {
      if (props.item?.projeccio) {
        const referencia = props.item.projeccio;
        const rutaOriginal = rutaFontCataleg(referencia.font.font);
        return <><DetallCataleg title={props.item.title} subtitle={props.item.subtitle} lead={props.item.lead}
          showConnect={false} showComment={false} showShare={!privateItems} barActions={botoModeracioDe(moderacio, props.item.objecte, props.item.title)}>
          <p>{referencia.pendent ? textos.pendingReference : textos.publishedReference}</p>
          {rutaOriginal ? <p><Link to={rutaOriginal + '?fitxa=' + encodeURIComponent(referencia.font.id)}>{textos.openOriginal}</Link></p> : null}
        </DetallCataleg>{gestor}</>;
      }
      const item = props.item;
      const referencia = font && item ? capturaFontCataleg({ font, id: String(item.id), title: item.title,
        subtitle: item.subtitle || '', lead: item.lead || '' }) : null;
      const files = referencia ? publicacio.projeccions.map(projeccioCatalegDe).filter(row => row
        && row.ownerId === publicacio.ownerId && row.font.font === font && row.font.id === referencia.id) : [];
      /* SEG-R15b-05 · Una fitxa privada (Rebost, Bar) no naix amb cap destí públic triat. */
      const inicials = files.length ? [...new Set(files.flatMap(row => row.destins))] : privateItems ? [] : ['mur'];
      return <>{renderDetail({ ...props,
        onTriaItem: itemId => { setSelection(current => ({ ...current, itemId })); if (itemId != null) demana('obri', itemId, true); },
        onClose: () => { const obert = selection.itemId; setSelection(current => ({ ...current, itemId: null })); if (obert != null) demana('tanca', obert, true); } })}
        {/* PRODNM-06, USA-13 · La lectura pública és la mateixa per a qui administra i per a qualsevol visitant:
            no es mostra «On es publica?». Només amb permetreEdicioDestins, que cap cridador de producció no passa
            (C6-10). La funció desapareix de la interfície; no s'ha traslladat a l'Edició avançada del Bloc. */}
        {permetreEdicioDestins && referencia && publicacio.autoritzat ? <SelectorDestinsPublicacio key={JSON.stringify([font, referencia.id, publicacio.ownerId])}
          font={referencia} inicials={inicials} desa={publicacio.desa} autoritzat={publicacio.autoritzat}
          error={files.some(row => row.pendent) && publicacio.error?.desatLocal === true ? publicacio.error : null} persistent={publicacio.persistent} language={ui?.language}
          estat={files.length ? files.some(row => row.pendent) ? 'pendent' : 'confirmat' : null} /> : null}
        {gestor}
      </>;
    }} />;

}

/* USA-01, USA-03 · Viu dins del detall (dins d'AppGridShell): hi troba la
   columna pel seu ancoratge, que és ocult i no pinta res. Actua en un doble
   requestAnimationFrame, el rellotge de useFocusAfterLayout, perquè el panell
   d'«estret» ja haja deixat de ser inert. */
function GestorDeLaFitxa({ peticio, atesa }) {
  const ancora = useRef(null);
  const { mida, obriPanell } = useAppGrid();
  useEffect(() => {
    if (!peticio || atesa.current === peticio.n) return undefined;
    const marcs = [], neteges = [];
    const enDosMarcs = accio => {
      if (typeof requestAnimationFrame !== 'function') { accio(); return; }
      marcs.push(requestAnimationFrame(() => { marcs.push(requestAnimationFrame(accio)); }));
    };
    const detall = () => ancora.current?.closest('.sdp-workspace-detail') ?? ancora.current?.parentElement ?? null;
    const obri = () => {
      const arrel = detall();
      if (!arrel?.isConnected) return;
      atesa.current = peticio.n;
      /* La fitxa de l'element és l'última del detall (Herbari, Banc i
         Fediversity la pinten darrere del cos de la pàgina). Sense, el detall
         sencer és la fitxa (una recepta): es torna al principi. */
      const fitxes = arrel.querySelectorAll('.sdp-cataleg-workspace__fitxa');
      const fitxa = fitxes.length ? fitxes[fitxes.length - 1] : null;
      const titol = (fitxa ?? arrel).querySelector('h1, h2, h3, h4, h5, h6');
      const behavior = movimentReduit() ? 'auto' : 'smooth';
      const distancia = () => fitxa.getBoundingClientRect().top - arrel.getBoundingClientRect().top - capcalEnganxat(arrel, fitxa);
      desplaca(arrel, fitxa ? arrel.scrollTop + distancia() : 0, behavior);
      /* En compacte les barres s'amaguen en baixar (useBarresAmbScroll) i
         deixen un forat damunt de la fitxa: una sola correcció en acabar el
         desplaçament, si la persona no s'ha mogut d'allí. */
      if (fitxa) {
        const corregix = () => {
          arrel.removeEventListener('scrollend', corregix);
          clearTimeout(rellotge);
          if (!fitxa.isConnected || atesa.current !== peticio.n) return;
          const resta = distancia();
          if (Math.abs(resta) > 2 && Math.abs(resta) <= LIMIT_DE_CORRECCIO) desplaca(arrel, arrel.scrollTop + resta, 'auto');
        };
        arrel.addEventListener('scrollend', corregix);
        const rellotge = setTimeout(corregix, behavior === 'smooth' ? 900 : 150);
        neteges.push(() => { arrel.removeEventListener('scrollend', corregix); clearTimeout(rellotge); });
      }
      if (peticio.focus && titol && enfocable(titol)) {
        if (!titol.hasAttribute('tabindex')) titol.setAttribute('tabindex', '-1');
        titol.focus({ preventScroll: true });
      }
    };
    const tanca = () => {
      const arrel = detall();
      if (!arrel?.isConnected) return;
      atesa.current = peticio.n;
      const workspace = arrel.closest('.sdp-workspace--universal') ?? arrel.ownerDocument;
      const torna = () => {
        const boto = elementDeLaLlista(workspace, peticio.id);
        if (enfocable(boto)) { boto.focus(); return true; }
        return false;
      };
      if (torna()) return;
      /* En «estret» la llista és un panell: s'obri i el focus hi torna. */
      if (mida === 'estret' && typeof obriPanell === 'function') {
        obriPanell('middle');
        enDosMarcs(() => { if (!torna()) arrel.focus?.({ preventScroll: true }); });
        return;
      }
      /* L'element ja no és a la llista (una cerca el filtra): el detall,
         mai el body. */
      arrel.focus?.({ preventScroll: true });
    };
    enDosMarcs(peticio.tipus === 'tanca' ? tanca : obri);
    return () => {
      for (const marc of marcs) if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(marc);
      for (const neteja of neteges) neteja();
    };
  }, [peticio, atesa, mida, obriPanell]);
  return <span ref={ancora} hidden data-ancora-cataleg="" />;
}

function DestinsCataleg({ textos, desti, setDesti, navega, onHome }) {
  const { tancaPanells } = useAppGrid();
  const opcions = destinsDeNavegacio(textos);
  /* RV-05 · La pàgina que no és entre les opcions (Fediversity) no deixa un
     estat que no es veu: «Obri la pàgina» porta on diu el selector. */
  const visible = opcions.some(opcio => opcio.valor === desti) ? desti : opcions[0]?.valor ?? '';
  return <div className="sdp-cataleg-workspace__destins">
    <Boto onClick={() => { onHome(); tancaPanells(); }}>{textos.principal}</Boto>
    <Camp etiqueta={textos.desti}><Selector value={visible} onChange={event => setDesti(event.target.value)} opcions={opcions} /></Camp>
    <Boto onClick={() => { if (visible) navega(visible); }}>{textos.obri}</Boto>
  </div>;
}
