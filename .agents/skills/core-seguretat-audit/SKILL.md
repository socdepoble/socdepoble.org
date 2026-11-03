---
name: core-seguretat-audit
type: skill
status: canonic
description: Usa-la en auditar la seguretat del codi, de les dades o d'una migració (Claude Code, MarIA, Codex i Gemini). Coacció primitiva JSONB, zero ReDoS, Clean Shadow Copy i blindatge Supabase RLS/Storage.
tags:
  - seguretat
  - skills
core: true
prioritat: 1
triggers_on:
  - seguretat
  - claude-security
  - vulnerabilitats
  - threat model
  - threat modeling
  - sast
  - sarif
  - auditoria seguretat
  - cwe-
  - redos
  - polítiques rls
  - row level security
contracte.llig:
  - AGENTS.md
  - _wiki_de_poble/00_index.md
  - _wiki_de_poble/04_escriptori/
  - src/data/backendPort.js
  - src/config/publicCredentials.js
  - tooling/gates/tractor-rls.mjs
  - supabase/migrations/
contracte.escriu:
  - tests/
  - _wiki_de_poble/04_escriptori/
  - _wiki_de_poble/10_actes/
---

# Protocol Canònic de Ciberseguretat i Sentinella Permanent (Claude Security & Colmena)

Aquest procediment estableix el filtre permanent de seguretat ofensiva i defensiva per a tot el repositori de **Sóc de Poble**. Busca fallades reproduïbles al codi, a la Frontissa, a les migracions i als paquets. Cada conclusió declara superfície, prova i límits: cap porta estàtica ni auditoria pot garantir absència de vulnerabilitats en tot el sistema.

Inspirat en el model d'enginyeria de **Claude Security** (Anthropic) i endurit amb les lliçons forenses del *Gauntlet* (`CLAUDE-SECURITY-20261018-220519`), aquest protocol és d'obligat compliment per a **totes** les entitats de la Colmena: **Claude Code**, **IAIA MarIA**, **GPT Codex** i **Gemini 4 Argon**.

## 1. Els Tres Principis Inviolables de la Seguretat Rural

