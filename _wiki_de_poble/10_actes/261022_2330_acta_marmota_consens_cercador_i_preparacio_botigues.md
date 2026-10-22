---
type: acta
status: esborrany
description: 'Acta Marmota de tancament nocturn: Cercador Universal validat per Claude i Gemini, poliment de càrrega i mur, diagnosi de tenant D1-A i full de ruta per a botigues'
tags:
  - acta
visibility: private
reflex: sdp:torn_528e27ee-1e76-438d-899e-0abfcd996b0b:2cfc5c6d-8a9f-4425-b589-7ccf8b84c377
---
# Acta Marmota: Consens del Cercador Universal, Poliment de Textos i Preparació de Botigues

> **Nota per a la IAIA:** Aquesta plantilla fon l'acta tècnica, el registre d'estat mental i el punt de control per al següent torn (Marmota). Ha de ser un document ric, detallat i exhaustiu. No escatimes en tokens ací, l'historial és la nostra única memòria a llarg termini. Descriu en profunditat què s'ha tocat, per què, i quins conflictes s'han superat.

<!-- SDP:SECTION acta.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_528e27ee-1e76-438d-899e-0abfcd996b0b:2cfc5c6d-8a9f-4425-b589-7ccf8b84c377 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-22T21:28:31.983Z |
| Modificació | 2026-10-22T21:28:31.983Z |
| Propietari | IAIA MarIA (Directora Tècnica) |
| Aprovació humana | Mestre Javi Llinares |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/acta.md (v2.0.0) |
| Model IA | Antigravity (IAIA MarIA) + Claude Opus 5.5 + Gemini 4 Argon |
| Tokens consumits | ~ |

<!-- SDP:SECTION acta.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/acta.md; SHA-256 d0a64c35b75833b88ea561903829fb02558db7be214a9ee5844045cafc1333a1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION acta.s3 -->
## Historial

- **2026-10-22T20:08Z (22:08h):** Desbloqueig de la vista `organization_directory` a Supabase amb suport de `town_name` pel Mestre. Obertura de convocatòria per a Claude Opus 5.5 i Gemini 4 Argon per al Cercador Universal (`261022_1955`).
- **2026-10-22T20:20Z - 21:10Z (22:20h - 23:10h):** 
  - Claude Opus implementa T1–T3 (`listPublicOrganizations` a `contracte.js`, `backendPort.js`, `organizations.js`, `localPerfils.js`, `deOrganitzacio`, plegat valencià ampliat amb `ŀ`/`l·l`, rànquing multicriteri IDF, silenciament del 403 del padró i suport d'avatars de cubell públic).
  - Claude executa el Gauntlet adversarial amb 4 crítics i 7 refutadors (21.043 proves en verd) i emet el seu informe a `261022_2220_auditoria_claude.md`.
  - Claude emet el **Relleu 4** frenant l'script SQL de Gemini per 3 fallades crítiques (taula `tenant_memberships` inexistent, forat de seguretat a `profiles.town_name` i fragmentació d'11 taules amb `tenant_id`).
- **2026-10-22T21:05Z (23:05h):** El Mestre torna després d'una visita familiar i detecta la saturació del motiu «del poble» a la UI. Ordre directa: concisió quirúrgica. La IAIA MarIA canvia la roda de càrrega a «Carregant contingut...» i el subtítol del Mur a «Explora el mur públic a través de les diferents vistes: llista, calendari i mapa» als 5 idiomes (`ca`, `es`, `en`, `eu`, `gl`). 227 proves de robustesa en verd.
- **2026-10-22T21:20Z (23:20h):** Gemini 4 Argon llig les objeccions de Claude, accepta al 100% el veredicte i contra-audita l'Opció B de Claude, descobrint 4 mines letals (trigger SDP-SEC-001, deadlock de 5 FKs, i rutes d'Storage físic a Supabase sota `11111111-...`). Consens absolut de la Colmena: l'Opció D1-A és la via canònica i segura.
- **2026-10-22T21:25Z (23:25h):** Decisió sàvia del Mestre Javi Llinares: desaccelerar, sopar a la vora de la màquina, no tocar SQL a les fosques i recuperar la llum del dia per abordar les botigues amb el cap fresc. Claude i Gemini tanquen sessions ordenadament.

<!-- SDP:SECTION acta.s4 -->
## Resultats

