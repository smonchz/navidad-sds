/* ============================================================
   100 SDs Dijeron – Lógica principal
   Compatible con GitHub Pages (HTTPS)
   ============================================================ */

console.log("Game JS loaded");

/* ------------------------------------------------------------
   SONIDOS (URLs en línea)
   ------------------------------------------------------------ */
const SOUND = {
  reveal: "https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg",
  strike: "https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg",
  win: "https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg",
  timer: "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg",
  tick: "https://actions.google.com/sounds/v1/alarms/beep_short.ogg"
};

const audio = {};
for (const [key, url] of Object.entries(SOUND)) {
  const a = new Audio(url);
  a.preload = "auto";
  audio[key] = a;
}

function playSound(name) {
  const a = audio[name];
  if (!a) return;
  try {
    a.currentTime = 0;
    a.play().catch(() => {});
  } catch (e) {
    console.warn("No se pudo reproducir sonido", name, e);
  }
}

/* ------------------------------------------------------------
   SURVEY: 8 rondas, 6 respuestas cada una
   ------------------------------------------------------------ */
const SURVEY = [
  {
    question: "Algo que pasa en las fiestas navideñas del trabajo",
    answers: [
      { text: "Intercambio de regalos", points: 38 },
      { text: "Juegos dinámicos", points: 22 },
      { text: "Comida especial", points: 18 },
      { text: "Fotos del equipo", points: 10 },
      { text: "Rifa de premios", points: 8 },
      { text: "Brindis navideño", points: 4 }
    ]
  },
  {
    question: "Comida típica de una cena navideña",
    answers: [
      { text: "Pavo", points: 34 },
      { text: "Lomo", points: 22 },
      { text: "Ensalada", points: 18 },
      { text: "Puré de papa", points: 12 },
      { text: "Ponche", points: 8 },
      { text: "Pasta", points: 6 }
    ]
  },
  {
    question: "Algo que la gente trae a la posada",
    answers: [
      { text: "Regalo", points: 28 },
      { text: "Comida", points: 26 },
      { text: "Bebidas", points: 20 },
      { text: "Postres", points: 12 },
      { text: "Decoración", points: 8 },
      { text: "Ropa navideña", points: 6 }
    ]
  },
  {
    question: "Algo que pasa cuando se arma el intercambio",
    answers: [
      { text: "Se equivocan de regalo", points: 30 },
      { text: "Se tardan en encontrar al destinatario", points: 24 },
      { text: "Regalo repetido", points: 18 },
      { text: "Regalo chistoso", points: 14 },
      { text: "Alguien se enoja", points: 8 },
      { text: "Falta alguien", points: 6 }
    ]
  },
  {
    question: "Algo que siempre pasa al final de la posada",
    answers: [
      { text: "Agradecimientos", points: 30 },
      { text: "Despedidas largas", points: 24 },
      { text: "Fotos finales", points: 18 },
      { text: "Recuento de regalos", points: 14 },
      { text: "Buscar transporte", points: 8 },
      { text: "Recoger cosas", points: 6 }
    ]
  },
  {
    question: "Algo que todos esperan en la cena navideña",
    answers: [
      { text: "La comida principal", points: 36 },
      { text: "Premios / rifas", points: 28 },
      { text: "Postres", points: 16 },
      { text: "Música y baile", points: 10 },
      { text: "Tiempo libre", points: 6 },
      { text: "Fotos del equipo", points: 4 }
    ]
  },
  {
    question: "Algo que sucede antes de iniciar la cena navideña",
    answers: [
      { text: "Acomodarse en mesas", points: 34 },
      { text: "Tomarse fotos", points: 22 },
      { text: "Servirse bebidas", points: 18 },
      { text: "Buscar asiento", points: 12 },
      { text: "Saludar al equipo", points: 8 },
      { text: "Esperar a los demás", points: 6 }
    ]
  },
  {
    question: "Actividad típica en un festejo empresarial navideño",
    answers: [
      { text: "Rifas", points: 32 },
      { text: "Juegos", points: 26 },
      { text: "Brindis", points: 18 },
      { text: "Premiación", points: 12 },
      { text: "Música / DJ", points: 8 },
      { text: "Fotos oficiales", points: 4 }
    ]
  }
];

const MAX_SLOTS = 6;

/* ------------------------------------------------------------
   Estado del juego
   ------------------------------------------------------------ */
