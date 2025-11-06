/* Movie Explorer - SPA
   - Default API: json-server at http://localhost:3000/shows
   - Fallback: TVMaze API (live)
   - Features:
     - Search (keyup)
     - Genre filter (change)
     - Sort select (change)
     - Toggle theme (click)
     - Like button with PATCH persistence (click)
     - Click card to open modal detail (click)
*/

// ---------- Config ----------
const LOCAL_API = 'http://localhost:3000/movies'; // json-server
const REMOTE_API = 'https://api.tvmaze.com/shows'; // fallback
let API_URL = LOCAL_API; // will attempt local first

// ---------- DOM ----------
const showContainer = document.getElementById('showContainer');
const searchInput = document.getElementById('searchInput');
const genreFilter = document.getElementById('genreFilter');
const sortSelect = document.getElementById('sortSelect');
const toggleThemeBtn = document.getElementById('toggleTheme');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.getElementById('closeModal');
const addMovieForm = document.getElementById('addMovieForm'); // new form for POST
// ---------- Add Movie Modal Controls ----------
const addMovieModal = document.getElementById('addMovieModal');
const openAddMovieModal = document.getElementById('openAddMovieModal');
const closeAddMovieModal = document.getElementById('closeAddMovieModal');

let allShows = [];
let displayedShows = [];

// ---------- Helpers ----------
const safeImage = (show) => show.image?.medium ? (show.image.medium || show.image) : 'https://picsum.photos/200/300/?blur';
const safeOriginalImage = (show) => (show.image && (show.image.original || show.image)) || 'https://picsum.photos/200/300/?blur';

// Normalizing remote (TVMaze) shape to local shape
function normalizeFromRemote(arr) {
    return arr.map(s => ({
        id: s.id,
        name: s.name,
        image: s.image ? s.image : null,
        rating: s.rating && s.rating.average ? s.rating.average : null,
        genres: Array.isArray(s.genres) ? s.genres : [],
        likes: 0,
        summary: s.summary ? s.summary.replace(/<\/?[^>]+(>|$)/g, "") : 'No summary available.'
    }));
}

// ---------- Rendering ----------
function renderShows(shows) {
    showContainer.innerHTML = '';
    if (!shows.length) {
        showContainer.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#888">No shows match your search/filter.</p>`;
        return;
    }
    shows.forEach(show => {
        const card = document.createElement('article');
        card.className = 'card';
        card.setAttribute('data-id', show.id);
        card.innerHTML = `
      <img src="${safeImage(show)}" alt="${escapeHtml(show.name)}">
      <h3>${escapeHtml(show.name)}</h3>
      <div class="meta">Rating: ${show.rating ?? 'N/A'} • Genres: ${show.genres.join(', ') || 'N/A'}</div>
      <div class="like-row" aria-hidden="true">
        <button class="like-btn" data-id="${show.id}">❤️ Like</button>
        <div class="like-count" data-count-id="${show.id}">${show.likes ?? 0}</div>
        ${API_URL === LOCAL_API ? `<button class="delete-btn" data-id="${show.id}">Delete</button>` : ''}
      </div>
    `;
        card.addEventListener('click', () => showDetails(show));

        // Like button
        const likeBtn = card.querySelector('.like-btn');
        likeBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await handleLike(show);
        });

        // Delete button
        if (API_URL === LOCAL_API) {
            const deleteBtn = card.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await handleDelete(show.id);
            });
        }

        showContainer.appendChild(card);
    });
}

function escapeHtml(str) { return String(str || '').replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[s]); }

// ---------- Data Fetching ----------
async function fetchData() {
    try {
        const res = await fetch(LOCAL_API, { cache: "no-store" });
        if (!res.ok) throw new Error('local not available');
        const data = await res.json();
        API_URL = LOCAL_API;
        allShows = data;
        displayedShows = [...allShows];
        initAfterData();
        return;
    } catch (err) {
        try {
            const res2 = await fetch(REMOTE_API);
            const remote = await res2.json();
            API_URL = REMOTE_API;
            allShows = normalizeFromRemote(remote);
            displayedShows = [...allShows];
            initAfterData();
            return;
        } catch (err2) {
            console.error('Failed to load both local and remote APIs:', err2);
            showContainer.innerHTML = '<p style="color:#c00">Failed to load shows. Start json-server or check network.</p>';
        }
    }
}

function initAfterData() {
    allShows = allShows.map(s => ({ likes: 0, genres: [], rating: null, summary: '', ...s }));
    displayedShows = [...allShows];

    populateGenreFilter(allShows);
    applyFiltersAndRender();
}

// ---------- Filters / Sorting ----------
function populateGenreFilter(shows) {
    const set = new Set();
    shows.forEach(s => (s.genres || []).forEach(g => set.add(g)));
    genreFilter.innerHTML = `<option value="">All Genres</option>`;
    Array.from(set).sort().forEach(g => {
        const opt = document.createElement('option');
        opt.value = g; opt.textContent = g;
        genreFilter.appendChild(opt);
    });
}

