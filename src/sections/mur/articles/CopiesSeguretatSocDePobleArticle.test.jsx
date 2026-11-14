import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { RouterProvider } from '../../../app/contexts/RouterContext.jsx';
import { UIContext } from '../../../app/contexts/objectesDeContext.js';
import { ORIGEN_SOCIAL_PER_DEFECTE, primeraImatgeSocial } from '../../../config/imatgeSocial.js';
import { resolvePageSlugPath } from '../../../config/navigation.js';
import {
  COPIES_SEGURETAT_SOC_DE_POBLE_COPY,
  COPIES_SEGURETAT_SOC_DE_POBLE_HTML,
  COPIES_SEGURETAT_SOC_DE_POBLE_ID,
  COPIES_SEGURETAT_SOC_DE_POBLE_POST,
  COPIES_SEGURETAT_SOC_DE_POBLE_RUTA,
  IMATGE_HERO_COPIES_SEGURETAT,
  IMATGE_INTERIOR_QUATRE_CAPES,
} from './copiesSeguretatSocDePobleContent.js';
import { CopiesSeguretatSocDePobleArticle } from './CopiesSeguretatSocDePobleArticle.jsx';

afterEach(cleanup);

describe('El Farcellet Digital de Sóc de Poble · vocabulari canònic, OpenGraph, zero duplicitat Hero i simulador de tot el sistema', () => {
  test('guarda estricta de vocabulari: zero "del poble", zero "usa/usen" i zero "sobirà/soberano/sovereign" en les 5 llengües', () => {
    const corpus = JSON.stringify({
      copy: COPIES_SEGURETAT_SOC_DE_POBLE_COPY,
      post: COPIES_SEGURETAT_SOC_DE_POBLE_POST,
    });

    expect(corpus).not.toMatch(/\bdel poble\b/i);
    expect(corpus).not.toMatch(/\bdels pobles\b/i);
    expect(corpus).not.toMatch(/\busa\b|\busen\b/i);
    expect(corpus).not.toMatch(/sobir[aà]|sobirania|soberan[oaí]|sovereign/i);
  });

  test('sincronització 1:1 UniversalPage ↔ UniversalCard i no duplica la HeroImage dins del cos', () => {
    expect(COPIES_SEGURETAT_SOC_DE_POBLE_POST.subtitle).toBe(COPIES_SEGURETAT_SOC_DE_POBLE_POST.post_subtitle);
    expect(COPIES_SEGURETAT_SOC_DE_POBLE_POST.lead).toBe(COPIES_SEGURETAT_SOC_DE_POBLE_POST.entradilla);
    expect(COPIES_SEGURETAT_SOC_DE_POBLE_POST.description).toBe(COPIES_SEGURETAT_SOC_DE_POBLE_POST.entradilla);
    expect(IMATGE_HERO_COPIES_SEGURETAT).not.toBe(IMATGE_INTERIOR_QUATRE_CAPES);
    expect(COPIES_SEGURETAT_SOC_DE_POBLE_HTML).not.toContain(IMATGE_HERO_COPIES_SEGURETAT);
    expect(COPIES_SEGURETAT_SOC_DE_POBLE_HTML).toContain(IMATGE_INTERIOR_QUATRE_CAPES);
  });

  test('resol l’àlies /page/copies-de-seguretat-soc-de-poble i servix la variant JPEG baseline 1200x630 per a WhatsApp', () => {
    expect(COPIES_SEGURETAT_SOC_DE_POBLE_ID).toBe('copies-de-seguretat-soc-de-poble');
    expect(resolvePageSlugPath('copies-de-seguretat-soc-de-poble')).toBe(COPIES_SEGURETAT_SOC_DE_POBLE_RUTA);

    const social = primeraImatgeSocial('mur', COPIES_SEGURETAT_SOC_DE_POBLE_POST, {
      origen: ORIGEN_SOCIAL_PER_DEFECTE,
    });
    expect(social.estat).toBe('triada');
    expect(social.url).toBe(
      'https://socdepoble.org/assets/mur/copies_seguretat_farcellet_hero-social-1200x630.jpg'
    );
  });

  test('pinta l’article sense cap h1 ni taula de prosa intrusa al cos, i permet alternar Només el Xat i Tot Sóc de Poble complet', () => {
    const { container } = render(
      <RouterProvider initialPath={COPIES_SEGURETAT_SOC_DE_POBLE_RUTA}>
        <CopiesSeguretatSocDePobleArticle item={COPIES_SEGURETAT_SOC_DE_POBLE_POST} />
      </RouterProvider>
    );

    expect(container.querySelector('h1')).toBeNull();
    expect(container.querySelector('table')).toBeNull();
    expect(container.querySelector('.sdp-targetes[data-forma="sola"][data-alineacio="dreta"]')).not.toBeNull();

    expect(screen.getByText(/5\/5 blocs/)).toBeTruthy();
    const resumProxim = screen.getByTestId('farcellet-resum-proxim');
    expect(resumProxim.getAttribute('role')).toBe('status');
    expect(resumProxim.textContent).toMatch(/5\/5 àmbits actius/);

    // ART02 · El resum viu just davall dels presets, abans de la llista dels cinc àmbits.
    const nomesXat = screen.getByRole('button', { name: /Només el Xat/ });
    const totSistema = screen.getByRole('button', { name: /Tot Sóc de Poble complet/ });
    expect(nomesXat.parentElement.nextElementSibling).toBe(resumProxim);
    expect(resumProxim.getAttribute('aria-live')).toBe('polite');
    expect(resumProxim.nextElementSibling.matches('ul.sdp-banc-veus__llista')).toBe(true);
    expect(resumProxim.textContent).toContain('~769 MB');
    expect(nomesXat.getAttribute('aria-pressed')).toBe('false');
    expect(totSistema.getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(nomesXat);
    expect(screen.getByText(/1\/5 blocs/)).toBeTruthy();
    expect(resumProxim.textContent).toMatch(/1\/5 àmbits actius/);
    expect(nomesXat.getAttribute('aria-pressed')).toBe('true');
    expect(totSistema.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(totSistema);
    expect(screen.getByText(/5\/5 blocs/)).toBeTruthy();
    expect(resumProxim.textContent).toMatch(/5\/5 àmbits actius/);
    expect(nomesXat.getAttribute('aria-pressed')).toBe('false');
    expect(totSistema.getAttribute('aria-pressed')).toBe('true');

    // El commutador de mode canvia de rètol: el rètol és l'estat i no porta aria-pressed (WAI-ARIA).
    const mode = screen.getByRole('button', { name: /Mode complet: tot fins a hui/ });
    expect(mode.hasAttribute('aria-pressed')).toBe(false);
    fireEvent.click(mode);
    expect(mode.textContent).toContain('Mode estalvi: només el nou des de l’última còpia');
    expect(mode.hasAttribute('aria-pressed')).toBe(false);
    expect(resumProxim.textContent).toMatch(/5\/5 àmbits actius · ~92 MB estimats \(incremental\)/);
  });

  test('Llei 0 en les 5 llengües (ca, es, en, eu, gl): el cos distingix socdepoble.exportacio.v1, operatiu hui, del contenidor .sdpbackup, i el resum pròxim es pinta en la llengua de la interfície', () => {
    const resums = new Set();
    for (const lang of ['ca', 'es', 'en', 'eu', 'gl']) {
      const bloc = COPIES_SEGURETAT_SOC_DE_POBLE_COPY[lang];
      expect(bloc, lang).toBeTruthy();
      expect(bloc.html, lang).toContain('socdepoble.exportacio.v1');
      expect(bloc.html, lang).toContain('.sdpbackup');
      expect(bloc.html, lang).not.toMatch(/mentre dorms|mientras duermes|while you sleep|lo zauden bitartean|mentres dormes/i);

      // La llengua arriba per l'estat de la interfície (useIdiomaActiu), no per una prop.
      const { unmount } = render(
        <UIContext.Provider value={{ language: lang }}>
          <RouterProvider initialPath={COPIES_SEGURETAT_SOC_DE_POBLE_RUTA}>
            <CopiesSeguretatSocDePobleArticle item={COPIES_SEGURETAT_SOC_DE_POBLE_POST} />
          </RouterProvider>
        </UIContext.Provider>
      );
      const resum = screen.getByTestId('farcellet-resum-proxim');
      expect(resum.getAttribute('role'), lang).toBe('status');
      expect(resum.textContent, lang).toMatch(/\b5\b/);
      expect(resum.textContent, lang).toContain('~769 MB');
      expect(resum.textContent, lang).not.toMatch(/[{}]/);
      resums.add(resum.textContent);
      unmount();
    }
    // Cinc llengües, cinc redaccions: cap llengua cau a la reserva valenciana.
    expect(resums.size).toBe(5);
  });
});
