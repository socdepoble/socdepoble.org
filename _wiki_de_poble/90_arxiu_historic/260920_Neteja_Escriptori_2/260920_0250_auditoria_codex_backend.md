---
type: informe
status: esborrany
description: Auditoria local de Matrix, catàleg de setze skills i Supabase, amb codi complet verificat per a aplicació manual.
tags:
  - arquitectura
  - seguretat
---

# Consolidació de backend, Matrix i connexió Sollutia

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-AUD-CODEX-260920-02 |
| Encàrrec | SDP-PROMPT-CODEX-260920-02, versió 1.0.0 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-20 02:50 +02:00, Europe/Madrid |
| Agent redactor | Codex, auditor de lògica i backend |
| Propietari | Consell de la Petorreta |
| Aprovació humana de la implantació | pendent |
| Revisió pendent | sí |
| Git de referència | b398115fceead16e7ebd97684e6473b8ea0c38bf, amb canvis locals preexistents |
| Escriptura efectuada al projecte | Exclusivament este informe |
| Aplicació de la proposta | No aplicada; destinada a revisió i aplicació manual per IAIA MarIA |

## Vincles

- [[00_index_escriptori]]
- [[260920_0154_auditoria_skills_avancades]]
- [[260920_0230_PROMPT_Codex_Sollutia]]

## Dictamen

**El catàleg i l’arrancada documental es poden consolidar amb el paquet complet d’este informe. La connexió amb Sollutia no es pot donar per certificada: falten l’estat real de la base de dades, el contracte tècnic del soci i proves d’integració en staging.**

S’ha treballat exclusivament amb fitxers locals. No s’han visitat les referències històriques, usat navegador, consultat serveis externs ni llegit `.env`. «Pedra Seca» significa exclusivament el Sistema de Disseny/UI Kit.

Els blocs de codi són **[PROPOSTA]**, inclosos els noms nous. No descriuen fitxers ja implantats. S’han materialitzat només en una carpeta temporal aïllada per provar-los; l’annex conté el contingut íntegre que s’ha d’avaluar. No s’ha usat Apply Changes, modificat codi operatiu, actualitzat ESTAT/LEDGER, regenerat el segell ni executat el tancament sobre el projecte.

La proposta té **14 proves locals passades**, comprovació de sintaxi de **21 fitxers JS/MJS/Python/shell** i parseig separat del JSX del smoke test. La migració SQL **no s’ha executat**: no hi ha `psql` ni `postgres` al PATH. Les proves del singleton i Storage simulen dependències i transport. La prova del tancament simula SCC, i comprova el cablejat del catàleg; no acredita la salut global de SCC ni un navegador real.

## 1. Abast i criteri de prova

**[FET]** indica codi llegit o resultat local reproduït. **[INFERÈNCIA]** indica una conseqüència condicionada per eixe codi. **[PROPOSTA]** identifica els canvis de l’annex. **[SUPÒSIT]** identifica una condició externa necessària. Les cites corresponen al codi original del disc, abans d’aplicar l’annex; els SHA de la taula d’aplicació fixen el tall.

El pla previ separa reconciliació del registre, retirada de regeneradors i unificació del rebut; situa la governança completa de permisos per efecte en la fase 4. Esta proposta cobrix les fases 1–3 i reforça la verificació documental, sense declarar resolta tota la fase 4. Font: [_wiki_de_poble/04_escriptori/260920_0154_auditoria_skills_avancades.md:771–780](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/04_escriptori/260920_0154_auditoria_skills_avancades.md:771>).

S’ha llegit la skill convocada i la plantilla de Consell. La separació entre auditoria i implantació està descrita en [.agents/skills/skill-consell-i-colmena/SKILL.md:20–45](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/skill-consell-i-colmena/SKILL.md:20>). L’encàrrec actual autoritza codi definitiu dins de l’informe i preval sobre la contenció genèrica de la plantilla. El frontmatter usa l’esquema executable actual, no les claus antigues de la guia consultiva: [tooling/wiki/tractor-frontmatter.mjs:304–368](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/tractor-frontmatter.mjs:304>); [_wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md:29–33](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md:29>).

## 2. Troballes verificades

P1 significa corregir abans de donar per acabada la integració. P2 significa corregir o delimitar abans de promocionar el paquet. La severitat descriu l’impacte del mecanisme local; no afirma que s’haja produït cap incident en producció.

### D01 · P1 · Catàleg divergent

[FET] El disc i el manifest declaren 16 skills. L’índex conté 18 entrades: conserva `equip-ia`, `ment-colmena-integral`, `skill-acte-reflex` i `skill-consell-bundle`, i omet `skill-consell-i-colmena` i `skill-documentacio-i-reflex`. La porta real retorna sis M4 i codi 1. La proposta genera els dos artefactes en la mateixa operació i els compara byte a byte en mode check.

Evidència: [.agents/manifest.yaml:15–31](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/manifest.yaml:15>); [.agents/skills/00_INDEX_SKILLS.md:17–34](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/skills/00_INDEX_SKILLS.md:17>); [tooling/gates/tractor-manifest.mjs:184–209](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/gates/tractor-manifest.mjs:184>).

### D02 · P1 · Dos destins antics diferents

[FET] El tancament crida el sincronitzador JavaScript, que recrea `02_saber/skills_mirror` i hi copia els cossos. El Python produïx un índex de referències i té per defecte `01_Ser/00_AGENTS_I_SKILLS_MIRROR`; també el cita maintain.sh. No són el mateix circuit. En este tall existix la carpeta física `01_ser/00_AGENTS_I_SKILLS_MIRROR`; `02_saber/skills_mirror` està absent. La proposta retira tots dos productors i conserva les rutes antigues d’entrada com a adaptadors cap al catàleg únic.

Evidència: [tooling/gates/tancament.mjs:18–23](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/gates/tancament.mjs:18>); [tooling/wiki/sincronitzar_skills.mjs:4–8](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/sincronitzar_skills.mjs:4>); [tooling/wiki/sincronitzar_skills.mjs:24–58](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/wiki/sincronitzar_skills.mjs:24>); [tooling/brain/sync_agent_mirror.py:61–86](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/sync_agent_mirror.py:61>); [tooling/brain/sync_agent_mirror.py:130–140](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/sync_agent_mirror.py:130>); [tooling/brain/maintain.sh:20–23](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/maintain.sh:20>).

### D03 · P2 · Diversos escriptors sense comprovació final conjunta

[FET] rebuild_skills_index.mjs escriu l’índex per separat; tractor-manifest.mjs --escriu només regenera el manifest i retorna zero sense tornar a comprovar l’índex. Una regeneració no equival a reconciliació. La proposta manté check com a mode per defecte i retorna roig si queden espills, fins i tot després de regenerar el catàleg.

Evidència: [tooling/maquinaria/rebuild_skills_index.mjs:4–30](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/maquinaria/rebuild_skills_index.mjs:4>); [tooling/gates/tractor-manifest.mjs:236–259](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/gates/tractor-manifest.mjs:236>); [tooling/gates/tractor-manifest.mjs:295–298](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/gates/tractor-manifest.mjs:295>).

### D04 · P1 · El hook Matrix real executa Reflex

[FET] hooks.json registra preflight_matrix_wrapper.mjs, però el wrapper executa reflex_plantilles.mjs. Reflex escriu `estat/ts/plantilla`, mentre verify.mjs busca `tipus: matrix.rebut`, `t`, `peticio_sha256` i `fonts`. La incompatibilitat és de productor i consumidor, encara que existisquen dos scripts funcionals per separat.

Evidència: [.agents/hooks.json:2–18](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/hooks.json:2>); [.agents/hooks/preflight_matrix_wrapper.mjs:45–58](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/hooks/preflight_matrix_wrapper.mjs:45>); [tooling/brain/reflex_plantilles.mjs:72–88](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/reflex_plantilles.mjs:72>); [.agents/hooks/verify.mjs:70–78](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/hooks/verify.mjs:70>).

### D05 · P1 · Ready no acredita entrega de context

[FET] Matrix llig fonts i publica metadades/hashes; no inclou el cos de les fonts en l’informe. GLOBALS no inclou PROFILE.md ni BASELINE.md. El registre conté lectures i onUnknown, però Matrix només pren claus/plantilla i usa default quan no hi ha coincidència; el classificador de Reflex torna una sola plantilla i converteix errors de registre en una taula buida. La proposta incorpora contingut complet, lectures declarades i error explícit per registre invàlid.

Evidència: [tooling/brain/matrix.mjs:136–179](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/matrix.mjs:136>); [tooling/brain/matrix.mjs:184–245](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/matrix.mjs:184>); [tooling/brain/classificador_tasques.mjs:9–38](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/classificador_tasques.mjs:9>); [.agents/protocolledge.json:1–29](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/protocolledge.json:1>).

### D06 · P1 · Rebut no vinculat a l’acció actual

[FET] verify.mjs pren l’últim rebut global, no compara el seu hash amb la petició actual ni recalcula els hashes de fonts. La comprovació d’edat no rebutja explícitament dates invàlides o futures. La proposta calcula identitat de sessió i torn des del transcript, usa un rebut per torn i revalida les fonts abans d’autoritzar un Markdown de la Wiki.

Evidència: [.agents/hooks/verify.mjs:70–78](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/hooks/verify.mjs:70>); [.agents/hooks/verify.mjs:247–259](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/hooks/verify.mjs:247>); [tooling/brain/matrix.mjs:229–240](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/matrix.mjs:229>).

### D07 · P1 · Frontera local incompleta

[FET] La llista blanca de run_command autoritza scripts pel prefix del directori, i el càlcul de path.relative no va seguit d’un rebuig explícit de `..` o symlinks. Açò no és un sandbox. La proposta fa comprovació de ruta i només autoritza automàticament unes ordres exactes; la resta torna ask a l’arnés. La seguretat contra un procés amb escriptura arbitrària al mateix sistema continua sent competència de l’arnés i el sistema operatiu.

Evidència: [.agents/hooks/verify.mjs:109–135](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/hooks/verify.mjs:109>); [.agents/hooks/verify.mjs:262–264](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/hooks/verify.mjs:262>).

### B01 · P1 · Barreja i herència incorrecta al port

[FET] setBackendImplementation reutilitza currentImpl i recorre del fill cap al pare escrivint sempre la mateixa clau. S’ha reproduït `fill → pare`, la supervivència de la capacitat admin d’un backend anterior i la mutació de la referència retornada. La proposta construïx una implementació nova, resol primer l’override, exigix el nucli i valida capacitats completes abans del commit.

Evidència: [src/data/backendPort.js:8–35](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/backendPort.js:8>); [src/data/contracte.js:2–64](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/contracte.js:2>).

### B02 · P2 · Arrancada que congela política abans de validar

[FET] host.configura establix la política immutable abans de rebutjar un backend incomplet. arrenca encara contempla fusionar implementació parcial amb Supabase. La proposta valida primer i elimina la fusió. També retira el force de l’API pública de configura: després d’arrencar cal recarregar el document. El port conserva un override intern només de desenvolupament.

Evidència: [src/host.js:120–163](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/host.js:120>); [src/host.js:179–198](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/host.js:179>); [src/config/runtimePolicy.js:9–17](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/config/runtimePolicy.js:9>).

### S01 · P1 · Adjunts privats llegibles pel mateix poble

[FET] La taula notes requerix propietari i membresia; el SELECT del bucket mitjans_privats usa propietari OR membre del tenant. [INFERÈNCIA] Si eixa migració està desplegada, un segon membre pot superar la política de lectura d’un objecte alié del mateix poble; la fila de notes no li dona eixe permís. La migració proposada limita també els adjunts al propietari i membre, amb política restrictiva addicional. No s’ha verificat cap accés real ni l’estat del servidor.

Evidència: [supabase/migrations/260914_0000_schema_notes.sql:54–59](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/260914_0000_schema_notes.sql:54>); [supabase/migrations/260919_1650_bucket_mitjans_privats.sql:17–40](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/260919_1650_bucket_mitjans_privats.sql:17>); [src/data/supabase/storage.js:148–155](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/storage.js:148>).

### S02 · P1 · Prefix Storage incompatible amb les polítiques públiques

[FET] uploadToStorage usa tenant/usuari/carpeta/fitxer, però la política d’inserció pública exigix auth.uid() al primer segment. A més, el fallback de tenantId és user.id, que no implica membresia del poble. La proposta exigix tenant explícit o configurat, rebutja discrepàncies i aplica el mateix format a client i SQL; conserva suport limitat per als objectes públics antics usuari/carpeta/fitxer.

Evidència: [src/data/supabase/storage.js:102–126](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/storage.js:102>); [supabase/migrations/260913_0500_bucket_mitjans.sql:22–36](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/260913_0500_bucket_mitjans.sql:22>); [supabase/migrations/260919_1650_bucket_mitjans_privats.sql:28–35](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/260919_1650_bucket_mitjans_privats.sql:28>).

### S03 · P1 · notes dins del JSON públic de contingut

[FET] La política vigent en l’última redefinició local permet qualsevol key diferent d’agents, incloent notes i noteFolders. APP_CONTENT_ROWS conté eixes claus i loadNotes les llig i fusiona. [INFERÈNCIA] Les notes personals que s’hagueren desat en eixe contenidor quedarien fora de la protecció de public.notes. El codi prova la superfície d’exposició; no prova que les dades remotes continguen informació personal. La proposta limita les claus públiques i exigix revisar/migrar manualment les dades antigues, sense esborrar-les.

Evidència: [supabase/migrations/260916_0600_politiques_superadmin_organitzacions.sql:23–35](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/260916_0600_politiques_superadmin_organitzacions.sql:23>); [src/data/appSeed.js:145–155](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/appSeed.js:145>); [src/data/supabase/notes.js:19–28](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/notes.js:19>); [scripts/generate-supabase-seed.mjs:100–105](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/scripts/generate-supabase-seed.mjs:100>).

### S04 · P1 · Configuració no validada en totes les entrades

[FET] runtime.getResolvedConfig es limita a comprovar presència, i getClient només detecta col·lisió d’URL, no de clau. El validador de credencials existix, però runtimePolicy el crida amb backend.anonKey, mentre la capa de dades usa supabaseAnonKey. La proposta valida al punt de resolució de configuració i fixa URL+clau al singleton. No s’ha llegit cap secret i no s’afirma que hi haja una service_role publicada.

Evidència: [src/data/supabase/runtime.js:26–40](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/runtime.js:26>); [src/data/supabase/config.js:26–52](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/config.js:26>); [src/config/runtimePolicy.js:14–17](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/config/runtimePolicy.js:14>); [src/config/publicCredentials.js:24–54](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/config/publicCredentials.js:24>).

### S05 · P2 · Overload administratiu antic i superfície RPC

[FET] L’RPC admin_list_users() original sense arguments continua declarat; la migració posterior crea una signatura amb dos enters, no el reemplaça. Les dues comproven superadmin: açò no és una elevació de privilegis demostrada. La proposta revoca l’entrada antiga sense paginació. registra_consentiment verifica auth.uid(), però la seua definició no revoca explícitament EXECUTE a PUBLIC; la proposta fa eixa reducció de superfície.

Evidència: [supabase/migrations/260912_admin_panel.sql:11–36](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/260912_admin_panel.sql:11>); [supabase/migrations/260915_0000_seguretat_profunda_deepseek.sql:23–39](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/260915_0000_seguretat_profunda_deepseek.sql:23>); [supabase/migrations/260915_0000_seguretat_profunda_deepseek.sql:111–135](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/260915_0000_seguretat_profunda_deepseek.sql:111>); [src/data/supabase/admin.js:1–9](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/admin.js:1>).

### S06 · P2 · Integritat i contracte d’organitzacions pendents

[FET] updateOrganization admet slug, kind, parent_organization_id i logo_url, mentre el grant d’actualització de l’esquema base enumera name, lema, description i visibility. Les vinculacions author_org_id i notes.published_submission_id són claus foranes per ID, sense assegurar per si soles el mateix tenant i propietari. Cal una revisió de contracte i dades abans d’afegir constraints compostos; l’annex no amplia permisos per fer desaparèixer errors del frontend.

Evidència: [src/data/supabase/organizations.js:17–24](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/supabase/organizations.js:17>); [supabase/migrations/260908_0000_initial_schema.sql:73–109](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/260908_0000_initial_schema.sql:73>); [supabase/migrations/260908_0000_initial_schema.sql:770–788](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/260908_0000_initial_schema.sql:770>); [supabase/migrations/260908_0000_initial_schema.sql:863–869](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/260908_0000_initial_schema.sql:863>); [supabase/migrations/260914_0000_schema_notes.sql:5–22](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/260914_0000_schema_notes.sql:5>).

### S07 · P2 · El verd de la porta SQL té límits

[FET] tractor-rls retorna codi 0 sobre 15 fitxers SQL del tall, però analitza patrons i no executa polítiques amb dos usuaris. Per tant no detecta S01/S02. La guia de desplegament proposa SQL Editor en ordre alfabètic i afirma idempotència, però hi ha CREATE POLICY sense DROP corresponent, per exemple a consentiments. No es pot certificar una reaplicació completa ni donar per fet un desplegament per Supabase CLI.

Evidència: [tooling/gates/tractor-rls.mjs:108–130](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/gates/tractor-rls.mjs:108>); [tooling/gates/tractor-rls.mjs:197–218](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/gates/tractor-rls.mjs:197>); [supabase/README.md:49–57](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/README.md:49>); [supabase/migrations/260915_0000_seguretat_profunda_deepseek.sql:17–21](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/260915_0000_seguretat_profunda_deepseek.sql:17>).

