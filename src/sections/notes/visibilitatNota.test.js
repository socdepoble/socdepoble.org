/* Poliment T41 · Els textos del selector de visibilitat no prometen més del
   que fa el servidor: la RLS de lectura de section_submissions exigix ser del
   poble (private.is_town_member), el Mur no és Internet. */
import { expect, test, vi } from 'vitest';
import {
  AVIS_DRETS_RESERVATS, ERROR_PUBLICAR, ErrorPublicacio, MOTIU_FORASTER, MOTIU_LOCAL, MOTIU_NORMES, MOTIU_PREPARADA,
  MOTIU_PREPARADA_CREANT, MOTIU_PREPARADA_FALLIDA, SIGNANT_DESCONEGUT, bloqueigDeNota, motiuSignaturaAliena, publicaAmbMotiu,
  textosAmbDrets, textosDeNota
} from './visibilitatNota.js';
import { cosDeConnexioPerAlMur } from './connexions.js';
import { objecteDePagina } from '../../config/objecteConnectable.js';
import { TEXTOS_MODERACIO } from '../../components/PedraSeca/organismes/textosModeracio.js';

/* Grup E (261008) · La guarda de re-signatura (NotesContext · publishNote) diu
   qui signa la publicació i què cal fer; sense nom, cap text buit. */
test('Grup E · el motiu de no actualitzar una publicació que signa una altra identitat', () => {
  expect(motiuSignaturaAliena('Forn de la Torre')).toBe('Esta publicació la signa Forn de la Torre: canvia a eixa identitat per a actualitzar-la.');
  expect(SIGNANT_DESCONEGUT).toBe('una altra identitat');
  for (const buit of [undefined, null, '', '   ']) {
    expect(motiuSignaturaAliena(buit)).toBe(`Esta publicació la signa ${SIGNANT_DESCONEGUT}: canvia a eixa identitat per a actualitzar-la.`);
  }
});

test.each([false, true])('publicar o compartir al Mur diu qui ho llig: la gent registrada del poble (connexió=%s)', (connexio) => {
  const { publica } = textosDeNota({ connexio });
  expect(publica.explicacio).toContain('la gent registrada del poble, no Internet');
  expect(publica.explicacio).not.toMatch(/qualsevol persona/);
});

/* D2 · T54 · el selector d'una connexió només es veu al lector del MAS, que la
   llig i la canvia de carpeta: les etiquetes es trien en connectar. */
test('una connexió no diu que al MAS s’etiqueta: diu el que fa el lector', () => {
  const { descripcio } = textosDeNota({ connexio: true });
  expect(descripcio).not.toMatch(/etiquet/);
  expect(descripcio).toContain('el llegixes i el canvies de carpeta');
  expect(descripcio).toContain('citant-ne l’origen');
  /* D4 (excepció del Mestre, 260930) · la connexió és una còpia editable. */
  expect(descripcio).toContain('el pots editar');
});

/* D4 · Els drets reservats de l'original s'avisen al selector, i res més canvia. */
test('textosAmbDrets: amb drets reservats afig l’avís a la descripció; sense, els mateixos textos', () => {
  const base = textosDeNota({ connexio: true });
  expect(textosAmbDrets(base, false)).toBe(base);
  const amb = textosAmbDrets(base, true);
  expect(amb.descripcio).toBe(`${base.descripcio} ${AVIS_DRETS_RESERVATS}`);
  expect(amb.descripcio).toContain('Contingut amb drets reservats.');
  expect(amb.descripcio).toContain('no en copies el contingut sencer sense permís de qui el signa');
  expect(amb.publica).toBe(base.publica);
  expect(Object.isFrozen(amb)).toBe(true);
  expect(textosAmbDrets(null, true)).toBeNull();
});

/* Poliment W3C · El cos que ix al Mur (connexions.js) cita sempre d'on ve i
   l'element, però l'autor només si l'origen el porta: una pàgina connectada no
   en té cap (objecteDePagina). El selector no pot prometre «qui l'ha escrit». */
test('compartir una connexió promet citar-ne l’origen, no qui l’ha escrit: una pàgina no porta autor', () => {
  const { publica } = textosDeNota({ connexio: true });
  expect(publica.explicacio).toContain('Ix al teu Mur citant-ne l’origen');
  expect(publica.explicacio).not.toMatch(/qui l.ha escrit/);
  const pagina = objecteDePagina({ titol: 'Fira de maig', ruta: '/fira-de-maig' });
  expect(pagina.autor).toBeNull();
  expect(cosDeConnexioPerAlMur({ titol: pagina.titol, ruta: pagina.ruta }))
    .toBe('<p>Compartit des de Sóc de Poble: <a href="/fira-de-maig">Fira de maig</a>.</p>');
});

