import { Component, createRef } from 'react';
/* v1.2.24 · costura R32.75 · La llengua de l'avís ve d'UIContext.jsx, no d'objectesDeContext.js: la regla de
   propietaris (src/app/contexts/objectesDeContext.test.jsx) diu que només l'importen els .jsx del seu context.
   La barrera continua sent una classe (React no té barreres d'error en funció); RouteErrorBoundary és ara la funció
   que llig la llengua i li la passa per `idioma`, com useLlenguaDeLaUI del Perfil. */
import { useUIStateOpcional } from './contexts/UIContext.jsx';
import { esErrorLazy, esFalladaDeTransport } from '../apps/plataforma/lazyRoute.js';
import { esAmaDelDocument } from '../apps/plataforma/interruptors.js';
import { registraIncident } from '../utils/autocuracio.js';

const CA = Object.freeze({
  titol: 'Hi ha hagut un problema',
  subtitolGeneral: 'Aquesta secció no ha pogut carregar-se correctament.',
  avisMemoria: 'Recarregar reinicia l’aplicació i descarta les dades que només viuen a la memòria. Desa o exporta el que necessites abans.',
  avisAllotjada: 'Torna a obrir el mòdul des de la pàgina que l’allotja.',
  avisSenseConnexio: 'Recupera la connexió abans de tornar a carregar.',
  botoRecarrega: 'Recarrega l’aplicació',
  vistaContinuaFallant: 'La vista continua fallant. Pots obrir una altra secció amb el menú.',
  botoReintent: 'Intentar de nou',
});

let mod = null;
let prom = null;
export function precarregaRecuperacioRuta() {
  prom ||= import('./i18nRecuperacioRuta.jsx')
    .then((m) => (mod = m))
    .catch(() => (prom = null));
  return prom;
}

/** Sole recovery owner for route imports, including failures inside slots. */
class BarreraDeRuta extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, resetKey: props.resetKey, reintents: 0 };
    this.titolRef = createRef();
    this.reintentRef = createRef();
    let viu = false;
    let rellotge = null;
    const refresca = () => { if (viu && this.state.error) this.forceUpdate(); };
    const xarxa = () => { if (this.props.enLinia === undefined) refresca(); };
    this.carrega = () => { if (!mod) precarregaRecuperacioRuta().then(refresca); };
    this.componentDidMount = () => {
      viu = true;
      window.addEventListener?.('online', xarxa);
      window.addEventListener?.('offline', xarxa);
      if (this.state.error) this.carrega();
      else if (!mod) { rellotge = setTimeout(() => { if (viu) precarregaRecuperacioRuta(); }, 1500); rellotge?.unref?.(); }
    };
    this.componentWillUnmount = () => {
      viu = false;
      clearTimeout(rellotge);
      window.removeEventListener?.('online', xarxa);
      window.removeEventListener?.('offline', xarxa);
    };
  }
  static getDerivedStateFromError(error) { return { error }; }
  static getDerivedStateFromProps(props, state) {
    return props.resetKey !== state.resetKey ? { error: null, resetKey: props.resetKey, reintents: 0 } : null;
  }
  componentDidCatch(error, info) {
    console.error('[RouteErrorBoundary] Error capturat a la ruta:', error, info);
    registraIncident(esErrorLazy(error) ? 'tros' : 'ruta',
      String(this.props.resetKey ?? '').split(/[?#]/)[0].split('/').filter(Boolean)[0] || 'inici', 'fallback');
    if (this.props.prenElFocus || document.activeElement === document.body) this.titolRef.current?.focus();
    this.carrega();
  }
  getSnapshotBeforeUpdate() { return this.reintentRef.current === document.activeElement; }
  componentDidUpdate(_p, prev, teniaFocus) {
    if (!this.state.error) return;
    this.carrega();
    if (prev.reintents !== this.state.reintents || (teniaFocus && (!this.reintentRef.current || this.reintentRef.current.disabled))) {
      this.titolRef.current?.focus();
    }
  }
  recarrega = () => {
    if (!esAmaDelDocument(this.props.externalConfig) || navigator.onLine === false) return;
    mod?.desaContextRecuperacioRuta({ resetKey: this.props.resetKey, pathname: window.location?.pathname, scrollY: window.scrollY });
    window.location.reload();
  };
  render() {
    const { error, reintents } = this.state;
    if (!error) return this.props.children;
    const importFallat = esErrorLazy(error);
    const ama = esAmaDelDocument(this.props.externalConfig);
    const enLinia = this.props.enLinia ?? (typeof navigator === 'undefined' || navigator.onLine !== false);
    const detall = this.props.mostraDetall ?? Boolean(import.meta.env.DEV);
    const idioma = String(this.props.idioma || 'ca').trim().toLowerCase().split(/[-_]/)[0] || 'ca';
    const tx = mod ? mod.textosRecuperacioRuta(idioma) : CA;
    const Deploy = importFallat && esFalladaDeTransport(error) && mod ? mod.DetallContextDeploy : null;
    return (
      <div className="sdp-route-error" role="alert" lang={idioma}>
        <h2 className="sdp-route-error__titol" tabIndex={-1} ref={this.titolRef}>{tx.titol}</h2>
        <p>{tx.subtitolGeneral}</p>
        {Deploy ? <Deploy tx={tx} ruta={mod.rutaContextSegura(this.props.resetKey)} /> : null}
        {detall ? <pre className="sdp-error-pre">{error.cause?.message || error.message || String(error)}</pre> : null}
        {importFallat ? (
          <>
            <p>{tx.avisMemoria}</p>
            {!ama ? <p>{tx.avisAllotjada}</p> : null}
            {!enLinia ? <p>{tx.avisSenseConnexio}</p> : null}
            {ama ? <button ref={this.reintentRef} type="button" className="sdp-boto sdp-boto--secundari sdp-route-error__reintent"
              disabled={!enLinia} onClick={this.recarrega}>{tx.botoRecarrega}</button> : null}
          </>
        ) : (
          <>
            {reintents ? <p>{tx.vistaContinuaFallant}</p> : null}
            <button ref={this.reintentRef} type="button" className="sdp-boto sdp-boto--secundari sdp-route-error__reintent"
              disabled={reintents >= 1} onClick={() => this.setState({ error: null, reintents: reintents + 1 })}>{tx.botoReintent}</button>
          </>
        )}
      </div>
    );
  }
}

/* La llengua del text de la interfície, o undefined: sense UIProvider (un espècimen solt), null; amb una prova que
   simula UIContext.jsx sense useUIStateOpcional, el try. L'avís parla valencià, com abans de R32.75. */
function useLlenguaDeLaUI() {
  try {
    const ui = useUIStateOpcional();
    return ui?.llenguaDelText || ui?.language;
  } catch {
    return undefined;
  }
}

export function RouteErrorBoundary(props) {
  const llengua = useLlenguaDeLaUI();
  return <BarreraDeRuta {...props} idioma={props.idioma || llengua} />;
}