let state = {
  questionIndex: 0,
  revealed: Array(MAX_SLOTS).fill(false),
  strikes: 0,
  teamA: 0,
  teamB: 0
};

let IS_HOST = window.IS_HOST === true;

/* Fast Money Timer (solo host, pero se refleja en board) */
let fmTimer = null;
let fmTimeLeft = 0;

/* ------------------------------------------------------------
   Canal de comunicación entre ventanas
   ------------------------------------------------------------ */
let bc = null;
try {
  bc = new BroadcastChannel("navidad-sds-channel");
} catch (e) {
  console.warn("BroadcastChannel no disponible.");
}

function broadcast(msg) {
  if (bc) bc.postMessage(msg);
}

/* ------------------------------------------------------------
   Funciones visuales: transición, celebración, FM timer
   ------------------------------------------------------------ */
function showTransition(title, subtitle) {
  const overlay = document.getElementById("roundTransition");
  if (!overlay) return;
  const t = document.getElementById("roundTransitionTitle");
  const s = document.getElementById("roundTransitionSubtitle");
  if (t) t.textContent = title || "";
  if (s) s.textContent = subtitle || "";
  overlay.classList.add("show");
  setTimeout(() => overlay.classList.remove("show"), 1800);
}

function showCelebration(teamText) {
  const overlay = document.getElementById("celebration");
  if (!overlay) return;
  const t = document.getElementById("celebrationText");
  if (t) t.textContent = `¡${teamText} gana!`;
  overlay.classList.add("show");
  setTimeout(() => overlay.classList.remove("show"), 2500);
}

function updateFmTimerDisplays(fromBroadcast) {
  const hostSpan = document.getElementById("fm-timer");
  if (hostSpan) hostSpan.textContent = fmTimeLeft;

  if (!fromBroadcast) {
    broadcast({ type: "fmTimer", time: fmTimeLeft, running: !!fmTimer });
  }

  const boardSpan = document.getElementById("fm-timer-board");
  const boardPanel = document.getElementById("fm-board");
  if (boardSpan) boardSpan.textContent = fmTimeLeft;
  if (boardPanel) {
    if (fmTimeLeft <= 5 && fmTimeLeft > 0 && fmTimer) {
      boardPanel.classList.add("danger");
    } else {
      boardPanel.classList.remove("danger");
    }
  }
}

function startFmTimer(seconds) {
  stopFmTimer();
  fmTimeLeft = seconds;
  updateFmTimerDisplays(false);

  fmTimer = setInterval(() => {
    fmTimeLeft--;
    if (fmTimeLeft <= 0) {
      fmTimeLeft = 0;
      updateFmTimerDisplays(false);
      stopFmTimer();
      playSound("timer");
    } else {
      if (fmTimeLeft <= 5) {
        playSound("tick");
      }
      updateFmTimerDisplays(false);
    }
  }, 1000);
}

function stopFmTimer() {
  if (fmTimer) {
    clearInterval(fmTimer);
    fmTimer = null;
    updateFmTimerDisplays(false);
  }
}

/* ------------------------------------------------------------
   Recepción de mensajes (Board)
   ------------------------------------------------------------ */
if (bc && !IS_HOST) {
  bc.onmessage = (ev) => {
    const msg = ev.data;
    if (!msg) return;

    if (msg.type === "state") {
      state = msg.state;
      renderAll();
    }

    if (msg.type === "fastMoney") {
      showFastMoney(msg.rows);
    }

    if (msg.type === "transition") {
      showTransition(msg.title, msg.subtitle);
    }

    if (msg.type === "fmTimer") {
      fmTimeLeft = msg.time || 0;
      // actualiza solo desde broadcast
      const boardSpan = document.getElementById("fm-timer-board");
      const boardPanel = document.getElementById("fm-board");
      if (boardSpan) boardSpan.textContent = fmTimeLeft;
      if (boardPanel) {
        if (msg.running && fmTimeLeft <= 5 && fmTimeLeft > 0) {
          boardPanel.classList.add("danger");
        } else {
          boardPanel.classList.remove("danger");
        }
      }
    }

    if (msg.type === "celebration") {
      showCelebration(msg.team || "Equipo");
      playSound("win");
    }
  };
}

/* ------------------------------------------------------------
   RENDER DEL TABLERO
   ------------------------------------------------------------ */
