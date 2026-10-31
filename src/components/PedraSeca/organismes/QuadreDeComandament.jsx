/**
 * QuadreDeComandament.jsx — el motlle de tauler compacte de Pedra Seca.
 *
 * Ordre del Mestre (31-10-2026, 00:20, prompt 2208, T3.1): una sola peça
 * per a la Telemetria (Umami), la Consola, la Gestoria (Holded,
 * FacturaDirecta) i el TPV o la Botiga (Loyverse). Tot arriba per props:
 * la peça no demana res a ningú. Estils: src/css/taulers.css.
 *
 * De dalt a baix, totes opcionals:
 *   estat       { text, viu }   píndola d'estat amb punt (viu: verd)
 *   periode     node            de quan són les xifres, en cos de paràgraf
 *   xifres      [{ clau, nom, valor, lector? }]
 *               targetes KPI baixes: només etiqueta i xifra; `lector` és el
 *               text sencer per al lector de pantalla («20 minuts i 25 segons»)
 *   explicacio  node            què vol dir cada xifra, a tota amplada i
 *                               fora de les caixes, amb el cos de la pàgina
 *   grafica     { titol, series: [{ clau, nom }] (1 o 2),
 *                 punts: [{ id, etiqueta, marca?, valors: { [clau]: nombre } }] | null,
 *                 destacat?, detall?(punt) → text, llengua?, buit, falta }
 *               barres per punt (la primera sèrie, estreta i fosca, davant de
 *               la segona, com les barres bicolors d'Umami) i el detall
 *               exacte del punt sota el ratolí, el dit o el focus. Els
 *               valors negatius (un saldo, un resultat) baixen des de la
 *               línia del zero; un valor absent (null) no pinta barra i el
 *               detall per defecte diu «—», mai un zero inventat. Sense
 *               detall, el valor va amb el format (Intl) de `llengua`
 *   ranquing    { titol, intro?, files: [{ clau, nom, codi?, valor, proporcio? }] | null,
 *                 buit, falta, nota? }
 *               una fila compacta per element: nom i codi en línia a
 *               l'esquerra, comptador a la dreta i barra suau de proporció (0-1)
 *   peu         node
 *   nivell      2-6, el nivell del títol del rànquing (per defecte, 4)
 *
 * punts: null o files: null vol dir que la dada no ha arribat (`falta`), i
 * també uns punts sense cap valor numèric; una llista buida o tots els
 * valors a zero, que no n'hi ha (`buit`).
 *
 * Accessibilitat: cada punt de la gràfica és un botó amb el detall sencer
 * per nom; un sol tabulador entra al grup (focus itinerant) i les fletxes,
 * Inici i Fi el recorren. El detall de davall és text real, no un title, i
 * mana l'última interacció: el teclat o un focus nou desfan la
 * previsualització del ratolí. En pantalla tàctil, el dit es pot arrossegar
 * per tota la gràfica (24 columnes no caben a 48 px cadascuna en un mòbil):
 * la superfície de toc és la gràfica sencera, no la barra.
 *
 * Geometria exacta, sense style= ni escalons (Gauntlet f8, F8-CRIT-01 i 05):
 * les barres i les proporcions són <rect> d'un <svg> aria-hidden amb y,
 * height i width en percentatge, que són atributs de presentació. Un valor
 * diferent de zero sempre es veu: com a mínim, l'1 % de la pista.
 */
import { useId, useRef, useState } from 'react';

const MINIM_VISIBLE = 0.01;
const TITOLS = Object.freeze({ 2: 'h2', 3: 'h3', 4: 'h4', 5: 'h5', 6: 'h6' });
/* On va cada sèrie dins de la columna. La de darrere ocupa el 80 % (com a
   molt 1,5rem: el dibuix fa com a molt 1,875rem, taulers.css) i la de davant,
   centrada, el 40 % (com a molt 0,75rem). */
const LLOC = Object.freeze({ darrere: { x: '10%', width: '80%' }, davant: { x: '30%', width: '40%' } });

/**
 * Fracció exacta (0-1) d'un valor positiu respecte d'un màxim positiu, sense
 * escalons: dos valors diferents fan dues barres diferents. Qualsevol valor
 * positiu es veu (mínim, l'1 %); zero, negatiu o no numèric és 0.
 */
