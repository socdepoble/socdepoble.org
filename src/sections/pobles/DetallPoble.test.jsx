import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import DetallPoble, { resumDelPaquet } from './DetallPoble.jsx';
import fontDetailMeta from '../detail/detailSectionMeta.jsx?raw';
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const poble = { id: 'sella', title: 'Sella' };
const torre = { id: 'la-torre-de-les-macanes', title: 'La Torre de les Maçanes' };
/* Decisió del Mestre del 31-10-2026 (Ronda 2): només La Torre és federada. */
test('La Torre: descarrega el paquet del slug i mostra la identitat i els documents federats', async () => {
  const paquet = { zip: new Uint8Array([1]), nomFitxer: 'la-torre-de-les-macanes.zip' };
  const exporta = vi.fn().mockResolvedValue(paquet), descarrega = vi.fn();
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockResolvedValue() } });
  render(<DetallPoble poble={torre} exporta={exporta} descarrega={descarrega} />);
  fireEvent.click(screen.getByRole('button', { name: /Descarregar paquet Open Data.*ActivityStreams/ }));
  await waitFor(() => expect(descarrega).toHaveBeenCalledWith(paquet));
  expect(exporta).toHaveBeenCalledWith('la-torre-de-les-macanes', { municipi: { slug: 'la-torre-de-les-macanes', nom: 'La Torre de les Maçanes' } });
  expect(screen.getByRole('link', { name: 'Actor' }).href).toBe('https://socdepoble.org/ap/actors/la-torre-de-les-macanes.json');
  expect(screen.getByRole('link', { name: 'Outbox' }).href).toBe('https://socdepoble.org/ap/outbox/la-torre-de-les-macanes.json');
  fireEvent.click(screen.getByRole('button', { name: 'Copiar identificador federat' }));
  await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith('@la-torre-de-les-macanes@socdepoble.org'));
});
test('un poble de mostra: paquet Open Data sense identitat federada, Actor ni Outbox', async () => {
  const paquet = { zip: new Uint8Array([1]), nomFitxer: 'sella.zip' };
  const exporta = vi.fn().mockResolvedValue(paquet), descarrega = vi.fn();
  render(<DetallPoble poble={poble} exporta={exporta} descarrega={descarrega} />);
  expect(screen.queryByText(/ActivityStreams/)).toBeNull();
  expect(screen.queryByText(/@sella@socdepoble\.org/)).toBeNull();
  expect(screen.queryByRole('link', { name: 'Actor' })).toBeNull();
  expect(screen.queryByRole('link', { name: 'Outbox' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Copiar identificador federat' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /Descarregar paquet Open Data/ }));
  await waitFor(() => expect(descarrega).toHaveBeenCalledWith(paquet));
  expect(exporta).toHaveBeenCalledWith('sella', { municipi: { slug: 'sella', nom: 'Sella' } });
});
test('una fallada permet reintentar i no fabrica cap descàrrega', async () => {
  const exporta = vi.fn().mockRejectedValue(new Error('offline')), descarrega = vi.fn();
  render(<DetallPoble poble={poble} exporta={exporta} descarrega={descarrega} />);
  fireEvent.click(screen.getByRole('button', { name: /Descarregar paquet/ }));
  await screen.findByText(/No s’ha pogut preparar/);
  expect(descarrega).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: /Descarregar paquet/ }).disabled).toBe(false);
});
test('una resposta del poble anterior no descarrega res després de canviar de fitxa', async () => {
  let resol; const exporta = vi.fn(() => new Promise(r => { resol = r; })), descarrega = vi.fn();
  const vista = render(<DetallPoble poble={poble} exporta={exporta} descarrega={descarrega} />);
  fireEvent.click(screen.getByRole('button', { name: /Descarregar paquet/ }));
  vista.rerender(<DetallPoble poble={{ id: 'tibi', title: 'Tibi' }} exporta={exporta} descarrega={descarrega} />);
  resol({ zip: new Uint8Array() }); await Promise.resolve();
  expect(descarrega).not.toHaveBeenCalled();
});
/* R-01: el missatge d'èxit diu el que porta el paquet de veres.
   T2 · D04/D10 (assalt 261101) · Amb els recomptes i els pendents del paquet mateix (paquet.comptes i paquet.pendents). */
