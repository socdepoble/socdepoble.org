import { useMemo, useState } from 'react';
import { Camp, CampText, Insignia, PillToggle, Taula } from '../../../components/PedraSeca';
import { useSearchParams } from '../../../app/contexts/RouterContext';
import { GraellaXifres } from '../XifresMas.jsx';
import { xifresDeVista } from '../xifresMas.js';
import { AvisDeSkill } from './AvisosMapa.jsx';
import { esForaDeCens, esOrfena, resumInventari, semaforDe } from './inventariMapa.js';

/* Inventari de skills (03_inventari_skills.md): quines skills tenim de veres
   i en quin estat estan. És la pestanya «Skills» d'Emowe amb el semàfor
   adaptat: 3 avisos o més, roig; 1 o 2, ambre; cap, verd. El semàfor i els
   filtres viuen a inventariMapa.js, i la targeta del tauler compta amb ells:
   el que pinta «Cal reparar» és el mateix roig d'esta taula.
   Ordre del Mestre, 261004 (xat: cap xifra solta) · Les xifres de la pàgina
   (les de la vista «inventari», VISTES_XIFRES) són targetes senceres amb
   boina i pàgina pròpia (XifresMas.jsx).
   Derogat per l'ordre del Mestre del 261004 (xat: cap xifra solta): les
   xifres com a targetes compactes del Panell de Control (Xifra). */

const FILTRES = Object.freeze([
  { valor: 'totes', text: 'Totes', f: () => true },
  { valor: 'avisos', text: 'Amb avisos', f: (s) => s.avisos.length > 0 },
  { valor: 'orfes', text: 'Òrfenes', f: esOrfena },
  { valor: 'cens', text: 'Fora d’algun cens', f: esForaDeCens },
  { valor: 'nucli', text: 'Nucli', f: (s) => s.atributs.core === true }
]);
/* Ordre del Mestre, 261004 · El filtre viu a la URL (?filtre=avisos|orfes|
   cens|nucli), com el sentinella triat de PanellSentinelles: una xifra d'«El
   Mas en xifres» hi porta, i el que es comparteix és el que es veu. «Totes»
   no escriu res. Sense un router llegible (un amfitrió o una prova sense
   RouterProvider), el filtre és estat local, com abans. La forma
   `return useSearchParams()` és la que rules-of-hooks accepta dins d'un try. */
export const CLAU_FILTRE = 'filtre';
function useConsultaApp() {
  try {
    return useSearchParams();
  } catch {
    return null;
  }
}
const filtreValid = (valor) => (FILTRES.some((x) => x.valor === valor) ? valor : null);

function semafor(n) {
  const color = semaforDe(n);
  if (color === 'roig') return <Insignia to="error">roig · {n}</Insignia>;
  if (color === 'ambre') return <Insignia to="avis">ambre · {n}</Insignia>;
  return <Insignia to="exit">verd</Insignia>;
}
const siNo = (v) => (v === null || v === undefined ? '—' : v ? 'sí' : 'no');

export function InventariMapa({ mapa, locale }) {
  const consulta = useConsultaApp();
  const [filtreLocal, setFiltreLocal] = useState('totes');
  const filtre = consulta ? filtreValid(consulta[0]?.get?.(CLAU_FILTRE)) ?? 'totes' : filtreLocal;
  const setFiltre = (valor) => {
    if (!consulta) setFiltreLocal(valor);
    else consulta[1]({ [CLAU_FILTRE]: valor === 'totes' ? null : valor }, { replace: true });
  };
  const [cerca, setCerca] = useState('');
  const resum = useMemo(() => resumInventari(mapa), [mapa]);
  // Les targetes de la vista «inventari» (VISTES_XIFRES): també «skills amb avisos», que es tracta ací.
  const xifres = useMemo(() => xifresDeVista('inventari', mapa), [mapa]);
  const { skills } = resum;
  const f = FILTRES.find((x) => x.valor === filtre).f;
  const q = cerca.trim().toLowerCase();
  const files = skills.filter((s) => f(s) && (!q || s.nom.toLowerCase().includes(q)));
  const n = (x) => (Number.isInteger(x) ? x.toLocaleString(locale) : '—');

  return (
    <>
      <p>
        El cens es compta des del disc i es compara amb cada llista derivada: l'índex de
        skills, el catàleg que Claude carrega i el segell. La xifra de salut no és un
        percentatge d'ànim: és skills sense cap avís entre skills del cens.
      </p>
      <GraellaXifres xifres={xifres} generat={mapa.generat} />
      <Camp etiqueta="Filtra per nom">
        <CampText tipus="search" value={cerca} onChange={(e) => setCerca(e.target.value)} />
      </Camp>
      <PillToggle etiqueta="Quines skills es mostren" opcions={FILTRES.map(({ valor, text }) => ({ valor, text }))}
        valor={filtre} onCanvi={setFiltre} />
      <Taula titol="Inventari de skills" densa>
        <thead>
          <tr>
            <th scope="col">Semàfor</th><th scope="col">Skill</th><th scope="col">Estat</th>
            <th scope="col">Nucli</th><th scope="col">Paraules</th><th scope="col">Tokens ≈</th>
            <th scope="col">Lliçons</th><th scope="col">Disc · índex · Claude · segell</th><th scope="col">Avisos</th>
          </tr>
        </thead>
        <tbody>
          {files.length ? files.map((s) => (
            <tr key={s.id}>
              <td>{semafor(s.avisos.length)}</td>
              <th scope="row">{s.atributs.core ? <strong>{s.nom}</strong> : s.nom}</th>
              <td>{s.atributs.status ?? 'sense estat'}</td>
              <td>{siNo(s.atributs.core)}</td>
              <td>{n(s.atributs.paraules)}</td>
              <td>{Number.isInteger(s.atributs.paraules) ? n(Math.round(s.atributs.paraules * 1.3)) : '—'}</td>
              <td>{n(s.atributs.llicons)}</td>
              <td>{[s.atributs.al_disc, s.atributs.al_index, s.atributs.al_cataleg_claude, s.atributs.al_segell].map(siNo).join(' · ')}</td>
              {/* Ordre del Mestre, 261004 · el codi, la frase i les evidències, no només el codi cru. */}
              <td>{s.avisos.length ? s.avisos.map((a) => <AvisDeSkill key={a.codi} avis={a} />) : 'cap'}</td>
            </tr>
          )) : <tr><td colSpan={9}>Cap skill casa amb el filtre.</td></tr>}
        </tbody>
      </Taula>
    </>
  );
}
