/**
 * useAra.js — l'hora d'ara, renovada al canvi de cada minut.
 *
 * T10 (ordre del Mestre, 261001) · La línia d'«ara» de la vista Setmana
 * (VistaSetmana) baixa un minut cada minut. Un sol setTimeout alineat al canvi
 * de minut del rellotge (no un setInterval de 60 s, que es desfasaria), que es
 * torna a programar a cada tic i es neteja en desmuntar o en desactivar-se.
 *
 * useAra({ actiu = true }) → Date. Inactiu (la setmana que es veu no és la de
 * hui), cap temporitzador; en tornar a ser actiu, l'hora es renova de seguida.
 */
import { useEffect, useState } from 'react';

const MINUT_MS = 60000;

export function useAra({ actiu = true } = {}) {
  const [ara, setAra] = useState(() => new Date());
  useEffect(() => {
    if (!actiu) return undefined;
    let temporitzador;
    const programa = () => {
      const ms = Date.now();
      temporitzador = setTimeout(() => {
        setAra(new Date());
        programa();
      }, MINUT_MS - (ms % MINUT_MS));
    };
    setAra(new Date());
    programa();
    return () => clearTimeout(temporitzador);
  }, [actiu]);
  return ara;
}
