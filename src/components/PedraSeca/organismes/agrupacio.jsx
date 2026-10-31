/**
 * agrupacio.jsx — la forma comuna de GraellaArticles i LlistaArticles: les
 * dues vistes reben les mateixes props i només canvia la peça que pinta cada
 * grup (la reixa de rajoles o les files). Amb `categories`, una secció per
 * categoria (SeccionsCategoria); sense, una sola peça.
 *
 * La variant `panoramica` (true) és l'EXCEPCIÓ a la regla 1:1 de Pedra Seca
 * (§8), autoritzada pel Mestre el 261003 i limitada a les targetes del Lector
 * de notícies: posa .sdp-panoramica al contenidor i la imatge i el marcador
 * passen a 16:9 (src/css/modules.css, bloc catalegColleccio). Fora de
 * src/apps/lector i del seu espècimen no es pot fer servir
 * (PedraSeca/qualitat.panoramica.test.js).
 *
 * Funció de pintat (no és cap component del catàleg).
 */
import { SeccionsCategoria } from './SeccionsCategoria.jsx';
import { TEXTOS_ARTICLES } from './articles.js';

export function pintaArticles(Peca, props, idPista, classeSeccions) {
  const {
    articles = [], categories = null, etiqueta, onTria, onAccioSecundaria, commutable = false,
    textos, renderMedia, plegades, onPlega, textArticles, buit = null, className, panoramica = false
  } = props;
  const classe = [panoramica === true ? 'sdp-panoramica' : null, className].filter(Boolean).join(' ') || undefined;
  const t = { ...TEXTOS_ARTICLES, ...textos };
  const llista = Array.isArray(articles) ? articles.filter((a) => a && typeof a.id === 'string') : [];
  const categoriesPerId = new Map((Array.isArray(categories) ? categories : []).map((c) => [c.id, c]));
  const comuns = { categoriesPerId, onTria, onAccioSecundaria, commutable, textos: t, renderMedia, idPista };
  const pista = onAccioSecundaria ? <p id={idPista} className="sdp-nomes-lector">{t.pista}</p> : null;

  if (Array.isArray(categories)) {
    return (
      <div className={[classeSeccions, classe].filter(Boolean).join(' ')}>
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
      <Peca {...comuns} articles={llista} etiqueta={etiqueta} className={classe} />
      {pista}
    </>
  );
}
