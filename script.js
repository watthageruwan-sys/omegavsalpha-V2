const API_URL = "https://script.google.com/macros/s/AKfycbyVvs4JkSocFIgCOrNzyRIO02IayPswLJkeEzYz04OnFNCg2jpdxy-9HyTJxdR1utvvhA/exec";

let scores = { alpha: 0, omega: 0 };
let streamScores = {
    "Physical Science": 0, "Bio Science": 0, "Commerce": 0, "Technology": 0, "Arts": 0
};
let isAdminLoggedIn = false;
const ADMIN_PIN = "royal123";
let viewerId = Math.random().toString(36).substring(2);

// ========== TOP PERFORMERS ==========
let topPerformers = {
    alpha: [ { name: "—", note: "" }, { name: "—", note: "" }, { name: "—", note: "" } ],
    omega: [ { name: "—", note: "" }, { name: "—", note: "" }, { name: "—", note: "" } ]
};

// ========== DOWNLOAD LINKS – every subject ==========
const DEFAULT_DOWNLOADS = {
    // Physical Science
    "ps-combined-maths": { title: "Combined Mathematics", meta: "Physical Science", url: "", icon: "📐" },
    "ps-physics":        { title: "Physics",              meta: "Physical Science", url: "", icon: "⚛️" },
    "ps-chemistry":      { title: "Chemistry",            meta: "Physical Science", url: "", icon: "🧪" },
    // Bio Science
    "bs-biology":        { title: "Biology",              meta: "Bio Science", url: "", icon: "🧬" },
    "bs-chemistry":      { title: "Chemistry",            meta: "Bio Science", url: "", icon: "🧪" },
    "bs-physics":        { title: "Physics",              meta: "Bio Science", url: "", icon: "⚛️" },
    "bs-agriculture":    { title: "Agriculture",          meta: "Bio Science", url: "", icon: "🌾" },
    // Commerce
    "cm-accounting":     { title: "Accounting",           meta: "Commerce", url: "", icon: "📒" },
    "cm-business":       { title: "Business Studies",     meta: "Commerce", url: "", icon: "💼" },
    "cm-economics":      { title: "Economics",            meta: "Commerce", url: "", icon: "📈" },
    // Technology
    "tech-eng":          { title: "Engineering Technology", meta: "Technology", url: "", icon: "⚙️" },
    "tech-sft":          { title: "Science for Technology", meta: "Technology", url: "", icon: "🔬" },
    "tech-ict":          { title: "ICT",                  meta: "Technology", url: "", icon: "💻" },
    // Arts
    "arts-history":      { title: "History",              meta: "Arts", url: "", icon: "📜" },
    "arts-geography":    { title: "Geography",            meta: "Arts", url: "", icon: "🌍" },
    "arts-polscience":   { title: "Political Science",    meta: "Arts", url: "", icon: "🏛️" },
    "arts-literature":   { title: "Literature",           meta: "Arts", url: "", icon: "📖" }
};
let downloads = JSON.parse(JSON.stringify(DEFAULT_DOWNLOADS));

// ========== POLL ==========
const POLL_QUESTION = "Which subject needs more papers / group sessions next?";
const POLL_SUBJECTS = [
    { stream: "Physical Science", subjects: ["Combined Mathematics", "Physics", "Chemistry"] },
    { stream: "Bio Science", subjects: ["Biology", "Chemistry", "Physics", "Agriculture"] },
    { stream: "Commerce", subjects: ["Accounting", "Business Studies", "Economics"] },
    { stream: "Technology", subjects: ["Engineering Technology", "Science for Technology", "ICT"] },
    { stream: "Arts", subjects: ["History", "Geography", "Political Science", "Literature"] }
];
const POLL_OPTIONS = POLL_SUBJECTS.flatMap(g => g.subjects);
const POLL_VOTED_KEY = "krc_poll_has_voted_v2";
let pollVotes = {};

function hasVotedLocally() { return localStorage.getItem(POLL_VOTED_KEY) === "true"; }
function markVotedLocally() { localStorage.setItem(POLL_VOTED_KEY, "true"); }

const RECAP_TARGET = new Date("2026-08-05T09:00:00");

setInterval(() => {
    fetch(API_URL, {
        method: "POST", mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "heartbeat", viewerId })
    }).catch(() => {});
}, 15000);

