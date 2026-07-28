// =======================================
// ALPHA OMEGA ARENA - SCRIPT.JS
// PART 1/3
// API + DATA + ADMIN + SCORE CONTROL
// =======================================


// =======================================
// GOOGLE SHEET API
// =======================================

const API_URL =
"https://script.google.com/macros/s/AKfycbyEE5g2xVdhi69w6UvSRwz1VloJ6bX-drsUqn4xyMi9SDMllf7ihKHeUPcSrbyIdsWa5g/exec";




// =======================================
// PAGE DETECTION
// =======================================

const isAdminPage =
window.location.pathname.includes("admin.html");




// =======================================
// MAIN SCORE DATA
// =======================================

let scores = {

    alpha: 0,

    omega: 0

};



let streamScores = {


    "Physical Science":0,

    "Bio Science":0,

    "Commerce":0,

    "Technology":0,

    "Arts":0

};




// Countdown

let recapDate = null;





// =======================================
// ADMIN SYSTEM
// =======================================

let isAdminLoggedIn = false;


const ADMIN_PIN = "royal123";






// =======================================
// VIEWER SYSTEM
// =======================================

let viewerId =
Math.random()
.toString(36)
.substring(2);








// =======================================
// SEND VIEWER HEARTBEAT
// =======================================

function sendHeartbeat(){


fetch(API_URL,{

    method:"POST",

    mode:"no-cors",

    headers:{


        "Content-Type":
        "application/json"

    },


    body:JSON.stringify({

        type:"heartbeat",

        viewerId:viewerId,

        time:Date.now()

    })


});


}






if(!isAdminPage){


    sendHeartbeat();


    setInterval(

        sendHeartbeat,

        15000

    );


}







// =======================================
// PAGE LOAD
// =======================================

window.addEventListener(

"DOMContentLoaded",

()=>{


    fetchScores();


}

);









// =======================================
// GET DATA FROM GOOGLE SHEET
// =======================================

function fetchScores(){



fetch(API_URL)



.then(response=>response.json())



.then(data=>{



console.log(
"Sheet Data:",
data
);





// ===============================
// SCORE LOAD
// ===============================


if(data.scores){


    scores.alpha =
    Number(data.scores.alpha) || 0;



    scores.omega =
    Number(data.scores.omega) || 0;


}








// ===============================
// STREAM LOAD
// ===============================


if(data.streams){


    streamScores = {


        ...streamScores,

        ...data.streams


    };


}







// ===============================
// COUNTDOWN DATE
// ===============================


if(data.recapDate){



    let fixedDate =
    data.recapDate;



    if(
    !fixedDate.includes("GMT")
    ){

        fixedDate +=
        " GMT+0530";

    }



    recapDate =
    new Date(fixedDate);



    console.log(
    "Recap:",
    recapDate
    );


}








// ===============================
// VIEWER COUNT
// ===============================


const viewer =
document.getElementById(
"viewerCount"
);




if(
viewer &&
data.viewers !== undefined
){


    viewer.textContent =
    data.viewers;


}







updateDisplay();





})



.catch(error=>{


console.error(
"Loading error:",
error
);


});



}









// =======================================
// SAVE TO GOOGLE SHEET
// =======================================

function syncToSheet(){



fetch(API_URL,{

    method:"POST",

    mode:"no-cors",


    headers:{


        "Content-Type":
        "application/json"


    },


    body:JSON.stringify({


        scores:scores,


        streams:streamScores


    })


})

.catch(error=>{


console.error(
"Sync Error:",
error
);


});



}









// =======================================
// ADMIN LOGIN
// =======================================

function toggleAdmin(){



const controls =
document.getElementById(
"controlsSection"
);



const button =
document.getElementById(
"adminBtn"
);



const badge =
document.getElementById(
"lockBadge"
);






if(!isAdminLoggedIn){



let pin =
prompt(
"Enter Admin PIN:"
);






if(pin === ADMIN_PIN){



    isAdminLoggedIn = true;




    if(controls){

        controls.classList.remove(
        "locked"
        );


        controls.classList.add(
        "unlocked"
        );

    }





    if(button){

        button.classList.add(
        "unlocked"
        );


        button.textContent =
        "🔓 Admin Logged In";

    }






    if(badge){

        badge.textContent =
        "🔓 Unlocked";

    }





    logActivity(
    "Admin login successful."
    );



}



else if(pin !== null){



    alert(
    "Wrong PIN!"
    );


}



}





else{



isAdminLoggedIn = false;




if(controls){

controls.classList.remove(
"unlocked"
);


controls.classList.add(
"locked"
);


}




if(button){

button.classList.remove(
"unlocked"
);


button.textContent =
"🔒 Admin Login";


}




if(badge){

badge.textContent =
"🔒 Locked";


}





logActivity(
"Admin logged out."
);



}




}
// =======================================
// ALPHA OMEGA ARENA - SCRIPT.JS
// PART 2/3
// SCORE CONTROL + DISPLAY + LOGS
// =======================================





