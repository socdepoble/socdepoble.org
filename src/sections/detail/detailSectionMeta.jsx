import React from 'react';
import { CalendarDays, MapPin, UserRound, MessageCircle } from 'lucide-react';
import { renderRichText, renderPostContent } from './detailRichText.jsx';
import { getFirstImage } from './detailHelpers.jsx';
import { Aplec2023Article } from '../mur/articles/Aplec2023Article.jsx';

export function buildMercatDetailSectionMeta({ marketItems = [], t }) {
  return {
    title: t('section.detail.mercat.title', 'Mercat'),
    label: t('section.detail.mercat.label', 'Producte'),
    listPath: '/mercat',
    items: marketItems,
    getTitle: (item) => item.title || t('section.detail.mercat.itemTitle', 'Producte'),
    getSubtitle: (item) => item.subtitle || item.description || item.summary || '',
    getImage: (item) => getFirstImage(item.imageSrc || item.image_url || item.image || item.images?.[0] || item.avatar_url) || null,
    renderBody: (item) => (
      <>
        {item.description && (
          <div >
            {renderRichText(item.description)}
          </div>
        )}
        {Array.isArray(item.variations) && item.variations.length > 0 ? (
          <div className="stack-grid ">
            {item.variations.map((variation) => (
              <div key={variation.name} className="note-card stack-grid">
                {variation.image && (
                  <img 
                    src={variation.image} 
                    alt={variation.name} 
                    
                    width={120}
                  />
                )}
                <h3>
                  {variation.name}
                </h3>
                <p className="card__text ">
                  {variation.description}
                </p>
                <p style={{ opacity: 0.7, textTransform: 'uppercase' }}>
                  VENEDOR: {item.seller || 'SÓC DE POBLE'}
                </p>
                <div className="sp-card-price">
                  {variation.price}
                </div>
                <button className="btn btn-secondary sdp-boto--ple">
                  Afegeix al cabàs
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </>
    )
  };
}

export function buildPoblesDetailSectionMeta({ towns = [], t }) {
  return {
    title: t('section.detail.pobles.title', 'Pobles'),
    label: t('section.detail.pobles.label', 'Poble'),
    listPath: '/pobles',
    items: towns,
    getTitle: (item) => item.author || `Gent de ${item.title || item.name || t('section.detail.pobles.itemTitle', 'Poble')}`,
    getSubtitle: (item) => item.post_subtitle || item.content || '',
    getImage: (item) => item.image_url || null,
    renderBody: (item) => (
      <>
        <div className="badge-row">
          <span className="pill">{item.population || item.type || t('section.detail.pobles.itemTitle', 'Poble')}</span>
          <span className="pill"><MapPin size={14} /> {item.town_name || item.title || ''}</span>
        </div>
        {renderRichText(item.content || item.description)}
      </>
    )
  };
}

export function buildNotesDetailSectionMeta({ notes = [], t }) {
  return {
    title: t('section.detail.notes.title', 'Notes'),
    label: t('section.detail.notes.label', 'Nota'),
    listPath: '/notes',
    items: notes,
    getTitle: (item) => item.title || t('section.detail.notes.itemTitle', 'Nota'),
    getSubtitle: (item) => item.body || item.content || '',
    getImage: () => null,
    renderBody: (item) => (
      <>
        <div className="badge-row">
          <span className="pill">{item.folderId || t('section.detail.notes.folderFallback', 'General')}</span>
          <span className="pill">{item.updatedAt || ''}</span>
        </div>
        {renderRichText(item.body || item.content)}
      </>
    )
  };
}

export function buildMurDetailSectionMeta({ feedPosts = [], t }) {
  return {
    title: t('section.detail.mur.title', 'Mur'),
    label: t('section.detail.mur.label', 'Publicació'),
    listPath: '/mur',
    items: feedPosts,
    getTitle: (item) => item.title || t('section.detail.mur.itemTitle', 'Publicació'),
    getSubtitle: (item) => item.post_subtitle || item.description || '',
    getImage: (item) => item.imageSrc || getFirstImage(item.image_url || item.image) || null,
    renderBody: (item) => (
      <>
        <div className="badge-row">
          <span className="pill"><UserRound size={14} /> {item.author || t('section.detail.mur.author', 'Sóc de Poble')}</span>
          <span className="pill"><MapPin size={14} /> {item.town_name || t('section.detail.mur.town', 'La Torre de les Maçanes')}</span>
          <span className="pill"><MessageCircle size={14} /> {item.comments || 0}</span>
          <span className="pill">{item.likes || 0} {t('section.mur.likes', "m'agrada")}</span>
        </div>
        {renderPostContent(item.content || item.summary)}
        {Array.isArray(item.tags) && item.tags.length > 0 ? (
          <div className="badge-row" style={{ marginTop: 18 }}>
            {item.tags.map((tag) => (
              <span key={tag} className="badge">{tag}</span>
            ))}
          </div>
        ) : null}
      </>
    )
  };
}

export function buildMultimediaDetailSectionMeta({ mediaItems = [], t }) {
  return {
    title: t('section.detail.multimedia.title', 'Multimèdia'),
    label: t('section.detail.multimedia.label', 'Element'),
    listPath: '/multimedia',
    items: mediaItems,
    getTitle: (item) => item.title || t('section.detail.multimedia.itemTitle', 'Element multimèdia'),
    getSubtitle: (item) => item.subtitle || item.tag || item.kind || '',
    getImage: (item) => item.src || null,
    renderBody: (item) => (
      <>
        <div className="badge-row">
          <span className="pill">{item.tag || t('section.detail.multimedia.mediaType', 'Media')}</span>
          <span className="pill">{item.kind || t('section.detail.multimedia.imageType', 'Imatge')}</span>
          {item.source ? <span className="pill"><UserRound size={14} /> {item.source}</span> : null}
          {item.created_at ? <span className="pill">{String(item.created_at).slice(0, 10)}</span> : null}
        </div>
        {renderRichText(item.description || item.content)}
        {item.src ? (
          <div className="media-frame media-frame--contain detail-hero__media" style={{ marginTop: 18 }}>
            <img src={item.src} alt={item.title} decoding="async" />
          </div>
        ) : null}
      </>
    )
  };
}

export function buildEventsDetailSectionMeta({ events = [], t }) {
  return {
    title: t('section.detail.events.title', 'Events'),
    label: t('section.detail.events.label', 'Agenda'),
    listPath: '/events',
    items: events,
    getTitle: (item) => item.title || t('section.detail.events.itemTitle', 'Acte'),
    getSubtitle: (item) => item.subtitle || '',
    getImage: (item) => item.image_url || null,
    renderBody: (item) => (
      <>
        <div className="badge-row">
          <span className="pill"><CalendarDays size={14} /> {item.date || ''}</span>
          <span className="pill">{item.type || t('section.detail.events.typeFallback', 'Agenda')}</span>
          <span className="pill"><UserRound size={14} /> {item.author_name || t('section.detail.events.organisation', 'Organització')}</span>
          {item.file ? <span className="pill">{item.file}</span> : null}
        </div>
        
        {item.id === 'aplec-2023' ? (
          <Aplec2023Article />
        ) : (
          renderRichText(item.description || item.content)
        )}
      </>
    )
  };
}

export function buildDetailSectionMeta({ events, feedPosts, marketItems, mediaItems, notes, towns, t }) {
  return {
    mur: buildMurDetailSectionMeta({ feedPosts, t }),
    mercat: buildMercatDetailSectionMeta({ marketItems, t }),
    events: buildEventsDetailSectionMeta({ events, t }),
    pobles: buildPoblesDetailSectionMeta({ towns, t }),
    multimedia: buildMultimediaDetailSectionMeta({ mediaItems, t }),
    notes: buildNotesDetailSectionMeta({ notes, t })
  };
}
