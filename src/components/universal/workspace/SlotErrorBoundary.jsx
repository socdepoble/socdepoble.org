import { Component } from 'react';

/**
 * SlotErrorBoundary — contenidor aïllat per a slots de domini.
 *
 *   - Intercepta qualsevol excepció del seu fill (render, efectes) i
 *     pinta un fallback digne en lloc de deixar la pàgina en blanc.
 *   - Es reinicia automàticament quan canvia `resetKey` (l'id de
 *     l'item actiu): l'error era de l'item anterior; el nou mereix
 *     una oportunitat.
 *   - `onError` és l'únic punt de telemetria (Sentry, registre propi).
 *     Sense telemetria, en DEV s'avisa per consola: res de silencis.
 *
 *   - NO sana res: si el mateix item torna a petar, torna el fallback.
 *     El botó "Reintenta" és per a errors transitòries, no per a bugs
 *     deterministes.
 */
export class SlotErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (this.props.onError) {
      this.props.onError(error, info);
    } else if (import.meta.env.DEV) {
      console.error('[SlotErrorBoundary] Error sense telemetria:', error, info);
    }
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  reinicia = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const { domini = 'panell', fallback } = this.props;
    if (typeof fallback === 'function') {
      return fallback({ error, reinicia: this.reinicia });
    }

    return (
      <div className="sdp-buit sdp-slot-error" role="alert">
        <h2 className="section-title">☠️ El {domini} s'ha esfondrat</h2>
        <p className="perfil-detall-buit">
          ATENCIÓ: S'ha produït un error fatal intern en aquest panell.
        </p>
        <pre className="sdp-camp__ajuda sdp-pre-wrap">
          {String(error?.message ?? error)}
        </pre>
        <button type="button" className="sdp-boto" onClick={this.reinicia}>
          Reintenta
        </button>
      </div>
    );
  }
}

export default SlotErrorBoundary;
