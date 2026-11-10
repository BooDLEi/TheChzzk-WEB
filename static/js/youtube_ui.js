/* ============================================================
   더치지직 (The Chzzk) - YouTube UI Controller (youtube_ui.js)
   유튜브 영상 탐색, 채널 즐겨찾기, 무광고 멀티뷰잉, 시청기록 및 알고리즘 추천
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

class YouTubeUI {
  constructor() {
    this.currentSubTab = 'recommendations'; // 'recommendations' | 'search' | 'bookmarks' | 'playlists' | 'watchlater' | 'history'
    this.activeKeywords = [];
    this.recommendations = [];
    this.searchResults = [];
    this.channels = [];
    this.bookmarks = [];
    this.videoBookmarks = [];
    this.customPlaylists = [];
    this.watchLater = [];
    this.bookmarksSegment = 'channels'; // 'channels' | 'videos'
    this.keywordsCollapsed = false;
    this._targetVideoForPlaylist = null;
    this.history = [];
    this._videoCache = {};
    this.currentChannelView = null; // When viewing a channel's uploads

    this.initElements();
    this.bindEvents();
    this.loadKeywords();
    this.loadBookmarks();
    this.loadVideoBookmarks();
    this.loadCustomPlaylists();
    this.loadWatchLater();
    this.loadRecommendations();
  }

  initElements() {
    // Sub tab buttons
    this.subTabBtns = document.querySelectorAll('.yt-subtab-btn');
    this.subPanes = document.querySelectorAll('.yt-sub-pane');

    // Keyword chips container
    this.ytKeywordsBar = document.getElementById('ytKeywordsBar');
    this.ytAddKeywordBtn = document.getElementById('ytAddKeywordBtn');
    this.ytAddKeywordInput = document.getElementById('ytAddKeywordInput');
    this.ytAddKeywordForm = document.getElementById('ytAddKeywordForm');
    this.ytResetKeywordsBtn = document.getElementById('ytResetKeywordsBtn');
    this.ytRefreshRecsBtn = document.getElementById('ytRefreshRecsBtn');

    // Search bar
    this.ytSearchInput = document.getElementById('ytSearchInput');
    this.ytSearchBtn = document.getElementById('ytSearchBtn');
    this.ytClearSearchBtn = document.getElementById('ytClearSearchBtn');

    // Feeds
    this.ytRecsGrid = document.getElementById('ytRecsGrid');
    this.ytRecsLoading = document.getElementById('ytRecsLoading');
    this.ytRecsEmpty = document.getElementById('ytRecsEmpty');

    this.ytSearchGrid = document.getElementById('ytSearchGrid');
    this.ytSearchChannelsRow = document.getElementById('ytSearchChannelsRow');
    this.ytSearchLoading = document.getElementById('ytSearchLoading');
    this.ytSearchEmpty = document.getElementById('ytSearchEmpty');

    this.ytBookmarksGrid = document.getElementById('ytBookmarksGrid');
    this.ytBookmarksEmpty = document.getElementById('ytBookmarksEmpty');
    this.ytBookmarksBadge = document.getElementById('yt-bookmarks-badge');

    this.ytHistoryGrid = document.getElementById('ytHistoryGrid');
    this.ytHistoryEmpty = document.getElementById('ytHistoryEmpty');
    this.ytClearHistoryBtn = document.getElementById('ytClearHistoryBtn');

    // Channel videos view (overlay inside YouTube tab)
    this.ytChannelViewSection = document.getElementById('ytChannelViewSection');
    this.ytChannelBannerTitle = document.getElementById('ytChannelBannerTitle');
    this.ytChannelBannerAvatar = document.getElementById('ytChannelBannerAvatar');
    this.ytChannelBannerSubs = document.getElementById('ytChannelBannerSubs');
    this.ytChannelVideosGrid = document.getElementById('ytChannelVideosGrid');
    this.ytCloseChannelViewBtn = document.getElementById('ytCloseChannelViewBtn');
    this.ytChannelBookmarkToggleBtn = document.getElementById('ytChannelBookmarkToggleBtn');
  }

  bindEvents() {
    // Sub-tab switching
    this.subTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.subtab;
        this.switchSubTab(target);
      });
    });

    // Keywords management
    if (this.ytAddKeywordBtn && this.ytAddKeywordForm) {
      this.ytAddKeywordBtn.addEventListener('click', () => {
        this.ytAddKeywordForm.style.display = this.ytAddKeywordForm.style.display === 'flex' ? 'none' : 'flex';
        if (this.ytAddKeywordForm.style.display === 'flex' && this.ytAddKeywordInput) {
          this.ytAddKeywordInput.focus();
        }
      });
    }

    if (this.ytAddKeywordInput) {
      this.ytAddKeywordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.addKeywordFromInput();
        } else if (e.key === 'Escape') {
          if (this.ytAddKeywordForm) this.ytAddKeywordForm.style.display = 'none';
        }
      });
    }

    if (this.ytResetKeywordsBtn) {
      this.ytResetKeywordsBtn.addEventListener('click', () => this.resetKeywords());
    }

    if (this.ytRefreshRecsBtn) {
      this.ytRefreshRecsBtn.addEventListener('click', () => {
        this.loadRecommendations(true);
      });
    }

    // Search
    let searchTimeout = null;
    if (this.ytSearchInput) {
      this.ytSearchInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (this.ytClearSearchBtn) {
          this.ytClearSearchBtn.style.display = val ? 'flex' : 'none';
        }
        clearTimeout(searchTimeout);
        if (!val) {
          if (this.ytSearchGrid) this.ytSearchGrid.innerHTML = '';
          if (this.ytSearchChannelsRow) this.ytSearchChannelsRow.innerHTML = '';
          if (this.ytSearchEmpty) this.ytSearchEmpty.style.display = 'flex';
          return;
        }
        searchTimeout = setTimeout(() => {
          this.handleSearch(val);
        }, 450);
      });

      this.ytSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          clearTimeout(searchTimeout);
          this.handleSearch(this.ytSearchInput.value.trim());
        }
      });
    }

    if (this.ytSearchBtn) {
      this.ytSearchBtn.addEventListener('click', () => {
        if (this.ytSearchInput) this.handleSearch(this.ytSearchInput.value.trim());
      });
    }

    if (this.ytClearSearchBtn) {
      this.ytClearSearchBtn.addEventListener('click', () => {
        if (this.ytSearchInput) {
          this.ytSearchInput.value = '';
          this.ytClearSearchBtn.style.display = 'none';
          if (this.ytSearchGrid) this.ytSearchGrid.innerHTML = '';
          if (this.ytSearchChannelsRow) this.ytSearchChannelsRow.innerHTML = '';
          if (this.ytSearchEmpty) this.ytSearchEmpty.style.display = 'flex';
        }
      });
    }

    // History
    if (this.ytClearHistoryBtn) {
      this.ytClearHistoryBtn.addEventListener('click', () => this.clearHistory());
    }

    // Channel view close
    if (this.ytCloseChannelViewBtn) {
      this.ytCloseChannelViewBtn.addEventListener('click', () => {
        this.closeChannelView();
      });
    }
  }

  onEnterTab() {
    this.loadKeywords();
    if (this.currentSubTab === 'recommendations') {
      if (this.recommendations.length === 0) {
        this.loadRecommendations();
      }
    } else if (this.currentSubTab === 'bookmarks') {
      this.loadBookmarks();
      this.loadVideoBookmarks();
    } else if (this.currentSubTab === 'playlists') {
      this.loadCustomPlaylists();
    } else if (this.currentSubTab === 'watchlater') {
      this.loadWatchLater();
    } else if (this.currentSubTab === 'history') {
      this.loadHistory();
    }
  }

  switchSubTab(subTabName, triggerAction = true) {
    this.currentSubTab = subTabName;
    this.closeChannelView();

    this.subTabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.subtab === subTabName);
    });

    this.subPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === `yt-${subTabName}-pane`);
    });

    // Requirement 5: 알고리즘 키워드 설정 툴바는 오직 추천영상 탭에서만 노출
    const algoToolbar = document.getElementById('ytAlgorithmToolbar');
    if (algoToolbar) {
      algoToolbar.style.display = (subTabName === 'recommendations') ? 'flex' : 'none';
    }

    if (!triggerAction) return;

    if (subTabName === 'recommendations') {
      this.loadRecommendations();
    } else if (subTabName === 'bookmarks') {
      this.loadBookmarks();
      this.loadVideoBookmarks();
    } else if (subTabName === 'playlists') {
      this.loadCustomPlaylists();
    } else if (subTabName === 'watchlater') {
      this.loadWatchLater();
    } else if (subTabName === 'history') {
      this.loadHistory();
    } else if (subTabName === 'search') {
      if (this.ytSearchInput && this.ytSearchInput.value.trim()) {
        this.handleSearch(this.ytSearchInput.value.trim());
      } else if (this.ytSearchInput) {
        this.ytSearchInput.focus();
      }
    }
  }

  // Requirement 5: 알고리즘 키워드 창 접기/펼치기 토글
  toggleKeywordsBar() {
    this.keywordsCollapsed = !this.keywordsCollapsed;
    const toolbar = document.getElementById('ytAlgorithmToolbar');
    const icon = document.getElementById('ytToggleKeywordsIcon');
    if (toolbar) {
      toolbar.classList.toggle('collapsed', this.keywordsCollapsed);
    }
    if (icon) {
      icon.textContent = this.keywordsCollapsed ? '▶' : '▼';
    }
  }

  // ================= Keywords Management (희망 알고리즘 키워드) =================
  async loadKeywords() {
    try {
      const res = await fetch('/api/youtube/keywords');
      const data = await res.json();
      if (data && data.keywords) {
        this.activeKeywords = data.keywords;
        this.renderKeywords();
      }
    } catch (e) {
      console.warn('Load keywords failed:', e);
    }
  }

  renderKeywords() {
    if (!this.ytKeywordsBar) return;

    let html = `
      <div class="yt-kw-label" title="키워드 및 키워드들의 조합으로 맞춤 추천 영상이 생성됩니다.">
        <span>희망 알고리즘:</span>
      </div>
    `;

    this.activeKeywords.forEach(kw => {
      const esc = escapeHtml(kw);
      html += `
        <span class="yt-kw-chip" title="'${esc}' 관련 영상 및 다른 키워드와의 조합 추천">
          <span class="yt-kw-text" onclick="window.youtubeUI.searchKeywordDirect('${esc}')">#${esc}</span>
          <button class="yt-kw-del-btn" onclick="window.youtubeUI.removeKeyword('${esc}')" title="키워드 삭제">✕</button>
        </span>
      `;
    });

    html += `
      <button class="btn btn-sm btn-secondary yt-kw-add-btn" id="ytAddKeywordInlineBtn" onclick="window.youtubeUI.toggleAddKeywordForm()" title="새로운 희망 알고리즘 키워드 추가">
        + 키워드 추가
      </button>
      <button class="btn btn-sm btn-ghost yt-kw-reset-btn" onclick="window.youtubeUI.resetKeywords()" title="알고리즘 키워드 초기화">
        초기화
      </button>
    `;

    this.ytKeywordsBar.innerHTML = html;
  }

  toggleAddKeywordForm() {
    if (this.ytAddKeywordForm) {
      const isOpen = this.ytAddKeywordForm.style.display === 'flex';
      this.ytAddKeywordForm.style.display = isOpen ? 'none' : 'flex';
      if (!isOpen && this.ytAddKeywordInput) {
        this.ytAddKeywordInput.focus();
      }
    } else {
      const kw = prompt('추가할 희망 알고리즘 키워드를 입력하세요 (예: 롤, 음악, 피식대학, 코딩 등):');
      if (kw && kw.trim()) {
        this.addKeyword(kw.trim());
      }
    }
  }

  async addKeywordFromInput() {
    if (!this.ytAddKeywordInput) return;
    const kw = this.ytAddKeywordInput.value.trim();
    if (!kw) return;
    this.ytAddKeywordInput.value = '';
    if (this.ytAddKeywordForm) this.ytAddKeywordForm.style.display = 'none';
    await this.addKeyword(kw);
  }

  async addKeyword(keyword) {
    try {
      const res = await fetch('/api/youtube/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword })
      });
      const data = await res.json();
      if (data.success) {
        this.activeKeywords = data.keywords;
        this.renderKeywords();
        if (window.app) {
          window.app.showToast(`'#${keyword}' 키워드가 희망 알고리즘에 추가되었습니다! 추천 피드를 갱신합니다.`, 'success');
        }
        this.loadRecommendations(true);
      } else {
        if (window.app) window.app.showToast(data.error || '키워드 추가 실패', 'error');
      }
    } catch (e) {
      console.error(e);
    }
  }

  async removeKeyword(keyword) {
    try {
      const res = await fetch(`/api/youtube/keywords/${encodeURIComponent(keyword)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        this.activeKeywords = data.keywords;
        this.renderKeywords();
        if (window.app) {
          window.app.showToast(`'#${keyword}' 키워드를 삭제했습니다.`, 'info');
        }
        this.loadRecommendations(true);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async resetKeywords() {
    if (!confirm('희망 알고리즘 키워드를 기본값으로 초기화하시겠습니까?')) return;
    try {
      const res = await fetch('/api/youtube/keywords/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        this.activeKeywords = data.keywords;
        this.renderKeywords();
        if (window.app) {
          window.app.showToast('알고리즘 키워드가 기본값으로 복원되었습니다.', 'success');
        }
        this.loadRecommendations(true);
      }
    } catch (e) {
      console.error(e);
    }
  }

  searchKeywordDirect(keyword) {
    this.switchSubTab('search');
    if (this.ytSearchInput) {
      this.ytSearchInput.value = keyword;
      if (this.ytClearSearchBtn) this.ytClearSearchBtn.style.display = 'flex';
      this.handleSearch(keyword);
    }
  }

  // ================= Recommendations (알고리즘 추천 영상 피드) =================
  async loadRecommendations(showToast = false) {
    if (this.ytRecsLoading) this.ytRecsLoading.style.display = 'flex';
    if (this.ytRecsEmpty) this.ytRecsEmpty.style.display = 'none';

    try {
      const res = await fetch('/api/youtube/recommendations?limit=40');
      const data = await res.json();
      if (this.ytRecsLoading) this.ytRecsLoading.style.display = 'none';

      if (data.success && data.videos && data.videos.length > 0) {
        this.recommendations = data.videos;
        this.renderVideoGrid(this.ytRecsGrid, this.recommendations, 'recommendation');
        if (showToast && window.app) {
          window.app.showToast(`시청 기록 및 ${this.activeKeywords.length}개 키워드 조합 기반 추천 피드가 갱신되었습니다!`, 'success');
        }
      } else {
        if (this.ytRecsEmpty) this.ytRecsEmpty.style.display = 'flex';
        if (this.ytRecsGrid) this.ytRecsGrid.innerHTML = '';
      }
    } catch (e) {
      console.error('Load recommendations error:', e);
      if (this.ytRecsLoading) this.ytRecsLoading.style.display = 'none';
      if (this.ytRecsEmpty) this.ytRecsEmpty.style.display = 'flex';
    }
  }

  // ================= Search (영상 탐색 & YouTube URL 자동 감지) =================
  async handleSearch(query) {
    if (!query) return;

    // Auto-switch to search subtab visually
    this.switchSubTab('search', false);

    // Detect direct YouTube Video URL (watch, short, embed, shorts, live)
    const ytUrlMatch = query.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|v\/|shorts\/|live\/))([\w-]{11})/i);
    if (ytUrlMatch && ytUrlMatch[1]) {
      const extractedVid = ytUrlMatch[1];
      this.playInMultiview(extractedVid, `유튜브 영상 (${extractedVid})`, 'YouTube', '', `https://i.ytimg.com/vi/${extractedVid}/hqdefault.jpg`);
      return;
    }

    if (this.ytSearchLoading) this.ytSearchLoading.style.display = 'flex';
    if (this.ytSearchEmpty) this.ytSearchEmpty.style.display = 'none';

    try {
      const res = await fetch(`/api/youtube/search?query=${encodeURIComponent(query)}&size=36`);
      const data = await res.json();
      if (this.ytSearchLoading) this.ytSearchLoading.style.display = 'none';

      if (data.success) {
        this.searchResults = data.videos || [];
        this.channels = data.channels || [];

        // Render matching channels row
        this.renderChannelsRow(this.channels);

        if (this.searchResults.length > 0) {
          this.renderVideoGrid(this.ytSearchGrid, this.searchResults, 'search');
          if (this.ytSearchEmpty) this.ytSearchEmpty.style.display = 'none';
        } else {
          if (this.ytSearchGrid) this.ytSearchGrid.innerHTML = '';
          if (this.ytSearchEmpty) this.ytSearchEmpty.style.display = 'flex';
        }
      }
    } catch (e) {
      console.error('Search error:', e);
      if (this.ytSearchLoading) this.ytSearchLoading.style.display = 'none';
      if (this.ytSearchEmpty) this.ytSearchEmpty.style.display = 'flex';
    }
  }

  renderChannelsRow(channels) {
    if (!this.ytSearchChannelsRow) return;
    if (!channels || channels.length === 0) {
      this.ytSearchChannelsRow.style.display = 'none';
      this.ytSearchChannelsRow.innerHTML = '';
      return;
    }

    this.ytSearchChannelsRow.style.display = 'flex';
    let html = `
      <div class="yt-channels-row-header">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span>관련 채널</span>
      </div>
      <div class="yt-channels-scroll">
    `;

    channels.forEach(ch => {
      const nameEsc = escapeHtml(ch.channelName);
      const idEsc = escapeHtml(ch.channelId);
      const isBookmarked = this.isBookmarked(ch.channelId);

      html += `
        <div class="yt-channel-card" onclick="window.youtubeUI.openChannelView('${idEsc}', '${nameEsc}', '${ch.thumbnail || ''}', '${ch.subscriberCount || ''}')">
          <img class="yt-channel-avatar" src="${ch.thumbnail || './static/img/favicon.png'}" onerror="this.src='./static/img/favicon.png'" alt="${nameEsc}">
          <div class="yt-channel-info">
            <div class="yt-channel-title" title="${nameEsc}">${nameEsc}</div>
            <div class="yt-channel-subs">${escapeHtml(ch.subscriberCount || '채널')}</div>
          </div>
          <button class="btn btn-sm ${isBookmarked ? 'btn-danger' : 'btn-secondary'} yt-channel-bm-btn" onclick="event.stopPropagation(); window.youtubeUI.toggleBookmark('${idEsc}', '${nameEsc}', '${ch.thumbnail || ''}', '${ch.subscriberCount || ''}')" title="${isBookmarked ? '즐겨찾기 해제' : '채널 즐겨찾기'}">
            ${isBookmarked ? '★ 즐겨찾기됨' : '☆ 즐겨찾기'}
          </button>
        </div>
      `;
    });

    html += `</div>`;
    this.ytSearchChannelsRow.innerHTML = html;
  }

  // ================= Channel Videos View (채널 상세 영상 목록) =================
  async openChannelView(channelId, channelName, avatarUrl = '', subs = '') {
    if (!this.ytChannelViewSection) return;
    this.currentChannelView = { channelId, channelName, avatarUrl, subs };
    this.channelContinuationToken = null;
    this.isLoadingMoreChannelVideos = false;

    this.ytChannelViewSection.style.display = 'flex';
    if (this.ytChannelBannerTitle) this.ytChannelBannerTitle.textContent = channelName || '채널';
    if (this.ytChannelBannerSubs) this.ytChannelBannerSubs.textContent = subs || '';
    if (this.ytChannelBannerAvatar) this.ytChannelBannerAvatar.src = avatarUrl || './static/img/favicon.png';

    // Smooth scroll page to top to ensure channel drawer is clearly visible (Requirement 7)
    const ytContainer = document.querySelector('.yt-page-container') || document.querySelector('.main-content') || window;
    if (ytContainer && typeof ytContainer.scrollTo === 'function') {
      ytContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const isBookmarked = channelId ? this.isBookmarked(channelId) : false;
    if (this.ytChannelBookmarkToggleBtn) {
      this.ytChannelBookmarkToggleBtn.textContent = isBookmarked ? '즐겨찾기 해제' : '채널 즐겨찾기';
      this.ytChannelBookmarkToggleBtn.className = `btn btn-sm ${isBookmarked ? 'btn-danger' : 'btn-primary'}`;
      this.ytChannelBookmarkToggleBtn.onclick = () => {
        if (this.currentChannelView && this.currentChannelView.channelId) {
          this.toggleBookmark(
            this.currentChannelView.channelId,
            this.currentChannelView.channelName,
            this.currentChannelView.avatarUrl,
            this.currentChannelView.subs
          );
        }
      };
    }

    if (this.ytChannelVideosGrid) {
      this.ytChannelVideosGrid.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted); grid-column: 1 / -1;">채널 최신 영상을 불러오는 중...</div>';
    }
    const moreWrap = document.getElementById('ytChannelMoreWrap');
    if (moreWrap) moreWrap.style.display = 'none';

    try {
      // Requirement 1: If channelId is missing, resolve it via search API
      if (!channelId && channelName) {
        try {
          const sRes = await fetch(`/api/youtube/search?q=${encodeURIComponent(channelName)}`);
          const sData = await sRes.json();
          if (sData.channels && sData.channels.length > 0) {
            const ch = sData.channels[0];
            channelId = ch.channelId || '';
            if (!avatarUrl && ch.thumbnail) avatarUrl = ch.thumbnail;
            if (!subs && ch.subscriberCount) subs = ch.subscriberCount;
          } else if (sData.videos && sData.videos.length > 0) {
            const match = sData.videos.find(v => v.channelTitle && v.channelTitle.toLowerCase() === channelName.toLowerCase()) || sData.videos[0];
            if (match && match.channelId) {
              channelId = match.channelId;
              if (!avatarUrl && match.channelThumbnail) avatarUrl = match.channelThumbnail;
            }
          }
          if (channelId) {
            this.currentChannelView.channelId = channelId;
            this.currentChannelView.avatarUrl = avatarUrl;
            this.currentChannelView.subs = subs;
            if (this.ytChannelBannerAvatar && avatarUrl) this.ytChannelBannerAvatar.src = avatarUrl;
            if (this.ytChannelBannerSubs && subs) this.ytChannelBannerSubs.textContent = subs;
          }
        } catch (searchErr) {
          console.warn('Channel search fallback failed:', searchErr);
        }
      }

      if (channelId) {
        const res = await fetch(`/api/youtube/channel/${encodeURIComponent(channelId)}?size=48`);
        const data = await res.json();
        if (data.success && data.videos && data.videos.length > 0) {
          if (data.channelName && this.ytChannelBannerTitle) this.ytChannelBannerTitle.textContent = data.channelName;
          if (data.avatar && this.ytChannelBannerAvatar) this.ytChannelBannerAvatar.src = data.avatar;
          if (data.subscriberCount && this.ytChannelBannerSubs) this.ytChannelBannerSubs.textContent = data.subscriberCount;

          this.channelVideos = data.videos;
          this.channelVideosCount = 12;
          this.channelContinuationToken = data.continuationToken || null;
          this.renderChannelVideos();
          return;
        }
      }

      // If channel videos still empty, fallback search by channelName
      if (channelName) {
        const sRes = await fetch(`/api/youtube/search?q=${encodeURIComponent(channelName)}`);
        const sData = await sRes.json();
        if (sData.videos && sData.videos.length > 0) {
          this.channelVideos = sData.videos;
          this.channelVideosCount = 12;
          this.channelContinuationToken = null;
          this.renderChannelVideos();
          return;
        }
      }

      if (this.ytChannelVideosGrid) {
        this.ytChannelVideosGrid.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted); grid-column: 1 / -1;">채널 영상을 불러올 수 없습니다.</div>';
      }
    } catch (e) {
      console.error(e);
      if (this.ytChannelVideosGrid) {
        this.ytChannelVideosGrid.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted); grid-column: 1 / -1;">채널 영상 조회 중 오류가 발생했습니다.</div>';
      }
    }
  }

  async loadMoreChannelVideosFromApi() {
    if (!this.currentChannelView || !this.channelContinuationToken || this.isLoadingMoreChannelVideos) return;
    this.isLoadingMoreChannelVideos = true;
    const moreBtn = document.getElementById('ytChannelLoadMoreBtn');
    if (moreBtn) moreBtn.textContent = '불러오는 중...';

    try {
      const cId = this.currentChannelView.channelId;
      const res = await fetch(`/api/youtube/channel/${encodeURIComponent(cId)}?continuation=${encodeURIComponent(this.channelContinuationToken)}`);
      const data = await res.json();
      if (data.success && data.videos && data.videos.length > 0) {
        this.channelVideos.push(...data.videos);
        this.channelContinuationToken = data.continuationToken || null;
        this.channelVideosCount += 6;
        this.renderChannelVideos();
      } else {
        this.channelContinuationToken = null;
        this.renderChannelVideos();
      }
    } catch (e) {
      console.error('Error fetching more channel videos:', e);
    } finally {
      this.isLoadingMoreChannelVideos = false;
    }
  }

  renderChannelVideos() {
    if (!this.ytChannelVideosGrid || !this.channelVideos) return;
    const toShow = this.channelVideos.slice(0, this.channelVideosCount);
    this.renderVideoGrid(this.ytChannelVideosGrid, toShow, 'channel');

    const moreWrap = document.getElementById('ytChannelMoreWrap');
    const moreBtn = document.getElementById('ytChannelLoadMoreBtn');

    const remainingCached = this.channelVideos.length - toShow.length;
    const hasMore = remainingCached > 0 || Boolean(this.channelContinuationToken);

    if (moreWrap && moreBtn) {
      if (hasMore) {
        moreWrap.style.display = 'block';
        if (remainingCached > 0) {
          moreBtn.textContent = `더보기 (${remainingCached}개 남음) ▼`;
          moreBtn.onclick = () => {
            this.channelVideosCount += 6;
            this.renderChannelVideos();
          };
        } else {
          moreBtn.textContent = '더 많은 영상 불러오기 ▼';
          moreBtn.onclick = () => {
            this.loadMoreChannelVideosFromApi();
          };
        }
      } else {
        moreWrap.style.display = 'none';
      }
    }
  }

  closeChannelView() {
    if (this.ytChannelViewSection) {
      this.ytChannelViewSection.style.display = 'none';
    }
    const moreWrap = document.getElementById('ytChannelMoreWrap');
    if (moreWrap) moreWrap.style.display = 'none';
    this.currentChannelView = null;
  }

  // ================= Bookmarks (채널 & 영상 즐겨찾기) =================
  async loadBookmarks() {
    try {
      const res = await fetch('/api/youtube/bookmarks');
      const data = await res.json();
      if (data && data.bookmarks) {
        this.bookmarks = data.bookmarks;
        this.updateTotalBookmarksBadge();
        if (this.bookmarksSegment === 'channels') this.renderBookmarks();
      }
    } catch (e) {
      console.error('Load bookmarks error:', e);
    }
  }

  updateTotalBookmarksBadge() {
    const total = (this.bookmarks ? this.bookmarks.length : 0) + (this.videoBookmarks ? this.videoBookmarks.length : 0);
    if (this.ytBookmarksBadge) this.ytBookmarksBadge.textContent = total;
    const chCount = document.getElementById('yt-bm-channels-count');
    if (chCount) chCount.textContent = this.bookmarks ? this.bookmarks.length : 0;
  }

  switchBookmarksSegment(segment) {
    this.bookmarksSegment = segment;
    const btnChannels = document.getElementById('ytBmChannelsTabBtn');
    const btnVideos = document.getElementById('ytBmVideosTabBtn');
    const secChannels = document.getElementById('ytBookmarksChannelSection');
    const secVideos = document.getElementById('ytBookmarksVideoSection');

    if (btnChannels) btnChannels.classList.toggle('active', segment === 'channels');
    if (btnVideos) btnVideos.classList.toggle('active', segment === 'videos');
    if (secChannels) secChannels.style.display = segment === 'channels' ? 'block' : 'none';
    if (secVideos) secVideos.style.display = segment === 'videos' ? 'block' : 'none';

    if (segment === 'videos') {
      this.renderVideoBookmarks();
    } else {
      this.renderBookmarks();
    }
  }

  isBookmarked(channelId) {
    if (!channelId) return false;
    return this.bookmarks.some(b => b.channelId === channelId);
  }

  async toggleBookmark(channelId, channelName, thumbnail = '', subs = '') {
    const isBm = this.isBookmarked(channelId);
    if (isBm) {
      await this.removeBookmark(channelId);
    } else {
      await this.addBookmark(channelId, channelName, thumbnail, subs);
    }
  }

  async addBookmark(channelId, channelName, thumbnail = '', subs = '') {
    try {
      const res = await fetch('/api/youtube/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_id: channelId,
          channel_name: channelName,
          thumbnail: thumbnail,
          subscriber_count: subs
        })
      });
      const data = await res.json();
      if (data.success) {
        if (window.app) window.app.showToast(`'${channelName || channelId}' 채널을 즐겨찾기에 추가했습니다!`, 'success');
        await this.loadBookmarks();
        if (this.currentSubTab === 'recommendations') this.loadRecommendations(false);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async removeBookmark(channelId) {
    try {
      const res = await fetch(`/api/youtube/bookmarks/${encodeURIComponent(channelId)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        if (window.app) window.app.showToast('즐겨찾기에서 채널을 삭제했습니다.', 'info');
        await this.loadBookmarks();
      }
    } catch (e) {
      console.error(e);
    }
  }

  renderBookmarks() {
    if (!this.ytBookmarksGrid) return;
    if (this.bookmarks.length === 0) {
      if (this.ytBookmarksEmpty) this.ytBookmarksEmpty.style.display = 'flex';
      this.ytBookmarksGrid.innerHTML = '';
      return;
    }

    if (this.ytBookmarksEmpty) this.ytBookmarksEmpty.style.display = 'none';

    let html = '';
    this.bookmarks.forEach(bm => {
      const nameEsc = escapeHtml(bm.channelName);
      const idEsc = escapeHtml(bm.channelId);

      html += `
        <div class="yt-bookmark-card" onclick="window.youtubeUI.openChannelView('${idEsc}', '${nameEsc}', '${bm.thumbnail || ''}', '${bm.subscriberCount || ''}')">
          <img class="yt-bookmark-avatar" src="${bm.thumbnail || './static/img/favicon.png'}" onerror="this.src='./static/img/favicon.png'" alt="${nameEsc}">
          <div class="yt-bookmark-body">
            <div class="yt-bookmark-name" title="${nameEsc}">${nameEsc}</div>
            <div class="yt-bookmark-subs">${escapeHtml(bm.subscriberCount || '즐겨찾기 채널')}</div>
            <div class="yt-bookmark-date">${escapeHtml(bm.addedAt ? bm.addedAt.substring(0, 10) + ' 추가' : '')}</div>
          </div>
          <div class="yt-bookmark-actions" onclick="event.stopPropagation();">
            <button class="btn btn-sm btn-secondary" onclick="window.youtubeUI.openChannelView('${idEsc}', '${nameEsc}', '${bm.thumbnail || ''}', '${bm.subscriberCount || ''}')" title="채널 최신 영상 목록 보기">
              영상 목록
            </button>
            <button class="btn btn-sm btn-ghost" onclick="window.youtubeUI.removeBookmark('${idEsc}')" title="즐겨찾기 삭제" style="color: #f87171;">
              삭제
            </button>
          </div>
        </div>
      `;
    });

    this.ytBookmarksGrid.innerHTML = html;
  }

  // ================= Video Bookmarks (영상 즐겨찾기 - Requirement 4) =================
  async loadVideoBookmarks() {
    try {
      const res = await fetch('/api/youtube/video_bookmarks');
      const data = await res.json();
      if (data && data.bookmarks) {
        this.videoBookmarks = data.bookmarks;
        const countBadge = document.getElementById('yt-bm-videos-count');
        if (countBadge) countBadge.textContent = this.videoBookmarks.length;
        this.updateTotalBookmarksBadge();
        if (this.bookmarksSegment === 'videos') this.renderVideoBookmarks();
      }
    } catch (e) {
      console.warn('loadVideoBookmarks error:', e);
    }
  }

  isVideoBookmarked(videoId) {
    if (!videoId) return false;
    return this.videoBookmarks.some(v => (v.videoId || v.id) === videoId);
  }

  async toggleVideoBookmark(videoId, title, channelName = '', channelId = '', thumbnail = '', duration = '') {
    const isBm = this.isVideoBookmarked(videoId);
    if (isBm) {
      try {
        const res = await fetch(`/api/youtube/video_bookmarks/${encodeURIComponent(videoId)}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          if (window.app) window.app.showToast('즐겨찾기 영상에서 삭제했습니다.', 'info');
          await this.loadVideoBookmarks();
          this.refreshAllVisibleGrids();
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      try {
        const res = await fetch('/api/youtube/video_bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            video_id: videoId,
            title: title,
            channel_name: channelName,
            channel_id: channelId,
            thumbnail: thumbnail,
            duration: duration
          })
        });
        const data = await res.json();
        if (data.success) {
          if (window.app) window.app.showToast('즐겨찾기 영상에 추가했습니다! ⭐', 'success');
          await this.loadVideoBookmarks();
          this.refreshAllVisibleGrids();
        }
      } catch (e) {
        console.error(e);
      }
    }
  }

  renderVideoBookmarks() {
    const grid = document.getElementById('ytVideoBookmarksGrid');
    const empty = document.getElementById('ytVideoBookmarksEmpty');
    if (!grid) return;

    if (!this.videoBookmarks || this.videoBookmarks.length === 0) {
      if (empty) empty.style.display = 'flex';
      grid.innerHTML = '';
      return;
    }
    if (empty) empty.style.display = 'none';
    this.renderVideoGrid(grid, this.videoBookmarks, 'bookmarks');
  }

  // ================= Watch Later (나중에 볼 영상 - Requirement 3) =================
  async loadWatchLater() {
    try {
      const res = await fetch('/api/youtube/watch_later');
      const data = await res.json();
      if (data && data.watchLater) {
        this.watchLater = data.watchLater;
        const badge = document.getElementById('yt-watchlater-badge');
        if (badge) badge.textContent = this.watchLater.length;
        const countDesc = document.getElementById('ytWatchLaterCountDesc');
        if (countDesc) countDesc.textContent = `나중에 볼 영상 (${this.watchLater.length}개)`;
        if (this.currentSubTab === 'watchlater') this.renderWatchLater();
      }
    } catch (e) {
      console.warn('loadWatchLater error:', e);
    }
  }

  isWatchLater(videoId) {
    if (!videoId) return false;
    return this.watchLater.some(v => (v.videoId || v.id) === videoId);
  }

  async toggleWatchLater(videoId, title, channelName = '', channelId = '', thumbnail = '', duration = '') {
    const isWl = this.isWatchLater(videoId);
    if (isWl) {
      try {
        const res = await fetch(`/api/youtube/watch_later/${encodeURIComponent(videoId)}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          if (window.app) window.app.showToast('나중에 볼 영상에서 삭제했습니다.', 'info');
          await this.loadWatchLater();
          this.refreshAllVisibleGrids();
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      try {
        const res = await fetch('/api/youtube/watch_later', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            video_id: videoId,
            title: title,
            channel_name: channelName,
            channel_id: channelId,
            thumbnail: thumbnail,
            duration: duration
          })
        });
        const data = await res.json();
        if (data.success) {
          if (window.app) window.app.showToast('나중에 볼 영상에 담았습니다! 🕒', 'success');
          await this.loadWatchLater();
          this.refreshAllVisibleGrids();
        }
      } catch (e) {
        console.error(e);
      }
    }
  }

  async clearWatchLater() {
    if (!this.watchLater || this.watchLater.length === 0) return;
    if (!confirm('나중에 볼 영상 목록을 모두 비우시겠습니까?')) return;
    try {
      const res = await fetch('/api/youtube/watch_later/clear', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        if (window.app) window.app.showToast('나중에 볼 영상을 모두 비웠습니다.', 'info');
        await this.loadWatchLater();
        this.refreshAllVisibleGrids();
      }
    } catch (e) {
      console.error(e);
    }
  }

  renderWatchLater() {
    const grid = document.getElementById('ytWatchLaterGrid');
    const empty = document.getElementById('ytWatchLaterEmpty');
    if (!grid) return;

    if (!this.watchLater || this.watchLater.length === 0) {
      if (empty) empty.style.display = 'flex';
      grid.innerHTML = '';
      return;
    }
    if (empty) empty.style.display = 'none';
    this.renderVideoGrid(grid, this.watchLater, 'watchlater');
  }

  playAllWatchLater() {
    if (!this.watchLater || this.watchLater.length === 0) {
      if (window.app) window.app.showToast('재생할 나중에 볼 영상이 없습니다.', 'warning');
      return;
    }
    const first = this.watchLater[0];
    const firstVid = first.videoId || first.id;
    if (!window.multiview) return;

    window.multiview.addYouTubeToFirstAvailableSlot(
      firstVid,
      first.title,
      first.channelName || 'YouTube',
      first.channelId || '',
      first.thumbnail || '',
      true,
      {
        playlistId: 'custom_watch_later',
        playlistTitle: '나중에 볼 영상 모음',
        items: this.watchLater,
        currentIndex: 0
      }
    );
  }

  // ================= Custom Playlists Management (Requirement 2) =================
  async loadCustomPlaylists() {
    try {
      const res = await fetch('/api/youtube/custom_playlists');
      const data = await res.json();
      if (data && data.playlists) {
        this.customPlaylists = data.playlists;
        const badge = document.getElementById('yt-playlists-badge');
        if (badge) badge.textContent = this.customPlaylists.length;
        if (this.currentSubTab === 'playlists') this.renderCustomPlaylists();
      }
    } catch (e) {
      console.warn('loadCustomPlaylists error:', e);
    }
  }

  renderCustomPlaylists() {
    const grid = document.getElementById('ytPlaylistsGrid');
    const empty = document.getElementById('ytPlaylistsEmpty');
    if (!grid) return;

    if (!this.customPlaylists || this.customPlaylists.length === 0) {
      if (empty) empty.style.display = 'flex';
      grid.innerHTML = '';
      return;
    }
    if (empty) empty.style.display = 'none';

    let html = '';
    this.customPlaylists.forEach(pl => {
      const plIdEsc = escapeHtml(pl.id);
      const titleEsc = escapeHtml(pl.title);
      const descEsc = escapeHtml(pl.description || '');
      const count = pl.videos ? pl.videos.length : 0;
      const thumb = (pl.videos && pl.videos[0] && pl.videos[0].thumbnail) ? pl.videos[0].thumbnail : './static/img/favicon.png';

      html += `
        <div class="yt-playlist-card" onclick="window.youtubeUI.playPlaylistInSlot('${plIdEsc}', true)">
          <div class="yt-pl-card-thumb-wrap">
            <img class="yt-pl-card-thumb" src="${escapeHtml(thumb)}" onerror="this.src='./static/img/favicon.png'" alt="">
            <div class="yt-pl-count-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>
              <span>${count}개</span>
            </div>
          </div>
          <div class="yt-pl-card-body">
            <div class="yt-pl-card-title">${titleEsc}</div>
            ${descEsc ? `<div class="yt-pl-card-desc">${descEsc}</div>` : ''}
            <div class="yt-pl-card-actions" onclick="event.stopPropagation()">
              <button class="btn btn-sm btn-primary" onclick="window.youtubeUI.playPlaylistInSlot('${plIdEsc}', true)" style="display: flex; align-items: center; gap: 4px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                <span>전체 재생</span>
              </button>
              <button class="btn btn-sm btn-ghost" onclick="window.youtubeUI.deleteCustomPlaylist('${plIdEsc}')" style="margin-left: auto; color: #f87171;" title="재생목록 삭제">
                삭제
              </button>
            </div>
          </div>
        </div>
      `;
    });
    grid.innerHTML = html;
  }

  promptCreatePlaylist() {
    const modal = document.getElementById('ytCreatePlaylistModal');
    const inputTitle = document.getElementById('ytNewPlaylistTitle');
    const inputDesc = document.getElementById('ytNewPlaylistDesc');
    if (inputTitle) inputTitle.value = '';
    if (inputDesc) inputDesc.value = '';
    if (modal) {
      modal.classList.add('active');
      if (inputTitle) inputTitle.focus();
    }
  }

  async confirmCreatePlaylist() {
    const inputTitle = document.getElementById('ytNewPlaylistTitle');
    const inputDesc = document.getElementById('ytNewPlaylistDesc');
    const title = inputTitle ? inputTitle.value.trim() : '';
    const desc = inputDesc ? inputDesc.value.trim() : '';
    if (!title) {
      if (window.app) window.app.showToast('재생목록 제목을 입력하세요.', 'warning');
      return;
    }
    try {
      const res = await fetch('/api/youtube/custom_playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: desc })
      });
      const data = await res.json();
      if (data && data.success) {
        if (window.app) window.app.showToast(`'${title}' 재생목록을 생성했습니다!`, 'success');
        const modal = document.getElementById('ytCreatePlaylistModal');
        if (modal) modal.classList.remove('active');
        await this.loadCustomPlaylists();
      }
    } catch (e) {
      console.error(e);
    }
  }

  promptImportPlaylist() {
    const modal = document.getElementById('ytImportPlaylistModal');
    const inputUrl = document.getElementById('ytImportPlaylistUrl');
    if (inputUrl) inputUrl.value = '';
    if (modal) {
      modal.classList.add('active');
      if (inputUrl) inputUrl.focus();
    }
  }

  async confirmImportPlaylist() {
    const inputUrl = document.getElementById('ytImportPlaylistUrl');
    const url = inputUrl ? inputUrl.value.trim() : '';
    if (!url) {
      if (window.app) window.app.showToast('유튜브 재생목록 링크를 입력하세요.', 'warning');
      return;
    }
    const submitBtn = document.getElementById('ytImportPlaylistSubmitBtn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '가져오는 중...';
    }
    try {
      const res = await fetch('/api/youtube/custom_playlists/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (data && data.success) {
        if (window.app) window.app.showToast(`'${data.playlist ? data.playlist.title : '재생목록'}' 가져오기 완료! (${data.importedCount || 0}개 영상)`, 'success');
        const modal = document.getElementById('ytImportPlaylistModal');
        if (modal) modal.classList.remove('active');
        await this.loadCustomPlaylists();
      } else {
        if (window.app) window.app.showToast(data.detail || data.error || '재생목록을 가져오지 못했습니다.', 'error');
      }
    } catch (e) {
      console.error(e);
      if (window.app) window.app.showToast('재생목록을 가져오는 중 오류가 발생했습니다.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '가져오기';
      }
    }
  }

  async deleteCustomPlaylist(playlistId) {
    if (!confirm('이 재생목록을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/youtube/custom_playlists/${encodeURIComponent(playlistId)}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        if (window.app) window.app.showToast('재생목록을 삭제했습니다.', 'info');
        await this.loadCustomPlaylists();
      }
    } catch (e) {
      console.error(e);
    }
  }

  promptAddToPlaylist(videoData) {
    this._targetVideoForPlaylist = videoData;
    const modal = document.getElementById('ytAddToPlaylistModal');
    const titleEl = document.getElementById('ytAddToPlTargetVideoInfo');
    const listEl = document.getElementById('ytAddToPlList');

    if (titleEl) titleEl.textContent = videoData.title || '선택된 영상';
    if (listEl) {
      if (!this.customPlaylists || this.customPlaylists.length === 0) {
        listEl.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 12px;">아직 생성된 재생목록이 없습니다. 하단의 [+ 새 재생목록]을 눌러 생성해보세요.</div>';
      } else {
        listEl.innerHTML = this.customPlaylists.map(pl => {
          const hasVideo = pl.videos && pl.videos.some(v => (v.videoId || v.id) === (videoData.videoId || videoData.id));
          return `
            <div class="slot-pl-item" onclick="window.youtubeUI.confirmAddToPlaylist('${escapeHtml(pl.id)}')" style="justify-content: space-between;">
              <span style="font-weight: 600; color: #fff;">${escapeHtml(pl.title)} (${pl.videos ? pl.videos.length : 0}개)</span>
              ${hasVideo ? '<span style="font-size: 11px; color: var(--accent-color);">이미 추가됨 ✓</span>' : '<span style="font-size: 11px; color: #38bdf8;">+ 추가</span>'}
            </div>
          `;
        }).join('');
      }
    }

    if (modal) modal.classList.add('active');
  }

  async confirmAddToPlaylist(playlistId) {
    if (!this._targetVideoForPlaylist) return;
    const v = this._targetVideoForPlaylist;
    const vidId = v.videoId || v.id;
    try {
      const res = await fetch(`/api/youtube/custom_playlists/${encodeURIComponent(playlistId)}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: vidId,
          title: v.title,
          channel_name: v.channelName || '',
          duration: v.duration || '',
          thumbnail: v.thumbnail || ''
        })
      });
      const data = await res.json();
      if (data.success) {
        if (window.app) window.app.showToast('재생목록에 영상을 추가했습니다! 📑', 'success');
        const modal = document.getElementById('ytAddToPlaylistModal');
        if (modal) modal.classList.remove('active');
        await this.loadCustomPlaylists();
      }
    } catch (e) {
      console.error(e);
    }
  }

  playPlaylistInSlot(playlistId, isCustom = true) {
    if (!window.multiview) return;

    if (isCustom) {
      const pl = this.customPlaylists.find(p => p.id === playlistId);
      if (!pl || !pl.videos || pl.videos.length === 0) {
        if (window.app) window.app.showToast('재생목록에 영상이 없습니다.', 'warning');
        return;
      }
      const first = pl.videos[0];
      const firstVid = first.videoId || first.id;
      window.multiview.addYouTubeToFirstAvailableSlot(
        firstVid,
        first.title,
        first.channelName || 'YouTube',
        '',
        first.thumbnail || '',
        true,
        {
          playlistId: pl.id,
          playlistTitle: pl.title,
          items: pl.videos,
          currentIndex: 0
        }
      );
    } else {
      // YouTube native playlist (e.g. from algorithm recommendation)
      fetch(`/api/youtube/playlist/${encodeURIComponent(playlistId)}`)
        .then(r => r.json())
        .then(data => {
          if (data && data.success && data.videos && data.videos.length > 0) {
            const first = data.videos[0];
            const firstVid = first.videoId || first.id;
            window.multiview.addYouTubeToFirstAvailableSlot(
              firstVid,
              first.title,
              first.channelName || 'YouTube',
              '',
              first.thumbnail || '',
              true,
              {
                playlistId: playlistId,
                playlistTitle: data.title || 'YouTube 재생목록',
                items: data.videos,
                currentIndex: 0
              }
            );
          } else {
            if (window.app) window.app.showToast('재생목록 정보를 불러올 수 없습니다.', 'error');
          }
        })
        .catch(e => {
          console.error(e);
          if (window.app) window.app.showToast('재생목록 로드 중 오류가 발생했습니다.', 'error');
        });
    }
  }

  refreshAllVisibleGrids() {
    if (this.currentSubTab === 'recommendations') {
      this.renderVideoGrid(this.ytRecsGrid, this.recommendations, 'recommendations');
    } else if (this.currentSubTab === 'search') {
      this.renderVideoGrid(this.ytSearchGrid, this.searchResults, 'search');
    } else if (this.currentSubTab === 'bookmarks') {
      if (this.bookmarksSegment === 'videos') this.renderVideoBookmarks();
      else this.renderBookmarks();
    } else if (this.currentSubTab === 'watchlater') {
      this.renderWatchLater();
    }
  }

  // ================= Watch History (시청 기록) =================
  async loadHistory() {
    try {
      const res = await fetch('/api/youtube/history?limit=100');
      const data = await res.json();
      if (data && data.history) {
        this.history = data.history;
        this.renderHistory();
      }
    } catch (e) {
      console.error('Load history error:', e);
    }
  }

  async recordHistory(videoId, title, channelName = '', channelId = '', thumbnail = '', duration = '') {
    try {
      await fetch('/api/youtube/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: videoId,
          title: title,
          channel_name: channelName,
          channel_id: channelId,
          thumbnail: thumbnail,
          duration: duration
        })
      });
    } catch (e) {
      console.warn('Record history error:', e);
    }
  }

  async removeHistoryEntry(videoId) {
    try {
      const res = await fetch(`/api/youtube/history/${encodeURIComponent(videoId)}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        this.history = this.history.filter(h => h.videoId !== videoId);
        this.renderHistory();
        if (window.app) window.app.showToast('시청 기록에서 삭제되었습니다.', 'info');
      }
    } catch (e) {
      console.error(e);
    }
  }

  async clearHistory() {
    if (!confirm('모든 유튜브 시청 기록을 삭제하시겠습니까? (추천 알고리즘에 반영됩니다)')) return;
    try {
      const res = await fetch('/api/youtube/history/clear', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        this.history = [];
        this.renderHistory();
        if (window.app) window.app.showToast('시청 기록이 모두 삭제되었습니다.', 'info');
        this.loadRecommendations(true);
      }
    } catch (e) {
      console.error(e);
    }
  }

  renderHistory() {
    if (!this.ytHistoryGrid) return;
    if (this.history.length === 0) {
      if (this.ytHistoryEmpty) this.ytHistoryEmpty.style.display = 'flex';
      this.ytHistoryGrid.innerHTML = '';
      return;
    }

    if (this.ytHistoryEmpty) this.ytHistoryEmpty.style.display = 'none';
    if (!this._videoCache) this._videoCache = {};

    let html = '';
    this.history.forEach((h, idx) => {
      const vid = h.videoId || `hist_${idx}_${Date.now()}`;
      const vKey = String(vid);
      this._videoCache[vKey] = h;

      const titleEsc = escapeHtml(h.title);
      const nameEsc = escapeHtml(h.channelName || 'YouTube');
      const vidEsc = escapeHtml(h.videoId);

      html += `
        <div class="yt-history-card">
          <div class="yt-history-thumb" onclick="window.youtubeUI.playHistoryItem('${vKey}')">
            <img src="${h.thumbnail || `https://i.ytimg.com/vi/${vidEsc}/hqdefault.jpg`}" onerror="this.src='./static/img/favicon.png'" alt="${titleEsc}">
            ${h.duration ? `<span class="yt-badge-duration">${escapeHtml(h.duration)}</span>` : ''}
            <div class="yt-thumb-hover-overlay">
              <span class="yt-play-icon">▶</span>
            </div>
          </div>
          <div class="yt-history-info">
            <div class="yt-history-title" onclick="window.youtubeUI.playHistoryItem('${vKey}')" title="${titleEsc}">
              ${titleEsc}
            </div>
            <div class="yt-history-channel" onclick="window.youtubeUI.openChannelFromVideo(event, '${vKey}')" title="${nameEsc}">
              ${nameEsc}
            </div>
            <div class="yt-history-meta">
              <span>${escapeHtml(h.watchedAt || '최근')}</span>
              ${h.watchCount > 1 ? `<span class="badge" style="background: rgba(239, 68, 68, 0.2); color: #f87171; font-size: 10px;">${h.watchCount}회 시청</span>` : ''}
            </div>
          </div>
          <div class="yt-history-actions">
            <button class="btn btn-sm btn-primary" onclick="window.youtubeUI.playHistoryItem('${vKey}')" title="멀티뷰 재생">
              ▶ 재생
            </button>
            <button class="btn btn-sm btn-ghost" onclick="window.youtubeUI.removeHistoryEntry('${vidEsc}')" title="기록에서 삭제">
              ✕
            </button>
          </div>
        </div>
      `;
    });

    this.ytHistoryGrid.innerHTML = html;
  }

  playHistoryItem(key) {
    const h = this._videoCache && this._videoCache[key];
    if (!h) return;
    this.playInMultiview(h.videoId, h.title, h.channelName, h.channelId || '', h.thumbnail || '', h.duration || '', true);
  }

  // ================= Generic Video Cards Grid Renderer =================
  renderVideoGrid(container, videos, context = 'default') {
    if (!container) return;
    if (!videos || videos.length === 0) {
      container.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted); grid-column: 1/-1;">표시할 영상이 없습니다.</div>';
      return;
    }

    if (!this._videoCache) this._videoCache = {};

    let html = '';
    videos.forEach((v, idx) => {
      const vid = v.videoId || v.id || `v_${context}_${idx}_${Date.now()}`;
      const vKey = String(vid);
      this._videoCache[vKey] = v;

      const vidEsc = escapeHtml(vid);
      const titleEsc = escapeHtml(v.title || '');
      const nameEsc = escapeHtml(v.channelName || 'YouTube');
      const chIdEsc = escapeHtml(v.channelId || '');
      const thumbEsc = escapeHtml(v.thumbnail || `https://i.ytimg.com/vi/${vidEsc}/hqdefault.jpg`);
      const durEsc = escapeHtml(v.duration || '');
      const isPl = !!(v.isPlaylist || v.playlistId);
      const isBm = this.isVideoBookmarked(vidEsc);
      const isWl = this.isWatchLater(vidEsc);

      let reasonBadge = '';
      if (v.algorithmBadge) {
        reasonBadge = `<div class="yt-algo-badge">${escapeHtml(v.algorithmBadge)}</div>`;
      } else if (v.recReason) {
        reasonBadge = `<div class="yt-rec-reason">${escapeHtml(v.recReason)}</div>`;
      }

      html += `
        <div class="yt-video-card" 
             onclick="window.youtubeUI.onCardClick(event, '${vKey}')"
             oncontextmenu="window.youtubeUI.onCardRightClick(event, '${vKey}')"
             title="${isPl ? '클릭 시 재생목록을 슬롯에 연속 재생' : '좌클릭: 멀티뷰 이동 후 재생 | 우클릭: 백그라운드 슬롯 추가'}">
          <div class="yt-video-thumb-wrap">
            <img class="yt-video-thumb" src="${thumbEsc}" onerror="this.src='./static/img/favicon.png'" alt="${titleEsc}" loading="lazy">
            ${durEsc ? `<span class="yt-badge-duration">${durEsc}</span>` : ''}
            ${v.isWatched ? `<span class="yt-badge-watched">시청함</span>` : ''}
            ${v.isLive ? `<span class="card-badge-live" style="position: absolute; top: 6px; left: 6px; padding: 2px 6px;">LIVE</span>` : ''}
            ${isPl ? `<span class="yt-badge-playlist">📑 재생목록</span>` : ''}

            <!-- Quick Action Buttons on Hover (⭐, 🕒, 📑) -->
            ${!isPl ? `
              <div class="yt-card-quick-actions" onclick="event.stopPropagation()">
                <button class="yt-quick-btn ${isBm ? 'active-star' : ''}" onclick="window.youtubeUI.toggleVideoBookmarkById('${vKey}')" title="${isBm ? '영상 즐겨찾기 해제' : '영상 즐겨찾기 (★)'}">
                  ${isBm ? '★' : '☆'}
                </button>
                <button class="yt-quick-btn ${isWl ? 'active-wl' : ''}" onclick="window.youtubeUI.toggleWatchLaterById('${vKey}')" title="${isWl ? '나중에 볼 영상에서 삭제' : '나중에 볼 영상에 저장 (🕒)'}">
                  🕒
                </button>
                <button class="yt-quick-btn" onclick="window.youtubeUI.promptAddToPlaylistById('${vKey}')" title="재생목록에 추가 (📑)">
                  📑
                </button>
              </div>
            ` : ''}

            <div class="yt-thumb-hover-overlay">
              <span class="yt-play-icon">▶</span>
              <span style="font-size: 11px; font-weight: 700; color: #fff;">${isPl ? '재생목록 전체 연속 재생' : '좌클릭: 재생 / 우클릭: 슬롯추가'}</span>
            </div>
          </div>

          <div class="yt-video-body">
            ${reasonBadge}
            <div class="yt-video-title" title="${titleEsc}">
              ${titleEsc}
            </div>

            <div class="yt-video-channel-row">
              <span class="yt-video-channel" onclick="event.stopPropagation(); window.youtubeUI.openChannelFromVideo(event, '${vKey}')" title="${nameEsc}">
                ${nameEsc}
              </span>
              ${chIdEsc ? `
                <button class="yt-channel-mini-star" onclick="event.stopPropagation(); window.youtubeUI.toggleBookmark('${chIdEsc}', '${nameEsc}', '', '')" title="채널 즐겨찾기">
                  ${this.isBookmarked(chIdEsc) ? '★' : '☆'}
                </button>
              ` : ''}
            </div>

            <div class="yt-video-meta">
              ${v.views ? `<span>${escapeHtml(v.views)}</span>` : ''}
              ${v.published ? `<span>• ${escapeHtml(v.published)}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  onCardClick(event, key) {
    if (event && event.target && typeof event.target.closest === 'function' && event.target.closest('button, .yt-video-channel, .yt-channel-mini-star, .yt-card-quick-actions')) return;
    const v = this._videoCache && this._videoCache[key];
    if (!v) return;
    if (v.isPlaylist || v.playlistId) {
      this.playPlaylistInSlot(v.playlistId || v.videoId, false);
    } else {
      this.playInMultiview(v.videoId || v.id, v.title, v.channelName, v.channelId || '', v.thumbnail || '', v.duration || '', true);
    }
  }

  onCardRightClick(event, key) {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    if (event && event.target && typeof event.target.closest === 'function' && event.target.closest('button, .yt-video-channel, .yt-channel-mini-star, .yt-card-quick-actions')) return;
    const v = this._videoCache && this._videoCache[key];
    if (!v) return;
    if (v.isPlaylist || v.playlistId) {
      this.playPlaylistInSlot(v.playlistId || v.videoId, false);
    } else {
      this.playInMultiview(v.videoId || v.id, v.title, v.channelName, v.channelId || '', v.thumbnail || '', v.duration || '', false);
    }
  }

  openChannelFromVideo(event, key) {
    if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
    const v = this._videoCache && this._videoCache[key];
    if (!v) return;
    this.openChannelView(v.channelId || '', v.channelName || '', v.channelThumbnail || '', '');
  }

  toggleVideoBookmarkById(key) {
    const v = this._videoCache && this._videoCache[key];
    if (!v) return;
    const vid = v.videoId || v.id;
    this.toggleVideoBookmark(vid, v.title, v.channelName, v.channelId || '', v.thumbnail || '', v.duration || '');
  }

  toggleWatchLaterById(key) {
    const v = this._videoCache && this._videoCache[key];
    if (!v) return;
    const vid = v.videoId || v.id;
    this.toggleWatchLater(vid, v.title, v.channelName, v.channelId || '', v.thumbnail || '', v.duration || '');
  }

  promptAddToPlaylistById(key) {
    const v = this._videoCache && this._videoCache[key];
    if (!v) return;
    this.promptAddToPlaylist({
      videoId: v.videoId || v.id,
      title: v.title || '',
      channelName: v.channelName || '',
      duration: v.duration || '',
      thumbnail: v.thumbnail || ''
    });
  }

  // ================= Playback in Multiview =================
  handleCardClick(event, videoId, title, channelName, channelId = '', thumbnail = '', duration = '') {
    if (event && event.target && typeof event.target.closest === 'function' && event.target.closest('button, .yt-video-channel, .yt-card-quick-actions')) return;
    this.playInMultiview(videoId, title, channelName, channelId, thumbnail, duration, true);
  }

  handleCardRightClick(event, videoId, title, channelName, channelId = '', thumbnail = '', duration = '') {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    if (event && event.target && typeof event.target.closest === 'function' && event.target.closest('button, .yt-video-channel, .yt-card-quick-actions')) return;
    this.playInMultiview(videoId, title, channelName, channelId, thumbnail, duration, false);
  }

  playInMultiview(videoId, title, channelName, channelId = '', thumbnail = '', duration = '', switchTab = true) {
    if (!window.multiview) return;

    // Record watch history automatically!
    this.recordHistory(videoId, title, channelName, channelId, thumbnail, duration);

    // If a target slot was selected via promptAddStream
    if (window.multiview.targetSlotIndex !== null) {
      const idx = window.multiview.targetSlotIndex;
      window.multiview.cancelTargetSlot();
      window.multiview.loadYouTubeIntoSlot(idx, videoId, title, channelName, channelId, thumbnail, switchTab);
    } else {
      // Find first empty slot or add new slot
      window.multiview.addYouTubeToFirstAvailableSlot(videoId, title, channelName, channelId, thumbnail, switchTab);
    }
  }

  addToMultiviewSlot(videoId, title, channelName, channelId = '', thumbnail = '', duration = '') {
    this.playInMultiview(videoId, title, channelName, channelId, thumbnail, duration, true);
  }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  window.youtubeUI = new YouTubeUI();
});
