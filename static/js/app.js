// ==============================================================================
// PYTHON SIKHO (पाइथन सीखो) - CLIENT INTERACTIVE ENGINE
// Chief Mentor: Rohit Sir (Samyak Computer Classes, Kuchaman City • 📞 9509934266)
// ==============================================================================

let currentPortalStep = 1;
let currentChapterId = 1;
let activeStudent = null; // Stored in localStorage for persistent session
let sentPhoneNumber = "";
let resendTimerInterval = null;

let currentChapterData = null;
let allChapters = [];
let chatHistory = []; // Multi-turn chat memory
let quizTimerInterval = null;
let quizSecondsLeft = 60;

// Cursor Coordinates for Smooth Lerp Animation
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let ringX = mouseX;
let ringY = mouseY;

// ==============================================================================
// 1. APP INITIALIZATION
// ==============================================================================
window.addEventListener("load", async () => {
    initDesignerCursor();
    setupDropdownCloseListener();
    setupSandboxKeyShortcuts();
    startStudentSessionHeartbeat();
    fetchActiveAnnouncement();
    initPwaServiceWorker();
    loadLeaderboardData();
    await fetchChapters();
    await loadChapter(1);
    checkActiveSession();
});

// ==============================================================================
// 2. CUSTOM DESIGNER CURSOR ENGINE
// ==============================================================================
function initDesignerCursor() {
    const dot = document.getElementById("cursor-dot");
    const ring = document.getElementById("cursor-ring");

    if (!dot || !ring) return;

    // Track real-time mouse position
    window.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
    });

    // Smooth Lerp Animation Loop for Outer Ring
    function animateRing() {
        ringX += (mouseX - ringX) * 0.18;
        ringY += (mouseY - ringY) * 0.18;
        ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
        requestAnimationFrame(animateRing);
    }
    requestAnimationFrame(animateRing);

    // Hover detection on interactive elements
    document.addEventListener("mouseover", (e) => {
        const target = e.target.closest("button, a, input, textarea, select, .step-chip, .step-chip-home, .topic-nav-chip, .topic-card-box, .user-profile-widget, .quiz-option-label, .ai-tutor-bubble, .quick-chip, .dropdown-item-btn, .feature-card");
        if (target) {
            ring.classList.add("hover");
        } else {
            ring.classList.remove("hover");
        }
    });

    window.addEventListener("mousedown", () => {
        ring.classList.add("click");
    });

    window.addEventListener("mouseup", () => {
        ring.classList.remove("click");
    });
}

// ==============================================================================
// 3. VIEW MANAGEMENT & NAVIGATION ROUTER
// ==============================================================================
function hideAllViews() {
    const views = [
        "landing-page-view",
        "learning-portal-view",
        "student-dashboard-view",
        "blog-page-view",
        "blog-article-view"
    ];
    views.forEach(id => {
        const elem = document.getElementById(id);
        if (elem) {
            elem.classList.remove("active");
            elem.style.display = "none";
        }
    });
}

function showLandingPage() {
    hideAllViews();
    const landing = document.getElementById("landing-page-view");
    if (landing) {
        landing.classList.add("active");
        landing.style.display = "block";
    }

    const navLinks = document.getElementById("landing-nav-links");
    const flowBar = document.getElementById("pipeline-flow-bar");
    if (navLinks) navLinks.style.display = "flex";
    if (flowBar) flowBar.style.display = "none";

    updateNavbarAuthUI();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function enterLearningPortal(topicId) {
    if (!activeStudent) {
        alert("🔐 कृपया पहले अपने 10-अंकों के मोबाइल नंबर से लॉगिन करें!");
        openAuthModal();
        return;
    }

    hideAllViews();
    const portal = document.getElementById("learning-portal-view");
    if (portal) {
        portal.classList.add("active");
        portal.style.display = "block";
    }

    const navLinks = document.getElementById("landing-nav-links");
    const flowBar = document.getElementById("pipeline-flow-bar");
    if (navLinks) navLinks.style.display = "none";
    if (flowBar) flowBar.style.display = "flex";

    if (topicId) {
        loadChapter(topicId);
    }

    updateNavbarAuthUI();
    fetchStudentProgress();
    switchPortalStep(currentPortalStep || 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function showStudentDashboard() {
    if (!activeStudent) {
        alert("🔐 स्टूडेंट डैशबोर्ड देखने के लिए कृपया पहले अपने 10-अंकों के मोबाइल नंबर से लॉगिन करें!");
        openAuthModal();
        return;
    }

    hideAllViews();
    const dash = document.getElementById("student-dashboard-view");
    if (dash) {
        dash.classList.add("active");
        dash.style.display = "block";
    }

    const navLinks = document.getElementById("landing-nav-links");
    const flowBar = document.getElementById("pipeline-flow-bar");
    if (navLinks) navLinks.style.display = "none";
    if (flowBar) flowBar.style.display = "flex";

    updateNavbarAuthUI();
    loadStudentDashboardData();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function refreshStudentDashboard() {
    loadStudentDashboardData();
}

function showBlogPage() {
    hideAllViews();
    const blogView = document.getElementById("blog-page-view");
    if (blogView) {
        blogView.classList.add("active");
        blogView.style.display = "block";
    }

    const navLinks = document.getElementById("landing-nav-links");
    const flowBar = document.getElementById("pipeline-flow-bar");
    if (navLinks) navLinks.style.display = "flex";
    if (flowBar) flowBar.style.display = "none";

    updateNavbarAuthUI();
    loadBlogArticles(currentBlogCategory, currentBlogSearch);
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function openBlogPost(slug) {
    hideAllViews();
    const articleView = document.getElementById("blog-article-view");
    if (articleView) {
        articleView.classList.add("active");
        articleView.style.display = "block";
    }

    const navLinks = document.getElementById("landing-nav-links");
    const flowBar = document.getElementById("pipeline-flow-bar");
    if (navLinks) navLinks.style.display = "flex";
    if (flowBar) flowBar.style.display = "none";

    loadSingleBlogArticle(slug);
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function handleHeroStartClick() {
    if (activeStudent) {
        showStudentDashboard();
    } else {
        openAuthModal();
    }
}

function handleTopicCardClick(topicId) {
    if (!activeStudent) {
        alert("🔐 टॉपिक नोट्स और लाइव प्रैक्टिस देखने के लिए कृपया पहले लॉगिन करें!");
        openAuthModal();
        return;
    }

    const isVip = activeStudent.is_mentor || activeStudent.is_paid === 1 || activeStudent.subscription_status === 'active_vip';
    if (topicId > 1 && !isVip) {
        loadChapter(topicId);
        enterLearningPortal();
        openPaywallModal();
        return;
    }

    loadChapter(topicId);
    enterLearningPortal();
    switchPortalStep(1);
}

function updateNavbarAuthUI() {
    const loginBtn = document.getElementById("nav-btn-login");
    const profileWidget = document.getElementById("user-profile-widget");
    const vipNavBtn = document.getElementById("nav-btn-vip");

    const isVip = activeStudent && (activeStudent.is_mentor || activeStudent.is_paid === 1 || activeStudent.subscription_status === 'active_vip');

    if (activeStudent) {
        if (loginBtn) loginBtn.style.display = "none";
        if (vipNavBtn) vipNavBtn.style.display = isVip ? "none" : "inline-flex";
        if (profileWidget) {
            profileWidget.style.display = "flex";
            if (activeStudent.is_mentor) {
                profileWidget.style.borderColor = "var(--gold-glow)";
                profileWidget.style.boxShadow = "0 0 15px rgba(245, 158, 11, 0.4)";
            } else if (isVip) {
                profileWidget.style.borderColor = "#f59e0b";
                profileWidget.style.boxShadow = "0 0 10px rgba(245, 158, 11, 0.3)";
            } else {
                profileWidget.style.borderColor = "var(--card-border)";
                profileWidget.style.boxShadow = "none";
            }
        }
    } else {
        if (loginBtn) loginBtn.style.display = "block";
        if (vipNavBtn) vipNavBtn.style.display = "inline-flex";
        if (profileWidget) profileWidget.style.display = "none";
    }

    // Dynamic Topic Cards Button Text on Landing Page & Slider
    document.querySelectorAll(".topic-btn-auth").forEach((btn) => {
        const topicId = parseInt(btn.getAttribute("data-topic-id") || "1");
        if (topicId === 1) {
            btn.innerText = "🟢 Free Demo Class ➜";
            btn.style.background = "rgba(16, 185, 129, 0.15)";
            btn.style.borderColor = "#10b981";
            btn.style.color = "#6ee7b7";
        } else if (activeStudent) {
            if (isVip) {
                btn.innerText = `👑 Open Topic ${topicId} ➜`;
                btn.style.background = "linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(0, 240, 255, 0.25) 100%)";
                btn.style.borderColor = "var(--gold-glow)";
                btn.style.color = "#fff";
            } else {
                btn.innerText = `🔒 Unlock VIP (₹299) ➜`;
                btn.style.background = "linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.2) 100%)";
                btn.style.borderColor = "#f59e0b";
                btn.style.color = "#fde68a";
            }
        } else {
            btn.innerText = "🔒 Login to Unlock ➜";
            btn.style.background = "rgba(255, 255, 255, 0.04)";
            btn.style.borderColor = "rgba(255, 255, 255, 0.1)";
            btn.style.color = "#cbd5e1";
        }
    });
}

// ==============================================================================
// 4. PERSISTENT SESSION & AUTHENTICATION (PHONE + OTP)
// ==============================================================================
function checkActiveSession() {
    const saved = localStorage.getItem("python_sikho_student");
    if (saved) {
        try {
            const student = JSON.parse(saved);
            setActiveStudent(student);
            
            // Refresh student data from backend
            fetch(`/api/auth/student/${student.id}`)
                .then(r => r.json())
                .then(data => {
                    if (data && data.user) {
                        setActiveStudent(data.user);
                        localStorage.setItem("python_sikho_student", JSON.stringify(data.user));
                    }
                })
                .catch(() => {});
            
            showLandingPage();
            return;
        } catch (e) {
            localStorage.removeItem("python_sikho_student");
        }
    }
    setActiveStudent(null);
    showLandingPage();
}

function setActiveStudent(student) {
    activeStudent = student;
    updateNavbarAuthUI();
    populateSmartNotes();
    renderTopicQuickBar();

    if (!student) {
        return;
    }

    // Compute student initials
    const initials = student.name
        .split(" ")
        .map(n => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "ST";

    // Calculate Student Mastery Level
    const xp = student.xp_points || 100;
    let levelText = "🛡️ Level: Python Beginner";
    if (xp >= 800) {
        levelText = "👑 Level: Python Grandmaster";
    } else if (xp >= 500) {
        levelText = "🧙 Level: Python Knight";
    } else if (xp >= 250) {
        levelText = "⚔️ Level: Python Apprentice";
    }

    // Top Navbar
    const navName = document.getElementById("nav-user-name");
    const navCity = document.getElementById("nav-user-city");
    const navXp = document.getElementById("user-xp");
    const navStreak = document.getElementById("user-streak");
    const navInitials = document.getElementById("nav-user-initials");

    if (navName) navName.innerText = student.name;
    if (navCity) navCity.innerText = (student.city || "Kuchaman City") + " ▾";
    if (navXp) navXp.innerText = xp;
    if (navStreak) navStreak.innerText = student.streak_days || 1;
    if (navInitials) navInitials.innerText = initials;

    // Portal Student Mastery Banner
    const pName = document.getElementById("portal-student-name");
    const pStreak = document.getElementById("portal-student-streak");
    const pXp = document.getElementById("portal-student-xp");
    const pLevel = document.getElementById("portal-student-level");

    if (pName) pName.innerText = student.name;
    if (pStreak) pStreak.innerText = student.streak_days || 1;
    if (pXp) pXp.innerText = xp;
    if (pLevel) pLevel.innerText = levelText;

    // VIP Badge in Mastery Banner
    const vipWrap = document.getElementById("portal-vip-badge-container");
    const isVip = student.is_mentor || student.is_paid === 1 || student.subscription_status === 'active_vip';
    if (vipWrap) {
        if (student.is_mentor) {
            vipWrap.innerHTML = `<span class="vip-active-pill">👑 Chief Mentor Master Access</span>`;
        } else if (isVip) {
            vipWrap.innerHTML = `<span class="vip-active-pill">👑 VIP Lifetime Member (All 12 Topics Unlocked)</span>`;
        } else if (student.subscription_status === 'pending_approval') {
            vipWrap.innerHTML = `<span class="vip-active-pill" style="border-color:#f59e0b; color:#fde68a;" onclick="openPaywallModal()">⏳ VIP Verification Pending (₹299 Paid) 🔍</span>`;
        } else {
            vipWrap.innerHTML = `<button class="btn-vip-banner-upgrade" onclick="openPaywallModal()">👑 Topic 1 Free Demo • Unlock 12 Topics @ ₹299 ➜</button>`;
        }
    }

    // Profile Dropdown
    const dName = document.getElementById("dropdown-name");
    const dPhone = document.getElementById("dropdown-phone");
    const dXp = document.getElementById("dropdown-xp");
    const dStreak = document.getElementById("dropdown-streak");
    const dInitials = document.getElementById("dropdown-user-initials");

    if (dName) dName.innerText = student.name;
    if (dPhone) dPhone.innerText = `📱 +91 ${student.phone} (${student.city || 'Kuchaman City'})`;
    if (dXp) dXp.innerText = `${xp} XP`;
    if (dStreak) dStreak.innerText = `${student.streak_days || 1} Day Streak`;
    if (dInitials) dInitials.innerText = initials;

    // Certificate
    const certName = document.getElementById("cert-student-name");
    const certNum = document.getElementById("cert-number-display");
    if (certName) certName.innerText = student.name.toUpperCase();
    if (certNum) certNum.innerText = `PS-2026-${String(student.id).padStart(4, '0')}`;

    // Fetch and render student course progress
    fetchStudentProgress();
}

// 4.1 Auth Modal Controls
function openAuthModal() {
    const modal = document.getElementById("auth-modal");
    if (modal) {
        modal.style.display = "flex";
        resetAuthPhase();
        setTimeout(() => {
            const input = document.getElementById("input-phone");
            if (input) input.focus();
        }, 100);
    }
}

function closeAuthModal() {
    const modal = document.getElementById("auth-modal");
    if (modal) {
        modal.style.display = "none";
    }
}

// 4.2 Send OTP
async function sendOtp() {
    const phoneInput = document.getElementById("input-phone");
    const phone = phoneInput.value.trim().replace(/\D/g, "");

    // Strict 10-digit Indian Mobile validation
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
        alert("⚠️ कृपया 10-अंकों का मान्य भारतीय मोबाइल नंबर दर्ज करें (उदा. 9509934266, जो 6, 7, 8 या 9 से शुरू हो)!");
        phoneInput.focus();
        return;
    }

    const btn = document.getElementById("btn-send-otp");
    btn.disabled = true;
    btn.innerText = "⏳ Sending OTP to SIM...";

    try {
        const res = await fetch("/api/auth/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: phone })
        });
        const data = await res.json();

        if (data.success) {
            sentPhoneNumber = phone;
            document.getElementById("display-sent-phone").innerText = `+91 ${phone}`;
            
            // Set WhatsApp backup link
            const waBtn = document.getElementById("btn-auth-wa-otp");
            if (waBtn && data.whatsapp_otp_url) {
                waBtn.href = data.whatsapp_otp_url;
            }

            // Update OTP status banner dynamically
            const statusBox = document.getElementById("secure-otp-status");
            if (statusBox) {
                if (data.sms_sent) {
                    statusBox.style.background = "rgba(16, 185, 129, 0.12)";
                    statusBox.style.borderColor = "rgba(16, 185, 129, 0.35)";
                    statusBox.innerHTML = `
                        <div style="font-weight: 800; color: #34d399; margin-bottom: 3px;">✅ OTP आपके मोबाइल पर SMS द्वारा भेजा गया है!</div>
                        <div style="color: #a7f3d0; font-size: 11px;">कृपया अपने मोबाइल (+91 ${phone}) के SMS इनबॉक्स में आया 4-अंकों का गुप्त कोड नीचे दर्ज करें।</div>
                    `;
                } else {
                    const fallbackCode = data.fallback_otp || "9509";
                    statusBox.style.background = "rgba(245, 158, 11, 0.15)";
                    statusBox.style.borderColor = "rgba(245, 158, 11, 0.4)";
                    statusBox.innerHTML = `
                        <div style="font-weight: 800; color: #f59e0b; margin-bottom: 4px;">⚠️ Fast2SMS Key Disabled (SMS सिम पर नहीं पहुँचा)</div>
                        <div style="color: #fde68a; font-size: 12px; margin-bottom: 6px;">
                            परीक्षण लॉगिन हेतु OTP कोड: <strong style="font-size: 16px; color: #fff; background: rgba(0,0,0,0.5); padding: 2px 8px; border-radius: 4px; letter-spacing: 2px; font-family: monospace;">${fallbackCode}</strong>
                        </div>
                        <button type="button" onclick="autoFillOtp('${fallbackCode}')" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #000; border: none; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 800; cursor: pointer;">
                            ⚡ Auto-Fill This OTP (${fallbackCode})
                        </button>
                    `;
                }
            }

            // If user already registered, prefill name and city
            if (data.is_registered && data.existing_user) {
                document.getElementById("input-student-name").value = data.existing_user.name;
                document.getElementById("input-student-city").value = data.existing_user.city || "Kuchaman City";
            } else {
                document.getElementById("input-student-name").value = "";
                document.getElementById("input-student-city").value = "Kuchaman City";
            }

            // Switch to OTP Phase
            document.getElementById("auth-phase-phone").classList.remove("active");
            document.getElementById("auth-phase-otp").classList.add("active");

            clearOtpBoxes();
            setTimeout(() => {
                document.getElementById("otp-1").focus();
            }, 100);

            startResendCountdown();
        } else {
            alert(data.message || "OTP भेजने में त्रुटि हुई!");
        }
    } catch (e) {
        alert("Network Error: " + e);
    } finally {
        btn.disabled = false;
        btn.innerText = "📩 Send OTP (ओटीपी प्राप्त करें) →";
    }
}

function autoFillOtp(code) {
    if (!code || code.length !== 4) return;
    for (let i = 1; i <= 4; i++) {
        const box = document.getElementById(`otp-${i}`);
        if (box) box.value = code[i - 1];
    }
    const nameInput = document.getElementById("input-student-name");
    if (nameInput && !nameInput.value.trim()) {
        nameInput.focus();
    }
}

function focusNextOtp(current, nextId) {
    if (current.value.length >= 1 && nextId) {
        const nextElem = document.getElementById(nextId);
        if (nextElem) nextElem.focus();
    }
}

function clearOtpBoxes() {
    for (let i = 1; i <= 4; i++) {
        const box = document.getElementById(`otp-${i}`);
        if (box) box.value = "";
    }
}

function resetAuthPhase() {
    stopResendCountdown();
    document.getElementById("auth-phase-otp").classList.remove("active");
    document.getElementById("auth-phase-phone").classList.add("active");
}

function startResendCountdown() {
    stopResendCountdown();
    let seconds = 45;
    const countSpan = document.getElementById("resend-countdown");
    const resendBtn = document.getElementById("btn-resend-otp");
    const timerText = document.getElementById("otp-timer-text");
    
    if (resendBtn) resendBtn.disabled = true;
    if (timerText) timerText.innerHTML = `Resend in <strong id="resend-countdown">${seconds}</strong>s`;

    resendTimerInterval = setInterval(() => {
        seconds--;
        const curCount = document.getElementById("resend-countdown");
        if (curCount) curCount.innerText = seconds;
        if (seconds <= 0) {
            stopResendCountdown();
            if (resendBtn) resendBtn.disabled = false;
            if (timerText) timerText.innerText = "OTP प्राप्त नहीं हुआ?";
        }
    }, 1000);
}

function stopResendCountdown() {
    if (resendTimerInterval) {
        clearInterval(resendTimerInterval);
        resendTimerInterval = null;
    }
}

async function resendOtp() {
    if (!sentPhoneNumber) return;
    const resendBtn = document.getElementById("btn-resend-otp");
    resendBtn.disabled = true;
    resendBtn.innerText = "Sending...";

    try {
        const res = await fetch("/api/auth/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: sentPhoneNumber })
        });
        const data = await res.json();
        if (data.success) {
            const waBtn = document.getElementById("btn-auth-wa-otp");
            if (waBtn && data.whatsapp_otp_url) {
                waBtn.href = data.whatsapp_otp_url;
            }
            const statusBox = document.getElementById("secure-otp-status");
            if (statusBox) {
                if (data.sms_sent) {
                    statusBox.innerHTML = `
                        <div style="font-weight: 800; color: #34d399; margin-bottom: 3px;">✅ नया OTP SMS भेजा गया है!</div>
                        <div style="color: #a7f3d0; font-size: 11px;">कृपया अपने SMS इनबॉक्स में आया कोड दर्ज करें।</div>
                    `;
                } else {
                    const fallbackCode = data.fallback_otp || "9509";
                    statusBox.innerHTML = `
                        <div style="font-weight: 800; color: #f59e0b; margin-bottom: 4px;">⚠️ Fast2SMS Key Inactive (नया परीक्षण OTP)</div>
                        <div style="color: #fde68a; font-size: 12px; margin-bottom: 6px;">
                            नया कोड: <strong style="font-size: 16px; color: #fff; background: rgba(0,0,0,0.5); padding: 2px 8px; border-radius: 4px; font-family: monospace;">${fallbackCode}</strong>
                        </div>
                        <button type="button" onclick="autoFillOtp('${fallbackCode}')" style="background: #f59e0b; color: #000; border: none; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 800; cursor: pointer;">
                            ⚡ Auto-Fill Code (${fallbackCode})
                        </button>
                    `;
                }
            }
            clearOtpBoxes();
            startResendCountdown();
            document.getElementById("otp-1").focus();
        } else {
            alert(data.message || "OTP भेजने में त्रुटि हुई!");
        }
    } catch (e) {
        alert("Error: " + e);
    } finally {
        resendBtn.innerText = "🔄 Resend OTP";
    }
}

// 4.3 Verify OTP & Launch
async function verifyAndRegisterStudent() {
    const o1 = document.getElementById("otp-1")?.value || "";
    const o2 = document.getElementById("otp-2")?.value || "";
    const o3 = document.getElementById("otp-3")?.value || "";
    const o4 = document.getElementById("otp-4")?.value || "";
    const otp = `${o1}${o2}${o3}${o4}`.trim();

    if (otp.length !== 4) {
        alert("⚠️ कृपया अपने फ़ोन पर आया 4-अंकों का सही OTP दर्ज करें!");
        return;
    }

    const name = document.getElementById("input-student-name")?.value.trim() || "";
    const city = document.getElementById("input-student-city")?.value.trim() || "Kuchaman City";

    if (!name) {
        alert("⚠️ कृपया अपना पूरा नाम (Full Name) दर्ज करें!");
        document.getElementById("input-student-name")?.focus();
        return;
    }

    const btn = document.getElementById("btn-verify-otp");
    btn.disabled = true;
    btn.innerText = "⏳ Verifying with Server...";

    try {
        const res = await fetch("/api/auth/verify-and-register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                phone: sentPhoneNumber,
                otp: otp,
                name: name,
                city: city
            })
        });
        const data = await res.json();

        if (data.success && data.user) {
            localStorage.setItem("python_sikho_student", JSON.stringify(data.user));
            setActiveStudent(data.user);
            closeAuthModal();

            alert(`🎉 बधाई हो ${data.user.name}! \n\nपाइथन सीखो में आपका स्वागत है। आपका मोबाइल नंबर सत्यापित हो गया है!\nरोहित सर के मार्गदर्शन में आपकी कोडिंग यात्रा शुरू होती है!`);

            enterLearningPortal();
        } else {
            alert(data.message || "❌ अमान्य OTP कोड! कृपया दोबारा प्रयास करें।");
            clearOtpBoxes();
            document.getElementById("otp-1")?.focus();
        }
    } catch (e) {
        alert("Network Error: " + e);
    } finally {
        btn.disabled = false;
        btn.innerText = "🚀 Verify & Start Python Sikho (+100 XP) →";
    }
}

// 4.4 Logout
function logoutStudent() {
    if (confirm("क्या आप वाकई Python Sikho से लॉगआउट करना चाहते हैं?")) {
        localStorage.removeItem("python_sikho_student");
        activeStudent = null;
        setActiveStudent(null);
        toggleProfileDropdown(false);
        showLandingPage();
    }
}

// 4.5 Dropdown Menu
function toggleProfileDropdown(forceState) {
    const dropdown = document.getElementById("profile-dropdown");
    if (!dropdown) return;

    if (typeof forceState === "boolean") {
        dropdown.classList.toggle("active", forceState);
    } else {
        dropdown.classList.toggle("active");
    }
}

function setupDropdownCloseListener() {
    document.addEventListener("click", (e) => {
        const widget = document.getElementById("user-profile-widget");
        const dropdown = document.getElementById("profile-dropdown");
        if (widget && dropdown && !widget.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove("active");
        }
    });
}

// ==============================================================================
// 5. LANDING PAGE LIVE PLAYGROUND TEASER
// ==============================================================================
async function runLandingDemoCode() {
    const code = document.getElementById("landing-code-box")?.value || "";
    const term = document.getElementById("landing-terminal-output");
    const badge = document.getElementById("landing-exec-badge");

    if (term) {
        term.innerText = "⏳ Executing Python script...";
        term.style.color = "var(--cyan-glow)";
    }
    if (badge) badge.innerText = "Running...";

    try {
        const res = await fetch("/api/sandbox/run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: code, stdin: "" })
        });
        const result = await res.json();

        if (term && badge) {
            if (result.success) {
                term.style.color = "#a7f3d0";
                term.innerText = `>>> Output:\n${result.output}`;
                badge.innerText = `⚡ ${result.execution_time_ms} ms (Success)`;
            } else {
                term.style.color = "#fca5a5";
                term.innerText = `>>> Error Output:\n${result.error}\n${result.output || ''}`;
                badge.innerText = `❌ Error`;
            }
        }
    } catch (e) {
        if (term) term.innerText = `Execution Error: ${e}`;
    }
}

