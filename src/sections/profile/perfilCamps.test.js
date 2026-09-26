import { describe, expect, it } from 'vitest';
import {
  CAMPS_FITXA, MAXIM_PRESENTACIO, aHtml, documentDeFitxa, fitxaDeLectura, fitxaPublicada, menaDeFitxa, valorPerDesar,
} from './perfilCamps.js';

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
    expect(CAMPS_FITXA.persona).toEqual({ title: 'full_name', subtitle: 'bio', lead: 'lema', content: 'presentacio_html', logoImage: 'avatar_url', heroImage: 'hero_url', copyright: 'copyright' });
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
    expect(() => valorPerDesar('persona', 'lead', 'a'.repeat(121))).toThrow('Com a màxim 120 caràcters (ara en són 121).');
    expect(() => valorPerDesar('organitzacio', 'subtitle', 'a'.repeat(501))).toThrow('Com a màxim 500');
    expect(valorPerDesar('persona', 'lead', 'a'.repeat(120)).valor).toHaveLength(120);
  });

  it('títol i entradilla compten caràcters com char_length, no unitats UTF-16', () => {
    // Un sol emoji és 1 caràcter per al CHECK char_length(btrim(name)) between 2 and 120.
    expect(() => valorPerDesar('organitzacio', 'title', '🌾')).toThrow('almenys 2');
    // 120 emojis són 120 caràcters: el CHECK del lema els admet i el client també.
    expect(valorPerDesar('persona', 'lead', '🌾'.repeat(120)).valor).toBe('🌾'.repeat(120));
    expect(() => valorPerDesar('persona', 'lead', '🌾'.repeat(121))).toThrow('Com a màxim 120 caràcters (ara en són 121).');
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
