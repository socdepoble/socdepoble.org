/* B5 (marató 261101_2143; spec B5-FEDERACIO §2.7) · El joc de conformitat del
   port del magatzem de la inbox i del port de la cua d'eixida. Les dues
   implementacions de cada port han de passar EXACTAMENT els mateixos casos:
   la memòria (creaMagatzemInboxEnMemoria, creaCuaEnMemoria) i l'adaptador
   PostgREST (creaMagatzemPostgrest) sobre la migració 2611020106.
   Sense Vitest ni node: el carreguen magatzem.conformitat.test.js (memòria i
   adaptador sobre un PostgREST doble) i l'arnés PGlite fora de l'arbre
   (l'adaptador sobre l'SQL real).
   Cada cas: { nom, limits?, rellotge?, prova: async (port, { ara, avanca }) }.
     · limits: { maximPerHost, maxim, maximIntents } que el corredor passa a
       la implementació (memòria: maximPerOrigen i maxim; adaptador: els
       paràmetres de les RPC).
     · rellotge: el cas avança el temps (avanca(ms)); un corredor que no pot
       moure el rellotge de la base (PGlite) el salta i ho diu.
   Els instants es comparen com a instants (Date.parse), no com a text: la
   base torna «+00:00» i la memòria «Z». */

export class FallaConformitat extends Error {}

export function exigix(condicio, missatge) {
  if (!condicio) throw new FallaConformitat(missatge);
}

/* Espera que `fer` llance; amb `tipus`, d'eixe tipus, i amb `missatge`, amb eixe text. */
export async function exigixQueLlanca(fer, { tipus = null, missatge = null } = {}, descripcio = 'havia de llançar') {
  let error = null;
  try { await fer(); } catch (e) { error = e; }
  exigix(error, `${descripcio}: no ha llançat`);
  if (tipus) exigix(error instanceof tipus, `${descripcio}: ${error?.constructor?.name} en lloc de ${tipus.name}`);
  if (missatge !== null) exigix(error.message === missatge, `${descripcio}: «${error.message}» en lloc de «${missatge}»`);
}

const iso = (ms) => new Date(ms).toISOString();
const mateix = (a, b) => Date.parse(a) === Date.parse(b);
const QUOTA_HOST = 'Quota de la inbox esgotada per a este origen.';
const PLE = 'Magatzem de la inbox ple.';
const TORRE = 'la-torre-de-les-macanes';
const ANNA = 'https://mastodon.example/users/anna';
const AJUNTAMENT = 'https://mastodon.example/users/ajuntament';
const ALTRA = 'https://mastodon.example/users/altra';
const reclama = (m, id, actor, ara, tipus = 'Undo') => m.reclamaActivitat(id, { actor, tipus, rebuda: iso(ara()) });
const alerta = (id, { actor = AJUNTAMENT, via = null, activitat = `${id}#create`, caduca, rebuda, nom = 'Tall de carretera', text = 'Tall de la CV-780' }) => ({
  id, actor, via, activitat, tipus: 'alerta', url: null, nom, text, publicat: null, caduca, rebuda
});