// =======================================
// ADD SCORE
// =======================================

function awardCustomStreamScore(team){



// Safety check

if(
team !== "alpha" &&
team !== "omega"
){

    return;

}






if(!isAdminLoggedIn){


alert(
"Admin login required!"
);


return;


}







const stream =
document.getElementById(
"streamSelect"
);



const achievement =
document.getElementById(
"achievementSelect"
);





if(
!stream ||
!achievement
){

return;

}







const selectedStream =
stream.value;



const points =
Number(
achievement.value
);






if(
isNaN(points)
){

return;

}








scores[team] += points;



streamScores[selectedStream] += points;






updateDisplay();



syncToSheet();






const name =
team === "alpha"
?
"α-Alpha"
:
"Ω-Omega";





logActivity(

`${name} earned +${points} points in ${selectedStream}`

);



}









// =======================================
// RESET SCORES
// =======================================

function resetScores(){



if(!isAdminLoggedIn){


alert(
"Admin login required!"
);


return;


}






if(
confirm(
"Reset all scores?"
)

){



scores.alpha = 0;

scores.omega = 0;



Object.keys(streamScores)
.forEach(stream=>{


streamScores[stream]=0;


});




updateDisplay();


syncToSheet();



logActivity(
"Scores reset."
);



}



}









// =======================================
// UPDATE EVERYTHING ON SCREEN
// =======================================

function updateDisplay(){



// =======================================
// SCORE CARDS
// =======================================


const alphaScore =
document.getElementById(
"alphaScore"
);



const omegaScore =
document.getElementById(
"omegaScore"
);




if(alphaScore){

    alphaScore.textContent =
    scores.alpha;

}



if(omegaScore){

    omegaScore.textContent =
    scores.omega;

}








// =======================================
// STREAM SCORE DISPLAY
// =======================================


for(let stream in streamScores){



    let id =
    "stream-" +
    stream.replace(/\s+/g,"-");



    let element =
    document.getElementById(id);



    if(element){

        element.textContent =
        streamScores[stream];

    }


}









// =======================================
// TEAM PERCENTAGES
// =======================================


let total =
scores.alpha + scores.omega;



let alphaPercent = 50;

let omegaPercent = 50;




if(total > 0){


    alphaPercent =
    (scores.alpha / total) * 100;



    omegaPercent =
    (scores.omega / total) * 100;


}








// =======================================
// PROGRESS BARS
// =======================================


const alphaBar =
document.getElementById(
"alphaBar"
);



const omegaBar =
document.getElementById(
"omegaBar"
);





if(alphaBar){

    alphaBar.style.width =
    alphaPercent + "%";

}





if(omegaBar){

    omegaBar.style.width =
    omegaPercent + "%";

}









// =======================================
// PERCENTAGE TEXT
// =======================================


const alphaPct =
document.getElementById(
"alphaPct"
);



const omegaPct =
document.getElementById(
"omegaPct"
);






if(alphaPct){


    alphaPct.textContent =
    `α-Alpha (${Math.round(alphaPercent)}%)`;


}





if(omegaPct){


    omegaPct.textContent =
    `Ω-Omega (${Math.round(omegaPercent)}%)`;


}









// =======================================
// BATTLE STATUS
// =======================================


const statusTitle =
document.getElementById(
"statusTitle"
);



const statusDesc =
document.getElementById(
"statusDesc"
);



const alphaCard =
document.getElementById(
"alphaCard"
);



const omegaCard =
document.getElementById(
"omegaCard"
);







if(
statusTitle &&
statusDesc &&
alphaCard &&
omegaCard
){



    alphaCard.className =
    "team-card alpha-card";


    omegaCard.className =
    "team-card omega-card";









    if(
    scores.alpha === 0 &&
    scores.omega === 0
    ){



        statusTitle.textContent =
        "🔥 Battle Just Began!";



        statusDesc.textContent =
        "The scoreboard is clean. Step up and claim the lead!";


    }








    else if(
    scores.alpha === scores.omega
    ){



        statusTitle.textContent =
        "⚖️ It's a Tie Game!";



        statusDesc.textContent =
        "Both teams are fighting equally!";



        alphaCard.classList.add(
        "is-tied"
        );


        omegaCard.classList.add(
        "is-tied"
        );


    }








    else if(
    scores.alpha > scores.omega
    ){



        statusTitle.textContent =
        "👑 α-Alpha is Leading!";



        statusDesc.textContent =
        "Alpha currently controls the arena!";



        alphaCard.classList.add(
        "is-winning"
        );



    }








    else{



        statusTitle.textContent =
        "👑 Ω-Omega is Leading!";



        statusDesc.textContent =
        "Omega currently controls the arena!";



        omegaCard.classList.add(
        "is-winning"
        );


    }



}





}









