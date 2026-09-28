/* ═══════════════════════════════════════════════════════════════════
   T47 (ordre del Mestre, 260928) · CUA D'AUTODESAMENT (fora de React)

   El Mestre: «l'H2 s'ha guardat però l'entradilla s'ha esborrat en
   anar-se'n i tornar». Criteri: com Google Docs, «totes les dades s'han
   de desar automàticament sense pèrdues de dades».

   PRINCIPI: el text és de la persona abans que del servidor.
   1. `encua` l'anota de manera SÍNCRONA a la memòria i, en fila, a
      IndexedDB (magatzem.js). Cap petició ix abans que eixa escriptura
      haja aterrat (o fallat).
   2. L'enviament espera una pausa (debounce); el blur, el desmuntatge i
      publicar la salten amb `desaAra`.
   3. Un camp només s'oblida quan el servidor confirma EXACTAMENT la
      versió enviada (com _fieldVersions de GlobalSaveManager). Una tecla
      posterior no es perd mai per una confirmació anterior.
   4. Els enviaments d'un mateix carril van en sèrie. Carril = un camp
      (granularitat 'camp': el Perfil, un PATCH per columna) o tota
      l'entitat (granularitat 'entitat': Notes amb CAS de revisió, T47b).
   5. Cap component React és necessari per a enviar: els escriptors es
      registren a nivell de mòdul i només parlen amb el port (Model B).
   6. Mai s'envia l'esborrany d'A amb la sessió de B: l'àmbit del registre
      (backend + persona) ha de ser el de la sessió viva just abans de la
      petició. Si no ho és, queda pendent sense avís i es repren en la
      pròxima entrada de sessió (`repren`) o quan la sessió es renova
      ('sdp:auth-change').

   Les fallades es classifiquen a errors.js. Cap d'elles esborra el text.
   ═══════════════════════════════════════════════════════════════════ */
import { creaMagatzem } from './magatzem.js';
import { classificaError } from './errors.js';
import { ambitActual } from './ambit.js';

/* Retrocés dels reintents per xarxa: 1 s, 2 s, 4 s… fins a 60 s. */
const RETROCES_MS = Object.freeze([1000, 2000, 4000, 8000, 16000, 32000, 60000]);
/* Tipus d'error que deixen el camp fora dels enviaments fins a una decisió. */
const QUARANTENA = new Set(['columna', 'conflicte']);
/* Tipus d'error que `repren` torna a provar (una migració aplicada, un permís donat). */
const REPRESA = new Set(['columna', 'servidor']);

const congela = (objecte) => Object.freeze(objecte);
const BUIDA = congela({ camps: congela({}), errors: congela({}), estat: 'net', problema: null, persistent: false });

/** La clau d'un registre: àmbit (backend + persona), entitat i id. JSON: cap separador pot col·lidir. */
export const clauDe = ({ ambit, entitat, id }) => JSON.stringify([String(ambit ?? ''), String(entitat ?? ''), String(id ?? '')]);

function errorDeCamp({ tipus, missatge = '', columna = null, llargaria = null, minim = null, maxim = null }) {
  return { tipus, missatge, columna, llargaria, minim, maxim };
}

const mateixError = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

