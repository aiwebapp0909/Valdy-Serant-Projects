// App State and Mock Data
const state = {
    isAuthenticated: false,
    inspectionComplete: false,
    currentTab: 'trips', // 'trips' or 'map'
    driver: {
        name: 'Robert Wilson',
        vehicle: 'Ambulette #402'
    },
    driverSignature: null, // Stores dataURL of signature
    trips: [
        {
            id: 1,
            patientName: 'Jenkins Odette',
            pickupTime: '12:00',
            pickupAddress: '763 E 82nd St, Brooklyn, 11236',
            dropoffAddress: '2316 Nostrand Ave, Brooklyn, 11210',
            status: 'Next',
            distance: '2.3 mi',
            phone: '(347) 866-6337',
            transportType: 'stretcher',
            multiLoad: false
        },
        {
            id: 2,
            patientName: 'Falkenstein Howard',
            pickupTime: '12:35',
            pickupAddress: '345 E 24th St, New York, 10010',
            dropoffAddress: '2865 Brighton 3rd St, Brooklyn, 11235',
            status: 'Scheduled',
            distance: '5.1 mi',
            phone: '(212) 555-0199',
            transportType: 'wheelchair',
            multiLoad: true,
            secondPatient: {
                name: 'Abouelkhir Farok',
                phone: '(718) 555-0123',
                pickupAddress: '25 Fanning St, Staten Island, 10314',
                dropoffAddress: '1950 Clove Rd, Staten Island, 10304',
                distance: '1.8 mi'
            }
        },
        {
            id: 2,
            patientName: 'Falkenstein Howard',
            pickupTime: '12:35',
            pickupAddress: '345 E 24th St, New York, 10010',
            dropoffAddress: '2865 Brighton 3rd St, Brooklyn, 11235',
            status: 'Scheduled',
            distance: '5.1 mi',
            phone: '(212) 555-0199',
            transportType: 'wheelchair'
        },
        {
            id: 3,
            patientName: 'Abouelkhir Farok',
            pickupTime: '15:30',
            pickupAddress: '25 Fanning St, Staten Island, 10314',
            dropoffAddress: '1950 Clove Rd, Staten Island, 10304',
            status: 'Scheduled',
            distance: '1.8 mi',
            phone: '(718) 555-0123',
            transportType: 'wheelchair'
        }
    ]
};

// DOM Elements
const screens = {
    login: document.getElementById('login-screen'),
    inspection: document.getElementById('inspection-screen'),
    helper: document.getElementById('helper-screen'),
    jobDetails: document.getElementById('job-details-screen'),
    main: document.getElementById('main-app'),
    fullMap: document.getElementById('full-map-screen')
};

const tripStates = [
    { code: '01', text: '01 - Dispatched', class: 'status-dispatched', nextText: 'Swipe to 63-Responded' },
    { code: '63', text: '63 - Responded', class: 'status-responded', nextText: 'Swipe to 88-At Scene' },
    { code: '88', text: '88 - At Scene', class: 'status-at-scene', nextText: 'Swipe to 82-Left' },
    { code: '82', text: '82 - Left', class: 'status-left', nextText: 'Swipe to At Destination' },
    { code: 'dest', text: 'At Destination', class: 'status-destination', nextText: 'Trip Completed' }
];

let currentTripContext = {
    trip: null,
    statusIndex: 0,
    patientIndex: 0 // For multi-load (0 = P1, 1 = P2)
};

// ... existing code ...

