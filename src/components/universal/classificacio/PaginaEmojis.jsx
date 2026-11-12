/**
 * PaginaEmojis — Subvista i pàgina dedicada del selector d'Emojis per al
 * Workspace (Notes, Perfil, etc.), substituint la finestra flotant modal.
 *
 * Ofereix una navegació clara i directa amb botó prominent de «Tornar»,
 * títol, descripció orientativa i la graella neta del catàleg Emojis XL,
 * sense diàlegs asfixiants ni capes modals fosques que tapen la pantalla.
 */
import { useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useCapaEnrere } from '../../PedraSeca/hooks/useCapaEnrere.js';
import { Boto } from '../../PedraSeca/index.js';
import { GraellaEmojis } from './GraellaEmojis.jsx';

const AJUDA_INSERIR = 'Toca un emoji i s’escriurà on tenies el cursor, a la nota oberta.';
const AJUDA_COPIAR = 'Toca un emoji per copiar-lo al porta-retalls: ara no hi ha cap nota oberta on escriure’l.';
const AJUDA_PERFIL = 'Toca un emoji per assignar-lo com a emoticona de la teua fitxa.';

export function PaginaEmojis({
  onTornar,
  onTria,
  carregaCataleg,
  emojiAlCursor = false,
  modePerfil = false,
  textNoReconegut = null,
  titol = 'Emojis',
  descripcio = null,
  accioSecundaria = null
}) {
  const arrel = useRef(null);

  /* P0-24b (T2, prompt 261102_1532) · La pàgina es munta només oberta: mentre
     viu és a la pila de l'Arrere d'Android, amb el camí de l'Escape (onTornar). */
  const teCapaDamunt = useCapaEnrere(true, () => onTornar?.());

  /* Escolta la tecla Escape per tornar a la vista anterior.
     P0-24b (Onada R21) · L'escolta és a la finestra: un Escape que una capa de
     damunt ja ha consumit (un desplegable, les opcions de la barra) o que és
     d'una capa de damunt (un diàleg, que el rep després del keydown) no és
     seu. Abans tancava la pàgina sota el diàleg, o les dues capes alhora. */
  useEffect(() => {
    const escoltaTecles = (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented || teCapaDamunt()) return;
      e.preventDefault();
      onTornar?.();
    };
    window.addEventListener('keydown', escoltaTecles);
    return () => window.removeEventListener('keydown', escoltaTecles);
  }, [onTornar, teCapaDamunt]);

  const descripcioCalculada = descripcio ?? (
    modePerfil
      ? AJUDA_PERFIL
      : (emojiAlCursor ? AJUDA_INSERIR : AJUDA_COPIAR)
  );

  return (
    <div
      ref={arrel}
      className="sdp-pagina-emojis"
      role="dialog"
      aria-modal="false"
      aria-label={titol}
    >
      <header className="sdp-pagina-emojis__capcalera">
        <div className="sdp-pagina-emojis__nav">
          <button
            type="button"
            className="sdp-boto sdp-boto--secundari sdp-pagina-emojis__boto-tornar"
            onClick={onTornar}
            aria-label="Tornar"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            <span>Tornar</span>
          </button>
          <Boto
            varietat="fantasma"
            onClick={onTornar}
          >
            Tancar
          </Boto>
        </div>

        <div className="sdp-pagina-emojis__titols">
          <h2 className="sdp-pagina-emojis__titol">{titol}</h2>
          <p className="sdp-pagina-emojis__descripcio">{descripcioCalculada}</p>
        </div>

        {accioSecundaria ? (
          <div>
            {accioSecundaria}
          </div>
        ) : null}
      </header>

      <main className="sdp-pagina-emojis__cos">
        <GraellaEmojis
          carregaCataleg={carregaCataleg}
          onTria={onTria}
          textNoReconegut={textNoReconegut}
        />
      </main>
    </div>
  );
}

export default PaginaEmojis;
