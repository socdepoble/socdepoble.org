/* Suport de proves: un FileSystemDirectoryHandle fals en memòria per al
   Gestor d'arxius locals (IDEA-54/55 · Onada 261029_1605), fora de src/
   (LLEI_08 de src/sections/tractors/clausura.test.js: el suport de proves viu a
   tests/helpers/). És l'ÚNIC doble de carpeta local: el fan servir les proves
   del motor i les de la interfície.

   Què fa, com el navegador:
     · CarpetaFalsa: entries(), values(), keys(), getDirectoryHandle(nom,
       { create }), getFileHandle(nom, { create }) amb NotFoundError i
       TypeMismatchError, removeEntry(nom, { recursive }) amb
       InvalidModificationError si la carpeta no és buida, isSameEntry,
       queryPermission i requestPermission (el permís és de tot l'arbre: es
       comparteix des de l'arrel, i el readwrite concedit també val per a read).
     · FitxerFals: getFile() torna un File real (instantània: si el fitxer
       canvia després, la instantània conserva les dades velles), amb
       arrayBuffer() i stream() instrumentats; createWritable() escriu en una
       còpia de treball que només substituïx el contingut en close() i que
       abort() descarta.
     · `insensible: true` a l'arrel fa que els noms es busquen com al disc del
       Mac (APFS): sense majúscules i en NFC. «Foto.JPG» troba «foto.jpg».
   Instruments (tots a l'arrel, compartits per tot l'arbre):
     · `registre`: cada crida, com a ['getFileHandle', ruta, { create }],
       ['removeEntry', ruta, { recursive }], ['createWritable', ruta],
       ['write', ruta, mida], ['escriu', ruta, mida] (el close que desa),
       ['abort', ruta], ['getFile', ruta], ['stream', ruta], ['arrayBuffer', ruta],
       ['entries', ruta], ['query', mode], ['request', mode]…
     · `consultes` i `peticions`: els modes de queryPermission i requestPermission.
     · `injectaFallada(operacio, { ruta, error, vegades })`: fa fallar una
       operació (getFile, arrayBuffer, stream, createWritable, write, close,
       removeEntry, getDirectoryHandle, getFileHandle, entries, query,
       request). `ruta` és un text exacte, una RegExp o una funció; sense ruta,
       totes.
     · `corrompEscriptura({ ruta, mode: 'trunca'|'altera', vegades })`: el close
       desa uns bytes diferents dels escrits (la verificació ho ha de veure).
     · `enLlegirTros({ fitxer, ruta, index })`: es crida després de lliurar
       cada tros d'un stream (p. ex. per a editar el fitxer «des de fora» a mitja
       còpia, com Obsidian). `midaTros` fixa la mida dels trossos.
     · `lecturaEstricta` (per fitxer o a l'arrel): llegir una instantània d'un
       fitxer que ha canviat dona NotReadableError, com Chrome.
   Res d'ací no és codi de producció: només l'importen les proves. */

export const MODIFICAT_FALS = Date.UTC(2026, 9, 29);
export const MIDA_TROS_FALS = 64 * 1024;

const errorDom = (nom, missatge = nom) => new DOMException(missatge, nom);
const clauNom = (nom) => String(nom).normalize('NFC').toLowerCase();

const ERRORS_PER_DEFECTE = Object.freeze({
  getFile: 'NotReadableError',
  arrayBuffer: 'NotReadableError',
  stream: 'NotReadableError',
  createWritable: 'NotAllowedError',
  write: 'QuotaExceededError',
  close: 'AbortError',
  llegeixTros: 'NotReadableError',
  removeEntry: 'NoModificationAllowedError',
  getDirectoryHandle: 'NotAllowedError',
  getFileHandle: 'NotAllowedError',
  entries: 'NotAllowedError',
  query: 'SecurityError',
  request: 'SecurityError'
});

const TIPUS_PER_EXTENSIO = Object.freeze({
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif',
  svg: 'image/svg+xml', avif: 'image/avif', html: 'text/html', htm: 'text/html', txt: 'text/plain',
  md: 'text/markdown', json: 'application/json', csv: 'text/csv', js: 'text/javascript',
  css: 'text/css', xml: 'text/xml', pdf: 'application/pdf', mp3: 'audio/mpeg', wav: 'audio/wav',
  mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime'
});