function renderQuestion() {
  const el = document.getElementById("questionText");
  if (el) el.textContent = SURVEY[state.questionIndex].question;
}

function renderAnswers() {
  const grid = document.getElementById("answersGrid");
  if (!grid) return;
  grid.innerHTML = "";

  const round = SURVEY[state.questionIndex];

  for (let i = 0; i < MAX_SLOTS; i++) {
    const ans = round.answers[i];
    const card = document.createElement("div");
    card.className = "answer-card";

    const hidden = document.createElement("div");
    hidden.className = "answer-hidden";
    hidden.textContent = (i + 1) + ". ________";

    const revealed = document.createElement("div");
    revealed.className = "answer-revealed";

    if (ans) {
      revealed.textContent = `${i + 1}. ${ans.text} — ${ans.points}`;
    } else {
      revealed.textContent = `${i + 1}. `;
    }

    if (state.revealed[i]) card.appendChild(revealed);
    else card.appendChild(hidden);

    // Preview + click solo en host
    if (IS_HOST && ans) {
      const preview = document.createElement("div");
      preview.className = "host-preview";
      preview.textContent = `${ans.text} (${ans.points})`;
      card.appendChild(preview);

      card.style.cursor = "pointer";
      card.addEventListener("click", () => {
        const wasRevealed = state.revealed[i];
        state.revealed[i] = !state.revealed[i];
        if (!wasRevealed && state.revealed[i]) {
          playSound("reveal");
        }
        renderScore();
        pushState();
      });
    }

    grid.appendChild(card);
  }
}

function renderStrikes() {
  const el = document.getElementById("strikes");
  if (!el) return;
  el.innerHTML = "";

  for (let i = 0; i < 3; i++) {
    const dot = document.createElement("div");
    dot.className = "strike-dot";
    dot.textContent = "X";

    if (i < state.strikes) dot.classList.add("active");

    el.appendChild(dot);
  }
}

/* ------------------------------------------------------------
   AUTOMATIC TOTAL SCORING
   ------------------------------------------------------------ */
function renderScore() {
  const el = document.getElementById("totalScore");
  if (!el) return;

  const round = SURVEY[state.questionIndex];
  let total = 0;

  for (let i = 0; i < MAX_SLOTS; i++) {
    if (state.revealed[i] && round.answers[i]) {
      total += Number(round.answers[i].points || 0);
    }
  }

  el.textContent = total;
}

/* ------------------------------------------------------------
   TEAM SCORING
   ------------------------------------------------------------ */
function renderTeams() {
  const A = document.getElementById("teamA");
  const B = document.getElementById("teamB");
  if (!A || !B) return;
  A.textContent = state.teamA;
  B.textContent = state.teamB;
}

/* ------------------------------------------------------------
   RENDER ALL
   ------------------------------------------------------------ */
function renderAll() {
  renderQuestion();
  renderAnswers();
  renderStrikes();
  renderScore();
  renderTeams();

  if (IS_HOST) {
    const sel = document.getElementById("questionSelect");
    if (sel) sel.value = String(state.questionIndex);
  }
}

/* ------------------------------------------------------------
   Cambios de estado
   ------------------------------------------------------------ */
function pushState() {
  renderAll();
  broadcast({ type: "state", state });
}

function setRound(i) {
  state.questionIndex = i;
  state.revealed = Array(MAX_SLOTS).fill(false);
  state.strikes = 0;
  renderScore();
  renderTeams();
  playSound("reveal");
  broadcast({
    type: "transition",
    title: `Ronda ${i + 1}`,
    subtitle: "¡Preparados!"
  });
  showTransition(`Ronda ${i + 1}`, "¡Preparados!");
  pushState();
}

function nextRound() {
  let i = state.questionIndex + 1;
  if (i >= SURVEY.length) i = 0;
  setRound(i);
}

function prevRound() {
  let i = state.questionIndex - 1;
  if (i < 0) i = SURVEY.length - 1;
  setRound(i);
}

function addStrike() {
  if (state.strikes < 3) {
    state.strikes++;
    playSound("strike");
    pushState();
  }
}

function clearStrikes() {
  state.strikes = 0;
  pushState();
}

/* ------------------------------------------------------------
   FAST MONEY
   ------------------------------------------------------------ */
