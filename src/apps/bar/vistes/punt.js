/**
 * El Bar · vistes/punt.js — on és la persona dins de l'app (Clàusula dels Slugs).
 *
 *   /app/bar/caixa              la comanda de barra més recent (o una de nova)
 *   /app/bar/caixa/<comanda>    una comanda oberta qualsevol, pel seu id
 *   /app/bar/taules/<taula>     la comanda de la taula (o una de nova)
 * i, darrere, /cobrar, /dividir o /colleccio (el panell en pantalla estreta).
 * El TPV (/app/bar/tpv i /app/bar/tpv/<comanda>, ordre del Mestre, 261006) fa
 * el mateix amb una altra BASE: puntDeRuta, usePunt i useFixaComanda la
 * reben com a paràmetre opcional, 'caixa' per defecte (la Caixa no canvia).
 * Una comanda nova es crea en tocar el primer producte, no en entrar: la
 * tria la repetix l'estat dins de l'operació (comandaObertaDe), perquè dos
 * tocs ràpids no en creen dues. Quan l'operació acaba, /caixa passa a
 * /caixa/<comanda> (useFixaComanda): un enllaç copiat obri la mateixa.
 *
 * També hi ha ací els passos del tancament i les seccions dels ajustos (van
 * al camí) i els ganxos de navegació de les vistes: així els fitxers .jsx
 * només exporten components.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from '../../../app/contexts/RouterContext';
import { esIdOpac, useApp } from '../../plataforma/index.js';
import { comandaObertaDe } from '../nucli/comanda.js';
import { useBar } from '../estat/ProveidorBar.jsx';

/** L'id d'una comanda: un id opac que comença per «c-» (nucli/ids.js). */
export const esIdComanda = (valor) => esIdOpac(valor) && valor.startsWith('c-');

/** La col·lecció activa de la caixa va al camí: /caixa/<comanda> (esquelet comú, rutaColleccio). */
export const RUTA_COMANDA = Object.freeze({ parametre: 'comanda', valida: esIdComanda });

/**
 * La tornada al TPV (?torna=tpv): «Cobra» del TPV la posa al cobrament de la
 * Caixa, el cobrament la conserva fins a la nota del client i, en tancar la
 * nota, es torna a /app/bar/tpv. També la conserven «Cobra» i «Dividix» de la
 * comanda del costat, i la divisió («Separa i cobra», les parts). Validador
 * estricte: només 'tpv'; qualsevol
 * altre valor es llig com si no hi fóra, i la Caixa fa el de sempre.
 */
export const esTornaTpv = (valor) => valor === 'tpv';

/**
 * L'últim tram d'un camí amb la tornada al TPV, si en ve: ambTornada('cobrar',
 * true) → 'cobrar?torna=tpv' (rutaDeApp només ajunta trams, com la nota del
 * client de Cobrament.jsx). Sense tornada, el tram tal qual: la Caixa no canvia.
 */
export const ambTornada = (tram, tornaTpv) => (tornaTpv ? `${tram}?torna=tpv` : tram);

/** Els passos del tancament (/tancament/<pas>). */
export const PASSOS = Object.freeze([
  { id: 'arqueig', nom: 'Arqueig' },
  { id: 'resum', nom: 'Resum' },
  { id: 'traspas', nom: 'Traspàs' },
  { id: 'confirmar', nom: 'Confirmar' }
]);
export const esPas = (valor) => PASSOS.some((p) => p.id === valor);

/** Les seccions dels ajustos (/ajustos/<seccio>). */
export const SECCIONS_AJUSTOS = Object.freeze([
  { id: 'dispositiu', nom: 'Dispositiu', text: 'Dades, còpia i interruptors' },
  { id: 'caixa', nom: 'Caixa', text: 'Nom i IVA per defecte' },
  { id: 'sala', nom: 'Sala', text: 'Zones i taules' },
  { id: 'carta', nom: 'Carta', text: 'Llavor i importació' }
]);
export const esSeccioAjustos = (valor) => SECCIONS_AJUSTOS.some((s) => s.id === valor);

/**
 * { comanda, origen, trams, perduda, taula? }: la comanda de la ruta (null si
 * encara no n'hi ha), l'origen per a crear-la, els trams de la ruta base i si
 * el paràmetre no troba res (una comanda ja tancada o una taula inexistent).
 * `base`: el primer tram de la barra i d'una comanda ('caixa' o 'tpv').
 */
export function puntDeRuta(params, { comandes = [], sala = null, base = 'caixa' } = {}) {
  if (params?.comanda) {
    const comanda = comandes.find((c) => c.id === params.comanda) || null;
    return { comanda, origen: comanda?.origen || null, trams: [base, params.comanda], perduda: !comanda };
  }
  if (params?.taula) {
    const taula = sala?.taules?.find((t) => t.id === params.taula) || null;
    const origen = { tipus: 'taula', taulaId: params.taula };
    return { comanda: comandaObertaDe(comandes, origen), origen, trams: ['taules', params.taula], perduda: !taula, taula };
  }
  const origen = { tipus: 'barra' };
  return { comanda: comandaObertaDe(comandes, origen), origen, trams: [base], perduda: false };
}

/** El punt de venda de la ruta amb les dades de l'estat (`base`: 'caixa' per defecte, o 'tpv'). */
export function usePunt(params, base = 'caixa') {
  const { comandes, sala } = useBar();
  return puntDeRuta(params, { comandes, sala, base });
}

/** Navegar dins de l'app: ves('caixa', id) fa push a /app/bar/caixa/<id>. */
export function useVes() {
  const navigate = useNavigate();
  const { ruta } = useApp();
  return { ruta, ves: (...trams) => navigate(ruta(...trams)) };
}

/**
 * Un gest que no es repetix mentre l'anterior treballa (BAR-R5): dos tocs
 * seguits a «El datàfon ha cobrat» o a una part anoten UN sol pagament.
 * [ocupat, executa(fn)]: mentre fn no acaba, executa no fa res i torna null;
 * `ocupat` permet desactivar el botó. La guarda és una ref: no depén de
 * quan es pinta.
 */
export function useUnaVegada() {
  const enCurs = useRef(false);
  const [ocupat, setOcupat] = useState(false);
  const executa = useCallback((fn) => {
    if (enCurs.current) return Promise.resolve(null);
    enCurs.current = true;
    setOcupat(true);
    return (async () => fn())().finally(() => {
      enCurs.current = false;
      setOcupat(false);
    });
  }, []);
  return [ocupat, executa];
}

/**
 * La comanda de la barra al camí (BAR-R7, Clàusula dels Slugs): a /caixa
 * sense comanda, el primer producte en crea una (o va a la més recent) i la
 * URL passa a /caixa/<id> amb replace, conservant la consulta (categoria,
 * vista). Només si la persona encara és a /caixa quan l'operació acaba.
 * Torna fixa(comanda) per a cridar-lo amb el resultat d'accions.afegeix.
 * `base`: 'caixa' per defecte; el TPV hi passa 'tpv' (/tpv → /tpv/<id>).
 */
export function useFixaComanda(base = 'caixa') {
  const navigate = useNavigate();
  const { ruta } = useApp();
  const ubicacio = useLocation();
  const ara = useRef(ubicacio);
  useEffect(() => {
    ara.current = ubicacio;
  });
  return useCallback((comanda) => {
    const { pathname, search } = ara.current;
    if (!comanda?.id || pathname !== ruta(base)) return;
    navigate(`${ruta(base, comanda.id)}${search ? `?${search}` : ''}`, { replace: true });
  }, [navigate, ruta, base]);
}
