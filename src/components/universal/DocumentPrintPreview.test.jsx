import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import DocumentPrintPreview, { buildPrintDocument } from './DocumentPrintPreview.jsx';

afterEach(cleanup);

test('A4 export escapes metadata, sanitizes rich text and blocks executable resources', () => {
  const html = buildPrintDocument({ title: '<img src=x onerror=alert(1)>Títol', content: '<script>alert(1)</script><h2>Capítol</h2><p onclick="alert(1)">Cos</p>', copyright: '</footer><script>bad()</script>' }, true, '<script>Autor</script>');
  const document = new DOMParser().parseFromString(html, 'text/html');
  expect(document.querySelector('script')).toBeNull();
  expect(document.querySelector('[onclick]')).toBeNull();
  expect(document.querySelector('.cover h1').textContent).toBe('Títol');
  expect(document.querySelector('article h2').textContent).toBe('Capítol');
  expect(document.querySelector('meta[http-equiv]').content).toContain("default-src 'none'");
  expect(document.querySelector('style').textContent).toContain('size: A4');
  expect(buildPrintDocument({ title: 'Sense portada' })).not.toContain('<section class="cover">');
});

/* T42 · un sol scroll, el del document. jsdom no calcula alçades (la regla
   es prova a DocumentPrintPreview.capes.test.js); ací, l'estructura que
   eixa regla necessita. */
const DOC = { title: 'Carta al poble', subtitle: 'Esborrany', content: '<p>Cos</p>', copyright: 'CC BY-SA' };
const obri = (boto = 'Vista A4 / PDF') => {
  render(<DocumentPrintPreview document={DOC} author="Autora" />);
  fireEvent.click(screen.getByRole('button', { name: boto }));
  return document.querySelector('dialog.sdp-print-dialog');
};

test('T42 · el cos del diàleg només porta la casella i el document', () => {
  const dialeg = obri();
  expect(dialeg.hasAttribute('open')).toBe(true);
  expect(dialeg.classList.contains('sdp-dialeg--g')).toBe(true);
  const cos = dialeg.querySelector('.sdp-dialeg__cos');
  expect([...cos.children].map(node => node.className)).toEqual(['sdp-casella', 'sdp-print-preview']);
  expect(cos.querySelector('p')).toBeNull();
});

test('T42 · l’avís és la descripció accessible del diàleg, fora del cos', () => {
  const dialeg = obri();
  const descripcio = document.getElementById(dialeg.getAttribute('aria-describedby'));
  expect(descripcio.className).toBe('sdp-dialeg__descripcio');
  expect(descripcio.textContent).toContain('«Desar com a PDF»');
  expect(descripcio.closest('.sdp-dialeg__cos')).toBeNull();
});

test('T42 · «Incloure portada» és una Casella de Pedra Seca i refà el document', () => {
  const dialeg = obri();
  const casella = screen.getByRole('checkbox', { name: 'Incloure portada' });
  expect(casella.className).toBe('sdp-casella__control');
  expect(casella.checked).toBe(false);
  const iframe = dialeg.querySelector('iframe.sdp-print-preview');
  expect(iframe.getAttribute('title')).toBe('Document A4');
  expect(iframe.getAttribute('srcdoc')).not.toContain('<section class="cover">');
  fireEvent.click(casella);
  expect(casella.checked).toBe(true);
  expect(iframe.getAttribute('srcdoc')).toContain('<section class="cover">');
});

test('T42 · «Crear portada» obri el diàleg amb la casella marcada', () => {
  obri('Crear portada');
  expect(screen.getByRole('checkbox', { name: 'Incloure portada' }).checked).toBe(true);
});

test('T42 · en pantalla estreta el paper perd el coixí gros; la impressió no canvia', () => {
  const html = buildPrintDocument({ title: 'x' });
  const estreta = '@media screen and (max-width: 120mm) { body { padding: 0; } main { padding: 4mm; } }';
  expect(html).toContain(estreta);
  // Va darrere del @media screen general: a igual especificitat, guanya.
  expect(html.indexOf(estreta)).toBeGreaterThan(html.indexOf('@media screen {'));
  expect(html).toContain('@page { size: A4; margin: 20mm 18mm; }');
  // Els colors del paper s'interpolen des d'una constant: cap forat buit.
  expect(html).not.toMatch(/undefined|\$\{/);
});
