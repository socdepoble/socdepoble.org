/** Proves pures de l'índex de /cerca (T45): plegat, AND, rànquing, adaptadors i ressaltat. */
import { expect, test } from 'vitest';
import {
  cercaEntrades, deAgent, deConversa, deIdentitat, deMedia, deMembre, deNota, dePagina, dePoble, deProducte, dePublicacio,
  extracteAmbContext, extracteDeResultat, fitxes, partsRessaltades, plega, textPla, tipusValid
} from './indexCerca.js';
import { MARKET_ITEMS } from '../mercat/marketContent.js';
import { MEDIA_ITEMS } from '../multimedia/mediaContent.js';
import { TOWNS } from '../pobles/townsContent.js';

const membre = (usuari_id, nom, extra = {}) => ({ usuari_id, nom, tipus: 'persona', avatar_url: null, fil_id: null, ...extra });

test('el plegat lleva accents, majúscules i el punt volat', () => {
  expect(plega('Pepa GÜELL')).toBe('pepa guell');
  expect(plega('Col·legi')).toBe('collegi');
  expect(fitxes('  Vicent   Torre vicent ')).toEqual(['vicent', 'torre']);
});

test('«guell» troba «Pepa Güell» i «fé» troba «fe»: accents als dos costats', () => {
  const index = [deMembre(membre('u1', 'Pepa Güell')), deMembre(membre('u2', 'Toni Fe'))];
  expect(cercaEntrades(index, 'guell').llista.map((e) => e.titol)).toEqual(['Pepa Güell']);
  expect(cercaEntrades(index, 'fé').llista.map((e) => e.titol)).toEqual(['Toni Fe']);
});

test('lògica AND per paraula: «vicent torre» troba «Vicent Ferris · La Torre» i no «Vicent Soler»', () => {
  const index = [
    deAgent({ id: 'a', name: 'Vicent Ferris', type: 'PERSON', town_name: 'La Torre de les Maçanes' }),
    deAgent({ id: 'b', name: 'Vicent Soler', type: 'PERSON', town_name: 'Penàguila' })
  ];
  const { llista } = cercaEntrades(index, 'vicent torre');
  expect(llista.map((e) => e.id)).toEqual(['a']);
});

test('un element sense searchText ni camps coneguts no llança', () => {
  expect(() => cercaEntrades([deAgent({ id: 'x', name: 'Algú' }), deAgent({}), null], 'algu')).not.toThrow();
  expect(cercaEntrades([{ clau: 'persones:z', tipus: 'persones' }], 'res').total).toBe(0);
});

test('rànquing: títol igual, després prefix al títol, després dins del cos', () => {
  const index = [
    dePublicacio({ id: 'cos', title: 'Crònica de juny', content: 'Parlem de la festa', created_at: '2026-06-01' }),
    dePublicacio({ id: 'prefix', title: 'Festassa al riu', created_at: '2026-01-01' }),
    dePublicacio({ id: 'igual', title: 'Festa', created_at: '2025-01-01' })
  ];
  expect(cercaEntrades(index, 'festa').llista.map((e) => e.id)).toEqual(['igual', 'prefix', 'cos']);
});

test('desempat per data descendent i, després, per ordre alfabètic', () => {
  const index = [
    dePublicacio({ id: 'vella', title: 'Aplec', created_at: '2024-01-01' }),
    dePublicacio({ id: 'nova', title: 'Aplec', created_at: '2026-01-01' })
  ];
  expect(cercaEntrades(index, 'aplec').llista.map((e) => e.id)).toEqual(['nova', 'vella']);
});

