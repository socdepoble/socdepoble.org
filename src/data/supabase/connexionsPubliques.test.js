import { beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ user: { id: '11111111-1111-4111-8111-111111111111' }, epoch: 1, mode: 'remote', configured: true, rpc: vi.fn(), actiu: true }));
vi.mock('./runtime.js', () => ({ getCurrentUser: () => m.user, getResolvedConfig: () => ({ runtimeDataMode: m.mode, hasSupabaseConfig: m.configured }), rpc: m.rpc }));
/* D-P016 (Onada R9) · Les proves del transport descriuen el servidor amb la
   migració 2611032100 aplicada: hi corren amb l'interruptor encés (m.actiu).
   IDEA-133 (Onada R10, B2-04) · El valor real ja és encés; l'efecte d'apagar-lo
   (un backend sense la migració) es prova al final del fitxer. */
vi.mock('../../config/connexionsPubliques.js', () => ({ get CONNEXIONS_PUBLIQUES_REMOTES_ACTIVES() { return m.actiu; } }));
vi.mock('../identitat.js', () => ({ getDefaultUserId: () => 'convidat', capturaSessio: () => { const epoch = m.epoch; return () => { if (m.epoch !== epoch) throw new DOMException('Sessió canviada', 'AbortError'); }; } }));
vi.mock('./moderacio.js', () => ({ llistaBloquejos: async () => [], bloqueigLocalEntre: () => false }));
import * as servidor from './seguiments.js';
const A = '11111111-1111-4111-8111-111111111111', B = '22222222-2222-4222-8222-222222222222', O = '33333333-3333-4333-8333-333333333333';
const metode = ['preferenciesConnexions', 'desaVisibilitatConnexions', 'connexionsPubliquesDe', 'membresIEntitatsConnectadesDe', 'inclouPersonaEnEntitat', 'solicitaUnirSeAEntitat'];
const fila = { tipus: 'persona', id: B, nom: 'Veïna', avatar: '', ruta: `/gent/${B}`, creatAl: '2026-11-03T12:00:00Z', direccio: 'sortint' };
const prefs = { tipus: 'persona', id: A, visibilitatConnexions: 'privada', connexions: [{ ...fila, visibilitatConnexions: 'publica' }] };
beforeEach(() => { m.user = { id: A }; m.epoch = 1; m.mode = 'remote'; m.configured = true; m.actiu = true; m.rpc.mockReset(); });

