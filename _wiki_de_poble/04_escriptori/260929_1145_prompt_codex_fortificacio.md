---
type: prompt
status: esborrany
description: Prompt per a Codex
tags:
  - govern
visibility: private
reflex: sdp:torn_b46d0134-3956-41ff-b71e-300f7d0459b6:b710a0a5-6739-469c-910d-034545eecf79
---
# Fortificació i Enxufabilitat Sollutia

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

Context llegit i assimilat. La plantilla està preparada per a ser executada per Codex a l'entorn local. Les incidències (T1-T5) i la petició d'automillora (T6) estan documentades.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_b46d0134-3956-41ff-b71e-300f7d0459b6:b710a0a5-6739-469c-910d-034545eecf79 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-29T09:45:33.952Z |
| Modificació | 2026-09-29T09:45:33.952Z |
| Propietari | MarIA |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.1.0) |
| Model IA | Codex (ChatGPT Pro) |
| Tokens consumits | Mesura no disponible |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-09-29T09:45:33.952Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION prompt.local.s3 -->
## Context Tècnic i Arquitectònic

Llegiu obligatòriament els següents fitxers abans d'actuar: `AGENTS.md`, `_wiki_de_poble/01_ser/02_genotip.md`, `_wiki_de_poble/00_index.md`, i `taxonomia_documental.md`.

**Visió i Identitat:**
- Objectiu: Xarxa descentralitzada per a connectivitat rural (`socdepoble.org`). Protecció contra obsolescència i dependència tecnològica. La descentralització definitiva arribarà a nivell de clonació de sistemes simplement llegint l'HTML, de forma completament hiperenxufable i modular.
- Llegat: 30 anys d'activisme rural ininterromput, herència directa de `socdepoble.net` i `rentonar.blogspot.com`. No som una startup, som la continuació d'una lluita històrica.

**Directrius Arquitectòniques (Innegociables):**
- **Hipermodularitat i Enxufabilitat:** La plataforma és un client pur (SPA) altament desacoblat. 
- **Backend Intercanviable (Model B):** El servidor actual (Supabase) funciona exclusivament com un endoll. Cap lògica de negoci de la UI ha d'estar fortament acoblada a ell. El sistema ha de poder enxufar-se com a mòdul a WordPress o Joomla sense trencar res.
- **Visió de futur:** Evolució cap al **Fedivers** i App Nadiua (offline-first). El model de mal·leabilitat i independència a seguir és **Obsidian**.
- Tot el codi produït ha de respectar aquesta estricta modularitat i independència del proveïdor.

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

Ets el director d'enginyeria per al projecte Sóc de Poble (executant-te en l'entorn de Codex).
Acabem de finalitzar l'Onada Final d'UX del Xat (T61-T71). Ara que la interfície és calcada a la de WhatsApp, el repte crític d'aquest torn és **Fortificar el Sistema i garantir l'Enxufabilitat (Plug-and-play)** abans de tancar el lliurament definitiu a Sollutia. A més a més, has de resoldre unes quantes fallades greus de xarxa i usabilitat que el Mestre acaba de detectar provant l'aplicació en local.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1 (Migracions SQL):** Aplica en l'entorn local les migracions SQL pendents (`2609281500_lema_entradilla_256.sql`, `2609282035_perfil_emoticona.sql` i `2609282100_xat_de_pagina.sql`).
- **T2 (Auditoria d'Enxufabilitat):** Audita els nous components del Xat, Comunitats i Perfil per garantir el Model B. Identifica i refactoritza qualsevol crida directa a Supabase des de la UI cap al `hostAdapter`.
- **T3 (Traduccions i Hardcodes):** Revisa i consolida les traduccions de les claus noves del Xat (es, en, eu, gl).
- **T4 (Deute Tècnic Residual i Auth):** 
  - Afegeix la lògica perquè la baixa d'un compte retire també el seu `icon` i `copyright`.
  - **Login amb Google Trencat:** El backend retorna `Unsupported provider: provider is not enabled`. Activa el proveïdor a `supabase/config.toml`.
- **T5 (Incidències UX Urgents):**
  - **Cercador del Xat (Nova Conversa):** La cerca d'usuaris no retorna res. A més, quan està buit, han d'aparéixer exclusivament **"Sóc de Poble"** i **"IAIA MarIA"**. Qualsevol altre usuari només ha d'aparéixer si es busca explícitament.
  - **Focus retallat al cercador:** Quan fas clic al camp de text "Nom del contacte" dins del diàleg de Nova Conversa, la vora de focus (el "filet") es veu retallada, com si faltara `padding` o `margin` per deixar respirar l'outline/box-shadow. A més, el Mestre prefereix que eixa vora de focus no siga tan completament negra, sinó un gris o to més suau i elegant (ajusta-ho al teu criteri de disseny Pedra Seca).
  - **Jerarquia Editorial al Registre:** A la pàgina de registre/login (`/registre`), hi ha un text que diu "Entra per a participar. A l'interior podràs configurar la teua identitat i gestionar grups o empreses." Això incompleix el disseny editorial: "Entra per a participar." ha de ser un `<h2 className="... (o la teua classe equivalent Pedra Seca)">`, i la resta ha de quedar com a entradeta o paràgraf descriptiu normal baix de l'H2.
  - **Pàgina de Mercat:** Actualment carrega la capçalera però la llista de productes no funciona.
  - **Operativitat del Xat:** El Mestre reporta que el xat "encara no és operatiu". Revisa per què no es poden enviar/rebre missatges.
- **T6 (Automillora Proactiva - Tractor Cognitiu):** La IAIA MarIA ha comès un error greu en la preparació d'aquest torn: s'ha saltat l'ús del `document.mjs create` per estalviar temps i ha generat arxius manuals mutilats que han fet saltar els hooks de validació (`tancament.mjs`). Has de proposar una millora o una regla pel seu tractor cognitiu per garantir que **MAI** torne a saltar-se les plantilles, assegurant-te que s'integre bé al nostre sistema i mètode de treball. Això ho has de deixar documentat en el teu informe final.

### Criteris d’acceptació i reproducció
- La suite de tests local ha de continuar verda.
- El codi de la UI ha d'estar completament aïllat de Supabase.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- En aplicar les migracions i la refactorització de contractes, podrien aflorar tests romputs relacionats amb l'autenticació o l'enxufabilitat en temps real. Corregiu-los mantenint el contracte.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 2c61fed71fa2ec7ecda2e7a2854b390169ecb762f1625422c2627001ea561a8c. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
