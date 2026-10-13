/**
 * useAra.js — l'hora d'ara, renovada al canvi de cada minut.
 *
 * T10 (ordre del Mestre, 261001) · La línia d'«ara» de la vista Setmana
 * (VistaSetmana) baixa un minut cada minut. Un sol setTimeout alineat al canvi
 * de minut del rellotge (no un setInterval de 60 s, que es desfasaria), que es
 * torna a programar a cada tic i es neteja en desmuntar o en desactivar-se.
 *
 * useAra({ actiu = true, rellotge }) → Date. Inactiu (la setmana que es veu no
 * és la de hui), cap temporitzador; en tornar a ser actiu, l'hora es renova de
 * seguida.
 *
 * Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B: «SEMPRE la data i
 * l'hora vives» a la barra taronja de la Gestoria) · El rellotge viu de les
 * barres (atoms/RellotgeViu.jsx) també en penja, i d'ací dues coses noves que
 * no canvien res a qui ja el cridava:
 *  · `rellotge` (opcional): una funció () => ms, el rellotge injectat (la
 *    Gestoria i les proves). Es llig per un ref i l'efecte només depén
 *    d'`actiu`: un rellotge escrit en línia, que canvia d'identitat a cada
 *    pintada, no torna a programar el temporitzador ni fa cap bucle. Si no
 *    torna un instant vàlid (un número finit), mana el del dispositiu.
 *  · Tornar a primer pla resincronitza (auditoria Codex 261013_1510, §2): el
 *    navegador alenteix els temporitzadors d'una pestanya amagada i el minut
 *    es quedava enrere fins al tic següent. En tornar a ser visible, l'hora es
 *    renova de seguida i el temporitzador es torna a alinear. Continua havent-hi
 *    un sol temporitzador.
 */
import { useEffect, useRef, useState } from 'react';

const MINUT_MS = 60000;

/* L'instant del rellotge injectat; sense, o si no és un número finit, el del dispositiu. */
function instantDe(rellotge) {
  if (typeof rellotge === 'function') {
    const ms = Number(rellotge());
    if (Number.isFinite(ms)) return ms;
  }
  return Date.now();
}

/* Els mil·lisegons que falten fins al canvi de minut (també abans de 1970). */
const finsAlMinut = (ms) => MINUT_MS - (((ms % MINUT_MS) + MINUT_MS) % MINUT_MS);

export function useAra({ actiu = true, rellotge } = {}) {
  const refRellotge = useRef(rellotge);
  refRellotge.current = rellotge;
  const [ara, setAra] = useState(() => new Date(instantDe(rellotge)));
  useEffect(() => {
    if (!actiu) return undefined;
    let temporitzador;
    const programa = () => {
      clearTimeout(temporitzador);
      temporitzador = setTimeout(() => {
        setAra(new Date(instantDe(refRellotge.current)));
        programa();
      }, finsAlMinut(instantDe(refRellotge.current)));
    };
    const renova = () => {
      setAra(new Date(instantDe(refRellotge.current)));
      programa();
    };
    const enTornarAPrimerPla = () => {
      if (document.visibilityState === 'visible') renova();
    };
    renova();
    document.addEventListener('visibilitychange', enTornarAPrimerPla);
    return () => {
      clearTimeout(temporitzador);
      document.removeEventListener('visibilitychange', enTornarAPrimerPla);
    };
  }, [actiu]);
  return ara;
}
