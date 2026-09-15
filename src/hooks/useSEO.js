import { useEffect, useMemo } from 'react';
import { useUIActions } from '../app/contexts/UIContext';
import { useUIState } from '../app/contexts/UIContext';

export function useSEO({ title, description, canonical, image, type = 'WebPage', jsonLd = null }) {
  const { resolveAsset } = useUIActions();
  const { externalConfig } = useUIState();

  const jsonLdString = useMemo(() => jsonLd ? JSON.stringify(jsonLd) : null, [jsonLd]);

  useEffect(() => {
    // Evita modificar el títol si l'aplicació s'ha incrustat explícitament (Sollutia)
    // o si està funcionant dins d'un iframe de tercers.
    const isIframe = typeof window !== 'undefined' && window.self !== window.top;
    const isGloballyEmbedded = typeof window !== 'undefined' && window.__SDP_EMBEDDED__;
    const shouldManageHead = externalConfig?.manageDocumentHead !== false && !isIframe && !isGloballyEmbedded;
    
    if (!shouldManageHead) return;

    const defaultImage = resolveAsset('/assets/system/ui/logo-socdepoble-cuadrat-verd.svg');
    let imageUrl = image || defaultImage;
    if (imageUrl && !imageUrl.startsWith('http') && typeof window !== 'undefined') {
      const baseOrigin = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CANONICAL_URL) || window.location.origin;
      imageUrl = `${baseOrigin}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
    }

    const setMeta = (name, content, attribute = 'name') => {
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      if (content) {
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute(attribute, name);
          document.head.appendChild(meta);
        }
        meta.content = content;
      } else if (meta) {
        meta.remove();
      }
    };

    const fullTitle = title ? `${title} | Sóc de Poble` : 'Sóc de Poble';
    document.title = fullTitle;
    setMeta('og:title', fullTitle, 'property');
    setMeta('twitter:title', fullTitle);

    setMeta('description', description);
    setMeta('og:description', description, 'property');
    setMeta('twitter:description', description);

    setMeta('og:image', imageUrl, 'property');
    setMeta('twitter:image', imageUrl);
    setMeta('twitter:card', imageUrl ? 'summary_large_image' : null);

    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      if (!linkCanonical) {
        linkCanonical = document.createElement('link');
        linkCanonical.rel = 'canonical';
        document.head.appendChild(linkCanonical);
      }
      linkCanonical.href = canonical;
      setMeta('og:url', canonical, 'property');

      const langs = ['ca', 'es', 'en', 'eu', 'gl'];
      try {
        const urlObj = new URL(canonical);
        langs.forEach(lang => {
          let hreflang = document.querySelector(`link[rel="alternate"][hreflang="${lang}"]`);
          if (!hreflang) {
            hreflang = document.createElement('link');
            hreflang.rel = 'alternate';
            hreflang.hreflang = lang;
            document.head.appendChild(hreflang);
          }
          urlObj.searchParams.set('lang', lang);
          hreflang.href = urlObj.toString();
        });
        let hreflangDef = document.querySelector(`link[rel="alternate"][hreflang="x-default"]`);
        if (!hreflangDef) {
           hreflangDef = document.createElement('link');
           hreflangDef.rel = 'alternate';
           hreflangDef.hreflang = 'x-default';
           document.head.appendChild(hreflangDef);
        }
        hreflangDef.href = canonical;
      } catch {
        // canonical invàlid per a l'URL constructor (ex: relatiu)
      }
    } else {
      if (linkCanonical) linkCanonical.remove();
      setMeta('og:url', null, 'property');
      document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());
    }

    let scriptJsonLd = document.querySelector('script[data-sdp-seo]');
    if (jsonLdString) {
      if (!scriptJsonLd) {
        scriptJsonLd = document.createElement('script');
        scriptJsonLd.type = 'application/ld+json';
        scriptJsonLd.setAttribute('data-sdp-seo', 'true');
        document.head.appendChild(scriptJsonLd);
      }
      
      const parsed = JSON.parse(jsonLdString);
      const structuredData = {
        '@context': 'https://schema.org',
        '@type': type,
        ...(imageUrl && { image: imageUrl }),
        ...parsed
      };
      
      scriptJsonLd.textContent = JSON.stringify(structuredData);
    } else if (scriptJsonLd) {
      scriptJsonLd.remove();
    }

  }, [title, description, canonical, image, type, jsonLdString, externalConfig?.manageDocumentHead, externalConfig?.pluginUrl, resolveAsset]);
}
