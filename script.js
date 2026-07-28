// =======================================
// ALPHA OMEGA ARENA - SCRIPT.JS
// PART 1/3 - CORE + FETCH + ADMIN + SCORES
// =======================================


const API_URL = "https://script.google.com/macros/s/AKfycbyEE5g2xVdhi69w6UvSRwz1VloJ6bX-drsUqn4xyMi9SDMllf7ihKHeUPcSrbyIdsWa5g/exec";


// Detect page
const isAdminPage = window.location.pathname.includes("admin.html");


// -------------------------------
// DATA
// -------------------------------

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


// Countdown date loaded from JSON
let recapDate = null;


// Admin
let isAdminLoggedIn = false;
const ADMIN_PIN = "royal123";


// Viewer ID
let viewerId = Math.random().toString(36).substring(2);



// -------------------------------
// VIEWER HEARTBEAT
// -------------------------------

if (!isAdminPage) {

    setInterval(() => {

        fetch(API_URL, {

            method: "POST",

            mode: "no-cors",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                type: "heartbeat",

                viewerId: viewerId

            })

        });

    },15000);

}



// -------------------------------
// PAGE LOAD
// -------------------------------

window.addEventListener("DOMContentLoaded", () => {


    fetchScores();



    if(!isAdminPage){

        fetch(API_URL, {

            method:"POST",

            mode:"no-cors",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({

                type:"heartbeat",

                viewerId:viewerId

            })

        });

    }


});





// -------------------------------
// FETCH GOOGLE SHEET DATA
// -------------------------------

function fetchScores(){


    fetch(API_URL)

    .then(response => response.json())

    .then(data => {



        // Scores

        if(data && data.scores){

            scores.alpha = data.scores.alpha || 0;

            scores.omega = data.scores.omega || 0;

        }



        // Streams

        if(data && data.streams){

            streamScores = data.streams;

        }




        // Recap Countdown Date

        if(data && data.recapDate){

            recapDate = new Date(data.recapDate);

            console.log("Recap Date Loaded:", recapDate);

        }




        // Viewer Count

        let viewerElem = document.getElementById("viewerCount");


        if(viewerElem && data.viewers !== undefined){

            viewerElem.textContent = data.viewers;

        }




        updateDisplay();



    })

    .catch(err => {

        console.error("Error fetching data:",err);

    });


}





// -------------------------------
// SYNC TO GOOGLE SHEET
// -------------------------------

function syncToSheet(){


    fetch(API_URL, {


        method:"POST",

        mode:"no-cors",


        headers:{

            "Content-Type":"application/json"

        },


        body:JSON.stringify({


            scores:scores,

            streams:streamScores


        })


    })

    .catch(err=>{

        console.error("Sync Error:",err);

    });


}





// -------------------------------
// ADMIN LOGIN
// -------------------------------

function toggleAdmin(){



    const controls =
    document.getElementById("controlsSection");


    const adminBtn =
    document.getElementById("adminBtn");


    const lockBadge =
    document.getElementById("lockBadge");




    if(!isAdminLoggedIn){



        let enteredPin = prompt("Enter Admin PIN:");



        if(enteredPin === ADMIN_PIN){


            isAdminLoggedIn = true;


            controls.classList.remove("locked");

            controls.classList.add("unlocked");


            adminBtn.classList.add("unlocked");


            adminBtn.textContent =
            "🔓 Admin Logged In";


            lockBadge.textContent =
            "🔓 Unlocked";


            logActivity("Admin access granted.");



        }

        else if(enteredPin !== null){


            alert("Incorrect PIN!");

        }



    }

    else{


        isAdminLoggedIn=false;


        controls.classList.remove("unlocked");

        controls.classList.add("locked");


        adminBtn.classList.remove("unlocked");


        adminBtn.textContent =
        "🔒 Admin Login";


        lockBadge.textContent =
        "🔒 Locked";


        logActivity("Admin logged out.");


    }


}





// -------------------------------
// ADD POINTS
// -------------------------------

