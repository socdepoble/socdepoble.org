import { useLayoutEffect, useMemo, useRef } from 'react';
import { useUIActions, useUIState } from '../app/contexts/UIContext';
import { useLocation, useRouter } from '../app/contexts/RouterContext';
import { registerSeo } from './seoHead.js';
import { esMarcaDeLEntitat } from '../components/universal/UniversalUtils.js';
import { origenPublic } from '../config/origenPublic.js';
import { CAP_SOCIAL_BASE, ORIGEN_SOCIAL_PER_DEFECTE } from '../config/imatgeSocial.js';
import { clauSocialDeRuta } from '../config/rutaSocial.js';

// Gestoria i tractors tracten fitxers personals: mai indexables. Robots no és
// autorització; només evita que un cercador les llistes.
// Ordre del Mestre (30-10-2026, prompt 2208, T2.1) · /disseny i /consola són
// públiques i indexables («en principio no estamos escondiendo nada»): ixen
// d'esta llista, com 'disseny' de PRIVATE_ROUTES (publication-policy.mjs).
const PRIVATE = new Set(['notes', 'xat', 'chat', 'chats', 'control-xat', 'login', 'entrar', 'registre', 'accedir',
  'crear-compte', 'perfil', 'el-meu-perfil', 'admin', 'control', 'utilitats', 'connectar', 'cerca',
  'dispositius', 'traduccions', 'skills', 'ia', 'realitat', 'gestoria', 'tractors']);
export function routeAllowsIndex(pathname) {
  return !PRIVATE.has(String(pathname).replace(/^\/+/, '').split(/[/?#]/)[0]);
}

/* Pla 261027_1154 (P1-61) · S3. És CAP_SOCIAL_BASE.image.url (useSEO.test.jsx
   en fixa la igualtat); el literal es queda perquè pwa/manifest.test.js el
   compara amb index.html. La targeta genèrica viatja amb el seu conjunt
   (MIME, mides i alt): seoHead l'escriu sencera a cada ruta sense imatge. */
const IMATGE_BASE = '/assets/system/ui/og-socdepoble-1200x630.png';
const { type: TIPUS_BASE, width: AMPLE_BASE, height: ALT_BASE, alt: TEXT_BASE } = CAP_SOCIAL_BASE.image;
/* Pla 261027_1154 (P1-61) · Revisió adversarial (261027) · La targeta genèrica
   d'index.html (socdepoble.org): la que val quan l'origen públic no és https. */
const TARGETA_D_INDEX = new URL(CAP_SOCIAL_BASE.image.url, ORIGEN_SOCIAL_PER_DEFECTE).href;
// Les xarxes només baixen imatges http(s) i no pinten SVG.
function imatgeServible(url, type) {
  const { protocol, pathname } = new URL(url);
  return /^https?:$/.test(protocol) && !/svg/i.test(String(type || '')) && !/\.svgz?$/i.test(pathname);
}
/* Una URL absoluta sobre `origin`, o null si no s'analitza (un 'http://[' no
   penja el layout effect). */
function absoluta(valor, origin) {
  try {
    return new URL(valor, origin).href;
  } catch {
    return null;
  }
}
/* La imatge d'una vista (URL o { url, alt, width, height, type }) és un conjunt.
   Sense imatge pròpia, amb la base o amb una que les xarxes no pinten val el
   conjunt base; les mides només viatgen en parella d'enters positius.
   Onada 8 (261009) · La marca de Sóc de Poble (el quadrat o el logotip, PNG
   o SVG d'abans) tampoc és imatge social: abans era sempre SVG i les xarxes
   rebien la base de 1200x630. Ara és PNG i, sense esta guarda, la fitxa de
   l'entitat (/empresa/socdepoble) publicaria el quadrat de 256x256.
   Pla 261027_1154 (P1-61) · Revisió adversarial (261027) · La targeta genèrica
   segueix la regla d'opcionsDeLaImatgeSocial (ItemDetailSection i
   TextSection) i de seoHead: sobre l'origen públic (amb la base de
   l'amfitrió, resolveAsset) només si és https; si no (el servidor de dev,
   http://localhost), la d'index.html, a socdepoble.org. Abans, la triada
   anava a https://socdepoble.org i la genèrica a http://localhost: dos
   orígens en una mateixa sessió. La base es reconeix en les dues formes. */
function imatgeSocial(image, urlBase, origin) {
  const propia = typeof image === 'string' ? { url: image } : image || {};
  const local = absoluta(urlBase, origin);
  const base = /^https:\/\//i.test(String(origin || '')) && local ? local : TARGETA_D_INDEX;
  const url = propia.url ? absoluta(propia.url, origin) : null;
  if (!url || url === base || url === local || !imatgeServible(url, propia.type) || esMarcaDeLEntitat(url)) {
    return { url: base, type: TIPUS_BASE, width: AMPLE_BASE, height: ALT_BASE, alt: TEXT_BASE };
  }
  const mida = valor => (Number.isInteger(Number(valor)) && Number(valor) > 0 ? String(Number(valor)) : null);
  const text = valor => (typeof valor === 'string' && valor.trim() ? valor.trim() : null);
  const [width, height] = [mida(propia.width), mida(propia.height)];
  return { url, type: text(propia.type), alt: text(propia.alt), ...(width && height ? { width, height } : {}) };
}

/* Pla 261027_1154 (P1-61) · S3. `ogType` (opcional) és l'og:type de la vista
   ('product', 'article'...); sense ell, 'website'. `type` continua sent el
   @type del JSON-LD. */
export function useSEO({ title, description, canonical: canonicalExplicit, image, type = 'WebPage', ogType = null, jsonLd = null, index = true, fallback = false }) {
  const { resolveAsset } = useUIActions();
  const { externalConfig } = useUIState();
  const { pathname, search } = useLocation();
  const { basename } = useRouter();
  /* Pla 261028_1526 (P1-61, Fase 2) · La ruta del <head> és la clau social
     (rutaSocial.js): el camí sense barra final i, a /wikidepoble, el seu
     ?item=. Abans era el camí sol: el head d'un document (el servit o el del
     client) valia per a tots, i el canonical de tots era /wikidepoble. */
  const clau = pathname ? clauSocialDeRuta(pathname, search) : pathname;
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
    /* Ordre del Mestre (261021, pla 261021_0015 §13, P1-03) · El canònic del
       build o, si no, el de la pàgina; dins de l'app nativa, socdepoble.org
       (origenPublic.js), no capacitor://localhost. */
    const origin = origenPublic();
    const imatge = imatgeSocial(JSON.parse(imatgeClau), resolveAsset(IMATGE_BASE), origin);
    const canIndex = index !== false && routeAllowsIndex(pathname);
    const canonical = canonicalExplicit || `${String(origin).replace(/\/$/, '')}${basename || ''}${clau}`;
    const structuredData = jsonLdString ? JSON.stringify({
      '@context': 'https://schema.org', '@type': type, image: imatge.url, ...JSON.parse(jsonLdString)
    }).replace(/<\//g, '<\\/') : null;
    const tipusOg = typeof ogType === 'string' && ogType.trim() ? ogType.trim() : null;
    return registerSeo(owner.current, { path: clau, priority: fallback ? 0 : 1,
      title, description, image: imatge, ogType: tipusOg, index: canIndex, canonical, jsonLd: structuredData }, { manageDocumentHead: true });
  }, [pathname, clau, basename, title, description, canonicalExplicit, index, imatgeClau, type, ogType, jsonLdString, fallback,
    externalConfig?.manageDocumentHead, externalConfig?.pluginUrl, resolveAsset]);
}
