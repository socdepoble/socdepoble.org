/* P1-20 · D15 (Assalt 10/10, T4a, 261101) · Els trossos de l'arrencada. El
   tros d'entrada portava 1,47 MB (408 kB gzip): l'estil sencer com a text
   (src/css/index.css?inline, 458 kB), el diccionari valencià (155 kB), React
   i DOMPurify. Tots quatre es carreguen igual a l'arrencada, ara en trossos a
   part que el navegador demana en paral·lel (modulepreload a l'index.html,
   que el service worker ja desa com a recursos de la closca); React i
   DOMPurify no canvien de nom quan només canvia l'app. Cap mòdul canvia de
   contingut: cap píxel. L'ordre d'avaluació sí: els quatre trossos
   s'avaluen abans que la resta de l'entrada. No canvia res perquè són
   fulles sense efectes (no importen res del projecte); si un dia en
   importaren, Rollup ho ficaria al tros i ho avançaria. Ho guarda
   paquetDArrencada.test.js.
   lucide-react no hi va: un tros comú arrossegaria a l'arrencada les icones
   de totes les vistes diferides. react-dom/server i test-utils tampoc: si
   una vista diferida els importara, no han de baixar a l'arrencada. La
   resta, com decidix Rollup.
   wikiManifest.js ja era un tros diferit (cap importació estàtica des de
   l'entrada). Pur: el prova src/config/paquetDArrencada.test.js. */
export function trossDArrencada(id) {
  const cami = String(id).replace(/\\/g, '/');
  if (/\/node_modules\/react-dom\/(?:server|test-utils|cjs\/react-dom-(?:server|test-utils))/.test(cami)) return undefined;
  if (/\/node_modules\/(react|react-dom|scheduler)\//.test(cami)) return 'react';
  if (/\/node_modules\/dompurify\//.test(cami)) return 'dompurify';
  if (cami.includes('/node_modules/')) return undefined;
  if (cami.endsWith('/src/css/index.css?inline')) return 'estils';
  if (cami.endsWith('/src/config/idiomes/ca.js')) return 'ca';
  // R56 · Identitat/scroll nous i política pura existent byteintacta;
  // síncrons i precarregats, sense RouterContext ni cicle cap a l'entrada.
  if (cami.endsWith('/src/hooks/useScrollDeNavegacio.js')
      || cami.endsWith('/src/app/contexts/historialDeRuta.js')
      || cami.endsWith('/src/app/contexts/politicaRouter.js')) return 'navegacio';
  // R15.2 · L’adaptador d’entrada i les seues tres dependències locals ja
  // són estàtics al natiu. El connector de login continua amb import()
  // al primer toc; ni el push ni les altres entrades natives s’agrupen.
  if (cami.endsWith('/src/natiu/entradaSocial.js')) return 'entrada-nativa';
  // AH-27 + Onada R6: dades pures (sense imports), cachejables a banda de la closca.
  // R38: el vocabulari curt compartix este tros ja existent; les traduccions continuen diferides.
  if (
    cami.endsWith('/src/sections/pobles/poblesAplecViquipedia.js') ||
    cami.endsWith('/src/sections/mur/articles/aplec2023Content.js') ||
    cami.endsWith('/src/sections/mur/articles/manifestDePobleContent.js') ||
    cami.endsWith('/src/data/taxonomia/indexArticlesImportats.js') ||
    cami.endsWith('/src/data/taxonomia/vocabulariCanonic.js')
  ) return 'pobles-aplec';
  return undefined;
}

