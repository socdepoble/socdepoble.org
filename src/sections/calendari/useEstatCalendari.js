/**
 * useEstatCalendari.js — l'estat de les vistes noves de /calendari, a la URL.
 *
 * T10 (ordre del Mestre, 261001) · Llig ?vista=, ?setmana=, ?date=, ?mes= i
 * ?any= (estatCalendari.js · estatDeLaUrl) i escriu cada canvi a la URL amb
 * replace: moure's pel calendari no omple l'historial, com les fletxes del
 * calendari d'ara. Cap useState: la URL és l'única font de veritat.
 *
 * useEstatCalendari({ obertura, avui }) → { estat, navega, canviaVista, triaDia, obriDia }
 *   obertura · el mes d'obertura (mesDObertura); avui · el Date del dia de hui
 *   (estable durant el dia: qui el passa el memoritza).
 *   obriDia · (clau) => void: la vista Setmana d'eixe dia, amb el dia triat
 *   (els dies de la vista Any).
 */
import { useCallback, useMemo } from 'react';
import { useSearchParams } from '../../app/contexts/RouterContext';
import {
  canviaVista as canviaVistaDe, estatDeLaUrl, navega as navegaDes, obriDia as obriDiaDe, paramsDeLEstat,
  triaDia as triaDiaDe
} from './estatCalendari.js';

export function useEstatCalendari({ obertura = null, avui }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vista, setmana, date, mes, any] = ['vista', 'setmana', 'date', 'mes', 'any'].map((clau) => searchParams.get(clau));
  const estat = useMemo(
    () => estatDeLaUrl({ vista, setmana, date, mes, any }, { obertura, avui }),
    [vista, setmana, date, mes, any, obertura, avui]
  );
  // Un estat que no canvia (la vista que ja es veu, un dia que no existix) no escriu res.
  const escriu = useCallback((nou) => {
    if (nou !== estat) setSearchParams(paramsDeLEstat(nou), { replace: true });
  }, [estat, setSearchParams]);
  return {
    estat,
    navega: (direccio) => escriu(navegaDes(estat, direccio, avui)),
    canviaVista: (nova) => escriu(canviaVistaDe(estat, nova, avui)),
    triaDia: (clau) => escriu(triaDiaDe(estat, clau)),
    obriDia: (clau) => escriu(obriDiaDe(estat, clau))
  };
}