function showFastMoney(rows) {
  const panel = document.getElementById("fm-board");
  if (!panel) return;

  if (!rows || rows.length === 0) {
    panel.style.display = "none";
    return;
  }

  panel.style.display = "flex";

  const list = document.getElementById("fm-list");
  const totalEl = document.getElementById("fm-total");
  list.innerHTML = "";

  let total = 0;
  rows.forEach((r, idx) => {
    const li = document.createElement("li");
    li.textContent = `${idx + 1}. ${r.answer} — ${r.points}`;
    list.appendChild(li);
    total += Number(r.points || 0);
  });

  totalEl.textContent = total;
}

/* ------------------------------------------------------------
   INIT (solo host)
   ------------------------------------------------------------ */
window.addEventListener("load", () => {
  renderAll();

  if (!IS_HOST) return;

  // Selector de rondas
  const sel = document.getElementById("questionSelect");
  if (sel) {
    SURVEY.forEach((_, i) => {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = `Ronda ${i + 1}`;
      sel.appendChild(opt);
    });

    sel.value = "0";
    sel.addEventListener("change", () => setRound(Number(sel.value)));
  }

  // Botones de navegación
  const btnNext = document.getElementById("btn-next");
  const btnPrev = document.getElementById("btn-prev");
  if (btnNext) btnNext.addEventListener("click", nextRound);
  if (btnPrev) btnPrev.addEventListener("click", prevRound);

  // Strikes
  const btnStrikeAdd = document.getElementById("btn-strike-add");
  const btnStrikeClear = document.getElementById("btn-strike-clear");
  if (btnStrikeAdd) btnStrikeAdd.addEventListener("click", addStrike);
  if (btnStrikeClear) btnStrikeClear.addEventListener("click", clearStrikes);

  // Preview toggle
  const togglePreview = document.getElementById("toggle-preview");
  if (togglePreview) {
    togglePreview.addEventListener("click", () => {
      document.body.classList.toggle("hide-preview");
    });
  }

  // Fast Money panel mostrar/ocultar
  const fmShow = document.getElementById("fm-show");
  const fmHide = document.getElementById("fm-hide");
  if (fmShow) {
    fmShow.addEventListener("click", () => {
      const panel = document.getElementById("fm-panel");
      if (panel) panel.style.display = "block";
    });
  }
  if (fmHide) {
    fmHide.addEventListener("click", () => {
      const panel = document.getElementById("fm-panel");
      if (panel) panel.style.display = "none";
      broadcast({ type: "fastMoney", rows: [] });
      showFastMoney([]);
      stopFmTimer();
    });
  }

  // Fast Money enviar
  const fmSend = document.getElementById("fm-send");
  if (fmSend) {
    fmSend.addEventListener("click", () => {
      const rows = [];
      for (let i = 1; i <= 5; i++) {
        const a = document.getElementById(`fm-a${i}`).value.trim();
        const p = Number(document.getElementById(`fm-p${i}`).value || 0);
        if (a) rows.push({ answer: a, points: p });
      }
      broadcast({ type: "fastMoney", rows });
      showFastMoney(rows);
    });
  }

  // TEAM SCORING BUTTONS (A y B) – aquí nos aseguramos que B también suma
  const btnAwardA = document.getElementById("awardA");
  const btnAwardB = document.getElementById("awardB");

  if (btnAwardA) {
    btnAwardA.addEventListener("click", () => {
      const pts = Number(document.getElementById("totalScore").textContent || "0");
      state.teamA += pts;
      playSound("win");
      broadcast({ type: "celebration", team: "Equipo A" });
      showCelebration("Equipo A");
      pushState();
    });
  }

  if (btnAwardB) {
    btnAwardB.addEventListener("click", () => {
      const pts = Number(document.getElementById("totalScore").textContent || "0");
      state.teamB += pts; // 🔥 AQUI nos aseguramos que suma al equipo B
      playSound("win");
      broadcast({ type: "celebration", team: "Equipo B" });
      showCelebration("Equipo B");
      pushState();
    });
  }

  // FAST MONEY TIMER botones
  const fmStart20 = document.getElementById("fm-start-20");
  const fmStart25 = document.getElementById("fm-start-25");
  const fmStopBtn = document.getElementById("fm-stop");

  if (fmStart20) fmStart20.addEventListener("click", () => startFmTimer(20));
  if (fmStart25) fmStart25.addEventListener("click", () => startFmTimer(25));
  if (fmStopBtn) fmStopBtn.addEventListener("click", () => stopFmTimer());
});
