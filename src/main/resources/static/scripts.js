/* =====================================================
   UTILITIES
===================================================== */
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

/* =====================================================
   PREVENT BACK NAVIGATION (LOGIN SAFE)
===================================================== */
history.pushState(null, null, location.href);
window.onpopstate = () => history.pushState(null, null, location.href);

/* =====================================================
   GLOBAL STATE
===================================================== */
const state = {
    email: localStorage.getItem("loggedInEmail"),
    username: localStorage.getItem("loggedInUserName"),
    isGuest: !localStorage.getItem("loggedInEmail")
};

// Notification polling handle (poll only while notifications section is open)
let _notificationPollId = null;
// Global notification poll (for logged-in users to receive new notifications without reload)
let _globalNotificationPollId = null;
// Server-Sent Events source
let _sseSource = null;


/* =====================================================
   SECTION NAVIGATION
===================================================== */
function showSection(sectionId) {
    $$("main > section").forEach(sec => {
        sec.style.display = "none";
        sec.classList.remove("active-section");
    });

    const target = document.getElementById(sectionId);
    if (!target) return;

    target.style.display = "block";
    target.classList.add("active-section");
    setActiveSidebar(sectionId);

    // Show top course search bar ONLY on courses & home sections
    const headerSearch = $("#header-search-courses");
    if (headerSearch) {
        if (sectionId === 'courses' || sectionId === 'home') {
            headerSearch.style.display = "inline-block";
        } else {
            headerSearch.style.display = "none";
        }
    }

    if (sectionId === 'settings') {
        populateSettings();
    }
    if (sectionId === 'dashboard') {
        populateDashboard();
    }
}

function setActiveSidebar(sectionId) {
    $$(".sidebar .nav-link").forEach(link => link.classList.remove("active"));
    const active = document.querySelector(`.sidebar .nav-link[data-section="${sectionId}"]`);
    if (active) active.classList.add("active");
}

function initCourseSearch() {
    const searchInput = $("#header-search-courses");
    if (!searchInput) return;

    searchInput.addEventListener("input", () => {
        const query = searchInput.value.trim().toLowerCase();
        const courseCards = $$(".domain-card, .track-card, .course-card, #courses .course");

        courseCards.forEach(card => {
            const text = card.textContent.toLowerCase();
            if (!query || text.includes(query)) {
                card.style.display = "";
            } else {
                card.style.display = "none";
            }
        });

        // If searching while not on home/courses, auto-switch to courses
        if (query && !document.getElementById("courses")?.classList.contains("active-section") && !document.getElementById("home")?.classList.contains("active-section")) {
            showSection("courses");
        }
    });
}
document.addEventListener("DOMContentLoaded", initCourseSearch);

/* =====================================================
   PROTECTED SECTIONS (GUEST MODE)
===================================================== */
function openProtectedSection(sectionId) {
    const protectedSections = [
        "compiler",
        "visualizer",
        "notifications",
        "user-communication",
        "dashboard"
    ];

    if (state.isGuest && protectedSections.includes(sectionId)) {
        showGuestMessage();
        return;
    }
    showSection(sectionId);

    if (sectionId === 'user-communication') {
        showChat('public');
    }

    // when dashboard section is opened, fetch scores
    if (sectionId === 'dashboard') {
        populateDashboard();
    }

    // when settings section is opened, populate user profile
    if (sectionId === 'settings') {
        populateSettings();
    }

    // when notifications section is opened, fetch notifications
    if (sectionId === 'notifications') {
        loadNotifications();
        startNotificationPolling();
    } else {
        stopNotificationPolling();
    }
}

function populateSettings() {
    const username = localStorage.getItem("loggedInUserName") || localStorage.getItem("userName") || localStorage.getItem("username") || state.username || "Developer";
    const email = localStorage.getItem("loggedInEmail") || localStorage.getItem("userEmail") || localStorage.getItem("email") || state.email || "student@campus.edu";
    const initials = getInitials(username);

    const nameEl = document.getElementById("settings-username");
    const emailEl = document.getElementById("settings-email");
    const avatarEl = document.getElementById("settings-avatar-bubble");
    const nameVal = document.getElementById("settings-username-val");
    const emailVal = document.getElementById("settings-email-val");

    if (nameEl) nameEl.textContent = username;
    if (emailEl) emailEl.textContent = email;
    if (avatarEl) avatarEl.textContent = initials;
    if (nameVal) nameVal.textContent = username;
    if (emailVal) emailVal.textContent = email;
}

function showProLearnerInfo() {
    alert(
        "✨ Pro Learner Access Perks:\n\n" +
        "1. 📚 Full Access to Java, Python & SQL Masterclasses.\n" +
        "2. ⚡ All 6 Interactive Code & Algorithm Visualizers.\n" +
        "3. 🚀 Multi-Language Compiler & Live Code Room Hosting.\n" +
        "4. 💬 Campus Messenger Hub (Direct Chat, Community Lounge & Live Presence).\n" +
        "5. 🏆 Verified Quiz Performance & Global Leaderboard Ranking."
    );
}

/**
 * Load and display notifications for the user.
 */
let _lastNotificationsHash = null;

async function loadNotifications(force = false) {
    const notificationList = $("#notification-list");
    const noMessageDiv = $("#no-notification-message");

    if (!notificationList) return;

    try {
        const res = await fetch("/api/notifications");
        if (!res.ok) throw new Error(`Server responded ${res.status}`);
        const notifications = await res.json();

        // Check if data changed
        const newHash = JSON.stringify(notifications);
        if (!force && newHash === _lastNotificationsHash) return;
        _lastNotificationsHash = newHash;

        notificationList.innerHTML = "";
        if (noMessageDiv) noMessageDiv.style.display = "none";

        // get dismissed notifications for current user
        let dismissedIds = [];
        if (state.email) {
            try {
                const dismissRes = await fetch(`/api/dismissed-notifications?email=${encodeURIComponent(state.email)}`);
                if (dismissRes.ok) {
                    dismissedIds = await dismissRes.json();
                }
            } catch (err) {
                console.warn('Could not fetch dismissed notifications:', err);
            }
        }

        let localDismissed = [];
        const userEmailKey = state.email || localStorage.getItem("loggedInEmail") || 'guest';
        try {
            localDismissed = JSON.parse(localStorage.getItem(`dismissed_notifs_${userEmailKey}`) || "[]");
        } catch(e) {}

        const activeNotifications = (notifications || []).filter(notif => 
            !dismissedIds.includes(notif.id) && !localDismissed.includes(notif.id)
        );

        if (!activeNotifications || activeNotifications.length === 0) {
            if (noMessageDiv) {
                noMessageDiv.innerHTML = `
                    <div class="empty-chat-state">
                        <span class="empty-icon">🎉</span>
                        <h4>All caught up!</h4>
                        <p>No new campus notifications or announcements at this time.</p>
                    </div>
                `;
                noMessageDiv.style.display = "block";
            }
            return;
        }

        // render each notification
        activeNotifications.forEach(notif => {
            const notifCard = document.createElement("div");
            notifCard.className = "notif-item-card";
            const createdAt = new Date(notif.createdAt).toLocaleString();
            const title = notif.contentTitle || "Notification";
            const content = notif.content || "No details available.";

            // Pick icon based on title keywords
            let icon = '🔔';
            const titleLower = title.toLowerCase();
            if (titleLower.includes('quiz') || titleLower.includes('score') || titleLower.includes('badge')) icon = '🏆';
            if (titleLower.includes('room') || titleLower.includes('compiler') || titleLower.includes('code')) icon = '💻';
            if (titleLower.includes('admin') || titleLower.includes('announcement') || titleLower.includes('campus')) icon = '📢';

            notifCard.innerHTML = `
                <div class="notif-card-inner">
                    <div class="notif-icon-badge">${icon}</div>
                    <div class="notif-card-content">
                        <div class="notif-card-header">
                            <h4>${escapeHtml(title)}</h4>
                            <span class="notif-time">${createdAt}</span>
                        </div>
                        <p class="notif-body">${escapeHtml(content)}</p>
                    </div>
                    <button class="notif-dismiss-btn" onclick="dismissNotification(${notif.id}, event)" title="Dismiss Notification">×</button>
                </div>
            `;
            notificationList.appendChild(notifCard);
        });
    } catch (err) {
        console.error("Failed to load notifications:", err);
        if (notificationList) {
            notificationList.innerHTML = "<p class='error'>Unable to load notifications. Please try again later.</p>";
        }
    }
}

async function dismissAllNotifications() {
    const list = document.querySelectorAll(".notif-item-card .notif-dismiss-btn");
    if (!list.length) {
        alert("No active notifications to dismiss.");
        return;
    }
    if (!confirm("Are you sure you want to dismiss all active notifications?")) return;
    list.forEach(btn => btn.click());
}

/**
 * Dismiss a notification
 */