// ==============================================================================
// 6. STUDENT LEARNING PORTAL (6 INTERACTIVE PIPELINE STEPS)
// ==============================================================================
function switchPortalStep(stepNum) {
    if (!activeStudent) {
        alert("🔐 कृपया पहले अपने 10-अंकों के मोबाइल नंबर से लॉगिन करें!");
        openAuthModal();
        return;
    }

    currentPortalStep = stepNum;

    // Stop audio reading if active
    if (window.speechSynthesis && isSpeakingNotes) {
        window.speechSynthesis.cancel();
        isSpeakingNotes = false;
        const btn = document.getElementById("btn-audio-notes");
        if (btn) {
            btn.classList.remove("speaking");
            btn.innerHTML = "🔊 Listen (हिंदी में सुनें)";
        }
    }

    // Manage Quiz Timer on Step 3 (Topic Quiz)
    if (stepNum === 3) {
        startQuizTimer();
    } else {
        stopQuizTimer();
    }

    // Update portal step sections
    document.querySelectorAll(".portal-step-section").forEach((sec, idx) => {
        sec.classList.toggle("active", (idx + 1) === stepNum);
    });

    // Update top chips
    document.querySelectorAll(".pipeline-flow-bar .step-chip").forEach((chip, idx) => {
        chip.classList.toggle("active", (idx + 1) === stepNum);
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
}

// 6.1 Topics (Chapters) Navigation
async function fetchChapters() {
    try {
        const res = await fetch("/api/chapters");
        allChapters = await res.json();
        renderTopicQuickBar();
    } catch (e) {
        console.error("Error loading chapters:", e);
    }
}

function renderTopicQuickBar() {
    const container = document.getElementById("topic-chips-container");
    if (!container) return;
    container.innerHTML = "";

    const shortLabels = [
        "1. Intro (Demo)",
        "2. Data Types",
        "3. Variables & Rules",
        "4. Operators (7 Types)",
        "5. Conditionals",
        "6. Lists",
        "7. Tuples",
        "8. Sets",
        "9. Dictionaries",
        "10. Loops (for/while)",
        "11. Functions & Lambda",
        "12. Strings & f-strings"
    ];

    const isVip = activeStudent && (activeStudent.is_mentor || activeStudent.is_paid === 1 || activeStudent.subscription_status === 'active_vip');

    allChapters.forEach((ch, idx) => {
        const chip = document.createElement("button");
        const isDemo = (ch.chapter_no === 1 || ch.id === 1);
        const isLocked = !isDemo && !isVip;

        chip.className = `topic-nav-chip ${ch.id === currentChapterId ? 'active' : ''} ${isLocked ? 'locked-chip' : ''}`;
        chip.id = `topic-chip-${ch.id}`;
        
        let label = shortLabels[idx] || `Topic ${ch.chapter_no}`;
        if (isDemo) {
            label = `🟢 ${label}`;
        } else if (isLocked) {
            label = `🔒 ${label}`;
        }

        chip.innerText = label;
        chip.title = isLocked ? `${ch.title} (VIP Locked ₹299)` : ch.title;
        chip.onclick = async () => {
            await loadChapter(ch.id);
        };
        container.appendChild(chip);
    });
}

function updateActiveTopicChip(chapterId) {
    document.querySelectorAll(".topic-nav-chip").forEach(chip => chip.classList.remove("active"));
    const activeChip = document.getElementById(`topic-chip-${chapterId}`);
    if (activeChip) activeChip.classList.add("active");
}

async function loadChapter(chapterId) {
    currentChapterId = chapterId;
    updateActiveTopicChip(chapterId);

    try {
        const uid = activeStudent ? activeStudent.id : '';
        const res = await fetch(`/api/chapters/${chapterId}/content?user_id=${uid}`);
        currentChapterData = await res.json();
        
        populateSmartNotes();
        populateCodeSandbox();
        populateQuiz();
        populateProjects();
    } catch (e) {
        console.error("Error loading chapter content:", e);
    }
}

// 6.2 Step 1: Smart Notes & Cheatsheet
function populateSmartNotes() {
    if (!currentChapterData) return;
    const ch = currentChapterData.chapter;
    const notes = currentChapterData.notes;

    const badge = document.getElementById("notes-ch-badge");
    if (badge) badge.innerText = `Topic ${ch.chapter_no} Notes`;
    
    const title = document.getElementById("notes-title");
    if (title) title.innerText = `Smart Notes: ${ch.title}`;

    const box = document.getElementById("notes-content-box");
    if (!box) return;

    if (!activeStudent) {
        box.innerHTML = `
            <div class="locked-content-card">
                <div class="lock-shield-icon">🔒</div>
                <h2 style="color: #fff; font-size: 22px; font-weight: 800; margin: 12px 0 6px;">पाइथन सीखो नोट्स लॉक हैं (Login Required)</h2>
                <p style="color: var(--text-muted); font-size: 14px; max-width: 520px; margin: 0 auto 20px; line-height: 1.6;">
                    चीफ मेंटर <strong>रोहित सर (सम्यक क्लासेज, कुचामन सिटी)</strong> के इन-डेप्थ स्मार्ट नोट्स, रियल-वर्ल्ड कोड उदाहरण और ऑडियो सुनने के लिए कृपया अपने मोबाइल नंबर से लॉगिन करें।
                </p>
                <button class="btn-primary-glow btn-hero-lg" onclick="openAuthModal()">
                    🔐 Login with Mobile OTP (+100 Welcome XP) →
                </button>
            </div>
        `;
        return;
    }

    if (currentChapterData.is_locked) {
        box.innerHTML = `
            <div class="locked-content-card" style="border-color: rgba(245, 158, 11, 0.6); box-shadow: 0 0 35px rgba(245, 158, 11, 0.25);">
                <div class="lock-shield-icon" style="color: var(--gold-glow);">👑</div>
                <h2 style="color: #fff; font-size: 22px; font-weight: 900; margin: 12px 0 6px;">Topic #${ch.chapter_no}: ${ch.title} (VIP Locked)</h2>
                <p style="color: var(--text-muted); font-size: 14px; max-width: 550px; margin: 0 auto 20px; line-height: 1.6;">
                    <strong>Topic 1 (Python Introduction)</strong> सभी छात्रों के लिए 100% फ्री डेमो क्लास है।<br>
                    <strong>Topic 2 से 12 तक के सभी इन-डेप्थ नोट्स, 100+ लाइव कोडिंग सैंडबॉक्स चैलेंज, क्विज़ और वेरिफाइड सर्टिफ़िकेट</strong> अनलॉक करने के लिए VIP मेंबरशिप (₹299) अनलॉक करें!
                </p>
                <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
                    <button class="btn-primary-glow btn-hero-lg" onclick="openPaywallModal()" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #000; font-weight: 900;">
                        👑 Unlock VIP Course @ ₹299 (Scan UPI QR) →
                    </button>
                    <button class="btn-secondary btn-hero-lg" onclick="loadChapter(1); switchPortalStep(1);">
                        🟢 Open Free Demo Class (Topic 1)
                    </button>
                </div>
            </div>
            <div style="margin-top: 24px; opacity: 0.65;">
                ${formatMarkdownToHtml(notes.content_markdown || '')}
            </div>
        `;
        return;
    }

    const md = notes.content_markdown || "# Notes Loading...";
    box.innerHTML = formatMarkdownToHtml(md);
}

function printNotes() {
    window.print();
}

function copySnippet(btn, codeText) {
    navigator.clipboard.writeText(decodeURIComponent(codeText)).then(() => {
        const orig = btn.innerText;
        btn.innerText = "✅ Copied!";
        setTimeout(() => { btn.innerText = orig; }, 2000);
    });
}

function tryCodeInSandbox(encodedCode) {
    const code = decodeURIComponent(encodedCode);
    const editor = document.getElementById("python-code-editor");
    if (editor) {
        editor.value = code;
    }
    switchPortalStep(2);
    executeSandboxCode();
}

// Audio Reader for Hindi / English Notes
let isSpeakingNotes = false;
function toggleAudioReader() {
    const btn = document.getElementById("btn-audio-notes");
    if (!window.speechSynthesis) {
        alert("⚠️ आपके ब्राउज़र में Text-to-Speech सपोर्ट उपलब्ध नहीं है।");
        return;
    }

    if (isSpeakingNotes || window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        isSpeakingNotes = false;
        if (btn) {
            btn.classList.remove("speaking");
            btn.innerHTML = "🔊 Listen (हिंदी में सुनें)";
        }
        return;
    }

    const notesBox = document.getElementById("notes-content-box");
    if (!notesBox) return;

    // Clean text for speech
    const rawText = notesBox.innerText || "";
    const cleanText = rawText
        .replace(/[#*`_{}\[\]]/g, " ")
        .replace(/PYTHON\s+📋 Copy Code/g, "")
        .replace(/⚡ Try in Sandbox/g, "")
        .replace(/\n+/g, ". ")
        .substring(0, 2000);

    if (!cleanText.trim()) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "hi-IN";
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const hiVoice = voices.find(v => v.lang.includes("hi") || v.name.toLowerCase().includes("hindi") || v.lang.includes("IN"));
    if (hiVoice) {
        utterance.voice = hiVoice;
    }

    utterance.onstart = () => {
        isSpeakingNotes = true;
        if (btn) {
            btn.classList.add("speaking");
            btn.innerHTML = "⏹️ Stop Audio (रोकें)";
        }
    };

    utterance.onend = utterance.onerror = () => {
        isSpeakingNotes = false;
        if (btn) {
            btn.classList.remove("speaking");
            btn.innerHTML = "🔊 Listen (हिंदी में सुनें)";
        }
    };

    window.speechSynthesis.speak(utterance);
}

// Student Course Progress & Topic Completion
async function markCurrentTopicCompleted() {
    if (!activeStudent) {
        alert("🔐 कृपया पहले लॉगिन करें!");
        openAuthModal();
        return;
    }

    try {
        const res = await fetch("/api/student/complete-topic", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: activeStudent.id,
                chapter_id: currentChapterId
            })
        });
        const data = await res.json();
        if (data.status === "success") {
            if (data.user) {
                activeStudent = data.user;
                localStorage.setItem("python_sikho_student", JSON.stringify(activeStudent));
                setActiveStudent(activeStudent);
            }
            alert(`🎉 शानदार! Topic #${currentChapterId} सफलतापूर्वक पूरा कर लिया गया!\n\nआपको +${data.xp_added || 50} XP पॉइंट्स मिले! 🔥`);
            renderProgressData(data);
        }
    } catch (e) {
        alert("Error completing topic: " + e);
    }
}

async function fetchStudentProgress() {
    if (!activeStudent) return;
    try {
        const res = await fetch(`/api/student/progress/${activeStudent.id}`);
        const data = await res.json();
        if (data.status === "success") {
            renderProgressData(data);
        }
    } catch (e) {}
}

function renderProgressData(data) {
    const countElem = document.getElementById("progress-topics-count");
    const pctElem = document.getElementById("progress-topics-pct");
    const fillElem = document.getElementById("course-progress-fill");

    if (countElem) countElem.innerText = data.completed_count || 0;
    if (pctElem) pctElem.innerText = `${data.progress_pct || 0}%`;
    if (fillElem) fillElem.style.width = `${data.progress_pct || 0}%`;

    // Mark completed chips in quick bar
    const completed = data.completed_chapters || [];
    document.querySelectorAll(".topic-nav-chip").forEach((chip, idx) => {
        const chId = idx + 1;
        if (completed.includes(chId)) {
            chip.classList.add("completed");
        } else {
            chip.classList.remove("completed");
        }
    });
}

function setupSandboxKeyShortcuts() {
    document.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            const editor = document.getElementById("python-code-editor");
            if (document.activeElement === editor || currentPortalStep === 2) {
                e.preventDefault();
                executeSandboxCode();
            }
        }
    });
}

