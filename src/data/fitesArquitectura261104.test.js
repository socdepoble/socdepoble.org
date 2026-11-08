import { describe, it, expect } from 'vitest';
import {
  IDIOMES_OFICIALS_FITES,
  IDS_FITES_261104,
  METADADES_INSTITUCIONALS_261104,
  obteFitesArquitectura261104,
  obteCronicaFita261104,
  renderitzaCronicaMarkdownPedraSeca,
  validaQualitatEditorialFites261104,
} from './fitesArquitectura261104.js';

describe('fitesArquitectura261104 — Actualització Editorial Integral del 04-11-2026 en 5 llengües (AH-13 / P2-18 / Rondes 26-30)', () => {
  it('verifica la paritat completa en els 5 idiomes oficials (ca, es, en, eu, gl), absència de llatinismes i enllaços canònics', () => {
    const validacio = validaQualitatEditorialFites261104();
    expect(validacio.valid).toBe(true);
    expect(validacio.errors).toEqual([]);
    expect(validacio.totalFites).toBe(4);
    expect(validacio.idiomesVerificats).toEqual(['ca', 'es', 'en', 'eu', 'gl']);
  });

  it('conserva les metadades institucionals canòniques amb socdepoble@socdepoble.org i el Mirall 20 TB', () => {
    expect(METADADES_INSTITUCIONALS_261104.compteInstitucionalCanonic).toBe('socdepoble@socdepoble.org');
    expect(METADADES_INSTITUCIONALS_261104.webfingerCanonic).toBe('acct:socdepoble@socdepoble.org');
    expect(METADADES_INSTITUCIONALS_261104.replicaPosseMastodon).toBe('@depoble@mastodont.cat');
    expect(METADADES_INSTITUCIONALS_261104.carpetaArrelMirallWorkspace).toBe(
      'Sóc de Poble · Mirall Sobirà Node 0/',
    );
    expect(METADADES_INSTITUCIONALS_261104.exclouMercatComercialPosse).toBe(true);
  });

  it('documenta les 8 verticals de publicació (incloent Cursos de Pedra en Sec), el Node 0 3-2-1, POSSE Mastodon i l\'Autopia d\'Usuari', () => {
    for (const lang of IDIOMES_OFICIALS_FITES) {
      const fites = obteFitesArquitectura261104(lang);
      expect(fites).toHaveLength(4);
      expect(fites.map((f) => f.id)).toEqual([...IDS_FITES_261104]);
    }

    const mdNode0Ca = renderitzaCronicaMarkdownPedraSeca('node0-resiliencia-321', 'ca');
    expect(mdNode0Ca).toContain('# Node 0 al Mac mini M4 i Arquitectura de Resiliència Rural 3-2-1');
    expect(mdNode0Ca).toContain('socdepoble@socdepoble.org');
    expect(mdNode0Ca).toContain('Sóc de Poble · Mirall Sobirà Node 0/');
    expect(mdNode0Ca).toContain('PostgreSQL 17.11');

    const mdPosseCa = renderitzaCronicaMarkdownPedraSeca('posse-mastodon-simetria', 'ca');
    expect(mdPosseCa).toContain('@depoble@mastodont.cat');
    expect(mdPosseCa).toContain('El Rentonar');
    expect(mdPosseCa).toContain("Coordinadora d'Estudis Eòlics del Comtat");
    expect(mdPosseCa).toContain('acct:socdepoble@socdepoble.org');

    const cronicaFallback = obteCronicaFita261104('verticals-8-ambits', 'fr');
    expect(cronicaFallback.idioma).toBe('ca');
  });
});