/* D3 · La traducció dels errors de publicar, una sola per a l'editor i el lector. */
test('publicaAmbMotiu: true és fet; false i els errors tècnics són ERROR_PUBLICAR', async () => {
  const publica = vi.fn().mockResolvedValue(true);
  await expect(publicaAmbMotiu(publica)).resolves.toBe(true);
  expect(publica).toHaveBeenCalledTimes(1);
  await expect(publicaAmbMotiu(async () => false)).rejects.toThrow(ERROR_PUBLICAR);
  await expect(publicaAmbMotiu(async () => { throw new TypeError('Failed to fetch'); })).rejects.toThrow(ERROR_PUBLICAR);
  // undefined no és false: el consumidor no ha dit que la xarxa haja fallat.
  await expect(publicaAmbMotiu(async () => undefined)).resolves.toBe(true);
});

test('publicaAmbMotiu: un ErrorPublicacio passa el seu motiu, sense «torna-ho a provar»', async () => {
  const motiu = 'No es pot publicar fins que es desen els canvis. Hi ha un conflicte.';
  const error = await publicaAmbMotiu(async () => { throw new ErrorPublicacio(motiu); }).catch((e) => e);
  expect(error.message).toBe(motiu);
  expect(error.message).not.toBe(ERROR_PUBLICAR);
});

/* Integració 261024 (Codex C-02) · El rebuig del servidor per les normes
   (SDP-MOD-428), en les formes en què arriba (el missatge de runtime.request
   o la causa), no és cap xarxa: es torna a preguntar UNA vegada i, si les
   accepta, es publica de nou; mai en bucle. */
const REBUIG_NORMES = 'Supabase 403: {"code":"42501","message":"SDP-MOD-428: cal acceptar les normes de convivència."}';
const rebuigNormes = () => new Error(REBUIG_NORMES);

test('C-02 · MOTIU_NORMES és la reserva valenciana de section.moderacio.normes.calAcceptar', () => {
  expect(MOTIU_NORMES).toBe(TEXTOS_MODERACIO.calAcceptar[1]);
  expect(TEXTOS_MODERACIO.calAcceptar[0]).toBe('section.moderacio.normes.calAcceptar');
});

test('C-02 · sense ningú que torne a preguntar, el rebuig per les normes diu el seu motiu, no «torna-ho a provar»', async () => {
  for (const error of [rebuigNormes(), Object.assign(new Error('XAT'), { cause: rebuigNormes() })]) {
    const publica = vi.fn().mockRejectedValue(error);
    await expect(publicaAmbMotiu(publica)).rejects.toThrow(MOTIU_NORMES);
    expect(publica).toHaveBeenCalledTimes(1);
  }
});

test('C-02 · acceptades de nou, es publica UNA vegada més', async () => {
  const publica = vi.fn().mockRejectedValueOnce(rebuigNormes()).mockResolvedValueOnce(true);
  const tornaAPreguntar = vi.fn(async () => true);
  await expect(publicaAmbMotiu(publica, { tornaAPreguntar, motiuNormes: 'Hay que aceptar las normas.' })).resolves.toBe(true);
  expect(tornaAPreguntar).toHaveBeenCalledTimes(1);
  expect(publica).toHaveBeenCalledTimes(2);
});

test('C-02 · declinades, o rebutjada de nou, el motiu traduït; mai un segon diàleg ni un tercer intent', async () => {
  const declinades = vi.fn(async () => false);
  const una = vi.fn().mockRejectedValue(rebuigNormes());
  await expect(publicaAmbMotiu(una, { tornaAPreguntar: declinades, motiuNormes: 'Hay que aceptar las normas.' }))
    .rejects.toThrow('Hay que aceptar las normas.');
  expect(una).toHaveBeenCalledTimes(1);

  const acceptades = vi.fn(async () => true);
  const sempre = vi.fn().mockRejectedValue(rebuigNormes());
  await expect(publicaAmbMotiu(sempre, { tornaAPreguntar: acceptades })).rejects.toThrow(MOTIU_NORMES);
  expect(acceptades).toHaveBeenCalledTimes(1);
  expect(sempre).toHaveBeenCalledTimes(2);

  /* Un error que no és de les normes, després d'acceptar-les, és el de sempre. */
  const xarxa = vi.fn().mockRejectedValueOnce(rebuigNormes()).mockRejectedValueOnce(new TypeError('Failed to fetch'));
  await expect(publicaAmbMotiu(xarxa, { tornaAPreguntar: acceptades })).rejects.toThrow(ERROR_PUBLICAR);
});

