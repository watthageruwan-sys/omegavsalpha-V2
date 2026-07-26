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

    // Load scores from URL hash or fallback to localStorage
    function loadScores() {
        const hash = window.location.hash.substring(1);
        if (hash.includes('a=') && hash.includes('o=')) {
            const params = new URLSearchParams(hash);
            scores.alpha = parseInt(params.get('a')) || 0;
            scores.omega = parseInt(params.get('o')) || 0;
        } else {
            scores.alpha = parseInt(localStorage.getItem('arena_a')) || 0;
            scores.omega = parseInt(localStorage.getItem('arena_o')) || 0;
        }
        updateUI();
    }

    loadScores();

    function toggleAdmin() {
        if (!isAdminUnlocked) {
            let pwd = prompt("Enter Admin Passcode to edit scores:");
            if (pwd === secretPasscode) {
                isAdminUnlocked = true;
                document.getElementById('controlsSection').classList.add('unlocked');
                document.getElementById('lockNotice').style.display = 'none';
                alert("Admin mode activated successfully!");
            } else if (pwd !== null) {
                alert("Incorrect passcode!");
            }
        } else {
            isAdminUnlocked = false;
            document.getElementById('controlsSection').classList.remove('unlocked');
            document.getElementById('lockNotice').style.display = 'block';
            alert("Admin mode locked.");
        }
    }

    function changePoints(team, pts) {
        if (!isAdminUnlocked) return;
        
        scores[team] += pts;
        if (scores[team] < 0) scores[team] = 0;

        // Save locally and update URL hash so it can be shared instantly across devices
        localStorage.setItem('arena_a', scores.alpha);
        localStorage.setItem('arena_o', scores.omega);
        
        window.location.hash = `a=${scores.alpha}&o=${scores.omega}`;

        updateUI();
    }

    function updateUI() {
        document.getElementById('alphaScore').innerText = scores.alpha;
        document.getElementById('omegaScore').innerText = scores.omega;

        let total = scores.alpha + scores.omega;
        let alphaPct = total === 0 ? 50 : (scores.alpha / total) * 100;
        let omegaPct = total === 0 ? 50 : (scores.omega / total) * 100;

        document.getElementById('alphaBar').style.width = alphaPct + '%';
        document.getElementById('omegaBar').style.width = omegaPct + '%';

        document.getElementById('alphaPct').innerText = `Alpha (${Math.round(alphaPct)}%)`;
        document.getElementById('omegaPct').innerText = `Omega (${Math.round(omegaPct)}%)`;

        let titleEl = document.getElementById('statusTitle');
        let msgEl = document.getElementById('statusMsg');

        if (scores.alpha > scores.omega) {
            titleEl.innerHTML = "👑 Team Alpha is Leading!";
            msgEl.innerHTML = "Absolute dominance! Team Omega is right on your tail though—keep pushing the limits!";
        } else if (scores.omega > scores.alpha) {
            titleEl.innerHTML = "👑 Team Omega is Leading!";
            msgEl.innerHTML = "Incredible momentum! Team Alpha is gearing up for a comeback—stay sharp!";
        } else if (total > 0) {
            titleEl.innerHTML = "⚔️ It's a Dead Heat!";
            msgEl.innerHTML = "Neck and neck! One good study session or shared resource can tilt the entire scale!";
        } else {
            titleEl.innerHTML = "🔥 Battle Just Began!";
            msgEl.innerHTML = "The scoreboard is clean. Step up, lock in, and claim the lead!";
        }
    }