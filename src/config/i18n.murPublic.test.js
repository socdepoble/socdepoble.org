// @vitest-environment node
/* D1 Opció A (decisió del Mestre, 261112) · El Mur del poble el pot llegir
   qualsevol persona, també sense compte. Abans, els textos del Bloc i de
   /connectar deien que el Mur només el llegia la gent registrada del poble i
   que no ixia a Internet. Esta guarda impedix que cap dels cinc diccionaris
   torne a dir-ho, en cap llengua, i comprova la paritat de les claus que ho
   diuen ara.
   · «no Internet» (i els seus equivalents) no pot eixir en cap valor.
   · «la gent registrada del poble» (i equivalents) no pot eixir en cap valor
     que parle del Mur.
   · honestedat_textos-05 (R21) · Tampoc no és cert per al contacte d'una
     fitxa d'àmbit (editor.ambit.contacteVisible): amb la política 2611112005,
     anon llig el payload del Mur i del Mercat, i la fitxa del detall el
     mostra a qualsevol persona, també sense compte. Mentre
     MUR_PUBLIC_FILTRAT siga false, el text ho ha de dir.
   · honestedat_textos-10 (R21) · Al panell en línia d'una publicació del
     Mercat, l'explicació i l'avís diuen Mercat, no Mur.
   · honestedat_textos-13 (R21) · L'avís de Traduir d'una pàgina sense
     traducció (pagina.senseTraduccio) no diu que el contingut no ix del
     dispositiu: el Mur i el Mercat públics venen del servidor.
   · Prova d'acoblament: el que no hi ix mai («versioPublica») només ho diu
     la interfície amb MUR_PUBLIC_FILTRAT, i la bandera només pot ser true si
     el catàleg de migracions ja revoca a anon la fila crua i crea la RPC
     public.llig_mur_public (tests/helpers/murPublicCataleg.js). */
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import CA from './idiomes/ca.js';
import ES from './idiomes/es.js';
import EN from './idiomes/en.js';
import EU from './idiomes/eu.js';
import GL from './idiomes/gl.js';
import { MUR_PUBLIC_FILTRAT, TEXTOS_VISIBILITAT_NOTA, textosDeNota, textosEnLiniaDeNota, textosExtern } from '../sections/notes/visibilitatNota.js';
import { estatMurPublic, murPublicDelCataleg } from '../../tests/helpers/murPublicCataleg.js';

const DICCIONARIS = { ca: CA, es: ES, en: EN, eu: EU, gl: GL };

/* Patrons ancorats i sense alternatives niades: cap retrocés. */
const FALSES = Object.freeze({
  ca: { internet: /\bno Internet\b/i, registrada: /\bgent registrada del poble\b/i, mur: /\bMur\b/ },
  es: { internet: /\bno Internet\b/i, registrada: /\bgente registrada del pueblo\b/i, mur: /\bMuro\b/ },
  en: { internet: /\bnot (?:by )?the (?:whole )?Internet\b/i, registrada: /\bregistered people\b/i, mur: /\bWall\b/ },
  eu: { internet: /\bez Internetek\b/i, registrada: /\berregistratutako jende/i, mur: /\bHorm[a-z]*/ },
  gl: { internet: /\bnon Internet\b/i, registrada: /\bxente rexistrada do pobo\b/i, mur: /\bMuro\b/ },
});

/* Les claus que diuen qui llig el Mur (les dues noves i les cinc reescrites). */
const CLAUS_MUR_PUBLIC = Object.freeze([
  'section.notes.visibilitat.lecturaPublica',
  'section.notes.visibilitat.versioPublica',
  'section.notes.visibilitat.nota.publica.explicacio',
  'section.notes.visibilitat.connexio.publica.explicacio',
  'section.connectar.poble.text',
  'section.connectar.abast.pobleAjuda',
  'section.connectar.resum.murPendent',
]);

/* Les claus que diuen que la versió pública la llig qualsevol persona sense compte. */
const QUALSEVOL = Object.freeze({
  ca: /qualsevol persona, també sense compte/i,
  es: /cualquier persona, también sin cuenta/i,
  en: /anyone[^.]*without an account/i,
  eu: /edonork[^.]*konturik gabe ere/i,
  gl: /calquera persoa, tamén sen conta/i,
});