window.addEventListener("DOMContentLoaded", () => {
    fetchAllData();
    setInterval(fetchAllData, 12000);
    fetch(API_URL, {
        method: "POST", mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "heartbeat", viewerId })
    }).catch(() => {});
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
            const v = document.getElementById("viewerCount");
            if (v && data.viewers !== undefined) v.textContent = data.viewers;

            if (data.topPerformers) {
                topPerformers = data.topPerformers;
                renderTopPerformers();
                if (document.getElementById("tp-alpha-1-name")) fillTopPerformersForm();
            }

            if (data.downloads && Object.keys(data.downloads).length > 0) {
                // merge so new subjects still appear even if old data exists
                downloads = { ...DEFAULT_DOWNLOADS, ...data.downloads };
            }
            renderDownloads();
            if (document.getElementById("dl-ps-combined-maths")) fillDownloadsForm();

            if (data.poll) pollVotes = data.poll;
            else { pollVotes = {}; POLL_OPTIONS.forEach(s => pollVotes[s.replace(/\s+/g,"")] = 0); }
            renderPoll();
            updateDisplay();
        })
        .catch(err => console.error(err));
}

function syncToSheet() {
    fetch(API_URL, {
        method: "POST", mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores, streams: streamScores })
    }).catch(() => {});
}

function toggleAdmin() {
    const controls = document.getElementById("controlsSection");
    const adminBtn = document.getElementById("adminBtn");
    const lockBadge = document.getElementById("lockBadge");
    if (!isAdminLoggedIn) {
        const pin = prompt("Enter Admin PIN:");
        if (pin === ADMIN_PIN) {
            isAdminLoggedIn = true;
            if (controls) { controls.classList.remove("locked"); controls.classList.add("unlocked"); }
            if (adminBtn) { adminBtn.classList.add("unlocked"); adminBtn.textContent = "🔓 Admin Logged In"; }
            if (lockBadge) lockBadge.textContent = "🔓 Unlocked";
            logActivity("Admin access granted.");
        } else if (pin !== null) alert("Incorrect PIN!");
    } else {
        isAdminLoggedIn = false;
        if (controls) { controls.classList.remove("unlocked"); controls.classList.add("locked"); }
        if (adminBtn) { adminBtn.classList.remove("unlocked"); adminBtn.textContent = "🔒 Admin Login"; }
        if (lockBadge) lockBadge.textContent = "🔒 Locked";
        logActivity("Admin logged out.");
    }
}

function awardCustomStreamScore(team) {
    if (!isAdminLoggedIn) { alert("Please login as admin first."); return; }
    const stream = document.getElementById("streamSelect").value;
    const points = parseInt(document.getElementById("achievementSelect").value);
    const text = document.getElementById("achievementSelect").selectedOptions[0].text.split(" (")[0];
    scores[team] += points;
    streamScores[stream] += points;
    updateDisplay();
    syncToSheet();
    logActivity(`${team === 'alpha' ? 'α-Alpha' : 'Ω-Omega'} earned +${points} pts in [${stream}] for ${text}!`);
}

function resetScores() {
    if (!isAdminLoggedIn) { alert("Please login as admin first."); return; }
    if (confirm("Reset all scores to zero?")) {
        scores.alpha = 0; scores.omega = 0;
        Object.keys(streamScores).forEach(k => streamScores[k] = 0);
        updateDisplay(); syncToSheet();
        logActivity("Scoreboard has been reset to zero.");
    }
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
    if (total > 0) { aPct = scores.alpha / total * 100; oPct = scores.omega / total * 100; }
    if (document.getElementById("alphaBar")) document.getElementById("alphaBar").style.width = aPct + "%";
    if (document.getElementById("omegaBar")) document.getElementById("omegaBar").style.width = oPct + "%";
    if (document.getElementById("alphaPct")) document.getElementById("alphaPct").textContent = `α-Alpha (${Math.round(aPct)}%)`;
    if (document.getElementById("omegaPct")) document.getElementById("omegaPct").textContent = `Ω-Omega (${Math.round(oPct)}%)`;

    const title = document.getElementById("statusTitle");
    const desc = document.getElementById("statusDesc");
    const aCard = document.getElementById("alphaCard");
    const oCard = document.getElementById("omegaCard");
    if (aCard) aCard.className = "team-card alpha-card";
    if (oCard) oCard.className = "team-card omega-card";
    if (title && desc) {
        if (scores.alpha === 0 && scores.omega === 0) {
            title.textContent = "🔥 Battle Just Began!";
            desc.textContent = "The scoreboard is clean. Step up, lock in, and claim the lead!";
        } else if (scores.alpha === scores.omega) {
            title.textContent = "⚖️ It's a Tie Game!";
            desc.textContent = "Both teams are locked in neck-and-neck intensity!";
            if (aCard) aCard.classList.add("is-tied");
            if (oCard) oCard.classList.add("is-tied");
        } else if (scores.alpha > scores.omega) {
            title.textContent = "👑 α-Alpha is Leading!";
            desc.textContent = "Team Alpha is currently dominating the scoreboard.";
            if (aCard) aCard.classList.add("is-winning");
        } else {
            title.textContent = "👑 Ω-Omega is Leading!";
            desc.textContent = "Team Omega is currently dominating the scoreboard.";
            if (oCard) oCard.classList.add("is-winning");
        }
    }
}

