/**
 * PrevisualitzacioExtern.jsx · Correcció T7C-R3 · La composició única d'un
 * contingut de fora (una web) abans de desar-lo com una nota teua. Peces que
 * ja hi havia, en l'ordre de sempre i amb les classes del bloc T43 de
 * modules.css:
 *
 *   · l'avís del Mode Foraster: sense sessió, on es queda l'enllaç o que cal
 *     entrar (`calEntrar`, la regla D1 de contingutExtern.reglaDEntrada);
 *   · l'objecte: la UniversalCard del contingut de fora (P6), el lloc i
 *     l'adreça (com a text, mai com a enllaç);
 *   · els motius, si l'enllaç no val;
 *   · el que es tria abans de desar (`children`), només amb un enllaç vàlid;
 *   · el peu: un avís propi (`avisPeu`), l'error de desar, el botó i la nota.
 *
 * Els textos diuen el verb de cada porta: `verb` («desar», «connectar») i
 * `participi` («desat», «connectat»). `avisEntrar` substituïx la frase de
 * «cal entrar» quan la porta ha d'explicar on s'aterra després.
 *
 * El munta el Snippet Curador (SnippetCurador.jsx). /connectar?url=
 * (ConnectarContingutExtern, fora del T7C) encara en porta una còpia: la
 * sinergia pendent és que el munte, o que redirigisca al snippet.
 */
import { useId } from 'react';
import { Globe } from 'lucide-react';
import { Alerta, Boto, UniversalCard } from '../../components/PedraSeca/index.js';

const CAP = Object.freeze([]);

/**
 * `contingut`: el de contingutExternDeParams (null, { ok: false, errors } o
 * { ok: true, valor }). `boto`: { etiqueta, onClick, carregant, disabled,
 * gran } (`gran`: el de bancal, mida gran i ple, com a /connectar).
 */
export function PrevisualitzacioExtern({
  contingut = null, teSessio = false, calEntrar = false, verb, participi, avisEntrar,
  boto = {}, nota, error = null, avisPeu = null, children = null
}) {
  const id = useId();
  const valor = contingut?.ok ? contingut.valor : null;
  const motius = contingut && !contingut.ok ? Object.values(contingut.errors) : CAP;
  const ambPeu = Boolean(valor || avisPeu || error);

  return (
    <div className="sdp-connectar">
      {!teSessio ? (
        <Alerta to="avis" titol="Mode Foraster actiu">
          {calEntrar
            ? (avisEntrar || `Per a ${verb} cal entrar al teu compte.`)
            : 'Sense sessió, l’enllaç es queda només en este dispositiu.'}
        </Alerta>
      ) : null}

      <section className="sdp-connectar__objecte" aria-labelledby={`${id}-objecte`}>
        <p className="sdp-connectar__tipus">Enllaç de fora de Sóc de Poble</p>
        {valor ? (
          <>
            <div id={`${id}-objecte`} className="sdp-connectar__previsualitzacio">
              <UniversalCard
                title={valor.titol}
                subtitle={valor.subtitol || undefined}
                body={valor.entradilla || undefined}
                icon={<Globe size={32} aria-hidden="true" focusable="false" />}
                hasFooter={false}
                onDateTime={false}
                showDateTime={false}
              />
            </div>
            <p className="sdp-connectar__autor">{`De ${valor.lloc}`}</p>
            <p className="sdp-connectar__identitat">{valor.url}</p>
          </>
        ) : (
          <p id={`${id}-objecte`} className="sdp-connectar__autor">
            {contingut ? `Este enllaç no es pot ${verb}.` : `No ha arribat cap enllaç per a ${verb}.`}
          </p>
        )}
      </section>

      {motius.length ? (
        <Alerta to="error" titol={`Este enllaç no es pot ${verb}`}>{motius.join(' ')}</Alerta>
      ) : null}

      {valor ? children : null}

      {ambPeu ? (
        <div className="sdp-connectar__peu">
          {avisPeu}
          {error ? <Alerta to="error" titol={`L’enllaç no s’ha ${participi}`}>{error}</Alerta> : null}
          {valor ? (
            <>
              <Boto
                varietat="primari"
                mida={boto.gran ? 'gran' : undefined}
                ple={Boolean(boto.gran)}
                onClick={boto.onClick}
                carregant={boto.carregant}
                disabled={boto.disabled}
              >
                {boto.etiqueta}
              </Boto>
              <p className="sdp-connectar__nota">{nota}</p>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default PrevisualitzacioExtern;
