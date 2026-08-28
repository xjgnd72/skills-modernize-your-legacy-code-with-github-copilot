'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const test = require('node:test');
const { DataProgram, Operations, formatBalance, parseAmount } = require('./index');

function createOperations(balanceCents = 100000) {
  return new Operations(new DataProgram(balanceCents));
}

function runCli(input) {
  return execFileSync(process.execPath, ['index.js'], { input, encoding: 'utf8' });
}

test('TC-001: starts with a balance of 1000.00', () => {
  assert.equal(createOperations().total(), 100000);
  assert.equal(formatBalance(createOperations().total()), '001000.00');
});

test('TC-002: exposes four menu choices', () => {
  const output = runCli('4\n');
  assert.match(output, /1\. View Balance/);
  assert.match(output, /2\. Credit Account/);
  assert.match(output, /3\. Debit Account/);
  assert.match(output, /4\. Exit/);
});

test('TC-003: viewing the balance does not change it', () => {
  const operations = createOperations();
  assert.equal(operations.total(), 100000);
  assert.equal(operations.total(), 100000);
});

test('TC-004: credits an amount and persists the new balance', () => {
  const operations = createOperations();
  assert.equal(operations.credit(25050), 125050);
  assert.equal(operations.total(), 125050);
});

test('TC-005: accumulates multiple credits', () => {
  const operations = createOperations();
  operations.credit(10000);
  operations.credit(5025);
  assert.equal(operations.total(), 115025);
});

test('TC-006: permits a debit equal to the balance', () => {
  const operations = createOperations();
  const result = operations.debit(100000);
  assert.deepEqual(result, { success: true, balanceCents: 0 });
  assert.equal(operations.total(), 0);
});

test('TC-007: permits a debit within the balance', () => {
  const result = createOperations().debit(27525);
  assert.deepEqual(result, { success: true, balanceCents: 72475 });
});

test('TC-008: rejects a debit exceeding the balance without writing', () => {
  const operations = createOperations();
  const result = operations.debit(100001);
  assert.deepEqual(result, { success: false, balanceCents: 100000 });
  assert.equal(operations.total(), 100000);
});

test('TC-009: rejects a positive debit from a zero balance', () => {
  const result = createOperations(0).debit(1);
  assert.deepEqual(result, { success: false, balanceCents: 0 });
});

test('TC-010: applies a credit followed by a debit', () => {
  const operations = createOperations();
  operations.credit(50000);
  assert.deepEqual(operations.debit(120000), { success: true, balanceCents: 30000 });
  assert.equal(operations.total(), 30000);
});

test('TC-011: identifies menu choices outside 1 through 4 as invalid', () => {
  const output = runCli('0\n4\n');
  assert.match(output, /Invalid choice, please select 1-4\./);
});

test('TC-012: recognizes choice 4 as the exit choice', () => {
  assert.match(runCli('4\n'), /Exiting the program\. Goodbye!/);
});

test('TC-013: retains changes during one application session', () => {
  const operations = createOperations();
  operations.credit(10000);
  operations.debit(2500);
  assert.equal(operations.total(), 107500);
});

test('TC-014: a new data program starts from the initial balance', () => {
  const firstRun = createOperations();
  firstRun.credit(10000);
  assert.equal(createOperations().total(), 100000);
});

test('TC-015: processes a zero credit without changing the balance', () => {
  const operations = createOperations();
  assert.equal(operations.credit(0), 100000);
  assert.equal(operations.total(), 100000);
});

test('TC-016: preserves the COBOL arithmetic behavior for a negative credit', () => {
  const operations = createOperations();
  assert.equal(operations.credit(-5000), 95000);
  assert.equal(operations.total(), 95000);
});

test('TC-017: preserves the COBOL arithmetic behavior for a negative debit', () => {
  const operations = createOperations();
  assert.deepEqual(operations.debit(-5000), { success: true, balanceCents: 105000 });
});

test('TC-018: preserves two decimal places', () => {
  const operations = createOperations();
  operations.credit(1);
  operations.debit(1);
  assert.equal(formatBalance(operations.total()), '001000.00');
});

test('TC-019: parses the maximum COBOL amount format', () => {
  assert.equal(parseAmount('999999.99'), 99999999);
});

test('TC-020: returns to the menu after each non-exit operation', () => {
  const output = runCli('1\n1\n4\n');
  assert.equal((output.match(/Account Management System/g) || []).length, 3);
  assert.equal((output.match(/Current balance: 001000\.00/g) || []).length, 2);
});