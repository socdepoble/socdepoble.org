import { describe, expect, it } from 'vitest';
import {
  CAMPS_FITXA, LIMITS_TEXT, MAXIM_PRESENTACIO, aHtml, documentDeFitxa, fitxaDeLectura, fitxaPublicada, menaDeFitxa, valorPerDesar,
} from './perfilCamps.js';
import { MAXIM_EMOTICONA, MAXIM_LEMA } from '../../data/limitsText.js';

const persona = {
  id: 'jo', mena: 'persona', nom: 'Pep', rol: 'Persona',
  dades: {
    full_name: 'Pep & Maria', bio: 'Llaurador <de> secà', lema: 'Del Mas', presentacio_html: '<p>Hola</p>',
    avatar_url: 'sdp-media://mitjans/a.webp', hero_url: 'https://poble.test/h.webp', is_public: true,
  },
};
const empresa = {
  id: 'O', mena: 'empresa', nom: 'Forn', rol: 'Propietari',
  dades: { name: 'Forn', description: 'Pa de llenya', lema: 'Cada matí', presentacio_html: '', logo_url: 'sdp-media://mitjans/l.webp', visibility: 'members', role: 'owner' },
};

describe('D2 · mapatge de la fitxa (opció A)', () => {
  it('declara les columnes del contracte per a la persona i l’organització', () => {
    expect(CAMPS_FITXA.persona).toEqual({ title: 'full_name', subtitle: 'bio', lead: 'lema', content: 'presentacio_html', logoImage: 'avatar_url', heroImage: 'hero_url', copyright: 'copyright', icon: 'icon' });
    expect(CAMPS_FITXA.organitzacio).toEqual({ title: 'name', subtitle: 'description', lead: 'lema', content: 'presentacio_html', logoImage: 'logo_url', heroImage: 'hero_url', copyright: 'copyright' });
    expect(menaDeFitxa(persona)).toBe('persona');
    expect(menaDeFitxa({ mena: 'grup' })).toBe('organitzacio');
  });

  it('documentDeFitxa escapa el text pla a HTML i porta el cos, les imatges i la publicació', () => {
    const doc = documentDeFitxa(persona);
    expect(doc).toMatchObject({
      id: 'jo', title: 'Pep &amp; Maria', subtitle: 'Llaurador &lt;de&gt; secà', lead: 'Del Mas',
      content: '<p>Hola</p>', logoImage: 'sdp-media://mitjans/a.webp', heroImage: 'https://poble.test/h.webp',
      isPublished: true, copyright: '© Pep & Maria',
    });
  });

  it('el que s’escriu (local) guanya a les dades del servidor', () => {
    const doc = documentDeFitxa(persona, { title: '<strong>Nou</strong>', content: '<p>x</p>' });
    expect(doc.title).toBe('<strong>Nou</strong>');
    expect(doc.content).toBe('<p>x</p>');
    expect(doc.lead).toBe('Del Mas');
  });

  it('l’organització és pública només amb visibility «public»', () => {
    expect(documentDeFitxa(empresa).isPublished).toBe(false);
    expect(fitxaPublicada({ ...empresa, dades: { ...empresa.dades, visibility: 'public' } })).toBe(true);
    expect(documentDeFitxa(empresa)).toMatchObject({ title: 'Forn', subtitle: 'Pa de llenya', lead: 'Cada matí', logoImage: 'sdp-media://mitjans/l.webp', heroImage: '' });
  });

  it('fitxaDeLectura dona text pla (UniversalPage ja escapa) i cau al nom de la identitat', () => {
    expect(fitxaDeLectura(persona)).toMatchObject({ title: 'Pep & Maria', subtitle: 'Llaurador <de> secà' });
    expect(fitxaDeLectura({ id: 'O', mena: 'empresa', nom: 'Colla', dades: null }).title).toBe('Colla');
    expect(aHtml('a < b & c > d')).toBe('a &lt; b &amp; c &gt; d');
  });
});

