const API_URL = "https://script.google.com/macros/s/AKfycbzu3Vb1eQQlLgHoQd8hJ9O54XTgSP2cntZoltny6di0D0VaJu3AStfaYzN7vP0FqAgbeg/exec";

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
const ADMIN_PIN = "royal123";

// Fetch scores from Google Sheet on page load
window.addEventListener("DOMContentLoaded", () => {
    fetchScores();
});

function fetchScores() {
    fetch(API_URL)
        .then(response => response.json())
        .then(data => {
            if (data && data.scores) {
                scores.alpha = data.scores.alpha || 0;
                scores.omega = data.scores.omega || 0;
            }
            if (data && data.streams) {
                streamScores = data.streams;
            }
            updateDisplay();
        })
        .catch(err => console.error("Error fetching scores:", err));
}

function syncToSheet() {
    fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            scores: scores,
            streams: streamScores
        })
    }).catch(err => console.error("Error syncing to sheet:", err));
}

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

function updateScore(team, points, reason) {
    scores[team] += points;
    if (scores[team] < 0) scores[team] = 0;

    updateDisplay();
    syncToSheet();
    
    let teamName = team === 'alpha' ? 'α-Alpha' : 'Ω-Omega';
    logActivity(`${teamName} received ${points > 0 ? '+' + points : points} pts for "${reason}".`);
}

function awardCustomStreamScore(team) {
    const streamSelect = document.getElementById("streamSelect");
    const achievementSelect = document.getElementById("achievementSelect");
    
    const selectedStream = streamSelect.value;
    const points = parseInt(achievementSelect.value);
    const achievementText = achievementSelect.options[achievementSelect.selectedIndex].text.split(" (")[0];

    scores[team] += points;
    streamScores[selectedStream] += points;

    updateDisplay();
    syncToSheet();

    let teamName = team === 'alpha' ? 'α-Alpha' : 'Ω-Omega';
    logActivity(`${teamName} earned +${points} pts in [${selectedStream}] for ${achievementText}!`);
}

function resetScores() {
    if (confirm("Are you sure you want to reset all scores back to zero?")) {
        scores.alpha = 0;
        scores.omega = 0;
        Object.keys(streamScores).forEach(stream => streamScores[stream] = 0);
        updateDisplay();
        syncToSheet();
        logActivity("Scoreboard has been reset to zero.");
    }
}

function updateDisplay() {
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

    for (let stream in streamScores) {
        let streamId = "stream-" + stream.replace(/\s+/g, '-');
        let elem = document.getElementById(streamId);
        if (elem) {
            elem.textContent = streamScores[stream];
        }
    }

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
    document.getElementById("omegaPct").textContent = `Ω-Omega (${Math.round(omegaPct)}%)`;

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
        statusTitle.textContent = "👑 Ω-Omega is Leading!";
        statusDesc.textContent = "Team Omega is currently dominating the scoreboard.";
        omegaCard.classList.add("is-winning");
    }
}

function logActivity(message) {
    const activityLog = document.getElementById("activityLog");
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const item = document.createElement("div");
    item.className = "activity-item";
    item.innerHTML = `<span class="activity-time">[${timeString}]</span> ${message}`;
    
    activityLog.prepend(item);
}