test('es deduplica per tipus:id (guanya la primera) i els recomptes perTipus quadren', () => {
  const index = [
    deIdentitat({ tipus: 'persona', id: 'jo', nom: 'Javi Poble' }, { nomCompte: 'El teu compte' }),
    deMembre(membre('jo', 'Javi duplicat')),
    deMembre(membre('e1', 'Cooperativa Javi', { tipus: 'entitat' })),
    deNota({ id: 'n1', title: 'Idees de Javi', plainText: 'res més' })
  ];
  const tot = cercaEntrades(index, 'javi');
  expect(tot.total).toBe(3);
  expect(tot.perTipus).toMatchObject({ tot: 3, persones: 1, entitats: 1, notes: 1, pobles: 0 });
  expect(tot.llista.find((e) => e.clau === 'persones:jo').titol).toBe('Javi Poble');
  const nomesNotes = cercaEntrades(index, 'javi', 'notes');
  expect(nomesNotes.llista.map((e) => e.clau)).toEqual(['notes:n1']);
  expect(nomesNotes.perTipus.persones).toBe(1);
});

test('un duplicat que no coincidix no amaga el que sí: la IAIA del padró es troba pel rol del catàleg', () => {
  const opcions = { etiquetes: { ia: 'Intel·ligència artificial' } };
  const delPadro = deMembre(membre('iaia', 'IAIA MarIA', { tipus: 'ia' }), opcions);
  const delCataleg = deAgent({ id: 'iaia', name: 'IAIA MarIA', type: 'AI', role: 'Matriarca Digital', short_bio: 'Guarda la memòria del poble.' }, opcions);
  const abans = cercaEntrades([delCataleg], 'matriarca');
  expect(abans.total).toBe(1);
  /* Quan arriba el padró (que va primer i només porta el nom), la IAIA no desapareix. */
  const despres = cercaEntrades([delPadro, delCataleg], 'matriarca');
  expect(despres.total).toBe(1);
  expect(despres.perTipus.persones).toBe(1);
  const iaia = despres.llista[0];
  /* Es pinta la primera (amb «Escriu-li»), completada amb el que li faltava. */
  expect(iaia.accio).toEqual({ tipus: 'escriu', href: '/xat?amb=iaia' });
  expect(iaia.meta).toEqual(['Intel·ligència artificial', 'Matriarca Digital']);
  expect(iaia.extracte).toBe('Guarda la memòria del poble.');
  expect(cercaEntrades([delPadro, delCataleg], 'iaia').total).toBe(1);
});

test('una referència opaca (sdp-media://) o un camp cru insegur no fa miniatura ni foto d’avatar', () => {
  const post = dePublicacio({ id: 'p', title: 'Portada', imageSrc: null, image_url: null, image: 'sdp-media://mitjans/u/foto.jpg' });
  expect(post.imatge).toBeNull();
  const mel = deProducte({ id: 'm', title: 'Mel', images: ['sdp-media://mitjans/u/mel.jpg'], image_url: '/assets/mel.jpg' });
  expect(mel.imatge.src).toBe('/assets/mel.jpg');
  expect(dePublicacio({ id: 'j', title: 'X', image: 'javascript:alert(1)' }).imatge).toBeNull();
  expect(deMembre(membre('u', 'Pepa', { avatar_url: 'sdp-media://mitjans_privats/u/cara.jpg' })).avatar.src).toBeNull();
  expect(deMembre(membre('u', 'Pepa', { avatar_url: '/assets/pepa.jpg' })).avatar.src).toBe('/assets/pepa.jpg');
});

/* Onada 12 (261011; ordres 261011_0130, punt 1: «hi ha dos Mac Mini»). */
test('la miniatura d’un producte és la seua primera foto, no l’imageSrc que porta el logotip de qui ven', () => {
  const LOGO = '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png';
  const mac = deProducte({ id: 'mac', title: 'Mac Mini', avatar_url: LOGO, imageSrc: LOGO, images: ['/assets/mac.jpg', '/assets/mac-2.jpg'] });
  expect(mac.imatge.src).toBe('/assets/mac.jpg');
  /* Sense cap foto pròpia, la reserva de sempre (la de la targeta del Mercat). */
  expect(deProducte({ id: 'cadira', title: 'Cadira', avatar_url: LOGO, imageSrc: LOGO }).imatge.src).toBe(LOGO);
});

/* Correcció D3 (261011, refutació del front 1) · La foto d'un article és una
   entrada de Multimèdia de ple dret: només es retira de la vista «tot» quan
   el seu article ja hi ix. */
