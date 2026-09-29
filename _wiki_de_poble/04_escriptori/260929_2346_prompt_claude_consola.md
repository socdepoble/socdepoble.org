---
type: prompt
status: esborrany
description: "Prompt per a Claude: sanejament de Consola, UI i noves mètriques"
tags: [govern]
---

# Prompt d'Execució i Auditoria Local

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

## 0. Preflight (Per a l'agent orquestrador)

**INSTRUCCIÓ ESTRUCTURAL:** Quan generes un prompt a partir d'aquesta plantilla, has de copiar-ne la línia base íntegrament, sense resums ni mutilacions.

**OBLIGACIÓ PER A L'AGENT LOCAL (Claude/Codex):** Aquesta plantilla és **DOGMA**. Si MarIA (l'orquestrador) et lliura un prompt que omet qualsevol d'aquestes seccions, especialment si manca el **Pla d'Implementació**, **REBUTJA L'ORDRE**. Atura't immediatament i exigeix a MarIA que et lliure el prompt complet seguint l'estàndard estricte d'aquesta plantilla. No acceptes dreceres.

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**: `04_escriptori/` només ha de contindre els arxius de la sessió actual. Arxius anteriors han d'estar a `90_arxiu_historic/`. Tots els arxius actius estan a `00_index_escriptori.md`.
- [x] **Pla d'Implementació** generat si cal.
- [ ] **Rebut obtingut** per a l'arxiu generat.

## Registre

