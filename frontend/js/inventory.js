import {isPage, searchName, inputShow, keydown} from "./index.js";

const API = 'http://localhost:5001/api';

// ============================================================
// STATE — cars object is now populated from the API
// ============================================================
export let cars = {};

const inventoryCardContainer = document.getElementById("inventoryCardContainer");
const inputInventory = document.getElementById('searchInputInventory');
const resultsBoxInventory = document.getElementById('resultsInventory');
const submitNewCar = document.getElementById("submitNewCar");
let latestMatchedCars = {};

const type     = document.getElementById("type");
const brand    = document.getElementById("brand");
const model    = document.getElementById("model");
const year     = document.getElementById("year");
const color    = document.getElementById("color");
const quantity = document.getElementById("quantity");
const price    = document.getElementById("price");

// ============================================================
// HELPERS
// ============================================================
function buildCarsMap(apiArray) {
  // Convert the API array into the same key-value shape the rest of the code expects
  // key = "BMW M3 2021 Blue"
  const map = {};
  apiArray.forEach(car => {
    const key = `${car.brand} ${car.model} ${car.year} ${car.color}`;
    map[key] = {
      car_id:   car.car_id,
      type:     car.type,
      brand:    car.brand,
      model:    car.model,
      year:     car.year,
      color:    car.color,
      quantity: car.quantity,
      price:    Number(car.price),
      inStock:  car.in_stock,
      sold:     car.sold,
      reserved: car.reserved
    };
  });
  return map;
}

function updateTotalsDisplay(data) {
  const totals = calculateTotals(data);
  document.getElementById("totalCars").textContent   = totals.total;
  document.getElementById("inStockTotal").textContent = totals.inStock;
  document.getElementById("soldTotal").textContent    = totals.sold;
  document.getElementById("reservedTotal").textContent = totals.reserved;
}

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", async function () {
  if (!isPage("inventoryPage")) return;

  // Load cars from API
  try {
    const res  = await fetch(`${API}/cars`);
    const data = await res.json();
    Object.assign(cars, buildCarsMap(data));
  } catch (err) {
    console.error('Failed to load cars:', err);
  }

  oneGoRenderInventory(cars, inventoryCardContainer);
  updateTotalsDisplay(cars);

  // Live search
  inputInventory.addEventListener('input', () => {
    inputShow(inputInventory, resultsBoxInventory, latestMatchedCars, searchName, cars, oneGoRenderInventory, inventoryCardContainer);
  });

  // Enter key search
  inputInventory.addEventListener("keydown", function (event) {
    keydown(event, inputInventory, oneGoRenderInventory, cars, inventoryCardContainer, latestMatchedCars, searchName, resultsBoxInventory);
  });

  // Filter buttons
  document.querySelector('.filter').addEventListener('click', (e) => {
    if (!e.target.classList.contains('main-btn')) return;
    const classList = e.target.classList;
    let statusKey = '';
    if (classList.contains('instock'))  statusKey = 'inStock';
    else if (classList.contains('sold'))     statusKey = 'sold';
    else if (classList.contains('reserved')) statusKey = 'reserved';
    if (statusKey) {
      const sortedCars = sortCarsByStatus(statusKey, cars);
      oneGoRenderInventory(sortedCars, inventoryCardContainer);
    }
  });

  // Add new car
  submitNewCar.addEventListener("click", async function () {
    try {
      const res = await fetch(`${API}/cars`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:     type.value,
          brand:    brand.value,
          model:    model.value,
          year:     Number(year.value),
          color:    color.value,
          quantity: Number(quantity.value),
          price:    Number(price.value)
        })
      });
      if (!res.ok) throw new Error(await res.text());
      const newCar = await res.json();
      const key = `${newCar.brand} ${newCar.model} ${newCar.year} ${newCar.color}`;
      cars[key] = {
        car_id: newCar.car_id, type: newCar.type, brand: newCar.brand,
        model: newCar.model, year: newCar.year, color: newCar.color,
        quantity: newCar.quantity, price: Number(newCar.price),
        inStock: newCar.in_stock, sold: newCar.sold, reserved: newCar.reserved
      };
      oneGoRenderInventory(cars, inventoryCardContainer);
      updateTotalsDisplay(cars);
      restAfterAddCar();
    } catch (err) {
      console.error('Failed to add car:', err);
      alert('Failed to add car. Check console.');
    }
  });
});

