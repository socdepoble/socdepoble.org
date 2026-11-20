/** P0-SEO-UNIVERSAL (ordre del Mestre, 13-11-2026) · Les EXEMPCIONS de la Porta de
 * cobertura social del Router (cobertura-router.mjs). Tota ruta pública del Router
 * ha de tindre OpenGraph específic al manifest social o una fila ací, amb el seu
 * MOTIU. No hi ha comodins propis: `ruta` és el patró exacte del Router (o, per a
 * una instància d'una família coberta, la seua adreça concreta).
 *
 * Classes, i què en comprova el codi (una classe que el codi no confirma és roja):
 *   · 'portada'    només «/»: servix dist/index.html, que el prerender no toca mai;
 *   · 'sessio'     la ruta porta RequireAuth;
 *   · 'eina'       el primer tram no és indexable (useSEO.js · PRIVATE i
 *                  publication-policy.mjs · PRIVATE_ROUTES, en conjunció);
 *   · 'plataforma' una ruta d'app sota /app/* (una fila per app dels manifests);
 *   · 'redireccio' un component de redirecció, amb el destí declarat (i igual al
 *                  que es deduïx del codi quan és estàtic). Només val si el destí
 *                  és exempt: si és una ruta coberta, ha de ser un àlies;
 *   · 'pendent'    deute declarat, amb `revisio`; ix sempre a l'informe.
 *
 * El que NO és cap ruta del Router i, per tant, no pot tindre fila:
 *   · els documents per consulta: /wikidepoble?item=<id> té forma de camí coberta
 *     (/wikidepoble/<id>); /multimedia?foto=<id> és deute (R23);
 *   · el connector WordPress: la ruta viu al fragment (#sdp=) i no arriba al
 *     servidor; el seu OpenGraph és un canal a banda, apagat per defecte (D-SEO-17);
 *   · les apps natives: compartixen l'adreça de l'origen públic, que sí que es cobrix.
 */
const exempcio = fila => Object.freeze(fila);
const APPS = Object.freeze(['bar', 'genealogia', 'gestoria', 'lector', 'nevera', 'salut']);
const AMBITS_AMB_DETALL = Object.freeze(['calendari', 'mapa', 'vehicle', 'animalets', 'treball', 'habitatge']);
const REVISIO = 'R23';