async function dismissNotification(notificationId, evt) {
    const email = state.email || localStorage.getItem("loggedInEmail") || 'guest@example.com';

    // 1. Instant Smooth UI Removal
    let card = null;
    if (evt && evt.target) {
        card = evt.target.closest('.notif-item-card, .notification-card');
    }
    if (!card) {
        const btn = document.querySelector(`[onclick*="dismissNotification(${notificationId}"]`);
        if (btn) card = btn.closest('.notif-item-card, .notification-card');
    }
    if (card) {
        card.style.transition = "all 0.25s ease";
        card.style.opacity = "0";
        card.style.transform = "scale(0.92)";
        setTimeout(() => {
            if (card && card.parentNode) card.parentNode.removeChild(card);
            const remaining = document.querySelectorAll(".notif-item-card");
            if (!remaining.length) {
                const noMessageDiv = $("#no-notification-message");
                if (noMessageDiv) {
                    noMessageDiv.innerHTML = `
                        <div class="empty-chat-state">
                            <span class="empty-icon">🎉</span>
                            <h4>All caught up!</h4>
                            <p>No new campus notifications or announcements at this time.</p>
                        </div>
                    `;
                    noMessageDiv.style.display = "block";
                }
            }
        }, 250);
    }

    // 2. Persist locally to localStorage
    try {
        let localDismissed = JSON.parse(localStorage.getItem(`dismissed_notifs_${email}`) || "[]");
        if (!localDismissed.includes(notificationId)) {
            localDismissed.push(notificationId);
            localStorage.setItem(`dismissed_notifs_${email}`, JSON.stringify(localDismissed));
        }
    } catch(e) {}

    // 3. Sync to server API
    try {
        const res = await fetch('/api/notifications/dismiss', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, notificationId })
        });
        if (res.ok) {
            console.log('Notification dismissed on server');
        }
    } catch (err) {
        console.error('Failed to dismiss notification on server:', err);
    }
}

// Start polling for notifications while user is on the notifications section
function startNotificationPolling() {
    // already polling
    if (_notificationPollId) return;
    // poll every 10 seconds
    _notificationPollId = setInterval(() => {
        try {
            // only refresh if the notifications section is visible
            const active = document.querySelector('main > section.active-section');
            if (active && active.id === 'notifications') {
                loadNotifications();
            }
        } catch (e) {
            console.warn('Notification poll error', e);
        }
    }, 10000);
}

function stopNotificationPolling() {
    if (_notificationPollId) {
        clearInterval(_notificationPollId);
        _notificationPollId = null;
    }
}

// Global polling for notifications for logged-in users
function startGlobalNotificationPolling() {
    if (_globalNotificationPollId) return;
    _globalNotificationPollId = setInterval(() => {
        try {
            loadNotifications();
        } catch (e) {
            console.warn('Global notification poll error', e);
        }
    }, 10000);
}

function stopGlobalNotificationPolling() {
    if (_globalNotificationPollId) {
        clearInterval(_globalNotificationPollId);
        _globalNotificationPollId = null;
    }
}

/* =====================================================
   GUEST MODAL
===================================================== */
// store original overlay markup for later restoration
let _originalGuestOverlayHTML = null;

function showGuestMessage() {
    // ensure default markup restored before showing
    restoreGuestOverlay();
    $("#guest-message-overlay").style.display = "flex";
    document.body.classList.add("guest-modal-open");
}

function showGuestWelcome() {
    const overlay = $("#guest-message-overlay");
    if (!overlay) return;
    // cache original content the first time
    if (_originalGuestOverlayHTML === null) {
        _originalGuestOverlayHTML = overlay.innerHTML;
    }
    // replace content with welcome message and a single OK button
    overlay.innerHTML = `
      <div class="guest-message-box">
        <h2>👋 Guest Mode</h2>
        <p>You are in guest mode.</p>
        <div class="guest-actions">
          <button onclick="closeGuestMessage()">OK</button>
        </div>
      </div>
    `;
    // open overlay without resetting to default
    overlay.style.display = "flex";
    document.body.classList.add("guest-modal-open");
}

function restoreGuestOverlay() {
    const overlay = $("#guest-message-overlay");
    if (overlay && _originalGuestOverlayHTML !== null) {
        overlay.innerHTML = _originalGuestOverlayHTML;
    }
}

function closeGuestMessage() {
    $("#guest-message-overlay").style.display = "none";
    document.body.classList.remove("guest-modal-open");
    // put back the original overlay HTML so further prompts show login/cancel
    restoreGuestOverlay();
}

function goToLogin() {
    // set flag so landing page opens login form automatically
    try {
        sessionStorage.setItem("openLogin", "true");
    } catch (e) {
        // sessionStorage might be unavailable in some contexts
    }
    window.location.href = "index.html";
}

/* =====================================================
   THEME HANDLING
===================================================== */
function setTheme(mode) {
    document.body.classList.toggle("light-mode", mode === "light");
    localStorage.setItem("theme", mode);
    updateThemeButton();
    updateCompilerSelectColor();
}

function updateThemeButton() {
    const btn = $("#theme-toggle");
    if (!btn) return;
    btn.textContent = document.body.classList.contains("light-mode")
        ? "Dark Mode"
        : "Light Mode";
}

$("#theme-toggle")?.addEventListener("click", () => {
    setTheme(document.body.classList.contains("light-mode") ? "dark" : "light");
});

/* =====================================================
   COMPILER SELECT COLOR
===================================================== */
function updateCompilerSelectColor() {
    const select = $("#compiler-language");
    if (!select) return;

    if (document.body.classList.contains("light-mode")) {
        select.style.background = "#fff";
        select.style.color = "#222";
    } else {
        select.style.background = "";
        select.style.color = "";
    }
}

/* =====================================================
   FULLSCREEN (REUSABLE)
===================================================== */
function initFullscreen(btnId, targetId, iconId, labelId) {
    const btn = document.getElementById(btnId);
    const target = document.getElementById(targetId);
    const icon = document.getElementById(iconId);
    const label = document.getElementById(labelId);

    if (!btn || !target) return;

    btn.onclick = () => {
        if (!document.fullscreenElement) {
            target.requestFullscreen();
            if (icon) icon.textContent = "❌";
            if (label) label.textContent = "Exit Fullscreen";
        } else {
            document.exitFullscreen();
        }
    };

    document.addEventListener("fullscreenchange", () => {
        if (!document.fullscreenElement && icon && label) {
            icon.textContent = "🖥️";
            label.textContent = "Fullscreen View";
        }
    });
}

/* =====================================================
   COURSE CONTENT SWITCHER (ALL COURSES)
===================================================== */

const searchInput = document.querySelector("header input[type='text']");
const courseCards = document.querySelectorAll(".my-courses .course-card");
const noCourseMsg = document.getElementById("no-course-message");

if (searchInput) {
    searchInput.addEventListener("input", () => {
        const query = searchInput.value.trim().toLowerCase();

        // 🔥 Always open Courses section when searching
        showSection("courses");

        let found = false;

        courseCards.forEach(card => {
            const title = card.textContent.toLowerCase();
            if (title.includes(query)) {
                card.style.display = "flex";
                found = true;
            } else {
                card.style.display = "none";
            }
        });

        if (noCourseMsg) {
            noCourseMsg.style.display = found ? "none" : "block";
        }
    });
}

/* =====================================================
   COURSE CONTENT SWITCHER (FINAL – WORKING)
===================================================== */

function switchCourseTab(course, tab) {
    // 1️⃣ Hide all content blocks
    document
        .querySelectorAll(`#${course}-course .${course}-content-block`)
        .forEach(block => {
            block.style.display = "none";
        });

    // 2️⃣ Show selected block
    const target = document.getElementById(`${course}-content-${tab}`);
    if (target) {
        target.style.display = "block";
    } else {
        console.error("Target not found:", `${course}-content-${tab}`);
    }

    // 3️⃣ Update sidebar active state
    document
        .querySelectorAll(`#${course}-course .course-topic`)
        .forEach(btn => btn.classList.remove("active"));

    const sidebar = document.querySelector(`#${course}-course .course-sidebar`);
    if (sidebar) {
        const buttons = sidebar.querySelectorAll(".course-topic");
        buttons.forEach(btn => {
            const btnText = btn.textContent.toLowerCase();
            const searchTab = tab.toLowerCase();
            if (btnText.includes(searchTab) || (searchTab.startsWith('pdf') && btnText.includes('pdf'))) {
                btn.classList.add("active");
            }
        });
    }

}
function showJavaContent(tab) {
    switchCourseTab("java", tab);
}

function showCppContent(tab) {
    switchCourseTab("cpp", tab);
}

function showPythonContent(tab) {
    switchCourseTab("python", tab);
}

function showCContent(tab) {
    switchCourseTab("c", tab);
}

function showHtmlContent(tab) {
    switchCourseTab("html", tab);
}

function showSqlContent(tab) {
    switchCourseTab("sql", tab);

    if (tab === "basics") {
        const content = document.getElementById("sql-concept-content");
        if (content && content.textContent.trim().startsWith("Select a topic")) {
            loadSqlConcept("sql-introduction");
        }
    }
}

function showReactContent(tab) {
    switchCourseTab("react", tab);
}

function showAwsContent(tab) {
    switchCourseTab("aws", tab);
}

function showDbmsContent(tab) {
    switchCourseTab("dbms", tab);
}

function showDsContent(tab) {
    switchCourseTab("ds", tab);
}

function showDataAnalysisContent(tab) {
    switchCourseTab("data-analysis", tab);
}

function showNodejsContent(tab) {
    switchCourseTab("nodejs", tab);
}

function showFigmaContent(tab) {
    switchCourseTab("figma", tab);
}

function showEthicalHackingContent(tab) {
    switchCourseTab("ethical-hacking", tab);
}

function showPhotoshopContent(tab) {
    switchCourseTab("photoshop", tab);
}

function showDesignThinkingContent(tab) {
    switchCourseTab("design-thinking", tab);
}



/* =====================================================
   SETTINGS
===================================================== */
function logout() {
    // stop any running notification polling
    try { stopNotificationPolling(); } catch (e) {}
    try { stopGlobalNotificationPolling(); } catch (e) {}
    try { if (_sseSource) { _sseSource.close(); _sseSource = null; } } catch(e) {}
    localStorage.clear();
    window.location.href = "index.html";
}

