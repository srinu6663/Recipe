// Merged dashboard using Guffran API and Food Corpus UI
const DASH_API = 'https://api.corpus.swecha.org/api/v1';

document.addEventListener('DOMContentLoaded', () => {
    const contentListDiv = document.getElementById('content-list');
    const logoutBtn = document.getElementById('logout-btn');
    const usernameDisplay = document.getElementById('username-display');

    let authToken = localStorage.getItem('authToken') || localStorage.getItem('token');
    let userId = localStorage.getItem('userId');

    if (!authToken) {
        location.href = 'login.html';
        return;
    }

    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    async function fetchUserDetails() {
        try {
            const resp = await fetch(`${DASH_API}/auth/me`, { headers: { 'Authorization': `Bearer ${authToken}` } });
            if (!resp.ok) throw new Error(`Failed to fetch user details (${resp.status})`);
            const result = await resp.json();
            userId = result.uid || result.id || null;
            const username = result.username || result.email || 'User';
            const displayName = username.includes('@') ? username.split('@')[0] : username;
            if (userId) localStorage.setItem('userId', userId);
            if (usernameDisplay) usernameDisplay.innerText = `Welcome back, ${displayName}!`;
        } catch (err) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userId');
            location.href = 'login.html';
        }
    }

    async function fetchUserContent() {
        try {
            if (!userId) return;
            const resp = await fetch(`${DASH_API}/users/${userId}/contributions`, { headers: { 'Authorization': `Bearer ${authToken}` } });
            if (!resp.ok) {
                let err; try { err = await resp.json(); } catch { err = {}; }
                throw new Error(`Failed to fetch contributions (${resp.status}): ${err.detail || resp.statusText}`);
            }
            const data = await resp.json();
            updateStatistics(data);
            displayContributions(data);
        } catch (err) {
            if (contentListDiv) contentListDiv.innerHTML = `<div class="col-12 text-center text-danger">Error loading contributions: ${err.message}</div>`;
        }
    }

    function updateStatistics(data) {
        const audio = (data.audio_contributions || []).length;
        const video = (data.video_contributions || []).length;
        const text = (data.text_contributions || []).length;
        const image = (data.image_contributions || []).length;
        const total = data.total_contributions || (audio + video + text + image);
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('totalContributions', total);
        set('audioCount', audio);
        set('videoCount', video);
        set('imageCount', image);
        set('textCount', text);
    }

    function displayContributions(data) {
        if (!contentListDiv) return;
        contentListDiv.innerHTML = '';
        const all = [...(data.audio_contributions || []), ...(data.video_contributions || []), ...(data.text_contributions || []), ...(data.image_contributions || [])];
        if (!all.length) {
            contentListDiv.innerHTML = `<div class="loading-message"><div style="font-size: 4rem; margin-bottom: 1rem;">🍽️</div><h3 style="color:#fff; margin-bottom:1rem;">No Contributions Yet</h3><p style="color: rgba(255,255,255,0.8); margin-bottom:2rem;">Start sharing your food knowledge with the community!</p><a href="upload.html" class="btn btn-primary">📤 Upload Your First Contribution</a></div>`;
            return;
        }
        all.forEach(content => {
            const card = document.createElement('div');
            card.className = 'contribution-card';
            const uploadedDate = content.timestamp ? new Date(content.timestamp).toLocaleDateString() : 'N/A';
            let mediaType = 'unknown', mediaIcon = '📄', mediaElement = '';
            if ((data.audio_contributions || []).some(i => i.id === content.id)) { mediaType = 'audio'; mediaIcon = '🎵'; if (content.file_url) mediaElement = `<audio controls src="${content.file_url}" class="w-100 mt-2"></audio>`; }
            else if ((data.video_contributions || []).some(i => i.id === content.id)) { mediaType = 'video'; mediaIcon = '🎥'; if (content.file_url) mediaElement = `<video controls src="${content.file_url}" class="w-100 mt-2"></video>`; }
            else if ((data.image_contributions || []).some(i => i.id === content.id)) { mediaType = 'image'; mediaIcon = '🖼️'; if (content.file_url) mediaElement = `<img src="${content.file_url}" class="img-fluid mt-2" alt="${content.title}">`; }
            else if ((data.text_contributions || []).some(i => i.id === content.id)) { mediaType = 'text'; mediaIcon = '📝'; if (content.file_url) mediaElement = `<a href="${content.file_url}" target="_blank" class="btn btn-sm btn-outline-primary mt-3">📖 View Document</a>`; }
            card.innerHTML = `
        <div class="card h-100" style="border: none; border-radius: 16px; background: rgba(255,255,255,0.95); box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
          <div class="card-body" style="padding: 2rem; display:flex; flex-direction:column; height:100%;">
            <div style="display:flex; align-items:center; margin-bottom:1.5rem;">
              <span style="font-size: 2rem; margin-right: 1rem;">${mediaIcon}</span>
              <h5 class="card-title" style="margin:0; color:#2d3748; font-weight:700;">${content.title || 'Untitled Contribution'}</h5>
            </div>
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 0.6rem 1.2rem; border-radius: 25px; font-size: 0.85rem; font-weight: 600; display: inline-block; margin-bottom: 1.5rem;">
              ${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} Content
            </div>
            <div style="flex-grow:1; margin-bottom:1.5rem;">
              <p style="color:#4a5568; margin-bottom:0.8rem;"><strong>Category:</strong> ${content.category_id || 'General'}</p>
              <p style="color:#4a5568; margin-bottom:1rem;"><strong>Uploaded:</strong> ${uploadedDate}</p>
              <div style="margin: 1rem 0;">${mediaElement}</div>
            </div>
          </div>
        </div>`;
            contentListDiv.appendChild(card);
        });
    }

    fetchUserDetails().then(fetchUserContent);
});
