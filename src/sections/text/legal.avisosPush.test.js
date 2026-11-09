// @vitest-environment node
/* Onada R9 · C3 (IDEA-120 / P0-30; G8-01) · /legal 2.5 diu els avisos push del
   xat, que l'ordre del Mestre del 261106 encén. Dues guardes:
     1. La 2.5 és la 2.4 SEGELLADA (2611030330) amb exactament estos canvis i
        cap altre: el rètol i els apartats 8, 9, 10, 11, 12 i 20. Qualsevol
        altra paraula canviada fa caure la prova (i la §18 ho exigix:
        politicaPrivacitat23.migracio.test.js i ...25.migracio.test.js).
     2. Cada afirmació s'ancora al codi, com legal.traductor.test.js: els
        noms dels controls, l'avís cec, els quatre serveis de push admesos, el
        dia de vida de l'avís al servei, els 60 dies (valor per defecte d'un
        ajust que cap migració no fixa), els deu aparells, totes les columnes
        i l'hora de la cua, les claus que no es guarden, l'eixida, que per als
        serveis de push no s'invoca cap garantia de transferència sense font
        (R9V-C3-02: pendent de revisió legal) i l'absència dels avisos push a
        l'app nativa. Si el codi canvia, esta prova cau i el text legal s'ha
        de tornar a escriure en una versió nova. */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { legalContent } from './legalContent.js';
import { TEXTOS_AVISOS } from '../xat/useAvisosPushXat.js';
import { TEXTOS_PINDOLA } from '../xat/components/PindolaAvisosPushXat.jsx';
import { SERVEIS_DE_PUSH } from '../../pwa/avisosPush.js';
import { WEB_PUSH } from '../../../supabase/functions/notifica-xat/webpush.js';
import { AVIS_NATIU } from '../../../supabase/functions/notifica-xat/natius.js';

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const sha = (text) => createHash('sha256').update(text).digest('hex');
const pla = (tros) => tros.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const HTML = legalContent.html;
const SEGELLADA_24 = llig('supabase/migrations/2611030330_politica_privacitat_2_4.sql').split('$politica_2_4$')[1];
const SQL_PUSH = llig('supabase/migrations/2611020417_xat_avisos_push.sql');
const CA = llig('src/config/idiomes/ca.js');

function apartat(numero) {
  const inici = HTML.indexOf(`<h4>${numero}. `);
  const fi = HTML.indexOf(`<h4>${numero + 1}. `, inici);
  expect([numero, inici > 0, fi > inici]).toEqual([numero, true, true]);
  return HTML.slice(inici, fi);
}

