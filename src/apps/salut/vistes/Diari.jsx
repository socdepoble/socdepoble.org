/**
 * Diari.jsx — apuntar i mirar els dies.
 *
 *   /diari                      mig: la línia del temps d'avui · detall: la botonera (?nou=<tipus>: el formulari)
 *   /dies                       mig: els dies apuntats · detall: el diari de 3 dies (períodes)
 *   /dies/periodes              el mateix, però en un mòbil es veu el detall
 *   /dies/:data                 mig: la línia del temps d'eixa jornada · detall: el resum de la jornada
 *   /dies/:data/resum           el mateix, però en un mòbil es veu el resum
 *   /dies/:data/:apunt          mig: la mateixa línia · detall: corregir o esborrar l'apunt
 *
 * La botonera és una graella de rajoles i els dies, una llista: l'esquelet
 * comú (GraellaArticles, LlistaArticles) i la LiniaDelTemps de Pedra Seca.
 * Tota tria es reflectix a l'URL (només dates, ids i el tipus d'apunt).
 */
import { useState } from 'react';
import { Moon } from 'lucide-react';
import { useLocation, useNavigate } from '../../../app/contexts/RouterContext';
import {
  Alerta, Boto, DialegConfirmacio, EstatBuit, Fila, GraellaArticles, Interruptor, LiniaDelTemps, LlistaArticles, Pila, Taula
} from '../../../components/PedraSeca/index.js';
import { esData, esSlug, useApp, useParametresConsulta } from '../../plataforma/index.js';
import { IDS_TIPUS, INTERRUPTOR_DE_TIPUS, TIPUS_APUNT, resumApunt, tipusDe } from '../nucli/diccionari.js';
import { dataLocalDe, etiquetaData, etiquetaDataLlarga, horaDe, jornadesAmbApunts, ordenaPerInstant, sumaDies } from '../nucli/hores.js';
import { MOTIUS_SENSE_VOLUMS, metriquesJornada, textCobertura } from '../nucli/metriques.js';
import { textError } from '../textos.js';
import { useSalut } from '../useSalut.jsx';
import { EnllacBoto, EnllacDetall, MarcSalut, iconaDeTipus, useEstret, useInterruptorsSalut, useNavegaSalut } from './comunes.jsx';
import { FormulariApunt, PASSOS_CONDUCTA } from './FormulariApunt.jsx';

/* La consulta de /diari: el tipus del formulari obert, el pas de la conducta i el mode nit. */
const CONSULTA_DIARI = Object.freeze({
  nou: (valor) => esSlug(valor) && IDS_TIPUS.includes(valor),
  pas: (valor) => PASSOS_CONDUCTA.includes(valor),
  mode: (valor) => valor === 'nit'
});
/* De nit, només el que es fa a les fosques. */
const TIPUS_NIT = Object.freeze(['miccio', 'absorbent', 'son']);
const ETIQUETA_NIT = Object.freeze({ son: 'Es desperta' });

/* Clàusula dels Slugs: arrere recorre seccions. El formulari d'apuntar
   ocupa entrades de l'historial: obrir-lo i cada pas fan push (arrere torna
   al pas d'abans amb el que s'hi havia escrit). Cada entrada que empeny porta
   a l'estat de l'historial quantes n'ha empès des de la botonera; en desar o
   cancel·lar es torna arrere eixes entrades i l'historial queda com abans
   d'obrir-lo, sense entrades repetides ni un formulari buit darrere. Si el
   formulari s'ha obert d'una altra manera (un enllaç, una adreça escrita), no
   se sap on comença: es tanca amb replace. */
const CLAU_HISTORIAL = 'salutFormulari';