describe('valorPerDesar', () => {
  it('el títol es desa com a text pla', () => {
    expect(valorPerDesar('persona', 'title', '<strong>Pep</strong> &amp; Maria')).toEqual({ columna: 'full_name', valor: 'Pep & Maria' });
    expect(valorPerDesar('organitzacio', 'title', 'Forn de Dalt')).toEqual({ columna: 'name', valor: 'Forn de Dalt' });
  });

  it('subtítol i entradilla van a bio/description i lema', () => {
    expect(valorPerDesar('persona', 'subtitle', 'Llaurador')).toEqual({ columna: 'bio', valor: 'Llaurador' });
    expect(valorPerDesar('organitzacio', 'subtitle', 'Pa')).toEqual({ columna: 'description', valor: 'Pa' });
    expect(valorPerDesar('persona', 'lead', '')).toEqual({ columna: 'lema', valor: '' });
  });

  it('un nom buit o massa curt no es desa', () => {
    expect(() => valorPerDesar('persona', 'title', '<br>')).toThrow('El nom no pot quedar buit.');
    expect(() => valorPerDesar('organitzacio', 'title', 'F')).toThrow('almenys 2');
  });

  it('respecta els límits de les columnes', () => {
    expect(() => valorPerDesar('persona', 'lead', 'a'.repeat(257))).toThrow('Com a màxim 256 caràcters (ara en són 257).');
    expect(() => valorPerDesar('organitzacio', 'subtitle', 'a'.repeat(501))).toThrow('Com a màxim 500');
    expect(valorPerDesar('persona', 'lead', 'a'.repeat(256)).valor).toHaveLength(256);
  });

  /* T49 (ordre del Mestre, 260928) · L'entradilla admet 256 caràcters a tots
     els nivells: persona, organització i agent. El límit ve de la font única. */
  it('T49 · l’entradilla de les tres menes de fitxa admet fins a 256 caràcters, el límit de limitsText.js', () => {
    expect(LIMITS_TEXT.lema).toEqual([0, MAXIM_LEMA]);
    for (const mena of ['persona', 'organitzacio', 'agent']) {
      expect(valorPerDesar(mena, 'lead', 'a'.repeat(256))).toEqual({ columna: 'lema', valor: 'a'.repeat(256) });
      expect(() => valorPerDesar(mena, 'lead', 'a'.repeat(257))).toThrow('Com a màxim 256 caràcters (ara en són 257).');
    }
    // Els noms continuen en 120: el T49 només toca l'entradilla.
    expect(LIMITS_TEXT.full_name[1]).toBe(120);
    expect(LIMITS_TEXT.name[1]).toBe(120);
  });

  it('títol i entradilla compten caràcters com char_length, no unitats UTF-16', () => {
    // Un sol emoji és 1 caràcter per al CHECK char_length(btrim(name)) between 2 and 120.
    expect(() => valorPerDesar('organitzacio', 'title', '🌾')).toThrow('almenys 2');
    // 256 emojis són 256 caràcters: el CHECK del lema els admet i el client també.
    expect(valorPerDesar('persona', 'lead', '🌾'.repeat(256)).valor).toBe('🌾'.repeat(256));
    expect(() => valorPerDesar('persona', 'lead', '🌾'.repeat(257))).toThrow('Com a màxim 256 caràcters (ara en són 257).');
  });

  it('el cos passa pel sanejador del projecte', () => {
    expect(valorPerDesar('persona', 'content', '<script>alert(1)</script><p>Cos</p>')).toEqual({ columna: 'presentacio_html', valor: '<p>Cos</p>' });
  });

  it('el cos respecta el CHECK de 20.000 caràcters, comptats com char_length', () => {
    const just = `<p>${'a'.repeat(MAXIM_PRESENTACIO - 7)}</p>`;
    expect(valorPerDesar('organitzacio', 'content', just).valor).toHaveLength(MAXIM_PRESENTACIO);
    expect(() => valorPerDesar('persona', 'content', `<p>${'a'.repeat(MAXIM_PRESENTACIO)}</p>`))
      .toThrow(`La presentació és massa llarga: com a màxim ${MAXIM_PRESENTACIO} caràcters (ara en són ${MAXIM_PRESENTACIO + 7}).`);
    // Un emoji és una unitat per a Postgres i dos per a String.length: passa.
    const ambEmoji = `<p>${'🌾'.repeat(MAXIM_PRESENTACIO - 7)}</p>`;
    expect(valorPerDesar('persona', 'content', ambEmoji).columna).toBe('presentacio_html');
  });

  it('les imatges van a la seua columna, i una imatge esborrada és null', () => {
    expect(valorPerDesar('persona', 'logoImage', ' sdp-media://mitjans/a.webp ')).toEqual({ columna: 'avatar_url', valor: 'sdp-media://mitjans/a.webp' });
    expect(valorPerDesar('organitzacio', 'logoImage', 'x')).toEqual({ columna: 'logo_url', valor: 'x' });
    expect(valorPerDesar('persona', 'heroImage', '')).toEqual({ columna: 'hero_url', valor: null });
  });

  it('un camp desconegut llança', () => {
    expect(() => valorPerDesar('persona', 'price', '3')).toThrow('Este camp no es desa a la fitxa.');
  });
});

