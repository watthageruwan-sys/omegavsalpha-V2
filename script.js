const API_URL = "https://script.google.com/macros/s/AKfycbwWpdBcZIQnNRyjw7Jl_ccs_Ni6AkyGYlAylvsGKs_-yHuEaX1z5Vzv5Bh8ysG9-j6pxA/exec";

let scores = { alpha: 0, omega: 0 };
let streamScores = {
    "Physical Science": 0, "Bio Science": 0, "Commerce": 0, "Technology": 0, "Arts": 0
};

let isAdminLoggedIn = false;
const ADMIN_PIN = "royal1232009"; 
let viewerId = Math.random().toString(36).substring(2);
let scoreFeed = [];

let topPerformers = {
    alpha: [ { name: "—", note: "" }, { name: "—", note: "" }, { name: "—", note: "" } ],
    omega: [ { name: "—", note: "" }, { name: "—", note: "" }, { name: "—", note: "" } ]
};

const DEFAULT_DOWNLOADS = {
    "ps-combined-maths": { title: "Combined Mathematics", meta: "Physical Science", url: "", icon: "📐" },
    "ps-physics":        { title: "Physics",              meta: "Physical Science", url: "", icon: "⚛️" },
    "ps-chemistry":      { title: "Chemistry",            meta: "Physical Science", url: "", icon: "🧪" },
    "bs-biology":        { title: "Biology",              meta: "Bio Science", url: "", icon: "🧬" },
    "bs-chemistry":      { title: "Chemistry",            meta: "Bio Science", url: "", icon: "🧪" },
    "bs-physics":        { title: "Physics",              meta: "Bio Science", url: "", icon: "⚛️" },
    "bs-agriculture":    { title: "Agriculture",          meta: "Bio Science", url: "", icon: "🌾" },
    "cm-accounting":     { title: "Accounting",           meta: "Commerce", url: "", icon: "📒" },
    "cm-business":       { title: "Business Studies",     meta: "Commerce", url: "", icon: "💼" },
    "cm-economics":      { title: "Economics",            meta: "Commerce", url: "", icon: "📈" },
    "tech-eng":          { title: "Engineering Technology", meta: "Technology", url: "", icon: "⚙️" },
    "tech-bst":          { title: "Bio Systems Technology", meta: "Technology", url: "", icon: "🌱" },
    "tech-sft":          { title: "Science for Technology", meta: "Technology", url: "", icon: "🔬" },
    "tech-ict":          { title: "ICT",                  meta: "Technology", url: "", icon: "💻" },
    "arts-history":      { title: "History",              meta: "Arts", url: "", icon: "📜" },
    "arts-geography":    { title: "Geography",            meta: "Arts", url: "", icon: "🌍" },
    "arts-polscience":   { title: "Political Science",    meta: "Arts", url: "", icon: "🏛️" },
    "arts-literature":   { title: "Literature",           meta: "Arts", url: "", icon: "📖" }
};
let downloads = JSON.parse(JSON.stringify(DEFAULT_DOWNLOADS));

const POLL_QUESTION = "Which subject needs more papers / group sessions next?";
const POLL_SUBJECTS = [
    { stream: "Physical Science", subjects: ["Combined Mathematics", "Physics", "Chemistry"] },
    { stream: "Bio Science", subjects: ["Biology", "Chemistry", "Physics", "Agriculture"] },
    { stream: "Commerce", subjects: ["Accounting", "Business Studies", "Economics"] },
    { stream: "Technology", subjects: ["Engineering Technology", "Bio Systems Technology", "Science for Technology", "ICT"] },
    { stream: "Arts", subjects: ["History", "Geography", "Political Science", "Literature"] }
];
const POLL_OPTIONS = POLL_SUBJECTS.flatMap(g => g.subjects);
const POLL_VOTED_KEY = "krc_poll_has_voted_v2";
let pollVotes = {};

function hasVotedLocally() { return localStorage.getItem(POLL_VOTED_KEY) === "true"; }
function markVotedLocally() { localStorage.setItem(POLL_VOTED_KEY, "true"); }

let RECAP_TARGET = new Date("2026-08-05T09:00:00");
setInterval(() => {
    fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "heartbeat", viewerId })
    }).catch(() => {});
}, 15000);

window.addEventListener("DOMContentLoaded", () => {
    fetchAllData();
    setInterval(fetchAllData, 12000);
    if (document.getElementById("countdownDays")) {
        updateCountdown();
        setInterval(updateCountdown, 1000);
    }
});

