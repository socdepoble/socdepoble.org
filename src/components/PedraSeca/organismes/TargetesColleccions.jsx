/**
 * TargetesColleccions.jsx — les col·leccions com a targetes amb comptador
 * (esquelet comú T4/T8): «Les meues llistes» de La Compra i els «Tiquets
 * oberts» del TPV («Barra», «Taula 3»).
 *
 *   colleccio  { id, nom, comptador, secundari?, imatge? }
 *   actiu      l'id de la col·lecció oberta: aria-current="true"
 *   hrefDe(c)  amb href, cada targeta és un enllaç (pestanya nova inclosa);
 *              amb onTria, el clic normal el gestiona l'app
 *   onCrea     el botó «Crea…» de sota (textCrea)
 *
 * Cap il·lustració inventada: el nom, el comptador i, si l'app en té, una
 * imatge 1:1.
 */
import { ChevronRight, Plus } from 'lucide-react';
import { Boto } from '../atoms/Boto.jsx';
import { fontSegura } from './marca.jsx';

const esClicNormal = (event) => event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

export function TargetesColleccions({
  colleccions = [], etiqueta, actiu = null, hrefDe, onTria, onCrea, textCrea = 'Crea',
  textComptador = (n) => String(n), buit = null, className
}) {
  const llista = Array.isArray(colleccions) ? colleccions.filter((c) => c && typeof c.id === 'string') : [];
  return (
    <div className={['sdp-targetes-colleccions', className].filter(Boolean).join(' ')}>
      {llista.length ? (
        <ul className="sdp-targetes-colleccions__llista" aria-label={etiqueta}>
          {llista.map((colleccio) => {
            const n = Number.isSafeInteger(colleccio.comptador) && colleccio.comptador > 0 ? colleccio.comptador : 0;
            const src = fontSegura(colleccio.imatge);
            const contingut = (
              <>
                <span className="sdp-targeta-colleccio__nom">{colleccio.nom}</span>
                {' '}<span className="sdp-targeta-colleccio__comptador">{textComptador(n)}</span>
                {colleccio.secundari ? <>{' '}<span className="sdp-targeta-colleccio__secundari">{colleccio.secundari}</span></> : null}
                {src ? <img className="sdp-targeta-colleccio__imatge" src={src} alt="" loading="lazy" referrerPolicy="no-referrer" /> : null}
                <ChevronRight className="sdp-targeta-colleccio__fletxa" size={24} aria-hidden="true" focusable="false" />
              </>
            );
            const actual = actiu === colleccio.id ? 'true' : undefined;
            const href = typeof hrefDe === 'function' ? hrefDe(colleccio) : null;
            return (
              <li key={colleccio.id}>
                {href ? (
                  <a className="sdp-targeta-colleccio" href={href} aria-current={actual} onClick={(event) => {
                    if (!onTria || event.defaultPrevented || !esClicNormal(event)) return;
                    event.preventDefault();
                    onTria(colleccio);
                  }}>{contingut}</a>
                ) : (
                  <button type="button" className="sdp-targeta-colleccio" aria-current={actual} onClick={() => onTria?.(colleccio)}>{contingut}</button>
                )}
              </li>
            );
          })}
        </ul>
      ) : buit}
      {onCrea ? <Boto varietat="secundari" icona={Plus} ple onClick={onCrea}>{textCrea}</Boto> : null}
    </div>
  );
}
