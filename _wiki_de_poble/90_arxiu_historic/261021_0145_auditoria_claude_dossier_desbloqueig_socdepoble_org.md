---
type: informe
status: esborrany
description: 'Dossier tècnic de Claude (tasca 4 del prompt 261021_0015): diagnòstic verificat del DNS i de l''allotjament de socdepoble.org, vies 0, A i B, missatge per a Sollutia i llista de verificació.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_bb2367a1-ab43-452c-9929-e595b12058ba:c03c2ffc-f850-4f80-9434-8f2c9b2267f2
---
# Dossier de desbloqueig de socdepoble.org: Firebase, SiteGround, Sollutia i DNS

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_bb2367a1-ab43-452c-9929-e595b12058ba:c03c2ffc-f850-4f80-9434-8f2c9b2267f2 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-20T23:38:25.639Z |
| Modificació | 2026-10-20T23:38:25.639Z |
| Propietari | claude |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Code (Opus 5.5), amb dos subagents (recerca i revisió adversarial) |
| Tokens consumits | no mesurat |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- **2026-10-21T01:11:** fets del DNS i de l'HTTP verificats en viu amb ordres de només lectura (dig per TCP, curl, whois).
- **2026-10-21T01:30:** revisió adversarial: 9 defectes corregits (TTL reals de 86400 per TCP, `dig +tcp`, revenedor SiteGround, fitxers ocults de `dist/`, regles de nginx).
- **2026-10-21T01:45:** dossier ancorat a l'Escriptori; `vercel.json` corregit al mateix torn.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

**Resum per al Mestre.** **socdepoble.org no el bloqueja cap servidor de Sollutia:** l'àpex ja apunta al nostre lloc de Firebase (`soc-de-poble`), que servix una compilació de l'11 de juny. **Si tens accés a Firebase, la Via 0 el desbloqueja hui sense tocar el DNS ni escriure a Sollutia.** La zona DNS és a SiteGround (el registrador és Tucows, amb SiteGround Spain com a revenedor); abans d'escriure a ningú, respon les preguntes de la secció 2. Els valors de proveïdors (IPs i CNAME de Vercel, Cloudflare) estan marcats «a confirmar al tauler del proveïdor».

### 1. Diagnòstic verificat

**El domini no el bloqueja cap servidor de Sollutia: l'àpex servix hui el nostre propi lloc de Firebase (`soc-de-poble`) amb una compilació de l'11 de juny de 2026.** Fets comprovats en viu el 2026-10-20 a les 23:11 UTC (261021 01:11 hora local) amb ordres de només lectura. Cap fet del mapa de les 22:52 UTC ha canviat.

#### 1.1 Zona DNS observada

**La zona és als servidors de noms de SiteGround**, i els TTL de la taula són els d'`ns1` i `ns2` per TCP, amb la marca `aa`. **AXFR està refusat**, així que pot haver-hi registres que no es veuen.

- **La xarxa d'este Mac intercepta el DNS per UDP:** `dig @ns1.siteground.net` sense `+tcp` respon des d'una memòria cau, sense `aa` i amb un TTL tallat a 43200. Per això totes les ordres de `dig` d'este dossier porten `+tcp`.

