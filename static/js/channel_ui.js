/* ============================================================
   더치지직 (The Chzzk) - Channel Home & VOD Controller (channel_ui.js)
   ============================================================ */

class ChannelUI {
  constructor() {
    this.currentChannelId = null;
    this.currentChannelData = null;
    this.currentVideos = [];
    this.currentClips = [];
    this.activeVod = null;
    this.previousTab = 'explore';
    this.hlsLivePlayer = null;
    this.vodHls = null;

    this.initElements();
    this.bindEvents();
  }

  initElements() {
    this.channelTab = document.getElementById('channel-tab');
    this.channelNavBtn = document.getElementById('channelNavBtn');
    this.channelNavTitle = document.getElementById('channelNavTitle');
    this.channelBackBtn = document.getElementById('channelBackBtn');
    this.channelOpenWebBtn = document.getElementById('channelOpenWebBtn');
    this.channelMultiviewBtn = document.getElementById('channelMultiviewBtn');

    // Hero elements
    this.channelHeroAvatar = document.getElementById('channelHeroAvatar');
    this.channelHeroName = document.getElementById('channelHeroName');
    this.channelFollowToggleBtn = document.getElementById('channelFollowToggleBtn');
    this.channelBookmarkToggleBtn = document.getElementById('channelBookmarkToggleBtn');
    this.channelNotifyToggleBtn = document.getElementById('channelNotifyToggleBtn');
    this.channelFollowerCount = document.getElementById('channelFollowerCount');
    this.channelLiveStatusText = document.getElementById('channelLiveStatusText');
    this.channelHeroDesc = document.getElementById('channelHeroDesc');
    this.channelLiveBadge = document.getElementById('channelLiveBadge');

    // Live player
    this.channelLivePlayerSection = document.getElementById('channelLivePlayerSection');
    this.channelLivePlayerTitle = document.getElementById('channelLivePlayerTitle');
    this.channelLivePlayerUsers = document.getElementById('channelLivePlayerUsers');
    this.channelLiveVideo = document.getElementById('channelLiveVideo');
    this.channelSendToMultiviewBtn = document.getElementById('channelSendToMultiviewBtn');

    // Subtabs
    this.channelSubtabVodsBtn = document.getElementById('channelSubtabVodsBtn');
    this.channelSubtabClipsBtn = document.getElementById('channelSubtabClipsBtn');
    this.channelVodsCountBadge = document.getElementById('channelVodsCountBadge');
    this.channelClipsCountBadge = document.getElementById('channelClipsCountBadge');
    this.channelVodsPane = document.getElementById('channelVodsPane');
    this.channelClipsPane = document.getElementById('channelClipsPane');
    this.channelVodsGrid = document.getElementById('channelVodsGrid');
    this.channelClipsGrid = document.getElementById('channelClipsGrid');

    // VOD Modal
    this.vodPlayerModal = document.getElementById('vodPlayerModal');
    this.vodModalTitleText = document.getElementById('vodModalTitleText');
    this.vodModalVideo = document.getElementById('vodModalVideo');
    this.vodModalMeta = document.getElementById('vodModalMeta');
    this.vodQualitySelect = document.getElementById('vodQualitySelect');
    this.vodModalSendToMultiviewBtn = document.getElementById('vodModalSendToMultiviewBtn');
    this.vodModalDownloadBtn = document.getElementById('vodModalDownloadBtn');
    this.vodModalCutBtn = document.getElementById('vodModalCutBtn');
  }

