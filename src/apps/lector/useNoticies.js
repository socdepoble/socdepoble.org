/**
 * Lector de notícies · el que ve del port (fontNoticies.js), amb els seus estats.
 *
 *   useNoticies(font)    → { estat, categories, fonts, articles, rellegix }
 *   useArticle(font, id) → { estat, article, rellegix }
 *   estat: 'carregant' · 'llest' · 'error' (i, per a un article, 'absent':
 *          la font ja no el servix)
 * Cap dels dos fa xarxa: només criden el port, que és qui sap d'on venen.
 * Una resposta que arriba quan ja no toca (un altre article, l'app tancada)
 * no es pinta.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

const BUIT = Object.freeze([]);

export function useNoticies(font) {
  const [dades, setDades] = useState({ estat: 'carregant', categories: BUIT, fonts: BUIT, articles: BUIT });
  const [intent, setIntent] = useState(0);

  useEffect(() => {
    let viu = true;
    Promise.all([font.llistaFonts(), font.llistaArticles()]).then(([{ categories, fonts }, articles]) => {
      if (viu) setDades({ estat: 'llest', categories, fonts, articles });
    }, () => {
      if (viu) setDades((abans) => ({ ...abans, estat: 'error' }));
    });
    return () => { viu = false; };
  }, [font, intent]);

  const rellegix = useCallback(() => {
    setDades((abans) => ({ ...abans, estat: 'carregant' }));
    setIntent((n) => n + 1);
  }, []);
  return useMemo(() => ({ ...dades, rellegix }), [dades, rellegix]);
}

export function useArticle(font, id) {
  const [dades, setDades] = useState({ id: null, intent: -1, estat: 'carregant', article: null });
  const [intent, setIntent] = useState(0);

  useEffect(() => {
    let viu = true;
    font.article(id).then((article) => {
      if (viu) setDades({ id, intent, estat: article ? 'llest' : 'absent', article });
    }, () => {
      if (viu) setDades({ id, intent, estat: 'error', article: null });
    });
    return () => { viu = false; };
  }, [font, id, intent]);

  const rellegix = useCallback(() => setIntent((n) => n + 1), []);
  /* Mentre no arriba la resposta d'este id i d'este intent, es carrega. */
  const actual = dades.id === id && dades.intent === intent ? dades : { estat: 'carregant', article: null };
  return useMemo(() => ({ estat: actual.estat, article: actual.article, rellegix }), [actual.estat, actual.article, rellegix]);
}
