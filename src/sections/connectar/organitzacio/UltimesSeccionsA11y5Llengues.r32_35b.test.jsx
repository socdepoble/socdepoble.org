/**
 * Onada R32.35b · Lot 03 · Internacionalització a11y en 5 llengües (ca, es, en, eu, gl),
 * button[type] explícit i WCAG 2.5.3 Label-in-Name en les últimes 6 seccions UI.
 */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { CODIS_IDIOMA_ADMINISTRAR_ORG, textosAdministrarOrg } from './i18nAdministrarOrganitzacio.js';
import { TargetaAdministrar } from './TargetaAdministrar.jsx';
import { dataCurta, textDeLaLectura, textDeLError } from './estatAdministracio.js';

afterEach(cleanup);

describe('Onada R32.35b · Lot 03 · TargetaAdministrar i estatAdministracio en 5 llengües', () => {
  test('paritat de claus en les 5 llengües (ca, es, en, eu, gl) i preservació byte a byte del valencià', () => {
    expect(CODIS_IDIOMA_ADMINISTRAR_ORG).toEqual(['ca', 'es', 'en', 'eu', 'gl']);
    const clausCa = Object.keys(textosAdministrarOrg('ca')).sort();
    for (const lang of CODIS_IDIOMA_ADMINISTRAR_ORG) {
      const dict = textosAdministrarOrg(lang);
      expect(Object.keys(dict).sort(), lang).toEqual(clausCa);
    }
    expect(textosAdministrarOrg('fr')).toBe(textosAdministrarOrg('ca'));
    expect(textosAdministrarOrg('ca').titolSeccio).toBe('Administrar l’organització');
    expect(textosAdministrarOrg('ca').campEtiqueta).toBe('Explica breument qui eres (opcional)');
  });

  test.each([
    ['ca', 'Administrar Cooperativa', 'Explica breument qui eres (opcional)', 'Demanar administrar-la'],
    ['es', 'Administrar Cooperativa', 'Explica brevemente quién eres (opcional)', 'Solicitar administrarla'],
    ['en', 'Manage Cooperativa', 'Briefly explain who you are (optional)', 'Request to manage it'],
    ['eu', 'Cooperativa kudeatu', 'Azaldu labur nor zaren (aukerakoa)', 'Kudeatzea eskatu'],
    ['gl', 'Administrar Cooperativa', 'Explica brevemente quen es (opcional)', 'Pedir administrala'],
  ])('llengua %s: form[aria-label], Camp[etiqueta], botó[type] i WCAG 2.5.3 Label-in-Name', (lang, formAria, etiquetaCamp, botoText) => {
    const accions = { onConnecta: vi.fn(), onActua: vi.fn(), onEditaFitxa: vi.fn(), onEntra: vi.fn() };
    const { container } = render(
      <TargetaAdministrar
        idioma={lang}
        nom="Cooperativa"
        estat="pot-connectar"
        ambRevisio={true}
        {...accions}
      />
    );
    const form = container.querySelector('form');
    expect(form.getAttribute('aria-label')).toBe(formAria);
    expect(screen.getByRole('textbox', { name: etiquetaCamp })).toBeTruthy();
    const boto = screen.getByRole('button', { name: botoText });
    expect(boto.getAttribute('type')).toBe('submit');
    // WCAG 2.5.3 Label-in-Name: si hi haguera aria-label, hauria de contindre el text visible
    const aria = boto.getAttribute('aria-label');
    if (aria) expect(aria.toLowerCase()).toContain(boto.textContent.trim().toLowerCase());
  });

  test('errors i dates d’estatAdministracio responen a les 5 llengües sense filtrar missatges crus del servidor', () => {
    const err = Object.assign(new Error('Supabase 500 internal'), { code: 'ALTRE' });
    for (const lang of CODIS_IDIOMA_ADMINISTRAR_ORG) {
      const msgEnviar = textDeLError(err, lang);
      const msgLectura = textDeLaLectura(err, lang);
      expect(msgEnviar).toBeTruthy();
      expect(msgLectura).toBeTruthy();
      expect(msgEnviar).not.toContain('Supabase');
      expect(msgLectura).not.toContain('Supabase');
      expect(dataCurta('2026-09-28T10:00:00Z', lang)).toMatch(/2026/);
    }
  });
});
