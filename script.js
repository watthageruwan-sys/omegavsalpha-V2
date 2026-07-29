const API_URL = "https://script.google.com/macros/s/AKfycbxViTsn4hhaMDtT4_iaq8RA71V2cBSzUVV28Z5-YhUWVTC1JwuHReEG9u02Z1MtYJDyTg/exec";

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

let viewerId = Math.random().toString(36).substring(2);

// ========== TOP PERFORMERS (now shared via backend) ==========
let topPerformers = {
    alpha: [
        { name: "—", note: "" },
        { name: "—", note: "" },
        { name: "—", note: "" }
    ],
    omega: [
        { name: "—", note: "" },
        { name: "—", note: "" },
        { name: "—", note: "" }
    ]
};

// ========== POLL (now shared via backend) ==========
const POLL_QUESTION = "Which subject needs more papers / group sessions next?";
const POLL_SUBJECTS = [
    { stream: "Physical Science", subjects: ["Combined Mathematics", "Physics", "Chemistry"] },
    { stream: "Bio Science", subjects: ["Biology", "Chemistry", "Physics", "Agriculture"] },
    { stream: "Commerce", subjects: ["Accounting", "Business Studies", "Economics"] },
    { stream: "Technology", subjects: ["Engineering Technology", "Science for Technology", "ICT"] },
    { stream: "Arts", subjects: ["History", "Geography", "Political Science", "Literature"] }
];
const POLL_OPTIONS = POLL_SUBJECTS.flatMap(g => g.subjects);

// Local flag so one browser can only vote once
const POLL_VOTED_KEY = "krc_poll_has_voted_v2";

let pollVotes = {}; // will be filled from the server

function hasVotedLocally() {
    return localStorage.getItem(POLL_VOTED_KEY) === "true";
}

function markVotedLocally() {
    localStorage.setItem(POLL_VOTED_KEY, "true");
}

// Countdown target
const RECAP_TARGET = new Date("2026-08-05T09:00:00");

// ========== HEARTBEAT ==========
setInterval(() => {
    fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "heartbeat", viewerId: viewerId })
    }).catch(err => console.error("Heartbeat error:", err));
}, 15000);

window.addEventListener("DOMContentLoaded", () => {
    fetchAllData();
    setInterval(fetchAllData, 12000); // refresh every 12s

    // Initial heartbeat
    fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "heartbeat", viewerId: viewerId })
    }).catch(() => {});

    if (document.getElementById("countdownDays")) {
        updateCountdown();
        setInterval(updateCountdown, 1000);
    }
});

// ========== FETCH EVERYTHING FROM BACKEND ==========
function fetchAllData() {
    fetch(API_URL)
        .then(response => response.json())
        .then(data => {
            // Scores
            if (data && data.scores) {
                scores.alpha = data.scores.alpha || 0;
                scores.omega = data.scores.omega || 0;
            }
            // Streams
            if (data && data.streams) {
                streamScores = data.streams;
            }
            // Viewers
            let viewerElem = document.getElementById("viewerCount");
            if (viewerElem && data.viewers !== undefined) {
                viewerElem.textContent = data.viewers;
            }
            // Top Performers (shared)
            if (data && data.topPerformers) {
                topPerformers = data.topPerformers;
                renderTopPerformers();
                if (document.getElementById("tp-alpha-1-name")) {
                    fillTopPerformersForm();
                }
            }
            // Poll (shared)
            if (data && data.poll) {
                pollVotes = data.poll;
            } else {
                // initialise empty
                pollVotes = {};
                POLL_OPTIONS.forEach(s => { pollVotes[s.replace(/\s+/g, "")] = 0; });
            }
            renderPoll();

            updateDisplay();
        })
        .catch(err => console.error("Error fetching data:", err));
}

// ========== SAVE SCORES / STREAMS ==========
function syncToSheet() {
    fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            scores: scores,
            streams: streamScores
        })
    }).catch(err => console.error("Error syncing scores:", err));
}

// ========== ADMIN LOGIN ==========
function toggleAdmin() {
    const controls = document.getElementById("controlsSection");
    const adminBtn = document.getElementById("adminBtn");
    const lockBadge = document.getElementById("lockBadge");

    if (!isAdminLoggedIn) {
        let enteredPin = prompt("Enter Admin PIN:");
        if (enteredPin === ADMIN_PIN) {
            isAdminLoggedIn = true;
            if (controls) {
                controls.classList.remove("locked");
                controls.classList.add("unlocked");
            }
            if (adminBtn) {
                adminBtn.classList.add("unlocked");
                adminBtn.textContent = "🔓 Admin Logged In";
            }
            if (lockBadge) lockBadge.textContent = "🔓 Unlocked";
            logActivity("Admin access granted.");
        } else if (enteredPin !== null) {
            alert("Incorrect PIN!");
        }
    } else {
        isAdminLoggedIn = false;
        if (controls) {
            controls.classList.remove("unlocked");
            controls.classList.add("locked");
        }
        if (adminBtn) {
            adminBtn.classList.remove("unlocked");
            adminBtn.textContent = "🔒 Admin Login";
        }
        if (lockBadge) lockBadge.textContent = "🔒 Locked";
        logActivity("Admin logged out.");
    }
}

