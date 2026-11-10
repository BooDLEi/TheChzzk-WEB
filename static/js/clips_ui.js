/* ============================================================
   더치지직 (The Chzzk) - Channel Clips UI Controller (clips_ui.js)
   ============================================================ */

class ClipsUI {
  constructor() {
    this.currentChannelId = null;
    this.currentChannelInfo = null;
    this.currentClips = [];
    this.activeClipIndex = -1;
    this.activeClip = null;
    this.wheelCooldown = false;
    this.streamerFilter = 'following';
    this.cachedFollowings = [];
    this.cachedBookmarks = [];

    this.initElements();
    this.bindEvents();
  }

  initElements() {
    this.clipsChannelSelect = document.getElementById('clipsChannelSelect');
    this.clipsChannelSearchInput = document.getElementById('clipsChannelSearchInput');
    this.clipsSearchChannelBtn = document.getElementById('clipsSearchChannelBtn');
    this.refreshClipsBtn = document.getElementById('refreshClipsBtn');
    this.openClipsFolderTopBtn = document.getElementById('openClipsFolderTopBtn');

    this.clipsChannelBanner = document.getElementById('clipsChannelBanner');
    this.clipsBannerAvatar = document.getElementById('clipsBannerAvatar');
    this.clipsBannerName = document.getElementById('clipsBannerName');
    this.clipsBannerMeta = document.getElementById('clipsBannerMeta');
    this.clipsWatchLiveBtn = document.getElementById('clipsWatchLiveBtn');

    this.clipsGrid = document.getElementById('clipsGrid');

    // Priority Following chips bar
    this.clipsFollowingBarSection = document.getElementById('clipsFollowingBarSection');
    this.clipsFollowingChips = document.getElementById('clipsFollowingChips');
    this.clipsFollowingCountBadge = document.getElementById('clipsFollowingCountBadge');
    this.clipsGoChannelBtn = document.getElementById('clipsGoChannelBtn');

    // Modal elements
    this.clipPlayerModal = document.getElementById('clipPlayerModal');
    this.clipModalTitle = document.getElementById('clipModalTitle');
    this.clipModalVideo = document.getElementById('clipModalVideo');
    this.clipVideoSlideContainer = document.getElementById('clipVideoSlideContainer');
    this.clipModalMeta = document.getElementById('clipModalMeta');
    this.clipModalDownloadBtn = document.getElementById('clipModalDownloadBtn');
    this.clipModalWebEncodeBtn = document.getElementById('clipModalWebEncodeBtn');
    this.clipModalCutBtn = document.getElementById('clipModalCutBtn');
    this.clipModalSendToMultiviewBtn = document.getElementById('clipModalSendToMultiviewBtn');
  }

