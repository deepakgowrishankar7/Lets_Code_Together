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

    // Chat section needs display:flex to work as a flex column layout
    target.style.display = (sectionId === 'user-communication') ? "flex" : "block";
    target.classList.add("active-section");
    setActiveSidebar(sectionId);

    // Toggle chat-mode class on main-content so chat fits in viewport without page scroll
    const mainContent = document.querySelector(".main-content");
    if (mainContent) {
        if (sectionId === 'user-communication') {
            mainContent.classList.add("main-content--chat-mode");
        } else {
            mainContent.classList.remove("main-content--chat-mode");
        }
    }

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
    if (sectionId === 'admin-panel') {
        const isAdmin = localStorage.getItem("isAdmin") === "true";
        if (!isAdmin) {
            if (typeof showPopup === 'function') {
                showPopup("Access Restricted: Administrator privileges required to access Admin Control Center.", "🛡️ Admin Access Required", false);
            }
            showSectionDirect('dashboard');
            return;
        }
        loadAdminDashboardData();
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

    // when dashboard section is opened, fetch scores and academy stats
    if (sectionId === 'dashboard') {
        populateDashboard();
        loadAcademyDashboardStats();
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

    // 3️⃣ Auto-load PDFs when opening PDF Notes tab
    if (tab === 'pdfs' || tab.includes('pdf')) {
        loadCoursePdfsForStudents(course);
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

/* =====================================================
   SQL CLIENT-SIDE ENGINE (sql.js / WebAssembly)
===================================================== */
let sqlJsInstance = null;

const DEFAULT_SQL_STARTER = `-- Create a sample Employees table
CREATE TABLE IF NOT EXISTS Employees (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    salary REAL
);

-- Insert sample records
INSERT INTO Employees (id, name, department, salary) VALUES
(1, 'Alice', 'Engineering', 85000),
(2, 'Bob', 'Marketing', 62000),
(3, 'Charlie', 'Engineering', 90000),
(4, 'Diana', 'HR', 58000),
(5, 'Evan', 'Sales', 72000);

-- Query employee summary grouped by department
SELECT 
    department, 
    COUNT(*) AS total_employees, 
    PRINTF('$%.2f', AVG(salary)) AS avg_salary,
    PRINTF('$%.2f', MAX(salary)) AS max_salary
FROM Employees
GROUP BY department
ORDER BY AVG(salary) DESC;`;

async function executeSqlCode(code) {
    if (!code || !code.trim()) {
        return { success: false, output: "Error: SQL code is empty." };
    }

    if (!sqlJsInstance) {
        if (typeof initSqlJs !== "function") {
            await new Promise((resolve, reject) => {
                const script = document.createElement("script");
                script.src = "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js";
                script.onload = resolve;
                script.onerror = () => reject(new Error("Failed to load sql.js library."));
                document.head.appendChild(script);
            });
        }
        sqlJsInstance = await initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });
    }

    try {
        const db = new sqlJsInstance.Database();
        const results = db.exec(code);
        db.close();

        if (!results || results.length === 0) {
            return { success: true, output: "Query executed successfully. (0 rows returned or DDL/DML statement completed)" };
        }

        let formattedOutput = "";
        results.forEach((res, idx) => {
            if (results.length > 1) {
                formattedOutput += `=== Query ${idx + 1} Result ===\n`;
            }
            const cols = res.columns || [];
            const rows = res.values || [];

            if (cols.length === 0) return;

            const colWidths = cols.map((col, cIdx) => {
                let maxW = String(col).length;
                rows.forEach(r => {
                    const valStr = r[cIdx] === null ? "NULL" : String(r[cIdx]);
                    if (valStr.length > maxW) maxW = valStr.length;
                });
                return Math.max(maxW, 3);
            });

            const headerRow = cols.map((c, i) => String(c).padEnd(colWidths[i])).join(" | ");
            const separator = colWidths.map(w => "-".repeat(w)).join("-+-");

            formattedOutput += headerRow + "\n" + separator + "\n";

            rows.forEach(r => {
                const rowLine = r.map((val, i) => {
                    const valStr = val === null ? "NULL" : String(val);
                    return valStr.padEnd(colWidths[i]);
                }).join(" | ");
                formattedOutput += rowLine + "\n";
            });

            formattedOutput += `\n(${rows.length} row${rows.length === 1 ? "" : "s"} returned)\n\n`;
        });

        return { success: true, output: formattedOutput.trim() };
    } catch (err) {
        return { success: false, output: "SQL Syntax / Execution Error:\n" + err.message };
    }
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

        if (langSel && langSel.value === "sql") {
            try {
                const sqlRes = await executeSqlCode(editor ? editor.value : "");
                const duration = Math.round(performance.now() - startTime);
                output.textContent = sqlRes.output;

                const timeStat = $("#ide-stat-time");
                const statusStat = $("#ide-stat-status");
                const langStat = $("#ide-stat-lang");
                if (timeStat) timeStat.textContent = `${duration} ms`;
                if (statusStat) {
                    statusStat.textContent = sqlRes.success ? "0 (Success)" : "1 (Error)";
                    statusStat.className = sqlRes.success ? "ide-stat-val success" : "ide-stat-val error";
                }
                if (langStat && langSel) {
                    langStat.textContent = langSel.options[langSel.selectedIndex]?.text || "SQL";
                }

                switchIdeTab("output");

                if (typeof sendRoomCode === "function" && currentRoomId) {
                    sendRoomCode(output.textContent);
                }
            } catch (sqlErr) {
                output.textContent = "SQL Error: " + sqlErr.message;
            } finally {
                runBtn.textContent = "▶ Run (Ctrl+Enter)";
                runBtn.disabled = false;
            }
            return;
        }

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

document.addEventListener("DOMContentLoaded", () => {
    initIdeGutterSync();
    const langSel = document.getElementById("compiler-language");
    const editor = document.getElementById("compiler-editor");
    if (langSel && editor) {
        langSel.addEventListener("change", () => {
            if (langSel.value === "sql" && (!editor.value || editor.value.trim() === "" || editor.dataset.lastLang !== "sql")) {
                editor.value = DEFAULT_SQL_STARTER;
                editor.dataset.lastLang = "sql";
                if (typeof updateGutter === "function") updateGutter();
            } else if (langSel.value !== "sql") {
                editor.dataset.lastLang = langSel.value;
            }
        });
    }
});

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

    const targetOpt = filterOptions.find(o => o.label === _activeLeaderboardLangFilter) || filterOptions[0];

    let rawFiltered = _cachedLeaderboardScores.filter(r => {
        const q = (r.quiz || '').toLowerCase();
        if (targetOpt.key === 'java beginner') return q.includes('java') && (q.includes('beginner') || (!q.includes('intermediate') && !q.includes('advanced')));
        if (targetOpt.key === 'java intermediate') return q.includes('java') && q.includes('intermediate');
        if (targetOpt.key === 'java advanced') return q.includes('java') && q.includes('advanced');
        if (targetOpt.key === 'python') return q.includes('python');
        if (targetOpt.key === 'sql') return q.includes('sql');
        return true;
    });

    if (!rawFiltered.length && _cachedLeaderboardScores.length > 0) {
        rawFiltered = _cachedLeaderboardScores;
    }

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

    try {
        const res = await fetch("/api/leaderboard");
        if (res.ok) {
            const rawScores = await res.json();
            _cachedLeaderboardScores = rawScores;
            renderFilteredLeaderboard();
        }

        // Show personal scores if logged in
        if (state.email || currentUser !== 'Developer') {
            try {
                const userEmail = state.email || localStorage.getItem("loggedInEmail") || "";
                const personalRes = await fetch(`/api/get-quiz-scores?email=${encodeURIComponent(userEmail)}`);
                const personal = personalRes.ok ? await personalRes.json() : [];

                const kpiCount = document.getElementById("kpi-quizzes-count");
                if (kpiCount) kpiCount.innerHTML = `${personal.length || 0} <span class="stat-unit">Levels</span>`;

                _cachedPersonalScores = personal;
                renderFilteredQuizScores();
            } catch (err) {
                console.error('Error loading personal scores', err);
            }
        } else {
            topUsersContainer.innerHTML = `<div class="dash-empty-state">Log in to view your personal score history.</div>`;
        }
    } catch (err) {
        console.error("Failed to load dashboard:", err);
    }
}

function updateDsaDashboardScore() {
    try {
        const solvedCount = arguments.length > 0 && Number.isFinite(Number(arguments[0]))
            ? Number(arguments[0])
            : 0;
        
        ["kpi-dsa-score", "dash-dsa-count"].forEach(id => {
            const dsaKpiElem = document.getElementById(id);
            if (dsaKpiElem) dsaKpiElem.innerHTML = `${solvedCount} <span class="stat-unit">Solved</span>`;
        });
        const dsaBar = document.getElementById("dash-dsa-bar");
        if (dsaBar) dsaBar.style.width = `${Math.min(100, solvedCount)}%`;
        
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

$("#public-chat").style.display = type === "public" ? "flex" : "none";
$("#private-chat").style.display = type === "private" ? "flex" : "none";

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

    // If picker already exists, toggle with animation
    if (picker) {
        if (picker.classList.contains('emoji-picker-open')) {
            picker.classList.remove('emoji-picker-open');
            picker.classList.add('emoji-picker-close');
            setTimeout(() => { picker.style.display = 'none'; picker.classList.remove('emoji-picker-close'); }, 200);
        } else {
            picker.style.display = 'grid';
            requestAnimationFrame(() => picker.classList.add('emoji-picker-open'));
        }
        return;
    }

    // Close any other open pickers
    document.querySelectorAll('.emoji-picker-popup').forEach(p => {
        p.classList.remove('emoji-picker-open');
        p.style.display = 'none';
    });

    // Detect light mode
    const isLight = document.body.classList.contains('light-mode') || document.documentElement.classList.contains('light-mode');

    picker = document.createElement('div');
    picker.className = 'emoji-picker-popup';
    picker.style.cssText = `
        position: absolute;
        bottom: 68px;
        left: 12px;
        z-index: 9999;
        background: ${isLight ? 'rgba(255,255,255,0.97)' : 'rgba(22, 28, 45, 0.97)'};
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid ${isLight ? 'rgba(16,185,129,0.25)' : 'rgba(16,185,129,0.3)'};
        border-radius: 20px;
        padding: 14px 12px 10px;
        box-shadow: ${isLight
            ? '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(16,185,129,0.1)'
            : '0 20px 60px rgba(0,0,0,0.6), 0 4px 16px rgba(16,185,129,0.15)'};
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 6px;
        width: 295px;
        box-sizing: border-box;
        overflow: hidden;
        transform-origin: bottom left;
        transform: scale(0.7) translateY(10px);
        opacity: 0;
        transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.18s ease;
    `;

    // Header label
    const header = document.createElement('div');
    header.style.cssText = `
        grid-column: 1 / -1;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        color: ${isLight ? '#10b981' : '#34d399'};
        margin-bottom: 6px;
        text-transform: uppercase;
        padding: 0 2px;
    `;
    header.textContent = '😊 Pick an Emoji';
    picker.appendChild(header);

    // Emoji buttons
    const btnBg   = isLight ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.06)';
    const btnBdr  = isLight ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.1)';
    const hoverBg = 'rgba(16,185,129,0.22)';

    picker.insertAdjacentHTML('beforeend', _EMOJI_LIST.map(e => `
        <button type="button"
                style="background:${btnBg}; border:1px solid ${btnBdr}; border-radius:10px; font-size:1.2rem; height:36px; width:100%; display:flex; align-items:center; justify-content:center; padding:0; cursor:pointer; box-sizing:border-box; transition:all 0.14s ease;"
                onmouseover="this.style.background='${hoverBg}'; this.style.transform='scale(1.2)'; this.style.boxShadow='0 4px 12px rgba(16,185,129,0.25)';"
                onmouseout="this.style.background='${btnBg}'; this.style.transform='scale(1)'; this.style.boxShadow='none';"
                onclick="insertEmoji('${inputId}', '${e}'); this.closest('.emoji-picker-popup').classList.remove('emoji-picker-open'); setTimeout(()=>{ this.closest('.emoji-picker-popup').style.display='none'; }, 150);">
            ${e}
        </button>
    `).join(""));

    parentBar.appendChild(picker);

    // Trigger open animation
    requestAnimationFrame(() => {
        picker.style.display = 'grid';
        requestAnimationFrame(() => picker.classList.add('emoji-picker-open'));
    });

    // Close on outside click
    document.addEventListener('click', function closeHandler(e) {
        if (!picker.contains(e.target) && e.target !== btnElement) {
            picker.classList.remove('emoji-picker-open');
            setTimeout(() => { picker.style.display = 'none'; }, 200);
            document.removeEventListener('click', closeHandler);
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
    let str = String(dateStr);
    if (typeof dateStr === 'string' && !dateStr.includes('Z') && !dateStr.includes('+') && dateStr.includes('T')) {
        str += 'Z';
    }
    const d = new Date(str);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
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
    checkUserBlockStatus();
    loadUsers(true);
    loadPrivateMessages(true);
}

// Web Audio API Audio Unlocking & Chime Synthesizer
let _sharedAudioCtx = null;

function unlockAudioEngine() {
    try {
        if (!_sharedAudioCtx) {
            const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
            if (AudioCtxClass) {
                _sharedAudioCtx = new AudioCtxClass();
            }
        }
        if (_sharedAudioCtx && _sharedAudioCtx.state === 'suspended') {
            _sharedAudioCtx.resume();
        }
    } catch(e) {}
}

document.addEventListener('click', unlockAudioEngine, { passive: true });
document.addEventListener('touchstart', unlockAudioEngine, { passive: true });
document.addEventListener('keydown', unlockAudioEngine, { passive: true });

function playMessageChimeSound() {
    if (localStorage.getItem("chatSoundMuted") === "true") return;
    try {
        unlockAudioEngine();
        const ctx = _sharedAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
        if (!ctx) return;
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        
        const now = ctx.currentTime;
        
        // High-pitched double bell chime (Note 1: E6 1318.51Hz, Note 2: B6 1975.53Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1318.51, now);
        gain1.gain.setValueAtTime(0.25, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.18);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1975.53, now + 0.09);
        gain2.gain.setValueAtTime(0.3, now + 0.09);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.09);
        osc2.stop(now + 0.4);
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

let _prevUnreadCount = -1;

function getReadMessageIdsSet() {
    try {
        const stored = localStorage.getItem("readMessageIdsSet");
        return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch(e) {
        return new Set();
    }
}

function saveReadMessageIdsSet(set) {
    try {
        localStorage.setItem("readMessageIdsSet", JSON.stringify(Array.from(set)));
    } catch(e) {}
}

function updateHeaderChatBadge(count) {
    const badge = document.getElementById("header-unread-count");
    if (!badge) return;
    const num = parseInt(count, 10) || 0;
    if (num > 0) {
        badge.textContent = num > 99 ? '99+' : num;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

async function fetchUnreadMessagesCount() {
    const currentUser = localStorage.getItem("loggedInUserName");
    if (!currentUser) return;
    try {
        const res = await fetch(`/api/private-messages/received?receiverName=${encodeURIComponent(currentUser)}`);
        if (res.ok) {
            const messages = await res.json();
            const readSet = getReadMessageIdsSet();
            const deletedSet = getDeletedForMeSet();

            const unreadMessages = (messages || []).filter(m => {
                if (!m.id || !m.senderName) return false;
                if (m.senderName.toLowerCase() === currentUser.toLowerCase()) return false;
                if (deletedSet.has(`private_${m.id}`)) return false;
                if (readSet.has(m.id)) return false;
                
                // If chat with this sender is currently open and visible, mark read automatically
                if (selectedUser && m.senderName.toLowerCase() === selectedUser.toLowerCase()) {
                    readSet.add(m.id);
                    saveReadMessageIdsSet(readSet);
                    return false;
                }
                return true;
            });

            const count = unreadMessages.length;
            updateHeaderChatBadge(count);

            if (_prevUnreadCount >= 0 && count > _prevUnreadCount) {
                playMessageChimeSound();
            }
            _prevUnreadCount = count;
        }
    } catch(e) {}
}

async function checkAdminVisibility() {
    const adminLink = document.getElementById("admin-sidebar-nav-link");
    const email = localStorage.getItem("loggedInEmail");
    const isGuest = localStorage.getItem("isGuest") === "true";

    if (!adminLink) return;

    if (isGuest || !email) {
        adminLink.style.setProperty("display", "none", "important");
        return;
    }

    const cachedIsAdmin = localStorage.getItem("isAdmin") === "true";
    if (cachedIsAdmin) {
        adminLink.style.setProperty("display", "flex", "important");
    } else {
        adminLink.style.setProperty("display", "none", "important");
    }

    try {
        const res = await fetch(`/api/auth/user-details?email=${encodeURIComponent(email)}`);
        if (res.ok) {
            const user = await res.json();
            const isAdmin = user && user.isAdmin === true;
            localStorage.setItem("isAdmin", String(isAdmin));
            if (isAdmin) {
                adminLink.style.setProperty("display", "flex", "important");
            } else {
                adminLink.style.setProperty("display", "none", "important");
            }
        }
    } catch(e) {}
}

document.addEventListener("DOMContentLoaded", () => {
    updateSoundButtonUI();
    fetchUnreadMessagesCount();
    checkAdminVisibility();
    setInterval(fetchUnreadMessagesCount, 2500);
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
            if (res.status === 403) {
                setChatStatus("Cannot send message: User has blocked messages or is blocked.");
                if (typeof showPopup === 'function') {
                    showPopup("You cannot send messages to this contact because messaging is blocked.", "🚫 Message Blocked", false);
                }
            } else {
                setChatStatus("Failed to deliver message.");
            }
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

/* =====================================================
   USER-TO-USER PRIVATE CHAT BLOCKING SYSTEM
===================================================== */
let _isCurrentTargetBlockedByMe = false;

async function checkUserBlockStatus() {
    const blockBtn = document.getElementById("block-user-btn");
    const currentUser = localStorage.getItem("loggedInUserName");
    const input = document.getElementById("private-chat-input");
    const sendBtn = document.querySelector(".chat-send-btn");

    if (!selectedUser || !currentUser) {
        if (blockBtn) blockBtn.style.display = "none";
        return;
    }

    if (blockBtn) blockBtn.style.display = "inline-flex";

    try {
        const res = await fetch(`/api/user-blocks/is-blocked?blockerUsername=${encodeURIComponent(currentUser)}&blockedUsername=${encodeURIComponent(selectedUser)}`);
        const data = await res.json();
        _isCurrentTargetBlockedByMe = data.isBlocked === true;

        if (_isCurrentTargetBlockedByMe) {
            if (blockBtn) {
                blockBtn.textContent = "✅ Unblock Contact";
                blockBtn.style.background = "rgba(16, 185, 129, 0.1)";
                blockBtn.style.color = "#10b981";
                blockBtn.style.borderColor = "rgba(16, 185, 129, 0.3)";
            }
            if (input) {
                input.placeholder = "You have blocked this contact. Unblock to resume messaging.";
                input.disabled = true;
            }
            if (sendBtn) sendBtn.disabled = true;
            setChatStatus(`You have blocked ${selectedUser}.`);
            return;
        }

        const res2 = await fetch(`/api/user-blocks/is-blocked?blockerUsername=${encodeURIComponent(selectedUser)}&blockedUsername=${encodeURIComponent(currentUser)}`);
        const data2 = await res2.json();
        const isBlockedByTarget = data2.isBlocked === true;

        if (blockBtn) {
            blockBtn.textContent = "🚫 Block Contact";
            blockBtn.style.background = "rgba(239, 68, 68, 0.1)";
            blockBtn.style.color = "#ef4444";
            blockBtn.style.borderColor = "rgba(239, 68, 68, 0.3)";
        }

        if (isBlockedByTarget) {
            if (input) {
                input.placeholder = "This contact is not receiving messages from you.";
                input.disabled = true;
            }
            if (sendBtn) sendBtn.disabled = true;
            setChatStatus(`${selectedUser} is not accepting messages.`);
        } else {
            if (input) {
                input.placeholder = "Message contact...";
                input.disabled = false;
            }
            if (sendBtn) sendBtn.disabled = false;
        }
    } catch(e) {}
}

async function toggleBlockSelectedUser() {
    const currentUser = localStorage.getItem("loggedInUserName");
    if (!selectedUser || !currentUser) return;

    const endpoint = _isCurrentTargetBlockedByMe ? "/api/user-blocks/unblock" : "/api/user-blocks/block";
    const actionName = _isCurrentTargetBlockedByMe ? "Unblock" : "Block";

    if (!_isCurrentTargetBlockedByMe) {
        const confirmMsg = `Are you sure you want to block ${selectedUser}? They will not be able to send private messages to you.`;
        if (typeof showCustomConfirm === 'function') {
            const confirmed = await showCustomConfirm(confirmMsg);
            if (!confirmed) return;
        } else if (!confirm(confirmMsg)) {
            return;
        }
    }

    try {
        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                blockerUsername: currentUser,
                blockedUsername: selectedUser
            })
        });

        if (res.ok) {
            const data = await res.json();
            if (typeof showPopup === 'function') {
                showPopup(data.message || `Contact ${actionName.toLowerCase()}ed.`, actionName + " Status", false);
            }
            checkUserBlockStatus();
            loadPrivateMessages(true);
        }
    } catch(e) {
        console.error("Block/Unblock error:", e);
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

        const readSet = getReadMessageIdsSet();
        let readUpdated = false;
        visibleMessages.forEach(m => {
            if (m.id && m.senderName === selectedUser && !readSet.has(m.id)) {
                readSet.add(m.id);
                readUpdated = true;
            }
        });
        if (readUpdated) {
            saveReadMessageIdsSet(readSet);
            fetchUnreadMessagesCount();
        }
    }

    const newHash = JSON.stringify({ selectedUser, visibleMessages });
    if (!force && newHash === _lastPrivateHash) return;
    if (!force && _lastPrivateHash && newHash !== _lastPrivateHash) {
        if (visibleMessages && visibleMessages.length > 0) {
            const lastM = visibleMessages[visibleMessages.length - 1];
            if (lastM.senderName === selectedUser) {
                playMessageChimeSound();
            }
        }
    }
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



// PWA Custom Installation & Installed State Engine
let deferredPrompt = null;

function isIosDevice() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent || navigator.vendor || window.opera);
}

function isMobileBrowser() {
    return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent || navigator.vendor || window.opera);
}

function checkPwaInstallState() {
    // Check if the current window is running as a real standalone PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         window.matchMedia('(display-mode: minimal-ui)').matches ||
                         window.matchMedia('(display-mode: fullscreen)').matches ||
                         navigator.standalone === true;

    const sidebarInstallBtn = document.getElementById("pwa-install-sidebar");
    const mainInstallBtn = document.querySelector(".pwa-install-btn");

    if (isStandalone) {
        document.body.classList.add("app-is-installed");
        if (sidebarInstallBtn) sidebarInstallBtn.style.setProperty("display", "none", "important");
        if (mainInstallBtn) mainInstallBtn.style.setProperty("display", "none", "important");
        return true;
    } else {
        document.body.classList.remove("app-is-installed");
        if (sidebarInstallBtn) sidebarInstallBtn.style.display = "flex";
        if (mainInstallBtn) mainInstallBtn.style.display = "flex";
        return false;
    }
}

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    checkPwaInstallState();
});

