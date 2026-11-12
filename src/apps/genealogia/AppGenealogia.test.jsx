/* Arbre Genealògic · l'app sencera dins de la plataforma (jsdom): la guarda
   d'ama del document, la porta de l'avís, l'entrevista d'una sola pregunta per
   torn, l'arbre amb la numeració Sosa i els quatre estats en text, el
   generador de prompts amb el botó de copiar (sense persones vives),
   l'exportació GEDCOM amb l'avís «Prepara, no publica» i les cinc llengües.
   Dades sintètiques en un magatzem en memòria. */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { ENTORN_OBERT, muntaPlataforma } from '../plataforma/__fixtures__/munta.jsx';
import { _reiniciaPreferencies } from '../plataforma/preferenciesApps.js';
import { creaRegistre } from '../plataforma/registreApps.js';
import { validaTaulaDeClosa } from '../plataforma/index.js';
import manifestGenealogia from './manifest.js';
import AppGenealogia from './AppGenealogia.jsx';
import { RUTES_GENEALOGIA } from './rutesGenealogia.js';
import { TEXTOS, VERSIO_AVIS, nomVisible, t, textAlerta, textCodiLectura, textError } from './textos.js';
import { carregaArbre, creaMagatzemGenealogia, desaArbre, desaMeta, llistaArbres } from './magatzem.js';
import { ARBRE_ID, complet, persona, rel, uid } from './nucli/__fixtures__/arbreSintetic.js';

const ENTORN = Object.freeze({ ...ENTORN_OBERT, produccio: false });
const ARA = new Date(2026, 10, 11, 9, 30);
const LLENGUES = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);
let magatzem;
let n;

function munta(url, { entorn = ENTORN, externalConfig = {} } = {}) {
  const App = () => (
    <AppGenealogia magatzem={magatzem} rellotge={() => ARA}
      nouId={() => { n += 1; return `00000000-0000-4000-8000-${String(9000 + n).padStart(12, '0')}`; }} />
  );
  const carrega = vi.fn(() => Promise.resolve({ default: App }));
  muntaPlataforma(url, { registre: creaRegistre({ internes: [{ ...manifestGenealogia, carrega }] }), entorn, externalConfig });
  return carrega;
}

const ubicacio = () => screen.getByTestId('ubicacio').textContent;
const acceptaAvis = () => desaMeta(magatzem, 'avis', { acceptatA: '2026-11-01T08:00:00.000Z', versio: VERSIO_AVIS });

/*
 * Un arbre sintètic amb els quatre estats:
 *   1 la persona 1, nascuda el 1990 (viva: protegida a tota eixida) · [FALTA CONFIRMAR]
 *   2 el pare, 1960? (estimada), confirmat per document · [CONFIRMAT]
 *   3 la mare, ~1962 (aproximada) · [APROXIMAT]
 *   4 l'iaio patern: 1880–2010, més de 120 anys de vida · [CONTRADICCIÓ]
 */
async function sembraArbre() {
  const persones = [
    persona(1, { nom: 'Inventada', cognom1: 'Viva', cognom2: 'Prova', sexe: 'F', naixement: '1990', viva: 'si' }),
    persona(2, { nom: 'Pare', cognom1: 'Exemple', sexe: 'M', naixement: '1960?', viva: 'no', estat: 'confirmat' }),
    persona(3, { nom: 'Mare', cognom1: 'Mostra', sexe: 'F', naixement: '~1962', viva: 'no', estat: 'aproximat' }),
    persona(4, { nom: 'Iaio', cognom1: 'Exemple', sexe: 'M', naixement: '1880', defuncio: '2010', viva: 'no', estat: 'aproximat' })
  ];
  const relacions = [rel(11, 'progenitor', 2, 1), rel(12, 'progenitor', 3, 1), rel(13, 'progenitor', 4, 2)];
  await desaArbre(magatzem, complet(persones, relacions, { arrelId: uid(1) }));
  await desaMeta(magatzem, 'arbreActiu', ARBRE_ID);
}

