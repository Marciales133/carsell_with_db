import { isPage } from "./index.js";

const API = 'http://localhost:5001/api';

// ============================================================
// DOM REFS
// ============================================================
const activeClients        = document.getElementById('activeClients');
const newClientTbody       = document.getElementById('newClientTbody');
const lowStockTbody        = document.getElementById('lowStockTbody');
const totalRevenue         = document.getElementById('totalRevenue');
const monthlySales         = document.getElementById('monthlySales');
const carsInInventoryValue = document.getElementById('carsInInventoryValue');
const top3CarsContainer    = document.querySelector('.top-3-cars-container');
const addtask              = document.getElementById('newTask');
const tableBody            = document.querySelector('.table-body');

const bar1 = document.getElementById('salesTrend1th');
const bar2 = document.getElementById('salesTrend2th');
const bar3 = document.getElementById('salesTrend3th');
const bar4 = document.getElementById('salesTrend4th');
const bar5 = document.getElementById('salesTrend5th');

// tasks is still local (array of strings like your original)
export let tasks = [];

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", async function () {
  if (!isPage("dashboardPage")) return;

  // Load dashboard data and tasks from API
  try {
    const [dashRes, tasksRes] = await Promise.all([
      fetch(`${API}/dashboard`),
      fetch(`${API}/tasks`)
    ]);
    const dash      = await dashRes.json();
    const tasksData = await tasksRes.json();

    // Populate stats
    activeClients.textContent        = dash.totalEmployees;
    monthlySales.textContent         = dash.monthlySales;
    carsInInventoryValue.textContent = dash.carsInInventory;
    totalRevenue.textContent         = dash.totalRevenue;

    // Sales trend — dynamic from API
    const trend   = dash.monthlyTrend;                              // array of 5 [{label, revenue}]
    const maxRev  = Math.max(...trend.map(t => t.revenue), 1);      // avoid divide by zero
    const bars    = [bar5, bar4, bar3, bar2, bar1];                 // bar5=oldest, bar1=current
    const labels  = document.querySelectorAll('.label-labels p');   // the 5 month labels in HTML

    trend.forEach((month, i) => {
      const pct = (month.revenue / maxRev) * 90;                   // max 90% so it doesn't clip
      bars[i].style.height   = `${Math.max(pct, 2)}%`;            // min 2% so bar is always visible
      bars[i].title          = `${month.label}: $${month.revenue.toLocaleString()}`;
      if (labels[i]) labels[i].textContent = month.label;
    });

    // New clients table
    renderNewClients(dash.newClients, newClientTbody);

    // Low stock table
    renderLowStock(dash.lowStock, lowStockTbody);

    // Top 3 cars
    renderTop3Cars(dash.top3Cars, top3CarsContainer);

    // Tasks
    tasks = tasksData.map(t => ({ task_id: t.task_id, description: t.description }));
    renderTasks(tasks, tableBody);
    addTaskListeners();

  } catch (err) {
    console.error('Failed to load dashboard:', err);
  }

  // Add new task on Enter
  addtask.addEventListener('keydown', async (event) => {
    if (event.key === 'Enter' && addtask.value.trim() !== '') {
      try {
        const res = await fetch(`${API}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: addtask.value.trim() })
        });
        if (!res.ok) throw new Error(await res.text());
        const newTask = await res.json();
        tasks.push({ task_id: newTask.task_id, description: newTask.description });
        addtask.value = '';
        tableBody.innerHTML = '';
        renderTasks(tasks, tableBody);
        addTaskListeners();
      } catch (err) {
        console.error('Failed to add task:', err);
      }
    }
  });
});

// ============================================================
// RENDER FUNCTIONS
// ============================================================
function renderNewClients(data, container) {
  container.innerHTML = data.map(c => `
    <tr><td>${c.name}</td></tr>
  `).join('');
}

function renderLowStock(data, container) {
  container.innerHTML = data.map(car => `
    <tr>
      <td class="fit-td">${car.in_stock}</td>
      <td><span class="brand">${car.brand}</span> ${car.model} <span class="year">${car.year}</span> <span class="color">${car.color}</span></td>
    </tr>
  `).join('');
}

function renderTop3Cars(data, container) {
  container.innerHTML = data.map(car => `
    <div class="top-3-cars">
      <img src="./entities/image/mustang.png" alt="" class="top-3-cars-img">
      <div class="texts-on-the-side">
        <h6 class="top-3-cars-title">${car.model}</h6>
        <p class="top-3-cars-text">Sold ${car.sold}</p>
      </div>
    </div>
  `).join('');
}

function renderTasks(data, container) {
  data.forEach(task => {
    container.innerHTML += `<p data-id="${task.task_id}">${task.description}</p>`;
  });
}

function addTaskListeners() {
  const paragraphs = tableBody.querySelectorAll('p');
  paragraphs.forEach(p => {
    p.addEventListener('click', async function () {
      const task_id = p.dataset.id;
      try {
        await fetch(`${API}/tasks/${task_id}`, { method: 'DELETE' });
        tasks = tasks.filter(t => String(t.task_id) !== String(task_id));
        tableBody.innerHTML = '';
        renderTasks(tasks, tableBody);
        addTaskListeners();
      } catch (err) {
        console.error('Failed to delete task:', err);
      }
    });
  });
}