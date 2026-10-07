/**
 * Monthly Pay Calculator Utility
 * Implements the canonical Placemein monthly salary & fair pay formula.
 *
 * Formula:
 * - Total Eligible Pay = Eligible Days × Daily Rate
 * - HR Contacts % = (Achieved Contacts / Target Contacts) × 100
 * - Total JD % = (Total JDs Received / Target JDs) × 100
 * - Eligible JD % = (Eligible JDs / Target JDs) × 100
 * - Pay as per HR Contacts Target = (Total Eligible Pay / 2) × (HR Contacts % / 100)
 * - Pay as per JD Target = (Total Eligible Pay / 2) × (Eligible JD % / 100)
 * - Total Fair Pay = Pay as per HR Contacts Target + Pay as per JD Target
 */

export interface SalaryInputs {
  /** Sum of day values (1.0 for present, 0.5 for half-day, 0 for absent) */
  eligibleDays: number;
  /** Admin-configurable daily rate, defaults to 500 */
  dailyRate?: number;
  /** Admin-configurable contacts target, defaults to 750 */
  targetContacts?: number;
  /** Contacts achieved in the month */
  achievedContacts: number;
  /** Admin-configurable target JDs, defaults to 15 */
  targetJds?: number;
  /** Total JDs received in the month */
  totalJdsReceived: number;
  /** Eligible/verified JDs in the month */
  eligibleJds: number;
}

export interface SalaryBreakdown {
  eligibleDays: number;
  dailyRate: number;
  totalEligiblePay: number;
  targetContacts: number;
  achievedContacts: number;
  hrContactsPct: number;
  targetJds: number;
  totalJdsReceived: number;
  totalJdPct: number;
  eligibleJds: number;
  eligibleJdPct: number;
  payAsPerHrContactsTarget: number;
  payAsPerJdTarget: number;
  totalFairPay: number;
  overallAchievementPct: number;
}

/** Round a number to two decimal places */
export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates monthly salary breakdown following the Placemein pay formula.
 */
export function calculateMonthlySalary(inputs: SalaryInputs): SalaryBreakdown {
  const eligibleDays = Math.max(0, inputs.eligibleDays || 0);
  const dailyRate = Math.max(0, inputs.dailyRate !== undefined ? inputs.dailyRate : 500);
  const targetContacts = Math.max(1, inputs.targetContacts !== undefined ? inputs.targetContacts : 750);
  const achievedContacts = Math.max(0, inputs.achievedContacts || 0);
  const targetJds = Math.max(1, inputs.targetJds !== undefined ? inputs.targetJds : 15);
  const totalJdsReceived = Math.max(0, inputs.totalJdsReceived || 0);
  const eligibleJds = Math.max(0, inputs.eligibleJds || 0);

  // 1. Total Eligible Pay = Eligible Days × Daily Rate
  const totalEligiblePay = round2(eligibleDays * dailyRate);

  // 2. Percentages (using configurable target values as denominators)
  const hrContactsPct = round2((achievedContacts / targetContacts) * 100);
  const totalJdPct = round2((totalJdsReceived / targetJds) * 100);
  const eligibleJdPct = round2((eligibleJds / targetJds) * 100);

  // 3. 50/50 split of Total Eligible Pay
  const halfEligiblePay = totalEligiblePay / 2;

  // Pay as per HR Contacts Target = (Total Eligible Pay / 2) × (HR Contacts % / 100)
  // Which is halfEligiblePay * (achievedContacts / targetContacts)
  const payAsPerHrContactsTarget = round2(halfEligiblePay * (achievedContacts / targetContacts));

  // Pay as per JD Target = (Total Eligible Pay / 2) × (Eligible JD % / 100)
  // Which is halfEligiblePay * (eligibleJds / targetJds)
  const payAsPerJdTarget = round2(halfEligiblePay * (eligibleJds / targetJds));

  // 4. Total Fair Pay = Pay as per HR Contacts Target + Pay as per JD Target
  const totalFairPay = round2(payAsPerHrContactsTarget + payAsPerJdTarget);

  // 5. Overall achievement percentage against Total Eligible Pay benchmark
  const overallAchievementPct = totalEligiblePay > 0
    ? round2((totalFairPay / totalEligiblePay) * 100)
    : 0;

  return {
    eligibleDays,
    dailyRate,
    totalEligiblePay,
    targetContacts,
    achievedContacts,
    hrContactsPct,
    targetJds,
    totalJdsReceived,
    totalJdPct,
    eligibleJds,
    eligibleJdPct,
    payAsPerHrContactsTarget,
    payAsPerJdTarget,
    totalFairPay,
    overallAchievementPct,
  };
}