export const CASOS_MAGATZEM_INBOX = Object.freeze([
  {
    nom: 'idempotència: la primera reclamació és nova i la repetició, duplicada',
    async prova(m, { ara }) {
      exigix(await reclama(m, 'https://mastodon.example/a/1', ANNA, ara) === true, 'primera reclamació: true');
      exigix(await reclama(m, 'https://mastodon.example/a/1', ANNA, ara) === false, 'repetició: false');
      exigix(await reclama(m, 'https://mastodon.example/a/2', ANNA, ara) === true, 'una altra activitat: true');
    }
  },
  {
    nom: 'quota per host: ports, caixa i punt final són el mateix host; un altre host no queda bloquejat; la repetició d’un host ple és duplicada',
    limits: { maximPerHost: 2 },
    async prova(m, { ara }) {
      exigix(await reclama(m, 'https://hostil.example:8443/a/1', 'https://hostil.example:8443/users/x', ara) === true, 'primera del host');
      exigix(await reclama(m, 'https://hostil.example:8444/a/2', 'https://HOSTIL.example:8444/users/x', ara) === true, 'segona del host (un altre port)');
      for (const actor of ['https://hostil.example/users/y', 'https://hostil.example.:8445/users/z', 'https://Hostil.Example/users/w']) {
        await exigixQueLlanca(() => reclama(m, `${actor}#a`, actor, ara), { tipus: RangeError, missatge: QUOTA_HOST }, `quota del host per a ${actor}`);
      }
      exigix(await reclama(m, 'https://hostil.example:8443/a/1', 'https://hostil.example:8443/users/x', ara) === false, 'la repetició d’un host ple és duplicada');
      exigix(await reclama(m, 'https://sub.hostil.example/a/1', 'https://sub.hostil.example/users/x', ara) === true, 'un subdomini és un altre host');
    }
  },
  {
    nom: 'sostre global: el magatzem ple diu «Magatzem de la inbox ple.»',
    limits: { maximPerHost: 10, maxim: 2 },
    async prova(m, { ara }) {
      exigix(await reclama(m, 'https://a.example/a/1', 'https://a.example/u', ara) === true, 'primera');
      exigix(await reclama(m, 'https://b.example/a/1', 'https://b.example/u', ara) === true, 'segona');
      await exigixQueLlanca(() => reclama(m, 'https://c.example/a/1', 'https://c.example/u', ara), { tipus: RangeError, missatge: PLE }, 'tercera d’un altre host');
      exigix(await reclama(m, 'https://a.example/a/1', 'https://a.example/u', ara) === false, 'una repetició amb el magatzem ple és duplicada');
    }
  },
  {
    nom: 'alliberar: torna la quota una sola vegada, i només d’una reclamació en curs',
    limits: { maximPerHost: 1 },
    async prova(m, { ara }) {
      const X = 'https://x.example/u';
      exigix(await reclama(m, 'https://x.example/a/1', X, ara) === true, 'reclamar');
      await exigixQueLlanca(() => reclama(m, 'https://x.example/a/2', X, ara), { tipus: RangeError, missatge: QUOTA_HOST }, 'host ple');
      exigix(await m.alliberaActivitat('https://x.example/a/1') === true, 'alliberar una en curs: true');
      exigix(await m.alliberaActivitat('https://x.example/a/1') === false, 'alliberar-la dues vegades: false');
      exigix(await reclama(m, 'https://x.example/a/2', X, ara) === true, 'la quota ha tornat');
      await exigixQueLlanca(() => reclama(m, 'https://x.example/a/3', X, ara), { tipus: RangeError, missatge: QUOTA_HOST }, 'i només una vegada');
      exigix(await m.alliberaActivitat('https://x.example/a/desconeguda') === false, 'alliberar una desconeguda: false');
    }
  },
  {
    nom: 'confirmar: en curs → fet; una confirmada ja no s’allibera ni es torna a reclamar',
    async prova(m, { ara }) {
      exigix(await reclama(m, 'https://mastodon.example/a/c1', ANNA, ara) === true, 'reclamar');
      exigix(await m.confirmaActivitat('https://mastodon.example/a/c1') === true, 'confirmar: true');
      exigix(await m.confirmaActivitat('https://mastodon.example/a/c1') === false, 'confirmar-la dues vegades: false');
      exigix(await m.alliberaActivitat('https://mastodon.example/a/c1') === false, 'una confirmada no s’allibera');
      exigix(await reclama(m, 'https://mastodon.example/a/c1', ANNA, ara) === false, 'una confirmada és duplicada');
      exigix(await m.confirmaActivitat('https://mastodon.example/a/desconeguda') === false, 'confirmar una desconeguda: false');
    }
  },
  {
    /* ARB-M13-03 · La memòria no reprenia: l'SQL sí (una rèplica després d'una caiguda tornava a aplicar l'efecte només a l'SQL). */
    nom: 'represa: una reclamació en curs de fa més de 5 min es torna a prendre sense gastar quota; una confirmada, mai',
    limits: { maximPerHost: 1 },
    rellotge: true,
    async prova(m, { ara, avanca }) {
      const X = 'https://x.example/u';
      exigix(await reclama(m, 'https://x.example/a/r', X, ara) === true, 'reclamar');
      await avanca(5 * 60_000 - 1000);
      exigix(await reclama(m, 'https://x.example/a/r', X, ara) === false, 'abans dels 5 min, encara duplicada');
      await avanca(2000);
      exigix(await reclama(m, 'https://x.example/a/r', X, ara) === true, 'passats 5 min, es reprén (el host ple no ho impedix)');
      exigix(await reclama(m, 'https://x.example/a/r', X, ara) === false, 'la represa torna a comptar des d’ara');
      exigix(await m.confirmaActivitat('https://x.example/a/r') === true, 'confirmar la represa');
      await avanca(10 * 60_000);
      exigix(await reclama(m, 'https://x.example/a/r', X, ara) === false, 'una confirmada no es reprén mai');
      // La represa no allarga la retenció: es purga a les 14 h de la primera reclamació (conserva_fins no canvia).
      await avanca(14 * 3_600_000 - 15 * 60_000);
      exigix((await m.purga(ara())).activitats === 1, 'passades 14 h de la primera reclamació, es purga');
    }
  },
  {
    /* Petició A2 de l'àrbitre de M14: la memòria comptava els seguidors de tots els pobles junts. */
    nom: 'seguidors: la quota és per actor local; un poble ple no bloqueja els altres',
    limits: { maxim: 1 },
    async prova(m, { ara }) {
      const s = (slug, actor) => ({ slug, actor, inbox: `${actor}/inbox`, followId: `${actor}#follows/1`, acceptId: `https://socdepoble.org/ap/actors/${slug}.json#accepts/1`, des: iso(ara()) });
      exigix(await m.desaSeguidor(s(TORRE, ANNA)) === 'nou', 'el primer seguidor de la Torre');
      await exigixQueLlanca(() => m.desaSeguidor(s(TORRE, ALTRA)), { tipus: RangeError, missatge: PLE }, 'la Torre és plena');
      exigix(await m.desaSeguidor(s('socdepoble', ALTRA)) === 'nou', 'un altre actor local té la seua quota');
    }
  },
  {
    nom: 'seguidors: nou, existent (actualitza el followId), retirat només amb el followId vigent; quota per actor local',
    limits: { maxim: 2 },
    async prova(m, { ara }) {
      const s = (actor, n) => ({ slug: TORRE, actor, inbox: `${actor}/inbox`, followId: `${actor}#follows/${n}`, acceptId: `https://socdepoble.org/ap/actors/${TORRE}.json#accepts/${n}`, des: iso(ara()) });
      exigix(await m.desaSeguidor(s(ANNA, 1)) === 'nou', 'nou');
      exigix(await m.desaSeguidor(s(ANNA, 2)) === 'existent', 'existent');
      exigix(await m.retiraSeguidor({ slug: TORRE, actor: ANNA, followId: `${ANNA}#follows/1` }) === false, 'l’Undo d’un followId vell no retira');
      exigix(await m.desaSeguidor(s(ALTRA, 1)) === 'nou', 'un segon seguidor');
      await exigixQueLlanca(() => m.desaSeguidor(s(AJUNTAMENT, 1)), { tipus: RangeError, missatge: PLE }, 'quota de seguidors');
      exigix(await m.desaSeguidor(s(ANNA, 3)) === 'existent', 'un existent no gasta quota');
      exigix(await m.retiraSeguidor({ slug: TORRE, actor: ANNA, followId: `${ANNA}#follows/3` }) === true, 'l’Undo del followId vigent retira');
      exigix(await m.retiraSeguidor({ slug: TORRE, actor: ANNA, followId: `${ANNA}#follows/3` }) === false, 'retirar-lo dues vegades: false');
      exigix(await m.retiraSeguidor({ slug: TORRE, actor: ALTRA }) === true, 'sense followId, retira el seguiment');
    }
  },
  {
    nom: 'retiraActorRemot: els seus seguiments i les alertes on és autor o qui les anuncià',
    async prova(m, { ara }) {
      await m.desaSeguidor({ slug: TORRE, actor: AJUNTAMENT, inbox: `${AJUNTAMENT}/inbox`, followId: `${AJUNTAMENT}#f/1`, acceptId: `https://socdepoble.org/ap/actors/${TORRE}.json#accepts/a1`, des: iso(ara()) });
      const vida = { caduca: iso(ara() + 3_600_000), rebuda: iso(ara()) };
      exigix(await m.desaAlertaRemota(alerta('https://mastodon.example/n/1', vida)) === 'nova', 'alerta de l’autor');
      exigix(await m.desaAlertaRemota(alerta('https://mastodon.example/n/2', { ...vida, actor: ALTRA, via: AJUNTAMENT, activitat: 'https://mastodon.example/an/2' })) === 'nova', 'alerta anunciada per ell');
      exigix(await m.desaAlertaRemota(alerta('https://mastodon.example/n/3', { ...vida, actor: ALTRA })) === 'nova', 'alerta d’un altre');
      exigix(await m.retiraActorRemot(AJUNTAMENT) === 3, 'un seguiment i dues alertes');
      exigix(await m.retiraActorRemot(AJUNTAMENT) === 0, 'res més a retirar');
      const vigents = await m.llistaAlertesVigents(ara());
      exigix(vigents.length === 1 && vigents[0].id === 'https://mastodon.example/n/3', 'només queda la de l’altre');
    }
  },
  {
    nom: 'alertes: un Create de l’autor fa directa una alerta anunciada; ja no la retira qui l’anuncià',
    async prova(m, { ara }) {
      const vida = { caduca: iso(ara() + 3_600_000), rebuda: iso(ara()) };
      const id = 'https://mastodon.example/n/via';
      exigix(await m.desaAlertaRemota(alerta(id, { ...vida, via: ALTRA, activitat: 'https://mastodon.example/an/via' })) === 'nova', 'anunciada');
      exigix(await m.desaAlertaRemota(alerta(id, { ...vida, activitat: `${id}#create`, text: 'Text de l’autor' })) === 'existent', 'el Create de l’autor');
      const [directa] = await m.llistaAlertesVigents(ara());
      exigix(directa?.via === null && directa.activitat === `${id}#create` && directa.text === 'Text de l’autor', 'ara és directa, amb les dades del Create');
      exigix(await m.retiraAlertaRemota({ actor: ALTRA, activitat: 'https://mastodon.example/an/via' }) === false, 'l’Undo de qui l’anuncià ja no la retira');
      exigix(await m.desaAlertaRemota(alerta(id, { ...vida, via: ALTRA, activitat: 'https://mastodon.example/an/via2' })) === 'existent', 'un Announce posterior no la torna a anunciar');
      exigix((await m.llistaAlertesVigents(ara()))[0]?.via === null, 'continua directa');
      // Un altre propietari sobre una alerta existent no la canvia.
      exigix(await m.desaAlertaRemota(alerta(id, { ...vida, actor: ANNA, text: 'Intrús' })) === 'existent', 'un altre propietari: existent');
      exigix((await m.llistaAlertesVigents(ara())).find((a) => a.id === id)?.text === 'Text de l’autor', 'i el text no canvia');
    }
  },
  {
    /* Petició A2 de l'àrbitre de M14 (la guarda v_actual.actor = p_actor no tenia cap cas que la mate). */
    nom: 'alertes: el Create d’un altre compte sobre una alerta anunciada no la canvia ni la fa directa',
    async prova(m, { ara }) {
      const vida = { caduca: iso(ara() + 3_600_000), rebuda: iso(ara()) };
      const id = 'https://mastodon.example/n/anunciada';
      exigix(await m.desaAlertaRemota(alerta(id, { ...vida, via: ALTRA, activitat: 'https://mastodon.example/an/x' })) === 'nova', 'anunciada');
      exigix(await m.desaAlertaRemota(alerta(id, { ...vida, actor: ANNA, text: 'Text de l’intrús' })) === 'existent', 'el Create d’un altre compte: existent');
      const [a] = await m.llistaAlertesVigents(ara());
      exigix(a?.actor === AJUNTAMENT && a.via === ALTRA && a.text === 'Tall de la CV-780' && a.activitat === 'https://mastodon.example/an/x', 'no canvia res');
    }
  },
  {
    nom: 'làpida per propietari: el Delete d’un altre compte no retira ni deixa làpida; el del propietari retira i veta un Create seu posterior',
    async prova(m, { ara }) {
      const vida = { caduca: iso(ara() + 3_600_000), rebuda: iso(ara()) };
      const id = 'https://mastodon.example/n/lapida';
      await m.desaAlertaRemota(alerta(id, vida));
      exigix(await m.retiraAlertaRemota({ id, actor: ANNA, lapida: true, ara: ara() }) === false, 'el Delete d’un altre compte no retira');
      exigix(await m.retiraAlertaRemota({ id, actor: AJUNTAMENT, lapida: true, ara: ara() }) === true, 'el Delete del propietari retira');
      exigix(await m.desaAlertaRemota(alerta(id, vida)) === 'esborrada', 'un Create posterior del propietari no la ressuscita');
      // El Delete fallit d'Anna no li va deixar cap làpida, i la del propietari no la veta.
      exigix(await m.desaAlertaRemota(alerta(id, { ...vida, actor: ANNA })) === 'nova', 'la làpida no veta un altre propietari');
      exigix(await m.retiraAlertaRemota({ id: 'https://mastodon.example/n/res', actor: AJUNTAMENT, lapida: false, ara: ara() }) === false, 'sense làpida i sense alerta: false');
      exigix(await m.desaAlertaRemota(alerta('https://mastodon.example/n/res', vida)) === 'nova', 'sense làpida, un Create posterior entra');
    }
  },
  {
    nom: 'Undo(Announce): només de qui l’anuncià',
    async prova(m, { ara }) {
      const vida = { caduca: iso(ara() + 3_600_000), rebuda: iso(ara()) };
      await m.desaAlertaRemota(alerta('https://mastodon.example/n/an', { ...vida, via: ALTRA, activitat: 'https://mastodon.example/an/1' }));
      exigix(await m.retiraAlertaRemota({ actor: ANNA, activitat: 'https://mastodon.example/an/1' }) === false, 'l’Undo d’un altre no la retira');
      exigix(await m.retiraAlertaRemota({ actor: ALTRA, activitat: 'https://mastodon.example/an/altra' }) === false, 'l’Undo d’una altra activitat no la retira');
      exigix(await m.retiraAlertaRemota({ actor: ALTRA, activitat: 'https://mastodon.example/an/1' }) === true, 'l’Undo de qui l’anuncià la retira');
      exigix((await m.llistaAlertesVigents(ara())).length === 0, 'cap vigent');
    }
  },
  {
    nom: 'vigents: només les que no han caducat a l’instant donat, amb tots els camps',
    async prova(m, { ara }) {
      const ara0 = ara();
      await m.desaAlertaRemota({ ...alerta('https://mastodon.example/n/v1', { caduca: iso(ara0 + 3_600_000), rebuda: iso(ara0) }), url: 'https://mastodon.example/@aj/1', publicat: iso(ara0 - 60_000) });
      await m.desaAlertaRemota(alerta('https://mastodon.example/n/v2', { caduca: iso(ara0 + 7_200_000), rebuda: iso(ara0) }));
      const vigents = await m.llistaAlertesVigents(ara0);
      exigix(vigents.map((a) => a.id).sort().join(' ') === 'https://mastodon.example/n/v1 https://mastodon.example/n/v2', 'les dues');
      const v1 = vigents.find((a) => a.id === 'https://mastodon.example/n/v1');
      exigix(v1.actor === AJUNTAMENT && v1.via === null && v1.tipus === 'alerta' && v1.url === 'https://mastodon.example/@aj/1'
        && v1.nom === 'Tall de carretera' && v1.text === 'Tall de la CV-780' && v1.activitat === 'https://mastodon.example/n/v1#create', 'els camps');
      exigix(mateix(v1.publicat, iso(ara0 - 60_000)) && mateix(v1.caduca, iso(ara0 + 3_600_000)) && mateix(v1.rebuda, iso(ara0)), 'els instants');
      const despres = await m.llistaAlertesVigents(ara0 + 3_600_000);
      exigix(despres.length === 1 && despres[0].id === 'https://mastodon.example/n/v2', 'a la caducitat exacta, ja no és vigent');
      exigix((await m.llistaAlertesVigents(ara0 + 7_200_001)).length === 0, 'cap després');
    }
  },
  {
    nom: 'purga: activitats vençudes (tornen la quota), alertes caducades fa més d’un dia i làpides vençudes',
    limits: { maximPerHost: 1 },
    rellotge: true,
    async prova(m, { ara, avanca }) {
      const X = 'https://x.example/u';
      exigix(await reclama(m, 'https://x.example/a/1', X, ara) === true, 'reclamar');
      await m.desaAlertaRemota(alerta('https://mastodon.example/n/p1', { caduca: iso(ara() + 3_600_000), rebuda: iso(ara()) }));
      await m.retiraAlertaRemota({ id: 'https://mastodon.example/n/p2', actor: AJUNTAMENT, lapida: true, ara: ara() });
      const r0 = await m.purga(ara());
      exigix(r0.activitats === 0 && r0.alertes === 0 && r0.lapides === 0, 'res de vigent es purga');
      await avanca(14 * 3_600_000 + 1000);
      exigix((await m.purga(ara())).activitats === 1, 'passades 14 h, l’activitat es purga');
      exigix(await reclama(m, 'https://x.example/a/2', X, ara) === true, 'i la quota del host torna');
      await avanca(11 * 3_600_000);
      exigix((await m.purga(ara())).alertes === 1, 'una alerta caducada fa més d’un dia es purga');
      exigix(await m.desaAlertaRemota(alerta('https://mastodon.example/n/p2', { caduca: iso(ara() + 3_600_000), rebuda: iso(ara()) })) === 'esborrada', 'la làpida encara veta');
      await avanca(30 * 24 * 3_600_000);
      exigix((await m.purga(ara())).lapides === 1, 'passada la seua retenció, la làpida es purga');
      exigix(await m.desaAlertaRemota(alerta('https://mastodon.example/n/p2', { caduca: iso(ara() + 3_600_000), rebuda: iso(ara()) })) === 'nova', 'i ja no veta');
    }
  }
]);