function formatMarkdownToHtml(md) {
    if (!md) return "";
    let html = md
        .replace(/^### (.*$)/gim, '<h3 style="color: var(--cyan-glow); margin: 14px 0 6px; font-size: 15px;">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 style="color: var(--gold-glow); margin: 18px 0 8px; font-size: 17px;">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 style="color: var(--cyan-glow); margin: 20px 0 10px; font-size: 20px;">$1</h1>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong style="color:#fff;">$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em style="color:#cbd5e1;">$1</em>')
        .replace(/`([^`]+)`/gim, '<code style="background: rgba(0,240,255,0.15); color:#00f0ff; padding:2px 6px; border-radius:4px; font-family:monospace; font-size:11px;">$1</code>');

    html = html.replace(/```python([\s\S]*?)```/gim, function(match, p1) {
        const encoded = encodeURIComponent(p1.trim());
        return `<div class="code-block-wrapper"><div class="code-block-header"><span>PYTHON</span><div><button class="btn-try-code" onclick="tryCodeInSandbox('${encoded}')">⚡ Try in Sandbox</button><button class="btn-copy-code" onclick="copySnippet(this, '${encoded}')">📋 Copy Code</button></div></div><pre><code>${p1.trim()}</code></pre></div>`;
    });

    html = html.replace(/```([\s\S]*?)```/gim, function(match, p1) {
        const encoded = encodeURIComponent(p1.trim());
        return `<div class="code-block-wrapper"><div class="code-block-header"><span>CODE</span><div><button class="btn-try-code" onclick="tryCodeInSandbox('${encoded}')">⚡ Try in Sandbox</button><button class="btn-copy-code" onclick="copySnippet(this, '${encoded}')">📋 Copy Code</button></div></div><pre><code>${p1.trim()}</code></pre></div>`;
    });

    return html.replace(/\n/gim, '<br>');
}

// 6.3 Step 2: Practice Sandbox
function populateCodeSandbox() {
    if (!currentChapterData) return;
    const ch = currentChapterData.chapter;
    const prac = currentChapterData.practice;

    const badge = document.getElementById("practice-ch-badge");
    if (badge) badge.innerText = `Topic ${ch.chapter_no} Practice`;
    
    const heading = document.getElementById("practice-main-heading");
    if (heading) heading.innerText = `💻 ${prac.title || 'Live Python Practice Arena'}`;

    const editor = document.getElementById("python-code-editor");
    if (editor) editor.value = prac.starter_code || 'print("नमस्ते Python Sikho!")';

    const inst = document.getElementById("instruction-text");
    if (inst) inst.innerText = prac.instructions || "Write and run your code.";

    const term = document.getElementById("terminal-output");
    if (term) term.innerText = "Click 'RUN CODE' to execute your Python script...";

    const execBadge = document.getElementById("exec-time-badge");
    if (execBadge) execBadge.innerText = "Ready";

    const stdin = document.getElementById("sandbox-stdin-input");
    if (stdin) stdin.value = "";
}

function resetStarterCode() {
    if (currentChapterData && currentChapterData.practice) {
        document.getElementById("python-code-editor").value = currentChapterData.practice.starter_code;
        document.getElementById("sandbox-stdin-input").value = "";
    }
}

function sendEditorCodeToAi() {
    const code = document.getElementById("python-code-editor")?.value || "";
    const drawer = document.getElementById("ai-drawer");
    if (drawer && !drawer.classList.contains("active")) {
        drawer.classList.add("active");
    }
    const input = document.getElementById("ai-user-query");
    if (input) {
        input.value = "इस Python कोड को समझाइए और यदि कोई त्रुटि (Error) है तो सही करके बताइए:";
        sendAiQuery();
    }
}

async function executeSandboxCode() {
    const code = document.getElementById("python-code-editor")?.value || "";
    const stdinVal = document.getElementById("sandbox-stdin-input")?.value || "";
    const term = document.getElementById("terminal-output");
    const badge = document.getElementById("exec-time-badge");

    if (term) {
        term.innerText = "⏳ Running Python code in sandbox...";
        term.style.color = "#00f0ff";
    }
    if (badge) badge.innerText = "Running...";

    try {
        const res = await fetch("/api/sandbox/run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                code: code,
                stdin: stdinVal ? (stdinVal + "\n") : ""
            })
        });
        const result = await res.json();

        if (term && badge) {
            if (result.success) {
                term.style.color = "#a7f3d0";
                term.innerText = `>>> Output:\n${result.output}`;
                badge.innerText = `⚡ ${result.execution_time_ms} ms (Success)`;
            } else {
                term.style.color = "#fca5a5";
                term.innerText = `>>> Error Output:\n${result.error}\n${result.output || ''}`;
                badge.innerText = `❌ Error`;
            }
        }
    } catch (e) {
        if (term) term.innerText = `Network/Execution Error: ${e}`;
    }
}

// 6.4 Step 3: Topic Quiz Arena & Timer
function startQuizTimer() {
    stopQuizTimer();
    quizSecondsLeft = 60;
    const timerElem = document.getElementById("quiz-timer-seconds");
    if (timerElem) timerElem.innerText = quizSecondsLeft;

    quizTimerInterval = setInterval(() => {
        quizSecondsLeft--;
        if (timerElem) timerElem.innerText = quizSecondsLeft;
        if (quizSecondsLeft <= 0) {
            stopQuizTimer();
            alert("⏱️ Time is up for Topic Quiz! Auto-submitting answers...");
            submitQuiz();
        }
    }, 1000);
}

function stopQuizTimer() {
    if (quizTimerInterval) {
        clearInterval(quizTimerInterval);
        quizTimerInterval = null;
    }
}

function populateQuiz() {
    if (!currentChapterData) return;
    const ch = currentChapterData.chapter;
    const quiz = currentChapterData.quiz;
    const container = document.getElementById("quiz-questions-container");
    const countDisplay = document.getElementById("quiz-count-display");
    const banner = document.getElementById("quiz-results-banner");

    const quizBadge = document.getElementById("quiz-ch-badge");
    if (quizBadge) quizBadge.innerText = `Topic ${ch.chapter_no} Quiz`;

    const quizHeader = document.getElementById("quiz-header-title");
    if (quizHeader) quizHeader.innerText = `❓ ${quiz.title || ch.title}`;

    if (banner) banner.style.display = "none";
    if (!container || !quiz.questions) return;
    container.innerHTML = "";
    if (countDisplay) countDisplay.innerText = `${quiz.questions.length} Questions`;

    quiz.questions.forEach((q, idx) => {
        const block = document.createElement("div");
        block.className = "quiz-q-block";
        block.innerHTML = `
            <div class="quiz-q-title">${idx + 1}. ${q.question_text}</div>
            <div class="quiz-options-grid">
                <label class="quiz-option-label">
                    <input type="radio" name="q_${q.id}" value="A" required>
                    <span>A) ${q.option_a}</span>
                </label>
                <label class="quiz-option-label">
                    <input type="radio" name="q_${q.id}" value="B" required>
                    <span>B) ${q.option_b}</span>
                </label>
                <label class="quiz-option-label">
                    <input type="radio" name="q_${q.id}" value="C" required>
                    <span>C) ${q.option_c}</span>
                </label>
                <label class="quiz-option-label">
                    <input type="radio" name="q_${q.id}" value="D" required>
                    <span>D) ${q.option_d}</span>
                </label>
            </div>
            <div id="quiz-expl-${q.id}" class="quiz-explanation-box" style="display: none;"></div>
        `;
        container.appendChild(block);
    });
}

async function submitQuiz(e) {
    if (e) e.preventDefault();
    stopQuizTimer();
    if (!currentChapterData || !currentChapterData.quiz) return;

    const quizId = currentChapterData.quiz.id;
    const answers = {};

    currentChapterData.quiz.questions.forEach(q => {
        const sel = document.querySelector(`input[name="q_${q.id}"]:checked`);
        if (sel) answers[q.id] = sel.value;
    });

    try {
        const studentId = activeStudent ? activeStudent.id : 1;
        const res = await fetch("/api/quiz/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: studentId,
                quiz_id: quizId,
                answers: answers
            })
        });

        const result = await res.json();
        const banner = document.getElementById("quiz-results-banner");
        if (banner) banner.style.display = "block";

        if (result.details) {
            result.details.forEach(d => {
                const explBox = document.getElementById(`quiz-expl-${d.question_id}`);
                if (explBox) {
                    explBox.style.display = "block";
                    explBox.className = `quiz-explanation-box ${d.is_correct ? 'correct' : 'wrong'}`;
                    explBox.innerHTML = `
                        <strong>${d.is_correct ? '✅ सही जवाब!' : '❌ गलत जवाब!'}</strong> 
                        सही उत्तर: <strong>Option ${d.correct_option}</strong><br>
                        <em>💡 स्पष्टीकरण:</em> ${d.explanation || 'रिव्यू के लिए टॉपिक नोट्स देखें।'}
                    `;
                }
            });
        }

        if (result.passed) {
            if (banner) {
                banner.innerHTML = `
                    <div style="background: rgba(16,185,129,0.15); border: 1px solid #10b981; padding: 18px; border-radius: 12px; margin-top: 14px; text-align: center;">
                        <h3 style="color: #10b981; font-size: 18px; margin-bottom: 4px;">🎉 PASSED! Score: ${result.score_pct}% (${result.correct_count}/${result.total_questions})</h3>
                        <p style="font-size: 12px; color: #fff;">You earned <strong>+${result.xp_earned} XP</strong>! Ready for Step 4 Projects 🚀</p>
                    </div>
                `;
            }
            if (activeStudent) {
                activeStudent.xp_points = (activeStudent.xp_points || 100) + result.xp_earned;
                document.getElementById("user-xp").innerText = activeStudent.xp_points;
                localStorage.setItem("python_sikho_student", JSON.stringify(activeStudent));
            }
        } else {
            if (banner) {
                banner.innerHTML = `
                    <div style="background: rgba(239,68,68,0.15); border: 1px solid #ef4444; padding: 18px; border-radius: 12px; margin-top: 14px; text-align: center;">
                        <h3 style="color: #ef4444; font-size: 18px; margin-bottom: 4px;">Score: ${result.score_pct}% (Needs 60% to pass)</h3>
                        <p style="font-size: 12px; color: #fff;">Review Smart Notes and try again!</p>
                    </div>
                `;
            }
        }
    } catch (err) {
        alert("Error submitting quiz: " + err);
    }
}

// 6.5 Step 4: Assignment Validate & Submission
function populateAssignment() {
    if (!currentChapterData) return;
    const ch = currentChapterData.chapter;
    const assign = currentChapterData.assignment;
    if (!assign) return;

    const badge = document.getElementById("assign-ch-badge");
    if (badge) badge.innerText = `Topic ${ch.chapter_no} Task`;

    const heading = document.getElementById("assignment-heading");
    if (heading) heading.innerText = assign.title || `Chapter ${ch.chapter_no} Assignment`;

    const problem = document.getElementById("assignment-problem-text");
    if (problem) problem.innerText = assign.problem_statement || "Solve coding task.";

    const codeBox = document.getElementById("assignment-code-box");
    if (codeBox) codeBox.value = assign.starter_code || "# Write solution here...";

    const testsBox = document.getElementById("assignment-tests-box");
    if (testsBox) testsBox.style.display = "none";
}

async function validateAssignmentCode() {
    const code = document.getElementById("assignment-code-box")?.value || "";
    const testsBox = document.getElementById("assignment-tests-box");
    const testsList = document.getElementById("assignment-tests-list");

    if (testsBox) testsBox.style.display = "block";
    if (testsList) testsList.innerHTML = "<div style='color: var(--cyan-glow); font-size: 12px;'>⏳ Running automated test cases against your code...</div>";

    try {
        const res = await fetch("/api/assignment/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                assignment_id: currentChapterData?.assignment?.id || 1,
                code: code
            })
        });
        const result = await res.json();
        
        if (testsList) {
            testsList.innerHTML = "";
            result.tests.forEach((t) => {
                const row = document.createElement("div");
                row.className = `test-case-row ${t.passed ? 'pass' : 'fail'}`;
                row.innerHTML = `
                    <div style="font-weight: 700; font-size: 12px; color: ${t.passed ? '#10b981' : '#ef4444'};">
                        ${t.passed ? '✅' : '❌'} ${t.name} - ${t.passed ? 'PASSED' : 'FAILED'}
                    </div>
                    <div style="font-family: monospace; font-size: 11px; color: var(--text-muted); margin-top: 4px;">
                        Output: ${t.output || 'No output'}
                    </div>
                `;
                testsList.appendChild(row);
            });
        }
    } catch (e) {
        if (testsList) testsList.innerHTML = `<div style="color: #ef4444;">Error running test cases: ${e}</div>`;
    }
}

async function submitAssignment() {
    const code = document.getElementById("assignment-code-box")?.value || "";
    const studentId = activeStudent ? activeStudent.id : 1;
    try {
        const res = await fetch("/api/assignment/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: studentId,
                assignment_id: currentChapterData?.assignment?.id || 1,
                submitted_code: code
            })
        });
        const result = await res.json();
        alert(result.message || "Assignment submitted successfully!");
        if (activeStudent) {
            activeStudent.xp_points = (activeStudent.xp_points || 100) + 100;
            document.getElementById("user-xp").innerText = activeStudent.xp_points;
            localStorage.setItem("python_sikho_student", JSON.stringify(activeStudent));
        }
        switchPortalStep(5); // Move to Projects
    } catch (e) {
        alert("Error submitting assignment: " + e);
    }
}

// 6.6 Step 5: Capstone Projects
function populateProjects() {
    if (!currentChapterData) return;
    const container = document.getElementById("projects-container");
    if (!container) return;
    container.innerHTML = "";

    const projects = currentChapterData.projects || [];
    projects.forEach(p => {
        const item = document.createElement("div");
        item.className = "project-item-card";
        item.innerHTML = `
            <div>
                <span class="active-badge-pill">Production Capstone</span>
                <h3 style="font-size: 16px; font-weight: 800; color: #fff; margin: 8px 0;">${p.title}</h3>
                <p style="font-size: 12px; color: var(--text-muted); line-height: 1.5; margin-bottom: 12px;">${p.description}</p>
                <div style="font-size: 11px; color: var(--cyan-glow); font-family: monospace; margin-bottom: 14px;">🛠️ Stack: ${p.tech_stack}</div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 12px; gap: 8px;">
                <button class="btn-secondary" onclick="downloadProjectStarter(${p.id})">📦 Download Starter (.zip)</button>
                <button class="btn-primary-glow" onclick="switchPortalStep(5)">Claim Certificate 🏆</button>
            </div>
        `;
        container.appendChild(item);
    });
}

function downloadProjectStarter(projectId) {
    window.location.href = `/api/projects/${projectId}/download`;
}

// 6.7 Step 6: Certificate Generation
function downloadCertificateImage() {
    const studentId = activeStudent ? activeStudent.id : 1;
    window.location.href = `/api/certificate/download/${studentId}`;
}

function shareCertificateWhatsApp() {
    const name = activeStudent ? activeStudent.name : "Student";
    const phone = activeStudent ? activeStudent.phone : "9509934266";
    const certNum = activeStudent ? `PS-2026-${String(activeStudent.id).padStart(4, '0')}` : "PS-2026-0001";

    const msg = `नमस्ते ${name}! 🎓\n\nहार्दिक बधाई! आपने रोहित सर *(सम्यक कम्प्यूटर क्लासेज, कुचामन सिटी)* के मार्गदर्शन में *Complete Python 3 Masterclass (Zero to Functions)* सफलतापूर्वक पूरा कर लिया है।\n\n🏆 *ग्रेड:* A+ Outstanding\n📜 *सर्टिफ़िकेट नंबर:* ${certNum}\n⭐ *चीफ मेंटर:* रोहित सर\n\nअपना डिजिटल सर्टिफ़िकेट देखने व डाउनलोड करने के लिए यहाँ क्लिक करें: http://127.0.0.1:5700\n\nसस्नेह,\n*रोहित सर*\n📞 9509934266`;

    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : "91" + cleanPhone;
    const waUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank");
}

