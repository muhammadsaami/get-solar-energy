export function calcPasswordStrength(val: string): 0 | 1 | 2 | 3 | 4 {
  let score = 0
  if (val.length >= 8) score++
  if (/[A-Z]/.test(val)) score++
  if (/[0-9]/.test(val)) score++
  if (/[^A-Za-z0-9]/.test(val)) score++
  return score as 0 | 1 | 2 | 3 | 4
}

export interface PasswordRequirement {
  key: string
  label: string
  met: boolean
}

export function getPasswordRequirements(val: string): PasswordRequirement[] {
  return [
    { key: 'length', label: '8 - 72 characters', met: val.length >= 8 && val.length <= 72 },
    { key: 'upper', label: 'At least one uppercase letter (A-Z)', met: /[A-Z]/.test(val) },
    { key: 'lower', label: 'At least one lowercase letter (a-z)', met: /[a-z]/.test(val) },
    { key: 'digit', label: 'At least one number (0-9)', met: /[0-9]/.test(val) },
    { key: 'special', label: 'At least one special character (!@#$%^&*)', met: /[!@#$%^&*(),.?":{}|<>]/.test(val) },
  ]
}
