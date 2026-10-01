---
type: acta
status: esborrany
description: Lliurament final de WordPress i DeepL, vigilància aturada per ordre humana i pendents reproduïbles de la revisió creuada.
tags:
  - acta
visibility: private
reflex: sdp:torn_2c591b20-7040-40dd-abfa-9a538e439ccf:5f6beaa3-e063-4407-9e03-87369df934e3
---
# Lliurament Codex — WordPress i Traductor Sobirà

Lliurament del carril Codex per a la IAIA MarIA. El Mestre ordena aturar la vigilància i finalitzar esta intervenció. El motor WordPress i la connexió real amb DeepL estan verificats; les incidències reproduïdes que continuen presents es conserven com a pendents. Esta acta no declara una sessió global sense defectes.

<!-- SDP:SECTION acta.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_2c591b20-7040-40dd-abfa-9a538e439ccf:5f6beaa3-e063-4407-9e03-87369df934e3 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-30T22:52:43.519Z |
| Modificació | 2026-09-30T22:55:59Z |
| Propietari | Codex |
| Aprovació humana | Ordre expressa del Mestre de lliurar i aturar la vigilància; validació de MarIA comunicada pel Mestre |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/acta.md (v2.0.0) |
| Model IA | Codex, GPT-6; Astra és la denominació del carril |
| Tokens consumits | No disponibles amb exactitud; no s'estimen ni s'atribuïx el consum de Claude |

<!-- SDP:SECTION acta.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/acta.md; SHA-256 2d5838a987f9ea587784fcffabbd3889bd42c72bce135f63e853343c6cf17cb2. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION acta.s3 -->
## Historial

2026-09-30T22:52:43.519Z: acta creada pel circuit documental viu, després de l'ordre humana d'aturada. Context acumulat: rondes C0–C8 i D1–D5 de l'auditoria Codex, rondes C1–C10 i lliurament B de Claude. Les rondes automàtiques posteriors a D5 no havien trobat canvis de codi ni informes nous.

2026-09-30T22:55:59Z: acta i auditoria validades amb `document.mjs check` (valid:true); porta Olivera verda, nou documents solts, cap trasllat. Intent explícit `tancament.mjs --close --turn-id torn_2c591b20-7040-40dd-abfa-9a538e439ccf`: comprovació valid:false, 123 errors, principalment skills i SCC; estat **planned**, sense arribar al segellat de tancament. Log `/private/tmp/sdp-final-tancament.json`. La comprovació documental pròpia i el lliurament estan complets; el torn mecànic no queda closed.

<!-- SDP:SECTION acta.s4 -->
## Resultats

### Lliurament tècnic

El plugin oferix `POST /wp-json/socdepoble/v1/traduir` per a visitants i persones amb sessió. Accepta `textos`, `origen:CA`, `desti:ES|EN-GB|FR|DE` i `format:text|html`; conserva ordre i longitud en `traduccions`. La clau només es llig al servidor, des de la constant `DEEPL_API_KEY` o de l'entorn del procés PHP. El fitxer `.env` del repositori no configura automàticament un WordPress desplegat. El client rep només `traductor-url`, del mateix origen. El servei és públic, sense nonce ni galetes, segons el contracte D1 acceptat per escrit en C7 de Claude i l'autorització humana de consum per a visitants.

El mòdul principal és `wordpress-plugin/includes/traduccio.php`. Valida JSON, origen de la petició quan s'envia, tipus, llengües i límits: 50 textos, 5000 caràcters Unicode i 20000 bytes de text per petició, amb sostre de cos JSON. La memòria cau usa transients de set dies per text, llengües, format i empremta de la clau; reutilitza traduccions i elimina duplicats dins del lot. Els errors del proveïdor es convertixen a codis controlats, sense exposar clau ni resposta bruta.

La protecció de consum reserva pressupost durable abans de la crida: per defecte 10000 caràcters al dia i 100000 al mes, configurables. Hi ha límit de peticions per client i pausa de 60 segons després d'errors de transport o de proveïdor previstos. Els encerts de memòria cau no gasten pressupost nou. La reserva és conservadora i no es reembossa automàticament després d'un error, perquè un timeout no prova que el proveïdor no haja facturat.

