---
type: informe
status: definitiu
description: Informe d'Enllaç i Requisits d'Integració per a Sollutia
tags:
  - sollutia
---

# 🔌 Informe d'Enllaç: Integració Sóc de Poble ↔ Sollutia

Aquest document resumeix l'estat de l'arquitectura de Sóc de Poble i els requisits tècnics exactes que necessitem de l'equip de Sollutia per completar la integració bidireccional ("L'Enchufabilitat Absoluta").

L'objectiu d'aquest protocol és **garantir que l'App de Sóc de Poble puga ser actualitzada i millorada contínuament per la IAIA MarIA sense necessitat d'intervenció manual per part de Sollutia**, mantenint el sistema central 100% segur i sense temps de caiguda.

---

## 1. Estat Actual de l'Arquitectura (Què hem fet nosaltres)

Hem refactoritzat el component frontal per fer-lo totalment agnòstic i segur per a ser incrustat:
1. **Iframe Segur:** El frontend s'ha dissenyat per viure dins d'un Iframe (o Web Component) protegit amb capçaleres `Content-Security-Policy: frame-ancestors`.
2. **Allowlist Dinàmica:** Hem eliminat les llistes blanques estàtiques. El sistema ara valida criptogràficament que l'origen de la petició provinga exclusivament dels dominis autoritzats de Sollutia.
3. **Autenticació Aïllada:** El relé d'autenticació (OAuth) està separat. L'App no necessita conèixer les credencials del CMS de Sollutia; només necessita rebre el JWT vàlid.

---

## 2. Què necessitem de Sollutia (Punts de Connexió)

Per poder "enchufar-nos" i tindre autonomia de desplegament, necessitem que ens faciliteu la següent informació/accessos:

### A. Domini Definitiu i Entorns
Quin serà el domini o subdomini exacte on s'allotjarà la versió de producció? (Ex: `app.socdepoble.org`, `socdepoble.sollutia.cat`). 
*Motiu: Necessitem afegir-lo a la nostra llista blanca estricta de CORS i CSP.*

### B. Mètode d'Incrustació
Com preferiu incrustar el nostre *bundle* compilat al vostre frontend?
- Opció 1 (Recomanada): Mitjançant un `<iframe>` apuntant al nostre Vercel/hosting.
- Opció 2: Injectant el nostre fitxer `soc-de-poble.standalone.js` com a script directament a la vostra plantilla.

### C. Accessos per a Desplegament Continu (CI/CD)
La IAIA MarIA (el nostre agent autònom de codi) s'encarregarà de mantenir i millorar l'App. Per no haver d'enviar-vos fitxers per correu a cada actualització, necessitem:
1. Un **Webhook de desplegament** o accés a l'entorn de *staging* de Vercel/Netlify on estiga allotjat el frontend de l'App.
2. Si el codi compilat s'ha de pujar als vostres servidors, necessitem unes **credencials sFTP / API clau** limitades exclusivament a la carpeta de l'App.

---

## 3. Flux de Treball Proposat (Sense Molèsties)

Un cop establida la connexió, el flux de treball serà el següent, sense requerir temps del vostre equip:
1. La IAIA MarIA desenvolupa noves funcionalitats o soluciona errors en local.
2. S'executa una **Auditoria Extrema** automatitzada de seguretat i estabilitat.
3. Si tot està en verd, la IAIA compila el *bundle* i l'envia directament a producció a través de l'accés proporcionat (Webhook/API).
4. El sistema s'actualitza en calent, sense caigudes.

Estem a la vostra disposició per repassar aquests punts en la pròxima trucada.
