/* Poliment T41 · Els textos del selector de visibilitat no prometen més del
   que fa el servidor: la RLS de lectura de section_submissions exigix ser del
   poble (private.is_town_member), el Mur no és Internet. */
import { expect, test, vi } from 'vitest';
import { AVIS_DRETS_RESERVATS, ERROR_PUBLICAR, ErrorPublicacio, publicaAmbMotiu, textosAmbDrets, textosDeNota } from './visibilitatNota.js';
import { cosDeConnexioPerAlMur } from './connexions.js';
import { objecteDePagina } from '../../config/objecteConnectable.js';

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
