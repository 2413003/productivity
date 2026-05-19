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
    taskInput: document.getElementById("taskInput"),
    draftCount: document.getElementById("draftCount"),
    manualModeBtn: document.getElementById("manualModeBtn"),
    powerModeBtn: document.getElementById("powerModeBtn"),
    powerContextBtn: document.getElementById("powerContextBtn"),
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
    whyTime: document.getElementById("whyTime"),
    whyMoney: document.getElementById("whyMoney"),
    whyEffort: document.getElementById("whyEffort"),
    whyPowerFields: document.getElementById("whyPowerFields"),
    whyPowerRead: document.getElementById("whyPowerRead"),
    cancelWhyBtn: document.getElementById("cancelWhyBtn"),
    powerDialog: document.getElementById("powerDialog"),
    powerForm: document.getElementById("powerForm"),
    powerNorthStar: document.getElementById("powerNorthStar"),
    powerDefinition: document.getElementById("powerDefinition"),
    powerAssets: document.getElementById("powerAssets"),
    powerConstraints: document.getElementById("powerConstraints"),
    powerAvoid: document.getElementById("powerAvoid"),
    powerHorizon: document.getElementById("powerHorizon"),
    cancelPowerBtn: document.getElementById("cancelPowerBtn"),
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
  let activeView = backendConfigured() ? "account" : state.tasks.length ? "focus" : "input";
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
  let cloudSchema = {
    profilePower: null,
    taskLevel: null
  };

  init();

  function init() {
    refs.viewButtons.forEach((button) => {
      button.addEventListener("click", () => setView(button.dataset.viewButton));
    });

    refs.taskInput.addEventListener("input", saveDraftInput);
    refs.startBtn.addEventListener("click", () => applyTasks("choose"));
    refs.manualModeBtn.addEventListener("click", () => setRankMode("manual"));
    refs.powerModeBtn.addEventListener("click", () => setRankMode("power"));
    refs.powerContextBtn.addEventListener("click", openPowerDialog);

    refs.choiceA.addEventListener("click", () => chooseCurrent(0));
    refs.choiceB.addEventListener("click", () => chooseCurrent(1));
    refs.skipBtn.addEventListener("click", skipCurrent);
    refs.undoBtn.addEventListener("click", undoChoice);
    refs.finishBtn.addEventListener("click", () => setView("focus"));

    refs.lessTop.addEventListener("click", () => setTopCount(-1));
    refs.moreTop.addEventListener("click", () => setTopCount(1));
    refs.keepChoosing.addEventListener("click", () => {
      if (currentRankMode() === "power") {
        openPowerDialog();
        return;
      }

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
    refs.whyTime.addEventListener("change", updateWhyPowerRead);
    refs.whyMoney.addEventListener("change", updateWhyPowerRead);
    refs.whyEffort.addEventListener("change", updateWhyPowerRead);
    refs.cancelWhyBtn.addEventListener("click", closeWhyDialog);
    refs.powerForm.addEventListener("submit", savePowerProfile);
    refs.cancelPowerBtn.addEventListener("click", closePowerDialog);
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
    if (!saved || !Array.isArray(saved.tasks)) {
      return base;
    }

      return {
        ...base,
        ...saved,
        draftText: typeof saved.draftText === "string" ? saved.draftText : "",
        topCount: clamp(Number(saved.topCount) || 3, 1, 99),
      totalTaps: Number(saved.totalTaps) || 0,
      sprintStartTaps: Number(saved.sprintStartTaps) || 0,
      tasks: saved.tasks
        .filter((task) => task && typeof task.text === "string")
        .map((task) => ({
          id: task.id || makeId(),
          text: task.text.trim(),
          justification: typeof task.justification === "string" ? task.justification.trim() : "",
          powerTime: normalizePowerLevel(task.powerTime),
          powerMoney: normalizePowerLevel(task.powerMoney),
          powerEffort: normalizePowerLevel(task.powerEffort),
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
  }

  function freshState() {
    return {
      tasks: [],
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
      allowFriendRequests: source.allowFriendRequests !== false,
      rankMode: normalizeRankMode(source.rankMode),
      powerNorthStar: typeof source.powerNorthStar === "string" ? source.powerNorthStar.trim() : "",
      powerDefinition: typeof source.powerDefinition === "string" ? source.powerDefinition.trim() : "",
      powerAssets: typeof source.powerAssets === "string" ? source.powerAssets.trim() : "",
      powerConstraints: typeof source.powerConstraints === "string" ? source.powerConstraints.trim() : "",
      powerAvoid: typeof source.powerAvoid === "string" ? source.powerAvoid.trim() : "",
      powerHorizon: normalizePowerHorizon(source.powerHorizon)
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
    return ["input", "choose", "focus", "reputation"].includes(view);
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

    const targetPayload = cloudSchema.profilePower === false ? legacyPayload : payload;
    let { error } = await supabaseClient.from(TABLES.profiles).update(targetPayload).eq("id", ownerId);

    if (error && isMissingColumnError(error) && cloudSchema.profilePower !== false) {
      cloudSchema.profilePower = false;
      ({ error } = await supabaseClient.from(TABLES.profiles).update(legacyPayload).eq("id", ownerId));
    } else if (!error) {
      cloudSchema.profilePower = targetPayload === payload;
    }

    if (error) {
      throw error;
    }
  }

  async function upsertCloudTasks(fullRecords, whyRecords, basicRecords) {
    const levels =
      cloudSchema.taskLevel === "basic"
        ? [{ level: "basic", records: basicRecords }]
        : cloudSchema.taskLevel === "why"
          ? [
              { level: "why", records: whyRecords },
              { level: "basic", records: basicRecords }
            ]
          : [
              { level: "full", records: fullRecords },
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
    const powerSelect =
      "display_name,username,bio,avatar_url,profile_visibility,proof_visibility,discoverable,allow_friend_requests,task_draft,rank_mode,power_north_star,power_definition,power_assets,power_constraints,power_avoid,power_horizon";
    const legacySelect =
      "display_name,username,bio,avatar_url,profile_visibility,proof_visibility,discoverable,allow_friend_requests";
    const select = cloudSchema.profilePower === false ? legacySelect : powerSelect;
    let result = await supabaseClient.from(TABLES.profiles).select(select).eq("id", ownerId).single();

    if (result.error && isMissingColumnError(result.error) && cloudSchema.profilePower !== false) {
      cloudSchema.profilePower = false;
      result = await supabaseClient.from(TABLES.profiles).select(legacySelect).eq("id", ownerId).single();
    } else if (!result.error) {
      cloudSchema.profilePower = select === powerSelect;
    }

    return {
      ...result,
      powerFields: cloudSchema.profilePower !== false
    };
  }

  async function fetchCloudTasks(ownerId) {
    const selects =
      cloudSchema.taskLevel === "basic"
        ? [{ level: "basic", select: "id,text,score,wins,losses,seen,done,done_at,created_at" }]
        : cloudSchema.taskLevel === "why"
          ? [
              { level: "why", select: "id,text,justification,score,wins,losses,seen,done,done_at,created_at" },
              { level: "basic", select: "id,text,score,wins,losses,seen,done,done_at,created_at" }
            ]
          : [
              {
                level: "full",
                select:
                  "id,text,justification,power_time,power_money,power_effort,score,wins,losses,seen,done,done_at,created_at"
              },
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
          hasJustification: option.level !== "basic",
          powerFields: option.level === "full"
        };
      }

      if (!isMissingColumnError(result.error) || option.level === "basic") {
        return {
          ...result,
          hasJustification: option.level !== "basic",
          powerFields: option.level === "full"
        };
      }
    }

    return { data: [], error: null, hasJustification: false, powerFields: false };
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
      rank_mode: currentRankMode(),
      power_north_star: profile.powerNorthStar || "",
      power_definition: profile.powerDefinition || "",
      power_assets: profile.powerAssets || "",
      power_constraints: profile.powerConstraints || "",
      power_avoid: profile.powerAvoid || "",
      power_horizon: profile.powerHorizon || "2y"
    });

    if (state.tasks.length) {
      await upsertCloudTasks(
        state.tasks.map((task) => taskRecord(task, ownerId)),
        state.tasks.map((task) => legacyTaskRecord(task, ownerId)),
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
        powerTime: tasksResult.powerFields
          ? normalizePowerLevel(task.power_time)
          : normalizePowerLevel(localTask?.powerTime),
        powerMoney: tasksResult.powerFields
          ? normalizePowerLevel(task.power_money)
          : normalizePowerLevel(localTask?.powerMoney),
        powerEffort: tasksResult.powerFields
          ? normalizePowerLevel(task.power_effort)
          : normalizePowerLevel(localTask?.powerEffort),
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
      allowFriendRequests: profileResult.data.allow_friend_requests !== false,
      rankMode: profileResult.powerFields ? profileResult.data.rank_mode : localFallback?.reputation?.profile?.rankMode,
      powerNorthStar: profileResult.powerFields
        ? profileResult.data.power_north_star || ""
        : localFallback?.reputation?.profile?.powerNorthStar || "",
      powerDefinition: profileResult.powerFields
        ? profileResult.data.power_definition || ""
        : localFallback?.reputation?.profile?.powerDefinition || "",
      powerAssets: profileResult.powerFields
        ? profileResult.data.power_assets || ""
        : localFallback?.reputation?.profile?.powerAssets || "",
      powerConstraints: profileResult.powerFields
        ? profileResult.data.power_constraints || ""
        : localFallback?.reputation?.profile?.powerConstraints || "",
      powerAvoid: profileResult.powerFields
        ? profileResult.data.power_avoid || ""
        : localFallback?.reputation?.profile?.powerAvoid || "",
      powerHorizon: profileResult.powerFields
        ? profileResult.data.power_horizon || "2y"
        : localFallback?.reputation?.profile?.powerHorizon || "2y"
    });
    const cloudDraft = profileResult.powerFields && typeof profileResult.data.task_draft === "string"
      ? profileResult.data.task_draft
      : "";
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
    const localProofs = localFallback?.reputation?.proofs || [];
    const localSupporters = localFallback?.reputation?.supporters || [];
    const mergedTasks = mergeTaskLists(cloudTasks, localTasks);
    const mergedProofs = mergeById(cloudProofs, localProofs);
    const mergedSupporters = mergeById(cloudSupporters, localSupporters);
    const localAddedTasks = mergedTasks.length > cloudTasks.length;
    const localAddedProofs = mergedProofs.length > cloudProofs.length;
    const localAddedSupporters = mergedSupporters.length > cloudSupporters.length;
    const shouldKeepLocal = !cloudTasks.length && localTasks.length > 0;

    if (shouldKeepLocal) {
      state = {
        ...localFallback,
        tasks: mergedTasks,
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
      power_time: normalizePowerLevel(task.powerTime),
      power_money: normalizePowerLevel(task.powerMoney),
      power_effort: normalizePowerLevel(task.powerEffort),
      score: task.score,
      wins: task.wins,
      losses: task.losses,
      seen: task.seen,
      done: task.done,
      done_at: toIso(task.doneAt),
      created_at: toIso(task.createdAt)
    };
  }

  function legacyTaskRecord(task, ownerId) {
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
        powerTime: normalizePowerLevel(task.powerTime),
        powerMoney: normalizePowerLevel(task.powerMoney),
        powerEffort: normalizePowerLevel(task.powerEffort),
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

  function combineTasks(target, source) {
    target.text = target.text || source.text;
    target.justification = target.justification || source.justification || "";
    target.powerTime = target.powerTime === 3 ? normalizePowerLevel(source.powerTime) : target.powerTime;
    target.powerMoney = target.powerMoney === 3 ? normalizePowerLevel(source.powerMoney) : target.powerMoney;
    target.powerEffort = target.powerEffort === 3 ? normalizePowerLevel(source.powerEffort) : target.powerEffort;
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
      avatarUrl: local.avatarUrl || cloud.avatarUrl,
      rankMode: cloud.rankMode,
      powerNorthStar: cloud.powerNorthStar || local.powerNorthStar,
      powerDefinition: cloud.powerDefinition || local.powerDefinition,
      powerAssets: cloud.powerAssets || local.powerAssets,
      powerConstraints: cloud.powerConstraints || local.powerConstraints,
      powerAvoid: cloud.powerAvoid || local.powerAvoid,
      powerHorizon: cloud.powerHorizon || local.powerHorizon
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
    return (
      hasJustification(task) ||
      normalizePowerLevel(task?.powerTime) !== 3 ||
      normalizePowerLevel(task?.powerMoney) !== 3 ||
      normalizePowerLevel(task?.powerEffort) !== 3
    );
  }

  function currentRankMode() {
    return normalizeRankMode(state.reputation.profile?.rankMode);
  }

  function setRankMode(mode) {
    const nextMode = normalizeRankMode(mode);
    if (currentRankMode() === nextMode) {
      render();
      return;
    }

    state.reputation.profile = {
      ...state.reputation.profile,
      rankMode: nextMode
    };

    if (nextMode === "power" && activeView === "choose") {
      activeView = "focus";
    }

    saveState({ immediate: true });
    render();
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
    if (signInRequired() && isAccountDataView(nextView)) {
      activeView = "account";
      render();
      return;
    }

    if (activeView === "input" && nextView !== "input" && draftChanged()) {
      applyTasks(nextView);
      return;
    }

    if (nextView === "choose" && currentRankMode() === "power") {
      activeView = "focus";
      render();
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
      const hideForMode = view === "choose" && currentRankMode() === "power";
      button.classList.toggle("is-hidden", hideForAuth || hideForMode);
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
    const text = state.draftText || state.tasks.map((task) => task.text).join("\n");
    const inputIsActive = document.activeElement === refs.taskInput;

    if (!inputIsActive && text !== lastSyncedInput) {
      refs.taskInput.value = text;
      lastSyncedInput = text;
    }

    refs.manualModeBtn.setAttribute("aria-current", currentRankMode() === "manual" ? "true" : "false");
    refs.powerModeBtn.setAttribute("aria-current", currentRankMode() === "power" ? "true" : "false");
    refs.powerContextBtn.classList.toggle("is-hidden", currentRankMode() !== "power");
    refs.startBtn.textContent = currentRankMode() === "power" ? "Rank" : "Start";
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
    const powerMode = currentRankMode() === "power";

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

    refs.keepChoosing.textContent = powerMode ? "Context" : "Choose";
    refs.keepChoosing.disabled = powerMode ? false : activeTasks().length < 2;
    refs.resetRank.classList.toggle("is-hidden", powerMode);
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

    const textNode = document.createElement("span");
    textNode.className = "task-text";
    textNode.textContent = task.text;

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
    item.append(rankNode, textNode, actions);
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
        powerTime: 3,
        powerMoney: 3,
        powerEffort: 3,
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

    if (currentRankMode() === "power") {
      activeView = "focus";
    } else if (activeTasks().length > 1 && preferredView !== "focus") {
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
    refs.whyTime.value = String(normalizePowerLevel(task.powerTime));
    refs.whyMoney.value = String(normalizePowerLevel(task.powerMoney));
    refs.whyEffort.value = String(normalizePowerLevel(task.powerEffort));
    refs.whyPowerFields.classList.toggle("is-hidden", currentRankMode() !== "power");
    updateWhyPowerRead();

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

  function openPowerDialog() {
    const profile = state.reputation.profile;
    refs.powerNorthStar.value = profile.powerNorthStar || "";
    refs.powerDefinition.value = profile.powerDefinition || "";
    refs.powerAssets.value = profile.powerAssets || "";
    refs.powerConstraints.value = profile.powerConstraints || "";
    refs.powerAvoid.value = profile.powerAvoid || "";
    refs.powerHorizon.value = profile.powerHorizon || "2y";

    if (typeof refs.powerDialog.showModal === "function") {
      refs.powerDialog.showModal();
      refs.powerNorthStar.focus();
    }
  }

  function closePowerDialog() {
    if (refs.powerDialog.open) {
      refs.powerDialog.close();
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
    task.powerTime = normalizePowerLevel(refs.whyTime.value);
    task.powerMoney = normalizePowerLevel(refs.whyMoney.value);
    task.powerEffort = normalizePowerLevel(refs.whyEffort.value);
    closeWhyDialog();
    saveState();
    render();
  }

  function savePowerProfile(event) {
    event.preventDefault();

    state.reputation.profile = {
      ...state.reputation.profile,
      powerNorthStar: refs.powerNorthStar.value.trim(),
      powerDefinition: refs.powerDefinition.value.trim(),
      powerAssets: refs.powerAssets.value.trim(),
      powerConstraints: refs.powerConstraints.value.trim(),
      powerAvoid: refs.powerAvoid.value.trim(),
      powerHorizon: normalizePowerHorizon(refs.powerHorizon.value)
    };

    closePowerDialog();
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
    if (currentRankMode() === "power") {
      return;
    }

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
    activeView = "input";
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
    if (currentRankMode() === "power") {
      return state.tasks
        .map((task) => ({
          task,
          powerScore: powerScoreForTask(task)
        }))
        .sort((a, b) => {
          if (a.task.done !== b.task.done) {
            return a.task.done ? 1 : -1;
          }

          return b.powerScore - a.powerScore || a.task.createdAt - b.task.createdAt;
        })
        .map((entry) => entry.task);
    }

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

  function normalizeRankMode(value) {
    return value === "power" ? "power" : "manual";
  }

  function normalizePowerHorizon(value) {
    return ["6m", "2y", "5y"].includes(value) ? value : "2y";
  }

  function normalizePowerLevel(value) {
    const level = Number(value);
    return level === 1 || level === 3 || level === 5 ? level : 3;
  }

  function updateWhyPowerRead() {
    const task = findTask(whyTaskId);
    const preview = {
      ...(task || {}),
      justification: refs.whyInput.value.trim(),
      powerTime: normalizePowerLevel(refs.whyTime.value),
      powerMoney: normalizePowerLevel(refs.whyMoney.value),
      powerEffort: normalizePowerLevel(refs.whyEffort.value)
    };

    refs.whyPowerRead.textContent =
      currentRankMode() === "power" ? powerReasonForTask(preview) : powerResourceSummary(preview);
  }

  function powerScoreForTask(task) {
    return analyzePowerTask(task).score;
  }

  function powerReasonForTask(task) {
    return analyzePowerTask(task).reason;
  }

  function analyzePowerTask(task) {
    const profile = normalizeProfile(state.reputation.profile);
    const content = [task?.text || "", task?.justification || ""].join(" ").toLowerCase();
    const contextTerms = extractMeaningfulTerms(
      [profile.powerNorthStar, profile.powerDefinition, profile.powerAssets].join(" ")
    );
    const assetTerms = extractMeaningfulTerms(profile.powerAssets);
    const avoidTerms = extractMeaningfulTerms(profile.powerAvoid);
    const powerWords = {
      systems: ["system", "automate", "automation", "template", "workflow", "process", "tool", "script", "delegate", "document", "pipeline"],
      assets: ["build", "create", "asset", "product", "offer", "brand", "portfolio", "list", "newsletter", "channel", "audience", "library"],
      money: ["sell", "sales", "client", "customer", "invoice", "proposal", "pricing", "revenue", "cash", "lead", "outreach", "deal"],
      distribution: ["publish", "post", "launch", "video", "youtube", "tiktok", "instagram", "podcast", "share", "email"],
      learning: ["learn", "study", "practice", "train", "read", "research", "prototype", "test"],
      relationships: ["call", "meet", "message", "reach out", "follow up", "follow-up", "network", "mentor", "partner", "collaborate", "hire"],
      health: ["sleep", "exercise", "workout", "walk", "run", "gym", "meditate", "meal", "cook", "health"],
      maintenance: ["clean", "tidy", "admin", "inbox", "errand", "chores", "shopping", "paperwork", "booking", "schedule", "meeting", "reply"],
      drain: ["scroll", "doomscroll", "netflix", "tv", "game", "gaming", "browse"]
    };
    const hits = Object.fromEntries(
      Object.entries(powerWords).map(([key, phrases]) => [key, countPhraseHits(content, phrases)])
    );
    const alignmentHits = countPhraseHits(content, contextTerms);
    const assetHits = countPhraseHits(content, assetTerms);
    const avoidHits = countPhraseHits(content, avoidTerms);
    const horizon = normalizePowerHorizon(profile.powerHorizon);
    const horizonWeight =
      horizon === "6m"
        ? { systems: 10, assets: 12, money: 18, distribution: 14, learning: 6, relationships: 10, health: 8 }
        : horizon === "5y"
          ? { systems: 18, assets: 16, money: 10, distribution: 8, learning: 14, relationships: 13, health: 16 }
          : { systems: 15, assets: 14, money: 14, distribution: 11, learning: 10, relationships: 11, health: 12 };
    const valueScore =
      hits.systems * horizonWeight.systems +
      hits.assets * horizonWeight.assets +
      hits.money * horizonWeight.money +
      hits.distribution * horizonWeight.distribution +
      hits.learning * horizonWeight.learning +
      hits.relationships * horizonWeight.relationships +
      hits.health * horizonWeight.health +
      alignmentHits * 8 +
      assetHits * 6;
    const sustainabilityScore = hits.systems * 7 + hits.learning * 5 + hits.relationships * 4 + hits.health * 7;
    const maintenancePenalty = hits.maintenance * 10 + hits.drain * 18 + avoidHits * 12;
    const powerTime = normalizePowerLevel(task?.powerTime);
    const powerMoney = normalizePowerLevel(task?.powerMoney);
    const powerEffort = normalizePowerLevel(task?.powerEffort);
    const resourcePenalty = powerTime * 7 + powerMoney * 6 + powerEffort * 8;
    const efficiencyBonus = powerTime + powerMoney + powerEffort <= 5 ? 12 : powerTime + powerMoney + powerEffort <= 8 ? 6 : 0;
    const score = Math.round(
      100 + valueScore + sustainabilityScore + efficiencyBonus - maintenancePenalty - resourcePenalty
    );
    const strongestTheme =
      [
        ["systems", hits.systems],
        ["assets", hits.assets],
        ["money", hits.money],
        ["distribution", hits.distribution],
        ["learning", hits.learning],
        ["relationships", hits.relationships],
        ["health", hits.health]
      ].sort((a, b) => b[1] - a[1])[0][0];
    const themeCopy = {
      systems: "Compounding system.",
      assets: "Builds an asset.",
      money: "Strong payoff path.",
      distribution: "Grows reach.",
      learning: "Builds skill.",
      relationships: "Expands relationships.",
      health: "Protects energy."
    };
    const stance =
      maintenancePenalty > valueScore
        ? "Lower leverage."
        : alignmentHits > 0
          ? "Fits your direction."
          : themeCopy[strongestTheme];
    const reason = `${stance} ${powerResourceSummary({ powerTime, powerMoney, powerEffort })}`;

    return { score, reason };
  }

  function powerResourceSummary(task) {
    const bits = [
      `Time ${powerLevelLabel(task?.powerTime)}`,
      `money ${powerLevelLabel(task?.powerMoney)}`,
      `effort ${powerLevelLabel(task?.powerEffort)}`
    ];
    return bits.join(", ") + ".";
  }

  function powerLevelLabel(value) {
    const level = normalizePowerLevel(value);
    if (level === 1) {
      return "low";
    }

    if (level === 5) {
      return "high";
    }

    return "medium";
  }

  function countPhraseHits(text, phrases) {
    return phrases.reduce((count, phrase) => {
      if (!phrase || phrase.length < 3) {
        return count;
      }

      return text.includes(String(phrase).toLowerCase()) ? count + 1 : count;
    }, 0);
  }

  function extractMeaningfulTerms(value) {
    const stopwords = new Set([
      "about",
      "after",
      "again",
      "along",
      "because",
      "before",
      "between",
      "could",
      "doing",
      "from",
      "have",
      "into",
      "long",
      "make",
      "more",
      "most",
      "need",
      "only",
      "over",
      "same",
      "should",
      "some",
      "than",
      "that",
      "them",
      "then",
      "there",
      "these",
      "they",
      "this",
      "want",
      "with",
      "your"
    ]);

    return Array.from(
      new Set(
        String(value || "")
          .toLowerCase()
          .split(/[^a-z0-9]+/)
          .map((part) => part.trim())
          .filter((part) => part.length >= 4 && !stopwords.has(part))
      )
    );
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
