import { test } from 'vitest';
import assert from 'node:assert/strict';
import { registraCasosUnanimitat } from '../../../tests/fixtures/alergens-unanimitat-casos.mjs';
registraCasosUnanimitat(test, assert);