/* [abans (2.4 segellada), després (2.5)], en l'ordre del document. */
const CANVIS_25 = [
  [
    "<p><em><strong>Versió 2.4</strong> · <strong>En vigor</strong> des del <strong>3 de novembre de 2026</strong>. <strong>Substitueix</strong> <strong>qualsevol versió anterior</strong> <strong>d'aquest text</strong>.</em></p>",
    "<p><em><strong>Versió 2.5</strong> · <strong>En vigor</strong> des del <strong>6 de novembre de 2026</strong>. <strong>Substitueix</strong> <strong>qualsevol versió anterior</strong> <strong>d'aquest text</strong>.</em></p>"
  ],
  [
    "      <li><strong>Consultes a la IAIA MarIA:</strong> el text que li escrius, si decideixes fer-la servir.</li>\n",
    "      <li><strong>Consultes a la IAIA MarIA:</strong> el text que li escrius, si decideixes fer-la servir.</li>\n      <li><strong>Avisos push del xat:</strong> només si els encens tu, amb el botó «🔔 Activar notificacions del xat» o amb l'interruptor «Avisos en este dispositiu» dels ajustos del xat («Tu: ajustos» → «Notificacions»), i després de donar-hi permís al navegador. De cada aparell on els encens guardem, lligada al teu compte, l'adreça que li dona el servei de push del navegador (un enllaç <em>https</em>), el tipus d'aparell, la llengua de l'avís, quan es va desar, quan caduca i l'última vegada que es va renovar. No guardem les claus de xifratge de la subscripció. Quan algú escriu en una conversa, una cua interna n'apunta la conversa, el missatge i qui l'ha escrit i, si n'hi ha, l'organització en nom de la qual escriu i el missatge al qual respon, per a saber quins aparells dels altres membres cal despertar. L'avís és cec: només diu «Tens missatges nous», mai qui t'escriu ni què et diu, i en tocar-lo és l'aplicació, amb la teua sessió, la que tria la conversa. A l'aplicació per al mòbil encara no hi ha avisos push: quan n'hi haja, guardarem el testimoni del dispositiu en lloc de l'adreça i ho direm en una versió nova d'aquest text.</li>\n"
  ],
  [
    "<li><strong>Coses opcionals</strong> (imatge de perfil, ús de la IAIA MarIA, comunicacions no imprescindibles,",
    "<li><strong>Coses opcionals</strong> (imatge de perfil, ús de la IAIA MarIA, els avisos push del xat, comunicacions no imprescindibles,"
  ],
  [
    "      <li><strong>Missatges de xat:</strong> mentre el teu compte existisca. Si et dones de baixa, passats els 30 dies els missatges que has escrit s'esborren amb ell, també de les converses de les altres persones.</li>\n",
    "      <li><strong>Missatges de xat:</strong> mentre el teu compte existisca. Si et dones de baixa, passats els 30 dies els missatges que has escrit s'esborren amb ell, també de les converses de les altres persones.</li>\n      <li><strong>Avisos push del xat:</strong> l'adreça de cada aparell, mentre hi tingues els avisos encesos. S'esborra quan els apagues amb l'interruptor «Avisos en este dispositiu», quan tanques la sessió en aquell aparell, quan el servei de push ens diu que ja no existix, quan caduca, si passen 60 dies sense renovar-se (és el termini que fem servir ara; si el canviem, ho direm en una versió nova d'aquest text) i, com tot, quan s'esborra el teu compte. Com a molt en guardem deu per persona: si n'encens un altre, s'esborra el que fa més temps que no es renova. La cua interna s'esborra quan s'envien els avisos, i el que fa més d'una hora, en la neteja següent. També els pots apagar retirant el permís als ajustos del navegador: llavors l'aparell ja no rep res.</li>\n"
  ],
  [
    "amb «Vore mapa»; i excepte per <strong>obligació legal",
    "amb «Vore mapa»; el que cal per als <strong>avisos push del xat</strong>, si els encens (el paràgraf següent); i excepte per <strong>obligació legal"
  ],
  [
    "requeriment formal d'un jutjat o de la policia</strong>.</p>\n",
    "requeriment formal d'un jutjat o de la policia</strong>.</p>\n    <p><strong>Els avisos push del xat</strong> passen pel <strong>servei de push del teu navegador</strong>, que no triem nosaltres: <strong>Google</strong> (Firebase Cloud Messaging, FCM, el de Chrome), <strong>Apple</strong> (Apple Push Notification service, APNs, el de Safari), <strong>Mozilla</strong> (el de Firefox) o <strong>Microsoft</strong> (el de Windows). Només acceptem adreces d'aquests quatre. El teu navegador hi parla amb la teua adreça IP, com amb qualsevol web que envie avisos. Quan algú t'escriu, el servidor els envia l'adreça del teu aparell i un avís <strong>sense cap contingut</strong>, que el servei guarda com a molt un dia si l'aparell no està connectat: mai qui t'escriu ni què et diu. Quan l'aplicació per al mòbil els porte, passaran per <strong>APNs d'Apple</strong> o per <strong>FCM de Google</strong>, segons el telèfon, amb el testimoni del dispositiu i el text «Tens missatges nous» en la seua llengua.</p>\n"
  ],
  [
    "Pots demanar-nos una còpia d'aquestes garanties escrivint-nos.</p>\n",
    "Pots demanar-nos una còpia d'aquestes garanties escrivint-nos.</p>\n    <p>Els <strong>serveis de push</strong> dels <strong>avisos del xat</strong> (apartat 11) són de <strong>Google, Apple, Mozilla i Microsoft</strong> i poden tractar l'adreça del teu aparell <strong>fora de l'Espai Econòmic Europeu</strong>. <strong>Encara no hem comprovat</strong> amb quina decisió d'adequació o amb quines garanties es cobrix aquesta transferència: <strong>està pendent de revisió legal</strong>, i ho direm en una versió nova d'aquest text quan estiga feta. Si no ho vols, <strong>no encengues els avisos</strong>: el xat funciona igual sense.</p>\n"
  ],
  [
    "<strong>Res d'ací dins serveix per a rastrejar-te</strong> <strong>ni s'envia a tercers</strong>.</p>\n",
    "<strong>Res d'ací dins serveix per a rastrejar-te</strong> <strong>ni s'envia a tercers</strong>.</p>\n    <p><strong>Si encens els avisos push del xat</strong> (apartat 8), <strong>la subscripció</strong> no la guardem nosaltres en cap d'aquests llocs: la crea i la <strong>guarda el teu navegador</strong> amb el seu servei de push, a petició teua, i <strong>la desfem</strong> quan els apagues o tanques la sessió.</p>\n"
  ]
];