function applyFiltersAndRender() {
    const q = (searchInput.value || '').trim().toLowerCase();
    let results = allShows.filter(s => s.name.toLowerCase().includes(q) || (s.summary || '').toLowerCase().includes(q));

    const genre = genreFilter.value;
    if (genre) results = results.filter(s => (s.genres || []).includes(genre));

    const sort = sortSelect.value;
    if (sort === 'rating-desc') results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (sort === 'rating-asc') results.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    else if (sort === 'name-asc') results.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'name-desc') results.sort((a, b) => b.name.localeCompare(a.name));

    displayedShows = results;
    renderShows(displayedShows);
}

// ---------- Like ----------
async function handleLike(show) {
    show.likes = (show.likes || 0) + 1;
    updateLikeDisplay(show.id, show.likes);

    if (API_URL === LOCAL_API) {
        try {
            await fetch(`${LOCAL_API}/${show.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ likes: show.likes })
            });
        } catch (err) { console.warn('Failed to persist like:', err); }
    }
}

function updateLikeDisplay(id, count) {
    const el = document.querySelector(`[data-count-id="${id}"]`);
    if (el) el.textContent = count;
}

// ---------- Delete ----------
async function handleDelete(id) {
    try {
        await fetch(`${LOCAL_API}/${id}`, { method: 'DELETE' });
        allShows = allShows.filter(s => s.id != id);
        applyFiltersAndRender();
    } catch (err) { console.warn('Failed to delete movie:', err); }
}

// ---------- Modal ----------
function showDetails(show) {
    modalBody.innerHTML = `
    <h2>${escapeHtml(show.name)}</h2>
    <img src="${safeOriginalImage(show)}" alt="${escapeHtml(show.name)}" style="width:100%;max-height:360px;object-fit:cover;border-radius:8px;margin:8px 0">
    <p><strong>Rating:</strong> ${show.rating ?? 'N/A'}</p>
    <p><strong>Genres:</strong> ${(show.genres || []).join(', ') || 'N/A'}</p>
    <p>${escapeHtml(show.summary || 'No summary available.')}</p>
    <div style="margin-top:10px"><strong>Likes:</strong> ${show.likes ?? 0}</div>
  `;
    modal.setAttribute('open', '');
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
}

function closeModalFn() {
    modal.removeAttribute('open');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
}

// ---------- Event Listeners ----------
searchInput.addEventListener('keyup', debounce(() => applyFiltersAndRender(), 250));
genreFilter.addEventListener('change', () => applyFiltersAndRender());
sortSelect.addEventListener('change', () => applyFiltersAndRender());
toggleThemeBtn.addEventListener('click', () => document.body.classList.toggle('dark'));
closeModal.addEventListener('click', closeModalFn);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModalFn(); });

// ---------- Add Movie Form (POST) ----------
if (addMovieForm) {
    addMovieForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newMovie = {
            name: e.target.name.value,
            image: { medium: e.target.image.value, original: e.target.image.value },
            rating: parseFloat(e.target.rating.value),
            genres: e.target.genres.value.split(',').map(g => g.trim()),
            likes: 0,
            summary: e.target.summary.value
        };
        try {
            const res = await fetch(LOCAL_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMovie)
            });
            const movie = await res.json();
            allShows.push(movie);
            applyFiltersAndRender();
            e.target.reset();
        } catch (err) { console.warn('Failed to add movie:', err); }
    });
}

if (openAddMovieModal && addMovieModal && closeAddMovieModal) {
    // Opens Add Movie modal
    openAddMovieModal.addEventListener('click', () => {
        addMovieModal.style.display = 'flex';
        addMovieModal.setAttribute('open', '');
    });

    // Closes Add Movie modal
    closeAddMovieModal.addEventListener('click', () => {
        addMovieModal.style.display = 'none';
        addMovieModal.removeAttribute('open');
    });

    // Closes modal when clicking outside the content
    addMovieModal.addEventListener('click', (e) => {
        if (e.target === addMovieModal) {
            addMovieModal.style.display = 'none';
            addMovieModal.removeAttribute('open');
        }
    });
}


// ---------- Utilities ----------
function debounce(fn, wait = 200) { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); }; }
function showSkeletons(count = 8) {
    showContainer.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-card';
        skeleton.innerHTML = `
      <div class="skeleton skeleton-img"></div>
      <div class="skeleton skeleton-line" style="width: 70%;"></div>
      <div class="skeleton skeleton-line" style="width: 50%;"></div>
      <div class="skeleton skeleton-line" style="width: 40%;"></div>
    `;
        showContainer.appendChild(skeleton);
    }
}

// ---------- Init ----------
showSkeletons();
fetchData();