/* T66 (ordre del Mestre, 260928) · L'emoticona de la fitxa de la persona
   (profiles.icon, migració 2609282035). Les organitzacions i els agents no en
   tenen columna. */
describe('T66 · l’emoticona (icon)', () => {
  it('només la persona té el camp; organitzacions i agents, no', () => {
    expect(CAMPS_FITXA.persona.icon).toBe('icon');
    expect(CAMPS_FITXA.organitzacio).not.toHaveProperty('icon');
    expect(CAMPS_FITXA.agent).not.toHaveProperty('icon');
  });

  it('un sol emoji es desa net; buida és null (sense emoticona)', () => {
    expect(valorPerDesar('persona', 'icon', '🌾')).toEqual({ columna: 'icon', valor: '🌾' });
    expect(valorPerDesar('persona', 'icon', ' 🍅 ')).toEqual({ columna: 'icon', valor: '🍅' });
    // Seqüències d'un sol grafema: bandera, ZWJ, to de pell.
    expect(valorPerDesar('persona', 'icon', '👩‍🌾').valor).toBe('👩‍🌾');
    expect(valorPerDesar('persona', 'icon', '👍🏽').valor).toBe('👍🏽');
    expect(valorPerDesar('persona', 'icon', '')).toEqual({ columna: 'icon', valor: null });
    expect(valorPerDesar('persona', 'icon', null)).toEqual({ columna: 'icon', valor: null });
  });

  it('text, o un emoji amb text, no es desa: error de validació en línia', () => {
    expect(() => valorPerDesar('persona', 'icon', '🍅 Tomaques')).toThrow('Ha de ser un sol emoji, sense text.');
    expect(() => valorPerDesar('persona', 'icon', 'ab')).toThrow('Ha de ser un sol emoji, sense text.');
    let error;
    try { valorPerDesar('persona', 'icon', 'x'); } catch (e) { error = e; }
    expect(error).toMatchObject({ name: 'ErrorValidacio', columna: 'icon' });
  });

  it('respecta el CHECK de MAXIM_EMOTICONA punts de codi (char_length), amb el comptador', () => {
    // Una família de quatre amb ZWJ: un grafema, 7 punts de codi.
    const familia = '👨‍👩‍👧‍👦';
    expect([...familia].length).toBeLessThanOrEqual(MAXIM_EMOTICONA);
    expect(valorPerDesar('persona', 'icon', familia).valor).toBe(familia);
    // Una cadena ZWJ abusiva que el segmentador veu com un sol grafema.
    const abusiva = Array.from({ length: 9 }, () => '👩').join('‍');
    expect([...abusiva].length).toBe(17);
    let error;
    try { valorPerDesar('persona', 'icon', abusiva); } catch (e) { error = e; }
    expect(error).toMatchObject({ name: 'ErrorValidacio', columna: 'icon', llargaria: 17, minim: 0, maxim: MAXIM_EMOTICONA });
    expect(error.message).toBe(`L’emoticona és massa llarga: com a màxim ${MAXIM_EMOTICONA} caràcters (ara en són 17).`);
  });

  it('l’organització i l’agent no la desen', () => {
    expect(() => valorPerDesar('organitzacio', 'icon', '🌾')).toThrow('Este camp no es desa a la fitxa.');
    expect(() => valorPerDesar('agent', 'icon', '🌾')).toThrow('Este camp no es desa a la fitxa.');
  });

  it('documentDeFitxa: la persona porta el camp cru (servidor o local), l’organització no porta la clau', () => {
    expect(documentDeFitxa(persona).icon).toBe('');
    expect(documentDeFitxa({ ...persona, dades: { ...persona.dades, icon: '🌾' } }).icon).toBe('🌾');
    // La columna nova admet null: el document hi diu ''.
    expect(documentDeFitxa({ ...persona, dades: { ...persona.dades, icon: null } }).icon).toBe('');
    // El que s'ha triat (local) guanya al servidor, també buidar-la.
    expect(documentDeFitxa({ ...persona, dades: { ...persona.dades, icon: '🌾' } }, { icon: '🍅' }).icon).toBe('🍅');
    expect(documentDeFitxa({ ...persona, dades: { ...persona.dades, icon: '🌾' } }, { icon: '' }).icon).toBe('');
    expect(documentDeFitxa(empresa)).not.toHaveProperty('icon');
    expect(documentDeFitxa({ ...empresa, dades: { ...empresa.dades, icon: '🌾' } })).not.toHaveProperty('icon');
  });
});
