/**
 * La Nevera de Casa · l'avís de l'estat del disc, amb paraules (Alerta de
 * Pedra Seca). Va al peu de les columnes de col·lecció (la llista, «Cal
 * comprar», «Articles propis») i a «Dades i còpia».
 *   error de lectura  el disc no ha tornat les dades: res no s'ha esborrat,
 *                     no es pot canviar res i «Torna-ho a provar» el rellig
 *   error de desat    l'últim canvi no ha arribat al disc
 *   lectora           una altra pestanya escriu: ací només es mira
 *   no persistent     el navegador no deixa guardar: les dades duren la sessió
 * Amb `sempre`, si tot va bé diu on viuen les dades.
 */
import { RotateCcw } from 'lucide-react';
import { Alerta, Boto } from '../../../components/PedraSeca/index.js';
import { textosVistaNevera } from '../i18nNevera.js';
import { useVistaNevera } from './context.js';

export function AvisNevera({ sempre = false }) {
  const { error, errorEn, llegit, mode, persistent, accions, idioma = 'ca' } = useVistaNevera();
  const tx = textosVistaNevera(idioma);
  if (error && errorEn === 'lectura') {
    const quiet = llegit ? '' : tx.quietLectura;
    return (
      <Alerta to="error" titol={tx.noShaPogutLlegirTitol}
        accions={<Boto icona={RotateCcw} onClick={accions.rellegix}>{tx.tornaHoAProvar}</Boto>}>
        {`${tx.errorsLectura[error] || tx.errorLecturaDefecte}${quiet}`}
      </Alerta>
    );
  }
  if (error) {
    return (
      <Alerta to="error" titol={tx.noShaPogutDesarTitol}>
        {tx.errorsDesat[error] || tx.errorDesatDefecte}
      </Alerta>
    );
  }
  if (mode === 'lectora') {
    return (
      <Alerta to="avis" titol={tx.nomesLecturaTitol}>
        {tx.nomesLecturaText}
      </Alerta>
    );
  }
  if (!persistent) {
    return (
      <Alerta to="avis" titol={tx.noEsGuardaTitol}>
        {tx.noEsGuardaText}
      </Alerta>
    );
  }
  if (!sempre) return null;
  return (
    <Alerta to="info" titol={tx.nomesDispositiuTitol} viva={false}>
      {tx.nomesDispositiuText}
    </Alerta>
  );
}
