/* ============================================================
   더치지직 (The Chzzk) - Recording UI Controller (recorder_ui.js)
   - 실시간 헤더 녹화 팝업 (경과시간, 크기, 오류 상세, 일시정지/정지 제어)
   - 녹화 보관함 갤러리/그리드 뷰 & 목록 뷰 토글
   - 캡처 이미지 분리 탭 & 캡처 미리보기 모달
   - 파일명 및 스트리머 검색, 날짜별 필터, 날짜별 묶어보기
   - 페이지네이션 (12개 단위 페이징)
   - 파일 이름 변경 (Rename)
   - 편집실 원클릭 가져오기 연동
   ============================================================ */

function escapeRecHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

class RecorderUI {
  constructor() {
    this.jobs = [];
    this.recordings = [];
    this.captures = [];
    this.pollInterval = null;

    // View & Filter states
    this.subtab = 'all'; // 'all' | 'videos' | 'captures'
    this.viewMode = 'grid'; // 'grid' | 'list'
    this.searchQuery = '';
    this.dateFilter = '';
    this.groupByDate = false;
    this.currentPage = 1;
    this.pageSize = 12;

    // Header popup state
    this.isHeaderPopupOpen = false;

    // Rename state
    this.renameTarget = null; // { filePath, currentName, type }

    // Modal state
    this.currentPreviewPath = null;
    this.currentCaptureItem = null;

    this.initElements();
    this.bindEvents();
    this.startPolling();
    this.loadData();
  }

  initElements() {
    // Header popup elements
    this.headerRecordingIndicator = document.getElementById('headerRecordingIndicator');
    this.headerRecordingText = document.getElementById('headerRecordingText');
    this.headerRecordingPopup = document.getElementById('headerRecordingPopup');
    this.recPopupBody = document.getElementById('recPopupBody');
    this.recPopupCountBadge = document.getElementById('recPopupCountBadge');

    // Nav badge
    this.recorderBadge = document.getElementById('recorder-badge');

    // Action buttons
    this.directRecordBtn = document.getElementById('directRecordBtn');
    this.openRecordingsFolderBtn = document.getElementById('openRecordingsFolderBtn');
    this.refreshRecordingsBtn = document.getElementById('refreshRecordingsBtn');

    // Subtabs & view mode
    this.recCountAll = document.getElementById('recCountAll');
    this.recCountVideos = document.getElementById('recCountVideos');
    this.recCountCaptures = document.getElementById('recCountCaptures');
    this.viewModeGridBtn = document.getElementById('viewModeGridBtn');
    this.viewModeListBtn = document.getElementById('viewModeListBtn');

    // Filter controls
    this.recordingsSearchInput = document.getElementById('recordingsSearchInput');
    this.recordingsDateFilter = document.getElementById('recordingsDateFilter');
    this.clearDateFilterBtn = document.getElementById('clearDateFilterBtn');
    this.groupByDateToggleBtn = document.getElementById('groupByDateToggleBtn');

    // Content container & pagination
    this.recordingsContainer = document.getElementById('recordingsContainer');
    this.recordingsPagination = document.getElementById('recordingsPagination');

    // Video preview modal
    this.recordPreviewModal = document.getElementById('recordPreviewModal');
    this.recordPreviewFileName = document.getElementById('recordPreviewFileName');
    this.recordPreviewVideo = document.getElementById('recordPreviewVideo');
    this.recordPreviewMeta = document.getElementById('recordPreviewMeta');
    this.recordPreviewSendEditorBtn = document.getElementById('recordPreviewSendEditorBtn');

    // Capture preview modal
    this.capturePreviewModal = document.getElementById('capturePreviewModal');
    this.capturePreviewFileName = document.getElementById('capturePreviewFileName');
    this.capturePreviewImg = document.getElementById('capturePreviewImg');
    this.capturePreviewMeta = document.getElementById('capturePreviewMeta');
    this.capturePreviewRenameBtn = document.getElementById('capturePreviewRenameBtn');
    this.capturePreviewDownloadLink = document.getElementById('capturePreviewDownloadLink');
    this.capturePreviewDeleteBtn = document.getElementById('capturePreviewDeleteBtn');

    // Rename modal
    this.renameModal = document.getElementById('renameModal');
    this.renameCurrentName = document.getElementById('renameCurrentName');
    this.renameNewNameInput = document.getElementById('renameNewNameInput');
    this.renameExtLabel = document.getElementById('renameExtLabel');
    this.renameConfirmBtn = document.getElementById('renameConfirmBtn');
  }

