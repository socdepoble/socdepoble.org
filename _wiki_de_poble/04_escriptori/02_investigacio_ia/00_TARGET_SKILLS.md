---
type: directori
status: viu
description: Directori de Cacera per a l'Explorador d'IA. Llista de desitjos de noves skills a buscar.
---

# 🎯 Directori de Cacera (Target Skills)

Aquest és el llistat oficial de necessitats funcionals que tenim per al sistema **Sóc de Poble**. Abans de programar des de zero qualsevol d'aquestes funcions genèriques, l'agent té la missió d'anar a GitHub, `skills.rest`, i altres biblioteques globals per trobar la millor implementació i adaptar-la.

## Llista de Desitjos Activa

- [ ] **Consola de Mesura de l'IA (Dashboard d'Auditoria):**
  - **Descripció:** El Mestre ha demanat tindre un Panell de Control (`Control Panel`) on pugam recollir i mostrar visualment "les nostres pròpies mesures" (rendiment, auditories de l'IA, mètriques d'estat intern).
  - **Motiu:** Es necessita un panell base per a utilitats horitzontals. Volem trobar si existeix algun patró o *skill* ja inventada sobre com estructurar *Dashboards* d'Avaluació Tècnica per a sistemes IA de manera neta.

- [ ] **Skill d'Accessibilitat (a11y):**
  - **Descripció:** Una skill que, en passar-se abans de fer un *commit*, revise la UI per garantir que passa validacions WCAG (Contrast, ARIA labels, teclejat correcte).
  - **Motiu:** L'avantguarda ja té centenars de bots només dedicats a l'a11y.

- [ ] **Skill de Copywriting i Narrativa de Poble:**
  - **Descripció:** Més enllà del codi, volem educar una part de la memòria per quan hàgem de generar textos de difusió o continguts culturals, emprant el llenguatge del Trellat de forma estandarditzada.

- [ ] **Agent/MCP Lector de Notícies RSS (Curation AI):**
  - **Descripció:** Una utilitat que permeta als usuaris llegir els seus feeds RSS favorits centralitzats a Sóc de Poble. La IA tindria la capacitat (si l'usuari ho demana) de llegir els articles, resumir-los un a un o fer un resum executiu diari.
  - **Motiu:** L'usuari ha demanat recuperar la màgia dels RSS afegint-hi la potència d'un agent resumidor.

- [ ] **Graf de Coneixement estil Obsidian (Node Graph):**
  - **Descripció:** Recuperar la vista de la web antiga on es podien veure tots els nodes, categories i etiquetes relacionats visualment com un cervell.
  - **Motiu:** Una eina visual de navegació potent per a la base de coneixement, programada per al futur (post-Sollutia).
  
## Com funciona aquest document?
Quan un usuari desitja una nova funcionalitat complexa (ex: *Una gestoria en 2 hores*), en comptes d'anar i trencar el codi base, s'anota ací. La fundació (`pedra-seca` i arquitectura) s'afiança primer. Després, quan el ciment està sec, la `skill-busca-skills` llig açò i va de cacera per tornar amb la solució.