test('la foto d’un article fa entrada i diu de quin article és (fotoDe); un mitjà de l’arxiu, cap article', () => {
  const foto = deMedia({ id: 'market-0', title: 'Mac Mini', src: '/assets/mac.jpg', article: { sectionId: 'mercat', id: 'mac' } });
  expect([foto.clau, foto.tipus, foto.fotoDe, foto.imatge.src]).toEqual(['multimedia:market-0', 'multimedia', 'mercat:mac', '/assets/mac.jpg']);
  expect(deMedia({ id: 't', title: 'Tibi', article: { sectionId: 'pobles', id: 'tibi' } }).fotoDe).toBe('pobles:tibi');
  expect(deMedia({ id: 'f', title: 'Fira', article: { sectionId: 'mur', id: 'p1' } }).fotoDe).toBe('publicacions:p1');
  expect(deMedia({ id: 'a', title: 'Aplec', article: { sectionId: 'events', id: 'e1' } }).fotoDe).toBe('agenda:e1');
  /* Una secció desconeguda o un article sense id no casen amb cap resultat. */
  expect(deMedia({ id: 'x', title: 'X', article: { sectionId: 'altres', id: '1' } }).fotoDe).toBeNull();
  expect(deMedia({ id: 'y', title: 'Y', article: { sectionId: 'mercat' } }).fotoDe).toBeNull();
  const arxiu = deMedia({ id: 'nano-mur', title: 'Mur', src: '/assets/nano.jpg', kind: 'image' });
  expect([arxiu.clau, arxiu.fotoDe, arxiu.imatge.src]).toEqual(['multimedia:nano-mur', null, '/assets/nano.jpg']);
});

test('una foto es queda a la vista «tot» si el seu article no és entre els resultats', () => {
  const foto = deMedia({ id: 'market-0', title: 'Mac Mini', description: 'Gris espacial', article: { sectionId: 'mercat', id: 'mac' } });
  /* L'article no és a l'índex (una altra font encara carrega, o ja no existix). */
  expect(cercaEntrades([foto], 'mac').llista.map((e) => e.clau)).toEqual(['multimedia:market-0']);
  /* L'article hi és però no casa amb la consulta: la foto sí, i ix. */
  const producte = deProducte({ id: 'mac', title: 'Mac Mini', description: 'Comprat al març' });
  const gris = cercaEntrades([producte, foto], 'gris');
  expect(gris.llista.map((e) => e.clau)).toEqual(['multimedia:market-0']);
  expect(gris.perTipus).toMatchObject({ tot: 1, mercat: 0, multimedia: 1 });
});

test('amb la llavor de veres: a «tot», el Mac Mini, la Samarreta i cada poble ixen UNA vegada; amb el filtre Multimèdia, la seua foto', () => {
  const index = [...TOWNS.map((poble) => dePoble(poble)), ...MARKET_ITEMS.map((producte) => deProducte(producte)),
    ...MEDIA_ITEMS.map((media) => deMedia(media))].filter(Boolean);
  const mac = cercaEntrades(index, 'mac mini');
  expect(mac.llista.map((e) => e.clau)).toEqual(['mercat:mac-mini-m4']);
  expect(mac.total).toBe(1);
  /* El recompte de cada filtre és el que eixe filtre ensenya; «tot» no conta la foto repetida. */
  expect(mac.perTipus).toMatchObject({ tot: 1, mercat: 1, multimedia: 1 });
  expect(mac.llista[0].imatge.src).toBe('/assets/uploads/brain/mac_mini_m4_1787721966622.jpg');
  expect(cercaEntrades(index, 'samarreta').llista.map((e) => e.clau)).toEqual(['mercat:samarreta-socdepoble']);
  expect(cercaEntrades(index, 'tibi').llista.map((e) => e.clau)).toEqual(['pobles:tibi']);

  const fotoMac = cercaEntrades(index, 'mac mini', 'multimedia');
  expect(fotoMac.llista.map((e) => e.clau)).toEqual(['multimedia:market-0']);
  expect(fotoMac.total).toBe(1);
  expect(cercaEntrades(index, 'samarreta', 'multimedia').llista.map((e) => e.clau)).toEqual(['multimedia:market-1']);
  expect(cercaEntrades(index, 'tibi', 'multimedia').llista.map((e) => e.clau)).toEqual(['multimedia:town-tibi']);
  for (const poble of TOWNS) {
    expect(cercaEntrades(index, poble.title).llista.filter((e) => e.titol === poble.title).map((e) => e.clau)).toEqual([`pobles:${poble.id}`]);
    expect(cercaEntrades(index, poble.title, 'multimedia').llista.map((e) => e.clau)).toContain(`multimedia:town-${poble.id}`);
  }
  /* L'arxiu de Multimèdia es continua trobant, a «tot» i amb el filtre. */
  expect(cercaEntrades(index, 'nano banana', 'multimedia').total).toBeGreaterThan(0);
  expect(cercaEntrades(index, 'nano banana').perTipus.tot).toBe(cercaEntrades(index, 'nano banana').perTipus.multimedia);
});

