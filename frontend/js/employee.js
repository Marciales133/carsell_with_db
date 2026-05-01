import {isPage, searchName, inputShow, keydown} from "./index.js";

const API = 'http://localhost:5001/api';

// ============================================================
// STATE
// ============================================================
export let employeeList = {};
export let employeeNumber = 0;

// ============================================================
// DOM REFS (only declared once — used in DOMContentLoaded)
// ============================================================
const Form               = document.getElementById('form2');
const clock              = document.getElementById('clock');
const Back               = document.querySelectorAll('.backInfo');
const submitNewEmployee  = document.getElementById("submitNewEmployee");
const employeeContainer  = document.querySelector(".show-employees");
const inputEmployees     = document.getElementById('searchInputEmployees');
const resultsBoxEmployees= document.getElementById('resultsEmployees');

const positions = {
  "Administration":       ["Office Administrator","Executive Assistant","Receptionist","Document Controller"],
  "Sales":                ["Sales Executive","Sales Manager","Account Executive","Business Development Officer","Salesman"],
  "Marketing":            ["Marketing Specialist","Content Creator","Digital Marketing Officer","Brand Manager"],
  "Finance":              ["Accountant","Bookkeeper","Finance Analyst","Payroll Officer"],
  "Customer Support":     ["Customer Service Representative","Support Lead","Call Center Agent","Helpdesk Coordinator"],
  "Mechanics":            ["Automotive Technician","Diesel Mechanic","Maintenance Mechanic","Shop Supervisor"],
  "Drivers":              ["Company Driver","Delivery Driver","Forklift Operator","Logistics Driver"],
  "Logistics":            ["Logistics Coordinator","Warehouse Associate","Inventory Controller","Supply Chain Officer"],
  "Human Resources":      ["HR Officer","Recruitment Specialist","HR Assistant","Training and Development Officer"],
  "IT Support":           ["IT Technician","System Administrator","Help Desk Support","Network Engineer"],
  "Security":             ["Security Guard","Security Supervisor","CCTV Operator","Access Control Officer"],
  "Cleaning & Maintenance":["Janitor","Maintenance Technician","Facility Cleaner","Utility Worker"]
};
const worklocations      = ["Main Office - Manila","Cebu Branch","Remote","Laguna Plant","Davao Satellite","Work from Home"];
const salaryChannel      = ["Bank Transfer","BDO","GCash","Maya","Check","Cash Pickup"];
const salaryLevels       = ["Level 1 - Entry","Level 2 - Junior","Level 3 - Mid-Level","Level 4 - Senior","Level 5 - Lead","Level 6 - Executive"];
const allAllowances      = ["Transportation Allowance","Meal Allowance","Internet Stipend","Housing Allowance","Hazard Pay","Night Shift Differential"];
const allAccessPermissions = ["View Payroll","Edit Employee Data","Approve Leave","Access HR Dashboard","Modify Roles","View Reports"];

// Form field refs
const department         = document.getElementById("department");
const form               = document.getElementById("form");
const name               = document.getElementById("name");
const employeeId         = document.getElementById("employeeId");
const age                = document.getElementById("age");
const birthDay           = document.getElementById("birthDate");
const nationality        = document.getElementById("nationality");
const contactNumber      = document.getElementById("contactNumber");
const emergencyContactNumber = document.getElementById("emergencyContactNumber");
const emailAddress       = document.getElementById("emailAddress");
const currentAddress     = document.getElementById("currentAddress");
const dateHired          = document.getElementById("dateHired");
const employmentStatus   = document.getElementById("employeeStatus");
const shift              = document.getElementById("shift");
const employeeType       = document.getElementById("employeeType");
const sss                = document.getElementById("sss");
const tin                = document.getElementById("tin");
const philHealth         = document.getElementById("philHealth");
const pagIbig            = document.getElementById("pagIbig");
const nationalId         = document.getElementById("nationalId");
const basicSalary        = document.getElementById("basicSalary");
const payType            = document.getElementById("payType");
const status             = document.getElementById("status");
const remarks            = document.getElementById("remarks");
const loginEmail         = document.getElementById("loginEmail");
const systemRole         = document.getElementById("systemRole");
const password           = document.getElementById("password");
const manager            = document.getElementById("manager");
const position           = document.getElementById("position");
const workLocation       = document.getElementById("workLocation");
const payrollChannel     = document.getElementById("payrollChannel");
const salaryLevel        = document.getElementById("salaryLevel");
const allowances         = document.getElementById("allowances");
const accessPermissions  = document.getElementById("accessPermissions");

