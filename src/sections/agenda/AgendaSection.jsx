/**
 * AgendaSection.jsx — Fase 5 · Agenda del poble (origen: Sollutia).
 *
 * FRONTERA: aquesta secció no importa cap adaptador (tractor-adaptadors F1).
 * Només demana la capacitat 'agenda' al port. El backend de SdP resol la
 * crida a Sollutia via la Frontissa: només GET, token de la sessió, resposta
 * traduïda a ActeDTO i congelada.
 *
 * FALLADA TANCADA: sense capacitat, amb error de xarxa o amb una forma
 * inesperada, la interfície mostra l'Alerta. Mai mitja agenda.
 *
 * LAYOUT: només primitives de Pedra Seca. Cap classe ni CSS propi.
 */
import { useEffect, useMemo, useState } from 'react';
import { loadActesAgenda, teCapacitat } from '../../data/backendPort.js';
import {
  Pila, Fila, Graella, Superficie,
  Boto, Botonera, Alerta, Targeta, EstatBuit, Esquelet,
} from '../../components/PedraSeca/index.js';

const VISTES = Object.freeze({ setmana: 'setmana', mes: 'mes' });

const fmtMes = new Intl.DateTimeFormat('ca', { month: 'long', year: 'numeric' });
const fmtDia = new Intl.DateTimeFormat('ca', { day: 'numeric', month: 'short' });
const fmtActe = new Intl.DateTimeFormat('ca', {
  weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
});

function iniciDelDia(data) {
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Rang semiobert [desde, fins). La setmana comença en dilluns. */
export function calculaRang(referencia, vista) {
  const ref = iniciDelDia(referencia);
  if (vista === VISTES.mes) {
    return {
      desde: new Date(ref.getFullYear(), ref.getMonth(), 1),
      fins: new Date(ref.getFullYear(), ref.getMonth() + 1, 1),
    };
  }
  const desde = new Date(ref);
  desde.setDate(ref.getDate() - ((ref.getDay() + 6) % 7));
  const fins = new Date(desde);
  fins.setDate(desde.getDate() + 7);
  return { desde, fins };
}

function mou(referencia, vista, passos) {
  const d = new Date(referencia);
  if (vista === VISTES.mes) {
    d.setDate(1); // evita el salt del 31 al mes següent
    d.setMonth(d.getMonth() + passos);
  } else {
    d.setDate(d.getDate() + passos * 7);
  }
  return d;
}

function titolDelRang({ desde, fins }, vista) {
  if (vista === VISTES.mes) return fmtMes.format(desde);
  const ultim = new Date(fins);
  ultim.setDate(fins.getDate() - 1);
  return `${fmtDia.format(desde)} – ${fmtDia.format(ultim)}`;
}

function formataActe(acte) {
  const inici = Date.parse(acte.inici);
  return Number.isNaN(inici) ? '' : fmtActe.format(inici);
}

export default function AgendaSection() {
  const [vista, setVista] = useState(VISTES.setmana);
  const [referencia, setReferencia] = useState(() => new Date());
  const [estat, setEstat] = useState({ fase: 'carregant', actes: [] });
  const [intent, setIntent] = useState(0);

  const rang = useMemo(() => calculaRang(referencia, vista), [referencia, vista]);
  const esMes = vista === VISTES.mes;

  useEffect(() => {
    // Fallada tancada 1: sense capacitat declarada al contracte, no hi ha agenda.
    if (!teCapacitat('agenda')) {
      setEstat({ fase: 'error', actes: [] });
      return undefined;
    }

    const control = new AbortController();
    setEstat({ fase: 'carregant', actes: [] });

    // Promise.resolve().then(...) captura també els errors síncrons del backend.
    Promise.resolve()
      .then(() => loadActesAgenda(
        { desde: rang.desde.toISOString(), fins: rang.fins.toISOString() },
        { signal: control.signal },
      ))
      .then((actes) => {
        if (control.signal.aborted) return;
        // Fallada tancada 2: una forma inesperada és «no disponible».
        if (!Array.isArray(actes)) throw new Error('Resposta d\'agenda no vàlida.');
        setEstat({ fase: 'llest', actes });
      })
      .catch((error) => {
        if (control.signal.aborted) return; // canvi de rang o desmuntatge: no és un error
        console.warn('[agenda] Sollutia no disponible:', error?.message);
        setEstat({ fase: 'error', actes: [] });
      });

    return () => control.abort();
  }, [rang, intent]);

  const actesOrdenats = useMemo(
    () => [...estat.actes].sort((a, b) => Date.parse(a.inici) - Date.parse(b.inici)),
    [estat.actes],
  );

  return (
    <Pila as="section" aria-labelledby="agenda-titol" aria-busy={estat.fase === 'carregant'}>
      <Superficie>
        <Fila>
          <h2 id="agenda-titol">Agenda del poble · {titolDelRang(rang, vista)}</h2>

          <Botonera etiqueta="Navegació de l'agenda">
            <Boto varietat="secundari" onClick={() => setReferencia((r) => mou(r, vista, -1))}>
              {esMes ? 'Mes anterior' : 'Setmana anterior'}
            </Boto>
            <Boto varietat="fantasma" onClick={() => setReferencia(new Date())}>
              Hui
            </Boto>
            <Boto varietat="secundari" onClick={() => setReferencia((r) => mou(r, vista, 1))}>
              {esMes ? 'Mes següent' : 'Setmana següent'}
            </Boto>
          </Botonera>

          <Botonera etiqueta="Vista de l'agenda">
            <Boto
              varietat={esMes ? 'secundari' : 'primari'}
              aria-pressed={!esMes}
              onClick={() => setVista(VISTES.setmana)}
            >
              Setmana
            </Boto>
            <Boto
              varietat={esMes ? 'primari' : 'secundari'}
              aria-pressed={esMes}
              onClick={() => setVista(VISTES.mes)}
            >
              Mes
            </Boto>
          </Botonera>
        </Fila>
      </Superficie>

      {estat.fase === 'error' && (
        <Alerta to="error" titol="L'agenda no està disponible">
          <Pila>
            <p>
              Ara mateix no podem consultar els actes del poble. Les dades no s'han
              mostrat per no ensenyar-te informació incompleta.
            </p>
            <Fila>
              <Boto varietat="secundari" onClick={() => setIntent((i) => i + 1)}>
                Torna a provar
              </Boto>
            </Fila>
          </Pila>
        </Alerta>
      )}

      {estat.fase === 'carregant' && (
        <Esquelet etiqueta="Carregant l'agenda" />
      )}

      {estat.fase === 'llest' && actesOrdenats.length === 0 && (
        <EstatBuit
          titol={esMes ? 'Cap acte este mes' : 'Cap acte esta setmana'}
          accio={(
            <Boto varietat="secundari" onClick={() => setReferencia((r) => mou(r, vista, 1))}>
              {esMes ? 'Mira el mes següent' : 'Mira la setmana següent'}
            </Boto>
          )}
        />
      )}

      {estat.fase === 'llest' && actesOrdenats.length > 0 && (
        <Graella as="ul" aria-label="Actes del període">
          {actesOrdenats.map((acte) => (
            <li key={acte.id}>
              <Targeta
                title={acte.titol}
                subtitle={formataActe(acte)}
                body={acte.lloc || undefined}
              />
            </li>
          ))}
        </Graella>
      )}
    </Pila>
  );
}
