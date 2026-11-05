/**
 * Ponto de entrada: liga o formulário ao cálculo, ao gráfico e à tabela.
 */
import { calculate, validate } from './calculator.js';
import { createChart } from './chart.js';
import { formatCurrency, formatPercent, parseNumber } from './format.js';
import { renderTable } from './table.js';

const form = document.getElementById('calc-form');
const tableBody = document.getElementById('table-body');
const periodHeader = document.getElementById('col-period');
const output = {
  final: document.getElementById('out-final'),
  invested: document.getElementById('out-invested'),
  interest: document.getElementById('out-interest'),
  note: document.getElementById('out-note'),
};
const chart = createChart(document.getElementById('chart'));
const FIELDS = ['initial', 'monthly', 'rate', 'period'];

let lastResult = null;

function readForm() {
  const data = new FormData(form);
  return {
    initial: parseNumber(data.get('initial')),
    monthly: parseNumber(data.get('monthly')),
    rate: parseNumber(data.get('rate')),
    rateUnit: data.get('rateUnit'),
    period: parseNumber(data.get('period')),
    periodUnit: data.get('periodUnit'),
  };
}

function showErrors(errors) {
  for (const name of FIELDS) {
    const input = form.elements[name];
    const message = errors[name] ?? '';
    document.getElementById(`${name}-error`).textContent = message;
    input.setAttribute('aria-invalid', String(Boolean(message)));
    input.closest('.input-group').dataset.invalid = String(Boolean(message));
  }
}

function tableMode() {
  return form.ownerDocument.querySelector('input[name="tableMode"]:checked').value;
}

function run({ focusOnError = false } = {}) {
  const input = readForm();
  const errors = validate(input);
  showErrors(errors);

  const firstInvalid = FIELDS.find((name) => errors[name]);
  if (firstInvalid) {
    if (focusOnError) form.elements[firstInvalid].focus();
    return;
  }

  const result = calculate(input);
  lastResult = result;

  output.final.textContent = formatCurrency(result.finalBalance);
  output.invested.textContent = formatCurrency(result.totalInvested);
  output.interest.textContent = formatCurrency(result.totalInterest);
  output.note.textContent =
    `Taxa mensal equivalente: ${formatPercent(result.monthlyRate * 100)} · ` +
    `${result.months} ${result.months === 1 ? 'mês' : 'meses'} de investimento.`;

  chart.update(result.rows);
  renderTable(tableBody, periodHeader, result.rows, tableMode());
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  run({ focusOnError: true });
});

// Recalcula ao trocar unidades (selects) para feedback imediato.
form.addEventListener('change', (event) => {
  if (event.target.tagName === 'SELECT') run();
});

// Reset limpa os campos de texto (em vez de voltar aos valores de exemplo).
form.addEventListener('reset', (event) => {
  event.preventDefault();
  for (const name of FIELDS) form.elements[name].value = '';
  showErrors({});
  form.elements.initial.focus();
});

document.querySelectorAll('input[name="tableMode"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    if (lastResult) renderTable(tableBody, periodHeader, lastResult.rows, tableMode());
  });
});

run();
