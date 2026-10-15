/* Pla 261014_1450 (front C) · Qui signa el que s'envia. No ho decidix la
   barra negra sinó el servidor, per fil (xat_participants.com_org_id →
   fil.comEntitat; als Avisos, qui hi pot escriure signa com l'entitat). La
   barra només fa que, si diu una entitat i el fil el signa la persona, també
   es diga. Els fils passen per mapejaFil: la forma de veres que llig la UI. */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import { mapejaFil } from '../missatges.js';
import Compositor, { quiSigna } from './Compositor.jsx';

const t = (_, alternativa) => alternativa;
const SDP = Object.freeze({ id: 'socdepoble', nom: 'Sóc de Poble', avatar: '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png' });
const FORN = Object.freeze({ id: 'forn', nom: 'Forn de la Torre', avatar: null });

/* El canal d'una entitat on parles en nom seu (crea_fil_directe: qui la gestiona hi entra amb com_org_id). */
const canalDeLEntitat = () => mapejaFil({ id: 'canal', tipus: 'directe', titol: 'Toni Pastor', comEntitat: true, entitatId: 'socdepoble', entitatNom: 'Sóc de Poble' });
/* Els Avisos de l'entitat per a qui la gestiona: la llavor no hi posa comEntitat (localXat.js, conversaDe). */
const avisos = (rol) => mapejaFil({ id: 'avisos', tipus: 'canal', titol: 'Avisos', rol, comEntitat: false, entitatId: 'socdepoble', entitatNom: 'Sóc de Poble' });
/* Un xat personal: signa la persona. */
const directe = () => mapejaFil({ id: 'd-1', tipus: 'directe', titol: 'Pepa', altresNoms: ['Pepa'] });

afterEach(cleanup);

describe('quiSigna (pura)', () => {
  test('on parles en nom d’una entitat (comEntitat amb entitatNom), signa ella, trie el que trie la barra', () => {
    expect(quiSigna(canalDeLEntitat())).toEqual({ tipus: 'entitat', nom: 'Sóc de Poble' });
    expect(quiSigna(canalDeLEntitat(), FORN)).toEqual({ tipus: 'entitat', nom: 'Sóc de Poble' });
  });

  test('als Avisos, qui hi pot escriure signa com l’entitat; qui no hi pot escriure, no', () => {
    expect(avisos('admin').potEscriure).toBe(true);
    expect(quiSigna(avisos('admin'))).toEqual({ tipus: 'entitat', nom: 'Sóc de Poble' });
    expect(quiSigna(avisos('propietari'), SDP)).toEqual({ tipus: 'entitat', nom: 'Sóc de Poble' });
    expect(avisos('membre').potEscriure).toBe(false);
    expect(quiSigna(avisos('membre'))).toBeNull();
  });

  test('amb una entitat activa a la barra, en un fil on signa la persona, es diu que ací no parles en nom seu', () => {
    expect(quiSigna(directe(), SDP)).toEqual({ tipus: 'persona', entitat: 'Sóc de Poble' });
    /* Uns Avisos sense entitat (cap org al fil) els signa la persona. */
    const avisosSenseEntitat = mapejaFil({ id: 'a-torre', tipus: 'canal', titol: 'Avisos', rol: 'admin' });
    expect(quiSigna(avisosSenseEntitat, SDP)).toEqual({ tipus: 'persona', entitat: 'Sóc de Poble' });
  });

  test('si el servidor diu que signa l’entitat però no en dona el nom, no es diu res (ni «com a tu»)', () => {
    expect(quiSigna(mapejaFil({ id: 'x', tipus: 'directe', comEntitat: true }), SDP)).toBeNull();
    expect(quiSigna(mapejaFil({ id: 'x', tipus: 'directe', comEntitat: true }))).toBeNull();
  });

  test('sense entitat activa i sense veu d’entitat al fil, no cal dir res', () => {
    expect(quiSigna(directe())).toBeNull();
    expect(quiSigna(directe(), null)).toBeNull();
    expect(quiSigna(directe(), { id: 'sense-nom', nom: null, avatar: null })).toBeNull();
    expect(quiSigna(null, SDP)).toBeNull();
  });
});

function pinta(props) {
  return render(
    <AppGridContext.Provider value={{ mida: 'ample', setPanellObert: vi.fn() }}>
      <Compositor valor="" onCanvia={vi.fn()} onEnvia={vi.fn()} t={t} {...props} />
    </AppGridContext.Provider>
  );
}