1. **Zero Confiança en el Client (Frontend no atorga poder):** Qualsevol verificació de rol (Veí, Editor de Poble, Administració d'Entitat, Superadministrador) ha d'estar validada al servidor (Supabase RLS, JWT, `auth.uid()` o sessió de l'amfitrió). La interfície només reflecteix permisos; mai els concedeix.
2. **Privacitat per Defecte (Trellat del Poble):** Les dades personals dels veïns (telèfons, correus electrònics, DNI/NIE/NIF, ubicacions privades) són sagrades. Tot perfil nou o dada de contacte naix privada per defecte llevat d'expressa decisió de l'usuari, i cap funció SQL ni política de Storage pot permetre'n l'enumeració anònima.
3. **Pegats Verificats per Tercers (Regla del Doble Parell i Test Previ):** Cap correcció de seguretat s'aplica a cegues. Primer s'escriu un test de regressió (`tests/*.seguretat.test.js`) que falle davant l'explotació i passe amb l'esmena; després un segon agent o subagent **Verificador Adversarial** independent audita el `.patch` buscant camins de bypass o regressions; i finalment s'aplica pel carril autoritzat, amb preimatges verificades (kit CAS o pegat comprovat).

## 2. Les 4 Capes de Defensa en Profunditat

| Capa | Eina / Actor | Àmbit d'Acció | Freqüència |
| :--- | :--- | :--- | :--- |
| **Capa 1: En sessió (Codi)** | Linter + Coacció JSONB + Escàners $O(n)$ | Prevenció de XSS, *React Error #31* per injecció JSONB, ReDoS i suplantació d'autoritat | A cada torn de desenvolupament |
| **Capa 2: Auditoria estàtica (Dades)** | MarIA / Codex / Gemini | Revisió de polítiques RLS per columna, llistat de Storage, `SECURITY DEFINER` i Path Traversal | Abans de cada migració o canvi a `src/data/` |
| **Capa 3: Deep Scan Natiu** | Plugin `claude-security` + *Clean Shadow Copy* | Mapatge multi-agent, model d'amenaces complet, tests de seguretat i exportació SARIF/pegats | Abans de tancar branques o releases |
| **Capa 4: Auditoria creuada** | Gauntlet Loop Colmena | Contrast adversarial entre Claude, Codex i Gemini sobre el paquet final | Abans de cada enviament a App Store / Google Play / Producció |

## 3. Lleis Tècniques de Blindatge Obligatori (Codi i Supabase)

En l'àmbit afectat per l'encàrrec, contrasta les lleis següents amb el codi i les proves. `tooling/gates/tractor-rls.mjs` i les suites de seguretat donen comprovacions parcials; la lectura de polítiques i del flux de dades continua sent necessària:

### A. Llei de Coacció Primitiva de Payloads `JSONB` (Prevenció de DoS en React)

- PostgREST permet que un usuari autenticat envie objectes o arrays arbitraris (`{"x":1}` o `{"toString":0}`) dins de columnes `JSONB` (com `section_submissions.payload`).
- **Prohibició Absoluta de Spread Cru:** Està prohibit fer `...r.payload` després de les propietats normalitzades o passar valors d'un `JSONB` o d'un DTO extern directament com a fills de React o arguments de `.trim()` / `` `${valor}` ``.
- **Coacció Primitiva en Mappers:** Tot camp de text procedent de base de dades o de la Frontissa ha de passar per un coaccionador primitiu (`typeof v === 'string' ? v : ''`) en el traductor d'entrada abans d'arribar als components React, evitant que un payload maliciós dispare `Objects are not valid as a React child` o `TypeError: Cannot convert object to primitive value` per damunt de `RouteErrorBoundary`.

### B. Llei d'Escàners Lineals $O(n)$ (Zero ReDoS — CWE-1333)

- **Prohibició de Regex amb Backtracking sobre Entrades No Fiables:** Està prohibit executar expressions regulars amb quantificadors imbricats o classes negades obertes (com `/<[^>]*>/g`, `/<[a-z][\s\S]*>/i` o `/<img[^>]+src="([^">]+)"/`) sobre text d'usuari, HTML ric o respostes d'API abans de truncar-ne la longitud.
- **Obligació d'Escàners Lineals:** Per a netejar etiquetes, detectar scripts o extreure atributs d'HTML (`src/config/contentHelpers.js` per a `llevaEtiquetes` i `llevaScriptsIEstils`, i `src/sections/profile/DetallMultimedia.jsx` per a `srcsDeLesImg`), s'han d'utilitzar exclusivament recorreguts lineals amb `indexOf` (`llevaEtiquetes`, `llevaScriptsIEstils`, `srcsDeLesImg`) que garantisquen temps $O(n)$ i no puguen bloquejar el fil principal del navegador.

### C. Llei de Purga d'Autoritat i Validació de Rutes `sdp-media://`

- **Purga de Claus d'Autoritat en Submissions Veïnals:** Els formularis d'aportació comunitària (`section_submissions`) han de descartar sempre qualsevol clau d'autoritat o atribució enviada pel client (`origen`, `autor`, `source`, `copyright`, `seller`, `srcDelPort`). L'autoria d'una aportació prové sempre del perfil de l'usuari autenticat, i el segell oficial de `Sóc de Poble` es determina exclusivament per `tenant_id` canònic, mai pel text d'`origen` o `title`.
- **Validació Estricta contra Path Traversal (`CWE-22`):** Abans de demanar una URL signada a Supabase Storage (`createSignedUrl` en `urlSignadaMitja`), la ruta extreta de `sdp-media://<bucket>/<camí>` ha de rebutjar qualsevol segment buit, `.`, `..`, barres invertides `\`, caràcters `?`, `#`, `%`, espais finals o caràcters de control Unicode (incloent-hi C0, C1, `\p{Cf}`, `\u2028` i `\u2029`).

### D. Llei de Privilegis per Columna, Storage sense Enumeració i `SECURITY DEFINER`

- **Privilegis per Columna en Taules Públiques:** Si una taula amb lectura pública (`SELECT` per a `anon`) conté columnes privades o de gestió interna (com `organizations.contact_email`), s'ha de revocar el `SELECT` a nivell de taula per a `anon` i atorgar `GRANT SELECT (<columnes_publiques>)` explícitament només sobre les columnes públiques.
- **Prohibició de `SELECT` Obert sobre `storage.objects` en Buckets Públics:** En Supabase Storage, els fitxers d'un bucket amb `public = true` ja es serveixen per URL directa sense necessitat de cap política `SELECT` a `storage.objects`. Crear una política `FOR SELECT TO anon, authenticated USING (bucket_id = 'mitjans')` habilita l'endpoint `POST /storage/v1/object/list/mitjans` i permet enumerar totes les carpetes i fitxers de tots els pobles i usuaris. El `SELECT` sobre `storage.objects` s'ha de restringir a l'usuari autenticat sobre el seu propi prefix (`persones/<auth.uid()>/...`).
- **Auditoria de Funcions `SECURITY DEFINER`:** Cap funció `SECURITY DEFINER` pot exposar `auth.users.email` a altres co-administradors d'una entitat si l'usuari no és el mateix `owner_user_id`.

### E. Concessions explícites de mínim privilegi

Cada migració declara els privilegis necessaris i les revocacions pertinents segons el flux real. No depengues dels privilegis per defecte d'un entorn ni dones accés als tres rols per plantilla. No atribuïsques esta política a una data o avís del proveïdor sense una font verificada.

- `anon`: només les operacions i columnes públiques justificades; cap concessió anònima per a una taula privada.
- `authenticated`: només les operacions que usa el client, amb polítiques RLS i atribució de servidor.
- `service_role`: només per a processos de servidor justificats; la clau mai arriba al frontend i no substituïx les proves amb rols menys privilegiats.
- Activa RLS i prova permisos i denegacions per a cada rol, incloses columnes privades, Storage i funcions `SECURITY DEFINER`. Un `GRANT` no acredita que la política siga correcta.

## 4. Auditoria en còpia i ferramentes disponibles

Usa el plugin de seguretat si està disponible i l'encàrrec l'inclou; no l'instal·les ni declares haver-lo executat perquè el seu nom aparega ací. Si falta, continua amb els tractors i les proves locals aplicables i declara eixa cobertura.

Quan l'arbre viu tinga canvis, preserva'ls. Prepara una còpia aïllada de la instantània acordada, registra'n la base i els hashes i treballa-hi; no faces commit o stash del treball d'altres per desbloquejar una ferramenta. Enllaça dependències ja existents només si no les has de modificar.

1. Reproduïx la fallada abans del corrector i conserva l'evidència roja.
2. Aplica el corrector en còpia i executa el reproductor i la regressió pertinent.
3. Demana contrast independent del paquet si el carril disposa d'àrbitre; si no hi ha revisió independent, declara-ho. El lliurable queda pendent d'eixa revisió abans de l'aplicació: no compta com a doble parell complet. No simules un segon dictamen.
4. Entrega el kit CAS amb `preimage_sha256` i `sha256`, o el pegat amb la comprovació d'aplicació corresponent, sense sobreescriure una preimatge divergent.

## 5. Format dels Lliurables de Seguretat (Estàndard Colmena)

Tota sessió d'auditoria de seguretat ha de dipositar els resultats amb la següent estructura:

1. **`CLAUDE-SECURITY-<data>/CLAUDE-SECURITY-RESULTS.md` / `AAMMDD_HHMM_auditoria_seguretat.md`:**
   - **ID de la troballa i CWE:** Codi únic (`F01`, `F02`...) i categoria MITRE CWE (`CWE-20`, `CWE-284`, `CWE-1333`...).
   - **Severitat i Confiança:** Crítica, Alta, Mitjana o Baixa.
   - **Escenari d'explotació reproduïble:** Comanda o payload exacte que demostra la vulnerabilitat.
   - **Pegat i prova de regressió:** Ruta del `.patch` i del test que el certifica.
2. **`pegats/F<n>.patch` i `CLAUDE-SECURITY-<data>/pegats/PEGATS.md`:** Fitxers diff estàndard de Git verificats amb `git apply --check` i índex d'ordre d'aplicació.
3. **Dipòsit del laboratori:** entrega els artefactes al satèl·lit canònic `../_investigacio_ia_de_poble/` quan siga la destinació de l'encàrrec. No mou documents vius ni dona per fet cap commit o aplicació a producció.

## 6. Llista de Comprovació Pre-Release (Sentinella Obligatori)

Abans de donar el vistiplau a qualsevol commit de funcionalitat, migració SQL, paquet mòbil (Capacitor 8) o release de WordPress:

- [ ] **Credencials públiques validades:** `src/config/publicCredentials.js` (`validatePublicCredentials`) governa els formats públics admesos. Cap clau `service_role`, secreta o amb rol privilegiat al frontend.
- [ ] **Zero Spread JSONB sense Coacció Primitiva:** Tots els camps de `payload` o DTOs externs es coaccionen a tipus primitius (`string`, `number`, `boolean`) abans d'entrar a React.
- [ ] **Zero Regex amb Backtracking sobre Entrades d'Usuari:** Tota neteja o extracció sobre HTML/text d'usuari usa escàners lineals $O(n)$.
- [ ] **Polítiques RLS per Columna i Storage sense Llistat Anònim:** `Row Level Security` actiu a totes les taules, columnes privades revocades per a `anon` i cap política `SELECT` oberta a `anon` sobre `storage.objects`.
- [ ] **Concessions mínimes verificades:** cada taula nova explicita els privilegis necessaris; no hi ha `GRANT` genèric als tres rols. Les proves inclouen les denegacions que han de continuar vigents.
- [ ] **Purga de Claus d'Autoritat i Rutes `sdp-media://` Validated:** Cap submission veïnal pot injectar `origen`/`autor`/`seller` i cap ruta d'Storage admet `..` ni caràcters de control.
- [ ] **Frontissa Sollutia en Lectura Pura (GET):** Tota petició a l'amfitrió és estrictament `GET` amb traductor i fixture, sense executar codi arbitrari.

## Vincles

- [[00_INDEX_SKILLS]]
- [[core-gauntlet-loop/SKILL]]
- [[core-edicio-segura/SKILL]]