test('les sis operacions existixen en el servidor remot', () => { for (const nom of metode) expect(servidor[nom], nom).toBeTypeOf('function'); });
test('preferències i escriptura usen RPC amb només input validat i no canvien config', async () => {
  m.rpc.mockResolvedValue(prefs); const config = { tenantId: O };
  expect(await servidor.preferenciesConnexions({ tipus: 'persona', id: A }, config)).toEqual(prefs);
  expect(m.rpc).toHaveBeenLastCalledWith('preferencies_connexions', { p_tipus: 'persona', p_id: A }, config, { signal: undefined });
  await servidor.desaVisibilitatConnexions({ tipus: 'persona', id: A, visibilitatConnexions: 'privada', connexio: { tipus: 'persona', id: B } }, config);
  expect(m.rpc).toHaveBeenLastCalledWith('desa_visibilitat_connexions', { p_tipus: 'persona', p_id: A, p_visibilitat: 'privada', p_connexio_tipus: 'persona', p_connexio_id: B }, config, { signal: undefined });
  expect(config).toEqual({ tenantId: O });
});
test('lectures públiques també funcionen sense sessió i projecten DTO segur', async () => {
  m.user = null; m.rpc.mockResolvedValue([{ ...fila, email: 'privat@example.invalid', user_id: O, nom: { atac: true } }]);
  expect(await servidor.connexionsPubliquesDe({ tipus: 'persona', id: A })).toEqual([{ ...fila, nom: '' }]);
  expect(m.rpc).toHaveBeenLastCalledWith('connexions_publiques_de', { p_tipus: 'persona', p_id: A }, {}, { signal: undefined });
  await servidor.membresIEntitatsConnectadesDe({ tipus: 'poble', id: 'la-torre-de-les-macanes' });
  expect(m.rpc).toHaveBeenLastCalledWith('membres_i_entitats_connectades_de', { p_tipus: 'poble', p_id: 'la-torre-de-les-macanes' }, {}, { signal: undefined });
});
test('sin sessió cap mutació ni preferència privada fa RPC', async () => {
  m.user = null;
  for (const crida of [() => servidor.preferenciesConnexions({ tipus: 'persona', id: A }), () => servidor.desaVisibilitatConnexions({ tipus: 'persona', id: A, visibilitatConnexions: 'publica' }), () => servidor.inclouPersonaEnEntitat({ orgId: O, personaId: B, rol: 'usuari' }), () => servidor.solicitaUnirSeAEntitat({ orgId: O, rol: 'administrador' })]) await expect(crida()).rejects.toMatchObject({ code: 'SDP-CONN-000' });
  expect(m.rpc).not.toHaveBeenCalled();
});
test('inputs malformats, getters i suplantació de persona es rebutgen abans del transport', async () => {
  const getter = vi.fn(() => A), entrada = { tipus: 'persona' }; Object.defineProperty(entrada, 'id', { get: getter, enumerable: true });
  for (const dades of [entrada, { tipus: 'persona', id: {} }, { tipus: 'persona', id: 'slug-no-remot' }]) await expect(servidor.connexionsPubliquesDe(dades)).rejects.toMatchObject({ code: 'SDP-CONN-001' });
  await expect(servidor.solicitaUnirSeAEntitat({ orgId: O, rol: 'administrador', personaId: B })).rejects.toMatchObject({ code: 'SDP-CONN-001' });
  expect(getter).not.toHaveBeenCalled(); expect(m.rpc).not.toHaveBeenCalled();
});
test('incloure confirma ids/rol exactes i sol·licitar no envia persona del client', async () => {
  m.rpc.mockResolvedValueOnce({ orgId: O, personaId: B, rol: 'treballador' });
  expect(await servidor.inclouPersonaEnEntitat({ orgId: O, personaId: B, rol: 'treballador' })).toEqual({ orgId: O, personaId: B, rol: 'treballador' });
  expect(m.rpc).toHaveBeenLastCalledWith('inclou_persona_en_entitat', { p_org_id: O, p_persona_id: B, p_rol: 'treballador' }, {}, { signal: undefined });
  m.rpc.mockResolvedValueOnce({ orgId: O, personaId: A, rol: 'administrador', estat: 'pendent', email: 'no' });
  expect(await servidor.solicitaUnirSeAEntitat({ orgId: O, rol: 'administrador' })).toEqual({ orgId: O, personaId: A, rol: 'administrador', estat: 'pendent' });
  expect(m.rpc).toHaveBeenLastCalledWith('solicita_unir_se_a_entitat', { p_org_id: O, p_rol: 'administrador' }, {}, { signal: undefined });
});
test('un servidor que confirma una persona diferent no fabrica èxit', async () => {
  m.rpc.mockResolvedValue({ orgId: O, personaId: B, rol: 'usuari', estat: 'pendent' });
  await expect(servidor.solicitaUnirSeAEntitat({ orgId: O, rol: 'usuari' })).rejects.toMatchObject({ code: 'DESCONEGUT' });
});
/* Onada R6 · Bloc 5 · Com sondaConnexions.js: només PGRST202/PGRST205 són capacitat absent; un 404 nu és DESCONEGUT. */
test('PGRST202/PGRST205 són capacitat absent (un 404 nu no) i els codis SQL de control es conserven', async () => {
  for (const [error, code] of [[Object.assign(new Error('absent'), { status: 404 }), 'DESCONEGUT'], [Object.assign(new Error('absent'), { status: 404, code: 'PGRST205' }), 'NO-DISPONIBLE'], [Object.assign(new Error('absent'), { status: 404, code: 'PGRST202' }), 'NO-DISPONIBLE'], [Object.assign(new Error('SDP-CONN-002: sense control'), { status: 403 }), 'SDP-CONN-002'], [Object.assign(new Error('SDP-ORGMEM-006: només owner'), { status: 403 }), 'SDP-ORGMEM-006']]) {
    m.rpc.mockRejectedValueOnce(error);
    await expect(servidor.inclouPersonaEnEntitat({ orgId: O, personaId: B, rol: 'administrador' })).rejects.toMatchObject({ code });
  }
});
test('un canvi de sessió durant RPC no retorna dades de la persona anterior', async () => {
  let resol; m.rpc.mockImplementationOnce(() => new Promise(r => { resol = r; }));
  const resultat = servidor.preferenciesConnexions({ tipus: 'persona', id: A });
  m.epoch++; m.user = { id: B }; resol(prefs);
  await expect(resultat).rejects.toMatchObject({ name: 'AbortError' });
});
test('rutes insegures i respostes inesperades es rebutgen explícitament', async () => {
  for (const resposta of [null, [{ ...fila, ruta: '//fora.invalid' }], [{ ...fila, direccio: 'desconeguda' }]]) {
    m.rpc.mockResolvedValueOnce(resposta);
    await expect(servidor.connexionsPubliquesDe({ tipus: 'persona', id: A })).rejects.toMatchObject({ code: 'DESCONEGUT' });
  }
});