  bindEvents() {
    this.clipsChannelSelect.addEventListener('change', (e) => {
      const chId = e.target.value;
      if (chId) this.selectChannel(chId);
    });

    this.clipsSearchChannelBtn.addEventListener('click', () => this.searchAndSelectChannel());
    this.clipsChannelSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.searchAndSelectChannel();
    });

    this.refreshClipsBtn.addEventListener('click', () => {
      if (this.currentChannelId) this.loadChannelClips();
    });

    this.openClipsFolderTopBtn.addEventListener('click', () => this.openClipsFolder());

    this.clipsWatchLiveBtn.addEventListener('click', () => {
      if (this.currentChannelId && window.app) {
        window.app.watchInMultiview(this.currentChannelId);
      }
    });

    if (this.clipsGoChannelBtn) {
      this.clipsGoChannelBtn.addEventListener('click', () => {
        if (this.currentChannelId && window.channelUI) {
          window.channelUI.openChannel(this.currentChannelId, 'clips');
        }
      });
    }

    if (this.clipsBannerAvatar) {
      this.clipsBannerAvatar.addEventListener('click', () => {
        if (this.currentChannelId && window.channelUI) {
          window.channelUI.openChannel(this.currentChannelId, 'clips');
        }
      });
    }

    if (this.clipsBannerName) {
      this.clipsBannerName.addEventListener('click', () => {
        if (this.currentChannelId && window.channelUI) {
          window.channelUI.openChannel(this.currentChannelId, 'clips');
        }
      });
    }

    this.clipModalDownloadBtn.addEventListener('click', () => {
      if (this.activeClip) this.downloadClip(this.activeClip.clipUID);
    });

    if (this.clipModalWebEncodeBtn) {
      this.clipModalWebEncodeBtn.addEventListener('click', () => {
        if (this.activeClip) this.downloadWebClip(this.activeClip.clipUID);
      });
    }

    this.clipModalCutBtn.addEventListener('click', () => {
      if (this.activeClip) this.cutActiveClip();
    });

    if (this.clipModalSendToMultiviewBtn) {
      this.clipModalSendToMultiviewBtn.addEventListener('click', () => {
        if (this.activeClip) {
          this.sendClipToMultiview(this.activeClip.clipUID, this.activeClip.clipTitle);
          this.closeModal();
        }
      });
    }

    // Close modal on background click
    this.clipPlayerModal.addEventListener('click', (e) => {
      if (e.target === this.clipPlayerModal) {
        this.closeModal();
      }
    });

    // Mouse wheel up/down navigation between clips (Shorts/TikTok style)
    this.clipPlayerModal.addEventListener('wheel', (e) => {
      if (!this.clipPlayerModal.classList.contains('active')) return;
      e.preventDefault();

      if (this.wheelCooldown) return;
      this.wheelCooldown = true;
      setTimeout(() => { this.wheelCooldown = false; }, 380);

      if (e.deltaY > 20) {
        // Wheel Down -> Next clip
        this.navigateClip(1);
      } else if (e.deltaY < -20) {
        // Wheel Up -> Previous clip
        this.navigateClip(-1);
      }
    }, { passive: false });
  }

  navigateClip(direction) {
    if (this.currentClips.length <= 1) return;
    let nextIndex = this.activeClipIndex + direction;

    if (nextIndex < 0 || nextIndex >= this.currentClips.length) {
      return;
    }

    const nextClip = this.currentClips[nextIndex];
    if (!nextClip) return;

    const container = this.clipVideoSlideContainer;
    if (container) {
      // TikTok / Shorts slide transition animation
      if (direction > 0) {
        // Wheel down: current clip slides up and out
        container.className = 'clip-slide-container slide-out-up';
      } else {
        // Wheel up: current clip slides down and out
        container.className = 'clip-slide-container slide-out-down';
      }

      setTimeout(() => {
        this.playClip(nextClip.clipUID, nextIndex);
        if (direction > 0) {
          container.className = 'clip-slide-container slide-prep-down';
        } else {
          container.className = 'clip-slide-container slide-prep-up';
        }
        void container.offsetWidth; // Force layout reflow
        container.className = 'clip-slide-container';
      }, 200);
    } else {
      this.playClip(nextClip.clipUID, nextIndex);
    }
  }

  updateStreamersBar() {
    if (!this.clipsFollowingChips || !this.clipsFollowingBarSection) return;

    const bookmarks = (window.app ? window.app.bookmarks : []) || this.cachedBookmarks || [];
    const bookmarksBadge = document.getElementById('clipsBookmarksCountBadge');
    if (bookmarksBadge) bookmarksBadge.textContent = bookmarks.length;

    if (bookmarks.length === 0) {
      this.clipsFollowingBarSection.style.display = 'none';
      return;
    }

    this.clipsFollowingBarSection.style.display = 'block';
    this.clipsFollowingChips.innerHTML = '';

    bookmarks.forEach(item => {
      const chId = item.channelId;
      const chName = item.channelName || '스트리머';
      const imgUrl = item.channelImageUrl || '/static/img/default_avatar.png';
      const isLive = Boolean(item.openLive || item.isOnline);

      const chip = document.createElement('div');
      chip.className = `following-chip ${isLive ? 'online' : ''} ${this.currentChannelId === chId ? 'active' : ''}`;
      chip.title = `${chName} (${isLive ? 'LIVE 방송 중' : '오프라인'})`;

      chip.innerHTML = `
        <div class="following-chip-avatar-wrap">
          <img src="${imgUrl}" loading="lazy" alt="${chName}" onerror="this.src='/static/img/default_avatar.png'">
          ${isLive ? '<span class="following-chip-live-dot"></span>' : ''}
        </div>
        <div class="following-chip-name">${chName}</div>
      `;

      chip.addEventListener('click', () => {
        document.querySelectorAll('.following-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.selectChannel(chId);
      });

      this.clipsFollowingChips.appendChild(chip);
    });
  }

  renderFollowingChips(channels) {
    if (window.app && window.app.bookmarks) {
      this.cachedBookmarks = window.app.bookmarks;
    }
    this.updateStreamersBar();
  }

  onTabActivated(lives, bookmarks) {
    this.cachedBookmarks = bookmarks || (window.app ? window.app.bookmarks : []) || [];
    this.updateStreamersBar();
    this.populateChannelSelect(lives, this.cachedBookmarks, []);
  }

  populateChannelSelect(lives, bookmarks, followings) {
    const prevVal = this.clipsChannelSelect.value;
    let html = '<option value="">-- 채널 선택 --</option>';

    if (followings && followings.length > 0) {
      html += '<optgroup label="내 팔로잉 스트리머 (최우선 순위)">';
      followings.forEach(f => {
        html += `<option value="${f.channelId}">${f.openLive ? '[LIVE]' : '[OFF]'} [팔로우] ${f.channelName}</option>`;
      });
      html += '</optgroup>';
    }

    if (bookmarks && bookmarks.length > 0) {
      html += '<optgroup label="즐겨찾기 채널">';
      bookmarks.forEach(b => {
        html += `<option value="${b.channelId}">${b.isOnline ? '[LIVE]' : '[OFF]'} ${b.channelName}</option>`;
      });
      html += '</optgroup>';
    }

    if (lives && lives.length > 0) {
      html += '<optgroup label="실시간 방송 중인 채널">';
      lives.forEach(l => {
        html += `<option value="${l.channelId}">[LIVE] ${l.channelName} (${l.categoryValue || '방송'})</option>`;
      });
      html += '</optgroup>';
    }

    this.clipsChannelSelect.innerHTML = html;
    if (prevVal) {
      this.clipsChannelSelect.value = prevVal;
    }
  }

  async searchAndSelectChannel() {
    const kw = this.clipsChannelSearchInput.value.trim();
    if (!kw) {
      if (window.app) window.app.showToast('스트리머명을 입력하세요.', 'error');
      return;
    }

    if (window.app) window.app.showToast(`'${kw}' 채널 검색 중...`, 'info');
    try {
      const res = await fetch(`/api/channels/search?keyword=${encodeURIComponent(kw)}`);
      const data = await res.json();
      if (data.success && data.channels && data.channels.length > 0) {
        const first = data.channels[0];
        this.selectChannel(first.channelId);
      } else {
        if (window.app) window.app.showToast('채널을 찾을 수 없습니다.', 'error');
      }
    } catch (err) {
      console.error(err);
      if (window.app) window.app.showToast('채널 검색 오류', 'error');
    }
  }

  async selectChannel(channelId) {
    if (!channelId) return;
    this.currentChannelId = channelId;

    if (this.clipsChannelSelect) {
      let optionExists = false;
      for (let i = 0; i < this.clipsChannelSelect.options.length; i++) {
        if (this.clipsChannelSelect.options[i].value === channelId) {
          optionExists = true;
          break;
        }
      }
      if (!optionExists) {
        const opt = document.createElement('option');
        opt.value = channelId;
        opt.textContent = `[선택 채널] ${channelId.slice(0, 8)}...`;
        this.clipsChannelSelect.appendChild(opt);
      }
      this.clipsChannelSelect.value = channelId;
    }

    try {
      const res = await fetch(`/api/channels/${channelId}`);
      const data = await res.json();
      if (data.success) {
        this.currentChannelInfo = data;
        this.renderChannelBanner(data);
        if (this.clipsChannelSelect) {
          for (let i = 0; i < this.clipsChannelSelect.options.length; i++) {
            if (this.clipsChannelSelect.options[i].value === channelId) {
              this.clipsChannelSelect.options[i].textContent = `${data.channelName || channelId}`;
              break;
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    }

    await this.loadChannelClips();
  }

  renderChannelBanner(ch) {
    this.clipsChannelBanner.style.display = 'flex';
    this.clipsBannerAvatar.src = ch.channelImageUrl || '';
    this.clipsBannerName.textContent = ch.channelName;
    const followers = Number(ch.followerCount || 0).toLocaleString();
    this.clipsBannerMeta.textContent = `팔로워 ${followers}명 • ${ch.openLive ? '[LIVE] 현재 방송 중' : '현재 오프라인'}`;
    this.clipsWatchLiveBtn.style.display = ch.openLive ? 'inline-flex' : 'none';
  }

  async loadChannelClips() {
    if (!this.currentChannelId) return;

    this.clipsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <div>클립 목록을 불러오는 중입니다...</div>
      </div>
    `;

    try {
      // Safe size=48 and sortType=POPULAR (인기순 고정)
      const res = await fetch(`/api/channels/${this.currentChannelId}/clips?size=48&sortType=POPULAR`);
      const data = await res.json();

      if (data.success) {
        this.currentClips = data.clips || [];
        this.renderClipsGrid();
      } else {
        this.clipsGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--danger-color);">${data.error || '클립 불러오기 실패'}</div>`;
      }
    } catch (err) {
      console.error(err);
      this.clipsGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--danger-color);">서버 연결 오류</div>`;
    }
  }

  renderClipsGrid() {
    if (this.currentClips.length === 0) {
      this.clipsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
          <div style="margin-bottom: 8px; color: var(--text-dim);">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div style="font-weight: 700;">등록된 클립이 없습니다.</div>
        </div>
      `;
      return;
    }

    this.clipsGrid.innerHTML = this.currentClips.map((clip, index) => {
      const durationFormatted = this.formatDuration(clip.duration);
      const views = Number(clip.readCount || 0).toLocaleString();
      const dateStr = clip.createdDate ? clip.createdDate.split(' ')[0] : '';
      const thumb = clip.thumbnailImageUrl || '';

      return `
        <div class="clip-card" data-clip-uid="${clip.clipUID}">
          <div class="clip-thumb-wrap" onclick="window.clipsUI.playClip('${clip.clipUID}', ${index})">
            <img src="${thumb}" alt="${clip.clipTitle}">
            <div class="clip-play-overlay">
              <div class="clip-play-btn-circle">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </div>
            </div>
            <div class="clip-duration-badge">${durationFormatted}</div>
          </div>
          <div class="clip-info">
            <div class="clip-title" title="${clip.clipTitle}">${clip.clipTitle}</div>
            <div class="clip-meta-row">
              <span>조회 ${views}회</span>
              <span>${dateStr}</span>
            </div>
          </div>
          <div class="clip-actions">
            <button class="btn btn-sm btn-primary" onclick="window.clipsUI.playClip('${clip.clipUID}', ${index})">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> 재생
            </button>
            <button class="btn btn-sm btn-multiview-send" onclick="event.stopPropagation(); window.clipsUI.sendClipToMultiview('${clip.clipUID}', '${(clip.clipTitle || '').replace(/'/g, "\\'")}')" title="멀티뷰 슬롯에서 재생">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> 멀티뷰
            </button>
            <button class="btn btn-sm" onclick="window.clipsUI.downloadClip('${clip.clipUID}')" title="MP4 파일로 고속 다운로드">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> 다운로드
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  formatDuration(secs) {
    if (!secs) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  async playClip(clipUID, clipIndex = -1) {
    if (clipIndex === -1) {
      clipIndex = this.currentClips.findIndex(c => c.clipUID === clipUID);
    }
    this.activeClipIndex = clipIndex;
    const clip = this.currentClips[clipIndex];
    this.activeClip = clip || { clipUID };

    if (window.app) window.app.showToast('클립 재생 정보를 가져오는 중...', 'info');

    try {
      const res = await fetch(`/api/clips/${clipUID}/playback`);
      const data = await res.json();

      if (!data.success || !data.primaryMp4Url) {
        if (window.app) window.app.showToast(data.error || '클립 재생 주소를 얻을 수 없습니다.', 'error');
        return;
      }

      this.activeClip.mp4Url = data.primaryMp4Url;
      this.activeClip.clipTitle = data.clipTitle || (clip ? clip.clipTitle : '클립');

      const currentIndexInfo = this.activeClipIndex >= 0 ? ` [${this.activeClipIndex + 1}/${this.currentClips.length}]` : '';
      this.clipModalTitle.textContent = `${this.activeClip.clipTitle}${currentIndexInfo}`;
      this.clipModalMeta.textContent = `클립 ID: ${clipUID} • 마우스 휠을 굴려 이전/다음 클립으로 전환할 수 있습니다.`;

      const masterVol = (window.app && typeof window.app.masterVolume === 'number') ? window.app.masterVolume : 1.0;
      const masterMuted = window.app ? window.app.masterMuted : false;
      this.clipModalVideo.muted = masterMuted;
      this.clipModalVideo.volume = masterMuted ? 0 : masterVol;

      this.clipModalVideo.src = data.primaryMp4Url;
      this.clipPlayerModal.classList.add('active');
      this.clipModalVideo.play().catch(e => console.log(e));

    } catch (err) {
      console.error(err);
      if (window.app) window.app.showToast('클립 로드 실패', 'error');
    }
  }

  closeModal() {
    this.clipModalVideo.pause();
    this.clipModalVideo.removeAttribute('src');
    this.clipModalVideo.load();
    this.clipPlayerModal.classList.remove('active');
    this.activeClip = null;
    this.activeClipIndex = -1;
  }

  async downloadClip(clipUID) {
    if (window.app) window.app.showToast(`클립 다운로드를 시작합니다 (초고속 MP4)...`, 'info');

    try {
      const res = await fetch('/api/clips/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clip_uid: clipUID })
      });
      const data = await res.json();

      if (data.success) {
        const sizeMb = (data.fileSize / (1024 * 1024)).toFixed(1);
        if (window.app) {
          window.app.showToast(`'${data.filename}' 다운로드 완료! (${sizeMb} MB)`, 'success');
        }
      } else {
        if (window.app) window.app.showToast(data.error || '클립 다운로드 실패', 'error');
      }
    } catch (err) {
      console.error(err);
      if (window.app) window.app.showToast('다운로드 요청 실패', 'error');
    }
  }

  async downloadWebClip(clipUID) {
    if (window.app) window.app.showToast(`클립을 웹 호환(H.264/MP4) 포맷으로 인코딩 다운로드합니다...`, 'info');

    try {
      // 1. Download original clip
      const dlRes = await fetch('/api/clips/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clip_uid: clipUID })
      });
      const dlData = await dlRes.json();
      if (!dlData.success || !dlData.filePath) {
        if (window.app) window.app.showToast(dlData.error || '클립 다운로드 실패', 'error');
        return;
      }

      if (window.app) window.app.showToast(`H.264/AAC 웹 호환 규격으로 변환 중... (Discord/X 업로드 최적화)`, 'info');

      // 2. Encode to web-compatible H.264
      const encRes = await fetch('/api/clips/encode-web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_path: dlData.filePath })
      });
      const encData = await encRes.json();
      if (encData.success) {
        const sizeMb = (encData.size / (1024 * 1024)).toFixed(1);
        if (window.app) {
          window.app.showToast(`'${encData.filename}' 웹 호환 인코딩 완료! (${sizeMb} MB)`, 'success');
        }
        if (window.editorUI) window.editorUI.loadClipsList();
      } else {
        if (window.app) window.app.showToast(encData.error || '웹 호환 인코딩 실패', 'error');
      }
    } catch (err) {
      console.error(err);
      if (window.app) window.app.showToast('웹 호환 다운로드 실패', 'error');
    }
  }

  async cutActiveClip() {
    if (!this.activeClip) return;
    const clipUID = this.activeClip.clipUID;

    if (window.app) window.app.showToast('클립을 편집기로 전송하기 위해 준비 중...', 'info');

    try {
      const res = await fetch('/api/clips/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clip_uid: clipUID })
      });
      const data = await res.json();

      if (data.success && data.filePath) {
        this.closeModal();
        if (window.app) {
          window.app.switchTab('editor');
          if (window.editorUI) {
            await window.editorUI.loadSources();
            window.editorUI.selectSourceByPath(data.filePath);
          }
        }
      } else {
        if (window.app) window.app.showToast('클립 준비 실패', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  }

  async openClipsFolder() {
    try {
      await fetch('/api/utils/open-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'clips' })
      });
    } catch (err) {
      console.error(err);
    }
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
    const chName = this.currentChannelInfo ? this.currentChannelInfo.channelName : '';
    window.multiview.loadClipIntoSlot(targetIdx, clipUID, clipTitle, this.currentClips, idx, chName);
    if (window.app) {
      window.app.switchTab('multiview');
      window.app.showToast(`'${clipTitle || '클립'}' 슬롯 #${targetIdx + 1}에서 재생`, 'info');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.clipsUI = new ClipsUI();
});