describe('la línia de qui signa', () => {
  test('al canal de l’entitat: «Escrius com a …», amb la classe de l’avís públic i la icona d’edifici', () => {
    const { container } = pinta({ fil: canalDeLEntitat() });
    const avis = container.querySelector('.sdp-xat-avis-public');
    expect(avis.textContent).toBe('Escrius com a Sóc de Poble.');
    expect(avis.querySelector('svg.lucide-building-2').getAttribute('aria-hidden')).toBe('true');
    expect(avis.nextElementSibling.tagName).toBe('FORM');
  });

  test('en un fil personal amb una entitat activa: «Escrius com a tu…», amb la icona de persona', () => {
    const { container } = pinta({ fil: directe(), entitatActiva: SDP });
    const avis = container.querySelector('.sdp-xat-avis-public');
    expect(avis.textContent).toBe('Escrius com a tu: en esta conversa no parles en nom de Sóc de Poble.');
    expect(avis.querySelector('svg.lucide-user-round')).toBeTruthy();
  });

  test('sense entitat activa en un fil personal, cap línia (Llei del Píxel)', () => {
    const { container } = pinta({ fil: directe() });
    expect(container.querySelector('.sdp-xat-avis-public')).toBeNull();
    expect(container.firstElementChild.tagName).toBe('FORM');
  });

  test('als Avisos de només lectura, cap línia: hi ha l’avís dels administradors', () => {
    const { container } = pinta({ fil: avisos('membre'), entitatActiva: SDP });
    expect(container.querySelector('.sdp-xat-avis-public')).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('En Avisos només escriuen els administradors.');
  });

  test('en un xat de pàgina, l’avís públic va primer i després qui signa', () => {
    const subjecte = { tipus: 'pagina', id: '/fedivers', ruta: '/fedivers', titol: 'Fedivers' };
    const { container } = pinta({ fil: mapejaFil({ id: 'g-1', tipus: 'grup', titol: 'Fedivers', subjecte }), entitatActiva: SDP });
    expect([...container.querySelectorAll('.sdp-xat-avis-public')].map((p) => p.textContent)).toEqual([
      'Escrius al xat públic de «Fedivers».',
      'Escrius com a tu: en esta conversa no parles en nom de Sóc de Poble.'
    ]);
  });

  /* L'avís va sempre a la primera posició del fragment: si la línia apareix o
     desapareix dins del mateix àmbit (el nom de l'entitat que arriba tard, el
     fil que refresca comEntitat), el camp no es torna a muntar ni perd el
     focus. Ací `entitatActiva` null fa el mateix que una entitat encara sense
     nom (quiSigna torna null en tots dos casos). Canviar d'actor a la barra
     negra és un altre cas: canvia ambitEstable i XatSection torna a muntar
     l'espai sencer per key. */
  test('aparéixer o desaparéixer la línia dins del mateix àmbit no torna a muntar el camp', () => {
    const fil = directe();
    const onCanvia = vi.fn();
    const { rerender } = pinta({ fil, onCanvia });
    const camp = screen.getByRole('textbox', { name: 'Escriu un missatge' });
    camp.focus();
    const torna = (entitatActiva) => rerender(
      <AppGridContext.Provider value={{ mida: 'ample', setPanellObert: vi.fn() }}>
        <Compositor valor="" onCanvia={onCanvia} onEnvia={vi.fn()} t={t} fil={fil} entitatActiva={entitatActiva} />
      </AppGridContext.Provider>
    );
    torna(SDP);
    expect(screen.getByText('Escrius com a tu: en esta conversa no parles en nom de Sóc de Poble.')).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Escriu un missatge' })).toBe(camp);
    expect(document.activeElement).toBe(camp);
    torna(null);
    expect(screen.queryByText(/Escrius com a/)).toBeNull();
    expect(screen.getByRole('textbox', { name: 'Escriu un missatge' })).toBe(camp);
    expect(document.activeElement).toBe(camp);
    fireEvent.change(camp, { target: { value: 'hola' } });
    expect(onCanvia).toHaveBeenCalledWith('hola');
  });

  /* Pla 261014_1450 (front C) · La línia descriu el camp (aria-describedby),
     junt amb el comptador quan es mostra; cada id només si l'element hi és. */
  test('la línia de qui signa és la descripció accessible del camp; sense línia, cap id penjat', () => {
    const camp = () => screen.getByRole('textbox', { name: 'Escriu un missatge' });
    const descripcio = (el) => (el.getAttribute('aria-describedby') || '').split(' ').filter(Boolean)
      .map((id) => document.getElementById(id)?.textContent ?? `(id penjat: ${id})`).join(' ');

    pinta({ fil: canalDeLEntitat() });
    expect(camp().getAttribute('aria-describedby')).toBe('xat-message-signa');
    expect(descripcio(camp())).toContain('Escrius com a Sóc de Poble.');
    cleanup();

    pinta({ fil: directe(), entitatActiva: SDP });
    expect(descripcio(camp())).toContain('Escrius com a tu: en esta conversa no parles en nom de Sóc de Poble.');
    cleanup();

    /* Amb el comptador visible, tots dos. */
    pinta({ fil: canalDeLEntitat(), valor: 'a'.repeat(3900) });
    expect(camp().getAttribute('aria-describedby')).toBe('xat-message-signa xat-message-comptador');
    expect(descripcio(camp())).toBe('Escrius com a Sóc de Poble. 3900 de 4096 caràcters');
    cleanup();

    /* Sense línia: ni atribut ni id. */
    pinta({ fil: directe() });
    expect(camp().hasAttribute('aria-describedby')).toBe(false);
    expect(document.getElementById('xat-message-signa')).toBeNull();
    cleanup();

    /* Sense línia i amb comptador: només el comptador. */
    pinta({ fil: directe(), valor: 'a'.repeat(3900) });
    expect(camp().getAttribute('aria-describedby')).toBe('xat-message-comptador');
    expect(document.getElementById('xat-message-signa')).toBeNull();
  });
});
