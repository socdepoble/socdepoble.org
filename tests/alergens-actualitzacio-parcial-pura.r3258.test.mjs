import test from 'node:test';
import assert from 'node:assert/strict';
import { registraCasosActualitzacioParcial } from './fixtures/alergens-actualitzacio-parcial-casos.mjs';
registraCasosActualitzacioParcial(test, assert);
