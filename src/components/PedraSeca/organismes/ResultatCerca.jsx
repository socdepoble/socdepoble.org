/**
 * ResultatCerca.jsx — Un resultat de cerca a l'estil d'un cercador web (T45).
 *
 * Anatomia fixa: miniatura 1:1 o avatar · meta (insígnies i dades separades
 * per «·») · títol enllaçat · extracte de dues línies · acció opcional.
 * És presentacional: no sap d'on ve el resultat. El títol i l'extracte poden
 * arribar ja ressaltats (nodes amb <mark>); el component només els pinta.
 * El CSS viu a src/css/modules.css (bloc T45).
 *
 *  · El títol és l'únic enllaç del resultat. Una ruta que no és segura
 *    (javascript:, //un-altre-domini) deixa el títol sense enllaç.
 *  · La miniatura porta sempre alt: buit per defecte, perquè el títol ja és
 *    al costat. Només es pinta una font que un <img> pot obrir tal qual
 *    (http(s), ruta pròpia o data:image), la regla d'UniversalCard. Una
 *    referència opaca (sdp-media://…) s'ha de resoldre abans d'arribar ací;
 *    si no, es descarta: millor cap miniatura que una de trencada. La foto
 *    de l'avatar passa pel mateix filtre (sense foto, les inicials).
 *  · El nivell de la capçalera es limita a h2–h4: el h1 és de la pàgina.
 */
import { Fragment } from 'react';
import { Link } from '../../../app/contexts/RouterContext';
import { isSafeAsset, isSafeUrl } from '../../universal/UniversalUtils';
import { Avatar } from '../atoms/Avatar.jsx';
import { Insignia } from '../atoms/Insignia.jsx';

const nivellDe = (valor) => Math.min(4, Math.max(2, Math.round(Number(valor)) || 3));
const teContingut = (valor) => valor != null && valor !== '' && valor !== false;

export function ResultatCerca({
  titol,
  href = null,
  meta = [],
  extracte = null,
  tipus = null,
  avis = null,
  imatge = null,
  avatar = null,
  accio = null,
  headingLevel = 3,
  className
}) {
  const Capcalera = `h${nivellDe(headingLevel)}`;
  const enllac = typeof href === 'string' && isSafeUrl(href) ? href : null;
  const foto = imatge?.src && isSafeAsset(imatge.src) ? imatge : null;
  const dades = (Array.isArray(meta) ? meta : [meta]).filter(teContingut);
  const media = foto
    ? <img className="sdp-resultat-cerca__miniatura" src={foto.src} alt={foto.alt || ''} loading="lazy" referrerPolicy="no-referrer" />
    : avatar
      ? <Avatar className="sdp-resultat-cerca__avatar" nom={avatar.nom} src={isSafeAsset(avatar.src) ? avatar.src : null} llavor={avatar.llavor ?? null} mida="md" alt="" />
      : null;
  const teMeta = Boolean(tipus?.etiqueta) || teContingut(avis) || dades.length > 0;

  return (
    <article className={['sdp-resultat-cerca', media ? null : 'sdp-resultat-cerca--sense-media', className].filter(Boolean).join(' ')}>
      {media}
      <div className="sdp-resultat-cerca__cos">
        {teMeta ? (
          <p className="sdp-resultat-cerca__meta">
            {tipus?.etiqueta ? <Insignia to={tipus.to || 'neutre'}>{tipus.etiqueta}</Insignia> : null}
            {teContingut(avis) ? <Insignia to="avis">{avis}</Insignia> : null}
            {dades.map((dada, i) => (
              <Fragment key={i}>
                {i > 0 ? <span className="sdp-resultat-cerca__sep" aria-hidden="true">·</span> : null}
                <span>{dada}</span>
              </Fragment>
            ))}
          </p>
        ) : null}
        <Capcalera className="sdp-resultat-cerca__titol">
          {/* Un sol fill dins de l'enllaç flex: si no, l'espai entre un <mark> i el text es perd. */}
          {enllac ? <Link className="sdp-resultat-cerca__enllac" to={enllac}><span>{titol}</span></Link> : titol}
        </Capcalera>
        {teContingut(extracte) ? <p className="sdp-resultat-cerca__extracte">{extracte}</p> : null}
        {accio ? <div className="sdp-resultat-cerca__accio">{accio}</div> : null}
      </div>
    </article>
  );
}