test('després de descarregar, el missatge diu què porta el paquet i què encara no s’exporta', async () => {
  const paquet = { zip: new Uint8Array([1]), nomFitxer: 'sella.zip', comptes: { noticies: 2, agenda: 1, directori: 5, memoria: 0, memoriaOral: 0 },
    pendents: ['memoria', 'memoriaOral', 'configuracio'] };
  const exporta = vi.fn().mockResolvedValue(paquet), descarrega = vi.fn();
  render(<DetallPoble poble={poble} exporta={exporta} descarrega={descarrega} />);
  fireEvent.click(screen.getByRole('button', { name: /Descarregar paquet/ }));
  expect(await screen.findByRole('status')).toHaveProperty('textContent',
    'Paquet descarregat. Notícies: 2 · Agenda: 1 · Entitats: 5 · Memòria cultural: encara no s’exporta · Memòria oral: encara no s’exporta.');
  expect(screen.queryByText(/indica les dades disponibles i les pendents/)).toBeNull();
});
test('T2 · sense recomptes, la reserva diu on mirar-ho; un paquet d’abans de la memòria oral no la nomena', async () => {
  const exporta = vi.fn().mockResolvedValue({ zip: new Uint8Array([1]), nomFitxer: 'sella.zip' }), descarrega = vi.fn();
  render(<DetallPoble poble={poble} exporta={exporta} descarrega={descarrega} />);
  fireEvent.click(screen.getByRole('button', { name: /Descarregar paquet/ }));
  expect(await screen.findByRole('status')).toHaveProperty('textContent',
    'Paquet descarregat. La seua memòria (memoria.md) diu què porta i què encara no s’hi exporta.');
  expect(resumDelPaquet({ comptes: { noticies: 0, agenda: 0, directori: 3, memoria: 0 }, pendents: ['noticies', 'agenda', 'memoria', 'configuracio'] }))
    .toBe('Notícies: encara no s’exporta · Agenda: encara no s’exporta · Entitats: 3 · Memòria cultural: encara no s’exporta');
  expect(resumDelPaquet({ comptes: null })).toBeNull();
});
test('T2 · el resum passa per t() amb les claus section.detail.pobles.opendata.*', async () => {
  const t = vi.fn((clau, reserva) => (clau === 'section.detail.pobles.opendata.descarregatResum' ? 'Package downloaded. {resum}.' : `«${clau.split('.').pop()}»`) || reserva);
  const paquet = { zip: new Uint8Array([1]), nomFitxer: 'sella.zip', comptes: { noticies: 1, agenda: 0, directori: 0, memoria: 0, memoriaOral: 0 }, pendents: ['memoria'] };
  render(<DetallPoble poble={poble} t={t} exporta={vi.fn().mockResolvedValue(paquet)} descarrega={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: '«descarrega»' }));
  expect(await screen.findByRole('status')).toHaveProperty('textContent',
    'Package downloaded. «noticies»: 1 · «agenda»: 0 · «directori»: 0 · «memoria»: «pendent» · «memoriaOral»: 0.');
});
/* R-09 / R2-COR-05: dins de l'app nativa, cap botó de descàrrega (el blob no es desa i la CSP no deixa llegir l'outbox). */
test('dins de l’app nativa no hi ha botó de descàrrega: es diu on descarregar-lo', () => {
  vi.stubGlobal('Capacitor', { isNativePlatform: () => true });
  const exporta = vi.fn();
  render(<DetallPoble poble={torre} exporta={exporta} />);
  expect(screen.queryByRole('button', { name: /Descarregar paquet/ })).toBeNull();
  expect(screen.getByText(/Dins de l’app el paquet no es pot desar a les descàrregues: descarrega’l des de socdepoble\.org\./)).toBeTruthy();
  expect(exporta).not.toHaveBeenCalled();
});
/* R-02: el bloc passa pel traductor de la pàgina (section.detail.pobles.opendata.*), i la fitxa li'l passa. */
test('els textos passen per t() amb les claus section.detail.pobles.opendata.*', () => {
  const t = vi.fn((clau) => `«${clau}»`);
  render(<DetallPoble poble={torre} t={t} exporta={vi.fn()} />);
  expect(screen.getByRole('button', { name: '«section.detail.pobles.opendata.descarregaFederat»' })).toBeTruthy();
  expect(screen.getByRole('button', { name: '«section.detail.pobles.opendata.copia»' })).toBeTruthy();
  expect(screen.getByRole('region', { name: '«section.detail.pobles.opendata.regio.federat»' })).toBeTruthy();
  expect(screen.getByText('«section.detail.pobles.opendata.fase1»')).toBeTruthy();
  expect(fontDetailMeta).toMatch(/<DetallPoble [^>]*\bt=\{t\}/);
});
