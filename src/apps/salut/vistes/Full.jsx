/**
 * Full.jsx — el full per al metge (/full?des=AAAA-MM-DD&dies=N).
 *
 *   mig      les jornades del període, en llista (LlistaArticles de l'esquelet comú)
 *   detall   la taula del resum, la mateixa que l'exportació (full.js), i «Exporta»
 * El que es veu a la pantalla és el que s'envia: tot ix de fullDiari.
 */
import { useMemo, useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import {
  Boto, Camp, CampText, Fila, LlistaArticles, Pila, Selector, Taula
} from '../../../components/PedraSeca/index.js';
import { esData } from '../../plataforma/index.js';
import { fullDiari } from '../nucli/full.js';
import { etiquetaDataLlarga } from '../nucli/hores.js';
import { textCobertura } from '../nucli/metriques.js';
import { useSalut } from '../useSalut.jsx';
import { MarcSalut, diesPossiblesAmb, useNavegaSalut, usePeriodeTriat, useTextosSalut } from './comunes.jsx';
import { DialegExportacio } from './DialegExportacio.jsx';

/**
 * El full del període triat (el mateix model per a la pantalla i el fitxer).
 * La pantalla és d'este dispositiu i hi posa l'àlies; el fitxer no el porta
 * si no s'escriu un nom a DialegExportacio.
 */
function useFullDelPeriode() {
  const salut = useSalut();
  const periode = usePeriodeTriat();
  const full = useMemo(() => (salut.carregat ? fullDiari({
    des: periode.des, dies: periode.dies, apunts: salut.apunts, jornades: salut.jornades, persona: salut.persona,
    nomPersona: salut.persona.alias, ofsetDe: salut.ofsetDe
  }) : null), [salut.carregat, periode.des, periode.dies, salut.apunts, salut.jornades, salut.persona, salut.ofsetDe]);
  return { ...periode, full };
}

const cela = (valor) => {
  if (valor === null || valor === undefined || valor === '') return '—';
  return typeof valor === 'number' ? String(valor).replace('.', ',') : valor;
};

export function ResumDies() {
  const { full, des, dies } = useFullDelPeriode();
  const navega = useNavegaSalut();
  const tx = useTextosSalut();
  if (!full) return null;
  const articles = full.periode.jornades.map((m) => ({
    id: m.data,
    nom: etiquetaDataLlarga(m.data),
    secundari: tx.secundariJornadaFull(m.frequenciaDiurna, m.nicturia, textCobertura(m)),
    valor: m.completa ? tx.completa : tx.oberta,
    categoriaId: 'periode'
  }));
  return (
    <MarcSalut titol={tx.diesDesDe(dies, etiquetaDataLlarga(des))} columna="mig">
      <LlistaArticles articles={articles} etiqueta={tx.jornadesDelPeriode} onTria={(article) => navega(['dies', article.id])} />
    </MarcSalut>
  );
}

export function FullMetge() {
  const { full, des, dies, posa } = useFullDelPeriode();
  const tx = useTextosSalut();
  const [obert, setObert] = useState(false);
  if (!full) return null;
  const [resum] = full.model.fulles;
  const capcalera = resum.files.slice(0, 3).map((fila) => fila[0]);
  const files = resum.files.slice(3);
  const eines = (
    <Fila gap={4} align="flex-end">
      <Camp etiqueta={tx.desDe}>
        <CampText tipus="date" value={des} onChange={(event) => { if (esData(event.target.value)) posa({ des: event.target.value }); }} />
      </Camp>
      <Camp etiqueta={tx.dies}>
        <Selector value={String(dies)} opcions={diesPossiblesAmb(dies).map((n) => ({ valor: String(n), etiqueta: String(n) }))}
          onChange={(event) => posa({ dies: event.target.value })} />
      </Camp>
      <Boto varietat="primari" icona={FileSpreadsheet} onClick={() => setObert(true)}>{tx.exporta}</Boto>
    </Fila>
  );
  return (
    <MarcSalut titol={tx.fullPerAlMetge} eines={eines}>
      <Pila gap={4}>
        <Pila gap={1}>
          {capcalera.map((linia) => <p key={linia}>{linia}</p>)}
        </Pila>
        <Taula titol={tx.resumPerDies} densa>
          <thead>
            <tr>{resum.columnes.map((columna) => <th key={columna.titol} scope="col">{columna.titol}</th>)}</tr>
          </thead>
          <tbody>
            {files.map((fila) => (
              <tr key={fila[0]}>
                <th scope="row">{fila[0]}</th>
                {fila.slice(1).map((valor, i) => <td key={resum.columnes[i + 1].titol}>{cela(valor)}</td>)}
              </tr>
            ))}
          </tbody>
        </Taula>
        <p>{tx.notaMitjanesFull}</p>
      </Pila>
      <DialegExportacio obert={obert} onTanca={() => setObert(false)} des={des} dies={dies} />
    </MarcSalut>
  );
}