### D08 · P2 · Manteniment i segell amb deute preexistent

[FET] maintain.sh invoca brain_audit.py abans del catàleg; eixe fitxer no apareix al disc en este tall. El test Python antic també intenta importar-lo i encara prova el generador d’espills retirat. La nova bateria Node substituïx la cobertura d’espills per proves del contracte actual, però no repara eixa suite antiga ni el subsistema de manteniment complet. El segell declara 20 fitxers i retorna discrepància; s’ha de renovar després de revisar la implantació, mai com a manera d’amagar el canvi.

Evidència: [tooling/brain/maintain.sh:10–23](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/maintain.sh:10>); [tooling/brain/tests/test_brain_tools.py:25–27](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/tests/test_brain_tools.py:25>); [tooling/brain/tests/test_brain_tools.py:112–143](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/brain/tests/test_brain_tools.py:112>); [.agents/SKILLS_SEAL.json:1–5](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/SKILLS_SEAL.json:1>); [tooling/gates/segella.mjs:23–52](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/gates/segella.mjs:23>).

## 3. Les setze skills que ha de donar el catàleg

Este conjunt prové del disc i coincidix amb el manifest original. La prova compara la llista completa, no només el nombre d’entrades. El límit de 16 és intencional per a esta implantació: una incorporació posterior requerirà revisar el contracte i les proves.

1. `app-grid-shell`
2. `core-context-panic`
3. `core-restauracio-segellada`
4. `pedra-seca`
5. `skill-busca-skills`
6. `skill-casos-us-essencials`
7. `skill-cicle-de-vida`
8. `skill-consell-i-colmena`
9. `skill-documentacio-i-reflex`
10. `skill-estudi-mercat`
11. `skill-guardia-frontmatter`
12. `skill-iaia-identitat`
13. `skill-memoria-historica`
14. `skill-propagar-veritat`
15. `socdepoble-workflow`
16. `universal-page`

Font: [.agents/manifest.yaml:15–31](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/manifest.yaml:15>). Els dos artefactes regenerats complets figuren al final de l’annex.

## 4. Arquitectura proposada i garanties exactes

**[PROPOSTA]** El flux és: fonts de skills → catàleg verificat → resolver de protocols → contingut complet → adaptador del host → rebut d’emissió per torn → comprovació abans d’escriure.

- El mateix generador produïx manifest i índex. Els adaptadors antics no poden generar espills. Check no escriu; `--escriu` només substituïx els dos artefactes. Cada rename és atòmic, però els dos fitxers no són una transacció; si hi ha interrupció, el check posterior falla.
- La quarantena és separada, explícita i recuperable. Conserva tots els fitxers del directori, incloent contingut humà. No esborra cap skill ni historial. Es fixa una destinació única i es rebutgen col·lisions, symlinks i àlies de capitalització.
- Matrix CLI i Reflex emeten el mateix contingut i no creen rebuts que autoritzen escriptures. La CLI és diagnòstic. El preflight invalida el rebut anterior abans de començar i només en deixa un després d’emetre el contingut complet.
- `onUnknown: error` es respecta. El camp default no neutralitza eixa decisió. Es pot seleccionar un protocol explícit amb `--protocol=auditoria` o, en el nou contracte del host, `matrixProtocols: ["auditoria"]`. La selecció local té preferència sobre la ruta genèrica de prompt extern. No es presenta esta heurística com a comprensió semàntica de tota la petició.
- Les dependències explícites de protocols en `lectures` es lligen i hashen. No s’extrauen dependències amagades en prosa o wikilinks: eixa inferència no està especificada en el registre actual.
- El rebut inclou sessió, ordinal de USER_INPUT, hash de petició, fonts, inventari complet, protocols i contingut emés. Caduca als 30 minuts. Fonts modificades, dates invàlides/futures, sessió o torn distints i registre corrupte el fan invàlid.
- El nou hook manté les claus de configuració existents; no cal modificar `.agents/hooks.json`. Les eines d’un host que no encaixen en eixe payload requerixen un adaptador explícit.

**[SUPÒSIT D’INTEGRACIÓ]** PreToolUse ha de rebre el mateix `transcriptPath` absolut que PreInvocation. El transcript ha de ser append-only, conservar els USER_INPUT del torn i tindre contingut textual. La configuració local prova el payload de preflight, però no prova que PreToolUse reba transcriptPath. Si no el rep, la porta proposada denega documents; no busca un rebut global com a fallback.

**[SUPÒSIT D’INTEGRACIÓ]** El host ha de respectar exit no-zero, consumir injectSteps sense truncar-lo i fer passar les escriptures pel hook. `emes_al_hook` prova emissió al pipe, no acceptació del host, lectura efectiva del model ni autenticitat criptogràfica de qui controla el disc. Per declarar entrega acreditada cal una confirmació del host; esta versió no inventa eixa API.

El catàleg comprova metadades operatives, però no substituïx el tractor global de frontmatter. Els tags i descripcions fora d’esquema de les skills continuen sent deute a revisar; no s’han reescrit les seues instruccions per fer passar una porta.

El payload original de preflight usa invocationNum/transcriptPath i USER_INPUT; la porta original només documenta toolCall.args. Eixa és la base i el límit del contracte de l’adaptador: [.agents/hooks/preflight_matrix_wrapper.mjs:6–29](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/hooks/preflight_matrix_wrapper.mjs:6>); [.agents/hooks/verify.mjs:12–16](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/hooks/verify.mjs:12>); [.agents/hooks/verify.mjs:101–106](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/hooks/verify.mjs:101>).

## 5. Connexió amb Sollutia: què queda establit i què falta

La compatibilitat que es pot auditar és la del contracte local. El repositori aporta una interfície de mètodes, taules, polítiques i política de sessió. Això no equival a una especificació tècnica signada per Sollutia ni a evidència del desplegament remot.

### Rols observables

| Àmbit | Rols o identitat | Autoritat observable |
| --- | --- | --- |
| PostgreSQL/API | anon, authenticated i PUBLIC en grants/polítiques | DDL local; estat real pendent |
| Plataforma | usuari, moderador, superadmin | user_platform_roles; consulta pròpia; superadmin derivat de taula |
| Organització | owner, admin, member | organization_memberships i helpers private |
| Poble | role amb default member | town_memberships; el text de rol no té enum en la definició llegida |
| Identitat | UUID auth.uid() | Claus foranes de perfils i membresies; filtratge del backend |

Evidència dels rols: [supabase/migrations/260908_0000_initial_schema.sql:23–28](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/260908_0000_initial_schema.sql:23>); [supabase/migrations/260908_0000_initial_schema.sql:101–120](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/260908_0000_initial_schema.sql:101>); [supabase/migrations/260908_0000_initial_schema.sql:279–288](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/260908_0000_initial_schema.sql:279>); [supabase/migrations/260908_0000_initial_schema.sql:846–852](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/supabase/migrations/260908_0000_initial_schema.sql:846>).

La sessió externa comprova sub, expiració, emissor i audiència en el client, i el mateix codi explica que no verifica la signatura. L’autorització real ha de residir en el verificador de tokens i RLS del servidor; canviar la UI no la substituïx. Font: [src/data/identitat.js:235–289](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/data/identitat.js:235>).

### Condicions del paquet SQL

**[SUPÒSIT]** Les migracions locals prèvies s’han aplicat en l’ordre documentat i existixen els objectes/signatures referenciats. La migració nova és transaccional i no pretén reparar arbitràriament un servidor divergent. Un objecte absent ha de fer-la fallar.

**[PROPOSTA]** L’annex SQL:

1. Fa privats per propietari els adjunts de notes, també en presència d’altres polítiques permissives.
2. Concorda el prefix Storage de frontend amb el de les polítiques i conserva la lectura dels objectes públics.
3. Limita app_content públic a towns, pages, feedPosts, marketItems, events, mediaItems i onboarding; conserva la política administrativa existent, sota la restricció nova per a authenticated.
4. Revoca la lectura anònima innecessària de notes, l’EXECUTE públic de consentiment i la signatura administrativa sense paginació.

No copia, publica, esborra o mou objectes Storage. Les URLs signades ja emeses poden continuar sent vàlides fins a la seua expiració; esta proposta no acredita revocació d’eixes URLs. Els objectes ja públics requerixen una revisió específica si havien de ser privats. També s’ha de revisar el contingut antic de les claus notes/noteFolders abans de retirar-les de la lectura normal: no s’assumix que siga segur ni que siga privat sense inspecció autoritzada.

El validador nou exigix una URL base HTTPS, o HTTP local, sense credencials, query ni subruta, i una clau anon/publicable. Un proxy de Sollutia amb subruta requerirà adaptar eixe contracte. L’absència de credencials ja no es tolera en les crides directes del validador des del build: és una decisió explícita per a un paquet connectat. Cap error imprés inclou la clau.

### Incògnites que bloquegen la certificació remota

- Contracte real de Sollutia: URL/API, tenants, esquema exposat, noms/signatures de RPC, emissor/audiències i confiança criptogràfica dels JWT.
- Migracions i ordre realment aplicats; objectes i polítiques addicionals; privilegis dels propietaris SECURITY DEFINER; grants heretats.
- Configuració de Storage i Realtime al servidor; ús real de les URL signades i abast de revocació requerit.
- Semàntica desitjada dels adjunts: la correcció seguix la privacitat de la nota; compartir una nota requerirà ACL explícita, no membresia general del poble.
- Dades històriques en app_content; integritat dels enllaços note → publicació i publicació → organització entre tenants.
- Consumidors externs de l’RPC administratiu sense arguments, modes de build sense credencials i política pública de continguts entre pobles.
- Payload efectiu de PreToolUse i prova que el host real consumeix el context complet. No s’ha inspeccionat el host amb navegador per la restricció de l’encàrrec.

### Proves obligatòries en staging abans de promocionar

| Cas | Resultat exigible |
| --- | --- |
| Propietari A, membre del poble T, nota i adjunt propis | Lectura i escriptura permeses |
| Usuari B del mateix poble T | Nota d’A i signatura/descàrrega de l’adjunt d’A denegades |
| Usuari C d’un altre poble o anon | Notes i adjunts privats denegats |
| A intenta prefix d’un altre usuari o poble alié | INSERT/UPDATE/moviment d’Storage denegat |
| Ruta Storage malformada | Denegació; no concessió per error de cast |
| A puja un avatar públic amb el format nou | Inserció pròpia admesa i lectura pública admesa |
| notes/noteFolders en app_content | No visibles per anon ni usuari ordinari |
| admin_list_users paginat | Només superadmin; límit efectiu; sense sobrecàrrega antiga accessible |
| Tenant/usuari falsificat en REST | RLS denega independentment del frontend |
| Token extern incorrecte o d’un emissor no confiat | Rebuig del servidor, no només de la UI |
| Invocació repetida de la migració nova | Transacció correcta, mateixes polítiques, cap pèrdua de dades |
| Cicle real d’embed, login, refresh i logout | Backend únic, sessió correcta, canals reoberts segons contracte |

Les proves han d’usar credencials de prova, dos usuaris reals de staging i el catàleg efectiu de PostgreSQL. Els mocks locals no substituïxen estos casos.

## 6. Aplicació manual i retorn

**No executar contra el projecte des d’esta auditoria.** Estos passos són el relleu per a IAIA MarIA.

1. Revisar el diff local preexistent i comparar els SHA de la taula següent. Si una font ha canviat, reconciliar la proposta; no sobreescriure treball posterior.
2. Guardar un punt de retorn dels fitxers afectats, sense incloure secrets ni netejar indiscriminadament l’escriptori.
3. Aplicar junts els blocs del catàleg, resolver, adaptadors i hooks. Mantindre aturat l’arnés mentre es canvien els seus contractes. No activar un hook nou amb el catàleg encara antic.
4. Executar la quarantena en mode diagnòstic i després aplicar-la. Generar el catàleg una vegada i comprovar-lo dos vegades. No usar --baseline per ocultar errors.
5. Aplicar el bloc backend i el smoke test conjuntament. Revisar els canvis de contracte indicats: implementació completa, capacitats completes, absència de force públic i validació de credencials.
6. Executar la bateria Node de l’annex i les proves d’aplicació que corresponguen en un checkout aïllat. No donar per passada la suite Python antiga: té dependències absents i proves del contracte retirat.
7. Verificar PreInvocation + PreToolUse amb l’arnés real i el mateix transcriptPath. Sense eixa prova, la fase 3 està preparada però no homologada al host.
8. Aplicar SQL només a staging després d’inventariar polítiques/grants i fer les proves de la taula anterior. La promoció remota queda fora d’esta sessió.
9. Revisar deute de frontmatter i actualitzar el segell només després d’acceptar els canvis. En la sessió d’implantació, ancorar este informe a l’índex, actualitzar ESTAT i executar el tancament ja corregit.

Comandes posteriors a l’aplicació manual del codi:

```sh
node tooling/brain/quarantena_espills.mjs
node tooling/brain/quarantena_espills.mjs --aplica
node tooling/brain/cataleg_skills.mjs --escriu
node tooling/brain/cataleg_skills.mjs --check
node tooling/brain/cataleg_skills.mjs --check
node --test tests/backend_consolidacio.test.mjs
node tooling/brain/matrix.mjs --json --protocol=auditoria "auditoria backend"
```

La CLI Matrix de l’última línia és diagnòstic; no habilita documents per si mateixa. Cal el preflight del host per a emetre el rebut.

Retorn: restaurar només els fitxers implantats des del punt de retorn revisat; els espills apartats es conserven a `.brain-trash/260920_consolidacio/` amb la ruta original. No reactivar els productors antics com a part d’un retorn rutinari. En SQL, una fallada abans de commit fa rollback; després de commit, no es proposa reobrir permisos automàticament. Cal una migració correctiva revisada sobre les polítiques efectives.

## 7. Validació local

| Comprovació sobre originals | Resultat |
| --- | --- |
| tractor-manifest --json | Codi 1; sis M4; manifest/disc=16, índex=18 |
| tractor-rls | Codi 0; escàner estàtic sobre 15 SQL; no prova RLS efectiva |
| segella.mjs, sense --update | Codi 1; segell divergent; cap escriptura |
| tractor-frontmatter --estricte --json, abans de l’informe | Codi 1; 223 documents, 0 exempcions; F1=17, F2=89, F3=19, F4=12, F5=1, F6=0, F7=14, F8=0 |
| Sonda backend original | Override=pare; admin antic conservat=true; façana mutable |

El control de hashes de 259 fonts observades no ha detectat canvis durant la preparació. Les eixides es van guardar a l’àrea temporal de prova. No s’ha executat npm build, npm install, un navegador, cap SQL remot ni la cadena completa de portes sobre el projecte.

### Bateria de la proposta

```text
✔ catàleg: 16 IDs iguals, dues escriptures idempotents i check sense mutació (278.888875ms)
✔ catàleg rebutja divergència, setzena skill absent i espill (44.272875ms)
✔ rutes: escape i symlink rebutjats (11.865708ms)
✔ protocols: local, lectures, desconegut, JSON corrupte (22.83425ms)
✔ arrancada: CLI no deixa rebut; preflight emet tot i verifica el mateix torn (236.833875ms)
✔ rebut: fonts alterades, tasca distinta, data invàlida/futura/caducada (27.04625ms)
✔ un preflight fallit invalida el rebut anterior i no trunca el context (99.341584ms)
✔ backend: reemplaçament íntegre, override, atomicitat, getters, lock i capacitats (0.793125ms)
✔ credencials: claus privades/malformades i URLs insegures rebutjades (0.497917ms)
✔ transport: rebutja secrets abans de fetch i no seguix redireccions (1.081458ms)
✔ singleton: config fixada, clau diferent rebutjada i token renovat (0.433459ms)
✔ storage: poble explícit, carpetes validades i prefix coherent amb RLS (0.630208ms)
✔ dos cicles d’arrancada i tancament no recreen espills; SCC aïllat (175.455917ms)
✔ quarantena: conserva contingut, és idempotent i rebutja symlinks (101.270708ms)
ℹ tests 14
ℹ suites 0
ℹ pass 14
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1034.263666
```

La quarantena inclou una prova específica de capitalització en APFS, conservació del contingut i rebuig de symlinks. Els errors detectats durant la preparació es van corregir abans del resultat anterior.

El frontmatter d’este informe es validarà de manera aïllada amb l’executable i l’esquema originals. El resultat final s’afegix al final del document; no s’equipara la validesa de l’informe amb la de tota la Wiki.

## 8. Taula d’aplicació dels blocs

Cada bloc següent conté un fitxer complet. La ruta només apareix en esta taula: els tancats no duen instruccions Apply Changes. **Existents** significa substitució manual del fitxer després de comprovar el SHA original. **Nous** significa ruta proposada, encara absent del projecte. Els dos últims blocs són l’eixida exacta del generador provat, i es poden obtindre amb --escriu.