describe('/legal 2.5 · la 2.4 segellada amb només els canvis dels avisos push', () => {
  test('desfent exactament estos canvis, la 2.5 torna a ser la 2.4 segellada byte a byte', () => {
    expect(sha(SEGELLADA_24)).toBe('2956bc30112b2e8d097815d502f9cd711e9ee0c213c5c73634340d9657343ff3');
    let desfet = HTML;
    for (const [abans, despres] of [...CANVIS_25].reverse()) {
      expect(desfet.split(despres).length, despres.slice(0, 60)).toBe(2);
      desfet = desfet.replace(despres, abans);
    }
    expect(desfet).toBe(SEGELLADA_24);
  });

  test('cada canvi parla dels avisos push (o és el rètol), i el rètol és el 2.5 del 6 de novembre de 2026', () => {
    const [[rotul24, rotul25], ...resta] = CANVIS_25;
    expect(pla(rotul24)).toBe("Versió 2.4 · En vigor des del 3 de novembre de 2026. Substitueix qualsevol versió anterior d'aquest text.");
    expect(pla(rotul25)).toBe("Versió 2.5 · En vigor des del 6 de novembre de 2026. Substitueix qualsevol versió anterior d'aquest text.");
    for (const [, despres] of resta) expect(pla(despres), despres.slice(0, 60)).toMatch(/avisos (?:push )?del xat/i);
  });

  test('cada paràgraf nou porta èmfasi (cap paràgraf pla, com la 2.4)', () => {
    for (const [abans, despres] of CANVIS_25) {
      const nous = [...despres.replace(abans, '').matchAll(/<p>[\s\S]*?<\/p>/g)].map((m) => m[0]);
      for (const p of nous) expect(p.includes('<strong>'), p.slice(0, 60)).toBe(true);
    }
  });

  test('cap frase nova no queda enganxada a la següent (punt sense espai)', () => {
    for (const [, despres] of CANVIS_25) expect(pla(despres), despres.slice(0, 60)).not.toMatch(/[a-zà-úï)»][.;:?!][A-ZÀ-Úa-zà-ú«(]/);
  });
});

