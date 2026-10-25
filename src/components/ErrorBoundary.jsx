import React from 'react';
import { registraIncident } from '../utils/autocuracio.js';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('[PedraSeca] Error capturat pel límit de React:', error, errorInfo);
    /* Onada 12 (261011; ordres 261011_0130, punt 7) · Rastre local: l'arrel
       sencera ha caigut. Mai el missatge de l'error. */
    registraIncident('panell', 'arrel', 'fallback');
  }
  render() {
    if (this.state.hasError) {
      /* PN-02 (auditoria Port Neutral 261025) · El text de l'error pot portar
         dades de la persona: en pantalla, només en DEV (o amb mostraDetall),
         el mateix criteri que RouteErrorBoundary. */
      const detall = this.props.mostraDetall ?? Boolean(import.meta.env.DEV);
      return (
        <div className="alert">
          <h2>No s'ha pogut carregar Sóc de Poble</h2>
          <p>Torna a carregar la pàgina. Si continua, avisa l'administrador del lloc.</p>
          {detall ? <pre>{this.state.error?.toString()}</pre> : null}
        </div>
      );
    }
    return this.props.children;
  }
}
