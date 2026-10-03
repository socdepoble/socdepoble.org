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
import { useVistaNevera } from './context.js';

const ERRORS_DESAT = Object.freeze({
  VERSIO_ANTIGA: 'Hi ha una versió nova de l’app en una altra pestanya. Recarrega la pàgina per a continuar.',
  NO_DISPONIBLE: 'La base local ha deixat de respondre. Recarrega la pàgina abans de continuar.',
  BLOQUEJAT: 'Una altra pestanya té oberta una versió anterior de l’app. Tanca-la per a continuar.',
  NOMES_LECTURA: 'Una altra pestanya està editant la nevera: ací només pots mirar.'
});

const ERRORS_LECTURA = Object.freeze({
  VERSIO_ANTIGA: 'Hi ha una versió nova de l’app en una altra pestanya. Recarrega la pàgina per a vore les teues llistes.',
  NO_DISPONIBLE: 'La base local no respon. Recarrega la pàgina per a vore les teues llistes.',
  BLOQUEJAT: 'Una altra pestanya té oberta una versió anterior de l’app. Tanca-la i torna-ho a provar.'
});

export function AvisNevera({ sempre = false }) {
  const { error, errorEn, llegit, mode, persistent, accions } = useVistaNevera();
  if (error && errorEn === 'lectura') {
    const quiet = llegit ? '' : ' Mentrestant no es pot canviar res, perquè no es perda res del que tens desat.';
    return (
      <Alerta to="error" titol="No s’ha pogut llegir"
        accions={<Boto icona={RotateCcw} onClick={accions.rellegix}>Torna-ho a provar</Boto>}>
        {`${ERRORS_LECTURA[error] || 'Les dades d’este dispositiu no s’han pogut llegir. No s’ha esborrat res: torna-ho a provar o recarrega la pàgina.'}${quiet}`}
      </Alerta>
    );
  }
  if (error) {
    return (
      <Alerta to="error" titol="No s’ha pogut desar">
        {ERRORS_DESAT[error] || 'L’últim canvi no ha arribat al disc. Torna-ho a provar o recarrega la pàgina.'}
      </Alerta>
    );
  }
  if (mode === 'lectora') {
    return (
      <Alerta to="avis" titol="Només lectura">
        La nevera està oberta en una altra pestanya. Ací només pots mirar; tanca l’altra per a fer canvis.
      </Alerta>
    );
  }
  if (!persistent) {
    return (
      <Alerta to="avis" titol="No es guarda">
        Este navegador no deixa guardar dades: el que fas es perdrà en tancar la pestanya. Descarrega’n una còpia des d’Ajustos.
      </Alerta>
    );
  }
  if (!sempre) return null;
  return (
    <Alerta to="info" titol="Només en este dispositiu" viva={false}>
      Les llistes viuen en este navegador i no ixen mai d’ací. Per a passar-les a un altre lloc, descarrega’n una còpia.
    </Alerta>
  );
}
