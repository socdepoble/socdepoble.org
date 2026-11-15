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

  /* Onada R28 · Commutadors d'àmbit amb rètol estable (WAI-ARIA APG) i un sol anunci viu al simulador. */
  test('cada àmbit té un rètol estable amb aria-pressed, i només el resum pròxim és regió viva', () => {
    const { container } = render(
      <RouterProvider initialPath={COPIES_SEGURETAT_SOC_DE_POBLE_RUTA}>
        <CopiesSeguretatSocDePobleArticle item={COPIES_SEGURETAT_SOC_DE_POBLE_POST} />
      </RouterProvider>
    );
    const commutadors = screen.getAllByRole('button', { name: 'Inclou al farcellet' });
    expect(commutadors).toHaveLength(5);
    const primer = commutadors[0];
    const abans = primer.getAttribute('aria-pressed');
    fireEvent.click(primer);
    expect(primer.getAttribute('aria-pressed')).not.toBe(abans);
    expect(primer.textContent).toBe('Inclou al farcellet');
    expect(container.querySelectorAll('[role="status"]')).toHaveLength(1);
    expect(container.querySelector('.sdp-selector-opcions__resum').hasAttribute('aria-live')).toBe(false);
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

  /* Onada R28 (verificació X2) · La còpia del xat ja té pantalla: l'article diu on
     és i què fa (desar i comprovar les converses carregades), i que restaurar dins
     de l'app encara no es pot i els adjunts no hi van. Ja no diu que no té botó. */
  test('Llei 0 en les 5 llengües: la còpia .sdpbackup del xat es desa i es comprova a Ajustos › Xats, sense restaurar ni adjunts', () => {
    const VERITAT = {
      ca: ['Ajustos › Xats › «Còpia de seguretat»', 'Restaurar-la dins de l’aplicació encara no és possible', 'fotos, els àudios i els vídeos no hi van', 'que este dispositiu ha carregat'],
      es: ['Ajustes › Chats › «Copia de seguridad»', 'Restaurarla dentro de la aplicación todavía no es posible', 'fotos, los audios y los vídeos no se incluyen', 'que este dispositivo ha cargado'],
      en: ['Settings › Chats › “Chat backup”', 'Restoring it inside the app is not possible yet', 'photos, voice notes, and videos are not included', 'this device has loaded'],
      eu: ['Ezarpenak › Txatak › «Babeskopia»', 'Oraindik ezin da aplikazioaren barruan leheneratu', 'argazkiak, audioak eta bideoak ez dira sartzen', 'gailu honek kargatu dituen'],
      gl: ['Axustes › Chats › «Copia de seguridade»', 'Aínda non é posible restaurala dentro da aplicación', 'as fotos, os audios e os vídeos non se inclúen', 'que este dispositivo cargou'],
    };
    const SENSE_BOTO = /cap botó|sense pantalla d’exportació|no tiene botón|no button in the app|ez du botoirik|non ten botón/i;
    for (const [lang, frases] of Object.entries(VERITAT)) {
      const html = COPIES_SEGURETAT_SOC_DE_POBLE_COPY[lang].html;
      for (const frase of frases) expect([lang, frase, html.includes(frase)]).toEqual([lang, frase, true]);
      expect(html, lang).not.toMatch(SENSE_BOTO);
      expect(html, lang).toContain('<a href="/xat">');
      // La resta de la Llei 0 es conserva: el simulador és una maqueta i l'E2EE continua apagat.
      expect(html, lang).toMatch(/maqueta didàctica|maqueta didáctica|teaching mock-up|maketa didaktiko|maqueta didáctica/);
      expect(html, lang).toMatch(/apagats|apagado|not switched on yet|itzalita|aínda apagado/);
    }
  });
});