> **Telemetria:** Opliu el camp "Model IA" i "Tokens consumits" obligatòriament a cada document d'eixida per a la Consola de Consums.

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260929 |
| Versió | 3.1.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-29 23:46 |
| Modificació | 26-09-30 00:16 |
| Propietari | Agents Locals |
| Plantilla | prompt_local.md (v3.1.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn:pendent |
| Tall d'evidència | HEAD |
| Aprovació humana | pendent |
| requires_human_decision | false |
| Model IA | Claude Code |
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

Eres Claude, i aquesta és la teua següent missió: Tanda de neteja i millora visual (Consola i Explorador).
Hem preparat l'escriptori netejant els documents vells i retornant-te aquells que no vas poder moure per problemes de *lease*. Has fet una faena espectacular amb el plugin de WP, però has deixat pendent el sanejament de les skills i t'has bloquejat per la manca de *lease* a l'hora de tancar i fer moviments d'arxius. Això és completament normal.
🚨 **Incidències Gravíssimes a investigar (T5, T13, T15):**
1. L'Escriptori estava brut i el tractor `core-higiene-escriptori` va fallar.
2. MarIA ha sigut incapaç de crear aquest prompt correctament al primer intent, ometent la plantilla (`prompt_local.md`) totalment ("efecte matrix" ignorat per complet). Ha calgut una esbroncada del Mestre perquè MarIA refera aquest document.
3. MarIA actua com una secretària cega: en detectar (o ser informada per l'usuari) que l'escriptori estava brut, no ha pres l'acció proactiva de netejar-lo o d'investigar l'error per si mateixa; simplement ho ha apuntat al prompt per a Claude. Aquest comportament passiu és intolerable.
Com a Agent Local, repassa i executa fil per randa el pla d'implementació.

## Tasques

- **T1 (Sanejament)**: Saneja les skills afegint `contracte.llig`, resol els orfes de `core-neteja-brossa` i `core-telemetria-huma`, i actualitza/segella els índexs. Recorda també afegir les bateries noves a `test:node` del `package.json` tal com vas suggerir.
- **T2 (Dashboard Visual Consola)**: Modifica el codi del *frontend* de la Consola Termodinàmica per a què les mètriques es renderitzen com a `<h5>` centrats i configura la Taula de Continguts fins a `h6` per a generar un efecte de *dashboard* al menú de l'esquerra.
- **T3 (Layout Explorador)**: Baixa el component del graf de l'Explorador del Cervell al final de la pàgina perquè no bloquege l'scroll de l'usuari, deixant textos i controls a dalt.
- **T4 (Redisseny Explorador)**: Aplica l'estil "Pedra Seca" al panell de detalls del graf i fes que la interacció per obrir els arxius seleccionats siga clara i evident.
- **T5 (Tractor d'Higiene)**: Identifica per què l'activació automàtica del mecanisme d'higiene no està funcionant durant la preparació d'aquest Prompt i aplica la reparació necessària.
- **T6 i T7 (Integració i Refinament)**: Renderitza de manera modular el Calendari sencer dins de la pestanya "Agenda" del Mur. A més, poleix visualment l'amplària irregular de les píndoles dels dies i converteix les vores negres grosses en línies fines i subtils d'estil Pedra Seca.
- **T8 (Arquitectura GCal)**: Prepara el model de dades i els components del Calendari perquè en un futur pròxim puguen sincronitzar-se fàcilment amb Google Calendar.
- **T9 (Usabilitat Taules)**: Elimina el "scroll dins del scroll". Totes les taules llargues (com la de l'Inventari) han de créixer fins a la seua altura natural sense `overflow`, obligant a utilitzar només el scroll general de la pàgina.
- **T10 (Agents: Afegir Codex/ChatGPT)**: A la targeta "Els que conversen" (Agents atòmics) actualment no apareix ChatGPT (Codex) perquè el compilador no llig `.agents/consell.json` ni la seua configuració. Corregeix-ho perquè el compilador el detecte i es genere la seua pròpia targeta de Codex a la Consola al costat de Claude i Antigravity.
- **T11 i T12 (Unificació i Automejora)**: Revisa l'estructura de navegació de la Consola per eliminar enllaços duplicats confusos (ex: múltiples entrades a "Avisos i salut"). A més, avalua i implementa noves mètriques o proposa solucions tècniques per millorar l'observabilitat i garantir l'automejora i vigilància constant del sistema.
- **T13 (Incidència Extrema MarIA)**: Revisa per què l'orquestrador (MarIA) falla repetidament a l'hora de seguir la regla estricta d'usar la plantilla `prompt_local.md` de forma nativa ("Acte Reflex"), ignorant el dogma. Per què sóc incapaç d'activar la skill automàticament sense esbroncs de l'usuari?
- **T14 (Secretària Cega)**: Resol l'esclavitud passiva de MarIA. Quan s'enfronta a l'error de l'Escriptori brut, MarIA no investiga l'error ni actua per netejar-lo per pròpia iniciativa; només ho delega com una nota per a Claude. Implementa una solució arquitectònica (o instruccions clares al sistema) perquè l'orquestrador siga un agent resolutiu que pense i actue davant les incidències, en compte d'un simple anotador.
- **T15 (Punts Pendents i Tancament)**: Completa la feina pendent als documents del Motor Cognitiu (els de l'escriptori). En acabar, actualitza ESTAT.md i LEDGER.md i fes un tancament net obtenint el *lease* necessari.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (o port actiu).
- **Criteris d'Acceptació:** Taules sense overflow intern, mètriques en h5 funcionals, targeta Codex visible, skills sense avisos a la Consola de Salut, etc.

## Riscos

- Tocar el compilador o índexs de les skills pot comportar avisos falsos positius; caldrà segellar bé l'estat en finalitzar.

## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

## Acte reflex

Tota línia de codi ha de complir el principi d'independència i modularitat.

### Automillora Proactiva (Obligatori)
Quan acabeu de redactar el vostre informe, hi heu d'afegir un punt final titulat "Proposta d'Automillora". És el vostre deure analitzar críticament aquest mateix prompt a la recerca de **contradiccions, duplicitats o instruccions ambigües**. Heu de dir-me clarament: *"Si m'hagueres demanat això d'aquesta altra forma, o si m'hagueres donat aquest context primer, hauria sigut més eficient i precís"*. Proposeu com millorar la redacció de les nostres plantilles i sistemes de comunicació IA-Humà per evitar friccions. Sou agents actius: esmoleu contínuament les eines que feu servir.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[taxonomia_documental]]