// Render Logic
function renderTrips() {
    tripsContainer.innerHTML = '';

    state.trips.forEach(trip => {
        const card = document.createElement('div');
        card.className = 'trip-card';
        // Add click listener to open details
        card.onclick = () => openTripDetails(trip);

        // Determine Icon
        let typeIcon = '';
        if (trip.transportType === 'stretcher') {
            typeIcon = `<img src="stretcher.png" alt="Stretcher" class="transport-icon-img">`;
        } else {
            typeIcon = `<span class="material-icons-round transport-icon">accessible</span>`;
        }

        // ... innerHTML ...
        card.innerHTML = `
            <div class="trip-header">
                <div class="trip-time">
                    <span class="material-icons-round">schedule</span>
                    ${trip.pickupTime}
                    <div class="transport-type-badge">${typeIcon}</div>
                </div>
                <span class="trip-status">${trip.status}</span>
            </div>
            <div class="trip-body">
                <div class="patient-info">
                    <div>
                        <h3>${trip.patientName}</h3>
                        <span class="tags">Ambulette Transport • ${trip.distance}</span>
                    </div>
                    <button class="icon-btn" style="background: #F1F5F9; color: var(--primary-color); border-radius: 50%; padding: 8px;">
                        <span class="material-icons-round">phone</span>
                    </button>
                </div>
                
                <div class="location-timeline">
                    <div class="loc-point pickup">
                        <div class="loc-label">Pickup</div>
                        <div class="loc-address">${trip.pickupAddress}</div>
                    </div>
                    <div class="loc-point dropoff">
                        <div class="loc-label">Dropoff</div>
                        <div class="loc-address">${trip.dropoffAddress}</div>
                    </div>
                </div>

                <div class="card-actions">
                    ${trip.status === 'Cancelled' ?
                `<button class="btn btn-secondary" disabled>Cancelled</button>` :
                `<button class="btn btn-primary" onclick="event.stopPropagation(); openTripDetails(state.trips.find(t => t.id === ${trip.id}))">Start Trip</button>
                         <button class="btn btn-secondary" onclick="event.stopPropagation(); openTripDetails(state.trips.find(t => t.id === ${trip.id}))">Details</button>`
            }
                </div>
            </div>
        `;
        tripsContainer.appendChild(card);
    });
}

function openTripDetails(trip) {
    if (!trip) return;

    currentTripContext.trip = trip;
    currentTripContext.statusIndex = 0;
    currentTripContext.patientIndex = 0;
    currentTripContext.completedDestinations = 0;

    updateTripUI();

    // Navigate to Screen
    navigateTo('jobDetails');
}

function updateTripUI() {
    const trip = currentTripContext.trip;
    const isMulti = trip.multiLoad;
    const p1 = trip;
    const p2 = trip.secondPatient;

    // Which patient are we looking at?
    // User logic: P1 (Responded -> Left), then P2 (Responded -> Left), then Closest (Dest), then Furthest (Dest)
    // For simplicity in prototype, we'll follow the sequence or just show P1 details first.

    const activePatient = (isMulti && currentTripContext.patientIndex === 1) ? p2 : p1;
    const patientName = isMulti ? `${p1.patientName} & ${p2.name}` : p1.patientName;

    document.getElementById('job-patient-name').textContent = activePatient.patientName ? activePatient.patientName.toUpperCase() : activePatient.name.toUpperCase();
    document.getElementById('job-patient-phone').textContent = activePatient.phone;

    const formattedPhone = `tel:${activePatient.phone.replace(/\D/g, '')}`;
    document.getElementById('job-patient-phone-link').href = formattedPhone;
    document.getElementById('job-pickup-phone-link').href = formattedPhone;

    document.getElementById('job-time').textContent = p1.pickupTime;

    document.getElementById('job-pickup-addr').textContent = activePatient.pickupAddress.split(',')[0];
    document.getElementById('job-pickup-city').textContent = activePatient.pickupAddress.split(',').slice(1).join(',');

    document.getElementById('job-dropoff-addr').textContent = activePatient.dropoffAddress.split(',')[0];
    document.getElementById('job-dropoff-city').textContent = activePatient.dropoffAddress.split(',').slice(1).join(',');

    document.getElementById('job-distance').textContent = activePatient.distance;

    // Update Status Banner
    const status = tripStates[currentTripContext.statusIndex];
    const banner = document.getElementById('job-status-banner');
    banner.className = 'job-status-bar ' + status.class;
    document.getElementById('job-status-text').textContent = status.text;

    // Update Swipe Text
    const swipeText = document.querySelector('.swipe-text');
    swipeText.textContent = status.nextText;

    // Reset Swipe Knob
    const knob = document.querySelector('.swipe-knob');
    knob.style.transform = 'translateX(0)';
}


