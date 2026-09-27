---
type: prompt
status: esborrany
description: "Prompt per a Claude per fixar l'alineació CSS del rail del Xat."
tags: [govern]
---

# Prompt d'Execució i Auditoria Local (SDP - v3.0)

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

## 0. Preflight (Per a l'agent orquestrador)

**INSTRUCCIÓ ESTRUCTURAL:** Quan generes un prompt a partir d'aquesta plantilla, has de copiar-ne la línia base íntegrament, sense resums ni mutilacions.

**OBLIGACIÓ PER A L'AGENT LOCAL (Claude/Codex):** Aquesta plantilla és **DOGMA**. Si MarIA (l'orquestrador) et lliura un prompt que omet qualsevol d'aquestes seccions, especialment si manca el **Pla d'Implementació**, **REBUTJA L'ORDRE**. Atura't immediatament i exigeix a MarIA que et lliure el prompt complet seguint l'estàndard estricte d'aquesta plantilla. No acceptes dreceres.

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**
- [x] **Pla d'Implementació** generat si cal.
- [ ] **Rebut obtingut** per a l'arxiu generat.

## Registre

> **Telemetria:** Opliu el camp "Model IA" i "Tokens consumits" obligatòriament a cada document d'eixida per a la Consola de Consums.

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260927 |
| Versió | 3.1.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-27 18:50 |
| Modificació | 26-09-27 18:50 |
| Propietari | Agents Locals |
| Plantilla | prompt_local.md (v3.1.0) |
| Ruta | prompt.local |
| Rebut | [pendent d'emetre] |
| Tall d'evidència | HEAD actiu |
| Aprovació humana | aprovat |
| requires_human_decision | false |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

## Historial

- **v3.1.0 (260927_1730):** Consolidació històrica. S'afegeix el llegat de 30 anys d'activisme (socdepoble.net) que s'havia perdut, i s'implementa el bloqueig de seguretat on l'Agent Local ha de rebutjar els prompts de MarIA si incompleixen la plantilla o ometen el Pla d'Implementació.

## Context Tècnic i Arquitectònic

Llegiu obligatòriament els següents fitxers abans d'actuar: `AGENTS.md`, `_wiki_de_poble/01_ser/02_genotip.md`, `_wiki_de_poble/00_index.md`, i `taxonomia_documental.md`.

**Visió i Identitat:**
- Objectiu: Xarxa descentralitzada per a connectivitat rural (`socdepoble.org`). Protecció contra obsolescència i dependència tecnològica. La descentralització definitiva arribarà a nivell de clonació de sistemes simplement llegint l'HTML.
- Llegat: 30 anys d'activisme rural ininterromput, herència directa de `socdepoble.net` i `rentonar.blogspot.com`. No som una startup, som la continuació d'una lluita històrica.

**Directrius Arquitectòniques (Innegociables):**
- **Hipermodularitat i Enxufabilitat:** La plataforma és un client pur (SPA) altament desacoblat. 
- **Backend Intercanviable (Model B):** El servidor actual (Supabase) funciona exclusivament com un endoll. Cap lògica de negoci de la UI ha d'estar fortament acoblada a ell. El sistema ha de poder enxufar-se com a mòdul a WordPress o Joomla sense trencar res.
- **Visió de futur:** Evolució cap al **Fedivers** i App Nadiua (offline-first). El model de mal·leabilitat i independència a seguir és **Obsidian**.
- Tot el codi produït ha de respectar aquesta estricta modularitat i independència del proveïdor.

## Instrucció del torn

Hola Claude! El Mestre ha aprovat els canvis estructurals del rail de `ClosCaXat.jsx` de l'anterior torn, on hem inclòs les sis entrades calcant l'estructura de WhatsApp per a Mac. Tot això ja està al codi.

Tanmateix, tenim un problema de CSS i alineació de la graella. El Mestre ens ha assenyalat: "Una graella ben quadrada és qüestió de principis fonamentals i més si és el menú principal." 

L'objectiu principal és revisar l'alineació del CSS i el botó a la barra lateral de `ClosCaXat`. S'ha de netejar el marge perquè Xat i Control facen pinya i unificarem els comportaments d'espaiat per tenir una sensació visual neta i robusta, exactament com un full de càlcul. Llegeix el pla a `_wiki_de_poble/04_escriptori/260927_1850_pla_implementacio_claude.md`.

## Tasques

- T1: Analitzar i corregir els marges interns i externs (`margin`, `padding`) i el `gap` a l'interior del component `ClosCaXat.jsx` (o `.css`) i assegurar-se que els ítems queden perfectament quadrats.
- T2: Quadratura i Pinya: Alinear correctament la icona de la roda dentada a la capçalera de "Menú" amb la resta de botons. Assegurar que els botons comparteixen les mateixes mides.
- T3: Validar que no hi ha desquadraments globals en obrir Novetats (el panell Control).
- T4: La plana `ConnectarSection.jsx` té ara l'estructura correcta de la V2 (la caixa principal, privacitat, etiquetes), però utilitza un fitxer CSS inventat i no usa l'embolcall de Sóc de Poble. Has d'eliminar l'ús de `ConnectarSection.css`, emprar el component `<UniversalPage>` com a base (com sempre), i aplicar purament l'estil de la Pedra Seca (classes `poble-*` o `sdp-*`) perquè el disseny quede exactament igual d'espectacular que a producció.


### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340/xat`
- **Criteris d'Acceptació:** 
  1. El rail i el component queden visualment coherents sense errors de margins que destrueixen l'efecte "pinya".
  2. Les proves continuen passant (72 de 72).

## Riscos

- Tocar marges globals pot afectar a altres mòduls que pengen de l'`AppGridShell`. Si cal, aplica l'estil de forma confinada.

## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

## Acte reflex

Tota línia de codi ha de complir el principi d'independència i modularitat.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[taxonomia_documental]]

### Automillora Proactiva (Obligatori)
Quan acabeu de redactar el vostre informe, hi heu d'afegir un punt final titulat "Proposta d'Automillora". Heu de proposar com millorar aquest mateix prompt, les nostres plantilles o els nostres sistemes de comunicació IA-Humà per tal d'evitar friccions innecessàries i accelerar el flux de treball. Sou agents proactius: heu d'esforçar-vos en arreglar i esmolar les vostres pròpies eines, no només llegir-les passivament.
