/* =====================================================
   UTILITIES
===================================================== */
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

/* =====================================================
   APP SECTION HISTORY & NAVIGATION (System Gesture compatible)
===================================================== */
const sectionHistory = ["home"];

function showSectionDirect(sectionId) {
    $$("main > section").forEach(sec => {
        sec.style.display = "none";
        sec.classList.remove("active-section");
    });

    const target = document.getElementById(sectionId);
    if (!target) return;

    target.style.display = "block";
    target.classList.add("active-section");
    setActiveSidebar(sectionId);

    // Show top course search bar ONLY on courses section
    const headerSearch = $("#header-search-courses");
    if (headerSearch) {
        if (sectionId === 'courses') {
            headerSearch.style.display = "inline-block";
        } else {
            headerSearch.style.display = "none";
        }
    }

    // Show navigation arrows (Back/Forward) ONLY inside opened selective course pages
    const navHistoryWrap = document.querySelector(".nav-history-buttons");
    if (navHistoryWrap) {
        const isSelectiveCourseView = sectionId !== 'courses' &&
                                      sectionId !== 'compiler' &&
                                      sectionId !== 'visualizer' &&
                                      sectionId !== 'animated-videos' &&
                                      sectionId !== 'home' &&
                                      sectionId !== 'dashboard' &&
                                      sectionId !== 'user-communication' &&
                                      sectionId !== 'notifications' &&
                                      sectionId !== 'settings' && (
                                        sectionId.includes('-course') || 
                                        sectionId.startsWith('dsa-') ||
                                        sectionId.startsWith('java-') ||
                                        sectionId.startsWith('python-') ||
                                        sectionId.startsWith('sql-') ||
                                        sectionId.startsWith('cpp-')
                                      );
        
        if (isSelectiveCourseView) {
            navHistoryWrap.style.display = "inline-flex";
            document.body.classList.add("nav-history-active");
        } else {
            navHistoryWrap.style.display = "none";
            document.body.classList.remove("nav-history-active");
        }
    }

    if (sectionId === 'settings') {
        populateSettings();
    }
    if (sectionId === 'dashboard') {
        populateDashboard();
    }
    if (sectionId === 'java-course') {
        showJavaContent('intro');
    }
    if (sectionId === 'python-course') {
        showPythonContent('intro');
    }
    if (sectionId === 'sql-course') {
        showSqlContent('intro');
    }
}

function showSection(sectionId) {
    showSectionDirect(sectionId);

    const lastSection = sectionHistory[sectionHistory.length - 1];
    if (lastSection !== sectionId) {
        sectionHistory.push(sectionId);
        history.pushState({ section: sectionId }, "", "");
    }
}

function goBackSection() {
    if (sectionHistory.length <= 1) return;
    sectionHistory.pop(); // Pop current section
    const prevSection = sectionHistory[sectionHistory.length - 1];
    if (prevSection) {
        openProtectedSectionDirect(prevSection);
    }
}

function openProtectedSectionDirect(sectionId) {
    const protectedSections = [
        "notifications",
        "user-communication",
        "dashboard"
    ];

    if (state.isGuest && protectedSections.includes(sectionId)) {
        showGuestMessage();
        return;
    }
    closeGuestMessage();
    showSectionDirect(sectionId);

    if (sectionId === 'user-communication') {
        showChat('public');
    }
    if (sectionId === 'dashboard') {
        populateDashboard();
    }
    if (sectionId === 'settings') {
        populateSettings();
    }
}

// Browser back button / swipe back gesture interception
const initialSec = localStorage.getItem("isGuest") === "true" || !localStorage.getItem("loggedInEmail") ? "home" : "dashboard";
history.pushState({ section: initialSec }, "", "");
window.onpopstate = (event) => {
    if (sectionHistory.length > 1) {
        sectionHistory.pop(); // Pop current section
        const prevSection = sectionHistory[sectionHistory.length - 1];
        if (prevSection) {
            openProtectedSectionDirect(prevSection);
        }
    } else {
        // Prevent leaving main app
        history.pushState({ section: initialSec }, "", "");
    }
};

let currentCourseHistory = [];
let currentCourseForwardHistory = [];

function goAppBack() {
    // If we have sub-topic history within the current opened course, step back through tabs first
    if (currentCourseHistory.length > 1) {
        const currentState = currentCourseHistory.pop();
        currentCourseForwardHistory.push(currentState);
        const prevState = currentCourseHistory[currentCourseHistory.length - 1];
        if (prevState && prevState.course) {
            switchCourseTabDirect(prevState.course, prevState.tab);
            return;
        }
    }
    
    // Reset internal course sub-history when stepping out to selection list
    currentCourseHistory = [];
    currentCourseForwardHistory = [];
    openProtectedSectionDirect('courses');
}

function goAppForward() {
    if (currentCourseForwardHistory.length > 0) {
        const nextState = currentCourseForwardHistory.pop();
        currentCourseHistory.push(nextState);
        if (nextState && nextState.course) {
            switchCourseTabDirect(nextState.course, nextState.tab);
        }
    } else {
        window.history.forward();
    }
}

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

function setActiveSidebar(sectionId) {
    $$(".sidebar .nav-link").forEach(link => link.classList.remove("active"));

    let parentNavSection = sectionId;
    if (sectionId.includes('-course') || sectionId.includes('course-') || sectionId.includes('video-player')) {
        parentNavSection = 'courses';
    }

    const active = document.querySelector(`.sidebar .nav-link[data-section="${parentNavSection}"]`);
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
        "notifications",
        "user-communication",
        "dashboard"
    ];

    if (state.isGuest && protectedSections.includes(sectionId)) {
        showGuestMessage();
        return;
    }
    closeGuestMessage();
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
    const isGuest = localStorage.getItem("isGuest") === "true" || !localStorage.getItem("loggedInEmail");

    let username, email;
    if (isGuest) {
        username = "Guest";
        email = "guest@letscode.com";
    } else {
        username = localStorage.getItem("loggedInUserName") || localStorage.getItem("userName") || localStorage.getItem("username") || state.username || "Developer";
        email = localStorage.getItem("loggedInEmail") || localStorage.getItem("userEmail") || localStorage.getItem("email") || state.email || "student@campus.edu";
    }
    const initials = getInitials(username);

    const nameEl = document.getElementById("settings-username");
    const emailEl = document.getElementById("settings-email");
    const avatarEl = document.getElementById("settings-avatar-bubble");
    const nameVal = document.getElementById("settings-username-val");
    const emailVal = document.getElementById("settings-email-val");
    
    const mobileAvatar = document.getElementById("sidebar-avatar-mobile");
    const mobileUsername = document.getElementById("sidebar-username-mobile");

    if (nameEl) nameEl.textContent = username;
    if (emailEl) emailEl.textContent = email;
    if (avatarEl) avatarEl.textContent = initials;
    if (nameVal) nameVal.textContent = username;
    if (emailVal) emailVal.textContent = email;
    
    if (mobileAvatar) mobileAvatar.textContent = initials;
    if (mobileUsername) mobileUsername.textContent = "Hi, " + username;
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
    if (!await customConfirm("Are you sure you want to dismiss all active notifications?")) return;
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
    if (sessionStorage.getItem("suppressGuestMsg") === "true") return;
    // ensure default markup restored before showing
    restoreGuestOverlay();
    $("#guest-message-overlay").style.display = "flex";
    document.body.classList.add("guest-modal-open");
}

