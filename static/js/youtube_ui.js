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

const YT_SVGS = {
  starOutline: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  starFilled: '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  clock: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  playlistAdd: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="15" y2="18"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/><line x1="19" y1="15" x2="19" y2="21"/><line x1="16" y1="18" x2="22" y2="18"/></svg>',
  playlistBadge: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>',
  playTriangle: '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
  closeX: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  chevronRight: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
  chevronDown: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>'
};

class YouTubeUI {
  constructor() {
    this.currentSubTab = 'recommendations'; // 'recommendations' | 'bookmarks' | 'shorts' | 'playlists' | 'watchlater' | 'history'
    this.activeKeywords = [];
    this.recommendations = [];
    this.searchResults = [];
    this.channels = [];
    this.bookmarks = [];
    this.videoBookmarks = [];
    this.customPlaylists = [];
    this.watchLater = [];
    this.bookmarksSegment = 'channels'; // 'channels' | 'videos'
    this.keywordsCollapsed = true; // 기본 접힘 상태 (검색창 왼쪽 아이콘으로 토글)
    this.isHomeSearchActive = false;
    this._targetVideoForPlaylist = null;
    this.history = [];
    this._videoCache = {};
    this.currentChannelView = null; // When viewing a channel's uploads

    // Shorts Feed state
    this.shortsPlayer = null;
    this.shortsFeedSeed = '';
    this.shortsFeedChannelId = '';
    this.shortsFeedLabel = '맞춤 알고리즘 쇼츠';
    this.shortsPage = 0;

    this.initElements();
    this.bindEvents();
    this.loadKeywords();
    this.loadBookmarks();
    this.loadVideoBookmarks();
    this.loadCustomPlaylists();
    this.loadWatchLater();
    // Defer heavy recommendation DOM/network loading until the YouTube tab is opened
  }

