/* R-07 (pla 261029_0216, Pas 2 i Pas 9) · El títol social d'un document de la
   Wiki és humà: l'H1 de darrere del preàmbul de comentaris (les plantilles
   obrin amb <!-- SDP:EIXIDA … -->), si no un títol propi, si no l'id
   humanitzat. Abans, 13 rutes /wikidepoble?item=<id> portaven l'id cru. */
import { describe, expect, it } from 'vitest';
import { DESCRIPCIO_WIKI, TITOL_WIKI, metadadesDeDocumentPublic, metadadesDeDocumentWiki, portadaSocialDeLaWiki, titolHumaDeId } from './seoWiki.js';
import { LIMIT_TITOL, textPla } from '../../config/metadadesSocials.js';
import { PAGE_COPY } from '../text/pageContent.js';

/* Les 13 plantilles del manifest del 261029 (pla.md es retira: una que ja no
   hi siga no compta, però almenys una hi ha de ser). */
const PLANTILLES = ['acta', 'auditoria_canonica', 'brainstorming', 'branding', 'bundle', 'doc_to_app', 'estudi_consell',
  'pla', 'pla_implementacio', 'produccio', 'prompt_consell', 'prompt_local', 'skill'];

describe('titolHumaDeId', () => {
  it.each([
    ['doc_to_app', 'Doc to app'],
    ['pla_implementacio', 'Pla implementacio'],
    ['ADR_0001-backend', 'ADR 0001 backend'],
    ['03_llibre_d_or', '03 Llibre d or'],
    ['acta', 'Acta'],
    ['__a--b__', 'A b']
  ])('%s → %s', (id, titol) => {
    expect(titolHumaDeId(id)).toBe(titol);
  });

  it('sense cap paraula, buit', () => {
    for (const id of ['', '___', '-', undefined, null]) expect(titolHumaDeId(id)).toBe('');
  });
});

describe('metadadesDeDocumentPublic · el títol sense H1 visible', () => {
  it('un comentari inicial no amaga l’H1, i l’H2 de davall queda de descripció', () => {
    const meta = metadadesDeDocumentPublic({ id: 'acta', title: 'acta', attributes: {},
      content: '<!-- SDP:EIXIDA\ntype: acta\n-->\n<!-- Nom: aammdd_hhmm_acta_titol.md -->\n# Acta de sessió\n\n## Registre\n\nTaula.' });
    expect(meta.title).toBe('Acta de sessió');
    expect(meta.description).toBe('Registre');
  });

  it('un «# Títol» de dins d’un comentari no és el títol', () => {
    const meta = metadadesDeDocumentPublic({ id: 'estudi_consell', title: 'estudi_consell', content: '<!--\n# Fals\n-->\n# Real' });
    expect(meta.title).toBe('Real');
    expect(JSON.stringify(meta)).not.toContain('Fals');
  });

  it('amb un comentari sense tancar no hi ha H1: l’id humanitzat, mai el cru', () => {
    const meta = metadadesDeDocumentPublic({ id: 'pla_implementacio', title: 'pla_implementacio', attributes: {}, content: '<!-- obert\n# Fals' });
    expect(meta.title).toBe('Pla implementacio');
    expect(meta.description).toBe('Document públic de la Wiki de Poble: Pla implementacio.');
  });

  it('un títol propi del manifest o dels atributs mana sobre l’id; l’id repetit com a títol, no', () => {
    expect(metadadesDeDocumentPublic({ id: 'bundle', title: 'Nom del fitxer', content: '' }).title).toBe('Nom del fitxer');
    expect(metadadesDeDocumentPublic({ id: 'bundle', title: 'bundle', attributes: { name: 'El Bundle' }, content: '' }).title).toBe('El Bundle');
    expect(metadadesDeDocumentPublic({ id: 'bundle', title: 'bundle', attributes: { title: ' bundle ' }, content: '' }).title).toBe('Bundle · Wiki de Poble');
  });

  it('una sola paraula que ve de l’id porta « · Wiki de Poble», dins de LIMIT_TITOL; un H1 d’una paraula, no', () => {
    expect(metadadesDeDocumentPublic({ id: 'acta', title: 'acta', content: '' }).title).toBe('Acta · Wiki de Poble');
    expect(metadadesDeDocumentPublic({ id: 'glossari', title: 'glossari', content: '# Glossari' }).title).toBe('Glossari');
    const llarg = `a${'b'.repeat(LIMIT_TITOL - 1)}`;
    const meta = metadadesDeDocumentPublic({ id: llarg, title: llarg, content: '' });
    expect(meta.title).toBe(`A${'b'.repeat(LIMIT_TITOL - 1)}`);
    expect(meta.title.length).toBeLessThanOrEqual(LIMIT_TITOL);
  });
});

