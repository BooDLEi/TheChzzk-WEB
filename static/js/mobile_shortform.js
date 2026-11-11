/* ============================================================
   더치지직 (The Chzzk) - 통합 숏폼 엔진 (mobile_shortform.js)
   - PC 클라이언트 / PC 웹 / 모바일 웹 / APK 공용 숏폼 컨트롤러
   - 치지직 클립 피드 & 유튜브 쇼츠 세부탭 공용 세로/가로 숏폼 UI
   - 상단 접이식 즐겨찾기 채널/키워드 바, 마우스 휠 & 터치 스와이프 전환,
     우하단 아이콘 전용 4버튼, 더보기 메뉴(4기능), 우측 분할/바텀 댓글창
   ============================================================ */

(function() {
  const SF_ICONS = {
    multiview: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.2"></rect><rect x="14" y="3" width="7" height="7" rx="1.2"></rect><rect x="3" y="14" width="7" height="7" rx="1.2"></rect><path d="M17.5 14v7M14 17.5h7"></path></svg>',
    starOutline: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
    starFilled: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
    comment: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>',
    more: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="1.3" fill="currentColor"></circle><circle cx="12" cy="12" r="1.3" fill="currentColor"></circle><circle cx="12" cy="19" r="1.3" fill="currentColor"></circle></svg>',
    chevronDown: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>',
    chevronUp: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>',
    close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    play: '<svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>',
    pause: '<svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>',
    volumeMute: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>',
    quality: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
    share: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>',
    download: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
    editor: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></svg>',
    external: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>',
    clock: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
    refresh: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>',
    back: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>'
  };

  function esc(str) {
    if (typeof escapeHtml === 'function') return escapeHtml(str || '');
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  class MobileShortformPlayer {
    constructor(opts) {
      this.host = opts.host;
      this.mode = opts.mode || 'clips'; // 'clips' | 'youtube_shorts'
      this.slotMsgTag = this.mode === 'youtube_shorts' ? 9902 : 9901;

      // Required & optional callbacks
      this.onLoadInitial = opts.onLoadInitial;
      this.onLoadMore = opts.onLoadMore;
      this.onSelectTopChip = opts.onSelectTopChip;
      this.onMultiviewInsert = opts.onMultiviewInsert;
      this.onToggleBookmark = opts.onToggleBookmark;
      this.isBookmarked = opts.isBookmarked || (() => false);
      this.onLoadComments = opts.onLoadComments;
      this.onOpenChannel = opts.onOpenChannel;
      this.onResolveMedia = opts.onResolveMedia;
      this.getMoreActions = opts.getMoreActions;
      this.getTopDrawerItems = opts.getTopDrawerItems || (() => ({ activeLabel: '추천', chips: [] }));

      this.items = [];
      this.currentIndex = -1;
      this.isTopDrawerOpen = false;
      this.isCommentsOpen = false;
      this.isMoreOpen = false;
      this.isQualityMenuOpen = false;
      this.isLoadingFeed = false;
      this.isLoadingMore = false;
      this.wheelLock = false;
      this.paused = false;
      this.autoplayMuted = false;

      this.activeVideoEl = null;
      this.activeIframeEl = null;
      this.activeMediaMeta = null; // playback details / quality tracks
      this.playSeq = 0;
      this.shortSlidePool = new Map();
      this._ytChAvatarCache = {};
      this._preloadTimer = null;
      this._posterTimer = null;
      this._navAnimating = false;
      this._navTimer = null;

      this._boundMessageHandler = (e) => this.handleYoutubeMessage(e);
      window.addEventListener('message', this._boundMessageHandler);

      this.buildDOM();
    }

    buildDOM() {
      if (!this.host) return;
      this.host.innerHTML = `
        <div class="sf-shell">
          <!-- 상단 전용 접이식 즐겨찾기 채널 / 알고리즘 바 (영상 상단 가림 없음) -->
          <div class="sf-top-bar">
            <button type="button" class="sf-top-handle" title="채널 또는 필터 목록 열기/닫기">
              <span class="sf-top-handle-label">불러오는 중...</span>
              <span class="sf-top-handle-chevron">${SF_ICONS.chevronDown}</span>
            </button>
            <div class="sf-top-drawer">
              <div class="sf-top-scroll"></div>
            </div>
          </div>

          <div class="sf-body-row">
          <div class="sf-stage">
            <div class="sf-slide-viewport">
              <div class="sf-media-layer"></div>
              <div class="sf-poster-mask" style="display: none;">
                <img class="sf-poster-img" referrerpolicy="no-referrer" alt="">
              </div>
              <div class="sf-iframe-touch-layer" style="display: none;"></div>
            </div>

            <!-- 위/아래 풀슬라이드 전환용 인접 프리뷰 카드 -->
            <div class="sf-peek-card" style="display: none;" aria-hidden="true">
              <img class="sf-peek-poster" referrerpolicy="no-referrer" alt="">
              <div class="sf-peek-meta">
                <div class="sf-peek-author"></div>
                <div class="sf-peek-title"></div>
              </div>
            </div>

            <!-- 음소거 안내 배지 (브라우저 정책으로 무음 자동재생 시에만 노출) -->
            <button type="button" class="sf-unmute-pill" style="display: none;" title="터치하여 소리 켜기">
              ${SF_ICONS.volumeMute}
              <span>터치해서 소리 켜기</span>
            </button>

            <!-- 중앙 일시정지 / 재생 펄스 -->
            <div class="sf-center-pulse"></div>

            <!-- 우하단 4개 투명 아이콘 버튼 (텍스트 없음, 색깔 없음, 배경 없음) -->
            <div class="sf-actions-col">
              <button type="button" class="sf-icon-btn" data-action="multiview" title="멀티뷰로 삽입" aria-label="멀티뷰로 삽입">
                ${SF_ICONS.multiview}
              </button>
              <button type="button" class="sf-icon-btn" data-action="bookmark" title="즐겨찾기" aria-label="즐겨찾기">
                ${SF_ICONS.starOutline}
              </button>
              <button type="button" class="sf-icon-btn" data-action="comments" title="댓글" aria-label="댓글">
                ${SF_ICONS.comment}
              </button>
              <button type="button" class="sf-icon-btn" data-action="more" title="더보기" aria-label="더보기">
                ${SF_ICONS.more}
              </button>
            </div>

            <!-- 더보기 팝업 시트 (화질조정 / 링크 공유 / 다운로드 또는 저장 / 에디터 등 4기능) -->
            <div class="sf-more-backdrop" style="display: none;"></div>
            <div class="sf-more-sheet" style="display: none;"></div>

            <!-- 하단 좌측 스트리머/제목 + 진행바 -->
            <div class="sf-bottom-info">
              <div class="sf-author-row">
                <img class="sf-author-avatar" src="./static/img/favicon.png" referrerpolicy="no-referrer" alt="" onerror="this.onerror=null; this.src='./static/img/favicon.png'">
                <span class="sf-author-name">-</span>
              </div>
              <div class="sf-video-title">영상을 불러오는 중...</div>
              <div class="sf-video-submeta"></div>
            </div>

            <div class="sf-progress-wrap">
              <div class="sf-progress-track">
                <div class="sf-progress-fill"></div>
              </div>
            </div>

            <!-- 로딩 / 빈 화면 오버레이 -->
            <div class="sf-status-overlay" style="display: none;"></div>
          </div>

          <!-- 댓글 패널 (세로: 하단 슬라이드 업 / 가로: 우측 분할 창) -->
          <div class="sf-comments-panel">
            <div class="sf-comments-header">
              <div class="sf-comments-title-wrap">
                <span class="sf-comments-title">댓글</span>
                <span class="sf-comments-count">0</span>
              </div>
              <button type="button" class="sf-comments-close" title="댓글 닫기" aria-label="댓글 닫기">
                ${SF_ICONS.close}
              </button>
            </div>
            <div class="sf-comments-body"></div>
          </div>
          </div>
        </div>
      `;

      this.shell = this.host.querySelector('.sf-shell');
      this.topBar = this.host.querySelector('.sf-top-bar');
      this.stage = this.host.querySelector('.sf-stage');
      this.slideViewport = this.host.querySelector('.sf-slide-viewport');
      this.mediaLayer = this.host.querySelector('.sf-media-layer');
      this.posterMask = this.host.querySelector('.sf-poster-mask');
      this.posterImg = this.host.querySelector('.sf-poster-img');
      this.peekCard = this.host.querySelector('.sf-peek-card');
      this.peekPoster = this.host.querySelector('.sf-peek-poster');
      this.peekAuthor = this.host.querySelector('.sf-peek-author');
      this.peekTitle = this.host.querySelector('.sf-peek-title');
      this.iframeTouchLayer = this.host.querySelector('.sf-iframe-touch-layer');
      this.topHandle = this.host.querySelector('.sf-top-handle');
      this.topHandleLabel = this.host.querySelector('.sf-top-handle-label');
      this.topHandleChevron = this.host.querySelector('.sf-top-handle-chevron');
      this.topDrawer = this.host.querySelector('.sf-top-drawer');
      this.topScroll = this.host.querySelector('.sf-top-scroll');
      this.unmutePill = this.host.querySelector('.sf-unmute-pill');
      this.centerPulse = this.host.querySelector('.sf-center-pulse');
      this.actionsCol = this.host.querySelector('.sf-actions-col');
      this.bookmarkBtn = this.host.querySelector('.sf-icon-btn[data-action="bookmark"]');
      this.moreBackdrop = this.host.querySelector('.sf-more-backdrop');
      this.moreSheet = this.host.querySelector('.sf-more-sheet');
      this.authorRow = this.host.querySelector('.sf-author-row');
      this.authorAvatar = this.host.querySelector('.sf-author-avatar');
      this.authorNameEl = this.host.querySelector('.sf-author-name');
      this.videoTitleEl = this.host.querySelector('.sf-video-title');
      this.videoSubmetaEl = this.host.querySelector('.sf-video-submeta');
      this.progressWrap = this.host.querySelector('.sf-progress-wrap');
      this.progressFill = this.host.querySelector('.sf-progress-fill');
      this.statusOverlay = this.host.querySelector('.sf-status-overlay');
      this.commentsPanel = this.host.querySelector('.sf-comments-panel');
      this.commentsCountEl = this.host.querySelector('.sf-comments-count');
      this.commentsBody = this.host.querySelector('.sf-comments-body');
      this.commentsCloseBtn = this.host.querySelector('.sf-comments-close');

      this.bindEvents();
    }

    bindEvents() {
      if (!this.stage) return;

      // Top collapsible handle toggle
      if (this.topHandle) {
        this.topHandle.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleTopDrawer();
        });
      }

      // Close drawers when tapping backdrop
      if (this.moreBackdrop) {
        this.moreBackdrop.addEventListener('click', (e) => {
          e.stopPropagation();
          this.closeMoreMenu();
        });
      }

      // Unmute pill click
      if (this.unmutePill) {
        this.unmutePill.addEventListener('click', (e) => {
          e.stopPropagation();
          this.forceUnmute();
        });
      }

      // Author click -> open channel
      if (this.authorRow) {
        this.authorRow.addEventListener('click', (e) => {
          e.stopPropagation();
          const item = this.getCurrentItem();
          if (item && typeof this.onOpenChannel === 'function') {
            this.onOpenChannel(item);
          }
        });
      }

      // Progress seek
      if (this.progressWrap) {
        this.progressWrap.addEventListener('click', (e) => {
          e.stopPropagation();
          const rect = this.progressWrap.getBoundingClientRect();
          if (!rect.width) return;
          const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          if (this.activeVideoEl && isFinite(this.activeVideoEl.duration) && this.activeVideoEl.duration > 0) {
            this.activeVideoEl.currentTime = pct * this.activeVideoEl.duration;
          } else if (this.activeIframeEl && this.activeMediaMeta && this.activeMediaMeta.duration > 0) {
            this.postToActiveIframe({ action: 'seek', seconds: pct * this.activeMediaMeta.duration });
          }
        });
      }

      // 4 Right-bottom icon-only action buttons
      if (this.actionsCol) {
        this.actionsCol.addEventListener('click', (e) => {
          const btn = e.target.closest('.sf-icon-btn');
          if (!btn) return;
          e.stopPropagation();
          const act = btn.dataset.action;
          const item = this.getCurrentItem();
          if (!item) return;

          if (act === 'multiview') {
            this.pause();
            if (typeof this.onMultiviewInsert === 'function') {
              this.onMultiviewInsert(item, this.items, this.currentIndex);
            }
          } else if (act === 'bookmark') {
            if (typeof this.onToggleBookmark === 'function') {
              Promise.resolve(this.onToggleBookmark(item)).then(() => this.syncBookmarkIcon());
            }
          } else if (act === 'comments') {
            this.toggleComments();
          } else if (act === 'more') {
            this.toggleMoreMenu();
          }
        });
      }

      if (this.commentsCloseBtn) {
        this.commentsCloseBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.closeComments();
        });
      }

      // Touch swipe navigation (100% full edge-to-edge slide tracking + seamless peek preview)
      let startY = 0;
      let startX = 0;
      let startTs = 0;
      let lastDy = 0;
      let peekDir = 0;
      let tracking = false;
      let swipedVertical = false;

      const onTouchStart = (e) => {
        if (!e.touches || e.touches.length !== 1 || this._navAnimating) return;
        if (e.target.closest('.sf-actions-col, .sf-top-bar, .sf-more-sheet, .sf-comments-panel, .sf-bottom-info, .sf-progress-wrap, .sf-unmute-pill, .sf-status-overlay')) {
          return;
        }
        tracking = true;
        swipedVertical = false;
        lastDy = 0;
        peekDir = 0;
        startY = e.touches[0].clientY;
        startX = e.touches[0].clientX;
        startTs = Date.now();
        if (this.slideViewport) {
          this.slideViewport.style.transition = 'none';
        }
        if (this.peekCard) {
          this.peekCard.style.transition = 'none';
        }
      };

      const onTouchMove = (e) => {
        if (!tracking || !e.touches || e.touches.length !== 1) return;
        const dy = e.touches[0].clientY - startY;
        const dx = e.touches[0].clientX - startX;
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx) * 1.15) {
          swipedVertical = true;
          e.preventDefault();
          const stageH = (this.stage && this.stage.clientHeight) ? this.stage.clientHeight : 600;
          const dir = dy < 0 ? 1 : -1;
          const targetIdx = this.currentIndex + dir;
          const hasTarget = (targetIdx >= 0 && targetIdx < this.items.length);

          if (hasTarget) {
            const clampedDy = Math.max(-stageH, Math.min(stageH, dy));
            lastDy = clampedDy;
            if (peekDir !== dir) {
              peekDir = dir;
              this.preparePeekCard(targetIdx);
            }
            if (this.slideViewport) {
              this.slideViewport.style.transform = `translateY(${clampedDy}px)`;
            }
            if (this.peekCard) {
              const peekOffset = dir > 0 ? (stageH + clampedDy) : (-stageH + clampedDy);
              this.peekCard.style.transition = 'none';
              this.peekCard.style.transform = `translateY(${peekOffset}px)`;
            }
          } else {
            lastDy = Math.max(-85, Math.min(85, dy * 0.24));
            if (peekDir !== 0) {
              peekDir = 0;
              this.hidePeekCard();
            }
            if (this.slideViewport) {
              this.slideViewport.style.transform = `translateY(${lastDy}px)`;
            }
          }
        }
      };

      const onTouchEnd = (e) => {
        if (!tracking) return;
        tracking = false;
        const touch = (e.changedTouches && e.changedTouches[0]) || null;
        const dy = touch ? (touch.clientY - startY) : lastDy;
        const elapsed = Math.max(1, Date.now() - startTs);
        const velocity = Math.abs(dy) / elapsed;
        const stageH = (this.stage && this.stage.clientHeight) ? this.stage.clientHeight : 600;
        const threshold = Math.min(84, stageH * 0.14);
        const dir = dy < 0 ? 1 : -1;
        const targetIdx = this.currentIndex + dir;
        const canNav = swipedVertical && (Math.abs(dy) >= threshold || (Math.abs(dy) >= 24 && velocity > 0.35));

        if (canNav && targetIdx >= 0 && targetIdx < this.items.length) {
          this.navigate(dir, true);
          return;
        }

        if (canNav && dir > 0 && targetIdx >= this.items.length) {
          this.maybePreloadMore();
        }

        if (this.slideViewport) {
          this.slideViewport.style.transition = 'transform 0.24s cubic-bezier(0.22, 1, 0.36, 1)';
          this.slideViewport.style.transform = 'translateY(0)';
        }
        if (this.peekCard && peekDir !== 0) {
          this.peekCard.style.transition = 'transform 0.24s cubic-bezier(0.22, 1, 0.36, 1)';
          this.peekCard.style.transform = `translateY(${peekDir > 0 ? '100%' : '-100%'})`;
          setTimeout(() => {
            if (!tracking && !this._navAnimating) this.hidePeekCard();
          }, 250);
        } else {
          this.hidePeekCard();
        }
      };

      this.stage.addEventListener('touchstart', onTouchStart, { passive: true });
      this.stage.addEventListener('touchmove', onTouchMove, { passive: false });
      this.stage.addEventListener('touchend', onTouchEnd, { passive: true });
      this.stage.addEventListener('touchcancel', () => {
        tracking = false;
        if (this.slideViewport) {
          this.slideViewport.style.transition = 'transform 0.22s ease';
          this.slideViewport.style.transform = 'translateY(0)';
        }
        this.hidePeekCard();
      }, { passive: true });

      // Tap to toggle play/pause (also recovers audio if browser started muted)
      this.stage.addEventListener('click', (e) => {
        if (e.target.closest('.sf-actions-col, .sf-top-bar, .sf-more-sheet, .sf-comments-panel, .sf-bottom-info, .sf-progress-wrap, .sf-unmute-pill, .sf-status-overlay')) {
          return;
        }
        if (this.isTopDrawerOpen) {
          this.setTopDrawerOpen(false);
          return;
        }
        if (this.isMoreOpen) {
          this.closeMoreMenu();
          return;
        }
        if (this.autoplayMuted) {
          this.forceUnmute();
          return;
        }
        this.togglePlayPause();
      });

      // Wheel navigation for desktop & trackpads
      this.stage.addEventListener('wheel', (e) => {
        if (e.target.closest('.sf-comments-panel, .sf-top-drawer, .sf-more-sheet')) return;
        if (Math.abs(e.deltaY) < 22) return;
        e.preventDefault();
        if (this.wheelLock) return;
        this.wheelLock = true;
        setTimeout(() => { this.wheelLock = false; }, 360);
        this.navigate(e.deltaY > 0 ? 1 : -1);
      }, { passive: false });

      // Horizontal mouse-wheel scroll support for top channel avatar / keyword shelf
      if (this.topScroll) {
        this.topScroll.addEventListener('wheel', (e) => {
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && this.topScroll.scrollWidth > this.topScroll.clientWidth) {
            e.preventDefault();
            this.topScroll.scrollLeft += e.deltaY;
          }
        }, { passive: false });
      }
    }

    _getTargetAudio() {
      const app = window.app;
      if (this.mode === 'youtube_shorts') {
        const vol = (app && typeof app.masterYTVolume === 'number') ? app.masterYTVolume : 1.0;
        const muted = Boolean(app && app.masterYTMuted);
        return { volume: Math.max(0, Math.min(1, vol)), muted };
      }
      const vol = (app && typeof app.masterChzzkVolume === 'number') ? app.masterChzzkVolume : 1.0;
      const muted = Boolean(app && app.masterChzzkMuted);
      return { volume: Math.max(0, Math.min(1, vol)), muted };
    }

    getCurrentItem() {
      if (this.currentIndex < 0 || this.currentIndex >= this.items.length) return null;
      return this.items[this.currentIndex] || null;
    }

    refreshTopDrawer() {
      if (!this.topScroll || typeof this.getTopDrawerItems !== 'function') return;
      const data = this.getTopDrawerItems() || {};
      if (this.topHandleLabel) {
        this.topHandleLabel.textContent = data.activeLabel || '추천 피드';
      }
      const chips = Array.isArray(data.chips) ? data.chips : [];
      if (chips.length === 0) {
        this.topScroll.innerHTML = '<div style="padding: 8px 12px; font-size: 12px; color: rgba(255,255,255,0.65);">표시할 채널이나 키워드가 없습니다.</div>';
        return;
      }
      this.topScroll.innerHTML = chips.map((ch, idx) => {
        const activeCls = ch.active ? 'active' : '';
        if (ch.kind === 'pill') {
          return `
            <button type="button" class="sf-top-pill ${activeCls}" data-chip-idx="${idx}">
              <span>${esc(ch.label || '')}</span>
            </button>
          `;
        }
        return `
          <button type="button" class="sf-top-avatar-chip ${activeCls}" data-chip-idx="${idx}" title="${esc(ch.label || '')}">
            <div class="sf-top-avatar-ring">
              <img src="${esc(ch.avatar || './static/img/favicon.png')}" referrerpolicy="no-referrer" alt="" onerror="this.onerror=null; this.src='./static/img/favicon.png'">
              ${ch.isLive ? '<span class="sf-top-live-dot"></span>' : ''}
            </div>
            <span class="sf-top-avatar-name">${esc(ch.label || '')}</span>
          </button>
        `;
      }).join('');

      this.topScroll.querySelectorAll('[data-chip-idx]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.dataset.chipIdx, 10);
          const chip = chips[idx];
          this.setTopDrawerOpen(false);
          if (chip && typeof this.onSelectTopChip === 'function') {
            this.onSelectTopChip(chip);
          }
        });
      });
    }

    toggleTopDrawer() {
      this.setTopDrawerOpen(!this.isTopDrawerOpen);
    }

    setTopDrawerOpen(open) {
      this.isTopDrawerOpen = Boolean(open);
      if (this.isTopDrawerOpen) {
        this.refreshTopDrawer();
      }
      if (this.topDrawer) {
        this.topDrawer.classList.toggle('open', this.isTopDrawerOpen);
      }
      if (this.topHandleChevron) {
        this.topHandleChevron.innerHTML = this.isTopDrawerOpen ? SF_ICONS.chevronUp : SF_ICONS.chevronDown;
      }
    }

    getThumbUrlForItem(item) {
      if (!item) return './static/img/favicon.png';
      if (item.thumbnailImageUrl) return item.thumbnailImageUrl;
      if (item.thumbnail) return item.thumbnail;
      const vid = item.videoId || item.id;
      if (vid && this.mode === 'youtube_shorts') {
        return `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
      }
      return './static/img/favicon.png';
    }

    preparePeekCard(targetIndex) {
      const targetItem = this.items[targetIndex];
      if (!this.peekCard || !targetItem) return;
      const thumb = this.getThumbUrlForItem(targetItem);
      const author = targetItem.channelName || (targetItem.ownerChannel && targetItem.ownerChannel.channelName) || '';
      const title = targetItem.clipTitle || targetItem.title || '';
      if (this.peekPoster) {
        this.peekPoster.src = thumb;
      }
      if (this.peekAuthor) this.peekAuthor.textContent = author;
      if (this.peekTitle) this.peekTitle.textContent = title;
      this.peekCard.style.display = 'flex';
    }

    hidePeekCard() {
      if (!this.peekCard) return;
      this.peekCard.style.transition = 'none';
      this.peekCard.style.display = 'none';
      this.peekCard.style.transform = 'translateY(100%)';
    }

    showPosterMask(thumbUrl, fallbackTimeoutMs = 3400) {
      if (this._posterTimer) {
        clearTimeout(this._posterTimer);
        this._posterTimer = null;
      }
      if (!this.posterMask || !this.posterImg) return;
      if (thumbUrl) {
        this.posterImg.src = thumbUrl;
      }
      this.posterMask.classList.remove('sf-poster-fading');
      this.posterMask.style.display = 'flex';
      this.posterMask.style.opacity = '1';
      this._posterTimer = setTimeout(() => {
        this.fadeOutPosterMask(0);
      }, fallbackTimeoutMs);
    }

    fadeOutPosterMask(delayMs = 100) {
      if (this._posterTimer) {
        clearTimeout(this._posterTimer);
        this._posterTimer = null;
      }
      if (!this.posterMask || this.posterMask.style.display === 'none') return;
      const execFade = () => {
        if (!this.posterMask) return;
        this.posterMask.classList.add('sf-poster-fading');
        this.posterMask.style.opacity = '0';
        setTimeout(() => {
          if (this.posterMask && this.posterMask.classList.contains('sf-poster-fading')) {
            this.posterMask.style.display = 'none';
          }
        }, 180);
      };
      if (delayMs > 0) {
        this._posterTimer = setTimeout(execFade, delayMs);
      } else {
        execFade();
      }
    }

    setFeed(items, startIndex = 0) {
      this.items = Array.isArray(items) ? items.slice() : [];
      this.clearAllShortSlides();
      this.refreshTopDrawer();
      if (this.items.length === 0) {
        this.currentIndex = -1;
        this.showStatus('표시할 영상이 없습니다.', true);
        this.clearMedia();
        return;
      }
      this.hideStatus();
      const idx = Math.max(0, Math.min(this.items.length - 1, startIndex));
      this.playAtIndex(idx);
    }

    appendFeed(moreItems) {
      if (!Array.isArray(moreItems) || moreItems.length === 0) return;
      const seen = new Set(this.items.map(it => it.clipUID || it.videoId));
      for (const it of moreItems) {
        const key = it.clipUID || it.videoId;
        if (key && !seen.has(key)) {
          seen.add(key);
          this.items.push(it);
        }
      }
      if (this.mode === 'youtube_shorts' && this.currentIndex >= 0) {
        this.preloadNeighborShorts(this.currentIndex);
      }
    }

    async ensureInitialFeedLoaded() {
      if (this.items.length > 0 && this.currentIndex >= 0) {
        this.resume();
        return;
      }
      if (this.isLoadingFeed || typeof this.onLoadInitial !== 'function') return;
      this.isLoadingFeed = true;
      this.showStatus('추천 피드를 불러오는 중...', false);
      try {
        await this.onLoadInitial(this);
      } finally {
        this.isLoadingFeed = false;
      }
    }

    async maybePreloadMore() {
      if (this.isLoadingMore || typeof this.onLoadMore !== 'function') return;
      if (this.items.length === 0 || (this.items.length - 1 - this.currentIndex) > 3) return;
      this.isLoadingMore = true;
      try {
        await this.onLoadMore(this);
      } finally {
        this.isLoadingMore = false;
      }
    }

    navigate(direction, fromDrag = false) {
      if (this.items.length === 0 || this._navAnimating) return;
      const target = this.currentIndex + direction;
      if (target < 0) return;
      if (target >= this.items.length) {
        this.maybePreloadMore();
        return;
      }

      if (this.slideViewport && this.peekCard) {
        this._navAnimating = true;
        if (this._navTimer) {
          clearTimeout(this._navTimer);
          this._navTimer = null;
        }
        this.preparePeekCard(target);
        if (!fromDrag) {
          this.slideViewport.style.transition = 'none';
          this.slideViewport.style.transform = 'translateY(0)';
          this.peekCard.style.transition = 'none';
          this.peekCard.style.transform = `translateY(${direction > 0 ? '100%' : '-100%'})`;
          void this.stage.offsetHeight;
        }

        requestAnimationFrame(() => {
          if (this.slideViewport) {
            this.slideViewport.style.transition = 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)';
            this.slideViewport.style.transform = `translateY(${direction > 0 ? '-100%' : '100%'})`;
          }
          if (this.peekCard) {
            this.peekCard.style.transition = 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)';
            this.peekCard.style.transform = 'translateY(0%)';
          }
        });

        this._navTimer = setTimeout(() => {
          if (this.slideViewport) {
            this.slideViewport.style.transition = 'none';
            this.slideViewport.style.transform = 'translateY(0)';
          }
          this.playAtIndex(target);
          requestAnimationFrame(() => {
            this.hidePeekCard();
            this._navAnimating = false;
          });
        }, 255);
      } else {
        this.playAtIndex(target);
      }
    }

    clearAllShortSlides() {
      if (this._preloadTimer) {
        clearTimeout(this._preloadTimer);
        this._preloadTimer = null;
      }
      if (this.shortSlidePool) {
        this.shortSlidePool.forEach((slot) => {
          try { if (slot.iframe) slot.iframe.src = 'about:blank'; } catch (_) {}
          try { if (slot.wrapper) slot.wrapper.remove(); } catch (_) {}
        });
        this.shortSlidePool.clear();
      }
    }

    clearMedia() {
      this.activeMediaMeta = null;
      this.fadeOutPosterMask(0);
      if (this.activeVideoEl) {
        try {
          this.activeVideoEl.pause();
          this.activeVideoEl.removeAttribute('src');
          this.activeVideoEl.load();
        } catch (_) {}
        this.activeVideoEl = null;
      }
      if (this.mode === 'youtube_shorts') {
        if (this.activeIframeEl && this.activeIframeEl.contentWindow) {
          try {
            this.activeIframeEl.contentWindow.postMessage({ action: 'pause', slotIndex: this.slotMsgTag }, '*');
          } catch (_) {}
        }
        this.shortSlidePool.forEach((slot) => {
          if (slot.wrapper) {
            slot.wrapper.classList.remove('active');
            slot.wrapper.classList.add('preloading');
          }
        });
        this.activeIframeEl = null;
      } else {
        if (this.activeIframeEl) {
          try {
            this.activeIframeEl.src = 'about:blank';
          } catch (_) {}
          this.activeIframeEl = null;
        }
        if (this.mediaLayer) {
          this.mediaLayer.innerHTML = '';
        }
      }
      if (this.iframeTouchLayer) {
        this.iframeTouchLayer.style.display = 'none';
        this.iframeTouchLayer.style.pointerEvents = 'auto';
      }
      if (this.progressFill) this.progressFill.style.width = '0%';
      if (this.unmutePill) this.unmutePill.style.display = 'none';
    }

    showStatus(msg, showRetry = false) {
      if (!this.statusOverlay) return;
      this.statusOverlay.style.display = 'flex';
      this.statusOverlay.innerHTML = `
        <div class="sf-status-card">
          <div class="sf-status-text">${esc(msg)}</div>
          ${showRetry ? `<button type="button" class="btn btn-sm btn-primary sf-retry-btn">${SF_ICONS.refresh}<span>다시 불러오기</span></button>` : ''}
        </div>
      `;
      const retryBtn = this.statusOverlay.querySelector('.sf-retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.items = [];
          this.currentIndex = -1;
          this.ensureInitialFeedLoaded();
        });
      }
    }

    hideStatus() {
      if (this.statusOverlay) {
        this.statusOverlay.style.display = 'none';
        this.statusOverlay.innerHTML = '';
      }
    }

    renderMetaForItem(item) {
      if (!item) return;
      const authorName = item.channelName || (item.ownerChannel && item.ownerChannel.channelName) || '채널';
      let authorAvatar = item.channelImageUrl
        || item.channelThumbnail
        || item.authorThumbnail
        || (item.ownerChannel && item.ownerChannel.channelImageUrl)
        || (item.channelId && this._ytChAvatarCache && this._ytChAvatarCache[item.channelId])
        || './static/img/favicon.png';
      const title = item.clipTitle || item.title || '제목 없음';
      const subParts = [];
      if (item.clipCategory) subParts.push(item.clipCategory);
      if (item.readCount != null) subParts.push(`조회 ${Number(item.readCount).toLocaleString()}회`);
      else if (item.viewCount) subParts.push(item.viewCount);
      if (item.publishedTime) subParts.push(item.publishedTime);

      if (this.authorAvatar) {
        this.authorAvatar.referrerPolicy = 'no-referrer';
        this.authorAvatar.src = authorAvatar;
      }
      if (this.authorNameEl) this.authorNameEl.textContent = authorName;
      if (this.videoTitleEl) this.videoTitleEl.textContent = title;
      if (this.videoSubmetaEl) this.videoSubmetaEl.textContent = subParts.join(' • ');
      this.syncBookmarkIcon();

      if (this.mode === 'youtube_shorts' && (!authorAvatar || authorAvatar.includes('favicon.png')) && item.channelId) {
        const curSeq = this.playSeq;
        const cid = item.channelId;
        fetch(`/api/youtube/channel/${encodeURIComponent(cid)}?metaOnly=1`)
          .then(r => r.json())
          .then(d => {
            if (d && d.avatar && !d.avatar.includes('favicon.png')) {
              this._ytChAvatarCache[cid] = d.avatar;
              item.channelImageUrl = d.avatar;
              item.channelThumbnail = d.avatar;
              if (curSeq === this.playSeq && this.authorAvatar) {
                this.authorAvatar.src = d.avatar;
              }
            }
          })
          .catch(() => {});
      }
    }

    syncBookmarkIcon() {
      const item = this.getCurrentItem();
      if (!this.bookmarkBtn || !item) return;
      const bm = Boolean(this.isBookmarked(item));
      this.bookmarkBtn.innerHTML = bm ? SF_ICONS.starFilled : SF_ICONS.starOutline;
      this.bookmarkBtn.title = bm ? '즐겨찾기 해제' : '즐겨찾기 추가';
    }

    async playAtIndex(index) {
      if (index < 0 || index >= this.items.length) return;
      const seq = ++this.playSeq;
      this.currentIndex = index;
      this.paused = false;
      this.autoplayMuted = false;
      this.closeMoreMenu();
      const item = this.items[index];

      this.clearMedia();
      this.renderMetaForItem(item);
      this.refreshTopDrawer();
      this.maybePreloadMore();

      if (this.isCommentsOpen) {
        this.loadCommentsForCurrent();
      }

      if (this.mode === 'youtube_shorts') {
        this.mountYoutubeShort(item, seq);
      } else {
        await this.mountClipVideo(item, seq);
      }
    }

    async mountClipVideo(item, seq) {
      if (!this.onResolveMedia) return;
      this.hideStatus();
      const details = await this.onResolveMedia(item).catch(() => null);
      if (seq !== this.playSeq) return;

      if (!details || !details.primaryMp4Url) {
        this.showStatus('클립 스트림을 불러오지 못했습니다. 위아래로 넘겨 다음 클립을 확인하세요.', true);
        return;
      }

      // Enrich author channel info if missing
      if (details.ownerChannel && details.ownerChannel.channelName) {
        item.channelName = details.ownerChannel.channelName;
        item.channelImageUrl = details.ownerChannel.channelImageUrl || item.channelImageUrl;
        item.ownerChannelId = item.ownerChannelId || details.ownerChannel.channelId;
        this.renderMetaForItem(item);
      }

      this.activeMediaMeta = details;
      const audio = this._getTargetAudio();
      const video = document.createElement('video');
      video.className = 'sf-video-el';
      video.autoplay = true;
      video.loop = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.muted = audio.muted;
      video.volume = audio.muted ? 0 : audio.volume;
      video.poster = item.thumbnailImageUrl || '';

      video.addEventListener('timeupdate', () => {
        if (seq !== this.playSeq || !video.duration) return;
        if (this.progressFill) {
          this.progressFill.style.width = `${Math.min(100, (video.currentTime / video.duration) * 100)}%`;
        }
      });

      video.addEventListener('error', () => {
        if (seq !== this.playSeq) return;
        this.showStatus('클립 영상을 재생할 수 없습니다. 위아래로 넘겨 다음 클립을 확인하세요.', true);
      });

      this.mediaLayer.appendChild(video);
      this.activeVideoEl = video;
      video.src = details.primaryMp4Url;

      if (!this.paused) {
        video.play().catch(() => {
          if (seq !== this.playSeq || this.paused) return;
          video.muted = true;
          this.autoplayMuted = true;
          if (this.unmutePill) this.unmutePill.style.display = 'inline-flex';
          video.play().catch(() => {});
        });
      }
    }

    _createShortSlideSlot(vid, isPreload = false) {
      const wrapper = document.createElement('div');
      wrapper.className = isPreload ? 'sf-yt-slide preloading' : 'sf-yt-slide active';
      wrapper.dataset.videoId = vid;

      const iframe = document.createElement('iframe');
      iframe.className = 'sf-yt-iframe';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;

      if (window.webBackendPolyfill && typeof window.webBackendPolyfill.generateYoutubeEmbedHtml === 'function') {
        iframe.srcdoc = window.webBackendPolyfill.generateYoutubeEmbedHtml(vid, this.slotMsgTag, !isPreload && !this.paused, 0, {
          loop: true,
          isShort: true,
          preload: isPreload
        });
      } else {
        iframe.src = `/api/youtube/embed/${encodeURIComponent(vid)}?slot=${this.slotMsgTag}&autoplay=${(!isPreload && !this.paused) ? 1 : 0}`;
      }

      wrapper.appendChild(iframe);
      if (this.mediaLayer) {
        this.mediaLayer.appendChild(wrapper);
      }
      const slot = { vid, wrapper, iframe, ready: false, preloaded: false };
      this.shortSlidePool.set(vid, slot);
      return slot;
    }

    _pruneShortSlidePool(centerIndex) {
      const keepIds = new Set();
      for (let off = -1; off <= 2; off++) {
        const it = this.items[centerIndex + off];
        const vId = it && (it.videoId || it.id);
        if (vId) keepIds.add(vId);
      }
      this.shortSlidePool.forEach((slot, vidKey) => {
        if (!keepIds.has(vidKey)) {
          try { if (slot.iframe) slot.iframe.src = 'about:blank'; } catch (_) {}
          try { if (slot.wrapper) slot.wrapper.remove(); } catch (_) {}
          this.shortSlidePool.delete(vidKey);
        }
      });
    }

    preloadNeighborShorts(centerIndex) {
      if (this.mode !== 'youtube_shorts') return;
      if (this._preloadTimer) {
        clearTimeout(this._preloadTimer);
        this._preloadTimer = null;
      }
      this._pruneShortSlidePool(centerIndex);

      const enqueueIdx = (idx) => {
        const it = this.items[idx];
        const nVid = it && (it.videoId || it.id);
        if (!nVid || this.shortSlidePool.has(nVid)) return;
        this._createShortSlideSlot(nVid, true);
      };

      enqueueIdx(centerIndex + 1);
      this._preloadTimer = setTimeout(() => {
        if (this.currentIndex === centerIndex) {
          enqueueIdx(centerIndex + 2);
        }
      }, 280);
    }

    mountYoutubeShort(item, seq) {
      if (seq !== this.playSeq) return;
      this.hideStatus();
      const vid = item.videoId || item.id;
      this.activeMediaMeta = {
        videoId: vid,
        duration: item.lengthSeconds || 60,
        currentQuality: 'auto'
      };

      // 재생 프레임이 시작되기 전까지 섬네일 마스크로 로딩·유튜브 초기 UI 완전 은닉
      const posterUrl = this.getThumbUrlForItem(item);
      this.showPosterMask(posterUrl, 3400);

      let slot = this.shortSlidePool.get(vid);
      const isWarmPreload = Boolean(slot && slot.wrapper && slot.iframe);

      this.shortSlidePool.forEach((s, key) => {
        if (key !== vid && s.wrapper) {
          s.wrapper.classList.remove('active');
          s.wrapper.classList.add('preloading');
          if (s.iframe && s.iframe.contentWindow) {
            try { s.iframe.contentWindow.postMessage({ action: 'pause', slotIndex: this.slotMsgTag }, '*'); } catch (_) {}
          }
        }
      });

      if (!slot) {
        slot = this._createShortSlideSlot(vid, false);
      } else {
        slot.wrapper.classList.remove('preloading');
        slot.wrapper.classList.add('active');
      }

      this.activeIframeEl = slot.iframe;

      if (isWarmPreload && slot.iframe && slot.iframe.contentWindow) {
        const audio = this._getTargetAudio();
        try {
          slot.iframe.contentWindow.postMessage({
            action: this.paused ? 'pause' : 'activatePreloaded',
            loop: true,
            muted: audio.muted,
            volume: audio.muted ? 0 : Math.round(audio.volume * 100),
            slotIndex: this.slotMsgTag
          }, '*');
        } catch (_) {}
      }

      if (this.iframeTouchLayer) {
        this.iframeTouchLayer.style.display = 'block';
        this.iframeTouchLayer.style.pointerEvents = 'auto';
      }

      this.preloadNeighborShorts(this.currentIndex);
    }

    handleYoutubeMessage(e) {
      if (this.mode !== 'youtube_shorts') return;
      const d = e.data;
      if (!d || typeof d !== 'object' || !String(d.type || '').startsWith('yt_')) return;

      if (d.type === 'yt_preloaded' && d.videoId && this.shortSlidePool.has(d.videoId)) {
        const s = this.shortSlidePool.get(d.videoId);
        if (s) { s.ready = true; s.preloaded = true; }
        return;
      }

      if (!this.activeIframeEl) return;
      const fromActive = (e.source === this.activeIframeEl.contentWindow)
        || (d.videoId && this.activeMediaMeta && d.videoId === this.activeMediaMeta.videoId);
      if (!fromActive) return;

      if (d.type === 'yt_ready') {
        const audio = this._getTargetAudio();
        this.postToActiveIframe({ action: 'setLoop', loop: true });
        if (this.paused) {
          this.postToActiveIframe({ action: 'pause' });
          this.fadeOutPosterMask(0);
        } else {
          this.postToActiveIframe({ action: audio.muted ? 'mute' : 'unmute' });
          this.postToActiveIframe({ action: 'setVolume', volume: audio.muted ? 0 : Math.round(audio.volume * 100) });
          this.postToActiveIframe({ action: 'play' });
        }
      } else if (d.type === 'yt_playing_started') {
        this.fadeOutPosterMask(110);
      } else if (d.type === 'yt_statechange' && d.state === 'playing' && (d.currentTime || 0) > 0.05) {
        this.fadeOutPosterMask(90);
      } else if (d.type === 'yt_tap_required') {
        this.fadeOutPosterMask(0);
        if (this.iframeTouchLayer) {
          this.iframeTouchLayer.style.pointerEvents = 'none';
        }
      } else if (d.type === 'yt_autoplay_muted') {
        this.autoplayMuted = true;
        if (this.unmutePill) this.unmutePill.style.display = 'inline-flex';
      } else if (d.type === 'yt_timeupdate') {
        if (this.activeMediaMeta && d.duration > 0) {
          this.activeMediaMeta.duration = d.duration;
        }
        if ((d.currentTime || 0) > 0.06) {
          this.fadeOutPosterMask(40);
        }
        if (this.progressFill && d.duration > 0) {
          this.progressFill.style.width = `${Math.min(100, (d.currentTime / d.duration) * 100)}%`;
        }
      } else if (d.type === 'yt_error') {
        this.fadeOutPosterMask(0);
        // Allow user to click "YouTube에서 직접 보기" fallback link inside iframe
        if (this.iframeTouchLayer) {
          this.iframeTouchLayer.style.pointerEvents = 'none';
        }
      }
    }

    postToActiveIframe(payload) {
      if (!this.activeIframeEl || !this.activeIframeEl.contentWindow) return;
      try {
        this.activeIframeEl.contentWindow.postMessage({
          ...payload,
          slotIndex: this.slotMsgTag
        }, '*');
      } catch (_) {}
    }

    forceUnmute() {
      const audio = this._getTargetAudio();
      this.autoplayMuted = false;
      if (this.unmutePill) this.unmutePill.style.display = 'none';
      if (this.activeVideoEl) {
        this.activeVideoEl.muted = false;
        this.activeVideoEl.volume = audio.volume > 0 ? audio.volume : 1.0;
        if (this.activeVideoEl.paused) {
          this.activeVideoEl.play().catch(() => {});
        }
      }
      if (this.activeIframeEl) {
        this.postToActiveIframe({ action: 'unmute' });
        this.postToActiveIframe({ action: 'setVolume', volume: audio.volume > 0 ? Math.round(audio.volume * 100) : 100 });
        this.postToActiveIframe({ action: 'play' });
      }
    }

    flashCenterPulse(isPlayingNow) {
      if (!this.centerPulse) return;
      this.centerPulse.innerHTML = isPlayingNow ? SF_ICONS.play : SF_ICONS.pause;
      this.centerPulse.classList.remove('active');
      void this.centerPulse.offsetWidth;
      this.centerPulse.classList.add('active');
    }

    togglePlayPause() {
      const audio = this._getTargetAudio();
      if (this.activeVideoEl) {
        if (this.activeVideoEl.paused) {
          this.paused = false;
          this.activeVideoEl.muted = audio.muted;
          this.activeVideoEl.volume = audio.muted ? 0 : audio.volume;
          this.activeVideoEl.play().catch(() => {});
          this.flashCenterPulse(true);
        } else {
          this.paused = true;
          this.activeVideoEl.pause();
          this.flashCenterPulse(false);
        }
      } else if (this.activeIframeEl) {
        this.paused = !this.paused;
        this.postToActiveIframe({ action: this.paused ? 'pause' : 'play' });
        if (!this.paused) {
          this.postToActiveIframe({ action: audio.muted ? 'mute' : 'unmute' });
          this.postToActiveIframe({ action: 'setVolume', volume: audio.muted ? 0 : Math.round(audio.volume * 100) });
        }
        this.flashCenterPulse(!this.paused);
      }
    }

    pause() {
      this.paused = true;
      if (this.activeVideoEl) {
        try { this.activeVideoEl.pause(); } catch (_) {}
      }
      if (this.activeIframeEl) {
        this.postToActiveIframe({ action: 'pause' });
      }
    }

    resume() {
      const audio = this._getTargetAudio();
      this.paused = false;
      if (this.activeVideoEl) {
        this.activeVideoEl.muted = audio.muted;
        this.activeVideoEl.volume = audio.muted ? 0 : audio.volume;
        this.activeVideoEl.play().catch(() => {
          if (this.activeVideoEl) {
            this.activeVideoEl.muted = true;
            this.autoplayMuted = true;
            if (this.unmutePill) this.unmutePill.style.display = 'inline-flex';
            this.activeVideoEl.play().catch(() => {});
          }
        });
      }
      if (this.activeIframeEl) {
        this.postToActiveIframe({ action: audio.muted ? 'mute' : 'unmute' });
        this.postToActiveIframe({ action: 'setVolume', volume: audio.muted ? 0 : Math.round(audio.volume * 100) });
        this.postToActiveIframe({ action: 'play' });
      }
    }

    switchClipQuality(urlVal, label) {
      if (!this.activeVideoEl || !urlVal) return;
      const prevTime = this.activeVideoEl.currentTime || 0;
      const wasPaused = this.activeVideoEl.paused;
      this.activeVideoEl.src = urlVal;
      this.activeVideoEl.addEventListener('loadedmetadata', () => {
        try { this.activeVideoEl.currentTime = prevTime; } catch (_) {}
        if (!wasPaused) this.activeVideoEl.play().catch(() => {});
      }, { once: true });
      if (window.app) window.app.showToast(`화질을 ${label}(으)로 변경했습니다.`, 'success');
      this.closeMoreMenu();
    }

    toggleMoreMenu() {
      if (this.isMoreOpen) {
        this.closeMoreMenu();
      } else {
        this.openMoreMenu();
      }
    }

    openMoreMenu() {
      const item = this.getCurrentItem();
      if (!item || !this.moreSheet) return;
      this.isMoreOpen = true;
      this.isQualityMenuOpen = false;
      this.renderMoreMenu();
      if (this.moreBackdrop) this.moreBackdrop.style.display = 'block';
      this.moreSheet.style.display = 'flex';
    }

    closeMoreMenu() {
      this.isMoreOpen = false;
      this.isQualityMenuOpen = false;
      if (this.moreBackdrop) this.moreBackdrop.style.display = 'none';
      if (this.moreSheet) this.moreSheet.style.display = 'none';
    }

    renderMoreMenu() {
      const item = this.getCurrentItem();
      if (!item || !this.moreSheet || typeof this.getMoreActions !== 'function') return;

      if (this.isQualityMenuOpen) {
        const qOpts = (this.moreQualityOptions && this.moreQualityOptions.length > 0) ? this.moreQualityOptions : [];
        this.moreSheet.innerHTML = `
          <div class="sf-more-header">
            <button type="button" class="sf-more-back-btn">${SF_ICONS.back}<span>화질 선택</span></button>
          </div>
          <div class="sf-more-list">
            ${qOpts.length > 0 ? qOpts.map((q, idx) => `
              <button type="button" class="sf-more-item ${q.active ? 'active' : ''}" data-q-idx="${idx}">
                ${SF_ICONS.quality}
                <span>${esc(q.label)}</span>
              </button>
            `).join('') : '<div style="padding: 10px 12px; font-size: 12px; color: var(--text-muted);">선택 가능한 화질 정보가 없습니다.</div>'}
          </div>
        `;
        const backBtn = this.moreSheet.querySelector('.sf-more-back-btn');
        if (backBtn) {
          backBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.isQualityMenuOpen = false;
            this.renderMoreMenu();
          });
        }
        this.moreSheet.querySelectorAll('[data-q-idx]').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const q = qOpts[parseInt(btn.dataset.qIdx, 10)];
            if (q && typeof q.onSelect === 'function') q.onSelect();
          });
        });
        return;
      }

      const actions = this.getMoreActions(item, this.activeMediaMeta, this) || [];
      this.moreSheet.innerHTML = `
        <div class="sf-more-list">
          ${actions.map((act, idx) => `
            <button type="button" class="sf-more-item" data-more-idx="${idx}">
              ${SF_ICONS[act.icon] || SF_ICONS.more}
              <span>${esc(act.label)}</span>
            </button>
          `).join('')}
        </div>
      `;
      this.moreSheet.querySelectorAll('[data-more-idx]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const act = actions[parseInt(btn.dataset.moreIdx, 10)];
          if (!act) return;
          if (act.isQualityMenu) {
            this.moreQualityOptions = act.getQualities ? act.getQualities() : [];
            this.isQualityMenuOpen = true;
            this.renderMoreMenu();
          } else {
            this.closeMoreMenu();
            if (typeof act.onClick === 'function') act.onClick();
          }
        });
      });
    }

    toggleComments() {
      if (this.isCommentsOpen) {
        this.closeComments();
      } else {
        this.openComments();
      }
    }

    openComments() {
      this.isCommentsOpen = true;
      if (this.shell) this.shell.classList.add('sf-comments-open');
      this.loadCommentsForCurrent();
    }

    closeComments() {
      this.isCommentsOpen = false;
      if (this.shell) this.shell.classList.remove('sf-comments-open');
    }

    async loadCommentsForCurrent() {
      const item = this.getCurrentItem();
      if (!item || !this.commentsBody || typeof this.onLoadComments !== 'function') return;
      const seq = this.playSeq;
      if (this.commentsCountEl) this.commentsCountEl.textContent = '...';
      this.commentsBody.innerHTML = '<div class="sf-comments-empty">댓글을 불러오는 중입니다...</div>';

      try {
        const data = await this.onLoadComments(item);
        if (seq !== this.playSeq) return;
        const comments = (data && Array.isArray(data.comments)) ? data.comments : [];
        const totalCount = (data && typeof data.totalCount === 'number') ? data.totalCount : comments.length;
        if (this.commentsCountEl) {
          this.commentsCountEl.textContent = Number(totalCount).toLocaleString();
        }
        if (comments.length === 0) {
          const hint = (data && data.cboxAuthRestricted && data.commentUrl)
            ? `<div>웹 브라우저 보안 정책으로 전체 댓글을 불러오지 못했습니다.</div><a class="btn btn-sm btn-secondary" href="${esc(data.commentUrl)}" target="_blank" rel="noopener noreferrer" style="margin-top: 10px; display: inline-flex; align-items: center; gap: 5px;">${SF_ICONS.external}<span>원본 페이지에서 댓글 보기</span></a>`
            : '등록된 댓글이 없습니다.';
          this.commentsBody.innerHTML = `<div class="sf-comments-empty">${hint}</div>`;
          return;
        }
        this.commentsBody.innerHTML = comments.map(c => {
          const author = c.userName || c.author || '익명';
          const text = c.contents || c.text || '';
          const avatar = c.profileUrl || c.authorThumbnail || './static/img/favicon.png';
          const timeStr = c.regTime || c.publishedTime || '';
          const likes = c.likeCount || c.likes || 0;
          return `
            <div class="sf-comment-item">
              <img class="sf-comment-avatar" src="${esc(avatar)}" referrerpolicy="no-referrer" alt="" onerror="this.onerror=null; this.src='./static/img/favicon.png'">
              <div class="sf-comment-main">
                <div class="sf-comment-meta">
                  <span class="sf-comment-author">${esc(author)}</span>
                  ${timeStr ? `<span class="sf-comment-time">${esc(timeStr)}</span>` : ''}
                </div>
                <div class="sf-comment-text">${esc(text)}</div>
                ${likes ? `<div class="sf-comment-likes">공감 ${Number(likes).toLocaleString()}</div>` : ''}
              </div>
            </div>
          `;
        }).join('');
      } catch (e) {
        if (seq !== this.playSeq) return;
        this.commentsBody.innerHTML = '<div class="sf-comments-empty">댓글을 불러오지 못했습니다.</div>';
      }
    }
  }

  window.MobileShortformPlayer = MobileShortformPlayer;
})();
