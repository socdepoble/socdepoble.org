/**
 * ControlContrasenya.jsx — camp de contrasenya amb ull (260927).
 *
 * CONTRACTE
 *   · Accepta les props d'un <input> (id, name, value, onChange, autoComplete,
 *     minLength, disabled, aria-*…). El tipus el decidix l'ull, no qui l'usa.
 *   · L'etiqueta la posa qui l'usa, amb htmlFor = id. Sense id, en fa un.
 *   · L'ull té nom FIX (etiquetaUll) i l'estat viu a aria-pressed: el lector
 *     no anuncia un nom que canvia a mitja frase.
 *   · El mousedown de l'ull no roba el focus del camp.
 *   · Visible, el mòbil la «corregiria»: sense majúscules, sense correcció i
 *     sense corrector ortogràfic. L'autoComplete es conserva.
 *   · Quan el formulari s'envia torna a amagar-se, i ho fa ABANS que el
 *     gestor d'enviament llegisca res: no ix mai com a camp de text.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Eye, EyeOff } from 'lucide-react';

const uneix = (...c) => c.filter(Boolean).join(' ');

export function ControlContrasenya({ id, etiquetaUll = 'Mostra la contrasenya', className, disabled = false, ...rest }) {
  const idPropi = useId();
  const idControl = id || idPropi;
  const [visible, setVisible] = useState(false);
  const camp = useRef(null);

  /* Escolta nativa sobre el <form>: salta abans que l'onSubmit de React. */
  useEffect(() => {
    const formulari = camp.current?.form;
    if (!formulari) return undefined;
    const amaga = () => flushSync(() => setVisible(false));
    formulari.addEventListener('submit', amaga);
    return () => formulari.removeEventListener('submit', amaga);
  }, []);

  return (
    <div className="sdp-contrasenya">
      <input
        {...rest}
        ref={camp}
        id={idControl}
        className={uneix('sdp-control', className)}
        type={visible ? 'text' : 'password'}
        disabled={disabled}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
      />
      <button
        type="button"
        className="sdp-contrasenya__ull"
        aria-label={etiquetaUll}
        aria-pressed={visible}
        aria-controls={idControl}
        disabled={disabled}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setVisible((actual) => !actual)}
      >
        {visible
          ? <EyeOff size={20} aria-hidden="true" focusable="false" />
          : <Eye size={20} aria-hidden="true" focusable="false" />}
      </button>
    </div>
  );
}
