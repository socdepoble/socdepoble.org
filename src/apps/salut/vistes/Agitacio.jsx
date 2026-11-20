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
  etiquetaDataLlargaSalut, etiquetaDataSalut, etiquetaValorSalut, frangesSalut,
  textAssociacioSalut, textErrorSalut, valoracioSetmanalSalut
} from '../i18nSalut.js';
import {
  accionsQueCalmen, antecedentsFrequents, associacioMiccio, episodis, episodisPerHora, nitsDolentes, perFranja
} from '../nucli/agitacio.js';
import { INSTRUMENTS_OFICIALS } from '../nucli/diccionari.js';
import { dataCurta, dillunsDe, horaDe, sumaDies } from '../nucli/hores.js';
import { useSalut } from '../useSalut.jsx';
import { EnllacBoto, EnllacDetall, MarcSalut, useInterruptorsSalut, useNavegaSalut, useTextosSalut } from './comunes.jsx';

/* Els patrons es miren sobre les últimes quatre setmanes. */
const DIES_PATRONS = 28;
const e = (clau, valor, idioma = 'ca') => etiquetaValorSalut('conducta', clau, valor, idioma);
const llista = (clau, valors, idioma = 'ca') => (valors || []).map((valor) => e(clau, valor, idioma)).join(', ');

function useAgitacioActiva() {
  const { actiu } = useInterruptorsSalut();
  return actiu('agitacio');
}

function Apagat() {
  const { ruta } = useApp();
  const tx = useTextosSalut();
  return (
    <EstatBuit titol={tx.agitacioApagadaTitol} accio={<EnllacBoto a={ruta('persona')}>{tx.vesAPersona}</EnllacBoto>}>
      {tx.agitacioApagadaText}
    </EstatBuit>
  );
}

export function Episodis({ params }) {
  const salut = useSalut();
  const { ruta, idioma = 'ca' } = useApp();
  const tx = useTextosSalut();
  const navega = useNavegaSalut();
  const activa = useAgitacioActiva();
  if (!salut.carregat) return null;
  if (!activa) return <MarcSalut titol={tx.episodis} columna="mig"><Apagat /></MarcSalut>;
  const llistaEpisodis = episodis(salut.apunts).reverse();
  const dates = [...new Set(llistaEpisodis.map((apunt) => apunt.jornada))];
  const categories = dates.map((data, ordre) => ({ id: data, nom: etiquetaDataLlargaSalut(data, idioma), visible: true, ordre }));
  const articles = llistaEpisodis.map((apunt) => ({
    id: apunt.id,
    nom: `${horaDe(apunt.moment)} · ${e('intensitat', apunt.intensitat, idioma)}`,
    secundari: llista('conductes', apunt.conductes, idioma),
    valor: e('resultat', apunt.resultat, idioma),
    categoriaId: apunt.jornada,
    estat: params?.apunt === apunt.id ? 'en-colleccio' : 'normal'
  }));
  return (
    <MarcSalut titol={tx.episodis} columna="mig"
      eines={(
        <Fila gap={2}>
          <EnllacBoto a={`${ruta('diari')}?nou=conducta`}>{tx.apuntanUn}</EnllacBoto>
          <EnllacBoto a={ruta('agitacio', 'setmanal')}>{tx.valoracioSetmanal}</EnllacBoto>
          <EnllacDetall a={ruta('agitacio', 'patrons')}>{tx.patrons}</EnllacDetall>
        </Fila>
      )}>
      {articles.length ? (
        <LlistaArticles articles={articles} categories={categories} etiqueta={tx.episodisApuntats} textos={{ 'en-colleccio': tx.obert }}
          onTria={(article) => navega(['agitacio', article.id])} />
      ) : (
        <EstatBuit titol={tx.encaraCapEpisodi}>{tx.encaraCapEpisodiText}</EstatBuit>
      )}
    </MarcSalut>
  );
}

