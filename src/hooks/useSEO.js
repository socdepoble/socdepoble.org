import { useLayoutEffect, useMemo, useRef } from 'react';
import { useUIActions, useUIState } from '../app/contexts/UIContext';
import { useLocation, useRouter } from '../app/contexts/RouterContext';
import { registerSeo } from './seoHead.js';

const PRIVATE = new Set(['notes', 'xat', 'chat', 'chats', 'control-xat', 'login', 'entrar', 'registre', 'accedir',
  'crear-compte', 'perfil', 'el-meu-perfil', 'admin', 'consola', 'control', 'utilitats', 'connectar', 'cerca',
  'dispositius', 'traduccions', 'disseny', 'skills', 'ia', 'realitat']);
export function routeAllowsIndex(pathname) {
  return !PRIVATE.has(String(pathname).replace(/^\/+/, '').split('/')[0]);
}

export function useSEO({ title, description, canonical: canonicalExplicit, image, type = 'WebPage', jsonLd = null, index = true, fallback = false }) {
  const { resolveAsset } = useUIActions();
  const { externalConfig } = useUIState();
  const { pathname } = useLocation();
  const { basename } = useRouter();
  const owner = useRef(Symbol('seo'));
  const jsonLdString = useMemo(() => jsonLd ? JSON.stringify(jsonLd) : null, [jsonLd]);

  useLayoutEffect(() => {
    // El <head> és de qui l'amfitrió declara: només s'hi escriu amb manageDocumentHead === true
    // (socdepoble.org ho fa a main.jsx). Penjar de #root no és cap declaració. Sense ruta
    // (router fora de la seua base) la pàgina és de l'amfitrió i tampoc s'hi toca.
    const isIframe = window.self !== window.top;
    if (externalConfig?.manageDocumentHead !== true || isIframe || window.__SDP_EMBEDDED__ || !pathname) return undefined;
    const origin = import.meta.env?.VITE_CANONICAL_URL || window.location.origin;
    const imageUrl = new URL(image || resolveAsset('/assets/system/ui/og-socdepoble-1200x630.png'), origin).href;
    const canIndex = index !== false && routeAllowsIndex(pathname);
    const canonical = canonicalExplicit || `${String(origin).replace(/\/$/, '')}${basename || ''}${pathname}`;
    const structuredData = jsonLdString ? JSON.stringify({
      '@context': 'https://schema.org', '@type': type, image: imageUrl, ...JSON.parse(jsonLdString)
    }).replace(/<\//g, '<\\/') : null;
    return registerSeo(owner.current, { path: pathname, priority: fallback ? 0 : 1,
      title, description, image: imageUrl, index: canIndex, canonical, jsonLd: structuredData }, { manageDocumentHead: true });
  }, [pathname, basename, title, description, canonicalExplicit, index, image, type, jsonLdString, fallback,
    externalConfig?.manageDocumentHead, externalConfig?.pluginUrl, resolveAsset]);
}