function useHistorialFormulari(validadors) {
  const navigate = useNavigate();
  const { pathname, search, state } = useLocation();
  const profunditat = Number.isSafeInteger(state?.[CLAU_HISTORIAL]) && state[CLAU_HISTORIAL] > 0 ? state[CLAU_HISTORIAL] : null;
  /* La mateixa consulta amb els canvis, només amb valors que passen el seu validador. */
  const ambConsulta = (canvis) => {
    const nous = new URLSearchParams(search);
    for (const [nom, valor] of Object.entries(canvis)) {
      if (valor === null || valor === undefined) nous.delete(nom);
      else if (validadors[nom]?.(String(valor))) nous.set(nom, String(valor));
      else return null;
    }
    const text = nous.toString();
    return text ? `${pathname}?${text}` : pathname;
  };
  const empeny = (canvis, nivell) => {
    const desti = ambConsulta(canvis);
    if (desti) navigate(desti, { state: nivell ? { [CLAU_HISTORIAL]: nivell } : null });
  };
  return {
    /** Obri el formulari des de la botonera: la primera entrada pròpia. */
    obri: (canvis) => empeny(canvis, 1),
    /** Un pas més dins del formulari. */
    pas: (canvis) => empeny(canvis, profunditat ? profunditat + 1 : null),
    /** Tanca el formulari (desat o cancel·lat): torna on era abans d'obrir-lo. */
    tanca: (canvis) => {
      if (profunditat) navigate(-profunditat);
      else {
        const desti = ambConsulta(canvis);
        if (desti) navigate(desti, { replace: true });
      }
    }
  };
}

/** Els tipus que la família fa servir (els interruptors de Salut). */
export function useTipusActius() {
  const { actiu } = useInterruptorsSalut();
  return TIPUS_APUNT.filter((tipus) => !INTERRUPTOR_DE_TIPUS[tipus.id] || actiu(INTERRUPTOR_DE_TIPUS[tipus.id]));
}

/* Els apunts d'una jornada per a la LiniaDelTemps de Pedra Seca. */
function apuntsDeLinia(apunts, ruta) {
  return ordenaPerInstant(apunts).map((apunt) => ({
    id: apunt.id,
    hora: horaDe(apunt.moment),
    moment: apunt.moment,
    titol: resumApunt(apunt),
    icona: iconaDeTipus(apunt.tipus),
    ruta: ruta('dies', apunt.jornada, apunt.id)
  }));
}

function LiniaDeJornada({ data, seleccionat = null, titol }) {
  const salut = useSalut();
  const { ruta } = useApp();
  if (!salut.carregat) return null;
  const delDia = salut.apunts.filter((apunt) => apunt.jornada === data);
  const eines = (
    <Fila gap={2}>
      <EnllacBoto a={ruta('dies', sumaDies(data, -1))}>Dia anterior</EnllacBoto>
      {data < salut.avui ? <EnllacBoto a={ruta('dies', sumaDies(data, 1))}>Dia següent</EnllacBoto> : null}
      <EnllacDetall a={ruta('dies', data, 'resum')}>Resum del dia</EnllacDetall>
    </Fila>
  );
  return (
    <MarcSalut titol={titol || etiquetaDataLlarga(data)} eines={eines} columna="mig">
      <LiniaDelTemps apunts={apuntsDeLinia(delDia, ruta)} etiqueta={`Apunts de ${etiquetaDataLlarga(data)}`} seleccionat={seleccionat}
        buit="Encara no hi ha cap apunt en esta jornada." />
    </MarcSalut>
  );
}

/* ── /diari ─────────────────────────────────────────────────────────────── */

export function LiniaAvui() {
  const salut = useSalut();
  return <LiniaDeJornada data={salut.avui} titol="Avui" />;
}

