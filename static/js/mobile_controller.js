/**
 * 더치지직 (The Chzzk) 고도화 모바일 컨트롤러
 * 1. 1분할 / 2분할 / 4분할 (2x2 격자) 실시간 동시 스트리밍 완벽 지원
 * 2. 가로 모드 / 태블릿 / 폴더블 대화면 반응형 대응
 * 3. 실제 네이버 클립 MP4 고화질 재생 및 세로 스와이프 제어
 * 4. 인앱 미니 PIP & 안드로이드 시스템 PIP 연동
 * 5. 슬롯 롱프레스 드래그 앤 드롭 위치 변경
 * 6. 실시간 채팅 바텀시트 / 사이드 드로어 팝업
 */

class MobileAppController {
  constructor() {
    this.currentTab = 'home';
    this.currentYtSubTab = 'recom';
    this.isRadioMode = false;
    this.splitMode = 1;
    this.cachedLives = [];
    this.cachedYtVideos = [];
    this.activeSlots = {
      1: { channelId: null, channelName: '', type: 'chzzk', videoId: null, hls: null, videoEl: null, ytIframeEl: null, isMuted: false, hudTimer: null },
      2: { channelId: null, channelName: '', type: 'chzzk', videoId: null, hls: null, videoEl: null, ytIframeEl: null, isMuted: true, hudTimer: null },
      3: { channelId: null, channelName: '', type: 'chzzk', videoId: null, hls: null, videoEl: null, ytIframeEl: null, isMuted: true, hudTimer: null },
      4: { channelId: null, channelName: '', type: 'chzzk', videoId: null, hls: null, videoEl: null, ytIframeEl: null, isMuted: true, hudTimer: null }
    };
    this.featuredLive = null;
    this.clipsLoaded = false;
    this.pipHls = null;
    this.slot1HlsUrl = null;
    this.shortsObserver = null;
    this.savedSlotMuteStates = null;
    this.targetPickerSlot = 1;
    this.justSwapped = false;

    // YouTube comments & related
    this.commentFontSize = 14;
    this.currentCommentVideoId = null;
    this.commentsContinuation = null;
    this.isLoadingComments = false;

    // Web MediaRecorder state
    this.webMediaRecorder = null;
    this.webRecChunks = [];
    this.webRecTimerInterval = null;
    this.webRecStartTime = null;
    this.webRecTargetSlot = 1;

    // Web Video Cutter state
    this.cutterFile = null;
    this.cutterStartTime = 0;
    this.cutterEndTime = 0;
    this.cutterVideo = null;
    this.isExportingCut = false;

    this.init();
  }

