/**
 * Histograma.jsx — barres verticals fetes amb CSS, sense llibreries de
 * gràfics ni style=: l'alçada de cada barra és una classe de nivell
 * (sdp-histograma__barra--n0 … --n10, de 10 en 10 %), calculada amb
 * nivellHistograma(valor, maxim).
 *
 * barres: [{ id?, etiqueta, valor, marca? }]
 *   etiqueta  el nom sencer de la barra, per al lector de pantalla («07 h»)
 *   marca     el text curt de davall de la barra; per defecte, l'etiqueta.
 *             '' per a no pintar-ne (p. ex. només una de cada tres hores)
 * maxim      el valor que omplin la barra sencera (per defecte, el més gran)
 * destacada  l'id (o l'etiqueta) de la barra que s'ha de remarcar
 * valors     false per a no pintar la xifra damunt de cada barra
 * formatValor  (valor) → text, per a la xifra i el lector de pantalla
 *
 * Accessibilitat: <figure> amb <figcaption>; cada barra és un element de
 * llista amb el text sencer per al lector («07 h: 3 episodis») i el dibuix
 * amagat (aria-hidden). Sense barres, l'EstatBuit de Pedra Seca.
 */
import { useId } from 'react';
import { EstatBuit } from '../atoms/estats.jsx';

const NIVELLS = 10;
/* Literals sencers: els noms de classe es busquen al CSS tal qual. */
const CLASSES_NIVELL = Object.freeze([
  'sdp-histograma__barra--n0', 'sdp-histograma__barra--n1', 'sdp-histograma__barra--n2', 'sdp-histograma__barra--n3',
  'sdp-histograma__barra--n4', 'sdp-histograma__barra--n5', 'sdp-histograma__barra--n6', 'sdp-histograma__barra--n7',
  'sdp-histograma__barra--n8', 'sdp-histograma__barra--n9', 'sdp-histograma__barra--n10'
]);

/**
 * Nivell de 0 a 10 d'un valor respecte del màxim. Qualsevol valor positiu
 * es veu (mínim 1); zero, negatiu o no numèric és 0.
 * @param {number} valor
 * @param {number} maxim
 * @returns {number}
 */
export function nivellHistograma(valor, maxim) {
  if (!Number.isFinite(valor) || valor <= 0 || !Number.isFinite(maxim) || maxim <= 0) return 0;
  return Math.min(NIVELLS, Math.max(1, Math.round((valor / maxim) * NIVELLS)));
}

const textPerDefecte = (valor) => String(valor);

export function Histograma({
  barres = [], titol, unitat = '', maxim, destacada = null, valors = true,
  formatValor = textPerDefecte, buit = 'Encara no hi ha dades.', className
}) {
  const idTitol = useId();
  if (!barres.length) return <EstatBuit titol={buit} className={className} />;
  const numerics = barres.map((barra) => (Number.isFinite(barra.valor) ? barra.valor : 0));
  const sostre = Number.isFinite(maxim) && maxim > 0 ? maxim : Math.max(...numerics);
  return (
    /* aria-labelledby a més del figcaption: no tots els motors en trauen el nom. */
    <figure className={['sdp-histograma', className].filter(Boolean).join(' ')} aria-labelledby={titol ? idTitol : undefined}>
      {titol ? <figcaption id={idTitol} className="sdp-histograma__titol">{titol}</figcaption> : null}
      <ol className="sdp-histograma__barres">
        {barres.map((barra, i) => {
          const valor = numerics[i];
          const clau = barra.id ?? barra.etiqueta;
          const text = formatValor(valor);
          const remarcada = destacada !== null && clau === destacada;
          return (
            <li key={clau} className={remarcada ? 'sdp-histograma__columna sdp-histograma__columna--destacada' : 'sdp-histograma__columna'}>
              <span className="sdp-nomes-lector">{`${barra.etiqueta}: ${text}${unitat ? ` ${unitat}` : ''}`}</span>
              <span className="sdp-histograma__valor" aria-hidden="true">{valors && valor > 0 ? text : ''}</span>
              <span className="sdp-histograma__pista" aria-hidden="true">
                <span className={['sdp-histograma__barra', CLASSES_NIVELL[nivellHistograma(valor, sostre)]].join(' ')} />
              </span>
              <span className="sdp-histograma__marca" aria-hidden="true">{barra.marca ?? barra.etiqueta}</span>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}
