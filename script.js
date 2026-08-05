// Contador de Horas com calendário e notas
// Salva dados no localStorage: dayHours (obj), notes (string)

(() => {
  // Keys
  const KEY_DAY_HOURS = 'hd_day_hours_v1';
  const KEY_NOTES = 'hd_notes_v1';

  // State
  let current = new Date(); // month/year render
  let dayHours = {}; // { 'YYYY-MM-DD': number }
  let selectedDateISO = null;

  // Elements
  const totalEl = document.getElementById('totalHours');
  const increaseBtn = document.getElementById('increase');
  const decreaseBtn = document.getElementById('decrease');
  const customInput = document.getElementById('customHours');
  const addCustomBtn = document.getElementById('addCustom');
  const subCustomBtn = document.getElementById('subCustom');
  const resetBtn = document.getElementById('resetHours');

  const notesEl = document.getElementById('notes');
  const saveNotesBtn = document.getElementById('saveNotes');
  const clearNotesBtn = document.getElementById('clearNotes');

  const monthYearEl = document.getElementById('monthYear');
  const prevBtn = document.getElementById('prevMonth');
  const nextBtn = document.getElementById('nextMonth');
  const calendarEl = document.getElementById('calendar');

  // Modal
  const modal = document.getElementById('dayModal');
  const modalDate = document.getElementById('modalDate');
  const modalHours = document.getElementById('modalHours');
  const saveDayHoursBtn = document.getElementById('saveDayHours');
  const clearDayHoursBtn = document.getElementById('clearDayHours');
  const closeModalBtn = document.getElementById('closeModal');

  // Helpers
  const iso = (d) => d.toISOString().slice(0,10);
  const pad = (n) => n.toString().padStart(2,'0');
  function formatHours(v){
    return Number(v || 0).toFixed(2);
  }

  // Persistence
  function load(){
    try{
      const raw = localStorage.getItem(KEY_DAY_HOURS);
      dayHours = raw ? JSON.parse(raw) : {};
    }catch(e){ dayHours = {} }

    try{
      const notes = localStorage.getItem(KEY_NOTES) || '';
      notesEl.value = notes;
    }catch(e){}
  }
  function saveDayHoursStorage(){
    localStorage.setItem(KEY_DAY_HOURS, JSON.stringify(dayHours));
  }
  function saveNotes(){
    localStorage.setItem(KEY_NOTES, notesEl.value);
  }

  // Calculate total as sum of dayHours
  function computeTotal(){
    const sum = Object.values(dayHours).reduce((a,b) => a + Number(b || 0), 0);
    return sum;
  }

  function renderTotal(){
    totalEl.textContent = formatHours(computeTotal());
  }

  // Calendar rendering
  function renderCalendar(){
    calendarEl.innerHTML = '';
    const year = current.getFullYear();
    const month = current.getMonth();

    monthYearEl.textContent = current.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

    // first day of month
    const first = new Date(year, month, 1);
    const startWeekday = first.getDay(); // 0=Sun

    // days in month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // previous month tail
    const prevDays = startWeekday;
    const prevMonthLast = new Date(year, month, 0).getDate();

    // total cells to render = prevDays + daysInMonth + next tail until multiple of 7
    const totalCells = Math.ceil((prevDays + daysInMonth)/7) * 7;

    for(let i=0;i<totalCells;i++){
      const cell = document.createElement('div');
      cell.className = 'day';

      // compute date number
      const dayIndex = i - prevDays + 1;
      let cellDate;
      if(dayIndex <= 0){
        // previous month
        const d = prevMonthLast + dayIndex;
        cell.classList.add('disabled');
        cellDate = new Date(year, month - 1, d);
      } else if(dayIndex > daysInMonth){
        // next month
        const d = dayIndex - daysInMonth;
        cell.classList.add('disabled');
        cellDate = new Date(year, month + 1, d);
      } else {
        // current month
        cellDate = new Date(year, month, dayIndex);
      }

      const dateNum = cellDate.getDate();
      const dateEl = document.createElement('div');
      dateEl.className = 'date';
      dateEl.textContent = dateNum;
      cell.appendChild(dateEl);

      // hours badge if for this date
      const key = iso(cellDate);
      const hrs = Number(dayHours[key] || 0);
      if(hrs > 0){
        const b = document.createElement('div');
        b.className = 'hours-badge';
        b.textContent = formatHours(hrs);
        cell.appendChild(b);
      }

      // only allow clicking days of current month
      if(cell.classList.contains('disabled')){
        // nothing
      } else {
        cell.addEventListener('click', () => openDayModal(key, cellDate));
      }

      calendarEl.appendChild(cell);
    }

    renderTotal();
  }

  // Modal behaviour
  function openDayModal(dateKey, dateObj){
    selectedDateISO = dateKey;
    modalDate.textContent = dateObj.toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });
    modalHours.value = Number(dayHours[dateKey] || 0);
    modal.classList.remove('hidden');
    modalHours.focus();
  }

  function closeModal(){
    selectedDateISO = null;
    modal.classList.add('hidden');
  }

  // Day save/clear
  function saveDayFromModal(){
    const v = Number(modalHours.value || 0);
    if(selectedDateISO == null) return;
    if(v > 0){
      dayHours[selectedDateISO] = v;
    } else {
      delete dayHours[selectedDateISO];
    }
    saveDayHoursStorage();
    renderCalendar();
    closeModal();
  }

  function clearDayFromModal(){
    if(selectedDateISO == null) return;
    delete dayHours[selectedDateISO];
    saveDayHoursStorage();
    renderCalendar();
    closeModal();
  }

  // Buttons
  function changeTotalBy(delta){
    // apply delta to today's date by default OR to last active month? We'll add to current day
    const todayKey = iso(new Date());
    const newVal = Number(dayHours[todayKey] || 0) + delta;
    if(newVal <= 0){
      delete dayHours[todayKey];
    } else {
      dayHours[todayKey] = Math.round(newVal * 100) / 100;
    }
    saveDayHoursStorage();
    renderCalendar();
  }

  // Custom add/subtract - apply to today's date
  function applyCustom(add=true){
    const v = Number(customInput.value);
    if(!v || isNaN(v)) return;
    const todayKey = iso(new Date());
    const base = Number(dayHours[todayKey] || 0);
    const res = add ? base + v : base - v;
    if(res <= 0){
      delete dayHours[todayKey];
    } else {
      dayHours[todayKey] = Math.round(res * 100) / 100;
    }
    saveDayHoursStorage();
    renderCalendar();
    customInput.value = '';
  }

  // Reset all
  function resetAll(){
    if(!confirm('Deseja realmente resetar todas as horas? Esta ação não pode ser desfeita.')) return;
    dayHours = {};
    saveDayHoursStorage();
    renderCalendar();
  }

  // Notes
  function saveNotesHandler(){
    saveNotes();
    alert('Notas salvas localmente.');
  }
  function clearNotesHandler(){
    if(!confirm('Limpar todas as anotações?')) return;
    notesEl.value = '';
    saveNotes();
  }

  // Month navigation
  function goMonth(delta){
    current = new Date(current.getFullYear(), current.getMonth() + delta, 1);
    renderCalendar();
  }

  // Keyboard: Esc to close modal
  window.addEventListener('keydown', (e) => {
    if(e.key === 'Escape') closeModal();
  });

  // Init
  function init(){
    load();
    renderCalendar();

    // events
    increaseBtn.addEventListener('click', () => changeTotalBy(0.25));
    decreaseBtn.addEventListener('click', () => changeTotalBy(-0.25));

    addCustomBtn.addEventListener('click', () => applyCustom(true));
    subCustomBtn.addEventListener('click', () => applyCustom(false));
    resetBtn.addEventListener('click', resetAll);

    saveNotesBtn.addEventListener('click', saveNotesHandler);
    clearNotesBtn.addEventListener('click', clearNotesHandler);

    prevBtn.addEventListener('click', () => goMonth(-1));
    nextBtn.addEventListener('click', () => goMonth(1));

    saveDayHoursBtn.addEventListener('click', saveDayFromModal);
    clearDayHoursBtn.addEventListener('click', clearDayFromModal);
    closeModalBtn.addEventListener('click', closeModal);

    // click outside modal to close
    modal.addEventListener('click', (e) => {
      if(e.target === modal) closeModal();
    });

    // Save notes on Ctrl/Cmd+S while focused
    window.addEventListener('keydown', (e) => {
      if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's'){
        e.preventDefault();
        saveNotes();
        alert('Notas salvas localmente.');
      }
    });
  }

  // start
  init();
})();