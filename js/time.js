// Simulate real-time progression but allow fast-forwarding
let simulatedTime = Date.now();
let listeners = [];

// Tick time naturally (1 real second = 1 sim second)
setInterval(() => {
    simulatedTime += 1000;
    notifyListeners();
}, 1000);

function getSimulatedTime() {
    return new Date(simulatedTime);
}

function advanceTime(minutes) {
    simulatedTime += minutes * 60000;
    notifyListeners();
}

function resetTime() {
    simulatedTime = Date.now();
    notifyListeners();
}

function onTimeChange(callback) {
    listeners.push(callback);
}

function notifyListeners() {
    const d = getSimulatedTime();
    listeners.forEach(cb => cb(d));
}