test('UUID explícit de poble no accepta resposta d’un altre poble; slug sí que es resol', async () => {
  const resposta={tipus:'poble',id:B,visibilitatConnexions:'privada',connexions:[]};
  m.rpc.mockResolvedValue(resposta);
  await expect(servidor.preferenciesConnexions({tipus:'poble',id:A})).rejects.toMatchObject({code:'DESCONEGUT'});
  await expect(servidor.desaVisibilitatConnexions({tipus:'poble',id:A,visibilitatConnexions:'privada'})).rejects.toMatchObject({code:'DESCONEGUT'});
  m.rpc.mockResolvedValue({...resposta,id:A});
  expect((await servidor.preferenciesConnexions({tipus:'poble',id:A})).id).toBe(A);
  expect((await servidor.preferenciesConnexions({tipus:'poble',id:'sella'})).id).toBe(A);
});

/* D-P016 (Onada R9, ordre del Mestre del 261106) · L'interruptor
   (src/config/connexionsPubliques.js) es va apagar mentre la 2611032100 no era
   a producció. IDEA-133 (Onada R10, B2-04) · Ja hi és (GET del 6-11-2026): el
   valor real és encés. Apagat (un backend sense la migració), cap de les sis
   RPC no ix del client en remot. */
test('B2-04 · el valor real de l’interruptor és encés: la 2611032100 és a producció', async () => {
  const real = await vi.importActual('../../config/connexionsPubliques.js');
  expect(real.CONNEXIONS_PUBLIQUES_REMOTES_ACTIVES).toBe(true);
});
test('D-P016 · apagat, cap de les sis operacions fa RPC en remot: totes responen NO-DISPONIBLE', async () => {
  m.actiu = false; m.rpc.mockResolvedValue(prefs);
  const crides = [
    () => servidor.preferenciesConnexions({ tipus: 'persona', id: A }),
    () => servidor.desaVisibilitatConnexions({ tipus: 'persona', id: A, visibilitatConnexions: 'publica', connexio: { tipus: 'persona', id: B } }),
    () => servidor.connexionsPubliquesDe({ tipus: 'persona', id: A }),
    () => servidor.membresIEntitatsConnectadesDe({ tipus: 'poble', id: 'la-torre-de-les-macanes' }),
    () => servidor.membresIEntitatsConnectadesDe({ tipus: 'entitat', id: O }),
    () => servidor.inclouPersonaEnEntitat({ orgId: O, personaId: B, rol: 'treballador' }),
    () => servidor.solicitaUnirSeAEntitat({ orgId: O, rol: 'usuari' }),
  ];
  for (const crida of crides) await expect(crida()).rejects.toMatchObject({ code: 'NO-DISPONIBLE' });
  // També el visitant sense sessió a la fitxa del poble.
  m.user = null;
  await expect(servidor.membresIEntitatsConnectadesDe({ tipus: 'poble', id: 'la-torre-de-les-macanes' })).rejects.toMatchObject({ code: 'NO-DISPONIBLE' });
  expect(m.rpc).not.toHaveBeenCalled();
});
test('D-P016 · apagat, les validacions de sempre van davant (SDP-CONN-000 i SDP-CONN-001) i tampoc no fan RPC', async () => {
  m.actiu = false; m.user = null;
  for (const crida of [() => servidor.preferenciesConnexions({ tipus: 'persona', id: A }), () => servidor.inclouPersonaEnEntitat({ orgId: O, personaId: B, rol: 'usuari' }), () => servidor.solicitaUnirSeAEntitat({ orgId: O, rol: 'usuari' })]) {
    await expect(crida()).rejects.toMatchObject({ code: 'SDP-CONN-000' });
  }
  for (const crida of [() => servidor.connexionsPubliquesDe({ tipus: 'persona', id: 'slug-no-remot' }), () => servidor.membresIEntitatsConnectadesDe({ tipus: 'persona', id: A }), () => servidor.membresIEntitatsConnectadesDe({ tipus: 'poble', id: 'No Es Un Slug' })]) {
    await expect(crida()).rejects.toMatchObject({ code: 'SDP-CONN-001' });
  }
  expect(m.rpc).not.toHaveBeenCalled();
});
