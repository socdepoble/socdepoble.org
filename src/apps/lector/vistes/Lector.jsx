/**
 * Lector de notícies · la LECTURA IMMERSIVA, al detall de l'espai de treball
 * (Noticies.jsx): l'arbre i la llista no s'amaguen (en ample i en mitjana; en
 * estret, la closca ensenya una sola columna, com sempre).
 *
 *   capçalera  AppGridColumn, com la barra del lector de Feedly: l'aspa
 *              «Tanca l’article» a l'esquerra, el nom de la font i, a la
 *              dreta, «Desa per a després» i «Marca com a no llegit», en
 *              icones blanques
 *   cos        la Pàgina Universal de les apps (PaginaApp de Pedra Seca):
 *              la barra blava (Tornar tanca l'article), la portada, la barra
 *              taronja amb la font (enllaça a les seues notícies), l'autor de
 *              l'article i la data, l'H1 i, a l'article de la pàgina, els
 *              avisos, el contingut (Contingut.jsx) i «Visita el lloc web»
 *   teclat     Esc tanca, amb el focus a qualsevol columna de la closca o
 *              perdut (body); no des d'un camp de text o d'un diàleg, ni amb
 *              un panell superposat obert (en mitjana i en estret el tapa),
 *              ni amb l'Índex de secció o un diàleg modal propi obert: Esc
 *              tanca només el que està obert més amunt (un modal de
 *              l'amfitrió, en l'encastat, no compta)
 *   focus      en obrir, a l'H1 (refTitol); en tancar, Noticies.jsx el torna
 *              a la fila de l'article a la llista (`retorn`, de davall)
 * Obrir-lo el marca com a llegit. Les imatges i vídeos de l'article no es
 * carreguen (privacitat) i una Alerta ho diu. Un article desat que la font
 * ja no servix es llig del resum desat. L'avís del disc (AvisLector), dins
 * del marc: abans anava al peu de la columna de les carpetes, que ja no hi és
 * (Bloc 0 del Gauntlet, ordre del Mestre del 261016).
 *
 * Ordre del Mestre, 261004 (prompt 261004_0515; D-A del xat de les 06:38) ·
 * El títol propi (h2 i .lead dins de .sdp-centre) es retira: el detall és la
 * Pàgina Universal, per la porta permesa a les apps (sense traductor ni
 * telemetria). La portada és la mateixa imatge de la targeta (el filtre de
 * mitjans de l'amfitrió i sense referent, com a la llista). La notícia és un
 * contingut de fora: cap xat comú (objecte={null}). El logo de la font no va
 * a la barra taronja: l'avatar de la barra no es demana sense referent, i fins
 * que ho faça val més el cercle de reserva que avisar la font.
 */
import { useEffect, useLayoutEffect, useRef } from 'react';
import { Bookmark, BookmarkCheck, ExternalLink, MailOpen, X } from 'lucide-react';
import AppGridColumn from '../../../components/layout/AppGridColumn.jsx';
import { Alerta, Boto, Carregant, EstatBuit, MarcColumna, PaginaApp } from '../../../components/PedraSeca/index.js';
import { useClosaAplicacio } from '../../plataforma/index.js';
import { HUI, dataDeBoina, senseFinal } from '../nucli/index.js';
import { useArticle } from '../useNoticies.js';
import { AvisLector } from './comunes.jsx';
import { Contingut } from './Contingut.jsx';
import { useVistaLector } from './context.js';
import { NOTICIES } from './navegacio.js';

/* L'element enfocat, llegit a l'arrel del node (dins del Shadow DOM de l'encastat, document.activeElement és l'amfitrió). */
export function focusActiu(node) {
  const arrel = node?.getRootNode?.();
  return arrel && 'activeElement' in arrel ? arrel.activeElement : null;
}

/* Ordre del Mestre, 261004 (integració final, auditoria d'amfitrió: «el Lector pot furtar el
   focus a un camp de l'amfitrió») · Dins d'una ombra, activeElement null vol dir dues coses:
     · el focus s'ha perdut DINS de l'ombra (l'element enfocat s'ha desmuntat): el document el
       torna al body (o a l'amfitrió mateix, si s'enfoca): és lliure;
     · el focus és FORA, en un element de la pàgina amfitriona (document.activeElement no és
       l'amfitrió ni el body): és de l'amfitrió i no es toca.
   Fora d'una ombra (el document), null és «perdut», com sempre. */
