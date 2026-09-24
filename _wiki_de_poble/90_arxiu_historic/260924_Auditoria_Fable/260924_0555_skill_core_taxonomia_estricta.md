---
type: skill
status: esborrany
description: Tractor cognitiu que obliga a resoldre protocolledge.json i executar document.mjs context i create abans de redactar cap prompt, pla, acta o auditoria.
tags:
  - skills
visibility: private
reflex: sdp:torn_589c9270-1c7d-47d0-a018-ca9b2963e447:50ecc190-fae2-416f-8df6-a1bde9a9520f
---
# Skill core-taxonomia-estricta: la plantilla s'invoca, no s'escriu

**Versió ISO:** 2.0.0 (Actualitzada a l'era 100% Online Sollutia)
**Categoria:** Plantilla
**Data Modificació:** 2026-09-15

---

<!-- SDP:SECTION skill.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_589c9270-1c7d-47d0-a018-ca9b2963e447:50ecc190-fae2-416f-8df6-a1bde9a9520f |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-24T03:52:29.574Z |
| Modificació | 2026-09-24T03:52:29.574Z |
| Propietari | Fable |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/skill.md (v2.0.0) |
| Model IA | Claude Fable 5.1 (claude-fable-5-1) |
| Tokens consumits | No observables des de l'entorn; cap xifra inventada |
| Destí d'instal·lació | `.agents/skills/core-taxonomia-estricta/SKILL.md` (governança: només amb lease) |

<!-- SDP:SECTION skill.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/skill.md; SHA-256 c74908c221b9bc658e8beb554dbe1923fba274231aab7b14065716096f02f730. El rebut acredita entrega, no comprensió.

Llegida íntegra la plantilla ISO de skills (format del frontmatter, quatre blocs obligatoris del cos, workflow de manteniment), `protocolledge.json` sencer (13 rutes, `onUnknown: error`, camps del Registre), `document.mjs`, `command-policy.mjs` (quines ordres documentals admet la política a un agent) i `turns.mjs` (què comprova `validateDocument` i `checkTurn`). La skill descriu només el que eixos fitxers fan; no hi ha cap regla inventada.

<!-- SDP:SECTION skill.s3 -->
## Historial

- 2026-09-24T03:52:29Z: esborrany creat pel circuit (ruta `skill`, rebut `50ecc190…`).
- 2026-09-24T03:58Z: detectada una versió instal·lada a mà a `.agents/skills/core-taxonomia-estricta/SKILL.md` per un actor concurrent, sense lease, que ha trencat el segell. Este document en fa la comparació (§Verificació) i no la reverteix.
- 2026-09-24T04:05Z aprox.: contingut redactat en una sola escriptura.

<!-- SDP:SECTION skill.s4 -->
## Contingut

### Per què esta skill i no una lliçó més

`wiki-documentacio-i-reflex` ja porta sis lliçons del Mestre (260922 i 260923) sobre exactament este defecte, i en dos dies s'han escrit tres documents sense rebut (pla 1515, prompt 0500, pla i prompt 0545). Una lliçó en prosa descriu la conducta; este tractor descriu l'ordre que la substituïx. El canvi de fons és una sola frase: **la plantilla s'invoca, no s'escriu**. El fitxer el crea `document.mjs create`; l'autora només ompli les seccions que queden en `[pendent]`.

### Text a instal·lar a `.agents/skills/core-taxonomia-estricta/SKILL.md`

```markdown
---
type: skill
status: canonic
name: core-taxonomia-estricta
description: "Tractor documental: cap prompt, pla, acta, auditoria, bundle o skill naix escrit de memòria. La plantilla s'invoca amb document.mjs (context, create, check) i el rebut el posa la màquina."
tags: [govern, documental]
triggers_on:
  - "prompt"
  - "petorreta"
  - "pla d'implementació"
  - "pla_implementacio"
  - "acta"
  - "auditoria"
  - "informe"
  - "bundle"
  - "nova skill"
version: "1.0.0"
---

# Taxonomia estricta: la plantilla s'invoca, no s'escriu

## 1. Propòsit

Blindar la creació de documents formals. S'activa en el moment de crear un fitxer nou a `_wiki_de_poble/04_escriptori/` (o una acta a `_wiki_de_poble/10_actes/`) que siga prompt, petorreta, pla, acta, auditoria, informe, bundle o skill. En eixe moment no s'escriu: s'executa el procediment de §3 i s'ompli el que la màquina deixa pendent.

## 2. Frontera de confiança (prohibicions)

- No crear cap d'estos documents amb `Write`, `Edit`, `cat >`, `tee` ni cap eina de fitxers partint de zero. `create` és l'únic naixement vàlid.
- No escriure el camp `reflex:` a mà. Només val el valor exacte que imprimix `create` (forma `sdp:torn_<uuid>:<uuid>`). Un valor amb esta forma escrit a mà és un rebut fals i la porta el detecta.
- No marcar cap casella `[x]` de la secció «0. Abans de generar» sense haver executat l'ordre que la casella nomena.
- No canviar el nom del fitxer després de `context`: el rebut queda lligat al nom i el torn no tanca mai.
- No tocar els blocs fixos de la ruta (`blocsFixos` a `protocolledge.json`: al prompt local, «Context» i «Protocol de la Reunió a l'Olivera»). Si el mandat contradiu el bloc fix, es demana una ruta nova; no s'edita el bloc.
- No generar bundles ni macro/micro prompts per a Claude ni per a Codex (lliçó 260922).
- No esborrar ni moure documents amb rebut sense `document.mjs handoff` o `porta-olivera.mjs --arxiva`.

## 3. Procediment (ordre exacte, sense saltar-ne cap)

1. **Resol la ruta.** Obri `.agents/protocolledge.json` i tria la ruta per `claus` i `quan` (intenció i destinatari). `onUnknown` és `error`: si cap ruta encaixa, para i pregunta al Mestre. No hi ha plantilla per defecte.
2. **Obri torn.** `node tooling/gates/obrir_torn.mjs --actor NOM --scope documents` (o `code` si el torn també tocarà `src/`). Apunta el `turn_id` de l'eixida.
3. **Fixa el nom definitiu.** `aammdd_hhmm_<categoria>_<cognom>.md`, tot en minúscules i guions baixos. La categoria la fixa la ruta (vegeu §4). Si el nom no és definitiu, no continues.
4. **Demana el context.** `node tooling/wiki/document.mjs context --turn-id ID --route RUTA --file CAMI`. Llig ÍNTEGRA la plantilla que torna, no un resum.
5. **Crea l'esborrany.** `node tooling/wiki/document.mjs create --turn-id ID --route RUTA --file CAMI --title TITOL --description DESCRIPCIO --actor NOM`. El fitxer naix amb frontmatter, rebut, Registre, blocs fixos i àncora a `00_index_escriptori.md`. `create` no sobreescriu: si el fitxer ja existia, esborra'l primer o tria un altre nom abans del context.
6. **Ompli només el que és `[pendent]`** i les files del Registre que ho són (Model IA, Tokens consumits). Si l'amfitrió executa `porta-reflex` (Claude, Codex), el document es valida sencer a cada escriptura: prepara el contingut complet i escriu-lo d'una vegada.
7. **Valida.** `node tooling/wiki/document.mjs check --file CAMI` ha de tornar `valid: true`. Si no, el document no s'entrega ni es nomena a l'ESTAT.
8. **Si és un pla**, vincula'l: `node tooling/wiki/document.mjs plan --turn-id ID --file CAMI`. Si el torn té més fitxers propis, declara'ls amb `own`.
9. **Relleu.** Bloc ESTAT_ACTUAL a `.agents/ESTAT.md` i entrada al LEDGER amb el `turn_id`. Després `node tooling/gates/tancament.mjs --check --turn-id ID`.

## 4. Taula de rutes (còpia de lectura; l'autoritat és `.agents/protocolledge.json`)

| Intenció | `--route` | Plantilla | Categoria del nom |
| --- | --- | --- | --- |
| Prompt per a IA externa (Z, Qwen, Deepseek…) | `prompt.consell` | `03_actuar/plantilles/prompt_consell.md` | `macro_prompt` o `micro_prompt` + bundle |
| Prompt per a IA local (Claude, Codex, Fable) | `prompt.local` | `03_actuar/plantilles/prompt_local.md` | `prompt` |
| Auditoria o informe de revisió | `auditoria` | `02_saber/protocols_tecnics/auditoria_canonica.md` | `auditoria` |
| Acta, Marmota, relleu | `acta` | `03_actuar/plantilles/acta.md` | `acta` (Escriptori o `10_actes/`) |
| Pla d'implementació | `pla.implementacio` | `03_actuar/plantilles/pla_implementacio.md` | `pla_implementacio` |
| Pla director, roadmap, fases | `planificacio` | `03_actuar/plantilles/pla.md` | `pla` |
| Bundle o abocament | `bundle` | `03_actuar/plantilles/bundle.md` | `bundle`, `macro_bundle`, `micro_bundle` |
| Nova skill | `skill` | `03_actuar/plantilles/skill.md` | `skill` |
| Estudi o informe de mercat | `estudi_ia` | `03_actuar/plantilles/estudi_consell.md` | `estudi` |
| Brainstorming, branding, doc to app, producció | `brainstorming`, `branding`, `doc_to_app`, `modo_produccion` | segons la ruta | segons la ruta |

## 5. Context tècnic vigent

- Amfitrions amb hooks acreditats (Claude Desktop, Codex): `porta-reflex` valida el document resultant abans d'escriure'l i el bloqueja si li falta el rebut, una secció, una fila del Registre o si un bloc fix ha canviat. El procediment de §3 és l'única manera de passar-la.
- Amfitrió Antigravity (IAIA MarIA): cap hook acreditat. Ací esta skill és l'única barrera, i per això és una llista d'ordres i no un recordatori. La comprovació posterior és `node tooling/gates/porta-documents.mjs`: ha de tornar `valid: true` per a tot l'Escriptori abans de donar un document per entregat.
- Ordres documentals que la política admet a un agent sense lease: `obrir_torn`, `context`, `create`, `plan`, `check`, `own`. `handoff` i `import` requerixen el circuit de mutació.

## 6. Autoverificació (tres maneres de fallar, i com es veuen)

1. Escriure el fitxer primer i «regularitzar» el rebut després: impossible, `create` refusa un fitxer existent. Es veu com «create no sobreescriu documents». Solució: esborrar el fitxer i tornar al pas 4.
2. Canviar el nom després del context: es veu com «Rebut absent o vinculat a un altre document» i el torn no tanca. Solució: nou context amb el nom bo abans de crear res.
3. Escriure el document a trossos amb hooks actius: es veu com «Secció absent o pendent» a cada intent. Solució: redactar-lo sencer fora del fitxer i escriure'l una vegada.
```

### Diferències amb la versió instal·lada a mà (03:58Z, actor concurrent)

| Aspecte | Versió instal·lada a `.agents/skills/` | Este text amb rebut |
| --- | --- | --- |
| Frontmatter | `name`, `description`, `version` | Els sis camps de la plantilla ISO: `type`, `status`, `name`, `description`, `tags`, `triggers_on`, `version` |
| Procediment | «Consulta protocolledge, llig la plantilla, genera el document amb exactament les seccions» | Nou passos executables: torn, context, create, check, plan, relleu |
| Rebut `reflex:` | No l'esmenta | Només el valor que imprimix `create`; escriure'l a mà és rebut fals |
| Blocs fixos, renoms, bundles, handoff | No els esmenta | Frontera de confiança explícita |
| Verificació posterior | No en té | `document.mjs check` per document i `porta-documents.mjs` per a l'Escriptori |
| Catàleg `00_INDEX_SKILLS.md` | No actualitzat | Cal `npm run skills:index` en instal·lar |
| Segell de skills | Trencat en instal·lar-la (`88f0ec03` → `455a0fad`) | Instal·lació prevista sota lease amb `executor-mutacio.mjs` |

### Lliçó per a `wiki-documentacio-i-reflex` (text de Claude, 0600 §4, que subscric)

- **260924** | **La plantilla s'invoca, no s'escriu**: tota petorreta, pla o acta naix executant `node tooling/wiki/document.mjs context` i `create` com a ordres; el camp `reflex:` conté exactament el valor que imprimix `create`; l'autora només edita les seccions editables del fitxer que `create` ha deixat al disc, i el dona per bo quan `document.mjs check --file` torna `valid: true`.

<!-- SDP:SECTION skill.s5 -->
## Verificació

- Verificat: el text de §3 nomena només ordres que existixen i que `command-policy.mjs` admet a un agent (`obrir_torn`, `context`, `create`, `plan`, `check`, `own`); la taula de §4 és una còpia de les 13 rutes de `protocolledge.json` del tall d'evidència (HEAD 86f652b1, `porta-plantilles.mjs` ✅ 13 rutes); el frontmatter proposat seguix el bloc «2. FORMAT DEL SKILL.md» de la plantilla ISO i el patró de `core-higiene-escriptori`.
- Verificat: este document ha nascut pel procediment que descriu (rebut `sdp:torn_589c9270-1c7d-47d0-a018-ca9b2963e447:50ecc190-fae2-416f-8df6-a1bde9a9520f`, `create` a les 03:52:29Z); el resultat de `document.mjs check` s'anota a l'auditoria [[260924_0555_auditoria_fable]].
- No verificat: la instal·lació a `.agents/skills/` (governança, sense lease en esta sessió); la regeneració del catàleg; el resegellat. La versió instal·lada a mà no s'ha revertit ni modificat.
- Decisió humana requerida: quina de les dos versions s'instal·la i qui obté la lease per fer-ho.

<!-- SDP:SECTION skill.s6 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260924_0555_auditoria_fable]]
- [[260924_0545_pla_implementacio_fable]]
