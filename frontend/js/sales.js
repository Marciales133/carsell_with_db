import { isPage, keydown, formatDateToText, inputShowSale } from "./index.js";

const API = 'http://localhost:5001/api';

// ============================================================
// DOM REFS
// ============================================================
const allSalesman     = document.getElementById('salespersonOption');
export const salesContainer = document.querySelector('.records');
const inputSales      = document.getElementById('searchInputSales');
const resultsBoxSales = document.getElementById('resultsSales');

// ============================================================
// STATE
// ============================================================
let salesData    = {};   // local copy for filtering/search
let latestMatched = {};

// ============================================================
// HELPERS
// ============================================================
function buildSalesMap(apiArray) {
  const map = {};
  apiArray.forEach(s => {
    map[String(s.sale_id)] = {
      sale_id:  s.sale_id,
      date:     new Date(s.sale_date),
      client:   s.client_name,
      profit:   Number(s.profit),
      salesMan: s.employee_name,
      Vehecle:  `${s.brand} ${s.model} ${s.year} ${s.color}`,
      status:   s.status
    };
  });
  return map;
}

function searchClientName(data, query) {
  const lowerQuery = query.toLowerCase();
  const matched = {};
  for (const [key, value] of Object.entries(data)) {
    if (value.client.toLowerCase().includes(lowerQuery)) matched[key] = value;
  }
  return matched;
}

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", async function () {
  if (!isPage('salesPage')) return;

  // Load sales + salesmen from API
  try {
    const [salesRes, empRes] = await Promise.all([
      fetch(`${API}/sales`),
      fetch(`${API}/employees`)
    ]);
    const rawSales = await salesRes.json();
    const rawEmps  = await empRes.json();

    salesData = buildSalesMap(rawSales);

    // Populate salesman dropdown from API employees
    const optionsOfAllSalesman = allSalesman.querySelector('.custom-option-body');
    const salesmen = rawEmps.filter(e =>
      e.department_name?.toLowerCase() === 'sales'
    );
    optionsOfAllSalesman.innerHTML = salesmen
      .map(e => `<p data-id="${e.employee_id}">${e.name}</p>`)
      .join('');

    // Bind salesman filter clicks
    optionsOfAllSalesman.querySelectorAll('p').forEach(p => {
      p.addEventListener('click', async () => {
        const emp_id = p.dataset.id;
        const res = await fetch(`${API}/sales?employee_id=${emp_id}`);
        const data = await res.json();
        salesData = buildSalesMap(data);
        oneGoRenderSales(salesData, salesContainer);
      });
    });

  } catch (err) {
    console.error('Failed to load sales:', err);
  }

  oneGoRenderSales(salesData, salesContainer);

  // Search input
  inputSales.addEventListener('input', function () {
    inputShowSale(inputSales, resultsBoxSales, latestMatched, searchClientName, salesData, oneGoRenderSales, salesContainer);
  });
  inputSales.addEventListener("keydown", function (event) {
    keydown(event, inputSales, oneGoRenderSales, salesData, salesContainer, latestMatched, searchClientName, resultsBoxSales);
  });
});

// ============================================================
// DATE FILTER — called from index.js dropdown handlers
// These replace the local today/week/month/year functions
// by fetching from the API with ?filter= param
// ============================================================
export async function fetchSalesByFilter(filter) {
  try {
    const res  = await fetch(`${API}/sales?filter=${filter}`);
    const data = await res.json();
    salesData  = buildSalesMap(data);
    oneGoRenderSales(salesData, salesContainer);
  } catch (err) {
    console.error('Failed to filter sales:', err);
  }
}

export async function fetchAllSales() {
  try {
    const res  = await fetch(`${API}/sales`);
    const data = await res.json();
    salesData  = buildSalesMap(data);
    oneGoRenderSales(salesData, salesContainer);
  } catch (err) {
    console.error('Failed to load all sales:', err);
  }
}

// ============================================================
// RENDER
// ============================================================
export function oneGoRenderSales(data, container) {
  const fragment = document.createDocumentFragment();
  Object.entries(data).forEach(([, value]) => {
    const card = document.createElement('div');
    card.className = 'record boxes';

    let color = '';
    if (value.status === 'Completed')   color = 'color-complete';
    if (value.status === 'Canceled')    color = 'color-cancelled';
    if (value.status === 'In-Progress') color = 'color-inprogress';

    card.innerHTML = `
      <p><i class="fa fa-calendar-alt"></i><span>Date:</span> ${formatDateToText(new Date(value.date))}</p>
      <p><i class="fa fa-user-tie"></i><span>Salesman:</span> ${value.salesMan}</p>
      <p><i class="fa fa-user"></i><span>Client:</span> ${value.client}</p>
      <p><i class="fa fa-car"></i><span>Vehicle:</span> ${value.Vehecle}</p>
      <p><i class="fa fa-dollar-sign"></i><span>Profit:</span> $${value.profit}</p>
      <p><i class="fa fa-check-circle"></i><span>Status:</span> <span class="${color}">${value.status}</span></p>
    `;
    fragment.appendChild(card);
  });
  container.innerHTML = '';
  container.appendChild(fragment);
  console.log('Rendered Sales');
}