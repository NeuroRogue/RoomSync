function getDashboardData() {
    const resources = getResources();
    const bookings = getBookings();
    const now = getSimulatedTime().getTime();
    const todayEnd = new Date(now).setHours(23, 59, 59, 999);

    return resources.map(res => {
        const resBookings = bookings.filter(b => b.resourceId === res.id);
        let status = 'Free';
        let activeBooking = null;
        let nextBooking = null;

        // Sort bookings by start time
        resBookings.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

        for (const b of resBookings) {
            const bStart = new Date(b.start).getTime();
            const bEnd = new Date(b.end).getTime();

            if (bStart <= now && bEnd > now) {
                status = 'Occupied';
                activeBooking = b;
                break;
            } else if (bStart > now && bStart <= todayEnd) {
                if (!nextBooking) {
                    nextBooking = b;
                }
            }
        }

        if (status === 'Free' && nextBooking) {
            status = 'Booked';
            activeBooking = nextBooking;
        }

        return {
            ...res,
            status,
            activeBooking
        };
    });
}

function createBooking(resourceId, startIso, endIso, bookedBy, purpose) {
    const bookings = getBookings();
    const newStart = new Date(startIso).getTime();
    const newEnd = new Date(endIso).getTime();
    const now = getSimulatedTime().getTime();

    if (newStart >= newEnd) {
        return { success: false, error: 'End time must be after start time.' };
    }
    if (newStart < now - 60000) { // allow 1 min leniency for UI selection delay
        return { success: false, error: 'Cannot book in the past.' };
    }

    const conflict = bookings.find(b => {
        if (b.resourceId !== resourceId) return false;
        const bStart = new Date(b.start).getTime();
        const bEnd = new Date(b.end).getTime();
        // Conflict if strictly overlapping
        return newStart < bEnd && bStart < newEnd;
    });

    if (conflict) {
        const dateOpts = { hour: '2-digit', minute:'2-digit' };
        const cStartStr = new Date(conflict.start).toLocaleTimeString([], dateOpts);
        const cEndStr = new Date(conflict.end).toLocaleTimeString([], dateOpts);
        return {
            success: false,
            error: `Conflict: This resource is booked by ${conflict.bookedBy} from ${cStartStr} to ${cEndStr}.`
        };
    }

    const newBooking = {
        id: 'bk-' + Math.random().toString(36).substr(2, 9),
        resourceId,
        bookedBy,
        start: startIso,
        end: endIso,
        purpose
    };

    saveBooking(newBooking);
    return { success: true, data: newBooking };
}