async function triggerPwaInstall() {
    // Only block if actually running inside the standalone installed window
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    if (isStandalone) {
        if (typeof showPopup === 'function') {
            showPopup("Let's Code Together is already running as an installed PWA! 🎉", "📱 Already Installed", false);
        } else {
            alert("Let's Code Together is already running as an installed app!");
        }
        return;
    }

    // Register service worker immediately if not active
    if ('serviceWorker' in navigator && !navigator.serviceWorker.controller) {
        try {
            await navigator.serviceWorker.register('/sw.js');
        } catch(e) {}
    }

    // If prompt is not captured yet, wait up to 800ms for beforeinstallprompt event to fire
    if (!deferredPrompt) {
        await new Promise((resolve) => {
            const timeout = setTimeout(resolve, 800);
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                clearTimeout(timeout);
                resolve();
            }, { once: true });
        });
    }

    // Direct Native 1-Click Installation Prompt Trigger
    if (deferredPrompt) {
        try {
            deferredPrompt.prompt();
            const choiceResult = await deferredPrompt.userChoice;
            if (choiceResult && choiceResult.outcome === 'accepted') {
                localStorage.setItem('pwaAppInstalled', 'true');
                checkPwaInstallState();
            }
            deferredPrompt = null;
            return;
        } catch(err) {
            console.error('PWA Install Prompt Error:', err);
        }
    }

    // iOS Safari guidance
    if (isIosDevice()) {
        const iosMsg = "To install Let's Code Together on iPhone / iPad:\n\n1. Tap the Share button 📤 in Safari.\n2. Scroll down & select 'Add to Home Screen' 📲.";
        if (typeof showPopup === 'function') {
            showPopup(iosMsg, "📲 Install on iOS", false);
        } else {
            alert(iosMsg);
        }
        return;
    }

    // Android / Browser Menu Fallback
    const guideMsg = "To install Let's Code Together on your phone / laptop:\n\n1. Tap the 3 dots (⋮) or Menu at top-right of browser.\n2. Select 'Install app' or 'Add to Home screen' 📲.";
    if (typeof showPopup === 'function') {
        showPopup(guideMsg, "📲 Install App", false);
    } else {
        alert(guideMsg);
    }
}

