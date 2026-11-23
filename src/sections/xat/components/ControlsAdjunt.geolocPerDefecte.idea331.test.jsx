import '../../../../tests/helpers/diccionaris.js';
/* v1.2.23 · IDEA-331 (ordre del Mestre 261123) · D-V1223-GEOLOC-PER-DEFECTE a la interfície del xat:
     (e) l'avís «Este contingut conserva la ubicació per a situar-lo al territori» i l'interruptor d'un toc
         «Amaga el lloc» (rètol curt, visible) / «Publicar sense geolocalització» (rètol llarg, al title) existixen i
         es veuen en les cinc llengües;
     (d) un vídeo amb so que el navegador no pot netejar i «Amaga el lloc»: l'avís a la vista i no s'envia brut; només
         «Conserva el lloc» (o Cancel·la) desbloqueja l'enviament, i llavors s'envia amb el lloc que la persona ha vist.
   La preparació és simulada (sense <video> ni canvas a jsdom); l'opt-out i el sanejador del vídeo són els reals. */
import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import { createTranslator } from '../../../config/i18n.js';
import ca from '../../../config/idiomes/ca.js';
import es from '../../../config/idiomes/es.js';
import en from '../../../config/idiomes/en.js';
import eu from '../../../config/idiomes/eu.js';
import gl from '../../../config/idiomes/gl.js';
import { ERRORS_ADJUNT_XAT } from '../../../data/xatMultimedia.js';
import { ascii, box, join } from '../../../../tests/helpers/contenidorsMedia.js';
import ControlsAdjunt from './ControlsAdjunt.jsx';
import Compositor from './Compositor.jsx';

const m = vi.hoisted(() => ({ prepara: vi.fn(), amaga: vi.fn() }));
vi.mock('../adjuntLocal.js', async (original) => ({ ...(await original()), preparaAdjunt: m.prepara,
  amagaUbicacioAdjunt: (...args) => m.amaga(...args), mimeDeGravacio: () => null }));
const { amagaUbicacioAdjunt: amagaReal } = await vi.importActual('../adjuntLocal.js');
vi.mock('../../../data/backendPort.js', () => ({ quotaXat: vi.fn(), teCapacitat: () => true, descartaAdjuntXat: vi.fn(), urlAdjuntXat: vi.fn() }));

const DICCIONARIS = { ca, es, en, eu, gl };
const CLAUS = Object.freeze({
  avis: 'section.xat.adjunts.ubicacioConservada',
  curt: 'section.xat.adjunts.amagaLloc',
  llarg: 'section.xat.adjunts.publicaSenseGeolocalitzacio',
  torna: 'section.xat.adjunts.conservaLloc',
});
const LLOC = { lat: 38.64, lng: -0.49 };
const hdlr = (handler) => { const d = new Uint8Array(24); d.set(ascii(handler), 8); return box('hdlr', d); };
const trak = (handler) => box('trak', box('mdia', hdlr(handler)));
// Vídeo, so i la pista de metadades opaca de l'iPhone: el sanejador real no el pot acreditar.
const movOpac = () => new Blob([box('ftyp', join(ascii('qt  '), new Uint8Array(4), ascii('qt  '))),
  box('moov', join(trak('vide'), trak('soun'), trak('meta'), box('udta', box('©xyz', ascii('+38.6412-000.4912/'))))),
  box('mdat', new Uint8Array(64))], { type: 'video/quicktime' });
// Gauntlet R1 del carril A (P2) · El punt exacte que porta el fitxer (preparaAdjunt el torna com a llocDelFitxer).
const LLOC_DEL_FITXER = { lat: 38.6412345, lng: -0.4912345 };
const foto = () => ({ id: 'foto-1', tipus: 'imatge', duradaMs: null, fitxer: new Blob(['foto'], { type: 'image/jpeg' }),
  conservaUbicacio: true, ubicacioVerificada: true, ubicacio: LLOC, llocDelFitxer: LLOC_DEL_FITXER });