/* =====================================================
   DOM READY
===================================================== */
document.addEventListener("DOMContentLoaded", () => {

    /* Theme */
    setTheme(localStorage.getItem("theme") || "dark");

    /* Guest / User Info */
    if ($("#settings-username")) {
        $("#settings-username").textContent = state.isGuest ? "Guest" : state.username || "N/A";
        $("#settings-email").textContent = state.isGuest ? "Guest" : state.email || "N/A";
    }

    // start background polling for notifications if user is logged in
    if (!state.isGuest) {
        // immediate check (in case notifications area is present)
        try { loadNotifications(); } catch (e) { /* ignore */ }
        // then kick off global polling so students see new notifications without reload
        startGlobalNotificationPolling();
        // open SSE connection for real-time updates
        try {
            if (!!window.EventSource) {
                _sseSource = new EventSource('/events');
                _sseSource.addEventListener('notification_created', e => {
                    console.log('SSE: notification_created', e.data);
                    loadNotifications();
                });
                _sseSource.addEventListener('notification_updated', e => {
                    console.log('SSE: notification_updated', e.data);
                    loadNotifications();
                });
                _sseSource.addEventListener('notification_deleted', e => {
                    console.log('SSE: notification_deleted', e.data);
                    loadNotifications();
                });
                _sseSource.onerror = err => console.warn('SSE error', err);
            }
        } catch (e) { console.warn('Failed to open SSE', e); }
    }

    // display welcome message overlay if guest just entered
    if (state.isGuest) {
        // disable settings forms for guest
        $("#current-password")?.setAttribute("disabled", true);
        $("#change-password")?.setAttribute("disabled", true);

        if (sessionStorage.getItem("justGuest")) {
            sessionStorage.removeItem("justGuest");
            showGuestWelcome();
        }
    }

    /* Fullscreen Init */
    initFullscreen("toggle-fullscreen", "compiler", "compiler-fullscreen-icon", "compiler-fullscreen-label");
    initFullscreen("toggle-concept-fullscreen", "java-content-concepts", "fullscreen-icon", "fullscreen-label");

    initFullscreen("toggle-python-concept-fullscreen", "python-content-concepts", "python-fullscreen-icon", "python-fullscreen-label");
    initFullscreen("toggle-sql-concept-fullscreen", "sql-content-concepts", "sql-fullscreen-icon", "sql-fullscreen-label");
    initJavaConceptSearch();
    initPythonConceptSearch();
    initSqlConceptSearch();
    initAnimatedVideos();

    /* Default Section / Room Link Check */
    if (!checkRoomInUrl()) {
        showSection("home");
    }
    localStorage.removeItem('isLoggedIn');
});

/* =====================================================
   VISUALIZER
===================================================== */
function runVisualizer() {
    const code = $("#visualizer-editor").value.trim();
    let lang = $("#visualizer-language").value;
    const runBtn = $(".visualizer-run-btn");

    if (!code) {
        alert("Please enter code");
        return;
    }

    // show feedback on the button
    if (runBtn) {
        runBtn.textContent = "Visualizing...";
        runBtn.disabled = true;
    }

    const iframe = $("#visualizer-frame");
    const src =
        `https://pythontutor.com/iframe-embed.html#code=${encodeURIComponent(code)}&py=${lang}&mode=edit`;

    // restore button state when iframe finishes loading the visualizer
    if (iframe) {
        iframe.onload = () => {
            // ignore initial blank load, only act on the real URL
            if (iframe.src && iframe.src.includes('pythontutor.com/iframe-embed.html')) {
                // keep indicator a bit longer so user notices
                setTimeout(() => {
                    if (runBtn) {
                        runBtn.textContent = "Visualize";
                        runBtn.disabled = false;
                    }
                }, 1500);
            }
        };
    }

    iframe.src = "";
    setTimeout(() => {
        iframe.src = src;
        const area = document.getElementById("visualizer-area-container");
        if (area) {
            area.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, 100);
}

function toggleVisualizerAreaFullscreen() {
    const el = document.getElementById("visualizer-area-container");
    if (!el) return;
    if (!document.fullscreenElement) {
        if (el.requestFullscreen) el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
    }
}


/* =====================================================
   COMPILER
===================================================== */
function switchIdeTab(tabName) {
    const panels = {
        output: $("#ide-tab-output"),
        stdin: $("#ide-tab-stdin"),
        stats: $("#ide-tab-stats")
    };
    const buttons = {
        output: $("#tab-btn-output"),
        stdin: $("#tab-btn-stdin"),
        stats: $("#tab-btn-stats")
    };

    Object.keys(panels).forEach(key => {
        if (panels[key]) panels[key].classList.toggle("active", key === tabName);
        if (buttons[key]) buttons[key].classList.toggle("active", key === tabName);
    });
}

function copyCompilerOutput() {
    const text = $(".compiler-output")?.textContent;
    if (text) {
        navigator.clipboard.writeText(text).then(() => {
            alert("📋 Output copied to clipboard!");
        });
    }
}

function bindEditorGutter(editorId, gutterId, cursorPosId) {
    const editor = $(editorId);
    const gutter = $(gutterId);
    const cursorPosEl = $(cursorPosId);

    if (!editor || !gutter) return;

    function updateGutter() {
        const lines = editor.value.split("\n").length;
        let lineNumbersHtml = "";
        for (let i = 1; i <= lines; i++) {
            lineNumbersHtml += i + "\n";
        }
        gutter.textContent = lineNumbersHtml;
        gutter.scrollTop = editor.scrollTop;
    }

    function updateCursorPos() {
        if (!cursorPosEl) return;
        const text = editor.value.substring(0, editor.selectionStart);
        const lines = text.split("\n");
        const lineNumber = lines.length;
        const colNumber = lines[lines.length - 1].length + 1;
        cursorPosEl.textContent = `Ln ${lineNumber}, Col ${colNumber}`;
    }

    editor.addEventListener("input", () => {
        updateGutter();
        updateCursorPos();
    });

    editor.addEventListener("scroll", () => {
        gutter.scrollTop = editor.scrollTop;
    });

    editor.addEventListener("keyup", updateCursorPos);
    editor.addEventListener("click", updateCursorPos);

    editor.addEventListener("keydown", e => {
        if (e.key === "Tab") {
            e.preventDefault();
            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            editor.value = editor.value.substring(0, start) + "    " + editor.value.substring(end);
            editor.selectionStart = editor.selectionEnd = start + 4;
            updateGutter();
            updateCursorPos();
            if (editorId === "#compiler-editor" && typeof currentRoomId !== "undefined" && currentRoomId) {
                if (typeof sendRoomCode === "function") sendRoomCode();
            }
        }
        if (editorId === "#compiler-editor" && (e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            const runBtn = $(".compiler-run-btn");
            if (runBtn && !runBtn.disabled) runBtn.click();
        }
    });

    updateGutter();
    updateCursorPos();
}

function initIdeGutterSync() {
    bindEditorGutter("#compiler-editor", "#ide-gutter", "#ide-cursor-pos");
    bindEditorGutter("#visualizer-editor", "#visualizer-gutter", "#visualizer-cursor-pos");
}

function attachCompilerButtonListener() {
    const runBtn = $(".compiler-run-btn");
    const editor = $(".compiler-editor");
    const output = $(".compiler-output");
    const langSel = $("#compiler-language");
    const inputField = $("#compiler-user-input");

    if (!runBtn) return;

    runBtn.onclick = async () => {
        runBtn.textContent = "Running...";
        runBtn.disabled = true;
        const startTime = performance.now();

        try {
            const res = await fetch("/api/compile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: editor.value,
                    language: langSel.value,
                    stdin: inputField?.value || ""
                })
            });

            const duration = Math.round(performance.now() - startTime);
            const data = await res.json();
            if (!res.ok) {
                output.textContent = data.error || data.message || `Compiler request failed with status ${res.status}`;
            } else {
                output.textContent = data.output || data.result || data.message || "No output returned.";
            }

            // Update Stats Tab
            const timeStat = $("#ide-stat-time");
            const statusStat = $("#ide-stat-status");
            const langStat = $("#ide-stat-lang");
            if (timeStat) timeStat.textContent = `${duration} ms`;
            if (statusStat) {
                statusStat.textContent = res.ok ? "0 (Success)" : "1 (Error)";
                statusStat.className = res.ok ? "ide-stat-val success" : "ide-stat-val error";
            }
            if (langStat && langSel) {
                langStat.textContent = langSel.options[langSel.selectedIndex]?.text || "Java";
            }

            switchIdeTab("output");

            if (typeof sendRoomCode === "function" && currentRoomId) {
                sendRoomCode(output.textContent);
            }
        } catch (err) {
            output.textContent = err.message;
            if (typeof sendRoomCode === "function" && currentRoomId) {
                sendRoomCode(err.message);
            }
        } finally {
            runBtn.textContent = "▶ Run (Ctrl+Enter)";
            runBtn.disabled = false;
        }
    };
}
attachCompilerButtonListener();
document.addEventListener("DOMContentLoaded", initIdeGutterSync);