| Bloc | Destí manual | Estat | SHA-256 original al tall |
| --- | --- | --- | --- |
| A01 | `tooling/brain/cataleg_skills.mjs` | Nou proposat | `—` |
| A02 | `tooling/brain/context_documental.mjs` | Nou proposat | `—` |
| A03 | `tooling/brain/matrix.mjs` | Existent | `8d9bc94dee8f3de5238377fcad037a2379d51ef6f753547840b613599ddc7efe` |
| A04 | `tooling/brain/reflex_plantilles.mjs` | Existent | `8ae1ba24d1eba84e8f38480fb784d2e7e8f6716687fb841e211c41fc8cb58f76` |
| A05 | `tooling/brain/classificador_tasques.mjs` | Existent | `ae0fa6984d073096e7ae5f869555ce791f48c723579adcbb5e0b672d90bdfad1` |
| A06 | `.agents/hooks/preflight_matrix_wrapper.mjs` | Existent | `5a5d1dc9b3e815ada0dc3793719e0bc229691d2f45becb5f1d864fd56084c776` |
| A07 | `.agents/hooks/verify.mjs` | Existent | `932c993f41745de2b6ab06058908646be1c2444f55a44dd7e0115033e2a1b677` |
| A08 | `tooling/gates/tractor-manifest.mjs` | Existent | `61653f4f94153e515f961be6b39b6ceb5c7fdbd3654255e8a94d33161ebcab21` |
| A09 | `tooling/maquinaria/rebuild_skills_index.mjs` | Existent | `ba22e957005b44e0295d8077bffea230f9f471ffa89dcc57864542ea7b082af5` |
| A10 | `tooling/wiki/sincronitzar_skills.mjs` | Existent | `68cfad14ecf8e2505a086aa9bb92c8b612ff8281d7e2554956851bed4c72cd2d` |
| A11 | `tooling/brain/sync_agent_mirror.py` | Existent | `6b76dc0afb3c9619da2f20fd09f71584e416ea45859ac1da115e1ff44cd7d495` |
| A12 | `tooling/brain/maintain.sh` | Existent | `d569d88376ed50506111f94723b849f217be4f30533a04663144fd73c05293d9` |
| A13 | `tooling/gates/tancament.mjs` | Existent | `d2166397b50d3d9f25d13f9d5e00c689ea00a5cdf59425834fb3697addfcb98c` |
| A14 | `tooling/brain/quarantena_espills.mjs` | Nou proposat | `—` |
| A15 | `src/data/backendPort.js` | Existent | `323f12e800cfbe3e07de5588002f6cea9e7c64c22329f7eed967f5288dc6d57f` |
| A16 | `src/host.js` | Existent | `820d128710485d02d90639a57f32e910a8eea85ce505d1ee01986fef16c03510` |
| A17 | `src/config/publicCredentials.js` | Existent | `478329a4436333ff429683b2f952c108b3d217874bc86783d644edf85522bab5` |
| A18 | `src/data/supabase/runtime.js` | Existent | `401481f1c53a14f042f27ce0726cb6faf41c681419c3a4043b693738c1e39da3` |
| A19 | `src/data/supabase/config.js` | Existent | `3550dbeb6e7e730635fef23f949fdaeaa81c1502fceee5b3eb59a147ce6d53ec` |
| A20 | `src/data/supabase/storage.js` | Existent | `70da322fb9946ff70d909764c3ea3a6d564989c0a82ad91e1add28a5cbb33715` |
| A21 | `supabase/migrations/260920_0300_blindatge_storage_i_contingut.sql` | Nou proposat | `—` |
| A22 | `src/app/App.test.jsx` | Existent | `6c7b3d0c8189def9708b521e9cfca45488ac48b5675a74583045a1f61234c6d7` |
| A23 | `tests/backend_consolidacio.test.mjs` | Nou proposat | `—` |
| A24 | `.agents/manifest.yaml` | Existent | `4cc6de707db6cd368fcaeb548d57c53b20eb705a8dfab24fa8c0cc137c80cbd1` |
| A25 | `.agents/skills/00_INDEX_SKILLS.md` | Existent | `f4412d5c61b90f4cb6da8919aaed7e3aa7791dcf67481dc67fe4d6b5d5a47141` |

## 9. Annex de codi complet

**[PROPOSTA ÍNTEGRA]** Cap bloc d’este annex s’ha aplicat als seus destins. No hi ha pseudocodi ni omissions «resta igual» dins dels fitxers. Els imports que es conserven apunten a dependències locals existents; el paquet no requerix instal·lar dependències noves.

### A01 · Catàleg únic

```javascript
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import { arrelSegura } from '../lib/arrel.mjs';
import { parseFrontmatter } from '../wiki/lib/frontmatter.mjs';

export const ROOT = fs.realpathSync(arrelSegura());
export const sha = value => createHash('sha256').update(value).digest('hex');
export const MIRRORS = [
  '_wiki_de_poble/01_ser/00_AGENTS_I_SKILLS_MIRROR',
  '_wiki_de_poble/01_Ser/00_AGENTS_I_SKILLS_MIRROR',
  '_wiki_de_poble/02_saber/skills_mirror',
];
export function segura(root, rel) {
  if (typeof rel !== 'string' || !rel || path.isAbsolute(rel) || rel.includes('\\') ||
      rel.split('/').some(p => !p || p === '.' || p === '..')) throw new Error(`Ruta invàlida: ${rel}`);
  let current = root;
  for (const part of rel.split('/')) {
    const parent = current;
    current = path.join(current, part);
    try {
      if (fs.existsSync(current) && !fs.readdirSync(parent).includes(part)) throw new Error(`Capitalització no canònica: ${rel}`);
      if (fs.lstatSync(current).isSymbolicLink()) throw new Error(`Symlink prohibit: ${rel}`);
    } catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  return current;
}
export function font(root, ruta) {
  const abs = segura(root, ruta);
  if (!fs.statSync(abs).isFile()) throw new Error(`No és fitxer: ${ruta}`);
  const bytes = fs.readFileSync(abs);
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  if (!text.trim()) throw new Error(`Font buida: ${ruta}`);
  return { ruta, sha256: sha(bytes), bytes: bytes.length, text };
}
export function atomic(root, ruta, text) {
  const dest = segura(root, ruta);
  const tmp = `${dest}.${randomUUID()}.tmp`;
  try {
    fs.writeFileSync(tmp, text, { flag: 'wx', mode: 0o600 });
    fs.renameSync(tmp, dest);
  } finally { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); }
}
export function inventari(root = ROOT) {
  const dir = segura(root, '.agents/skills');
  const skills = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error(`Symlink en skills: ${entry.name}`);
    if (!entry.isDirectory()) continue;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.name)) throw new Error(`ID invàlid: ${entry.name}`);
    const src = font(root, `.agents/skills/${entry.name}/SKILL.md`);
    const fm = parseFrontmatter(src.text);
    if (!fm.hasFrontmatter || fm.errors.length) throw new Error(`${src.ruta}: ${fm.errors.join('; ') || 'sense frontmatter'}`);
    const d = fm.data;
    if (d.name !== entry.name || (d.type ?? d.tipus) !== 'skill' || !['actiu', 'canonic'].includes(d.status ?? d.estat))
      throw new Error(`Skill no activa o identitat divergent: ${src.ruta}`);
    if (typeof d.description !== 'string' || !d.description.trim()) throw new Error(`Falta description: ${src.ruta}`);
    if (!Array.isArray(d.triggers_on) || d.triggers_on.some(t => typeof t !== 'string' || !t.trim()))
      throw new Error(`triggers_on invàlid: ${src.ruta}`);
    if (d.core !== undefined && !/^core:[ \t]*(true|false)[ \t]*(?:#.*)?$/m.test(fm.rawFrontmatter)) throw new Error(`core invàlid: ${src.ruta}`);
    if (d.prioritat !== undefined && !/^prioritat:[ \t]*-?\d+[ \t]*(?:#.*)?$/m.test(fm.rawFrontmatter)) throw new Error(`prioritat invàlida: ${src.ruta}`);
    skills.push({ ...src, id: d.name, description: d.description.replace(/\s+/g, ' '),
      core: d.core === 'true', triggers: d.triggers_on, prioritat: d.prioritat === undefined ? 50 : Number(d.prioritat) });
  }
  skills.sort((a,b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  if (skills.length !== 16) throw new Error(`Contracte d'esta implantació: 16 skills; trobades ${skills.length}`);
  for (const f of ['PROFILE.md', 'AGENTS.md', 'BASELINE.md', 'consell.json']) font(root, `.agents/${f}`);
  return skills;
}
export function projeccions(skills) {
  return new Map([
    ['.agents/manifest.yaml', [
      '# GENERAT per tooling/brain/cataleg_skills.mjs; no editar a mà.',
      'schema: socdepoble.manifest.v1', 'identity: PROFILE.md', 'bios: AGENTS.md',
      'baseline: BASELINE.md', 'index_skills: skills/00_INDEX_SKILLS.md', 'consell: consell.json',
      'skills:', ...skills.map(s => `  - skills/${s.id}/SKILL.md`), '',
    ].join('\n')],
    ['.agents/skills/00_INDEX_SKILLS.md', [
      '---', 'type: index', 'status: generat',
      'description: Catàleg determinista de les setze skills actives, generat des de les fonts canòniques.',
      'tags:', '  - skills', '  - core', '---', '', '# Catàleg de skills', '',
      'Font executiva única: `.agents/skills/`. Este índex només referencia les fonts.', '',
      ...skills.map(s => `- [[${s.id}/SKILL|${s.id}]]: ${s.description}`), '',
    ].join('\n')],
  ]);
}
export function comprovaCataleg(root = ROOT, skills = inventari(root)) {
  const problemes = [];
  for (const [rel, text] of projeccions(skills)) {
    const abs = segura(root, rel);
    if (!fs.existsSync(abs) || fs.readFileSync(abs, 'utf8') !== text) problemes.push(`Projecció divergent: ${rel}`);
  }
  for (const rel of MIRRORS) if (fs.existsSync(path.join(root, rel))) problemes.push(`Espill pendent de quarantena: ${rel}`);
  return { ok: !problemes.length, disc: skills.map(s => s.id), problemes };
}
export function catalegCLI(args = process.argv.slice(2), root = ROOT) {
  const allowed = new Set(['--check', '--escriu', '--json']);
  try {
    if (args.some(a => !allowed.has(a) && !a.startsWith('--arrel=')) || (args.includes('--check') && args.includes('--escriu')))
      throw new Error('Ús: [--check | --escriu] [--json]');
    const skills = inventari(root);
    if (args.includes('--escriu')) {
      // Cada reemplaçament és atòmic; el conjunt de dos fitxers NO és una transacció.
      // Una interrupció deixa el check en roig, mai un catàleg acceptat parcialment.
      for (const [rel, text] of projeccions(skills)) {
        const abs = segura(root, rel);
        if (!fs.existsSync(abs) || fs.readFileSync(abs, 'utf8') !== text) atomic(root, rel, text);
      }
    }
    const result = comprovaCataleg(root, skills);
    console.log(JSON.stringify({ porta: 'cataleg-skills', ...result }, null, 2));
    return result.ok ? 0 : 1;
  } catch (e) { console.error(e.message); return 2; }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = catalegCLI();
```

### A02 · Resolver i rebut

```javascript
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, sha, font, segura, atomic, inventari, comprovaCataleg } from './cataleg_skills.mjs';

const GLOBALS = ['.agents/BOOTSTRAP.md', '.agents/AGENTS.md', '.agents/PROFILE.md',
  '.agents/BASELINE.md', '.agents/PROTOCOL_PETORRETA.md', '.agents/consell.json'];
const CONTROL = ['.agents/manifest.yaml', '.agents/skills/00_INDEX_SKILLS.md',
  '.agents/protocolledge.json', '.agents/DESTINS_CANONICS.json'];
const TTL = 30 * 60 * 1000;
const words = t => t.normalize('NFC').toLowerCase().split(/[^\p{L}\p{N}·]+/u).filter(Boolean);
export function encaixa(text, trigger) {
  const input = words(text), needle = words(trigger);
  if (!needle.length) return false;
  return input.some((word, start) => {
    if (!word.startsWith(needle[0])) return false;
    let next = 1, gaps = 0;
    for (let i = start + 1; i < input.length && next < needle.length; i++) {
      if (input[i].startsWith(needle[next])) next++;
      else if (++gaps > 2) return false;
    }
    return next === needle.length;
  });
}
export function registre(root = ROOT) {
  const src = font(root, '.agents/protocolledge.json');
  const data = JSON.parse(src.text);
  if (data.schema !== 'sdp.protocolledge.v1' || !['error', 'default'].includes(data.onUnknown) || !Array.isArray(data.rutes))
    throw new Error('Contracte protocolledge invàlid');
  const ids = new Set();
  for (const row of data.rutes) {
    if (!row || typeof row.id !== 'string' || !row.id || ids.has(row.id) ||
        !Array.isArray(row.claus) || !row.claus.length || row.claus.some(c => typeof c !== 'string' || !c.trim()) ||
        !Array.isArray(row.lectures)) throw new Error('Ruta de protocol duplicada o invàlida');
    ids.add(row.id);
    for (const rel of [row.plantilla, ...row.lectures]) font(root, rel);
  }
  if (data.default) font(root, data.default);
  if (data.onUnknown === 'default' && !data.default) throw new Error('Falta plantilla default');
  return data;
}
export function resolProtocols(task, ids = [], root = ROOT) {
  if (typeof task !== 'string' || !task.trim() || !Array.isArray(ids) || ids.some(id => typeof id !== 'string') || new Set(ids).size !== ids.length)
    throw new Error('Petició o selecció de protocols invàlida');
  const data = registre(root);
  let selected;
  if (ids.length) {
    selected = ids.map(id => {
      const row = data.rutes.find(r => r.id === id);
      if (!row) throw new Error(`Protocol desconegut: ${id}`);
      return row;
    });
  } else {
    selected = data.rutes.filter(row => row.claus.some(clau => encaixa(task, clau)));
    if (selected.some(r => r.id === 'prompt.local')) selected = selected.filter(r => r.id !== 'prompt.consell');
  }
  if (!selected.length) {
    if (data.onUnknown === 'error') throw new Error('Cap protocol aplicable; selecció explícita requerida');
    selected = [{ id: 'default', plantilla: data.default, lectures: [] }];
  }
  if (selected.some(r => r.id === 'prompt.local') && selected.some(r => r.id === 'prompt.consell'))
    throw new Error('Destinatari local i extern simultanis');
  return selected;
}
export function prepara(task, ids = [], root = ROOT) {
  const all = inventari(root);
  const check = comprovaCataleg(root, all);
  if (!check.ok) throw new Error(check.problemes.join('; '));
  const skills = all.filter(s => s.core || s.triggers.some(t => encaixa(task, t)))
    .sort((a,b) => a.prioritat - b.prioritat || (a.id < b.id ? -1 : 1));
  const protocols = resolProtocols(task, ids, root);
  const paths = [...new Set([...GLOBALS, ...CONTROL, ...skills.map(s => s.ruta),
    ...protocols.flatMap(p => [p.plantilla, ...p.lectures])])];
  const sources = paths.map(rel => font(root, rel));
  const contingut = sources.map(s => `\n<<<FONT ${s.ruta} sha256=${s.sha256}>>>\n${s.text}\n<<<FI FONT ${s.ruta}>>>\n`).join('');
  return { esquema: 'sdp.matrix.v2', estat: 'preparat', peticio_sha256: sha(task),
    skills: skills.map(s => s.id), protocols: protocols.map(p => p.id),
    // Totes les skills entren al hash del registre, encara que no s'hagen activat.
    registre_sha256: sha(JSON.stringify(all.map(s => [s.ruta, s.sha256]))),
    fonts: sources.map(({ text, ...receipt }) => receipt), contingut, contingut_sha256: sha(contingut) };
}
export function identitatTorn(payload) {
  if (typeof payload?.transcriptPath !== 'string' || !path.isAbsolute(payload.transcriptPath))
    throw new Error('El host ha de passar transcriptPath absolut al preflight i a PreToolUse');
  const real = fs.realpathSync(payload.transcriptPath);
  const lines = fs.readFileSync(real, 'utf8').split(/\r?\n/).filter(s => s.trim());
  let task = null, ordinal = 0;
  for (const line of lines) {
    const event = JSON.parse(line);
    if (event.type === 'USER_INPUT') {
      if (typeof event.content !== 'string' || !event.content.trim()) throw new Error('USER_INPUT no textual o buit');
      task = event.content; ordinal++;
    }
  }
  if (!task) throw new Error('Transcript sense USER_INPUT');
  const sessio = sha(real);
  const torn = sha(JSON.stringify([sessio, ordinal, task]));
  return { sessio, torn, task };
}
const receiptPath = identity => `.agents/.matrix-rebuts/${identity.torn}.json`;
export function invalidaEmissio(identity, root = ROOT) {
  const file = segura(root, receiptPath(identity));
  if (fs.existsSync(file)) fs.unlinkSync(file);
}
export function desaEmissio(context, identity, ids, root = ROOT, now = Date.now()) {
  segura(root, '.agents/.matrix-rebuts');
  fs.mkdirSync(path.join(root, '.agents/.matrix-rebuts'), { recursive: true, mode: 0o700 });
  const { contingut, ...summary } = context;
  const result = { ...summary, estat: 'emes_al_hook', sessio: identity.sessio, torn: identity.torn,
    seleccio: ids, t: new Date(now).toISOString() };
  atomic(root, receiptPath(identity), JSON.stringify(result) + '\n');
  return result;
}
export function verificaEmissio(payload, root = ROOT, now = Date.now()) {
  const identity = identitatTorn(payload);
  const old = JSON.parse(font(root, receiptPath(identity)).text);
  const timestamp = typeof old.t === 'string' ? Date.parse(old.t) : NaN;
  if (old.esquema !== 'sdp.matrix.v2' || old.estat !== 'emes_al_hook' || old.sessio !== identity.sessio || old.torn !== identity.torn ||
      !Number.isFinite(timestamp) || timestamp > now || now - timestamp > TTL) throw new Error('Rebut absent, alié, futur, invàlid o caducat');
  if (!Array.isArray(old.seleccio)) throw new Error('Rebut sense selecció de protocols');
  const actual = prepara(identity.task, old.seleccio, root);
  for (const field of ['peticio_sha256', 'registre_sha256', 'contingut_sha256', 'fonts', 'skills', 'protocols'])
    if (JSON.stringify(old[field]) !== JSON.stringify(actual[field])) throw new Error(`Context canviat: ${field}`);
  return old;
}
export async function emet(text, stream = process.stdout) {
  await new Promise((resolve, reject) => {
    const error = e => { stream.off('error', error); reject(e); };
    stream.once('error', error);
    stream.write(text, e => { stream.off('error', error); e ? reject(e) : resolve(); });
  });
}
```

### A03 · CLI Matrix

```javascript
import { prepara } from './context_documental.mjs';
export async function matrixCLI(args = process.argv.slice(2)) {
  try {
    const json = args.includes('--json');
    const unknown = args.filter(a => a.startsWith('--') && a !== '--json' && !a.startsWith('--protocol='));
    if (unknown.length) throw new Error(`Arguments desconeguts: ${unknown.join(', ')}`);
    const ids = args.filter(a => a.startsWith('--protocol=')).map(a => a.slice(11));
    const task = args.filter(a => !a.startsWith('--')).join(' ');
    const result = prepara(task, ids);
    // CLI de diagnòstic: no autoritza escriptures ni deixa rebuts al diari.
    console.log(json ? JSON.stringify(result, null, 2) : result.contingut);
    return 0;
  } catch (e) { console.error(`[MATRIX] ${e.message}`); return 2; }
}
process.exitCode = await matrixCLI();
```

### A04 · Adaptador Reflex

```javascript
// Àlies de compatibilitat: mateix resolver, contingut i errors que Matrix.
import './matrix.mjs';
```

### A05 · Adaptador classificador

```javascript
import { registre, resolProtocols } from './context_documental.mjs';
export const TAULA = registre().rutes.map(r => ({ plantilla: r.plantilla, claus: r.claus }));
export function classifica(text) {
  const matches = resolProtocols(text);
  if (matches.length !== 1) throw new Error('Múltiples protocols: usa el resolver documental complet');
  return { plantilla: matches[0].plantilla, puntuacio: 1 };
}
```

### A06 · Preflight del host

```javascript
import fs from 'node:fs';
import { prepara, identitatTorn, desaEmissio, invalidaEmissio, emet } from '../../tooling/brain/context_documental.mjs';
import { avis } from '../../tooling/brain/termometre_context.mjs';
try {
  const payload = JSON.parse(fs.readFileSync(0, 'utf8'));
  if (!Number.isInteger(payload.invocationNum) || payload.invocationNum < 1) throw new Error('invocationNum invàlid');
  if (payload.invocationNum !== 1) {
    await emet(JSON.stringify({ injectSteps: [] }) + '\n');
  } else {
    const identity = identitatTorn(payload);
    invalidaEmissio(identity);
    const febre = avis(payload.transcriptPath);
    if (febre) throw new Error(febre.missatge);
    const ids = payload.matrixProtocols ?? [];
    const context = prepara(identity.task, ids);
    // No trunquem fonts: si el host té un límit, s'ha de fixar explícitament en bytes.
    const limit = Number(process.env.SDP_MAX_CONTEXT_BYTES || 1048576);
    if (!Number.isSafeInteger(limit) || limit <= 0 || Buffer.byteLength(context.contingut) > limit)
      throw new Error('Context complet excedix el límit configurat');
    await emet(JSON.stringify({ injectSteps: [{ ephemeralMessage: context.contingut }] }) + '\n');
    // Prova d'emissió al pipe. No és prova de recepció o comprensió del model.
    desaEmissio(context, identity, ids);
  }
} catch (e) { console.error(`[MATRIX] ${e.message}`); process.exitCode = 1; }
```

### A07 · Porta documental

```javascript
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, segura, font } from '../../tooling/brain/cataleg_skills.mjs';
import { verificaEmissio } from '../../tooling/brain/context_documental.mjs';

