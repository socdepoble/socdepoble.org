// @vitest-environment node
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { registraCasosActualitzacioParcial } from '../../../tests/fixtures/alergens-actualitzacio-parcial-casos.mjs';
registraCasosActualitzacioParcial(test, assert);
