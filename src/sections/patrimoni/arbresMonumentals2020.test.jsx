import fs from 'node:fs';
import path from 'node:path';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../app/contexts/RouterContext';
import { ValorDeNotes } from '../notes/NotesContext';
import {
  ARBRES_MONUMENTALS_2020,
  FONT_XYLELLA_CIPRERET_2024,
  MAPA_GENERAL_ARBRES_2020,
  ORDENANCA_MUNICIPAL_ARBRES_LA_TORRE,
  buscaArbreMonumental2020
} from '../../data/patrimoni/arbresMonumentals2020.js';
import {
  CAMPS_OFICIALS_CIEF_V232,
  ESCALA_AFECTACIO_CIEF,
  INTERVALS_REVISIO_ANYS,
  calculaDeltaLongitudinalArbre,
  projectaFitxaCiefV232,
  revisionsDeLArbre
} from '../../data/patrimoni/revisionsArbresCief.js';
import FitxaArbreMonumental from './FitxaArbreMonumental.jsx';

afterEach(cleanup);

function LectorUbicacio() {
  const loc = useLocation();
  return <output data-testid="ruta-viva">{`${loc.pathname}${loc.search ? `?${loc.search}` : ''}`}</output>;
}

describe('P0-86 · Catàleg 19 Arbres Singulars de La Torre (2007–2020) i Fitxa CIEF v232', () => {
  it('representa els desconeguts explícits de la font arbitrada sense imatge de mapa buida', () => {
    const original = ARBRES_MONUMENTALS_2020[0];
    const arbre = {
      ...original,
      sol: null,
      comunitatVegetal: null,
      fotos: { ...original.fotos, mapa: null }
    };
    render(<MemoryRouter><FitxaArbreMonumental arbre={arbre} /></MemoryRouter>);
    expect(screen.getByText('Mapa pendent d’acreditar.')).toBeTruthy();
    expect(screen.queryByRole('img', { name: /Mapa topogràfic/ })).toBeNull();
    expect(screen.getByRole('img', { name: /catalogació base/ }).getAttribute('src')).toBe(original.fotos.foto2007);
    expect(screen.getByText(/Sòl: Pendent de campanya · Comunitat vegetal: Pendent de campanya/)).toBeTruthy();
  });

  it('exporta els 19 arbres íntegres amb WebP existents, esmena UTM #15/#16, null honest al #19 i zero PII', () => {
    expect(ARBRES_MONUMENTALS_2020).toHaveLength(19);
    expect(ARBRES_MONUMENTALS_2020.map((a) => a.ordre)).toEqual(
      Array.from({ length: 19 }, (_, idx) => idx + 1)
    );

    const monumentals = ARBRES_MONUMENTALS_2020.filter((a) => a.monumental);
    expect(monumentals.map((a) => a.ordre)).toEqual([6, 15]);

    const arrelPublic = path.resolve(import.meta.dirname, '../../../public');
    const aRutaPublica = (url) => path.join(arrelPublic, String(url).replace(/^\//, ''));
    expect(MAPA_GENERAL_ARBRES_2020.url).toBeNull();

    let ambFoto2020 = 0;
    for (const arbre of ARBRES_MONUMENTALS_2020) {
      expect(fs.existsSync(aRutaPublica(arbre.fotos.foto2007))).toBe(true);
      expect(fs.existsSync(aRutaPublica(arbre.fotos.fotoDetall2007))).toBe(true);
      expect(arbre.fotos.mapa).toBeNull();
      if (arbre.fotos.foto2020) {
        ambFoto2020 += 1;
        expect(fs.existsSync(aRutaPublica(arbre.fotos.foto2020))).toBe(true);
      }
    }
    expect(ambFoto2020).toBe(6);

    const piPlaVerd = buscaArbreMonumental2020('arbre-14-pi-del-pla-verd');
    const piArrendaors = buscaArbreMonumental2020('arbre-15-pi-dels-arrendaors');
    const rouresNofre = buscaArbreMonumental2020('arbre-16-roures-de-nofre');
    expect(piArrendaors.utmEtrs89.x).toBe(724144);
    expect(piArrendaors.utmEtrs89.y).toBe(4274267);
    expect(piArrendaors.utmEtrs89.x).not.toBe(piPlaVerd.utmEtrs89.x);
    expect(rouresNofre.utmEtrs89.x).toBe(728507);
    expect(rouresNofre.utmEtrs89.y).toBe(4275504);
    expect(rouresNofre.dimensions2007.perimetreNormalCm).toBe(150);

    const xiprersCementeri = buscaArbreMonumental2020(19);
    expect(xiprersCementeri.dimensions2007.alcadaM).toBeNull();
    expect(xiprersCementeri.dimensions2007.diametreCapcadaM).toBeNull();
    expect(xiprersCementeri.dimensions2007.perimetreNormalCm).toBeNull();
    expect(xiprersCementeri.utmEtrs89.altitudM).toBeNull();

    const jsonComplet = JSON.stringify({
      arbres: ARBRES_MONUMENTALS_2020,
      ordenanca: ORDENANCA_MUNICIPAL_ARBRES_LA_TORRE
    });
    expect(jsonComplet).not.toMatch(/\b\d{8}[A-Z]\b/);
  });

  it('projecta els 24 camps oficials CIEF v232 i calcula intervals 5 | 10 | 15 | 25 anys i Δ longitudinal', () => {
    expect(CAMPS_OFICIALS_CIEF_V232).toHaveLength(24);
    expect(ESCALA_AFECTACIO_CIEF).toEqual(['NO', 'LLEU', 'MODERADA', 'GREU']);
    expect(INTERVALS_REVISIO_ANYS).toEqual([5, 10, 15, 25]);

    const alborc = buscaArbreMonumental2020('arbre-02-alborc-del-xipreret');
    const delta5 = calculaDeltaLongitudinalArbre(alborc, 5, 2026);
    const delta25 = calculaDeltaLongitudinalArbre(alborc, 25, 2026);
    expect(delta5.anyUltimaRevisio).toBe(2007);
    expect(delta5.anyProximaRevisio).toBe(2012);
    expect(delta25.anyProximaRevisio).toBe(2032);
    expect(delta5.estatCalendari).toBe('ALERTA_FITOSANITARIA');
    expect(delta5.nivellActual).toBeNull();

    const camps = projectaFitxaCiefV232(alborc);
    expect(camps).toHaveLength(24);
    expect(camps[1].valor).toBe('Arbutus unedo');
    expect(camps[19].valor).toContain('Sanitat: Pendent');
  });

  it('renderitza les pestanyes documentals, el selector d’intervals i crea la plantilla al Bloc de Notes (/notes)', async () => {
    const alborc = buscaArbreMonumental2020('arbre-02-alborc-del-xipreret');
    const creaNota = vi.fn(async (entrada) => ({ id: 'nota-cief-02', ...entrada }));

    render(
      <MemoryRouter rutaInicial="/page/arbres-monumentals">
        <ValorDeNotes value={{ creaNota, canCreate: true, nomesLectura: false }}>
          <FitxaArbreMonumental arbre={alborc} />
          <LectorUbicacio />
        </ValorDeNotes>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 3, name: /#2 · Alborç o Madronyer del Xipreret/i })).toBeTruthy();
    expect(screen.getByText(/Avís fitosanitari documentat \(22\/09\/2024 · Xylella fastidiosa\)/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: /Revisions periòdiques i evolució/i }));
    expect(screen.getByText(/Pròxima fita \(10a\): 2017/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cada 25 anys' }));
    expect(screen.getByText(/Pròxima fita \(25a\): 2032/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: /Fitxa Oficial CIEF v232 \(24 camps\)/i }));
    expect(screen.getByText(/20\. Inspecció visual i afectació/i)).toBeTruthy();
    expect(screen.getByText(/24\. Notes de camp i observacions/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: /Ordenança Municipal \(07\/09\/2007\)/i }));
    expect(screen.getByText(/494/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /\+ Crear fitxa d’arbre al Bloc de Notes/i }));
    await waitFor(() => expect(creaNota).toHaveBeenCalledTimes(1));
    expect(creaNota.mock.calls[0][0].folderId).toBe('f-pobles');
    expect(creaNota.mock.calls[0][0].tags).toContain('Arbres Monumentals');
    await waitFor(() => {
      expect(screen.getByTestId('ruta-viva').textContent).toContain('/notes?');
      expect(screen.getByTestId('ruta-viva').textContent).toContain('nota=nota-cief-02');
    });
  });

  it('R19 · conserva l’arbitratge R17.3 (P1): avís amb font, cap norma inventada i buits declarats', () => {
    /* La crònica del 22/09/2024 només acredita el contagi i el tractament amb productes fitosanitaris. */
    const MESURES_NO_ACREDITADES = /contenció|obligatòria|urgència|assecament/i;
    const alborc = buscaArbreMonumental2020('arbre-02-alborc-del-xipreret');
    const revisio2024 = revisionsDeLArbre(alborc).find((rev) => rev.any === 2024);
    expect(revisio2024.amenaces).toBeNull();
    expect(revisio2024.mesures).toBeNull();
    const camps2024 = Object.fromEntries(projectaFitxaCiefV232(alborc, revisio2024).map((camp) => [camp.numero, camp.valor]));
    expect(camps2024[21]).toBe('—');
    expect(camps2024[22]).toBe(alborc.conservacio2007.mesuresPropostes);
    expect(camps2024[24]).toContain(revisio2024.resum);
    render(<MemoryRouter><FitxaArbreMonumental arbre={alborc} /></MemoryRouter>);

    const font = screen.getByRole('link', { name: 'crònica d’El Rentonar' });
    expect(font.getAttribute('href')).toBe(FONT_XYLELLA_CIPRERET_2024);
    const avis = font.closest('.sdp-alerta').textContent;
    expect(avis).toContain('Servei de Sanitat Vegetal de la Generalitat');
    expect(avis).toContain('L’avaluació actual queda pendent de campanya.');
    expect(avis).not.toMatch(/contenció|Es prohibix/);

    fireEvent.click(screen.getByRole('tab', { name: /Revisions periòdiques i evolució/i }));
    const panellRevisions = screen.getByRole('tabpanel');
    const revisions = panellRevisions.textContent;
    expect(revisions).toContain('Amenaces: sense dada verificada');
    expect(revisions).not.toMatch(/Amenaces:\s*·/);
    expect(revisions).not.toMatch(MESURES_NO_ACREDITADES);
    const fita2024 = [...panellRevisions.querySelectorAll('li')].find((li) => li.textContent.includes('2024-09-22'));
    expect(fita2024.textContent).toContain('en la data de la crònica estava en tractament amb productes fitosanitaris');
    expect(fita2024.textContent).toContain('Amenaces: sense dada verificada · Mesures: sense dada verificada');

    fireEvent.click(screen.getByRole('tab', { name: /Fitxa Oficial CIEF v232 \(24 camps\)/i }));
    const botoFita2024 = screen.getByRole('button', { name: 'Fita 2024 (2024-09-22)' });
    fireEvent.click(botoFita2024);
    expect(botoFita2024.getAttribute('aria-pressed')).toBe('true');
    const cief = screen.getByRole('tabpanel').textContent;
    expect(cief).toContain('amb la Llei 4/2006 de Patrimoni Arbori Monumental de la Comunitat Valenciana com a marc');
    expect(cief).not.toContain('Decret 154/2018');
    expect(cief).not.toMatch(MESURES_NO_ACREDITADES);
    expect(cief).toContain('en la data de la crònica estava en tractament amb productes fitosanitaris');

    fireEvent.click(screen.getByRole('tab', { name: /Ordenança Municipal \(07\/09\/2007\)/i }));
    expect(ORDENANCA_MUNICIPAL_ARBRES_LA_TORRE.capitols).toEqual([]);
    expect(screen.getByText(`${ORDENANCA_MUNICIPAL_ARBRES_LA_TORRE.notaFont}.`)).toBeTruthy();
    expect(screen.getByRole('tabpanel').querySelector('dl')).toBeNull();
  });
});