// =======================================
// ACTIVITY LOG
// =======================================

function logActivity(message){



const log =
document.getElementById(
"activityLog"
);



if(!log){

    return;

}






const time =
new Date()
.toLocaleTimeString([],{

    hour:"2-digit",

    minute:"2-digit",

    second:"2-digit"

});







const item =
document.createElement(
"div"
);





item.className =
"activity-item";






item.innerHTML =

`
<span class="activity-time">
[${time}]
</span>
${message}
`;






log.prepend(item);



}
// =======================================
// ALPHA OMEGA ARENA - SCRIPT.JS
// PART 3/3
// NOTICES + COUNTDOWN + AUTO SYNC
// =======================================





// =======================================
// ROTATING NOTICE SYSTEM
// =======================================


const notices = [


"🔥 Battle Arena is now LIVE!",


"📚 Stay consistent. Small progress every day wins.",


"🏆 Monthly Recap Paper coming soon!",


"⚡ Alpha and Omega are fighting for the championship!",


"💙 Support your teammates!"



];







let noticeIndex = 0;






setInterval(()=>{



noticeIndex++;




if(
noticeIndex >= notices.length
){


    noticeIndex = 0;


}






const notice =
document.getElementById(
"noticeText"
);






if(notice){



    notice.style.opacity = 0;




    setTimeout(()=>{



        notice.textContent =
        notices[noticeIndex];



        notice.style.opacity =
        1;



    },250);



}




},7000);









// =======================================
// COUNTDOWN LOOP
// =======================================


setInterval(

updateCountdown,

1000

);



// Run immediately

updateCountdown();








// =======================================
// COUNTDOWN FUNCTION
// =======================================

function updateCountdown(){



const days =
document.getElementById(
"days"
);



const hours =
document.getElementById(
"hours"
);



const minutes =
document.getElementById(
"minutes"
);



const seconds =
document.getElementById(
"seconds"
);







// No countdown section

if(
!days ||
!hours ||
!minutes ||
!seconds
){

    return;

}







// Wait for Google Sheet date

if(!recapDate){

    return;

}







const now =
new Date();





const difference =
recapDate - now;







// Countdown finished

if(difference <= 0){



days.textContent =
"00";


hours.textContent =
"00";


minutes.textContent =
"00";


seconds.textContent =
"00";


return;


}








// =======================================
// TIME CALCULATION
// =======================================


const d =
Math.floor(

difference /
(1000 * 60 * 60 * 24)

);





const h =
Math.floor(

(difference %
(1000 * 60 * 60 * 24))
/
(1000 * 60 * 60)

);







const m =
Math.floor(

(difference %
(1000 * 60 * 60))
/
(1000 * 60)

);







const s =
Math.floor(

(difference %
(1000 * 60))
/
1000

);









// =======================================
// DISPLAY TIME
// =======================================


days.textContent =
String(d)
.padStart(2,"0");



hours.textContent =
String(h)
.padStart(2,"0");



minutes.textContent =
String(m)
.padStart(2,"0");



seconds.textContent =
String(s)
.padStart(2,"0");



}









// =======================================
// VIEWER AUTO REFRESH
// =======================================
//
// Keeps public viewers updated
//
// Admin editing is protected
// =======================================


setInterval(()=>{



if(!isAdminLoggedIn){



    fetchScores();



}



},10000);
