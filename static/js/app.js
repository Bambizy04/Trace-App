// Base Configuration
const API_BASE_URL = '/api';
let currentToken = localStorage.getItem('trace_token');
let currentRole = localStorage.getItem('trace_role');

// DOM Elements
const mainContent = document.getElementById('main-content');
const authButtons = document.getElementById('auth-buttons');
const userProfile = document.getElementById('user-profile');
const welcomeMsg = document.getElementById('welcome-msg');
const navClaims = document.getElementById('nav-claims');
const navAdmin = document.getElementById('nav-admin');
const navReport = document.getElementById('nav-report');
const navSearch = document.getElementById('nav-search');
const navHome = document.getElementById('nav-home');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    updateNavUI();
    showPage('home');
});

// Navigation & Routing Logic
function showPage(pageId) {
    const template = document.getElementById(`tpl-${pageId}`);
    if (!template) return;

    // Clear and clone template
    mainContent.innerHTML = '';
    mainContent.appendChild(template.content.cloneNode(true));

    // Page specific initialization
    if (pageId === 'search') {
        if (!checkAuth()) return;
        if (currentRole === 'Admin') { showPage('admin'); return; }
        loadMyLostItems();
        loadMyFoundItems();
        loadGeneralLostItems();
    } else if (pageId === 'admin') {
        if (!checkAdmin()) return;
        loadAdminStats();
        loadAdminClaims();
        loadAdminUsers();
    } else if (pageId === 'report') {
        if (!checkAuth()) return;
        if (currentRole === 'Admin') { showPage('admin'); return; }
    } else if (pageId === 'claims') {
        if (!checkAuth()) return;
        if (currentRole === 'Admin') { showPage('admin'); return; }
        loadMyClaims();
    }
}

// Authentication UI
function updateNavUI() {
    if (currentToken) {
        authButtons.style.display = 'none';
        userProfile.style.display = 'flex';
        // Mock username for display if real isn't saved, or fetch from /me endpoint if added
        welcomeMsg.textContent = `Welcome`;
        if (currentRole === 'Admin') {
            if (navAdmin) navAdmin.style.display = 'block';
            if (navClaims) navClaims.style.display = 'none';
            if (navReport) navReport.style.display = 'none';
            if (navSearch) navSearch.style.display = 'none';
            if (navHome) navHome.style.display = 'none';
        } else {
            if (navAdmin) navAdmin.style.display = 'none';
            if (navClaims) navClaims.style.display = 'block';
            if (navReport) navReport.style.display = 'block';
            if (navSearch) navSearch.style.display = 'block';
            if (navHome) navHome.style.display = 'block';
        }
    } else {
        authButtons.style.display = 'flex';
        userProfile.style.display = 'none';
        if (navClaims) navClaims.style.display = 'none';
        if (navAdmin) navAdmin.style.display = 'none';
        if (navReport) navReport.style.display = 'block';
        if (navSearch) navSearch.style.display = 'block';
        if (navHome) navHome.style.display = 'block';
    }
}

function checkAuth() {
    if (!currentToken) {
        showToast('Please login to access this page.', 'error');
        showModal('loginModal');
        showPage('home');
        return false;
    }
    return true;
}

function checkAdmin() {
    if (currentRole !== 'Admin') {
        showToast('Admin access required.', 'error');
        showPage('home');
        return false;
    }
    return true;
}