test('agents PERSON, COMPANY i AI van al tipus i a la ruta que toquen', () => {
  const persona = deAgent({ id: '0001', name: 'Javi', type: 'PERSON' });
  const entitat = deAgent({ id: 'socdepoble', name: 'Sóc de Poble', type: 'COMPANY' });
  const ia = deAgent({ id: 'iaia', name: 'IAIA MarIA', type: 'AI' }, { etiquetes: { ia: 'Intel·ligència artificial' } });
  expect([persona.tipus, persona.href]).toEqual(['persones', '/gent/0001']);
  expect([entitat.tipus, entitat.href]).toEqual(['entitats', '/empresa/socdepoble']);
  expect([ia.tipus, ia.href]).toEqual(['persones', '/perfil/iaia']);
  expect(ia.meta[0]).toBe('Intel·ligència artificial');
});

test('una persona del padró porta «Escriu-li» cap al xat; la fitxa, només si es pot obrir', () => {
  const fitxes = { fitxesDePersones: true };
  const sense = deMembre(membre('u 9', 'Maria'), fitxes);
  expect(sense.href).toBe('/gent/u%209');
  expect(sense.accio).toEqual({ tipus: 'escriu', href: '/xat?amb=u%209' });
  const ambFil = deMembre(membre('u1', 'Maria', { fil_id: 'f1' }), fitxes);
  expect(ambFil.accio.href).toBe('/xat/f1');
  expect(deMembre(membre('e', 'Cooperativa', { tipus: 'entitat' }), fitxes).href).toBe('/empresa/e');
});

/* Poliment T45 · En remot la fitxa d'una altra persona encara no es pot llegir
   (falta la RPC perfil_public): enllaçar-hi portaria a «Perfil no trobat». */
test('sense fitxesDePersones, una persona o una IA del padró no enllaça; una entitat sí', () => {
  const persona = deMembre(membre('u1', 'Maria'));
  expect(persona.href).toBeNull();
  expect(persona.accio).toEqual({ tipus: 'escriu', href: '/xat?amb=u1' });
  expect(deMembre(membre('iaia', 'IAIA MarIA', { tipus: 'ia' })).href).toBeNull();
  expect(deMembre(membre('e', 'Cooperativa', { tipus: 'entitat' })).href).toBe('/empresa/e');
});

test('la data d’una publicació és la del Mur: la triada al calendari abans que la de creació', () => {
  const post = dePublicacio({ id: 'p', title: 'Fira', publish_date: '2026-10-05T08:30:00.000Z', created_at: '2026-09-01T10:00:00.000Z' }, { locale: 'ca-ES' });
  expect(post.data).toBe(Date.parse('2026-10-05T08:30:00.000Z'));
  expect(post.meta).toContain(new Date('2026-10-05T08:30:00.000Z').toLocaleDateString('ca-ES', { day: 'numeric', month: 'short', year: 'numeric' }));
  expect(dePublicacio({ id: 'q', title: 'Aplec', created_at: '2026-09-01T10:00:00.000Z' }).data).toBe(Date.parse('2026-09-01T10:00:00.000Z'));
});

