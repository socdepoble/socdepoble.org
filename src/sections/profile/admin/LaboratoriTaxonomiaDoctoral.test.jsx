import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

vi.mock('../../../app/contexts/RouterContext', () => ({
  Link: ({ to, children, className }) => <a href={to} className={className}>{children}</a>,
}));

vi.mock('../../../app/contexts/RouterContext.jsx', () => ({
  Link: ({ to, children, className }) => <a href={to} className={className}>{children}</a>,
}));

import { LaboratoriTaxonomiaDoctoral } from './LaboratoriTaxonomiaDoctoral.jsx';
import { BancImportacioEditorial } from './BancImportacioEditorial.jsx';
import { PanellNodesFediversResiliencia, PanellEmpaquetatsDesplegament } from './PanellsAdministracioSistema.jsx';
import {
  RESUM_AUDITORIA_BIBLIOTECONOMIA,
  FACETA_1_CATEGORIES_GEOGRAFIQUES,
  FACETA_2_VERTICALS_SISTEMA,
  FACETA_3_CATEGORIES_MARES_IA,
  FACETA_4_ETIQUETES_SKOS,
  ARTICLES_SIMULADOR_IA_425,
  PAGINES_WP_18,
} from '../../../data/taxonomia/tesaurusDoctoralSocDePoble.js';
import {
  ID_ADMINISTRACIO_SISTEMA,
  itemsDAdministracioSistema,
  navegacioDePerfil,
} from '../perfilModel.js';

afterEach(cleanup);

