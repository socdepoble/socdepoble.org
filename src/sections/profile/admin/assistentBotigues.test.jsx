/* Onada R9 · C3 (IDEA-120 / P0-30; G8-03, G8-04, G8-12, G8-14 i G8-16) · L'assistent de botigues
   de l'Administració. Ve del QR real de Codex R27 (g8_fusio_v2.diff), amb tres canvis: el QR no
   importa la Gestoria (és precalculat i ací es torna a calcular amb el seu codificador: les proves
   no compten per a les fronteres), el destí és l'única guia que existix (/descarregues no llig cap
   paràmetre de plataforma) i les versions es contrasten amb els fitxers del projecte. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { RouterProvider } from '../../../app/contexts/RouterContext.jsx';
import { PanellEmpaquetatsDesplegament } from './PanellsAdministracioSistema.jsx';
import { CANALS_BOTIGUES, CATALEG_SERVIDOR_PUSH, ESTAT_SERVIDOR_PUSH, FITXA_NATIVA, MOTIU_SENSE_CLAU, PASSOS_SERVIDOR_PUSH, QR_GUIA_DESCARREGUES, URL_GUIA_DESCARREGUES, frasePushDelNavegador } from './assistentBotigues.js';
import { codificaQR, camiSvgQR } from '../../gestoria/facturacio/qrDibuix.js';
import { MOTIU_PUSH } from '../../../pwa/avisosPush.js';
import { estatDeLesBotigues } from '../../../../scripts/botigues/estat.mjs';
import { moduleDelQr } from '../../../../scripts/botigues/genera-qr-botigues.mjs';
import { lligQrIndependent } from '../../../../tests/helpers/lectorQrIndependent.js';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

/** Els mòduls, recuperats NOMÉS del SVG pintat (mai de l'eixida del codificador). */
function modulsDelSvg(svg) {
  const caixa = svg.getAttribute('viewBox').split(/\s+/).map(Number);
  expect(caixa.slice(0, 2)).toEqual([0, 0]);
  const costat = caixa[2];
  expect(caixa[3]).toBe(costat);
  const paper = svg.querySelector('rect.sdp-admin-qr__paper');
  expect([paper.getAttribute('x'), paper.getAttribute('y'), paper.getAttribute('width'), paper.getAttribute('height')]).toEqual(['0', '0', String(costat), String(costat)]);
  const d = svg.querySelector('path.sdp-admin-qr__tinta').getAttribute('d');
  const ordres = [...d.matchAll(/M(\d+) (\d+)h(\d+)v1h-(\d+)z/g)];
  expect(ordres.map((m) => m[0]).join('')).toBe(d);
  const llenc = Array.from({ length: costat }, () => Array(costat).fill(false));
  for (const m of ordres) {
    const [x, y, ample, torna] = m.slice(1).map(Number);
    expect(ample).toBe(torna);
    for (let i = 0; i < ample; i += 1) { expect(llenc[y][x + i]).toBe(false); llenc[y][x + i] = true; }
  }
  /* La zona de silenci de 4 mòduls, buida. */
  for (let y = 0; y < costat; y += 1) for (let x = 0; x < costat; x += 1) if (x < 4 || y < 4 || x >= costat - 4 || y >= costat - 4) expect(llenc[y][x]).toBe(false);
  return llenc.slice(4, -4).map((fila) => fila.slice(4, -4));
}
const munta = () => render(<RouterProvider initialPath="/perfil"><PanellEmpaquetatsDesplegament /></RouterProvider>);

test('el QR precalculat és el del codificador de la Gestoria per a la guia, i el mòdul generat és el que hi ha', () => {
  expect(URL_GUIA_DESCARREGUES).toBe('https://socdepoble.org/descarregues');
  const { costat, d } = camiSvgQR(codificaQR(URL_GUIA_DESCARREGUES));
  expect({ costat: QR_GUIA_DESCARREGUES.costat, d: QR_GUIA_DESCARREGUES.d }).toEqual({ costat, d });
  expect(moduleDelQr({ text: URL_GUIA_DESCARREGUES, costat, d })).toContain(`d: ${JSON.stringify(d)}`);
});