// API Helpers
async function apiCall(endpoint, options = {}) {
    const headers = { ...options.headers };

    // Attach token if exists
    if (currentToken && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${currentToken}`;
    }

    // Default to JSON if not FormData
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
        if (options.body && typeof options.body === 'object') {
            options.body = JSON.stringify(options.body);
        }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.msg || response.statusText || 'An error occurred');
    }

    return data;
}

// Modals
function showModal(id) {
    document.getElementById(id).classList.add('active');
    document.getElementById('modal-overlay').classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    document.getElementById('modal-overlay').classList.remove('active');
}

// Login / Register / Logout
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const data = await apiCall('/auth/login', {
            method: 'POST',
            body: { username, password }
        });

        currentToken = data.access_token;
        currentRole = data.role;
        localStorage.setItem('trace_token', currentToken);
        localStorage.setItem('trace_role', currentRole);

        updateNavUI();
        closeModal('loginModal');
        showToast('Logged in successfully', 'success');
        if (currentRole === 'Admin') {
            showPage('admin');
        } else {
            showPage('home');
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    try {
        await apiCall('/auth/register', {
            method: 'POST',
            body: { username, email, password }
        });

        closeModal('registerModal');
        showToast('Registration successful. Please login.', 'success');
        showModal('loginModal');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function logout() {
    currentToken = null;
    currentRole = null;
    localStorage.removeItem('trace_token');
    localStorage.removeItem('trace_role');
    updateNavUI();
    showToast('Logged out', 'success');
    showPage('home');
}

// Reporting Items
function setReportType(type) {
    document.getElementById('report-type').value = type;
    document.getElementById('btn-lost').classList.toggle('active', type === 'lost');
    document.getElementById('btn-found').classList.toggle('active', type === 'found');
}

function previewImage(input) {
    const preview = document.getElementById('image-preview');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
        reader.readAsDataURL(input.files[0]);
    } else {
        preview.style.display = 'none';
        preview.src = "";
    }
}

async function submitReport(e) {
    e.preventDefault();

    const type = document.getElementById('report-type').value; // 'lost' or 'found'
    const name = document.getElementById('item-name').value;
    const description = document.getElementById('item-desc').value;
    const location = document.getElementById('item-loc').value;
    const dateField = document.getElementById('item-date').value;
    const imageFile = document.getElementById('item-image').files[0];

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('location', location);
    formData.append(type === 'lost' ? 'date_lost' : 'date_found', dateField);
    if (imageFile) {
        formData.append('image', imageFile);
    }

    const btn = document.getElementById('submit-report-btn');
    btn.disabled = true;
    btn.textContent = 'Submitting...';

    try {
        await apiCall(`/items/${type}`, {
            method: 'POST',
            body: formData,
            // DO NOT set content type, let browser set it for FormData
            headers: {}
        });

        showToast('Report submitted successfully!', 'success');
        // Reset form
        e.target.reset();
        document.getElementById('image-preview').style.display = 'none';

        if (type === 'lost') {
            // Suggest going to matches
            setTimeout(() => showPage('search'), 1500);
        }
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Submit Report';
    }
}

// Matching & Search
function switchSearchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.search-tab-content').forEach(tab => tab.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    // Show selected tab
    document.getElementById(`tab-${tabName}`).style.display = 'block';
    // Find button and make active
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        if (btn.textContent.toLowerCase().includes(tabName.replace('-', ' '))) {
            btn.classList.add('active');
        }
    });

    // Special case for buttons that don't match text perfectly
    if (tabName === 'my-lost') buttons[0].classList.add('active');
    if (tabName === 'my-found') buttons[1].classList.add('active');
    if (tabName === 'general') buttons[2].classList.add('active');
}

async function loadMyLostItems() {
    const grid = document.getElementById('lost-items-grid');
    if (!grid) return;
    grid.innerHTML = '<div class="loader-spinner"></div>';

    try {
        const data = await apiCall('/items/my_lost');
        grid.innerHTML = '';

        if (data.length === 0) {
            grid.innerHTML = '<p style="grid-column:1/-1; text-align:center;">You haven\'t reported any lost items yet.</p>';
            return;
        }

        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.onclick = () => findMatches(item.id);

            const imgSrc = item.image_path ? `http://localhost:8000${item.image_path}` : 'https://via.placeholder.com/300x200?text=No+Image';

            card.innerHTML = `
                <div class="card-badge ${item.status === 'Lost' ? 'status-pending' : 'status-approved'}">${item.status}</div>
                <img src="${imgSrc}" alt="${item.name}">
                <div class="item-card-content">
                    <h3>${item.name}</h3>
                    <p><i class="fa-solid fa-location-dot"></i> ${item.location}</p>
                    <div class="date"><i class="fa-regular fa-calendar"></i> Lost: ${item.date_lost}</div>
                    <button class="btn-primary w-100 mt-3 btn-small" onclick="event.stopPropagation(); findMatches(${item.id})">Find Matches</button>
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (err) {
        grid.innerHTML = `<p class="color-danger">${err.message}</p>`;
    }
}

async function loadMyFoundItems() {
    const grid = document.getElementById('my-found-items-grid');
    if (!grid) return;
    grid.innerHTML = '<div class="loader-spinner"></div>';

    try {
        const data = await apiCall('/items/my_found');
        grid.innerHTML = '';

        if (data.length === 0) {
            grid.innerHTML = '<p style="grid-column:1/-1; text-align:center;">You haven\'t reported any found items yet.</p>';
            return;
        }

        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.style.cursor = 'default';

            const imgSrc = item.image_path ? `http://localhost:8000${item.image_path}` : 'https://via.placeholder.com/300x200?text=No+Image';

            card.innerHTML = `
                <div class="card-badge status-approved">Found</div>
                <img src="${imgSrc}" alt="${item.name}">
                <div class="item-card-content">
                    <h3>${item.name}</h3>
                    <p><i class="fa-solid fa-location-dot"></i> ${item.location}</p>
                    <div class="date"><i class="fa-regular fa-calendar"></i> Reported: ${item.date_found}</div>
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (err) {
        grid.innerHTML = `<p class="color-danger">${err.message}</p>`;
    }
}

async function loadGeneralLostItems() {
    const grid = document.getElementById('general-lost-grid');
    if (!grid) return;
    grid.innerHTML = '<div class="loader-spinner"></div>';

    try {
        const data = await apiCall('/items/lost');
        grid.innerHTML = '';

        if (data.length === 0) {
            grid.innerHTML = '<p style="grid-column:1/-1; text-align:center;">No lost items reported yet.</p>';
            return;
        }

        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.style.cursor = 'default';

            const imgSrc = item.image_path ? `http://localhost:8000${item.image_path}` : 'https://via.placeholder.com/300x200?text=No+Image';

            card.innerHTML = `
                <div class="card-badge status-pending">Lost</div>
                <img src="${imgSrc}" alt="${item.name}">
                <div class="item-card-content">
                    <h3>${item.name}</h3>
                    <p><i class="fa-solid fa-location-dot"></i> ${item.location}</p>
                    <div class="date"><i class="fa-regular fa-calendar"></i> Lost: ${item.date_lost}</div>
                    <p style="font-size:0.8rem; margin-top:5px; color:var(--purple-main)">Reported by: ${item.user}</p>
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (err) {
        grid.innerHTML = `<p class="color-danger">${err.message}</p>`;
    }
}
async function findMatches(lostItemId) {
    const matchesSection = document.getElementById('matches-section');
    const matchesGrid = document.getElementById('matches-grid');

    matchesSection.style.display = 'block';
    matchesGrid.innerHTML = '<div class="loader-spinner"></div>';

    // Smooth scroll down
    matchesSection.scrollIntoView({ behavior: 'smooth' });

    try {
        const data = await apiCall(`/matches/suggest/${lostItemId}`);
        matchesGrid.innerHTML = '';

        if (!data.matches || data.matches.length === 0) {
            matchesGrid.innerHTML = '<p>No matches found yet. We will notify you when something turns up.</p>';
            return;
        }

        data.matches.forEach(match => {
            const card = document.createElement('div');
            card.className = 'item-card';

            const imgSrc = match.image_path ? `http://localhost:8000${match.image_path}` : 'https://via.placeholder.com/300x200?text=No+Image';

            card.innerHTML = `
                <div class="match-score">${match.match_score}% Match</div>
                <img src="${imgSrc}" alt="${match.found_item_name}">
                <div class="item-card-content">
                    <h3>${match.found_item_name}</h3>
                    <p><i class="fa-solid fa-location-dot"></i> ${match.location}</p>
                    <div class="date"><i class="fa-regular fa-calendar"></i> Found: ${match.date_found}</div>
                    <p style="font-size:0.8rem; margin-top:5px;">Text Score: ${match.text_score}% | Image Score: ${match.image_score}%</p>
                    <button class="btn-primary w-100 mt-3 btn-small" onclick="openClaimModal(${match.found_item_id}, '${match.found_item_name.replace(/'/g, "\\'")}')">Claim Item</button>
                </div>
            `;
            matchesGrid.appendChild(card);
        });
    } catch (err) {
        matchesGrid.innerHTML = `<p style="color:red">${err.message}</p>`;
    }
}