test('la conversa porta href /xat/ID i va marcada com a privada', () => {
  const fil = deConversa({ id: 'f7', title: 'Pepa', ultimText: 'Ens veiem a la plaça', ultimAl: '2026-09-01T10:00:00Z' });
  expect(fil.href).toBe('/xat/f7');
  expect(fil.privada).toBe(true);
  expect(cercaEntrades([fil], 'placa').total).toBe(1);
});

test('mai s’indexa ni es mostra un correu', () => {
  expect(deMembre(membre('u1', 'pepa@exemple.org'))).toBeNull();
  const jo = deIdentitat({ tipus: 'persona', id: 'jo', nom: 'jo@exemple.org' }, { correu: 'jo@exemple.org', nomCompte: 'El teu compte' });
  expect(jo.titol).toBe('El teu compte');
  expect(jo.href).toBe('/el-meu-perfil');
  expect(jo.text).not.toContain('exemple');
  expect(cercaEntrades([jo], 'exemple').total).toBe(0);
});

test('les notes enllacen a /notes?nota= i les pàgines a la seua ruta', () => {
  expect(deNota({ id: 'n 1', title: '<p>Hola</p>' }).href).toBe('/notes?nota=n%201');
  expect(deNota({ id: 'n1', title: '<p>Hola</p>' }).titol).toBe('Hola');
  expect(dePagina({ key: 'projecte', title: 'El Projecte' }).href).toBe('/projecte');
  expect(dePagina({ key: 'consola', title: 'Consola' }).href).toBe('/page/consola');
});

test('el ressaltat respecta els accents i no fa servir HTML', () => {
  expect(partsRessaltades('Pepa Güell', ['guell'])).toEqual([
    { text: 'Pepa ', marca: false },
    { text: 'Güell', marca: true }
  ]);
  expect(partsRessaltades('<b>festa</b>', ['festa'])).toEqual([
    { text: '<b>', marca: false },
    { text: 'festa', marca: true },
    { text: '</b>', marca: false }
  ]);
  expect(partsRessaltades('Fé i fe', ['fe']).filter((p) => p.marca).map((p) => p.text)).toEqual(['Fé', 'fe']);
  expect(partsRessaltades('res', [])).toEqual([{ text: 'res', marca: false }]);
});

test('l’extracte comença prop de la coincidència i talla per paraules', () => {
  const llarg = `${'paraula '.repeat(60)}la festa major de Benifallim ${'final '.repeat(40)}`.trim();
  const tros = extracteAmbContext(llarg, ['festa'], 120);
  expect(tros.startsWith('…')).toBe(true);
  expect(tros.endsWith('…')).toBe(true);
  expect(tros).toContain('festa major');
  expect(tros.length).toBeLessThanOrEqual(122);
  expect(extracteAmbContext('curt', ['festa'])).toBe('curt');
});

test('l’extracte ix del cos quan la coincidència no és a l’entradilla', () => {
  const pagina = dePagina({ key: 'ruta', title: 'Full de ruta', lead: 'La tecnologia mai s’atura.', html: '<h3>Fases</h3><p>La comissió de festes decidix.</p>' });
  expect(extracteDeResultat(pagina, ['comissio'])).toBe('Fases La comissió de festes decidix.');
  expect(extracteDeResultat(pagina, ['tecnologia'])).toBe('La tecnologia mai s’atura.');
  expect(extracteDeResultat(pagina, ['res'])).toBe('La tecnologia mai s’atura.');
  expect(extracteDeResultat(deMembre(membre('u', 'Pepa')), ['pepa'])).toBe('');
});

test('textPla lleva etiquetes i imatges Markdown; tipusValid cau a «tot»', () => {
  expect(textPla('<p>Hola&nbsp;<strong>poble</strong></p>![foto](x.png)')).toBe('Hola poble');
  expect(tipusValid('persones')).toBe('persones');
  expect(tipusValid('<script>')).toBe('tot');
  expect(tipusValid(null)).toBe('tot');
});
