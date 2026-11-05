import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  annualToMonthlyRate,
  calculate,
  futureValue,
  normalizeInput,
  simulate,
  toYearly,
  validate,
} from '../js/calculator.js';
import { parseNumber } from '../js/format.js';

const close = (actual, expected, eps = 1e-6) =>
  assert.ok(Math.abs(actual - expected) < eps, `${actual} ≉ ${expected}`);

test('taxa anual de 12% equivale a ~0,9489% ao mês', () => {
  close(annualToMonthlyRate(0.12), 0.00948879293, 1e-10);
  close(Math.pow(1 + annualToMonthlyRate(0.12), 12), 1.12);
});

test('normalizeInput converte unidades', () => {
  assert.deepEqual(normalizeInput({ rate: 1, rateUnit: 'mensal', period: 2, periodUnit: 'anos' }), {
    monthlyRate: 0.01,
    months: 24,
  });
});

test('simulação mês a mês bate com a fórmula fechada', () => {
  const rows = simulate(1000, 500, 0.01, 120);
  close(rows.at(-1).balance, futureValue(1000, 500, 0.01, 120), 1e-6);
  close(rows.at(-1).invested, 1000 + 500 * 120);
});

test('juros de 1% a.m. sobre R$ 1.000 por 12 meses sem aportes', () => {
  const r = calculate({ initial: 1000, monthly: 0, rate: 1, rateUnit: 'mensal', period: 12, periodUnit: 'meses' });
  close(r.finalBalance, 1126.825030131969, 1e-9);
  close(r.totalInterest, r.finalBalance - r.totalInvested, 1e-9);
});

test('taxa zero só soma os aportes', () => {
  const r = calculate({ initial: 100, monthly: 10, rate: 0, rateUnit: 'anual', period: 1, periodUnit: 'anos' });
  assert.equal(r.finalBalance, 220);
  assert.equal(r.totalInterest, 0);
});

test('toYearly agrupa anos completos e o mês final parcial', () => {
  const rows = simulate(1000, 100, 0.01, 30);
  const yearly = toYearly(rows);
  assert.deepEqual(yearly.map((y) => y.year), [1, 2, 3]);
  assert.equal(yearly.at(-1).month, 30);
  const sumInterest = yearly.reduce((s, y) => s + y.interest, 0);
  close(sumInterest, rows.at(-1).totalInterest);
});

test('validate rejeita entradas inválidas', () => {
  const ok = { initial: 1000, monthly: 0, rate: 10, period: 10, periodUnit: 'anos' };
  assert.deepEqual(validate(ok), {});
  assert.ok(validate({ ...ok, initial: NaN }).initial);
  assert.ok(validate({ ...ok, initial: -1 }).initial);
  assert.ok(validate({ ...ok, initial: 0, monthly: 0 }).initial);
  assert.ok(validate({ ...ok, rate: -2 }).rate);
  assert.ok(validate({ ...ok, period: 0 }).period);
  assert.ok(validate({ ...ok, period: 1.5, periodUnit: 'meses' }).period);
  assert.ok(validate({ ...ok, period: 101 }).period);
  assert.deepEqual(validate({ ...ok, period: 1.5 }), {}); // 18 meses
});

test('parseNumber entende o formato brasileiro', () => {
  assert.equal(parseNumber('1.234,56'), 1234.56);
  assert.equal(parseNumber('R$ 1.000'), 1000);
  assert.equal(parseNumber('1.000.000'), 1000000);
  assert.equal(parseNumber('10,5'), 10.5);
  assert.equal(parseNumber('0.5'), 0.5);
  assert.equal(parseNumber(''), 0);
  assert.ok(Number.isNaN(parseNumber('abc')));
  assert.ok(Number.isNaN(parseNumber('1,2,3')));
});
