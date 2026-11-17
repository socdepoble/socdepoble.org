import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext';
import { UniversalEditorShell } from './UniversalEditorShell.jsx';

afterEach(() => cleanup());

test('R32 (T2 a11y) · amb onHeroEdit / onLogoEdit (Perfil), el selector intern de UniversalEditorShell porta tabIndex=-1 i aria-label', () => {
  const { container } = render(
    <MemoryRouter rutaInicial="/el-meu-perfil">
      <UniversalEditorShell
        title="Fitxa de prova"
        onTitleChange={() => {}}
        heroImage=""
        onHeroEdit={() => {}}
        heroEditLabel="Canviar capçalera"
        logoImage=""
        onLogoEdit={() => {}}
        logoEditLabel="Canviar avatar"
      >
        <div>Cos</div>
      </UniversalEditorShell>
    </MemoryRouter>
  );

  const inputs = [...container.querySelectorAll('input[type="file"].sdp-nomes-lector')];
  expect(inputs.length).toBe(2);
  expect(inputs.map((i) => i.getAttribute('tabindex'))).toEqual(['-1', '-1']);
  expect(inputs.map((i) => i.getAttribute('aria-label'))).toEqual(['Canviar capçalera', 'Canviar avatar']);
});

test('R32.2 · sense editor extern, els selectors reals també tenen nom i el botó visible conserva el recorregut de teclat', () => {
  const { container } = render(
    <MemoryRouter rutaInicial="/notes">
      <UniversalEditorShell title="Nota" onTitleChange={() => {}} heroImage="" logoImage="" heroEditLabel="Canviar capçalera" logoEditLabel="Canviar avatar">
        <div>Cos</div>
      </UniversalEditorShell>
    </MemoryRouter>
  );
  const inputs = [...container.querySelectorAll('input[type="file"].sdp-nomes-lector')];
  expect(inputs).toHaveLength(2);
  expect(inputs.map((input) => input.getAttribute('aria-label'))).toEqual(['Canviar capçalera', 'Canviar avatar']);
  expect(inputs.map((input) => input.getAttribute('tabindex'))).toEqual(['-1', '-1']);
  const input = inputs[0];
  let clicat = 0;
  input.click = () => { clicat += 1; };
  [...container.querySelectorAll('button')].find((button) => button.textContent.includes('Canviar capçalera')).click();
  expect(clicat).toBe(1);
});
