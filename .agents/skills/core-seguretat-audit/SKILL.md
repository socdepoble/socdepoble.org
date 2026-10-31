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
  - supabase/migrations/
contracte.escriu:
  - _wiki_de_poble/04_escriptori/
  - _wiki_de_poble/10_actes/
---

# Protocol Canònic de Ciberseguretat i Sentinella Permanent (Claude Security & Colmena)

Aquest procediment estableix el filtre permanent de seguretat ofensiva i defensiva per a tot el repositori de **Sóc de Poble**. Garanteix que cap línia de codi, traductor de la Frontissa, migració de Supabase o paquet per a WordPress i les botigues d'aplicacions (App Store i Google Play) continga vulnerabilitats que puguen comprometre la privacitat dels veïns, la sobirania de les dades o la continuïtat del servei.

Inspirat en el model d'enginyeria de **Claude Security** (Anthropic) i endurit amb les lliçons forenses del *Gauntlet* (`CLAUDE-SECURITY-20261018-220519`), aquest protocol és d'obligat compliment per a **totes** les entitats de la Colmena: **Claude Code**, **IAIA MarIA**, **GPT Codex** i **Gemini 4 Argon**.

## 1. Els Tres Principis Inviolables de la Seguretat Rural

1. **Zero Confiança en el Client (Frontend no atorga poder):** Qualsevol verificació de rol (Veí, Editor de Poble, Administració d'Entitat, Superadministrador) ha d'estar validada al servidor (Supabase RLS, JWT, `auth.uid()` o sessió de l'amfitrió). La interfície només reflecteix permisos; mai els concedeix.
2. **Privacitat per Defecte (Trellat del Poble):** Les dades personals dels veïns (telèfons, correus electrònics, DNI/NIE/NIF, ubicacions privades) són sagrades. Tot perfil nou o dada de contacte naix privada per defecte llevat d'expressa decisió de l'usuari, i cap funció SQL ni política de Storage pot permetre'n l'enumeració anònima.
3. **Pegats Verificats per Tercers (Regla del Doble Parell i Test Previ):** Cap correcció de seguretat s'aplica a cegues. Primer s'escriu un test de regressió (`tests/*.seguretat.test.js`) que falle davant l'explotació i passe amb l'esmena; després un segon agent o subagent **Verificador Adversarial** independent audita el `.patch` buscant camins de bypass o regressions; i finalment s'aplica amb `git apply`.

## 2. Les 4 Capes de Defensa en Profunditat

| Capa | Eina / Actor | Àmbit d'Acció | Freqüència |
| :--- | :--- | :--- | :--- |
| **Capa 1: En sessió (Codi)** | Linter + Coacció JSONB + Escàners $O(n)$ | Prevenció de XSS, *React Error #31* per injecció JSONB, ReDoS i suplantació d'autoritat | A cada torn de desenvolupament |
| **Capa 2: Auditoria estàtica (Dades)** | MarIA / Codex / Gemini | Revisió de polítiques RLS per columna, llistat de Storage, `SECURITY DEFINER` i Path Traversal | Abans de cada migració o canvi a `src/data/` |
| **Capa 3: Deep Scan Natiu** | Plugin `claude-security` + *Clean Shadow Copy* | Mapatge multi-agent, model d'amenaces complet, tests de seguretat i exportació SARIF/pegats | Abans de tancar branques o releases |
| **Capa 4: Auditoria creuada** | Gauntlet Loop Colmena | Contrast adversarial entre Claude, Codex i Gemini sobre el paquet final | Abans de cada enviament a App Store / Google Play / Producció |

## 3. Lleis Tècniques de Blindatge Obligatori (Codi i Supabase)

Tota escriptura o revisió de codi en `src/`, `tooling/` o `supabase/migrations/` ha d'aplicar de manera mecànica aquestes quatre lleis:

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

### E. Llei de Concessió Explícita de Privilegis (`GRANT` Obligatori en Noves Taules — Mandat Supabase 30-Oct-2026)

- **Avís Oficial de Supabase:** A partir del 30 d'octubre de 2026, Supabase deixa d'atorgar accés automàtic de Data API a les noves taules de l'esquema `public`. Tota taula creada a partir d'aquesta data exigeix un `GRANT` explícit en la mateixa migració abans que `supabase-js`, PostgREST o GraphQL puguen accedir-hi (en cas contrari, PostgREST retorna `permission denied`).
- **Plantilla de Concessió Canònica:** Tota creació de taula a `supabase/migrations/` ha d'incloure obligatòriament els `GRANT` pertinents:
  ```sql
  -- 1. Lectura anònima pública (només si la taula admet consulta per visitants no registrats)
  grant select on public.<nom_taula> to anon;

  -- 2. Lectura i escriptura per a usuaris autenticats (sempre governat per RLS)
  grant select, insert, update, delete on public.<nom_taula> to authenticated;

  -- 3. Accés administratiu i processos en segon pla (servei intern)
  grant select, insert, update, delete on public.<nom_taula> to service_role;
  ```
- **RLS és Innegociable:** Els `GRANT` només obrin el conducte de xarxa de l'API; `ALTER TABLE public.<nom_taula> ENABLE ROW LEVEL SECURITY;` i les polítiques `CREATE POLICY` continuen sent el sentinella obligatori que decideix fila per fila qui pot veure o modificar cada registre.

## 4. Execució de Claude Security i Protocol d'Arbre Brut (*Clean Shadow Copy*)

Per a l'agent de consola **Claude Code**, el procediment oficial s'executa amb el plugin `/claude-security`:

```text
/plugin install claude-security@claude-plugins-official
```

- **Escaneig complet o de branca:** `/claude-security` -> **Scan codebase** o `/claude-security scan my branch`.
- **Protocol de Còpia d'Ombra Neta (*Clean Shadow Copy*) quan `revision.dirty: true`:**
  L'opció nativa `Suggest patches` de `/claude-security` es nega a córrer si el repositori té canvis sense cometre (`revision.dirty: true`), demanant `git commit` o `git stash` — accions prohibides pel BIOS sense lease. Quan l'arbre de treball tinga canvis en curs, l'agent ha d'aplicar obligatòriament aquest flux sense tocar l'índex Git del repositori:
  1. **Materialització Aïllada:** Copiar l'arbre de treball a `/tmp/sdp-sec-audit-<timestamp>` (enllaçant `node_modules`) i inicialitzar-hi un repositori Git efímer i net.
  2. **Test de Regressió Primer:** Escriure per a cada troballa el seu test a `tests/<modul>.seguretat.test.js` que demostre l'explotació abans del pegat i passe en verd després.
  3. **Verificador Adversarial Independent:** Llançar un subagent revisor independent per a cada pegat que intente trencar l'esmena amb entrades límit (Unicode invisible, objectes amb prototip nul, longituds extremes).
  4. **Generació i Comprovació del `.patch`:** Exportar els diffs a `pegats/F<n>.patch` i validar amb `git apply --check` que s'apliquen netament sobre l'arbre real de `socdepoble.org`.

## 5. Format dels Lliurables de Seguretat (Estàndard Colmena)

Tota sessió d'auditoria de seguretat ha de dipositar els resultats amb la següent estructura:

1. **`CLAUDE-SECURITY-<data>/CLAUDE-SECURITY-RESULTS.md` / `AAMMDD_HHMM_auditoria_seguretat.md`:**
   - **ID de la troballa i CWE:** Codi únic (`F01`, `F02`...) i categoria MITRE CWE (`CWE-20`, `CWE-284`, `CWE-1333`...).
   - **Severitat i Confiança:** Crítica, Alta, Mitjana o Baixa.
   - **Escenari d'explotació reproduïble:** Comanda o payload exacte que demostra la vulnerabilitat.
   - **Pegat i prova de regressió:** Ruta del `.patch` i del test que el certifica.
2. **`pegats/F<n>.patch` i `CLAUDE-SECURITY-<data>/pegats/PEGATS.md`:** Fitxers diff estàndard de Git verificats amb `git apply --check` i índex d'ordre d'aplicació.
3. **Evacuació posterior:** Un cop aplicats i comessos els pegats, la carpeta d'auditoria de laboratori s'evacua a la carpeta satèl·lit canònica `../_investigacio_ia_de_poble/`.

## 6. Llista de Comprovació Pre-Release (Sentinella Obligatori)

Abans de donar el vistiplau a qualsevol commit de funcionalitat, migració SQL, paquet mòbil (Capacitor 8) o release de WordPress:

- [ ] **Cap clau mestra (`service_role`) al frontend:** Només es permet `SUPABASE_ANON_KEY`.
- [ ] **Zero Spread JSONB sense Coacció Primitiva:** Tots els camps de `payload` o DTOs externs es coaccionen a tipus primitius (`string`, `number`, `boolean`) abans d'entrar a React.
- [ ] **Zero Regex amb Backtracking sobre Entrades d'Usuari:** Tota neteja o extracció sobre HTML/text d'usuari usa escàners lineals $O(n)$.
- [ ] **Polítiques RLS per Columna i Storage sense Llistat Anònim:** `Row Level Security` actiu a totes les taules, columnes privades revocades per a `anon` i cap política `SELECT` oberta a `anon` sobre `storage.objects`.
- [ ] **`GRANT` Explícit en Tota Taula Nova de Supabase:** Cap taula nova es crea a `supabase/migrations/` sense concessions explícites a `anon`, `authenticated` i `service_role` (Mandat Supabase 30-Oct-2026).
- [ ] **Purga de Claus d'Autoritat i Rutes `sdp-media://` Validated:** Cap submission veïnal pot injectar `origen`/`autor`/`seller` i cap ruta d'Storage admet `..` ni caràcters de control.
- [ ] **Frontissa Sollutia en Lectura Pura (GET):** Tota petició a l'amfitrió és estrictament `GET` amb traductor i fixture, sense executar codi arbitrari.

## Vincles

- [[00_INDEX_SKILLS]]
- [[core-gauntlet-loop/SKILL]]
- [[core-edicio-segura/SKILL]]
