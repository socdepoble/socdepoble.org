/* IDEA-368. Escàner lineal: el trie es construïx una volta i cada caràcter
   es visita un nombre acotat de voltes. No executa regex sobre el cos. */
const text = v => typeof v === 'string' ? v : '';
const paraula = c => !!c && (c.toLowerCase() !== c.toUpperCase() || (c >= '0' && c <= '9') || c === '_' || c === '-');
const estatsPublics = new Set(['public','publica','published','publicat','publicada','approved','aprovat','aprovada']);
const camp = (p,k) => { const d=Object.getOwnPropertyDescriptor(p,k);return d && Object.hasOwn(d,'value') ? d.value : undefined; };
function publica(p) {
  if (!p || typeof p!=='object' || Array.isArray(p) || camp(p,'isPublished')!==true) return false;
  const pendents=[p], vistos=new Set(); let n=0;
  while (pendents.length) {
    const capa=pendents.pop();
    if (!capa || typeof capa!=='object' || Array.isArray(capa) || vistos.has(capa) || ++n>64) return false;
    vistos.add(capa);
    for (const k of ['visibility','status','estat']) if(Object.hasOwn(capa,k)) {
      const v=camp(capa,k);
      if (typeof v!=='string' || (k==='visibility' ? !['public','publica'].includes(v) : !estatsPublics.has(v))) return false;
    }
    for (const k of ['private','draft','isDraft','esborrany']) if(Object.hasOwn(capa,k) && camp(capa,k)!==false) return false;
    for (const k of ['isPublished','is_published','published']) if(Object.hasOwn(capa,k) && camp(capa,k)!==true) return false;
    /* v1.2.26 · #8 P2 (Gauntlet C26-3) · Els marcadors de private.mur_public_eligible (2611121430), capa a capa: una peça
       moderada, esborrada o retirada no compta com a menció encara que diga isPublished. `retirada` no és del SQL: és
       tancament de més per a la vista. Un getter dona undefined i també tanca. */
    if (Object.hasOwn(capa,'moderation_state') && camp(capa,'moderation_state')!=='visible') return false;
    for (const k of ['deleted_at','deletedAt']) if(Object.hasOwn(capa,k) && camp(capa,k)!==null) return false;
    for (const k of ['deleted','retirada']) if(Object.hasOwn(capa,k) && camp(capa,k)!==false) return false;
    for (const k of ['attributes','payload']) if(Object.hasOwn(capa,k)) { if(!Object.hasOwn(Object.getOwnPropertyDescriptor(capa,k),'value'))return false;if(camp(capa,k)!=null)pendents.push(camp(capa,k)); }
  }
  return true;
}

export function creaParserMencions(entitats = []) {
  const arrel = new Map();
  for (const e of entitats) {
    if (!e || !text(e.id) || !text(e.slug) || !text(e.nom)) throw new TypeError('Entitat invàlida.');
    const valor = Object.freeze({ id: e.id, slug: e.slug, nom: e.nom, ruta: '/entitat/' + encodeURIComponent(e.slug) });
    for (const nom of new Set([e.slug, e.nom, ...(Array.isArray(e.alies) ? e.alies.filter(a => typeof a === 'string') : [])])) {
      if (!nom || nom.length > 200) throw new TypeError('Nom d’entitat invàlid.');
      let node = arrel;
      for (let i=0;i<nom.length;i++) { const c=nom[i].toLowerCase(); if (!node.has(c)) node.set(c, new Map()); node = node.get(c); }
      if (node.has(null) && node.get(null).id !== e.id) throw new TypeError('Àlies d’entitat ambigu.');
      node.set(null, valor);
    }
  }
  return function parseMencions(cos) {
    if (typeof cos !== 'string') return [];
    const result = [];
    for (let i = 0; i < cos.length; i++) {
      if (cos[i] !== '@' || (i && (paraula(cos[i - 1]) || cos[i - 1] === '@'))) continue;
      let node = arrel, millor = null, final = i + 1;
      // Els noms tenen màxim 200 caràcters: fins i tot un prefix adversarial és O(n).
      for (let j = i + 1; j < cos.length && j - i <= 200; j++) {
        node = node.get(cos[j].toLowerCase());
        if (!node) break;
        if (node.has(null) && !paraula(cos[j + 1])) { millor = node.get(null); final = j + 1; }
      }
      if (millor) { result.push({ ...millor, inici: i, fi: final }); i = final - 1; }
    }
    return result;
  };
}

export function validaSubgrupsEntitat(entitats) {
  const mapa = new Map(entitats.map(e => [e.id, e]));
  const vistos = new Set();
  for (const e of entitats) {
    const cami = new Set(); let node = e;
    while (node && !vistos.has(node.id)) {
      if (cami.has(node.id)) throw new TypeError('Cicle d’entitats.');
      cami.add(node.id);
      if (node.entitatMareId && !mapa.has(node.entitatMareId)) throw new TypeError('Entitat mare absent.');
      node = mapa.get(node.entitatMareId);
    }
    for (const id of cami) vistos.add(id);
  }
  return entitats.map(e => ({ id: e.id, entitatMareId: text(e.entitatMareId) || null }));
}

