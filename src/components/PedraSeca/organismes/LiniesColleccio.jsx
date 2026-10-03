/**
 * LiniesColleccio.jsx — les línies de la col·lecció en curs (esquelet comú
 * T4/T8): el tiquet del TPV i la llista de la compra en mode llista.
 *
 *   linia { id, articleId, quantitat, nom, detall?, valor?, estat? }
 *   «quantitat × nom», el detall davall (variant, nota, especificació), el
 *   valor a la dreta («3,00 €», «2 kg») i l'estat amb text, mai només color.
 *
 * Accions, totes opcionals i amb el nom de la línia al nom accessible:
 *   onTria(linia)   el toc a la línia (La Compra: marcar com a comprat)
 *   onEdita(linia)  editar-la (el TPV: variant, nota, descompte). Sense
 *                   onTria, el toc a la línia edita; amb onTria, és un botó a part
 *   onResta / onSuma  una unitat menys o més (què passa en arribar a 0 ho decidix l'app)
 *   onLleva(linia)  llevar-la
 */
import { Minus, Pencil, Plus, Trash2 } from 'lucide-react';
import { Insignia } from '../atoms/Insignia.jsx';
import { TEXTOS_ESTAT_LINIA, estatLinia } from './articles.js';

const TEXTOS_LINIES = Object.freeze({
  unitats: (n) => `${n} ${n === 1 ? 'unitat' : 'unitats'} de`,
  ...TEXTOS_ESTAT_LINIA,
  resta: (nom) => `Resta una unitat: ${nom}`,
  suma: (nom) => `Suma una unitat: ${nom}`,
  edita: (nom) => `Edita ${nom}`,
  lleva: (nom) => `Lleva ${nom}`
});

const CLASSE_LINIA = Object.freeze({
  normal: 'sdp-linies__linia',
  fet: 'sdp-linies__linia sdp-linies__linia--fet',
  anullat: 'sdp-linies__linia sdp-linies__linia--anullat'
});

const TO_ESTAT = Object.freeze({ fet: 'exit', anullat: 'neutre' });

const icona = (Icona) => <Icona size={20} aria-hidden="true" focusable="false" />;

export function LiniesColleccio({
  linies = [], etiqueta, onTria, onEdita, onResta, onSuma, onLleva, textos, buit = null, className
}) {
  const t = { ...TEXTOS_LINIES, ...textos };
  const llista = Array.isArray(linies) ? linies.filter((l) => l && typeof l.id === 'string') : [];
  if (llista.length === 0) return buit;
  const principal = onTria || onEdita;
  const ambAccions = Boolean(onResta || onSuma || onLleva || (onTria && onEdita));
  return (
    <ul className={['sdp-linies', className].filter(Boolean).join(' ')} aria-label={etiqueta}>
      {llista.map((linia) => {
        const estat = estatLinia(linia);
        const contingut = (
          <>
            {Number.isFinite(linia.quantitat) ? (
              <span className="sdp-linies__quantitat">
                <span aria-hidden="true">{`${linia.quantitat} ×`}</span>
                <span className="sdp-nomes-lector">{t.unitats(linia.quantitat)}</span>
              </span>
            ) : null}
            {' '}<span className="sdp-linies__nom">{linia.nom}</span>
            {linia.valor ? <>{' '}<span className="sdp-linies__valor">{linia.valor}</span></> : null}
            {linia.detall ? <>{' '}<span className="sdp-linies__detall">{linia.detall}</span></> : null}
            {estat === 'normal' ? null : (
              <>{' '}<span className="sdp-linies__estat"><Insignia to={TO_ESTAT[estat]}>{t[estat]}</Insignia></span></>
            )}
          </>
        );
        return (
          <li key={linia.id} className={CLASSE_LINIA[estat]} data-linia={linia.id}>
            {principal ? (
              <button type="button" className="sdp-linies__principal" onClick={() => principal(linia)}>{contingut}</button>
            ) : <div className="sdp-linies__principal">{contingut}</div>}
            {ambAccions ? (
              <div className="sdp-linies__accions">
                {onResta ? (
                  <button type="button" className="sdp-accio-icona" aria-label={t.resta(linia.nom)} onClick={() => onResta(linia)}>{icona(Minus)}</button>
                ) : null}
                {onSuma ? (
                  <button type="button" className="sdp-accio-icona" aria-label={t.suma(linia.nom)} onClick={() => onSuma(linia)}>{icona(Plus)}</button>
                ) : null}
                {onTria && onEdita ? (
                  <button type="button" className="sdp-accio-icona" aria-label={t.edita(linia.nom)} onClick={() => onEdita(linia)}>{icona(Pencil)}</button>
                ) : null}
                {onLleva ? (
                  <button type="button" className="sdp-accio-icona" aria-label={t.lleva(linia.nom)} onClick={() => onLleva(linia)}>{icona(Trash2)}</button>
                ) : null}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
