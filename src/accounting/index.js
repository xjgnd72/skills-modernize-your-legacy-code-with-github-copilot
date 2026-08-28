'use strict';

const readline = require('readline');

const INITIAL_BALANCE_CENTS = 100000;
const MAX_BALANCE_CENTS = 99999999;

class DataProgram {
  constructor(initialBalanceCents = INITIAL_BALANCE_CENTS) {
    this.storageBalanceCents = initialBalanceCents;
  }

  read() {
    return this.storageBalanceCents;
  }

  write(balanceCents) {
    this.storageBalanceCents = balanceCents;
  }
}

class Operations {
  constructor(dataProgram = new DataProgram()) {
    this.dataProgram = dataProgram;
  }

  total() {
    return this.dataProgram.read();
  }

  credit(amountCents) {
    const currentBalanceCents = this.dataProgram.read();
    const newBalanceCents = currentBalanceCents + amountCents;
    this.dataProgram.write(newBalanceCents);
    return newBalanceCents;
  }

  debit(amountCents) {
    const currentBalanceCents = this.dataProgram.read();
    if (currentBalanceCents < amountCents) {
      return { success: false, balanceCents: currentBalanceCents };
    }

    const newBalanceCents = currentBalanceCents - amountCents;
    this.dataProgram.write(newBalanceCents);
    return { success: true, balanceCents: newBalanceCents };
  }
}

function formatBalance(balanceCents) {
  return (balanceCents / 100).toFixed(2).padStart(9, '0');
}

function parseAmount(input) {
  if (!/^\d+(\.\d{1,2})?$/.test(input.trim())) {
    return null;
  }

  const [wholePart, fractionalPart = ''] = input.trim().split('.');
  return Number(wholePart) * 100 + Number(fractionalPart.padEnd(2, '0'));
}

function displayMenu(output) {
  output('--------------------------------');
  output('Account Management System');
  output('1. View Balance');
  output('2. Credit Account');
  output('3. Debit Account');
  output('4. Exit');
  output('--------------------------------');
  output('Enter your choice (1-4): ');
}

function runApplication(input = process.stdin, output = console.log) {
  const operations = new Operations();
  const interfaceInstance = readline.createInterface({ input, output: process.stdout });
  let pendingAmountOperation = null;

  function promptForAmount(operation) {
    const label = operation === 'credit' ? 'credit' : 'debit';
    output(`Enter ${label} amount: `);
    pendingAmountOperation = operation;
  }

  function handleChoice(choice) {
    if (pendingAmountOperation !== null) {
      const operation = pendingAmountOperation;
      pendingAmountOperation = null;
      const amountCents = parseAmount(choice);
      if (amountCents === null || amountCents > MAX_BALANCE_CENTS) {
        output('Invalid amount. Please enter a valid amount.');
        displayMenu(output);
        return;
      }

      if (operation === 'credit') {
        const balanceCents = operations.credit(amountCents);
        output(`Amount credited. New balance: ${formatBalance(balanceCents)}`);
      } else {
        const result = operations.debit(amountCents);
        if (result.success) {
          output(`Amount debited. New balance: ${formatBalance(result.balanceCents)}`);
        } else {
          output('Insufficient funds for this debit.');
        }
      }
      displayMenu(output);
      return;
    }

    if (choice === '1') {
      output(`Current balance: ${formatBalance(operations.total())}`);
      displayMenu(output);
    } else if (choice === '2') {
      promptForAmount('credit');
    } else if (choice === '3') {
      promptForAmount('debit');
    } else if (choice === '4') {
      output('Exiting the program. Goodbye!');
      interfaceInstance.close();
    } else {
      output('Invalid choice, please select 1-4.');
      displayMenu(output);
    }
  }

  interfaceInstance.on('line', (line) => handleChoice(line.trim()));
  displayMenu(output);
  return interfaceInstance;
}

if (require.main === module) {
  runApplication();
}

module.exports = {
  DataProgram,
  Operations,
  formatBalance,
  parseAmount,
  runApplication,
};