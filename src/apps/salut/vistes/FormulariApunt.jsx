/**
 * FormulariApunt.jsx — el formulari d'un apunt, generat a partir del
 * diccionari (Camp, GrupOpcions, Casella de Pedra Seca). L'hora ja ve posada
 * i els valors per defecte, també: un apunt habitual es fa en dos tocs (el
 * botó del tipus i «Desa»).
 *
 * La conducta, en un apunt nou, va en tres passos que es reflectixen a l'URL
 * (?pas=a|b|c): què ha fet, què passava abans, i què hem fet i com ha acabat.
 * Si un valor és possible però poc versemblant (més de 800 ml d'una vegada),
 * es demana revisar-lo abans de desar-lo.
 */
import { useState } from 'react';
import {
  Alerta, Boto, Camp, CampText, Fila, Pila
} from '../../../components/PedraSeca/index.js';
import { CAMPS_COMUNS, campActiu, llegixDecimes, tipusDe, validaApunt, valorsPerDefecte } from '../nucli/diccionari.js';
import { dataDe, horaDe, momentDe } from '../nucli/hores.js';
import { textError } from '../textos.js';
import { useSalut } from '../useSalut.jsx';
import { ControlCamp } from './comunes.jsx';

export const PASSOS_CONDUCTA = Object.freeze(['a', 'b', 'c']);
const TITOL_PAS = Object.freeze({ a: 'Què ha fet', b: 'Què passava abans', c: 'Què hem fet i com ha acabat' });
const CAMP_NOTA = CAMPS_COMUNS.find((c) => c.clau === 'nota');

function valorsInicials(tipus, inicial, ara) {
  const moment = inicial?.moment || ara.moment;
  const valors = { data: dataDe(moment), hora: horaDe(moment), ...valorsPerDefecte(tipus) };
  for (const c of [...(tipusDe(tipus)?.camps || []), CAMP_NOTA]) {
    if (inicial && inicial[c.clau] !== undefined) valors[c.clau] = inicial[c.clau];
  }
  return valors;
}

/* Els valors del formulari com a apunt: els nombres escrits passen a nombre. */
function aApunt(tipus, valors, inicial, ofsetDe) {
  const moment = momentDe(valors.data, valors.hora);
  const apunt = {
    ...(inicial ? { id: inicial.id, creat: inicial.creat } : {}),
    tipus,
    moment,
    ofsetMin: inicial && inicial.moment === moment ? inicial.ofsetMin : ofsetDe(moment)
  };
  for (const c of [...tipusDe(tipus).camps, CAMP_NOTA]) {
    let valor = valors[c.clau];
    if (typeof valor === 'string') valor = valor.trim();
    if (valor === '') valor = undefined;
    else if (c.tipus === 'decimes' && typeof valor === 'string') valor = llegixDecimes(valor) ?? valor;
    apunt[c.clau] = valor;
  }
  return apunt;
}

/**
 * `pas` i `onPas(pas)`: el pas de la conducta (de l'URL); sense, tot en una pàgina.
 * `onDesa(apunt)` → { ok, errors } (useSalut().desaApunt). `accions`: botons de més (Esborra).
 */