function initAnimatedVideos() {
    const videos = [
        // Java Animations
        { title: 'Binary Search Visualizer', language: 'java', desc: 'Step-by-step O(log N) divide and conquer array search animation.', src: 'Java animated files/Binary_Search_animated.html' },
        { title: 'Bubble Sort Visualizer', language: 'java', desc: 'Interactive step-by-step element swapping and array sorting visualization.', src: 'Java animated files/Bubble_sort_array_animated.html' },
        { title: 'Factorial Calculator', language: 'java', desc: 'Recursive call stack and iterative factorial execution breakdown.', src: 'Java animated files/Factorial_animated.html' },
        { title: 'Fibonacci Sequence Generator', language: 'java', desc: 'Iterative vs recursive state tracking for Fibonacci numbers.', src: 'Java animated files/Fibonacci_animated.html' },
        { title: 'Palindrome Checker', language: 'java', desc: 'Two-pointer technique for checking number and string symmetry.', src: 'Java animated files/Palindrome_animated.html' },
        { title: 'Prime Number Validator', language: 'java', desc: 'Trial division algorithm with square root optimization.', src: 'Java animated files/PrimeNumber_animated.html' },
        { title: 'Reverse String Algorithm', language: 'java', desc: 'In-place character array reversal and string manipulation.', src: 'Java animated files/Reverse_String_animated.html' },
        { title: 'Even / Odd Categorizer', language: 'java', desc: 'Bitwise AND vs modulo remainder checking visualization.', src: 'Java animated files/even_odd_animated.html' },
        { title: 'Count Digits Algorithm', language: 'java', desc: 'Logarithmic arithmetic digit decomposition loop.', src: 'Java animated files/Count_Digits_animated.html' },
        { title: 'Sum of Digits', language: 'java', desc: 'Accumulator variable updates across integer digits.', src: 'Java animated files/Sum_of_Digits_animated.html' },
        { title: 'Armstrong Number Check', language: 'java', desc: 'Power calculation and digit sum verification for N-digit numbers.', src: 'Java animated files/Armstrong_animated.html' },
        { title: 'Perfect Number Verifier', language: 'java', desc: 'Proper divisor summation and comparison loop.', src: 'Java animated files/Perfect_Number_animated.html' },
        { title: 'Reverse Integer Visualizer', language: 'java', desc: 'Arithmetic digit extraction and integer reconstruction.', src: 'Java animated files/Reverse_animated.html' },
        { title: 'Vowel Frequency Counter', language: 'java', desc: 'Linear string traversal with character lookup tables.', src: 'Java animated files/Count_vowels_animated.html' },
        { title: 'Largest Array Element', language: 'java', desc: 'Single-pass linear scan keeping track of maximum value.', src: 'Java animated files/Largest_Element_array_animated.html' },
        { title: 'Second Largest Element', language: 'java', desc: 'Tracking largest and second-largest elements in O(N) time.', src: 'Java animated files/Second_Largest_array.html' },
        { title: 'Leap Year Decision Tree', language: 'java', desc: 'Century and quad-year boolean conditional branch execution.', src: 'Java animated files/Leap_Year.html' },
        { title: 'Palindrome String Visualizer', language: 'java', desc: 'Character comparison from start and end pointers.', src: 'Java animated files/Palindrome_String_animated.html' },
        { title: 'Strong Number Evaluator', language: 'java', desc: 'Factorial sum of individual digits algorithm walkthrough.', src: 'Java animated files/Stronge_number_animated.html' },
        { title: 'Two Sum Problem (Hash/Pointers)', language: 'java', desc: 'Classic LeetCode #1 array pair search step-by-step.', src: 'Java animated files/Two_sum_animated.html' },

        // Python Animations
        { title: 'Python Linear vs Binary Search', language: 'python', desc: 'Interactive step-by-step low/high pointer comparison and log(N) search.', src: 'Java animated files/python_linear_vs_binary_search.html' },
        { title: 'Python Stack & Queue (LIFO vs FIFO)', language: 'python', desc: 'Visualizing stack append/pop vs deque popleft() operations.', src: 'Java animated files/python_stack_queue.html' },
        { title: 'Python Merge Sort (Divide & Conquer)', language: 'python', desc: 'Recursive list partitioning and merge step-by-step visualizer.', src: 'Java animated files/python_merge_sort.html' },
        { title: 'Python Fibonacci & Generators', language: 'python', desc: 'Yield statement lazy evaluation and state preservation.', src: 'Java animated files/Fibonacci_animated.html' },

        // SQL Animations
        { title: 'SQL Joins Row Matcher', language: 'sql', desc: 'Interactive INNER JOIN vs LEFT JOIN row-by-row matching pipeline.', src: 'Java animated files/sql_joins_visualizer.html' },
        { title: 'SQL GROUP BY & Aggregation Pipeline', language: 'sql', desc: 'Visualizing row filtering (WHERE), bucket grouping, and HAVING evaluation.', src: 'Java animated files/sql_groupby_aggregate.html' },
        { title: 'SQL B-Tree Index vs Full Table Scan', language: 'sql', desc: 'Step-by-step index node traversal vs sequential disk scan execution plan.', src: 'Java animated files/sql_btree_index.html' }
    ];

    const grid = document.getElementById('animated-video-grid');
    const emptyMessage = document.getElementById('animated-video-empty');
    const searchInput = document.getElementById('animated-video-search');
    const buttons = document.querySelectorAll('.video-language-button');
    const modal = document.getElementById('animation-player-modal');
    const modalTitle = document.getElementById('anim-modal-title');
    const modalBadge = document.getElementById('anim-modal-badge');
    const modalIframe = document.getElementById('anim-modal-iframe');
    const modalCloseBtn = document.getElementById('anim-modal-close');
    const modalFsBtn = document.getElementById('anim-modal-fullscreen');

    if (!grid || !searchInput || !emptyMessage || buttons.length === 0) return;

    let activeLanguage = 'java';

    function openModal(video) {
        if (!modal || !modalIframe) return;
        const videoSrc = `${window.location.origin}/${video.src.split('/').map(encodeURIComponent).join('/')}`;
        modalTitle.textContent = video.title;
        modalBadge.textContent = video.language.toUpperCase();
        modalIframe.src = videoSrc;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        if (!modal || !modalIframe) return;
        modal.style.display = 'none';
        modalIframe.src = '';
        document.body.style.overflow = '';
    }

    if (modalCloseBtn) modalCloseBtn.onclick = closeModal;
    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) closeModal();
        };
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
            closeModal();
        }
    });

    if (modalFsBtn) {
        modalFsBtn.onclick = () => {
            if (modalIframe.requestFullscreen) {
                modalIframe.requestFullscreen();
            } else if (modalIframe.webkitRequestFullscreen) {
                modalIframe.webkitRequestFullscreen();
            }
        };
    }

    function renderVideoCards(filteredVideos) {
        grid.innerHTML = '';
        if (filteredVideos.length === 0) {
            emptyMessage.style.display = 'block';
            return;
        }

        emptyMessage.style.display = 'none';
        filteredVideos.forEach(video => {
            const card = document.createElement('div');
            card.className = 'video-card';
            
            card.innerHTML = `
                <div class="video-card-thumb">
                    <span class="video-card-badge">${video.language.toUpperCase()}</span>
                    <div class="video-card-play-btn" title="Play Animation">▶</div>
                </div>
                <div class="video-card-content">
                    <h4>${video.title}</h4>
                    <p>${video.desc || 'Interactive algorithm visualizer with step-by-step execution.'}</p>
                    <div class="video-card-footer">
                        <span>⚡ Interactive Debugger</span>
                        <span style="color: var(--text-tertiary);">Launch &raquo;</span>
                    </div>
                </div>
            `;

            card.addEventListener('click', () => openModal(video));
            grid.appendChild(card);
        });
    }

    function filterVideos() {
        const query = searchInput.value.trim().toLowerCase();
        const filteredVideos = videos.filter(video => {
            const matchesLanguage = activeLanguage === 'all' || video.language === activeLanguage;
            const matchesQuery = query === '' || video.title.toLowerCase().includes(query) || (video.desc && video.desc.toLowerCase().includes(query));
            return matchesLanguage && matchesQuery;
        });
        renderVideoCards(filteredVideos);
    }

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            activeLanguage = button.dataset.language;
            filterVideos();
        });
    });

    searchInput.addEventListener('input', filterVideos);
    filterVideos();
}

/* =====================================================
   DYNAMIC CODING STREAK ENGINE
===================================================== */
function updateCodingStreak() {
    try {
        const username = localStorage.getItem("loggedInUserName") || state.username || "guest";
        const todayStr = new Date().toISOString().split('T')[0];
        
        const lastDateKey = `streak_last_date_${username}`;
        const countKey = `streak_count_${username}`;

        const lastDate = localStorage.getItem(lastDateKey);
        let currentCount = parseInt(localStorage.getItem(countKey) || "1", 10);

        if (!lastDate) {
            currentCount = 1;
            localStorage.setItem(lastDateKey, todayStr);
            localStorage.setItem(countKey, "1");
        } else if (lastDate !== todayStr) {
            const last = new Date(lastDate);
            const today = new Date(todayStr);
            const diffTime = Math.abs(today - last);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                currentCount += 1;
            } else if (diffDays > 1) {
                currentCount = 1;
            }
            localStorage.setItem(lastDateKey, todayStr);
            localStorage.setItem(countKey, currentCount.toString());
        }

        const streakEl = document.getElementById("dash-streak-count");
        if (streakEl) {
            streakEl.textContent = `${currentCount} Day${currentCount > 1 ? 's' : ''}`;
        }
        return currentCount;
    } catch(e) {
        return 1;
    }
}

// =====================================================
// DASHBOARD LOGIC
// =====================================================

/**
 * Populate main dashboard content and personal summary.
 */
let _lastLeaderboardHash = null;
let _lastPersonalScoreHash = null;

