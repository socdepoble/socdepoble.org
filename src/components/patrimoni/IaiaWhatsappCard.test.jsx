import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import IaiaWhatsappCard from './IaiaWhatsappCard.jsx';

afterEach(cleanup);

/** P0-41 (llei de vocabulari del Mestre, 261107): els adjectius vetats en les 5 llengües, escrits per trossos. */
const VETATS_P041 = new RegExp([['so', 'bir'], ['so', 'beran'], ['sove', 'reign'], ['buru', 'jabe']].map((p) => p.join('')).join('|'), 'i');

describe('IDEA-171 · IaiaWhatsappCard, el WhatsApp de la IAIA (2n Número WhatsApp + Hermes Gateway + Node 0)', () => {
  test.each([
    ['ca', 'El WhatsApp de la IAIA · Mapa Honest del Saber de Poble', ['Pont', 'Node', 'Models', 'Memòria i corpus']],
    ['es', 'El WhatsApp de la IAIA · Mapa Honesto del Saber de Pueblo', ['Puente', 'Nodo', 'Modelos', 'Memoria y corpus']],
    ['en', 'The IAIA’s WhatsApp · Honest Village Knowledge Map', ['Bridge', 'Node', 'Models', 'Memory and corpus']],
    ['eu', 'IAIAren WhatsAppa · Herriko Jakintzaren Mapa Zintzoa', ['Zubia', 'Nodoa', 'Ereduak', 'Memoria eta corpusa']],
    ['gl', 'O WhatsApp da IAIA · Mapa Honesto do Saber de Aldea', ['Ponte', 'Nodo', 'Modelos', 'Memoria e corpus']],
  ])('%s: renderitza els 7 dominis (2 en preparació), l’arquitectura Node 0 traduïda, sense IP de LAN i zero atributs [style] inline', (lang, title, dts) => {
    const { container } = render(<IaiaWhatsappCard language={lang} />);
    expect(screen.getByRole('heading', { name: title })).toBeTruthy();
    expect(container.querySelectorAll('[data-domain-item]')).toHaveLength(7);
    expect(container.querySelectorAll('[data-domain-estat="en-preparacio"]')).toHaveLength(2);
    expect([...container.querySelectorAll('dt')].map((n) => n.textContent)).toEqual(dts);
    expect(container.textContent).toContain('Hermes WhatsApp Gateway');
    expect(container.textContent).toContain('iaia:latest');
    expect(container.textContent).toContain('hermes3:8b');
    expect(container.textContent).toContain('SQLite FTS5');
    expect(container.textContent).not.toContain('192.168.');
    expect(container.textContent).not.toContain('/Users/');
    expect(container.textContent).not.toMatch(VETATS_P041);
    expect(container.querySelector('[style]')).toBeNull();
  });

  test('permet provar el simulador tant en dominis verificats com en consultes fora de corpus (humilitat activa)', () => {
    const { getByTestId } = render(<IaiaWhatsappCard language="ca" />);
    const select = getByTestId('iaia-whatsapp-domain-select');

    expect(getByTestId('iaia-whatsapp-trajectory-tag').textContent).toContain('[SEQUENCE]');
    expect(getByTestId('iaia-whatsapp-reply-text').textContent).toContain('9,80 m');

    fireEvent.change(select, { target: { value: 'oli-oliva-la-torre' } });
    expect(getByTestId('iaia-whatsapp-reply-text').textContent).toContain('Alfafarenca');
    expect(getByTestId('iaia-whatsapp-reply-text').textContent).toContain('7 formats');

    fireEvent.change(select, { target: { value: 'batec-de-vida-i-emergencies-offline' } });
    expect(getByTestId('iaia-whatsapp-trajectory-tag').textContent).toContain('[DISCOVERY]');
    expect(getByTestId('iaia-whatsapp-reply-text').textContent).toContain('no avisa ningú');

    fireEvent.change(select, { target: { value: 'unverified' } });
    fireEvent.click(getByTestId('iaia-whatsapp-send-btn'));
    expect(getByTestId('iaia-whatsapp-trajectory-tag').textContent).toContain('[DISCOVERY]');
    expect(getByTestId('iaia-whatsapp-reply-text').textContent).toContain('no s’inventa mai cap dada');
    expect(getByTestId('iaia-whatsapp-reply-sources').textContent).toContain('Cap font verificada encara.');
  });

  test('una pregunta escrita només compta en prémer «Envia», i fora de la mostra no rep el segell de verificat', () => {
    const { getByTestId } = render(<IaiaWhatsappCard language="ca" />);
    fireEvent.change(getByTestId('iaia-whatsapp-prompt-input'), { target: { value: 'Quin temps farà demà a Alcoi?' } });
    expect(getByTestId('iaia-whatsapp-reply-text').textContent).toContain('9,80 m');

    fireEvent.click(getByTestId('iaia-whatsapp-send-btn'));
    expect(getByTestId('iaia-whatsapp-effective-question').textContent).toContain('Quin temps farà demà a Alcoi?');
    expect(getByTestId('iaia-whatsapp-trajectory-tag').textContent).toContain('[DISCOVERY]');
    expect(getByTestId('iaia-whatsapp-trajectory-tag').textContent).not.toContain('VERIFICAT');
    expect(getByTestId('iaia-whatsapp-reply-text').textContent).not.toContain('9,80 m');
  });
});