export function Patrons() {
  const salut = useSalut();
  const { idioma = 'ca' } = useApp();
  const tx = useTextosSalut();
  const activa = useAgitacioActiva();
  if (!salut.carregat) return null;
  if (!activa) return <MarcSalut titol={tx.patrons}><Apagat /></MarcSalut>;
  const des = sumaDies(salut.avui, -(DIES_PATRONS - 1));
  const recents = salut.apunts.filter((apunt) => apunt.jornada >= des && apunt.jornada <= salut.avui);
  const llistaEpisodis = episodis(recents);
  const completes = [...salut.jornades.values()].filter((j) => j.completa && j.data >= des && j.data <= salut.avui).map((j) => j.data).sort();
  const hores = episodisPerHora(llistaEpisodis);
  const franges = perFranja(llistaEpisodis);
  const frangesList = frangesSalut(idioma);
  const associacio = textAssociacioSalut(
    associacioMiccio(recents, { persona: salut.persona, jornadesCompletes: completes, ofsetDe: salut.ofsetDe }),
    idioma
  );
  const nits = nitsDolentes(recents, completes);
  const barres = hores.map((valor, hora) => {
    const text = String(hora).padStart(2, '0');
    return { id: text, etiqueta: `${text} h`, valor, marca: hora % 3 === 0 ? text : '' };
  });
  return (
    <MarcSalut titol={tx.patrons4Setmanes}>
      {llistaEpisodis.length === 0 ? (
        <EstatBuit titol={tx.encaraNoEpisodis}>{tx.patronsApareixeran}</EstatBuit>
      ) : (
        <Pila gap={6}>
          <Histograma titol={tx.episodisPerHora} barres={barres} unitat={tx.unitatEpisodis} />
          <Taula titol={tx.episodisPerFranja}>
            <tbody>
              {frangesList.map((franja) => <tr key={franja.id}><th scope="row">{franja.etiqueta}</th><td>{franges[franja.id]}</td></tr>)}
            </tbody>
          </Taula>
          <Taula titol={tx.quePassavaAbans}>
            <thead><tr><th scope="col">{tx.quePassava}</th><th scope="col">{tx.vegades}</th></tr></thead>
            <tbody>
              {antecedentsFrequents(llistaEpisodis).map((fila) => (
                <tr key={fila.valor}><th scope="row">{e('antecedents', fila.valor, idioma)}</th><td>{fila.vegades}</td></tr>
              ))}
            </tbody>
          </Taula>
          <Taula titol={tx.queHemFetICom}>
            <thead><tr><th scope="col">{tx.queHemFet}</th><th scope="col">{tx.vegades}</th><th scope="col">{tx.esCalmaPrompte}</th></tr></thead>
            <tbody>
              {accionsQueCalmen(llistaEpisodis).map((fila) => (
                <tr key={fila.valor}><th scope="row">{e('accions', fila.valor, idioma)}</th><td>{fila.vegades}</td><td>{`${fila.calmaPrompte} (${fila.percent} %)`}</td></tr>
              ))}
            </tbody>
          </Taula>
          <Alerta to="info" viva={false} titol={tx.episodisIVaterTitol}>
            {associacio || tx.calen5Episodis}
          </Alerta>
          {nits.nitsDolentes ? (
            <p>{tx.nitsDolentesText(nits.nitsDolentes, String(nits.despresDolenta).replace('.', ','), nits.despresBona === null ? '—' : String(nits.despresBona).replace('.', ','))}</p>
          ) : null}
          <p>{tx.pistesEquipText}</p>
        </Pila>
      )}
    </MarcSalut>
  );
}

export function EpisodiDetall({ params }) {
  const salut = useSalut();
  const { ruta, idioma = 'ca' } = useApp();
  const tx = useTextosSalut();
  if (!salut.carregat) return null;
  const apunt = salut.apunts.find((candidat) => candidat.id === params.apunt && candidat.tipus === 'conducta');
  if (!apunt) return <MarcSalut titol={tx.episodi}><EstatBuit titol={tx.noTrobat}>{tx.episodiNoExistix}</EstatBuit></MarcSalut>;
  const files = [
    [tx.quan, tx.aLes(etiquetaDataLlargaSalut(apunt.jornada, idioma), horaDe(apunt.moment))],
    [tx.titolPas.a, llista('conductes', apunt.conductes, idioma)],
    [tx.comDeFort, e('intensitat', apunt.intensitat, idioma)],
    [tx.quantHaDurat, apunt.duradaMin ? `${apunt.duradaMin} min` : '—'],
    [tx.quePassavaAbans, [llista('antecedents', apunt.antecedents, idioma), apunt.antecedentsAltre].filter(Boolean).join('; ') || '—'],
    [tx.queHemFet, llista('accions', apunt.accions, idioma) || '—'],
    [tx.comHaAcabat, e('resultat', apunt.resultat, idioma)],
    [tx.perill, llista('risc', apunt.risc, idioma) || tx.cap],
    [tx.nota, apunt.nota || '—']
  ];
  return (
    <MarcSalut titol={tx.episodi}>
      <Pila gap={4}>
        <Taula titol={tx.registreEpisodi}>
          <tbody>{files.map(([nom, valor]) => <tr key={nom}><th scope="row">{nom}</th><td>{valor}</td></tr>)}</tbody>
        </Taula>
        {(apunt.risc || []).length ? <Alerta to="error" titol={tx.hiHaHagutPerillTitol}>{tx.hiHaHagutPerillText}</Alerta> : null}
        <EnllacBoto a={ruta('dies', apunt.jornada, apunt.id)}>{tx.corregixlo}</EnllacBoto>
      </Pila>
    </MarcSalut>
  );
}

/* ── Valoració setmanal ─────────────────────────────────────────────────── */

