---
type: informe
status: esborrany
description: Auditoria del desempat normatiu sobre encaminament, mirall de skills, estructura de la Wiki i execucio procedimental.
tags:
  - govern
  - arquitectura
---

**El meu veredicte és adoptar un registre únic amb resolutor compartit per a P1, retirar les còpies integrals del mirall dels corpus automàtics per a P2, ordenar la Wiki segons la funció dels documents per a P3 i convertir els procediments bàsics en un flux verificable per a P4.** Canviar noms o reforçar les ordres del prompt no resol, per si sol, els defectes trobats.

He llegit les auditories de Claude, de Codex i el pla provisional. Les conclusions següents provenen del contrast amb els fitxers locals. Són la proposta final de Codex per al consens, amb aprovació humana pendent.

**P1. PROTOCOLLEDGE: registre JSON únic, procediment en les skills i un mateix resolutor per a tots els consumidors.**
Claude encerta en una objecció: un JSON també es pot esborrar. Retire qualsevol justificació anterior que presente el canvi de format com una protecció contra les purgues. La protecció l’han de donar les comprovacions de dependències, integritat i migració. Però descobrir la taula Markdown mitjançant frontmatter tampoc resol el conjunt del problema:
- Matrix busca la skill retirada per una ruta literal i, més avall, torna a exigir-la pel seu nom.
- El classificador manté una altra taula i decideix mitjançant coincidències de text.
- Reflex interpreta el resultat com un fitxer situat sempre dins de plantilles.
- Hi ha un altre consumidor que construeix noms de plantilla concatenant text.
**Proposta definitiva:** `.agents/protocolledge.json` serà una peça nova que contindrà exclusivament les dades d’encaminament. Les skills conservaran les instruccions del procediment; les plantilles, l’estructura del producte; les referències, el coneixement de suport.

**P2. Mirall: retirar les còpies integrals de la Wiki recuperable i preservar l’accés humà.**
La contaminació del corpus està comprovada:
- El constructor RAG exclou `.agents` i una carpeta anomenada `mirrors`, però no `skills_mirror`.
- L’índex ja existent conté 20 documents del mirall, incloses les 4 còpies de skills retirades.
**Proposta definitiva:** Substituir el mirall integral per un catàleg generat amb nom, descripció i accés a la font canònica. Revisar que el Mestre pot obrir els enllaços, i reconstruir els índexs RAG.

**P3. Wiki: separar identitat, coneixement, recursos d’operació i estat de treball.**
`03_actuar` ja declara que ha de contindre fitxes i enllaços als executables externs.
**Proposta definitiva:**
- `.agents/`: Contracte operatiu, skills, registre d’encaminament.
- `01_ser/`: Identitat, missió i criteris humans.
- `02_saber/`: Coneixement, arquitectura i decisions raonades. Pedra Seca hi figura ací.
- `03_actuar/`: Entrada humana, catàleg d’eines i plantilles canòniques (traslladar plantilles a `03_actuar/plantilles/`).
- `04_escriptori/`: Auditories, propostes i treball pendent.

**P4. MarIA necessita menys contradiccions i una execució més comprovable.**
La meua proposta d’arquitectura procedimental és:
1. Nucli curt i coherent.
2. Encaminament explícit (el JSON).
3. Càrrega efectiva de context. (Lliurar al model la skill, plantilla i referències realment).
4. Generació guiada.
5. Validació abans del lliurament (comprovar metadades i fonts).
6. Rebut vinculat a la tasca.
7. Comprovació de la integració real.

IAIA MarIA hauria de procedir en aquest ordre: 
1. Reconciliar contradiccions. 
2. Implementar el registre compartit. 
3. Unificar càrrega i validació. 
4. Substituir el mirall. 
5. Migrar carpetes.
