import {isPage, searchName, inputShow, keydown} from "./index.js";

const API = 'http://localhost:5001/api';

// ============================================================
// STATE
// ============================================================
export let employeeList = {};
export let employeeNumber = 0;

// ============================================================
// DOM REFS
// ============================================================
const Form               = document.getElementById('form2');
const clock              = document.getElementById('clock');
const Back               = document.querySelectorAll('.backInfo');
const submitNewEmployee  = document.getElementById("submitNewEmployee");
const employeeContainer  = document.querySelector(".show-employees");
const inputEmployees     = document.getElementById('searchInputEmployees');
const resultsBoxEmployees= document.getElementById('resultsEmployees');

const positions = {
  "Administration":        ["Office Administrator","Executive Assistant","Receptionist","Document Controller"],
  "Sales":                 ["Sales Executive","Sales Manager","Account Executive","Business Development Officer","Salesman"],
  "Marketing":             ["Marketing Specialist","Content Creator","Digital Marketing Officer","Brand Manager"],
  "Finance":               ["Accountant","Bookkeeper","Finance Analyst","Payroll Officer"],
  "Customer Support":      ["Customer Service Representative","Support Lead","Call Center Agent","Helpdesk Coordinator"],
  "Mechanics":             ["Automotive Technician","Diesel Mechanic","Maintenance Mechanic","Shop Supervisor"],
  "Drivers":               ["Company Driver","Delivery Driver","Forklift Operator","Logistics Driver"],
  "Logistics":             ["Logistics Coordinator","Warehouse Associate","Inventory Controller","Supply Chain Officer"],
  "Human Resources":       ["HR Officer","Recruitment Specialist","HR Assistant","Training and Development Officer"],
  "IT Support":            ["IT Technician","System Administrator","Help Desk Support","Network Engineer"],
  "Security":              ["Security Guard","Security Supervisor","CCTV Operator","Access Control Officer"],
  "Cleaning & Maintenance":["Janitor","Maintenance Technician","Facility Cleaner","Utility Worker"]
};

// ============================================================
// ADD FORM — field refs (all dropdowns now use element refs for .textContent)
// ============================================================
const department         = document.getElementById("department");
const form               = document.getElementById("form");
const name               = document.getElementById("name");
const employeeId         = document.getElementById("employeeId");
const age                = document.getElementById("age");
const birthDay           = document.getElementById("birthDate");
const nationality        = document.getElementById("nationality");        // dropdown → .textContent
const contactNumber      = document.getElementById("contactNumber");
const emergencyContactNumber = document.getElementById("emergencyContactNumber");
const emailAddress       = document.getElementById("emailAddress");
const currentAddress     = document.getElementById("currentAddress");
const dateHired          = document.getElementById("dateHired");
const employmentStatus   = document.getElementById("employeeStatus");    // dropdown → .textContent
const shift              = document.getElementById("shift");              // dropdown → .textContent
const employeeType       = document.getElementById("employeeType");      // dropdown → .textContent
const sss                = document.getElementById("sss");
const tin                = document.getElementById("tin");
const philHealth         = document.getElementById("philHealth");
const pagIbig            = document.getElementById("pagIbig");
const nationalId         = document.getElementById("nationalId");
const basicSalary        = document.getElementById("basicSalary");
const payType            = document.getElementById("payType");            // dropdown → .textContent
const status             = document.getElementById("status");             // dropdown → .textContent
const remarks            = document.getElementById("remarks");
const loginEmail         = document.getElementById("loginEmail");
const systemRole         = document.getElementById("systemRole");        // dropdown → .textContent
const password           = document.getElementById("password");
const manager            = document.getElementById("manager");            // search input → .value
const position           = document.getElementById("position");           // search input → .value
// These 5 are now dropdowns in HTML → use getElementById + .textContent at read time
// workLocation, payrollChannel, salaryLevel, allowances, accessPermissions

