// ================== GLOBAL STATE ==================
const MIN_GAP = 20;
let lastTouchTime = 0;
let bonusTextTimer = 0;
let gameRunning = false;
let timeLeft = 60;
let timerInterval = null;
let aiHintInterval = null;

// ================== CANVAS ==================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ================== SPACE STARS ==================
let stars = [];
function createStars() {
    stars = [];
    for (let i = 0; i < 120; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 1,
            speed: Math.random() * 1 + 0.3
        });
    }
}
createStars();

//=======Mobile================
function moveKid(kid, delta) {
    if (!gameRunning) return;

    const prev1 = kid1.x;
    const prev2 = kid2.x;

    kid.x += delta;
    //kid.x = Math.max(0, Math.min(canvas.width - kid.width, kid.x));
    // Keep inside canvas
    kid1.x = Math.max(0, Math.min(canvas.width - kid1.width, kid1.x));
    kid2.x = Math.max(0, Math.min(canvas.width - kid2.width, kid2.x));
     // Prevent overlap (mobile + desktop)
    if (areKidsTouching()) {
        kid1.x = prev1;
        kid2.x = prev2;
        handleKidsTouch();
    }
}
document.getElementById("luvLeft").addEventListener("touchstart", () => moveKid(kid1, -25));
document.getElementById("luvRight").addEventListener("touchstart", () => moveKid(kid1, 25));

document.getElementById("natLeft").addEventListener("touchstart", () => moveKid(kid2, -25));
document.getElementById("natRight").addEventListener("touchstart", () => moveKid(kid2, 25));


// ================== PLAYERS ==================
let kid1 = {
    x: 120,
    y: 0,
    width: 80,
    height: 80,
    img: new Image()
};

let kid2 = {
    x: 320,
    y: 0,
    width: 80,
    height: 80,
    img: new Image()
};

kid1.img.src = "/static/images/kid1.png";
kid2.img.src = "/static/images/kid2.png";

function positionPlayers() {
    kid1.y = canvas.height - kid1.height - 10;
    kid2.y = canvas.height - kid2.height - 10;
}