async function populateDashboard(force = false) {
    updateCodingStreak();
    const scoreContainer = $("#scoreDashboardContent");
    const topUsersContainer = $("#topUsersTable");
    const dashUserName = document.getElementById("dash-user-name");

    const currentUser = localStorage.getItem("loggedInUserName") || state.username || "Developer";
    if (dashUserName) dashUserName.textContent = currentUser;

    if (!scoreContainer || !topUsersContainer) return;

    // Show initial loading text ONLY IF containers are currently empty
    if (!scoreContainer.children.length && !scoreContainer.innerHTML.trim()) {
        scoreContainer.innerHTML = `<div class="dash-loader">Loading leaderboard...</div>`;
    }
    if (!topUsersContainer.children.length && !topUsersContainer.innerHTML.trim()) {
        topUsersContainer.innerHTML = `<div class="dash-loader">Loading scores...</div>`;
    }

    try {
        const res = await fetch("/api/leaderboard");
        if (!res.ok) throw new Error(`Server responded ${res.status}`);
        const leaderboard = await res.json();

        // Check if leaderboard data has changed before mutating DOM
        const newLeaderboardHash = JSON.stringify(leaderboard);
        if (force || newLeaderboardHash !== _lastLeaderboardHash) {
            _lastLeaderboardHash = newLeaderboardHash;

            function formatDisplayNameRow(r) {
                let name = '';
                if (r.username && typeof r.username === 'string' && !r.username.includes('@')) {
                    name = r.username;
                }
                if (!name || name === '') {
                    if (r.email && typeof r.email === 'string' && r.email.includes('@')) {
                        name = r.email.split('@')[0];
                    }
                }
                if (!name || name === '') name = 'Developer';
                return name.charAt(0).toUpperCase() + name.slice(1);
            }

            let dashHtml = "";
            if (leaderboard.length) {
                dashHtml += `<table class="dash-table leaderboard-table"><thead><tr><th>Rank</th><th>Developer</th><th>Top Score</th></tr></thead><tbody>`;
                leaderboard.forEach((r, index) => {
                    const displayName = formatDisplayNameRow(r);
                    const topScore = r.topScore != null ? r.topScore : '0';
                    const rankBadge = index === 0 ? '🥇 1st' : (index === 1 ? '🥈 2nd' : (index === 2 ? '🥉 3rd' : `#${index + 1}`));
                    const rankClass = index === 0 ? 'gold' : (index === 1 ? 'silver' : (index === 2 ? 'bronze' : 'normal'));

                    dashHtml += `
                        <tr class="rank-row ${rankClass}">
                            <td><span class="rank-tag ${rankClass}">${rankBadge}</span></td>
                            <td>
                                <div class="rank-user">
                                    <div class="user-avatar-small">${displayName.substring(0,2).toUpperCase()}</div>
                                    <span class="user-name">${escapeHtml(displayName)}</span>
                                </div>
                            </td>
                            <td><span class="score-badge">${topScore} pts</span></td>
                        </tr>`;
                });
                dashHtml += `</tbody></table>`;
            }

            if (!dashHtml) dashHtml = `<div class="dash-empty-state">No campus leaderboard scores available yet.</div>`;
            scoreContainer.innerHTML = dashHtml;
        }

        // Show personal scores if logged in
        if (state.email || currentUser !== 'Developer') {
            try {
                const userEmail = state.email || localStorage.getItem("loggedInEmail") || "";
                const personalRes = await fetch(`/api/get-quiz-scores?email=${encodeURIComponent(userEmail)}`);
                const personal = personalRes.ok ? await personalRes.json() : [];

                const newPersonalHash = JSON.stringify(personal);
                if (force || newPersonalHash !== _lastPersonalScoreHash) {
                    _lastPersonalScoreHash = newPersonalHash;

                    const kpiCount = document.getElementById("kpi-quizzes-count");
                    if (kpiCount) kpiCount.innerHTML = `${personal.length || 0} <span class="stat-unit">Levels</span>`;

                    if (personal.length) {
                        let html = `<table class="dash-table"><thead><tr><th>Course</th><th>Score</th><th>Accuracy</th></tr></thead><tbody>`;
                        personal.forEach(r => {
                            const total = r.total || 5;
                            const score = r.score != null ? r.score : 0;
                            const pct = Math.round((score / total) * 100);
                            html += `
                                <tr>
                                    <td><span class="course-pill">${r.quiz || 'Quiz'}</span></td>
                                    <td><strong>${score} / ${total}</strong></td>
                                    <td>
                                        <div class="score-progress-bar">
                                            <div class="progress-fill" style="width: ${pct}%;"></div>
                                            <span>${pct}%</span>
                                        </div>
                                    </td>
                                </tr>`;
                        });
                        html += `</tbody></table>`;
                        topUsersContainer.innerHTML = html;
                    } else {
                        topUsersContainer.innerHTML = `<div class="dash-empty-state">No quiz scores recorded yet. Take a quiz to see your history!</div>`;
                    }
                }
            } catch (err) {
                console.error('Error loading personal scores', err);
            }
        } else {
            if (!topUsersContainer.children.length || topUsersContainer.innerHTML.includes("Loading")) {
                topUsersContainer.innerHTML = `<div class="dash-empty-state">Log in to view your personal score history.</div>`;
            }
        }
    } catch (err) {
        console.error("Failed to load dashboard:", err);
    }
}


/* =====================================================
   CHAT SWITCHER
===================================================== */
function showChat(type){

const publicBtn = document.querySelector('.chat-toggle-buttons button:nth-child(1)');
const privateBtn = document.querySelector('.chat-toggle-buttons button:nth-child(2)');

$("#public-chat").style.display = type === "public" ? "block" : "none";
$("#private-chat").style.display = type === "private" ? "block" : "none";

if (publicBtn && privateBtn) {
    publicBtn.classList.toggle('active', type === 'public');
    privateBtn.classList.toggle('active', type === 'private');
}

if(type === "private"){
    loadAdminMessages();
    loadUsers();
    loadPrivateMessages();
}

if(type === "public"){
    loadPublicMessages();
}

}
/* =====================================================
   JAVA CONCEPT LOADER
===================================================== */
function loadJavaConcept(concept) {
    const content = document.getElementById("java-concept-content");

    if (!content) {
        console.error("java-concept-content not found");
        return;
    }

    const path = `./concepts/java/${concept}.html`;

    fetch(path)
        .then(res => {
            if (!res.ok) {
                throw new Error(`File not found: ${path}`);
            }
            return res.text();
        })
        .then(html => {
            content.innerHTML = html;
        })
        .catch(err => {
            console.error(err);
            content.innerHTML = `
                <div style="color:red; padding:10px;">
                    ❌ Unable to load concept: <b>${concept}</b><br>
                    Check file name and path.
                </div>`;
        });



    // Highlight active button
    document
        .querySelectorAll(".concepts-submenu button")
        .forEach(btn => btn.classList.remove("active"));

    const activeBtn = document.querySelector(
        `.concepts-submenu button[onclick="loadJavaConcept('${concept}')"]`
    );
    if (activeBtn) activeBtn.classList.add("active");
}
function loadPythonConcept(topic) {

    const content = document.getElementById("python-concept-content");

    if (!content) {
        console.error("python-concept-content not found");
        return;
    }

    const path = `./concepts/python/${topic}.html`;

    fetch(path)
        .then(res => {
            if (!res.ok) {
                throw new Error(`File not found: ${path}`);
            }
            return res.text();
        })
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");

            doc.querySelectorAll("link[rel='stylesheet'], meta").forEach(el => el.remove());
            doc.querySelectorAll("[style]").forEach(el => el.removeAttribute("style"));

            const adjustedStyles = Array.from(doc.querySelectorAll("style"))
                .map(style => {
                    let cssText = style.textContent || "";
                    cssText = cssText
                        .replace(/body\s*\{[^}]*\}/g, "")
                        .replace(/html\s*\{[^}]*\}/g, "");
                    return `<style>${cssText}</style>`;
                })
                .join("\n");

            const bodyContent = doc.body ? doc.body.innerHTML : html;
            content.innerHTML = `${adjustedStyles}<div class="python-page">${bodyContent}</div>`;
        })
        .catch(err => {
            console.error(err);
            content.innerHTML = `
                <div style="color:red; padding:10px;">
                    ❌ Unable to load topic: <b>${topic}</b><br>
                    Check file name and path.
                </div>`;
        });

    // Highlight active button
    document
        .querySelectorAll("#python-concept-buttons button")
        .forEach(btn => btn.classList.remove("active"));

    const activeBtn = document.querySelector(
        `#python-concept-buttons button[onclick="loadPythonConcept('${topic}')"]`
    );
    if (activeBtn) activeBtn.classList.add("active");
}

function loadSqlConcept(topic) {
    const content = document.getElementById("sql-concept-content");

    if (!content) {
        console.error("sql-concept-content not found");
        return;
    }

    const path = `./concepts/sql/${topic}.html`;

    fetch(path)
        .then(res => {
            if (!res.ok) {
                throw new Error(`File not found: ${path}`);
            }
            return res.text();
        })
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");

            doc.querySelectorAll("link[rel='stylesheet'], meta").forEach(el => el.remove());
            doc.querySelectorAll("[style]").forEach(el => el.removeAttribute("style"));

            const bodyContent = doc.body ? doc.body.innerHTML : html;
            content.innerHTML = `<div class="sql-page">${bodyContent}</div>`;
        })
        .catch(err => {
            console.error(err);
            content.innerHTML = `
                <div style="color:red; padding:10px;">
                    ❌ Unable to load topic: <b>${topic}</b><br>
                    Check file name and path.
                </div>`;
        });

    document
        .querySelectorAll("#sql-concept-buttons button")
        .forEach(btn => btn.classList.remove("active"));

    const activeBtn = document.querySelector(
        `#sql-concept-buttons button[onclick="loadSqlConcept('${topic}')"]`
    );
    if (activeBtn) activeBtn.classList.add("active");
}

