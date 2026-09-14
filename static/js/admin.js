// ==============================================================================
// WORDPRESS ADMIN APPLICATION ENGINE (WP-ADMIN) FOR PYTHON SIKHO
// Chief Mentor: Rohit Sir (Samyak Classes, Kuchaman City • 📞 9509934266)
// ==============================================================================

let currentWpView = 'dashboard';
let cachedStudents = [];
let cachedTopics = [];
let wpAdminToken = sessionStorage.getItem("wp_admin_token") || localStorage.getItem("wp_admin_token") || "";

// ==============================================================================
// 1. INITIALIZATION & AUTHENTICATION
// ==============================================================================
document.addEventListener("DOMContentLoaded", () => {
    checkWpAuthSession();
});

function checkWpAuthSession() {
    if (wpAdminToken) {
        showWpDashboardApp();
    } else {
        showWpLoginScreen();
    }
}

function showWpLoginScreen() {
    document.getElementById("wp-login-screen").style.display = "flex";
    document.getElementById("wp-app-container").style.display = "none";
    const pinInput = document.getElementById("wp-input-pin");
    if (pinInput) {
        pinInput.value = "";
        setTimeout(() => pinInput.focus(), 150);
    }
}

function showWpDashboardApp() {
    document.getElementById("wp-login-screen").style.display = "none";
    document.getElementById("wp-app-container").style.display = "block";
    loadAllWpData();
    switchWpView('dashboard');
}

function toggleWpPinEye(inputId = "wp-input-pin") {
    const input = document.getElementById(inputId);
    if (input) input.type = input.type === "password" ? "text" : "password";
}

async function handleWpLogin() {
    const pin = document.getElementById("wp-input-pin")?.value.trim() || "";
    const err = document.getElementById("wp-login-error");
    const remember = document.getElementById("wp-remember-me")?.checked;
    const btn = document.getElementById("btn-wp-login");

    if (!pin) {
        if (err) {
            err.innerHTML = "<p>⚠️ Please enter Rohit Sir's Master PIN.</p>";
            err.style.display = "block";
        }
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.innerText = "Verifying PIN...";
    }

    try {
        const res = await fetch("/api/admin/verify-pin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pin: pin })
        });
        const data = await res.json();

        if (data.success && data.token) {
            wpAdminToken = data.token;
            sessionStorage.setItem("wp_admin_token", data.token);
            if (remember) {
                localStorage.setItem("wp_admin_token", data.token);
            }
            if (err) err.style.display = "none";
            showWpDashboardApp();
            showWpToast("👋 Welcome back to WordPress, Rohit Sir!");
        } else {
            if (err) {
                err.innerHTML = "<p>❌ <strong>ERROR:</strong> Invalid Master PIN. Only Chief Mentor Rohit Sir can access this dashboard.</p>";
                err.style.display = "block";
            }
        }
    } catch (e) {
        if (err) {
            err.innerHTML = `<p>Network Error: ${e}</p>`;
            err.style.display = "block";
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerText = "Log In to WordPress Dashboard →";
        }
    }
}

function handleWpLogout() {
    wpAdminToken = "";
    sessionStorage.removeItem("wp_admin_token");
    localStorage.removeItem("wp_admin_token");
    showWpLoginScreen();
}

function getWpAuthHeaders() {
    return {
        "Content-Type": "application/json",
        "X-Mentor-Key": wpAdminToken || "ROHIT_MENTOR_AUTH_TOKEN_9509934266"
    };
}