  init() {
    for (let i = 1; i <= 4; i++) {
      this.activeSlots[i].videoEl = document.getElementById(`slotVideo${i}`);
      this.activeSlots[i].ytIframeEl = document.getElementById(`slotYtIframe${i}`);
      const emptyEl = document.getElementById(`slot${i}Empty`);
      if (emptyEl) emptyEl.style.display = 'flex';
      this.bindSlotSeekbar(i);
      this.setupSlotIdleAutoHide(i);
    }

    // Force hide radio indicators and extra slots initially
    const radioScreen = document.getElementById('radioModeScreen');
    if (radioScreen) {
      radioScreen.classList.add('hidden');
      radioScreen.style.display = 'none';
    }
    const radioBadge = document.getElementById('statusRadioIndicator');
    if (radioBadge) {
      radioBadge.classList.add('hidden');
      radioBadge.style.display = 'none';
    }
    for (let i = 1; i <= 4; i++) {
      this.hideSlotLoading(i);
      const card = document.getElementById(`slotCard${i}`);
      if (card && i > 1) {
        card.classList.add('hidden');
        card.style.display = 'none';
      }
    }

    // Initialize Slot Touch Drag & Swap
    this.setupSlotDragAndDrop();

    // Initial Live List Fetch (No autoplay)
    this.fetchAndRenderLives();

    // Register Service Worker for PWA / iOS Web
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(err => {
        console.warn('ServiceWorker 등록 생략:', err);
      });
    }
  }

  showSlotLoading(idx) {
    const el = document.getElementById(`slot${idx}Loading`);
    if (el) {
      el.classList.remove('hidden');
      el.style.display = 'flex';
      el.style.opacity = '1';
      el.style.visibility = 'visible';
    }
  }

  hideSlotLoading(idx) {
    const el = document.getElementById(`slot${idx}Loading`);
    if (el) {
      el.classList.add('hidden');
      el.style.display = 'none';
      el.style.opacity = '0';
      el.style.visibility = 'hidden';
    }
  }

  // ================= 슬롯 3초 유휴 자동 숨김 & 터치 HUD =================
  setupSlotIdleAutoHide(idx) {
    const card = document.getElementById(`slotCard${idx}`);
    if (!card) return;
    card.addEventListener('pointerdown', () => this.touchSlotHud(idx));
    card.addEventListener('pointermove', () => this.touchSlotHud(idx));
  }

  touchSlotHud(idx) {
    const bar = document.getElementById(`slotBar${idx}`);
    if (!bar) return;
    bar.classList.remove('hud-hidden');

    if (this.activeSlots[idx].hudTimer) {
      clearTimeout(this.activeSlots[idx].hudTimer);
    }
    this.activeSlots[idx].hudTimer = setTimeout(() => {
      bar.classList.add('hud-hidden');
    }, 3000);
  }

  // ================= 슬롯 재생바 및 시간 동기화 =================
  bindSlotSeekbar(idx) {
    const video = this.activeSlots[idx].videoEl;
    if (!video) return;

    video.addEventListener('timeupdate', () => {
      const seekbar = document.getElementById(`slotSeekbar${idx}`);
      const timeText = document.getElementById(`slotTime${idx}`);
      if (!seekbar || !timeText) return;

      const cur = video.currentTime || 0;
      const dur = video.duration || 0;

      if (dur > 0 && isFinite(dur)) {
        seekbar.value = (cur / dur) * 100;
        timeText.innerText = `${this.formatTime(cur)} / ${this.formatTime(dur)}`;
      } else {
        timeText.innerText = `${this.formatTime(cur)} (LIVE)`;
      }
    });
  }

  onSlotSeek(idx, val) {
    const slot = this.activeSlots[idx];
    if (slot.type === 'chzzk' && slot.videoEl && slot.videoEl.duration) {
      slot.videoEl.currentTime = (val / 100) * slot.videoEl.duration;
    } else if (slot.type === 'youtube' && slot.ytIframeEl) {
      // YouTube Iframe API PostMessage
      try {
        slot.ytIframeEl.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: 'seekTo',
          args: [(val / 100) * 100, true]
        }), '*');
      } catch (e) {}
    }
    this.touchSlotHud(idx);
  }

  toggleSlotPlay(idx) {
    const slot = this.activeSlots[idx];
    const btn = document.getElementById(`slot${idx}PlayBtn`);
    if (slot.type === 'chzzk' && slot.videoEl) {
      if (slot.videoEl.paused) {
        slot.videoEl.play().catch(() => {});
        if (btn) btn.innerHTML = `<svg class="icon-xs" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
      } else {
        slot.videoEl.pause();
        if (btn) btn.innerHTML = `<svg class="icon-xs" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
      }
    }
    this.touchSlotHud(idx);
  }

  rewindSlot10s(idx) {
    const slot = this.activeSlots[idx];
    if (slot.type === 'chzzk' && slot.videoEl) {
      slot.videoEl.currentTime = Math.max(0, slot.videoEl.currentTime - 10);
    }
    this.touchSlotHud(idx);
  }

  reconnectSlot(idx) {
    const slot = this.activeSlots[idx];
    if (!slot.channelId) return;

    if (slot.type === 'youtube') {
      const vid = slot.videoId;
      if (vid) this.playYouTubeInSlot(vid, slot.channelName, '', idx, false);
    } else {
      const chId = slot.channelId;
      const chName = slot.channelName;
      this.closeSlotStream(idx);
      this.playLiveStream(chId, chName, idx, false);
    }
    this.touchSlotHud(idx);
  }

  formatTime(sec) {
    if (!sec || isNaN(sec)) return '00:00';
    const s = Math.floor(sec);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  }

  // ================= 유튜브 영상 슬롯 재생 =================
  playYouTubeInSlot(videoId, title, channelTitle, slotIdx = 1, autoSwitch = true) {
    const slot = this.activeSlots[slotIdx];
    slot.type = 'youtube';
    slot.videoId = videoId;
    slot.channelId = 'yt_' + videoId;
    slot.channelName = title || '유튜브 영상';

    // 치지직 비디오 정지 및 숨김
    if (slot.hls) {
      slot.hls.destroy();
      slot.hls = null;
    }
    if (slot.videoEl) {
      slot.videoEl.pause();
      slot.videoEl.style.display = 'none';
    }

    // 유튜브 iframe 표시 및 재생
    if (slot.ytIframeEl) {
      slot.ytIframeEl.style.display = 'block';
      slot.ytIframeEl.classList.remove('hidden');
      slot.ytIframeEl.src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&origin=${encodeURIComponent(window.location.origin)}`;
    }

    const nameEl = document.getElementById(`slot${slotIdx}Name`);
    if (nameEl) nameEl.innerText = title;

    const hudTitle = document.getElementById(`slot${slotIdx}HudTitle`);
    if (hudTitle) hudTitle.innerText = title;

    const emptyEl = document.getElementById(`slot${slotIdx}Empty`);
    if (emptyEl) emptyEl.style.display = 'none';

    // 관련 영상 버튼 노출
    const relatedBtn = document.getElementById(`slot${slotIdx}RelatedBtn`);
    if (relatedBtn) relatedBtn.classList.remove('hidden');

    if (autoSwitch) {
      this.switchTab('multiview');
    }
    this.touchSlotHud(slotIdx);
  }

  // ================= 1. 실시간 라이브 목록 불러오기 =================
  async fetchAndRenderLives() {
    const container = document.getElementById('liveStreamListContainer');
    try {
      const lives = await window.chzzkEngine.getLiveStreams(50);
      this.cachedLives = lives || [];

      if (!lives || lives.length === 0) {
        if (container) container.innerHTML = '<div class="loading-state">실시간 방송 목록을 불러오지 못했습니다. 상단 새로고침을 눌러주세요.</div>';
        return;
      }

      const countEl = document.getElementById('liveCountText');
      if (countEl) countEl.innerText = `총 ${lives.length}개 방송 온에어`;

      // 1위 방송을 피처드 배너에 로드 (재생은 하지 않음)
      this.featuredLive = lives[0];
      this.renderFeaturedLive(this.featuredLive);

      // 피드 카드 렌더링
      this.renderLiveCards(lives);

      // (사용자 요청 1) 앱 실행 시 자동 재생하지 않음
    } catch (e) {
      console.error(e);
      if (container) container.innerHTML = '<div class="loading-state">방송 목록 로딩 중 에러가 발생했습니다.</div>';
    }
  }

  renderFeaturedLive(live) {
    if (!live) return;
    const thumb = document.getElementById('featuredThumb');
    const avatar = document.getElementById('featuredAvatar');
    const name = document.getElementById('featuredName');
    const title = document.getElementById('featuredTitle');
    const viewers = document.getElementById('featuredViewers');

    if (thumb) thumb.src = live.liveImageUrl || live.defaultThumbnail;
    if (avatar) avatar.src = live.channelImageUrl;
    if (name) name.innerText = live.channelName;
    if (title) title.innerText = live.liveTitle;
    if (viewers) viewers.innerText = `${Number(live.concurrentUserCount || 0).toLocaleString()}명`;
  }

  renderLiveCards(list) {
    const container = document.getElementById('liveStreamListContainer');
    if (!container) return;
    container.innerHTML = '';

    list.forEach(stream => {
      const card = document.createElement('div');
      card.className = 'live-card';
      const safeName = (stream.channelName || '').replace(/'/g, '');
      card.onclick = () => this.playLiveStream(stream.channelId, safeName, 1, true);

      const thumb = stream.liveImageUrl || stream.defaultThumbnail;
      const countStr = Number(stream.concurrentUserCount || 0).toLocaleString();

      card.innerHTML = `
        <div class="live-thumb-box">
          <img src="${thumb}" class="live-thumb-img" alt="${safeName}">
          <span class="live-thumb-badge">LIVE</span>
        </div>
        <div class="live-card-body">
          <div class="live-card-title one-line">${stream.liveTitle}</div>
          <div class="live-card-meta one-line">
            <span>${safeName}</span>
            <span>·</span>
            <span class="viewers-highlight">${countStr}명</span>
          </div>
          <span class="category-tag">${stream.liveCategoryValue}</span>
        </div>
        <button onclick="event.stopPropagation(); window.appController.loadToSecondarySlot('${stream.channelId}', '${safeName}')" class="btn-card-play" title="멀티뷰 슬롯에 추가">
          <svg class="icon-sm" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      `;
      container.appendChild(card);
    });
  }

  filterLives() {
    const input = document.getElementById('homeSearchInput');
    if (!input) return;
    const q = input.value.toLowerCase().trim();
    if (!q) {
      this.renderLiveCards(this.cachedLives);
      return;
    }
    const filtered = this.cachedLives.filter(l =>
      (l.channelName && l.channelName.toLowerCase().includes(q)) ||
      (l.liveTitle && l.liveTitle.toLowerCase().includes(q)) ||
      (l.liveCategoryValue && l.liveCategoryValue.toLowerCase().includes(q))
    );
    this.renderLiveCards(filtered);
  }

  selectCategory(cat) {
    document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
    if (window.event && window.event.target) {
      window.event.target.classList.add('active');
    }

    if (!cat) {
      this.renderLiveCards(this.cachedLives);
    } else {
      const filtered = this.cachedLives.filter(l => l.liveCategoryValue && l.liveCategoryValue.includes(cat));
      this.renderLiveCards(filtered);
    }
  }

  playFeaturedStream() {
    if (this.featuredLive) {
      this.playLiveStream(this.featuredLive.channelId, this.featuredLive.channelName, 1, true);
    }
  }

  // ================= 2. 실제 HLS 스트림 연결 로직 =================
  async playLiveStream(channelId, channelName, slotIdx = 1, shouldSwitchTab = true) {
    const slot = this.activeSlots[slotIdx];
    const nameEl = document.getElementById(`slot${slotIdx}Name`);
    const hudTitleEl = document.getElementById(`slot${slotIdx}HudTitle`);

    if (nameEl) nameEl.innerText = channelName;
    if (hudTitleEl) hudTitleEl.innerText = `${channelName} 생방송`;
    this.showSlotLoading(slotIdx);

    const emptyEl = document.getElementById(`slot${slotIdx}Empty`);
    if (emptyEl) emptyEl.style.display = 'none';

    slot.channelId = channelId;
    slot.channelName = channelName;

    if (shouldSwitchTab) {
      this.switchTab('multiview');
    }

    // Failsafe timer: overlay must disappear within 3.5 seconds
    const safetyTimeout = setTimeout(() => {
      this.hideSlotLoading(slotIdx);
      if (emptyEl) emptyEl.style.display = 'none';
    }, 3500);

    try {
      const detail = await window.chzzkEngine.getLiveDetail(channelId);
      if (!detail || !detail.masterHlsUrl) {
        clearTimeout(safetyTimeout);
        this.hideSlotLoading(slotIdx);
        return;
      }

      if (slot.hls) {
        slot.hls.destroy();
        slot.hls = null;
      }

      const video = slot.videoEl;
      const hlsUrl = detail.masterHlsUrl;

      if (slotIdx === 1) {
        this.slot1HlsUrl = hlsUrl;
      }

      video.playsInline = true;
      video.autoplay = true;

      const onVideoStarted = () => {
        clearTimeout(safetyTimeout);
        this.hideSlotLoading(slotIdx);
        if (emptyEl) emptyEl.style.display = 'none';
      };

      video.onplaying = onVideoStarted;
      video.onloadeddata = onVideoStarted;
      video.oncanplay = onVideoStarted;
      video.ontimeupdate = () => {
        if (video.currentTime > 0) onVideoStarted();
      };

      if (window.Hls && window.Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 30,
          maxBufferLength: 15,
          maxMaxBufferLength: 30,
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: 6,
          liveDurationInfinity: true
        });

        slot.hls = hls;
        hls.loadSource(hlsUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {
            video.muted = true;
            slot.isMuted = true;
            const audioBtn = document.getElementById(`slot${slotIdx}AudioBtn`);
            if (audioBtn) {
              audioBtn.innerHTML = `<svg class="icon-xs" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;
            }
            video.play().catch(() => {});
          });
        });

        hls.on(Hls.Events.FRAG_LOADED, onVideoStarted);
        hls.on(Hls.Events.LEVEL_LOADED, onVideoStarted);

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                video.src = hlsUrl;
                video.play().catch(() => {});
                break;
            }
          }
        });
      } else {
        video.src = hlsUrl;
        video.play().catch(() => {
          video.muted = true;
          video.play().catch(() => {});
        });
      }

      // Sync with Mini PIP
      const pipName = document.getElementById('pipStreamerName');
      if (pipName && slotIdx === 1) pipName.innerText = channelName;

      const studioTarget = document.getElementById('studioTargetStream');
      if (studioTarget && slotIdx === 1) studioTarget.innerText = `${channelName} (온에어)`;

    } catch (err) {
      console.error("playLiveStream error:", err);
      clearTimeout(safetyTimeout);
      this.hideSlotLoading(slotIdx);
    }
  }

  loadToSecondarySlot(channelId, channelName) {
    let targetSlot = 2;
    if (this.splitMode === 4) {
      for (let i = 2; i <= 4; i++) {
        if (!this.activeSlots[i].channelId) {
          targetSlot = i;
          break;
        }
      }
    } else {
      this.setSplitMode(2);
    }
    this.playLiveStream(channelId, channelName, targetSlot, true);
  }

  // ================= 3. 멀티뷰 분할 (1분할 / 2분할 / 4분할 격자) =================
  setSplitMode(mode) {
    this.splitMode = mode;
    const container = document.getElementById('videoSlotsContainer');
    const badge = document.getElementById('multiviewSplitBadge');
    const b1 = document.getElementById('btnSplit1');
    const b2 = document.getElementById('btnSplit2');
    const b4 = document.getElementById('btnSplit4');

    const s2 = document.getElementById('slotCard2');
    const s3 = document.getElementById('slotCard3');
    const s4 = document.getElementById('slotCard4');

    [b1, b2, b4].forEach(b => { if (b) b.classList.remove('active'); });

    if (container) container.className = `video-slots-container split-${mode}`;

    if (mode === 1) {
      if (s2) { s2.classList.add('hidden'); s2.style.display = 'none'; }
      if (s3) { s3.classList.add('hidden'); s3.style.display = 'none'; }
      if (s4) { s4.classList.add('hidden'); s4.style.display = 'none'; }
      if (badge) badge.innerText = "단일 모드";
      if (b1) b1.classList.add('active');
    } else if (mode === 2) {
      if (s2) { s2.classList.remove('hidden'); s2.style.display = 'block'; }
      if (s3) { s3.classList.add('hidden'); s3.style.display = 'none'; }
      if (s4) { s4.classList.add('hidden'); s4.style.display = 'none'; }
      if (badge) badge.innerText = "2분할 모드";
      if (b2) b2.classList.add('active');
      // (사용자 요청 2) 2분할 시 자동으로 임의 방송을 채우지 않음 (빈 슬롯 유지)
    } else if (mode === 4) {
      if (s2) { s2.classList.remove('hidden'); s2.style.display = 'block'; }
      if (s3) { s3.classList.remove('hidden'); s3.style.display = 'block'; }
      if (s4) { s4.classList.remove('hidden'); s4.style.display = 'block'; }
      if (badge) badge.innerText = "4분할 격자 (2x2)";
      if (b4) b4.classList.add('active');
      // (사용자 요청 2) 4분할 시 자동으로 임의 방송을 채우지 않음 (빈 슬롯 유지)
    }
  }

  toggleSlotHud(slotIdx) {
    if (this.justSwapped) return;
    const hud = document.getElementById(`slot${slotIdx}Hud`);
    if (!hud) return;
    if (hud.classList.contains('visible')) {
      hud.classList.remove('visible');
    } else {
      hud.classList.add('visible');
      setTimeout(() => hud.classList.remove('visible'), 4000);
    }
  }

  toggleSlotAudio(slotIdx) {
    const slot = this.activeSlots[slotIdx];
    const btn = document.getElementById(`slot${slotIdx}AudioBtn`);
    if (!slot || !slot.videoEl) return;

    slot.isMuted = !slot.isMuted;
    slot.videoEl.muted = slot.isMuted;
    if (btn) {
      btn.innerHTML = slot.isMuted
        ? `<svg class="icon-xs" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`
        : `<svg class="icon-xs" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
    }
  }

  activateSlotSolo(slotIdx) {
    for (let i = 1; i <= 4; i++) {
      const slot = this.activeSlots[i];
      const btn = document.getElementById(`slot${i}AudioBtn`);
      if (slot && slot.videoEl) {
        if (i === slotIdx) {
          slot.videoEl.muted = false;
          slot.isMuted = false;
          if (btn) {
            btn.innerHTML = `<svg class="icon-xs" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
          }
        } else {
          slot.videoEl.muted = true;
          slot.isMuted = true;
          if (btn) {
            btn.innerHTML = `<svg class="icon-xs" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;
          }
        }
      }
    }
  }

  closeSlotStream(slotIdx) {
    const slot = this.activeSlots[slotIdx];
    if (!slot) return;

    if (slot.hls) {
      slot.hls.destroy();
      slot.hls = null;
    }
    if (slot.videoEl) {
      slot.videoEl.pause();
      slot.videoEl.src = '';
    }
    slot.channelId = null;
    slot.channelName = '';

    if (slotIdx === 1) {
      this.slot1HlsUrl = null;
      if (this.pipHls) {
        this.pipHls.destroy();
        this.pipHls = null;
      }
    }

    const emptyEl = document.getElementById(`slot${slotIdx}Empty`);
    if (emptyEl) emptyEl.style.display = 'flex';

    const nameEl = document.getElementById(`slot${slotIdx}Name`);
    if (nameEl) nameEl.innerText = '대기 중';

    const hudTitleEl = document.getElementById(`slot${slotIdx}HudTitle`);
    if (hudTitleEl) hudTitleEl.innerText = '방송 없음';

    this.hideSlotLoading(slotIdx);
  }

  toggleSlotFullscreen(slotIdx) {
    const card = document.getElementById(`slotCard${slotIdx}`);
    const slot = this.activeSlots[slotIdx];
    const video = slot ? slot.videoEl : null;
    if (!card) return;

    if (card.classList.contains('pseudo-fullscreen')) {
      card.classList.remove('pseudo-fullscreen');
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } else {
      card.classList.add('pseudo-fullscreen');
      if (video && video.webkitRequestFullscreen) {
        video.webkitRequestFullscreen().catch(() => {});
      } else if (card.requestFullscreen) {
        card.requestFullscreen().catch(() => {});
      }
    }
  }

  changeMasterVolume(val) {
    const ratio = val / 100;
    const label = document.getElementById('masterVolumeLabel');
    if (label) label.innerText = `${val}%`;
    for (let i = 1; i <= 4; i++) {
      if (this.activeSlots[i].videoEl && !this.activeSlots[i].isMuted) {
        this.activeSlots[i].videoEl.volume = ratio;
      }
    }
  }

  // ================= 4. 슬롯 드래그 & 스왑 (롱프레스 & DND) =================
  setupSlotDragAndDrop() {
    const cards = document.querySelectorAll('.slot-card');
    let touchTimer = null;
    let isDragging = false;
    let sourceSlotIdx = null;
    let touchStartPos = { x: 0, y: 0 };
    let currentHoverCard = null;

    cards.forEach(card => {
      const idx = parseInt(card.dataset.slotIdx || '1', 10);

      // Desktop HTML5 Drag & Drop
      card.setAttribute('draggable', 'true');
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', String(idx));
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        document.querySelectorAll('.slot-card').forEach(c => c.classList.remove('drag-hover'));
      });
      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        card.classList.add('drag-hover');
      });
      card.addEventListener('dragleave', () => {
        card.classList.remove('drag-hover');
      });
      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('drag-hover');
        const fromSlot = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (fromSlot && fromSlot !== idx) {
          this.swapSlots(fromSlot, idx);
        }
      });

      // Touch Long-Press Drag & Drop for Mobile
      card.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        sourceSlotIdx = idx;
        isDragging = false;
        currentHoverCard = null;

        touchTimer = setTimeout(() => {
          isDragging = true;
          card.classList.add('dragging');
          if (navigator.vibrate) navigator.vibrate(40);
        }, 350);
      }, { passive: true });

      card.addEventListener('touchmove', (e) => {
        if (!touchTimer && !isDragging) return;
        const moveX = e.touches[0].clientX;
        const moveY = e.touches[0].clientY;
        const dist = Math.hypot(moveX - touchStartPos.x, moveY - touchStartPos.y);

        if (dist > 12 && !isDragging) {
          clearTimeout(touchTimer);
          touchTimer = null;
          return;
        }

        if (isDragging) {
          if (e.cancelable) e.preventDefault();
          const elem = document.elementFromPoint(moveX, moveY);
          const targetCard = elem ? elem.closest('.slot-card') : null;

          if (targetCard && targetCard !== card && targetCard.style.display !== 'none') {
            if (currentHoverCard && currentHoverCard !== targetCard) {
              currentHoverCard.classList.remove('drag-hover');
            }
            currentHoverCard = targetCard;
            targetCard.classList.add('drag-hover');
          } else if (currentHoverCard) {
            currentHoverCard.classList.remove('drag-hover');
            currentHoverCard = null;
          }
        }
      }, { passive: false });

      const handleTouchEnd = (e) => {
        if (touchTimer) {
          clearTimeout(touchTimer);
          touchTimer = null;
        }
        if (isDragging) {
          card.classList.remove('dragging');
          if (currentHoverCard) {
            currentHoverCard.classList.remove('drag-hover');
            const targetIdx = parseInt(currentHoverCard.dataset.slotIdx || '1', 10);
            if (targetIdx && targetIdx !== sourceSlotIdx) {
              this.swapSlots(sourceSlotIdx, targetIdx);
            }
            currentHoverCard = null;
          }
          isDragging = false;
          sourceSlotIdx = null;
          this.justSwapped = true;
          setTimeout(() => { this.justSwapped = false; }, 300);
        }
      };

      card.addEventListener('touchend', handleTouchEnd);
      card.addEventListener('touchcancel', handleTouchEnd);
    });
  }

  async swapSlots(slotA, slotB) {
    if (slotA === slotB) return;
    const sA = this.activeSlots[slotA];
    const sB = this.activeSlots[slotB];
    if (!sA || !sB) return;

    const chA = sA.channelId;
    const nameA = sA.channelName;
    const mutedA = sA.isMuted;

    const chB = sB.channelId;
    const nameB = sB.channelName;
    const mutedB = sB.isMuted;

    // 둘 다 비어있으면 변경할 필요 없음
    if (!chA && !chB) return;

    // 양쪽 슬롯 안전하게 초기화
    this.closeSlotStream(slotA);
    this.closeSlotStream(slotB);

    // 서로 교체하여 재생
    if (chB) {
      await this.playLiveStream(chB, nameB, slotA, false);
      sA.isMuted = mutedB;
      if (sA.videoEl) sA.videoEl.muted = mutedB;
      const btnA = document.getElementById(`slot${slotA}AudioBtn`);
      if (btnA) {
        btnA.innerHTML = mutedB
          ? `<svg class="icon-xs" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`
          : `<svg class="icon-xs" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
      }
    }

    if (chA) {
      await this.playLiveStream(chA, nameA, slotB, false);
      sB.isMuted = mutedA;
      if (sB.videoEl) sB.videoEl.muted = mutedA;
      const btnB = document.getElementById(`slot${slotB}AudioBtn`);
      if (btnB) {
        btnB.innerHTML = mutedA
          ? `<svg class="icon-xs" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`
          : `<svg class="icon-xs" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
      }
    }
  }

  // ================= 5. 실시간 채팅 팝업 드로어 =================
  openSlotChat(slotIdx) {
    const slot = this.activeSlots[slotIdx];
    if (!slot || !slot.channelId) {
      alert(`슬롯 ${slotIdx}에 방송이 연결되어 있지 않습니다.`);
      return;
    }

    const drawer = document.getElementById('slotChatDrawer');
    const title = document.getElementById('chatStreamerName');
    const iframe = document.getElementById('chatIframe');

    if (title) title.innerText = `${slot.channelName} 실시간 채팅`;
    if (iframe) {
      iframe.src = `https://chzzk.naver.com/live/${slot.channelId}/chat`;
    }

    if (drawer) {
      drawer.classList.remove('hidden');
      drawer.style.display = 'block';
    }
  }

  closeChatDrawer() {
    const drawer = document.getElementById('slotChatDrawer');
    const iframe = document.getElementById('chatIframe');
    if (drawer) {
      drawer.classList.add('hidden');
      drawer.style.display = 'none';
    }
    if (iframe) {
      iframe.src = 'about:blank';
    }
  }

  // ================= 6. 슬롯 방송 추가 모달 =================
  openChannelPicker(slotIdx) {
    this.targetPickerSlot = slotIdx;
    const modal = document.getElementById('slotPickerModal');
    const title = document.getElementById('pickerSlotTitle');
    const listContainer = document.getElementById('pickerListContainer');

    if (title) title.innerText = `슬롯 ${slotIdx}에 방송 / 유튜브 추가`;

    if (listContainer) {
      listContainer.innerHTML = '';

      // Header Filter Bar
      const filterBar = document.createElement('div');
      filterBar.className = 'category-chip-bar';
      filterBar.style.marginBottom = '10px';
      filterBar.innerHTML = `
        <button id="pickerTabChzzk" class="cat-chip active" onclick="window.appController.renderPickerChzzk()">치지직 방송</button>
        <button id="pickerTabYt" class="cat-chip" onclick="window.appController.renderPickerYouTube()">유튜브 추천/검색</button>
      `;
      listContainer.appendChild(filterBar);

      const itemsWrap = document.createElement('div');
      itemsWrap.id = 'pickerItemsWrap';
      itemsWrap.className = 'live-stream-list';
      listContainer.appendChild(itemsWrap);

      this.renderPickerChzzk();
    }

    if (modal) {
      modal.classList.remove('hidden');
      modal.style.display = 'block';
    }
  }

  renderPickerChzzk() {
    const wrap = document.getElementById('pickerItemsWrap');
    const tabChzzk = document.getElementById('pickerTabChzzk');
    const tabYt = document.getElementById('pickerTabYt');
    if (tabChzzk) tabChzzk.classList.add('active');
    if (tabYt) tabYt.classList.remove('active');
    if (!wrap) return;
    wrap.innerHTML = '';

    if (!this.cachedLives || this.cachedLives.length === 0) {
      wrap.innerHTML = '<div class="loading-state">실시간 방송 목록이 없습니다. 상단 새로고침을 해주세요.</div>';
      return;
    }

    this.cachedLives.forEach(stream => {
      const item = document.createElement('div');
      item.className = 'live-card';
      item.onclick = () => this.selectChannelForSlot(stream.channelId, stream.channelName);
      const thumb = stream.liveImageUrl || stream.defaultThumbnail;
      const countStr = Number(stream.concurrentUserCount || 0).toLocaleString();

      item.innerHTML = `
        <div class="live-thumb-box">
          <img src="${thumb}" class="live-thumb-img" alt="${stream.channelName}">
          <span class="live-thumb-badge">LIVE</span>
        </div>
        <div class="live-card-body">
          <div class="live-card-title one-line">${stream.liveTitle}</div>
          <div class="live-card-meta one-line">
            <span>${stream.channelName}</span>
            <span>·</span>
            <span class="viewers-highlight">${countStr}명</span>
          </div>
          <span class="category-tag">${stream.liveCategoryValue}</span>
        </div>
        <button class="btn-primary-play">선택</button>
      `;
      wrap.appendChild(item);
    });
  }

  async renderPickerYouTube() {
    const wrap = document.getElementById('pickerItemsWrap');
    const tabChzzk = document.getElementById('pickerTabChzzk');
    const tabYt = document.getElementById('pickerTabYt');
    if (tabChzzk) tabChzzk.classList.remove('active');
    if (tabYt) tabYt.classList.add('active');
    if (!wrap) return;
    wrap.innerHTML = '<div class="loading-state">유튜브 추천 목록을 불러오는 중...</div>';

    try {
      const videos = await window.chzzkClientAPI.getYoutubeRecommendations();
      wrap.innerHTML = '';
      videos.forEach(v => {
        const item = document.createElement('div');
        item.className = 'live-card';
        const vid = v.videoId || v.id;
        const thumb = v.thumbnail || (v.thumbnails && v.thumbnails[0] ? v.thumbnails[0].url : `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`);

        item.onclick = () => {
          this.playYouTubeInSlot(vid, v.title, v.channelTitle, this.targetPickerSlot, false);
          this.closeChannelPicker();
        };

        item.innerHTML = `
          <div class="live-thumb-box">
            <img src="${thumb}" class="live-thumb-img" alt="${v.title}">
            <span class="live-thumb-badge bg-red">YT</span>
          </div>
          <div class="live-card-body">
            <div class="live-card-title one-line">${v.title}</div>
            <div class="live-card-meta one-line">
              <span>${v.channelTitle || 'YouTube'}</span>
              <span>·</span>
              <span>${v.viewCount || ''}</span>
            </div>
          </div>
          <button class="btn-primary-play">선택</button>
        `;
        wrap.appendChild(item);
      });
    } catch (e) {
      wrap.innerHTML = '<div class="loading-state">유튜브 목록을 불러오지 못했습니다.</div>';
    }
  }

  closeChannelPicker() {
    const modal = document.getElementById('slotPickerModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  }

  selectChannelForSlot(channelId, channelName) {
    this.closeChannelPicker();
    this.playLiveStream(channelId, channelName, this.targetPickerSlot, false);
  }

  // ================= 7. 라디오 모드 =================
  toggleRadioMode() {
    this.isRadioMode = !this.isRadioMode;
    const screen = document.getElementById('radioModeScreen');
    const videoSlots = document.getElementById('videoSlotsContainer');
    const badge = document.getElementById('statusRadioIndicator');
    const label = document.getElementById('headerRadioLabel');
    const btn = document.getElementById('headerRadioBtn');

    if (this.isRadioMode) {
      if (screen) {
        screen.classList.remove('hidden');
        screen.style.display = 'flex';
      }
      if (videoSlots) videoSlots.classList.add('audio-only-hidden');
      if (badge) {
        badge.classList.remove('hidden');
        badge.style.display = 'inline-flex';
      }
      if (label) label.innerText = '라디오 ON';
      if (btn) btn.classList.add('active');
    } else {
      if (screen) {
        screen.classList.add('hidden');
        screen.style.display = 'none';
      }
      if (videoSlots) videoSlots.classList.remove('audio-only-hidden');
      if (badge) {
        badge.classList.add('hidden');
        badge.style.display = 'none';
      }
      if (label) label.innerText = '라디오';
      if (btn) btn.classList.remove('active');
    }
  }

  // ================= 8. 탭 이동 및 미니 PIP =================
  switchTab(tabId) {
    if (this.currentTab === tabId) return;

    // 1. 클립 탭에서 벗어날 때 모든 클립 일시정지 (사용자 요청 3)
    if (this.currentTab === 'clips' && tabId !== 'clips') {
      this.pauseAllShorts();
    }

    // 2. 멀티뷰 방송 시청 중 클립 탭 이동 시 멀티뷰 방송 음소거 (사용자 요청 4)
    if (tabId === 'clips') {
      this.savedSlotMuteStates = {
        1: this.activeSlots[1].isMuted,
        2: this.activeSlots[2].isMuted,
        3: this.activeSlots[3].isMuted,
        4: this.activeSlots[4].isMuted
      };
      for (let i = 1; i <= 4; i++) {
        if (this.activeSlots[i].videoEl) {
          this.activeSlots[i].videoEl.muted = true;
        }
      }
    } else if (this.currentTab === 'clips' && this.savedSlotMuteStates) {
      // 클립 탭에서 벗어나 멀티뷰로 돌아올 때 이전 음소거 상태 복원
      for (let i = 1; i <= 4; i++) {
        const slot = this.activeSlots[i];
        slot.isMuted = this.savedSlotMuteStates[i];
        if (slot.videoEl) {
          slot.videoEl.muted = slot.isMuted;
        }
        const audioBtn = document.getElementById(`slot${i}AudioBtn`);
        if (audioBtn) {
          audioBtn.innerHTML = slot.isMuted
            ? `<svg class="icon-xs" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`
            : `<svg class="icon-xs" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
        }
      }
      this.savedSlotMuteStates = null;
    }

    // 3. 인앱 미니 PIP 활성화/비활성화 (사용자 요청 9)
    const miniPip = document.getElementById('inAppMiniPip');
    if (this.currentTab === 'multiview' && tabId !== 'multiview' && this.activeSlots[1].channelId && !this.isRadioMode) {
      if (miniPip) {
        miniPip.classList.remove('hidden');
        miniPip.style.display = 'block';
      }
      if (this.slot1HlsUrl) {
        this.startPipPlayback(this.slot1HlsUrl);
      }
    } else if (tabId === 'multiview') {
      if (miniPip) {
        miniPip.classList.add('hidden');
        miniPip.style.display = 'none';
      }
      if (this.pipHls) {
        this.pipHls.destroy();
        this.pipHls = null;
      }
    }

    // 4. 탭 뷰 전환
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
    const target = document.getElementById('tab-' + tabId);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.nav-button').forEach(b => b.classList.remove('active'));
    const navBtn = document.getElementById('nav-btn-' + tabId);
    if (navBtn) navBtn.classList.add('active');

    this.currentTab = tabId;

    if (tabId === 'youtube') {
      this.initYouTubeTab();
    } else if (tabId === 'studio') {
      this.initStudioTab();
    } else if (tabId === 'follow') {
      this.syncFollowChannels();
    } else if (tabId === 'clips') {
      if (!this.clipsLoaded) {
        this.loadRealClips();
      } else {
        // 첫 번째 보이는 클립 재생 재개
        setTimeout(() => {
          const firstVisible = document.querySelector('#shortsContainer .shorts-card-slide');
          if (firstVisible) {
            const v = firstVisible.querySelector('video');
            if (v) v.play().catch(() => {});
          }
        }, 150);
      }
    }
  }

  startPipPlayback(hlsUrl) {
    const pipVideo = document.getElementById('pipVideoSync');
    if (!pipVideo || !hlsUrl) return;

    if (this.pipHls) {
      this.pipHls.destroy();
      this.pipHls = null;
    }

    pipVideo.muted = true;
    pipVideo.playsInline = true;

    if (window.Hls && window.Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        maxBufferLength: 10,
        liveSyncDurationCount: 3
      });
      this.pipHls = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(pipVideo);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        pipVideo.play().catch(() => {});
      });
    } else {
      pipVideo.src = hlsUrl;
      pipVideo.play().catch(() => {});
    }
  }

  returnToMultiview() {
    this.closeMiniPip();
    this.switchTab('multiview');
  }

  closeMiniPip(e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const pip = document.getElementById('inAppMiniPip');
    if (pip) {
      pip.classList.add('hidden');
      pip.style.display = 'none';
    }
    const pipVideo = document.getElementById('pipVideoSync');
    if (pipVideo) {
      pipVideo.pause();
    }
    if (this.pipHls) {
      this.pipHls.destroy();
      this.pipHls = null;
    }
  }

  // ================= 9. 안드로이드 시스템 PIP 호출 =================
  requestSystemPIP() {
    if (window.AndroidBridge && window.AndroidBridge.enterSystemPip) {
      window.AndroidBridge.enterSystemPip();
      return;
    }
    const v = this.activeSlots[1].videoEl;
    if (v && document.pictureInPictureEnabled) {
      v.requestPictureInPicture().catch(() => {
        alert('시스템 PIP 모드로 전환합니다.');
      });
    } else {
      alert('시스템 PIP 모드로 전환합니다.');
    }
  }

  refreshCurrentTab() {
    if (this.currentTab === 'home') {
      this.fetchAndRenderLives();
    } else if (this.currentTab === 'clips') {
      this.clipsLoaded = false;
      this.loadRealClips();
    } else if (this.currentTab === 'follow') {
      this.syncFollowChannels();
    }
  }

  // ================= 10. 실제 네이버 클립 MP4 고화질 재생 & 쇼츠 옵저버 =================
  async loadRealClips() {
    const container = document.getElementById('shortsContainer');
    if (!container) return;
    container.innerHTML = '<div class="loading-state">실제 치지직 고화질 클립을 불러오는 중...</div>';

    const targetChId = (this.featuredLive && this.featuredLive.channelId) || '7ce8032370ac5121dcabce7bad375ced';
    const clips = await window.chzzkEngine.getChannelClips(targetChId, 10);

    if (!clips || clips.length === 0) {
      container.innerHTML = '<div class="loading-state">클립을 불러오지 못했습니다. 새로고침을 눌러주세요.</div>';
      return;
    }

    this.clipsLoaded = true;
    container.innerHTML = '';

    clips.forEach((clip, index) => {
      const slide = document.createElement('div');
      slide.className = 'shorts-card-slide';

      const readCountStr = Number(clip.readCount || 0).toLocaleString();

      slide.innerHTML = `
        <video class="shorts-video" playsinline webkit-playsinline loop controls poster="${clip.thumbnailImageUrl}">
          <source src="${clip.videoUrl}" type="video/mp4">
        </video>
        <div class="shorts-slide-overlay"></div>

        <div class="shorts-top-meta">
          <div class="shorts-streamer-badge">
            <img src="${clip.ownerChannelImage}" class="shorts-avatar" alt="${clip.ownerChannelName}">
            <span class="shorts-author-name one-line">${clip.ownerChannelName}</span>
          </div>
          <span class="feed-count">${clip.duration}초</span>
        </div>

        <div class="shorts-action-bar">
          <button onclick="this.classList.toggle('text-red')" class="shorts-action-btn">
            <div class="action-circle">
              <svg class="icon-md" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </div>
            <span class="action-label">좋아요</span>
          </button>

          <a href="${clip.videoUrl}" download="${clip.clipTitle}.mp4" class="shorts-action-btn" target="_blank">
            <div class="action-circle">
              <svg class="icon-md" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            </div>
            <span class="action-label">저장</span>
          </a>
        </div>

        <div class="shorts-bottom-meta">
          <div class="shorts-clip-title one-line">${clip.clipTitle}</div>
          <div class="shorts-clip-meta">조회수 ${readCountStr}회</div>
        </div>
      `;

      container.appendChild(slide);
    });

    this.setupShortsObserver();
  }

  setupShortsObserver() {
    if (this.shortsObserver) {
      this.shortsObserver.disconnect();
      this.shortsObserver = null;
    }

    const container = document.getElementById('shortsContainer');
    if (!container) return;

    const options = {
      root: container,
      threshold: 0.65
    };

    this.shortsObserver = new IntersectionObserver((entries) => {
      if (this.currentTab !== 'clips') {
        this.pauseAllShorts();
        return;
      }

      entries.forEach(entry => {
        const video = entry.target.querySelector('video.shorts-video');
        if (!video) return;

        if (entry.isIntersecting) {
          // 화면 중앙에 있는 영상만 재생하고 나머지는 모두 일시정지
          document.querySelectorAll('#shortsContainer video.shorts-video').forEach(v => {
            if (v !== video) v.pause();
          });
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, options);

    document.querySelectorAll('.shorts-card-slide').forEach(slide => {
      this.shortsObserver.observe(slide);
    });

    // 진입 시 첫 번째 클립 자동 재생
    setTimeout(() => {
      if (this.currentTab === 'clips') {
        const firstVideo = document.querySelector('#shortsContainer .shorts-card-slide video.shorts-video');
        if (firstVideo) firstVideo.play().catch(() => {});
      }
    }, 200);
  }

  pauseAllShorts() {
    document.querySelectorAll('#shortsContainer video.shorts-video').forEach(v => {
      v.pause();
    });
  }

  // ================= 11. 팔로우 동기화 =================
  syncFollowChannels() {
    const list = document.getElementById('followListContainer');
    if (!list) return;
    list.innerHTML = '';
    const populars = this.cachedLives.slice(0, 10);

    populars.forEach(stream => {
      const card = document.createElement('div');
      card.className = 'live-card';
      card.onclick = () => this.playLiveStream(stream.channelId, stream.channelName, 1, true);

      card.innerHTML = `
        <div class="live-thumb-box">
          <img src="${stream.channelImageUrl}" class="live-thumb-img" alt="${stream.channelName}">
          <span class="live-thumb-badge">LIVE</span>
        </div>
        <div class="live-card-body">
          <div class="live-card-title one-line">${stream.channelName}</div>
          <div class="live-card-meta one-line">${stream.liveTitle}</div>
        </div>
        <button class="btn-primary-play">시청</button>
      `;
      list.appendChild(card);
    });
  }

  filterFollowLives() {
    const input = document.getElementById('followSearchInput');
    if (!input) return;
    const q = input.value.toLowerCase().trim();
    const cards = document.querySelectorAll('#followListContainer .live-card');
    cards.forEach(c => {
      const text = c.innerText.toLowerCase();
      c.style.display = text.includes(q) ? 'flex' : 'none';
    });
  }

  // ================= 12. 유튜브 탭 통합 컨트롤러 =================
  initYouTubeTab() {
    this.renderYtKeywords();
    this.switchYtSubTab(this.currentYtSubTab || 'recom');
  }

  switchYtSubTab(subTab) {
    this.currentYtSubTab = subTab;
    const tabs = ['recom', 'playlists', 'watchlater', 'bookmarks'];
    tabs.forEach(t => {
      const view = document.getElementById('ytView' + t.charAt(0).toUpperCase() + t.slice(1));
      const btn = document.getElementById('btnYtSub' + t.charAt(0).toUpperCase() + t.slice(1));
      if (view) {
        if (t === subTab) {
          view.classList.remove('hidden');
          view.style.display = 'block';
        } else {
          view.classList.add('hidden');
          view.style.display = 'none';
        }
      }
      if (btn) {
        if (t === subTab) btn.classList.add('active');
        else btn.classList.remove('active');
      }
    });

    if (subTab === 'recom') {
      if (this.cachedYtVideos.length === 0) {
        this.fetchAndRenderYouTube();
      }
    } else if (subTab === 'playlists') {
      this.renderPlaylists();
    } else if (subTab === 'watchlater') {
      this.renderWatchLater();
    } else if (subTab === 'bookmarks') {
      this.renderYtBookmarks();
    }
  }

  async fetchAndRenderYouTube() {
    const container = document.getElementById('ytRecomListContainer');
    if (!container) return;
    container.innerHTML = '<div class="loading-state">유튜브 추천 영상을 연결 중입니다...</div>';

    try {
      const videos = await window.chzzkClientAPI.getYoutubeRecommendations();
      this.cachedYtVideos = videos || [];
      this.renderYtVideoCards(this.cachedYtVideos, container);
    } catch (e) {
      console.warn('유튜브 추천 로딩 실패:', e);
      container.innerHTML = '<div class="loading-state">추천 영상을 불러오지 못했습니다. 검색창을 이용해 보세요.</div>';
    }
  }

  async searchYouTube(query) {
    if (!query) return;
    const container = document.getElementById('ytRecomListContainer');
    if (!container) return;
    this.switchYtSubTab('recom');
    container.innerHTML = `<div class="loading-state">'${query}' 검색 중...</div>`;

    try {
      const results = await window.chzzkClientAPI.searchYoutube(query);
      this.renderYtVideoCards(results, container);
    } catch (e) {
      container.innerHTML = '<div class="loading-state">검색 결과를 불러오지 못했습니다.</div>';
    }
  }

  renderYtVideoCards(videos, container) {
    if (!container) return;
    container.innerHTML = '';

    if (!videos || videos.length === 0) {
      container.innerHTML = '<div class="loading-state">표시할 영상이 없습니다.</div>';
      return;
    }

    videos.forEach(v => {
      const card = document.createElement('div');
      card.className = 'live-card';
      const vid = v.videoId || v.id;
      const thumb = v.thumbnail || (v.thumbnails && v.thumbnails[0] ? v.thumbnails[0].url : `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`);

      card.innerHTML = `
        <div class="live-thumb-box">
          <img src="${thumb}" class="live-thumb-img" alt="${v.title || ''}">
          <span class="live-thumb-badge bg-red">${v.isLive ? 'LIVE' : (v.publishedTime || 'YT')}</span>
        </div>
        <div class="live-card-body">
          <div class="live-card-title one-line">${v.title || ''}</div>
          <div class="live-card-meta one-line">
            <span>${v.channelTitle || 'YouTube'}</span>
            <span>·</span>
            <span>${v.viewCount || ''}</span>
          </div>
        </div>
        <div class="live-card-action-group" style="display:flex; flex-direction:column; gap:4px; margin-left:auto;">
          <button class="btn-card-play btn-play-now" title="시청">시청</button>
          <button class="btn-card-play btn-add-later" style="font-size:10px; padding:3px 6px;" title="나중에 볼 영상에 추가">+</button>
        </div>
      `;

      card.querySelector('.live-thumb-box').onclick = () => this.playYouTubeInSlot(vid, v.title, v.channelTitle, 1, true);
      card.querySelector('.live-card-body').onclick = () => this.playYouTubeInSlot(vid, v.title, v.channelTitle, 1, true);
      card.querySelector('.btn-play-now').onclick = (e) => {
        e.stopPropagation();
        this.playYouTubeInSlot(vid, v.title, v.channelTitle, 1, true);
      };
      card.querySelector('.btn-add-later').onclick = (e) => {
        e.stopPropagation();
        this.addVideoToWatchLater(vid, v.title, thumb);
      };

      container.appendChild(card);
    });
  }

  toggleKeywordBox() {
    const box = document.getElementById('ytKeywordBox');
    if (!box) return;
    const isHidden = box.classList.contains('hidden') || box.style.display === 'none';
    if (isHidden) {
      box.classList.remove('hidden');
      box.style.display = 'block';
    } else {
      box.classList.add('hidden');
      box.style.display = 'none';
    }
  }

  renderYtKeywords() {
    const wrap = document.getElementById('ytKeywordChips');
    if (!wrap) return;
    const kws = window.chzzkClientAPI.storage.getKeywords();
    wrap.innerHTML = '';
    kws.forEach(kw => {
      const chip = document.createElement('div');
      chip.className = 'keyword-chip';
      chip.innerHTML = `
        <span onclick="window.appController.searchYouTube('${kw}')" style="cursor:pointer;">${kw}</span>
        <button onclick="window.appController.removeKeyword('${kw}')" class="keyword-chip-remove" title="삭제">&times;</button>
      `;
      wrap.appendChild(chip);
    });
  }

  addKeyword() {
    const input = document.getElementById('newKeywordInput');
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;
    const kws = window.chzzkClientAPI.storage.getKeywords();
    if (!kws.includes(val)) {
      kws.push(val);
      window.chzzkClientAPI.storage.setKeywords(kws);
      this.renderYtKeywords();
    }
    input.value = '';
  }

  removeKeyword(kw) {
    let kws = window.chzzkClientAPI.storage.getKeywords();
    kws = kws.filter(k => k !== kw);
    window.chzzkClientAPI.storage.setKeywords(kws);
    this.renderYtKeywords();
  }

  // --- 재생목록 ---
  renderPlaylists() {
    const container = document.getElementById('ytPlaylistsContainer');
    if (!container) return;
    const pls = window.chzzkClientAPI.storage.getPlaylists();
    container.innerHTML = '';

    if (pls.length === 0) {
      container.innerHTML = '<div class="loading-state">생성된 재생목록이 없습니다. [목록 만들기]를 눌러보세요.</div>';
      return;
    }

    pls.forEach(pl => {
      const card = document.createElement('div');
      card.className = 'live-card';
      const hasVideos = pl.videos && pl.videos.length > 0;
      card.innerHTML = `
        <div class="live-card-body">
          <div class="live-card-title one-line">${pl.name}</div>
          <div class="live-card-meta one-line">담긴 영상: ${hasVideos ? pl.videos.length : 0}개</div>
        </div>
        <div style="display:flex; gap:6px;">
          ${hasVideos ? '<button class="btn-card-play btn-pl-play">재생</button>' : ''}
          <button class="btn-card-play btn-pl-del" style="background:#ef4444; color:#fff;">삭제</button>
        </div>
      `;

      if (hasVideos) {
        card.querySelector('.btn-pl-play').onclick = () => {
          this.playYouTubeInSlot(pl.videos[0].videoId, pl.videos[0].title, '', 1, true);
        };
      }
      card.querySelector('.btn-pl-del').onclick = () => {
        this.deletePlaylist(pl.id);
      };

      container.appendChild(card);
    });
  }

  promptCreatePlaylist() {
    const name = prompt('새 재생목록 이름을 입력하세요:', '내가 즐겨보는 영상');
    if (name && name.trim()) {
      window.chzzkClientAPI.storage.createPlaylist(name.trim());
      this.renderPlaylists();
    }
  }

  deletePlaylist(id) {
    if (confirm('이 재생목록을 삭제하시겠습니까?')) {
      window.chzzkClientAPI.storage.deletePlaylist(id);
      this.renderPlaylists();
    }
  }

  // --- 나중에 볼 영상 ---
  addVideoToWatchLater(videoId, title, thumb) {
    window.chzzkClientAPI.storage.addWatchLater({ videoId, title, thumbnail: thumb, addedAt: new Date().toISOString() });
    alert('나중에 볼 영상에 추가되었습니다.');
    this.renderWatchLater();
  }

  renderWatchLater() {
    const container = document.getElementById('ytWatchLaterContainer');
    const badge = document.getElementById('ytWatchLaterCount');
    if (!container) return;
    const list = window.chzzkClientAPI.storage.getWatchLater();
    if (badge) badge.innerText = `${list.length}개`;
    container.innerHTML = '';

    if (list.length === 0) {
      container.innerHTML = '<div class="loading-state">나중에 볼 영상 목록이 비어 있습니다.</div>';
      return;
    }

    list.forEach(v => {
      const card = document.createElement('div');
      card.className = 'live-card';
      card.innerHTML = `
        <div class="live-thumb-box">
          <img src="${v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`}" class="live-thumb-img">
        </div>
        <div class="live-card-body">
          <div class="live-card-title one-line">${v.title || ''}</div>
          <div class="live-card-meta one-line">보관됨</div>
        </div>
        <button class="btn-card-play btn-wl-del" style="background:#ef4444; color:#fff;">삭제</button>
      `;

      card.querySelector('.live-thumb-box').onclick = () => this.playYouTubeInSlot(v.videoId, v.title, '', 1, true);
      card.querySelector('.live-card-body').onclick = () => this.playYouTubeInSlot(v.videoId, v.title, '', 1, true);
      card.querySelector('.btn-wl-del').onclick = (e) => {
        e.stopPropagation();
        this.removeWatchLater(v.videoId);
      };

      container.appendChild(card);
    });
  }

  removeWatchLater(vid) {
    window.chzzkClientAPI.storage.removeWatchLater(vid);
    this.renderWatchLater();
  }

  // --- 유튜브 북마크 ---
  renderYtBookmarks() {
    const container = document.getElementById('ytBookmarksContainer');
    if (!container) return;
    const vList = window.chzzkClientAPI.storage.getYoutubeVideoBookmarks();
    container.innerHTML = '';

    if (vList.length === 0) {
      container.innerHTML = '<div class="loading-state">즐겨찾기한 유튜브 영상이 없습니다.</div>';
      return;
    }

    vList.forEach(v => {
      const card = document.createElement('div');
      card.className = 'live-card';
      card.innerHTML = `
        <div class="live-thumb-box">
          <img src="${v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`}" class="live-thumb-img">
        </div>
        <div class="live-card-body">
          <div class="live-card-title one-line">${v.title || ''}</div>
        </div>
        <button class="btn-card-play btn-bm-del" style="background:#ef4444; color:#fff;">삭제</button>
      `;

      card.querySelector('.live-thumb-box').onclick = () => this.playYouTubeInSlot(v.videoId, v.title, '', 1, true);
      card.querySelector('.live-card-body').onclick = () => this.playYouTubeInSlot(v.videoId, v.title, '', 1, true);
      card.querySelector('.btn-bm-del').onclick = (e) => {
        e.stopPropagation();
        this.removeYtBookmark(v.videoId);
      };

      container.appendChild(card);
    });
  }

  removeYtBookmark(id) {
    window.chzzkClientAPI.storage.removeYoutubeVideoBookmark(id);
    this.renderYtBookmarks();
  }

  // ================= 13. 슬롯 내 댓글 및 관련 영상 드로어 =================
  openSlotComments(idx) {
    const slot = this.activeSlots[idx];
    if (!slot || !slot.channelId) {
      alert('재생 중인 방송이 없습니다.');
      return;
    }

    if (slot.type === 'youtube') {
      const vid = slot.videoId || slot.channelId.replace('yt_', '');
      this.openYtCommentsDrawer(vid, slot.channelName);
    } else {
      this.openSlotChat(idx);
    }
  }

  async openYtCommentsDrawer(videoId, title) {
    this.currentCommentVideoId = videoId;
    const drawer = document.getElementById('ytCommentsDrawer');
    const container = document.getElementById('ytCommentsContainer');
    const titleEl = document.getElementById('ytCommentsTitle');
    if (titleEl) titleEl.innerText = title ? `댓글: ${title}` : '유튜브 댓글';
    if (drawer) {
      drawer.classList.remove('hidden');
      drawer.style.display = 'block';
    }
    if (container) {
      container.innerHTML = '<div class="loading-state">댓글을 불러오는 중입니다...</div>';
      container.style.fontSize = this.commentFontSize + 'px';
    }

    try {
      const res = await window.chzzkClientAPI.getYoutubeComments(videoId);
      if (res && res.comments && res.comments.length > 0) {
        if (container) container.innerHTML = '';
        res.comments.forEach(c => {
          const item = document.createElement('div');
          item.className = 'yt-comment-item';
          item.innerHTML = `
            <img src="${c.authorThumb || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60'}" class="yt-comment-avatar">
            <div class="yt-comment-content">
              <div class="yt-comment-author-row">
                <span class="yt-comment-author">${c.author}</span>
                <span class="yt-comment-time">${c.publishedTime}</span>
              </div>
              <div class="yt-comment-text">${c.text}</div>
            </div>
          `;
          if (container) container.appendChild(item);
        });
      } else {
        if (container) container.innerHTML = '<div class="loading-state">댓글이 없거나 불러올 수 없습니다.</div>';
      }
    } catch (e) {
      if (container) container.innerHTML = '<div class="loading-state">댓글 로딩 중 에러가 발생했습니다.</div>';
    }
  }

  closeYtCommentsDrawer() {
    const drawer = document.getElementById('ytCommentsDrawer');
    if (drawer) {
      drawer.classList.add('hidden');
      drawer.style.display = 'none';
    }
  }

  changeCommentFontSize(delta) {
    this.commentFontSize = Math.min(22, Math.max(11, this.commentFontSize + delta));
    const container = document.getElementById('ytCommentsContainer');
    if (container) container.style.fontSize = this.commentFontSize + 'px';
  }

  async openSlotRelated(idx) {
    const slot = this.activeSlots[idx];
    const vid = slot.videoId || (slot.channelId ? slot.channelId.replace('yt_', '') : null);
    if (!vid) return;

    const drawer = document.getElementById('ytRelatedDrawer');
    const container = document.getElementById('ytRelatedListContainer');
    if (drawer) {
      drawer.classList.remove('hidden');
      drawer.style.display = 'block';
    }
    if (container) container.innerHTML = '<div class="loading-state">관련 영상을 찾는 중입니다...</div>';

    try {
      const videos = await window.chzzkClientAPI.getYoutubeRelated(vid);
      if (container) container.innerHTML = '';
      videos.forEach(v => {
        const item = document.createElement('div');
        item.className = 'mobile-related-card';
        const itemVid = v.videoId || v.id;
        const thumb = v.thumbnail || (v.thumbnails && v.thumbnails[0] ? v.thumbnails[0].url : `https://i.ytimg.com/vi/${itemVid}/hqdefault.jpg`);

        item.onclick = () => {
          this.playYouTubeInSlot(itemVid, v.title, v.channelTitle, idx, false);
          this.closeYtRelatedDrawer();
        };

        item.innerHTML = `
          <img src="${thumb}" class="mobile-related-thumb" alt="${v.title}">
          <div class="mobile-related-info">
            <div class="mobile-related-title">${v.title}</div>
            <div class="mobile-related-channel">${v.channelTitle || 'YouTube'} · ${v.viewCount || ''}</div>
          </div>
        `;
        if (container) container.appendChild(item);
      });
    } catch (e) {
      if (container) container.innerHTML = '<div class="loading-state">관련 영상을 불러오지 못했습니다.</div>';
    }
  }

  closeYtRelatedDrawer() {
    const drawer = document.getElementById('ytRelatedDrawer');
    if (drawer) {
      drawer.classList.add('hidden');
      drawer.style.display = 'none';
    }
  }

  // ================= 14. 실시간 방송 녹화 관제 (MediaRecorder & 브라우저 다운로드) =================
  initStudioTab() {
    this.updateRecTargetStream();
    this.renderRecFileList();
  }

  updateRecTargetStream() {
    const sel = document.getElementById('webRecSlotSelect');
    const label = document.getElementById('studioTargetStream');
    if (!sel || !label) return;

    this.webRecTargetSlot = parseInt(sel.value, 10) || 1;
    const slot = this.activeSlots[this.webRecTargetSlot];

    if (slot && slot.channelName) {
      label.innerText = `[슬롯 ${this.webRecTargetSlot}] ${slot.channelName} (${slot.type === 'youtube' ? '유튜브' : '치지직'})`;
    } else {
      label.innerText = `[슬롯 ${this.webRecTargetSlot}] 현재 시청 중인 방송 없음`;
    }
  }

  toggleWebRecording() {
    if (this.webMediaRecorder && this.webMediaRecorder.state === 'recording') {
      this.stopWebRecording();
    } else {
      this.startWebRecording();
    }
  }

  startWebRecording() {
    const slotIdx = this.webRecTargetSlot;
    const slot = this.activeSlots[slotIdx];

    if (!slot || (!slot.videoEl && !slot.ytIframeEl)) {
      alert('녹화할 슬롯에 재생 중인 비디오가 없습니다.');
      return;
    }

    const videoEl = slot.videoEl;
    if (!videoEl || videoEl.paused || videoEl.readyState < 2) {
      alert('치지직 비디오가 재생 중이어야 브라우저 실시간 녹화가 가능합니다.');
      return;
    }

    let stream = null;
    try {
      if (videoEl.captureStream) {
        stream = videoEl.captureStream();
      } else if (videoEl.mozCaptureStream) {
        stream = videoEl.mozCaptureStream();
      }
    } catch (e) {
      console.error('captureStream 실패:', e);
    }

    if (!stream) {
      alert('현재 브라우저 환경에서 비디오 스트림 캡처를 지원하지 않습니다.');
      return;
    }

    let mimeType = 'video/webm';
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
      mimeType = 'video/webm;codecs=vp9,opus';
    } else if (MediaRecorder.isTypeSupported('video/mp4')) {
      mimeType = 'video/mp4';
    }

    try {
      this.webMediaRecorder = new MediaRecorder(stream, { mimeType });
    } catch (e) {
      this.webMediaRecorder = new MediaRecorder(stream);
    }

    this.webRecChunks = [];
    this.webMediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.webRecChunks.push(e.data);
        const totalBytes = this.webRecChunks.reduce((acc, c) => acc + c.size, 0);
        const sizeMb = (totalBytes / (1024 * 1024)).toFixed(1);
        const sizeEl = document.getElementById('webRecSize');
        if (sizeEl) sizeEl.innerText = `${sizeMb} MB`;
      }
    };

    const streamerName = slot.channelName || `Slot_${slotIdx}`;
    this.webMediaRecorder.onstop = () => {
      const blob = new Blob(this.webRecChunks, { type: this.webMediaRecorder.mimeType || 'video/webm' });
      const ext = (this.webMediaRecorder.mimeType && this.webMediaRecorder.mimeType.includes('mp4')) ? 'mp4' : 'webm';
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '_');
      const fileName = `TheChzzk_녹화_${streamerName}_${timestamp}.${ext}`;

      // 1. 브라우저 자동 다운로드 트리거
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // 2. 최근 녹화 목록에 저장
      const recItem = {
        id: 'rec_' + Date.now(),
        name: fileName,
        size: (blob.size / (1024 * 1024)).toFixed(1) + ' MB',
        date: new Date().toLocaleTimeString(),
        blobUrl: blobUrl
      };
      window.chzzkClientAPI.storage.addRecording(recItem);
      this.renderRecFileList();
      alert(`녹화가 완료되었습니다!\n기기 다운로드 폴더에 저장되었습니다: ${fileName}`);
    };

    this.webMediaRecorder.start(1000);
    this.webRecStartTime = Date.now();

    // UI 배지 및 타이머 업데이트
    const badge = document.getElementById('webRecStatusBadge');
    if (badge) {
      badge.innerText = '녹화 진행 중 (LIVE)';
      badge.className = 'badge-status bg-red';
    }
    const btn = document.getElementById('btnWebRecToggle');
    if (btn) {
      btn.innerText = '녹화 종료 & 파일 다운로드';
      btn.style.background = '#ef4444';
    }

    if (this.webRecTimerInterval) clearInterval(this.webRecTimerInterval);
    this.webRecTimerInterval = setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - this.webRecStartTime) / 1000);
      const timerEl = document.getElementById('webRecTimer');
      if (timerEl) {
        const hrs = String(Math.floor(elapsedSec / 3600)).padStart(2, '0');
        const mins = String(Math.floor((elapsedSec % 3600) / 60)).padStart(2, '0');
        const secs = String(elapsedSec % 60).padStart(2, '0');
        timerEl.innerText = `${hrs}:${mins}:${secs}`;
      }
    }, 1000);
  }

  stopWebRecording() {
    if (this.webMediaRecorder && this.webMediaRecorder.state === 'recording') {
      this.webMediaRecorder.stop();
    }
    if (this.webRecTimerInterval) {
      clearInterval(this.webRecTimerInterval);
      this.webRecTimerInterval = null;
    }

    const badge = document.getElementById('webRecStatusBadge');
    if (badge) {
      badge.innerText = '대기 중';
      badge.className = 'badge-status';
    }
    const btn = document.getElementById('btnWebRecToggle');
    if (btn) {
      btn.innerText = '녹화 시작';
      btn.style.background = '';
    }
  }

  renderRecFileList() {
    const listEl = document.getElementById('webRecFileList');
    if (!listEl) return;
    const recs = window.chzzkClientAPI.storage.getRecordings();
    listEl.innerHTML = '';

    if (recs.length === 0) {
      listEl.innerHTML = '<div class="rec-empty-hint">녹화된 영상이 여기에 보관되며 즉시 기기로 다운로드됩니다.</div>';
      return;
    }

    recs.forEach(r => {
      const item = document.createElement('div');
      item.className = 'rec-file-item';
      item.innerHTML = `
        <div>
          <div class="rec-file-name one-line">${r.name}</div>
          <div class="rec-file-meta">${r.size} · ${r.date}</div>
        </div>
        <div class="rec-file-actions">
          ${r.blobUrl ? `<button onclick="window.appController.downloadRecFile('${r.id}')" class="btn-file-dl">다운로드</button>` : ''}
          <button onclick="window.appController.deleteRecFile('${r.id}')" class="btn-file-del">삭제</button>
        </div>
      `;
      listEl.appendChild(item);
    });
  }

  downloadRecFile(id) {
    const recs = window.chzzkClientAPI.storage.getRecordings();
    const target = recs.find(r => r.id === id);
    if (target && target.blobUrl) {
      const a = document.createElement('a');
      a.href = target.blobUrl;
      a.download = target.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  deleteRecFile(id) {
    window.chzzkClientAPI.storage.removeRecording(id);
    this.renderRecFileList();
  }

  // ================= 15. 웹 무손실/터치 컷편집기 (파일 업로드 지원) =================
  handleCutterFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    this.cutterFile = file;
    const nameLabel = document.getElementById('cutterFileName');
    if (nameLabel) nameLabel.innerText = file.name;

    const wrap = document.getElementById('cutterPlayerWrap');
    const emptyHint = document.getElementById('cutterEmptyPlaceholder');
    if (wrap) wrap.style.display = 'block';
    if (emptyHint) emptyHint.style.display = 'none';

    this.cutterVideo = document.getElementById('cutterVideo');
    if (this.cutterVideo) {
      this.cutterVideo.src = URL.createObjectURL(file);
      this.cutterVideo.onloadedmetadata = () => {
        const dur = this.cutterVideo.duration || 0;
        this.cutterStartTime = 0;
        this.cutterEndTime = dur;

        const durLabel = document.getElementById('cutterDurTime');
        if (durLabel) durLabel.innerText = this.formatTime(dur);

        this.updateCutterTrimBadges();
      };

      this.cutterVideo.ontimeupdate = () => {
        const cur = this.cutterVideo.currentTime || 0;
        const curLabel = document.getElementById('cutterCurTime');
        const seekbar = document.getElementById('cutterSeekbar');
        if (curLabel) curLabel.innerText = this.formatTime(cur);
        if (seekbar && this.cutterVideo.duration) {
          seekbar.value = (cur / this.cutterVideo.duration) * 100;
        }

        // 구간 미리보기 재생 중 종료 지점 도달 시 자동 정지
        if (this.cutterIsPreviewing && cur >= this.cutterEndTime) {
          this.cutterVideo.pause();
          this.cutterIsPreviewing = false;
        }
      };
    }
  }

  onCutterSeek(val) {
    if (!this.cutterVideo || !this.cutterVideo.duration) return;
    this.cutterVideo.currentTime = (val / 100) * this.cutterVideo.duration;
  }

  toggleCutterPlay() {
    if (!this.cutterVideo) return;
    const btn = document.getElementById('btnCutterPlay');
    if (this.cutterVideo.paused) {
      this.cutterVideo.play().catch(() => {});
      if (btn) btn.innerHTML = `<span>일시정지</span>`;
    } else {
      this.cutterVideo.pause();
      if (btn) btn.innerHTML = `<span>재생</span>`;
    }
  }

  setCutterTrimPoint(type) {
    if (!this.cutterVideo) return;
    const cur = this.cutterVideo.currentTime || 0;
    if (type === 'start') {
      this.cutterStartTime = Math.min(cur, this.cutterEndTime - 0.5);
    } else {
      this.cutterEndTime = Math.max(cur, this.cutterStartTime + 0.5);
    }
    this.updateCutterTrimBadges();
  }

  updateCutterTrimBadges() {
    const startBadge = document.getElementById('trimStartBadge');
    const endBadge = document.getElementById('trimEndBadge');
    const durBadge = document.getElementById('trimDurationBadge');

    if (startBadge) startBadge.innerText = `시작: ${this.formatTime(this.cutterStartTime)}`;
    if (endBadge) endBadge.innerText = `종료: ${this.formatTime(this.cutterEndTime)}`;
    if (durBadge) durBadge.innerText = `구간: ${this.formatTime(this.cutterEndTime - this.cutterStartTime)}`;
  }

  previewCutterTrim() {
    if (!this.cutterVideo) return;
    this.cutterIsPreviewing = true;
    this.cutterVideo.currentTime = this.cutterStartTime;
    this.cutterVideo.play().catch(() => {});
  }

  exportCutterTrimmedVideo() {
    if (!this.cutterVideo || !this.cutterFile) {
      alert('편집할 영상 파일이 로드되지 않았습니다.');
      return;
    }

    const duration = this.cutterEndTime - this.cutterStartTime;
    if (duration <= 0) {
      alert('유효한 컷팅 구간을 지정해 주세요.');
      return;
    }

    const progressEl = document.getElementById('cutterProgressText');
    if (progressEl) {
      progressEl.classList.remove('hidden');
      progressEl.style.display = 'block';
      progressEl.innerText = '브라우저에서 구간 인코딩 및 컷팅 진행 중...';
    }

    let stream = null;
    try {
      stream = this.cutterVideo.captureStream ? this.cutterVideo.captureStream() : this.cutterVideo.mozCaptureStream();
    } catch (e) {}

    if (!stream) {
      alert('현재 브라우저에서 동영상 스트림 추출을 지원하지 않습니다.');
      if (progressEl) progressEl.style.display = 'none';
      return;
    }

    const chunks = [];
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm';
    const rec = new MediaRecorder(stream, { mimeType });

    rec.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    rec.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      const dotIdx = this.cutterFile.name.lastIndexOf('.');
      const baseName = dotIdx !== -1 ? this.cutterFile.name.substring(0, dotIdx) : this.cutterFile.name;
      const fileName = `TheChzzk_Cut_${baseName}.webm`;

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      if (progressEl) {
        progressEl.innerText = `완료! 다운로드되었습니다: ${fileName}`;
        setTimeout(() => { progressEl.style.display = 'none'; }, 4000);
      }
    };

    this.cutterVideo.currentTime = this.cutterStartTime;
    this.cutterVideo.play().then(() => {
      rec.start(200);

      const checkEnd = () => {
        if (this.cutterVideo.currentTime >= this.cutterEndTime) {
          this.cutterVideo.pause();
          rec.stop();
          this.cutterVideo.removeEventListener('timeupdate', checkEnd);
        }
      };
      this.cutterVideo.addEventListener('timeupdate', checkEnd);
    }).catch(err => {
      console.error(err);
      if (progressEl) progressEl.style.display = 'none';
      alert('영상 재생 캡처 실패: ' + err.message);
    });
  }
}