function tipusDe(nom) {
  const punt = nom.lastIndexOf('.');
  return punt > 0 ? TIPUS_PER_EXTENSIO[nom.slice(punt + 1).toLowerCase()] ?? '' : '';
}

const codificador = new TextEncoder();

/** Bytes d'un contingut de prova (text, Uint8Array, vista o ArrayBuffer), sempre una còpia. */
export function bytesFals(contingut) {
  if (typeof contingut === 'string') return codificador.encode(contingut);
  if (ArrayBuffer.isView(contingut)) {
    return new Uint8Array(contingut.buffer.slice(contingut.byteOffset, contingut.byteOffset + contingut.byteLength));
  }
  if (Object.prototype.toString.call(contingut) === '[object ArrayBuffer]') return new Uint8Array(contingut.slice(0));
  return new Uint8Array(0);
}

/** Un PNG de prova: la signatura i `extra` bytes de farciment (valor `farciment`). */
export function bytesPngFals(extra = 32, farciment = 7) {
  const b = new Uint8Array(8 + extra).fill(farciment);
  b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  return b;
}

/** Un JPEG de prova (FF D8 FF … FF D9). */
export function bytesJpegFals(extra = 32, farciment = 9) {
  const b = new Uint8Array(5 + extra).fill(farciment);
  b.set([0xff, 0xd8, 0xff], 0);
  b.set([0xff, 0xd9], b.length - 2);
  return b;
}

/** Un WebP de prova: 'RIFF' · mida · 'WEBP' i `extra` bytes. */
export function bytesWebpFals(extra = 16, farciment = 3) {
  const b = new Uint8Array(12 + extra).fill(farciment);
  b.set([0x52, 0x49, 0x46, 0x46], 0);
  new DataView(b.buffer).setUint32(4, b.length - 8, true);
  b.set([0x57, 0x45, 0x42, 0x50], 8);
  return b;
}

/** Un PDF de prova mínim. */
export const bytesPdfFals = () => codificador.encode('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n');

function estatNou({ permisos, demanats, insensible, midaTros, lecturaEstricta }) {
  return {
    registre: [],
    consultes: [],
    peticions: [],
    permisos: { read: 'granted', readwrite: 'granted', ...permisos },
    demanats: { read: 'granted', readwrite: 'granted', ...demanats },
    insensible: insensible === true,
    midaTros: Number.isSafeInteger(midaTros) && midaTros > 0 ? midaTros : MIDA_TROS_FALS,
    lecturaEstricta: lecturaEstricta === true,
    fallades: [],
    corrupcions: [],
    enLlegirTros: null
  };
}

const coincidix = (patro, ruta) => {
  if (patro === undefined || patro === null) return true;
  if (typeof patro === 'string') return patro === ruta;
  if (patro instanceof RegExp) return patro.test(ruta);
  if (typeof patro === 'function') return Boolean(patro(ruta));
  return false;
};

/* Si hi ha una fallada injectada per a l'operació i la ruta, la gasta i la llança. */
function potFallar(estat, operacio, ruta) {
  const fallada = estat.fallades.find((f) => f.operacio === operacio && f.vegades > 0 && coincidix(f.ruta, ruta));
  if (!fallada) return;
  fallada.vegades -= 1;
  throw fallada.error ?? errorDom(ERRORS_PER_DEFECTE[operacio] ?? 'UnknownError', `${operacio} (simulat)`);
}

function nomValid(nom) {
  if (typeof nom !== 'string' || nom === '' || nom === '.' || nom === '..' || nom.includes('/') || nom.includes('\\')) {
    throw new TypeError(`Nom no vàlid: ${String(nom)}`);
  }
}

class NodeFals {
  constructor(nom) {
    this.name = nom;
    this.pare = null;
    this.estatPropi = null;
  }

  /* L'estat compartit és el de l'arrel. */
  get estat() {
    let node = this;
    while (node.pare) node = node.pare;
    if (!node.estatPropi) node.estatPropi = estatNou({});
    return node.estatPropi;
  }

  get ruta() {
    const segs = [];
    let node = this;
    while (node.pare) {
      segs.unshift(node.name);
      node = node.pare;
    }
    return segs.join('/');
  }

  get registre() { return this.estat.registre; }
  get consultes() { return this.estat.consultes; }
  get peticions() { return this.estat.peticions; }

  apunta(...entrada) {
    this.estat.registre.push(entrada);
  }