function initSqlConceptSearch() {
    const search = document.getElementById("sql-concept-search");
    const buttons = document.querySelectorAll("#sql-concept-buttons button");
    if (!search || !buttons.length) return;

    search.addEventListener("input", () => {
        const query = search.value.trim().toLowerCase();
        buttons.forEach(button => {
            const text = button.textContent.trim().toLowerCase();
            button.style.display = text.includes(query) ? "inline-flex" : "none";
        });
    });
}

function initJavaConceptSearch() {
    const search = document.getElementById("concept-search");
    const buttons = document.querySelectorAll("#concept-buttons button");
    if (!search || !buttons.length) return;

    search.addEventListener("input", () => {
        const query = search.value.trim().toLowerCase();
        buttons.forEach(button => {
            const text = button.textContent.trim().toLowerCase();
            button.style.display = text.includes(query) ? "inline-flex" : "none";
        });
    });
}

function initPythonConceptSearch() {
    const search = document.getElementById("python-concept-search");
    const buttons = document.querySelectorAll("#python-concept-buttons button");
    if (!search || !buttons.length) return;

    search.addEventListener("input", () => {
        const query = search.value.trim().toLowerCase();
        buttons.forEach(button => {
            const text = button.textContent.trim().toLowerCase();
            button.style.display = text.includes(query) ? "inline-flex" : "none";
        });
    });
}

function enableConceptFullscreen() {
    const btn = document.getElementById("toggle-concept-fullscreen");
    const wrapper = document.getElementById("java-content-concepts");
    const icon = document.getElementById("fullscreen-icon");
    const label = document.getElementById("fullscreen-label");

    if (!btn || !wrapper) return;

    btn.onclick = () => {
        if (!document.fullscreenElement) {
            wrapper.requestFullscreen().then(() => {
                icon.textContent = "❌";
                label.textContent = "Exit Fullscreen";
            });
        } else {
            document.exitFullscreen();
        }
    };

    document.addEventListener("fullscreenchange", () => {
        if (!document.fullscreenElement) {
            icon.textContent = "🖥️";
            label.textContent = "Fullscreen View";
        }
    });
}
document.addEventListener("DOMContentLoaded", () => {
    enableConceptFullscreen();
});



let _lastAdminHash = null;

async function loadAdminMessages(force = false) {
    const username = localStorage.getItem("loggedInUserName");
    if (!username) return;

    const res = await fetch(`/api/get-admin-messages/${username}`);
    const messages = await res.json();
    const container = document.getElementById("admin-messages");

    if (!container) return;

    const newHash = JSON.stringify(messages);
    if (!force && newHash === _lastAdminHash) return;
    _lastAdminHash = newHash;

    if (!messages || messages.length === 0) {
        container.innerHTML = "";
        container.style.display = "none";
        return;
    }

    container.style.display = "block";
    container.innerHTML = messages.map(m => `
        <div class="notification-card">
            <b>Admin:</b> ${escapeHtml(m.message || "No message")}
            <br>
            <small>${new Date(m.createdAt).toLocaleString()}</small>
        </div>
    `).join("");
}

function setChatStatus(text) {
    const status = document.getElementById('typing-status');
    if (!status) return;
    status.textContent = text;
}

/* =====================================================
   HEARTBEAT & ONLINE STATUS TRACKER
===================================================== */
let _userStatuses = {};

async function sendHeartbeat() {
    const currentUser = localStorage.getItem("loggedInUserName");
    if (!currentUser) return;
    try {
        await fetch(`/api/heartbeat/${encodeURIComponent(currentUser)}`, { method: 'POST' });
    } catch(e) {}
}

async function fetchUserStatuses() {
    try {
        const res = await fetch('/api/user-statuses');
        if (res.ok) {
            _userStatuses = await res.json();
        }
    } catch(e) {}
}

/* =====================================================
   MASTER REAL-TIME ENGINE (2.5 SECOND SMART SYNC LOOP)
===================================================== */
async function runMasterRealtimeSync() {
    // 1. Send heartbeat & fetch online user presence
    await sendHeartbeat();
    await fetchUserStatuses();

    // 2. Sync Chat & Messenger if User Communication section is visible
    const userComm = document.getElementById("user-communication");
    if (userComm && userComm.style.display !== "none") {
        const publicChat = document.getElementById("public-chat");
        const privateChat = document.getElementById("private-chat");

        if (publicChat && publicChat.style.display !== "none") {
            loadPublicMessages();
        }
        if (privateChat && privateChat.style.display !== "none") {
            loadUsers();
            loadPrivateMessages();
            loadAdminMessages();
        }
    }

    // 3. Sync Notifications if Notifications section is visible
    const notifSec = document.getElementById("notifications");
    if (notifSec && notifSec.style.display !== "none") {
        loadNotifications();
    }

    // 4. Sync Leaderboards & Scores if Dashboard section is visible
    const dashSec = document.getElementById("dashboard");
    if (dashSec && dashSec.style.display !== "none") {
        populateDashboard();
    }
}

// Start Master Real-Time Sync loop
setInterval(runMasterRealtimeSync, 2500);
document.addEventListener("DOMContentLoaded", () => {
    runMasterRealtimeSync();
});

/* =====================================================
   DELETE & CLEAR CHAT UTILITIES
===================================================== */
function getDeletedForMeSet() {
    try {
        const currentUser = localStorage.getItem("loggedInUserName") || "guest";
        const raw = localStorage.getItem(`deleted_for_me_${currentUser}`);
        return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch(e) { return new Set(); }
}

function deleteMessageForMe(type, msgId) {
    try {
        const currentUser = localStorage.getItem("loggedInUserName") || "guest";
        const set = getDeletedForMeSet();
        set.add(`${type}_${msgId}`);
        localStorage.setItem(`deleted_for_me_${currentUser}`, JSON.stringify(Array.from(set)));
        if (type === 'public') loadPublicMessages(true);
        if (type === 'private') loadPrivateMessages(true);
    } catch(e) { console.error(e); }
}

async function deleteMessageForEveryone(type, msgId) {
    if (!confirm("Are you sure you want to delete this message for everyone?")) return;
    try {
        const url = type === 'public' ? `/api/public-message/${msgId}` : `/api/private-message/${msgId}`;
        const res = await fetch(url, { method: 'DELETE' });
        if (res.ok) {
            if (type === 'public') loadPublicMessages(true);
            if (type === 'private') loadPrivateMessages(true);
        } else {
            alert("Unable to delete message.");
        }
    } catch(e) { alert("Error deleting message"); }
}

async function clearCurrentChat(type) {
    const currentUser = localStorage.getItem("loggedInUserName") || state.username || "Guest";
    if (type === 'private') {
        if (!selectedUser) {
            alert("No contact selected to clear.");
            return;
        }
        if (!confirm(`Are you sure you want to clear your conversation history with ${selectedUser}?`)) return;

        setChatStatus("Clearing conversation...");
        try {
            const url = `/api/private-messages/clear?senderName=${encodeURIComponent(currentUser)}&receiverName=${encodeURIComponent(selectedUser)}`;
            await fetch(url, { method: 'DELETE' });
        } catch (e) {
            console.warn("Server clear failed, applying local clear fallback", e);
        }

        // Also add all current private message elements to local deleted set for instant clear
        const container = document.getElementById("private-chat-messages");
        if (container) {
            const deletedSet = getDeletedForMeSet();
            const triggers = container.querySelectorAll(".bubble-action-trigger");
            triggers.forEach(btn => {
                const onclick = btn.getAttribute("onclick") || "";
                const match = onclick.match(/\d+/);
                if (match) {
                    deletedSet.add(`private_${match[0]}`);
                }
            });
            localStorage.setItem(`deleted_for_me_${currentUser}`, JSON.stringify(Array.from(deletedSet)));
        }

        _lastPrivateHash = null;
        loadPrivateMessages(true);
        setChatStatus(`Conversation history cleared.`);
    } else if (type === 'public') {
        if (!confirm("Are you sure you want to clear the public community channel history?")) return;

        setChatStatus("Clearing channel...");
        try {
            await fetch(`/api/public-messages/clear`, { method: 'DELETE' });
        } catch (e) {
            console.warn("Server public clear failed", e);
        }

        const container = document.getElementById("public-chat-messages");
        if (container) {
            const deletedSet = getDeletedForMeSet();
            const triggers = container.querySelectorAll(".bubble-action-trigger");
            triggers.forEach(btn => {
                const onclick = btn.getAttribute("onclick") || "";
                const match = onclick.match(/\d+/);
                if (match) {
                    deletedSet.add(`public_${match[0]}`);
                }
            });
            localStorage.setItem(`deleted_for_me_${currentUser}`, JSON.stringify(Array.from(deletedSet)));
        }

        _lastPublicHash = null;
        loadPublicMessages(true);
        setChatStatus(`Public lounge cleared.`);
    }
}

function toggleBubbleMenu(event, menuId) {
    event.stopPropagation();
    document.querySelectorAll('.bubble-menu').forEach(m => {
        if (m.id !== menuId) m.style.display = 'none';
    });
    const menu = document.getElementById(menuId);
    if (menu) {
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    }
}

document.addEventListener('click', () => {
    document.querySelectorAll('.bubble-menu').forEach(m => m.style.display = 'none');
});

/* =====================================================
   PUBLIC & PRIVATE CHAT (MODERN MESSENGER ENGINE)
===================================================== */
let _lastPublicHash = null;
let _lastPrivateHash = null;
let _lastUsersHash = null;

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

function insertEmoji(inputId, emoji) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.value += emoji;
    input.focus();
}

function formatChatTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

async function sendPublicMessage() {
    const input = document.getElementById("public-chat-input");
    if (!input) return;
    const message = input.value.trim();
    const username = localStorage.getItem("loggedInUserName") || "Guest";

    if (!message) return;

    await fetch("/api/public-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName: username, message: message })
    });

    input.value = "";
    loadPublicMessages(true);
}

async function loadPublicMessages(force = false) {
    const res = await fetch("/api/public-messages");
    const messages = await res.json();
    const container = document.getElementById("public-chat-messages");
    const currentUser = localStorage.getItem("loggedInUserName") || "Guest";
    const deletedSet = getDeletedForMeSet();

    if (!container) return;

    // Filter out deleted for me
    const visibleMessages = (messages || []).filter(m => !deletedSet.has(`public_${m.id}`));

    const newHash = JSON.stringify(visibleMessages);
    if (!force && newHash === _lastPublicHash) return;
    _lastPublicHash = newHash;

    if (!visibleMessages || visibleMessages.length === 0) {
        container.innerHTML = `
            <div class="empty-chat-state">
                <span class="empty-icon">💬</span>
                <h4>Welcome to # public-campus-lounge</h4>
                <p>This is the start of the community chat channel. Send a message to say hello!</p>
            </div>
        `;
        setChatStatus("Public chat ready.");
        return;
    }

    container.innerHTML = visibleMessages.map(m => {
        const isMe = (m.userName || 'Guest') === currentUser;
        const initials = getInitials(m.userName || 'Guest');
        const timeStr = formatChatTime(m.createdAt);

        return `
            <div class="chat-row ${isMe ? 'my-row' : 'other-row'}">
                ${!isMe ? `<div class="chat-avatar">${initials}</div>` : ''}
                <div class="chat-bubble ${isMe ? 'my-bubble' : 'other-bubble'}">
                    <div class="bubble-top-row">
                        <span class="bubble-sender">${isMe ? 'You' : (m.userName || 'Guest')}</span>
                        <div class="bubble-actions-wrapper">
                            <button class="bubble-action-trigger" onclick="toggleBubbleMenu(event, 'pub_menu_${m.id}')" title="Options">⋮</button>
                            <div id="pub_menu_${m.id}" class="bubble-menu" style="display:none;">
                                <button onclick="deleteMessageForMe('public', ${m.id})">🗑️ Delete for Me</button>
                                ${isMe ? `<button onclick="deleteMessageForEveryone('public', ${m.id})">❌ Delete for Everyone</button>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="bubble-text">${escapeHtml(m.message || '')}</div>
                    <div class="bubble-meta">
                        <span class="bubble-time">${timeStr}</span>
                        ${isMe ? `<span class="read-ticks" title="Sent">✓✓</span>` : ''}
                    </div>
                </div>
                ${isMe ? `<div class="chat-avatar me-avatar">${initials}</div>` : ''}
            </div>
        `;
    }).join("");

    container.scrollTop = container.scrollHeight;
    setChatStatus("Public lounge connected · Auto-syncing");
}

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* =====================================================
   PRIVATE CHAT & USERS
===================================================== */
async function loadUsers(force = false) {
    sendHeartbeat();
    fetchUserStatuses();
    const res = await fetch("/api/users");
    const users = await res.json();
    const currentUser = localStorage.getItem("loggedInUserName");
    const list = document.getElementById("private-user-list");

    if (!list) return;

    const visibleUsers = users.filter(u => u !== currentUser);

    const newHash = JSON.stringify({ selectedUser, visibleUsers, _userStatuses });
    if (!force && newHash === _lastUsersHash) return;
    _lastUsersHash = newHash;

    if (!visibleUsers.length) {
        list.innerHTML = `<div class="user-item-empty">No other registered contacts found.</div>`;
        return;
    }

    list.innerHTML = visibleUsers.map(u => {
        const isActive = u === selectedUser;
        const initials = getInitials(u);
        const status = _userStatuses[u] || 'offline';
        const statusLabel = status === 'online' ? '🟢 Online' : (status === 'away' ? '🟡 Away' : '⚪ Offline');
        const dotClass = status === 'online' ? 'online' : (status === 'away' ? 'away' : 'offline');

        return `
            <div class="user-item ${isActive ? 'active' : ''}" data-username="${u}" onclick="selectUser('${u}')">
                <div class="user-item-avatar">${initials}</div>
                <div class="user-item-info">
                    <div class="user-item-name">${u}</div>
                    <div class="user-item-sub">${statusLabel}</div>
                </div>
                <span class="online-dot ${dotClass}" title="${statusLabel}"></span>
            </div>
        `;
    }).join("");

    updateSelectedUserInfo();
}

function searchUser() {
    const query = document.getElementById("private-user-search").value.trim().toLowerCase();
    const items = document.querySelectorAll("#private-user-list .user-item");
    items.forEach(item => {
        const username = item.dataset.username || item.textContent.trim().toLowerCase();
        item.style.display = username.includes(query) ? "flex" : "none";
    });
}

let selectedUser = null;

function selectUser(name) {
    selectedUser = name;
    
    const searchInput = document.getElementById("private-user-search");
    if (searchInput) searchInput.value = "";
    searchUser();

    const avatar = document.getElementById("private-target-avatar");
    const title = document.getElementById("private-target-name");
    if (avatar) avatar.textContent = getInitials(name);
    if (title) title.textContent = name;

    updateSelectedUserInfo();
    loadUsers(true);
    loadPrivateMessages(true);
}

function updateSelectedUserInfo() {
    const info = document.getElementById("selected-user-info");
    if (!info) return;

    if (!selectedUser) {
        info.textContent = "Select a contact from the list to start messaging";
        return;
    }

    const status = _userStatuses[selectedUser] || 'offline';
    const statusLabel = status === 'online' ? '🟢 Active now · Direct Messages' : (status === 'away' ? '🟡 Away · Direct Messages' : '⚪ Offline · Direct Messages');
    info.textContent = statusLabel;
}

async function sendPrivateMessage() {
    const input = document.getElementById("private-chat-input");
    if (!input) return;
    const message = input.value.trim();
    const sender = localStorage.getItem("loggedInUserName");

    if (!selectedUser || !message) {
        if (!selectedUser) alert("Please select a user to message from the contacts list.");
        return;
    }

    const res = await fetch("/api/private-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            senderName: sender,
            receiverName: selectedUser,
            message: message
        })
    });

    if (!res.ok) {
        setChatStatus("Failed to deliver message.");
        return;
    }

    input.value = "";
    loadPrivateMessages(true);
    setChatStatus("Message delivered.");
}

async function loadPrivateMessages(force = false) {
    const sender = localStorage.getItem("loggedInUserName");
    const container = document.getElementById("private-chat-messages");
    const deletedSet = getDeletedForMeSet();

    if (!container) return;

    if (!selectedUser) {
        container.innerHTML = `
            <div class="empty-chat-state">
                <span class="empty-icon">🔒</span>
                <h4>No Contact Selected</h4>
                <p>Select a student contact from the left sidebar to open a private conversation.</p>
            </div>
        `;
        setChatStatus("Select a contact to begin.");
        return;
    }

    const res = await fetch(
        `/api/private-messages?senderName=${encodeURIComponent(sender)}&receiverName=${encodeURIComponent(selectedUser)}`
    );

    const messages = await res.json();
    const visibleMessages = (messages || []).filter(m => !deletedSet.has(`private_${m.id}`));

    const newHash = JSON.stringify({ selectedUser, visibleMessages });
    if (!force && newHash === _lastPrivateHash) return;
    _lastPrivateHash = newHash;

    if (!visibleMessages || visibleMessages.length === 0) {
        container.innerHTML = `
            <div class="empty-chat-state">
                <span class="empty-icon">👋</span>
                <h4>Start a conversation with ${selectedUser}</h4>
                <p>No prior messages found. Send your first message below!</p>
            </div>
        `;
        setChatStatus(`Direct chat with ${selectedUser} ready.`);
        return;
    }

    container.innerHTML = visibleMessages.map(m => {
        const isMe = m.senderName === sender;
        const otherUser = isMe ? m.receiverName : m.senderName;
        const initials = getInitials(isMe ? sender : otherUser);
        const timeStr = formatChatTime(m.createdAt);

        return `
            <div class="chat-row ${isMe ? 'my-row' : 'other-row'}">
                ${!isMe ? `<div class="chat-avatar">${initials}</div>` : ''}
                <div class="chat-bubble ${isMe ? 'my-bubble' : 'other-bubble'}">
                    <div class="bubble-top-row">
                        <span class="bubble-sender">${isMe ? 'You' : otherUser}</span>
                        <div class="bubble-actions-wrapper">
                            <button class="bubble-action-trigger" onclick="toggleBubbleMenu(event, 'priv_menu_${m.id}')" title="Options">⋮</button>
                            <div id="priv_menu_${m.id}" class="bubble-menu" style="display:none;">
                                <button onclick="deleteMessageForMe('private', ${m.id})">🗑️ Delete for Me</button>
                                ${isMe ? `<button onclick="deleteMessageForEveryone('private', ${m.id})">❌ Delete for Everyone</button>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="bubble-text">${escapeHtml(m.message || '')}</div>
                    <div class="bubble-meta">
                        <span class="bubble-time">${timeStr}</span>
                        ${isMe ? `<span class="read-ticks" title="Delivered">✓✓</span>` : ''}
                    </div>
                </div>
                ${isMe ? `<div class="chat-avatar me-avatar">${initials}</div>` : ''}
            </div>
        `;
    }).join("");

    container.scrollTop = container.scrollHeight;
    setChatStatus(`Connected with ${selectedUser}`);
}

// Bind Enter Key on Chat Inputs
document.addEventListener("DOMContentLoaded", () => {
    ['public-chat-input', 'private-chat-input'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (id === 'public-chat-input') sendPublicMessage();
                    if (id === 'private-chat-input') sendPrivateMessage();
                }
            });
        }
    });
});