function awardCustomStreamScore(team){


    const streamSelect =
    document.getElementById("streamSelect");


    const achievementSelect =
    document.getElementById("achievementSelect");



    const selectedStream =
    streamSelect.value;



    const points =
    parseInt(achievementSelect.value);



    const achievementText =
    achievementSelect.options[
    achievementSelect.selectedIndex
    ].text.split(" (")[0];




    scores[team] += points;


    streamScores[selectedStream] += points;



    updateDisplay();


    syncToSheet();



    let teamName =
    team === "alpha"
    ? "α-Alpha"
    : "Ω-Omega";



    logActivity(
    `${teamName} earned +${points} pts in [${selectedStream}] for ${achievementText}!`
    );


}





// -------------------------------
// RESET
// -------------------------------

function resetScores(){


    if(confirm(
    "Are you sure you want to reset all scores back to zero?"
    )){


        scores.alpha = 0;

        scores.omega = 0;



        Object.keys(streamScores)
        .forEach(stream => {

            streamScores[stream]=0;

        });



        updateDisplay();

        syncToSheet();


        logActivity(
        "Scoreboard has been reset to zero."
        );


    }


}
// =======================================
// PART 2/3 - DISPLAY + LOGS + NOTICES
// =======================================



// -------------------------------
// UPDATE DISPLAY
// -------------------------------

function updateDisplay(){



    // -----------------------------
    // Score Cards
    // -----------------------------

    const alphaElem =
    document.getElementById("alphaScore");


    const omegaElem =
    document.getElementById("omegaScore");



    if(alphaElem)
        alphaElem.textContent = scores.alpha;


    if(omegaElem)
        omegaElem.textContent = scores.omega;



    if(alphaElem)
        alphaElem.classList.add("pop");


    if(omegaElem)
        omegaElem.classList.add("pop");



    setTimeout(()=>{


        if(alphaElem)
            alphaElem.classList.remove("pop");


        if(omegaElem)
            omegaElem.classList.remove("pop");


    },300);





    // -----------------------------
    // Stream Scores
    // -----------------------------

    for(let stream in streamScores){


        let streamId =
        "stream-" + stream.replace(/\s+/g,'-');



        let elem =
        document.getElementById(streamId);



        if(elem){

            elem.textContent =
            streamScores[stream];

        }


    }





    // -----------------------------
    // Progress Bar
    // -----------------------------


    let total =
    scores.alpha + scores.omega;



    let alphaPct = 50;

    let omegaPct = 50;



    if(total > 0){


        alphaPct =
        (scores.alpha / total) * 100;



        omegaPct =
        (scores.omega / total) * 100;


    }




    const alphaBar =
    document.getElementById("alphaBar");


    const omegaBar =
    document.getElementById("omegaBar");



    if(alphaBar)

        alphaBar.style.width =
        alphaPct + "%";



    if(omegaBar)

        omegaBar.style.width =
        omegaPct + "%";






    // -----------------------------
    // Percentage Labels
    // -----------------------------


    const alphaPctElem =
    document.getElementById("alphaPct");


    const omegaPctElem =
    document.getElementById("omegaPct");



    if(alphaPctElem)

        alphaPctElem.textContent =
        `α-Alpha (${Math.round(alphaPct)}%)`;



    if(omegaPctElem)

        omegaPctElem.textContent =
        `Ω-Omega (${Math.round(omegaPct)}%)`;






    // -----------------------------
    // Battle Status
    // -----------------------------


    const statusTitle =
    document.getElementById("statusTitle");


    const statusDesc =
    document.getElementById("statusDesc");


    const alphaCard =
    document.getElementById("alphaCard");


    const omegaCard =
    document.getElementById("omegaCard");




    if(statusTitle &&
       statusDesc &&
       alphaCard &&
       omegaCard){



        alphaCard.className =
        "team-card alpha-card";


        omegaCard.className =
        "team-card omega-card";





        if(scores.alpha === 0 &&
           scores.omega === 0){



            statusTitle.textContent =
            "🔥 Battle Just Began!";



            statusDesc.textContent =
            "The scoreboard is clean. Step up, lock in, and claim the lead!";



        }



        else if(scores.alpha === scores.omega){



            statusTitle.textContent =
            "⚖️ It's a Tie Game!";



            statusDesc.textContent =
            "Both teams are locked in neck-and-neck intensity!";



            alphaCard.classList.add("is-tied");

            omegaCard.classList.add("is-tied");



        }



        else if(scores.alpha > scores.omega){



            statusTitle.textContent =
            "👑 α-Alpha is Leading!";



            statusDesc.textContent =
            "Team Alpha is currently dominating the scoreboard.";



            alphaCard.classList.add("is-winning");



        }



        else {



            statusTitle.textContent =
            "👑 Ω-Omega is Leading!";



            statusDesc.textContent =
            "Team Omega is currently dominating the scoreboard.";



            omegaCard.classList.add("is-winning");


        }


    }


}







