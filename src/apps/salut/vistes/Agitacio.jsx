/**
 * Agitacio.jsx — els episodis de conducta i els seus patrons.
 *
 *   /agitacio                          mig: els episodis per dies · detall: els patrons
 *   /agitacio/patrons                  el mateix; en un mòbil s'hi veuen els patrons
 *   /agitacio/:apunt                   detall: el registre ABC sencer
 *   /agitacio/setmanal(/:setmana)      la valoració setmanal (opcional)
 * Tot és descriptiu. Els patrons són pistes per a provar coses i parlar-ne
 * amb l'equip, mai una explicació. L'interruptor «agitacio» ho apaga.
 */
import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Alerta, Boto, Camp, CampText, EstatBuit, Fila, GrupCamps, Histograma, LlistaArticles, Pila, Selector, Taula
} from '../../../components/PedraSeca/index.js';
import { useApp } from '../../plataforma/index.js';
import {
  accionsQueCalmen, antecedentsFrequents, associacioMiccio, episodis, episodisPerHora, FRANGES, nitsDolentes, perFranja,
  textAssociacio
} from '../nucli/agitacio.js';
import {
  AVIS_VALORACIO, DOMINIS_VALORACIO, FREQUENCIES_VALORACIO, GRUPS_CONDUCTA, INSTRUMENTS_OFICIALS, campDe, etiquetaValor
} from '../nucli/diccionari.js';
import { dataCurta, dillunsDe, etiquetaData, etiquetaDataLlarga, horaDe, sumaDies } from '../nucli/hores.js';
import { textError } from '../textos.js';
import { useSalut } from '../useSalut.jsx';
import { EnllacBoto, EnllacDetall, MarcSalut, useInterruptorsSalut, useNavegaSalut } from './comunes.jsx';

/* Els patrons es miren sobre les últimes quatre setmanes. */
const DIES_PATRONS = 28;
const e = (clau, valor) => etiquetaValor(campDe('conducta', clau), valor);
const llista = (clau, valors) => (valors || []).map((valor) => e(clau, valor)).join(', ');

function useAgitacioActiva() {
  const { actiu } = useInterruptorsSalut();
  return actiu('agitacio');
}

function Apagat() {
  const { ruta } = useApp();
  return (
    <EstatBuit titol="L’apartat d’agitació està apagat" accio={<EnllacBoto a={ruta('persona')}>Ves a Persona</EnllacBoto>}>
      Es pot tornar a encendre a Persona, a «Què voleu apuntar».
    </EstatBuit>
  );
}

export function Episodis({ params }) {
  const salut = useSalut();
  const { ruta } = useApp();
  const navega = useNavegaSalut();
  const activa = useAgitacioActiva();
  if (!salut.carregat) return null;
  if (!activa) return <MarcSalut titol="Episodis" columna="mig"><Apagat /></MarcSalut>;
  const llistaEpisodis = episodis(salut.apunts).reverse();
  const dates = [...new Set(llistaEpisodis.map((apunt) => apunt.jornada))];
  const categories = dates.map((data, ordre) => ({ id: data, nom: etiquetaDataLlarga(data), visible: true, ordre }));
  const articles = llistaEpisodis.map((apunt) => ({
    id: apunt.id,
    nom: `${horaDe(apunt.moment)} · ${e('intensitat', apunt.intensitat)}`,
    secundari: llista('conductes', apunt.conductes),
    valor: e('resultat', apunt.resultat),
    categoriaId: apunt.jornada,
    estat: params?.apunt === apunt.id ? 'en-colleccio' : 'normal'
  }));
  return (
    <MarcSalut titol="Episodis" columna="mig"
      eines={(
        <Fila gap={2}>
          <EnllacBoto a={`${ruta('diari')}?nou=conducta`}>Apunta’n un</EnllacBoto>
          <EnllacBoto a={ruta('agitacio', 'setmanal')}>Valoració setmanal</EnllacBoto>
          <EnllacDetall a={ruta('agitacio', 'patrons')}>Patrons</EnllacDetall>
        </Fila>
      )}>
      {articles.length ? (
        <LlistaArticles articles={articles} categories={categories} etiqueta="Episodis apuntats" textos={{ 'en-colleccio': 'Obert' }}
          onTria={(article) => navega(['agitacio', article.id])} />
      ) : (
        <EstatBuit titol="Encara no hi ha cap episodi apuntat">Quan n’hi haja, ací es veuran per dies.</EstatBuit>
      )}
    </MarcSalut>
  );
}

