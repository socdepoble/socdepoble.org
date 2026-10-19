---
type: acta
status: canonic
description: Acta Marmota de migdia, relleu de la marató de seguretat, tancament de ReDoS, empaquetat WordPress v1.1.7 i full de ruta per a la vesprada
tags:
  - acta
  - seguretat
  - gauntlet
  - wordpress
  - relleu
  - marmota
visibility: private
---
# Acta Marmota: Relleu de Migdia · Seguretat Gauntlet, Tancament de ReDoS i Release WP v1.1.7

> **Nota per a la IAIA:** Aquesta acta segella la intensa jornada nocturna i matinal del 19 d'octubre de 2026. L'ordinador s'apaga pel descans tèrmic del migdia amb tot l'arbre de treball validat, 19.658 proves en verd, el connector de WordPress compilat i les directrius fermes per a la represa.

<!-- SDP:SECTION acta.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:acta_261019_1345_relleu_migdia_seguretat_i_wp |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-19T13:45:00+02:00 |
| Modificació | 2026-10-19T13:45:00+02:00 |
| Propietari | IAIA MarIA (Antigravity) |
| Aprovació humana | Mestre Javi Llinares |
| Model IA | Antigravity (IAIA MarIA) + Claude Code + GPT Codex + Gemini 4 Argon |
| Estat del sistema | 100% verd · 19.658 proves passades (1.148 fitxers) · ESLint 0 errors / 0 avisos |

<!-- SDP:SECTION acta.s2 -->
## Acte reflex

Procediment de tancament i relleu executat d'acord amb el BIOS (`AGENTS.md` §4 i §13.1), la Llei del Consell (§6) i les directrius de la Porta Olivera (`porta-olivera.mjs` en 0).

<!-- SDP:SECTION acta.s3 -->
## Historial de la Jornada (La Festa Nocturna de les Iaies)

- **2026-10-18T23:30 a 2026-10-19T06:00:** Sessió d'escaneig exhaustiu de seguretat amb `claude-security` en mode `high` (257 fitxers auditats per 81 investigadors sintètics).
- **2026-10-19T10:00 a 12:30:** Gauntlet Loop d'auditories creuades:
  - **Codex** emet l'informe `261019_1236_auditoria_codex_gauntlet_seguretat_i_rols.md` ratificant 4 pegats i advertint sobre F01 (SQL a producció sense preflight) i F10.
  - **Gemini** emet l'auditoria `261019_1240_auditoria_contrast_gauntlet_seguretat_i_superadmin_gemini.md` qualificant d'impecables els 6 pegats de client, proposant l'algorisme de tall per al ReDoS i validant `GrupOpcions` per a la superadministració.
- **2026-10-19T12:30 a 13:20:** Resolució definitiva del ReDoS de `/cerca` (R1_R2_R4 i R3) per part de la sessió de Claude amb tall monotònic en $\mathcal{O}(n)$, 20 proves noves i comprovació en milions de casos. Sessió arxivada amb èxit.
- **2026-10-19T13:20 a 13:40:** Aplicació dels 8 pegats a l'arbre viu, passada de la suite completa de Vitest (19.658 proves verdes) i comprovació de lint (0 errors).
- **2026-10-19T13:44:** Compilació i empaquetat canònic de la release **v1.1.7** de l'enxufe de WordPress (`empaqueta.mjs` amb signatura Ed25519).

<!-- SDP:SECTION acta.s4 -->
## Resultats i Balanç Tècnic

### 1. Seguretat i Codi de Client (8 Pegats Aplicats)

1. **F03, F07 i F09 (`mapejadorSeccions.js`):** Sanejament centralitzat de `payload.tipus` i payloads malmesos que podien causar errors de renderitzat o injecció en components de secció.
2. **F04 i F12 (`detailHelpers.jsx` i `detailRichText.jsx`):** Eliminació de patrons de regressió exponencial i conversió de regex a temps lineal $\mathcal{O}(n)$.
3. **F05 (`storage.js`):** Protecció d'arrels de fitxers contra intents de *path traversal* (`../`) en la càrrega de recursos a Supabase Storage.
4. **F06 (`PerfilPublicSection.jsx`):** Aïllament segur del slug del projecte institucional de `socdepoble` per evitar col·lisions d'espais entre pobles.
5. **F11 (`origenImatges.js`):** Blindatge de l'autoria de les il·lustracions de la IAIA MarIA per evitar suplantacions en la procedència dels actius visuals.
6. **F14 (`detailSectionMeta.jsx`, `indexCerca.js`, `NotesEditor.jsx`):** Autoritat garantida del camp `author_name` proveït pel servidor, evitant que el client invente o falsifique noms d'autoria.
7. **R1, R2 i R4 (`indexCerca.js`, `connexions.js`):** Blindatge contra ReDoS mitjançant truncament segur a la cerca de pobles i eliminació d'imatges Markdown en temps lineal.
8. **R3 (`DetallMultimedia.jsx`):** Protecció d'URLs malicioses o continguts textuals anòmals en el selector multimèdia.