function fetchAllData() {
    fetch(API_URL)
        .then(r => r.json())
        .then(data => {
            if (data.scores) { scores.alpha = data.scores.alpha || 0; scores.omega = data.scores.omega || 0; }
            if (data.streams) streamScores = data.streams;
            if (data.scoreFeed && data.scoreFeed.length > 0) {
                scoreFeed = data.scoreFeed;
                renderScoreFeed();
            }
            const v = document.getElementById("viewerCount");
            if (v && data.viewers !== undefined) v.textContent = data.viewers;
            if (data.topPerformers) {
                topPerformers = data.topPerformers;
                renderTopPerformers();
                if (document.getElementById("tp-alpha-1-name")) fillTopPerformersForm();
            }
            if (data.downloads && Object.keys(data.downloads).length > 0) {
                downloads = { ...DEFAULT_DOWNLOADS, ...data.downloads };
            }
            renderDownloads();
            if (document.getElementById("dl-ps-combined-maths")) fillDownloadsForm();
            if (data.poll) pollVotes = data.poll;
            else { pollVotes = {}; POLL_OPTIONS.forEach(s => pollVotes[s.replace(/\s+/g,"")] = 0); }
            renderPoll();
            if (data.recapDate) {
                RECAP_TARGET = new Date(data.recapDate);
                const dateInput = document.getElementById("recapDateInput");
                if (dateInput) {
                    const d = RECAP_TARGET;
                    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
                    dateInput.value = local.toISOString().slice(0, 16);
                }
                const note = document.getElementById("countdownNote");
                if (note) {
                    const options = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
                    note.textContent = "Target: " + RECAP_TARGET.toLocaleString('en-GB', options);
                }
            }
            updateDisplay();
        })
        .catch(err => console.error("Error connecting to backend:", err));
}

function syncToSheet() {
    fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores, streams: streamScores, scoreFeed })
    }).catch(() => {});
}

function awardCustomStreamScore(team) {
    const stream = document.getElementById("streamSelect").value;
    const points = parseInt(document.getElementById("achievementSelect").value, 10) || 0;
    const selectEl = document.getElementById("achievementSelect");
    const optionText = selectEl.options[selectEl.selectedIndex].text;
    const criterion = optionText.replace(/\s*\(\+\d+\s*pts\)/i, '').toLowerCase();

    scores[team] += points;
    streamScores[stream] = (streamScores[stream] || 0) + points;

    scoreFeed.unshift({
        team: team,
        teamName: team === "alpha" ? "α-Alpha" : "Ω-Omega",
        points: points,
        stream: stream,
        reason: criterion,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    });
    scoreFeed = scoreFeed.slice(0, 20);

    updateDisplay();
    renderScoreFeed();
    syncToSheet();
}

function resetScores() {
    if (confirm("Reset all scores to zero?")) {
        scores.alpha = 0; scores.omega = 0;
        Object.keys(streamScores).forEach(k => streamScores[k] = 0);
        scoreFeed = [];
        updateDisplay(); 
        renderScoreFeed();
        syncToSheet();
    }
}

function submitVote(subjectKey) {
    if (hasVotedLocally()) return;
    markVotedLocally();
    pollVotes[subjectKey] = (pollVotes[subjectKey] || 0) + 1;
    renderPoll();
    fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "vote", subject: subjectKey })
    }).catch(() => {});
}
function updateDisplay() {
    const a = document.getElementById("alphaScore");
    const o = document.getElementById("omegaScore");
    if (a) { a.textContent = scores.alpha; a.classList.add("pop"); setTimeout(() => a.classList.remove("pop"), 300); }
    if (o) { o.textContent = scores.omega; o.classList.add("pop"); setTimeout(() => o.classList.remove("pop"), 300); }

    for (let s in streamScores) {
        const el = document.getElementById("stream-" + s.replace(/\s+/g, '-'));
        if (el) el.textContent = streamScores[s];
    }

    const total = scores.alpha + scores.omega;
    let aPct = 50, oPct = 50;
    if (total > 0) { 
        aPct = (scores.alpha / total) * 100; 
        oPct = (scores.omega / total) * 100; 
    }

    const alphaPctLabel = document.getElementById("alphaPct");
    const omegaPctLabel = document.getElementById("omegaPct");
    if (alphaPctLabel) alphaPctLabel.textContent = `α-Alpha (${Math.round(aPct)}%)`;
    if (omegaPctLabel) omegaPctLabel.textContent = `Ω-Omega (${Math.round(oPct)}%)`;

    const progressAlpha = document.getElementById("alphaBar");
    const progressOmega = document.getElementById("omegaBar");
    if (progressAlpha) progressAlpha.style.width = aPct + "%";
    if (progressOmega) progressOmega.style.width = oPct + "%";

    const statusTitle = document.getElementById("statusTitle");
    const statusDesc = document.getElementById("statusDesc");
    const alphaCard = document.getElementById("alphaCard");
    const omegaCard = document.getElementById("omegaCard");

    if (scores.alpha > scores.omega) {
        if (statusTitle) statusTitle.textContent = "👑 α-Alpha is Leading!";
        if (statusDesc) statusDesc.textContent = "Team Alpha is currently dominating the scoreboard.";
        if (alphaCard) alphaCard.classList.add("winner-glow");
        if (omegaCard) omegaCard.classList.remove("winner-glow");
    } else if (scores.omega > scores.alpha) {
        if (statusTitle) statusTitle.textContent = "👑 Ω-Omega is Leading!";
        if (statusDesc) statusDesc.textContent = "Team Omega is currently dominating the scoreboard.";
        if (omegaCard) omegaCard.classList.add("winner-glow");
        if (alphaCard) alphaCard.classList.remove("winner-glow");
    } else {
        if (statusTitle) statusTitle.textContent = "🤝 It's a Tie!";
        if (statusDesc) statusDesc.textContent = "Both teams are tied.";
        if (alphaCard) alphaCard.classList.remove("winner-glow");
        if (omegaCard) omegaCard.classList.remove("winner-glow");
    }
}

