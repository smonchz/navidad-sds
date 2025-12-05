/* ============================================================
   100 SDs Dijeron – Lógica principal
   Compatible con GitHub Pages (HTTPS)
   ============================================================ */

console.log("Game JS loaded");

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

    // Preview visible solo para host
    if (IS_HOST && ans) {
      const preview = document.createElement("div");
      preview.className = "host-preview";
      preview.textContent = `${ans.text} (${ans.points})`;
      card.appendChild(preview);

      card.style.cursor = "pointer";
      card.addEventListener("click", () => {
        state.revealed[i] = !state.revealed[i];
        renderScore(); 
        pushState();
      });
    }

    grid.appendChild(card);
  }
}

function renderStrikes() {
  const el = document.getElementById("strikes");
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
  SURVEY.forEach((_, i) => {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = `Ronda ${i + 1}`;
    sel.appendChild(opt);
  });

  sel.value = "0";
  sel.addEventListener("change", () => setRound(Number(sel.value)));

  // Botones de navegación
  document.getElementById("btn-next").addEventListener("click", nextRound);
  document.getElementById("btn-prev").addEventListener("click", prevRound);

  // Strikes
  document.getElementById("btn-strike-add").addEventListener("click", addStrike);
  document.getElementById("btn-strike-clear").addEventListener("click", clearStrikes);

  // Preview toggle
  document.getElementById("toggle-preview").addEventListener("click", () => {
    document.body.classList.toggle("hide-preview");
  });

  // Fast Money
  document.getElementById("fm-show").addEventListener("click", () => {
    document.getElementById("fm-panel").style.display = "block";
  });

  document.getElementById("fm-hide").addEventListener("click", () => {
    document.getElementById("fm-panel").style.display = "none";
    broadcast({ type: "fastMoney", rows: [] });
    showFastMoney([]);
  });

  document.getElementById("fm-send").addEventListener("click", () => {
    const rows = [];
    for (let i = 1; i <= 5; i++) {
      const a = document.getElementById(`fm-a${i}`).value.trim();
      const p = Number(document.getElementById(`fm-p${i}`).value || 0);
      if (a) rows.push({ answer: a, points: p });
    }
    broadcast({ type: "fastMoney", rows });
    showFastMoney(rows);
  });

  // TEAM SCORING BUTTONS
  document.getElementById("awardA").addEventListener("click", () => {
    const pts = Number(document.getElementById("totalScore").textContent);
    state.teamA += pts;
    pushState();
  });

  document.getElementById("awardB").addEventListener("click", () => {
    const pts = Number(document.getElementById("totalScore").textContent);
    state.teamB += pts;
    pushState();
  });
});