  initElements() {
    // Sub tab buttons
    this.subTabBtns = document.querySelectorAll('.yt-subtab-btn');
    this.subPanes = document.querySelectorAll('.yt-sub-pane');

    // Keyword chips container
    this.ytKeywordsBar = document.getElementById('ytKeywordsBar');
    this.ytAlgorithmToolbar = document.getElementById('ytAlgorithmToolbar');
    this.ytToggleKeywordsBtn = document.getElementById('ytToggleKeywordsBtn');
    this.ytAddKeywordBtn = document.getElementById('ytAddKeywordBtn');
    this.ytAddKeywordInput = document.getElementById('ytAddKeywordInput');
    this.ytAddKeywordForm = document.getElementById('ytAddKeywordForm');
    this.ytResetKeywordsBtn = document.getElementById('ytResetKeywordsBtn');
    this.ytRefreshRecsBtn = document.getElementById('ytRefreshRecsBtn');

    // Search bar
    this.ytSearchInput = document.getElementById('ytSearchInput');
    this.ytSearchBtn = document.getElementById('ytSearchBtn');
    this.ytClearSearchBtn = document.getElementById('ytClearSearchBtn');

    // Home unified sections (Recommendations <-> Search Results)
    this.ytHomeRecsSection = document.getElementById('ytHomeRecsSection');
    this.ytHomeSearchSection = document.getElementById('ytHomeSearchSection');
    this.ytHomeSearchResultLabel = document.getElementById('ytHomeSearchResultLabel');
    this.ytBackToRecsBtn = document.getElementById('ytBackToRecsBtn');

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
        if (this.ytSearchInput) this.ytSearchInput.value = '';
        if (this.ytClearSearchBtn) this.ytClearSearchBtn.style.display = 'none';
        if (this.currentSubTab !== 'recommendations') {
          this.switchSubTab('recommendations', false);
        }
        this.resetHomeToRecommendations({ reloadIfEmpty: false });
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
          this.resetHomeToRecommendations();
          return;
        }
        searchTimeout = setTimeout(() => {
          this.handleSearch(val);
        }, 450);
      });

      this.ytSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          clearTimeout(searchTimeout);
          const val = this.ytSearchInput.value.trim();
          if (!val) {
            this.resetHomeToRecommendations();
          } else {
            this.handleSearch(val);
          }
        }
      });
    }

    if (this.ytSearchBtn) {
      this.ytSearchBtn.addEventListener('click', () => {
        if (!this.ytSearchInput) return;
        const val = this.ytSearchInput.value.trim();
        if (!val) {
          this.resetHomeToRecommendations();
        } else {
          this.handleSearch(val);
        }
      });
    }

    if (this.ytClearSearchBtn) {
      this.ytClearSearchBtn.addEventListener('click', () => {
        if (this.ytSearchInput) this.ytSearchInput.value = '';
        this.ytClearSearchBtn.style.display = 'none';
        this.resetHomeToRecommendations();
      });
    }

    if (this.ytBackToRecsBtn) {
      this.ytBackToRecsBtn.addEventListener('click', () => {
        if (this.ytSearchInput) this.ytSearchInput.value = '';
        if (this.ytClearSearchBtn) this.ytClearSearchBtn.style.display = 'none';
        this.resetHomeToRecommendations();
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
    this.syncKeywordsToolbarVisibility();
    if (this.currentSubTab === 'recommendations') {
      if (this.recommendations.length === 0) {
        this.loadRecommendations();
      }
    } else if (this.currentSubTab === 'shorts') {
      const sp = this.ensureShortsShortformPlayer();
      if (sp) sp.ensureInitialFeedLoaded();
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

  setHomeSearchActive(isSearch, labelText = '') {
    this.isHomeSearchActive = Boolean(isSearch);
    if (this.ytHomeRecsSection) {
      this.ytHomeRecsSection.style.display = this.isHomeSearchActive ? 'none' : 'block';
    }
    if (this.ytHomeSearchSection) {
      this.ytHomeSearchSection.style.display = this.isHomeSearchActive ? 'block' : 'none';
    }
    if (this.ytHomeSearchResultLabel && labelText) {
      this.ytHomeSearchResultLabel.textContent = labelText;
    }
  }

  resetHomeToRecommendations({ reloadIfEmpty = true } = {}) {
    this.setHomeSearchActive(false);
    if (this.ytSearchGrid) this.ytSearchGrid.innerHTML = '';
    if (this.ytSearchChannelsRow) {
      this.ytSearchChannelsRow.innerHTML = '';
      this.ytSearchChannelsRow.style.display = 'none';
    }
    if (this.ytSearchEmpty) this.ytSearchEmpty.style.display = 'none';
    if (reloadIfEmpty && this.recommendations.length === 0) {
      this.loadRecommendations();
    }
  }

  switchSubTab(subTabName, triggerAction = true) {
    if (subTabName === 'search') subTabName = 'recommendations';
    const prevSubTab = this.currentSubTab;
    this.currentSubTab = subTabName;
    this.closeChannelView();

    this.subTabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.subtab === subTabName);
    });

    this.subPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === `yt-${subTabName}-pane`);
    });

    const ytTabPane = document.getElementById('youtube-tab');
    const isShorts = (subTabName === 'shorts');
    if (ytTabPane) {
      ytTabPane.classList.toggle('shorts-mode-active', isShorts);
    }

    // Pause Shorts feed & restore Multiview when leaving shorts subtab
    if (prevSubTab === 'shorts' && subTabName !== 'shorts') {
      this.pauseShortsFeed();
      if (window.app && window.app.currentTab === 'youtube' && window.multiview && typeof window.multiview.leaveShortformTab === 'function') {
        window.multiview.leaveShortformTab('youtube');
      }
    } else if (isShorts && window.app && window.app.currentTab === 'youtube' && window.multiview && typeof window.multiview.enterShortformTab === 'function') {
      window.multiview.enterShortformTab();
    }

    // Sync collapsible algorithm keywords toolbar state
    this.syncKeywordsToolbarVisibility();

    if (!triggerAction) return;

    if (subTabName === 'recommendations') {
      // 홈 메뉴 클릭 시 검색 결과를 닫고 추천 영상 목록으로 복귀
      if (this.ytSearchInput) this.ytSearchInput.value = '';
      if (this.ytClearSearchBtn) this.ytClearSearchBtn.style.display = 'none';
      const hadSearch = this.isHomeSearchActive;
      this.resetHomeToRecommendations({ reloadIfEmpty: false });
      if (this.recommendations.length === 0 || !hadSearch) {
        this.loadRecommendations();
      }
    } else if (subTabName === 'shorts') {
      const sp = this.ensureShortsShortformPlayer();
      if (sp) sp.ensureInitialFeedLoaded();
    } else if (subTabName === 'bookmarks') {
      this.loadBookmarks();
      this.loadVideoBookmarks();
    } else if (subTabName === 'playlists') {
      this.loadCustomPlaylists();
    } else if (subTabName === 'watchlater') {
      this.loadWatchLater();
    } else if (subTabName === 'history') {
      this.loadHistory();
    }
  }

  ensureShortsShortformPlayer() {
    if (this.shortsPlayer) return this.shortsPlayer;
    const host = document.getElementById('ytMobileShortsHost');
    if (!host || !window.MobileShortformPlayer) return null;

    this.shortsPlayer = new window.MobileShortformPlayer({
      host,
      mode: 'youtube_shorts',
      onLoadInitial: async () => {
        await this.loadYoutubeShortsFeed(false);
      },
      onLoadMore: async () => {
        await this.loadYoutubeShortsFeed(true);
      },
      getTopDrawerItems: () => {
        const chips = [
          {
            kind: 'pill',
            id: '__algo__',
            seedType: 'algo',
            label: '내 알고리즘 쇼츠',
            active: !this.shortsFeedSeed && !this.shortsFeedChannelId
          }
        ];
        (this.activeKeywords || []).forEach(kw => {
          chips.push({
            kind: 'pill',
            id: `kw:${kw}`,
            seedType: 'keyword',
            keyword: kw,
            label: `#${kw}`,
            active: this.shortsFeedSeed === kw && !this.shortsFeedChannelId
          });
        });
        (this.bookmarks || []).forEach(ch => {
          if (!ch || !ch.channelId) return;
          chips.push({
            kind: 'avatar',
            id: `ch:${ch.channelId}`,
            seedType: 'channel',
            channelId: ch.channelId,
            label: ch.channelName || '채널',
            avatar: ch.avatar || ch.thumbnail || './static/img/favicon.png',
            active: this.shortsFeedChannelId === ch.channelId
          });
        });
        return {
          activeLabel: this.shortsFeedLabel || '맞춤 알고리즘 쇼츠',
          chips
        };
      },
      onSelectTopChip: async (chip) => {
        if (!chip) return;
        this.shortsPage = 0;
        if (chip.seedType === 'algo') {
          this.shortsFeedSeed = '';
          this.shortsFeedChannelId = '';
          this.shortsFeedLabel = '맞춤 알고리즘 쇼츠';
        } else if (chip.seedType === 'keyword') {
          this.shortsFeedSeed = chip.keyword;
          this.shortsFeedChannelId = '';
          this.shortsFeedLabel = `#${chip.keyword} 쇼츠`;
        } else if (chip.seedType === 'channel') {
          this.shortsFeedSeed = '';
          this.shortsFeedChannelId = chip.channelId;
          this.shortsFeedLabel = `${chip.label} 쇼츠`;
        }
        this.shortsPlayer.showStatus('쇼츠를 불러오는 중...', false);
        await this.loadYoutubeShortsFeed(false);
      },
      onMultiviewInsert: (v) => {
        this.pauseShortsFeed();
        this.playInMultiview(v.videoId, v.title, v.channelName, v.channelId || '', v.thumbnail || '', v.duration || '', true, Boolean(v.isLive));
      },
      onToggleBookmark: async (v) => {
        await this.toggleVideoBookmark(v.videoId, v.title, v.channelName, v.channelId || '', v.thumbnail || '', v.duration || '');
      },
      isBookmarked: (v) => Boolean(v && this.isVideoBookmarked(v.videoId)),
      onLoadComments: async (v) => {
        const res = await fetch(`/api/youtube/comments/${encodeURIComponent(v.videoId)}`);
        const data = await res.json();
        const comments = (data && Array.isArray(data.comments)) ? data.comments.map(c => ({
          userName: c.author || c.userName || '사용자',
          profileUrl: c.avatar || c.authorThumbnail || c.profileUrl || './static/img/favicon.png',
          contents: c.content || c.text || c.contents || '',
          regTime: c.published || c.publishedTime || c.regTime || '',
          likeCount: c.likeCount || c.likes || 0
        })) : [];
        return {
          success: Boolean(data && data.success),
          totalCount: comments.length,
          comments,
          commentUrl: `https://www.youtube.com/shorts/${encodeURIComponent(v.videoId)}`
        };
      },
      onOpenChannel: (v) => {
        if (v && (v.channelId || v.channelName)) {
          this.pauseShortsFeed();
          this.switchSubTab('recommendations', false);
          this.openChannelView(v.channelId || '', v.channelName || '', v.channelImageUrl || v.channelThumbnail || '', '');
        }
      },
      getMoreActions: (v, mediaMeta, player) => {
        const curQ = (mediaMeta && mediaMeta.currentQuality) || 'auto';
        const isWl = this.isWatchLater(v.videoId);
        return [
          {
            icon: 'quality',
            label: '화질 조정',
            isQualityMenu: true,
            getQualities: () => [
              { label: '자동 (최적화)', val: 'default' },
              { label: '1080p FHD', val: '1080' },
              { label: '720p HD', val: '720' },
              { label: '480p', val: '480' },
              { label: '360p', val: '360' }
            ].map(q => ({
              label: q.label,
              active: curQ === q.val,
              onSelect: () => {
                if (mediaMeta) mediaMeta.currentQuality = q.val;
                player.postToActiveIframe({ action: 'setQuality', quality: q.val });
                if (window.app) window.app.showToast(`화질 설정: ${q.label}`, 'success');
                player.closeMoreMenu();
              }
            }))
          },
          {
            icon: 'share',
            label: '링크 공유',
            onClick: () => this.shareShortsLink(v)
          },
          {
            icon: 'clock',
            label: isWl ? '나중에 볼 영상에서 제거' : '나중에 볼 영상 저장',
            onClick: () => this.toggleWatchLater(v.videoId, v.title, v.channelName, v.channelId || '', v.thumbnail || '', v.duration || '')
          },
          {
            icon: 'external',
            label: '채널 영상 보기',
            onClick: () => {
              if (v.channelId || v.channelName) {
                this.pauseShortsFeed();
                this.switchSubTab('recommendations', false);
                this.openChannelView(v.channelId || '', v.channelName || '', v.channelImageUrl || v.channelThumbnail || '', '');
              } else {
                window.open(`https://www.youtube.com/shorts/${encodeURIComponent(v.videoId)}`, '_blank', 'noopener,noreferrer');
              }
            }
          }
        ];
      }
    });
    return this.shortsPlayer;
  }

  async loadYoutubeShortsFeed(append = false) {
    if (!this.shortsPlayer) return;
    if (!append) this.shortsPage = 0;
    try {
      const params = new URLSearchParams({ page: String(this.shortsPage) });
      if (this.shortsFeedSeed) params.set('keyword', this.shortsFeedSeed);
      if (this.shortsFeedChannelId) params.set('channelId', this.shortsFeedChannelId);
      const res = await fetch(`/api/youtube/shorts?${params.toString()}`);
      const data = await res.json();
      if (data && data.success && Array.isArray(data.shorts) && data.shorts.length > 0) {
        this.shortsPage = typeof data.nextPage === 'number' ? data.nextPage : (this.shortsPage + 1);
        if (append) {
          this.shortsPlayer.appendFeed(data.shorts);
        } else {
          this.shortsPlayer.setFeed(data.shorts, 0);
        }
      } else if (!append) {
        this.shortsPlayer.showStatus('알고리즘에 맞는 쇼츠를 찾지 못했습니다.', true);
      }
    } catch (e) {
      if (!append) this.shortsPlayer.showStatus('쇼츠 피드를 불러오지 못했습니다.', true);
    }
  }

  pauseShortsFeed() {
    if (this.shortsPlayer) {
      this.shortsPlayer.pause();
    }
  }

  async shareShortsLink(v) {
    if (!v || !v.videoId) return;
    const url = `https://www.youtube.com/shorts/${v.videoId}`;
    const title = v.title || 'YouTube Shorts';
    if (window.AndroidChzzk && typeof window.AndroidChzzk.shareTextUrl === 'function') {
      if (window.AndroidChzzk.shareTextUrl(title, url)) return;
    }
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (_) {}
    }
    try {
      await navigator.clipboard.writeText(url);
      if (window.app) window.app.showToast('쇼츠 링크가 클립보드에 복사되었습니다.', 'success');
    } catch (_) {
      if (window.app) window.app.showToast(url, 'info');
    }
  }

  syncKeywordsToolbarVisibility() {
    const toolbar = this.ytAlgorithmToolbar || document.getElementById('ytAlgorithmToolbar');
    const toggleBtn = this.ytToggleKeywordsBtn || document.getElementById('ytToggleKeywordsBtn');
    const canShow = (this.currentSubTab !== 'shorts') && !this.keywordsCollapsed;
    if (toolbar) {
      toolbar.style.display = canShow ? 'flex' : 'none';
    }
    if (toggleBtn) {
      toggleBtn.classList.toggle('active', !this.keywordsCollapsed);
    }
  }

  toggleKeywordsBar() {
    this.keywordsCollapsed = !this.keywordsCollapsed;
    this.syncKeywordsToolbarVisibility();
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
          <button class="yt-kw-del-btn" onclick="window.youtubeUI.removeKeyword('${esc}')" title="키워드 삭제">${YT_SVGS.closeX}</button>
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
    this.switchSubTab('recommendations', false);
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

  // ================= Search (홈 내 검색 결과 전환 & YouTube URL 자동 감지) =================
  async handleSearch(query) {
    if (!query) {
      this.resetHomeToRecommendations();
      return;
    }

    // Detect direct YouTube Video URL (watch, short, embed, shorts, live)
    const ytUrlMatch = query.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|v\/|shorts\/|live\/))([\w-]{11})/i);
    if (ytUrlMatch && ytUrlMatch[1]) {
      const extractedVid = ytUrlMatch[1];
      this.playInMultiview(extractedVid, `유튜브 영상 (${extractedVid})`, 'YouTube', '', `https://i.ytimg.com/vi/${extractedVid}/hqdefault.jpg`);
      return;
    }

    // Ensure Home subtab is active visually while keeping search state intact
    if (this.currentSubTab !== 'recommendations') {
      this.switchSubTab('recommendations', false);
    }
    this.setHomeSearchActive(true, `'${query}' 검색 결과`);

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

    this._searchChannelsCache = channels || [];
    this.ytSearchChannelsRow.style.display = 'flex';
    let html = `
      <div class="yt-channels-row-header">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span>관련 채널</span>
      </div>
      <div class="yt-channels-scroll">
    `;

    this._searchChannelsCache.forEach((ch, idx) => {
      const nameEsc = escapeHtml(ch.channelName);
      const isBookmarked = this.isBookmarked(ch.channelId);

      html += `
        <div class="yt-channel-card" onclick="window.youtubeUI.openSearchChannelByIdx(${idx})">
          <img class="yt-channel-avatar" src="${escapeHtml(ch.thumbnail || './static/img/favicon.png')}" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='./static/img/favicon.png'" alt="${nameEsc}">
          <div class="yt-channel-info">
            <div class="yt-channel-title" title="${nameEsc}">${nameEsc}</div>
            <div class="yt-channel-subs">${escapeHtml(ch.subscriberCount || '채널')}</div>
          </div>
          <button type="button" class="btn btn-sm ${isBookmarked ? 'btn-danger' : 'btn-secondary'} yt-channel-bm-btn" onclick="event.stopPropagation(); window.youtubeUI.toggleSearchChannelBmByIdx(${idx})" title="${isBookmarked ? '즐겨찾기 해제' : '채널 즐겨찾기'}" style="display:inline-flex;align-items:center;gap:4px;">
            ${isBookmarked ? YT_SVGS.starFilled : YT_SVGS.starOutline}
            <span>${isBookmarked ? '즐겨찾기됨' : '즐겨찾기'}</span>
          </button>
        </div>
      `;
    });

    html += `</div>`;
    this.ytSearchChannelsRow.innerHTML = html;
  }

  openSearchChannelByIdx(idx) {
    const ch = this._searchChannelsCache && this._searchChannelsCache[idx];
    if (!ch) return;
    this.openChannelView(ch.channelId, ch.channelName, ch.thumbnail || '', ch.subscriberCount || '');
  }

  toggleSearchChannelBmByIdx(idx) {
    const ch = this._searchChannelsCache && this._searchChannelsCache[idx];
    if (!ch) return;
    this.toggleBookmark(ch.channelId, ch.channelName, ch.thumbnail || '', ch.subscriberCount || '');
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
          const sRes = await fetch(`/api/youtube/search?query=${encodeURIComponent(channelName)}`);
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
        if (data && data.avatar && !data.avatar.includes('favicon.png')) {
          avatarUrl = data.avatar;
          this.currentChannelView.avatarUrl = data.avatar;
          if (this.ytChannelBannerAvatar) this.ytChannelBannerAvatar.src = data.avatar;
        }
        if (data && data.channelName && this.ytChannelBannerTitle) {
          this.currentChannelView.channelName = data.channelName;
          this.ytChannelBannerTitle.textContent = data.channelName;
        }
        if (data && data.subscriberCount && this.ytChannelBannerSubs) {
          this.currentChannelView.subs = data.subscriberCount;
          this.ytChannelBannerSubs.textContent = data.subscriberCount;
        }
        if (data.success && data.videos && data.videos.length > 0) {
          this.channelVideos = data.videos;
          this.channelVideosCount = 12;
          this.channelContinuationToken = data.continuationToken || null;
          this.renderChannelVideos();
          return;
        }
      }

      // If channel videos still empty, fallback search by channelName
      if (channelName) {
        const sRes = await fetch(`/api/youtube/search?query=${encodeURIComponent(channelName)}`);
        const sData = await sRes.json();
        if (sData.channels && sData.channels.length > 0 && sData.channels[0].thumbnail && !avatarUrl) {
          avatarUrl = sData.channels[0].thumbnail;
          this.currentChannelView.avatarUrl = avatarUrl;
          if (this.ytChannelBannerAvatar) this.ytChannelBannerAvatar.src = avatarUrl;
        }
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
        moreBtn.style.display = 'inline-flex';
        moreBtn.style.alignItems = 'center';
        moreBtn.style.gap = '5px';
        if (remainingCached > 0) {
          moreBtn.innerHTML = `<span>더보기 (${remainingCached}개 남음)</span>${YT_SVGS.chevronDown}`;
          moreBtn.onclick = () => {
            this.channelVideosCount += 6;
            this.renderChannelVideos();
          };
        } else {
          moreBtn.innerHTML = `<span>더 많은 영상 불러오기</span>${YT_SVGS.chevronDown}`;
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
        this.refreshAllVisibleGrids();
        if (this._searchChannelsCache && this.ytSearchChannelsRow && this.ytSearchChannelsRow.style.display !== 'none') {
          this.renderSearchChannels(this._searchChannelsCache);
        }
        if (this.currentSubTab === 'recommendations') this.loadRecommendations(false);
      } else if (window.app) {
        window.app.showToast(data.error || '채널 즐겨찾기 추가에 실패했습니다.', 'error');
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
        this.refreshAllVisibleGrids();
        if (this._searchChannelsCache && this.ytSearchChannelsRow && this.ytSearchChannelsRow.style.display !== 'none') {
          this.renderSearchChannels(this._searchChannelsCache);
        }
      } else if (window.app) {
        window.app.showToast(data.error || '채널 즐겨찾기 삭제에 실패했습니다.', 'error');
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
    this._bookmarksCache = this.bookmarks;

    let html = '';
    this.bookmarks.forEach((bm, idx) => {
      const nameEsc = escapeHtml(bm.channelName);

      html += `
        <div class="yt-bookmark-card" onclick="window.youtubeUI.openBookmarkedChannelByIdx(${idx})">
          <img class="yt-bookmark-avatar" src="${escapeHtml(bm.thumbnail || './static/img/favicon.png')}" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='./static/img/favicon.png'" alt="${nameEsc}">
          <div class="yt-bookmark-body">
            <div class="yt-bookmark-name" title="${nameEsc}">${nameEsc}</div>
            <div class="yt-bookmark-subs">${escapeHtml(bm.subscriberCount || '즐겨찾기 채널')}</div>
            <div class="yt-bookmark-date">${escapeHtml(bm.addedAt ? bm.addedAt.substring(0, 10) + ' 추가' : '')}</div>
          </div>
          <div class="yt-bookmark-actions" onclick="event.stopPropagation();">
            <button type="button" class="btn btn-sm btn-secondary" onclick="window.youtubeUI.openBookmarkedChannelByIdx(${idx})" title="채널 최신 영상 목록 보기">
              영상 목록
            </button>
            <button type="button" class="btn btn-sm btn-ghost" onclick="window.youtubeUI.removeBookmarkByIdx(${idx})" title="즐겨찾기 삭제" style="color: #f87171;">
              삭제
            </button>
          </div>
        </div>
      `;
    });

    this.ytBookmarksGrid.innerHTML = html;
  }

  openBookmarkedChannelByIdx(idx) {
    const bm = this._bookmarksCache && this._bookmarksCache[idx];
    if (!bm) return;
    this.openChannelView(bm.channelId, bm.channelName, bm.thumbnail || '', bm.subscriberCount || '');
  }

  removeBookmarkByIdx(idx) {
    const bm = this._bookmarksCache && this._bookmarksCache[idx];
    if (!bm) return;
    this.removeBookmark(bm.channelId);
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
          if (window.app) window.app.showToast('즐겨찾기 영상에 추가했습니다!', 'success');
          await this.loadVideoBookmarks();
          this.refreshAllVisibleGrids();
        } else if (window.app) {
          window.app.showToast(data.error || '영상 즐겨찾기 추가에 실패했습니다.', 'error');
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
          if (window.app) window.app.showToast('나중에 볼 영상에 담았습니다!', 'success');
          await this.loadWatchLater();
          this.refreshAllVisibleGrids();
        } else if (window.app) {
          window.app.showToast(data.error || '나중에 볼 영상 저장에 실패했습니다.', 'error');
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
    this.customPlaylists.forEach((pl, idx) => {
      const titleEsc = escapeHtml(pl.title);
      const descEsc = escapeHtml(pl.description || '');
      const videos = Array.isArray(pl.videos) ? pl.videos : [];
      const count = videos.length;
      const thumb = (videos[0] && videos[0].thumbnail) ? videos[0].thumbnail : './static/img/favicon.png';
      const isExpanded = this._expandedPlaylistIds && this._expandedPlaylistIds.has(pl.id);

      const tracksHtml = videos.length === 0
        ? '<div class="yt-pl-track-empty">담긴 영상이 없습니다.</div>'
        : videos.map((v, vIdx) => {
            const vid = v.videoId || v.id || '';
            const vTitleEsc = escapeHtml(v.title || '제목 없음');
            return `
              <div class="yt-pl-track-row" data-pl-idx="${idx}" data-vid="${escapeHtml(vid)}">
                <span class="yt-pl-track-num">${vIdx + 1}</span>
                <span class="yt-pl-track-title" title="${vTitleEsc}">${vTitleEsc}</span>
                <button type="button" class="btn btn-xs btn-ghost yt-pl-track-del" onclick="event.stopPropagation(); window.youtubeUI.removeVideoFromPlaylistByIdx(${idx}, ${vIdx})" title="재생목록에서 삭제" style="color:#f87171;padding:2px 6px;">
                  ${YT_SVGS.closeX}
                </button>
              </div>
            `;
          }).join('');

      html += `
        <div class="yt-playlist-card" onclick="window.youtubeUI.playPlaylistByIdx(${idx}, true)">
          <div class="yt-pl-card-thumb-wrap">
            <img class="yt-pl-card-thumb" src="${escapeHtml(thumb)}" onerror="this.src='./static/img/favicon.png'" alt="">
            <div class="yt-pl-count-badge">
              ${YT_SVGS.playlistBadge}
              <span>${count}개</span>
            </div>
          </div>
          <div class="yt-pl-card-body">
            <div class="yt-pl-card-title">${titleEsc}</div>
            ${descEsc ? `<div class="yt-pl-card-desc">${descEsc}</div>` : ''}
            <div class="yt-pl-card-actions" onclick="event.stopPropagation()">
              <button type="button" class="btn btn-sm btn-primary" onclick="window.youtubeUI.playPlaylistByIdx(${idx}, true)" style="display: inline-flex; align-items: center; gap: 4px;">
                ${YT_SVGS.playTriangle}
                <span>전체 재생</span>
              </button>
              <button type="button" class="btn btn-sm btn-secondary" onclick="window.youtubeUI.togglePlaylistTracksByIdx(${idx})" title="영상 목록 편집">
                <span>${isExpanded ? '접기' : `목록 (${count})`}</span>
              </button>
              <button type="button" class="btn btn-sm btn-ghost" onclick="window.youtubeUI.deleteCustomPlaylistByIdx(${idx})" style="margin-left: auto; color: #f87171;" title="재생목록 삭제">
                삭제
              </button>
            </div>
            ${isExpanded ? `<div class="yt-pl-tracks-panel" onclick="event.stopPropagation()">${tracksHtml}</div>` : ''}
          </div>
        </div>
      `;
    });
    grid.innerHTML = html;
  }

  playPlaylistByIdx(idx, isCustom = true) {
    const pl = this.customPlaylists && this.customPlaylists[idx];
    if (!pl) return;
    this.playPlaylistInSlot(pl.id, isCustom);
  }

  togglePlaylistTracksByIdx(idx) {
    const pl = this.customPlaylists && this.customPlaylists[idx];
    if (!pl) return;
    if (!this._expandedPlaylistIds) this._expandedPlaylistIds = new Set();
    if (this._expandedPlaylistIds.has(pl.id)) {
      this._expandedPlaylistIds.delete(pl.id);
    } else {
      this._expandedPlaylistIds.add(pl.id);
    }
    this.renderCustomPlaylists();
  }

  deleteCustomPlaylistByIdx(idx) {
    const pl = this.customPlaylists && this.customPlaylists[idx];
    if (!pl) return;
    this.deleteCustomPlaylist(pl.id);
  }

  async removeVideoFromPlaylistByIdx(plIdx, vidIdx) {
    const pl = this.customPlaylists && this.customPlaylists[plIdx];
    if (!pl || !Array.isArray(pl.videos)) return;
    const vidObj = pl.videos[vidIdx];
    const videoId = vidObj && (vidObj.videoId || vidObj.id);
    if (!videoId) return;
    try {
      const res = await fetch(`/api/youtube/custom_playlists/${encodeURIComponent(pl.id)}/videos/${encodeURIComponent(videoId)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data && data.success) {
        if (window.app) window.app.showToast('재생목록에서 영상을 삭제했습니다.', 'info');
        await this.loadCustomPlaylists();
      } else if (window.app) {
        window.app.showToast((data && data.error) || '영상 삭제에 실패했습니다.', 'error');
      }
    } catch (e) {
      console.error(e);
    }
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
        listEl.innerHTML = this.customPlaylists.map((pl, idx) => {
          const hasVideo = pl.videos && pl.videos.some(v => (v.videoId || v.id) === (videoData.videoId || videoData.id));
          return `
            <div class="slot-pl-item" onclick="window.youtubeUI.confirmAddToPlaylistByIdx(${idx})" style="justify-content: space-between;">
              <span style="font-weight: 600; color: #fff;">${escapeHtml(pl.title)} (${pl.videos ? pl.videos.length : 0}개)</span>
              ${hasVideo ? '<span style="font-size: 11px; color: var(--accent-color);">이미 추가됨</span>' : '<span style="font-size: 11px; color: #38bdf8;">+ 추가</span>'}
            </div>
          `;
        }).join('');
      }
    }

    if (modal) modal.classList.add('active');
  }

  confirmAddToPlaylistByIdx(idx) {
    const pl = this.customPlaylists && this.customPlaylists[idx];
    if (!pl) return;
    this.confirmAddToPlaylist(pl.id);
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
        if (window.app) window.app.showToast('재생목록에 영상을 추가했습니다!', 'success');
        const modal = document.getElementById('ytAddToPlaylistModal');
        if (modal) modal.classList.remove('active');
        await this.loadCustomPlaylists();
      } else if (window.app) {
        window.app.showToast(data.error || '재생목록 추가에 실패했습니다.', 'error');
      }
    } catch (e) {
      console.error(e);
    }
  }

  playPlaylistInSlot(playlistId, isCustom = true, seedVideoId = '', seedMeta = null) {
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
      // YouTube native playlist / Mix (e.g. from algorithm recommendation)
      const q = (seedVideoId && seedVideoId !== playlistId) ? `?video_id=${encodeURIComponent(seedVideoId)}` : '';
      fetch(`/api/youtube/playlist/${encodeURIComponent(playlistId)}${q}`)
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
                playlistTitle: data.title || (seedMeta && seedMeta.title) || 'YouTube 재생목록',
                items: data.videos,
                currentIndex: 0
              }
            );
          } else if (seedVideoId && seedVideoId !== playlistId) {
            // Fallback: play seed video directly if playlist expansion is restricted
            this.playInMultiview(
              seedVideoId,
              (seedMeta && seedMeta.title) || 'YouTube 영상',
              (seedMeta && seedMeta.channelName) || 'YouTube',
              (seedMeta && seedMeta.channelId) || '',
              (seedMeta && seedMeta.thumbnail) || '',
              (seedMeta && seedMeta.duration) || '',
              true,
              false
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
      if (this.isHomeSearchActive) {
        this.renderVideoGrid(this.ytSearchGrid, this.searchResults, 'search');
      } else {
        this.renderVideoGrid(this.ytRecsGrid, this.recommendations, 'recommendations');
      }
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

  _setVideoCache(vKey, item) {
    if (!this._videoCache) this._videoCache = {};
    this._videoCache[vKey] = item;
    const keys = Object.keys(this._videoCache);
    if (keys.length > 300) {
      for (let i = 0; i < keys.length - 300; i++) {
        delete this._videoCache[keys[i]];
      }
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
      this._setVideoCache(vKey, h);

      const titleEsc = escapeHtml(h.title);
      const nameEsc = escapeHtml(h.channelName || 'YouTube');
      const vidEsc = escapeHtml(h.videoId);

      html += `
        <div class="yt-history-card">
          <div class="yt-history-thumb" onclick="window.youtubeUI.playHistoryItem('${vKey}')">
            <img src="${h.thumbnail || `https://i.ytimg.com/vi/${vidEsc}/hqdefault.jpg`}" onerror="this.src='./static/img/favicon.png'" alt="${titleEsc}">
            ${h.duration ? `<span class="yt-badge-duration">${escapeHtml(h.duration)}</span>` : ''}
            <div class="yt-thumb-hover-overlay">
              <span class="yt-play-icon">${YT_SVGS.playTriangle}</span>
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
            <button type="button" class="btn btn-sm btn-primary" onclick="window.youtubeUI.playHistoryItem('${vKey}')" title="멀티뷰 재생" style="display:inline-flex;align-items:center;gap:4px;">
              ${YT_SVGS.playTriangle}<span>재생</span>
            </button>
            <button type="button" class="btn btn-sm btn-ghost" onclick="window.youtubeUI.removeHistoryEntry('${vidEsc}')" title="기록에서 삭제">
              ${YT_SVGS.closeX}
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
      this._setVideoCache(vKey, v);

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
            ${v.isLive ? `<span class="card-badge-live">LIVE</span>` : ''}
            ${isPl ? `<span class="yt-badge-playlist">${YT_SVGS.playlistBadge}<span>재생목록</span></span>` : ''}

            <!-- Quick Action Buttons (Bookmark, Watch Later, Add to Playlist) -->
            ${!isPl ? `
              <div class="yt-card-quick-actions" onclick="event.stopPropagation()">
                <button type="button" class="yt-quick-btn ${isBm ? 'active-star' : ''}" onclick="window.youtubeUI.toggleVideoBookmarkById('${vKey}')" title="${isBm ? '영상 즐겨찾기 해제' : '영상 즐겨찾기'}">
                  ${isBm ? YT_SVGS.starFilled : YT_SVGS.starOutline}
                </button>
                <button type="button" class="yt-quick-btn ${isWl ? 'active-wl' : ''}" onclick="window.youtubeUI.toggleWatchLaterById('${vKey}')" title="${isWl ? '나중에 볼 영상에서 삭제' : '나중에 볼 영상에 저장'}">
                  ${YT_SVGS.clock}
                </button>
                <button type="button" class="yt-quick-btn" onclick="window.youtubeUI.promptAddToPlaylistById('${vKey}')" title="재생목록에 추가">
                  ${YT_SVGS.playlistAdd}
                </button>
              </div>
            ` : ''}

            <div class="yt-thumb-hover-overlay">
              <span class="yt-play-icon">${YT_SVGS.playTriangle}</span>
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
                <button type="button" class="yt-channel-mini-star ${this.isBookmarked(v.channelId) ? 'active' : ''}" onclick="event.stopPropagation(); window.youtubeUI.toggleChannelBookmarkByKey('${vKey}')" title="채널 즐겨찾기">
                  ${this.isBookmarked(v.channelId) ? YT_SVGS.starFilled : YT_SVGS.starOutline}
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
      this.playPlaylistInSlot(v.playlistId || v.videoId, false, v.videoId || '', v);
    } else {
      this.playInMultiview(v.videoId || v.id, v.title, v.channelName, v.channelId || '', v.thumbnail || '', v.duration || '', true, Boolean(v.isLive));
    }
  }

  onCardRightClick(event, key) {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    if (event && event.target && typeof event.target.closest === 'function' && event.target.closest('button, .yt-video-channel, .yt-channel-mini-star, .yt-card-quick-actions')) return;
    const v = this._videoCache && this._videoCache[key];
    if (!v) return;
    if (v.isPlaylist || v.playlistId) {
      this.playPlaylistInSlot(v.playlistId || v.videoId, false, v.videoId || '', v);
    } else {
      this.playInMultiview(v.videoId || v.id, v.title, v.channelName, v.channelId || '', v.thumbnail || '', v.duration || '', false, Boolean(v.isLive));
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

  toggleChannelBookmarkByKey(key) {
    const v = this._videoCache && this._videoCache[key];
    if (!v || !v.channelId) return;
    this.toggleBookmark(v.channelId, v.channelName || '', v.channelThumbnail || '', '');
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

  playInMultiview(videoId, title, channelName, channelId = '', thumbnail = '', duration = '', switchTab = true, isLive = false) {
    if (!window.multiview) return;

    // Record watch history automatically!
    this.recordHistory(videoId, title, channelName, channelId, thumbnail, duration);

    const extraOpts = isLive ? { isLive: true } : null;

    // If a target slot was selected via promptAddStream
    if (window.multiview.targetSlotIndex !== null) {
      const idx = window.multiview.targetSlotIndex;
      window.multiview.cancelTargetSlot();
      window.multiview.loadYouTubeIntoSlot(idx, videoId, title, channelName, channelId, thumbnail, switchTab, extraOpts);
    } else {
      // Find first empty slot or add new slot
      window.multiview.addYouTubeToFirstAvailableSlot(videoId, title, channelName, channelId, thumbnail, switchTab, extraOpts);
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
