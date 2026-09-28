import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { GrupOpcions } from './formulari.jsx';

afterEach(cleanup);

const OPCIONS_TARGETES = [
  { valor: 'publica', antetitol: 'Fitxa', etiqueta: 'Pública', ajuda: 'Tothom la pot vore.', icona: <svg data-icona="globus" />, detall: 'Es pot tornar privada.' },
  { valor: 'privada', antetitol: 'Fitxa', etiqueta: 'Privada', ajuda: 'Només la veus tu.' }
];

describe('GrupOpcions · aspecte targetes (T44)', () => {
  test('fieldset amb llegenda, ràdios natius amb el mateix name i graella en un div', () => {
    render(<GrupOpcions aspecte="targetes" llegenda="Qui pot veure la fitxa" nom="visibilitat" opcions={OPCIONS_TARGETES} />);
    const grup = screen.getByRole('group', { name: 'Qui pot veure la fitxa' });
    expect(grup.tagName).toBe('FIELDSET');
    expect(grup.classList.contains('sdp-grup')).toBe(true);
    expect(grup.classList.contains('sdp-grup--targetes')).toBe(true);
    expect(grup.querySelector(':scope > div.sdp-grup__targetes')).toBeTruthy();
    const radios = within(grup).getAllByRole('radio');
    expect(radios).toHaveLength(2);
    expect(radios.every((r) => r.name === 'visibilitat')).toBe(true);
    expect(grup.querySelectorAll('.sdp-casella')).toHaveLength(0);
  });

  test('nom = antetítol + títol (aria-labelledby); descripció = ajuda + detall (aria-describedby)', () => {
    render(<GrupOpcions aspecte="targetes" llegenda="Visibilitat" valor="publica" onCanvi={() => {}} opcions={OPCIONS_TARGETES} textTriada="Triada" />);
    const publica = screen.getByRole('radio', { name: 'Fitxa Pública', description: 'Tothom la pot vore. Es pot tornar privada.' });
    expect(publica.checked).toBe(true);
    /* Sense detall, la descripció és només l'ajuda; la insígnia no s'escola al nom. */
    const privada = screen.getByRole('radio', { name: 'Fitxa Privada', description: 'Només la veus tu.' });
    expect(privada.checked).toBe(false);
    /* La icona va dins d'un embolcall aria-hidden. */
    const icona = document.querySelector('[data-icona="globus"]');
    expect(icona.closest('.sdp-targeta-opcio__icona').getAttribute('aria-hidden')).toBe('true');
    /* Dins del label només hi ha contingut de frase. */
    const label = publica.closest('.sdp-targeta-opcio').querySelector('label');
    expect(label.querySelector('div, p, h1, h2, h3, h4, h5, h6')).toBeNull();
  });

  test('sense antetítol, el nom és només el títol', () => {
    render(<GrupOpcions aspecte="targetes" llegenda="L" opcions={[{ valor: 'a', etiqueta: 'Només títol' }]} />);
    const radio = screen.getByRole('radio', { name: 'Només títol' });
    expect(radio.getAttribute('aria-describedby')).toBeNull();
  });

  test('insígnia amb textTriada només a l’opció marcada i només en mode controlat', () => {
    const onCanvi = vi.fn();
    const { rerender } = render(
      <GrupOpcions aspecte="targetes" llegenda="V" valor="publica" onCanvi={onCanvi} textTriada="Triada" opcions={OPCIONS_TARGETES} />
    );
    expect(screen.getAllByText('Triada')).toHaveLength(1);
    expect(screen.getByText('Triada').closest('.sdp-targeta-opcio').querySelector('input').value).toBe('publica');
    expect(screen.getByText('Triada').closest('.sdp-insignia').classList.contains('sdp-insignia--exit')).toBe(true);

    fireEvent.click(screen.getByRole('radio', { name: 'Fitxa Privada' }));
    expect(onCanvi).toHaveBeenCalledWith('privada');
    rerender(<GrupOpcions aspecte="targetes" llegenda="V" valor="privada" onCanvi={onCanvi} textTriada="Triada" opcions={OPCIONS_TARGETES} />);
    expect(screen.getByText('Triada').closest('.sdp-targeta-opcio').querySelector('input').value).toBe('privada');

    cleanup();
    render(<GrupOpcions aspecte="targetes" llegenda="V" opcions={OPCIONS_TARGETES} />);
    expect(screen.queryByText('Triat')).toBeNull();
    expect(screen.getAllByRole('radio').every((r) => r.checked === false)).toBe(true);
  });

  test('textTriada per defecte és «Triat»', () => {
    render(<GrupOpcions aspecte="targetes" llegenda="V" valor="privada" onCanvi={() => {}} opcions={OPCIONS_TARGETES} />);
    expect(screen.getAllByText('Triat')).toHaveLength(1);
  });

  test('fieldset disabled desactiva tots els ràdios', () => {
    render(<GrupOpcions aspecte="targetes" llegenda="V" disabled opcions={OPCIONS_TARGETES} />);
    const grup = screen.getByRole('group', { name: 'V' });
    expect(grup.disabled).toBe(true);
    expect(within(grup).getAllByRole('radio').every((r) => r.matches(':disabled'))).toBe(true);
  });

  test('desactivada desactiva només eixe ràdio', () => {
    const onCanvi = vi.fn();
    render(<GrupOpcions aspecte="targetes" llegenda="V" valor="publica" onCanvi={onCanvi} opcions={[
      OPCIONS_TARGETES[0],
      { ...OPCIONS_TARGETES[1], desactivada: true }
    ]} />);
    const privada = screen.getByRole('radio', { name: 'Fitxa Privada' });
    expect(privada.disabled).toBe(true);
    expect(screen.getByRole('radio', { name: 'Fitxa Pública' }).disabled).toBe(false);
  });

  test('amb error, el fieldset porta les dues classes i el missatge el descriu', () => {
    render(<GrupOpcions aspecte="targetes" llegenda="V" error="Tria una opció." opcions={OPCIONS_TARGETES} />);
    const grup = screen.getByRole('group', { name: 'V' });
    expect(grup.classList.contains('sdp-grup--targetes')).toBe(true);
    expect(grup.classList.contains('sdp-grup--error')).toBe(true);
    expect(document.getElementById(grup.getAttribute('aria-describedby')).textContent).toBe('Tria una opció.');
  });
});

