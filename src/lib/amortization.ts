export interface AmortizationEntry {
  installmentNo: number;
  dueDate: Date;
  paymentAmount: number;
  principalAmount: number;
  interestAmount: number;
  balanceAfter: number;
}

/**
 * Generate a full amortization schedule using the standard reducing balance formula.
 * M = P × [r(1+r)^n] / [(1+r)^n – 1]
 */
export function generateAmortizationSchedule(params: {
  principal: number;
  annualRate: number; // e.g. 12.5 for 12.5%
  termMonths: number;
  startDate: Date;
}): AmortizationEntry[] {
  const { principal, annualRate, termMonths, startDate } = params;

  const monthlyRate = annualRate / 100 / 12;

  let monthlyPayment: number;

  if (monthlyRate === 0) {
    monthlyPayment = principal / termMonths;
  } else {
    const factor = Math.pow(1 + monthlyRate, termMonths);
    monthlyPayment = principal * (monthlyRate * factor) / (factor - 1);
  }

  const schedule: AmortizationEntry[] = [];
  let remainingBalance = principal;

  for (let i = 1; i <= termMonths; i++) {
    const interestPayment = remainingBalance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    remainingBalance = Math.max(0, remainingBalance - principalPayment);

    // Due date is i months after start date
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    schedule.push({
      installmentNo: i,
      dueDate,
      paymentAmount: Math.round(monthlyPayment * 100) / 100,
      principalAmount: Math.round(principalPayment * 100) / 100,
      interestAmount: Math.round(interestPayment * 100) / 100,
      balanceAfter: Math.round(remainingBalance * 100) / 100,
    });
  }

  return schedule;
}

/**
 * Calculate the total payable amount over the life of the loan.
 */
export function calculateTotalPayable(params: {
  principal: number;
  annualRate: number;
  termMonths: number;
}): number {
  const schedule = generateAmortizationSchedule({
    ...params,
    startDate: new Date(),
  });
  return schedule.reduce((sum, entry) => sum + entry.paymentAmount, 0);
}

/**
 * Calculate monthly payment only.
 */
export function calculateMonthlyPayment(params: {
  principal: number;
  annualRate: number;
  termMonths: number;
}): number {
  const { principal, annualRate, termMonths } = params;
  const monthlyRate = annualRate / 100 / 12;

  if (monthlyRate === 0) {
    return principal / termMonths;
  }

  const factor = Math.pow(1 + monthlyRate, termMonths);
  return Math.round(principal * (monthlyRate * factor) / (factor - 1) * 100) / 100;
}
