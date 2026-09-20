---
type: document
status: canonic
description: Descriu la forja tècnica de la PWA i les decisions d'arquitectura del projecte.
tags:
  - saber
---
# La Forja de la PWA i la seua Arquitectura (Volum II)
**Categoria:** Arquitectura
**Data:** 2026-06-19
**Hora:** 14:30

---

## Més enllà de la Web Tradicional
Quan pensem en una pàgina web, normalment imaginem l'aparador d'una botiga. Passes per davant, demanes què vols veure i el dependent —el servidor— ho busca al magatzem. Si cau la connexió, l'aparador pot quedar apagat.

[[el_projecte|Sóc de Poble]] és una aplicació React/Vite preparada com a PWA. La baseline inclou peces locals i fallback, però encara no disposa d'una certificació funcional que permeta dir que tota l'aplicació és Online-First o opera completament sense xarxa.

## L'ofici de Forjar un Poble
L'arquitectura es descriu amb tres peces principals:

### 1. El Reactor: React i Vite
Són els motors de construcció actuals. Vite empaqueta els arxius i React permet compondre interfícies reutilitzables. La seua presència és una decisió tècnica revisable, no la identitat del projecte.

### 2. El Disseny de la Plaça: GEM MODERN
La direcció visual busca calidesa, llegibilitat i espai. Tailwind existix a la pila com a bastida condicionada; segons ESTANDARD_Pedra_Seca, no és la marca ni la font de veritat visual, que continua en tokens i CSS revisables.

### 3. Les Llavors de les Dades: estat verificable
El codi declara Dexie i modes `seed`, `local`, `hybrid` i Supabase. Això aporta adaptadors i fallback, però no prova que totes les operacions productives persistisquen primer en IndexedDB. Cada flux ha d'indicar quin backend usa, què ocorre sense xarxa i com recupera les dades abans de promocionar-lo a Online-First.

## L'Instint de Supervivència (Service Workers)
La configuració PWA pot emmagatzemar l'esquelet estàtic mitjançant un Service Worker. Això no garantix per si sol que missatges, publicacions o accions dinàmiques funcionen offline. El veredicte per flux només pot passar de «preparat» a «verificat» amb proves d'arrancada sense xarxa, lectura, escriptura, cua, reconnexió i recuperació en els dispositius suportats.

---


**Ancoratge de Seguretat:** [[00_index]]

