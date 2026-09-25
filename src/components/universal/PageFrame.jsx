import { resolveAsset } from '../../config/assetResolver';
import { useEffect, useId, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BackIcon, ForwardIcon, IndexIcon, TranslateIcon, CommentIcon, ShareIcon, IconButton, ActionControl, DateTimeControl } from './../PedraSeca';
import { isSafeUrl, isSafeAsset, DEFAULT_AUTHOR, PAGE_CHROME_MODES } from './UniversalUtils';
import { useAccions } from '../PedraSeca/hooks/useAccions.js';
import { UserRound } from 'lucide-react';

export function TableOfContentsDrawer({ isOpen, onClose, contentRef, idPrefix = 'toc' }) {
  const [headings, setHeadings] = useState([]);

  useEffect(() => {
    if (!isOpen) return;

    const container = contentRef?.current;
    if (!container) return;
    
    let currentParsed = [];

    const buildToc = () => {
      const domHeadings = container.querySelectorAll('h1, h2, h3, h4');
      
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
        (m.type === 'characterData' && m.target.parentElement?.matches?.('h1, h2, h3, h4'))
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
  }, [contentRef, idPrefix, isOpen]);

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
  time, date, dateTime,
  onBack, onForward, onIndex, onTranslate, onComment, onShare, onConnect, onDateTime,
  connectLabel = 'Connectar', price, layout = 'page',
  // Ranura opcional de l'editor: la botonera de classificació ocupa el lloc
  // de les píndoles, davall del títol. Sense ella el DOM és el de sempre.
  classificacio = null,
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
    connectarVisible
  } = useAccions({
    title,
    onConnect,
    onTranslate,
    onComment,
    onShare,
    hasFooter: true, // Assuming full chrome provides a footer-like context for these
    telemetria: { origen: 'pagina' } // el Connectar de la barra es compta ací, i només ací
  });

  const handleIndex = onIndex || (() => setIsTocOpen(true));

  const barAuthorName = topBarData.authorName ?? authorName;
  const barAuthorLocation = topBarData.authorLocation ?? authorLocation;
  const requestedAvatar = topBarData.authorAvatar ?? authorAvatar;
  const resolvedAvatar = typeof requestedAvatar === 'string' ? resolveAsset(requestedAvatar) : null;
  const barAuthorAvatar = isSafeAsset(resolvedAvatar) ? resolvedAvatar : null;
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
  const hasHeader = Boolean(showPageHeader && (showLogos || title || pageLabels.length || copyright || classificacio));

  return (
    <>
      <div className={`sdp-universal-page-container sdp-universal-page-container--${layout} ${className}`.trim()}>
      {showBlueBar && (
          <header className="bar-blue">
            <div className="bar-blue-left">
              {onBack && (
                <IconButton label="Tornar arrere" onClick={onBack} presentation>
                  <BackIcon className="icon" />
                </IconButton>
              )}
              {/* Ordre del Mestre (260924): el Llibre (índex) entre les dues fletxes.
                  L'ordre de tabulació seguix el visual. */}
              <IconButton label="Índex de secció" onClick={handleIndex} presentation>
                <IndexIcon className="icon" />
              </IconButton>
              {onForward && (
                <IconButton label="Tornar endavant" onClick={onForward} presentation>
                  <ForwardIcon className="icon" />
                </IconButton>
              )}
            </div>
            <div className="sp-card-actions">
              {traduirVisible && (
                <IconButton label="Traduir" onClick={handleTranslate} presentation>
                  <TranslateIcon className="icon" />
                </IconButton>
              )}
              {comentarVisible && (
                <IconButton label="Comentar (Xat Privat)" onClick={handleComment} presentation>
                  <CommentIcon className="icon" />
                </IconButton>
              )}
              {compartirVisible && (
                <IconButton label="Compartir" onClick={handleShare} presentation>
                  <ShareIcon className="icon" />
                </IconButton>
              )}
            </div>
            {connectarVisible && (
              <ActionControl className="btn-connectar sp-card-connect" label={connectLabel} onClick={handleConnect}>
                <span className="sp-card-connect-text">{connectLabel}</span>
                <span className="sp-card-connect-plus" aria-hidden="true">+</span>
              </ActionControl>
            )}
          </header>
      )}

      {topBarData?.heroComponent ? (
        <div className={`hero-image ${topBarData.isEmptyHero ? 'hero-image--buit' : ''}`.trim()}>
          {topBarData.heroComponent}
        </div>
      ) : barHeroImage ? (
        <div className="hero-image">
          <img alt={barHeroAlt} src={resolveAsset(barHeroImage)} />
        </div>
      ) : null}

      {showOrangeBar && (
        <section className="bar-orange" aria-label="Autoria i data">
              <div className="sp-card-author">
                {barAuthorAvatar ? (
                  <img
                    className="sp-card-avatar"
                    src={barAuthorAvatar}
                    alt=""
                    decoding="async"
                    width="48"
                    height="48"
                    onError={(e) => {
                      e.currentTarget.classList.add('sp-card-avatar--amagat');
                      e.currentTarget.nextSibling?.classList.remove('sp-card-avatar--amagat');
                    }}
                  />
                ) : null}
                <div
                  className={['sp-card-avatar', 'sp-card-avatar--fallback', barAuthorAvatar && 'sp-card-avatar--amagat'].filter(Boolean).join(' ')}
                >
                  <UserRound size={24} />
                </div>
                <div className="sp-card-author-info">
                  <div className="sp-card-author-name">{barAuthorName}</div>
                  <div className="sp-card-author-location">{barAuthorLocation}</div>
                </div>
              </div>
              <div className="bar-actions">
                {topBarData?.barActions ? topBarData.barActions : (
                  <>

                    {(barTime || barDate || barDateTime) && (
                      <DateTimeControl time={barTime} date={barDate} dateTime={barDateTime} onClick={onDateTime} />
                    )}
                  </>
                )}
              </div>
            </section>
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
          {title && (
            <h1>
              {title}
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
        {(subtitle || lead) && (
          <div className="page-intro">
            {subtitle && <h2>{subtitle}</h2>}
            {lead && <p className="lead">{lead}</p>}
          </div>
        )}
        {children}
      </article>
      </div>

      <TableOfContentsDrawer isOpen={isTocOpen} onClose={() => setIsTocOpen(false)} contentRef={containerRef} idPrefix={tocIdPrefix} />
    </>
  );
}