describe('D1 Opció A · cap diccionari no diu que el Mur és només per a la gent registrada ni que no ix a Internet', () => {
  test.each(Object.keys(DICCIONARIS))('%s', (idioma) => {
    const { internet, registrada, mur } = FALSES[idioma];
    const entrades = Object.entries(DICCIONARIS[idioma]).filter(([, valor]) => typeof valor === 'string');
    expect(entrades.length).toBeGreaterThan(1000);
    expect(entrades.filter(([, valor]) => internet.test(valor)).map(([clau]) => clau)).toEqual([]);
    expect(entrades.filter(([, valor]) => mur.test(valor) && registrada.test(valor)).map(([clau]) => clau)).toEqual([]);
  });

  test('la guarda reconeix les frases d’abans en les cinc llengües', () => {
    const abans = {
      ca: 'Ix al Mur del poble: la llig la gent registrada del poble, no Internet.',
      es: 'Sale en el Muro del pueblo: la lee la gente registrada del pueblo, no Internet.',
      en: 'It appears on the town’s Wall: it is read by the town’s registered people, not by the whole Internet.',
      eu: 'Herriko Horman agertzen da: herrian erregistratutako jendeak irakurtzen du, ez Internetek.',
      gl: 'Sae no Muro do pobo: só a le a xente rexistrada do pobo, non Internet.',
    };
    for (const [idioma, text] of Object.entries(abans)) {
      const { internet, registrada, mur } = FALSES[idioma];
      expect(internet.test(text), idioma).toBe(true);
      expect(mur.test(text) && registrada.test(text), idioma).toBe(true);
    }
  });
});

/* Els noms del Mercat i el que l'avís de Traduir ja no pot dir, en cada llengua. */
const MERCAT = Object.freeze({ ca: /\bMercat\b/, es: /\bMercado\b/, en: /\bMarket\b/, eu: /\bMerkatu[a-z]*/, gl: /\bMercado\b/ });
const DISPOSITIU = Object.freeze({
  ca: /\bdispositiu\b/i, es: /\bdispositivo\b/i, en: /\bdevice\b/i, eu: /\bgailu[a-z]*/i, gl: /\bdispositivo\b/i,
});

describe('R21 · honestedat dels textos amb la política 2611112005', () => {
  test.each(Object.keys(DICCIONARIS))('el contacte d’una fitxa d’àmbit el veu qualsevol persona, també sense compte (%s)', (idioma) => {
    const contacte = DICCIONARIS[idioma]['editor.ambit.contacteVisible'];
    expect(typeof contacte, idioma).toBe('string');
    expect(contacte, idioma).not.toMatch(FALSES[idioma].registrada);
    /* Amb la versió filtrada el contacte ja no ixiria enlloc: el text s'haurà de reescriure. */
    expect(QUALSEVOL[idioma].test(contacte), idioma).toBe(false);
    expect(contacte,idioma).toMatch({ca:/membres/,es:/miembros/,en:/members/,eu:/kideek/,gl:/membros/}[idioma]);
    if (idioma !== 'ca') expect(contacte, idioma).not.toBe(CA['editor.ambit.contacteVisible']);
  });

  test.each(Object.keys(DICCIONARIS))('el panell d’una publicació del Mercat diu Mercat, no Mur (%s)', (idioma) => {
    const dic = DICCIONARIS[idioma];
    const t = (clau, reserva) => (typeof dic[clau] === 'string' ? dic[clau] : reserva);
    for (const clau of ['section.notes.visibilitat.enLinia.publica.explicacioMercat', 'section.notes.visibilitat.enLinia.irreversibleMercat']) {
      expect(typeof dic[clau], `${idioma}/${clau}`).toBe('string');
      if (idioma !== 'ca') expect(dic[clau], `${idioma}/${clau}`).not.toBe(CA[clau]);
    }
    const mercat = textosEnLiniaDeNota({ seccio: 'mercat', t });
    const mur = textosEnLiniaDeNota({ t });
    for (const camp of ['explicacio', 'irreversible']) {
      const text = camp === 'explicacio' ? mercat.publica.explicacio : mercat.irreversible;
      expect(text, `${idioma}/${camp}`).toMatch(MERCAT[idioma]);
      expect(text, `${idioma}/${camp}`).not.toMatch(FALSES[idioma].mur);
    }
    /* El Mur continua dient Mur. */
    expect(mur.publica.explicacio, idioma).toMatch(FALSES[idioma].mur);
    expect(mur.irreversible, idioma).toMatch(FALSES[idioma].mur);
  });

  test.each(Object.keys(DICCIONARIS))('l’avís de Traduir no diu que el contingut no ix del dispositiu (%s)', (idioma) => {
    const avis = DICCIONARIS[idioma]['pagina.senseTraduccio'];
    expect(typeof avis, idioma).toBe('string');
    expect(avis, idioma).not.toMatch(DISPOSITIU[idioma]);
    if (idioma !== 'ca') expect(avis, idioma).not.toBe(CA['pagina.senseTraduccio']);
  });
});