function handleSwipeComplete() {
    const trip = currentTripContext.trip;
    const currentStatus = tripStates[currentTripContext.statusIndex];

    // Check for Auto-Sign Events BEFORE incrementing index (or after, depending on when we want it to trigger)
    // User wants: "sign the initials of the patient automatically everytime the user swipes pick up"
    // Pick up is transition to 82-Left? Or 'At Scene'? Let's assume 'Left' (Leaving with patient)
    // Actually, "Swipe to 82-Left" implies the action *completes* the "At Scene" phase and *starts* "Left".

    // Logic:
    // If we are currently at 'At Scene' (88), and we swipe, we go to 'Left' (82).
    // So if currentStatus.code === '88', next is '82'.

    // Simplest approach: Check the NEW status we are entering.
    let nextIndex = currentTripContext.statusIndex + 1;
    if (nextIndex < tripStates.length) {
        const nextStatus = tripStates[nextIndex];

        if (nextStatus.code === '82') {
            // Entering 'Left' state -> Auto Sign Patient Initials
            autoSignPatient(trip);
        }

        if (nextStatus.code === 'dest') {
            // Entering 'At Destination' -> Auto Sign Driver
            // User said: "autosign for the user everytime he swipe at destination"
            autoSignDriver();
        }
    }

    if (trip.multiLoad) {
        // ... (Existing simplistic logic)
        if (currentTripContext.statusIndex < tripStates.length - 1) {
            currentTripContext.statusIndex++;
        } else {
            if (currentTripContext.patientIndex === 0) {
                currentTripContext.patientIndex = 1;
                currentTripContext.statusIndex = 1;
            } else {
                navigateTo('main');
                return;
            }
        }
    } else {
        // Single patient logic
        if (currentTripContext.statusIndex < tripStates.length - 1) {
            currentTripContext.statusIndex++;
        } else {
            navigateTo('main');
            return;
        }
    }

    updateTripUI();
}

function autoSignPatient(trip) {
    // Generate initials
    const name = trip.patientName || "Unknown Patient";
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

    // Visual Feedback (Toast or alert)
    showToast(`Patient Signed: ${initials}`);
    console.log(`Auto-signed patient initials: ${initials}`);
}

function autoSignDriver() {
    if (state.driverSignature) {
        showToast("Auto-signed by Driver");
        console.log("Auto-signed with stored driver signature");
    } else {
        showToast("Driver Signature Missing!");
    }
}

function showToast(message) {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '100px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = 'rgba(0,0,0,0.8)';
    toast.style.color = 'white';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '24px';
    toast.style.zIndex = '1000';
    toast.style.fontWeight = '600';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s';
        setTimeout(() => toast.remove(), 500);
    }, 2000);
}

// Back Button Listener
document.getElementById('job-back-btn').addEventListener('click', () => {
    navigateTo('main');
});

// Map Expansion
document.getElementById('job-map').addEventListener('click', () => {
    navigateTo('fullMap');
    updateFullMap();
});

document.getElementById('hide-map-btn').addEventListener('click', () => {
    navigateTo('jobDetails');
});

function updateFullMap() {
    // Update map status footer
    const steps = document.querySelectorAll('.status-step');
    const status = tripStates[currentTripContext.statusIndex];

    steps.forEach(step => {
        step.classList.remove('active');
        if (step.dataset.status === status.code) {
            step.classList.add('active');
        }
    });
}

const forms = {
    login: document.getElementById('login-form'),
    inspection: document.getElementById('inspection-form')
};

const views = {
    trips: document.getElementById('trips-view'),
    map: document.getElementById('map-view')
};

const navItems = document.querySelectorAll('.nav-item');
const tripsContainer = document.getElementById('trips-container');
const pageTitle = document.getElementById('page-title');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    renderTrips();
});

// Event Listeners
function initEventListeners() {
    initSignaturePad();
    initCancelTripFeature();



    // Login Flow
    forms.login.addEventListener('submit', (e) => {
        e.preventDefault();
        // Simulate API call
        const btn = forms.login.querySelector('button');
        const originalText = btn.innerText;
        btn.innerText = 'Authenticating...';

        setTimeout(() => {
            state.isAuthenticated = true;
            btn.innerText = originalText;
            navigateTo('inspection');
        }, 1000);
    });

    // Inspection Flow
    forms.inspection.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = forms.inspection.querySelector('button');

        // Validate Signature
        const sigCanvas = document.getElementById('signature-pad');
        if (!sigCanvas || isCanvasBlank(sigCanvas)) {
            showToast('Please sign before submitting');
            // Scroll to signature section
            const sigSection = document.querySelector('.signature-section');
            if (sigSection) {
                sigSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        // Save Signature
        state.driverSignature = sigCanvas.toDataURL();
        console.log('Driver Signature Saved');

        btn.innerHTML = '<span class="material-icons-round spin">sync</span> Saving...';

        setTimeout(() => {
            state.inspectionComplete = true;
            if (isHelperNeeded()) {
                navigateTo('helper');
            } else {
                navigateTo('main');
            }
        }, 100);
    });

    function isHelperNeeded() {
        // Check the first 5 jobs
        const firstJobs = state.trips.slice(0, 5);
        // Helper is needed if any of these are NOT wheelchair (e.g., stretcher)
        return firstJobs.some(trip => trip.transportType !== 'wheelchair');
    }

    // Check All Functionality
    const checkAllBtn = document.getElementById('check-all');
    const allCheckboxes = forms.inspection.querySelectorAll('input[type="checkbox"]:not(#check-all)');

    checkAllBtn.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        allCheckboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
        });
    });

    // Navigation Tabs
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.dataset.target;
            if (target) {
                switchTab(target);
            }
        });
    });

    // Optimize Route
    const optimizeBtn = document.querySelector('.map-overlay-info button');
    if (optimizeBtn) {
        optimizeBtn.addEventListener('click', optimizeRoute);
    }

    // Swipe Interaction
    initSwipe('swipe-action', handleSwipeComplete);
    initSwipe('swipe-helper', () => {
        // Register pickup time and move to main app
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        state.helperPickedUpTime = timeStr;
        console.log(`Helper picked up at: ${timeStr}`);
        navigateTo('main');
    });

    // Helper Screen Buttons
    document.getElementById('helper-back-btn').addEventListener('click', () => {
        navigateTo('inspection');
    });

    document.getElementById('btn-pick-up-later').addEventListener('click', () => {
        navigateTo('main');
    });

    // Initialize Break Feature
    initBreakFeature();
}