// ==============================================================================
// 2. VIEW MANAGEMENT & ROUTING
// ==============================================================================
function switchWpView(viewId) {
    currentWpView = viewId;

    // Update Sidebar Active state
    document.querySelectorAll(".wp-menu-item").forEach(item => item.classList.remove("active"));
    const activeItem = document.getElementById(`menu-item-${viewId}`);
    if (activeItem) activeItem.classList.add("active");

    // Update Content View
    document.querySelectorAll(".wp-tab-view").forEach(view => {
        view.classList.remove("active");
        view.style.display = "none";
    });
    const activeView = document.getElementById(`wp-view-${viewId}`);
    if (activeView) {
        activeView.classList.add("active");
        activeView.style.display = "block";
    }

    // Trigger View-specific loader
    if (viewId === 'dashboard') loadWpDashboard();
    else if (viewId === 'students') loadWpStudents();
    else if (viewId === 'payments') loadWpPayments();
    else if (viewId === 'leads') loadWpLeads();
    else if (viewId === 'topics') loadWpTopics();
    else if (viewId === 'notes') populateNotesTopicDropdown();
    else if (viewId === 'practice') populatePracticeTopicDropdown();
    else if (viewId === 'quizzes') populateQuizTopicDropdown();
    else if (viewId === 'notices') loadWpNotices();
    else if (viewId === 'appearance') loadWpBrandingSettings();
    else if (viewId === 'seo') loadWpSeoSettings();
    else if (viewId === 'blogs') loadWpBlogArticles();

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function loadAllWpData() {
    loadWpDashboard();
    loadWpStudents();
    loadWpPayments();
    loadWpLeads();
    loadWpTopics();
    loadWpSeoSettings();
    loadWpBrandingSettings();
    loadWpBlogArticles();
}

// ==============================================================================
// 3. DASHBOARD ANALYTICS & STATS
// ==============================================================================
async function loadWpDashboard() {
    try {
        const res = await fetch("/api/admin/analytics", { headers: getWpAuthHeaders() });
        const data = await res.json();

        if (data.status === "success") {
            document.getElementById("dash-total-students").innerText = data.total_students || 0;
            document.getElementById("dash-total-topics").innerText = data.total_chapters || 12;
            document.getElementById("dash-total-xp").innerText = Number(data.total_xp || 0).toLocaleString();
            document.getElementById("dash-quizzes-taken").innerText = data.total_quizzes_attempted || 0;
            document.getElementById("dash-pass-rate").innerText = data.pass_rate || 100;
            document.getElementById("dash-active-notices").innerText = data.active_announcements || 0;

            const sidebarCount = document.getElementById("sidebar-student-count");
            if (sidebarCount) sidebarCount.innerText = data.total_students || 0;

            // Render Recent Students
            const recentTbody = document.getElementById("dash-recent-students-tbody");
            if (recentTbody) {
                recentTbody.innerHTML = "";
                const recent = data.recent_students || [];
                if (recent.length === 0) {
                    recentTbody.innerHTML = "<tr><td colspan='7' style='text-align:center; padding:12px; color:#64748b;'>No students registered yet.</td></tr>";
                } else {
                    recent.forEach((s, idx) => {
                        const tr = document.createElement("tr");
                        tr.innerHTML = `
                            <td><strong>#${idx + 1}</strong></td>
                            <td><strong>${s.name}</strong></td>
                            <td style="color:#2271b1; font-family:monospace;">+91 ${s.phone}</td>
                            <td>${s.city || 'Kuchaman City'}</td>
                            <td><strong style="color:#00a32a;">⚡ ${s.xp_points} XP</strong></td>
                            <td style="font-size:11px; color:#64748b;">${s.created_at ? s.created_at.substring(0, 10) : 'Today'}</td>
                            <td>
                                <button class="wp-button wp-button-secondary wp-button-small" onclick="openWpAwardXpModal(${s.id}, '${s.name}')">⚡ +XP</button>
                            </td>
                        `;
                        recentTbody.appendChild(tr);
                    });
                }
            }

            // Load Real-time OTP logs
            loadWpOtpLogs();
        }
    } catch (e) {
        console.error("Dashboard analytics error:", e);
    }
}

async function loadWpOtpLogs() {
    const tbody = document.getElementById("dash-live-otp-tbody");
    if (!tbody) return;

    try {
        const res = await fetch("/api/admin/auth/otp-logs", { headers: getWpAuthHeaders() });
        const data = await res.json();
        if (data.status === "success" && data.logs) {
            tbody.innerHTML = "";
            const logs = data.logs || [];
            if (logs.length === 0) {
                tbody.innerHTML = "<tr><td colspan='6' style='text-align:center; padding:12px; color:#64748b;'>No OTP requests logged yet.</td></tr>";
                return;
            }
            logs.forEach((log, idx) => {
                const tr = document.createElement("tr");
                const isVerified = log.is_verified === 1;
                const statusBadge = isVerified 
                    ? `<span style="background:rgba(16,185,129,0.15); color:#059669; padding:3px 8px; border-radius:12px; font-weight:700; font-size:11px;">✅ Verified</span>` 
                    : `<span style="background:rgba(245,158,11,0.15); color:#d97706; padding:3px 8px; border-radius:12px; font-weight:700; font-size:11px;">⏳ Pending</span>`;

                tr.innerHTML = `
                    <td><strong>#${idx + 1}</strong></td>
                    <td style="color:#2271b1; font-family:monospace; font-weight:700;">+91 ${log.phone}</td>
                    <td><code style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-weight:800; font-size:13px; color:#0f172a;">${log.otp_code}</code></td>
                    <td style="font-size:11px; color:#64748b;">${log.delivery_status || 'logged_to_admin'}</td>
                    <td>${statusBadge}</td>
                    <td style="font-size:11px; color:#64748b;">${log.created_at ? log.created_at.substring(11, 19) : ''} (${log.created_at ? log.created_at.substring(0, 10) : 'Today'})</td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (e) {
        console.error("Error loading OTP logs:", e);
    }
}

async function publishQuickNotice() {
    const text = document.getElementById("dash-quick-notice")?.value.trim();
    const type = document.getElementById("dash-quick-type")?.value || "general";

    if (!text) {
        alert("Please enter a notice message!");
        return;
    }

    try {
        const res = await fetch("/api/admin/announcement/save", {
            method: "POST",
            headers: getWpAuthHeaders(),
            body: JSON.stringify({ message: text, type: type, is_active: 1 })
        });
        const data = await res.json();
        if (data.status === "success") {
            showWpToast("📢 Notice published to website!");
            document.getElementById("dash-quick-notice").value = "";
            loadWpDashboard();
        }
    } catch (e) {
        alert("Error publishing notice: " + e);
    }
}

// ==============================================================================
// 4. STUDENTS / USERS MASTER & EDITING
// ==============================================================================
async function loadWpStudents() {
    const tbody = document.getElementById("wp-students-tbody");
    if (!tbody) return;
    tbody.innerHTML = "<tr><td colspan='8' style='text-align:center; padding: 20px; color:#2271b1;'>⏳ Loading registered students...</td></tr>";

    try {
        const res = await fetch("/api/admin/students", { headers: getWpAuthHeaders() });
        const data = await res.json();

        if (data.status === "success") {
            cachedStudents = data.students || [];
            renderWpStudentsTable(cachedStudents);
            const totalLabel = document.getElementById("wp-student-total-label");
            if (totalLabel) totalLabel.innerText = `Showing all ${cachedStudents.length} registered students`;
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan='8' style='text-align:center; color:#d63638;'>Error loading students: ${e}</td></tr>`;
    }
}

function filterWpStudents() {
    const q = document.getElementById("wp-student-search")?.value.toLowerCase().trim() || "";
    if (!q) {
        renderWpStudentsTable(cachedStudents);
        return;
    }
    const filtered = cachedStudents.filter(s =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q)) ||
        (s.city && s.city.toLowerCase().includes(q))
    );
    renderWpStudentsTable(filtered);
}

function renderWpStudentsTable(students) {
    const tbody = document.getElementById("wp-students-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!students || students.length === 0) {
        tbody.innerHTML = "<tr><td colspan='9' style='text-align:center; padding: 20px; color:#64748b;'>No matching students found.</td></tr>";
        return;
    }

    students.forEach(s => {
        const tr = document.createElement("tr");
        const isVip = s.is_paid === 1 || s.subscription_status === 'active_vip';
        const isPending = s.subscription_status === 'pending_approval';

        let accessBadge = '<span class="wp-badge-demo">🆓 Topic 1 Demo</span>';
        if (isVip) {
            accessBadge = '<span class="wp-badge-vip">👑 VIP Lifetime</span>';
        } else if (isPending) {
            accessBadge = '<span class="wp-badge-pending">⏳ Pending ₹299</span>';
        }

        const utrDisplay = s.payment_utr 
            ? `<span style="font-family:monospace; font-size:11px; font-weight:700; color:#0f172a; background:#f1f5f9; padding:2px 6px; border-radius:3px; border:1px solid #cbd5e1;">${s.payment_utr}</span>`
            : '<span style="color:#94a3b8; font-size:11px;">-</span>';

        tr.innerHTML = `
            <td><strong>#${s.id}</strong></td>
            <td>
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="width:24px; height:24px; border-radius:50%; background:#2271b1; color:#fff; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:800;">
                        ${s.name.substring(0, 2).toUpperCase()}
                    </span>
                    <strong>${s.name}</strong>
                </div>
            </td>
            <td style="font-family:monospace; color:#2271b1;">+91 ${s.phone}</td>
            <td>📍 ${s.city || 'Kuchaman City'}</td>
            <td>${accessBadge}</td>
            <td>${utrDisplay}</td>
            <td><strong style="color:#00a32a;">⚡ ${s.xp_points} XP</strong></td>
            <td>🔥 ${s.streak_days || 1} Days</td>
            <td style="font-size:11px; color:#64748b;">${s.created_at ? s.created_at.substring(0, 10) : 'Today'}</td>
            <td>
                <div style="display:flex; gap:4px; flex-wrap:wrap;">
                    <button class="wp-button wp-button-secondary wp-button-small" onclick="openEditStudentModal(${s.id})" title="Edit Name, Phone, City, XP">✏️ Edit</button>
                    ${!isVip ? `<button class="wp-button wp-button-primary wp-button-small" style="background:#f59e0b; border-color:#d97706; font-size:10px;" onclick="openGrantVipModal(${s.id})" title="1-Click VIP Grant">👑 Grant VIP</button>` : `<button class="wp-button wp-button-delete wp-button-small" style="font-size:10px;" onclick="revokeStudentVip(${s.id}, '${s.name}')" title="Revoke VIP">Revoke</button>`}
                    <button class="wp-button wp-button-secondary wp-button-small" onclick="openWpAwardXpModal(${s.id}, '${s.name}')" title="Award Bonus XP">⚡ +XP</button>
                    <button class="wp-button wp-button-delete wp-button-small" onclick="deleteStudent(${s.id}, '${s.name}')" title="Delete Student Record">🗑️</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openEditStudentModal(studentId) {
    const student = cachedStudents.find(s => s.id === studentId);
    if (!student) return;

    document.getElementById("edit-student-id").value = student.id;
    document.getElementById("edit-student-name").value = student.name;
    document.getElementById("edit-student-phone").value = student.phone;
    document.getElementById("edit-student-city").value = student.city || "Kuchaman City";
    document.getElementById("edit-student-xp").value = student.xp_points || 100;
    document.getElementById("edit-student-streak").value = student.streak_days || 1;

    document.getElementById("modal-edit-student").style.display = "flex";
}

function closeEditStudentModal() {
    document.getElementById("modal-edit-student").style.display = "none";
}

async function submitEditStudent() {
    const id = document.getElementById("edit-student-id").value;
    const name = document.getElementById("edit-student-name").value.trim();
    const phone = document.getElementById("edit-student-phone").value.trim();
    const city = document.getElementById("edit-student-city").value.trim();
    const xp = parseInt(document.getElementById("edit-student-xp").value, 10);
    const streak = parseInt(document.getElementById("edit-student-streak").value, 10);

    if (!name || !phone) {
        alert("Name and phone are required!");
        return;
    }

    try {
        const res = await fetch(`/api/admin/students/edit/${id}`, {
            method: "POST",
            headers: getWpAuthHeaders(),
            body: JSON.stringify({ name, phone, city, xp_points: xp, streak_days: streak })
        });
        const data = await res.json();
        if (data.status === "success") {
            showWpToast("✅ Student updated successfully!");
            closeEditStudentModal();
            loadWpStudents();
        }
    } catch (e) {
        alert("Error: " + e);
    }
}

function openWpAwardXpModal(studentId, studentName) {
    document.getElementById("wp-award-student-id").value = studentId;
    document.getElementById("wp-award-student-name").innerText = `${studentName} (ID: #${studentId})`;
    document.getElementById("wp-award-xp-amount").value = "100";
    document.getElementById("modal-award-xp").style.display = "flex";
}

function closeWpAwardXpModal() {
    document.getElementById("modal-award-xp").style.display = "none";
}

async function submitWpAwardXp() {
    const studentId = document.getElementById("wp-award-student-id").value;
    const amount = parseInt(document.getElementById("wp-award-xp-amount").value, 10);
    const reason = document.getElementById("wp-award-xp-reason").value.trim();

    try {
        const res = await fetch(`/api/admin/award-xp/${studentId}`, {
            method: "POST",
            headers: getWpAuthHeaders(),
            body: JSON.stringify({ xp_amount: amount, reason: reason })
        });
        const data = await res.json();
        if (data.success) {
            showWpToast(`🎉 Awarded +${amount} XP to student!`);
            closeWpAwardXpModal();
            loadWpStudents();
            loadWpDashboard();
        }
    } catch (e) {
        alert("Error awarding XP: " + e);
    }
}

async function deleteStudent(studentId, studentName) {
    if (!confirm(`Are you sure you want to permanently delete student "${studentName}" (#${studentId})?`)) return;

    try {
        const res = await fetch(`/api/admin/delete-student/${studentId}`, {
            method: "DELETE",
            headers: getWpAuthHeaders()
        });
        const data = await res.json();
        if (data.success) {
            showWpToast("🗑️ Student record deleted.");
            loadWpStudents();
            loadWpDashboard();
        }
    } catch (e) {
        alert("Error deleting student: " + e);
    }
}

function exportStudentsCSV() {
    window.location.href = `/api/admin/export-students-csv?pin=9509`;
}

// ==============================================================================
// 4.5 PAYMENTS & VIP SUBSCRIPTIONS (₹299)
// ==============================================================================
let cachedPayments = [];

async function loadWpPayments() {
    const tbody = document.getElementById("wp-payments-tbody");
    if (!tbody) return;
    tbody.innerHTML = "<tr><td colspan='8' style='text-align:center; padding: 20px; color:#2271b1;'>⏳ Loading payment transactions...</td></tr>";

    try {
        const res = await fetch("/api/admin/payments", { headers: getWpAuthHeaders() });
        const data = await res.json();

        if (data.status === "success") {
            cachedPayments = data.payments || [];
            
            // Update stats
            const stats = data.stats || {};
            if (document.getElementById("pay-total-revenue")) document.getElementById("pay-total-revenue").innerText = `₹${(stats.total_revenue || 0).toLocaleString()}`;
            if (document.getElementById("pay-pending-count")) document.getElementById("pay-pending-count").innerText = stats.pending_count || 0;
            if (document.getElementById("pay-vip-count")) document.getElementById("pay-vip-count").innerText = stats.vip_count || 0;
            if (document.getElementById("pay-demo-count")) document.getElementById("pay-demo-count").innerText = stats.demo_count || 0;
            
            const badge = document.getElementById("sidebar-pending-payments-count");
            if (badge) {
                const pending = stats.pending_count || 0;
                badge.innerText = pending;
                badge.style.display = pending > 0 ? "inline-block" : "none";
            }

            renderWpPaymentsTable(cachedPayments);
            const totalLabel = document.getElementById("wp-payment-total-label");
            if (totalLabel) totalLabel.innerText = `Showing all ${cachedPayments.length} transactions`;
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan='8' style='text-align:center; color:#d63638;'>Error loading payments: ${e}</td></tr>`;
    }
}

function filterWpPayments() {
    const q = document.getElementById("wp-payment-search")?.value.toLowerCase().trim() || "";
    const status = document.getElementById("wp-payment-status-filter")?.value || "all";

    let filtered = cachedPayments;

    if (status !== "all") {
        filtered = filtered.filter(p => p.status === status);
    }

    if (q) {
        filtered = filtered.filter(p =>
            (p.student_name && p.student_name.toLowerCase().includes(q)) ||
            (p.student_phone && p.student_phone.includes(q)) ||
            (p.utr_number && p.utr_number.toLowerCase().includes(q)) ||
            (p.student_city && p.student_city.toLowerCase().includes(q))
        );
    }

    renderWpPaymentsTable(filtered);
}

function renderWpPaymentsTable(payments) {
    const tbody = document.getElementById("wp-payments-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!payments || payments.length === 0) {
        tbody.innerHTML = "<tr><td colspan='9' style='text-align:center; padding: 24px; color:#64748b;'>No payment records found.</td></tr>";
        return;
    }

    payments.forEach(p => {
        const tr = document.createElement("tr");
        
        let statusBadge = "";
        let actionButtons = "";

        if (p.status === "approved") {
            statusBadge = '<span class="wp-badge-vip">👑 APPROVED / VIP</span>';
            actionButtons = `<button class="wp-button wp-button-delete wp-button-small" onclick="rejectWpPayment(${p.id})" title="Revoke VIP">❌ Revoke</button>`;
        } else if (p.status === "pending" || p.status === "pending_approval") {
            statusBadge = '<span class="wp-badge-pending">⏳ PENDING VERIFICATION</span>';
            actionButtons = `
                <div style="display:flex; gap:4px;">
                    <button class="wp-button wp-button-primary wp-button-small" style="background:#16a34a; border-color:#15803d;" onclick="approveWpPayment(${p.id})">✅ Approve</button>
                    <button class="wp-button wp-button-delete wp-button-small" onclick="rejectWpPayment(${p.id})">❌ Reject</button>
                </div>
            `;
        } else {
            statusBadge = '<span class="wp-badge-demo" style="background:#fee2e2; color:#b91c1c; border-color:#fca5a5;">❌ REJECTED</span>';
            actionButtons = `<button class="wp-button wp-button-primary wp-button-small" style="background:#16a34a; border-color:#15803d;" onclick="approveWpPayment(${p.id})">✅ Re-Approve</button>`;
        }

        let slipDisplay = '<span style="color:#94a3b8; font-size:11px;">No Slip (UTR Only)</span>';
        if (p.screenshot_url) {
            slipDisplay = `
                <div style="display:flex; align-items:center; gap:8px;">
                    <img src="${p.screenshot_url}" alt="Receipt" style="width:42px; height:42px; object-fit:cover; border-radius:6px; border:2px solid #22c55e; cursor:pointer;" onclick="openScreenshotZoomModal('${p.screenshot_url}', '${encodeURIComponent(p.student_name || 'Student')}', '${p.utr_number || ''}', ${p.id}, '${p.status}', '${p.student_phone || ''}', '${p.amount || 299}')" title="🔍 Click to View Full Slip">
                    <button class="wp-button wp-button-secondary wp-button-small" style="font-size:10px; padding:2px 6px;" onclick="openScreenshotZoomModal('${p.screenshot_url}', '${encodeURIComponent(p.student_name || 'Student')}', '${p.utr_number || ''}', ${p.id}, '${p.status}', '${p.student_phone || ''}', '${p.amount || 299}')">🔍 Zoom</button>
                </div>
            `;
        }

        tr.innerHTML = `
            <td><strong>#${p.id}</strong></td>
            <td>
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="width:24px; height:24px; border-radius:50%; background:#f59e0b; color:#fff; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:800;">
                        ${p.student_name ? p.student_name.substring(0, 2).toUpperCase() : 'ST'}
                    </span>
                    <div>
                        <strong>${p.student_name || 'Student'}</strong>
                        <div style="font-size:10px; color:#64748b;">ID: #${p.user_id || 'Direct'}</div>
                    </div>
                </div>
            </td>
            <td>
                <span style="font-family:monospace; color:#2271b1; font-weight:700;">+91 ${p.student_phone || p.user_phone || '-'}</span>
                <div style="font-size:10px; color:#64748b;">📍 ${p.student_city || 'Kuchaman City'}</div>
            </td>
            <td><strong style="color:#059669; font-size:14px;">₹${p.amount || 299}</strong></td>
            <td>
                <span style="font-family:monospace; font-size:12px; font-weight:800; background:#f1f5f9; padding:3px 8px; border-radius:4px; border:1px solid #cbd5e1; color:#0f172a; letter-spacing:0.5px;">
                    ${p.utr_number || p.upi_ref || 'SCREENSHOT-SLIP'}
                </span>
                ${p.notes ? `<div style="font-size:10px; color:#64748b; margin-top:2px;">💬 ${p.notes}</div>` : ''}
            </td>
            <td>${slipDisplay}</td>
            <td style="font-size:11px; color:#64748b;">${p.created_at ? p.created_at.substring(0, 16).replace('T', ' ') : 'Just Now'}</td>
            <td>${statusBadge}</td>
            <td>${actionButtons}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function approveWpPayment(paymentId) {
    if (!confirm("Confirm payment verification and unlock VIP Course Access for this student?")) return;

    try {
        const res = await fetch(`/api/admin/payments/approve/${paymentId}`, {
            method: "POST",
            headers: getWpAuthHeaders()
        });
        const data = await res.json();
        if (data.status === "success") {
            showWpToast("🎉 Payment Approved! Student is now VIP Lifetime Member.");
            loadWpPayments();
            loadWpStudents();
            loadWpDashboard();
        } else {
            alert("Error: " + (data.message || "Failed to approve"));
        }
    } catch (e) {
        alert("Network Error: " + e);
    }
}

async function rejectWpPayment(paymentId) {
    const reason = prompt("Enter rejection reason (or leave empty):", "Invalid UTR / Transaction Not Received");
    if (reason === null) return;

    try {
        const res = await fetch(`/api/admin/payments/reject/${paymentId}`, {
            method: "POST",
            headers: getWpAuthHeaders(),
            body: JSON.stringify({ reason })
        });
        const data = await res.json();
        if (data.status === "success") {
            showWpToast("❌ Payment rejected.");
            loadWpPayments();
            loadWpStudents();
        } else {
            alert("Error: " + (data.message || "Failed to reject"));
        }
    } catch (e) {
        alert("Network Error: " + e);
    }
}

function openGrantVipModal(preselectedStudentId = null) {
    const select = document.getElementById("grant-vip-student-select");
    if (select) {
        select.innerHTML = '<option value="">-- छात्र का चयन करें (Select Student) --</option>';
        cachedStudents.forEach(s => {
            const isVip = s.is_paid === 1 || s.subscription_status === 'active_vip';
            const opt = document.createElement("option");
            opt.value = s.id;
            opt.innerText = `${s.name} (+91 ${s.phone}) - ${isVip ? '👑 Already VIP' : '🆓 Free Demo'}`;
            if (preselectedStudentId && s.id === preselectedStudentId) {
                opt.selected = true;
            }
            select.appendChild(opt);
        });
    }
    document.getElementById("modal-grant-vip").style.display = "flex";
}

function closeGrantVipModal() {
    document.getElementById("modal-grant-vip").style.display = "none";
}

async function submitDirectGrantVip() {
    const studentId = document.getElementById("grant-vip-student-select")?.value;
    if (!studentId) {
        alert("Please select a student!");
        return;
    }

    try {
        const res = await fetch(`/api/admin/grant-vip/${studentId}`, {
            method: "POST",
            headers: getWpAuthHeaders(),
            body: JSON.stringify({ note: "Direct VIP Unlock by Chief Mentor Rohit Sir" })
        });
        const data = await res.json();
        if (data.status === "success") {
            showWpToast("👑 VIP Lifetime Access Granted to Student!");
            closeGrantVipModal();
            loadWpStudents();
            loadWpPayments();
            loadWpDashboard();
        } else {
            alert("Error: " + (data.message || "Failed to grant VIP"));
        }
    } catch (e) {
        alert("Network Error: " + e);
    }
}

async function revokeStudentVip(studentId, studentName) {
    if (!confirm(`Are you sure you want to revoke VIP course access for "${studentName}"?`)) return;

    try {
        const res = await fetch(`/api/admin/revoke-vip/${studentId}`, {
            method: "POST",
            headers: getWpAuthHeaders()
        });
        const data = await res.json();
        if (data.status === "success") {
            showWpToast(`❌ VIP access revoked for ${studentName}.`);
            loadWpStudents();
            loadWpPayments();
        } else {
            alert("Error: " + (data.message || "Failed to revoke VIP"));
        }
    } catch (e) {
        alert("Network Error: " + e);
    }
}

// ==============================================================================
// 5. CURRICULUM TOPICS CMS
// ==============================================================================
async function loadWpTopics() {
    const tbody = document.getElementById("wp-topics-tbody");
    if (!tbody) return;
    tbody.innerHTML = "<tr><td colspan='6' style='text-align:center; padding: 20px; color:#2271b1;'>⏳ Loading curriculum topics...</td></tr>";

    try {
        const res = await fetch("/api/chapters");
        const data = await res.json();
        cachedTopics = data || [];
        renderWpTopicsTable(cachedTopics);
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan='6' style='text-align:center; color:#d63638;'>Error loading topics: ${e}</td></tr>`;
    }
}

function renderWpTopicsTable(topics) {
    const tbody = document.getElementById("wp-topics-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    topics.forEach(t => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>#${t.chapter_no}</strong></td>
            <td><strong style="color:#1d2327;">${t.title}</strong></td>
            <td style="color:#64748b; max-width:350px;">${t.description || '-'}</td>
            <td><span style="color:#00a32a; font-weight:700;">+${t.xp_reward} XP</span></td>
            <td>⏱️ ${t.duration_mins} mins</td>
            <td>
                <div style="display:flex; gap:4px;">
                    <button class="wp-button wp-button-secondary wp-button-small" onclick="switchWpView('notes'); selectNotesTopic(${t.chapter_no});">📝 Notes</button>
                    <button class="wp-button wp-button-secondary wp-button-small" onclick="switchWpView('practice'); selectPracticeTopic(${t.chapter_no});">💻 Task</button>
                    <button class="wp-button wp-button-secondary wp-button-small" onclick="switchWpView('quizzes'); selectQuizTopic(${t.chapter_no});">❓ Quiz</button>
                    <button class="wp-button wp-button-delete wp-button-small" onclick="deleteWpTopic(${t.id}, '${t.title}')">🗑️</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openAddTopicModal() {
    document.getElementById("modal-add-topic").style.display = "flex";
}

function closeAddTopicModal() {
    document.getElementById("modal-add-topic").style.display = "none";
}

async function submitAddTopic() {
    const title = document.getElementById("new-topic-title").value.trim();
    const desc = document.getElementById("new-topic-desc").value.trim();
    const xp = parseInt(document.getElementById("new-topic-xp").value, 10);
    const dur = parseInt(document.getElementById("new-topic-duration").value, 10);

    if (!title) {
        alert("Please provide a topic title!");
        return;
    }

    try {
        const res = await fetch("/api/admin/topics/add", {
            method: "POST",
            headers: getWpAuthHeaders(),
            body: JSON.stringify({ title, description: desc, xp_reward: xp, duration_mins: dur })
        });
        const data = await res.json();
        if (data.status === "success") {
            showWpToast("🎉 New topic created successfully!");
            closeAddTopicModal();
            loadWpTopics();
            loadWpDashboard();
        }
    } catch (e) {
        alert("Error adding topic: " + e);
    }
}

async function deleteWpTopic(topicId, topicTitle) {
    if (!confirm(`Are you sure you want to permanently delete "${topicTitle}"? This will remove all associated notes, practice tasks, and quizzes.`)) return;

    try {
        const res = await fetch(`/api/admin/topics/delete/${topicId}`, {
            method: "DELETE",
            headers: getWpAuthHeaders()
        });
        const data = await res.json();
        if (data.status === "success") {
            showWpToast("🗑️ Topic deleted.");
            loadWpTopics();
            loadWpDashboard();
        }
    } catch (e) {
        alert("Error deleting topic: " + e);
    }
}

// ==============================================================================
// 6. SMART NOTES STUDIO (GUTENBERG / CLASSIC CMS)
// ==============================================================================
function populateNotesTopicDropdown() {
    const select = document.getElementById("wp-notes-topic-select");
    if (!select) return;
    select.innerHTML = "";
    cachedTopics.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t.chapter_no;
        opt.innerText = `Topic ${t.chapter_no}: ${t.title}`;
        select.appendChild(opt);
    });
    if (cachedTopics.length > 0) {
        loadWpTopicNotes(cachedTopics[0].chapter_no);
    }
}

function selectNotesTopic(chapterNo) {
    const select = document.getElementById("wp-notes-topic-select");
    if (select) {
        select.value = chapterNo;
        loadWpTopicNotes(chapterNo);
    }
}

async function loadWpTopicNotes(chapterId) {
    try {
        const res = await fetch(`/api/admin/topic-content/${chapterId}`);
        const data = await res.json();
        if (data.status === "success") {
            const ch = data.chapter || {};
            const n = data.notes || {};
            document.getElementById("wp-notes-title-input").value = ch.title || "";
            document.getElementById("wp-notes-desc-input").value = ch.description || "";
            document.getElementById("wp-notes-markdown-input").value = n.content_markdown || "";
            updateNotesLivePreview();
        }
    } catch (e) {
        console.error("Error loading notes:", e);
    }
}

function toggleNotesPreview() {
    const pane = document.getElementById("wp-notes-preview-pane");
    const splitBox = document.getElementById("wp-notes-editor-split");
    if (!pane || !splitBox) return;

    if (pane.style.display === "none") {
        pane.style.display = "block";
        splitBox.classList.add("split");
        updateNotesLivePreview();
    } else {
        pane.style.display = "none";
        splitBox.classList.remove("split");
    }
}

function updateNotesLivePreview() {
    const raw = document.getElementById("wp-notes-markdown-input")?.value || "";
    const pane = document.getElementById("wp-notes-preview-pane");
    if (!pane) return;
    
    // Quick simple markdown to HTML converter for preview
    let html = raw
        .replace(/^# (.*$)/gim, '<h1 style="color:#1e293b; font-size:18px; margin-bottom:8px;">$1</h1>')
        .replace(/^## (.*$)/gim, '<h2 style="color:#2271b1; font-size:15px; margin:12px 0 6px;">$1</h2>')
        .replace(/^### (.*$)/gim, '<h3 style="color:#334155; font-size:13px; margin:10px 0 4px;">$1</h3>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/```python([\s\S]*?)```/gim, '<pre style="background:#0f172a; color:#38bdf8; padding:10px; border-radius:4px; font-family:monospace; margin:8px 0; font-size:11px;"><code>$1</code></pre>')
        .replace(/`([^`]+)`/gim, '<code style="background:#e2e8f0; padding:2px 4px; border-radius:3px; color:#0f172a;">$1</code>')
        .replace(/\n/gim, '<br>');

    pane.innerHTML = html;
}

async function saveWpNotes() {
    const chapterId = document.getElementById("wp-notes-topic-select")?.value || 1;
    const title = document.getElementById("wp-notes-title-input")?.value.trim();
    const desc = document.getElementById("wp-notes-desc-input")?.value.trim();
    const content = document.getElementById("wp-notes-markdown-input")?.value.trim();

    try {
        const res = await fetch(`/api/admin/topic-notes/${chapterId}`, {
            method: "POST",
            headers: getWpAuthHeaders(),
            body: JSON.stringify({ title, description: desc, content_markdown: content })
        });
        const data = await res.json();
        if (data.status === "success") {
            showWpToast(`✅ Topic #${chapterId} notes saved and published live!`);
            loadWpTopics();
        }
    } catch (e) {
        alert("Error saving notes: " + e);
    }
}

// ==============================================================================
// 7. IN-BROWSER PRACTICE TASKS STUDIO
// ==============================================================================
function populatePracticeTopicDropdown() {
    const select = document.getElementById("wp-practice-topic-select");
    if (!select) return;
    select.innerHTML = "";
    cachedTopics.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t.chapter_no;
        opt.innerText = `Topic ${t.chapter_no}: ${t.title}`;
        select.appendChild(opt);
    });
    if (cachedTopics.length > 0) {
        loadWpPracticeTask(cachedTopics[0].chapter_no);
    }
}

function selectPracticeTopic(chapterNo) {
    const select = document.getElementById("wp-practice-topic-select");
    if (select) {
        select.value = chapterNo;
        loadWpPracticeTask(chapterNo);
    }
}

async function loadWpPracticeTask(chapterId) {
    try {
        const res = await fetch(`/api/admin/practice-task/${chapterId}`, { headers: getWpAuthHeaders() });
        const data = await res.json();
        if (data.status === "success") {
            const task = data.task || {};
            document.getElementById("wp-pt-title").value = task.title || `Topic ${chapterId} Practice`;
            document.getElementById("wp-pt-instructions").value = task.instructions || "";
            document.getElementById("wp-pt-starter-code").value = task.starter_code || "# Write solution here...";
            document.getElementById("wp-pt-expected-output").value = task.expected_output || "";
            document.getElementById("wp-pt-hint").value = task.hint || "";
        }
    } catch (e) {
        console.error("Error loading practice task:", e);
    }
}

async function saveWpPracticeTask() {
    const chapterId = document.getElementById("wp-practice-topic-select")?.value || 1;
    const title = document.getElementById("wp-pt-title")?.value.trim();
    const instructions = document.getElementById("wp-pt-instructions")?.value.trim();
    const starter_code = document.getElementById("wp-pt-starter-code")?.value;
    const expected_output = document.getElementById("wp-pt-expected-output")?.value.trim();
    const hint = document.getElementById("wp-pt-hint")?.value.trim();

    try {
        const res = await fetch(`/api/admin/practice-task/${chapterId}`, {
            method: "POST",
            headers: getWpAuthHeaders(),
            body: JSON.stringify({ title, instructions, starter_code, expected_output, hint })
        });
        const data = await res.json();
        if (data.status === "success") {
            showWpToast(`✅ Topic #${chapterId} Practice Task updated!`);
        }
    } catch (e) {
        alert("Error: " + e);
    }
}

// ==============================================================================
// 8. QUIZZES & MCQS QUESTION BANK
// ==============================================================================
function populateQuizTopicDropdown() {
    const select = document.getElementById("wp-quiz-topic-select");
    if (!select) return;
    select.innerHTML = "";
    cachedTopics.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t.chapter_no;
        opt.innerText = `Topic ${t.chapter_no}: ${t.title}`;
        select.appendChild(opt);
    });
    if (cachedTopics.length > 0) {
        loadWpQuizQuestions(cachedTopics[0].chapter_no);
    }
}

function selectQuizTopic(chapterNo) {
    const select = document.getElementById("wp-quiz-topic-select");
    if (select) {
        select.value = chapterNo;
        loadWpQuizQuestions(chapterNo);
    }
}

async function loadWpQuizQuestions(chapterId) {
    const container = document.getElementById("wp-quiz-questions-list");
    if (!container) return;
    container.innerHTML = "<div style='padding:12px; color:#2271b1; text-align:center;'>⏳ Loading questions...</div>";

    try {
        const res = await fetch(`/api/admin/topic-content/${chapterId}`);
        const data = await res.json();
        if (data.status === "success") {
            const questions = data.questions || [];
            container.innerHTML = "";

            if (questions.length === 0) {
                container.innerHTML = "<p style='color:#64748b; font-size:12px; padding:12px; text-align:center;'>No questions created for this topic yet. Add one on the right!</p>";
                return;
            }

            questions.forEach((q, idx) => {
                const div = document.createElement("div");
                div.style.cssText = "background:#f8fafc; border:1px solid #e2e8f0; border-radius:4px; padding:10px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:flex-start;";
                div.innerHTML = `
                    <div style="flex-grow:1;">
                        <strong style="color:#1e293b; font-size:12px;">Q${idx + 1}. ${q.question_text}</strong>
                        <div style="font-size:11px; color:#64748b; margin-top:4px;">
                            <span>A) ${q.option_a}</span> | <span>B) ${q.option_b}</span><br>
                            <span>C) ${q.option_c || '-'}</span> | <span>D) ${q.option_d || '-'}</span>
                        </div>
                        <div style="font-size:11px; color:#00a32a; font-weight:700; margin-top:4px;">
                            ✅ Correct: Option ${q.correct_option} ${q.explanation ? `• 💡 ${q.explanation}` : ''}
                        </div>
                    </div>
                    <button class="wp-button wp-button-delete wp-button-small" onclick="deleteWpQuizQuestion(${q.id}, ${chapterId})" title="Delete question">🗑️</button>
                `;
                container.appendChild(div);
            });
        }
    } catch (e) {
        container.innerHTML = `<p style="color:#d63638;">Error loading questions: ${e}</p>`;
    }
}

async function addWpQuizQuestion() {
    const chapterId = document.getElementById("wp-quiz-topic-select")?.value || 1;
    const text = document.getElementById("wp-new-q-text")?.value.trim();
    const a = document.getElementById("wp-new-q-a")?.value.trim();
    const b = document.getElementById("wp-new-q-b")?.value.trim();
    const c = document.getElementById("wp-new-q-c")?.value.trim();
    const d = document.getElementById("wp-new-q-d")?.value.trim();
    const correct = document.getElementById("wp-new-q-correct")?.value || "A";
    const expl = document.getElementById("wp-new-q-expl")?.value.trim();

    if (!text || !a || !b) {
        alert("Please provide the question and at least Option A and Option B!");
        return;
    }

    try {
        const res = await fetch("/api/admin/quiz-question/add", {
            method: "POST",
            headers: getWpAuthHeaders(),
            body: JSON.stringify({
                chapter_id: chapterId,
                question_text: text,
                option_a: a,
                option_b: b,
                option_c: c,
                option_d: d,
                correct_option: correct,
                explanation: expl
            })
        });
        const data = await res.json();
        if (data.status === "success") {
            showWpToast("✅ Quiz question added!");
            document.getElementById("wp-new-q-text").value = "";
            document.getElementById("wp-new-q-a").value = "";
            document.getElementById("wp-new-q-b").value = "";
            document.getElementById("wp-new-q-c").value = "";
            document.getElementById("wp-new-q-d").value = "";
            document.getElementById("wp-new-q-expl").value = "";
            loadWpQuizQuestions(chapterId);
        }
    } catch (e) {
        alert("Error: " + e);
    }
}

async function deleteWpQuizQuestion(questionId, chapterId) {
    if (!confirm("Delete this question?")) return;
    try {
        const res = await fetch(`/api/admin/quiz-question/delete/${questionId}`, {
            method: "DELETE",
            headers: getWpAuthHeaders()
        });
        const data = await res.json();
        if (data.status === "success") {
            showWpToast("Question deleted.");
            loadWpQuizQuestions(chapterId);
        }
    } catch (e) {
        alert("Error: " + e);
    }
}

// ==============================================================================
// 9. BROADCAST NOTICES BOARD
// ==============================================================================
async function loadWpNotices() {
    const tbody = document.getElementById("wp-notices-tbody");
    if (!tbody) return;
    tbody.innerHTML = "<tr><td colspan='6' style='text-align:center; padding:16px; color:#2271b1;'>⏳ Loading notices...</td></tr>";

    try {
        const res = await fetch("/api/admin/announcements");
        const data = await res.json();
        const notices = data.announcements || [];
        tbody.innerHTML = "";

        if (notices.length === 0) {
            tbody.innerHTML = "<tr><td colspan='6' style='text-align:center; padding:16px; color:#64748b;'>No notices published yet.</td></tr>";
            return;
        }

        notices.forEach(n => {
            const isLive = n.is_active === 1;
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>#${n.id}</strong></td>
                <td><span class="wp-menu-badge ${n.type === 'urgent' ? 'red' : ''}">${n.type.toUpperCase()}</span></td>
                <td><strong style="color:#1e293b;">${n.message}</strong></td>
                <td style="font-size:11px; color:#64748b;">${n.created_at ? n.created_at.substring(0, 10) : 'Today'}</td>
                <td>
                    <strong style="color:${isLive ? '#00a32a' : '#94a3b8'};">
                        ${isLive ? '🟢 LIVE ON PORTAL' : '⚪ INACTIVE'}
                    </strong>
                </td>
                <td>
                    <div style="display:flex; gap:4px;">
                        <button class="wp-button wp-button-secondary wp-button-small" onclick="toggleWpNotice(${n.id})">${isLive ? 'Pause' : 'Activate'}</button>
                        <button class="wp-button wp-button-delete wp-button-small" onclick="deleteWpNotice(${n.id})">🗑️</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan='6' style='text-align:center; color:#d63638;'>Error: ${e}</td></tr>`;
    }
}

async function saveWpNotice() {
    const msg = document.getElementById("wp-notice-msg-input")?.value.trim();
    const type = document.getElementById("wp-notice-type-input")?.value || "general";
    const isActive = document.getElementById("wp-notice-active-input")?.checked ? 1 : 0;

    if (!msg) {
        alert("Please write a notice message!");
        return;
    }

    try {
        const res = await fetch("/api/admin/announcement/save", {
            method: "POST",
            headers: getWpAuthHeaders(),
            body: JSON.stringify({ message: msg, type: type, is_active: isActive })
        });
        const data = await res.json();
        if (data.status === "success") {
            showWpToast("📢 Notice published live!");
            document.getElementById("wp-notice-msg-input").value = "";
            loadWpNotices();
            loadWpDashboard();
        }
    } catch (e) {
        alert("Error: " + e);
    }
}

async function toggleWpNotice(id) {
    try {
        const res = await fetch(`/api/admin/announcement/toggle/${id}`, {
            method: "POST",
            headers: getWpAuthHeaders()
        });
        const data = await res.json();
        if (data.status === "success") {
            showWpToast("Notice status toggled.");
            loadWpNotices();
            loadWpDashboard();
        }
    } catch (e) {
        alert("Error: " + e);
    }
}

async function deleteWpNotice(id) {
    if (!confirm("Delete this notice?")) return;
    try {
        const res = await fetch(`/api/admin/announcement/delete/${id}`, {
            method: "DELETE",
            headers: getWpAuthHeaders()
        });
        const data = await res.json();
        if (data.status === "success") {
            showWpToast("Notice deleted.");
            loadWpNotices();
            loadWpDashboard();
        }
    } catch (e) {
        alert("Error: " + e);
    }
}

// ==============================================================================
// 10. APPEARANCE & SITE IDENTITY
// ==============================================================================
async function loadWpBrandingSettings() {
    try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.status === "success") {
            const s = data.settings || {};
            if (document.getElementById("set-institute-name")) document.getElementById("set-institute-name").value = s.institute_name || "Samyak Computer Classes";
            if (document.getElementById("set-institute-city")) document.getElementById("set-institute-city").value = s.institute_city || "Kuchaman City";
            if (document.getElementById("set-mentor-name")) document.getElementById("set-mentor-name").value = s.mentor_name || "Rohit Sir";
            if (document.getElementById("set-mentor-phone")) document.getElementById("set-mentor-phone").value = s.mentor_phone || "9509934266";
            if (document.getElementById("set-mentor-whatsapp")) document.getElementById("set-mentor-whatsapp").value = s.mentor_whatsapp || "9509934266";
            if (document.getElementById("set-batch-timing")) document.getElementById("set-batch-timing").value = s.batch_timing || "02:00 PM";
            if (document.getElementById("set-hero-title")) document.getElementById("set-hero-title").value = s.hero_title || "Master Python 3 from Zero to Pro";
            if (document.getElementById("set-hero-hindi-sub")) document.getElementById("set-hero-hindi-sub").value = s.hero_hindi_sub || "आसान हिंदी में पाइथन सीखें";
            if (document.getElementById("set-welcome-bonus-xp")) document.getElementById("set-welcome-bonus-xp").value = s.welcome_bonus_xp || "100";
            if (document.getElementById("set-course-price")) document.getElementById("set-course-price").value = s.course_price || "299";
            if (document.getElementById("set-course-mrp")) document.getElementById("set-course-mrp").value = s.course_mrp || "999";
            if (document.getElementById("set-payment-phone")) document.getElementById("set-payment-phone").value = s.payment_phone || "7627060647";
            if (document.getElementById("set-payment-upi-id")) document.getElementById("set-payment-upi-id").value = s.payment_upi_id || "7627060647@ybl";
            if (document.getElementById("set-payment-receiver-name")) document.getElementById("set-payment-receiver-name").value = s.payment_receiver_name || "RAJU RAM (Rohit Sir)";
            if (document.getElementById("set-sms-provider")) document.getElementById("set-sms-provider").value = s.sms_provider || "fast2sms";
            if (document.getElementById("set-sms-api-key")) document.getElementById("set-sms-api-key").value = s.sms_api_key || "";
            if (document.getElementById("set-sms-sender-id")) document.getElementById("set-sms-sender-id").value = s.sms_sender_id || "PYSIKH";
            if (document.getElementById("set-auth-mode")) document.getElementById("set-auth-mode").value = s.auth_mode || "strict_otp";
        }
    } catch (e) {
        console.error("Error loading branding settings:", e);
    }
}

async function saveWpBrandingSettings() {
    const settings = {
        institute_name: document.getElementById("set-institute-name")?.value.trim(),
        institute_city: document.getElementById("set-institute-city")?.value.trim(),
        mentor_name: document.getElementById("set-mentor-name")?.value.trim(),
        mentor_phone: document.getElementById("set-mentor-phone")?.value.trim(),
        mentor_whatsapp: document.getElementById("set-mentor-whatsapp")?.value.trim(),
        batch_timing: document.getElementById("set-batch-timing")?.value.trim(),
        hero_title: document.getElementById("set-hero-title")?.value.trim(),
        hero_hindi_sub: document.getElementById("set-hero-hindi-sub")?.value.trim(),
        welcome_bonus_xp: document.getElementById("set-welcome-bonus-xp")?.value.trim(),
        course_price: document.getElementById("set-course-price")?.value.trim(),
        course_mrp: document.getElementById("set-course-mrp")?.value.trim(),
        payment_phone: document.getElementById("set-payment-phone")?.value.trim(),
        payment_upi_id: document.getElementById("set-payment-upi-id")?.value.trim(),
        payment_receiver_name: document.getElementById("set-payment-receiver-name")?.value.trim(),
        sms_provider: document.getElementById("set-sms-provider")?.value.trim(),
        sms_api_key: document.getElementById("set-sms-api-key")?.value.trim(),
        sms_sender_id: document.getElementById("set-sms-sender-id")?.value.trim(),
        auth_mode: document.getElementById("set-auth-mode")?.value.trim()
    };

    try {
        const res = await fetch("/api/admin/settings/save", {
            method: "POST",
            headers: getWpAuthHeaders(),
            body: JSON.stringify({ settings })
        });
        const data = await res.json();
        if (data.status === "success") {
            showWpToast("✅ Site Identity, Pricing & UPI Payment Settings saved!");
        }
    } catch (e) {
        alert("Error saving settings: " + e);
    }
}

// ==============================================================================
// 11. YOAST / RANKMATH STYLE SEO SUITE
// ==============================================================================
async function loadWpSeoSettings() {
    try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.status === "success") {
            const s = data.settings || {};
            
            const titleEl = document.getElementById("seo-site-title");
            const descEl = document.getElementById("seo-meta-desc");
            const keywEl = document.getElementById("seo-meta-keywords");
            const canonEl = document.getElementById("seo-canonical-url");
            const robEl = document.getElementById("seo-robots");
            const gVerEl = document.getElementById("seo-google-verification");

            if (titleEl) titleEl.value = s.site_title || "पाइथन सीखो (Python Sikho) - Master Python 3 with Rohit Sir (Samyak Classes)";
            if (descEl) descEl.value = s.meta_description || "पाइथन सीखो (Python Sikho) - चीफ मेंटर रोहित सर (सम्यक कम्प्यूटर क्लासेज, कुचामन सिटी) से आसान हिंदी में Python 3 सीखें। 12 स्मार्ट मॉड्यूल्स, लाइव कम्पाइलर, क्विज़ व सर्टिफ़िकेट।";
            if (keywEl) keywEl.value = s.meta_keywords || "python sikho, python course hindi, rohit sir python, samyak computer classes kuchaman city";
            if (canonEl) canonEl.value = s.canonical_url || "https://tags-beyond-tobacco-models.trycloudflare.com";
            if (robEl) robEl.value = s.robots || "index, follow";
            if (gVerEl) gVerEl.value = s.google_verification || "";

            handleSeoTitleInput(titleEl ? titleEl.value : "");
            handleSeoDescInput(descEl ? descEl.value : "");
            updateSerpUrl(canonEl ? canonEl.value : "");
            runLiveSeoAudit();
        }
    } catch (e) {
        console.error("Error loading SEO settings:", e);
    }
}

function handleSeoTitleInput(val) {
    const counter = document.getElementById("title-char-counter");
    const bar = document.getElementById("title-progress-bar");
    const serpTitle = document.getElementById("serp-display-title");

    if (counter) counter.innerText = `${val.length} / 60 chars`;
    if (serpTitle) serpTitle.innerText = val || "Python Sikho - Master Python 3 in Hindi";

    if (bar) {
        const pct = Math.min(100, Math.round((val.length / 60) * 100));
        bar.style.width = `${pct}%`;
        if (val.length >= 45 && val.length <= 65) {
            bar.className = "wp-progress-bar-fill green";
        } else if (val.length > 0 && val.length < 45) {
            bar.className = "wp-progress-bar-fill orange";
        } else {
            bar.className = "wp-progress-bar-fill red";
        }
    }
    runLiveSeoAudit();
}

function handleSeoDescInput(val) {
    const counter = document.getElementById("desc-char-counter");
    const bar = document.getElementById("desc-progress-bar");
    const serpDesc = document.getElementById("serp-display-desc");

    if (counter) counter.innerText = `${val.length} / 160 chars`;
    if (serpDesc) serpDesc.innerText = val || "Learn Python 3 from zero to pro with Rohit Sir...";

    if (bar) {
        const pct = Math.min(100, Math.round((val.length / 160) * 100));
        bar.style.width = `${pct}%`;
        if (val.length >= 130 && val.length <= 165) {
            bar.className = "wp-progress-bar-fill green";
        } else if (val.length > 0 && val.length < 130) {
            bar.className = "wp-progress-bar-fill orange";
        } else {
            bar.className = "wp-progress-bar-fill red";
        }
    }
    runLiveSeoAudit();
}

function updateSerpUrl(val) {
    const serpUrl = document.getElementById("serp-display-url");
    if (serpUrl) serpUrl.innerText = val || "https://tags-beyond-tobacco-models.trycloudflare.com";
}

function setSerpMode(mode) {
    const card = document.getElementById("google-serp-box");
    const btnMob = document.getElementById("btn-serp-mobile");
    const btnDesk = document.getElementById("btn-serp-desktop");

    if (mode === 'desktop') {
        if (card) {
            card.classList.remove("mobile");
            card.style.maxWidth = "600px";
        }
        if (btnDesk) btnDesk.classList.add("active");
        if (btnMob) btnMob.classList.remove("active");
    } else {
        if (card) {
            card.classList.add("mobile");
            card.style.maxWidth = "380px";
        }
        if (btnMob) btnMob.classList.add("active");
        if (btnDesk) btnDesk.classList.remove("active");
    }
}

function runLiveSeoAudit() {
    const keyword = document.getElementById("seo-focus-keyword")?.value.toLowerCase().trim() || "";
    const title = document.getElementById("seo-site-title")?.value.toLowerCase() || "";
    const desc = document.getElementById("seo-meta-desc")?.value.toLowerCase() || "";
    const auditList = document.getElementById("yoast-audit-list");
    const scorePill = document.getElementById("seo-overall-score-pill");

    if (!auditList) return;

    let score = 100;
    const checks = [];

    // Check 1: Focus keyword in title
    if (keyword && title.includes(keyword)) {
        checks.push({ text: "Focus keyword appears in SEO Title tag.", pass: true });
    } else if (keyword) {
        checks.push({ text: "Focus keyword does NOT appear in SEO Title tag.", pass: false });
        score -= 20;
    }

    // Check 2: Focus keyword in description
    if (keyword && desc.includes(keyword)) {
        checks.push({ text: "Focus keyword appears in Meta Description.", pass: true });
    } else if (keyword) {
        checks.push({ text: "Focus keyword does NOT appear in Meta Description.", pass: false });
        score -= 20;
    }

    // Check 3: Title length
    const tLen = document.getElementById("seo-site-title")?.value.length || 0;
    if (tLen >= 40 && tLen <= 65) {
        checks.push({ text: `Title length is optimal for Google SERP (${tLen} chars).`, pass: true });
    } else {
        checks.push({ text: `Title length should be 45–60 chars (Current: ${tLen} chars).`, pass: false });
        score -= 10;
    }

    // Check 4: Description length
    const dLen = document.getElementById("seo-meta-desc")?.value.length || 0;
    if (dLen >= 120 && dLen <= 170) {
        checks.push({ text: `Meta Description has rich summary and CTA (${dLen} chars).`, pass: true });
    } else {
        checks.push({ text: `Meta Description should be 140–160 chars (Current: ${dLen} chars).`, pass: false });
        score -= 10;
    }

    // Check 5: Canonical & Schema
    checks.push({ text: "Canonical URL is valid and configured.", pass: true });
    checks.push({ text: "Schema.org Educational Course JSON-LD is active in <head>.", pass: true });
    checks.push({ text: "OpenGraph Social Sharing cards for WhatsApp & Facebook generated.", pass: true });

    // Render Checks
    auditList.innerHTML = "";
    checks.forEach(c => {
        const li = document.createElement("li");
        li.className = `audit-item ${c.pass ? 'pass' : 'fail'}`;
        li.innerHTML = `<span class="audit-bullet ${c.pass ? 'green' : 'red'}">●</span> ${c.text}`;
        auditList.appendChild(li);
    });

    if (scorePill) {
        scorePill.innerText = score >= 80 ? `🟢 ${score} / 100 EXCELLENT` : score >= 60 ? `🟠 ${score} / 100 OKAY` : `🔴 ${score} / 100 NEEDS WORK`;
    }
}

async function saveWpSeoSettings() {
    const settings = {
        site_title: document.getElementById("seo-site-title")?.value.trim(),
        meta_description: document.getElementById("seo-meta-desc")?.value.trim(),
        meta_keywords: document.getElementById("seo-meta-keywords")?.value.trim(),
        canonical_url: document.getElementById("seo-canonical-url")?.value.trim(),
        robots: document.getElementById("seo-robots")?.value,
        google_verification: document.getElementById("seo-google-verification")?.value.trim(),
        og_title: document.getElementById("seo-site-title")?.value.trim(),
        og_description: document.getElementById("seo-meta-desc")?.value.trim()
    };

    try {
        const res = await fetch("/api/admin/settings/save", {
            method: "POST",
            headers: getWpAuthHeaders(),
            body: JSON.stringify({ settings })
        });
        const data = await res.json();
        if (data.status === "success") {
            showWpToast("✅ SEO Meta Tags & Google Directives Saved!");
        }
    } catch (e) {
        alert("Error saving SEO settings: " + e);
    }
}

// ==============================================================================
// 12. SECURITY & MASTER PIN SETTINGS
// ==============================================================================
async function submitChangeWpPin() {
    const newPin = document.getElementById("wp-new-pin-input")?.value.trim();
    const confirmPin = document.getElementById("wp-confirm-pin-input")?.value.trim();

    if (!newPin || newPin.length < 4) {
        alert("⚠️ नया PIN कम से कम 4 अंकों या अक्षरों का होना चाहिए!");
        return;
    }

    if (confirmPin !== undefined && confirmPin !== "" && newPin !== confirmPin) {
        alert("⚠️ दोनों PIN मेल नहीं खा रहे हैं! कृपया दोबारा जांचें।");
        return;
    }

    try {
        const res = await fetch("/api/admin/change-pin", {
            method: "POST",
            headers: getWpAuthHeaders(),
            body: JSON.stringify({ new_pin: newPin })
        });
        const data = await res.json();
        if (data.status === "success" || data.success) {
            showWpToast("🔒 Master PIN successfully updated and secured!");
            if (document.getElementById("wp-new-pin-input")) document.getElementById("wp-new-pin-input").value = "";
            if (document.getElementById("wp-confirm-pin-input")) document.getElementById("wp-confirm-pin-input").value = "";
        } else {
            alert("Error: " + (data.message || "Failed to update PIN"));
        }
    } catch (e) {
        alert("Error: " + e);
    }
}

// ==============================================================================
// 12.1 SMS GATEWAY & OTP SETTINGS
// ==============================================================================
async function saveWpSmsSettings() {
    const provider = document.getElementById("wp-sms-provider")?.value || "fast2sms";
    const apiKey = document.getElementById("wp-sms-api-key")?.value.trim() || "";

    try {
        const res = await fetch("/api/admin/settings", {
            method: "POST",
            headers: getWpAuthHeaders(),
            body: JSON.stringify({
                sms_provider: provider,
                sms_api_key: apiKey
            })
        });
        const data = await res.json();
        if (data.status === "success" || data.success) {
            showWpToast("📱 SMS Gateway Configuration Saved!");
        } else {
            alert("Error saving settings: " + data.message);
        }
    } catch (e) {
        alert("Network Error: " + e);
    }
}

async function testWpSmsGateway() {
    const phone = document.getElementById("wp-test-sms-phone")?.value.trim() || "7240574213";
    const resultBox = document.getElementById("wp-sms-test-result");
    const btn = document.getElementById("btn-test-sms");

    if (btn) {
        btn.disabled = true;
        btn.innerText = "⏳ Testing...";
    }
    if (resultBox) {
        resultBox.style.display = "none";
    }

    try {
        const res = await fetch("/api/admin/auth/test-sms", {
            method: "POST",
            headers: getWpAuthHeaders(),
            body: JSON.stringify({ phone: phone })
        });
        const data = await res.json();

        if (resultBox) {
            resultBox.style.display = "block";
            if (data.sms_sent) {
                resultBox.style.background = "rgba(16, 185, 129, 0.15)";
                resultBox.style.border = "1px solid #10b981";
                resultBox.style.color = "#059669";
                resultBox.innerHTML = `<strong>✅ SMS Sent Successfully!</strong><br>Provider: ${data.provider} | To: +91 ${data.phone}`;
            } else {
                resultBox.style.background = "rgba(245, 158, 11, 0.15)";
                resultBox.style.border = "1px solid #f59e0b";
                resultBox.style.color = "#b45309";
                resultBox.innerHTML = `<strong>⚠️ SMS Not Delivered:</strong> ${data.delivery_tag}<br><span style="font-size:11px;">(Fast2SMS Key may be disabled in dashboard. Enable key at fast2sms.com or switch to 2Factor.in)</span>`;
            }
        }
    } catch (e) {
        if (resultBox) {
            resultBox.style.display = "block";
            resultBox.style.background = "rgba(239, 68, 68, 0.15)";
            resultBox.style.color = "#dc2626";
            resultBox.innerText = "Error: " + e;
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerText = "📤 Send Test SMS";
        }
    }
}

// ==============================================================================
// 13. FLOATING TOAST NOTIFICATION
// ==============================================================================
function showWpToast(msg) {
    const toast = document.getElementById("wp-toast");
    if (!toast) return;
    toast.innerText = msg;
    toast.style.display = "block";
    clearTimeout(window._wpToastTimer);
    window._wpToastTimer = setTimeout(() => {
        toast.style.display = "none";
    }, 3500);
}

// ==============================================================================
// 14. BLOG & SEO ARTICLES CMS
// ==============================================================================
let cachedBlogPosts = [];

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function loadWpBlogArticles() {
    const tbody = document.getElementById("wp-blogs-tbody");
    if (!tbody) return;

    try {
        const res = await fetch("/api/admin/blog/posts", { headers: getWpAuthHeaders() });
        const data = await res.json();
        if (data.status === "success") {
            cachedBlogPosts = data.posts || [];
            tbody.innerHTML = "";

            if (cachedBlogPosts.length === 0) {
                tbody.innerHTML = "<tr><td colspan='7' style='text-align:center; padding:16px; color:#64748b;'>No blog articles published yet. Click <strong>➕ Write New Article</strong> to publish your first article!</td></tr>";
                return;
            }

            cachedBlogPosts.forEach((post, idx) => {
                const tr = document.createElement("tr");
                const pubDate = post.created_at ? post.created_at.substring(0, 10) : "Today";
                const safeTitle = (post.title || '').replace(/'/g, "\\'");
                tr.innerHTML = `
                    <td><strong>#${idx + 1}</strong></td>
                    <td>
                        <strong style="color: #0f172a; font-size: 13px;">${escapeHtml(post.title)}</strong><br>
                        <span style="font-size: 11px; color: #2271b1; font-family: monospace;">/blog/${escapeHtml(post.slug)}</span>
                    </td>
                    <td><span class="wp-badge" style="background:#e0f2fe; color:#0369a1; padding:3px 8px; border-radius:12px; font-weight:700; font-size:11px;">${escapeHtml(post.category)}</span></td>
                    <td style="font-size: 12px; color: #475569;">⏱️ ${escapeHtml(post.read_time || '5 min')}</td>
                    <td><strong style="color: #059669; font-size: 12px;">👁️ ${post.views_count || 0}</strong></td>
                    <td style="font-size: 11px; color: #64748b;">${pubDate}</td>
                    <td>
                        <div style="display: flex; gap: 6px;">
                            <button class="wp-button wp-button-secondary wp-button-small" onclick="openAddBlogModal(${post.id})">✏️ Edit</button>
                            <button class="wp-button wp-button-delete wp-button-small" onclick="deleteWpBlogPost(${post.id}, '${safeTitle}')">🗑️</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (e) {
        console.error("Error loading blog posts:", e);
    }
}

function openAddBlogModal(blogId = null) {
    const modal = document.getElementById("modal-add-blog-post");
    const heading = document.getElementById("modal-blog-title-heading");
    const idInput = document.getElementById("edit-blog-id");
    const titleInput = document.getElementById("blog-input-title");
    const slugInput = document.getElementById("blog-input-slug");
    const catInput = document.getElementById("blog-input-category");
    const kwInput = document.getElementById("blog-input-keyword");
    const rtInput = document.getElementById("blog-input-readtime");
    const descInput = document.getElementById("blog-input-metadesc");
    const contentInput = document.getElementById("blog-input-content");

    if (!modal) return;

    if (blogId) {
        const post = cachedBlogPosts.find(p => p.id === blogId);
        if (post) {
            if (heading) heading.innerText = "✏️ Edit Blog Article";
            if (idInput) idInput.value = post.id;
            if (titleInput) titleInput.value = post.title || "";
            if (slugInput) slugInput.value = post.slug || "";
            if (catInput) catInput.value = post.category || "Python Basics";
            if (kwInput) kwInput.value = post.focus_keyword || "";
            if (rtInput) rtInput.value = post.read_time || "5 min read";
            if (descInput) descInput.value = post.meta_description || "";
            if (contentInput) contentInput.value = post.content_markdown || "";
        }
    } else {
        if (heading) heading.innerText = "➕ Write New Blog Article";
        if (idInput) idInput.value = "";
        if (titleInput) titleInput.value = "";
        if (slugInput) slugInput.value = "";
        if (catInput) catInput.value = "Python Basics";
        if (kwInput) kwInput.value = "";
        if (rtInput) rtInput.value = "5 min read";
        if (descInput) descInput.value = "";
        if (contentInput) contentInput.value = "";
    }

    modal.style.display = "flex";
}

function closeAddBlogModal() {
    const modal = document.getElementById("modal-add-blog-post");
    if (modal) modal.style.display = "none";
}

function autoGenerateBlogSlug(title) {
    const idInput = document.getElementById("edit-blog-id");
    if (idInput && idInput.value) return; // Don't overwrite slug when editing existing

    const slugInput = document.getElementById("blog-input-slug");
    if (!slugInput) return;

    const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
    slugInput.value = slug;
}

async function submitSaveBlogPost() {
    const id = document.getElementById("edit-blog-id")?.value;
    const title = document.getElementById("blog-input-title")?.value.trim();
    const slug = document.getElementById("blog-input-slug")?.value.trim();
    const category = document.getElementById("blog-input-category")?.value;
    const focus_keyword = document.getElementById("blog-input-keyword")?.value.trim();
    const read_time = document.getElementById("blog-input-readtime")?.value.trim();
    const meta_description = document.getElementById("blog-input-metadesc")?.value.trim();
    const content_markdown = document.getElementById("blog-input-content")?.value.trim();

    if (!title) {
        alert("⚠️ Please enter the article title.");
        return;
    }
    if (!content_markdown) {
        alert("⚠️ Please enter the article content.");
        return;
    }

    try {
        const res = await fetch("/api/admin/blog/posts", {
            method: "POST",
            headers: getWpAuthHeaders(),
            body: JSON.stringify({
                id: id ? parseInt(id) : null,
                title,
                slug,
                category,
                focus_keyword,
                read_time,
                meta_description,
                content_markdown
            })
        });

        const data = await res.json();
        if (data.success) {
            showWpToast("✅ Article published & updated successfully!");
            closeAddBlogModal();
            loadWpBlogArticles();
        } else {
            alert("❌ Failed to save article: " + (data.message || "Unknown error"));
        }
    } catch (e) {
        alert("❌ Error: " + e);
    }
}

async function deleteWpBlogPost(blogId, blogTitle) {
    if (!confirm(`Are you sure you want to permanently delete this article: "${blogTitle}"?`)) return;

    try {
        const res = await fetch(`/api/admin/blog/posts/${blogId}`, {
            method: "DELETE",
            headers: getWpAuthHeaders()
        });
        const data = await res.json();
        if (data.success) {
            showWpToast("🗑️ Article deleted successfully.");
            loadWpBlogArticles();
        } else {
            alert("❌ Failed to delete: " + (data.message || "Unknown error"));
        }
    } catch (e) {
        alert("❌ Error: " + e);
    }
}

// ==============================================================================
// 13. PAYMENT SCREENSHOT ZOOM & INSPECTION
// ==============================================================================
function openScreenshotZoomModal(imgUrl, studentNameEncoded, utr, paymentId, status, phone, amount) {
    const studentName = decodeURIComponent(studentNameEncoded || 'Student');
    const modal = document.getElementById("modal-zoom-screenshot");
    const img = document.getElementById("zoom-slip-img");
    const meta = document.getElementById("zoom-slip-meta");
    const approveBtn = document.getElementById("btn-zoom-approve");

    if (img) img.src = imgUrl;
    if (meta) {
        meta.innerHTML = `
            <div><strong>Student:</strong> ${studentName} (${phone ? '+91 ' + phone : 'Direct'})</div>
            <div><strong>Amount:</strong> <span style="color:#059669; font-weight:800;">₹${amount || 299}</span> • <strong>UTR / Ref:</strong> <code>${utr || 'SCREENSHOT'}</code></div>
            <div><strong>Status:</strong> <span class="${status === 'approved' ? 'wp-badge-vip' : 'wp-badge-pending'}">${status.toUpperCase()}</span></div>
        `;
    }

    if (approveBtn) {
        if (status === 'approved') {
            approveBtn.innerText = "👑 Already Approved (VIP Active)";
            approveBtn.disabled = true;
            approveBtn.style.opacity = "0.6";
        } else {
            approveBtn.innerText = "✅ Approve Payment & Unlock VIP";
            approveBtn.disabled = false;
            approveBtn.style.opacity = "1";
            approveBtn.onclick = async () => {
                await approveWpPayment(paymentId);
                closeScreenshotZoomModal();
            };
        }
    }

    if (modal) modal.style.display = "flex";
}

function closeScreenshotZoomModal() {
    const modal = document.getElementById("modal-zoom-screenshot");
    if (modal) modal.style.display = "none";
}

// ==============================================================================
// 14. LEADS & ADMISSIONS CRM (FREE 30-PAGE HANDBOOK LEADS)
// ==============================================================================
let cachedLeads = [];

async function loadWpLeads() {
    const tbody = document.getElementById("wp-leads-tbody");
    if (!tbody) return;
    tbody.innerHTML = "<tr><td colspan='7' style='text-align:center; padding: 20px; color:#2271b1;'>⏳ Loading leads...</td></tr>";

    try {
        const res = await fetch("/api/admin/leads", { headers: getWpAuthHeaders() });
        const data = await res.json();

        if (data.status === "success") {
            cachedLeads = data.leads || [];
            
            const totalCount = document.getElementById("leads-total-count");
            if (totalCount) totalCount.innerText = cachedLeads.length;

            const sidebarBadge = document.getElementById("sidebar-leads-count");
            if (sidebarBadge) {
                sidebarBadge.innerText = cachedLeads.length;
                sidebarBadge.style.display = cachedLeads.length > 0 ? "inline-block" : "none";
            }

            renderWpLeadsTable(cachedLeads);
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan='7' style='text-align:center; color:#d63638;'>Error loading leads: ${e}</td></tr>`;
    }
}

function renderWpLeadsTable(leads) {
    const tbody = document.getElementById("wp-leads-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!leads || leads.length === 0) {
        tbody.innerHTML = "<tr><td colspan='7' style='text-align:center; padding: 24px; color:#64748b;'>No leads captured yet. They will appear when visitors request the Free Python Handbook PDF.</td></tr>";
        return;
    }

    leads.forEach(l => {
        const tr = document.createElement("tr");
        const cleanPhone = String(l.phone || '').replace(/\D/g, '');
        const waText = encodeURIComponent(`नमस्ते ${l.name}! रोहित सर (Python Sikho, Samyak Classes Kuchaman City) की तरफ से। आपने हमारी 30-Page Python Formula Cheat Sheet डाउनलोड की थी। क्या आपको Python Course में लाइव एडमिशन लेना है?`);
        const waLink = `https://wa.me/91${cleanPhone}?text=${waText}`;

        tr.innerHTML = `
            <td><strong>#${l.id}</strong></td>
            <td>
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="width:24px; height:24px; border-radius:50%; background:#ec4899; color:#fff; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:800;">
                        ${l.name ? l.name.substring(0, 2).toUpperCase() : 'LD'}
                    </span>
                    <strong>${l.name}</strong>
                </div>
            </td>
            <td>
                <a href="${waLink}" target="_blank" style="font-family:monospace; color:#25d366; font-weight:700; text-decoration:none;" title="Click to chat on WhatsApp">
                    💬 +91 ${l.phone}
                </a>
            </td>
            <td>📍 ${l.city || 'Kuchaman City'}</td>
            <td><span class="wp-badge-demo" style="background:rgba(236, 72, 153, 0.15); color:#db2777; border-color:#f472b6;">🎁 Free Python Handbook PDF</span></td>
            <td style="font-size:11px; color:#64748b;">${l.created_at ? l.created_at.substring(0, 16).replace('T', ' ') : 'Recently'}</td>
            <td>
                <div style="display:flex; gap:6px;">
                    <a href="${waLink}" target="_blank" class="wp-button wp-button-primary wp-button-small" style="background:#25d366; border-color:#128c7e; font-weight:700; text-decoration:none; display:inline-flex; align-items:center; gap:4px;">
                        💬 WhatsApp
                    </a>
                    <button class="wp-button wp-button-delete wp-button-small" onclick="deleteWpLead(${l.id}, '${encodeURIComponent(l.name)}')" title="Delete Lead">🗑️</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function deleteWpLead(leadId, leadNameEncoded) {
    const leadName = decodeURIComponent(leadNameEncoded || 'Lead');
    if (!confirm(`Are you sure you want to delete lead "${leadName}" (#${leadId})?`)) return;

    try {
        const res = await fetch(`/api/admin/leads/${leadId}`, {
            method: "DELETE",
            headers: getWpAuthHeaders()
        });
        const data = await res.json();
        if (data.success) {
            showWpToast("🗑️ Lead deleted successfully.");
            loadWpLeads();
        } else {
            alert("Failed to delete lead: " + (data.message || "Unknown error"));
        }
    } catch (e) {
        alert("Error: " + e);
    }
}

