// @vitest-environment node
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { registraInvariantsCentims } from '../../../../tests/fixtures/centims-invariants.r3262.mjs';
registraInvariantsCentims(test, assert);