// ==============================================================================
// 7. ROHIT SIR MENTOR ADMIN DASHBOARD ENGINE (PROTECTED WITH PIN)
// ==============================================================================
let cachedAdminStudents = [];

function openMentorAdminModal() {
    // ALWAYS require Rohit Sir's Master PIN / Password every single time!
    sessionStorage.removeItem("python_sikho_mentor_token");
    openMentorPinModal();
}

function openMentorPinModal() {
    const pinModal = document.getElementById("mentor-pin-modal");
    if (pinModal) {
        pinModal.style.display = "flex";
        const input = document.getElementById("input-mentor-pin");
        const err = document.getElementById("mentor-pin-error");
        if (err) err.style.display = "none";
        if (input) {
            input.value = "";
            setTimeout(() => input.focus(), 150);
        }
    }
}

function closeMentorPinModal() {
    const pinModal = document.getElementById("mentor-pin-modal");
    if (pinModal) {
        pinModal.style.display = "none";
    }
}

function toggleMentorPinVisibility() {
    const input = document.getElementById("input-mentor-pin");
    if (input) {
        input.type = input.type === "password" ? "text" : "password";
    }
}

async function verifyMentorPin(openPortalDirectly = false) {
    const input = document.getElementById("input-mentor-pin");
    const pin = input?.value.trim() || "";
    const err = document.getElementById("mentor-pin-error");
    const btn = document.getElementById("btn-verify-mentor-pin");

    if (!pin) {
        if (err) {
            err.innerText = "⚠️ कृपया अपना मेंटर मास्टर पिन / पासवर्ड दर्ज करें!";
            err.style.display = "block";
        }
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.innerText = "⏳ Verifying Master PIN...";
    }

    try {
        const res = await fetch("/api/admin/verify-pin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pin: pin })
        });
        const data = await res.json();

        if (data.success && data.token) {
            sessionStorage.setItem("python_sikho_mentor_token", data.token);
            closeMentorPinModal();

            if (openPortalDirectly) {
                activateChiefMentorMode();
            } else {
                const adminModal = document.getElementById("mentor-admin-modal");
                if (adminModal) {
                    adminModal.style.display = "flex";
                    switchAdminTab('students');
                }
            }
        } else {
            if (err) {
                err.innerText = "❌ अमान्य मेंटर पिन! यह पैनल केवल चीफ मेंटर रोहित सर के लिए सुरक्षित है।";
                err.style.display = "block";
            }
            if (input) {
                input.value = "";
                input.focus();
            }
        }
    } catch (e) {
        if (err) {
            err.innerText = "Network Error: " + e;
            err.style.display = "block";
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerText = "📊 Unlock Mentor Dashboard (छात्र डेटा देखें) →";
        }
    }
}

function activateChiefMentorMode() {
    const mentorUser = {
        id: 0,
        name: "Rohit Sir",
        phone: "9509934266",
        city: "Kuchaman City",
        is_mentor: true,
        xp_points: 9999,
        streak_days: 99
    };
    
    localStorage.setItem("python_sikho_student", JSON.stringify(mentorUser));
    activeStudent = mentorUser;
    setActiveStudent(mentorUser);

    closeMentorPinModal();
    closeMentorAdminModal();

    enterLearningPortal();
    switchPortalStep(1);

    alert("👑 स्वागत है रोहित सर! \n\nचीफ मेंटर मास्टर मोड एक्टिवेट हो गया है! अब आपके लिए बिना किसी OTP के पूरा पोर्टल (12 टॉपिक्स, नोट्स, सैंडबॉक्स, क्विज़ व सर्टिफ़िकेट्स) मास्टर एक्सेस के साथ अनलॉक है!");
}

function lockMentorAdminSession() {
    sessionStorage.removeItem("python_sikho_mentor_token");
    closeMentorAdminModal();
    alert("🔒 मेंटर एडमिन सेशन सुरक्षित रूप से लॉक कर दिया गया है।");
}

function closeMentorAdminModal() {
    sessionStorage.removeItem("python_sikho_mentor_token");
    const modal = document.getElementById("mentor-admin-modal");
    if (modal) {
        modal.style.display = "none";
    }
}

// ------------------------------------------------------------------------------
// LIVE ANNOUNCEMENT BANNER & DEDICATED PUBLIC NOTICE BOARD CONTROLS
// ------------------------------------------------------------------------------
let publicNoticesTimer = null;

async function loadPublicNotices(forceRefresh = false) {
    const feed = document.getElementById("notices-public-feed");
    if (!feed) return;

    if (forceRefresh) {
        feed.innerHTML = `
            <div class="notice-loading-state" style="grid-column: 1 / -1; text-align: center; padding: 20px; color: var(--cyan-glow);">
                <div class="cyber-spinner-sm" style="margin: 0 auto 8px;"></div>
                <span>🔄 ताज़ा नोटिस लोड हो रहे हैं...</span>
            </div>
        `;
    }

    try {
        const res = await fetch("/api/announcements");
        const data = await res.json();
        const notices = data.announcements || [];

        if (notices.length === 0) {
            feed.innerHTML = `
                <div class="notice-empty-card">
                    <span style="font-size: 28px; display: block; margin-bottom: 8px;">✨</span>
                    <strong style="color: #fff; font-size: 14px;">वर्तमान में कोई नया नोटिस नहीं है।</strong>
                    <p style="margin-top: 4px; font-size: 12px; color: var(--text-muted);">सम्यक कंप्यूटर क्लासेज में सभी कक्षाएं व ऑनलाइन लैब्स सामान्य समय अनुसार संचालित हैं।</p>
                </div>
            `;
            return;
        }

        feed.innerHTML = "";
        notices.forEach(n => {
            const isLive = n.is_active === 1;
            const categoryClass = n.type || "general";
            const typeNames = {
                test: "📝 LIVE TEST ANNOUNCEMENT",
                urgent: "🔴 URGENT IMPORTANT ALERT",
                general: "📢 BATCH NOTICE",
                holiday: "🎉 SCHEDULE / HOLIDAY UPDATE"
            };
            const label = typeNames[categoryClass] || "📢 NOTICE";

            const card = document.createElement("div");
            card.className = `notice-public-card ${categoryClass}`;
            card.innerHTML = `
                <div>
                    <div class="notice-card-top">
                        <span class="notice-category-badge ${categoryClass}">${label}</span>
                        ${isLive ? '<span class="notice-live-tag"><span class="live-pulse-dot" style="width: 6px; height: 6px;"></span> LIVE BROADCAST</span>' : '<span style="font-size: 10px; color: var(--text-muted);">ARCHIVE</span>'}
                    </div>
                    <div class="notice-card-msg">${n.message}</div>
                </div>
                <div class="notice-card-footer">
                    <span class="notice-author-tag">👑 Rohit Sir (Chief Mentor)</span>
                    <span>🕒 ${n.created_at ? n.created_at.substring(0, 16).replace("T", " ") : 'Today'}</span>
                </div>
            `;
            feed.appendChild(card);
        });
    } catch (e) {
        console.error("Error loading public notices:", e);
    }
}

async function fetchActiveAnnouncement() {
    loadPublicNotices(false);

    if (sessionStorage.getItem("python_sikho_announcement_dismissed") === "true") {
        return;
    }
    try {
        const res = await fetch("/api/announcements/active");
        const data = await res.json();
        const banner = document.getElementById("live-announcement-banner");
        if (data.has_active && data.announcement && banner) {
            const ann = data.announcement;
            const badge = document.getElementById("banner-announcement-badge");
            const text = document.getElementById("banner-announcement-text");
            const date = document.getElementById("banner-announcement-date");
            
            if (badge) {
                const typeMap = {
                    test: "📝 TEST ALERT",
                    urgent: "🔴 URGENT",
                    general: "📢 NOTICE",
                    holiday: "🎉 UPDATE"
                };
                badge.innerText = typeMap[ann.type] || "📢 NOTICE";
            }
            if (text) text.innerText = ann.message;
            if (date && ann.created_at) {
                date.innerText = `• ${ann.created_at.substring(0, 10)}`;
            }
            banner.style.display = "block";
        } else if (banner) {
            banner.style.display = "none";
        }
    } catch (e) {
        console.error("Error fetching active announcement:", e);
    }
}

function dismissAnnouncement() {
    const banner = document.getElementById("live-announcement-banner");
    if (banner) banner.style.display = "none";
    sessionStorage.setItem("python_sikho_announcement_dismissed", "true");
}

// ------------------------------------------------------------------------------
// SUPER ADMIN TABS NAVIGATION
// ------------------------------------------------------------------------------
function switchAdminTab(tabName) {
    document.querySelectorAll(".admin-tab-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".admin-tab-pane").forEach(pane => {
        pane.classList.remove("active");
        pane.style.display = "none";
    });

    const activeBtn = document.getElementById(`tab-btn-${tabName}`);
    const activePane = document.getElementById(`admin-pane-${tabName}`);

    if (activeBtn) activeBtn.classList.add("active");
    if (activePane) {
        activePane.classList.add("active");
        activePane.style.display = "block";
    }

    if (tabName === 'students') {
        loadAdminStudents();
    } else if (tabName === 'notices') {
        loadAdminAnnouncements();
    } else if (tabName === 'cms') {
        const topicSelect = document.getElementById("admin-cms-topic-select");
        loadAdminTopicCMS(topicSelect ? topicSelect.value : 1);
    }
}

