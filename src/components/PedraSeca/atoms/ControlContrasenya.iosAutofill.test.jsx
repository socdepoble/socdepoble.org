import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { ControlContrasenya } from './ControlContrasenya.jsx';

afterEach(cleanup);

describe('ControlContrasenya · IDEA-72 (iOS Safari WebKit -webkit-autofill · Alfredo Llorens Jordá)', () => {
  test('quan és visible aplica type="text", data-visible="true", -webkit-text-security: none i preserva valor autocompletat, focus i selecció', () => {
    render(
      <ControlContrasenya
        id="ios-autofill-pass"
        name="password"
        defaultValue="ClauAutocompletadaSafari2026!"
        autoComplete="new-password"
      />
    );
    const input = document.getElementById('ios-autofill-pass');
    const ull = screen.getByRole('button', { name: 'Mostra la contrasenya' });

    expect(input.getAttribute('type')).toBe('password');
    expect(input.getAttribute('data-visible')).toBe('false');
    expect(input.getAttribute('data-contrasenya-visible')).toBe('false');
    expect(ull.getAttribute('aria-pressed')).toBe('false');
    expect(ull.getAttribute('aria-controls')).toBe('ios-autofill-pass');

    input.focus();
    input.setSelectionRange(2, 10);
    fireEvent.mouseDown(ull);
    fireEvent.click(ull);

    expect(input.getAttribute('type')).toBe('text');
    expect(input.getAttribute('data-visible')).toBe('true');
    expect(input.getAttribute('data-contrasenya-visible')).toBe('true');
    expect(input.style.webkitTextSecurity).toBe('none');
    expect(input.value).toBe('ClauAutocompletadaSafari2026!');
    expect(ull.getAttribute('aria-pressed')).toBe('true');
    expect(document.activeElement).toBe(input);
    expect([input.selectionStart, input.selectionEnd]).toEqual([2, 10]);

    fireEvent.click(ull);
    expect(input.getAttribute('type')).toBe('password');
    expect(input.getAttribute('data-visible')).toBe('false');
    expect(input.style.webkitTextSecurity).toBe('');
    expect(ull.getAttribute('aria-pressed')).toBe('false');
  });

  test('el full components.css declara la regla explícita per a input[type="text"][data-visible="true"]:-webkit-autofill', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/css/components.css'), 'utf8');
    expect(css).toContain('input[type="text"][data-visible="true"]');
    expect(css).toContain('input[type="text"][data-visible="true"]:-webkit-autofill');
    expect(css).toContain('-webkit-text-security: none;');
  });
});
