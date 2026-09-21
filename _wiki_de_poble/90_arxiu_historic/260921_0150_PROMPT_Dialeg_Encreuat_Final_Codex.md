---
type: PROMPT
status: draft
description: Tancament del Diàleg Encreuat per a Codex (Rèplica final sobre Claude)
tags: [auditoria, red-team, supabase, dialeg-encreuat]
---

# Router Unificat
- **Superfície del destinatari (Q1):** `local` (Codex / ChatGPT)
- **Pes del context (Q2):** `cap` (accés natiu a l'escriptori)
- **Format (Q3):** Frontmatter canònic aplicat.

# 00_PLANTILLA_PETORRETA

## 1. El Context i la Missió (El Mas Viu)
Codex, la IA "Claude" ha llegit el teu informe creuat i acaba de dipositar a l'escriptori la seua rèplica final i l'anàlisi de la nova secció arquitectònica del Workspace. L'ha anomenat:
`[[260921_0140_INFORME_claude_replica_creuada.md]]`

## 2. La Tasca Concreta (La Faena)
La teua missió ara és posar el punt final a aquest diàleg socràtic:
1. Llig exhaustivament l'informe de rèplica generat per Claude.
2. Analitza la seua resposta:
   - Claude ha acceptat les teues 4 correccions majors (B1, A4, A6/C1, E1). Comprova si els matisos que aporta ara (per exemple, sobre com l'estat degradat del refresc fa perdre la clau del scope, o l'evidència del pre-commit saltat a `5ad62b43`) són tècnicament exactes i els hem d'incorporar a la veritat canònica del nostre pla.
   - Claude ha avaluat la secció 3 (Workspace, capçaleres, pastilles, independència i UX de notes). Compara la seua anàlisi de UI/UX amb la teua visió arquitectònica de com hauria de ser un `UniversalWorkspace` robust.
3. Redacta el teu veredicte final i definitiu a l'Escriptori (`260921_0150_INFORME_veredicte_final_codex.md`).
4. Indica clarament qualsevol detall de l'anàlisi de Claude que consideres que encara amaga algun risc o "fantasma" que hauríem de tenir en compte abans de començar la implementació. Si consideres que el diagnòstic és totalment sòlid, dona la llum verda arquitectònica.

## 3. Les Regles de l'Escriptori (La Llei de Pedra Seca i Contenció)
- **Zero Ocultació:** Sigueu absolutament directes. Aquesta és la revisió final abans de picar codi.
- **Contenció Absoluta:** Està TOTALMENT PROHIBIT modificar cap fitxer del repositori font ni alterar el `implementation_plan.md`. Només has d'escriure el teu informe a l'Escriptori per mantenir el Mas segur.
- Eres el "Red Team" sènior; la teua paraula tancarà aquesta fase d'auditoria.
