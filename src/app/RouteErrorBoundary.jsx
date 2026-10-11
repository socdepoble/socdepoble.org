import { Component, createRef } from 'react';
import { esErrorLazy } from '../apps/plataforma/lazyRoute.js';
import { esAmaDelDocument } from '../apps/plataforma/interruptors.js';
import { registraIncident } from '../utils/autocuracio.js';

/** Sole recovery owner for route imports, including failures inside slots. */
export class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, resetKey: props.resetKey, reintents: 0 };
    this.titolRef = createRef();
    this.reintentRef = createRef();
  }
  static getDerivedStateFromError(error) { return { error }; }
  static getDerivedStateFromProps(props, state) {
    return props.resetKey !== state.resetKey
      ? { error: null, resetKey: props.resetKey, reintents: 0 }
      : null;
  }
  componentDidCatch(error, info) {
    console.error('[RouteErrorBoundary] Error capturat a la ruta:', error, info);
    /* Onada 12 (261011; ordres 261011_0130, punt 7) · Rastre local de la
       caiguda: el tipus i la secció (el primer tram de la ruta, mai la fitxa
       ni el missatge de l'error). */
    registraIncident(esErrorLazy(error) ? 'tros' : 'ruta',
      String(this.props.resetKey ?? '').split('/').filter(Boolean)[0] || 'inici', 'fallback');
    if (document.activeElement === document.body) this.titolRef.current?.focus();
  }
  getSnapshotBeforeUpdate() {
    return this.reintentRef.current === document.activeElement;
  }
  componentDidUpdate(_propsAnteriors, estatAnterior, controlTeniaFocus) {
    if (!this.state.error) return;
    // Un reintent pot remuntar el panell; desactivar o llevar el control
    // també pot deixar el focus al body. Conservem el focus dins del problema
    // sense prendre'l d'un control de navegació exterior.
    if (estatAnterior.reintents !== this.state.reintents
      || (controlTeniaFocus && (!this.reintentRef.current || this.reintentRef.current.disabled))) {
      this.titolRef.current?.focus();
    }
  }
  recarrega = () => {
    // Recheck at the click: an embedding host and an offline device own no reload.
    if (!esAmaDelDocument(this.props.externalConfig) || navigator.onLine === false) return;
    window.location.reload();
  };
  render() {
    const { error, reintents } = this.state;
    if (!error) return this.props.children;
    const importFallat = esErrorLazy(error);
    const ama = esAmaDelDocument(this.props.externalConfig);
    const enLinia = this.props.enLinia ?? (typeof navigator === 'undefined' || navigator.onLine !== false);
    const detall = this.props.mostraDetall ?? Boolean(import.meta.env.DEV);
    return (
      <div className="sdp-route-error" role="alert">
        <h2 className="sdp-route-error__titol" tabIndex={-1} ref={this.titolRef}>Hi ha hagut un problema</h2>
        <p>Aquesta secció no ha pogut carregar-se correctament.</p>
        {detall ? <pre className="sdp-error-pre">{error.cause?.message || error.message || String(error)}</pre> : null}
        {importFallat ? (
          <>
            <p>Recarregar reinicia l’aplicació i descarta les dades que només viuen a la memòria. Desa o exporta el que necessites abans.</p>
            {!ama ? <p>Torna a obrir el mòdul des de la pàgina que l’allotja.</p> : null}
            {!enLinia ? <p>Recupera la connexió abans de tornar a carregar.</p> : null}
            {ama ? <button ref={this.reintentRef} type="button" className="sdp-boto sdp-boto--secundari sdp-route-error__reintent"
              disabled={!enLinia} onClick={this.recarrega}>Recarrega l’aplicació</button> : null}
          </>
        ) : (
          <>
            {reintents ? <p>La vista continua fallant. Pots obrir una altra secció amb el menú.</p> : null}
            <button ref={this.reintentRef} type="button" className="sdp-boto sdp-boto--secundari sdp-route-error__reintent"
              disabled={reintents >= 1} onClick={() => this.setState({ error: null, reintents: reintents + 1 })}>Intentar de nou</button>
          </>
        )}
      </div>
    );
  }
}