beforeEach(() => {
  n = 0;
  window.localStorage.clear();
  _reiniciaPreferencies();
  magatzem = creaMagatzemGenealogia({ idb: null, navegador: null, Canal: null, anyActual: 2026 });
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
});

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('la closca', () => {
  test('la taula de rutes és vàlida per al manifest (cada primer tram és una entrada)', () => {
    expect(validaTaulaDeClosa(RUTES_GENEALOGIA, manifestGenealogia)).toEqual({ ok: true, errors: [] });
  });

  test('fora del document propi (encastada) no es carrega: un avís i res més', async () => {
    const carrega = munta('/app/genealogia/entrevista', { entorn: { ...ENTORN, amaDelDocument: false } });
    expect(await screen.findByText('Esta app no es pot obrir ací')).toBeTruthy();
    expect(carrega).not.toHaveBeenCalled();
  });

  test('la porta de l’avís: fins que no s’accepta, només l’avís; «Entesos» porta a l’entrevista', async () => {
    munta('/app/genealogia/arbre');
    const entesos = await screen.findByRole('button', { name: 'Entesos' });
    expect(ubicacio()).toBe('/app/genealogia/avis');
    expect(screen.getByText(/no cerca als arxius ni parla amb cap IA/)).toBeTruthy();
    expect(screen.getByText(/es queden en este dispositiu/)).toBeTruthy();
    fireEvent.click(entesos);
    await waitFor(() => expect(ubicacio()).toBe('/app/genealogia/entrevista'));
    expect(await screen.findByRole('heading', { level: 3, name: /malnom de la vostra casa/ })).toBeTruthy();
  });

  test('un paràmetre que no és un UUID ni un arxiu conegut no obri res', async () => {
    await acceptaAvis();
    munta('/app/genealogia/arxius/no-existix');
    expect(await screen.findByText('Esta pàgina de l’app no existix')).toBeTruthy();
  });
});

describe('l’entrevista: una sola pregunta per torn', () => {
  test('cada torn ensenya UNA pregunta; respondre passa a la següent i la resposta es veu al mig', async () => {
    await acceptaAvis();
    munta('/app/genealogia/entrevista');
    const primera = await screen.findByRole('heading', { level: 3 });
    expect(primera.textContent).toMatch(/malnom de la vostra casa/);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(1);
    fireEvent.change(screen.getByRole('textbox', { name: 'La teua resposta' }), { target: { value: 'Ca la Prova' } });
    fireEvent.click(screen.getByRole('button', { name: 'Següent' }));
    await waitFor(() => expect(screen.getByRole('heading', { level: 3 }).textContent).toMatch(/mas, partida o poble/));
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(1);
    expect(screen.queryByText(/malnom de la vostra casa/)).toBeNull();
    /* La resposta ja és al resum del mig i a l'arbre (la primera resposta en crea un). */
    expect(within(screen.getByRole('region', { name: 'Respostes donades' })).getByText('Ca la Prova')).toBeTruthy();
    const [arbre] = await llistaArbres(magatzem);
    expect((await carregaArbre(magatzem, arbre.id)).entrevista.respostes.casa).toBe('Ca la Prova');
  });

  test('una persona: el nom és obligatori, el cognom matern es demana i Cognom ≠ Parentiu es recorda', async () => {
    await acceptaAvis();
    munta('/app/genealogia/entrevista');
    await screen.findByRole('heading', { level: 3 });
    fireEvent.click(screen.getByRole('button', { name: 'Salta' }));
    await waitFor(() => expect(screen.getByRole('heading', { level: 3 }).textContent).toMatch(/mas, partida o poble/));
    fireEvent.click(screen.getByRole('button', { name: 'Salta' }));
    await waitFor(() => expect(screen.getByRole('heading', { level: 3 }).textContent).toMatch(/Comencem per tu/));
    expect(screen.getByRole('textbox', { name: 'Cognom matern (segon cognom)' })).toBeTruthy();
    expect(screen.getByText(/Cognom ≠ Parentiu/)).toBeTruthy();
    /* Les quatre precisions de data i el selector de dècada. */
    for (const precisio of ['Exacta (1908)', 'Aproximada (~1908)', 'Estimada (1908?)', 'Desconeguda']) {
      expect(screen.getByRole('radio', { name: precisio })).toBeTruthy();
    }
    expect(screen.getByRole('combobox', { name: 'O tria una dècada' })).toBeTruthy();
    /* G4 no és opcional: sense nom no es passa. */
    expect(screen.queryByRole('button', { name: 'Salta' })).toBeNull();
    fireEvent.change(screen.getByRole('textbox', { name: 'Primer cognom' }), { target: { value: 'Exemple' } });
    fireEvent.click(screen.getByRole('button', { name: 'Següent' }));
    expect(await screen.findByText('Cal respondre-ho per a continuar.')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3 }).textContent).toMatch(/Comencem per tu/);
  });
});

