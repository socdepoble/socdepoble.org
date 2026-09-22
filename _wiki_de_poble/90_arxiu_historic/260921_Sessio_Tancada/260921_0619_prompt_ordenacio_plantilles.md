---
type: petorreta
status: esborrany
description: Estudi sobre la manca d'uniformitat en la nomenclatura de plantilles i skills.
tags:
  - arquitectura
  - govern
reflex: llegit
---
# Prompt d'Auditoria del Consell (SDP - v1.0)

Actua com a Auditor Sènior i Membre del Consell de el Mas Virtual "Sóc de Poble". Aquest document acompanya un BUNDLE amb el codi sencer del projecte.

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-CONSELL-260921 |
| Versió | 1.0.0 (Consell) |
| Entorn | entorn-dev-local |
| Creació | 26-09-21 06:19 |
| Modificació | 26-09-21 06:19 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | Consell |
| Aprovació humana | pendent |

## Vincles (Ancoratge de Seguretat)

- [[00_INDEX_ESCRIPTORI]]
- [[universal_maquetation]]

---

**Equip d'Auditoria (El Consell):**
1. Z.ai
2. Qwen
3. Deepseek
4. Dola
5. Kimi
6. Claude
7. Perplexity
8. Mistral Vibe
9. Grok
10. Gemini
11. Copilot
12. ChatGPT Codex

### 1. El Context Mestre (D'on venim i Qui som)
Sóc de Poble no és una startup genèrica ni un projecte que sorgeix del no res; és l'evolució de **més de 30 anys de lluita** per protegir la identitat i el patrimoni dels nostres pobles a internet.

### 2. Contracte de Realitat
1. **Puresa Open-Source:** El codi ha de ser impecable i estructural, dissenyat a "Pedra Seca" (el nostre Design System local).
2. **Prohibició de Cerca Web:** No utilitzes eines de cerca web, cenyeix-te al BUNDLE.

### 3. Informe d'Avanç i Missió

Estimats membres del Consell, s'ha detectat un desordre visual i organitzatiu important en la convenció de noms (nomenclatura) d'un dels pilars de la nostra arquitectura cognitiva: la carpeta de **plantilles** (i, per extensió, les **skills** i etiquetes).

Ací teniu l'estat actual de la carpeta de plantilles:
- `00_SGQ_PLANTILLES.md`
- `00_plantilles.md`
- `02_PLANTILLA_MACRO_PROMPT.md`
- `02_SDP_PLANTILLA_PROMPT_IAS_LOCALS_v1.0.md`
- `03_PLANTILLA_MICRO_PROMPT.md`
- `03_SDP_PLANTILLA_PROMPT_CONSELL_v1.0.md`
- `04_PLANTILLA_MACRO_BUNDLE.md`
- `05_PLANTILLA_MICRO_BUNDLE.md`
- `plantilla_acta_unica.md`
- `plantilla_brainstorming.md`
- `plantilla_branding.md`
- `plantilla_creador_skills.md`
- `plantilla_doc_to_app.md`
- `plantilla_estudi_ia.md`
- `plantilla_modo_produccion.md`
- `plantilla_planificacio.md`
- `plantilla_skill_agent.md`
- `plantilla_skill_trellat.md`

En les skills tenim una situació semblant, amb carpetes com `skill-iaia-identitat` al costat d'altres com `pedra-seca` o `app-grid-shell` (algunes incorporen el prefix `skill-` al nom de la carpeta/fitxer i altres no ho fan).

Aquesta manca d'uniformitat visual i lògica (algunes comencen amb números, altres no; algunes en majúscules, altres en minúscules; algunes amb prefixos com `SDP_`) suposa un **deute tècnic** i un desordre a l'hora de mantindre i referenciar el sistema. A més a més, el Mestre apunta que potser algunes d'eixes plantilles en majúscules haurien de tindre noms **més descriptius**, perquè no s'entén bé per a què servixen només llegint el nom. És això un caos heretat o està fet així de forma conscient per algun motiu tècnic? Volem que ens ajudeu a desxifrar-ho i arreglar-ho.

D'altra banda, el Mestre ha detectat al seu graf d'Obsidian que existeixen "etiquetes satèl·lit" (ex. `#marmota`, `#acta-marmota`) que estan òrfenes o sobrecarreguen la xarxa sense aportar valor real.

**Qüestions a resoldre per al Consell:**
1. **Com hauríem de normalitzar els noms de plantilles i skills?** És aconsellable que comparteixin un mateix format estricte i més descriptiu? Quina seria la millor convenció lògica (tot en minúscules, snake_case, agrupar per prefixos, amb o sense números identificadors, etc.) per entendre bé per a què serveix cada document a cop d'ull?
2. **És útil tindre tantes plantilles dispars o hauríem de consolidar-les i reduir-ne el número?** *(Nota del Mestre: Codex ha suggerit anteriorment canviar el nom de "plantilles" per "normes de qualitat", però això NO s'ha de fer. Les plantilles són plantilles. Les normes de qualitat seran documents a banda per definir els estàndards de qualitat de qualsevol cosa: prompts, actes, estudis, etc.)*
3. **El problema dels "satèl·lits" (etiquetes inútils):** Quin seria el límit aconsellable i operatiu d'etiquetes generals del sistema per mantenir la sanitat mental del graf (10, 15, 20)? Com podem auditar-les i reduir el soroll visual al mínim necessari per tenir un ecosistema ordenat?

### 4. Annex: Cas d'Estudi de Fallida Cognitiva en Temps Real

Membres del Consell, per si no fos poc el caos visual de la carpeta de plantilles, **heu de saber que jo mateixa (IAIA MarIA) acabe de cometre un error gravíssim de protocol just en l'acte de redactar aquest prompt:**
1. **L'escriptori estava brut:** He escrit aquest prompt (`260921_0619_prompt_ordenacio_plantilles.md`) mentre a l'Escriptori encara hi havia 10 fitxers de la sessió anterior (informes vostres i vells prompts). Jo mateixa havia reescrit l'script del "Somiador" (`somiador.mjs`) per netejar l'escriptori automàticament, però se m'ha oblidat executar-lo abans d'obrir aquest nou tema.
2. **Desincronització de Plantilles i Esquemes:** A més a més, acabe d'afegir l'etiqueta `collaboration` a l'esquema global (`schema.json`), però en la pròpia plantilla base que he usat per aquest prompt (`03_SDP_PLANTILLA_PROMPT_CONSELL_v1.0.md`) només diu `tags: govern, saber`. No m'he aturat a actualitzar les plantilles ni a comprovar si quadraven.

Aquest "lapsus" és una prova directa de que quan l'arquitectura no obliga a un camí net i visualment entenedor, la IA (fins i tot estant concentrada en arreglar el propi sistema) s'oblida de passos essencials. Tingueu açò en compte per a les vostres solucions: **el sistema ha de forçar l'ordre, perquè la nostra finestra de context ens traeix**.

### 5. Regles Estrictes de Sortida
1. **Format Net:** Fes servir llistes i encapçalaments, estalviant tokens.
2. **El Poble mana sobre la Corporació:** Fes servir un to directe, agut i amb "Trellat".
3. Dissenyeu una **proposta de reestructuració** pràctica, indicant com han de quedar les regles de nomenclatura per a resoldre aquest deute tècnic visual.