| Nom | Tipus | TTL | Valor | Servei |
|---|---|---|---|---|
| socdepoble.org | NS | 86400 (3600 a la delegació de `.org`) | ns1.siteground.net, ns2.siteground.net | SiteGround |
| socdepoble.org | SOA | 14400 | ns1.siteground.net admins.siteground.com 149 86400 7200 3600000 86400 | SiteGround |
| socdepoble.org | A | 86400 | 199.36.158.100 | **Firebase Hosting** (Fastly) |
| www.socdepoble.org | A | 86400 | 199.36.158.100 | Firebase, **sense domini lligat** |
| socdepoble.org | MX | 86400 | 1 SMTP.GOOGLE.COM. | **Google Workspace** |
| socdepoble.org | TXT | 86400 | google-site-verification=4rT3_…Sdx4 | Google |
| socdepoble.org | TXT | 86400 | " hosting-site=soc-de-poble" (amb l'espai inicial, tal com es servix) | Verificació de Firebase |
| socdepoble.org | TXT | 86400 | v=spf1 +a +mx +ip4:35.214.231.46 include:socdepoble.org.spf.auto.dnssmarthost.net include:_spf.google.com ~all | SPF |
| _dmarc.socdepoble.org | TXT | 86400 | v=DMARC1; p=none; aspf=r; adkim=r; | DMARC |
| default._domainkey.socdepoble.org | CNAME | 14400 | socdepoble.org.default.dkim.auto.dnssmarthost.net. | DKIM de SiteGround |
| mail.socdepoble.org | A | 86400 | 35.214.209.66 | SiteGround |
| ftp.socdepoble.org | A | 86400 | 35.214.209.66 | SiteGround |

- **No hi ha:** AAAA, CAA, DS (DNSSEC sense signar), TXT a www, `_acme-challenge`, `_vercel`, `auth.`, `api.`, `app.` ni `google._domainkey`.
- **Memòria cau negativa:** el mínim entre el TTL del SOA (14400) i el seu MINIMUM (86400), és a dir, **4 hores**.
- **Registrador: Tucows** (IANA 69), amb **revenedor SiteGround Spain S.L.** segons el whois: el domini i la zona penjen, molt probablement, del mateix compte de SiteGround. Creat el 2014-11-05, caduca el **2027-11-05**, estat `ok`, actualitzat al registre el 2026-10-12 (probablement la renovació anual; **a confirmar qui la paga**).

#### 1.2 Qui servix el domini hui

- **Àpex, Firebase:** `HTTP/2 200`, ETag `906486cc…` idèntic al de `soc-de-poble.web.app`, `last-modified: Thu, 11 Jun 2026 00:47:13 GMT` i paquet `/assets/index-D3iZcbxa.js`. Certificat de Google Trust Services WR3, `CN=socdepoble.org`, vàlid fins al **2027-01-03** i renovat sol.
- **Defectes de l'àpex:** **sense CSP ni CORS**. Un recurs absent (`/assets/no-existeix-sonda-123.js`) torna **200 text/html amb `immutable` d'un any**, i `/sw.js` és el **Workbox retirat**, també `immutable`. Venen del `firebase.json` del commit `d1ba6a11`.
- **www, trencat:** rep el certificat `CN=firebaseapp.com`, curl falla perquè el nom no casa i, amb `-k`, torna **404 «Site Not Found»**. www mai es va afegir com a domini de Firebase.
- **Segon origen, SiteGround `35.214.209.66`:** servix per a `socdepoble.org` una SPA amb `server: nginx` i `last-modified: Wed, 10 Jun 2026 03:23:00 GMT`. Té un certificat comodí de Let's Encrypt (`*.socdepoble.org`) fins al **2026-12-25**. Només `mail` i `ftp` hi apunten.
- **Vercel:** `socdepoble.vercel.app` i `soc-de-poble.vercel.app` responen amb una compilació anterior a l'abril de 2026 i `x-frame-options: DENY`. Probablement són nostres; cal confirmar-ho al tauler.

#### 1.3 La lectura de «4 mesos aturat»

**El que porta 4 mesos aturat és el nostre desplegament, no el domini.** Les dues còpies vives són del 10 i de l'11 de juny de 2026, i des d'aleshores ningú ha tornat a desplegar.

- **Cap a l'11 de juny, algú amb accés a la zona va apuntar l'àpex i www a Firebase** i va afegir el TXT `hosting-site`. Qui ho va fer té la clau del desbloqueig.
- **El «servidor de Sollutia congelat»** de l'acta 261020_2345 (línies 98 i 108) és, molt probablement, el lloc de SiteGround del 10 de juny, que ja no rep el trànsit de l'àpex.
- **Que Sollutia gestione la zona és una inferència, no un fet.** Cap pàgina del repositori ni de la Wiki nomena el titular del compte de SiteGround ni del registrador.

#### 1.4 Correccions al pla 261021_0015

- **Línia 67:** el diagnòstic culpa Sollutia; vegeu 1.3.
- **Línia 69, «CNAME o A per a socdepoble.org»:** **l'àpex no pot ser un CNAME**, perquè conviu amb SOA, NS, MX i TXT. A l'àpex només hi va un registre A; el CNAME només és possible a www.
- **Línia 69, «menys de 5 minuts»:** amb un TTL de 86400 s cal baixar-lo **almenys 24 hores abans**, i Vercel deixa uns minuts de **forat de TLS** (5.3).
- **Línia 69, Cloudflare Pages:** no pot servir l'àpex sense moure els NS a Cloudflare (6.4).
- **Línia 70, `wordpress-plugin/builds/socdepoble-connector-v1.1.7.zip`:** **no existix**. El connector real és `261019_1344_wordpress_enxufe_v1.1.7.zip`, i és per a WordPress, no per al domini.
- **Línia 70, `dist/`:** el que hi ha és **vell** (2026-10-19 21:17, 5 commits per darrere d'`a60d6fd3`) i pesa 162 MB.

#### 1.5 Correccions a l'auditoria de Gemini 261021_0800

- **Línies 137 i 142, `<socdepoble-app>`:** l'element real és **`soc-de-poble`** (`src/PedraSecaEmbed.jsx:1221` i el camp `element` de `wordpress-plugin/builds/stable.json`).
- **Línia 142, Via B amb `261019_1344_estatic_spa_v1.1.7.zip`:** eixe paquet **no té `index.html`**. És l'arbre del Web Component (`soc-de-poble/{soc-de-poble.standalone.js,trossos/,assets/…}`, `wordpress-plugin/eines/empaqueta.mjs:17-18`) i servix per a incrustar, no per a l'arrel d'un domini.
- **Línia 138, «Risc Nul»:** ignora el forat de TLS amb HSTS, la CSP sense `data:` a `connect-src` (fins a la correcció d'este torn), el `+a` de l'SPF, el www trencat i els projectes Vercel vells amb `DENY`.
- **Línia 135, «Canviar 2 registres (@ i www)»:** són **tres operacions** (l'A de l'àpex, esborrar l'A de www i crear-hi el CNAME), més la baixada de TTL del dia abans.
- **Línia 136, «Cada git push desplega a l'instant»:** l'HEAD `a60d6fd3` va **245 commits per davant** d'`upstream/main` (`103f549a`, 2026-09-14) i no està pujat. Un desplegament lligat a Git publicaria codi de setembre.
- **Línia 141, «zero risc de 404 en rutes SPA»:** amb el `vercel.json` del repositori és cert per a les rutes, però el risc real és l'invers: **recursos absents que tornen 200 amb HTML**, com fan hui Firebase i els projectes Vercel vells.

### 2. Preguntes per al Mestre abans d'escriure a ningú

**Tres respostes decidixen la via i si Sollutia fa falta.** Amb accés a Firebase, el domini es desbloqueja sense tocar el DNS; amb accés a SiteGround, la zona la pot editar el Mestre mateix.

1. **Tens accés al projecte Firebase `soc-de-poble`** (consola o `firebase deploy`)? En este Mac hi ha una configuració de firebase-tools, que no s'ha llegit.
2. **Tens usuari a Site Tools de SiteGround** per a socdepoble.org? Si en tens, **Sollutia no fa falta per al DNS**.
3. **Qui va canviar el DNS cap al 2026-06-11** (àpex i www a Firebase i TXT `hosting-site`)? Eixa persona té accés a la zona.
4. **Qui paga el domini?** El whois dona com a revenedor SiteGround Spain S.L.: de qui és eixe compte?
5. **Els projectes Vercel `socdepoble` i `soc-de-poble` són nostres?** Només importa per a la Via A.
6. **Quina via tries: 0, A o B?** La decisió tanca la D-CORS de l'auditoria d'infraestructura del 261019 (`_arxiu_wiki_de_poble/historics_2026/261019_fases_a_i_b_webp_i_skills/261019_1715_auditoria_claude_infraestructura.md:238-256`, fora del repositori).
7. **Dones el vistiplau per a compilar `dist/` a l'HEAD** (`npm run build:web` amb l'entorn de producció) i, si cal, per a pujar la branca?

**Arbre de decisió:**

- **Firebase sí** → **Via 0** (secció 4); a la zona només li cal un TXT per a www (8.1).
- **Firebase no, SiteGround sí** → Via A o B, i **els canvis de zona els fa el Mestre**.
- **Cap dels dos** → missatge de la secció 8 a qui gestione la zona.

### 3. Requisits del servidor, per a qualsevol via

**Siga quin siga l'amfitrió, ha de complir estos requisits**, i la llista de la secció 10 els comprova un a un. Els fragments de Firebase, nginx i Apache de les seccions 4 i 7 ja els porten.

#### 3.1 Requisits

| Requisit | Detall | Per què |
|---|---|---|
| **Retorn SPA** | Tot camí que no siga un fitxer i no comence per `/assets/` ni `/fonts/` va a `/index.html` amb 200 | Rutes profundes (`/mur`, `/registre`) |
| **404 real** | `/assets/**` i `/fonts/**` absents donen 404 | Les bessones WebP i el directori de WordPress depenen del 404; si no, es guarda HTML com a JS |
| **`no-cache`** | `/`, `/index.html`, `/sw.js`, `/manifest.webmanifest` i les rutes SPA | Les versions noves arriben a la primera |
| **Immutable** | `public, max-age=31536000, immutable`, només per als recursos amb empremta (el patró de `public/sw.js:78`, als fragments de 4.1, 7.2 i 7.3) | Rendiment sense servir versions velles |
| **CORS a `/assets/**`** | `Access-Control-Allow-Origin: *`, `Access-Control-Expose-Headers: Content-Range, ETag` i `Access-Control-Allow-Headers: Range` | El directori de WordPress llig mitjans de l'àpex (`src/config/politicaDeMitjans.js:79-87`) |
| **Range** | 206 amb `Content-Range` a `/assets/**` i preflight OPTIONS en 2xx | Lector EXIF des d'un altre origen |
| **CSP** | La de `vercel.json:8`, amb `data:` a `connect-src` | `fetch(dataUrl)` de `src/utils/pujadaImatge.js:143-144` |
| **Sense `X-Frame-Options`** | Ni `DENY` ni `SAMEORIGIN` | Trencaria el `frame-ancestors` de Sollutia |
| **Tipus MIME** | `.js` i `.mjs` text/javascript, `.webmanifest` application/manifest+json, `.woff2` font/woff2, `.webp` image/webp | Els navegadors rebutgen mòduls i manifests mal tipats |
| **HTTPS** | http→https 301, www→àpex 301, HSTS, gzip o brotli | Seguretat i pes |
| **No publicar** | Els fitxers ocults (`.DS_Store`, `.DS-Store`, `.keep`); `.htaccess` només a Apache | Brossa i configuració |

#### 3.2 Prerequisits al repositori

- **`vercel.json:8`, `connect-src` sense `data:`:** **corregit per l'orquestrador en este torn (261021)**, en paritat amb `index.html:17`. Comprovat al diff de l'arbre (sense commit).
- **`vercel.json:13-17`, `/assets/(.*)` sense `Access-Control-Allow-Headers: Range`:** **corregit per l'orquestrador en este torn**. El `source` es manté literal per a `tests/standalone-build.test.mjs:1362`.
- **Les dues correccions van al commit de tancament d'este torn** (vegeu l'informe 261021_0140): cal compilar o desplegar des d'eixe commit o posterior; un HEAD anterior publicaria el `vercel.json` vell.
- **`vercel.json` no porta cap regla de `Cache-Control`:** a Vercel els recursos amb empremta ixen amb `public, max-age=0, must-revalidate` (comprovat a `socdepoble.vercel.app`). És correcte però més lent; **si es tria la Via A**, cal afegir la regla `immutable` i provar-la a la previsualització.
- **`public/.htaccess:1-7`:** envia qualsevol fitxer absent, `/assets/*` inclòs, a `/index.html` amb 200. **Es deixa com està**: Firebase i Vercel l'ignoren i `src/data/identitatDual.guarda.test.js` el llig. **La versió corregida és a 7.3** i s'aplica només al servidor de la Via B.
- **`public/auth/callback.html:95`:** porta un script en línia que la CSP de capçalera (`script-src 'self'`) bloqueja. És el relé retirat el 261003 (`src/data/oauthRelay.js:4-12`); **cal confirmar que ningú l'usa**.
- **`dist/` vell:** cal compilar a l'HEAD amb el vistiplau del Mestre, llevar els fitxers ocults (`.DS_Store`, els 69 `.DS-Store` d'`assets/` i `.keep`) i passar l'escàner `tooling/lib/dist-secrets.mjs`.
- **Proves que fixen la forma de `vercel.json`:** `src/hooks/useSEO.test.jsx:294-303`, `tests/standalone-build.test.mjs:1360-1367` i `1377-1387`, `src/pwa/manifest.test.js:143-155` i `src/components/PedraSeca/qualitat.alergens.test.js:453-459`.

### 4. Via 0: tornar a desplegar a Firebase (recomanada)

**Si el Mestre té accés a Firebase, esta via desbloqueja l'àpex hui mateix sense tocar el DNS, sense forat de TLS i sense escriure a Sollutia.** És l'Opció A de la decisió D-CORS. L'única petició a la zona és un TXT per a www.

#### 4.1 firebase.json

**Es basa en el del commit `d1ba6a11`, amb els requisits de la secció 3.** `regex` de Firebase és RE2 i no admet lookahead, per això el retorn SPA usa una glob negada: **cal provar-la al canal de previsualització abans de publicar**.

```json
{
  "hosting": {
    "site": "soc-de-poble",
    "public": "dist",
    "ignore": ["**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "!/@(assets|fonts)/**", "destination": "/index.html" }],
    "headers": [
      { "source": "**", "headers": [{ "key": "Content-Security-Policy", "value": "default-src 'self' data: blob:; style-src 'self' 'unsafe-inline' https:; script-src 'self'; worker-src 'self' blob:; connect-src 'self' data: https: wss: ws://localhost:* http://localhost:*; img-src 'self' data: blob: https:; font-src 'self' https: data:; frame-src 'self' https:; object-src 'none'; base-uri 'self'; frame-ancestors 'self' https://*.socdepoble.org https://socdepoble.org https://*.sollutia.cat https://sollutia.cat https://*.sollutia.com http://localhost:*;" }] },
      { "source": "!/@(assets|fonts)/**", "headers": [{ "key": "Cache-Control", "value": "no-cache" }] },
      { "source": "/assets/**", "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Expose-Headers", "value": "Content-Range, ETag" },
        { "key": "Access-Control-Allow-Headers", "value": "Range" }
      ] },
      { "regex": "^/assets/[^/]+-[A-Za-z0-9_-]{8}\\.(js|mjs|css|woff2?)$", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] }
    ]
  }
}
```

- **`ignore: ["**/.*"]`** deixa fora `.DS_Store`, `.keep` i `.htaccess`.
- **Les regles de `Cache-Control` no se solapen:** `no-cache` fora d'`/assets` i `/fonts`, `immutable` només amb empremta, i la resta d'`/assets/**` (còpies de `public/assets`) es queda amb el valor per defecte de Firebase.
- **On es desa** (arrel del repositori, amb un `.firebaserc` de projecte `soc-de-poble`) **ho decidix el Mestre**; cap prova del repositori el fixa.

#### 4.2 Passos

1. **Anotar la versió de l'11 de juny** a Consola › Hosting › Historial de versions: és el punt de tornada.
2. **Compilar `dist/` a l'HEAD** (3.2).
3. **Comprovar el compte i el lloc** amb les dues primeres ordres de sota.
4. **Publicar al canal `preflight`** i passar la secció 10.3 contra l'adreça que torna l'ordre.
5. **Publicar a `live`** i tornar a passar la secció 10 contra `https://socdepoble.org`.

```bash
firebase login:list
firebase hosting:sites:list --project soc-de-poble
firebase hosting:channel:deploy preflight --project soc-de-poble --expires 3d
firebase deploy --only hosting --project soc-de-poble
```

**El binari `firebase` no és al `PATH` d'este Mac** (`which firebase` no troba res, encara que hi ha la configuració): cal instal·lar firebase-tools o cridar-lo amb `npx firebase-tools` abans del pas 3.

**Visitants que tornen:** porten el Workbox retirat. El `/sw.js` nou eixirà `no-cache` i purga les memòries `workbox-*`, però **no fa `skipWaiting`** (`public/sw.js:38`): la closca vella pot durar fins que es tanquen totes les pestanyes.

#### 4.3 www

- **A la consola de Firebase, afegir `www.socdepoble.org`** com a domini personalitzat **amb redirecció a `socdepoble.org`**.
- La consola mostra els registres que vol. L'A `199.36.158.100` ja hi és; **probablement demana un TXT a www** (`hosting-site=soc-de-poble`) i potser un registre `_acme-challenge` [a confirmar al tauler de Firebase].
- **Eixe TXT és l'única petició a la zona** en esta via (8.1).

#### 4.4 Tornada enrere

- **Consola › Hosting › Historial de versions › Revertir** a la versió anotada al pas 1.
- Per línia d'ordres: `firebase hosting:clone soc-de-poble@<VERSIO> soc-de-poble:live` [sintaxi a confirmar amb `firebase hosting:clone --help`].
- **El DNS no es toca**, així que tornar enrere no té cap espera de TTL.

### 5. Regles comunes per a tocar la zona (vies A i B)

**Les vies A i B canvien registres de la zona; estes regles protegixen el correu de Google Workspace i la tornada enrere.** Abans de cap canvi, **cal una exportació completa de la zona**, perquè AXFR està refusat.

#### 5.1 Registres que no es toquen

- **NS i SOA.** Tampoc es canvien els servidors de noms a Tucows.
- **MX** `1 SMTP.GOOGLE.COM.`: la bústia socdepoble@ viu ací.
- **TXT** `google-site-verification=…`, `v=spf1 …` i ` hosting-site=soc-de-poble`. L'últim cal per a tornar a Firebase; **no se li lleva l'espai**.
- **`_dmarc`** i **`default._domainkey`**.
- **`mail`** i **`ftp`** (A `35.214.209.66`).
- **No s'afig cap AAAA ni cap CAA.** Una CAA mal feta trencaria les renovacions de Firebase (`pki.goog`) o de Let's Encrypt.
- **SPF `+a`:** autoritza com a remitent la IP de l'àpex, que amb Vercel seria una IP compartida. Llevar-lo és **un canvi a banda**, amb el vistiplau de qui porta el correu, **mai dins del tall**.

#### 5.2 Calendari de TTL

1. **Dia D-1 (almenys 24 h abans; millor 48 h):** baixar a **300 s** el TTL de `socdepoble.org A` i de `www.socdepoble.org A` (ara 86400) i demanar l'exportació de la zona.
2. **Abans del tall:** comprovar amb `dig +tcp @ns1.siteground.net` que el TTL és 300 (10.1).
3. **Dia D, a hora de poc trànsit:** canviar l'A de l'àpex. A www, **esborrar l'A i crear el registre nou en la mateixa sessió**, perquè la memòria cau negativa és de 4 h.
4. **Tot seguit:** passar la secció 10 sencera.
5. **72 h després:** tornar a pujar el TTL a 3600.
6. **Durant 14 dies:** mantindre el lloc de Firebase, el seu domini lligat i el TXT `hosting-site`.

#### 5.3 Forat de TLS i HSTS

- **Via A:** Vercel emet el certificat per HTTP-01 **només quan l'A ja hi apunta**; cal comptar amb **uns minuts d'error de certificat**.
- **HSTS de l'àpex** (`max-age=31556926`, un any): **qui ja ha visitat el lloc no pot saltar-se l'error**. Per això el tall es fa a hora de poc trànsit i es comprova al moment.
- **Via B a SiteGround: sense forat.** El certificat comodí de Let's Encrypt ja cobrix l'àpex fins al 2026-12-25 i es renova sol.
- **Via 0:** ni forat ni canvi.

### 6. Via A: Vercel

**Vercel servix la SPA amb el `vercel.json` del repositori i el DNS hi apunta.** Dona desplegament continu, però depén de pujar la branca, deixa un forat de TLS i posa la IP compartida de Vercel dins de l'SPF.

#### 6.1 Preparació a Vercel

1. **Triar el projecte.** `socdepoble` i `soc-de-poble` publiquen una compilació vella amb `DENY`: **no s'hi lliga el domini fins que tinguen un desplegament nou**.
2. **Configurar:** framework Vite, ordre `npm run build:web`, eixida `dist` i les variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_DATA_MODE` i `VITE_TENANT_ID`.
3. **Desplegar** des de Git (cal pujar la branca; decidix el Mestre) o amb `vercel deploy` des d'una còpia neta de l'HEAD, **amb les correccions de `vercel.json` ja en un commit** (3.2). `vercel.json` ha d'estar a l'arrel desplegada.
4. **Provar la previsualització** amb la secció 10.3.
5. **Afegir els dominis** `socdepoble.org` (principal) i `www.socdepoble.org` (redirecció 308 a l'àpex) i **copiar els valors exactes** que mostre el tauler.
6. **Termes:** el pla Hobby és per a ús no comercial [a confirmar al tauler del proveïdor].

#### 6.2 Registres

| Nom | Ara | Després | TTL |
|---|---|---|---|
| socdepoble.org | A 199.36.158.100 | A `<IP del tauler>`; documentada `76.76.21.21`, i els comptes nous poden mostrar el rang `216.198.79.x` [a confirmar al tauler del proveïdor] | 300 |
| www.socdepoble.org | A 199.36.158.100 | Esborrar l'A i crear CNAME `<valor del tauler>`; documentat `cname.vercel-dns.com.`, o un `<hash>.vercel-dns-0xx.com.` propi [a confirmar al tauler del proveïdor] | 300 |
| _vercel.socdepoble.org | No existix | TXT `vc-domain-verify=…`, només si el tauler ho demana [a confirmar al tauler del proveïdor] | 300 |

#### 6.3 Tornada enrere

- **Tornar l'àpex i www a A `199.36.158.100`**, amb TTL 300.
- **El lloc de Firebase, el domini lligat i el TXT `hosting-site` es mantenen 14 dies.** El certificat de Firebase dura fins al 2027-01-03, però **no es renovarà mentre el DNS apunte a un altre lloc**.

#### 6.4 Per què no Cloudflare Pages

- www podria anar amb un CNAME `<projecte>.pages.dev`, però **l'àpex exigix que la zona siga de Cloudflare**, és a dir, canviar els NS a Tucows [a confirmar al tauler del proveïdor].
- Això obliga a recrear abans tots els registres de 1.1 i **posa en risc el correu**. **No es recomana.**

### 7. Via B: Sollutia o SiteGround servix els fitxers

**Els fitxers es pugen a un servidor que no controlem i l'àpex hi apunta.** Si és el lloc de SiteGround que ja existix, no hi ha forat de TLS; el preu és **una pujada manual a cada versió**.

#### 7.1 Què es lliura i què no

- **Sí:** un `dist/` nou de l'HEAD (SPA completa, uns 162 MB i 744 fitxers, amb els 110 MB d'`assets/uploads` que llig el directori de WordPress), sense cap fitxer ocult (`.DS_Store`, `.DS-Store`, `.keep`): el bloc nginx de 7.2 servix tot el que hi haja dins d'`/assets/`.
- **Sí:** el `.htaccess` de 7.3 o el bloc nginx de 7.2.
- **Per a WordPress, no per al domini:** `wordpress-plugin/builds/261021_0137_wordpress_enxufe_v1.1.8.zip` (compilat i signat en este torn; la v1.1.7 és `261019_1344_wordpress_enxufe_v1.1.7.zip`).
- **No:** `261019_1344_estatic_spa_v1.1.7.zip` com a arrel del lloc; és l'arbre del Web Component `soc-de-poble`.
- **No cal WordPress ni PHP** per a l'SPA.

#### 7.2 nginx

**Totes les capçaleres es posen al bloc `server`**, perquè un `add_header` dins d'un `location` anul·la les heretades. Un valor buit d'un `map` fa que nginx no envie eixa capçalera.

- **Els `map` van al context `http`.** Els dos `server` de 443 porten `ssl_certificate` i `ssl_certificate_key` (el comodí `*.socdepoble.org` o el del lloc).
- **Tipus MIME:** cal comprovar que el `mime.types` del servidor porta `mjs`, `webmanifest`, `woff2` i `webp`, i afegir-los-hi si falten. Un bloc `types {}` dins del `server` substituiria tota la taula.
- **`Cache-Control` va sense `always`:** així un 404 d'un recurs amb empremta (una pujada manual a mitges) no queda en memòria cau un any com a `immutable`.
- **`http2 on`** demana nginx 1.25.1 o posterior; en una versió anterior es lleva i es posa `listen 443 ssl http2;`.

```nginx
map $uri $sdp_cache {
    "~^/assets/[^/]+-[A-Za-z0-9_-]{8}\.(js|mjs|css|woff2?)$"  "public, max-age=31536000, immutable";
    "~^/(assets|fonts)/"                                        "";
    default                                                     "no-cache";
}
map $uri $sdp_acao { "~^/assets/" "*";                   default ""; }
map $uri $sdp_aceh { "~^/assets/" "Content-Range, ETag"; default ""; }
map $uri $sdp_acah { "~^/assets/" "Range";               default ""; }

server {
    listen 80;
    server_name socdepoble.org www.socdepoble.org;
    return 301 https://socdepoble.org$request_uri;
}
server {
    listen 443 ssl;
    server_name www.socdepoble.org;
    return 301 https://socdepoble.org$request_uri;
}
server {
    listen 443 ssl;
    http2 on;
    server_name socdepoble.org;
    root /ruta/al/dist;
    gzip on;
    gzip_types text/css text/javascript application/javascript application/json application/manifest+json image/svg+xml;
    add_header Content-Security-Policy "default-src 'self' data: blob:; style-src 'self' 'unsafe-inline' https:; script-src 'self'; worker-src 'self' blob:; connect-src 'self' data: https: wss: ws://localhost:* http://localhost:*; img-src 'self' data: blob: https:; font-src 'self' https: data:; frame-src 'self' https:; object-src 'none'; base-uri 'self'; frame-ancestors 'self' https://*.socdepoble.org https://socdepoble.org https://*.sollutia.cat https://sollutia.cat https://*.sollutia.com http://localhost:*;" always;
    add_header Strict-Transport-Security "max-age=31556926" always;
    add_header Cache-Control $sdp_cache;
    add_header Access-Control-Allow-Origin $sdp_acao always;
    add_header Access-Control-Expose-Headers $sdp_aceh always;
    add_header Access-Control-Allow-Headers $sdp_acah always;
    location ^~ /assets/ {
        if ($request_method = OPTIONS) { return 204; }
        try_files $uri =404;
    }
    location ^~ /fonts/ { try_files $uri =404; }
    location ~ /\. { return 404; }
    location / { try_files $uri $uri/ /index.html; }
}
```

#### 7.3 Apache (.htaccess corregit)

**Substituïx el `public/.htaccess` actual només al servidor; el del repositori es queda com està.** SiteGround servix amb nginx davant d'Apache i llig `.htaccess`.

- **Ordre de les regles:** primer www cap a l'àpex, després `/assets` i `/fonts` fora de l'SPA (un absent dona 404) i, al final, el retorn SPA per a la resta de camins que no són fitxers ni carpetes.
- **http→https:** amb l'opció «HTTPS Enforce» de Site Tools [a confirmar al tauler del proveïdor].
- **Si `Options -MultiViews` dona un error 500**, el servidor no ho permet i es lleva la línia.

```apache
Options -MultiViews
RewriteEngine On
RewriteBase /
RewriteCond %{HTTP_HOST} ^www\.socdepoble\.org$ [NC]
RewriteRule ^ https://socdepoble.org%{REQUEST_URI} [R=301,L]
RewriteRule ^(assets|fonts)/ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ /index.html [L]
<IfModule mod_headers.c>
  Header always set Content-Security-Policy "default-src 'self' data: blob:; style-src 'self' 'unsafe-inline' https:; script-src 'self'; worker-src 'self' blob:; connect-src 'self' data: https: wss: ws://localhost:* http://localhost:*; img-src 'self' data: blob: https:; font-src 'self' https: data:; frame-src 'self' https:; object-src 'none'; base-uri 'self'; frame-ancestors 'self' https://*.socdepoble.org https://socdepoble.org https://*.sollutia.cat https://sollutia.cat https://*.sollutia.com http://localhost:*;"
  Header always set Strict-Transport-Security "max-age=31556926"
  <If "%{REQUEST_URI} =~ m#^/assets/#">
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Expose-Headers "Content-Range, ETag"
    Header always set Access-Control-Allow-Headers "Range"
  </If>
  <If "%{REQUEST_URI} =~ m#^/assets/[^/]+-[A-Za-z0-9_-]{8}\.(js|mjs|css|woff2?)$#">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </If>
  <FilesMatch "^(index\.html|sw\.js|manifest\.webmanifest)$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
</IfModule>
AddType text/javascript .js .mjs
AddType application/manifest+json .webmanifest
AddType font/woff2 .woff2
AddType image/webp .webp
```

#### 7.4 DNS i tornada enrere

1. **Còpia de seguretat** del `public_html` actual (la compilació del 10 de juny) abans de pujar res.
2. **Pujar** el `dist/` i el `.htaccess`, i **provar-ho amb `curl --resolve`** (10.1) abans de tocar el DNS.
3. **DNS:** l'àpex i www a A `35.214.209.66`, la IP del lloc a Site Tools [a confirmar al tauler del proveïdor], amb el calendari de 5.2.
4. **Tornada enrere:** restaurar la còpia de `public_html` o tornar els dos A a `199.36.158.100`.

### 8. Missatge per a Sollutia o el titular de la zona

**Només s'envia després de respondre les preguntes de la secció 2, i a qui gestione de veritat la zona.** Hi ha dos variants: la curta per a la Via 0 i la del canvi de registres per a la Via A. La Via B a SiteGround usa la segona amb A `35.214.209.66` als dos noms, sense CNAME ni `_vercel`.

#### 8.1 Via 0: un TXT per a www

```text
Assumpte: socdepoble.org · un registre TXT per a www (el correu no es toca)

Bon dia,

La zona DNS de socdepoble.org és als servidors de noms de SiteGround (ns1/ns2.siteground.net). Vos demanem un sol canvi a Site Tools › Domini › Editor de zona DNS:

- Afegir un TXT a www.socdepoble.org amb el valor <valor que mostra Firebase>, TTL 3600.

No cal tocar cap altre registre. Si ens podeu enviar una exportació completa de la zona, ens ajudarà a documentar-la. Si ho preferiu, afegiu-nos com a col·laboradors del lloc a SiteGround i ho fem nosaltres.

Gràcies,
<signatura>
```

#### 8.2 Via A: dos registres en dos dies

```text
Assumpte: socdepoble.org · 2 registres DNS en dos dies (el correu no es toca)

Bon dia,

La zona DNS de socdepoble.org és als servidors de noms de SiteGround (ns1/ns2.siteground.net). Vos demanem estos canvis a Site Tools › Domini › Editor de zona DNS:

1. Hui: baixar a 300 s el TTL de socdepoble.org A i de www.socdepoble.org A (ara 86400) i enviar-nos una exportació completa de la zona.
2. El <DATA>, almenys 24 hores després del punt 1, a les <HORA>:
   - socdepoble.org: A 199.36.158.100 → A <IP>, TTL 300;
   - www.socdepoble.org: esborrar l'A 199.36.158.100 i crear tot seguit un CNAME <CNAME>, TTL 300;
   - només si vos ho indiquem: TXT _vercel.socdepoble.org = <VALOR>.
3. No toqueu cap altre registre: NS, SOA, MX (SMTP.GOOGLE.COM), els TXT google-site-verification, v=spf1 i hosting-site, _dmarc, default._domainkey, mail i ftp. No afegiu AAAA ni CAA.
4. Si cal tornar enrere: els dos noms a A 199.36.158.100.

Si ho preferiu, afegiu-nos com a col·laboradors del lloc a SiteGround i ho fem nosaltres.

Gràcies,
<signatura>
```

### 9. Supabase Auth i Google OAuth

**El canvi de domini no toca el codi, però sí dos taulers que només viuen en línia.** GoTrue torna **en silenci** a la Site URL quan el `redirect_to` no casa (`src/data/oauthRelay.js:41-48`), així que un error ací no fa soroll.

1. **Copiar abans, literalment,** la Site URL i les Redirect URLs de Supabase › Authentication › URL Configuration (projecte `adjlvwtxhpclgmnsvwpm`) a un document de l'Escriptori.
2. **Site URL:** `https://socdepoble.org`.
3. **Redirect URLs:** hi ha d'haver `https://socdepoble.org/registre\?**`, amb el `?` escapat.
4. **Mai** `https://socdepoble.org/**`, ni comodins de host (`https://*.socdepoble.org/**`), ni `localhost` o `capacitor://` (`_investigacio_ia_de_poble/261003_1330_onada4_claude/REDIRECT_URLS_GOTRUE.txt:167-173`). `_wiki_de_poble/04_escriptori/02_investigacio_ia/261003_1330_empaquetat_mobil_claude/ARQUITECTURA.txt:322-323` diu el contrari i s'equivoca.
5. **`auth.socdepoble.org`:** cap entrada; és el backend i no té DNS.
6. **CORS de Supabase:** cap canvi; ja respon `access-control-allow-origin: *` a l'origen `https://socdepoble.org`.
7. **Google Calendar:** al client OAuth de Google Cloud, **URI de redirecció autoritzat exacte** `https://socdepoble.org/auth/calendari-google.html` (`src/sections/calendari/fonts/configFonts.js:20-28,35`).
8. **Google com a proveïdor de Supabase:** el seu URI de redirecció és `https://adjlvwtxhpclgmnsvwpm.supabase.co/auth/v1/callback` i no canvia amb el domini. Cal mirar que `socdepoble.org` siga als dominis autoritzats de la pantalla de consentiment [a confirmar al tauler del proveïdor].
9. **Verificació:** el procediment de `REDIRECT_URLS_GOTRUE.txt:176-220`. L'enllaç de recuperació ha de portar `sdp_auth=recuperacio`, no la Site URL.

### 10. Llista de verificació

**Ordres de només lectura, sense enviar cap dada.** Valen per a qualsevol via; abans del tall només canvia l'adreça (canal de Firebase, previsualització de Vercel o `--resolve` a SiteGround). Les de `dist/` i `vercel.json` s'executen des de l'arrel del repositori.

#### 10.1 Abans del tall

```bash
dig +tcp +noall +answer socdepoble.org A @ns1.siteground.net       # TTL 300 a les vies A i B
dig +tcp +noall +answer www.socdepoble.org A @ns1.siteground.net
curl -sI --resolve socdepoble.org:443:35.214.209.66 https://socdepoble.org/ | grep -iE '^(HTTP|last-modified|content-security)'   # Via B
grep -c "connect-src 'self' data:" vercel.json                # 1
grep -c 'Access-Control-Allow-Headers' vercel.json            # 1
```

#### 10.2 Després: DNS, TLS i capçaleres

```bash
for r in 1.1.1.1 8.8.8.8 ns1.siteground.net; do dig +tcp +short socdepoble.org A @$r; dig +tcp +short www.socdepoble.org CNAME @$r; done
dig +tcp +short MX socdepoble.org @ns1.siteground.net                       # 1 SMTP.GOOGLE.COM.
dig +tcp +short TXT socdepoble.org @ns1.siteground.net                      # els mateixos 3 TXT
dig +tcp +short TXT _dmarc.socdepoble.org @ns1.siteground.net
dig +tcp +short CNAME default._domainkey.socdepoble.org @ns1.siteground.net
dig +tcp +short A mail.socdepoble.org @ns1.siteground.net                   # 35.214.209.66
curl -svI https://socdepoble.org 2>&1 | grep -iE 'subject:|issuer:|expire date'
curl -svI https://www.socdepoble.org 2>&1 | grep -iE 'subject:|issuer:|expire date'
curl -sI https://socdepoble.org | grep -iE '^(HTTP|server|content-security-policy|strict-transport|x-frame-options|cache-control|last-modified|etag)'
curl -sI https://www.socdepoble.org | grep -iE '^(HTTP|location)'   # 301/308 a https://socdepoble.org/
curl -sI http://socdepoble.org | grep -iE '^(HTTP|location)'        # 301 a https
```

- **La CSP ha de contindre `connect-src 'self' data:`** i no hi ha d'haver `x-frame-options`.
- **A la Via 0**, `last-modified` ha de ser posterior a l'11 de juny i l'ETag, diferent de `906486cc…`.

#### 10.3 Després: rutes, memòria cau i CORS per al WordPress

```bash
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' https://socdepoble.org/assets/no-existeix-sonda-123.js   # 404
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' https://socdepoble.org/fonts/no-existeix.woff2          # 404
for p in / /mur '/registre?mode=entrar' /auth/calendari-google.html /manifest.webmanifest /sw.js /robots.txt /sitemap.xml; do curl -s -o /dev/null -w "$p %{http_code} %{content_type}\n" "https://socdepoble.org$p"; done
diff <(curl -s https://socdepoble.org/ | grep -o '/assets/index-[^"]*\.js') <(grep -o '/assets/index-[^"]*\.js' dist/index.html)   # la mateixa compilació
a=$(curl -s https://socdepoble.org/ | grep -o '/assets/index-[^"]*\.js' | head -1); curl -sI "https://socdepoble.org$a" | grep -i cache-control   # immutable (Vercel sense regla: max-age=0, must-revalidate)
curl -sI https://socdepoble.org/sw.js | grep -iE 'cache-control|content-type'   # no-cache (Vercel: max-age=0, must-revalidate)
curl -sI https://socdepoble.org/mur | grep -i cache-control                      # no-cache (Vercel: max-age=0, must-revalidate)
u=https://socdepoble.org/assets/system/ui/og-socdepoble-1200x630.png
curl -sI -H 'Origin: https://gentdelatorre.net' "$u" | grep -i access-control   # ACAO * i Expose
curl -s -o /dev/null -D - -X OPTIONS -H 'Origin: https://gentdelatorre.net' -H 'Access-Control-Request-Method: GET' -H 'Access-Control-Request-Headers: range' "$u" | grep -iE '^(HTTP|access-control)'   # 2xx i Allow-Headers Range
curl -s -o /dev/null -D - -H 'Range: bytes=0-99' -H 'Origin: https://gentdelatorre.net' "$u" | grep -iE '^(HTTP|content-range|access-control)'   # 206 i ACAO
```

#### 10.4 Comprovacions a mà

1. **Entrada amb correu i amb Google** des de `https://socdepoble.org/registre`, en un perfil de navegador net.
2. **Correu de recuperació:** l'enllaç porta `redirect_to=…sdp_auth=recuperacio`, no la Site URL.
3. **Pujada d'una imatge**, que passa pel camí `fetch(dataUrl)`.
4. **Visitant que torna amb el Workbox vell:** després de tancar totes les pestanyes, DevTools › Application mostra el `/sw.js` nou i cap memòria `workbox-*`.
5. **Un correu extern a socdepoble@socdepoble.org** arriba amb SPF `pass`.
6. **El directori de WordPress** mostra les imatges de `towns/` i `events/` (objectiu: 181 de 181).

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- **DNS:** `dig +tcp +noall +answer` contra `ns1.siteground.net` i `ns2.siteground.net` (resposta `aa`), i `whois socdepoble.org`.
- **HTTP i TLS:** `curl -sI` i `curl -svI` a l'àpex, a www i a `35.214.209.66` amb `--resolve`; ETag, `last-modified` i certificats anotats a 1.2.
- **Repositori:** `node --test --test-name-pattern='vercel|allotjament' tests/standalone-build.test.mjs` → 2/2; `npx vitest run src/hooks/useSEO.test.jsx src/pwa/manifest.test.js src/components/PedraSeca/qualitat.alergens.test.js src/data/identitatDual.guarda.test.js` → 105/105.
- **No verificat:** la glob negada i `hosting:clone` de Firebase (no hi ha CLI de Firebase en este Mac) i les capçaleres reals de SiteGround darrere del seu nginx.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Cap canvi extern:** este dossier no ha escrit a cap tauler, DNS ni proveïdor, ni ha enviat cap missatge. Tota acció de la secció 8 és del Mestre.
- **Qui controla la zona, el registrador i Firebase** no consta enlloc del repositori: les respostes de la secció 2 són del Mestre (`requires_human_decision: true`).
- **Valors de proveïdors** (Vercel, Cloudflare, Firebase www) són de documentació pública i s'han de confirmar al tauler en el moment d'actuar.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261021_0015_pla_implementacio_llancament_apps_i_desbloqueig_sollutia]]
- [[261021_0140_auditoria_claude_llancament_apps_i_sollutia]]
- [[261021_0800_auditoria_gemini_llancament_apps_i_sollutia]]
- [[ADR-2026-09-SOLLUTIA-MODEL-B]]
- [[soci_sollutia]]