// ============================================================
// EDIT FORM (form2) — search input refs for autocomplete listeners
// ============================================================
const managerForm           = document.getElementById("EmployeeManager");
const positionForm          = document.getElementById("EmployeePosition");
const workLocationForm      = document.getElementById("EmployeeWorkLocation");
const payrollChannelForm    = document.getElementById("EmployeePayrollChannel");
const salaryLevelForm       = document.getElementById("EmployeeSalaryLevel");
const allowancesForm        = document.getElementById("EmployeeAllowance");
const accessPermissionsForm = document.getElementById("EmployeeAccessPermission");

export let latestMatchedEmployees = {};

// ============================================================
// HELPERS — read a field that may be either dropdown or input
// ============================================================
function readField(id, mode = 'value') {
  const el = document.getElementById(id);
  if (!el) return '';
  return mode === 'text' ? el.textContent.trim() : el.value.trim();
}

function buildEmployeeMap(apiArray) {
  const map = {};
  apiArray.forEach(emp => {
    map[emp.name] = {
      employee_id:            emp.employee_id,
      name:                   emp.name,
      age:                    emp.age,
      gender:                 emp.gender,
      employeeId:             emp.employee_code,
      birthDay:               emp.birth_date   ? emp.birth_date.split('T')[0]  : '',
      civilStatus:            emp.civil_status,
      nationality:            emp.nationality,
      contactNumber:          emp.contact_number,
      emergencyContactNumber: emp.emergency_contact,
      emailAddress:           emp.email_address,
      currentAddress:         emp.current_address,
      dateHired:              emp.date_hired   ? emp.date_hired.split('T')[0]   : '',
      employmentStatus:       emp.employment_status,
      position:               emp.position_title || '',
      department:             emp.department_name || '',
      manager:                '',
      shift:                  emp.shift,
      workLocation:           emp.work_location,
      employeeType:           emp.employee_type,
      sss:                    emp.sss,
      tin:                    emp.tin,
      philHealth:             emp.phil_health,
      pagIbig:                emp.pag_ibig,
      nationalId:             emp.national_id,
      basicSalary:            emp.basic_salary,
      payType:                emp.pay_type,
      payrollChannel:         emp.payroll_channel,
      salaryLevel:            emp.salary_level,
      allowances:             emp.allowances,
      deductions:             emp.deductions,
      status:                 emp.status,
      separationDate:         emp.separation_date || null,
      remarks:                emp.remarks,
      loginEmail:             emp.login_email,
      systemRole:             emp.system_role,
      password:               '',
      accessPermissions:      emp.access_permissions,
      employeeTrackNumber:    emp.track_number,
      clockState:             emp.clock_state,
      timeRendered:           emp.time_rendered,
      manager_id:             emp.manager_id,
      department_id:          emp.department_id,
      position_id:            emp.position_id
    };
  });
  return map;
}

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", async function () {
  if (!isPage("employeePage")) return;

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

  // ---- Search bar ----
  inputEmployees.addEventListener('input', () => {
    inputShow(inputEmployees, resultsBoxEmployees, latestMatchedEmployees, searchName, employeeList, oneGoRenderingEmployeeList, employeeContainer);
    bindEmployeeButtons();
  });
  inputEmployees.addEventListener("keydown", function (event) {
    keydown(event, inputEmployees, oneGoRenderingEmployeeList, employeeList, employeeContainer, latestMatchedEmployees, searchName, resultsBoxEmployees);
    bindEmployeeButtons();
  });

  // ---- Edit form (form2) autocomplete listeners ----
  managerForm.addEventListener('input', () => searchManagers(managerForm));
  positionForm.addEventListener('input', () => {
    const dept = departmentForm.textContent.trim();
    if (dept === 'DEPARTMENT') { window.alert('SELECT DEPARTMENT FIRST!'); return; }
    searchSuggestAutoComplete(positionForm, positions[dept] || []);
  });
  workLocationForm.addEventListener('input',    () => searchSuggestAutoComplete(workLocationForm,   worklocations));
  payrollChannelForm.addEventListener('input',  () => searchSuggestAutoComplete(payrollChannelForm, salaryChannel));
  salaryLevelForm.addEventListener('input',     () => searchSuggestAutoComplete(salaryLevelForm,    salaryLevels));
  allowancesForm.addEventListener('input',      () => searchSuggestAutoComplete(allowancesForm,     allAllowances));
  accessPermissionsForm.addEventListener('input',() => searchSuggestAutoComplete(accessPermissionsForm, allAccessPermissions));

  // ---- Add form autocomplete listeners (search inputs still in add form) ----
  manager.addEventListener('input', () => searchManagers(manager));
  position.addEventListener('input', () => {
    const dept = department.textContent.trim();
    if (dept === 'DEPARTMENT') { window.alert('SELECT DEPARTMENT FIRST!'); return; }
    searchSuggestAutoComplete(position, positions[dept] || []);
  });

  // ---- Submit new employee ----
  submitNewEmployee.addEventListener("click", async function () {
    const errors = validateNewEmployee();
    if (errors.length > 0) {
      alert('Please fix the following:\n\n' + errors.map((e, i) => `${i + 1}. ${e}`).join('\n'));
      return;
    }

    const genderVal      = document.querySelector('input[name="gender"]:checked');
    const civilStatusVal = document.querySelector('input[name="civilStatus"]:checked');

    try {
      const res = await fetch(`${API}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_code:      employeeId.value.trim(),
          track_number:       String(employeeNumber + 1).padStart(4, '0'),
          name:               name.value.trim(),
          age:                Number(age.value),
          gender:             genderVal.value,
          birth_date:         birthDay.value,
          civil_status:       civilStatusVal.value,
          nationality:        nationality.textContent.trim(),
          contact_number:     contactNumber.value.trim(),
          emergency_contact:  emergencyContactNumber.value.trim(),
          email_address:      emailAddress.value.trim(),
          current_address:    currentAddress.value.trim(),
          date_hired:         dateHired.value,
          employment_status:  employmentStatus.textContent.trim(),
          shift:              shift.textContent.trim(),
          work_location:      readField('workLocation', 'text'),
          employee_type:      employeeType.textContent.trim(),
          sss:                sss.value.trim(),
          tin:                tin.value.trim(),
          phil_health:        philHealth.value.trim(),
          pag_ibig:           pagIbig.value.trim(),
          national_id:        nationalId.value.trim(),
          basic_salary:       Number(basicSalary.value),
          pay_type:           payType.textContent.trim(),
          payroll_channel:    readField('payrollChannel', 'text'),
          salary_level:       readField('salaryLevel', 'text'),
          allowances:         readField('allowances', 'text'),
          status:             status.textContent.trim(),
          remarks:            remarks.value.trim(),
          login_email:        loginEmail.value.trim(),
          system_role:        systemRole.textContent.trim(),
          password:           password.value,
          access_permissions: readField('accessPermissions', 'text'),
          department_name:    department.textContent.trim(),
          position_title:     position.value.trim(),
          manager_name:       manager.value.trim() || null,
        })
      });

      if (!res.ok) {
        const err = await res.json();
        alert('Server error: ' + (err.error || 'Unknown error'));
        return;
      }

      employeeNumber++;
      const refreshed     = await fetch(`${API}/employees`);
      const refreshedData = await refreshed.json();
      Object.keys(employeeList).forEach(k => delete employeeList[k]);
      Object.assign(employeeList, buildEmployeeMap(refreshedData));
      oneGoRenderingEmployeeList(employeeList, employeeContainer);
      bindEmployeeButtons();
      restAfterAddEmployee();
      alert('Employee added successfully!');
    } catch (err) {
      console.error('Failed to add employee:', err);
      alert('Network error. Check console.');
    }
  });

  bindEmployeeButtons();
});

// ============================================================
// EXPORTED
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
  const BtnDetails             = document.querySelectorAll('.BtnDetails');
  const btnManualClock         = document.querySelectorAll('.btnManualClock');
  const save                   = document.getElementById('save');
  const clockIn                = document.getElementById('clockIn');
  const clockOut               = document.getElementById('clockOut');
  const AdminsPassword         = document.getElementById('AdminsPassword');
  const EmployeesClockPassword = document.getElementById('EmployeesClockPassword');

  let holdTrack       = null;
  let currentEmployee = null;

  // ---- More Details — populate edit form ----
  BtnDetails.forEach(item => {
    item.addEventListener('click', function (event) {
      const track = event.target.dataset.track;
      holdTrack = track;
      if (!Form) return;
      Form.classList.add('show-form');
      let found = false;

      for (const [key, v] of Object.entries(employeeList)) {
        if (String(v.employeeTrackNumber) === track) {
          found = true;

          // ---- Plain inputs ----
          document.getElementById('EmployeeName').value                   = v.name        || '';
          document.getElementById('EmployeeAge').value                    = v.age         || '';
          document.getElementById('EmployeeId').value                     = v.employeeId  || '';
          document.getElementById('EmployeeBirthdate').value              = v.birthDay    || '';
          document.getElementById('EmployeeNationality').value            = v.nationality || '';
          document.getElementById('EmployeeContactNumber').value          = v.contactNumber || '';
          document.getElementById('EmployeeEmergencyContactNumber').value = v.emergencyContactNumber || '';
          document.getElementById('EmployeeEmailAddress').value           = v.emailAddress  || '';
          document.getElementById('EmployeeCurrentAddress').value         = v.currentAddress || '';
          document.getElementById('EmployeeDateHired').value              = v.dateHired   || '';
          document.getElementById('EmployeeSSS').value                    = v.sss         || '';
          document.getElementById('EmployeeTIN').value                    = v.tin         || '';
          document.getElementById('EmployeePhilHealth').value             = v.philHealth  || '';
          document.getElementById('EmployeePagIbig').value                = v.pagIbig     || '';
          document.getElementById('EmployeeNationalId').value             = v.nationalId  || '';
          document.getElementById('EmployeeBasicSalary').value            = v.basicSalary || '';
          document.getElementById('EmployeeSeparationDate').value         = v.separationDate || '';
          document.getElementById('EmployeeRemarks').value                = v.remarks     || '';
          document.getElementById('EmployeeEmailForLogin').value          = v.loginEmail  || '';
          document.getElementById('employeePassword').value               = '';           // never prefill

          // ---- Search inputs (autocomplete) ----
          document.getElementById('EmployeePosition').value               = v.position    || '';
          document.getElementById('EmployeeManager').value                = v.manager     || '';
          document.getElementById('EmployeeWorkLocation').value           = v.workLocation || '';
          document.getElementById('EmployeePayrollChannel').value         = v.payrollChannel || '';
          document.getElementById('EmployeeSalaryLevel').value            = v.salaryLevel || '';
          document.getElementById('EmployeeAllowance').value              = v.allowances  || '';
          document.getElementById('EmployeeAccessPermission').value       = v.accessPermissions || '';

          // ---- Dropdowns → set .textContent ----
          document.getElementById('EmployeeSivilStatus').textContent      = v.civilStatus        || '';
          document.getElementById('EmployeeStatus').textContent           = v.employmentStatus   || '';
          document.getElementById('EmployeeDepartment').textContent       = v.department         || '';
          document.getElementById('EmployeeShift').textContent            = v.shift              || '';
          document.getElementById('EmployeeType').textContent             = v.employeeType       || '';
          document.getElementById('EmployeePayType').textContent          = v.payType            || '';
          document.getElementById('EmployeeDeduction').textContent        = v.deductions         || '';
          document.getElementById('STATUS').textContent                   = v.status             || '';
          document.getElementById('EmployeeSystemRole').textContent       = v.systemRole         || '';

          // ---- Gender radio ----
          const genderInput = document.querySelector(`input[name="EmployeeGender"][value="${v.gender}"]`);
          if (genderInput) genderInput.checked = true;

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
    const emp         = employeeList[currentEmployee];
    const newPassword = document.getElementById('employeePassword').value;

    const updates = {
      // plain inputs
      name:               document.getElementById('EmployeeName').value.trim(),
      age:                Number(document.getElementById('EmployeeAge').value),
      gender:             document.querySelector('input[name="EmployeeGender"]:checked')?.value,
      employee_code:      document.getElementById('EmployeeId').value.trim(),
      birth_date:         document.getElementById('EmployeeBirthdate').value   || null,
      nationality:        document.getElementById('EmployeeNationality').value.trim(),
      contact_number:     document.getElementById('EmployeeContactNumber').value.trim(),
      emergency_contact:  document.getElementById('EmployeeEmergencyContactNumber').value.trim(),
      email_address:      document.getElementById('EmployeeEmailAddress').value.trim(),
      current_address:    document.getElementById('EmployeeCurrentAddress').value.trim(),
      date_hired:         document.getElementById('EmployeeDateHired').value   || null,
      sss:                document.getElementById('EmployeeSSS').value.trim(),
      tin:                document.getElementById('EmployeeTIN').value.trim(),
      phil_health:        document.getElementById('EmployeePhilHealth').value.trim(),
      pag_ibig:           document.getElementById('EmployeePagIbig').value.trim(),
      national_id:        document.getElementById('EmployeeNationalId').value.trim(),
      basic_salary:       Number(document.getElementById('EmployeeBasicSalary').value),
      separation_date:    document.getElementById('EmployeeSeparationDate').value || null,
      remarks:            document.getElementById('EmployeeRemarks').value.trim(),
      login_email:        document.getElementById('EmployeeEmailForLogin').value.trim(),

      // search-input fields (still .value in edit form)
      position_title:     document.getElementById('EmployeePosition').value.trim(),
      manager_name:       document.getElementById('EmployeeManager').value.trim() || null,
      work_location:      document.getElementById('EmployeeWorkLocation').value.trim(),
      payroll_channel:    document.getElementById('EmployeePayrollChannel').value.trim(),
      salary_level:       document.getElementById('EmployeeSalaryLevel').value.trim(),
      allowances:         document.getElementById('EmployeeAllowance').value.trim(),
      access_permissions: document.getElementById('EmployeeAccessPermission').value.trim(),

      // dropdown fields → .textContent
      civil_status:       document.getElementById('EmployeeSivilStatus').textContent.trim(),
      employment_status:  document.getElementById('EmployeeStatus').textContent.trim(),
      department_name:    document.getElementById('EmployeeDepartment').textContent.trim(),
      shift:              document.getElementById('EmployeeShift').textContent.trim(),
      employee_type:      document.getElementById('EmployeeType').textContent.trim(),
      pay_type:           document.getElementById('EmployeePayType').textContent.trim(),
      deductions:         document.getElementById('EmployeeDeduction').textContent.trim(),
      status:             document.getElementById('STATUS').textContent.trim(),
      system_role:        document.getElementById('EmployeeSystemRole').textContent.trim(),
    };

    if (newPassword) updates.password = newPassword;

    try {
      const res = await fetch(`${API}/employees/${emp.employee_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) {
        const err = await res.json();
        alert('Server error: ' + (err.error || 'Unknown error'));
        return;
      }

      // Sync local map
      const newName = updates.name;
      emp.name             = newName;
      emp.age              = updates.age;
      emp.gender           = updates.gender;
      emp.employeeId       = updates.employee_code;
      emp.civilStatus      = updates.civil_status;
      emp.nationality      = updates.nationality;
      emp.contactNumber    = updates.contact_number;
      emp.emergencyContactNumber = updates.emergency_contact;
      emp.emailAddress     = updates.email_address;
      emp.currentAddress   = updates.current_address;
      emp.birthDay         = updates.birth_date;
      emp.dateHired        = updates.date_hired;
      emp.employmentStatus = updates.employment_status;
      emp.department       = updates.department_name;
      emp.position         = updates.position_title;
      emp.shift            = updates.shift;
      emp.workLocation     = updates.work_location;
      emp.employeeType     = updates.employee_type;
      emp.sss              = updates.sss;
      emp.tin              = updates.tin;
      emp.philHealth       = updates.phil_health;
      emp.pagIbig          = updates.pag_ibig;
      emp.nationalId       = updates.national_id;
      emp.basicSalary      = updates.basic_salary;
      emp.payType          = updates.pay_type;
      emp.payrollChannel   = updates.payroll_channel;
      emp.salaryLevel      = updates.salary_level;
      emp.deductions       = updates.deductions;
      emp.allowances       = updates.allowances;
      emp.status           = updates.status;
      emp.separationDate   = updates.separation_date;
      emp.remarks          = updates.remarks;
      emp.loginEmail       = updates.login_email;
      emp.systemRole       = updates.system_role;
      emp.accessPermissions= updates.access_permissions;

      if (newName !== currentEmployee) {
        employeeList[newName] = employeeList[currentEmployee];
        delete employeeList[currentEmployee];
        currentEmployee = newName;
      }

      renderEmployeeDetails(holdTrack, employeeList[currentEmployee]);
      Form.classList.remove('show-form');
      holdTrack = null;
      alert('Employee saved successfully!');
    } catch (err) {
      console.error('Failed to save employee:', err);
      alert('Failed to save employee.');
    }
  });

  // ---- Manual Clock ----
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
    const empEntry = Object.entries(employeeList).find(([, v]) => String(v.employeeTrackNumber) === holdTrack);
    if (!empEntry) return;
    const [, emp] = empEntry;
    try {
      const res = await fetch(`${API}/employees/${emp.employee_id}/clock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action:                'clockIn',
          employee_code_input:   EmployeesClockPassword.value,
          manager_employee_code: AdminsPassword.value
        })
      });
      const result = await res.json();
      if (!res.ok) { alert(result.error || 'Clock in failed'); return; }
      emp.clockState = 'clockIn';
    } catch (err) {
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
          action:                'clockOut',
          employee_code_input:   EmployeesClockPassword.value,
          manager_employee_code: AdminsPassword.value
        })
      });
      const result = await res.json();
      if (!res.ok) { alert(result.error || 'Clock out failed'); return; }
      emp.clockState = 'clockOut';
    } catch (err) {
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
// RENDER
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

// ============================================================
// AUTOCOMPLETE HELPERS
// ============================================================
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

// ============================================================
// RESET ADD FORM
// ============================================================
function restAfterAddEmployee() {
  const form = document.getElementById("form");
  const main = document.getElementById("main");

  // plain inputs
  name.value = ''; employeeId.value = ''; age.value = '';
  birthDay.value = '';
  contactNumber.value = ''; emergencyContactNumber.value = '';
  emailAddress.value = ''; currentAddress.value = '';
  dateHired.value = ''; sss.value = ''; tin.value = '';
  philHealth.value = ''; pagIbig.value = ''; nationalId.value = '';
  basicSalary.value = ''; remarks.value = '';
  loginEmail.value = ''; password.value = '';

  // search inputs
  manager.value = ''; position.value = '';

  // dropdowns — reset to placeholder text
  nationality.textContent      = 'NATIONALITY';
  employmentStatus.textContent = 'EMPLOYEE STATUS';
  department.textContent       = 'DEPARTMENT';
  shift.textContent            = 'SHIFT';
  employeeType.textContent     = 'EMPLOYEE TYPE';
  payType.textContent          = 'PAY TYPE';
  status.textContent           = 'STATUS';
  systemRole.textContent       = 'SYSTEM ROLE';
  readField('workLocation',    'text'); // just referencing — actual reset below
  document.getElementById('workLocation').textContent    = 'WORK LOCATION';
  document.getElementById('payrollChannel').textContent  = 'PAYROLL CHANNEL';
  document.getElementById('salaryLevel').textContent     = 'SALARY LEVEL';
  document.getElementById('allowances').textContent      = 'ALLOWANCES';
  document.getElementById('accessPermissions').textContent = 'ACCESS PERMISSION';

  form.classList.remove("show-form");
  main.classList.remove("dis-scroll");
}

// ============================================================
// VALIDATION
// ============================================================
function validateNewEmployee() {
  const errors = [];

  const nameVal       = name.value.trim();
  const idVal         = employeeId.value.trim();
  const ageVal        = Number(age.value);
  const birthVal      = birthDay.value;
  const genderVal     = document.querySelector('input[name="gender"]:checked');
  const civilVal      = document.querySelector('input[name="civilStatus"]:checked');
  const natVal        = nationality.textContent.trim();
  const contactVal    = contactNumber.value.trim();
  const emailVal      = emailAddress.value.trim();
  const dateHiredVal  = dateHired.value;
  const empStatusVal  = employmentStatus.textContent.trim();
  const deptVal       = department.textContent.trim();
  const shiftVal      = shift.textContent.trim();
  const empTypeVal    = employeeType.textContent.trim();
  const salaryVal     = Number(basicSalary.value);
  const payTypeVal    = payType.textContent.trim();
  const statusVal     = status.textContent.trim();
  const loginEmailVal = loginEmail.value.trim();
  const roleVal       = systemRole.textContent.trim();
  const passVal       = password.value.trim();
  const wlVal         = document.getElementById('workLocation').textContent.trim();
  const pcVal         = document.getElementById('payrollChannel').textContent.trim();
  const slVal         = document.getElementById('salaryLevel').textContent.trim();

  if (!nameVal)                                       errors.push('Full Name is required.');
  if (!idVal)                                         errors.push('Employee ID is required.');
  if (!ageVal || ageVal < 18 || ageVal > 70)          errors.push('Age must be between 18 and 70.');
  if (!birthVal)                                      errors.push('Date of Birth is required.');
  if (!genderVal)                                     errors.push('Gender is required.');
  if (!civilVal)                                      errors.push('Civil Status is required.');
  if (natVal === 'NATIONALITY')                       errors.push('Nationality is required.');
  if (!/^\d{10,15}$/.test(contactVal))                errors.push('Contact Number must be 10–15 digits only.');
  if (!emailVal || !emailVal.includes('@'))            errors.push('A valid Email Address is required.');
  if (!dateHiredVal)                                  errors.push('Date Hired is required.');
  if (empStatusVal === 'EMPLOYEE STATUS')             errors.push('Employment Status is required.');
  if (deptVal === 'DEPARTMENT')                       errors.push('Department is required.');
  if (shiftVal === 'SHIFT')                           errors.push('Shift is required.');
  if (empTypeVal === 'EMPLOYEE TYPE')                 errors.push('Employee Type is required.');
  if (!salaryVal || salaryVal <= 0)                   errors.push('Basic Salary must be a positive number.');
  if (payTypeVal === 'PAY TYPE')                      errors.push('Pay Type is required.');
  if (statusVal === 'STATUS')                         errors.push('Status is required.');
  if (!loginEmailVal || !loginEmailVal.includes('@')) errors.push('Login Email is required.');
  if (roleVal === 'SYSTEM ROLE')                      errors.push('System Role is required.');
  if (passVal.length < 6)                             errors.push('Password must be at least 6 characters.');
  if (wlVal === 'WORK LOCATION')                      errors.push('Work Location is required.');
  if (pcVal === 'PAYROLL CHANNEL')                    errors.push('Payroll Channel is required.');
  if (slVal === 'SALARY LEVEL')                       errors.push('Salary Level is required.');

  return errors;
}

// list constants used by autocomplete (still needed for edit form search inputs)
const worklocations   = ["Main Office - Manila","Cebu Branch","Remote","Laguna Plant","Davao Satellite","Work from Home"];
const salaryChannel   = ["Bank Transfer","BDO","GCash","Maya","Check","Cash Pickup"];
const salaryLevels    = ["Level 1 - Entry","Level 2 - Junior","Level 3 - Mid-Level","Level 4 - Senior","Level 5 - Lead","Level 6 - Executive"];
const allAllowances   = ["Transportation Allowance","Meal Allowance","Internet Stipend","Housing Allowance","Hazard Pay","Night Shift Differential"];
const allAccessPermissions = ["View Payroll","Edit Employee Data","Approve Leave","Access HR Dashboard","Modify Roles","View Reports"];