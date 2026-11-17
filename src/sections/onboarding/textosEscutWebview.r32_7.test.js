// @vitest-environment node
/* v1.2.7 · R325-01 · L'escut OAuth del navegador intern (Instagram, Facebook, TikTok, LINE) prometia
   entrar «amb un enllaç al correu» i el botó primari deia «Rep un enllaç d’accés al correu», però no hi
   ha cap enllaç d'accés (loginWithMagicLink falla sempre sense PKCE, src/data/supabase/auth.js): el botó
   obri «Recupera la contrasenya» (OnboardingSection.jsx, obriEnllacMagicDesDeWebview), que envia un enllaç
   per a definir una contrasenya nova, i només si el compte existix. Els textos, en les 5 llengües, han de
   dir el que fa cada botó. */
import { describe, expect, test } from 'vitest';
import { TEXTOS_ESCUT_WEBVIEW } from './textosEscutWebview.js';
import CA from '../../config/idiomes/ca.js';
import ES from '../../config/idiomes/es.js';
import EN from '../../config/idiomes/en.js';
import EU from '../../config/idiomes/eu.js';
import GL from '../../config/idiomes/gl.js';

const LLENGUES = {
  ca: { dic: CA, contrasenya: 'contrasenya', enllac: 'enllaç', acces: /enllaç d[’']accés/i },
  es: { dic: ES, contrasenya: 'contraseña', enllac: 'enlace', acces: /enlace de acceso/i },
  en: { dic: EN, contrasenya: 'password', enllac: 'link', acces: /sign-in link|email link/i },
  eu: { dic: EU, contrasenya: 'pasahitz', enllac: 'esteka', acces: /sarbide-esteka/i },
  gl: { dic: GL, contrasenya: 'contrasinal', enllac: 'ligazón', acces: /ligazón de acceso/i }
};

describe('R325-01 · l’escut WebView no promet cap enllaç d’accés', () => {
  test('les 5 llengües hi són, i cap més', () => {
    expect(Object.keys(TEXTOS_ESCUT_WEBVIEW).sort()).toEqual(Object.keys(LLENGUES).sort());
  });

  test.each(Object.entries(LLENGUES))('%s: cap text parla d’un enllaç d’accés', (idioma, { acces }) => {
    for (const [clau, text] of Object.entries(TEXTOS_ESCUT_WEBVIEW[idioma])) {
      expect(text, `${idioma}.${clau}`).not.toMatch(acces);
    }
  });

  test.each(Object.entries(LLENGUES))('%s: l’explicació ofereix el correu amb contrasenya, sense cap enllaç pel correu', (idioma, { contrasenya, enllac }) => {
    const { explicacio } = TEXTOS_ESCUT_WEBVIEW[idioma];
    expect(explicacio.toLowerCase()).toContain(contrasenya);
    expect(explicacio.toLowerCase()).not.toContain(enllac);
  });

  test.each(Object.entries(LLENGUES))('%s: el botó que obri «Recupera la contrasenya» diu que l’enllaç és per a la contrasenya', (idioma, { dic, contrasenya, enllac }) => {
    /* La mateixa paraula que el títol de la pantalla que obri el botó (RecuperacioSteps.jsx). */
    expect(dic['section.login.recuperacio.titol'].toLowerCase()).toContain(contrasenya);
    const boto = TEXTOS_ESCUT_WEBVIEW[idioma].botoEnllacMagic.toLowerCase();
    expect(boto).toContain(contrasenya);
    expect(boto).toContain(enllac);
    expect(boto).toContain('google');
  });
});
