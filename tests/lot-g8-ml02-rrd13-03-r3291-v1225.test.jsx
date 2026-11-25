import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const modulesCss = readFileSync(path.resolve(process.cwd(), 'src/css/modules.css'), 'utf8');
const appsCss = readFileSync(path.resolve(process.cwd(), 'src/css/diferit-apps-plataforma.css'), 'utf8');
const calendariSrc = readFileSync(path.resolve(process.cwd(), 'src/sections/calendari/CalendariSection.jsx'), 'utf8');

describe('Lot G8 · ML-02 (reserva única barra mòbil a les micro-apps) i RR-D13-03 (Calendari ambError)', () => {
  test('ML-02 · modules.css retira la doble reserva de .sdp-marc-columna i anul·la la segona reserva dins .sdp-app-contenidor preservant /notes', () => {
    expect(modulesCss).not.toMatch(/\.sdp-app-contenidor\s+\.app-grid-shell\s*>\s*\.app-grid-content\s*>\s*\.app-grid-column\s*>\s*\.sdp-marc-columna/);
    expect(modulesCss).toContain(':where(.sdp-root.is-compact) .sdp-workspace--universal > .app-grid-shell > .app-grid-content > .app-grid-column > .sdp-workspace-column > .sdp-workspace-column__body');
    expect(modulesCss).toContain(':where(.sdp-root.is-compact) .sdp-app-contenidor .sdp-workspace--universal > .app-grid-shell > .app-grid-content > .app-grid-column > .sdp-workspace-column > .sdp-workspace-column__body');
  });

  test('ML-02 · diferit-apps-plataforma.css no duplica padding-bottom a .sdp-app-unica', () => {
    expect(appsCss).not.toContain(':where(.sdp-root.is-compact) .sdp-app-unica');
  });

  test('RR-D13-03 · CalendariSection passa ambError={Boolean(avisError)} a SelectorModeCalendari', () => {
    expect(calendariSrc).toContain('ambError={Boolean(avisError)}');
  });
});
