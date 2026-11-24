// @vitest-environment node
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { registraCasosJournal } from '../../tests/fixtures/revisions-editorials-realms.mjs';
registraCasosJournal(test, assert);
