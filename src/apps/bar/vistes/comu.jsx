/**
 * El Bar · vistes/comu.jsx — el marc de les columnes que no són de catàleg ni
 * de col·lecció (cobrar, el torn, els ajustos): la MarcColumna de Pedra Seca
 * amb la capçalera canònica. Cap classe pròpia: la geometria és de les peces.
 *
 * També els avisos comuns: el de la sessió (AvisSessio, per què el Bar ven o
 * no ven ara), el de l'última operació (AvisOperacio) i el de la base
 * (AvisBase), i Preparat, que dona l'avís de la sessió a la columna de cada
 * vista (AvisDeLaColumna).
 */
import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react';
import { ArrowLeft, LockKeyhole } from 'lucide-react';
import { useNavigate } from '../../../app/contexts/RouterContext';
import AppGridColumn from '../../../components/layout/AppGridColumn.jsx';
import { Alerta, Boto, Carregant, EstatBuit, MarcColumna, Pila } from '../../../components/PedraSeca/index.js';
import { useClosaAplicacio } from '../../plataforma/index.js';
import { useBar } from '../estat/ProveidorBar.jsx';
import { avisDeSessio } from '../estat/textos.js';
import { useVes } from './punt.js';

/* L'avís de la sessió que Preparat dona a la columna de la vista:
   { avis, dins, reclama }. Intern: no s'exporta; el porta AvisDeLaColumna. */
const AvisDelPreparat = createContext(null);

/**
 * L'avís de la sessió DINS de la columna de la vista, davall de la seua
 * capçalera, que queda alineada amb les de les columnes del costat. En
 * muntar-se el reclama a Preparat, que deixa de pintar-lo damunt, i el pinta
 * ell. Va sempre a la mateixa ranura, la prop `avis` de MarcColumna (el
 * primer fill del cos, amb el marge de l'Alerta i res més), i per això
 * l'espai davall de l'avís és el mateix en totes les columnes del Bar:
 *   · una Columna (la de baix) el passa ella mateixa, per defecte;
 *   · una columna de l'esquelet comú el rep a la seua prop `avis`
 *     (correcció F3, 261006):
 *       <ColumnaCataleg … avis={<AvisDeLaColumna />} />
 * Fora d'un Preparat, o mentre no l'ha reclamat, no pinta res: el DOM de
 * sempre. Si cap columna de la vista no el reclama, Preparat el continua
 * pintant damunt (l'avís no es perd mai); cap vista del Bar no en depén ja.
 */
export function AvisDeLaColumna() {
  const avisDeLaVista = useContext(AvisDelPreparat);
  const reclama = avisDeLaVista?.reclama;
  /* Abans de pintar: l'avís no surt dues vegades ni es veu canviar de lloc. */
  useLayoutEffect(() => (reclama ? reclama() : undefined), [reclama]);
  return avisDeLaVista?.dins ? avisDeLaVista.avis : null;
}

/**
 * Una columna de l'app: capçalera, eines fixes opcionals i un cos que fa
 * scroll. `torna`: { etiqueta, trams } posa un botó d'arrere a la capçalera.
 * `avis`: l'avís del principi del cos, a la ranura de MarcColumna, fora de la
 * Pila (com les columnes de l'esquelet: el mateix espai davall). Per defecte,
 * el de la sessió que dona el Preparat (AvisDeLaColumna); una columna que no
 * és dins de cap Preparat hi passa <AvisSessio />. Sense avís, el DOM de sempre.
 */
export function Columna({ titol, torna = null, eines = null, peu = null, avis = <AvisDeLaColumna />, children }) {
  const { ves } = useVes();
  const startActions = torna ? [{ id: 'torna', icona: ArrowLeft, etiqueta: torna.etiqueta, onAcciona: () => ves(...torna.trams) }] : [];
  return (
    <MarcColumna capcalera={<AppGridColumn titol={titol} startActions={startActions} />} eines={eines} peu={peu} avis={avis} etiqueta={titol}>
      <Pila gap={4}>{children}</Pila>
    </MarcColumna>
  );
}

/**
 * L'avís de la sessió (ordre del Mestre, 261006): el text ix del motiu del
 * permís de l'estat (estat/textos.js, avisDeSessio). Sense sessió en mode
 * remot porta el botó «Entra» a la ruta d'entrada del pont. Res amb sessió
 * en línia: la pantalla no canvia (Llei del Píxel).
 */
export function AvisSessio() {
  const { permis } = useBar();
  const navigate = useNavigate();
  const avis = avisDeSessio(permis);
  if (!avis) return null;
  const entra = avis.entra ? <Boto varietat="primari" onClick={() => navigate(permis.rutaEntrada)}>Entra</Boto> : null;
  return <Alerta to={avis.to} accions={entra}>{avis.text}</Alerta>;
}

