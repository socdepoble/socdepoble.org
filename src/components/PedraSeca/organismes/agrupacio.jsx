/**
 * agrupacio.jsx — la forma comuna de GraellaArticles i LlistaArticles: les
 * dues vistes reben les mateixes props i només canvia la peça que pinta cada
 * grup (la reixa de rajoles o les files). Amb `categories`, una secció per
 * categoria (SeccionsCategoria); sense, una sola peça.
 *
 * Funció de pintat (no és cap component del catàleg).
 */
import { SeccionsCategoria } from './SeccionsCategoria.jsx';
import { TEXTOS_ARTICLES } from './articles.js';

export function pintaArticles(Peca, props, idPista, classeSeccions) {
  const {
    articles = [], categories = null, etiqueta, onTria, onAccioSecundaria, commutable = false,
    textos, renderMedia, plegades, onPlega, textArticles, buit = null, className
  } = props;
  const t = { ...TEXTOS_ARTICLES, ...textos };
  const llista = Array.isArray(articles) ? articles.filter((a) => a && typeof a.id === 'string') : [];
  const categoriesPerId = new Map((Array.isArray(categories) ? categories : []).map((c) => [c.id, c]));
  const comuns = { categoriesPerId, onTria, onAccioSecundaria, commutable, textos: t, renderMedia, idPista };
  const pista = onAccioSecundaria ? <p id={idPista} className="sdp-nomes-lector">{t.pista}</p> : null;

  if (Array.isArray(categories)) {
    return (
      <div className={[classeSeccions, className].filter(Boolean).join(' ')}>
        <SeccionsCategoria categories={categories} articles={llista} plegades={plegades} onPlega={onPlega}
          textSenseCategoria={t.senseCategoria} textArticles={textArticles} buit={buit}>
          {(delGrup, categoria) => <Peca {...comuns} articles={delGrup} etiqueta={categoria.nom} />}
        </SeccionsCategoria>
        {pista}
      </div>
    );
  }
  if (llista.length === 0) return buit;
  return (
    <>
      <Peca {...comuns} articles={llista} etiqueta={etiqueta} className={className} />
      {pista}
    </>
  );
}