describe('D1 Opció A · paritat de les claus que diuen qui llig el Mur', () => {
  test.each(CLAUS_MUR_PUBLIC)('%s: valor propi en les cinc llengües', (clau) => {
    for (const [idioma, dic] of Object.entries(DICCIONARIS)) {
      expect(typeof dic[clau], `${idioma}/${clau}`).toBe('string');
      expect(dic[clau].trim(), `${idioma}/${clau}`).not.toBe('');
      if (idioma !== 'ca') expect(dic[clau], `${idioma}/${clau}`).not.toBe(CA[clau]);
    }
  });

  test('la versió pública: qualsevol persona sense compte, i el que no hi ix mai, en cada llengua', () => {
    expect(TEXTOS_VISIBILITAT_NOTA.versioPublica).toEqual(['section.notes.visibilitat.versioPublica', CA['section.notes.visibilitat.versioPublica']]);
    for (const [idioma, dic] of Object.entries(DICCIONARIS)) {
      expect(dic['section.notes.visibilitat.lecturaPublica'], idioma).toMatch(QUALSEVOL[idioma]);
      expect(dic['section.notes.visibilitat.versioPublica'], idioma).toMatch(QUALSEVOL[idioma]);
      for (const clau of ['section.connectar.poble.text', 'section.connectar.abast.pobleAjuda', 'section.connectar.resum.murPendent']) {
        expect(dic[clau], `${idioma}/${clau}`).toMatch(QUALSEVOL[idioma]);
      }
    }
    // La projecció anònima i la lectura de membres es descriuen per separat.
    expect(CA['section.notes.visibilitat.versioPublica']).toContain('Les persones membres de poble poden llegir la publicació completa.');
    expect(CA['section.notes.visibilitat.versioPublica']).toContain('La versió anònima mai mostra identificadors interns, contacte privat ni ubicació de les fotos.');
    for (const [idioma,dic] of Object.entries(DICCIONARIS)) expect(dic['section.notes.visibilitat.versioPublica'],idioma).toMatch({ca:/membres/,es:/miembros/,en:/members/,eu:/kideek/,gl:/membros/}[idioma]);

  });
});

/* Les sentències d'una migració com la de 2611112005 (fila crua oberta a
   anon) i com la del carril SQL de Codex (revocació de taula i de columnes,
   i la RPC de la versió pública). */
const OBRI_CRUA = "grant select (\n  id, tenant_id, owner_user_id, title, payload\n) on table public.section_submissions to anon, authenticated;";
const REVOCA_TAULA = '-- REVOKE de taula\nrevoke select on table public.section_submissions from public, anon;';
const REVOCA_COLUMNES = "do $$ declare columna record; begin\n  for columna in select attname from pg_attribute loop\n    execute format('revoke select (%I) on table public.section_submissions from public, anon', columna.attname);\n  end loop;\nend $$;";
const RPC = 'create or replace function public.llig_mur_public(\n  p_tenant_id uuid default null\n) returns table (id uuid) language sql stable as $$ select 1 $$;';

