const STORAGE_KEYS = {
  favorites: 'pocket_arcade_favorites_v1',
  recent: 'pocket_arcade_recent_v1',
  customGames: 'pocket_arcade_custom_games_v1'
};

const state = {
  baseGames: [],
  customGames: [],
  favorites: [],
  recent: [],
  activeView: 'all',
  activeCategory: 'All',
  searchQuery: '',
  sortBy: 'featured',
  currentGame: null,
  theaterMode: false
};

const els = {
  navLinks: document.querySelectorAll('.nav-link[data-view]'),
  openAddGameBtn: document.getElementById('openAddGameBtn'),
  randomGameBtn: document.getElementById('randomGameBtn'),
  brandHome: document.getElementById('brandHome'),
  heroSection: document.getElementById('heroSection'),
  heroCard: document.getElementById('heroCard'),
  heroImage: document.getElementById('heroImage'),
  heroMeta: document.getElementById('heroMeta'),
  heroCardTitle: document.getElementById('heroCardTitle'),
  playFeaturedBtn: document.getElementById('playFeaturedBtn'),
  inspectCatalogJsonBtn: document.getElementById('inspectCatalogJsonBtn'),
  categoryTabs: document.querySelectorAll('.filter-tab'),
  searchInput: document.getElementById('searchInput'),
  sortSelect: document.getElementById('sortSelect'),
  catalogCount: document.getElementById('catalogCount'),
  gamesGrid: document.getElementById('gamesGrid'),
  emptyState: document.getElementById('emptyState'),
  emptyTitle: document.getElementById('emptyTitle'),
  emptyCopy: document.getElementById('emptyCopy'),
  resetFiltersBtn: document.getElementById('resetFiltersBtn'),
  exportJsonBtn: document.getElementById('exportJsonBtn'),

  playerOverlay: document.getElementById('playerOverlay'),
  stageShell: document.getElementById('stageShell'),
  stageTitle: document.getElementById('stageTitle'),
  stageMeta: document.getElementById('stageMeta'),
  closeStageBtn: document.getElementById('closeStageBtn'),
  stageFavoriteBtn: document.getElementById('stageFavoriteBtn'),
  stageJsonBtn: document.getElementById('stageJsonBtn'),
  reloadFrameBtn: document.getElementById('reloadFrameBtn'),
  theaterModeBtn: document.getElementById('theaterModeBtn'),
  fullscreenBtn: document.getElementById('fullscreenBtn'),
  stageFrameWrap: document.getElementById('stageFrameWrap'),
  iframeContainer: document.getElementById('iframeContainer'),
  stageJsonDrawer: document.getElementById('stageJsonDrawer'),
  stageJsonCode: document.getElementById('stageJsonCode'),
  copyEntryJsonBtn: document.getElementById('copyEntryJsonBtn'),

  addGameOverlay: document.getElementById('addGameOverlay'),
  closeAddModalBtn: document.getElementById('closeAddModalBtn'),
  cancelAddBtn: document.getElementById('cancelAddBtn'),
  addGameForm: document.getElementById('addGameForm'),
  gameTitleInput: document.getElementById('gameTitleInput'),
  gameCategoryInput: document.getElementById('gameCategoryInput'),
  gameControlsInput: document.getElementById('gameControlsInput'),
  gameIframeInput: document.getElementById('gameIframeInput'),
  gameDescInput: document.getElementById('gameDescInput'),
  addGameError: document.getElementById('addGameError'),

  jsonInspectorOverlay: document.getElementById('jsonInspectorOverlay'),
  closeJsonModalBtn: document.getElementById('closeJsonModalBtn'),
  fullJsonPreview: document.getElementById('fullJsonPreview'),
  copyFullJsonBtn: document.getElementById('copyFullJsonBtn'),
  downloadFullJsonBtn: document.getElementById('downloadFullJsonBtn'),
  footerViewJsonBtn: document.getElementById('footerViewJsonBtn'),
  footerResetCustomBtn: document.getElementById('footerResetCustomBtn')
};

