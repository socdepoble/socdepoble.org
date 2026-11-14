/** P0-SEO-UNIVERSAL (ordre del Mestre, 13-11-2026) · LA PORTA de cobertura social
 * del Router: compara el 100 % de les rutes del Router (rutes-del-router.mjs, per
 * anàlisi del codi) amb el manifest social (build-social-manifest.mjs) i amb els
 * camins que el prerender escriu (prerender-social.mjs · camisServits), i dona
 * una INFRACCIÓ per cada ruta pública que no té OpenGraph específic ni una
 * exempció declarada amb motiu (exempcions-socials.mjs). Pur: sense xarxa ni disc.
 *
 * LLEIS
 *   S1 · Cada ruta és COBERTA (algun camí servit hi casa, amb la semàntica del
 *        Router) o EXEMPTA (el seu patró exacte té fila). Cap de les dos, o les dos
 *        alhora: roja.
 *   S2 · Cada exempció casa amb una ruta viva, porta un motiu de 20 caràcters o
 *        més i una classe que el codi confirma.
 *   S3 · Privadesa: cap camí servit casa amb una ruta amb RequireAuth; un camí el
 *        primer tram del qual no és indexable només pot ser un àlies o una entrada
 *        sense indexar; la llista del servidor és un subconjunt de la del client.
 *   S4 · Fail-closed: cap infracció de l'extractor (ruta sense resoldre, fill
 *        desconegut, fitxer nou amb <Routes>) i cap secció de detall sense classificar.
 *   S5 · Cada camí servit casa amb alguna ruta que no és la 404.
 *   S6 · OpenGraph específic: títol i descripció propis (la parella no és la
 *        genèrica del lloc: la fitxa de l'entitat «Sóc de Poble» es diu com la
 *        marca, però porta el seu lema), imatge i l'adreça de la seua clau.
 *   S7 · Cada família de la fitxa pública té algun camí servit (la llavor) i, amb
 *        un snapshot sintètic d'una entitat i d'un grup, el camí del slug i el de
 *        l'id (el productor està connectat: és la regressió exacta d'este P0).
 *   S8 · En una família coberta, CADA instància que viu al repositori (les claus
 *        de /page/<clau>, els plugins, les pàgines de la Consola) té entrada, àlies
 *        o una exempció per instància amb motiu.
 *   S9 · Una exempció 'redireccio' només val si el destí és exempt: si el destí és
 *        una ruta coberta i estàtica, l'origen ha de ser un àlies del manifest.
 */
import {patroARegex, rutaQueServix} from './rutes-del-router.mjs';