window.addEventListener('appinstalled', (evt) => {
    localStorage.setItem('pwaAppInstalled', 'true');
    deferredPrompt = null;
    checkPwaInstallState();
    if (typeof showPopup === 'function') {
        showPopup("App installed successfully! You can launch Let's Code Together directly from your home screen.", "🎉 Installation Complete", false);
    }
});

document.addEventListener('DOMContentLoaded', checkPwaInstallState);
window.addEventListener('load', checkPwaInstallState);
try {
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkPwaInstallState);
} catch(e) {}

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

/* =====================================================
   EXECUTIVE ADMIN CONTROL CENTER ENGINE
===================================================== */
let _adminAllUsersCache = [];
let _adminAllPdfsCache = [];

function switchAdminTab(tabName, btn) {
    const tabPanes = document.querySelectorAll(".admin-tab-pane");
    const tabBtns = document.querySelectorAll(".admin-tab-btn");

    tabPanes.forEach(pane => pane.style.display = "none");
    tabBtns.forEach(b => b.classList.remove("active"));

    const targetPane = document.getElementById(`admin-tab-${tabName}`);
    if (targetPane) targetPane.style.display = "block";
    if (btn) btn.classList.add("active");

    if (tabName === 'users') {
        loadAdminUserDirectory();
    } else if (tabName === 'pdfs') {
        loadAdminPdfsTable();
    }
}

async function loadAdminDashboardData() {
    await loadAdminUserDirectory();
    await loadAdminPdfsTable();
}

async function loadAdminUserDirectory() {
    const tbody = document.getElementById("admin-user-table-body");
    if (!tbody) return;

    try {
        const res = await fetch("/api/auth/users/all");
        if (res.ok) {
            _adminAllUsersCache = await res.json();
            renderAdminUserTable(_adminAllUsersCache);
            updateAdminUserKpis(_adminAllUsersCache);
        }
    } catch(e) {
        console.error("Admin user load error:", e);
    }
}

function updateAdminUserKpis(users) {
    const totalEl = document.getElementById("admin-stat-users");
    const adminEl = document.getElementById("admin-stat-admins");
    const blockedEl = document.getElementById("admin-stat-blocked");

    if (!users) return;

    const total = users.length;
    const admins = users.filter(u => u.isAdmin === true).length;
    const blocked = users.filter(u => u.isBlocked === true).length;

    if (totalEl) totalEl.textContent = total;
    if (adminEl) adminEl.textContent = admins;
    if (blockedEl) blockedEl.textContent = blocked;
}

