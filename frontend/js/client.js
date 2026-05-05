import { cars, findVehicle } from './inventory.js';
import { findSalesman } from './employee.js';
import { isPage, searchName, inputShow, keydown, formatDateToText } from "./index.js";

const API = 'http://localhost:5001/api';

// ============================================================
// DOM REFS
// ============================================================
const clientForm               = document.getElementById('boughtForm');
const inputClients             = document.getElementById('searchInputClients');
const resultsBoxClients        = document.getElementById('resultsClients');
const searchSalesmanAddClient  = document.querySelector('.searchSalesman');
const resultsFormSalesmanAddClient = document.querySelector('.resultsFormSalesman');
const searchInputVehicleAddClient  = document.querySelector('.searchInputVehecle');
const resultsFormVehicleAddClient  = document.querySelector('.resultsFormVehecle');
const submit                   = document.getElementById('submitNewClient');
const total                    = document.querySelectorAll('.showTotal');

export const container = document.querySelector('.cards-container');

// Form fields
const clientName       = document.getElementById('clientName');
const progressStatus   = document.getElementById('clientProcessStatus');
const numberOfPurchases= document.getElementById('numberOfPurchases');
const phone            = document.getElementById('phone');
const email            = document.getElementById('email');
const address          = document.getElementById('address');

// ============================================================
// STATE
// ============================================================
export let clientList = {};
export let salesList  = {};

// These are still needed by index.js exports — kept as no-ops
export let transactionNumber = 0;
export let totalProfit = 0;

let foundSalesman = {};
let foundVehicle  = {};
let latestMatched = {};
let profit = 0;