/**
 * En una columna lateral (la llista del mig o l'esquerra), l'avís de la sessió
 * només en pantalla estreta, on és l'única columna que es veu: en ample i en
 * tauleta, la columna del detall del costat ja el pinta (amb Preparat, o amb
 * <AvisSessio /> a la Columna de «Tria…»), i la pantalla el diu una sola
 * vegada. Una llista fora de cap Preparat (els apartats dels ajustos) el
 * passa a la seua prop `avis`.
 */
export function AvisSessioEnEstret() {
  const { mida } = useClosaAplicacio();
  return mida === 'estret' ? <AvisSessio /> : null;
}

/** L'avís de l'última operació que no s'ha fet (estat/textos.js), si n'hi ha. */
export function AvisOperacio() {
  const { avis, accions } = useBar();
  if (!avis) return null;
  return <Alerta to="error" onTanca={accions.oblidaAvis}>{avis}</Alerta>;
}

/**
 * L'estat de la base: només lectura, sense persistència o error de càrrega.
 * Sense xarxa ho diu l'avís de la sessió (AvisSessio): un sol avís.
 */
export function AvisBase() {
  const { mode, persistent, errorCarrega } = useBar();
  if (errorCarrega) return <Alerta to="error">{errorCarrega}</Alerta>;
  return (
    <>
      {mode === 'lectora' ? (
        <Alerta to="avis" titol="Només lectura">Una altra pestanya està fent de caixa: esta només pot mirar.</Alerta>
      ) : null}
      {persistent === false ? (
        <Alerta to="avis" titol="Les dades no es guarden">Este navegador no deixa guardar res: el que faces durarà fins que tanques la pestanya.</Alerta>
      ) : null}
    </>
  );
}

/**
 * Mentre es carrega, o sense torn obert: la columna ho diu i porta on cal.
 * Preparada, dona l'avís de la sessió (AvisSessio) a la columna de la vista,
 * que el pinta dins del marc, davall de la capçalera (AvisDeLaColumna: una
 * Columna sola; una columna de l'esquelet comú, per la prop `avis`). Si cap
 * columna no el reclama, el pinta damunt. `avis` diu quines columnes el porten:
 *   'damunt'  (per defecte) la columna del detall, la que es veu primer;
 *   'estret'  una columna lateral (la llista del mig o l'esquerra): només en
 *             pantalla estreta, on és l'única que es veu;
 *   'propi'   la vista el pinta ella mateixa (el TPV, a la seua franja).
 * Sense permís d'escriptura, «Obri el torn» queda desactivat: l'avís diu per què.
 */
export function Preparat({ titol, ambTorn = true, avis = 'damunt', children }) {
  const bar = useBar();
  const { ves } = useVes();
  /* Quantes columnes de la vista han reclamat l'avís (AvisDeLaColumna): una, o cap si la vista no el passa. */
  const [columnes, setColumnes] = useState(0);
  const reclama = useCallback(() => {
    setColumnes((n) => n + 1);
    return () => setColumnes((n) => n - 1);
  }, []);
  const deLaColumna = useMemo(() => ({
    avis: avis === 'estret' ? <AvisSessioEnEstret /> : <AvisSessio />,
    dins: columnes > 0,
    reclama
  }), [avis, columnes, reclama]);
  if (!bar.carregat) {
    return <Columna titol={titol}>{bar.errorCarrega ? <AvisBase /> : <Carregant etiqueta="Carregant el bar…" />}</Columna>;
  }
  if (ambTorn && !bar.tornActual) {
    return (
      <Columna titol={titol} avis={deLaColumna.avis}>
        <EstatBuit icona={LockKeyhole} titol="El torn està tancat"
          accio={<Boto varietat="primari" disabled={!bar.permis.potEscriure} onClick={() => ves('torn')}>Obri el torn</Boto>}>
          Per a vendre cal obrir el torn: qui atén i el fons de caixa.
        </EstatBuit>
      </Columna>
    );
  }
  if (avis === 'propi') return children;
  return (
    <AvisDelPreparat.Provider value={deLaColumna}>
      {deLaColumna.dins ? null : deLaColumna.avis}
      {children}
    </AvisDelPreparat.Provider>
  );
}

/** Un paràmetre que no troba res: «No trobat», mai una pantalla buida. */
export function NoTrobat({ titol = 'No trobat', text, torna }) {
  const { ves } = useVes();
  return (
    <Columna titol={titol}>
      <EstatBuit titol={titol} accio={torna ? <Boto onClick={() => ves(...torna.trams)}>{torna.etiqueta}</Boto> : null}>{text}</EstatBuit>
    </Columna>
  );
}