  /** Fa fallar una operació (vegeu la capçalera). */
  injectaFallada(operacio, { ruta = null, error = null, vegades = Infinity } = {}) {
    this.estat.fallades.push({ operacio, ruta, error, vegades });
    return this;
  }

  /** Fa que el close de l'escriptura desi uns bytes diferents ('trunca' o 'altera'). */
  corrompEscriptura({ ruta = null, mode = 'trunca', vegades = Infinity } = {}) {
    this.estat.corrupcions.push({ ruta, mode, vegades });
    return this;
  }

  set enLlegirTros(funcio) { this.estat.enLlegirTros = funcio; }
  get enLlegirTros() { return this.estat.enLlegirTros; }
  set midaTros(mida) { this.estat.midaTros = mida; }
  get midaTros() { return this.estat.midaTros; }
  set lecturaEstricta(valor) { this.estat.lecturaEstricta = valor === true; }
  get lecturaEstricta() { return this.estat.lecturaEstricta; }
  get permisos() { return this.estat.permisos; }
  get demanats() { return this.estat.demanats; }

  async queryPermission({ mode = 'read' } = {}) {
    const estat = this.estat;
    estat.consultes.push(mode);
    this.apunta('query', mode);
    potFallar(estat, 'query', mode);
    if (mode === 'read' && estat.permisos.readwrite === 'granted') return 'granted';
    return estat.permisos[mode] ?? 'prompt';
  }

  async requestPermission({ mode = 'read' } = {}) {
    const estat = this.estat;
    estat.peticions.push(mode);
    this.apunta('request', mode);
    potFallar(estat, 'request', mode);
    const valor = estat.demanats[mode] ?? 'denied';
    if (valor instanceof Error) throw valor;
    if (valor === 'granted') estat.permisos[mode] = 'granted';
    return valor;
  }
}

export class FitxerFals extends NodeFals {
  /**
   * @param {string} nom
   * @param {string|Uint8Array|ArrayBuffer} contingut
   * @param {{ modificat?: number, fallaLectura?: boolean, fallaEscriptura?: boolean, lecturaEstricta?: boolean, midaTros?: number }} [opcions]
   */
  constructor(nom, contingut = '', { modificat = MODIFICAT_FALS, fallaLectura = false, fallaEscriptura = false, lecturaEstricta = null, midaTros = null } = {}) {
    super(nom);
    this.kind = 'file';
    this.contingut = bytesFals(contingut);
    this.modificat = modificat;
    this.versio = 0;
    this.fallaLectura = fallaLectura;
    this.fallaEscriptura = fallaEscriptura;
    this.lecturaEstrictaPropia = lecturaEstricta;
    this.midaTrosPropia = midaTros;
    this.lectures = 0;
    this.lecturesStream = 0;
    this.trossosLliurats = 0;
    this.avortat = false;
    this.escriptures = 0;
  }

  get text() {
    return new TextDecoder().decode(this.contingut);
  }

  /** Com si un altre programa (Obsidian, una IA) el desara: contingut nou i data nova. */
  modificaDesDeFora(contingut = null, { modificat = null } = {}) {
    if (contingut !== null) this.contingut = bytesFals(contingut);
    this.modificat = Number.isFinite(modificat) ? modificat : this.modificat + 1000;
    this.versio += 1;
  }

  async isSameEntry(altre) {
    return altre === this;
  }