describe('l’arbre i la numeració Sosa', () => {
  test('les generacions amb els números Sosa, els forats i els quatre estats amb text', async () => {
    await acceptaAvis();
    await sembraArbre();
    munta('/app/genealogia/arbre');
    const g1 = await screen.findByRole('region', { name: 'Generació 1 · la persona 1' });
    expect(within(g1).getByRole('rowheader', { name: '1' })).toBeTruthy();
    expect(within(g1).getByRole('link', { name: 'Inventada Viva Prova' }).getAttribute('href')).toBe(`/app/genealogia/arbre/${uid(1)}`);
    const g2 = screen.getByRole('region', { name: 'Generació 2 · pares' });
    const fila2 = within(g2).getByRole('rowheader', { name: '2' }).closest('tr');
    expect(within(fila2).getByText('Pare Exemple')).toBeTruthy();
    expect(within(fila2).getByText('1960?')).toBeTruthy();
    expect(within(fila2).getByText('[CONFIRMAT]')).toBeTruthy();
    const fila3 = within(g2).getByRole('rowheader', { name: '3' }).closest('tr');
    expect(within(fila3).getByText('~1962')).toBeTruthy();
    expect(within(fila3).getByText('[APROXIMAT]')).toBeTruthy();
    const g3 = screen.getByRole('region', { name: 'Generació 3 · iaios' });
    const fila4 = within(g3).getByRole('rowheader', { name: '4' }).closest('tr');
    expect(within(fila4).getByText('[CONTRADICCIÓ]')).toBeTruthy();
    /* Les posicions buides (5, 6 i 7) es veuen i porten a afegir la persona. */
    const fila5 = within(g3).getByRole('rowheader', { name: '5' }).closest('tr');
    expect(within(fila5).getByRole('link', { name: 'Falta: afig-la' }).getAttribute('href')).toBe('/app/genealogia/persones/nova');
    expect(within(g1).getByText('[FALTA CONFIRMAR]')).toBeTruthy();
    /* L'inspector explica la contradicció amb paraules. */
    expect(await screen.findByText('Iaio Exemple: més de 120 anys de vida.')).toBeTruthy();
  });

  test('la fitxa: els números Sosa i els vincles amb el seu estat', async () => {
    await acceptaAvis();
    await sembraArbre();
    munta(`/app/genealogia/arbre/${uid(2)}`);
    expect(await screen.findByText('Números Sosa: 2')).toBeTruthy();
    expect(screen.getByText('Fill o filla:', { exact: false })).toBeTruthy();
    expect(screen.getByText('Mare o pare:', { exact: false })).toBeTruthy();
  });
});