export function Apuntar() {
  const salut = useSalut();
  const { ruta } = useApp();
  const [consulta, posa] = useParametresConsulta(CONSULTA_DIARI);
  const historial = useHistorialFormulari(CONSULTA_DIARI);
  const tipusActius = useTipusActius();
  const [darrer, setDarrer] = useState(null);
  if (!salut.carregat) return null;

  const definicio = consulta.nou ? tipusDe(consulta.nou) : null;
  if (definicio && tipusActius.includes(definicio)) {
    const pas = definicio.id === 'conducta' ? consulta.pas || PASSOS_CONDUCTA[0] : null;
    const desa = async (apunt) => {
      const resultat = await salut.desaApunt(apunt);
      if (resultat.ok) {
        setDarrer(resultat.apunt);
        historial.tanca({ nou: null, pas: null });
      }
      return resultat;
    };
    return (
      <MarcSalut titol={definicio.nom}>
        <FormulariApunt key={definicio.id} tipus={definicio.id} pas={pas} onPas={(nou) => historial.pas({ pas: nou })} onDesa={desa}
          onCancela={() => historial.tanca({ nou: null, pas: null })} />
      </MarcSalut>
    );
  }

  const nit = consulta.mode === 'nit';
  const tipus = nit ? tipusActius.filter((t) => TIPUS_NIT.includes(t.id)) : tipusActius;
  const articles = tipus.map((t) => ({ id: t.id, nom: (nit && ETIQUETA_NIT[t.id]) || t.boto, categoriaId: 'apuntar' }));
  const media = (article) => {
    const Icona = iconaDeTipus(article.id);
    return <Icona size={40} aria-hidden="true" focusable="false" />;
  };
  return (
    <MarcSalut titol={nit ? 'Apuntar de nit' : 'Apuntar'}
      eines={(
        <Fila gap={2}>
          <Boto varietat={nit ? 'primari' : 'secundari'} icona={Moon} aria-pressed={nit} onClick={() => posa({ mode: nit ? null : 'nit' })}>
            Mode nit
          </Boto>
          <EnllacBoto a={ruta('dies', salut.avui)}>Veure el dia</EnllacBoto>
        </Fila>
      )}>
      <Pila gap={4}>
        {darrer ? (
          <Alerta to="exit" titol="Apuntat">{`${resumApunt(darrer)}, a les ${horaDe(darrer.moment)}.`}</Alerta>
        ) : null}
        <GraellaArticles articles={articles} etiqueta="Què vols apuntar" renderMedia={media}
          onTria={(article) => { setDarrer(null); historial.obri({ nou: article.id, pas: null }); }} />
      </Pila>
    </MarcSalut>
  );
}

/* ── /dies ──────────────────────────────────────────────────────────────── */

export function LlistaDies() {
  const salut = useSalut();
  const { ruta } = useApp();
  const navega = useNavegaSalut();
  const estret = useEstret();
  if (!salut.carregat) return null;
  const dates = [...new Set([salut.avui, ...jornadesAmbApunts(salut.apunts), ...salut.jornades.keys()])].filter(esData).sort().reverse();
  const articles = dates.map((data) => {
    const n = salut.apunts.filter((apunt) => apunt.jornada === data).length;
    return {
      id: data,
      nom: etiquetaDataLlarga(data),
      secundari: `${n} ${n === 1 ? 'apunt' : 'apunts'}`,
      valor: salut.jornades.get(data)?.completa ? 'Completa' : '',
      categoriaId: 'dies'
    };
  });
  return (
    <MarcSalut titol="Dies" columna="mig" eines={estret ? <EnllacBoto a={ruta('dies', 'periodes')}>Diari de 3 dies</EnllacBoto> : null}>
      {articles.length ? (
        <LlistaArticles articles={articles} etiqueta="Dies apuntats" onTria={(article) => navega(['dies', article.id])} />
      ) : (
        <EstatBuit titol="Encara no hi ha cap dia apuntat" accio={<EnllacBoto a={ruta('diari')}>Apunta el primer</EnllacBoto>} />
      )}
    </MarcSalut>
  );
}

