/**
 * Entrevista.jsx — l'entrevista guiada: UNA sola pregunta per torn.
 *
 *   ProgresEntrevista   (mig)    el progrés i les respostes donades, de la casa a G1
 *   PreguntaEntrevista  (detall) la pregunta d'ara (pasActual) i res més
 *
 * L'ordre i les preguntes són del nucli (PASSOS_ENTREVISTA): el malnom de la
 * casa («Els de Ca…»), el mas o el poble, i després G4 → G3 → G2 → G1, amb el
 * cognom matern de cada persona. La validació de les dates i l'aplicació a
 * l'arbre també són del nucli. Cap vincle naix d'un cognom.
 */
import { useEffect, useRef, useState } from 'react';
import {
  Accions, Alerta, Boto, Camp, CampText, Fila, GrupCamps, GrupOpcions, Pila, Progres, Selector, Taula
} from '../../../components/PedraSeca/index.js';
import { useApp } from '../../plataforma/index.js';
import {
  OPCIONS_FONT, PASSOS_ENTREVISTA, PASSOS_G2, VIVA, estatInicialEntrevista, pasActual, progresEntrevista, useGenealogia
} from '../nucli/index.js';
import { textError } from '../textos.js';
import { CampData, EnllacBoto, MarcGenealogia, useIdioma, useT } from './comunes.jsx';

const GENERACIONS_VISIBLES = Object.freeze(['G4', 'G3', 'G2', 'G1']);

/* viva: 'si' | 'no' | 'desconegut' (viu, ha mort o no ho sé). Per defecte, «no ho sé»; per a tu (g4-jo), «viu». */
const PERSONA_BUIDA = Object.freeze({ nom: '', cognom1: '', cognom2: '', naixement: '', lloc: '', ofici: '', viva: 'desconegut', fillDe: '' });

/** El text d'una llengua d'un objecte { ca, es, en, eu, gl }, amb el valencià de reserva. */
export const enLlengua = (textos, idioma) => (textos && typeof textos === 'object' ? textos[idioma] || textos.ca || '' : '');

const nomDeResposta = (resposta) => (resposta && typeof resposta === 'object'
  ? [resposta.nom, resposta.cognom1, resposta.cognom2].filter((part) => typeof part === 'string' && part.trim()).join(' ')
  : '');

/**
 * L'estat de l'entrevista de l'arbre que es mira, o el de partida. Sense cap
 * arbre també es pot començar: la primera resposta en crea un (useGenealogia).
 */
function useEstatEntrevista() {
  const g = useGenealogia();
  return g.complet?.entrevista || estatInicialEntrevista(g.complet?.arbre?.id ?? null);
}

/* Una resposta donada, en una línia. */
function resumResposta(pas, valor, tx) {
  if (valor === undefined || valor === null || valor === '') return null;
  if (pas.tipus === 'opcio') return OPCIONS_FONT.includes(valor) ? tx(`entrevista.font.${valor}`) : String(valor);
  if (Array.isArray(valor)) return valor.map(nomDeResposta).filter(Boolean).join(', ') || tx('entrevista.persones', { n: valor.length });
  if (typeof valor === 'object') return [nomDeResposta(valor), valor.naixement].filter(Boolean).join(' · ');
  return String(valor);
}

export function ProgresEntrevista() {
  const g = useGenealogia();
  const tx = useT();
  const estat = useEstatEntrevista();
  if (!g.carregat) return null;
  const { fet, total } = progresEntrevista(estat);
  /* Al mig només el nom curt de cada pas i la resposta: la pregunta, una sola, és al detall. */
  return (
    <MarcGenealogia titol={tx('entrevista.respostes')} columna="mig">
      <Pila gap={4}>
        <Progres etiqueta={tx('entrevista.progres', { fet: Math.min(fet, total), total })} valor={Math.min(fet, total)} max={total || 1} />
        <Taula titol={`${tx('entrevista.titol')} · ${tx('entrevista.respostes')}`} densa>
          <tbody>
            {PASSOS_ENTREVISTA.map((pas) => {
              const resum = resumResposta(pas, estat.respostes?.[pas.id], tx);
              return (
                <tr key={pas.id}>
                  <th scope="row">{`${GENERACIONS_VISIBLES.includes(pas.generacio) ? `${pas.generacio} · ` : ''}${tx(`pas.${pas.id}`)}`}</th>
                  <td>{resum || tx('entrevista.pendent')}</td>
                </tr>
              );
            })}
          </tbody>
        </Taula>
      </Pila>
    </MarcGenealogia>
  );
}

