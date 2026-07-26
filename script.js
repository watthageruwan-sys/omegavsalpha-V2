const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbybAtE2AllK3WQ3S2NHakdilPUBA4xPtKRkKPIjRLSbNRiV26rYdvTa5JsSy3srNaBzHg/exec";

let scores = { alpha: 0, omega: 0 };
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
    el.classList.add('pop');
    setTimeout(() => el.classList.remove('pop'), 300);
}

function toggleAdmin() {
    if (!isAdminUnlocked) {
        let pwd = prompt("Enter Admin Passcode to edit scores:");
        if (pwd === secretPasscode) {
            isAdminUnlocked = true;
            document.getElementById('controlsSection').classList.add('unlocked');
            document.getElementById('lockNotice').style.display = 'none';
            document.getElementById('adminBtn').innerText = "🔓 Admin (Unlocked)";
            document.getElementById('adminBtn').classList.add('unlocked');
        } else if (pwd !== null) {
            alert("Incorrect passcode!");
        }
    } else {
        isAdminUnlocked = false;
        document.getElementById('controlsSection').classList.remove('unlocked');
        document.getElementById('lockNotice').style.display = 'block';
        document.getElementById('adminBtn').innerText = "🔒 Admin";
        document.getElementById('adminBtn').classList.remove('unlocked');
    }
}

async function changePoints(team, pts) {
    if (!isAdminUnlocked) return;
    
    scores[team] += pts;
    if (scores[team] < 0) scores[team] = 0;
    
    animateScoreChange(team === 'alpha' ? 'alphaScore' : 'omegaScore');
    updateUI();

    try {
        await fetch(`${WEB_APP_URL}?update=true&alpha=${scores.alpha}&omega=${scores.omega}`);
    } catch (error) {
        console.error("Error saving scores to cloud:", error);
    }
}

async function resetScores() {
    if (!isAdminUnlocked) return;
    let confirmReset = confirm("Are you sure you want to wipe all scores and start a fresh month?");
    if (!confirmReset) return;

    scores.alpha = 0;
    scores.omega = 0;
    updateUI();

    try {
        await fetch(`${WEB_APP_URL}?update=true&alpha=0&omega=0`);
        alert("Scoreboard wiped clean for the new month!");
    } catch (error) {
        console.error("Error resetting scores:", error);
    }
}

function updateUI() {
    document.getElementById('alphaScore').innerText = scores.alpha;
    document.getElementById('omegaScore').innerText = scores.omega;

    let alphaCard = document.querySelector('.alpha-card');
    let omegaCard = document.querySelector('.omega-card');

    alphaCard.classList.remove('is-winning');
    omegaCard.classList.remove('is-winning');

    if (scores.alpha > scores.omega) {
        alphaCard.classList.add('is-winning');
    } else if (scores.omega > scores.alpha) {
        omegaCard.classList.add('is-winning');
    }

    let total = scores.alpha + scores.omega;
    let alphaPercent = total === 0 ? 50 : (scores.alpha / total) * 100;
    let omegaPercent = total === 0 ? 50 : (scores.omega / total) * 100;

    document.getElementById('alphaBar').style.width = alphaPercent + '%';
    document.getElementById('omegaBar').style.width = omegaPercent + '%';

    document.getElementById('alphaPct').innerText = `Alpha (α) (${Math.round(alphaPercent)}%)`;
    document.getElementById('omegaPct').innerText = `Omega (Ω) (${Math.round(omegaPercent)}%)`;

    let titleEl = document.getElementById('statusTitle');
    let msgEl = document.getElementById('statusMsg');

    if (scores.alpha > scores.omega) {
        titleEl.innerHTML = "👑 Team Alpha (α) is Leading!";
        msgEl.innerHTML = "Absolute dominance! Team Omega (Ω) is right on your tail—keep pushing!";
    } else if (scores.omega > scores.alpha) {
        titleEl.innerHTML = "👑 Team Omega (Ω) is Leading!";
        msgEl.innerHTML = "Incredible momentum! Team Alpha (α) is gearing up for a comeback—stay sharp!";
    } else if (total > 0) {
        titleEl.innerHTML = "⚔️ It's a Dead Heat!";
        msgEl.innerHTML = "Neck and neck! One good session can shift the balance!";
    } else {
        titleEl.innerHTML = "🔥 Battle Just Began!";
        msgEl.innerHTML = "The scoreboard is clean. Step up, lock in, and claim the lead!";
    }
}