  bindEvents() {
    if (this.vodModalSendToMultiviewBtn) {
      this.vodModalSendToMultiviewBtn.addEventListener('click', () => {
        if (this.activeVod) {
          const title = this.vodModalTitleText ? this.vodModalTitleText.textContent : '다시보기';
          this.sendVodToMultiview(this.activeVod.videoNo || '', title);
          this.closeVodModal();
        }
      });
    }

    if (this.channelBackBtn) {
      this.channelBackBtn.addEventListener('click', () => this.goBack());
    }

    if (this.channelOpenWebBtn) {
      this.channelOpenWebBtn.addEventListener('click', () => {
        if (this.currentChannelId) {
          window.open(`https://chzzk.naver.com/${this.currentChannelId}`, '_blank');
        }
      });
    }

    if (this.channelFollowToggleBtn) {
      this.channelFollowToggleBtn.addEventListener('click', () => {
        if (this.currentChannelId && window.app) {
          window.app.toggleFollow(this.currentChannelId);
          setTimeout(() => this.updateFollowButtonState(), 200);
        }
      });
    }

    if (this.channelBookmarkToggleBtn) {
      this.channelBookmarkToggleBtn.addEventListener('click', () => {
        if (this.currentChannelId && window.app) {
          const chName = this.currentChannelData ? this.currentChannelData.channelName : (this.channelHeroName ? this.channelHeroName.textContent : null);
          const chImg = this.currentChannelData ? this.currentChannelData.channelImageUrl : (this.channelHeroAvatar ? this.channelHeroAvatar.src : null);
          window.app.toggleBookmark(this.currentChannelId, chName, chImg);
          setTimeout(() => this.updateBookmarkButtonState(), 200);
        }
      });
    }

    if (this.channelNotifyToggleBtn) {
      this.channelNotifyToggleBtn.addEventListener('click', () => {
        if (window.app && typeof window.app.isMobileUIMode === 'function' && window.app.isMobileUIMode()) return;
        if (this.currentChannelId && window.app) {
          window.app.toggleChannelNotify(this.currentChannelId);
          setTimeout(() => this.updateNotifyButtonState(), 200);
        }
      });
    }

    if (this.channelSendToMultiviewBtn) {
      this.channelSendToMultiviewBtn.addEventListener('click', () => {
        if (this.currentChannelId && window.app) {
          window.app.watchInMultiview(this.currentChannelId);
        }
      });
    }

    if (this.channelMultiviewBtn) {
      this.channelMultiviewBtn.addEventListener('click', () => {
        if (this.currentChannelId && window.app) {
          window.app.watchInMultiview(this.currentChannelId);
        }
      });
    }

    // Subtabs
    if (this.channelSubtabVodsBtn) {
      this.channelSubtabVodsBtn.addEventListener('click', () => this.switchSubtab('vods'));
    }
    if (this.channelSubtabClipsBtn) {
      this.channelSubtabClipsBtn.addEventListener('click', () => this.switchSubtab('clips'));
    }

    // VOD Modal
    if (this.vodQualitySelect) {
      this.vodQualitySelect.addEventListener('change', (e) => {
        const url = e.target.value;
        if (this.vodHls && this.vodHls.levels) {
          const selText = e.target.options[e.target.selectedIndex].text;
          const idx = this.vodHls.levels.findIndex(lvl => selText.includes(`${lvl.height}p`));
          if (idx !== -1) {
            this.vodHls.currentLevel = idx;
            return;
          }
        }
        if (url && this.vodModalVideo && !this.vodHls) {
          const curTime = this.vodModalVideo.currentTime;
          this.vodModalVideo.src = url;
          this.vodModalVideo.currentTime = curTime;
          this.vodModalVideo.play().catch(() => {});
        }
      });
    }

    if (this.vodModalDownloadBtn) {
      this.vodModalDownloadBtn.addEventListener('click', () => {
        if (this.activeVod && this.activeVod.streamUrl) {
          window.open(this.activeVod.streamUrl, '_blank');
        }
      });
    }

    if (this.vodModalCutBtn) {
      this.vodModalCutBtn.addEventListener('click', () => {
        if (this.activeVod) {
          this.closeVodModal();
          if (window.app) window.app.switchTab('editor');
          if (window.editorUI && this.activeVod.streamUrl) {
            window.editorUI.selectSource(this.activeVod.streamUrl, this.activeVod.videoTitle);
          }
        }
      });
    }

    if (this.vodPlayerModal) {
      this.vodPlayerModal.addEventListener('click', (e) => {
        if (e.target === this.vodPlayerModal) {
          this.closeVodModal();
        }
      });
    }
  }

