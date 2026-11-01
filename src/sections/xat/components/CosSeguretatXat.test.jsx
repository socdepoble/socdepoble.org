/* P1-12 pas 17 (pla 261101_1246, T7 · S5) · El cos presentacional del panell
   «Xifratge i número de seguretat»: els 12 grups en un grup amb nom, {nom}
   omplit tal qual, la marca que alterna, un text per estat i res que no siga
   cert (cap número fora d'un directe, cap número mal format), i l'anglés amb
   el traductor de l'app. */
import '../../../../tests/helpers/diccionaris.js';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createTranslator } from '../../../config/i18n.js';
import { estatXifratgeDelFil } from '../estatXifratgeFil.js';
import CosSeguretatXat from './CosSeguretatXat.jsx';

afterEach(cleanup);

const ca = createTranslator('ca');
const NUMERO = '04126 39587 61203 88451 27904 53316 70258 19643 95072 31480 66817 42935';
const abast = (motiu, tipusFil, { xifrat = true, bloquejat = false } = {}) => ({ xifrat, bloquejat, motiu, tipusFil });
const DIRECTE = estatXifratgeDelFil({ actiu: true, abast: abast('directe-persona', 'directe'), entornSegur: true });
const GRUP = estatXifratgeDelFil({ actiu: true, abast: abast('grup-privat', 'grup'), entornSegur: true });
const PUBLIC = estatXifratgeDelFil({ actiu: true, abast: abast('public', null, { xifrat: false }), entornSegur: true });
const llest = (extres = {}) => ({ estat: 'llest', numero: NUMERO, kid: 'k', verificat: false, avis: null, ocupat: false, ...extres });
/** El text de cada regió d'estat, en l'ordre del panell (les buides també). */
const textosDEstat = () => screen.getAllByRole('status').map((regio) => regio.textContent);

