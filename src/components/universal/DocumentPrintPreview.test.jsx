import { expect, test } from 'vitest';
import { buildPrintDocument } from './DocumentPrintPreview.jsx';

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
