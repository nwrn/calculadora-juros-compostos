const API_BASE = 'http://localhost:8080';

const form = document.getElementById('cotacao-form');
const tickerInput = document.getElementById('ticker');
const tickerGroup = document.getElementById('ticker-group');
const tickerError = document.getElementById('ticker-error');
const assetTypeSelect = document.getElementById('assetType');
const buscarBtn = document.getElementById('buscar-btn');
const resultadoConteudo = document.getElementById('resultado-conteudo');

const SOURCE_LABEL = {
  YAHOO_FINANCE: 'Yahoo Finance',
  FUNDAMENTUS: 'Fundamentus',
};

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDateTime(isoString) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(isoString));
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

function renderLoading() {
  resultadoConteudo.innerHTML = `
    <div class="cotacao-card card" aria-busy="true">
      <p class="cotacao-loading">Buscando cotação<span aria-hidden="true">…</span></p>
    </div>`;
}

function renderResult(data) {
  const sourceLabel = SOURCE_LABEL[data.source] ?? data.source;
  const asOf = data.asOf ? formatDateTime(data.asOf) : '—';

  resultadoConteudo.innerHTML = `
    <div class="cotacao-card card">
      <div class="cotacao-header">
        <span class="cotacao-ticker">${data.ticker}</span>
        <span class="cotacao-badge">${sourceLabel}</span>
      </div>
      <p class="cotacao-price">${formatCurrency(data.price)}</p>
      <p class="cotacao-asof">Atualizado em ${asOf}</p>
    </div>`;
}

function renderError(status, ticker) {
  const messages = {
    404: `Ativo <strong>${ticker}</strong> não encontrado em nenhuma fonte de dados.`,
    503: 'As fontes de dados estão temporariamente indisponíveis. Tente novamente em alguns instantes.',
  };
  const msg = messages[status] ?? 'Erro inesperado ao buscar a cotação. Verifique se a API está em execução.';

  resultadoConteudo.innerHTML = `
    <div class="cotacao-card card cotacao-card--error" role="alert">
      <p class="cotacao-error-msg">${msg}</p>
    </div>`;
}

async function fetchCotacao(assetType, ticker) {
  const url = `${API_BASE}/${assetType}/${encodeURIComponent(ticker)}`;
  const response = await fetch(url);
  if (!response.ok) throw { status: response.status };
  return response.json();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const rawTicker = tickerInput.value.trim().toUpperCase();
  const assetType = assetTypeSelect.value;

  const error = validateTicker(rawTicker);
  setFieldError(error);
  if (error) {
    tickerInput.focus();
    return;
  }

  buscarBtn.disabled = true;
  renderLoading();

  try {
    const data = await fetchCotacao(assetType, rawTicker);
    renderResult(data);
  } catch (err) {
    renderError(err?.status, rawTicker);
  } finally {
    buscarBtn.disabled = false;
  }
});

tickerInput.addEventListener('input', () => {
  if (tickerInput.value.trim()) setFieldError(null);
});