/* P4 (ordre del Mestre, 261003) · La «Nota sense títol» encara no és al
   servidor: no es publica, i el motiu diu què cal fer. El mode local i el
   Foraster continuen manant (el seu motiu és el de veres). */
test('P4 · la nota preparada no es publica; el mode local i el Foraster van davant', () => {
  expect(MOTIU_PREPARADA).toBe('Escriu alguna cosa a la nota per a poder-la publicar al Mur.');
  expect(bloqueigDeNota({ preparada: true })).toEqual({ opcio: 'publica', motiu: MOTIU_PREPARADA });
  expect(bloqueigDeNota({ preparada: true, modeLocal: true })).toEqual({ opcio: 'publica', motiu: MOTIU_LOCAL });
  expect(bloqueigDeNota({ preparada: true, foraster: true })).toEqual({ opcio: 'publica', motiu: MOTIU_FORASTER });
  expect(bloqueigDeNota({})).toBeNull();
});

/* Revisió de P4 · Amb text, «Escriu alguna cosa…» no és cert: el motiu és la
   creació (en camí, o sense arribar al servidor). */
test('revisió de P4 · el motiu de la preparada segueix la seua creació', () => {
  expect(bloqueigDeNota({ preparada: 'buida' })).toEqual({ opcio: 'publica', motiu: MOTIU_PREPARADA });
  expect(bloqueigDeNota({ preparada: 'enviant' })).toEqual({ opcio: 'publica', motiu: MOTIU_PREPARADA_CREANT });
  expect(bloqueigDeNota({ preparada: 'error' })).toEqual({ opcio: 'publica', motiu: MOTIU_PREPARADA_FALLIDA });
  expect(bloqueigDeNota({ preparada: 'pendent' })).toEqual({ opcio: 'publica', motiu: MOTIU_PREPARADA_FALLIDA });
  // Un estat desconegut (ni cap clau del prototip) cau en el motiu de sempre.
  expect(bloqueigDeNota({ preparada: 'toString' })).toEqual({ opcio: 'publica', motiu: MOTIU_PREPARADA });
  expect(MOTIU_PREPARADA_CREANT).not.toBe(MOTIU_PREPARADA);
  expect(MOTIU_PREPARADA_FALLIDA).not.toMatch(/Escriu alguna cosa/);
  // El mode local continua manant.
  expect(bloqueigDeNota({ preparada: 'error', modeLocal: true })).toEqual({ opcio: 'publica', motiu: MOTIU_LOCAL });
});

/* T3 (261024_1800, P2-11) · Cap text del selector diu el jargó intern «MAS» (el salfumant de /connectar):
   ni la nota ni la connexió, ni les etiquetes, les accions, les descripcions o els avisos. */
test('T3 · cap text del selector de visibilitat diu «MAS»; la privada diu a qui és visible', () => {
  const textos = (objecte) => Object.values(objecte || {}).flatMap((valor) => (typeof valor === 'string' ? [valor] : (valor && typeof valor === 'object' ? textos(valor) : [])));
  for (const connexio of [false, true]) {
    const tots = textos(textosAmbDrets(textosDeNota({ connexio }), true));
    expect(tots.length, `connexio=${connexio}`).toBeGreaterThan(8);
    for (const text of tots) expect(text, text).not.toMatch(/\bMAS\b/i);
    expect(textosDeNota({ connexio }).privada.etiqueta).toMatch(/\(només visible per a tu\)$/);
  }
  expect(textosDeNota().privada.etiqueta).toBe('Privada (només visible per a tu)');
  expect(textosDeNota({ connexio: true }).privada).toMatchObject({ etiqueta: 'Privat (només visible per a tu)', accio: 'Deixar-lo privat' });
  expect(textosDeNota({ connexio: true }).irreversible).toBe('Una vegada al Mur, encara no es pot retirar: el podràs actualitzar, però no tornar a fer privat.');
});