**La correcció de concurrència aplicada és `INSERT IGNORE`, no `add_option()`.** WordPress pot implementar este últim amb una actualització quan la clau ja existix; amb `notoptions` rància es va reproduir un segon pany concedit i un pressupost reiniciat de 7+3 a 3. La creació única per SQL, la comprovació de fila inserida, la reserva CAS i l'alliberament amb token eliminen aquella cursa reproduïda. Amb WordPress real corregit, el segon pany es denega i les reserves 7+3 donen 10. Els panys són per text i el pany global només cobrix la reserva curta; no es manté durant HTTP. Esta evidència certifica el cas verificat, sense prometre absència de tota duplicació imaginable.

Els altres fitxers del carril integren el servei al marcatge (`marcatge.php`, entrada del plugin), al sanejament i atribut de `PedraSecaEmbed.jsx`, al manifest standalone, als missatges localitzats i al readme. La referència copiable exclou el servei local; la desinstal·lació neteja només dades pròpies. L'empaquetador i `tooling/lib/dist-secrets.mjs` busquen secrets DeepL en totes les entrades del paquet. Les proves de traducció i secrets formen part de `test:node` i de la CI, amb PHP obligatori.

La fortificació d'encastament anterior queda documentada en C1–C7: `.is-compact` com a decisió mestra amb mesura inicial i alternativa a ResizeObserver, contenció a la frontera de l'element i diàlegs locals dins de la instància. Els diàlegs de la SPA conserven el comportament natiu. El treball de Claude inclou Xat, menú de traducció, estat local, retorn a l'original i eixides de sessió sense recarregar l'amfitrió. Codex ha revisat estos canvis i conserva el repartiment: cap edició de fonts de Claude en el lliurament final.

### Evidència i abast de les proves

| Comprovació | Resultat acreditat |
| --- | --- |
| Plugin, traducció PHP, pantalla, secrets i empaquetador, ronda D4 | 70/70, cap omesa |
| Configuració embed i frontend de traducció/eixida, ronda D3 | 112/112 en set fitxers |
| Builds web i WordPress, ronda D3 | Correctes; avís conegut de grandària de chunks web |
| PHP lint i ESLint dels fitxers propis | Correctes en els talls D3/D4 |
| Xat, ronda D5 | 431/431 en 32 fitxers; no inclou la reproducció adversarial externa |
| Suite dirigida D5 | 54/55; prova MarcaAmfitrio amb selector antic |
| Client i extracció, passada final 00:52 | 18/18; no cobrix el cas D2-F1 |
| Endpoint PHP i concurrència, passada final | 33/33, cap omesa; inclou pressupost, panys, pauses i memòria cau |
| Fronteres de pàgina D5 | 10000 caràcters admesos, 10001 rebutjats abans de HTTP, també Unicode; 151 blocs curts en quatre lots, 201 rebutjats |
| Extracció adversarial final | **Falla**: incorpora fills ocults i editables, detall davall |
| Porta Node completa D4 | 164 correctes, 10 fallades i 2 TODO de 176; no es declara CI global verda |

La prova real D2/D3 usa WordPress **7.1.2**, SQLite i wp-content temporals. El client real travessa HTTP → WordPress → DeepL amb `source_lang:CA`. Una segona petició equivalent torna `cache:true` sense una altra crida a DeepL. Des del navegador, en una caixa de 900×640, el menú Traduir mostra el cos de `/projecte` en castellà i permet tornar a l'original valencià. L'URL i l'estat d'un control extern es conserven: no hi ha recàrrega de l'amfitrió. D4 verifica també `activate_plugin` amb el plugin complet, marcatge normal amb servei, referència portable sense servei i endpoint 200; esta última prova d'activació usa DeepL simulat, separada de la xarxa real de D2/D3.

Evidències temporals consultables: `/private/tmp/sdp-deepl-http-evidence.json`, `/private/tmp/sdp-deepl-wp-atomic-final.json`, `/private/tmp/sdp-deepl-activation-evidence.json`, captures `/private/tmp/sdp-deepl-browser-castella.jpg` i `/private/tmp/sdp-deepl-browser-original.jpg`. Servidor i pestanya de prova estan tancats. El lloc real de Studio continua intacte: no hi ha instal·lació allí, desplegament, publicació, commit ni push atribuïts a este carril.

### Validació final de l'extracció

El Mestre comunica que MarIA ha validat el frontend. Es registra eixa aprovació comunicada, sense convertir-la en una prova independent de cada vora. El fitxer `blocsTraduibles.js` continua idèntic al tall D5. A les **00:52:31 Europe/Madrid**, l'execució directa amb jsdom torna a reproduir D2-F1:

```html
<article><p>Visible <span hidden>OCULT</span><button>CONTROL</button><span contenteditable="true">ESBORRANY</span></p></article>
```