function loadLocalArray(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalArray(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

function getAllGames() {
  return [...state.baseGames, ...state.customGames];
}

function isFavorite(id) {
  return state.favorites.includes(id);
}

function toggleFavorite(id) {
  if (isFavorite(id)) {
    state.favorites = state.favorites.filter((item) => item !== id);
  } else {
    state.favorites = [id, ...state.favorites];
  }
  saveLocalArray(STORAGE_KEYS.favorites, state.favorites);
  renderCatalog();
  updateStageFavoriteButton();
}

function recordRecent(id) {
  state.recent = [id, ...state.recent.filter((item) => item !== id)].slice(0, 12);
  saveLocalArray(STORAGE_KEYS.recent, state.recent);
}

function updateHero(games) {
  const featured = games.find((g) => g.featured) || games[0];
  if (!featured) return;

  els.heroCard.dataset.gameId = featured.id;
  els.heroCardTitle.textContent = featured.title;
  els.heroMeta.textContent = `${featured.category} · ${featured.players || '1 Player'} · ${featured.controls || 'Keyboard'}`;
  if (featured.thumbnail) {
    els.heroImage.src = featured.thumbnail;
    els.heroImage.alt = `${featured.title} artwork`;
    els.heroImage.style.display = 'block';
  } else {
    els.heroImage.style.display = 'none';
  }
}

function getFilteredGames() {
  let list = getAllGames();

  if (state.activeView === 'favorites') {
    list = list.filter((g) => isFavorite(g.id));
  } else if (state.activeView === 'recent') {
    const order = new Map(state.recent.map((id, idx) => [id, idx]));
    list = list
      .filter((g) => order.has(g.id))
      .sort((a, b) => order.get(a.id) - order.get(b.id));
  }

  if (state.activeCategory !== 'All') {
    list = list.filter((g) => g.category === state.activeCategory);
  }

  const q = state.searchQuery.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        (g.controls && g.controls.toLowerCase().includes(q)) ||
        (g.description && g.description.toLowerCase().includes(q))
    );
  }

  if (state.sortBy === 'title-asc') {
    list = [...list].sort((a, b) => a.title.localeCompare(b.title));
  } else if (state.sortBy === 'recent') {
    const order = new Map(state.recent.map((id, idx) => [id, idx]));
    list = [...list].sort((a, b) => {
      const idxA = order.has(a.id) ? order.get(a.id) : 9999;
      const idxB = order.has(b.id) ? order.get(b.id) : 9999;
      return idxA - idxB;
    });
  } else if (state.activeView !== 'recent') {
    list = [...list].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  }

  return list;
}

function renderCatalog() {
  const games = getFilteredGames();
  els.gamesGrid.innerHTML = '';

  const viewLabel =
    state.activeView === 'favorites'
      ? 'favorite'
      : state.activeView === 'recent'
        ? 'recently played'
        : 'available';

  els.catalogCount.textContent = `${games.length} ${games.length === 1 ? 'game' : 'games'} ${viewLabel}`;

  if (games.length === 0) {
    els.emptyState.hidden = false;
    if (state.activeView === 'favorites') {
      els.emptyTitle.textContent = 'No favorite games yet';
      els.emptyCopy.textContent = 'Mark any game as a favorite to keep it pinned here.';
    } else if (state.activeView === 'recent') {
      els.emptyTitle.textContent = 'No recently played games';
      els.emptyCopy.textContent = 'Launch any game from the catalog and it will appear here.';
    } else {
      els.emptyTitle.textContent = 'No matching games found';
      els.emptyCopy.textContent = 'Try clearing your search filter or adding a custom iframe game.';
    }
    return;
  }

  els.emptyState.hidden = true;
  const fragment = document.createDocumentFragment();

  games.forEach((game) => {
    const card = document.createElement('article');
    card.className = 'game-card';

    const thumbBtn = document.createElement('button');
    thumbBtn.type = 'button';
    thumbBtn.className = 'game-thumb-btn';
    thumbBtn.setAttribute('aria-label', `Play ${game.title}`);
    thumbBtn.addEventListener('click', () => openGameStage(game));

    const thumbWrap = document.createElement('div');
    thumbWrap.className = 'game-thumb-wrap';

    const fallback = document.createElement('div');
    fallback.className = 'media-fallback';
    fallback.setAttribute('aria-hidden', 'true');
    const fallbackLabel = document.createElement('span');
    fallbackLabel.textContent = game.title;
    fallback.appendChild(fallbackLabel);
    thumbWrap.appendChild(fallback);

    if (game.thumbnail) {
      const img = document.createElement('img');
      img.src = game.thumbnail;
      img.alt = `${game.title} thumbnail`;
      img.loading = 'lazy';
      img.referrerPolicy = 'no-referrer';
      img.addEventListener('error', () => {
        img.style.display = 'none';
      });
      thumbWrap.appendChild(img);
    }

    thumbBtn.appendChild(thumbWrap);
    card.appendChild(thumbBtn);

    const body = document.createElement('div');
    body.className = 'game-card-body';

    const meta = document.createElement('div');
    meta.className = 'game-card-meta';
    meta.textContent = `${game.category} · ${game.players || '1 Player'} · ${game.controls || 'Keyboard'}`;
    body.appendChild(meta);

    const title = document.createElement('h3');
    title.className = 'game-card-title';
    title.textContent = game.title;
    body.appendChild(title);

    const desc = document.createElement('p');
    desc.className = 'game-card-desc';
    desc.textContent = game.description || 'Embedded unblocked HTML5 iframe game.';
    body.appendChild(desc);

    const actions = document.createElement('div');
    actions.className = 'game-card-actions';

    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'btn-primary';
    playBtn.textContent = 'Play';
    playBtn.addEventListener('click', () => openGameStage(game));

    const favBtn = document.createElement('button');
    favBtn.type = 'button';
    const faved = isFavorite(game.id);
    favBtn.className = `btn-ghost${faved ? ' is-favorited' : ''}`;
    favBtn.textContent = faved ? 'Saved' : 'Save';
    favBtn.setAttribute('aria-pressed', String(faved));
    favBtn.addEventListener('click', () => toggleFavorite(game.id));

    actions.appendChild(playBtn);
    actions.appendChild(favBtn);

    if (game.custom) {
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn-ghost';
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', () => removeCustomGame(game.id));
      actions.appendChild(removeBtn);
    }

    body.appendChild(actions);
    card.appendChild(body);
    fragment.appendChild(card);
  });

  els.gamesGrid.appendChild(fragment);
}

