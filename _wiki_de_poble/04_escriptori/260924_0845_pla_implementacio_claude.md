---
type: document
status: esborrany
description: Pla d'implementació conjunt de l'Olivera on es delega l'autoritat d'escriptura a Claude per aplicar tots els pedaços pendents (P2 a P16) de la 0754.
tags:
  - treball
---

# Pla d'Implementació Conjunt (Olivera) - 260924_0845

Aquest Pla d'Implementació és el resultat de la sessió de refinament matinal del 26 de setembre de 2024.
Després d'una onada forta on la IAIA MarIA ha sanejat íntegrament l'Arquitectura Visual i el Panell Crom (R1-R5 del document 0825), ara entra Claude en escena.

## Objectius de la Sessió per a Claude
L'autoritat (el Mestre) ha estipulat que l'actuació de Claude no serà d'Auditor AFK: s'encarrega com a **"Obrero de paleta i hormigonera"**. La seva responsabilitat abasta:

1. **Reparació Estructural Notes (GlobalSaveManager)**:
   - Reparar l'anomalia `_baseRevision` que permetia sobrescriure dades remotes noves amb esborranys asíncrons antics.
   - Injectar el "Toast" (notificació UI) per a preguntar a l'usuari quina decisió vol prendre abans d'efectuar un sobrescrit cec (Pedaços D01).
2. **Defectes Addicionals i a11y (Pedaços P2-P16)**:
   - Assumir l'escriptura dels problemes d'accessibilitat detectats prèviament.
   - Qualsevol altra incidència reportada a l'auditoria 0754 ha de quedar incorporada a la base de codi vigent.
3. **Mantenir la Llei del Trellat**:
   - Claude té llibertat d'edició ("todo lo que me dices que está por arreglar y mucho más"). Si detectes imperfeccions arquitectòniques obvies mentre apedaçes el codi de Notes, resol-les de seguida amb codi net.
4. **Verificació Final**:
   - Qualsevol canvi en el codi ha de garantir que Vitest (`npm test`) continua validant correctament la salut del sistema.

**Nota d'Estat**: L'Escriptori de la IAIA queda lliure de vells informes, tot allò processat resideix a l'Arxiu Històric per donar espai a l'estudi de Claude. Aquest document serveix d'acta per a quan desperte Claude.
