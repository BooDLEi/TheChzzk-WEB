/* ============================================================
   더치지직 (The Chzzk) - Main Application Controller (app.js)
   ============================================================ */

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getChzzkNoStoreLoader() {
  if (window._ChzzkNoStoreLoader) return window._ChzzkNoStoreLoader;
  if (!window.Hls) return undefined;
  try {
    const tmp = new window.Hls({ progressive: true, autoStartLoad: false });
    const FetchLoaderBase = tmp.config && tmp.config.loader;
    tmp.destroy();
    if (FetchLoaderBase && FetchLoaderBase.prototype && typeof FetchLoaderBase.prototype.load === 'function') {
      class ChzzkNoStoreLoader extends FetchLoaderBase {
        load(context, config, callbacks) {
          // Disable progressive chunk streaming (prevents MSE micro-gaps and extra chunk allocations)
          // while retaining FetchLoader retries, Range headers, aborts, and cache:'no-store'.
          const nonProgCfg = Object.assign({}, config, { highWaterMark: Infinity });
          super.load(context, nonProgCfg, callbacks);
        }
      }
      window._ChzzkNoStoreLoader = ChzzkNoStoreLoader;
      return ChzzkNoStoreLoader;
    }
  } catch (_) {}
  return undefined;
}

/**
 * Shared hls.js config builder. Uses non-progressive FetchLoader with cache: 'no-store'
 * so Chzzk CDN's max-age=3600 segments never accumulate in Blink MemoryCache / HttpCache.
 */
window.buildChzzkHlsConfig = function buildChzzkHlsConfig(overrides = {}, isLive = true) {
  const fetchSetup = (context, initParams) => {
    try {
      return new Request(context.url, Object.assign({}, initParams, { cache: 'no-store' }));
    } catch (_) {
      return new Request(context.url, initParams);
    }
  };
  const customLoader = getChzzkNoStoreLoader();
  const defaults = isLive
    ? {
        enableWorker: false,
        progressive: false,
        fetchSetup,
        lowLatencyMode: true,
        startFragPrefetch: true,
        backBufferLength: 20,
        maxBufferLength: 16,
        maxMaxBufferLength: 28,
        maxBufferSize: 20 * 1000 * 1000,
        maxLiveSyncPlaybackRate: 1.0
      }
    : {
        enableWorker: true,
        progressive: false,
        fetchSetup,
        lowLatencyMode: false,
        backBufferLength: 25,
        maxBufferLength: 25,
        maxMaxBufferLength: 45,
        maxBufferSize: 28 * 1000 * 1000
      };
  if (customLoader) {
    defaults.loader = customLoader;
  }
  return Object.assign(defaults, overrides || {});
};

class ChzzkApp {
  constructor() {
    this.currentTab = 'explore';
    this.lives = [];
    this.followingLives = [];
    this.followingChannels = [];
    this.followingChannelIds = new Set();
    this.popularLives = [];
    this.bookmarks = [];
    this.searchKeyword = '';
    this.selectedCategory = '';
    this.loginPollingInterval = null;
    this.lastVaultSubtab = 'recorder';
    this.homeBookmarkFilterActive = false;
    this._lastExploreSyncAt = 0;

    // Master volume state (Chzzk & YouTube independent)
    this.masterChzzkVolume = 1.0;
    this.masterChzzkMuted = false;
    this.masterYTVolume = 1.0;
    this.masterYTMuted = false;
    this.masterVolume = 1.0;
    this.masterMuted = false;

    // Live Notifications & Preferences (Request 1)
    this.channelNotifications = new Map();
    this.knownOnlineChannels = new Set();
    this.isFirstLiveCheck = true;
    this.audioCtx = null;
    this.liveNotificationContainer = null;
    this._liveNotifyTimer = null;
    this._lastIsMobileUI = null;

    this.initElements();
    this.bindEvents();
    this.initMasterVolume();
    this.setupNavTabsDragScroll();
    this.initLiveNotificationWatcher();
    this.loadInitialData();
  }

  initElements() {
    this.navBtns = document.querySelectorAll('.nav-btn');
    this.tabPanes = document.querySelectorAll('.tab-pane');
    
    this.liveSearchInput = document.getElementById('liveSearchInput');
    this.refreshLivesBtn = document.getElementById('refreshLivesBtn');
    this.categoryChipsBar = document.getElementById('categoryChipsBar');
    
    // Sections
    this.followingLivesSection = document.getElementById('followingLivesSection');
    this.followingLivesGrid = document.getElementById('followingLivesGrid');
    this.followingCountBadge = document.getElementById('followingCountBadge');

    this.popularLivesGrid = document.getElementById('popularLivesGrid');
    this.livesGrid = document.getElementById('livesGrid');
    this.popularLivesSection = document.getElementById('popularLivesSection');
    this.liveTotalCountDisplay = document.getElementById('liveTotalCountDisplay');

    // Offline Channel Search
    this.searchOfflineChannelToggleBtn = document.getElementById('searchOfflineChannelToggleBtn');
    this.channelSearchResultsSection = document.getElementById('channelSearchResultsSection');
    this.channelSearchCountBadge = document.getElementById('channelSearchCountBadge');
    this.channelSearchResultsGrid = document.getElementById('channelSearchResultsGrid');
    this.closeChannelSearchBtn = document.getElementById('closeChannelSearchBtn');
    this.offlineSearchMode = false;

    // Following Tab Elements
    this.followingTabLivesGrid = document.getElementById('followingTabLivesGrid');
    this.followingTabAllGrid = document.getElementById('followingTabAllGrid');
    this.followingLiveCountBadge = document.getElementById('followingLiveCountBadge');
    this.followingAllCountBadge = document.getElementById('followingAllCountBadge');
    this.followingSearchInput = document.getElementById('followingSearchInput');
    this.refreshFollowingBtn = document.getElementById('refreshFollowingBtn');
    this.followingSummaryDisplay = document.getElementById('followingSummaryDisplay');
    this.followingBadge = document.getElementById('following-badge');

    // Bookmarks
    this.bookmarksGrid = document.getElementById('bookmarksGrid');
    this.bookmarksOnlineSection = document.getElementById('bookmarksOnlineSection');
    this.bookmarksOnlineGrid = document.getElementById('bookmarksOnlineGrid');
    this.bookmarksOnlineCountBadge = document.getElementById('bookmarksOnlineCountBadge');
    this.bookmarksOfflineSection = document.getElementById('bookmarksOfflineSection');
    this.bookmarksOfflineGrid = document.getElementById('bookmarksOfflineGrid');
    this.bookmarksOfflineCountBadge = document.getElementById('bookmarksOfflineCountBadge');
    this.bookmarksEmptyState = document.getElementById('bookmarksEmptyState');
    this.addBookmarkInput = document.getElementById('addBookmarkInput');
    this.addBookmarkBtn = document.getElementById('addBookmarkBtn');
    this.importChzzkFollowBtn = document.getElementById('importChzzkFollowBtn');
    this.syncFollowingBtn = document.getElementById('syncFollowingBtn');
    this.refreshBookmarksBtn = document.getElementById('refreshBookmarksBtn');
    this.bookmarksBadge = document.getElementById('bookmarks-badge');
    this.bookmarksSummaryDisplay = document.getElementById('bookmarksSummaryDisplay');

    // Mobile UI & Home Bookmark Filter Elements
    this.mobileVaultHeader = document.getElementById('mobileVaultHeader');
    this.mobileHomeBookmarkFilterBtn = document.getElementById('mobileHomeBookmarkFilterBtn');
    this.mobileHomeBookmarksCount = document.getElementById('mobileHomeBookmarksCount');
    this.mobileHomeBookmarksSection = document.getElementById('mobileHomeBookmarksSection');
    this.mobileHomeBookmarksOnlineSection = document.getElementById('mobileHomeBookmarksOnlineSection');
    this.mobileHomeBookmarksOnlineGrid = document.getElementById('mobileHomeBookmarksOnlineGrid');
    this.mobileHomeBmOnlineBadge = document.getElementById('mobileHomeBmOnlineBadge');
    this.mobileHomeBookmarksOfflineSection = document.getElementById('mobileHomeBookmarksOfflineSection');
    this.mobileHomeBookmarksOfflineGrid = document.getElementById('mobileHomeBookmarksOfflineGrid');
    this.mobileHomeBmOfflineBadge = document.getElementById('mobileHomeBmOfflineBadge');
    this.vaultBadge = document.getElementById('vault-badge');

    // Settings & Secure 1-Time Follow Import
    this.openBrowserLoginBtn = document.getElementById('openBrowserLoginBtn');
    this.openDefaultBrowserBtn = document.getElementById('openDefaultBrowserBtn');
    this.cookieInput = document.getElementById('cookieInput');
    this.saveCookiesBtn = document.getElementById('saveCookiesBtn');
    this.clearCookiesBtn = document.getElementById('clearCookiesBtn');
    this.cookieStatusText = document.getElementById('cookieStatusText');
    this.categoryFilterInput = document.getElementById('categoryFilterInput');
    this.liveNotificationContainer = document.getElementById('liveNotificationContainer');

    // Cloudflare 1.1.1.1 & Proxy Settings
    this.proxyEnableToggle = document.getElementById('proxyEnableToggle');
    this.proxyEnableText = document.getElementById('proxyEnableText');
    this.proxyModeWarp = document.getElementById('proxyModeWarp');
    this.proxyModeCustom = document.getElementById('proxyModeCustom');
    this.proxyUrlInput = document.getElementById('proxyUrlInput');
    this.testProxyBtn = document.getElementById('testProxyBtn');
    this.saveProxyBtn = document.getElementById('saveProxyBtn');
    this.proxyTestResult = document.getElementById('proxyTestResult');
  }

