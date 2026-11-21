import { afterEach, expect, test, vi } from 'vitest';
import DOMPurify from 'dompurify';
import { sanitizeHtml } from './sanitize.js';
import { esEnllacExtern, relEnllacExtern } from './enllacosExterns.js';

afterEach(() => vi.restoreAllMocks());
const rel = (html, opcions) => {
  const root = document.createElement('div');
  root.innerHTML = sanitizeHtml(html, opcions);
  return root.querySelector('a').getAttribute('rel');
};
test('extern UGC per defecte; editorial només per opció del consumidor', () => {
  const html = '<a href="https://comerc.example/" rel="dofollow noopener">Comerç</a>';
  expect(rel(html)).toBe('ugc nofollow noopener noreferrer');
  expect(rel(html, { enllacosEditorials: true })).toBe('noopener noreferrer');
  expect(rel(html, { enllacosEditorials: 'true' })).toBe('ugc nofollow noopener noreferrer');
  expect(rel(html)).toBe('ugc nofollow noopener noreferrer');
});
test('sponsored explícit en HTML o opció i idempotència', () => {
  const html = '<a href="https://comerc.example/" rel="SPONSORED dofollow">Patrocini</a>';
  expect(rel(html)).toBe('ugc nofollow sponsored noopener noreferrer');
  expect(rel('<a href="https://comerc.example/">Patrocini</a>', { sponsored: true })).toBe('ugc nofollow sponsored noopener noreferrer');
  const net = sanitizeHtml(html);
  expect(sanitizeHtml(net)).toBe(net);
  expect(relEnllacExtern({ editorial: true, sponsored: true })).toBe('sponsored noopener noreferrer');
});
test('rutes pròpies, fragments i contactes conserven la qualificació existent', () => {
  for (const href of ['/mur/1', '#seccio', 'mailto:a@example.org', 'tel:+34960000000']) {
    expect(esEnllacExtern(href)).toBe(false);
    expect(rel(`<a href="${href}">Intern</a>`)).toBe('noopener noreferrer nofollow');
  }
  expect(esEnllacExtern('https://extern.example/')).toBe(true);
  expect(esEnllacExtern('//extern.example/')).toBe(true);
  expect(esEnllacExtern(window.location.origin + '/mur')).toBe(false);
});
test('les opcions editorials i sponsored es restablixen també si DOMPurify falla', () => {
  const real = DOMPurify.sanitize;
  vi.spyOn(DOMPurify, 'sanitize').mockImplementationOnce(() => { throw new Error('fallada de prova'); });
  expect(() => sanitizeHtml('<a>x</a>', { enllacosEditorials: true, sponsored: true })).toThrow('fallada');
  DOMPurify.sanitize = real;
  expect(rel('<a href="https://extern.example/">Extern</a>')).toBe('ugc nofollow noopener noreferrer');
});
