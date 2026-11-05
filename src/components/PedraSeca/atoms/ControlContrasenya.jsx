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
    const amaga = () => {
      flushSync(() => setVisible(false));
      const el = camp.current;
      if (el) {
        el.setAttribute('type', 'password');
        el.setAttribute('data-visible', 'false');
        el.setAttribute('data-contrasenya-visible', 'false');
        if (el.style) el.style.webkitTextSecurity = '';
      }
    };
    formulari.addEventListener('submit', amaga);
    return () => formulari.removeEventListener('submit', amaga);
  }, []);

  /* IDEA-72 · Safari/iOS WebKit amb -webkit-autofill manté la màscara de punts
     si només canvia la prop React `type`: forcem l'atribut, data-visible="true",
     webkitTextSecurity="none" i un reflow suau (offsetWidth + offsetHeight)
     preservant cursor i focus. */
  const alternaVisibilitat = () => {
    const el = camp.current;
    const teniaFocus = Boolean(el && document.activeElement === el);
    let inici = null;
    let fi = null;
    try {
      inici = el?.selectionStart ?? null;
      fi = el?.selectionEnd ?? null;
    } catch { /* Alguns motors restringeixen selectionStart abans de commutació */ }
    const seguent = !visible;
    flushSync(() => setVisible(seguent));
    if (!el) return;
    el.setAttribute('type', seguent ? 'text' : 'password');
    el.setAttribute('data-visible', seguent ? 'true' : 'false');
    el.setAttribute('data-contrasenya-visible', seguent ? 'true' : 'false');
    if (el.style) el.style.webkitTextSecurity = seguent ? 'none' : '';
    const actual = el.value;
    el.value = actual;
    void el.offsetWidth;
    void el.offsetHeight;
    if (typeof inici === 'number' && typeof fi === 'number') {
      try { el.setSelectionRange(inici, fi); } catch { /* Safari pot ignorar-ho en estats transitoris */ }
    }
    if (teniaFocus) el.focus({ preventScroll: true });
  };

  return (
    <div className="sdp-contrasenya">
      <input
        {...rest}
        ref={camp}
        id={idControl}
        className={uneix('sdp-control', className)}
        type={visible ? 'text' : 'password'}
        data-visible={visible ? 'true' : 'false'}
        data-contrasenya-visible={visible ? 'true' : 'false'}
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
        onClick={alternaVisibilitat}
      >
        {visible
          ? <EyeOff size={20} aria-hidden="true" focusable="false" />
          : <Eye size={20} aria-hidden="true" focusable="false" />}
      </button>
    </div>
  );
}