// ================== RESPONSIVE CANVAS ==================
function resizeCanvas() {
    canvas.width = Math.min(window.innerWidth * 0.9, 900);
    canvas.height = 500;
    //canvas.width = Math.min(window.innerWidth * 0.9, 900);

    // reposition players
    kid1.y = canvas.height - kid1.height - 10;
    kid2.y = canvas.height - kid2.height - 10;

    // recreate stars to fill full canvas
    createStars();
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas(); // initial call

// ================== STAR ROCKET ==================
let rocket = {
    x: Math.random() * canvas.width,
    y: -80,
    width: 40,
    height: 80,
    speed: 3,
    img: new Image()
};
rocket.img.src = "/static/images/rocket.png";

// ================== SCORES ==================
let scoreKid1 = 0;
let scoreKid2 = 0;

// ================== CONTROLS ==================
document.addEventListener("keydown", (e) => {
    if (!gameRunning) return;

    let p1 = kid1.x;
    let p2 = kid2.x;

    if (e.key === "a" || e.key === "A") kid1.x -= 25;
    if (e.key === "d" || e.key === "D") kid1.x += 25;
    if (e.key === "ArrowLeft") kid2.x -= 25;
    if (e.key === "ArrowRight") kid2.x += 25;

    kid1.x = Math.max(0, Math.min(canvas.width - kid1.width, kid1.x));
    kid2.x = Math.max(0, Math.min(canvas.width - kid2.width, kid2.x));

    if (areKidsTouching()) {
        kid1.x = p1;
        kid2.x = p2;
        handleKidsTouch();
    }
});

// ================== GAME LOOP ==================
function draw() {
    // Background
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Space stars
    ctx.fillStyle = "white";
    stars.forEach(s => {
        s.y += s.speed;
        if (s.y > canvas.height) s.y = 0;
        ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    // Show "Press Start"
    if (!gameRunning) {
        ctx.fillStyle = "white";
        ctx.font = "26px Arial";
        ctx.fillText(
            "▶️ Lets START GAME",
            canvas.width / 2 - 150,
            canvas.height / 2
        );
        requestAnimationFrame(draw);
        return;
    }

    // Kids
    ctx.drawImage(kid1.img, kid1.x, kid1.y, kid1.width, kid1.height);
    ctx.drawImage(kid2.img, kid2.x, kid2.y, kid2.width, kid2.height);

    // Falling star rocket
  // Draw rotated rocket
ctx.save();

// Move origin to rocket center
ctx.translate(
    rocket.x + rocket.width / 2,
    rocket.y + rocket.height / 2
);

// Rotate 90 degrees (pointing down)
//ctx.rotate(Math.PI / 2);
//ctx.rotate(Math.PI / 2 + (Math.random() - 0.5) * 0.1);

// Draw rocket from its center
ctx.drawImage(
    rocket.img,
    -rocket.width / 2,
    -rocket.height / 2,
    rocket.width,
    rocket.height
);

ctx.restore();

rocket.y += rocket.speed;
if (rocket.y > canvas.height) resetRocket();


    if (checkCollision(kid1)) {
        scoreKid1++;
        resetRocket();
        playBeep(600, 150);
        sendGameEvent("kid1"); 
    } else if (checkCollision(kid2)) {
        scoreKid2++;
        resetRocket();
        playBeep(600, 150);
        sendGameEvent("kid2");
    }

    // UI text
    ctx.fillStyle = "white";
    ctx.font = "18px Arial";
    ctx.fillText("Luv (A/D): " + scoreKid1, 10, 30);
    ctx.fillText("Nathan (←/→): " + scoreKid2, 10, 55);
    ctx.fillText("⏱️ " + timeLeft, canvas.width - 80, 30);

    // Friend bonus
    if (bonusTextTimer > 0) {
        ctx.fillStyle = "lime";
        ctx.font = "26px Arial";
        ctx.fillText("🤝 FRIEND BONUS +1", canvas.width / 2 - 150, canvas.height / 2);
        bonusTextTimer--;
    }

    requestAnimationFrame(draw);
}

// ================== HELPERS ==================
function resetRocket() {
    rocket.y = -rocket.height;
    rocket.x = Math.random() * (canvas.width - rocket.width);
}

function checkCollision(player) {
    return (
        rocket.x < player.x + player.width &&
        rocket.x + rocket.width > player.x &&
        rocket.y + rocket.height > player.y &&
        rocket.y < player.y + player.height
    );
}

function areKidsTouching() {
    return Math.abs((kid1.x + kid1.width) - kid2.x) < MIN_GAP;
}

function handleKidsTouch() {
    const now = Date.now();
    if (now - lastTouchTime < 1000) return;

    lastTouchTime = now;
    scoreKid1++;
    scoreKid2++;
    bonusTextTimer = 40;
    playBeep(800, 200);
}

// ================== GAME CONTROL ==================
// ================== GAME CONTROL (DOM SAFE) ==================
// ================== START AFTER DOM LOAD ==================
document.addEventListener("DOMContentLoaded", () => {

    const startBtn = document.getElementById("startBtn");
    const timerEl = document.getElementById("timer");
    
    // Start button logic
    startBtn.addEventListener("click", () => {
        console.log("Start button clicked"); // DEBUG
        if (gameRunning) return;

        gameRunning = true;

        const mobileControls = document.getElementById("mobileControls");
        if (mobileControls) {
            mobileControls.classList.remove("hidden");
        }


        timeLeft = 60;
        scoreKid1 = 0;
        scoreKid2 = 0;

        timerEl.innerText = "⏱️ Time: " + timeLeft;

        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timeLeft--;
            timerEl.innerText = "⏱️ Time: " + timeLeft;           

            if (timeLeft <= 0) {
                endGame();
            }
        }, 1000);

        aiHintInterval = setInterval(fetchAIHint, 1000);

    });

    ///==========Close button========
document.getElementById("closePopupBtn").addEventListener("click", () => {
    document.getElementById("gameOverPopup").classList.add("hidden");
});

    // Ensure draw() runs after images load
    let loaded = 0;
    [kid1.img, kid2.img].forEach(img => {
        img.onload = () => {
            loaded++;
            if (loaded === 2) draw(); // start the loop
        };
    });
});

function endGame() {
    speechSynthesis.cancel();
    speaking = false;
    gameRunning = false;
    clearInterval(timerInterval);
    clearInterval(aiHintInterval);  // stop AI hints
    playBeep(300, 500);
    document.getElementById("finalScore1").innerText = scoreKid1;
    document.getElementById("finalScore2").innerText = scoreKid2;
    document.getElementById("gameOverPopup").classList.remove("hidden");

    fetch("/save_stats", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
        luv: scoreKid1,
        nathan: scoreKid2
    })
});
}

