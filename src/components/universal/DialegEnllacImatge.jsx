/**
 * DialegEnllacImatge.jsx — D-B4-2 (Onada R6, Bloc 4; decisió de MarIA sobre
 * el Bloc 3) · El diàleg del botó «Enllaç de la imatge» de la barra de
 * l'editor, en lloc de window.prompt i window.alert.
 *
 * El de la casa (PedraSeca · Dialeg sobre <dialog> natiu): té nom accessible
 * (el títol), el focus queda dins mentre és obert, Escape el tanca i el focus
 * torna al botó que l'ha obert. El camp (Camp + CampText) arriba ple amb
 * l'adreça actual de la imatge triada; es pot canviar o buidar (buida = llevar
 * l'enllaç). L'adreça es jutja ací mateix amb la guarda de l'ordre
 * enllacaImatge (hrefDeImatge: un camí de l'app, un fragment, una consulta o
 * una URL http(s) o mailto sense credencials) i l'error es diu dins del
 * diàleg, sense tancar-lo. `onDesa(adreca)` aplica l'ordre i torna si s'ha
 * pogut; si no (la imatge ja no és triada), també ho diu.
 */
import { useId, useState } from 'react';
import { Dialeg, Boto, Camp, CampText } from '../PedraSeca/index.js';
import { hrefDeImatge } from './richText/extensions/enllacImatge.js';

const TEXTOS = Object.freeze({
  titol: ['section.notes.format.enllacImatge', 'Enllaç de la imatge'],
  camp: ['section.notes.format.enllacImatgeCamp', 'Adreça de l’enllaç'],
  ajuda: ['section.notes.format.enllacImatgeAjuda', 'Un camí de l’app, una adreça https:// o un mailto:. Deixa-la buida per a llevar l’enllaç.'],
  refusat: ['section.notes.format.enllacImatgeRefusat', 'Esta adreça no és segura: la imatge es queda com estava.'],
  noAplicat: ['section.notes.format.enllacImatgeNoAplicat', 'No s’ha pogut canviar l’enllaç: torna a triar la imatge.'],
  desa: ['section.notes.format.enllacImatgeDesa', 'Desar'],
  cancela: ['common.cancela', 'Cancel·lar'],
});

export function DialegEnllacImatge({ obert, hrefInicial = '', onDesa, onTanca, t }) {
  const tr = ([clau, reserva]) => (typeof t === 'function' ? t(clau, reserva) : reserva);
  const idForm = useId();
  const [valor, setValor] = useState(() => (typeof hrefInicial === 'string' ? hrefInicial : ''));
  const [error, setError] = useState('');

  const desa = (event) => {
    event?.preventDefault?.();
    const adreca = valor.trim();
    if (adreca && !hrefDeImatge(adreca)) {
      setError(tr(TEXTOS.refusat));
      return;
    }
    if (typeof onDesa !== 'function' || onDesa(adreca) !== true) {
      setError(tr(TEXTOS.noAplicat));
      return;
    }
    onTanca?.('boto');
  };

  return (
    <Dialeg
      obert={obert}
      onTanca={onTanca}
      titol={tr(TEXTOS.titol)}
      mida="s"
      accions={(
        <>
          <Boto varietat="secundari" onClick={() => onTanca?.('boto')}>{tr(TEXTOS.cancela)}</Boto>
          <Boto varietat="primari" tipus="submit" form={idForm}>{tr(TEXTOS.desa)}</Boto>
        </>
      )}
    >
      <form id={idForm} noValidate onSubmit={desa}>
        <Camp etiqueta={tr(TEXTOS.camp)} ajuda={tr(TEXTOS.ajuda)} error={error || undefined}>
          <CampText
            value={valor}
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            data-sdp-focus-inicial=""
            onChange={(event) => {
              setValor(event.target.value);
              if (error) setError('');
            }}
          />
        </Camp>
      </form>
    </Dialeg>
  );
}

export default DialegEnllacImatge;