describe('/legal 2.5 · cada afirmació dels avisos push té el codi al darrere', () => {
  test('apartat 8: els controls es diuen com al codi i l’avís és cec («Tens missatges nous»)', () => {
    const vuit = pla(apartat(8));
    expect(vuit).toContain(`amb el botó «${TEXTOS_PINDOLA.activa[1]}»`);
    expect(vuit).toContain(`l'interruptor «${TEXTOS_AVISOS.interruptor[1]}»`);
    expect(CA).toMatch(/'section\.xat\.ajustos\.obri': 'Tu: ajustos',/);
    expect(CA).toMatch(/'section\.xat\.ajustos\.notificacions': 'Notificacions',/);
    expect(vuit).toContain('(«Tu: ajustos» → «Notificacions»)');
    expect(vuit).toContain('només diu «Tens missatges nous», mai qui t\'escriu ni què et diu');
    expect(llig('public/sw.js')).toContain("cos: 'Tens missatges nous'");
    expect(llig('supabase/functions/notifica-xat/natius.js')).toContain("cos: 'Tens missatges nous'");
  });

  test('apartat 8: el que es guarda és el que té la taula, sense les claus de xifratge de la subscripció', () => {
    const taula = SQL_PUSH.slice(SQL_PUSH.indexOf('create table if not exists public.xat_dispositius_push'), SQL_PUSH.indexOf('constraint xat_dispositius_push_adreca_forma'));
    for (const columna of ['usuari_id', 'tipus', 'adreca', 'llengua', 'caduca_al', 'creat_al', 'renovat_al']) expect(taula, columna).toMatch(new RegExp(`\\b${columna}\\b`));
    /* Cap columna p256dh ni auth (auth.users és la referència al compte, no cap clau). */
    expect(taula).not.toMatch(/p256dh|^\s+auth\s/m);
    const cua = SQL_PUSH.slice(SQL_PUSH.indexOf('create table if not exists private.xat_push_cua'), SQL_PUSH.indexOf('create index if not exists xat_push_cua_creat_idx'));
    /* Totes les columnes de la cua, en ordre: el text n'ha de dir cadascuna (R9V-C3-03). */
    const columnesCua = [...cua.matchAll(/^\s{2}([a-z_]+)\s+(?:bigint|uuid|timestamptz)\b/gm)].map((m) => m[1]);
    expect(columnesCua).toEqual(['id', 'fil_id', 'missatge_id', 'autor_id', 'com_org_id', 'resposta_a', 'creat_al']);
    expect(pla(apartat(8))).toContain("una cua interna n'apunta la conversa, el missatge i qui l'ha escrit i, si n'hi ha, l'organització en nom de la qual escriu i el missatge al qual respon");
    expect(SQL_PUSH).toContain('values (new.fil_id, new.id, new.usuari_id, new.com_org_id, new.resposta_a);');
    expect(pla(apartat(8))).toContain('No guardem les claus de xifratge de la subscripció');
  });

  test('apartat 10: 60 dies sense renovar, deu aparells per persona, la cua d’una hora i l’eixida que retira l’aparell', () => {
    const deu = pla(apartat(10));
    expect(SQL_PUSH).toContain('v_dies := coalesce(v_dies, 60);');
    expect(deu).toContain("si passen 60 dies sense renovar-se (és el termini que fem servir ara; si el canviem, ho direm en una versió nova d'aquest text)");
    /* Els 60 dies són el valor per defecte d'un ajust (1-365) que cap migració no fixa: si una el fixa, el text ha de canviar (R9V-C3-03). */
    expect(SQL_PUSH).toContain("select greatest(1, least(a.valor::integer, 365)) into v_dies\n      from private.ajustos a where a.clau = 'push_xat_dies_dispositiu';");
    const migracions = readdirSync(resolve(process.cwd(), 'supabase/migrations')).filter((nom) => nom.endsWith('.sql'));
    for (const nom of migracions) {
      const sql = llig(`supabase/migrations/${nom}`);
      expect(sql.split("'push_xat_dies_dispositiu'").length, nom).toBe(sql.split("a.clau = 'push_xat_dies_dispositiu'").length);
    }
    expect(SQL_PUSH).toMatch(/order by x\.renovat_al desc, x\.id desc\s+offset 10\);/);
    expect(deu).toContain('Com a molt en guardem deu per persona: si n\'encens un altre, s\'esborra el que fa més temps que no es renova.');
    expect(SQL_PUSH).toContain("delete from private.xat_push_cua c where c.creat_al <= now() - interval '1 hour';");
    expect(deu).toContain('el que fa més d\'una hora, en la neteja següent');
    expect(SQL_PUSH).toMatch(/usuari_id\s+uuid not null references auth\.users \(id\) on delete cascade/);
    /* En eixir, la baixa retira l'aparell del servidor (SessionContext → registre). */
    expect(llig('src/app/contexts/SessionContext.jsx')).toContain('baixaAvisosPushEnEixir');
    expect(deu).toContain('quan tanques la sessió en aquell aparell');
  });

  test('apartat 11: els quatre serveis admesos són els de la llista blanca, i l’avís hi viu com a molt un dia', () => {
    const onze = apartat(11);
    const bloc = onze.split(/<p>/).slice(1).map(pla).find((p) => p.startsWith('Els avisos push del xat'));
    expect(bloc).toBeTruthy();
    expect(SERVEIS_DE_PUSH.map(String)).toEqual([
      String(/^fcm\.googleapis\.com$/), String(/^updates\.push\.services\.mozilla\.com$/),
      String(/(?:^|\.)push\.apple\.com$/), String(/(?:^|\.)notify\.windows\.com$/)
    ]);
    for (const nom of ['Google', 'Apple', 'Mozilla', 'Microsoft']) expect(bloc).toContain(nom);
    expect(bloc).toContain("Només acceptem adreces d'aquests quatre.");
    expect([WEB_PUSH.TTL_S, AVIS_NATIU.TTL_S]).toEqual([86400, 86400]);
    expect(bloc).toContain('que el servei guarda com a molt un dia');
    expect(bloc).toContain('sense cap contingut');
    /* La llista d'encarregats (art. 28) no canvia: els serveis de push van a part. */
    const llista = onze.slice(onze.indexOf('<ul>'), onze.indexOf('</ul>'));
    expect(llista).not.toMatch(/Apple|Mozilla|Microsoft|FCM|APNs/);
  });

  test('apartat 12: per als serveis de push no s’invoca cap garantia sense font; es diu que està pendent de revisió (R9V-C3-02)', () => {
    const dotze = apartat(12);
    const paragrafs = dotze.split(/<p>/).slice(1).map(pla);
    const push = paragrafs.find((p) => p.startsWith('Els serveis de push dels avisos del xat'));
    expect(push).toBeTruthy();
    expect(push).toContain('fora de l\'Espai Econòmic Europeu');
    expect(push).toContain('Encara no hem comprovat amb quina decisió d\'adequació o amb quines garanties es cobrix aquesta transferència: està pendent de revisió legal');
    expect(push).not.toMatch(/Clàusules Contractuals Tipus|Marc de Privacitat|Data Privacy Framework|decisió d'adequació vigent/i);
    /* La frase de les CCT de la 2.4 continua parlant només dels encarregats de l'apartat 11. */
    const cct = paragrafs.find((p) => p.includes('Clàusules Contractuals Tipus'));
    expect(cct).toContain("Si algun dels encarregats de l'apartat 11 tracta dades fora de l'Espai Econòmic Europeu");
    expect(cct).not.toMatch(/push/i);
  });

  /* Sanejament R15 (B1/B3 · P0-01, PRIV-05, P1-03) · El connector R54 és al projecte, però el
     cicle natiu no fa res sense la bandera de build VITE_SDP_PUSH_NATIU==='1': l'app per al mòbil
     encara no porta avisos push, i la 2.5 ho diu. Encendre la bandera (en qualsevol fitxer
     d'entorn d'esta arrel) sense una versió del text posterior a la 2.5 fa caure la prova. */
  test('l’app nativa encara no porta els avisos push: el connector hi és però apagat per la bandera de build; encendre-la demana una versió nova del text', () => {
    const paquet = JSON.parse(llig('package.json'));
    const deps = { ...paquet.dependencies, ...paquet.devDependencies };
    const connectors = Object.keys(deps).filter((nom) => /push-notifications/.test(nom));
    expect(connectors.every((nom) => nom === '@capacitor/push-notifications')).toBe(true);
    if (connectors.length) {
      const natiu = llig('src/natiu/avisosPushNatius.js');
      expect(natiu).toContain("const pushNatiuConfigurat = () => import.meta.env.VITE_SDP_PUSH_NATIU === '1';");
      expect(natiu).toMatch(/export function motiuPushNatiu\([^)]*\) \{\n[^\n]*\n {2}if \(!pushNatiuConfigurat\(\)\) return ESTAT_PUSH_NATIU\.SENSE_CONFIG;/);
      expect(natiu).toMatch(/export function creaAvisosPushNatius\(.*\) \{\n[^\n]*\n {2}if \(!pushNatiuConfigurat\(\)\) return adaptadorSenseConfig\(\);/);
      expect(llig('tooling/vite/banderes-de-capacitat.mjs')).toContain("valors[nom] === '1' ? '1' : ''");
    }
    // Només es mira si la bandera hi és encesa; mai s'escriu cap valor d'un .env a l'eixida.
    const FITXERS_ENV = ['.env', '.env.local', '.env.production', '.env.production.local', '.env.natiu', '.env.natiu.local', '.env.botigues.local'];
    const encesa = FITXERS_ENV.some((fitxer) => { try { return /^\s*(?:export\s+)?VITE_SDP_PUSH_NATIU\s*=\s*['"]?1['"]?\s*$/m.test(llig(fitxer)); } catch { return false; } });
    if (connectors.length && encesa) {
      expect(HTML).not.toMatch(/Versió 2\.[0-5] ·/);
      expect(pla(apartat(8))).not.toContain("A l'aplicació per al mòbil encara no hi ha avisos push");
      return;
    }
    expect(pla(apartat(8))).toContain("A l'aplicació per al mòbil encara no hi ha avisos push");
  });
});
