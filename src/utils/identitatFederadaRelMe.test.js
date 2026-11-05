import { describe, expect, test } from 'vitest';
import {
  COMPTE_INSTITUCIONAL_CANONIC,
  WEBFINGER_INSTITUCIONAL_CANONIC,
  DESCRIPTOR_IDENTITAT_INSTITUCIONAL_SOCDEPOBLE,
  configuraPontMastodonUsuari,
  construeixEnllacosRelMe,
  normalitzaIdentitatFedivers,
  verificaReciprocitatRelMe
} from './identitatFederadaRelMe.js';

describe('Ronda 21 · identitatFederadaRelMe (Fase B Estudi Doctoral Mastodon + Simetria Universal)', () => {
  test('1. normalitzaIdentitatFedivers valida handles i URLs HTTPS d’actor i rebutja HTTP, IPs privades, credencials i bidi', () => {
    const depoble = normalitzaIdentitatFedivers('@depoble@mastodont.cat');
    expect(depoble.ok).toBe(true);
    expect(depoble.acct).toBe('depoble@mastodont.cat');
    expect(depoble.handle).toBe('@depoble@mastodont.cat');
    expect(depoble.profileUrl).toBe('https://mastodont.cat/@depoble');
    expect(depoble.actorUri).toBe('https://mastodont.cat/users/depoble');

    const desDeUrl = normalitzaIdentitatFedivers('https://mastodont.cat/users/rentonar');
    expect(desDeUrl.ok).toBe(true);
    expect(desDeUrl.handle).toBe('@rentonar@mastodont.cat');

    expect(normalitzaIdentitatFedivers('http://mastodont.cat/@depoble').ok).toBe(false);
    expect(normalitzaIdentitatFedivers('https://admin:1234@mastodont.cat/@depoble').ok).toBe(false);
    expect(normalitzaIdentitatFedivers('@usuari@127.0.0.1').ok).toBe(false);
    expect(normalitzaIdentitatFedivers('@usuari@localhost').ok).toBe(false);
    expect(normalitzaIdentitatFedivers('@usuari\u202E@mastodont.cat').ok).toBe(false);
  });

  test('2. construeixEnllacosRelMe i verificaReciprocitatRelMe certifiquen l’enllaç bidireccional per al tic verd de Mastodon', () => {
    const enllacos = construeixEnllacosRelMe('@depoble@mastodont.cat', {
      urlCanonicaSocDePoble: 'https://socdepoble.org/entitats/socdepoble'
    });
    expect(enllacos).toHaveLength(1);
    expect(enllacos[0].linkTagHtml).toBe('<link rel="me" href="https://mastodont.cat/@depoble" />');
    expect(enllacos[0].anchorTagHtml).toContain('rel="me noopener noreferrer"');

    const htmlMastodonVerificat = `
      <div class="account__header__fields">
        <dl>
          <dt>Web</dt>
          <dd><a href="https://socdepoble.org/entitats/socdepoble/" rel="me nofollow noopener" target="_blank">socdepoble.org/entitats/socdepoble</a></dd>
        </dl>
      </div>
    `;
    const ok = verificaReciprocitatRelMe(htmlMastodonVerificat, 'https://socdepoble.org/entitats/socdepoble');
    expect(ok.verificat).toBe(true);
    expect(ok.urlTrobada).toBe('https://socdepoble.org/entitats/socdepoble');

    const htmlSenseRelMe = '<a href="https://socdepoble.org/entitats/socdepoble" rel="nofollow">Web</a>';
    expect(verificaReciprocitatRelMe(htmlSenseRelMe, 'https://socdepoble.org/entitats/socdepoble').verificat).toBe(false);
  });

  test('3. configuraPontMastodonUsuari suporta Sóc de Poble, El Rentonar, Coordinadora i qualsevol veí, excloent sempre el Mercat comercial per defecte', () => {
    const pontOficial = configuraPontMastodonUsuari({
      compteMastodon: '@depoble@mastodont.cat',
      entitatsVinculades: ['socdepoble', 'rentonar', 'coordinadora-comtat'],
      ambitsActius: ['mur', 'calendari', 'mercat', 'mapa']
    });
    expect(pontOficial.ok).toBe(true);
    expect(pontOficial.compteInstitucionalCanonic).toBe('socdepoble@socdepoble.org');
    expect(pontOficial.webfingerInstitucionalCanonic).toBe('acct:socdepoble@socdepoble.org');
    expect(COMPTE_INSTITUCIONAL_CANONIC).toBe('socdepoble@socdepoble.org');
    expect(WEBFINGER_INSTITUCIONAL_CANONIC).toBe('acct:socdepoble@socdepoble.org');
    expect(DESCRIPTOR_IDENTITAT_INSTITUCIONAL_SOCDEPOBLE.propietariMirallWorkspace20TB).toBe(
      'socdepoble@socdepoble.org'
    );
    expect(DESCRIPTOR_IDENTITAT_INSTITUCIONAL_SOCDEPOBLE.carpetaArrelMirallWorkspace).toBe(
      'Sóc de Poble · Mirall Sobirà Node 0/'
    );
    expect(pontOficial.requereixConformitatHumana).toBe(true);
    expect(pontOficial.excloureMercatComercial).toBe(true);
    expect(pontOficial.ambitsActius).not.toContain('mercat');
    expect(pontOficial.entitatsVinculades.map((e) => e.id)).toEqual([
      'socdepoble',
      'rentonar',
      'coordinadora-comtat'
    ]);

    const pontVei = configuraPontMastodonUsuari({
      compteMastodon: '@maria_la_torre@mastodont.cat',
      entitatsVinculades: [{ id: 'maria-la-torre', nom: 'Maria de La Torre' }]
    });
    expect(pontVei.ok).toBe(true);
    expect(pontVei.compteMastodon).toBe('@maria_la_torre@mastodont.cat');
    expect(pontVei.entitatsVinculades[0].urlCanonica).toBe('https://socdepoble.org/perfil/maria-la-torre');
  });
});