export function fraccioQuadre(valor, maxim) {
  if (!Number.isFinite(valor) || valor <= 0 || !Number.isFinite(maxim) || maxim <= 0) return 0;
  return Math.min(1, Math.max(MINIM_VISIBLE, valor / maxim));
}

/* «37.5%»: tres decimals de percentatge, una mil·lèsima de píxel en 8rem. */
const percent = (fraccio) => `${Number((fraccio * 100).toFixed(3))}%`;
const clauDelPunt = (punt, i) => punt?.id ?? punt?.etiqueta ?? i;

/* El format de la llengua que diu el consumidor (BCP 47, «ca»); sense
   llengua o amb una de no vàlida, la del navegador. La peça no mira el
   document de l'amfitrió (Pedra Seca, LLEI 6). */
function formatEn(llengua) {
  try {
    return new Intl.NumberFormat(llengua || undefined);
  } catch {
    return new Intl.NumberFormat();
  }
}

/* El valor de veres, amb el format local; «—» si no n'hi ha. Mai un zero
   inventat ni un negatiu amagat. */
function detallPerDefecte(punt, series, format) {
  const text = (valor) => (Number.isFinite(valor) ? format.format(valor) : '—');
  return `${punt.etiqueta}: ${series.map((serie) => `${serie.nom} ${text(punt.valors?.[serie.clau])}`).join(' · ')}`;
}

/* La barra d'una sèrie en un punt. Positiva: puja des del zero, dins de la
   regió de dalt; negativa: baixa des del zero, dins de la de baix. El <rect>
   fa el doble de la regió i en travessa la vora del zero, que el retalla:
   així només s'arrodonix la punta de la dada (rx, taulers.css), mai la
   base, tampoc en la barra del màxim. */
function barraDelQuadre({ valor, sostre, terra, lloc, classe }) {
  if (!Number.isFinite(valor) || valor === 0) return null;
  const y = valor > 0 ? percent(1 - fraccioQuadre(valor, sostre)) : percent(fraccioQuadre(-valor, -terra) - 2);
  return {
    regio: valor > 0 ? 'dalt' : 'baix',
    rect: <rect key={classe} className={`sdp-quadre__barra ${classe}`} x={lloc.x} width={lloc.width} y={y} height="200%" />
  };
}

