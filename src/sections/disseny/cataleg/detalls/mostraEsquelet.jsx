/**
 * mostraEsquelet.jsx — l'arnés dels dos espècimens de l'esquelet comú (el
 * vestit de bar i el vestit de compra). No és cap espècimen (allLoaders.test
 * només carrega Especimen*.jsx): munta LES MATEIXES columnes de
 * src/apps/comu/esquelet amb les dades de cada app.
 *
 * Dins del catàleg no es pot muntar una segona AppGridShell (el catàleg ja
 * n'és una i les regles de la graella s'encadenarien): el context de la
 * graella es dona a mà, com fa EspecimenXat, i la URL viu en un router de
 * memòria, perquè la consulta de l'espècimen no xafe la del catàleg
 * (?categoria= també és seua). «Tauleta» posa les columnes de costat; «Mòbil»
 * en pinta una, la que diu el camí, com fa ClosaAplicacio.
 *
 *   <MostraEsquelet rutaInicial="/app/bar/caixa">   el router de la mostra
 *     <TpvDeMostra />                               llig la URL (useColleccioActiva)
 *   </MostraEsquelet>                               i pinta <MarcEsquelet … />
 */
import { useMemo, useState } from 'react';
import { MemoryRouter, useLocation } from '../../../../app/contexts/RouterContext.jsx';
import { AppGridContext } from '../../../../components/layout/AppGridShell.jsx';
import { PillToggle } from '../../../../components/PedraSeca/index.js';
import { ColumnaCataleg, ColumnaColleccio, ColumnaColleccions, useVistesEsquelet } from '../../../../apps/comu/esquelet/index.js';

const MIDES = [
  { valor: 'ample', text: 'Tauleta i escriptori' },
  { valor: 'estret', text: 'Mòbil' }
];
const sensePanell = () => {};

/** Les columnes de l'esquelet amb les dades de l'app. Dins de MostraEsquelet. */
export function MarcEsquelet({ etiqueta, primer, tram, cataleg, colleccio, colleccions }) {
  const [mida, setMida] = useState('ample');
  const { pathname, search } = useLocation();
  const vistes = useVistesEsquelet({ primer, tram });
  const graella = useMemo(() => ({ mida, panellObert: null, setPanellObert: sensePanell, tancaPanells: sensePanell }), [mida]);
  const columnaCataleg = <ColumnaCataleg {...cataleg} primer={primer} tram={tram} />;
  const columnaColleccio = <ColumnaColleccio {...colleccio} primer={primer} tram={tram} />;
  return (
    <>
      <PillToggle etiqueta={`${etiqueta}: mida de la pantalla`} valor={mida} onCanvi={setMida} opcions={MIDES} />
      <p>URL de la mostra: <code>{`${pathname}${search ? `?${search}` : ''}`}</code></p>
      <AppGridContext.Provider value={graella}>
        {mida === 'ample' ? (
          <div className="sdp-especimen__papers" role="group" aria-label={`${etiqueta}: tauleta i escriptori`}>
            {colleccions ? <div className="sdp-especimen__mostra"><ColumnaColleccions {...colleccions} /></div> : null}
            <div className="sdp-especimen__mostra">{columnaColleccio}</div>
            <div className="sdp-especimen__mostra">{columnaCataleg}</div>
          </div>
        ) : (
          <div className="sdp-especimen__mostra sdp-especimen__mostra--estreta" role="group" aria-label={`${etiqueta}: mòbil`}>
            {vistes.veient === 'cataleg' ? columnaCataleg : columnaColleccio}
          </div>
        )}
      </AppGridContext.Provider>
    </>
  );
}

/** `rutaInicial`: on comença la mostra (p. ex. /app/bar/caixa). */
export function MostraEsquelet({ rutaInicial, children }) {
  return <MemoryRouter rutaInicial={rutaInicial}>{children}</MemoryRouter>;
}
