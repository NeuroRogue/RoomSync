const STORAGE_KEY_RESOURCES = 'campus_resources';
const STORAGE_KEY_BOOKINGS = 'campus_bookings';

const defaultResources = [
    { id: 'room-1', name: 'Discussion Room 2A', category: 'room', location: 'Library, 2nd Floor', capacity: 6, tags: ['whiteboard', 'display'] },
    { id: 'room-2', name: 'Discussion Room 2B', category: 'room', location: 'Library, 2nd Floor', capacity: 4, tags: ['whiteboard'] },
    { id: 'room-3', name: 'Discussion Room 3A', category: 'room', location: 'Library, 3rd Floor', capacity: 8, tags: ['projector', 'video-conferencing'] },
    { id: 'room-4', name: 'Quiet Study Room 1', category: 'room', location: 'Library, 1st Floor', capacity: 2, tags: ['power outlets'] },
    { id: 'lab-1', name: 'Chemistry Lab A', category: 'lab', location: 'Science Bldg, 1st Floor', capacity: 20, tags: ['fume hoods', 'sinks'] },
    { id: 'lab-2', name: 'Computer Lab 3', category: 'lab', location: 'Engineering Bldg, 3rd Floor', capacity: 30, tags: ['dual-monitors', 'linux'] },
    { id: 'eq-1', name: 'Portable Projector A', category: 'equipment', location: 'IT Helpdesk', capacity: null, tags: ['hdmi', '4k'] },
    { id: 'eq-2', name: 'AV Cart 1', category: 'equipment', location: 'Library Desk', capacity: null, tags: ['speakers', 'mic'] },
    { id: 'eq-3', name: 'Tool Kit - Electronics', category: 'equipment', location: 'MakerSpace', capacity: null, tags: ['soldering', 'multimeter'] },
    { id: 'eq-4', name: 'Camera - DSLR 1', category: 'equipment', location: 'Media Center', capacity: null, tags: ['4k video', 'tripod'] },
    { id: 'eq-5', name: 'VR Headset', category: 'equipment', location: 'Media Center', capacity: null, tags: ['meta quest'] }
];

function generateSeedBookings() {
    const now = getSimulatedTime().getTime();
    const min = 60000;
    return [
        // room-1: occupied right now
        { id: 'bk-1', resourceId: 'room-1', bookedBy: 'Alice Team', start: new Date(now - 15 * min).toISOString(), end: new Date(now + 45 * min).toISOString(), purpose: 'Project Sync' },
        // room-2: booked ~30 min from now
        { id: 'bk-2', resourceId: 'room-2', bookedBy: 'Study Group', start: new Date(now + 30 * min).toISOString(), end: new Date(now + 90 * min).toISOString(), purpose: 'Math Prep' },
        // lab-1: occupied
        { id: 'bk-3', resourceId: 'lab-1', bookedBy: 'Dr. Smith', start: new Date(now - 60 * min).toISOString(), end: new Date(now + 120 * min).toISOString(), purpose: 'Chemistry 101 Practical' },
        // eq-1: booked later today
        { id: 'bk-4', resourceId: 'eq-1', bookedBy: 'Guest Lecturer', start: new Date(now + 120 * min).toISOString(), end: new Date(now + 240 * min).toISOString(), purpose: 'Seminar Presentation' }
    ];
}

function initializeData(forceReset = false) {
    if (forceReset || !localStorage.getItem(STORAGE_KEY_RESOURCES)) {
        localStorage.setItem(STORAGE_KEY_RESOURCES, JSON.stringify(defaultResources));
        localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(generateSeedBookings()));
    }
}

function getResources() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_RESOURCES) || '[]');
}

function getBookings() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_BOOKINGS) || '[]');
}

function saveBooking(booking) {
    const bookings = getBookings();
    bookings.push(booking);
    localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(bookings));
}