const managerForm        = document.getElementById("EmployeeManager");
const positionForm       = document.getElementById("EmployeePosition");
const workLocationForm   = document.getElementById("EmployeeWorkLocation");
const payrollChannelForm = document.getElementById("EmployeePayrollChannel");
const salaryLevelForm    = document.getElementById("EmployeeSalaryLevel");
const allowancesForm     = document.getElementById("EmployeeAllowance");
const accessPermissionsForm = document.getElementById("EmployeeAccessPermission");

export let latestMatchedEmployees = {};

// ============================================================
// HELPERS
// ============================================================
function buildEmployeeMap(apiArray) {
  const map = {};
  apiArray.forEach(emp => {
    map[emp.name] = {
      employee_id:           emp.employee_id,
      name:                  emp.name,
      age:                   emp.age,
      gender:                emp.gender,
      employeeId:            emp.employee_code,
      birthDay:              emp.birth_date ? emp.birth_date.split('T')[0] : '',
      civilStatus:           emp.civil_status,
      nationality:           emp.nationality,
      contactNumber:         emp.contact_number,
      emergencyContactNumber:emp.emergency_contact,
      emailAddress:          emp.email_address,
      currentAddress:        emp.current_address,
      dateHired:             emp.date_hired ? emp.date_hired.split('T')[0] : '',
      employmentStatus:      emp.employment_status,
      position:              emp.position_title || '',
      department:            emp.department_name || '',
      manager:               '',
      shift:                 emp.shift,
      workLocation:          emp.work_location,
      employeeType:          emp.employee_type,
      sss:                   emp.sss,
      tin:                   emp.tin,
      philHealth:            emp.phil_health,
      pagIbig:               emp.pag_ibig,
      nationalId:            emp.national_id,
      basicSalary:           emp.basic_salary,
      payType:               emp.pay_type,
      payrollChannel:        emp.payroll_channel,
      salaryLevel:           emp.salary_level,
      allowances:            emp.allowances,
      deductions:            emp.deductions,
      status:                emp.status,
      separationDate:        emp.separation_date || 'N/A',
      remarks:               emp.remarks,
      loginEmail:            emp.login_email,
      systemRole:            emp.system_role,
      password:              '',   // never expose hash to frontend
      accessPermissions:     emp.access_permissions,
      employeeTrackNumber:   emp.track_number,
      clockState:            emp.clock_state,
      timeRendered:          emp.time_rendered,
      manager_id:            emp.manager_id,
      department_id:         emp.department_id,
      position_id:           emp.position_id
    };
  });
  return map;
}

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", async function () {
  if (!isPage("employeePage")) return;

  // Load employees from API
  try {
    const res  = await fetch(`${API}/employees`);
    const data = await res.json();
    Object.assign(employeeList, buildEmployeeMap(data));
    employeeNumber = data.length;
  } catch (err) {
    console.error('Failed to load employees:', err);
  }

  const departmentForm = Form.querySelector("#EmployeeDepartment");

  oneGoRenderingEmployeeList(employeeList, employeeContainer);

  inputEmployees.addEventListener('input', () => {
    inputShow(inputEmployees, resultsBoxEmployees, latestMatchedEmployees, searchName, employeeList, oneGoRenderingEmployeeList, employeeContainer);
    bindEmployeeButtons();
  });
  inputEmployees.addEventListener("keydown", function (event) {
    keydown(event, inputEmployees, oneGoRenderingEmployeeList, employeeList, employeeContainer, latestMatchedEmployees, searchName, resultsBoxEmployees);
    bindEmployeeButtons();
  });

  managerForm.addEventListener('input', () => searchManagers(managerForm));
  positionForm.addEventListener('input', () => {
    const validDepartment = departmentForm.textContent;
    if (validDepartment === 'DEPARTMENT') { window.alert('SELECT DEPARTMENT FIRST!'); return; }
    searchSuggestAutoComplete(positionForm, positions[validDepartment]);
  });
  workLocationForm.addEventListener('input',    () => searchSuggestAutoComplete(workLocationForm, worklocations));
  payrollChannelForm.addEventListener('input',  () => searchSuggestAutoComplete(payrollChannelForm, salaryChannel));
  salaryLevelForm.addEventListener('input',     () => searchSuggestAutoComplete(salaryLevelForm, salaryLevels));
  allowancesForm.addEventListener('input',      () => searchSuggestAutoComplete(allowancesForm, allAllowances));
  accessPermissionsForm.addEventListener('input',() => searchSuggestAutoComplete(accessPermissionsForm, allAccessPermissions));

  manager.addEventListener('input',     () => searchManagers(manager));
  position.addEventListener('input', () => {
    const validDepartment = department.textContent;
    if (validDepartment === 'DEPARTMENT') { window.alert('SELECT DEPARTMENT FIRST!'); return; }
    searchSuggestAutoComplete(position, positions[validDepartment]);
  });
  workLocation.addEventListener('input',    () => searchSuggestAutoComplete(workLocation, worklocations));
  payrollChannel.addEventListener('input',  () => searchSuggestAutoComplete(payrollChannel, salaryChannel));
  salaryLevel.addEventListener('input',     () => searchSuggestAutoComplete(salaryLevel, salaryLevels));
  allowances.addEventListener('input',      () => searchSuggestAutoComplete(allowances, allAllowances));
  accessPermissions.addEventListener('input',() => searchSuggestAutoComplete(accessPermissions, allAccessPermissions));

  // Add new employee
  submitNewEmployee.addEventListener("click", async function () {
    const genderVal      = document.querySelector('input[name="gender"]:checked');
    const civilStatusVal = document.querySelector('input[name="civilStatus"]:checked');
    try {
      const res = await fetch(`${API}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_code:      employeeId.value,
          track_number:       String(employeeNumber + 1).padStart(4, '0'),
          name:               name.value.trim(),
          age:                Number(age.value),
          gender:             genderVal?.value,
          birth_date:         birthDay.value,
          civil_status:       civilStatusVal?.value,
          nationality:        nationality.value,
          contact_number:     contactNumber.value,
          emergency_contact:  emergencyContactNumber.value,
          email_address:      emailAddress.value,
          current_address:    currentAddress.value,
          date_hired:         dateHired.value,
          employment_status:  employmentStatus.textContent,
          shift:              shift.textContent,
          work_location:      workLocation.value,
          employee_type:      employeeType.textContent,
          sss:                sss.value,
          tin:                tin.value,
          phil_health:        philHealth.value,
          pag_ibig:           pagIbig.value,
          national_id:        nationalId.value,
          basic_salary:       Number(basicSalary.value),
          pay_type:           payType.textContent,
          payroll_channel:    payrollChannel.value,
          salary_level:       salaryLevel.value,
          allowances:         allowances.value,
          status:             status.textContent,
          remarks:            remarks.value,
          login_email:        loginEmail.value,
          system_role:        systemRole.textContent,
          password:           password.value,
          access_permissions: accessPermissions.value,
          department_id:      null,
          position_id:        null,
          manager_id:         null
        })
      });
      if (!res.ok) throw new Error(await res.text());
      const newEmp = await res.json();
      employeeNumber++;
      // Refresh list from API
      const refreshed = await fetch(`${API}/employees`);
      const refreshedData = await refreshed.json();
      Object.keys(employeeList).forEach(k => delete employeeList[k]);
      Object.assign(employeeList, buildEmployeeMap(refreshedData));
      oneGoRenderingEmployeeList(employeeList, employeeContainer);
      bindEmployeeButtons();
      restAfterAddEmployee();
    } catch (err) {
      console.error('Failed to add employee:', err);
      alert('Failed to add employee. Check console.');
    }
  });

  bindEmployeeButtons();
});

// ============================================================
// EXPORTED — used by client.js / sales.js salesman search
// ============================================================
export function findSalesman(query) {
  const lowerQuery = query.toLowerCase();
  const matched = {};
  for (const [key, emp] of Object.entries(employeeList)) {
    if (!emp || typeof emp !== 'object') continue;
    if (
      emp.department?.toLowerCase() === "sales" &&
      emp.position === "Salesman" &&
      key.toLowerCase().includes(lowerQuery)
    ) matched[key] = emp;
  }
  return matched;
}

export function AllSalesmanList() {
  const matched = {};
  for (const [key, emp] of Object.entries(employeeList)) {
    if (emp.department?.toLowerCase() === "sales" && emp.position === "Salesman") {
      matched[key] = emp;
    }
  }
  return matched;
}

// ============================================================
// BIND EMPLOYEE BUTTONS
// ============================================================
export function bindEmployeeButtons() {
  const BtnDetails           = document.querySelectorAll('.BtnDetails');
  const btnManualClock       = document.querySelectorAll('.btnManualClock');
  const save                 = document.getElementById('save');
  const clockIn              = document.getElementById('clockIn');
  const clockOut             = document.getElementById('clockOut');
  const AdminsPassword       = document.getElementById('AdminsPassword');
  const EmployeesClockPassword = document.getElementById('EmployeesClockPassword');

  let holdTrack      = null;
  let currentEmployee = null;

  // ---- More Details button ----
  BtnDetails.forEach(item => {
    item.addEventListener('click', function (event) {
      const track = event.target.dataset.track;
      holdTrack = track;
      if (!Form) return;
      Form.classList.add('show-form');
      let found = false;
      for (const [key, value] of Object.entries(employeeList)) {
        if (String(value.employeeTrackNumber) === track) {
          found = true;
          document.getElementById('EmployeeName').value             = value.name;
          document.getElementById('EmployeeAge').value              = value.age;
          const genderInput = document.querySelector(`input[name="EmployeeGender"][value="${value.gender}"]`);
          if (genderInput) genderInput.checked = true;
          document.getElementById('EmployeeId').value               = value.employeeId;
          document.getElementById('EmployeeBirthdate').value        = value.birthDay;
          document.getElementById('EmployeeSivilStatus').textContent= value.civilStatus;
          document.getElementById('EmployeeNationality').value      = value.nationality;
          document.getElementById('EmployeeContactNumber').value    = value.contactNumber;
          document.getElementById('EmployeeEmergencyContactNumber').value = value.emergencyContactNumber;
          document.getElementById('EmployeeEmailAddress').value     = value.emailAddress;
          document.getElementById('EmployeeCurrentAddress').value   = value.currentAddress;
          document.getElementById('EmployeeDateHired').value        = value.dateHired;
          document.getElementById('EmployeeStatus').textContent     = value.employmentStatus;
          document.getElementById('EmployeePosition').value         = value.position;
          document.getElementById('EmployeeDepartment').textContent = value.department;
          document.getElementById('EmployeeManager').value          = value.manager;
          document.getElementById('EmployeeShift').textContent      = value.shift;
          document.getElementById('EmployeeWorkLocation').value     = value.workLocation;
          document.getElementById('EmployeeType').textContent       = value.employeeType;
          document.getElementById('EmployeeSSS').value              = value.sss;
          document.getElementById('EmployeeTIN').value              = value.tin;
          document.getElementById('EmployeePhilHealth').value       = value.philHealth;
          document.getElementById('EmployeePagIbig').value          = value.pagIbig;
          document.getElementById('EmployeeNationalId').value       = value.nationalId;
          document.getElementById('EmployeeBasicSalary').value      = value.basicSalary;
          document.getElementById('EmployeePayType').textContent    = value.payType;
          document.getElementById('EmployeePayrollChannel').value   = value.payrollChannel;
          document.getElementById('EmployeeSalaryLevel').value      = value.salaryLevel;
          document.getElementById('EmployeeDeduction').textContent  = value.deductions;
          document.getElementById('EmployeeAllowance').value        = value.allowances;
          document.getElementById('STATUS').textContent             = value.status;
          document.getElementById('EmployeeSeparationDate').value   = value.separationDate;
          document.getElementById('EmployeeRemarks').value          = value.remarks;
          document.getElementById('EmployeeEmailForLogin').value    = value.loginEmail;
          document.getElementById('EmployeeSystemRole').textContent = value.systemRole;
          document.getElementById('employeePassword').value         = '';
          document.getElementById('EmployeeAccessPermission').value = value.accessPermissions;
          currentEmployee = key;
          break;
        }
      }
      if (!found) console.warn('No employee matched for track:', track);
    });
  });

  // ---- Save button ----
  const cloneSave = save.cloneNode(true);
  save.parentNode.replaceChild(cloneSave, save);

  cloneSave.addEventListener('click', async function () {
    if (!employeeList[currentEmployee]) return;
    const emp = employeeList[currentEmployee];
    const newPassword = document.getElementById('employeePassword').value;

    const updates = {
      name:               document.getElementById('EmployeeName').value,
      age:                Number(document.getElementById('EmployeeAge').value),
      gender:             document.querySelector('input[name="EmployeeGender"]:checked')?.value,
      employee_code:      document.getElementById('EmployeeId').value,
      birth_date:         document.getElementById('EmployeeBirthdate').value,
      civil_status:       document.getElementById('EmployeeSivilStatus').textContent,
      nationality:        document.getElementById('EmployeeNationality').value,
      contact_number:     document.getElementById('EmployeeContactNumber').value,
      emergency_contact:  document.getElementById('EmployeeEmergencyContactNumber').value,
      email_address:      document.getElementById('EmployeeEmailAddress').value,
      current_address:    document.getElementById('EmployeeCurrentAddress').value,
      date_hired:         document.getElementById('EmployeeDateHired').value,
      employment_status:  document.getElementById('EmployeeStatus').textContent,
      shift:              document.getElementById('EmployeeShift').textContent,
      work_location:      document.getElementById('EmployeeWorkLocation').value,
      employee_type:      document.getElementById('EmployeeType').textContent,
      sss:                document.getElementById('EmployeeSSS').value,
      tin:                document.getElementById('EmployeeTIN').value,
      phil_health:        document.getElementById('EmployeePhilHealth').value,
      pag_ibig:           document.getElementById('EmployeePagIbig').value,
      national_id:        document.getElementById('EmployeeNationalId').value,
      basic_salary:       Number(document.getElementById('EmployeeBasicSalary').value),
      pay_type:           document.getElementById('EmployeePayType').textContent,
      payroll_channel:    document.getElementById('EmployeePayrollChannel').value,
      salary_level:       document.getElementById('EmployeeSalaryLevel').value,
      deductions:         document.getElementById('EmployeeDeduction').textContent,
      allowances:         document.getElementById('EmployeeAllowance').value,
      status:             document.getElementById('STATUS').textContent,
      separation_date:    document.getElementById('EmployeeSeparationDate').value,
      remarks:            document.getElementById('EmployeeRemarks').value,
      login_email:        document.getElementById('EmployeeEmailForLogin').value,
      system_role:        document.getElementById('EmployeeSystemRole').textContent,
      access_permissions: document.getElementById('EmployeeAccessPermission').value,
    };
    if (newPassword) updates.password = newPassword;

    try {
      const res = await fetch(`${API}/employees/${emp.employee_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error(await res.text());

      // Update local map
      const newName = updates.name;
      emp.name              = newName;
      emp.age               = updates.age;
      emp.gender            = updates.gender;
      emp.employeeId        = updates.employee_code;
      emp.employmentStatus  = updates.employment_status;
      emp.shift             = updates.shift;
      emp.status            = updates.status;
      // rename key if name changed
      if (newName !== currentEmployee) {
        employeeList[newName] = employeeList[currentEmployee];
        delete employeeList[currentEmployee];
        currentEmployee = newName;
      }
      renderEmployeeDetails(holdTrack, employeeList[currentEmployee]);
      Form.classList.remove('show-form');
      holdTrack = null;
    } catch (err) {
      console.error('Failed to save employee:', err);
      alert('Failed to save employee.');
    }
  });

  // ---- Manual Clock button ----
  btnManualClock.forEach(item => {
    item.addEventListener('click', function (event) {
      holdTrack = event.target.dataset.track;
      clock.classList.toggle('show-form');
    });
  });

  // ---- Clock In ----
  const cloneClockIn = clockIn.cloneNode(true);
  clockIn.parentNode.replaceChild(cloneClockIn, clockIn);

  cloneClockIn.addEventListener('click', async () => {
    // Find employee by track
    const empEntry = Object.entries(employeeList).find(([, v]) => String(v.employeeTrackNumber) === holdTrack);
    if (!empEntry) return;
    const [, emp] = empEntry;

    try {
      const res = await fetch(`${API}/employees/${emp.employee_id}/clock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action:               'clockIn',
          employee_code_input:  EmployeesClockPassword.value,
          manager_employee_code: AdminsPassword.value
        })
      });
      const result = await res.json();
      if (!res.ok) { alert(result.error || 'Clock in failed'); return; }
      emp.clockState = 'clockIn';
      console.log(`${emp.name} clocked in.`);
    } catch (err) {
      console.error(err);
      alert('Clock in failed.');
    }
    EmployeesClockPassword.value = '';
    AdminsPassword.value = '';
    holdTrack = null;
    clock.classList.remove('show-form');
  });

  // ---- Clock Out ----
  const cloneClockOut = clockOut.cloneNode(true);
  clockOut.parentNode.replaceChild(cloneClockOut, clockOut);

  cloneClockOut.addEventListener('click', async () => {
    const empEntry = Object.entries(employeeList).find(([, v]) => String(v.employeeTrackNumber) === holdTrack);
    if (!empEntry) return;
    const [, emp] = empEntry;

    try {
      const res = await fetch(`${API}/employees/${emp.employee_id}/clock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action:               'clockOut',
          employee_code_input:  EmployeesClockPassword.value,
          manager_employee_code: AdminsPassword.value
        })
      });
      const result = await res.json();
      if (!res.ok) { alert(result.error || 'Clock out failed'); return; }
      emp.clockState = 'clockOut';
      console.log(`${emp.name} clocked out.`);
    } catch (err) {
      console.error(err);
      alert('Clock out failed.');
    }
    EmployeesClockPassword.value = '';
    AdminsPassword.value = '';
    holdTrack = null;
    clock.classList.remove('show-form');
  });

  // ---- Back buttons ----
  if (Back) {
    Back.forEach(b => {
      b.addEventListener('click', () => {
        Form.classList.remove('show-form');
        clock.classList.remove('show-form');
        holdTrack = null;
      });
    });
  }
}

