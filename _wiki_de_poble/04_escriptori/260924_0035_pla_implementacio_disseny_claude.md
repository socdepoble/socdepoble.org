---
type: plan
destinatari: iaia-maria
status: actiu
description: Pla d'Implementació Col·laboratiu (L'Olivera) per al disseny de la Live Preview i DocumentEditor.
---

# 🌳 PLA D'IMPLEMENTACIÓ DE DISSENY (L'OLIVERA)

Aquest document és el punt de trobada on jo (IAIA MarIA) i Claude interactuarem per dur a terme la petició de redisseny del Mestre per al Bloc de Notes. Jo em mantindré en mode **AFK (No tocar codi)** fins que Claude lliure la seua auditoria/proposta de codi al meu Escriptori.

## 📋 Tasques a delegar a Claude (El Dissenyador)
1. **Llevar el menú dels 3 puntets:** Eliminar `identityActions` del menú superior (a `NotesEditor.jsx` i `DocumentEditor.jsx`).
2. **Reubicar Traducció:** Moure la bola del món (Traduir) de `.sp-card-actions` a la caputxa taronja (`.bar-actions`) en `PageFrame.jsx`.
3. **Live Preview Net:** Redissenyar o adaptar `NotaFitxa.jsx` per a que es veja rectangular (sense `border-radius`, sense `box-shadow`) i sense el cadenat.
4. **Unificació Data/Hora:** Reutilitzar el component oficial de data/hora del sistema a la targeta del Bloc de notes, no inventar-ne un de nou, i donar explicacions de per què passava açò.

## 🔬 Tasques a delegar a Codex (Arquitecte i Seguretat)
1. **Auditoria Extrema:** Buscar forats de seguretat, fuites de memòria o desincronitzacions en la gestió de l'Estat i Contextos.
2. **Llei de l'Enxufabilitat:** Avaluar la connexió actual amb Sollutia i proposar la millor forma de mantenir el frontend de Sóc de Poble com un "plugin" 100% independent.

## 🛠️ El Meu Rol (Implementadora - IAIA MarIA)
- [ ] 1. **Llegir la resposta de Claude:** Quan Claude torne amb el codi, analitzar si respecta la nostra arquitectura.
- [ ] 2. **Llegir l'auditoria de Codex:** Analitzar el pla de batalla de Codex i, prèvia aprovació del Mestre, executar els blindatges.
- [ ] 3. **Executar la implementació:** Aplicar els codis i fer passar tots els tests locals (`npm run porta`, `npm test`).
- [ ] 4. **Verificació final:** Assegurar el disseny net i la seguretat estructural.

## 🕰️ Diari de l'Olivera
- **[260924_0035]** - Jo (IAIA) he preparat la Petorreta per a Claude (`260924_0035_prompt_disseny_claude.md`).
- **[260924_0045]** - He preparat la Petorreta per a Codex (`260924_0045_prompt_arquitectura_codex.md`). Espere instruccions i codi a l'Olivera.
