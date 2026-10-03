/**
 * Esquelet comú de catàleg i col·lecció · la columna del CATÀLEG.
 *
 * Ordre del Mestre (261002, sinergies T4/T8): el TPV del bar i La Compra
 * pinten el catàleg amb esta mateixa columna. Cap app fa una graella pròpia.
 * La columna és presentacional: rep els articles ja vestits (preu, IVA,
 * pendent o comprat són intel·ligència de cada app) i torna els gestos.
 *
 *   capçalera  AppGridColumn amb el títol
 *   eines      SelectorCategoria · vista (graella/llista) · AfegitRapid
 *   cos        GraellaArticles o LlistaArticles, per seccions de categoria
 *              (agrupa) o plana; els destacats («Recents») van davant
 *   detall     DetallArticle, obert per ?article=<id>. Amb
 *              detall.triaDirecta (booleà o funció de l'article), el diàleg
 *              menut d'un grup obligatori: un toc tria i tanca (disseny del
 *              Bar §A.6, flux 1). El toc normal l'obri amb obriDetall només
 *              si l'app ho decidix; si no, l'app afig la variant per defecte
 *   peu        en pantalla estreta, BarraResum, que porta a la col·lecció
 * Tot l'estat de vista viu a la URL (vistes.js). Sense categories ni
 * destacats, el catàleg és una sola peça plana, sense seccions.
 */
import { LayoutGrid, List } from 'lucide-react';
import AppGridColumn from '../../../components/layout/AppGridColumn.jsx';
import {
  AfegitRapid, BarraResum, DetallArticle, EstatBuit, GraellaArticles, LlistaArticles, MarcColumna, PillToggle,
  SelectorCategoria
} from '../../../components/PedraSeca/index.js';
import { useClosaAplicacio } from '../../plataforma/index.js';
import { useVistaCataleg, useVistesEsquelet } from './vistes.js';

const TEXTOS_CATALEG = Object.freeze({
  buit: 'No hi ha cap article ací',
  buitText: 'Tria una altra categoria o afig-ne un amb el camp de dalt.',
  vista: 'Vista del catàleg',
  graella: 'Graella',
  llista: 'Llista',
  categoria: 'Categoria',
  totes: 'Totes'
});

export function ColumnaCataleg({
  titol = 'Catàleg', categories = [], articles = [], destacats = [], agrupa = true,
  selector = 'pastilles', ambVistes = true, vistaPerDefecte = 'graella',
  onTria, commutable = false, textosEstat, renderMedia, plegades, onPlega, textArticles,
  afegit = null, detall = null, resum = null, primer, tram, textos
}) {
  const t = { ...TEXTOS_CATALEG, ...textos };
  const { mida } = useClosaAplicacio();
  const vista = useVistaCataleg(vistaPerDefecte);
  const vistes = useVistesEsquelet({ primer, tram });
  const llista = Array.isArray(articles) ? articles : [];
  const totes = Array.isArray(categories) ? categories : [];
  const perId = new Map(totes.map((categoria) => [categoria.id, categoria]));

  const articleObert = detall && vista.article ? llista.find((article) => article.id === vista.article) || null : null;
  const obriDetall = detall ? (article) => vista.obriArticle(article.id) : undefined;
  const tria = (article) => {
    if (onTria) onTria(article, { obriDetall: () => obriDetall?.(article) });
    else obriDetall?.(article);
  };

  /* El filtre de la URL; els destacats només amb totes les categories. */
  const filtrats = vista.categoria ? llista.filter((article) => article.categoriaId === vista.categoria) : llista;
  const delFiltre = vista.categoria ? totes.filter((categoria) => categoria.id === vista.categoria) : totes;
  const grupsDestacats = agrupa && !vista.categoria && Array.isArray(destacats)
    ? destacats.filter((d) => d && typeof d.id === 'string' && Array.isArray(d.articles) && d.articles.length) : [];
  /* Sense categories ni destacats no hi ha res a agrupar: una sola peça plana,
     no una secció «Altres» inventada amb tot el catàleg. */
  const categoriesCos = agrupa && (totes.length > 0 || grupsDestacats.length > 0) ? [
    ...grupsDestacats.map((d, i) => ({ id: `destacat-${d.id}`, nom: d.nom, icona: d.icona, visible: true, ordre: -grupsDestacats.length + i })),
    ...delFiltre
  ] : null;
  const articlesCos = [
    ...grupsDestacats.flatMap((d) => d.articles.map((article) => ({ ...article, categoriaId: `destacat-${d.id}` }))),
    ...filtrats
  ];
  const Peca = vista.vista === 'llista' ? LlistaArticles : GraellaArticles;

  const eines = (
    <>
      {selector ? (
        <SelectorCategoria categories={totes} valor={vista.categoria} onCanvi={vista.triaCategoria}
          forma={selector === 'desplegable' ? 'desplegable' : 'pastilles'} etiqueta={t.categoria} textTotes={t.totes} />
      ) : null}
      {ambVistes ? (
        <PillToggle etiqueta={t.vista} valor={vista.vista} onCanvi={vista.triaVista} opcions={[
          { valor: 'graella', text: t.graella, icona: <LayoutGrid size={20} aria-hidden="true" focusable="false" /> },
          { valor: 'llista', text: t.llista, icona: <List size={20} aria-hidden="true" focusable="false" /> }
        ]} />
      ) : null}
      {afegit ? <AfegitRapid {...afegit} onTria={afegit.onTria || tria} /> : null}
    </>
  );
  const peu = mida === 'estret' && resum ? (
    <BarraResum {...resum} forma="peu" href={vistes.colleccio.href} onObri={vistes.colleccio.vesA} />
  ) : null;

  return (
    <MarcColumna capcalera={<AppGridColumn titol={titol} />} eines={selector || ambVistes || afegit ? eines : null}
      peu={peu} etiqueta={titol}>
      <Peca
        articles={articlesCos}
        categories={categoriesCos}
        etiqueta={titol}
        onTria={tria}
        onAccioSecundaria={obriDetall}
        commutable={commutable}
        textos={textosEstat}
        renderMedia={renderMedia}
        plegades={plegades}
        onPlega={onPlega}
        textArticles={textArticles}
        buit={<EstatBuit titol={t.buit}>{t.buitText}</EstatBuit>}
      />
      {detall ? (
        <DetallArticle
          obert={Boolean(articleObert)}
          article={articleObert}
          categoria={perId.get(articleObert?.categoriaId) || null}
          variants={articleObert ? detall.variantsDe?.(articleObert) || [] : []}
          inicial={articleObert ? detall.inicialDe?.(articleObert) || null : null}
          triaDirecta={articleObert ? Boolean(typeof detall.triaDirecta === 'function' ? detall.triaDirecta(articleObert) : detall.triaDirecta) : false}
          ambQuantitat={detall.ambQuantitat ?? true}
          ambNota={detall.ambNota ?? true}
          etiquetaVariants={articleObert && typeof detall.etiquetaVariants === 'function' ? detall.etiquetaVariants(articleObert) : detall.etiquetaVariants}
          etiquetaNota={detall.etiquetaNota}
          unitat={detall.unitat}
          textAccepta={detall.textAccepta}
          renderMedia={renderMedia}
          onTanca={vista.tancaArticle}
          onAccepta={(valors, article) => {
            detall.onAccepta?.(valors, article);
            vista.tancaArticle();
          }}
          accions={articleObert ? detall.accionsDe?.(articleObert, vista.tancaArticle) || null : null}
        >
          {articleObert ? detall.contingutDe?.(articleObert) || null : null}
        </DetallArticle>
      ) : null}
    </MarcColumna>
  );
}