let servei;
beforeEach(() => {
  vi.clearAllMocks();
  m.amaga.mockImplementation(amagaReal);
  servei = { teCapacitat: () => true, quotaXat: vi.fn().mockResolvedValue({ usats: 0, limit: 250_000_000 }) };
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:prova'), revokeObjectURL: vi.fn() });
  for (const metode of ['pause', 'load']) vi.spyOn(HTMLMediaElement.prototype, metode).mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

function Barra({ t, onEnvia = vi.fn() }) {
  const [valor, setValor] = useState('');
  return <AppGridContext.Provider value={{ mida: 'ample' }}>
    <ControlsAdjunt fil={{ id: 'A' }} servei={servei} usuariId="veí" t={t} onEnvia={onEnvia}>
      {(adjunts) => <Compositor fil={{ id: 'A' }} valor={valor} onCanvia={setValor} onEnvia={vi.fn()} t={t} adjunts={adjunts} />}
    </ControlsAdjunt>
  </AppGridContext.Provider>;
}
async function tria(dic) {
  fireEvent.change(await screen.findByLabelText(dic['section.xat.adjunts.selector']), { target: { files: [new File(['x'], 'x.jpg', { type: 'image/jpeg' })] } });
}
const sentencia = (text) => text.split(' (')[0];

describe('IDEA-331 (e) · l’avís i l’interruptor en les cinc llengües', () => {
  test('les quatre claus són a cada diccionari, sense duplicar-se, i el valencià és el del codi', () => {
    for (const [llengua, dic] of Object.entries(DICCIONARIS)) {
      for (const clau of Object.values(CLAUS)) {
        expect(typeof dic[clau], `${llengua} ${clau}`).toBe('string');
        expect(dic[clau].trim().length, `${llengua} ${clau}`).toBeGreaterThan(3);
        if (llengua !== 'ca') expect(dic[clau], `${llengua} ${clau}`).not.toBe(ca[clau]);
      }
      expect(dic[CLAUS.avis]).toContain('{lat}'); expect(dic[CLAUS.avis]).toContain('{lng}');
      expect(new Set(Object.values(CLAUS).map((clau) => dic[clau])).size).toBe(4);
    }
    expect(sentencia(ca[CLAUS.avis])).toBe('Este contingut conserva la ubicació per a situar-lo al territori');
    expect(ca[CLAUS.curt]).toBe('Amaga el lloc');
    expect(ca[CLAUS.llarg]).toBe('Publicar sense geolocalització');
    expect(ca[CLAUS.torna]).toBe('Conserva el lloc');
    expect(ca['section.xat.adjunts.error.ubicacio-no-admesa']).toBe(ERRORS_ADJUNT_XAT['ubicacio-no-admesa']);
  });

  test.each(Object.keys(DICCIONARIS))('%s: abans de publicar es veu l’avís i l’interruptor d’un toc, amb el rètol llarg', async (llengua) => {
    const dic = DICCIONARIS[llengua];
    const t = createTranslator(llengua);
    m.prepara.mockResolvedValue(foto());
    render(<Barra t={t} />); await tria(dic);
    const avis = await screen.findByText(new RegExp(sentencia(dic[CLAUS.avis]).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    // El punt que porta el fitxer, sencer (cinc decimals), no el DTO arrodonit.
    expect(avis.textContent).toMatch(/38[,.]64123°/); expect(avis.textContent).toMatch(/0[,.]49123°/);
    const interruptor = screen.getByRole('button', { name: dic[CLAUS.curt] });
    expect(interruptor.title).toBe(dic[CLAUS.llarg]);
    expect(screen.getByRole('button', { name: dic['section.xat.adjunts.envia'] }).getAttribute('aria-describedby')).toBe(avis.closest('p').id);
  });
});

describe('IDEA-331 (d) · vídeo amb so que no es pot netejar i «Amaga el lloc»: avís i no s’envia brut', () => {
  test('l’avís del navegador, cap enviament fins a «Conserva el lloc», i després s’envia amb el lloc vist', async () => {
    const fitxer = movOpac();
    m.prepara.mockResolvedValue({ id: 'video-1', tipus: 'video', duradaMs: 5000, fitxer, senseUbicacio: false, conservaUbicacio: true,
      ubicacioVerificada: false, ubicacio: LLOC, llocDelFitxer: { lat: 38.6412, lng: -0.4912 }, motiuFallback: 'video-audio-no-capturable' });
    const onEnvia = vi.fn().mockResolvedValue([{ id: 'video-1' }]);
    render(<Barra t={createTranslator('ca')} onEnvia={onEnvia} />); await tria(ca);
    fireEvent.click(await screen.findByRole('button', { name: 'Amaga el lloc' }));
    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).toBe(ERRORS_ADJUNT_XAT['video-no-acreditable-navegador']);
    // L'avís continua dient la veritat: el contingut encara conserva el lloc.
    expect(screen.getByText(/Este contingut conserva la ubicació per a situar-lo al territori/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Tanca l’avís' }));
    fireEvent.click(screen.getByRole('button', { name: 'Envia el fitxer' }));
    expect((await screen.findByRole('alert')).textContent).toBe(ERRORS_ADJUNT_XAT['video-no-acreditable-navegador']);
    expect(onEnvia).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Conserva el lloc' }));
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Envia el fitxer' }));
    await waitFor(() => expect(onEnvia).toHaveBeenCalledOnce());
    expect(onEnvia.mock.calls[0][1]).toMatchObject({ id: 'video-1', fitxer, ubicacio: LLOC, conservaUbicacio: true });
  });

  test('l’interruptor és d’anada i tornada: amagada s’envia sense lloc; «Conserva el lloc» torna al mateix ID', async () => {
    m.prepara.mockResolvedValue(foto());
    // Sense canvas a jsdom: l'opt-out de la foto el dona un doble (el real el proven els tests de dades).
    m.amaga.mockImplementation(async (adjunt) => { const resta = { ...adjunt }; delete resta.ubicacio; delete resta.llocDelFitxer;
      return { ...resta, id: 'foto-neta', fitxer: new Blob(['neta'], { type: 'image/jpeg' }), conservaUbicacio: false, senseUbicacio: true }; });
    const onEnvia = vi.fn().mockRejectedValue(new Error('Xarxa temporal'));
    render(<Barra t={createTranslator('ca')} onEnvia={onEnvia} />); await tria(ca);
    fireEvent.click(await screen.findByRole('button', { name: 'Amaga el lloc' }));
    expect(await screen.findByText('Ubicació amagada')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Conserva el lloc' }));
    expect(await screen.findByText(/Este contingut conserva la ubicació per a situar-lo al territori/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Amaga el lloc' }));
    await screen.findByText('Ubicació amagada');
    fireEvent.click(screen.getByRole('button', { name: 'Envia el fitxer' }));
    await waitFor(() => expect(onEnvia).toHaveBeenCalledOnce());
    expect(onEnvia.mock.calls[0][1]).toMatchObject({ id: 'foto-neta', conservaUbicacio: false, senseUbicacio: true });
    expect(onEnvia.mock.calls[0][1]).not.toHaveProperty('ubicacio');
    // Després del primer intent (ACK incert), l'interruptor queda fix: el reintent és el mateix binari.
    await screen.findByRole('alert');
    expect(screen.getByRole('button', { name: 'Conserva el lloc' }).disabled).toBe(true);
  });
});

/* Gauntlet R1 del carril A (P2) · L'avís diu quin lloc porta el fitxer: el punt sencer (cinc decimals) quan el porta
   dins, i l'aproximat del mapa (dos decimals, el DTO) quan el fitxer no el porta (vídeo recomprimit en un contenidor
   que no l'admet). */
describe('Gauntlet R1 (P2) · l’avís pinta el lloc que es comparteix de veres', () => {
  const NOMES_MAPA = 'section.xat.adjunts.ubicacioNomesMapa';
  const grausCa = (n, decimals) => new Intl.NumberFormat('ca-ES', { maximumFractionDigits: decimals }).format(n);

  test('la clau «només el mapa» és a les cinc llengües, amb {lat} i {lng}, i no és l’avís de conservar', () => {
    for (const [llengua, dic] of Object.entries(DICCIONARIS)) {
      expect(typeof dic[NOMES_MAPA], llengua).toBe('string');
      expect(dic[NOMES_MAPA]).toContain('{lat}'); expect(dic[NOMES_MAPA]).toContain('{lng}');
      expect(dic[NOMES_MAPA]).not.toBe(dic[CLAUS.avis]);
      if (llengua !== 'ca') expect(dic[NOMES_MAPA]).not.toBe(ca[NOMES_MAPA]);
    }
    expect(ca[NOMES_MAPA]).toBe('Este contingut conserva la ubicació aproximada per a situar-lo al territori ({lat}°, {lng}°): el fitxer no la porta dins.');
  });

  test('foto que porta el punt exacte: l’avís el pinta sencer, no el DTO de dos decimals', async () => {
    m.prepara.mockResolvedValue({ ...foto(), ubicacio: { lat: 38.59, lng: -0.42 }, llocDelFitxer: { lat: 38.5919, lng: -0.4184 } });
    render(<Barra t={createTranslator('ca')} />); await tria(ca);
    const esperat = ca[CLAUS.avis].replace('{lat}', grausCa(38.5919, 5)).replace('{lng}', grausCa(-0.4184, 5));
    expect(esperat).toContain('38,5919°');
    expect(await screen.findByText(esperat)).toBeTruthy();
    expect(screen.queryByText(/38,59°/)).toBeNull();
  });

  test.each(Object.keys(DICCIONARIS))('%s: vídeo recomprimit sense el lloc dins: l’avís aproximat (dos decimals) i l’interruptor', async (llengua) => {
    const dic = DICCIONARIS[llengua];
    m.prepara.mockResolvedValue({ id: 'video-2', tipus: 'video', duradaMs: 5000, fitxer: new Blob(['v'], { type: 'video/mp4' }),
      senseUbicacio: true, videoComprimit: true, conservaUbicacio: true, ubicacioVerificada: true, ubicacio: { lat: 38.59, lng: -0.42 } });
    render(<Barra t={createTranslator(llengua)} />); await tria(dic);
    const esperat = dic[NOMES_MAPA].replace('{lat}', grausCa(38.59, 2)).replace('{lng}', grausCa(-0.42, 2));
    expect(esperat).toContain('38,59°');
    expect(await screen.findByText(esperat)).toBeTruthy();
    expect(screen.getByRole('button', { name: dic[CLAUS.curt] }).title).toBe(dic[CLAUS.llarg]);
  });
});

/* v1.2.23 · L1-03 (Gauntlet R1) · L'interruptor es pot seguir sense vore'l: l'avís és una regió viva (role=status) que
   anuncia el resultat, i mentre amaga el botó no es desactiva (aria-disabled), perquè un botó enfocat que passa a
   disabled perd el focus. Cap text nou: els rètols són els del Mestre. */
describe('L1-03 (Gauntlet R1) · l’interruptor anuncia el resultat i no perd el focus', () => {
  test('mentre amaga és aria-disabled i no disabled; el mateix node passa a «Conserva el lloc» i l’avís viu ho diu', async () => {
    m.prepara.mockResolvedValue(foto());
    let acaba;
    m.amaga.mockImplementation((adjunt) => new Promise((resol) => {
      acaba = () => { const resta = { ...adjunt }; delete resta.ubicacio; delete resta.llocDelFitxer;
        resol({ ...resta, id: 'foto-neta', fitxer: new Blob(['neta'], { type: 'image/jpeg' }), conservaUbicacio: false, senseUbicacio: true }); };
    }));
    render(<Barra t={createTranslator('ca')} />); await tria(ca);
    const avis = (await screen.findByText(/Este contingut conserva la ubicació per a situar-lo al territori/)).closest('p');
    expect(avis.getAttribute('role')).toBe('status');
    const boto = screen.getByRole('button', { name: 'Amaga el lloc' });
    expect(boto.hasAttribute('aria-disabled')).toBe(false);
    boto.focus();
    fireEvent.click(boto);
    await waitFor(() => expect(boto.getAttribute('aria-disabled')).toBe('true'));
    expect(boto.disabled).toBe(false);
    expect(document.activeElement).toBe(boto);
    // Un altre toc mentre amaga no fa res: amagaLloc ix amb `ocupat`.
    fireEvent.click(boto);
    expect(m.amaga).toHaveBeenCalledOnce();
    await act(async () => { acaba(); });
    const conserva = await screen.findByRole('button', { name: 'Conserva el lloc' });
    expect(conserva).toBe(boto);
    expect(conserva.hasAttribute('aria-disabled')).toBe(false);
    expect(document.activeElement).toBe(conserva);
    expect(screen.getByText('Ubicació amagada').closest('[role="status"]')).toBe(avis);
    fireEvent.click(conserva);
    expect(await screen.findByText(/Este contingut conserva la ubicació per a situar-lo al territori/)).toBeTruthy();
    expect(avis.isConnected).toBe(true);
    expect(avis.textContent).toMatch(/Este contingut conserva la ubicació per a situar-lo al territori/);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Amaga el lloc' }));
  });
});