const ESCRIPTORI = '_wiki_de_poble/04_escriptori';
const WRITES = new Set(['write_to_file', 'replace_file_content', 'multi_replace_file_content']);
const RESERVED = new Set(['SKILL.md', 'LEDGER.md', 'ESTAT.md', 'AGENTS.md', 'BIOS.md', 'BASELINE.md',
  'PROFILE.md', 'BOOTSTRAP.md', 'PROTOCOL_PETORRETA.md', '00_INDEX_ESCRIPTORI.md', '00_index_escriptori.md',
  'REGISTRE_CODI.md', '.gitkeep']);
const CODE = new Set(['.mjs', '.js', '.cjs', '.jsx', '.ts', '.tsx', '.css', '.php', '.sh', '.py', '.sql', '.yaml', '.yml', '.html']);
const THERMO = /^\d{6}_\d{4}_[a-z0-9]+(?:_[a-z0-9]+){1,6}\.(md|txt|json|csv)$/;
const within = (rel, dir) => rel === dir || rel.startsWith(dir + '/');
const answer = (decision, reason) => ({ decision, reason });
export function decide(payload, root = ROOT) {
  const call = payload?.toolCall;
  if (!call || typeof call.name !== 'string' || !call.args || typeof call.args !== 'object')
    return answer('deny', 'Payload desconegut: falta toolCall.name/args');
  const args = call.args;
  if (call.name === 'run_command') {
    const cmd = args.CommandLine ?? args.command;
    // No inferim efectes d'un script a partir del seu directori.
    const reads = new Set(['git status --short', 'git diff --stat', 'git diff --check',
      'node tooling/brain/cataleg_skills.mjs --check', 'node tooling/gates/tractor-manifest.mjs --json']);
    return reads.has(cmd) ? answer('allow', 'Ordre exacta de diagnòstic')
      : answer('ask', 'Efectes de shell no modelats: cal autorització explícita de l’arnés');
  }
  if (!WRITES.has(call.name) && call.name !== 'create_directory') return answer('deny', 'Eina no reconeguda');
  const targets = [args.TargetFile, args.AbsolutePath, args.DirectoryPath].filter(v => v !== undefined);
  if (!targets.length || targets.some(v => typeof v !== 'string' || !v.trim())) return answer('deny', 'Destí absent o invàlid');
  const absolute = targets.map(v => path.resolve(root, v));
  if (new Set(absolute).size !== 1) return answer('deny', 'Diversos destins incompatibles');
  const rel = path.relative(root, absolute[0]).split(path.sep).join('/');
  try { segura(root, rel); } catch (e) { return answer('deny', e.message); }
  const parts = rel.split('/'), base = parts.at(-1), ext = path.extname(base).toLowerCase();
  if (parts.some(p => p === '.git' || p === 'node_modules' || p === '.brain-trash' ||
      p === '.env' || (p.startsWith('.env.') && p !== '.env.example'))) return answer('deny', 'Destí protegit');
  if (parts.some(p => p.toLowerCase() === '90_arxiu_historic')) return answer('deny', 'Arxiu històric de lectura');
  if (within(rel, `${ESCRIPTORI}/01_produccio`) || within(rel, `${ESCRIPTORI}/01_Produccio`))
    return answer('deny', 'Producció humana protegida');
  const constitutional = within(rel, '.agents') || within(rel, 'tooling/gates') || within(rel, 'tooling/brain') ||
    within(rel, 'supabase/migrations') || rel === 'tooling/wiki/reflex_petorreta.mjs';
  if (constitutional && !['.agents/ESTAT.md', '.agents/LEDGER.md'].includes(rel)) return answer('deny', 'Contracte executable: aplicació manual');
  if (['.zip', '.tar', '.gz', '.tgz'].includes(ext)) return answer('deny', 'Paquet comprimit fora del contracte');
  if (/\.abans-\d{6}$|\.(bak|old|orig|tmp|copy)$|^(prova|test|tmp|temp|scratch|borrador)[-_.]|\bcopy\b|\(\d+\)\./i.test(base))
    return answer('deny', 'Còpia o fitxer de treball fora de lloc');
  if (base === 'LEDGER.md' && (call.name !== 'write_to_file' || args.Overwrite))
    return answer('ask', 'Cal comprovar que el canvi només afig al LEDGER');
  if (parts.length === 1 && !base.startsWith('.') && !RESERVED.has(base) && !CODE.has(ext))
    return answer('deny', 'Document de treball fora de l’escriptori');
  if (within(rel, ESCRIPTORI)) {
    const tail = rel.slice(ESCRIPTORI.length + 1);
    if (tail.includes('/') || call.name === 'create_directory') return answer('ask', 'Subcarpeta permanent: cal decisió explícita');
    if (!RESERVED.has(base) && !THERMO.test(base)) return answer('deny', 'Nom termodinàmic invàlid');
  }
  if (ext === '.css') {
    const fragments = [args.CodeContent, args.ReplacementContent,
      ...(Array.isArray(args.ReplacementChunks) ? args.ReplacementChunks.map(c => c.ReplacementContent) : [])];
    if (fragments.some(s => typeof s === 'string' && s.includes('!important'))) return answer('deny', 'Invariant CSS !important');
  }
  if (WRITES.has(call.name) && ext === '.md' && within(rel, '_wiki_de_poble')) {
    try {
      const config = JSON.parse(font(root, '.agents/DESTINS_CANONICS.json').text);
      const destinations = Object.values(config.destins_permesos ?? {});
      if (!destinations.length || destinations.some(d => typeof d !== 'string')) throw new Error('Destins invàlids');
      for (const d of destinations) segura(root, d);
      if (!destinations.some(d => within(rel, d))) throw new Error('Destí no canònic');
      const receipt = verificaEmissio(payload, root);
      return answer('allow', `Context emés i vigent: ${receipt.torn}; destí ${rel}`);
    } catch (e) { return answer('deny', e.message); }
  }
  return answer('allow', `Ruta conforme: ${rel}`);
}
try { console.log(JSON.stringify(decide(JSON.parse(fs.readFileSync(0, 'utf8'))))); }
catch (e) { console.log(JSON.stringify(answer('deny', e.message))); }
```

### A08 · Porta del manifest

```javascript
import { catalegCLI } from '../brain/cataleg_skills.mjs';
process.exitCode = catalegCLI();
```

### A09 · Adaptador d’índex

```javascript
import { catalegCLI } from '../brain/cataleg_skills.mjs';
process.exitCode = catalegCLI();
```

### A10 · Adaptador sense espills

```javascript
import { catalegCLI } from '../brain/cataleg_skills.mjs';
process.exitCode = catalegCLI();
```

### A11 · Adaptador Python retirat

```python
#!/usr/bin/env python3
"""Àlies retirat: comprova/genera el catàleg; mai crea espills."""
import argparse
import os
from pathlib import Path
import subprocess


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('root', type=Path)
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    root = args.root.resolve(strict=True)
    command = Path(__file__).resolve().with_name('cataleg_skills.mjs')
    return subprocess.run(['node', str(command), '--escriu' if args.write else '--check'],
                          cwd=root, env={**os.environ, 'SDP_ARREL': str(root)}, check=False).returncode


if __name__ == '__main__':
    raise SystemExit(main())
```

### A12 · Cridador de manteniment

```sh
#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_ROOT=${1:-.}
REPORT_DIR=${2:-"$PROJECT_ROOT/.brain-reports"}

mkdir -p "$REPORT_DIR"

AUDIT_STATUS=0
python3 "$SCRIPT_DIR/brain_audit.py" "$PROJECT_ROOT" \
  --policy "$SCRIPT_DIR/brain_policy.json" \
  --json "$REPORT_DIR/audit.json" \
  --markdown "$REPORT_DIR/audit.md" \
  --fail-on high || AUDIT_STATUS=$?

python3 "$SCRIPT_DIR/brain_distill.py" plan "$PROJECT_ROOT" \
  --output "$REPORT_DIR/distill-plan.json"

MIRROR_STATUS=0
SDP_ARREL="$PROJECT_ROOT" node "$SCRIPT_DIR/cataleg_skills.mjs" --check || MIRROR_STATUS=$?

printf '%s\n' "Informes escrits en: $REPORT_DIR"
printf '%s\n' "No s'han modificat fonts; només s'han escrit els informes anteriors."

if [ "$AUDIT_STATUS" -ne 0 ]; then
  exit "$AUDIT_STATUS"
fi
exit "$MIRROR_STATUS"
```

### A13 · Tancament sense regeneració

```javascript
#!/usr/bin/env node
/**
 * tooling/gates/tancament.mjs
 * Orquestrador del gatekeeper (pre-commit o manual)
 */

import { VerificadorSCC } from './verificador-scc.mjs';
import { R } from '../lib/arrel.mjs';

import { execFileSync } from 'node:child_process';

async function main() {
  const args = process.argv.slice(2);
  const isJsonMode = args.includes('--json');
  
  const rootDir = R('.');

  // Catàleg de només lectura: el tancament mai regenera espills.
  try {
    if (!isJsonMode) console.log("🧠 Comprovant el catàleg de skills...");
    execFileSync(process.execPath, ['tooling/brain/cataleg_skills.mjs', '--check'], { cwd: rootDir, stdio: 'pipe' });
  } catch (e) {
    throw new Error(`Catàleg divergent: ${e.stdout?.toString() || e.message}`);
  }


  
  const verificador = new VerificadorSCC(rootDir);
  const result = await verificador.runAudits();

  if (isJsonMode) {
    // Escriure JSON net per stdout
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    process.exit(result.valid ? 0 : 1);
  }

  // Sortida per humans (si no porta --json)
  if (result.valid) {
    console.log("\n✅ AUDITORIA SCC COMPLETADA AMB ÈXIT.");
    console.log("   Tots els nodes estan actius i l'escriptori està impol·lut. Sessió neta.");
    process.exit(0);
  } else {
    console.error("\n❌ ERROR CRÍTIC: EL TANCAMENT HA FALLAT PER VIOLACIÓ DE REGLES.");
    
    for (const err of result.errors) {
      console.error(`\n🚨 [${err.code}] ${err.message}`);
      if (err.affected_files && err.affected_files.length > 0) {
        console.error("   Fitxers afectats:");
        for (const file of err.affected_files) {
          console.error(`     - ${file}`);
        }
      }
    }
    console.error("\n🔒 Resol aquests defectes abans de continuar.");
    process.exit(1);
  }
}

main().catch(e => {
  console.error("\n💥 Error inesperat durant l'auditoria:", e);
  process.exit(1);
});
```

### A14 · Quarantena recuperable

```javascript
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, segura, MIRRORS } from './cataleg_skills.mjs';
const args = process.argv.slice(2);
if (args.some(a => a !== '--aplica')) throw new Error('Ús: [--aplica]');
const seen = new Set();
const plan = [];
for (const rel of MIRRORS) {
  const candidate = path.join(ROOT, rel);
  if (!fs.existsSync(candidate)) continue;
  let cursor = ROOT;
  let exact = true;
  for (const part of rel.split('/')) {
    if (!fs.readdirSync(cursor).includes(part)) { exact = false; break; }
    cursor = path.join(cursor, part);
    if (fs.lstatSync(cursor).isSymbolicLink()) throw new Error(`Symlink prohibit: ${rel}`);
  }
  if (!exact) continue; // APFS pot resoldre també l’àlies amb capitalització antiga.
  const real = fs.realpathSync(candidate);
  if (seen.has(real)) continue;
  seen.add(real);
  const canonical = path.relative(ROOT, real).split(path.sep).join('/');
  segura(ROOT, canonical);
  const target = `.brain-trash/260920_consolidacio/${canonical}`;
  segura(ROOT, target);
  if (fs.existsSync(path.join(ROOT, target))) throw new Error(`Quarantena ocupada: ${target}`);
  plan.push({ source: canonical, target });
}
console.log(JSON.stringify(plan, null, 2));
if (args.includes('--aplica')) for (const step of plan) {
  const target = segura(ROOT, step.target);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.renameSync(segura(ROOT, step.source), target);
}
```

### A15 · Port immutable

```javascript
import { CONTRACTE_BACKEND, CONTRACTE_NUCLI, CAPACITATS } from './contracte.js';

let currentImpl = null;
let isLocked = false;
let dispose = null;
const EMPTY = Object.freeze(Object.create(null));

