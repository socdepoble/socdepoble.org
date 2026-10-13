---
type: document
status: esborrany
description: "Briefing sobre l'arquitectura de Partida Doble (GNU Cash) i el Pla de Comptes per a la Gestoria"
tags: [investigacio, comptabilitat, gnucash]
visibility: private
---

# Briefing: Arquitectura GNU Cash per a la Gestoria Sóc de Poble

Aquest document és el punt de partida per a la investigació profunda sobre la implementació d'un sistema de comptabilitat de **Partida Doble** inspirat en GNU Cash per a Sóc de Poble. L'objectiu definitiu (L'Estrella Polar) és aconseguir l'automatització total de la **Declaració de la Renda i models trimestrals (IVA, IRPF)** per a l'autònom.

## 1. Conceptes Bàsics de GNU Cash (Double-Entry)
Tot moviment afecta a dues caixes (comptes) diferents. L'equació comptable mestra és:
`ACTIUS (Assets) - PASSIUS (Liabilities) = EQUITAT (Equity) + (INGRESSOS (Income) - DESPESES (Expenses))`

L'enfocament per a Sóc de Poble oculta tota esta complexitat a l'usuari final gràcies a una capa d'IA que autocompleta la doble entrada només a partir dels moviments del banc i un CSV.

## 2. Esbós del Pla de Comptes (Chart of Accounts)

Un autònom barreja vida i empresa, però la comptabilitat ho separa purament:

### Actius (Assets)
Són les coses de valor que posseeixes.
- **Actius Corrents**
  - Banc: Compte Corrent Principal
  - Banc: Compte Estalvis
  - Caixa: Efectiu Llar
  - Caixa: Efectiu Empresa (Sóc de Poble)
- **Comptes a Cobrar (Accounts Receivable)**
  - Factures emeses a clients (Sollutia, ajuntaments, etc.) pendents de cobrament.

### Passius (Liabilities)
Són els deutes (el que deus).
- **Targetes de Crèdit**
  - Visa Empresa
  - Visa Personal
- **Comptes a Pagar (Accounts Payable)**
  - Proveïdors pendents (AWS, Cloudflare, subministraments).
- **Impostos a Pagar**
  - IVA Repercutit (el que has cobrat però és d'Hisenda)
  - IRPF retingut

### Ingressos (Income)
Diners que guanyes.
- **Ingressos d'Empresa**
  - Venda de Serveis
  - Venda de Productes (Bossa de tela, etc.)
- **Ingressos Personals**
  - (Si n'hi hagués externs a l'activitat autònoma).

### Despeses (Expenses)
On se'n van els diners (es destrueixen, no es transfereixen).
- **Despeses Empresa (Deduïbles)**
  - Servidors i Dominis (AWS, Hostinger)
  - Maquinària (Ordinadors)
  - Gestoria (Quota mensual)
  - Desplaçaments (Gasolina percentual si s'aplica)
- **Despeses Llar (No Deduïbles)**
  - Menjar (Supermercat)
  - Subministraments (Llum, Aigua, Lowi)
  - Oci i Restauració

### Equitat (Equity)
El valor net de l'empresa / fons personals. S'utilitza per quadrar balanços a l'inici del sistema (Balanços d'Obertura).

## 3. Pròxims Passos (Caçera de Skills)

Aquests són els primers jaciments a analitzar per al tractor `wiki-busca-skills`:
- **[Paperasse (GitHub)](https://github.com/romainsimon/paperasse)**: *Skills* per a agents IA especialitzats en la burocràcia francesa (Comptable, Notari). Conté exemples vitals d'abstracció i processament de documents fiscals per a LLMs.
- **[Kimi.ai: Financial Modeling Skills for Agents](https://www.kimi.ai/es-419/resources/financial-modeling-skills-for-agents)**: Documentació i patrons d'intel·ligència financera per capacitar a la IA en la presa de decisions econòmiques.

**Objectius de la recerca:**
- Trobar un format JSON/YAML òptim per definir aquest *Chart of Accounts* i l'avaluador automàtic de Dèbit/Crèdit per a LLMs (Claude/GPT).
- Dissenyar l'algoritme on, en pujar el CSV, la IA converteix "Pagament Supermercat 30€" en:
  - Dèbit: Despeses Llar (Supermercat) +30€
  - Crèdit: Actius (Banc Corrent) -30€