// ============================================================
// HELPERS
// ============================================================
function buildClientMap(apiArray) {
  const map = {};
  apiArray.forEach(c => {
    map[c.name] = {
      client_id:       c.client_id,
      client:          c.name,
      status:          c.status,
      numberOfPurchases: c.number_of_purchases,
      clientType:      c.client_type,
      phone:           c.phone,
      email:           c.email,
      date:            c.last_purchase_date ? new Date(c.last_purchase_date) : new Date(c.date_registered),
      address:         c.address
    };
  });
  return map;
}

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

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", async function () {
  if (!isPage("clientPage")) return;

  // Load clients and sales from API
  try {
    const [clientRes, salesRes] = await Promise.all([
      fetch(`${API}/clients`),
      fetch(`${API}/sales`)
    ]);
    const clientData = await clientRes.json();
    const salesData  = await salesRes.json();
    Object.assign(clientList, buildClientMap(clientData));
    Object.assign(salesList,  buildSalesMap(salesData));
  } catch (err) {
    console.error('Failed to load clients/sales:', err);
  }

  const form    = document.getElementById("form");
  const salesMan = form.querySelector('.searchSalesman');
  const Vehicle  = form.querySelector('.searchInputVehecle');
  const searchInputVehicleAddPurchase    = clientForm.querySelector('.searchInputVehecle');
  const resultsFormVehicleAddPurchase    = clientForm.querySelector('.resultsFormVehecle');
  const searchSalesmanAddPurchase        = clientForm.querySelector('.searchSalesman');
  const resultsFormSalesmanAddPurchase   = clientForm.querySelector('.resultsFormSalesman');

  oneGoRenderClient(clientList, container);

  inputClients.addEventListener('input', function () {
    inputShow(inputClients, resultsBoxClients, latestMatched, searchName, clientList, oneGoRenderClient, container);
  });
  inputClients.addEventListener("keydown", function (event) {
    keydown(event, inputClients, oneGoRenderClient, clientList, container, latestMatched, searchName, resultsBoxClients);
  });

  // these are already correct since you're just calling the async function
  searchInputVehicleAddClient.addEventListener('input', () => eventlistenerSearchVehicle(searchInputVehicleAddClient, resultsFormVehicleAddClient));
  searchInputVehicleAddPurchase.addEventListener('input', () => eventlistenerSearchVehicle(searchInputVehicleAddPurchase, resultsFormVehicleAddPurchase));
  searchSalesmanAddClient.addEventListener('input', () => eventlistenerSearchSalesman(searchSalesmanAddClient, resultsFormSalesmanAddClient));
  searchSalesmanAddPurchase.addEventListener('input', () => eventlistenerSearchSalesman(searchSalesmanAddPurchase, resultsFormSalesmanAddPurchase));

  // ---- Add New Client ----
  submit.addEventListener('click', async function () {
    total.forEach(t => { profit = Number(t.textContent); t.textContent = 0; });

    // Find car_id and employee_id from the local maps
    const selectedVehicleKey = Vehicle.value.trim();
    const selectedSalesmanName = salesMan.value.trim();
    const carData = cars[selectedVehicleKey];
    if (!carData?.car_id) { alert('Please select a valid vehicle.'); return; }

    // Find employee_id by name from employeeList — import lazily to avoid circular
    const { employeeList } = await import('./employee.js');
    const empData = employeeList[selectedSalesmanName];
    if (!empData?.employee_id) { alert('Please select a valid salesman.'); return; }

    try {
      // 1. Create client first (or get existing)
      let client_id;
      if (clientList[clientName.value]) {
        client_id = clientList[clientName.value].client_id;
      } else {
        const clientRes = await fetch(`${API}/clients`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name:            clientName.value,
            status:          'Active',
            client_type:     'New',
            phone:           phone.value,
            email:           email.value,
            date_registered: new Date(),
            address:         address.value
          })
        });
        if (!clientRes.ok) throw new Error(await clientRes.text());
        const newClient = await clientRes.json();
        client_id = newClient.client_id;
      }

      // 2. Create sales records (one per numberOfPurchases)
      const qty = Number(numberOfPurchases.value) || 1;
      for (let i = 0; i < qty; i++) {
        const saleRes = await fetch(`${API}/sales`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id,
            employee_id: empData.employee_id,
            car_id:      carData.car_id,
            profit:      profit,
            status:      progressStatus.textContent,
            quantity:    1
          })
        });
        if (!saleRes.ok) {
          const err = await saleRes.json();
          alert(err.error || 'Sale failed'); break;
        }
      }

      // 3. Refresh clients and sales from API
      const [cRes, sRes] = await Promise.all([fetch(`${API}/clients`), fetch(`${API}/sales`)]);
      const cData = await cRes.json(); const sData = await sRes.json();
      Object.keys(clientList).forEach(k => delete clientList[k]);
      Object.keys(salesList).forEach(k => delete salesList[k]);
      Object.assign(clientList, buildClientMap(cData));
      Object.assign(salesList,  buildSalesMap(sData));

      oneGoRenderClient(clientList, container);
      restAfterAddClient(salesMan, Vehicle);
    } catch (err) {
      console.error('Failed to add client/sale:', err);
      alert('Something went wrong. Check console.');
    }
  });
});

// ============================================================
// SEARCH HELPERS
// ============================================================
// ✅ FIXED
// ============================================================
// SEARCH HELPERS
// ============================================================
async function eventlistenerSearchVehicle(v, f) {
  const query = v.value.trim();
  if (query.length < 1) { f.innerHTML = " "; return; }

  // If cars hasn't been populated yet, fetch directly
  if (Object.keys(cars).length === 0) {
    try {
      const res  = await fetch(`${API}/cars`);
      const data = await res.json();
      data.forEach(car => {
        const key = `${car.brand} ${car.model} ${car.year} ${car.color}`;
        cars[key] = {
          car_id: car.car_id, type: car.type, brand: car.brand,
          model: car.model, year: car.year, color: car.color,
          quantity: car.quantity, price: Number(car.price),
          inStock: car.in_stock, sold: car.sold, reserved: car.reserved
        };
      });
    } catch (err) {
      console.error('Failed to fetch cars:', err); return;
    }
  }

  foundVehicle = findVehicle(query);
  f.innerHTML = Object.entries(foundVehicle).map(([key]) => `<div>${key}</div>`).join('');
  f.querySelectorAll('div').forEach(item => {
    item.addEventListener('click', function () {
      v.value = item.textContent;
      total.forEach(t => { t.textContent = cars[v.value]?.price || 0; });
      f.innerHTML = " ";
    });
  });
}

