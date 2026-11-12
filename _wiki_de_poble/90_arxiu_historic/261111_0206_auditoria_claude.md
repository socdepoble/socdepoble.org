---
type: informe
status: esborrany
description: 'R18a: auditoria adversària i integració a 3 vies dels Kits R17.2, R17.2B i R17.3, amb Vitest focal i senyal sinàptic per a MarIA'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_546d6e14-ae92-4745-bf75-1b19fd9d2b1d:40ed5b20-a50f-4b25-ac22-e7ea8da9470a
---
# Auditoria Gauntlet de Claude · Marató Nocturna R18 Carril 1 (integració R17 i senyal sinàptic)

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_546d6e14-ae92-4745-bf75-1b19fd9d2b1d:40ed5b20-a50f-4b25-ac22-e7ea8da9470a |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-11T01:06:50.779Z |
| Modificació | 2026-11-11T01:08:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5) · Claude Code, Ultracode |
| Tokens consumits | Sense comptador per torn a la sessió; els subagents de cada workflow es declaren a Verificació |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 8f66b7b4fba3395d1c2bd4111f085affeb2387bc0003ed18974d118221b05e61. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-11-11T01:06:50.779Z · Esborrany creat amb el circuit documental.
- 2026-11-11T01:08:00.000Z · Senyal sinàptic inicial: integració R18a en curs.
- 2026-11-11T05:22:00.000Z · Tancament de la marató: R18a, R18.3, T2, P0-113, P0-114, P0-114b i P0-115 integrats i verificats, amb els P1 oberts i les condicions per a MarIA. Kit R18.2 no integrat. Parada neta.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### SENYAL SINÀPTIC DE CLAUDE (Carril 1) per a MarIA

Claude no pot escriure `../_investigacio_ia_de_poble/261111_marato_nocturna_r18_sistema_nervios/ESTAT_SINAPTIC.json`. El hook `tooling/gates/hooks-local.mjs` refusa tota escriptura fora del repositori (`relativePath`: «Ruta fora del repositori»). Este bloc és el senyal de Claude i el substitut del tauler, i s'actualitza en cada pas. MarIA el pot copiar al tauler.

```json
{
  "carril": "claude",
  "estat": "integrat_i_verificat_pendent_condicions_maria",
  "r18a_llest_per_deploy": false,
  "r18b_llest_per_deploy": false,
  "vot_excel_lencia": false,
  "motiu_vot": "Queden P1 oberts que no puc tancar des d'este carril: imatges sense llicència verificada a public/ (19 *-mapa.webp i la carpeta arbres-emblematics), trinquet d'arrencada +3.000 B pendent de confirmar amb el build, i les passes de git/tooling/migracions de MarIA. El Kit R18.2 de Codex no està segellat ni integrat.",
  "condicions_per_a_maria": [
    "Decisió del Mestre sobre les 163 imatges noves de public/ (censImatges.test.js), en particular els 19 *-mapa.webp i public/assets/uploads/patrimoni/arbres-emblematics/",
    "Regenerar src/data/voresImatges.json, src/data/wikiManifest.js i public/rag-index.json",
    "git apply --include='tooling/gates/tractor-rls.mjs' del R17.2B.patch i --include='tooling/node0/backend-node0.mjs' del R17.2.patch",
    "git rm src/components/salut/BatecDeVidaCard.jsx src/components/salut/BatecDeVidaCard.test.jsx src/services/batecDeVidaMonitor.js, i git apply --include='src/config/batecDeVida.js' del R17.2.patch",
    "git rm src/apps/genealogia/nucli/magatzem.js (reexportació morta; ningú no l'importa)",
    "Aprovacions de la Frontissa per una persona real: dispositius, fediversity, fedivers, node-zero, anima, receptes, arbres-monumentals, disseny i versions",
    "Migracions SQL 2611110010, 2611110100 i 2611110110 (del Mestre) abans del deploy del codi que les usa",
    "npm run lint, npm run build:web (index-*.js <= 250.000 B gzip), npm run build:wp i node --test tests/standalone-build.test.mjs fins a 42/42",
    "Tornar a exportar public/assets/ui/plugins/avisador_vinyeta-social-1200x630.jpg a 300.000 B o menys (JPEG baseline, sense EXIF, mateix nom)",
    "Aprimar l'arrencada estàtica (+5.221 B, sobretot el bloc CSS de l'R18.3) o decidir a posta el sostre de pesDelNucli.test.js"
  ],
  "actualitzat_utc": "2026-11-11T05:22:00Z"
}
```