/* El missatge d'un error del nucli ({ camp, clau }); els codis del magatzem van en majúscules. */
function missatgeError(clau, tx, idioma) {
  if (clau === 'format' || clau === 'rang' || clau === 'data') return tx('error.data');
  if (clau === 'obligatori' || clau === 'sense-progenitor') return tx('error.obligatori');
  if (typeof clau === 'string' && clau !== '' && clau === clau.toUpperCase()) return textError(clau, idioma);
  return tx('error.invalid');
}

/* El valor de partida del formulari: la resposta ja donada (si no és repetible). */
function valorInicial(pas, respostes) {
  const anterior = pas.repetible ? undefined : respostes?.[pas.id];
  if (pas.tipus === 'persona') {
    const donada = anterior && typeof anterior === 'object' && !Array.isArray(anterior) ? anterior : null;
    const { difunta, ...resta } = donada || {};
    /* Una resposta antiga només porta la casella `difunta`. */
    const viva = VIVA.includes(resta.viva) ? resta.viva : (difunta === true ? 'no' : (pas.id === 'g4-jo' ? 'si' : PERSONA_BUIDA.viva));
    return { ...PERSONA_BUIDA, ...resta, viva };
  }
  return typeof anterior === 'string' ? anterior : '';
}

const CAMPS_TEXT_PERSONA = Object.freeze(['nom', 'cognom1', 'cognom2', 'naixement', 'lloc', 'ofici']);
/* Els camps que pinten el seu propi error; la resta va a l'avís general. */
const CAMPS_AMB_ERROR = Object.freeze({ text: ['valor'], opcio: ['valor'], persona: [...CAMPS_TEXT_PERSONA, 'viva', 'fillDe'] });

/*
 * La RespostaPersona del contracte: `fillDe` només al pas G1 i només si s'ha
 * triat. Un formulari de persona sense res escrit és una resposta buida: en un
 * pas opcional (o repetible) el nucli passa al pas següent. La resposta viva
 * sempre té valor (una de les tres), i per això no compta per a dir si és buida.
 */
function respostaPersona(valor, pas) {
  const { fillDe, ...resta } = valor;
  delete resta.difunta;
  if (CAMPS_TEXT_PERSONA.every((camp) => String(resta[camp] || '').trim() === '')) return '';
  return pas.id === 'g1-besavi' && PASSOS_G2.includes(fillDe) ? { ...resta, fillDe } : resta;
}

