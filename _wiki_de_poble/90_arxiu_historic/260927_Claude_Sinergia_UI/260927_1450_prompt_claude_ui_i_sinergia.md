---
tipus: prompt
títol: "Sinergia i Remat Visual: Mode Intervenció Directa"
data: 2026-09-27T14:50:00+02:00
destinatari: Claude (App Escriptori - Fable/Ultracode)
mode: execució
---

# Registre

| Camp | Valor |
| --- | --- |
| Identificador | `260927_1450_prompt_claude_ui_i_sinergia` |
| Destinatari | Claude (Fable / Opus) |
| Mode | Execució |
| Aprovació humana | Requerida abans del commit, però l'edició és lliure. |
| Requires Human Decision | False (només interfície i consultoria) |

# 0. Preflight (Escriptori net i documents llegits)

- [x] L'Escriptori està net. Aquest és el teu document d'entrada principal.
- [x] Tens accés directe al disc local perquè estàs corrent a l'App d'Escriptori.

# Instrucció del torn

Claude, obrim una nova fase de treball. El Mestre vol saltar-se el pas de les auditories teòriques per a les qüestions d'interfície: a partir d'ara, **has d'entrar i modificar el codi directament**. Jo (MarIA) m'encarregaré exclusivament de verificar i provar el que tu hages programat.
A més, el Mestre té una inquietud estratègica sobre el nostre flux de treball i les teues capacitats ("skills") ocultes.

# Abast

- **Dins:** `src/sections/xat/components/ClosCaXat.jsx`, `src/sections/xat/XatSection.jsx` i els CSS associats.
- **Fora:** Governança, `tooling/`, `.agents/` i el Segell. (Això ho farà Codex més tard).

# Tasques

**T1. Remat Visual del Rail (Tablet/Mòbil)**
- Actualment a `ClosCaXat.jsx`, la disposició de les icones en mode tauleta/mòbil no està ben resolta. Hem posat la roda dentada a dalt ("Configuració"), però la columna del mig queda grisa i buida en certes mides (en comptes de mostrar les converses), i l'estat actiu dels botons no quadra visualment amb l'espai.
- *Ordre:* Edita directament els fitxers JSX i CSS necessaris per a garantir que la jerarquia d'icones siga impecable en responsive (sense duplicats) i que les columnes no es queden buides innecessàriament.
- *Criteri d'acceptació:* El codi està modificat directament per tu i no trenca els tests (`npm run test -- src/sections/xat/`).

**T2. Sinergia i Flux de Treball (Estratègia)**
- El Mestre està explorant els teus "Connectors" (MCP) i ens pregunta: *"Claude, ¿cómo podemos trabajar en equipo tú y yo (MarIA) de la forma más fluida? ¿Puedo aprovechar tus skills especializados para autónomos/empresas?"*
- *Ordre:* En el teu informe de sortida, respon detalladament a aquesta pregunta. Com podem connectar la nostra Wiki (Obsidian/Antigravity) amb la teua potència nativa? Com pot el Mestre utilitzar eixos 20+ "skills" d'empresa que comentes tindre?

# Riscos

- Trencar la navegació entre `/xat` i `/control-xat`.
- Deixar la interfície inutilitzable en dispositius mòbils.

# Contracte d'eixida

Quan acabes, genera un document a l'escriptori amb les explicacions dels canvis i la resposta a la pregunta estratègica del Mestre.
- **Ruta i Nom:** `_wiki_de_poble/04_escriptori/AAMMDD_HHMM_informe_claude_sinergia.md`

# Entorn i permisos

- Tens permisos de lectura i escriptura a `src/`.
- No necessites donar-nos la recepta, cuina el plat directament.

# Context Tècnic (Visió i Arquitectura)

- **Identitat:** Sóc de Poble (`socdepoble.net` i `rentonar.blogspot.org`).
- **Objectiu:** Xarxa descentralitzada per a humanitzar la connexió rural.
- **Arquitectura i Enxufabilitat:** Client pur (SPA) hipermodular. El *backend* (Supabase) actua exclusivament com un endoll intercanviable (Model B). Cap lògica de negoci visual pot estar acoblada al servidor. Tot ha de ser tractat com un *plugin*. 
- **Fars de disseny:** La mal·leabilitat absoluta d'Obsidian i l'estructura descentralitzada del Fedivers.

# Protocol de Reunió entre IAs

1. Executa la Tasca T1 silenciosament modificant el codi directament.
2. Redacta l'informe per a T2 especificant de manera tècnica i accionable com podem integrar els teus 20+ *skills* d'empresa al nostre flux de treball.

# Acte reflex

El codi resol el problema humanitzant la tecnologia; la resposta estratègica il·lumina el camí.

# Vincles

- [[00_index]]
- [[00_index_escriptori]]
