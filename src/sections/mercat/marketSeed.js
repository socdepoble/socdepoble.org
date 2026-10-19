// Dades de mercat recuperades de la versió original.
/* Gauntlet 261016 (Bloc -1) · La foto de la persona pilot es llig de la font
   única (identitatsSeed.js · PERSONA_PILOT.avatar, que la pren del catàleg
   d'agents): cap fitxer torna a escriure la ruta. Import amb extensió: el
   generador de supabase/seed.sql carrega esta llavor amb node pla. */
import { PERSONA_PILOT } from '../../data/identitatsSeed.js';

export const MOCK_MARKET_ITEMS = [{
  id: 'mac-mini-m4',
  type: 'product',
  title: 'Mac Mini Apple M4, 24/512GB',
  subtitle: 'Com nou - Apple - Gris',
  description: 'Mac Mini en perfecte estat. Comprat al març de 2025.\n\n- Processador Apple M4.\n- 24GB de RAM.\n- 512 GB d\'emmagatzematge.\n\nCaracterístiques adicionals:\n- Color: Gris\n- Estat: Com nou\n- Marca: Apple',
  price: '900.00€',
  seller: 'Javi Llinares',
  /* T3 (261001) · L'autoria de la persona pilot (Javi Llinares) porta la seua
     foto personal de perfil, mai el logotip de l'entitat Sóc de Poble (Pedra Seca §11). */
  avatar_url: PERSONA_PILOT.avatar,
  image_url: '/assets/uploads/brain/mac_mini_m4_1787721966622.jpg',
  author_name: 'Javi Llinares',
  population: 'La Torre de les Maçanes',
  author_role: 'user',
  author_id: 'javillinares',
  official: false,
  pinned: false,
  variations: [],
  images: ['/assets/uploads/brain/mac_mini_m4_1787721966622.jpg'],
  category_slug: 'tecnologia',
  tag: 'ordinador',
  is_pinned: false,
  lat: 38.5919,
  lng: -0.4184,
  created_at: '2026-02-15T12:00:00.000Z'
}, {
  id: 'samarreta-socdepoble',
  type: 'product',
  title: 'Samarreta Sóc de Poble',
  subtitle: "L'edició definitiva amb el logotip complet",
  description: "Mapa del tresor sobre cotó resistent. La imatge complementa el text, no el substituïx.",
  price: '15.00€',
  seller: 'Sóc de Poble',
  avatar_url: '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png',
  author_name: 'Sóc de Poble',
  population: 'La Torre de les Maçanes',
  author_role: 'business',
  author_id: 'soc-de-poble_official',
  author_entity_id: 'socdepoble',
  official: true,
  pinned: true,
  /* Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 1; auditoria
     Codex 2030, §3.2) · Cada variació porta el seu id estable, assignat una
     vegada i únic dins del producte: el selector del detall la tria per l'id,
     mai per la posició ni pel nom. «Esgotat» és el stock_status declarat, cap
     quantitat inventada. */
  variations: [{
    id: 'gris-plom',
    name: 'Edició Gris Plom',
    price: '15.00€',
    description: 'Cotó Roly Gris. Discreta i elegant.',
    image: '/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/02-samarreta-socdepoble-roly-plom-oscur-1024px.png'
  }, {
    id: 'verda-pi',
    name: 'Edició Verda',
    price: '15.00€',
    description: 'Edició especial en color verd pi.',
    image: '/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/samarreta-socdepoble-verd-638px.jpg',
    stock_status: 'Esgotat'
  }],
  /* Ordre del Mestre (261007) · Les huit fotos del carrusel, en l'ordre dels
     fitxers (01-08). La primera, la xica amb la samarreta, és la principal a
     la targeta i a la pàgina; la 05 hi faltava. */
  images: [
    '/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/01-chica-jersey.png',
    '/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/02-samarreta-socdepoble-roly-plom-oscur-1024px.png',
    '/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/03-young-man-tshirt.png',
    '/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/04-iaia-tshirt.png',
    '/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/05-samarreta-socdepoble-muntanya.jpg',
    '/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/06-group-tshirt.png',
    '/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/07-rustic-detail.png',
    '/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/08-javi-llinares-perfil-1024px.jpg'
  ],
  category_slug: 'roba',
  tag: 'samarreta',
  is_pinned: true,
  pinned_position: 1,
  lat: 38.5582,
  lng: -0.4413,
  created_at: '2026-08-15T12:33:00.000Z'
}];
