---
type: plantilla
status: actiu
description: Plantilla per a desat i avaluació d'auditories o respostes del Consell d'IA.
tags:
  - maquina
---

<!-- SDP:EIXIDA
type: informe
status: esborrany
description: "<12-220 caràcters: què estudia i amb quines fonts>"
tags: [consell]
-->
<!-- Nom en disc ha de seguir OBLIGATÒRIAMENT: YYMMDD_HHMM_estudi_[nom_ia].md -->
# 🧠 ESTUDI D'IA: [Nom de la IA] - {{DATA_I_HORA}}

## 1. Verbatim (La Petorreta Original)
*(Ací va el text íntegre, sense tocar una coma, que ha produït la IA)*

## 2. Avaluació DAFO
- **(F) Fortaleses:** *(En què l'ha encertat de ple?)*
- **(D) Debilitats:** *(Ocultació, pèrdua de to, fallades tècniques evidents?)*
- **(A) Amenaces:** *(Risc d'aplicar-ho sense més? Destrueix alguna llei de Pedra Seca?)*
- **(O) Oportunitats:** *(Hi ha alguna idea lateral genial per aprofitar?)*

## 3. Matriu d'Urgència i Importància
- **Urgent i Important:** 
- **Important però No Urgent:** 
- **Urgent però No Important:** 
- **No Urgent i No Important:** 



## Generació amb contracte executable

La ruta `estudi_ia` de `.agents/protocolledge.json` defineix les seccions obligatòries. El bloc SDP:EIXIDA és l’exemple de metadades; la resta d’aquesta plantilla és context de redacció. Usa `document.mjs context` per rebre la plantilla i el rebut persistent, i `document.mjs create` per preparar el document amb totes les seccions. No copies el frontmatter de la plantilla com si fora el del fill.
