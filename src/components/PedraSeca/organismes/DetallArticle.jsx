/**
 * DetallArticle.jsx — el detall d'un article en un Dialeg (esquelet comú
 * T4/T8): les variants del TPV («Tassa», «Got gran») o l'especificació de La
 * Compra («1 kg», «desnatada»), la quantitat amb el TeclatNumeric i una nota.
 *
 * El diàleg guarda només un esborrany (la tria en curs) i el torna amb
 * onAccepta({ variant, quantitat, nota }, article). L'esborrany torna a
 * començar cada vegada que s'obri o canvia d'article: `inicial` en dona els
 * valors (per a editar una línia ja feta).
 *
 * La quantitat comença en 1 i la primera tecla la substituïx (1 i després 3
 * fa 3, no 13), com en una caixa registradora. Amb 0 no es pot acceptar.
 *
 *   variants     [{ valor, etiqueta, ajuda? }] (GrupOpcions); l'ajuda porta el preu
 *   triaDirecta  el diàleg menut d'un grup obligatori (disseny del Bar §A.6,
 *                flux 1: «un toc tria i tanca»). Cada variant és un botó i
 *                tocar-ne un torna onAccepta({ variant, quantitat, nota }) amb
 *                l'esborrany (quantitat 1, nota buida, o els d'`inicial`). Sense
 *                ràdios, quantitat, nota ni botó d'acceptar. Sense variants, el
 *                detall de sempre.
 *   accions      botons de més al peu (p. ex. «Lleva de la llista»)
 *   children     informació de més al cos (al·lèrgens, recurrència…)
 */
import { useState } from 'react';
import { Boto } from '../atoms/Boto.jsx';
import { Dialeg } from './Dialeg.jsx';
import { TeclatNumeric } from './TeclatNumeric.jsx';
import { AreaText, Camp, GrupOpcions } from './formulari.jsx';
import { pintaQuadrat } from './marca.jsx';

const MAX_NOTA = 80;

function esborranyDe(variants, inicial) {
  const valors = Array.isArray(variants) ? variants.map((v) => v.valor) : [];
  const variant = inicial && valors.includes(inicial.variant) ? inicial.variant : (valors[0] ?? null);
  const quantitat = Number.isSafeInteger(inicial?.quantitat) && inicial.quantitat >= 0 ? inicial.quantitat : 1;
  const nota = typeof inicial?.nota === 'string' ? inicial.nota.slice(0, MAX_NOTA) : '';
  return { variant, quantitat, nota, quantitatTocada: false };
}

export function DetallArticle({
  obert = false, onTanca, article = null, categoria = null, variants = [], inicial = null,
  ambQuantitat = true, ambNota = true, etiquetaVariants = 'Variant', etiquetaQuantitat = 'Quantitat',
  etiquetaNota = 'Nota', unitat = '', textAccepta = 'Afig', textCancela = 'Cancel·la',
  triaDirecta = false, onAccepta, accions = null, renderMedia, children
}) {
  const visible = Boolean(obert && article);
  const opcions = Array.isArray(variants) ? variants : [];
  const directa = Boolean(triaDirecta) && opcions.length > 0;
  /* L'esborrany és de cada obertura: es reinicia quan s'obri o canvia d'article. */
  const [obertura, setObertura] = useState(0);
  const [eraVisible, setEraVisible] = useState(visible);
  if (visible !== eraVisible) {
    setEraVisible(visible);
    if (visible) setObertura((n) => n + 1);
  }
  const clau = `${article?.id ?? ''}#${obertura}`;
  const [esborrany, setEsborrany] = useState(() => esborranyDe(variants, inicial));
  const [clauEsborrany, setClauEsborrany] = useState(clau);
  if (clau !== clauEsborrany) {
    setClauEsborrany(clau);
    setEsborrany(esborranyDe(variants, inicial));
  }

  const canviaQuantitat = (nou) => setEsborrany((actual) => {
    if (actual.quantitatTocada) return { ...actual, quantitat: nou };
    const xifra = nou - actual.quantitat * 10;
    return { ...actual, quantitat: xifra >= 0 && xifra <= 9 ? xifra : nou, quantitatTocada: true };
  });
  const potAcceptar = !ambQuantitat || esborrany.quantitat > 0;
  const accepta = () => {
    if (!potAcceptar) return;
    const { variant, quantitat, nota } = esborrany;
    onAccepta?.({ variant, quantitat: ambQuantitat ? quantitat : null, nota: ambNota ? nota.trim() : '' }, article);
  };
  /* Tria directa: el toc és la tria i l'acceptació alhora. */
  const triaIAccepta = (variant) => {
    onAccepta?.({ variant, quantitat: esborrany.quantitat > 0 ? esborrany.quantitat : 1, nota: esborrany.nota.trim() }, article);
  };

  return (
    <Dialeg
      obert={visible}
      onTanca={onTanca}
      titol={article?.nom || ''}
      descripcio={article?.secundari || undefined}
      accions={visible ? (
        <>
          <Boto varietat="secundari" onClick={() => onTanca?.('boto')}>{textCancela}</Boto>
          {accions}
          {directa ? null : <Boto varietat="primari" onClick={accepta} disabled={!potAcceptar}>{textAccepta}</Boto>}
        </>
      ) : null}
    >
      {visible ? (
        <div className="sdp-detall-article">
          <div className="sdp-detall-article__cap">
            <span className="sdp-detall-article__quadrat" aria-hidden="true">{pintaQuadrat(article, categoria, renderMedia)}</span>
            {article.valor ? <p className="sdp-detall-article__valor">{article.valor}</p> : null}
          </div>
          {directa ? (
            <fieldset className="sdp-grup">
              <legend className="sdp-grup__llegenda">{etiquetaVariants}</legend>
              <ul className="sdp-detall-article__opcions">
                {opcions.map((opcio) => (
                  <li key={opcio.valor}>
                    <Boto mida="gran" ple onClick={() => triaIAccepta(opcio.valor)}>
                      {opcio.ajuda ? `${opcio.etiqueta} · ${opcio.ajuda}` : opcio.etiqueta}
                    </Boto>
                  </li>
                ))}
              </ul>
            </fieldset>
          ) : null}
          {!directa && opcions.length ? (
            <GrupOpcions llegenda={etiquetaVariants} opcions={opcions} valor={esborrany.variant}
              onCanvi={(variant) => setEsborrany((actual) => ({ ...actual, variant }))} />
          ) : null}
          {ambQuantitat && !directa ? (
            <TeclatNumeric mode="quantitat" etiqueta={etiquetaQuantitat} unitat={unitat}
              valor={esborrany.quantitat} onCanvi={canviaQuantitat} />
          ) : null}
          {ambNota && !directa ? (
            <Camp etiqueta={etiquetaNota}>
              <AreaText files={2} maxLength={MAX_NOTA} value={esborrany.nota}
                onChange={(event) => {
                  const nota = event.target.value.slice(0, MAX_NOTA);
                  setEsborrany((actual) => ({ ...actual, nota }));
                }} />
            </Camp>
          ) : null}
          {children}
        </div>
      ) : null}
    </Dialeg>
  );
}