  async openChannel(channelId, fromTab = 'explore') {
    if (!channelId) return;
    this.currentChannelId = channelId;
    this.previousTab = fromTab;

    // Show nav tab button
    if (this.channelNavBtn) {
      this.channelNavBtn.style.display = 'flex';
      this.channelNavTitle.textContent = '채널 로딩...';
    }

    // Switch tab
    if (window.app) {
      window.app.switchTab('channel');
    }

    // Reset UI
    this.destroyLivePlayer();
    this.channelLivePlayerSection.style.display = 'none';
    this.channelVodsGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">다시보기를 불러오는 중...</div>';
    this.channelClipsGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">클립을 불러오는 중...</div>';

    // 1. Fetch channel metadata
    await this.fetchChannelInfo(channelId);

    // 2. Check Live status
    this.checkChannelLive(channelId);

    // 3. Fetch VODs (다시보기)
    this.fetchChannelVods(channelId);

    // 4. Fetch Clips
    this.fetchChannelClips(channelId);
  }

  async fetchChannelInfo(channelId) {
    try {
      const res = await fetch(`/api/channels/${channelId}`);
      const data = await res.json();
      if (data.success) {
        this.currentChannelData = data;
        const name = data.channelName || '스트리머';
        this.channelHeroName.textContent = name;
        if (this.channelNavTitle) this.channelNavTitle.textContent = name;
        if (this.channelHeroAvatar) {
          this.channelHeroAvatar.src = data.channelImageUrl || './static/img/favicon.png';
          this.channelHeroAvatar.onerror = () => { this.channelHeroAvatar.src = './static/img/favicon.png'; };
        }
        this.channelFollowerCount.textContent = `팔로워 ${(data.followerCount || 0).toLocaleString()}명`;
        this.channelHeroDesc.textContent = data.description || '스트리머 채널 소개가 없습니다.';
        this.updateBookmarkButtonState();
        this.updateFollowButtonState();
        this.updateNotifyButtonState();
      }
    } catch (e) {
      console.error(e);
    }
  }

  updateNotifyButtonState() {
    if (!window.app || !this.currentChannelId || !this.channelNotifyToggleBtn) return;
    if (typeof window.app.isMobileUIMode === 'function' && window.app.isMobileUIMode()) {
      this.channelNotifyToggleBtn.style.display = 'none';
      return;
    }
    this.channelNotifyToggleBtn.style.display = 'flex';
    const isNotify = window.app.isChannelNotifyEnabled(this.currentChannelId);
    if (isNotify) {
      this.channelNotifyToggleBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
        <span>방송 알림 켜짐</span>
      `;
      this.channelNotifyToggleBtn.style.color = '#fbbf24';
    } else {
      this.channelNotifyToggleBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
        <span>방송 알림 꺼짐</span>
      `;
      this.channelNotifyToggleBtn.style.color = 'var(--text-muted)';
    }
  }

  updateBookmarkButtonState() {
    if (!window.app || !this.currentChannelId) return;
    const isBookmarked = window.app.bookmarks.some(b => b.channelId === this.currentChannelId);
    if (isBookmarked) {
      this.channelBookmarkToggleBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <span>즐겨찾기 해제</span>
      `;
      this.channelBookmarkToggleBtn.style.color = '#f59e0b';
    } else {
      this.channelBookmarkToggleBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <span>즐겨찾기 추가</span>
      `;
      this.channelBookmarkToggleBtn.style.color = '#fff';
    }
  }

  updateFollowButtonState() {
    if (!window.app || !this.currentChannelId || !this.channelFollowToggleBtn) return;
    const isFollowing = window.app.followingChannelIds && window.app.followingChannelIds.has(this.currentChannelId);
    if (isFollowing) {
      this.channelFollowToggleBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
        <span>팔로우 중</span>
      `;
      this.channelFollowToggleBtn.style.color = 'var(--danger-color)';
    } else {
      this.channelFollowToggleBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
        <span>치지직 팔로우</span>
      `;
      this.channelFollowToggleBtn.style.color = '#fff';
    }
  }

