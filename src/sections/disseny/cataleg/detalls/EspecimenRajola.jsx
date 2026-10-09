import { useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import { Rajola } from '../../../../components/PedraSeca/index.js';
import { formatEuros } from '../../../../utils/diners.js';

/* Carta sintètica de mostra: cap preu ni producte de cap establiment real. */
const PRODUCTES = [
  { id: 'cafe', titol: 'Cafè', cents: 120 },
  { id: 'tallat', titol: 'Tallat', cents: 130 },
  { id: 'cafe-llet', titol: 'Cafè amb llet', cents: 150 },
  { id: 'torrada', titol: 'Torrada amb tomaca', cents: 250 },
  { id: 'aigua', titol: 'Aigua', cents: 100 }
];

const CATEGORIES = [
  { id: 'cafes', titol: 'Cafès', marcador: 'CF' },
  { id: 'esmorzars', titol: 'Esmorzars', marcador: 'ES' },
  { id: 'begudes', titol: 'Begudes', marcador: 'BG' }
];

export default function EspecimenRajola() {
  const [comanda, setComanda] = useState({});
  const [categoria, setCategoria] = useState('cafes');
  const afig = (id) => setComanda((actual) => ({ ...actual, [id]: (actual[id] || 0) + 1 }));
  const linies = PRODUCTES.filter((p) => comanda[p.id]).map((p) => `${comanda[p.id]} × ${p.titol}`);
  const total = PRODUCTES.reduce((suma, p) => suma + (comanda[p.id] || 0) * p.cents, 0);
  return (
    <Especimen id="rajola" nom="Rajola" fitxer="src/components/PedraSeca/molecules/Rajola.jsx"
      descripcio="Botó quadrat (1:1) amb imatge o marcador, títol i línia secundària: la peça de les graelles tàctils (els productes del Bar, les categories). Sempre un <button> natiu, mai per davall de --sdp-touch. La graella és la classe .sdp-rajoles."
      contracte={[
        ['titol / secundari', 'string', '—', 'El nom accessible del botó (títol i línia secundària).'],
        ['imatge', 'string', 'null', 'Src d’una imatge quadrada; passa per sanitize.js i per la base dels recursos propis. Decoració (alt="").'],
        ['media', 'node', 'null', 'Un node propi en lloc de la imatge (p. ex. la imatge d’un producte).'],
        ['marcador', 'string', 'inicials', 'El text del quadrat sense imatge; per defecte, les inicials de les dues primeres paraules.'],
        ['seleccionada', 'boolean', '—', 'Rajola que es tria: aria-pressed. Sense, és una acció.'],
        ['desactivada', 'boolean', 'false', 'disabled natiu (p. ex. «Esgotat»).'],
        ['…rest', 'props de <button>', '—', 'onClick, aria-*, data-*.']
      ]}
      a11y={['<button type="button"> natiu: el quadrat és aria-hidden i el nom és el títol i la línia secundària.', 'Una rajola que es tria porta aria-pressed; una d’acció, no.']}
      fes={['Graelles de tria ràpida amb el dit.', 'Dir el preu o l’estat a la línia secundària.']}
      noFacis={['Posar-hi text llarg: el títol es talla a dues línies.', 'Fer-la més xicoteta que --sdp-touch.']}>
      <h4>Productes (acció: cada toc afig una unitat)</h4>
      <ul className="sdp-rajoles" aria-label="Productes de mostra">
        {PRODUCTES.map((p) => (
          <li key={p.id}><Rajola titol={p.titol} secundari={formatEuros(p.cents)} onClick={() => afig(p.id)} /></li>
        ))}
        <li><Rajola titol="Sóc de Poble" secundari="Amb imatge" imatge="/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png" onClick={() => afig('cafe')} /></li>
        <li><Rajola titol="Croissant" secundari="Esgotat" desactivada /></li>
      </ul>
      <p role="status">{linies.length ? `Comanda de mostra: ${linies.join(', ')} · ${formatEuros(total)}` : 'Toca una rajola per a afegir-la a la comanda de mostra.'}</p>
      <h4>Categories (tria: aria-pressed)</h4>
      <ul className="sdp-rajoles" aria-label="Categories de mostra">
        {CATEGORIES.map((c) => (
          <li key={c.id}><Rajola titol={c.titol} marcador={c.marcador} seleccionada={categoria === c.id} onClick={() => setCategoria(c.id)} /></li>
        ))}
      </ul>
    </Especimen>
  );
}
