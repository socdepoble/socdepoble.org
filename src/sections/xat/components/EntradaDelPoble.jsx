/**
 * EntradaDelPoble.jsx — torn 260930, T1: qui entra directament a /xat en un
 * amfitrió amb `poble` declarat veu primer el seu poble. No pinta res.
 *
 * Ordre del Mestre (14-10, pla 261014_0210, XAT-01 de l'auditoria
 * 261014_0148) · /xat ja no segresta cap al General de la comunitat. En
 * ample, obrir el fil muntava Conversa a la columna dreta i se n'enduia la
 * presentació (ColumnaDretaBuida) abans que la persona triara res: un grup
 * sense missatges no presenta cap comunitat. Ara la primera arribada obri la
 * FITXA de la comunitat del poble a la columna de llista (/xat?comunitat=<id>,
 * T67, la mateixa ruta que obri FilaComunitat) i la dreta conserva la
 * presentació fins que la persona tria un canal.
 *
 * Ací només es decidix SI s'entra i amb QUIN id. La ruta i el focus són de
 * XatSection (`onEntra`): construïx la URL amb la mateixa `consulta` que
 * obriComunitat i marca la fitxa com a prèvia perquè l'efecte de focus T67
 * no la prenga per una obertura de la persona. Si la ruta es fera ací, eixe
 * efecte movia el focus a la fletxa de la fitxa sense que ningú haguera fet
 * res, i dins de l'encastat el prenia al cercador de la pàgina amfitriona.
 *
 * Muntat dins de la closca (com PanellInicialMobil), fa UNA sola cosa i una
 * sola vegada per sessió (useXat().consumixEntrada, que viu al proveïdor i
 * sobreviu a les tornades a /xat; revisió adversarial 260930, P1: la guarda
 * penja de backend + persona, i ni la renovació del JWT ni el canvi d'actor
 * la tornen a obrir; en té la prova XatContext.ambit.test.jsx):
 *   · en la primera arribada a /xat (sense fil, sense consulta, amb el xat
 *     carregat i sessió), consumix l'entrada, faça o no faça res. Així la
 *     fletxa de la fitxa, que torna a /xat, no la reobri mai: només
 *     l'arribada ho fa;
 *   · si la closca és ampla i la comunitat del poble ja existix, demana la
 *     seua fitxa amb l'id del fil (`onEntra`, amb replace: l'enrere del
 *     navegador no passa per una /xat que la persona no ha vist). Mai un fil
 *     (/xat/<id>): la dreta queda sense conversa;
 *   · si la comunitat encara no existix, res, en cap mode de dades: crear-la
 *     només per arribar-hi era un efecte col·lateral (en seed/local, el
 *     ?sobre=poble:<id> d'abans). La fila del poble ja va al capdamunt de la
 *     llista (anteposaPoble) per a qui la vulga obrir; en remot, a més, la
 *     migració de xat de pàgina demana moderació (pla 2135, P2);
 *   · en estret i en mitjà no fa res: la llista primer, com ara;
 *   · sense `onEntra` tampoc: ni decidix ni consumix l'entrada.
 *
 * La mida de la closca arriba mesurada un commit després del muntatge
 * (AppGridShell naix «ample» i mesura en fase de layout): la decisió es pren
 * en diferit i llig la mida d'una ref, mai la del primer render.
 */
import { useEffect, useRef } from 'react';
import { useAppGrid } from '../../../components/layout/AppGridShell.jsx';
import { useXat } from '../XatContext';

export default function EntradaDelPoble({ poble, comunitat = null, aLaLlista = false, onEntra = null }) {
  const { mida } = useAppGrid();
  const { status, senseSessio, consumixEntrada } = useXat();
  const midaRef = useRef(mida);
  midaRef.current = mida;
  const comunitatRef = useRef(comunitat);
  comunitatRef.current = comunitat;
  const onEntraRef = useRef(onEntra);
  onEntraRef.current = onEntra;

  const llesta = Boolean(poble) && aLaLlista && status === 'ready' && !senseSessio
    && typeof consumixEntrada === 'function' && typeof onEntra === 'function';

  /* `poble` és estable (usePobleAmfitrio el memoritza); la mida, la
     comunitat i `onEntra` (una funció nova a cada render de XatSection) es
     lligen de refs en el moment de decidir. L'id va tal qual: codificar-lo
     és cosa de la ruta. */
  useEffect(() => {
    if (!llesta) return undefined;
    const temporitzador = setTimeout(() => {
      if (!consumixEntrada(`poble:${poble.id}`)) return;
      if (midaRef.current !== 'ample') return;
      const id = comunitatRef.current?.fil?.id;
      if (id != null && id !== '') onEntraRef.current(id);
    }, 0);
    return () => clearTimeout(temporitzador);
  }, [llesta, poble, consumixEntrada]);

  return null;
}