  async checkChannelLive(channelId) {
    try {
      const res = await fetch(`/api/live/${channelId}`);
      const data = await res.json();

      if (data.success && data.isOnline) {
        // Stream is LIVE!
        this.channelLiveBadge.style.display = 'block';
        this.channelLiveStatusText.textContent = `LIVE 생방송 중 (${(data.userCount || 0).toLocaleString()}명 시청)`;
        this.channelLiveStatusText.style.color = 'var(--danger-color)';

        this.channelMultiviewBtn.style.display = 'inline-flex';
        this.channelLivePlayerSection.style.display = 'block';
        this.channelLivePlayerTitle.textContent = data.title || '라이브 방송';
        this.channelLivePlayerUsers.textContent = `${(data.userCount || 0).toLocaleString()}명 시청 중`;

        // Start HLS inline playback
        const streamUrl = data.streamUrl || data.masterUrl;
        if (streamUrl) {
          this.startLivePlayer(streamUrl);
        }
      } else {
        // Offline
        this.channelLiveBadge.style.display = 'none';
        this.channelLiveStatusText.textContent = '오프라인';
        this.channelLiveStatusText.style.color = 'var(--text-muted)';
        this.channelMultiviewBtn.style.display = 'none';
        this.channelLivePlayerSection.style.display = 'none';
        this.destroyLivePlayer();
      }
    } catch (e) {
      this.channelLivePlayerSection.style.display = 'none';
    }
  }

