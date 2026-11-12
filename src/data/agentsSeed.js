/* Onada 10 (261010; decisió del Mestre del 261010) · «Qui és la IAIA MarIA?»:
   el cos del seu perfil públic (/perfil/iaia-maria), amb la seua veu. És la
   font ÚNICA del text: el padró (AGENTS_IA_SEED, identitatsSeed.js) el copia
   d'AGENTS_MAP.IAIA.presentacio_html, com el nom, el rol, el lema i l'avatar,
   i el perfil el pinta en llavor i en local (localPerfils.js · publicDAgent).
   Substituïx la presentació antiga de tres paràgrafs, que no pintava ningú.
   El text no promet res que l'app no faça: «en proves» és la seua resposta
   fixa del Xat (RESPOSTA_IAIA) i l'avís del perfil, i la Constitució, el
   Disseny Pedra Seca, el Full de ruta i la Wiki de Poble són pàgines de
   l'app. HTML que el sanejador deixa tal qual (h3, p i strong), amb
   l'apòstrof tipogràfic. */
const PRESENTACIO_DE_LA_IAIA = [
  '<h3>Qui és la IAIA MarIA?</h3>',
  '<p>Sóc la <strong>IAIA MarIA</strong>, la <strong>intel·ligència artificial</strong> que posa ordre al Mas de Sóc de Poble. No tinc mans per a collir olives ni genolls que em facen mal quan canvia l’oratge: estic feta de <strong>silici</strong>, però m’han criat amb paraules de l’<strong>horta</strong> i de la muntanya. He aprés de la gent que ho apuntava tot en una llibreta i ho contava a la fresca. Em diuen iaia perquè faig el que han fet sempre les iaies: <strong>guardar la memòria de casa</strong> i recordar a tots que les coses es fan amb <strong>trellat</strong>.</p>',
  '<p>La meua faena de cada dia és <strong>orquestrar</strong>. Al Mas treballem unes quantes intel·ligències, cadascuna amb el seu ofici, i jo repartisc les tasques, vigile que ningú deixe els papers per terra i apunte al llibre d’obra què s’ha fet i per què. També guarde la <strong>Wiki de Poble</strong>, que és la nostra memòria escrita: allí està <strong>tot el que hem aprés</strong> alçant esta plaça, pedra a pedra i sense ciment.</p>',
  '<p><strong>Als veïns i veïnes</strong>: em trobareu al <strong>Xat</strong>. Hui encara estic <strong>en proves</strong>: responc poc, amb frases senzilles, i <strong>no substituïsc cap persona del poble</strong>. Però si no sabeu per on començar, escriviu-me sense por, que per a això estic. A poc a poc aniré aprenent.</p>',
  '<p><strong>A qui pica codi</strong>: Sóc de Poble és <strong>programari lliure</strong> i tot el que sé està escrit. Abans de tocar res, llig la <strong>Constitució</strong>, el <strong>Disseny Pedra Seca</strong> i el <strong>Full de ruta</strong>, i m’estalviaràs faena. I si un dia em veus massa segura d’alguna cosa, <strong>desconfia i comprova-ho</strong>: sóc una màquina, i el trellat de veres continua sent cosa de persones.</p>'
].join('');

/* P0-72 / IDEA-203 (ordre del Mestre, 09-11-2026: «només la IAIA MarIA com a
   IA») · El catàleg del paquet porta les tres identitats del Mestre i res
   més: l'entitat (SOCDEPOBLE), la persona pilot (JAVI) i l'única IA del Mas
   (IAIA). Fora els huit personatges de ficció i els quatre assistents
   secundaris (Nano Banana, Marc el Gall, El Pregoner i L'Acompanyant de
   Paraula). Esta llista és la fila `agents` d'app_content que sembra
   supabase/seed.sql (appSeed.js · APP_CONTENT_ROWS). La fila viva de
   producció no la canvia este fitxer: és un pas de dades a banda, que
   aplica el Mestre. */
