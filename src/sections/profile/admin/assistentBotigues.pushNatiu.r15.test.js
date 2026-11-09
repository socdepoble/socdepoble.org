// @vitest-environment node
/* Sanejament R15 (B3 · P1-03, P2-05, R15A-NAT-01) · L'ajudant de botigues del superadmin diu el
   que falta per als avisos push natius mentre el build no porta VITE_SDP_PUSH_NATIU=1: com a
   HEAD, google-services.json i el compte de servei de FCM (Android) i la clau d'APNs (iOS). Només
   amb la bandera diu que el connector està construït i que cal verificar-ho en dispositiu. */
import { afterEach, describe, expect, test, vi } from 'vitest';

async function assistent(valor) {
  vi.resetModules();
  vi.stubEnv('VITE_SDP_PUSH_NATIU', valor);
  return import('./assistentBotigues.js');
}
const textos = (m) => {
  const canal = (id) => m.CANALS_BOTIGUES.find((c) => c.id === id).passos.join(' ');
  return { ios: canal('ios'), android: canal('android'), servidor: m.PASSOS_SERVIDOR_PUSH.join(' ') };
};
afterEach(() => vi.unstubAllEnvs());

describe('sense la bandera (el build d’avui): l’avís de HEAD, cap «ja està construït»', () => {
  test.each(['', '0', 'true'])('VITE_SDP_PUSH_NATIU=%j', async (valor) => {
    const t = textos(await assistent(valor));
    expect(t.android).toMatch(/Els avisos push natius \(FCM\) encara no hi són: falten google-services\.json i el compte de servei de FCM als secrets de notifica-xat\./);
    expect(t.ios).toMatch(/Els avisos push natius encara no hi són/);
    expect(t.ios).toMatch(/falta la clau d’APNs als secrets de notifica-xat/);
    expect(t.servidor).toMatch(/google-services\.json/);
    expect(t.servidor).toMatch(/compte de servei d’FCM/);
    expect(t.servidor).toMatch(/VITE_SDP_PUSH_NATIU=1/);
    for (const text of Object.values(t)) expect(text).not.toMatch(/ja estan? construït|recepció en (?:un iPhone real|Android|dispositiu)/);
  });
});

describe('amb la bandera (un build natiu amb FCM i APNs configurats): el text del kit', () => {
  test('VITE_SDP_PUSH_NATIU=1', async () => {
    const t = textos(await assistent('1'));
    expect(t.android).toMatch(/El connector de push natiu ja està construït/);
    expect(t.ios).toMatch(/El connector de push natiu i els permisos ja estan construïts/);
    expect(t.servidor).toMatch(/el connector i els permisos ja estan construïts/);
    for (const text of Object.values(t)) expect(text).not.toMatch(/encara no hi són/);
  });
});

test('la bandera és el literal plegable, el mateix que governa el cicle natiu', async () => {
  const { readFileSync } = await import('node:fs');
  const font = readFileSync(new URL('./assistentBotigues.js', import.meta.url), 'utf8');
  expect(font).toContain("const PUSH_NATIU_ACTIU = import.meta.env.VITE_SDP_PUSH_NATIU === '1';");
  expect(readFileSync(new URL('../../../natiu/avisosPushNatius.js', import.meta.url), 'utf8')).toContain("import.meta.env.VITE_SDP_PUSH_NATIU === '1'");
});