// ------------------------------------------------------------------------------
// 1. EXPORT STUDENTS CSV (EXCEL COMPATIBLE)
// ------------------------------------------------------------------------------
function exportStudentsCSV() {
    const token = sessionStorage.getItem("python_sikho_mentor_token") || "ROHIT_MENTOR_AUTH_TOKEN_9509934266";
    fetch("/api/admin/export-students-csv", {
        headers: { "X-Mentor-Key": token }
    })
    .then(resp => {
        if (!resp.ok) throw new Error("Unauthorized or export failed");
        return resp.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `python_sikho_students_${new Date().toISOString().substring(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    })
    .catch(err => {
        alert("Error exporting CSV: " + err);
    });
}

// ------------------------------------------------------------------------------
// 2. AWARD BONUS XP POPUP & LOGIC
// ------------------------------------------------------------------------------
function promptAwardXP(studentId, studentName) {
    const modal = document.getElementById("award-xp-modal");
    const nameEl = document.getElementById("award-xp-student-name");
    const idEl = document.getElementById("award-xp-student-id");
    const amtEl = document.getElementById("award-xp-amount-input");
    const reasonEl = document.getElementById("award-xp-reason-input");

    if (idEl) idEl.value = studentId;
    if (nameEl) nameEl.innerText = `${studentName} (ID: #${studentId})`;
    if (amtEl) amtEl.value = "100";
    if (reasonEl) reasonEl.value = "क्लास टेस्ट में उत्कृष्ट प्रदर्शन (Outstanding Performance)";

    if (modal) modal.style.display = "flex";
}

function closeAwardXPModal() {
    const modal = document.getElementById("award-xp-modal");
    if (modal) modal.style.display = "none";
}

function setAwardXPAmount(amount) {
    const amtEl = document.getElementById("award-xp-amount-input");
    if (amtEl) amtEl.value = amount;
}

async function submitAwardXP() {
    const studentId = document.getElementById("award-xp-student-id")?.value;
    const amount = parseInt(document.getElementById("award-xp-amount-input")?.value || "100", 10);
    const reason = document.getElementById("award-xp-reason-input")?.value.trim() || "Chief Mentor Special Bonus";
    const token = sessionStorage.getItem("python_sikho_mentor_token") || "ROHIT_MENTOR_AUTH_TOKEN_9509934266";

    if (!studentId || isNaN(amount) || amount <= 0) {
        alert("⚠️ कृपया मान्य XP राशि दर्ज करें!");
        return;
    }

    try {
        const res = await fetch(`/api/admin/award-xp/${studentId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Mentor-Key": token
            },
            body: JSON.stringify({
                xp_amount: amount,
                reason: reason
            })
        });

        const data = await res.json();
        if (data.success) {
            alert(`🎉 ${data.message || 'छात्र को सफलतापूर्वक बोनस XP दिया गया!'}`);
            closeAwardXPModal();
            loadAdminStudents();
        } else {
            alert("Error: " + data.message);
        }
    } catch (e) {
        alert("Error awarding XP: " + e);
    }
}

// ------------------------------------------------------------------------------
// 3. BROADCAST NOTICE BOARD ENGINE
// ------------------------------------------------------------------------------
async function loadAdminAnnouncements() {
    const tbody = document.getElementById("admin-notices-tbody");
    if (!tbody) return;
    tbody.innerHTML = "<tr><td colspan='6' style='text-align:center; padding: 16px; color: var(--cyan-glow);'>⏳ Loading broadcast notices...</td></tr>";

    try {
        const res = await fetch("/api/admin/announcements");
        const data = await res.json();
        const announcements = data.announcements || [];
        tbody.innerHTML = "";

        if (announcements.length === 0) {
            tbody.innerHTML = "<tr><td colspan='6' style='text-align:center; padding: 16px; color: var(--text-muted);'>No broadcast notices published yet.</td></tr>";
            return;
        }

        announcements.forEach((a, idx) => {
            const tr = document.createElement("tr");
            const isLive = a.is_active === 1;
            tr.innerHTML = `
                <td><strong>#${a.id}</strong></td>
                <td><span class="badge-notice ${a.type}">${a.type}</span></td>
                <td style="font-weight: 700; color: #fff; max-width: 320px;">${a.message}</td>
                <td style="font-size: 11px; color: var(--text-muted);">${a.created_at ? a.created_at.substring(0, 10) : 'Today'}</td>
                <td>
                    <span style="background: ${isLive ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)'}; border: 1px solid ${isLive ? 'var(--green-glow)' : 'var(--card-border-subtle)'}; color: ${isLive ? 'var(--green-glow)' : 'var(--text-muted)'}; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 800;">
                        ${isLive ? '🟢 LIVE ON PORTAL' : '⚪ INACTIVE'}
                    </span>
                </td>
                <td>
                    <div style="display: flex; gap: 6px;">
                        <button onclick="toggleAdminAnnouncement(${a.id})" class="btn-secondary" style="font-size: 10px; padding: 3px 8px;">
                            ${isLive ? '⏸️ Hide' : '▶️ Make Live'}
                        </button>
                        <button onclick="deleteAdminAnnouncement(${a.id})" class="btn-action-delete" style="font-size: 10px; padding: 3px 8px;">
                            🗑️ Delete
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan='6' style='text-align:center; color: #ef4444;'>Error loading notices: ${e}</td></tr>`;
    }
}

async function saveAdminAnnouncement() {
    const msg = document.getElementById("admin-notice-input")?.value.trim();
    const type = document.getElementById("admin-notice-type")?.value || "general";
    const isActive = document.getElementById("admin-notice-active")?.checked ? 1 : 0;
    const token = sessionStorage.getItem("python_sikho_mentor_token") || "ROHIT_MENTOR_AUTH_TOKEN_9509934266";

    if (!msg) {
        alert("⚠️ कृपया नोटिस संदेश लिखें!");
        return;
    }

    try {
        const res = await fetch("/api/admin/announcement/save", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Mentor-Key": token
            },
            body: JSON.stringify({
                message: msg,
                type: type,
                is_active: isActive
            })
        });

        const data = await res.json();
        if (data.status === "success") {
            alert(data.message || "📢 नोटिस लाइव पब्लिश कर दिया गया है!");
            document.getElementById("admin-notice-input").value = "";
            sessionStorage.removeItem("python_sikho_announcement_dismissed");
            loadAdminAnnouncements();
            fetchActiveAnnouncement();
            loadPublicNotices(true);
        } else {
            alert("Error: " + data.message);
        }
    } catch (e) {
        alert("Error saving notice: " + e);
    }
}

async function toggleAdminAnnouncement(annId) {
    const token = sessionStorage.getItem("python_sikho_mentor_token") || "ROHIT_MENTOR_AUTH_TOKEN_9509934266";
    try {
        const res = await fetch(`/api/admin/announcement/toggle/${annId}`, {
            method: "POST",
            headers: { "X-Mentor-Key": token }
        });
        const data = await res.json();
        if (data.status === "success") {
            sessionStorage.removeItem("python_sikho_announcement_dismissed");
            loadAdminAnnouncements();
            fetchActiveAnnouncement();
            loadPublicNotices(true);
        }
    } catch (e) {
        alert("Error: " + e);
    }
}

async function deleteAdminAnnouncement(annId) {
    if (!confirm("क्या आप वाकई इस नोटिस को हटाना चाहते हैं?")) return;
    const token = sessionStorage.getItem("python_sikho_mentor_token") || "ROHIT_MENTOR_AUTH_TOKEN_9509934266";
    try {
        const res = await fetch(`/api/admin/announcement/delete/${annId}`, {
            method: "DELETE",
            headers: { "X-Mentor-Key": token }
        });
        const data = await res.json();
        if (data.status === "success") {
            loadAdminAnnouncements();
            fetchActiveAnnouncement();
            loadPublicNotices(true);
        }
    } catch (e) {
        alert("Error: " + e);
    }
}

// ------------------------------------------------------------------------------
// 4. TOPIC NOTES & QUIZ CMS ENGINE
// ------------------------------------------------------------------------------
let currentCmsTopicData = null;

async function loadAdminTopicCMS(chapterId) {
    const qContainer = document.getElementById("admin-cms-questions-container");
    const titleInp = document.getElementById("admin-cms-title");
    const descInp = document.getElementById("admin-cms-desc");
    const notesText = document.getElementById("admin-cms-notes-content");

    if (qContainer) qContainer.innerHTML = "<div style='color: var(--cyan-glow); font-size: 12px; text-align: center; padding: 20px;'>⏳ Loading topic data...</div>";

    try {
        const res = await fetch(`/api/admin/topic-content/${chapterId}`);
        const data = await res.json();

        if (data.status === "success") {
            currentCmsTopicData = data;
            const ch = data.chapter || {};
            const n = data.notes || {};
            const questions = data.questions || [];

            if (titleInp) titleInp.value = ch.title || "";
            if (descInp) descInp.value = ch.description || "";
            if (notesText) notesText.value = n.content_markdown || "";

            // Render Questions List
            if (qContainer) {
                qContainer.innerHTML = "";
                if (questions.length === 0) {
                    qContainer.innerHTML = "<div style='color: var(--text-muted); font-size: 11px; text-align: center; padding: 16px;'>No quiz questions created yet for this topic. Use the form below to add questions!</div>";
                } else {
                    questions.forEach((q, idx) => {
                        const div = document.createElement("div");
                        div.className = "admin-question-item";
                        div.innerHTML = `
                            <div style="flex-grow: 1;">
                                <div class="admin-question-text">
                                    <span style="color: var(--cyan-glow);">Q${idx + 1}.</span> ${q.question_text}
                                </div>
                                <div class="admin-question-opts">
                                    <span>A) ${q.option_a}</span> | <span>B) ${q.option_b}</span><br>
                                    <span>C) ${q.option_c || '-'}</span> | <span>D) ${q.option_d || '-'}</span>
                                </div>
                                <div style="font-size: 10px; color: var(--gold-glow); font-weight: 800; margin-top: 4px;">
                                    ✅ Correct: Option ${q.correct_option} ${q.explanation ? `• 💡 ${q.explanation}` : ''}
                                </div>
                            </div>
                            <button onclick="deleteAdminQuizQuestion(${q.id})" class="btn-action-delete" style="flex-shrink: 0;" title="Delete this question">
                                🗑️ Delete
                            </button>
                        `;
                        qContainer.appendChild(div);
                    });
                }
            }
        }
    } catch (e) {
        if (qContainer) qContainer.innerHTML = `<div style='color: #ef4444; font-size: 11px; text-align: center;'>Error loading topic CMS: ${e}</div>`;
    }
}

async function saveAdminTopicNotes() {
    const topicSelect = document.getElementById("admin-cms-topic-select");
    const chapterId = topicSelect ? topicSelect.value : 1;
    const title = document.getElementById("admin-cms-title")?.value.trim() || "";
    const desc = document.getElementById("admin-cms-desc")?.value.trim() || "";
    const markdown = document.getElementById("admin-cms-notes-content")?.value.trim() || "";
    const token = sessionStorage.getItem("python_sikho_mentor_token") || "ROHIT_MENTOR_AUTH_TOKEN_9509934266";

    if (!title || !markdown) {
        alert("⚠️ शीर्षक और नोट्स सामग्री खाली नहीं हो सकते!");
        return;
    }

    try {
        const res = await fetch(`/api/admin/topic-notes/${chapterId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Mentor-Key": token
            },
            body: JSON.stringify({
                title: title,
                description: desc,
                content_markdown: markdown
            })
        });

        const data = await res.json();
        if (data.status === "success") {
            alert(`✅ ${data.message || 'टॉपिक नोट्स सफलतापूर्वक अपडेट हो गए!'}`);
            await fetchChapters();
            if (currentChapterId == chapterId) {
                await loadChapter(chapterId);
            }
        } else {
            alert("Error: " + data.message);
        }
    } catch (e) {
        alert("Error saving notes: " + e);
    }
}

async function addAdminQuizQuestion() {
    const topicSelect = document.getElementById("admin-cms-topic-select");
    const chapterId = topicSelect ? topicSelect.value : 1;
    const qText = document.getElementById("admin-qq-text")?.value.trim();
    const optA = document.getElementById("admin-qq-opt-a")?.value.trim();
    const optB = document.getElementById("admin-qq-opt-b")?.value.trim();
    const optC = document.getElementById("admin-qq-opt-c")?.value.trim();
    const optD = document.getElementById("admin-qq-opt-d")?.value.trim();
    const correctOpt = document.getElementById("admin-qq-correct")?.value || "A";
    const expl = document.getElementById("admin-qq-expl")?.value.trim();
    const token = sessionStorage.getItem("python_sikho_mentor_token") || "ROHIT_MENTOR_AUTH_TOKEN_9509934266";

    if (!qText || !optA || !optB) {
        alert("⚠️ प्रश्न और कम से कम Option A व Option B भरना अनिवार्य है!");
        return;
    }

    try {
        const res = await fetch("/api/admin/quiz-question/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Mentor-Key": token
            },
            body: JSON.stringify({
                chapter_id: chapterId,
                question_text: qText,
                option_a: optA,
                option_b: optB,
                option_c: optC,
                option_d: optD,
                correct_option: correctOpt,
                explanation: expl
            })
        });

        const data = await res.json();
        if (data.status === "success") {
            alert("✅ नया क्विज़ प्रश्न सफलतापूर्वक जोड़ दिया गया!");
            document.getElementById("admin-qq-text").value = "";
            document.getElementById("admin-qq-opt-a").value = "";
            document.getElementById("admin-qq-opt-b").value = "";
            document.getElementById("admin-qq-opt-c").value = "";
            document.getElementById("admin-qq-opt-d").value = "";
            document.getElementById("admin-qq-expl").value = "";
            loadAdminTopicCMS(chapterId);
            if (currentChapterId == chapterId) {
                await loadChapter(chapterId);
            }
        } else {
            alert("Error: " + data.message);
        }
    } catch (e) {
        alert("Error adding quiz question: " + e);
    }
}

async function deleteAdminQuizQuestion(questionId) {
    if (!confirm("क्या आप वाकई इस क्विज़ प्रश्न को हटाना चाहते हैं?")) return;
    const token = sessionStorage.getItem("python_sikho_mentor_token") || "ROHIT_MENTOR_AUTH_TOKEN_9509934266";
    try {
        const res = await fetch(`/api/admin/quiz-question/delete/${questionId}`, {
            method: "DELETE",
            headers: { "X-Mentor-Key": token }
        });
        const data = await res.json();
        if (data.status === "success") {
            const topicSelect = document.getElementById("admin-cms-topic-select");
            loadAdminTopicCMS(topicSelect ? topicSelect.value : 1);
            if (currentChapterId) {
                await loadChapter(currentChapterId);
            }
        } else {
            alert("Error: " + data.message);
        }
    } catch (e) {
        alert("Error deleting question: " + e);
    }
}

