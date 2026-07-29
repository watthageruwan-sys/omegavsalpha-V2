const API_URL = "https://script.google.com/macros/s/AKfycbwWpdBcZIQnNRyjw7Jl_ccs_Ni6AkyGYlAylvsGKs_-yHuEaX1z5Vzv5Bh8ysG9-j6pxA/exec";

let scores = { alpha: 0, omega: 0 };
let streamScores = {
    "Physical Science": 0, "Bio Science": 0, "Commerce": 0, "Technology": 0, "Arts": 0
};

let isAdminLoggedIn = false;
const ADMIN_PIN = "royal1232009"; // Synchronized Admin PIN
let viewerId = Math.random().toString(36).substring(2);
let scoreFeed = [];

// Top Performers Data
let topPerformers = {
    alpha: [ { name: "—", note: "" }, { name: "—", note: "" }, { name: "—", note: "" } ],
    omega: [ { name: "—", note: "" }, { name: "—", note: "" }, { name: "—", note: "" } ]
};

// Default Downloads Structure
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

// Poll Data Structure
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

// Target Date
let RECAP_TARGET = new Date("2026-08-05T09:00:00");

// Heartbeat
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
            if (data.scoreFeed) {
                scoreFeed = data.scoreFeed;
                if (scoreFeed.length > 0) {
                    renderScoreFeed();
                }
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
        .catch(err => console.error("Error connecting to sheet backend:", err));
}

function syncToSheet() {
    fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            scores,
            streams: streamScores,
            scoreFeed
        })
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
        time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        })
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

function updateDisplay() {
    // 1. Text Scores Updates
    const a = document.getElementById("alphaScore");
    const o = document.getElementById("omegaScore");
    if (a) { a.textContent = scores.alpha; a.classList.add("pop"); setTimeout(() => a.classList.remove("pop"), 300); }
    if (o) { o.textContent = scores.omega; o.classList.add("pop"); setTimeout(() => o.classList.remove("pop"), 300); }

    // 2. Stream Scores Panel Update
    for (let s in streamScores) {
        const el = document.getElementById("stream-" + s.replace(/\s+/g, '-'));
        if (el) el.textContent = streamScores[s];
    }

    // 3. Proportions & Percentage Label Calculations
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

    // 4. Graphical Progress Bars Update
    const progressAlpha = document.getElementById("alphaBar");
    const progressOmega = document.getElementById("omegaBar");
    if (progressAlpha) progressAlpha.style.width = aPct + "%";
    if (progressOmega) progressOmega.style.width = oPct + "%";

    // 5. Battle Status Elements & Winner Glow Calculations
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