  bindEvents() {
    // Action buttons
    if (this.openRecordingsFolderBtn) {
      this.openRecordingsFolderBtn.addEventListener('click', () => this.openFolder());
    }
    if (this.refreshRecordingsBtn) {
      this.refreshRecordingsBtn.addEventListener('click', () => {
        this.loadData();
        if (window.app) window.app.showToast('녹화 보관함을 새로고침했습니다.', 'info');
      });
    }
    if (this.directRecordBtn) {
      this.directRecordBtn.addEventListener('click', () => this.promptDirectRecord());
    }

    // Search input
    if (this.recordingsSearchInput) {
      this.recordingsSearchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim().toLowerCase();
        this.currentPage = 1;
        this.render();
      });
    }

    // Date filter
    if (this.recordingsDateFilter) {
      this.recordingsDateFilter.addEventListener('change', (e) => {
        this.dateFilter = e.target.value;
        this.currentPage = 1;
        this.render();
      });
    }
    if (this.clearDateFilterBtn) {
      this.clearDateFilterBtn.addEventListener('click', () => {
        if (this.recordingsDateFilter) this.recordingsDateFilter.value = '';
        this.dateFilter = '';
        this.currentPage = 1;
        this.render();
      });
    }

    // Group by date toggle
    if (this.groupByDateToggleBtn) {
      this.groupByDateToggleBtn.addEventListener('click', () => {
        this.groupByDate = !this.groupByDate;
        this.groupByDateToggleBtn.classList.toggle('active', this.groupByDate);
        this.currentPage = 1;
        this.render();
      });
    }

    // Video preview modal send to editor
    if (this.recordPreviewSendEditorBtn) {
      this.recordPreviewSendEditorBtn.addEventListener('click', () => {
        if (this.currentPreviewPath) {
          const path = this.currentPreviewPath;
          this.closePreviewModal();
          this.editFile(encodeURIComponent(path));
        }
      });
    }

    // Capture preview modal actions
    if (this.capturePreviewRenameBtn) {
      this.capturePreviewRenameBtn.addEventListener('click', () => {
        if (this.currentCaptureItem) {
          const item = this.currentCaptureItem;
          this.closeCaptureModal();
          this.openRenameModal(item.path, item.name, 'capture');
        }
      });
    }
    if (this.capturePreviewDeleteBtn) {
      this.capturePreviewDeleteBtn.addEventListener('click', () => {
        if (this.currentCaptureItem) {
          const path = this.currentCaptureItem.path;
          this.closeCaptureModal();
          this.deleteCapture(encodeURIComponent(path));
        }
      });
    }

    // Rename modal actions
    if (this.renameConfirmBtn) {
      this.renameConfirmBtn.addEventListener('click', () => this.confirmRename());
    }
    if (this.renameNewNameInput) {
      this.renameNewNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.confirmRename();
        if (e.key === 'Escape') this.closeRenameModal();
      });
    }

    // Click outside to close header popup
    document.addEventListener('click', (e) => {
      if (!this.isHeaderPopupOpen) return;
      const popup = this.headerRecordingPopup;
      const indicator = this.headerRecordingIndicator;
      if (popup && !popup.contains(e.target) && indicator && !indicator.contains(e.target)) {
        this.closeHeaderPopup();
      }
    });
  }

  startPolling() {
    this.pollInterval = setInterval(() => {
      this.loadJobs();
    }, 2000);
  }

  async loadData() {
    await Promise.all([
      this.loadJobs(),
      this.loadRecordings(),
      this.loadCaptures()
    ]);
    this.render();
  }

  async loadJobs() {
    try {
      const res = await fetch('/api/recorder/jobs');
      const data = await res.json();
      this.jobs = data.jobs || [];
      this.updateBadge();
      if (this.isHeaderPopupOpen) {
        this.renderHeaderPopup();
      }
    } catch (e) {
      // Ignore polling errors
    }
  }

  async loadRecordings() {
    try {
      const res = await fetch('/api/recordings');
      const data = await res.json();
      this.recordings = data.recordings || [];
    } catch (e) {
      console.error(e);
    }
  }

  async loadCaptures() {
    try {
      const res = await fetch('/api/captures');
      const data = await res.json();
      this.captures = data.captures || [];
    } catch (e) {
      console.error(e);
    }
  }

  // ================= Header Recording Indicator & Realtime Popup =================
  updateBadge() {
    const activeJobs = this.jobs.filter(j => j.status === 'recording' || j.status === 'paused');
    const activeCount = activeJobs.length;
    if (this.recorderBadge) {
      this.recorderBadge.textContent = activeCount;
    }

    const indicator = this.headerRecordingIndicator;
    const textEl = this.headerRecordingText;
    if (indicator && textEl) {
      if (activeCount > 0) {
        indicator.style.display = 'inline-flex';
        const isPausedOnly = activeJobs.every(j => j.status === 'paused');
        if (isPausedOnly) {
          textEl.textContent = `${activeCount}개 일시정지`;
        } else {
          textEl.textContent = `${activeCount}개 녹화 중`;
        }
      } else {
        indicator.style.display = 'none';
        if (this.isHeaderPopupOpen && this.jobs.length === 0) {
          this.closeHeaderPopup();
        }
      }
    }

    if (this.recPopupCountBadge) {
      this.recPopupCountBadge.textContent = this.jobs.length;
    }
  }

  toggleHeaderPopup(event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (this.isHeaderPopupOpen) {
      this.closeHeaderPopup();
    } else {
      this.openHeaderPopup();
    }
  }

  openHeaderPopup() {
    this.isHeaderPopupOpen = true;
    if (this.headerRecordingPopup) {
      this.headerRecordingPopup.style.display = 'flex';
      this.renderHeaderPopup();
    }
  }

  closeHeaderPopup() {
    this.isHeaderPopupOpen = false;
    if (this.headerRecordingPopup) {
      this.headerRecordingPopup.style.display = 'none';
    }
  }

  renderHeaderPopup() {
    if (!this.recPopupBody) return;

    if (!this.jobs || this.jobs.length === 0) {
      this.recPopupBody.innerHTML = `
        <div style="text-align: center; padding: 28px 12px; color: var(--text-muted); font-size: 13px;">
          <div style="font-size: 24px; margin-bottom: 6px;">📼</div>
          현재 진행 중인 녹화 작업이 없습니다.<br>
          <span style="font-size: 11.5px; color: var(--text-dim);">멀티뷰 화면 우상단의 [녹화] 버튼을 눌러 방송을 녹화하세요.</span>
        </div>
      `;
      return;
    }

    this.recPopupBody.innerHTML = this.jobs.map(j => {
      let statusHtml = '';
      let actionButtons = '';
      let errorAlert = '';
      let cardClass = 'rec-job-card';

      if (j.status === 'recording') {
        cardClass += ' is-recording';
        statusHtml = `
          <span style="color: #ef4444; font-weight: 800; display: flex; align-items: center; gap: 5px;">
            <span class="live-dot-pulse" style="width: 7px; height: 7px; background: #ef4444;"></span>
            <span>녹화 진행 중</span>
          </span>
        `;
        actionButtons = `
          <button class="btn btn-sm" onclick="window.recorderUI.pauseJob('${j.jobId}')" title="녹화 일시정지">⏸ 일시정지</button>
          <button class="btn btn-sm btn-danger" onclick="window.recorderUI.stopJob('${j.jobId}')" title="녹화 중지 및 MP4 저장">⏹ 정지</button>
        `;
      } else if (j.status === 'paused') {
        cardClass += ' is-paused';
        statusHtml = `<span style="color: #f59e0b; font-weight: 800;">❚❚ 일시정지됨</span>`;
        actionButtons = `
          <button class="btn btn-sm btn-primary" onclick="window.recorderUI.resumeJob('${j.jobId}')" title="녹화 재개">▶ 재개</button>
          <button class="btn btn-sm btn-danger" onclick="window.recorderUI.stopJob('${j.jobId}')" title="녹화 중지 및 MP4 저장">⏹ 정지</button>
        `;
      } else if (j.status === 'finalizing') {
        statusHtml = `<span style="color: #38bdf8; font-weight: 800;">⏳ MP4 변환 중...</span>`;
        actionButtons = `<span style="font-size: 11px; color: var(--text-muted);">저장 처리 중</span>`;
      } else if (j.status === 'completed') {
        statusHtml = `<span style="color: #00ffa3; font-weight: 800;">✓ 녹화 완료</span>`;
        actionButtons = `
          <button class="btn btn-sm" onclick="window.recorderUI.previewFile('${encodeURIComponent(j.finalPath || '')}', '${escapeRecHtml(j.title || '녹화 영상')}'); window.recorderUI.closeHeaderPopup();">▶ 재생</button>
          <button class="btn btn-sm btn-primary" onclick="window.recorderUI.editFile('${encodeURIComponent(j.finalPath || '')}'); window.recorderUI.closeHeaderPopup();">✂️ 편집</button>
          <button class="btn btn-sm" onclick="window.recorderUI.deleteJob('${j.jobId}')" title="목록에서 제거">✕</button>
        `;
      } else if (j.status === 'error') {
        cardClass += ' is-error';
        statusHtml = `<span style="color: #f87171; font-weight: 800;">✕ 녹화 오류</span>`;
        errorAlert = `
          <div style="background: rgba(239,68,68,0.18); border: 1px solid rgba(239,68,68,0.4); border-radius: 4px; padding: 6px 8px; font-size: 11px; color: #fca5a5; line-height: 1.4; word-break: break-all; margin-top: 4px;">
            ⚠️ ${escapeRecHtml(j.errorMessage || '스트림 연결 중 예기치 않은 오류가 발생했습니다.')}
          </div>
        `;
        actionButtons = `<button class="btn btn-sm btn-danger" onclick="window.recorderUI.deleteJob('${j.jobId}')">작업 삭제</button>`;
      }

      const durStr = this.formatDuration(j.duration || 0);
      const sizeStr = this.formatBytes(j.fileSize || 0);

      return `
        <div class="${cardClass}">
          <div class="rec-job-top">
            <span class="rec-job-name" title="${escapeRecHtml(j.channelName)}">${escapeRecHtml(j.channelName)}</span>
            <span style="font-size: 11px; color: var(--accent-color); font-weight: 700;">${escapeRecHtml(j.qualityName || '원본')}</span>
          </div>
          <div class="rec-job-title" title="${escapeRecHtml(j.title)}">${escapeRecHtml(j.title || '방송 제목')}</div>
          ${errorAlert}
          <div class="rec-job-status-row">
            <div>${statusHtml}</div>
            <div class="rec-job-metrics">
              <span title="녹화 진행 시간">⏱ ${durStr}</span>
              <span title="현재 파일 크기">💾 ${sizeStr}</span>
            </div>
          </div>
          <div class="rec-job-actions" style="margin-top: 6px; justify-content: flex-end;">
            ${actionButtons}
          </div>
        </div>
      `;
    }).join('');
  }

  // ================= Subtabs & View Modes =================
  setSubtab(tab) {
    this.subtab = tab;
    document.querySelectorAll('.recorder-subtab').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-subtab') === tab);
    });
    this.currentPage = 1;
    this.render();
  }

  setViewMode(mode) {
    this.viewMode = mode;
    if (this.viewModeGridBtn) this.viewModeGridBtn.classList.toggle('active', mode === 'grid');
    if (this.viewModeListBtn) this.viewModeListBtn.classList.toggle('active', mode === 'list');
    this.render();
  }

  // ================= Formatting Helpers =================
  formatDuration(seconds) {
    const s = Math.floor(seconds || 0);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
  }

  formatDate(timestamp) {
    if (!timestamp) return '';
    const d = new Date(timestamp * 1000);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day} ${hh}:${mm}`;
  }

  formatDateOnly(timestamp) {
    if (!timestamp) return '알 수 없음';
    const d = new Date(timestamp * 1000);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // ================= Filter, Pagination & Main Render =================
  render() {
    // 1. Prepare items with type tag
    const vList = (this.recordings || []).map(r => ({ ...r, itemType: 'video' }));
    const cList = (this.captures || []).map(c => ({ ...c, itemType: 'capture' }));

    // Update count badges on subtabs
    if (this.recCountAll) this.recCountAll.textContent = vList.length + cList.length;
    if (this.recCountVideos) this.recCountVideos.textContent = vList.length;
    if (this.recCountCaptures) this.recCountCaptures.textContent = cList.length;

    // 2. Filter by subtab
    let combined = [];
    if (this.subtab === 'all') {
      combined = [...vList, ...cList];
    } else if (this.subtab === 'videos') {
      combined = [...vList];
    } else if (this.subtab === 'captures') {
      combined = [...cList];
    }

    // 3. Filter by search query (file name, streamer name)
    if (this.searchQuery) {
      combined = combined.filter(item => {
        const name = (item.name || '').toLowerCase();
        const streamer = (item.streamerName || '').toLowerCase();
        return name.includes(this.searchQuery) || streamer.includes(this.searchQuery);
      });
    }

    // 4. Filter by date (YYYY-MM-DD)
    if (this.dateFilter) {
      combined = combined.filter(item => {
        const itemDate = item.date || this.formatDateOnly(item.modified);
        return itemDate === this.dateFilter;
      });
    }

    // 5. Sort latest first
    combined.sort((a, b) => (b.modified || 0) - (a.modified || 0));

    const totalItems = combined.length;

    if (!this.recordingsContainer) return;

    if (totalItems === 0) {
      this.recordingsContainer.innerHTML = `
        <div style="text-align: center; padding: 50px 20px; color: var(--text-muted); background: var(--bg-secondary); border-radius: 8px; border: 1px dashed var(--border-color); margin-top: 10px;">
          <div style="font-size: 32px; margin-bottom: 10px;">📁</div>
          <div style="font-size: 15px; font-weight: 700; color: #cbd5e1; margin-bottom: 6px;">표시할 파일이 없습니다.</div>
          <div style="font-size: 12.5px; color: var(--text-dim);">검색어나 날짜 필터를 확인하시거나, 멀티뷰에서 화면 녹화 또는 캡처를 진행하세요.</div>
        </div>
      `;
      if (this.recordingsPagination) this.recordingsPagination.style.display = 'none';
      return;
    }

    // 6. Pagination calculation
    const totalPages = Math.ceil(totalItems / this.pageSize);
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    if (this.currentPage < 1) this.currentPage = 1;

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, totalItems);
    const pageItems = combined.slice(startIndex, endIndex);

    // 7. Render view (Grouped by date OR Normal page)
    if (this.groupByDate) {
      this.renderDateGrouped(pageItems, startIndex, endIndex, totalItems, totalPages);
    } else {
      this.renderNormalView(pageItems, startIndex, endIndex, totalItems, totalPages);
    }

    // 8. Render Pagination bar
    this.renderPaginationBar(startIndex, endIndex, totalItems, totalPages);
  }

  renderNormalView(items) {
    if (this.viewMode === 'grid') {
      this.recordingsContainer.innerHTML = `
        <div class="recordings-grid">
          ${items.map(item => this.renderCardHtml(item)).join('')}
        </div>
      `;
    } else {
      this.recordingsContainer.innerHTML = `
        <div style="overflow-x: auto; background: var(--bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
          <table class="files-table">
            <thead>
              <tr>
                <th>파일명</th>
                <th>유형</th>
                <th>크기</th>
                <th>생성 일시</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => this.renderTableRowHtml(item)).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
  }

  renderDateGrouped(items) {
    // Group page items by date string
    const groups = {};
    items.forEach(item => {
      const d = item.date || this.formatDateOnly(item.modified);
      if (!groups[d]) groups[d] = [];
      groups[d].push(item);
    });

    const dates = Object.keys(groups);

    let html = '';
    dates.forEach(d => {
      const groupItems = groups[d];
      html += `
        <div class="date-group-section">
          <div class="date-group-header">
            <span>📅 ${d}</span>
            <span style="font-size: 11.5px; opacity: 0.85;">${groupItems.length}개 파일</span>
          </div>
      `;

      if (this.viewMode === 'grid') {
        html += `
          <div class="recordings-grid">
            ${groupItems.map(item => this.renderCardHtml(item)).join('')}
          </div>
        `;
      } else {
        html += `
          <div style="overflow-x: auto; background: var(--bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
            <table class="files-table">
              <thead>
                <tr>
                  <th>파일명</th>
                  <th>유형</th>
                  <th>크기</th>
                  <th>생성 일시</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                ${groupItems.map(item => this.renderTableRowHtml(item)).join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      html += `</div>`;
    });

    this.recordingsContainer.innerHTML = html;
  }

  renderCardHtml(item) {
    const isVideo = item.itemType === 'video';
    const dateStr = this.formatDate(item.modified);
    const sizeStr = this.formatBytes(item.size);
    const encPath = encodeURIComponent(item.path);
    const escName = escapeRecHtml(item.name);

    if (isVideo) {
      const thumbUrl = `/api/media/thumbnail?path=${encPath}`;
      const durStr = item.duration ? this.formatDuration(item.duration) : '';
      return `
        <div class="recording-card">
          <div class="card-thumb-wrap" onclick="window.recorderUI.previewFile('${encPath}', '${escName}')" title="클릭하여 미리보기">
            <img src="${thumbUrl}" alt="${escName}" onerror="this.onerror=null; this.src='/static/img/video_placeholder.png';" loading="lazy">
            <span class="card-type-badge video">MP4</span>
            ${durStr ? `<span class="card-thumb-duration">${durStr}</span>` : ''}
          </div>
          <div class="card-content">
            <div class="card-file-name" title="${escName}">${escName}</div>
            <div class="card-meta-row">
              <span>${dateStr}</span>
              <span style="font-weight: 700; color: #fff;">${sizeStr}</span>
            </div>
          </div>
          <div class="card-actions-bar">
            <button class="btn btn-sm" onclick="window.recorderUI.previewFile('${encPath}', '${escName}')" title="미리보기">▶ 재생</button>
            <button class="btn btn-sm btn-primary" onclick="window.recorderUI.editFile('${encPath}')" title="영상 컷편집실로 가져오기">✂️ 편집실</button>
            <button class="btn btn-sm" onclick="window.recorderUI.openRenameModal('${item.path.replace(/\\/g, '\\\\')}', '${escName}', 'video')" title="파일명 변경">✏️</button>
            <button class="btn btn-sm btn-danger" onclick="window.recorderUI.deleteFile('${encPath}')" title="삭제">🗑️</button>
          </div>
        </div>
      `;
    } else {
      // Capture screenshot card
      const streamUrl = `/api/media/stream?path=${encPath}`;
      return `
        <div class="recording-card">
          <div class="card-thumb-wrap" onclick="window.recorderUI.openCaptureModal('${item.path.replace(/\\/g, '\\\\')}', '${escName}', ${item.size || 0}, ${item.modified || 0})" title="클릭하여 원본 확대 보기">
            <img src="${streamUrl}" alt="${escName}" loading="lazy">
            <span class="card-type-badge capture">캡처</span>
          </div>
          <div class="card-content">
            <div class="card-file-name" title="${escName}">${escName}</div>
            <div class="card-meta-row">
              <span>${dateStr}</span>
              <span style="font-weight: 700; color: #fff;">${sizeStr}</span>
            </div>
          </div>
          <div class="card-actions-bar">
            <button class="btn btn-sm" onclick="window.recorderUI.openCaptureModal('${item.path.replace(/\\/g, '\\\\')}', '${escName}', ${item.size || 0}, ${item.modified || 0})" title="이미지 확대 보기">🔍 확대</button>
            <a href="${streamUrl}" download="${escName}" class="btn btn-sm btn-primary" title="이미지 다운로드">💾 저장</a>
            <button class="btn btn-sm" onclick="window.recorderUI.openRenameModal('${item.path.replace(/\\/g, '\\\\')}', '${escName}', 'capture')" title="파일명 변경">✏️</button>
            <button class="btn btn-sm btn-danger" onclick="window.recorderUI.deleteCapture('${encPath}')" title="삭제">🗑️</button>
          </div>
        </div>
      `;
    }
  }

  renderTableRowHtml(item) {
    const isVideo = item.itemType === 'video';
    const dateStr = this.formatDate(item.modified);
    const sizeStr = this.formatBytes(item.size);
    const encPath = encodeURIComponent(item.path);
    const escName = escapeRecHtml(item.name);

    if (isVideo) {
      return `
        <tr>
          <td style="font-weight: 600; max-width: 380px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escName}">
            <span style="color: #ef4444; margin-right: 6px;">🎬</span>
            <span onclick="window.recorderUI.previewFile('${encPath}', '${escName}')" style="cursor: pointer; text-decoration: underline;">${escName}</span>
          </td>
          <td><span class="badge" style="background: rgba(239, 68, 68, 0.2); color: #f87171; font-weight: 700;">MP4 영상</span></td>
          <td style="font-family: monospace;">${sizeStr}</td>
          <td style="font-size: 12px; color: var(--text-muted);">${dateStr}</td>
          <td>
            <div style="display: flex; gap: 5px; flex-wrap: nowrap;">
              <button class="btn btn-sm" onclick="window.recorderUI.previewFile('${encPath}', '${escName}')">▶ 재생</button>
              <button class="btn btn-sm btn-primary" onclick="window.recorderUI.editFile('${encPath}')">✂️ 편집실</button>
              <button class="btn btn-sm" onclick="window.recorderUI.openRenameModal('${item.path.replace(/\\/g, '\\\\')}', '${escName}', 'video')">✏️ 이름</button>
              <button class="btn btn-sm btn-danger" onclick="window.recorderUI.deleteFile('${encPath}')">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    } else {
      const streamUrl = `/api/media/stream?path=${encPath}`;
      return `
        <tr>
          <td style="font-weight: 600; max-width: 380px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escName}">
            <span style="color: #3b82f6; margin-right: 6px;">📸</span>
            <span onclick="window.recorderUI.openCaptureModal('${item.path.replace(/\\/g, '\\\\')}', '${escName}', ${item.size || 0}, ${item.modified || 0})" style="cursor: pointer; text-decoration: underline;">${escName}</span>
          </td>
          <td><span class="badge" style="background: rgba(59, 130, 246, 0.2); color: #93c5fd; font-weight: 700;">캡처 이미지</span></td>
          <td style="font-family: monospace;">${sizeStr}</td>
          <td style="font-size: 12px; color: var(--text-muted);">${dateStr}</td>
          <td>
            <div style="display: flex; gap: 5px; flex-wrap: nowrap;">
              <button class="btn btn-sm" onclick="window.recorderUI.openCaptureModal('${item.path.replace(/\\/g, '\\\\')}', '${escName}', ${item.size || 0}, ${item.modified || 0})">🔍 확대</button>
              <a href="${streamUrl}" download="${escName}" class="btn btn-sm btn-primary">💾 저장</a>
              <button class="btn btn-sm" onclick="window.recorderUI.openRenameModal('${item.path.replace(/\\/g, '\\\\')}', '${escName}', 'capture')">✏️ 이름</button>
              <button class="btn btn-sm btn-danger" onclick="window.recorderUI.deleteCapture('${encPath}')">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }
  }

  // ================= Pagination Controls =================
  renderPaginationBar(startIdx, endIdx, total, totalPages) {
    if (!this.recordingsPagination) return;
    if (totalPages <= 1) {
      this.recordingsPagination.style.display = 'none';
      return;
    }

    this.recordingsPagination.style.display = 'flex';

    // Generate page buttons
    const cur = this.currentPage;
    let pagesHtml = '';

    // First & Prev
    pagesHtml += `
      <button class="page-btn" onclick="window.recorderUI.goToPage(1)" ${cur === 1 ? 'disabled' : ''} title="첫 페이지">«</button>
      <button class="page-btn" onclick="window.recorderUI.goToPage(${cur - 1})" ${cur === 1 ? 'disabled' : ''} title="이전 페이지">‹</button>
    `;

    // Window around current page
    let startPage = Math.max(1, cur - 2);
    let endPage = Math.min(totalPages, cur + 2);
    if (cur <= 3) endPage = Math.min(5, totalPages);
    if (cur >= totalPages - 2) startPage = Math.max(1, totalPages - 4);

    for (let p = startPage; p <= endPage; p++) {
      pagesHtml += `
        <button class="page-btn ${p === cur ? 'active' : ''}" onclick="window.recorderUI.goToPage(${p})">${p}</button>
      `;
    }

    // Next & Last
    pagesHtml += `
      <button class="page-btn" onclick="window.recorderUI.goToPage(${cur + 1})" ${cur === totalPages ? 'disabled' : ''} title="다음 페이지">›</button>
      <button class="page-btn" onclick="window.recorderUI.goToPage(${totalPages})" ${cur === totalPages ? 'disabled' : ''} title="마지막 페이지">»</button>
    `;

    this.recordingsPagination.innerHTML = `
      <div style="font-size: 12px; color: var(--text-muted);">
        총 <strong style="color: #fff;">${total}</strong>개 파일 중 <strong style="color: var(--accent-color);">${startIdx + 1} - ${endIdx}</strong>개 표시
      </div>
      <div class="pagination-pages">
        ${pagesHtml}
      </div>
      <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted);">
        <span>페이지당:</span>
        <select class="input-box" style="padding: 2px 6px; font-size: 12px;" onchange="window.recorderUI.setPageSize(this.value)">
          <option value="12" ${this.pageSize === 12 ? 'selected' : ''}>12개</option>
          <option value="24" ${this.pageSize === 24 ? 'selected' : ''}>24개</option>
          <option value="48" ${this.pageSize === 48 ? 'selected' : ''}>48개</option>
        </select>
      </div>
    `;
  }

  goToPage(page) {
    this.currentPage = page;
    this.render();
    if (this.recordingsContainer) {
      this.recordingsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  setPageSize(size) {
    this.pageSize = parseInt(size, 10) || 12;
    this.currentPage = 1;
    this.render();
  }

  // ================= Job Actions =================
  async pauseJob(jobId) {
    await fetch(`/api/recorder/pause/${jobId}`, { method: 'POST' });
    this.loadJobs();
    if (window.app) window.app.showToast('녹화를 일시정지했습니다.', 'info');
  }

  async resumeJob(jobId) {
    await fetch(`/api/recorder/resume/${jobId}`, { method: 'POST' });
    this.loadJobs();
    if (window.app) window.app.showToast('녹화를 재개했습니다.', 'success');
  }

  async stopJob(jobId) {
    if (window.app) window.app.showToast('녹화를 중지하고 MP4 파일로 병합합니다...', 'info');
    await fetch(`/api/recorder/stop/${jobId}`, { method: 'POST' });
    setTimeout(() => {
      this.loadJobs();
      this.loadRecordings();
      this.render();
    }, 1500);
  }

  async deleteJob(jobId) {
    await fetch(`/api/recorder/${jobId}`, { method: 'DELETE' });
    this.loadJobs();
  }

  async clearCompleted() {
    await fetch('/api/recorder/clear-completed', { method: 'POST' });
    this.loadJobs();
  }

  async openFolder() {
    await fetch('/api/utils/open-folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder: 'recordings' })
    });
  }

  async promptDirectRecord() {
    const val = prompt('녹화할 치지직 채널 ID 또는 스트리머명을 입력하세요:');
    if (!val) return;

    if (window.app) window.app.showToast(`'${val}' 방송 정보 조회 중...`, 'info');

    try {
      let chId = val.trim();
      let res = await fetch(`/api/live/${chId}`);
      let data = await res.json();

      if (!data.success || !data.masterUrl) {
        const sRes = await fetch(`/api/channels/search?keyword=${encodeURIComponent(chId)}`);
        const sData = await sRes.json();
        if (sData.success && sData.channels && sData.channels.length > 0) {
          chId = sData.channels[0].channelId;
          res = await fetch(`/api/live/${chId}`);
          data = await res.json();
        }
      }

      if (data.success && data.masterUrl) {
        await fetch('/api/recorder/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel_id: data.channelId,
            channel_name: data.channelName,
            title: data.title,
            quality_name: 'Original',
            stream_url: data.masterUrl
          })
        });
        if (window.app) window.app.showToast(`'${data.channelName}' 녹화 시작!`, 'success');
        this.loadJobs();
        this.openHeaderPopup();
      } else {
        if (window.app) window.app.showToast('현재 방송 중이 아니거나 정보를 찾을 수 없습니다.', 'error');
      }
    } catch (e) {
      console.error(e);
      if (window.app) window.app.showToast('녹화 시작 오류', 'error');
    }
  }

  // ================= Editor Integration (Item 4) =================
  editFile(encodedPath) {
    const filePath = decodeURIComponent(encodedPath);
    if (window.app) {
      window.app.switchTab('editor');
      if (window.editorUI) {
        window.editorUI.selectSourceByPath(filePath);
        window.app.showToast(`'${filePath.split(/[/\\]/).pop()}' 영상을 편집실로 가져왔습니다.`, 'success');
      }
    }
  }

  // ================= File Deletion =================
  async deleteFile(encodedPath) {
    const filePath = decodeURIComponent(encodedPath);
    const fileName = filePath.split(/[/\\]/).pop();
    if (!confirm(`정말로 이 녹화 영상 파일('${fileName}')을 삭제하시겠습니까?`)) return;

    if (this.currentPreviewPath === filePath) {
      this.closePreviewModal();
    }

    try {
      const res = await fetch('/api/editor/file', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_path: filePath })
      });
      const data = await res.json();
      if (data.success) {
        if (window.app) window.app.showToast('녹화 파일이 삭제되었습니다.', 'success');
        await this.loadRecordings();
        this.render();
      } else {
        if (window.app) window.app.showToast('파일 삭제 실패 (파일이 사용 중이거나 이미 삭제되었습니다)', 'error');
      }
    } catch (e) {
      console.error(e);
      if (window.app) window.app.showToast('파일 삭제 중 오류 발생', 'error');
    }
  }

  async deleteCapture(encodedPath) {
    const filePath = decodeURIComponent(encodedPath);
    const fileName = filePath.split(/[/\\]/).pop();
    if (!confirm(`정말로 이 캡처 이미지('${fileName}')를 삭제하시겠습니까?`)) return;

    try {
      const res = await fetch('/api/editor/file', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_path: filePath })
      });
      const data = await res.json();
      if (data.success) {
        if (window.app) window.app.showToast('캡처 이미지가 삭제되었습니다.', 'success');
        await this.loadCaptures();
        this.render();
      } else {
        if (window.app) window.app.showToast('캡처 삭제 실패', 'error');
      }
    } catch (e) {
      console.error(e);
      if (window.app) window.app.showToast('삭제 중 오류 발생', 'error');
    }
  }

  // ================= Rename Modal & API (Item 5) =================
  openRenameModal(filePath, currentName, type) {
    this.renameTarget = { filePath, currentName, type };
    if (this.renameCurrentName) this.renameCurrentName.textContent = currentName;

    // Separate extension
    const dotIdx = currentName.lastIndexOf('.');
    let base = currentName;
    let ext = type === 'capture' ? '.png' : '.mp4';
    if (dotIdx !== -1) {
      base = currentName.substring(0, dotIdx);
      ext = currentName.substring(dotIdx);
    }

    if (this.renameNewNameInput) {
      this.renameNewNameInput.value = base;
    }
    if (this.renameExtLabel) {
      this.renameExtLabel.textContent = ext;
    }
    if (this.renameModal) {
      this.renameModal.classList.add('active');
      setTimeout(() => {
        if (this.renameNewNameInput) {
          this.renameNewNameInput.focus();
          this.renameNewNameInput.select();
        }
      }, 50);
    }
  }

  closeRenameModal() {
    if (this.renameModal) this.renameModal.classList.remove('active');
    this.renameTarget = null;
  }

  async confirmRename() {
    if (!this.renameTarget || !this.renameNewNameInput) return;
    const base = this.renameNewNameInput.value.trim();
    if (!base) {
      if (window.app) window.app.showToast('변경할 파일명을 입력해주세요.', 'warning');
      return;
    }

    const ext = this.renameExtLabel ? this.renameExtLabel.textContent : '';
    const newFullName = base.endsWith(ext) ? base : (base + ext);

    if (newFullName === this.renameTarget.currentName) {
      this.closeRenameModal();
      return;
    }

    try {
      const res = await fetch('/api/recordings/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_path: this.renameTarget.filePath,
          new_name: newFullName
        })
      });
      const data = await res.json();
      if (data.success) {
        if (window.app) window.app.showToast(`파일명이 '${data.newName || newFullName}'(으)로 변경되었습니다.`, 'success');
        this.closeRenameModal();
        await this.loadData();
      } else {
        if (window.app) window.app.showToast(data.error || '파일명 변경에 실패했습니다.', 'error');
      }
    } catch (e) {
      console.error(e);
      if (window.app) window.app.showToast('파일명 변경 중 오류 발생', 'error');
    }
  }

  // ================= Capture Preview Modal =================
  openCaptureModal(filePath, fileName, size, modified) {
    this.currentCaptureItem = { path: filePath, name: fileName, size, modified };
    if (this.capturePreviewFileName) this.capturePreviewFileName.textContent = fileName || '캡처 이미지';
    if (this.capturePreviewImg) {
      this.capturePreviewImg.src = `/api/media/stream?path=${encodeURIComponent(filePath)}`;
    }
    if (this.capturePreviewMeta) {
      const dateStr = this.formatDate(modified);
      const sizeStr = this.formatBytes(size);
      this.capturePreviewMeta.textContent = `${fileName} (${sizeStr}) - ${dateStr}`;
    }
    if (this.capturePreviewDownloadLink) {
      this.capturePreviewDownloadLink.href = `/api/media/stream?path=${encodeURIComponent(filePath)}`;
      this.capturePreviewDownloadLink.download = fileName;
    }
    if (this.capturePreviewModal) {
      this.capturePreviewModal.classList.add('active');
    }
  }

  closeCaptureModal() {
    if (this.capturePreviewImg) {
      this.capturePreviewImg.removeAttribute('src');
    }
    if (this.capturePreviewModal) {
      this.capturePreviewModal.classList.remove('active');
    }
    this.currentCaptureItem = null;
  }

  // ================= Video Preview Modal =================
  previewFile(encodedPath, fileName) {
    const filePath = decodeURIComponent(encodedPath);
    if (!filePath) return;
    this.currentPreviewPath = filePath;
    if (this.recordPreviewFileName) {
      this.recordPreviewFileName.textContent = fileName || '녹화 영상 미리보기';
    }
    if (this.recordPreviewMeta) {
      this.recordPreviewMeta.textContent = `파일: ${filePath}`;
    }
    if (this.recordPreviewVideo) {
      const masterVol = (window.app && typeof window.app.masterVolume === 'number') ? window.app.masterVolume : 1.0;
      const masterMuted = window.app ? window.app.masterMuted : false;
      this.recordPreviewVideo.muted = masterMuted;
      this.recordPreviewVideo.volume = masterMuted ? 0 : masterVol;
      this.recordPreviewVideo.src = `/api/media/stream?path=${encodeURIComponent(filePath)}`;
      this.recordPreviewVideo.play().catch(() => {});
    }
    if (this.recordPreviewModal) {
      this.recordPreviewModal.classList.add('active');
    }
  }

  closePreviewModal() {
    if (this.recordPreviewVideo) {
      this.recordPreviewVideo.pause();
      this.recordPreviewVideo.removeAttribute('src');
      this.recordPreviewVideo.load();
    }
    if (this.recordPreviewModal) {
      this.recordPreviewModal.classList.remove('active');
    }
    this.currentPreviewPath = null;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.recorderUI = new RecorderUI();
});