const ACCEPT = (n) => ({ '@context': 'https://www.w3.org/ns/activitystreams', id: `https://socdepoble.org/ap/actors/${TORRE}.json#accepts/${n}`, type: 'Accept', actor: `https://socdepoble.org/ap/actors/${TORRE}.json` });
const INBOX = `${ANNA}/inbox`;

export const CASOS_CUA = Object.freeze([
  {
    nom: 'encuar és idempotent per (activitat, inbox) i rebutja un cos amb un altre id',
    async prova(c) {
      exigix(await c.encua({ slug: TORRE, inbox: INBOX, activitat: ACCEPT(1) }) === true, 'encuar');
      exigix(await c.encua({ slug: TORRE, inbox: INBOX, activitat: ACCEPT(1) }) === false, 'el mateix: false');
      exigix(await c.encua({ slug: TORRE, inbox: 'https://altra.example/inbox', activitat: ACCEPT(1) }) === true, 'una altra inbox: true');
      await exigixQueLlanca(() => c.encua({ slug: TORRE, inbox: INBOX, activitat: { type: 'Accept' } }), {}, 'sense id');
      await exigixQueLlanca(() => c.encua({ slug: TORRE, inbox: INBOX, activitat: { ...ACCEPT(2), farcit: 'x'.repeat(65 * 1024) } }), {}, 'massa gran');
    }
  },
  {
    nom: 'reclamar suma l’intent i reserva la fila; resoldre-la una vegada; un resultat desconegut llança',
    limits: { maximIntents: 3 },
    async prova(c) {
      await c.encua({ slug: TORRE, inbox: INBOX, activitat: ACCEPT(3) });
      const [f] = await c.reclama(10);
      exigix(f && f.intents === 1 && f.slug === TORRE && f.inbox === INBOX && f.activitat_id === ACCEPT(3).id && f.cos?.id === ACCEPT(3).id && f.cos.type === 'Accept', 'la fila i el seu cos');
      exigix((await c.reclama(10)).length === 0, 'reservada: una segona passada no la veu');
      await exigixQueLlanca(() => c.resol({ id: f.id, resultat: 'altre' }), {}, 'resultat desconegut');
      exigix(await c.resol({ id: f.id, resultat: 'fet', esperaS: null, error: null }) === 'fet', 'fet');
      exigix(await c.resol({ id: f.id, resultat: 'fet', esperaS: null, error: null }) === null, 'dues vegades: null');
      exigix(await c.resol({ id: f.id + 1000, resultat: 'fet' }) === null, 'una fila desconeguda: null');
      exigix(await c.encua({ slug: TORRE, inbox: INBOX, activitat: ACCEPT(3) }) === false, 'resolta fa menys d’una hora: no es torna a encuar');
    }
  },
  {
    nom: 'fallit: el resultat fallit i el reintent al sostre d’intents',
    limits: { maximIntents: 1 },
    async prova(c) {
      await c.encua({ slug: TORRE, inbox: INBOX, activitat: ACCEPT(4) });
      await c.encua({ slug: TORRE, inbox: INBOX, activitat: ACCEPT(5) });
      const files = await c.reclama(10);
      exigix(files.length === 2, 'dues files');
      exigix(await c.resol({ id: files[0].id, resultat: 'fallit', esperaS: null, error: 'http_410' }) === 'fallit', 'fallit');
      exigix(await c.resol({ id: files[1].id, resultat: 'reintent', esperaS: 60, error: 'http_503' }) === 'fallit', 'reintent al sostre: fallit');
    }
  },
  {
    nom: 'reintent: torna a ser pendent i no es reclama abans de l’espera; reenviament com a molt un per hora',
    limits: { maximIntents: 5 },
    rellotge: true,
    async prova(c, { avanca }) {
      await c.encua({ slug: TORRE, inbox: INBOX, activitat: ACCEPT(6) });
      const [f] = await c.reclama(10);
      exigix(await c.resol({ id: f.id, resultat: 'reintent', esperaS: 120, error: 'http_503' }) === 'pendent', 'pendent');
      await avanca(119_000);
      exigix((await c.reclama(10)).length === 0, 'abans de l’espera, no');
      await avanca(2000);
      const [g] = await c.reclama(10);
      exigix(g?.intents === 2, 'segon intent');
      exigix(await c.resol({ id: g.id, resultat: 'fet', esperaS: null, error: null }) === 'fet', 'fet');
      await avanca(3_600_000 + 1000);
      exigix(await c.encua({ slug: TORRE, inbox: INBOX, activitat: { ...ACCEPT(6), type: 'Reject' } }) === false, 'mai un cos distint amb el mateix id');
      exigix(await c.encua({ slug: TORRE, inbox: INBOX, activitat: ACCEPT(6) }) === true, 'passada una hora, el mateix Accept es torna a encuar');
      exigix(await c.encua({ slug: TORRE, inbox: INBOX, activitat: ACCEPT(6) }) === false, 'una sola vegada');
      exigix((await c.reclama(10))[0]?.intents === 1, 'amb els intents a zero');
    }
  },
  {
    /* ARB-M13-05 i ARB-M13-06 (MG): «resoldre dues vegades no fa res» només és cert després de fet o fallit. */
    nom: 'resoldre: després d’un reintent encara es resol (sense token); feta, null; tornada a encuar i sense reclamar, null',
    limits: { maximIntents: 5 },
    rellotge: true,
    async prova(c, { avanca }) {
      await c.encua({ slug: TORRE, inbox: INBOX, activitat: ACCEPT(7) });
      const [f] = await c.reclama(10);
      exigix(await c.resol({ id: f.id, resultat: 'reintent', esperaS: 60, error: 'http_503' }) === 'pendent', 'reintent');
      exigix(await c.resol({ id: f.id, resultat: 'fet', esperaS: null, error: null }) === 'fet', 'una pendent amb intents encara es resol (residu sense token)');
      exigix(await c.resol({ id: f.id, resultat: 'fet', esperaS: null, error: null }) === null, 'una feta, null');
      await avanca(3_600_000 + 1000);
      exigix(await c.encua({ slug: TORRE, inbox: INBOX, activitat: ACCEPT(7) }) === true, 'tornada a encuar passada una hora');
      exigix(await c.resol({ id: f.id, resultat: 'fet', esperaS: null, error: null }) === null, 'pendent però sense reclamar: null');
      const [g] = await c.reclama(10);
      exigix(g?.id === f.id && g.intents === 1, 'la mateixa fila, que ara sí es reclama');
    }
  },
  {
    /* Petició A2 de l'àrbitre de M14. La memòria torna un nombre i l'adaptador, el recompte de cada taula. */
    nom: 'purga de la cua: una feta de fa 8 h es queda; feta de fa més de 7 dies o fallida de fa més de 30, fora',
    rellotge: true,
    async prova(c, { avanca }) {
      const purgades = async () => { const r = await c.purga(); return typeof r === 'number' ? r : r?.cua; };
      await c.encua({ slug: TORRE, inbox: INBOX, activitat: ACCEPT(8) });
      await c.encua({ slug: TORRE, inbox: INBOX, activitat: ACCEPT(9) });
      const [a, b] = await c.reclama(10);
      exigix(await c.resol({ id: a.id, resultat: 'fet', esperaS: null, error: null }) === 'fet', 'fet');
      exigix(await c.resol({ id: b.id, resultat: 'fallit', esperaS: null, error: 'http_410' }) === 'fallit', 'fallit');
      await avanca(8 * 3_600_000);
      exigix(await purgades() === 0, 'una feta de fa 8 h es queda');
      await avanca(7 * 24 * 3_600_000);
      exigix(await purgades() === 1, 'passats 7 dies, la feta se’n va');
      await avanca(23 * 24 * 3_600_000);
      exigix(await purgades() === 1, 'passats 30 dies, la fallida se’n va');
    }
  }
]);