describe('D1 Opció A · prova d’acoblament: el text només promet el que el catàleg de migracions ja fa', () => {
  test('el detector distingix la fila crua de la versió pública filtrada', () => {
    expect(estatMurPublic([])).toEqual({ filaCrua: true, projeccio: false, filtrat: false });
    expect(estatMurPublic([['a', OBRI_CRUA]]).filtrat).toBe(false);
    expect(estatMurPublic([['a', OBRI_CRUA], ['b', RPC]]).filtrat).toBe(false);
    expect(estatMurPublic([['a', OBRI_CRUA], ['b', `${REVOCA_TAULA}\n${RPC}`]]).filtrat).toBe(false);
    expect(estatMurPublic([['a', OBRI_CRUA], ['b', `${REVOCA_TAULA}\n${REVOCA_COLUMNES}\n${RPC}`]])).toEqual({ filaCrua: false, projeccio: true, filtrat: true });
    expect(estatMurPublic([['a', OBRI_CRUA], ['b', `${REVOCA_TAULA}\n${REVOCA_COLUMNES}\n${RPC}`], ['c', OBRI_CRUA]]).filtrat).toBe(false);
    expect(estatMurPublic([['a', `${REVOCA_TAULA}\n${REVOCA_COLUMNES}\n${RPC}`], ['b', 'grant select on table public.section_submissions to anon;']]).filtrat).toBe(false);
    /* La concessió de veres de 2611112005, després d'una revocació: torna a obrir la fila crua. */
    const obertura = readFileSync(new URL('../../supabase/migrations/2611112005_mur_lectura_publica_foraster.sql', import.meta.url), 'utf8');
    expect(estatMurPublic([['a', `${REVOCA_TAULA}\n${REVOCA_COLUMNES}\n${RPC}`], ['2611112005', obertura]]).filtrat).toBe(false);
  });

  test('MUR_PUBLIC_FILTRAT només és true si el catàleg revoca la fila crua a anon i crea llig_mur_public', () => {
    const estat = { bandera: MUR_PUBLIC_FILTRAT, cataleg: murPublicDelCataleg().filtrat };
    expect(estat, 'MUR_PUBLIC_FILTRAT sense revocació ni RPC al catàleg de migracions').not.toEqual({ bandera: true, cataleg: false });
  });

  /* F03-UI (Onada R21) · 2611121430_mur_foraster_projeccio_publica_opcio_a ja
     és al catàleg: revoca la taula i les columnes a anon i crea la RPC. La
     bandera s'encén en el mateix lliurament. */
  test('F03-UI · amb 2611121430 al catàleg, la versió pública és filtrada i la bandera ho diu', () => {
    expect(murPublicDelCataleg()).toEqual({ filaCrua: false, projeccio: true, filtrat: true });
    expect(MUR_PUBLIC_FILTRAT).toBe(true);
  });

  test.each(Object.keys(DICCIONARIS))('el selector només diu què no hi ix amb la versió filtrada (%s)', (idioma) => {
    const dic = DICCIONARIS[idioma];
    const t = (clau, reserva) => (typeof dic[clau] === 'string' ? dic[clau] : reserva);
    const tots = (objecte) => Object.values(objecte || {}).flatMap((valor) => (typeof valor === 'string' ? [valor] : (valor && typeof valor === 'object' ? tots(valor) : [])));
    const textos = [
      textosDeNota({ t }), textosDeNota({ connexio: true, t }), textosExtern(t),
      textosEnLiniaDeNota({ t }), textosEnLiniaDeNota({ seccio: 'mercat', t }), textosEnLiniaDeNota({ connexio: true, t }), textosEnLiniaDeNota({ extern: true, t }),
    ].flatMap(tots);
    const garantia = dic['section.notes.visibilitat.versioPublica'];
    const lectura = dic['section.notes.visibilitat.lecturaPublica'];
    expect(textos.some((text) => text.includes(garantia))).toBe(MUR_PUBLIC_FILTRAT);
    expect(textos.filter((text) => text.endsWith(` ${MUR_PUBLIC_FILTRAT ? garantia : lectura}`)).length).toBeGreaterThanOrEqual(7);
  });
});