  async getFile() {
    const estat = this.estat;
    const ruta = this.ruta;
    this.apunta('getFile', ruta);
    if (this.fallaLectura) throw errorDom('NotReadableError', 'Lectura fallida (simulada).');
    potFallar(estat, 'getFile', ruta);
    const dades = new Uint8Array(this.contingut);
    const versio = this.versio;
    const fitxer = new File([dades], this.name, { lastModified: this.modificat, type: tipusDe(this.name) });
    const node = this;
    const estricta = () => (node.lecturaEstrictaPropia ?? estat.lecturaEstricta) === true;
    const comprova = () => {
      if (estricta() && node.versio !== versio) throw errorDom('NotReadableError', 'El fitxer ha canviat des de la instantània.');
    };
    Object.defineProperty(fitxer, 'arrayBuffer', {
      configurable: true,
      value: async () => {
        node.lectures += 1;
        node.apunta('arrayBuffer', ruta);
        potFallar(estat, 'arrayBuffer', ruta);
        comprova();
        return dades.buffer.slice(dades.byteOffset, dades.byteOffset + dades.byteLength);
      }
    });
    Object.defineProperty(fitxer, 'stream', {
      configurable: true,
      value: () => {
        node.lecturesStream += 1;
        node.apunta('stream', ruta);
        potFallar(estat, 'stream', ruta);
        const mida = node.midaTrosPropia ?? estat.midaTros;
        let posicio = 0;
        let index = 0;
        let tancat = false;
        let bloquejat = false;
        const lector = {
          async read() {
            if (tancat) return { done: true, value: undefined };
            comprova();
            potFallar(estat, 'stream', ruta);
            if (posicio >= dades.byteLength) {
              tancat = true;
              return { done: true, value: undefined };
            }
            const tros = dades.slice(posicio, posicio + mida);
            posicio += tros.byteLength;
            const actual = index;
            index += 1;
            node.trossosLliurats += 1;
            if (typeof estat.enLlegirTros === 'function') estat.enLlegirTros({ fitxer: node, ruta, index: actual });
            return { done: false, value: tros };
          },
          async cancel() {
            tancat = true;
          },
          releaseLock() {
            bloquejat = false;
          }
        };
        return {
          getReader() {
            if (bloquejat) throw new TypeError('El stream ja té un lector.');
            bloquejat = true;
            return lector;
          }
        };
      }
    });
    /* Afegit pel carril MOTOR (QA-A02 · Onada 261029_1605): la lectura per trossos
       `slice(inici, fi).arrayBuffer()` amb què el motor verifica una còpia, instrumentada
       com la resta: ['llegeixTros', ruta, inici, fi] al registre, `injectaFallada('llegeixTros')`
       i la lectura estricta. El Blob del tros és el de veres (tipus i mida inclosos). */
    const sliceDeVeres = fitxer.slice.bind(fitxer);
    const limita = (valor, perDefecte) => {
      if (valor === undefined) return perDefecte;
      const n = Math.trunc(Number(valor)) || 0;
      return n < 0 ? Math.max(dades.byteLength + n, 0) : Math.min(n, dades.byteLength);
    };
    Object.defineProperty(fitxer, 'slice', {
      configurable: true,
      value: (inici, fi, tipus) => {
        const tros = sliceDeVeres(inici, fi, tipus);
        const a = limita(inici, 0);
        const b = Math.max(a, limita(fi, dades.byteLength));
        Object.defineProperty(tros, 'arrayBuffer', {
          configurable: true,
          value: async () => {
            node.apunta('llegeixTros', ruta, a, b);
            potFallar(estat, 'llegeixTros', ruta);
            comprova();
            return dades.buffer.slice(dades.byteOffset + a, dades.byteOffset + b);
          }
        });
        return tros;
      }
    });
    return fitxer;
  }

  async createWritable({ keepExistingData = false } = {}) {
    const estat = this.estat;
    const ruta = this.ruta;
    this.apunta('createWritable', ruta);
    potFallar(estat, 'createWritable', ruta);
    const node = this;
    let treball = keepExistingData ? [new Uint8Array(this.contingut)] : [];
    let obert = true;
    return {
      async write(dades) {
        if (!obert) throw new TypeError('L’escriptor ja està tancat.');
        const valor = dades && typeof dades === 'object' && dades.type === 'write' ? dades.data : dades;
        const bytes = valor && typeof valor.arrayBuffer === 'function' && !ArrayBuffer.isView(valor)
          ? new Uint8Array(await valor.arrayBuffer())
          : bytesFals(valor);
        node.apunta('write', ruta, bytes.byteLength);
        if (node.fallaEscriptura) throw errorDom('QuotaExceededError', 'Sense espai (simulat).');
        potFallar(estat, 'write', ruta);
        treball.push(bytes);
      },
      async close() {
        if (!obert) throw new TypeError('L’escriptor ja està tancat.');
        node.apunta('close', ruta);
        try {
          potFallar(estat, 'close', ruta);
        } catch (error) {
          obert = false;
          treball = [];
          throw error;
        }
        obert = false;
        const total = treball.reduce((n, t) => n + t.byteLength, 0);
        let final = new Uint8Array(total);
        let posicio = 0;
        for (const t of treball) {
          final.set(t, posicio);
          posicio += t.byteLength;
        }
        const corrupcio = estat.corrupcions.find((c) => c.vegades > 0 && coincidix(c.ruta, ruta));
        if (corrupcio) {
          corrupcio.vegades -= 1;
          if (corrupcio.mode === 'altera' && final.byteLength > 0) final[final.byteLength - 1] ^= 0xff;
          else final = final.slice(0, Math.max(0, final.byteLength - 1));
        }
        node.contingut = final;
        node.modificat += 1;
        node.versio += 1;
        node.escriptures += 1;
        node.apunta('escriu', ruta, final.byteLength);
      },
      async abort() {
        obert = false;
        treball = [];
        node.avortat = true;
        node.apunta('abort', ruta);
      }
    };
  }
}