### 2. Estat del Connector de WordPress (Enxufe v1.1.7)

Seguint la skill canònica `core-empaquetat-wp`, s'ha compilat i signat la nova versió a `wordpress-plugin/builds/`:
- **Paquet WordPress:** `wordpress-plugin/builds/261019_1344_wordpress_enxufe_v1.1.7.zip`
- **Paquet Estàtic SPA:** `wordpress-plugin/builds/261019_1344_estatic_spa_v1.1.7.zip`
- **Variant Directori:** `wordpress-plugin/builds/261019_1344_wordpress_directori_v1.1.7.zip`
- **Canal de distribució:** `stable.json` (signat amb `stable.json.sig`) i `1.1.7.json` (signat amb `1.1.7.json.sig`).

#### Diagnosi sobre el Pes del Bundle (Estructura vs Contingut)
En resposta a la reflexió del Mestre sobre la lleugeresa del paquet:
- **L'estructura de codi (JS/CSS) està perfectament trossejada i optimitzada:** El chunk principal ocupa només 1.3 MB (`soc-de-poble-BymuQqZo.js`), amb un carregador de només 3.4 kB i components carregats sota demanda.
- **El volum pesant (~135 MB) prové exclusivament del contingut estàtic:** La configuració vigent de Vite copia tot el directori `public/assets/uploads/`, on resideixen fotos històriques d'alta resolució de La Torre de les Maçanes (com `DSC00410.JPG` de 6.8 MB) i dibuixos en alta definició.
- **Acció futura recomanada:** Perquè el ZIP pese menys de 10 MB (límit del directori oficial de WordPress.org), cal separar físicament els actius multimèdia de `public/` perquè se servisquen directament des de Supabase Storage o CDN, sense viatjar dins de l'arxiu ZIP del connector.

### 3. Estat de la Base de Dades (Supabase)

- **F01 (SQL de permisos d'email a organitzacions):** Es manté a `pegats/` pendent de ser provat en staging abans d'executar-lo a producció, atés l'avís de Codex que `grant select (contact_email, public_email)` a usuaris anònims suposa una exposició innecessària.
- **F10 (Flux d'adopció de compte):** Pendent d'implementar amb confirmació segura d'identitat.

<!-- SDP:SECTION acta.s5 -->
## Relleu per a la Represa (Vesprada del 19-10-2026)

Quan el Mestre encenga l'ordinador després de dinar, la Colmena reprendrà les tasques en el següent ordre d'execució:

1. **Auditoria Visual a `gentdelatorre.net`:**
   - Pujar `wordpress-plugin/builds/261019_1344_wordpress_enxufe_v1.1.7.zip` al WordPress de proves.
   - Verificar la càrrega del Web Component, el renderitzat de targetes de perfil i el selector de multimèdia.
2. **Implementació del Panell de Superadministració i Commutador de 3 Rols:**
   - Ubicació acordada: Dins de «El compte» / `DetallAjust.jsx`.
   - Component UI: `GrupOpcions.jsx` amb aspecte de targetes accessibles.
   - Opcions:
     1. **Veí / Veïna normal:** Vista estàndard d'usuari de poble.
     2. **Editor de Poble:** Gestió de continguts i comerços locals.
     3. **Superadministrador (Sóc de Poble):** Control de nodes, tenants i paràmetres globals.
   - Govern: Separar `rolReal` (verificat per sessió/servidor) de `rolSimulat` (degradació temporal en memòria per provar la interfície des dels ulls d'un veí).
3. **Arrencada de Capacitor (Botigues Mòbils):**
   - Configurar `vite.natiu.config.js`.
   - Compilar a `dist-natiu`.
   - Executar `npx cap add ios` i `npx cap add android` per preparar els binaris d'Apple TestFlight i Google Play Console segons les fitxes redactades a `FITXES_BOTIGUES.txt`.

---
*Acta registrada amb honor per la IAIA MarIA. Bon profit i bon descans tèrmic, Mestre Javi!*
