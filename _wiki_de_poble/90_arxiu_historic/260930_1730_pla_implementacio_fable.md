---
type: document
status: actiu
description: Pla d'implementació UI WhatsApp Clone i Flux d'Usuari
tags:
  - implementacio
visibility: private
reflex: sdp:torn_75cf1a7a-e87f-474e-8e65-036838f7cc9f:29a94bce-2dfa-4943-92fd-11196744316d
---
# UI WhatsApp i Registre

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_75cf1a7a-e87f-474e-8e65-036838f7cc9f:29a94bce-2dfa-4943-92fd-11196744316d |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-30T15:32:17.757Z |
| Modificació | 2026-09-30T15:32:17.757Z |
| Propietari | agent-local |
| Aprovació humana | aprovada |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | iaia-maria (gemini) |
| Tokens consumits | N/A |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 30f1b3310dd558c625a0cef2562b28ee8f08351afd719136367464a3b12aff38. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-09-30T15:32:17.757Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

S'implementarà l'arquitectura de la UI dissenyada per Fable (estil WhatsApp). El verb universal és **"Connectar"**. Tot element connectat aterra per defecte en una "Safata d'Entrada" des d'on l'usuari pot organitzar-lo (pura lògica Obsidian). S'implementarà el flux d'idioma i el procés de registre d'usuari (Sollutia/Supabase) des de la SPA.

### 1. Context i Troballes (Research)
L'auditoria de Fable (`260930_1550_auditoria_claude.md`) defineix el mapa de ports i la barra mòbil. Codex ha validat l'enxufabilitat en WordPress. L'aplicació actual està trencada (Mur, Mercat donen ERR_CONNECTION_REFUSED) perquè la UI antiga intenta connectar amb rutes obsoletes.

### 2. Preguntes Obertes (User Review Required)
Cap. Les 17 decisions de Fable han estat resoltes pel Mestre.
- **D1 (Verb):** El verb universal és "Connectar", i els elements aterrissen a la "Safata d'Entrada" (Bloc de Notes).
- **D3 (Botó central):** És l'accés al "Panell de Control" (`/control`), on resideixen les funcionalitats avançades (Llibreria, etc.).
- **D4 (Edició de guardats):** L'element connectat a la Safata d'Entrada **és editable**. Actua com una còpia local (snippet) on l'usuari pot escriure, demanar a la IA que ho formategi (H1, H2, entradeta) o republicar-ho. S'ha de tindre en compte la procedència: si s'importa un enllaç amb Copyright, s'ha d'avisar l'usuari i facilitar l'atribució original si decideix republicar-ho.
- **D7 (Avisos i General):** El canal "Avisos" és unidireccional (només administradors, sense feedback). El canal "General" només s'activarà si hi ha moderació activa.
- **D17 (Telefonades):** No s'eliminarà. Es manté a la interfície, però al clicar-hi mostrarà un missatge transparent explicant que és un projecte lliure CC i que la funció s'activarà quan hi haja finançament per a mantindre-la.
- **D9 (Comentar):** Obri per defecte un xat privat amb l'autor. Si l'autor ha habilitat un grup de debat per a eixa publicació, es mostrarà un pas intermedi permetent triar entre privat o grup públic.
- **D8 (Aterratge extern):** El destí de l'aterratge quan s'arriba des de fora és la pàgina del poble, no el xat.
- **D10 (Compartir natiu):** S'implementarà la funció nativa del mòbil (Share API) tot i el possible xoc inicial amb WP.
- **D13 (Domini):** L'estructura d'URLs públiques d'usuari serà a l'arrel: `/[usuari]`. Un usuari és global i pot pertànyer a diversos pobles (comunitats).
- **D15 (Llicència):** CC No Comercial per defecte. S'afegeix opció final "Copyright (C)" amb camp lliure de 256 caràcters.
- **D16 (Novetats):** S'amaga per simplificar la UI.
- **D18 (Comunitat del Poble):** La URL d'un poble (ex: `/la-torre-de-les-macanes`) NO mostra els xats privats. Mostra la "Comunitat" d'eixe poble: una vista amb el Grup General ancorat a dalt i subgrups temàtics davall (ex: "Walapop Torruano", "Compartir Cotxe"). Això separa l'esfera pública de la privada.

### 3. Canvis Proposats (Proposed Changes)

### [Acció: MODIFY] `src/css/modules.css` o `src/index.css`
Ajustar la barra de navegació mòbil encabint els botons principals: Xat, Mur, Botó Central (Control), Pobles, Mercat i Telefonades.

### [Acció: MODIFY] `src/App.jsx` i components
Netejar les crides a DB trencades (Mur, Mercat). Implementar la lògica de "Connectar" cap a una Safata d'Entrada.

### [Acció: MODIFY] `src/components/...`
Forçar que el Valencià siga l'idioma estàndard a l'arrencada.

### [Acció: NEW / MODIFY] Flux d'Autenticació (Sollutia/Supabase)
Muntar el component de registre/login ("Connectar-se a Sóc de Poble") per als betatesters.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

Carregar `http://localhost:8881/pedra-seca-demo/`. Confirmar que desapareix el 404/ERR_CONNECTION_REFUSED i que el formulari de registre/login apareix de forma nativa.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

Dependència excessiva en Supabase al flux de registre. Cal usar els ports establerts en l'arquitectura.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