describe('els prompts per a copiar', () => {
  test('el generador: text emplenat, botó de copiar, la persona viva no hi ix i la casella va desmarcada', async () => {
    await acceptaAvis();
    await sembraArbre();
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal('navigator', { ...window.navigator, clipboard: { writeText } });
    munta('/app/genealogia/prompts/gps');
    const area = await screen.findByRole('textbox', { name: 'El prompt' });
    await waitFor(() => expect(area.value).toMatch(/\[CONFIRMAT\]/));
    expect(area.value).not.toMatch(/Inventada/);
    expect(area.value).toMatch(/Pare/);
    expect(screen.getByRole('checkbox', { name: /Inclou persones vives/ }).checked).toBe(false);
    expect(screen.getByText('Activa la Cerca Web del teu assistent abans d’enganxar-lo.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Copia' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(area.value));
    expect(await screen.findByText('Copiat. Ara enganxa’l on vulgues.')).toBeTruthy();
  });

  test('els arxius: un enllaç oficial només si està verificat; si no, s’explica com trobar-lo', async () => {
    await acceptaAvis();
    munta('/app/genealogia/arxius/pares');
    const enllac = await screen.findByRole('link', { name: 'Obri la web oficial' });
    expect(enllac.getAttribute('href')).toMatch(/^https:\/\/pares\.cultura\.gob\.es\//);
    expect(enllac.getAttribute('rel')).toBe('noopener noreferrer');
    cleanup();
    munta('/app/genealogia/arxius/padrons');
    expect(await screen.findByText(/l’app no posa cap enllaç fins que algú la confirme/)).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Obri la web oficial' })).toBeNull();
  });
});

describe('GEDCOM i còpia', () => {
  test('exporta: «Prepara, no publica», el text es revisa abans de descarregar i les vives ixen anonimitzades', async () => {
    await acceptaAvis();
    await sembraArbre();
    const crea = vi.fn(() => 'blob:local');
    vi.stubGlobal('URL', Object.assign(Object.create(URL), { createObjectURL: crea, revokeObjectURL: vi.fn() }));
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    munta('/app/genealogia/intercanvi');
    expect(await screen.findByText('Prepara, no publica')).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'GEDCOM 7.0' }).checked).toBe(true);
    expect(screen.getByRole('checkbox', { name: /Inclou persones vives/ }).checked).toBe(false);
    expect(screen.queryByRole('button', { name: 'Descarrega' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Prepara el fitxer' }));
    const area = await screen.findByRole('textbox', { name: 'Revisa el contingut' });
    expect(area.value).toMatch(/^0 HEAD/);
    expect(area.value).toMatch(/2 VERS 7\.0/);
    expect(area.value).toMatch(/0 TRLR\s*$/);
    expect(area.value).not.toMatch(/Inventada/);
    expect(screen.getByText('1 persones vives ixen anonimitzades.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Descarrega' }));
    expect(await screen.findByText('Fitxer descarregat. Guarda’l en un lloc segur.')).toBeTruthy();
    expect(crea).toHaveBeenCalledTimes(1);
    expect(clic).toHaveBeenCalledTimes(1);
    /* El 5.5.1 també, amb la seua capçalera. */
    fireEvent.click(screen.getByRole('radio', { name: 'GEDCOM 5.5.1 (programes antics)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Prepara el fitxer' }));
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Revisa el contingut' }).value).toMatch(/2 VERS 5\.5\.1/));
  });
});

describe('persones i importació', () => {
  test('l’editor: una persona nova es desa, i un vincle naix només de la tria explícita amb la seua evidència', async () => {
    await acceptaAvis();
    await sembraArbre();
    munta('/app/genealogia/persones/nova');
    fireEvent.change(await screen.findByRole('textbox', { name: 'Nom' }), { target: { value: 'Germana' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Primer cognom' }), { target: { value: 'Exemple' } });
    fireEvent.click(screen.getByRole('button', { name: 'Desa' }));
    await waitFor(() => expect(ubicacio()).toMatch(/^\/app\/genealogia\/persones\/00000000-0000-4000-8000-0000000090\d\d$/));
    const novaId = ubicacio().split('/').pop();
    /* Compartix cognom amb el pare i l'iaio, però l'app no les ha ajuntades. */
    let arbre = await carregaArbre(magatzem, ARBRE_ID);
    expect(arbre.relacions.filter((r) => r.de === novaId || r.a === novaId)).toEqual([]);
    fireEvent.change(await screen.findByRole('combobox', { name: 'Amb qui' }), { target: { value: uid(2) } });
    expect(screen.getByRole('combobox', { name: 'Quin vincle' }).value).toBe('esFillDe');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Hi ha una font escrita' }));
    expect(within(screen.getByRole('group', { name: 'Com ho saps' })).getByText('[CONFIRMAT]')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Afig el vincle' }));
    await waitFor(async () => {
      arbre = await carregaArbre(magatzem, ARBRE_ID);
      expect(arbre.relacions.find((r) => r.a === novaId)).toMatchObject({ tipus: 'progenitor', de: uid(2), estat: 'confirmat' });
    });
  });

  test('importa: el límit de mida es mira abans de llegir, i un GEDCOM vàlid es pot desar com a arbre nou', async () => {
    await acceptaAvis();
    munta('/app/genealogia/intercanvi/importa');
    const input = await screen.findByLabelText('Fitxer GEDCOM (.ged) o còpia (.json)');
    const gran = new File(['x'], 'gran.ged');
    Object.defineProperty(gran, 'size', { value: 9 * 1024 * 1024 });
    const text = vi.spyOn(gran, 'text');
    fireEvent.change(input, { target: { files: [gran] } });
    expect(await screen.findByText('El fitxer passa de 8 MB: no s’obri.')).toBeTruthy();
    expect(text).not.toHaveBeenCalled();
    const ged = ['0 HEAD', '1 GEDC', '2 VERS 7.0', '0 @I1@ INDI', '1 NAME Pere /Exemple/', '1 SEX M', '1 BIRT', '2 DATE ABT 1900',
      '0 @I2@ INDI', '1 NAME Joan /Exemple/', '1 SEX M', '1 BIRT', '2 DATE 1930', '0 @F1@ FAM', '1 HUSB @I1@', '1 CHIL @I2@', '0 TRLR'].join('\n');
    fireEvent.change(input, { target: { files: [new File([ged], 'familia.ged')] } });
    expect(await screen.findByText('Versió: 7.0')).toBeTruthy();
    expect(screen.getByText('2 persones · 1 vincles')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Desa com a arbre nou' }));
    await waitFor(() => expect(ubicacio()).toBe('/app/genealogia/arbre'));
    const arbres = await llistaArbres(magatzem);
    expect(arbres).toHaveLength(1);
    expect((await carregaArbre(magatzem, arbres[0].id)).persones.map((p) => p.nom).sort()).toEqual(['Joan', 'Pere']);
  });
});

describe('correccions de la revisió (P0-114)', () => {
  /* Tots els codis que emeten llegeixGedcom, llegeixCopiaJson i llegeixLlavorPrivada (errors[] i avisos[]). */
  const CODIS_LECTURA = Object.freeze([
    'tipus', 'mida', 'buit', 'massa-linies', 'capcalera', 'arbre', 'json', 'clau-perillosa', 'esquema', 'limit',
    'linia-massa-llarga', 'linia-malformada', 'salt-de-nivell', 'data-calendari', 'data-format', 'data-invalida',
    'data-interval', 'versio-5.5.5', 'versio-desconeguda', 'codificacio', 'sense-trlr', 'xref-duplicat', 'massa-fonts',
    'massa-persones', 'persona-invalida', 'massa-relacions', 'relacio-invalida', 'referencia-trencada', 'asso-desconegut',
    'sense-persones', 'entrevista-invalida', 'mes-avisos',
    'ahnentafel-invalid', 'ahnentafel-repetit', 'ahnentafel-discordant', 'estat-desconegut', 'url-descartada', 'font-invalida', 'pista-invalida'
  ]);

  test('cada codi de lectura té text propi en les cinc llengües, i mai es pinta la clau crua', () => {
    for (const llengua of LLENGUES) {
      const generic = t(llengua, 'importa.codi.desconegut');
      for (const codi of CODIS_LECTURA) {
        for (const forma of [codi, `${codi}:12`]) {
          const text = textCodiLectura(forma, llengua);
          expect(text, `${llengua} ${forma}`).not.toMatch(/importa\.codi|\{/);
          expect(text, `${llengua} ${forma}`).not.toBe(generic);
          expect(text, `${llengua} ${forma}`).not.toBe(forma);
        }
      }
      expect(textCodiLectura('inventat:3', llengua)).toBe(generic);
      expect(textCodiLectura(null, llengua)).toBe(generic);
    }
    expect(textCodiLectura('linia-malformada:12', 'ca')).toBe('Una línia mal formada s’ha descartat (línia 12)');
    expect(textCodiLectura('persona-invalida:0', 'en', { json: true })).toBe('A person with invalid data was discarded (record 1)');
    expect(textCodiLectura('mes-avisos:9', 'gl')).toBe('E 9 avisos máis que non se amosan.');
  });

  test('importa: els avisos de lectura es llegixen traduïts, i el botó del fitxer parla la llengua de la closca', async () => {
    await acceptaAvis();
    munta('/app/genealogia/intercanvi/importa');
    const input = await screen.findByLabelText('Fitxer GEDCOM (.ged) o còpia (.json)');
    expect(screen.getByRole('button', { name: 'Fitxer GEDCOM (.ged) o còpia (.json): Tria el fitxer' })).toBeTruthy();
    /* Sense TRLR i amb una data en un format desconegut. */
    const ged = ['0 HEAD', '1 GEDC', '2 VERS 7.0', '0 @I1@ INDI', '1 NAME Pere /Exemple/', '1 BIRT', '2 DATE PRIMAVERA'].join('\n');
    fireEvent.change(input, { target: { files: [new File([ged], 'tallat.ged')] } });
    expect(await screen.findByText('Falta la línia final (0 TRLR): potser el fitxer està tallat.')).toBeTruthy();
    expect(screen.getByText('Una data amb un format desconegut queda com a desconeguda (línia 7)')).toBeTruthy();
    expect(screen.queryByText(/^sense-trlr|^data-format/)).toBeNull();
    /* El nom del fitxer (pot portar cognoms) no es pinta a la línia d'estat. */
    expect(screen.queryByText(/tallat\.ged/)).toBeNull();
    cleanup();
    munta('/app/genealogia/intercanvi/importa', { externalConfig: { language: 'en' } });
    expect(await screen.findByRole('button', { name: /Choose the file$/ }, { timeout: 4000 })).toBeTruthy();
  });

  test('arxius · Censo-guía: la consulta d’on és l’arxiu porta una etiqueta, no «registre.null»', async () => {
    await acceptaAvis();
    const persones = [persona(2, { nom: 'Pere', cognom1: 'Exemple', sexe: 'M', naixement: '1900', viva: 'no', lloc: 'Poble Inventat' })];
    await desaArbre(magatzem, complet(persones, [], { arrelId: uid(2) }));
    await desaMeta(magatzem, 'arbreActiu', ARBRE_ID);
    munta('/app/genealogia/arxius/cens-guia');
    const area = await screen.findByRole('textbox', { name: 'Consulta 1 · On és l’arxiu del poble' });
    expect(area.value).toBe('Poble Inventat');
    expect(screen.queryByText(/registre\.null/)).toBeNull();
  });

  test('entrevista · besavis sense cap iaio anomenat: s’explica per què i no hi ha cap formulari mut', async () => {
    await acceptaAvis();
    munta('/app/genealogia/entrevista');
    const passa = async (patro, boto = 'Salta') => {
      await waitFor(() => expect(screen.getByRole('heading', { level: 3 }).textContent).toMatch(patro));
      fireEvent.click(screen.getByRole('button', { name: boto }));
    };
    await passa(/malnom de la vostra casa/);
    await passa(/mas, partida o poble/);
    await waitFor(() => expect(screen.getByRole('heading', { level: 3 }).textContent).toMatch(/Comencem per tu/));
    fireEvent.change(screen.getByRole('textbox', { name: 'Nom' }), { target: { value: 'Anna' } });
    fireEvent.click(screen.getByRole('button', { name: 'Següent' }));
    await passa(/germans o germanes/, 'Següent');
    for (const patro of [/ton pare/, /ta mare/, /el teu iaio patern/, /la teua iaia paterna/, /el teu iaio matern/, /la teua iaia materna/]) await passa(patro);
    await waitFor(() => expect(screen.getByRole('heading', { level: 3 }).textContent).toMatch(/besavi/));
    /* El focus va a la pregunta nova. */
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 3 }));
    expect(screen.getByText(/primer cal el nom d’algun iaio o iaia/)).toBeTruthy();
    expect(screen.queryByRole('textbox', { name: 'Nom' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Afig-la i afig-ne una altra' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Següent' }));
    await waitFor(() => expect(screen.getByRole('heading', { level: 3 }).textContent).toMatch(/D’on venen estos vincles/));
  });
});

describe('les cinc llengües', () => {
  test('textos.js: les mateixes claus en ca, es, en, eu i gl, cap buida', () => {
    const claus = Object.keys(TEXTOS.ca).sort();
    expect(claus.length).toBeGreaterThan(200);
    for (const llengua of LLENGUES) {
      expect(Object.keys(TEXTOS[llengua]).sort(), llengua).toEqual(claus);
      expect(Object.entries(TEXTOS[llengua]).filter(([, text]) => typeof text !== 'string' || !text.trim()).map(([clau]) => clau), llengua).toEqual([]);
    }
  });

  test('t, textAlerta, textError i nomVisible traduïxen i cauen al valencià', () => {
    expect(LLENGUES.map((llengua) => t(llengua, 'persona.viva'))).toEqual(['Persona viva', 'Persona viva', 'Living person', 'Pertsona bizia', 'Persoa viva']);
    expect(t('fr', 'boto.copia')).toBe('Copia');
    expect(t('en', 'panell.recompte', { persones: 3, relacions: 2 })).toBe('3 people · 2 links');
    expect(textAlerta({ tipus: 'vida-impossible', personaId: 'a' }, 'es', () => 'X')).toBe('X: más de 120 años de vida.');
    expect(textAlerta({ tipus: 'desconegut', personaId: 'a' }, 'ca', () => 'X')).toBe('X: revisa les dates.');
    expect(textError({ codi: 'NOMES_LECTURA' }, 'gl')).toBe('Outra lapela está a editar: aquí só podes mirar.');
    expect(nomVisible({ privada: true, nom: 'No' }, 'eu')).toBe('Pertsona bizia');
    expect(nomVisible({ nom: 'A', cognom1: 'B', cognom2: '' }, 'ca')).toBe('A B');
  });

  test.each([
    ['es', 'Entendido', 'Aviso y privacidad'],
    ['en', 'Understood', 'Notice and privacy'],
    ['eu', 'Ulertuta', 'Oharra eta pribatutasuna'],
    ['gl', 'Entendido', 'Aviso e privacidade']
  ])('l’app en %s: les columnes parlen la llengua de la closca', async (language, boto, titol) => {
    munta('/app/genealogia/avis', { externalConfig: { language } });
    expect(await screen.findByRole('button', { name: boto }, { timeout: 4000 })).toBeTruthy();
    expect(screen.getAllByText(titol).length).toBeGreaterThan(0);
  });
});


test('Persones mostra una proposta de duplicat i sols fusiona després de confirmar', async () => {
  const mateixaIdentitat = { nom: 'Fitxa Sintètica', cognom1: 'Mostra', naixement: '1891-03-04', viva: 'no' };
  await acceptaAvis();
  await desaArbre(magatzem, complet([persona(1, mateixaIdentitat), persona(2, { ...mateixaIdentitat, notes: 'Nota de prova' })]));
  munta('/app/genealogia/persones');
  await screen.findByText('Coincidixen el nom, el cognom i la data de naixement.');
  fireEvent.click(screen.getByRole('button', { name: 'Revisa la fusió' }));
  let dialeg = await screen.findByRole('dialog');
  expect((await carregaArbre(magatzem, ARBRE_ID)).persones).toHaveLength(2);
  fireEvent.click(within(dialeg).getByRole('button', { name: t('ca', 'boto.cancela') }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect((await carregaArbre(magatzem, ARBRE_ID)).persones).toHaveLength(2);
  fireEvent.click(screen.getByRole('button', { name: 'Revisa la fusió' }));
  dialeg = await screen.findByRole('dialog');
  fireEvent.click(within(dialeg).getByRole('button', { name: 'Confirma la fusió' }));
  await screen.findByText('S’han unit les dues fitxes.');
  expect((await carregaArbre(magatzem, ARBRE_ID)).persones).toMatchObject([{ id: uid(1), notes: 'Nota de prova' }]);
});
