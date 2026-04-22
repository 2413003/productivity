(function () {
  const STORE_KEY = "priority-state-v1";
  const LEGACY_STORE_KEY = "two-choice-state-v1";
  const BACKEND_CONFIG_KEY = "do-supabase-config-v1";
  const SUPABASE_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
  const SPRINT_MS = 60000;
  const TABLES = {
    profiles: "do_task_bracket_v1_profiles",
    tasks: "do_task_bracket_v1_tasks",
    proofs: "do_task_bracket_v1_proofs",
    supportSignals: "do_task_bracket_v1_support_signals"
  };

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
    clearAll: document.getElementById("clearAll"),
    repScore: document.getElementById("repScore"),
    repStatus: document.getElementById("repStatus"),
    doneMetric: document.getElementById("doneMetric"),
    proofMetric: document.getElementById("proofMetric"),
    supportMetric: document.getElementById("supportMetric"),
    proofCount: document.getElementById("proofCount"),
    proofList: document.getElementById("proofList"),
    supporterList: document.getElementById("supporterList"),
    inviteBtn: document.getElementById("inviteBtn"),
    publicBtn: document.getElementById("publicBtn"),
    addSupportBtn: document.getElementById("addSupportBtn"),
    copySignalBtn: document.getElementById("copySignalBtn"),
    publicScore: document.getElementById("publicScore"),
    publicDone: document.getElementById("publicDone"),
    publicProof: document.getElementById("publicProof"),
    publicSupport: document.getElementById("publicSupport"),
    publicProofList: document.getElementById("publicProofList"),
    proofDialog: document.getElementById("proofDialog"),
    proofForm: document.getElementById("proofForm"),
    proofTask: document.getElementById("proofTask"),
    proofEvidence: document.getElementById("proofEvidence"),
    skipProofBtn: document.getElementById("skipProofBtn"),
    supportDialog: document.getElementById("supportDialog"),
    supportForm: document.getElementById("supportForm"),
    supportName: document.getElementById("supportName"),
    supportType: document.getElementById("supportType"),
    supportNote: document.getElementById("supportNote"),
    cancelSupportBtn: document.getElementById("cancelSupportBtn"),
    accountName: document.getElementById("accountName"),
    syncStatus: document.getElementById("syncStatus"),
    authForm: document.getElementById("authForm"),
    authEmail: document.getElementById("authEmail"),
    authPassword: document.getElementById("authPassword"),
    signInBtn: document.getElementById("signInBtn"),
    signUpBtn: document.getElementById("signUpBtn"),
    signOutBtn: document.getElementById("signOutBtn"),
    accountActions: document.getElementById("accountActions")
  };

  let state = loadState();
  let backendConfig = loadBackendConfig();
  let supabaseClient = null;
  let session = null;
  let cloudSaveTimer = null;
  let cloudBusy = false;
  let activeView = state.tasks.length ? "focus" : "input";
  let lastSyncedInput = "";
  let proofTaskId = null;
  let publicSnapshot = null;
  let pendingPublicProfileId = null;
  let pendingSignal = null;
  let activeInviteProfileId = null;
  let pendingSupportDialog = false;
  let lastSignalUrl = "";

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
    refs.proofList.addEventListener("click", handleProofAction);

    refs.resetRank.addEventListener("click", resetRank);
    refs.clearDone.addEventListener("click", clearDone);
    refs.clearAll.addEventListener("click", clearAll);
    refs.inviteBtn.addEventListener("click", copyInviteLink);
    refs.publicBtn.addEventListener("click", showPublicProfile);
    refs.addSupportBtn.addEventListener("click", () => openSupportDialog());
    refs.copySignalBtn.addEventListener("click", copyLatestSignal);
    refs.proofForm.addEventListener("submit", saveProof);
    refs.skipProofBtn.addEventListener("click", closeProofDialog);
    refs.supportForm.addEventListener("submit", saveSupport);
    refs.cancelSupportBtn.addEventListener("click", closeSupportDialog);
    refs.authForm.addEventListener("submit", signIn);
    refs.signUpBtn.addEventListener("click", signUp);
    refs.signOutBtn.addEventListener("click", signOut);

    window.addEventListener("storage", () => {
      state = loadState();
      render();
    });
    window.addEventListener("hashchange", () => {
      handleHash();
      render();

      if (pendingSupportDialog) {
        window.setTimeout(() => openSupportDialog(), 120);
      }
    });

    handleHash();
    connectBackend();

    window.setInterval(tick, 1000);
    render();

    if (pendingSupportDialog) {
      window.setTimeout(() => openSupportDialog(), 120);
    }
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
            doneAt: Number(task.doneAt) || null,
            createdAt: Number(task.createdAt) || Date.now()
          }))
          .filter((task) => task.text),
        reputation: normalizeReputation(saved.reputation),
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
      pairHistory: [],
      reputation: {
        profileId: makeId(),
        proofs: [],
        supporters: []
      }
    };
  }

  function normalizeReputation(reputation) {
    const source = reputation && typeof reputation === "object" ? reputation : {};

    return {
      profileId: typeof source.profileId === "string" ? source.profileId : makeId(),
      proofs: Array.isArray(source.proofs)
        ? source.proofs
            .filter((proof) => proof && typeof proof.taskText === "string")
            .map((proof) => ({
              id: proof.id || makeId(),
              taskId: proof.taskId || "",
              taskText: proof.taskText.trim(),
              evidence: typeof proof.evidence === "string" ? proof.evidence.trim() : "",
              createdAt: Number(proof.createdAt) || Date.now()
            }))
            .filter((proof) => proof.taskText)
        : [],
      supporters: Array.isArray(source.supporters)
        ? source.supporters
            .filter((signal) => signal && typeof signal.name === "string")
            .map((signal) => ({
              id: signal.id || makeId(),
              profileId: signal.profileId || source.profileId || "",
              name: signal.name.trim() || "Someone",
              type: ["verify", "kudos", "nudge"].includes(signal.type) ? signal.type : "kudos",
              note: typeof signal.note === "string" ? signal.note.trim() : "",
              createdAt: Number(signal.createdAt) || Date.now()
            }))
        : []
    };
  }

  function saveState() {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    scheduleCloudSave();
  }

  function saveStateLocalOnly() {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }

  function loadBackendConfig() {
    try {
      const defaultConfig = window.DO_SUPABASE_CONFIG || {};
      const saved = JSON.parse(localStorage.getItem(BACKEND_CONFIG_KEY) || "null");
      if (!saved || typeof saved.url !== "string" || typeof saved.anonKey !== "string") {
        return {
          url: typeof defaultConfig.url === "string" ? defaultConfig.url.trim() : "",
          anonKey: typeof defaultConfig.anonKey === "string" ? defaultConfig.anonKey.trim() : ""
        };
      }

      return {
        url: saved.url.trim(),
        anonKey: saved.anonKey.trim()
      };
    } catch (error) {
      return { url: "", anonKey: "" };
    }
  }

  async function connectBackend() {
    if (!backendConfig.url || !backendConfig.anonKey) {
      setSyncStatus("Local");
      render();
      return;
    }

    try {
      const { createClient } = await import(SUPABASE_CDN);
      supabaseClient = createClient(backendConfig.url, backendConfig.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });

      const { data, error } = await supabaseClient.auth.getSession();
      if (error) {
        throw error;
      }

      session = data.session;
      supabaseClient.auth.onAuthStateChange(async (_event, nextSession) => {
        session = nextSession;
        if (session) {
          await syncNow();
        } else {
          setSyncStatus("Signed out");
          render();
        }
      });

      if (session) {
        await syncNow();
        await processPendingSignal();
      } else {
        setSyncStatus("Ready");
        render();
      }

      if (pendingPublicProfileId) {
        await loadPublicProfile(pendingPublicProfileId);
      }
    } catch (error) {
      supabaseClient = null;
      session = null;
      setSyncStatus("Try again later");
      console.error(error);
      render();
    }
  }

  async function signIn(event) {
    event.preventDefault();
    if (!supabaseClient) {
      setSyncStatus("Try again later");
      return;
    }

    const email = refs.authEmail.value.trim();
    const password = refs.authPassword.value;
    if (!email || !password) {
      setSyncStatus("Email + password");
      return;
    }

    setSyncStatus("Signing in");
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      setSyncStatus(error.message);
      return;
    }

    session = data.session;
    await syncNow();
    await processPendingSignal();
  }

  async function signUp() {
    if (!supabaseClient) {
      setSyncStatus("Try again later");
      return;
    }

    const email = refs.authEmail.value.trim();
    const password = refs.authPassword.value;
    if (!email || !password) {
      setSyncStatus("Email + password");
      return;
    }

    setSyncStatus("Creating");
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) {
      setSyncStatus(error.message);
      return;
    }

    session = data.session;
    if (session) {
      await syncNow();
    } else {
      setSyncStatus("Check email");
      render();
    }
  }

  async function signOut() {
    if (!supabaseClient) {
      return;
    }

    await supabaseClient.auth.signOut();
    session = null;
    setSyncStatus("Signed out");
    render();
  }

  async function syncNow() {
    if (!supabaseClient || !session || cloudBusy) {
      return;
    }

    cloudBusy = true;
    setSyncStatus("Syncing");
    render();

    try {
      const localSnapshot = captureSyncSnapshot();
      await ensureProfile();
      await pullCloudState();
      mergeSyncSnapshot(localSnapshot);
      await pushCloudState();
      await pullCloudState();
      setSyncStatus("Synced");
    } catch (error) {
      console.error(error);
      setSyncStatus(error.message || "Sync error");
    } finally {
      cloudBusy = false;
      render();
    }
  }

  function captureSyncSnapshot() {
    return {
      tasks: state.tasks.map((task) => ({ ...task })),
      proofs: state.reputation.proofs.map((proof) => ({ ...proof })),
      supporters: state.reputation.supporters.map((signal) => ({ ...signal })),
      topCount: state.topCount
    };
  }

  function mergeSyncSnapshot(snapshot) {
    const taskById = new Map(state.tasks.map((task) => [task.id, task]));
    snapshot.tasks.forEach((task) => {
      taskById.set(task.id, { ...taskById.get(task.id), ...task });
    });

    const proofById = new Map(state.reputation.proofs.map((proof) => [proof.id, proof]));
    snapshot.proofs.forEach((proof) => {
      proofById.set(proof.id, { ...proofById.get(proof.id), ...proof });
    });

    const signalById = new Map(state.reputation.supporters.map((signal) => [signal.id, signal]));
    snapshot.supporters.forEach((signal) => {
      signalById.set(signal.id, { ...signalById.get(signal.id), ...signal });
    });

    state.tasks = Array.from(taskById.values());
    state.reputation.proofs = Array.from(proofById.values());
    state.reputation.supporters = Array.from(signalById.values());
    state.topCount = Math.max(state.topCount, snapshot.topCount || 1);
    saveStateLocalOnly();
  }

  function scheduleCloudSave() {
    if (!supabaseClient || !session || cloudBusy) {
      return;
    }

    window.clearTimeout(cloudSaveTimer);
    cloudSaveTimer = window.setTimeout(async () => {
      if (!supabaseClient || !session || cloudBusy) {
        return;
      }

      cloudBusy = true;
      setSyncStatus("Saving");
      try {
        await ensureProfile();
        await pushCloudState();
        setSyncStatus("Saved");
      } catch (error) {
        console.error(error);
        setSyncStatus("Save error");
      } finally {
        cloudBusy = false;
        render();
      }
    }, 700);
  }

  async function ensureProfile() {
    const user = session.user;
    state.reputation.profileId = user.id;
    const stats = reputationStats();
    const displayName = user.email ? user.email.split("@")[0] : "Do user";

    const { error } = await supabaseClient
      .from(TABLES.profiles)
      .upsert(
        {
          id: user.id,
          display_name: displayName,
          public_profile: true,
          reputation_score: stats.score,
          done_count: stats.done,
          proof_count: stats.proofs,
          support_count: stats.supporters
        },
        { onConflict: "id" }
      );

    if (error) {
      throw error;
    }
  }

  async function pushCloudState() {
    const ownerId = session.user.id;
    const stats = reputationStats();

    const { error: profileError } = await supabaseClient
      .from(TABLES.profiles)
      .update({
        reputation_score: stats.score,
        done_count: stats.done,
        proof_count: stats.proofs,
        support_count: stats.supporters
      })
      .eq("id", ownerId);
    if (profileError) {
      throw profileError;
    }

    const { error: proofDeleteError } = await supabaseClient.from(TABLES.proofs).delete().eq("owner_id", ownerId);
    if (proofDeleteError) {
      throw proofDeleteError;
    }

    const { error: taskDeleteError } = await supabaseClient.from(TABLES.tasks).delete().eq("owner_id", ownerId);
    if (taskDeleteError) {
      throw taskDeleteError;
    }

    if (state.tasks.length) {
      const { error } = await supabaseClient.from(TABLES.tasks).insert(
        state.tasks.map((task) => ({
          id: task.id,
          owner_id: ownerId,
          text: task.text,
          score: task.score,
          wins: task.wins,
          losses: task.losses,
          seen: task.seen,
          done: task.done,
          done_at: toIso(task.doneAt),
          created_at: toIso(task.createdAt)
        }))
      );

      if (error) {
        throw error;
      }
    }

    if (state.reputation.proofs.length) {
      const { error } = await supabaseClient.from(TABLES.proofs).insert(
        state.reputation.proofs.map((proof) => ({
          id: proof.id,
          owner_id: ownerId,
          task_id: findTask(proof.taskId) ? proof.taskId : null,
          task_text: proof.taskText,
          evidence: proof.evidence,
          created_at: toIso(proof.createdAt)
        }))
      );

      if (error) {
        throw error;
      }
    }

    const ownSignals = state.reputation.supporters.filter((signal) => signal.profileId === ownerId);
    if (ownSignals.length) {
      const { error } = await supabaseClient.from(TABLES.supportSignals).upsert(
        ownSignals.map((signal) => ({
          id: signal.id,
          profile_id: ownerId,
          supporter_id: session.user.id,
          supporter_name: signal.name,
          signal_type: signal.type,
          note: signal.note,
          created_at: toIso(signal.createdAt)
        })),
        { onConflict: "id" }
      );

      if (error) {
        throw error;
      }
    }
  }

  async function pullCloudState() {
    const ownerId = session.user.id;
    const [tasksResult, proofsResult, signalsResult] = await Promise.all([
      supabaseClient
        .from(TABLES.tasks)
        .select("id,text,score,wins,losses,seen,done,done_at,created_at")
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: true }),
      supabaseClient
        .from(TABLES.proofs)
        .select("id,task_id,task_text,evidence,created_at")
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false }),
      supabaseClient
        .from(TABLES.supportSignals)
        .select("id,profile_id,supporter_name,signal_type,note,created_at")
        .eq("profile_id", ownerId)
        .order("created_at", { ascending: false })
    ]);

    if (tasksResult.error) throw tasksResult.error;
    if (proofsResult.error) throw proofsResult.error;
    if (signalsResult.error) throw signalsResult.error;

    state.tasks = tasksResult.data.map((task) => ({
      id: task.id,
      text: task.text,
      score: Number(task.score) || 1000,
      wins: Number(task.wins) || 0,
      losses: Number(task.losses) || 0,
      seen: Number(task.seen) || 0,
      done: Boolean(task.done),
      doneAt: task.done_at ? Date.parse(task.done_at) : null,
      createdAt: task.created_at ? Date.parse(task.created_at) : Date.now()
    }));

    state.reputation.profileId = ownerId;
    state.reputation.proofs = proofsResult.data.map((proof) => ({
      id: proof.id,
      taskId: proof.task_id || "",
      taskText: proof.task_text,
      evidence: proof.evidence,
      createdAt: proof.created_at ? Date.parse(proof.created_at) : Date.now()
    }));
    state.reputation.supporters = signalsResult.data.map((signal) => ({
      id: signal.id,
      profileId: signal.profile_id,
      name: signal.supporter_name,
      type: signal.signal_type,
      note: signal.note || "",
      createdAt: signal.created_at ? Date.parse(signal.created_at) : Date.now()
    }));
    state.currentPair = null;
    lastSyncedInput = state.tasks.map((task) => task.text).join("\n");
    saveStateLocalOnly();
  }

  function setSyncStatus(message) {
    refs.syncStatus.textContent = accountStatus(message);
    if (["Signal saved", "Signal link copied", "Signal copied", "Signal added", "Signal imported", "Wrong profile"].includes(message)) {
      refs.repStatus.textContent = message;
    }
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
    renderReputation();
    renderPublic();
    renderAccount();
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

  function renderReputation() {
    const stats = reputationStats();
    refs.repScore.textContent = String(stats.score);
    refs.doneMetric.textContent = String(stats.done);
    refs.proofMetric.textContent = String(stats.proofs);
    refs.supportMetric.textContent = String(stats.supporters);
    refs.proofCount.textContent = String(stats.proofs);

    refs.proofList.innerHTML = "";
    const doneTasks = [...state.tasks]
      .filter((task) => task.done)
      .sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0))
      .slice(0, 8);

    if (!doneTasks.length) {
      const empty = document.createElement("li");
      empty.className = "empty";
      empty.textContent = "Complete a task";
      refs.proofList.appendChild(empty);
    } else {
      doneTasks.forEach((task, index) => {
        refs.proofList.appendChild(createProofRow(task, index));
      });
    }

    refs.supporterList.innerHTML = "";
    if (!state.reputation.supporters.length) {
      const empty = document.createElement("li");
      empty.className = "empty";
      empty.textContent = "Invite someone";
      refs.supporterList.appendChild(empty);
    } else {
      [...state.reputation.supporters]
        .sort((a, b) => b.createdAt - a.createdAt)
        .forEach((signal, index) => {
          refs.supporterList.appendChild(createSupporterRow(signal, index));
        });
    }
  }

  function renderPublic() {
    const snapshot = publicSnapshot || publicSnapshotFromState();
    refs.publicScore.textContent = String(snapshot.score);
    refs.publicDone.textContent = String(snapshot.done);
    refs.publicProof.textContent = String(snapshot.proofs);
    refs.publicSupport.textContent = String(snapshot.supporters);
    refs.publicProofList.innerHTML = "";

    if (!snapshot.items.length) {
      const empty = document.createElement("li");
      empty.className = "empty";
      empty.textContent = "No proof yet";
      refs.publicProofList.appendChild(empty);
      return;
    }

    snapshot.items.forEach((item, index) => {
      refs.publicProofList.appendChild(createPublicProofRow(item, index));
    });
  }

  function renderAccount() {
    const email = session?.user?.email || "";
    const signedIn = Boolean(session);

    refs.accountName.textContent = signedIn ? email : "Sign in";
    refs.authForm.classList.toggle("is-hidden", signedIn);
    refs.accountActions.classList.toggle("is-hidden", !signedIn);
    refs.signOutBtn.disabled = !signedIn;
    refs.signInBtn.disabled = !supabaseClient || cloudBusy;
    refs.signUpBtn.disabled = !supabaseClient || cloudBusy;
  }

  function createProofRow(task, index) {
    const proof = latestProofForTask(task.id);
    const item = document.createElement("li");
    item.className = "proof-row";
    item.style.animationDelay = `${Math.min(index, 7) * 28}ms`;

    const main = document.createElement("span");
    main.className = "proof-main";

    const title = document.createElement("span");
    title.className = "proof-title";
    title.textContent = task.text;

    const meta = document.createElement("span");
    meta.className = "proof-meta";
    meta.textContent = proof ? proof.evidence : formatDate(task.doneAt);

    main.append(title, meta);

    const action = document.createElement("button");
    action.className = "proof-link";
    action.type = "button";
    action.dataset.id = task.id;
    action.dataset.action = proof && isUrl(proof.evidence) ? "open-proof" : "add-proof";
    action.textContent = proof && isUrl(proof.evidence) ? "Open" : "Proof";

    item.append(main, action);
    return item;
  }

  function createSupporterRow(signal, index) {
    const item = document.createElement("li");
    item.className = "supporter-row";
    item.style.animationDelay = `${Math.min(index, 7) * 28}ms`;

    const main = document.createElement("span");
    main.className = "supporter-main";

    const name = document.createElement("span");
    name.className = "supporter-name";
    name.textContent = signal.name;

    const meta = document.createElement("span");
    meta.className = "supporter-meta";
    meta.textContent = signal.note || formatDate(signal.createdAt);

    const tag = document.createElement("span");
    tag.className = "supporter-tag";
    tag.textContent = signal.type;

    main.append(name, meta);
    item.append(main, tag);
    return item;
  }

  function createPublicProofRow(item, index) {
    const row = document.createElement("li");
    row.className = "proof-row";
    row.style.animationDelay = `${Math.min(index, 7) * 28}ms`;

    const main = document.createElement("span");
    main.className = "proof-main";

    const title = document.createElement("span");
    title.className = "proof-title";
    title.textContent = item.taskText;

    const meta = document.createElement("span");
    meta.className = "proof-meta";
    meta.textContent = item.evidence || item.date || "Done";

    main.append(title, meta);
    row.appendChild(main);
    return row;
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
        doneAt: null,
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

    if (button.dataset.action === "done") {
      task.done = true;
      task.doneAt = Date.now();
      openProofDialog(task);
    } else {
      task.done = false;
      task.doneAt = null;
      state.reputation.proofs = state.reputation.proofs.filter((proof) => proof.taskId !== task.id);
    }

    state.currentPair = null;
    ensurePair();
    saveState();
    render();
  }

  function handleProofAction(event) {
    const action = event.target.closest("[data-action][data-id]");
    if (!action) {
      return;
    }

    const task = findTask(action.dataset.id);
    if (!task) {
      return;
    }

    if (action.dataset.action === "open-proof") {
      const proof = latestProofForTask(task.id);
      if (proof && isUrl(proof.evidence)) {
        window.open(proof.evidence, "_blank", "noopener");
      }
      return;
    }

    openProofDialog(task);
  }

  function openProofDialog(task) {
    proofTaskId = task.id;
    refs.proofTask.textContent = task.text;
    refs.proofEvidence.value = latestProofForTask(task.id)?.evidence || "";

    if (typeof refs.proofDialog.showModal === "function") {
      refs.proofDialog.showModal();
      refs.proofEvidence.focus();
    }
  }

  function closeProofDialog() {
    proofTaskId = null;
    if (refs.proofDialog.open) {
      refs.proofDialog.close();
    }
  }

  function saveProof(event) {
    event.preventDefault();

    const task = findTask(proofTaskId);
    const evidence = refs.proofEvidence.value.trim();
    if (!task || !evidence) {
      closeProofDialog();
      return;
    }

    const existing = latestProofForTask(task.id);
    if (existing) {
      existing.evidence = evidence;
      existing.createdAt = Date.now();
    } else {
      state.reputation.proofs.push({
        id: makeId(),
        taskId: task.id,
        taskText: task.text,
        evidence,
        createdAt: Date.now()
      });
    }

    refs.repStatus.textContent = "Proof saved";
    closeProofDialog();
    saveState();
    render();
  }

  function openSupportDialog() {
    refs.supportName.value = "";
    refs.supportType.value = "verify";
    refs.supportNote.value = "";

    if (typeof refs.supportDialog.showModal === "function") {
      refs.supportDialog.showModal();
      refs.supportName.focus();
    }
  }

  function closeSupportDialog() {
    if (refs.supportDialog.open) {
      refs.supportDialog.close();
    }
    activeInviteProfileId = null;
    pendingSupportDialog = false;
  }

  async function saveSupport(event) {
    event.preventDefault();

    const targetProfileId = activeInviteProfileId || state.reputation.profileId;
    const signal = {
      id: makeId(),
      profileId: targetProfileId,
      name: refs.supportName.value.trim() || "Someone",
      type: refs.supportType.value,
      note: refs.supportNote.value.trim(),
      createdAt: Date.now()
    };

    if (supabaseClient && session && activeInviteProfileId) {
      try {
        const { error } = await supabaseClient.from(TABLES.supportSignals).insert({
          id: signal.id,
          profile_id: targetProfileId,
          supporter_id: session.user.id,
          supporter_name: signal.name,
          signal_type: signal.type,
          note: signal.note,
          created_at: toIso(signal.createdAt)
        });

        if (error) {
          throw error;
        }

        setSyncStatus("Signal saved");
        closeSupportDialog();
        render();
        return;
      } catch (error) {
        console.error(error);
        setSyncStatus("Signal link copied");
      }
    }

    if (!activeInviteProfileId || activeInviteProfileId === state.reputation.profileId) {
      addSupportSignal(signal);
      saveState();
    }

    lastSignalUrl = signalUrl(signal);
    copyText(lastSignalUrl, "Signal copied");
    closeSupportDialog();
    render();
  }

  function addSupportSignal(signal) {
    if (state.reputation.supporters.some((existing) => existing.id === signal.id)) {
      return;
    }

    state.reputation.supporters.push({
      id: signal.id || makeId(),
      profileId: signal.profileId || state.reputation.profileId,
      name: signal.name || "Someone",
      type: ["verify", "kudos", "nudge"].includes(signal.type) ? signal.type : "kudos",
      note: signal.note || "",
      createdAt: Number(signal.createdAt) || Date.now()
    });
    refs.repStatus.textContent = "Signal added";
  }

  function copyInviteLink() {
    copyText(inviteUrl(), "Invite copied");
  }

  function showPublicProfile() {
    if (session) {
      pendingPublicProfileId = session.user.id;
      publicSnapshot = publicSnapshotFromState();
      copyText(profileUrl(session.user.id), "Public copied");
      loadPublicProfile(session.user.id);
      activeView = "public";
      render();
      return;
    }

    publicSnapshot = publicSnapshotFromState();
    copyText(publicUrl(publicSnapshot), "Public copied");
    activeView = "public";
    render();
  }

  function copyLatestSignal() {
    const latest = [...state.reputation.supporters].sort((a, b) => b.createdAt - a.createdAt)[0];
    if (!latest && !lastSignalUrl) {
      refs.repStatus.textContent = "No signal";
      return;
    }

    copyText(lastSignalUrl || signalUrl(latest), "Signal copied");
  }

  function reputationStats() {
    const done = state.tasks.filter((task) => task.done).length;
    const proofs = state.reputation.proofs.filter((proof) => proof.evidence).length;
    const supporters = state.reputation.supporters.length;
    const supportScore = state.reputation.supporters.reduce((total, signal) => {
      if (signal.type === "verify") {
        return total + 16;
      }

      if (signal.type === "nudge") {
        return total - 5;
      }

      return total + 6;
    }, 0);
    const score = Math.max(0, Math.round(done * 10 + proofs * 12 + supportScore));

    return { score, done, proofs, supporters };
  }

  function latestProofForTask(taskId) {
    return [...state.reputation.proofs]
      .filter((proof) => proof.taskId === taskId)
      .sort((a, b) => b.createdAt - a.createdAt)[0];
  }

  function publicSnapshotFromState() {
    const stats = reputationStats();
    const items = [...state.reputation.proofs]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 8)
      .map((proof) => ({
        taskText: proof.taskText,
        evidence: proof.evidence,
        date: formatDate(proof.createdAt)
      }));

    return {
      type: "public-profile",
      score: stats.score,
      done: stats.done,
      proofs: stats.proofs,
      supporters: stats.supporters,
      updatedAt: Date.now(),
      items
    };
  }

  function handleHash() {
    const hash = window.location.hash.slice(1);
    if (!hash) {
      return;
    }

    const [mode, value] = hash.split("=");
    if (!value) {
      return;
    }

    const payload = decodePayload(value);
    if (!payload) {
      return;
    }

    if (mode === "public" && payload.type === "public-profile") {
      publicSnapshot = {
        score: Number(payload.score) || 0,
        done: Number(payload.done) || 0,
        proofs: Number(payload.proofs) || 0,
        supporters: Number(payload.supporters) || 0,
        items: Array.isArray(payload.items) ? payload.items.slice(0, 8) : []
      };
      activeView = "public";
      return;
    }

    if (mode === "profile" && payload.type === "cloud-profile") {
      pendingPublicProfileId = payload.profileId || null;
      publicSnapshot = {
        score: 0,
        done: 0,
        proofs: 0,
        supporters: 0,
        items: []
      };
      activeView = "public";
      if (pendingPublicProfileId && supabaseClient) {
        loadPublicProfile(pendingPublicProfileId);
      }
      return;
    }

    if (mode === "support" && payload.type === "support-invite") {
      activeInviteProfileId = payload.profileId || null;
      pendingSupportDialog = true;
      activeView = "reputation";
      return;
    }

    if (mode === "signal" && payload.type === "support-signal" && payload.signal) {
      activeView = "reputation";
      const targetId = session?.user?.id || state.reputation.profileId;
      if (payload.signal.profileId === targetId) {
        addSupportSignal(payload.signal);
        saveState();
        refs.repStatus.textContent = "Signal imported";
        history.replaceState(null, "", window.location.href.split("#")[0]);
      } else if (supabaseClient && !session) {
        pendingSignal = payload.signal;
        setSyncStatus("Sign in");
      } else {
        refs.repStatus.textContent = "Wrong profile";
      }
    }
  }

  function inviteUrl() {
    return `${baseUrl()}#support=${encodePayload({
      type: "support-invite",
      profileId: state.reputation.profileId,
      createdAt: Date.now()
    })}`;
  }

  function publicUrl(snapshot) {
    return `${baseUrl()}#public=${encodePayload(snapshot)}`;
  }

  function profileUrl(profileId) {
    return `${baseUrl()}#profile=${encodePayload({
      type: "cloud-profile",
      profileId
    })}`;
  }

  async function loadPublicProfile(profileId) {
    if (!supabaseClient || !profileId) {
      return;
    }

    try {
      const [profileResult, proofsResult, signalsResult] = await Promise.all([
        supabaseClient
          .from(TABLES.profiles)
          .select("reputation_score,done_count,proof_count,support_count")
          .eq("id", profileId)
          .single(),
        supabaseClient
          .from(TABLES.proofs)
          .select("task_text,evidence,created_at")
          .eq("owner_id", profileId)
          .order("created_at", { ascending: false })
          .limit(8),
        supabaseClient.from(TABLES.supportSignals).select("id", { count: "exact", head: true }).eq("profile_id", profileId)
      ]);

      if (profileResult.error) throw profileResult.error;
      if (proofsResult.error) throw proofsResult.error;
      if (signalsResult.error) throw signalsResult.error;

      publicSnapshot = {
        score: Number(profileResult.data.reputation_score) || 0,
        done: Number(profileResult.data.done_count) || 0,
        proofs: Number(profileResult.data.proof_count) || proofsResult.data.length,
        supporters: Number(profileResult.data.support_count) || signalsResult.count || 0,
        items: proofsResult.data.map((proof) => ({
          taskText: proof.task_text,
          evidence: proof.evidence,
          date: formatDate(Date.parse(proof.created_at))
        }))
      };
      render();
    } catch (error) {
      console.error(error);
      publicSnapshot = {
        score: 0,
        done: 0,
        proofs: 0,
        supporters: 0,
        items: [{ taskText: "Profile unavailable", evidence: "Try again later", date: "" }]
      };
      render();
    }
  }

  async function processPendingSignal() {
    if (!pendingSignal || !session) {
      return;
    }

    if (pendingSignal.profileId !== session.user.id) {
      setSyncStatus("Wrong profile");
      pendingSignal = null;
      return;
    }

    addSupportSignal(pendingSignal);
    pendingSignal = null;
    saveState();
    await syncNow();
    history.replaceState(null, "", window.location.href.split("#")[0]);
  }

  function signalUrl(signal) {
    return `${baseUrl()}#signal=${encodePayload({
      type: "support-signal",
      signal
    })}`;
  }

  function baseUrl() {
    return window.location.href.split("#")[0];
  }

  function encodePayload(payload) {
    const json = JSON.stringify(payload);
    const binary = encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, hex) =>
      String.fromCharCode(Number.parseInt(hex, 16))
    );

    return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function decodePayload(value) {
    try {
      const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
      const binary = window.atob(base64);
      const json = decodeURIComponent(
        Array.from(binary)
          .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
          .join("")
      );

      return JSON.parse(json);
    } catch (error) {
      return null;
    }
  }

  async function copyText(text, status) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }

    refs.repStatus.textContent = status;
  }

  function accountStatus(message) {
    const quiet = new Set(["Local", "Ready", "Signed out", "Syncing", "Synced", "Saving", "Saved"]);
    const replacements = {
      "Sync error": "Try again later",
      "Save error": "Try again later"
    };

    if (quiet.has(message)) {
      return "";
    }

    return replacements[message] || message;
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
    const removed = new Set(state.tasks.filter((task) => task.done).map((task) => task.id));
    state.tasks = state.tasks.filter((task) => !task.done);
    state.reputation.proofs = state.reputation.proofs.filter((proof) => !removed.has(proof.taskId));
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

  function isUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (error) {
      return false;
    }
  }

  function formatDate(value) {
    if (!value) {
      return "Done";
    }

    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric"
    }).format(new Date(value));
  }

  function toIso(value) {
    if (!value) {
      return null;
    }

    return new Date(value).toISOString();
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
