import test from 'node:test';
import assert from 'node:assert/strict';
import { registraCasosJournal } from './fixtures/revisions-editorials-realms.mjs';
registraCasosJournal(test, assert);