export function Periodes() {
  const salut = useSalut();
  const { ruta } = useApp();
  const [error, setError] = useState(null);
  if (!salut.carregat) return null;
  const enCurs = salut.periodes.find((periode) => periode.estat === 'en-curs') || null;
  const acabats = salut.periodes.filter((periode) => periode.estat === 'acabat').sort((a, b) => (a.inici < b.inici ? 1 : -1));
  const executa = (fn) => fn().then(() => setError(null), (e) => setError(textError(e)));
  const enllacFull = (periode) => `${ruta('full')}?des=${periode.inici}&dies=${periode.dies}`;
  /* En acabar un diari, el recordatori de la còpia si no n'hi ha cap de després. */
  const darrerAcabat = acabats[0] || null;
  const copiaPendent = Boolean(darrerAcabat) && (!salut.ultimaCopia || dataLocalDe(salut.ultimaCopia) < sumaDies(darrerAcabat.inici, darrerAcabat.dies - 1));
  return (
    <MarcSalut titol="Diari de 3 dies">
      <Pila gap={4}>
        {enCurs ? (
          <Alerta to="info" viva={false} titol="Hi ha un diari en marxa"
            accions={(
              <Fila gap={2}>
                <EnllacBoto a={enllacFull(enCurs)}>Veure’l al full</EnllacBoto>
                <Boto varietat="secundari" disabled={salut.nomesLectura} onClick={() => executa(() => salut.acabaPeriode(enCurs.id))}>Acaba’l</Boto>
              </Fila>
            )}>
            {`Comença ${etiquetaDataLlarga(enCurs.inici)} i dura ${enCurs.dies} dies.`}
          </Alerta>
        ) : (
          <Pila gap={2}>
            <p>Durant tres dies seguits, apunta-ho tot: el que beu, cada vegada que orina (i quant, si pots), els escapaments i la son. Al final, el full per al metge ho ordena.</p>
            <Boto varietat="primari" mida="gran" disabled={salut.nomesLectura} onClick={() => executa(() => salut.creaPeriode({ inici: salut.avui, dies: 3 }))}>
              Comença un diari de 3 dies
            </Boto>
            <EnllacBoto a={ruta('guia', 'diari-3-dies')}>Com es fa</EnllacBoto>
          </Pila>
        )}
        {error ? <Alerta to="error">{error}</Alerta> : null}
        {copiaPendent ? (
          <Alerta to="info" viva={false} titol="Còpia de seguretat" accions={<EnllacBoto a={ruta('copia')}>Fes una còpia</EnllacBoto>}>
            Has acabat un diari: guarda’n una còpia, que les dades només són en este dispositiu.
          </Alerta>
        ) : null}
        {acabats.length ? (
          <Taula titol="Diaris acabats">
            <thead><tr><th scope="col">Inici</th><th scope="col">Dies</th><th scope="col">Full</th></tr></thead>
            <tbody>
              {acabats.map((periode) => (
                <tr key={periode.id}>
                  <td>{etiquetaData(periode.inici)}</td>
                  <td>{periode.dies}</td>
                  <td><EnllacBoto a={enllacFull(periode)}>Obri el full</EnllacBoto></td>
                </tr>
              ))}
            </tbody>
          </Taula>
        ) : null}
      </Pila>
    </MarcSalut>
  );
}

/* ── /dies/:data ────────────────────────────────────────────────────────── */

export function LiniaJornada({ params }) {
  return <LiniaDeJornada data={params.data} seleccionat={params.apunt || null} />;
}

const xifra = (valor, unitat = '') => (valor === null || valor === undefined ? '—' : `${String(valor).replace('.', ',')}${unitat}`);

