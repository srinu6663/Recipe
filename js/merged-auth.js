// Merged auth: UI (Food Corpus) + API (Guffran)
const API_BASE_URL = 'https://api.corpus.swecha.org/api/v1';

function showAlert(message, type = 'info') {
    const container = document.getElementById('alertContainer');
    if (!container) return;
    const div = document.createElement('div');
    div.className = `alert alert-${type}`;
    div.innerHTML = `<span>${message}</span>`;
    container.innerHTML = '';
    container.appendChild(div);
    setTimeout(() => div.remove(), 5000);
}

function isAuthenticated() {
    return !!(localStorage.getItem('authToken') || localStorage.getItem('token'));
}

function checkAuthentication() {
    if (!isAuthenticated()) {
        if (!location.pathname.endsWith('login.html') && !location.pathname.endsWith('register.html')) {
            location.href = 'login.html';
        }
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('loginText');
    const load = document.getElementById('loginLoading');
    if (btn && load) { btn.style.display = 'none'; load.style.display = 'inline'; }

    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value.trim();

    try {
        const resp = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password })
        });
        let data; const ct = resp.headers.get('content-type');
        data = ct && ct.includes('json') ? await resp.json() : { message: await resp.text() };
        if (!resp.ok) throw new Error(data.detail || data.message || resp.statusText);

        const token = data.access_token || data.token;
        if (!token) throw new Error('No auth token received');
        localStorage.setItem('authToken', token);
        localStorage.setItem('token', token);

        // fetch user id for later
        try {
            const me = await fetch(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
            if (me.ok) {
                const u = await me.json();
                const uid = u.uid || u.id;
                if (uid) localStorage.setItem('userId', uid);
                if (u) localStorage.setItem('user', JSON.stringify(u));
            }
        } catch { }

        showAlert('Login successful! Redirecting to dashboard...', 'success');
        setTimeout(() => location.href = 'dashboard.html', 800);
    } catch (err) {
        showAlert(`Login failed: ${err.message}`, 'error');
    } finally {
        if (btn && load) { btn.style.display = 'inline'; load.style.display = 'none'; }
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const btn = document.getElementById('registerText');
    const load = document.getElementById('registerLoading');
    if (btn && load) { btn.style.display = 'none'; load.style.display = 'inline'; }
    const username = document.getElementById('username').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value.trim();
    try {
        const resp = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, phone, password })
        });
        let data; const ct = resp.headers.get('content-type');
        data = ct && ct.includes('json') ? await resp.json() : { message: await resp.text() };
        if (!resp.ok) throw new Error(data.detail || data.message || resp.statusText);
        showAlert('Registration successful! Redirecting to login...', 'success');
        setTimeout(() => location.href = 'login.html', 800);
    } catch (err) {
        showAlert(`Registration failed: ${err.message}`, 'error');
    } finally {
        if (btn && load) { btn.style.display = 'inline'; load.style.display = 'none'; }
    }
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
    location.href = 'login.html';
}
