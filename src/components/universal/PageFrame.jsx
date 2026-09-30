import { resolveAsset } from '../../config/assetResolver';
import { useEffect, useId, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { isSafeUrl, DEFAULT_AUTHOR, PAGE_CHROME_MODES } from './UniversalUtils';
import { useAccions } from '../PedraSeca/hooks/useAccions.js';
import { llevaPuntFinal } from './editorial.js';
import { BarraBlava } from './barres/BarraBlava.jsx';
import { BarraTaronja } from './barres/BarraTaronja.jsx';

/* T2 (ordre del Mestre, 260930) · Fins a quin nivell d'encapçalament arriba
   l'Índex: h6 per defecte, perquè tot nivell d'encapçalament del contingut hi
   entra (els h4, h5 i h6 de les targetes decoren i estructuren, i el Mestre
   els vol a l'Índex); els sr-only i els buits, no. Cada pàgina encara en pot
   demanar d'1 a 6. Un sol selector per a la consulta i
   per al filtre de l'observador: si no coincidixen, l'Índex obert no
   s'assabenta quan Refrescar canvia el text d'un h5. */
export const NIVELL_INDEX_PER_DEFECTE = 6;

export function selectorIndex(nivellMax) {
  const n = Number.isInteger(nivellMax) ? Math.min(6, Math.max(1, nivellMax)) : NIVELL_INDEX_PER_DEFECTE;
  return Array.from({ length: n }, (_, i) => `h${i + 1}`).join(', ');
}

export function TableOfContentsDrawer({
  isOpen, onClose, contentRef, idPrefix = 'toc', nivellMaxIndex = NIVELL_INDEX_PER_DEFECTE
}) {
  const [headings, setHeadings] = useState([]);
  const selector = selectorIndex(nivellMaxIndex);

  useEffect(() => {
    if (!isOpen) return;

    const container = contentRef?.current;
    if (!container) return;

    let currentParsed = [];

    const buildToc = () => {
      const domHeadings = container.querySelectorAll(selector);
      
      const parsedHeadings = Array.from(domHeadings).map((el, idx) => {
        if (el.classList.contains('sr-only') || el.textContent.trim() === '') return null;
        if (!el.id) {
          el.id = `${idPrefix}-heading-${idx}`;
          el.dataset.sdpTocGenerated = 'true';
        }
        return {
          id: el.id,
          text: el.innerText || el.textContent,
          level: parseInt(el.tagName.substring(1), 10),
          element: el
        };
      }).filter(Boolean);
      
      currentParsed = parsedHeadings;
      setHeadings(parsedHeadings);
    };

    buildToc();

    // Use MutationObserver for live updates as suggested by the Council
    const observer = new MutationObserver((mutations) => {
      // Only rebuild if there are meaningful text or node changes
      const shouldRebuild = mutations.some(m => 
        m.type === 'childList' || 
        (m.type === 'characterData' && m.target.parentElement?.matches?.(selector))
      );
      if (shouldRebuild) {
        buildToc();
      }
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => {
      observer.disconnect();
      currentParsed.forEach(({ element, id }) => {
        if (element.dataset.sdpTocGenerated === 'true' && element.id === id) {
          element.removeAttribute('id');
          delete element.dataset.sdpTocGenerated;
        }
      });
      setHeadings([]);
    };
  }, [contentRef, idPrefix, isOpen, selector]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="toc-overlay" onClick={onClose}>
      <aside 
        className="toc-drawer" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="toc-title"
      >
        <div className="toc-header">
          <h2 id="toc-title">Taula de continguts</h2>
          <button className="toc-close-btn" onClick={onClose} aria-label="Tancar taula">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <nav className="toc-nav">
          {headings.length === 0 ? (
            <p className="toc-empty">No s'han trobat seccions.</p>
          ) : (
            <ul>
              {headings.map((h, idx) => (
                <li key={idx} className={`toc-item toc-level-${h.level}`}>
                  <button 
                    onClick={() => {
                      h.element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      onClose();
                    }}
                  >
                    {h.text}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>
      </aside>
    </div>,
    document.body
  );
}

export function PageFrame({
  title, subtitle, lead, labels = [], copyright, showLogos = false,
  chrome = 'page', topBarData = {}, heroImage, heroAlt = '',
  authorName = DEFAULT_AUTHOR.name, authorLocation = DEFAULT_AUTHOR.location,
  authorAvatar = DEFAULT_AUTHOR.avatarUrl,
  /* T4 · amb ruta, avatar i nom de la barra taronja enllacen al perfil públic. */
  authorHref = null,
  time, date, dateTime,
  onBack, onForward, onIndex, onTranslate, onComment, onShare, onConnect, onDateTime,
  connectLabel = 'Connectar', price, layout = 'page',
  /* T43 (ordre del Mestre, 260928, D1) · showConnect={false} amaga el botó
     CONNECTAR de la barra blava (UniversalPage el passa amb onConnect={false}).
     Sense la prop, el de sempre: visible. */
  showConnect,
  /* T63.2 (doctrina del Mestre, 260928) · `objecte`: el descriptor tipat de
     l'element de la pàgina. Sense onComment propi, Comentar obri el seu xat
     (useAccions); una nota no en té i Comentar no es pinta. objecte={null}:
     ara no hi ha cap element (carregant, no trobat), i el clic avisa.
     showComment={false} l'amaga (UniversalPage el passa amb onComment={false}).
     Amb accionsInoperatives (l'editor, T36) l'objecte no hi compta: el botó
     es queda inoperatiu, amb l'avís de la closca, siga quin siga el document. */
  objecte,
  showComment,
  // Ranura opcional de l'editor: la botonera de classificació ocupa el lloc
  // de les píndoles, davall del títol. Sense ella el DOM és el de sempre.
  classificacio = null,
  /* T36 · Ranures opcionals de l'editor (UniversalEditorShell). Amb
     accionsInoperatives, Comentar, Compartir i Connectar es pinten igual i
     continuen clicables, però el clic va a onClickInoperatiu (la closca hi
     mostra l'avís) i no fa la seua acció; Índex, Traduir i les fletxes
     continuen vius. avisAccions es pinta just davall de la barra blava.
     Sense elles el DOM és el de sempre. */
  accionsInoperatives = false,
  onClickInoperatiu = null,
  avisAccions = null,
  /* T2 (ordre del Mestre, 260930) · últim nivell d'encapçalament que recull
     l'Índex (1-6). Sense la prop, h1-h6: tots. */
  nivellMaxIndex = NIVELL_INDEX_PER_DEFECTE,
  children,
  className = '',
  LinkComponent = 'a' // To decouple from React Router's Link
}) {
  const [isTocOpen, setIsTocOpen] = useState(false);
  const containerRef = useRef(null);
  const tocIdPrefix = `toc-${useId().replace(/:/g, '')}`;

  const {
    handleConnect,
    handleTranslate,
    handleComment,
    handleShare,
    traduirVisible,
    comentarVisible,
    compartirVisible,
    connectarVisible,
    comentarXat
  } = useAccions({
    title,
    objecte: accionsInoperatives ? undefined : objecte,
    onConnect,
    onTranslate,
    onComment,
    onShare,
    showConnect,
    showComment,
    hasFooter: true, // Assuming full chrome provides a footer-like context for these
    telemetria: { origen: 'pagina' } // el Connectar de la barra es compta ací, i només ací
  });

  const handleIndex = onIndex || (() => setIsTocOpen(true));

  const barAuthorName = topBarData.authorName ?? authorName;
  const barAuthorLocation = topBarData.authorLocation ?? authorLocation;
  // La barra taronja resol i valida l'avatar i la ruta de l'autoria (BarraTaronja).
  const barAuthorAvatar = topBarData.authorAvatar ?? authorAvatar;
  const barAuthorHref = topBarData.authorHref ?? authorHref;
  const barTime = topBarData.time ?? time;
  const barDate = topBarData.date ?? date;
  const barDateTime = topBarData.dateTime ?? dateTime;
  const barHeroImage = topBarData.heroImage ?? heroImage;
  const barHeroAlt = topBarData.heroAlt ?? heroAlt;

  const resolvedChrome = PAGE_CHROME_MODES.has(chrome) ? chrome : 'page';
  const showBlueBar = resolvedChrome === 'full' || resolvedChrome === 'context' || resolvedChrome === 'system';
  const showOrangeBar = resolvedChrome === 'full' || resolvedChrome === 'context';
  const showPageHeader = resolvedChrome !== 'none';
  const pageLabels = Array.isArray(labels) ? labels.filter(Boolean) : [];
  // L'H1 i l'H2 no porten punt final (poliment editorial 260925). Només es
  // toca el text: un node de React passa tal qual.
  const titol = llevaPuntFinal(title);
  const subtitol = llevaPuntFinal(subtitle);
  const hasHeader = Boolean(showPageHeader && (showLogos || titol || pageLabels.length || copyright || classificacio));

  return (
    <>
      <div className={`sdp-universal-page-container sdp-universal-page-container--${layout} ${className}`.trim()}>
      {/* T51 · Les dues barres de color són components propis (barres/): el
          catàleg pinta les de veres. PageFrame hi posa useAccions i les dades. */}
      {showBlueBar && (
        <BarraBlava
          onBack={onBack}
          onForward={onForward}
          onIndex={handleIndex}
          traduirVisible={traduirVisible}
          comentarVisible={comentarVisible}
          compartirVisible={compartirVisible}
          connectarVisible={connectarVisible}
          onTranslate={handleTranslate}
          onComment={handleComment}
          onShare={handleShare}
          onConnect={handleConnect}
          connectLabel={connectLabel}
          /* T63.2 · Inoperatiu (l'editor, T36) no porta enlloc: el nom no en promet cap xat. */
          comentarXat={accionsInoperatives ? null : comentarXat}
          accionsInoperatives={accionsInoperatives}
          onClickInoperatiu={onClickInoperatiu}
        />
      )}
      {showBlueBar && avisAccions}

      {topBarData?.heroComponent ? (
        <div className={`hero-image ${topBarData.isEmptyHero ? 'hero-image--buit' : ''}`.trim()}>
          {topBarData.heroComponent}
        </div>
      ) : barHeroImage ? (
        <div className="hero-image">
          <img alt={barHeroAlt} src={resolveAsset(barHeroImage)} />
        </div>
      ) : null}

      {/* T51 · Espai central: topBarData.emoticona (camp cru del document) i,
          en edició, topBarData.onObriEmoticona (obri el diàleg d'emoticona). */}
      {showOrangeBar && (
        <BarraTaronja
          authorName={barAuthorName}
          authorLocation={barAuthorLocation}
          authorAvatar={barAuthorAvatar}
          authorHref={barAuthorHref}
          LinkComponent={LinkComponent}
          emoticona={topBarData?.emoticona}
          onObriEmoticona={topBarData?.onObriEmoticona ?? null}
          barActions={topBarData?.barActions}
          time={barTime}
          date={barDate}
          dateTime={barDateTime}
          onDateTime={onDateTime}
        />
      )}

      {hasHeader && (
        <header className="page-title">
          {topBarData?.logoComponent ? (
            <div className="page-title-logo-personalitzat">
              {topBarData.logoComponent}
            </div>
          ) : showLogos ? (
            <>
              <img alt="Logotip Sóc de Poble" className="page-title-logo light-only" src={resolveAsset("/assets/system/ui/logo-socdepoble-rect-negre.svg")} />
              <img alt="Logotip Sóc de Poble" className="page-title-logo dark-only" src={resolveAsset("/assets/system/ui/logo-socdepoble-rect-blanc.svg")} />
            </>
          ) : null}
          {titol && (
            <h1>
              {titol}
              {price && <span className="sp-card-price sp-card-price--en-linia">{price}</span>}
            </h1>
          )}
          {classificacio ? (
            <div className="page-title-classificacio">{classificacio}</div>
          ) : pageLabels.length > 0 && (
            <ul className="sp-card-labels page-title-labels" aria-label="Categories">
              {pageLabels.map((label, index) => {
                const text = typeof label === 'string' ? label : label.text;
                const className = typeof label === 'string' ? 'sdp-badge-tag' : label.className || 'sdp-badge-tag';
                const href = typeof label === 'string' ? null : label.href;
                const safeHref = href && isSafeUrl(href) ? href : null;
                return (
                  <li key={`${text}-${index}`} className={['sp-card-label', className].filter(Boolean).join(' ')}>
                    {label.onClick ? (
                      <button type="button" className="sp-card-label__action" onClick={label.onClick}>
                        {text}
                      </button>
                    ) : safeHref ? (
                      safeHref.startsWith('http') ? (
                        <a href={safeHref} target="_blank" rel="noopener noreferrer" className="sp-card-label">{text}</a>
                      ) : LinkComponent === 'a' ? (
                        <a href={safeHref} className="sp-card-label">{text}</a>
                      ) : (
                        <LinkComponent to={safeHref} className="sp-card-label">{text}</LinkComponent>
                      )
                    ) : (
                      text
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {copyright && (
            <p className="sp-card-copyright page-title-copyright">{copyright}</p>
          )}
        </header>
      )}

      <article className="content-wrapper" ref={containerRef}>
        {(subtitol || lead) && (
          <div className="page-intro">
            {subtitol && <h2>{subtitol}</h2>}
            {lead && <p className="lead">{lead}</p>}
          </div>
        )}
        {children}
      </article>
      </div>

      <TableOfContentsDrawer isOpen={isTocOpen} onClose={() => setIsTocOpen(false)} contentRef={containerRef}
        idPrefix={tocIdPrefix} nivellMaxIndex={nivellMaxIndex} />
    </>
  );
}