describe('els documents reals de la Wiki (src/data/wikiManifest.js)', () => {
  it('cap document públic porta l’id cru de títol; les plantilles, l’H1 de darrere del comentari', async () => {
    const { wikiManifest } = await import('../../data/wikiManifest.js');
    const presents = PLANTILLES.filter((id) => wikiManifest.items.some((item) => item.id === id));
    expect(presents.length).toBeGreaterThan(0);
    const crus = [];
    for (const item of wikiManifest.items) {
      const meta = metadadesDeDocumentPublic(item);
      if (!meta.title || meta.title === item.id || meta.title.length > LIMIT_TITOL) crus.push(item.id);
    }
    expect(crus).toEqual([]);
    for (const id of presents) {
      const item = wikiManifest.items.find((candidat) => candidat.id === id);
      const propia = metadadesDeDocumentPublic(item);
      const ruta = metadadesDeDocumentWiki(item, `?item=${id}`, wikiManifest.items);
      expect(ruta).toEqual({ ...propia, index: true });
      expect(propia.title).not.toBe(id);
      expect(propia.title).not.toMatch(/^<!--|SDP:EIXIDA/);
      expect(propia.description).not.toBe('');
    }
    const titols = Object.fromEntries(presents.map((id) => [id, metadadesDeDocumentWiki({ id }, `?item=${id}`, wikiManifest.items).title]));
    if (titols.auditoria_canonica) expect(titols.auditoria_canonica).toBe('Auditoria canònica de la Wiki');
    if (titols.prompt_local) expect(titols.prompt_local).toBe('Prompt d\'Execució i Auditoria Local');
  });
});

/* Ordre del Mestre (30-10-2026, prompt 2208, T1.3; QA-VES-02 de Codex) · La
   portada de la Wiki (/wikidepoble sense ?item=) porta al head la imatge que
   pinta (PAGE_COPY.wikidepoble), per la seua variant social de 1200x630, la
   mateixa que prerenderitza el build. Els documents i els desconeguts, com abans. */
describe('la portada de la Wiki porta la seua imatge al head', () => {
  it('sense ?item=: la portada per la variant social, amb el seu alt; sense portada o amb una que no es pot servir, la genèrica', () => {
    const portada = PAGE_COPY.wikidepoble;
    expect(metadadesDeDocumentWiki(null, '', [])).toEqual({
      title: TITOL_WIKI, description: DESCRIPCIO_WIKI, index: true,
      image: {
        url: 'https://socdepoble.org/assets/uploads/empresa/soc-de-poble/posts/genotip/portada_genotip-social-1200x630.jpg',
        alt: textPla(portada.imageAlt || portada.title, LIMIT_TITOL)
      }
    });
    expect(metadadesDeDocumentWiki(null, '', [], { portada: null })).toEqual({ title: TITOL_WIKI, description: DESCRIPCIO_WIKI, index: true });
    const svg = { title: 'Wiki', image: '/assets/marca.svg' };
    expect(portadaSocialDeLaWiki(svg).imatge).toMatchObject({ estat: 'bloquejada', motiu: 'svg' });
    expect(metadadesDeDocumentWiki(null, '', [], { portada: svg })).toEqual({ title: TITOL_WIKI, description: DESCRIPCIO_WIKI, index: true });
    expect(metadadesDeDocumentWiki({ id: 'cap' }, '?item=cap', [])).toEqual({ title: TITOL_WIKI, description: DESCRIPCIO_WIKI, index: false });
  });
});
