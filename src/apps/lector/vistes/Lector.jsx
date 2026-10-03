/**
 * Lector de notícies · la LECTURA IMMERSIVA, al panell del detall: l'article
 * ocupa el lloc de la graella i les columnes de l'esquerra i del mig no
 * s'amaguen (en ample i en mitjana; en estret, la closca ensenya una sola
 * columna, com sempre).
 *
 *   capçalera  AppGridColumn, com la barra del lector de Feedly: l'aspa
 *              «Tanca l’article» a l'esquerra, el nom de la font i, a la
 *              dreta, «Desa per a després» i «Marca com a no llegit», en
 *              icones blanques
 *   cos        .sdp-centre (68ch) amb la tipografia editorial global: el
 *              títol (h2), la font, l'autor i la data (.lead), el contingut
 *              (Contingut.jsx) i, al final, «Visita el lloc web»
 *   teclat     Esc tanca, amb el focus a qualsevol columna de la closca o
 *              perdut (body); no des d'un camp de text o d'un diàleg, ni amb
 *              un panell superposat obert (en mitjana i en estret el tapa)
 *   focus      en obrir, al títol; en tancar, ColumnaNoticies el torna a la
 *              targeta de l'article
 * Obrir-lo el marca com a llegit. Les imatges i vídeos de l'article no es
 * carreguen (privacitat) i una Alerta ho diu. Un article desat que la font
 * ja no servix es llig del resum desat.
 */
import { useEffect, useId, useLayoutEffect, useRef } from 'react';
import { Bookmark, BookmarkCheck, ExternalLink, MailOpen, X } from 'lucide-react';
import AppGridColumn from '../../../components/layout/AppGridColumn.jsx';
import { Alerta, Avatar, Boto, Carregant, EstatBuit, MarcColumna } from '../../../components/PedraSeca/index.js';
import { useClosaAplicacio } from '../../plataforma/index.js';
import { dataLlarga, senseFinal } from '../nucli/index.js';
import { useArticle } from '../useNoticies.js';
import { Contingut } from './Contingut.jsx';
import { useVistaLector } from './context.js';

/* L'element enfocat, llegit a l'arrel del node (dins del Shadow DOM de l'encastat, document.activeElement és l'amfitrió). */
export function focusActiu(node) {
  const arrel = node?.getRootNode?.();
  return arrel && 'activeElement' in arrel ? arrel.activeElement : null;
}

/* El focus s'ha perdut (body o res) o és dins de `columna`: es pot moure sense robar-lo de la barra lateral. */
export function focusLliure(node, columna) {
  const actiu = focusActiu(node);
  return !actiu || actiu === node.ownerDocument?.body || Boolean(columna?.contains(actiu));
}

/* On Esc és d'un altre: escriure (un camp de text) o un diàleg obert. */
const ESC_ALIE = 'input, textarea, select, [contenteditable=""], [contenteditable="true"], dialog, [role="dialog"], [role="alertdialog"]';

function Cos({ article, font, desfas, titolRef, idTitol, nomesResum }) {
  const meta = [font?.nom, article.autor].filter(Boolean).join(' · ');
  const data = article.data ? dataLlarga(article.data, desfas) : '';
  return (
    <article className="sdp-centre" aria-labelledby={idTitol}>
      <h2 id={idTitol} ref={titolRef} tabIndex={-1}>{senseFinal(article.titol)}</h2>
      <p className="lead">
        {font ? <Avatar nom={font.nom} src={font.imatge} llavor={font.id} mida="sm" alt="" /> : null}
        {font ? ' ' : null}
        {meta}
        {meta && data ? ' · ' : null}
        {data ? <time dateTime={article.data}>{data}</time> : null}
      </p>
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
    </article>
  );
}

export function Lector({ id, onTanca }) {
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
  const idTitol = useId();
  const { marcaLlegit, marcaNoLlegit, commutaDespres } = lector.accions;
  const { mida, panellObert } = useClosaAplicacio();
  const onTancaRef = useRef(onTanca);
  /* Un panell superposat (mitjana i estret) tapa l'article: Esc no el tanca per darrere. */
  const tapatRef = useRef(false);
  useLayoutEffect(() => {
    onTancaRef.current = onTanca;
    tapatRef.current = mida !== 'ample' && panellObert !== null;
  });

  /* Obrir-lo el marca com a llegit (una vegada per article). */
  useEffect(() => { marcaLlegit(id); }, [id, marcaLlegit]);

  /* En arribar el contingut, el focus va al títol (si no és en un altre lloc). */
  useLayoutEffect(() => {
    if (!article || enfocat.current === id || !titolRef.current) return;
    enfocat.current = id;
    if (focusLliure(titolRef.current, titolRef.current.closest('section'))) titolRef.current.focus({ preventScroll: true });
  }, [article, id]);

  /* Esc tanca des de qualsevol columna de la closca (com a Feedly, «Marca-ho
     tot com a llegit» al mig no l'apaga) i amb el focus perdut (body, després
     d'un clic en un lloc que no s'enfoca). S'escolta a l'arrel del node: el
     document o, en l'encastat, l'arrel ombra (allí el body és de l'amfitrió i
     queda fora). */
  useEffect(() => {
    const closca = marc.current?.closest('.app-grid-page');
    const arrel = closca?.getRootNode?.();
    if (!closca || typeof arrel?.addEventListener !== 'function') return undefined;
    const tecla = (event) => {
      if (event.key !== 'Escape' || event.defaultPrevented || tapatRef.current) return;
      const desti = event.target;
      const pagina = closca.ownerDocument;
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
    cos = <Cos article={article} font={fontInfo} desfas={desfas} titolRef={titolRef} idTitol={idTitol} nomesResum={!sencer} />;
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
    <MarcColumna capcalera={<AppGridColumn titol={fontInfo?.nom || 'Article'} startActions={tanca} accions={accions} />} etiqueta="Article">
      <div ref={marc}>{cos}</div>
    </MarcColumna>
  );
}