### 1. Cercador Universal (`/cerca`) Completat i Blindat (Claude Opus + Gemini 4)
- **Entitats Públiques Visibles:** Integrada la capacitat opcional `directoriEntitats: ['listPublicOrganizations']` amb límit de 500 registres. La cerca anònima o autenticada troba entitats de qualsevol poble («La Figuera», «El Rentonar», «Sóc de Poble») amb el seu logo resolt pel port (`sdp-media://`).
- **Padró de Veïns Resilient:** L'error 403 Forbidden («Mode Foraster», codis `SDP-XAT-001/003`) es degrada silenciosament a font buida sense alertes roges destructives per a usuaris forasters o convidats.
- **Normalització Valenciana:** Plegat ampliat (`à/á è/é í/ï ò/ó ú/ü ç`, `l·l`, `ŀ`/`Ŀ`, «col.legi», lligadures, caràcters d'amplada completa i lletres astrals) amb ressaltat idèntic en React sense `innerHTML`.
- **Rànquing Multicriteri:** Puntuació per graons (frase exacta > prefix de títol > títol complet > lema/ofici > cos) amb pes IDF i desempat pel poble actiu.

### 2. Poliment Visual de Trellat (IAIA MarIA)
- **Roda de Càrrega:** Substituït «Carregant contingut del poble...» per **«Carregant contingut...»** a `MurSection.jsx`, `ItemDetailSection.jsx` i `CalendariSection.jsx`, harmonitzat als 5 idiomes (`ca`, `es`, `en`, `eu`, `gl`).
- **Subtítol del Mur:** Substituït «Llig el mur públic amb les darreres publicacions del poble.» per **«Explora el mur públic a través de les diferents vistes: llista, calendari i mapa.»** (eliminada la redundància amb "Publicacions recents" i la saturació del motiu poble).
- **Verificació de Robustesa:** 227 proves de Vitest aprovades al 100%.

### 3. Consens Arquitectònic de Supabase (La Gran Taula Redona Claude-Gemini)
- Descartada l'Opció D1-B (moure massivament les 11 taules amb `tenant_id`): hauria xocat contra el trigger d'immutabilitat `SDP-SEC-001`, hauria provocat deadlocks en 5 claus foranes sense cascada i hauria trencat les rutes d'Storage físic a `storage.objects` (`sdp-media://mitjans/11111111-...`).
- **Consens Canònic (Opció D1-A):** El tenant històric `11111111-2222-3333-4444-555555555555` és la seu mare de les dades. Demà es reanomenarà eixa fila a «La Torre de les Maçanes» a la taula `towns` i s'alinearà `VITE_TENANT_ID=11111111-2222-3333-4444-555555555555`. Zero risc de claus foranes i màxima estabilitat.

### 4. Telemetria i Estat de Guàrdia
- **Quota de Claude:** 86% de crèdit setmanal disponible (només un 14% consumit).
- **Guarda Nocturna:** 0 crons actius, 0 processos en segon pla. Totes les IAs aturades i llestes per al tancament.

<!-- SDP:SECTION acta.s5 -->
## Pendents

1. **Unificació D1-A a Supabase (Demà de matí, amb calma):**
   - Executar al SQL Editor les consultes de diagnosi de només lectura (§4 de l'auditoria de Claude).
   - Aplicar el reanomenament de la fila `11111111-...` a «La Torre de les Maçanes» a `public.towns` i restablir `VITE_TENANT_ID` a `.env.local` i `.env.production.local`.
2. **Desplegament a Firebase Hosting (`socdepoble.org`):**
   - Compilar `npm run build:web` i fer deploy perquè el servidor serva les noves imatges WebP (resolent el 404 del cartell de l'Aplec a producció).
3. **Fase de Botigues (Gran Objectiu de la Jornada Següent):**
   - **WordPress.org:** Paquet ZIP v1.1.9 del connector (`wordpress_directori_v1.1.9.zip`, <10 MB) revisat sota doctrina Fernando Tellado.
   - **Apple App Store:** Projecte Capacitor 8 per a iOS (compilació, pujada via Transporter/Xcode, fitxa App Store Connect i 2FA del Mestre).
   - **Google Play:** APK (`socdepoble-beta.apk`) i configuració de fitxa a Google Play Console.
4. **Banc d'Idees i Llibre Mestre:**
   - Incorporar les idees que sorgeixin durant el sopar i la desacceleració del Mestre al Llibre Mestre d'Idees (`03_llibre_mestre_tasques_i_idees.md`).

<!-- SDP:SECTION acta.s6 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261022_1955_pla_implementacio_cercador_universal]]
- [[261022_2210_auditoria_gemini]]
- [[261022_2220_auditoria_claude]]
- [[261022_2215_acta_marmota_cercador_universal_desbloqueig_supabase_i_relleu]]
- [[03_llibre_mestre_tasques_i_idees]]