async function eventlistenerSearchSalesman(s, r) {
  const query = s.value.trim();
  if (query.length < 1) { r.innerHTML = " "; return; }

  // If employeeList hasn't been populated yet, fetch directly
  const { employeeList } = await import('./employee.js');
  if (Object.keys(employeeList).length === 0) {
    try {
      const res  = await fetch(`${API}/employees`);
      const data = await res.json();
      data.forEach(emp => {
        employeeList[emp.name] = {
          employee_id: emp.employee_id,
          department:  emp.department_name || '',
          position:    emp.position_title  || '',
        };
      });
    } catch (err) {
      console.error('Failed to fetch employees:', err); return;
    }
  }

  foundSalesman = findSalesman(query);
  r.innerHTML = Object.entries(foundSalesman).map(([key]) => `<div>${key}</div>`).join('');
  r.querySelectorAll('div').forEach(item => {
    item.addEventListener('click', function () {
      s.value = item.textContent;
      r.innerHTML = " ";
    });
  });
}
// ============================================================
// BIND CLIENT CARDS
// ============================================================
export function bindClient(data) {
  const clientForm     = document.getElementById('boughtForm');
  const BackButtons    = document.querySelectorAll('.backInfo');
  const addBtn         = document.getElementById('sold');
  const salesman       = clientForm.querySelector('.searchSalesman');
  const vehicle        = clientForm.querySelector('.searchInputVehecle');
  const status         = document.getElementById('ClientProcessStatus');
  const numberOfPurch  = document.getElementById('quantityPurchase');
  const total          = clientForm.querySelector('.showTotal');
  const change         = document.getElementById('Change');
  const clientType     = document.getElementById('formClientType');
  const clientStatus   = document.getElementById('formStatus');

  let holdTrack = null;

  container.addEventListener('click', function (e) {
    const card = e.target.closest('.card');
    if (!card) return;
    holdTrack = card.dataset.track;
    clientForm.classList.add('show-form');
    clientStatus.textContent = clientList[holdTrack]?.status || '';
    clientType.textContent   = clientList[holdTrack]?.clientType || '';
  });

  // ---- SOLD button (add purchase to existing client) ----
  const clonedAddBtn = addBtn.cloneNode(true);
  addBtn.parentNode.replaceChild(clonedAddBtn, addBtn);

  clonedAddBtn.addEventListener('click', async () => {
    if (!holdTrack) return;
    const purchases = Number(numberOfPurch.value);
    if (isNaN(purchases) || purchases <= 0) return;

    const clientData = clientList[holdTrack];
    if (!clientData?.client_id) return;

    // Get car and salesman IDs
    const selectedVehicleKey  = vehicle.value.trim();
    const selectedSalesmanName = salesman.value.trim();
    const carData = cars[selectedVehicleKey];
    if (!carData?.car_id) { alert('Please select a valid vehicle.'); return; }

    const { employeeList } = await import('./employee.js');
    const empData = employeeList[selectedSalesmanName];
    if (!empData?.employee_id) { alert('Please select a valid salesman.'); return; }

    try {
      for (let i = 0; i < purchases; i++) {
        const saleRes = await fetch(`${API}/sales`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id:   clientData.client_id,
            employee_id: empData.employee_id,
            car_id:      carData.car_id,
            profit:      Number(total.textContent),
            status:      status.textContent,
            quantity:    1
          })
        });
        if (!saleRes.ok) { const e = await saleRes.json(); alert(e.error || 'Sale failed'); break; }
      }

      // Refresh
      const [cRes, sRes] = await Promise.all([fetch(`${API}/clients`), fetch(`${API}/sales`)]);
      const cData = await cRes.json(); const sData = await sRes.json();
      Object.keys(clientList).forEach(k => delete clientList[k]);
      Object.keys(salesList).forEach(k => delete salesList[k]);
      Object.assign(clientList, buildClientMap(cData));
      Object.assign(salesList,  buildSalesMap(sData));

      oneGoRenderClient(data, container);
    } catch (err) {
      console.error('Failed to record sale:', err);
      alert('Something went wrong.');
    }

    clientForm.classList.remove('show-form');
    holdTrack = null;
    salesman.value = ''; vehicle.value = '';
    status.textContent = ''; numberOfPurch.value = '';
    total.textContent = 0;
  });

  // ---- CHANGE button (update status/clientType) ----
  const cloneChange = change.cloneNode(true);
  change.parentNode.replaceChild(cloneChange, change);

  cloneChange.addEventListener('click', async () => {
    if (!holdTrack) return;
    const clientData = clientList[holdTrack];
    if (!clientData?.client_id) return;

    try {
      await fetch(`${API}/clients/${clientData.client_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status:      clientStatus.textContent,
          client_type: clientType.textContent
        })
      });
      clientList[holdTrack].status     = clientStatus.textContent;
      clientList[holdTrack].clientType = clientType.textContent;
    } catch (err) {
      console.error('Failed to update client:', err);
    }

    clientForm.classList.remove('show-form');
    oneGoRenderClient(data, container);
    holdTrack = null;
  });

  BackButtons.forEach(btn => {
    btn.addEventListener('click', () => { clientForm.classList.remove('show-form'); holdTrack = null; });
  });
}

// ============================================================
// RENDER
// ============================================================
export function oneGoRenderClient(data, container) {
  const fragment = document.createDocumentFragment();
  Object.entries(data).forEach(([key, value]) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.track = key;

    let color = '';
    if (value.clientType === 'VIP')         color = 'client-vip';
    if (value.clientType === 'Regular')     color = 'client-regular';
    if (value.clientType === 'New')         color = 'client-new';
    if (value.clientType === 'Blacklisted') color = 'client-blacklisted';

    let statusColor = '';
    if (value.status === 'Active')   statusColor = 'client-active';
    if (value.status === 'Inactive') statusColor = 'client-inactive';
    if (value.status === 'Banned')   statusColor = 'client-banned';

    const dateDisplay = value.date ? formatDateToText(new Date(value.date)) : 'N/A';

    card.innerHTML = `
      <div class="outer-span1">
        <div class="inner-span">
          <p class="name"><span><i class="fa fa-user"></i> Name:</span> ${value.client}</p>
          <p class="status"><span><i class="fa fa-check-circle"></i> Status:</span> <span class="${statusColor}">${value.status}</span></p>
        </div>
        <div class="inner-span">
          <p class="no.-of-purchases"><span><i class="fa fa-shopping-cart"></i> No. of Purchases:</span>${value.numberOfPurchases}</p>
          <p class="client-status"><span><i class="fa fa-users"></i> Client Type:</span> <span class="${color}">${value.clientType}</span></p>
        </div>
      </div>
      <div class="outer-span2">
        <div class="inner-span">
          <p class="phone"><span><i class="fa fa-phone"></i> Phone:</span> ${value.phone}</p>
          <p class="email"><span><i class="fa fa-envelope"></i> Email:</span> ${value.email}</p>
        </div>
        <div class="inner-span">
          <p class="last-purchase-date"><span><i class="fa fa-calendar-alt"></i> Last Purchase Date:</span> ${dateDisplay}</p>
          <p class="address"><span><i class="fa fa-map-marker-alt"></i> Address:</span> ${value.address}</p>
        </div>
      </div>
    `;
    fragment.appendChild(card);
  });
  container.innerHTML = '';
  container.appendChild(fragment);
  bindClient(data);
  console.log('Rendered Clients');
}

function restAfterAddClient(salesMan, Vehicle) {
  const form = document.getElementById("form");
  const main = document.getElementById("main");
  clientName.value = ''; salesMan.value = ''; Vehicle.value = '';
  progressStatus.textContent = 'PROCESS STATUS';
  numberOfPurchases.value = ''; phone.value = ''; email.value = ''; address.value = '';
  form.classList.remove("show-form");
  main.classList.remove("dis-scroll");
}