function showGuestWelcome() {
    if (sessionStorage.getItem("suppressGuestMsg") === "true") return;
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

function filterCoursesSection(query) {
    const search = query.toLowerCase().trim();
    const cards = document.querySelectorAll("#courses .course-card");
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(search)) {
            card.style.display = "";
        } else {
            card.style.display = "none";
        }
    });
}

/* =====================================================
   COURSE CONTENT SWITCHER (FINAL – WORKING)
===================================================== */

const courseSubjectTitles = {
    'java': 'Java 21 Enterprise Masterclass',
    'python': 'Python 3.12 Data & Systems',
    'sql': 'SQL & Database Architecture',
    'ds': 'Data Structures & Algorithms Masterclass',
    'cpp': 'C++20 Programming Engine',
    'c': 'C Programming Fundamentals',
    'html': 'HTML5 & Modern Web Development',
    'react': 'React.js Component Architecture',
    'aws': 'AWS Cloud Essentials',
    'dbms': 'Database Management Systems',
    'data-analysis': 'Data Analysis & Scientific Python',
    'nodejs': 'Node.js Backend Architecture',
    'figma': 'Figma UI/UX Design',
    'ethical-hacking': 'Ethical Hacking & Cybersecurity',
    'photoshop': 'Adobe Photoshop Masterclass',
    'design-thinking': 'Design Thinking & Innovation'
};

function updateCourseTopHeader(course) {
    const mainContent = document.querySelector(`#${course}-course .course-main-content`);
    if (!mainContent) return;

    // Remove any existing top header or bottom nav bars completely
    mainContent.querySelectorAll(".course-subject-top-header, .course-bottom-nav-bar").forEach(el => el.remove());
}

function switchCourseTabDirect(course, tab) {
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
    }

    // 3️⃣ Update sidebar active state
    const sidebar = document.querySelector(`#${course}-course .course-sidebar`);
    if (sidebar) {
        const buttons = Array.from(sidebar.querySelectorAll(".course-topic"));
        buttons.forEach(btn => btn.classList.remove("active"));
        buttons.forEach(btn => {
            const btnText = btn.textContent.toLowerCase();
            const searchTab = tab.toLowerCase();
            if (btnText.includes(searchTab) || (searchTab.startsWith('pdf') && btnText.includes('pdf'))) {
                btn.classList.add("active");
            }
        });
    }

    // 4️⃣ Update Top Course Header
    setTimeout(() => {
        updateCourseTopHeader(course);
    }, 10);
}

function switchCourseTab(course, tab) {
    const currentState = { course, tab };
    const lastState = currentCourseHistory[currentCourseHistory.length - 1];
    if (!lastState || lastState.course !== course || lastState.tab !== tab) {
        currentCourseHistory.push(currentState);
    }
    currentCourseForwardHistory = [];
    switchCourseTabDirect(course, tab);
}