function FormulariPas({ pas, estat, enfoca = false }) {
  const g = useGenealogia();
  const tx = useT();
  const idioma = useIdioma();
  const [valor, setValor] = useState(() => valorInicial(pas, estat.respostes));
  const [errors, setErrors] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const titol = useRef(null);
  const pregunta = enLlengua(pas.pregunta, idioma);
  const ajuda = enLlengua(pas.ajuda, idioma);
  const exemple = enLlengua(pas.exemple, idioma);
  const posa = (camp, nou) => setValor((abans) => ({ ...abans, [camp]: nou }));
  const afegides = Array.isArray(estat.respostes?.[pas.id]) ? estat.respostes[pas.id] : [];

  /* Una pregunta nova substituïx el formulari i el botó que tenia el focus
     desapareix: el focus va a la pregunta perquè el teclat i el lector de
     pantalla no tornen a <body> (WCAG 2.4.3). No en la primera càrrega. */
  useEffect(() => {
    if (enfoca) titol.current?.focus();
  }, [enfoca]);

  /* Per al pas G1: de quin dels quatre iaios és fill o filla (els ja anomenats). */
  const opcionsFillDe = PASSOS_G2
    .map((id) => ({ valor: id, etiqueta: nomDeResposta(estat.respostes?.[id]) }))
    .filter((opcio) => opcio.etiqueta);
  /* Sense cap iaio anomenat, un besavi no té de qui ser fill: no es pot afegir. */
  const besaviSenseIaios = pas.id === 'g1-besavi' && opcionsFillDe.length === 0;
  /* Els camps que es pinten ara: un error d'un camp que no es veu va a l'avís general. */
  const campsVisibles = pas.tipus === 'persona'
    ? CAMPS_AMB_ERROR.persona.filter((camp) => camp !== 'fillDe' || (pas.id === 'g1-besavi' && opcionsFillDe.length > 0))
    : (CAMPS_AMB_ERROR[pas.tipus] || []);

  const envia = async (event) => {
    event.preventDefault();
    if (besaviSenseIaios) return;
    try {
      const resultat = await g.respon(pas.tipus === 'persona' ? respostaPersona(valor, pas) : valor);
      if (resultat?.ok) return;
      const perCamp = {};
      const generals = [];
      for (const error of resultat?.errors || []) {
        const missatge = missatgeError(error.clau, tx, idioma);
        if (error.camp && campsVisibles.includes(error.camp)) perCamp[error.camp] = missatge;
        else generals.push(missatge);
      }
      setErrors(perCamp);
      setErrorGeneral(generals.length || !Object.keys(perCamp).length ? (generals[0] || tx('error.invalid')) : null);
    } catch (error) {
      setErrorGeneral(textError(error, idioma));
    }
  };
  const fa = (accio) => accio().catch((error) => setErrorGeneral(textError(error, idioma)));

  return (
    <form onSubmit={envia} noValidate aria-label={pregunta}>
      <Pila gap={4}>
        <h3 ref={titol} tabIndex={-1}>{pregunta}</h3>
        {ajuda ? <p>{ajuda}</p> : null}
        {/* L'exemple del nucli ja diu que és inventat. */}
        {exemple ? <p>{exemple}</p> : null}
        {pas.repetible && afegides.length ? (
          <GrupCamps llegenda={tx('entrevista.afegides')}>
            {afegides.map((resposta, i) => (
              <Fila key={`${i}-${nomDeResposta(resposta)}`} gap={2}>
                <span>{[nomDeResposta(resposta), resposta?.naixement].filter(Boolean).join(' · ')}</span>
                <Boto varietat="fantasma" disabled={g.nomesLectura} onClick={() => fa(() => g.treuResposta(pas.id, i))}>{tx('entrevista.lleva')}</Boto>
              </Fila>
            ))}
          </GrupCamps>
        ) : null}
        {pas.tipus === 'text' ? (
          <Camp etiqueta={tx('entrevista.resposta')} error={errors.valor}>
            <CampText maxLength={120} autoComplete="off" value={valor} disabled={g.nomesLectura} onChange={(event) => setValor(event.target.value)} />
          </Camp>
        ) : null}
        {pas.tipus === 'opcio' ? (
          <GrupOpcions llegenda={tx('entrevista.font')} valor={valor} onCanvi={setValor} error={errors.valor} disabled={g.nomesLectura}
            opcions={OPCIONS_FONT.map((opcio) => ({ valor: opcio, etiqueta: tx(`entrevista.font.${opcio}`) }))} />
        ) : null}
        {besaviSenseIaios ? <Alerta to="info" viva={false}>{tx('entrevista.besavi.senseIaios')}</Alerta> : null}
        {pas.tipus === 'persona' && !besaviSenseIaios ? (
          <>
            <Alerta to="info" viva={false}>{tx('entrevista.cognom')}</Alerta>
            <Camp etiqueta={tx('camp.nom')} error={errors.nom}>
              <CampText maxLength={80} autoComplete="off" value={valor.nom} disabled={g.nomesLectura} onChange={(event) => posa('nom', event.target.value)} />
            </Camp>
            <Camp etiqueta={tx('camp.cognom1')} error={errors.cognom1}>
              <CampText maxLength={80} autoComplete="off" value={valor.cognom1} disabled={g.nomesLectura} onChange={(event) => posa('cognom1', event.target.value)} />
            </Camp>
            <Camp etiqueta={tx('camp.cognom2')} error={errors.cognom2}>
              <CampText maxLength={80} autoComplete="off" value={valor.cognom2} disabled={g.nomesLectura} onChange={(event) => posa('cognom2', event.target.value)} />
            </Camp>
            <CampData etiqueta={tx('camp.naixement')} valor={valor.naixement} error={errors.naixement} desactivat={g.nomesLectura}
              onCanvi={(nou) => posa('naixement', nou)} />
            <Camp etiqueta={tx('camp.lloc')} error={errors.lloc}>
              <CampText maxLength={120} autoComplete="off" value={valor.lloc} disabled={g.nomesLectura} onChange={(event) => posa('lloc', event.target.value)} />
            </Camp>
            <Camp etiqueta={tx('camp.ofici')} error={errors.ofici}>
              <CampText maxLength={80} autoComplete="off" value={valor.ofici} disabled={g.nomesLectura} onChange={(event) => posa('ofici', event.target.value)} />
            </Camp>
            {/* Tres respostes, no una casella: «viu» protegix la persona encara que
                va nàixer fa 100 anys o més; «no ho sé» seguix la regla dels 100 anys. */}
            <GrupOpcions llegenda={tx('camp.viva')} valor={valor.viva} onCanvi={(nou) => posa('viva', nou)} error={errors.viva}
              disabled={g.nomesLectura} opcions={VIVA.map((opcio) => ({ valor: opcio, etiqueta: tx(`viva.${opcio}`) }))} />
            {pas.id === 'g1-besavi' && opcionsFillDe.length ? (
              <Camp etiqueta={tx('entrevista.fillDe')} error={errors.fillDe}>
                <Selector value={valor.fillDe || ''} disabled={g.nomesLectura} onChange={(event) => posa('fillDe', event.target.value)}
                  opcions={[{ valor: '', etiqueta: '—' }, ...opcionsFillDe]} />
              </Camp>
            ) : null}
          </>
        ) : null}
        {errorGeneral ? <Alerta to="error">{errorGeneral}</Alerta> : null}
        {/* Un pas repetible (germans, besavis) afig una persona i s'hi queda; «Següent» passa al pas de després. */}
        <Accions>
          {estat.pas > 0 ? <Boto varietat="secundari" disabled={g.nomesLectura} onClick={() => fa(g.enrere)}>{tx('boto.anterior')}</Boto> : null}
          {pas.repetible ? (
            <>
              {besaviSenseIaios ? null : <Boto varietat="secundari" tipus="submit" disabled={g.nomesLectura}>{tx('entrevista.afig')}</Boto>}
              <Boto varietat="primari" disabled={g.nomesLectura} onClick={() => fa(g.salta)}>{tx('boto.seguent')}</Boto>
            </>
          ) : (
            <>
              {pas.opcional ? <Boto varietat="fantasma" disabled={g.nomesLectura} onClick={() => fa(g.salta)}>{tx('boto.salta')}</Boto> : null}
              <Boto varietat="primari" tipus="submit" disabled={g.nomesLectura}>{tx('boto.seguent')}</Boto>
            </>
          )}
        </Accions>
      </Pila>
    </form>
  );
}

