/* IDEA-54/55 (Onada 261029_1605) · El registre de blob: del Gestor: només la
   llista blanca per a pintar, octet-stream per a descarregar, i un cop tancat
   ho revoca tot i no en crea cap més (testimoni de generació). */
import { describe, expect, test, vi } from 'vitest';
import { creaUrlsArxiuLocal } from './urlsArxiuLocal.js';

const urlApiFals = () => {
  let n = 0;
  const creades = [];
  return {
    creades,
    createObjectURL: vi.fn((blob) => {
      creades.push(blob.type);
      n += 1;
      return `blob:prova/${n}`;
    }),
    revokeObjectURL: vi.fn()
  };
};

describe('creaUrlsArxiuLocal', () => {
  test('visor: ràster, àudio, vídeo i PDF sí; SVG, HTML, XML, JS i text no', () => {
    const api = urlApiFals();
    const urls = creaUrlsArxiuLocal({ urlApi: api });
    for (const tipus of ['image/png', 'image/jpeg', 'image/webp', 'audio/mpeg', 'video/mp4', 'application/pdf']) {
      expect(urls.visor(new Blob(['x'], { type: tipus }))).toMatch(/^blob:prova\//);
    }
    for (const tipus of ['image/svg+xml', 'text/html', 'text/html;charset=utf-8', 'application/xhtml+xml', 'text/xml', 'text/javascript', 'text/plain', '']) {
      expect([tipus, urls.visor(new Blob(['x'], { type: tipus }))]).toEqual([tipus, null]);
    }
    expect(api.creades.some((t) => /svg|html|xml|javascript/.test(t))).toBe(false);
  });

  test('descarrega: el contingut retipat a application/octet-stream (també d’un SVG o d’un HTML)', () => {
    const api = urlApiFals();
    const urls = creaUrlsArxiuLocal({ urlApi: api });
    expect(urls.descarrega(new Blob(['<svg/>'], { type: 'image/svg+xml' }))).toMatch(/^blob:prova\//);
    expect(urls.descarrega(new Blob(['<p>'], { type: 'text/html' }))).toMatch(/^blob:prova\//);
    expect(api.creades).toEqual(['application/octet-stream', 'application/octet-stream']);
    expect(urls.descarrega(null)).toBeNull();
  });

  test('tanca revoca totes les URL (visor i descàrrega) i, després, no en crea cap', () => {
    const api = urlApiFals();
    const urls = creaUrlsArxiuLocal({ urlApi: api });
    const a = urls.visor(new Blob(['x'], { type: 'image/png' }));
    const b = urls.descarrega(new Blob(['x'], { type: 'image/png' }));
    expect(urls.vives).toBe(2);
    urls.tanca();
    expect(api.revokeObjectURL.mock.calls.map(([u]) => u).sort()).toEqual([a, b].sort());
    expect(urls.tancat).toBe(true);
    expect(urls.vives).toBe(0);
    expect(urls.visor(new Blob(['x'], { type: 'image/png' }))).toBeNull();
    expect(urls.descarrega(new Blob(['x'], { type: 'image/png' }))).toBeNull();
    expect(api.createObjectURL).toHaveBeenCalledTimes(2);
  });

  test('revoca una URL soleta i torna fals per a una d’un altre registre', () => {
    const api = urlApiFals();
    const urls = creaUrlsArxiuLocal({ urlApi: api });
    const a = urls.visor(new Blob(['x'], { type: 'image/png' }));
    const b = urls.descarrega(new Blob(['x'], { type: 'image/png' }));
    expect(urls.revoca(a)).toBe(true);
    expect(urls.revoca(b)).toBe(true);
    expect(urls.revoca('blob:altre/1')).toBe(false);
    expect(api.revokeObjectURL).toHaveBeenCalledTimes(2);
  });
});