function initSwipe(containerId, onComplete) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const knob = container.querySelector('.swipe-knob');

    let isDragging = false;
    let startX = 0;
    let currentX = 0;

    const startDrag = (e) => {
        isDragging = true;
        startX = (e.type.includes('touch')) ? e.touches[0].clientX : e.clientX;
        knob.style.transition = 'none';
    };

    const moveDrag = (e) => {
        if (!isDragging) return;
        const maxTrack = container.offsetWidth - knob.offsetWidth - 8;
        const x = (e.type.includes('touch')) ? e.touches[0].clientX : e.clientX;
        currentX = Math.max(0, Math.min(x - startX, maxTrack));
        knob.style.transform = `translateX(${currentX}px)`;

        // Opacity of text
        const opacity = 1 - (currentX / maxTrack);
        container.querySelector('.swipe-text').style.opacity = opacity;
    };

    const stopDrag = () => {
        if (!isDragging) return;
        isDragging = false;
        const maxTrack = container.offsetWidth - knob.offsetWidth - 8;
        knob.style.transition = 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)';

        if (currentX > maxTrack * 0.8) {
            // Success
            knob.style.transform = `translateX(${maxTrack}px)`;
            setTimeout(() => {
                onComplete();
                container.querySelector('.swipe-text').style.opacity = 1;
                // Reset knob for next time
                setTimeout(() => {
                    knob.style.transition = 'none';
                    knob.style.transform = 'translateX(0)';
                }, 500);
            }, 300);
        } else {
            // Reset
            knob.style.transform = 'translateX(0)';
            container.querySelector('.swipe-text').style.opacity = 1;
        }
        currentX = 0;
    };

    knob.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', moveDrag);
    window.addEventListener('mouseup', stopDrag);

    knob.addEventListener('touchstart', startDrag);
    window.addEventListener('touchmove', moveDrag);
    window.addEventListener('touchend', stopDrag);
}

// Navigation Logic
function navigateTo(screenName) {
    // Hide all screens
    Object.values(screens).forEach(s => s.classList.remove('active'));

    // Show target screen
    if (screens[screenName]) {
        screens[screenName].classList.add('active');
    }
}