function renderScoreFeed() {
    const latest = document.getElementById("latestActivityText");
    const log = document.getElementById("activityLog");
    if (!latest || !log) return;
    if (scoreFeed.length === 0) {
        latest.textContent = "Standing by for new points...";
        log.innerHTML = "";
        return;
    }
    latest.textContent = `${scoreFeed[0].teamName} +${scoreFeed[0].points} • ${scoreFeed[0].reason}`;
    log.innerHTML = "";
    scoreFeed.forEach(item => {
        const div = document.createElement("div");
        div.className = "activity-item";
        div.innerHTML = `
            <span class="activity-time">[${item.time}]</span>
            <strong>${item.teamName}</strong> earned <strong>+${item.points}</strong> for ${item.reason} (${item.stream})
        `;
        log.appendChild(div);
    });
}

function renderDownloads() {
    for (let key in downloads) {
        const dl = downloads[key];
        const btn = document.getElementById("dl-" + key);
        if (btn) {
            if (dl.url) {
                btn.href = dl.url;
                btn.removeAttribute("disabled");
                btn.classList.remove("disabled-download");
            } else {
                btn.removeAttribute("href");
                btn.setAttribute("disabled", "true");
                btn.classList.add("disabled-download");
            }
        }
    }
}

function fillDownloadsForm() {
    for (let key in downloads) {
        const input = document.getElementById("input-dl-" + key);
        if (input) { input.value = downloads[key].url || ""; }
    }
}

function renderTopPerformers() {
    ['alpha', 'omega'].forEach(team => {
        for (let i = 0; i < 3; i++) {
            const member = topPerformers[team][i] || { name: "—", note: "" };
            const nameEl = document.getElementById(`tp-${team}-${i+1}-name`);
            const noteEl = document.getElementById(`tp-${team}-${i+1}-note`);
            if (nameEl) nameEl.textContent = member.name;
            if (noteEl) noteEl.textContent = member.note || "";
        }
    });
}

function fillTopPerformersForm() {
    ['alpha', 'omega'].forEach(team => {
        for (let i = 0; i < 3; i++) {
            const member = topPerformers[team][i] || { name: "—", note: "" };
            const nameInput = document.getElementById(`input-tp-${team}-${i+1}-name`);
            const noteInput = document.getElementById(`input-tp-${team}-${i+1}-note`);
            if (nameInput) nameInput.value = member.name === "—" ? "" : member.name;
            if (noteInput) noteInput.value = member.note || "";
        }
    });
}

function renderPoll() {
    const container = document.getElementById("pollContainer");
    if (!container) return;
    container.innerHTML = "";
    const voted = hasVotedLocally();
    POLL_SUBJECTS.forEach(group => {
        const header = document.createElement("h4");
        header.className = "poll-stream-title";
        header.textContent = group.stream + " Stream";
        container.appendChild(header);
        group.subjects.forEach(sub => {
            const cleanKey = sub.replace(/\s+/g, "");
            const votes = pollVotes[cleanKey] || 0;
            const totalVotes = Object.values(pollVotes).reduce((a, b) => a + b, 0);
            const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            const row = document.createElement("div");
            row.className = "poll-option-row";
            if (voted) {
                row.innerHTML = `
                    <div class="poll-result-bar" style="width: ${pct}%"></div>
                    <span class="poll-option-text">${sub}</span>
                    <span class="poll-option-pct">${pct}% (${votes})</span>
                `;
            } else {
                const btn = document.createElement("button");
                btn.className = "poll-vote-btn";
                btn.textContent = sub;
                btn.onclick = () => submitVote(cleanKey);
                row.appendChild(btn);
            }
            container.appendChild(row);
        });
    });
}

function updateCountdown() {
    const now = new Date();
    const diff = RECAP_TARGET - now;
    const dEl = document.getElementById("countdownDays");
    const hEl = document.getElementById("countdownHours");
    const mEl = document.getElementById("countdownMinutes");
    const sEl = document.getElementById("countdownSeconds");
    if (diff <= 0) {
        if (dEl) dEl.textContent = "00";
        if (hEl) hEl.textContent = "00";
        if (mEl) mEl.textContent = "00";
        if (sEl) sEl.textContent = "00";
        return;
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    if (dEl) dEl.textContent = String(days).padStart(2, '0');
    if (hEl) hEl.textContent = String(hours).padStart(2, '0');
    if (mEl) mEl.textContent = String(mins).padStart(2, '0');
    if (sEl) sEl.textContent = String(secs).padStart(2, '0');
}

now?