function buildIframeElement(game) {
  const cfg = game.iframe || {};
  let src = cfg.src || '';

  if (!src && cfg.html) {
    const parsed = parseIframeSnippet(cfg.html);
    if (parsed) {
      src = parsed.src;
    }
  }

  const iframe = document.createElement('iframe');
  iframe.src = src;
  iframe.title = cfg.title || `${game.title} Game`;
  iframe.width = cfg.width || '100%';
  iframe.height = cfg.height || '100%';
  iframe.setAttribute('allow', cfg.allow || 'autoplay; fullscreen');
  iframe.setAttribute('allowfullscreen', '');
  if (cfg.sandbox) {
    iframe.setAttribute('sandbox', cfg.sandbox);
  }

  iframe.addEventListener('load', () => {
    try {
      iframe.contentWindow?.focus();
    } catch {
      // Cross-origin iframes cannot be focused programmatically
    }
  });

  return iframe;
}

function updateStageFavoriteButton() {
  if (!state.currentGame) return;
  const faved = isFavorite(state.currentGame.id);
  els.stageFavoriteBtn.textContent = faved ? 'Saved' : 'Save';
  els.stageFavoriteBtn.classList.toggle('is-favorited', faved);
  els.stageFavoriteBtn.setAttribute('aria-pressed', String(faved));
}

function openGameStage(game) {
  state.currentGame = game;
  recordRecent(game.id);

  els.stageTitle.textContent = game.title;
  els.stageMeta.textContent = `${game.category} · ${game.players || '1 Player'} · ${game.controls || 'Keyboard'}`;
  updateStageFavoriteButton();

  els.iframeContainer.innerHTML = '';
  const iframeEl = buildIframeElement(game);
  els.iframeContainer.appendChild(iframeEl);

  els.stageJsonDrawer.hidden = true;
  els.stageJsonCode.textContent = JSON.stringify(game, null, 2);

  els.playerOverlay.hidden = false;
  document.body.style.overflow = 'hidden';

  if (state.activeView === 'recent' || state.sortBy === 'recent') {
    renderCatalog();
  }
}

function closeGameStage() {
  els.playerOverlay.hidden = true;
  els.iframeContainer.innerHTML = '';
  els.stageShell.classList.remove('is-theater');
  state.theaterMode = false;
  state.currentGame = null;
  document.body.style.overflow = '';
}

