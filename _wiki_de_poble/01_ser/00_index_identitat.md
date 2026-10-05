---
type: index
status: canonic
description: Mapa de les huit dimensions de la Wiki sobre les sis carpetes vigents i llista dels documents troncals que expliquen qui és Sóc de Poble.
tags:
  - core
  - genoma
  - identitat
---
# Índex d'identitat

Porta d'entrada a la identitat de Sóc de Poble. Penja de l'índex mestre i reunix en una pàgina on viu cada dimensió de la Wiki i quins documents troncals expliquen qui som.

## 🔗 Índexs Connectats (Xarxa Neuronal)
- [[00_index]] (Índex Principal)

## Huit dimensions sobre sis carpetes

El registre executable és `.agents/cervell.json`. No es reanomenen carpetes.

| Dimensió | Ruta vigent | Funció |
| --- | --- | --- |
| Identitat | `01_ser/` | Missió, llengua i cultura |
| Coneixement | `02_saber/` | Arquitectura i criteris consultius |
| Governança | `AGENTS.md` i `.agents/` | Autoritat amb abast explícit |
| Procediments | `.agents/skills/` i `tooling/` | Passos executables |
| Plantilles | `03_actuar/plantilles/` | Contractes de generació |
| Treball actiu | `04_escriptori/` | Documents en revisió |
| Evidència | `10_actes/` i `.agents/runtime/` | Actes, torns i contractes |
| Història | `90_arxiu_historic/` | Memòria consultiva fora de RAG automàtic |

## Documents Troncals

- [[01_identitat]]
- [[02_genotip]]
- [[el_projecte]]
- [[soci_sollutia]]
- [[01_trellat]]
- [[doc_governanca]]
- [[00_arquitectura_tecnica_unificada]]
- [[sistema_immunitari]]
- [[02_saber/03_consola_termodinamica/00_portada|Consola Termodinàmica]]
- [[doc_logos_oficials]]
- [[doc_taula_mestra]]
- [[anatomia_cognitiva]]
- [[antigravity]]
- [[connectors_mcp_disseny]]
- [[identitat_visual]]
- [[perfil_psiquiatric]]

`00_bios.md` és una redirecció històrica i `[[forja_to_core]]` una proposta
futura; no són punts d'arrencada ni gates actius.

## Regla

Usa el mapa anterior i el router documental; mantín identificador, procedència i enllaços quan canvie el cicle de vida.

## Estat mecànic

L’estat del graf no es manté en una llista manual: el calculen les portes del teixit (`npm run porta:llaurador`, `npm run porta:teixit`, `npm run porta:scc` i `npm run porta:orfandat`). El criteri de salut és zero orfes, zero enllaços penjats i zero ambigüitats dins de les àrees operatives; l'arxiu, els mirrors i els vendors es reporten per separat.

## Vincles

- [[00_index]]
- [[memoria_aprenentatges]]