function focusPerdutALOmbra(arrel) {
  const host = arrel?.host;
  if (!host) return true;
  const pagina = host.ownerDocument;
  const delDocument = pagina?.activeElement;
  return !delDocument || delDocument === host || delDocument === pagina.body || delDocument === pagina.documentElement;
}

/* El focus es pot moure sense robar-lo: s'ha perdut (body o res, també dins de l'ombra), és
   dins de `columna` o, ordre del Mestre, 261004 (integració final, «en obrir una notícia des de
   l'entrada de l'app, el focus es perd»), és un avantpassat de `columna` dins de l'app: el
   destí del focus en canviar de ruta (main#main-content, que conté la closca). El focus de
   l'amfitrió (un camp de la pàgina de WordPress) no és mai lliure. */
export function focusLliure(node, columna) {
  const actiu = focusActiu(node);
  if (!actiu) return focusPerdutALOmbra(node?.getRootNode?.());
  const pagina = node.ownerDocument;
  if (actiu === pagina?.body || actiu === pagina?.documentElement) return true;
  if (!columna) return false;
  return columna.contains(actiu) || (typeof actiu.contains === 'function' && actiu.contains(columna));
}

/* La closca de l'app (AppGridShell): on el focus és de l'app. */
export const CLOSCA = '.app-grid-page';

/* Bloc 0 del Gauntlet (ordre del Mestre, 261016) · La fila de l'article obert a la llista de
   l'espai de treball: la de la columna del mig (l'id de la closca, el mateix que fa servir
   aria-controls) que l'espai marca aria-current. */
const FILA_OBERTA = '#app-grid-list [aria-current="true"]';

/* On Esc és d'un altre: escriure (un camp de text) o un diàleg obert.
   E1 del Gauntlet (261016) · S'exporta amb ambDialegObert: les dreceres d'un sol caràcter de les
   notícies (dreceres.js) callen als mateixos llocs que Esc. */
export const ESC_ALIE ='input, textarea, select, [contenteditable=""], [contenteditable="true"], dialog, [role="dialog"], [role="alertdialog"]';

/* Ordre del Mestre, 261004 (auditoria 0605, «Esc amb l'Índex obert») · Un
   diàleg modal obert damunt de la pàgina: l'Índex de secció de la Pàgina
   Universal es pinta amb un portal fora de la closca (a la SPA, al body;
   encastat, a .sdp-root), i el focus va al calaix en obrir-se (PageFrame).
   Esc tanca només el que està obert més
   amunt: eixe diàleg, no l'article de davall.
   Verificació «lector-nevera», D2 · Encastat a WordPress, el document és de
   l'amfitrió: un modal seu (un bàner de galetes amagat però present, un
   <dialog> obert sense ser modal) no és nostre i no pot bloquejar Esc per
   sempre. Per això només compten l'Índex de la Pàgina Universal (el portal de
   PageFrame, .toc-overlay) i els diàlegs modals de dins de la closca, i mai un
   d'amagat. */
const DIALEG_INDEX = '.toc-overlay > [role="dialog"][aria-modal="true"]';
const DIALEG_MODAL_PROPI = '[role="dialog"][aria-modal="true"], [role="alertdialog"][aria-modal="true"], dialog[open]';
const AMAGAT = '[hidden], [aria-hidden="true"], [inert]';

const visibles = (on, selector) => (typeof on?.querySelectorAll === 'function'
  ? [...on.querySelectorAll(selector)].filter((dialeg) => !dialeg.closest(AMAGAT))
  : []);

/* L'Índex obert (al document o a l'arrel ombra de l'encastat) o un diàleg modal propi.
   Ordre del Mestre, 261004 (integració final; regressió del poliment comprovada al navegador:
   «el Lector tanca l'article amb Esc encara que hi haja un calaix nostre obert fora de la
   closca») · Els modals propis es busquen a l'arrel de l'app (.sdp-root), no només a la closca:
   el CalaixIdentitats i el calaix del menú (Dialeg amb showModal) viuen fora de la closca però
   dins de .sdp-root, i són nostres. Els de WordPress, fora de .sdp-root, continuen sense comptar
   (D2). Sense .sdp-root (les proves sense embolcall), la closca, com abans. Dins d'una ombra
   (l'encastat), tota l'arrel ombra és nostra: també el destí dels portals locals del Dialeg. */