test('el QR pintat es llig amb un lector independent, per a cada canal, i un mòdul malmès no es llig', () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  munta();
  for (const { id } of CANALS_BOTIGUES) {
    fireEvent.click(screen.getByTestId(`boto-canal-botiga-${id}`));
    const moduls = modulsDelSvg(screen.getByTestId('qr-svg-botigues'));
    expect(lligQrIndependent(moduls).text).toBe(URL_GUIA_DESCARREGUES);
    expect(screen.getByTestId(`detall-canal-botiga-${id}`).querySelector('.sdp-admin-botiga-detall__url').textContent).toBe(URL_GUIA_DESCARREGUES);
  }
  const moduls = modulsDelSvg(screen.getByTestId('qr-svg-botigues'));
  moduls.at(-1)[moduls.length - 1] = !moduls.at(-1)[moduls.length - 1];
  expect(() => lligQrIndependent(moduls)).toThrow();
  expect(fetch).not.toHaveBeenCalled();
});

test('G8-04 · les versions, els identificadors i els SDK són els dels fitxers del projecte', () => {
  const e = estatDeLesBotigues(path.resolve(process.cwd()), { env: {} });
  expect(FITXA_NATIVA).toEqual({
    versioWeb: e.versioWeb, paquet: e.android.paquet, extensioCompartir: e.ios.extensions[0], versio: e.android.versio, build: e.android.build,
    iosMinim: e.ios.iosMinim, minSdk: e.android.minSdk, compileSdk: e.android.compileSdk, targetSdk: e.android.targetSdk
  });
  expect([e.ios.paquet, e.ios.versio, e.ios.build, e.ios.extensions]).toEqual([FITXA_NATIVA.paquet, FITXA_NATIVA.versio, FITXA_NATIVA.build, [FITXA_NATIVA.extensioCompartir]]);
});

test('G8-03/G8-16 · textos honestos: guia, no instal·lació; cap «certificat», «verificat», «disponible ara» ni canal de FCM', () => {
  munta();
  const panell = screen.getByTestId('assistent-botigues-qr-admin');
  expect(panell.textContent).toContain('No és cap enllaç d’instal·lació');
  for (const { id } of CANALS_BOTIGUES) {
    fireEvent.click(screen.getByTestId(`boto-canal-botiga-${id}`));
    const text = panell.textContent;
    expect(text).not.toMatch(/[Cc]ertificad|[Vv]erificat\b|Disponible ara|QR d’instal·lació|[Cc]anal FCM|clau FCM per als avisos/);
  }
  fireEvent.click(screen.getByTestId('boto-canal-botiga-android'));
  expect(screen.getByTestId('detall-canal-botiga-android').textContent).toContain('canal local d’avisos «Missatges del xat»');
  expect(screen.getByRole('article', { name: /Empaquetats i Desplegament/i }).textContent).not.toMatch(/v1\.2\.0/);
});

test('l’estat dels avisos push és el del registre d’este navegador i el motiu sense clau és el de l’adaptador web', () => {
  expect(MOTIU_SENSE_CLAU).toBe(MOTIU_PUSH.SENSE_CLAU);
  expect(frasePushDelNavegador({ disponible: true, motiu: MOTIU_SENSE_CLAU, estat: 'inactiu' })).toMatch(/VITE_PUSH_VAPID_PUBLICA/);
  expect(frasePushDelNavegador({ disponible: false })).toMatch(/cap adaptador/);
  expect(frasePushDelNavegador({ disponible: true, motiu: null, estat: 'actiu' })).toBe('S’oferixen en este navegador (estat: actiu).');
  munta();
  const estat = screen.getByTestId('estat-avisos-push-admin');
  /* Sense motor (cap adaptador a la prova): ho diu, i la bandera és la de debò. */
  expect(within(estat).getByText(/Encara no s’hi ha registrat cap adaptador/)).toBeTruthy();
  expect(estat.textContent).toContain('encesa');
  expect(estat.textContent).toContain('2611020417_xat_avisos_push.sql');
});