/* jsdom no calcula ni capes ni apilament: es comprova la regla escrita del
   bloc T44 de modules.css (el @layer components que conté .sdp-grup--targetes). */
describe('GrupOpcions · CSS de les targetes (T44)', () => {
  const moduls = readFileSync(resolve(process.cwd(), 'src/css/modules.css'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
  const blocT44 = (() => {
    const regla = '.sdp-grup--targetes { padding: 0; border: 0;';
    for (let obri = moduls.indexOf('@layer components {'); obri >= 0; obri = moduls.indexOf('@layer components {', obri + 1)) {
      let fons = 0;
      for (let i = moduls.indexOf('{', obri); i < moduls.length; i += 1) {
        if (moduls[i] === '{') fons += 1;
        else if (moduls[i] === '}' && (fons -= 1) === 0) {
          const bloc = moduls.slice(obri, i + 1);
          if (bloc.includes(regla)) return bloc;
          break;
        }
      }
    }
    return '';
  })();
  const regla = (selector) => {
    const inici = blocT44.indexOf(`${selector} {`);
    return inici < 0 ? '' : blocT44.slice(inici, blocT44.indexOf('}', inici) + 1);
  };

  test('el ràdio va damunt del label (z-index 1) i el z-index queda tancat dins de la targeta', () => {
    expect(blocT44).not.toBe('');
    expect(regla('.sdp-targeta-opcio__control')).toContain('position: absolute;');
    expect(regla('.sdp-targeta-opcio__control')).toContain('z-index: 1;');
    expect(regla('.sdp-targeta-opcio')).toContain('isolation: isolate;');
  });

  test('amb error, les targetes porten la vora d’error: després de :checked, abans de :focus-visible i :disabled', () => {
    const ERROR = '.sdp-grup--targetes.sdp-grup--error .sdp-targeta-opcio__cos { border-color: var(--sdp-error); }';
    const posError = blocT44.indexOf(ERROR);
    expect(posError).toBeGreaterThan(-1);
    expect(posError).toBeGreaterThan(blocT44.indexOf('.sdp-targeta-opcio__control:checked + .sdp-targeta-opcio__cos {'));
    expect(posError).toBeLessThan(blocT44.indexOf('.sdp-targeta-opcio__control:focus-visible + .sdp-targeta-opcio__cos {'));
    expect(posError).toBeLessThan(blocT44.indexOf('.sdp-targeta-opcio__control:disabled + .sdp-targeta-opcio__cos { border-color'));
  });
});

describe('GrupOpcions · aspecte llista (per defecte, sense canvis)', () => {
  test('continua emetent files .sdp-casella amb l’etiqueta com a nom', () => {
    render(<GrupOpcions llegenda="Mida" valor="b" onCanvi={() => {}} opcions={[
      { valor: 'a', etiqueta: 'A', ajuda: 'Petita', antetitol: 'ignorat', icona: <svg data-icona="x" />, detall: 'ignorat' },
      { valor: 'b', etiqueta: 'B' }
    ]} />);
    const grup = screen.getByRole('group', { name: 'Mida' });
    expect(grup.className).toBe('sdp-grup');
    expect(grup.querySelectorAll(':scope > .sdp-casella')).toHaveLength(2);
    expect(grup.querySelector('.sdp-grup__targetes, .sdp-targeta-opcio, .sdp-insignia')).toBeNull();
    expect(grup.querySelector('[data-icona]')).toBeNull();
    const a = within(grup).getByRole('radio', { name: /^A/ });
    expect(a.className).toBe('sdp-casella__control');
    expect(a.hasAttribute('aria-labelledby')).toBe(false);
    expect(a.hasAttribute('disabled')).toBe(false);
    expect(within(grup).getByRole('radio', { name: 'B' }).checked).toBe(true);
    expect(grup.textContent).not.toContain('ignorat');
  });

  test('desactivada també desactiva el ràdio en la llista', () => {
    render(<GrupOpcions llegenda="Mida" opcions={[
      { valor: 'a', etiqueta: 'A' },
      { valor: 'b', etiqueta: 'B', desactivada: true }
    ]} />);
    expect(screen.getByRole('radio', { name: 'A' }).disabled).toBe(false);
    expect(screen.getByRole('radio', { name: 'B' }).disabled).toBe(true);
  });
});