export function FormulariApunt({ tipus, inicial = null, pas = null, onPas, onDesa, onCancela, accions = null }) {
  const salut = useSalut();
  const definicio = tipusDe(tipus);
  const [valors, setValors] = useState(() => valorsInicials(tipus, inicial, salut.ara()));
  const [errors, setErrors] = useState({});
  const [avisos, setAvisos] = useState({});
  const [errorDesat, setErrorDesat] = useState(null);
  const [desant, setDesant] = useState(false);
  const ambPassos = Boolean(pas) && tipus === 'conducta';

  const posa = (clau, valor) => {
    setAvisos({});
    setValors((abans) => {
      const nou = { ...abans, [clau]: valor };
      /* Escriure un volum vol dir que s'ha mesurat; esborrar-lo, que no. */
      if (tipus === 'miccio' && clau === 'volumMl') {
        if (String(valor).trim() !== '' && abans.mesura === 'no-mesurat') nou.mesura = 'mesurat';
        if (String(valor).trim() === '' && abans.mesura !== 'no-mesurat') nou.mesura = 'no-mesurat';
      }
      return nou;
    });
  };

  const apunt = aApunt(tipus, valors, inicial, salut.ofsetDe);
  const campsDelPas = (p) => definicio.camps.filter((c) => !ambPassos || c.pas === p);
  const visibles = campsDelPas(pas).filter((c) => campActiu(c, apunt));
  const primerPas = !ambPassos || pas === PASSOS_CONDUCTA[0];
  const darrerPas = !ambPassos || pas === PASSOS_CONDUCTA[PASSOS_CONDUCTA.length - 1];
  const clausDelPas = (p) => [...campsDelPas(p).map((c) => c.clau), ...(p === PASSOS_CONDUCTA[0] ? ['moment', 'ofsetMin'] : []),
    ...(p === PASSOS_CONDUCTA[PASSOS_CONDUCTA.length - 1] ? ['nota'] : [])];

  const seguent = () => {
    const { errors: tots } = validaApunt(apunt);
    const delPas = Object.fromEntries(Object.entries(tots).filter(([clau]) => clausDelPas(pas).includes(clau)));
    setErrors(delPas);
    if (Object.keys(delPas).length === 0) onPas?.(PASSOS_CONDUCTA[PASSOS_CONDUCTA.indexOf(pas) + 1]);
  };

  const desa = async (event) => {
    event.preventDefault();
    if (!darrerPas) {
      seguent();
      return;
    }
    const validacio = validaApunt(apunt);
    setErrors(validacio.errors);
    if (!validacio.ok) {
      const ambError = ambPassos ? PASSOS_CONDUCTA.find((p) => clausDelPas(p).some((clau) => validacio.errors[clau])) : null;
      if (ambError && ambError !== pas) onPas?.(ambError);
      return;
    }
    /* Un valor poc versemblant es mostra una vegada: el segon «Desa» el desa igual. */
    if (Object.keys(validacio.avisos).length && Object.keys(avisos).length === 0) {
      setAvisos(validacio.avisos);
      return;
    }
    setDesant(true);
    setErrorDesat(null);
    try {
      const resultat = await onDesa(apunt);
      if (resultat && resultat.ok === false) setErrors(resultat.errors);
    } catch (error) {
      setErrorDesat(textError(error));
    } finally {
      setDesant(false);
    }
  };

  const errorMoment = errors.moment || errors.ofsetMin;
  return (
    <form onSubmit={desa} noValidate aria-label={definicio.nom}>
      <Pila gap={4}>
        {ambPassos ? <p>{`Pas ${PASSOS_CONDUCTA.indexOf(pas) + 1} de ${PASSOS_CONDUCTA.length} · ${TITOL_PAS[pas]}`}</p> : null}
        {salut.nomesLectura ? <Alerta to="avis" titol="Només per a mirar">Una altra pestanya està apuntant: ací no es pot desar.</Alerta> : null}
        {primerPas ? (
          <Fila gap={4} align="flex-start">
            <Camp etiqueta="Dia" error={errorMoment}>
              <CampText tipus="date" value={valors.data} onChange={(event) => posa('data', event.target.value)} />
            </Camp>
            <Camp etiqueta="Hora">
              <CampText tipus="time" value={valors.hora} onChange={(event) => posa('hora', event.target.value)} />
            </Camp>
          </Fila>
        ) : null}
        {visibles.map((c) => (
          <ControlCamp key={c.clau} definicio={c} valor={valors[c.clau]} error={errors[c.clau]} onCanvi={(valor) => posa(c.clau, valor)} />
        ))}
        {darrerPas ? <ControlCamp definicio={CAMP_NOTA} valor={valors.nota} error={errors.nota} onCanvi={(valor) => posa('nota', valor)} /> : null}
        {Object.keys(avisos).length ? (
          <Alerta to="avis" titol="Revisa-ho abans de desar">
            {Object.values(avisos).join(' ')} Si és correcte, torna a prémer «Desa».
          </Alerta>
        ) : null}
        {errorDesat ? <Alerta to="error">{errorDesat}</Alerta> : null}
        <Fila gap={2}>
          {ambPassos && !primerPas ? (
            <Boto varietat="secundari" onClick={() => onPas?.(PASSOS_CONDUCTA[PASSOS_CONDUCTA.indexOf(pas) - 1])}>Arrere</Boto>
          ) : null}
          <Boto varietat="primari" mida="gran" tipus="submit" carregant={desant} disabled={salut.nomesLectura}>
            {darrerPas ? 'Desa' : 'Següent'}
          </Boto>
          {onCancela ? <Boto varietat="fantasma" onClick={onCancela}>Cancel·la</Boto> : null}
          {accions}
        </Fila>
      </Pila>
    </form>
  );
}
