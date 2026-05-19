(function () {
  const STORE_KEY = "priority-state-v1";
  const LEGACY_STORE_KEY = "two-choice-state-v1";
  const ACCOUNT_STORE_PREFIX = "do-account-state-v1:";
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
    objectiveRootForm: document.getElementById("objectiveRootForm"),
    objectiveRootInput: document.getElementById("objectiveRootInput"),
    objectiveTree: document.getElementById("objectiveTree"),
    objectiveCount: document.getElementById("objectiveCount"),
    objectiveStatus: document.getElementById("objectiveStatus"),
    objectivePrioritizeBtn: document.getElementById("objectivePrioritizeBtn"),
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
    supportMetric: document.getElementById("supportMetric"),
    proofCount: document.getElementById("proofCount"),
    proofList: document.getElementById("proofList"),
    supporterList: document.getElementById("supporterList"),
    profileDisplayName: document.getElementById("profileDisplayName"),
    profileAvatar: document.getElementById("profileAvatar"),
    profileHandle: document.getElementById("profileHandle"),
    profileBio: document.getElementById("profileBio"),
    inviteBtn: document.getElementById("inviteBtn"),
    publicBtn: document.getElementById("publicBtn"),
    editProfileBtn: document.getElementById("editProfileBtn"),
    profileSignOutBtn: document.getElementById("profileSignOutBtn"),
    addSupportBtn: document.getElementById("addSupportBtn"),
    copySignalBtn: document.getElementById("copySignalBtn"),
    profileVisibility: document.getElementById("profileVisibility"),
    proofVisibility: document.getElementById("proofVisibility"),
    discoverableToggle: document.getElementById("discoverableToggle"),
    friendRequestsToggle: document.getElementById("friendRequestsToggle"),
    publicScore: document.getElementById("publicScore"),
    publicDisplayName: document.getElementById("publicDisplayName"),
    publicAvatar: document.getElementById("publicAvatar"),
    publicHandle: document.getElementById("publicHandle"),
    publicBio: document.getElementById("publicBio"),
    publicProof: document.getElementById("publicProof"),
    publicSupport: document.getElementById("publicSupport"),
    publicProofList: document.getElementById("publicProofList"),
    proofDialog: document.getElementById("proofDialog"),
    proofForm: document.getElementById("proofForm"),
    proofTask: document.getElementById("proofTask"),
    proofEvidence: document.getElementById("proofEvidence"),
    skipProofBtn: document.getElementById("skipProofBtn"),
    whyDialog: document.getElementById("whyDialog"),
    whyForm: document.getElementById("whyForm"),
    whyTask: document.getElementById("whyTask"),
    whyInput: document.getElementById("whyInput"),
    cancelWhyBtn: document.getElementById("cancelWhyBtn"),
    supportDialog: document.getElementById("supportDialog"),
    supportForm: document.getElementById("supportForm"),
    supportName: document.getElementById("supportName"),
    supportType: document.getElementById("supportType"),
    supportNote: document.getElementById("supportNote"),
    cancelSupportBtn: document.getElementById("cancelSupportBtn"),
    profileDialog: document.getElementById("profileDialog"),
    profileForm: document.getElementById("profileForm"),
    profileNameInput: document.getElementById("profileNameInput"),
    profileUsernameInput: document.getElementById("profileUsernameInput"),
    profileAvatarInput: document.getElementById("profileAvatarInput"),
    profileBioInput: document.getElementById("profileBioInput"),
    cancelProfileBtn: document.getElementById("cancelProfileBtn"),
    accountName: document.getElementById("accountName"),
    syncStatus: document.getElementById("syncStatus"),
    accountNote: document.getElementById("accountNote"),
    authForm: document.getElementById("authForm"),
    authEmail: document.getElementById("authEmail"),
    authPassword: document.getElementById("authPassword"),
    signInBtn: document.getElementById("signInBtn"),
    signUpBtn: document.getElementById("signUpBtn"),
    forgotPasswordBtn: document.getElementById("forgotPasswordBtn"),
    recoveryForm: document.getElementById("recoveryForm"),
    recoveryPassword: document.getElementById("recoveryPassword"),
    recoveryConfirm: document.getElementById("recoveryConfirm"),
    savePasswordBtn: document.getElementById("savePasswordBtn"),
    signOutBtn: document.getElementById("signOutBtn"),
    accountActions: document.getElementById("accountActions")
  };

  let state = loadState();
  let backendConfig = loadBackendConfig();
  let supabaseClient = null;
  let session = null;
  let cloudSaveTimer = null;
  let cloudBusy = false;
  let cloudSaveNeeded = false;
  let cloudLoadedUserId = null;
  let activeView = initialView();
  let lastSyncedInput = "";
  let recoveryMode = hasRecoveryLink();
  let proofTaskId = null;
  let whyTaskId = null;
  let publicSnapshot = null;
  let pendingPublicProfileId = null;
  let pendingSignal = null;
  let activeInviteProfileId = null;
  let pendingSupportDialog = false;
  let lastSignalUrl = "";
  let objectiveDraftParentId = null;
  let selectedObjectiveId = null;
  let cloudSchema = {
    profileDraft: null,
    profileObjectives: null,
    taskLevel: null
  };

  init();

  function init() {
    refs.viewButtons.forEach((button) => {
      button.addEventListener("click", () => setView(button.dataset.viewButton));
    });

    refs.taskInput.addEventListener("input", saveDraftInput);
    refs.startBtn.addEventListener("click", () => applyTasks("choose"));
    refs.objectiveRootForm?.addEventListener("submit", addRootObjective);
    refs.objectiveTree?.addEventListener("click", handleObjectiveAction);
    refs.objectiveTree?.addEventListener("submit", submitObjectiveChild);
    refs.objectiveTree?.addEventListener("keydown", handleObjectiveKeydown);
    refs.objectivePrioritizeBtn?.addEventListener("click", () => setView("choose"));

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
    refs.editProfileBtn.addEventListener("click", openProfileDialog);
    refs.profileSignOutBtn.addEventListener("click", signOut);
    refs.addSupportBtn?.addEventListener("click", () => openSupportDialog());
    refs.copySignalBtn.addEventListener("click", copyLatestSignal);
    refs.profileVisibility.addEventListener("change", savePrivacySettings);
    refs.proofVisibility.addEventListener("change", savePrivacySettings);
    refs.discoverableToggle.addEventListener("change", savePrivacySettings);
    refs.friendRequestsToggle.addEventListener("change", savePrivacySettings);
    refs.proofForm.addEventListener("submit", saveProof);
    refs.skipProofBtn.addEventListener("click", closeProofDialog);
    refs.whyForm.addEventListener("submit", saveWhy);
    refs.cancelWhyBtn.addEventListener("click", closeWhyDialog);
    refs.supportForm.addEventListener("submit", saveSupport);
    refs.cancelSupportBtn.addEventListener("click", closeSupportDialog);
    refs.profileForm.addEventListener("submit", saveProfile);
    refs.cancelProfileBtn.addEventListener("click", closeProfileDialog);
    refs.authForm.addEventListener("submit", signIn);
    refs.signUpBtn.addEventListener("click", signUp);
    refs.forgotPasswordBtn.addEventListener("click", requestPasswordReset);
    refs.recoveryForm.addEventListener("submit", saveNewPassword);
    refs.signOutBtn.addEventListener("click", signOut);

    window.addEventListener("storage", () => {
      state = loadState();
      render();
    });
    window.addEventListener("pagehide", () => {
      flushCloudSaveNow();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        flushCloudSaveNow();
      }
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

    if (pendingSupportDialog && !signInRequired()) {
      window.setTimeout(() => openSupportDialog(), 120);
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORE_KEY) || localStorage.getItem(LEGACY_STORE_KEY);
      const saved = JSON.parse(raw || "null");
      return normalizeSavedState(saved);
    } catch (error) {
      return freshState();
    }
  }

  function normalizeSavedState(saved) {
    const base = freshState();
    if (!saved || typeof saved !== "object") {
      return base;
    }

    return {
      ...base,
      ...saved,
      draftText: typeof saved.draftText === "string" ? saved.draftText : "",
      topCount: clamp(Number(saved.topCount) || 3, 1, 99),
      totalTaps: Number(saved.totalTaps) || 0,
      sprintStartTaps: Number(saved.sprintStartTaps) || 0,
      tasks: normalizeTasks(saved.tasks),
      objectives: normalizeObjectives(saved.objectives),
      reputation: normalizeReputation(saved.reputation),
      comparisons: Array.isArray(saved.comparisons) ? saved.comparisons : [],
      pairHistory: Array.isArray(saved.pairHistory) ? saved.pairHistory : [],
      currentPair: Array.isArray(saved.currentPair) ? saved.currentPair : null
    };
  }

  function normalizeTasks(tasks) {
    return Array.isArray(tasks)
      ? tasks
          .filter((task) => task && typeof task.text === "string")
          .map((task) => ({
            id: task.id || makeId(),
            text: task.text.trim(),
            justification: typeof task.justification === "string" ? task.justification.trim() : "",
            score: Number.isFinite(task.score) ? task.score : 1000,
            wins: Number(task.wins) || 0,
            losses: Number(task.losses) || 0,
            seen: Number(task.seen) || 0,
            done: Boolean(task.done),
            doneAt: Number(task.doneAt) || null,
            createdAt: Number(task.createdAt) || Date.now()
          }))
          .filter((task) => task.text)
      : [];
  }

  function normalizeObjectives(objectives) {
    const raw = Array.isArray(objectives) ? objectives : [];
    const seen = new Set();
    const nodes = raw
      .filter((node) => node && typeof node.text === "string")
      .map((node) => {
        const id = typeof node.id === "string" && node.id ? node.id : makeId();
        if (seen.has(id)) {
          return null;
        }
        seen.add(id);

        return {
          id,
          parentId: typeof node.parentId === "string" ? node.parentId : "",
          text: node.text.replace(/\s+/g, " ").trim(),
          kind: node.kind === "task" ? "task" : "objective",
          taskId: typeof node.taskId === "string" ? node.taskId : "",
          createdAt: Number(node.createdAt) || Date.now()
        };
      })
      .filter((node) => node && node.text);
    const ids = new Set(nodes.map((node) => node.id));

    nodes.forEach((node) => {
      if (node.parentId === node.id || !ids.has(node.parentId)) {
        node.parentId = "";
      }
    });

    return nodes.filter((node) => !objectiveCreatesCycle(node, nodes));
  }

  function objectiveCreatesCycle(node, nodes) {
    const byId = new Map(nodes.map((item) => [item.id, item]));
    const seen = new Set([node.id]);
    let parent = byId.get(node.parentId);

    while (parent) {
      if (seen.has(parent.id)) {
        return true;
      }
      seen.add(parent.id);
      parent = byId.get(parent.parentId);
    }

    return false;
  }

  function freshState() {
    return {
      tasks: [],
      objectives: [],
      draftText: "",
      topCount: 1,
      totalTaps: 0,
      sprintStartTaps: 0,
      sprintEndsAt: null,
      currentPair: null,
      comparisons: [],
      pairHistory: [],
      reputation: {
        profileId: makeId(),
        profile: normalizeProfile(),
        proofs: [],
        supporters: []
      }
    };
  }

  function normalizeReputation(reputation) {
    const source = reputation && typeof reputation === "object" ? reputation : {};

    return {
      profileId: typeof source.profileId === "string" ? source.profileId : makeId(),
      profile: normalizeProfile(source.profile),
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

  function normalizeProfile(profile) {
    const source = profile && typeof profile === "object" ? profile : {};
    return {
      displayName: typeof source.displayName === "string" ? source.displayName.trim() : "",
      username: normalizeUsername(source.username),
      bio: typeof source.bio === "string" ? source.bio.trim() : "",
      avatarUrl: typeof source.avatarUrl === "string" ? source.avatarUrl.trim() : "",
      profileVisibility: ["public", "friends", "private"].includes(source.profileVisibility)
        ? source.profileVisibility
        : "public",
      proofVisibility: ["public", "friends", "private"].includes(source.proofVisibility)
        ? source.proofVisibility
        : "public",
      discoverable: source.discoverable !== false,
      allowFriendRequests: source.allowFriendRequests !== false
    };
  }

  function saveState(options = {}) {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    saveAccountState();
    scheduleCloudSave(options);
  }

  function saveStateLocalOnly() {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    saveAccountState();
  }

  function saveAccountState(source = state) {
    const userId = session?.user?.id;
    if (!userId) {
      return;
    }

    try {
      localStorage.setItem(
        accountStoreKey(userId),
        JSON.stringify({
          ...source,
          cachedAt: Date.now()
        })
      );
    } catch (error) {
      console.warn("Couldn't save account cache", error);
    }
  }

  function loadAccountState(userId) {
    if (!userId) {
      return null;
    }

    try {
      const saved = JSON.parse(localStorage.getItem(accountStoreKey(userId)) || "null");
      return saved && Array.isArray(saved.tasks) ? normalizeSavedState(saved) : null;
    } catch (error) {
      return null;
    }
  }

  function accountStoreKey(userId) {
    return `${ACCOUNT_STORE_PREFIX}${userId}`;
  }

  function backendConfigured() {
    return Boolean(backendConfig?.url && backendConfig?.anonKey);
  }

  function signInRequired() {
    return backendConfigured() && (!session || recoveryMode);
  }

  function isAccountDataView(view) {
    return ["map", "input", "choose", "focus", "reputation"].includes(view);
  }

  function initialView() {
    if (backendConfigured()) {
      return "account";
    }

    if (state.tasks.length) {
      return "focus";
    }

    return hasScreen("map") ? "map" : "input";
  }

  function hasScreen(view) {
    return refs.screens.some((screen) => screen.dataset.screen === view);
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
      supabaseClient.auth.onAuthStateChange(async (event, nextSession) => {
        session = nextSession;
        if (event === "PASSWORD_RECOVERY") {
          recoveryMode = true;
          activeView = "account";
          setSyncStatus("Reset password");
          render();
          return;
        }

        if (session) {
          await syncNow();
          if (!recoveryMode && activeView === "account") {
            activeView = state.tasks.length ? "focus" : "input";
          }
          render();
        } else {
          recoveryMode = false;
          clearLocalAccountData();
          activeView = "account";
          setSyncStatus("Signed out");
          render();
        }
      });

      if (session) {
        if (recoveryMode) {
          activeView = "account";
          setSyncStatus("Reset password");
          render();
        } else {
          await syncNow();
          await processPendingSignal();
          if (pendingSupportDialog) {
            window.setTimeout(() => openSupportDialog(), 120);
          }
          if (activeView === "account") {
            activeView = state.tasks.length ? "focus" : "input";
          }
          render();
        }
      } else {
        activeView = "account";
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
    recoveryMode = false;
    clearRecoveryUrl();
    await syncNow();
    await processPendingSignal();
    if (pendingSupportDialog) {
      window.setTimeout(() => openSupportDialog(), 120);
    }
    activeView = state.tasks.length ? "focus" : "input";
    render();
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
      recoveryMode = false;
      clearRecoveryUrl();
      await syncNow();
      activeView = state.tasks.length ? "focus" : "input";
      render();
    } else {
      setSyncStatus("Check email");
      render();
    }
  }

  async function requestPasswordReset() {
    if (!supabaseClient) {
      setSyncStatus("Try again later");
      return;
    }

    const email = refs.authEmail.value.trim();
    if (!email) {
      setSyncStatus("Enter email");
      refs.authEmail.focus();
      return;
    }

    const redirectTo = passwordResetRedirectUrl();
    setSyncStatus("Sending");
    const { error } = await supabaseClient.auth.resetPasswordForEmail(
      email,
      redirectTo ? { redirectTo } : undefined
    );
    if (error) {
      setSyncStatus(error.message);
      return;
    }

    setSyncStatus("Check email");
    render();
  }

  async function saveNewPassword(event) {
    event.preventDefault();
    if (!supabaseClient || !session) {
      setSyncStatus("Try again later");
      return;
    }

    const password = refs.recoveryPassword.value;
    const confirm = refs.recoveryConfirm.value;

    if (!password) {
      setSyncStatus("Enter password");
      refs.recoveryPassword.focus();
      return;
    }

    if (password !== confirm) {
      setSyncStatus("Passwords don't match");
      refs.recoveryConfirm.focus();
      return;
    }

    setSyncStatus("Saving");
    const { error } = await supabaseClient.auth.updateUser({ password });
    if (error) {
      setSyncStatus(error.message);
      return;
    }

    recoveryMode = false;
    refs.recoveryForm.reset();
    clearRecoveryUrl();
    await syncNow();
    activeView = state.tasks.length ? "focus" : "input";
    setSyncStatus("Password updated");
    render();
  }

  async function signOut() {
    if (!supabaseClient) {
      return;
    }

    await waitForCloudIdle();
    await flushCloudSaveNow();
    await waitForCloudIdle();
    await supabaseClient.auth.signOut();
    recoveryMode = false;
    refs.recoveryForm.reset();
    clearRecoveryUrl();
    session = null;
    clearLocalAccountData();
    activeView = "account";
    setSyncStatus("Signed out");
    render();
  }

  async function syncNow() {
    if (!supabaseClient || !session || cloudBusy) {
      cloudSaveNeeded = Boolean(session) || cloudSaveNeeded;
      return;
    }

    const localBeforePull = localFallbackForSession();
    cloudBusy = true;
    setSyncStatus("Syncing");
    render();

    try {
      await ensureProfile();
      const result = await pullCloudState(localBeforePull);
      cloudLoadedUserId = session.user.id;
      if (result.shouldPush) {
        await pushCloudState();
      }
      saveAccountState();
      setSyncStatus("Synced");
    } catch (error) {
      console.error(error);
      setSyncStatus("Sync error");
    } finally {
      cloudBusy = false;
      render();
      if (cloudSaveNeeded) {
        scheduleCloudSave({ immediate: true });
      }
    }
  }

  function scheduleCloudSave(options = {}) {
    cloudSaveNeeded = true;

    if (!supabaseClient || !session) {
      return;
    }

    if (cloudBusy) {
      return;
    }

    window.clearTimeout(cloudSaveTimer);
    const delay = options.retry ? 5000 : options.immediate ? 0 : 250;
    cloudSaveTimer = window.setTimeout(runQueuedCloudSave, delay);
  }

  async function flushCloudSaveNow() {
    if (!supabaseClient || !session) {
      return;
    }

    cloudSaveNeeded = true;
    window.clearTimeout(cloudSaveTimer);
    await runQueuedCloudSave();
  }

  async function runQueuedCloudSave() {
    if (!supabaseClient || !session || cloudBusy || !cloudSaveNeeded) {
      return;
    }

    cloudBusy = true;
    cloudSaveNeeded = false;
    setSyncStatus("Saving");

    try {
      await ensureProfile();
      await pushCloudState();
      saveAccountState();
      setSyncStatus("Saved");
    } catch (error) {
      cloudSaveNeeded = true;
      console.error(error);
      setSyncStatus("Save error");
    } finally {
      cloudBusy = false;
      render();
      if (cloudSaveNeeded) {
        scheduleCloudSave({ retry: true });
      }
    }
  }

  async function ensureProfile() {
    const user = session.user;
    state.reputation.profileId = user.id;
    const displayName = user.email ? user.email.split("@")[0] : "Do user";

    const { data, error: readError } = await supabaseClient
      .from(TABLES.profiles)
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (readError) {
      throw readError;
    }

    if (data) {
      return;
    }

    const { error } = await supabaseClient.from(TABLES.profiles).insert({
      id: user.id,
      display_name: displayName
    });

    if (error) {
      throw error;
    }
  }

  async function updateCloudProfile(ownerId, payload) {
    const draftPayload = {
      ...payload
    };
    delete draftPayload.objective_map;

    const legacyPayload = {
      display_name: payload.display_name,
      username: payload.username,
      bio: payload.bio,
      avatar_url: payload.avatar_url,
      public_profile: payload.public_profile,
      profile_visibility: payload.profile_visibility,
      proof_visibility: payload.proof_visibility,
      discoverable: payload.discoverable,
      allow_friend_requests: payload.allow_friend_requests,
      reputation_score: payload.reputation_score,
      done_count: payload.done_count,
      proof_count: payload.proof_count,
      support_count: payload.support_count
    };

    let targetPayload =
      cloudSchema.profileDraft === false
        ? legacyPayload
        : cloudSchema.profileObjectives === false
          ? draftPayload
          : payload;
    let { error } = await supabaseClient.from(TABLES.profiles).update(targetPayload).eq("id", ownerId);

    if (error && isMissingColumnError(error) && targetPayload === payload) {
      cloudSchema.profileObjectives = false;
      targetPayload = draftPayload;
      ({ error } = await supabaseClient.from(TABLES.profiles).update(draftPayload).eq("id", ownerId));
    }

    if (error && isMissingColumnError(error) && cloudSchema.profileDraft !== false) {
      cloudSchema.profileDraft = false;
      targetPayload = legacyPayload;
      ({ error } = await supabaseClient.from(TABLES.profiles).update(legacyPayload).eq("id", ownerId));
    } else if (!error) {
      cloudSchema.profileDraft = targetPayload !== legacyPayload;
      cloudSchema.profileObjectives = targetPayload === payload;
    }

    if (error) {
      throw error;
    }
  }

  async function upsertCloudTasks(whyRecords, basicRecords) {
    const levels =
      cloudSchema.taskLevel === "basic"
        ? [{ level: "basic", records: basicRecords }]
        : [
            { level: "why", records: whyRecords },
            { level: "basic", records: basicRecords }
          ];

    for (const option of levels) {
      const { error } = await supabaseClient.from(TABLES.tasks).upsert(option.records, { onConflict: "id" });
      if (!error) {
        cloudSchema.taskLevel = option.level;
        return;
      }

      if (!isMissingColumnError(error) || option.level === "basic") {
        throw error;
      }
    }
  }

  async function fetchCloudProfile(ownerId) {
    const mapSelect =
      "display_name,username,bio,avatar_url,profile_visibility,proof_visibility,discoverable,allow_friend_requests,task_draft,objective_map";
    const draftSelect =
      "display_name,username,bio,avatar_url,profile_visibility,proof_visibility,discoverable,allow_friend_requests,task_draft";
    const legacySelect =
      "display_name,username,bio,avatar_url,profile_visibility,proof_visibility,discoverable,allow_friend_requests";
    let select =
      cloudSchema.profileDraft === false
        ? legacySelect
        : cloudSchema.profileObjectives === false
          ? draftSelect
          : mapSelect;
    let result = await supabaseClient.from(TABLES.profiles).select(select).eq("id", ownerId).single();

    if (result.error && isMissingColumnError(result.error) && select === mapSelect) {
      cloudSchema.profileObjectives = false;
      select = draftSelect;
      result = await supabaseClient.from(TABLES.profiles).select(draftSelect).eq("id", ownerId).single();
    }

    if (result.error && isMissingColumnError(result.error) && cloudSchema.profileDraft !== false) {
      cloudSchema.profileDraft = false;
      select = legacySelect;
      result = await supabaseClient.from(TABLES.profiles).select(legacySelect).eq("id", ownerId).single();
    } else if (!result.error) {
      cloudSchema.profileDraft = select !== legacySelect;
      cloudSchema.profileObjectives = select === mapSelect;
    }

    return {
      ...result,
      hasDraft: select !== legacySelect && !result.error,
      hasObjectives: select === mapSelect && !result.error
    };
  }

  async function fetchCloudTasks(ownerId) {
    const selects =
      cloudSchema.taskLevel === "basic"
        ? [{ level: "basic", select: "id,text,score,wins,losses,seen,done,done_at,created_at" }]
        : [
            { level: "why", select: "id,text,justification,score,wins,losses,seen,done,done_at,created_at" },
            { level: "basic", select: "id,text,score,wins,losses,seen,done,done_at,created_at" }
          ];

    for (const option of selects) {
      const result = await supabaseClient
        .from(TABLES.tasks)
        .select(option.select)
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: true });

      if (!result.error) {
        cloudSchema.taskLevel = option.level;
        return {
          ...result,
          hasJustification: option.level !== "basic"
        };
      }

      if (!isMissingColumnError(result.error) || option.level === "basic") {
        return {
          ...result,
          hasJustification: option.level !== "basic"
        };
      }
    }

    return { data: [], error: null, hasJustification: false };
  }

  async function pushCloudState() {
    const ownerId = session.user.id;
    const stats = reputationStats();
    const profile = state.reputation.profile;

    await updateCloudProfile(ownerId, {
      display_name: profile.displayName || session.user.email?.split("@")[0] || "Do user",
      username: profile.username || null,
      bio: profile.bio || "",
      avatar_url: profile.avatarUrl || "",
      public_profile: profile.profileVisibility === "public",
      profile_visibility: profile.profileVisibility,
      proof_visibility: profile.proofVisibility,
      discoverable: profile.discoverable,
      allow_friend_requests: profile.allowFriendRequests,
      reputation_score: stats.score,
      done_count: stats.done,
      proof_count: stats.proofs,
      support_count: stats.supporters,
      task_draft: state.draftText || "",
      objective_map: normalizeObjectives(state.objectives)
    });

    if (state.tasks.length) {
      await upsertCloudTasks(
        state.tasks.map((task) => taskRecord(task, ownerId)),
        state.tasks.map((task) => basicTaskRecord(task, ownerId))
      );
    }

    if (cloudLoadedUserId === ownerId) {
      await deleteMissingRows(TABLES.tasks, "owner_id", ownerId, state.tasks.map((task) => task.id));
    }

    if (state.reputation.proofs.length) {
      const { error } = await supabaseClient.from(TABLES.proofs).upsert(
        state.reputation.proofs.map((proof) => proofRecord(proof, ownerId)),
        { onConflict: "id" }
      );

      if (error) {
        throw error;
      }
    }

    if (cloudLoadedUserId === ownerId) {
      await deleteMissingRows(TABLES.proofs, "owner_id", ownerId, state.reputation.proofs.map((proof) => proof.id));
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

  async function pullCloudState(localFallback) {
    const ownerId = session.user.id;
    const [profileResult, tasksResult, proofsResult, signalsResult] = await Promise.all([
      fetchCloudProfile(ownerId),
      fetchCloudTasks(ownerId),
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

    if (profileResult.error) throw profileResult.error;
    if (tasksResult.error) throw tasksResult.error;
    if (proofsResult.error) throw proofsResult.error;
    if (signalsResult.error) throw signalsResult.error;

    const localTaskMap = new Map((localFallback?.tasks || []).map((task) => [task.id, task]));
    const cloudTasks = tasksResult.data.map((task) => {
      const localTask = localTaskMap.get(task.id);
      return {
        id: task.id,
        text: task.text,
        justification: tasksResult.hasJustification ? task.justification || "" : localTask?.justification || "",
        score: Number(task.score) || 1000,
        wins: Number(task.wins) || 0,
        losses: Number(task.losses) || 0,
        seen: Number(task.seen) || 0,
        done: Boolean(task.done),
        doneAt: task.done_at ? Date.parse(task.done_at) : null,
        createdAt: task.created_at ? Date.parse(task.created_at) : Date.now()
      };
    });
    const cloudProfile = normalizeProfile({
      displayName: profileResult.data.display_name || "",
      username: profileResult.data.username || "",
      bio: profileResult.data.bio || "",
      avatarUrl: profileResult.data.avatar_url || "",
      profileVisibility: profileResult.data.profile_visibility || "public",
      proofVisibility: profileResult.data.proof_visibility || "public",
      discoverable: profileResult.data.discoverable !== false,
      allowFriendRequests: profileResult.data.allow_friend_requests !== false
    });
    const cloudDraft = profileResult.hasDraft && typeof profileResult.data.task_draft === "string"
      ? profileResult.data.task_draft
      : "";
    const cloudObjectives = profileResult.hasObjectives
      ? normalizeObjectives(profileResult.data.objective_map)
      : normalizeObjectives(localFallback?.objectives);
    const cloudProofs = proofsResult.data.map((proof) => ({
      id: proof.id,
      taskId: proof.task_id || "",
      taskText: proof.task_text,
      evidence: proof.evidence,
      createdAt: proof.created_at ? Date.parse(proof.created_at) : Date.now()
    }));
    const cloudSupporters = signalsResult.data.map((signal) => ({
      id: signal.id,
      profileId: signal.profile_id,
      name: signal.supporter_name,
      type: signal.signal_type,
      note: signal.note || "",
      createdAt: signal.created_at ? Date.parse(signal.created_at) : Date.now()
    }));

    const localTasks = Array.isArray(localFallback?.tasks) ? localFallback.tasks : [];
    const localObjectives = normalizeObjectives(localFallback?.objectives);
    const localProofs = localFallback?.reputation?.proofs || [];
    const localSupporters = localFallback?.reputation?.supporters || [];
    const mergedTasks = mergeTaskLists(cloudTasks, localTasks);
    const mergedObjectives = mergeObjectiveMaps(cloudObjectives, localObjectives);
    const mergedProofs = mergeById(cloudProofs, localProofs);
    const mergedSupporters = mergeById(cloudSupporters, localSupporters);
    const localAddedTasks = mergedTasks.length > cloudTasks.length;
    const localAddedObjectives = mergedObjectives.length > cloudObjectives.length;
    const localAddedProofs = mergedProofs.length > cloudProofs.length;
    const localAddedSupporters = mergedSupporters.length > cloudSupporters.length;
    const shouldKeepLocal = !cloudTasks.length && localTasks.length > 0;

    if (shouldKeepLocal) {
      state = {
        ...localFallback,
        tasks: mergedTasks,
        objectives: mergedObjectives,
        draftText: localFallback.draftText || cloudDraft || mergedTasks.map((task) => task.text).join("\n"),
        reputation: {
          profileId: ownerId,
          profile: mergeProfiles(localFallback.reputation?.profile, cloudProfile),
          proofs: mergedProofs,
          supporters: mergedSupporters
        }
      };
    } else {
      state.tasks = mergedTasks;
      state.objectives = mergedObjectives;
      state.draftText = localFallback?.draftText || cloudDraft || mergedTasks.map((task) => task.text).join("\n");
      state.reputation.profileId = ownerId;
      state.reputation.profile = mergeProfiles(localFallback?.reputation?.profile, cloudProfile);
      state.reputation.proofs = mergedProofs;
      state.reputation.supporters = mergedSupporters;
    }

    state.currentPair = null;
    lastSyncedInput = state.draftText || state.tasks.map((task) => task.text).join("\n");
    saveStateLocalOnly();

    return {
      shouldPush:
        shouldKeepLocal ||
        localAddedTasks ||
        localAddedObjectives ||
        localAddedProofs ||
        localAddedSupporters ||
        Boolean(localFallback?.draftText && localFallback.draftText !== cloudDraft)
    };
  }

  async function deleteMissingRows(table, ownerColumn, ownerId, keepIds) {
    const keep = new Set(keepIds);
    const { data, error } = await supabaseClient.from(table).select("id").eq(ownerColumn, ownerId);

    if (error) {
      throw error;
    }

    const staleIds = data.map((row) => row.id).filter((id) => !keep.has(id));
    if (!staleIds.length) {
      return;
    }

    const { error: deleteError } = await supabaseClient
      .from(table)
      .delete()
      .eq(ownerColumn, ownerId)
      .in("id", staleIds);

    if (deleteError) {
      throw deleteError;
    }
  }

  function taskRecord(task, ownerId) {
    return {
      id: task.id,
      owner_id: ownerId,
      text: task.text,
      justification: task.justification || "",
      score: task.score,
      wins: task.wins,
      losses: task.losses,
      seen: task.seen,
      done: task.done,
      done_at: toIso(task.doneAt),
      created_at: toIso(task.createdAt)
    };
  }

  function basicTaskRecord(task, ownerId) {
    return {
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
    };
  }

  function proofRecord(proof, ownerId) {
    return {
      id: proof.id,
      owner_id: ownerId,
      task_id: findTask(proof.taskId) ? proof.taskId : null,
      task_text: proof.taskText,
      evidence: proof.evidence,
      created_at: toIso(proof.createdAt)
    };
  }

  function cloneState(source) {
    return JSON.parse(JSON.stringify(source));
  }

  function localFallbackForSession() {
    const current = cloneState(state);
    const cached = loadAccountState(session?.user?.id);

    if (!cached) {
      return current;
    }

    return mergeLocalStates(current, cached);
  }

  function mergeLocalStates(primary, secondary) {
    const result = {
      ...primary,
      draftText: primary?.draftText || secondary?.draftText || "",
      tasks: mergeTaskLists(primary?.tasks || [], secondary?.tasks || []),
      objectives: mergeObjectiveMaps(primary?.objectives || [], secondary?.objectives || []),
      reputation: {
        profileId: primary?.reputation?.profileId || secondary?.reputation?.profileId || makeId(),
        profile: mergeProfiles(secondary?.reputation?.profile, primary?.reputation?.profile),
        proofs: mergeById(primary?.reputation?.proofs || [], secondary?.reputation?.proofs || []),
        supporters: mergeById(primary?.reputation?.supporters || [], secondary?.reputation?.supporters || [])
      }
    };

    return result.tasks.length || !primary?.tasks?.length ? result : primary;
  }

  function mergeTaskLists(primaryTasks, secondaryTasks) {
    const merged = [];
    const byId = new Map();
    const byText = new Map();

    [...primaryTasks, ...secondaryTasks].forEach((task) => {
      if (!task?.text) {
        return;
      }

      const textKey = task.text.trim().toLowerCase();
      const existing = (task.id && byId.get(task.id)) || byText.get(textKey);

      if (existing) {
        combineTasks(existing, task);
        if (task.id) {
          byId.set(task.id, existing);
        }
        byText.set(textKey, existing);
        return;
      }

      const copy = {
        id: task.id || makeId(),
        text: task.text.trim(),
        justification: task.justification || "",
        score: Number.isFinite(task.score) ? task.score : 1000,
        wins: Number(task.wins) || 0,
        losses: Number(task.losses) || 0,
        seen: Number(task.seen) || 0,
        done: Boolean(task.done),
        doneAt: Number(task.doneAt) || null,
        createdAt: Number(task.createdAt) || Date.now()
      };

      merged.push(copy);
      byId.set(copy.id, copy);
      byText.set(textKey, copy);
    });

    return merged.sort((a, b) => a.createdAt - b.createdAt);
  }

  function mergeObjectiveMaps(primaryObjectives, secondaryObjectives) {
    const merged = [];
    const byId = new Map();
    const byKey = new Map();

    [...normalizeObjectives(primaryObjectives), ...normalizeObjectives(secondaryObjectives)].forEach((node) => {
      const key = `${node.parentId || ""}:${node.text.toLowerCase()}`;
      const existing = byId.get(node.id) || byKey.get(key);

      if (existing) {
        existing.kind = existing.kind === "task" || node.kind === "task" ? "task" : "objective";
        existing.taskId = existing.taskId || node.taskId;
        existing.createdAt = Math.min(existing.createdAt, node.createdAt);
        return;
      }

      const copy = { ...node };
      merged.push(copy);
      byId.set(copy.id, copy);
      byKey.set(key, copy);
    });

    return normalizeObjectives(merged).sort((a, b) => a.createdAt - b.createdAt);
  }

  function combineTasks(target, source) {
    target.text = target.text || source.text;
    target.justification = target.justification || source.justification || "";
    target.score = Math.max(Number(target.score) || 1000, Number(source.score) || 1000);
    target.wins = Math.max(Number(target.wins) || 0, Number(source.wins) || 0);
    target.losses = Math.max(Number(target.losses) || 0, Number(source.losses) || 0);
    target.seen = Math.max(Number(target.seen) || 0, Number(source.seen) || 0);
    target.done = Boolean(target.done || source.done);
    target.doneAt = Math.max(Number(target.doneAt) || 0, Number(source.doneAt) || 0) || null;
    target.createdAt = Math.min(Number(target.createdAt) || Date.now(), Number(source.createdAt) || Date.now());
  }

  function mergeProfiles(localProfile, cloudProfile) {
    const local = normalizeProfile(localProfile);
    const cloud = normalizeProfile(cloudProfile);

    return {
      ...cloud,
      displayName: local.displayName || cloud.displayName,
      username: local.username || cloud.username,
      bio: local.bio || cloud.bio,
      avatarUrl: local.avatarUrl || cloud.avatarUrl
    };
  }

  function mergeById(first, second) {
    return [...first, ...second].reduce((items, item) => {
      if (!item?.id || items.some((existing) => existing.id === item.id)) {
        return items;
      }

      return [...items, item];
    }, []);
  }

  function hasJustification(task) {
    return Boolean(task?.justification && task.justification.trim());
  }

  function hasTaskContext(task) {
    return hasJustification(task);
  }

  function setSyncStatus(message) {
    const accountMessage = accountStatus(message);
    refs.syncStatus.textContent = accountMessage;
    refs.accountNote.textContent = accountMessage;
    const profileMessages = [
      "Invite copied",
      "Invite sent",
      "Link copied",
      "Friend added",
      "Sent",
      "Can't send",
      "Try again later",
      "Sync error",
      "Save error",
      "Different account"
    ];

    if (profileMessages.includes(message)) {
      setProfileStatus(accountStatus(message));
    }
  }

  function setView(nextView) {
    if (!hasScreen(nextView)) {
      nextView = hasScreen("map") ? "map" : "input";
    }

    if (signInRequired() && isAccountDataView(nextView)) {
      activeView = "account";
      render();
      return;
    }

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
    if (!hasScreen(activeView)) {
      activeView = initialView();
    }

    if (signInRequired() && isAccountDataView(activeView)) {
      activeView = "account";
    }

    refs.screens.forEach((screen) => {
      const isActive = screen.dataset.screen === activeView;
      screen.classList.toggle("is-active", isActive);
    });

    refs.viewButtons.forEach((button) => {
      const view = button.dataset.viewButton;
      const hideForAuth = signInRequired() && isAccountDataView(view) && button.closest(".nav");
      button.classList.toggle("is-hidden", hideForAuth);
      button.setAttribute("aria-current", button.dataset.viewButton === activeView ? "page" : "false");
    });

    renderMap();
    renderInput();
    renderChoose();
    renderFocus();
    renderReputation();
    renderPublic();
    renderAccount();
  }

  function renderMap() {
    if (!refs.objectiveCount || !refs.objectiveStatus || !refs.objectivePrioritizeBtn || !refs.objectiveTree) {
      return;
    }

    const roots = objectiveChildren("");
    const linkedTasks = state.objectives.filter((node) => node.taskId && findTask(node.taskId)).length;

    refs.objectiveCount.textContent = `${state.objectives.length} item${state.objectives.length === 1 ? "" : "s"}`;
    refs.objectiveStatus.textContent = linkedTasks ? `${linkedTasks} task${linkedTasks === 1 ? "" : "s"} linked` : "";
    refs.objectivePrioritizeBtn.disabled = activeTasks().length < 2;
    refs.objectiveTree.innerHTML = "";

    if (!roots.length) {
      const empty = document.createElement("li");
      empty.className = "empty";
      empty.textContent = "Add your first objective";
      refs.objectiveTree.appendChild(empty);
      return;
    }

    if (!findObjective(selectedObjectiveId)) {
      selectedObjectiveId = roots[0]?.id || null;
    }

    roots.forEach((node) => {
      refs.objectiveTree.appendChild(createObjectiveItem(node, 0));
    });
  }

  function createObjectiveItem(node, depth) {
    const isLinkedTask = Boolean(node.taskId && findTask(node.taskId));
    const item = document.createElement("li");
    item.className = "objective-item";
    item.classList.toggle("is-task-item", isLinkedTask);
    item.classList.toggle("is-selected", selectedObjectiveId === node.id);
    item.style.animationDelay = `${Math.min(depth, 7) * 24}ms`;
    item.style.setProperty("--depth", depth);

    const row = document.createElement("div");
    row.className = "objective-node";

    const pick = document.createElement("button");
    pick.className = `objective-pick${isLinkedTask ? " is-task" : ""}`;
    pick.type = "button";
    pick.dataset.action = "select";
    pick.dataset.id = node.id;
    pick.setAttribute("aria-current", selectedObjectiveId === node.id ? "true" : "false");

    const marker = document.createElement("span");
    marker.className = "objective-marker";
    marker.setAttribute("aria-hidden", "true");

    const main = document.createElement("span");
    main.className = "objective-main";

    const title = document.createElement("span");
    title.className = "objective-title";
    title.textContent = node.text;

    const meta = document.createElement("span");
    meta.className = "objective-meta";
    meta.textContent = objectiveMeta(node);

    main.append(title, meta);

    const state = document.createElement("span");
    state.className = "objective-state";
    state.textContent = isLinkedTask ? "Task" : "";

    pick.append(marker, main, state);
    row.appendChild(pick);
    item.appendChild(row);

    if (selectedObjectiveId === node.id || isLinkedTask) {
      item.appendChild(createObjectiveActions(node));
    }

    if (objectiveDraftParentId === node.id) {
      item.appendChild(createObjectiveDraftForm(node.id));
    }

    const children = objectiveChildren(node.id);
    if (children.length) {
      const childList = document.createElement("ul");
      childList.className = "objective-list";
      children.forEach((child) => {
        childList.appendChild(createObjectiveItem(child, depth + 1));
      });
      item.appendChild(childList);
    }

    return item;
  }

  function createObjectiveActions(node) {
    const children = objectiveChildren(node.id);
    const isLinked = Boolean(node.taskId && findTask(node.taskId));
    const actions = document.createElement("div");
    actions.className = `objective-branch-actions${isLinked ? " is-task-actions" : ""}`;

    if (!isLinked) {
      const addButton = document.createElement("button");
      addButton.className = "objective-action";
      addButton.type = "button";
      addButton.dataset.action = "add-child";
      addButton.dataset.id = node.id;
      addButton.textContent = "Add step";
      actions.appendChild(addButton);
    }

    if (!isLinked && !children.length) {
      const taskButton = document.createElement("button");
      taskButton.className = "objective-action";
      taskButton.type = "button";
      taskButton.dataset.action = "make-task";
      taskButton.dataset.id = node.id;
      taskButton.textContent = "Mark task";
      actions.appendChild(taskButton);
    }

    const deleteButton = document.createElement("button");
    deleteButton.className = "objective-action is-danger";
    deleteButton.type = "button";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.id = node.id;
    deleteButton.textContent = "Delete";

    actions.appendChild(deleteButton);
    return actions;
  }

  function createObjectiveDraftForm(parentId) {
    const form = document.createElement("form");
    form.className = "objective-child-form";
    form.dataset.parentId = parentId;

    const input = document.createElement("input");
    input.id = "objectiveDraftInput";
    input.type = "text";
    input.autocomplete = "off";
    input.placeholder = "Step or task";

    const add = document.createElement("button");
    add.className = "primary";
    add.type = "submit";
    add.textContent = "Add step";

    const cancel = document.createElement("button");
    cancel.className = "subtle";
    cancel.type = "button";
    cancel.dataset.action = "cancel-child";
    cancel.textContent = "Cancel";

    form.append(input, add, cancel);
    return form;
  }

  function renderInput() {
    const text = state.draftText || state.tasks.map((task) => task.text).join("\n");
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

    refs.keepChoosing.textContent = "Choose";
    refs.keepChoosing.disabled = activeTasks().length < 2;
    refs.resetRank.classList.remove("is-hidden");
  }

  function objectiveChildren(parentId) {
    return state.objectives
      .filter((node) => (node.parentId || "") === (parentId || ""))
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  function objectiveMeta(node) {
    const childCount = objectiveChildren(node.id).length;
    const task = node.taskId ? findTask(node.taskId) : null;

    if (task) {
      if (task.done) {
        return "Done";
      }

      const rank = taskRank(task.id);
      return rank ? `Priority #${rank}` : "Task";
    }

    if (node.kind === "task") {
      return "Task";
    }

    return childCount ? `${childCount} step${childCount === 1 ? "" : "s"}` : "Step";
  }

  function addRootObjective(event) {
    event.preventDefault();
    const text = refs.objectiveRootInput.value.trim();
    if (!text) {
      return;
    }

    addObjective(text, "");
    refs.objectiveRootInput.value = "";
  }

  function submitObjectiveChild(event) {
    const form = event.target.closest(".objective-child-form");
    if (!form) {
      return;
    }

    event.preventDefault();
    const input = form.querySelector("input");
    const text = input.value.trim();
    if (!text) {
      input.focus();
      return;
    }

    addObjective(text, form.dataset.parentId || "");
  }

  function handleObjectiveKeydown(event) {
    if (event.key !== "Escape" || !event.target.closest(".objective-child-form")) {
      return;
    }

    objectiveDraftParentId = null;
    render();
  }

  function handleObjectiveAction(event) {
    const button = event.target.closest("[data-action]");
    if (!button) {
      return;
    }

    const action = button.dataset.action;
    if (action === "select") {
      selectedObjectiveId = button.dataset.id || null;
      render();
      return;
    }

    if (action === "cancel-child") {
      objectiveDraftParentId = null;
      render();
      return;
    }

    const node = findObjective(button.dataset.id);
    if (!node) {
      return;
    }

    if (action === "add-child") {
      selectedObjectiveId = node.id;
      objectiveDraftParentId = node.id;
      render();
      window.setTimeout(() => document.getElementById("objectiveDraftInput")?.focus(), 0);
      return;
    }

    if (action === "make-task") {
      ensureTaskForObjective(node.id);
      return;
    }

    if (action === "delete") {
      deleteObjective(node.id);
    }
  }

  function addObjective(text, parentId) {
    const id = makeId();
    state.objectives.push({
      id,
      parentId: parentId || "",
      text: text.replace(/\s+/g, " ").trim(),
      kind: "objective",
      taskId: "",
      createdAt: Date.now() + Math.random()
    });
    selectedObjectiveId = id;
    objectiveDraftParentId = null;
    saveState({ immediate: true });
    render();
  }

  function deleteObjective(id) {
    const deleted = findObjective(id);
    const removeIds = new Set([id]);
    let changed = true;

    while (changed) {
      changed = false;
      state.objectives.forEach((node) => {
        if (!removeIds.has(node.id) && removeIds.has(node.parentId)) {
          removeIds.add(node.id);
          changed = true;
        }
      });
    }

    state.objectives = state.objectives.filter((node) => !removeIds.has(node.id));
    if (removeIds.has(objectiveDraftParentId)) {
      objectiveDraftParentId = null;
    }
    if (removeIds.has(selectedObjectiveId)) {
      selectedObjectiveId = deleted?.parentId || state.objectives[0]?.id || null;
    }

    saveState({ immediate: true });
    render();
  }

  function ensureTaskForObjective(objectiveId) {
    const node = findObjective(objectiveId);
    if (!node) {
      return null;
    }

    let task = node.taskId ? findTask(node.taskId) : null;
    if (!task) {
      task = state.tasks.find((item) => item.text.trim().toLowerCase() === node.text.toLowerCase());
    }

    if (!task) {
      task = {
        id: makeId(),
        text: node.text,
        justification: objectivePath(objectiveId).join(" / "),
        score: 1000,
        wins: 0,
        losses: 0,
        seen: 0,
        done: false,
        doneAt: null,
        createdAt: Date.now() + Math.random()
      };
      state.tasks.push(task);
    }

    node.kind = "task";
    node.taskId = task.id;
    selectedObjectiveId = node.id;
    syncDraftFromTasks();
    state.currentPair = null;
    ensurePair();
    saveState({ immediate: true });
    render();
    return task;
  }

  function syncDraftFromTasks() {
    state.draftText = state.tasks.map((task) => task.text).join("\n");
    lastSyncedInput = state.draftText;
    if (document.activeElement !== refs.taskInput) {
      refs.taskInput.value = state.draftText;
    }
  }

  function findObjective(id) {
    return state.objectives.find((node) => node.id === id);
  }

  function objectivePath(objectiveId) {
    const byId = new Map(state.objectives.map((node) => [node.id, node]));
    const path = [];
    const seen = new Set();
    let node = byId.get(objectiveId);

    while (node && !seen.has(node.id)) {
      path.unshift(node.text);
      seen.add(node.id);
      node = byId.get(node.parentId);
    }

    return path;
  }

  function objectivePathForTask(taskId) {
    const node = state.objectives.find((item) => item.taskId === taskId);
    return node ? objectivePath(node.id).slice(0, -1).join(" / ") : "";
  }

  function taskRank(taskId) {
    const index = rankedTasks().findIndex((task) => task.id === taskId);
    return index >= 0 ? index + 1 : null;
  }

  function renderReputation() {
    const stats = reputationStats();
    const profile = state.reputation.profile;
    const name = profile.displayName || session?.user?.email?.split("@")[0] || "Your profile";
    const handle = profile.username || fallbackUsername(name);

    refs.profileDisplayName.textContent = name;
    refs.profileHandle.textContent = `@${handle}`;
    refs.profileBio.textContent = profile.bio || "";
    renderAvatar(refs.profileAvatar, name, profile.avatarUrl);
    refs.repScore.textContent = String(stats.score);
    refs.doneMetric.textContent = String(stats.done);
    refs.supportMetric.textContent = String(stats.supporters);
    refs.proofCount.textContent = String(stats.proofs);
    refs.profileVisibility.value = profile.profileVisibility;
    refs.proofVisibility.value = profile.proofVisibility;
    refs.discoverableToggle.checked = profile.discoverable;
    refs.friendRequestsToggle.checked = profile.allowFriendRequests;
    refs.profileSignOutBtn.classList.toggle("is-hidden", !session);

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
    const name = snapshot.displayName || "Do user";
    refs.publicDisplayName.textContent = name;
    refs.publicHandle.textContent = `@${snapshot.username || fallbackUsername(name)}`;
    refs.publicBio.textContent = snapshot.bio || "";
    renderAvatar(refs.publicAvatar, name, snapshot.avatarUrl || "");
    refs.publicScore.textContent = String(snapshot.score);
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

    refs.accountName.textContent = recoveryMode ? "New password" : signedIn ? email : "Sign in";
    refs.authForm.classList.toggle("is-hidden", signedIn || recoveryMode);
    refs.recoveryForm.classList.toggle("is-hidden", !recoveryMode);
    refs.accountActions.classList.toggle("is-hidden", !signedIn || recoveryMode);
    refs.signOutBtn.disabled = !signedIn;
    refs.signInBtn.disabled = !supabaseClient || cloudBusy;
    refs.signUpBtn.disabled = !supabaseClient || cloudBusy;
    refs.forgotPasswordBtn.disabled = !supabaseClient || cloudBusy;
    refs.savePasswordBtn.disabled = !supabaseClient || cloudBusy;
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
    tag.textContent = friendActionLabel(signal.type);

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

    const main = document.createElement("span");
    main.className = "task-main";

    const textNode = document.createElement("span");
    textNode.className = "task-text";
    textNode.textContent = task.text;

    const pathText = objectivePathForTask(task.id);
    if (pathText) {
      const pathNode = document.createElement("span");
      pathNode.className = "task-path";
      pathNode.textContent = pathText;
      main.append(textNode, pathNode);
    } else {
      main.appendChild(textNode);
    }

    const actions = document.createElement("span");
    actions.className = "task-actions";

    const whyButton = document.createElement("button");
    whyButton.className = `row-meta${hasTaskContext(task) ? " is-set" : ""}`;
    whyButton.type = "button";
    whyButton.dataset.action = "why";
    whyButton.dataset.id = task.id;
    whyButton.textContent = "Why";

    const button = document.createElement("button");
    button.className = "row-action";
    button.type = "button";
    button.dataset.action = action;
    button.dataset.id = task.id;
    button.textContent = action === "restore" ? "Undo" : "Done";

    actions.append(whyButton, button);
    item.append(rankNode, main, actions);
    return item;
  }

  function updateDraftCount() {
    const count = parseTasks(refs.taskInput.value).length;
    refs.draftCount.textContent = String(count);
    refs.startBtn.disabled = count === 0;
  }

  function saveDraftInput() {
    state.draftText = refs.taskInput.value;
    updateDraftCount();
    saveState();
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
        justification: "",
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
    state.draftText = state.tasks.map((task) => task.text).join("\n");
    lastSyncedInput = state.draftText;

    if (activeTasks().length > 1 && preferredView !== "focus") {
      startSprint();
      activeView = "choose";
    } else {
      activeView = "focus";
    }

    saveState({ immediate: true });
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

    if (button.dataset.action === "why") {
      openWhyDialog(task);
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

  function openWhyDialog(task) {
    whyTaskId = task.id;
    refs.whyTask.textContent = task.text;
    refs.whyInput.value = task.justification || "";

    if (typeof refs.whyDialog.showModal === "function") {
      refs.whyDialog.showModal();
      refs.whyInput.focus();
    }
  }

  function closeWhyDialog() {
    whyTaskId = null;
    if (refs.whyDialog.open) {
      refs.whyDialog.close();
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

    setProfileStatus("Proof saved");
    closeProofDialog();
    saveState();
    render();
  }

  function saveWhy(event) {
    event.preventDefault();

    const task = findTask(whyTaskId);
    if (!task) {
      closeWhyDialog();
      return;
    }

    task.justification = refs.whyInput.value.trim();
    closeWhyDialog();
    saveState();
    render();
  }

  function openSupportDialog() {
    refs.supportName.value = activeInviteProfileId
      ? state.reputation.profile.displayName || session?.user?.email?.split("@")[0] || ""
      : "";
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

  function openProfileDialog() {
    const profile = state.reputation.profile;
    refs.profileNameInput.value = profile.displayName || session?.user?.email?.split("@")[0] || "";
    refs.profileUsernameInput.value = profile.username || "";
    refs.profileAvatarInput.value = profile.avatarUrl || "";
    refs.profileBioInput.value = profile.bio || "";

    if (typeof refs.profileDialog.showModal === "function") {
      refs.profileDialog.showModal();
      refs.profileNameInput.focus();
    }
  }

  function closeProfileDialog() {
    if (refs.profileDialog.open) {
      refs.profileDialog.close();
    }
  }

  function saveProfile(event) {
    event.preventDefault();

    state.reputation.profile = {
      ...state.reputation.profile,
      displayName: refs.profileNameInput.value.trim(),
      username: normalizeUsername(refs.profileUsernameInput.value),
      avatarUrl: refs.profileAvatarInput.value.trim(),
      bio: refs.profileBioInput.value.trim()
    };

    closeProfileDialog();
    saveState();
    render();
  }

  function savePrivacySettings() {
    state.reputation.profile = {
      ...state.reputation.profile,
      profileVisibility: refs.profileVisibility.value,
      proofVisibility: refs.proofVisibility.value,
      discoverable: refs.discoverableToggle.checked,
      allowFriendRequests: refs.friendRequestsToggle.checked
    };

    saveState();
    render();
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

        setSyncStatus("Sent");
        closeSupportDialog();
        render();
        return;
      } catch (error) {
        console.error(error);
        setSyncStatus("Can't send");
        closeSupportDialog();
        render();
        return;
      }
    }

    if (!activeInviteProfileId || activeInviteProfileId === state.reputation.profileId) {
      addSupportSignal(signal);
      saveState();
    }

    lastSignalUrl = signalUrl(signal);
    copyText(lastSignalUrl, "Invite copied");
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
    setProfileStatus("Friend added");
  }

  async function copyInviteLink() {
    const url = inviteUrl();

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Do",
          text: "Help me stay on track.",
          url
        });
        setSyncStatus("Invite sent");
        return;
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }
      }
    }

    copyText(url, "Invite copied");
  }

  function showPublicProfile() {
    if (session) {
      pendingPublicProfileId = session.user.id;
      publicSnapshot = publicSnapshotFromState();
      copyText(profileUrl(session.user.id), "Link copied");
      loadPublicProfile(session.user.id);
      activeView = "public";
      render();
      return;
    }

    publicSnapshot = publicSnapshotFromState();
    copyText(publicUrl(publicSnapshot), "Link copied");
    activeView = "public";
    render();
  }

  function copyLatestSignal() {
    copyInviteLink();
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
        return total + 2;
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
    const profile = state.reputation.profile;
    const profileIsPublic = profile.profileVisibility === "public";
    const proofIsPublic = profile.proofVisibility === "public";
    const items =
      profileIsPublic && proofIsPublic
        ? [...state.reputation.proofs]
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 8)
            .map((proof) => ({
              taskText: proof.taskText,
              evidence: proof.evidence,
              date: formatDate(proof.createdAt)
            }))
        : [];

    return {
      type: "public-profile",
      displayName: profileIsPublic
        ? profile.displayName || session?.user?.email?.split("@")[0] || "Do user"
        : "Private profile",
      username: profileIsPublic ? profile.username || "" : "",
      bio: profileIsPublic ? profile.bio || "" : "",
      avatarUrl: profileIsPublic ? profile.avatarUrl || "" : "",
      score: profileIsPublic ? stats.score : 0,
      done: profileIsPublic ? stats.done : 0,
      proofs: profileIsPublic && proofIsPublic ? stats.proofs : 0,
      supporters: profileIsPublic ? stats.supporters : 0,
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
        displayName: typeof payload.displayName === "string" ? payload.displayName : "Do user",
        username: typeof payload.username === "string" ? payload.username : "",
        bio: typeof payload.bio === "string" ? payload.bio : "",
        avatarUrl: typeof payload.avatarUrl === "string" ? payload.avatarUrl : "",
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
        displayName: "Profile unavailable",
        username: "",
        bio: "",
        avatarUrl: "",
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
        setProfileStatus("Friend added");
        history.replaceState(null, "", window.location.href.split("#")[0]);
      } else if (supabaseClient && !session) {
        pendingSignal = payload.signal;
        setSyncStatus("Sign in");
      } else {
        setProfileStatus("Different account");
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
          .select("display_name,username,bio,avatar_url,reputation_score,done_count,proof_count,support_count,profile_visibility,proof_visibility")
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
        displayName: profileResult.data.display_name || "Do user",
        username: profileResult.data.username || "",
        bio: profileResult.data.bio || "",
        avatarUrl: profileResult.data.avatar_url || "",
        score: Number(profileResult.data.reputation_score) || 0,
        done: Number(profileResult.data.done_count) || 0,
        proofs:
          proofsResult.data.length ||
          (profileResult.data.proof_visibility === "public" ? Number(profileResult.data.proof_count) || 0 : 0),
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
        displayName: "Private profile",
        username: "",
        bio: "",
        avatarUrl: "",
        score: 0,
        done: 0,
        proofs: 0,
        supporters: 0,
        items: []
      };
      render();
    }
  }

  async function processPendingSignal() {
    if (!pendingSignal || !session) {
      return;
    }

    if (pendingSignal.profileId !== session.user.id) {
      setSyncStatus("Different account");
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

  function passwordResetRedirectUrl() {
    try {
      const url = new URL(baseUrl());
      if (!["http:", "https:"].includes(url.protocol)) {
        return "";
      }

      return url.toString();
    } catch (error) {
      return "";
    }
  }

  function hasRecoveryLink() {
    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.slice(1));
    return search.get("type") === "recovery" || hash.get("type") === "recovery";
  }

  function clearRecoveryUrl() {
    if (!window.location.hash) {
      return;
    }

    const url = new URL(window.location.href);
    url.hash = "";
    history.replaceState(null, "", url.toString());
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

    setProfileStatus(status);
  }

  function setProfileStatus(message) {
    if (refs.repStatus) {
      refs.repStatus.textContent = message;
    }
  }

  function accountStatus(message) {
    const quiet = new Set(["Local", "Ready", "Signed out", "Syncing", "Synced", "Saving", "Saved"]);
    const replacements = {
      "Sync error": "Couldn't load",
      "Save error": "Couldn't save"
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
    state.draftText = state.tasks.map((task) => task.text).join("\n");
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

    state = {
      ...freshState(),
      reputation: {
        profileId: state.reputation.profileId,
        profile: normalizeProfile(state.reputation.profile),
        proofs: [],
        supporters: state.reputation.supporters.slice()
      }
    };
    objectiveDraftParentId = null;
    selectedObjectiveId = null;
    activeView = "map";
    lastSyncedInput = "";
    refs.taskInput.value = "";
    saveState();
    render();
  }

  function clearLocalAccountData() {
    state = freshState();
    cloudLoadedUserId = null;
    cloudSaveNeeded = false;
    window.clearTimeout(cloudSaveTimer);
    publicSnapshot = null;
    pendingPublicProfileId = null;
    pendingSignal = null;
    activeInviteProfileId = null;
    pendingSupportDialog = false;
    objectiveDraftParentId = null;
    selectedObjectiveId = null;
    lastSignalUrl = "";
    lastSyncedInput = "";
    refs.recoveryForm.reset();
    refs.taskInput.value = "";
    localStorage.removeItem(STORE_KEY);
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

  function isMissingColumnError(error) {
    const message = [error?.message, error?.details, error?.hint, error?.code].filter(Boolean).join(" ").toLowerCase();
    return (
      message.includes("could not find the") ||
      message.includes("schema cache") ||
      message.includes("pgrst204") ||
      message.includes("42703") ||
      (message.includes("column") && message.includes("does not exist"))
    );
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

  function normalizeUsername(value) {
    if (typeof value !== "string") {
      return "";
    }

    return value
      .toLowerCase()
      .replace(/^@/, "")
      .replace(/[^a-z0-9._-]/g, "")
      .slice(0, 24);
  }

  function fallbackUsername(name) {
    return normalizeUsername(name) || "do";
  }

  function renderAvatar(node, name, avatarUrl) {
    node.textContent = initials(name);
    node.style.backgroundImage = "";

    if (isUrl(avatarUrl)) {
      node.textContent = "";
      node.style.backgroundImage = `url("${avatarUrl.replace(/"/g, "%22")}")`;
    }
  }

  function initials(name) {
    const parts = String(name || "Do")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    return (parts[0]?.[0] || "D").toUpperCase();
  }

  function friendActionLabel(type) {
    if (type === "verify") {
      return "Confirmed";
    }

    if (type === "nudge") {
      return "Help";
    }

    return "Cheered";
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

  async function waitForCloudIdle(timeoutMs = 3500) {
    const startedAt = Date.now();
    while (cloudBusy && Date.now() - startedAt < timeoutMs) {
      await sleep(80);
    }
  }

  function sleep(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }
})();