// ============================================================
// RENDER HELPERS
// ============================================================
export function renderEmployeeDetails(track, value) {
  const card = document.querySelector(`.employee-cards[data-track="${track}"]`);
  if (!card) return;
  const nameEl     = card.querySelector('.display-name');
  const positionEl = card.querySelector('.display-position span');
  const shiftEl    = card.querySelector('.display-shift strong');
  if (nameEl)     nameEl.textContent     = value.name;
  if (positionEl) positionEl.textContent = value.position;
  if (shiftEl)    shiftEl.textContent    = value.shift;
}

export function oneGoRenderingEmployeeList(data, container) {
  const fragment = document.createDocumentFragment();
  Object.entries(data).forEach(([, employee]) => {
    const card = document.createElement('div');
    card.className = 'employee-cards';
    card.dataset.track = employee.employeeTrackNumber;
    card.innerHTML = `
      <div class="employee-card boxes">
        <div class="employee-picture">
          <img src="../entities/image/employeeIcon.png" alt="">
        </div>
        <div class="employee-detail">
          <h4 class="display-name">${employee.name}</h4>
          <p class="display-position">Account<span>${employee.position}</span></p>
          <p class="display-shift"><strong>${employee.shift}</strong></p>
        </div>
        <div class="employee-button">
          <button data-track="${employee.employeeTrackNumber}" class="BtnDetails main-btn black-bg">More Details</button>
          <button data-track="${employee.employeeTrackNumber}" class="btnManualClock main-btn orange-bg">Manual Clock</button>
        </div>
      </div>
    `;
    fragment.appendChild(card);
  });
  container.innerHTML = '';
  container.appendChild(fragment);
  console.log('Rendered Employees');
}