/* Autoritat de desvinculació injectada pel servidor/repositori: cap rol dins
   del post o id declarat pel client concedix permís. El post original no es muta. */
export function creaGrafMencions({ entitats = [], autoritzaDesvinculacio = () => false, carregaDesvinculacions, desaDesvinculacions, resolAutorEntitat = () => null } = {}) {
  validaSubgrupsEntitat(entitats);
  const parse = creaParserMencions(entitats), ids = new Set(entitats.map(e => e.id));
  /* v1.2.26 · #8 P2 (Gauntlet C26-3) · `conservades` guarda les files d'entitats que ja no són al padró (una baixa):
     no s'apliquen a cap llista, però tornen a eixir en exportar i en desar, perquè una baixa no esborre en silenci la
     voluntat d'una entitat que torne. Abans una sola fila així rebutjava el lot sencer. */
  const desvinculades = new Map(), conservades = new Map(); let publicacions = [], cua=Promise.resolve();
  const files = mapa => [...mapa].flatMap(([entitatId,posts])=>[...posts].map(publicacioId=>({entitatId,publicacioId})));
  const exporta = () => [...files(desvinculades), ...files(conservades)];
  const validaDesvinculacions = rows => {
    if (!Array.isArray(rows) || rows.length>100000) throw new TypeError('Desvinculacions invàlides.');
    return rows.map(r=>{
      if (!r || typeof r!=='object' || !text(camp(r,'entitatId')) || camp(r,'entitatId').length>200 || !text(camp(r,'publicacioId')) || camp(r,'publicacioId').length>200) throw new TypeError('Desvinculació invàlida.');
      return {entitatId:camp(r,'entitatId'),publicacioId:camp(r,'publicacioId')};
    });
  };
  const aplicaDesvinculacions = rows => { for(const {entitatId,publicacioId} of rows) {const desti=ids.has(entitatId)?desvinculades:conservades;if(!desti.has(entitatId))desti.set(entitatId,new Set());desti.get(entitatId).add(publicacioId);} };
  // La càrrega és un servei de confiança del consumidor (servidor/IndexedDB
  // autoritzat), mai un paràmetre de post o una llista enviada per un tercer.
  const llest = typeof carregaDesvinculacions==='function' ? Promise.resolve().then(()=>carregaDesvinculacions()).then(rows=>aplicaDesvinculacions(validaDesvinculacions(rows))) : Promise.resolve();
  /* v1.2.26 · #8 P2 (Gauntlet C26-3) · Falla tancat: mentre la càrrega no ha acabat bé, ni la llista ni l'exportació
     responen, perquè una menció desvinculada no torne a eixir ni un desat parcial esborre files. Sense càrrega
     injectada, el graf està llest des del principi. El manejador també evita un rebuig sense atendre. */
  let preparat = typeof carregaDesvinculacions!=='function';
  llest.then(()=>{preparat=true;},()=>{});
  const exigixPreparat = () => { if (!preparat) throw Object.assign(new Error('El graf de mencions encara no està preparat.'), { code: 'no-disponible' }); };
  return {
    async prepara() { await llest; },
    exportaDesvinculacions() { exigixPreparat(); return exporta(); },
    indexaPublicacions(peces) { publicacions = peces.filter(publica).map(p => ({ id: text(p.id), autorEntitatId: text(resolAutorEntitat(p)), mencions: [...new Set(parse(text(p.content)).map(m => m.id))] })); },
    llistaPublicacionsEntitat(id) {
      exigixPreparat();
      if (!ids.has(id)) return { propies: [], mencions: [] };
      return { propies: publicacions.filter(p => p.autorEntitatId === id).map(p => p.id),
        mencions: publicacions.filter(p => p.autorEntitatId !== id && p.mencions.includes(id) && !desvinculades.get(id)?.has(p.id)).map(p => p.id) };
    },
    desvinculaMencio(entitatId, publicacioId) {
      const feina=cua.then(async()=>{
      await llest;
      if (!ids.has(entitatId) || await autoritzaDesvinculacio(entitatId) !== true) throw Object.assign(new Error('No tens permís per a desvincular esta menció.'), { code: 'sense-permis' });
      if (!publicacions.some(p => p.id === publicacioId && p.mencions.includes(entitatId))) throw new TypeError('Menció absent.');
      const nova={entitatId,publicacioId};
      // Primer confirma la persistència; un error no anuncia una desvinculació.
      if (typeof desaDesvinculacions==='function') await desaDesvinculacions([...exporta().filter(r=>r.entitatId!==entitatId || r.publicacioId!==publicacioId),nova]);
      aplicaDesvinculacions([nova]);
      return { entitatId, publicacioId, desvinculada: true };
      });
      cua=feina.catch(()=>{});return feina;
    }
  };
}