export function ambDialegObert(closca, arrel, pagina) {
  const ambIndex = [pagina, arrel].some((on) => visibles(on, DIALEG_INDEX).length > 0);
  const delApp = arrel?.host ? arrel : (closca.closest('.sdp-root') || closca);
  return ambIndex || visibles(delApp, DIALEG_MODAL_PROPI).length > 0;
}

/* La boina d'una notícia: la font (amb la ruta de les seues notícies) i, a la
   segona línia, l'autor de l'article. Sense font coneguda, l'autor o res: mai
   «Sóc de Poble», que no l'ha escrita. */
function autoriaDe(article, font, ruta) {
  if (!font) return { nom: article.autor || '', poble: '', href: null };
  return { nom: font.nom, poble: article.autor || '', href: ruta(NOTICIES, font.categoriaId || HUI, font.id) };
}

function Cos({ article, portada, font, desfas, titolRef, nomesResum, onTanca }) {
  const { ruta } = useVistaLector();
  const boina = dataDeBoina(article.data, desfas);
  return (
    <PaginaApp
      title={senseFinal(article.titol)}
      author={autoriaDe(article, font, ruta)}
      time={boina?.time}
      date={boina?.date}
      dateTime={boina ? article.data : undefined}
      heroImage={portada}
      onBack={onTanca}
      refTitol={titolRef}
      objecte={null}
    >
      {nomesResum ? (
        <Alerta to="info" viva={false} titol="Només el resum">
          La font ja no publica esta notícia sencera: ací en tens el resum.
        </Alerta>
      ) : null}
      {article.mitjansOmesos > 0 ? (
        <Alerta to="info" viva={false} titol="Imatges i vídeos a part">
          Per a protegir la teua privacitat, ací no es carreguen les imatges ni els vídeos d’altres webs. Els trobaràs al lloc web.
        </Alerta>
      ) : null}
      {article.contingutHtml ? <Contingut html={article.contingutHtml} /> : <p>{article.resum}</p>}
      {article.enllac ? (
        <p>
          <a className="sdp-boto sdp-boto--primari sdp-boto--gran" href={article.enllac} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={20} aria-hidden="true" focusable="false" />
            <span>Visita el lloc web</span>
            {' '}
            <span className="sdp-nomes-lector">(s’obri en una pestanya nova)</span>
          </a>
        </p>
      ) : null}
    </PaginaApp>
  );
}

/* `retorn` (opcional): un ref on el lector deixa, a cada pintada, la fila de l'article a la llista
   i la closca ({ fitxa, closca }). Qui el munta hi torna el focus en tancar-lo, també amb l'arrere
   del navegador, que no passa per onTanca. */
