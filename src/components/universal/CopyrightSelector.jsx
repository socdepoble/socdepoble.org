import { useId, useState } from 'react';
import { CreativeCommons, Copyright, Globe } from 'lucide-react';
import { Dialeg } from '../PedraSeca/organismes/Dialeg.jsx';

const licenses = ['CC BY 4.0', 'CC BY-SA 4.0', 'CC BY-ND 4.0', 'CC BY-NC 4.0', 'CC BY-NC-SA 4.0', 'CC BY-NC-ND 4.0', 'CC0 1.0'];
export default function CopyrightSelector({ value = '', onSave }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(value);
  const [choice, setChoice] = useState('actual');
  const [accepted, setAccepted] = useState(false);
  const id = useId();
  const custom = choice === 'custom';
  const cc0 = custom || choice === 'CC0 1.0';
  const Icon = cc0 ? Globe : choice === 'actual' ? Copyright : CreativeCommons;
  const save = () => {
    if (cc0 && !accepted) return;
    onSave(custom ? `${text.slice(0, 246)} · CC0 1.0` : choice === 'actual' ? value : choice);
    setOpen(false);
  };
  return <>
    <button type="button" className="sdp-copyright-selector" aria-haspopup="dialog"
      title={value} onClick={() => { setText(value.replace(/ · CC0 1\.0$/, '')); setChoice('actual'); setAccepted(false); setOpen(true); }}>
      <Copyright size={14} aria-hidden="true" />Elegir drets d'autor</button>
    <Dialeg obert={open} onTanca={() => setOpen(false)} titol="Drets d'autor" className="sdp-copyright-dialog"
      accions={<button type="button" className="sdp-boto" disabled={cc0 && !accepted} onClick={save}>Desar autoria</button>}>
      <label htmlFor={`${id}-license`}>Llicència</label>
      <div className="sdp-license-choice"><Icon size={24} aria-hidden="true" />
        <select id={`${id}-license`} value={choice} onChange={event => { setChoice(event.target.value); setAccepted(false); }}>
          <option value="actual">Mantindre els drets actuals</option>
          {licenses.map(license => <option key={license}>{license}</option>)}
          <option value="custom">Text lliure personalitzat (CC0)</option>
        </select>
      </div>
      {custom && <><label htmlFor={id}>Text lliure (màxim 256 caràcters amb la marca CC0)</label>
        <textarea id={id} className="sdp-copyright-input" maxLength={246} value={text.slice(0, 246)}
          onChange={event => setText(event.target.value.slice(0, 246))} />
        <p aria-live="polite">{Math.min(text.length, 246) + 10} / 256</p></>}
      {cc0 && <div className="sdp-license-notice"><p>En confirmar esta opció dedicaràs la teua obra al domini públic amb CC0: altres persones podran copiar-la, modificar-la i usar-la comercialment. Esta renúncia és irrevocable en la mesura permesa per la llei. El text personalitzat no afegix restriccions a CC0.</p>
        <p><a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noreferrer">Llegir les condicions de CC0</a></p>
        <label><input type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} /> Tinc els drets necessaris i accepte dedicar esta obra a CC0.</label></div>}
      {!cc0 && <p><a href="https://creativecommons.org/cc-licenses/" target="_blank" rel="noreferrer">Consultar les llicències Creative Commons</a></p>}
    </Dialeg>
  </>;
}
