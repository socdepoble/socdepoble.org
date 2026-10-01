/* Torn 260930 (T1) · El model del full «Ajustos» (captures 20.47–21.05 de
   WhatsApp Desktop): l'arbre és sa (cada porta té pàgina, cada pàgina té
   porta, cap id repetit, cap ruta inventada), l'arrel té l'ordre de la
   captura i la cerca plega accents i travessa tot l'arbre. */
import { describe, expect, test } from 'vitest';
import { SECTIONS } from '../../config/sections.js';
import { SUPPORTED_LANGUAGES } from '../../config/i18n.js';
import { PREFERENCIES_TEMA } from '../../config/theme.js';
import {
  ARREL_AJUSTOS, OPCIONS_TEMA, PAGINES_AJUSTOS, RUTES_AJUSTOS, caminsAjustos, cercaAjustos, etiquetaDeFila,
  filaQueObri, filesDePagina, paginaAjustos, pilaDeResultat, textDe
} from './ajustosXat.js';
import { PRESETS_AMPLARIA, presetDeMides } from './amplariaColumnes.js';

const TOTES = Object.values(PAGINES_AJUSTOS).flatMap(filesDePagina);
const etiquetes = (resultats) => resultats.map(({ fila }) => etiquetaDeFila(fila));

describe('l’arbre', () => {
  test('l’arrel calca la captura 20.48.41: quatre grups, en l’ordre de WhatsApp', () => {
    const arrel = paginaAjustos(ARREL_AJUSTOS);
    expect(textDe(arrel.titol)).toBe('Ajustos');
    expect(arrel.cercador).toBe(true);
    expect(arrel.perfil).toBe(true);
    expect(arrel.grups.map((g) => g.files.map((f) => etiquetaDeFila(f)))).toEqual([
      ['Preferits', 'Destacats'],
      ['Historial del xat'],
      ['Compte', 'Privacitat', 'Xats', 'Aparença', 'Notificacions', 'Dades i memòria local'],
      ['Ajuda']
    ]);
    /* A l'arrel, cada fila porta icona; a les subpàgines, cap (WhatsApp). */
    expect(filesDePagina(arrel).every((f) => typeof f.icona === 'string')).toBe(true);
    for (const pagina of Object.values(PAGINES_AJUSTOS)) {
      if (pagina.id === ARREL_AJUSTOS) continue;
      expect([pagina.id, filesDePagina(pagina).some((f) => f.icona)]).toEqual([pagina.id, false]);
    }
  });

  test('cap id de fila repetit: el focus hi torna per l’id', () => {
    const ids = TOTES.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('cada fila «pagina» porta a una pàgina que existix, i cada pàgina té una porta des de l’arrel', () => {
    for (const fila of TOTES.filter((f) => f.tipus === 'pagina')) {
      expect([fila.id, Boolean(paginaAjustos(fila.pagina))]).toEqual([fila.id, true]);
    }
    expect(Object.keys(caminsAjustos()).sort()).toEqual(Object.keys(PAGINES_AJUSTOS).sort());
    /* Aparença té dos portes (l'arrel i Xats) i pren la més curta. */
    expect(caminsAjustos().aparenca).toEqual(['arrel', 'aparenca']);
    expect(caminsAjustos().amplaria).toEqual(['arrel', 'xats', 'amplaria']);
  });

  test('cap ruta inventada: el perfil i les pàgines d’ajuda existixen a l’app', () => {
    const rutes = new Set(SECTIONS.map((s) => s.path));
    expect(RUTES_AJUSTOS.perfil).toBe('/el-meu-perfil');
    for (const ruta of [RUTES_AJUSTOS.wiki, RUTES_AJUSTOS.legal, RUTES_AJUSTOS.versions]) expect([ruta, rutes.has(ruta)]).toEqual([ruta, true]);
    for (const fila of TOTES.filter((f) => f.tipus === 'ruta')) expect(Object.values(RUTES_AJUSTOS)).toContain(fila.ruta);
    expect(filesDePagina(paginaAjustos('ajuda')).map((f) => [etiquetaDeFila(f), f.ruta])).toEqual([
      ['Wiki de Poble', '/wikidepoble'], ['Legal i privacitat', '/legal'], ['Versions', '/versions']
    ]);
  });

  test('cada pàgina és d’un sol tipus: grups, especial o en construcció', () => {
    for (const pagina of Object.values(PAGINES_AJUSTOS)) {
      const tipus = [Boolean(pagina.grups), Boolean(pagina.especial), Boolean(pagina.construccio)].filter(Boolean);
      expect([pagina.id, tipus.length]).toEqual([pagina.id, 1]);
    }
    /* En construcció, honestament: el que encara no té dades. */
    const enConstruccio = Object.values(PAGINES_AJUSTOS).filter((p) => p.construccio).map((p) => p.id).sort();
    expect(enConstruccio).toEqual(['dades', 'destacats', 'historial', 'multimedia', 'notificacions', 'temporals']);
    /* Destacats diu el mateix que la vista del rail (textosDeVista). */
    expect(paginaAjustos('destacats').construccio).toEqual({ vista: 'destacats' });
  });

  test('les opcions: el tema de theme.js, les cinc llengües (la pròpia primer) i els tres presets', () => {
    expect(OPCIONS_TEMA.map((o) => o.opcio)).toEqual(PREFERENCIES_TEMA);
    expect(OPCIONS_TEMA.map((o) => etiquetaDeFila(o))).toEqual(['Igual que el sistema', 'Mode clar', 'Mode fosc']);
    const [tema, llengua] = paginaAjustos('aparenca').grups;
    expect([tema.seleccio, llengua.seleccio]).toEqual(['tema', 'llengua']);
    expect(llengua.files.map((f) => f.opcio)).toEqual(['ca', ...SUPPORTED_LANGUAGES.map((l) => l.code).filter((c) => c !== 'ca')]);
    expect(llengua.files[0].text).toBe('Valencià');
    expect(paginaAjustos('amplaria').grups[0].files.map((f) => f.opcio)).toEqual(PRESETS_AMPLARIA.map(([id]) => id));
  });

  test('«Tanca la sessió» és roja, sense xebró, i només amb sessió', () => {
    const [perfil, eixida] = paginaAjustos('compte').grups;
    expect(perfil.files[0]).toMatchObject({ tipus: 'ruta', ruta: '/el-meu-perfil', valor: 'correu' });
    expect(eixida).toMatchObject({ nomesAmbSessio: true });
    expect(eixida.files[0]).toMatchObject({ tipus: 'accio', accio: 'eixida', perill: true });
  });
});

describe('cercaAjustos', () => {
  test('sense terme no se cerca (null); amb espais tampoc', () => {
    expect(cercaAjustos('')).toBeNull();
    expect(cercaAjustos('   ')).toBeNull();
  });

  test('plega accents i majúscules, com /cerca: «aparenca» troba «Aparença» una sola vegada', () => {
    const resultats = cercaAjustos('APARENCA');
    expect(etiquetes(resultats)).toEqual(['Aparença']);
    expect(resultats[0]).toMatchObject({ pagina: 'arrel', cami: ['arrel'] });
    expect(etiquetes(cercaAjustos('memoria'))).toEqual(['Dades i memòria local']);
  });

  test('travessa tot l’arbre i diu on viu cada fila', () => {
    const [fosc] = cercaAjustos('fosc');
    expect(etiquetaDeFila(fosc.fila)).toBe('Mode fosc');
    expect(fosc).toMatchObject({ pagina: 'aparenca', cami: ['arrel', 'aparenca'] });
    expect(etiquetes(cercaAjustos('compacta'))).toEqual(['Compacta']);
    expect(etiquetes(cercaAjustos('wiki'))).toEqual(['Wiki de Poble']);
  });

  test('cada paraula ha de ser-hi (AND)', () => {
    expect(etiquetes(cercaAjustos('mode clar'))).toEqual(['Mode clar']);
    expect(cercaAjustos('mode zzz')).toEqual([]);
  });

  test('sense sessió, «Tanca la sessió» no es troba', () => {
    expect(etiquetes(cercaAjustos('sessio'))).toEqual(['Tanca la sessió']);
    expect(cercaAjustos('sessio', { ambSessio: false })).toEqual([]);
  });

  test('busca en el text traduït', () => {
    const t = (clau, text) => (clau === 'section.xat.ajustos.aparenca' ? 'Apariencia' : text);
    expect(cercaAjustos('apariencia', { t }).map(({ fila }) => etiquetaDeFila(fila, t))).toEqual(['Apariencia']);
    expect(cercaAjustos('aparenca', { t })).toEqual([]);
  });

  test('la pila d’un resultat: la pàgina de destí i, per a cada nivell, la fila que l’obri', () => {
    expect(pilaDeResultat(null)).toEqual([{ id: 'arrel', origen: null }]);
    const [aparenca] = cercaAjustos('aparenca');
    expect(pilaDeResultat(aparenca)).toEqual([{ id: 'arrel', origen: null }, { id: 'aparenca', origen: 'aparenca' }]);
    const [compacta] = cercaAjustos('compacta');
    expect(pilaDeResultat(compacta)).toEqual([
      { id: 'arrel', origen: null }, { id: 'xats', origen: 'amplaria-compacta' }, { id: 'amplaria', origen: 'xats-amplaria' }
    ]);
    expect(filaQueObri('arrel', 'no-existix')).toBeNull();
  });
});

describe('presetDeMides', () => {
  const TAULA = { compacta: { left: 210, middle: 250 }, defecte: { left: 260, middle: 280 }, ampla: { left: 300, middle: 340 } };
  test('les mides exactes d’un preset diuen quin és; una mida pròpia, cap', () => {
    expect(presetDeMides({ left: 260, middle: 280 }, TAULA)).toBe('defecte');
    expect(presetDeMides({ left: 300, middle: 340 }, TAULA)).toBe('ampla');
    expect(presetDeMides({ left: 261, middle: 280 }, TAULA)).toBeNull();
    expect(presetDeMides(null, TAULA)).toBeNull();
  });
});