export class CarpetaFalsa extends NodeFals {
  /**
   * @param {string} nom
   * @param {Record<string, string|Uint8Array|object|FitxerFals|CarpetaFalsa>} [fills]
   * @param {{ permisos?: object, demanats?: object, fallaRecorregut?: boolean, identitat?: string,
   *   insensible?: boolean, midaTros?: number, lecturaEstricta?: boolean }} [opcions]
   */
  constructor(nom, fills = {}, {
    permisos = {}, demanats = {}, fallaRecorregut = false, identitat = null,
    insensible = false, midaTros = null, lecturaEstricta = false
  } = {}) {
    super(nom);
    this.kind = 'directory';
    this.fills = new Map();
    this.fallaRecorregut = fallaRecorregut;
    this.identitatPropia = identitat;
    this.estatPropi = estatNou({ permisos, demanats, insensible, midaTros, lecturaEstricta });
    for (const [nomFill, valor] of Object.entries(fills ?? {})) this.afig(nomFill, valor);
  }

  /** Un altre objecte amb la mateixa identitat és «la mateixa carpeta» (com un handle recuperat de la base). */
  get identitat() {
    if (this.identitatPropia !== null && this.identitatPropia !== undefined) return this.identitatPropia;
    return this.pare ? `${this.pare.identitat}/${this.name}` : this.name;
  }

  /** Afig un fill: text o bytes → FitxerFals; objecte → CarpetaFalsa; instàncies tal qual. */
  afig(nom, valor) {
    let node;
    if (valor instanceof NodeFals) {
      node = valor;
      node.name = nom;
    } else if (typeof valor === 'string' || ArrayBuffer.isView(valor) || Object.prototype.toString.call(valor) === '[object ArrayBuffer]') {
      node = new FitxerFals(nom, valor);
    } else {
      node = new CarpetaFalsa(nom, valor ?? {});
    }
    node.pare = this;
    node.estatPropi = null;
    this.fills.set(nom, node);
    return node;
  }

  /* El fill per nom: exacte, o (amb `insensible`) com el disc del Mac. */
  fill(nom) {
    if (this.fills.has(nom)) return { nom, node: this.fills.get(nom) };
    if (this.estat.insensible) {
      const clau = clauNom(nom);
      for (const [nomReal, node] of this.fills) if (clauNom(nomReal) === clau) return { nom: nomReal, node };
    }
    return null;
  }

  async isSameEntry(altre) {
    return altre instanceof CarpetaFalsa && altre.identitat === this.identitat;
  }

  async *entries() {
    const ruta = this.ruta;
    this.apunta('entries', ruta);
    if (this.fallaRecorregut) throw errorDom('NotAllowedError', 'Sense permís de lectura (simulat).');
    potFallar(this.estat, 'entries', ruta);
    for (const [nom, node] of [...this.fills]) yield [nom, node];
  }

  async *values() {
    for await (const [, node] of this.entries()) yield node;
  }

  async *keys() {
    for await (const [nom] of this.entries()) yield nom;
  }

  [Symbol.asyncIterator]() {
    return this.entries();
  }

  async getDirectoryHandle(nom, { create = false } = {}) {
    const rutaFill = this.ruta ? `${this.ruta}/${nom}` : String(nom);
    this.apunta('getDirectoryHandle', rutaFill, { create: Boolean(create) });
    nomValid(nom);
    potFallar(this.estat, 'getDirectoryHandle', rutaFill);
    const trobat = this.fill(nom);
    if (trobat) {
      if (trobat.node.kind !== 'directory') throw errorDom('TypeMismatchError', `«${rutaFill}» és un fitxer.`);
      return trobat.node;
    }
    if (!create) throw errorDom('NotFoundError', `No hi ha «${rutaFill}».`);
    return this.afig(nom, {});
  }

