import { oneGoRenderSales, salesContainer, fetchSalesByFilter, fetchAllSales } from './sales.js';
import { container, clientList, bindClient, oneGoRenderClient } from './client.js';
import { oneGoRenderingEmployeeList, employeeList, bindEmployeeButtons } from './employee.js';

// ============================================================
// GENERAL SETUP
// ============================================================
const main        = document.getElementById("main");
const menu1       = document.querySelector("#menu1");
const menuBar     = document.querySelector("#menu-bar");
let onState  = 0;

const menu2   = document.querySelector("#menu2");
const sideBar = document.querySelector("#side-bar");
let onState2 = 0;

const employeeContainer = document.querySelector(".show-employees");
let latestMatched = {};
const toggles = document.querySelectorAll(".custom-select");

export const currentDate = new Date();
currentDate.setHours(0, 0, 0, 0);

const navBtns       = document.querySelectorAll('.nav-button');
const navContent    = document.querySelector(".nav-contents");
const scrollTopBtn  = document.getElementById("scrollTopBtn");

let isSearching = false;

// ============================================================
// DOMContentLoaded
// ============================================================
document.addEventListener("DOMContentLoaded", function () {

  // ---- Hamburger menus ----
  menu1.addEventListener("click", function () {
    onState = onState === 0 ? 1 : 0;
    menuBar.classList.toggle("show-nav", onState === 1);
  });
  menu2.addEventListener("click", function () {
    onState2 = onState2 === 0 ? 1 : 0;
    sideBar.classList.toggle("show-article", onState2 === 1);
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth >= 2500) document.querySelector("article")?.classList.remove("show-article");
  });

  // ---- Dropdown toggles ----
  toggles.forEach(toggle => {
    const toggleTitle = toggle.querySelector(".dropbarTitle");
    const closeClass  = toggle.dataset.show;
    const getOptions  = toggle.nextElementSibling;
    const thisOptionP = getOptions.querySelectorAll("p");

    const input   = navContent?.querySelector("input");
    const results = navContent?.querySelector(".autocomplete-results");

    thisOptionP.forEach(p => {
      p.addEventListener("click", function () {
        toggleTitle.textContent = p.textContent;
        getOptions.classList.toggle(closeClass);
        toggle.querySelector(".left").classList.remove("down");
      });
    });

    toggle.addEventListener("click", function () {
      isSearching = false;
      if (input)   input.value = '';
      if (results) results.innerHTML = '';
      const arrow      = this.querySelector(".left");
      const thisOption = this.nextElementSibling;
      const showClass  = this.dataset.show;
      toggles.forEach(other => {
        if (other !== this) {
          other.nextElementSibling.classList.remove(other.dataset.show);
          other.querySelector(".left").classList.remove("down");
        }
      });
      thisOption.classList.toggle(showClass);
      arrow.classList.toggle("down");
    });
  });

  // ---- Page-specific dropdown filters ----
  if (isPage("salesPage") || isPage("clientPage") || isPage("employeePage")) {
    const customSelect = navContent.querySelectorAll(".custom-select");
    const defaultTitles = new Map();
    customSelect.forEach(select => {
      defaultTitles.set(select, select.querySelector(".dropbarTitle").textContent.trim());
    });

    setInterval(() => {
      if (isSearching) {
        customSelect.forEach(select => {
          select.querySelector(".dropbarTitle").textContent = defaultTitles.get(select);
          select.nextElementSibling.classList.remove(select.dataset.show);
          select.querySelector(".left").classList.remove("down");
        });
        isSearching = false;
      }
    }, 1000);

    customSelect.forEach(select => {
      const dropdownTitle = select.querySelector(".dropbarTitle");
      const siblingP = select.nextElementSibling.querySelectorAll("p");

      siblingP.forEach(p => {
        p.addEventListener("click", async function () {
          dropdownTitle.textContent = p.textContent;
          isSearching = false;

          // ---- SALES PAGE filters — now use API ----
          if (isPage("salesPage")) {
            const txt = dropdownTitle.textContent;
            if      (txt === 'All Times')  await fetchAllSales();
            else if (txt === 'This Day')   await fetchSalesByFilter('today');
            else if (txt === 'This Week')  await fetchSalesByFilter('week');
            else if (txt === 'This Month') await fetchSalesByFilter('month');
            else if (txt === 'This Year')  await fetchSalesByFilter('year');
          }

          // ---- CLIENT PAGE filters — still local ----
          if (isPage("clientPage")) {
            const txt = dropdownTitle.textContent;
            if (txt === 'All Times') {
              oneGoRenderClient(clientList, container);
            } else {
              latestMatched = localDateFilter(txt, clientList);
              oneGoRenderClient(latestMatched, container);
            }
            bindClient(clientList);
          }

          // ---- EMPLOYEE PAGE filters — still local ----
          if (isPage("employeePage")) {
            latestMatched = DropdownSearch(employeeList, p.textContent);
            oneGoRenderingEmployeeList(latestMatched, employeeContainer);
            bindEmployeeButtons();
          }

          // Reset other dropdowns
          customSelect.forEach(other => {
            if (other !== select) {
              other.querySelector(".dropbarTitle").textContent = defaultTitles.get(other);
            }
          });
        });
      });
    });
  }

  // ---- Add/Back form toggle ----
  if (isPage("inventoryPage") || isPage("clientPage") || isPage("employeePage")) {
    const add  = document.getElementById("add");
    const form = document.getElementById("form");
    const back = document.querySelector(".back");
    add.addEventListener("click", function () {
      form.classList.toggle("show-form");
      main.classList.toggle("dis-scroll");
    });
    back.addEventListener("click", function () {
      form.classList.remove("show-form");
      main.classList.remove("dis-scroll");
    });
  }

  // ---- Scroll to top ----
  main.addEventListener("scroll", () => {
    scrollTopBtn.style.display = main.scrollTop > 30 ? "flex" : "none";
  });
  scrollTopBtn.addEventListener("click", () => {
    main.scrollTo({ top: 0, behavior: "smooth" });
  });

  // navBtns no longer need to save to sessionStorage — data is in the DB now
});