// ------------------------------------------------------------------------------
// 5. STUDENTS ROSTER TABLE & FILTER
// ------------------------------------------------------------------------------
async function loadAdminStudents() {
    const tbody = document.getElementById("admin-students-tbody");
    if (!tbody) return;
    tbody.innerHTML = "<tr><td colspan='8' style='text-align:center; padding: 20px; color: var(--cyan-glow);'>⏳ Loading real-time registered students...</td></tr>";

    const token = sessionStorage.getItem("python_sikho_mentor_token") || "";

    try {
        const res = await fetch("/api/admin/students", {
            headers: { "X-Mentor-Key": token }
        });

        if (res.status === 403 || res.status === 401) {
            sessionStorage.removeItem("python_sikho_mentor_token");
            closeMentorAdminModal();
            openMentorPinModal();
            return;
        }

        const data = await res.json();
        const countElem = document.getElementById("admin-total-students");
        const xpElem = document.getElementById("admin-avg-xp");

        if (countElem) countElem.innerText = data.total_students || 0;
        if (xpElem) xpElem.innerText = `${data.average_xp || 100} XP`;

        cachedAdminStudents = data.students || [];
        renderAdminStudentsTable(cachedAdminStudents);
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan='8' style='text-align:center; color: #ef4444;'>Error loading students: ${e}</td></tr>`;
    }
}

function filterAdminStudents() {
    const q = document.getElementById("admin-search-input")?.value.toLowerCase().trim() || "";
    if (!q) {
        renderAdminStudentsTable(cachedAdminStudents);
        return;
    }

    const filtered = cachedAdminStudents.filter(s => 
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q)) ||
        (s.city && s.city.toLowerCase().includes(q))
    );
    renderAdminStudentsTable(filtered);
}

function renderAdminStudentsTable(students) {
    const tbody = document.getElementById("admin-students-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!students || students.length === 0) {
        tbody.innerHTML = "<tr><td colspan='8' style='text-align:center; padding: 20px; color: var(--text-muted);'>No students found matching your search.</td></tr>";
        return;
    }

    students.forEach((s, idx) => {
        const initials = s.name
            .split(" ")
            .map(n => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase() || "ST";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>#${idx + 1}</strong></td>
            <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 26px; height: 26px; border-radius: 50%; background: var(--accent-gradient); color: #000; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 900;">
                        ${initials}
                    </div>
                    <strong>${s.name}</strong>
                </div>
            </td>
            <td style="font-family: monospace; color: var(--cyan-glow);">📱 +91 ${s.phone}</td>
            <td>📍 ${s.city || 'Kuchaman City'}</td>
            <td><span style="color: var(--gold-glow); font-weight: 800;">⚡ ${s.xp_points} XP</span></td>
            <td>🔥 ${s.streak_days} Days</td>
            <td style="font-size: 11px; color: var(--text-muted);">${s.created_at ? s.created_at.substring(0, 10) : 'Today'}</td>
            <td>
                <div style="display: flex; gap: 4px;">
                    <button onclick="promptAwardXP(${s.id}, '${s.name}')" class="btn-action-award-xp" title="Award custom bonus XP to this student">
                        ⚡ +XP
                    </button>
                    <button onclick="deleteStudentByMentor(${s.id}, '${s.name}')" class="btn-action-delete" title="Remove student record permanently">
                        🗑️ Delete
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function deleteStudentByMentor(studentId, studentName) {
    if (!confirm(`⚠️ क्या आप वाकई छात्र "${studentName}" (ID: #${studentId}) का रिकॉर्ड हटाना चाहते हैं?`)) {
        return;
    }

    const token = sessionStorage.getItem("python_sikho_mentor_token") || "";
    try {
        const res = await fetch(`/api/admin/delete-student/${studentId}`, {
            method: "DELETE",
            headers: { "X-Mentor-Key": token }
        });
        const data = await res.json();
        if (data.success) {
            alert(`✅ ${data.message || 'छात्र का रिकॉर्ड हटा दिया गया।'}`);
            loadAdminStudents();
        } else {
            alert("Error: " + data.message);
        }
    } catch (e) {
        alert("Error: " + e);
    }
}

// Session Heartbeat: Automatically log out if student was deleted by Rohit Sir
let studentHeartbeatTimer = null;
function startStudentSessionHeartbeat() {
    if (studentHeartbeatTimer) clearInterval(studentHeartbeatTimer);
    studentHeartbeatTimer = setInterval(async () => {
        if (activeStudent && !activeStudent.is_mentor && activeStudent.id > 0) {
            try {
                const res = await fetch(`/api/auth/student/${activeStudent.id}`);
                if (res.status === 404 || res.status === 401) {
                    const data = await res.json().catch(() => ({}));
                    if (data.kicked || res.status === 404) {
                        localStorage.removeItem("python_sikho_student");
                        activeStudent = null;
                        setActiveStudent(null);
                        showLandingPage();
                        alert("⚠️ आपका छात्र रिकॉर्ड चीफ मेंटर (रोहित सर) द्वारा हटा दिया गया है। \n\nकृपया पुनः मोबाइल नंबर से नया लॉगिन करें!");
                        openAuthModal();
                    }
                }
            } catch (e) {}
        }
    }, 6000); // Checks every 6 seconds
}

// ==============================================================================
// 8. AI TUTOR DRAWER ENGINE (STRICT PYTHON DOMAIN VIA GEMINI 3.5 FLASH)
// ==============================================================================
function toggleAiDrawer() {
    const drawer = document.getElementById("ai-drawer");
    if (drawer) drawer.classList.toggle("active");
}

function askQuickTutor(queryText) {
    const input = document.getElementById("ai-user-query");
    if (input) {
        input.value = queryText;
        sendAiQuery();
    }
}

async function sendAiQuery() {
    const input = document.getElementById("ai-user-query");
    if (!input) return;
    const query = input.value.trim();
    if (!query) return;

    const chatBody = document.getElementById("ai-chat-body");
    if (!chatBody) return;
    
    // Append User message to UI
    const userMsg = document.createElement("div");
    userMsg.className = "ai-msg user";
    userMsg.innerText = query;
    chatBody.appendChild(userMsg);
    input.value = "";
    chatBody.scrollTop = chatBody.scrollHeight;

    // Add to history array
    chatHistory.push({ sender: "user", text: query });
    if (chatHistory.length > 8) chatHistory.shift();

    // Typing Indicator
    const typingIndicator = document.createElement("div");
    typingIndicator.className = "ai-msg bot";
    typingIndicator.id = "ai-typing-temp";
    typingIndicator.innerHTML = "<span>🤖 रोहित सर AI उत्तर तैयार कर रहे हैं...</span>";
    chatBody.appendChild(typingIndicator);
    chatBody.scrollTop = chatBody.scrollHeight;

    try {
        const res = await fetch("/api/ai/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query: query,
                current_code: document.getElementById("python-code-editor")?.value || "",
                chapter_title: currentChapterData?.chapter?.title || "",
                history: chatHistory
            })
        });
        const result = await res.json();

        // Remove typing indicator
        const temp = document.getElementById("ai-typing-temp");
        if (temp) temp.remove();

        const reply = result.reply || "नमस्ते! कोई उत्तर प्राप्त नहीं हुआ। कृपया पुनः प्रयास करें।";

        chatHistory.push({ sender: "model", text: reply });
        if (chatHistory.length > 8) chatHistory.shift();

        // Append Bot reply to UI
        const botMsg = document.createElement("div");
        botMsg.className = "ai-msg bot";
        botMsg.innerHTML = formatMarkdownToHtml(reply);
        chatBody.appendChild(botMsg);
        chatBody.scrollTop = chatBody.scrollHeight;
    } catch (e) {
        const temp = document.getElementById("ai-typing-temp");
        if (temp) temp.remove();
        console.error("AI Tutor error:", e);
    }
}

// ==============================================================================
// 12-TOPIC CYBER SLIDER & MARQUEE SHOWCASE CONTROLS
// ==============================================================================
function pauseTopicSlider() {
    const track = document.getElementById("topics-marquee-track");
    if (track) track.classList.add("paused");
}

function resumeTopicSlider() {
    const track = document.getElementById("topics-marquee-track");
    if (track) track.classList.remove("paused");
}

function scrollTopicsSlider(direction) {
    const wrapper = document.getElementById("topics-marquee-wrapper");
    const track = document.getElementById("topics-marquee-track");
    if (!wrapper || !track) return;

    track.classList.add("paused");
    const scrollAmount = 260 * direction;
    wrapper.scrollBy({ left: scrollAmount, behavior: "smooth" });

    clearTimeout(window._sliderResumeTimer);
    window._sliderResumeTimer = setTimeout(() => {
        track.classList.remove("paused");
    }, 4000);
}

function switchCurriculumView(viewType) {
    const sliderContainer = document.getElementById("topics-marquee-wrapper");
    const sliderCaption = document.getElementById("slider-footer-caption");
    const gridContainer = document.getElementById("curriculum-grid-cards");
    const btnSlider = document.getElementById("btn-toggle-slider");
    const btnGrid = document.getElementById("btn-toggle-grid");

    if (viewType === 'grid') {
        if (sliderContainer) sliderContainer.style.display = "none";
        if (sliderCaption) sliderCaption.style.display = "none";
        if (gridContainer) {
            gridContainer.style.display = "grid";
            if (gridContainer.children.length === 0) {
                const track = document.getElementById("topics-marquee-track");
                if (track) {
                    const cards = track.querySelectorAll(".cyber-topic-card");
                    for (let i = 0; i < 12 && i < cards.length; i++) {
                        gridContainer.appendChild(cards[i].cloneNode(true));
                    }
                }
            }
        }
        if (btnSlider) btnSlider.classList.remove("active");
        if (btnGrid) btnGrid.classList.add("active");
    } else {
        if (sliderContainer) sliderContainer.style.display = "block";
        if (sliderCaption) sliderCaption.style.display = "flex";
        if (gridContainer) gridContainer.style.display = "none";
        if (btnSlider) btnSlider.classList.add("active");
        if (btnGrid) btnGrid.classList.remove("active");
    }
    updateNavbarAuthUI();
}

function initTopicsSliderInteractions() {
    const slider = document.getElementById("topics-marquee-wrapper");
    const track = document.getElementById("topics-marquee-track");
    if (!slider || !track) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    slider.addEventListener('mousedown', (e) => {
        isDown = true;
        track.classList.add('paused');
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener('mouseleave', () => {
        if (isDown) {
            isDown = false;
            track.classList.remove('paused');
        }
    });

    slider.addEventListener('mouseup', () => {
        isDown = false;
        setTimeout(() => track.classList.remove('paused'), 2000);
    });

    slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 1.5;
        slider.scrollLeft = scrollLeft - walk;
    });

    slider.addEventListener('touchstart', () => {
        track.classList.add('paused');
    }, { passive: true });

    slider.addEventListener('touchend', () => {
        setTimeout(() => track.classList.remove('paused'), 3000);
    }, { passive: true });
}

// Initialize on DOM Ready
document.addEventListener("DOMContentLoaded", () => {
    initTopicsSliderInteractions();
    loadPublicNotices(false);
    fetchActiveAnnouncement();
    syncPaywallPricing();

// Periodic 15-second sync for real-time Rohit Sir notices
    if (!window._publicNoticesSyncInterval) {
        window._publicNoticesSyncInterval = setInterval(() => {
            loadPublicNotices(false);
            fetchActiveAnnouncement();
        }, 15000);
    }
});

// ==============================================================================
// 14. VIP COURSE SUBSCRIPTION & DYNAMIC UPI PAYWALL ENGINE (AUTO-SYNC FROM ADMIN)
// ==============================================================================
let currentCoursePrice = 299;
let currentUpiId = "7627060647@ybl";
let currentPayeeName = "RAJU RAM (Rohit Sir)";
let currentPaymentPhone = "7627060647";

async function syncPaywallPricing() {
    try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.status === "success" && data.settings) {
            const s = data.settings;
            if (s.course_price) currentCoursePrice = parseInt(s.course_price) || 299;
            if (s.payment_upi_id) currentUpiId = s.payment_upi_id;
            if (s.payment_receiver_name) currentPayeeName = s.payment_receiver_name;
            if (s.payment_phone) currentPaymentPhone = s.payment_phone;

            // 1. Update price displays in modal
            const priceEl = document.getElementById("paywall-price-display");
            if (priceEl) priceEl.innerText = currentCoursePrice;

            // 2. Update UPI Info Strip
            const upiNumEl = document.getElementById("paywall-upi-number");
            if (upiNumEl) upiNumEl.innerText = currentPaymentPhone;
            const upiIdEl = document.getElementById("paywall-upi-id");
            if (upiIdEl) upiIdEl.innerText = currentUpiId;

            // 3. Update QR Image with live dynamic QR endpoint & timestamp
            const qrImg = document.getElementById("paywall-qr-img");
            if (qrImg) {
                qrImg.src = `/api/payment/qr.png?amount=${currentCoursePrice}&v=${Date.now()}`;
            }

            // 4. Update 1-Tap Mobile Intent Buttons
            const payUri = `upi://pay?pa=${encodeURIComponent(currentUpiId)}&pn=${encodeURIComponent(currentPayeeName)}&am=${currentCoursePrice}&cu=INR&tn=${encodeURIComponent('Python Sikho VIP Course')}`;
            document.querySelectorAll(".mobile-pay-intents a").forEach(link => {
                link.href = payUri;
            });

            // 5. Update Navbar VIP Button
            const navVip = document.getElementById("nav-btn-vip");
            if (navVip) navVip.innerText = `👑 VIP Course (₹${currentCoursePrice})`;
        }
    } catch (e) {
        console.error("Error syncing pricing:", e);
    }
}

function openPaywallModal() {
    const modal = document.getElementById("modal-paywall-upgrade");
    if (modal) {
        modal.style.display = "flex";
        syncPaywallPricing();

        const utrInput = document.getElementById("input-payment-utr");
        const statusMsg = document.getElementById("payment-status-message");
        const waContainer = document.getElementById("paywall-wa-proof-container");
        const studentBar = document.getElementById("paywall-student-status-bar");
        const guestRow = document.getElementById("paywall-guest-inputs-row");
        const nameLabel = document.getElementById("paywall-student-name-label");
        const phoneLabel = document.getElementById("paywall-student-phone-label");

        if (statusMsg) statusMsg.style.display = "none";
        if (waContainer) waContainer.style.display = "none";
        
        if (activeStudent && activeStudent.id && activeStudent.id !== 0) {
            if (studentBar) studentBar.style.display = "block";
            if (guestRow) guestRow.style.display = "none";
            if (nameLabel) nameLabel.innerText = activeStudent.name || "Student";
            if (phoneLabel) phoneLabel.innerText = `+91 ${activeStudent.phone || ''}`;

            if (activeStudent.payment_utr && activeStudent.subscription_status === 'pending_approval') {
                if (utrInput) utrInput.value = activeStudent.payment_utr;
                if (statusMsg) {
                    statusMsg.className = "payment-status-msg success";
                    statusMsg.style.display = "block";
                    statusMsg.innerHTML = `⏳ <strong>सत्यापन प्रक्रियाधीन:</strong> आपका UTR (<code>${activeStudent.payment_utr}</code>) दर्ज है। रोहित सर द्वारा अप्रूव होते ही VIP एक्सेस सक्रिय हो जाएगी।`;
                }
                if (waContainer) {
                    const waBtn = document.getElementById("paywall-wa-proof-btn");
                    if (waBtn) {
                        const waMsg = encodeURIComponent(`नमस्ते रोहित सर! मैंने Python Sikho VIP कोर्स के लिए ₹${currentCoursePrice} का भुगतान कर दिया है।\n\n👤 नाम: ${activeStudent.name}\n📱 मोबाइल: ${activeStudent.phone}\n🔢 UTR/Ref No: ${activeStudent.payment_utr}\n\nकृपया मेरा VIP कोर्स तुरंत अनलॉक करें!`);
                        waBtn.href = `https://api.whatsapp.com/send?phone=91${currentPaymentPhone}&text=${waMsg}`;
                    }
                    waContainer.style.display = "block";
                }
            }
        } else {
            if (studentBar) studentBar.style.display = "none";
            if (guestRow) guestRow.style.display = "flex";
        }
    }
}

function closePaywallModal() {
    const modal = document.getElementById("modal-paywall-upgrade");
    if (modal) {
        modal.style.display = "none";
    }
}

function copyUpiNumber(val) {
    const num = val || currentUpiId || "7627060647@ybl";
    navigator.clipboard.writeText(num).then(() => {
        alert(`📋 कॉपी किया गया: ${num}\n\nअब Google Pay / PhonePe / Paytm खोलें और ₹${currentCoursePrice} का भुगतान करें।`);
    });
}