  async getFileHandle(nom, { create = false } = {}) {
    const rutaFill = this.ruta ? `${this.ruta}/${nom}` : String(nom);
    this.apunta('getFileHandle', rutaFill, { create: Boolean(create) });
    nomValid(nom);
    potFallar(this.estat, 'getFileHandle', rutaFill);
    const trobat = this.fill(nom);
    if (trobat) {
      if (trobat.node.kind !== 'file') throw errorDom('TypeMismatchError', `«${rutaFill}» és una carpeta.`);
      return trobat.node;
    }
    if (!create) throw errorDom('NotFoundError', `No hi ha «${rutaFill}».`);
    const nou = this.afig(nom, new FitxerFals(nom, ''));
    nou.modificat = MODIFICAT_FALS;
    return nou;
  }

  async removeEntry(nom, opcions = {}) {
    const recursive = Boolean(opcions?.recursive);
    const rutaFill = this.ruta ? `${this.ruta}/${nom}` : String(nom);
    this.apunta('removeEntry', rutaFill, { recursive });
    nomValid(nom);
    potFallar(this.estat, 'removeEntry', rutaFill);
    const trobat = this.fill(nom);
    if (!trobat) throw errorDom('NotFoundError', `No hi ha «${rutaFill}».`);
    if (trobat.node.kind === 'directory' && trobat.node.fills.size > 0 && !recursive) {
      throw errorDom('InvalidModificationError', `«${rutaFill}» no està buida.`);
    }
    this.fills.delete(trobat.nom);
  }
}

/** El node d'una ruta ('' és l'arrel), o null. */
export function nodeFals(arrel, ruta) {
  if (ruta === '' || ruta === undefined || ruta === null) return arrel;
  let node = arrel;
  for (const seg of String(ruta).split('/')) {
    if (!(node instanceof CarpetaFalsa)) return null;
    node = node.fills.get(seg) ?? null;
    if (!node) return null;
  }
  return node;
}

/** El contingut d'un fitxer (còpia), o null. */
export function contingutFals(arrel, ruta) {
  const node = nodeFals(arrel, ruta);
  return node instanceof FitxerFals ? new Uint8Array(node.contingut) : null;
}

/** El text d'un fitxer, o null. */
export function textFals(arrel, ruta) {
  const node = nodeFals(arrel, ruta);
  return node instanceof FitxerFals ? node.text : null;
}

/** Totes les rutes de fitxer de l'arbre (també els ocults), ordenades. */
export function rutesFalses(arrel) {
  const rutes = [];
  const recorre = (carpeta, prefix) => {
    for (const [nom, node] of carpeta.fills) {
      const ruta = prefix ? `${prefix}/${nom}` : nom;
      if (node instanceof CarpetaFalsa) recorre(node, ruta);
      else rutes.push(ruta);
    }
  };
  recorre(arrel, '');
  return rutes.sort();
}

/** Totes les rutes de carpeta de l'arbre, ordenades. */
export function carpetesFalses(arrel) {
  const rutes = [];
  const recorre = (carpeta, prefix) => {
    for (const [nom, node] of carpeta.fills) {
      if (!(node instanceof CarpetaFalsa)) continue;
      const ruta = prefix ? `${prefix}/${nom}` : nom;
      rutes.push(ruta);
      recorre(node, ruta);
    }
  };
  recorre(arrel, '');
  return rutes.sort();
}

/** Una foto de l'arbre (ruta → { mida, modificat, bytes }) per a comprovar que ha quedat intacte. */
export function instantaniaFalsa(arrel) {
  const foto = {};
  for (const ruta of rutesFalses(arrel)) {
    const node = nodeFals(arrel, ruta);
    foto[ruta] = { mida: node.contingut.byteLength, modificat: node.modificat, bytes: Array.from(node.contingut).join(',') };
  }
  for (const ruta of carpetesFalses(arrel)) foto[`${ruta}/`] = 'carpeta';
  return foto;
}

/**
 * L'arbre de `_multimedia_de_poble` de les proves: 00_inbox (dos PNG i una
 * nota), originals_raster_public/assets/uploads/brain/x.jpg, documents_i_pdfs/acta.pdf,
 * un .DS_Store i un llegeix-me.txt. `extres` s'afigen a l'arrel.
 */
