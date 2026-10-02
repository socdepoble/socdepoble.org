import { useLayoutEffect, useMemo, useRef } from 'react';
import { useUIActions, useUIState } from '../app/contexts/UIContext';
import { useLocation, useRouter } from '../app/contexts/RouterContext';
import { registerSeo } from './seoHead.js';

// Gestoria i tractors tracten fitxers personals: mai indexables. Robots no és
// autorització; només evita que un cercador les llistes.
const PRIVATE = new Set(['notes', 'xat', 'chat', 'chats', 'control-xat', 'login', 'entrar', 'registre', 'accedir',
  'crear-compte', 'perfil', 'el-meu-perfil', 'admin', 'consola', 'control', 'utilitats', 'connectar', 'cerca',
  'dispositius', 'traduccions', 'disseny', 'skills', 'ia', 'realitat', 'gestoria', 'tractors']);
export function routeAllowsIndex(pathname) {
  return !PRIVATE.has(String(pathname).replace(/^\/+/, '').split(/[/?#]/)[0]);
}

const IMATGE_BASE = '/assets/system/ui/og-socdepoble-1200x630.png';
// Les xarxes només baixen imatges http(s) i no pinten SVG.
function imatgeServible(url, type) {
  const { protocol, pathname } = new URL(url);
  return /^https?:$/.test(protocol) && !/svg/i.test(String(type || '')) && !/\.svgz?$/i.test(pathname);
}
/* La imatge d'una vista (URL o { url, alt, width, height, type }) és un conjunt.
   Sense imatge pròpia, amb la base o amb una que les xarxes no pinten val el
   conjunt base; les mides només viatgen en parella d'enters positius. */
function imatgeSocial(image, urlBase, origin) {
  const propia = typeof image === 'string' ? { url: image } : image || {};
  const base = new URL(urlBase, origin).href;
  const url = propia.url ? new URL(propia.url, origin).href : null;
  if (!url || url === base || !imatgeServible(url, propia.type)) return { url: base, base: true };
  const mida = valor => (Number.isInteger(Number(valor)) && Number(valor) > 0 ? String(Number(valor)) : null);
  const text = valor => (typeof valor === 'string' && valor.trim() ? valor.trim() : null);
  const [width, height] = [mida(propia.width), mida(propia.height)];
  return { url, type: text(propia.type), alt: text(propia.alt), ...(width && height ? { width, height } : {}) };
}

export function useSEO({ title, description, canonical: canonicalExplicit, image, type = 'WebPage', jsonLd = null, index = true, fallback = false }) {
  const { resolveAsset } = useUIActions();
  const { externalConfig } = useUIState();
  const { pathname } = useLocation();
  const { basename } = useRouter();
  const owner = useRef(Symbol('seo'));
  const jsonLdString = useMemo(() => jsonLd ? JSON.stringify(jsonLd) : null, [jsonLd]);
  // Clau primitiva: un objecte d'imatge literal nou a cada render no torna a registrar.
  const imatgeClau = JSON.stringify(image || null);

  useLayoutEffect(() => {
    // El <head> és de qui l'amfitrió declara: només s'hi escriu amb manageDocumentHead === true
    // (socdepoble.org ho fa a main.jsx). Penjar de #root no és cap declaració. Sense ruta
    // (router fora de la seua base) la pàgina és de l'amfitrió i tampoc s'hi toca.
    const isIframe = window.self !== window.top;
    if (externalConfig?.manageDocumentHead !== true || isIframe || window.__SDP_EMBEDDED__ || !pathname) return undefined;
    const origin = import.meta.env?.VITE_CANONICAL_URL || window.location.origin;
    const imatge = imatgeSocial(JSON.parse(imatgeClau), resolveAsset(IMATGE_BASE), origin);
    const canIndex = index !== false && routeAllowsIndex(pathname);
    const canonical = canonicalExplicit || `${String(origin).replace(/\/$/, '')}${basename || ''}${pathname}`;
    const structuredData = jsonLdString ? JSON.stringify({
      '@context': 'https://schema.org', '@type': type, image: imatge.url, ...JSON.parse(jsonLdString)
    }).replace(/<\//g, '<\\/') : null;
    return registerSeo(owner.current, { path: pathname, priority: fallback ? 0 : 1,
      title, description, image: imatge, index: canIndex, canonical, jsonLd: structuredData }, { manageDocumentHead: true });
  }, [pathname, basename, title, description, canonicalExplicit, index, imatgeClau, type, jsonLdString, fallback,
    externalConfig?.manageDocumentHead, externalConfig?.pluginUrl, resolveAsset]);
}