export function setBackendImplementation(impl, force = false) {
  const isDev = import.meta.env?.DEV === true ||
    (typeof process !== 'undefined' && process.env.NODE_ENV === 'development');
  if (isLocked && !(force && isDev)) throw new Error('[backendPort] Backend bloquejat');
  if (!impl || typeof impl !== 'object') throw new TypeError('[backendPort] Implementació invàlida');
  const prepared = validaBackendImplementation(impl);
  // Commit després de validar-ho tot; cap mètode de la implementació vella sobreviu.
  currentImpl = prepared.candidate;
  dispose = prepared.dispose;
}
export function validaBackendImplementation(impl) {
  if (!impl || typeof impl !== 'object') throw new TypeError('[backendPort] Implementació invàlida');
  const candidate = Object.create(null);
  for (const name of CONTRACTE_BACKEND) {
    // La resolució normal conserva l'override de la instància/subclasse.
    // Els getters no s'executen com a efecte lateral de validar el contracte.
    let owner = impl, descriptor;
    while (owner && owner !== Object.prototype) {
      descriptor = Object.getOwnPropertyDescriptor(owner, name);
      if (descriptor) break;
      owner = Object.getPrototypeOf(owner);
    }
    if (!descriptor) continue;
    if (!('value' in descriptor) || typeof descriptor.value !== 'function')
      throw new TypeError(`[backendPort] ${name} ha de ser un mètode`);
    candidate[name] = descriptor.value.bind(impl);
  }
  const missing = CONTRACTE_NUCLI.filter(name => typeof candidate[name] !== 'function');
  if (missing.length) throw new Error(`[backendPort] Nucli incomplet: ${missing.join(', ')}`);
  for (const [cap, methods] of Object.entries(CAPACITATS)) {
    const count = methods.filter(name => typeof candidate[name] === 'function').length;
    if (count && count !== methods.length) throw new Error(`[backendPort] Capacitat parcial: ${cap}`);
  }
  const teardown = Object.getOwnPropertyDescriptor(impl, 'destroy');
  if (teardown && (!('value' in teardown) || typeof teardown.value !== 'function'))
    throw new TypeError('[backendPort] destroy invàlid');
  return { candidate: Object.freeze(candidate), dispose: teardown ? teardown.value.bind(impl) : null };
}
export function getBackendImplementation() { return currentImpl || EMPTY; }
export function freezeImplementation() {
  if (!currentImpl) throw new Error('[backendPort] No hi ha backend per segellar');
  isLocked = true;
}
export function destroy() { const fn = dispose; dispose = null; return fn?.(); }
export function teCapacitat(cap) {
  return Object.hasOwn(CAPACITATS, cap) && !!currentImpl && CAPACITATS[cap].every(name => typeof currentImpl[name] === 'function');
}

const asseguraMetode = (nom) => (...args) => {
  if (!currentImpl || typeof currentImpl[nom] !== 'function') {
    throw new Error(`[backendPort] El mètode "${nom}" no està implementat al backend actual.`);
  }
  return currentImpl[nom](...args);
};

export const getDefaultUserId = asseguraMetode('getDefaultUserId');
export const refrescaSessio = asseguraMetode('refrescaSessio');
export const elMeuRol = asseguraMetode('elMeuRol');

export const loadCoreContent = asseguraMetode('loadCoreContent');
export const loadMur = asseguraMetode('loadMur');
export const loadMultimedia = asseguraMetode('loadMultimedia');
export const loadNotes = asseguraMetode('loadNotes');
export const appendChatMessages = asseguraMetode('appendChatMessages');

export const appendSectionSubmissionNetworkOnly = asseguraMetode('appendSectionSubmissionNetworkOnly');
export const updateNote = asseguraMetode('updateNote');
export const loginWithMagicLink = asseguraMetode('loginWithMagicLink');
export const registerWithPassword = asseguraMetode('registerWithPassword');
export const loginWithPassword = asseguraMetode('loginWithPassword');
export const loginWithGoogle = asseguraMetode('loginWithGoogle');
export const listMyOrganizations = asseguraMetode('listMyOrganizations');
export const createOrganization = asseguraMetode('createOrganization');
export const updateOrganization = asseguraMetode('updateOrganization');
export const updateProfile = asseguraMetode('updateProfile');
export const updateUserPassword = asseguraMetode('updateUserPassword');
export const getProfile = asseguraMetode('getProfile');
export const recullTornadaOAuth = async (...args) => {
  await import('../host.js').then(m => m.quanLlest());
  if (!currentImpl || typeof currentImpl['recullTornadaOAuth'] !== 'function') {
    return Promise.reject(new Error(`[backendPort] El mètode "recullTornadaOAuth" no està implementat al backend actual.`));
  }
  return currentImpl['recullTornadaOAuth'](...args);
};
export const logout = asseguraMetode('logout');
export const getCurrentUser = asseguraMetode('getCurrentUser');
export const getBackendConfigurat = asseguraMetode('getBackendConfigurat');
export const getRuntimeDataMode = asseguraMetode('getRuntimeDataMode');


// Nous mètodes per al Xat v2 i el pont amb Notes
export const createNote = asseguraMetode('createNote');
export const loadFils = asseguraMetode('loadFils');
export const loadMissatges = asseguraMetode('loadMissatges');
export const enviaMissatge = asseguraMetode('enviaMissatge');
export const marcaLlegit = asseguraMetode('marcaLlegit');
export const creaFilDirecte = asseguraMetode('creaFilDirecte');
export const carregaMembres = asseguraMetode('carregaMembres');
export const subscribeToXat = asseguraMetode('subscribeToXat');
export const unsubscribeFromXat = asseguraMetode('unsubscribeFromXat');

// Mode Administrador
export const adminListUsers = asseguraMetode('adminListUsers');
export const adminListOrganizations = asseguraMetode('adminListOrganizations');


/* Fase 4 · Mitjans (capacitat 'mitjans').
   Cap component importa Supabase: demanen la capacitat i, si no hi és,
   es queden amb el comportament d'abans. */
export const uploadToStorage = async (...args) => {
  await import('../host.js').then(m => m.quanLlest());
  if (!currentImpl || typeof currentImpl['uploadToStorage'] !== 'function') {
    throw new Error(`[backendPort] El mètode "uploadToStorage" no està implementat al backend actual.`);
  }
  return currentImpl['uploadToStorage'](...args);
};
export const getPublicUrl = asseguraMetode('getPublicUrl');
export const resolveAsset = asseguraMetode('resolveAsset');
export const promoteToPublic = asseguraMetode('promoteToPublic');

/* Fase 5 · Agenda */
export const loadActesAgenda = asseguraMetode('loadActesAgenda');
```

### A16 · Arrancada sense fusió

```javascript
/**
 * host.js — LA PRESA DE CORRENT DE SÓC DE POBLE
 *
 * EL PROBLEMA QUE RESOL (auditoria 260830)
 * ────────────────────────────────────────
 * `backendPort.js` està ben fet: cap mòdul importa `supabaseBackend.js`
 * directament, tot passa pel port, i el pany s'arma. Però la Llei de
 * l'Enxufabilitat (AGENTS.md §8) era **inassolible a la pràctica**, per tres
 * barreres acumulades:
 *
 *   1 · `setBackendImplementation` no s'exposava a cap global. Zero
 *       assignacions `window.*` en tot `src/`.
 *   2 · El build standalone declara explícitament que NO és un mòdul ESM.
 *       Sense ESM i sense global, no hi ha cap superfície de crida.
 *   3 · Encara que n'hi haguera: `freezeImplementation()` es crida dins de
 *       `connectedCallback`, que dispara SÍNCRONAMENT durant
 *       `customElements.define()` quan l'etiqueta ja és al DOM — que és
 *       exactament el cas del plugin. La finestra d'injecció era de zero
 *       mil·lisegons.
 *
 * El port existia, era correcte, i estava soldat per dins.
 *
 * L'ARQUITECTURA NOVA: ARRENCADA EN DUES FASES
 * ────────────────────────────────────────────
 * El pany segueix sent innegociable — un backend injectable després del
 * muntatge seria un vector d'atac. El que canvia és QUAN es tanca:
 *
 *   Fase 1 · CONFIGURACIÓ   El host pot cridar `configura({ backend })`.
 *                           L'element encara no està definit.
 *   Fase 2 · SEGELLAT       `arrenca()` congela el backend i defineix
 *                           l'element. A partir d'ací, res es pot injectar.
 *
 * Per a entorns que necessiten arrencada sense configuració, `arrencaAuto()`
 * fa la fase 2 sola en el següent tick. Un `<script>` del host col·locat
 * després del bundle encara arriba a temps per a la fase 1, perquè el tick
 * no s'ha consumit.
 *
 * COM L'USA SOLLUTIA
 * ──────────────────
 * Si s'empra `type="module"`, el host carrega de forma diferida. Per evitar
 * curses, Sollutia ha d'esperar l'esdeveniment `socdepoble-ready` o
 * comprovar si ja està llest:
 *
 *   function bootSollutia() {
 *     window.SocDePoble.configura({ backend: { ... } });
 *     window.SocDePoble.arrenca();
 *   }
 *
 *   if (window.SocDePoble && window.SocDePoble.isReady) {
 *     bootSollutia();
 *   } else {
 *     window.addEventListener('socdepoble-ready', bootSollutia);
 *   }
 *
 * Per a substituir Supabase del tot (l'objectiu d'integració amb Sollutia), es passa el
 * contracte sencer i `supabaseBackend.js` deixa de tocar-se en temps d'execució.
 *
 * COM S'USA EN ENTORN ESTÀNDARD
 * ─────────────────────────────
 *   El build standalone acaba cridant `arrencaAuto()`. Si ningú ha configurat
 *   res, s'arrenca amb Supabase de forma autònoma.
 *
 * NOTA D'HONESTEDAT
 * ─────────────────
 * El cicle de vida dels Custom Elements no s'ha pogut provar en aquest entorn
 * (no hi ha navegador ni node_modules). L'estructura del mòdul i l'ordre de
 * crides sí que estan raonats contra el codi real de `PedraSecaEmbed.jsx`,
 * però la fase 2 s'ha de verificar en un navegador abans de donar-la per bona.
 * Vegeu `tooling/gates/tractor-enxufe.mjs` per a la comprovació estàtica.
 */

if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    console.error('[host] Error de xarxa en la càrrega diferida de mòduls Vite:', event);
    // El catch de l'arrenca pintarà això si passa durant l'arrencada, 
    // però això ens cobreix canvis de ruta asíncrons.
  });
}

import { setBackendImplementation, getBackendImplementation, freezeImplementation, validaBackendImplementation } from './data/backendPort.js';
import { defineCustomElement } from './PedraSecaEmbed.jsx';
import { CONTRACTE_NUCLI, CONTRACTE_BACKEND } from './data/contracte.js';
import { adoptaSessioExterna, esborraSessio } from './data/identitat.js';
import { setRuntimePolicy, getRuntimePolicy, esOrigenPermes } from './config/runtimePolicy.js';

/* ═══════════════════════ Estat de l'arrencada ═══════════════════════ */

const FASE = { CONFIGURABLE: 'configurable', ARRENCANT: 'arrencant', SEGELLAT: 'segellat' };
let fase = FASE.CONFIGURABLE;
let arrencada = null;
let resolveLlest = null;
let rejectLlest = null;
const promesaLlest = new Promise((resolve, reject) => { 
  resolveLlest = resolve; 
  rejectLlest = reject;
});

// Re-exportem CONTRACTE_BACKEND per retrocompatibilitat si algú l'importa des d'ací
export { CONTRACTE_BACKEND };

let _segellat = false;
let _deferArrenca = false;

export function deferArrenca() {
  _deferArrenca = true;
}

/* ═══════════════════════ Fase 1 · Configuració ═══════════════════════ */

/**
 * Injecta una implementació de backend abans del segellat.
 *
 * Mode estricte: la injecció ha de proveir el contracte sencer (nucli + capacitats) per a
 * evitar barreges perilloses entre Supabase i el nou backend de Sollutia.
 *
 * @param {{backend?: Record<string, Function>, auth?: { issuer?: string, audiences?: string[], parentOrigins?: string[] }}} opcions
 * @returns {{acceptats: string[], desconeguts: string[], pendents: string[]}}
 * @throws {Error} si ja s'ha segellat
 */
export function configura({ backend, auth } = {}) {
  if (_segellat || fase !== FASE.CONFIGURABLE) throw new Error('[host] L’arrancada ja ha començat');
  const prepared = backend ? validaBackendImplementation(backend) : null;
  // Validar abans de congelar la política evita deixar-la ocupada per una injecció invàlida.
  setRuntimePolicy({ backend, auth });
  if (!prepared) return { acceptats: [], desconeguts: [], pendents: [...CONTRACTE_NUCLI] };
  setBackendImplementation(backend);
  return { acceptats: Object.keys(prepared.candidate), desconeguts: [], pendents: [] };
}

/* ═══════════════════════ Fase 2 · Segellat ═══════════════════════ */

/**
 * Congela el backend i defineix `<soc-de-poble>`. Idempotent.
 *
 * @returns {Promise<{fase: string, backend: string[]}>}
 */
export function arrenca() {
  if (arrencada) return arrencada;

  fase = FASE.ARRENCANT;
  _segellat = true;

  arrencada = (async () => {
    try {
      const injectats = Object.keys(getBackendImplementation());
      const pendentsNucli = CONTRACTE_NUCLI.filter((k) => !injectats.includes(k));

      if (injectats.length && pendentsNucli.length) throw new Error('[host] Backend injectat incomplet');
      if (!injectats.length) {
        const supabaseImpl = await import('./data/supabase/index.js');
        setBackendImplementation(supabaseImpl);
      }

      freezeImplementation();
      defineCustomElement();
      
      fase = FASE.SEGELLAT;
      
      const finalEstat = { fase, backend: Object.keys(getBackendImplementation()) };
      if (resolveLlest) resolveLlest(finalEstat);
      return finalEstat;
    } catch (e) {
      fase = FASE.CONFIGURABLE; // Permetem tornar a intentar
      _segellat = false;
      arrencada = null;
      if (rejectLlest) rejectLlest(e);
      throw e;
    }
  })();

  return arrencada;
}

export function quanLlest() {
  return promesaLlest;
}

function processarCua() {
  if (typeof window !== 'undefined' && window.SocDePobleCua && Array.isArray(window.SocDePobleCua)) {
    while (window.SocDePobleCua.length > 0) {
      const accio = window.SocDePobleCua.shift();
      try {
        if (Array.isArray(accio) && accio[0] === 'sessio') {
          injectaSessio(accio[1], accio[2] || {});
        } else if (Array.isArray(accio) && accio[0] === 'configura') {
          configura(accio[1]);
        }
      } catch (err) {
        console.error('[host] Error processant element de la cua:', err);
      }
    }
    // Sobreescriu push per executar directament
    window.SocDePobleCua.push = (...args) => {
      for (const accio of args) {
        try {
          if (Array.isArray(accio) && accio[0] === 'sessio') {
            injectaSessio(accio[1], accio[2] || {});
          } else if (Array.isArray(accio) && accio[0] === 'configura') {
            configura(accio[1]);
          }
        } catch (err) {
          console.error('[host] Error processant nou element de la cua:', err);
        }
      }
      return Array.prototype.push.apply(window.SocDePobleCua, args);
    };
  }
}

/**
 * Arrencada automàtica per als entorns que no configuren res.
 * Utilitza queueMicrotask (0 timers) excepte si està indicat explícitament.
 */
export function arrencaAuto() {
  if (fase === FASE.SEGELLAT || _deferArrenca) return;
  setTimeout(() => {
    if (_deferArrenca) return;
    // Si després de microtaskes encara som configurables i cap <soc-de-poble arrencada="manual"> ho ha aturat
    const tags = typeof document !== 'undefined' ? document.querySelectorAll('soc-de-poble') : [];
    let isManual = false;
    tags.forEach(tag => {
      if (tag.getAttribute('arrencada') === 'manual') isManual = true;
    });
    
    if (!isManual && fase !== FASE.SEGELLAT && fase !== FASE.ARRENCANT) {
      arrenca().catch((e) => {
        console.error('[host] Arrencada fallida. El component no es muntarà:', e);
        if (typeof document !== 'undefined') {
          tags.forEach(tag => {
            tag.innerHTML = `<div class="sdp-arranc-fallida">
              <h3>Error crític d'arrencada</h3>
              <p>Sóc de Poble no ha pogut connectar amb el backend.</p>
              <pre></pre>
            </div>`;
            tag.querySelector('pre').textContent = e.message || String(e);
          });
        }
      });
    }
  }, 0);
}

/** Estat actual, per a diagnòstic des de la consola del host. */
export function estat() {
  const policy = getRuntimePolicy(true);
  return {
    fase,
    configurable: fase === FASE.CONFIGURABLE,
    contracte: CONTRACTE_BACKEND,
    implementat: Object.keys(getBackendImplementation()),
    config: {
      sollutiaIssuer: policy?.auth?.issuer
    }
  };
}

/**
 * L'amfitrió entrega una sessió. Vàlid en qualsevol fase.
 */
export function injectaSessio(sessio, opcions = {}) {
  return adoptaSessioExterna(sessio, opcions);
}

/** L'amfitrió tanca la sessió del seu costat. */
export function expulsaSessio() {
  esborraSessio();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: null } }));
  }
  return true;
}

/* ═══════════════════════ Superfície global ═══════════════════════ */

