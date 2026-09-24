#!/usr/bin/env node

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Ús: node crear_document.mjs <RutaRelativa> <Títol> [Autor]");
  process.exit(1);
}

const [relPath, title] = args;
const root = process.cwd();
const fullPath = join(root, relPath);

const content = `---
type: document
status: esborrany
description: "Descripció breu del document"
tags: []
---

# ${title}

> **Anclatge de Seguretat**: Aquest document està ancorat a l'índex central [[00_INDEX_ESCRIPTORI]] / [[00_index]] per evitar l'orfenesa i garantir la consciència de la IA en futures auditories.

[INSERIU EL CONTINGUT ACÍ]
`;

mkdirSync(dirname(fullPath), { recursive: true });
writeFileSync(fullPath, content, 'utf-8');

console.log(`✅ Document plantillat i ancorat de seguretat creat amb èxit a: ${relPath}`);