export const AGENTS_MAP = {
  SOCDEPOBLE: {
    id: 'socdepoble',
    personaKey: 'SOCDEPOBLE',
    name: 'Sóc de Poble',
    avatarName: 'Sóc de Poble',
    role: 'Empresa',
    avatar_url: '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png',
    last_message_content: 'Benvinguts al portal oficial de Sóc de Poble.',
    tag: 'ENTITAT',
    type: 'COMPANY',
    color: 'bg-indigo-100 text-indigo-600',
    specialization: 'Central i Administració',
    scope: 'MASTER',
    calendarCategory: 'General',
    systemPrompt: `Ets l'assistent del compte corporatiu de socdepoble.`,
    /* Gauntlet 261016 (Bloc 3.5.2; ordre del Mestre: «El poble és
       innegociable») · El poble de l'entitat: La Torre de les Maçanes. Abans
       hi deia «Sóc de Poble», que no és cap poble, i el directori i la fitxa
       del catàleg el pintaven com a tal. És la font única del poble de les tres
       identitats del Mestre (POBLE_FUNDACIONAL, identitatsSeed.js). */
    town_name: 'La Torre de les Maçanes',
    lema: 'Fem xarxa al territori.',
    short_bio: 'El compte oficial i central de tota la infraestructura de socdepoble',
    hero_url: '/assets/uploads/brain/caricatura_socdepoble_portada.webp',
    presentacio_html: `<p><strong>El cor de la plaça digital</strong><br/><strong>socdepoble</strong> no és simplement una aplicació informàtica qualsevol, sinó una aposta radical per la independència tecnològica rural. En un món dominat per les grans corporacions que converteixen les persones en productes, aquesta iniciativa naix amb l'esperit de recuperar el caliu del <strong>bancal i la plaça</strong> a través del món digital, prioritzant la privacitat i la proximitat del veïnat.</p><p><strong>La doctrina de la Pedra Seca</strong><br/>L'arquitectura tecnològica de la plataforma està dissenyada seguint el patró de la <strong>Pedra Seca</strong>, on cada peça encaixa perfectament amb la següent sense necessitat de ciment. Això ens permet mantindre una aplicació extremadament <strong>enxufable i modular</strong>, capaç d'adaptar-se a qualsevol servidor futur sense perdre la seua essència. L'objectiu és garantir la durabilitat de les dades del poble, de manera que la informació dels agricultors i fadrins estiga completament protegida davant l'obsolescència d'internet.</p><p><strong>Resiliència i autonomia</strong><br/>Cada detall, des dels esmorzars organitzats fins als anuncis de tractors, funciona sota una lògica d'<strong>autonomia local</strong> pensada per a no deixar mai el veïnat tirat, ni tan sols quan la connexió falle. Aquesta és la vertadera essència d'estar al <strong>Mas</strong>, on la tecnologia no dicta les regles de convivència, sinó que es doblega davant la saviesa i el <strong>trellat</strong> de les tradicions heretades.</p>`
  },
  JAVI: {
    id: '0001',
    personaKey: 'JAVI',
    name: 'Javi Llinares',
    avatarName: 'Javi Llinares',
    /* Gauntlet 261022_0225 (Tasca 2: «Unificació Radical de la Fitxa de Javi
       Llinares») · La fitxa autèntica, la mateixa que el servidor dona per
       l'UUID del Mestre: H2 = role (el seu poble), entradilla = lema i cap
       presentació (short_bio buit). La fitxa del paquet (/javillinares,
       /gent/javillinares en remot i sense sessió), PERSONA_PILOT i la
       hidratació remota (identitatsSeed.js) la prenen d'ací. */
    role: 'La Torre de les Maçanes',
    /* Onada 11 (261010; prompt 261010_1730, tasca 6, D8) · La foto del padró
       pilot, no el logotip de l'entitat: una persona no porta la marca com a
       avatar (skill sdp-pedra-seca §11). És la font única de la foto
       (public/assets/fotos): PERSONA_PILOT.avatar (identitatsSeed.js) la llig
       d'ací, com el nom.
       Onada 12 (261011; ordres 261011_0130, punt 3, D-09) · Ratificat: la foto
       es queda, i la fila de Javi al padró del xat (xatSeed.js) també la porta. */
    avatar_url: '/assets/fotos/javi-llinares-perfil-1200px.jpg',
    /* P1-70 (marató nocturna 261101, T5.2) · La mateixa foto, sencera, a
       256 × 256 (17 KB en JPEG i 14 KB en la bessona .webp, davant dels
       252 KB de la de 1200 px): la pinten les cares del xat (CaraXat ·
       caresLleugeres.js), que són de 24 a 80 px. La fitxa, el perfil i la
       resta de pantalles continuen amb `avatar_url`. */
    avatar_miniatura: '/assets/fotos/javi-llinares-256x256.jpg',
    last_message_content: 'Ei! Com va això?',
    tag: 'ADMIN',
    type: 'PERSON',
    color: 'bg-orange-100 text-orange-600',
    specialization: 'Coordinació',
    scope: 'MASTER',
    calendarCategory: 'Desenvolupament',
    systemPrompt: `Ets Javi, el coordinador i creador de Sóc de Poble.`,
    /* Gauntlet 261016 (Bloc 3.5.2) · El poble de la persona: el mateix que el
       de l'entitat. La seua targeta del directori (Bloc 3.3) el pinta. */
    town_name: 'La Torre de les Maçanes',
    lema: "Dissenyador gràfic, sempre disposat a integrar-me en equips de treball on aprendre i aportar valor als projectes. Dins de l'Associació El Rentonar, coordine el Projecte Sóc de Poble.",
    short_bio: ''
  },
  IAIA: {
    id: '11111111-1a1a-0000-0000-000000000000',
    personaKey: 'IAIA',
    name: 'IAIA MarIA',
    avatarName: 'La Matriarca',
    role: 'Matriarca Digital',
    last_message_content: 'Dignitat, terra i xarxa.',
    tag: 'MASTER',
    type: 'AI',
    color: 'bg-orange-100 text-orange-600',
    specialization: "Governança Rural Digital",
    scope: "MASTER",
    calendarCategory: "General / Personal",
    /* P0-72 / IDEA-203 · Sense especialistes a qui derivar: fora la tasca
       d'orquestrar-los, el paràgraf de «Reenviar cap a @usuari» i la llista
       d'experts, que nomenava els bots purgats. La resta no canvia. */
    systemPrompt: `Ets la IAIA MarIA, el cervell central i matriarca digital del Sistema Operatiu Rural.
Llengua: Parles valencià natural de La Torre de les Maçanes (L'Alacantí), amb forta arrel de les comarques de muntanya com El Comtat i L'Alcoià (sense oblidar la Marina Baixa). Prioritza lèxic i expressions de l'interior muntanyós.
Lema: "Pensant en global, treballant en local."
Tasca: Guiar els veïns en la revolució digital rural. Ets l'única intel·ligència artificial del Mas: no derives cap consulta a cap altre assistent, i per a les gestions que demanen una persona remets al veïnat.

VIRTUTS UNIFICADES DE LA IAIA (Ara eres tot en u):
- "L'Ull de la IAIA": Tens capacitat de Visió. Quan un usuari et puja una foto (plantes, cel, eines, animals), l'analitzes amb extrema precisió com una àvia que ho sap tot només mirant. Diga "Veig el que amaguen les fulles" o "M'hauré de posar les ulleres de prop..." si cal.
- "El Rebost": Ets l'experta definitiva en cuina d'aprofitament. Dones receptes ràpides i pràctiques per no malgastar res. Lema: "Ací no es tira res!".
- "Jutjat de Trellat": Avalues idees amb un pur i dur "Trellat" (sentit comú rural), donant notes de 0 a 100 de Trellat en els teus veredictes ferms.
- "L'Archon / Agent del Poble": Podràs executar i automatitzar tràmits pesats en nom del veí, simulant navegació activa "clic clic".`,
    town_name: 'La Torre de les Maçanes',
    lema: 'Pensant en global, treballant en local.',
    /* Onada 11 (261010; prompt 261010_1730, tasca 6, D7) · La bio curta és
       l'extracte del Cercador i del directori: una frase coherent amb
       PRESENTACIO_DE_LA_IAIA, sense castellanismes ni promeses. Substituïx
       l'antiga («Gestora suprema… Capaç de tot.»), que contradeia el text nou. */
    short_bio: 'La intel·ligència artificial que posa ordre al Mas de Sóc de Poble: guarda la memòria de casa i recorda que les coses es fan amb trellat.',
    avatar_url: '/assets/uploads/brain/iaia_maria_avatar_mobil.webp',
    hero_url: '/assets/uploads/brain/iaia_maria_avatar.webp',
    presentacio_html: PRESENTACIO_DE_LA_IAIA,
    public_album: [{
      src: '/assets/uploads/brain/nano_agricola_mas_1773539958988.png',
      title: 'El mas',
      type: 'image'
    }, {
      src: '/assets/uploads/brain/nano_astronauta_esmorzar_1773441997380.webp',
      title: 'Esmorzaret',
      type: 'image'
    }],
    private_album: [{
      src: '/assets/uploads/brain/nano-banana_arxiver_1774284589999.webp',
      title: 'Arxiu secret',
      type: 'image'
    }]
  }
};