export function Patrons() {
  const salut = useSalut();
  const activa = useAgitacioActiva();
  if (!salut.carregat) return null;
  if (!activa) return <MarcSalut titol="Patrons"><Apagat /></MarcSalut>;
  const des = sumaDies(salut.avui, -(DIES_PATRONS - 1));
  const recents = salut.apunts.filter((apunt) => apunt.jornada >= des && apunt.jornada <= salut.avui);
  const llistaEpisodis = episodis(recents);
  const completes = [...salut.jornades.values()].filter((j) => j.completa && j.data >= des && j.data <= salut.avui).map((j) => j.data).sort();
  const hores = episodisPerHora(llistaEpisodis);
  const franges = perFranja(llistaEpisodis);
  const associacio = textAssociacio(associacioMiccio(recents, { persona: salut.persona, jornadesCompletes: completes, ofsetDe: salut.ofsetDe }));
  const nits = nitsDolentes(recents, completes);
  const barres = hores.map((valor, hora) => {
    const text = String(hora).padStart(2, '0');
    return { id: text, etiqueta: `${text} h`, valor, marca: hora % 3 === 0 ? text : '' };
  });
  return (
    <MarcSalut titol="Patrons de les últimes 4 setmanes">
      {llistaEpisodis.length === 0 ? (
        <EstatBuit titol="Encara no hi ha episodis">Els patrons apareixeran quan n’hi haja d’apuntats.</EstatBuit>
      ) : (
        <Pila gap={6}>
          <Histograma titol="Episodis per hora del dia" barres={barres} unitat="episodis" />
          <Taula titol="Episodis per franja">
            <tbody>
              {FRANGES.map((franja) => <tr key={franja.id}><th scope="row">{franja.etiqueta}</th><td>{franges[franja.id]}</td></tr>)}
            </tbody>
          </Taula>
          <Taula titol="Què passava abans">
            <thead><tr><th scope="col">Què passava</th><th scope="col">Vegades</th></tr></thead>
            <tbody>
              {antecedentsFrequents(llistaEpisodis).map((fila) => (
                <tr key={fila.valor}><th scope="row">{e('antecedents', fila.valor)}</th><td>{fila.vegades}</td></tr>
              ))}
            </tbody>
          </Taula>
          <Taula titol="Què hem fet i com ha anat">
            <thead><tr><th scope="col">Què hem fet</th><th scope="col">Vegades</th><th scope="col">Es calma prompte</th></tr></thead>
            <tbody>
              {accionsQueCalmen(llistaEpisodis).map((fila) => (
                <tr key={fila.valor}><th scope="row">{e('accions', fila.valor)}</th><td>{fila.vegades}</td><td>{`${fila.calmaPrompte} (${fila.percent} %)`}</td></tr>
              ))}
            </tbody>
          </Taula>
          <Alerta to="info" viva={false} titol="Episodis i ganes d’anar al vàter">
            {associacio || 'Encara no hi ha prou dades: calen 5 episodis i 3 jornades completes.'}
          </Alerta>
          {nits.nitsDolentes ? (
            <p>{`Després de ${nits.nitsDolentes} ${nits.nitsDolentes === 1 ? 'nit dolenta' : 'nits dolentes'} hi ha hagut, de mitjana, ${String(nits.despresDolenta).replace('.', ',')} episodis l’endemà; després d’una nit bona, ${nits.despresBona === null ? '—' : String(nits.despresBona).replace('.', ',')}.`}</p>
          ) : null}
          <p>Són pistes per a provar coses (oferir el vàter, beguda, descans) i parlar-ne amb l’equip. Si canvia de pressa, parla-ho hui amb el metge.</p>
        </Pila>
      )}
    </MarcSalut>
  );
}