function logActivity(msg) {
    const log = document.getElementById("activityLog");
    if (!log) return;
    const time = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' });
    const item = document.createElement("div");
    item.className = "activity-item";
    item.innerHTML = `<span class="activity-time">[${time}]</span> ${msg}`;
    log.prepend(item);
}

function updateCountdown() {
    const diff = RECAP_TARGET - new Date();
    if (diff < 0) {
        ["countdownDays","countdownHours","countdownMins","countdownSecs"].forEach(id => {
            const el = document.getElementById(id); if (el) el.textContent = "0";
        });
        const note = document.getElementById("countdownNote");
        if (note) note.textContent = "Recap paper time has arrived! Good luck everyone 💪";
        return;
    }
    document.getElementById("countdownDays").textContent = Math.floor(diff / 86400000);
    document.getElementById("countdownHours").textContent = Math.floor((diff % 86400000) / 3600000).toString().padStart(2,"0");
    document.getElementById("countdownMins").textContent = Math.floor((diff % 3600000) / 60000).toString().padStart(2,"0");
    document.getElementById("countdownSecs").textContent = Math.floor((diff % 60000) / 1000).toString().padStart(2,"0");
}

function renderTopPerformers() {
    const aList = document.getElementById("topAlphaList");
    const oList = document.getElementById("topOmegaList");
    if (!aList || !oList) return;
    const ranks = ["gold","silver","bronze"];
    aList.innerHTML = topPerformers.alpha.map((p,i) => `
        <div class="performer-item"><div class="rank-badge ${ranks[i]||''}">${i+1}</div>
        <div><strong style="color:#f8fafc">${p.name||"—"}</strong>
        <div style="font-size:0.75rem;color:#94a3b8">${p.note||""}</div></div></div>`).join("");
    oList.innerHTML = topPerformers.omega.map((p,i) => `
        <div class="performer-item"><div class="rank-badge ${ranks[i]||''}">${i+1}</div>
        <div><strong style="color:#f8fafc">${p.name||"—"}</strong>
        <div style="font-size:0.75rem;color:#94a3b8">${p.note||""}</div></div></div>`).join("");
}

function fillTopPerformersForm() {
    for (let i=0;i<3;i++) {
        const n=document.getElementById(`tp-alpha-${i+1}-name`);
        const note=document.getElementById(`tp-alpha-${i+1}-note`);
        if(n) n.value = topPerformers.alpha[i]?.name||"";
        if(note) note.value = topPerformers.alpha[i]?.note||"";
    }
    for (let i=0;i<3;i++) {
        const n=document.getElementById(`tp-omega-${i+1}-name`);
        const note=document.getElementById(`tp-omega-${i+1}-note`);
        if(n) n.value = topPerformers.omega[i]?.name||"";
        if(note) note.value = topPerformers.omega[i]?.note||"";
    }
}

function saveTopPerformersFromAdmin() {
    if (!isAdminLoggedIn) { alert("Please login as admin first."); return; }
    for (let i=0;i<3;i++) {
        topPerformers.alpha[i] = {
            name: document.getElementById(`tp-alpha-${i+1}-name`)?.value.trim()||"—",
            note: document.getElementById(`tp-alpha-${i+1}-note`)?.value.trim()||""
        };
        topPerformers.omega[i] = {
            name: document.getElementById(`tp-omega-${i+1}-name`)?.value.trim()||"—",
            note: document.getElementById(`tp-omega-${i+1}-note`)?.value.trim()||""
        };
    }
    fetch(API_URL, { method:"POST", mode:"no-cors", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ topPerformers }) }).catch(()=>{});
    renderTopPerformers();
    logActivity("Top Performers updated by admin.");
    alert("✅ Top Performers saved!");
}