function awardCustomStreamScore(team) {
    if (!isAdminLoggedIn) {
        alert("Please login as admin first.");
        return;
    }
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
    if (!isAdminLoggedIn) {
        alert("Please login as admin first.");
        return;
    }
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

    if (alphaElem) {
        alphaElem.textContent = scores.alpha;
        alphaElem.classList.add("pop");
        setTimeout(() => alphaElem.classList.remove("pop"), 300);
    }
    if (omegaElem) {
        omegaElem.textContent = scores.omega;
        omegaElem.classList.add("pop");
        setTimeout(() => omegaElem.classList.remove("pop"), 300);
    }

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

    let alphaBar = document.getElementById("alphaBar");
    let omegaBar = document.getElementById("omegaBar");
    if (alphaBar) alphaBar.style.width = alphaPct + "%";
    if (omegaBar) omegaBar.style.width = omegaPct + "%";

    let alphaPctEl = document.getElementById("alphaPct");
    let omegaPctEl = document.getElementById("omegaPct");
    if (alphaPctEl) alphaPctEl.textContent = `α-Alpha (${Math.round(alphaPct)}%)`;
    if (omegaPctEl) omegaPctEl.textContent = `Ω-Omega (${Math.round(omegaPct)}%)`;

    let statusTitle = document.getElementById("statusTitle");
    let statusDesc = document.getElementById("statusDesc");
    let alphaCard = document.getElementById("alphaCard");
    let omegaCard = document.getElementById("omegaCard");

    if (alphaCard) alphaCard.className = "team-card alpha-card";
    if (omegaCard) omegaCard.className = "team-card omega-card";

    if (statusTitle && statusDesc) {
        if (scores.alpha === 0 && scores.omega === 0) {
            statusTitle.textContent = "🔥 Battle Just Began!";
            statusDesc.textContent = "The scoreboard is clean. Step up, lock in, and claim the lead!";
        } else if (scores.alpha === scores.omega) {
            statusTitle.textContent = "⚖️ It's a Tie Game!";
            statusDesc.textContent = "Both teams are locked in neck-and-neck intensity!";
            if (alphaCard) alphaCard.classList.add("is-tied");
            if (omegaCard) omegaCard.classList.add("is-tied");
        } else if (scores.alpha > scores.omega) {
            statusTitle.textContent = "👑 α-Alpha is Leading!";
            statusDesc.textContent = "Team Alpha is currently dominating the scoreboard.";
            if (alphaCard) alphaCard.classList.add("is-winning");
        } else {
            statusTitle.textContent = "👑 Ω-Omega is Leading!";
            statusDesc.textContent = "Team Omega is currently dominating the scoreboard.";
            if (omegaCard) omegaCard.classList.add("is-winning");
        }
    }
}

function logActivity(message) {
    const activityLog = document.getElementById("activityLog");
    if (!activityLog) return;
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const item = document.createElement("div");
    item.className = "activity-item";
    item.innerHTML = `<span class="activity-time">[${timeString}]</span> ${message}`;

    activityLog.prepend(item);
}