Resultat esperat: `Visible`. Resultat real: `Visible OCULTCONTROLESBORRANY`. La comprovació de `closest(FORA)` exclou ancestres, però `textContent` incorpora els descendents no autoritzats. El text ocult o editable podria enviar-se al servei de traducció. Evidència final: `/private/tmp/sdp-final-extraccio.json`, `valid:false`. Per tant, la validació final de l'extracció **no és favorable**; la petició de reparació queda al carril de Claude. Cap canvi de codi sota una afirmació de consens no documentada.

### Aturada, coordinació i incidències

L'automatització `auditoria-creuada-wordpress-i-xat` està **PAUSED**, confirmat per l'eina de l'app a les 00:52 del dia 1 d'octubre. S'atura per ordre humana expressa i no per haver resolt totes les troballes. No hi haurà més auditories automàtiques d'este torn. El lliurament documental conclou esta intervenció; el tancament mecànic es comprova separadament i no s'ha de falsejar.

El registre del torn comença el 30 de setembre a les 21:42:33 Europe/Madrid. El lliurament es prepara l'1 d'octubre a les 00:52; és temps de calendari, no una mesura de treball actiu ni de consum. No hi ha mesura fiable de tokens, cost propi o temps estalviat. No s'inferix l'estat emocional del Mestre.

La incidència de lease queda preservada: l'executor D2 va rebutjar «Canvi concurrent abans de preparar» sense aplicar els catorze fitxers, però deixà un claim incomplet. Després de la intervenció de MarIA, el Mestre ordenà procedir. D3 es va aplicar amb pegat local, després de comprovar els hashes dels destins; no s'ha presentat com una nova transacció P14 ni s'ha declarat consumit el rebut. `SEGELL.lock` absent no equival a un claim completat. No s'han alterat controls o rebuts per fabricar un tancament.

Lliçons del torn: el doble de WordPress ha de reproduir tant l'upsert d'`add_option` com els transients escalars retornats com a cadenes; una suite verda no tanca un cas adversarial absent; i una ordre d'aturada pot tancar el treball de l'agent mantenint incidències explícites per al relleu. Els informes separen sempre proves simulades, WordPress real, xarxa DeepL i navegador.

<!-- SDP:SECTION acta.s5 -->
## Pendents

1. **D2-F1, extracció — Claude / assignació de MarIA.** Excloure subarbres FORA dins de blocs visibles i afegir la prova anterior. Mantindre suport a l'article original amagat mentre es mostra una traducció. No enviar el text editable o ocult.
2. **C6-X1/C8, scroll del Xat — Claude.** La primera fila de sistema no té `data-missatge`; la compensació d'historial simultani usa el creixement total. Última reproducció D5: esperat 700 px, real 1000 px. Incorporar l'arnés `/private/tmp/sdp-c8-conversa-sistema.test.jsx` o una regressió equivalent abans de declarar-ho resolt. No s'ha tornat a executar en este lliurament perquè les fonts no han canviat.
3. **D5-T1, MarcaAmfitrio — manteniment de la prova compartida.** Actualitzar els selectors al contracte `.sdp-root:not(.is-compact).sidebar-closed`, mantenint l'assert 232−56=176 i una negativa per a compacte. No retirar la guarda CSS per satisfer el test antic.
4. **Governança — MarIA.** La porta completa encara detecta `core-empaquetat-wp` divergent, enllaços/àncores SCC i l'import Boto preexistent fora d'AppShell en la porta Node. El claim incomplet i les comprovacions fallides es conserven. No forçar el registre del torn a `closed`; resoldre-ho pel circuit suportat quan corresponga.
5. **Desplegament i política — següent intervenció.** Configurar la clau al procés PHP o constant del WordPress destinatari i instal·lar el paquet revisat. El pressupost global limita consum, però no garantix repartiment equitatiu entre visitants ni una reserva atòmica de tots els lots d'una pàgina. Les decisions de producte B4 de Claude continuen al seu informe i no es resolen en esta acta.

```yaml
data: "261001_0052"
lliurament: finalitzat_amb_pendents_explicits
vigilancia: PAUSED
extraccio_descendents: no_validada
connexio_real_deepl: verificada_D2_D3
wordpress_studio_desplegat: false
requereix_auditoria: true
```

<!-- SDP:SECTION acta.s6 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260930_2150_auditoria_codex]]
- [[260930_2143_pla_implementacio_codex]]
- [[260930_2145_auditoria_claude]]
- [[260930_2135_pla_implementacio_claude]]
