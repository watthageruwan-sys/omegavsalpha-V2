// Your live Google Sheets Database API link
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbybAtE2AllK3WQ3S2NHakdilPUBA4xPtKRkKPIjRLSbNRiV26rYdvTa5JsSy3srNaBzHg/exec";

let scores = { alpha: 0, omega: 0 };
const alphaScore = document.getElementById("alphaScore");
const omegaScore = document.getElementById("omegaScore");

const alphaBar = document.getElementById("alphaBar");
const omegaBar = document.getElementById("omegaBar");

const alphaPct = document.getElementById("alphaPct");
const omegaPct = document.getElementById("omegaPct");

const statusTitle = document.getElementById("statusTitle");
const statusMsg = document.getElementById("statusMsg");

let isAdminUnlocked = false;
const secretPasscode = "royal123";

// Fetch current scores from the Google Sheet
async function fetchScores() {
    try {
        let response = await fetch(WEB_APP_URL);
        let data = await response.json();
        
        // Ensure values are cleanly parsed as numbers
        scores.alpha = Number(data.alpha) || 0;
        scores.omega = Number(data.omega) || 0;
        
        updateUI();
    } catch (error) {
        console.error("Error fetching scores from cloud:", error);
    }
}

// Load scores immediately, then check for updates every 3 seconds
fetchScores();
setInterval(fetchScores, 3000); 

function toggleAdmin() {
    if (!isAdminUnlocked) {
        let pwd = prompt("Enter Admin Passcode to edit scores:");
        if (pwd === secretPasscode) {
            isAdminUnlocked = true;
            document.getElementById('controlsSection').classList.add('unlocked');
            document.getElementById('lockNotice').style.display = 'none';
            document.getElementById('adminBtn').innerText = "🔓 Admin (Unlocked)";
            alert("Admin mode activated successfully!");
        } else if (pwd !== null) {
            alert("Incorrect passcode!");
        }
    } else {
        isAdminUnlocked = false;
        document.getElementById('controlsSection').classList.remove('unlocked');
        document.getElementById('lockNotice').style.display = 'block';
        document.getElementById('adminBtn').innerText = "🔒 Admin";
        alert("Admin mode locked.");
    }
}

async function changePoints(team, pts) {
    if (!isAdminUnlocked) return;
    
    // Update locally first for instant feedback
    scores[team] += pts;
    if (scores[team] < 0) scores[team] = 0;
    updateUI();

    // Send the new numbers to Google Sheets in the background
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

    // Set local scores to zero
    scores.alpha = 0;
    scores.omega = 0;
    updateUI();

    // Send zeroed scores to Google Sheets
    try {
        await fetch(`${WEB_APP_URL}?update=true&alpha=0&omega=0`);
        alert("Scoreboard has been successfully wiped clean for the new month!");
    } catch (error) {
        console.error("Error resetting scores on cloud:", error);
        alert("Failed to sync reset to cloud. Check connection.");
    }
}

function updateUI() {
    document.getElementById('alphaScore').innerText = scores.alpha;
    document.getElementById('omegaScore').innerText = scores.omega;

    let total = scores.alpha + scores.omega;
    let alphaPercent = total === 0 ? 50 : (scores.alpha / total) * 100;
    let omegaPercent = total === 0 ? 50 : (scores.omega / total) * 100;

    document.getElementById('alphaBar').style.width = alphaPercent + '%';
    document.getElementById('omegaBar').style.width = omegaPercent + '%';

    // Greek signs included
    document.getElementById('alphaPct').innerText = `Alpha (α) (${Math.round(alphaPercent)}%)`;
    document.getElementById('omegaPct').innerText = `Omega (Ω) (${Math.round(omegaPercent)}%)`;

    let titleEl = document.getElementById('statusTitle');
    let msgEl = document.getElementById('statusMsg');

    if (scores.alpha > scores.omega) {
        titleEl.innerHTML = "👑 Team Alpha (α) is Leading!";
        msgEl.innerHTML = "Absolute dominance! Team Omega (Ω) is right on your tail though—keep pushing the limits!";
    } else if (scores.omega > scores.alpha) {
        titleEl.innerHTML = "👑 Team Omega (Ω) is Leading!";
        msgEl.innerHTML = "Incredible momentum! Team Alpha (α) is gearing up for a comeback—stay sharp!";
    } else if (total > 0) {
        titleEl.innerHTML = "⚔️ It's a Dead Heat!";
        msgEl.innerHTML = "Neck and neck! One good study session or shared resource can tilt the entire scale!";
    } else {
        titleEl.innerHTML = "🔥 Battle Just Began!";
        msgEl.innerHTML = "The scoreboard is clean. Step up, lock in, and claim the lead!";
    }
}
