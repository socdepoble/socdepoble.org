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
      (next) => { if (!controller.signal.aborted) setPages({ scope, values: next }); },
      (reason) => { if (!controller.signal.aborted) setError({ scope, code: reason.code || 'WP_CARREGA_FALLIDA' }); }
    );
    return () => controller.abort();
  }, [allowed, scope]);
  if (!allowed) return <p role="status">{tx.trilogiaCalSessio}</p>;
  if (error?.scope === scope) return <p role="alert">{tx.trilogiaErrorCorpus(error.code)}</p>;
  if (!pages || pages.scope !== scope) return <p role="status">{tx.trilogiaVerificant}</p>;
  const item = transformaPaginaTrilogiaIMoliWp(pages.values[selected]);
  return (
    <section ref={adoptaEstilsAdminTaxonomia} className="sdp-admin-taxonomia__section" aria-label={tx.paginesTrilogiaRegio}>
      <h3>{tx.trilogiaTitol}</h3>
      <p>{tx.trilogiaIntro}</p>
      <label>
        {tx.trilogiaPaginaOriginal}
        <select value={selected} onChange={(event) => setSelected(Number(event.target.value))}>
          {pages.values.map((page, index) => <option key={page.id} value={index}>WP #{page.id} · {page.title}</option>)}
        </select>
      </label>
      <h4>{item.title}</h4>
      <p>{tx.trilogiaDataOriginal(item.created_at)}</p>
      <p role="status">
        {item.imatgesPendents.length
          ? tx.trilogiaRevisioPendent(item.imatgesPendents.length)
          : tx.trilogiaImatgesVerificades}
      </p>
      <p><Link to={`/notes?importacioWp=${encodeURIComponent(item.slug)}&ambit=mur`}>{tx.trilogiaObriEsborrany}</Link></p>
      {renderRichText(item.htmlNet)}
    </section>
  );
}
