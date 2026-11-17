/**
 * useEstatCalendari.js — l'estat de les vistes de /calendari, a la URL.
 *
 * T10 (ordre del Mestre, 261001) · Llig ?vista=, ?setmana=, ?date=, ?mes= i
 * ?any= (estatCalendari.js · estatDeLaUrl) i escriu cada canvi a la URL amb
 * replace: moure's pel calendari no omple l'historial. Cap useState: la URL
 * és l'única font de veritat. P6 (261003) · Des d'ara és l'únic estat de la
 * pàgina: sense ?vista=, la vista Mes.
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
  const [vista, setmana, dateCanonic, dataAlias, mes, any] = [
    'vista', 'setmana', 'date', 'data', 'mes', 'any'
  ].map((clau) => searchParams.get(clau));
  const date = dateCanonic ?? dataAlias;
  const teAliasData = dataAlias !== null;
  const estat = useMemo(
    () => estatDeLaUrl({ vista, setmana, date, mes, any }, { obertura, avui }),
    [vista, setmana, date, mes, any, obertura, avui]
  );
  // Un estat que no canvia (la vista que ja es veu, un dia que no existix) no escriu res.
  // Si la URL d'entrada portava l'àlies `?data=`, la següent escriptura neteja `data` i consolida `?date=`.
  const escriu = useCallback((nou) => {
    if (nou !== estat) {
      const params = paramsDeLEstat(nou);
      setSearchParams(teAliasData ? { ...params, data: null } : params, { replace: true });
    }
  }, [estat, setSearchParams, teAliasData]);
  return {
    estat,
    navega: (direccio) => escriu(navegaDes(estat, direccio, avui)),
    canviaVista: (nova) => escriu(canviaVistaDe(estat, nova, avui)),
    triaDia: (clau) => escriu(triaDiaDe(estat, clau)),
    obriDia: (clau) => escriu(obriDiaDe(estat, clau))
  };
}
