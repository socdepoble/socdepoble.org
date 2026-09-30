import { useMemo, useState } from 'react';
import { Puzzle, ShieldCheck, TriangleAlert, Unlink } from 'lucide-react';
import { Camp, CampText, Insignia, PillToggle, Taula } from '../../../components/PedraSeca';
import { Xifra } from '../peces.jsx';
import { esForaDeCens, esOrfena, resumInventari, semaforDe } from './inventariMapa.js';

/* Inventari de skills (03_inventari_skills.md): quines skills tenim de veres
   i en quin estat estan. És la pestanya «Skills» d'Emowe amb el semàfor
   adaptat: 3 avisos o més, roig; 1 o 2, ambre; cap, verd. El semàfor i els
   filtres viuen a inventariMapa.js, i la targeta del tauler compta amb ells:
   el que pinta «Cal reparar» és el mateix roig d'esta taula. */

const FILTRES = Object.freeze([
  { valor: 'totes', text: 'Totes', f: () => true },
  { valor: 'avisos', text: 'Amb avisos', f: (s) => s.avisos.length > 0 },
  { valor: 'orfes', text: 'Òrfenes', f: esOrfena },
  { valor: 'cens', text: 'Fora d’algun cens', f: esForaDeCens },
  { valor: 'nucli', text: 'Nucli', f: (s) => s.atributs.core === true }
]);
const TO_SEVERITAT = Object.freeze({ alta: 'error', mitjana: 'avis', baixa: 'info' });

function semafor(n) {
  const color = semaforDe(n);
  if (color === 'roig') return <Insignia to="error">roig · {n}</Insignia>;
  if (color === 'ambre') return <Insignia to="avis">ambre · {n}</Insignia>;
  return <Insignia to="exit">verd</Insignia>;
}
const siNo = (v) => (v === null || v === undefined ? '—' : v ? 'sí' : 'no');

export function InventariMapa({ mapa, locale }) {
  const [filtre, setFiltre] = useState('totes');
  const [cerca, setCerca] = useState('');
  const resum = useMemo(() => resumInventari(mapa), [mapa]);
  const { skills, netes } = resum;
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
      <div className="sdp-card-grid">
        <Xifra icona={Puzzle} etiqueta="Skills al cens" valor={skills.length} />
        <Xifra icona={ShieldCheck} etiqueta="Sense cap avís" valor={`${netes} / ${skills.length}`} />
        <Xifra icona={Unlink} etiqueta="Òrfenes" valor={resum.orfenes} />
        <Xifra icona={TriangleAlert} etiqueta="Fora d’algun cens" valor={resum.foraDeCens} />
      </div>
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
              <td>{s.avisos.length ? s.avisos.map((a) => (
                <Insignia key={a.codi} to={TO_SEVERITAT[a.severitat]}>{a.codi}</Insignia>
              )) : 'cap'}</td>
            </tr>
          )) : <tr><td colSpan={9}>Cap skill casa amb el filtre.</td></tr>}
        </tbody>
      </Taula>
    </>
  );
}