/* ========== DOWNLOADS ========== */
function renderDownloads() {
    const container = document.getElementById("downloadsContainer");
    if (!container) return;

    // Group by stream for nicer display
    const groups = {
        "Physical Science": ["ps-combined-maths","ps-physics","ps-chemistry"],
        "Bio Science": ["bs-biology","bs-chemistry","bs-physics","bs-agriculture"],
        "Commerce": ["cm-accounting","cm-business","cm-economics"],
        "Technology": ["tech-eng","tech-sft","tech-ict"],
        "Arts": ["arts-history","arts-geography","arts-polscience","arts-literature"]
    };

    let html = "";
    for (const stream in groups) {
        html += `<div style="grid-column:1/-1; margin-top:8px; margin-bottom:4px; color:#ffd700; font-size:0.85rem; font-weight:600;">${stream}</div>`;
        groups[stream].forEach(key => {
            const item = downloads[key] || DEFAULT_DOWNLOADS[key];
            const hasLink = item.url && item.url.trim().length > 5;
            html += `
                <div class="download-card">
                    <div class="download-icon">${item.icon || "📄"}</div>
                    <div class="download-title">${item.title}</div>
                    <div class="download-meta">${item.meta}</div>
                    ${hasLink
                        ? `<a href="${item.url}" target="_blank" class="btn-download">Download</a>`
                        : `<a href="#" class="btn-download" onclick="alert('Link not added yet.'); return false;">Coming Soon</a>`
                    }
                </div>`;
        });
    }
    container.innerHTML = html;
}

function fillDownloadsForm() {
    for (const key in DEFAULT_DOWNLOADS) {
        const el = document.getElementById("dl-" + key);
        if (el) el.value = (downloads[key] && downloads[key].url) || "";
    }
}

function saveDownloadsFromAdmin() {
    if (!isAdminLoggedIn) { alert("Please login as admin first."); return; }
    for (const key in DEFAULT_DOWNLOADS) {
        const el = document.getElementById("dl-" + key);
        if (!downloads[key]) downloads[key] = { ...DEFAULT_DOWNLOADS[key] };
        downloads[key].url = el ? el.value.trim() : "";
        downloads[key].title = DEFAULT_DOWNLOADS[key].title;
        downloads[key].meta = DEFAULT_DOWNLOADS[key].meta;
        downloads[key].icon = DEFAULT_DOWNLOADS[key].icon;
    }
    fetch(API_URL, {
        method: "POST", mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ downloads })
    }).catch(() => {});
    renderDownloads();
    logActivity("Past paper links updated by admin.");
    alert("✅ All download links saved!");
}

/* ========== POLL ========== */
function renderPoll() {
    const container = document.getElementById("pollContainer");
    if (!container) return;
    let total = 0;
    POLL_OPTIONS.forEach(opt => total += (pollVotes[opt.replace(/\s+/g,"")] || 0));
    const alreadyVoted = hasVotedLocally();
    let html = `<div class="poll-question">${POLL_QUESTION}</div>`;
    if (!alreadyVoted) {
        html += `<select id="pollSelect" style="width:100%;background:rgba(0,0,40,0.9);color:#f8fafc;border:1px solid rgba(255,215,0,0.4);padding:12px;border-radius:10px;font-size:0.95rem;margin-bottom:12px;outline:none;">
            <option value="">— Select a subject —</option>`;
        POLL_SUBJECTS.forEach(g => {
            html += `<optgroup label="${g.stream}">`;
            g.subjects.forEach(s => html += `<option value="${s}">${s}</option>`);
            html += `</optgroup>`;
        });
        html += `</select><button class="poll-vote-btn" onclick="submitPollVote()">Cast Your Vote</button>`;
    } else {
        html += `<div class="poll-total" style="margin-bottom:14px;">You already voted • Total votes: ${total}</div>`;
    }
    if (total > 0) {
        html += `<div style="margin-top:8px;"><div style="font-size:0.85rem;color:#94a3b8;margin-bottom:8px;">Current results (shared):</div>`;
        POLL_OPTIONS.map(opt => ({ name: opt, count: pollVotes[opt.replace(/\s+/g,"")] || 0 }))
            .filter(x => x.count > 0).sort((a,b) => b.count - a.count)
            .forEach(item => {
                const pct = Math.round(item.count / total * 100);
                html += `<div class="poll-option" style="cursor:default;margin-bottom:8px;">
                    <div style="flex:1"><div class="poll-option-text">${item.name}</div>
                    <div class="poll-bar-container"><div class="poll-bar-bg"><div class="poll-bar-fill" style="width:${pct}%"></div></div></div></div>
                    <div class="poll-percent">${pct}%</div></div>`;
            });
        html += `</div>`;
    }
    container.innerHTML = html;
}

function submitPollVote() {
    const select = document.getElementById("pollSelect");
    if (!select || !select.value) { alert("Please select a subject first."); return; }
    if (hasVotedLocally()) { alert("You have already voted on this device."); return; }
    const selected = select.value;
    const key = selected.replace(/\s+/g, "");
    pollVotes[key] = (pollVotes[key] || 0) + 1;
    markVotedLocally();
    fetch(API_URL, {
        method: "POST", mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poll: pollVotes })
    }).catch(() => {});
    renderPoll();
    logActivity(`Someone voted for more ${selected} papers / sessions`);
}