export function PreguntaEntrevista() {
  const g = useGenealogia();
  const tx = useT();
  const idioma = useIdioma();
  const { ruta } = useApp();
  const estat = useEstatEntrevista();
  const [error, setError] = useState(null);
  /* La clau del pas que es va pintar l'última vegada: només quan canvia
     (s'ha respost, saltat o tornat arrere) el focus va a la pregunta nova. */
  const clauAnterior = useRef(null);
  const pas = g.carregat ? pasActual(estat) : null;
  const repetides = pas && Array.isArray(estat.respostes?.[pas.id]) ? estat.respostes[pas.id].length : 0;
  const clau = pas ? `${pas.id}-${estat.pas}-${repetides}` : null;
  const enfoca = clau !== null && clauAnterior.current !== null && clauAnterior.current !== clau;
  useEffect(() => {
    if (clau !== null) clauAnterior.current = clau;
  }, [clau]);
  if (!g.carregat) return null;
  const fa = (accio) => accio().then(() => setError(null), (e) => setError(textError(e, idioma)));
  if (!pas) {
    return (
      <MarcGenealogia titol={tx('entrevista.titol')}>
        <Pila gap={4}>
          <Alerta to="exit" viva={false} titol={tx('entrevista.acabada')}>{tx('entrevista.acabada.text')}</Alerta>
          {estat.respostes?.font === 'document' ? (
            <Alerta to="info" viva={false}>{tx('entrevista.acabada.document')}</Alerta>
          ) : null}
          {error ? <Alerta to="error">{error}</Alerta> : null}
          <Accions>
            <EnllacBoto a={ruta('arbre')}>{tx('entrevista.veuArbre')}</EnllacBoto>
            {estat.respostes?.font === 'document' ? <EnllacBoto a={ruta('persones')}>{tx('entrevista.acabada.persones')}</EnllacBoto> : null}
            <Boto varietat="secundari" disabled={g.nomesLectura} onClick={() => fa(g.enrere)}>{tx('boto.anterior')}</Boto>
            <Boto varietat="fantasma" disabled={g.nomesLectura} onClick={() => fa(g.reiniciaEntrevista)}>{tx('entrevista.reinicia')}</Boto>
          </Accions>
        </Pila>
      </MarcGenealogia>
    );
  }
  const { fet, total } = progresEntrevista(estat);
  return (
    <MarcGenealogia titol={tx('entrevista.titol')}>
      <Pila gap={4}>
        <p>{tx('entrevista.progres', { fet: Math.min(fet + 1, total), total })}</p>
        <p>{tx('entrevista.regla')}</p>
        {/* Una sola pregunta: la clau fa un formulari net a cada pas (i a cada repetició). */}
        <FormulariPas key={clau} pas={pas} estat={estat} enfoca={enfoca} />
      </Pila>
    </MarcGenealogia>
  );
}