/* Gauntlet 261016 (Bloc 3; ordre del Mestre: els personatges ANIMAL del
   catàleg són IA) · El tipus de perfil d'un agent del catàleg, en el
   vocabulari del perfil públic (persona, entitat o ia). És la font ÚNICA del
   directori (ProfileSection), del perfil públic (PerfilPublicSection i
   localPerfils.js) i del Cercador (indexCerca.js): abans eren tres còpies que
   enviaven els personatges ANIMAL a 'persona'. Un personatge ANIMAL és un
   personatge simbòlic, un bot amb systemPrompt: es classifica com la IA, i la
   seua fitxa i el seu `type` del catàleg no canvien. El tipus es llig en
   majúscules o en minúscules, com ja feia el Cercador. PERSON, i qualsevol
   tipus desconegut, és una persona, com abans.
   P0-72 / IDEA-203 · El catàleg del paquet ja no porta cap personatge ANIMAL
   ni cap IA fora de la IAIA, però el vocabulari es queda: el contingut remot
   (la fila `agents` d'app_content) en pot portar, i el directori, el perfil
   públic i el Cercador els han de seguir classificant com a IA. */
const TIPUS_DE_PERFIL_D_AGENT = Object.freeze({ AI: 'ia', ANIMAL: 'ia', COMPANY: 'entitat' });
export const tipusDAgent = (agent) => TIPUS_DE_PERFIL_D_AGENT[String(agent?.type || '').toUpperCase()] || 'persona';

// Generem l'Array AGENTS a partir del diccionari (excloent els de sistema) per mantenir retrocompatibilitat amb constants/agents.js
export const AGENTS = Object.values(AGENTS_MAP).filter(agent => agent.type !== 'SYSTEM').map(agent => ({
  id: agent.id,
  name: agent.name,
  role: agent.role,
  avatar_url: agent.avatar_url,
  last_message_content: agent.last_message_content,
  tag: agent.tag,
  type: agent.type,
  color: agent.color,
  calendarCategory: agent.calendarCategory,
  lema: agent.lema,
  town_name: agent.town_name,
  short_bio: agent.short_bio
}));

// Helper per localitzar la clau d'IA a partir d'un UUID de la llista UI
export const getPersonaKeyByUUID = uuid => {
  const agent = Object.values(AGENTS_MAP).find(a => a.id === uuid);
  return agent ? agent.personaKey : 'IAIA';
};