export function EpisodiDetall({ params }) {
  const salut = useSalut();
  const { ruta } = useApp();
  if (!salut.carregat) return null;
  const apunt = salut.apunts.find((candidat) => candidat.id === params.apunt && candidat.tipus === 'conducta');
  if (!apunt) return <MarcSalut titol="Episodi"><EstatBuit titol="No trobat">Este episodi no existix o ja s’ha esborrat.</EstatBuit></MarcSalut>;
  const files = [
    ['Quan', `${etiquetaDataLlarga(apunt.jornada)}, a les ${horaDe(apunt.moment)}`],
    ['Què ha fet', llista('conductes', apunt.conductes)],
    ['Com de fort', e('intensitat', apunt.intensitat)],
    ['Quant ha durat', apunt.duradaMin ? `${apunt.duradaMin} min` : '—'],
    ['Què passava abans', [llista('antecedents', apunt.antecedents), apunt.antecedentsAltre].filter(Boolean).join('; ') || '—'],
    ['Què hem fet', llista('accions', apunt.accions) || '—'],
    ['Com ha acabat', e('resultat', apunt.resultat)],
    ['Perill', llista('risc', apunt.risc) || 'Cap'],
    ['Nota', apunt.nota || '—']
  ];
  return (
    <MarcSalut titol="Episodi">
      <Pila gap={4}>
        <Taula titol="Registre de l’episodi">
          <tbody>{files.map(([nom, valor]) => <tr key={nom}><th scope="row">{nom}</th><td>{valor}</td></tr>)}</tbody>
        </Taula>
        {(apunt.risc || []).length ? <Alerta to="error" titol="Hi ha hagut perill">Si hi ha perill ara mateix, truca al 112. Si no, parla-ho amb l’equip que el porta.</Alerta> : null}
        <EnllacBoto a={ruta('dies', apunt.jornada, apunt.id)}>Corregix-lo</EnllacBoto>
      </Pila>
    </MarcSalut>
  );
}

/* ── Valoració setmanal ─────────────────────────────────────────────────── */

export function Valoracions() {
  const salut = useSalut();
  const navega = useNavegaSalut();
  if (!salut.carregat) return null;
  const articles = salut.valoracions.slice().sort((a, b) => (a.setmanaInici < b.setmanaInici ? 1 : -1)).map((v) => ({
    id: v.setmanaInici, nom: `Setmana del ${etiquetaData(v.setmanaInici)}`, secundari: v.oficial ? `${v.oficial.instrument}: ${v.oficial.total}` : '', categoriaId: 'valoracions'
  }));
  return (
    <MarcSalut titol="Valoracions setmanals" columna="mig"
      eines={<Boto varietat="secundari" icona={Plus} onClick={() => navega(['agitacio', 'setmanal', dillunsDe(salut.avui)])}>La d’esta setmana</Boto>}>
      {articles.length ? (
        <LlistaArticles articles={articles} etiqueta="Valoracions" onTria={(article) => navega(['agitacio', 'setmanal', article.id])} />
      ) : (
        <EstatBuit titol="Encara no hi ha cap valoració">És opcional: una vegada per setmana, com ha anat en general.</EstatBuit>
      )}
    </MarcSalut>
  );
}

const opcionsNumeriques = (min, max, etiquetes = null) => Array.from({ length: max - min + 1 }, (_, i) => {
  const valor = String(min + i);
  return { valor, etiqueta: etiquetes?.[i] || valor };
});
const GRAVETATS = ['0 · No', '1 · Lleu', '2 · Moderada', '3 · Greu'];
const ANGOIXES = ['0 · Gens', '1', '2', '3', '4', '5 · Moltíssima'];

/* Un formulari per setmana: canviar de setmana el torna a muntar, sense esborranys d'una altra. */
export function ValoracioSetmanal({ params }) {
  const salut = useSalut();
  const setmana = params?.setmana || dillunsDe(salut.avui);
  return <FormulariValoracio key={setmana} setmana={setmana} />;
}

