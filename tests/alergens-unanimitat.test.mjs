import test from 'node:test';
import assert from 'node:assert/strict';
import { registraCasosUnanimitat } from './fixtures/alergens-unanimitat-casos.mjs';
registraCasosUnanimitat(test, assert);
