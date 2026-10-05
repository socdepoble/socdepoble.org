---
type: document
status: vigent
description: Cas d'ús de disseny per assegurar l'harmonia visual de l'AppGridShell en introduir imatges amb vores blanques
---
# Cas d'Ús: Retall d'Imatges a Sang

## Context i Problema

El disseny de Sóc de Poble i el sistema de rajoles (Pedra Seca) es basa en l'harmonia visual. L'entrada lliure d'imatges per part dels usuaris pot trencar aquest equilibri. Un dels problemes més recurrents que experimentem és la pujada d'imatges o logotips que contenen vores blanques innecessàries (fons buit voltant la figura central).

Quan aquestes imatges aterren a l'aplicació, el buit blanc al voltant destrueix la integració visual i "l'efecte a sang" de l'element dins la targeta o el panell. Sóc de Poble té un sistema de disseny estricte on els elements multimèdia han d'estar polits per no desentonar del conjunt de l'enquadrament.

## Solució: Panell de control d'imatges

Atés que no podem controlar el que cada usuari puja, l'eina (el client) ha de compensar-ho. Necessitem integrar un **script especial o panell de control d'imatges de retoc integrat** a l'eina de pujada. 

Aquest panell ha de permetre a l'usuari:
1. **Pujar l'imatge**.
2. **Retallar la imatge** directament a la interfície (eina de *crop*), permetent eliminar els marges i l'espai en blanc manualment.
3. El resultat desat serà la imatge centrada i "a sang", conservant l'harmonia estructural de Pedra Seca.

### Notes Arquitectòniques
Aquest retall s'hauria de realitzar en el costat del client abans d'enviar la imatge retallada (o els paràmetres de retall) al servidor (Sollutia), preservant l'agilitat i l'experiència d'usuari a la UI, donat que no confiem completament que el back-end ho faça perfectament segons els nostres tokens visuals.

*(Aquest cas d'ús passa a la llista d'implementacions futures pendents quan tinguem l'eina de pujada d'imatges dels usuaris plenament funcional).*
