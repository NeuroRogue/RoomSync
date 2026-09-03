// DOM Elements
const grid = document.getElementById('resource-grid');
const searchInput = document.getElementById('filter-search');
const typeFilter = document.getElementById('filter-category');
const statusFilter = document.getElementById('filter-status');

// Stats
const statFree = document.getElementById('stat-free');
const statOccupied = document.getElementById('stat-occupied');
const statBooked = document.getElementById('stat-booked');

// Simulation controls
const timeDisplay = document.getElementById('sim-time-display');
const btnAdd15m = document.getElementById('btn-add-15m');
const btnAdd1h = document.getElementById('btn-add-1h');
const btnResetTime = document.getElementById('btn-reset-time');

// Modal
const modal = document.getElementById('booking-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelBooking = document.getElementById('btn-cancel-booking');
const bookingForm = document.getElementById('booking-form');
const errorMsg = document.getElementById('booking-error');

let currentData = [];

// Format helpers
const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const toDatetimeLocal = (date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

function init() {
    initializeData();
    updateTimeDisplay(getSimulatedTime());
    
    onTimeChange((newTime) => {
        updateTimeDisplay(newTime);
        render(); // Re-render to update statuses live
    });

    setupEventListeners();
    render();
}

function updateTimeDisplay(date) {
    timeDisplay.textContent = 'Sim Time: ' + formatTime(date);
}

function setupEventListeners() {
    searchInput.addEventListener('input', render);
    typeFilter.addEventListener('change', render);
    statusFilter.addEventListener('change', render);

    btnAdd15m.addEventListener('click', () => advanceTime(15));
    btnAdd1h.addEventListener('click', () => advanceTime(60));
    btnResetTime.addEventListener('click', resetTime);

    // Modal triggers
    btnCloseModal.addEventListener('click', closeModal);
    btnCancelBooking.addEventListener('click', closeModal);
    
    // Keyboard accessible modal (focus trap logic handled implicitly via default dialog behavior + some manual tweaks)
    modal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    bookingForm.addEventListener('submit', handleBookingSubmit);
}

function render() {
    currentData = getDashboardData();
    
    // Filter
    const term = searchInput.value.toLowerCase();
    const type = typeFilter.value;
    const status = statusFilter.value;

    const filtered = currentData.filter(res => {
        const matchesSearch = res.name.toLowerCase().includes(term) || 
                              res.tags.some(t => t.toLowerCase().includes(term));
        const matchesType = type === 'all' || res.category === type;
        const matchesStatus = status === 'all' || res.status === status;
        return matchesSearch && matchesType && matchesStatus;
    });

    // Update stats
    const counts = { Free: 0, Occupied: 0, Booked: 0 };
    currentData.forEach(r => counts[r.status]++);
    statFree.textContent = counts.Free;
    statOccupied.textContent = counts.Occupied;
    statBooked.textContent = counts.Booked;

    // Render grid
    grid.innerHTML = filtered.map(res => {
        let infoHtml = '';
        if (res.status === 'Occupied') {
            infoHtml = `
                <div class="booking-info">
                    <div><strong>Occupied by:</strong> ${res.activeBooking.bookedBy}</div>
                    <div><strong>Until:</strong> ${formatTime(new Date(res.activeBooking.end))}</div>
                    <div><strong>Purpose:</strong> ${res.activeBooking.purpose}</div>
                </div>`;
        } else if (res.status === 'Booked') {
            infoHtml = `
                <div class="booking-info">
                    <div><strong>Next booking:</strong> ${res.activeBooking.bookedBy}</div>
                    <div><strong>At:</strong> ${formatTime(new Date(res.activeBooking.start))}</div>
                </div>`;
        }

        const capacityHtml = res.capacity ? `<span title="Capacity">👥 ${res.capacity}</span>` : '';
        const locationHtml = `<span title="Location">📍 ${res.location}</span>`;

        return `
            <article class="card">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">${res.name}</h3>
                        <div class="card-meta">
                            ${capacityHtml} ${locationHtml}
                        </div>
                    </div>
                    <span class="status-pill status-${res.status}">${res.status}</span>
                </div>
                <div class="card-body">
                    <div class="tags">
                        ${res.tags.map(t => `<span class="tag">${t}</span>`).join('')}
                    </div>
                    ${infoHtml}
                </div>
                <div class="card-footer">
                    <button class="btn-primary" onclick="window.openBookingModal('${res.id}')" 
                            ${res.status === 'Occupied' ? 'disabled title="Currently occupied"' : ''}>
                        Book Now
                    </button>
                </div>
            </article>
        `;
    }).join('');

    if (filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
            No resources match your filters.
        </div>`;
    }
}

// Modal Handlers (Exposed to window for inline onclick from dynamic HTML)
window.openBookingModal = (resourceId) => {
    const resource = currentData.find(r => r.id === resourceId);
    if (!resource) return;

    document.getElementById('book-resource-id').value = resource.id;
    document.getElementById('book-resource-name').textContent = resource.name;
    
    const now = getSimulatedTime();
    // Default to a 1 hour booking starting 15 minutes from now for convenience
    const defaultStart = new Date(now.getTime() + 15 * 60000);
    const defaultEnd = new Date(defaultStart.getTime() + 60 * 60000);

    document.getElementById('book-start').value = toDatetimeLocal(defaultStart);
    document.getElementById('book-end').value = toDatetimeLocal(defaultEnd);
    
    document.getElementById('book-name').value = '';
    document.getElementById('book-purpose').value = '';
    
    errorMsg.hidden = true;
    modal.showModal();
    
    // Focus first input
    setTimeout(() => document.getElementById('book-name').focus(), 10);
};

function closeModal() {
    modal.close();
    bookingForm.reset();
    errorMsg.hidden = true;
}

function handleBookingSubmit(e) {
    e.preventDefault();
    errorMsg.hidden = true;

    const resourceId = document.getElementById('book-resource-id').value;
    const startIso = new Date(document.getElementById('book-start').value).toISOString();
    const endIso = new Date(document.getElementById('book-end').value).toISOString();
    const bookedBy = document.getElementById('book-name').value.trim();
    const purpose = document.getElementById('book-purpose').value.trim();

    const result = createBooking(resourceId, startIso, endIso, bookedBy, purpose);

    if (result.success) {
        closeModal();
        render();
    } else {
        errorMsg.textContent = result.error;
        errorMsg.hidden = false;
    }
}

// Start App
init();
