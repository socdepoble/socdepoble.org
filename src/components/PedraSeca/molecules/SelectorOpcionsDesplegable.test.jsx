import { useState } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { SelectorOpcionsDesplegable } from './SelectorOpcionsDesplegable.jsx';

afterEach(cleanup);
const opcions = [
  { id: 'a', titol: 'A casa', explicacio: <p>Detall de casa</p> },
  { id: 'b', titol: 'En un arxiu', explicacio: <p>Detall de l’arxiu</p> },
  { id: 'c', titol: 'Opció inhabilitada', explicacio: <p>No es pot triar</p>, inhabilitada: true },
];
function Mostra() {
  const [valor, setValor] = useState('a');
  return <SelectorOpcionsDesplegable llegenda="Destí de la còpia" opcions={opcions} valor={valor} onCanvi={setValor}
    resumTitol="Resum" resum={[`Destí: ${valor}`, 'Només simulació']} />;
}
test('la selecció és exclusiva i el detall seguix immediatament la seua opció', () => {
  render(<Mostra />);
  const grup=screen.getByRole('group', { name: 'Destí de la còpia' });
  const a=within(grup).getByRole('radio', { name: 'A casa' });
  const b=within(grup).getByRole('radio', { name: 'En un arxiu' });
  expect(a.checked).toBe(true); fireEvent.click(b); expect(b.checked).toBe(true); expect(a.checked).toBe(false);
  const detall=document.getElementById(b.getAttribute('aria-controls'));
  expect(detall.hidden).toBe(false); expect(b.closest('label').nextElementSibling).toBe(detall);
  expect(document.getElementById(a.getAttribute('aria-controls')).hidden).toBe(true);
  expect(screen.getByRole('status').textContent).toContain('Destí: b');
  expect(screen.getByRole('status').children).toHaveLength(2);
});
test('dos grups no compartixen noms ni identificadors', () => {
  const { container }=render(<><Mostra /><Mostra /></>);
  const inputs=[...container.querySelectorAll('input')];
  expect(new Set(inputs.map(x=>x.id)).size).toBe(inputs.length);
  expect(inputs[0].name).not.toBe(inputs[3].name);
  expect(inputs.every(x=>!x.hasAttribute('aria-expanded'))).toBe(true);
});
test('no invoca canvis per muntar i respecta inhabilitació nativa', () => {
  const onCanvi=vi.fn();
  render(<SelectorOpcionsDesplegable llegenda="Privat" opcions={opcions} valor="a" onCanvi={onCanvi} disabled />);
  expect(onCanvi).not.toHaveBeenCalled();
  expect(screen.getByRole('group').disabled).toBe(true);
  expect(screen.getByRole('radio',{name:'Opció inhabilitada'}).disabled).toBe(true);
});
/* R26.3 (ordre del Mestre del 14-11-2026, revisió de Gemini §1.B) · Abans el resum es tallava amb
   el·lipsi i el text sencer es confiava a un title. El dit no pot obrir un title: ara el resum no es
   talla mai (prova de CSS a src/css/selectorOpcionsDesplegable.capes.test.js) i no porta title. */
test('el resum pinta les dues primeres frases senceres, sense title', () => {
  const text='Una explicació llarga que continua disponible per a tecnologia assistiva';
  render(<SelectorOpcionsDesplegable llegenda="Destí" opcions={opcions} valor="a" onCanvi={()=>{}} resum={[text,'Segona línia','Tercera']} />);
  const estat=screen.getByRole('status');
  expect(estat.textContent).toContain(text);
  expect(estat.children).toHaveLength(2);
  expect(estat.textContent).not.toContain('Tercera');
  expect([...estat.children].map((fill)=>fill.textContent)).toEqual([text,'Segona línia']);
  expect(estat.querySelector('[title]')).toBeNull();
});

/* Onada R28 · Un sol anunci: amb resumViu={false} el resum es veu igual, però no és regió viva
   (la pàgina ja en té una per al mateix recompte, com el simulador del Farcellet). */
test('resumViu={false}: el resum es pinta sencer però no és cap role=status ni aria-live', () => {
  const { container } = render(<SelectorOpcionsDesplegable llegenda="Destí" opcions={opcions} valor="a" onCanvi={() => {}}
    resumTitol="Resum" resum={['Destí: a', 'Només simulació']} resumViu={false} />);
  const resum = container.querySelector('.sdp-selector-opcions__resum');
  expect(resum.textContent).toContain('Destí: a');
  expect(resum.hasAttribute('role')).toBe(false);
  expect(resum.hasAttribute('aria-live')).toBe(false);
  expect(screen.queryByRole('status')).toBeNull();
});