//=======Sound========
function playBeep(frequency = 440, duration = 200) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    oscillator.type = "square"; // or 'sine', 'triangle', 'sawtooth'
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    oscillator.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration / 1000);
}

//======AI hints : Audio=============
let speaking = false;

function speak(text, who) {
    if (!gameRunning) return;
    if (speechSynthesis.speaking) return; // 🔑 prevent overlap

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";

    if (who === "kid1") {
        utter.pitch = 1.6;   // female-like
        utter.rate = 1.05;
    } else {
        utter.pitch = 0.7;   // male-like
        utter.rate = 0.95;
    }

    speechSynthesis.speak(utter);
}


async function fetchAIHint() {
    if (!gameRunning) return;
    const resp = await fetch("/ai_hint", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            kid1_x: kid1.x,
            kid2_x: kid2.x,
            star_x: rocket.x,
            canvas_width: canvas.width
        })
    });

    const data = await resp.json();
    //const hintText = data.hint;

    const [luvHint, nathanHint] = data.hint.split("|");
if (luvHint) {
    speak("Luv, " + luvHint.trim(), kid1Voice);
}
if (nathanHint) {
    speak("Nathan, " + nathanHint.trim(), kid2Voice);
}

    // Update the on-screen text
    //document.getElementById("aiHints").innerText = hintText;

    // Speak the hint
    //speak(hintText);
}

//========2 different voices=============
// ================== VOICE SETUP ==================
let voices = [];
let kid1Voice = null; // female
let kid2Voice = null; // male

function loadVoices() {
    voices = speechSynthesis.getVoices().filter(v => v.lang.startsWith("en"));

    // Try to find female voice for Kid 1
    kid1Voice = voices.find(v =>
        v.name.toLowerCase().includes("female") ||
        v.name.toLowerCase().includes("zira") ||
        v.name.toLowerCase().includes("woman")
    );

    // Try to find male voice for Kid 2
    kid2Voice = voices.find(v =>
        v.name.toLowerCase().includes("male") ||
        v.name.toLowerCase().includes("david") ||
        v.name.toLowerCase().includes("man")
    );

    /*kid1Voice = voices[0] || null; // female-like
    kid2Voice = voices[1] || voices[0] || null; // male-like fallback*/

    // Fallbacks (important)
    if (!kid1Voice) kid1Voice = voices[0];
    if (!kid2Voice) kid2Voice = voices[1] || voices[0];
    
}
// Required for Chrome
speechSynthesis.onvoiceschanged = loadVoices;

//============for Numpy/Pandas==============
function sendGameEvent(player) {
    fetch("/game_event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            player: player,
            time_left: timeLeft,
            kid1_x: kid1.x,
            kid2_x: kid2.x,
            timestamp: Date.now()
        })
    });
}

// ================== START AFTER IMAGES LOAD ==================
let loaded = 0;
[kid1.img, kid2.img].forEach(img => {
    img.onload = () => {
        loaded++;
        if (loaded === 2) draw();
    };
});

//======Mobile Orientation ===========================
window.addEventListener("orientationchange", () => {
    setTimeout(() => {
        resizeCanvas();
    }, 300);
});