export const EXEMPCIONS_SOCIALS = Object.freeze([
  exempcio({ruta: '/', classe: 'portada', motiu: 'La portada redirigix a la secció per defecte i servix dist/index.html, que el prerender no toca mai.'}),

  exempcio({ruta: '/admin/*', classe: 'sessio', motiu: 'Administració: només amb sessió de superadmin (RequireAuth).'}),
  exempcio({ruta: '/el-meu-perfil', classe: 'sessio', motiu: 'El workspace privat de cada identitat: només amb sessió (RequireAuth).'}),

  exempcio({ruta: '/xat', classe: 'eina', motiu: 'El Xat és una eina personal: sense indexar i sense targeta pròpia.'}),
  exempcio({ruta: '/xat/:threadId', classe: 'eina', motiu: 'Un fil del Xat és una conversa: mai es prerenderitza.'}),
  exempcio({ruta: '/control-xat', classe: 'eina', motiu: 'El control del Xat és una eina interna, sense indexar.'}),
  exempcio({ruta: '/notes', classe: 'eina', motiu: 'El Bloc de notes és privat: cap nota ix mai a un head públic.'}),
  exempcio({ruta: '/notes/:itemId', classe: 'eina', motiu: 'Una nota és privada: mai es prerenderitza ni es compartix.'}),
  exempcio({ruta: '/dispositius', classe: 'eina', motiu: 'La pàgina de dispositius és una eina de diagnòstic, sense indexar.'}),
  exempcio({ruta: '/cerca', classe: 'eina', motiu: 'El Cercador depén de la consulta de cada persona: sense indexar.'}),
  exempcio({ruta: '/registre', classe: 'eina', motiu: 'Entrar o crear compte: una eina, sense indexar.'}),
  exempcio({ruta: '/control', classe: 'eina', motiu: 'El Panell de Control és una eina personal, sense indexar.'}),
  exempcio({ruta: '/utilitats', classe: 'eina', motiu: 'Àlies del Panell de Control: una eina personal, sense indexar.'}),
  exempcio({ruta: '/connectar', classe: 'eina', motiu: 'Connectar depén de l’objecte i de la sessió: sense indexar.'}),
  exempcio({ruta: '/traduccions', classe: 'eina', motiu: 'Traduccions i llengua és una eina de configuració, sense indexar.'}),

  exempcio({ruta: '/app/*', classe: 'plataforma', motiu: 'El portal d’apps i cada app registren index:false (RutaApps.jsx): eines, no pàgines.'}),
  ...APPS.map(id => exempcio({ruta: `/app/${id}/*`, classe: 'plataforma', motiu: `L’app «${id}» és una eina de la plataforma: el seu contenidor registra index:false.`})),

  exempcio({ruta: '/login', classe: 'redireccio', desti: '/registre', motiu: 'Àlies d’entrada: redirigix a /registre, que és una eina exempta.'}),
  exempcio({ruta: '/accedir', classe: 'redireccio', desti: '/registre', motiu: 'Àlies d’entrada: redirigix a /registre, que és una eina exempta.'}),
  exempcio({ruta: '/entrar', classe: 'redireccio', desti: '/registre', motiu: 'Àlies d’entrada: redirigix a /registre, que és una eina exempta.'}),
  exempcio({ruta: '/crear-compte', classe: 'redireccio', desti: '/registre', motiu: 'Àlies d’entrada: redirigix a /registre, que és una eina exempta.'}),
  exempcio({ruta: '/registra', classe: 'redireccio', desti: '/registre', motiu: 'Àlies d’entrada: redirigix a /registre, que és una eina exempta.'}),
  exempcio({ruta: '/panell', classe: 'redireccio', desti: '/control', motiu: 'Àlies del Panell de Control: redirigix a /control, una eina exempta.'}),
  exempcio({ruta: '/chat', classe: 'redireccio', desti: '/xat', motiu: 'Àlies anglés del Xat: redirigix a /xat, una eina exempta.'}),
  exempcio({ruta: '/chat/:threadId', classe: 'redireccio', desti: '/xat', motiu: 'Àlies anglés d’un fil del Xat: redirigix a /xat/<fil>, una eina exempta.'}),
  exempcio({ruta: '/app/avisador', classe: 'redireccio', desti: '/page/avisador', motiu: 'Adreça curta de l’Avisador: redirigix a /page/avisador, que és deute declarat.'}),
  exempcio({ruta: '/multimedia/:itemId/*', classe: 'redireccio', desti: '/multimedia', motiu: 'Redirigix a l’Arxiu amb el visor obert (?foto=) o a la pàgina del poble: destí per consulta, dinàmic.'}),
  /* Instàncies de /page/:slug que PAGE_ROUTE_MAP porta a una adreça exempta. */
  exempcio({ruta: '/page/dispositius', classe: 'redireccio', desti: '/dispositius', motiu: 'PAGE_ROUTE_MAP la porta a /dispositius, una eina exempta.'}),
  exempcio({ruta: '/page/iaia-sabuda', classe: 'redireccio', desti: '/page/la-iaia-sabuda', motiu: 'Àlies defensiu de La IAIA Sabuda: el seu destí no té head públic.'}),
  exempcio({ruta: '/page/nodrir-la-iaia', classe: 'redireccio', desti: '/page/la-iaia-sabuda', motiu: 'Àlies defensiu (adreça de R15) de La IAIA Sabuda: el seu destí no té head públic.'}),
  exempcio({ruta: '/page/guia', classe: 'redireccio', desti: '/page/tot-el-que-pots-fer', motiu: 'Àlies curt de la guia pas a pas (IDEA-287): redirigix a /page/tot-el-que-pots-fer.'}),

  exempcio({ruta: '/page/la-iaia-sabuda', classe: 'pendent', revisio: 'D-SEO-26',
    motiu: 'Espai de curadoria amb rol verificat i safata privada: una prova vigent (build-social-manifest.test.mjs) diu que no té head públic; el Mestre decidix.'}),
  exempcio({ruta: '/page/node-zero', classe: 'pendent', revisio: REVISIO,
    motiu: 'El seu text el recomponen en execució pageContent.r10.js i pageContent.fediversityR20.js: el productor (AST) en donaria un head distint del del client.'}),
  exempcio({ruta: '/page/tot-el-que-pots-fer', classe: 'pendent', revisio: 'IDEA-287',
    motiu: 'La guia pas a pas de les eines té el head al client (TextSection), però el productor (AST) no llig pageContent.potsFer.js i la seua portada encara no té variant social JPEG: ho decidix el Mestre.'}),
  exempcio({ruta: '/page/notes_shared', classe: 'pendent', revisio: REVISIO,
    motiu: 'Còpia antiga de la fitxa del Bloc de notes, amb el logotip SVG com a imatge: no és cap presentació pròpia.'}),
  exempcio({ruta: '/page/avisador', classe: 'pendent', revisio: REVISIO,
    motiu: 'La pàgina de l’Avisador (condicional de build) no registra cap head propi: la seua targeta és la de /plugin/avisador.'}),
  exempcio({ruta: '/page/:slug/:itemSlug', classe: 'pendent', revisio: REVISIO,
    motiu: 'Les fitxes dels catàlegs de patrimoni (herbari, banc de llavors, arbres, receptes) encara no tenen head per fitxa.'}),
  exempcio({ruta: '/receptes/:itemId', classe: 'pendent', revisio: REVISIO,
    motiu: 'Cada recepta del llibre «Què dinem?» té el seu head al client, però encara no es prerenderitza.'}),
  ...AMBITS_AMB_DETALL.map(ambit => exempcio({ruta: `/${ambit}/:itemId`, classe: 'pendent', revisio: REVISIO,
    motiu: `El detall de l’àmbit «${ambit}» són publicacions dels veïns al Mur: depenen del Mur veïnal (D-SEO-16), encara apagat.`}))
]);

export const CLASSES_D_EXEMPCIO = Object.freeze(['portada', 'sessio', 'eina', 'plataforma', 'redireccio', 'pendent']);
