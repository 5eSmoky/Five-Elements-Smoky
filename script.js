const blockedDates = new Set([
  "2026-07-04",
  "2026-07-05",
  "2026-07-12",
  "2026-07-13",
  "2026-07-19",
  "2026-07-20",
  "2026-08-01",
  "2026-08-02",
  "2026-08-15",
  "2026-08-16",
  "2026-08-29",
  "2026-08-30",
]);

const monthLabel = document.querySelector("[data-month-label]");
const daysGrid = document.querySelector("[data-calendar-days]");
const prevButton = document.querySelector("[data-prev-month]");
const nextButton = document.querySelector("[data-next-month]");
const arrivalInput = document.querySelector("#arrival");
const departureInput = document.querySelector("#departure");
const form = document.querySelector(".booking-form");
const formNote = document.querySelector("[data-form-note]");

const today = new Date();
let visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedDates = [];

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDateKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatMonth(date) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function renderCalendar() {
  daysGrid.innerHTML = "";
  monthLabel.textContent = formatMonth(visibleMonth);

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  for (let index = 0; index < firstDay; index += 1) {
    const spacer = document.createElement("span");
    spacer.className = "day empty";
    daysGrid.appendChild(spacer);
  }

  for (let dayNumber = 1; dayNumber <= totalDays; dayNumber += 1) {
    const date = new Date(year, month, dayNumber);
    const key = toDateKey(date);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "day";
    button.textContent = dayNumber;

    if (date < new Date(today.getFullYear(), today.getMonth(), today.getDate()) || blockedDates.has(key)) {
      button.classList.add("blocked");
      button.disabled = true;
    }

    if (selectedDates.includes(key)) {
      button.classList.add("selected");
    }

    button.addEventListener("click", () => selectDate(key));
    daysGrid.appendChild(button);
  }
}

function selectDate(key) {
  if (selectedDates.length >= 2) {
    selectedDates = [];
  }

  selectedDates.push(key);
  selectedDates.sort();

  if (selectedDates[0]) {
    arrivalInput.value = selectedDates[0];
  }

  if (selectedDates[1]) {
    departureInput.value = selectedDates[1];
  } else {
    departureInput.value = "";
  }

  renderCalendar();
}

function syncCalendarToInput() {
  selectedDates = [arrivalInput.value, departureInput.value].filter(Boolean);
  const firstSelected = selectedDates[0] ? fromDateKey(selectedDates[0]) : visibleMonth;
  visibleMonth = new Date(firstSelected.getFullYear(), firstSelected.getMonth(), 1);
  renderCalendar();
}

prevButton.addEventListener("click", () => {
  visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
  renderCalendar();
});

nextButton.addEventListener("click", () => {
  visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
  renderCalendar();
});

arrivalInput.addEventListener("change", syncCalendarToInput);
departureInput.addEventListener("change", syncCalendarToInput);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const arrival = arrivalInput.value;
  const departure = departureInput.value;

  if (!arrival || !departure) {
    formNote.textContent = "Choose arrival and departure dates before sending your request.";
    return;
  }

  const hasBlockedNight = [...blockedDates].some((date) => date >= arrival && date < departure);

  if (hasBlockedNight) {
    formNote.textContent = "Those dates include an unavailable night. Please choose another range.";
    return;
  }

  formNote.textContent = "Request ready. Connect this form to email, Stripe, or a booking engine when you are ready to go live.";
});

renderCalendar();
