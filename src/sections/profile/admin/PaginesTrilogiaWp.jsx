import { useEffect, useState } from 'react';
import { Link } from '../../../app/contexts/RouterContext.jsx';
import { useLlenguaDeLaUI } from '../useLlenguaDeLaUI.js';
import { useSessioOpcional } from '../../../app/contexts/SessionContext.jsx';
import { carregaPaginesTrilogiaIMoliWp } from '../../../data/importacio/paginesTrilogiaIMoliWp.js';
import { transformaPaginaTrilogiaIMoliWp } from '../../../data/importacio/paginesTrilogiaIMoliEditorial.js';
import { renderRichText } from '../../detail/detailRichText.jsx';
import cssAdminTaxonomia from '../../../css/diferit-admin-taxonomia.css?inline';
import { adoptaFullDiferit } from '../../../config/fullDiferit.js';
import { textosAdminEntitats } from './i18nAdminEntitats.js';

/* v1.2.18 · Sostre d'arrencada (Gauntlet R1, L5-01) · Els fills .sdp-admin-taxonomia__* viatgen en un full diferit:
   cada etiqueta que en porta una classe l'adopta abans de pintar amb este ref estable (clau literal per a la
   Porta Vocabulari i el tractor de fulls diferits). */
const adoptaEstilsAdminTaxonomia = (node) => { if (node) adoptaFullDiferit(node, 'admin-taxonomia', cssAdminTaxonomia); };

export default function PaginesTrilogiaWp() {
  const llenguaUI = useLlenguaDeLaUI();
  const tx = textosAdminEntitats(llenguaUI);
  const sessio = useSessioOpcional();
  const allowed = Boolean(sessio?.currentUser?.id && sessio.estat === 'dins' && sessio.esSuperadmin && sessio.nivell === 'aal2');
  const [pages, setPages] = useState(null), [selected, setSelected] = useState(0), [error, setError] = useState(null);
  const scope = `${sessio?.currentUser?.id || ''}:${sessio?.generacio || 0}`;
  useEffect(() => {
    if (!allowed) return;
    const controller = new AbortController();
    carregaPaginesTrilogiaIMoliWp({ signal: controller.signal }).then(
      next => { if (!controller.signal.aborted) setPages({ scope, values: next }); },
      reason => { if (!controller.signal.aborted) setError({ scope, code: reason.code || 'WP_CARREGA_FALLIDA' }); }
    );
    return () => controller.abort();
  }, [allowed, scope]);
  if (!allowed) return <p role="status">Cal una sessió d’administració amb segon factor per revisar estes pàgines.</p>;
  if (error?.scope === scope) return <p role="alert">No s’ha pogut verificar el corpus: {error.code}</p>;
  if (!pages || pages.scope !== scope) return <p role="status">Verificant les deu pàgines originals…</p>;
  const item = transformaPaginaTrilogiaIMoliWp(pages.values[selected]);
  return <section ref={adoptaEstilsAdminTaxonomia} className="sdp-admin-taxonomia__section" aria-label={tx.paginesTrilogiaRegio}>
    <h2>Trilogia Mediterrània i patrimoni de La Torre · 10 pàgines</h2>
    <p>Esborranys privats per revisar. Obrir-los no crea notes ni publica contingut.</p>
    <label>Pàgina original <select value={selected} onChange={event => setSelected(Number(event.target.value))}>
      {pages.values.map((page, index) => <option key={page.id} value={index}>WP #{page.id} · {page.title}</option>)}
    </select></label>
    <h3>{item.title}</h3>
    <p>Data original: {item.created_at} (hora local de WordPress, sense fus declarat).</p>
    <p role="status">{item.imatgesPendents.length
      ? `Revisió pendent. ${item.imatgesPendents.length} imatges pendents de còpia pròpia verificada; publicació bloquejada.`
      : 'Imatges pròpies verificades. La revisió editorial continua pendent; no s’ha publicat res.'}</p>
    <p><Link to={`/notes?importacioWp=${encodeURIComponent(item.slug)}&ambit=mur`}>Obri l’esborrany amb Edició avançada</Link></p>
    {renderRichText(item.htmlNet)}
  </section>;
}
