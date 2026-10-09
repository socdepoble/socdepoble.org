/**
 * EntradaDelPoble.jsx — torn 260930, T1: qui entra directament a /xat en un
 * amfitrió amb `poble` declarat veu primer el grup del seu poble. No pinta res.
 *
 * Muntat dins de la closca (com PanellInicialMobil), fa UNA sola cosa i una
 * sola vegada per sessió (useXat().consumixEntrada, que viu al proveïdor i
 * sobreviu a les tornades a /xat; revisió adversarial 260930, P1: la guarda
 * penja de backend + persona, i ni la renovació del JWT ni el canvi d'actor
 * la tornen a obrir; en té la prova XatContext.ambit.test.jsx):
 *   · en la primera arribada a /xat (sense fil, sense consulta, amb el xat
 *     carregat i sessió), consumix l'entrada, faça o no faça res. Així tornar
 *     després a la llista no reobri mai el grup: només l'arribada ho fa;
 *   · si la closca és ampla, obri el General de la comunitat del poble si ja
 *     existix; en seed/local, si no existix, la crea pel camí de sempre
 *     (?sobre=poble:<id>, com el «Comentar» de la pàgina del poble);
 *   · en estret i en mitjà no fa res: la llista primer, com ara, amb la fila
 *     del poble al capdamunt (anteposaPoble);
 *   · en remot, si la comunitat no existix, no la crea: la migració de xat de
 *     pàgina demana moderació abans d'obrir-los a tot un poble (pla 2135, P2).
 *     La fila fixada del poble queda per a qui la vulga obrir.
 *
 * La mida de la closca arriba mesurada un commit després del muntatge
 * (AppGridShell naix «ample» i mesura en fase de layout): la decisió es pren
 * en diferit i llig la mida d'una ref, mai la del primer render.
 *
 * Onada 6 (integració Xat i Pobles) · `towns` (opcional, les fitxes de
 * useCoreContent que ja té XatSection): el grup que es crea es diu com la
 * gent del poble si l'amfitrió no n'ha declarat el nom (pobleAmfitrio.js,
 * nomDelPoble). Es llig d'una ref: que arriben les fitxes no torna a decidir.
 */
import { useEffect, useRef } from 'react';
import { useNavigate } from '../../../app/contexts/RouterContext';
import { useAppGrid } from '../../../components/layout/AppGridShell.jsx';
import { useXat } from '../XatContext';
import { generalDeComunitat, rutaSobreDelPoble } from '../pobleAmfitrio.js';

const enc = (valor) => encodeURIComponent(String(valor));

export default function EntradaDelPoble({ poble, comunitat = null, towns = null, aLaLlista = false }) {
  const { mida } = useAppGrid();
  const navigate = useNavigate();
  const { status, senseSessio, modeDades = 'remote', consumixEntrada } = useXat();
  const midaRef = useRef(mida);
  midaRef.current = mida;
  const comunitatRef = useRef(comunitat);
  comunitatRef.current = comunitat;
  const townsRef = useRef(towns);
  townsRef.current = towns;

  const llesta = Boolean(poble) && aLaLlista && status === 'ready' && !senseSessio && typeof consumixEntrada === 'function';

  /* `poble` és estable (usePobleAmfitrio el memoritza); la mida i la
     comunitat es lligen de refs en el moment de decidir. */
  useEffect(() => {
    if (!llesta) return undefined;
    const temporitzador = setTimeout(() => {
      if (!consumixEntrada(`poble:${poble.id}`)) return;
      if (midaRef.current !== 'ample') return;
      const general = generalDeComunitat(comunitatRef.current);
      if (general) navigate(`/xat/${enc(general.id)}`, { replace: true });
      else if (!comunitatRef.current && modeDades !== 'remote') navigate(rutaSobreDelPoble(poble, townsRef.current), { replace: true });
    }, 0);
    return () => clearTimeout(temporitzador);
  }, [llesta, poble, modeDades, consumixEntrada, navigate]);

  return null;
}