  bindEvents() {
    // Nav tabs
    this.navBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });

    if (this.categoryFilterInput) {
      this.categoryFilterInput.addEventListener('input', () => this.renderCategoryChips());
    }

    if (this.refreshFollowingBtn) {
      this.refreshFollowingBtn.addEventListener('click', () => this.fetchFollowingTabContent());
    }

    if (this.followingSearchInput) {
      this.followingSearchInput.addEventListener('input', (e) => this.filterFollowingTab(e.target.value));
    }

    // Search
    let searchTimeout = null;
    if (this.liveSearchInput) {
      this.liveSearchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        this.searchKeyword = e.target.value.trim();
        searchTimeout = setTimeout(() => {
          this.filterAndRenderLives();
          if (this.offlineSearchMode && this.searchKeyword) {
            this.searchOfflineChannels(this.searchKeyword);
          }
        }, 200);
      });
      this.liveSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && this.searchKeyword) {
          if (this.offlineSearchMode) {
            this.searchOfflineChannels(this.searchKeyword);
          }
        }
      });
    }

    if (this.searchOfflineChannelToggleBtn) {
      this.searchOfflineChannelToggleBtn.addEventListener('click', () => {
        this.toggleOfflineChannelSearch();
      });
    }

    if (this.closeChannelSearchBtn) {
      this.closeChannelSearchBtn.addEventListener('click', () => {
        this.closeOfflineChannelSearch();
      });
    }

    if (this.refreshLivesBtn) {
      this.refreshLivesBtn.addEventListener('click', () => {
        this.fetchLives();
        this.fetchFollowingLives();
      });
    }

    // Bookmarks & 1-Time Follow Import
    if (this.addBookmarkBtn) {
      this.addBookmarkBtn.addEventListener('click', () => this.addBookmark());
    }
    if (this.addBookmarkInput) {
      this.addBookmarkInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.addBookmark();
      });
    }

    this.syncResponsiveMobileLayout();
    window.addEventListener('resize', () => this.syncResponsiveMobileLayout());
    window.addEventListener('orientationchange', () => setTimeout(() => this.syncResponsiveMobileLayout(), 60));
    if (this.importChzzkFollowBtn) {
      this.importChzzkFollowBtn.addEventListener('click', () => this.importChzzkFollows());
    }
    if (this.syncFollowingBtn) {
      this.syncFollowingBtn.addEventListener('click', () => this.importChzzkFollows());
    }
    if (this.refreshBookmarksBtn) {
      this.refreshBookmarksBtn.addEventListener('click', () => this.fetchBookmarks());
    }

    // Browser 1-Time Import & Manual Cookies
    if (this.openBrowserLoginBtn) {
      this.openBrowserLoginBtn.addEventListener('click', () => this.importChzzkFollows());
    }
    if (this.openDefaultBrowserBtn) {
      this.openDefaultBrowserBtn.addEventListener('click', () => this.openDefaultBrowserLogin());
    }
    if (this.saveCookiesBtn) {
      this.saveCookiesBtn.addEventListener('click', () => this.importFollowsByCookies());
    }
    if (this.clearCookiesBtn) {
      this.clearCookiesBtn.addEventListener('click', () => this.clearCookies());
    }

    // Cloudflare 1.1.1.1 & Proxy Events
    if (this.proxyEnableToggle) {
      this.proxyEnableToggle.addEventListener('change', (e) => {
        const on = e.target.checked;
        if (this.proxyEnableText) {
          this.proxyEnableText.textContent = on ? '켜짐 (활성)' : '꺼짐 (비활성)';
          this.proxyEnableText.style.color = on ? 'var(--accent-color)' : 'var(--text-muted)';
        }
      });
    }
    if (this.proxyModeWarp) {
      this.proxyModeWarp.addEventListener('change', () => {
        if (this.proxyModeWarp.checked && this.proxyUrlInput) {
          this.proxyUrlInput.value = 'socks5://127.0.0.1:40000';
        }
      });
    }
    if (this.proxyModeCustom) {
      this.proxyModeCustom.addEventListener('change', () => {
        if (this.proxyModeCustom.checked && this.proxyUrlInput) {
          if (this.proxyUrlInput.value === 'socks5://127.0.0.1:40000') {
            this.proxyUrlInput.value = '';
          }
          this.proxyUrlInput.focus();
        }
      });
    }
    if (this.testProxyBtn) {
      this.testProxyBtn.addEventListener('click', () => this.testProxyConnection());
    }
    if (this.saveProxyBtn) {
      this.saveProxyBtn.addEventListener('click', () => this.saveProxySettings());
    }

    // Playback Diagnostics situation log buttons (상황로그파일)
    const refreshDiagBtn = document.getElementById('refreshDiagBtn');
    if (refreshDiagBtn) {
      refreshDiagBtn.addEventListener('click', () => this.loadDiagnosticsLog());
    }
    const copyDiagBtn = document.getElementById('copyDiagBtn');
    if (copyDiagBtn) {
      copyDiagBtn.addEventListener('click', () => this.copyDiagnosticsLog());
    }
    const openDiagFileBtn = document.getElementById('openDiagFileBtn');
    if (openDiagFileBtn) {
      openDiagFileBtn.addEventListener('click', () => this.openDiagnosticsFile());
    }
    const clearDiagBtn = document.getElementById('clearDiagBtn');
    if (clearDiagBtn) {
      clearDiagBtn.addEventListener('click', () => this.clearDiagnosticsLog());
    }
  }

  setupNavTabsDragScroll() {
    const navTabs = document.querySelector('.nav-tabs');
    if (!navTabs) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let hasMoved = false;

    navTabs.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      isDown = true;
      hasMoved = false;
      navTabs.classList.add('is-dragging');
      startX = e.pageX - navTabs.offsetLeft;
      scrollLeft = navTabs.scrollLeft;
    });

    navTabs.addEventListener('mouseleave', () => {
      isDown = false;
      navTabs.classList.remove('is-dragging');
    });

    navTabs.addEventListener('mouseup', () => {
      isDown = false;
      navTabs.classList.remove('is-dragging');
    });

    navTabs.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - navTabs.offsetLeft;
      const walk = (x - startX) * 1.5;
      if (Math.abs(walk) > 5) {
        hasMoved = true;
      }
      navTabs.scrollLeft = scrollLeft - walk;
    });

    // Prevent button click if the user was actually dragging to scroll
    navTabs.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (hasMoved) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      }, true);
    });
  }

  initMasterVolume() {
    // 1. Chzzk Master Volume
    this.masterChzzkMuteBtn = document.getElementById('masterChzzkMuteBtn');
    this.masterChzzkVolumeSlider = document.getElementById('masterChzzkVolumeSlider');
    this.masterChzzkVolumeText = document.getElementById('masterChzzkVolumeText');

    if (this.masterChzzkVolumeSlider) {
      this.masterChzzkVolumeSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        this.setChzzkMasterVolume(val / 100);
      });
    }
    if (this.masterChzzkMuteBtn) {
      this.masterChzzkMuteBtn.addEventListener('click', () => {
        this.toggleChzzkMute();
      });
    }

    // 2. YouTube Master Volume
    this.masterYTMuteBtn = document.getElementById('masterYTMuteBtn');
    this.masterYTVolumeSlider = document.getElementById('masterYTVolumeSlider');
    this.masterYTVolumeText = document.getElementById('masterYTVolumeText');

    if (this.masterYTVolumeSlider) {
      this.masterYTVolumeSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        this.setYTMasterVolume(val / 100);
      });
    }
    if (this.masterYTMuteBtn) {
      this.masterYTMuteBtn.addEventListener('click', () => {
        this.toggleYTMute();
      });
    }

    // 3. Fallbacks
    this.masterMuteBtn = document.getElementById('masterMuteBtn');
    this.masterVolumeSlider = document.getElementById('masterVolumeSlider');
    this.masterVolumeText = document.getElementById('masterVolumeText');

    this.updateMasterVolumeUI();
  }

  setChzzkMasterVolume(vol) {
    this.masterChzzkVolume = Math.max(0, Math.min(1, vol));
    if (this.masterChzzkVolume > 0 && this.masterChzzkMuted) {
      this.masterChzzkMuted = false;
    }
    this.masterVolume = this.masterChzzkVolume;
    this.masterMuted = this.masterChzzkMuted;
    this.updateMasterVolumeUI();
    this.applyMasterVolumeToChzzk();
  }

  toggleChzzkMute() {
    this.masterChzzkMuted = !this.masterChzzkMuted;
    this.masterMuted = this.masterChzzkMuted;
    this.updateMasterVolumeUI();
    this.applyMasterVolumeToChzzk();
  }

  setYTMasterVolume(vol) {
    this.masterYTVolume = Math.max(0, Math.min(1, vol));
    if (this.masterYTVolume > 0 && this.masterYTMuted) {
      this.masterYTMuted = false;
    }
    this.updateMasterVolumeUI();
    this.applyMasterVolumeToYT();
  }

  toggleYTMute() {
    this.masterYTMuted = !this.masterYTMuted;
    this.updateMasterVolumeUI();
    this.applyMasterVolumeToYT();
  }

  // Legacy single volume setter
  setMasterVolume(vol) {
    this.setChzzkMasterVolume(vol);
    this.setYTMasterVolume(vol);
  }

  toggleMasterMute() {
    this.toggleChzzkMute();
    this.toggleYTMute();
  }

  updateMasterVolumeUI() {
    // A. Chzzk UI
    const chzzkPct = Math.round(this.masterChzzkVolume * 100);
    if (this.masterChzzkVolumeSlider) {
      this.masterChzzkVolumeSlider.value = this.masterChzzkMuted ? 0 : chzzkPct;
    }
    if (this.masterChzzkVolumeText) {
      this.masterChzzkVolumeText.textContent = this.masterChzzkMuted ? '음소거' : `${chzzkPct}%`;
    }
    if (this.masterChzzkMuteBtn) {
      if (this.masterChzzkMuted || this.masterChzzkVolume === 0) {
        this.masterChzzkMuteBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;
        this.masterChzzkMuteBtn.classList.add('muted');
      } else {
        this.masterChzzkMuteBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
        this.masterChzzkMuteBtn.classList.remove('muted');
      }
    }

    // B. YouTube UI
    const ytPct = Math.round(this.masterYTVolume * 100);
    if (this.masterYTVolumeSlider) {
      this.masterYTVolumeSlider.value = this.masterYTMuted ? 0 : ytPct;
    }
    if (this.masterYTVolumeText) {
      this.masterYTVolumeText.textContent = this.masterYTMuted ? '음소거' : `${ytPct}%`;
    }
    if (this.masterYTMuteBtn) {
      if (this.masterYTMuted || this.masterYTVolume === 0) {
        this.masterYTMuteBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;
        this.masterYTMuteBtn.classList.add('muted');
      } else {
        this.masterYTMuteBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
        this.masterYTMuteBtn.classList.remove('muted');
      }
    }
  }

  applyMasterVolumeToChzzk() {
    if (window.multiview && typeof window.multiview.applyMasterVolumeToChzzk === 'function') {
      window.multiview.applyMasterVolumeToChzzk(this.masterChzzkVolume, this.masterChzzkMuted);
    }
    const videos = document.querySelectorAll('video');
    videos.forEach(v => {
      if (!v.closest('.slot-video-area')) {
        v.muted = this.masterChzzkMuted;
        if (!this.masterChzzkMuted) v.volume = this.masterChzzkVolume;
      }
    });
  }

  applyMasterVolumeToYT() {
    if (window.multiview && typeof window.multiview.applyMasterVolumeToYT === 'function') {
      window.multiview.applyMasterVolumeToYT(this.masterYTVolume, this.masterYTMuted);
    }
  }

  applyMasterVolumeToAll() {
    this.applyMasterVolumeToChzzk();
    this.applyMasterVolumeToYT();
  }

  isMobileUIMode() {
    const root = document.documentElement;
    if (root.classList.contains('is-android-apk')) return true;
    if (window.innerWidth <= 960) return true;
    if (window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches && window.innerWidth <= 1366) {
      return true;
    }
    return false;
  }

  isMobileShortformMode() {
    return Boolean(window.__IS_STATIC_WEB__ && this.isMobileUIMode());
  }

  isShortformTabActive(tabName = this.currentTab) {
    if (tabName === 'clips') return true;
    if (tabName === 'youtube' && window.youtubeUI && window.youtubeUI.currentSubTab === 'shorts') return true;
    return false;
  }

  syncResponsiveMobileLayout() {
    const isMobile = this.isMobileUIMode();
    const isShortformMobile = this.isMobileShortformMode();
    document.documentElement.classList.toggle('is-mobile-ui', isMobile);
    document.documentElement.classList.toggle('is-mobile-shortform', isShortformMobile);

    // 1. Explore layout: move category strip + bookmark filter + icon refresh below search bar on mobile
    const exploreLayout = document.getElementById('exploreLayout');
    const catSidebar = document.getElementById('exploreCategorySidebar');
    const mobileFilterRow = document.getElementById('mobileExploreFilterRow');
    const mobileCatsSlot = document.getElementById('mobileExploreCatsSlot');
    const mobileActions = document.getElementById('mobileExploreFilterActions');
    const toolbarRight = document.getElementById('exploreToolbarRight');
    const refreshBtn = document.getElementById('refreshLivesBtn');
    const searchOffText = document.getElementById('searchOfflineText');

    if (exploreLayout && catSidebar && mobileFilterRow && mobileCatsSlot && mobileActions && toolbarRight && refreshBtn) {
      if (isMobile) {
        if (catSidebar.parentElement !== mobileCatsSlot) {
          mobileCatsSlot.appendChild(catSidebar);
        }
        if (refreshBtn.parentElement !== mobileActions) {
          mobileActions.appendChild(refreshBtn);
        }
        mobileFilterRow.style.display = 'flex';
        if (searchOffText) searchOffText.textContent = '오프라인';
      } else {
        if (catSidebar.parentElement !== exploreLayout) {
          exploreLayout.insertBefore(catSidebar, exploreLayout.firstChild);
        }
        if (refreshBtn.parentElement !== toolbarRight) {
          toolbarRight.appendChild(refreshBtn);
        }
        mobileFilterRow.style.display = 'none';
        if (searchOffText) searchOffText.textContent = '오프라인 채널 검색';
        if (this.mobileHomeBookmarksSection) {
          this.mobileHomeBookmarksSection.style.display = 'none';
        }
      }
    }

    // 2. Multiview toolbar: keep layout modes at top, move slot add/remove/clear to bottom bar on mobile
    const mvSlotGroup = document.getElementById('mvSlotActionsGroup');
    const mvToolbarLeft = document.getElementById('mvToolbarLeft');
    const mvMobileBottom = document.getElementById('mvMobileBottomBar');
    if (mvSlotGroup && mvToolbarLeft && mvMobileBottom) {
      if (isMobile) {
        if (mvSlotGroup.parentElement !== mvMobileBottom) {
          mvMobileBottom.appendChild(mvSlotGroup);
        }
        mvMobileBottom.style.display = 'flex';
      } else {
        if (mvSlotGroup.parentElement !== mvToolbarLeft) {
          mvToolbarLeft.insertBefore(mvSlotGroup, mvToolbarLeft.firstChild);
        }
        mvMobileBottom.style.display = 'none';
      }
    }

    this.updateMobileVaultHeaderState(this.currentTab);
    const modeChanged = this._lastIsMobileUI !== null && this._lastIsMobileUI !== isMobile;
    this._lastIsMobileUI = isMobile;
    if (modeChanged) {
      if (isMobile) {
        if (this._liveNotifyTimer) {
          clearInterval(this._liveNotifyTimer);
          this._liveNotifyTimer = null;
        }
        if (this.liveNotificationContainer) this.liveNotificationContainer.innerHTML = '';
      } else {
        this.initLiveNotificationWatcher();
      }
      if (this.lives && this.lives.length > 0) this.filterAndRenderLives();
      if (this.bookmarks && this.bookmarks.length > 0) this.renderBookmarks();
      if (window.channelUI && typeof window.channelUI.updateNotifyButtonState === 'function') {
        window.channelUI.updateNotifyButtonState();
      }
    } else if (isMobile && this.homeBookmarkFilterActive && this.currentTab === 'explore') {
      this.renderMobileHomeBookmarks();
    }
    if (window.multiview && (window.multiview.layoutMode === 'focus' || window.multiview.layoutMode === 'auto')) {
      window.multiview.updateGridLayout();
      window.multiview.applySlotLayoutStyles();
    }
    if (window.multiview && typeof window.multiview.syncShortformPiP === 'function') {
      window.multiview.syncShortformPiP();
    }
  }

  updateMobileVaultHeaderState(activeTab) {
    const isVaultTab = activeTab === 'recorder' || activeTab === 'editor' || activeTab === 'settings';
    const isMobile = this.isMobileUIMode();
    if (this.mobileVaultHeader) {
      this.mobileVaultHeader.style.display = (isMobile && isVaultTab) ? 'flex' : 'none';
      if (isVaultTab) {
        this.mobileVaultHeader.querySelectorAll('.mobile-vault-tab-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.vaultSubtab === activeTab);
        });
      }
    }
  }

  switchTab(tabName) {
    const prevTab = this.currentTab;
    if (tabName === 'vault') {
      tabName = this.lastVaultSubtab || 'recorder';
    }
    if (tabName === 'bookmarks' && this.isMobileUIMode()) {
      this.homeBookmarkFilterActive = true;
      if (this.mobileHomeBookmarkFilterBtn) {
        this.mobileHomeBookmarkFilterBtn.classList.add('active');
      }
      tabName = 'explore';
    }
    if (tabName === 'recorder' || tabName === 'editor' || tabName === 'settings') {
      this.lastVaultSubtab = tabName;
    }

    const wasShortform = this.isShortformTabActive(prevTab);
    const willBeShortform = this.isShortformTabActive(tabName);

    if (prevTab === 'clips' && tabName !== 'clips' && window.clipsUI && typeof window.clipsUI.pauseMobileFeed === 'function') {
      window.clipsUI.pauseMobileFeed();
    }
    if (prevTab === 'youtube' && tabName !== 'youtube' && window.youtubeUI && typeof window.youtubeUI.pauseShortsFeed === 'function') {
      window.youtubeUI.pauseShortsFeed();
    }

    this.currentTab = tabName;
    const isMobileVaultActive = this.isMobileUIMode() && (tabName === 'recorder' || tabName === 'editor' || tabName === 'settings');
    this.navBtns.forEach(btn => {
      const btnTab = btn.dataset.tab;
      const isActive = (btnTab === tabName) || (isMobileVaultActive && btnTab === 'vault');
      btn.classList.toggle('active', isActive);
    });
    this.tabPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === `${tabName}-tab`);
    });
    this.updateMobileVaultHeaderState(tabName);

    if (tabName !== 'channel' && window.channelUI) {
      window.channelUI.destroyLivePlayer();
      if (typeof window.channelUI.clearTransientDom === 'function') {
        window.channelUI.clearTransientDom();
      }
    } else if (tabName === 'channel' && window.channelUI && typeof window.channelUI.restoreTransientDomIfNeeded === 'function') {
      window.channelUI.restoreTransientDomIfNeeded();
    }

    // Floating PiP Mini Player & Mobile Shortform Audio/Pause Isolation
    try {
      if (willBeShortform) {
        if (window.multiview && typeof window.multiview.enterShortformTab === 'function') {
          window.multiview.enterShortformTab();
        }
      } else if (wasShortform) {
        if (window.multiview && typeof window.multiview.leaveShortformTab === 'function') {
          window.multiview.leaveShortformTab(tabName);
        }
      } else if (tabName === 'multiview') {
        if (window.multiview && typeof window.multiview.onEnterMultiviewTab === 'function') {
          window.multiview.onEnterMultiviewTab();
        }
      } else {
        if (window.multiview && typeof window.multiview.onLeaveMultiviewTab === 'function') {
          window.multiview.onLeaveMultiviewTab();
        }
      }
    } catch (e) {
      console.warn('PiP transition error:', e);
    }

    if (tabName === 'explore') {
      const now = Date.now();
      if (!this._lastExploreSyncAt || (now - this._lastExploreSyncAt) > 20000) {
        this._lastExploreSyncAt = now;
        this.fetchFollowingLives();
        this.fetchBookmarks();
      }
      if (this.homeBookmarkFilterActive) {
        this.renderMobileHomeBookmarks();
      }
    } else if (tabName === 'youtube') {
      if (window.youtubeUI && typeof window.youtubeUI.onEnterTab === 'function') {
        window.youtubeUI.onEnterTab();
      }
    } else if (tabName === 'bookmarks') {
      this.fetchBookmarks();
    } else if (tabName === 'recorder') {
      if (window.recorderUI) window.recorderUI.loadData();
    } else if (tabName === 'editor') {
      if (window.editorUI) window.editorUI.loadSources();
    } else if (tabName === 'clips') {
      if (window.clipsUI) window.clipsUI.onTabActivated(this.lives, this.bookmarks);
    } else if (tabName === 'settings') {
      this.checkLoginStatus();
      this.loadNetworkSettings();
      this.loadDiagnosticsLog();
      this.loadVersionInfo();
    }
  }

  async loadInitialData() {
    this._lastExploreSyncAt = Date.now();
    await this.fetchFollowingIds();
    this.fetchLives();
    this.fetchBookmarks();
    this.fetchFollowingLives();
    this.checkLoginStatus();
    this.loadNetworkSettings();
    this.loadVersionInfo();
    // Silent background update check 3s after launch
    setTimeout(() => this.checkSystemUpdate(false), 3000);
  }

  // ================= Lives Management =================
  async fetchLives() {
    this.liveTotalCountDisplay.textContent = '방송 불러오는 중...';
    try {
      const res = await fetch(`/api/lives?size=50&fetch_pages=8&sortType=POPULAR`);
      const data = await res.json();
      if (data.success) {
        this.lives = data.lives || [];
        this.renderCategoryChips();
        this.filterAndRenderLives();
      } else {
        this.liveTotalCountDisplay.textContent = '방송 불러오기 실패';
        this.showToast(data.error || '방송 목록 불러오기 실패', 'error');
      }
    } catch (err) {
      console.error(err);
      this.liveTotalCountDisplay.textContent = '연결 오류';
      this.showToast('서버 연결 오류', 'error');
    }
  }

  renderCategoryChips() {
    if (!this.categoryChipsBar) return;

    // Count live broadcasts per category
    const categoryCounts = {};
    this.lives.forEach(l => {
      const cat = (l.categoryValue || '').trim();
      if (cat) {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      }
    });

    const filterKw = (this.categoryFilterInput ? this.categoryFilterInput.value.trim().toLowerCase() : '');

    // Top categories sorted by live broadcast count
    let sortedCats = Object.keys(categoryCounts).sort((a, b) => categoryCounts[b] - categoryCounts[a]);

    // Popular defaults for quick access
    const defaults = ['종합 게임', '리그 오브 레전드', '로스트아크', '발로란트', 'FC 온라인', '마인크래프트', '버추얼', '토크/캠방'];
    let merged = Array.from(new Set([...defaults, ...sortedCats])).filter(Boolean);

    if (filterKw) {
      merged = merged.filter(c => c.toLowerCase().includes(filterKw));
    } else {
      merged = merged.slice(0, 35);
    }

    const allChips = ['전체', ...merged];

    this.categoryChipsBar.innerHTML = allChips.map(cat => {
      const isAll = (cat === '전체');
      const isActive = isAll ? !this.selectedCategory : (this.selectedCategory.toLowerCase() === cat.toLowerCase());
      const catVal = isAll ? '' : cat;
      const count = isAll ? this.lives.length : (categoryCounts[cat] || 0);

      return `
        <button class="category-item ${isActive ? 'active' : ''}" 
                onclick="window.app.filterByCategory('${catVal.replace(/'/g, "\\'")}')">
          <span class="category-name">${escapeHtml(cat)}</span>
          <span class="category-count">${isAll ? 'ALL' : count}</span>
        </button>
      `;
    }).join('');
  }

  filterByCategory(category) {
    if (this.selectedCategory.toLowerCase() === (category || '').toLowerCase()) {
      this.selectedCategory = ''; // Toggle off
    } else {
      this.selectedCategory = category || '';
    }
    this.renderCategoryChips();
    this.filterAndRenderLives();
  }

  async fetchFollowingLives() {
    try {
      const res = await fetch('/api/user/following-lives');
      const data = await res.json();
      if (data.success && data.lives && data.lives.length > 0) {
        this.followingLives = data.lives;
        const hideDup = this.isMobileUIMode() && this.homeBookmarkFilterActive;
        this.followingLivesSection.style.display = hideDup ? 'none' : 'block';
        this.followingCountBadge.textContent = data.lives.length;
        this.renderCards(this.followingLives, this.followingLivesGrid);
      } else {
        this.followingLivesSection.style.display = 'none';
      }
    } catch (e) {
      this.followingLivesSection.style.display = 'none';
    }
  }

  filterAndRenderLives() {
    let filtered = [...this.lives];

    // 1. Filter by Category
    if (this.selectedCategory) {
      const targetCat = this.selectedCategory.toLowerCase();
      filtered = filtered.filter(l => l.categoryValue && l.categoryValue.toLowerCase().includes(targetCat));
    }

    // 2. Filter by Keyword
    if (this.searchKeyword) {
      const kw = this.searchKeyword.toLowerCase();
      filtered = filtered.filter(l =>
        (l.channelName && l.channelName.toLowerCase().includes(kw)) ||
        (l.liveTitle && l.liveTitle.toLowerCase().includes(kw)) ||
        (l.categoryValue && l.categoryValue.toLowerCase().includes(kw))
      );
    }

    const hideDupFollowing = this.isMobileUIMode() && this.homeBookmarkFilterActive;
    const isFiltered = Boolean(this.searchKeyword || this.selectedCategory);
    if (isFiltered) {
      this.popularLivesSection.style.display = 'none';
      if (this.followingLivesSection) this.followingLivesSection.style.display = 'none';
    } else {
      this.popularLivesSection.style.display = 'block';
      if (this.followingLivesSection) {
        this.followingLivesSection.style.display = (!hideDupFollowing && this.followingLives.length > 0) ? 'block' : 'none';
      }
    }

    const catBadge = this.selectedCategory ? ` [${this.selectedCategory}]` : '';
    this.liveTotalCountDisplay.textContent = `현재 방송 중${catBadge}: ${filtered.length}개`;

    // Popular top 8
    this.popularLives = filtered.slice(0, 8);
    this.renderCards(this.popularLives, this.popularLivesGrid);

    // Remaining or all
    const remaining = isFiltered ? filtered : filtered.slice(8);
    this.renderCards(remaining, this.livesGrid);

    if (this.isMobileUIMode() && this.homeBookmarkFilterActive) {
      this.renderMobileHomeBookmarks();
    }
  }

  renderCardThumbMedia(thumbUrl, avatarUrl, nameEsc, isOnline = true) {
    const safeAvatar = escapeHtml(avatarUrl || './static/img/favicon.png');
    if (isOnline) {
      const safeThumb = escapeHtml(thumbUrl || avatarUrl || './static/img/favicon.png');
      return `<img src="${safeThumb}" loading="lazy" decoding="async" alt="${nameEsc}" onerror="this.onerror=null; this.src='./static/img/favicon.png';">`;
    }
    return `
      <div class="card-offline-backdrop" style="background-image: url('${safeAvatar}');"></div>
      <img class="card-offline-center-avatar" src="${safeAvatar}" loading="lazy" decoding="async" alt="${nameEsc}" onerror="this.onerror=null; this.src='./static/img/favicon.png';">
    `;
  }

  renderCardInlineActionsHtml(channelId, channelName, channelImageUrl, opts = {}) {
    const isMobile = this.isMobileUIMode();
    const isBookmarked = Boolean(opts.isBookmarked);
    const notifyEnabled = Boolean(opts.notifyEnabled);
    const bookmarkTitle = opts.bookmarkTitle || (isBookmarked ? '즐겨찾기 해제' : '즐겨찾기 추가');
    const safeName = escapeHtml(channelName || '').replace(/'/g, "\\'");
    const safeImg = escapeHtml(channelImageUrl || '').replace(/'/g, "\\'");
    const bookmarkOnclick = opts.bookmarkOnclick || `window.app.toggleBookmark('${channelId}', '${safeName}', '${safeImg}')`;
    const clipsAndNotifyHtml = isMobile ? '' : `
      <button class="icon-btn-inline btn-clips" onclick="event.stopPropagation(); window.app.goToChannelClips('${channelId}')" title="클립 목록 보기">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
          <line x1="7" y1="2" x2="7" y2="22"/>
          <line x1="17" y1="2" x2="17" y2="22"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <line x1="2" y1="7" x2="7" y2="7"/>
          <line x1="2" y1="17" x2="7" y2="17"/>
          <line x1="17" y1="17" x2="22" y2="17"/>
          <line x1="17" y1="7" x2="22" y2="7"/>
        </svg>
      </button>
      <button class="icon-btn-inline btn-notify ${notifyEnabled ? 'notified' : ''}" data-channel-id="${channelId}" onclick="event.stopPropagation(); window.app.toggleChannelNotify('${channelId}')" title="${notifyEnabled ? '방송 시작 알림 켜짐 (클릭시 끄기)' : '방송 시작 알림 꺼짐 (클릭시 켜기)'}">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="${notifyEnabled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      </button>
    `;
    const extraHtml = (!isMobile && opts.extraBeforeBookmarkHtml) ? opts.extraBeforeBookmarkHtml : '';
    return `
      <div class="card-inline-actions">
        ${clipsAndNotifyHtml}
        ${extraHtml}
        <button class="icon-btn-inline btn-bookmark ${isBookmarked ? 'bookmarked' : ''}" data-channel-id="${channelId}" onclick="event.stopPropagation(); ${bookmarkOnclick}" title="${bookmarkTitle}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="${isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      </div>
    `;
  }

  renderCardHtml(item, bookmarkIds) {
    const viewers = Number(item.userCount || 0).toLocaleString();
    const thumb = escapeHtml(item.thumbUrl || item.channelImageUrl || './static/img/favicon.png');
    const avatar = escapeHtml(item.channelImageUrl || './static/img/favicon.png');
    const titleEsc = escapeHtml(item.liveTitle || item.title || '');
    const nameEsc = escapeHtml(item.channelName || '');
    const genre = escapeHtml(item.categoryValue || '종합 / 토크');
    const isBookmarked = bookmarkIds.has(item.channelId);
    const notifyEnabled = this.isChannelNotifyEnabled(item.channelId);

    return `
      <div class="live-card" data-channel-id="${item.channelId}">
        <div class="card-thumb-wrap" onclick="window.app.handleCardClick('${item.channelId}')" oncontextmenu="event.preventDefault(); window.app.openInMultiviewBackground('${item.channelId}')" title="클릭하여 멀티뷰 슬롯에서 시청 (우클릭: 현재 화면 유지하며 멀티뷰에 추가)">
          <img src="${thumb}" loading="lazy" decoding="async" alt="${nameEsc}" onerror="this.onerror=null; this.src='./static/img/favicon.png';">
          <div class="card-badge-live">LIVE</div>
          <div class="card-badge-category" title="클릭하여 '${genre}' 방송 모아보기" onclick="event.stopPropagation(); window.app.filterByCategory('${genre.replace(/'/g, "\\'")}')">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/></svg><span class="card-cat-text">${genre}</span>
          </div>
          <div class="card-badge-viewers">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg><span>${viewers}명</span>
          </div>
        </div>
        <div class="card-info">
          <img class="card-avatar" src="${avatar}" loading="lazy" decoding="async" alt="" onerror="this.onerror=null; this.src='./static/img/favicon.png';" onclick="event.stopPropagation(); window.app.openChannelPage('${item.channelId}')" title="스트리머 채널 방문" style="cursor: pointer;">
          <div class="card-details">
            <div class="card-title" onclick="window.app.handleCardClick('${item.channelId}')" oncontextmenu="event.preventDefault(); window.app.openInMultiviewBackground('${item.channelId}')" title="${titleEsc}" style="cursor: pointer;">${titleEsc}</div>
            <div class="card-channel-row">
              <div class="card-channel-name" onclick="event.stopPropagation(); window.app.openChannelPage('${item.channelId}')" title="스트리머 채널 방문" style="cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                <span style="font-weight:700; color:#fff;">${nameEsc}</span>
              </div>
              ${this.renderCardInlineActionsHtml(item.channelId, item.channelName, item.channelImageUrl, { isBookmarked, notifyEnabled })}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderCards(items, container) {
    if (!container) return;
    if (container._loadMoreObserver) {
      try { container._loadMoreObserver.disconnect(); } catch (_) {}
      container._loadMoreObserver = null;
    }

    if (items.length === 0) {
      const searchBtnHtml = this.searchKeyword 
        ? `<div style="margin-top: 14px;"><button class="btn btn-sm btn-outline" onclick="window.app.toggleOfflineChannelSearch(true)"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" stroke-width="2" style="margin-right:4px; vertical-align:-2px;"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>'${escapeHtml(this.searchKeyword)}' 오프라인 채널 검색하기</button></div>`
        : '';
      container.innerHTML = `<div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-muted);">조건에 맞는 실시간 방송이 없습니다.${searchBtnHtml}</div>`;
      return;
    }

    const bookmarkIds = new Set((this.bookmarks || []).map(b => b.channelId));
    const BATCH_SIZE = 48;
    const isIncremental = (container === this.livesGrid && items.length > BATCH_SIZE);

    if (!isIncremental) {
      container.innerHTML = items.map(item => this.renderCardHtml(item, bookmarkIds)).join('');
      return;
    }

    let renderedCount = Math.min(BATCH_SIZE, items.length);
    container.innerHTML = items.slice(0, renderedCount).map(item => this.renderCardHtml(item, bookmarkIds)).join('');

    const appendMoreRow = () => {
      const prevRow = container.querySelector('.live-load-more-row');
      if (prevRow) prevRow.remove();
      if (renderedCount >= items.length) {
        if (container._loadMoreObserver) {
          try { container._loadMoreObserver.disconnect(); } catch (_) {}
          container._loadMoreObserver = null;
        }
        return;
      }

      const row = document.createElement('div');
      row.className = 'live-load-more-row';
      row.style.cssText = 'grid-column: 1 / -1; display: flex; justify-content: center; padding: 14px 0 8px;';
      const remainingCount = items.length - renderedCount;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-outline';
      btn.style.cssText = 'display: inline-flex; align-items: center; gap: 6px; padding: 8px 18px; font-size: 13px;';
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg><span>더 많은 방송 보기 (${remainingCount}개 남음)</span>`;

      const loadNextBatch = () => {
        if (!document.body.contains(row)) return;
        const nextEnd = Math.min(renderedCount + BATCH_SIZE, items.length);
        const chunkHtml = items.slice(renderedCount, nextEnd).map(item => this.renderCardHtml(item, bookmarkIds)).join('');
        renderedCount = nextEnd;
        row.insertAdjacentHTML('beforebegin', chunkHtml);
        if (renderedCount >= items.length) {
          row.remove();
          if (container._loadMoreObserver) {
            try { container._loadMoreObserver.disconnect(); } catch (_) {}
            container._loadMoreObserver = null;
          }
        } else {
          const span = btn.querySelector('span');
          if (span) span.textContent = `더 많은 방송 보기 (${items.length - renderedCount}개 남음)`;
        }
      };

      btn.addEventListener('click', loadNextBatch);
      row.appendChild(btn);
      container.appendChild(row);

      if (typeof IntersectionObserver !== 'undefined') {
        const obs = new IntersectionObserver((entries) => {
          if (entries.some(e => e.isIntersecting)) {
            loadNextBatch();
          }
        }, { rootMargin: '320px 0px' });
        obs.observe(row);
        container._loadMoreObserver = obs;
      }
    };

    appendMoreRow();
  }

  openChannelPage(channelId) {
    if (window.channelUI) {
      window.channelUI.openChannel(channelId, this.currentTab);
    }
  }

  handleCardClick(channelId) {
    if (window.multiview && window.multiview.targetSlotIndex !== null) {
      window.multiview.loadStreamIntoTargetSlot(channelId);
      this.switchTab('multiview');
    } else {
      this.watchInMultiview(channelId);
    }
  }

  watchInMultiview(channelId) {
    if (window.multiview) {
      window.multiview.addStreamToFirstAvailableSlot(channelId);
      this.switchTab('multiview');
    }
  }

  openInMultiviewBackground(channelId) {
    if (window.multiview) {
      window.multiview.addStreamToFirstAvailableSlot(channelId);
      this.showToast('멀티뷰 슬롯에 방송을 추가했습니다. (현재 화면 유지)', 'info');
    }
  }

  goToChannelClips(channelId, channelName = '') {
    if (!channelId) return;
    if (window.clipsUI && typeof window.clipsUI.loadChannelShortformFeed === 'function') {
      const bm = (this.bookmarks || []).find(b => b.channelId === channelId);
      const resolvedName = channelName || (bm && bm.channelName) || '채널';
      window.clipsUI.feedMode = 'channel';
      window.clipsUI.feedChannelId = channelId;
      window.clipsUI.feedChannelName = resolvedName;
      window.clipsUI._pendingChannelFeedOpen = true;
      this.switchTab('clips');
      const player = window.clipsUI.ensureMobileShortformPlayer();
      if (player) {
        window.clipsUI.loadChannelShortformFeed(channelId, resolvedName, 0).finally(() => {
          window.clipsUI._pendingChannelFeedOpen = false;
        });
      }
      return;
    }
    this.switchTab('clips');
    if (window.clipsUI) {
      window.clipsUI.selectChannel(channelId);
    }
  }

  // ================= Offline Channel Search =================
  toggleOfflineChannelSearch(forceOpen = null) {
    if (forceOpen === true) {
      this.offlineSearchMode = true;
    } else if (forceOpen === false) {
      this.offlineSearchMode = false;
    } else {
      this.offlineSearchMode = !this.offlineSearchMode;
    }

    if (this.searchOfflineChannelToggleBtn) {
      if (this.offlineSearchMode) {
        this.searchOfflineChannelToggleBtn.classList.add('active');
        this.searchOfflineChannelToggleBtn.style.borderColor = 'var(--accent-color)';
        this.searchOfflineChannelToggleBtn.style.color = 'var(--accent-color)';
        this.searchOfflineChannelToggleBtn.style.background = 'rgba(0, 255, 163, 0.12)';
      } else {
        this.searchOfflineChannelToggleBtn.classList.remove('active');
        this.searchOfflineChannelToggleBtn.style.borderColor = '';
        this.searchOfflineChannelToggleBtn.style.color = '';
        this.searchOfflineChannelToggleBtn.style.background = '';
      }
    }

    if (this.offlineSearchMode) {
      const kw = this.searchKeyword || (this.liveSearchInput ? this.liveSearchInput.value.trim() : '');
      if (kw) {
        this.searchOfflineChannels(kw);
      } else {
        if (this.liveSearchInput) this.liveSearchInput.focus();
        this.showToast('검색창에 스트리머/채널명을 입력하세요.', 'info');
      }
    } else {
      this.closeOfflineChannelSearch();
    }
  }

  closeOfflineChannelSearch() {
    this.offlineSearchMode = false;
    if (this.searchOfflineChannelToggleBtn) {
      this.searchOfflineChannelToggleBtn.classList.remove('active');
      this.searchOfflineChannelToggleBtn.style.borderColor = '';
      this.searchOfflineChannelToggleBtn.style.color = '';
      this.searchOfflineChannelToggleBtn.style.background = '';
    }
    if (this.channelSearchResultsSection) {
      this.channelSearchResultsSection.style.display = 'none';
    }
  }

  async searchOfflineChannels(keyword) {
    if (!keyword) return;
    if (!this.channelSearchResultsSection || !this.channelSearchResultsGrid) return;

    this.channelSearchResultsSection.style.display = 'block';
    this.channelSearchResultsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: var(--text-muted);">
        '${escapeHtml(keyword)}' 채널(오프라인 포함) 검색 중...
      </div>
    `;

    try {
      const res = await fetch(`/api/channels/search?keyword=${encodeURIComponent(keyword)}&size=30`);
      const data = await res.json();

      if (data.success && data.channels) {
        const channels = data.channels;
        if (this.channelSearchCountBadge) {
          this.channelSearchCountBadge.textContent = channels.length;
        }

        if (channels.length === 0) {
          this.channelSearchResultsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: var(--text-muted);">
              '${escapeHtml(keyword)}' 채널 검색 결과가 없습니다.
            </div>
          `;
          return;
        }

        const bookmarkIds = new Set((this.bookmarks || []).map(b => b.channelId));
        const followingIds = this.followingChannelIds || new Set();

        this.channelSearchResultsGrid.innerHTML = channels.map(ch => {
          const avatar = escapeHtml(ch.channelImageUrl || './static/img/favicon.png');
          const nameEsc = escapeHtml(ch.channelName || ch.channelId);
          const followers = Number(ch.followerCount || 0).toLocaleString();
          const isLive = Boolean(ch.openLive);
          const isBookmarked = bookmarkIds.has(ch.channelId);

          return `
            <div class="channel-search-card" data-channel-id="${ch.channelId}">
              <img class="channel-search-avatar" src="${avatar}" loading="lazy" alt="${nameEsc}" onerror="this.onerror=null; this.src='./static/img/favicon.png';" onclick="window.app.openChannelPage('${ch.channelId}')" style="cursor: pointer;">
              <div class="channel-search-info">
                <div class="channel-search-name" onclick="window.app.openChannelPage('${ch.channelId}')" style="cursor: pointer;" title="${nameEsc}">
                  <span>${nameEsc}</span>
                </div>
                <div class="channel-search-meta">
                  ${isLive 
                    ? `<span style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.5); color: #fca5a5; padding: 1px 6px; border-radius: 4px; font-weight: 700; font-size: 10px;">LIVE 방송중</span>` 
                    : `<span style="background: rgba(255, 255, 255, 0.08); color: var(--text-muted); padding: 1px 6px; border-radius: 4px; font-size: 10px;">오프라인</span>`}
                  <span>팔로워 ${followers}명</span>
                </div>
                <div class="channel-search-actions">
                  <button class="btn btn-sm btn-primary" onclick="window.app.openChannelPage('${ch.channelId}')" title="채널 홈 (다시보기/클립)">
                    채널 홈
                  </button>
                  <button class="btn btn-sm" onclick="window.app.goToChannelClips('${ch.channelId}')" title="클립 모아보기">
                    클립
                  </button>
                  ${isLive ? `
                    <button class="btn btn-sm btn-outline" onclick="window.app.watchInMultiview('${ch.channelId}')" oncontextmenu="event.preventDefault(); window.app.openInMultiviewBackground('${ch.channelId}')" title="클릭: 시청 / 우클릭: 현재 화면 유지하며 멀티뷰에 추가">
                      시청
                    </button>
                  ` : ''}
                  ${this.isMobileUIMode() ? '' : `
                    <button class="icon-btn-inline btn-notify ${this.isChannelNotifyEnabled(ch.channelId) ? 'notified' : ''}" data-channel-id="${ch.channelId}" onclick="event.stopPropagation(); window.app.toggleChannelNotify('${ch.channelId}')" title="${this.isChannelNotifyEnabled(ch.channelId) ? '방송 시작 알림 켜짐' : '방송 시작 알림 꺼짐'}">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="${this.isChannelNotifyEnabled(ch.channelId) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                      </svg>
                    </button>
                  `}
                  <button class="icon-btn-inline btn-bookmark ${isBookmarked ? 'bookmarked' : ''}" data-channel-id="${ch.channelId}" onclick="window.app.toggleBookmark('${ch.channelId}', '${escapeHtml(ch.channelName || '').replace(/'/g, "\\'")}', '${escapeHtml(ch.channelImageUrl || '').replace(/'/g, "\\'")}')" title="${isBookmarked ? '즐겨찾기 해제' : '즐겨찾기 추가'}">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="${isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('');
      } else {
        this.channelSearchResultsGrid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: var(--danger-color);">
            ${data.error || '채널 검색에 실패했습니다.'}
          </div>
        `;
      }
    } catch (e) {
      console.error(e);
      this.channelSearchResultsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: var(--danger-color);">
          검색 네트워크 오류가 발생했습니다.
        </div>
      `;
    }
  }

  // ================= Bookmarks & Following Sync =================
  async fetchBookmarks() {
    try {
      const res = await fetch('/api/bookmarks');
      const data = await res.json();
      if (data.bookmarks) {
        this.bookmarks = data.bookmarks;
        this.bookmarks.forEach(b => {
          this.channelNotifications.set(b.channelId, b.notify !== false);
        });
        this.renderBookmarks();
      }
    } catch (err) {
      console.error(err);
    }
  }

  renderBookmarks() {
    const total = this.bookmarks.length;
    const onlineBookmarks = this.bookmarks.filter(b => b.isOnline);
    const offlineBookmarks = this.bookmarks.filter(b => !b.isOnline);
    const onlineCount = onlineBookmarks.length;
    const offlineCount = offlineBookmarks.length;

    if (this.bookmarksBadge) this.bookmarksBadge.textContent = onlineCount;
    if (this.mobileHomeBookmarksCount) this.mobileHomeBookmarksCount.textContent = onlineCount;
    if (this.bookmarksSummaryDisplay) {
      this.bookmarksSummaryDisplay.textContent = `등록: ${total}명 (방송 중: ${onlineCount}명 / 오프라인: ${offlineCount}명)`;
    }

    if (this.bookmarksOnlineCountBadge) this.bookmarksOnlineCountBadge.textContent = onlineCount;
    if (this.bookmarksOfflineCountBadge) this.bookmarksOfflineCountBadge.textContent = offlineCount;

    if (this.isMobileUIMode() && this.homeBookmarkFilterActive) {
      this.renderMobileHomeBookmarks();
    }

    if (total === 0) {
      if (this.bookmarksOnlineSection) this.bookmarksOnlineSection.style.display = 'none';
      if (this.bookmarksOfflineSection) this.bookmarksOfflineSection.style.display = 'none';
      if (this.bookmarksEmptyState) {
        this.bookmarksEmptyState.style.display = 'block';
        this.bookmarksEmptyState.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
            <div style="margin-bottom: 12px; color: #f59e0b;">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <div style="font-size: 15px; font-weight: 700;">등록된 즐겨찾기 채널이 없습니다.</div>
            <div style="font-size: 13px; margin-top: 6px; color: var(--text-dim); line-height: 1.6;">
              로그인 없이도 위 입력창에 스트리머명 또는 치지직 링크를 입력하여 바로 즐겨찾기에 등록할 수 있습니다.<br>
              (홈 화면 카드의 [즐겨찾기] 버튼을 누르거나, 필요 시 [치지직 팔로우 불러오기]로 기존 팔로우 목록을 한 번에 가져올 수도 있습니다)
            </div>
          </div>
        `;
      }
      return;
    }

    if (this.bookmarksEmptyState) this.bookmarksEmptyState.style.display = 'none';
    if (this.bookmarksOnlineSection) this.bookmarksOnlineSection.style.display = 'block';
    if (this.bookmarksOfflineSection) this.bookmarksOfflineSection.style.display = 'block';

    const followingIds = this.followingChannelIds || new Set();

    // 1. Render Online Bookmarks
    if (this.bookmarksOnlineGrid) {
      if (onlineBookmarks.length === 0) {
        this.bookmarksOnlineGrid.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 26px; text-align: center; color: var(--text-muted); font-size: 13px; background: rgba(0,0,0,0.25); border-radius: var(--radius-sm); border: 1px dashed rgba(255,255,255,0.08);">
            현재 방송 중인 즐겨찾기 채널이 없습니다.
          </div>
        `;
      } else {
        this.bookmarksOnlineGrid.innerHTML = onlineBookmarks.map(b => this.renderBookmarkCardHtml(b, true, followingIds)).join('');
      }
    }

    // 2. Render Offline Bookmarks
    if (this.bookmarksOfflineGrid) {
      if (offlineBookmarks.length === 0) {
        this.bookmarksOfflineSection.style.display = 'none';
      } else {
        this.bookmarksOfflineGrid.innerHTML = offlineBookmarks.map(b => this.renderBookmarkCardHtml(b, false, followingIds)).join('');
      }
    }
  }

  renderBookmarkCardHtml(b, isOnline, followingIds) {
    const notifyEnabled = this.isChannelNotifyEnabled(b.channelId);
    const statusBadge = isOnline 
      ? `<div class="card-badge-live">LIVE</div><div class="card-badge-category"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/></svg><span class="card-cat-text">${escapeHtml(b.categoryValue || '방송')}</span></div><div class="card-badge-viewers"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg><span>${Number(b.userCount || 0).toLocaleString()}명</span></div>`
      : `<div class="card-badge-offline">오프라인</div>`;

    const avatar = escapeHtml(b.channelImageUrl || './static/img/favicon.png');
    const titleEsc = escapeHtml(b.liveTitle || b.title || '');
    const nameEsc = escapeHtml(b.channelName || '');

    return `
      <div class="live-card ${isOnline ? 'card-online' : 'card-offline'}">
        <div class="card-thumb-wrap ${isOnline ? '' : 'card-thumb-offline'}" style="cursor: pointer;" onclick="${isOnline ? `window.app.watchInMultiview('${b.channelId}')` : `window.app.openChannelPage('${b.channelId}')`}" oncontextmenu="event.preventDefault(); ${isOnline ? `window.app.openInMultiviewBackground('${b.channelId}')` : `window.app.openChannelPage('${b.channelId}')`}" title="${isOnline ? '클릭: 멀티뷰 이동 / 우클릭: 현재 화면 유지하며 멀티뷰에 추가' : '클릭: 채널 방문'}">
          ${this.renderCardThumbMedia(b.thumbUrl, b.channelImageUrl, nameEsc, isOnline)}
          ${statusBadge}
        </div>
        <div class="card-info">
          <img class="card-avatar" src="${avatar}" loading="lazy" decoding="async" onerror="this.onerror=null; this.src='./static/img/favicon.png';" onclick="event.stopPropagation(); window.app.openChannelPage('${b.channelId}')" title="채널 방문" style="cursor: pointer;">
          <div class="card-details">
            <div class="card-title" onclick="${isOnline ? `window.app.watchInMultiview('${b.channelId}')` : `window.app.openChannelPage('${b.channelId}')`}" oncontextmenu="event.preventDefault(); ${isOnline ? `window.app.openInMultiviewBackground('${b.channelId}')` : `window.app.openChannelPage('${b.channelId}')`}" style="cursor: pointer;">${isOnline ? titleEsc : '<span style="color:var(--text-muted);">현재 오프라인 (클릭하여 채널 방문)</span>'}</div>
            <div class="card-channel-row">
              <div class="card-channel-name" onclick="event.stopPropagation(); window.app.openChannelPage('${b.channelId}')" title="채널 방문" style="cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                <span style="font-weight:700; color:#fff;">${nameEsc}</span>
                ${(isOnline && b.categoryValue) ? `<span style="font-size:11px; color:var(--accent-color); margin-left:4px;">${escapeHtml(b.categoryValue)}</span>` : ''}
              </div>
              ${this.renderCardInlineActionsHtml(b.channelId, b.channelName, b.channelImageUrl, {
                isBookmarked: true,
                notifyEnabled,
                bookmarkOnclick: `window.app.removeBookmark('${b.channelId}')`,
                bookmarkTitle: '즐겨찾기 삭제'
              })}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  toggleHomeBookmarkFilter() {
    this.homeBookmarkFilterActive = !this.homeBookmarkFilterActive;
    if (this.mobileHomeBookmarkFilterBtn) {
      this.mobileHomeBookmarkFilterBtn.classList.toggle('active', this.homeBookmarkFilterActive);
    }
    if (this.homeBookmarkFilterActive) {
      this.fetchBookmarks();
    }
    this.renderMobileHomeBookmarks();
    this.filterAndRenderLives();
  }

  renderMobileHomeBookmarks() {
    if (!this.mobileHomeBookmarksSection) return;
    if (!this.isMobileUIMode() || !this.homeBookmarkFilterActive) {
      this.mobileHomeBookmarksSection.style.display = 'none';
      return;
    }
    this.mobileHomeBookmarksSection.style.display = 'block';

    const online = (this.bookmarks || []).filter(b => b.isOnline);
    const offline = (this.bookmarks || []).filter(b => !b.isOnline);
    const followingIds = this.followingChannelIds || new Set();

    if (this.mobileHomeBmOnlineBadge) this.mobileHomeBmOnlineBadge.textContent = online.length;
    if (this.mobileHomeBmOfflineBadge) this.mobileHomeBmOfflineBadge.textContent = offline.length;

    if (this.mobileHomeBookmarksOnlineSection && this.mobileHomeBookmarksOnlineGrid) {
      this.mobileHomeBookmarksOnlineSection.style.display = 'block';
      if (online.length === 0) {
        this.mobileHomeBookmarksOnlineGrid.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 18px; text-align: center; color: var(--text-muted); font-size: 12.5px; background: rgba(0,0,0,0.22); border-radius: 8px; border: 1px dashed rgba(255,255,255,0.08);">
            ${(this.bookmarks || []).length === 0 ? '등록된 즐겨찾기가 없습니다. 카드의 별표를 눌러 추가하세요.' : '현재 방송 중인 즐겨찾기 채널이 없습니다.'}
          </div>
        `;
      } else {
        this.mobileHomeBookmarksOnlineGrid.innerHTML = online.map(b => this.renderBookmarkCardHtml(b, true, followingIds)).join('');
      }
    }

    if (this.mobileHomeBookmarksOfflineSection && this.mobileHomeBookmarksOfflineGrid) {
      if (offline.length === 0) {
        this.mobileHomeBookmarksOfflineSection.style.display = 'none';
      } else {
        this.mobileHomeBookmarksOfflineSection.style.display = 'block';
        this.mobileHomeBookmarksOfflineGrid.innerHTML = offline.map(b => this.renderBookmarkCardHtml(b, false, followingIds)).join('');
      }
    }
  }

  async addBookmark() {
    const val = this.addBookmarkInput ? this.addBookmarkInput.value.trim() : '';
    if (!val) {
      this.showToast('스트리머명, 채널 ID 또는 치지직 링크를 입력하세요.', 'error');
      return;
    }

    try {
      this.showToast('채널 정보를 확인하여 즐겨찾기에 등록하는 중...', 'info');
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_id: val })
      });
      const data = await res.json();
      if (data.success && data.bookmark) {
        const name = data.bookmark.channelName || '스트리머';
        this.showToast(`'${name}' 즐겨찾기에 등록되었습니다!`, 'success');
        if (this.addBookmarkInput) this.addBookmarkInput.value = '';
        await this.fetchBookmarks();
        await this.fetchFollowingLives();
        await this.fetchFollowingIds();
      } else {
        this.showToast(data.error || '해당 채널 또는 스트리머를 찾을 수 없습니다.', 'error');
      }
    } catch (err) {
      console.error(err);
      this.showToast('즐겨찾기 추가 중 네트워크 오류가 발생했습니다.', 'error');
    }
  }

  async fetchFollowingChannels() {
    try {
      const res = await fetch('/api/user/following-channels');
      const data = await res.json();
      if (data.success && data.channels) {
        this.followingChannels = data.channels;
        if (window.clipsUI && typeof window.clipsUI.renderFollowingChips === 'function') {
          window.clipsUI.renderFollowingChips(this.followingChannels);
        }
      }
    } catch (e) {
      console.error('Failed to fetch following channels:', e);
    }
  }

  async syncFollowingChannels() {
    this.showToast('네이버 계정의 팔로우 채널을 동기화하는 중...', 'info');
    try {
      const res = await fetch('/api/user/sync-following', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const total = data.total_followings || data.count || 0;
        const added = data.added || 0;
        this.showToast(`팔로우 채널 ${total}개가 즐겨찾기에 완벽 동기화되었습니다! (신규 등록: ${added}개)`, 'success');
        this.fetchBookmarks();
        this.fetchFollowingLives();
        await this.fetchFollowingChannels();
      } else {
        this.showToast(data.error || '먼저 [네이버 로그인 & 설정] 탭에서 로그인을 완료해주세요.', 'error');
      }
    } catch (e) {
      this.showToast('팔로우 동기화 실패', 'error');
    }
  }

  async toggleBookmark(channelId, channelName = null, channelImageUrl = null) {
    if (!channelId) return;
    const exists = this.bookmarks.some(b => b.channelId === channelId);
    if (exists) {
      await this.removeBookmark(channelId);
    } else {
      const live = this.lives.find(l => l.channelId === channelId) || 
                   this.followingLives.find(l => l.channelId === channelId) ||
                   (this.followingTabChannels && this.followingTabChannels.find(c => c.channelId === channelId));
      const targetName = channelName || (live ? (live.channelName || live.channel_name) : null);
      const targetImg = channelImageUrl || (live ? (live.channelImageUrl || live.channel_image_url) : null);
      try {
        const res = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel_id: channelId,
            channel_name: targetName,
            channel_image_url: targetImg
          })
        });
        const data = await res.json();
        if (data.success) {
          const finalName = (data.bookmark && data.bookmark.channelName) || targetName || '스트리머';
          this.showToast(`'${finalName}' 즐겨찾기에 등록되었습니다.`, 'success');
        } else {
          this.showToast(data.error || '즐겨찾기 등록 실패', 'error');
        }
        this.syncBookmarkButtonDOM(channelId, true);
        await this.fetchBookmarks();
        await this.fetchFollowingLives();
        await this.fetchFollowingIds();
        this.syncNotifyButtonDOM(channelId, this.isChannelNotifyEnabled(channelId));
        if (window.channelUI && window.channelUI.currentChannelId === channelId) {
          window.channelUI.updateNotifyButtonState();
        }
      } catch (err) {
        console.error(err);
      }
    }
  }

  async removeBookmark(channelId) {
    try {
      await fetch(`/api/bookmarks/${channelId}`, { method: 'DELETE' });
      this.showToast('즐겨찾기에서 삭제되었습니다.', 'success');
      this.syncBookmarkButtonDOM(channelId, false);
      await this.fetchBookmarks();
      this.syncNotifyButtonDOM(channelId, this.isChannelNotifyEnabled(channelId));
      if (window.channelUI && window.channelUI.currentChannelId === channelId) {
        window.channelUI.updateNotifyButtonState();
      }
    } catch (err) {
      console.error(err);
    }
  }

  // ================= Official Chzzk Follow Management =================
  async fetchFollowingIds() {
    try {
      const res = await fetch('/api/user/following-ids');
      const data = await res.json();
      if (data && data.success && Array.isArray(data.followingIds)) {
        this.followingChannelIds = new Set(data.followingIds);
        this.updateFollowingBadge();
      }
    } catch (err) {
      console.warn('Failed to fetch following IDs:', err);
    }
  }

  updateFollowingBadge() {
    if (this.followingBadge) {
      this.followingBadge.textContent = this.followingChannelIds.size || 0;
    }
  }

  async toggleFollow(channelId) {
    if (!channelId) return;
    const isFollowing = this.followingChannelIds.has(channelId);

    try {
      const url = `/api/user/follow/${channelId}`;
      const method = isFollowing ? 'DELETE' : 'POST';
      const res = await fetch(url, { method });
      const data = await res.json();

      if (data.success) {
        if (isFollowing) {
          this.followingChannelIds.delete(channelId);
          this.showToast('치지직 팔로우를 취소했습니다.', 'info');
        } else {
          this.followingChannelIds.add(channelId);
          this.showToast('치지직 팔로우에 등록되었습니다!', 'success');
        }
        this.updateFollowingBadge();
        this.syncFollowButtonDOM(channelId, !isFollowing);
        this.syncNotifyButtonDOM(channelId, this.isChannelNotifyEnabled(channelId));
        if (window.channelUI && window.channelUI.currentChannelId === channelId) {
          window.channelUI.updateNotifyButtonState();
        }

        if (this.currentTab === 'following') {
          this.fetchFollowingTabContent();
        }
      } else {
        this.showToast(data.error || '팔로우 요청 실패 (로그인을 확인하세요)', 'error');
      }
    } catch (err) {
      console.error('toggleFollow error:', err);
      this.showToast('팔로우 처리 중 네트워크 오류가 발생했습니다.', 'error');
    }
  }

  syncFollowButtonDOM(channelId, isFollowing) {
    const btns = document.querySelectorAll(`.btn-follow[data-channel-id="${channelId}"]`);
    btns.forEach(btn => {
      btn.classList.toggle('followed', isFollowing);
      btn.title = isFollowing ? '치지직 팔로우 취소' : '치지직 공식 팔로우';
      const svg = btn.querySelector('svg');
      if (svg) {
        svg.setAttribute('fill', isFollowing ? 'currentColor' : 'none');
      }
    });
  }

  syncBookmarkButtonDOM(channelId, isBookmarked) {
    const btns = document.querySelectorAll(`.btn-bookmark[data-channel-id="${channelId}"]`);
    btns.forEach(btn => {
      btn.classList.toggle('bookmarked', isBookmarked);
      btn.title = isBookmarked ? '즐겨찾기 해제' : '즐겨찾기 추가';
      const svg = btn.querySelector('svg');
      if (svg) {
        svg.setAttribute('fill', isBookmarked ? 'currentColor' : 'none');
      }
    });
  }

  // ================= Live Broadcast Notifications (Request 1) =================
  syncNotifyButtonDOM(channelId, isNotify) {
    if (this.isMobileUIMode()) return;
    const btns = document.querySelectorAll(`.btn-notify[data-channel-id="${channelId}"]`);
    btns.forEach(btn => {
      btn.classList.toggle('notified', isNotify);
      btn.title = isNotify ? '방송 시작 알림 켜짐 (클릭시 끄기)' : '방송 시작 알림 꺼짐 (클릭시 켜기)';
      const svg = btn.querySelector('svg');
      if (svg) {
        svg.setAttribute('fill', isNotify ? 'currentColor' : 'none');
      }
    });
  }

  isChannelNotifyEnabled(channelId) {
    if (this.isMobileUIMode()) return false;
    if (!channelId) return false;

    // Check if channel is bookmarked or followed
    const isBookmarked = (this.bookmarks || []).some(b => b.channelId === channelId);
    const isFollowed = (this.followingChannelIds && this.followingChannelIds.has(channelId)) ||
                       (this.followingChannels && this.followingChannels.some(f => f.channelId === channelId));

    // Requirement: Broadcast start notifications are ONLY active for bookmarked & followed channels.
    // All other channels are disabled by default.
    if (!isBookmarked && !isFollowed) {
      if (this.channelNotifications && this.channelNotifications.has(channelId)) {
        return this.channelNotifications.get(channelId);
      }
      return false;
    }

    // Channel is bookmarked or followed:
    if (this.channelNotifications && this.channelNotifications.has(channelId)) {
      return this.channelNotifications.get(channelId);
    }
    const bm = (this.bookmarks || []).find(b => b.channelId === channelId);
    if (bm && typeof bm.notify === 'boolean') {
      return bm.notify;
    }
    return true; // Default to enabled for bookmarked and followed channels
  }

  async toggleChannelNotify(channelId) {
    if (this.isMobileUIMode()) return;
    try {
      const res = await fetch(`/api/bookmarks/${channelId}/notify`, { method: 'POST' }).then(r => r.json());
      if (res && res.success) {
        const newState = res.notify;
        this.channelNotifications.set(channelId, newState);
        this.syncNotifyButtonDOM(channelId, newState);

        const bm = (this.bookmarks || []).find(b => b.channelId === channelId);
        if (bm) bm.notify = newState;

        const chName = (bm && bm.channelName) || 
          (this.followingTabChannels || []).find(c => c.channelId === channelId)?.channelName || 
          (this.lives || []).find(l => l.channelId === channelId)?.channelName || 
          '채널';

        this.showToast(`'${chName}' 방송 시작 알림이 ${newState ? '켜졌습니다' : '꺼졌습니다'}.`, 'info');

        if (window.channelUI && window.channelUI.currentChannelId === channelId) {
          window.channelUI.updateNotifyButtonState();
        }
      }
    } catch (err) {
      console.error(err);
      this.showToast('알림 설정 변경 실패', 'error');
    }
  }

  initLiveNotificationWatcher() {
    if (this.isMobileUIMode() || this._liveNotifyTimer) return;
    // Request browser notification permission if available
    try {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    } catch (_) {}

    // Check every 30 seconds for new live broadcasts
    this._liveNotifyTimer = setInterval(() => {
      this.checkLiveNotifications();
    }, 30000);
  }

  async checkLiveNotifications() {
    if (this.isMobileUIMode() || this._checkingNotifications) return;
    this._checkingNotifications = true;
    try {
      const bookmarksRes = await fetch('/api/bookmarks').then(r => r.json()).catch(() => ({}));
      const activeLivesMap = new Map();

      if (bookmarksRes && Array.isArray(bookmarksRes.bookmarks)) {
        bookmarksRes.bookmarks.forEach(b => {
          if (b && b.channelId) {
            this.channelNotifications.set(b.channelId, b.notify !== false);
            if (b.isOnline) {
              activeLivesMap.set(b.channelId, {
                channelId: b.channelId,
                channelName: b.channelName,
                channelImageUrl: b.channelImageUrl,
                liveTitle: b.liveTitle || b.title || '',
                categoryValue: b.categoryValue || ''
              });
            }
          }
        });
      }

      const currentLiveIds = new Set(activeLivesMap.keys());

      // If initial check, record currently online channels without spamming notifications
      if (this.isFirstLiveCheck) {
        this.knownOnlineChannels = currentLiveIds;
        this.isFirstLiveCheck = false;
        return;
      }

      // Detect channels that transitioned to online
      for (const [chId, liveInfo] of activeLivesMap.entries()) {
        if (!this.knownOnlineChannels.has(chId)) {
          this.knownOnlineChannels.add(chId);

          // Check per-channel notification setting
          const notifyEnabled = this.isChannelNotifyEnabled(chId);
          if (notifyEnabled) {
            this.triggerLiveNotification(liveInfo);
          }
        }
      }

      // Remove channels that have ended
      for (const knownId of Array.from(this.knownOnlineChannels)) {
        if (!currentLiveIds.has(knownId)) {
          this.knownOnlineChannels.delete(knownId);
        }
      }
    } catch (e) {
      console.warn('Live notification check error:', e);
    } finally {
      this._checkingNotifications = false;
    }
  }

  triggerLiveNotification(live) {
    if (this.isMobileUIMode()) return;
    const chId = live.channelId;
    const name = live.channelName || '스트리머';
    const title = live.liveTitle || live.title || '새 방송을 시작했습니다.';
    const avatar = live.channelImageUrl || './static/img/favicon.png';

    // 1. Play soft chime
    this.playNotificationSound();

    // 2. Desktop OS Web Notification
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        const notif = new Notification(`[치지직] ${name} 방송 시작!`, {
          body: title,
          icon: avatar,
          tag: `live-${chId}`
        });
        notif.onclick = () => {
          window.focus();
          this.watchInMultiview(chId);
          notif.close();
        };
      }
    } catch (_) {}

    // 3. Rich In-App Floating Toast Banner
    this.showInAppLiveBanner(live);
  }

  showInAppLiveBanner(live) {
    if (this.isMobileUIMode()) return;
    const container = document.getElementById('liveNotificationContainer') || this.liveNotificationContainer;
    if (!container) return;

    const chId = live.channelId;
    const name = escapeHtml(live.channelName || '스트리머');
    const title = escapeHtml(live.liveTitle || live.title || '새 방송을 시작했습니다.');
    const avatar = escapeHtml(live.channelImageUrl || './static/img/favicon.png');

    const item = document.createElement('div');
    item.className = 'live-notify-toast';
    item.innerHTML = `
      <img src="${avatar}" class="live-notify-avatar" alt="${name}">
      <div class="live-notify-body">
        <div class="live-notify-header">
          <span class="live-notify-badge">LIVE START</span>
          <span class="live-notify-name">${name}</span>
        </div>
        <div class="live-notify-title" title="${title}">${title}</div>
      </div>
      <div class="live-notify-actions">
        <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); window.app.watchInMultiview('${chId}'); this.closest('.live-notify-toast').remove();">시청</button>
        <button class="live-notify-close" onclick="event.stopPropagation(); this.closest('.live-notify-toast').remove();">&times;</button>
      </div>
    `;

    item.addEventListener('click', () => {
      this.watchInMultiview(chId);
      item.remove();
    });

    container.appendChild(item);

    // Auto remove after 12 seconds
    setTimeout(() => {
      if (item.parentElement) item.remove();
    }, 12000);
  }

  playNotificationSound() {
    if (this.isMobileUIMode()) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) this.audioCtx = new AudioCtx();
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(698.46, now); // F5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(349.23, now); // F4
      osc2.frequency.exponentialRampToValueAtTime(440, now + 0.12); // A4

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.55);
      osc2.stop(now + 0.55);
    } catch (_) {}
  }

  // ================= Official Following Tab =================
  async fetchFollowingTabContent() {
    if (this.followingSummaryDisplay) {
      this.followingSummaryDisplay.textContent = '팔로우 목록 불러오는 중...';
    }
    try {
      const [livesRes, channelsRes, idsRes] = await Promise.all([
        fetch('/api/user/following-lives').then(r => r.json()),
        fetch('/api/user/following-channels?size=50').then(r => r.json()),
        fetch('/api/user/following-ids').then(r => r.json())
      ]);

      if (idsRes && idsRes.success && Array.isArray(idsRes.followingIds)) {
        this.followingChannelIds = new Set(idsRes.followingIds);
        this.updateFollowingBadge();
      }

      this.followingTabLives = (livesRes && livesRes.success) ? (livesRes.lives || []) : [];
      this.followingTabChannels = (channelsRes && channelsRes.success) ? (channelsRes.channels || []) : [];

      if (this.followingLiveCountBadge) {
        this.followingLiveCountBadge.textContent = this.followingTabLives.length;
      }
      if (this.followingAllCountBadge) {
        this.followingAllCountBadge.textContent = this.followingTabChannels.length;
      }
      if (this.followingSummaryDisplay) {
        this.followingSummaryDisplay.textContent = `총 ${this.followingTabChannels.length}개 채널 (방송 중: ${this.followingTabLives.length}개)`;
      }

      this.renderFollowingTabLives(this.followingTabLives);
      this.renderFollowingTabChannels(this.followingTabChannels);
    } catch (err) {
      console.error('Error fetching following tab content:', err);
      if (this.followingSummaryDisplay) {
        this.followingSummaryDisplay.textContent = '팔로우 목록 불러오기 실패 (네이버 로그인을 확인하세요)';
      }
    }
  }

  renderFollowingTabLives(items) {
    if (!this.followingTabLivesGrid) return;
    if (!items || items.length === 0) {
      this.followingTabLivesGrid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 30px; text-align: center; color: var(--text-muted); font-size: 13px;">
          현재 방송 중인 팔로잉 채널이 없습니다.
        </div>
      `;
      return;
    }
    this.renderCards(items, this.followingTabLivesGrid);
  }

  renderFollowingTabChannels(channels) {
    if (!this.followingTabAllGrid) return;
    if (!channels || channels.length === 0) {
      this.followingTabAllGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 50px 20px; color: var(--text-muted);">
          <div style="margin-bottom: 10px; color: var(--danger-color);">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          </div>
          <div style="font-size: 15px; font-weight: 700;">치지직 팔로우 채널이 없습니다.</div>
          <div style="font-size: 13px; margin-top: 6px; color: var(--text-dim);">
            [설정] 탭에서 네이버 로그인을 완료하거나, 방송 카드의 하트 버튼을 눌러 치지직 스트리머를 팔로우하세요.
          </div>
        </div>
      `;
      return;
    }

    const bookmarkIds = new Set((this.bookmarks || []).map(b => b.channelId));
    const liveChannelMap = new Map();
    (this.followingTabLives || []).forEach(l => liveChannelMap.set(l.channelId, l));

    // Sort: live broadcast channels first, then offline channels
    const sortedChannels = [...channels].sort((a, b) => {
      const aLive = Boolean(a.openLive || liveChannelMap.has(a.channelId));
      const bLive = Boolean(b.openLive || liveChannelMap.has(b.channelId));
      if (aLive && !bLive) return -1;
      if (!aLive && bLive) return 1;
      return 0;
    });

    this.followingTabAllGrid.innerHTML = sortedChannels.map(ch => {
      const chId = ch.channelId;
      const isLive = Boolean(ch.openLive || liveChannelMap.has(chId));
      const liveInfo = liveChannelMap.get(chId);
      const thumb = escapeHtml(liveInfo ? liveInfo.thumbUrl : (ch.channelImageUrl || ''));
      const avatar = escapeHtml(ch.channelImageUrl || '');
      const nameEsc = escapeHtml(ch.channelName || '');
      const followers = Number(ch.followerCount || 0).toLocaleString();
      const isBookmarked = bookmarkIds.has(chId);
      const notifyEnabled = this.isChannelNotifyEnabled(chId);

      const statusBadge = isLive
        ? `<div class="card-badge-live">LIVE</div><div class="card-badge-viewers"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg><span>${Number((liveInfo && liveInfo.userCount) || 0).toLocaleString()}명</span></div>`
        : `<div class="card-badge-offline">오프라인</div>`;

      return `
        <div class="live-card ${isLive ? 'card-online' : 'card-offline'}">
          <div class="card-thumb-wrap ${isLive ? '' : 'card-thumb-offline'}" style="cursor: pointer;" onclick="${isLive ? `window.app.watchInMultiview('${chId}')` : `window.app.openChannelPage('${chId}')`}" oncontextmenu="event.preventDefault(); ${isLive ? `window.app.openInMultiviewBackground('${chId}')` : `window.app.openChannelPage('${chId}')`}" title="${isLive ? '클릭: 멀티뷰 이동 / 우클릭: 현재 화면 유지하며 멀티뷰에 추가' : '클릭하여 채널 방문'}">
            ${this.renderCardThumbMedia(liveInfo ? liveInfo.thumbUrl : '', ch.channelImageUrl, nameEsc, isLive)}
            ${statusBadge}
          </div>
          <div class="card-info">
            <img class="card-avatar" src="${avatar || './static/img/favicon.png'}" loading="lazy" decoding="async" onerror="this.onerror=null; this.src='./static/img/favicon.png';" onclick="event.stopPropagation(); window.app.openChannelPage('${chId}')" title="채널 방문" style="cursor: pointer;">
            <div class="card-details">
              <div class="card-title" onclick="${isLive ? `window.app.watchInMultiview('${chId}')` : `window.app.openChannelPage('${chId}')`}" oncontextmenu="event.preventDefault(); ${isLive ? `window.app.openInMultiviewBackground('${chId}')` : `window.app.openChannelPage('${chId}')`}" style="cursor: pointer;">
                ${isLive ? escapeHtml((liveInfo && liveInfo.liveTitle) || '생방송 중') : '<span style="color:var(--text-muted);">현재 오프라인 (클릭하여 채널 방문)</span>'}
              </div>
              <div class="card-channel-row">
                <div class="card-channel-name" onclick="event.stopPropagation(); window.app.openChannelPage('${chId}')" title="채널 방문" style="cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  <span style="font-weight:700; color:#fff;">${nameEsc}</span>
                  <span style="font-size:11px; color:var(--text-dim); margin-left:4px;">팔로워 ${followers}</span>
                </div>
                ${this.renderCardInlineActionsHtml(chId, ch.channelName, ch.channelImageUrl, {
                  isBookmarked,
                  notifyEnabled,
                  bookmarkOnclick: `window.app.toggleBookmark('${chId}')`,
                  extraBeforeBookmarkHtml: `
                    <button class="icon-btn-inline btn-follow followed" data-channel-id="${chId}" onclick="event.stopPropagation(); window.app.toggleFollow('${chId}')" title="치지직 팔로우 취소">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    </button>
                  `
                })}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  filterFollowingTab(kw) {
    const query = (kw || '').trim().toLowerCase();
    if (!query) {
      this.renderFollowingTabLives(this.followingTabLives || []);
      this.renderFollowingTabChannels(this.followingTabChannels || []);
      return;
    }
    const filteredLives = (this.followingTabLives || []).filter(l => 
      (l.channelName && l.channelName.toLowerCase().includes(query)) ||
      (l.liveTitle && l.liveTitle.toLowerCase().includes(query)) ||
      (l.categoryValue && l.categoryValue.toLowerCase().includes(query))
    );
    const filteredChannels = (this.followingTabChannels || []).filter(c =>
      (c.channelName && c.channelName.toLowerCase().includes(query)) ||
      (c.channelId && c.channelId.toLowerCase().includes(query))
    );
    this.renderFollowingTabLives(filteredLives);
    this.renderFollowingTabChannels(filteredChannels);
  }

  // ================= Secure 1-Time Follow Import (Zero Credential Storage) =================
  async importChzzkFollows() {
    this.showToast('네이버 로그인 창이 열립니다. 로그인 완료 시 팔로우 목록을 즐겨찾기로 등록합니다.', 'info');
    if (this.cookieStatusText) {
      this.cookieStatusText.textContent = '로그인 창이 열렸습니다. 네이버 로그인을 진행해주세요...';
      this.cookieStatusText.style.color = '#38bdf8';
    }

    try {
      const res = await fetch('/api/user/import-following-login', { method: 'POST' });
      const data = await res.json();
      if (!data.success) {
        this.showToast(data.error || '팔로우 불러오기 시작 실패', 'error');
        return;
      }

      // Poll import status
      if (this.importFollowPollInterval) clearInterval(this.importFollowPollInterval);
      this.importFollowPollInterval = setInterval(async () => {
        try {
          const sRes = await fetch('/api/user/import-status');
          const sData = await sRes.json();
          if (sData.status === 'logging_in') {
            if (this.cookieStatusText) {
              this.cookieStatusText.textContent = '네이버 로그인 창에서 로그인을 완료해주세요...';
              this.cookieStatusText.style.color = '#38bdf8';
            }
          } else if (sData.status === 'importing') {
            if (this.cookieStatusText) {
              this.cookieStatusText.textContent = '치지직 팔로우 목록을 안전하게 불러오는 중...';
              this.cookieStatusText.style.color = 'var(--accent-color)';
            }
          } else if (sData.status === 'done') {
            clearInterval(this.importFollowPollInterval);
            this.importFollowPollInterval = null;
            this.showToast(sData.message || '치지직 팔로우 불러오기 완료! 로그인 정보는 즉시 파기되었습니다.', 'success');
            if (this.cookieStatusText) {
              this.cookieStatusText.textContent = `보안 모드: 팔로우 ${sData.imported || 0}명 불러옴 (로그인 쿠키 즉시 파기됨)`;
              this.cookieStatusText.style.color = 'var(--accent-color)';
            }
            await this.fetchBookmarks();
            await this.fetchFollowingLives();
            await this.fetchFollowingIds();
          } else if (sData.status === 'error') {
            clearInterval(this.importFollowPollInterval);
            this.importFollowPollInterval = null;
            this.showToast(sData.error || '팔로우 불러오기가 취소되었거나 실패했습니다.', 'error');
            if (this.cookieStatusText) {
              this.cookieStatusText.textContent = '팔로우 불러오기 미완료 (필요시 다시 시도하세요)';
              this.cookieStatusText.style.color = 'var(--warning-color)';
            }
          }
        } catch (pollErr) {
          console.warn('Import status poll error:', pollErr);
        }
      }, 1500);

    } catch (e) {
      this.showToast('팔로우 불러오기 요청 실패', 'error');
    }
  }

  async importFollowsByCookies() {
    if (!this.cookieInput) return;
    const cookies = this.cookieInput.value.trim();
    if (!cookies) {
      this.showToast('쿠키 문자열을 입력해주세요.', 'error');
      return;
    }
    this.showToast('쿠키를 통해 팔로우 목록을 1회 불러오는 중...', 'info');

    try {
      const res = await fetch('/api/user/import-following-by-cookies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookies })
      });
      const data = await res.json();
      if (data.success) {
        this.showToast(data.message || `팔로우 ${data.count || 0}명을 즐겨찾기로 등록했습니다!`, 'success');
        this.cookieInput.value = '';
        await this.fetchBookmarks();
        await this.fetchFollowingLives();
        await this.fetchFollowingIds();
      } else {
        this.showToast(data.error || '쿠키 팔로우 불러오기 실패', 'error');
      }
    } catch (err) {
      this.showToast('쿠키 팔로우 불러오기 오류', 'error');
    }
  }

  async openDefaultBrowserLogin() {
    this.showToast('기본 웹 브라우저에서 네이버 로그인 페이지를 엽니다...', 'info');
    try {
      const res = await fetch('/api/user/open-naver-browser', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        this.showToast('외부 브라우저에서 로그인 후 쿠키 직접 입력을 이용하실 수 있습니다.', 'info');
      } else {
        this.showToast('브라우저 열기 실패: ' + (data.error || '알 수 없는 오류'), 'error');
      }
    } catch (e) {
      this.showToast('브라우저 열기 실패', 'error');
    }
  }

  async openExternal(url) {
    if (!url) return;
    try {
      const res = await fetch('/api/system/open-browser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (!data.success) {
        window.open(url, '_blank');
      }
    } catch (e) {
      window.open(url, '_blank');
    }
  }

  async checkLoginStatus() {
    try {
      const res = await fetch('/api/user/status');
      const data = await res.json();
      if (this.cookieStatusText) {
        this.cookieStatusText.textContent = data.message || '보안 모드 활성화: 로그인 쿠키를 영구 저장하지 않습니다.';
        this.cookieStatusText.style.color = 'var(--accent-color)';
      }
    } catch (err) {
      console.error(err);
    }
  }

  // ================= Cloudflare 1.1.1.1 & Proxy Configuration =================
  async loadNetworkSettings() {
    try {
      const res = await fetch('/api/network/config');
      const data = await res.json();
      if (data && data.success && data.config) {
        const cfg = data.config;
        if (this.proxyEnableToggle) {
          this.proxyEnableToggle.checked = Boolean(cfg.use_proxy);
        }
        if (this.proxyEnableText) {
          const on = Boolean(cfg.use_proxy);
          this.proxyEnableText.textContent = on ? '켜짐 (활성)' : '꺼짐 (비활성)';
          this.proxyEnableText.style.color = on ? 'var(--accent-color)' : 'var(--text-muted)';
        }
        if (cfg.proxy_type === 'custom') {
          if (this.proxyModeCustom) this.proxyModeCustom.checked = true;
        } else {
          if (this.proxyModeWarp) this.proxyModeWarp.checked = true;
        }
        if (this.proxyUrlInput && cfg.proxy_url) {
          this.proxyUrlInput.value = cfg.proxy_url;
        }
      }
    } catch (err) {
      console.error('Failed to load network settings:', err);
    }
  }

  async saveProxySettings() {
    const useProxy = this.proxyEnableToggle ? this.proxyEnableToggle.checked : false;
    const mode = (this.proxyModeCustom && this.proxyModeCustom.checked) ? 'custom' : 'cloudflare_warp';
    const proxyUrl = this.proxyUrlInput ? this.proxyUrlInput.value.trim() : 'socks5://127.0.0.1:40000';

    try {
      const res = await fetch('/api/network/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          use_proxy: useProxy,
          proxy_type: mode,
          proxy_url: proxyUrl
        })
      });
      const data = await res.json();
      if (data && data.success) {
        this.showToast(`보안 프록시 설정이 저장되었습니다. (${useProxy ? '활성화' : '비활성화'})`, 'success');
      } else {
        this.showToast('설정 저장 실패', 'error');
      }
    } catch (err) {
      this.showToast('설정 저장 네트워크 오류', 'error');
    }
  }

  async testProxyConnection() {
    if (!this.proxyTestResult) return;
    this.proxyTestResult.style.display = 'block';
    this.proxyTestResult.style.background = 'rgba(56, 189, 248, 0.1)';
    this.proxyTestResult.style.border = '1px solid rgba(56, 189, 248, 0.3)';
    this.proxyTestResult.style.color = '#38bdf8';
    this.proxyTestResult.textContent = 'Cloudflare 1.1.1.1 cdn-cgi/trace 연결 진단 테스트 진행 중...';

    const useProxy = this.proxyEnableToggle ? this.proxyEnableToggle.checked : false;
    const mode = (this.proxyModeCustom && this.proxyModeCustom.checked) ? 'custom' : 'cloudflare_warp';
    const proxyUrl = this.proxyUrlInput ? this.proxyUrlInput.value.trim() : 'socks5://127.0.0.1:40000';

    try {
      const res = await fetch('/api/network/cloudflare/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          use_proxy: useProxy,
          proxy_type: mode,
          proxy_url: proxyUrl
        })
      });
      const data = await res.json();

      if (data && data.success) {
        this.proxyTestResult.style.background = 'rgba(0, 255, 163, 0.1)';
        this.proxyTestResult.style.border = '1px solid rgba(0, 255, 163, 0.3)';
        this.proxyTestResult.style.color = 'var(--accent-color)';
        this.proxyTestResult.innerHTML = `
          <div style="font-weight: 800; margin-bottom: 4px; display:flex; align-items:center; gap:5px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span>${escapeHtml(data.message)}</span>
          </div>
          <div style="font-size: 11.5px; color: var(--text-muted);">
            외부 IP: <span style="color:#fff;">${escapeHtml(data.ip || '')}</span> | 데이터센터(Colo): <span style="color:#fff;">${escapeHtml(data.colo || '')}</span> | 응답속도: <span style="color:#fff;">${data.latency_ms || 0}ms</span> | WARP: <span style="color:#fff;">${escapeHtml(data.warp || 'off')}</span>
          </div>
        `;
      } else {
        this.proxyTestResult.style.background = 'rgba(239, 68, 68, 0.1)';
        this.proxyTestResult.style.border = '1px solid rgba(239, 68, 68, 0.3)';
        this.proxyTestResult.style.color = '#f87171';
        this.proxyTestResult.innerHTML = `
          <div style="font-weight: 800; margin-bottom: 4px; display:flex; align-items:center; gap:5px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            <span>연결 실패</span>
          </div>
          <div style="font-size: 11.5px;">${escapeHtml(data.error || '연결할 수 없습니다.')}</div>
        `;
      }
    } catch (err) {
      this.proxyTestResult.style.background = 'rgba(239, 68, 68, 0.1)';
      this.proxyTestResult.style.border = '1px solid rgba(239, 68, 68, 0.3)';
      this.proxyTestResult.style.color = '#f87171';
      this.proxyTestResult.textContent = `진단 요청 중 오류 발생: ${err.message}`;
    }
  }

  async clearCookies() {
    if (!confirm('로그아웃하고 저장된 쿠키를 삭제하시겠습니까?')) return;
    try {
      await fetch('/api/settings/cookies/clear', { method: 'POST' });
      this.showToast('로그아웃되었습니다. (쿠키 삭제 완료)', 'info');
      this.followingLives = [];
      this.followingChannels = [];
      this.followingChannelIds = new Set();
      this.updateFollowingBadge();
      if (this.followingLivesSection) this.followingLivesSection.style.display = 'none';
      this.checkLoginStatus();
    } catch (err) {
      console.error(err);
    }
  }

  async resetSystemData(target) {
    let confirmMsg = '';
    if (target === 'data') {
      confirmMsg = '치지직/유튜브 북마크, 유튜브 시청 기록 및 추천 키워드를 초기화하시겠습니까?';
    } else if (target === 'login') {
      confirmMsg = '저장된 네이버 로그인 쿠키를 삭제하고 로그아웃하시겠습니까?';
    } else if (target === 'media') {
      confirmMsg = '저장된 모든 녹화 파일(recordings/)과 클립 파일(clips/)을 삭제하시겠습니까?\n삭제된 파일은 복구할 수 없습니다.';
    } else if (target === 'factory') {
      confirmMsg = '[경고] 모든 설정, 북마크, 시청 기록, 로그인 세션, 녹화 및 클립 파일이 완전히 삭제되고 최초 설치 상태로 되돌아갑니다.\n\n정말로 전체 공장 초기화를 진행하시겠습니까?';
    }

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/system/reset-data?target=${target}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        if (target === 'data') {
          this.showToast('북마크, 시청 기록 및 키워드가 초기화되었습니다.', 'success');
          if (window.bookmarksUI) window.bookmarksUI.loadBookmarks();
          if (window.youtubeUI) {
            window.youtubeUI.loadKeywords();
            window.youtubeUI.loadBookmarks();
            window.youtubeUI.loadHistory();
            window.youtubeUI.loadRecommendations();
          }
        } else if (target === 'login') {
          this.showToast('로그인 정보가 성공적으로 삭제되었습니다.', 'info');
          this.followingLives = [];
          this.followingChannels = [];
          this.followingChannelIds = new Set();
          this.updateFollowingBadge();
          if (this.followingLivesSection) this.followingLivesSection.style.display = 'none';
          this.checkLoginStatus();
        } else if (target === 'media') {
          this.showToast(`녹화 및 클립 파일(${data.results.media || 0}개)이 모두 정리되었습니다.`, 'success');
          if (window.recorderUI) window.recorderUI.loadRecordings();
        } else if (target === 'factory') {
          this.showToast('프로그램이 최초 상태로 완전히 초기화되었습니다. 새로고침합니다.', 'success');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      }
    } catch (err) {
      console.error('Reset data error:', err);
      this.showToast('초기화 중 오류가 발생했습니다.', 'error');
    }
  }

  // ================= Diagnostics Situation Log (상황로그파일) =================
  async loadDiagnosticsLog() {
    const el = document.getElementById('diagLogContainer');
    if (!el) return;
    try {
      const res = await fetch('/api/diagnostics/recent?limit=150');
      const data = await res.json();
      if (data.success && data.lines && data.lines.length > 0) {
        el.textContent = data.lines.join('\n');
        el.scrollTop = el.scrollHeight;
      } else {
        el.textContent = '기록된 상황 로그가 아직 없습니다. (방송 시청 중 이벤트나 버퍼링이 발생하면 실시간 기록됩니다)';
      }
    } catch (e) {
      el.textContent = '로그 로딩 실패: ' + e.message;
    }
  }

  async copyDiagnosticsLog() {
    const el = document.getElementById('diagLogContainer');
    if (!el || !el.textContent || el.textContent.startsWith('기록된 상황')) {
      this.showToast('복사할 상황 로그가 없습니다.', 'warning');
      return;
    }
    try {
      await navigator.clipboard.writeText(el.textContent);
      this.showToast('최신 상황 로그가 클립보드에 복사되었습니다.', 'success');
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = el.textContent;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      this.showToast('최신 상황 로그가 클립보드에 복사되었습니다.', 'success');
    }
  }

  async openDiagnosticsFile() {
    try {
      const res = await fetch('/api/diagnostics/open-file', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        this.showToast('상황 로그 파일(playback_diagnostics.log)을 열었습니다.', 'info');
      } else {
        this.showToast('로그 파일 열기 실패: ' + (data.error || ''), 'error');
      }
    } catch (e) {
      this.showToast('로그 파일 열기 오류', 'error');
    }
  }

  async clearDiagnosticsLog() {
    if (!confirm('정말로 상황 진단 로그를 비우시겠습니까?')) return;
    try {
      const res = await fetch('/api/diagnostics/clear', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        this.showToast('상황 로그가 초기화되었습니다.', 'success');
        this.loadDiagnosticsLog();
      }
    } catch (e) {
      this.showToast('로그 초기화 오류', 'error');
    }
  }

  // ================= GitHub In-App Auto-Updater =================
  async loadVersionInfo() {
    try {
      const res = await fetch('/api/system/version');
      const data = await res.json();
      if (data.success) {
        const verStr = `v${data.version}${data.commitSha ? ` (${data.commitShort})` : ''}`;
        const badgeEl = document.getElementById('updateCurrentVerBadge');
        const infoEl = document.getElementById('infoVersionText');
        const repoInput = document.getElementById('updateRepoUrlInput');
        if (badgeEl) badgeEl.textContent = verStr;
        if (infoEl) infoEl.textContent = `${verStr} (최근 업데이트: ${data.updatedAt || '-'})`;
        if (repoInput && data.repoUrl) repoInput.value = data.repoUrl;
      }
    } catch (e) {}
  }

  async checkSystemUpdate(manual = true) {
    const btn = document.getElementById('checkUpdateBtn');
    const titleEl = document.getElementById('updateStatusTitle');
    const descEl = document.getElementById('updateStatusDesc');
    const applyBtn = document.getElementById('applyUpdateBtn');
    const navBadge = document.getElementById('settings-update-badge');

    if (manual && btn) {
      btn.disabled = true;
      btn.textContent = '확인 중...';
    }
    if (manual && titleEl) {
      titleEl.textContent = 'GitHub 저장소에서 최신 버전 확인 중...';
      if (descEl) descEl.textContent = '잠시만 기다려주세요.';
    }

    try {
      const repoInput = document.getElementById('updateRepoUrlInput');
      const repoParam = repoInput && repoInput.value ? `?repo_url=${encodeURIComponent(repoInput.value.trim())}` : '';
      const res = await fetch(`/api/system/update/check${repoParam}`);
      const data = await res.json();

      if (data.success) {
        if (data.hasUpdate) {
          if (navBadge) navBadge.style.display = 'inline-flex';
          if (titleEl) {
            titleEl.style.color = 'var(--accent-color)';
            titleEl.textContent = `새로운 업데이트 발견: ${data.updateReason || `v${data.remoteVersion}`}`;
          }
          if (descEl) {
            const msgPart = data.commitMessage ? ` — "${data.commitMessage}"` : '';
            descEl.textContent = `현재 v${data.localVersion} (${data.localCommit}) -> 최신 v${data.remoteVersion} (${data.latestCommit || 'latest'})${msgPart}`;
          }
          if (applyBtn) {
            applyBtn.style.display = 'inline-flex';
          }
          if (manual) {
            this.showToast(`새로운 업데이트(${data.updateReason || data.remoteVersion})가 있습니다!`, 'info');
          }
        } else {
          if (navBadge) navBadge.style.display = 'none';
          if (titleEl) {
            titleEl.style.color = '#fff';
            titleEl.textContent = `현재 최신 버전을 사용 중입니다 (v${data.localVersion})`;
          }
          if (descEl) {
            descEl.textContent = `최신 커밋: ${data.latestCommit || data.localCommit} ${data.commitMessage ? `(${data.commitMessage})` : ''}`;
          }
          if (applyBtn) {
            applyBtn.style.display = 'none';
          }
          if (manual) {
            this.showToast('현재 최신 버전을 사용 중입니다.', 'success');
          }
        }
      } else {
        if (titleEl) {
          titleEl.style.color = '#fbbf24';
          titleEl.textContent = '저장소 상태 안내';
        }
        if (descEl) {
          descEl.textContent = data.error || '업데이트 정보를 가져오지 못했습니다.';
        }
        if (applyBtn) applyBtn.style.display = 'none';
        if (manual && data.error) {
          this.showToast(data.error, 'warning');
        }
      }
    } catch (e) {
      if (titleEl) titleEl.textContent = '업데이트 확인 실패';
      if (descEl) descEl.textContent = '네트워크 또는 서버 오류가 발생했습니다.';
      if (manual) this.showToast('업데이트 확인 중 오류가 발생했습니다.', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '업데이트 확인';
      }
    }
  }

  async saveUpdateConfig() {
    const repoInput = document.getElementById('updateRepoUrlInput');
    const tokenInput = document.getElementById('updateGithubTokenInput');
    const repo_url = repoInput ? repoInput.value.trim() : '';
    const github_token = tokenInput ? tokenInput.value.trim() : undefined;

    try {
      const res = await fetch('/api/system/update/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo_url, github_token })
      });
      const data = await res.json();
      await this.loadVersionInfo();
      await this.checkSystemUpdate(true);
    } catch (e) {
      this.showToast('설정 저장 중 오류가 발생했습니다.', 'error');
    }
  }

  async applySystemUpdate() {
    if (!confirm('GitHub에서 최신 업데이트를 다운로드하여 적용하고 프로그램을 재시작하시겠습니까?\n(북마크, 시청 기록, 로그인 정보, 녹화/클립 파일은 모두 안전하게 유지됩니다.)')) {
      return;
    }

    const applyBtn = document.getElementById('applyUpdateBtn');
    const titleEl = document.getElementById('updateStatusTitle');
    const descEl = document.getElementById('updateStatusDesc');

    if (applyBtn) {
      applyBtn.disabled = true;
      applyBtn.textContent = '업데이트 다운로드 및 설치 중...';
    }
    if (titleEl) titleEl.textContent = '업데이트 패키지를 다운로드하고 적용하는 중입니다...';
    if (descEl) descEl.textContent = '완료되면 프로그램이 자동으로 재시작됩니다. 잠시만 기다려주세요.';

    try {
      const res = await fetch('/api/system/update/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auto_restart: true })
      });
      const data = await res.json();
      if (data.success) {
        this.showToast(data.message || '업데이트가 완료되었습니다! 잠시 후 재시작됩니다.', 'success');
        if (titleEl) titleEl.textContent = `업데이트 완료 (v${data.updatedVersion}) — 재시작 중...`;
        setTimeout(() => {
          window.location.reload();
        }, 3500);
      } else {
        this.showToast(data.error || '업데이트 적용 실패', 'error');
        if (titleEl) titleEl.textContent = '업데이트 적용 실패';
        if (descEl) descEl.textContent = data.error || '';
        if (applyBtn) {
          applyBtn.disabled = false;
          applyBtn.textContent = '지금 업데이트 및 재시작';
        }
      }
    } catch (e) {
      this.showToast('업데이트 중 오류가 발생했습니다.', 'error');
      if (applyBtn) {
        applyBtn.disabled = false;
        applyBtn.textContent = '지금 업데이트 및 재시작';
      }
    }
  }

  // ================= Toast =================
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const iconSvg = type === 'success'
      ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>'
      : (type === 'error'
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>');
    toast.innerHTML = `<span style="display:inline-flex;align-items:center;">${iconSvg}</span><span>${escapeHtml(message)}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new ChzzkApp();

  // Intercept all target="_blank" external links to open via system browser
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[target="_blank"]');
    if (a && a.href && (a.href.startsWith('http://') || a.href.startsWith('https://'))) {
      e.preventDefault();
      if (window.app && typeof window.app.openExternal === 'function') {
        window.app.openExternal(a.href);
      } else {
        window.open(a.href, '_blank');
      }
    }
  });
});