/* ========== COUNTDOWN ========== */
function updateCountdown() {
    const now = new Date();
    let diff = RECAP_TARGET - now;

    if (diff < 0) {
        document.getElementById("countdownDays").textContent = "0";
        document.getElementById("countdownHours").textContent = "0";
        document.getElementById("countdownMins").textContent = "0";
        document.getElementById("countdownSecs").textContent = "0";
        const note = document.getElementById("countdownNote");
        if (note) note.textContent = "Recap paper time has arrived! Good luck everyone 💪";
        return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById("countdownDays").textContent = days;
    document.getElementById("countdownHours").textContent = hours.toString().padStart(2, "0");
    document.getElementById("countdownMins").textContent = mins.toString().padStart(2, "0");
    document.getElementById("countdownSecs").textContent = secs.toString().padStart(2, "0");
}

/* ========== TOP PERFORMERS ========== */
function renderTopPerformers() {
    const alphaList = document.getElementById("topAlphaList");
    const omegaList = document.getElementById("topOmegaList");
    if (!alphaList || !omegaList) return;

    const ranks = ["gold", "silver", "bronze"];
    alphaList.innerHTML = topPerformers.alpha.map((p, i) => `
        <div class="performer-item">
            <div class="rank-badge ${ranks[i] || ''}">${i + 1}</div>
            <div>
                <strong style="color:#f8fafc">${p.name || "—"}</strong>
                <div style="font-size:0.75rem;color:#94a3b8">${p.note || ""}</div>
            </div>
        </div>
    `).join("");

    omegaList.innerHTML = topPerformers.omega.map((p, i) => `
        <div class="performer-item">
            <div class="rank-badge ${ranks[i] || ''}">${i + 1}</div>
            <div>
                <strong style="color:#f8fafc">${p.name || "—"}</strong>
                <div style="font-size:0.75rem;color:#94a3b8">${p.note || ""}</div>
            </div>
        </div>
    `).join("");
}

function fillTopPerformersForm() {
    for (let i = 0; i < 3; i++) {
        const nameEl = document.getElementById(`tp-alpha-${i+1}-name`);
        const noteEl = document.getElementById(`tp-alpha-${i+1}-note`);
        if (nameEl) nameEl.value = topPerformers.alpha[i]?.name || "";
        if (noteEl) noteEl.value = topPerformers.alpha[i]?.note || "";
    }
    for (let i = 0; i < 3; i++) {
        const nameEl = document.getElementById(`tp-omega-${i+1}-name`);
        const noteEl = document.getElementById(`tp-omega-${i+1}-note`);
        if (nameEl) nameEl.value = topPerformers.omega[i]?.name || "";
        if (noteEl) noteEl.value = topPerformers.omega[i]?.note || "";
    }
}

function saveTopPerformersFromAdmin() {
    if (!isAdminLoggedIn) {
        alert("Please login as admin first.");
        return;
    }

    for (let i = 0; i < 3; i++) {
        const name = document.getElementById(`tp-alpha-${i+1}-name`)?.value.trim() || "—";
        const note = document.getElementById(`tp-alpha-${i+1}-note`)?.value.trim() || "";
        topPerformers.alpha[i] = { name, note };
    }
    for (let i = 0; i < 3; i++) {
        const name = document.getElementById(`tp-omega-${i+1}-name`)?.value.trim() || "—";
        const note = document.getElementById(`tp-omega-${i+1}-note`)?.value.trim() || "";
        topPerformers.omega[i] = { name, note };
    }

    // Save to the shared backend
    fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topPerformers: topPerformers })
    }).catch(err => console.error("Error saving top performers:", err));

    renderTopPerformers();
    logActivity("Top Performers list has been updated by admin.");
    alert("✅ Top Performers saved!\nEveryone will see the new names after a few seconds.");
}

/* ========== POLL (SHARED) ========== */
function renderPoll() {
    const container = document.getElementById("pollContainer");
    if (!container) return;

    // Calculate total votes
    let total = 0;
    POLL_OPTIONS.forEach(opt => {
        const key = opt.replace(/\s+/g, "");
        total += (pollVotes[key] || 0);
    });

    const alreadyVoted = hasVotedLocally();

    let html = `<div class="poll-question">${POLL_QUESTION}</div>`;

    if (!alreadyVoted) {
        html += `
            <select id="pollSelect" style="width:100%; background:rgba(0,0,40,0.9); color:#f8fafc; border:1px solid rgba(255,215,0,0.4); padding:12px; border-radius:10px; font-size:0.95rem; margin-bottom:12px; outline:none;">
                <option value="">— Select a subject —</option>
        `;
        POLL_SUBJECTS.forEach(group => {
            html += `<optgroup label="${group.stream}">`;
            group.subjects.forEach(sub => {
                html += `<option value="${sub}">${sub}</option>`;
            });
            html += `</optgroup>`;
        });
        html += `</select>
            <button class="poll-vote-btn" onclick="submitPollVote()">Cast Your Vote</button>
        `;
    } else {
        html += `<div class="poll-total" style="margin-bottom:14px;">You already voted • Total votes: ${total}</div>`;
    }

    // Show results
    if (total > 0) {
        html += `<div style="margin-top:8px;"><div style="font-size:0.85rem; color:#94a3b8; margin-bottom:8px;">Current results (shared for everyone):</div>`;

        const sorted = POLL_OPTIONS
            .map(opt => {
                const key = opt.replace(/\s+/g, "");
                return { name: opt, count: pollVotes[key] || 0 };
            })
            .filter(x => x.count > 0)
            .sort((a, b) => b.count - a.count);

        sorted.forEach(item => {
            const pct = Math.round((item.count / total) * 100);
            html += `
                <div class="poll-option" style="cursor:default; margin-bottom:8px;">
                    <div style="flex:1">
                        <div class="poll-option-text">${item.name}</div>
                        <div class="poll-bar-container">
                            <div class="poll-bar-bg"><div class="poll-bar-fill" style="width:${pct}%"></div></div>
                        </div>
                    </div>
                    <div class="poll-percent">${pct}%</div>
                </div>
            `;
        });
        html += `</div>`;
    }

    container.innerHTML = html;
}

function submitPollVote() {
    const select = document.getElementById("pollSelect");
    if (!select || !select.value) {
        alert("Please select a subject first.");
        return;
    }

    if (hasVotedLocally()) {
        alert("You have already voted on this device.");
        return;
    }

    const selected = select.value;
    const key = selected.replace(/\s+/g, "");

    // Update local copy
    pollVotes[key] = (pollVotes[key] || 0) + 1;

    // Mark this browser as voted
    markVotedLocally();

    // Send the whole poll object to the shared backend
    fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poll: pollVotes })
    }).catch(err => console.error("Error saving poll:", err));

    renderPoll();
    logActivity(`Someone voted for more ${selected} papers / sessions`);
}
