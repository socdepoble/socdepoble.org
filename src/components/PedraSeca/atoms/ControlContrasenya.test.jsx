import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { ControlContrasenya } from './ControlContrasenya.jsx';

afterEach(cleanup);

describe('ControlContrasenya · IDEA-72 (Safari/iOS -webkit-autofill i visibilitat)', () => {
  test('commuta entre password i text, força webkitTextSecurity="none" i preserva focus i selecció', () => {
    render(<ControlContrasenya id="reg-pass" defaultValue="ClauSecretaRural2026!" autoComplete="new-password" />);
    const input = document.getElementById('reg-pass');
    const ull = screen.getByRole('button', { name: 'Mostra la contrasenya' });

    expect(input.getAttribute('type')).toBe('password');
    expect(input.getAttribute('data-contrasenya-visible')).toBe('false');
    expect(ull.getAttribute('aria-pressed')).toBe('false');

    input.focus();
    input.setSelectionRange(4, 11);
    fireEvent.mouseDown(ull);
    fireEvent.click(ull);

    expect(input.getAttribute('type')).toBe('text');
    expect(input.getAttribute('data-contrasenya-visible')).toBe('true');
    expect(input.style.webkitTextSecurity).toBe('none');
    expect(ull.getAttribute('aria-pressed')).toBe('true');
    expect(document.activeElement).toBe(input);
    expect([input.selectionStart, input.selectionEnd]).toEqual([4, 11]);

    fireEvent.click(ull);
    expect(input.getAttribute('type')).toBe('password');
    expect(input.getAttribute('data-contrasenya-visible')).toBe('false');
    expect(input.style.webkitTextSecurity).toBe('');
    expect(ull.getAttribute('aria-pressed')).toBe('false');
  });

  test('en enviar el formulari torna immediatament a type="password" abans del submit', () => {
    let tipusEnSubmit = null;
    render(
      <form
        onSubmit={(e) => {
          e.preventDefault();
          tipusEnSubmit = document.getElementById('form-pass').getAttribute('type');
        }}
      >
        <ControlContrasenya id="form-pass" defaultValue="ClauSecretaRural2026!" />
        <button type="submit">Envia</button>
      </form>
    );
    const ull = screen.getByRole('button', { name: 'Mostra la contrasenya' });
    fireEvent.click(ull);
    expect(document.getElementById('form-pass').getAttribute('type')).toBe('text');

    fireEvent.submit(document.getElementById('form-pass').form);
    expect(tipusEnSubmit).toBe('password');
    expect(document.getElementById('form-pass').getAttribute('type')).toBe('password');
  });
});