  startLivePlayer(streamUrl) {
    this.destroyLivePlayer();
    if (window.multiview) window.multiview.hidePiP();
    const video = this.channelLiveVideo;
    if (!video) return;

    // Channel preview starts muted by default as requested
    video.muted = true;
    video.defaultMuted = true;
    const masterVol = (window.app && typeof window.app.masterVolume === 'number') ? window.app.masterVolume : 1.0;
    video.volume = 0.8 * masterVol;

    if (window.Hls && window.Hls.isSupported()) {
      const overrides = {
        backBufferLength: 10,
        maxBufferLength: 12,
        maxMaxBufferLength: 24,
        maxBufferSize: 15 * 1000 * 1000,
        liveSyncDuration: 5.5,
        liveMaxLatencyDuration: 22.0,
        maxLiveSyncPlaybackRate: 1.0
      };
      const cfg = (typeof window.buildChzzkHlsConfig === 'function')
        ? window.buildChzzkHlsConfig(overrides, true)
        : Object.assign({ enableWorker: true, lowLatencyMode: true }, overrides);
      const hls = new Hls(cfg);
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {
          video.muted = true;
          video.play().catch(() => {});
        });
      });
      this.hlsLivePlayer = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.play().catch(() => {});
    }
  }

  destroyLivePlayer() {
    if (this.hlsLivePlayer) {
      try { this.hlsLivePlayer.stopLoad(); } catch (e) {}
      try { this.hlsLivePlayer.detachMedia(); } catch (e) {}
      try { this.hlsLivePlayer.destroy(); } catch (e) {}
      this.hlsLivePlayer = null;
    }
    if (this.channelLiveVideo) {
      this.channelLiveVideo.pause();
      this.channelLiveVideo.srcObject = null;
      this.channelLiveVideo.removeAttribute('src');
      this.channelLiveVideo.load();
    }
  }

  clearTransientDom() {
    if (this.channelVodsGrid && this.currentVideos && this.currentVideos.length > 0) {
      this.channelVodsGrid.innerHTML = '';
    }
    if (this.channelClipsGrid && this.currentClips && this.currentClips.length > 0) {
      this.channelClipsGrid.innerHTML = '';
    }
  }

  restoreTransientDomIfNeeded() {
    if (this.currentVideos && this.currentVideos.length > 0 && this.channelVodsGrid && this.channelVodsGrid.children.length === 0) {
      this.renderVods();
    }
    if (this.currentClips && this.currentClips.length > 0 && this.channelClipsGrid && this.channelClipsGrid.children.length === 0) {
      this.renderClips();
    }
  }

  // VODs (다시보기)
  async fetchChannelVods(channelId) {
    try {
      const res = await fetch(`/api/channels/${channelId}/videos?size=30&sort_type=LATEST`);
      const data = await res.json();
      if (data.success && data.videos) {
        this.currentVideos = data.videos;
        this.channelVodsCountBadge.textContent = data.total || data.videos.length;
        this.renderVods();
      } else {
        this.channelVodsGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">등록된 다시보기가 없습니다.</div>';
        this.channelVodsCountBadge.textContent = '0';
      }
    } catch (e) {
      this.channelVodsGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">다시보기 불러오기 실패</div>';
    }
  }

  renderVods() {
    if (!this.currentVideos || this.currentVideos.length === 0) {
      this.channelVodsGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">등록된 다시보기가 없습니다.</div>';
      return;
    }

    const mvSvgIcon = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect></svg>';

    this.channelVodsGrid.innerHTML = '';
    this.currentVideos.forEach(v => {
      const card = document.createElement('div');
      card.className = 'vod-card';
      const typeLabel = v.videoType === 'REPLAY' ? '다시보기' : '업로드';
      const safeTitle = escapeHtml(v.videoTitle || '제목 없음');
      const thumbUrl = v.thumbnailImageUrl || './static/img/favicon.png';
      const pubDate = (v.publishDate || '').split(' ')[0] || '-';

      card.innerHTML = `
        <div class="vod-thumb-wrap">
          <img src="${escapeHtml(thumbUrl)}" loading="lazy" alt="${safeTitle}" onerror="this.src='./static/img/favicon.png'">
          <span class="vod-type-badge">${typeLabel}</span>
          <span class="vod-duration-badge">${escapeHtml(v.durationText || '')}</span>
        </div>
        <div class="vod-info">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
            <div class="vod-title" style="flex: 1;" title="${safeTitle}">${safeTitle}</div>
            <button type="button" class="btn btn-sm btn-multiview-send" title="멀티뷰 슬롯에서 재생" style="padding: 2px 7px; font-size: 11px; flex-shrink: 0; display: inline-flex; align-items: center; gap: 3px;">
              ${mvSvgIcon}<span>멀티뷰</span>
            </button>
          </div>
          <div class="vod-meta">
            <span>${escapeHtml(v.categoryValue || '기타')}</span>
            <span>조회 ${(v.readCount || 0).toLocaleString()}회 • ${escapeHtml(pubDate)}</span>
          </div>
        </div>
      `;

      const mvBtn = card.querySelector('.btn-multiview-send');
      if (mvBtn) {
        mvBtn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          this.sendVodToMultiview(v.videoNo, v.videoTitle);
        });
      }
      card.addEventListener('click', () => this.playVod(v.videoNo, v.videoTitle, v.durationText));
      this.channelVodsGrid.appendChild(card);
    });
  }

  // Play VOD Modal
  async playVod(videoNo, videoTitle, durationText) {
    if (window.app) window.app.showToast('다시보기 스트림을 불러오는 중...', 'info');

    try {
      const res = await fetch(`/api/videos/${videoNo}/playback`);
      const data = await res.json();
      if (!data.success || !data.streamUrl) {
        if (window.app) window.app.showToast(data.error || '재생 주소를 불러올 수 없습니다.', 'error');
        return;
      }

      this.activeVod = data;
      this.vodModalTitleText.textContent = `${videoTitle} (${durationText || ''})`;
      this.vodModalMeta.textContent = `채널: ${this.currentChannelData ? this.currentChannelData.channelName : ''} | 해상도: ${data.qualities && data.qualities[0] ? data.qualities[0].quality : '1080p'}`;

      // Populate qualities
      this.vodQualitySelect.innerHTML = '';
      if (data.qualities && data.qualities.length > 0) {
        data.qualities.forEach(q => {
          const opt = document.createElement('option');
          opt.value = q.url;
          opt.textContent = `${q.quality} 고화질`;
          this.vodQualitySelect.appendChild(opt);
        });
      }

      this.destroyVodHls();

      const masterVol = (window.app && typeof window.app.masterVolume === 'number') ? window.app.masterVolume : 1.0;
      const masterMuted = window.app ? window.app.masterMuted : false;
      if (this.vodModalVideo) {
        this.vodModalVideo.muted = masterMuted;
        this.vodModalVideo.volume = masterMuted ? 0 : masterVol;
      }

      if (data.isHls || (data.streamUrl && data.streamUrl.includes('.m3u8'))) {
        if (window.Hls && window.Hls.isSupported()) {
          const vodCfg = (typeof window.buildChzzkHlsConfig === 'function')
            ? window.buildChzzkHlsConfig({ backBufferLength: 25, maxBufferLength: 25, maxMaxBufferLength: 45, maxBufferSize: 28 * 1000 * 1000 }, false)
            : { enableWorker: true, lowLatencyMode: false, backBufferLength: 25, maxBufferLength: 25, maxMaxBufferLength: 45, maxBufferSize: 28 * 1000 * 1000 };
          const hls = new Hls(vodCfg);
          hls.loadSource(data.streamUrl);
          hls.attachMedia(this.vodModalVideo);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            this.vodModalVideo.play().catch(() => {});
          });
          this.vodHls = hls;
        } else if (this.vodModalVideo.canPlayType('application/vnd.apple.mpegurl')) {
          this.vodModalVideo.src = data.streamUrl;
          this.vodModalVideo.play().catch(() => {});
        }
      } else {
        this.vodModalVideo.src = data.streamUrl;
        this.vodModalVideo.play().catch(() => {});
      }

      this.vodPlayerModal.classList.add('active');
    } catch (e) {
      if (window.app) window.app.showToast('다시보기 재생 실패', 'error');
    }
  }

  destroyVodHls() {
    if (this.vodHls) {
      try { this.vodHls.stopLoad(); } catch (e) {}
      try { this.vodHls.detachMedia(); } catch (e) {}
      try { this.vodHls.destroy(); } catch (e) {}
      this.vodHls = null;
    }
  }

  closeVodModal() {
    this.destroyVodHls();
    if (this.vodModalVideo) {
      this.vodModalVideo.pause();
      this.vodModalVideo.srcObject = null;
      this.vodModalVideo.removeAttribute('src');
      this.vodModalVideo.load();
    }
    if (this.vodPlayerModal) {
      this.vodPlayerModal.classList.remove('active');
    }
    this.activeVod = null;
  }

  // Clips
  async fetchChannelClips(channelId) {
    try {
      const res = await fetch(`/api/channels/${channelId}/clips?size=30&sort_type=POPULAR`);
      const data = await res.json();
      if (data.success && data.clips) {
        this.currentClips = data.clips;
        this.channelClipsCountBadge.textContent = data.clips.length;
        this.renderClips();
      } else {
        this.channelClipsGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">등록된 클립이 없습니다.</div>';
        this.channelClipsCountBadge.textContent = '0';
      }
    } catch (e) {
      this.channelClipsGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">클립 불러오기 실패</div>';
    }
  }

  renderClips() {
    if (!this.currentClips || this.currentClips.length === 0) {
      this.channelClipsGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">등록된 클립이 없습니다.</div>';
      return;
    }

    const mvSvgIcon = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect></svg>';

    this.channelClipsGrid.innerHTML = '';
    this.currentClips.forEach(c => {
      const card = document.createElement('div');
      card.className = 'clip-card';
      const durSec = Math.round(c.duration || 0);
      const safeTitle = escapeHtml(c.clipTitle || '제목 없음');
      const thumbUrl = c.thumbnailImageUrl || './static/img/favicon.png';

      card.innerHTML = `
        <div class="clip-thumb-wrap">
          <img src="${escapeHtml(thumbUrl)}" loading="lazy" alt="${safeTitle}" onerror="this.src='./static/img/favicon.png'">
          <div class="clip-play-overlay">
            <div class="clip-play-btn-circle">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
          </div>
          <span class="clip-duration-badge">${durSec}초</span>
        </div>
        <div class="clip-info">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
            <div class="clip-title" style="flex: 1;" title="${safeTitle}">${safeTitle}</div>
            <button type="button" class="btn btn-sm btn-multiview-send" title="멀티뷰 슬롯에서 재생" style="padding: 2px 7px; font-size: 11px; flex-shrink: 0; display: inline-flex; align-items: center; gap: 3px;">
              ${mvSvgIcon}<span>멀티뷰</span>
            </button>
          </div>
          <div style="font-size: 11px; color: var(--text-dim); margin-top: 4px;">
            조회 ${(c.readCount || 0).toLocaleString()}회 • ${c.createdDate ? escapeHtml(c.createdDate.split(' ')[0]) : ''}
          </div>
        </div>
      `;

      const mvBtn = card.querySelector('.btn-multiview-send');
      if (mvBtn) {
        mvBtn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          this.sendClipToMultiview(c.clipUID, c.clipTitle);
        });
      }
      card.addEventListener('click', () => {
        if (window.clipsUI) {
          const idx = this.currentClips.findIndex(item => item.clipUID === c.clipUID);
          if (typeof window.clipsUI.openFeedFromChannelClips === 'function') {
            window.clipsUI.openFeedFromChannelClips(this.currentChannelId, this.currentChannelData, this.currentClips, Math.max(0, idx));
          } else {
            window.clipsUI.currentClips = this.currentClips;
            window.clipsUI.playClip(c.clipUID, idx);
          }
        }
      });
      this.channelClipsGrid.appendChild(card);
    });
  }

  sendVodToMultiview(videoNo, videoTitle) {
    if (!window.multiview) return;
    let targetIdx = window.multiview.targetSlotIndex;
    if (targetIdx === null) {
      const emptyIdx = window.multiview.slots.findIndex(s => !s.active);
      if (emptyIdx !== -1) {
        targetIdx = emptyIdx;
      } else {
        window.multiview.addNewSlot(false);
        targetIdx = window.multiview.slotCount - 1;
      }
    }
    const chName = this.currentChannelData ? this.currentChannelData.channelName : '';
    window.multiview.loadVodIntoSlot(targetIdx, videoNo, videoTitle, chName, this.currentChannelId);
  }

  sendClipToMultiview(clipUID, clipTitle) {
    if (!window.multiview) return;
    let targetIdx = window.multiview.targetSlotIndex;
    if (targetIdx === null) {
      const emptyIdx = window.multiview.slots.findIndex(s => !s.active);
      if (emptyIdx !== -1) {
        targetIdx = emptyIdx;
      } else {
        window.multiview.addNewSlot(false);
        targetIdx = window.multiview.slotCount - 1;
      }
    }
    const idx = this.currentClips.findIndex(c => c.clipUID === clipUID);
    const chName = this.currentChannelData ? this.currentChannelData.channelName : '';
    window.multiview.loadClipIntoSlot(targetIdx, clipUID, clipTitle, this.currentClips, idx, chName);
  }

  switchSubtab(tabName) {
    if (tabName === 'vods') {
      this.channelSubtabVodsBtn.classList.add('active');
      this.channelSubtabClipsBtn.classList.remove('active');
      this.channelVodsPane.style.display = 'block';
      this.channelClipsPane.style.display = 'none';
    } else {
      this.channelSubtabVodsBtn.classList.remove('active');
      this.channelSubtabClipsBtn.classList.add('active');
      this.channelVodsPane.style.display = 'none';
      this.channelClipsPane.style.display = 'block';
    }
  }

  goBack() {
    this.destroyLivePlayer();
    if (window.app) {
      window.app.switchTab(this.previousTab || 'explore');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.channelUI = new ChannelUI();
});