function navigateCourseTopic(course, index) {
    const sidebar = document.querySelector(`#${course}-course .course-sidebar`);
    if (!sidebar) return;
    const buttons = Array.from(sidebar.querySelectorAll(".course-topic"));
    if (buttons[index]) {
        buttons[index].click();
        const mainContent = document.querySelector(`#${course}-course .course-main-content`);
        if (mainContent) {
            mainContent.scrollTop = 0;
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}
function showJavaContent(tab) {
    switchCourseTab("java", tab);
    if (tab === "interview") {
        loadJavaInterviewHub();
    }
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
    setTheme(localStorage.getItem("theme") || "light");

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

        const urlParams = new URLSearchParams(window.location.search);
        const hasTargetSection = urlParams.has("section");

        if (hasTargetSection || sessionStorage.getItem("suppressGuestMsg")) {
            sessionStorage.removeItem("suppressGuestMsg");
            sessionStorage.removeItem("justGuest");
            closeGuestMessage();
        } else if (sessionStorage.getItem("justGuest")) {
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
        openProtectedSection("dashboard");
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

    function injectIframeMobileStyles(iframeElement) {
        if (!iframeElement) return;
        try {
            const doc = iframeElement.contentDocument || iframeElement.contentWindow.document;
            if (!doc) return;
            if (doc.getElementById('mobile-injected-styles')) return;

            const link = doc.createElement('link');
            link.id = 'mobile-injected-styles';
            link.rel = 'stylesheet';
            link.href = window.location.origin + '/visualizer-mobile.css';
            doc.head.appendChild(link);
        } catch (e) {
            console.warn("[IFRAME STYLE] Could not inject mobile styles: ", e);
        }
    }

    function openModal(video) {
        if (!modal || !modalIframe) return;
        const videoSrc = `${window.location.origin}/${video.src.split('/').map(encodeURIComponent).join('/')}`;
        modalTitle.textContent = video.title;
        modalBadge.textContent = video.language.toUpperCase();
        modalIframe.src = videoSrc;
        
        modalIframe.onload = () => {
            injectIframeMobileStyles(modalIframe);
        };
        
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
            const container = document.querySelector('.animation-modal-container');
            if (!container) return;

            if (container.requestFullscreen) {
                container.requestFullscreen();
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            }

            // Lock screen orientation to landscape if API is supported
            try {
                if (screen.orientation && screen.orientation.lock) {
                    screen.orientation.lock("landscape").catch(err => {
                        console.log("Screen orientation lock failed: ", err);
                    });
                }
            } catch (e) {
                console.warn("Screen orientation not supported: ", e);
            }
        };
    }

    // Automatically unlock screen orientation when exiting fullscreen
    const resetOrientation = () => {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            try {
                if (screen.orientation && screen.orientation.unlock) {
                    screen.orientation.unlock();
                }
            } catch(e) {}
        }
    };
    document.addEventListener('fullscreenchange', resetOrientation);
    document.addEventListener('webkitfullscreenchange', resetOrientation);

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
   DYNAMIC DAILY LOGIN CODING STREAK ENGINE
===================================================== */
function updateCodingStreak(recordActivity = false) {
    try {
        const username = localStorage.getItem("loggedInUserName") || state.username || "guest";
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        const lastDateKey = `streak_last_date_${username}`;
        const countKey = `streak_count_${username}`;

        const lastDate = localStorage.getItem(lastDateKey);
        let currentCount = parseInt(localStorage.getItem(countKey) || "1", 10);

        if (!lastDate) {
            currentCount = 1;
            localStorage.setItem(lastDateKey, todayStr);
            localStorage.setItem(countKey, "1");
        } else if (lastDate !== todayStr) {
            const pL = lastDate.split('-').map(Number);
            const pT = todayStr.split('-').map(Number);
            const dLast = new Date(pL[0], pL[1] - 1, pL[2]);
            const dToday = new Date(pT[0], pT[1] - 1, pT[2]);
            const diffDays = Math.round((dToday - dLast) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // Logged in on consecutive day -> Increase streak +1
                currentCount += 1;
                localStorage.setItem(lastDateKey, todayStr);
                localStorage.setItem(countKey, currentCount.toString());
            } else if (diffDays > 1) {
                // Missed a day -> Reset streak to 1
                currentCount = 1;
                localStorage.setItem(lastDateKey, todayStr);
                localStorage.setItem(countKey, "1");
            }
        }

        // Update all streak display elements across the DOM
        const streakEls = document.querySelectorAll("#dash-streak-count, .streak-count-value");
        streakEls.forEach(el => {
            el.textContent = `${currentCount} Day${currentCount > 1 ? 's' : ''}`;
        });
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
let _activeQuizLangFilter = 'All';
let _cachedPersonalScores = [];

let _activeLeaderboardLangFilter = 'Java';
let _cachedLeaderboardScores = [];

function setQuizLangFilter(lang) {
    _activeQuizLangFilter = lang;
    renderFilteredQuizScores();
}

function renderFilteredQuizScores() {
    const topUsersContainer = document.getElementById("topUsersTable");
    const filterBar = document.getElementById("quiz-lang-filter-bar");
    if (!topUsersContainer) return;

    if (!_cachedPersonalScores || !_cachedPersonalScores.length) {
        topUsersContainer.innerHTML = `<div class="dash-empty-state">No quiz scores recorded yet. Take a quiz to see your history!</div>`;
        if (filterBar) filterBar.innerHTML = "";
        return;
    }

    // 1. Detect attempted languages
    const attemptedLangs = [];
    _cachedPersonalScores.forEach(r => {
        const q = (r.quiz || '').toLowerCase();
        let langName = 'Other';
        if (q.includes('java')) langName = 'Java';
        else if (q.includes('python')) langName = 'Python';
        else if (q.includes('sql')) langName = 'SQL';

        if (!attemptedLangs.includes(langName)) {
            attemptedLangs.push(langName);
        }
    });



    const allFilterOptions = ['All', ...attemptedLangs.filter(l => l !== 'All')];

    // Render Filter Pills
    if (filterBar) {
        filterBar.innerHTML = allFilterOptions.map(l => {
            const isActive = l === _activeQuizLangFilter;
            const icon = l === 'Java' ? '☕' : (l === 'Python' ? '🐍' : (l === 'SQL' ? '🛢️' : (l === 'All' ? '📊' : '💻')));
            return `
                <button type="button" class="filter-pill ${isActive ? 'active' : ''}" onclick="setQuizLangFilter('${l}')">
                    ${icon} ${l}
                </button>
            `;
        }).join("");
    }

    const filtered = _cachedPersonalScores.filter(r => {
        if (_activeQuizLangFilter === 'All') return true;
        const q = (r.quiz || '').toLowerCase();
        if (_activeQuizLangFilter === 'Java') return q.includes('java');
        if (_activeQuizLangFilter === 'Python') return q.includes('python');
        if (_activeQuizLangFilter === 'SQL') return q.includes('sql');
        if (_activeQuizLangFilter === 'Other') return !q.includes('java') && !q.includes('python') && !q.includes('sql');
        return true;
    });

    // Filter by search term
    const searchVal = (document.getElementById("personal-quiz-search")?.value || "").toLowerCase().trim();
    let displayList = filtered;
    if (searchVal) {
        displayList = filtered.filter(r => 
            (r.quiz || "").toLowerCase().includes(searchVal)
        );
    }

    if (!displayList.length) {
        topUsersContainer.innerHTML = `<div class="dash-empty-state">No matching ${_activeQuizLangFilter} quiz scores found.</div>`;
        return;
    }

    // Render personal history as a premium compact table
    let listHtml = `<div class="leaderboard-table-container">
        <table class="leaderboard-premium-table">
            <thead>
                <tr>
                    <th>Track</th>
                    <th>Quiz Title</th>
                    <th>Score</th>
                    <th>Accuracy</th>
                </tr>
            </thead>
            <tbody>`;

    displayList.forEach(r => {
        const qLabel = (r.quiz || 'Quiz').trim();
        const qLower = qLabel.toLowerCase();
        const total = r.total || (qLower.includes('java') ? 20 : (qLower.includes('python') || qLower.includes('sql') ? 10 : 15));
        const score = r.score != null ? r.score : 0;
        const pct = Math.min(100, Math.max(0, Math.round((score / total) * 100)));
        const level = qLower.includes('beginner') ? 'Beginner' : (qLower.includes('intermediate') ? 'Intermediate' : (qLower.includes('advanced') ? 'Advanced' : 'Practice'));
        const track = qLower.includes('java') ? 'Java' : (qLower.includes('python') ? 'Python' : (qLower.includes('sql') ? 'SQL' : 'Other'));
        const accuracyColorClass = pct >= 90 ? 'accuracy-high' : (pct >= 60 ? 'accuracy-med' : 'accuracy-low');

        listHtml += `
            <tr>
                <td>
                    <span class="track-tag-pill ${track.toLowerCase()}">${track}</span>
                </td>
                <td>
                    <div class="user-cell-info">
                        <div class="user-cell-name">${escapeHtml(qLabel)}</div>
                        <div class="user-cell-handle">${escapeHtml(level)} Level</div>
                    </div>
                </td>
                <td>
                    <span class="table-score-badge">${score} / ${total}</span>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="accuracy-percentage-label ${accuracyColorClass}">${pct}%</span>
                        <div class="table-progress-bar-container">
                            <div class="table-progress-bar-fill ${accuracyColorClass}" style="width: ${pct}%;"></div>
                        </div>
                    </div>
                </td>
            </tr>`;
    });

    listHtml += `</tbody></table></div>`;
    topUsersContainer.innerHTML = listHtml;
}

function openPrivateChatWith(targetUserName) {
    if (!targetUserName) return;
    if (typeof openProtectedSection === 'function') {
        openProtectedSection('user-communication');
    } else if (typeof showSection === 'function') {
        showSection('user-communication');
    }
    if (typeof showChat === 'function') {
        showChat('private');
    }
    if (typeof selectUser === 'function') {
        selectUser(targetUserName);
    }
}

function setLeaderboardLangFilter(lang) {
    _activeLeaderboardLangFilter = lang;
    renderFilteredLeaderboard();
}

function renderFilteredLeaderboard() {
    const scoreContainer = document.getElementById("scoreDashboardContent");
    const filterBar = document.getElementById("leaderboard-lang-filter-bar");
    const kpiRank = document.getElementById("kpi-campus-rank");
    const kpiSub = document.getElementById("kpi-campus-sub");
    if (!scoreContainer) return;

    if (!_cachedLeaderboardScores || !_cachedLeaderboardScores.length) {
        scoreContainer.innerHTML = `<div class="dash-empty-state">No campus leaderboard scores available yet.</div>`;
        if (filterBar) filterBar.innerHTML = "";
        if (kpiRank) kpiRank.innerHTML = `N/A <span class="stat-unit">Rank</span>`;
        return;
    }

    // Filter bar options: Java Beginner, Java Intermediate, Java Advanced, Python, SQL
    const filterOptions = [
        { label: 'Java Beginner', icon: '☕', count: '(20 Qs)', key: 'java beginner' },
        { label: 'Java Intermediate', icon: '☕', count: '(20 Qs)', key: 'java intermediate' },
        { label: 'Java Advanced', icon: '☕', count: '(20 Qs)', key: 'java advanced' },
        { label: 'Python', icon: '🐍', count: '(10 Qs)', key: 'python' },
        { label: 'SQL', icon: '🛢️', count: '(10 Qs)', key: 'sql' }
    ];

    if (!_activeLeaderboardLangFilter || (!_activeLeaderboardLangFilter.includes('Java') && !_activeLeaderboardLangFilter.includes('Python') && !_activeLeaderboardLangFilter.includes('SQL'))) {
        _activeLeaderboardLangFilter = 'Java Beginner';
    }

    if (filterBar) {
        filterBar.innerHTML = filterOptions.map(opt => {
            const isActive = opt.label === _activeLeaderboardLangFilter;
            return `
                <button type="button" class="filter-pill ${isActive ? 'active' : ''}" onclick="setLeaderboardLangFilter('${opt.label}')">
                    ${opt.icon} ${opt.label} ${opt.count}
                </button>
            `;
        }).join("");
    }

    // Filter raw scores by selected level
    const targetOpt = filterOptions.find(o => o.label === _activeLeaderboardLangFilter) || filterOptions[0];
    const rawFiltered = _cachedLeaderboardScores.filter(r => {
        const q = (r.quiz || '').toLowerCase();
        if (targetOpt.key === 'java beginner') return q.includes('java') && (q.includes('beginner') || (!q.includes('intermediate') && !q.includes('advanced')));
        if (targetOpt.key === 'java intermediate') return q.includes('java') && q.includes('intermediate');
        if (targetOpt.key === 'java advanced') return q.includes('java') && q.includes('advanced');
        if (targetOpt.key === 'python') return q.includes('python');
        if (targetOpt.key === 'sql') return q.includes('sql');
        return true;
    });

    // Group by user email / name to compute top score per developer
    const userMap = new Map();
    rawFiltered.forEach(r => {
        const key = (r.email || r.name || 'developer').toLowerCase();
        const score = r.score != null ? r.score : 0;
        const name = (r.name && r.name.trim() !== '') ? r.name.trim() : (r.username ? r.username : (r.email ? r.email.split('@')[0] : 'Developer'));
        const username = r.username || name.toLowerCase().replace(/\s+/g, '');

        if (!userMap.has(key)) {
            userMap.set(key, { key, name, username, email: r.email, topScore: score });
        } else {
            const existing = userMap.get(key);
            if (score > existing.topScore) {
                existing.topScore = score;
            }
        }
    });

    // Sort full ranked list of all users descending by topScore
    const fullLeaderboard = Array.from(userMap.values()).sort((a, b) => b.topScore - a.topScore);
    const currentUserEmail = (state.email || localStorage.getItem("loggedInEmail") || "").toLowerCase();
    const currentUserName = (localStorage.getItem("loggedInUserName") || state.username || "").toLowerCase();

    // Find current user's index in full Leaderboard
    let myRankIndex = fullLeaderboard.findIndex(r => {
        if (currentUserEmail && r.email && r.email.toLowerCase() === currentUserEmail) return true;
        if (currentUserName && r.name && r.name.toLowerCase() === currentUserName) return true;
        if (currentUserName && r.username && r.username.toLowerCase() === currentUserName) return true;
        return false;
    });

    // Update KPI Card
    if (kpiRank) {
        if (myRankIndex !== -1) {
            kpiRank.innerHTML = `Rank #${myRankIndex + 1} <span class="stat-unit">Position</span>`;
            if (kpiSub) kpiSub.textContent = `${_activeLeaderboardLangFilter} Leaderboard (${fullLeaderboard.length} Developers)`;
        } else {
            kpiRank.innerHTML = `Top 5% <span class="stat-unit">Rank</span>`;
            if (kpiSub) kpiSub.textContent = `${_activeLeaderboardLangFilter} Global Position`;
        }
    }

    // Filter by search term
    const searchVal = (document.getElementById("leaderboard-search")?.value || "").toLowerCase().trim();
    let displayList = fullLeaderboard;
    if (searchVal) {
        displayList = fullLeaderboard.filter(r => 
            (r.name || "").toLowerCase().includes(searchVal) || 
            (r.username || "").toLowerCase().includes(searchVal) ||
            (r.email || "").toLowerCase().includes(searchVal)
        );
    }

    if (!displayList.length) {
        scoreContainer.innerHTML = `<div class="dash-empty-state">No users match "${escapeHtml(searchVal)}" in ${_activeLeaderboardLangFilter}.</div>`;
        return;
    }

    // Render a high-performance scrollable list
    let listHtml = `<div class="leaderboard-table-container">
        <table class="leaderboard-premium-table">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Developer</th>
                    <th>Score</th>
                    <th style="text-align: right;">Action</th>
                </tr>
            </thead>
            <tbody>`;

    displayList.forEach((r, idx) => {
        const originalIndex = fullLeaderboard.findIndex(u => u.key === r.key);
        const rankNum = originalIndex !== -1 ? originalIndex + 1 : idx + 1;
        const displayName = r.name;
        const handle = `@${r.username}`;
        const topScore = r.topScore != null ? r.topScore : 0;
        
        const rankBadge = rankNum === 1 ? '🥇' : (rankNum === 2 ? '🥈' : (rankNum === 3 ? '🥉' : `#${rankNum}`));
        const rankClass = rankNum === 1 ? 'gold' : (rankNum === 2 ? 'silver' : (rankNum === 3 ? 'bronze' : 'normal'));
        
        const isSelf = (currentUserEmail && r.email && r.email.toLowerCase() === currentUserEmail) ||
                       (currentUserName && (r.name.toLowerCase() === currentUserName || r.username.toLowerCase() === currentUserName));

        listHtml += `
            <tr class="${isSelf ? 'table-row-self' : ''}">
                <td>
                    <span class="rank-badge-cell ${rankClass}">${rankBadge}</span>
                </td>
                <td>
                    <div class="user-cell-info">
                        <div class="user-cell-name">${escapeHtml(displayName)} ${isSelf ? '<span class="you-pill">You</span>' : ''}</div>
                        <div class="user-cell-handle">${escapeHtml(handle)}</div>
                    </div>
                </td>
                <td>
                    <span class="table-score-badge">${topScore} pts</span>
                </td>
                <td style="text-align: right;">
                    ${isSelf ? '<span class="self-tag-pill">Current Player</span>' : `<button type="button" class="table-action-chat-btn" onclick="openPrivateChatWith('${escapeHtml(displayName)}')">💬 Message</button>`}
                </td>
            </tr>`;
    });

    listHtml += `</tbody></table></div>`;
    scoreContainer.innerHTML = listHtml;
}

async function populateDashboard(force = false) {
    updateCodingStreak();
    const scoreContainer = $("#scoreDashboardContent");
    const topUsersContainer = $("#topUsersTable");
    const currentUser = localStorage.getItem("loggedInUserName") || state.username || "Developer";
    const isNewUser = sessionStorage.getItem("isNewUser") === "true";
    
    const dashHeroTitle = document.querySelector(".dash-hero-title");
    const mobileWelcome = document.querySelector(".user-welcome-mobile");

    if (dashHeroTitle) {
        dashHeroTitle.innerHTML = isNewUser
            ? `Welcome, <span id="dash-user-name">${currentUser}</span>! 👋`
            : `Welcome back, <span id="dash-user-name">${currentUser}</span>! 👋`;
    } else if (dashUserName) {
        dashUserName.textContent = currentUser;
    }

    if (mobileWelcome) {
        mobileWelcome.textContent = isNewUser ? "Welcome" : "Welcome back";
    }

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
        const rawScores = await res.json();

        // Check if leaderboard data has changed before mutating DOM
        const newLeaderboardHash = JSON.stringify(rawScores);
        if (force || newLeaderboardHash !== _lastLeaderboardHash) {
            _lastLeaderboardHash = newLeaderboardHash;
            _cachedLeaderboardScores = rawScores;
            renderFilteredLeaderboard();
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

                    _cachedPersonalScores = personal;
                    renderFilteredQuizScores();
                }
            } catch (err) {
                console.error('Error loading personal scores', err);
            }
        } else {
            if (!topUsersContainer.children.length || topUsersContainer.innerHTML.includes("Loading")) {
                topUsersContainer.innerHTML = `<div class="dash-empty-state">Log in to view your personal score history.</div>`;
            }
        }
        updateDsaDashboardScore();
    } catch (err) {
        console.error("Failed to load dashboard:", err);
    }
}

function updateDsaDashboardScore() {
    try {
        let solvedList = [];
        if (typeof getSolvedProblems === 'function') {
            solvedList = getSolvedProblems();
        } else {
            solvedList = JSON.parse(localStorage.getItem("solved_dsa_problems") || localStorage.getItem("dsa_solved_problems") || "[]");
        }
        
        const solvedCount = Array.isArray(solvedList) ? solvedList.length : 0;
        
        const dsaKpiElem = document.getElementById("kpi-dsa-score");
        if (dsaKpiElem) {
            dsaKpiElem.innerHTML = `${solvedCount} <span class="stat-unit">Solved</span>`;
        }
        
        const dsaSubElem = document.getElementById("kpi-dsa-quiz-sub");
        if (dsaSubElem) {
            dsaSubElem.innerText = solvedCount === 1 ? "1 DSA Coding Problem Completed" : `${solvedCount} DSA Coding Problems Completed`;
        }
    } catch(e) {
        console.error("Error updating DSA dashboard score:", e);
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

function loadJavaInterviewHub() {
    const container = document.getElementById("java-interview-hub-content");
    if (!container) return;

    fetch("./concepts/java/interview.html")
        .then(res => {
            if (!res.ok) throw new Error("Interview file not found");
            return res.text();
        })
        .then(html => {
            container.innerHTML = html;
            initInterviewSearchAndFilter();
        })
        .catch(err => {
            console.error(err);
            container.innerHTML = `
                <div style="color:red; padding:18px; border-radius:12px; background:rgba(239,68,68,0.06); border:1.5px solid rgba(239,68,68,0.2);">
                    ❌ Unable to load Interview Preparation Hub.<br>
                    Please verify that static resource build outputs are synchronized.
                </div>`;
        });
}

function initInterviewSearchAndFilter() {
    const searchInput   = document.getElementById("interview-search");
    const companySelect = document.getElementById("company-filter");
    const topicSelect   = document.getElementById("topic-filter");
    const countDisplay  = document.getElementById("q-count-display");

    function filterQuestions() {
        const query           = searchInput   ? searchInput.value.trim().toLowerCase()   : "";
        const selectedCompany = companySelect ? companySelect.value.toLowerCase()         : "all";
        const selectedTopic   = topicSelect   ? topicSelect.value.toLowerCase()           : "all";

        const cards = document.querySelectorAll(".interview-q-card");
        let visible = 0;

        cards.forEach(card => {
            const text          = card.textContent.toLowerCase();
            const companiesAttr = (card.getAttribute("data-companies") || "").toLowerCase();
            const topicAttr     = (card.getAttribute("data-topic")     || "").toLowerCase();

            const companiesList = companiesAttr.split(",").map(c => c.trim());

            const matchText    = !query                    || text.includes(query);
            const matchCompany = selectedCompany === "all" || companiesList.includes(selectedCompany);
            const matchTopic   = selectedTopic   === "all" || topicAttr.includes(selectedTopic.toLowerCase());

            const show = matchText && matchCompany && matchTopic;
            card.style.display = show ? "" : "none";
            if (show) visible++;
        });

        // Update live count label
        if (countDisplay) {
            countDisplay.textContent = visible === cards.length
                ? `Showing all ${cards.length} questions`
                : `Showing ${visible} of ${cards.length} questions`;
        }
    }

    if (searchInput)   searchInput.addEventListener("input",  filterQuestions);
    if (companySelect) companySelect.addEventListener("change", filterQuestions);
    if (topicSelect)   topicSelect.addEventListener("change",  filterQuestions);

    // Run once on load to set initial count
    filterQuestions();
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
    const container = document.getElementById("admin-messages");
    if (container) {
        container.innerHTML = "";
        container.style.display = "none";
    }
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
    if (!await customConfirm("Are you sure you want to delete this message for everyone?")) return;
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
        if (!await customConfirm(`Are you sure you want to clear your conversation history with ${selectedUser}?`)) return;

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
        if (!await customConfirm("Are you sure you want to clear the public community channel history?")) return;

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

const _EMOJI_LIST = [
    '😊', '😂', '😍', '😎', '🥳', '🤔',
    '🙌', '👍', '👎', '❤️', '🔥', '🎉',
    '💯', '🚀', '💻', '☕', '🐍', '🛢️',
    '⚡', '🧠', '🐞', '🤖', '🔒', '⚙️',
    '🌐', '📦', '📄', '🏆', '🥇', '✨',
    '🎯', '💬', '🤝', '✌️', '👊', '👌'
];

function toggleEmojiPicker(inputId, btnElement) {
    const parentBar = btnElement.closest('.messenger-input-bar');
    if (!parentBar) return;

    parentBar.style.position = 'relative';

    let picker = parentBar.querySelector('.emoji-picker-popup');
    if (picker) {
        picker.style.display = picker.style.display === 'none' ? 'grid' : 'none';
        return;
    }

    document.querySelectorAll('.emoji-picker-popup').forEach(p => p.style.display = 'none');

    picker = document.createElement('div');
    picker.className = 'emoji-picker-popup';
    picker.style.cssText = `
        position: absolute;
        bottom: 64px;
        left: 16px;
        z-index: 9999;
        background: rgba(15, 23, 42, 0.98);
        backdrop-filter: blur(18px);
        border: 1px solid rgba(0, 208, 132, 0.4);
        border-radius: 16px;
        padding: 10px;
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.85);
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 5px;
        width: 285px;
        box-sizing: border-box;
        overflow: hidden;
    `;

    picker.innerHTML = _EMOJI_LIST.map(e => `
        <button type="button" 
                style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:8px; font-size:1.15rem; height:34px; width:100%; display:flex; align-items:center; justify-content:center; padding:0; cursor:pointer; box-sizing:border-box; transition:all 0.15s ease;"
                onmouseover="this.style.background='rgba(0,208,132,0.25)'; this.style.transform='scale(1.15)';"
                onmouseout="this.style.background='rgba(255,255,255,0.06)'; this.style.transform='scale(1)';"
                onclick="insertEmoji('${inputId}', '${e}'); this.closest('.emoji-picker-popup').style.display='none';">
            ${e}
        </button>
    `).join("");

    parentBar.appendChild(picker);

    document.addEventListener('click', (e) => {
        if (!picker.contains(e.target) && e.target !== btnElement) {
            picker.style.display = 'none';
        }
    });
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

function getChatDateHeader(dateStr) {
    if (!dateStr) return "Today";
    const msgDate = new Date(dateStr);
    if (isNaN(msgDate.getTime())) return "Today";

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const checkDate = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());

    if (checkDate.getTime() === today.getTime()) {
        return "Today";
    } else if (checkDate.getTime() === yesterday.getTime()) {
        return "Yesterday";
    } else {
        return checkDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
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

    let lastDateHeader = null;
    let htmlContent = "";

    visibleMessages.forEach(m => {
        const dateHeader = getChatDateHeader(m.createdAt);
        if (dateHeader !== lastDateHeader) {
            htmlContent += `
                <div class="chat-date-separator">
                    <span>${dateHeader}</span>
                </div>
            `;
            lastDateHeader = dateHeader;
        }

        const isMe = (m.userName || 'Guest') === currentUser;
        const initials = getInitials(m.userName || 'Guest');
        const timeStr = formatChatTime(m.createdAt);

        htmlContent += `
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
                    <div class="bubble-text">${formatMessageText(m.message || '')}</div>
                    <div class="bubble-meta">
                        <span class="bubble-time">${timeStr}</span>
                        ${isMe ? `<span class="read-ticks" title="Sent">✓✓</span>` : ''}
                    </div>
                </div>
                ${isMe ? `<div class="chat-avatar me-avatar">${initials}</div>` : ''}
            </div>
        `;
    });

    container.innerHTML = htmlContent;
    container.scrollTop = container.scrollHeight;
    setChatStatus("Public lounge connected · Auto-syncing");
}

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatMessageText(str) {
    if (!str) return '';
    let escaped = escapeHtml(str);
    // Parse triple backticks (fenced code blocks)
    escaped = escaped.replace(/```([\s\S]+?)```/g, (match, code) => {
        return `<pre class="chat-code-block"><code>${code.trim()}</code></pre>`;
    });
    // Parse single backticks (inline code)
    escaped = escaped.replace(/`([^`\n]+?)`/g, (match, code) => {
        return `<code class="chat-inline-code">${code}</code>`;
    });
    // Convert newlines to break tags
    return escaped.replace(/\n/g, '<br>');
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

    const visibleUsers = users.filter(u => {
        const name = typeof u === 'object' ? u.name : u;
        const handle = (typeof u === 'object' && u.username) ? u.username.toLowerCase() : '';
        const email = (typeof u === 'object' && u.email) ? u.email.toLowerCase() : '';
        const nLower = (name || '').toLowerCase();

        // Hide current logged in user
        if (name === currentUser) return false;

        // Hide all admin accounts & handles from contact list
        if (handle === 'admin' || handle === 'system_admin' || handle === 'support' || handle === 'letscodetogether') return false;
        if (email === 'letscodetogetheredu@gmail.com' || email === 'deepakgowrishankar7@gmail.com') return false;
        if (nLower.includes('admin') || nLower.includes('system admin') || nLower.includes('lets code together')) return false;

        return true;
    });

    const newHash = JSON.stringify({ selectedUser, visibleUsers, _userStatuses });
    if (!force && newHash === _lastUsersHash) return;
    _lastUsersHash = newHash;

    if (!visibleUsers.length) {
        list.innerHTML = `<div class="user-item-empty">No other registered contacts found.</div>`;
        return;
    }

    list.innerHTML = visibleUsers.map(u => {
        const name = typeof u === 'object' ? u.name : u;
        const handle = (typeof u === 'object' && u.username) ? `@${u.username}` : '';
        const isActive = name === selectedUser;
        const initials = getInitials(name);
        const status = _userStatuses[name] || 'offline';
        const statusLabel = status === 'online' ? '🟢 Online' : (status === 'away' ? '🟡 Away' : '⚪ Offline');
        const dotClass = status === 'online' ? 'online' : (status === 'away' ? 'away' : 'offline');

        const lastMsgInfo = _lastMessagesMap[name];
        const subContent = lastMsgInfo 
            ? `<span style="color:var(--text-secondary); font-size:0.75rem; font-weight:500;">${lastMsgInfo.isMe ? 'You: ' : ''}${escapeHtml(lastMsgInfo.snippet)}</span>`
            : statusLabel;
        const timeDisplay = (lastMsgInfo && lastMsgInfo.time) ? `<span class="user-item-time">${lastMsgInfo.time}</span>` : '';

        return `
            <div class="user-item ${isActive ? 'active' : ''}" data-username="${name}" onclick="selectUser('${name}')">
                <div class="user-item-avatar">${initials}</div>
                <div class="user-item-info">
                    <div class="user-item-header">
                        <div class="user-item-name">${name} ${handle ? `<span style="font-size:0.75rem; color:var(--jade); font-weight:600; margin-left:4px;">${handle}</span>` : ''}</div>
                        ${timeDisplay}
                    </div>
                    <div class="user-item-sub">${subContent}</div>
                </div>
                <span class="online-dot ${dotClass}" title="${statusLabel}"></span>
            </div>
        `;
    }).join("");

    updateSelectedUserInfo();
    searchUser();
}

function searchUser() {
    const input = document.getElementById("private-user-search");
    if (!input) return;
    const query = input.value.trim().toLowerCase();
    const clearBtn = document.getElementById("clear-search-btn");
    if (clearBtn) clearBtn.style.display = query.length > 0 ? "flex" : "none";

    const items = document.querySelectorAll("#private-user-list .user-item");
    let matchCount = 0;

    items.forEach(item => {
        const username = (item.dataset.username || "").toLowerCase();
        const fullText = (item.textContent || "").toLowerCase();
        const matches = query === "" || username.includes(query) || fullText.includes(query);
        item.style.display = matches ? "flex" : "none";
        if (matches) matchCount++;
    });

    const userList = document.getElementById("private-user-list");
    let noResultsEl = document.getElementById("no-search-results");

    if (matchCount === 0 && items.length > 0 && query.length > 0) {
        if (!noResultsEl && userList) {
            noResultsEl = document.createElement("div");
            noResultsEl.id = "no-search-results";
            noResultsEl.className = "user-item-empty";
            noResultsEl.style.padding = "20px 14px";
            noResultsEl.style.textAlign = "center";
            noResultsEl.style.fontSize = "0.85rem";
            noResultsEl.style.color = "var(--text-tertiary)";
            userList.appendChild(noResultsEl);
        }
        if (noResultsEl) {
            noResultsEl.textContent = `🔍 No contacts found matching "${query}"`;
            noResultsEl.style.display = "block";
        }
    } else if (noResultsEl) {
        noResultsEl.style.display = "none";
    }
}

function clearUserSearch() {
    const input = document.getElementById("private-user-search");
    if (input) {
        input.value = "";
        searchUser();
        input.focus();
    }
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

// Sound & Notification Helper Functions
function playMessageChimeSound() {
    if (localStorage.getItem("chatSoundMuted") === "true") return;
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        
        const now = ctx.currentTime;
        
        // Note 1: D5 (587.33Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now);
        gain1.gain.setValueAtTime(0.15, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.22);

        // Note 2: A5 (880Hz)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, now + 0.08);
        gain2.gain.setValueAtTime(0.2, now + 0.08);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.35);
    } catch (e) {
        console.warn("Audio chime play error:", e);
    }
}

function toggleChatSound() {
    const isMuted = localStorage.getItem("chatSoundMuted") === "true";
    const newMuted = !isMuted;
    localStorage.setItem("chatSoundMuted", newMuted ? "true" : "false");
    updateSoundButtonUI();
    
    if (!newMuted) {
        playMessageChimeSound();
        setChatStatus("Message notifications unmuted 🔔");
    } else {
        setChatStatus("Message notifications muted 🔕");
    }
}

function updateSoundButtonUI() {
    const btnIcon = document.getElementById("sound-icon-symbol");
    const soundBtn = document.getElementById("header-sound-btn");
    const isMuted = localStorage.getItem("chatSoundMuted") === "true";
    if (btnIcon) btnIcon.textContent = isMuted ? "🔕" : "🔔";
    if (soundBtn) soundBtn.title = isMuted ? "Unmute Message Notifications" : "Mute Message Notifications";
}

let _totalUnreadCount = 0;

function updateHeaderChatBadge(count) {
    const badge = document.getElementById("header-unread-count");
    if (!badge) return;
    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

document.addEventListener("DOMContentLoaded", () => {
    updateSoundButtonUI();
});

function updateSelectedUserInfo() {
    const info = document.getElementById("selected-user-info");
    if (!info) return;

    if (!selectedUser) {
        info.textContent = "Select a contact from the list to start messaging";
        return;
    }

    const status = _userStatuses[selectedUser] || 'offline';
    const statusLabel = status === 'online' ? '🟢 Active now · Private Messages' : (status === 'away' ? '🟡 Away · Private Messages' : '⚪ Offline · Private Messages');
    info.textContent = statusLabel;
}

const _lastMessagesMap = {};

async function sendPrivateMessage() {
    const input = document.getElementById("private-chat-input");
    if (!input) return;
    const message = input.value.trim();
    const sender = localStorage.getItem("loggedInUserName");

    if (!selectedUser || !message) {
        if (!selectedUser) customAlert("Please select a contact from the list to send a private message.");
        return;
    }

    const container = document.getElementById("private-chat-messages");
    const tempId = "temp_msg_" + Date.now();
    const nowISO = new Date().toISOString();
    const timeStr = formatChatTime(nowISO);
    const initials = getInitials(sender);

    // Check if recipient is online for WhatsApp double green ticks
    const isRecipientOnline = _userStatuses[selectedUser] === 'online';
    const tickColor = isRecipientOnline ? '#10b981' : '#94a3b8';
    const tickTitle = isRecipientOnline ? 'Read' : 'Delivered';

    // WhatsApp-style instant local message render
    if (container) {
        const emptyState = container.querySelector(".empty-chat-state");
        if (emptyState) emptyState.remove();

        const tempBubbleHtml = `
            <div class="chat-row my-row" id="${tempId}" style="opacity: 0.9; transition: opacity 0.3s ease;">
                <div class="chat-bubble my-bubble">
                    <div class="bubble-top-row">
                        <span class="bubble-sender">You</span>
                    </div>
                    <div class="bubble-text">${formatMessageText(message)}</div>
                    <div class="bubble-meta">
                        <span class="bubble-time">${timeStr}</span>
                        <span class="read-ticks" style="color: ${tickColor}; font-weight: 800;" title="${tickTitle}">✓✓</span>
                    </div>
                </div>
                <div class="chat-avatar me-avatar">${initials}</div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', tempBubbleHtml);
        container.scrollTop = container.scrollHeight;
    }

    // Update last message map locally for immediate sidebar update
    _lastMessagesMap[selectedUser] = {
        snippet: message.length > 25 ? message.substring(0, 25) + "..." : message,
        time: timeStr,
        isMe: true
    };
    loadUsers(true);

    input.value = "";

    try {
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
            const tempEl = document.getElementById(tempId);
            if (tempEl) tempEl.style.opacity = "0.4";
            setChatStatus("Failed to deliver message.");
            return;
        }

        setChatStatus(`Delivered to ${selectedUser}`);
        loadPrivateMessages(true);
        loadUsers(true);
    } catch (err) {
        const tempEl = document.getElementById(tempId);
        if (tempEl) tempEl.style.opacity = "0.4";
        setChatStatus("Delivery error.");
    }
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

    if (visibleMessages && visibleMessages.length > 0) {
        const lastM = visibleMessages[visibleMessages.length - 1];
        _lastMessagesMap[selectedUser] = {
            snippet: lastM.message.length > 25 ? lastM.message.substring(0, 25) + "..." : lastM.message,
            time: formatChatTime(lastM.createdAt),
            isMe: lastM.senderName === sender
        };
    }

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

    let lastDateHeader = null;
    let htmlContent = "";
    const isRecipientOnline = _userStatuses[selectedUser] === 'online';

    visibleMessages.forEach(m => {
        const dateHeader = getChatDateHeader(m.createdAt);
        if (dateHeader !== lastDateHeader) {
            htmlContent += `
                <div class="chat-date-separator">
                    <span>${dateHeader}</span>
                </div>
            `;
            lastDateHeader = dateHeader;
        }

        const isMe = m.senderName === sender;
        const otherUser = isMe ? m.receiverName : m.senderName;
        const initials = getInitials(isMe ? sender : otherUser);
        const timeStr = formatChatTime(m.createdAt);

        // WhatsApp Ticks: Emerald green double ticks if recipient is online, grey double ticks if offline
        const tickColor = isRecipientOnline ? '#10b981' : '#94a3b8';
        const tickTitle = isRecipientOnline ? 'Read' : 'Delivered';

        htmlContent += `
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
                    <div class="bubble-text">${formatMessageText(m.message || '')}</div>
                    <div class="bubble-meta">
                        <span class="bubble-time">${timeStr}</span>
                        ${isMe ? `<span class="read-ticks" style="color: ${tickColor}; font-weight: 800;" title="${tickTitle}">✓✓</span>` : ''}
                    </div>
                </div>
                ${isMe ? `<div class="chat-avatar me-avatar">${initials}</div>` : ''}
            </div>
        `;
    });

    container.innerHTML = htmlContent;
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

// =====================================================
// MOBILE HAMBURGER SIDEBAR LOGIC (Zero impact on desktop)
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
    const hamburgerBtn = document.getElementById("hamburger-menu-btn");
    const sidebarCloseBtn = document.getElementById("sidebar-close-btn");
    const sidebarOverlay = document.getElementById("sidebar-overlay");
    const sidebar = document.querySelector(".sidebar");

    function openMobileSidebar() {
        if (sidebar) sidebar.classList.add("open");
        if (sidebarOverlay) sidebarOverlay.classList.add("show");
    }

    function closeMobileSidebar() {
        if (sidebar) sidebar.classList.remove("open");
        if (sidebarOverlay) sidebarOverlay.classList.remove("show");
    }

    if (hamburgerBtn) hamburgerBtn.addEventListener("click", openMobileSidebar);
    if (sidebarCloseBtn) sidebarCloseBtn.addEventListener("click", closeMobileSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener("click", closeMobileSidebar);

    // Close sidebar when any nav-link is clicked on mobile screen sizes
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach(link => {
        link.addEventListener("click", () => {
            if (window.innerWidth <= 900) {
                closeMobileSidebar();
            }
        });
    });

    // Close sidebar if screen is resized back to desktop layout
    window.addEventListener("resize", () => {
        if (window.innerWidth > 900) {
            closeMobileSidebar();
        }
    });

    // Swipe gestures to open/close mobile sidebar drawer & navigate back (Udemy & Android Native style)
    let touchStartX = 0;
    let touchStartY = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        // Ignore vertical scrolling swipes
        if (Math.abs(deltaY) > Math.abs(deltaX)) return;
        
        // Swipe distance threshold of 50px
        if (Math.abs(deltaX) < 50) return;
        
        const screenWidth = window.innerWidth;
        const isOpen = sidebar && sidebar.classList.contains('open');
        
        if (window.innerWidth <= 900) {
            if (deltaX < 0) {
                // Swipe right-to-left (⬅)
                if (isOpen) {
                    closeMobileSidebar();
                } else if (touchStartX > screenWidth - 60) {
                    // Right edge inward swipe: Go back
                    goBackSection();
                }
            } else if (deltaX > 0) {
                // Swipe left-to-right (➔)
                if (!isOpen) {
                    if (touchStartX < 45) {
                        // Left edge swipe: Open menu drawer
                        openMobileSidebar();
                    } else if (touchStartX >= 45 && touchStartX < 90) {
                        // Inward left edge swipe: Go back
                        goBackSection();
                    }
                }
            }
        }
    }, { passive: true });

    // Initial section routing based on URL section query parameter or user state
    const urlParams = new URLSearchParams(window.location.search);
    const targetSection = urlParams.get("section");
    const targetLang = urlParams.get("lang");

    if (targetSection && document.getElementById(targetSection)) {
        openProtectedSectionDirect(targetSection);
    } else if (state.isGuest) {
        showSectionDirect("home");
    } else {
        showSectionDirect("dashboard");
    }

    if (targetLang) {
        const langSelect = $("#compiler-language");
        if (langSelect) {
            langSelect.value = targetLang;
            langSelect.dispatchEvent(new Event("change"));
        }
    }

    // Run dynamic populate on load to update mobile drawer user profile details
    setTimeout(() => {
        try {
            populateSettings();
        } catch(e) {}
    }, 200);
});



