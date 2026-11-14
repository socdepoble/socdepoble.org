/**
 * PanellAdjuntsConversa.test.jsx — Proves del gestor net de contingut compartit
 * en una conversa de Xat (Onada R22 · T1).
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import PanellAdjuntsConversa, { extrauContingutConversa } from './PanellAdjuntsConversa.jsx';

const tReserva = (_clau, reserva) => reserva;

afterEach(cleanup);

describe('extrauContingutConversa (pura)', () => {
  test('exclou làpides, bloquejats, missatges de sistema, errors i pendents sense seq, i deduplica enllaços per missatge', () => {
    const missatges = [
      { id: 'del-1', seq: 1, tipus: 'imatge', esborrat: true, metadades: { url: 'https://exemple.org/a.jpg' } },
      { id: 'blk-1', seq: 2, tipus: 'text', bloquejat: true, text: 'https://maliciosa.test' },
      { id: 'sys-1', seq: 3, tipus: 'sistema', text: 'https://interna.test' },
      { id: 'err-1', seq: 4, tipus: 'imatge', estatEnviament: 'error', metadades: { url: 'https://exemple.org/b.jpg' } },
      { id: 'pnd-1', seq: null, tipus: 'veu', estatEnviament: 'pendent', metadades: { adjunt: { durada_s: 8 } } },
      {
        id: 'img-1',
        seq: 5,
        sender: 'other',
        author: 'Pepa',
        tipus: 'imatge',
        creatAl: '2026-11-13T10:00:00.000Z',
        text: 'Festa major https://socdepoble.org/festa i https://socdepoble.org/festa',
        metadades: { url: 'https://socdepoble.org/foto.jpg' }
      },
      {
        id: 'vid-1',
        seq: 6,
        sender: 'me',
        tipus: 'video',
        creatAl: '2026-11-13T11:00:00.000Z',
        text: 'Resum en vídeo',
        metadades: { adjunt: { id: 'adj-v1', url: 'https://socdepoble.org/video.mp4' } }
      },
      {
        id: 'veu-1',
        seq: 7,
        sender: 'other',
        author: 'Batiste',
        tipus: 'veu',
        creatAl: '2026-11-13T12:00:00.000Z',
        metadades: { adjunt: { id: 'adj-a1', durada_s: 14.4 } }
      },
      {
        id: 'llista-1',
        seq: 8,
        sender: 'me',
        tipus: 'llista_comu',
        creatAl: '2026-11-13T13:00:00.000Z',
        metadades: { llista: { titol: 'Compra cooperativa' } }
      }
    ];

    const resultat = extrauContingutConversa(missatges, tReserva);
    expect(resultat.media.map((x) => x.missatgeId)).toEqual(['vid-1', 'img-1']);
    expect(resultat.enllacos).toHaveLength(1);
    expect(resultat.enllacos[0].enllac.href).toBe('https://socdepoble.org/festa');
    expect(resultat.altres.map((x) => x.missatgeId)).toEqual(['llista-1', 'veu-1']);
    expect(resultat.altres[1].duradaSegons).toBe(14);
  });
});

describe('PanellAdjuntsConversa · pestanyes WAI-ARIA, salt al missatge i Escape', () => {
  test('navega entre pestanyes amb teclat (ArrowRight, ArrowLeft, End, Home), salta al missatge i retorna el focus a l’obridor amb Escape', () => {
    const obridor = document.createElement('button');
    obridor.textContent = 'Opcions';
    document.body.appendChild(obridor);

    const onTanca = vi.fn();
    const onVesAlMissatge = vi.fn();

    const missatges = [
      {
        id: 'm-foto',
        seq: 1,
        sender: 'other',
        author: 'Carme',
        tipus: 'imatge',
        creatAl: '2026-11-13T09:00:00.000Z',
        text: 'Plaça de la vila',
        metadades: { url: 'https://socdepoble.org/placa.jpg' }
      },
      {
        id: 'm-link',
        seq: 2,
        sender: 'me',
        tipus: 'text',
        creatAl: '2026-11-13T09:30:00.000Z',
        text: 'Mireu https://socdepoble.org/agenda'
      }
    ];

    render(
      <PanellAdjuntsConversa
        obert
        onTanca={onTanca}
        obridor={obridor}
        messages={missatges}
        onVesAlMissatge={onVesAlMissatge}
        t={tReserva}
      />
    );

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    for (const tab of tabs) {
      expect(tab.hasAttribute('aria-controls')).toBe(false);
    }
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');

    fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText('socdepoble.org')).toBeTruthy();

    fireEvent.keyDown(tabs[1], { key: 'End' });
    expect(tabs[2].getAttribute('aria-selected')).toBe('true');
    const panellBuit = screen.getByRole('tabpanel');
    expect(panellBuit.getAttribute('tabindex')).toBe('0');

    fireEvent.keyDown(tabs[2], { key: 'Home' });
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: /Mostra al xat/i }));
    expect(onTanca).toHaveBeenCalledTimes(1);
    expect(onVesAlMissatge).toHaveBeenCalledWith('m-foto');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onTanca).toHaveBeenCalledTimes(2);
    expect(document.activeElement).toBe(obridor);

    obridor.remove();
  });
});