// Global Init
window.addEventListener('DOMContentLoaded', () => {
  window.appController = new MobileAppController();
});

// Global Function Bridges for Inline onclick
function switchTab(t) { if (window.appController) window.appController.switchTab(t); }
function toggleRadioMode() { if (window.appController) window.appController.toggleRadioMode(); }
function setSplitMode(m) { if (window.appController) window.appController.setSplitMode(m); }
function toggleSlotHud(idx) { if (window.appController) window.appController.toggleSlotHud(idx); }
function toggleSlotAudio(idx) { if (window.appController) window.appController.toggleSlotAudio(idx); }
function activateSlotSolo(idx) { if (window.appController) window.appController.activateSlotSolo(idx); }
function closeSlotStream(idx) { if (window.appController) window.appController.closeSlotStream(idx); }
function toggleSlotFullscreen(idx) { if (window.appController) window.appController.toggleSlotFullscreen(idx); }
function changeMasterVolume(v) { if (window.appController) window.appController.changeMasterVolume(v); }
function returnToMultiview() { if (window.appController) window.appController.returnToMultiview(); }
function closeMiniPip(e) { if (window.appController) window.appController.closeMiniPip(e); }
function requestSystemPIP() { if (window.appController) window.appController.requestSystemPIP(); }
function refreshCurrentTab() { if (window.appController) window.appController.refreshCurrentTab(); }
function playFeaturedStream() { if (window.appController) window.appController.playFeaturedStream(); }
function filterLives() { if (window.appController) window.appController.filterLives(); }
function selectCategory(c) { if (window.appController) window.appController.selectCategory(c); }
function syncFollowChannels() { if (window.appController) window.appController.syncFollowChannels(); }
function filterFollowLives() { if (window.appController) window.appController.filterFollowLives(); }
function openSlotChat(idx) { if (window.appController) window.appController.openSlotChat(idx); }
function closeChatDrawer() { if (window.appController) window.appController.closeChatDrawer(); }
function openChannelPicker(idx) { if (window.appController) window.appController.openChannelPicker(idx); }
function closeChannelPicker() { if (window.appController) window.appController.closeChannelPicker(); }
function toggleSlotPlay(idx) { if (window.appController) window.appController.toggleSlotPlay(idx); }
function rewindSlot10s(idx) { if (window.appController) window.appController.rewindSlot10s(idx); }
function reconnectSlot(idx) { if (window.appController) window.appController.reconnectSlot(idx); }
function openSlotComments(idx) { if (window.appController) window.appController.openSlotComments(idx); }
function openSlotRelated(idx) { if (window.appController) window.appController.openSlotRelated(idx); }
function closeYtCommentsDrawer() { if (window.appController) window.appController.closeYtCommentsDrawer(); }
function closeYtRelatedDrawer() { if (window.appController) window.appController.closeYtRelatedDrawer(); }
function changeCommentFontSize(delta) { if (window.appController) window.appController.changeCommentFontSize(delta); }
function toggleWebRecording() { if (window.appController) window.appController.toggleWebRecording(); }
function handleCutterFileUpload(e) { if (window.appController) window.appController.handleCutterFileUpload(e); }
function onCutterSeek(v) { if (window.appController) window.appController.onCutterSeek(v); }
function setCutterTrimPoint(t) { if (window.appController) window.appController.setCutterTrimPoint(t); }
function toggleCutterPlay() { if (window.appController) window.appController.toggleCutterPlay(); }
function previewCutterTrim() { if (window.appController) window.appController.previewCutterTrim(); }
function exportCutterTrimmedVideo() { if (window.appController) window.appController.exportCutterTrimmedVideo(); }
