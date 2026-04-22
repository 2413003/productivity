(function () {
  const STORE_KEY = "priority-state-v1";
  const LEGACY_STORE_KEY = "two-choice-state-v1";
  const SPRINT_MS = 60000;

  const refs = {
    screens: Array.from(document.querySelectorAll("[data-screen]")),
    viewButtons: Array.from(document.querySelectorAll("[data-view-button]")),
    taskInput: document.getElementById("taskInput"),
    draftCount: document.getElementById("draftCount"),
    startBtn: document.getElementById("startBtn"),
    timeLeft: document.getElementById("timeLeft"),
    tapCount: document.getElementById("tapCount"),
    meterFill: document.getElementById("meterFill"),
    choiceA: document.getElementById("choiceA"),
    choiceB: document.getElementById("choiceB"),
    skipBtn: document.getElementById("skipBtn"),
    undoBtn: document.getElementById("undoBtn"),
    finishBtn: document.getElementById("finishBtn"),
    focusTitle: document.getElementById("focus-title"),
    topCount: document.getElementById("topCount"),
    lessTop: document.getElementById("lessTop"),
    moreTop: document.getElementById("moreTop"),
    topList: document.getElementById("topList"),
    allList: document.getElementById("allList"),
    keepChoosing: document.getElementById("keepChoosing"),
    resetRank: document.getElementById("resetRank"),
    clearDone: document.getElementById("clearDone"),
    clearAll: document.getElementById("clearAll")
  };

  let state = loadState();
  let activeView = state.tasks.length ? "focus" : "input";
  let lastSyncedInput = "";

  init();

  function init() {
    refs.viewButtons.forEach((button) => {
      button.addEventListener("click", () => setView(button.dataset.viewButton));
    });

    refs.taskInput.addEventListener("input", updateDraftCount);
    refs.startBtn.addEventListener("click", () => applyTasks("choose"));

    refs.choiceA.addEventListener("click", () => chooseCurrent(0));
    refs.choiceB.addEventListener("click", () => chooseCurrent(1));
    refs.skipBtn.addEventListener("click", skipCurrent);
    refs.undoBtn.addEventListener("click", undoChoice);
    refs.finishBtn.addEventListener("click", () => setView("focus"));

    refs.lessTop.addEventListener("click", () => setTopCount(-1));
    refs.moreTop.addEventListener("click", () => setTopCount(1));
    refs.keepChoosing.addEventListener("click", () => {
      startSprint();
      setView("choose");
    });

    refs.topList.addEventListener("click", handleTaskAction);
    refs.allList.addEventListener("click", handleTaskAction);

    refs.resetRank.addEventListener("click", resetRank);
    refs.clearDone.addEventListener("click", clearDone);
    refs.clearAll.addEventListener("click", clearAll);

    window.addEventListener("storage", () => {
      state = loadState();
      render();
    });

    window.setInterval(tick, 1000);
    render();
  }

  function loadState() {
    const base = freshState();

    try {
      const raw = localStorage.getItem(STORE_KEY) || localStorage.getItem(LEGACY_STORE_KEY);
      const saved = JSON.parse(raw || "null");
      if (!saved || !Array.isArray(saved.tasks)) {
        return base;
      }

      return {
        ...base,
        ...saved,
        topCount: clamp(Number(saved.topCount) || 3, 1, 99),
        totalTaps: Number(saved.totalTaps) || 0,
        sprintStartTaps: Number(saved.sprintStartTaps) || 0,
        tasks: saved.tasks
          .filter((task) => task && typeof task.text === "string")
          .map((task) => ({
            id: task.id || makeId(),
            text: task.text.trim(),
            score: Number.isFinite(task.score) ? task.score : 1000,
            wins: Number(task.wins) || 0,
            losses: Number(task.losses) || 0,
            seen: Number(task.seen) || 0,
            done: Boolean(task.done),
            createdAt: Number(task.createdAt) || Date.now()
          }))
          .filter((task) => task.text),
        comparisons: Array.isArray(saved.comparisons) ? saved.comparisons : [],
        pairHistory: Array.isArray(saved.pairHistory) ? saved.pairHistory : [],
        currentPair: Array.isArray(saved.currentPair) ? saved.currentPair : null
      };
    } catch (error) {
      return base;
    }
  }

  function freshState() {
    return {
      tasks: [],
      topCount: 3,
      totalTaps: 0,
      sprintStartTaps: 0,
      sprintEndsAt: null,
      currentPair: null,
      comparisons: [],
      pairHistory: []
    };
  }

  function saveState() {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }

  function setView(nextView) {
    if (activeView === "input" && nextView !== "input" && draftChanged()) {
      applyTasks(nextView);
      return;
    }

    if (nextView === "choose") {
      if (activeTasks().length < 2) {
        activeView = "focus";
      } else {
        if (!state.sprintEndsAt || remainingMs() <= 0) {
          startSprint();
        }
        ensurePair();
        activeView = "choose";
      }
    } else {
      activeView = nextView;
    }

    render();
  }

  function render() {
    refs.screens.forEach((screen) => {
      const isActive = screen.dataset.screen === activeView;
      screen.classList.toggle("is-active", isActive);
    });

    refs.viewButtons.forEach((button) => {
      button.setAttribute("aria-current", button.dataset.viewButton === activeView ? "page" : "false");
    });

    renderInput();
    renderChoose();
    renderFocus();
  }

  function renderInput() {
    const text = state.tasks.map((task) => task.text).join("\n");
    const inputIsActive = document.activeElement === refs.taskInput;

    if (!inputIsActive && text !== lastSyncedInput) {
      refs.taskInput.value = text;
      lastSyncedInput = text;
    }

    updateDraftCount();
  }

  function renderChoose() {
    const active = activeTasks();
    refs.skipBtn.disabled = active.length < 2;
    refs.choiceA.disabled = active.length < 2;
    refs.choiceB.disabled = active.length < 2;
    refs.undoBtn.disabled = !state.comparisons.length;

    if (active.length < 2) {
      refs.choiceA.querySelector("span").textContent = active[0] ? active[0].text : "Add tasks";
      refs.choiceB.querySelector("span").textContent = "Top";
      updateSprintMeta();
      return;
    }

    ensurePair();
    const pair = getCurrentTasks();

    if (!pair) {
      return;
    }

    refs.choiceA.querySelector("span").textContent = pair[0].text;
    refs.choiceB.querySelector("span").textContent = pair[1].text;
    updateSprintMeta();
  }

  function renderFocus() {
    const ranked = rankedTasks().filter((task) => !task.done);
    const topCount = clamp(state.topCount, 1, Math.max(1, ranked.length || state.topCount));
    state.topCount = topCount;

    refs.focusTitle.textContent = `Top ${topCount}`;
    refs.topCount.textContent = String(topCount);
    refs.lessTop.disabled = topCount <= 1;
    refs.moreTop.disabled = ranked.length > 0 && topCount >= ranked.length;

    refs.topList.innerHTML = "";

    if (!ranked.length) {
      const empty = document.createElement("li");
      empty.className = "empty";
      empty.textContent = state.tasks.length ? "Done" : "Add tasks";
      refs.topList.appendChild(empty);
    } else {
      ranked.slice(0, topCount).forEach((task, index) => {
        refs.topList.appendChild(createTaskRow(task, index + 1, "done"));
      });
    }

    refs.allList.innerHTML = "";
    rankedTasks().forEach((task, index) => {
      refs.allList.appendChild(createTaskRow(task, index + 1, task.done ? "restore" : "done"));
    });

    refs.keepChoosing.disabled = activeTasks().length < 2;
  }

  function createTaskRow(task, rank, action) {
    const item = document.createElement("li");
    item.className = `task-row${task.done ? " done" : ""}`;
    item.style.animationDelay = `${Math.min(rank - 1, 7) * 28}ms`;

    const rankNode = document.createElement("span");
    rankNode.className = "rank";
    rankNode.textContent = String(rank);

    const textNode = document.createElement("span");
    textNode.className = "task-text";
    textNode.textContent = task.text;

    const button = document.createElement("button");
    button.className = "row-action";
    button.type = "button";
    button.dataset.action = action;
    button.dataset.id = task.id;
    button.textContent = action === "restore" ? "Undo" : "Done";

    item.append(rankNode, textNode, button);
    return item;
  }

  function updateDraftCount() {
    const count = parseTasks(refs.taskInput.value).length;
    refs.draftCount.textContent = String(count);
    refs.startBtn.disabled = count === 0;
  }

  function draftChanged() {
    const draft = parseTasks(refs.taskInput.value).join("\n");
    const saved = state.tasks.map((task) => task.text).join("\n");
    return draft !== saved;
  }

  function updateSprintMeta() {
    const ms = remainingMs();
    const seconds = Math.ceil(ms / 1000);
    const taps = Math.max(0, state.totalTaps - state.sprintStartTaps);
    const progress = state.sprintEndsAt ? clamp(ms / SPRINT_MS, 0, 1) : 1;

    refs.timeLeft.textContent = String(seconds || 0);
    refs.tapCount.textContent = String(taps);
    refs.meterFill.style.transform = `scaleX(${progress})`;
  }

  function applyTasks(preferredView) {
    const parsed = parseTasks(refs.taskInput.value);
    const existing = new Map(state.tasks.map((task) => [task.text.toLowerCase(), task]));

    state.tasks = parsed.map((text) => {
      const saved = existing.get(text.toLowerCase());
      if (saved) {
        return { ...saved, text };
      }

      return {
        id: makeId(),
        text,
        score: 1000,
        wins: 0,
        losses: 0,
        seen: 0,
        done: false,
        createdAt: Date.now() + Math.random()
      };
    });

    state.comparisons = [];
    state.pairHistory = [];
    state.currentPair = null;
    state.topCount = clamp(state.topCount, 1, Math.max(1, state.tasks.length));
    lastSyncedInput = state.tasks.map((task) => task.text).join("\n");

    if (activeTasks().length > 1 && preferredView !== "focus") {
      startSprint();
      activeView = "choose";
    } else {
      activeView = "focus";
    }

    saveState();
    render();
  }

  function chooseCurrent(index) {
    const pair = getCurrentTasks();
    if (!pair) {
      return;
    }

    const winner = pair[index];
    const loser = pair[index === 0 ? 1 : 0];
    const winnerBefore = winner.score;
    const loserBefore = loser.score;
    const expectedWinner = expectedScore(winner.score, loser.score);
    const k = 48 * Math.max(0.7, 1.22 - Math.min(winner.seen, loser.seen) / 14);
    const delta = Math.max(8, k * (1 - expectedWinner));

    winner.score += delta;
    loser.score -= delta;
    winner.wins += 1;
    loser.losses += 1;
    winner.seen += 1;
    loser.seen += 1;
    state.totalTaps += 1;

    state.comparisons.push({
      winnerId: winner.id,
      loserId: loser.id,
      winnerBefore,
      loserBefore,
      delta,
      at: Date.now()
    });

    rememberPair(winner.id, loser.id);
    state.currentPair = choosePair(pairKey(winner.id, loser.id));

    if (remainingMs() <= 0) {
      state.sprintEndsAt = null;
      activeView = "focus";
    }

    saveState();
    render();
  }

  function skipCurrent() {
    const pair = getCurrentTasks();
    const avoid = pair ? pairKey(pair[0].id, pair[1].id) : null;

    if (pair) {
      rememberPair(pair[0].id, pair[1].id);
    }

    state.currentPair = choosePair(avoid);
    saveState();
    render();
  }

  function undoChoice() {
    const last = state.comparisons.pop();
    if (!last) {
      return;
    }

    const winner = findTask(last.winnerId);
    const loser = findTask(last.loserId);

    if (winner && loser) {
      winner.score = last.winnerBefore;
      loser.score = last.loserBefore;
      winner.wins = Math.max(0, winner.wins - 1);
      loser.losses = Math.max(0, loser.losses - 1);
      winner.seen = Math.max(0, winner.seen - 1);
      loser.seen = Math.max(0, loser.seen - 1);
      state.currentPair = [winner.id, loser.id];
    }

    state.totalTaps = Math.max(0, state.totalTaps - 1);
    state.pairHistory.pop();
    saveState();
    render();
  }

  function handleTaskAction(event) {
    const button = event.target.closest("[data-action][data-id]");
    if (!button) {
      return;
    }

    const task = findTask(button.dataset.id);
    if (!task) {
      return;
    }

    task.done = button.dataset.action === "done";
    state.currentPair = null;
    ensurePair();
    saveState();
    render();
  }

  function resetRank() {
    state.tasks.forEach((task) => {
      task.score = 1000;
      task.wins = 0;
      task.losses = 0;
      task.seen = 0;
    });

    state.totalTaps = 0;
    state.sprintStartTaps = 0;
    state.comparisons = [];
    state.pairHistory = [];
    state.currentPair = null;
    saveState();
    render();
  }

  function clearDone() {
    state.tasks = state.tasks.filter((task) => !task.done);
    state.currentPair = null;
    state.comparisons = [];
    state.pairHistory = [];
    saveState();
    render();
  }

  function clearAll() {
    const ok = window.confirm("Clear all tasks?");
    if (!ok) {
      return;
    }

    state = freshState();
    activeView = "input";
    lastSyncedInput = "";
    refs.taskInput.value = "";
    saveState();
    render();
  }

  function setTopCount(delta) {
    const max = Math.max(1, activeTasks().length || state.tasks.length || 1);
    state.topCount = clamp(state.topCount + delta, 1, max);
    saveState();
    render();
  }

  function startSprint() {
    state.sprintEndsAt = Date.now() + SPRINT_MS;
    state.sprintStartTaps = state.totalTaps;
    ensurePair();
    saveState();
  }

  function tick() {
    if (activeView !== "choose") {
      return;
    }

    if (state.sprintEndsAt && remainingMs() <= 0) {
      state.sprintEndsAt = null;
      activeView = state.totalTaps > state.sprintStartTaps ? "focus" : "choose";
      saveState();
      render();
      return;
    }

    updateSprintMeta();
  }

  function ensurePair() {
    if (!isPairValid(state.currentPair)) {
      state.currentPair = choosePair();
    }
  }

  function choosePair(avoidKey) {
    const active = activeTasks();
    if (active.length < 2) {
      return null;
    }

    const ranked = rankedTasks().filter((task) => !task.done);
    const rankIndex = new Map(ranked.map((task, index) => [task.id, index]));
    const minSeen = Math.min(...active.map((task) => task.seen));
    const leastSeen = active
      .filter((task) => task.seen === minSeen)
      .sort((a, b) => (rankIndex.get(a.id) || 0) - (rankIndex.get(b.id) || 0));

    const firstPool = leastSeen.slice(0, Math.min(3, leastSeen.length));
    const first = firstPool[Math.floor(Math.random() * firstPool.length)] || active[0];
    const recent = new Set(state.pairHistory.slice(-Math.max(14, active.length * 2)));

    const second = active
      .filter((task) => task.id !== first.id)
      .map((task) => {
        const key = pairKey(first.id, task.id);
        const rank = rankIndex.get(task.id) || 0;
        const repeatCost = recent.has(key) || key === avoidKey ? 10000 : 0;
        const gapCost = Math.abs(first.score - task.score);
        const seenCost = task.seen * 14;
        const rankCost = rank * 2;
        const focusCost = rank > state.topCount * 3 ? 10 : 0;

        return {
          task,
          value: repeatCost + gapCost + seenCost + rankCost + focusCost + Math.random()
        };
      })
      .sort((a, b) => a.value - b.value)[0].task;

    const pair = [first.id, second.id];
    return Math.random() > 0.5 ? pair.reverse() : pair;
  }

  function getCurrentTasks() {
    if (!isPairValid(state.currentPair)) {
      return null;
    }

    return [findTask(state.currentPair[0]), findTask(state.currentPair[1])];
  }

  function isPairValid(pair) {
    if (!Array.isArray(pair) || pair.length !== 2 || pair[0] === pair[1]) {
      return false;
    }

    const first = findTask(pair[0]);
    const second = findTask(pair[1]);
    return Boolean(first && second && !first.done && !second.done);
  }

  function rankedTasks() {
    return [...state.tasks].sort((a, b) => {
      if (a.done !== b.done) {
        return a.done ? 1 : -1;
      }

      return b.score - a.score || b.wins - a.wins || a.losses - b.losses || a.createdAt - b.createdAt;
    });
  }

  function activeTasks() {
    return state.tasks.filter((task) => !task.done);
  }

  function findTask(id) {
    return state.tasks.find((task) => task.id === id);
  }

  function parseTasks(raw) {
    const seen = new Set();

    return raw
      .split(/\r?\n/)
      .map((line) => line.replace(/^[-*]\s+/, "").replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .filter((line) => {
        const key = line.toLowerCase();
        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      });
  }

  function expectedScore(a, b) {
    return 1 / (1 + Math.pow(10, (b - a) / 400));
  }

  function remainingMs() {
    if (!state.sprintEndsAt) {
      return SPRINT_MS;
    }

    return Math.max(0, state.sprintEndsAt - Date.now());
  }

  function rememberPair(firstId, secondId) {
    state.pairHistory.push(pairKey(firstId, secondId));
    state.pairHistory = state.pairHistory.slice(-240);
  }

  function pairKey(firstId, secondId) {
    return [firstId, secondId].sort().join(":");
  }

  function makeId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
})();
