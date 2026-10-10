---
type: document
status: aprovat
description: 'Requeriments del Mestre per a l''Onada 11: Construcció del Panell de Superadmin i resolució del bug de taxonomia.'
tags:
  - requeriments
visibility: private
---
# Requeriments Onada 11: Panell Superadmin i Taxonomia

Aquest document recull les directrius verbals del Mestre per a l'Onada 11 (a executar per Claude).

## 1. Bug de Taxonomia (Decisió 11 de l'Onada 8)
- **Instrucció:** El Mestre delega completament la resolució. Claude ha d'aplicar el pegat que va dissenyar per a reconciliar la taxonomia (`protocolledge.json` i `porta-plantilla-viva.mjs`) de forma transparent, sense que el Mestre haja de fer res més.

## 2. Panell de Superadministrador i Segon Factor (Decisió 12 de l'Onada 8)
El Mestre demana que Claude passe del disseny a la **implementació real**:
- **Segon Factor (2FA):** El problema de bloqueig (AAL2) exigit per Supabase s'ha de resoldre i programar al client. Claude ha d'estudiar la millor forma de fer-ho (ex: aplicació TOTP) i implementar-ho completament.
- **Usabilitat i Disseny:** El panell ha de ser altament usable. S'ha de poder accedir des del perfil de superadministrador.
- **Funcionalitat Completa:** Les cinc fases proposades per Claude s'han de construir i deixar operatives ("que las funcionalidades ya estén hechas"). El Mestre ho revisarà visualment i funcionalment quan estiga acabat, per aplicar canvis si no li agrada.

**Respostes implícites a les 5 preguntes de Claude:**
1. CSS Lliure: De moment, enfocar-se a l'editor de tokens estructurats per evitar problemes.
2. Segon Factor: El millor i més segur estàndard per a Supabase (TOTP/Autenticador).
3. Entrada: Integrat de la forma més usable (possiblement targeta "Maquinària" o pestanya).
4. El Mestre confia en el "Trellat" de Claude per prendre les decisions tècniques restants sempre que complisquen l'enxufabilitat i la Pedra Seca.