// -------------------------------
// ACTIVITY LOG
// -------------------------------


function logActivity(message){



    const activityLog =
    document.getElementById("activityLog");



    if(!activityLog)
        return;



    const timeString =
    new Date().toLocaleTimeString([],{

        hour:'2-digit',

        minute:'2-digit',

        second:'2-digit'

    });




    const item =
    document.createElement("div");



    item.className =
    "activity-item";



    item.innerHTML =

    `<span class="activity-time">
    [${timeString}]
    </span> ${message}`;



    activityLog.prepend(item);


}







// -------------------------------
// ROTATING NOTICES
// -------------------------------


const notices = [


"🔥 Battle Arena is now LIVE!",


"📚 Stay consistent. Small progress every day wins.",


"🏆 Monthly Recap Paper coming soon!",


"⚡ Alpha and Omega are battling for the championship!",


"💙 Help your teammates whenever possible."


];



let noticeIndex = 0;




setInterval(()=>{



    noticeIndex++;



    if(noticeIndex >= notices.length){

        noticeIndex = 0;

    }





    const notice =
    document.getElementById("noticeText");





    if(notice){



        notice.style.opacity = 0;



        setTimeout(()=>{



            notice.textContent =
            notices[noticeIndex];



            notice.style.opacity = 1;



        },250);



    }



},7000);
// =======================================
// PART 3/3 - COUNTDOWN TIMER
// =======================================


// Update every second
setInterval(updateCountdown,1000);


// Run once immediately
updateCountdown();



// -------------------------------
// COUNTDOWN FUNCTION
// -------------------------------

function updateCountdown(){


    const daysElem =
    document.getElementById("days");


    const hoursElem =
    document.getElementById("hours");


    const minutesElem =
    document.getElementById("minutes");


    const secondsElem =
    document.getElementById("seconds");



    // No countdown elements on this page
    if(!daysElem ||
       !hoursElem ||
       !minutesElem ||
       !secondsElem){

        return;

    }



    // Wait until JSON loads
    if(!recapDate){

        return;

    }




    const now =
    new Date();



    const difference =
    recapDate - now;





    if(difference <= 0){


        daysElem.textContent = "00";

        hoursElem.textContent = "00";

        minutesElem.textContent = "00";

        secondsElem.textContent = "00";


        return;

    }







    const days =
    Math.floor(
        difference /
        (1000 * 60 * 60 * 24)
    );




    const hours =
    Math.floor(
        (difference %
        (1000 * 60 * 60 * 24)) /
        (1000 * 60 * 60)
    );




    const minutes =
    Math.floor(
        (difference %
        (1000 * 60 * 60)) /
        (1000 * 60)
    );




    const seconds =
    Math.floor(
        (difference %
        (1000 * 60)) /
        1000
    );






    daysElem.textContent =
    String(days).padStart(2,"0");



    hoursElem.textContent =
    String(hours).padStart(2,"0");



    minutesElem.textContent =
    String(minutes).padStart(2,"0");



    secondsElem.textContent =
    String(seconds).padStart(2,"0");


}
