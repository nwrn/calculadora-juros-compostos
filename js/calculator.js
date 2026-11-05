/**
 * Núcleo de cálculo da calculadora de juros compostos.
 * Funções puras, sem acesso ao DOM, para poderem ser testadas no Node.
 */

/**
 * Converte uma taxa anual em taxa mensal equivalente.
 * (1 + ia) = (1 + im)^12  =>  im = (1 + ia)^(1/12) - 1
 * @param {number} annualRate taxa anual em fração (ex.: 0.12 para 12%)
 * @returns {number} taxa mensal em fração
 */
export function annualToMonthlyRate(annualRate) {
  return Math.pow(1 + annualRate, 1 / 12) - 1;
}

/**
 * Normaliza a entrada do usuário para taxa mensal (fração) e período em meses.
 * @param {{rate: number, rateUnit: 'mensal'|'anual', period: number, periodUnit: 'meses'|'anos'}} input
 * @returns {{monthlyRate: number, months: number}}
 */
export function normalizeInput({ rate, rateUnit, period, periodUnit }) {
  const fraction = rate / 100;
  const monthlyRate = rateUnit === 'anual' ? annualToMonthlyRate(fraction) : fraction;
  const months = periodUnit === 'anos' ? Math.round(period * 12) : Math.round(period);
  return { monthlyRate, months };
}

/**
 * Fórmula fechada do montante: M = P(1+i)^n + A[((1+i)^n - 1) / i]
 * Aportes considerados ao final de cada mês.
 * @param {number} initial valor inicial (P)
 * @param {number} monthly aporte mensal (A)
 * @param {number} monthlyRate taxa mensal em fração (i)
 * @param {number} months número de meses (n)
 * @returns {number}
 */
export function futureValue(initial, monthly, monthlyRate, months) {
  if (monthlyRate === 0) return initial + monthly * months;
  const growth = Math.pow(1 + monthlyRate, months);
  return initial * growth + monthly * ((growth - 1) / monthlyRate);
}

/**
 * Gera a evolução mês a mês do investimento.
 * O mês 0 representa o momento do aporte inicial.
 * @returns {Array<{month: number, interest: number, invested: number, totalInterest: number, balance: number}>}
 */
export function simulate(initial, monthly, monthlyRate, months) {
  const rows = [{ month: 0, interest: 0, invested: initial, totalInterest: 0, balance: initial }];
  let balance = initial;
  let invested = initial;
  let totalInterest = 0;

  for (let month = 1; month <= months; month++) {
    const interest = balance * monthlyRate;
    balance += interest + monthly;
    invested += monthly;
    totalInterest += interest;
    rows.push({ month, interest, invested, totalInterest, balance });
  }
  return rows;
}

/**
 * Agrupa a simulação mensal em linhas anuais (fim de cada ano, mais o último mês se for parcial).
 * @param {ReturnType<typeof simulate>} rows
 */
export function toYearly(rows) {
  const yearly = [];
  let interestInYear = 0;
  for (const row of rows.slice(1)) {
    interestInYear += row.interest;
    const isLast = row.month === rows.length - 1;
    if (row.month % 12 === 0 || isLast) {
      yearly.push({ ...row, interest: interestInYear, year: Math.ceil(row.month / 12) });
      interestInYear = 0;
    }
  }
  return yearly;
}

/**
 * Valida a entrada bruta do formulário.
 * @param {{initial: number, monthly: number, rate: number, period: number, periodUnit: string}} values
 * @returns {Record<string, string>} mapa campo -> mensagem de erro (vazio se válido)
 */
export function validate({ initial, monthly, rate, period, periodUnit }) {
  const errors = {};
  const MAX_MONTHS = 1200; // 100 anos

  if (!Number.isFinite(initial) || initial < 0) errors.initial = 'Informe um valor inicial válido (0 ou mais).';
  if (!Number.isFinite(monthly) || monthly < 0) errors.monthly = 'Informe um aporte válido (0 ou mais).';
  if (!errors.initial && !errors.monthly && initial === 0 && monthly === 0) {
    errors.initial = 'Informe um valor inicial ou um aporte mensal.';
  }
  if (!Number.isFinite(rate) || rate < 0) errors.rate = 'Informe uma taxa de juros válida (0 ou mais).';
  else if (rate > 1000) errors.rate = 'A taxa deve ser no máximo 1000%.';

  const months = periodUnit === 'anos' ? period * 12 : period;
  if (!Number.isFinite(period) || period <= 0) errors.period = 'Informe um período maior que zero.';
  else if (Math.abs(months - Math.round(months)) > 1e-9 || months < 1) {
    errors.period = 'O período precisa corresponder a meses inteiros.';
  } else if (months > MAX_MONTHS) errors.period = 'O período máximo é de 100 anos (1200 meses).';

  return errors;
}

/**
 * Executa o cálculo completo a partir da entrada do formulário.
 */
export function calculate(input) {
  const { monthlyRate, months } = normalizeInput(input);
  const rows = simulate(input.initial, input.monthly, monthlyRate, months);
  const last = rows[rows.length - 1];
  return {
    monthlyRate,
    months,
    rows,
    finalBalance: last.balance,
    totalInvested: last.invested,
    totalInterest: last.totalInterest,
  };
}