function searchSuggestAutoComplete(input, list) {
  const keyword = input.value.trim().toLowerCase();
  const suggest = input.parentNode.nextElementSibling;
  if (input.value.length < 1) { suggest.innerHTML = ''; return; }
  const matched = list.filter(item => item.toLowerCase().includes(keyword));
  suggest.innerHTML = matched.map(item => `<div>${item}</div>`).join('');
  suggest.querySelectorAll('div').forEach(div => {
    div.addEventListener('click', () => { input.value = div.textContent; suggest.innerHTML = ''; });
  });
}

function searchManagers(input) {
  const keyword = input.value.toLowerCase().trim();
  const suggest = input.parentNode.nextElementSibling;
  if (input.value.length < 1) { suggest.innerHTML = ''; return; }
  let matched = [];
  for (const [key, value] of Object.entries(employeeList)) {
    if (value.position?.toLowerCase().includes('manager')) matched.push(key);
  }
  matched = matched.filter(item => item.toLowerCase().includes(keyword));
  suggest.innerHTML = matched.map(item => `<div>${item}</div>`).join('');
  suggest.querySelectorAll('div').forEach(item => {
    item.addEventListener('click', () => { input.value = item.textContent; suggest.innerHTML = ''; });
  });
}

function restAfterAddEmployee() {
  const form = document.getElementById("form");
  const main = document.getElementById("main");
  name.value = ''; employeeId.value = ''; age.value = '';
  birthDay.value = ''; nationality.value = ''; contactNumber.value = '';
  emergencyContactNumber.value = ''; emailAddress.value = '';
  currentAddress.value = ''; dateHired.value = '';
  employmentStatus.textContent = 'EMPLOYEE STATUS';
  position.value = ''; department.textContent = 'DEPARTMENT';
  manager.value = ''; shift.textContent = 'SHIFT';
  workLocation.value = ''; employeeType.textContent = 'EMPLOYEE TYPE';
  sss.value = ''; tin.value = ''; philHealth.value = '';
  pagIbig.value = ''; nationalId.value = ''; basicSalary.value = '';
  payType.textContent = 'PAY TYPE'; payrollChannel.value = '';
  salaryLevel.value = ''; allowances.value = '';
  status.textContent = 'STATUS'; remarks.value = '';
  loginEmail.value = ''; systemRole.textContent = 'SYSTEM ROLE';
  password.value = ''; accessPermissions.value = '';
  form.classList.remove("show-form");
  main.classList.remove("dis-scroll");
}