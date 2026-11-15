// @vitest-environment node
/* Onada R29 · Kit Gemini lot_03 (coherència editorial en 5 llengües), integrat per Claude.
   Els calcs bascos (erreproduzigailu, konektoreak, 0 Nodoa) i el nom propi «L’Avisador · Batec de Vida»
   ja els guarden coherenciaEditorialR27.test.js i AparadorFediversity.test.jsx: ací no es repetixen.
   Esta bateria guarda el que el lot afig:
    · gallec: «cartafol» per a carpeta i «apuntamento» per a apunte, com la resta del diccionari gl;
    · cap «Login» als diccionaris: és «Entrar», «Acceso», «Sign in» o «Saioa hasi»;
    · gallec de l'Aparador: «a API pública do Nodo 0», amb la preposició i el nom que fa servir gl;
    · el tauler d'administració parla d'«autonomia d’infraestructura». */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import CA from '../../config/idiomes/ca.js';
import ES from '../../config/idiomes/es.js';
import EN from '../../config/idiomes/en.js';
import EU from '../../config/idiomes/eu.js';
import GL from '../../config/idiomes/gl.js';
import { APARADOR_R20_TEXTS } from './pageContent.fediversityR20.js';

const DICCIONARIS = { ca: CA, es: ES, en: EN, eu: EU, gl: GL };

/** Els valors de text d'un diccionari, sense els marcadors {nom}: «{carpeta}» és un nom de variable, no text. */
function valors(dic) {
  return Object.entries(dic)
    .filter(([, valor]) => typeof valor === 'string')
    .map(([clau, valor]) => [clau, valor.replace(/\{[^}]*\}/g, '')]);
}

describe('Onada R29 · lot_03 · coherència editorial en les 5 llengües', () => {
  it('gl · el Caderno parla de «cartafoles» i «apuntamentos», sense cap «carpeta» ni «apunte» de resta', () => {
    expect(GL['section.notes.espai.carpetes']).toBe('CARTAFOLES');
    expect(GL['section.notes.desa.avisCarpetes']).toMatch(/^Crear, renomear e borrar cartafoles /);
    const restes = valors(GL).filter(([, text]) => /\b(?:carpetas?|apuntes?)\b/i.test(text)).map(([clau]) => clau);
    expect(restes).toEqual([]);
  });

  it('cap diccionari no diu «Login», i les claus òrfenes de l’entrada antiga ja no hi són', () => {
    /* Onada R29 · Integració: nav.login, section.login.title i la resta de claus de l'entrada antiga (òrfenes des de
       cc4980dec, cap crida a src) i les tres de Notes que el codi tampoc no crida es retiren dels cinc diccionaris.
       Així torna davall del trinquet l'arrencada estàtica del connector de WordPress, que el diccionari ca porta dins. */
    const ORFENES = ['nav.login', 'section.login.title', 'section.login.subtitle', 'section.login.heroText',
      'section.login.registerEntradilla', 'section.login.registerSubtitle', 'section.login.loginSubtitle',
      'section.login.googleNote', 'section.login.googleSubtitle', 'section.login.meta.oauth', 'section.mur.feed',
      'section.notes.subtitle', 'section.notes.folders', 'section.notes.mobileFolders'];
    for (const [llengua, dic] of Object.entries(DICCIONARIS)) {
      expect([llengua, ORFENES.filter((clau) => clau in dic)]).toEqual([llengua, []]);
    }
    for (const [llengua, dic] of Object.entries(DICCIONARIS)) {
      const amb = valors(dic).filter(([, text]) => /\bLogin\b/.test(text)).map(([clau]) => clau);
      expect([llengua, amb]).toEqual([llengua, []]);
    }
  });

  it('gl · l’Aparador diu «a API pública do Nodo 0», com el camp node («Nodo 0 comunitario»)', () => {
    expect(APARADOR_R20_TEXTS.gl.status).toBe('Comproba a API pública do Nodo 0');
    expect(APARADOR_R20_TEXTS.gl.node).toMatch(/^Nodo 0 comunitario · /);
  });

  it('el tauler de nodes de l’administració parla d’«autonomia d’infraestructura»', () => {
    const font = readFileSync(path.join(process.cwd(), 'src/sections/profile/admin/PanellsAdministracioSistema.jsx'), 'utf8');
    expect(font).toContain('Tauler de comandament de l’autonomia d’infraestructura');
    expect(font).not.toMatch(new RegExp(['sobir', 'ani'].join(''), 'i'));
  });
});