export function exposaGlobal(objectiu = (typeof window !== 'undefined' ? window : undefined)) {
  if (!objectiu) return null;

  const existent = Object.getOwnPropertyDescriptor(objectiu, 'SocDePoble');
  if (existent) {
    console.warn('[host] exposaGlobal cridat quan window.SocDePoble ja existeix. S\'ignora.');
    return existent.value ?? null;
  }

  const api = Object.freeze({ configura, arrenca, arrencaAuto, deferArrenca, estat, CONTRACTE_BACKEND, injectaSessio, expulsaSessio, quanLlest, isReady: true });
  Object.defineProperty(objectiu, 'SocDePoble', { value: api, writable: false, configurable: false });
  
  processarCua();
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('socdepoble-ready', { detail: api }));
    
    // Pont per a Iframe: permet comunicació bidireccional si el host ens incrusta
    if (window.parent && window.parent !== window) {
      window.addEventListener('message', (event) => {
        const isAllowed = esOrigenPermes(event.origin) || event.origin === window.location.origin;

        // 1. Validació estricta d'origen i font
        if (!isAllowed) return;
        if (event.source !== window.parent) return;

        // 2. Validació d'estructura del missatge
        const data = event.data;
        if (!data || typeof data !== 'object' || data.type !== 'SDP_HOST_CMD') return;
        if (typeof data.cmd !== 'string') return;

        const { cmd, payload, requestId = null } = data;

        const responHost = (ok, result = null, error = null) => {
          event.source?.postMessage({
            type: 'SDP_HOST_ACK',
            cmd,
            requestId,
            ok,
            result,
            error: error ? String(error) : null
          }, event.origin);
        };

        if (cmd === 'SDP_PING') {
          const estatActual = estat();
          responHost(true, { fase: estatActual.fase, configurable: estatActual.configurable });
          return;
        }

        if (cmd === 'injectaSessio') {
          if (!payload || typeof payload !== 'object' || !payload.sessio) {
            responHost(false, null, 'Payload de sessió invàlid o absent');
            return;
          }
          
          const opcions = payload.opcions || {};
          const policy = getRuntimePolicy(true);
          // Fallback segur: atribut de l'element o variable d'entorn
          if (!opcions.emissorEsperat) {
            opcions.emissorEsperat = policy.auth.issuer;
          }
          
          if (!opcions.emissorEsperat) {
             console.error('[host] Sessió rebutjada: emissorEsperat és obligatori per seguretat (via opcions o configuració/entorn)');
             responHost(false, null, 'Sessió rebutjada: emissorEsperat obligatori');
             return;
          }
          
          const ok = adoptaSessioExterna(payload.sessio, opcions);
          responHost(ok, null, ok ? null : 'Sessió invàlida o rebutjada');
          return;
        } else if (cmd === 'expulsaSessio') {
          expulsaSessio();
          responHost(true);
          return;
        } else if (cmd === 'arrenca') {
          arrenca().then((estatFinal) => {
            responHost(true, estatFinal);
          }).catch((e) => {
            console.error('[host] Error en arrenca() via iframe:', e);
            responHost(false, null, e instanceof Error ? e.message : String(e));
          });
          return;
        }
        
        responHost(false, null, `Comanda desconeguda: ${cmd}`);
      });
      
      const estatActual = estat();
      const estatSegur = { fase: estatActual.fase, configurable: estatActual.configurable };
      try {
        window.parent.postMessage({ type: 'SDP_READY', estat: estatSegur }, '*');
      } catch { /* cross-origin silenciós */ }
    }
  }
  
  return api;
}
```

### A17 · Credencials públiques

```javascript
/** Comprova la forma pública de les credencials; no valida signatures ni permisos remots. */
export function validatePublicCredentials(supabaseUrl, anonKey) {
  if (typeof supabaseUrl !== 'string' || typeof anonKey !== 'string' || !supabaseUrl || !anonKey)
    throw new Error('Falta URL o clau pública de Supabase');
  let url;
  try { url = new URL(supabaseUrl); } catch { throw new Error('URL de Supabase invàlida'); }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (!(url.protocol === 'https:' || (local && url.protocol === 'http:')) ||
      url.username || url.password || url.search || url.hash || url.pathname !== '/')
    throw new Error('Cal un origen HTTPS, o HTTP local, sense credencials ni ruta');
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(anonKey)) return;
  const parts = anonKey.split('.');
  if (parts.length !== 3 || parts.some(p => !/^[A-Za-z0-9_-]+$/.test(p))) throw new Error('Format de clau pública no admés');
  let payload;
  try {
    const encoded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    payload = JSON.parse(atob(encoded + '='.repeat((4 - encoded.length % 4) % 4)));
  } catch { throw new Error('Clau JWT il·legible'); }
  if (payload.role !== 'anon') throw new Error('El navegador només admet la clau anon o publishable');
}
```

### A18 · Resolució i transport

```javascript
import { validatePublicCredentials } from '../../config/publicCredentials.js';
import { APP_SEED, APP_SEED_VERSION, getDefaultUserId } from '../appSeed.js';
import { getEfimer } from '../../config/storage.js';
import { CLAU_JWT, usuariDeSessio } from '../identitat.js';
import { permetOrigenMitjans } from '../../utils/sanitize.js';

export class ErrorSupabase extends Error {
  constructor(message, status) { super(message); this.name = 'ErrorSupabase'; this.status = status; }
}

let refresca = async () => false;
export const configuraRefrescSessio = (callback) => { refresca = callback; };

export function generateUUID() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  if (globalThis.crypto?.getRandomValues) {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
      (c ^ globalThis.crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 3 | 8)).toString(16);
  });
}

export const normalizeDataMode = (mode) => ['remote', 'seed', 'local'].includes(mode) ? mode : 'remote';
export function getResolvedConfig(config = {}) {
  const supabaseUrl = typeof config.supabaseUrl === 'string' ? config.supabaseUrl.replace(/\/$/, '') : (config.supabaseUrl || '');
  const supabaseAnonKey = config.supabaseAnonKey || '';
  const tenantId = config.tenantId || null;
  if (supabaseUrl || supabaseAnonKey) {
    validatePublicCredentials(supabaseUrl, supabaseAnonKey);
    permetOrigenMitjans(supabaseUrl);
  }
  return { supabaseUrl, supabaseAnonKey, tenantId, dataMode: normalizeDataMode(config.dataMode),
    hasSupabaseConfig: Boolean(supabaseUrl && supabaseAnonKey), runtimeDataMode: normalizeDataMode(config.dataMode) };
}
export const getBackendConfigurat = (config = {}) => getResolvedConfig(config).hasSupabaseConfig;
export const getRuntimeDataMode = (config = {}) => getResolvedConfig(config).runtimeDataMode;
export const getCurrentUser = () => usuariDeSessio();

const buildHeaders = (anonKey, extra = {}) => {
  const jwt = getEfimer(CLAU_JWT);
  return { apikey: anonKey, Authorization: `Bearer ${jwt || anonKey}`, 'Content-Type': 'application/json', ...extra };
};

