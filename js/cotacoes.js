import { renderHistoryChart } from './chart-cotacao.js';
import { loadFundamentals } from './fundamentals.js';

const API_BASE = 'http://localhost:8080';

const form = document.getElementById('cotacao-form');
const tickerInput = document.getElementById('ticker');
const tickerGroup = document.getElementById('ticker-group');
const tickerError = document.getElementById('ticker-error');
const assetTypeSelect = document.getElementById('assetType');
const buscarBtn = document.getElementById('buscar-btn');
const resultadoConteudo = document.getElementById('resultado-conteudo');
const graficoWrap = document.getElementById('grafico-wrap');

const SOURCE_LABEL = { YAHOO_FINANCE: 'Yahoo Finance', FUNDAMENTUS: 'Fundamentus' };
const RANGES = ['1m', '3m', '6m', '1y', '5y'];
const RANGE_LABEL = { '1m': '1M', '3m': '3M', '6m': '6M', '1y': '1A', '5y': '5A' };

let currentAssetType = 'stocks';
let currentTicker = '';
let currentRange = '1m';
let currentCotacao = null;

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDateTime(isoString) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(isoString));
}

function formatVariation(pct) {
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

function validateTicker(value) {
  if (!value.trim()) return 'Informe o ticker do ativo.';
  if (!/^[A-Z]{4}\d{1,2}F?$/.test(value.trim().toUpperCase()))
    return 'Ticker inválido. Ex: BBAS3, HGLG11, PETR4.';
  return null;
}

function setFieldError(msg) {
  tickerError.textContent = msg ?? '';
  tickerGroup.dataset.invalid = msg ? 'true' : 'false';
  tickerInput.setAttribute('aria-invalid', msg ? 'true' : 'false');
}

async function fetchCotacao(assetType, ticker) {
  const res = await fetch(`${API_BASE}/${assetType}/${encodeURIComponent(ticker)}`);
  if (!res.ok) throw { status: res.status };
  return res.json();
}

async function fetchHistory(assetType, ticker, range) {
  const res = await fetch(`${API_BASE}/${assetType}/${encodeURIComponent(ticker)}/history?range=${range}`);
  if (!res.ok) throw { status: res.status };
  return res.json();
}

function renderLoading() {
  resultadoConteudo.innerHTML = `
    <div class="cotacao-card card" aria-busy="true">
      <p class="cotacao-loading">Buscando cotação<span aria-hidden="true">…</span></p>
    </div>`;
  graficoWrap.hidden = true;
}

function renderResult(data, variation) {
  const sourceLabel = data.source ? (SOURCE_LABEL[data.source] ?? data.source) : '';
  const asOf = data.asOf ? formatDateTime(data.asOf) : null;
  const varClass = variation >= 0 ? 'cotacao-variacao--up' : 'cotacao-variacao--down';
  const varText = variation != null ? `<span class="cotacao-variacao ${varClass}">${formatVariation(variation)}</span>` : '';

  resultadoConteudo.innerHTML = `
    <div class="cotacao-card card">
      <div class="cotacao-header">
        <span class="cotacao-ticker">${data.ticker}</span>
        ${sourceLabel ? `<span class="cotacao-badge">${sourceLabel}</span>` : ''}
      </div>
      <div class="cotacao-price-row">
        <p class="cotacao-price">${formatCurrency(data.price)}</p>
        ${varText}
      </div>
      ${asOf ? `<p class="cotacao-asof">Atualizado em ${asOf}</p>` : ''}
    </div>`;
}

function renderError(status, ticker) {
  const messages = {
    404: `Ativo <strong>${ticker}</strong> não encontrado em nenhuma fonte de dados.`,
    503: 'As fontes de dados estão temporariamente indisponíveis. Tente novamente em alguns instantes.',
  };
  const msg = messages[status] ?? 'Erro inesperado. Verifique se a API está em execução.';
  resultadoConteudo.innerHTML = `
    <div class="cotacao-card card cotacao-card--error" role="alert">
      <p class="cotacao-error-msg">${msg}</p>
    </div>`;
  graficoWrap.hidden = true;
}

function renderGraficoLoading() {
  graficoWrap.hidden = false;
  graficoWrap.querySelector('#grafico-container').innerHTML =
    '<p class="cotacao-loading" style="padding:16px">Carregando histórico<span aria-hidden="true">…</span></p>';
  graficoWrap.querySelector('.grafico-minmax').textContent = '';
}

function renderGrafico(history) {
  graficoWrap.hidden = false;
  const container = graficoWrap.querySelector('#grafico-container');
  if (container._roCleanup) container._roCleanup();

  renderHistoryChart(container, history.points);

  const closes = history.points.map(p => p.close);
  if (closes.length) {
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    graficoWrap.querySelector('.grafico-minmax').innerHTML =
      `<span>Mín: <strong>${formatCurrency(min)}</strong></span><span>Máx: <strong>${formatCurrency(max)}</strong></span>`;
  }
}

function renderGraficoError() {
  graficoWrap.querySelector('#grafico-container').innerHTML =
    '<p class="cotacao-error-msg" style="padding:16px">Histórico indisponível no momento.</p>';
  graficoWrap.querySelector('.grafico-minmax').textContent = '';
}

function setActiveRange(range) {
  currentRange = range;
  graficoWrap.querySelectorAll('.range-btn').forEach(btn => {
    btn.classList.toggle('range-btn--active', btn.dataset.range === range);
    btn.setAttribute('aria-pressed', btn.dataset.range === range ? 'true' : 'false');
  });
}

function updateVariation(variation) {
  const varEl = resultadoConteudo.querySelector('.cotacao-variacao');
  const row = resultadoConteudo.querySelector('.cotacao-price-row');
  if (!row) return;
  if (varEl) varEl.remove();
  if (variation != null) {
    const varClass = variation >= 0 ? 'cotacao-variacao--up' : 'cotacao-variacao--down';
    const span = document.createElement('span');
    span.className = `cotacao-variacao ${varClass}`;
    span.textContent = formatVariation(variation);
    row.appendChild(span);
  }
}

async function loadHistory(range) {
  setActiveRange(range);
  renderGraficoLoading();
  try {
    const history = await fetchHistory(currentAssetType, currentTicker, range);
    const variation = history.points.length >= 2
      ? ((history.points.at(-1).close - history.points[0].close) / history.points[0].close) * 100
      : null;
    updateVariation(variation);
    renderGrafico(history);
  } catch {
    renderGraficoError();
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const rawTicker = tickerInput.value.trim().toUpperCase();
  const assetType = assetTypeSelect.value;

  const error = validateTicker(rawTicker);
  setFieldError(error);
  if (error) { tickerInput.focus(); return; }

  currentTicker = rawTicker;
  currentAssetType = assetType;
  buscarBtn.disabled = true;
  renderLoading();

  try {
    const data = await fetchCotacao(assetType, rawTicker);
    currentCotacao = data;
    renderResult(data, null);
    loadHistory(currentRange);
    loadFundamentals(currentTicker, currentAssetType);
  } catch (err) {
    renderError(err?.status, rawTicker);
  } finally {
    buscarBtn.disabled = false;
  }
});

graficoWrap.querySelectorAll('.range-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (currentTicker) loadHistory(btn.dataset.range);
  });
});

tickerInput.addEventListener('input', () => {
  if (tickerInput.value.trim()) setFieldError(null);
});