async function submitCoursePayment() {
    let studentId = activeStudent ? activeStudent.id : null;
    let studentName = activeStudent ? activeStudent.name : "";
    let studentPhone = activeStudent ? activeStudent.phone : "";

    // If not logged in, read from guest inputs
    if (!studentPhone) {
        studentName = document.getElementById("input-payment-name")?.value.trim() || "";
        studentPhone = document.getElementById("input-payment-phone")?.value.trim() || "";
        
        const cleanPhone = studentPhone.replace(/[^0-9]/g, "");
        if (!cleanPhone || cleanPhone.length < 10) {
            alert("⚠️ कृपया अपना 10-अंकों का वैध मोबाइल नंबर दर्ज करें ताकि आपकी VIP एक्सेस आपके अकाउंट में जुड़ सके!");
            document.getElementById("input-payment-phone")?.focus();
            return;
        }
        studentPhone = cleanPhone.slice(-10);
        if (!studentName) {
            studentName = `Student ${studentPhone.slice(-4)}`;
        }
    }

    const utrInput = document.getElementById("input-payment-utr");
    const utr = utrInput?.value.trim() || "";
    const statusMsg = document.getElementById("payment-status-message");
    const waContainer = document.getElementById("paywall-wa-proof-container");
    const waBtn = document.getElementById("paywall-wa-proof-btn");
    const btn = document.getElementById("btn-submit-utr");

    if (!utr || utr.length < 4) {
        if (statusMsg) {
            statusMsg.className = "payment-status-msg error";
            statusMsg.style.display = "block";
            statusMsg.innerText = "⚠️ कृपया 12-अंकों का मान्य UPI Reference / UTR नंबर दर्ज करें!";
        }
        if (utrInput) utrInput.focus();
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.innerText = "⏳ Verifying Payment...";
    }

    try {
        const res = await fetch("/api/subscription/submit-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: studentId,
                name: studentName,
                phone: studentPhone,
                upi_ref: utr,
                amount: currentCoursePrice || 299
            })
        });
        const data = await res.json();

        if (data.success) {
            if (data.user) {
                activeStudent = data.user;
                localStorage.setItem("python_sikho_student", JSON.stringify(activeStudent));
                setActiveStudent(activeStudent);
            }

            if (statusMsg) {
                statusMsg.className = "payment-status-msg success";
                statusMsg.style.display = "block";
                statusMsg.innerHTML = `🎉 <strong>भुगतान विवरण दर्ज हो गया!</strong><br>UTR: <code>${utr}</code><br>चीफ मेंटर रोहित सर द्वारा सत्यापन के बाद आपका VIP कोर्स तुरंत अनलॉक हो जाएगा।`;
            }

            if (waContainer && waBtn) {
                if (data.whatsapp_url) {
                    waBtn.href = data.whatsapp_url;
                } else {
                    const waMsg = encodeURIComponent(`नमस्ते रोहित सर! मैंने Python Sikho VIP कोर्स के लिए ₹${currentCoursePrice} का भुगतान कर दिया है।\n\n👤 नाम: ${studentName}\n📱 मोबाइल: ${studentPhone}\n🔢 UTR/Ref No: ${utr}\n\nकृपया मेरा VIP कोर्स तुरंत अनलॉक करें!`);
                    waBtn.href = `https://api.whatsapp.com/send?phone=91${currentPaymentPhone}&text=${waMsg}`;
                }
                waContainer.style.display = "block";
            }

            alert(`🎉 धन्यवाद ${studentName}!\n\nआपका ₹${currentCoursePrice} का भुगतान (UTR: ${utr}) सफलतापूर्वक दर्ज हो गया है।\nरोहित सर द्वारा सत्यापन होते ही आपके सभी 12 टॉपिक्स अनलॉक हो जाएँगे!`);
        } else {
            if (statusMsg) {
                statusMsg.className = "payment-status-msg error";
                statusMsg.style.display = "block";
                statusMsg.innerText = "❌ " + (data.message || "भुगतान दर्ज करने में त्रुटि हुई।");
            }
        }
    } catch (e) {
        if (statusMsg) {
            statusMsg.className = "payment-status-msg error";
            statusMsg.style.display = "block";
            statusMsg.innerText = "Network Error: " + e;
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerText = "🚀 Verify & Unlock VIP ➜";
        }
    }
}

// ==============================================================================
// 15. STUDENT PORTAL DASHBOARD CONTROLLER (STUDENT COCKPIT)
// ==============================================================================
async function loadStudentDashboardData() {
    if (!activeStudent) {
        openAuthModal();
        return;
    }

    try {
        const res = await fetch(`/api/student/${activeStudent.id}/dashboard`);
        const data = await res.json();
        if (data.status === "success" && data.dashboard) {
            renderStudentDashboard(data.dashboard);
        }
    } catch (e) {
        console.error("Student dashboard fetch error:", e);
    }
}

function renderStudentDashboard(dash) {
    if (!dash) return;
    const user = dash.user || {};
    const metrics = dash.metrics || {};
    const topics = dash.topics || [];
    const quizStats = dash.quiz_stats || {};

    // Profile Card
    const nameElem = document.getElementById("sd-student-name");
    const phoneElem = document.getElementById("sd-student-phone");
    const cityElem = document.getElementById("sd-student-city");
    const idElem = document.getElementById("sd-student-id");
    const joinedElem = document.getElementById("sd-joined-date");
    const initialsElem = document.getElementById("sd-avatar-initials");
    const vipBadgePill = document.getElementById("sd-vip-badge-pill");
    const upgradeVipBtn = document.getElementById("sd-btn-upgrade-vip");

    const initials = (user.name || "Student")
        .split(" ")
        .map(n => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "ST";

    if (initialsElem) initialsElem.innerText = initials;
    if (nameElem) {
        nameElem.innerHTML = `
            <span>${user.name || 'Student'}</span>
            <span id="sd-vip-badge-pill" class="vip-active-pill" style="${metrics.is_vip ? 'border-color:#f59e0b; color:#fde68a;' : 'border-color:#10b981; color:#6ee7b7;'}">
                ${metrics.is_vip ? '👑 VIP Lifetime Member' : '🟢 Free Demo Class 1'}
            </span>
        `;
    }
    if (phoneElem) phoneElem.innerText = `📱 +91 ${user.phone || ''}`;
    if (cityElem) cityElem.innerText = `📍 ${user.city || 'Kuchaman City'}`;
    if (idElem) idElem.innerText = `🎓 Roll ID: ${metrics.cert_number || 'PS-2026-0001'}`;
    if (joinedElem) joinedElem.innerText = `📅 Enrolled: ${user.created_at ? user.created_at.substring(0, 10) : 'Sept 2026'}`;

    if (upgradeVipBtn) {
        upgradeVipBtn.style.display = metrics.is_vip ? "none" : "inline-flex";
    }

    // 4 Metrics
    const completedCount = metrics.completed_topics || 0;
    const totalCount = metrics.total_topics || 12;
    const remainingCount = metrics.remaining_topics || 0;
    const pct = metrics.progress_percentage || 0;
    const xp = metrics.xp_points || 100;
    const streak = metrics.streak_days || 1;

    let levelText = "🛡️ Level: Python Beginner";
    if (xp >= 800) levelText = "👑 Level: Python Grandmaster";
    else if (xp >= 500) levelText = "🧙 Level: Python Knight";
    else if (xp >= 250) levelText = "⚔️ Level: Python Apprentice";

    const compCountElem = document.getElementById("sd-completed-topics-count");
    const totalCountElem = document.getElementById("sd-total-topics-count");
    const remainCountElem = document.getElementById("sd-remaining-topics-count");
    const pctTextElem = document.getElementById("sd-progress-pct-text");
    const progressBar = document.getElementById("sd-progress-bar");
    const xpElem = document.getElementById("sd-xp-display");
    const levelElem = document.getElementById("sd-mastery-level-badge");
    const streakElem = document.getElementById("sd-streak-count");
    const quizAccElem = document.getElementById("sd-quiz-accuracy-text");

    if (compCountElem) compCountElem.innerText = completedCount;
    if (totalCountElem) totalCountElem.innerText = totalCount;
    if (remainCountElem) remainCountElem.innerText = remainingCount;
    if (pctTextElem) pctTextElem.innerText = `${pct}% Completed (${completedCount} of ${totalCount} Topics Done)`;
    if (progressBar) progressBar.style.width = `${pct}%`;
    if (xpElem) xpElem.innerText = Number(xp).toLocaleString();
    if (levelElem) levelElem.innerText = levelText;
    if (streakElem) streakElem.innerText = streak;
    if (quizAccElem) quizAccElem.innerText = `Quiz Accuracy: ${quizStats.accuracy_pct || 100}% (${quizStats.quizzes_passed || 0} Quizzes Passed)`;

    // 12-Module Grid
    const topicsGrid = document.getElementById("sd-topics-grid");
    if (topicsGrid) {
        topicsGrid.innerHTML = "";
        topics.forEach((t) => {
            const item = document.createElement("div");
            item.className = `sd-topic-item ${t.status}`;
            
            let badgeText = "⏳ In Progress";
            let badgeStyle = "background:rgba(0,240,255,0.1); color:#00f0ff;";
            let btnText = `🚀 Study Topic ${t.chapter_no} ➜`;
            let btnStyle = "background:var(--accent-gradient); color:#000;";
            let btnAction = `enterLearningPortal(${t.chapter_no})`;

            if (t.is_completed) {
                badgeText = "✅ Completed (+100 XP)";
                badgeStyle = "background:rgba(16,185,129,0.15); color:#34d399;";
                btnText = `🔄 Review Topic ${t.chapter_no}`;
                btnStyle = "background:rgba(16,185,129,0.2); color:#6ee7b7; border:1px solid #10b981;";
            } else if (!t.is_unlocked) {
                badgeText = "🔒 VIP Locked";
                badgeStyle = "background:rgba(245,158,11,0.15); color:#fbbf24;";
                btnText = "👑 Unlock VIP @ ₹299";
                btnStyle = "background:linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color:#000;";
                btnAction = "openPaywallModal()";
            }

            item.innerHTML = `
                <div>
                    <div class="sd-topic-top">
                        <span class="sd-topic-no">Topic #${t.chapter_no}</span>
                        <span style="font-size:11px; font-weight:800; padding:2px 8px; border-radius:12px; ${badgeStyle}">
                            ${badgeText}
                        </span>
                    </div>
                    <h4 class="sd-topic-title">${t.title}</h4>
                    <p class="sd-topic-desc">${t.description || 'Master this topic with notes, interactive sandbox code, and live quiz.'}</p>
                    <div class="sd-topic-steps-pills">
                        <span class="sd-step-pill ${t.is_completed ? 'done' : ''}">📖 Notes</span>
                        <span class="sd-step-pill ${t.is_completed ? 'done' : ''}">💻 Sandbox</span>
                        <span class="sd-step-pill ${t.is_completed ? 'done' : ''}">❓ Quiz</span>
                        <span class="sd-step-pill ${t.is_completed ? 'done' : ''}">⚡ +${t.xp_reward} XP</span>
                    </div>
                </div>
                <button class="sd-btn-action" onclick="${btnAction}" style="${btnStyle}">
                    ${btnText}
                </button>
            `;
            topicsGrid.appendChild(item);
        });
    }

    // Quiz Stats
    const qPassed = document.getElementById("sd-stat-quizzes-passed");
    const qAvg = document.getElementById("sd-stat-avg-score");
    if (qPassed) qPassed.innerText = `${quizStats.quizzes_passed || 0} / 12`;
    if (qAvg) qAvg.innerText = `${quizStats.avg_score || 0}%`;

    // Certificate Card Status
    const certBadge = document.getElementById("sd-cert-status-badge");
    const certDesc = document.getElementById("sd-cert-status-desc");
    if (certBadge && certDesc) {
        if (metrics.cert_eligible) {
            certBadge.className = "auth-status-pill";
            certBadge.style.background = "rgba(16,185,129,0.15)";
            certBadge.style.color = "#34d399";
            certBadge.style.borderColor = "#10b981";
            certBadge.innerText = "🟢 VERIFIED & READY";
            certDesc.innerHTML = `🎉 बधाई हो! आपने Python के सभी 12 मॉड्यूल्स सफलता से पूर्ण कर लिए हैं। आपका आधिकारिक सर्टिफिकेट <strong>(${metrics.cert_number})</strong> तैयार है!`;
        } else {
            certBadge.className = "auth-status-pill";
            certBadge.style.background = "rgba(245,158,11,0.15)";
            certBadge.style.color = "#fbbf24";
            certBadge.style.borderColor = "#f59e0b";
            certBadge.innerText = `⏳ In Progress (${completedCount}/12)`;
            certDesc.innerHTML = `सर्टिफ़िकेट अनलॉक करने के लिए बाकी <strong>${remainingCount} टॉपिक्स</strong> पूरे करें।`;
        }
    }
}

// ==============================================================================
// 16. SEO BLOG & KNOWLEDGE SUITE CONTROLLER
// ==============================================================================
let currentBlogCategory = "all";
let currentBlogSearch = "";
let currentBlogArticle = null;
let blogSearchDebounce = null;

async function loadBlogArticles(category = currentBlogCategory, search = currentBlogSearch) {
    const container = document.getElementById("blog-articles-container");
    if (!container) return;
    container.innerHTML = "<div style='grid-column:1/-1; text-align:center; padding:50px; color:#64748b;'>⏳ Loading articles...</div>";

    try {
        let url = `/api/blog/posts?category=${encodeURIComponent(category)}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.status === "success" && data.posts) {
            if (data.posts.length === 0) {
                container.innerHTML = `
                    <div style='grid-column:1/-1; text-align:center; padding:60px; color:#64748b;'>
                        <div style="font-size:32px; margin-bottom:10px;">🔍</div>
                        <h3 style="color:#fff;">No articles found</h3>
                        <p style="font-size:13px; margin-top:4px;">Try searching with different keywords like 'Python', 'Interview', or 'Roadmap'.</p>
                    </div>
                `;
                return;
            }
            container.innerHTML = "";
            data.posts.forEach(p => {
                const card = document.createElement("div");
                card.className = "blog-card";
                card.onclick = () => openBlogPost(p.slug);
                card.innerHTML = `
                    <div>
                        <div class="blog-card-meta">
                            <span class="blog-card-cat">${p.category}</span>
                            <span class="blog-card-time">⏱️ ${p.read_time}</span>
                        </div>
                        <h3 class="blog-card-title">${p.title}</h3>
                        <p class="blog-card-desc">${p.meta_description}</p>
                    </div>
                    <div class="blog-card-footer">
                        <span class="blog-card-author">👨‍🏫 ${p.author_name}</span>
                        <span class="blog-card-read-btn">Read Article ➜</span>
                    </div>
                `;
                container.appendChild(card);
            });
        }
    } catch (e) {
        container.innerHTML = "<div style='grid-column:1/-1; color:#ef4444; text-align:center;'>Failed to load blog posts.</div>";
    }
}

function filterBlogCategory(cat, btn) {
    currentBlogCategory = cat;
    document.querySelectorAll(".blog-cat-chip").forEach(c => c.classList.remove("active"));
    if (btn) btn.classList.add("active");
    loadBlogArticles(currentBlogCategory, currentBlogSearch);
}

function handleBlogSearch(val) {
    currentBlogSearch = val.trim();
    clearTimeout(blogSearchDebounce);
    blogSearchDebounce = setTimeout(() => {
        loadBlogArticles(currentBlogCategory, currentBlogSearch);
    }, 300);
}

async function loadSingleBlogArticle(slug) {
    const contentBox = document.getElementById("single-blog-content");
    if (!contentBox) return;
    contentBox.innerHTML = "<div style='text-align:center; padding:50px; color:#64748b;'>⏳ Loading article content...</div>";

    try {
        const res = await fetch(`/api/blog/posts/${slug}`);
        const data = await res.json();
        if (data.status === "success" && data.post) {
            const p = data.post;
            currentBlogArticle = p;
            
            const titleElem = document.getElementById("single-blog-title");
            const catElem = document.getElementById("single-blog-category");
            const timeElem = document.getElementById("single-blog-read-time");
            const viewsElem = document.getElementById("single-blog-views");
            const dateElem = document.getElementById("single-blog-date");

            if (titleElem) titleElem.innerText = p.title;
            if (catElem) catElem.innerText = p.category;
            if (timeElem) timeElem.innerText = `⏱️ ${p.read_time}`;
            if (viewsElem) viewsElem.innerText = `👁️ ${p.views_count} views`;
            if (dateElem) dateElem.innerText = p.created_at ? p.created_at.substring(0, 10) : "Sept 2026";
            
            contentBox.innerHTML = formatMarkdownToHtml(p.content_markdown || '');
        } else {
            contentBox.innerHTML = "<div style='color:#ef4444; padding:30px;'>Article not found.</div>";
        }
    } catch (e) {
        contentBox.innerHTML = `<div style='color:#ef4444; padding:30px;'>Error loading article: ${e}</div>`;
    }
}

function shareCurrentBlogWhatsApp() {
    if (!currentBlogArticle) return;
    const url = window.location.origin + "/#blog/" + currentBlogArticle.slug;
    const text = `🐍 *${currentBlogArticle.title}*\n\nपाइथन सीखो ज्ञान केंद्र (सम्यक कम्प्यूटर क्लासेज, कुचामन सिटी) पर यह बेहतरीन आर्टिकल पढ़ें:\n🔗 ${url}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
}

// ==============================================================================
// 20. PWA INSTALLATION & SERVICE WORKER CONTROLLER
// ==============================================================================
let deferredPwaPrompt = null;

function initPwaServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('PWA Service Worker registered:', reg.scope))
                .catch(err => console.log('Service Worker registration failed:', err));
        });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPwaPrompt = e;
        const navBtn = document.getElementById("nav-btn-pwa-install");
        const banner = document.getElementById("pwa-floating-banner");
        if (navBtn) navBtn.style.display = "inline-flex";
        if (banner) banner.style.display = "block";
    });

    window.addEventListener('appinstalled', () => {
        deferredPwaPrompt = null;
        const banner = document.getElementById("pwa-floating-banner");
        if (banner) banner.style.display = "none";
        console.log('Python Sikho App installed successfully!');
    });
}

