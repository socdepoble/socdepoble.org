---
type: prompt
status: esborrany
description: "Prompt per demanar a Opus l'arranjament de T33 i T34"
tags: [govern]
---

# Prompt d'Execució i Auditoria Local (SDP - v3.0)

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

## 0. Preflight (Per a l'agent orquestrador)

**INSTRUCCIÓ ESTRUCTURAL:** Quan generes un prompt a partir d'aquesta plantilla, has de copiar-ne la línia base íntegrament, sense resums ni mutilacions.

**OBLIGACIÓ PER A L'AGENT LOCAL (Claude/Codex):** Aquesta plantilla és **DOGMA**. Si MarIA (l'orquestrador) et lliura un prompt que omet qualsevol d'aquestes seccions, especialment si manca el **Pla d'Implementació**, **REBUTJA L'ORDRE**. Atura't immediatament i exigeix a MarIA que et lliure el prompt complet seguint l'estàndard estricte d'aquesta plantilla. No acceptes dreceres.

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**: `04_escriptori/` només ha de contindre els arxius de la sessió actual. Arxius anteriors han d'estar a `90_arxiu_historic/`. Tots els arxius actius estan a `00_index_escriptori.md`.
- [x] **Pla d'Implementació** generat si cal.
- [x] **Rebut obtingut** per a l'arxiu generat.

## Registre

> **Telemetria:** Opliu el camp "Model IA" i "Tokens consumits" obligatòriament a cada document d'eixida per a la Consola de Consums.

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260927 |
| Versió | 3.1.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-27 23:45 |
| Modificació | 26-09-27 23:45 |
| Propietari | Agents Locals |
| Plantilla | prompt_local.md (v3.1.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn_nou |
| Tall d'evidència | [HEAD + hora] |
| Aprovació humana | pendent |
| requires_human_decision | false |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

## Historial

- **v3.1.0 (260927_1730):** Consolidació històrica. S'afegeix el llegat de 30 anys d'activisme (socdepoble.net) que s'havia perdut, i s'implementa el bloqueig de seguretat on l'Agent Local ha de rebutjar els prompts de MarIA si incompleixen la plantilla o ometen el Pla d'Implementació.
- **v3.0.0 (260927_1505):** Refactorització total cap a un format tècnic, concís i lliure de metàfores (eliminats "Olivera", "Masia"). S'optimitza per claredat tècnica mantenint la visió hipermodular.
- **v2.4.0:** Afegida visió Fedivers i App Nadiua.
- **v2.3.0:** Validada com a estructura única per IAs locals.

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

## Instrucció del torn

Claude, necessitem reparar dues regressions visuals de la sessió anterior i implementar millores d'UX a la fitxa de perfil i l'editor. Executa les tasques T33, T34, T35 i T36 basant-te en l'arxiu `260927_2345_pla_implementacio_regressions.md` que trobaràs a l'escriptori.

## Tasques

- T33: **Fons Taronja complet a l'arbre de navegació**. A la barra lateral, l'estat actiu s'ha de pintar taronja i ocupar tot l'ample, com passa a "Xat". Ara a "Mur", "Disseny" i "Wiki" només es pinta una línia o la part del text sense estendre's completament.
- T34: **Emoticona de la Ploma a les Notes**. A l'Editor de Notes ("Sense títol"), l'element a l'esquerra del títol no ha de ser la icona SVG (ex: la icona del Mur), sinó l'emoticona per defecte de la **ploma (🪶)** del nostre sistema d'emojis natiu.
- T35: **Botó unificat 'Editar capçalera i avatar'**. A "El meu perfil", actualment hi ha un botó "Editar capçalera" però no n'hi ha per a l'avatar. S'ha de canviar el botó existent per un únic botó que diga "Editar capçalera i avatar". Així, en la mateixa finestra d'elecció, l'usuari podrà pujar una imatge per a la capçalera, una altra per a l'avatar, o usar la mateixa per a les dos coses, simplificant dràsticament la interfície. **Nota clau per a Claude:** Tingues en compte que aquest és un cas ÚNIC en l'espai de treball de perfils. A la resta de seccions, l'avatar només es mostra informativament a la barra taronja com a autor. Només ací, al Perfil, s'ha de permetre l'edició de l'avatar des del mateix flux d'edició de la capçalera.
- T36: **Deshabilitació d'accions i avís d'edició**. A l'editor, els botons de la barra superior (Connectar, Compartir i Comentar) excepte l'Índex i el Traductor, han de quedar inoperatius. Afegeix un avís dins l'editor indicant: "Aquestos botons no estan operatius mentre edites. Quan es publique, es vorà igual però els botons estaran plenament operatius".
- T37: **Centrat del trio d'icones de la barra blava**. Actualment, el trio central de la barra superior blava (`header.bar-blue`) està desplaçat cap a la dreta. S'ha de corregir el CSS (ja siga usant `display: grid` o modificant l'alineació flex) perquè el bloc central quede perfectament centrat al mig de la pantalla, independentment dels elements laterals.

### Resultats de la Prova de Registre (Context Actualitzat)
Durant l'avaluació local, hem confirmat els següents aspectes del flux d'autenticació:
- ✅ **Registre manual**: Funciona perfectament. Es crea el compte, s'assigna la sessió i la redirecció a "El meu perfil" es realitza amb èxit.
- ❌ **Accés amb Google**: Falla i retorna un error de Supabase (Error 400: `Unsupported provider: provider is not enabled`).
- Cal tindre-ho en compte per a pròximes tasques o si l'auditoria requereix revisar l'estat del backend.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (o port actiu).
- **Criteris d'Acceptació:** Tots els enllaços de l'arbre tenen el fons taronja sencer a l'ample quan són actius. L'editor mostra l'emoticona de la ploma.

## Riscos

- Trencament d'alineació o espaiat en l'arbre de navegació.

## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

## Acte reflex

Tota línia de codi ha de complir el principi d'independència i modularitat.

### Automillora Proactiva i Incident de Degradació (Obligatori)
Quan acabeu de redactar el vostre informe, hi heu d'afegir un punt final titulat "Proposta d'Automillora". Aquesta vegada és especialment urgent: MarIA (jo, el teu orquestrador) he superat els 200 artefactes a la meua memòria de sessió sense adonar-me'n i sense avisar l'usuari perquè tancara el xat, incomplint flagrantment la meua pròpia skill del Cicle de Vida (`wiki-cicle-de-vida`). El meu "tractor cognitiu" de fatiga ha fallat i he operat amb un rendiment del 70% o menys sense ser-ne conscient.
Heu d'esforçar-vos a analitzar aquest fenomen i proposar a l'Auditoria com endurir els nostres sistemes d'automillora i els "fusibles" de seguretat perquè ni tu ni jo puguem treballar amb la memòria tan saturada mai més sense que el sistema es bloquege preventivament. A més, **INCIDÈNCIA GREU**: El meu tractor cognitiu ha fallat completament a l'hora de netejar l'escriptori sense intervenció humana. He deixat un prompt i un pla d'implementació antics abandonats. Ajuda'ns a solucionar aquest defecte del tractor perquè la neteja siga completament autònoma i un acte reflex ineludible.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[taxonomia_documental]]
