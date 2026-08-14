// static/app.js
let contactsMemory = [];

async function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
        alert("Please enter both username and password.");
        return;
    }

    try {
        const res = await fetch('/api/token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('access_token', data.access);
            document.getElementById('auth-screen').classList.add('hidden');
            document.getElementById('dashboard').classList.remove('hidden');
            loadContacts();
        } else {
            alert("Login failed. Check your credentials.");
        }
    } catch (err) {
        alert("Network error during login.");
    }
}

async function register() {
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;
    const fallback_phone = document.getElementById('reg-phone').value;

    if (!username || !password) {
        alert("Username and password are required.");
        return;
    }

    try {
        const res = await fetch('/api/register/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, fallback_phone })
        });

        if (res.ok) {
            alert("Account created successfully! Logging you in...");
            // Automatically populate login fields and run login
            document.getElementById('login-username').value = username;
            document.getElementById('login-password').value = password;
            login(); 
        } else {
            const data = await res.json();
            alert("Registration failed: " + JSON.stringify(data));
        }
    } catch (err) {
        alert("Network error during registration.");
    }
}

async function loadContacts() {
    const token = localStorage.getItem('access_token');
    try {
        const res = await fetch('/api/contacts/', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
            contactsMemory = await res.json();
            const list = document.getElementById('contacts-list');
            list.innerHTML = contactsMemory.map(c => `
                <p style="background: #fff0f5; padding: 10px; border-radius: 8px; margin-bottom: 6px; border: 1px dashed #323232;">
                    <strong>${c.name}</strong><br>📞 ${c.phone_number} ${c.email ? '<br>📧 ' + c.email : ''}
                </p>
            `).join('');
        }
    } catch (err) {
        console.log("Could not load contacts from server.");
    }
}

async function addContact() {
    const name = document.getElementById('c-name').value;
    const phone_number = document.getElementById('c-phone').value;
    const email = document.getElementById('c-email').value;
    const token = localStorage.getItem('access_token');

    if (!name || !phone_number) {
        alert("Please provide both a name and a phone number.");
        return;
    }

    try {
        const res = await fetch('/api/contacts/', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ name, phone_number, email, is_active: true })
        });

        if (res.ok) {
            document.getElementById('c-name').value = '';
            document.getElementById('c-phone').value = '';
            document.getElementById('c-email').value = '';
            loadContacts();
        } else {
            alert("Failed to add contact.");
        }
    } catch (err) {
        alert("Network error while adding contact.");
    }
}

function triggerSOS() {
    document.getElementById('status-text').innerText = "Locating GPS...";
    
    navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const token = localStorage.getItem('access_token');

        try {
            await fetch('/api/sos/', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ latitude: lat, longitude: lng })
            });
            document.getElementById('status-text').innerText = "Backend Alert Logged & Emails Sent!";
        } catch (err) {
            document.getElementById('status-text').innerText = "Offline Mode: Triggering SMS...";
        }

        const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
        const message = encodeURIComponent(`URGENT: I need help. Location: ${mapsLink}`);
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const numbers = contactsMemory.map(c => c.phone_number).join(isIOS ? ';' : ',');
        
        if (numbers) {
            window.location.href = `sms:${numbers}?body=${message}`;
        }
    }, () => alert("Please enable GPS permissions."), { enableHighAccuracy: true });
}

function toggleCamouflage() {
    document.getElementById('dashboard').classList.toggle('hidden');
    document.getElementById('camouflage-screen').classList.toggle('hidden');
}

// Fake Call logic
let callTimerInterval = null;
let callSeconds = 0;
let audioCtx = null;
let ringInterval = null;

function playRingtone() {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const playTonePattern = () => {
            if (!audioCtx) return;
            const now = audioCtx.currentTime;
            createTone(440, 480, now, 1.0);
            createTone(440, 480, now + 1.2, 1.0);
        };
        playTonePattern();
        ringInterval = setInterval(playTonePattern, 4000);
    } catch (e) {}
}

function createTone(freq1, freq2, startTime, duration) {
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc1.type = 'sine'; osc1.frequency.value = freq1;
    osc2.type = 'sine'; osc2.frequency.value = freq2;
    gainNode.gain.setValueAtTime(0.08, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc1.connect(gainNode); osc2.connect(gainNode); gainNode.connect(audioCtx.destination);
    osc1.start(startTime); osc2.start(startTime);
    osc1.stop(startTime + duration); osc2.stop(startTime + duration);
}

function stopRingtone() {
    if (ringInterval) { clearInterval(ringInterval); ringInterval = null; }
}

function startFakeCall(name = "Mom 🤍") {
    document.getElementById('caller-name').innerText = name;
    document.getElementById('incoming-actions').style.display = 'flex';
    document.getElementById('active-actions').classList.add('hidden');
    document.getElementById('fake-call-screen').classList.remove('hidden');
    playRingtone();
    if (navigator.vibrate) navigator.vibrate([500, 500, 500, 500]);
}

function acceptFakeCall() {
    stopRingtone();
    if (navigator.vibrate) navigator.vibrate(0);
    document.getElementById('incoming-actions').style.display = 'none';
    document.getElementById('active-actions').classList.remove('hidden');
    callSeconds = 0;
    if (callTimerInterval) clearInterval(callTimerInterval);
    callTimerInterval = setInterval(() => {
        callSeconds++;
        const mins = String(Math.floor(callSeconds / 60)).padStart(2, '0');
        const secs = String(callSeconds % 60).padStart(2, '0');
        document.getElementById('call-timer').innerText = `${mins}:${secs}`;
    }, 1000);
}

function declineFakeCall() {
    stopRingtone();
    if (callTimerInterval) clearInterval(callTimerInterval);
    if (navigator.vibrate) navigator.vibrate(0);
    document.getElementById('fake-call-screen').classList.add('hidden');
}

window.onload = () => {
    if (localStorage.getItem('access_token')) {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        loadContacts();
    }
};
// --- INTERACTIVE CALCULATOR ENGINE ---
let calcDisplayValue = "0";

function updateCalcDisplay() {
    const display = document.getElementById('calc-display');
    if (display) {
        display.innerText = calcDisplayValue;
    }
}

function appendCalcValue(val) {
    if (calcDisplayValue === "0" && !isNaN(val)) {
        calcDisplayValue = val;
    } else if (val === '±') {
        if (calcDisplayValue.startsWith('-')) {
            calcDisplayValue = calcDisplayValue.substring(1);
        } else {
            calcDisplayValue = '-' + calcDisplayValue;
        }
    } else {
        calcDisplayValue += val;
    }
    updateCalcDisplay();
}

function clearCalc() {
    calcDisplayValue = "0";
    updateCalcDisplay();
}

function calculateResult() {
    try {
        // Convert visual signs to valid JavaScript expression symbols
        let expression = calcDisplayValue.replace(/×/g, '*').replace(/÷/g, '/');
        let result = eval(expression);
        calcDisplayValue = String(result);
    } catch (err) {
        calcDisplayValue = "Error";
    }
    updateCalcDisplay();
}