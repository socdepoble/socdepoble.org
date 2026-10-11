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
      return (
        <div className="alert">
          <h2>No s'ha pogut carregar Sóc de Poble</h2>
          <p>Torna a carregar la pàgina. Si continua, avisa l'administrador del lloc.</p>
          <pre>{this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