export function arbreMultimedia(opcions = {}, extres = {}) {
  return new CarpetaFalsa('_multimedia_de_poble', {
    '00_inbox': {
      'nano_vinyeta.png': bytesPngFals(64, 1),
      'esbos_festa_tibi.png': bytesPngFals(64, 2),
      'nota.md': '# Nota\n\nHola, poble.\n'
    },
    originals_raster_public: { assets: { uploads: { brain: { 'x.jpg': bytesJpegFals(48) } } } },
    documents_i_pdfs: { 'acta.pdf': bytesPdfFals() },
    '.DS_Store': 'brossa del Finder',
    'llegeix-me.txt': 'Llegeix-me\n',
    ...extres
  }, opcions);
}

/**
 * Per a creaIdbFalsEstructurat({ clona: clonaAmbHandles }): conserva la
 * referència del doble (el navegador clona el handle de veres) i clona la resta.
 */
export const clonaAmbHandles = (v) => (v && typeof v === 'object' && 'handle' in v)
  ? (({ handle, ...resta }) => ({ ...structuredClone(resta), handle }))(v)
  : structuredClone(v);

/* ── Afegit pel carril de la interfície (AU · Onada 261029_1605) ─────────── */

/**
 * Una biblioteca de carpetes recordades en memòria, amb el contracte de
 * creaBibliotecaCarpetesLocals (desa → { ok, nova, carpeta, desplacades } o
 * { ok:false, codi }; llista, recupera, marcaAcces, oblida i oblidaTotes), per
 * a les proves de GestorMultimediaLocal. `inicials` = [{ id, handle, nom? }]:
 * la primera és la usada més recentment. `fallaDesa` = un codi
 * (SENSE_INDEXEDDB…) fa que desa torne { ok:false, codi }. `crides` registra
 * cada crida com a [mètode, argument].
 */
export function creaBibliotecaFalsa(inicials = [], { fallaDesa = null } = {}) {
  const crides = [];
  const registres = new Map();
  let rellotge = 1000;
  inicials.forEach((r, i) => {
    registres.set(r.id, { id: r.id, nom: r.nom ?? r.handle?.name ?? '', ultimAcces: rellotge - i, handle: r.handle });
  });
  let comptador = registres.size;
  const exposa = (r) => Object.freeze({ id: r.id, nom: r.nom, ultimAcces: r.ultimAcces, handle: r.handle });
  return {
    crides,
    async desa(handle) {
      crides.push(['desa', handle]);
      if (fallaDesa) return { ok: false, codi: fallaDesa };
      rellotge += 1;
      for (const r of registres.values()) {
        if (r.handle === handle || (typeof r.handle?.isSameEntry === 'function' && await r.handle.isSameEntry(handle))) {
          r.ultimAcces = rellotge;
          return { ok: true, nova: false, carpeta: { id: r.id, nom: r.nom, ultimAcces: rellotge }, desplacades: [] };
        }
      }
      comptador += 1;
      const id = `v${comptador}`;
      registres.set(id, { id, nom: handle?.name ?? '', ultimAcces: rellotge, handle });
      return { ok: true, nova: true, carpeta: { id, nom: handle?.name ?? '', ultimAcces: rellotge }, desplacades: [] };
    },
    async llista() {
      crides.push(['llista']);
      return [...registres.values()].sort((a, b) => b.ultimAcces - a.ultimAcces).map(exposa);
    },
    async recupera(id) {
      crides.push(['recupera', id]);
      const r = registres.get(id);
      return r ? exposa(r) : null;
    },
    async marcaAcces(id) {
      crides.push(['marcaAcces', id]);
      const r = registres.get(id);
      if (!r) return false;
      rellotge += 1;
      r.ultimAcces = rellotge;
      return true;
    },
    async oblida(id) {
      crides.push(['oblida', id]);
      return registres.delete(id);
    },
    async oblidaTotes() {
      crides.push(['oblidaTotes']);
      registres.clear();
      return true;
    }
  };
}

/** Les consultes i peticions de permís del registre d'una CarpetaFalsa: [['query', 'read'], …]. */
export const permisosDelRegistre = (arrel) => arrel.registre
  .filter(([op]) => op === 'query' || op === 'request')
  .map(([op, mode]) => [op, mode]);
