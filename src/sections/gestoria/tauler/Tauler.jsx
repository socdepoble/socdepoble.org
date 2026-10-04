/**
 * Tauler.jsx — el Tauler Central de la Gestoria i les seues pàgines.
 *
 * Ordre del Mestre, 261004 (onada 2, pas 1 del MAPA; principi 3 de la
 * Gestoria): el Tauler és fet de TargetaTauler (UniversalCard) en blocs:
 *   · VistaTauler · «La teua realitat» (Caixa real, Hisenda, Cobertura) i
 *     «Finances (últims 30 dies)» (Factures i vendes, Ingressos, Despeses,
 *     Rendiment);
 *   · VistaBancs · «Bancs i Tresoreria»: una targeta per compte i la de la
 *     conciliació;
 *   · VistaImpostos · les estimacions del 303 i del 130.
 * Tota targeta té la seua pàgina pròpia (PaginaTargeta, feta amb PaginaApp,
 * que porta la barra taronja amb la boina personal) i tota pàgina, la seua
 * targeta: la targeta i la pàgina lligen el mateix model
 * (nucli/targetesTauler.js).
 *
 * PortaTauler · la porta del tractor 'gestoria.tauler': sense la signatura
 * del Mestre, l'estat honest «Cal aprovar el tractor» i el camí al panell de
 * Tractors; amb ella, el selector dels extractes. Cap xifra es pinta fins que
 * la persona prem l'ull (a la targeta o a la boina de la pàgina).
 */
import { useId } from 'react';
import { Construction, EyeOff, FileSearch } from 'lucide-react';
import { Boto } from '../../../components/PedraSeca/atoms/Boto.jsx';
import { Carregant, EstatBuit } from '../../../components/PedraSeca/atoms/estats.jsx';
import { Alerta } from '../../../components/PedraSeca/molecules/Alerta.jsx';
import { Camp, CampText } from '../../../components/PedraSeca/organismes/formulari.jsx';
import { PaginaApp } from '../../../components/PedraSeca/organismes/PaginaApp.jsx';
import { Taula } from '../../../components/PedraSeca/organismes/Taula.jsx';
import { BLOCS_TAULER, textAmagat, textXifra } from './nucli/targetesTauler.js';
import { ACCEPTA_TAULER } from './nucli/tractorTauler.js';
import { TargetaTauler } from './TargetaTauler.jsx';

/* Com diu la porta l'estat del tractor, quan no està aprovat. */
const ESTATS_TRACTOR = Object.freeze({
  pendent: 'encara no està aprovat',
  caducat: 'té l’aprovació caducada',
  revocat: 'té l’aprovació revocada',
  'empremta-divergent': 'ha canviat des que el vas aprovar',
  incomplet: 'no té tots els fitxers declarats',
  error: 'no s’ha pogut comprovar'
});

/** La xifra d'una pàgina: el text, o «Import amagat» mentre l'ull està tancat. */
export function Xifra({ xifra, visible = false }) {
  if (!xifra) return <span>Sense dades</span>;
  if (!visible) {
    return (
      <span className="sdp-gestoria-tauler__amagat">
        <EyeOff size={20} aria-hidden="true" focusable="false" />
        <span>{textAmagat(xifra)}</span>
      </span>
    );
  }
  return <span>{textXifra(xifra)}</span>;
}

/**
 * Un bloc del Tauler: el títol i la graella de targetes. La clau de cada
 * targeta porta l'ull de la closca i la `generacio` de la lectura: quan
 * canvia l'una o l'altra, la targeta torna a nàixer amb l'ull de la closca, i
 * l'ull que s'havia obert en una targeta no passa a la lectura següent.
 */
export function BlocTargetes({ titol, targetes, titular, pastilla, visible, generacio = 0, onObri, onAvis }) {
  const id = useId();
  if (!targetes.length) return null;
  return (
    <section className="sdp-gestoria-tauler__bloc" aria-labelledby={id}>
      <h2 id={id} className="sdp-gestoria-tauler__titol">{titol}</h2>
      <div className="sdp-card-grid sdp-gestoria-tauler__graella">
        {targetes.map((t) => (
          <TargetaTauler key={`${t.id}-${visible ? 'mostrades' : 'amagades'}-${generacio}`} targeta={t} titular={titular} pastilla={pastilla}
            visibleInicial={visible} onObri={onObri} onAvis={onAvis} />
        ))}
      </div>
    </section>
  );
}

/**
 * La porta del tractor del Tauler.
 * @param {{ tauler: object, onObreTractors: () => void, onOblida?: () => void }} p `tauler`: el de useTauler;
 *   `onOblida`: el que fa «Oblida les dades» (la closca hi tanca també l'ull); sense, tauler.oblida
 */