describe('directe entre dues persones', () => {
  test('el número en 12 grups dins d’un grup amb nom, què vol dir amb el nom, i «Marca com a verificat»', () => {
    const onMarca = vi.fn();
    const { container } = render(<CosSeguretatXat estat={DIRECTE} nom="Pepa" numero={llest()} onMarca={onMarca} t={ca} />);
    const grup = screen.getByRole('group', { name: 'Número de seguretat' });
    expect(grup.className).toBe('sdp-xat-numero');
    expect([...grup.querySelectorAll('span')].map((s) => s.textContent)).toEqual(NUMERO.split(' '));
    expect(screen.getByText(/^Els missatges i els fitxers d’este xat es xifren/)).toBeTruthy();
    expect(screen.getByText('Si este número és igual al teu aparell i al de Pepa, ningú no ha canviat les vostres claus pel camí. Compareu-lo en persona o per telèfon.')).toBeTruthy();
    expect(screen.queryByText(/^Verificat:/)).toBeNull();
    const boto = screen.getByRole('button', { name: 'Marca com a verificat' });
    expect(boto.className).toContain('sdp-boto');
    fireEvent.click(boto);
    expect(onMarca).toHaveBeenCalledWith(true);
    expect(container.querySelector('[style]')).toBeNull();
    expect(container.querySelector('ul, ol')).toBeNull();
  });

  test('verificat: la línia amb el nom i el botó que lleva la marca', () => {
    const onMarca = vi.fn();
    render(<CosSeguretatXat estat={DIRECTE} nom="Pepa" numero={llest({ verificat: true })} onMarca={onMarca} t={ca} />);
    expect(screen.getByText('Verificat: has comparat este número amb Pepa.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Lleva la marca de verificat' }));
    expect(onMarca).toHaveBeenCalledWith(false);
  });

  test('un nom amb patrons de replace es pinta tal qual', () => {
    render(<CosSeguretatXat estat={DIRECTE} nom="Bar $& Co" numero={llest({ verificat: true })} t={ca} />);
    expect(screen.getByText('Verificat: has comparat este número amb Bar $& Co.')).toBeTruthy();
  });

  test('desant: «Treballant…» i desactivat', () => {
    render(<CosSeguretatXat estat={DIRECTE} nom="Pepa" numero={llest({ ocupat: true })} onMarca={() => {}} t={ca} />);
    const boto = screen.getByRole('button');
    expect(boto.disabled).toBe(true);
    expect(boto.textContent).toBe('Treballant…');
  });

  test.each([
    ['calculant', 'Calculant el número de seguretat…'],
    ['sense-clau', 'Pepa encara no ha activat els xats privats xifrats en cap aparell: encara no hi ha cap número que comparar.'],
    ['sense-claus-propies', 'Este aparell encara no té les teues claus dels xats privats: encara no hi ha cap número que comparar.'],
    ['clau-canviada', 'Pepa té una clau de seguretat nova que la clau anterior no ha confirmat. Passa quan algú perd l’aparell i la frase, o si algú s’ha posat pel mig. Parla amb Pepa per a saber què ha passat.'],
    ['error', 'No s’ha pogut calcular el número de seguretat. Torna-ho a provar.']
  ])('%s: el seu text i cap número ni botó', (estat, text) => {
    render(<CosSeguretatXat estat={DIRECTE} nom="Pepa" numero={{ estat }} onMarca={() => {}} t={ca} />);
    expect(screen.getByText(text)).toBeTruthy();
    expect(screen.queryByRole('group')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('«Calculant…» és una línia d’estat; l’error, una alerta', () => {
    render(<CosSeguretatXat estat={DIRECTE} nom="Pepa" numero={{ estat: 'calculant' }} t={ca} />);
    expect(textosDEstat()).toEqual(['Calculant el número de seguretat…', '']);
    cleanup();
    render(<CosSeguretatXat estat={DIRECTE} nom="Pepa" numero={{ estat: 'error' }} t={ca} />);
    expect(screen.getByRole('alert').textContent).toBe('No s’ha pogut calcular el número de seguretat. Torna-ho a provar.');
  });

  test('la clau ha canviat mentre es mirava: l’avís i el número nou; una fallada en desar: l’alerta', () => {
    render(<CosSeguretatXat estat={DIRECTE} nom="Pepa" numero={llest({ avis: 'canviat' })} onMarca={() => {}} t={ca} />);
    expect(textosDEstat().filter(Boolean)).toEqual(['La clau de Pepa ha canviat mentre miraves el número. Compareu este número nou abans de marcar-lo.']);
    expect(screen.getByRole('group', { name: 'Número de seguretat' })).toBeTruthy();
    cleanup();
    render(<CosSeguretatXat estat={DIRECTE} nom="Pepa" numero={llest({ avis: 'errorMarca' })} onMarca={() => {}} t={ca} />);
    expect(screen.getByRole('alert').textContent).toBe('No s’ha pogut desar la marca. Torna-ho a provar.');
  });

  /* Gauntlet T7b-G03 · «Compareu este número nou» sense cap número al costat seria fals. */
  test('l’avís «canviat» sense número (calculant, clau canviada o error) no es pinta', () => {
    for (const estat of ['calculant', 'clau-canviada', 'error']) {
      render(<CosSeguretatXat estat={DIRECTE} nom="Pepa" numero={{ estat, avis: 'canviat' }} onMarca={() => {}} t={ca} />);
      expect(screen.queryByText(/ha canviat mentre miraves/)).toBeNull();
      cleanup();
    }
  });

  /* Gauntlet T7b-G06 · El resultat de la marca s'anuncia i el focus no es perd. */
  test('la línia «Verificat…» és una línia d’estat', () => {
    render(<CosSeguretatXat estat={DIRECTE} nom="Pepa" numero={llest({ verificat: true })} onMarca={() => {}} t={ca} />);
    expect(textosDEstat()).toEqual(['', ' Verificat: has comparat este número amb Pepa.']);
  });

  /* Gauntlet UI-02 · Una regió viva que naix plena no s'anuncia de manera
     fiable: les dues línies d'estat hi són, buides, abans que l'estat canvie,
     i és el mateix node el que rep el text. Buides, amagades i fora del flux. */
  test('marcar: la regió de «Verificat…» ja hi és, buida i amagada, i el mateix node rep el text', () => {
    const { rerender } = render(<CosSeguretatXat estat={DIRECTE} nom="Pepa" numero={llest()} onMarca={() => {}} t={ca} />);
    const [calcul, verificat] = screen.getAllByRole('status');
    expect([calcul.textContent, verificat.textContent]).toEqual(['', '']);
    expect([calcul.className, verificat.className]).toEqual(['sdp-nomes-lector', 'sdp-nomes-lector']);
    expect(verificat.querySelector('svg')).toBeNull();
    rerender(<CosSeguretatXat estat={DIRECTE} nom="Pepa" numero={llest({ ocupat: true })} onMarca={() => {}} t={ca} />);
    rerender(<CosSeguretatXat estat={DIRECTE} nom="Pepa" numero={llest({ verificat: true })} onMarca={() => {}} t={ca} />);
    expect(screen.getAllByRole('status')[1]).toBe(verificat);
    expect(verificat.textContent).toBe(' Verificat: has comparat este número amb Pepa.');
    expect(verificat.hasAttribute('class')).toBe(false);
    // Treure la marca: el mateix node es buida i torna a amagar-se.
    rerender(<CosSeguretatXat estat={DIRECTE} nom="Pepa" numero={llest()} onMarca={() => {}} t={ca} />);
    expect(screen.getAllByRole('status')[1]).toBe(verificat);
    expect([verificat.textContent, verificat.className]).toEqual(['', 'sdp-nomes-lector']);
  });

  test('calcular: la regió de «Calculant…» ja hi és; en acabar es buida, i «Verificat…» arriba a la seua', () => {
    const { rerender } = render(<CosSeguretatXat estat={DIRECTE} nom="Pepa" numero={{ estat: 'inactiu' }} onMarca={() => {}} t={ca} />);
    const [calcul, verificat] = screen.getAllByRole('status');
    expect([calcul.textContent, verificat.textContent]).toEqual(['', '']);
    rerender(<CosSeguretatXat estat={DIRECTE} nom="Pepa" numero={{ estat: 'calculant' }} onMarca={() => {}} t={ca} />);
    expect(screen.getAllByRole('status')).toEqual([calcul, verificat]);
    expect([calcul.textContent, calcul.hasAttribute('class')]).toEqual(['Calculant el número de seguretat…', false]);
    rerender(<CosSeguretatXat estat={DIRECTE} nom="Pepa" numero={llest({ verificat: true })} onMarca={() => {}} t={ca} />);
    expect(screen.getAllByRole('status')).toEqual([calcul, verificat]);
    expect([calcul.textContent, calcul.className]).toEqual(['', 'sdp-nomes-lector']);
    expect(verificat.textContent).toBe(' Verificat: has comparat este número amb Pepa.');
  });

  test('«Verificat…» mai sense número: ni amb un número mal format ni sense número', () => {
    render(<CosSeguretatXat estat={DIRECTE} nom="Pepa" numero={llest({ verificat: true, numero: '12345 67890' })} onMarca={() => {}} t={ca} />);
    expect(textosDEstat()).toEqual(['', '']);
    cleanup();
    render(<CosSeguretatXat estat={DIRECTE} nom="Pepa" numero={{ estat: 'clau-canviada', verificat: true }} onMarca={() => {}} t={ca} />);
    expect(screen.queryByText(/Verificat:/)).toBeNull();
  });

  test('en acabar de desar, si el focus ha caigut al body, torna al botó; si és en un altre lloc, no el mou', () => {
    const { rerender } = render(<CosSeguretatXat estat={DIRECTE} nom="Pepa" numero={llest()} onMarca={() => {}} t={ca} />);
    screen.getByRole('button').focus();
    rerender(<CosSeguretatXat estat={DIRECTE} nom="Pepa" numero={llest({ ocupat: true })} onMarca={() => {}} t={ca} />);
    /* El navegador trau el focus d'un botó que es desactiva (la regla de «focus
       fixup»); jsdom no ho fa, i ací el focus cau al body traient un element enfocat. */
    const temporal = document.createElement('button');
    document.body.append(temporal);
    temporal.focus();
    temporal.remove();
    expect(document.activeElement).toBe(document.body);
    rerender(<CosSeguretatXat estat={DIRECTE} nom="Pepa" numero={llest({ verificat: true })} onMarca={() => {}} t={ca} />);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Lleva la marca de verificat' }));

    const fora = document.createElement('input');
    document.body.append(fora);
    rerender(<CosSeguretatXat estat={DIRECTE} nom="Pepa" numero={llest({ verificat: true, ocupat: true })} onMarca={() => {}} t={ca} />);
    fora.focus();
    rerender(<CosSeguretatXat estat={DIRECTE} nom="Pepa" numero={llest()} onMarca={() => {}} t={ca} />);
    expect(document.activeElement).toBe(fora);
    fora.remove();
  });

  test('si en acabar ja no hi ha botó (clau canviada), el focus va al primer botó del diàleg', () => {
    const dialeg = document.createElement('dialog');
    const tanca = document.createElement('button');
    tanca.textContent = 'Tanca';
    dialeg.append(tanca);
    const lloc = document.createElement('div');
    dialeg.append(lloc);
    document.body.append(dialeg);
    const { rerender } = render(<CosSeguretatXat estat={DIRECTE} nom="Pepa" numero={llest({ ocupat: true })} onMarca={() => {}} t={ca} />, { container: lloc });
    rerender(<CosSeguretatXat estat={DIRECTE} nom="Pepa" numero={{ estat: 'calculant' }} onMarca={() => {}} t={ca} />);
    expect(document.activeElement).toBe(document.body);
    rerender(<CosSeguretatXat estat={DIRECTE} nom="Pepa" numero={{ estat: 'clau-canviada' }} onMarca={() => {}} t={ca} />);
    expect(document.activeElement).toBe(tanca);
    cleanup();
    dialeg.remove();
  });

  test('un número que no són 12 grups de 5 xifres no es pinta', () => {
    render(<CosSeguretatXat estat={DIRECTE} nom="Pepa" numero={llest({ numero: '12345 67890' })} onMarca={() => {}} t={ca} />);
    expect(screen.queryByRole('group')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('sense número', () => {
  test('grup privat: l’avís i on es compara, cap número encara que n’arribe un', () => {
    render(<CosSeguretatXat estat={GRUP} nom="Les Comares" numero={llest()} onMarca={() => {}} t={ca} />);
    expect(screen.getByText('En un grup, el número de seguretat es compara amb cada persona des del vostre xat privat.')).toBeTruthy();
    expect(screen.queryByRole('group')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('xat públic: diu que no és xifrat d’extrem a extrem', () => {
    const { container } = render(<CosSeguretatXat estat={PUBLIC} t={ca} />);
    expect(container.textContent).toBe('Xat públic: el pot llegir qualsevol persona que hi entre i no està xifrat d’extrem a extrem.');
  });
});

test('en anglés, amb el traductor de l’app', () => {
  const en = createTranslator('en');
  render(<CosSeguretatXat estat={DIRECTE} nom="Pepa" numero={llest({ verificat: true })} onMarca={() => {}} t={en} />);
  expect(screen.getByRole('group', { name: 'Safety number' })).toBeTruthy();
  expect(screen.getByText('Verified: you compared this number with Pepa.')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Remove the verified mark' })).toBeTruthy();
});