export function ResumJornada({ params }) {
  const salut = useSalut();
  const { ruta } = useApp();
  const [error, setError] = useState(null);
  if (!salut.carregat) return null;
  const m = metriquesJornada(params.data, salut.apunts, { persona: salut.persona, jornades: salut.jornades, ofsetDe: salut.ofsetDe });
  const hora = (punt) => `${horaDe(punt.moment)}${punt.estimat ? ' (l’habitual: no s’ha apuntat)' : ''}`;
  const files = [
    ['S’alça', hora(m.limits.alcar)],
    ['S’adorm', hora(m.limits.adormir)],
    ['Vegades que orina de dia', xifra(m.frequenciaDiurna)],
    ['Vegades que orina de nit', xifra(m.nicturia)],
    ['Miccions mesurades', textCobertura(m)],
    ['Orina en 24 h', xifra(m.volum24h, ' ml')],
    ['Orina de nit', xifra(m.volumNocturn, ' ml')],
    ['Part de l’orina feta de nit', xifra(m.indexPoliuriaNocturna, ' %')],
    ['Begut', xifra(m.ingestaTotal, ' ml')],
    ['Escapaments', xifra(m.escapaments)],
    ['Canvis d’absorbent', xifra(m.canvisAbsorbent)],
    ['Deposicions', xifra(m.deposicions)],
    ['Episodis de conducta', xifra(m.episodis)]
  ];
  const marca = (completa) => salut.marcaJornada(params.data, { completa }).then(() => setError(null), (e) => setError(textError(e)));
  return (
    <MarcSalut titol="Resum de la jornada">
      <Pila gap={4}>
        <Interruptor etiqueta="He apuntat tot el dia" actiu={m.completa} desactivat={salut.nomesLectura} onCanvi={marca} />
        {m.motiuSenseVolums ? <Alerta to="info" viva={false}>{`Sense volums ni índexs: ${MOTIUS_SENSE_VOLUMS[m.motiuSenseVolums]}`}</Alerta> : null}
        {error ? <Alerta to="error">{error}</Alerta> : null}
        <Taula titol={`Resum de ${etiquetaDataLlarga(params.data)}`}>
          <tbody>
            {files.map(([nom, valor]) => <tr key={nom}><th scope="row">{nom}</th><td>{valor}</td></tr>)}
          </tbody>
        </Taula>
        <Fila gap={2}>
          <EnllacBoto a={`${ruta('full')}?des=${params.data}&dies=1`}>Veure-ho al full per al metge</EnllacBoto>
          {params.data === salut.avui ? <EnllacBoto a={ruta('diari')}>Apunta</EnllacBoto> : null}
        </Fila>
      </Pila>
    </MarcSalut>
  );
}

/* ── /dies/:data/:apunt ─────────────────────────────────────────────────── */

export function EditorApunt({ params }) {
  const salut = useSalut();
  const navega = useNavegaSalut();
  const [esborrant, setEsborrant] = useState(false);
  const [error, setError] = useState(null);
  if (!salut.carregat) return null;
  const apunt = salut.apunts.find((candidat) => candidat.id === params.apunt);
  if (!apunt) {
    return (
      <MarcSalut titol="Apunt">
        <EstatBuit titol="No trobat">Este apunt no existix o ja s’ha esborrat.</EstatBuit>
      </MarcSalut>
    );
  }
  /* Push, no replace: l'editor s'obri amb un enllaç de la línia del temps (push), i
     reemplaçar-lo deixaria dos entrades iguals del dia. Arrere torna a l'apunt corregit. */
  const torna = () => navega(['dies', params.data]);
  const desa = async (cru) => {
    const resultat = await salut.desaApunt(cru);
    if (resultat.ok) torna();
    return resultat;
  };
  const esborra = async () => {
    try {
      await salut.esborraApunt(apunt.id);
      setEsborrant(false);
      torna();
    } catch (e) {
      setError(textError(e));
    }
  };
  return (
    <MarcSalut titol={`Corregir: ${tipusDe(apunt.tipus).nom}`}>
      <Pila gap={4}>
        <FormulariApunt key={apunt.id} tipus={apunt.tipus} inicial={apunt} onDesa={desa} onCancela={torna}
          accions={<Boto varietat="perill" disabled={salut.nomesLectura} onClick={() => setEsborrant(true)}>Esborra</Boto>} />
        {error ? <Alerta to="error">{error}</Alerta> : null}
      </Pila>
      <DialegConfirmacio obert={esborrant} destructiu titol="Esborrar l’apunt" etiquetaConfirma="Esborra" etiquetaCancela="No l’esborres"
        descripcio={`${resumApunt(apunt)}, a les ${horaDe(apunt.moment)}. No es podrà recuperar si no tens una còpia.`}
        onTanca={() => setEsborrant(false)} onConfirma={esborra} />
    </MarcSalut>
  );
}
