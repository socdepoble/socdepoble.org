/**
 * Esquelet comú de catàleg i col·lecció · la PANTALLA sencera.
 *
 * Ordre del Mestre (261002, sinergies T4/T8): «La Parròquia» (el TPV del bar)
 * i «La Nevera de Casa» (La Compra) són dues intel·ligències de dades sobre
 * un sol esquelet visual. Esta pantalla munta ClosaAplicacio (l'única porta a
 * AppGridShell des d'una app) amb les rutes de rutesCatalegColleccio:
 *   · esquerra  les col·leccions (tiquets oberts, llistes), si n'hi ha
 *   · mig       la col·lecció en curs (ColumnaColleccio)
 *   · detall    el catàleg (ColumnaCataleg), el més ample
 * Tauleta i escriptori: catàleg i col·lecció de costat. Mòbil: una sola
 * columna (la que diu `primer`) i la BarraResum porta a l'altra.
 *
 *   const RUTA_TIQUET = { parametre: 'tiquet' };
 *   const tiquet = useColleccioActiva({ entrada: 'caixa', rutaColleccio: RUTA_TIQUET }) || 'barra';
 *   <EsqueletCatalegColleccio entrada="caixa" primer="cataleg" rutaColleccio={RUTA_TIQUET}
 *     cataleg={{ titol, categories, articles, onTria, detall, resum, afegit }}
 *     colleccio={{ titol, linies, resum, onResta, onSuma, onEdita, onLleva }}
 *     colleccions={{ titol, colleccions, onCrea }} />
 *
 * Amb `rutaColleccio`, la col·lecció activa viu al camí (/caixa/<tiquet>):
 * la columna de l'esquerra la marca (aria-current) i cada targeta és un
 * enllaç de l'app (<entrada>/<id>), llevat que l'app hi passe hrefDe o onTria.
 * L'app llig la mateixa activa amb useColleccioActiva i passa les dades
 * d'eixa col·lecció. Sense rutaColleccio, `colleccions.actiu` i `hrefDe` són
 * de l'app.
 *
 * Les dades arriben per props i els gestos tornen a l'app. Una app amb més
 * pantalles fa la seua taula amb rutesCatalegColleccio i les mateixes columnes.
 */
import { createContext, useContext, useMemo } from 'react';
import { ClosaAplicacio, useApp } from '../../plataforma/index.js';
import { ColumnaCataleg } from './ColumnaCataleg.jsx';
import { ColumnaColleccio } from './ColumnaColleccio.jsx';
import { ColumnaColleccions } from './ColumnaColleccions.jsx';
import { rutesCatalegColleccio } from './rutesCatalegColleccio.js';

const ContextEsquelet = createContext(null);

/* Les columnes de la taula són constants del mòdul: canviar de ruta no les
   desmunta. Les dades els arriben pel context de la pantalla. */
function CatalegDeLaPantalla() {
  const { cataleg, primer, tram } = useContext(ContextEsquelet);
  return <ColumnaCataleg {...cataleg} primer={primer} tram={tram} />;
}

function ColleccioDeLaPantalla() {
  const { colleccio, primer, tram } = useContext(ContextEsquelet);
  return <ColumnaColleccio {...colleccio} primer={primer} tram={tram} />;
}

/* Els trams de l'entrada amb els seus paràmetres ja validats ('caixa/:taula' → ['caixa', 't1']). */
const tramsDe = (entrada, params) => entrada.split('/').map((tram) => (tram.startsWith(':') ? params?.[tram.slice(1)] ?? tram : tram));

function ColleccionsDeLaPantalla({ params }) {
  const { colleccions, entrada, rutaColleccio } = useContext(ContextEsquelet);
  const { ruta } = useApp();
  const nom = rutaColleccio?.parametre;
  if (typeof nom !== 'string') return <ColumnaColleccions {...colleccions} />;
  /* La URL mana: la col·lecció del camí és l'activa; sense, la que diga l'app. */
  const actiu = params?.[nom] || colleccions.actiu || null;
  const propi = typeof colleccions.hrefDe === 'function' || typeof colleccions.onTria === 'function';
  const hrefDe = propi ? colleccions.hrefDe : (colleccio) => ruta(...tramsDe(entrada, params), colleccio.id);
  return <ColumnaColleccions {...colleccions} actiu={actiu} hrefDe={hrefDe} />;
}

export function EsqueletCatalegColleccio({
  entrada, params, primer, tram, rutaColleccio = null, cataleg = {}, colleccio = {}, colleccions = null
}) {
  const ambColleccions = Boolean(colleccions);
  const rutes = useMemo(() => rutesCatalegColleccio({
    path: entrada,
    params,
    primer,
    tram,
    rutaColleccio,
    Cataleg: CatalegDeLaPantalla,
    Colleccio: ColleccioDeLaPantalla,
    Esquerra: ambColleccions ? ColleccionsDeLaPantalla : undefined
  }), [entrada, params, primer, tram, rutaColleccio, ambColleccions]);
  const valor = useMemo(() => ({ cataleg, colleccio, colleccions, entrada, rutaColleccio, primer, tram }),
    [cataleg, colleccio, colleccions, entrada, rutaColleccio, primer, tram]);
  return (
    <ContextEsquelet.Provider value={valor}>
      <ClosaAplicacio rutes={rutes} titols={{ esquerra: colleccions?.titol, mig: colleccio.titol }} />
    </ContextEsquelet.Provider>
  );
}