function parseIframeSnippet(input) {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (trimmed.toLowerCase().includes('<iframe')) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(trimmed, 'text/html');
    const iframeEl = doc.querySelector('iframe');
    if (!iframeEl) return null;
    const rawSrc = iframeEl.getAttribute('src') || '';
    if (!isSafeIframeUrl(rawSrc)) return null;
    return {
      src: rawSrc,
      title: iframeEl.getAttribute('title') || '',
      allow: iframeEl.getAttribute('allow') || 'autoplay; fullscreen'
    };
  }

  if (!isSafeIframeUrl(trimmed)) return null;
  return {
    src: trimmed,
    title: '',
    allow: 'autoplay; fullscreen'
  };
}

function isSafeIframeUrl(url) {
  if (!url) return false;
  if (url.startsWith('./') || url.startsWith('/')) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function removeCustomGame(id) {
  state.customGames = state.customGames.filter((g) => g.id !== id);
  saveLocalArray(STORAGE_KEYS.customGames, state.customGames);
  renderCatalog();
}

function buildExportCatalog() {
  return {
    catalogName: 'Pocket Arcade',
    version: '1.0',
    games: getAllGames().map(({ custom, ...rest }) => rest)
  };
}

function downloadCatalogJson() {
  const payload = JSON.stringify(buildExportCatalog(), null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'games.json';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function openJsonInspector() {
  els.fullJsonPreview.textContent = JSON.stringify(buildExportCatalog(), null, 2);
  els.jsonInspectorOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeJsonInspector() {
  els.jsonInspectorOverlay.hidden = true;
  if (els.playerOverlay.hidden && els.addGameOverlay.hidden) {
    document.body.style.overflow = '';
  }
}

function openAddGameModal() {
  els.addGameError.hidden = true;
  els.addGameForm.reset();
  els.addGameOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
  els.gameTitleInput.focus();
}

function closeAddGameModal() {
  els.addGameOverlay.hidden = true;
  if (els.playerOverlay.hidden && els.jsonInspectorOverlay.hidden) {
    document.body.style.overflow = '';
  }
}

function bindEvents() {
  els.navLinks.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.activeView = btn.dataset.view;
      els.navLinks.forEach((n) => n.classList.toggle('is-active', n === btn));
      renderCatalog();
    });
  });

  els.brandHome.addEventListener('click', (e) => {
    e.preventDefault();
    state.activeView = 'all';
    state.activeCategory = 'All';
    state.searchQuery = '';
    els.searchInput.value = '';
    els.navLinks.forEach((n) => n.classList.toggle('is-active', n.dataset.view === 'all'));
    els.categoryTabs.forEach((t) => {
      const active = t.dataset.category === 'All';
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
    });
    renderCatalog();
  });

  els.categoryTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      state.activeCategory = tab.dataset.category;
      els.categoryTabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', String(active));
      });
      renderCatalog();
    });
  });

  els.searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderCatalog();
  });

  els.sortSelect.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    renderCatalog();
  });

  els.resetFiltersBtn.addEventListener('click', () => {
    state.activeView = 'all';
    state.activeCategory = 'All';
    state.searchQuery = '';
    els.searchInput.value = '';
    els.navLinks.forEach((n) => n.classList.toggle('is-active', n.dataset.view === 'all'));
    els.categoryTabs.forEach((t) => {
      const active = t.dataset.category === 'All';
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
    });
    renderCatalog();
  });

  els.randomGameBtn.addEventListener('click', () => {
    const games = getAllGames();
    if (!games.length) return;
    const pick = games[Math.floor(Math.random() * games.length)];
    openGameStage(pick);
  });

  const launchFeatured = () => {
    const games = getAllGames();
    const featured = games.find((g) => g.featured) || games[0];
    if (featured) openGameStage(featured);
  };

  els.playFeaturedBtn.addEventListener('click', launchFeatured);
  els.heroCard.addEventListener('click', launchFeatured);
  els.heroCard.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      launchFeatured();
    }
  });

  els.closeStageBtn.addEventListener('click', closeGameStage);
  els.stageFavoriteBtn.addEventListener('click', () => {
    if (state.currentGame) toggleFavorite(state.currentGame.id);
  });

  els.stageJsonBtn.addEventListener('click', () => {
    els.stageJsonDrawer.hidden = !els.stageJsonDrawer.hidden;
  });

  els.copyEntryJsonBtn.addEventListener('click', async () => {
    if (!state.currentGame) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(state.currentGame, null, 2));
      els.copyEntryJsonBtn.textContent = 'Copied';
      setTimeout(() => {
        els.copyEntryJsonBtn.textContent = 'Copy JSON';
      }, 1500);
    } catch {
      els.copyEntryJsonBtn.textContent = 'Copy failed';
    }
  });

  els.reloadFrameBtn.addEventListener('click', () => {
    const iframe = els.iframeContainer.querySelector('iframe');
    if (iframe) {
      const src = iframe.src;
      iframe.src = src;
    }
  });

  els.theaterModeBtn.addEventListener('click', () => {
    state.theaterMode = !state.theaterMode;
    els.stageShell.classList.toggle('is-theater', state.theaterMode);
    els.theaterModeBtn.textContent = state.theaterMode ? 'Standard' : 'Theater';
  });

  els.fullscreenBtn.addEventListener('click', () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (els.stageFrameWrap.requestFullscreen) {
      els.stageFrameWrap.requestFullscreen().catch(() => {});
    }
  });

  els.openAddGameBtn.addEventListener('click', openAddGameModal);
  els.closeAddModalBtn.addEventListener('click', closeAddGameModal);
  els.cancelAddBtn.addEventListener('click', closeAddGameModal);

  els.addGameForm.addEventListener('submit', (e) => {
    e.preventDefault();
    els.addGameError.hidden = true;

    const title = els.gameTitleInput.value.trim();
    const category = els.gameCategoryInput.value;
    const controls = els.gameControlsInput.value.trim() || 'Keyboard / Mouse';
    const rawIframe = els.gameIframeInput.value.trim();
    const description = els.gameDescInput.value.trim() || 'Custom embedded iframe game.';

    const parsedIframe = parseIframeSnippet(rawIframe);
    if (!title || !parsedIframe) {
      els.addGameError.textContent = 'Enter a valid http(s) URL, relative /games/ path, or <iframe> tag.';
      els.addGameError.hidden = false;
      return;
    }

    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
    const newGame = {
      id: slug,
      title,
      category,
      players: '1 Player',
      controls,
      description,
      thumbnail: '',
      featured: false,
      custom: true,
      iframe: {
        src: parsedIframe.src,
        title: parsedIframe.title || `${title} Game`,
        width: '100%',
        height: '100%',
        allow: parsedIframe.allow,
        sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups',
        html: `<iframe src="${parsedIframe.src.replace(/"/g, '&quot;')}" title="${title.replace(/"/g, '&quot;')} Game" width="100%" height="100%" frameborder="0" allowfullscreen loading="lazy"></iframe>`
      }
    };

    state.customGames = [newGame, ...state.customGames];
    saveLocalArray(STORAGE_KEYS.customGames, state.customGames);
    closeAddGameModal();
    renderCatalog();
  });

  els.inspectCatalogJsonBtn.addEventListener('click', openJsonInspector);
  els.footerViewJsonBtn.addEventListener('click', openJsonInspector);
  els.closeJsonModalBtn.addEventListener('click', closeJsonInspector);
  els.exportJsonBtn.addEventListener('click', downloadCatalogJson);
  els.downloadFullJsonBtn.addEventListener('click', downloadCatalogJson);

  els.copyFullJsonBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(buildExportCatalog(), null, 2));
      els.copyFullJsonBtn.textContent = 'Copied';
      setTimeout(() => {
        els.copyFullJsonBtn.textContent = 'Copy Full JSON';
      }, 1500);
    } catch {
      els.copyFullJsonBtn.textContent = 'Copy failed';
    }
  });

  els.footerResetCustomBtn.addEventListener('click', () => {
    state.customGames = [];
    saveLocalArray(STORAGE_KEYS.customGames, []);
    renderCatalog();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!els.addGameOverlay.hidden) closeAddGameModal();
      else if (!els.jsonInspectorOverlay.hidden) closeJsonInspector();
      else if (!els.playerOverlay.hidden) closeGameStage();
    }
  });
}

export async function initArcade() {
  state.favorites = loadLocalArray(STORAGE_KEYS.favorites);
  state.recent = loadLocalArray(STORAGE_KEYS.recent);
  state.customGames = loadLocalArray(STORAGE_KEYS.customGames);

  bindEvents();

  try {
    const response = await fetch('./games.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    state.baseGames = Array.isArray(data.games) ? data.games : [];
  } catch (err) {
    console.error('Failed to load games.json:', err);
    state.baseGames = [];
    els.catalogCount.textContent = 'Unable to load games.json';
  }

  updateHero(getAllGames());
  renderCatalog();
}
