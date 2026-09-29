/**
 * Phone Validator for CRA Working Sheet
 *
 * Rules:
 * 1. Phone field is optional at lead creation (NULL/empty allowed, no default).
 * 2. Validate ONLY if user enters something.
 * 3. Validates 10-digit Indian mobile number (optionally prefixed with +91, 91, or 0).
 * 4. Shows an inline error for invalid input, never auto-corrects to a fake number.
 */

export interface PhoneValidationResult {
  valid: boolean;
  normalized?: string;
  error?: string;
}

export const validateIndianMobile = (phoneInput?: string | null): PhoneValidationResult => {
  if (!phoneInput) {
    return { valid: true, normalized: undefined };
  }

  const trimmed = phoneInput.trim();
  if (trimmed === '') {
    return { valid: true, normalized: undefined };
  }

  // Remove spaces, hyphens, periods, parentheses
  const cleaned = trimmed.replace(/[\s\-\.\(\)]/g, '');

  // Must match standard 10-digit Indian mobile numbers starting with 6, 7, 8, or 9
  const match = cleaned.match(/^(?:\+91|91|0)?([6-9]\d{9})$/);

  if (!match) {
    return {
      valid: false,
      error: 'Invalid phone: Must be a genuine 10-digit Indian mobile number starting with 6, 7, 8, or 9 (e.g. 9876543210 or +91 98765 43210).',
    };
  }

  const digits = match[1];
  // Format as readable Indian mobile: "+91 XXXXX XXXXX"
  const formatted = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;

  return {
    valid: true,
    normalized: formatted,
  };
};
