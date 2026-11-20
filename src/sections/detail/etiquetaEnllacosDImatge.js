/**
 * Enriqueix en lectura els enllaços HTML muts que només contenen una imatge amb
 * `alt` (`<a href="..."><img alt="..." /></a>`), afegint-los `aria-label` amb
 * el text alternatiu de la imatge quan l'enllaç no té text propi ni atributs
 * de nom accessible. No altera cap enllaç amb text visible ni s'executa a la
 * capa de persistència/edició.
 */
export function etiquetaEnllacosDImatge(html) {
  if (typeof html !== 'string' || !html.includes('<a') || !html.includes('<img') || typeof DOMParser === 'undefined') {
    return html;
  }
  /* Gauntlet v1.2.15 · Ara corre ABANS del sanejador, sobre l'HTML cru. Cap sobre «<template>…</template>» de text:
     un «</template>» dins de l'HTML, un <textarea> obert o un <frameset> el trencarien. L'HTML s'analitza dins del
     <body> explícit d'un document inert de DOMParser (sense scripts ni càrregues), com el sanejador: les etiquetes de
     capçalera es queden al cos, el <frameset> s'ignora i un «</template>» solt també. */
  const cos = new DOMParser().parseFromString(`<body>${html}`, 'text/html').body;
  let canviat = false;
  for (const enllac of cos.querySelectorAll('a[href]')) {
    if (
      enllac.hasAttribute('aria-label') ||
      enllac.hasAttribute('aria-labelledby') ||
      enllac.hasAttribute('title') ||
      (enllac.textContent || '').trim() !== ''
    ) {
      continue;
    }
    const alt = (enllac.querySelector('img[alt]')?.getAttribute('alt') || '').trim();
    if (alt) {
      enllac.setAttribute('aria-label', alt);
      canviat = true;
    }
  }
  return canviat ? cos.innerHTML : html;
}