function FormulariValoracio({ setmana }) {
  const salut = useSalut();
  const existent = salut.valoracions.find((v) => v.setmanaInici === setmana) || null;
  const inicial = useMemo(() => existent || { conductesFreq: {}, dominis: {} }, [existent]);
  const [esborrany, setEsborrany] = useState(null);
  const [missatge, setMissatge] = useState(null);
  if (!salut.carregat) return null;
  const valors = esborrany || inicial;
  const posaFreq = (grup, valor) => setEsborrany({ ...valors, conductesFreq: { ...valors.conductesFreq, [grup]: valor === '' ? undefined : Number(valor) } });
  const posaDomini = (domini, clau, valor) => setEsborrany({
    ...valors, dominis: { ...valors.dominis, [domini]: { gravetat: 0, angoixa: 0, ...valors.dominis[domini], [clau]: Number(valor) } }
  });
  const posaOficial = (clau, valor) => setEsborrany({ ...valors, oficial: { instrument: 'CMAI', total: '', data: salut.avui, ...valors.oficial, [clau]: valor } });
  const desa = async (event) => {
    event.preventDefault();
    const oficial = valors.oficial && String(valors.oficial.total).trim() !== ''
      ? { ...valors.oficial, total: Number(valors.oficial.total), perProfessional: true } : undefined;
    const conductesFreq = Object.fromEntries(Object.entries(valors.conductesFreq || {}).filter(([, v]) => v !== undefined));
    try {
      await salut.desaValoracio({ id: existent?.id, setmanaInici: setmana, conductesFreq, dominis: valors.dominis || {}, ...(oficial ? { oficial } : {}) });
      setEsborrany(null);
      setMissatge({ to: 'exit', text: 'Valoració desada.' });
    } catch (error) {
      setMissatge({ to: 'error', text: textError(error) });
    }
  };
  return (
    <MarcSalut titol={`Setmana del ${dataCurta(setmana)}`}>
      <form onSubmit={desa} noValidate aria-label="Valoració setmanal">
        <Pila gap={4}>
          <Alerta to="info" viva={false}>{AVIS_VALORACIO}</Alerta>
          <GrupCamps llegenda="Quantes vegades, esta setmana">
            {GRUPS_CONDUCTA.map((grup) => (
              <Camp key={grup.id} etiqueta={grup.etiqueta}>
                <Selector value={valors.conductesFreq?.[grup.id] === undefined ? '' : String(valors.conductesFreq[grup.id])}
                  opcions={[{ valor: '', etiqueta: 'Sense dir' }, ...FREQUENCIES_VALORACIO.map((o) => ({ valor: String(o.valor), etiqueta: o.etiqueta }))]}
                  onChange={(event) => posaFreq(grup.id, event.target.value)} />
              </Camp>
            ))}
          </GrupCamps>
          <GrupCamps llegenda="Com ha estat, i com ho has viscut tu">
            {DOMINIS_VALORACIO.map((domini) => (
              <Fila key={domini.valor} gap={4} align="flex-end">
                <Camp etiqueta={`${domini.etiqueta}: com de fort`}>
                  <Selector value={String(valors.dominis?.[domini.valor]?.gravetat ?? 0)} opcions={opcionsNumeriques(0, 3, GRAVETATS)}
                    onChange={(event) => posaDomini(domini.valor, 'gravetat', event.target.value)} />
                </Camp>
                <Camp etiqueta={`${domini.etiqueta}: quant t’ha pesat`}>
                  <Selector value={String(valors.dominis?.[domini.valor]?.angoixa ?? 0)} opcions={opcionsNumeriques(0, 5, ANGOIXES)}
                    onChange={(event) => posaDomini(domini.valor, 'angoixa', event.target.value)} />
                </Camp>
              </Fila>
            ))}
          </GrupCamps>
          <GrupCamps llegenda="Puntuació oficial (només si te la dona un professional)">
            <Camp etiqueta="Instrument">
              <Selector value={valors.oficial?.instrument || 'CMAI'} opcions={INSTRUMENTS_OFICIALS.map((i) => ({ valor: i, etiqueta: i }))}
                onChange={(event) => posaOficial('instrument', event.target.value)} />
            </Camp>
            <Camp etiqueta="Total">
              <CampText inputMode="numeric" value={String(valors.oficial?.total ?? '')} onChange={(event) => posaOficial('total', event.target.value)} />
            </Camp>
            <Camp etiqueta="Data">
              <CampText tipus="date" value={valors.oficial?.data || salut.avui} onChange={(event) => posaOficial('data', event.target.value)} />
            </Camp>
          </GrupCamps>
          {missatge ? <Alerta to={missatge.to}>{missatge.text}</Alerta> : null}
          <Boto varietat="primari" mida="gran" tipus="submit" disabled={salut.nomesLectura}>Desa</Boto>
        </Pila>
      </form>
    </MarcSalut>
  );
}
