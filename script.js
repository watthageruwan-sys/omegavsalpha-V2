let scores = {
    alpha: 0,
    omega: 0
};

let streamScores = {
    "Physical Science": 0,
    "Bio Science": 0,
    "Commerce": 0,
    "Technology": 0,
    "Arts": 0
};

let isAdminLoggedIn = false;
const ADMIN_PIN = "1234"; // You can change your admin pin here

// Toggle Admin Authentication
function toggleAdmin() {
    const controls = document.getElementById("controlsSection");
    const adminBtn = document.getElementById("adminBtn");
    const lockBadge = document.getElementById("lockBadge");

    if (!isAdminLoggedIn) {
        let enteredPin = prompt("Enter Admin PIN:");
        if (enteredPin === ADMIN_PIN) {
            isAdminLoggedIn = true;
            controls.classList.remove("locked");
            controls.classList.add("unlocked");
            adminBtn.classList.add("unlocked");
            adminBtn.textContent = "🔓 Admin Logged In";
            lockBadge.textContent = "🔓 Unlocked";
            logActivity("Admin access granted.");
        } else if (enteredPin !== null) {
            alert("Incorrect PIN!");
        }
    } else {
        isAdminLoggedIn = false;
        controls.classList.remove("unlocked");
        controls.classList.add("locked");
        adminBtn.classList.remove("unlocked");
        adminBtn.textContent = "🔒 Admin Login";
        lockBadge.textContent = "🔒 Locked";
        logActivity("Admin logged out.");
    }
}

// Update Score Function for Quick Controls
function updateScore(team, points, reason) {
    scores[team] += points;
    if (scores[team] < 0) scores[team] = 0; // Prevent negative scores

    updateDisplay();
    
    let teamName = team === 'alpha' ? 'α-Alpha' : 'ω-Omega';
    logActivity(`${teamName} received ${points > 0 ? '+' + points : points} pts for "${reason}".`);
}

// Award Custom Stream Score
function awardCustomStreamScore(team) {
    const streamSelect = document.getElementById("streamSelect");
    const achievementSelect = document.getElementById("achievementSelect");
    
    const selectedStream = streamSelect.value;
    const points = parseInt(achievementSelect.value);
    const achievementText = achievementSelect.options[achievementSelect.selectedIndex].text.split(" (")[0];

    // Update Team Score
    scores[team] += points;
    
    // Update Stream Score breakdown
    streamScores[selectedStream] += points;

    updateDisplay();

    let teamName = team === 'alpha' ? 'α-Alpha' : 'ω-Omega';
    logActivity(`${teamName} earned +${points} pts in [${selectedStream}] for ${achievementText}!`);
}

// Reset All Scores
function resetScores() {
    if (confirm("Are you sure you want to reset all scores back to zero?")) {
        scores.alpha = 0;
        scores.omega = 0;
        Object.keys(streamScores).forEach(stream => streamScores[stream] = 0);
        updateDisplay();
        logActivity("Scoreboard has been reset to zero.");
    }
}

// Update UI Elements, Progress Bars, and Status
function updateDisplay() {
    // Update Score Numbers with Pop animation effect
    let alphaElem = document.getElementById("alphaScore");
    let omegaElem = document.getElementById("omegaScore");

    alphaElem.textContent = scores.alpha;
    omegaElem.textContent = scores.omega;

    alphaElem.classList.add("pop");
    omegaElem.classList.add("pop");
    setTimeout(() => {
        alphaElem.classList.remove("pop");
        omegaElem.classList.remove("pop");
    }, 300);

    // Update Stream Breakdown UI
    for (let stream in streamScores) {
        let streamId = "stream-" + stream.replace(/\s+/g, '-');
        let elem = document.getElementById(streamId);
        if (elem) {
            elem.textContent = streamScores[stream];
        }
    }

    // Update Progress Bar
    let total = scores.alpha + scores.omega;
    let alphaPct = 50;
    let omegaPct = 50;

    if (total > 0) {
        alphaPct = (scores.alpha / total) * 100;
        omegaPct = (scores.omega / total) * 100;
    }

    document.getElementById("alphaBar").style.width = alphaPct + "%";
    document.getElementById("omegaBar").style.width = omegaPct + "%";

    document.getElementById("alphaPct").textContent = `α-Alpha (${Math.round(alphaPct)}%)`;
    document.getElementById("omegaPct").textContent = `ω-Omega (${Math.round(omegaPct)}%)`;

    // Status Banner & Card Glow States
    let statusTitle = document.getElementById("statusTitle");
    let statusDesc = document.getElementById("statusDesc");
    let alphaCard = document.getElementById("alphaCard");
    let omegaCard = document.getElementById("omegaCard");

    alphaCard.className = "team-card alpha-card";
    omegaCard.className = "team-card omega-card";

    if (scores.alpha === 0 && scores.omega === 0) {
        statusTitle.textContent = "🔥 Battle Just Began!";
        statusDesc.textContent = "The scoreboard is clean. Step up, lock in, and claim the lead!";
    } else if (scores.alpha === scores.omega) {
        statusTitle.textContent = "⚖️ It's a Tie Game!";
        statusDesc.textContent = "Both teams are locked in neck-and-neck intensity!";
        alphaCard.classList.add("is-tied");
        omegaCard.classList.add("is-tied");
    } else if (scores.alpha > scores.omega) {
        statusTitle.textContent = "👑 α-Alpha is Leading!";
        statusDesc.textContent = "Team Alpha is currently dominating the scoreboard.";
        alphaCard.classList.add("is-winning");
    } else {
        statusTitle.textContent = "👑 ω-Omega is Leading!";
        statusDesc.textContent = "Team Omega is currently dominating the scoreboard.";
        omegaCard.classList.add("is-winning");
    }
}

// Log Activity Feed
function logActivity(message) {
    const activityLog = document.getElementById("activityLog");
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const item = document.createElement("div");
    item.className = "activity-item";
    item.innerHTML = `<span class="activity-time">[${timeString}]</span> ${message}`;
    
    activityLog.prepend(item);
}