// ============================================================
// EXPORTS
// ============================================================
export function isPage(id) {
  return document.body.id === id;
}

export function searchName(data, query) {
  const lowerQuery = query.toLowerCase();
  const matched = {};
  for (const [key, value] of Object.entries(data)) {
    if (key.toLowerCase().includes(lowerQuery)) matched[key] = value;
  }
  return matched;
}

export function inputShow(input, resultbox, latestMatched, search, data, render, container) {
  isSearching = true;
  const query = input.value.trim();
  if (query.length < 1) { resultbox.innerHTML = ''; return; }
  latestMatched = search(data, query);
  render(latestMatched, container);
  resultbox.innerHTML = Object.entries(latestMatched).map(([key]) => `<div>${key}</div>`).join('');
  resultbox.querySelectorAll('div').forEach(item => {
    item.addEventListener('click', function () {
      input.value = item.textContent;
      resultbox.innerHTML = '';
      latestMatched = search(data, input.value);
      render(latestMatched, container);
    });
  });
}

export function inputShowSale(input, resultbox, latestMatched, search, data, render, container) {
  isSearching = true;
  const query = input.value.trim();
  if (query.length < 1) { resultbox.innerHTML = ''; render(data, container); return; }
  latestMatched = search(data, query);
  render(latestMatched, container);
  const uniqueClients = [...new Set(Object.values(latestMatched).map(v => v.client))];
  resultbox.innerHTML = uniqueClients.map(c => `<div>${c}</div>`).join('');
  resultbox.querySelectorAll('div').forEach(item => {
    item.addEventListener('click', function () {
      input.value = item.textContent;
      resultbox.innerHTML = '';
      latestMatched = search(data, input.value);
      render(latestMatched, container);
    });
  });
}

export function keydown(event, input, render, data, container, latestMatched, search, resultbox) {
  if (event.key === "Enter") {
    isSearching = true;
    const keyword = input.value.trim();
    if (keyword.length < 1) { render(data, container); return; }
    latestMatched = search(data, keyword);
    render(latestMatched, container);
    resultbox.innerHTML = '';
  }
}

export function formatDateToText(date) {
  const mm   = String(date.getMonth() + 1).padStart(2, '0');
  const dd   = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

// ============================================================
// LOCAL DATE FILTER — still used for client page dropdowns
// ============================================================
function localDateFilter(label, data) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const matched = {};
  for (const [key, value] of Object.entries(data)) {
    const pastDate   = new Date(value.date);
    const diffInDays = Math.floor((now - pastDate) / (1000 * 60 * 60 * 24));
    if (label === 'This Day'   && diffInDays === 0)              matched[key] = value;
    if (label === 'This Week'  && diffInDays >= 0 && diffInDays < 7)  matched[key] = value;
    if (label === 'This Month' && diffInDays >= 0 && diffInDays < 31) matched[key] = value;
    if (label === 'This Year'  && diffInDays >= 0 && diffInDays < 366)matched[key] = value;
  }
  return matched;
}

function DropdownSearch(data, query) {
  const lowerQuery = query.toLowerCase();
  const matched = {};
  for (const [key, value] of Object.entries(data)) {
    const values = Object.values(value).map(v => String(v).toLowerCase());
    if (values.some(v => v.includes(lowerQuery))) matched[key] = value;
  }
  return matched;
}