// Claims
function openClaimModal(foundItemId, foundItemName) {
    document.getElementById('claim-found-id').value = foundItemId;
    document.getElementById('claim-item-name').textContent = foundItemName;
    showModal('claimModal');
}

async function submitClaim(e) {
    e.preventDefault();
    const found_item_id = parseInt(document.getElementById('claim-found-id').value);
    const proof_description = document.getElementById('claim-proof').value;

    try {
        await apiCall('/claims/', {
            method: 'POST',
            body: { found_item_id, proof_description }
        });
        showToast('Claim submitted! Awaiting admin review.', 'success');
        closeModal('claimModal');
        e.target.reset();
        
        // Redirect to My Claims page
        setTimeout(() => showPage('claims'), 1000);

    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function loadMyClaims() {
    const grid = document.getElementById('my-claims-grid');
    if (!grid) return;
    grid.innerHTML = '<div class="loader-spinner"></div>';

    try {
        const claims = await apiCall('/claims/my_claims');
        grid.innerHTML = '';

        if (claims.length === 0) {
            grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">You haven\'t made any claims yet.</p>';
            return;
        }

        claims.forEach(c => {
            const card = document.createElement('div');
            card.className = 'item-card';
            // Disable click for now or point to item details if available
            card.style.cursor = 'default';

            let statusClass = 'status-pending';
            if (c.status === 'Approved') statusClass = 'status-approved';
            if (c.status === 'Rejected') statusClass = 'status-rejected';

            card.innerHTML = `
                <div class="card-badge ${statusClass}">${c.status}</div>
                <div class="item-card-content">
                    <h3 style="margin-top:10px">${c.found_item_name}</h3>
                    <p><strong>Proof provided:</strong> ${c.proof_description}</p>
                    <div class="date"><i class="fa-regular fa-calendar"></i> Claimed on: ${c.created_at}</div>
                    ${c.admin_feedback ? `
                    <div style="margin-top:15px; padding:10px; background:var(--purple-bg); border-radius:var(--radius-md); font-size:0.85rem;">
                        <strong style="color:var(--purple-dark)">Admin Feedback:</strong><br>
                        ${c.admin_feedback}
                    </div>` : ''}
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (err) {
        grid.innerHTML = `<p class="color-danger">${err.message}</p>`;
    }
}

// Admin Dashboard
async function loadAdminStats() {
    try {
        const data = await apiCall('/admin/items');
        document.getElementById('stat-lost').textContent = data.lost_items || 0;
        document.getElementById('stat-found').textContent = data.found_items || 0;
        document.getElementById('stat-claims').textContent = data.pending_claims || 0;

        const users = await apiCall('/admin/users');
        document.getElementById('stat-users').textContent = users.length || 0;
    } catch (err) {
        console.error(err);
    }
}

async function loadAdminClaims() {
    const tbody = document.getElementById('admin-claims-body');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading...</td></tr>';

    try {
        const claims = await apiCall('/admin/claims');
        tbody.innerHTML = '';

        if (claims.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No claims found.</td></tr>';
            return;
        }

        claims.forEach(c => {
            let statusClass = 'status-pending';
            if (c.status === 'Approved') statusClass = 'status-approved';
            if (c.status === 'Rejected') statusClass = 'status-rejected';

            let actions = '';
            if (c.status === 'Pending') {
                actions = `<button class="btn-primary btn-small" onclick="openReviewModal(${c.id})">Review</button>`;
            } else {
                actions = `<span style="font-size:0.8rem; color:var(--text-secondary)">Reviewed</span>`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${c.id}</td>
                <td>${c.user}</td>
                <td>${c.found_item}</td>
                <td><small>${c.proof}</small></td>
                <td><span class="status-badge ${statusClass}">${c.status}</span></td>
                <td>${actions}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">${err.message}</td></tr>`;
    }
}

function openReviewModal(claimId) {
    document.getElementById('review-claim-id').value = claimId;
    document.getElementById('review-feedback').value = '';
    showModal('reviewClaimModal');
}

function setReviewAction(action) {
    document.getElementById('review-action').value = action;
    submitReview();
}

async function loadAdminUsers() {
    const tbody = document.getElementById('admin-users-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading...</td></tr>';

    try {
        const users = await apiCall('/admin/users');
        tbody.innerHTML = '';

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No users found.</td></tr>';
            return;
        }

        users.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${u.id}</td>
                <td>${u.username}</td>
                <td>${u.email}</td>
                <td><span class="status-badge ${u.role === 'Admin' ? 'status-approved' : 'status-pending'}">${u.role}</span></td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" style="color:red; text-align:center;">${err.message}</td></tr>`;
    }
}

async function submitReview() {
    const claim_id = document.getElementById('review-claim-id').value;
    const action = document.getElementById('review-action').value;
    const feedback = document.getElementById('review-feedback').value;

    try {
        await apiCall(`/admin/claims/${claim_id}/review`, {
            method: 'POST',
            body: { action, feedback }
        });
        showToast(`Claim ${action.toLowerCase()}d successfully`, 'success');
        closeModal('reviewClaimModal');
        loadAdminStats();
        loadAdminClaims();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// Toast Notifications
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? '<i class="fa-solid fa-check-circle" style="color:var(--success)"></i>' : '<i class="fa-solid fa-circle-exclamation" style="color:var(--danger)"></i>';

    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