function triggerPwaInstall() {
    if (deferredPwaPrompt) {
        deferredPwaPrompt.prompt();
        deferredPwaPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the PWA install prompt');
            }
            deferredPwaPrompt = null;
            dismissPwaBanner();
        });
    } else {
        alert("📲 Python Sikho App:\n\nAndroid पर Chrome में ऊपर 3-dots (⋮) पर क्लिक करें और 'Add to Home screen' (होम स्क्रीन पर जोड़ें) चुनें।\n\niPhone / Safari पर Share बटन दबाकर 'Add to Home Screen' चुनें!");
    }
}

function dismissPwaBanner() {
    const banner = document.getElementById("pwa-floating-banner");
    if (banner) banner.style.display = "none";
}

// ==============================================================================
// 21. LIVE STUDENT LEADERBOARD & HALL OF FAME
// ==============================================================================
let cachedLeaderboard = [];

async function loadLeaderboardData() {
    try {
        const res = await fetch("/api/leaderboard?limit=15");
        const data = await res.json();
        if (data.status === "success" && data.leaderboard) {
            cachedLeaderboard = data.leaderboard;
            renderLeaderboardPodium(cachedLeaderboard);
            renderLeaderboardTable(cachedLeaderboard);
        }
    } catch (e) {
        console.error("Error loading leaderboard:", e);
    }
}

function renderLeaderboardPodium(students) {
    const container = document.getElementById("leaderboard-podium-container");
    if (!container) return;

    if (!students || students.length === 0) {
        container.innerHTML = "<div style='grid-column:1/-1; text-align:center; color:#64748b;'>No students on leaderboard yet.</div>";
        return;
    }

    const rank1 = students[0] || null;
    const rank2 = students[1] || null;
    const rank3 = students[2] || null;

    let html = "";

    // 🥈 Rank 2 (Left)
    if (rank2) {
        const initials = (rank2.name || "ST").split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
        html += `
            <div class="podium-card rank-2">
                <span class="podium-badge silver">🥈 RANK #2</span>
                <div class="podium-avatar" style="border-color: #94a3b8; background: rgba(148,163,184,0.15); color: #cbd5e1;">${initials}</div>
                <h3 class="podium-name">${escapeHtml(rank2.name)}</h3>
                <div class="podium-city">📍 ${escapeHtml(rank2.city || 'Kuchaman City')}</div>
                <span class="podium-xp-pill" style="border-color: #94a3b8; color: #e2e8f0;">⚡ ${rank2.xp_points} XP</span>
                <div style="font-size: 11px; color: #94a3b8; margin-top: 8px;">🔥 ${rank2.streak_days || 1}d Streak • ${rank2.completed_topics || 0}/12 Topics</div>
            </div>
        `;
    }

    // 🥇 Rank 1 (Center)
    if (rank1) {
        const initials = (rank1.name || "ST").split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
        html += `
            <div class="podium-card rank-1" style="transform: scale(1.05);">
                <span class="podium-badge gold">👑 🥇 #1 TOP CODER</span>
                <div class="podium-avatar" style="border-color: #f59e0b; background: rgba(245,158,11,0.25); color: #fbbf24; width: 78px; height: 78px; font-size: 32px;">${initials}</div>
                <h3 class="podium-name" style="color: #fbbf24; font-size: 22px;">${escapeHtml(rank1.name)}</h3>
                <div class="podium-city" style="color: var(--cyan-glow);">📍 ${escapeHtml(rank1.city || 'Kuchaman City')}</div>
                <span class="podium-xp-pill" style="border-color: #f59e0b; color: #fbbf24; font-size: 16px; background: rgba(245,158,11,0.2);">⚡ ${rank1.xp_points} XP</span>
                <div style="font-size: 12px; color: #fde68a; margin-top: 8px; font-weight: 700;">🔥 ${rank1.streak_days || 1}d Streak • ${rank1.completed_topics || 0}/12 Topics</div>
            </div>
        `;
    }

    // 🥉 Rank 3 (Right)
    if (rank3) {
        const initials = (rank3.name || "ST").split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
        html += `
            <div class="podium-card rank-3">
                <span class="podium-badge bronze">🥉 RANK #3</span>
                <div class="podium-avatar" style="border-color: #d97706; background: rgba(217,119,6,0.15); color: #f59e0b;">${initials}</div>
                <h3 class="podium-name">${escapeHtml(rank3.name)}</h3>
                <div class="podium-city">📍 ${escapeHtml(rank3.city || 'Kuchaman City')}</div>
                <span class="podium-xp-pill" style="border-color: #d97706; color: #f59e0b;">⚡ ${rank3.xp_points} XP</span>
                <div style="font-size: 11px; color: #fbbf24; margin-top: 8px;">🔥 ${rank3.streak_days || 1}d Streak • ${rank3.completed_topics || 0}/12 Topics</div>
            </div>
        `;
    }

    container.innerHTML = html;
}

function renderLeaderboardTable(students) {
    const tbody = document.getElementById("leaderboard-table-tbody");
    if (!tbody) return;

    if (!students || students.length === 0) {
        tbody.innerHTML = "<tr><td colspan='7' style='text-align:center; padding:16px; color:#64748b;'>No leaderboard data.</td></tr>";
        return;
    }

    tbody.innerHTML = "";
    students.forEach((s) => {
        const tr = document.createElement("tr");
        let rankBadge = `<strong>#${s.rank}</strong>`;
        if (s.rank === 1) rankBadge = "🥇 <strong style='color:#fbbf24;'>#1</strong>";
        else if (s.rank === 2) rankBadge = "🥈 <strong style='color:#94a3b8;'>#2</strong>";
        else if (s.rank === 3) rankBadge = "🥉 <strong style='color:#d97706;'>#3</strong>";

        tr.innerHTML = `
            <td>${rankBadge}</td>
            <td>
                <strong style="color: #fff; font-size: 13px;">${escapeHtml(s.name)}</strong><br>
                <span style="font-size: 11px; color: #64748b; font-family: monospace;">${s.masked_phone}</span>
            </td>
            <td>📍 ${escapeHtml(s.city || 'Kuchaman City')}</td>
            <td><span style="background:rgba(0,240,255,0.1); color:var(--cyan-glow); padding:2px 8px; border-radius:10px; font-weight:700; font-size:11px;">${s.level_title}</span></td>
            <td><strong>${s.completed_topics || 0} / 12</strong></td>
            <td>🔥 ${s.streak_days || 1}d</td>
            <td><strong style="color: #34d399; font-size: 13px;">⚡ ${s.xp_points} XP</strong></td>
        `;
        tbody.appendChild(tr);
    });
}

// ==============================================================================
// 22. PAYMENT SCREENSHOT / SLIP UPLOAD CONTROLLER
// ==============================================================================
let selectedSlipFile = null;
let currentPayMode = "slip";

function setPaySubmissionMode(mode) {
    currentPayMode = mode;
    const btnSlip = document.getElementById("btn-pay-mode-slip");
    const btnUtr = document.getElementById("btn-pay-mode-utr");
    const containerSlip = document.getElementById("pay-mode-slip-container");
    const containerUtr = document.getElementById("pay-mode-utr-container");

    if (mode === "slip") {
        btnSlip?.classList.add("active");
        btnUtr?.classList.remove("active");
        if (containerSlip) containerSlip.style.display = "block";
        if (containerUtr) containerUtr.style.display = "none";
    } else {
        btnUtr?.classList.add("active");
        btnSlip?.classList.remove("active");
        if (containerUtr) containerUtr.style.display = "block";
        if (containerSlip) containerSlip.style.display = "none";
    }
}

function handlePaywallSlipSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("⚠️ कृपया एक वैध इमेज (फोटो/स्क्रीनशॉट) फ़ाइल चुनें!");
        return;
    }

    selectedSlipFile = file;
    const reader = new FileReader();
    reader.onload = function (e) {
        const previewImg = document.getElementById("paywall-slip-preview-img");
        const previewBox = document.getElementById("paywall-slip-preview-box");
        const labelText = document.getElementById("paywall-slip-label-text");
        if (previewImg) previewImg.src = e.target.result;
        if (previewBox) previewBox.style.display = "block";
        if (labelText) labelText.innerText = `✅ Selected: ${file.name.substring(0, 20)}...`;
    };
    reader.readAsDataURL(file);
}

function clearPaywallSlip() {
    selectedSlipFile = null;
    const fileInput = document.getElementById("paywall-slip-file");
    const previewBox = document.getElementById("paywall-slip-preview-box");
    const labelText = document.getElementById("paywall-slip-label-text");
    if (fileInput) fileInput.value = "";
    if (previewBox) previewBox.style.display = "none";
    if (labelText) labelText.innerText = "Click to Select Payment Screenshot";
}

async function submitCoursePaymentSlip() {
    const nameInput = document.getElementById("input-payment-name");
    const phoneInput = document.getElementById("input-payment-phone");
    const optionalUtr = document.getElementById("input-payment-slip-utr")?.value.trim() || "";
    const statusMsg = document.getElementById("payment-status-message");
    const btn = document.getElementById("btn-submit-slip");

    let studentName = activeStudent ? activeStudent.name : nameInput?.value.trim();
    let studentPhone = activeStudent ? activeStudent.phone : phoneInput?.value.trim();
    let studentId = activeStudent ? activeStudent.id : "";

    if (!studentPhone) {
        alert("⚠️ कृपया अपना 10-अंकों का मोबाइल नंबर दर्ज करें!");
        if (phoneInput) phoneInput.focus();
        return;
    }

    if (!selectedSlipFile && !optionalUtr) {
        alert("⚠️ कृपया पेमेंट का स्क्रीनशॉट चुनें या UTR नंबर दर्ज करें!");
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.innerText = "⏳ Uploading Screenshot & Verifying...";
    }

    const formData = new FormData();
    formData.append("user_id", studentId || "");
    formData.append("name", studentName || `Student ${studentPhone.slice(-4)}`);
    formData.append("phone", studentPhone);
    formData.append("amount", "299");
    formData.append("utr_number", optionalUtr);
    if (selectedSlipFile) {
        formData.append("slip_image", selectedSlipFile);
    }

    try {
        const res = await fetch("/api/pay/upload-slip", {
            method: "POST",
            body: formData
        });
        const data = await res.json();

        if (data.success) {
            if (statusMsg) {
                statusMsg.style.display = "block";
                statusMsg.style.background = "rgba(16, 185, 129, 0.15)";
                statusMsg.style.borderColor = "#10b981";
                statusMsg.style.color = "#34d399";
                statusMsg.innerHTML = `<strong>✅ पेमेंट प्रमाण सबमिट हो गया!</strong><br>${data.message}`;
            }

            const waProofWrap = document.getElementById("paywall-wa-proof-container");
            const waProofBtn = document.getElementById("paywall-wa-proof-btn");
            if (waProofWrap && waProofBtn) {
                const text = `नमस्ते रोहित सर! मैंने Python Sikho VIP (₹299) के लिए पेमेंट कर दिया है।\nनाम: ${studentName}\nमोबाइल: ${studentPhone}\nUTR: ${optionalUtr || 'Screenshot attached'}\nकृपया मेरा VIP कोर्स एक्टिव करें!`;
                waProofBtn.href = `https://api.whatsapp.com/send?phone=917627060647&text=${encodeURIComponent(text)}`;
                waProofWrap.style.display = "block";
            }

            // Update local user state
            if (activeStudent) {
                activeStudent.subscription_status = "pending_approval";
                localStorage.setItem("python_sikho_student", JSON.stringify(activeStudent));
                setActiveStudent(activeStudent);
            }
        } else {
            alert(data.message || "पेमेंट सबमिट करने में समस्या हुई!");
        }
    } catch (e) {
        alert("Error: " + e);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerText = "📤 Submit Screenshot & Unlock VIP ➜";
        }
    }
}

// ==============================================================================
// 23. LEAD CAPTURE POPUP (30-PAGE HANDBOOK MAGNET)
// ==============================================================================
function openLeadCheatsheetModal() {
    const modal = document.getElementById("modal-lead-cheatsheet");
    if (modal) {
        modal.style.display = "flex";
        if (activeStudent) {
            const nInput = document.getElementById("lead-input-name");
            const pInput = document.getElementById("lead-input-phone");
            const cInput = document.getElementById("lead-input-city");
            if (nInput) nInput.value = activeStudent.name || "";
            if (pInput) pInput.value = activeStudent.phone || "";
            if (cInput) cInput.value = activeStudent.city || "Kuchaman City";
        }
    }
}

function closeLeadCheatsheetModal() {
    const modal = document.getElementById("modal-lead-cheatsheet");
    if (modal) modal.style.display = "none";
}

async function submitLeadCapture() {
    const nameInput = document.getElementById("lead-input-name");
    const phoneInput = document.getElementById("lead-input-phone");
    const cityInput = document.getElementById("lead-input-city");
    const statusBox = document.getElementById("lead-status-msg");
    const btn = document.getElementById("btn-submit-lead");

    const name = nameInput?.value.trim() || "";
    const phone = phoneInput?.value.trim().replace(/\D/g, "") || "";
    const city = cityInput?.value.trim() || "Kuchaman City";

    if (!name) {
        alert("⚠️ कृपया अपना पूरा नाम दर्ज करें!");
        nameInput?.focus();
        return;
    }
    if (!phone || phone.length !== 10) {
        alert("⚠️ कृपया 10-अंकों का मान्य WhatsApp नंबर दर्ज करें!");
        phoneInput?.focus();
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.innerText = "⏳ Preparing Your Handbook PDF...";
    }

    try {
        const res = await fetch("/api/leads/capture", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, phone, city })
        });
        const data = await res.json();

        if (data.success) {
            if (statusBox) {
                statusBox.style.display = "block";
                statusBox.style.background = "rgba(16, 185, 129, 0.15)";
                statusBox.style.color = "#34d399";
                statusBox.innerHTML = `<strong>${data.message}</strong><br>डाउनलोड शुरू हो रहा है...`;
            }

            // Trigger instant PDF download
            window.open(data.download_url || "/static/downloads/python_handbook_rohit_sir.html", "_blank");

            setTimeout(() => {
                closeLeadCheatsheetModal();
            }, 2500);
        } else {
            alert(data.message || "त्रुटि हुई, कृपया पुनः प्रयास करें।");
        }
    } catch (e) {
        alert("Error: " + e);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerText = "🚀 Download Free Handbook Now (PDF) 📥";
        }
    }
}