function GraficaDelQuadre({ titol, series = [], punts, destacat = null, detall, llengua, buit, falta }) {
  const idTitol = useId();
  const idDetall = useId();
  const [fixat, setFixat] = useState(null);
  const [previ, setPrevi] = useState(null);
  const botons = useRef([]);

  if (!Array.isArray(punts)) return falta ? <p className="sdp-quadre__avis">{falta}</p> : null;
  const dues = series.slice(0, 2);
  /* Amb dues sèries, la primera va davant (estreta i fosca); amb una, la barra ampla. */
  const [davant, darrere] = dues.length === 2 ? dues : [null, dues[0] || null];
  /* Només els valors numèrics compten; els negatius també (un saldo). */
  const finits = punts.flatMap((punt) => dues.map((serie) => punt.valors?.[serie.clau])).filter(Number.isFinite);
  const sostre = Math.max(0, ...finits);
  const terra = Math.min(0, ...finits);
  const rang = sostre - terra;
  const zero = rang > 0 ? percent(sostre / rang) : '100%';
  const format = formatEn(llengua);
  const textDe = (punt) => (detall ? detall(punt) : detallPerDefecte(punt, dues, format));
  const posicio = (id) => (id === null ? -1 : punts.findIndex((punt, i) => clauDelPunt(punt, i) === id));
  const perDefecte = posicio(destacat) >= 0 ? posicio(destacat) : punts.length - 1;
  const triat = posicio(fixat) >= 0 ? posicio(fixat) : perDefecte;
  const mostrat = posicio(previ) >= 0 ? posicio(previ) : triat;

  const capcalera = (
    <>
      {titol ? <figcaption id={idTitol} className="sdp-quadre__titol">{titol}</figcaption> : null}
      {dues.length ? (
        <ul className="sdp-quadre__llegenda">
          {dues.map((serie, i) => (
            <li key={serie.clau}>
              <span
                className={i === 0 && davant ? 'sdp-quadre__mostra sdp-quadre__mostra--davant' : 'sdp-quadre__mostra sdp-quadre__mostra--darrere'}
                aria-hidden="true"
              />
              {serie.nom}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );

  /* Cap punt o tot a zero: no n'hi ha (`buit`). Punts sense cap valor
     numèric: la dada no ha arribat (`falta`). */
  if (!punts.length || rang <= 0) {
    return (
      <figure className="sdp-quadre__grafica" aria-labelledby={titol ? idTitol : undefined}>
        {capcalera}
        <p className="sdp-quadre__avis">{punts.length && !finits.length ? (falta ?? buit) : buit}</p>
      </figure>
    );
  }

  /* El dit (o el llapis) recorre la gràfica sencera: la columna és la de
     davall del dit, encara que la barra siga estreta. */
  const columnaSota = (event) => {
    const caixa = event.currentTarget.getBoundingClientRect();
    if (!(caixa.width > 0)) return -1;
    const fraccio = (event.clientX - caixa.left) / caixa.width;
    return Math.min(punts.length - 1, Math.max(0, Math.floor(fraccio * punts.length)));
  };
  const ambElDit = (event) => {
    if (event.pointerType === 'mouse') return;
    const i = columnaSota(event);
    if (i >= 0) setFixat(clauDelPunt(punts[i], i));
  };
  /* Mana l'última interacció: amb el ratolí quiet damunt d'una columna, les
     fletxes mouen el focus i el detall alhora (F8-CRIT-02). */
  const ambLesTecles = (event, i) => {
    const desti = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: punts.length - 1 }[event.key];
    if (desti === undefined) return;
    event.preventDefault();
    setPrevi(null);
    botons.current[Math.min(punts.length - 1, Math.max(0, desti))]?.focus();
  };
  const ambElFocus = (clau) => {
    setPrevi(null);
    setFixat(clau);
  };

  return (
    <figure className="sdp-quadre__grafica" aria-labelledby={titol ? idTitol : undefined}>
      {capcalera}
      <ol
        className={terra < 0 ? 'sdp-quadre__barres sdp-quadre__barres--negatius' : 'sdp-quadre__barres'}
        onPointerDown={ambElDit}
        onPointerMove={ambElDit}
        onPointerLeave={() => setPrevi(null)}
      >
        {punts.map((punt, i) => {
          const clau = clauDelPunt(punt, i);
          const columna = ['sdp-quadre__columna',
            clau === destacat ? 'sdp-quadre__columna--destacada' : '',
            i === mostrat ? 'sdp-quadre__columna--triada' : ''].filter(Boolean).join(' ');
          /* La de darrere primer: la de davant es pinta damunt. */
          const barres = [
            darrere ? barraDelQuadre({ valor: punt.valors?.[darrere.clau], sostre, terra, lloc: LLOC.darrere, classe: 'sdp-quadre__barra--darrere' }) : null,
            davant ? barraDelQuadre({ valor: punt.valors?.[davant.clau], sostre, terra, lloc: LLOC.davant, classe: 'sdp-quadre__barra--davant' }) : null
          ].filter(Boolean);
          const de = (regio) => barres.filter((barra) => barra.regio === regio).map((barra) => barra.rect);
          return (
            <li key={clau} className={columna}>
              <button
                type="button"
                ref={(node) => { botons.current[i] = node; }}
                className="sdp-quadre__boto"
                tabIndex={i === triat ? 0 : -1}
                aria-current={i === mostrat ? 'true' : undefined}
                aria-controls={idDetall}
                onClick={() => setFixat(clau)}
                onFocus={() => ambElFocus(clau)}
                onKeyDown={(event) => ambLesTecles(event, i)}
                onPointerEnter={(event) => { if (event.pointerType === 'mouse') setPrevi(clau); }}
              >
                <span className="sdp-nomes-lector">{textDe(punt)}</span>
                <span className="sdp-quadre__pista" aria-hidden="true">
                  {terra < 0 ? (
                    <svg className="sdp-quadre__eix" focusable="false">
                      <line className="sdp-quadre__zero" x1="0" x2="100%" y1={zero} y2={zero} />
                    </svg>
                  ) : null}
                  <svg className="sdp-quadre__dibuix" focusable="false">
                    {sostre > 0 ? <svg className="sdp-quadre__regio" width="100%" height={zero}>{de('dalt')}</svg> : null}
                    {terra < 0 ? (
                      <svg className="sdp-quadre__regio" y={zero} width="100%" height={percent(-terra / rang)}>{de('baix')}</svg>
                    ) : null}
                  </svg>
                </span>
                <span className="sdp-quadre__marca" aria-hidden="true">{punt.marca ?? punt.etiqueta}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <p id={idDetall} className="sdp-quadre__detall">{textDe(punts[mostrat])}</p>
    </figure>
  );
}

function RanquingDelQuadre({ titol, intro, files, buit, falta, nota, nivell }) {
  const idTitol = useId();
  const Titol = TITOLS[nivell] || 'h4';
  let cos;
  if (!Array.isArray(files)) cos = falta ? <p className="sdp-quadre__avis">{falta}</p> : null;
  else if (!files.length) cos = buit ? <p className="sdp-quadre__avis">{buit}</p> : null;
  else {
    cos = (
      <ol className="sdp-quadre__ranquing" aria-labelledby={titol ? idTitol : undefined}>
        {files.map((fila, i) => (
          <li key={fila.clau ?? i} className="sdp-quadre__fila">
            <span className="sdp-quadre__etiqueta">
              <span className="sdp-quadre__nom">{fila.nom}</span>
              {fila.codi ? <>{' '}<code className="sdp-quadre__codi">{fila.codi}</code></> : null}
            </span>
            <span className="sdp-quadre__compte">{fila.valor}</span>
            {/* Amplada exacta (F8-CRIT-05): 5 i 6 de 11 ja no fan la mateixa barra. */}
            {Number.isFinite(fila.proporcio) ? (
              <svg className="sdp-quadre__proporcio" aria-hidden="true" focusable="false">
                {fraccioQuadre(fila.proporcio, 1) > 0 ? (
                  <rect className="sdp-quadre__proporcio-barra" width={percent(fraccioQuadre(fila.proporcio, 1))} height="100%" ry="50%" />
                ) : null}
              </svg>
            ) : null}
          </li>
        ))}
      </ol>
    );
  }
  return (
    <div className="sdp-quadre__bloc">
      {titol ? <Titol id={idTitol} className="sdp-quadre__titol">{titol}</Titol> : null}
      {intro ? <p>{intro}</p> : null}
      {cos}
      {nota ? <div className="sdp-quadre__nota">{nota}</div> : null}
    </div>
  );
}

export function QuadreDeComandament({
  estat = null, periode = null, xifres = [], explicacio = null, grafica = null, ranquing = null,
  peu = null, nivell = 4, className
}) {
  return (
    <div className={['sdp-quadre', className].filter(Boolean).join(' ')}>
      {estat || periode ? (
        <div className="sdp-quadre__capcalera">
          {estat ? (
            <p className={estat.viu ? 'sdp-quadre__estat sdp-quadre__estat--viu' : 'sdp-quadre__estat'}>
              <span className="sdp-quadre__punt" aria-hidden="true" />
              <span>{estat.text}</span>
            </p>
          ) : null}
          {periode ? <p className="sdp-quadre__periode">{periode}</p> : null}
        </div>
      ) : null}
      {xifres.length ? (
        <dl className="sdp-quadre__xifres">
          {xifres.map(({ clau, nom, valor, lector }) => (
            <div key={clau ?? nom} className="sdp-quadre__xifra">
              <dt>{nom}</dt>
              <dd className="sdp-quadre__valor">
                {lector ? (
                  <>
                    <span aria-hidden="true">{valor}</span>
                    <span className="sdp-nomes-lector">{lector}</span>
                  </>
                ) : valor}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {explicacio ? <div className="sdp-quadre__explicacio">{explicacio}</div> : null}
      {grafica ? <GraficaDelQuadre {...grafica} /> : null}
      {ranquing ? <RanquingDelQuadre {...ranquing} nivell={nivell} /> : null}
      {peu ? <div className="sdp-quadre__peu">{peu}</div> : null}
    </div>
  );
}