// ============================================================
// EXPORTED — used by client.js to search available vehicles
// ============================================================
export function findVehicle(query) {
  const lowerQuery = query.toLowerCase();
  const matched = {};
  for (const [key, car] of Object.entries(cars)) {
    if (car.inStock > 0 && key.toLowerCase().includes(lowerQuery)) matched[key] = car;
  }
  return matched;
}

// ============================================================
// BIND CARS — "Add to Stock" form
// ============================================================
export function bindCars(data) {
  const stockForm         = document.getElementById('stockForm');
  const Back              = document.querySelector('.backInfo');
  const add               = document.getElementById('addToStock');
  const numOfCarsAdded    = document.getElementById('carQuantity');
  let holdtrack = null;

  inventoryCardContainer.addEventListener('click', function (e) {
    const card = e.target.closest('.card');
    if (!card) return;
    stockForm.classList.add('show-form');
    holdtrack = card.dataset.track;
  });

  const newAdd = add.cloneNode(true);
  add.parentNode.replaceChild(newAdd, add);

  newAdd.addEventListener('click', async () => {
    if (!holdtrack) return;
    const amount = Number(numOfCarsAdded.value);
    if (isNaN(amount) || amount <= 0) return;

    try {
      const car_id = cars[holdtrack]?.car_id;
      if (!car_id) return;

      const res = await fetch(`${API}/cars/${car_id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();

      // Sync local cars object
      cars[holdtrack].inStock  = updated.in_stock;
      cars[holdtrack].quantity = updated.quantity;

      updateTotalsDisplay(cars);
      oneGoRenderInventory(data, inventoryCardContainer);
    } catch (err) {
      console.error('Failed to update stock:', err);
      alert('Failed to update stock.');
    }

    stockForm.classList.remove('show-form');
    numOfCarsAdded.value = '';
    holdtrack = null;
  });

  Back.addEventListener('click', () => {
    stockForm.classList.remove('show-form');
    numOfCarsAdded.value = '';
    holdtrack = null;
  });
}

// ============================================================
// RENDER
// ============================================================
function oneGoRenderInventory(data, container) {
  const fragment = document.createDocumentFragment();
  Object.entries(data).forEach(([key, value]) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.track = key;
    card.innerHTML = `
      <div class="outer-span">
        <div class="inner-span">
          <p><span><i class="fa fa-car"></i> Type:</span> ${value.type}</p>
          <p><span><i class="fa fa-tag"></i> Brand:</span> ${value.brand}</p>
        </div>
        <div class="inner-span">
          <p><span><i class="fa fa-id-card"></i> Model:</span> ${value.model}</p>
          <p><span><i class="fa fa-calendar-alt"></i> Year:</span> ${value.year}</p>
        </div>
      </div>
      <div class="outer-span">
        <div class="inner-span">
          <p><span><i class="fa fa-palette"></i> Color:</span> ${value.color}</p>
          <p><span><i class="fa fa-layer-group"></i> Quantity:</span> ${value.quantity}</p>
        </div>
        <div class="inner-span">
          <p><span><i class="fa fa-dollar-sign"></i> Price:</span> $${value.price}</p>
          <p>
            <span><i class="fa fa-check-circle"></i> Status:</span>
            <span class="in-stock-no"><i class="fa fa-check"></i> : ${value.inStock}</span>
            <span class="sold-no"><i class="fa fa-times-circle"></i> : ${value.sold}</span>
            <span class="reserved-no"><i class="fa fa-clock"></i> : ${value.reserved}</span>
          </p>
        </div>
      </div>
    `;
    fragment.appendChild(card);
  });
  container.innerHTML = '';
  container.appendChild(fragment);
  bindCars(data);
  console.log('Rendered Inventory');
}

function calculateTotals(carsObject) {
  return Object.values(carsObject).reduce((totals, car) => {
    totals.total    += Number(car.inStock) + Number(car.sold) + Number(car.reserved);
    totals.inStock  += Number(car.inStock);
    totals.sold     += Number(car.sold);
    totals.reserved += Number(car.reserved);
    return totals;
  }, { total: 0, inStock: 0, sold: 0, reserved: 0 });
}

function sortCarsByStatus(statusKey, carsObj) {
  return Object.fromEntries(
    Object.entries(carsObj).sort(([, a], [, b]) => b[statusKey] - a[statusKey])
  );
}

function restAfterAddCar() {
  const form = document.getElementById("form");
  const main = document.getElementById("main");
  type.value = ''; brand.value = ''; model.value = '';
  year.value = ''; color.value = ''; quantity.value = ''; price.value = '';
  form.classList.remove("show-form");
  main.classList.remove("dis-scroll");
}