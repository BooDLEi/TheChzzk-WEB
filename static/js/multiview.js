/* ============================================================
   더치지직 (The Chzzk) - Multi-Viewing Controller (multiview.js)
   ============================================================ */

const ICONS = {
  tv: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>`,
  volumeUp: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`,
  volumeMute: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`,
  chat: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  close: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  fullscreen: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
  rewind10: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 19 2 12 11 5 11 19"/><polygon points="22 19 13 12 22 5 22 19"/></svg>`,
  recordDot: `<svg width="12" height="12" viewBox="0 0 24 24" fill="#ef4444"><circle cx="12" cy="12" r="10"/></svg>`,
  screenRecord: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><circle cx="12" cy="10" r="3.5" fill="#ef4444" stroke="none"/></svg>`,
  recordPause: `<svg width="12" height="12" viewBox="0 0 24 24" fill="#fbbf24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
  recordResume: `<svg width="12" height="12" viewBox="0 0 24 24" fill="#10b981"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  recordStop: `<svg width="12" height="12" viewBox="0 0 24 24" fill="#f87171"><rect x="5" y="5" width="14" height="14"/></svg>`,
  arrowDownToBottom: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="7 13 12 18 17 13"/><line x1="12" y1="6" x2="12" y2="18"/><line x1="5" y1="21" x2="19" y2="21"/></svg>`,
  prevClip: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>`,
  nextClip: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>`,
  play: `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  pause: `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
  camera: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`,
  refresh: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
  expandSize: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
  shuffle: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>`,
  heart: `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
  chevronDown: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>`,
  chevronUp: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>`,
  spinner: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg>`,
  film: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>`
};

class MultiViewManager {
  constructor() {
    // Dynamic Slots: Start with single mode (1 slot) by default when empty
    this.slotCount = 1;
    this.slots = [this.createEmptySlotState(0)];
    this.targetSlotIndex = null;
    this.draggedSlotIndex = null;
    this.activeChatChannelId = null;
    this.layoutMode = 'auto'; // 'auto' (정렬 모드) | 'focus' | 'custom' (자유 모드)
    this.gridColFractions = null;
    this.gridRowFractions = null;

    // PiP Mini-Player State
    this.pipActiveSlot = null;
    this.isPiPClosedByUser = false;

    // Real-time Chat Emoticon Pack Cache
    this.channelEmojiCache = {};

    this.initElements();
    this.bindEvents();
    this.updateGridLayout();
    this.renderSlots();
    this.updateBadge();

    // Periodic live viewer count updater (every 30 seconds)
    setInterval(() => {
      this.refreshSlotViewerCounts();
    }, 30000);

    // Global Key Listener: Press 'C' for In-Slot Chat Toggle
    window.addEventListener('keydown', (e) => {
      if (e.key === 'c' || e.key === 'C') {
        const fsEl = document.fullscreenElement;
        if (fsEl && fsEl.classList.contains('player-slot')) {
          const idx = parseInt(fsEl.id.replace('slot-', ''), 10);
          if (!isNaN(idx)) {
            this.toggleSlotChat(idx);
          }
        } else {
          const activeIdx = this.slots.findIndex(s => s.active);
          if (activeIdx !== -1) {
            this.toggleSlotChat(activeIdx);
          }
        }
      }
    });
  }

  initElements() {
    this.playersGrid = document.getElementById('playersGrid');
    this.multiviewBadge = document.getElementById('multiview-badge');
    this.slotSelectionBanner = document.getElementById('slotSelectionBanner');
    this.slotSelectionText = document.getElementById('slotSelectionText');
    this.muteAllSlotsBtn = document.getElementById('muteAllSlotsBtn');
    this.slotCountDisplay = document.getElementById('slotCountDisplay');

    // Layout Mode Buttons
    this.layoutAutoBtn = document.getElementById('layoutModeEqualBtn') || document.getElementById('layoutAutoBtn');
    this.layoutFocusBtn = document.getElementById('layoutModeFocusBtn') || document.getElementById('layoutFocusBtn');
    this.layoutCustomBtn = document.getElementById('layoutModeCustomBtn') || document.getElementById('layoutCustomBtn');
    this.alignSlotsBtn = document.getElementById('alignSlotsBtn');

    // PiP Mini Player Elements
    this.pipMiniPlayer = document.getElementById('pipMiniPlayer');
    this.pipHeader = document.getElementById('pipHeader');
    this.pipTitle = document.getElementById('pipTitle');
    this.pipSlotSelect = document.getElementById('pipSlotSelect');
    this.pipVideoBody = document.getElementById('pipVideoBody');
    this.pipResizeHandle = document.getElementById('pipResizeHandle');
    this.pipMuteBtn = document.getElementById('pipMuteBtn');
    this.pipCloseBtn = document.getElementById('pipCloseBtn');
  }

  bindEvents() {
    if (this.muteAllSlotsBtn) {
      this.muteAllSlotsBtn.addEventListener('click', () => this.muteAll());
    }

    // Layout Mode Buttons
    if (this.layoutAutoBtn) {
      this.layoutAutoBtn.addEventListener('click', () => this.setLayoutMode('auto'));
    }
    if (this.layoutFocusBtn) {
      this.layoutFocusBtn.addEventListener('click', () => this.setLayoutMode('focus'));
    }
    if (this.layoutCustomBtn) {
      this.layoutCustomBtn.addEventListener('click', () => this.setLayoutMode('custom'));
    }
    if (this.alignSlotsBtn) {
      this.alignSlotsBtn.addEventListener('click', () => this.alignCustomSlots());
    }

    // PiP Mini Player Events
    if (this.pipMuteBtn) {
      this.pipMuteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePiPMute();
      });
    }

    if (this.pipCloseBtn) {
      this.pipCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.isPiPClosedByUser = true;
        this.hidePiP();
      });
    }

    if (this.pipVideoBody) {
      this.pipVideoBody.addEventListener('click', () => {
        if (window.app) window.app.switchTab('multiview');
      });
    }

    // Fullscreen idle watcher listener (Requirement 1: 3초 후 UI 자동 숨김)
    document.addEventListener('fullscreenchange', () => {
      const fsEl = document.fullscreenElement;
      if (fsEl && fsEl.classList.contains('player-slot')) {
        this.startFullscreenIdleWatcher(fsEl);
      } else {
        this.stopFullscreenIdleWatcher();
      }
    });

    // Listen for messages from YouTube Ad-Free Embed Player
    window.addEventListener('message', (e) => {
      const data = e.data;
      if (!data || !data.type || !String(data.type).startsWith('yt_')) return;

      // Resolve slot by matching iframe contentWindow first (immune to slot swaps/reorders)
      let slotIndex = this.slots.findIndex(s => s.active && s.type === 'youtube' && s.iframeEl && s.iframeEl.contentWindow === e.source);
      if (slotIndex === -1 && data.videoId) {
        slotIndex = this.slots.findIndex(s => s.active && s.type === 'youtube' && s.videoId === data.videoId);
      }
      if (slotIndex === -1 && typeof data.slotIndex === 'number') {
        slotIndex = data.slotIndex;
      }
      const slot = this.slots[slotIndex];
      if (!slot || slot.type !== 'youtube') return;

      if (data.type === 'yt_mousemove') {
        if (this._fsMouseMoveHandler) this._fsMouseMoveHandler();
        return;
      }
      if (data.type === 'yt_dblclick') {
        this.toggleFullscreen(slotIndex);
        return;
      }

      if (data.type === 'yt_timeupdate') {
        const wasLive = !!slot.isLive;
        slot.isLive = !!data.isLive;
        slot.currentTime = data.currentTime || 0;
        slot.duration = data.duration || 0;

        if (!wasLive && slot.isLive) {
          const chatTitleEl = document.getElementById(`slot-chat-title-${slotIndex}`);
          if (chatTitleEl) {
            chatTitleEl.textContent = `${slot.channelName || 'YouTube'} 실시간 채팅`;
          }
          const chatBtnEl = document.getElementById(`slot-chat-toggle-btn-${slotIndex}`);
          if (chatBtnEl) {
            chatBtnEl.title = '유튜브 실시간 채팅 켜기/끄기 (단축키 C)';
          }
          if (slot.chatOpen && !slot.ytLiveChatActive) {
            this.loadYouTubeLiveChat(slotIndex);
          }
        }

        const timeEl = document.getElementById(`slot-yt-time-${slotIndex}`);
        const sliderEl = document.getElementById(`slot-yt-slider-${slotIndex}`);
        if (timeEl) {
          if (slot.isLive) {
            timeEl.innerHTML = '<span style="color:#ef4444;font-weight:800;display:inline-flex;align-items:center;gap:3px;"><span style="width:6px;height:6px;border-radius:50%;background:#ef4444;display:inline-block;"></span> LIVE</span>';
          } else if (slot.duration > 0) {
            timeEl.textContent = `${this.formatSecs(slot.currentTime)} / ${this.formatSecs(slot.duration)}`;
          }
        }
        if (sliderEl && !sliderEl._isDragging) {
          if (slot.isLive) {
            sliderEl.value = 100;
            sliderEl.disabled = true;
          } else if (slot.duration > 0) {
            sliderEl.disabled = false;
            sliderEl.value = (slot.currentTime / slot.duration) * 100;
          }
        }
        if (slot.ytSubtitlesEnabled && slot.ytSubtitleCues && slot.ytSubtitleCues.length > 0) {
          this.updateYouTubeSubtitleOverlay(slotIndex);
        }
      } else if (data.type === 'yt_statechange') {
        const btn = document.getElementById(`slot-play-btn-${slotIndex}`);
        if (data.state === 'playing') {
          slot.isPlaying = true;
          if (slot.ytEnded) {
            slot.ytEnded = false;
            const endEl = document.getElementById(`slot-yt-endscreen-${slotIndex}`);
            if (endEl) endEl.style.display = 'none';
          }
          if (btn) btn.innerHTML = ICONS.pause;
        } else if (data.state === 'paused') {
          slot.isPlaying = false;
          if (btn) btn.innerHTML = ICONS.play;
        } else if (data.state === 'ended') {
          if (slot.ytLoop) {
            this.replayYouTubeSlot(slotIndex);
            return;
          }
          // Requirement 2: 재생목록 다음 곡 자동 연속 재생
          if (slot.playlistItems && slot.playlistItems.length > 0 && typeof slot.playlistIndex === 'number') {
            const nextIdx = slot.playlistIndex + 1;
            if (nextIdx < slot.playlistItems.length) {
              this.playPlaylistItem(slotIndex, nextIdx);
              return;
            }
          }
          slot.isPlaying = false;
          slot.ytEnded = true;
          if (btn) btn.innerHTML = ICONS.play;
          this.showYouTubeEndScreen(slotIndex);
        }
      } else if (data.type === 'yt_ready') {
        const masterVol = (window.app && typeof window.app.masterYTVolume === 'number') ? window.app.masterYTVolume : 1.0;
        const effectivelyMuted = slot.muted || (window.app && window.app.masterYTMuted);
        try {
          if (slot.iframeEl && slot.iframeEl.contentWindow) {
            slot.iframeEl.contentWindow.postMessage({
              action: effectivelyMuted ? 'mute' : 'unmute',
              slotIndex: slotIndex
            }, '*');
            if (!effectivelyMuted) {
              slot.iframeEl.contentWindow.postMessage({
                action: 'setVolume',
                slotIndex: slotIndex,
                volume: Math.round(slot.volume * masterVol * 100)
              }, '*');
            }
            if (slot.ytLoop) {
              slot.iframeEl.contentWindow.postMessage({
                action: 'setLoop',
                slotIndex: slotIndex,
                loop: true
              }, '*');
            }
            if (slot.ytQuality && slot.ytQuality != -1) {
              slot.iframeEl.contentWindow.postMessage({
                action: 'setQuality',
                slotIndex: slotIndex,
                quality: slot.ytQuality
              }, '*');
            }
            if (!slot.ytSubtitlesEnabled) {
              slot.iframeEl.contentWindow.postMessage({
                action: 'setCaptions',
                slotIndex: slotIndex,
                enabled: false
              }, '*');
            }
          }
        } catch (err) {}
        this.updateSlotAudioUI(slotIndex);
      } else if (data.type === 'yt_autoplay_muted') {
        slot.muted = true;
        this.updateSlotAudioUI(slotIndex);
      }
    });

    // Keyboard Shortcut 'C' to toggle slot chat
    document.addEventListener('keydown', (e) => {
      if (e.target.matches('input, textarea, select')) return;
      if (e.key === 'c' || e.key === 'C') {
        if (window.app && window.app.currentTab === 'multiview') {
          const activeSlot = this.slots.find(s => s.active && !s.muted) || this.slots.find(s => s.active);
          if (activeSlot) {
            this.toggleSlotChat(activeSlot.index);
          }
        }
      }
    });

    // Freeform Canvas Drop Listener (Dropping on empty workspace space)
    if (this.playersGrid) {
      this.playersGrid.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });

      this.playersGrid.addEventListener('drop', (e) => {
        if (this.draggedSlotIndex === null) return;
        const fromIndex = this.draggedSlotIndex;
        const slot = this.slots[fromIndex];
        if (!slot) return;

        if (this.layoutMode !== 'custom') {
          this.setLayoutMode('custom');
        }

        const gridRect = this.playersGrid.getBoundingClientRect();
        const dropX = e.clientX - gridRect.left - (this.dragOffsetX || 0) + this.playersGrid.scrollLeft;
        const dropY = e.clientY - gridRect.top - (this.dragOffsetY || 0) + this.playersGrid.scrollTop;

        slot.x = Math.max(0, Math.round(dropX));
        slot.y = Math.max(0, Math.round(dropY));

        const slotEl = document.getElementById(`slot-${fromIndex}`);
        if (slotEl) {
          slotEl.style.position = 'absolute';
          slotEl.style.left = `${slot.x}px`;
          slotEl.style.top = `${slot.y}px`;
          if (slot.w) slotEl.style.width = `${slot.w}px`;
          if (slot.h) slotEl.style.height = `${slot.h}px`;
        }

        this.updateGridLayout();
      });
    }

    this.initPiPControls();
  }

  // ================= Layout Mode & Dynamic Grid =================
  setLayoutMode(mode) {
    if (mode !== 'custom' && typeof this.exitTouchSlotEditMode === 'function') {
      this.exitTouchSlotEditMode();
    }
    this.layoutMode = mode;
    [this.layoutAutoBtn, this.layoutFocusBtn, this.layoutCustomBtn].forEach(btn => {
      if (btn) btn.classList.remove('active');
    });

    if (mode === 'auto' && this.layoutAutoBtn) this.layoutAutoBtn.classList.add('active');
    if (mode === 'focus' && this.layoutFocusBtn) this.layoutFocusBtn.classList.add('active');
    if (mode === 'custom' && this.layoutCustomBtn) this.layoutCustomBtn.classList.add('active');

    if (mode === 'custom') {
      this.initCustomPositionsFromCurrent();
    }

    this.updateGridLayout();

    // Check if slots already exist in DOM. If so, update styles in-place to NEVER reload iframes/videos (User Request 2)
    let allSlotsExist = true;
    for (let i = 0; i < this.slotCount; i++) {
      if (!document.getElementById(`slot-${i}`)) {
        allSlotsExist = false;
        break;
      }
    }
    if (allSlotsExist && this.slotCount > 0) {
      this.applySlotLayoutStyles();
    } else {
      this.renderSlots();
    }
    // No toast notification on layout mode change (Request 5)
  }

  applySlotLayoutStyles() {
    if (!this.playersGrid) return;
    for (let i = 0; i < this.slotCount; i++) {
      const slot = this.slots[i];
      slot.index = i;
      const slotEl = slot.slotEl || document.getElementById(`slot-${i}`);
      if (!slotEl) continue;

      const spanClass = slot.spanMode && slot.spanMode !== '1x1' ? `slot-span-${slot.spanMode}` : '';
      const pipClass = (this.pipActiveSlot === slot && slot.type === 'youtube') ? 'pip-hosted-slot' : '';
      const editClass = (this.layoutMode === 'custom' && this.touchEditingSlotIndex === i) ? 'touch-slot-edit-mode' : '';
      slotEl.className = `player-slot ${slot.active ? 'active-stream' : ''} ${spanClass} ${pipClass} ${editClass}`.trim();
      slotEl.id = `slot-${i}`;
      slotEl.style.order = `${i}`;

      if (this.layoutMode === 'custom') {
        slotEl.style.position = 'absolute';
        if (slot.x !== null && slot.y !== null && slot.w !== null && slot.h !== null) {
          slotEl.style.left = `${slot.x}px`;
          slotEl.style.top = `${slot.y}px`;
          slotEl.style.width = `${slot.w}px`;
          slotEl.style.height = `${slot.h}px`;
        } else {
          const defW = 380;
          const defH = 240;
          const defX = 14 + (i % 3) * (defW + 12);
          const defY = 14 + Math.floor(i / 3) * (defH + 12);
          slot.w = defW; slot.h = defH; slot.x = defX; slot.y = defY;
          slotEl.style.left = `${defX}px`;
          slotEl.style.top = `${defY}px`;
          slotEl.style.width = `${defW}px`;
          slotEl.style.height = `${defH}px`;
        }
      } else {
        slotEl.style.position = '';
        slotEl.style.left = '';
        slotEl.style.top = '';
        slotEl.style.width = '';
        slotEl.style.height = '';
        if (this.layoutMode === 'focus') {
          const focusData = this.getFocusLayout(this.slotCount);
          if (focusData.slots[i]) {
            slotEl.style.gridColumn = focusData.slots[i].col;
            slotEl.style.gridRow = focusData.slots[i].row;
          }
        } else {
          slotEl.style.gridColumn = '';
          slotEl.style.gridRow = '';
        }
      }
    }
  }

  initCustomPositionsFromCurrent() {
    if (!this.playersGrid) return;
    const gridRect = this.playersGrid.getBoundingClientRect();
    const isTouchOrMobile = document.documentElement.classList.contains('is-touch-mobile') || document.documentElement.classList.contains('is-android-apk') || window.innerWidth <= 960;
    const availW = Math.max(260, Math.round((this.playersGrid.clientWidth || window.innerWidth) - 24));
    for (let i = 0; i < this.slotCount; i++) {
      const slot = this.slots[i];
      const slotEl = slot.slotEl || document.getElementById(`slot-${i}`);
      if (slotEl && slot.w === null && slot.h === null) {
        const rect = slotEl.getBoundingClientRect();
        if (rect.width > 20 && rect.height > 20) {
          slot.w = Math.round(rect.width);
          slot.h = Math.round(rect.height);
          slot.x = Math.max(10, Math.round(rect.left - gridRect.left + this.playersGrid.scrollLeft));
          slot.y = Math.max(10, Math.round(rect.top - gridRect.top + this.playersGrid.scrollTop));
          continue;
        }
      }
      if (slot.w === null || slot.h === null) {
        if (isTouchOrMobile) {
          const w = Math.min(420, availW);
          const h = Math.max(160, Math.round(w * 9 / 16));
          slot.w = w;
          slot.h = h;
          slot.x = 12;
          slot.y = 12 + i * (h + 12);
        } else {
          slot.w = 380;
          slot.h = 240;
          slot.x = (i % 3) * 392 + 14;
          slot.y = Math.floor(i / 3) * 252 + 14;
        }
      }
    }
  }

  alignCustomSlots() {
    if (this.slotCount <= 0) return;

    const count = this.slotCount;
    let cols = 1;
    if (count === 1) cols = 1;
    else if (count === 2) cols = 2;
    else if (count <= 4) cols = 2;
    else if (count <= 6) cols = 3;
    else if (count <= 9) cols = 3;
    else if (count <= 12) cols = 4;
    else cols = Math.ceil(Math.sqrt(count));
    const rows = Math.max(1, Math.ceil(count / cols));

    // Reset grid fractions for tidy alignment
    this.gridColFractions = new Array(cols).fill(1.0);
    this.gridRowFractions = new Array(rows).fill(1.0);

    const gridWidth = (this.playersGrid && this.playersGrid.clientWidth > 200) ? this.playersGrid.clientWidth : 1200;
    const gridHeight = (this.playersGrid && this.playersGrid.clientHeight > 200) ? this.playersGrid.clientHeight : 700;
    const gap = 8;
    const pad = 10;

    const availW = Math.max(100, gridWidth - pad * 2 - (cols - 1) * gap);
    const availH = Math.max(100, gridHeight - pad * 2 - (rows - 1) * gap);
    const colW = Math.floor(availW / cols);
    const rowH = Math.floor(availH / rows);

    for (let i = 0; i < count; i++) {
      const slot = this.slots[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      slot.x = pad + col * (colW + gap);
      slot.y = pad + row * (rowH + gap);
      slot.w = colW;
      slot.h = rowH;
    }

    if (this.layoutMode === 'custom') {
      this.playersGrid.style.minWidth = '100%';
      this.playersGrid.style.minHeight = '100%';
      this.applySlotLayoutStyles();
    } else {
      this.updateGridLayout();
    }

    if (window.app && typeof window.app.showToast === 'function') {
      window.app.showToast('슬롯들이 한 화면에 깔끔하게 정렬되었습니다.', 'info');
    }
  }

  preventOverlap(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot || slot.x === null || slot.y === null || slot.w === null || slot.h === null) return;

    const gap = 12;
    let moved = false;
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i < this.slotCount; i++) {
        if (i === slotIndex) continue;
        const other = this.slots[i];
        if (other.x === null || other.y === null || other.w === null || other.h === null) continue;

        const isOverlap = !(
          slot.x + slot.w <= other.x ||
          slot.x >= other.x + other.w ||
          slot.y + slot.h <= other.y ||
          slot.y >= other.y + other.h
        );

        if (isOverlap) {
          moved = true;
          const gridWidth = (this.playersGrid && this.playersGrid.clientWidth > 400) ? this.playersGrid.clientWidth : 1200;
          if (other.x + other.w + gap + slot.w <= gridWidth + 200) {
            slot.x = other.x + other.w + gap;
          } else {
            slot.x = other.x;
            slot.y = other.y + other.h + gap;
          }
        }
      }
    }
    if (moved) {
      const slotEl = slot.slotEl || document.getElementById(`slot-${slotIndex}`);
      if (slotEl && this.layoutMode === 'custom') {
        slotEl.style.left = `${slot.x}px`;
        slotEl.style.top = `${slot.y}px`;
      }
    }
  }

  isMobilePortraitMode() {
    const isPortrait = window.innerHeight > window.innerWidth;
    const isMobile = (window.app && typeof window.app.isMobileUIMode === 'function')
      ? window.app.isMobileUIMode()
      : (document.documentElement.classList.contains('is-mobile-ui')
         || document.documentElement.classList.contains('is-android-apk')
         || window.innerWidth <= 960
         || (window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches && window.innerWidth <= 1366));
    return isMobile && isPortrait;
  }

  getFocusLayout(count) {
    if (this.isMobilePortraitMode()) {
      if (count <= 1) {
        return {
          isPortraitFocus: true,
          cols: 1,
          rows: 1,
          colFractions: [1.0],
          rowFractions: [1.0],
          slots: [{ col: '1 / -1', row: '1' }]
        };
      }
      const subRows = Math.ceil((count - 1) / 2);
      const slots = [{ col: '1 / span 2', row: '1' }];
      for (let i = 1; i < count; i++) {
        slots.push({
          col: `${((i - 1) % 2) + 1}`,
          row: `${2 + Math.floor((i - 1) / 2)}`
        });
      }
      return {
        isPortraitFocus: true,
        cols: 2,
        rows: 1 + subRows,
        colFractions: [1.0, 1.0],
        rowFractions: [1.85, ...new Array(subRows).fill(1.0)],
        slots
      };
    }

    if (count <= 1) {
      return {
        cols: 1,
        rows: 1,
        colFractions: [1.0],
        rowFractions: [1.0],
        slots: [{ col: '1', row: '1' }]
      };
    }
    if (count === 2) {
      // [ 메인 (70%) ] [ 서브 1 (30%) ]
      return {
        cols: 2,
        rows: 1,
        colFractions: [2.5, 1.0],
        rowFractions: [1.0],
        slots: [
          { col: '1', row: '1' },
          { col: '2', row: '1' }
        ]
      };
    }
    if (count === 3) {
      // 2열 2행: 메인 1열 2행 전체(높이 100%), 우측에 서브 2개 위/아래
      return {
        cols: 2,
        rows: 2,
        colFractions: [2.5, 1.0],
        rowFractions: [1.0, 1.0],
        slots: [
          { col: '1', row: '1 / span 2' },
          { col: '2', row: '1' },
          { col: '2', row: '2' }
        ]
      };
    }
    if (count === 4) {
      // 2열 3행: 메인 1열 3행 전체(높이 100%), 우측에 서브 3개 위/중/아래
      return {
        cols: 2,
        rows: 3,
        colFractions: [2.8, 1.0],
        rowFractions: [1.0, 1.0, 1.0],
        slots: [
          { col: '1', row: '1 / span 3' },
          { col: '2', row: '1' },
          { col: '2', row: '2' },
          { col: '2', row: '3' }
        ]
      };
    }
    if (count === 5) {
      // 3열 2행: 메인 1열 2행 전체(좌측 50%), 우측 2열 x 2행에 서브 4개 2x2 격자
      return {
        cols: 3,
        rows: 2,
        colFractions: [2.0, 1.0, 1.0],
        rowFractions: [1.0, 1.0],
        slots: [
          { col: '1', row: '1 / span 2' },
          { col: '2', row: '1' },
          { col: '3', row: '1' },
          { col: '2', row: '2' },
          { col: '3', row: '2' }
        ]
      };
    }
    if (count === 6) {
      // 3열 3행 L-shape: 메인 2x2, 우측에 2개 + 하단에 3개 (총 5개 서브가 9칸을 100% 빈틈없이 채움!)
      return {
        cols: 3,
        rows: 3,
        colFractions: [1.25, 1.25, 1.0],
        rowFractions: [1.25, 1.25, 1.0],
        slots: [
          { col: '1 / span 2', row: '1 / span 2' },
          { col: '3', row: '1' },
          { col: '3', row: '2' },
          { col: '1', row: '3' },
          { col: '2', row: '3' },
          { col: '3', row: '3' }
        ]
      };
    }
    if (count === 7) {
      // 4열 3행: 메인 2열 3행 전체(좌측 50%), 우측 2열 x 3행에 서브 6개 꽉 참!
      const slots = [{ col: '1 / span 2', row: '1 / span 3' }];
      for (let r = 1; r <= 3; r++) {
        for (let c = 3; c <= 4; c++) {
          slots.push({ col: `${c}`, row: `${r}` });
        }
      }
      return {
        cols: 4,
        rows: 3,
        colFractions: [1.5, 1.5, 1.0, 1.0],
        rowFractions: [1.0, 1.0, 1.0],
        slots
      };
    }
    if (count <= 9) {
      // 4열 3행 (총 12칸): 메인 2x2 (4칸), 남은 8칸에 서브 7~8개 완벽 수용
      const remainingCells = [
        { c: 3, r: 1 }, { c: 4, r: 1 },
        { c: 3, r: 2 }, { c: 4, r: 2 },
        { c: 1, r: 3 }, { c: 2, r: 3 }, { c: 3, r: 3 }, { c: 4, r: 3 }
      ];
      const slots = [{ col: '1 / span 2', row: '1 / span 2' }];
      for (let i = 1; i < count; i++) {
        const cell = remainingCells[i - 1];
        slots.push({ col: `${cell.c}`, row: `${cell.r}` });
      }
      return {
        cols: 4,
        rows: 3,
        colFractions: [1.35, 1.35, 1.0, 1.0],
        rowFractions: [1.3, 1.3, 1.0],
        slots
      };
    }

    // count >= 10: 5열 x 4행 (총 20칸): 메인 3x3 (9칸), 남은 11칸에 서브 슬롯들
    const cols = count <= 12 ? 5 : 6;
    const rows = 4;
    const mainCols = 3;
    const mainRows = 3;
    const freeCells = [];
    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        if (r <= mainRows && c <= mainCols) continue;
        freeCells.push({ c, r });
      }
    }
    const slots = [{ col: `1 / span ${mainCols}`, row: `1 / span ${mainRows}` }];
    for (let i = 1; i < count; i++) {
      if (freeCells[i - 1]) {
        slots.push({ col: `${freeCells[i - 1].c}`, row: `${freeCells[i - 1].r}` });
      } else {
        slots.push({ col: 'auto', row: 'auto' });
      }
    }
    const colFractions = new Array(cols).fill(1.0);
    colFractions[0] = 1.3; colFractions[1] = 1.3; colFractions[2] = 1.3;
    const rowFractions = new Array(rows).fill(1.0);
    rowFractions[0] = 1.2; rowFractions[1] = 1.2; rowFractions[2] = 1.2;
    return { cols, rows, colFractions, rowFractions, slots };
  }

  updateGridLayout() {
    const count = this.slotCount;
    if (!this.playersGrid) return;

    if (this.layoutMode === 'custom') {
      this.playersGrid.className = 'players-grid mode-custom';
      this.playersGrid.style.display = 'block';
      this.playersGrid.style.position = 'relative';
      this.playersGrid.style.gridTemplateColumns = 'none';
      this.playersGrid.style.gridTemplateRows = 'none';
      this.playersGrid.style.width = '100%';
      this.playersGrid.style.height = '100%';
      this.playersGrid.style.minWidth = '100%';
      this.playersGrid.style.minHeight = '100%';

      for (let i = 0; i < count; i++) {
        const slot = this.slots[i];
        const slotEl = slot.slotEl || document.getElementById(`slot-${i}`);
        if (slotEl) {
          slotEl.style.gridColumn = '';
          slotEl.style.gridRow = '';
        }
      }

      if (this.slotCountDisplay) {
        this.slotCountDisplay.textContent = `자유 모드: 슬롯 ${count}개`;
      }
      return;
    }

    // Auto or Focus Mode (정렬 모드)
    this.playersGrid.style.display = 'grid';
    this.playersGrid.style.position = '';
    this.playersGrid.style.minWidth = '100%';
    this.playersGrid.style.minHeight = '100%';
    this.playersGrid.style.width = '100%';
    this.playersGrid.style.height = '100%';
    this.playersGrid.style.overflow = 'hidden';

    // 1. Focus Mode (메인 1대형): N개의 슬롯이 하나도 잘리지 않고 모두 한 화면에 표시되도록 정밀 배치
    if (this.layoutMode === 'focus') {
      const focusData = this.getFocusLayout(count);

      if (focusData.isPortraitFocus) {
        this.playersGrid.className = 'players-grid dynamic-grid mode-focus mode-focus-portrait';
        this.playersGrid.style.height = 'auto';
        this.playersGrid.style.minHeight = '0';
        this.playersGrid.style.overflow = 'visible';
        this.playersGrid.style.gridTemplateColumns = focusData.cols === 1 ? 'minmax(0, 1fr)' : 'repeat(2, minmax(0, 1fr))';
        this.playersGrid.style.gridTemplateRows = 'auto';
      } else {
        this.playersGrid.className = 'players-grid dynamic-grid mode-focus';
        this.playersGrid.style.gridTemplateColumns = focusData.colFractions.map(f => `${f.toFixed(3)}fr`).join(' ');
        this.playersGrid.style.gridTemplateRows = focusData.rowFractions.map(f => `${f.toFixed(3)}fr`).join(' ');
      }

      // 슬롯별 위치 명시적 매핑 (작은 슬롯 잘림 문제 원천 차단)
      for (let i = 0; i < count; i++) {
        const slot = this.slots[i];
        const slotEl = slot.slotEl || document.getElementById(`slot-${i}`);
        if (slotEl && focusData.slots[i]) {
          slotEl.style.gridColumn = focusData.slots[i].col;
          slotEl.style.gridRow = focusData.slots[i].row;
        }
      }

      if (this.slotCountDisplay) {
        this.slotCountDisplay.textContent = count <= 1 ? `메인 1대형: 슬롯 1개` : `메인 1대형: 슬롯 ${count}개 (메인 1 + 보조 ${count - 1}개)`;
      }
      return;
    }

    // 2. Auto mode (Equal / Grid)
    let cols = 1;
    if (count === 1) cols = 1;
    else if (count === 2) cols = 2;
    else if (count <= 4) cols = 2;
    else if (count <= 6) cols = 3;
    else if (count <= 9) cols = 3;
    else if (count <= 12) cols = 4;
    else cols = Math.ceil(Math.sqrt(count));

    const rows = Math.max(1, Math.ceil(count / cols));
    this.playersGrid.className = 'players-grid dynamic-grid mode-auto';

    // Reset any explicit gridColumn / gridRow used by focus mode
    for (let i = 0; i < count; i++) {
      const slot = this.slots[i];
      const slotEl = slot.slotEl || document.getElementById(`slot-${i}`);
      if (slotEl) {
        slotEl.style.gridColumn = '';
        slotEl.style.gridRow = '';
      }
    }

    // Apply proportional column and row fractions (Requirement 1: 슬롯이 붙어있으면서 크기조절 & 한 화면 내 100% 수용)
    if (this.gridColFractions && this.gridColFractions.length === cols) {
      this.playersGrid.style.gridTemplateColumns = this.gridColFractions.map(f => `${f.toFixed(3)}fr`).join(' ');
    } else {
      this.gridColFractions = new Array(cols).fill(1.0);
      this.playersGrid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    }

    if (this.gridRowFractions && this.gridRowFractions.length === rows) {
      this.playersGrid.style.gridTemplateRows = this.gridRowFractions.map(f => `${f.toFixed(3)}fr`).join(' ');
    } else {
      this.gridRowFractions = new Array(rows).fill(1.0);
      this.playersGrid.style.gridTemplateRows = `repeat(${rows}, minmax(0, 1fr))`;
    }

    if (this.slotCountDisplay) {
      this.slotCountDisplay.textContent = count === 1 ? `정렬 모드: 슬롯 1개` : `정렬 모드: 슬롯 ${count}개 (${cols}x${rows})`;
    }
  }

  addNewSlot(showToast = false) {
    const newIdx = this.slots.length;
    const newSlot = this.createEmptySlotState(newIdx);

    if (this.layoutMode === 'custom') {
      let maxX = 14;
      let maxY = 14;
      if (this.slots.length > 0) {
        const last = this.slots[this.slots.length - 1];
        const w = last.w || 380;
        const h = last.h || 240;
        const x = last.x !== null ? last.x : 14;
        const y = last.y !== null ? last.y : 14;
        const gridWidth = this.playersGrid ? this.playersGrid.clientWidth : 1200;
        if (x + w * 2 + 20 < gridWidth) {
          maxX = x + w + 12;
          maxY = y;
        } else {
          maxX = 14;
          maxY = y + h + 12;
        }
      }
      newSlot.w = 380;
      newSlot.h = 240;
      newSlot.x = maxX;
      newSlot.y = maxY;
    }

    this.slots.push(newSlot);
    this.slotCount = this.slots.length;

    this.updateGridLayout();
    this.renderSlots();
    this.updateBadge();
  }

  removeLastEmptySlot() {
    if (this.slotCount <= 1) {
      if (window.app) window.app.showToast('최소 1개(단일) 슬롯은 유지됩니다.', 'info');
      return;
    }

    // Find the last inactive slot
    let emptyIdx = -1;
    for (let i = this.slots.length - 1; i >= 0; i--) {
      if (!this.slots[i].active) {
        emptyIdx = i;
        break;
      }
    }

    if (emptyIdx !== -1) {
      const removed = this.slots.splice(emptyIdx, 1)[0];
      this.destroySlotStream(removed);
      this.slots.forEach((s, idx) => { s.index = idx; });
      this.slotCount = this.slots.length;

      this.updateGridLayout();
      this.renderSlots();
      this.updateBadge();
    } else {
      if (window.app) window.app.showToast('비어있는 슬롯이 없습니다. 슬롯 우측 상단 [✕] 버튼을 눌러 방송을 닫으면 슬롯이 제거됩니다.', 'info');
    }
  }

  removeSpecificSlot(slotIndex) {
    if (this.slotCount <= 1) {
      if (window.app) window.app.showToast('최소 1개(단일) 슬롯은 유지됩니다.', 'info');
      return;
    }
    if (slotIndex < 0 || slotIndex >= this.slots.length) return;
    const removed = this.slots.splice(slotIndex, 1)[0];
    this.destroySlotStream(removed);
    this.slots.forEach((s, idx) => { s.index = idx; });
    this.slotCount = this.slots.length;

    this.updateGridLayout();
    this.renderSlots();
    this.updateBadge();
  }

  clearAllSlots(skipConfirm = false) {
    if (!skipConfirm) {
      if (!confirm('모든 슬롯을 비우고 초기 상태(1개 슬롯)로 되돌리시겠습니까?')) {
        return;
      }
    }
    this.slots.forEach(s => {
      this.destroySlotStream(s);
      if (s.slotEl) {
        s.slotEl.remove();
        s.slotEl = null;
      }
    });
    this.slots = [this.createEmptySlotState(0)];
    this.slotCount = 1;

    this.updateGridLayout();
    this.renderSlots();
    this.updateBadge();
  }

  createEmptySlotState(index) {
    return {
      index,
      slotEl: null,
      _chatKey: null,
      type: 'live',       // 'live' | 'vod' | 'clip' | 'youtube'
      channelId: null,
      channelName: null,
      title: null,
      streamUrl: null,
      videoNo: null,
      clipUID: null,
      clipList: [],
      clipIndex: -1,
      videoId: null,
      iframeEl: null,
      isPlaying: true,
      duration: 0,
      currentTime: 0,
      hls: null,
      videoEl: null,
      muted: true,
      volume: 1.0,
      active: false,
      hasError: false,
      errorMessage: null,
      lastChannelId: null,
      lastChannelName: null,
      lastTitle: null,
      lastType: null,
      lastVodNo: null,
      lastYtVideoId: null,
      lastClipData: null,
      recordJobId: null,
      recordStatus: null, // 'recording', 'paused', null
      isScreenRecording: false,
      screenRecorder: null,
      screenChunks: [],
      screenRecSecs: 0,
      screenRecTimer: null,
      spanMode: '1x1',    // '1x1' | '2x1' | '2x2'
      chatOpen: false,
      chatWidth: 250,
      chatFontSize: 12,
      autoScroll: true,
      chatHistory: [],
      chatSocket: null,
      chatPingTimer: null,
      vodChatMessages: [],
      vodChatDisplayedIndex: 0,
      vodChatNextTime: 0,
      vodChatFetchedUpToMs: 0,
      vodChatLastSyncMs: 0,
      vodChatFetching: false,
      vodChatTimer: null,
      x: null,
      y: null,
      w: null,
      h: null
    };
  }

  renderSlots() {
    if (!this.playersGrid) return;

    // 1. Remove any stale slot DOM elements that are no longer in this.slots
    const activeSlotEls = new Set(this.slots.slice(0, this.slotCount).map(s => s.slotEl).filter(Boolean));
    Array.from(this.playersGrid.querySelectorAll('.player-slot')).forEach(el => {
      if (!activeSlotEls.has(el)) {
        el.remove();
      }
    });

    // 2. Create or update each slot's DOM element in-place without detaching media (videoEl / iframeEl)
    for (let i = 0; i < this.slotCount; i++) {
      const slot = this.slots[i];
      slot.index = i;

      let slotEl = slot.slotEl;
      if (!slotEl || !this.playersGrid.contains(slotEl)) {
        slotEl = document.createElement('div');
        slotEl.draggable = false;
        slotEl.innerHTML = `
          <div class="slot-empty-wrapper" style="display: none; flex: 1; width: 100%; height: 100%;"></div>
          <div class="slot-video-area" style="display: none;">
            <div class="video-container" style="width: 100%; height: 100%; position: relative;">
              <div class="slot-ui-layer" style="display: contents;"></div>
            </div>
          </div>
          <div class="slot-chat-wrapper" style="display: contents;"></div>
          <div class="slot-playlist-wrapper" style="display: contents;"></div>
          <div class="slot-related-wrapper" style="display: contents;"></div>
        `;

        // 8-Direction Invisible Resize Handles (Hit-areas on all borders and corners, no visible marks)
        const resizeDirections = [
          { dir: 'n', cls: 'rh-top' },
          { dir: 's', cls: 'rh-bottom' },
          { dir: 'w', cls: 'rh-left' },
          { dir: 'e', cls: 'rh-right' },
          { dir: 'nw', cls: 'rh-tl' },
          { dir: 'ne', cls: 'rh-tr' },
          { dir: 'sw', cls: 'rh-bl' },
          { dir: 'se', cls: 'rh-br' }
        ];
        resizeDirections.forEach(r => {
          const handle = document.createElement('div');
          handle.className = `resize-handle ${r.cls}`;
          handle.dataset.dir = r.dir;
          slotEl.appendChild(handle);
          this.initMultiDirectionResize(handle, slot, r.dir);
        });

        // Slot double-click for fullscreen toggle (Requirement 3)
        const videoArea = slotEl.querySelector('.slot-video-area');
        if (videoArea) {
          videoArea.addEventListener('dblclick', (e) => {
            if (e.target.closest('button, input, select, a, .slot-overlay-top-right, .slot-ctrls-left, .slot-ctrls-right, .slot-yt-endscreen, .slot-ctrl-btn, .slot-chat-column, .resize-handle')) {
              return;
            }
            this.toggleFullscreen(slot.index);
          });
        }
        slotEl.addEventListener('dblclick', (e) => {
          if (document.fullscreenElement === slotEl) {
            if (e.target.closest('button, input, select, a, .slot-overlay-top-right, .slot-ctrls-left, .slot-ctrls-right, .slot-yt-endscreen, .slot-ctrl-btn, .slot-chat-column, .resize-handle')) {
              return;
            }
            this.toggleFullscreen(slot.index);
          }
        });

        // Pointer-based live dragging & center swap / edge dock / freeform move
        this.setupSlotPointerDrag(slotEl, slot);
        this.setupSlotTouchGestures(slotEl, slot);

        this.playersGrid.appendChild(slotEl);
        slot.slotEl = slotEl;
      }

      const spanClass = slot.spanMode && slot.spanMode !== '1x1' ? `slot-span-${slot.spanMode}` : '';
      const pipClass = (this.pipActiveSlot === slot && slot.type === 'youtube') ? 'pip-hosted-slot' : '';
      const editClass = (this.layoutMode === 'custom' && this.touchEditingSlotIndex === i) ? 'touch-slot-edit-mode' : '';
      slotEl.className = `player-slot ${slot.active ? 'active-stream' : ''} ${spanClass} ${pipClass} ${editClass}`.trim();
      slotEl.id = `slot-${i}`;
      slotEl.style.order = `${i}`;

      // Apply custom position and size if in freeform custom mode
      if (this.layoutMode === 'custom') {
        slotEl.style.position = 'absolute';
        if (slot.x !== null && slot.y !== null && slot.w !== null && slot.h !== null) {
          slotEl.style.left = `${slot.x}px`;
          slotEl.style.top = `${slot.y}px`;
          slotEl.style.width = `${slot.w}px`;
          slotEl.style.height = `${slot.h}px`;
        } else {
          const defW = 380;
          const defH = 240;
          const defX = 14 + (i % 3) * (defW + 12);
          const defY = 14 + Math.floor(i / 3) * (defH + 12);
          slot.w = defW; slot.h = defH; slot.x = defX; slot.y = defY;
          slotEl.style.left = `${defX}px`;
          slotEl.style.top = `${defY}px`;
          slotEl.style.width = `${defW}px`;
          slotEl.style.height = `${defH}px`;
        }
      } else {
        slotEl.style.position = '';
        slotEl.style.left = '';
        slotEl.style.top = '';
        slotEl.style.width = '';
        slotEl.style.height = '';
        if (this.layoutMode === 'focus') {
          const focusData = this.getFocusLayout(this.slotCount);
          if (focusData.slots[i]) {
            slotEl.style.gridColumn = focusData.slots[i].col;
            slotEl.style.gridRow = focusData.slots[i].row;
          }
        } else {
          slotEl.style.gridColumn = '';
          slotEl.style.gridRow = '';
        }
      }

      const emptyWrapper = slotEl.querySelector('.slot-empty-wrapper');
      const videoArea = slotEl.querySelector('.slot-video-area');
      const videoContainer = slotEl.querySelector('.video-container');
      const uiLayer = slotEl.querySelector('.slot-ui-layer');
      const chatWrapper = slotEl.querySelector('.slot-chat-wrapper');
      const playlistWrapper = slotEl.querySelector('.slot-playlist-wrapper');

      if (!slot.active) {
        if (emptyWrapper) {
          emptyWrapper.style.display = 'flex';
          emptyWrapper.innerHTML = this.getEmptySlotHTML(slot);
        }
        if (videoArea) videoArea.style.display = 'none';
        if (uiLayer) uiLayer.innerHTML = '';
        if (chatWrapper) chatWrapper.innerHTML = '';
        if (playlistWrapper) playlistWrapper.innerHTML = '';
        slot._chatKey = null;
      } else {
        if (emptyWrapper) {
          emptyWrapper.style.display = 'none';
          emptyWrapper.innerHTML = '';
        }
        if (videoArea) videoArea.style.display = 'flex';
        if (uiLayer) {
          uiLayer.innerHTML = this.getActiveSlotUILayerHTML(slot);
          if (slot.type === 'youtube' && slot.duration > 0) {
            const timeEl = uiLayer.querySelector(`#slot-yt-time-${i}`);
            const sliderEl = uiLayer.querySelector(`#slot-yt-slider-${i}`);
            if (timeEl) timeEl.textContent = `${this.formatSecs(slot.currentTime)} / ${this.formatSecs(slot.duration)}`;
            if (sliderEl) sliderEl.value = (slot.currentTime / slot.duration) * 100;
          } else if (slot.type === 'vod' && slot.videoEl && slot.videoEl.duration > 0) {
            const timeEl = uiLayer.querySelector(`#slot-vod-time-${i}`);
            const sliderEl = uiLayer.querySelector(`#slot-vod-slider-${i}`);
            if (timeEl) timeEl.textContent = `${this.formatSecs(slot.videoEl.currentTime)} / ${this.formatSecs(slot.videoEl.duration)}`;
            if (sliderEl) sliderEl.value = (slot.videoEl.currentTime / slot.videoEl.duration) * 100;
          }
        }

        if (chatWrapper) {
          const curChatKey = `${slot.type}_${slot.channelId || ''}_${slot.videoId || ''}_${slot.videoNo || ''}`;
          const oldMsgBox = chatWrapper.querySelector('.slot-chat-messages');
          let preservedChildren = null;
          let preservedScrollTop = 0;
          if (oldMsgBox && slot._chatKey === curChatKey && !oldMsgBox.querySelector('.chat-empty-hint')) {
            preservedChildren = Array.from(oldMsgBox.childNodes);
            preservedScrollTop = oldMsgBox.scrollTop;
          }
          slot._chatKey = curChatKey;
          chatWrapper.innerHTML = this.getSlotChatColumnHTML(slot);
          const newMsgBox = chatWrapper.querySelector(`#slot-chat-messages-${i}`);
          if (newMsgBox) {
            if (preservedChildren && preservedChildren.length > 0) {
              newMsgBox.innerHTML = '';
              preservedChildren.forEach(node => newMsgBox.appendChild(node));
              newMsgBox.scrollTop = preservedScrollTop;
            } else if (slot.chatHistory && slot.chatHistory.length > 0) {
              newMsgBox.innerHTML = '';
              slot.chatHistory.forEach(item => {
                this.appendSlotChatMessage(slot, item, false);
              });
              if (slot.autoScroll !== false) {
                newMsgBox.scrollTop = newMsgBox.scrollHeight;
              }
            }
          }
        }

        if (playlistWrapper) {
          if (slot.type === 'youtube') {
            playlistWrapper.innerHTML = this.getSlotPlaylistColumnHTML(slot);
          } else {
            playlistWrapper.innerHTML = '';
          }
        }

        const relatedWrapper = slotEl.querySelector('.slot-related-wrapper');
        if (relatedWrapper) {
          if (slot.type === 'youtube') {
            relatedWrapper.innerHTML = this.getSlotRelatedColumnHTML(slot);
          } else {
            relatedWrapper.innerHTML = '';
          }
        }

        // Attach mediaEl ONLY if not already attached to videoContainer (prevents iframe reload!)
        const mediaEl = slot.videoEl || (slot.type === 'youtube' ? slot.iframeEl : null);
        if (mediaEl && videoContainer) {
          if (this.pipActiveSlot === slot && slot.type !== 'youtube') {
            // Chzzk <video> currently in PiP
          } else if (mediaEl.parentElement !== videoContainer) {
            videoContainer.appendChild(mediaEl);
          }
        }
        if (videoContainer) {
          let loadEl = videoContainer.querySelector('.slot-loading-indicator');
          if (slot.isLoading && !mediaEl) {
            if (!loadEl) {
              loadEl = document.createElement('div');
              loadEl.className = 'slot-loading-indicator';
              loadEl.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:rgba(11,14,20,0.85);color:var(--accent-color);font-size:12.5px;font-weight:700;z-index:12;pointer-events:none;';
              loadEl.innerHTML = `${ICONS.spinner}<span>방송 스트림 연결 중...</span>`;
              videoContainer.appendChild(loadEl);
            }
          } else if (loadEl) {
            loadEl.remove();
          }
        }
      }
    }

    this.updatePiPSlotOptions();
  }

  showMagneticGuideX(x) {
    if (!this.playersGrid) return;
    let guide = document.getElementById('mv-mag-guide-x');
    if (!guide) {
      guide = document.createElement('div');
      guide.id = 'mv-mag-guide-x';
      guide.className = 'magnetic-guide-x';
      this.playersGrid.appendChild(guide);
    }
    guide.style.left = `${x}px`;
    guide.style.display = 'block';
  }

  showMagneticGuideY(y) {
    if (!this.playersGrid) return;
    let guide = document.getElementById('mv-mag-guide-y');
    if (!guide) {
      guide = document.createElement('div');
      guide.id = 'mv-mag-guide-y';
      guide.className = 'magnetic-guide-y';
      this.playersGrid.appendChild(guide);
    }
    guide.style.top = `${y}px`;
    guide.style.display = 'block';
  }

  clearMagneticGuides() {
    const gx = document.getElementById('mv-mag-guide-x');
    if (gx) gx.remove();
    const gy = document.getElementById('mv-mag-guide-y');
    if (gy) gy.remove();
  }

  clearSlotHoverClasses() {
    if (!this.playersGrid) return;
    this.playersGrid.querySelectorAll('.player-slot').forEach(el => {
      el.classList.remove(
        'drag-swap-target',
        'drag-edge-left',
        'drag-edge-right',
        'drag-edge-top',
        'drag-edge-bottom'
      );
    });
  }

  initMultiDirectionResize(handleEl, slotOrIndex, dir) {
    const startResizeSession = (startClientX, startClientY, isTouch) => {
      document.body.classList.add('is-slot-resizing');

      const slot = typeof slotOrIndex === 'object' ? slotOrIndex : this.slots[slotOrIndex];
      if (!slot) {
        document.body.classList.remove('is-slot-resizing');
        return;
      }
      const slotIndex = this.slots.indexOf(slot);
      if (slotIndex === -1) {
        document.body.classList.remove('is-slot-resizing');
        return;
      }
      let slotEl = slot.slotEl || document.getElementById(`slot-${slotIndex}`);
      if (!slotEl) {
        document.body.classList.remove('is-slot-resizing');
        return;
      }

      const moveEvt = isTouch ? 'touchmove' : 'mousemove';
      const endEvt = isTouch ? 'touchend' : 'mouseup';
      const cancelEvt = isTouch ? 'touchcancel' : null;
      const getPt = (ev) => isTouch ? ((ev.touches && ev.touches[0]) || (ev.changedTouches && ev.changedTouches[0])) : ev;

      // Requirement 1: In Auto/Grid (정렬 모드), resize adjacent columns and rows proportionally while strictly keeping slots attached together and inside one screen
      if (!isTouch && this.layoutMode === 'auto') {
        const count = this.slotCount;
        let cols = 1;
        if (count === 1) cols = 1;
        else if (count === 2) cols = 2;
        else if (count <= 4) cols = 2;
        else if (count <= 6) cols = 3;
        else if (count <= 9) cols = 3;
        else if (count <= 12) cols = 4;
        else cols = Math.ceil(Math.sqrt(count));
        const rows = Math.max(1, Math.ceil(count / cols));

        if (!this.gridColFractions || this.gridColFractions.length !== cols) {
          this.gridColFractions = new Array(cols).fill(1.0);
        }
        if (!this.gridRowFractions || this.gridRowFractions.length !== rows) {
          this.gridRowFractions = new Array(rows).fill(1.0);
        }

        const startX = startClientX;
        const startY = startClientY;
        const initColFr = [...this.gridColFractions];
        const initRowFr = [...this.gridRowFractions];
        const gridW = this.playersGrid.clientWidth || 1000;
        const gridH = this.playersGrid.clientHeight || 600;

        const colIdx = slotIndex % cols;
        const rowIdx = Math.floor(slotIndex / cols);

        const onGridMouseMove = (ev) => {
          ev.preventDefault();
          const dx = ev.clientX - startX;
          const dy = ev.clientY - startY;

          // Horizontal column resizing between adjacent columns
          if (dir.includes('e') && colIdx < cols - 1) {
            const sumFr = initColFr[colIdx] + initColFr[colIdx + 1];
            const dFr = (dx / (gridW / cols)) * 0.85;
            let c1 = Math.max(0.18, initColFr[colIdx] + dFr);
            let c2 = Math.max(0.18, sumFr - c1);
            c1 = sumFr - c2;
            this.gridColFractions[colIdx] = c1;
            this.gridColFractions[colIdx + 1] = c2;
          } else if (dir.includes('w') && colIdx > 0) {
            const sumFr = initColFr[colIdx - 1] + initColFr[colIdx];
            const dFr = (dx / (gridW / cols)) * 0.85;
            let c2 = Math.max(0.18, initColFr[colIdx] - dFr);
            let c1 = Math.max(0.18, sumFr - c2);
            c2 = sumFr - c1;
            this.gridColFractions[colIdx - 1] = c1;
            this.gridColFractions[colIdx] = c2;
          }

          // Vertical row resizing between adjacent rows
          if (dir.includes('s') && rowIdx < rows - 1) {
            const sumFr = initRowFr[rowIdx] + initRowFr[rowIdx + 1];
            const dFr = (dy / (gridH / rows)) * 0.85;
            let r1 = Math.max(0.18, initRowFr[rowIdx] + dFr);
            let r2 = Math.max(0.18, sumFr - r1);
            r1 = sumFr - r2;
            this.gridRowFractions[rowIdx] = r1;
            this.gridRowFractions[rowIdx + 1] = r2;
          } else if (dir.includes('n') && rowIdx > 0) {
            const sumFr = initRowFr[rowIdx - 1] + initRowFr[rowIdx];
            const dFr = (dy / (gridH / rows)) * 0.85;
            let r2 = Math.max(0.18, initRowFr[rowIdx] - dFr);
            let r1 = Math.max(0.18, sumFr - r2);
            r2 = sumFr - r1;
            this.gridRowFractions[rowIdx - 1] = r1;
            this.gridRowFractions[rowIdx] = r2;
          }

          this.playersGrid.style.gridTemplateColumns = this.gridColFractions.map(f => `${f.toFixed(3)}fr`).join(' ');
          this.playersGrid.style.gridTemplateRows = this.gridRowFractions.map(f => `${f.toFixed(3)}fr`).join(' ');
        };

        const onGridMouseUp = () => {
          document.removeEventListener('mousemove', onGridMouseMove);
          document.removeEventListener('mouseup', onGridMouseUp);
          document.body.classList.remove('is-slot-resizing');
        };

        document.addEventListener('mousemove', onGridMouseMove);
        document.addEventListener('mouseup', onGridMouseUp);
        return;
      }

      if (this.layoutMode !== 'custom') {
        this.setLayoutMode('custom');
        slotEl = slot.slotEl || document.getElementById(`slot-${slotIndex}`);
        if (!slotEl) {
          document.body.classList.remove('is-slot-resizing');
          return;
        }
      }

      const gridRect = this.playersGrid.getBoundingClientRect();
      // Sync all slots' coordinates from live DOM before detecting linked edges
      for (let k = 0; k < this.slotCount; k++) {
        const s = this.slots[k];
        const el = s.slotEl || document.getElementById(`slot-${k}`);
        if (el) {
          const r = el.getBoundingClientRect();
          if (s.w === null || !s.w) s.w = Math.round(r.width);
          if (s.h === null || !s.h) s.h = Math.round(r.height);
          if (s.x === null) s.x = Math.max(14, Math.round(r.left - gridRect.left + this.playersGrid.scrollLeft));
          if (s.y === null) s.y = Math.max(14, Math.round(r.top - gridRect.top + this.playersGrid.scrollTop));
        }
      }

      const startX = startClientX;
      const startY = startClientY;
      const initialW = slot.w || slotEl.offsetWidth || 380;
      const initialH = slot.h || slotEl.offsetHeight || 240;
      const initialX = slot.x !== null ? slot.x : Math.max(14, Math.round(slotEl.getBoundingClientRect().left - gridRect.left + this.playersGrid.scrollLeft));
      const initialY = slot.y !== null ? slot.y : Math.max(14, Math.round(slotEl.getBoundingClientRect().top - gridRect.top + this.playersGrid.scrollTop));

      const minW = isTouch ? 150 : 240;
      const minH = isTouch ? 95 : 150;
      const snapDist = 14;
      const tolerance = 36;
      const minGapTol = -32;

      // Detect linked adjacent slots sharing the dragged edge
      const linkedSlotsE = [];
      const linkedSlotsW = [];
      const linkedSlotsS = [];
      const linkedSlotsN = [];

      if (dir.includes('e')) {
        const slotRight = initialX + initialW;
        for (let k = 0; k < this.slotCount; k++) {
          if (k === slotIndex) continue;
          const other = this.slots[k];
          if (other.x === null || other.w === null || other.y === null || other.h === null) continue;
          const gapX = other.x - slotRight;
          if (gapX >= minGapTol && gapX <= tolerance) {
            const vOverlap = Math.min(initialY + initialH, other.y + other.h) - Math.max(initialY, other.y);
            if (vOverlap > 20) {
              linkedSlotsE.push({ slot: other, el: document.getElementById(`slot-${k}`), initX: other.x, initW: other.w });
            }
          }
        }
      }

      if (dir.includes('w')) {
        const slotLeft = initialX;
        for (let k = 0; k < this.slotCount; k++) {
          if (k === slotIndex) continue;
          const other = this.slots[k];
          if (other.x === null || other.w === null || other.y === null || other.h === null) continue;
          const gapX = slotLeft - (other.x + other.w);
          if (gapX >= minGapTol && gapX <= tolerance) {
            const vOverlap = Math.min(initialY + initialH, other.y + other.h) - Math.max(initialY, other.y);
            if (vOverlap > 20) {
              linkedSlotsW.push({ slot: other, el: document.getElementById(`slot-${k}`), initX: other.x, initW: other.w });
            }
          }
        }
      }

      if (dir.includes('s')) {
        const slotBottom = initialY + initialH;
        for (let k = 0; k < this.slotCount; k++) {
          if (k === slotIndex) continue;
          const other = this.slots[k];
          if (other.x === null || other.w === null || other.y === null || other.h === null) continue;
          const gapY = other.y - slotBottom;
          if (gapY >= minGapTol && gapY <= tolerance) {
            const hOverlap = Math.min(initialX + initialW, other.x + other.w) - Math.max(initialX, other.x);
            if (hOverlap > 20) {
              linkedSlotsS.push({ slot: other, el: document.getElementById(`slot-${k}`), initY: other.y, initH: other.h });
            }
          }
        }
      }

      if (dir.includes('n')) {
        const slotTop = initialY;
        for (let k = 0; k < this.slotCount; k++) {
          if (k === slotIndex) continue;
          const other = this.slots[k];
          if (other.x === null || other.w === null || other.y === null || other.h === null) continue;
          const gapY = slotTop - (other.y + other.h);
          if (gapY >= minGapTol && gapY <= tolerance) {
            const hOverlap = Math.min(initialX + initialW, other.x + other.w) - Math.max(initialX, other.x);
            if (hOverlap > 20) {
              linkedSlotsN.push({ slot: other, el: document.getElementById(`slot-${k}`), initY: other.y, initH: other.h });
            }
          }
        }
      }

      const hasLinkedSlots = (linkedSlotsE.length + linkedSlotsW.length + linkedSlotsS.length + linkedSlotsN.length) > 0;

      // Ghost preview badge
      let ghostBadge = slotEl.querySelector('.slot-resize-ghost-badge');
      if (!ghostBadge) {
        ghostBadge = document.createElement('div');
        ghostBadge.className = 'slot-resize-ghost-badge';
        slotEl.appendChild(ghostBadge);
      }
      ghostBadge.innerHTML = `<span class="ghost-text">${Math.round(initialW)} × ${Math.round(initialH)}px</span>`;
      ghostBadge.style.display = 'flex';

      const onPointerMove = (ev) => {
        const pt = getPt(ev);
        if (!pt) return;
        if (ev.cancelable) ev.preventDefault();
        const dx = pt.clientX - startX;
        const dy = pt.clientY - startY;

        let newW = initialW;
        let newH = initialH;
        let newX = initialX;
        let newY = initialY;

        this.clearMagneticGuides();

        // 1. Horizontal axis resizing
        if (dir.includes('e')) {
          if (linkedSlotsE.length > 0) {
            const minAllowed = minW - initialW;
            const maxAllowed = Math.min(...linkedSlotsE.map(item => (item.initX + item.initW) - (initialX + initialW + 12) - minW));
            const delta = Math.max(minAllowed, Math.min(maxAllowed, dx));
            newW = Math.round(initialW + delta);
            const newRight = initialX + newW;
            linkedSlotsE.forEach(item => {
              const rightEdge = item.initX + item.initW;
              item.slot.x = Math.round(newRight + 12);
              item.slot.w = Math.max(minW, Math.round(rightEdge - item.slot.x));
              if (item.el) {
                item.el.style.left = `${item.slot.x}px`;
                item.el.style.width = `${item.slot.w}px`;
              }
            });
          } else {
            newW = Math.max(minW, Math.round(initialW + dx));
            const candRight = initialX + newW;
            for (let k = 0; k < this.slotCount; k++) {
              if (k === slotIndex) continue;
              const other = this.slots[k];
              if (other.x === null || other.w === null || other.y === null || other.h === null) continue;
              const vOverlap = Math.min(initialY + initialH, other.y + other.h) - Math.max(initialY, other.y);
              if (vOverlap > 10 && other.x >= initialX + initialW - 8) {
                newW = Math.min(newW, Math.max(minW, other.x - initialX - 12));
              } else if (Math.abs(candRight - other.x) < snapDist) {
                newW = other.x - initialX;
                this.showMagneticGuideX(other.x);
              } else if (Math.abs(candRight - (other.x + other.w)) < snapDist) {
                newW = (other.x + other.w) - initialX;
                this.showMagneticGuideX(other.x + other.w);
              } else if (Math.abs(newW - other.w) < snapDist) {
                newW = other.w;
              }
            }
          }
        } else if (dir.includes('w')) {
          if (linkedSlotsW.length > 0) {
            const maxAllowed = initialW - minW;
            const minAllowed = Math.max(...linkedSlotsW.map(item => (item.initX + minW + 12) - initialX));
            const delta = Math.max(minAllowed, Math.min(maxAllowed, dx));
            newX = Math.round(initialX + delta);
            newW = Math.round(initialW - delta);
            linkedSlotsW.forEach(item => {
              item.slot.w = Math.max(minW, Math.round(newX - 12 - item.initX));
              if (item.el) {
                item.el.style.width = `${item.slot.w}px`;
              }
            });
          } else {
            let candLeft = Math.round(initialX + dx);
            candLeft = Math.max(14, candLeft);
            for (let k = 0; k < this.slotCount; k++) {
              if (k === slotIndex) continue;
              const other = this.slots[k];
              if (other.x === null || other.w === null || other.y === null || other.h === null) continue;
              const vOverlap = Math.min(initialY + initialH, other.y + other.h) - Math.max(initialY, other.y);
              if (vOverlap > 10 && (other.x + other.w) <= initialX + 8) {
                candLeft = Math.max(candLeft, other.x + other.w + 12);
              } else if (Math.abs(candLeft - other.x) < snapDist) {
                candLeft = other.x;
                this.showMagneticGuideX(other.x);
              } else if (Math.abs(candLeft - (other.x + other.w)) < snapDist) {
                candLeft = other.x + other.w;
                this.showMagneticGuideX(other.x + other.w);
              }
            }
            if (Math.abs(candLeft - 14) < snapDist) {
              candLeft = 14;
              this.showMagneticGuideX(14);
            }
            const calcW = (initialX + initialW) - candLeft;
            if (calcW >= minW) {
              newX = candLeft;
              newW = calcW;
            } else {
              newW = minW;
              newX = (initialX + initialW) - minW;
            }
          }
        }

        // 2. Vertical axis resizing
        if (dir.includes('s')) {
          if (linkedSlotsS.length > 0) {
            const minAllowed = minH - initialH;
            const maxAllowed = Math.min(...linkedSlotsS.map(item => (item.initY + item.initH) - (initialY + initialH + 12) - minH));
            const delta = Math.max(minAllowed, Math.min(maxAllowed, dy));
            newH = Math.round(initialH + delta);
            const newBottom = initialY + newH;
            linkedSlotsS.forEach(item => {
              const bottomEdge = item.initY + item.initH;
              item.slot.y = Math.round(newBottom + 12);
              item.slot.h = Math.max(minH, Math.round(bottomEdge - item.slot.y));
              if (item.el) {
                item.el.style.top = `${item.slot.y}px`;
                item.el.style.height = `${item.slot.h}px`;
              }
            });
          } else {
            newH = Math.max(minH, Math.round(initialH + dy));
            const candBottom = initialY + newH;
            for (let k = 0; k < this.slotCount; k++) {
              if (k === slotIndex) continue;
              const other = this.slots[k];
              if (other.y === null || other.h === null || other.x === null || other.w === null) continue;
              const hOverlap = Math.min(newX + newW, other.x + other.w) - Math.max(newX, other.x);
              if (hOverlap > 10 && other.y >= initialY + initialH - 8) {
                newH = Math.min(newH, Math.max(minH, other.y - initialY - 12));
              } else if (Math.abs(candBottom - other.y) < snapDist) {
                newH = other.y - initialY;
                this.showMagneticGuideY(other.y);
              } else if (Math.abs(candBottom - (other.y + other.h)) < snapDist) {
                newH = (other.y + other.h) - initialY;
                this.showMagneticGuideY(other.y + other.h);
              } else if (Math.abs(newH - other.h) < snapDist) {
                newH = other.h;
              }
            }
          }
        } else if (dir.includes('n')) {
          if (linkedSlotsN.length > 0) {
            const maxAllowed = initialH - minH;
            const minAllowed = Math.max(...linkedSlotsN.map(item => (item.initY + minH + 12) - initialY));
            const delta = Math.max(minAllowed, Math.min(maxAllowed, dy));
            newY = Math.round(initialY + delta);
            newH = Math.round(initialH - delta);
            linkedSlotsN.forEach(item => {
              item.slot.h = Math.max(minH, Math.round(newY - 12 - item.initY));
              if (item.el) {
                item.el.style.height = `${item.slot.h}px`;
              }
            });
          } else {
            let candTop = Math.round(initialY + dy);
            candTop = Math.max(14, candTop);
            for (let k = 0; k < this.slotCount; k++) {
              if (k === slotIndex) continue;
              const other = this.slots[k];
              if (other.y === null || other.h === null || other.x === null || other.w === null) continue;
              const hOverlap = Math.min(newX + newW, other.x + other.w) - Math.max(newX, other.x);
              if (hOverlap > 10 && (other.y + other.h) <= initialY + 8) {
                candTop = Math.max(candTop, other.y + other.h + 12);
              } else if (Math.abs(candTop - other.y) < snapDist) {
                candTop = other.y;
                this.showMagneticGuideY(other.y);
              } else if (Math.abs(candTop - (other.y + other.h)) < snapDist) {
                candTop = other.y + other.h;
                this.showMagneticGuideY(other.y + other.h);
              }
            }
            if (Math.abs(candTop - 14) < snapDist) {
              candTop = 14;
              this.showMagneticGuideY(14);
            }
            const calcH = (initialY + initialH) - candTop;
            if (calcH >= minH) {
              newY = candTop;
              newH = calcH;
            } else {
              newH = minH;
              newY = (initialY + initialH) - minH;
            }
          }
        }

        newW = Math.max(minW, newW);
        newH = Math.max(minH, newH);

        slot.w = newW;
        slot.h = newH;
        slot.x = newX;
        slot.y = newY;

        slotEl.style.left = `${newX}px`;
        slotEl.style.top = `${newY}px`;
        slotEl.style.width = `${newW}px`;
        slotEl.style.height = `${newH}px`;

        const textEl = ghostBadge.querySelector('.ghost-text');
        if (textEl) textEl.textContent = `${newW} × ${newH}px`;

        const maxR = (slot.x || 0) + newW + 40;
        const maxB = (slot.y || 0) + newH + 40;
        if (parseFloat(this.playersGrid.style.minWidth || 0) < maxR) {
          this.playersGrid.style.minWidth = `${maxR}px`;
        }
        if (parseFloat(this.playersGrid.style.minHeight || 0) < maxB) {
          this.playersGrid.style.minHeight = `${maxB}px`;
        }
      };

      const onPointerUp = () => {
        document.removeEventListener(moveEvt, onPointerMove, isTouch ? { passive: false } : undefined);
        document.removeEventListener(endEvt, onPointerUp);
        if (cancelEvt) document.removeEventListener(cancelEvt, onPointerUp);
        document.body.classList.remove('is-slot-resizing');
        if (ghostBadge) ghostBadge.remove();
        this.clearMagneticGuides();
        if (!hasLinkedSlots) {
          this.preventOverlap(slotIndex);
        }
        this.updateGridLayout();
      };

      document.addEventListener(moveEvt, onPointerMove, isTouch ? { passive: false } : undefined);
      document.addEventListener(endEvt, onPointerUp);
      if (cancelEvt) document.addEventListener(cancelEvt, onPointerUp);
    };

    handleEl.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      startResizeSession(e.clientX, e.clientY, false);
    });

    handleEl.addEventListener('touchstart', (e) => {
      const slot = typeof slotOrIndex === 'object' ? slotOrIndex : this.slots[slotOrIndex];
      const slotIndex = slot ? this.slots.indexOf(slot) : -1;
      const slotEl = slot ? (slot.slotEl || document.getElementById(`slot-${slotIndex}`)) : null;
      if (this.layoutMode !== 'custom' || !slotEl || !slotEl.classList.contains('touch-slot-edit-mode')) {
        return;
      }
      if (!e.touches || e.touches.length !== 1) return;
      e.preventDefault();
      e.stopPropagation();
      startResizeSession(e.touches[0].clientX, e.touches[0].clientY, true);
    }, { passive: false });
  }

  initSlotChatResize(e, slotIndex) {
    e.preventDefault();
    e.stopPropagation();

    const slot = this.slots[slotIndex];
    if (!slot) return;
    const slotEl = slot.slotEl || document.getElementById(`slot-${slotIndex}`);
    const chatCol = document.getElementById(`slot-chat-${slotIndex}`);
    if (!slotEl || !chatCol) return;

    document.body.classList.add('is-slot-resizing');
    chatCol.classList.add('is-resizing-chat');

    const startX = e.clientX;
    const startW = chatCol.offsetWidth || slot.chatWidth || 250;

    const onMouseMove = (ev) => {
      ev.preventDefault();
      // Dragging left edge leftwards (dx < 0) increases chat width; dragging rightwards (dx > 0) decreases chat width
      const dx = startX - ev.clientX;
      const slotTotalW = slotEl.offsetWidth || 400;
      const maxChatW = Math.max(170, Math.min(520, Math.floor(slotTotalW * 0.56)));
      const minChatW = Math.min(150, maxChatW);
      const newW = Math.max(minChatW, Math.min(maxChatW, Math.round(startW + dx)));
      slot.chatWidth = newW;
      chatCol.style.width = `${newW}px`;
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.classList.remove('is-slot-resizing');
      chatCol.classList.remove('is-resizing-chat');
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  setupSlotPointerDrag(slotEl, slotOrIndex) {
    slotEl.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      // Ignore if clicking on interactive controls or resize handles
      if (e.target.closest('button, input, select, a, .slot-overlay-bottom, .slot-ctrl-btn, .slot-unmute-btn, .slot-volume-slider, .slot-vod-slider, .slot-timeshift-btn, .slot-live-status-btn, .slot-chat-column, .slot-chat-resizer, .slot-yt-endscreen, .resize-handle')) {
        return;
      }

      const slot = typeof slotOrIndex === 'object' ? slotOrIndex : this.slots[slotOrIndex];
      if (!slot) return;
      const index = this.slots.indexOf(slot);
      if (index === -1) return;

      const startClientX = e.clientX;
      const startClientY = e.clientY;
      const rect = slotEl.getBoundingClientRect();
      const grabOffsetX = e.clientX - rect.left;
      const grabOffsetY = e.clientY - rect.top;

      let isDragging = false;
      let ghostEl = null;
      let dragAction = null; // { type: 'swap' | 'dock' | 'freeform', ... }

      const onMouseMove = (ev) => {
        const dragDist = Math.hypot(ev.clientX - startClientX, ev.clientY - startClientY);
        if (!isDragging) {
          if (dragDist < 6) {
            return;
          }
          isDragging = true;
          document.body.classList.add('is-slot-dragging');
          slotEl.classList.add('slot-dragging-source');

          // Create floating ghost element
          ghostEl = document.createElement('div');
          ghostEl.className = 'slot-drag-ghost';
          ghostEl.style.width = `${slotEl.offsetWidth}px`;
          ghostEl.style.height = `${slotEl.offsetHeight}px`;

          const title = slot.title || (slot.active ? '실시간 방송' : `슬롯 ${index + 1}`);
          const name = slot.channelName || (slot.active ? '스트리머' : '비어있는 슬롯');
          ghostEl.innerHTML = `
            <div class="slot-drag-ghost-content">
              <div class="slot-drag-ghost-title">${name}</div>
              <div class="slot-drag-ghost-sub">${title}</div>
            </div>
          `;
          document.body.appendChild(ghostEl);
        }

        if (ghostEl) {
          ghostEl.style.left = `${ev.clientX - grabOffsetX}px`;
          ghostEl.style.top = `${ev.clientY - grabOffsetY}px`;
        }

        // Find slot element under cursor (excluding dragged slot)
        const elementsUnder = document.elementsFromPoint(ev.clientX, ev.clientY);
        const targetSlotEl = elementsUnder.find(el => el.classList && el.classList.contains('player-slot') && el !== slotEl);

        if (targetSlotEl) {
          this.clearMagneticGuides();
          const targetIdx = parseInt(targetSlotEl.id.replace('slot-', ''), 10);
          if (isNaN(targetIdx)) return;

          const tRect = targetSlotEl.getBoundingClientRect();
          const relX = (ev.clientX - tRect.left) / tRect.width;
          const relY = (ev.clientY - tRect.top) / tRect.height;

          this.clearSlotHoverClasses();

          // Center zone (15% to 85%) -> Swap target
          if (relX >= 0.15 && relX <= 0.85 && relY >= 0.15 && relY <= 0.85) {
            targetSlotEl.classList.add('drag-swap-target');
            dragAction = { type: 'swap', targetIndex: targetIdx };
          } else {
            // Edge zone -> Dock / Reorder target
            const distL = relX;
            const distR = 1 - relX;
            const distT = relY;
            const distB = 1 - relY;
            const minDist = Math.min(distL, distR, distT, distB);

            let edge = 'right';
            if (minDist === distL) edge = 'left';
            else if (minDist === distR) edge = 'right';
            else if (minDist === distT) edge = 'top';
            else if (minDist === distB) edge = 'bottom';

            targetSlotEl.classList.add(`drag-edge-${edge}`);
            dragAction = { type: 'dock', targetIndex: targetIdx, edge: edge };
          }
        } else {
          // Hovering over open workspace
          this.clearSlotHoverClasses();

          const allowFreeform = this.layoutMode === 'custom' || dragDist >= 24;

          if (allowFreeform && this.playersGrid) {
            const gridRect = this.playersGrid.getBoundingClientRect();
            let candX = ev.clientX - gridRect.left - grabOffsetX + this.playersGrid.scrollLeft;
            let candY = ev.clientY - gridRect.top - grabOffsetY + this.playersGrid.scrollTop;
            candX = Math.max(14, Math.round(candX));
            candY = Math.max(14, Math.round(candY));

            this.clearMagneticGuides();
            let snappedX = false;
            let snappedY = false;
            const curW = slot.w || slotEl.offsetWidth || 380;
            const curH = slot.h || slotEl.offsetHeight || 240;

            for (let k = 0; k < this.slotCount; k++) {
              if (k === index) continue;
              const other = this.slots[k];
              if (other.x === null || other.y === null || other.w === null || other.h === null) continue;

              if (!snappedX) {
                if (Math.abs(candX - other.x) < 14) {
                  candX = other.x; snappedX = true; this.showMagneticGuideX(other.x);
                } else if (Math.abs(candX - (other.x + other.w + 12)) < 14) {
                  candX = other.x + other.w + 12; snappedX = true; this.showMagneticGuideX(other.x + other.w + 12);
                } else if (Math.abs((candX + curW) - other.x) < 14) {
                  candX = other.x - curW - 12; snappedX = true; this.showMagneticGuideX(other.x);
                } else if (Math.abs((candX + curW) - (other.x + other.w)) < 14) {
                  candX = other.x + other.w - curW; snappedX = true; this.showMagneticGuideX(other.x + other.w);
                }
              }

              if (!snappedY) {
                if (Math.abs(candY - other.y) < 14) {
                  candY = other.y; snappedY = true; this.showMagneticGuideY(other.y);
                } else if (Math.abs(candY - (other.y + other.h + 12)) < 14) {
                  candY = other.y + other.h + 12; snappedY = true; this.showMagneticGuideY(other.y + other.h + 12);
                } else if (Math.abs((candY + curH) - other.y) < 14) {
                  candY = other.y - curH - 12; snappedY = true; this.showMagneticGuideY(other.y);
                } else if (Math.abs((candY + curH) - (other.y + other.h)) < 14) {
                  candY = other.y + other.h - curH; snappedY = true; this.showMagneticGuideY(other.y + other.h);
                }
              }
            }

            if (!snappedX && Math.abs(candX - 14) < 14) {
              candX = 14; this.showMagneticGuideX(14);
            }
            if (!snappedY && Math.abs(candY - 14) < 14) {
              candY = 14; this.showMagneticGuideY(14);
            }

            dragAction = { type: 'freeform', x: candX, y: candY };
          } else {
            dragAction = null;
          }
        }
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        document.body.classList.remove('is-slot-dragging');
        slotEl.classList.remove('slot-dragging-source');
        if (ghostEl) ghostEl.remove();

        this.clearMagneticGuides();
        this.clearSlotHoverClasses();

        if (isDragging) {
          // Suppress accidental click events right after dragging
          const suppressClick = (clickEv) => {
            clickEv.stopPropagation();
            clickEv.preventDefault();
            slotEl.removeEventListener('click', suppressClick, true);
          };
          slotEl.addEventListener('click', suppressClick, true);
          setTimeout(() => slotEl.removeEventListener('click', suppressClick, true), 60);
        }

        const currentIndex = this.slots.indexOf(slot);
        if (currentIndex === -1) return;

        if (isDragging && dragAction) {
          if (dragAction.type === 'swap') {
            if (this.layoutMode === 'custom') {
              this.swapCustomSlots(currentIndex, dragAction.targetIndex);
            } else {
              this.swapSlots(currentIndex, dragAction.targetIndex);
            }
          } else if (dragAction.type === 'dock') {
            if (this.layoutMode === 'custom') {
              this.dockSlotToEdge(currentIndex, dragAction.targetIndex, dragAction.edge);
            } else {
              this.reorderSlotsInGrid(currentIndex, dragAction.targetIndex, dragAction.edge);
            }
          } else if (dragAction.type === 'freeform') {
            if (this.layoutMode !== 'custom') {
              this.setLayoutMode('custom');
            }
            slot.x = dragAction.x;
            slot.y = dragAction.y;
            this.preventOverlap(currentIndex);
            slotEl.style.left = `${slot.x}px`;
            slotEl.style.top = `${slot.y}px`;
            this.updateGridLayout();
          }
        }
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  enterTouchSlotEditMode(slotIndex) {
    this.exitTouchSlotEditMode();
    const slotEl = document.getElementById(`slot-${slotIndex}`);
    if (!slotEl || this.layoutMode !== 'custom') return;
    this.touchEditingSlotIndex = slotIndex;
    slotEl.classList.add('touch-slot-edit-mode');

    const shield = document.createElement('div');
    shield.className = 'slot-touch-edit-shield';
    shield.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      this.exitTouchSlotEditMode();
    });
    shield.addEventListener('touchend', (ev) => {
      if (this._justEnteredTouchEditAt && (Date.now() - this._justEnteredTouchEditAt) < 450) return;
      ev.preventDefault();
      ev.stopPropagation();
      this.exitTouchSlotEditMode();
    }, { passive: false });
    slotEl.appendChild(shield);

    const badge = document.createElement('div');
    badge.className = 'slot-touch-edit-badge';
    badge.innerHTML = `${ICONS.expandSize} <span>크기 조절 모드 · 슬롯 탭 시 완료</span>`;
    badge.addEventListener('touchend', (ev) => {
      if (this._justEnteredTouchEditAt && (Date.now() - this._justEnteredTouchEditAt) < 450) return;
      ev.preventDefault();
      ev.stopPropagation();
      this.exitTouchSlotEditMode();
    }, { passive: false });
    badge.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      this.exitTouchSlotEditMode();
    });
    slotEl.appendChild(badge);
    this._justEnteredTouchEditAt = Date.now();
  }

  exitTouchSlotEditMode() {
    this.touchEditingSlotIndex = null;
    document.querySelectorAll('.player-slot.touch-slot-edit-mode').forEach(el => {
      el.classList.remove('touch-slot-edit-mode');
    });
    document.querySelectorAll('.slot-touch-edit-badge, .slot-touch-edit-shield').forEach(el => el.remove());
  }

  setupSlotTouchGestures(slotEl, slotOrIndex) {
    let moveTimer = null;
    let editTimer = null;
    let gesturePhase = 'idle'; // idle | pending | move_ready | dragging | edit_mode | cancelled
    let startX = 0;
    let startY = 0;
    let grabOffsetX = 0;
    let grabOffsetY = 0;
    let initSlotX = 0;
    let initSlotY = 0;
    let pendingCustomX = null;
    let pendingCustomY = null;
    let dragSwapTargetIdx = null;
    let touchGhostEl = null;
    let tapCheckX = 0;
    let tapCheckY = 0;
    let tapStartMs = 0;

    const clearTimers = () => {
      if (moveTimer) { clearTimeout(moveTimer); moveTimer = null; }
      if (editTimer) { clearTimeout(editTimer); editTimer = null; }
    };

    const cleanupGhost = () => {
      document.body.classList.remove('is-slot-dragging');
      slotEl.classList.remove('slot-dragging-source', 'touch-slot-holding-move');
      if (touchGhostEl) {
        touchGhostEl.remove();
        touchGhostEl = null;
      }
      this.clearSlotHoverClasses();
    };

    slotEl.addEventListener('touchstart', (e) => {
      if (!e.touches || e.touches.length !== 1) {
        clearTimers();
        cleanupGhost();
        gesturePhase = 'cancelled';
        return;
      }

      const slot = typeof slotOrIndex === 'object' ? slotOrIndex : this.slots[slotOrIndex];
      if (!slot) return;
      const index = this.slots.indexOf(slot);
      if (index === -1) return;

      // 자유모드 편집 상태에서는 크기 조절 핸들 우선 허용, 그 외 슬롯 내 1회 탭으로 편집 종료 준비
      if (this.layoutMode === 'custom' && slotEl.classList.contains('touch-slot-edit-mode')) {
        if (e.target.closest('.resize-handle')) return;
        gesturePhase = 'edit_tap_exit';
        tapCheckX = e.touches[0].clientX;
        tapCheckY = e.touches[0].clientY;
        tapStartMs = Date.now();
        return;
      }

      if (e.target.closest('button, input, select, a, .slot-chat-messages, .slot-related-list, .slot-playlist-list, .resize-handle, .slot-chat-input-area')) {
        return;
      }

      const rect = slotEl.getBoundingClientRect();
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      grabOffsetX = Math.min(Math.max(12, startX - rect.left), Math.max(40, rect.width - 12));
      grabOffsetY = Math.min(Math.max(12, startY - rect.top), Math.max(30, rect.height - 12));
      initSlotX = (slot.x !== null) ? slot.x : Math.max(8, slotEl.offsetLeft || 12);
      initSlotY = (slot.y !== null) ? slot.y : Math.max(8, slotEl.offsetTop || 12);
      pendingCustomX = initSlotX;
      pendingCustomY = initSlotY;
      dragSwapTargetIdx = null;
      gesturePhase = 'pending';

      moveTimer = setTimeout(() => {
        if (gesturePhase !== 'pending') return;
        gesturePhase = 'move_ready';
        slotEl.classList.add('touch-slot-holding-move');
        if (navigator.vibrate) try { navigator.vibrate(18); } catch (_) {}
      }, 230);

      if (this.layoutMode === 'custom') {
        editTimer = setTimeout(() => {
          if (gesturePhase !== 'pending' && gesturePhase !== 'move_ready') return;
          gesturePhase = 'edit_mode';
          slotEl.classList.remove('touch-slot-holding-move');
          this.enterTouchSlotEditMode(index);
          if (navigator.vibrate) try { navigator.vibrate([25, 35, 25]); } catch (_) {}
        }, 720);
      }
    }, { passive: true });

    slotEl.addEventListener('touchmove', (e) => {
      if (!e.touches || e.touches.length !== 1) return;
      const t = e.touches[0];
      const dist = Math.hypot(t.clientX - startX, t.clientY - startY);

      if (gesturePhase === 'edit_tap_exit') {
        if (Math.hypot(t.clientX - tapCheckX, t.clientY - tapCheckY) > 12) {
          gesturePhase = 'cancelled';
        }
        return;
      }

      if (gesturePhase === 'pending' && dist > 12) {
        clearTimers();
        gesturePhase = 'cancelled';
        return;
      }

      const slot = typeof slotOrIndex === 'object' ? slotOrIndex : this.slots[slotOrIndex];
      const currentIndex = slot ? this.slots.indexOf(slot) : -1;

      if (gesturePhase === 'move_ready' && dist >= 6) {
        if (editTimer) { clearTimeout(editTimer); editTimer = null; }
        gesturePhase = 'dragging';
        document.body.classList.add('is-slot-dragging');
        slotEl.classList.remove('touch-slot-holding-move');
        slotEl.classList.add('slot-dragging-source');

        touchGhostEl = document.createElement('div');
        touchGhostEl.className = 'slot-drag-ghost';
        touchGhostEl.style.pointerEvents = 'none';
        const ghostW = Math.min(Math.max(150, slotEl.offsetWidth || 220), 260);
        const ghostH = Math.min(Math.max(90, slotEl.offsetHeight || 130), 155);
        touchGhostEl.style.width = `${ghostW}px`;
        touchGhostEl.style.height = `${ghostH}px`;
        const title = (slot && (slot.title || (slot.active ? '실시간 방송' : ''))) || `슬롯 ${currentIndex + 1}`;
        const name = (slot && (slot.channelName || (slot.active ? '스트리머' : '비어있는 슬롯'))) || '비어있는 슬롯';
        touchGhostEl.innerHTML = `
          <div class="slot-drag-ghost-content">
            <div class="slot-drag-ghost-title">${escapeHtml(name)}</div>
            <div class="slot-drag-ghost-sub">${escapeHtml(title)}</div>
          </div>
        `;
        document.body.appendChild(touchGhostEl);
        grabOffsetX = Math.round(ghostW / 2);
        grabOffsetY = Math.round(ghostH / 2);
      }

      if (gesturePhase === 'dragging') {
        if (e.cancelable) e.preventDefault();
        if (!slot || currentIndex === -1) return;

        if (touchGhostEl) {
          touchGhostEl.style.left = `${t.clientX - grabOffsetX}px`;
          touchGhostEl.style.top = `${t.clientY - grabOffsetY}px`;
        }

        const elementsUnder = document.elementsFromPoint(t.clientX, t.clientY);
        const targetSlotEl = elementsUnder.find(
          el => el.classList && el.classList.contains('player-slot') && el !== slotEl
        );

        this.clearSlotHoverClasses();
        if (targetSlotEl) {
          const targetIdx = parseInt(targetSlotEl.id.replace('slot-', ''), 10);
          if (!isNaN(targetIdx) && targetIdx !== currentIndex && targetIdx < this.slotCount) {
            dragSwapTargetIdx = targetIdx;
            targetSlotEl.classList.add('drag-swap-target');
          } else {
            dragSwapTargetIdx = null;
          }
        } else {
          dragSwapTargetIdx = null;
          if (this.layoutMode === 'custom') {
            pendingCustomX = Math.max(8, Math.round(initSlotX + (t.clientX - startX)));
            pendingCustomY = Math.max(8, Math.round(initSlotY + (t.clientY - startY)));
          }
        }
      }
    }, { passive: false });

    const finishTouch = (e) => {
      const isCancel = e && e.type === 'touchcancel';
      clearTimers();

      if (gesturePhase === 'edit_tap_exit' && !isCancel) {
        const dt = Date.now() - tapStartMs;
        const pt = e.changedTouches && e.changedTouches[0];
        const moveD = pt ? Math.hypot(pt.clientX - tapCheckX, pt.clientY - tapCheckY) : 0;
        if (dt < 450 && moveD < 14 && !(this._justEnteredTouchEditAt && (Date.now() - this._justEnteredTouchEditAt) < 450)) {
          if (e.cancelable) e.preventDefault();
          this.exitTouchSlotEditMode();
        }
      } else if (gesturePhase === 'dragging' && !isCancel) {
        const slot = typeof slotOrIndex === 'object' ? slotOrIndex : this.slots[slotOrIndex];
        const idx = slot ? this.slots.indexOf(slot) : -1;
        if (idx !== -1) {
          if (dragSwapTargetIdx !== null && dragSwapTargetIdx !== idx && dragSwapTargetIdx < this.slotCount) {
            if (this.layoutMode === 'custom') {
              slot.x = initSlotX;
              slot.y = initSlotY;
              this.swapCustomSlots(idx, dragSwapTargetIdx);
            } else {
              this.swapSlots(idx, dragSwapTargetIdx);
            }
            if (navigator.vibrate) try { navigator.vibrate(14); } catch (_) {}
          } else if (this.layoutMode === 'custom' && pendingCustomX !== null && pendingCustomY !== null) {
            slot.x = pendingCustomX;
            slot.y = pendingCustomY;
            this.preventOverlap(idx);
            slotEl.style.left = `${slot.x}px`;
            slotEl.style.top = `${slot.y}px`;
            this.updateGridLayout();
          }
        }
      }

      cleanupGhost();
      dragSwapTargetIdx = null;
      pendingCustomX = null;
      pendingCustomY = null;
      gesturePhase = 'idle';
    };

    slotEl.addEventListener('touchend', finishTouch, { passive: false });
    slotEl.addEventListener('touchcancel', finishTouch, { passive: true });
  }

  dockSlotToEdge(fromIndex, toIndex, edge) {
    const fromSlot = this.slots[fromIndex];
    const targetSlot = this.slots[toIndex];
    if (!fromSlot || !targetSlot) return;

    if (this.layoutMode !== 'custom') {
      this.setLayoutMode('custom');
    }

    const fromEl = fromSlot.slotEl || document.getElementById(`slot-${fromIndex}`);
    const targetEl = targetSlot.slotEl || document.getElementById(`slot-${toIndex}`);
    const gridRect = this.playersGrid.getBoundingClientRect();

    if (targetSlot.w === null || targetSlot.h === null || targetSlot.x === null || targetSlot.y === null) {
      const tRect = targetEl ? targetEl.getBoundingClientRect() : { width: 380, height: 240, left: 14, top: 14 };
      targetSlot.w = Math.max(260, Math.round(tRect.width));
      targetSlot.h = Math.max(160, Math.round(tRect.height));
      targetSlot.x = Math.max(14, Math.round(tRect.left - gridRect.left + this.playersGrid.scrollLeft));
      targetSlot.y = Math.max(14, Math.round(tRect.top - gridRect.top + this.playersGrid.scrollTop));
    }

    if (fromSlot.w === null || fromSlot.h === null) {
      const fRect = fromEl ? fromEl.getBoundingClientRect() : { width: 380, height: 240 };
      fromSlot.w = Math.max(260, Math.round(fRect.width));
      fromSlot.h = Math.max(160, Math.round(fRect.height));
    }

    const gap = 12;
    if (edge === 'left') {
      fromSlot.x = Math.max(14, targetSlot.x - fromSlot.w - gap);
      fromSlot.y = targetSlot.y;
    } else if (edge === 'right') {
      fromSlot.x = targetSlot.x + targetSlot.w + gap;
      fromSlot.y = targetSlot.y;
    } else if (edge === 'top') {
      fromSlot.x = targetSlot.x;
      fromSlot.y = Math.max(14, targetSlot.y - fromSlot.h - gap);
    } else if (edge === 'bottom') {
      fromSlot.x = targetSlot.x;
      fromSlot.y = targetSlot.y + targetSlot.h + gap;
    }

    this.preventOverlap(fromIndex);

    if (fromEl) {
      fromEl.style.position = 'absolute';
      fromEl.style.left = `${fromSlot.x}px`;
      fromEl.style.top = `${fromSlot.y}px`;
      fromEl.style.width = `${fromSlot.w}px`;
      fromEl.style.height = `${fromSlot.h}px`;
    }
    if (targetEl) {
      targetEl.style.position = 'absolute';
      targetEl.style.left = `${targetSlot.x}px`;
      targetEl.style.top = `${targetSlot.y}px`;
      targetEl.style.width = `${targetSlot.w}px`;
      targetEl.style.height = `${targetSlot.h}px`;
    }

    this.updateGridLayout();
  }

  swapSlots(fromIndex, toIndex) {
    if (fromIndex >= this.slotCount || toIndex >= this.slotCount || fromIndex === toIndex) return;

    const slotA = this.slots[fromIndex];
    const slotB = this.slots[toIndex];

    slotA.index = toIndex;
    slotB.index = fromIndex;

    this.slots[fromIndex] = slotB;
    this.slots[toIndex] = slotA;

    this.renderSlots();
  }

  swapCustomSlots(fromIndex, toIndex) {
    if (fromIndex >= this.slotCount || toIndex >= this.slotCount || fromIndex === toIndex) return;

    const slotA = this.slots[fromIndex];
    const slotB = this.slots[toIndex];
    if (!slotA || !slotB) return;

    if (slotA.x === null || slotB.x === null) {
      this.initCustomPositionsFromCurrent();
    }

    const tempX = slotA.x;
    const tempY = slotA.y;
    const tempW = slotA.w;
    const tempH = slotA.h;

    slotA.x = slotB.x;
    slotA.y = slotB.y;
    slotA.w = slotB.w;
    slotA.h = slotB.h;

    slotB.x = tempX;
    slotB.y = tempY;
    slotB.w = tempW;
    slotB.h = tempH;

    const elA = slotA.slotEl || document.getElementById(`slot-${fromIndex}`);
    const elB = slotB.slotEl || document.getElementById(`slot-${toIndex}`);
    if (elA) {
      elA.style.left = `${slotA.x}px`;
      elA.style.top = `${slotA.y}px`;
      elA.style.width = `${slotA.w}px`;
      elA.style.height = `${slotA.h}px`;
    }
    if (elB) {
      elB.style.left = `${slotB.x}px`;
      elB.style.top = `${slotB.y}px`;
      elB.style.width = `${slotB.w}px`;
      elB.style.height = `${slotB.h}px`;
    }

    this.updateGridLayout();
  }

  reorderSlotsInGrid(fromIndex, toIndex, edge) {
    if (fromIndex >= this.slotCount || toIndex >= this.slotCount || fromIndex === toIndex) return;
    const [moved] = this.slots.splice(fromIndex, 1);
    let targetIdx = toIndex;
    if (fromIndex < toIndex) {
      targetIdx = toIndex - 1;
    }
    if (edge === 'right' || edge === 'bottom') {
      targetIdx++;
    }
    targetIdx = Math.max(0, Math.min(this.slots.length, targetIdx));
    // Ensure dropping onto another slot's edge always moves the slot if targetIdx landed back on fromIndex
    if (targetIdx === fromIndex) {
      targetIdx = toIndex;
    }
    this.slots.splice(targetIdx, 0, moved);
    this.slots.forEach((s, idx) => { s.index = idx; });
    this.renderSlots();
  }

  getEmptySlotHTML(slot) {
    const i = slot.index;
    return `
      <div class="slot-empty">
        <div class="slot-empty-icon">${ICONS.tv}</div>
        <div style="font-size: 13.5px; font-weight: 800; color: #fff; margin-bottom: 4px;">슬롯 ${i + 1} 비어있음</div>
        <div style="font-size: 11.5px; color: var(--text-muted); margin-bottom: 12px;">원하는 플랫폼 또는 콘텐츠를 선택해 추가하세요</div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: center;" onclick="event.stopPropagation()">
          ${(slot.channelId || slot.lastChannelId || (slot.lastType === 'youtube' && slot.lastYtVideoId)) ? (slot.lastType === 'youtube' ? `
          <button class="btn btn-sm" style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.6); color: #fff; font-weight: 800; display: inline-flex; align-items: center; gap: 4px;" onclick="window.multiview.reconnectSlot(${i})" title="마지막으로 보던 유튜브 영상 다시 열기">
            ${ICONS.refresh} '${escapeHtml(slot.lastTitle || slot.channelName || slot.lastChannelName || '이전 영상')}' 다시 열기
          </button>` : `
          <button class="btn btn-sm" style="background: rgba(0, 255, 163, 0.2); border: 1px solid var(--accent-color); color: #fff; font-weight: 800; display: inline-flex; align-items: center; gap: 4px;" onclick="window.multiview.reconnectSlot(${i})" title="마지막으로 보던 방송 다시 연결">
            ${ICONS.refresh} '${escapeHtml(slot.channelName || slot.lastChannelName || '이전 방송')}' 재접속
          </button>`) : ''}
          <button class="btn btn-sm btn-primary" onclick="window.multiview.promptAddStream(${i}, 'explore')">
            + 치지직 방송
          </button>
          <button class="btn btn-sm" style="background:#ef4444; color:#fff; font-weight:700;" onclick="window.multiview.promptAddStream(${i}, 'youtube')">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style="display:inline-block; vertical-align:middle; margin-right:2px;"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            + 유튜브 영상
          </button>
          <button class="btn btn-sm btn-secondary" onclick="window.multiview.promptAddStream(${i}, 'clips')">
            + 클립 추가
          </button>
          ${this.slotCount > 1 ? `
          <button class="btn btn-sm btn-ghost" style="color: #f87171; border: 1px solid rgba(248, 113, 113, 0.4);" onclick="window.multiview.removeSpecificSlot(${i})" title="이 빈 슬롯 제거">
            ✕ 슬롯 제거
          </button>` : ''}
        </div>
      </div>
    `;
  }

  getActiveSlotUILayerHTML(slot) {
    const i = slot.index;
    // Recording control HTML (Hidden for YouTube slots)
    let recordBtnHtml = '';
    if (slot.type !== 'youtube') {
      if (!slot.recordJobId) {
        recordBtnHtml = `<button class="slot-ctrl-btn" onclick="window.multiview.startRecordingSlot(${i})" title="[원본 녹화] 실시간 원본 신호 녹화">${ICONS.recordDot}</button>`;
      } else if (slot.recordStatus === 'recording') {
        recordBtnHtml = `
          <div class="slot-record-indicator">● 원본 녹화 중</div>
          <button class="slot-ctrl-btn" onclick="window.multiview.pauseRecordingSlot(${i})" title="녹화 일시정지">${ICONS.recordPause}</button>
          <button class="slot-ctrl-btn" onclick="window.multiview.stopRecordingSlot(${i})" title="녹화 종료">${ICONS.recordStop}</button>
        `;
      } else if (slot.recordStatus === 'paused') {
        recordBtnHtml = `
          <div class="slot-record-indicator paused">❚❚ 일시정지</div>
          <button class="slot-ctrl-btn" onclick="window.multiview.resumeRecordingSlot(${i})" title="녹화 재개">${ICONS.recordResume}</button>
          <button class="slot-ctrl-btn" onclick="window.multiview.stopRecordingSlot(${i})" title="녹화 종료">${ICONS.recordStop}</button>
        `;
      }
    }

    let screenRecBtnHtml = '';
    if (slot.type !== 'youtube') {
      if (slot.isScreenRecording) {
        screenRecBtnHtml = `
          <button class="slot-screen-indicator" onclick="window.multiview.stopScreenRecording(${i})" title="화면 녹화 중지 (클릭 시 MP4로 자동 저장)">
            ${ICONS.screenRecord} 화면 녹화 중: ${slot.screenRecSecs || 0}s
          </button>
        `;
      } else {
        screenRecBtnHtml = `
          <button class="slot-ctrl-btn" onclick="window.multiview.startScreenRecording(${i})" title="[화면 녹화] 현재 슬롯 화면 녹화 (되돌려본 30초 전 화면 그대로 녹화)">
            ${ICONS.screenRecord}
          </button>
        `;
      }
    }

    const titleEsc = slot.title ? slot.title.replace(/"/g, '&quot;') : '';
    const nameEsc = slot.channelName ? slot.channelName.replace(/"/g, '&quot;') : '스트리머';

    const chzzkIconSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4.09 12.63a1 1 0 0 0 .77 1.64H11l-1 7.73 8.91-10.63a1 1 0 0 0-.77-1.64H13l1-7.73z"/></svg>`;
    const ytIconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`;

    let badgeHtml = `<span class="slot-platform-badge slot-badge-chzzk-live" title="치지직 생방송">${chzzkIconSvg}</span>`;
    if (slot.type === 'vod') {
      badgeHtml = `<span class="slot-platform-badge slot-badge-chzzk-vod" title="치지직 다시보기">${chzzkIconSvg}</span>`;
    } else if (slot.type === 'clip') {
      badgeHtml = `<span class="slot-platform-badge slot-badge-chzzk-clip" title="치지직 클립">${chzzkIconSvg}</span>`;
    } else if (slot.type === 'youtube') {
      badgeHtml = `<span class="slot-platform-badge slot-badge-youtube" title="유튜브 무광고 영상">${ytIconSvg}</span>`;
    }

    const channelClickAction = `window.multiview.openSlotChannel(${i})`;

    let centerCtrlsHtml = '';
    if (slot.type === 'vod') {
      centerCtrlsHtml = `
        <button class="slot-ctrl-btn" id="slot-play-btn-${i}" onclick="window.multiview.togglePlaySlot(${i})" title="재생/일시정지">${ICONS.pause}</button>
        <div class="slot-vod-slider-wrap">
          <input type="range" min="0" max="100" value="0" step="0.1" class="slot-vod-slider" id="slot-vod-slider-${i}" oninput="this._isDragging=true; window.multiview.seekVodSlot(${i}, this.value)" onchange="this._isDragging=false;" draggable="false">
        </div>
        <span id="slot-vod-time-${i}" class="slot-vod-time">00:00 / 00:00</span>
      `;
    } else if (slot.type === 'clip') {
      const clipCountText = slot.clipList && slot.clipList.length > 0 ? `${slot.clipIndex + 1}/${slot.clipList.length}` : '클립';
      centerCtrlsHtml = `
        <button class="slot-ctrl-btn" onclick="window.multiview.prevClipInSlot(${i})" title="이전 클립">${ICONS.prevClip}</button>
        <button class="slot-ctrl-btn" id="slot-play-btn-${i}" onclick="window.multiview.togglePlaySlot(${i})" title="재생/일시정지">${ICONS.pause}</button>
        <button class="slot-ctrl-btn" onclick="window.multiview.nextClipInSlot(${i})" title="다음 클립">${ICONS.nextClip}</button>
        <span style="font-size: 11px; color: #fdba74; font-weight: 800; padding: 2px 4px;">${clipCountText}</span>
      `;
    } else if (slot.type === 'youtube') {
      centerCtrlsHtml = `
        <button class="slot-ctrl-btn" id="slot-play-btn-${i}" onclick="window.multiview.toggleYouTubeSlot(${i})" title="재생/일시정지">${slot.isPlaying !== false ? ICONS.pause : ICONS.play}</button>
        <button class="slot-ctrl-btn" onclick="window.multiview.rewindYouTubeSlot(${i}, 10)" title="10초 뒤로">${ICONS.rewind10}</button>
        <div class="slot-vod-slider-wrap">
          <input type="range" min="0" max="100" value="0" step="0.1" class="slot-vod-slider" id="slot-yt-slider-${i}" oninput="this._isDragging=true; window.multiview.seekYouTubeSlot(${i}, this.value)" onchange="this._isDragging=false;" draggable="false">
        </div>
        <span id="slot-yt-time-${i}" class="slot-vod-time">00:00 / 00:00</span>
      `;
    } else {
      const isPaused = slot.videoEl && slot.videoEl.paused;
      centerCtrlsHtml = `
        <button class="slot-ctrl-btn" id="slot-play-btn-${i}" onclick="window.multiview.togglePlaySlot(${i})" title="${isPaused ? '생방송 재생' : '생방송 일시정지'}">
          ${isPaused ? ICONS.play : ICONS.pause}
        </button>
        <button class="slot-ctrl-btn" onclick="window.multiview.rewindSlot(${i}, 10)" title="10초 전으로 되돌려보기 (최대 30초 이전까지)">
          ${ICONS.rewind10}
        </button>
        <button class="slot-live-status-btn ${slot.isTimeshifted && slot.timeshiftSeconds > 0 ? 'timeshifted' : 'live-now'}" id="slot-live-btn-${i}" onclick="window.multiview.jumpToLive(${i})" title="${slot.isTimeshifted ? '클릭하여 실시간(LIVE)으로 즉시 복귀' : '현재 실시간 시청 중'}">
          ${slot.isTimeshifted && slot.timeshiftSeconds > 0 ? `-${slot.timeshiftSeconds}초` : '● LIVE'}
        </button>
      `;
    }

    const streamInfoContentHtml = slot.type === 'youtube' ? `
      <span class="slot-title is-primary" title="${titleEsc}">${titleEsc}</span>
      <span class="slot-channel-name is-secondary" onclick="${channelClickAction}" style="cursor: pointer;" title="채널 홈 및 콘텐츠로 이동">${nameEsc}</span>
    ` : `
      <span class="slot-channel-name is-primary" onclick="${channelClickAction}" style="cursor: pointer;" title="채널 홈 및 콘텐츠로 이동">${nameEsc}</span>
      <span class="slot-title is-secondary" title="${titleEsc}">${titleEsc}</span>
    `;

    const isYt = slot.type === 'youtube';
    const reconnectTitle = isYt ? '유튜브 영상 새로고침' : '방송 재접속 (새로고침)';
    const reconnectLabel = isYt ? '영상 새로고침' : '방송 재접속';
    const errTitle = isYt
      ? `${escapeHtml(slot.title || slot.channelName || '유튜브 영상')} 재생 오류`
      : `${escapeHtml(slot.channelName || '방송')} 연결 실패`;
    const errDefaultMsg = isYt
      ? '유튜브 영상을 불러오지 못했습니다. 새로고침해 주세요.'
      : '스트림 연결에 실패했거나 일시적인 네트워크 오류가 발생했습니다.';

    return `
      <!-- Top Overlay: Streamer info & controls -->
      <div class="slot-overlay-top">
        <div class="slot-stream-info">
          ${badgeHtml}
          ${slot.userCount != null && slot.type === 'live' ? `
            <span class="slot-user-count" id="slot-user-count-${i}" title="실시간 시청자 수">👤 ${Number(slot.userCount).toLocaleString()}명</span>
          ` : `<span class="slot-user-count" id="slot-user-count-${i}" style="display:none;"></span>`}
          ${streamInfoContentHtml}
        </div>
        <div class="slot-overlay-top-right" id="slot-top-right-${i}" style="display: flex; gap: 5px; align-items: center;">
          <button class="slot-ctrl-btn slot-reconnect-btn" onclick="window.multiview.reconnectSlot(${i})" title="${reconnectTitle}">${ICONS.refresh}</button>
          ${!isYt ? `<button class="slot-ctrl-btn" onclick="window.multiview.captureSlotScreenshot(${i})" title="현재 화면 캡처">${ICONS.camera}</button>` : ''}
          <span id="slot-rec-group-${i}" style="display: flex; gap: 5px; align-items: center;">
            ${recordBtnHtml}
          </span>
          <span id="slot-screen-rec-group-${i}" style="display: flex; gap: 5px; align-items: center;">
            ${screenRecBtnHtml}
          </span>
          <button class="slot-ctrl-btn" onclick="window.multiview.closeSlot(${i})" title="화면 닫기">${ICONS.close}</button>
        </div>
      </div>

      <!-- In-Slot Error / Disconnect Overlay with Reconnect Button -->
      ${slot.hasError ? `
        <div class="slot-error-overlay" id="slot-error-overlay-${i}" onmousedown="event.stopPropagation()" onclick="event.stopPropagation()">
          <div class="slot-error-card">
            <div class="slot-error-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div class="slot-error-title">${errTitle}</div>
            <div class="slot-error-msg">${escapeHtml(slot.errorMessage || errDefaultMsg)}</div>
            <div class="slot-error-actions">
              <button class="btn btn-sm btn-primary slot-error-retry-btn" onclick="window.multiview.reconnectSlot(${i})">
                ${ICONS.refresh} <span>${reconnectLabel}</span>
              </button>
              <button class="btn btn-sm btn-ghost" onclick="window.multiview.closeSlot(${i})">
                슬롯 닫기
              </button>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Compact Semi-Transparent Mute Indicator Button at Bottom-Left -->
      <button class="slot-unmute-btn" onclick="window.multiview.toggleMute(${i})" title="음소거 중 (클릭하여 소리 켜기)" style="display: ${slot.muted ? 'inline-flex' : 'none'};">
        ${ICONS.volumeMute}
      </button>

      <!-- YouTube Custom Subtitle Overlay -->
      ${slot.type === 'youtube' ? `
        <div class="slot-yt-subtitle-overlay" id="slot-yt-sub-overlay-${i}" style="display: ${slot.ytSubtitlesEnabled && slot.ytCurrentSubtitleText ? 'flex' : 'none'};">
          <span class="slot-yt-subtitle-text" id="slot-yt-sub-text-${i}">${escapeHtml(slot.ytCurrentSubtitleText || '')}</span>
        </div>
      ` : ''}

      <!-- YouTube End-Screen Overlay (Replay + Related Videos + Close Slot) -->
      ${slot.type === 'youtube' ? `
        <div class="slot-yt-endscreen" id="slot-yt-endscreen-${i}" style="display: ${slot.ytEnded ? 'flex' : 'none'};" onmousedown="event.stopPropagation()" onclick="event.stopPropagation()">
          ${slot.ytEnded ? this.getYouTubeEndScreenInnerHTML(slot) : ''}
        </div>
      ` : ''}

      <!-- Bottom Controls Overlay -->
      <div class="slot-overlay-bottom">
        ${(slot.type === 'youtube' || slot.type === 'vod') ? `
          <div class="slot-seekbar-row">
            <input type="range" min="0" max="100" value="0" step="0.1" class="slot-vod-slider slot-yt-slider" id="${slot.type === 'youtube' ? `slot-yt-slider-${i}` : `slot-vod-slider-${i}`}" oninput="this._isDragging=true; window.multiview.${slot.type === 'youtube' ? 'seekYouTubeSlot' : 'seekVodSlot'}(${i}, this.value)" onchange="this._isDragging=false;" draggable="false">
          </div>
        ` : ''}
        <div class="slot-ctrls-row">
          <div class="slot-ctrls-left">
            <button class="slot-ctrl-btn" onclick="window.multiview.toggleMute(${i})" title="${slot.muted ? '소리 켜기' : '음소거'}">
              ${slot.muted ? ICONS.volumeMute : ICONS.volumeUp}
            </button>
            <input type="range" min="0" max="1" step="0.02" value="${slot.muted ? 0 : slot.volume}" 
                   class="slot-volume-slider"
                   style="width: 70px; accent-color: var(--accent-color); cursor: pointer;"
                   oninput="window.multiview.setVolume(${i}, this.value)"
                   onchange="window.multiview.setVolume(${i}, this.value)"
                   onmousedown="event.stopPropagation();"
                   onclick="event.stopPropagation();"
                   draggable="false">
            <button class="btn btn-sm slot-solo-btn" style="font-size: 11px; padding: 2px 6px; background: rgba(255,255,255,0.1);" onclick="window.multiview.soloAudio(${i})" title="이 슬롯만 소리 켜기">
              Solo
            </button>
            ${slot.type === 'youtube' ? `
              <button class="slot-ctrl-btn" id="slot-play-btn-${i}" onclick="window.multiview.toggleYouTubeSlot(${i})" title="재생/일시정지">${slot.isPlaying !== false ? ICONS.pause : ICONS.play}</button>
              <button class="slot-ctrl-btn" onclick="window.multiview.rewindYouTubeSlot(${i}, 10)" title="10초 뒤로">${ICONS.rewind10}</button>
              <span id="slot-yt-time-${i}" class="slot-vod-time">${slot.isLive ? '<span style="color:#ef4444;font-weight:800;">● LIVE</span>' : '00:00 / 00:00'}</span>
            ` : (slot.type === 'vod' ? `
              <button class="slot-ctrl-btn" id="slot-play-btn-${i}" onclick="window.multiview.togglePlaySlot(${i})" title="재생/일시정지">${ICONS.pause}</button>
              <span id="slot-vod-time-${i}" class="slot-vod-time">00:00 / 00:00</span>
            ` : (slot.type === 'clip' ? `
              <button class="slot-ctrl-btn" onclick="window.multiview.prevClipInSlot(${i})" title="이전 클립">${ICONS.prevClip}</button>
              <button class="slot-ctrl-btn" id="slot-play-btn-${i}" onclick="window.multiview.togglePlaySlot(${i})" title="재생/일시정지">${ICONS.pause}</button>
              <button class="slot-ctrl-btn" onclick="window.multiview.nextClipInSlot(${i})" title="다음 클립">${ICONS.nextClip}</button>
              <span style="font-size: 11px; color: #fdba74; font-weight: 800; padding: 2px 4px;">${slot.clipList && slot.clipList.length > 0 ? `${slot.clipIndex + 1}/${slot.clipList.length}` : '클립'}</span>
            ` : `
              <button class="slot-ctrl-btn" id="slot-play-btn-${i}" onclick="window.multiview.togglePlaySlot(${i})" title="${slot.videoEl && slot.videoEl.paused ? '생방송 재생' : '생방송 일시정지'}">
                ${slot.videoEl && slot.videoEl.paused ? ICONS.play : ICONS.pause}
              </button>
              <button class="slot-ctrl-btn" onclick="window.multiview.rewindSlot(${i}, 10)" title="10초 전으로 되돌려보기 (최대 30초 이전까지)">
                ${ICONS.rewind10}
              </button>
              <button class="slot-live-status-btn ${slot.isTimeshifted && slot.timeshiftSeconds > 0 ? 'timeshifted' : 'live-now'}" id="slot-live-btn-${i}" onclick="window.multiview.jumpToLive(${i})" title="${slot.isTimeshifted ? '클릭하여 실시간(LIVE)으로 즉시 복귀' : '현재 실시간 시청 중'}">
                ${slot.isTimeshifted && slot.timeshiftSeconds > 0 ? `-${slot.timeshiftSeconds}초` : '● LIVE'}
              </button>
            `))}
          </div>

          <div class="slot-ctrls-right">
            ${slot.type === 'youtube' ? `
              <button class="slot-ctrl-btn slot-yt-toggle-btn ${slot.ytLoop ? 'active' : ''}" id="slot-yt-loop-btn-${i}" onclick="window.multiview.toggleYouTubeLoop(${i})" title="반복 재생 ${slot.ytLoop ? '켜짐 (클릭 시 해제)' : '꺼짐 (클릭 시 반복 재생)'}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>
              </button>
              <button class="slot-ctrl-btn slot-yt-toggle-btn ${slot.ytSubtitlesEnabled ? 'active' : ''}" id="slot-yt-cc-btn-${i}" onclick="window.multiview.toggleYouTubeSubtitles(${i})" title="자막 ${slot.ytSubtitlesEnabled ? '끄기' : '켜기'}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h4M15 15h2M7 11h2M13 11h4"/></svg>
              </button>
              <button class="slot-ctrl-btn ${slot.relatedOpen ? 'active' : ''}" id="slot-rel-btn-${i}" onclick="window.multiview.toggleSlotRelated(${i})" title="관련 추천 영상 열기/닫기">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
              </button>
              <button class="slot-ctrl-btn ${slot.playlistOpen ? 'active' : ''}" id="slot-pl-btn-${i}" onclick="window.multiview.toggleSlotPlaylist(${i})" title="재생목록 열기/닫기">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              </button>
              <button class="slot-ctrl-btn ${slot.chatOpen ? 'active' : ''}" id="slot-chat-toggle-btn-${i}" onclick="window.multiview.toggleSlotChat(${i})" title="${slot.isLive ? '유튜브 실시간 채팅 켜기/끄기 (단축키 C)' : '유튜브 영상 설명 및 댓글 열기/닫기 (단축키 C)'}">${ICONS.chat}</button>
              <select class="slot-quality-select" id="slot-yt-quality-${i}" onchange="window.multiview.changeYouTubeQuality(${i}, this.value)" title="유튜브 재생 화질 선택">
                <option value="-1" ${(!slot.ytQuality || slot.ytQuality == -1) ? 'selected' : ''}>화질: 자동</option>
                <option value="1080" ${slot.ytQuality == 1080 ? 'selected' : ''}>1080p</option>
                <option value="720" ${slot.ytQuality == 720 ? 'selected' : ''}>720p</option>
                <option value="480" ${slot.ytQuality == 480 ? 'selected' : ''}>480p</option>
                <option value="360" ${slot.ytQuality == 360 ? 'selected' : ''}>360p</option>
              </select>
            ` : ''}
            ${slot.type === 'live' ? `
              <select class="slot-quality-select" onchange="window.multiview.changeQuality(${i}, this.value)">
                <option value="-1">화질: 자동</option>
                <option value="1080">1080p</option>
                <option value="720">720p</option>
                <option value="480">480p</option>
                <option value="360">360p</option>
              </select>
              <button class="slot-ctrl-btn" onclick="window.multiview.toggleSlotChat(${i})" title="실시간 채팅 켜기/끄기 (단축키 C)">${ICONS.chat}</button>
            ` : (slot.type === 'vod' ? `
              <button class="slot-ctrl-btn" onclick="window.multiview.toggleSlotChat(${i})" title="다시보기 채팅 켜기/끄기 (단축키 C)">${ICONS.chat}</button>
            ` : '')}
            <button class="slot-ctrl-btn" onclick="window.multiview.toggleFullscreen(${i})" title="전체화면">${ICONS.fullscreen}</button>
          </div>
        </div>
      </div>
    `;
  }

  getSlotPlaylistColumnHTML(slot) {
    const i = slot.index;
    const plW = slot.playlistWidth || 280;
    const title = slot.playlistTitle || '재생목록';
    const items = slot.playlistItems || [];
    const curIdx = typeof slot.playlistIndex === 'number' ? slot.playlistIndex : 0;
    return `
      <!-- Right: Side-by-Side Embedded Playlist Column (Requirement 2) -->
      <div class="slot-playlist-column ${slot.playlistOpen ? '' : 'collapsed'}" id="slot-playlist-${i}" style="width: ${plW}px;">
        <div class="slot-playlist-resizer" onmousedown="window.multiview.initSlotPlaylistResize(event, ${i})" title="드래그하여 재생목록 창 너비 조절"></div>
        <div class="slot-playlist-header">
          <span style="display: flex; align-items: center; gap: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            <span id="slot-pl-title-${i}">${escapeHtml(title)}</span>
          </span>
          <span id="slot-pl-counter-${i}" style="font-size: 11px; color: var(--accent-color); font-weight: 700; flex-shrink: 0;">
            ${items.length > 0 ? `${curIdx + 1} / ${items.length}` : '0개'}
          </span>
          <button class="slot-header-icon-btn btn-close" onclick="window.multiview.toggleSlotPlaylist(${i})" title="닫기" style="flex-shrink: 0; margin-left: 4px;">${ICONS.close}</button>
        </div>
        <div class="slot-playlist-list" id="slot-pl-list-${i}">
          ${this.getSlotPlaylistItemsInnerHTML(slot)}
        </div>
      </div>
    `;
  }

  getSlotPlaylistItemsInnerHTML(slot) {
    const items = slot.playlistItems || [];
    if (!items || items.length === 0) {
      return '<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 11.5px;">재생목록 항목이 없습니다.</div>';
    }
    const curIdx = typeof slot.playlistIndex === 'number' ? slot.playlistIndex : 0;
    return items.map((it, idx) => {
      const isActive = idx === curIdx;
      const vidId = it.videoId || it.id || '';
      const title = it.title || '영상 ' + (idx + 1);
      const chName = it.channelName || it.author || '';
      const thumb = it.thumbnail || `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`;
      const dur = it.duration || '';
      return `
        <div class="slot-pl-item ${isActive ? 'active' : ''}" onclick="window.multiview.playPlaylistItem(${slot.index}, ${idx})" title="${escapeHtml(title)}">
          <div class="slot-pl-thumb-wrap">
            <img class="slot-pl-thumb" src="${escapeHtml(thumb)}" onerror="this.src='./static/img/favicon.png'" alt="">
            ${dur ? `<span class="slot-pl-dur">${escapeHtml(dur)}</span>` : ''}
          </div>
          <div class="slot-pl-info">
            <div class="slot-pl-title">${isActive ? '▶ ' : ''}${escapeHtml(title)}</div>
            ${chName ? `<div class="slot-pl-author">${escapeHtml(chName)}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  renderSlotPlaylistItems(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot) return;
    const listEl = document.getElementById(`slot-pl-list-${slotIndex}`);
    if (listEl) {
      listEl.innerHTML = this.getSlotPlaylistItemsInnerHTML(slot);
      const activeItem = listEl.querySelector('.slot-pl-item.active');
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
    const counterEl = document.getElementById(`slot-pl-counter-${slotIndex}`);
    if (counterEl && slot.playlistItems) {
      const curIdx = typeof slot.playlistIndex === 'number' ? slot.playlistIndex : 0;
      counterEl.textContent = `${curIdx + 1} / ${slot.playlistItems.length}`;
    }
  }

  playPlaylistItem(slotIndex, itemIndex) {
    const slot = this.slots[slotIndex];
    if (!slot || !slot.playlistItems || itemIndex < 0 || itemIndex >= slot.playlistItems.length) return;
    const item = slot.playlistItems[itemIndex];
    slot.playlistIndex = itemIndex;

    const nextVideoId = item.videoId || item.id;
    if (!nextVideoId) return;

    slot.videoId = nextVideoId;
    slot.title = item.title || slot.title;
    if (item.channelName) slot.channelName = item.channelName;
    if (item.thumbnail) slot.thumbnail = item.thumbnail;
    slot.ytEnded = false;
    slot.isPlaying = true;
    slot.currentTime = 0;

    // 슬롯 상단 타이틀 갱신
    const slotEl = document.getElementById(`slot-${slotIndex}`);
    if (slotEl) {
      const titleEl = slotEl.querySelector('.slot-title.is-primary');
      if (titleEl) titleEl.textContent = slot.title;
      const playBtn = slotEl.querySelector(`#slot-play-btn-${slotIndex}`);
      if (playBtn) playBtn.innerHTML = ICONS.pause;
      const endEl = slotEl.querySelector(`#slot-yt-endscreen-${slotIndex}`);
      if (endEl) endEl.style.display = 'none';
    }

    // 재생목록 목록 UI 활성 상태 갱신
    this.renderSlotPlaylistItems(slotIndex);

    // YouTube iframe에 loadVideo 전달 (iframe 리로드 없이 즉시 다음 영상 재생!)
    if (slot.iframeEl && slot.iframeEl.contentWindow) {
      try {
        slot.iframeEl.contentWindow.postMessage({
          action: 'loadVideo',
          videoId: nextVideoId,
          startSeconds: 0
        }, '*');
      } catch (e) {
        slot.iframeEl.referrerPolicy = 'strict-origin-when-cross-origin';
        if (window.webBackendPolyfill && window.webBackendPolyfill.isStaticWeb()) {
          slot.iframeEl.srcdoc = window.webBackendPolyfill.generateYoutubeEmbedHtml(nextVideoId, slotIndex, true);
        } else {
          slot.iframeEl.src = `/api/youtube/embed/${encodeURIComponent(nextVideoId)}?slot=${slotIndex}&autoplay=1`;
        }
      }
    } else {
      this.loadYouTubeIntoSlot(slotIndex, nextVideoId, slot.title, slot.channelName, slot.channelId, slot.thumbnail, false, {
        playlistId: slot.playlistId,
        playlistTitle: slot.playlistTitle,
        items: slot.playlistItems,
        currentIndex: itemIndex
      });
    }

    // 시청 기록 자동 저장
    if (window.youtubeUI && typeof window.youtubeUI.recordHistory === 'function') {
      window.youtubeUI.recordHistory(nextVideoId, slot.title, slot.channelName, slot.channelId, slot.thumbnail, item.duration || '');
    }
  }

  toggleSlotPlaylist(slotIndex, toggle = true) {
    const slot = this.slots[slotIndex];
    if (!slot || !slot.active || slot.type !== 'youtube') return;

    if (toggle) {
      slot.playlistOpen = !slot.playlistOpen;
    } else {
      slot.playlistOpen = false;
    }

    // 재생목록이 열리면 댓글창 및 관련영상 닫힘 (상호 배타적)
    if (slot.playlistOpen) {
      if (slot.chatOpen) {
        slot.chatOpen = false;
        const slotEl = document.getElementById(`slot-${slotIndex}`);
        if (slotEl) {
          const chatCol = slotEl.querySelector('.slot-chat-column');
          if (chatCol) chatCol.classList.add('collapsed');
        }
      }
      if (slot.relatedOpen) {
        slot.relatedOpen = false;
        const slotEl = document.getElementById(`slot-${slotIndex}`);
        if (slotEl) {
          const relCol = slotEl.querySelector('.slot-related-column');
          if (relCol) relCol.classList.add('collapsed');
          const relBtn = slotEl.querySelector(`#slot-rel-btn-${slotIndex}`);
          if (relBtn) relBtn.classList.remove('active');
        }
      }
    }

    const slotEl = document.getElementById(`slot-${slotIndex}`);
    if (slotEl) {
      const plCol = slotEl.querySelector('.slot-playlist-column');
      if (plCol) {
        plCol.classList.toggle('collapsed', !slot.playlistOpen);
        if (slot.playlistOpen) {
          plCol.style.width = `${slot.playlistWidth || 280}px`;
        }
      }
      const plBtn = slotEl.querySelector(`#slot-pl-btn-${slotIndex}`);
      if (plBtn) {
        plBtn.classList.toggle('active', !!slot.playlistOpen);
      }
    }

    if (slot.playlistOpen) {
      this.renderSlotPlaylistItems(slotIndex);
    }
  }

  toggleSlotRelated(slotIndex, toggle = true) {
    const slot = this.slots[slotIndex];
    if (!slot || !slot.active || slot.type !== 'youtube') return;

    if (toggle) {
      slot.relatedOpen = !slot.relatedOpen;
    } else {
      slot.relatedOpen = false;
    }

    const slotEl = document.getElementById(`slot-${slotIndex}`);

    if (slot.relatedOpen) {
      if (slot.chatOpen) {
        slot.chatOpen = false;
        if (slotEl) {
          const chatCol = slotEl.querySelector('.slot-chat-column');
          if (chatCol) chatCol.classList.add('collapsed');
        }
      }
      if (slot.playlistOpen) {
        slot.playlistOpen = false;
        if (slotEl) {
          const plCol = slotEl.querySelector('.slot-playlist-column');
          if (plCol) plCol.classList.add('collapsed');
          const plBtn = slotEl.querySelector(`#slot-pl-btn-${slotIndex}`);
          if (plBtn) plBtn.classList.remove('active');
        }
      }
    }

    if (slotEl) {
      const relCol = slotEl.querySelector('.slot-related-column');
      if (relCol) {
        relCol.classList.toggle('collapsed', !slot.relatedOpen);
        if (slot.relatedOpen) {
          relCol.style.width = `${slot.relatedWidth || 280}px`;
        }
      }
      const relBtn = slotEl.querySelector(`#slot-rel-btn-${slotIndex}`);
      if (relBtn) {
        relBtn.classList.toggle('active', !!slot.relatedOpen);
      }
    }

    if (slot.relatedOpen) {
      this.loadAndRenderSlotRelatedVideos(slotIndex);
    }
  }

  initSlotRelatedResize(e, slotIndex) {
    e.preventDefault();
    e.stopPropagation();
    const slot = this.slots[slotIndex];
    const slotEl = document.getElementById(`slot-${slotIndex}`);
    if (!slot || !slotEl) return;
    const relCol = slotEl.querySelector('.slot-related-column');
    if (!relCol) return;

    const startX = e.clientX;
    const startW = relCol.offsetWidth;

    const onMouseMove = (ev) => {
      const deltaX = startX - ev.clientX;
      const newW = Math.max(180, Math.min(600, startW + deltaX));
      relCol.style.width = `${newW}px`;
      slot.relatedWidth = newW;
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  async loadAndRenderSlotRelatedVideos(slotIndex, forceRefresh = false) {
    const slot = this.slots[slotIndex];
    if (!slot || !slot.videoId) return;

    const slotEl = document.getElementById(`slot-${slotIndex}`);
    const listEl = slotEl ? slotEl.querySelector(`#slot-rel-list-${slotIndex}`) : null;

    if (!forceRefresh && slot.ytRelatedVideos && slot.ytRelatedVideos.length > 0) {
      if (listEl) listEl.innerHTML = this.getSlotRelatedVideosInnerHTML(slot);
      return;
    }

    if (listEl) {
      listEl.innerHTML = '<div class="slot-related-empty">관련 추천 영상을 불러오는 중...</div>';
    }

    try {
      const res = await fetch(`/api/youtube/related/${encodeURIComponent(slot.videoId)}?limit=25`);
      const data = await res.json();
      if (data && data.success && data.videos) {
        slot.ytRelatedVideos = data.videos;
        if (listEl) listEl.innerHTML = this.getSlotRelatedVideosInnerHTML(slot);
      } else {
        if (listEl) listEl.innerHTML = '<div class="slot-related-empty">관련 추천 영상이 없습니다.</div>';
      }
    } catch (e) {
      console.warn('Failed to fetch related videos for slot:', e);
      if (listEl) listEl.innerHTML = '<div class="slot-related-empty">관련 영상을 불러올 수 없습니다.</div>';
    }
  }

  getSlotRelatedColumnHTML(slot) {
    const i = slot.index;
    const relW = slot.relatedWidth || 280;
    return `
      <!-- Right: Side-by-Side Embedded Related Videos Column (Requirement 5) -->
      <div class="slot-related-column ${slot.relatedOpen ? '' : 'collapsed'}" id="slot-related-${i}" style="width: ${relW}px;">
        <div class="slot-related-resizer" onmousedown="window.multiview.initSlotRelatedResize(event, ${i})" title="드래그하여 관련 영상 창 너비 조절"></div>
        <div class="slot-related-header">
          <span style="display: flex; align-items: center; gap: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0;">
            ${ICONS.film}
            <span style="font-weight: 800; font-size: 13px;">관련 추천 영상</span>
          </span>
          <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
            <button class="slot-header-icon-btn btn-accent" id="slot-rel-cycle-btn-${i}" onclick="window.multiview.cycleSlotRelatedVideos(${i})" title="다른 관련영상으로 갱신">
              ${ICONS.shuffle}
            </button>
            <button class="slot-header-icon-btn btn-close" onclick="window.multiview.toggleSlotRelated(${i})" title="닫기">
              ${ICONS.close}
            </button>
          </div>
        </div>
        <div class="slot-related-list" id="slot-rel-list-${i}">
          ${this.getSlotRelatedVideosInnerHTML(slot)}
        </div>
      </div>
    `;
  }

  async cycleSlotRelatedVideos(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot || !slot.videoId) return;

    slot.relatedCycle = (slot.relatedCycle || 0) + 1;
    const btn = document.getElementById(`slot-rel-cycle-btn-${slotIndex}`);
    if (btn) btn.classList.add('rotating');

    const slotEl = document.getElementById(`slot-${slotIndex}`);
    const listEl = slotEl ? slotEl.querySelector(`#slot-rel-list-${slotIndex}`) : null;

    try {
      const res = await fetch(`/api/youtube/related/${encodeURIComponent(slot.videoId)}?limit=14&cycle=${slot.relatedCycle}`);
      const data = await res.json();
      if (data && data.success && data.videos && data.videos.length > 0) {
        slot.ytRelatedVideos = data.videos;
        if (listEl) {
          listEl.innerHTML = this.getSlotRelatedVideosInnerHTML(slot);
          listEl.scrollTop = 0;
        }
        if (window.app) window.app.showToast('새로운 관련 영상 목록으로 갱신했습니다.', 'info', 1800);
      } else {
        if (window.app) window.app.showToast('더 이상 추천할 다른 영상이 없습니다.', 'warning', 1800);
      }
    } catch (e) {
      console.warn('Cycle related videos error:', e);
    } finally {
      if (btn) {
        setTimeout(() => btn.classList.remove('rotating'), 300);
      }
    }
  }

  getSlotRelatedVideosInnerHTML(slot) {
    const items = slot.ytRelatedVideos || [];
    if (!items || items.length === 0) {
      return '<div class="slot-related-empty">관련 추천 영상을 불러오는 중...</div>';
    }
    const i = slot.index;
    return items.map(v => {
      const vid = escapeHtml(v.videoId || '');
      const title = escapeHtml(v.title || '');
      const ch = escapeHtml(v.channelName || '');
      const dur = escapeHtml(v.duration || '');
      const thumb = escapeHtml(v.thumbnail || `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`);
      return `
        <div class="slot-related-item" onclick="window.multiview.playRelatedFromSidebar(${i}, '${vid}')" title="${title}">
          <div class="slot-related-item-thumb">
            <img src="${thumb}" onerror="this.src='./static/img/favicon.png'" alt="${title}" loading="lazy">
            ${dur ? `<span class="slot-related-item-dur">${dur}</span>` : ''}
          </div>
          <div class="slot-related-item-info">
            <div class="slot-related-item-title">${title}</div>
            <div class="slot-related-item-ch">${ch}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  playRelatedFromSidebar(slotIndex, videoId) {
    const slot = this.slots[slotIndex];
    if (!slot) return;
    const items = slot.ytRelatedVideos || [];
    const target = items.find(v => v.videoId === videoId) || { videoId };
    this.playRelatedYouTubeInSlot(slotIndex, target.videoId, target.title || '', target.channelName || '', target.channelId || '', target.thumbnail || '');
    setTimeout(() => {
      this.loadAndRenderSlotRelatedVideos(slotIndex, true);
    }, 500);
  }

  initSlotPlaylistResize(e, slotIndex) {
    e.preventDefault();
    e.stopPropagation();
    const slot = this.slots[slotIndex];
    if (!slot) return;
    const slotEl = document.getElementById(`slot-${slotIndex}`);
    if (!slotEl) return;
    const plCol = slotEl.querySelector('.slot-playlist-column');
    if (!plCol) return;

    const startX = e.clientX;
    const startW = plCol.offsetWidth;

    const onMouseMove = (ev) => {
      const deltaX = startX - ev.clientX;
      const maxW = Math.max(160, slotEl.offsetWidth - 200);
      const newW = Math.max(160, Math.min(maxW, startW + deltaX));
      plCol.style.width = `${newW}px`;
      slot.playlistWidth = newW;
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  getSlotChatColumnHTML(slot) {
    const i = slot.index;
    const nameEsc = slot.channelName ? slot.channelName.replace(/"/g, '&quot;') : '스트리머';
    const chatW = slot.chatWidth || 250;
    const chatFontSize = slot.chatFontSize || 12;
    return `
      <!-- Right: Side-by-Side Embedded Chat Column (Never covers video!) -->
      <div class="slot-chat-column ${slot.chatOpen ? '' : 'collapsed'}" id="slot-chat-${i}" style="width: ${chatW}px;">
        <div class="slot-chat-resizer" onmousedown="window.multiview.initSlotChatResize(event, ${i})" title="드래그하여 채팅/댓글창 너비 조절"></div>
        <div class="slot-chat-header">
          <span style="display: flex; align-items: center; gap: 5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0;">
            ${ICONS.chat}
            <span id="slot-chat-title-${i}">${nameEsc} ${slot.type === 'youtube' ? (slot.isLive ? '실시간 채팅' : '유튜브 댓글') : (slot.type === 'vod' ? '다시보기 채팅' : '채팅')}</span>
          </span>
          <div style="display: flex; align-items: center; gap: 3px; flex-shrink: 0;">
            <!-- Font size controls (Requirement 4: 글씨 및 이모티콘 크기 동시 조절) -->
            <div class="chat-font-ctrls" style="display: inline-flex; align-items: center; background: rgba(0,0,0,0.35); border-radius: 4px; padding: 1px 2px; border: 1px solid rgba(255,255,255,0.08); margin-right: 2px;">
              <button class="chat-col-btn" onclick="window.multiview.changeChatFontSize(${i}, -1)" title="채팅 글씨 및 이모티콘 축소" style="font-size: 10px; width: 18px; height: 18px; padding: 0; font-weight: 800;">A-</button>
              <span id="chat-font-display-${i}" style="font-size: 9.5px; color: var(--accent-color); padding: 0 2px; font-weight: 700; min-width: 14px; text-align: center;">${chatFontSize}</span>
              <button class="chat-col-btn" onclick="window.multiview.changeChatFontSize(${i}, 1)" title="채팅 글씨 및 이모티콘 확대" style="font-size: 11px; width: 18px; height: 18px; padding: 0; font-weight: 800;">A+</button>
            </div>
            ${slot.type === 'youtube' ? `
              <button class="chat-col-btn chat-scroll-lock-btn ${slot.autoScroll !== false ? 'locked' : ''}" id="chat-lock-btn-${i}" onclick="window.multiview.scrollToBottom(${i})" title="최신 채팅 아래로 고정" style="${slot.isLive ? '' : 'display:none;'}">
                ${ICONS.arrowDownToBottom}
              </button>
              <button class="slot-header-icon-btn btn-accent" id="slot-chat-refresh-btn-${i}" onclick="window.multiview.refreshYouTubeChatOrComments(${i})" title="${slot.isLive ? '채팅 새로고침' : '댓글 새로고침'}">${ICONS.refresh}</button>
            ` : `
              <button class="chat-col-btn chat-scroll-lock-btn ${slot.autoScroll !== false ? 'locked' : ''}" id="chat-lock-btn-${i}" onclick="window.multiview.scrollToBottom(${i})" title="최신 채팅 아래로 고정">
                ${ICONS.arrowDownToBottom}
              </button>
            `}
            <button class="slot-header-icon-btn btn-close" onclick="window.multiview.toggleSlotChat(${i})" title="닫기">${ICONS.close}</button>
          </div>
        </div>
        <div class="slot-chat-messages" id="slot-chat-messages-${i}" style="font-size: ${chatFontSize}px;" onscroll="window.multiview.handleChatScroll(${i})">
          <div class="chat-empty-hint">${slot.type === 'youtube' ? (slot.isLive ? '유튜브 실시간 채팅을 불러오는 중...' : '유튜브 댓글을 불러오는 중...') : (slot.type === 'vod' ? '다시보기 채팅 동기화 대기 중...' : '실시간 채팅 수신 중...')}</div>
        </div>
        <button class="chat-scroll-bottom-toast" id="chat-bottom-btn-${i}" onclick="window.multiview.scrollToBottom(${i})">
          <span>최신 채팅으로 고정</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      </div>
    `;
  }

  changeChatFontSize(slotIndex, delta) {
    const slot = this.slots[slotIndex];
    if (!slot) return;
    const curSize = slot.chatFontSize || 12;
    const newSize = Math.max(9, Math.min(24, curSize + delta));
    slot.chatFontSize = newSize;

    const messagesEl = document.getElementById(`slot-chat-messages-${slotIndex}`);
    if (messagesEl) {
      messagesEl.style.fontSize = `${newSize}px`;
    }
    const displayEl = document.getElementById(`chat-font-display-${slotIndex}`);
    if (displayEl) {
      displayEl.textContent = `${newSize}`;
    }
  }

  getSlotHTML(slot) {
    if (!slot.active) {
      return this.getEmptySlotHTML(slot);
    }
    return `
      <div class="slot-video-area">
        <div class="video-container" style="width: 100%; height: 100%; position: relative;">
          ${this.getActiveSlotUILayerHTML(slot)}
        </div>
      </div>
      ${this.getSlotChatColumnHTML(slot)}
    `;
  }

  // ================= Add & Load Streams =================
  promptAddStream(slotIndex, targetTab = 'explore') {
    this.targetSlotIndex = slotIndex;
    const tabLabels = {
      'explore': '치지직 생방송',
      'youtube': '유튜브 무광고 영상',
      'clips': '클립'
    };
    const tabLabel = tabLabels[targetTab] || '콘텐츠';
    if (this.slotSelectionBanner) {
      this.slotSelectionBanner.style.display = 'flex';
      this.slotSelectionText.textContent = `[슬롯 ${slotIndex + 1}] 에 재생할 ${tabLabel}을(를) 선택해주세요.`;
    }
    if (window.app) window.app.switchTab(targetTab);
  }

  cancelTargetSlot() {
    this.targetSlotIndex = null;
    if (this.slotSelectionBanner) {
      this.slotSelectionBanner.style.display = 'none';
    }
  }

  addStreamToFirstAvailableSlot(channelId) {
    let target = this.slots.findIndex(s => !s.active);
    if (target === -1) {
      // All existing slots are occupied -> dynamically add a new slot!
      this.addNewSlot(false);
      target = this.slots.length - 1;
    }
    this.loadStreamIntoSlot(target, channelId);
  }

  loadStreamIntoTargetSlot(channelId) {
    const idx = this.targetSlotIndex !== null ? this.targetSlotIndex : 0;
    this.cancelTargetSlot();
    this.loadStreamIntoSlot(idx, channelId);
  }

  async loadStreamIntoSlot(slotIndex, channelId) {
    if (slotIndex >= this.slotCount) return;

    const slot = this.slots[slotIndex];
    if (slot) {
      this.destroySlotStream(slot);
      const known = (window.app && Array.isArray(window.app.lives))
        ? window.app.lives.find(l => l.channelId === channelId)
        : null;
      slot.type = 'live';
      slot.active = true;
      slot.isLoading = true;
      slot.channelId = channelId;
      slot.lastChannelId = channelId;
      if (known) {
        slot.channelName = known.channelName || slot.channelName;
        slot.title = known.liveTitle || slot.title;
      }
      slot.hasError = false;
      slot.errorMessage = null;
      this.renderSlots();
    }

    try {
      const res = await fetch(`/api/live/${channelId}`);
      const data = await res.json();
      const masterUrl = data.streamUrl || data.masterUrl;

      if (!data.success || !masterUrl) {
        if (slot) {
          slot.active = true;
          slot.isLoading = false;
          slot.channelId = channelId;
          slot.lastChannelId = channelId;
          slot.hasError = true;
          slot.errorMessage = data.error || '방송을 재생할 수 없습니다.';
          this.renderSlots();
        }
        if (window.app) window.app.showToast(data.error || '방송을 재생할 수 없습니다.', 'error');
        return;
      }

      this.destroySlotStream(slot);

      slot.isLoading = false;
      slot.channelId = channelId;
      slot.lastChannelId = channelId;
      slot.channelName = data.channelName;
      slot.lastChannelName = data.channelName;
      slot.title = data.title;
      slot.lastTitle = data.title;
      slot.streamUrl = masterUrl;
      slot.chatChannelId = data.chatChannelId || '';
      slot.userCount = data.userCount;
      slot.type = 'live';
      slot.active = true;
      slot.hasError = false;
      slot.errorMessage = null;
      if (window.webBackendPolyfill && window.webBackendPolyfill.isStaticWeb() && !slot.chatOpen) {
        setTimeout(() => {
          if (slot.active && slot.channelId === channelId) this.prefetchSlotChat(slot);
        }, 1400);
      } else {
        this.prefetchSlotChat(slot);
      }

      // Check if any other slot is currently active and unmuted
      const anyOtherUnmuted = this.slots.some(s => s.active && s.index !== slotIndex && !s.muted);
      // By default: if no other slot is currently playing audio, start UNMUTED with sound!
      const shouldUnmute = !anyOtherUnmuted && (!window.app || !window.app.masterMuted);

      slot.muted = !shouldUnmute;
      slot.volume = 1.0;
      slot.autoScroll = true;
      slot.recordJobId = null;
      slot.recordStatus = null;
      slot.isTimeshifted = false;
      slot.timeshiftSeconds = 0;

      const video = document.createElement('video');
      video.autoplay = true;
      video.muted = !shouldUnmute;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'contain';

      const masterVol = (window.app && typeof window.app.masterVolume === 'number') ? window.app.masterVolume : 1.0;
      video.volume = shouldUnmute ? masterVol : 0;
      slot.videoEl = video;

      video.addEventListener('play', () => {
        const btn = document.getElementById(`slot-play-btn-${slot.index}`);
        if (btn) btn.innerHTML = ICONS.pause;
      });
      video.addEventListener('pause', () => {
        const btn = document.getElementById(`slot-play-btn-${slot.index}`);
        if (btn) btn.innerHTML = ICONS.play;
      });

      // Buffer stall & active watchdog tracker
      let stallStartTime = 0;
      slot.stallTimer = null;
      slot.stallCount = 0;
      let lastStallResetTimer = null;

      video.addEventListener('waiting', () => {
        if (!slot.active) return;
        stallStartTime = Date.now();
        slot.stallCount = (slot.stallCount || 0) + 1;
        const latency = (slot.hls && typeof slot.hls.liveSyncPosition === 'number' && video.currentTime) ? (slot.hls.liveSyncPosition - video.currentTime) : null;
        const bufLen = this.getBufferLength(video);
        this.sendDiagnosticLog('BUFFER', 'STALL', `Buffering/stalled (count: ${slot.stallCount}) at ${video.currentTime.toFixed(1)}s`, slot.index, slot.channelName, latency, bufLen);

        // Smart Adaptive Latency: 버퍼링 발생 시 liveSyncDuration을 1.2초 늘려 더 넉넉한 버퍼를 확보 (최대 8.5초)
        // 네트워크가 일시적으로 흔들려도 연속 끊김을 방지하는 스마트 적응형 버퍼
        if (slot.hls && slot.hls.config && !slot.isTimeshifted) {
          const curTarget = slot.hls.config.liveSyncDuration || 4.8;
          const newTarget = Math.min(8.5, curTarget + 1.2);
          if (newTarget > curTarget) {
            slot.hls.config.liveSyncDuration = newTarget;
            console.log(`[Slot ${slot.index + 1}] Adaptive buffer expansion: ${curTarget.toFixed(1)}s -> ${newTarget.toFixed(1)}s`);
          }
        }

        // Active Stall Watchdog: 2.5초 이상 멈춤(버퍼 고갈) 지속 시 즉시 실시간 위치로 점프 및 로드 재개
        if (slot.stallTimer) clearTimeout(slot.stallTimer);
        slot.stallTimer = setTimeout(() => {
          if (!slot.active || !slot.videoEl || slot.videoEl.paused) return;
          if (slot.isTimeshifted) {
            if (slot.hls) slot.hls.startLoad();
            return;
          }
          if (slot.hls && typeof slot.hls.liveSyncPosition === 'number' && slot.hls.liveSyncPosition > 0) {
            const currentLag = slot.hls.liveSyncPosition - slot.videoEl.currentTime;
            if (currentLag > 1.8) {
              console.warn(`[Slot ${slot.index + 1}] Stall watchdog: nudging playhead by ${currentLag.toFixed(1)}s to live edge`);
              this.sendDiagnosticLog('WATCHDOG', 'NUDGE', `Nudging stuck playhead by ${currentLag.toFixed(1)}s to liveSyncPosition`, slot.index, slot.channelName, currentLag);
              slot.videoEl.currentTime = slot.hls.liveSyncPosition;
              slot.hls.startLoad();
              slot.videoEl.play().catch(() => {});
            } else {
              slot.hls.startLoad();
            }
          }
        }, 2500);
      });

      video.addEventListener('playing', () => {
        if (!slot.active) return;
        if (slot.stallTimer) {
          clearTimeout(slot.stallTimer);
          slot.stallTimer = null;
        }
        if (stallStartTime > 0) {
          const stallSec = ((Date.now() - stallStartTime) / 1000).toFixed(2);
          stallStartTime = 0;
          const bufLen = this.getBufferLength(video);
          this.sendDiagnosticLog('BUFFER', 'RESUME', `Playback resumed after ${stallSec}s stall`, slot.index, slot.channelName, null, bufLen);
        }

        // 2분 동안 버퍼링 없이 안정적으로 재생되면 원래의 저지연 타겟(4.8s)으로 서서히 복귀
        if (lastStallResetTimer) clearTimeout(lastStallResetTimer);
        lastStallResetTimer = setTimeout(() => {
          if (slot.active && slot.hls && slot.hls.config && !slot.isTimeshifted) {
            slot.hls.config.liveSyncDuration = 4.8;
            slot.stallCount = 0;
            console.log(`[Slot ${slot.index + 1}] Restored base liveSyncDuration (4.8s) after stable playback`);
          }
        }, 120000);
      });

      video.addEventListener('error', (e) => {
        console.warn(`[Slot ${slot.index + 1}] Video element error:`, e);
        slot.hasError = true;
        slot.errorMessage = '비디오 스트림 재생 오류가 발생했습니다.';
        this.renderSlots();
      });

      // Direct CDN stream playback (Bypasses Python proxy bottleneck for high-performance zero-delay playback)
      if (window.Hls && window.Hls.isSupported()) {
        this.createHlsPlayer(slot, masterUrl);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = masterUrl;
        video.play().catch(err => {
          console.log('Autoplay prevented, retrying muted:', err);
          video.muted = true;
          slot.muted = true;
          video.play().catch(e => console.log('Autoplay retry failed:', e));
          this.updateSlotAudioUI(slot.index);
        });
      }

      this.renderSlots();
      this.updateBadge();
    } catch (err) {
      console.error('loadStreamIntoSlot error:', err);
      const s = this.slots[slotIndex];
      if (s) {
        s.active = true;
        s.isLoading = false;
        s.channelId = channelId;
        s.lastChannelId = channelId;
        s.hasError = true;
        s.errorMessage = err.message || '방송 로드 중 오류가 발생했습니다.';
        this.renderSlots();
      }
      this.sendDiagnosticLog('LOAD', 'ERROR', `${err.name || 'Error'}: ${err.message || err}`, slotIndex, channelId);
      if (window.app) window.app.showToast(`방송 로드 오류: ${err.message || err}`, 'error');
    }
  }

  async loadVodIntoSlot(slotIndex, videoNo, videoTitle, channelName, channelId) {
    try {
      if (slotIndex >= this.slotCount) {
        this.addNewSlot(false);
        slotIndex = this.slotCount - 1;
      }
      const slot = this.slots[slotIndex];
      this.destroySlotStream(slot);

      slot.type = 'vod';
      slot.videoNo = videoNo;
      slot.channelId = channelId || null;
      slot.channelName = channelName || '다시보기';
      slot.title = videoTitle || 'VOD';
      slot.active = true;

      const res = await fetch(`/api/videos/${videoNo}/playback`);
      const data = await res.json();
      if (!data.success || !data.streamUrl) {
        if (window.app) window.app.showToast(data.error || '다시보기 주소를 불러올 수 없습니다.', 'error');
        return;
      }

      const anyOtherUnmuted = this.slots.some(s => s.active && s.index !== slotIndex && !s.muted);
      const shouldUnmute = !anyOtherUnmuted && (!window.app || !window.app.masterMuted);

      slot.muted = !shouldUnmute;
      slot.volume = 1.0;

      const video = document.createElement('video');
      video.autoplay = true;
      video.muted = !shouldUnmute;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'contain';

      const masterVol = (window.app && typeof window.app.masterVolume === 'number') ? window.app.masterVolume : 1.0;
      video.volume = shouldUnmute ? masterVol : 0;
      slot.videoEl = video;

      if (data.isHls || (data.streamUrl && data.streamUrl.includes('.m3u8'))) {
        if (window.Hls && window.Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true, backBufferLength: 60 });
          slot.hls = hls;
          hls.loadSource(data.streamUrl);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => {
              video.muted = true;
              slot.muted = true;
              video.play().catch(() => {});
            });
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = data.streamUrl;
          video.play().catch(() => {});
        }
      } else {
        video.src = data.streamUrl;
        video.play().catch(() => {});
      }

      video.addEventListener('timeupdate', () => {
        const timeEl = document.getElementById(`slot-vod-time-${slot.index}`);
        const sliderEl = document.getElementById(`slot-vod-slider-${slot.index}`);
        if (video.duration && !isNaN(video.duration) && video.duration > 0) {
          if (timeEl) timeEl.textContent = `${this.formatSecs(video.currentTime)} / ${this.formatSecs(video.duration)}`;
          if (sliderEl && !sliderEl._isDragging) {
            sliderEl.value = (video.currentTime / video.duration) * 100;
          }
        }
      });

      this.updateGridLayout();
      this.renderSlots();
      this.updateBadge();
      this.targetSlotIndex = null;
      if (this.slotSelectionBanner) this.slotSelectionBanner.style.display = 'none';

      if (slot.channelId) {
        this.loadChannelEmojiPacks(slot.channelId);
      }
      if (slot.chatOpen) {
        this.startVodChatSync(slot);
      }

      if (window.app) {
        window.app.switchTab('multiview');
      }
    } catch (e) {
      console.error(e);
      if (window.app) window.app.showToast('다시보기 로드 중 오류가 발생했습니다.', 'error');
    }
  }

  async loadClipIntoSlot(slotIndex, clipUID, clipTitle, clipList = [], clipIndex = -1, channelName = '') {
    try {
      if (slotIndex >= this.slotCount) {
        this.addNewSlot(false);
        slotIndex = this.slotCount - 1;
      }
      const slot = this.slots[slotIndex];
      this.destroySlotStream(slot);

      slot.type = 'clip';
      slot.clipUID = clipUID;
      slot.clipList = clipList || [];
      slot.clipIndex = clipIndex >= 0 ? clipIndex : (clipList.findIndex(c => c.clipUID === clipUID) || 0);
      slot.channelName = channelName || (clipList[slot.clipIndex] ? (clipList[slot.clipIndex].streamerName || clipList[slot.clipIndex].channelName) : '클립');
      slot.title = clipTitle || (clipList[slot.clipIndex] ? clipList[slot.clipIndex].clipTitle : '클립');
      slot.active = true;

      const res = await fetch(`/api/clips/${clipUID}/playback`);
      const data = await res.json();
      if (!data.success || !data.primaryMp4Url) {
        if (window.app) window.app.showToast(data.error || '클립 주소를 불러올 수 없습니다.', 'error');
        return;
      }

      const anyOtherUnmuted = this.slots.some(s => s.active && s.index !== slotIndex && !s.muted);
      const shouldUnmute = !anyOtherUnmuted && (!window.app || !window.app.masterMuted);

      slot.muted = !shouldUnmute;
      slot.volume = 1.0;

      const video = document.createElement('video');
      video.autoplay = true;
      video.muted = !shouldUnmute;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'contain';

      const masterVol = (window.app && typeof window.app.masterVolume === 'number') ? window.app.masterVolume : 1.0;
      video.volume = shouldUnmute ? masterVol : 0;
      slot.videoEl = video;

      video.src = data.primaryMp4Url;
      video.play().catch(e => {
        video.muted = true;
        slot.muted = true;
        video.play().catch(() => {});
      });

      // Auto play next clip on ended
      video.onended = () => {
        if (slot.clipList && slot.clipList.length > 1) {
          this.nextClipInSlot(slot.index);
        } else {
          video.currentTime = 0;
          video.play().catch(() => {});
        }
      };

      this.updateGridLayout();
      this.renderSlots();
      this.updateBadge();
      this.targetSlotIndex = null;
      if (this.slotSelectionBanner) this.slotSelectionBanner.style.display = 'none';

      if (window.app) {
        window.app.switchTab('multiview');
      }
    } catch (e) {
      console.error(e);
      if (window.app) window.app.showToast('클립 로드 실패', 'error');
    }
  }

  prevClipInSlot(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot || !slot.clipList || slot.clipList.length <= 1) return;
    let nextIdx = slot.clipIndex - 1;
    if (nextIdx < 0) nextIdx = slot.clipList.length - 1;
    const c = slot.clipList[nextIdx];
    if (c) {
      this.loadClipIntoSlot(slotIndex, c.clipUID, c.clipTitle, slot.clipList, nextIdx, c.streamerName || slot.channelName);
    }
  }

  nextClipInSlot(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot || !slot.clipList || slot.clipList.length <= 1) return;
    let nextIdx = slot.clipIndex + 1;
    if (nextIdx >= slot.clipList.length) nextIdx = 0;
    const c = slot.clipList[nextIdx];
    if (c) {
      this.loadClipIntoSlot(slotIndex, c.clipUID, c.clipTitle, slot.clipList, nextIdx, c.streamerName || slot.channelName);
    }
  }

  // ================= YouTube Video Slot Player =================
  loadYouTubeIntoSlot(slotIndex, videoId, videoTitle, channelName, channelId = '', thumbnail = '', switchTab = true, playlistOptions = null) {
    try {
      if (slotIndex >= this.slotCount) {
        this.addNewSlot(false);
        slotIndex = this.slotCount - 1;
      }
      const slot = this.slots[slotIndex];
      const wasChatOpen = !!slot.chatOpen;
      const prevLoop = !!slot.ytLoop;
      const prevQuality = slot.ytQuality || -1;
      this.destroySlotStream(slot);

      slot.type = 'youtube';
      slot.videoId = videoId;
      slot.channelId = channelId || null;
      slot.channelName = channelName || 'YouTube';
      slot.title = videoTitle || 'YouTube 영상';
      slot.thumbnail = thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      slot.duration = 0;
      slot.currentTime = 0;
      slot.isPlaying = true;
      slot.isLive = Boolean(playlistOptions && playlistOptions.isLive);
      slot.active = true;

      // Playlist configuration (Requirement 2)
      if (playlistOptions && playlistOptions.playlistId) {
        slot.playlistId = playlistOptions.playlistId || null;
        slot.playlistTitle = playlistOptions.playlistTitle || '재생목록';
        slot.playlistItems = playlistOptions.items || [];
        slot.playlistIndex = typeof playlistOptions.currentIndex === 'number' ? playlistOptions.currentIndex : 0;
        slot.playlistOpen = true;
        slot.chatOpen = false;
      } else {
        slot.playlistId = null;
        slot.playlistTitle = null;
        slot.playlistItems = null;
        slot.playlistIndex = 0;
        slot.playlistOpen = false;
        slot.chatOpen = wasChatOpen;
      }

      // If playlist ID was provided without items, fetch playlist items asynchronously
      if (slot.playlistId && (!slot.playlistItems || slot.playlistItems.length === 0)) {
        const plQuery = (videoId && videoId !== slot.playlistId) ? `?video_id=${encodeURIComponent(videoId)}` : '';
        fetch(`/api/youtube/playlist/${encodeURIComponent(slot.playlistId)}${plQuery}`)
          .then(r => r.json())
          .then(data => {
            if (data && data.success && data.videos && data.videos.length > 0) {
              slot.playlistItems = data.videos;
              if (data.title && !slot.playlistTitle) slot.playlistTitle = data.title;
              this.renderSlotPlaylistItems(slotIndex);
            }
          })
          .catch(e => console.warn('Fetch playlist info failed:', e));
      }

      // YouTube playback options & end-screen state
      slot.ytEnded = false;
      slot.ytRelatedVideos = null;
      slot.ytLoop = prevLoop;
      slot.ytQuality = prevQuality;
      slot.ytSubtitlesEnabled = false;
      slot.ytSubtitleCues = null;
      slot.ytSubtitleCuesLoaded = false;
      slot.ytCurrentSubtitleText = '';

      // User Request 8: YouTube slots always start with sound ON
      slot.muted = false;
      slot.volume = 1.0;

      // Create dedicated YouTube embed iframe
      const iframe = document.createElement('iframe');
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      if (window.webBackendPolyfill && window.webBackendPolyfill.isStaticWeb()) {
        iframe.srcdoc = window.webBackendPolyfill.generateYoutubeEmbedHtml(videoId, slotIndex, true);
      } else {
        iframe.src = `/api/youtube/embed/${encodeURIComponent(videoId)}?slot=${slotIndex}&autoplay=1`;
      }
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      slot.iframeEl = iframe;

      this.updateGridLayout();
      this.renderSlots();
      this.updateBadge();
      this.targetSlotIndex = null;
      if (this.slotSelectionBanner) this.slotSelectionBanner.style.display = 'none';

      // Prefetch related videos in background so end-screen is instant
      this.prefetchYouTubeRelated(slotIndex, videoId);

      // If chat/comments column was open, load YouTube live chat or comments
      if (slot.chatOpen) {
        if (slot.isLive) {
          this.loadYouTubeLiveChat(slotIndex);
        } else {
          this.loadYouTubeSlotComments(slotIndex);
        }
      }

      iframe.onload = () => {
        const masterVol = (window.app && typeof window.app.masterYTVolume === 'number') ? window.app.masterYTVolume : 1.0;
        const effectivelyMuted = slot.muted || (window.app && window.app.masterYTMuted);
        try {
          iframe.contentWindow.postMessage({
            action: effectivelyMuted ? 'mute' : 'unmute',
            slotIndex: slot.index
          }, '*');
          if (!effectivelyMuted) {
            iframe.contentWindow.postMessage({
              action: 'setVolume',
              slotIndex: slot.index,
              volume: Math.round(slot.volume * masterVol * 100)
            }, '*');
          }
          if (slot.ytLoop) {
            iframe.contentWindow.postMessage({
              action: 'setLoop',
              slotIndex: slot.index,
              loop: true
            }, '*');
          }
          if (slot.ytQuality && slot.ytQuality != -1) {
            iframe.contentWindow.postMessage({
              action: 'setQuality',
              slotIndex: slot.index,
              quality: slot.ytQuality
            }, '*');
          }
          if (!slot.ytSubtitlesEnabled) {
            iframe.contentWindow.postMessage({
              action: 'setCaptions',
              slotIndex: slot.index,
              enabled: false
            }, '*');
          }
        } catch (e) {}
      };

      if (window.app && switchTab) {
        window.app.switchTab('multiview');
      }
    } catch (e) {
      console.error('loadYouTubeIntoSlot error:', e);
      if (window.app) window.app.showToast('유튜브 재생 중 오류가 발생했습니다.', 'error');
    }
  }

  addYouTubeToFirstAvailableSlot(videoId, videoTitle, channelName, channelId = '', thumbnail = '', switchTab = true, playlistOptions = null) {
    let target = this.slots.findIndex(s => !s.active);
    if (target === -1) {
      this.addNewSlot(false);
      target = this.slots.length - 1;
    }
    this.loadYouTubeIntoSlot(target, videoId, videoTitle, channelName, channelId, thumbnail, switchTab, playlistOptions);
  }

  toggleYouTubeSlot(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot || !slot.iframeEl) return;
    if (slot.ytEnded) {
      this.replayYouTubeSlot(slotIndex);
      return;
    }
    try {
      slot.iframeEl.contentWindow.postMessage({
        action: 'togglePlay',
        slotIndex: slotIndex
      }, '*');
    } catch (e) {}
  }

  seekYouTubeSlot(slotIndex, percent) {
    const slot = this.slots[slotIndex];
    if (!slot || !slot.iframeEl || !slot.duration) return;
    const targetSec = (parseFloat(percent) / 100) * slot.duration;
    this.seekYouTubeSlotSeconds(slotIndex, targetSec);
  }

  seekYouTubeSlotSeconds(slotIndex, targetSec) {
    const slot = this.slots[slotIndex];
    if (!slot || !slot.iframeEl) return;
    const sec = Math.max(0, parseFloat(targetSec) || 0);
    slot.currentTime = sec;
    if (slot.ytEnded) {
      slot.ytEnded = false;
      const endEl = document.getElementById(`slot-yt-endscreen-${slotIndex}`);
      if (endEl) endEl.style.display = 'none';
    }
    try {
      slot.iframeEl.contentWindow.postMessage({
        action: 'seek',
        slotIndex: slotIndex,
        seconds: sec
      }, '*');
      slot.iframeEl.contentWindow.postMessage({
        action: 'play',
        slotIndex: slotIndex
      }, '*');
    } catch (e) {}
    if (slot.ytSubtitlesEnabled && slot.ytSubtitleCues) {
      this.updateYouTubeSubtitleOverlay(slotIndex);
    }
  }

  rewindYouTubeSlot(slotIndex, seconds = 10) {
    const slot = this.slots[slotIndex];
    if (!slot || !slot.iframeEl) return;
    const targetSec = Math.max(0, (slot.currentTime || 0) - seconds);
    this.seekYouTubeSlotSeconds(slotIndex, targetSec);
  }

  toggleYouTubeLoop(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot || slot.type !== 'youtube') return;
    slot.ytLoop = !slot.ytLoop;

    const btn = document.getElementById(`slot-yt-loop-btn-${slotIndex}`);
    if (btn) {
      btn.classList.toggle('active', slot.ytLoop);
      btn.title = `반복 재생 ${slot.ytLoop ? '켜짐 (클릭 시 해제)' : '꺼짐 (클릭 시 반복 재생)'}`;
    }

    if (slot.iframeEl && slot.iframeEl.contentWindow) {
      try {
        slot.iframeEl.contentWindow.postMessage({
          action: 'setLoop',
          slotIndex: slotIndex,
          loop: slot.ytLoop
        }, '*');
      } catch (e) {}
    }
  }

  async toggleYouTubeSubtitles(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot || slot.type !== 'youtube' || !slot.videoId) return;

    slot.ytSubtitlesEnabled = !slot.ytSubtitlesEnabled;
    const btn = document.getElementById(`slot-yt-cc-btn-${slotIndex}`);
    if (btn) {
      btn.classList.toggle('active', slot.ytSubtitlesEnabled);
      btn.title = `자막 ${slot.ytSubtitlesEnabled ? '끄기' : '켜기'}`;
    }

    const overlayEl = document.getElementById(`slot-yt-sub-overlay-${slotIndex}`);

    if (!slot.ytSubtitlesEnabled) {
      slot.ytCurrentSubtitleText = '';
      if (overlayEl) overlayEl.style.display = 'none';
      if (slot.iframeEl && slot.iframeEl.contentWindow) {
        try {
          slot.iframeEl.contentWindow.postMessage({
            action: 'setCaptions',
            slotIndex: slotIndex,
            enabled: false
          }, '*');
        } catch (e) {}
      }
      return;
    }

    // Turning subtitles ON
    const targetVideoId = slot.videoId;
    if (!slot.ytSubtitleCuesLoaded) {
      try {
        const res = await fetch(`/api/youtube/subtitles/${encodeURIComponent(targetVideoId)}?lang=ko`);
        const data = await res.json();
        if (slot.videoId !== targetVideoId) return;
        slot.ytSubtitleCuesLoaded = true;
        slot.ytSubtitleCues = (data && data.cues) ? data.cues : [];
        slot.ytSubtitleLabel = (data && data.label) ? data.label : '자막';
      } catch (err) {
        slot.ytSubtitleCuesLoaded = true;
        slot.ytSubtitleCues = [];
      }
    }

    if (!slot.ytSubtitlesEnabled) return;

    if (slot.ytSubtitleCues && slot.ytSubtitleCues.length > 0) {
      // Ensure native iframe captions are off so custom overlay is crisp and never duplicated
      if (slot.iframeEl && slot.iframeEl.contentWindow) {
        try {
          slot.iframeEl.contentWindow.postMessage({
            action: 'setCaptions',
            slotIndex: slotIndex,
            enabled: false
          }, '*');
        } catch (e) {}
      }
      this.updateYouTubeSubtitleOverlay(slotIndex);
    } else {
      // Fallback to native YT IFrame caption module if no external cues were returned
      if (slot.iframeEl && slot.iframeEl.contentWindow) {
        try {
          slot.iframeEl.contentWindow.postMessage({
            action: 'setCaptions',
            slotIndex: slotIndex,
            enabled: true,
            lang: 'ko'
          }, '*');
        } catch (e) {}
      }
    }
  }

  updateYouTubeSubtitleOverlay(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot || slot.type !== 'youtube') return;
    const overlayEl = document.getElementById(`slot-yt-sub-overlay-${slotIndex}`);
    const textEl = document.getElementById(`slot-yt-sub-text-${slotIndex}`);
    if (!overlayEl || !textEl) return;

    if (!slot.ytSubtitlesEnabled || !slot.ytSubtitleCues || slot.ytSubtitleCues.length === 0) {
      overlayEl.style.display = 'none';
      return;
    }

    const t = slot.currentTime || 0;
    // Binary search or linear scan for current cue
    let activeCue = null;
    const cues = slot.ytSubtitleCues;
    let lo = 0, hi = cues.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const c = cues[mid];
      if (t < c.start) {
        hi = mid - 1;
      } else if (t > c.end) {
        lo = mid + 1;
      } else {
        activeCue = c;
        break;
      }
    }

    if (activeCue && activeCue.text) {
      slot.ytCurrentSubtitleText = activeCue.text;
      textEl.textContent = activeCue.text;
      overlayEl.style.display = 'flex';
    } else {
      slot.ytCurrentSubtitleText = '';
      overlayEl.style.display = 'none';
    }
  }

  changeYouTubeQuality(slotIndex, heightVal) {
    const slot = this.slots[slotIndex];
    if (!slot || slot.type !== 'youtube') return;
    const parsed = parseInt(heightVal, 10) || -1;
    slot.ytQuality = parsed;

    if (slot.iframeEl && slot.iframeEl.contentWindow) {
      try {
        slot.iframeEl.contentWindow.postMessage({
          action: 'setQuality',
          slotIndex: slotIndex,
          quality: parsed
        }, '*');
      } catch (e) {}
    }
  }

  async prefetchYouTubeRelated(slotIndex, videoId) {
    if (!videoId) return;
    try {
      const res = await fetch(`/api/youtube/related/${encodeURIComponent(videoId)}?limit=12`);
      const data = await res.json();
      const slot = this.slots[slotIndex];
      if (slot && slot.type === 'youtube' && slot.videoId === videoId && data.success) {
        slot.ytRelatedVideos = data.videos || [];
        if (slot.ytEnded) {
          const endEl = document.getElementById(`slot-yt-endscreen-${slotIndex}`);
          if (endEl) endEl.innerHTML = this.getYouTubeEndScreenInnerHTML(slot);
        }
      }
    } catch (e) {}
  }

  getYouTubeEndScreenInnerHTML(slot) {
    const i = slot.index;
    const titleSafe = escapeHtml(slot.title || '유튜브 영상');
    const chSafe = escapeHtml(slot.channelName || 'YouTube');
    const related = slot.ytRelatedVideos;

    let relatedHtml = '';
    if (!related) {
      relatedHtml = `<div class="yt-endscreen-empty">연관 영상을 불러오는 중...</div>`;
    } else if (related.length === 0) {
      relatedHtml = `<div class="yt-endscreen-empty">연관 추천 영상이 없습니다.</div>`;
    } else {
      relatedHtml = `<div class="yt-endscreen-grid">`;
      related.slice(0, 8).forEach(v => {
        const vid = (v.videoId || '').replace(/'/g, "\\'");
        const vTitle = escapeHtml(v.title || '');
        const vTitleJs = (v.title || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const vCh = escapeHtml(v.channelName || '');
        const vChJs = (v.channelName || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const vChIdJs = (v.channelId || '').replace(/'/g, "\\'");
        const vThumb = v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;
        const vThumbJs = vThumb.replace(/'/g, "\\'");
        const vDur = escapeHtml(v.duration || '');

        relatedHtml += `
          <div class="yt-endscreen-card" onclick="window.multiview.playRelatedYouTubeInSlot(${i}, '${vid}', '${vTitleJs}', '${vChJs}', '${vChIdJs}', '${vThumbJs}')">
            <div class="yt-endscreen-thumb-wrap">
              <img src="${vThumb}" alt="" loading="lazy">
              ${vDur ? `<span class="yt-endscreen-dur">${vDur}</span>` : ''}
            </div>
            <div class="yt-endscreen-card-info">
              <div class="yt-endscreen-card-title" title="${vTitle}">${vTitle}</div>
              <div class="yt-endscreen-card-ch">${vCh}</div>
            </div>
          </div>
        `;
      });
      relatedHtml += `</div>`;
    }

    return `
      <div class="yt-endscreen-header">
        <div class="yt-endscreen-meta">
          <span class="yt-endscreen-badge">시청 완료</span>
          <span class="yt-endscreen-title" title="${titleSafe}">${titleSafe}</span>
          <span class="yt-endscreen-channel">${chSafe}</span>
        </div>
        <div class="yt-endscreen-actions">
          <button class="btn btn-sm btn-primary yt-endscreen-btn" onclick="window.multiview.replayYouTubeSlot(${i})">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
            다시보기
          </button>
          <button class="btn btn-sm btn-secondary yt-endscreen-btn yt-endscreen-close-btn" onclick="window.multiview.resetSlotToEmpty(${i})" title="이 영상을 닫고 슬롯을 비웁니다">
            ✕ 슬롯 비우기 (닫기)
          </button>
        </div>
      </div>
      <div class="yt-endscreen-body">
        <div class="yt-endscreen-section-label">연관 추천 영상 (클릭 시 이 슬롯에서 바로 재생)</div>
        ${relatedHtml}
      </div>
    `;
  }

  showYouTubeEndScreen(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot || slot.type !== 'youtube') return;
    slot.ytEnded = true;

    const endEl = document.getElementById(`slot-yt-endscreen-${slotIndex}`);
    if (endEl) {
      endEl.innerHTML = this.getYouTubeEndScreenInnerHTML(slot);
      endEl.style.display = 'flex';
    } else {
      this.renderSlots();
    }

    if (!slot.ytRelatedVideos) {
      this.prefetchYouTubeRelated(slotIndex, slot.videoId);
    }
  }

  replayYouTubeSlot(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot || slot.type !== 'youtube') return;
    slot.ytEnded = false;
    slot.isPlaying = true;
    const endEl = document.getElementById(`slot-yt-endscreen-${slotIndex}`);
    if (endEl) endEl.style.display = 'none';
    this.seekYouTubeSlotSeconds(slotIndex, 0);
  }

  playRelatedYouTubeInSlot(slotIndex, videoId, title, channelName, channelId = '', thumbnail = '') {
    if (!videoId) return;
    // Record in watch history so recommendation algorithm reflects related video watch
    fetch('/api/youtube/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_id: videoId,
        title: title || 'YouTube 영상',
        channel_name: channelName || '',
        channel_id: channelId || '',
        thumbnail: thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        duration: ''
      })
    }).catch(() => {});

    this.loadYouTubeIntoSlot(slotIndex, videoId, title, channelName, channelId, thumbnail, false);
  }

  togglePlaySlot(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot || !slot.videoEl) return;
    if (slot.videoEl.paused) {
      slot.videoEl.play().catch(() => {});
    } else {
      slot.videoEl.pause();
    }
    const btn = document.getElementById(`slot-play-btn-${slotIndex}`);
    if (btn) btn.innerHTML = slot.videoEl.paused ? ICONS.play : ICONS.pause;
  }

  captureSlotScreenshot(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot || !slot.videoEl) {
      if (window.app) window.app.showToast('화면을 캡처할 방송 영상이 없습니다.', 'warning');
      return;
    }

    const v = slot.videoEl;
    if (v.readyState < 2 || !v.videoWidth || !v.videoHeight) {
      if (window.app) window.app.showToast('비디오 화면 준비 중입니다. 잠시 후 다시 시도하세요.', 'warning');
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = v.videoWidth;
      canvas.height = v.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(v, 0, 0, canvas.width, canvas.height);

      const d = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const timeStr = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
      const safeName = (slot.channelName || 'stream').replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
      const filename = `[캡처]_${safeName}_${timeStr}.png`;

      // Direct download in browser (Android APK saves directly via /api/recordings/save-capture)
      if (!window.AndroidChzzk) {
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      // Store in backend/native recordings/captures/ directory
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            const capRes = await fetch(`/api/recordings/save-capture?filename=${encodeURIComponent(filename)}`, {
              method: 'POST',
              headers: { 'Content-Type': 'image/png' },
              body: blob
            });
            const capData = await capRes.json();
            if (window.AndroidChzzk && capData && !capData.success && window.app) {
              window.app.showToast(`캡처 저장 실패: ${capData.error || '권한을 확인해주세요.'}`, 'error');
            }
          } catch (e) {
            console.warn('Capture save error:', e);
          }
        }
      }, 'image/png');

      if (window.app) window.app.showToast(`'${slot.channelName || '방송'}' 현재 화면 캡처 완료! (${filename})`, 'success');
    } catch (err) {
      console.error('Screenshot capture failed:', err);
      if (window.app) window.app.showToast('화면 캡처 실패 (보안 제한 또는 캔버스 오류)', 'error');
    }
  }

  seekVodSlot(slotIndex, percent) {
    const slot = this.slots[slotIndex];
    if (!slot || !slot.videoEl || !slot.videoEl.duration) return;
    const pct = parseFloat(percent) || 0;
    slot.videoEl.currentTime = (pct / 100) * slot.videoEl.duration;
    if (slot.chatOpen && slot.type === 'vod') {
      this.resetAndSeekVodChat(slot);
    }
  }

  formatSecs(s) {
    const totalSecs = Math.max(0, Math.floor(s || 0));
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const sec = totalSecs % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }

  resetSlotMedia(slot) {
    if (!slot) return;
    this.stopVodChatSync(slot);
    this.disconnectSlotChat(slot);
    slot.chatHistory = [];
    slot.vodChatMessages = [];
    slot.vodChatDisplayedIndex = 0;
    slot.vodChatNextTime = 0;
    slot.vodChatFetchedUpToMs = 0;
    slot.vodChatLastSyncMs = 0;
    slot.vodChatFetching = false;
    if (this.pipActiveSlot && this.pipActiveSlot.index === slot.index) {
      this.hidePiP();
    }
    if (slot.stallTimer) {
      clearTimeout(slot.stallTimer);
      slot.stallTimer = null;
    }
    if (slot.hls) {
      try { slot.hls.destroy(); } catch (e) {}
      slot.hls = null;
    }
    if (slot.videoEl) {
      try {
        slot.videoEl.pause();
        slot.videoEl.removeAttribute('src');
        slot.videoEl.load();
        if (slot.videoEl.parentElement) {
          slot.videoEl.parentElement.removeChild(slot.videoEl);
        }
      } catch (e) {}
      slot.videoEl = null;
    }
    if (slot.iframeEl) {
      try {
        slot.iframeEl.src = 'about:blank';
        slot.iframeEl.remove();
      } catch (e) {}
      slot.iframeEl = null;
    }
    if (slot.isScreenRecording && slot.screenRecorder) {
      try {
        if (slot.screenRecorder.state !== 'inactive') slot.screenRecorder.stop();
      } catch (e) {}
      clearInterval(slot.screenRecTimer);
      slot.isScreenRecording = false;
      slot.screenRecorder = null;
      slot.screenChunks = [];
    }
  }

  destroySlotStream(slot) {
    if (!slot) return;
    if (slot.channelId) slot.lastChannelId = slot.channelId;
    if (slot.channelName) slot.lastChannelName = slot.channelName;
    if (slot.title) slot.lastTitle = slot.title;
    if (slot.thumbnail) slot.lastThumbnail = slot.thumbnail;
    if (slot.type) slot.lastType = slot.type;
    if (slot.videoNo) slot.lastVodNo = slot.videoNo;
    if (slot.videoId || slot.ytVideoId) slot.lastYtVideoId = slot.videoId || slot.ytVideoId;
    if (slot.clipData) slot.lastClipData = slot.clipData;

    this.resetSlotMedia(slot);

    slot.type = 'live';
    slot.videoNo = null;
    slot.clipUID = null;
    slot.clipList = [];
    slot.clipIndex = -1;
    slot.channelId = null;
    slot.channelName = null;
    slot.title = null;
    slot.streamUrl = null;
    slot.active = false;
    slot.hasError = false;
    slot.errorMessage = null;
    slot.recordJobId = null;
    slot.recordStatus = null;
  }

  closeSlot(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot) return;
    this.destroySlotStream(slot);

    // If more than 1 slot, remove this slot so the grid contracts
    if (this.slotCount > 1) {
      this.slots.splice(slotIndex, 1);
      this.slots.forEach((s, idx) => { s.index = idx; });
      this.slotCount = this.slots.length;
    }

    this.updateGridLayout();
    this.renderSlots();
    this.updateBadge();
  }

  resetSlotToEmpty(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot) return;
    this.destroySlotStream(slot);
    slot.active = false;
    slot.type = null;
    slot.videoId = null;
    slot.channelId = null;
    slot.channelName = null;
    slot.title = null;
    slot.thumbnail = null;
    slot.iframeEl = null;
    slot.videoEl = null;
    slot.chatOpen = false;
    this.renderSlots();
    this.updateBadge();
    this.updatePiPSlotOptions();
  }

  // ================= Live Stream Auto-Recovery & Diagnostics =================

  createHlsPlayer(slot, masterUrl) {
    if (!window.Hls || !window.Hls.isSupported() || !slot.videoEl) return null;

    if (slot.hls) {
      try {
        slot.hls.stopLoad();
        slot.hls.detachMedia();
        slot.hls.destroy();
      } catch (_) {}
      slot.hls = null;
    }

    const video = slot.videoEl;
    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,           // LL-HLS 저지연 모드
      startFragPrefetch: true,        // 매니페스트 파싱 직후 초기 세그먼트 동시 프리페치 (첫 화면 로딩 단축)
      backBufferLength: 60,           // 60초 백버퍼 유지 (타임머신 되돌려보기용)
      maxBufferLength: 45,            // 45초 전방 버퍼
      maxMaxBufferLength: 90,
      liveSyncDuration: 4.8,          // 안정적인 저지연 타겟 (기존 3.8s에서 상향하여 버퍼 여유 확보, 끊김 완벽 방지)
      liveMaxLatencyDuration: 25.0,   // 급격한 점프 방지 (미세 배속 추격으로 흡수)
      maxLiveSyncPlaybackRate: 1.08,  // 8% 부드러운 미세 배속으로 지연 누적 없이 지속 동기화
      liveDurationInfinity: true,
      highBufferWatchdogPeriod: 2,
      maxBufferHole: 0.6,             // 미세 시간 갭(Gap)으로 인한 멈춤 자동 건너뛰기
      maxFragLookUpTolerance: 0.25,   // 프래그먼트 조회 허용 오차
      nudgeOffset: 0.1,               // 버퍼 스톨 넛지 오프셋
      nudgeMaxRetry: 5,               // 넛지 최대 재시도
      fragLoadingTimeOut: 20000,
      manifestLoadingTimeOut: 20000,
      levelLoadingTimeOut: 20000,
      fragLoadingMaxRetry: 6,
      fragLoadingRetryDelay: 500,
      manifestLoadingMaxRetry: 6,
      manifestLoadingRetryDelay: 500,
      levelLoadingMaxRetry: 6,
      levelLoadingRetryDelay: 500,
      abrEwmaDefaultEstimate: 5000000,
      abrBandWidthFactor: 0.88,
      abrBandWidthUpFactor: 0.7
    });

    slot.hls = hls;
    slot.consecutiveNetworkErrors = 0;
    slot.consecutiveMediaErrors = 0;

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      this.sendDiagnosticLog('PLAYER', 'START', `Live stream manifest loaded (Direct CDN, LL-HLS: ON, Target Latency: 4.8s)`, slot.index, slot.channelName);
      if (typeof hls.liveSyncPosition === 'number' && hls.liveSyncPosition > 0) {
        video.currentTime = hls.liveSyncPosition;
      }
      video.play().catch(err => {
        console.log('Unmuted autoplay prevented by policy, retrying muted:', err);
        video.muted = true;
        slot.muted = true;
        video.play().catch(e => console.log('Autoplay retry failed:', e));
        this.updateSlotAudioUI(slot.index);
      });
    });

    // Smooth sync monitoring: preserve timeshift state when rewound, and smoothly catch up when live
    hls.on(Hls.Events.LEVEL_LOADED, () => {
      if (!slot.active || !slot.videoEl) return;
      slot.consecutiveNetworkErrors = 0;
      if (slot.isTimeshifted) {
        if (hls.config) {
          hls.config.liveMaxLatencyDuration = Infinity;
          hls.config.maxLiveSyncPlaybackRate = 1.0;
        }
        if (video.playbackRate !== 1.0) {
          video.playbackRate = 1.0;
        }
      } else {
        if (typeof hls.liveSyncPosition === 'number' && hls.liveSyncPosition > 0) {
          const latency = hls.liveSyncPosition - video.currentTime;
          // 25초 이상 비정상적으로 지연이 벌어졌을 때만 최종적으로 실시간 위치 리싱크
          if (latency > 25.0) {
            this.sendDiagnosticLog('PLAYER', 'HARD_RESYNC', `Large latency drift (${latency.toFixed(1)}s > 25.0s). Re-seeking live edge.`, slot.index, slot.channelName, latency);
            video.currentTime = hls.liveSyncPosition;
          }
        }
      }
    });

    // Timeupdate: track playhead and update timeshift indicator
    video.addEventListener('timeupdate', () => {
      if (!slot.active || !slot.videoEl) return;
      if (slot.isTimeshifted) {
        if (video.playbackRate !== 1.0) {
          video.playbackRate = 1.0;
        }
        const liveEdge = this.getLiveEdge(slot);
        if (liveEdge > 0 && video.currentTime > 0) {
          const actualDiff = Math.max(1, Math.round(liveEdge - video.currentTime));
          slot.timeshiftSeconds = actualDiff;
        }
        this.updateSlotLiveIndicator(slot.index, slot.timeshiftSeconds || 10);
      } else {
        this.updateSlotLiveIndicator(slot.index, 0);
      }
    });

    // Auto-remove slot if live stream ends
    hls.on(Hls.Events.BUFFER_EOS, async () => {
      if (slot.active && slot.type === 'live' && slot.channelId) {
        try {
          const chk = await fetch(`/api/live/${slot.channelId}`).then(r => r.json());
          if (chk && chk.isOnline === false) {
            const name = slot.channelName || '스트리머';
            if (window.app) window.app.showToast(`'${name}' 방송이 종료되어 멀티뷰 슬롯에서 자동으로 닫혔습니다.`, 'info');
            this.closeSlot(slot.index);
          }
        } catch (_) {}
      }
    });

    video.onended = async () => {
      if (slot.active && slot.type === 'live' && slot.channelId) {
        try {
          const chk = await fetch(`/api/live/${slot.channelId}`).then(r => r.json());
          if (chk && chk.isOnline === false) {
            const name = slot.channelName || '스트리머';
            if (window.app) window.app.showToast(`'${name}' 방송이 종료되어 멀티뷰 슬롯에서 자동으로 닫혔습니다.`, 'info');
            this.closeSlot(slot.index);
          }
        } catch (_) {}
      }
    };

    hls.on(Hls.Events.ERROR, async (event, errData) => {
      const httpCode = errData.response ? errData.response.code : null;
      const isFatal = errData.fatal;

      if (isFatal) {
        this.sendDiagnosticLog('HLS_ERROR', 'FATAL', `${errData.details} (${errData.type}, HTTP: ${httpCode || 'N/A'})`, slot.index, slot.channelName);
        switch (errData.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            slot.consecutiveNetworkErrors = (slot.consecutiveNetworkErrors || 0) + 1;
            // 403, 404, 410 또는 네트워크 에러 2회 연속 시 새 master URL 갱신 자동 복구
            if (httpCode === 403 || httpCode === 404 || httpCode === 410 || slot.consecutiveNetworkErrors >= 2) {
              this.sendDiagnosticLog('RECOVERY', 'MASTER_REFRESH', `Stream URL expired or network error (HTTP ${httpCode}). Refreshing master URL...`, slot.index, slot.channelName);
              await this.recoverSlotStream(slot.index);
            } else {
              hls.startLoad();
            }
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            slot.consecutiveMediaErrors = (slot.consecutiveMediaErrors || 0) + 1;
            if (slot.consecutiveMediaErrors > 2) {
              this.sendDiagnosticLog('RECOVERY', 'MEDIA_SWAP', `Repeated media errors. Swapping audio codec and recovering.`, slot.index, slot.channelName);
              hls.swapAudioCodec();
              hls.recoverMediaError();
            } else {
              hls.recoverMediaError();
            }
            break;
          default:
            this.sendDiagnosticLog('RECOVERY', 'RELOAD', `Fatal unrecoverable error (${errData.details}). Reloading slot stream...`, slot.index, slot.channelName);
            await this.recoverSlotStream(slot.index);
            break;
        }
      }
    });

    hls.loadSource(masterUrl);
    hls.attachMedia(video);
    return hls;
  }

  async recoverSlotStream(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot || !slot.channelId || slot.type !== 'live') return;

    try {
      this.sendDiagnosticLog('RECOVERY', 'FETCHING', `Querying live stream master URL for channel ${slot.channelId}`, slotIndex, slot.channelName);
      const res = await fetch(`/api/live/${slot.channelId}`);
      const data = await res.json();
      if (data.success && data.masterUrl) {
        slot.streamUrl = data.masterUrl;
        slot.consecutiveNetworkErrors = 0;
        slot.consecutiveMediaErrors = 0;
        slot.hasError = false;
        slot.errorMessage = null;

        if (slot.videoEl && window.Hls && window.Hls.isSupported()) {
          this.createHlsPlayer(slot, data.masterUrl);
        } else if (slot.videoEl) {
          slot.videoEl.src = data.masterUrl;
          slot.videoEl.play().catch(() => {});
        }
        this.renderSlots();
        this.sendDiagnosticLog('RECOVERY', 'SUCCESS', `Stream successfully recovered with fresh master URL`, slotIndex, slot.channelName);
        if (window.app) window.app.showToast(`[슬롯 ${slotIndex + 1}] '${slot.channelName}' 스트림 연결이 자동 복구되었습니다.`, 'info');
      } else {
        this.sendDiagnosticLog('RECOVERY', 'FAILED', `Broadcast may have ended (${data.error || 'no masterUrl'})`, slotIndex, slot.channelName);
        slot.hasError = true;
        slot.errorMessage = data.error || (data && data.isOnline === false ? '방송이 종료되었습니다.' : '스트림 연결에 실패했습니다.');
        this.renderSlots();
      }
    } catch (e) {
      this.sendDiagnosticLog('RECOVERY', 'EXCEPTION', `Failed to recover stream: ${e.message}`, slotIndex, slot.channelName);
      slot.hasError = true;
      slot.errorMessage = e.message || '네트워크 연결 오류가 발생했습니다.';
      this.renderSlots();
    }
  }

  async reconnectSlot(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot) return;

    const channelId = slot.channelId || slot.lastChannelId;
    const type = slot.type || slot.lastType || 'live';
    const vodNo = slot.videoNo || slot.vodNo || slot.lastVodNo;
    const ytVideoId = slot.videoId || slot.ytVideoId || slot.lastYtVideoId;
    const clipData = slot.clipData || slot.lastClipData;
    const isYt = Boolean(type === 'youtube' && ytVideoId);

    if (!channelId && !ytVideoId && !vodNo && !clipData) {
      if (window.app) window.app.showToast('새로고침하거나 재접속할 영상·방송 정보가 없습니다.', 'warning');
      return;
    }

    const reloadBtns = document.querySelectorAll(`#slot-${slotIndex} .slot-reconnect-btn`);
    reloadBtns.forEach(b => b.classList.add('is-reconnecting'));

    if (isYt) {
      const ytTitle = slot.title || slot.lastTitle || '유튜브 영상';
      if (window.app) window.app.showToast(`[슬롯 ${slotIndex + 1}] '${ytTitle}' 유튜브 영상 새로고침 중...`, 'info');
    } else {
      const targetName = slot.channelName || slot.lastChannelName || (type === 'vod' ? '다시보기' : '방송');
      if (window.app) window.app.showToast(`[슬롯 ${slotIndex + 1}] '${targetName}' 방송 재접속 중...`, 'info');
    }

    // Preserve slot preferences
    const prevMuted = slot.muted;
    const prevVol = slot.volume;
    const prevChatOpen = slot.chatOpen;

    slot.hasError = false;
    slot.errorMessage = null;

    try {
      if (isYt) {
        await this.loadYouTubeIntoSlot(
          slotIndex,
          ytVideoId,
          slot.title || slot.lastTitle,
          slot.channelName || slot.lastChannelName,
          channelId || '',
          slot.thumbnail || slot.lastThumbnail || ''
        );
        if (window.app) window.app.showToast(`[슬롯 ${slotIndex + 1}] 유튜브 영상을 새로고침했습니다.`, 'success');
      } else if (type === 'vod' && vodNo) {
        await this.loadVodIntoSlot(slotIndex, vodNo, slot.title || slot.lastTitle, slot.channelName || slot.lastChannelName, channelId);
        if (window.app) window.app.showToast(`[슬롯 ${slotIndex + 1}] 다시보기에 재접속되었습니다.`, 'success');
      } else if (type === 'clip' && clipData) {
        await this.loadClipIntoSlot(slotIndex, clipData);
        if (window.app) window.app.showToast(`[슬롯 ${slotIndex + 1}] 클립에 재접속되었습니다.`, 'success');
      } else if (channelId) {
        this.resetSlotMedia(slot);

        const res = await fetch(`/api/live/${channelId}`);
        const data = await res.json();
        const masterUrl = data.streamUrl || data.masterUrl;

        if (!data.success || !masterUrl) {
          throw new Error(data.error || '방송 스트림을 가져올 수 없습니다.');
        }

        slot.channelId = channelId;
        slot.lastChannelId = channelId;
        slot.channelName = data.channelName || slot.channelName || slot.lastChannelName;
        slot.lastChannelName = slot.channelName;
        slot.title = data.title || slot.title || slot.lastTitle;
        slot.lastTitle = slot.title;
        slot.streamUrl = masterUrl;
        slot.userCount = data.userCount;
        slot.type = 'live';
        slot.active = true;
        slot.muted = prevMuted;
        slot.volume = prevVol;
        slot.hasError = false;
        slot.errorMessage = null;
        slot.isTimeshifted = false;
        slot.timeshiftSeconds = 0;
        slot.consecutiveNetworkErrors = 0;
        slot.consecutiveMediaErrors = 0;

        const video = document.createElement('video');
        video.autoplay = true;
        video.muted = prevMuted;
        video.playsInline = true;
        video.crossOrigin = 'anonymous';
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'contain';
        video.volume = prevMuted ? 0 : prevVol;
        slot.videoEl = video;

        video.addEventListener('play', () => {
          const btn = document.getElementById(`slot-play-btn-${slot.index}`);
          if (btn) btn.innerHTML = ICONS.pause;
        });
        video.addEventListener('pause', () => {
          const btn = document.getElementById(`slot-play-btn-${slot.index}`);
          if (btn) btn.innerHTML = ICONS.play;
        });

        let stallStartTime = 0;
        slot.stallTimer = null;
        video.addEventListener('waiting', () => {
          if (!slot.active) return;
          stallStartTime = Date.now();
          if (slot.stallTimer) clearTimeout(slot.stallTimer);
          slot.stallTimer = setTimeout(() => {
            if (!slot.active || !slot.videoEl || slot.videoEl.paused) return;
            if (slot.hls && typeof slot.hls.liveSyncPosition === 'number' && slot.hls.liveSyncPosition > 0) {
              const lag = slot.hls.liveSyncPosition - slot.videoEl.currentTime;
              if (lag > 1.8) {
                slot.videoEl.currentTime = slot.hls.liveSyncPosition;
              }
              slot.hls.startLoad();
              slot.videoEl.play().catch(() => {});
            }
          }, 2500);
        });

        video.addEventListener('playing', () => {
          if (slot.stallTimer) {
            clearTimeout(slot.stallTimer);
            slot.stallTimer = null;
          }
        });

        video.addEventListener('error', (e) => {
          console.warn(`[Slot ${slotIndex + 1}] Video playback error:`, e);
          slot.hasError = true;
          slot.errorMessage = '스트림 재생 오류가 발생했습니다.';
          this.renderSlots();
        });

        if (window.Hls && window.Hls.isSupported()) {
          this.createHlsPlayer(slot, masterUrl);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = masterUrl;
          video.play().catch(() => {});
        }

        if (prevChatOpen) {
          this.connectSlotChat(slotIndex);
        }

        this.renderSlots();
        this.updateBadge();
        if (window.app) window.app.showToast(`[슬롯 ${slotIndex + 1}] '${slot.channelName}' 방송에 재접속되었습니다.`, 'success');
      }
    } catch (err) {
      console.error(`reconnectSlot(${slotIndex}) error:`, err);
      slot.hasError = true;
      slot.errorMessage = err.message || (isYt ? '유튜브 영상 새로고침에 실패했습니다.' : '방송 재접속에 실패했습니다.');
      this.renderSlots();
      if (window.app) window.app.showToast(`[슬롯 ${slotIndex + 1}] ${isYt ? '새로고침 실패' : '재접속 실패'}: ${err.message || err}`, 'error');
    } finally {
      reloadBtns.forEach(b => b.classList.remove('is-reconnecting'));
    }
  }

  getBufferLength(video) {
    if (!video || !video.buffered || video.buffered.length === 0) return 0;
    try {
      const cur = video.currentTime;
      for (let i = 0; i < video.buffered.length; i++) {
        if (video.buffered.start(i) <= cur && cur <= video.buffered.end(i)) {
          return video.buffered.end(i) - cur;
        }
      }
    } catch (e) {}
    return 0;
  }

  sendDiagnosticLog(category, event, message, slotIndex, channelName, latency, bufferLen) {
    try {
      fetch('/api/diagnostics/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: category || 'PLAYER',
          event: event || 'INFO',
          message: message || '',
          slot: typeof slotIndex === 'number' ? slotIndex : null,
          channel: channelName || null,
          latency: typeof latency === 'number' ? latency : null,
          buffer_len: typeof bufferLen === 'number' ? bufferLen : null
        })
      }).catch(() => {});
    } catch (e) {}
  }

  // ================= Audio & Controls =================
  updateSlotAudioUI(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot) return;

    const slotEl = document.getElementById(`slot-${slotIndex}`);
    if (slotEl) {
      const muteBtn = slotEl.querySelector('.slot-ctrls-left .slot-ctrl-btn');
      if (muteBtn) {
        muteBtn.innerHTML = slot.muted ? ICONS.volumeMute : ICONS.volumeUp;
        muteBtn.title = slot.muted ? '소리 켜기' : '음소거';
      }
      const slider = slotEl.querySelector('.slot-volume-slider');
      if (slider && document.activeElement !== slider) {
        slider.value = slot.muted ? 0 : slot.volume;
      }
      const unmuteBigBtn = slotEl.querySelector('.slot-unmute-btn');
      if (unmuteBigBtn) {
        unmuteBigBtn.style.display = slot.muted ? 'inline-flex' : 'none';
      }
    }

    if (this.pipActiveSlot && this.pipActiveSlot.index === slotIndex) {
      const pipMuteBtn = document.getElementById('pipMuteBtn');
      if (pipMuteBtn) pipMuteBtn.innerHTML = slot.muted ? ICONS.volumeMute : ICONS.volumeUp;
    }
  }

  toggleMute(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot || (!slot.videoEl && !slot.iframeEl)) return;
    slot.muted = !slot.muted;

    const isYT = slot.type === 'youtube';
    const masterVol = window.app ? (isYT ? (typeof window.app.masterYTVolume === 'number' ? window.app.masterYTVolume : 1.0) : (typeof window.app.masterChzzkVolume === 'number' ? window.app.masterChzzkVolume : 1.0)) : 1.0;
    const masterMuted = window.app ? (isYT ? window.app.masterYTMuted : window.app.masterChzzkMuted) : false;

    const effectivelyMuted = slot.muted || masterMuted;
    if (slot.videoEl) {
      slot.videoEl.muted = effectivelyMuted;
      slot.videoEl.volume = effectivelyMuted ? 0 : Math.max(0, Math.min(1, slot.volume * masterVol));

      if (!effectivelyMuted && slot.videoEl.paused) {
        slot.videoEl.play().catch(e => console.warn('Unmute play failed:', e));
      }
    } else if (slot.iframeEl) {
      try {
        slot.iframeEl.contentWindow.postMessage({
          action: effectivelyMuted ? 'mute' : 'unmute',
          slotIndex: slotIndex
        }, '*');
        if (!effectivelyMuted) {
          slot.iframeEl.contentWindow.postMessage({
            action: 'setVolume',
            slotIndex: slotIndex,
            volume: Math.round(slot.volume * masterVol * 100)
          }, '*');
        }
      } catch (e) {}
    }

    this.updateSlotAudioUI(slotIndex);
  }

  setVolume(slotIndex, val) {
    const slot = this.slots[slotIndex];
    if (!slot || (!slot.videoEl && !slot.iframeEl)) return;
    const num = Math.max(0, Math.min(1, parseFloat(val) || 0));
    slot.volume = num;

    const isYT = slot.type === 'youtube';
    const masterVol = window.app ? (isYT ? (typeof window.app.masterYTVolume === 'number' ? window.app.masterYTVolume : 1.0) : (typeof window.app.masterChzzkVolume === 'number' ? window.app.masterChzzkVolume : 1.0)) : 1.0;
    const masterMuted = window.app ? (isYT ? window.app.masterYTMuted : window.app.masterChzzkMuted) : false;

    if (num > 0) {
      slot.muted = false;
      const effectivelyMuted = masterMuted;
      if (slot.videoEl) {
        slot.videoEl.muted = effectivelyMuted;
        slot.videoEl.volume = effectivelyMuted ? 0 : Math.max(0, Math.min(1, num * masterVol));
        if (!effectivelyMuted && slot.videoEl.paused) {
          slot.videoEl.play().catch(e => console.warn('Set volume play failed:', e));
        }
      } else if (slot.iframeEl) {
        try {
          slot.iframeEl.contentWindow.postMessage({
            action: effectivelyMuted ? 'mute' : 'unmute',
            slotIndex: slotIndex
          }, '*');
          slot.iframeEl.contentWindow.postMessage({
            action: 'setVolume',
            slotIndex: slotIndex,
            volume: effectivelyMuted ? 0 : Math.round(num * masterVol * 100)
          }, '*');
        } catch (e) {}
      }
    } else {
      slot.muted = true;
      if (slot.videoEl) {
        slot.videoEl.muted = true;
        slot.videoEl.volume = 0;
      } else if (slot.iframeEl) {
        try {
          slot.iframeEl.contentWindow.postMessage({
            action: 'mute',
            slotIndex: slotIndex
          }, '*');
        } catch (e) {}
      }
    }

    // Direct UI update: Never destroy DOM while dragging the slider!
    const slotEl = document.getElementById(`slot-${slotIndex}`);
    if (slotEl) {
      const muteBtn = slotEl.querySelector('.slot-ctrls-left .slot-ctrl-btn');
      if (muteBtn) {
        muteBtn.innerHTML = slot.muted ? ICONS.volumeMute : ICONS.volumeUp;
        muteBtn.title = slot.muted ? '소리 켜기' : '음소거';
      }
      const unmuteBigBtn = slotEl.querySelector('.slot-unmute-btn');
      if (unmuteBigBtn) {
        unmuteBigBtn.style.display = slot.muted ? 'inline-flex' : 'none';
      }
    }
    if (this.pipActiveSlot && this.pipActiveSlot.index === slotIndex) {
      const pipMuteBtn = document.getElementById('pipMuteBtn');
      if (pipMuteBtn) pipMuteBtn.innerHTML = slot.muted ? ICONS.volumeMute : ICONS.volumeUp;
    }
  }

  soloAudio(slotIndex) {
    this.slots.forEach((s, idx) => {
      const isYT = s.type === 'youtube';
      const masterVol = window.app ? (isYT ? (typeof window.app.masterYTVolume === 'number' ? window.app.masterYTVolume : 1.0) : (typeof window.app.masterChzzkVolume === 'number' ? window.app.masterChzzkVolume : 1.0)) : 1.0;
      const masterMuted = window.app ? (isYT ? window.app.masterYTMuted : window.app.masterChzzkMuted) : false;

      if (idx === slotIndex) {
        s.muted = false;
        if (s.videoEl) {
          s.videoEl.muted = masterMuted;
          s.videoEl.volume = masterMuted ? 0 : Math.max(0, Math.min(1, s.volume * masterVol));
          if (!masterMuted && s.videoEl.paused) {
            s.videoEl.play().catch(e => console.warn(e));
          }
        } else if (s.iframeEl) {
          try {
            s.iframeEl.contentWindow.postMessage({
              action: masterMuted ? 'mute' : 'unmute',
              slotIndex: idx
            }, '*');
            s.iframeEl.contentWindow.postMessage({
              action: 'setVolume',
              slotIndex: idx,
              volume: masterMuted ? 0 : Math.round(s.volume * masterVol * 100)
            }, '*');
          } catch (e) {}
        }
      } else {
        s.muted = true;
        if (s.videoEl) {
          s.videoEl.muted = true;
          s.videoEl.volume = 0;
        } else if (s.iframeEl) {
          try {
            s.iframeEl.contentWindow.postMessage({
              action: 'mute',
              slotIndex: idx
            }, '*');
          } catch (e) {}
        }
      }
      this.updateSlotAudioUI(idx);
    });
  }

  muteAll() {
    this.slots.forEach((s, idx) => {
      s.muted = true;
      if (s.videoEl) {
        s.videoEl.muted = true;
        s.videoEl.volume = 0;
      } else if (s.iframeEl) {
        try {
          s.iframeEl.contentWindow.postMessage({
            action: 'mute',
            slotIndex: idx
          }, '*');
        } catch (e) {}
      }
      this.updateSlotAudioUI(idx);
    });
  }

  applyMasterVolumeToChzzk(vol, isMuted) {
    this.slots.forEach((slot, idx) => {
      if (!slot.active || slot.type === 'youtube') return;
      const effectivelyMuted = slot.muted || isMuted;
      if (slot.videoEl) {
        slot.videoEl.muted = effectivelyMuted;
        slot.videoEl.volume = effectivelyMuted ? 0 : Math.max(0, Math.min(1, slot.volume * vol));
      }
      this.updateSlotAudioUI(idx);
    });
  }

  applyMasterVolumeToYT(vol, isMuted) {
    this.slots.forEach((slot, idx) => {
      if (!slot.active || slot.type !== 'youtube') return;
      const effectivelyMuted = slot.muted || isMuted;
      if (slot.iframeEl) {
        try {
          slot.iframeEl.contentWindow.postMessage({
            action: effectivelyMuted ? 'mute' : 'unmute',
            slotIndex: idx
          }, '*');
          slot.iframeEl.contentWindow.postMessage({
            action: 'setVolume',
            slotIndex: idx,
            volume: effectivelyMuted ? 0 : Math.round(slot.volume * vol * 100)
          }, '*');
        } catch (e) {}
      }
      this.updateSlotAudioUI(idx);
    });
  }

  applyMasterVolume(vol, isMuted) {
    this.applyMasterVolumeToChzzk(vol, isMuted);
    this.applyMasterVolumeToYT(vol, isMuted);
  }

  changeQuality(slotIndex, heightVal) {
    const slot = this.slots[slotIndex];
    if (!slot || !slot.hls) return;
    const targetHeight = parseInt(heightVal);

    if (targetHeight === -1) {
      slot.hls.currentLevel = -1;
      return;
    }

    const levels = slot.hls.levels;
    let closestLevel = -1;
    let minDiff = 9999;
    levels.forEach((lvl, idx) => {
      const diff = Math.abs(lvl.height - targetHeight);
      if (diff < minDiff) {
        minDiff = diff;
        closestLevel = idx;
      }
    });

    if (closestLevel !== -1) {
      slot.hls.currentLevel = closestLevel;
    }
  }

  openSlotChannel(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    this.stopFullscreenIdleWatcher();

    const chId = slot.channelId || '';
    const chName = slot.channelName || '';

    if (slot.type === 'youtube') {
      if (window.app) window.app.switchTab('youtube');
      if (window.youtubeUI) {
        window.youtubeUI.openChannelView(chId, chName);
      }
    } else {
      if (window.channelUI && chId) {
        window.channelUI.openChannel(chId, 'multiview');
      }
    }
  }

  toggleFullscreen(slotIndex) {
    const slotEl = document.getElementById(`slot-${slotIndex}`);
    if (!slotEl) return;
    const slot = this.slots[slotIndex];

    if (!document.fullscreenElement) {
      slotEl.requestFullscreen().catch(e => console.log(e));
      if (slot && slot.active && slot.channelId) {
        this.connectChatSocket(slot.channelId);
      }
    } else {
      document.exitFullscreen();
    }
  }

  // Fullscreen Idle UI Hide (Requirement 1: 3초 후 UI 숨김)
  startFullscreenIdleWatcher(slotEl) {
    this.stopFullscreenIdleWatcher();
    this._currentFsSlotEl = slotEl;

    const resetTimer = () => {
      if (this._currentFsSlotEl) {
        this._currentFsSlotEl.classList.remove('fs-idle-hide');
      }
      clearTimeout(this._fsIdleTimer);
      this._fsIdleTimer = setTimeout(() => {
        if (document.fullscreenElement === this._currentFsSlotEl && this._currentFsSlotEl) {
          this._currentFsSlotEl.classList.add('fs-idle-hide');
        }
      }, 3000);
    };

    this._fsMouseMoveHandler = resetTimer;
    slotEl.addEventListener('mousemove', this._fsMouseMoveHandler);
    slotEl.addEventListener('mousedown', this._fsMouseMoveHandler);
    resetTimer();
  }

  stopFullscreenIdleWatcher() {
    clearTimeout(this._fsIdleTimer);
    if (this._currentFsSlotEl) {
      this._currentFsSlotEl.classList.remove('fs-idle-hide');
      if (this._fsMouseMoveHandler) {
        this._currentFsSlotEl.removeEventListener('mousemove', this._fsMouseMoveHandler);
        this._currentFsSlotEl.removeEventListener('mousedown', this._fsMouseMoveHandler);
      }
      this._currentFsSlotEl = null;
    }
  }

  // ================= Timeshift (Rewind & Live Catchup) =================
  getLiveEdge(slot) {
    if (!slot || !slot.videoEl) return 0;
    const v = slot.videoEl;
    if (slot.hls && typeof slot.hls.liveSyncPosition === 'number' && slot.hls.liveSyncPosition > 0) {
      return slot.hls.liveSyncPosition;
    }
    if (v.buffered && v.buffered.length > 0) {
      return v.buffered.end(v.buffered.length - 1);
    }
    return v.currentTime || 0;
  }

  rewindSlot(slotIndex, seconds = 10) {
    const slot = this.slots[slotIndex];
    if (!slot || !slot.videoEl) return;
    const video = slot.videoEl;

    const liveEdge = this.getLiveEdge(slot);
    const curTime = (typeof video.currentTime === 'number' && video.currentTime > 0) ? video.currentTime : liveEdge;

    // Find earliest buffered timestamp so we never seek outside the MSE SourceBuffer
    let minBuffered = 0;
    if (video.buffered && video.buffered.length > 0) {
      minBuffered = video.buffered.start(0) + 0.3;
    }

    const minAllowedTime = Math.max(minBuffered, liveEdge > 50 ? liveEdge - 50 : minBuffered);
    let targetTime = curTime - seconds;
    if (minAllowedTime > 0 && targetTime < minAllowedTime) {
      targetTime = minAllowedTime;
    }
    targetTime = Math.max(0, targetTime);

    // Disable hls.js internal LatencyController from forcing a jump back to live edge or speeding up playback!
    if (slot.hls && slot.hls.config) {
      slot.hls.config.liveMaxLatencyDuration = Infinity;
      slot.hls.config.maxLiveSyncPlaybackRate = 1.0;
    }

    const prevSeconds = (slot.isTimeshifted && slot.timeshiftSeconds) ? slot.timeshiftSeconds : 0;
    const computedDiff = liveEdge > targetTime ? Math.round(liveEdge - targetTime) : (prevSeconds + seconds);
    const newSeconds = Math.max(1, Math.min(50, computedDiff || (prevSeconds + seconds)));

    slot.isTimeshifted = true;
    slot.timeshiftSeconds = newSeconds;

    video.playbackRate = 1.0;
    try {
      video.currentTime = targetTime;
    } catch (e) {}

    if (video.paused) {
      video.play().catch(() => {});
    }

    this.updateSlotLiveIndicator(slotIndex, newSeconds);
  }

  jumpToLive(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot || !slot.videoEl) return;
    const video = slot.videoEl;

    slot.isTimeshifted = false;
    slot.timeshiftSeconds = 0;

    // Restore smooth LL-HLS catchup configuration
    if (slot.hls && slot.hls.config) {
      slot.hls.config.liveMaxLatencyDuration = 25.0;
      slot.hls.config.maxLiveSyncPlaybackRate = 1.08;
    }

    const liveEdge = this.getLiveEdge(slot);
    if (liveEdge > 0) {
      try {
        video.currentTime = liveEdge;
      } catch (e) {}
    }
    video.playbackRate = 1.0;
    if (video.paused) {
      video.play().catch(() => {});
    }

    this.updateSlotLiveIndicator(slotIndex, 0);
  }

  updateSlotLiveIndicator(slotIndex, diffSeconds) {
    const liveBtn = document.getElementById(`slot-live-btn-${slotIndex}`);
    if (!liveBtn) return;

    if (diffSeconds > 0) {
      liveBtn.className = 'slot-live-status-btn timeshifted';
      liveBtn.innerHTML = `<span>-${diffSeconds}초</span>`;
      liveBtn.title = '클릭하여 최신 실시간(LIVE) 방송으로 복귀';
    } else {
      liveBtn.className = 'slot-live-status-btn live-now';
      liveBtn.innerHTML = `<span>● LIVE</span>`;
      liveBtn.title = '현재 실시간 시청 중';
    }
  }

  // ================= In-Slot Independent Real-time Chat =================
  async loadChannelEmojiPacks(channelId) {
    if (!channelId) return;
    if (!this.channelEmojiCache) this.channelEmojiCache = {};
    if (this.channelEmojiCache[channelId]) return;
    try {
      const resp = await fetch(`/api/chat/${channelId}/emoji-packs`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.success && data.emojis) {
          this.channelEmojiCache[channelId] = data.emojis;
        }
      }
    } catch (e) {
      console.warn(`Failed to prefetch emoji packs for ${channelId}:`, e);
    }
  }

  prefetchSlotChat(slot) {
    if (!slot || !slot.channelId || slot.type !== 'live') return;
    const cid = slot.channelId;
    const chatCid = slot.chatChannelId || '';
    if (slot._chatAccessData && slot._chatAccessData.accessToken) return;
    fetch(`/api/chat/${cid}/access?chat_channel_id=${encodeURIComponent(chatCid)}`)
      .then(r => r.json())
      .then(d => {
        if (d && d.success && slot.channelId === cid) {
          slot._chatAccessData = d;
        }
      })
      .catch(() => {});
    this.loadChannelEmojiPacks(cid);
  }

  async connectSlotChat(slot) {
    if (!slot || !slot.channelId || slot.chatSocket) return;

    // Pre-fetch channel emoji packs in background
    this.loadChannelEmojiPacks(slot.channelId);

    try {
      let data = slot._chatAccessData;
      if (!data || !data.accessToken) {
        const chatCid = slot.chatChannelId || '';
        const res = await fetch(`/api/chat/${slot.channelId}/access?chat_channel_id=${encodeURIComponent(chatCid)}`);
        data = await res.json();
        if (data && data.success) slot._chatAccessData = data;
      }
      if (!data || !data.success || !data.accessToken) {
        const container = document.getElementById(`slot-chat-messages-${slot.index}`);
        if (container) {
          container.innerHTML = `<div class="chat-empty-hint">${(data && data.error) || '채팅 토큰 발급에 실패했습니다.'}</div>`;
        }
        return;
      }

      const { chatChannelId, accessToken } = data;
      const serverIdx = Math.floor(Math.random() * 5) + 1;
      const wsUrl = `wss://kr-ss${serverIdx}.chat.naver.com/chat`;
      const ws = new WebSocket(wsUrl);
      slot.chatSocket = ws;

      ws.onopen = () => {
        if (slot.chatSocket !== ws) return;
        const handshake = {
          ver: '3',
          cmd: 100,
          svcid: 'game',
          cid: chatChannelId,
          bdy: {
            uid: null,
            devType: 2001,
            accTkn: accessToken,
            auth: 'READ'
          },
          tid: 1
        };
        ws.send(JSON.stringify(handshake));

        if (slot.chatPingTimer) clearInterval(slot.chatPingTimer);
        slot.chatPingTimer = setInterval(() => {
          if (slot.chatSocket && slot.chatSocket.readyState === WebSocket.OPEN) {
            slot.chatSocket.send(JSON.stringify({ ver: '3', cmd: 10000 }));
          }
        }, 20000);
      };

      ws.onmessage = (event) => {
        if (slot.chatSocket !== ws) return;
        try {
          const packet = JSON.parse(event.data);
          if (packet.cmd === 10000 || packet.cmd === 10100) return;
          if (packet.cmd === 93101 || packet.cmd === 93102) {
            const list = packet.bdy || [];
            if (Array.isArray(list)) {
              list.forEach(item => this.appendSlotChatMessage(slot, item));
            } else if (list) {
              this.appendSlotChatMessage(slot, list);
            }
          }
        } catch (err) {
          console.error(`Slot ${slot.index} chat packet parse error:`, err);
        }
      };

      ws.onclose = () => {
        if (slot.chatPingTimer) {
          clearInterval(slot.chatPingTimer);
          slot.chatPingTimer = null;
        }
        slot.chatSocket = null;
      };

      ws.onerror = (err) => {
        console.warn(`Slot ${slot.index} chat error:`, err);
      };
    } catch (e) {
      console.warn(`Slot ${slot.index} chat connect failed:`, e);
    }
  }

  disconnectSlotChat(slot) {
    if (!slot) return;
    this.stopVodChatSync(slot);
    this.stopYouTubeLiveChat(slot);
    if (slot.chatPingTimer) {
      clearInterval(slot.chatPingTimer);
      slot.chatPingTimer = null;
    }
    if (slot.chatSocket) {
      try {
        slot.chatSocket.close();
      } catch (e) {}
      slot.chatSocket = null;
    }
  }

  toggleSlotChat(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot || !slot.active) return;

    // 댓글창/채팅창이 열리면 재생목록 및 관련영상 닫힘 (상호 배타적)
    if (!slot.chatOpen) {
      if (slot.playlistOpen) this.toggleSlotPlaylist(slotIndex, false);
      if (slot.relatedOpen) this.toggleSlotRelated(slotIndex, false);
    }

    slot.chatOpen = !slot.chatOpen;

    const slotEl = document.getElementById(`slot-${slotIndex}`);
    if (slotEl) {
      const col = slotEl.querySelector('.slot-chat-column');
      if (col) {
        col.classList.toggle('collapsed', !slot.chatOpen);
        if (slot.chatOpen) {
          col.style.width = `${slot.chatWidth || 250}px`;
        }
      }
    }
    const chatToggleBtn = document.getElementById(`slot-chat-toggle-btn-${slotIndex}`);
    if (chatToggleBtn) {
      chatToggleBtn.classList.toggle('active', slot.chatOpen);
    }

    if (slot.chatOpen) {
      if (slot.type === 'youtube') {
        if (slot.isLive) {
          this.loadYouTubeLiveChat(slotIndex);
        } else {
          this.loadYouTubeSlotComments(slotIndex);
        }
      } else if (slot.type === 'vod') {
        this.startVodChatSync(slot);
      } else if (!slot.chatSocket) {
        this.connectSlotChat(slot);
      }
      // Populate preserved chat history if any (Fix Request 3)
      if (slot.chatHistory && slot.chatHistory.length > 0 && slot.type !== 'youtube') {
        const container = document.getElementById(`slot-chat-messages-${slotIndex}`);
        if (container && container.querySelector('.chat-empty-hint')) {
          container.innerHTML = '';
          slot.chatHistory.forEach(item => this.appendSlotChatMessage(slot, item, false));
          container.scrollTop = container.scrollHeight;
        }
      }
    } else {
      if (slot.type === 'vod') {
        this.stopVodChatSync(slot);
      } else if (slot.type === 'youtube') {
        this.stopYouTubeLiveChat(slot);
      }
    }
  }

  openExternalUrl(url, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!url) return;
    fetch(`/api/system/open-url?url=${encodeURIComponent(url)}`, { method: 'POST' })
      .then(r => r.json())
      .then(d => {
        if (!d || !d.success) {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      })
      .catch(() => {
        window.open(url, '_blank', 'noopener,noreferrer');
      });
  }

  formatYouTubeRichText(rawText, slotIndex) {
    if (!rawText) return '';
    let safe = escapeHtml(String(rawText));

    // 1. Linkify URLs (http:// or https://)
    safe = safe.replace(/(https?:\/\/[^\s<>"']+)/g, (match) => {
      // Strip trailing punctuation like ), ., , if attached
      let cleanUrl = match;
      let trailing = '';
      while (/[).,;!?]$/.test(cleanUrl)) {
        trailing = cleanUrl.slice(-1) + trailing;
        cleanUrl = cleanUrl.slice(0, -1);
      }
      const jsUrl = cleanUrl.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      return `<a href="${cleanUrl}" class="yt-desc-link" onclick="window.multiview.openExternalUrl('${jsUrl}', event)" title="외부 브라우저에서 열기">${cleanUrl}</a>${trailing}`;
    });

    // 2. Linkify timestamps (e.g., 01:23 or 1:05:30)
    safe = safe.replace(/\b(\d{1,2}:\d{2}(?::\d{2})?)\b/g, (match) => {
      const parts = match.split(':').map(Number);
      let secs = 0;
      if (parts.length === 3) {
        secs = parts[0] * 3600 + parts[1] * 60 + parts[2];
      } else if (parts.length === 2) {
        secs = parts[0] * 60 + parts[1];
      }
      return `<span class="yt-desc-timestamp" onclick="window.multiview.seekYouTubeSlotSeconds(${slotIndex}, ${secs})" title="${match} 위치로 이동">${match}</span>`;
    });

    return safe;
  }

  toggleYouTubeDescription(slotIndex) {
    const descBox = document.getElementById(`yt-slot-desc-box-${slotIndex}`);
    if (!descBox) return;
    const isExpanded = descBox.classList.toggle('expanded');
    const toggleBtn = descBox.querySelector('.yt-desc-toggle-btn');
    if (toggleBtn) {
      toggleBtn.innerHTML = isExpanded 
        ? `<span style="display:inline-flex;align-items:center;gap:3px;">간략히 접기 ${ICONS.chevronUp}</span>`
        : `<span style="display:inline-flex;align-items:center;gap:3px;">설명 더보기 ${ICONS.chevronDown}</span>`;
    }
  }

  renderSingleYouTubeCommentHTML(c, slotIndex) {
    const author = escapeHtml(c.author || '익명');
    const pub = escapeHtml(c.published || '');
    const contentHtml = this.formatYouTubeRichText(c.content || '', slotIndex);
    const avatar = c.avatar || './static/img/favicon.png';
    const likeCount = escapeHtml(c.likeCount || '');
    const replyToken = c.replyToken || '';
    const replyLabel = c.replyLabel || (c.replyCount ? `답글 ${c.replyCount}개` : '답글');

    return `
      <div class="yt-comment-item">
        <img class="yt-comment-avatar" src="${avatar}" onerror="this.src='./static/img/favicon.png'" alt="">
        <div class="yt-comment-body">
          <div class="yt-comment-author-row">
            <span class="yt-comment-author">${author}</span>
            <span class="yt-comment-time">${pub}</span>
            ${likeCount ? `<span class="yt-comment-likes" style="display:inline-flex;align-items:center;gap:3px;">${ICONS.heart} ${likeCount}</span>` : ''}
          </div>
          <div class="yt-comment-text">${contentHtml}</div>
          ${replyToken ? `
            <div class="yt-comment-replies-wrap">
              <button class="yt-comment-replies-btn"
                      data-reply-token="${escapeHtml(replyToken)}"
                      data-reply-label="${escapeHtml(replyLabel)}"
                      onclick="window.multiview.toggleYouTubeCommentReplies(this, ${slotIndex})"
                      style="display:inline-flex;align-items:center;gap:4px;">
                <span class="reply-arrow-icon" style="display:inline-flex;align-items:center;">${ICONS.chevronDown}</span>
                <span class="reply-btn-text">${escapeHtml(replyLabel)} 보기</span>
              </button>
              <div class="yt-comment-replies-list" style="display: none;"></div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  refreshYouTubeChatOrComments(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot || slot.type !== 'youtube') return;
    if (slot.isLive && !slot.ytForceCommentsMode) {
      this.loadYouTubeLiveChat(slotIndex, slot.ytLiveChatMode || 'auto');
    } else {
      this.loadYouTubeSlotComments(slotIndex, true);
    }
  }

  stopYouTubeLiveChat(slot) {
    if (!slot) return;
    if (slot.ytLiveChatTimer) {
      clearTimeout(slot.ytLiveChatTimer);
      slot.ytLiveChatTimer = null;
    }
    slot.ytLiveChatActive = false;
    slot.ytLiveChatContinuation = null;
    slot.ytLiveChatSeenIds = null;
  }

  switchYouTubeLiveChatMode(slotIndex, mode) {
    const slot = this.slots[slotIndex];
    if (!slot || slot.type !== 'youtube') return;
    if (mode === 'comments') {
      slot.ytForceCommentsMode = true;
      this.stopYouTubeLiveChat(slot);
      const lockBtn = document.getElementById(`chat-lock-btn-${slotIndex}`);
      if (lockBtn) lockBtn.style.display = 'none';
      const titleEl = document.getElementById(`slot-chat-title-${slotIndex}`);
      if (titleEl) titleEl.textContent = `${slot.channelName || 'YouTube'} 영상 정보`;
      this.loadYouTubeSlotComments(slotIndex, true);
    } else {
      slot.ytForceCommentsMode = false;
      this.loadYouTubeLiveChat(slotIndex, mode);
    }
  }

  async loadYouTubeLiveChat(slotIndex, mode = 'auto') {
    const slot = this.slots[slotIndex];
    if (!slot || slot.type !== 'youtube' || !slot.videoId) return;

    this.stopYouTubeLiveChat(slot);
    slot.ytForceCommentsMode = false;
    slot.ytLiveChatActive = true;
    slot.ytLiveChatMode = mode;
    slot.ytLiveChatSeenIds = new Set();

    const container = document.getElementById(`slot-chat-messages-${slotIndex}`);
    if (!container) return;

    const titleEl = document.getElementById(`slot-chat-title-${slotIndex}`);
    if (titleEl) titleEl.textContent = `${slot.channelName || 'YouTube'} 실시간 채팅`;
    const refreshBtn = document.getElementById(`slot-chat-refresh-btn-${slotIndex}`);
    if (refreshBtn) refreshBtn.title = '채팅 새로고침';
    const lockBtn = document.getElementById(`chat-lock-btn-${slotIndex}`);
    if (lockBtn) lockBtn.style.display = (mode === 'iframe') ? 'none' : '';

    container.style.fontSize = `${slot.chatFontSize || 12}px`;
    const targetVideoId = slot.videoId;

    const renderModeBar = (activeMode, canShowNative = true) => `
      <div class="yt-livechat-modebar">
        ${canShowNative ? `
          <button type="button" class="yt-lc-mode-btn ${activeMode === 'native' ? 'active' : ''}" onclick="window.multiview.switchYouTubeLiveChatMode(${slotIndex}, 'native')" title="다크 테마 최적화 채팅 (글씨 크기 조절 가능)">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>실시간 채팅</span>
          </button>
        ` : ''}
        <button type="button" class="yt-lc-mode-btn ${activeMode === 'iframe' ? 'active' : ''}" onclick="window.multiview.switchYouTubeLiveChatMode(${slotIndex}, 'iframe')" title="직접 채팅 입력이 가능한 유튜브 공식 채팅창">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
          <span>공식 채팅창</span>
        </button>
        <button type="button" class="yt-lc-mode-btn" onclick="window.multiview.switchYouTubeLiveChatMode(${slotIndex}, 'comments')" title="영상 설명 보기">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <span>영상 정보</span>
        </button>
      </div>
    `;

    // Direct Official YouTube Live Chat IFrame mode (Web version or explicitly requested)
    if (mode === 'iframe') {
      const hostName = (window.location && window.location.hostname && window.location.hostname !== 'null')
        ? window.location.hostname
        : '127.0.0.1';
      const embedUrl = `https://www.youtube.com/live_chat?v=${encodeURIComponent(targetVideoId)}&embed_domain=${encodeURIComponent(hostName)}&dark_theme=1`;
      const isStatic = !!(window.webBackendPolyfill && window.webBackendPolyfill.isStaticWeb());
      container.innerHTML = `
        <div class="yt-livechat-wrap">
          ${renderModeBar('iframe', !isStatic)}
          <div class="yt-livechat-iframe-box">
            <iframe src="${embedUrl}" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media" style="width:100%;height:100%;border:none;background:#0d111a;"></iframe>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="yt-livechat-wrap">
        ${renderModeBar('native', true)}
        <div class="yt-livechat-list" id="yt-livechat-list-${slotIndex}">
          <div class="chat-empty-hint">유튜브 실시간 채팅 연결 중...</div>
        </div>
      </div>
    `;

    try {
      const res = await fetch(`/api/youtube/live_chat/${encodeURIComponent(targetVideoId)}`);
      const data = await res.json();
      if (!slot.active || slot.videoId !== targetVideoId || !slot.ytLiveChatActive) return;

      // Web version returns useEmbedIframe: true -> render official YouTube Live Chat iframe
      if (data && data.useEmbedIframe && data.embedUrl) {
        slot.ytLiveChatMode = 'iframe';
        if (lockBtn) lockBtn.style.display = 'none';
        container.innerHTML = `
          <div class="yt-livechat-wrap">
            ${renderModeBar('iframe', false)}
            <div class="yt-livechat-iframe-box">
              <iframe src="${escapeHtml(data.embedUrl)}" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media" style="width:100%;height:100%;border:none;background:#0d111a;"></iframe>
            </div>
          </div>
        `;
        return;
      }

      const listEl = document.getElementById(`yt-livechat-list-${slotIndex}`);
      if (!listEl) return;

      if (!data || !data.success) {
        const msg = (data && data.disabled)
          ? '이 방송은 실시간 채팅이 비활성화되어 있습니다.'
          : ((data && data.error) || '실시간 채팅을 불러올 수 없습니다.');
        listEl.innerHTML = `<div class="chat-empty-hint">${escapeHtml(msg)}</div>`;
        return;
      }

      slot.ytLiveChatContinuation = data.continuationToken || null;
      listEl.innerHTML = '';

      if (data.messages && data.messages.length > 0) {
        this.appendYouTubeLiveChatMessages(slot, data.messages);
      } else {
        listEl.innerHTML = '<div class="chat-empty-hint">실시간 채팅 수신 대기 중...</div>';
      }

      // Schedule next poll
      const delay = Math.max(1500, Math.min(6000, data.timeoutMs || 2500));
      slot.ytLiveChatTimer = setTimeout(() => {
        this.pollYouTubeLiveChat(slotIndex);
      }, delay);
    } catch (e) {
      console.error('Failed to load YouTube live chat:', e);
      const listEl = document.getElementById(`yt-livechat-list-${slotIndex}`);
      if (listEl) listEl.innerHTML = '<div class="chat-empty-hint">실시간 채팅 연결에 실패했습니다.</div>';
    }
  }

  async pollYouTubeLiveChat(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot || !slot.active || slot.type !== 'youtube' || !slot.ytLiveChatActive || !slot.chatOpen || slot.ytLiveChatMode === 'iframe') {
      return;
    }
    const targetVideoId = slot.videoId;
    const cont = slot.ytLiveChatContinuation;
    if (!cont || !targetVideoId) return;

    try {
      const res = await fetch(`/api/youtube/live_chat/${encodeURIComponent(targetVideoId)}?continuation=${encodeURIComponent(cont)}`);
      const data = await res.json();
      if (!slot.active || slot.videoId !== targetVideoId || !slot.ytLiveChatActive || !slot.chatOpen) return;

      if (data && data.success) {
        if (data.continuationToken) {
          slot.ytLiveChatContinuation = data.continuationToken;
        }
        if (data.messages && data.messages.length > 0) {
          this.appendYouTubeLiveChatMessages(slot, data.messages);
        }
        const delay = Math.max(1500, Math.min(6000, data.timeoutMs || 2500));
        slot.ytLiveChatTimer = setTimeout(() => {
          this.pollYouTubeLiveChat(slotIndex);
        }, delay);
      } else {
        slot.ytLiveChatTimer = setTimeout(() => {
          this.pollYouTubeLiveChat(slotIndex);
        }, 4000);
      }
    } catch (_) {
      if (slot.active && slot.ytLiveChatActive && slot.chatOpen) {
        slot.ytLiveChatTimer = setTimeout(() => {
          this.pollYouTubeLiveChat(slotIndex);
        }, 5000);
      }
    }
  }

  appendYouTubeLiveChatMessages(slot, messages) {
    const listEl = document.getElementById(`yt-livechat-list-${slot.index}`);
    const scrollContainer = document.getElementById(`slot-chat-messages-${slot.index}`);
    if (!listEl || !scrollContainer) return;

    const hint = listEl.querySelector('.chat-empty-hint');
    if (hint) hint.remove();

    if (!slot.ytLiveChatSeenIds) slot.ytLiveChatSeenIds = new Set();

    const frag = document.createDocumentFragment();
    let addedCount = 0;

    messages.forEach(msg => {
      const msgId = msg.id || `${msg.author}_${msg.timestampUsec}_${JSON.stringify(msg.runs || []).slice(0, 30)}`;
      if (slot.ytLiveChatSeenIds.has(msgId)) return;
      slot.ytLiveChatSeenIds.add(msgId);
      if (slot.ytLiveChatSeenIds.size > 800) {
        const firstKey = slot.ytLiveChatSeenIds.values().next().value;
        slot.ytLiveChatSeenIds.delete(firstKey);
      }

      const div = document.createElement('div');
      div.innerHTML = this.renderYouTubeLiveChatMessageHTML(msg);
      if (div.firstElementChild) {
        frag.appendChild(div.firstElementChild);
        addedCount++;
      }
    });

    if (addedCount === 0) return;

    listEl.appendChild(frag);
    while (listEl.children.length > 220) {
      listEl.removeChild(listEl.firstElementChild);
    }

    if (slot.autoScroll !== false) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }

  renderYouTubeLiveChatMessageHTML(msg) {
    const authorEsc = escapeHtml(msg.author || '익명');
    const badgesHtml = (msg.badges || []).map(b => {
      if (b.kind === 'owner') {
        return `<span class="yt-lc-badge owner" title="${escapeHtml(b.label || '채널 소유자')}"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z"/></svg></span>`;
      }
      if (b.kind === 'moderator') {
        return `<span class="yt-lc-badge mod" title="${escapeHtml(b.label || '운영자')}"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span>`;
      }
      if (b.kind === 'verified') {
        return `<span class="yt-lc-badge verified" title="${escapeHtml(b.label || '인증됨')}"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></span>`;
      }
      if (b.kind === 'member' && b.url) {
        return `<img class="yt-lc-badge-img" src="${escapeHtml(b.url)}" alt="${escapeHtml(b.label || '멤버')}" title="${escapeHtml(b.label || '멤버십')}">`;
      }
      return '';
    }).join('');

    const bodyHtml = (msg.runs || []).map(r => {
      if (r.type === 'emoji' && r.url) {
        return `<img class="chat-emote yt-lc-emoji" src="${escapeHtml(r.url)}" alt="${escapeHtml(r.alt || '')}" loading="lazy">`;
      }
      return escapeHtml(r.text || '');
    }).join('');

    if (msg.kind === 'superchat') {
      return `
        <div class="chat-msg-item yt-lc-superchat">
          <div class="yt-lc-sc-header">
            <span class="yt-lc-sc-author">${badgesHtml}${authorEsc}</span>
            <span class="yt-lc-sc-amount">${escapeHtml(msg.amount || 'Super Chat')}</span>
          </div>
          ${bodyHtml ? `<div class="yt-lc-sc-body">${bodyHtml}</div>` : ''}
        </div>
      `;
    }

    if (msg.kind === 'membership') {
      return `
        <div class="chat-msg-item yt-lc-membership">
          <div class="yt-lc-sc-header">
            <span class="yt-lc-sc-author">${badgesHtml}${authorEsc}</span>
            <span class="yt-lc-mem-badge">멤버십</span>
          </div>
          <div class="yt-lc-sc-body">${bodyHtml}</div>
        </div>
      `;
    }

    const isOwner = (msg.badges || []).some(b => b.kind === 'owner');
    const isMod = (msg.badges || []).some(b => b.kind === 'moderator');
    const authorCls = isOwner ? 'yt-lc-author owner' : (isMod ? 'yt-lc-author mod' : 'yt-lc-author');

    return `
      <div class="chat-msg-item yt-lc-msg">
        ${badgesHtml}<span class="${authorCls}">${authorEsc}</span><span class="yt-lc-colon">: </span><span class="chat-text">${bodyHtml}</span>
      </div>
    `;
  }

  async loadYouTubeSlotComments(slotIndex, forceComments = false) {
    const slot = this.slots[slotIndex];
    if (!slot || slot.type !== 'youtube' || !slot.videoId) return;

    if (slot.isLive && !forceComments && !slot.ytForceCommentsMode) {
      this.loadYouTubeLiveChat(slotIndex);
      return;
    }

    const container = document.getElementById(`slot-chat-messages-${slotIndex}`);
    if (!container) return;

    container.style.fontSize = `${slot.chatFontSize || 12}px`;
    container.innerHTML = '<div class="chat-empty-hint">영상 설명 및 댓글을 불러오는 중...</div>';

    try {
      const res = await fetch(`/api/youtube/comments/${encodeURIComponent(slot.videoId)}`);
      const data = await res.json();

      if (data && data.hasLiveChat && !forceComments && !slot.ytForceCommentsMode) {
        slot.isLive = true;
        this.loadYouTubeLiveChat(slotIndex);
        return;
      }

      const info = (data && data.videoInfo) ? data.videoInfo : {};
      const descText = (info.description || '').trim();
      const metaParts = [info.viewCount, info.dateText].filter(Boolean).join(' • ');

      let html = '';

      if (slot.isLive) {
        html += `
          <div class="yt-livechat-modebar" style="margin-bottom:8px;">
            <button type="button" class="yt-lc-mode-btn" onclick="window.multiview.switchYouTubeLiveChatMode(${slotIndex}, 'auto')">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span>실시간 채팅으로 돌아가기</span>
            </button>
          </div>
        `;
      }

      // 1. Top Video Description Card
      const isLongDesc = descText.length > 120 || descText.split('\n').length > 3;
      html += `
        <div class="yt-slot-description-box ${isLongDesc ? '' : 'expanded'}" id="yt-slot-desc-box-${slotIndex}">
          <div class="yt-slot-description-header">
            <div class="yt-slot-description-meta">
              <span class="yt-desc-badge">영상 설명</span>
              ${metaParts ? `<span class="yt-desc-stats">${escapeHtml(metaParts)}</span>` : ''}
            </div>
            ${isLongDesc ? `
              <button class="yt-desc-toggle-btn" onclick="window.multiview.toggleYouTubeDescription(${slotIndex})">
                <span style="display:inline-flex;align-items:center;gap:3px;">설명 더보기 ${ICONS.chevronDown}</span>
              </button>
            ` : ''}
          </div>
          <div class="yt-slot-description-content">${descText ? this.formatYouTubeRichText(descText, slotIndex) : '<span style="color:var(--text-dim);">등록된 영상 설명이 없습니다.</span>'}</div>
        </div>
      `;

      // 2. Comments List & Expandable Replies (Requirement 1: Auto scroll loader)
      if (!data.success || !data.comments || data.comments.length === 0) {
        html += `<div class="chat-empty-hint">${data.disabled ? '댓글이 비활성화된 영상입니다.' : '등록된 유튜브 댓글이 없습니다.'}</div>`;
        container.innerHTML = html;
        return;
      }

      slot.commentsList = data.comments || [];
      slot.commentsContinuationToken = data.continuationToken || null;
      slot.hasMoreComments = !!data.hasMore;
      slot.commentsLoading = false;

      html += `<div class="yt-slot-comments-header">댓글 ${slot.commentsList.length}개</div>`;
      html += '<div class="yt-slot-comments-list">';
      slot.commentsList.forEach(c => {
        html += this.renderSingleYouTubeCommentHTML(c, slotIndex);
      });
      html += '</div>';

      // Sentinel for automatic scroll loading (Requirement 1)
      if (slot.commentsContinuationToken) {
        html += `
          <div class="yt-comments-scroll-sentinel" id="yt-more-comments-sentinel-${slotIndex}" onclick="window.multiview.loadMoreYouTubeComments(${slotIndex})" style="cursor:pointer;" title="클릭하여 댓글 더 불러오기">
            ${ICONS.spinner}
            <span>댓글 불러오는 중... (클릭 시 추가 로드)</span>
          </div>
        `;
      }

      container.innerHTML = html;

      // Setup IntersectionObserver for auto loading on scroll
      const sentinel = document.getElementById(`yt-more-comments-sentinel-${slotIndex}`);
      if (sentinel && window.IntersectionObserver) {
        if (slot._commentsObserver) slot._commentsObserver.disconnect();
        slot._commentsObserver = new IntersectionObserver((entries) => {
          if (entries[0] && entries[0].isIntersecting) {
            if (slot.commentsContinuationToken && !slot.commentsLoading) {
              this.loadMoreYouTubeComments(slotIndex);
            }
          }
        }, { root: container, rootMargin: '250px' });
        slot._commentsObserver.observe(sentinel);
      }
    } catch (e) {
      console.error('Failed to load YouTube comments:', e);
      container.innerHTML = '<div class="chat-empty-hint">댓글을 불러올 수 없습니다.</div>';
    }
  }

  async loadMoreYouTubeComments(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot || !slot.commentsContinuationToken || slot.commentsLoading) return;
    slot.commentsLoading = true;
    const sentinel = document.getElementById(`yt-more-comments-sentinel-${slotIndex}`);
    if (sentinel) {
      sentinel.style.display = 'flex';
      sentinel.innerHTML = `${ICONS.spinner} <span>댓글 불러오는 중... (클릭 시 추가 로드)</span>`;
    }

    try {
      const res = await fetch(`/api/youtube/comments/${encodeURIComponent(slot.videoId)}?continuation=${encodeURIComponent(slot.commentsContinuationToken)}`);
      const data = await res.json();
      if (data && data.success && data.comments && data.comments.length > 0) {
        slot.commentsList = slot.commentsList || [];
        slot.commentsList.push(...data.comments);
        slot.commentsContinuationToken = data.continuationToken || null;
        slot.hasMoreComments = !!data.hasMore;

        const listEl = document.querySelector(`#slot-${slotIndex} .yt-slot-comments-list`);
        if (listEl) {
          let newHtml = '';
          data.comments.forEach(c => {
            newHtml += this.renderSingleYouTubeCommentHTML(c, slotIndex);
          });
          listEl.insertAdjacentHTML('beforeend', newHtml);
        }
        const hdr = document.querySelector(`#slot-${slotIndex} .yt-slot-comments-header`);
        if (hdr) hdr.textContent = `댓글 ${slot.commentsList.length}개`;
      } else {
        slot.commentsContinuationToken = null;
        slot.hasMoreComments = false;
      }
    } catch (e) {
      console.warn('Load more comments error:', e);
    } finally {
      slot.commentsLoading = false;
      const sentEl = document.getElementById(`yt-more-comments-sentinel-${slotIndex}`);
      if (sentEl) {
        if (slot.commentsContinuationToken && slot.hasMoreComments) {
          sentEl.style.display = 'flex';
          sentEl.innerHTML = `${ICONS.spinner} <span>댓글 불러오는 중... (클릭 시 추가 로드)</span>`;
          const container = document.getElementById(`slot-chat-messages-${slotIndex}`);
          if (container) {
            const distFromBottom = container.scrollHeight - container.clientHeight - container.scrollTop;
            if (distFromBottom <= 350) {
              setTimeout(() => {
                if (slot.commentsContinuationToken && !slot.commentsLoading) {
                  this.loadMoreYouTubeComments(slotIndex);
                }
              }, 200);
            }
          }
        } else {
          sentEl.remove();
          if (slot._commentsObserver) {
            slot._commentsObserver.disconnect();
            slot._commentsObserver = null;
          }
        }
      }
    }
  }

  renderYouTubeReplyItemsHTML(replies, slotIndex) {
    let html = '';
    (replies || []).forEach(r => {
      const author = escapeHtml(r.author || '익명');
      const pub = escapeHtml(r.published || '');
      const contentHtml = this.formatYouTubeRichText(r.content || '', slotIndex);
      const avatar = r.avatar || './static/img/favicon.png';
      const likeCount = escapeHtml(r.likeCount || '');

      html += `
        <div class="yt-comment-reply-item">
          <img class="yt-comment-reply-avatar" src="${avatar}" onerror="this.src='./static/img/favicon.png'" alt="">
          <div class="yt-comment-body">
            <div class="yt-comment-author-row">
              <span class="yt-comment-author">${author}</span>
              <span class="yt-comment-time">${pub}</span>
              ${likeCount ? `<span class="yt-comment-likes" style="display:inline-flex;align-items:center;gap:3px;">${ICONS.heart} ${likeCount}</span>` : ''}
            </div>
            <div class="yt-comment-text">${contentHtml}</div>
          </div>
        </div>
      `;
    });
    return html;
  }

  async toggleYouTubeCommentReplies(btnEl, slotIndex) {
    if (!btnEl) return;
    const wrap = btnEl.closest('.yt-comment-replies-wrap');
    if (!wrap) return;
    const listEl = wrap.querySelector('.yt-comment-replies-list');
    if (!listEl) return;

    const label = btnEl.getAttribute('data-reply-label') || '답글';
    const token = btnEl.getAttribute('data-reply-token');
    const arrowEl = btnEl.querySelector('.reply-arrow-icon') || btnEl.querySelector('.reply-arrow');
    const textEl = btnEl.querySelector('.reply-btn-text');

    if (listEl.getAttribute('data-loaded') === 'true') {
      const isHidden = listEl.style.display === 'none';
      listEl.style.display = isHidden ? 'flex' : 'none';
      if (arrowEl) arrowEl.innerHTML = isHidden ? ICONS.chevronUp : ICONS.chevronDown;
      if (textEl) textEl.textContent = isHidden ? `${label} 접기` : `${label} 보기`;
      return;
    }

    if (!token) return;
    btnEl.disabled = true;
    if (textEl) textEl.textContent = '답글 불러오는 중...';

    try {
      const res = await fetch(`/api/youtube/comments/replies?token=${encodeURIComponent(token)}`);
      const data = await res.json();
      btnEl.disabled = false;

      if (!data.success || !data.replies || data.replies.length === 0) {
        listEl.innerHTML = '<div class="yt-reply-empty">표시할 답글이 없습니다.</div>';
        listEl.style.display = 'flex';
        listEl.setAttribute('data-loaded', 'true');
        if (arrowEl) arrowEl.innerHTML = ICONS.chevronUp;
        if (textEl) textEl.textContent = `${label} 접기`;
        return;
      }

      let itemsHtml = this.renderYouTubeReplyItemsHTML(data.replies, slotIndex);
      if (data.nextToken) {
        itemsHtml += `
          <button class="yt-comment-more-replies-btn"
                  data-next-token="${escapeHtml(data.nextToken)}"
                  onclick="window.multiview.loadMoreYouTubeCommentReplies(this, ${slotIndex})"
                  style="display:inline-flex;align-items:center;gap:4px;">
            <span>답글 더보기</span>
            ${ICONS.chevronDown}
          </button>
        `;
      }

      listEl.innerHTML = itemsHtml;
      listEl.style.display = 'flex';
      listEl.setAttribute('data-loaded', 'true');
      if (arrowEl) arrowEl.innerHTML = ICONS.chevronUp;
      if (textEl) textEl.textContent = `${label} 접기`;
    } catch (err) {
      btnEl.disabled = false;
      if (textEl) textEl.textContent = `${label} 보기`;
    }
  }

  async loadMoreYouTubeCommentReplies(moreBtnEl, slotIndex) {
    if (!moreBtnEl) return;
    const nextToken = moreBtnEl.getAttribute('data-next-token');
    const listEl = moreBtnEl.closest('.yt-comment-replies-list');
    if (!nextToken || !listEl) return;

    moreBtnEl.disabled = true;
    moreBtnEl.innerHTML = `<span style="display:inline-flex;align-items:center;gap:4px;">${ICONS.spinner} <span>답글 더 불러오는 중...</span></span>`;

    try {
      const res = await fetch(`/api/youtube/comments/replies?token=${encodeURIComponent(nextToken)}`);
      const data = await res.json();
      moreBtnEl.remove();

      if (data.success && data.replies && data.replies.length > 0) {
        const tempDiv = document.createElement('div');
        let extraHtml = this.renderYouTubeReplyItemsHTML(data.replies, slotIndex);
        if (data.nextToken) {
          extraHtml += `
            <button class="yt-comment-more-replies-btn"
                    data-next-token="${escapeHtml(data.nextToken)}"
                    onclick="window.multiview.loadMoreYouTubeCommentReplies(this, ${slotIndex})"
                    style="display:inline-flex;align-items:center;gap:4px;">
              <span>답글 더보기</span>
              ${ICONS.chevronDown}
            </button>
          `;
        }
        tempDiv.innerHTML = extraHtml;
        while (tempDiv.firstChild) {
          listEl.appendChild(tempDiv.firstChild);
        }
      }
    } catch (err) {
      moreBtnEl.disabled = false;
      moreBtnEl.innerHTML = `<span style="display:inline-flex;align-items:center;gap:4px;"><span>답글 더보기</span> ${ICONS.chevronDown}</span>`;
    }
  }

  appendSlotChatMessage(slot, item, addToHistory = true) {
    if (!slot) return;
    if (addToHistory) {
      if (!slot.chatHistory) slot.chatHistory = [];
      slot.chatHistory.push(item);
      if (slot.chatHistory.length > 250) {
        slot.chatHistory.shift();
      }
    }
    const container = document.getElementById(`slot-chat-messages-${slot.index}`);
    if (!container) return;

    let profile = {};
    if (typeof item.profile === 'string') {
      try { profile = JSON.parse(item.profile); } catch (e) {}
    } else if (item.profile) {
      profile = item.profile;
    }

    let extras = {};
    if (typeof item.extras === 'string') {
      try { extras = JSON.parse(item.extras); } catch (e) {}
    } else if (item.extras) {
      extras = item.extras;
    }

    const nickname = profile.nickname || '익명';
    let msgText = item.msg || item.content || '';

    let badgeHtml = '';
    if (profile.userRoleCode === 'streamer') {
      badgeHtml = '<span class="chat-badge streamer">스트리머</span>';
    } else if (profile.userRoleCode === 'streaming_channel_manager') {
      badgeHtml = '<span class="chat-badge manager">매니저</span>';
    } else if (profile.badge && profile.badge.imageUrl) {
      badgeHtml = `<img src="${profile.badge.imageUrl}" class="chat-badge" style="width:14px;height:14px;padding:0;vertical-align:-2px;">`;
    }

    const isDonation = item.msgTypeCode === 10 || item.msgTypeCode === 11 || (extras.payType === 'DONATION');
    const cheeseAmount = extras.payAmount || extras.donationType;

    const colors = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#22c55e', '#84cc16', '#eab308', '#f97316'];
    let hash = 0;
    for (let i = 0; i < nickname.length; i++) hash = nickname.charCodeAt(i) + ((hash << 5) - hash);
    const color = colors[Math.abs(hash) % colors.length];

    const safeNick = String(nickname).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    let safeMsg = String(msgText).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Build unified emoji map for this message (cleanCode -> url)
    const emojiMap = new Map();

    // 1. Channel pre-fetched emoji pack cache (official & sub emojis)
    if (slot.channelId && this.channelEmojiCache && this.channelEmojiCache[slot.channelId]) {
      const chMap = this.channelEmojiCache[slot.channelId];
      for (const [k, v] of Object.entries(chMap)) {
        if (k && v && typeof v === 'string') {
          emojiMap.set(k, v);
          emojiMap.set(k.toLowerCase(), v);
        }
      }
    }

    // 2. Incoming message extras.emojis (supports object, array, or JSON string)
    let rawEmojis = extras.emojis || extras.emoticons || item.emojis || item.emoticons;
    if (typeof rawEmojis === 'string') {
      try { rawEmojis = JSON.parse(rawEmojis); } catch (e) {}
    }
    if (rawEmojis && typeof rawEmojis === 'object') {
      if (Array.isArray(rawEmojis)) {
        for (const it of rawEmojis) {
          const k = it.emojiId || it.id || it.name;
          const url = it.imageUrl || it.path || it.url || it.src;
          if (k && url && typeof url === 'string') {
            const clean = String(k).replace(/^\{:/, '').replace(/:\}$/, '').trim();
            emojiMap.set(clean, url);
            emojiMap.set(clean.toLowerCase(), url);
          }
        }
      } else {
        for (const [k, v] of Object.entries(rawEmojis)) {
          const url = typeof v === 'string' ? v : (v && (v.path || v.url || v.imageUrl || v.src));
          if (k && url && typeof url === 'string') {
            const clean = String(k).replace(/^\{:/, '').replace(/:\}$/, '').trim();
            emojiMap.set(clean, url);
            emojiMap.set(clean.toLowerCase(), url);
          }
        }
      }
    }

    // 3. Single-pass non-recursive replacement of {:emoji_code:}
    safeMsg = safeMsg.replace(/\{:([^:}]+):\}/g, (match, rawCode) => {
      const code = rawCode.trim();
      const url = emojiMap.get(code) || emojiMap.get(code.toLowerCase());
      if (url) {
        const safeAlt = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        return `<img src="${encodeURI(url)}" class="chat-emoticon" alt="${safeAlt}" title="${safeAlt}" loading="lazy" onerror="this.style.display='none'">`;
      }
      return '';
    });

    // 4. Also replace :emoji_code: if code is in emojiMap (e.g. :d_47:)
    if (emojiMap.size > 0) {
      safeMsg = safeMsg.replace(/:([a-zA-Z0-9_\-]+):/g, (match, rawCode) => {
        const code = rawCode.trim();
        const url = emojiMap.get(code) || emojiMap.get(code.toLowerCase());
        if (url) {
          const safeAlt = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
          return `<img src="${encodeURI(url)}" class="chat-emoticon" alt="${safeAlt}" title="${safeAlt}" loading="lazy" onerror="this.style.display='none'">`;
        }
        return match;
      });
    }

    const timeTag = (slot.type === 'vod' && typeof item.playerMessageTime === 'number') 
      ? `<span class="chat-time-tag" style="font-size:10px; color:var(--text-dim); margin-right:4px; font-variant-numeric: tabular-nums;">[${this.formatSecs(item.playerMessageTime / 1000)}]</span>` 
      : '';

    let messageInnerHtml = '';
    if (isDonation && cheeseAmount) {
      messageInnerHtml = `
        <div style="width: 100%;">
          <div style="font-weight: 800; font-size: 11px; margin-bottom: 2px; color: #fbbf24;">후원: ${Number(cheeseAmount).toLocaleString()} 치즈</div>
          ${timeTag}<span class="chat-user-nickname" style="color:${color}; font-weight:700;">${safeNick}</span>:
          <span class="chat-content">${safeMsg}</span>
        </div>
      `;
    } else {
      messageInnerHtml = `
        ${timeTag}${badgeHtml}
        <span class="chat-user-nickname" style="color:${color}; font-weight:700;">${safeNick}</span>:
        <span class="chat-content">${safeMsg}</span>
      `;
    }

    const row = document.createElement('div');
    row.className = isDonation ? 'chat-message-row chat-donation' : 'chat-message-row';
    row.innerHTML = messageInnerHtml;

    const hint = container.querySelector('.chat-empty-hint');
    if (hint) hint.remove();

    // Prevent excessive memory usage, while keeping scroll offset intact when user scrolled up
    if (container.childNodes.length > 150) {
      const first = container.firstChild;
      if (first) {
        const h = first.offsetHeight || 0;
        first.remove();
        if (slot.autoScroll === false) {
          container.scrollTop = Math.max(0, container.scrollTop - h);
        }
      }
    }

    container.appendChild(row);

    // Keep pinned to bottom if autoScroll is enabled
    if (slot.autoScroll !== false) {
      container.scrollTop = container.scrollHeight;
    } else {
      const toastBtn = document.getElementById(`chat-bottom-btn-${slot.index}`);
      if (toastBtn) toastBtn.style.display = 'flex';
    }
  }

  // ================= VOD Synchronized Chat Replay =================
  async startVodChatSync(slot) {
    if (!slot || slot.type !== 'vod' || !slot.videoNo) return;
    this.stopVodChatSync(slot);

    if (slot.channelId) {
      this.loadChannelEmojiPacks(slot.channelId);
    }

    const container = document.getElementById(`slot-chat-messages-${slot.index}`);
    if (container) {
      container.innerHTML = '<div class="chat-empty-hint">다시보기 채팅 동기화 중...</div>';
    }

    slot.vodChatMessages = [];
    slot.vodChatDisplayedIndex = 0;
    slot.vodChatNextTime = 0;
    slot.vodChatFetchedUpToMs = 0;
    slot.vodChatLastSyncMs = 0;
    slot.vodChatFetching = false;

    const curMs = slot.videoEl ? Math.floor(slot.videoEl.currentTime * 1000) : 0;
    await this.fetchVodChats(slot, Math.max(0, curMs - 5000));

    slot.vodChatTimer = setInterval(() => {
      this.tickVodChatSync(slot);
    }, 250);
  }

  stopVodChatSync(slot) {
    if (slot && slot.vodChatTimer) {
      clearInterval(slot.vodChatTimer);
      slot.vodChatTimer = null;
    }
  }

  async fetchVodChats(slot, playerMessageTime = 0) {
    if (!slot || slot.vodChatFetching || !slot.videoNo) return;
    slot.vodChatFetching = true;
    try {
      const res = await fetch(`/api/videos/${slot.videoNo}/chats?player_message_time=${Math.max(0, Math.floor(playerMessageTime))}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.videoChats)) {
        const newChats = data.videoChats;
        const existingSet = new Set(slot.vodChatMessages.map(c => `${c.playerMessageTime}_${c.userIdHash}_${c.content}`));
        for (const c of newChats) {
          const key = `${c.playerMessageTime}_${c.userIdHash}_${c.content}`;
          if (!existingSet.has(key)) {
            existingSet.add(key);
            slot.vodChatMessages.push(c);
          }
        }
        slot.vodChatMessages.sort((a, b) => (a.playerMessageTime || 0) - (b.playerMessageTime || 0));
        slot.vodChatNextTime = data.nextPlayerMessageTime || null;
        if (newChats.length > 0) {
          const maxMs = Math.max(...newChats.map(c => c.playerMessageTime || 0));
          slot.vodChatFetchedUpToMs = Math.max(slot.vodChatFetchedUpToMs || 0, maxMs);
        }
      }
    } catch (e) {
      console.warn(`Failed to fetch VOD chats for video ${slot.videoNo}:`, e);
    } finally {
      slot.vodChatFetching = false;
    }
  }

  tickVodChatSync(slot) {
    if (!slot || !slot.active || slot.type !== 'vod' || !slot.videoEl || !slot.chatOpen) return;
    if (slot.videoEl.paused) return;

    const curMs = Math.floor(slot.videoEl.currentTime * 1000);

    // Detect seek / time jump (> 4 seconds forward or backward)
    if (Math.abs(curMs - (slot.vodChatLastSyncMs || 0)) > 4000) {
      this.resetAndSeekVodChat(slot, curMs);
      return;
    }
    slot.vodChatLastSyncMs = curMs;

    // Display messages up to curMs
    while (slot.vodChatDisplayedIndex < slot.vodChatMessages.length) {
      const msg = slot.vodChatMessages[slot.vodChatDisplayedIndex];
      if ((msg.playerMessageTime || 0) <= curMs) {
        this.appendSlotChatMessage(slot, msg);
        slot.vodChatDisplayedIndex++;
      } else {
        break;
      }
    }

    // Prefetch next chunk if buffer running low
    const remaining = slot.vodChatMessages.length - slot.vodChatDisplayedIndex;
    const timeRemainingMs = (slot.vodChatFetchedUpToMs || 0) - curMs;
    if (!slot.vodChatFetching && slot.vodChatNextTime && (remaining < 30 || timeRemainingMs < 25000)) {
      this.fetchVodChats(slot, slot.vodChatNextTime);
    }
  }

  async resetAndSeekVodChat(slot, targetMs = null) {
    if (!slot || slot.type !== 'vod') return;
    const curMs = targetMs !== null ? targetMs : (slot.videoEl ? Math.floor(slot.videoEl.currentTime * 1000) : 0);
    slot.vodChatLastSyncMs = curMs;

    const container = document.getElementById(`slot-chat-messages-${slot.index}`);
    if (container) {
      container.innerHTML = `<div class="chat-empty-hint">${this.formatSecs(curMs / 1000)} 부근 채팅 동기화 중...</div>`;
    }

    // Find if we already have messages for this time
    const idx = slot.vodChatMessages.findIndex(c => (c.playerMessageTime || 0) >= Math.max(0, curMs - 2000));
    if (idx !== -1 && (slot.vodChatFetchedUpToMs || 0) > curMs) {
      slot.vodChatDisplayedIndex = idx;
    } else {
      slot.vodChatMessages = [];
      slot.vodChatDisplayedIndex = 0;
      await this.fetchVodChats(slot, Math.max(0, curMs - 3000));
    }
  }

  handleChatScroll(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot) return;
    const container = document.getElementById(`slot-chat-messages-${slotIndex}`);
    if (!container) return;

    // Requirement 1: Automatic Infinite Scroll on YouTube comments when scrolling down
    if (slot.type === 'youtube') {
      const distFromBottom = container.scrollHeight - container.clientHeight - container.scrollTop;
      if (distFromBottom <= 350 && slot.commentsContinuationToken && !slot.commentsLoading) {
        this.loadMoreYouTubeComments(slotIndex);
      }
      return;
    }

    const distFromBottom = container.scrollHeight - container.clientHeight - container.scrollTop;
    const isAtBottom = distFromBottom <= 45;
    const toastBtn = document.getElementById(`chat-bottom-btn-${slotIndex}`);
    const lockBtn = document.getElementById(`chat-lock-btn-${slotIndex}`);

    if (isAtBottom) {
      slot.autoScroll = true;
      if (toastBtn) toastBtn.style.display = 'none';
      if (lockBtn) lockBtn.classList.add('locked');
    } else {
      slot.autoScroll = false;
      if (toastBtn) toastBtn.style.display = 'flex';
      if (lockBtn) lockBtn.classList.remove('locked');
    }
  }

  scrollToBottom(slotIndex) {
    const slot = this.slots[slotIndex];
    if (slot) slot.autoScroll = true;
    const container = document.getElementById(`slot-chat-messages-${slotIndex}`);
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
    const toastBtn = document.getElementById(`chat-bottom-btn-${slotIndex}`);
    if (toastBtn) toastBtn.style.display = 'none';
    const lockBtn = document.getElementById(`chat-lock-btn-${slotIndex}`);
    if (lockBtn) lockBtn.classList.add('locked');
  }

  openChatPopout(channelId) {
    const targetCid = channelId || (this.slots.find(s => s.active && s.channelId) || {}).channelId;
    if (targetCid) {
      window.open(`https://chzzk.naver.com/live/${targetCid}/chat`, '_blank', 'width=380,height=720,menubar=no,toolbar=no,location=no,status=no');
    } else {
      if (window.app) window.app.showToast('선택된 방송 채널이 없습니다.', 'info');
    }
  }

  // ================= In-Slot Screen Recording (Canvas / Buffer Capture) =================
  async startScreenRecording(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot || !slot.active || !slot.videoEl) return;

    try {
      const video = slot.videoEl;
      let stream = null;
      if (typeof video.captureStream === 'function') {
        stream = video.captureStream(30);
      } else if (typeof video.mozCaptureStream === 'function') {
        stream = video.mozCaptureStream(30);
      }

      if (!stream) {
        if (window.app) window.app.showToast('브라우저에서 화면 캡처 녹화를 지원하지 않습니다.', 'error');
        return;
      }

      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = '';
        }
      }

      const options = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(stream, options);
      slot.screenChunks = [];
      slot.screenRecorder = recorder;
      slot.isScreenRecording = true;
      slot.screenRecSecs = 0;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          slot.screenChunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        clearInterval(slot.screenRecTimer);
        const recordedBlob = new Blob(slot.screenChunks, { type: mimeType || 'video/webm' });
        slot.screenChunks = [];
        slot.isScreenRecording = false;
        slot.screenRecorder = null;
        this.renderSlots();

        if (recordedBlob.size > 0) {
          if (window.app) window.app.showToast(`'${slot.channelName}' 화면 녹화본 저장 중...`, 'info');
          const cleanName = (slot.channelName || 'stream').replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
          const filename = `screen_${cleanName}_${Date.now()}.webm`;

          try {
            const res = await fetch(`/api/recordings/save-screen?filename=${encodeURIComponent(filename)}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/octet-stream' },
              body: recordedBlob
            });
            const data = await res.json();
            if (data.success) {
              if (window.app) {
                window.app.showToast(`'${data.filename}' 화면 녹화 완료! [녹화] 탭에서 확인하세요.`, 'success');
              }
              if (window.recorderUI) {
                window.recorderUI.loadRecordings();
              }
            }
          } catch (err) {
            console.error('Screen recording upload error:', err);
          }
        }
      };

      recorder.start(1000);
      slot.screenRecTimer = setInterval(() => {
        slot.screenRecSecs = (slot.screenRecSecs || 0) + 1;
        const slotEl = document.getElementById(`slot-${slotIndex}`);
        const indicator = slotEl ? slotEl.querySelector('.slot-screen-indicator') : null;
        if (indicator) {
          indicator.textContent = `⏺ 화면 녹화 중: ${slot.screenRecSecs}s`;
        }
      }, 1000);

      this.updateSlotRecordUI(slotIndex);
      if (window.app) {
        window.app.showToast(`'${slot.channelName}' 현재 화면 녹화 시작! (되돌려본 30초 전 시점 그대로 녹화)`, 'success');
      }
    } catch (err) {
      console.error('Screen recording start error:', err);
      if (window.app) window.app.showToast('화면 녹화 시작 실패: ' + err.message, 'error');
    }
  }

  stopScreenRecording(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot || !slot.screenRecorder) return;
    if (slot.screenRecorder.state !== 'inactive') {
      slot.screenRecorder.stop();
    }
    clearInterval(slot.screenRecTimer);
    slot.isScreenRecording = false;
    this.updateSlotRecordUI(slotIndex);
  }

  // ================= Floating PiP Mini Player (Draggable & Resizable) =================
  initPiPControls() {
    const pipEl = this.pipMiniPlayer;
    if (!pipEl) return;

    // 1. Draggable via Header
    if (this.pipHeader) {
      this.pipHeader.addEventListener('mousedown', (e) => {
        if (e.target.closest('button, select')) return;
        e.preventDefault();

        const startX = e.clientX;
        const startY = e.clientY;
        const rect = pipEl.getBoundingClientRect();
        const initLeft = rect.left;
        const initTop = rect.top;

        pipEl.style.bottom = 'auto';
        pipEl.style.right = 'auto';
        pipEl.style.left = `${initLeft}px`;
        pipEl.style.top = `${initTop}px`;

        const onMouseMove = (ev) => {
          const dx = ev.clientX - startX;
          const dy = ev.clientY - startY;
          pipEl.style.left = `${Math.max(10, Math.min(window.innerWidth - pipEl.offsetWidth - 10, initLeft + dx))}px`;
          pipEl.style.top = `${Math.max(10, Math.min(window.innerHeight - pipEl.offsetHeight - 10, initTop + dy))}px`;
          this.syncPiPIframePosition();
        };

        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
          this.syncPiPIframePosition();
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });
    }

    // 2. Resizable Handle
    if (this.pipResizeHandle) {
      this.pipResizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const startY = e.clientY;
        const initW = pipEl.offsetWidth;
        const initH = pipEl.offsetHeight;

        const onMouseMove = (ev) => {
          const newW = Math.max(240, Math.min(850, initW + (ev.clientX - startX)));
          const newH = Math.max(150, Math.min(650, initH + (ev.clientY - startY)));
          pipEl.style.width = `${newW}px`;
          pipEl.style.height = `${newH}px`;
          this.syncPiPIframePosition();
        };

        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
          this.syncPiPIframePosition();
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });
    }

    // 3. Slot Selector Dropdown
    if (this.pipSlotSelect) {
      this.pipSlotSelect.addEventListener('change', (e) => {
        const idx = parseInt(e.target.value, 10);
        if (!isNaN(idx)) {
          this.switchPiPSlot(idx);
        }
      });
    }

    let mvResizeTimer = null;
    const handleMvViewportChange = () => {
      this.syncPiPIframePosition();
      if (this._inShortformSuspend) {
        this.syncShortformPiP();
      }
      clearTimeout(mvResizeTimer);
      mvResizeTimer = setTimeout(() => {
        if (this.layoutMode === 'focus' || this.layoutMode === 'auto') {
          this.updateGridLayout();
          this.applySlotLayoutStyles();
        }
        if (this._inShortformSuspend) {
          this.syncShortformPiP();
        }
      }, 90);
    };
    window.addEventListener('resize', handleMvViewportChange);
    window.addEventListener('orientationchange', handleMvViewportChange);
  }

  syncPiPIframePosition() {
    if (!this.pipActiveSlot || this.pipActiveSlot.type !== 'youtube' || !this.pipActiveSlot.iframeEl) return;
    if (!this.pipMiniPlayer || this.pipMiniPlayer.style.display === 'none' || !this.pipVideoBody) return;
    const rect = this.pipVideoBody.getBoundingClientRect();
    const iframe = this.pipActiveSlot.iframeEl;
    if (this.pipActiveSlot.slotEl) {
      this.pipActiveSlot.slotEl.classList.add('pip-hosted-slot');
    }
    iframe.style.position = 'fixed';
    iframe.style.left = `${rect.left}px`;
    iframe.style.top = `${rect.top}px`;
    iframe.style.width = `${rect.width}px`;
    iframe.style.height = `${rect.height}px`;
    iframe.style.zIndex = '10001';
    iframe.style.visibility = 'visible';
    iframe.style.pointerEvents = 'none';
  }

  restorePiPIframeToSlot(slot) {
    if (!slot || !slot.iframeEl) return;
    const iframe = slot.iframeEl;
    iframe.style.position = '';
    iframe.style.left = '';
    iframe.style.top = '';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.zIndex = '';
    iframe.style.visibility = '';
    iframe.style.pointerEvents = '';
    if (slot.slotEl) {
      slot.slotEl.classList.remove('pip-hosted-slot');
    }
  }

  updatePiPSlotOptions() {
    if (!this.pipSlotSelect) return;
    const activeSlots = this.slots.filter(s => s.active && (s.videoEl || s.iframeEl));
    if (activeSlots.length === 0) {
      this.pipSlotSelect.innerHTML = '<option value="">방송 없음</option>';
      return;
    }

    const currentVal = this.pipActiveSlot ? this.pipActiveSlot.index : activeSlots[0].index;
    this.pipSlotSelect.innerHTML = activeSlots.map(s => {
      const isMutedStr = s.muted ? '[음소거]' : '[소리 ON]';
      const typeStr = s.type === 'youtube' ? 'YouTube' : (s.type === 'vod' ? 'VOD' : (s.type === 'clip' ? 'CLIP' : 'CHZZK'));
      return `<option value="${s.index}">${isMutedStr} [${typeStr}] 슬롯 ${s.index + 1}: ${s.channelName || '영상'}</option>`;
    }).join('');

    this.pipSlotSelect.value = currentVal.toString();
  }

  switchPiPSlot(slotIndex) {
    const targetSlot = this.slots[slotIndex];
    const targetMedia = targetSlot ? (targetSlot.videoEl || targetSlot.iframeEl) : null;
    if (!targetSlot || !targetSlot.active || !targetMedia) return;
    if (this.pipActiveSlot && this.pipActiveSlot.index === slotIndex) return;

    const pipBody = document.getElementById('pipVideoBody');
    if (!pipBody) return;

    // Return current pip media back to its slot
    if (this.pipActiveSlot) {
      if (this.pipActiveSlot.type === 'youtube' && this.pipActiveSlot.iframeEl) {
        this.restorePiPIframeToSlot(this.pipActiveSlot);
      } else {
        const prevMedia = this.pipActiveSlot.videoEl;
        if (prevMedia) {
          const prevSlotEl = this.pipActiveSlot.slotEl || document.getElementById(`slot-${this.pipActiveSlot.index}`);
          if (prevSlotEl) {
            const vContainer = prevSlotEl.querySelector('.video-container');
            if (vContainer && prevMedia.parentElement !== vContainer) {
              vContainer.appendChild(prevMedia);
            }
          }
        }
      }
    }

    // Mount target slot media into pip
    this.pipActiveSlot = targetSlot;
    if (targetSlot.type === 'youtube' && targetSlot.iframeEl) {
      requestAnimationFrame(() => this.syncPiPIframePosition());
    } else if (targetSlot.videoEl && targetSlot.videoEl.parentElement !== pipBody) {
      pipBody.appendChild(targetSlot.videoEl);
    }

    if (this.pipMuteBtn) {
      this.pipMuteBtn.innerHTML = targetSlot.muted ? ICONS.volumeMute : ICONS.volumeUp;
    }

    if (this.pipSlotSelect) {
      this.pipSlotSelect.value = slotIndex.toString();
    }
  }

  enterShortformTab() {
    if (!this._inShortformSuspend) {
      this._inShortformSuspend = true;
      this.slots.forEach(s => {
        if (!s || !s.active) return;
        if (s.videoEl) {
          s._preShortformWasPlaying = !s.videoEl.paused;
          try { s.videoEl.pause(); } catch (_) {}
        } else if (s.type === 'youtube' && s.iframeEl && s.iframeEl.contentWindow) {
          s._preShortformWasPlaying = Boolean(s.isPlaying);
          try {
            s.iframeEl.contentWindow.postMessage({ action: 'pause', slotIndex: s.index }, '*');
          } catch (_) {}
        }
      });
    }
    this.syncShortformPiP();
  }

  leaveShortformTab(nextTabName) {
    this._inShortformSuspend = false;
    const masterChzzkVol = (window.app && typeof window.app.masterChzzkVolume === 'number') ? window.app.masterChzzkVolume : 1.0;
    const masterChzzkMuted = window.app ? Boolean(window.app.masterChzzkMuted) : false;

    this.slots.forEach(s => {
      if (!s || !s.active) return;
      if (s.type === 'live') {
        s.isPlaying = true;
        if (s.videoEl) {
          const effMuted = Boolean(s.muted || masterChzzkMuted);
          s.videoEl.muted = effMuted;
          s.videoEl.volume = effMuted ? 0 : Math.max(0, Math.min(1, s.volume * masterChzzkVol));
          if (s.hls && typeof s.hls.liveSyncPosition === 'number' && s.hls.liveSyncPosition > 0) {
            if ((s.hls.liveSyncPosition - (s.videoEl.currentTime || 0)) > 2.5) {
              try { s.videoEl.currentTime = s.hls.liveSyncPosition; } catch (_) {}
            }
          }
          s.videoEl.play().catch(() => {});
        }
        const playBtn = document.getElementById(`slot-play-btn-${s.index}`);
        if (playBtn && typeof ICONS !== 'undefined') {
          playBtn.innerHTML = ICONS.pause;
        }
      } else {
        // 비-라이브 슬롯(다시보기/클립/유튜브)은 클립·쇼츠 이탈 후에도 일시정지 상태 유지
        s.isPlaying = false;
        if (s.videoEl && !s.videoEl.paused) {
          try { s.videoEl.pause(); } catch (_) {}
        } else if (s.type === 'youtube' && s.iframeEl && s.iframeEl.contentWindow) {
          try {
            s.iframeEl.contentWindow.postMessage({ action: 'pause', slotIndex: s.index }, '*');
          } catch (_) {}
        }
        const playBtn = document.getElementById(`slot-play-btn-${s.index}`);
        if (playBtn && typeof ICONS !== 'undefined') {
          playBtn.innerHTML = ICONS.play;
        }
      }
    });

    if (nextTabName === 'multiview') {
      this.onEnterMultiviewTab();
    } else {
      this.onLeaveMultiviewTab();
    }
  }

  syncShortformPiP() {
    if (!this._inShortformSuspend) return;
    if (this.isPiPClosedByUser) {
      this.hidePiP();
      return;
    }
    const isMobileUI = (window.app && typeof window.app.isMobileUIMode === 'function')
      ? window.app.isMobileUIMode()
      : (window.innerWidth <= 960);
    const isMobilePortrait = isMobileUI && window.innerHeight > window.innerWidth;
    if (isMobilePortrait) {
      // 모바일 세로 화면에서만 멀티뷰 PiP 미표시 (데스크톱/태블릿 가로에서는 PiP 허용)
      this.hidePiP();
      return;
    }
    const activeSlots = this.slots.filter(s => s.active && (s.videoEl || s.iframeEl));
    if (activeSlots.length === 0) {
      this.hidePiP();
      return;
    }
    const unmuted = activeSlots.filter(s => !s.muted).sort((a, b) => a.index - b.index);
    const target = unmuted.length > 0 ? unmuted[0] : activeSlots.sort((a, b) => a.index - b.index)[0];
    if (this.pipMiniPlayer) {
      this.pipMiniPlayer.classList.add('pip-shortform-landscape');
      const isDesktopYt = Boolean(!isMobileUI && window.innerWidth > 960 && window.app && window.app.currentTab === 'youtube');
      this.pipMiniPlayer.classList.toggle('pip-yt-sidebar-offset', isDesktopYt);
    }
    this.showPiP(target);
  }

  onEnterMultiviewTab() {
    this.isPiPClosedByUser = false;
    this.hidePiP();
  }

  onLeaveMultiviewTab() {
    if (this._inShortformSuspend) {
      this.syncShortformPiP();
      return;
    }
    if (this.isPiPClosedByUser) return;

    const activeSlots = this.slots.filter(s => s.active && (s.videoEl || s.iframeEl));
    if (activeSlots.length === 0) {
      this.hidePiP();
      return;
    }

    // Priority:
    // 1. Unmuted slot with lowest slot index
    // 2. Otherwise, lowest slot index
    const unmuted = activeSlots.filter(s => !s.muted).sort((a, b) => a.index - b.index);
    const target = unmuted.length > 0 ? unmuted[0] : activeSlots.sort((a, b) => a.index - b.index)[0];

    this.showPiP(target);
  }

  showPiP(targetSlot) {
    const targetMedia = targetSlot ? (targetSlot.videoEl || targetSlot.iframeEl) : null;
    if (!targetSlot || !targetMedia) {
      this.hidePiP();
      return;
    }

    const pipEl = this.pipMiniPlayer;
    const pipBody = this.pipVideoBody;
    if (!pipEl || !pipBody) return;

    this.updatePiPSlotOptions();

    // If changing active slot, return old one
    if (this.pipActiveSlot && this.pipActiveSlot !== targetSlot) {
      if (this.pipActiveSlot.type === 'youtube' && this.pipActiveSlot.iframeEl) {
        this.restorePiPIframeToSlot(this.pipActiveSlot);
      } else {
        const prevMedia = this.pipActiveSlot.videoEl;
        if (prevMedia) {
          const prevSlotEl = this.pipActiveSlot.slotEl || document.getElementById(`slot-${this.pipActiveSlot.index}`);
          if (prevSlotEl) {
            const vContainer = prevSlotEl.querySelector('.video-container');
            if (vContainer && prevMedia.parentElement !== vContainer) {
              vContainer.appendChild(prevMedia);
            }
          }
        }
      }
    }

    this.pipActiveSlot = targetSlot;
    pipEl.style.display = 'flex';

    if (targetSlot.type === 'youtube' && targetSlot.iframeEl) {
      this.syncPiPIframePosition();
      requestAnimationFrame(() => this.syncPiPIframePosition());
    } else if (targetSlot.videoEl && targetSlot.videoEl.parentElement !== pipBody) {
      pipBody.appendChild(targetSlot.videoEl);
    }

    if (this.pipMuteBtn) {
      this.pipMuteBtn.innerHTML = targetSlot.muted ? ICONS.volumeMute : ICONS.volumeUp;
    }

    if (this.pipSlotSelect) {
      this.pipSlotSelect.value = targetSlot.index.toString();
    }
  }

  hidePiP() {
    if (this.pipActiveSlot) {
      if (this.pipActiveSlot.type === 'youtube' && this.pipActiveSlot.iframeEl) {
        this.restorePiPIframeToSlot(this.pipActiveSlot);
      } else {
        const prevMedia = this.pipActiveSlot.videoEl;
        if (prevMedia) {
          const prevSlotEl = this.pipActiveSlot.slotEl || document.getElementById(`slot-${this.pipActiveSlot.index}`);
          if (prevSlotEl) {
            const vContainer = prevSlotEl.querySelector('.video-container');
            if (vContainer && prevMedia.parentElement !== vContainer) {
              vContainer.appendChild(prevMedia);
            }
          }
        }
      }
    }
    this.pipActiveSlot = null;

    if (this.pipMiniPlayer) {
      this.pipMiniPlayer.classList.remove('pip-shortform-landscape');
      this.pipMiniPlayer.classList.remove('pip-yt-sidebar-offset');
      this.pipMiniPlayer.style.display = 'none';
    }
  }

  togglePiPMute() {
    if (!this.pipActiveSlot) return;
    this.toggleMute(this.pipActiveSlot.index);
    if (this.pipMuteBtn) {
      this.pipMuteBtn.innerHTML = this.pipActiveSlot.muted ? ICONS.volumeMute : ICONS.volumeUp;
    }
    this.updatePiPSlotOptions();
  }

  // ================= In-Slot Live Recording =================
  async startRecordingSlot(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot || !slot.active) return;

    if (slot.type !== 'live') {
      if (window.app) window.app.showToast('실시간 생방송만 원본 녹화가 가능합니다. (VOD/클립은 다운로드 기능 이용)', 'warning');
      return;
    }

    if (slot.recordJobId || slot._isStartingRecord) {
      if (window.app) window.app.showToast(`'${slot.channelName}' 방송은 이미 녹화 중입니다.`, 'info');
      return;
    }

    slot._isStartingRecord = true;
    if (window.app) window.app.showToast(`'${slot.channelName}' 녹화 시작 중...`, 'info');
    try {
      const res = await fetch('/api/recorder/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_id: slot.channelId,
          channel_name: slot.channelName,
          title: slot.title,
          quality_name: 'Original',
          stream_url: slot.hlsUrl || slot.streamUrl
        })
      });
      const data = await res.json();
      if (data.success && data.job) {
        if (data.job.status === 'error') {
          if (window.app) window.app.showToast(`녹화 시작 실패: ${data.job.errorMessage || '스트림 접근 불가'}`, 'error');
          return;
        }
        slot.recordJobId = data.job.jobId || data.job.job_id || data.job_id;
        slot.recordStatus = data.job.status || 'recording';
        this.updateSlotRecordUI(slotIndex);
        if (window.recorderUI) window.recorderUI.loadJobs();
        if (window.app) window.app.showToast(`'${slot.channelName}' 실시간 녹화 시작! (슬롯에서 제어 가능)`, 'success');
      } else if (data.alreadyRecording && data.job) {
        slot.recordJobId = data.job.jobId || data.job.job_id || data.job_id;
        slot.recordStatus = data.job.status || 'recording';
        this.updateSlotRecordUI(slotIndex);
        if (window.recorderUI) window.recorderUI.loadJobs();
        if (window.app) window.app.showToast(data.error || '이미 해당 방송을 녹화 중입니다.', 'info');
      } else {
        if (window.app) window.app.showToast(data.error || '녹화 시작 요청 실패', 'error');
      }
    } catch (err) {
      console.error(err);
      if (window.app) window.app.showToast('녹화 시작 오류', 'error');
    } finally {
      slot._isStartingRecord = false;
    }
  }

  async pauseRecordingSlot(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot || !slot.recordJobId) return;

    try {
      await fetch(`/api/recorder/pause/${slot.recordJobId}`, { method: 'POST' });
      slot.recordStatus = 'paused';
      this.updateSlotRecordUI(slotIndex);
      if (window.recorderUI) window.recorderUI.loadJobs();
      if (window.app) window.app.showToast(`❚❚ '${slot.channelName}' 녹화가 일시정지되었습니다.`, 'info');
    } catch (e) {
      console.error(e);
    }
  }

  async resumeRecordingSlot(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot || !slot.recordJobId) return;

    try {
      await fetch(`/api/recorder/resume/${slot.recordJobId}`, { method: 'POST' });
      slot.recordStatus = 'recording';
      this.updateSlotRecordUI(slotIndex);
      if (window.recorderUI) window.recorderUI.loadJobs();
      if (window.app) window.app.showToast(`▶ '${slot.channelName}' 녹화가 재개되었습니다.`, 'success');
    } catch (e) {
      console.error(e);
    }
  }

  async stopRecordingSlot(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot || !slot.recordJobId) return;

    const jid = slot.recordJobId;
    const name = slot.channelName;
    slot.recordJobId = null;
    slot.recordStatus = null;
    this.updateSlotRecordUI(slotIndex);

    if (window.app) window.app.showToast(`⏹ '${name}' 녹화를 종료하고 MP4로 저장 중입니다...`, 'info');
    try {
      await fetch(`/api/recorder/stop/${jid}`, { method: 'POST' });
      if (window.recorderUI) {
        window.recorderUI.loadJobs();
        window.recorderUI.loadRecordings();
      }
      setTimeout(() => {
        if (window.app) window.app.showToast(`'${name}' 녹화 완료! [녹화] 탭에서 확인하세요.`, 'success');
      }, 1500);
    } catch (e) {
      console.error(e);
    }
  }

  updateSlotRecordUI(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot || !slot.active) return;

    const recGroup = document.getElementById(`slot-rec-group-${slotIndex}`);
    if (recGroup) {
      let recordBtnHtml = '';
      if (!slot.recordJobId) {
        recordBtnHtml = `<button class="slot-ctrl-btn" onclick="window.multiview.startRecordingSlot(${slotIndex})" title="[원본 녹화] 실시간 원본 신호 녹화">${ICONS.recordDot}</button>`;
      } else if (slot.recordStatus === 'recording') {
        recordBtnHtml = `
          <div class="slot-record-indicator">● 원본 녹화 중</div>
          <button class="slot-ctrl-btn" onclick="window.multiview.pauseRecordingSlot(${slotIndex})" title="녹화 일시정지">${ICONS.recordPause}</button>
          <button class="slot-ctrl-btn" onclick="window.multiview.stopRecordingSlot(${slotIndex})" title="녹화 종료">${ICONS.recordStop}</button>
        `;
      } else if (slot.recordStatus === 'paused') {
        recordBtnHtml = `
          <div class="slot-record-indicator paused">❚❚ 일시정지</div>
          <button class="slot-ctrl-btn" onclick="window.multiview.resumeRecordingSlot(${slotIndex})" title="녹화 재개">${ICONS.recordResume}</button>
          <button class="slot-ctrl-btn" onclick="window.multiview.stopRecordingSlot(${slotIndex})" title="녹화 종료">${ICONS.recordStop}</button>
        `;
      }
      recGroup.innerHTML = recordBtnHtml;
    }

    const screenRecGroup = document.getElementById(`slot-screen-rec-group-${slotIndex}`);
    if (screenRecGroup) {
      let screenRecBtnHtml = '';
      if (slot.isScreenRecording) {
        screenRecBtnHtml = `
          <button class="slot-screen-indicator" onclick="window.multiview.stopScreenRecording(${slotIndex})" title="화면 녹화 중지 (클릭 시 MP4로 자동 저장)">
            ${ICONS.screenRecord} 화면 녹화 중: ${slot.screenRecSecs || 0}s
          </button>
        `;
      } else {
        screenRecBtnHtml = `
          <button class="slot-ctrl-btn" onclick="window.multiview.startScreenRecording(${slotIndex})" title="[화면 녹화] 현재 슬롯 화면 녹화 (되돌려본 30초 전 화면 그대로 녹화)">
            ${ICONS.screenRecord}
          </button>
        `;
      }
      screenRecGroup.innerHTML = screenRecBtnHtml;
    }
  }

  async refreshSlotViewerCounts() {
    // Snapshot active live slots (excluding clips and VODs - Fix Request 4)
    const liveSlots = this.slots.filter(s => s && s.active && s.type === 'live' && s.channelId);
    for (const slot of liveSlots) {
      try {
        const res = await fetch(`/api/live/${slot.channelId}`);
        const data = await res.json();
        if (data && data.isOnline === false) {
          const chName = slot.channelName || '스트리머';
          this.sendDiagnosticLog('STREAM_END', 'AUTO_CLOSE', `Broadcast ended for ${chName}. Auto-closing slot.`, slot.index, chName);
          if (window.app) window.app.showToast(`'${chName}' 방송이 종료되어 멀티뷰 슬롯에서 자동으로 닫혔습니다.`, 'info');
          this.closeSlot(slot.index);
          continue;
        }
        if (data && data.success && data.userCount != null) {
          slot.userCount = data.userCount;
          const el = document.getElementById(`slot-user-count-${slot.index}`);
          if (el) {
            el.textContent = `👤 ${Number(data.userCount).toLocaleString()}명`;
            el.style.display = 'inline-flex';
          }
        }
      } catch (_) {}
    }
  }

  updateBadge() {
    const activeCount = this.slots.filter(s => s.active).length;
    if (this.multiviewBadge) {
      this.multiviewBadge.textContent = `${activeCount}/${this.slotCount}`;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.multiview = new MultiViewManager();
});