function switchTab(viewId) {
    // Update State
    state.currentTab = viewId.replace('-view', '');

    // Update View Visibility
    Object.values(views).forEach(v => v.classList.remove('active-view'));
    document.getElementById(viewId).classList.add('active-view');

    // Update Nav Icons
    navItems.forEach(item => {
        if (item.dataset.target === viewId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update Title
    pageTitle.innerText = viewId === 'trips-view' ? 'Available Trips' : 'Live Map';
}

function optimizeRoute() {
    const svg = document.getElementById('route-svg');

    // Use CSS top/left values as fallback coordinates (approximate % to px for prototype)
    const container = document.querySelector('.map-visual');
    const mapW = container.offsetWidth || 340;
    const mapH = container.offsetHeight || 500;

    // Based on CSS positions:
    // Driver: 50%, 50%
    // P1 (Odette): 70%, 30%
    // P2 (Howard): 30%, 60%
    // Hospital: 80%, 80%

    // Calculate actual pixel positions
    const pDriver = { x: mapW * 0.5, y: mapH * 0.5 };
    const p1 = { x: mapW * 0.7, y: mapH * 0.3 };
    const p2 = { x: mapW * 0.3, y: mapH * 0.6 };
    const pHospital = { x: mapW * 0.8, y: mapH * 0.8 };

    // Create Path String: Driver -> P1 -> P2 -> Hospital
    // Sequence: Pickup Odette (stretcher) -> Pickup Howard (wheelchair) -> Hospital
    const pathString = `M ${pDriver.x} ${pDriver.y} L ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${pHospital.x} ${pHospital.y}`;

    // Clear existing
    svg.innerHTML = '';

    // Draw Line
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathString);
    path.setAttribute('class', 'route-line');
    svg.appendChild(path);

    // Show ETAs
    document.getElementById('eta-p1').classList.remove('hidden');
    document.getElementById('eta-p2').classList.remove('hidden');
    document.getElementById('eta-hosp').classList.remove('hidden');

    // Update Overlay Text
    const overlayText = document.querySelector('.map-overlay-info p');
    if (overlayText) {
        overlayText.innerHTML = 'Route Optimized: 2 Pickups -> Hospital';
    }
    const optimizeBtn = document.querySelector('.map-overlay-info button');
    if (optimizeBtn) {
        optimizeBtn.style.display = 'none';
    }
}

// Render Logic
function renderTrips() {
    tripsContainer.innerHTML = '';

    state.trips.forEach(trip => {
        const card = document.createElement('div');
        card.className = 'trip-card';

        // Determine Icon
        let typeIcon = '';
        if (trip.transportType === 'stretcher') {
            typeIcon = `<img src="stretcher.png" alt="Stretcher" class="transport-icon-img">`;
        } else {
            typeIcon = `<span class="material-icons-round transport-icon">accessible</span>`;
        }

        card.innerHTML = `
            <div class="trip-header">
                <div class="trip-time">
                    <span class="material-icons-round">schedule</span>
                    ${trip.pickupTime}
                    <div class="transport-type-badge">${typeIcon}</div>
                </div>
                <span class="trip-status">${trip.status}</span>
            </div>
            <div class="trip-body">
                <div class="patient-info">
                    <div>
                        <h3>${trip.patientName}</h3>
                        <span class="tags">Ambulette Transport • ${trip.distance}</span>
                    </div>
                    <button class="icon-btn" style="background: #F1F5F9; color: var(--primary-color); border-radius: 50%; padding: 8px;">
                        <span class="material-icons-round">phone</span>
                    </button>
                </div>
                
                <div class="location-timeline">
                    <div class="loc-point pickup">
                        <div class="loc-label">Pickup</div>
                        <div class="loc-address">${trip.pickupAddress}</div>
                    </div>
                    <div class="loc-point dropoff">
                        <div class="loc-label">Dropoff</div>
                        <div class="loc-address">${trip.dropoffAddress}</div>
                    </div>
                </div>

                <div class="card-actions">
                    <button class="btn btn-primary" onclick="event.stopPropagation(); openTripDetails(state.trips.find(t => t.id === ${trip.id}))">Start Trip</button>
                    <button class="btn btn-secondary" onclick="event.stopPropagation(); openTripDetails(state.trips.find(t => t.id === ${trip.id}))">Details</button>
                </div>
            </div>
        `;
        tripsContainer.appendChild(card);
    });
}

// BREAK SYSTEM LOGIC
function initBreakFeature() {
    const breakState = {
        isBreakActive: false,
        timeLeft: 30 * 60, // 30 minutes in seconds
        timerInterval: null,
        totalWorkTime: 0,
        workInterval: null
    };

    const els = {
        popup: document.getElementById('break-popup'),
        pauseBtn: document.getElementById('pause-btn'),
        resumeBtn: document.getElementById('resume-work-btn'),
        timerText: document.getElementById('break-timer'),
        progressRing: document.getElementById('break-progress')
    };

    if (!els.popup || !els.pauseBtn) return;

    // Start Work Timer (Simulated for protocol)
    startWorkTimer();

    // Pause Button Click
    els.pauseBtn.addEventListener('click', () => {
        startBreak();
    });

    // Resume Button Click
    els.resumeBtn.addEventListener('click', () => {
        endBreak();
    });

    function startWorkTimer() {
        if (breakState.workInterval) clearInterval(breakState.workInterval);
        breakState.workInterval = setInterval(() => {
            breakState.totalWorkTime++;
            // Check for 8 hours (8 * 60 * 60 = 28800)
            if (breakState.totalWorkTime >= 28800) {
                if (!breakState.isBreakActive) {
                    startBreak();
                }
                breakState.totalWorkTime = 0;
            }
        }, 1000);
    }

    function startBreak() {
        if (breakState.isBreakActive) return;
        breakState.isBreakActive = true;
        els.popup.classList.add('active');

        // Reset break timer to 30 mins
        breakState.timeLeft = 30 * 60;
        updateTimerDisplay();

        if (breakState.timerInterval) clearInterval(breakState.timerInterval);
        breakState.timerInterval = setInterval(() => {
            if (breakState.timeLeft > 0) {
                breakState.timeLeft--;
                updateTimerDisplay();
            } else {
                // Time up
                endBreak();
            }
        }, 1000);
    }

    function endBreak() {
        if (!breakState.isBreakActive) return;
        breakState.isBreakActive = false;
        els.popup.classList.remove('active');

        if (breakState.timerInterval) clearInterval(breakState.timerInterval);
    }

    function updateTimerDisplay() {
        const mins = Math.floor(breakState.timeLeft / 60);
        const secs = breakState.timeLeft % 60;
        els.timerText.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

        // Update Ring
        // Circumference 2*PI*45 approx 283
        const totalTime = 30 * 60;
        const totalCircumference = 283;
        const offset = totalCircumference - ((breakState.timeLeft / totalTime) * totalCircumference);
        if (els.progressRing) {
            els.progressRing.style.strokeDashoffset = offset;
        }
    }
}

// CANCEL TRIP LOGIC
function initCancelTripFeature() {
    const els = {
        btnCancel: document.getElementById('btn-cancel-job'),
        modal: document.getElementById('cancel-modal'),
        btnCloseX: document.getElementById('modal-close-x'),
        btnBack: document.getElementById('modal-cancel-btn'),
        btnConfirm: document.getElementById('modal-confirm-btn'),
        inputReason: document.getElementById('cancel-reason'),
        errorText: document.getElementById('cancel-error')
    };

    if (!els.btnCancel || !els.modal) return;

    // Show Modal
    els.btnCancel.addEventListener('click', () => {
        els.modal.classList.add('active');
        els.inputReason.value = '';
        els.errorText.textContent = '';
        els.inputReason.focus();
    });

    // Hide Modal
    const hideModal = () => els.modal.classList.remove('active');
    els.btnCloseX.addEventListener('click', hideModal);
    els.btnBack.addEventListener('click', hideModal);

    // Confirm Cancel
    els.btnConfirm.addEventListener('click', () => {
        const reason = els.inputReason.value.trim();
        if (!reason) {
            els.errorText.textContent = 'Please enter a reason.';
            return;
        }

        // Perform Cancellation
        cancelCurrentTrip(reason);
        hideModal();
    });
}

function cancelCurrentTrip(reason) {
    if (!currentTripContext.trip) return;

    const tripId = currentTripContext.trip.id;
    const trip = state.trips.find(t => t.id === tripId);

    if (trip) {
        trip.status = 'Cancelled';
        trip.cancellationReason = reason;

        console.log(`Trip ${tripId} cancelled. Reason: ${reason}`);

        // Show Feedback
        showToast('Trip Cancelled Successfully');

        // Allow toast to be seen before navigating
        setTimeout(() => {
            navigateTo('main');
            renderTrips(); // Re-render to show status change
        }, 1000);
    }
}


// Signature Pad Implementation
function initSignaturePad() {
    const canvas = document.getElementById('signature-pad');
    if (!canvas) return;

    // Scale for high DPI
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d").scale(ratio, ratio);

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 2;

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    function start(e) {
        isDrawing = true;
        const pos = getPos(e);
        lastX = pos.x;
        lastY = pos.y;
    }

    function move(e) {
        if (!isDrawing) return;
        e.preventDefault(); // Prevent scrolling
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        lastX = pos.x;
        lastY = pos.y;
    }

    function end() {
        isDrawing = false;
    }

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', end);
    canvas.addEventListener('mouseout', end);

    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', end);

    const clearBtn = document.getElementById('clear-signature');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            ctx.clearRect(0, 0, canvas.width / ratio, canvas.height / ratio); // Clear based on drawing coords
        });
    }
}

// Helper function to check if canvas is blank
function isCanvasBlank(canvas) {
    const ctx = canvas.getContext('2d');
    const pixelBuffer = new Uint32Array(
        ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer
    );
    return !pixelBuffer.some(color => color !== 0);
}