export function Valoracions() {
  const salut = useSalut();
  const { idioma = 'ca' } = useApp();
  const tx = useTextosSalut();
  const navega = useNavegaSalut();
  if (!salut.carregat) return null;
  const articles = salut.valoracions.slice().sort((a, b) => (a.setmanaInici < b.setmanaInici ? 1 : -1)).map((v) => ({
    id: v.setmanaInici, nom: tx.setmanaDel(etiquetaDataSalut(v.setmanaInici, idioma)), secundari: v.oficial ? `${v.oficial.instrument}: ${v.oficial.total}` : '', categoriaId: 'valoracions'
  }));
  return (
    <MarcSalut titol={tx.valoracionsSetmanals} columna="mig"
      eines={<Boto varietat="secundari" icona={Plus} onClick={() => navega(['agitacio', 'setmanal', dillunsDe(salut.avui)])}>{tx.laDEstaSetmana}</Boto>}>
      {articles.length ? (
        <LlistaArticles articles={articles} etiqueta={tx.valoracions} onTria={(article) => navega(['agitacio', 'setmanal', article.id])} />
      ) : (
        <EstatBuit titol={tx.encaraCapValoracio}>{tx.valoracioOpcionalText}</EstatBuit>
      )}
    </MarcSalut>
  );
}

const opcionsNumeriques = (min, max, etiquetes = null) => Array.from({ length: max - min + 1 }, (_, i) => {
  const valor = String(min + i);
  return { valor, etiqueta: etiquetes?.[i] || valor };
});

/* Un formulari per setmana: canviar de setmana el torna a muntar, sense esborranys d'una altra. */
export function ValoracioSetmanal({ params }) {
  const salut = useSalut();
  const setmana = params?.setmana || dillunsDe(salut.avui);
  return <FormulariValoracio key={setmana} setmana={setmana} />;
}

function FormulariValoracio({ setmana }) {
  const salut = useSalut();
  const { idioma = 'ca' } = useApp();
  const tx = useTextosSalut();
  const vTr = valoracioSetmanalSalut(idioma);
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
      setMissatge({ to: 'exit', text: tx.valoracioDesada });
    } catch (error) {
      setMissatge({ to: 'error', text: textErrorSalut(error, idioma) });
    }
  };
  return (
    <MarcSalut titol={tx.setmanaDel(dataCurta(setmana))}>
      <form onSubmit={desa} noValidate aria-label={tx.valoracioSetmanal}>
        <Pila gap={4}>
          <Alerta to="info" viva={false}>{vTr.avis}</Alerta>
          <GrupCamps llegenda={tx.quantesVegadesSetmana}>
            {vTr.grups.map((grup) => (
              <Camp key={grup.id} etiqueta={grup.etiqueta}>
                <Selector value={valors.conductesFreq?.[grup.id] === undefined ? '' : String(valors.conductesFreq[grup.id])}
                  opcions={[{ valor: '', etiqueta: tx.senseDir }, ...vTr.frequencies.map((o) => ({ valor: String(o.valor), etiqueta: o.etiqueta }))]}
                  onChange={(event) => posaFreq(grup.id, event.target.value)} />
              </Camp>
            ))}
          </GrupCamps>
          <GrupCamps llegenda={tx.comHaEstatIViscut}>
            {vTr.dominis.map((domini) => (
              <Fila key={domini.valor} gap={4} align="flex-end">
                <Camp etiqueta={tx.dominiFort(domini.etiqueta)}>
                  <Selector value={String(valors.dominis?.[domini.valor]?.gravetat ?? 0)} opcions={opcionsNumeriques(0, 3, vTr.gravetats)}
                    onChange={(event) => posaDomini(domini.valor, 'gravetat', event.target.value)} />
                </Camp>
                <Camp etiqueta={tx.dominiAngoixa(domini.etiqueta)}>
                  <Selector value={String(valors.dominis?.[domini.valor]?.angoixa ?? 0)} opcions={opcionsNumeriques(0, 5, vTr.angoixes)}
                    onChange={(event) => posaDomini(domini.valor, 'angoixa', event.target.value)} />
                </Camp>
              </Fila>
            ))}
          </GrupCamps>
          <GrupCamps llegenda={tx.puntuacioOficialLlegenda}>
            <Camp etiqueta={tx.instrument}>
              <Selector value={valors.oficial?.instrument || 'CMAI'} opcions={INSTRUMENTS_OFICIALS.map((i) => ({ valor: i, etiqueta: i }))}
                onChange={(event) => posaOficial('instrument', event.target.value)} />
            </Camp>
            <Camp etiqueta={tx.total}>
              <CampText inputMode="numeric" value={String(valors.oficial?.total ?? '')} onChange={(event) => posaOficial('total', event.target.value)} />
            </Camp>
            <Camp etiqueta={tx.dataLabel}>
              <CampText tipus="date" value={valors.oficial?.data || salut.avui} onChange={(event) => posaOficial('data', event.target.value)} />
            </Camp>
          </GrupCamps>
          {missatge ? <Alerta to={missatge.to}>{missatge.text}</Alerta> : null}
          <Boto varietat="primari" mida="gran" tipus="submit" disabled={salut.nomesLectura}>{tx.desa}</Boto>
        </Pila>
      </form>
    </MarcSalut>
  );
}
