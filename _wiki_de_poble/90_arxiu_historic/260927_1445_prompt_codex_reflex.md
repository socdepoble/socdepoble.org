---
tipus: prompt
títol: "Instal·lació de Seguretat: El Reflex de MarIA i Reconciliació del Segell"
data: 2026-09-27T14:45:00+02:00
destinatari: Codex (ChatGPT Pro)
mode: execució
---

# Registre

| Camp | Valor |
| --- | --- |
| Identificador | `260927_1445_prompt_codex_reflex` |
| Destinatari | Codex (ChatGPT Pro) |
| Mode | Execució |
| Aprovació humana | Rebutja l'execució si el Mestre no dóna el vistiplau exprés. |
| Requires Human Decision | True (Toca governança i `tooling/`) |

# 0. Preflight (Escriptori net i documents llegits)

- [x] L'Escriptori només conté aquest document i l'auditoria prèvia (`260927_1310_auditoria_claude.md`).
- [x] Has llegit íntegrament l'auditoria de Claude esmentada, que conté els scripts de la solució i les ordres per a reconciliar el segell.

# Instrucció del torn

Codex, ets l'Arquitecte SRE de Sóc de Poble. L'equip de desenvolupament (Opus) ha creat una solució de seguretat (El Reflex de MarIA) al laboratori (`_wiki_de_poble/04_escriptori/02_investigacio_ia/260927_1310_reflex_maria/`), però no ha pogut instal·lar-la perquè el Segell de Governança del repositori estava trencat i no tenien *lease*. 
La teua missió és **reconciliar el segell de seguretat**, **instal·lar els scripts d'aquesta solució a l'arrel de `tooling/` i `.claude/`** i **actualitzar la plantilla de prompts** perquè no tornen a donar-se els defectes detectats a l'auditoria.

# Abast

- **Dins:** `.agents/SKILLS_SEAL.json`, `tooling/wiki/petorreta.mjs` (nou), `tooling/gates/porta-receptor.mjs` (nou), `.claude/settings.json`, `package.json`, `~/.gemini/GEMINI.md` o equivalent de regles globals, `~/.gemini/antigravity/mcp_config.json`, `_wiki_de_poble/03_actuar/plantilles/prompt_local.md`.
- **Fora:** No toques la interfície de l'aplicació (`src/`). 

# Tasques

**T1. Reconciliació del Segell (Obrir la Porta)**
- Executa la comanda recomanada per Opus per forçar la reconciliació: `node tooling/gates/segella.mjs --update --expected-hash=afe40038ee804145817d42f200c91fafdc085f82cc48be02fb3be63e21605527 --expected-previous=69beea9e4f965bc84d9776b261813c63cd4f4fe4783f5944cdf74fc29a26901a --reason="Reconciliació autoritzada per instal·lar Reflex"`
- *Criteri d'acceptació:* `node tooling/gates/segella.mjs` ha de tornar codi d'eixida 0.

**T2. Instal·lació del Reflex de MarIA**
- Copia els dos scripts del laboratori a les seues rutes definitives a `tooling/wiki/` i `tooling/gates/`.
- Actualitza el `.claude/settings.json` i el `package.json` tal com descriu l'auditoria a la línia 165 i 166.
- *Criteri d'acceptació:* `npm run petorreta --help` hauria de ser executat sense errors.

**T3. Implantació de la REGLA 0**
- Afig la REGLA 0 i el testimoni de càrrega (`GRALLA-SECA-7Q`) a les regles globals d'Antigravity (`GEMINI.md` o el fitxer rellevant al teu context d'agents) segons l'estructura proporcionada a l'auditoria (línia 180).

**T4. Actualització de la Plantilla de Prompts (V3)**
- Llig els 12 defectes trobats a l'auditoria i reescriu la plantilla mestra `prompt_local.md` (`_wiki_de_poble/03_actuar/plantilles/prompt_local.md`) implementant l'estructura V3 Fase A descrita per Opus.
- *Criteri d'acceptació:* El fitxer existeix, té les seccions correctes, ja no cita `AuthForm` ni obliga a predir tokens, i té la secció `Mode` ben separada.

**T5. Sanejament de Credencials**
- Elimina contrasenyes en clar del `mcp_config.json` si és que existeix en el teu abast. Substitueix-les per `<INSERIR_TOKEN>`.

# Riscos

- Ruptura del *lease* / bloqueig per intentar escriure abans d'haver executat correctament la reconciliació del segell. Obre la porta abans de passar.

# Contracte d'eixida

Només has de proporcionar un document final.
- **Ruta i Nom:** `_wiki_de_poble/04_escriptori/AAMMDD_HHMM_informe_codex.md`.
- **Rebut:** Genera'l de seguida perquè la Porta Documental no et bloquegi.

# Entorn i permisos

- Ets un agent amb accés local al terminal per a executar comandes.
- Tens instruccions explícites d'Ignorar la trava `requires_human_decision` només per a dur a terme aquestes 5 tasques autoritzades pel Mestre.
- Tens permís exprés per tocar governança (carpeta `tooling/` i `.agents/`).

# Context

- **Vigent:** Som un model *Supabase-autoritatiu*. Tots els processos i scripts formen part de la governança de Sóc de Poble.
- **Direcció:** Evitar la fricció i el deute cognitiu. Un sistema net redueix la taxa d'al·lucinació de l'Eixam.

# Protocol de la Reunió a l'Olivera

Si estàs d'acord amb aquest abast i consideres que la reconciliació del segell té sentit i no ens rebentarà l'arquitectura de *hooks*, avisa al Mestre. A l'estar en Mode Execució, una volta validat podràs executar els canvis de governança en directe.

# Acte reflex

Cap codi és vàlid si la governança de seguretat no pot supervisar-lo.

# Vincles

- [[00_index]]
- [[00_index_escriptori]]