setInterval(() => {
    const publicChat = document.getElementById("public-chat");
    const privateChat = document.getElementById("private-chat");

    if (publicChat && publicChat.style.display === "block") {
        loadPublicMessages();
    }

    if (privateChat && privateChat.style.display === "block" && selectedUser) {
        loadPrivateMessages();
    }
}, 2000);

async function changePassword() {

const currentPassword = document.getElementById("current-password").value;
const newPassword = document.getElementById("change-password").value;
const email = localStorage.getItem("loggedInEmail");

if(!currentPassword || !newPassword){
alert("Please fill all fields");
return;
}

try{

    const res = await fetch("/api/change-password",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
email:email,
currentPassword:currentPassword,
newPassword:newPassword
})
});

const data = await res.json();

if(res.ok){
alert("Password changed successfully");
document.getElementById("current-password").value="";
document.getElementById("change-password").value="";
}else{
alert(data.message);
}

}catch(err){
alert("Server error");
}

}
setInterval(()=>{
if (typeof checkNotifications === 'function') checkNotifications();
if (typeof checkAdminMessages === 'function') checkAdminMessages();
},5000);

/* =====================================================
   HOST CODE ROOM & LINK SHARING
===================================================== */
let currentRoomId = null;
let currentClientSessionId = Math.random().toString(36).substring(2);
let roomSyncTimer = null;

function startRoomSync(roomId) {
    currentRoomId = roomId;
    if (roomSyncTimer) clearInterval(roomSyncTimer);

    const editor = $(".compiler-editor");
    const langSelect = $("#compiler-language");
    if (editor && !editor.dataset.syncBound) {
        editor.dataset.syncBound = "true";
        editor.addEventListener("input", () => {
            if (currentRoomId) sendRoomCode();
        });
        if (langSelect) {
            langSelect.addEventListener("change", () => {
                if (currentRoomId) sendRoomCode();
            });
        }
    }

    roomSyncTimer = setInterval(fetchRoomCode, 1200);
    fetchRoomCode();
}

let currentRoomOutput = "";

function sendRoomCode(outputOverride) {
    if (!currentRoomId) return;
    const editor = $(".compiler-editor");
    const langSelect = $("#compiler-language");
    const code = editor ? editor.value : "";
    const lang = langSelect ? langSelect.value : "python";
    if (typeof outputOverride === "string") {
        currentRoomOutput = outputOverride;
    }

    fetch("/api/room/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            roomId: currentRoomId,
            code: code,
            language: lang,
            output: currentRoomOutput,
            senderId: currentClientSessionId
        })
    }).catch(() => {});
}

function fetchRoomCode() {
    if (!currentRoomId) return;
    fetch(`/api/room/sync?roomId=${encodeURIComponent(currentRoomId)}`)
        .then(r => r.json())
        .then(data => {
            if (data && data.status !== "empty") {
                const editor = $(".compiler-editor");
                const langSelect = $("#compiler-language");
                const outputEl = $(".compiler-output");

                if (data.senderId !== currentClientSessionId) {
                    if (editor && typeof data.code === "string" && editor.value !== data.code) {
                        const start = editor.selectionStart;
                        const end = editor.selectionEnd;
                        editor.value = data.code;
                        if (document.activeElement === editor) {
                            editor.setSelectionRange(start, end);
                        }
                    }
                    if (langSelect && data.language && langSelect.value !== data.language) {
                        langSelect.value = data.language;
                    }
                }

                if (outputEl && typeof data.output === "string" && data.output.trim().length > 0 && outputEl.textContent !== data.output) {
                    outputEl.textContent = data.output;
                }
            }
        })
        .catch(() => {});
}

function hostRoom() {
    if (state.isGuest) {
        showGuestMessage();
        return;
    }
    const roomId = 'CT-ROOM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const url = new URL(window.location.href);
    url.searchParams.set("room", roomId);
    window.history.pushState({}, "", url.toString());

    const roomBanner = $("#room-banner");
    const roomLinkText = $("#room-link-text");

    if (roomBanner && roomLinkText) {
        roomLinkText.textContent = url.toString();
        roomBanner.style.display = "flex";
    }

    startRoomSync(roomId);

    navigator.clipboard.writeText(url.toString()).then(() => {
        alert("🌐 Code Room created!\nRoom ID: " + roomId + "\n\nShareable Link copied to clipboard!\nAnyone opening this link will see your live code!");
    }).catch(() => {
        alert("🌐 Code Room created!\nRoom ID: " + roomId + "\nShareable Link: " + url.toString());
    });
}

function copyRoomLink() {
    const text = $("#room-link-text")?.textContent;
    if (text) {
        navigator.clipboard.writeText(text).then(() => {
            alert("Copied room link to clipboard!");
        });
    }
}

function checkRoomInUrl() {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get("room");
    if (roomId) {
        localStorage.removeItem("pendingRoomId");
        showSection("compiler");
        const roomBanner = $("#room-banner");
        const roomLinkText = $("#room-link-text");
        if (roomBanner && roomLinkText) {
            roomLinkText.textContent = window.location.href;
            roomBanner.style.display = "flex";
        }
        startRoomSync(roomId);
        return true;
    }
    return false;
}

/* =====================================================
   HOME QUICK PLAYGROUND RUNNER
===================================================== */
async function runHomeStarterCode() {
    const codeInput = document.getElementById("home-code-input");
    const codeOutput = document.getElementById("home-code-output");
    const runBtn = document.querySelector(".home-run-code-btn");

    if (!codeInput || !codeOutput) return;

    const code = codeInput.value;
    if (!code || !code.trim()) {
        codeOutput.textContent = "Please enter code to run.";
        return;
    }

    if (runBtn) {
        runBtn.innerHTML = "<span>⏳ Executing...</span>";
        runBtn.disabled = true;
    }
    codeOutput.textContent = "Executing code on backend server...";

    try {
        const res = await fetch("/api/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ language: "python", script: code })
        });
        const data = await res.json();
        if (res.ok) {
            codeOutput.textContent = data.output || data.result || "Execution completed with no output.";
        } else {
            codeOutput.textContent = data.error || data.message || `Execution error (${res.status})`;
        }
    } catch (err) {
        codeOutput.textContent = "Error connecting to compiler API: " + err.message;
    } finally {
        if (runBtn) {
            runBtn.innerHTML = "<span>▶ Run Code Live</span>";
            runBtn.disabled = false;
        }
    }
}

/* =====================================================
   INTERACTIVE VIDEO LAB MODAL SYSTEM
===================================================== */
function playVideoLab(title, topics, codeSample) {
    const modal = document.getElementById('video-lab-modal') || createVideoLabModal();
    document.getElementById('video-lab-title').innerText = '⚡ ' + title;
    document.getElementById('video-lab-topics').innerText = 'Topics: ' + topics;
    document.getElementById('video-lab-code').textContent = codeSample || '// Interactive Lab Code';
    modal.style.display = 'grid';
}

function closeVideoLabModal() {
    const modal = document.getElementById('video-lab-modal');
    if (modal) modal.style.display = 'none';
}

function runVideoLabInCompiler() {
    const code = document.getElementById('video-lab-code').textContent;
    closeVideoLabModal();
    showSection('compiler');
    const editor = document.getElementById('code-editor');
    if (editor) {
        editor.value = code;
    }
}

function createVideoLabModal() {
    const div = document.createElement('div');
    div.id = 'video-lab-modal';
    div.style.cssText = 'position:fixed; inset:0; background:rgba(2,6,23,0.85); backdrop-filter:blur(10px); z-index:9999; display:none; place-items:center;';
    div.innerHTML = `
        <div style="background:var(--bg-card, #0f172a); border:1px solid rgba(34,197,94,0.3); border-radius:16px; width:90%; max-width:650px; padding:28px; box-shadow:0 25px 60px rgba(0,0,0,0.8);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:12px;">
                <h3 id="video-lab-title" style="color:var(--text-main, #f0f6ff); font-size:18px; font-family:'Space Grotesk', sans-serif;">⚡ Interactive Video Lab</h3>
                <button onclick="closeVideoLabModal()" style="background:none; border:none; color:var(--text-muted, #64748b); font-size:20px; cursor:pointer;">✕</button>
            </div>
            <p id="video-lab-topics" style="font-size:12px; color:#22c55e; font-weight:600; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px;"></p>
            <p style="font-size:13px; color:var(--text-muted, #94a3b8); margin-bottom:16px;">Interactive Code Walkthrough & Lab Environment:</p>
            <pre style="background:#060b18; border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:16px; font-family:'JetBrains Mono', monospace; font-size:13px; color:#38bdf8; overflow-x:auto; max-height:220px;"><code id="video-lab-code"></code></pre>
            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
                <button onclick="closeVideoLabModal()" class="btn-secondary" style="padding:10px 18px; border-radius:8px; cursor:pointer;">Close</button>
                <button onclick="runVideoLabInCompiler()" class="btn-primary" style="padding:10px 20px; background:#22c55e; color:#021a0d; font-weight:700; border:none; border-radius:8px; cursor:pointer;">▶ Run Code in Compiler</button>
            </div>
        </div>
    `;
    document.body.appendChild(div);
    return div;
}