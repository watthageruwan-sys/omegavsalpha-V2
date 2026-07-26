const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbybAtE2AllK3WQ3S2NHakdilPUBA4xPtKRkKPIjRLSbNRiV26rYdvTa5JsSy3srNaBzHg/exec";

let scores = { alpha: 0, omega: 0 };
let streamScores = {
    "Physical Science": 0,
    "Bio Science": 0,
    "Commerce": 0,
    "Technology": 0,
    "Arts": 0
};

let lastAlpha = 0;
let lastOmega = 0;

let isAdminUnlocked = false;
const secretPasscode = "royal123";

async function fetchScores() {
    try {
        let response = await fetch(WEB_APP_URL);
        let data = await response.json();
        
        let newAlpha = Number(data.alpha) || 0;
        let newOmega = Number(data.omega) || 0;

        if (newAlpha !== lastAlpha) animateScoreChange('alphaScore');
        if (newOmega !== lastOmega) animateScoreChange('omegaScore');

        scores.alpha = newAlpha;
        scores.omega = newOmega;
        lastAlpha = newAlpha;
        lastOmega = newOmega;
        
        updateUI();
    } catch (error) {
        console.error("Error fetching scores from cloud:", error);
    }
}

fetchScores();
setInterval(fetchScores, 3000); 

function animateScoreChange(elementId) {
    let el = document.getElementById(elementId);
    if (!el) return;
    el.classList.add('pop');
    setTimeout(() => el.classList.remove('pop'), 300);
}

function toggleAdmin() {
    let controlsSection = document.getElementById('controlsSection');
    let lockBadge = document.getElementById('lockBadge');
    let adminBtn = document.getElementById('adminBtn');

    if (!isAdminUnlocked) {
        let pwd = prompt("Enter Admin Passcode to edit scores:");
        if (pwd === secretPasscode) {
            isAdminUnlocked = true;
            controlsSection.classList.remove('locked');
            controlsSection.classList.add('unlocked');
            if (lockBadge) lockBadge.innerText = "🔓 Unlocked";
            adminBtn.innerText = "🔓 Admin (Unlocked)";
            adminBtn.classList.add('unlocked');
            logActivity("Admin panel unlocked.");
        } else if (pwd !== null) {
            alert("Incorrect passcode!");
        }
    } else {
        isAdminUnlocked = false;
        controlsSection.classList.remove('unlocked');
        controlsSection.classList.add('locked');
        if (lockBadge) lockBadge.innerText = "🔒 Locked";
        adminBtn.innerText = "🔒 Admin Login";
        adminBtn.classList.remove('unlocked');
        logActivity("Admin panel locked.");
    }
}

function updateScore(team, pts, reason = 'Manual adjustment') {
    changePoints(team, pts, reason);
}

function awardCustomStreamScore(team) {
    let streamEl = document.getElementById('streamSelect');
    let achievementEl = document.getElementById('achievementSelect');
    
    let chosenStream = streamEl.value;
    let points = parseInt(achievementEl.value) || 0;
    let achievementName = achievementEl.options[achievementEl.selectedIndex].text.split(' (')[0];
    
    // Add points to the specific stream breakdown tracker
    if (streamScores[chosenStream] !== undefined) {
        streamScores[chosenStream] += points;
        if (streamScores[chosenStream] < 0) streamScores[chosenStream] = 0;
    }

    let reason = `[${chosenStream}] ${achievementName}`;
    updateScore(team, points, reason);
}

async function changePoints(team, pts, reason) {
    if (!isAdminUnlocked) {
        alert("Please unlock the Admin Panel first!");
        return;
    }
    
    scores[team] += pts;
    if (scores[team] < 0) scores[team] = 0;
    
    animateScoreChange(team === 'alpha' ? 'alphaScore' : 'omegaScore');
    updateUI();

    let teamName = team === 'alpha' ? 'Team Alpha' : 'Team Omega';
    let sign = pts >= 0 ? `+${pts}` : `${pts}`;
    logActivity(`${teamName} awarded ${sign} pts (${reason})`);

    try {
        await fetch(`${WEB_APP_URL}?update=true&alpha=${scores.alpha}&omega=${scores.omega}`);
    } catch (error) {
        console.error("Error saving scores to cloud:", error);
    }
}

