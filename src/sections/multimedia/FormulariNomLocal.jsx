/**
 * FormulariNomLocal.jsx — Un nom per a crear o canviar (fitxer .md nou,
 * carpeta nova, reanomenar) al Gestor d'arxius locals (IDEA-55 · Onada
 * 261029_1605).
 *
 * `onEnvia(nom)` fa l'operació (la seua primera espera és la del motor, que
 * demana el permís readwrite dins del gest de l'enviament) i torna el text de
 * l'error, si n'hi ha, que el <Camp> mostra lligat al control.
 */
import { useEffect, useRef, useState } from 'react';
import { Boto, Camp, CampText } from '../../components/PedraSeca/index.js';

export function FormulariNomLocal({
  etiqueta,
  ajuda = null,
  textBoto,
  textCancela = null,
  valorInicial = '',
  disabled = false,
  enfocaEnObrir = false,
  onEnvia,
  onCancela = null
}) {
  const [valor, setValor] = useState(valorInicial);
  const [error, setError] = useState(null);
  const [enviant, setEnviant] = useState(false);
  const viu = useRef(true);
  const caixa = useRef(null);

  useEffect(() => {
    viu.current = true;
    if (enfocaEnObrir) caixa.current?.querySelector('input')?.focus();
    return () => {
      viu.current = false;
    };
  }, [enfocaEnObrir]);

  const envia = async (event) => {
    event.preventDefault();
    if (enviant || disabled) return;
    setEnviant(true);
    setError(null);
    try {
      const errada = await onEnvia?.(valor);
      if (viu.current && errada) setError(errada);
    } finally {
      if (viu.current) setEnviant(false);
    }
  };

  return (
    <form ref={caixa} className="sdp-arxiu-local__formulari" onSubmit={envia} noValidate>
      <Camp etiqueta={etiqueta} ajuda={ajuda} error={error}>
        <CampText
          value={valor}
          onChange={(event) => setValor(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
        />
      </Camp>
      <div className="sdp-arxiu-local__fila">
        <Boto varietat="primari" tipus="submit" carregant={enviant} disabled={disabled}>{textBoto}</Boto>
        {onCancela ? <Boto onClick={onCancela} disabled={enviant}>{textCancela}</Boto> : null}
      </div>
    </form>
  );
}