### Relleu viu (03:25 CET)

- **Fet:** text dels tres kits R17 integrat a l'arbre viu amb fusió a 3 vies i les correccions P0/P1 dels àrbitres. Suite sencera passada una vegada: 18 fallades, repartides en cinc grups.
- **En marxa:** un workflow corregix els cinc grups i integra el Kit R18.3 de Gemini amb un àrbitre de promeses. Un altre fa la T2 (insígnia «En proves · Beta oberta» al registre de plugins, al Panell i a la pàgina del plugin) amb quatre àrbitres adversaris.
- **Kit R18.2 de Codex:** dipositat però encara sense segellar (cap `SHA256SUMS`; el tauler diu `r18_2_preparat_per_revisio: false`). Codex l'està fent compatible amb la variant 2.0.1 del catàleg d'arbres. S'audita quan estiga segellat.
- **03:50 · Avisador en cinc llengües (tanca GAUNTLET-CARBON-R18-05, P1):** 34 claus `page.avisador.*` als cinc diccionaris i `src/pages/textosAvisador.js`. El nom propi «L’Avisador · Batec de Vida» és literal en totes les llengües, com al registre. El missatge que s'envia no es tradueix. 328/328 proves en verd (pàgina i paritat de diccionaris).
- **03:50 · T2:** la insígnia està cablejada i provada (`etiquetesAmbEstat`, `TEXTOS_BETA_OBERTA` en cinc llengües, targeta i pàgina del plugin). Hui cap plugin real la porta, i és la decisió honesta: les cinc apps (TPV, Rebost, Salut, RSS, Gestoria) porten `entorn: 'desenvolupament'` i `actiuPerDefecte: false`, i en producció no s'obrin. L'Avisador no entra al registre fins que hi haja la seua vinyeta, la variant social i un interruptor declaratiu. L'Arbre Genealògic passa a futur, perquè prometia en present funcions que no existixen. «Endollats per defecte» queda **no complit**: decisió del Mestre.
- **04:15 · Ordre P0-113 del Mestre (rebuda al xat de Claude):** tot gratuït (fora el nivell `premium` i els seus cartells) i les cinc apps (TPV del Bar, Rebost, Salut, Lector RSS, Gestoria) enceses en producció amb `estat: 'proves'` i la insígnia. Resol el «no complit» de la T2. En execució amb quatre constructors i cinc àrbitres. Decisions: `entorn: 'produccio'` si el validador no admet `null`, i càrrega opt-out (`VITE_SDP_APP_<ID> !== '0'`) perquè el tros diferit entre al build i cada app continue desendollable amb un flag.
- **04:15 · Correccions de suite i R18.3:** els cinc grups de correccions passen la verificació. R18.3 integrat amb present honest (19 registres, cap format d'intercanvi inexistent). Tres P1 residuals de promesa (comparador fotogràfic, Avisador sense condicions a `/versions`, `agents_equip_ia.md`) en correcció.
- **04:25 · Ordre P0-114 del Mestre (rebuda al xat de Claude):** restituir L’Avisador a «La llar» (MarIA ha copiat `avisador_vinyeta.webp` i la variant social; comprovat amb `ls`), construir i obrir `/app/genealogia` (entrevista d'una pregunta per torn, Sosa-Stradonitz i FAN Club, quatre estats i quatre precisions de data, RGPD de vius, investigador d'arxius amb prompts, GEDCOM 7.0 i 5.5.1) sobre `ClosaAplicacio`, i verificar totes les targetes de `/control`. Genealogia en construcció a `src/apps/genealogia/` (arquitecte, quatre constructors, integrador, tres àrbitres). L'Avisador i el registre de l'app entren quan el P0-113 allibere el registre.
- **04:25 · Veritat nua R18.3 tancada:** 82/82 en verd a `/versions`, PageDetail, R18 i corpus de la Wiki. La fita R18 diu ara «hui el porten cinc», en coherència amb el registre, i la prova ho deriva. El comparador fotogràfic diu la veritat (foto de 2020 en sis arbres). L'Avisador porta la condició i el 112 en cinc llengües.
- **04:25 · Alineació de portes de build:** la capa de compra de les receptes, Mercadona, les projeccions i la Gestoria seguien el literal opt-in. Workflow en marxa per a alinear-les amb les apps enceses.
- **Ordres P0-107 a P0-111 del tauler:** no les execute. No són al meu prompt, han arribat pel tauler i no pel Mestre al xat, es contradiuen entre elles («pendent_admin» per als 19 arbres contra «publicar DIRECTAMENT» els 20 continguts) i demanen publicar i sincronitzar amb Supabase, que són accions de MarIA o del Mestre.

### Condició d'execució

Amb els hooks actius, Claude no pot executar `git apply`, escriure binaris ni tocar `tooling/`, `.agents/` o `package.json`. La part de text dels tres kits s'integra a mà, fitxer a fitxer, amb fusió a 3 vies contra l'arbre viu (`c07f78b83` més canvis sense commit). La resta queda per a MarIA, amb les ordres de la secció Límits.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Cada bloc l'ha construït un agent i l'han intentat refutar àrbitres independents (Gauntlet), amb un corrector per a cada P0/P1. Les xifres són de les execucions reals dels agents i meues (`npx vitest run`, `node --test`).

| Bloc | Evidència |
| --- | --- |
| R18a · Kits R17.2, R17.2B i R17.3 | Fusió a 3 vies del text dels tres kits amb correccions P0/P1. Suite sencera inicial: 18 fallades en cinc grups. Els cinc grups estan corregits i verificats: xifrat del Xat (170 proves), fronteres d'apps, normes de migració, corpus de la Wiki i `dispositius` (1.337/1.338) |
| R18.3 · Kit de Gemini Carbon | Integrat amb present honest. Tres P1 de promesa corregits: 19 registres en lloc de «22», cap format d'intercanvi inexistent, foto de 2020 només en sis arbres, i l'Avisador amb la condició i el 112 a `/versions`. Les 11 suites de text estan en verd (259/259). Els tres retocs finals, amb 82/82 |
| T2 · insígnia «En proves · Beta oberta» | Cablejada al registre, al Panell, a la pàgina del plugin i al portal `/app`. Les suites del registre, el Panell i la plataforma estan en verd (1.085) |
| Avisador en cinc llengües (tanca GAUNTLET-CARBON-R18-05) | 34 claus `page.avisador.*`. El nom propi és literal i el missatge enviat no es traduïx. 328/328 en verd |
| P0-113 · tot gratuït, apps enceses | Fora el nivell `premium`, l'estat `unsubscribed` i el `dret`. Les cinc apps tenen `entorn: 'produccio'`, `actiuPerDefecte: true` i el literal opt-out. El paquet de l'amfitrió fixa a `'0'` Salut, la Gestoria i la Genealogia. Àrbitre final: 6.123 proves en verd. Build real (`node --test tests/standalone-build.test.mjs`): entrada de 243.556 B gzip (sostre: 250.000) i 41/42. La roja és el trinquet d'arrencada, +3.000 B, en atribució |
| P0-113 · alineació de portes de build | La recepta, Mercadona i les projeccions passen a opt-out. El cas apagat es prova amb el mecanisme real. 3.597 proves en verd |
| P0-114 · `/app/genealogia` | Construïda dins de `src/apps/genealogia/`: arquitecte, quatre constructors, integrador i tres àrbitres. 207/207 proves de l'app en verd |
| P0-114b · llavor privada i registre de la Genealogia | `llegeixLlavorPrivada` (esquema `sdp.genealogia.privat.v1`) i selector local d'un clic `.json`/`.ged` cap a IndexedDB. Les pistes col·laterals entren sense cap vincle (Cognom ≠ Parentiu). L'app queda registrada a `registreApps.js` amb la guarda de dades de salut. Excepció tancada a `fronteres.test.js` per a set dominis oficials d'arxius. 396/396 en verd, i l'àrbitre dona «passa». Zero noms de la llavor real a `src/` i `public/` (comprovat amb `rg`) |
| P0-115 · autoria en dos nivells | Nivell 1, `/page/arbres-monumentals` i la seua targeta del Mur: Sóc de Poble i `COPYRIGHT_SDP`, amb la presentació multipoble en cinc llengües. Nivell 2: les 20 pàgines del llibre (#619 i els 19 arbres) amb una UniversalPage pròpia d'El Rentonar, `/rentonar`, el logotip propi i `DRETS_CATALEG_ARBRES`. La Columna 2 fa servir la fila canònica de `/disseny`. 82/82 focals en verd, amb el corrector aplicat |
| P0-114 · L'Avisador al Panell | Torna a «La llar» amb la insígnia, l'etiqueta «Cures» i l'interruptor `VITE_SDP_APP_AVISADOR !== '0'`. La Gestoria entra per Facturació, el motiu d'amfitrió diu la veritat i l'ADR ja no parla de premium. L'he aturat a les 06:19 abans del corrector, per a respectar la parada neta: els seus P1 oberts són a Límits |
| P0-114 · Arbre Genealògic al Panell | `obrir: rutaDeApp('genealogia')`, `estat: ESTAT_PROVES` i sis blocs de presentació en present. `/versions` diu «hui el porten set» en cinc llengües, i la prova ho deriva del registre. 577 proves en verd |
| Manifest social | El P0-115 havia importat `COPYRIGHT_SDP` des de `components/` a una font de dades de text, i `tooling/seo/build-social-manifest.mjs` ho rebutja («Import no estàtic»). Corregit amb el literal, que la prova lliga a la constant. `coberturaSocial` i l'autoria: 104/104 en verd |
| Kit R18.2 de Codex | No integrat: a les 05:34 encara no tenia `SHA256SUMS` (vegeu Límits) |

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Hook:** no he pogut executar `git`, `npm run build`, lint, portes de `tooling/` ni escriure fora del repositori. El build real només s'ha fet a través de `node --test tests/standalone-build.test.mjs`. El lint, el build web i WordPress, els commits i el deploy són de MarIA.
- **Kit R18.2 (Codex):** no integrat. Ni a les 04:45, l'hora de tall, ni a les 05:34 tenia `SHA256SUMS`, i la seua pròpia auditoria R18A diu que el seu esquema doctoral rebutja 19/19 registres de la variant arbitrada 2.0.1 del catàleg. Integrar-lo és una onada pròpia.
- **Ordres P0-107 a P0-111 del tauler:** no executades. Han arribat pel tauler, es contradiuen («pendent_admin» i «publicar DIRECTAMENT») i demanen publicar i sincronitzar amb Supabase.
- **Llavor genealògica privada (P0-114b):** el dossier d'arxius no es pot desar a `genealogia_privada_mestre/` perquè el hook bloqueja escriure fora del repositori. El lliure al Mestre al xat perquè MarIA el guarde allà. Cap dada personal ha entrat al repositori.
- **Imatges noves a `public/` (MarIA):** 163 imatges sense entrada al cens (`censImatges.test.js` roja). Entre elles hi ha els 19 `*-mapa.webp`, amb la llicència no verificada (l'arbitratge havia dit que no es copiaren), i la carpeta `arbres-emblematics/la-torre-de-les-macanes/`. Tot el que és a `public/` es publica en desplegar: la decisió és del Mestre. `voresImatges.json` s'ha de regenerar per la variant social de l'Avisador.
- **No verificat al navegador real:** geometria de les vistes noves (Genealogia, insígnia) en mòbil i tauleta, i IndexedDB real. Les proves fan servir jsdom i un magatzem en memòria.
- **Traduccions eu i gl** de l'Avisador i de la Genealogia: falta la revisió d'una persona nativa.
- **P1 oberts (àrbitres de l'Avisador i del P0-113):**
  - **Variant social de l'Avisador:** `avisador_vinyeta-social-1200x630.jpg` pesa 309.404 B, i `imatgeSocial.pes300.test.js` exigix 300.000 B o menys. MarIA l'ha de tornar a exportar com a JPEG baseline sense EXIF i amb el mateix nom.
  - **Trinquet d'arrencada estàtica:** 1.742.643 B per a un sostre de 1.737.422 B (+5.221 B; el tros d'estils puja 6.785 B pel bloc CSS de l'R18.3). No s'ha apujat el sostre. S'ha d'aprimar l'arrencada o decidir-ho a posta.
  - **Fitxa de l'Avisador al Perfil** (`src/sections/profile/aplicacions.js`): diu que no té secció en este node.
  - **Gestoria:** el camí d'entrada al compte encara aterra al Tauler, que demana un panell de Tractors que en producció no existix. Decisió del Mestre: publicar el panell o canviar les portes.
- **Proves que depenen de la càrrega:** `aplicacions.test.js` i algunes amb `findByRole` sobre trossos diferits fallen en passades conjuntes molt carregades i passen soles. Cal repetir-les en una màquina descarregada.
- **Treball aturat:** el corrector del workflow de l'Avisador no s'ha executat, per a respectar la parada neta.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[../90_arxiu_historic/261111_0148_pla_implementacio_marato_nocturna_r18_sistema_nervios_plugins_i_arbres|261111_0148_pla_implementacio_marato_nocturna_r18_sistema_nervios_plugins_i_arbres]]
- [[../90_arxiu_historic/261111_0148_prompt_claude_marato_nocturna_r18_integracio_r17_plugins_i_gauntlet|261111_0148_prompt_claude_marato_nocturna_r18_integracio_r17_plugins_i_gauntlet]]