async function resetScores() {
    if (!isAdminUnlocked) {
        alert("Please unlock the Admin Panel first!");
        return;
    }
    let confirmReset = confirm("Are you sure you want to wipe all scores and start fresh?");
    if (!confirmReset) return;

    scores.alpha = 0;
    scores.omega = 0;
    Object.keys(streamScores).forEach(k => streamScores[k] = 0);

    updateUI();
    logActivity("Scoreboard reset to zero.");

    try {
        await fetch(`${WEB_APP_URL}?update=true&alpha=0&omega=0`);
        alert("Scoreboard wiped clean!");
    } catch (error) {
        console.error("Error resetting scores:", error);
    }
}

function logActivity(message) {
    let logEl = document.getElementById('activityLog');
    if (!logEl) return;

    let timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    let item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `<span class="activity-time">[${timeStr}]</span> ${message}`;
    
    logEl.prepend(item);

    if (logEl.children.length > 15) {
        logEl.removeChild(logEl.lastChild);
    }
}

function updateUI() {
    let alphaScoreEl = document.getElementById('alphaScore');
    let omegaScoreEl = document.getElementById('omegaScore');
    if (alphaScoreEl) alphaScoreEl.innerText = scores.alpha;
    if (omegaScoreEl) omegaScoreEl.innerText = scores.omega;

    // Update Stream Breakdown UI cards
    for (let streamName in streamScores) {
        let safeId = streamName.replace(/\s+/g, '-');
        let el = document.getElementById(`stream-${safeId}`);
        if (el) {
            el.innerText = `${streamScores[streamName]} pts`;
        }
    }

    let alphaCard = document.querySelector('.alpha-card');
    let omegaCard = document.querySelector('.omega-card');

    if (alphaCard && omegaCard) {
        alphaCard.classList.remove('is-winning', 'is-tied');
        omegaCard.classList.remove('is-winning', 'is-tied');

        if (scores.alpha === scores.omega) {
            alphaCard.classList.add('is-tied');
            omegaCard.classList.add('is-tied');
        } else if (scores.alpha > scores.omega) {
            alphaCard.classList.add('is-winning');
        } else {
            omegaCard.classList.add('is-winning');
        }
    }

    let total = scores.alpha + scores.omega;
    let alphaPercent = total === 0 ? 50 : (scores.alpha / total) * 100;
    let omegaPercent = total === 0 ? 50 : (scores.omega / total) * 100;

    let alphaBar = document.getElementById('alphaBar');
    let omegaBar = document.getElementById('omegaBar');
    if (alphaBar) alphaBar.style.width = alphaPercent + '%';
    if (omegaBar) omegaBar.style.width = omegaPercent + '%';

    let alphaPctEl = document.getElementById('alphaPct');
    let omegaPctEl = document.getElementById('omegaPct');
    if (alphaPctEl) alphaPctEl.innerText = `Alpha (${Math.round(alphaPercent)}%)`;
    if (omegaPctEl) omegaPctEl.innerText = `Omega (${Math.round(omegaPercent)}%)`;

    let titleEl = document.getElementById('statusTitle');
    let descEl = document.getElementById('statusDesc');

    if (titleEl && descEl) {
        if (scores.alpha === scores.omega && total > 0) {
            titleEl.innerHTML = "🔥 Neck and Neck Fire Tie!";
            descEl.innerHTML = "Both teams are matching each other point for point! Absolute intensity!";
        } else if (scores.alpha > scores.omega) {
            titleEl.innerHTML = "👑 Team Alpha is Leading!";
            descEl.innerHTML = "Absolute dominance! Team Omega is right on your tail—keep pushing!";
        } else if (scores.omega > scores.alpha) {
            titleEl.innerHTML = "👑 Team Omega is Leading!";
            descEl.innerHTML = "Incredible momentum! Team Alpha is gearing up for a comeback—stay sharp!";
        } else {
            titleEl.innerHTML = "🔥 Battle Just Began!";
            descEl.innerHTML = "The scoreboard is clean. Step up, lock in, and claim the lead!";
        }
    }
}
