/**
 * Lector de notícies · el que ve del port (fontNoticies.js), amb els seus estats.
 *
 *   useNoticies(font, enLinia, { preparat, clau }) → { estat, categories, fonts, articles, caigudes, motiu, rellegix }
 *   useArticle(font, id)       → { estat, article, rellegix }
 *   estat: 'carregant' · 'llest' · 'error' (i, per a un article, 'absent':
 *          la font ja no el servix)
 * Cap dels dos fa xarxa: només criden el port, que és qui sap d'on venen.
 * Una resposta que arriba quan ja no toca (un altre article, l'app tancada)
 * no es pinta.
 *
 * T5 (P1-07, 261024) · Les fonts de veres poden no respondre:
 *   caigudes  [{ fontId, motiu }] de l'última ronda acabada (port.salut());
 *             buida si totes han respost;
 *   motiu     per què: amb 'llest', el que més es repetix a les caigudes (o
 *             null); amb 'error', el del rebuig o, si no en porta, 'servidor'
 *             (MOTIUS_NOTICIES, fontNoticies.js);
 *   enLinia   el que diu el dispositiu (useSessioApp().enLinia): quan torna
 *             la xarxa i alguna cosa havia fallat, es torna a demanar tot sol
 *             (una vegada).
 *
 * T5b (261024) · El port del servei llig el que ha triat la persona (AppLector):
 *   preparat  fals mentre el disc no s'ha llegit: cap ronda encara (l'estat es
 *             queda 'carregant'); per defecte, cert;
 *   clau      la tria (fonts apagades i personals): quan canvia, una ronda nova
 *             SENSE tornar a 'carregant' (es veu el que hi havia fins que arriba).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motiuNet } from './fontNoticies.js';

const BUIT = Object.freeze([]);
const INICI = Object.freeze({ estat: 'carregant', categories: BUIT, fonts: BUIT, articles: BUIT, caigudes: BUIT, motiu: null });
/* Un port sense salut() (una prova antiga) no té caigudes. */
const salutDe = (font) => (typeof font.salut === 'function' ? font.salut() : Promise.resolve({ caigudes: BUIT, motiu: null }));

export function useNoticies(font, enLinia = true, { preparat = true, clau = '' } = {}) {
  const [dades, setDades] = useState(INICI);
  const [intent, setIntent] = useState(0);

  /* `clau` no es llig ací dins: només demana una ronda nova quan la tria canvia. */
  useEffect(() => {
    if (!preparat) return undefined;
    let viu = true;
    Promise.all([font.llistaFonts(), font.llistaArticles()])
      .then(([{ categories, fonts }, articles]) => salutDe(font).then(
        (salut) => ({ categories, fonts, articles, caigudes: salut?.caigudes || BUIT, motiu: salut?.motiu || null }),
        () => ({ categories, fonts, articles, caigudes: BUIT, motiu: null })
      ))
      .then((llestes) => {
        if (viu) setDades({ estat: 'llest', ...llestes });
      }, (error) => {
        if (viu) setDades((abans) => ({ ...abans, estat: 'error', motiu: motiuNet(error?.motiu) || 'servidor' }));
      });
    return () => { viu = false; };
  }, [font, intent, preparat, clau]);

  const rellegix = useCallback(() => {
    setDades((abans) => ({ ...abans, estat: 'carregant' }));
    setIntent((n) => n + 1);
  }, []);

  /* El dispositiu ha estat sense xarxa i ara en té: quan la ronda d'eixe moment ha acabat, si
     alguna cosa ha fallat es torna a demanar, una vegada. Si continua fallant amb xarxa, ja ho
     dirà la vista («Torna-ho a provar»): cap bucle. */
  const pendent = dades.estat === 'error' || dades.caigudes.length > 0;
  const haEstatFora = useRef(enLinia === false);
  useEffect(() => {
    if (enLinia === false) {
      haEstatFora.current = true;
      return;
    }
    if (dades.estat === 'carregant' || !haEstatFora.current) return;
    haEstatFora.current = false;
    if (pendent) rellegix();
  }, [enLinia, dades.estat, pendent, rellegix]);

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