/* Gauntlet R9 · G3-01 i G3-02 · Cap nom de secret del servidor ni cap RPC de les funcions al text del mòdul
   (va al paquet web i al del connector), cap «@capacitor» en prosa (tests/natiu-build.test.mjs) i l'estat
   del push és el llegit a producció el 6-11-2026: la 2611020417 hi és; falta la clau pública VAPID. */
test('G3-01/G3-02 · sense noms de secrets, RPC del worker ni «@capacitor»; remet al catàleg i diu l’estat llegit', () => {
  const font = readFileSync(path.resolve(process.cwd(), 'src/sections/profile/admin/assistentBotigues.js'), 'utf8');
  const PROHIBITS = /\bSDP_[A-Z0-9_]+|SUPABASE_SERVICE_ROLE_KEY|xat_push_(?:reclama|expulsa|neteja|credencial|desa_credencial)|purga_fitxers_(?:reclama|fets|fallits)|@capacitor/;
  expect(font).not.toMatch(PROHIBITS);
  const textos = [ESTAT_SERVIDOR_PUSH, ...PASSOS_SERVIDOR_PUSH, ...CANALS_BOTIGUES.flatMap((c) => [...c.passos, c.titol, c.estat, c.identificador])];
  for (const text of textos) expect(text).not.toMatch(PROHIBITS);
  expect(CATALEG_SERVIDOR_PUSH).toContain('supabase/README.md');
  expect(PASSOS_SERVIDOR_PUSH.join(' ')).toContain(CATALEG_SERVIDOR_PUSH);
  expect(ESTAT_SERVIDOR_PUSH).toMatch(/2611020417_xat_avisos_push\.sql ja és a producció/);
  expect([ESTAT_SERVIDOR_PUSH, ...PASSOS_SERVIDOR_PUSH].join(' ')).not.toMatch(/NO aplicada/);
  expect(PASSOS_SERVIDOR_PUSH[0]).toMatch(/clau pública VAPID al build web \(VITE_PUSH_VAPID_PUBLICA\)/);
  munta();
  const estat = screen.getByTestId('estat-avisos-push-admin');
  expect(estat.textContent).toContain('supabase/README.md');
  expect(estat.textContent).not.toMatch(/falta el servidor|NO aplicada/);
});

/* FBV-04 · «Perquè arriben avisos (pendent del Mestre)» només encapçala el que falta: el fet llegit a
   producció (la 2611020417 ja hi és) va en un paràgraf d'estat, abans, i no dins de la llista. */
test('FBV-04 · el fet llegit va abans de la llista i la llista del que falta no el conté', () => {
  expect(PASSOS_SERVIDOR_PUSH.join(' ')).not.toMatch(/ja és a producció|2611020417/);
  munta();
  const estat = screen.getByTestId('estat-avisos-push-admin');
  const fet = within(estat).getByTestId('estat-servidor-push');
  expect(fet.tagName).toBe('P');
  expect(fet.textContent).toBe(ESTAT_SERVIDOR_PUSH);
  const capcalera = within(estat).getByText('Perquè arriben avisos (pendent del Mestre):');
  const llista = estat.querySelector('ul.sdp-admin-botiga-detall__passos');
  expect(fet.compareDocumentPosition(capcalera) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(capcalera.nextElementSibling).toBe(llista);
  expect([...llista.querySelectorAll('li')].map((li) => li.textContent)).toEqual([...PASSOS_SERVIDOR_PUSH]);
  expect(llista.textContent).not.toMatch(/ja és a producció/);
});
