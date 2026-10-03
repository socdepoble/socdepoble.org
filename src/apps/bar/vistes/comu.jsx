/**
 * El Bar · vistes/comu.jsx — el marc de les columnes que no són de catàleg ni
 * de col·lecció (cobrar, el torn, els ajustos): la MarcColumna de Pedra Seca
 * amb la capçalera canònica. Cap classe pròpia: la geometria és de les peces.
 */
import { ArrowLeft, LockKeyhole } from 'lucide-react';
import AppGridColumn from '../../../components/layout/AppGridColumn.jsx';
import { Alerta, Boto, Carregant, EstatBuit, MarcColumna, Pila } from '../../../components/PedraSeca/index.js';
import { useEnLinia } from '../../../components/universal/connexio/useEnLinia.js';
import { useBar } from '../estat/ProveidorBar.jsx';
import { useVes } from './punt.js';

/**
 * Una columna de l'app: capçalera, eines fixes opcionals i un cos que fa
 * scroll. `torna`: { etiqueta, trams } posa un botó d'arrere a la capçalera.
 */
export function Columna({ titol, torna = null, eines = null, peu = null, children }) {
  const { ves } = useVes();
  const startActions = torna ? [{ id: 'torna', icona: ArrowLeft, etiqueta: torna.etiqueta, onAcciona: () => ves(...torna.trams) }] : [];
  return (
    <MarcColumna capcalera={<AppGridColumn titol={titol} startActions={startActions} />} eines={eines} peu={peu} etiqueta={titol}>
      <Pila gap={4}>{children}</Pila>
    </MarcColumna>
  );
}

/** L'avís de l'última operació que no s'ha fet (estat/textos.js), si n'hi ha. */
export function AvisOperacio() {
  const { avis, accions } = useBar();
  if (!avis) return null;
  return <Alerta to="error" onTanca={accions.oblidaAvis}>{avis}</Alerta>;
}

/** L'estat de la base: només lectura, sense persistència, sense xarxa o error de càrrega. */
export function AvisBase() {
  const { mode, persistent, errorCarrega } = useBar();
  const enLinia = useEnLinia();
  if (errorCarrega) return <Alerta to="error">{errorCarrega}</Alerta>;
  return (
    <>
      {enLinia ? null : (
        <Alerta to="info" titol="Sense xarxa">El bar continua: les dades són en este dispositiu.</Alerta>
      )}
      {mode === 'lectora' ? (
        <Alerta to="avis" titol="Només lectura">Una altra pestanya està fent de caixa: esta només pot mirar.</Alerta>
      ) : null}
      {persistent === false ? (
        <Alerta to="avis" titol="Les dades no es guarden">Este navegador no deixa guardar res: el que faces durarà fins que tanques la pestanya.</Alerta>
      ) : null}
    </>
  );
}

/** Mentre es carrega, o sense torn obert: la columna ho diu i porta on cal. */
export function Preparat({ titol, ambTorn = true, children }) {
  const bar = useBar();
  const { ves } = useVes();
  if (!bar.carregat) {
    return <Columna titol={titol}>{bar.errorCarrega ? <AvisBase /> : <Carregant etiqueta="Carregant el bar…" />}</Columna>;
  }
  if (ambTorn && !bar.tornActual) {
    return (
      <Columna titol={titol}>
        <EstatBuit icona={LockKeyhole} titol="El torn està tancat"
          accio={<Boto varietat="primari" onClick={() => ves('torn')}>Obri el torn</Boto>}>
          Per a vendre cal obrir el torn: qui atén i el fons de caixa.
        </EstatBuit>
      </Columna>
    );
  }
  return children;
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
