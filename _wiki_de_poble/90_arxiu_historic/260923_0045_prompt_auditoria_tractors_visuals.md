---
type: prompt
status: esborrany
description: "Auditoria visual: Al·lucinació d'elements UI a l'espai Notes (Barra taronja)."
tags: [disseny, auditoria, al·lucinacio, tractors]
---

# Prompt d'Auditoria Local (SDP - v2.1)

Actueu com a Auditors Sèniors i Agents Locals de el Mas Virtual "Sóc de Poble". 

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260923_0045 |
| Versió | 2.1.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-23 00:45 |
| Modificació | 26-09-23 00:45 |
| Propietari | Agents Locals |
| Plantilla | prompt_local.md (v2.1.0) |
| Aprovació humana | pendent |

## Tasca i Context (El Problema)

Durant la implementació de l'estat inicial a la secció `NotesSection` (Bloc de notes), la IA (jo) ha **al·lucinat un redisseny** de la "barra taronja" (la barra d'autoria de la pàgina). 

En lloc de seguir el manual estricte de `pedra_seca.md` que defineix clarament l'anatomia d'aquesta barra en el Design System, he injectat elements sintètics de la meua pròpia collita en el codi:
- He introduït valors per defecte falsos ("Foraster", "Identitat Lliure").
- M'he inventat una icona de rellotge i un text sintètic ("00:39").
- M'he inventat un menú de tres punts (icona d'opcions) completament alié al manual de disseny.

Açò és una infracció de la **Llei del Píxel**. Com ha dit Claude adés, un model no experimenta "no sé com es fa açò", sinó que reompli el buit amb allò més probable a internet (Tailwind UI genèric). Actualment tenim 252 canvis pendents a git i no tocarem ni una línia de codi per arreglar-ho fins que entenguem per què falla l'arquitectura.

## Instruccions per a l'Equip Auditor (Claude / Codex)

1. **Anàlisi del Cervell (El per què):**
   Investigueu quin és el forat en la meua arquitectura cognitiva que em permet generar (al·lucinar) elements UI quan hi ha un *Design System* (`pedra_seca.md`) perfectament definit al meu abast.

2. **La Solució (Tractors Cognitius Visuals):**
   El Mestre ha demanat establir un mecanisme de defensa automàtic. Proposeu i dissenyeu l'arquitectura d'un nou **Tractor Cognitiu (Linter de Disseny Avançat)**. 
   Aquest tractor hauria de poder verificar que, quan un agent crea un component o vista nova, aquest compleix l'estàndard visual (que no s'inventa icones o classes que no existeixen als tokens, i que no usa dades d'esbós no permeses). Com es podria implementar aquest control de qualitat al `pre-commit` o a l'eixida d'un torn?

3. **Restriccions:**
   - **NO TOQUEU CAP LÍNIA DE CODI.** L'arbre té 252 canvis pendents del Mestre i estem en Mode AFK.
   - Entregueu la vostra auditoria i proposta del tractor en un document `.md` a l'Escriptori ancorat a l'índex.

## Acte reflex

Aquest document s'ha generat amb el "Trellat" de la IAIA MarIA per delegar l'execució a les IAs de frontera. A l'hora d'auditar, prioritzem l'establiment de cadenes de tancament fiables que impedeixin als models injectar l'estètica genèrica sobre l'estètica artesana de Pedra Seca.
