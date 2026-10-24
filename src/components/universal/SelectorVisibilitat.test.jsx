/* T41 (ordre del Mestre, 260928) · «Qui ho pot vore?»: el selector no canvia
   res en silenci; confirmar crida onTria i el consumidor decidix. */
import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { SelectorVisibilitat, TEXTOS_VISIBILITAT } from './SelectorVisibilitat.jsx';
import { textosDeFitxa, bloqueigDeFitxa } from '../../sections/profile/visibilitatFitxa.js';
import { textosDeNota, bloqueigDeNota } from '../../sections/notes/visibilitatNota.js';

afterEach(cleanup);

function Arnes({ inicialObert = true, onTanca = () => {}, ...props }) {
  const [obert, setObert] = useState(inicialObert);
  return (
    <>
      <button type="button" onClick={() => setObert(true)}>Obrir</button>
      <SelectorVisibilitat obert={obert} onTanca={(motiu) => { onTanca(motiu); setObert(false); }} {...props} />
    </>
  );
}

const dialeg = () => screen.getByRole('dialog');
const radio = (nom) => within(dialeg()).getByRole('radio', { name: nom });
const primari = () => within(dialeg()).getByRole('button', { name: (nom) => nom !== 'Tancar' && nom !== 'Cancel·lar' });

test('preselecciona l’estat d’ara i el botó principal diu «deixar-la així»', () => {
  render(<Arnes esPublica={false} textos={textosDeFitxa('persona')} onTria={vi.fn()} />);
  expect(dialeg().className).toContain('sdp-dialeg--barra');
  expect(within(dialeg()).getByRole('heading').textContent).toBe('Qui pot vore la teua fitxa?');
  expect(radio(/Fitxa privada/).checked).toBe(true);
  expect(radio(/Com està ara Fitxa privada/)).toBeTruthy();
  expect(primari().textContent).toBe('Deixar-la privada');
});