describe('BLOC 2 · AH-29 (IDEA-89) · Administració del sistema, Eliminació de Rodes Dentades i Laboratori Doctoral de Biblioteconomia', () => {
  test('1. La roda dentada BotoCrom s’ha eliminat de la barra negra superior (App.jsx)', () => {
    const appSource = fs.readFileSync(path.resolve(process.cwd(), 'src/app/App.jsx'), 'utf8');
    expect(appSource).not.toContain('<BotoCrom />');
    expect(appSource).not.toContain("import { BotoCrom } from '../components/universal/PanellCrom.jsx'");
  });

  test('2. PerfilShell passa amagaRodaAjustos={true} a UniversalWorkspace per eliminar la roda dentada de la fila Tot', () => {
    const perfilShellSource = fs.readFileSync(path.resolve(process.cwd(), 'src/sections/profile/PerfilShell.jsx'), 'utf8');
    expect(perfilShellSource).toContain('amagaRodaAjustos={true}');
  });

  test('3. Columna 1 (PERFIL) mostra «🛡️ Administració del sistema» just davall de Javi Llinares i obri els 6 apartats a la Columna 2', () => {
    /* Onada R6 · Bloc 2 (P1-b) · El grup d'administració és només per a superadmin. */
    const grups = navegacioDePerfil([{ id: 'jo', mena: 'persona', nom: 'Javi Llinares', dades: {} }], [], { superadmin: true });
    expect(grups[0].options.map((o) => [o.id, o.label])).toEqual([
      ['jo', 'Javi Llinares'],
      [ID_ADMINISTRACIO_SISTEMA, '🛡️ Administració del sistema'],
    ]);

    const apartats = itemsDAdministracioSistema();
    expect(apartats.map((a) => [a.id, a.title])).toEqual([
      ['admin-taxonomia', '🏷️ Taxonomia: Categories i Etiquetes'],
      ['admin-importacio', '📥 Importació i Revisió Editorial'],
      ['admin-crom', '🎨 Colors i disseny (Crom del sistema)'],
      ['admin-vistes-columnes', '⚙️ Ajustos de vistes i columnes'],
      ['admin-nodes-fedivers', '🌐 Nodes, Fedivers i Resiliència 3-2-1'],
      ['admin-empaquetats', '📦 Empaquetats i Desplegament (Mode Jarvis)'],
    ]);
  });

  test('4. El Tesaurus Doctoral exposa les 114 categories, 105 etiquetes, 425 articles, 18 pàgines i les 4 facetes ortogonals (PMEST + SKOS)', () => {
    expect(RESUM_AUDITORIA_BIBLIOTECONOMIA.totalArticlesWp).toBe(425);
    expect(RESUM_AUDITORIA_BIBLIOTECONOMIA.totalPaginesWp).toBe(18);
    expect(RESUM_AUDITORIA_BIBLIOTECONOMIA.totalCategoriesWp).toBe(114);
    expect(RESUM_AUDITORIA_BIBLIOTECONOMIA.totalEtiquetesWp).toBe(105);
    expect(FACETA_1_CATEGORIES_GEOGRAFIQUES).toHaveLength(114);
    expect(FACETA_2_VERTICALS_SISTEMA).toHaveLength(8);
    expect(FACETA_3_CATEGORIES_MARES_IA).toHaveLength(6);
    expect(FACETA_4_ETIQUETES_SKOS).toHaveLength(105);
    expect(ARTICLES_SIMULADOR_IA_425).toHaveLength(425);
    expect(PAGINES_WP_18).toHaveLength(18);
  });

  test('5. El Laboratori Doctoral de Biblioteconomia es renderitza i permet filtrar en viu entre els 425 articles', () => {
    render(<LaboratoriTaxonomiaDoctoral />);
    expect(screen.getByRole('article', { name: /Laboratori Doctoral de Biblioteconomia i Classificació/i })).toBeTruthy();
    expect(screen.queryByRole('heading', { level: 2, name: /Taxonomia: Categories i Etiquetes/i })).toBeNull();
    expect(screen.getByText(/Diagnòstic Doctoral \(Ranganathan PMEST\)/i)).toBeTruthy();

    const inputCerca = screen.getByLabelText('Cercar entre els 425 articles');
    fireEvent.change(inputCerca, { target: { value: 'Manifest de Poble' } });
    expect(screen.getByText('Manifest de Poble')).toBeTruthy();
  });

  /* G10-11 (IDEA-117; ordre del Mestre del 261106, Onada R9) · La taula del
     tesaurus comença sense les etiquetes buides (mostraBuides = false) i el
     commutador continua mostrant-les i amagant-les. Els recomptes ixen de les
     dades, no del text dels botons. */
  test('5b. G10-11 · la taula SKOS comença sense les 53 etiquetes buides i el commutador les mostra i les torna a amagar', () => {
    localStorage.clear();
    const buides = FACETA_4_ETIQUETES_SKOS.filter((t) => t.isEmpty).length;
    const ambArticles = FACETA_4_ETIQUETES_SKOS.length - buides;
    expect([buides, ambArticles]).toEqual([53, 52]);
    const { container } = render(<LaboratoriTaxonomiaDoctoral />);
    const taula = screen.getByRole('table', { name: 'Tesaurus SKOS de 105 etiquetes' });
    const files = () => [...taula.querySelectorAll('tbody tr')];
    const filesBuides = () => files().filter((tr) => tr.getAttribute('data-empty') === 'true');

    expect(files()).toHaveLength(ambArticles);
    expect(filesBuides()).toHaveLength(0);
    // L'avís de poda de l'estat inicial ja no conviu amb les buides a la taula.
    expect(screen.getByRole('status').textContent).toMatch(/S’han desactivat i podat les 53 etiquetes buides/);

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar també les 53 etiquetes buides' }));
    expect(files()).toHaveLength(FACETA_4_ETIQUETES_SKOS.length);
    expect(filesBuides()).toHaveLength(buides);

    fireEvent.click(screen.getByRole('button', { name: 'Amagar etiquetes de 0 articles de la taula' }));
    expect(files()).toHaveLength(ambArticles);
    expect(filesBuides()).toHaveLength(0);

    // Podar també les amaga, encara que abans s'hagen mostrat.
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar també les 53 etiquetes buides' }));
    expect(filesBuides()).toHaveLength(buides);
    fireEvent.click(screen.getByRole('button', { name: /Podar les 53 etiquetes buides/ }));
    expect(filesBuides()).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Mostrar també les 53 etiquetes buides' })).toBeTruthy();
    expect(container.querySelector('[data-empty="true"]')).toBeNull();
    localStorage.clear();
  });

  test('6. El panell «🌐 Nodes, Fedivers i Resiliència 3-2-1» mostra PostgreSQL 17.11, les 40 taules, els 32 documents públics, @depoble@mastodont.cat i la còpia 3-2-1 amb age', () => {
    render(<PanellNodesFediversResiliencia />);
    expect(screen.getByRole('article', { name: /Nodes, Fedivers i Resiliència 3-2-1/i })).toBeTruthy();
    expect(screen.queryByRole('heading', { level: 2, name: /Nodes, Fedivers i Resiliència 3-2-1/i })).toBeNull();
    expect(screen.getAllByText('17.11').length).toBeGreaterThan(0);
    expect(screen.getAllByText('40').length).toBeGreaterThan(0);
    expect(screen.getAllByText('32').length).toBeGreaterThan(0);
    expect(screen.getAllByText('@depoble@mastodont.cat').length).toBeGreaterThan(0);
  });

  test('7. El Banc d’Importació Editorial permet revisar i aprovar o anotar els 425 articles de socdepoble.net', () => {
    render(<BancImportacioEditorial />);
    expect(screen.getByRole('article', { name: /Importació i Revisió Editorial/i })).toBeTruthy();
    expect(screen.queryByRole('heading', { level: 2, name: /Importació i Revisió Editorial/i })).toBeNull();
    expect(screen.getAllByText(/425/i).length).toBeGreaterThan(0);
  });

  test('8. El panell d’Empaquetats i Desplegament (Mode Jarvis) mostra l’estat de portes i el connector WordPress .zip', () => {
    render(<PanellEmpaquetatsDesplegament />);
    expect(screen.getByRole('article', { name: /Empaquetats i Desplegament/i })).toBeTruthy();
    expect(screen.queryByRole('heading', { level: 2, name: /Empaquetats i Desplegament/i })).toBeNull();
    expect(screen.getByText(/Connector WordPress/i)).toBeTruthy();
  });
});