export function Lector({ id, onTanca, retorn = null }) {
  const { lector, noticies, font: port, desfas } = useVistaLector();
  const { estat, article: sencer, rellegix } = useArticle(port, id);
  const desat = lector.estat.despres.find((resum) => resum.id === id) || null;
  const resum = noticies.articles.find((a) => a.id === id) || desat;
  /* La font ja no el servix: el resum desat (o el de la llista) es llig igual. */
  const article = sencer || (estat === 'absent' ? resum : null);
  const fontInfo = noticies.fonts.find((f) => f.id === (article || resum)?.fontId) || null;
  const marc = useRef(null);
  const titolRef = useRef(null);
  const enfocat = useRef(null);
  const { marcaLlegit, marcaNoLlegit, commutaDespres } = lector.accions;
  const { mida, panellObert } = useClosaAplicacio();
  const onTancaRef = useRef(onTanca);
  /* Un panell superposat (mitjana i estret) tapa l'article: Esc no el tanca per darrere. */
  const tapatRef = useRef(false);
  useLayoutEffect(() => {
    onTancaRef.current = onTanca;
    tapatRef.current = mida !== 'ample' && panellObert !== null;
  });

  /* Bloc 0 del Gauntlet (ordre del Mestre, 261016) · On tornarà el focus: es llig a cada pintada,
     perquè la llista pot canviar mentre es llig (una altra carpeta, un recompte). Si la fila no hi
     és en una pintada (la notícia fora de la llista), es conserva l'última d'este mateix article,
     mai la d'un altre. */
  useLayoutEffect(() => {
    if (!retorn) return;
    const closca = marc.current?.closest(CLOSCA) || null;
    const fitxa = closca?.querySelector(FILA_OBERTA) || (retorn.current?.id === id ? retorn.current.fitxa : null);
    retorn.current = { id, fitxa, closca };
  });

  /* Obrir-lo el marca com a llegit (una vegada per article). */
  useEffect(() => { marcaLlegit(id); }, [id, marcaLlegit]);

  /* En arribar el contingut, el focus va a l'H1 de la pàgina (si no és en un altre lloc).
     Ordre del Mestre, 261004 (integració final) · «Dins de la closca», no només dins de la
     columna (abans, la section més pròxima): des de l'entrada de l'app el focus és al
     main#main-content (el destí del canvi de ruta) i l'H1 no el rebia. */
  useLayoutEffect(() => {
    if (!article || enfocat.current === id || !titolRef.current) return;
    enfocat.current = id;
    const titol = titolRef.current;
    if (focusLliure(titol, titol.closest(CLOSCA) || titol.closest('section'))) titol.focus({ preventScroll: true });
  }, [article, id]);

  /* Esc tanca des de qualsevol columna de la closca (com a Feedly, també des
     de l'arbre i de la llista) i amb el focus perdut (body, després
     d'un clic en un lloc que no s'enfoca). S'escolta a l'arrel del node: el
     document o, en l'encastat, l'arrel ombra (allí el body és de l'amfitrió i
     queda fora). */
  useEffect(() => {
    const closca = marc.current?.closest(CLOSCA);
    const arrel = closca?.getRootNode?.();
    if (!closca || typeof arrel?.addEventListener !== 'function') return undefined;
    const tecla = (event) => {
      if (event.key !== 'Escape' || event.defaultPrevented || tapatRef.current) return;
      const desti = event.target;
      const pagina = closca.ownerDocument;
      if (ambDialegObert(closca, arrel, pagina)) return;
      const perdut = desti === pagina?.body || desti === pagina?.documentElement;
      if (!perdut && !(desti instanceof Node && closca.contains(desti))) return;
      if (!perdut && typeof desti.closest === 'function' && desti.closest(ESC_ALIE)) return;
      event.preventDefault();
      onTancaRef.current?.();
    };
    arrel.addEventListener('keydown', tecla);
    return () => arrel.removeEventListener('keydown', tecla);
  }, []);

  const desar = article || resum;
  /* Com a Feedly: l'aspa a l'esquerra de la barra, les accions a la dreta. */
  const tanca = [{ id: 'tanca', icona: X, etiqueta: 'Tanca l’article', onAcciona: onTanca }];
  const accions = [
    {
      id: 'despres', icona: desat ? BookmarkCheck : Bookmark, etiqueta: 'Desa per a després', pressed: Boolean(desat),
      onAcciona: desar ? () => commutaDespres(desar) : null
    },
    { id: 'no-llegit', icona: MailOpen, etiqueta: 'Marca com a no llegit', onAcciona: () => marcaNoLlegit(id) }
  ];

  let cos;
  if (article) {
    /* La portada és la imatge de la targeta: la de l'article o, si no en porta, la del resum de la llista. */
    cos = (
      <Cos article={article} portada={article.imatge || resum?.imatge || undefined} font={fontInfo} desfas={desfas}
        titolRef={titolRef} nomesResum={!sencer} onTanca={onTanca} />
    );
  } else if (estat === 'carregant') {
    cos = <Carregant etiqueta="Obrint l’article…" />;
  } else if (estat === 'error') {
    cos = (
      <EstatBuit titol="No s’ha pogut obrir l’article" accio={<Boto varietat="secundari" onClick={rellegix}>Torna-ho a provar</Boto>}>
        La font no ha respost. Pot ser cosa d’un moment.
      </EstatBuit>
    );
  } else cos = <EstatBuit titol="Esta notícia ja no hi és">La font ja no la publica.</EstatBuit>;

  return (
    <MarcColumna capcalera={<AppGridColumn titol={fontInfo?.nom || 'Article'} startActions={tanca} accions={accions} />}
      avis={<AvisLector />} etiqueta="Article">
      <div ref={marc}>{cos}</div>
    </MarcColumna>
  );
}
