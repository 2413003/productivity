(function () {
  const STORE_KEY = "priority-state-v1";
  const LEGACY_STORE_KEY = "two-choice-state-v1";
  const ACCOUNT_STORE_PREFIX = "do-account-state-v1:";
  const BACKEND_CONFIG_KEY = "do-supabase-config-v1";
  const SUPABASE_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
  const SPRINT_MS = 60000;
  const PAGE_VIEW_ORDER = ["map", "input", "choose", "focus", "reputation"];
  const BRANCH_MOTION_MS = 190;
  const OBJECTIVE_DRAG_HOLD_MS = 420;
  const MINDMAP_NODE_WIDTH = 184;
  const MINDMAP_NODE_HEIGHT = 56;
  const MINDMAP_COLUMN_GAP = 242;
  const MINDMAP_ROW_GAP = 88;
  const MINDMAP_MIN_WIDTH = 1280;
  const MINDMAP_MIN_HEIGHT = 820;
  const TABLES = {
    profiles: "do_task_bracket_v1_profiles",
    tasks: "do_task_bracket_v1_tasks",
    proofs: "do_task_bracket_v1_proofs",
    supportSignals: "do_task_bracket_v1_support_signals"
  };

  const refs = {
    screens: Array.from(document.querySelectorAll("[data-screen]")),
    viewButtons: Array.from(document.querySelectorAll("[data-view-button]")),
    objectiveMap: document.getElementById("objectiveMap"),
    objectiveRootToggle: document.getElementById("objectiveRootToggle"),
    objectiveRootForm: document.getElementById("objectiveRootForm"),
    objectiveRootInput: document.getElementById("objectiveRootInput"),
    objectiveViewToggle: document.getElementById("objectiveViewToggle"),
    objectiveBottleneckToggle: document.getElementById("objectiveBottleneckToggle"),
    objectiveBottleneckBar: document.getElementById("objectiveBottleneckBar"),
    objectiveBottleneckLabel: document.getElementById("objectiveBottleneckLabel"),
    objectiveBottleneckCount: document.getElementById("objectiveBottleneckCount"),
    cancelBottleneckBtn: document.getElementById("cancelBottleneckBtn"),
    objectiveCanvas: document.getElementById("objectiveCanvas"),
    objectiveTree: document.getElementById("objectiveTree"),
    objectiveMindmap: document.getElementById("objectiveMindmap"),
    objectiveSelectionBar: document.getElementById("objectiveSelectionBar"),
    objectiveSelectionCount: document.getElementById("objectiveSelectionCount"),
    duplicateObjectivesBtn: document.getElementById("duplicateObjectivesBtn"),
    clearObjectiveSelectionBtn: document.getElementById("clearObjectiveSelectionBtn"),
    objectiveCount: document.getElementById("objectiveCount"),
    objectiveStatus: document.getElementById("objectiveStatus"),
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
    cancelProofBtn: document.getElementById("cancelProofBtn"),
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
  let authRefreshTimer = null;
  let authRefreshPromise = null;
  let pendingAuthRefresh = false;
  let activeView = initialView();
  let lastSyncedInput = "";
  let accountMode = "sign-in";
  let recoveryMode = hasRecoveryLink();
  let proofTaskId = null;
  let proofCancelSnapshot = null;
  let whyTaskId = null;
  let publicSnapshot = null;
  let pendingPublicProfileId = null;
  let pendingSignal = null;
  let activeInviteProfileId = null;
  let pendingSupportDialog = false;
  let lastSignalUrl = "";
  let objectiveDraftParentId = null;
  let selectedObjectiveId = null;
  let selectedObjectiveIds = new Set();
  let objectiveBottleneckMode = false;
  let objectiveRootOpen = false;
  let objectiveMenuId = null;
  let objectiveRenameId = null;
  let objectivePress = null;
  let objectivePressTimer = null;
  let objectiveDrag = null;
  let objectiveSuppressClick = false;
  let mindmapDrag = null;
  let mindmapPan = null;
  let mindmapViewportPrimed = false;
  let openingObjectiveIds = new Set();
  let closingObjectiveIds = new Set();
  let branchMotionTimers = new Map();
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
    document.addEventListener("keydown", handlePageArrowKeydown);

    refs.taskInput.addEventListener("input", saveDraftInput);
    refs.startBtn.addEventListener("click", () => applyTasks("choose"));
    refs.objectiveRootToggle?.addEventListener("click", openRootObjectiveForm);
    refs.objectiveViewToggle?.addEventListener("click", toggleObjectiveView);
    refs.objectiveBottleneckToggle?.addEventListener("click", toggleObjectiveBottleneckMode);
    refs.cancelBottleneckBtn?.addEventListener("click", () => {
      objectiveBottleneckMode = false;
      renderMap();
    });
    refs.objectiveRootForm?.addEventListener("submit", addRootObjective);
    refs.objectiveRootForm?.addEventListener("keydown", handleObjectiveKeydown);
    refs.objectiveTree?.addEventListener("click", suppressObjectiveDragClick, true);
    refs.objectiveTree?.addEventListener("click", handleObjectiveAction);
    refs.objectiveTree?.addEventListener("submit", submitObjectiveChild);
    refs.objectiveTree?.addEventListener("keydown", handleObjectiveKeydown);
    refs.objectiveTree?.addEventListener("pointerdown", handleObjectivePointerDown);
    refs.duplicateObjectivesBtn?.addEventListener("click", duplicateSelectedObjectives);
    refs.clearObjectiveSelectionBtn?.addEventListener("click", () => {
      clearObjectiveSelection();
      renderMap();
    });
    refs.objectiveMindmap?.addEventListener("pointerdown", handleMindmapPointerDown);
    window.addEventListener("pointermove", handleObjectivePointerMove, { passive: false });
    window.addEventListener("pointermove", handleMindmapPointerMove, { passive: false });
    window.addEventListener("pointerup", endObjectivePointer);
    window.addEventListener("pointerup", endMindmapPointer);
    window.addEventListener("pointercancel", cancelObjectivePointer);
    window.addEventListener("pointercancel", cancelMindmapPointer);
    window.addEventListener("click", closeObjectiveChromeOutside, true);
    document.addEventListener("pointerdown", closeObjectiveChromeOutside, true);
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
    refs.cancelProofBtn.addEventListener("click", cancelProofDialog);
    refs.skipProofBtn.addEventListener("click", closeProofDialog);
    refs.proofDialog.addEventListener("cancel", cancelProofDialog);
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

    window.addEventListener("storage", (event) => {
      if (isAuthStorageEvent(event)) {
        queueAuthRefresh();
      }

      if (isAppStateStorageEvent(event)) {
        state = loadState();
        render();
      }
    });
    window.addEventListener("focus", () => queueAuthRefresh());
    window.addEventListener("pagehide", () => {
      flushCloudSaveNow();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        flushCloudSaveNow();
      } else {
        queueAuthRefresh();
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
      objectiveView: saved.objectiveView === "mindmap" ? "mindmap" : "list",
      bottleneckTaskId: typeof saved.bottleneckTaskId === "string" ? saved.bottleneckTaskId : "",
      draftText: typeof saved.draftText === "string" ? saved.draftText : "",
      topCount: clamp(Number(saved.topCount) || 3, 1, 99),
      totalTaps: Number(saved.totalTaps) || 0,
      sprintStartTaps: Number(saved.sprintStartTaps) || 0,
      tasks: normalizeTasks(saved.tasks),
      objectives: normalizeObjectives(saved.objectives),
      collapsedObjectives: Array.isArray(saved.collapsedObjectives)
        ? saved.collapsedObjectives.filter((id) => typeof id === "string" && id)
        : [],
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

        const mapX = Number(node.mapX);
        const mapY = Number(node.mapY);
        const normalized = {
          id,
          parentId: typeof node.parentId === "string" ? node.parentId : "",
          text: node.text.replace(/\s+/g, " ").trim(),
          kind: node.kind === "task" ? "task" : "objective",
          taskId: typeof node.taskId === "string" ? node.taskId : "",
          masked: Boolean(node.masked),
          createdAt: Number(node.createdAt) || Date.now()
        };

        if (Number.isFinite(mapX) && Number.isFinite(mapY)) {
          normalized.mapX = clamp(mapX, 0, 6000);
          normalized.mapY = clamp(mapY, 0, 6000);
        }

        return normalized;
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
      collapsedObjectives: [],
      objectiveView: "list",
      bottleneckTaskId: "",
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

  function isAuthStorageEvent(event) {
    if (!event || event.storageArea !== localStorage) {
      return false;
    }

    if (!event.key) {
      return true;
    }

    return (
      event.key === "supabase.auth.token" ||
      (event.key.startsWith("sb-") && event.key.includes("auth-token"))
    );
  }

  function isAppStateStorageEvent(event) {
    if (!event || event.storageArea !== localStorage) {
      return false;
    }

    return (
      !event.key ||
      event.key === STORE_KEY ||
      event.key === LEGACY_STORE_KEY ||
      event.key.startsWith(ACCOUNT_STORE_PREFIX)
    );
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
      const defaultUrl = typeof defaultConfig.url === "string" ? defaultConfig.url.trim() : "";
      const defaultAnonKey = typeof defaultConfig.anonKey === "string" ? defaultConfig.anonKey.trim() : "";
      if (defaultUrl && defaultAnonKey) {
        return { url: defaultUrl, anonKey: defaultAnonKey };
      }

      const saved = JSON.parse(localStorage.getItem(BACKEND_CONFIG_KEY) || "null");
      if (!saved || typeof saved.url !== "string" || typeof saved.anonKey !== "string") {
        return { url: defaultUrl, anonKey: defaultAnonKey };
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
        if (event === "PASSWORD_RECOVERY") {
          session = nextSession;
          recoveryMode = true;
          activeView = "account";
          setSyncStatus("Reset password");
          render();
          return;
        }

        await applyAuthSession(nextSession);
      });

      if (session) {
        if (recoveryMode) {
          activeView = "account";
          setSyncStatus("Reset password");
          render();
        } else {
          showAuthenticatedApp();
          continueSessionStartup();
        }
      } else {
        activeView = "account";
        setSyncStatus("Ready");
        render();
      }

      if (pendingPublicProfileId && !session) {
        loadPublicProfile(pendingPublicProfileId);
      }

      if (pendingAuthRefresh) {
        pendingAuthRefresh = false;
        queueAuthRefresh();
      }
    } catch (error) {
      supabaseClient = null;
      session = null;
      setSyncStatus("Try again later");
      console.error(error);
      render();
    }
  }

  function queueAuthRefresh() {
    if (recoveryMode) {
      return;
    }

    if (!supabaseClient) {
      pendingAuthRefresh = true;
      return;
    }

    pendingAuthRefresh = false;
    window.clearTimeout(authRefreshTimer);
    authRefreshTimer = window.setTimeout(() => {
      refreshAuthSessionFromStorage();
    }, 60);
  }

  async function refreshAuthSessionFromStorage() {
    if (!supabaseClient || recoveryMode) {
      return;
    }

    if (authRefreshPromise) {
      return authRefreshPromise;
    }

    authRefreshPromise = (async () => {
      const { data, error } = await supabaseClient.auth.getSession();
      if (error) {
        console.warn("Couldn't refresh auth session", error);
        return;
      }

      await applyAuthSession(data.session);
    })().finally(() => {
      authRefreshPromise = null;
    });

    return authRefreshPromise;
  }

  async function applyAuthSession(nextSession) {
    const previousFingerprint = authSessionFingerprint(session);
    const nextFingerprint = authSessionFingerprint(nextSession);
    if (previousFingerprint === nextFingerprint) {
      return;
    }

    const hadSession = Boolean(session);
    session = nextSession;

    if (session) {
      recoveryMode = false;
      showAuthenticatedApp();
      continueSessionStartup();
      return;
    }

    if (hadSession) {
      recoveryMode = false;
      clearLocalAccountData();
      activeView = "account";
      setSyncStatus("Signed out");
      render();
    }
  }

  function showAuthenticatedApp() {
    const userId = session?.user?.id;
    if (!userId) {
      return;
    }

    state = localFallbackForSession();
    state.reputation.profileId = userId;
    lastSyncedInput = state.draftText || state.tasks.map((task) => task.text).join("\n");
    saveStateLocalOnly();

    if (activeView === "account") {
      activeView = state.tasks.length ? "focus" : hasScreen("map") ? "map" : "input";
    }

    render();
  }

  function continueSessionStartup() {
    (async () => {
      await syncNow();
      await processPendingSignal();
      if (pendingSupportDialog) {
        window.setTimeout(() => openSupportDialog(), 120);
      }
      if (pendingPublicProfileId) {
        await loadPublicProfile(pendingPublicProfileId);
      }
    })().catch((error) => {
      console.error(error);
      setSyncStatus("Sync error");
      render();
    });
  }

  function authSessionFingerprint(value) {
    return value ? `${value.user?.id || ""}:${value.access_token || ""}` : "";
  }

  async function signIn(event) {
    event.preventDefault();
    accountMode = "sign-in";
    renderAccount();
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
    showAuthenticatedApp();
    continueSessionStartup();
  }

  async function signUp() {
    accountMode = "create";
    setSyncStatus("");
    renderAccount();
    if (!supabaseClient) {
      setSyncStatus("Try again later");
      return;
    }

    const email = refs.authEmail.value.trim();
    const password = refs.authPassword.value;
    if (!email || !password) {
      if (!email) {
        refs.authEmail.focus();
      } else {
        refs.authPassword.focus();
      }
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
      showAuthenticatedApp();
      continueSessionStartup();
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
        existing.masked = Boolean(node.masked);
        existing.createdAt = Math.min(existing.createdAt, node.createdAt);
        if (!Number.isFinite(existing.mapX) && Number.isFinite(node.mapX) && Number.isFinite(node.mapY)) {
          existing.mapX = node.mapX;
          existing.mapY = node.mapY;
        }
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

  function handlePageArrowKeydown(event) {
    if (
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      !["ArrowLeft", "ArrowRight"].includes(event.key) ||
      shouldIgnorePageArrow(event.target)
    ) {
      return;
    }

    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextView = pageViewByOffset(direction);
    if (!nextView || nextView === activeView) {
      return;
    }

    event.preventDefault();
    setView(nextView);
  }

  function shouldIgnorePageArrow(target) {
    const element = target instanceof Element ? target : null;
    if (!element) {
      return false;
    }

    return Boolean(
      document.querySelector("dialog[open]") ||
        element.closest("input, textarea, select, [contenteditable='true'], [contenteditable=''], [role='textbox']")
    );
  }

  function pageViewByOffset(offset) {
    const views = PAGE_VIEW_ORDER.filter((view) => hasScreen(view) && shouldShowPageInPrimaryNav(view));
    if (!views.length) {
      return "";
    }

    const currentIndex = views.includes(activeView) ? views.indexOf(activeView) : offset > 0 ? -1 : 0;
    const nextIndex = (currentIndex + offset + views.length) % views.length;
    return views[nextIndex];
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
      const isPrimaryNav = Boolean(button.closest(".nav"));
      const hideForAuth = signInRequired() && isAccountDataView(view) && isPrimaryNav;
      const hideForPageState = isPrimaryNav && !shouldShowPageInPrimaryNav(view);
      button.classList.toggle("is-hidden", hideForAuth || hideForPageState);
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

  function shouldShowPageInPrimaryNav(view) {
    return view !== "choose" || activeTasks().length >= 2;
  }

  function renderMap() {
    if (!refs.objectiveCount || !refs.objectiveStatus || !refs.objectiveTree) {
      return;
    }

    const roots = objectiveChildren("");
    const linkedTasks = state.objectives.filter((node) => node.taskId && findTask(node.taskId)).length;
    const view = objectiveView();
    const bottleneckCandidates = objectiveBottleneckCandidates();

    if (view !== "list") {
      objectiveBottleneckMode = false;
    }
    if (state.bottleneckTaskId && !findTask(state.bottleneckTaskId)) {
      state.bottleneckTaskId = "";
    }

    refs.objectiveMap?.classList.toggle("is-mindmap-view", view === "mindmap");
    refs.objectiveMap?.classList.toggle("has-objectives", state.objectives.length > 0);
    refs.objectiveRootToggle?.classList.toggle("is-hidden", objectiveRootOpen);
    refs.objectiveViewToggle?.classList.toggle("is-hidden", objectiveRootOpen);
    refs.objectiveBottleneckToggle?.classList.toggle("is-hidden", objectiveRootOpen || view !== "list");
    refs.objectiveBottleneckToggle?.setAttribute("aria-pressed", String(objectiveBottleneckMode));
    refs.objectiveRootForm?.classList.toggle("is-hidden", !objectiveRootOpen);
    refs.objectiveTree?.classList.toggle("is-hidden", view !== "list");
    refs.objectiveTree?.classList.toggle("is-bottleneck-mode", objectiveBottleneckMode);
    refs.objectiveMindmap?.classList.toggle("is-hidden", view !== "mindmap");
    refs.objectiveCanvas?.classList.toggle("is-mindmap", view === "mindmap");
    refs.objectiveCount.textContent = `${state.objectives.length} item${state.objectives.length === 1 ? "" : "s"}`;
    refs.objectiveStatus.textContent = linkedTasks ? `${linkedTasks} task${linkedTasks === 1 ? "" : "s"} linked` : "";
    renderObjectiveViewToggle();
    refs.objectiveTree.innerHTML = "";
    if (refs.objectiveMindmap) {
      refs.objectiveMindmap.innerHTML = "";
    }
    renderObjectiveBottleneckBar(bottleneckCandidates.length);

    if (!roots.length) {
      renderObjectiveSelectionBar();
      if (view === "mindmap") {
        renderMindmap(roots);
      } else {
        const empty = document.createElement("li");
        empty.className = "empty";
        empty.textContent = "Add your first objective";
        refs.objectiveTree.appendChild(empty);
      }
      return;
    }

    if (selectedObjectiveId && !findObjective(selectedObjectiveId)) {
      selectedObjectiveId = null;
    }
    syncObjectiveSelection();
    if (objectiveMenuId && !findObjective(objectiveMenuId)) {
      objectiveMenuId = null;
    }
    if (objectiveRenameId && !findObjective(objectiveRenameId)) {
      objectiveRenameId = null;
    }

    const existingIds = new Set(state.objectives.map((node) => node.id));
    state.collapsedObjectives = (state.collapsedObjectives || []).filter((id) => existingIds.has(id));

    roots.forEach((node) => {
      refs.objectiveTree.appendChild(createObjectiveItem(node, 0));
    });
    renderObjectiveSelectionBar();

    if (view === "mindmap") {
      renderMindmap(roots);
      primeMindmapViewport();
    }
  }

  function objectiveView() {
    return state.objectiveView === "mindmap" ? "mindmap" : "list";
  }

  function toggleObjectiveView() {
    state.objectiveView = objectiveView() === "mindmap" ? "list" : "mindmap";
    objectiveBottleneckMode = false;
    objectiveMenuId = null;
    objectiveRenameId = null;
    objectiveDraftParentId = null;
    mindmapViewportPrimed = false;
    saveState();
    renderMap();
  }

  function renderObjectiveViewToggle() {
    if (!refs.objectiveViewToggle) {
      return;
    }

    const isMindmap = objectiveView() === "mindmap";
    refs.objectiveViewToggle.setAttribute("aria-label", isMindmap ? "List" : "Mind map");
    refs.objectiveViewToggle.dataset.tooltip = isMindmap ? "List" : "Mind map";
    refs.objectiveViewToggle.setAttribute("aria-pressed", String(isMindmap));
    refs.objectiveViewToggle.replaceChildren(createControlIcon(isMindmap ? "list" : "mindmap"));
  }

  function renderObjectiveSelectionBar() {
    const ids = objectiveSelectedIds();
    const show = activeView === "map" && objectiveView() === "list" && ids.length > 1 && !objectiveDrag;
    refs.objectiveSelectionBar?.classList.toggle("is-hidden", !show);
    if (refs.objectiveSelectionCount) {
      refs.objectiveSelectionCount.textContent = String(ids.length);
      refs.objectiveSelectionCount.setAttribute("aria-label", `${ids.length} selected`);
    }
    if (refs.duplicateObjectivesBtn) {
      refs.duplicateObjectivesBtn.disabled = ids.length < 1;
    }
  }

  function renderObjectiveBottleneckBar(count) {
    const show = activeView === "map" && objectiveView() === "list" && objectiveBottleneckMode;
    refs.objectiveBottleneckBar?.classList.toggle("is-hidden", !show);
    if (refs.objectiveBottleneckLabel) {
      refs.objectiveBottleneckLabel.textContent = count ? "Choose bottleneck" : "No tasks yet";
    }
    if (refs.objectiveBottleneckCount) {
      refs.objectiveBottleneckCount.textContent = count ? String(count) : "0";
      refs.objectiveBottleneckCount.setAttribute("aria-label", count ? `${count} task choices` : "No task choices");
    }
  }

  function renderMindmap(roots) {
    if (!refs.objectiveMindmap) {
      return;
    }

    refs.objectiveMindmap.innerHTML = "";

    if (!roots.length) {
      const empty = document.createElement("div");
      empty.className = "mindmap-empty";
      empty.textContent = "Add your first objective";
      refs.objectiveMindmap.appendChild(empty);
      refs.objectiveMindmap.style.minWidth = "";
      refs.objectiveMindmap.style.minHeight = "";
      return;
    }

    const layout = objectiveMindmapLayout(roots);
    const svg = createSvg("svg");
    svg.classList.add("mindmap-links");
    svg.setAttribute("width", String(layout.width));
    svg.setAttribute("height", String(layout.height));
    svg.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`);
    refs.objectiveMindmap.style.minWidth = `${layout.width}px`;
    refs.objectiveMindmap.style.minHeight = `${layout.height}px`;
    refs.objectiveMindmap.appendChild(svg);
    renderMindmapLinks(svg, layout.positions);

    orderedObjectivesForMindmap(roots).forEach((node) => {
      const position = layout.positions.get(node.id);
      if (!position) {
        return;
      }

      const button = document.createElement("button");
      button.className = "mindmap-node";
      button.classList.toggle("is-root", !node.parentId);
      button.classList.toggle("is-task", Boolean(node.taskId && findTask(node.taskId)));
      button.classList.toggle("is-selected", objectiveIsSelected(node.id));
      button.classList.toggle("is-masked", objectiveMaskedInPath(node.id));
      button.type = "button";
      button.dataset.id = node.id;
      button.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
      button.setAttribute("aria-label", node.text);

      const title = document.createElement("span");
      title.className = "mindmap-title";
      title.textContent = node.text;
      button.appendChild(title);

      const metaText = objectiveMeta(node);
      if (metaText) {
        const meta = document.createElement("span");
        meta.className = "mindmap-meta";
        meta.textContent = metaText;
        button.appendChild(meta);
      }

      refs.objectiveMindmap.appendChild(button);
    });
  }

  function orderedObjectivesForMindmap(roots) {
    const ordered = [];
    const walk = (node) => {
      ordered.push(node);
      objectiveChildren(node.id).forEach(walk);
    };

    roots.forEach(walk);
    return ordered;
  }

  function objectiveMindmapLayout(roots) {
    const autoPositions = new Map();
    let cursorY = 112;

    const place = (node, depth) => {
      const children = objectiveChildren(node.id);
      const childYs = children.map((child) => place(child, depth + 1));
      const y = childYs.length ? (childYs[0] + childYs[childYs.length - 1]) / 2 : cursorY;
      if (!childYs.length) {
        cursorY += MINDMAP_ROW_GAP;
      }

      autoPositions.set(node.id, {
        x: 180 + depth * MINDMAP_COLUMN_GAP,
        y
      });

      return y;
    };

    roots.forEach((root, index) => {
      if (index > 0) {
        cursorY += 26;
      }
      place(root, 0);
    });

    const positions = new Map();
    state.objectives.forEach((node) => {
      const automatic = autoPositions.get(node.id);
      if (!automatic) {
        return;
      }

      positions.set(node.id, {
        x: Number.isFinite(node.mapX) ? node.mapX : automatic.x,
        y: Number.isFinite(node.mapY) ? node.mapY : automatic.y
      });
    });

    const initialValues = Array.from(positions.values());
    const minX = Math.min(...initialValues.map((item) => item.x));
    const minY = Math.min(...initialValues.map((item) => item.y));
    const offsetX = Math.max(0, 96 - minX);
    const offsetY = Math.max(0, 72 - minY);
    if (offsetX || offsetY) {
      positions.forEach((position) => {
        position.x += offsetX;
        position.y += offsetY;
      });
    }

    const values = Array.from(positions.values());
    const width = Math.max(MINDMAP_MIN_WIDTH, Math.ceil(Math.max(...values.map((item) => item.x)) + MINDMAP_NODE_WIDTH + 360));
    const height = Math.max(MINDMAP_MIN_HEIGHT, Math.ceil(Math.max(...values.map((item) => item.y)) + MINDMAP_NODE_HEIGHT + 260));

    return { positions, width, height };
  }

  function primeMindmapViewport() {
    if (mindmapViewportPrimed || !refs.objectiveCanvas) {
      return;
    }

    mindmapViewportPrimed = true;
    window.setTimeout(() => {
      if (objectiveView() !== "mindmap" || !refs.objectiveCanvas) {
        return;
      }

      const maxLeft = refs.objectiveCanvas.scrollWidth - refs.objectiveCanvas.clientWidth;
      const maxTop = refs.objectiveCanvas.scrollHeight - refs.objectiveCanvas.clientHeight;
      const layout = objectiveMindmapLayout(objectiveChildren(""));
      const positions = Array.from(layout.positions.values());
      const minX = positions.length ? Math.min(...positions.map((position) => position.x)) : 0;
      const minY = positions.length ? Math.min(...positions.map((position) => position.y)) : 0;
      refs.objectiveCanvas.scrollLeft = Math.min(Math.max(0, minX - 96), Math.max(0, maxLeft));
      refs.objectiveCanvas.scrollTop = Math.min(Math.max(0, minY - 72), Math.max(0, maxTop));
    }, 0);
  }

  function renderMindmapLinks(svg, positions) {
    svg.innerHTML = "";

    state.objectives.forEach((node) => {
      if (!node.parentId) {
        return;
      }

      const parent = findObjective(node.parentId);
      const parentPosition = parent ? positions.get(parent.id) : null;
      const childPosition = positions.get(node.id);
      if (!parentPosition || !childPosition) {
        return;
      }

      const path = createSvg("path");
      const startX = parentPosition.x + MINDMAP_NODE_WIDTH;
      const startY = parentPosition.y + MINDMAP_NODE_HEIGHT / 2;
      const endX = childPosition.x;
      const endY = childPosition.y + MINDMAP_NODE_HEIGHT / 2;
      const curve = Math.max(54, (endX - startX) * 0.52);
      path.setAttribute("d", `M ${startX} ${startY} C ${startX + curve} ${startY}, ${endX - curve} ${endY}, ${endX} ${endY}`);
      path.classList.toggle("is-muted", objectiveMaskedInPath(node.id) || objectiveMaskedInPath(parent.id));
      svg.appendChild(path);
    });
  }

  function refreshMindmapLinks() {
    if (!refs.objectiveMindmap) {
      return;
    }

    const layout = objectiveMindmapLayout(objectiveChildren(""));
    const svg = refs.objectiveMindmap.querySelector(".mindmap-links");
    if (!svg) {
      return;
    }

    refs.objectiveMindmap.style.minWidth = `${layout.width}px`;
    refs.objectiveMindmap.style.minHeight = `${layout.height}px`;
    svg.setAttribute("width", String(layout.width));
    svg.setAttribute("height", String(layout.height));
    svg.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`);
    renderMindmapLinks(svg, layout.positions);
  }

  function createSvg(name) {
    return document.createElementNS("http://www.w3.org/2000/svg", name);
  }

  function objectiveMaskedInPath(id) {
    let node = findObjective(id);
    while (node) {
      if (node.masked) {
        return true;
      }
      node = node.parentId ? findObjective(node.parentId) : null;
    }

    return false;
  }

  function createObjectiveItem(node, depth) {
    const isLinkedTask = Boolean(node.taskId && findTask(node.taskId));
    const task = objectiveTaskForNode(node);
    const isBottleneckCandidate = objectiveBottleneckMode && Boolean(task);
    const isChosenBottleneck = Boolean(task && state.bottleneckTaskId === task.id && !task.done);
    const children = objectiveChildren(node.id);
    const isDrafting = objectiveDraftParentId === node.id;
    const hasBranch = children.length || isDrafting;
    const isOpening = openingObjectiveIds.has(node.id);
    const isClosing = closingObjectiveIds.has(node.id);
    const isCollapsed = hasBranch && objectiveIsCollapsed(node.id) && !isDrafting;
    const item = document.createElement("li");
    item.className = "objective-item";
    item.classList.toggle("is-task-item", isLinkedTask);
    item.classList.toggle("is-selected", objectiveIsSelected(node.id));
    item.classList.toggle("is-collapsed", isCollapsed);
    item.classList.toggle("is-opening", isOpening);
    item.classList.toggle("is-collapsing", isClosing);
    item.classList.toggle("is-menu-open", objectiveMenuId === node.id);
    item.classList.toggle("is-renaming", objectiveRenameId === node.id);
    item.classList.toggle("is-masked", Boolean(node.masked));
    item.classList.toggle("is-bottleneck-candidate", isBottleneckCandidate);
    item.classList.toggle("is-bottleneck-chosen", isChosenBottleneck);
    const objectiveDropMode = objectiveDrag?.dropTargetId === node.id ? objectiveDrag.dropMode : "";
    item.classList.toggle("is-dragging", objectiveDragIncludes(node.id));
    item.classList.toggle("is-drop-before", objectiveDropMode === "before");
    item.classList.toggle("is-drop-after", objectiveDropMode === "after");
    item.classList.toggle("is-drop-inside", objectiveDropMode === "inside");
    item.classList.toggle("has-branch", Boolean(children.length));
    item.dataset.objectiveId = node.id;
    item.style.animationDelay = `${Math.min(depth, 7) * 24}ms`;
    item.style.setProperty("--depth", depth);

    const row = document.createElement("div");
    row.className = "objective-node";

    if (hasBranch) {
      const toggle = document.createElement("button");
      toggle.className = "objective-toggle";
      toggle.type = "button";
      toggle.dataset.action = "toggle-branch";
      toggle.dataset.id = node.id;
      toggle.setAttribute("aria-label", isCollapsed ? "Show branch" : "Hide branch");
      toggle.setAttribute("aria-expanded", String(!isCollapsed));
      toggle.appendChild(createControlIcon("chevron"));
      row.appendChild(toggle);
    } else {
      const spacer = document.createElement("span");
      spacer.className = "objective-toggle-spacer";
      spacer.setAttribute("aria-hidden", "true");
      row.appendChild(spacer);
    }

    const pick = document.createElement("button");
    pick.className = `objective-pick${isLinkedTask ? " is-task" : ""}`;
    pick.type = "button";
    pick.dataset.action = isBottleneckCandidate ? "choose-bottleneck" : "select";
    pick.dataset.id = node.id;
    pick.setAttribute("aria-current", objectiveIsSelected(node.id) ? "true" : "false");
    pick.setAttribute("aria-pressed", objectiveIsSelected(node.id) ? "true" : "false");

    const main = document.createElement("span");
    main.className = "objective-main";

    const title = document.createElement("span");
    title.className = "objective-title";
    title.textContent = node.text;

    const metaText = objectiveMeta(node);
    main.appendChild(title);
    if (metaText) {
      const meta = document.createElement("span");
      meta.className = "objective-meta";
      meta.textContent = metaText;
      main.appendChild(meta);
    }

    pick.append(main);
    row.appendChild(pick);
    row.appendChild(createObjectiveActions(node));
    item.appendChild(row);

    if (isDrafting) {
      item.appendChild(createObjectiveDraftForm(node.id));
    }

    if (objectiveRenameId === node.id) {
      item.appendChild(createObjectiveRenameForm(node));
    }

    if (children.length && (!isCollapsed || isClosing)) {
      const childList = document.createElement("ul");
      childList.className = "objective-list objective-branch";
      childList.classList.toggle("is-opening", isOpening);
      childList.classList.toggle("is-closing", isClosing);
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
      addButton.className = "objective-action icon-action";
      addButton.type = "button";
      addButton.dataset.action = "add-child";
      addButton.dataset.id = node.id;
      addButton.setAttribute("aria-label", "Add step");
      addButton.dataset.tooltip = "Add step";
      addButton.appendChild(createControlIcon("plus"));
      actions.appendChild(addButton);
    }

    if (isLinked) {
      const stepButton = document.createElement("button");
      stepButton.className = "objective-action icon-action";
      stepButton.type = "button";
      stepButton.dataset.action = "make-step";
      stepButton.dataset.id = node.id;
      stepButton.setAttribute("aria-label", "Mark step");
      stepButton.dataset.tooltip = "Mark step";
      stepButton.appendChild(createControlIcon("step"));
      actions.appendChild(stepButton);
    }

    if (!isLinked && !children.length) {
      const taskButton = document.createElement("button");
      taskButton.className = "objective-action icon-action";
      taskButton.type = "button";
      taskButton.dataset.action = "make-task";
      taskButton.dataset.id = node.id;
      taskButton.setAttribute("aria-label", "Mark task");
      taskButton.dataset.tooltip = "Mark task";
      taskButton.appendChild(createControlIcon("task"));
      actions.appendChild(taskButton);
    }

    const moreWrap = document.createElement("span");
    moreWrap.className = "objective-more-wrap";

    const moreButton = document.createElement("button");
    moreButton.className = "objective-action icon-action";
    moreButton.type = "button";
    moreButton.dataset.action = "toggle-more";
    moreButton.dataset.id = node.id;
    moreButton.setAttribute("aria-label", "More");
    moreButton.setAttribute("aria-expanded", String(objectiveMenuId === node.id));
    moreButton.dataset.tooltip = "More";
    moreButton.appendChild(createControlIcon("more"));
    moreWrap.appendChild(moreButton);

    if (objectiveMenuId === node.id) {
      const menu = document.createElement("div");
      menu.className = "objective-more-menu";
      menu.setAttribute("role", "menu");

      const renameButton = document.createElement("button");
      renameButton.type = "button";
      renameButton.dataset.action = "rename-objective";
      renameButton.dataset.id = node.id;
      renameButton.setAttribute("role", "menuitem");
      renameButton.textContent = "Rename";

      const maskButton = document.createElement("button");
      maskButton.type = "button";
      maskButton.dataset.action = "toggle-mask";
      maskButton.dataset.id = node.id;
      maskButton.setAttribute("role", "menuitem");
      maskButton.textContent = node.masked ? "Show" : "Hide";

      menu.append(renameButton, maskButton);
      moreWrap.appendChild(menu);
    }

    actions.appendChild(moreWrap);

    const deleteButton = document.createElement("button");
    deleteButton.className = "objective-action icon-action is-danger";
    deleteButton.type = "button";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.id = node.id;
    deleteButton.setAttribute("aria-label", "Delete");
    deleteButton.dataset.tooltip = "Delete";
    deleteButton.appendChild(createControlIcon("trash"));

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

  function createObjectiveRenameForm(node) {
    const form = document.createElement("form");
    form.className = "objective-rename-form";
    form.dataset.id = node.id;

    const input = document.createElement("input");
    input.id = "objectiveRenameInput";
    input.type = "text";
    input.autocomplete = "off";
    input.value = node.text;
    input.placeholder = "Rename";

    const save = document.createElement("button");
    save.className = "primary";
    save.type = "submit";
    save.textContent = "Save";

    const cancel = document.createElement("button");
    cancel.className = "subtle";
    cancel.type = "button";
    cancel.dataset.action = "cancel-rename";
    cancel.textContent = "Cancel";

    form.append(input, save, cancel);
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

    refs.focusTitle.textContent = "Biggest Bottleneck";
    refs.topCount.textContent = String(topCount);
    refs.topCount.closest(".stepper")?.classList.toggle("is-hidden", ranked.length <= 1);
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

    refs.keepChoosing.setAttribute("aria-label", "Choose");
    refs.keepChoosing.dataset.tooltip = "Choose";
    refs.keepChoosing.disabled = activeTasks().length < 2;
    refs.resetRank.classList.remove("is-hidden");
  }

  function objectiveChildren(parentId) {
    return state.objectives
      .filter((node) => (node.parentId || "") === (parentId || ""))
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  function objectiveMeta(node) {
    const task = node.taskId ? findTask(node.taskId) : null;

    if (task) {
      if (!task.done && state.bottleneckTaskId === task.id) {
        return "Bottleneck";
      }

      return "";
    }

    return "";
  }

  function objectiveTaskForNode(node) {
    const task = node?.taskId ? findTask(node.taskId) : null;
    return task && !task.done ? task : null;
  }

  function objectiveBottleneckCandidates() {
    return state.objectives.filter((node) => objectiveTaskForNode(node));
  }

  function toggleObjectiveBottleneckMode() {
    if (objectiveView() !== "list") {
      state.objectiveView = "list";
    }

    objectiveBottleneckMode = !objectiveBottleneckMode;
    objectiveMenuId = null;
    objectiveRenameId = null;
    objectiveDraftParentId = null;
    clearObjectiveSelection();
    renderMap();
  }

  function chooseObjectiveBottleneck(objectiveId) {
    const node = findObjective(objectiveId);
    const task = objectiveTaskForNode(node);
    if (!node || !task) {
      return;
    }

    const active = activeTasks();
    const maxScore = Math.max(1000, ...active.map((item) => Number(item.score) || 1000));
    task.score = Math.max(task.score + 100, maxScore + 100);
    task.done = false;
    task.doneAt = null;
    state.bottleneckTaskId = task.id;
    state.currentPair = null;
    selectedObjectiveId = node.id;
    selectedObjectiveIds = new Set([node.id]);
    objectiveBottleneckMode = false;
    objectiveMenuId = null;
    objectiveRenameId = null;
    objectiveDraftParentId = null;
    syncDraftFromTasks();
    saveState({ immediate: true });
    render();
  }

  function objectiveIsSelected(id) {
    return selectedObjectiveIds.has(id) || selectedObjectiveId === id;
  }

  function objectiveSelectedIds() {
    syncObjectiveSelection();
    return Array.from(selectedObjectiveIds);
  }

  function syncObjectiveSelection() {
    selectedObjectiveIds = new Set(Array.from(selectedObjectiveIds).filter((id) => findObjective(id)));
    if (selectedObjectiveId && !findObjective(selectedObjectiveId)) {
      selectedObjectiveId = null;
    }
    if (selectedObjectiveId) {
      selectedObjectiveIds.add(selectedObjectiveId);
    }
    if (!selectedObjectiveId && selectedObjectiveIds.size) {
      selectedObjectiveId = Array.from(selectedObjectiveIds).at(-1);
    }
  }

  function setObjectiveSelection(ids) {
    const validIds = ids.filter((id) => findObjective(id));
    selectedObjectiveIds = new Set(validIds);
    selectedObjectiveId = validIds.at(-1) || null;
  }

  function clearObjectiveSelection() {
    selectedObjectiveIds.clear();
    selectedObjectiveId = null;
  }

  function toggleObjectiveSelection(id) {
    if (!findObjective(id)) {
      return;
    }

    if (selectedObjectiveIds.has(id)) {
      selectedObjectiveIds.delete(id);
      if (selectedObjectiveId === id) {
        selectedObjectiveId = Array.from(selectedObjectiveIds).at(-1) || null;
      }
    } else {
      selectedObjectiveIds.add(id);
      selectedObjectiveId = id;
    }
  }

  function selectObjectiveRange(toId) {
    const fromId = selectedObjectiveId || Array.from(selectedObjectiveIds).at(-1);
    const visibleIds = visibleObjectiveIds();
    const fromIndex = visibleIds.indexOf(fromId);
    const toIndex = visibleIds.indexOf(toId);
    if (fromIndex < 0 || toIndex < 0) {
      toggleObjectiveSelection(toId);
      return;
    }

    const [start, end] = fromIndex < toIndex ? [fromIndex, toIndex] : [toIndex, fromIndex];
    visibleIds.slice(start, end + 1).forEach((id) => selectedObjectiveIds.add(id));
    selectedObjectiveId = toId;
  }

  function visibleObjectiveIds(parentId = "") {
    return objectiveChildren(parentId).flatMap((node) => {
      const ids = [node.id];
      const hasChildren = objectiveChildren(node.id).length > 0;
      if (hasChildren && !objectiveIsCollapsed(node.id)) {
        ids.push(...visibleObjectiveIds(node.id));
      }
      return ids;
    });
  }

  function openRootObjectiveForm() {
    objectiveRootOpen = true;
    objectiveBottleneckMode = false;
    objectiveMenuId = null;
    objectiveRenameId = null;
    renderMap();
    window.setTimeout(() => refs.objectiveRootInput?.focus(), 0);
  }

  function addRootObjective(event) {
    event.preventDefault();
    const text = refs.objectiveRootInput.value.trim();
    if (!text) {
      refs.objectiveRootInput.focus();
      return;
    }

    addObjective(text, "");
    refs.objectiveRootInput.value = "";
    objectiveRootOpen = false;
    renderMap();
  }

  function submitObjectiveChild(event) {
    const renameForm = event.target.closest(".objective-rename-form");
    if (renameForm) {
      submitObjectiveRename(event, renameForm);
      return;
    }

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

  function submitObjectiveRename(event, form) {
    event.preventDefault();
    const node = findObjective(form.dataset.id);
    const input = form.querySelector("input");
    const text = input.value.replace(/\s+/g, " ").trim();

    if (!node) {
      objectiveRenameId = null;
      render();
      return;
    }

    if (!text) {
      input.focus();
      return;
    }

    renameObjective(node, text);
  }

  function handleObjectiveKeydown(event) {
    if (event.key !== "Escape") {
      return;
    }

    if (event.target.closest(".objective-rename-form")) {
      objectiveRenameId = null;
      render();
      return;
    }

    if (event.target.closest(".objective-child-form")) {
      objectiveDraftParentId = null;
      render();
      return;
    }

    if (event.target.closest("#objectiveRootForm")) {
      objectiveRootOpen = false;
      refs.objectiveRootInput.value = "";
      renderMap();
      return;
    }

    if (objectiveSelectedIds().length) {
      clearObjectiveSelection();
      renderMap();
    }
  }

  function handleObjectiveAction(event) {
    const button = event.target.closest("[data-action]");
    if (!button) {
      return;
    }

    const action = button.dataset.action;
    if (action === "choose-bottleneck") {
      chooseObjectiveBottleneck(button.dataset.id);
      return;
    }

    if (action === "select") {
      if (objectiveBottleneckMode) {
        return;
      }
      const id = button.dataset.id || null;
      if (event.shiftKey) {
        selectObjectiveRange(id);
      } else if (event.metaKey || event.ctrlKey) {
        toggleObjectiveSelection(id);
      } else {
        const selectedIds = objectiveSelectedIds();
        setObjectiveSelection(selectedIds.length === 1 && selectedIds[0] === id ? [] : [id]);
      }
      objectiveMenuId = null;
      render();
      return;
    }

    if (action === "cancel-child") {
      objectiveDraftParentId = null;
      render();
      return;
    }

    if (action === "cancel-rename") {
      objectiveRenameId = null;
      render();
      return;
    }

    const node = findObjective(button.dataset.id);
    if (!node) {
      return;
    }

    if (action === "toggle-branch") {
      objectiveMenuId = null;
      toggleObjectiveBranch(node.id);
      return;
    }

    if (action === "toggle-more") {
      setObjectiveSelection([node.id]);
      objectiveMenuId = objectiveMenuId === node.id ? null : node.id;
      render();
      return;
    }

    if (action === "rename-objective") {
      setObjectiveSelection([node.id]);
      objectiveMenuId = null;
      objectiveDraftParentId = null;
      objectiveRenameId = node.id;
      render();
      window.setTimeout(() => {
        const input = document.getElementById("objectiveRenameInput");
        input?.focus();
        input?.select();
      }, 0);
      return;
    }

    if (action === "toggle-mask") {
      node.masked = !node.masked;
      objectiveMenuId = null;
      saveState({ immediate: true });
      render();
      return;
    }

    if (action === "add-child") {
      setObjectiveSelection([node.id]);
      objectiveDraftParentId = node.id;
      objectiveMenuId = null;
      objectiveRenameId = null;
      expandObjective(node.id);
      render();
      window.setTimeout(() => document.getElementById("objectiveDraftInput")?.focus(), 0);
      return;
    }

    if (action === "make-task") {
      objectiveMenuId = null;
      ensureTaskForObjective(node.id);
      return;
    }

    if (action === "make-step") {
      objectiveMenuId = null;
      markObjectiveAsStep(node.id);
      return;
    }

    if (action === "delete") {
      objectiveMenuId = null;
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
      masked: false,
      createdAt: Date.now() + Math.random()
    });
    setObjectiveSelection([id]);
    objectiveDraftParentId = null;
    if (parentId) {
      expandObjective(parentId);
    }
    saveState({ immediate: true });
    render();
  }

  function renameObjective(node, text) {
    node.text = text;
    objectiveRenameId = null;
    objectiveMenuId = null;

    const affectedIds = new Set([node.id]);
    let changed = true;
    while (changed) {
      changed = false;
      state.objectives.forEach((item) => {
        if (!affectedIds.has(item.id) && affectedIds.has(item.parentId)) {
          affectedIds.add(item.id);
          changed = true;
        }
      });
    }

    state.objectives.forEach((item) => {
      if (!affectedIds.has(item.id) || !item.taskId) {
        return;
      }

      const task = findTask(item.taskId);
      if (!task) {
        return;
      }

      if (item.id === node.id) {
        task.text = text;
        state.reputation.proofs.forEach((proof) => {
          if (proof.taskId === task.id) {
            proof.taskText = text;
          }
        });
      }

      task.justification = objectivePath(item.id).join(" / ");
    });

    syncDraftFromTasks();

    saveState({ immediate: true });
    render();
  }

  function handleObjectivePointerDown(event) {
    if (event.button !== undefined && event.button !== 0) {
      return;
    }

    const pick = event.target.closest(".objective-pick");
    if (!pick || pick.closest(".objective-rename-form, .objective-child-form")) {
      return;
    }

    const node = findObjective(pick.dataset.id);
    if (!node) {
      return;
    }

    window.clearTimeout(objectivePressTimer);
    objectivePress = {
      id: node.id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY
    };

    objectivePressTimer = window.setTimeout(() => {
      startObjectiveDrag(node.id, event.pointerId);
    }, OBJECTIVE_DRAG_HOLD_MS);
  }

  function handleObjectivePointerMove(event) {
    if (objectivePress && !objectiveDrag && objectivePress.pointerId === event.pointerId) {
      const distance = Math.hypot(event.clientX - objectivePress.startX, event.clientY - objectivePress.startY);
      if (distance > 8) {
        cancelObjectivePointer();
      }
      return;
    }

    if (!objectiveDrag || objectiveDrag.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    updateObjectiveDragPreview(event.clientX, event.clientY);

    const target = objectiveDragTarget(event.clientX, event.clientY);
    const dropMode = target ? objectiveDropModeForTarget(target, event.clientY) : "";
    if (!target || !dropMode) {
      if (objectiveDrag.dropTargetId) {
        objectiveDrag.dropTargetId = null;
        objectiveDrag.dropMode = "";
        renderMap();
      }
      return;
    }

    const dropChanged = objectiveDrag.dropTargetId !== target.id || objectiveDrag.dropMode !== dropMode;
    objectiveDrag.dropTargetId = target.id;
    objectiveDrag.dropMode = dropMode;

    const moved = dropMode === "inside"
      ? moveObjectivesInside(objectiveDrag.ids, target.id)
      : moveObjectivesNear(objectiveDrag.ids, target.id, dropMode === "after");

    if (moved) {
      objectiveDrag.parentId = findObjective(objectiveDrag.id)?.parentId || "";
    }

    if (moved || dropChanged) {
      renderMap();
    }
  }

  function startObjectiveDrag(id, pointerId) {
    const node = findObjective(id);
    if (!node || !objectivePress || objectivePress.pointerId !== pointerId) {
      return;
    }

    if (!objectiveIsSelected(id)) {
      setObjectiveSelection([id]);
    }
    const dragIds = objectiveTopLevelIds(objectiveSelectedIds().includes(id) ? objectiveSelectedIds() : [id]);
    setObjectiveSelection(dragIds);

    const sourceRow = objectiveItemElement(id)?.querySelector(":scope > .objective-node");
    const sourceBox = sourceRow?.getBoundingClientRect();
    const preview = createObjectiveDragPreview(node, sourceBox?.width || 280, dragIds.length);

    objectiveDrag = {
      id,
      ids: dragIds,
      parentId: node.parentId || "",
      pointerId,
      offsetX: sourceBox ? objectivePress.startX - sourceBox.left : 18,
      offsetY: sourceBox ? objectivePress.startY - sourceBox.top : 18,
      dropTargetId: null,
      dropMode: "",
      preview
    };
    objectiveSuppressClick = true;
    selectedObjectiveId = dragIds.includes(id) ? id : dragIds.at(-1);
    objectiveMenuId = null;
    objectiveRenameId = null;
    objectiveDraftParentId = null;
    document.body.classList.add("is-objective-dragging");
    document.body.appendChild(preview);
    updateObjectiveDragPreview(objectivePress.startX, objectivePress.startY);
    renderMap();
  }

  function endObjectivePointer(event) {
    if (event && objectivePress && objectivePress.pointerId !== event.pointerId && objectiveDrag?.pointerId !== event.pointerId) {
      return;
    }

    window.clearTimeout(objectivePressTimer);
    objectivePress = null;

    if (!objectiveDrag) {
      return;
    }

    clearObjectiveDragPreview();
    objectiveDrag = null;
    document.body.classList.remove("is-objective-dragging");
    saveState({ immediate: true });
    render();
    window.setTimeout(() => {
      objectiveSuppressClick = false;
    }, 80);
  }

  function cancelObjectivePointer() {
    window.clearTimeout(objectivePressTimer);
    objectivePress = null;

    if (!objectiveDrag) {
      return;
    }

    clearObjectiveDragPreview();
    objectiveDrag = null;
    document.body.classList.remove("is-objective-dragging");
    renderMap();
    window.setTimeout(() => {
      objectiveSuppressClick = false;
    }, 80);
  }

  function suppressObjectiveDragClick(event) {
    if (!objectiveSuppressClick) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    objectiveSuppressClick = false;
  }

  function objectiveDragTarget(x, y) {
    const seen = new Set();
    const item = document
      .elementsFromPoint(x, y)
      .map((element) => element.closest?.(".objective-item"))
      .find((candidate) => {
        const id = candidate?.dataset.objectiveId;
        if (!id || seen.has(id) || objectiveDragIncludesBranch(id)) {
          return false;
        }
        seen.add(id);
        return true;
      });

    return item ? objectiveDragTargetFromItem(item) : null;
  }

  function objectiveDragIncludes(id) {
    return Boolean(objectiveDrag?.ids?.includes(id) || objectiveDrag?.id === id);
  }

  function objectiveDragIncludesBranch(id) {
    if (!objectiveDrag) {
      return false;
    }

    return objectiveDrag.ids.some((dragId) => id === dragId || objectiveIsDescendant(id, dragId));
  }

  function objectiveItemElement(id) {
    return Array.from(refs.objectiveTree?.querySelectorAll(".objective-item") || []).find(
      (item) => item.dataset.objectiveId === id
    );
  }

  function createObjectiveDragPreview(node, width, count = 1) {
    const preview = document.createElement("div");
    preview.className = "objective-drag-preview";
    preview.style.width = `${Math.min(Math.max(width, 220), 560)}px`;

    const title = document.createElement("span");
    title.className = "objective-title";
    title.textContent = node.text;
    preview.appendChild(title);

    const metaText = count > 1 ? `${count} selected` : objectiveMeta(node);
    if (metaText) {
      const meta = document.createElement("span");
      meta.className = "objective-meta";
      meta.textContent = metaText;
      preview.appendChild(meta);
    }

    return preview;
  }

  function updateObjectiveDragPreview(x, y) {
    if (!objectiveDrag?.preview) {
      return;
    }

    objectiveDrag.preview.style.transform = `translate3d(${x - objectiveDrag.offsetX}px, ${y - objectiveDrag.offsetY}px, 0)`;
  }

  function clearObjectiveDragPreview() {
    objectiveDrag?.preview?.remove();
  }

  function handleMindmapPointerDown(event) {
    if (objectiveView() !== "mindmap" || (event.button !== undefined && event.button !== 0)) {
      return;
    }

    const nodeElement = event.target.closest?.(".mindmap-node");
    if (!refs.objectiveMindmap?.contains(event.target)) {
      return;
    }

    if (!nodeElement) {
      mindmapPan = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        scrollLeft: refs.objectiveCanvas?.scrollLeft || 0,
        scrollTop: refs.objectiveCanvas?.scrollTop || 0,
        active: false
      };
      return;
    }

    const node = findObjective(nodeElement.dataset.id);
    if (!node) {
      return;
    }

    const layout = objectiveMindmapLayout(objectiveChildren(""));
    const position = layout.positions.get(node.id);
    if (!position) {
      return;
    }

    mindmapDrag = {
      id: node.id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      nodeX: position.x,
      nodeY: position.y,
      active: false,
      element: nodeElement
    };
  }

  function handleMindmapPointerMove(event) {
    if (mindmapPan && mindmapPan.pointerId === event.pointerId) {
      const distance = Math.hypot(event.clientX - mindmapPan.startX, event.clientY - mindmapPan.startY);
      if (!mindmapPan.active && distance < 3) {
        return;
      }

      event.preventDefault();
      mindmapPan.active = true;
      document.body.classList.add("is-mindmap-panning");

      if (refs.objectiveCanvas) {
        refs.objectiveCanvas.scrollLeft = mindmapPan.scrollLeft - (event.clientX - mindmapPan.startX);
        refs.objectiveCanvas.scrollTop = mindmapPan.scrollTop - (event.clientY - mindmapPan.startY);
      }
      return;
    }

    if (!mindmapDrag || mindmapDrag.pointerId !== event.pointerId) {
      return;
    }

    const distance = Math.hypot(event.clientX - mindmapDrag.startX, event.clientY - mindmapDrag.startY);
    if (!mindmapDrag.active && distance < 3) {
      return;
    }

    event.preventDefault();
    mindmapDrag.active = true;
    document.body.classList.add("is-mindmap-dragging");

    const node = findObjective(mindmapDrag.id);
    if (!node) {
      cancelMindmapPointer();
      return;
    }

    node.mapX = clamp(mindmapDrag.nodeX + event.clientX - mindmapDrag.startX, 8, 6000);
    node.mapY = clamp(mindmapDrag.nodeY + event.clientY - mindmapDrag.startY, 8, 6000);
    mindmapDrag.element.style.transform = `translate3d(${node.mapX}px, ${node.mapY}px, 0)`;
    mindmapDrag.element.classList.add("is-dragging");
    refreshMindmapLinks();
  }

  function endMindmapPointer(event) {
    if (mindmapPan && (!event || mindmapPan.pointerId === event.pointerId)) {
      document.body.classList.remove("is-mindmap-panning");
      mindmapPan = null;
      return;
    }

    if (!mindmapDrag || (event && mindmapDrag.pointerId !== event.pointerId)) {
      return;
    }

    const wasDragging = mindmapDrag.active;
    const id = mindmapDrag.id;
    if (!wasDragging && objectiveIsSelected(id) && objectiveSelectedIds().length === 1) {
      clearObjectiveSelection();
    } else {
      setObjectiveSelection([id]);
    }
    document.body.classList.remove("is-mindmap-dragging");
    mindmapDrag = null;

    if (wasDragging) {
      saveState({ immediate: true });
    }

    renderMap();
  }

  function cancelMindmapPointer() {
    if (mindmapPan) {
      document.body.classList.remove("is-mindmap-panning");
      mindmapPan = null;
    }

    if (!mindmapDrag) {
      return;
    }

    document.body.classList.remove("is-mindmap-dragging");
    mindmapDrag = null;
    renderMap();
  }

  function objectiveDragTargetFromItem(item) {
    const id = item?.dataset.objectiveId;
    const node = id ? findObjective(id) : null;
    const row = item?.querySelector(":scope > .objective-node");
    const box = row?.getBoundingClientRect();
    if (!node || !box) {
      return null;
    }

    return {
      id: node.id,
      parentId: node.parentId || "",
      top: box.top,
      bottom: box.bottom,
      height: box.height,
      midY: box.top + box.height / 2
    };
  }

  function objectiveDropModeForTarget(target, y) {
    if (!objectiveDrag || !target || target.id === objectiveDrag.id) {
      return "";
    }

    const upperEdge = target.top + target.height * 0.28;
    const lowerEdge = target.bottom - target.height * 0.28;
    if (objectiveCanMoveGroupInside(objectiveDrag.ids, target.id) && y >= upperEdge && y <= lowerEdge) {
      return "inside";
    }

    if (!objectiveCanMoveGroupToParent(objectiveDrag.ids, target.parentId || "")) {
      return "";
    }

    return y > target.midY ? "after" : "before";
  }

  function moveObjectivesNear(ids, targetId, after) {
    const movingIds = objectiveTopLevelIds(ids);
    const movingNodes = movingIds.map((id) => findObjective(id)).filter(Boolean);
    const target = findObjective(targetId);
    if (!movingNodes.length || !target) {
      return false;
    }

    const nextParentId = target.parentId || "";
    if (!objectiveCanMoveGroupToParent(movingIds, nextParentId)) {
      return false;
    }

    const movingSet = new Set(movingIds);
    const oldParentIds = new Set(movingNodes.map((node) => node.parentId || ""));
    const withoutDragged = objectiveChildren(nextParentId).filter((item) => !movingSet.has(item.id));
    const targetIndex = withoutDragged.findIndex((item) => item.id === targetId);

    if (targetIndex < 0) {
      return false;
    }

    const insertIndex = targetIndex + (after ? 1 : 0);
    const nextOrder = withoutDragged.slice();
    nextOrder.splice(insertIndex, 0, ...movingNodes);
    movingNodes.forEach((node) => {
      node.parentId = nextParentId;
    });
    resequenceObjectiveSiblings(nextOrder);
    oldParentIds.forEach((parentId) => {
      if (parentId !== nextParentId) {
        resequenceObjectiveSiblings(objectiveChildren(parentId).filter((item) => !movingSet.has(item.id)));
      }
    });
    movingIds.forEach(refreshObjectiveTaskPaths);

    setObjectiveSelection(movingIds);
    return true;
  }

  function moveObjectivesInside(ids, targetId) {
    const movingIds = objectiveTopLevelIds(ids);
    const movingNodes = movingIds.map((id) => findObjective(id)).filter(Boolean);
    const target = findObjective(targetId);
    if (!movingNodes.length || !target || !objectiveCanMoveGroupInside(movingIds, targetId)) {
      return false;
    }

    const movingSet = new Set(movingIds);
    const oldParentIds = new Set(movingNodes.map((node) => node.parentId || ""));
    const currentChildren = objectiveChildren(targetId);
    const currentMovingChildren = currentChildren.filter((item) => movingSet.has(item.id));
    const alreadyLastChildren =
      currentMovingChildren.length === movingNodes.length &&
      currentChildren.slice(-movingNodes.length).every((item, index) => item.id === movingNodes[index].id);
    const children = currentChildren.filter((item) => !movingSet.has(item.id));

    if (alreadyLastChildren) {
      setObjectiveSelection(movingIds);
      return false;
    }

    movingNodes.forEach((node) => {
      node.parentId = targetId;
    });
    children.push(...movingNodes);
    resequenceObjectiveSiblings(children);
    oldParentIds.forEach((parentId) => {
      if (parentId !== targetId) {
        resequenceObjectiveSiblings(objectiveChildren(parentId).filter((item) => !movingSet.has(item.id)));
      }
    });
    movingIds.forEach(refreshObjectiveTaskPaths);
    expandObjective(targetId);
    setObjectiveSelection(movingIds);
    return true;
  }

  function duplicateSelectedObjectives() {
    const sourceIds = objectiveTopLevelIds(objectiveSelectedIds());
    if (!sourceIds.length) {
      return;
    }

    const clones = [];
    const rootCloneBySource = new Map();
    const now = Date.now();

    sourceIds.forEach((id, sourceIndex) => {
      const source = findObjective(id);
      if (!source) {
        return;
      }

      const rootClone = cloneObjectiveBranch(source, source.parentId || "", clones, now + sourceIndex * 1000);
      rootCloneBySource.set(source.id, rootClone);
    });

    if (!clones.length) {
      return;
    }

    state.objectives.push(...clones);

    const cloneIds = new Set(clones.map((clone) => clone.id));
    const parentIds = new Set(sourceIds.map((id) => findObjective(id)?.parentId || ""));
    parentIds.forEach((parentId) => {
      const nextOrder = [];
      objectiveChildren(parentId).filter((node) => !cloneIds.has(node.id)).forEach((node) => {
        nextOrder.push(node);
        const clone = rootCloneBySource.get(node.id);
        if (clone) {
          nextOrder.push(clone);
        }
      });
      resequenceObjectiveSiblings(nextOrder);
    });

    setObjectiveSelection(Array.from(rootCloneBySource.values()).map((node) => node.id));
    objectiveMenuId = null;
    objectiveRenameId = null;
    objectiveDraftParentId = null;
    saveState({ immediate: true });
    render();
  }

  function cloneObjectiveBranch(source, parentId, clones, stamp) {
    const clone = {
      id: makeId(),
      parentId,
      text: source.text,
      kind: source.kind,
      taskId: "",
      masked: Boolean(source.masked),
      createdAt: stamp + clones.length + Math.random()
    };
    clones.push(clone);

    objectiveChildren(source.id).forEach((child) => {
      cloneObjectiveBranch(child, clone.id, clones, stamp);
    });

    return clone;
  }

  function resequenceObjectiveSiblings(items) {
    if (!items.length) {
      return;
    }

    const firstCreatedAt = Math.min(...items.map((item) => Number(item.createdAt) || Date.now()));
    items.forEach((item, index) => {
      const objective = findObjective(item.id);
      if (objective) {
        objective.createdAt = firstCreatedAt + index;
      }
    });
  }

  function objectiveTopLevelIds(ids) {
    const uniqueIds = Array.from(new Set(ids)).filter((id) => findObjective(id));
    const visibleOrder = allObjectiveIdsInOrder();
    return uniqueIds
      .filter((id) => !uniqueIds.some((otherId) => otherId !== id && objectiveIsDescendant(id, otherId)))
      .sort((a, b) => visibleOrder.indexOf(a) - visibleOrder.indexOf(b));
  }

  function allObjectiveIdsInOrder(parentId = "") {
    return objectiveChildren(parentId).flatMap((node) => [node.id, ...allObjectiveIdsInOrder(node.id)]);
  }

  function objectiveCanMoveGroupInside(ids, targetId) {
    const target = findObjective(targetId);
    return Boolean(
      target &&
      target.kind !== "task" &&
      !target.taskId &&
      objectiveCanMoveGroupToParent(ids, targetId)
    );
  }

  function objectiveCanMoveGroupToParent(ids, parentId) {
    const movingIds = objectiveTopLevelIds(ids);
    return Boolean(movingIds.length && movingIds.every((id) => objectiveCanMoveToParent(id, parentId)));
  }

  function objectiveCanMoveInside(id, targetId) {
    const target = findObjective(targetId);
    return Boolean(
      target &&
      target.kind !== "task" &&
      !target.taskId &&
      objectiveCanMoveToParent(id, targetId)
    );
  }

  function objectiveCanMoveToParent(id, parentId) {
    return Boolean(id && parentId !== id && !objectiveIsDescendant(parentId, id));
  }

  function objectiveIsDescendant(id, ancestorId) {
    let node = findObjective(id);
    const seen = new Set();

    while (node && !seen.has(node.id)) {
      if (node.parentId === ancestorId) {
        return true;
      }
      seen.add(node.id);
      node = node.parentId ? findObjective(node.parentId) : null;
    }

    return false;
  }

  function refreshObjectiveTaskPaths(rootId) {
    const affectedIds = new Set([rootId]);
    let changed = true;
    while (changed) {
      changed = false;
      state.objectives.forEach((item) => {
        if (!affectedIds.has(item.id) && affectedIds.has(item.parentId)) {
          affectedIds.add(item.id);
          changed = true;
        }
      });
    }

    state.objectives.forEach((item) => {
      if (!affectedIds.has(item.id) || !item.taskId) {
        return;
      }

      const task = findTask(item.taskId);
      if (task) {
        task.justification = objectivePath(item.id).join(" / ");
      }
    });
  }

  function closeObjectiveChromeOutside(event) {
    let changed = false;
    const closest = (selector) => event.target?.closest?.(selector);

    if (
      objectiveRootOpen &&
      !closest("#objectiveRootForm") &&
      !closest("#objectiveRootToggle")
    ) {
      objectiveRootOpen = false;
      refs.objectiveRootInput.value = "";
      changed = true;
    }

    if (objectiveMenuId && !closest(".objective-more-wrap")) {
      objectiveMenuId = null;
      changed = true;
    }

    if (changed) {
      renderMap();
    }
  }

  function objectiveIsCollapsed(id) {
    return (state.collapsedObjectives || []).includes(id);
  }

  function expandObjective(id, animate = false) {
    const wasCollapsed = objectiveIsCollapsed(id);
    state.collapsedObjectives = (state.collapsedObjectives || []).filter((item) => item !== id);
    closingObjectiveIds.delete(id);
    if (animate && wasCollapsed) {
      startBranchMotion(id, "opening");
    }
  }

  function toggleObjectiveBranch(id) {
    const collapsed = new Set(state.collapsedObjectives || []);
    if (collapsed.has(id)) {
      collapsed.delete(id);
      state.collapsedObjectives = Array.from(collapsed);
      startBranchMotion(id, "opening");
    } else {
      collapsed.add(id);
      if (objectiveDraftParentId === id) {
        objectiveDraftParentId = null;
      }
      state.collapsedObjectives = Array.from(collapsed);
      startBranchMotion(id, "closing");
    }

    saveState();
    render();
  }

  function startBranchMotion(id, direction) {
    window.clearTimeout(branchMotionTimers.get(id));
    openingObjectiveIds.delete(id);
    closingObjectiveIds.delete(id);

    if (direction === "opening") {
      openingObjectiveIds.add(id);
    } else {
      closingObjectiveIds.add(id);
    }

    branchMotionTimers.set(
      id,
      window.setTimeout(() => {
        openingObjectiveIds.delete(id);
        closingObjectiveIds.delete(id);
        branchMotionTimers.delete(id);
        render();
      }, BRANCH_MOTION_MS)
    );
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
    state.collapsedObjectives = (state.collapsedObjectives || []).filter((nodeId) => !removeIds.has(nodeId));
    removeIds.forEach((nodeId) => {
      window.clearTimeout(branchMotionTimers.get(nodeId));
      branchMotionTimers.delete(nodeId);
      openingObjectiveIds.delete(nodeId);
      closingObjectiveIds.delete(nodeId);
    });
    if (removeIds.has(objectiveDraftParentId)) {
      objectiveDraftParentId = null;
    }
    if (removeIds.has(objectiveMenuId)) {
      objectiveMenuId = null;
    }
    if (removeIds.has(objectiveRenameId)) {
      objectiveRenameId = null;
    }
    selectedObjectiveIds = new Set(Array.from(selectedObjectiveIds).filter((nodeId) => !removeIds.has(nodeId)));
    if (removeIds.has(selectedObjectiveId)) {
      selectedObjectiveId = deleted?.parentId || state.objectives[0]?.id || null;
      if (selectedObjectiveId) {
        selectedObjectiveIds.add(selectedObjectiveId);
      }
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
    setObjectiveSelection([node.id]);
    syncDraftFromTasks();
    state.currentPair = null;
    ensurePair();
    saveState({ immediate: true });
    render();
    return task;
  }

  function markObjectiveAsStep(objectiveId) {
    const node = findObjective(objectiveId);
    if (!node) {
      return;
    }

    const taskId = node.taskId;
    node.kind = "objective";
    node.taskId = "";
    setObjectiveSelection([node.id]);

    removePlainObjectiveTask(taskId, node);
    syncDraftFromTasks();
    state.currentPair = null;
    ensurePair();
    saveState({ immediate: true });
    render();
  }

  function removePlainObjectiveTask(taskId, node) {
    const task = taskId ? findTask(taskId) : null;
    if (!task) {
      return;
    }

    const linkedElsewhere = state.objectives.some((item) => item.id !== node.id && item.taskId === taskId);
    const hasProof = state.reputation.proofs.some((proof) => proof.taskId === taskId);
    const isPlainObjectiveTask =
      !linkedElsewhere &&
      !task.done &&
      !hasProof &&
      task.text.trim().toLowerCase() === node.text.trim().toLowerCase() &&
      task.justification.trim() === objectivePath(node.id).join(" / ");

    if (!isPlainObjectiveTask) {
      return;
    }

    state.tasks = state.tasks.filter((item) => item.id !== taskId);
    state.comparisons = state.comparisons.filter((item) => item.winnerId !== taskId && item.loserId !== taskId);
    state.pairHistory = state.pairHistory.filter((key) => !key.split(":").includes(taskId));
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

  function objectivePathNodesForTask(taskId) {
    const target = state.objectives.find((item) => item.taskId === taskId);
    if (!target) {
      return [];
    }

    const byId = new Map(state.objectives.map((node) => [node.id, node]));
    const path = [];
    const seen = new Set();
    let node = target;

    while (node && !seen.has(node.id)) {
      path.unshift(node);
      seen.add(node.id);
      node = byId.get(node.parentId);
    }

    return path;
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
    if (refs.repScore) {
      refs.repScore.textContent = String(stats.score);
    }
    if (refs.doneMetric) {
      refs.doneMetric.textContent = String(stats.done);
    }
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
    if (refs.publicScore) {
      refs.publicScore.textContent = String(snapshot.score);
    }
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
    const authReady = Boolean(supabaseClient);

    refs.accountName.textContent = recoveryMode
      ? "New password"
      : signedIn
        ? email
        : accountMode === "create"
          ? "Create Account"
          : "Sign in";
    refs.authForm.classList.toggle("is-hidden", signedIn || recoveryMode);
    refs.recoveryForm.classList.toggle("is-hidden", !recoveryMode);
    refs.accountActions.classList.toggle("is-hidden", !signedIn || recoveryMode);
    refs.signOutBtn.disabled = !signedIn;
    refs.signInBtn.disabled = !authReady;
    refs.signUpBtn.disabled = !authReady;
    refs.forgotPasswordBtn.disabled = !authReady;
    refs.savePasswordBtn.disabled = !authReady;
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
    main.appendChild(textNode);

    const actions = document.createElement("span");
    actions.className = "task-actions";

    const objectivePathNodes = objectivePathNodesForTask(task.id);
    const whyWrap = document.createElement("span");
    whyWrap.className = "why-wrap";

    const whyButton = document.createElement("button");
    whyButton.className = `row-meta${hasTaskContext(task) || objectivePathNodes.length ? " is-set" : ""}`;
    whyButton.type = "button";
    whyButton.dataset.action = "why";
    whyButton.dataset.id = task.id;
    whyButton.textContent = "Why";
    if (objectivePathNodes.length) {
      whyButton.setAttribute(
        "aria-label",
        `Why. Objective path: ${objectivePathNodes.map((node) => node.text).join(" to ")}`
      );
      whyWrap.append(whyButton, createWhyMapPreview(objectivePathNodes, task.id));
    } else {
      whyWrap.appendChild(whyButton);
    }

    const button = document.createElement("button");
    button.className = "row-action";
    button.type = "button";
    button.dataset.action = action;
    button.dataset.id = task.id;
    if (action === "restore") {
      button.textContent = "Undo";
    } else {
      button.classList.add("icon-control");
      button.setAttribute("aria-label", "Done");
      button.dataset.tooltip = "Done";
      button.appendChild(createControlIcon("check"));
    }

    actions.append(whyWrap, button);
    item.append(rankNode, main, actions);
    return item;
  }

  function createWhyMapPreview(nodes, taskId) {
    const preview = document.createElement("span");
    preview.className = "why-map-preview";
    preview.setAttribute("aria-hidden", "true");

    const path = document.createElement("span");
    path.className = "why-map-path";

    nodes.forEach((node, index) => {
      if (index > 0) {
        const connector = document.createElement("span");
        connector.className = "why-map-connector";
        path.appendChild(connector);
      }

      const item = document.createElement("span");
      item.className = "why-map-node";
      item.classList.toggle("is-root", index === 0);
      item.classList.toggle("is-task", node.taskId === taskId);

      const role = document.createElement("span");
      role.className = "why-map-role";
      role.textContent = node.taskId === taskId ? "Task" : index === 0 ? "Objective" : "Step";

      const label = document.createElement("span");
      label.className = "why-map-label";
      label.textContent = node.text;

      item.append(role, label);
      path.appendChild(item);
    });

    preview.appendChild(path);
    return preview;
  }

  function createControlIcon(name) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "control-icon");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");

    if (name === "plus") {
      const vertical = document.createElementNS("http://www.w3.org/2000/svg", "path");
      vertical.setAttribute("d", "M12 5v14");
      const horizontal = document.createElementNS("http://www.w3.org/2000/svg", "path");
      horizontal.setAttribute("d", "M5 12h14");
      svg.append(vertical, horizontal);
      return svg;
    }

    if (name === "more") {
      [7, 12, 17].forEach((cx) => {
        const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        dot.setAttribute("cx", String(cx));
        dot.setAttribute("cy", "12");
        dot.setAttribute("r", "1.6");
        svg.appendChild(dot);
      });
      return svg;
    }

    const paths = {
      chevron: ["m6 9 6 6 6-6"],
      check: ["m5 12 4 4 10-10"],
      list: ["M8 6h12", "M8 12h12", "M8 18h12", "M4 6h.01", "M4 12h.01", "M4 18h.01"],
      mindmap: ["M12 5v5", "M7 15h10", "M7 15v4", "M17 15v4", "M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4", "M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4", "M17 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4"],
      step: ["M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16"],
      task: ["M5 5h14v14H5z", "m8 9 2 2 4-4"],
      trash: ["M4 7h16", "M10 11v6", "M14 11v6", "M6 7l1 13h10l1-13", "M9 7V5h6v2"]
    };

    (paths[name] || []).forEach((d) => {
      const iconPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      iconPath.setAttribute("d", d);
      svg.appendChild(iconPath);
    });
    return svg;
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
      const snapshot = {
        taskId: task.id,
        done: task.done,
        doneAt: task.doneAt
      };
      task.done = true;
      task.doneAt = Date.now();
      openProofDialog(task, { cancelSnapshot: snapshot });
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

  function openProofDialog(task, options = {}) {
    proofTaskId = task.id;
    proofCancelSnapshot = options.cancelSnapshot || null;
    refs.proofTask.textContent = task.text;
    refs.proofEvidence.value = latestProofForTask(task.id)?.evidence || "";

    if (typeof refs.proofDialog.showModal === "function") {
      refs.proofDialog.showModal();
      refs.proofEvidence.focus();
    }
  }

  function closeProofDialog() {
    proofTaskId = null;
    proofCancelSnapshot = null;
    if (refs.proofDialog.open) {
      refs.proofDialog.close();
    }
  }

  function cancelProofDialog(event) {
    event?.preventDefault();
    const snapshot = proofCancelSnapshot;

    if (snapshot) {
      const task = findTask(snapshot.taskId);
      if (task) {
        task.done = Boolean(snapshot.done);
        task.doneAt = snapshot.doneAt || null;
      }

      state.currentPair = null;
      ensurePair();
      saveState();
    }

    closeProofDialog();
    render();
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
    selectedObjectiveIds.clear();
    objectiveRootOpen = false;
    objectiveMenuId = null;
    objectiveRenameId = null;
    mindmapDrag = null;
    mindmapPan = null;
    document.body.classList.remove("is-mindmap-dragging", "is-mindmap-panning");
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
    selectedObjectiveIds.clear();
    objectiveRootOpen = false;
    objectiveMenuId = null;
    objectiveRenameId = null;
    mindmapDrag = null;
    mindmapPan = null;
    document.body.classList.remove("is-mindmap-dragging", "is-mindmap-panning");
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
