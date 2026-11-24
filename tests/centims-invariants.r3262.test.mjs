import test from 'node:test';
import assert from 'node:assert/strict';
import { registraInvariantsCentims } from './fixtures/centims-invariants.r3262.mjs';
registraInvariantsCentims(test, assert);
