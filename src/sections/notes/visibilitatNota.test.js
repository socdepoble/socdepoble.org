/* Poliment T41 · Els textos del selector de visibilitat no prometen més del
   que fa el servidor. D1 Opció A (decisió del Mestre, 261112) · El Mur del
   poble el pot llegir qualsevol persona, també sense compte: els textos ho
   diuen. El que no hi ix mai només ho diuen amb MUR_PUBLIC_FILTRAT, quan el
   servidor ja servisca la versió pública filtrada (config/i18n.murPublic.test.js). */
import { expect, test, vi } from 'vitest';
import {
  AVIS_DRETS_RESERVATS, ERROR_PUBLICAR, ErrorPublicacio, MOTIU_FORASTER, MOTIU_LOCAL, MOTIU_NORMES, MOTIU_PREPARADA,
  MOTIU_PREPARADA_CREANT, MOTIU_PREPARADA_FALLIDA, MOTIU_PUBLICADA, MUR_PUBLIC_FILTRAT, SIGNANT_DESCONEGUT, TEXTOS_VISIBILITAT_NOTA,
  bloqueigDeNota, motiuSignaturaAliena, publicaAmbMotiu, textLecturaPublica, textosAmbDrets, textosDeNota, textosEnLiniaDeNota, textosExtern
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

const LECTURA_PUBLICA = 'Qualsevol persona, també sense compte, ho pot llegir.';
const VERSIO_PUBLICA = 'Qualsevol persona, també sense compte, en pot llegir la versió pública: el títol i el text, el poble i la data. Mai hi ix el teu identificador intern, el teu contacte privat ni la ubicació exacta de les fotos.';
/* El que s'afig darrere de cada explicació de publicar o compartir. */
const DARRERE = MUR_PUBLIC_FILTRAT ? VERSIO_PUBLICA : LECTURA_PUBLICA;
/* Les afirmacions d'abans, falses amb la lectura pública del Mur. */
const AFIRMACIO_FALSA = /registrada|Internet/i;
const tots = (objecte) => Object.values(objecte || {}).flatMap((valor) => (typeof valor === 'string' ? [valor] : (valor && typeof valor === 'object' ? tots(valor) : [])));

/* D1 Opció A (261112) · Publicar o compartir al Mur: qualsevol persona,
   també sense compte, ho pot llegir. Res de «la gent registrada» ni de «no
   Internet». Les garanties de la versió pública (títol i text, poble i data;
   mai l'identificador intern, el contacte privat ni la ubicació exacta de les
   fotos) només s'hi afigen amb MUR_PUBLIC_FILTRAT. */
test.each([false, true])('D1 Opció A · publicar o compartir al Mur diu que qualsevol persona ho pot llegir (connexió=%s)', (connexio) => {
  const { publica } = textosDeNota({ connexio });
  expect(TEXTOS_VISIBILITAT_NOTA.lecturaPublica).toEqual(['section.notes.visibilitat.lecturaPublica', LECTURA_PUBLICA]);
  expect(TEXTOS_VISIBILITAT_NOTA.versioPublica).toEqual(['section.notes.visibilitat.versioPublica', VERSIO_PUBLICA]);
  expect(publica.explicacio).toBe(`${connexio ? 'Ix al teu Mur citant-ne l’origen.' : 'Ix al Mur del poble.'} ${DARRERE}`);
  expect(publica.explicacio).not.toMatch(AFIRMACIO_FALSA);
});

test('D1 Opció A · sense la versió filtrada al servidor, el text no diu què no hi ix; amb ella, sí', () => {
  expect(textLecturaPublica()).toBe(DARRERE);
  expect(textLecturaPublica(null, false)).toBe(LECTURA_PUBLICA);
  expect(textLecturaPublica(null, true)).toBe(VERSIO_PUBLICA);
  const t = vi.fn((clau, reserva) => `[${clau}] ${reserva}`);
  expect(textLecturaPublica(t, false)).toBe(`[section.notes.visibilitat.lecturaPublica] ${LECTURA_PUBLICA}`);
  expect(textLecturaPublica(t, true)).toBe(`[section.notes.visibilitat.versioPublica] ${VERSIO_PUBLICA}`);
  if (!MUR_PUBLIC_FILTRAT) {
    const tot = [textosDeNota(), textosDeNota({ connexio: true }), textosExtern(), textosEnLiniaDeNota(), textosEnLiniaDeNota({ seccio: 'mercat' }), textosEnLiniaDeNota({ connexio: true })].flatMap(tots);
    for (const text of tot) expect(text, text).not.toMatch(/versió pública|identificador intern|contacte privat|ubicació exacta/);
  }
});

test('D1 Opció A · el panell en línia de /notes diu el mateix en els quatre casos (nota, Mercat, connexió i contingut de fora)', () => {
  const casos = [{}, { seccio: 'mercat' }, { connexio: true }, { extern: true }, { connexio: true, dretsReservats: true }];
  for (const cas of casos) {
    const textos = textosEnLiniaDeNota(cas);
    expect(textos.publica.explicacio.endsWith(` ${DARRERE}`), JSON.stringify(cas)).toBe(true);
    for (const text of tots(textos)) expect(text, text).not.toMatch(AFIRMACIO_FALSA);
  }
  expect(textosEnLiniaDeNota().publica.explicacio).toBe(`Es publica amb la teua signatura i ix al Mur del poble. ${DARRERE}`);
  expect(textosEnLiniaDeNota({ connexio: true }).publica.explicacio).toBe(`Es compartix al Mur citant-ne l’origen i l’autoria. ${DARRERE}`);
});

/* honestedat_textos-10 (R21) · Una publicació del Mercat ix al Mercat: el
   panell no diu «ix al Mur» ni «Una vegada al Mur». Una cita (connexió o
   contingut de fora) sempre va al Mur, també des del Mercat. */
test('R21 · el panell en línia del Mercat diu Mercat a l’explicació i a l’avís de no poder-la retirar', () => {
  const mercat = textosEnLiniaDeNota({ seccio: 'mercat' });
  expect(mercat.publica.explicacio).toBe(`Es publica amb la teua signatura i ix al Mercat del poble. ${DARRERE}`);
  expect(mercat.irreversible).toBe('Una vegada al Mercat, encara no es pot retirar: la podràs actualitzar, però no tornar a fer privada.');
  expect(tots(mercat).filter((text) => /\bMur\b/.test(text))).toEqual([]);
  expect(textosEnLiniaDeNota().irreversible).toBe(textosDeNota().irreversible);
  expect(textosEnLiniaDeNota({ seccio: 'mercat', connexio: true }).publica.explicacio).toBe(textosEnLiniaDeNota({ connexio: true }).publica.explicacio);
  expect(textosEnLiniaDeNota({ seccio: 'mercat', connexio: true }).irreversible).toBe(textosDeNota({ connexio: true }).irreversible);
  const t = vi.fn((clau, reserva) => `[${clau}] ${reserva}`);
  const traduit = textosEnLiniaDeNota({ seccio: 'mercat', t });
  expect(traduit.publica.explicacio.startsWith('[section.notes.visibilitat.enLinia.publica.explicacioMercat] ')).toBe(true);
  expect(traduit.irreversible).toBe('[section.notes.visibilitat.enLinia.irreversibleMercat] Una vegada al Mercat, encara no es pot retirar: la podràs actualitzar, però no tornar a fer privada.');
});

/* D1 Opció A · (1) Mentre no es publica, la nota és privada i només la veu la
   propietària: amb sessió, a public.notes (RLS de propietària); en mode local o
   a la còpia de prova, en este dispositiu. Els textos de «privada» han de ser
   certs en tots dos modes: no diuen ni «servidor» ni «dispositiu». (4) Retirar
   del Mur encara no té contracte en esta còpia: cap text no promet que
   esborrar o retirar la lleve del Mur, i els avisos de sempre ho diuen. */
test('D1 Opció A · la privada és certa en tots dos modes i ningú no promet retirar del Mur', () => {
  for (const privada of [textosDeNota().privada, textosDeNota({ connexio: true }).privada, textosEnLiniaDeNota().privada]) {
    for (const text of tots(privada)) expect(text, text).not.toMatch(/servidor|dispositiu|Internet|registrada/i);
  }
  expect(textosEnLiniaDeNota().privada.explicacio).toBe('Es desa automàticament al teu Bloc de notes i ningú més la pot vore.');
  const tot = [textosDeNota(), textosDeNota({ connexio: true }), textosExtern(), textosEnLiniaDeNota(), textosEnLiniaDeNota({ connexio: true })].flatMap(tots);
  for (const text of tot) expect(text, text).not.toMatch(/(?:esborrar|retirar)-(?:la|lo)[^.]*(?:lleva|retira) del Mur/i);
  expect(textosDeNota().irreversible).toContain('encara no es pot retirar');
  expect(bloqueigDeNota({ publicada: true })).toEqual({ opcio: 'privada', motiu: MOTIU_PUBLICADA });
  expect(MOTIU_PUBLICADA).toContain('encara no té contracte de dades amb el servidor');
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
