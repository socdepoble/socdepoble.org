import { useMemo, useState } from 'react';
import { Camp, CampText, Insignia, Taula } from '../../../components/PedraSeca';
import { GraellaXifres } from '../XifresMas.jsx';
import { xifresDeVista } from '../xifresMas.js';
import { etiquetaNode, filesEntradesEixides } from './grafMapa.js';

/* Entrades i eixides (la pestanya «Entradas y salidas» d'Emowe): per a cada
   skill i cada ruta, què llig, què escriu, qui la crida i a qui crida.
   Ordre del Mestre, 261004 (xat: cap xifra solta) · Les dues xifres són les
   targetes del Mas (skills del cens i skills opaques), amb boina i pàgina
   pròpia: compten tot el Mapa, no la cerca, perquè una pàgina pròpia no pot
   dependre d'un filtre que no viatja amb l'adreça. La taula sí que filtra.
   Derogat per l'ordre del Mestre del 261004 (xat: cap xifra solta): les
   xifres «Skills mostrades» i «Caixes opaques» com a targetes del Panell de
   Control, que comptaven només el que casava amb la cerca. */

const TO_CONFIANCA = Object.freeze({ declarat: 'info', derivat: 'neutre', inferit: 'avis' });

function Llista({ arestes, cap }) {
  if (!arestes.length) return '—';
  return arestes.map((a) => (
    <Insignia key={`${a[cap]}|${a.tipus}|${a.confianca}`} to={TO_CONFIANCA[a.confianca]}>
      {etiquetaNode({ id: a[cap] })} · {a.confianca}
    </Insignia>
  ));
}

export function EntradesEixides({ mapa }) {
  const [cerca, setCerca] = useState('');
  const files = useMemo(() => filesEntradesEixides(mapa, cerca), [mapa, cerca]);
  const xifres = useMemo(() => xifresDeVista('entrades', mapa), [mapa]);

  return (
    <>
      <p>
        Per a cada skill i cada ruta documental: a l'esquerra <strong>què llig</strong>, al
        centre qui és, a la dreta <strong>què produïx i on ho deixa</strong>. Cada dada diu
        quant fiar-se'n: <em>declarat</em> (escrit en un camp estructurat), <em>derivat</em> (tret
        per un analitzador) o <em>inferit</em> (tret de la prosa). Una skill amb tot buit és una
        <strong> caixa opaca</strong>: ningú, ni el seu agent, sap què entra ni què ix, i per això
        no es pot encadenar amb una altra. El remei és el camp <code>contracte</code> del
        frontmatter (llig, escriu, crida), que proposa <code>04_contracte_de_dades.md</code>.
      </p>
      <GraellaXifres xifres={xifres} generat={mapa.generat} />
      <Camp etiqueta="Filtra per skill, ruta, fitxer o carpeta">
        <CampText tipus="search" value={cerca} onChange={(e) => setCerca(e.target.value)} />
      </Camp>
      <Taula titol="Entrades i eixides" densa>
        <thead>
          <tr>
            <th scope="col">Què llig</th><th scope="col">Peça</th><th scope="col">Què escriu</th>
            <th scope="col">Qui la crida</th><th scope="col">A qui crida</th>
          </tr>
        </thead>
        <tbody>
          {files.length ? files.map((f) => (
            <tr key={f.node.id}>
              <td><Llista arestes={f.llig} cap="a" /></td>
              <th scope="row">
                {etiquetaNode(f.node)} <Insignia to="neutre">{f.node.tipus}</Insignia>
                {f.opaca && <> <Insignia to="avis">caixa opaca</Insignia></>}
              </th>
              <td><Llista arestes={f.escriu} cap="a" /></td>
              <td><Llista arestes={f.elCriden} cap="de" /></td>
              <td><Llista arestes={f.crida} cap="a" /></td>
            </tr>
          )) : <tr><td colSpan={5}>Res no casa amb la cerca.</td></tr>}
        </tbody>
      </Taula>
    </>
  );
}