test('triar pública i confirmar crida onTria(true) i tanca amb «fet»', async () => {
  const onTria = vi.fn().mockResolvedValue(true);
  const onTanca = vi.fn();
  render(<Arnes esPublica={false} textos={textosDeFitxa('persona')} onTria={onTria} onTanca={onTanca} />);
  act(() => { fireEvent.click(radio(/Fitxa pública/)); });
  expect(primari().textContent).toBe('Fer-la pública');
  // El que el servidor encara no fa per a una persona es diu quan es tria pública.
  expect(within(dialeg()).getByText(/Encara falta una peça al servidor/)).toBeTruthy();
  await act(async () => { fireEvent.click(primari()); });
  expect(onTria).toHaveBeenCalledWith(true);
  expect(onTanca).toHaveBeenCalledWith('fet');
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('un error es pinta en línia (role=alert) i la finestra continua oberta', async () => {
  const onTria = vi.fn().mockRejectedValue(new Error('Sense xarxa'));
  render(<Arnes esPublica textos={textosDeFitxa('persona')} onTria={onTria} />);
  act(() => { fireEvent.click(radio(/Fitxa privada/)); });
  await act(async () => { fireEvent.click(primari()); });
  expect(within(dialeg()).getByRole('alert').textContent).toContain('Sense xarxa');
  expect(dialeg()).toBeTruthy();
});

test('AbortError (la sessió ha canviat) tanca en silenci, sense cap alerta', async () => {
  const onTria = vi.fn().mockRejectedValue(new DOMException('canvi', 'AbortError'));
  const onTanca = vi.fn();
  render(<Arnes esPublica textos={textosDeFitxa('persona')} onTria={onTria} onTanca={onTanca} />);
  await act(async () => { fireEvent.click(primari()); });
  expect(onTanca).toHaveBeenCalledWith('fet');
  expect(screen.queryByRole('alert')).toBeNull();
});

test('si el consumidor torna false, es queda oberta (ell ja ho ha dit)', async () => {
  const onTria = vi.fn().mockResolvedValue(false);
  render(<Arnes esPublica={false} textos={textosDeNota()} onTria={onTria} />);
  act(() => { fireEvent.click(radio(/Publicada al Mur/)); });
  await act(async () => { fireEvent.click(primari()); });
  expect(onTria).toHaveBeenCalledWith(true);
  expect(dialeg()).toBeTruthy();
  expect(screen.queryByRole('alert')).toBeNull();
});

test('mentre treballa: aria-busy, i ni Escape ni Cancel·lar la tanquen', async () => {
  let resol;
  const onTria = vi.fn(() => new Promise((r) => { resol = r; }));
  const onTanca = vi.fn();
  render(<Arnes esPublica={false} textos={textosDeFitxa('persona')} onTria={onTria} onTanca={onTanca} />);
  act(() => { fireEvent.click(radio(/Fitxa pública/)); });
  act(() => { fireEvent.click(primari()); });
  const ocupat = within(dialeg()).getByRole('button', { name: 'Treballant…' });
  expect(ocupat.getAttribute('aria-busy')).toBe('true');
  act(() => { fireEvent(dialeg(), new Event('cancel', { cancelable: true })); });
  expect(within(dialeg()).getByRole('button', { name: 'Cancel·lar' }).disabled).toBe(true);
  expect(onTanca).not.toHaveBeenCalled();
  await act(async () => { resol(true); });
  expect(onTanca).toHaveBeenCalledWith('fet');
});

/* Poliment T41 (ordre del Mestre, 260928) · Dos Escape seguits: el navegador
   tanca el <dialog> pel seu compte encara que treballe. El selector ho
   accepta (si no, la bola i PUBLICAR ja no el reobririen) i l'error que arriba
   després es conserva per a la pròxima obertura: ningú el perd de vista. */
test('mentre treballa, un tancament natiu forçat s’accepta i l’error posterior ix en tornar a obrir', async () => {
  let rebutja;
  const onTria = vi.fn(() => new Promise((_r, e) => { rebutja = e; }));
  const onTanca = vi.fn();
  render(<Arnes esPublica={false} textos={textosDeFitxa('persona')} onTria={onTria} onTanca={onTanca} />);
  act(() => { fireEvent.click(radio(/Fitxa pública/)); });
  act(() => { fireEvent.click(primari()); });
  const d = dialeg();
  act(() => {
    d.removeAttribute('open');
    d.dispatchEvent(new Event('close'));
  });
  expect(onTanca).toHaveBeenCalledWith('esc');
  expect(screen.queryByRole('dialog')).toBeNull();
  await act(async () => { rebutja(new Error('Sense xarxa')); });
  expect(screen.queryByRole('alert')).toBeNull();
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Obrir' })); });
  expect(within(dialeg()).getByRole('alert').textContent).toContain('Sense xarxa');
  // Continua on ho havia deixat: la tria que ha fallat, a punt de tornar-la a provar.
  expect(radio(/Fitxa pública/).checked).toBe(true);
  expect(primari().disabled).toBe(false);
});

test('el bloqueig desactiva eixa opció i diu per què; l’agent no promet desfer res', () => {
  render(<Arnes esPublica textos={textosDeFitxa('agent')} bloqueig={bloqueigDeFitxa('agent')} onTria={vi.fn()} />);
  expect(radio(/Fitxa privada/).disabled).toBe(true);
  expect(within(dialeg()).getByRole('status').textContent).toMatch(/agent IA sempre és pública/);
  expect(within(dialeg()).queryByText(/tornar a fer privada quan vulgues/)).toBeNull();
});

/* Correcció C20 (260928) · En una pantalla curta el motiu quedava davall del plec. */
test('C20 · el motiu del bloqueig es pinta ABANS de les opcions (després de «Publicaràs com a»)', () => {
  render(<Arnes esPublica textos={textosDeNota()} bloqueig={bloqueigDeNota({ publicada: true })} onTria={vi.fn()} comNom="Pep" />);
  const motiu = within(dialeg()).getByRole('status');
  const opcions = within(dialeg()).getByRole('group');
  const com = within(dialeg()).getByText(/Publicaràs com a/);
  expect(motiu.compareDocumentPosition(opcions) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(com.compareDocumentPosition(motiu) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

test('el text «reversible» només ix on és cert: fitxa sí, nota publicada no', () => {
  render(<Arnes esPublica={false} textos={textosDeFitxa('organitzacio')} onTria={vi.fn()} />);
  expect(within(dialeg()).getByText(/la pots tornar a fer privada quan vulgues/)).toBeTruthy();
  expect(radio(/Fitxa privada/).closest('.sdp-targeta-opcio').textContent).toContain('membres');
  cleanup();
  render(<Arnes esPublica textos={textosDeNota()} bloqueig={bloqueigDeNota({ publicada: true })} onTria={vi.fn()} />);
  expect(within(dialeg()).queryByText(/tornar a fer privada quan vulgues/)).toBeNull();
  expect(radio(/Privada \(només visible per a tu\)/).disabled).toBe(true);
  expect(primari().textContent).toBe('Actualitzar al Mur');
  expect(within(dialeg()).getByRole('status').textContent).toMatch(/encara no té contracte de dades/);
});

test('publicar una nota avisa que encara no es pot retirar del Mur', () => {
  render(<Arnes esPublica={false} textos={textosDeNota()} onTria={vi.fn()} comNom="Pep" />);
  expect(within(dialeg()).getByText(/Publicaràs com a/).textContent).toBe('Publicaràs com a Pep.');
  expect(within(dialeg()).queryByText(/encara no es pot retirar/)).toBeNull();
  act(() => { fireEvent.click(radio(/Publicada al Mur/)); });
  expect(within(dialeg()).getByText(/encara no es pot retirar/)).toBeTruthy();
});

test('en tornar a obrir es reinicia la tria i l’error', async () => {
  const onTria = vi.fn().mockRejectedValue(new Error('x'));
  render(<Arnes esPublica={false} textos={TEXTOS_VISIBILITAT} onTria={onTria} />);
  act(() => { fireEvent.click(radio(/Públic/)); });
  await act(async () => { fireEvent.click(primari()); });
  expect(screen.getByRole('alert')).toBeTruthy();
  act(() => { fireEvent.click(within(dialeg()).getByRole('button', { name: 'Cancel·lar' })); });
  expect(screen.queryByRole('dialog')).toBeNull();
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Obrir' })); });
  expect(radio(/Privat/).checked).toBe(true);
  expect(screen.queryByRole('alert')).toBeNull();
});
