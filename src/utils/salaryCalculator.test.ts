import assert from 'node:assert';
import { calculateMonthlySalary, round2 } from './salaryCalculator';

console.log('--- Running Salary Calculator Unit Tests ---');

// Test 1: Sample verification specified in user prompt:
// "28 days, 662/750 contacts, 7/15 eligible JDs should give Eligible Pay 14000, Pay (JD) 3266.67 and Pay (HR) 6178.67."
const sampleResult = calculateMonthlySalary({
  eligibleDays: 28,
  dailyRate: 500,
  targetContacts: 750,
  achievedContacts: 662,
  targetJds: 15,
  totalJdsReceived: 7,
  eligibleJds: 7,
});

console.log('Sample Result:', sampleResult);

assert.strictEqual(sampleResult.totalEligiblePay, 14000, 'Eligible Pay must be 14000');
assert.strictEqual(sampleResult.payAsPerHrContactsTarget, 6178.67, 'Pay (HR) must be 6178.67');
assert.strictEqual(sampleResult.payAsPerJdTarget, 3266.67, 'Pay (JD) must be 3266.67');
assert.strictEqual(sampleResult.totalFairPay, 9445.34, 'Total Fair Pay must be 9445.34');
assert.strictEqual(sampleResult.hrContactsPct, 88.27, 'HR Contacts % must be 88.27%');
assert.strictEqual(sampleResult.eligibleJdPct, 46.67, 'Eligible JD % must be 46.67%');

// Test 2: Half days included (e.g. 27.5 days as mentioned in prompt: "pay sheet has values like 27.5")
const halfDayResult = calculateMonthlySalary({
  eligibleDays: 27.5,
  dailyRate: 500,
  targetContacts: 750,
  achievedContacts: 750,
  targetJds: 15,
  totalJdsReceived: 15,
  eligibleJds: 15,
});

assert.strictEqual(halfDayResult.totalEligiblePay, 13750, '27.5 days * 500 = 13750');
assert.strictEqual(halfDayResult.payAsPerHrContactsTarget, 6875, '100% HR Contacts = 6875');
assert.strictEqual(halfDayResult.payAsPerJdTarget, 6875, '100% Eligible JDs = 6875');
assert.strictEqual(halfDayResult.totalFairPay, 13750, 'Total Fair Pay = 13750');

// Test 3: Zero days
const zeroDaysResult = calculateMonthlySalary({
  eligibleDays: 0,
  dailyRate: 500,
  targetContacts: 750,
  achievedContacts: 200,
  targetJds: 15,
  totalJdsReceived: 2,
  eligibleJds: 2,
});

assert.strictEqual(zeroDaysResult.totalEligiblePay, 0);
assert.strictEqual(zeroDaysResult.totalFairPay, 0);

// Test 4: Configurable targets (not hardcoded 15 or 750)
const customTargetResult = calculateMonthlySalary({
  eligibleDays: 20,
  dailyRate: 600,
  targetContacts: 600,
  achievedContacts: 300,
  targetJds: 20,
  totalJdsReceived: 10,
  eligibleJds: 10,
});

assert.strictEqual(customTargetResult.totalEligiblePay, 12000);
assert.strictEqual(customTargetResult.payAsPerHrContactsTarget, 3000); // 6000 * 50%
assert.strictEqual(customTargetResult.payAsPerJdTarget, 3000); // 6000 * 50%
assert.strictEqual(customTargetResult.totalFairPay, 6000);

console.log('✓ All Salary Calculator unit tests passed successfully!');