// PWA Custom Installation Logic
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const sidebarInstallBtn = document.getElementById("pwa-install-sidebar");
    if (sidebarInstallBtn) {
        sidebarInstallBtn.style.display = "inline-flex";
    }
});

function triggerPwaInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
        }
        deferredPrompt = null;
        const sidebarInstallBtn = document.getElementById("pwa-install-sidebar");
        if (sidebarInstallBtn) sidebarInstallBtn.style.display = "none";
    });
}

window.addEventListener('appinstalled', (evt) => {
    const sidebarInstallBtn = document.getElementById("pwa-install-sidebar");
    if (sidebarInstallBtn) sidebarInstallBtn.style.display = "none";
});

/* Fast Scroll to Top and Bottom (Fullscreen aware) */
function getActiveScrollContainer() {
    const fsElement = document.fullscreenElement || 
                      document.webkitFullscreenElement || 
                      document.mozFullScreenElement || 
                      document.msFullscreenElement;
    if (fsElement) {
        return fsElement;
    }
    return document.querySelector('.main-content');
}

function scrollToTopFast() {
    const container = getActiveScrollContainer();
    if (container) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function scrollToBottomFast() {
    const container = getActiveScrollContainer();
    if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
}

/* Fast Scroll to Top and Bottom for Concept Pages */
function scrollToTopConcepts(containerId) {
    const el = document.getElementById(containerId);
    if (el) {
        el.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function scrollToBottomConcepts(containerId) {
    const el = document.getElementById(containerId);
    if (el) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
}