export function PortaTauler({ tauler, onObreTractors, onOblida }) {
  const { porta, fila, aprovat, llegint, error, lectura } = tauler;
  if (porta.carregant) return <Carregant etiqueta="Llegint les aprovacions dels tractors…" />;
  if (!aprovat) {
    const estat = ESTATS_TRACTOR[fila?.estat] ?? ESTATS_TRACTOR.pendent;
    return (
      <Alerta to="avis" titol="Cal aprovar el tractor"
        accions={<Boto varietat="primari" onClick={onObreTractors}>Obri el panell de Tractors</Boto>}>
        {`El Tauler llig els extractes del banc amb el tractor «Gestoria · Tauler de l’empresa», que ${estat}. `}
        {'Aprova’l amb la teua signatura al panell de Tractors: sense, cap fitxer es llig i el Tauler no té xifres.'}
        {porta.error ? ` ${porta.error}` : ''}
      </Alerta>
    );
  }
  return (
    <div className="sdp-gestoria-tauler__porta">
      <Camp etiqueta="Tria els extractes del banc"
        ajuda="Norma 43 o el CSV de moviments i, si vols, la configuració de l’empresa (.json) per a la teua boina. Res es puja enlloc.">
        <CampText tipus="file" multiple accept={ACCEPTA_TAULER} disabled={llegint}
          onChange={(event) => tauler.llig(Array.from(event.target.files ?? []))} />
      </Camp>
      {llegint ? <Carregant etiqueta="Llegint els extractes…" /> : null}
      {error ? <Alerta to="error" titol="No s’han pogut llegir els extractes">{error}</Alerta> : null}
      {lectura?.avisos?.length ? (
        <Alerta to="avis" titol="Hi ha fitxers que no s’han llegit">
          <ul className="sdp-gestoria-tauler__avisos">
            {lectura.avisos.map((a, i) => <li key={`${a.codi}-${i}`}>{a.missatge}</li>)}
          </ul>
        </Alerta>
      ) : null}
      {lectura ? (
        <Boto varietat="secundari" onClick={onOblida ?? tauler.oblida}>Oblida les dades</Boto>
      ) : null}
    </div>
  );
}

/* Els avisos dels comptes (extractes que es solapen, files del CSV sense parella). */
function AvisosComptes({ avisos }) {
  const delsComptes = avisos.filter((a) => !a.fitxer);
  if (!delsComptes.length) return null;
  return (
    <Alerta to="info" titol="Notes de la lectura">
      <ul className="sdp-gestoria-tauler__avisos">
        {delsComptes.map((a, i) => <li key={`${a.codi}-${i}`}>{a.missatge}</li>)}
      </ul>
    </Alerta>
  );
}

const delBloc = (dades, bloc) => dades.targetes.filter((t) => t.bloc === bloc);

/** El Tauler d'Inici: «La teua realitat» i «Finances (últims 30 dies)». */
export function VistaTauler({ dades, comuns }) {
  return (
    <>
      <AvisosComptes avisos={dades.avisos} />
      <BlocTargetes titol={BLOCS_TAULER.realitat} targetes={delBloc(dades, 'realitat')} {...comuns} />
      <BlocTargetes titol={BLOCS_TAULER.finances} targetes={delBloc(dades, 'finances')} {...comuns} />
    </>
  );
}

/** Bancs i Tresoreria: una targeta per compte i la de la conciliació. */
export function VistaBancs({ dades, comuns }) {
  return (
    <>
      <AvisosComptes avisos={dades.avisos} />
      {dades.comptes.length ? null : (
        <EstatBuit icona={FileSearch} titol="Encara no hi ha cap compte">
          Tria els extractes del banc: cada compte hi tindrà la seua targeta, amb el saldo i el que hi ha entrat i eixit.
        </EstatBuit>
      )}
      <BlocTargetes titol={BLOCS_TAULER.bancs} targetes={delBloc(dades, 'bancs')} {...comuns} />
    </>
  );
}

/** Impostos: les estimacions del 303 i del 130 del trimestre. */
export function VistaImpostos({ dades, comuns }) {
  return <BlocTargetes titol={BLOCS_TAULER.impostos} targetes={delBloc(dades, 'impostos')} {...comuns} />;
}

/**
 * La pàgina pròpia d'una targeta: PaginaApp amb la boina personal (la barra
 * taronja amb l'ull de la pàgina), el mateix títol, subtítol i entradeta, la
 * xifra, el detall i d'on ix. Sense Compartir, Comentar ni Connectar.
 */
export function PaginaTargeta({ targeta, titular, pastilla, visible = false, barActions, onTorna, refTitol }) {
  const id = useId();
  return (
    <PaginaApp title={targeta.titol} subtitle={targeta.subtitol} lead={targeta.entradeta}
      author={titular} {...(pastilla ?? {})} barActions={barActions} labels={targeta.etiquetes}
      onBack={onTorna} refTitol={refTitol} showComment={false} showShare={false} showConnect={false}>
      <section className="sdp-gestoria-tauler__seccio" aria-labelledby={`${id}-xifra`}>
        <h2 id={`${id}-xifra`}>La xifra</h2>
        <p className="sdp-gestoria-tauler__xifra"><Xifra xifra={targeta.xifra} visible={visible} /></p>
        {targeta.xifra ? null : <p>{targeta.senseXifra}</p>}
      </section>
      {targeta.detall.length ? (
        <Taula titol={`El detall de ${targeta.titol}`} densa>
          <thead>
            <tr><th scope="col">Concepte</th><th scope="col">Xifra</th></tr>
          </thead>
          <tbody>
            {targeta.detall.map((fila) => (
              <tr key={fila.etiqueta}>
                <th scope="row">{fila.etiqueta}</th>
                <td><Xifra xifra={fila.xifra} visible={visible} /></td>
              </tr>
            ))}
          </tbody>
        </Taula>
      ) : null}
      {targeta.notes.length ? (
        <ul className="sdp-gestoria-tauler__notes">
          {targeta.notes.map((nota) => <li key={nota}>{nota}</li>)}
        </ul>
      ) : null}
      <section className="sdp-gestoria-tauler__seccio" aria-labelledby={`${id}-font`}>
        <h2 id={`${id}-font`}>D’on ix</h2>
        <p>{targeta.font}</p>
      </section>
    </PaginaApp>
  );
}

/** La pàgina d'un mòdul que encara no existix: «en obres», honest. */
export function ModulEnObres({ modul }) {
  return (
    <EstatBuit icona={Construction} titol="En obres">
      {modul.explica}
    </EstatBuit>
  );
}