export function creaCua({
  magatzem = creaMagatzem(),
  actorActual = ambitActual,
  debounceMs = 700,
  retrocesMs = RETROCES_MS,
  finestra = typeof window !== 'undefined' ? window : null,
  document: doc = typeof document !== 'undefined' ? document : null,
} = {}) {
  const escriptors = new Map();
  /* Configuració del backend per àmbit. Només en memòria: mai a IndexedDB. */
  const contexts = new Map();
  const carrils = new Map();
  const persistencies = new Map();
  const oients = new Set();
  const oientsConfirmacio = new Set();
  const revisions = new Map();
  const instantanies = new Map();
  /* T47 (correcció de la revisió, 260928) · Àmbits oblidats en eixir: el que
     encara hi arribe (el buidatge en desmuntar d'un editor obert) no torna al
     disc. Una entrada nova de sessió (recordaContext, repren) els allibera. */
  const oblidats = new Set();
  /* T47 (correcció de la revisió C04, 260928) · Un camp amb `baseValor` (el valor
     del servidor que la persona tenia davant quan el va començar a escriure)
     només ix sol si s'ha escrit EN esta càrrega de pàgina. El que ve del disc
     (una sessió anterior, un altre dispositiu mentrestant) espera `verifica`,
     que el compara amb el que el servidor té ara: un esborrany vell no trepitja
     en silenci el que s'ha desat en un altre dispositiu. Només en memòria. */
  const vius = new Map();
  let revisioGlobal = 0;

  /* Es resolen en cada crida: els rellotges falsos de les proves hi arriben. */
  const programaTemps = (accio, ms) => globalThis.setTimeout(accio, ms);
  const anulaTemps = (id) => globalThis.clearTimeout(id);

  function avisa(clau) {
    if (clau == null) revisioGlobal += 1;
    else revisions.set(clau, (revisions.get(clau) || 0) + 1);
    for (const oient of [...oients]) {
      try { oient(); } catch (error) { console.warn('[autodesament] Oient:', error); }
    }
  }

  const perEntitat = (entitat) => escriptors.get(String(entitat))?.granularitat === 'entitat';
  const nomCarril = (clau, entitat, camp) => (perEntitat(entitat) ? clau : `${clau}\u0000${camp}`);

  function carril(clau, entitat, camp) {
    const nom = nomCarril(clau, entitat, camp);
    let actual = carrils.get(nom);
    if (!actual) {
      actual = {
        nom, clau, camp: perEntitat(entitat) ? null : camp,
        temporitzador: null, enVol: null, repeteix: false, enviant: false,
        intents: 0, problema: null, esperes: [],
      };
      carrils.set(nom, actual);
    }
    return actual;
  }

  const marcaViu = (clau, camp) => `${clau}\u0000${camp}`;
  const teBase = (entrada) => entrada != null && Object.hasOwn(entrada, 'baseValor');
  /** Escrit en esta pàgina: la marca coincidix amb la versió i el valor de l'entrada. */
  function esViu(clau, camp, entrada) {
    const marca = vius.get(marcaViu(clau, camp));
    return Boolean(marca) && marca.versio === entrada.versio && marca.valor === entrada.valor;
  }
  const esperaRevisio = (clau, camp, entrada) => teBase(entrada) && !esViu(clau, camp, entrada);
  const anotaViu = (clau, camp, entrada) => { vius.set(marcaViu(clau, camp), { versio: entrada.versio, valor: entrada.valor }); };

  const carrilsDe = (clau) => [...carrils.values()].filter((c) => c.clau === clau);
  const carrilsDelRegistre = (registre, clau = clauDe(registre)) => [
    ...new Set(Object.keys(registre.camps).map((camp) => carril(clau, registre.entitat, camp))),
  ];

  function campsDelCarril(c, registre = magatzem.llig(c.clau)) {
    if (!registre) return [];
    if (c.camp == null) return Object.keys(registre.camps);
    return registre.camps[c.camp] ? [c.camp] : [];
  }

  function desaRegistre(clau, registre) {
    const promesa = registre ? magatzem.desa(clau, registre) : magatzem.esborra(clau);
    persistencies.set(clau, promesa);
    promesa.then(() => { if (persistencies.get(clau) === promesa) persistencies.delete(clau); });
    avisa(clau);
    return promesa;
  }

  function actorSegur(context) {
    try { return actorActual(context); } catch { return null; }
  }

  /* Un error de validació es veu mentre s'escriu (comptador i avís en
     línia). Una quarantena o un conflicte no es desfan per teclejar. */
  function errorEnEncuar(escriptor, camp, valor, anterior) {
    if (anterior?.error && QUARANTENA.has(anterior.error.tipus)) return anterior.error;
    if (!escriptor?.prepara) return null;
    try {
      escriptor.prepara(camp, valor);
      return null;
    } catch (error) {
      return errorDeCamp({ ...classificaError(error), tipus: 'validacio' });
    }
  }

  function marcaErrors(clau, perCamp) {
    const actual = magatzem.llig(clau);
    if (!actual) return;
    const camps = { ...actual.camps };
    let canviat = false;
    for (const [camp, { versio, error }] of Object.entries(perCamp)) {
      /* Una versió més nova ja ha substituït la que ha fallat: mana ella. */
      if (camps[camp]?.versio !== versio || mateixError(camps[camp].error, error)) continue;
      camps[camp] = { ...camps[camp], error };
      canviat = true;
    }
    if (canviat) desaRegistre(clau, { ...actual, camps });
  }

  function programa(c, ms) {
    if (c.temporitzador) anulaTemps(c.temporitzador);
    c.temporitzador = programaTemps(() => {
      c.temporitzador = null;
      void buida(c);
    }, ms);
  }

  /* Buida un carril ja. Torna una promesa que es resol quan el carril
     queda quiet: true si no li queda res pendent, false si sí. */
  function buida(c) {
    if (c.temporitzador) {
      anulaTemps(c.temporitzador);
      c.temporitzador = null;
    }
    const espera = new Promise((resolve) => { c.esperes.push(resolve); });
    if (c.enVol) c.repeteix = true;
    else corre(c);
    return espera;
  }

  function corre(c) {
    c.enVol = executa(c)
      .catch((error) => { console.warn('[autodesament] Desat inesperat:', error); })
      .then(() => {
        c.enVol = null;
        if (c.repeteix) {
          c.repeteix = false;
          corre(c);
          return;
        }
        const queda = campsDelCarril(c).length > 0;
        const esperes = c.esperes.splice(0);
        if (!queda && !c.temporitzador) carrils.delete(c.nom);
        avisa(c.clau);
        for (const resol of esperes) resol(!queda);
      });
  }

  async function executa(c) {
    const registre = magatzem.llig(c.clau);
    const camps = campsDelCarril(c, registre);
    if (!camps.length) { c.problema = null; return; }
    const escriptor = escriptors.get(registre.entitat);
    if (!escriptor) { c.problema = { tipus: 'escriptor' }; return; }
    const context = contexts.get(registre.ambit);
    if (!context || actorSegur(context) !== registre.ambit) { c.problema = { tipus: 'sessio' }; return; }

    const canvis = {};
    const enviats = {};
    const rebutjats = {};
    for (const camp of camps) {
      const entrada = registre.camps[camp];
      if (entrada.error && QUARANTENA.has(entrada.error.tipus)) continue;
      /* C04 · Un esborrany del disc amb base no ix fins que `verifica` l'ha comparat amb el servidor. */
      if (esperaRevisio(c.clau, camp, entrada)) continue;
      let preparat;
      try {
        preparat = escriptor.prepara
          ? escriptor.prepara(camp, entrada.valor, registre)
          : { columna: camp, valor: entrada.valor };
      } catch (error) {
        rebutjats[camp] = { versio: entrada.versio, error: errorDeCamp({ ...classificaError(error), tipus: 'validacio' }) };
        continue;
      }
      canvis[preparat.columna] = preparat.valor;
      enviats[camp] = { versio: entrada.versio, columna: preparat.columna };
    }
    if (Object.keys(rebutjats).length) marcaErrors(c.clau, rebutjats);
    if (!Object.keys(canvis).length) { c.problema = null; return; }

    /* ABANS de cap xarxa: la còpia durable ha d'haver aterrat (o fallat). */
    await persistencies.get(c.clau);
    /* L'espera pot haver durat: oblidat (eixida) o sessió canviada, no ix res. */
    if (!magatzem.llig(c.clau)) return;
    if (actorSegur(context) !== registre.ambit) { c.problema = { tipus: 'sessio' }; return; }

    c.enviant = true;
    avisa(c.clau);
    let resultat;
    try {
      resultat = await escriptor.escriu({
        entitat: registre.entitat, id: registre.id, canvis, context, base: registre.base ?? null,
      });
    } catch (error) {
      c.enviant = false;
      tractaFallada(c, error, enviats);
      return;
    }
    c.enviant = false;
    confirma(c, registre, enviats, canvis, resultat);
  }

  function tractaFallada(c, error, enviats) {
    const classificat = classificaError(error);
    const noms = Object.keys(enviats);
    const perCamp = (tipus, quins = noms) => Object.fromEntries(quins.map((camp) => [
      camp, { versio: enviats[camp].versio, error: errorDeCamp({ ...classificat, tipus }) },
    ]));
    if (classificat.tipus === 'sessio') {
      /* Sense avís: no és cap error de la persona. Es repren en tornar a entrar. */
      c.problema = { tipus: 'sessio' };
      return;
    }
    if (classificat.tipus === 'temporal') {
      c.intents += 1;
      c.problema = { tipus: 'temporal', missatge: classificat.missatge };
      programa(c, retrocesMs[Math.min(c.intents, retrocesMs.length) - 1]);
      return;
    }
    c.problema = null;
    if (classificat.tipus === 'columna') {
      /* Quarantena NOMÉS del camp de la columna que falta; la resta ix de seguida. */
      const afectats = noms.filter((camp) => classificat.columna && enviats[camp].columna === classificat.columna);
      const quarantena = afectats.length ? afectats : (noms.length === 1 ? noms : []);
      if (!quarantena.length) {
        marcaErrors(c.clau, perCamp('servidor'));
        return;
      }
      marcaErrors(c.clau, perCamp('columna', quarantena));
      if (quarantena.length < noms.length) c.repeteix = true;
      return;
    }
    marcaErrors(c.clau, perCamp(classificat.tipus));
  }

  function confirma(c, registre, enviats, canvis, resultat) {
    const actual = magatzem.llig(c.clau);
    if (actual) {
      const camps = { ...actual.camps };
      for (const [camp, { versio }] of Object.entries(enviats)) {
        if (camps[camp]?.versio === versio) delete camps[camp];
      }
      const base = resultat?.revisio ?? actual.base ?? null;
      desaRegistre(c.clau, Object.keys(camps).length ? { ...actual, camps, base } : null);
    }
    c.intents = 0;
    c.problema = null;
    const avis = congela({
      ambit: registre.ambit, entitat: registre.entitat, id: registre.id,
      canvis: congela({ ...canvis }), fila: resultat?.fila ?? null, revisio: resultat?.revisio ?? null,
    });
    for (const oient of [...oientsConfirmacio]) {
      try { oient(avis); } catch (error) { console.warn('[autodesament] Oient de confirmació:', error); }
    }
  }

  /**
   * Anota el valor d'un camp. Síncron a la memòria, en fila a IndexedDB, i
   * l'enviament espera la pausa. `ref` = { ambit, entitat, id, context?, base? }.
   * T47 (C04) · `opcions.baseValor`: el valor del servidor que la persona tenia
   * davant. Només el pren el primer canvi del camp; els següents l'hereten.
   */
  function encua(ref, camp, valor, opcions) {
    if (!ref?.entitat || ref.id == null) throw new Error('[autodesament] encua necessita entitat i id.');
    const ambit = String(ref.ambit ?? '');
    if (oblidats.has(ambit)) return;
    if (ref.context) contexts.set(ambit, ref.context);
    const clau = clauDe(ref);
    const previ = magatzem.llig(clau);
    const anterior = previ?.camps?.[camp];
    if (!anterior || anterior.valor !== valor) {
      const seq = (previ?.seq || 0) + 1;
      let base = {};
      if (anterior) base = teBase(anterior) ? { baseValor: anterior.baseValor } : {};
      else if (opcions && Object.hasOwn(opcions, 'baseValor')) base = { baseValor: opcions.baseValor ?? null };
      const entrada = {
        valor, versio: seq, error: errorEnEncuar(escriptors.get(String(ref.entitat)), camp, valor, anterior), ...base,
      };
      /* Escrit ací: pot eixir sol. Continuar un esborrany del disc que encara
         espera revisió no el dona per revisat. */
      if (!anterior || !esperaRevisio(clau, camp, anterior)) anotaViu(clau, camp, entrada);
      desaRegistre(clau, {
        v: 1, ambit, entitat: String(ref.entitat), id: String(ref.id),
        base: previ?.base ?? ref.base ?? null,
        seq,
        camps: { ...(previ?.camps || {}), [camp]: entrada },
        actualitzat: Date.now(),
      });
    }
    programa(carril(clau, ref.entitat, camp), debounceMs);
  }

  /** Salta la pausa (blur, eixida, publicar). Sense `camp`, tota l'entitat. Mai rebutja. */
  function desaAra(ref, camp) {
    const clau = clauDe(ref);
    const registre = magatzem.llig(clau);
    if (!registre) return Promise.resolve(true);
    const noms = camp != null ? (registre.camps[camp] ? [camp] : []) : Object.keys(registre.camps);
    if (!noms.length) return Promise.resolve(true);
    if (ref.context) contexts.set(registre.ambit, ref.context);
    const quins = [...new Set(noms.map((nom) => carril(clau, registre.entitat, nom)))];
    return Promise.all(quins.map(buida)).then((resultats) => resultats.every(Boolean));
  }

  /** «Tornar al que hi ha desat»: la persona renuncia a l'esborrany d'un camp. */
  function descarta(ref, camp) {
    const clau = clauDe(ref);
    const actual = magatzem.llig(clau);
    if (!actual?.camps?.[camp]) return;
    const camps = { ...actual.camps };
    delete camps[camp];
    const c = carrils.get(nomCarril(clau, actual.entitat, camp));
    if (c?.temporitzador && c.camp != null) {
      anulaTemps(c.temporitzador);
      c.temporitzador = null;
    }
    desaRegistre(clau, Object.keys(camps).length ? { ...actual, camps } : null);
  }

  /**
   * D01 (Notes, T47b) · La persona tria conservar el seu esborrany damunt d'una
   * revisió remota més nova: només es mou la base del CAS i es lleva el
   * conflicte; els camps no es toquen i ixen de seguida.
   */
  function rebasa(ref, revisio) {
    const clau = clauDe(ref);
    const actual = magatzem.llig(clau);
    if (!actual) return Promise.resolve(true);
    const camps = Object.fromEntries(Object.entries(actual.camps).map(([camp, entrada]) => [
      camp, entrada.error?.tipus === 'conflicte' ? { ...entrada, error: null } : entrada,
    ]));
    desaRegistre(clau, { ...actual, camps, base: revisio });
    return desaAra(ref);
  }

  /** «Tornar a provar» un camp que el servidor ha rebutjat per permís o columna. */
  function reintenta(ref, camp) {
    const clau = clauDe(ref);
    const actual = magatzem.llig(clau);
    const entrada = actual?.camps?.[camp];
    if (entrada?.error && entrada.error.tipus !== 'validacio') {
      desaRegistre(clau, { ...actual, camps: { ...actual.camps, [camp]: { ...entrada, error: null } } });
    }
    return desaAra(ref, camp);
  }

  /**
   * T47 (correcció de la revisió C04, 260928) · En obrir la fitxa amb dades
   * fresques del servidor. `servidor` = { camp: valor tal com es desaria }.
   * Cada camp que espera revisió (esborrany del disc amb `baseValor`):
   *   · el servidor ja té el mateix valor → l'esborrany ja no fa falta;
   *   · la base coincidix amb el servidor → ningú no l'ha tocat: ix;
   *   · si no, conflicte: «Hi ha una versió més nova al servidor». La persona
   *     tria «Conservar el meu» (conserva) o «Tornar al que hi ha desat» (descarta).
   * Torna una promesa: true si no queda res pendent dels camps revisats.
   */
  function verifica(ref, servidor = {}) {
    const clau = clauDe(ref);
    const actual = magatzem.llig(clau);
    if (!actual) return Promise.resolve(true);
    if (ref.context) contexts.set(actual.ambit, ref.context);
    const escriptor = escriptors.get(actual.entitat);
    const camps = { ...actual.camps };
    const surten = [];
    let canviat = false;
    for (const [camp, entrada] of Object.entries(actual.camps)) {
      if (!esperaRevisio(clau, camp, entrada) || !Object.hasOwn(servidor, camp)) continue;
      if (entrada.error?.tipus === 'conflicte') continue;
      const ara = servidor[camp] ?? null;
      let meu;
      try { meu = escriptor?.prepara ? escriptor.prepara(camp, entrada.valor, actual).valor : entrada.valor; } catch { meu = undefined; }
      if (meu !== undefined && meu === ara) {
        delete camps[camp];
        canviat = true;
      } else if (ara === entrada.baseValor) {
        anotaViu(clau, camp, entrada);
        surten.push(camp);
      } else {
        camps[camp] = { ...entrada, error: errorDeCamp({ tipus: 'conflicte', missatge: 'Hi ha una versió més nova al servidor.' }) };
        canviat = true;
      }
    }
    if (canviat) desaRegistre(clau, Object.keys(camps).length ? { ...actual, camps } : null);
    return Promise.all(surten.map((camp) => desaAra(ref, camp))).then((resultats) => resultats.every(Boolean));
  }

  /**
   * C04 · «Conservar el meu»: la persona tria el seu esborrany damunt del valor
   * que ara té el servidor. La base passa a ser eixe valor, el conflicte es
   * lleva i el camp ix de seguida.
   */
  function conserva(ref, camp, baseValor) {
    const clau = clauDe(ref);
    const actual = magatzem.llig(clau);
    const entrada = actual?.camps?.[camp];
    if (!entrada) return Promise.resolve(true);
    const nova = { ...entrada, error: entrada.error?.tipus === 'conflicte' ? null : entrada.error, baseValor: baseValor ?? null };
    anotaViu(clau, camp, nova);
    desaRegistre(clau, { ...actual, camps: { ...actual.camps, [camp]: nova } });
    return desaAra(ref, camp);
  }

  /**
   * T47 (correcció de la revisió C01, 260928) · El que d'un àmbit el servidor
   * encara no té: [{ entitat, id, camps }] (noms de camp). Per a l'avís
   * d'eixida: el que no ha eixit es diu abans d'esborrar-lo.
   */
  function pendentsDe(ambit) {
    const objectiu = String(ambit ?? '');
    return magatzem.llista()
      .filter((registre) => registre?.ambit === objectiu && Object.keys(registre.camps || {}).length)
      .map((registre) => congela({ entitat: registre.entitat, id: registre.id, camps: congela(Object.keys(registre.camps)) }));
  }

  /**
   * Torna a enviar el que queda pendent (d'un àmbit, o de tots): en
   * arrencar, en cada entrada de sessió i en obrir la fitxa. Les
   * quarantenes de columna i els errors de permís es tornen a provar.
   * C04 · Un esborrany del disc amb `baseValor` no ix d'ací: espera `verifica`.
   */
  function repren(ambit) {
    if (ambit != null) oblidats.delete(String(ambit));
    for (const registre of magatzem.llista()) {
      if (ambit != null && registre.ambit !== ambit) continue;
      const clau = clauDe(registre);
      const camps = {};
      let canviat = false;
      for (const [camp, entrada] of Object.entries(registre.camps)) {
        if (entrada.error && REPRESA.has(entrada.error.tipus)) {
          camps[camp] = { ...entrada, error: null };
          canviat = true;
        } else camps[camp] = entrada;
      }
      const viu = canviat ? { ...registre, camps } : registre;
      if (canviat) desaRegistre(clau, viu);
      for (const c of carrilsDelRegistre(viu, clau)) {
        c.intents = 0;
        void buida(c);
      }
    }
  }

  /** En amagar-se la pestanya, en tancar-la o en tornar la xarxa: tot el pendent ix ja. */
  function buidaTot() {
    for (const registre of magatzem.llista()) {
      for (const c of carrilsDelRegistre(registre)) void buida(c);
    }
  }

  /* T47 (ordre del Mestre, 260928) · La sessió ha canviat de mans o s'ha
     renovat ('sdp:auth-change', el que emet identitat/l'adaptador en desar-la).
     Amb el JWT caducat, el port diu «ningú» fins que la renovació aterra: el
     que es va quedar esperant eixa finestra torna a eixir ara, sense esperar
     una altra tecla. Només els carrils que esperaven sessió: cap altre pendent
     es buida abans de la pausa. La comprovació d'àmbit es repetix dins
     d'executa: la sessió de B no envia mai el text d'A. */
  function reprenEsperaDeSessio() {
    for (const c of [...carrils.values()]) {
      if (c.problema?.tipus === 'sessio') void buida(c);
    }
  }

  /**
   * T47 (correcció de la revisió, 260928) · L'intent final d'eixir: tot el
   * pendent d'un àmbit ix ja (també el que només era al disc). Es resol quan
   * els carrils queden quiets: true si el servidor ho té tot. Mai rebutja.
   */
  function enviaAmbit(ambit) {
    const objectiu = String(ambit ?? '');
    return Promise.resolve(magatzem.hidrata()).catch(() => {}).then(() => {
      const quins = magatzem.llista().filter((registre) => registre.ambit === objectiu);
      return Promise.all(quins.map((registre) => desaAra(registre)));
    }).then((resultats) => resultats.every(Boolean), () => false);
  }

  /**
   * Eixir: els esborranys d'eixe àmbit s'obliden d'este dispositiu, de la
   * memòria i d'IndexedDB (per àmbit, no per la cau d'esta pestanya: T47,
   * correcció de la revisió). La promesa diu quan ha aterrat l'esborrat: qui
   * recarrega la pàgina després l'ha d'esperar.
   */
  function oblida(ambit) {
    const objectiu = String(ambit ?? '');
    oblidats.add(objectiu);
    const claus = new Set(magatzem.llista().filter((registre) => registre.ambit === objectiu).map(clauDe));
    for (const c of carrils.values()) {
      let delAmbit = claus.has(c.clau);
      if (!delAmbit) { try { delAmbit = JSON.parse(c.clau)[0] === objectiu; } catch { delAmbit = false; } }
      if (!delAmbit) continue;
      claus.add(c.clau);
      if (c.temporitzador) {
        anulaTemps(c.temporitzador);
        c.temporitzador = null;
      }
      c.problema = null;
      c.intents = 0;
    }
    /* C04 · Les marques de «escrit en esta pàgina» porten el text: també se'n van. */
    for (const marca of [...vius.keys()]) {
      const clau = marca.slice(0, marca.lastIndexOf('\u0000'));
      let delAmbit = claus.has(clau);
      if (!delAmbit) { try { delAmbit = JSON.parse(clau)[0] === objectiu; } catch { delAmbit = false; } }
      if (delAmbit) vius.delete(marca);
    }
    let esborrat;
    if (typeof magatzem.esborraAmbit === 'function') esborrat = magatzem.esborraAmbit(objectiu);
    else esborrat = Promise.all([...claus].map((clau) => magatzem.esborra(clau))).then((fets) => fets.every(Boolean));
    for (const clau of claus) {
      persistencies.set(clau, esborrat);
      avisa(clau);
    }
    esborrat.then(() => { for (const clau of claus) if (persistencies.get(clau) === esborrat) persistencies.delete(clau); });
    contexts.delete(objectiu);
    return esborrat;
  }

  function registraEscriptor(entitat, escriptor) {
    if (typeof escriptor?.escriu !== 'function') throw new TypeError('[autodesament] Un escriptor necessita escriu().');
    escriptors.set(String(entitat), escriptor);
    /* El que esperava este escriptor (esborranys d'abans d'arrencar) ja pot eixir. */
    for (const registre of magatzem.llista()) {
      if (registre.entitat === String(entitat)) {
        for (const c of carrilsDelRegistre(registre)) void buida(c);
      }
    }
  }

  function instantania(clau) {
    const rev = revisions.get(clau) || 0;
    const desada = instantanies.get(clau);
    if (desada && desada.rev === rev && desada.global === revisioGlobal && desada.persistent === magatzem.persistent) {
      return desada.valor;
    }
    const registre = magatzem.llig(clau);
    const camps = {};
    const errors = {};
    for (const [camp, entrada] of Object.entries(registre?.camps || {})) {
      camps[camp] = entrada.valor;
      if (entrada.error) errors[camp] = congela({ ...entrada.error });
    }
    const quins = carrilsDe(clau);
    const temporal = quins.find((c) => c.problema?.tipus === 'temporal');
    let estat = 'net';
    if (Object.keys(errors).length || temporal) estat = 'error';
    else if (quins.some((c) => c.enviant)) estat = 'enviant';
    else if (Object.keys(camps).length) estat = quins.some((c) => c.problema) ? 'sessio' : 'pendent';
    const valor = congela({
      camps: congela(camps), errors: congela(errors), estat,
      problema: temporal ? congela({ ...temporal.problema }) : null,
      persistent: magatzem.persistent,
    });
    instantanies.set(clau, { rev, global: revisioGlobal, persistent: magatzem.persistent, valor });
    return valor;
  }

  if (finestra?.addEventListener) {
    finestra.addEventListener('online', buidaTot);
    finestra.addEventListener('pagehide', buidaTot);
    finestra.addEventListener('sdp:auth-change', reprenEsperaDeSessio);
  }
  if (doc?.addEventListener) {
    /* Amagada, el navegador la pot matar: ix tot ja. Visible de nou: el
       que havia fallat per xarxa es torna a provar sense esperar el retrocés. */
    doc.addEventListener('visibilitychange', buidaTot);
  }

  return {
    clauDe,
    encua,
    desaAra,
    descarta,
    reintenta,
    rebasa,
    verifica,
    conserva,
    repren,
    buidaTot,
    enviaAmbit,
    pendentsDe,
    oblida,
    registraEscriptor,
    /** La configuració viva d'un àmbit (en memòria, mai a disc). Una entrada de sessió nova. */
    recordaContext(ambit, context) {
      if (ambit == null) return;
      oblidats.delete(String(ambit));
      if (context) contexts.set(String(ambit), context);
    },
    /** Porta a memòria els esborranys d'una sessió anterior (IndexedDB). Mai rebutja. */
    hidrata: () => magatzem.hidrata().then(() => avisa(null)),
    /** Instantània estable per a useSyncExternalStore: { camps, errors, estat, problema, persistent }. */
    llig: (ref) => (ref ? instantania(clauDe(ref)) : BUIDA),
    instantania,
    subscriu(oient) {
      oients.add(oient);
      return () => { oients.delete(oient); };
    },
    /** Cada confirmació del servidor: { ambit, entitat, id, canvis (per columna), fila, revisio }. */
    quanConfirma(oient) {
      oientsConfirmacio.add(oient);
      return () => { oientsConfirmacio.delete(oient); };
    },
    get persistent() { return magatzem.persistent; },
    /** Per a les proves: oblida-ho tot (els escriptors i els oients es queden). */
    reinicia() {
      for (const c of carrils.values()) {
        if (c.temporitzador) anulaTemps(c.temporitzador);
        for (const resol of c.esperes.splice(0)) resol(false);
      }
      carrils.clear();
      contexts.clear();
      oblidats.clear();
      vius.clear();
      persistencies.clear();
      instantanies.clear();
      revisions.clear();
      const buidat = magatzem.buida();
      avisa(null);
      return buidat;
    },
  };
}

export const BUIDA_AUTODESAMENT = BUIDA;

/** La cua de l'aplicació: una per pestanya. */
export const cuaDesament = creaCua();