export async function request(path, config = {}, options = {}) {
  const { method = 'GET', headers = {}, body, signal, timeoutMs = 12000, _isRetry = false } = options;
  const { supabaseUrl, supabaseAnonKey, hasSupabaseConfig } = getResolvedConfig(config);
  if (!hasSupabaseConfig) throw new Error('Falten VITE_SUPABASE_URL i/o VITE_SUPABASE_ANON_KEY.');
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const avorta = () => controller.abort();
  signal?.addEventListener('abort', avorta);
  try {
    if (signal?.aborted) {
      const err = new Error('Abortat abans de començar');
      err.name = 'AbortError';
      throw err;
    }
    const response = await fetch(`${supabaseUrl}${path}`, { method, redirect: 'error', headers: buildHeaders(supabaseAnonKey, headers),
      signal: controller.signal, body: body === undefined ? undefined : JSON.stringify(body) });
    if (!response.ok) {
      if (response.status === 401 && !_isRetry && !path.startsWith('/auth/') && await refresca(config)) {
        return request(path, config, { ...options, _isRetry: true });
      }
      const text = await response.text();
      throw new ErrorSupabase(`Supabase ${response.status}: ${text || 'Error desconegut.'}`, response.status);
    }
    if (response.status === 204) return null;
    const json = await response.json(); // F06: Esperar que descarregue tot el cos abans del finally
    return json;
  } catch (err) {
    if (timedOut) {
      const timeoutErr = new Error('La petició ha trigat massa temps.');
      timeoutErr.name = 'TimeoutError';
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', avorta);
  }
}

export async function rpc(nom, cos, config = {}) {
  try { return await request(`/rest/v1/rpc/${nom}`, config, { method: 'POST', body: cos }); }
  catch (error) {
    if (error?.status === 404 || /PGRST20[25]/.test(String(error?.message || ''))) {
      throw new ErrorSupabase(`L'esquema requerit no està aplicat (falta "${nom}"). Executa les migracions corresponents.`, 404);
    }
    throw error;
  }
}

export function mapContentRowsToData(rows) {
  const lookup = new Map(rows.map((row) => [row.key, row.payload]));
  const remotes = lookup.get('noteFolders') || [];
  const ghostIds = new Set(['f-root', 'f-general', 'f-articles', 'f-histories', 'f-prompts', 'f-captures', 'f-event', 'f-mapa']);
  const folders = remotes.filter((f) => !ghostIds.has(f.id));
  const remoteNotes = lookup.get('notes') || [];
  return { ownerUserId: getDefaultUserId(), agents: lookup.get('agents') || [], feedPosts: lookup.get('feedPosts') || [],
    marketItems: lookup.get('marketItems') || [], events: lookup.get('events') || [], towns: lookup.get('towns') || [],
    mediaItems: lookup.get('mediaItems') || [],
    noteFolders: [...APP_SEED.noteFolders.map((s) => folders.find((f) => f.id === s.id) || s), ...folders.filter((f) => !APP_SEED.noteFolders.some((s) => s.id === f.id))],
    notes: [...APP_SEED.notes.map((s) => ({ ...(remoteNotes.find((n) => n.id === s.id) || s), folderId: 'f-mur' })), ...remoteNotes.filter((n) => !APP_SEED.notes.some((s) => s.id === n.id))],
    pages: lookup.get('pages') || [], sectionSubmissions: [], chatMessages: [] };
}

export const buildSeedAppData = (ownerUserId = getDefaultUserId()) => Promise.resolve({ ownerUserId,
  agents: APP_SEED.agents, chatThreads: APP_SEED.chatThreads || [],
  chatMessages: (APP_SEED.chatMessages || []).filter((m) => m.ownerUserId === ownerUserId),
  feedPosts: APP_SEED.feedPosts, marketItems: APP_SEED.marketItems, events: APP_SEED.events, towns: APP_SEED.towns,
  mediaItems: APP_SEED.mediaItems, noteFolders: APP_SEED.noteFolders, notes: APP_SEED.notes, pages: APP_SEED.pages,
  sectionSubmissions: [], seedVersion: APP_SEED_VERSION });
export { APP_SEED_VERSION };
```

### A19 · Singleton fixat

```javascript
import { createClient } from '@supabase/supabase-js';
import { getResolvedConfig } from './runtime.js';
import { getEfimer } from '../../config/storage.js';
import { CLAU_JWT } from '../identitat.js';

let supabaseClient = null;
let jwtDelClient = null;
let pinned = null;
export function resetClient() {
  const previous = supabaseClient;
  supabaseClient = null;
  jwtDelClient = null;
  try { Promise.resolve(previous?.removeAllChannels?.()).catch(() => {}); } catch { /* ja tancat */ }
}
export async function getClient(config = {}) {
  const supplied = !!(config.supabaseUrl || config.supabaseAnonKey);
  const resolved = supplied ? getResolvedConfig(config) : getResolvedConfig(pinned || config);
  if (!resolved.hasSupabaseConfig) throw new Error('Falta configuració pública de Supabase');
  const { supabaseUrl, supabaseAnonKey } = resolved;
  if (pinned && (pinned.supabaseUrl !== supabaseUrl || pinned.supabaseAnonKey !== supabaseAnonKey))
    throw new Error('Un document només admet un origen i una clau pública de backend');
  const jwt = getEfimer(CLAU_JWT, null) || null;
  if (supabaseClient && jwtDelClient === jwt) return supabaseClient;
  resetClient();
  const candidate = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${jwt || supabaseAnonKey}` } },
  });
  if (jwt) await candidate.realtime?.setAuth?.(jwt);
  // Una sessió canviada mentre es configurava el client no es publica.
  if ((getEfimer(CLAU_JWT, null) || null) !== jwt) {
    await candidate.removeAllChannels();
    throw new Error('La sessió ha canviat mentre es creava el client; cal reintentar');
  }
  if (pinned && (pinned.supabaseUrl !== supabaseUrl || pinned.supabaseAnonKey !== supabaseAnonKey)) {
    await candidate.removeAllChannels();
    throw new Error('Configuració concurrent incompatible');
  }
  if (supabaseClient) {
    await candidate.removeAllChannels();
    return supabaseClient;
  }
  pinned ||= Object.freeze({ supabaseUrl, supabaseAnonKey });
  supabaseClient = candidate;
  jwtDelClient = jwt;
  return candidate;
}
if (typeof window !== 'undefined') window.addEventListener('sdp:auth-change', resetClient);
```

### A20 · Rutes Storage

```javascript
/**
 * @module supabase/storage
 * @description Gestió de fitxers amb Supabase Storage.
 * @contract
 *   - uploadFile(bucket, path, file)
 *   - downloadFile(bucket, path)
 *   - deleteFile(bucket, path)
 *   - listFiles(bucket, path)
 *   - getPublicUrl(bucket, path)
 *   - resolveAsset(ref)
 *   - promoteToPublic(ref)
 */

import { getResolvedConfig } from './runtime.js';
import { getClient } from './config.js';
import { usuariDeSessio } from '../identitat.js';
import { handleError } from './utils.js';

/**
 * Puja un fitxer a un bucket.
 * @param {string} bucket - Nom del bucket.
 * @param {string} path - Camí dins el bucket.
 * @param {File|Blob} file - Fitxer a pujar.
 * @param {object} config - Configuració
 * @returns {Promise<{data: object, error: object}>}
 */
export const uploadFile = async (bucket, path, file, config = {}) => {
  try {
    const supabase = await getClient(config);
    return await supabase.storage.from(bucket).upload(path, file);
  } catch (error) {
    return handleError(error);
  }
};

/**
 * Baixa un fitxer.
 * @param {string} bucket - Nom del bucket.
 * @param {string} path - Camí dins el bucket.
 * @param {object} config - Configuració
 * @returns {Promise<{data: Blob, error: object}>}
 */
export const downloadFile = async (bucket, path, config = {}) => {
  try {
    const supabase = await getClient(config);
    return await supabase.storage.from(bucket).download(path);
  } catch (error) {
    return handleError(error);
  }
};

/**
 * Elimina un fitxer o múltiples fitxers d'un bucket.
 * @param {string} bucket - Nom del bucket.
 * @param {string|string[]} pathOrPaths - Camí o array de camins dins el bucket.
 * @param {object} config - Configuració
 * @returns {Promise<{data: object, error: object}>}
 */
export const deleteFile = async (bucket, pathOrPaths, config = {}) => {
  try {
    const supabase = await getClient(config);
    const paths = Array.isArray(pathOrPaths) ? pathOrPaths : [pathOrPaths];
    return await supabase.storage.from(bucket).remove(paths);
  } catch (error) {
    return handleError(error);
  }
};

/**
 * Llista els fitxers d'un bucket.
 * @param {string} bucket - Nom del bucket.
 * @param {string} path - Camí dins el bucket (opcional).
 * @param {object} config - Configuració
 * @returns {Promise<{data: Array, error: object}>}
 */
export const listFiles = async (bucket, path = '', config = {}) => {
  try {
    const supabase = await getClient(config);
    return await supabase.storage.from(bucket).list(path);
  } catch (error) {
    return handleError(error);
  }
};

/**
 * Obté l'URL pública d'un fitxer.
 * @param {string} bucket - Nom del bucket.
 * @param {string} path - Camí dins el bucket.
 * @param {object} config - Configuració
 * @returns {Promise<string>}
 */
export const getPublicUrl = async (bucket, path, config = {}) => {
  const supabase = await getClient(config);
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
};

/**
 * Puja un fitxer al bucket per defecte de mitjans o mitjans_privats, complint el contracte.
 * @param {File} fitxer
 * @param {object} options
 * @param {object} config
 */
export const uploadToStorage = async (fitxer, { carpeta = 'general', tenantId } = {}, config = {}) => {
  const user = usuariDeSessio();
  if (!user?.id) throw new Error('Cal iniciar sessió');
  const resolvedTenant = getResolvedConfig(config).tenantId;
  if (tenantId && resolvedTenant && tenantId !== resolvedTenant) throw new Error('Poble inconsistent');
  const selectedTenant = tenantId || resolvedTenant;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuid.test(selectedTenant || '') || !uuid.test(user.id)) throw new Error('Poble o usuari invàlid');
  if (!/^[a-z0-9_-]{1,40}$/.test(carpeta)) throw new Error('Carpeta invàlida');
  const extensions = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/avif': 'avif', 'application/pdf': 'pdf' };
  const isPrivate = carpeta === 'notes';
  if (!(fitxer instanceof Blob) || !extensions[fitxer.type] || (!isPrivate && fitxer.type === 'application/pdf'))
    throw new Error('Format de fitxer no admés en este destí');
  if (!fitxer.size || fitxer.size > (isPrivate ? 25242880 : 5242880)) throw new Error('Mida de fitxer no admesa');
  const bucket = isPrivate ? 'mitjans_privats' : 'mitjans';
  const ruta = `${selectedTenant.toLowerCase()}/${user.id.toLowerCase()}/${carpeta}/${crypto.randomUUID()}.${extensions[fitxer.type]}`;
  const client = await getClient(config);
  const { error } = await client.storage.from(bucket).upload(ruta, fitxer, { upsert: false });
  if (error) throw new Error(handleError(error)?.message || 'No s’ha pogut pujar el fitxer');
  return { url: `sdp-media://${bucket}/${ruta}`, ruta };
};

/**
 * Resol un actiu (asset) a la seua URL real (pública o firmada temporal).
 * @param {string} ref - Referència opaca, ex. sdp-media://mitjans_privats/tenant_id/user_id/...
 * @param {object} config
 */
export const resolveAsset = async (ref, config = {}) => {
  if (!ref || typeof ref !== 'string') return ref;
  if (!ref.startsWith('sdp-media://')) return ref; // Backwards compatibility
  
  const pathPart = ref.replace('sdp-media://', '');
  const slashIndex = pathPart.indexOf('/');
  if (slashIndex === -1) return ref;
  
  const bucket = pathPart.substring(0, slashIndex);
  const path = pathPart.substring(slashIndex + 1);
  
  const supabase = await getClient(config);
  
  if (bucket === 'mitjans_privats') {
    // URL firmada amb 1 hora de duració (3600 segons)
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
    if (error) {
      console.warn("[Storage] No s'ha pogut generar URL firmada per", path, error);
      return ref;
    }
    return data.signedUrl;
  } else {
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }
};

/**
 * Promou un actiu privat a públic, movent-lo del bucket privat al públic.
 * @param {string} ref - Referència opaca de mitjans_privats
 * @param {object} config
 * @returns {Promise<string>} La nova referència promoguda
 */
export const promoteToPublic = async (ref, config = {}) => {
  if (!ref || typeof ref !== 'string') return ref;
  if (!ref.startsWith('sdp-media://mitjans_privats/')) return ref; 
  
  const path = ref.replace('sdp-media://mitjans_privats/', '');
  
  // 1. Descarreguem l'arxiu des del bucket privat
  const { data: fileData, error: downloadError } = await downloadFile('mitjans_privats', path, config);
  if (downloadError) {
    console.warn("[Storage] Error baixant el fitxer per a promoure'l", downloadError);
    return ref; // Deixem l'original
  }

  // 2. El pugem al bucket públic en la mateixa ruta
  const { error: uploadError } = await uploadFile('mitjans', path, fileData, config);
  if (uploadError) {
    console.warn("[Storage] Error pujant el fitxer al promoure'l", uploadError);
    return ref; 
  }
  
  // C17 (Auditoria): No esborrem l'original per evitar pèrdua de dades si falla 
  // la persistència de la nova referència o la publicació al Mur.
  // await deleteFile('mitjans_privats', path, config);

  return `sdp-media://mitjans/${path}`;
};
```

### A21 · Migració per a staging

```sql
-- PROPOSTA: aplicar després de les migracions locals existents, en staging.
-- No migra ni elimina objectes; les URL públiques ja difoses no es revoquen ací.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

create or replace function private.es_ruta_mitjans_propia(p_name text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select case
    when cardinality(storage.foldername(p_name)) = 3
      and (storage.foldername(p_name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      and (storage.foldername(p_name))[2] = (select auth.uid())::text
    then private.is_town_member(((storage.foldername(p_name))[1])::uuid)
    else false
  end;
$$;
revoke execute on function private.es_ruta_mitjans_propia(text) from public, anon;
grant execute on function private.es_ruta_mitjans_propia(text) to authenticated;

-- Desapareix la lectura dels adjunts de qualsevol veí del mateix poble.
drop policy if exists "mitjans_privats llegir propis o tenant" on storage.objects;
create policy "mitjans_privats llegir propis o tenant" on storage.objects
for select to authenticated
using (bucket_id = 'mitjans_privats' and private.es_ruta_mitjans_propia(name));

-- Restrictiva: una política permissiva addicional no pot tornar a obrir el bucket.
drop policy if exists "sdp mitjans privats frontera" on storage.objects;
create policy "sdp mitjans privats frontera" on storage.objects
as restrictive for all to authenticated
using (bucket_id <> 'mitjans_privats' or private.es_ruta_mitjans_propia(name))
with check (bucket_id <> 'mitjans_privats' or private.es_ruta_mitjans_propia(name));
drop policy if exists "sdp mitjans privats anon" on storage.objects;
create policy "sdp mitjans privats anon" on storage.objects
as restrictive for all to anon
using (bucket_id <> 'mitjans_privats') with check (bucket_id <> 'mitjans_privats');

-- Manté lectura pública del bucket públic. Admet format nou i objectes antics propis.
create or replace function private.es_ruta_mitjans_publics_propia(p_name text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.es_ruta_mitjans_propia(p_name)
    or (cardinality(storage.foldername(p_name)) = 2
      and (storage.foldername(p_name))[1] = (select auth.uid())::text);
$$;
revoke execute on function private.es_ruta_mitjans_publics_propia(text) from public, anon;
grant execute on function private.es_ruta_mitjans_publics_propia(text) to authenticated;

drop policy if exists "mitjans pujar propis" on storage.objects;
create policy "mitjans pujar propis" on storage.objects for insert to authenticated
with check (bucket_id = 'mitjans' and private.es_ruta_mitjans_publics_propia(name));
drop policy if exists "mitjans actualitzar propis" on storage.objects;
create policy "mitjans actualitzar propis" on storage.objects for update to authenticated
using (bucket_id = 'mitjans' and private.es_ruta_mitjans_publics_propia(name))
with check (bucket_id = 'mitjans' and private.es_ruta_mitjans_publics_propia(name));
drop policy if exists "mitjans esborrar propis" on storage.objects;
create policy "mitjans esborrar propis" on storage.objects for delete to authenticated
using (bucket_id = 'mitjans' and private.es_ruta_mitjans_publics_propia(name));

-- Defesa contra altres polítiques permissives d'escriptura del bucket públic.
drop policy if exists "sdp mitjans insercio frontera" on storage.objects;
create policy "sdp mitjans insercio frontera" on storage.objects as restrictive for insert to authenticated
with check (bucket_id <> 'mitjans' or private.es_ruta_mitjans_publics_propia(name));
drop policy if exists "sdp mitjans canvi frontera" on storage.objects;
create policy "sdp mitjans canvi frontera" on storage.objects as restrictive for update to authenticated
using (bucket_id <> 'mitjans' or private.es_ruta_mitjans_publics_propia(name))
with check (bucket_id <> 'mitjans' or private.es_ruta_mitjans_publics_propia(name));
drop policy if exists "sdp mitjans baixa frontera" on storage.objects;
create policy "sdp mitjans baixa frontera" on storage.objects as restrictive for delete to authenticated
using (bucket_id <> 'mitjans' or private.es_ruta_mitjans_publics_propia(name));

-- app_content és contingut editorial públic; les notes personals viuen a public.notes.
-- La llista és explícita: un key nou requerix decidir-ne la visibilitat.
drop policy if exists "app_content lectura publica" on public.app_content;
create policy "app_content lectura publica" on public.app_content for select to anon, authenticated
using (key in ('towns', 'pages', 'feedPosts', 'marketItems', 'events', 'mediaItems', 'onboarding'));
drop policy if exists "sdp app_content anon frontera" on public.app_content;
create policy "sdp app_content anon frontera" on public.app_content as restrictive for select to anon
using (key in ('towns', 'pages', 'feedPosts', 'marketItems', 'events', 'mediaItems', 'onboarding'));
drop policy if exists "sdp app_content auth frontera" on public.app_content;
create policy "sdp app_content auth frontera" on public.app_content as restrictive for select to authenticated
using (key in ('towns', 'pages', 'feedPosts', 'marketItems', 'events', 'mediaItems', 'onboarding')
  or (select private.es_superadmin()));

-- Reducció de superfície: les notes anònimes ja eren denegades per RLS.
revoke all on table public.notes from anon;
-- L'RPC manté auth.uid(), però no necessita EXECUTE públic.
revoke execute on function public.registra_consentiment(text, text) from public, anon;
grant execute on function public.registra_consentiment(text, text) to authenticated;
-- Tanca l'overload sense paginació, sense eliminar-lo ni perdre dades.
revoke execute on function public.admin_list_users() from public, anon, authenticated;
grant execute on function public.admin_list_users(integer, integer) to authenticated;

-- Detectar buckets absents: no convertir una actualització de zero files en èxit.
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'mitjans_privats') then
    raise exception 'Falta la migració del bucket privat';
  end if;
  if not exists (select 1 from storage.buckets where id = 'mitjans') then
    raise exception 'Falta la migració del bucket públic';
  end if;
end $$;
update storage.buckets set public = false where id = 'mitjans_privats';
commit;
```

### A22 · Adaptació del smoke test

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import PedraSecaEmbed from '../PedraSecaEmbed';

import { CONTRACTE_NUCLI } from '../data/contracte.js';
import { setBackendImplementation } from '../data/backendPort';

describe('App Component', () => {
  it('renders without crashing', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    setBackendImplementation({
      ...Object.fromEntries(CONTRACTE_NUCLI.map(name => [name, vi.fn(() => { throw new Error(`Mètode inesperat al smoke test: ${name}`); })])),
      getCurrentUser: async () => ({ id: '123' }),
      loadCoreContent: async () => {},
      getRuntimeDataMode: () => 'local',
      getBackendConfigurat: () => true,
      getDefaultUserId: () => '123',
      recullTornadaOAuth: async () => {}
    });
    const config = { routerType: 'memory' };
    let container;
    await act(async () => {
      const result = render(<PedraSecaEmbed config={config} />);
      container = result.container;
    });
    expect(container).toBeTruthy();
  });
});
```

### A23 · Bateria de conformitat

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { ROOT, sha, inventari, projeccions, comprovaCataleg, segura } from '../tooling/brain/cataleg_skills.mjs';
import { prepara, resolProtocols, identitatTorn, desaEmissio, verificaEmissio } from '../tooling/brain/context_documental.mjs';
import { CONTRACTE_NUCLI, CAPACITATS } from '../src/data/contracte.js';
import { validatePublicCredentials } from '../src/config/publicCredentials.js';

function fixture(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-consolidacio-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const files = ['.agents/BOOTSTRAP.md', '.agents/AGENTS.md', '.agents/PROFILE.md', '.agents/BASELINE.md',
    '.agents/PROTOCOL_PETORRETA.md', '.agents/consell.json', '.agents/protocolledge.json', '.agents/DESTINS_CANONICS.json'];
  const reg = JSON.parse(fs.readFileSync(path.join(ROOT, '.agents/protocolledge.json')));
  files.push(reg.default, ...reg.rutes.flatMap(r => [r.plantilla, ...r.lectures]));
  files.push(...inventari(ROOT).map(s => s.ruta));
  for (const rel of new Set(files)) {
    const dst = path.join(root, rel); fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(path.join(ROOT, rel), dst);
  }
  for (const [rel, text] of projeccions(inventari(root))) fs.writeFileSync(path.join(root, rel), text);
  return root;
}
function run(root, rel, args = [], input) {
  return spawnSync(process.execPath, [path.join(ROOT, rel), ...args], {
    env: { ...process.env, SDP_ARREL: root }, cwd: root, encoding: 'utf8', input,
  });
}
function transcript(root, task = 'auditoria backend') {
  const name = path.join(root, 'sessions/.system_generated/transcript.jsonl');
  fs.mkdirSync(path.dirname(name), { recursive: true });
  fs.writeFileSync(name, JSON.stringify({ type: 'USER_INPUT', content: task }) + '\n');
  return { transcriptPath: name, invocationNum: 1 };
}
function docCall(payload, root, relative = '_wiki_de_poble/04_escriptori/260920_0300_auditoria_prova.md') {
  return { ...payload, toolCall: { name: 'write_to_file', args: { TargetFile: path.join(root, relative) } } };
}
function verify(root, payload) {
  const p = run(root, '.agents/hooks/verify.mjs', [], JSON.stringify(payload));
  assert.equal(p.status, 0, p.stderr); return JSON.parse(p.stdout);
}

test('catàleg: 16 IDs iguals, dues escriptures idempotents i check sense mutació', t => {
  const root = fixture(t);
  const expected = inventari(root).map(s => s.id);
  assert.equal(expected.length, 16);
  for (let n = 0; n < 2; n++) {
    for (const command of ['tooling/brain/cataleg_skills.mjs', 'tooling/wiki/sincronitzar_skills.mjs',
      'tooling/maquinaria/rebuild_skills_index.mjs', 'tooling/gates/tractor-manifest.mjs']) {
      const before = [...projeccions(inventari(root)).keys()].map(p => sha(fs.readFileSync(path.join(root, p))));
      const result = run(root, command, ['--escriu']); assert.equal(result.status, 0, result.stderr);
      const after = [...projeccions(inventari(root)).keys()].map(p => sha(fs.readFileSync(path.join(root, p))));
      assert.deepEqual(after, before);
      assert.equal(comprovaCataleg(root).ok, true);
    }
  }
  const manifest = fs.readFileSync(path.join(root, '.agents/manifest.yaml'), 'utf8');
  const index = fs.readFileSync(path.join(root, '.agents/skills/00_INDEX_SKILLS.md'), 'utf8');
  assert.deepEqual([...manifest.matchAll(/skills\/(.*?)\/SKILL.md/g)].map(m => m[1]), expected);
  assert.deepEqual([...index.matchAll(/\[\[(.*?)\/SKILL\|/g)].map(m => m[1]), expected);
  assert.equal(fs.existsSync(path.join(root, '_wiki_de_poble/02_saber/skills_mirror')), false);
});
test('catàleg rebutja divergència, setzena skill absent i espill', t => {
  const root = fixture(t), index = path.join(root, '.agents/skills/00_INDEX_SKILLS.md');
  fs.appendFileSync(index, '\n- [[retirada/SKILL|retirada]]: antiga\n');
  assert.equal(comprovaCataleg(root).ok, false);
  const before = fs.readFileSync(index);
  assert.equal(run(root, 'tooling/brain/cataleg_skills.mjs', ['--check']).status, 1);
  assert.deepEqual(fs.readFileSync(index), before);
  fs.mkdirSync(path.join(root, '_wiki_de_poble/01_ser/00_AGENTS_I_SKILLS_MIRROR'), { recursive: true });
  assert.ok(comprovaCataleg(root).problemes.some(p => p.includes('quarantena')));
  fs.renameSync(path.join(root, '.agents/skills/app-grid-shell/SKILL.md'), path.join(root, 'absent.md'));
  assert.throws(() => inventari(root));
});
test('rutes: escape i symlink rebutjats', t => {
  const root = fixture(t);
  assert.throws(() => segura(root, '../escape'));
  fs.symlinkSync(os.tmpdir(), path.join(root, 'alias'));
  assert.throws(() => segura(root, 'alias/file.md'));
});
test('protocols: local, lectures, desconegut, JSON corrupte', t => {
  const root = fixture(t);
  assert.deepEqual(resolProtocols('crear un prompt per a codex', [], root).map(r => r.id), ['prompt.local']);
  assert.throws(() => resolProtocols('xyzzy', [], root));
  const regPath = path.join(root, '.agents/protocolledge.json'), reg = JSON.parse(fs.readFileSync(regPath));
  reg.rutes.find(r => r.id === 'auditoria').lectures = ['.agents/ESTAT.md'];
  fs.writeFileSync(path.join(root, '.agents/ESTAT.md'), '# Estat de prova\n');
  fs.writeFileSync(regPath, JSON.stringify(reg));
  assert.ok(prepara('auditoria backend', [], root).fonts.some(s => s.ruta === '.agents/ESTAT.md'));
  fs.writeFileSync(regPath, '{'); assert.throws(() => prepara('auditoria', [], root));
});
test('arrancada: CLI no deixa rebut; preflight emet tot i verifica el mateix torn', t => {
  const root = fixture(t), payload = transcript(root);
  assert.equal(run(root, 'tooling/brain/matrix.mjs', ['--json', 'auditoria backend']).status, 0);
  assert.equal(fs.existsSync(path.join(root, '.agents/.matrix-rebuts')), false);
  assert.equal(verify(root, docCall(payload, root)).decision, 'deny');
  const p = run(root, '.agents/hooks/preflight_matrix_wrapper.mjs', [], JSON.stringify(payload));
  assert.equal(p.status, 0, p.stderr);
  assert.equal(JSON.parse(p.stdout).injectSteps[0].ephemeralMessage, prepara('auditoria backend', [], root).contingut);
  const allowed = verify(root, docCall(payload, root)); assert.equal(allowed.decision, 'allow', allowed.reason);
  assert.equal(verify(root, docCall({}, root)).decision, 'deny');
  assert.equal(verify(root, docCall(payload, root, '../fora.md')).decision, 'deny');
  assert.equal(verify(root, docCall(payload, root, '.agents/manifest.yaml')).decision, 'deny');
  assert.equal(verify(root, { ...payload, toolCall: { name: 'run_command', args: { command: 'node tooling/brain/crear_document.mjs' } } }).decision, 'ask');
});
test('rebut: fonts alterades, tasca distinta, data invàlida/futura/caducada', t => {
  const root = fixture(t), payload = transcript(root), identity = identitatTorn(payload);
  const context = prepara(identity.task, [], root), now = Date.now();
  const rec = desaEmissio(context, identity, [], root, now);
  const file = path.join(root, `.agents/.matrix-rebuts/${identity.torn}.json`);
  for (const date of ['invàlida', new Date(now+10000).toISOString(), new Date(now-31*60000).toISOString()]) {
    fs.writeFileSync(file, JSON.stringify({ ...rec, t: date }));
    assert.throws(() => verificaEmissio(payload, root, now));
  }
  fs.writeFileSync(file, JSON.stringify(rec)); assert.equal(verificaEmissio(payload, root, now).torn, identity.torn);
  const skill = path.join(root, '.agents/skills/skill-iaia-identitat/SKILL.md');
  fs.appendFileSync(skill, '\nCanvi posterior\n'); assert.throws(() => verificaEmissio(payload, root, now));
  fs.appendFileSync(payload.transcriptPath, JSON.stringify({ type: 'USER_INPUT', content: 'segona auditoria' })+'\n');
  assert.throws(() => verificaEmissio(payload, root, now));
});
test('un preflight fallit invalida el rebut anterior i no trunca el context', t => {
  const root = fixture(t), payload = transcript(root);
  const good = run(root, '.agents/hooks/preflight_matrix_wrapper.mjs', [], JSON.stringify(payload)); assert.equal(good.status, 0, good.stderr);
  const bad = run(root, '.agents/hooks/preflight_matrix_wrapper.mjs', [], JSON.stringify({ ...payload, matrixProtocols: ['absent'] }));
  assert.equal(bad.status, 1); assert.equal(bad.stdout, '');
  assert.equal(verify(root, docCall(payload, root)).decision, 'deny');
});
test('backend: reemplaçament íntegre, override, atomicitat, getters, lock i capacitats', async () => {
  const url = pathToFileURL(path.join(ROOT, 'src/data/backendPort.js')); url.search = '?test=' + Date.now();
  const p = await import(url.href);
  const full = () => Object.fromEntries(CONTRACTE_NUCLI.map(name => [name, () => name]));
  class Parent { getCurrentUser() { return 'pare'; } }
  class Child extends Parent { getCurrentUser() { return this.label; } }
  const child = Object.assign(new Child(), full(), { label: 'fill' }); delete child.getCurrentUser;
  p.setBackendImplementation(child); assert.equal(p.getCurrentUser(), 'fill');
  assert.ok(Object.isFrozen(p.getBackendImplementation()));
  assert.throws(() => p.setBackendImplementation({ getCurrentUser() {} })); assert.equal(p.getCurrentUser(), 'fill');
  const admin = { ...full(), ...Object.fromEntries(CAPACITATS.admin.map(name => [name, () => []])) };
  p.setBackendImplementation(admin); assert.equal(p.teCapacitat('admin'), true);
  p.setBackendImplementation(full()); assert.equal(p.teCapacitat('admin'), false);
  assert.throws(() => p.setBackendImplementation({ ...full(), adminListUsers() {} }));
  let read = false; const getter = full(); Object.defineProperty(getter, 'getCurrentUser', { get() { read = true; return () => {}; } });
  assert.throws(() => p.setBackendImplementation(getter)); assert.equal(read, false);
  p.freezeImplementation(); assert.throws(() => p.setBackendImplementation(full()));
  assert.equal(p.teCapacitat('__proto__'), false);
});
test('credencials: claus privades/malformades i URLs insegures rebutjades', () => {
  const jwt = role => 'eyJhbGciOiJIUzI1NiJ9.' + Buffer.from(JSON.stringify({role})).toString('base64url') + '.c2ln';
  validatePublicCredentials('https://example.invalid', jwt('anon'));
  validatePublicCredentials('http://127.0.0.1:54321', 'sb_publishable_test');
  for (const key of ['sb_secret_test', jwt('service_role'), jwt('authenticated'), 'abc', 'a.b.c'])
    assert.throws(() => validatePublicCredentials('https://example.invalid', key));
  for (const url of ['ftp://localhost', 'http://remote.invalid', 'https://user:pass@example.invalid', 'https://example.invalid/path'])
    assert.throws(() => validatePublicCredentials(url, jwt('anon')));
});

async function isolated(rel, deps) {
  globalThis.__SDP_TEST_DEPS = deps;
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/^import .*;\r?\n/gm, '');
  return import('data:text/javascript;base64,' + Buffer.from(`const {${Object.keys(deps).join(',')}} = globalThis.__SDP_TEST_DEPS;\n${src}\n// ${Math.random()}`).toString('base64'));
}
test('transport: rebutja secrets abans de fetch i no seguix redireccions', async t => {
  const oldFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = oldFetch; delete globalThis.__SDP_TEST_DEPS; });
  let calls = 0, received;
  globalThis.fetch = async (url, options) => { calls++; received = options; return {ok:true, status:200, json:async()=>[]}; };
  const runtime = await isolated('src/data/supabase/runtime.js', {
    validatePublicCredentials, APP_SEED: {}, APP_SEED_VERSION: 1, getDefaultUserId: () => 'user',
    getEfimer: () => null, CLAU_JWT: 'jwt', usuariDeSessio: () => null, permetOrigenMitjans: () => {},
  });
  await assert.rejects(runtime.request('/rest/v1/notes', {supabaseUrl:'https://example.invalid',supabaseAnonKey:'sb_secret_test'}));
  assert.equal(calls, 0);
  await runtime.request('/rest/v1/towns', {supabaseUrl:'https://example.invalid/',supabaseAnonKey:'sb_publishable_test'});
  assert.equal(received.redirect, 'error'); assert.equal(calls, 1);
});
test('singleton: config fixada, clau diferent rebutjada i token renovat', async t => {
  t.after(() => { delete globalThis.__SDP_TEST_DEPS; });
  let jwt = null, creates = 0, removed = 0;
  const config = {supabaseUrl:'https://example.invalid',supabaseAnonKey:'sb_publishable_test'};
  const client = await isolated('src/data/supabase/config.js', {
    createClient: () => { creates++; return { removeAllChannels: async () => { removed++; }, realtime: {setAuth: async () => {}} }; },
    getResolvedConfig: c => ({...c, hasSupabaseConfig: !!(c.supabaseUrl && c.supabaseAnonKey)}),
    getEfimer: () => jwt, CLAU_JWT: 'jwt',
  });
  const first = await client.getClient(config); assert.equal(await client.getClient(), first);
  await assert.rejects(client.getClient({...config,supabaseAnonKey:'sb_publishable_other'}));
  assert.equal(creates, 1); jwt = 'new-token';
  assert.notEqual(await client.getClient(), first); assert.equal(creates, 2); assert.ok(removed);
});
test('storage: poble explícit, carpetes validades i prefix coherent amb RLS', async t => {
  t.after(() => { delete globalThis.__SDP_TEST_DEPS; });
  const uid = '11111111-1111-1111-1111-111111111111', tenant = '22222222-2222-2222-2222-222222222222';
  let sent;
  const storage = await isolated('src/data/supabase/storage.js', {
    getResolvedConfig: c => c, usuariDeSessio: () => ({id:uid}), handleError: e => e,
    getClient: async () => ({storage:{from:bucket=>({upload:async (name, data, options)=>{sent={bucket,name,options};return {error:null};}})}}),
  });
  const blob = new Blob(['x'], {type:'image/png'});
  await assert.rejects(storage.uploadToStorage(blob, {carpeta:'notes'}));
  await assert.rejects(storage.uploadToStorage(blob, {carpeta:'../notes',tenantId:tenant}));
  const result = await storage.uploadToStorage(blob, {carpeta:'notes'}, {tenantId:tenant});
  assert.equal(sent.bucket, 'mitjans_privats'); assert.ok(sent.name.startsWith(`${tenant}/${uid}/notes/`));
  assert.equal(sent.options.upsert, false); assert.ok(result.url.startsWith('sdp-media://mitjans_privats/'));
});
test('dos cicles d’arrancada i tancament no recreen espills; SCC aïllat', t => {
  const root = fixture(t), payload = transcript(root);
  // Aïlla la resta d’auditories: esta prova és del cablejat del tancament.
  for (const rel of ['tooling/gates/tancament.mjs', 'tooling/brain/cataleg_skills.mjs',
    'tooling/wiki/lib/frontmatter.mjs', 'tooling/lib/arrel.mjs']) {
    const dst = path.join(root, rel); fs.mkdirSync(path.dirname(dst), {recursive:true}); fs.copyFileSync(path.join(ROOT,rel),dst);
  }
  fs.writeFileSync(path.join(root,'tooling/gates/verificador-scc.mjs'), 'export class VerificadorSCC { async runAudits() { return {valid:true,errors:[]}; } }');
  for (let n=0;n<2;n++) {
    assert.equal(run(root, '.agents/hooks/preflight_matrix_wrapper.mjs', [], JSON.stringify(payload)).status, 0);
    const close = spawnSync(process.execPath,[path.join(root,'tooling/gates/tancament.mjs'),'--json'], {cwd:root,env:{...process.env,SDP_ARREL:root},encoding:'utf8'});
    assert.equal(close.status,0,close.stderr);assert.equal(JSON.parse(close.stdout).valid,true);
    assert.equal(comprovaCataleg(root).ok,true);
    assert.equal(fs.existsSync(path.join(root,'_wiki_de_poble/01_ser/00_AGENTS_I_SKILLS_MIRROR')),false);
    assert.equal(fs.existsSync(path.join(root,'_wiki_de_poble/02_saber/skills_mirror')),false);
  }
});
test('quarantena: conserva contingut, és idempotent i rebutja symlinks', t => {
  const root = fixture(t), rel = '_wiki_de_poble/01_ser/00_AGENTS_I_SKILLS_MIRROR';
  const src = path.join(root, rel); fs.mkdirSync(src, {recursive:true});fs.writeFileSync(path.join(src,'manual.md'),'contingut humà');
  assert.equal(run(root,'tooling/brain/quarantena_espills.mjs').status,0);assert.ok(fs.existsSync(src));
  assert.equal(run(root,'tooling/brain/quarantena_espills.mjs',['--aplica']).status,0);
  assert.equal(fs.existsSync(src),false);
  assert.equal(fs.readFileSync(path.join(root,`.brain-trash/260920_consolidacio/${rel}/manual.md`),'utf8'),'contingut humà');
  assert.equal(run(root,'tooling/brain/quarantena_espills.mjs',['--aplica']).status,0);
  fs.symlinkSync(path.join(root,'.agents'),src);
  assert.notEqual(run(root,'tooling/brain/quarantena_espills.mjs',['--aplica']).status,0);
  assert.ok(fs.existsSync(path.join(root,'.agents/AGENTS.md')));
});
```

### A24 · Manifest generat

```yaml
# GENERAT per tooling/brain/cataleg_skills.mjs; no editar a mà.
schema: socdepoble.manifest.v1
identity: PROFILE.md
bios: AGENTS.md
baseline: BASELINE.md
index_skills: skills/00_INDEX_SKILLS.md
consell: consell.json
skills:
  - skills/app-grid-shell/SKILL.md
  - skills/core-context-panic/SKILL.md
  - skills/core-restauracio-segellada/SKILL.md
  - skills/pedra-seca/SKILL.md
  - skills/skill-busca-skills/SKILL.md
  - skills/skill-casos-us-essencials/SKILL.md
  - skills/skill-cicle-de-vida/SKILL.md
  - skills/skill-consell-i-colmena/SKILL.md
  - skills/skill-documentacio-i-reflex/SKILL.md
  - skills/skill-estudi-mercat/SKILL.md
  - skills/skill-guardia-frontmatter/SKILL.md
  - skills/skill-iaia-identitat/SKILL.md
  - skills/skill-memoria-historica/SKILL.md
  - skills/skill-propagar-veritat/SKILL.md
  - skills/socdepoble-workflow/SKILL.md
  - skills/universal-page/SKILL.md
```

### A25 · Índex generat

```markdown
---
type: index
status: generat
description: Catàleg determinista de les setze skills actives, generat des de les fonts canòniques.
tags:
  - skills
  - core
---

# Catàleg de skills

Font executiva única: `.agents/skills/`. Este índex només referencia les fonts.

- [[app-grid-shell/SKILL|app-grid-shell]]: Lògica visual i de comportament del AppGridShell i UniversalWorkspace. Comportament de les barres, icones i redimensionament.
- [[core-context-panic/SKILL|core-context-panic]]: Fusible mental de la IAIA MarIA per aturar l'execució quan hi ha desincronització de context (People-Pleasing o Al·lucinació per fatiga). S'activa davant errors cíclics, incapacitat per complir l'objectiu directe de l'usuari o context esgotat.
- [[core-restauracio-segellada/SKILL|core-restauracio-segellada]]: Core skill per a restauració segura
- [[pedra-seca/SKILL|pedra-seca]]: Reglament matemàtic visual Pedra Seca (Alta Definició)
- [[skill-busca-skills/SKILL|skill-busca-skills]]: Caçador de Skills i coneixement. Cerca, analitza i adapta metodologies i automatitzacions d'altres repositoris d'avantguarda al sistema de Sóc de Poble.
- [[skill-casos-us-essencials/SKILL|skill-casos-us-essencials]]: Registre d'idees de producte i casos d'ús vitals per a la xarxa social i el mur de Sóc de Poble. Aquestes idees s'han de consultar a l'hora de desenvolupar la xarxa per assegurar-se que els models de dades i les \"cards\" les puguen suportar.
- [[skill-cicle-de-vida/SKILL|skill-cicle-de-vida]]: Flux de treball per a Soc de Poble i Protocol d'higiene cognitiva per evitar l'esgotament del context.
- [[skill-consell-i-colmena/SKILL|skill-consell-i-colmena]]: Defineix la família electrònica (El Consell), els seus rols i estratègies de delegació i consum en la Ment Colmena Integral.
- [[skill-documentacio-i-reflex/SKILL|skill-documentacio-i-reflex]]: L'Efecte Matrix i la mecànica per a generar Prompts, Bundles, Actes i qualsevol document estratègic de la Wiki sense desincronitzar-se.
- [[skill-estudi-mercat/SKILL|skill-estudi-mercat]]: Protocol per a la realització d'estudis de mercat i anàlisi de la competència, enfocat a extreure conclusions arquitectòniques i estratègiques.
- [[skill-guardia-frontmatter/SKILL|skill-guardia-frontmatter]]: Guàrdia immunitari cognitiu que força el compliment estricte de l'esquema de metadades ISO v2.1 per davant de qualsevol instrucció local.
- [[skill-iaia-identitat/SKILL|skill-iaia-identitat]]: Bootstrap d'identitat executiu de la IAIA MarIA. Carrega personalitat, veu, to i missió.
- [[skill-memoria-historica/SKILL|skill-memoria-historica]]: Protocol de Memòria Històrica i destil·lació del saber de Sóc de Poble. Prevé la repetició cíclica d'errors, recull les lliçons fundacionals (Pedra Seca, Editor Universal, Graella) i regula l'arxivament segur cap a _arxiu_wiki_de_poble.
- [[skill-propagar-veritat/SKILL|skill-propagar-veritat]]: Propaga un canvi de decisió estructural o arquitectònica arreu de tota la Wiki per mantenir la coherència del sistema.
- [[socdepoble-workflow/SKILL|socdepoble-workflow]]: Workflow principal de treball i Spec-Driven Development
- [[universal-page/SKILL|universal-page]]: Estàndard d'arquitectura, anatomia i configuració de la UniversalPage de Sóc de Poble. Defineix l'estructura visual, el comportament del scroll i els blocs que la formen.
```

## 10. Bateria de veritat i límit de conclusió

- [x] Lectura i exploració del codi local real; diagnòstic diferenciat de la proposta.
- [x] Cites a rutes i línies originals, amb hashes per als fitxers que es proposa substituir.
- [x] Noms existents verificats; noms nous marcats com a proposta.
- [x] Supòsits de host, servidor i migracions identificats explícitament.
- [x] Cap consulta externa, cap lectura de secrets i cap aplicació a codi operatiu.
- [x] Codi de proposta amb 14 proves passades en còpia temporal.
- [ ] Certificació de Sollutia i RLS desplegada: pendent de staging i contracte del soci.
- [ ] Homologació dels hooks al host real: pendent de comprovar payload i entrega.

La missió d’esta sessió es lliura com a **auditoria i codi revisable**. Les fases no es declaren implantades en el projecte, perquè l’encàrrec reserva expressament l’aplicació a la sessió posterior d’IAIA MarIA.

Ancoratge de seguretat: [[00_index_escriptori]]. La vinculació entrant des de l’índex queda per a la sessió d’implantació per respectar l’escriptura exclusiva de l’informe.

## 11. Comprovació final de l’informe

Verificació efectuada el 2026-09-20T03:00:17+02:00.

- [x] `tractor-frontmatter.mjs --estricte` sobre una còpia aïllada d’este informe, amb l’esquema, pany i abast originals: **codi 0, 1 document, 0 exempcions i F1–F8=0**.
- [x] Comprovació global posterior: **codi 1, 227 documents**; el corpus ha canviat per activitat concurrent aliena a esta auditoria; **0 diagnòstics atribuïts a este informe**.
- [x] Els 25 blocs de codi de l’annex coincidixen exactament amb els fitxers de la proposta provada.
- [x] Les 259 fonts amb hash de línia base continuen sense canvis. L’única escriptura d’esta auditoria al projecte és este informe; el control de 259 hashes no cobrix documents nous creats per altres processos.

El codi 0 del control aïllat no es presenta com un codi 0 de la Wiki global. Al tall final de 227 documents els errors globals són F1=17, F2=89, F3=23, F4=15, F5=1, F6=0, F7=14 i F8=0. El recompte anterior de 223 documents es conserva com a línia base, no com a estat final.