function renderAdminUserTable(users) {
    const tbody = document.getElementById("admin-user-table-body");
    if (!tbody) return;

    if (!users || !users.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 30px; color: var(--text-muted);">
                    No registered user accounts found.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = users.map(user => {
        const name = user.name || user.username || "Student Developer";
        const email = user.email || "N/A";
        const initials = getInitials(name);
        const isAdmin = user.isAdmin === true;
        const isBlocked = user.isBlocked === true;

        const roleBadge = isAdmin ?
            `<span class="admin-badge admin-role">🛡️ Administrator</span>` :
            `<span class="admin-badge student-role">🎓 Student</span>`;

        const statusBadge = isBlocked ?
            `<span class="admin-badge blocked-status">🚫 Blocked</span>` :
            `<span class="admin-badge active-status">🟢 Active</span>`;

        return `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="user-avatar-circle" style="width: 36px; height: 36px; border-radius: 50%; background: #10b981; color: #fff; font-weight: 700; display: flex; align-items: center; justify-content: center; font-size: 0.85rem;">${initials}</div>
                        <div>
                            <div style="font-weight: 700; color: var(--text-main);">${escapeHtml(name)}</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">@${escapeHtml(user.username || 'user')}</div>
                        </div>
                    </div>
                </td>
                <td style="font-size: 0.9rem; color: var(--text-main);">${escapeHtml(email)}</td>
                <td>${roleBadge}</td>
                <td>${statusBadge}</td>
                <td style="text-align: right;">
                    <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
                        <button class="admin-btn-action ${isAdmin ? 'warning' : 'success'}" onclick="toggleAdminRole('${escapeHtml(email)}')" title="Toggle Admin Rights">
                            ${isAdmin ? 'Revoke Admin' : 'Make Admin'}
                        </button>
                        <button class="admin-btn-action ${isBlocked ? 'success' : 'danger'}" onclick="toggleAdminBlock('${escapeHtml(email)}')" title="Toggle Block Access">
                            ${isBlocked ? 'Unblock' : 'Block User'}
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

function filterAdminUserTable() {
    const input = document.getElementById("admin-user-search");
    if (!input) return;
    const query = input.value.trim().toLowerCase();
    if (!query) {
        renderAdminUserTable(_adminAllUsersCache);
        return;
    }
    const filtered = _adminAllUsersCache.filter(u => 
        (u.name && u.name.toLowerCase().includes(query)) ||
        (u.email && u.email.toLowerCase().includes(query)) ||
        (u.username && u.username.toLowerCase().includes(query))
    );
    renderAdminUserTable(filtered);
}

async function toggleAdminRole(email) {
    if (!confirm(`Are you sure you want to change admin permissions for ${email}?`)) return;
    try {
        const res = await fetch("/api/auth/users/toggle-admin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email })
        });
        if (res.ok) {
            if (typeof showPopup === 'function') {
                showPopup("User role permissions updated successfully.", "🛡️ Role Updated", false);
            }
            loadAdminUserDirectory();
        }
    } catch(e) {
        console.error("Toggle admin role error:", e);
    }
}

async function toggleAdminBlock(email) {
    if (!confirm(`Are you sure you want to toggle block status for ${email}?`)) return;
    try {
        const res = await fetch("/api/auth/users/toggle-block", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email })
        });
        if (res.ok) {
            if (typeof showPopup === 'function') {
                showPopup("User account status updated.", "🚫 Status Updated", false);
            }
            loadAdminUserDirectory();
        }
    } catch(e) {
        console.error("Toggle admin block error:", e);
    }
}

/* --- COURSE PDF MANAGEMENT --- */
function updateAdminPdfFileName(input) {
    const label = document.getElementById("admin-pdf-file-text");
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        if (label) label.textContent = `Selected: ${file.name} (${sizeMb} MB)`;
    } else {
        if (label) label.textContent = "Click or drag & drop a PDF file here (Max 15MB)";
    }
}

async function handleAdminPdfUpload(event) {
    event.preventDefault();
    const courseId = document.getElementById("admin-pdf-course").value;
    const title = document.getElementById("admin-pdf-title").value.trim();
    const description = document.getElementById("admin-pdf-desc").value.trim();
    const fileInput = document.getElementById("admin-pdf-file-input");
    const submitBtn = document.getElementById("admin-pdf-submit-btn");

    if (!fileInput.files || !fileInput.files[0]) {
        if (typeof showPopup === 'function') showPopup("Please select a PDF file to upload.", "⚠️ Missing File", false);
        return;
    }

    const file = fileInput.files[0];
    if (file.size > 15 * 1024 * 1024) {
        if (typeof showPopup === 'function') showPopup("File size exceeds 15MB limit. Please upload a smaller PDF.", "⚠️ File Too Large", false);
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.querySelector("span").textContent = "Uploading PDF Resource...";
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
        const fileData = e.target.result;
        const fileSize = (file.size / (1024 * 1024)).toFixed(2) + " MB";

        try {
            const res = await fetch("/api/course-pdfs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    courseId: courseId,
                    title: title,
                    description: description,
                    fileData: fileData,
                    fileName: file.name,
                    fileSize: fileSize
                })
            });

            if (res.ok) {
                if (typeof showPopup === 'function') {
                    showPopup("Course PDF study guide uploaded successfully! It is now available to students.", "🎉 PDF Uploaded", false);
                }
                document.getElementById("admin-pdf-form").reset();
                updateAdminPdfFileName(fileInput);
                loadAdminPdfsTable();
                loadCoursePdfsForStudents(courseId);
            } else {
                if (typeof showPopup === 'function') showPopup("Failed to upload PDF resource.", "⚠️ Upload Failed", false);
            }
        } catch(err) {
            console.error("PDF upload error:", err);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.querySelector("span").textContent = "📤 Upload & Attach to Course";
            }
        }
    };
    reader.readAsDataURL(file);
}

async function loadAdminPdfsTable() {
    const tbody = document.getElementById("admin-pdf-table-body");
    const filterSelect = document.getElementById("admin-pdf-filter-course");
    const pdfStatEl = document.getElementById("admin-stat-pdfs");
    if (!tbody) return;

    const courseId = filterSelect ? filterSelect.value : "all";
    let dynamicPdfs = [];

    try {
        const url = courseId && courseId !== "all" ? `/api/course-pdfs?courseId=${courseId}` : "/api/course-pdfs";
        const res = await fetch(url);
        if (res.ok) {
            dynamicPdfs = await res.json();
        }
    } catch(e) {
        console.error("Fetch dynamic PDFs error:", e);
    }

    const filteredStatic = typeof PREEXISTING_STATIC_PDFS !== 'undefined' ?
        (courseId === "all" ? PREEXISTING_STATIC_PDFS : PREEXISTING_STATIC_PDFS.filter(p => p.courseId === courseId)) : [];
    
    _adminAllPdfsCache = [...dynamicPdfs, ...filteredStatic];
    if (pdfStatEl) pdfStatEl.textContent = _adminAllPdfsCache.length;

    if (!_adminAllPdfsCache || !_adminAllPdfsCache.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 30px; color: var(--text-muted);">
                    No PDF resources found for this course.
                </td>
            </tr>
        `;
        return;
    }

    const courseNames = {
        java: "☕ Java Masterclass",
        python: "🐍 Python Masterclass",
        cpp: "⚡ C++ Course",
        sql: "🗄️ SQL & Databases",
        dsa: "🌲 Data Structures",
        webdev: "🌐 Full-Stack Web"
    };

    tbody.innerHTML = _adminAllPdfsCache.map(pdf => {
        const cName = courseNames[pdf.courseId] || pdf.courseId.toUpperCase();
        const dateStr = pdf.uploadedAt ? new Date(pdf.uploadedAt).toLocaleDateString() : 'System Default';
        const isStatic = pdf.isStatic === true;

        const sourceBadge = isStatic ?
            `<span class="admin-badge student-role" style="font-size: 10px; margin-left: 6px;">Pre-installed</span>` :
            `<span class="admin-badge active-status" style="font-size: 10px; margin-left: 6px;">Uploaded</span>`;

        const deleteBtn = isStatic ?
            `<button class="admin-btn-action" style="opacity:0.5; cursor:not-allowed;" title="System PDF">System PDF</button>` :
            `<button class="admin-btn-action danger" onclick="deleteAdminPdf(${pdf.id})">🗑️ Delete</button>`;

        return `
            <tr>
                <td><span class="admin-badge course-tag">${escapeHtml(cName)}</span></td>
                <td>
                    <div style="font-weight: 700; color: var(--text-main); display:flex; align-items:center;">${escapeHtml(pdf.title)} ${sourceBadge}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(pdf.description || 'No description.')}</div>
                </td>
                <td style="font-size: 0.85rem; font-weight: 600;">${escapeHtml(pdf.fileSize || '1.0 MB')}</td>
                <td style="font-size: 0.85rem; color: var(--text-muted);">${dateStr}</td>
                <td style="text-align: right;">
                    <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
                        <a href="${pdf.fileData}" download="${escapeHtml(pdf.fileName || pdf.title + '.pdf')}" class="admin-btn-action success" style="text-decoration:none;">📥 Download</a>
                        ${deleteBtn}
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

async function deleteAdminPdf(id) {
    if (!confirm("Are you sure you want to delete this course PDF resource?")) return;
    try {
        const res = await fetch(`/api/course-pdfs/${id}`, { method: "DELETE" });
        if (res.ok) {
            if (typeof showPopup === 'function') {
                showPopup("PDF resource deleted from course library.", "🗑️ PDF Deleted", false);
            }
            loadAdminPdfsTable();
        }
    } catch(e) {
        console.error("Delete PDF error:", e);
    }
}

async function handleAdminBroadcastSubmit(event) {
    event.preventDefault();
    const title = document.getElementById("admin-broadcast-title").value.trim();
    const content = document.getElementById("admin-broadcast-content").value.trim();

    try {
        const res = await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contentTitle: title,
                content: content
            })
        });

        if (res.ok) {
            if (typeof showPopup === 'function') {
                showPopup("Broadcast announcement published to all users successfully!", "📢 Broadcast Sent", false);
            }
            document.getElementById("admin-broadcast-form").reset();
        }
    } catch(e) {
        console.error("Broadcast submit error:", e);
    }
}

function openPdfInNewTab(event, fileData) {
    if (event) event.preventDefault();
    if (!fileData) return;

    if (fileData.startsWith("data:application/pdf")) {
        try {
            const base64Parts = fileData.split(",");
            const byteString = atob(base64Parts[1]);
            const mimeString = base64Parts[0].split(":")[1].split(";")[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: mimeString });
            const blobUrl = URL.createObjectURL(blob);
            window.open(blobUrl, "_blank");
        } catch (e) {
            console.error("Open PDF Blob error:", e);
            window.open(fileData, "_blank");
        }
    } else {
        window.open(fileData, "_blank");
    }
}

async function loadCoursePdfsForStudents(courseId) {
    const container = document.getElementById(`${courseId}-pdf-container`);
    if (!container) return;

    let dynamicPdfs = [];
    try {
        const res = await fetch(`/api/course-pdfs?courseId=${encodeURIComponent(courseId)}`);
        if (res.ok) {
            dynamicPdfs = await res.json();
        }
    } catch(e) {}

    if (!dynamicPdfs || !dynamicPdfs.length) {
        container.innerHTML = "";
        return;
    }

    container.innerHTML = dynamicPdfs.map(pdf => `
        <a href="${pdf.fileData}" target="_blank" onclick="openPdfInNewTab(event, '${pdf.fileData}')">
            📄 ${escapeHtml(pdf.title)}
        </a>
    `).join("");
}

/* =====================================================
   ACADEMY DASHBOARD API INTEGRATION & TAB ENGINE
===================================================== */
function renderMasterclassLogs() {
    const container = document.getElementById("dash-masterclass-logs-container");
    if (!container) return;

    const masterclasses = [
        { title: "Java 21 Enterprise Masterclass", badgeText: "JAVA", badgeClass: "java", pct: 90, target: "java-course" },
        { title: "Python 3.12 Masterclass", badgeText: "PYTHON", badgeClass: "python", pct: 85, target: "python-course" },
        { title: "SQL Database Masterclass", badgeText: "SQL", badgeClass: "sql", pct: 75, target: "sql-course" },
        { title: "DSA & LeetCode Masterclass", badgeText: "DSA", badgeClass: "dsa", pct: 95, target: "dsa-course" }
    ];

    container.innerHTML = masterclasses.map(item => `
        <div class="log-item-row">
            <div class="log-item-info">
                <span class="log-item-badge ${item.badgeClass}">${item.badgeText}</span>
                <span class="log-item-title">${escapeHtml(item.title)}</span>
            </div>
            <div class="log-item-progress">
                <div class="log-bar-bg"><div class="log-bar-fill" style="width:${item.pct}%;"></div></div>
                <button class="review-btn" onclick="showSection('${item.target}')">Resume ›</button>
            </div>
        </div>
    `).join("");
}

function renderVisualizerLogs() {
    const container = document.getElementById("dash-visualizer-logs-container");
    if (!container) return;

    const visualizers = [
        { title: "3D Sorting Algorithms Engine", badgeText: "ALGO", badgeClass: "dsa", pct: 100, target: "visualizer" },
        { title: "Data Structures & Tree Explorer", badgeText: "TREES", badgeClass: "java", pct: 80, target: "visualizer" },
        { title: "SQL Query Plan Visualizer", badgeText: "SQL", badgeClass: "sql", pct: 90, target: "visualizer" }
    ];

    container.innerHTML = visualizers.map(item => `
        <div class="log-item-row">
            <div class="log-item-info">
                <span class="log-item-badge ${item.badgeClass}">${item.badgeText}</span>
                <span class="log-item-title">${escapeHtml(item.title)}</span>
            </div>
            <div class="log-item-progress">
                <div class="log-bar-bg"><div class="log-bar-fill" style="width:${item.pct}%;"></div></div>
                <button class="review-btn" onclick="showSection('${item.target}')">Launch ›</button>
            </div>
        </div>
    `).join("");
}

function switchLearningLogTab(tabName) {
    const tabs = ['quizzes', 'masterclasses', 'visualizers'];
    tabs.forEach(t => {
        const btn = document.getElementById(`tab-btn-${t}`);
        const content = document.getElementById(`learning-tab-${t}`);
        if (btn) {
            btn.classList.toggle('active', t === tabName);
        }
        if (content) {
            content.style.display = (t === tabName) ? 'block' : 'none';
        }
    });

    if (tabName === 'masterclasses') {
        renderMasterclassLogs();
    } else if (tabName === 'visualizers') {
        renderVisualizerLogs();
    }

    const paginationBar = document.getElementById("dash-log-pagination");
    if (paginationBar) {
        if (tabName === 'quizzes') {
            renderPaginatedLogs();
        } else {
            paginationBar.innerHTML = "";
            paginationBar.style.display = "none";
        }
    }
}

let _allQuizLogs = [];
let _currentLogPage = 1;
const _logPerPage = 4;

let _allLeaderboardUsers = [];
let _currentLeaderboardPage = 1;
const _leaderboardPerPage = 4;

function renderPaginatedLogs() {
    const logContainer = document.getElementById("dash-quiz-logs-container");
    const paginationBar = document.getElementById("dash-log-pagination");
    if (!logContainer) return;

    if (!_allQuizLogs || !_allQuizLogs.length) {
        logContainer.innerHTML = `<div class="dash-empty-state">No quiz activity logged yet.</div>`;
        if (paginationBar) {
            paginationBar.innerHTML = "";
            paginationBar.style.display = "none";
        }
        return;
    }

    const totalPages = Math.ceil(_allQuizLogs.length / _logPerPage);
    if (_currentLogPage > totalPages) _currentLogPage = totalPages;
    if (_currentLogPage < 1) _currentLogPage = 1;

    const startIdx = (_currentLogPage - 1) * _logPerPage;
    const pageItems = _allQuizLogs.slice(startIdx, startIdx + _logPerPage);

    logContainer.innerHTML = pageItems.map(log => {
        const qTitle = log.quizTitle || "Quiz";
        const qLower = qTitle.toLowerCase();
        let badgeClass = "dsa";
        let badgeText = "QUIZ";
        if (qLower.includes("java")) { badgeClass = "java"; badgeText = "JAVA"; }
        else if (qLower.includes("python")) { badgeClass = "python"; badgeText = "PYTHON"; }
        else if (qLower.includes("sql")) { badgeClass = "sql"; badgeText = "SQL"; }

        const pct = log.percentage || 90;
        return `
            <div class="log-item-row">
                <div class="log-item-info">
                    <span class="log-item-badge ${badgeClass}">${badgeText}</span>
                    <span class="log-item-title">${escapeHtml(qTitle)} — ${log.score}/${log.totalQuestions} (${pct}%)</span>
                </div>
                <div class="log-item-progress">
                    <div class="log-bar-bg"><div class="log-bar-fill" style="width:${pct}%;"></div></div>
                    <button class="review-btn" onclick="openProtectedSection('dashboard')">Review ›</button>
                </div>
            </div>
        `;
    }).join("");

    if (paginationBar) {
        const activeTabBtn = document.getElementById("tab-btn-quizzes");
        const isQuizzesActive = !activeTabBtn || activeTabBtn.classList.contains("active");

        if (totalPages <= 1 || !isQuizzesActive) {
            paginationBar.innerHTML = "";
            paginationBar.style.display = "none";
            return;
        }
        paginationBar.style.display = "flex";
        let pageBtnsHtml = `<button class="page-btn" ${_currentLogPage === 1 ? 'disabled' : ''} onclick="changeLogPage(-1)">‹</button>`;
        for (let i = 1; i <= totalPages; i++) {
            pageBtnsHtml += `<button class="page-btn ${i === _currentLogPage ? 'active' : ''}" onclick="goToLogPage(${i})">${i}</button>`;
        }
        pageBtnsHtml += `<button class="page-btn" ${_currentLogPage === totalPages ? 'disabled' : ''} onclick="changeLogPage(1)">›</button>`;
        paginationBar.innerHTML = pageBtnsHtml;
    }
}

function changeLogPage(delta) {
    _currentLogPage += delta;
    renderPaginatedLogs();
}

function goToLogPage(p) {
    _currentLogPage = p;
    renderPaginatedLogs();
}

function renderPaginatedLeaderboard() {
    const leaderboardBody = document.getElementById("dash-leaderboard-body");
    const paginationBar = document.getElementById("dash-leaderboard-pagination");
    if (!leaderboardBody) return;

    if (!_allLeaderboardUsers || !_allLeaderboardUsers.length) {
        leaderboardBody.innerHTML = `<tr><td colspan="4">No leaderboard users found.</td></tr>`;
        if (paginationBar) paginationBar.innerHTML = "";
        return;
    }

    const totalPages = Math.ceil(_allLeaderboardUsers.length / _leaderboardPerPage);
    if (_currentLeaderboardPage > totalPages) _currentLeaderboardPage = totalPages;
    if (_currentLeaderboardPage < 1) _currentLeaderboardPage = 1;

    const startIdx = (_currentLeaderboardPage - 1) * _leaderboardPerPage;
    const pageItems = _allLeaderboardUsers.slice(startIdx, startIdx + _leaderboardPerPage);

    leaderboardBody.innerHTML = pageItems.map(user => {
        const rankClass = user.rank === 1 ? "rank-1" : (user.rank === 2 ? "rank-2" : (user.rank === 3 ? "rank-3" : "rank-other"));
        const isYou = user.currentUser;
        const name = user.name || "Developer";
        const initials = getInitials(name);
        const handle = user.username ? `@${user.username}` : `@${name.toLowerCase().replaceAll('\\s+', '')}`;

        return `
            <tr class="${isYou ? 'current-user-row' : ''}">
                <td>
                    <div class="leader-rank-badge ${rankClass}">${user.rank}</div>
                </td>
                <td>
                    <div class="developer-user-cell">
                        <div class="developer-avatar">${initials}</div>
                        <div class="developer-name-group">
                            <div class="developer-name">${escapeHtml(name)} ${isYou ? '<span class="you-tag">you</span>' : ''}</div>
                            <div class="developer-handle">${escapeHtml(handle)}</div>
                        </div>
                    </div>
                </td>
                <td><span class="score-val">${user.score} pts</span></td>
                <td align="right">
                    ${!isYou ? `<button class="action-msg-btn" onclick="openPrivateChatWith('${escapeHtml(name)}')">💬 Message</button>` : `<span style="font-size:0.75rem; color:var(--jade); font-weight:700;">Active</span>`}
                </td>
            </tr>
        `;
    }).join("");

    if (paginationBar) {
        if (totalPages <= 1) {
            paginationBar.innerHTML = "";
            return;
        }
        let pageBtnsHtml = `<button class="page-btn" ${_currentLeaderboardPage === 1 ? 'disabled' : ''} onclick="changeLeaderboardPage(-1)">‹</button>`;
        for (let i = 1; i <= totalPages; i++) {
            pageBtnsHtml += `<button class="page-btn ${i === _currentLeaderboardPage ? 'active' : ''}" onclick="goToLeaderboardPage(${i})">${i}</button>`;
        }
        pageBtnsHtml += `<button class="page-btn" ${_currentLeaderboardPage === totalPages ? 'disabled' : ''} onclick="changeLeaderboardPage(1)">›</button>`;
        paginationBar.innerHTML = pageBtnsHtml;
    }
}

function changeLeaderboardPage(delta) {
    _currentLeaderboardPage += delta;
    renderPaginatedLeaderboard();
}

function goToLeaderboardPage(p) {
    _currentLeaderboardPage = p;
    renderPaginatedLeaderboard();
}

async function loadAcademyDashboardStats() {
    try {
        const email = localStorage.getItem("loggedInEmail") || localStorage.getItem("userEmail") || localStorage.getItem("username") || (typeof state !== 'undefined' ? state.email : "") || "";
        const res = await fetch(`/api/dashboard/stats?email=${encodeURIComponent(email)}`);
        if (!res.ok) return;
        const data = await res.json();

        // 1. Header Banner Greeting Logic (New vs Returning User)
        const userKey = "has_visited_dashboard_" + (email || "user");
        const isReturningUser = localStorage.getItem(userKey) === "true";
        const greetingTitleEl = document.querySelector(".hero-welcome-title");
        const displayName = data.userName || "Developer";

        if (greetingTitleEl) {
            if (isReturningUser) {
                greetingTitleEl.innerHTML = `Welcome back, <span id="dash-user-name">${displayName}</span>! 👋`;
            } else {
                greetingTitleEl.innerHTML = `Welcome, <span id="dash-user-name">${displayName}</span>! 👋`;
                localStorage.setItem(userKey, "true");
            }
        } else {
            const userNameEl = document.getElementById("dash-user-name");
            if (userNameEl) userNameEl.textContent = displayName;
        }

        // 2. Metric Stat Cards
        const masterclassesEl = document.getElementById("kpi-masterclasses-count") || document.getElementById("dash-masterclasses-count");
        if (masterclassesEl) {
            const count = (data.activeMasterclassesCount && data.activeMasterclassesCount > 0) ? data.activeMasterclassesCount : 4;
            masterclassesEl.innerHTML = `${count} <span class="stat-unit">Courses</span>`;
        }

function getRealDsaSolvedCount() {
    try {
        if (typeof getSolvedProblems === 'function') {
            const solved = getSolvedProblems();
            return Array.isArray(solved) ? solved.length : 0;
        }
        const saved = localStorage.getItem('solved_dsa_problems');
        if (saved) {
            const parsed = JSON.parse(saved);
            return Array.isArray(parsed) ? parsed.length : 0;
        }
    } catch(e) {}
    return 0;
}

        const visEl = document.getElementById("kpi-visualizers-count") || document.getElementById("dash-visualizers-count");
        if (visEl) {
            const compOptions = document.querySelectorAll("#compiler-language option");
            const compCount = compOptions.length > 0 ? compOptions.length : 9;

            const visOptions = document.querySelectorAll("#visualizer-language option");
            const visCount = visOptions.length > 0 ? visOptions.length : 3;

            const totalTools = visCount + compCount;
            visEl.innerHTML = `${totalTools} <span>Tools</span>`;
            
            const visLbl = document.getElementById("vis-count-label");
            const compLbl = document.getElementById("comp-count-label");
            if (visLbl) visLbl.textContent = `${visCount} Vis`;
            if (compLbl) compLbl.textContent = `${compCount} Comp`;
        }

        const realDsaCount = (data.dsaQuestionsSolvedCount && data.dsaQuestionsSolvedCount > 0)
            ? data.dsaQuestionsSolvedCount
            : getRealDsaSolvedCount();

        const dsaEl = document.getElementById("kpi-dsa-score") || document.getElementById("dash-dsa-count");
        if (dsaEl) {
            dsaEl.innerHTML = `${realDsaCount} <span class="stat-unit">Solved</span>`;
        }

        const dsaBarCols = document.querySelectorAll(".dsa-mini-bar-graph .dsa-bar-col");
        if (dsaBarCols && dsaBarCols.length) {
            dsaBarCols.forEach((col, idx) => {
                if (realDsaCount === 0) {
                    col.style.height = '15%';
                    col.classList.remove('active');
                } else {
                    col.style.height = `${Math.min(100, Math.max(20, (idx + 1) * 20))}%`;
                    col.classList.toggle('active', idx === dsaBarCols.length - 1);
                }
            });
        }

function updateMasterclassBarChart(quizLogs) {
    const availableCourseEls = document.querySelectorAll('.available-courses .course-card');
    const availableCount = availableCourseEls.length > 0 ? availableCourseEls.length : 4;

    const upcomingCourseEls = document.querySelectorAll('.upcoming-courses .course-card');
    const upcomingCount = upcomingCourseEls.length > 0 ? upcomingCourseEls.length : 13;

    let completed = 1; // Default: Java 21 Enterprise (100% completed)

    const courseMap = {};
    if (Array.isArray(quizLogs) && quizLogs.length > 0) {
        let compCount = 0;
        quizLogs.forEach(log => {
            const title = (log.quizTitle || "").toLowerCase();
            let cat = "other";
            if (title.includes("java")) cat = "java";
            else if (title.includes("python")) cat = "python";
            else if (title.includes("sql")) cat = "sql";
            else if (title.includes("dsa")) cat = "dsa";

            if (!courseMap[cat]) {
                courseMap[cat] = { maxPct: 0 };
            }
            const pct = log.percentage || 0;
            if (pct > courseMap[cat].maxPct) {
                courseMap[cat].maxPct = pct;
            }
        });

        Object.values(courseMap).forEach(c => {
            if (c.maxPct >= 100) compCount++;
        });

        if (compCount > 0) {
            completed = compCount;
        }
    }

    const progressing = Math.max(0, availableCount - completed);
    const upcoming = upcomingCount;
    const totalCourses = completed + progressing + upcoming;

    const countEl = document.getElementById("dash-masterclasses-count");
    if (countEl) {
        countEl.innerHTML = `${totalCourses} <span>Courses</span>`;
    }

    const masterclassesEl = document.getElementById("kpi-masterclasses-count");
    if (masterclassesEl) {
        masterclassesEl.innerHTML = `${totalCourses} <span class="stat-unit">Courses</span>`;
    }

    const progBar = document.getElementById("mc-bar-prog");
    const upcBar = document.getElementById("mc-bar-upc");
    const compBar = document.getElementById("mc-bar-comp");

    const maxVal = Math.max(progressing, upcoming, completed, 1);

    if (progBar) {
        progBar.style.height = `${(progressing / maxVal) * 100}%`;
        progBar.title = `${progressing} Progressing (${availableCount} Available Total)`;
    }
    if (upcBar) {
        upcBar.style.height = `${(upcoming / maxVal) * 100}%`;
        upcBar.title = `${upcoming} Upcoming Courses`;
    }
    if (compBar) {
        compBar.style.height = `${(completed / maxVal) * 100}%`;
        compBar.title = `${completed} Completed Courses`;
    }

    const progValEl = document.getElementById("mc-val-prog");
    const upcValEl = document.getElementById("mc-val-upc");
    const compValEl = document.getElementById("mc-val-comp");

    if (progValEl) progValEl.textContent = progressing;
    if (upcValEl) upcValEl.textContent = upcoming;
    if (compValEl) compValEl.textContent = completed;

    const legProg = document.getElementById("mc-leg-prog");
    const legUpc = document.getElementById("mc-leg-upc");
    const legComp = document.getElementById("mc-leg-comp");

    if (legProg) legProg.textContent = `Prog (${progressing})`;
    if (legUpc) legUpc.textContent = `Upc (${upcoming})`;
    if (legComp) legComp.textContent = `Comp (${completed})`;

    initUpcomingCourseClickHandlers();
}

        _allQuizLogs = Array.isArray(data.quizLogs) ? data.quizLogs : [];
        _currentLogPage = 1;
        renderPaginatedLogs();
        updateMasterclassBarChart(_allQuizLogs);

        _allLeaderboardUsers = Array.isArray(data.leaderboard) ? data.leaderboard : [];
        _currentLeaderboardPage = 1;
        renderPaginatedLeaderboard();

        const realQuizCount = (data.quizzesCompletedCount && data.quizzesCompletedCount > 0)
            ? data.quizzesCompletedCount
            : (_allQuizLogs ? _allQuizLogs.length : 0);

        const quizzesCountEl = document.getElementById("dash-quizzes-count");
        if (quizzesCountEl) {
            quizzesCountEl.textContent = realQuizCount;
        }

        const quizRing = document.getElementById("dash-quiz-ring");
        if (quizRing) {
            const ringPct = Math.min(100, Math.round((realQuizCount / 20) * 100));
            quizRing.setAttribute("stroke-dasharray", `${ringPct}, 100`);
        }

    } catch (e) {
        console.warn("[DASHBOARD STATS] Could not load dashboard stats:", e);
    }
}

/* =====================================================
   AI CODE MENTOR, REASONING & AUTO-CORRECTION (GEMINI 2.5 FLASH)
===================================================== */
let _latestAiCorrectedCode = "";

async function triggerAiMentor() {
    const modal = document.getElementById("ai-mentor-modal");
    const bodyContent = document.getElementById("ai-mentor-body-content");
    if (!modal || !bodyContent) return;

    modal.style.display = "flex";

    // Extract current code, selected language, and terminal output
    const editorEl = document.getElementById("compiler-editor");
    const langSelectEl = document.getElementById("compiler-language");
    const outputEl = document.querySelector(".compiler-output");

    const code = editorEl ? editorEl.value : "";
    const language = langSelectEl ? langSelectEl.value : "java";
    const errorLog = outputEl ? outputEl.textContent : "";

    if (!code || !code.trim()) {
        bodyContent.innerHTML = `
            <div class="ai-card-block">
                <div class="ai-card-title root-cause">⚠️ Code Missing</div>
                <p class="ai-card-text">Please type or paste some source code in the compiler workspace before requesting AI Mentor analysis.</p>
            </div>
        `;
        return;
    }

    // Render Animated Loading & Timer State
    bodyContent.innerHTML = `
        <div class="ai-loading-box-container" style="text-align: center; padding: 36px 20px;">
            <div class="ai-loading-logo-wrap">
                <div class="ai-sonar-ring ring1"></div>
                <div class="ai-sonar-ring ring2"></div>
                <img src="image/zetrox-logo.png" class="ai-loading-logo zetrox-float-anim zetrox-pulse-glow" alt="Zetrox AI">
            </div>
            <h4 class="ai-loading-title">Zetrox AI Mentor is Analyzing Your Code...</h4>
            <div class="ai-timer-badge-container">
                <div class="ai-timer-badge" id="ai-mentor-timer-display">⏱️ 0.0s</div>
            </div>
            <p id="ai-mentor-status-text" class="ai-loading-status">
                ⚡ Initializing Zetrox 2.5 Flash Agent...
            </p>
            <div class="ai-progress-track">
                <div class="ai-progress-fill" id="ai-mentor-progress-bar"></div>
            </div>
        </div>
    `;

    // Start Realtime Execution Timer & Phase Message Dispatcher
    const startTime = Date.now();
    const mentorTimer = setInterval(() => {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const timerEl = document.getElementById("ai-mentor-timer-display");
        const statusEl = document.getElementById("ai-mentor-status-text");
        const progressEl = document.getElementById("ai-mentor-progress-bar");

        if (timerEl) timerEl.textContent = `⏱️ ${elapsed}s`;

        const sec = parseFloat(elapsed);
        if (statusEl && progressEl) {
            if (sec < 0.8) {
                statusEl.textContent = "⚡ Initializing Zetrox 2.5 Flash Agent...";
                progressEl.style.width = "18%";
            } else if (sec < 1.8) {
                statusEl.textContent = "🔍 Analyzing Code & Error Stack Traces...";
                progressEl.style.width = "40%";
            } else if (sec < 3.0) {
                statusEl.textContent = "💡 Performing Socratic Root-Cause Reasoning...";
                progressEl.style.width = "65%";
            } else if (sec < 4.2) {
                statusEl.textContent = "🛠️ Formulating Auto-Corrected Code Solution...";
                progressEl.style.width = "85%";
            } else {
                statusEl.textContent = "🚀 Almost Ready! Finalizing AI Insights...";
                progressEl.style.width = "95%";
            }
        }
    }, 100);

    try {
        const response = await fetch('/api/ai/diagnose', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, language, errorLog })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Unable to reach AI Mentor service.`);
        }

        const data = await response.json();
        _latestAiCorrectedCode = data.correctedCode || code;

        clearInterval(mentorTimer);

        bodyContent.innerHTML = `
            <div class="ai-card-block">
                <div class="ai-card-title root-cause">📊 Execution Status & Summary</div>
                <p class="ai-card-text"><strong>${escapeHtml(data.errorSummary || "Code Analysis Complete")}</strong></p>
            </div>

            <div class="ai-card-block">
                <div class="ai-card-title why">🔍 Why It Is Wrong (Root Cause Analysis)</div>
                <p class="ai-card-text">${escapeHtml(data.whyItIsWrong || "Review syntax standards and logic constructs.")}</p>
            </div>

            <div class="ai-card-block">
                <div class="ai-card-title how">🛠️ How To Clear The Error</div>
                <p class="ai-card-text">${escapeHtml(data.howToFix || "Follow the step-by-step fix guide to clear errors.")}</p>
            </div>

            <div class="ai-card-block">
                <div class="ai-card-title learn">🎯 What We Want To Make (Learning Concept)</div>
                <p class="ai-card-text">${escapeHtml(data.whatToLearn || "Language Syntax & Fundamentals")}</p>
            </div>

            <div class="ai-card-block" style="text-align: center; background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.08)); border: 1px solid rgba(16, 185, 129, 0.3);">
                <div class="ai-card-title fix" style="justify-content: center; font-size: 0.95rem;">⚡ AI Code Auto-Correction Ready</div>
                <p class="ai-card-text" style="margin-bottom: 14px; font-size: 0.88rem; color: var(--text-muted, #7d90b0);">Click below to automatically clear errors and watch the AI type the corrected code into your editor workspace.</p>
                <button class="ai-autofix-btn" onclick="applyAiAutoCorrection()">
                    <span>✨ Auto-Fix & Type Code into Editor</span>
                </button>
            </div>
        `;

    } catch (err) {
        clearInterval(mentorTimer);
        console.error("[AI MENTOR] Failed to query AI Mentor:", err);
        bodyContent.innerHTML = `
            <div class="ai-card-block">
                <div class="ai-card-title root-cause">⚠️ Diagnostic Service Status</div>
                <p class="ai-card-text">Unable to complete live AI analysis: ${escapeHtml(err.message)}</p>
                <p class="ai-card-text" style="margin-top: 10px; font-size: 0.85rem; color: var(--text-muted);">Ensure your server is running and GEMINI_API_KEY is configured.</p>
            </div>
        `;
    }
}

function applyAiAutoCorrection() {
    if (!_latestAiCorrectedCode) {
        alert("No AI auto-correction available.");
        return;
    }

    closeAiMentorModal();

    const editorEl = document.getElementById("compiler-editor");
    const wrapperEl = document.querySelector(".ide-editor-wrapper");
    if (!editorEl) return;

    // Highlight editor container with glowing green border
    if (wrapperEl) {
        wrapperEl.style.transition = "all 0.3s ease";
        wrapperEl.style.boxShadow = "0 0 30px rgba(16, 185, 129, 0.6), inset 0 0 15px rgba(16, 185, 129, 0.2)";
        wrapperEl.style.borderColor = "#10b981";
    }

    // Scroll smoothly to compiler workspace
    editorEl.scrollIntoView({ behavior: "smooth", block: "center" });

    // Animate Line-by-Line Code Typing
    const lines = _latestAiCorrectedCode.split("\n");
    let currentLineIndex = 0;
    editorEl.value = ""; // Clear current code

    const typingInterval = setInterval(() => {
        if (currentLineIndex < lines.length) {
            editorEl.value += (currentLineIndex === 0 ? "" : "\n") + lines[currentLineIndex];
            currentLineIndex++;

            // Trigger live line number gutter & cursor updates
            editorEl.dispatchEvent(new Event("input", { bubbles: true }));
            editorEl.scrollTop = editorEl.scrollHeight;
        } else {
            clearInterval(typingInterval);
            editorEl.focus();
            editorEl.dispatchEvent(new Event("change", { bubbles: true }));

            // Remove glow effect after typing animation ends
            setTimeout(() => {
                if (wrapperEl) {
                    wrapperEl.style.boxShadow = "";
                    wrapperEl.style.borderColor = "";
                }
            }, 1200);
        }
    }, 45); // 45ms smooth typing speed per line
}

function closeAiMentorModal() {
    const modal = document.getElementById("ai-mentor-modal");
    if (modal) modal.style.display = "none";
}

/* =====================================================
   ZETROX AI CODING AGENT & TOOL SUITE (CHAT INTERFACE)
===================================================== */
function toggleZetroxChat() {
    const drawer = document.getElementById("zetrox-chat-drawer");
    if (!drawer) return;
    if (drawer.style.display === "none" || !drawer.style.display) {
        drawer.style.display = "flex";
        const input = document.getElementById("zetrox-chat-input");
        if (input) input.focus();
    } else {
        drawer.style.display = "none";
    }
}

function parseZetroxMarkdown(text) {
    if (!text) return "";

    // Clean raw LaTeX math markers like ($O(1)$), \($O(N)$\), $O(N \log N)$ -> O(1), O(N), O(N log N)
    text = text.replace(/[\(\$]*\\?\$?O\(([^)]+)\)\\?\$?[\)\$]*/gi, 'O($1)');
    text = text.replace(/\\sqrt\{N\}/gi, '√N');
    text = text.replace(/\$\$?\s*([^\$]+)\s*\$\$?/g, '$1');

    let html = escapeHtml(text);

    // Markdown Data Tables (| Col1 | Col2 |\n| :--- | :--- |\n| Val1 | Val2 |)
    html = html.replace(/((?:\|[^\n]+\|\r?\n?)+)/g, function(match, tableBlock) {
        const rawLines = tableBlock.trim().split('\n').map(l => l.trim()).filter(l => l.startsWith('|'));
        if (rawLines.length < 2) return match;

        let tableHtml = '<div style="overflow-x: auto; margin: 12px 0;"><table class="zetrox-data-table"><thead>';

        // Extract header
        const headers = rawLines[0].split('|').slice(1, -1).map(h => h.trim());
        tableHtml += '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>';

        // Check if second line is a separator line (| :--- | :--- |)
        const startIndex = (rawLines[1] && rawLines[1].includes('---')) ? 2 : 1;

        for (let i = startIndex; i < rawLines.length; i++) {
            const cells = rawLines[i].split('|').slice(1, -1).map(c => c.trim());
            if (cells.length > 0) {
                tableHtml += '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
            }
        }

        tableHtml += '</tbody></table></div>';
        return tableHtml;
    });

    // Code blocks ```lang ... ```
    html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, function(match, lang, code) {
        const langTag = lang ? lang.toUpperCase() : "CODE";
        return `
            <div style="margin: 14px 0; background: #090d16; border: 1px solid rgba(99,102,241,0.35); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.3);">
                <div style="padding: 7px 14px; background: rgba(30,41,59,0.9); font-size: 0.74rem; font-weight: 800; color: #a5b4fc; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; letter-spacing: 0.5px;">
                    <span>⚡ ${langTag} SNIPPET</span>
                    <span style="font-size: 0.7rem; color: #10b981;">Zetrox Verified</span>
                </div>
                <pre class="ai-code-box" style="margin: 0; padding: 14px 18px; border: none; border-radius: 0; max-height: 240px; font-size: 0.86rem; line-height: 1.55; color: #34d399; font-family: 'JetBrains Mono', monospace;"><code>${code.trim()}</code></pre>
            </div>
        `;
    });

    // Inline code `code`
    html = html.replace(/`([^`]+)`/g, '<code style="background: rgba(99,102,241,0.18); color: #38bdf8; padding: 2px 7px; border-radius: 5px; font-family: monospace; font-size: 0.86rem; font-weight: 600;">$1</code>');

    // Headings ### Header
    html = html.replace(/^###\s+(.*)$/gm, '<h4 style="margin: 18px 0 8px 0; font-size: 0.98rem; font-weight: 700; color: #38bdf8; border-bottom: 1px solid rgba(56,189,248,0.25); padding-bottom: 4px;">$1</h4>');
    html = html.replace(/^##\s+(.*)$/gm, '<h3 style="margin: 20px 0 10px 0; font-size: 1.08rem; font-weight: 800; color: #10b981; border-bottom: 1px solid rgba(16,185,129,0.3); padding-bottom: 4px;">$1</h3>');

    // Horizontal rules ---
    html = html.replace(/^---$/gm, '<hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 16px 0;">');

    // Bold **text**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong style="color: var(--text-main, #f8fafc); font-weight: 700;">$1</strong>');

    // Italic *text*
    html = html.replace(/\*([^*]+)\*/g, '<em style="color: #cbd5e1;">$1</em>');

    // Bullet points - item or * item
    html = html.replace(/^[\-\*]\s+(.*)$/gm, '<div style="margin-left: 8px; margin-bottom: 8px; display: flex; gap: 10px; align-items: flex-start;"><span style="color: #10b981; font-weight: bold; font-size: 1rem;">•</span><span style="flex:1; line-height: 1.6;">$1</span></div>');

    // Numbered lists 1. item
    html = html.replace(/^(\d+)\.\s+(.*)$/gm, '<div style="margin-left: 8px; margin-bottom: 8px; display: flex; gap: 10px; align-items: flex-start;"><span style="color: #6366f1; font-weight: 800; font-size: 0.88rem;">$1.</span><span style="flex:1; line-height: 1.6;">$2</span></div>');

    // Paragraph spacing
    html = html.replace(/\n\n/g, '<div style="height: 12px;"></div>');
    html = html.replace(/\n/g, '<br>');

    return html;
}

function streamTypewriterResponse(containerEl, formattedHtml, scrollContainer) {
    let index = 0;
    const speed = 8; // 8ms high-speed tick
    const fullText = formattedHtml;

    containerEl.innerHTML = '<span class="zetrox-typing-cursor">▌</span>';

    const streamInterval = setInterval(() => {
        if (index < fullText.length) {
            // Handle HTML tags as a single step so tags like <strong> don't break mid-air
            if (fullText[index] === '<') {
                const closingIdx = fullText.indexOf('>', index);
                if (closingIdx !== -1) {
                    index = closingIdx + 1;
                } else {
                    index++;
                }
            } else {
                index += 3; // Stream 3 characters per tick for fluid, high-speed response
                if (index > fullText.length) index = fullText.length;
            }

            containerEl.innerHTML = fullText.substring(0, index) + '<span class="zetrox-typing-cursor">▌</span>';
            if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;
        } else {
            clearInterval(streamInterval);
            containerEl.innerHTML = fullText; // Final clean HTML without cursor
            if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    }, speed);
}

// Global Multi-Turn Conversation Memory for Zetrox AI
const zetroxConversationHistory = [];

async function sendZetroxMessage() {
    const input = document.getElementById("zetrox-chat-input");
    const list = document.getElementById("zetrox-messages-list");
    if (!input || !list) return;

    const userText = input.value.trim();
    if (!userText) return;

    // Append user message
    const userMsgEl = document.createElement("div");
    userMsgEl.className = "zetrox-msg user";
    userMsgEl.innerHTML = `
        <div class="zetrox-avatar">👤</div>
        <div class="zetrox-bubble">${escapeHtml(userText)}</div>
    `;
    list.appendChild(userMsgEl);

    input.value = "";
    list.scrollTop = list.scrollHeight;

    // Start Live Reasoning Timer
    const startTime = Date.now();
    const typingEl = document.createElement("div");
    typingEl.className = "zetrox-msg agent";
    typingEl.id = "zetrox-typing-indicator";
    typingEl.innerHTML = `
        <div class="zetrox-avatar"><img src="image/zetrox-logo.png" class="zetrox-avatar-img zetrox-float-anim" alt="Zetrox AI"></div>
        <div class="zetrox-bubble" style="font-style: normal; color: #94a3b8; display: flex; align-items: center; gap: 6px;">
            <span class="ai-typing-pulse">🧠</span> Zetrox AI is reasoning... <span class="zetrox-reason-timer" id="zetrox-live-timer">0.0s</span>
        </div>
    `;
    list.appendChild(typingEl);
    list.scrollTop = list.scrollHeight;

    const reasonTimer = setInterval(() => {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const timerEl = document.getElementById("zetrox-live-timer");
        if (timerEl) timerEl.textContent = elapsed + "s";
    }, 100);

    const activeNav = document.querySelector('.nav-link.active, .sidebar-item.active, .nav-item.active');
    const pageName = activeNav ? activeNav.innerText.trim().toLowerCase() : 'dashboard';

    const editorEl = document.getElementById("compiler-editor");
    const langSelectEl = document.getElementById("compiler-language");
    const outputEl = document.getElementById("compiler-output");
    const courseCardEl = document.querySelector('.course-card.active, .module-card.active, h2, h3');

    const code = editorEl ? editorEl.value : "";
    const language = langSelectEl ? langSelectEl.value : "java";

    const contextPayload = {
        page: pageName,
        language: language,
        code: code,
        output: outputEl ? outputEl.innerText : "",
        courseTopic: courseCardEl ? courseCardEl.innerText.trim() : "",
        user: "deepak"
    };

    function getZetroxSessionId() {
        let sid = localStorage.getItem("zetrox_session_id");
        if (!sid) {
            sid = "user-session-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9);
            localStorage.setItem("zetrox_session_id", sid);
        }
        return sid;
    }

    try {
        const response = await fetch('/api/zetrox/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: userText,
                sessionId: getZetroxSessionId(),
                code,
                language,
                context: contextPayload,
                history: zetroxConversationHistory.slice(-10)
            })
        });

        const data = await response.json();
        clearInterval(reasonTimer);

        if (data && data.success && data.reply) {
            // Add both turns only after the request succeeds so the current
            // prompt is not sent twice in the next Gemini contents payload.
            zetroxConversationHistory.push({ role: "user", parts: [{ text: userText }] });
            // Store model response in conversation history
            zetroxConversationHistory.push({ role: "model", parts: [{ text: data.reply }] });
        }

        const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);

        const indicator = document.getElementById("zetrox-typing-indicator");
        if (indicator) indicator.remove();

        const msgId = "zetrox-stream-" + Date.now();
        const replyContent = (data && data.reply && data.reply.trim()) ? data.reply : "🤖 **Zetrox AI Response**\n\nI have processed your query. Please let me know if you would like me to generate code, explain errors, or break down concepts!";
        const formattedHtml = parseZetroxMarkdown(replyContent);

        const agentMsgEl = document.createElement("div");
        agentMsgEl.className = "zetrox-msg agent";
        agentMsgEl.style.maxWidth = "92%";
        agentMsgEl.innerHTML = `
            <div class="zetrox-avatar"><img src="image/zetrox-logo.png" class="zetrox-avatar-img zetrox-float-anim" alt="Zetrox AI"></div>
            <div class="zetrox-bubble" style="width: 100%;">
                <div class="zetrox-card-header">
                    <span class="zetrox-badge">ZETROX AI AGENT</span>
                    <span class="zetrox-time-badge">⚡ Reasoned in ${elapsedSec}s</span>
                </div>
                <div id="${msgId}" class="zetrox-stream-body"></div>
            </div>
        `;
        list.appendChild(agentMsgEl);
        list.scrollTop = list.scrollHeight;

        const targetEl = document.getElementById(msgId);
        if (targetEl) {
            streamTypewriterResponse(targetEl, formattedHtml, list);
        }

    } catch (err) {
        clearInterval(reasonTimer);
        const indicator = document.getElementById("zetrox-typing-indicator");
        if (indicator) indicator.remove();

        const errEl = document.createElement("div");
        errEl.className = "zetrox-msg agent";
        errEl.innerHTML = `
            <div class="zetrox-avatar"><img src="image/zetrox-logo.png" class="zetrox-avatar-img" alt="Zetrox AI"></div>
            <div class="zetrox-bubble" style="color: #f43f5e;">Unable to reach Zetrox AI Agent. Ensure server is active.</div>
        `;
        list.appendChild(errEl);
        list.scrollTop = list.scrollHeight;
    }
}

async function callAgentTool(toolName) {
    const toolBox = document.getElementById("zetrox-tool-output-container");
    const list = document.getElementById("zetrox-messages-list");
    const editorEl = document.getElementById("compiler-editor");
    const langSelectEl = document.getElementById("compiler-language");

    const code = editorEl ? editorEl.value : "";
    const language = langSelectEl ? langSelectEl.value : "java";

    if (!toolBox) return;

    toolBox.style.display = "block";
    toolBox.innerHTML = `<div style="text-align: center; color: #38bdf8;">⏳ Executing Zetrox Agent Tool <code>${toolName}()</code>...</div>`;

    try {
        const response = await fetch('/api/zetrox/tool', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tool: toolName, code, language })
        });

        const data = await response.json();

        if (toolName === 'generate_quiz' && data.quiz) {
            const q = data.quiz;
            let optionsHtml = '';
            q.options.forEach((opt, idx) => {
                optionsHtml += `<button class="zetrox-quiz-option-btn" onclick="submitZetroxQuizAnswer(${q.correctAnswerIndex}, ${idx}, '${escapeHtml(q.explanation)}')">${escapeHtml(opt)}</button>`;
            });

            toolBox.innerHTML = `
                <div style="font-weight: 700; color: #10b981; margin-bottom: 6px;">🧩 ${escapeHtml(q.title)}</div>
                <div style="margin-bottom: 8px;">${escapeHtml(q.question)}</div>
                <div id="zetrox-quiz-options">${optionsHtml}</div>
                <div id="zetrox-quiz-feedback" style="margin-top: 8px; font-weight: 600;"></div>
            `;
        } else if (toolName === 'get_user_progress') {
            toolBox.innerHTML = `
                <div style="font-weight: 700; color: #fbbf24; margin-bottom: 6px;">🏆 Zetrox AI Mastery Stats</div>
                <div>🔥 Current Streak: <strong>${data.currentStreak}</strong></div>
                <div>⚡ Total Executions: <strong>${data.totalExecutions}</strong></div>
                <div>🧩 Quizzes Solved: <strong>${data.quizzesSolved}</strong></div>
                <div>🎯 Mastery Rating: <strong>${data.masteryScore} (${data.rank})</strong></div>
            `;
        } else if (toolName === 'get_course_topic' && data.modules) {
            let modsHtml = data.modules.map(m => `
                <div style="background: rgba(30, 41, 59, 0.8); padding: 8px 10px; border-radius: 8px; margin-top: 6px; border: 1px solid rgba(255,255,255,0.06);">
                    <div style="font-weight: 700; color: #38bdf8;">${escapeHtml(m.title)} <span style="font-size: 0.7rem; color: #94a3b8;">(${escapeHtml(m.difficulty)})</span></div>
                    <div style="font-size: 0.8rem; color: #cbd5e1; margin-top: 2px;">${escapeHtml(m.description)}</div>
                </div>
            `).join('');
            toolBox.innerHTML = `
                <div style="font-weight: 700; color: #8b5cf6; margin-bottom: 6px;">📚 Zetrox Recommended Learning Modules</div>
                ${modsHtml}
            `;
        } else if (toolName === 'compile_code' || toolName === 'run_code') {
            const runBtn = document.querySelector(".compiler-run-btn");
            if (runBtn) runBtn.click();
            toolBox.innerHTML = `
                <div style="color: #34d399; font-weight: 600;">⚡ Tool <code>run_code()</code> executed! Compiler triggered for ${language.toUpperCase()}.</div>
            `;
        } else if (toolName === 'explain_error') {
            toolBox.innerHTML = `
                <div style="font-weight: 500;">${data.explanation ? parseZetroxMarkdown(data.explanation) : 'Error Analysis Complete.'}</div>
            `;
        } else {
            toolBox.innerHTML = `<div style="color: #34d399;">Result: ${escapeHtml(JSON.stringify(data))}</div>`;
        }

        if (list) list.scrollTop = list.scrollHeight;
    } catch (err) {
        toolBox.innerHTML = `<div style="color: #f43f5e;">Tool execution failed: ${escapeHtml(err.message)}</div>`;
    }
}

function submitZetroxQuizAnswer(correctIdx, selectedIdx, explanation) {
    const feedbackEl = document.getElementById("zetrox-quiz-feedback");
    if (!feedbackEl) return;

    if (selectedIdx === correctIdx) {
        feedbackEl.style.color = "#10b981";
        feedbackEl.innerHTML = `✅ <strong>Correct!</strong> ${explanation}`;
    } else {
        feedbackEl.style.color = "#f43f5e";
        feedbackEl.innerHTML = `❌ <strong>Incorrect.</strong> ${explanation}`;
    }
}

/* =====================================================
   ZETROX AI AGENT CONTEXT
   ===================================================== */

function getZetroxContext() {
    const editor = document.getElementById("compiler-editor");
    const language = document.getElementById("compiler-language");
    const input = document.getElementById("compiler-user-input");
    const output = document.querySelector(".compiler-output");

    const activeSection =
        document.querySelector("main > section.active-section");

    return {
        page: activeSection?.id || "",
        section: activeSection?.id || "",

        course:
            document.querySelector(".course-subject-top-header h1")?.textContent?.trim() || "",

        lesson:
            document.querySelector(".course-topic.active")?.textContent?.trim() || "",

        courseTopic:
            document.querySelector(".course-topic.active")?.textContent?.trim() || "",

        courseContent:
            activeSection?.innerText || "",

        language: language?.value || "",

        code: editor?.value || "",

        stdin: input?.value || "",

        output: output?.textContent || "",

        compilerError: output?.textContent || "",

        displayName:
            localStorage.getItem("loggedInUserName") ||
            localStorage.getItem("userName") ||
            "",

        email:
            localStorage.getItem("loggedInEmail") || "",

        platformCapabilities: [
            "Courses",
            "Online Compiler",
            "Code Visualizer",
            "Code Rooms",
            "Public Chat",
            "Private 1-on-1 Messaging",
            "Notifications",
            "Quizzes",
            "Leaderboard",
            "Settings"
        ]
    };
}


async function askZetrox(message) {

    let sessionId = localStorage.getItem("zetroxSessionId");

    if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem("zetroxSessionId", sessionId);
    }

    const response = await fetch("/api/zetrox/chat", {
        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            sessionId: sessionId,
            message: message,
            context: getZetroxContext()
        })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(
            data.error || "ZETROX request failed."
        );
    }

    return data.reply;
}

/* =====================================================
   COMPILER OUTPUT DRAG RESIZER & FULLSCREEN MODE
===================================================== */
function toggleOutputFullscreen() {
    const container = document.getElementById("ide-terminal-container");
    const iconEl = document.getElementById("output-fullscreen-icon");
    const textEl = document.getElementById("output-fullscreen-text");
    if (!container) return;

    const isFullscreen = container.classList.toggle("fullscreen-output-mode");
    if (isFullscreen) {
        if (iconEl) iconEl.textContent = "🗗";
        if (textEl) textEl.textContent = "Exit Full Screen";
    } else {
        if (iconEl) iconEl.textContent = "⛶";
        if (textEl) textEl.textContent = "Full Screen";
    }
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        const container = document.getElementById("ide-terminal-container");
        if (container && container.classList.contains("fullscreen-output-mode")) {
            toggleOutputFullscreen();
        }
    }
});

function initCompilerTerminalResize() {
    const handle = document.getElementById("ide-resize-handle");
    const body = document.querySelector(".ide-terminal-body");
    if (!handle || !body) return;

    let isDragging = false;
    let startY = 0;
    let startHeight = 0;

    handle.addEventListener("mousedown", (e) => {
        isDragging = true;
        startY = e.clientY;
        startHeight = body.getBoundingClientRect().height;
        handle.classList.add("dragging");
        document.body.style.cursor = "ns-resize";
        document.body.style.userSelect = "none";
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        const dy = startY - e.clientY;
        const newHeight = Math.max(100, Math.min(window.innerHeight * 0.82, startHeight + dy));
        body.style.height = `${newHeight}px`;
        body.style.maxHeight = `${newHeight}px`;
    });

    document.addEventListener("mouseup", () => {
        if (isDragging) {
            isDragging = false;
            handle.classList.remove("dragging");
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        }
    });

    handle.addEventListener("touchstart", (e) => {
        if (e.touches.length === 1) {
            isDragging = true;
            startY = e.touches[0].clientY;
            startHeight = body.getBoundingClientRect().height;
            handle.classList.add("dragging");
        }
    });

    document.addEventListener("touchmove", (e) => {
        if (isDragging && e.touches.length === 1) {
            const dy = startY - e.touches[0].clientY;
            const newHeight = Math.max(100, Math.min(window.innerHeight * 0.82, startHeight + dy));
            body.style.height = `${newHeight}px`;
            body.style.maxHeight = `${newHeight}px`;
        }
    });

    document.addEventListener("touchend", () => {
        isDragging = false;
        handle.classList.remove("dragging");
    });
}

function showToast(msg) {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.style.cssText = "position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;";
        document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    toast.style.cssText = "background:#1e293b;color:#00f5a0;border:1px solid rgba(0,245,160,0.3);padding:12px 18px;border-radius:10px;font-size:0.85rem;font-weight:700;box-shadow:0 10px 25px rgba(0,0,0,0.5);opacity:0;transform:translateY(10px);transition:all 0.3s ease;";
    toast.textContent = msg;
    container.appendChild(toast);
    requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
    });
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(10px)";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function initUpcomingCourseClickHandlers() {
    const upcomingCards = document.querySelectorAll('.course-card.upcoming');
    upcomingCards.forEach(card => {
        if (card.dataset.hasUpcomingListener) return;
        card.dataset.hasUpcomingListener = "true";

        card.addEventListener('click', function(e) {
            e.stopPropagation();
            const courseTitle = card.querySelector('.card-title')?.textContent || "Course";
            
            card.classList.remove('upcoming');
            const badge = card.querySelector('.card-badge');
            if (badge) badge.textContent = 'Available';
            
            const upcomingLabel = card.querySelector('.card-upcoming-label');
            if (upcomingLabel) {
                upcomingLabel.className = 'card-start-prompt';
                upcomingLabel.textContent = 'Start →';
            }

            const availableGrid = document.querySelector('.available-courses .courses');
            if (availableGrid) {
                availableGrid.appendChild(card);
            }

            showToast(`🎉 ${courseTitle} is now Available in your courses!`);

            if (typeof updateMasterclassBarChart === 'function') {
                updateMasterclassBarChart(typeof _allQuizLogs !== 'undefined' ? _allQuizLogs : []);
            }
        });
    });
}

/* =================================================================
   P2P LIVE PAIR PROGRAMMING ANIMATION ENGINE (HERO SECTION)
   ================================================================= */
function initHeroPairCodingAnimation() {
    const u1CodeEl = document.getElementById('u1-code-display');
    const u2CodeEl = document.getElementById('u2-code-display');
    const u1TermEl = document.getElementById('u1-term-display');
    const u2TermEl = document.getElementById('u2-term-display');
    const u1Status = document.getElementById('u1-status');
    const u2Status = document.getElementById('u2-status');

    if (!u1CodeEl || !u2CodeEl) return;

    const scenario = [
        {
            user: 'alex',
            raw: 'public class LivePairDemo {',
            html: '<span class="kw">public class</span> <span class="cls">LivePairDemo</span> {'
        },
        {
            user: 'alex',
            raw: '    public static void main(String[] args) {',
            html: '    <span class="kw">public static void</span> <span class="fn">main</span>(String[] args) {'
        },
        {
            user: 'alex',
            raw: '        int number = 42;',
            html: '        <span class="kw">int</span> number = <span class="num">42</span>;'
        },
        {
            user: 'sarah',
            raw: '        if (number % 2 == 0) {',
            html: '        <span class="kw">if</span> (number % <span class="num">2</span> == <span class="num">0</span>) {'
        },
        {
            user: 'sarah',
            raw: '            System.out.println("Even: " + number);',
            html: '            System.out.<span class="fn">println</span>(<span class="str">"Even: "</span> + number);',
            term: '❯ Even: 42 [Execution: 0.12ms]'
        },
        {
            user: 'alex',
            raw: '        }',
            html: '        }'
        },
        {
            user: 'alex',
            raw: '    }',
            html: '    }'
        },
        {
            user: 'alex',
            raw: '}',
            html: '}'
        }
    ];

    let completedHtmlLines = [];
    let currentLineIdx = 0;
    let currentCharIdx = 0;
    let animTimer = null;

    const u1Pos = document.getElementById('u1-pos');
    const u2Pos = document.getElementById('u2-pos');

    function renderState(currentRawText, user) {
        const cursorTag = user === 'alex' 
            ? '<span class="typing-cursor-bar alex">|</span>' 
            : '<span class="typing-cursor-bar sarah">|</span>';

        let codeHtml = completedHtmlLines.join('\n');
        if (currentRawText !== null) {
            if (codeHtml.length > 0) codeHtml += '\n';
            codeHtml += escapeHtmlText(currentRawText) + cursorTag;
        }

        u1CodeEl.innerHTML = codeHtml;
        u2CodeEl.innerHTML = codeHtml;

        const colNum = currentRawText !== null ? currentRawText.length + 1 : 1;
        const lineNum = currentLineIdx + 1;
        if (u1Pos) u1Pos.textContent = `Ln ${lineNum}, Col ${colNum}`;
        if (u2Pos) u2Pos.textContent = `Ln ${lineNum}, Col ${colNum}`;

        if (u1CodeEl.parentElement) u1CodeEl.parentElement.scrollTop = u1CodeEl.parentElement.scrollHeight;
        if (u2CodeEl.parentElement) u2CodeEl.parentElement.scrollTop = u2CodeEl.parentElement.scrollHeight;
    }

    function escapeHtmlText(text) {
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function startTypingStep() {
        if (currentLineIdx >= scenario.length) {
            u1Status.className = 'typing-status-badge synced';
            u1Status.textContent = 'Synced';
            u2Status.className = 'typing-status-badge synced';
            u2Status.textContent = 'Synced';

            animTimer = setTimeout(() => {
                completedHtmlLines = [];
                currentLineIdx = 0;
                currentCharIdx = 0;
                u1TermEl.textContent = '❯ Ready';
                u2TermEl.textContent = '❯ Ready';
                startTypingStep();
            }, 4000);
            return;
        }

        const lineObj = scenario[currentLineIdx];
        const activeUser = lineObj.user;

        if (activeUser === 'alex') {
            u1Status.className = 'typing-status-badge alex';
            u1Status.textContent = 'Typing...';
            u2Status.className = 'typing-status-badge synced';
            u2Status.textContent = 'Synced';
        } else {
            u2Status.className = 'typing-status-badge sarah';
            u2Status.textContent = 'Typing...';
            u1Status.className = 'typing-status-badge synced';
            u1Status.textContent = 'Synced';
        }

        if (currentCharIdx <= lineObj.raw.length) {
            const partialRaw = lineObj.raw.substring(0, currentCharIdx);
            renderState(partialRaw, activeUser);
            currentCharIdx++;
            animTimer = setTimeout(startTypingStep, Math.floor(Math.random() * 20) + 25);
        } else {
            completedHtmlLines.push(lineObj.html);
            renderState(null, activeUser);

            if (lineObj.term) {
                u1TermEl.textContent = lineObj.term;
                u2TermEl.textContent = lineObj.term;
            }

            currentLineIdx++;
            currentCharIdx = 0;
            animTimer = setTimeout(startTypingStep, 350);
        }
    }

    startTypingStep();
}

document.addEventListener("DOMContentLoaded", () => {
    initCompilerTerminalResize();
    if (typeof loadAcademyDashboardStats === 'function') {
        loadAcademyDashboardStats();
    }
    initHeroPairCodingAnimation();
});