const DETALL_GENERIC = 'ItemDetailSection';
const primerTram = cami => String(cami).replace(/^\/+/, '').split(/[/?#]/)[0];
const esPatro = ruta => /[:*]/.test(ruta);

/**
 * Les rutes que la Porta jutja: les del Router sense els contenidors purs ni la
 * 404, amb el detall genèric (/:sectionId/:itemId) desplegat en una ruta per
 * secció (/mur/:itemId…). Una secció el camí de la qual el resol una ruta
 * anterior (una redirecció declarada abans) no hi entra: no s'hi arriba mai.
 */
export function rutesJutjables(router) {
  const eixida = [];
  for (const ruta of router.rutes) {
    if (ruta.comodi || ruta.contenidorPur) continue;
    if (ruta.component === DETALL_GENERIC && /^\/:[A-Za-z0-9_]+\/:[A-Za-z0-9_]+$/.test(ruta.patro)) {
      for (const seccio of router.seccionsDeDetall) {
        const mostra = `/${seccio}/mostra-de-la-porta`;
        if (rutaQueServix(router.rutes, mostra) !== ruta) continue;
        eixida.push({...ruta, patro: `/${seccio}/:itemId`, generica: ruta.patro, seccio});
      }
      continue;
    }
    eixida.push(ruta);
  }
  return eixida;
}

/**
 * Aplica les lleis. Entrades:
 *   router        el d'extrauRutes;
 *   manifest      el manifest social (sense xarxa i estricte);
 *   camins        camisServits(manifest);
 *   exempcions    EXEMPCIONS_SOCIALS;
 *   indexable     (cami) → booleà: la conjunció de les dos llistes de rutes sense indexar;
 *   privades      { client: [...], servidor: [...] }: les dos llistes (per a S3);
 *   universos     { instancies: [{ cami, familia }], redireccionsDePagina: { cami: desti } };
 *   sintetic      (opcional) { manifest, camins, fitxes: [{ slug, id }] }: el manifest amb el snapshot sintètic (S7b);
 *   generic       { title, description }: el head genèric del lloc (CAP_SOCIAL_BASE).
 * Torna { cobertes, exemptes, pendents, infraccions, diferenciaDePrivades }.
 */
export function coberturaDelRouter({router, manifest, camins, exempcions = [], indexable = () => true, privades = {client: [], servidor: []},
  universos = {instancies: [], redireccionsDePagina: {}}, sintetic = null, generic = {title: 'Sóc de Poble', description: 'Portal de pobles connectats'}} = {}) {
  const infraccions = [];
  const roja = (llei, detall) => infraccions.push({llei, detall});
  for (const infraccio of router.infraccions) roja(infraccio.llei || 'S4', infraccio.detall);
  const rutes = rutesJutjables(router);
  const perPatro = new Map(rutes.map(ruta => [ruta.patro, ruta]));
  const patronsVius = new Set(router.rutes.map(ruta => ruta.patro));
  /* Quina ruta jutjable servix un camí: la del Router i, si és el detall genèric, la de la seua secció. */
  const jutjableDe = cami => {
    const real = rutaQueServix(router.rutes, cami);
    if (!real) return {real: null, jutjable: null};
    if (real.component === DETALL_GENERIC) return {real, jutjable: perPatro.get(`/${primerTram(cami)}/:itemId`) || null};
    return {real, jutjable: perPatro.get(real.patro) || null};
  };

  /* Els camins servits, resolts una vegada. */
  const servits = new Map(); // patró jutjable → [camins]
  const camiServit = new Set(camins.map(c => c.servit));
  for (const {servit, clau, alies} of camins) {
    const {real, jutjable} = jutjableDe(servit);
    if (!real || real.comodi || (real.component === DETALL_GENERIC && !jutjable)) { roja('S5', `${servit}: el Router no el servix (aniria a la 404)`); continue; }
    if (real.guarda) roja('S3', `${servit}: un camí servit casa amb una ruta amb sessió (${real.patro})`);
    const entrada = manifest.routes[clau];
    const senseIndexar = entrada?.index === false && entrada?.compartible === true;
    if (!indexable(servit) && !alies && !senseIndexar) roja('S3', `${servit}: el primer tram no és indexable i l'entrada no és un àlies ni és sense indexar`);
    if (jutjable) {
      if (!servits.has(jutjable.patro)) servits.set(jutjable.patro, []);
      servits.get(jutjable.patro).push(servit);
    }
    /* S6 · OpenGraph específic. */
    if (!entrada) { roja('S6', `${servit}: sense entrada al manifest`); continue; }
    const desti = new URL(clau, manifest.origin).href;
    if (typeof entrada.title !== 'string' || !entrada.title.trim()) roja('S6', `${servit}: sense títol`);
    if (typeof entrada.description !== 'string' || !entrada.description.trim()) roja('S6', `${servit}: sense descripció`);
    if (entrada.title === generic.title && entrada.description === generic.description) roja('S6', `${servit}: el títol i la descripció són els genèrics del lloc`);
    if (typeof entrada.image?.url !== 'string' || !/^https:\/\//.test(entrada.image.url)) roja('S6', `${servit}: sense imatge absoluta`);
    if (entrada.canonical !== desti) roja('S6', `${servit}: l'adreça de l'entrada no és la de la seua clau`);
  }

  /* S2 · Les exempcions, una a una. */
  const exemptes = new Map(); // patró o camí → exempció
  const destinsExempts = new Set();
  for (const exempcio of exempcions) {
    const on = `exempció ${exempcio?.ruta}`;
    if (!exempcio || typeof exempcio.ruta !== 'string' || !exempcio.ruta.startsWith('/')) { roja('S2', `${on}: sense ruta`); continue; }
    if (exemptes.has(exempcio.ruta)) { roja('S2', `${on}: repetida`); continue; }
    exemptes.set(exempcio.ruta, exempcio);
    if (typeof exempcio.motiu !== 'string' || exempcio.motiu.trim().length < 20) roja('S2', `${on}: el motiu ha de tindre 20 caràcters o més`);
    const ruta = perPatro.get(exempcio.ruta);
    /* Una instància: una adreça concreta que no és cap patró del Router i que servix una ruta paramètrica. */
    const instancia = !ruta && !esPatro(exempcio.ruta) && !patronsVius.has(exempcio.ruta) ? jutjableDe(exempcio.ruta).jutjable : null;
    if (!ruta && !instancia) { roja('S2', `${on}: no casa amb cap ruta viva del Router`); continue; }
    if (instancia && !universos.instancies.some(i => i.cami === exempcio.ruta)) roja('S2', `${on}: una exempció per instància ha de ser d'una instància que visca al repositori`);
    const subjecte = ruta || instancia;
    switch (exempcio.classe) {
      case 'portada':
        if (exempcio.ruta !== '/') roja('S2', `${on}: 'portada' només val per a «/»`);
        break;
      case 'sessio':
        if (!subjecte.guarda) roja('S2', `${on}: 'sessio' exigix una ruta amb RequireAuth`);
        break;
      case 'eina':
        if (indexable(exempcio.ruta)) roja('S2', `${on}: 'eina' exigix un primer tram sense indexar (i «${primerTram(exempcio.ruta)}» és indexable)`);
        break;
      case 'plataforma': {
        const app = /^\/app\/([a-z0-9-]+)\/\*$/.exec(exempcio.ruta);
        if (exempcio.ruta !== '/app/*' && !(app && router.apps.some(a => a.id === app[1]))) roja('S2', `${on}: 'plataforma' és /app/* o una app dels manifests`);
        break;
      }
      case 'redireccio': {
        if (typeof exempcio.desti !== 'string' || !exempcio.desti.startsWith('/')) { roja('S2', `${on}: 'redireccio' exigix el destí declarat`); break; }
        const deduit = ruta ? ruta.redireccio : Object.hasOwn(universos.redireccionsDePagina, exempcio.ruta) ? {desti: universos.redireccionsDePagina[exempcio.ruta]} : null;
        if (!deduit) { roja('S2', `${on}: 'redireccio' exigix un component de redirecció`); break; }
        if (deduit.desti !== null && deduit.desti !== exempcio.desti) roja('S2', `${on}: el destí declarat (${exempcio.desti}) no és el del codi (${deduit.desti})`);
        break;
      }
      case 'pendent':
        if (typeof exempcio.revisio !== 'string' || !exempcio.revisio.trim()) roja('S2', `${on}: 'pendent' exigix una revisió`);
        break;
      default:
        roja('S2', `${on}: classe desconeguda (${exempcio.classe})`);
    }
  }
  for (const exempcio of exemptes.values()) destinsExempts.add(exempcio.ruta);

  /* S1 · Cada ruta, coberta o exempta. */
  const cobertes = [];
  for (const ruta of rutes) {
    const camins = servits.get(ruta.patro) || [];
    const exempcio = exemptes.get(ruta.patro) || null;
    if (camins.length && exempcio) roja('S1', `${ruta.patro}: coberta (${camins[0]}…) i exempta alhora`);
    else if (!camins.length && !exempcio) roja('S1', `${ruta.patro}: ni OpenGraph específic ni exempció declarada (${ruta.fitxer}${ruta.component ? `, ${ruta.component}` : ''})`);
    if (camins.length) cobertes.push({ruta: ruta.patro, camins: camins.length, mostra: camins.slice().sort()[0]});
    /* S4 · Una app pública ha de tindre la seua fila (o cobertura). */
    const app = /^\/app\/([a-z0-9-]+)\/\*$/.exec(ruta.patro);
    if (app && !exempcio && !camins.length) roja('S4', `${ruta.patro}: una app sense fila d'exempció`);
  }

  /* S9 · Una redirecció estàtica a una ruta coberta ha de ser un àlies, no una exempció. */
  for (const exempcio of exemptes.values()) {
    if (exempcio.classe !== 'redireccio' || esPatro(exempcio.ruta) || typeof exempcio.desti !== 'string') continue;
    if (camiServit.has(exempcio.desti)) roja('S9', `exempció ${exempcio.ruta}: el destí ${exempcio.desti} és una ruta coberta; ha de ser un àlies del manifest`);
  }

  /* S8 · Cada instància que viu al repositori: servida o exempta per instància. */
  for (const {cami, familia} of universos.instancies) {
    if (!camiServit.has(cami) && !exemptes.has(cami)) roja('S8', `${cami}: una instància de ${familia} sense head social ni exempció amb motiu`);
  }

  /* S7 · Les famílies de la fitxa pública. */
  for (const familia of router.families) {
    if (!camins.some(c => c.servit.startsWith(`/${familia}/`))) roja('S7', `/${familia}/:id: cap instància de la llavor té head`);
    if (!sintetic) continue;
    const servitsSintetics = new Set(sintetic.camins.map(c => c.servit));
    for (const {slug, id} of sintetic.fitxes) {
      for (const clau of [slug, id]) {
        if (!servitsSintetics.has(`/${familia}/${clau}`)) roja('S7', `/${familia}/${clau}: el productor no dona el camí d'una fitxa del directori (productor desconnectat)`);
      }
    }
  }

  /* S3 · Les dos llistes de rutes sense indexar. */
  const client = new Set(privades.client), servidor = new Set(privades.servidor);
  for (const tram of servidor) if (!client.has(tram)) roja('S3', `«${tram}» és sense indexar al servidor (PRIVATE_ROUTES) i indexable al client (PRIVATE)`);
  const diferenciaDePrivades = [...client].filter(tram => !servidor.has(tram)).sort();

  const llistaExemptes = [...exemptes.values()].map(e => ({ruta: e.ruta, classe: e.classe, motiu: e.motiu, ...(e.desti ? {desti: e.desti} : null), ...(e.revisio ? {revisio: e.revisio} : null)}));
  return {
    cobertes: cobertes.sort((a, b) => a.ruta.localeCompare(b.ruta)),
    exemptes: llistaExemptes.filter(e => e.classe !== 'pendent'),
    pendents: llistaExemptes.filter(e => e.classe === 'pendent'),
    infraccions, diferenciaDePrivades
  };
}

export {patroARegex};
