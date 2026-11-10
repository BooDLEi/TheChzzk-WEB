/* ============================================================
   더치지직 (The Chzzk) - Video Cut & Trim Editor UI (editor_ui.js)
   ============================================================ */

function escapeEditorHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

class VideoEditorUI {
  constructor() {
    this.currentPath = null;
    this.duration = 0;
    this.startTime = 0;
    this.endTime = 0;
    this.video = null;
    this.allSources = [];
    this.allClips = [];

    // Multi-cut & subtitle states
    this.segments = [];
    this.subtitles = [];
    this.cutMode = 'keep'; // 'keep' or 'cut_out'

    this.init();
  }

  init() {
    this.video = document.getElementById('editorVideo');
    this.bindEvents();
    this.loadSources();
    this.loadClipsList();
  }

  bindEvents() {
    const v = this.video;
    if (!v) return;

    v.addEventListener('loadedmetadata', () => {
      this.duration = v.duration;
      this.startTime = 0;
      this.endTime = this.duration;
      this.updateTimeDisplay();
      this.updateTimelineMarks();
      const durEl = document.getElementById('totalDurationDisplay');
      if (durEl) durEl.textContent = this.formatTime(this.duration);
    });

    v.addEventListener('timeupdate', () => {
      this.updateTimeDisplay();
      this.updatePlayhead();
      this.updateSubtitleOverlay();
    });

    // Source selector change
    const sourceSelect = document.getElementById('editorSourceSelect');
    if (sourceSelect) {
      sourceSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val) this.loadVideo(val);
      });
    }

    const refreshBtn = document.getElementById('refreshEditorSourcesBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadSources();
        this.loadClipsList();
      });
    }

    // Timeline bar click / scrub
    const timelineBar = document.getElementById('timelineBar');
    if (timelineBar) {
      timelineBar.addEventListener('click', (e) => {
        if (this.duration <= 0) return;
        const rect = timelineBar.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        v.currentTime = Math.max(0, Math.min(this.duration, pos * this.duration));
      });
    }

    // Set In / Out buttons
    document.getElementById('setStartBtn')?.addEventListener('click', () => {
      this.startTime = v.currentTime;
      if (this.startTime > this.endTime) {
        this.endTime = this.duration;
      }
      this.updateTimeDisplay();
      this.updateTimelineMarks();
    });

    document.getElementById('setEndBtn')?.addEventListener('click', () => {
      this.endTime = v.currentTime;
      if (this.endTime < this.startTime) {
        this.startTime = 0;
      }
      this.updateTimeDisplay();
      this.updateTimelineMarks();
    });

    // Step frame buttons
    document.getElementById('stepBackSmall')?.addEventListener('click', () => v.currentTime = Math.max(0, v.currentTime - 0.1));
    document.getElementById('stepBackSec')?.addEventListener('click', () => v.currentTime = Math.max(0, v.currentTime - 1.0));
    document.getElementById('stepFwdSmall')?.addEventListener('click', () => v.currentTime = Math.min(this.duration, v.currentTime + 0.1));
    document.getElementById('stepFwdSec')?.addEventListener('click', () => v.currentTime = Math.min(this.duration, v.currentTime + 1.0));

    // Jump to In / Out
    document.getElementById('jumpStartBtn')?.addEventListener('click', () => v.currentTime = this.startTime);
    document.getElementById('jumpEndBtn')?.addEventListener('click', () => v.currentTime = this.endTime);

    // Play selection preview
    document.getElementById('playPreviewBtn')?.addEventListener('click', () => {
      this.previewSegment(this.startTime, this.endTime);
    });

    // Multi-cut segment controls
    document.getElementById('addSegmentBtn')?.addEventListener('click', () => {
      this.addCurrentSegment();
    });

    document.getElementById('clearSegmentsBtn')?.addEventListener('click', () => {
      this.clearSegments();
    });

    document.querySelectorAll('input[name="multiCutMode"]').forEach(r => {
      r.addEventListener('change', (e) => {
        this.cutMode = e.target.value;
      });
    });

    // Subtitle controls
    document.getElementById('addSubtitleBtn')?.addEventListener('click', () => {
      this.addSubtitle();
    });

    // Export cut button
    document.getElementById('exportCutBtn')?.addEventListener('click', () => this.exportCut());

    // Open clips folder
    document.getElementById('openClipsFolderBtn')?.addEventListener('click', () => {
      fetch('/api/utils/open-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'clips' })
      });
    });
  }

  // ================= Multi-Cut Segments =================
  addCurrentSegment() {
    if (this.endTime <= this.startTime) {
      if (window.app) window.app.showToast('시작점과 끝점을 먼저 올바르게 설정하세요.', 'error');
      return;
    }
    const newSeg = {
      id: Date.now() + Math.random(),
      start: parseFloat(this.startTime.toFixed(3)),
      end: parseFloat(this.endTime.toFixed(3))
    };
    this.segments.push(newSeg);
    this.segments.sort((a, b) => a.start - b.start);
    this.renderSegments();
    if (window.app) window.app.showToast(`구간 [${this.formatTime(newSeg.start)} ~ ${this.formatTime(newSeg.end)}]이 목록에 추가되었습니다.`, 'success');
  }

  removeSegment(id) {
    this.segments = this.segments.filter(s => s.id !== id);
    this.renderSegments();
  }

  clearSegments() {
    this.segments = [];
    this.renderSegments();
  }

  previewSegment(start, end) {
    const v = this.video;
    if (!v) return;
    v.currentTime = start;
    v.play();
    const checkEnd = () => {
      if (v.currentTime >= end) {
        v.pause();
        v.removeEventListener('timeupdate', checkEnd);
      }
    };
    v.addEventListener('timeupdate', checkEnd);
  }

  renderSegments() {
    const badge = document.getElementById('segmentsCountBadge');
    if (badge) badge.textContent = this.segments.length;

    const list = document.getElementById('editorSegmentsList');
    if (!list) return;

    if (this.segments.length === 0) {
      list.innerHTML = `
        <div style="font-size: 12px; color: var(--text-muted); text-align: center; padding: 20px 0;">
          상단에서 시작점/끝점을 잡고 [➕ 편집 구간 목록에 추가]를 누르세요.
        </div>
      `;
      return;
    }

    list.innerHTML = this.segments.map((s, idx) => {
      const dur = (s.end - s.start).toFixed(2);
      return `
        <div class="segment-item-row" data-id="${s.id}">
          <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
            <span style="font-weight: 700; color: var(--accent-color);">#${idx + 1}</span>
            <span style="font-family: monospace; color: #fff; font-size: 11.5px;">${this.formatTime(s.start)} ~ ${this.formatTime(s.end)}</span>
            <span style="font-size: 11px; color: var(--text-dim);">(${dur}초)</span>
          </div>
          <div style="display: flex; gap: 4px;">
            <button class="btn btn-sm" onclick="window.editorUI.previewSegment(${s.start}, ${s.end})" title="구간 미리보기" style="padding: 2px 6px; font-size: 11px;">▶ 재생</button>
            <button class="btn btn-sm btn-danger" onclick="window.editorUI.removeSegment(${s.id})" title="구간 삭제" style="padding: 2px 6px; font-size: 11px;">✕</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // ================= Subtitle Management =================
  addSubtitle() {
    const cur = this.video ? this.video.currentTime : 0;
    const newSub = {
      id: Date.now() + Math.random(),
      start: parseFloat(cur.toFixed(2)),
      end: parseFloat(Math.min(this.duration || (cur + 3.0), cur + 3.0).toFixed(2)),
      text: '새 자막 내용'
    };
    this.subtitles.push(newSub);
    this.subtitles.sort((a, b) => a.start - b.start);
    this.renderSubtitles();
    if (window.app) window.app.showToast('새 자막이 추가되었습니다.', 'info');
  }

  removeSubtitle(id) {
    this.subtitles = this.subtitles.filter(s => s.id !== id);
    this.renderSubtitles();
    this.updateSubtitleOverlay();
  }

  updateSubtitleTime(id, field, value) {
    const sub = this.subtitles.find(s => s.id === id);
    if (sub) {
      const val = parseFloat(value) || 0;
      sub[field] = Math.max(0, val);
      if (field === 'start' && sub.start > sub.end) sub.end = sub.start + 1.0;
      if (field === 'end' && sub.end < sub.start) sub.start = Math.max(0, sub.end - 1.0);
    }
  }

  updateSubtitleText(id, text) {
    const sub = this.subtitles.find(s => s.id === id);
    if (sub) {
      sub.text = text;
      this.updateSubtitleOverlay();
    }
  }

  seekTo(time) {
    if (this.video) {
      this.video.currentTime = time;
    }
  }

  renderSubtitles() {
    const badge = document.getElementById('subtitlesCountBadge');
    if (badge) badge.textContent = this.subtitles.length;

    const list = document.getElementById('editorSubtitlesList');
    if (!list) return;

    if (this.subtitles.length === 0) {
      list.innerHTML = `
        <div style="font-size: 12px; color: var(--text-muted); text-align: center; padding: 20px 0;">
          [+ 현재 위치에 자막 추가]를 눌러 원하는 구간에 텍스트 자막을 합성할 수 있습니다.
        </div>
      `;
      return;
    }

    list.innerHTML = this.subtitles.map((sub, idx) => {
      return `
        <div class="subtitle-item-row" data-id="${sub.id}" style="flex-direction: column; align-items: stretch; gap: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-weight: 700; color: var(--accent-color); font-size: 11px;">#${idx + 1} 자막</span>
              <input type="number" step="0.1" min="0" value="${sub.start}" style="width: 55px; padding: 2px 4px; font-size: 11px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); color: #fff; border-radius: 3px;" onchange="window.editorUI.updateSubtitleTime(${sub.id}, 'start', this.value)" title="시작 시간(초)">
              <span style="color: var(--text-dim);">~</span>
              <input type="number" step="0.1" min="0" value="${sub.end}" style="width: 55px; padding: 2px 4px; font-size: 11px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); color: #fff; border-radius: 3px;" onchange="window.editorUI.updateSubtitleTime(${sub.id}, 'end', this.value)" title="종료 시간(초)">
              <span style="font-size: 11px; color: var(--text-dim);">초</span>
            </div>
            <div style="display: flex; gap: 4px;">
              <button class="btn btn-sm" onclick="window.editorUI.seekTo(${sub.start})" title="이 위치로 이동" style="padding: 2px 6px; font-size: 11px;">이동</button>
              <button class="btn btn-sm btn-danger" onclick="window.editorUI.removeSubtitle(${sub.id})" title="자막 삭제" style="padding: 2px 6px; font-size: 11px;">✕</button>
            </div>
          </div>
          <input type="text" value="${escapeEditorHtml(sub.text)}" placeholder="자막 내용 입력..." style="width: 100%; padding: 4px 8px; font-size: 12px; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.2); color: #fff; border-radius: 3px;" oninput="window.editorUI.updateSubtitleText(${sub.id}, this.value)">
        </div>
      `;
    }).join('');
  }

  updateSubtitleOverlay() {
    const cur = this.video ? this.video.currentTime : 0;
    const active = this.subtitles.find(s => s.start <= cur && cur <= s.end);
    const overlay = document.getElementById('editorSubtitleOverlay');
    if (overlay) {
      if (active && active.text && active.text.trim()) {
        overlay.textContent = active.text;
        overlay.style.display = 'block';
      } else {
        overlay.style.display = 'none';
      }
    }
  }

  // ================= Sources & Video Loading =================
  async loadSources() {
    try {
      const [recRes, clipRes] = await Promise.all([
        fetch('/api/recordings').then(r => r.json()),
        fetch('/api/clips/files').then(r => r.json())
      ]);

      const recs = recRes.recordings || [];
      const clips = clipRes.clips || [];

      const select = document.getElementById('editorSourceSelect');
      if (!select) return;

      const prev = select.value;
      let html = '<option value="">-- 녹화 파일 또는 다운로드된 클립 선택 --</option>';

      if (recs.length > 0) {
        html += '<optgroup label="녹화된 영상">';
        recs.forEach(r => {
          html += `<option value="${r.path}">[녹화] ${r.name}</option>`;
        });
        html += '</optgroup>';
      }

      if (clips.length > 0) {
        html += '<optgroup label="다운로드 / 생성된 클립">';
        clips.forEach(c => {
          html += `<option value="${c.path}">[클립] ${c.name}</option>`;
        });
        html += '</optgroup>';
      }

      select.innerHTML = html;
      if (prev) select.value = prev;

    } catch (e) {
      console.error(e);
    }
  }

  selectSourceByPath(filePath) {
    const select = document.getElementById('editorSourceSelect');
    if (select) {
      select.value = filePath;
      this.loadVideo(filePath);
    }
  }

  handleLocalFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    this.loadVideo(blobUrl, file.name);
    if (window.app) window.app.showToast(`'${file.name}' 파일을 불러왔습니다.`, 'success');
  }

  loadVideo(filePath, customDisplayName = null) {
    this.currentPath = filePath;
    const v = this.video;
    if (!v) return;

    const masterVol = (window.app && typeof window.app.masterVolume === 'number') ? window.app.masterVolume : 1.0;
    const masterMuted = (window.app && typeof window.app.masterMuted === 'boolean') ? window.app.masterMuted : false;
    v.muted = masterMuted;
    v.volume = masterMuted ? 0 : masterVol;

    if (filePath.startsWith('blob:') || filePath.startsWith('http://') || filePath.startsWith('https://')) {
      v.src = filePath;
    } else {
      v.src = `/api/media/stream?path=${encodeURIComponent(filePath)}`;
    }
    v.load();

    const curFileNameEl = document.getElementById('editorCurrentFileName');
    const baseName = customDisplayName || filePath.split(/[/\\]/).pop();
    if (curFileNameEl) {
      curFileNameEl.textContent = baseName || filePath;
      curFileNameEl.title = baseName || filePath;
    }

    const outputNameInput = document.getElementById('cutOutputNameInput');
    if (outputNameInput) {
      const dotIdx = (baseName || 'output').lastIndexOf('.');
      const fileName = dotIdx !== -1 ? baseName.substring(0, dotIdx) : (baseName || 'output');
      outputNameInput.value = `${fileName}_cut.mp4`;
    }
  }

  updateTimeDisplay() {
    const v = this.video;
    if (!v) return;

    const cur = document.getElementById('currentTimeDisplay');
    const start = document.getElementById('startTimeDisplay');
    const end = document.getElementById('endTimeDisplay');
    const dur = document.getElementById('cutDurationDisplay');

    if (cur) cur.textContent = this.formatTime(v.currentTime);
    if (start) start.textContent = this.formatTime(this.startTime);
    if (end) end.textContent = this.formatTime(this.endTime);
    if (dur) dur.textContent = this.formatTime(Math.max(0, this.endTime - this.startTime));
  }

  updatePlayhead() {
    const v = this.video;
    const playhead = document.getElementById('timelinePlayhead');
    if (!v || !playhead || this.duration <= 0) return;

    const pct = (v.currentTime / this.duration) * 100;
    playhead.style.left = `${pct}%`;
  }

  updateTimelineMarks() {
    const cutRange = document.getElementById('timelineCutRange');
    if (!cutRange || this.duration <= 0) return;

    const startPct = (this.startTime / this.duration) * 100;
    const endPct = (this.endTime / this.duration) * 100;
    cutRange.style.left = `${startPct}%`;
    cutRange.style.width = `${Math.max(0, endPct - startPct)}%`;
  }

  formatTime(seconds) {
    if (isNaN(seconds) || seconds === null) return "00:00:00.000";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds - Math.floor(seconds)) * 1000);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }

  async exportCut() {
    if (!this.currentPath) {
      if (window.app) window.app.showToast('편집할 비디오를 먼저 선택하세요.', 'error');
      return;
    }

    const segmentsToCut = this.segments.length > 0 ? this.segments : [
      { start: this.startTime, end: this.endTime }
    ];

    if (segmentsToCut.length === 0 || (segmentsToCut.length === 1 && segmentsToCut[0].end <= segmentsToCut[0].start)) {
      if (window.app) window.app.showToast('유효한 편집 구간을 1개 이상 지정하세요.', 'error');
      return;
    }

    const outputName = document.getElementById('cutOutputNameInput')?.value.trim() || 'cut_clip.mp4';
    const isAccurate = document.getElementById('cutModeAccurate')?.checked || false;

    const exportBtn = document.getElementById('exportCutBtn');
    if (exportBtn) {
      exportBtn.disabled = true;
      exportBtn.textContent = '자르는 중... (잠시만 기다려주세요)';
    }

    // Web Browser / Blob Local File Direct Cut & Download
    if (this.currentPath.startsWith('blob:') || (window.webBackendPolyfill && window.webBackendPolyfill.isStaticWeb())) {
      await this.exportCutInBrowser(segmentsToCut[0], outputName, exportBtn);
      return;
    }

    const hasSubtitles = this.subtitles.length > 0;
    const segInfo = this.segments.length > 0 ? `${this.segments.length}개 다중 구간` : '지정 구간';
    if (window.app) window.app.showToast(`비디오 컷편집 시작 (${segInfo}${hasSubtitles ? ' + 자막 합성' : ''})...`, 'info');

    try {
      const res = await fetch('/api/editor/multi-cut', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input_path: this.currentPath,
          segments: segmentsToCut,
          mode: this.cutMode,
          subtitles: this.subtitles,
          output_name: outputName,
          accurate: isAccurate
        })
      });

      const data = await res.json();
      if (data.success) {
        if (window.app) window.app.showToast(`'${data.filename}' 클립 생성 완료!`, 'success');
        this.loadClipsList();
        this.loadSources();
      } else {
        if (window.app) window.app.showToast(data.error || '클립 내보내기 실패', 'error');
      }
    } catch (e) {
      console.error(e);
      if (window.app) window.app.showToast('클립 자르기 오류', 'error');
    } finally {
      if (exportBtn) {
        exportBtn.disabled = false;
        exportBtn.textContent = '클립 자르기 / 내보내기 (Export)';
      }
    }
  }

  async exportCutInBrowser(seg, outputName, exportBtn) {
    const v = this.video;
    if (!v) return;
    let stream = null;
    try {
      stream = v.captureStream ? v.captureStream() : v.mozCaptureStream();
    } catch (e) {}

    if (!stream) {
      if (window.app) window.app.showToast('현재 브라우저에서 영상 컷 스트림 캡처를 지원하지 않습니다.', 'error');
      if (exportBtn) {
        exportBtn.disabled = false;
        exportBtn.textContent = '클립 자르기 / 내보내기 (Export)';
      }
      return;
    }

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm';
    const rec = new MediaRecorder(stream, { mimeType });
    const chunks = [];

    rec.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunks.push(ev.data);
    };

    rec.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      const safeOut = outputName.replace(/\.mp4$/i, '.webm');
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = safeOut;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      if (window.app) window.app.showToast(`'${safeOut}' 브라우저 다운로드 완료!`, 'success');
      if (exportBtn) {
        exportBtn.disabled = false;
        exportBtn.textContent = '클립 자르기 / 내보내기 (Export)';
      }
    };

    if (window.app) window.app.showToast('선택 구간 브라우저 인코딩 중... 완료 시 자동 다운로드됩니다.', 'info');
    v.currentTime = seg.start;
    v.play().then(() => {
      rec.start(200);
      const checkEnd = () => {
        if (v.currentTime >= seg.end || v.ended) {
          v.pause();
          if (rec.state === 'recording') rec.stop();
          v.removeEventListener('timeupdate', checkEnd);
        }
      };
      v.addEventListener('timeupdate', checkEnd);
    }).catch(err => {
      console.error(err);
      if (window.app) window.app.showToast('컷팅 재생 오류: ' + err.message, 'error');
      if (exportBtn) {
        exportBtn.disabled = false;
        exportBtn.textContent = '클립 자르기 / 내보내기 (Export)';
      }
    });
  }

  async loadClipsList() {
    try {
      const res = await fetch('/api/clips/files');
      const data = await res.json();
      this.allClips = data.clips || [];
      this.renderClipsList();
    } catch (e) {
      console.error(e);
    }
  }

  renderClipsList() {
    const container = document.getElementById('editorClipsList');
    if (!container) return;

    if (this.allClips.length === 0) {
      container.innerHTML = '<div style="font-size: 12px; color: var(--text-muted); padding: 12px; text-align: center;">생성된 클립이 없습니다.</div>';
      return;
    }

    container.innerHTML = this.allClips.map(c => {
      const sizeMb = (c.size / (1024 * 1024)).toFixed(1);
      const isWebH264 = c.name.includes('_web_h264');
      const webBadge = isWebH264 ? '<span style="background: rgba(0,255,163,0.18); color: var(--accent-color); font-size: 10px; font-weight: 800; padding: 1px 4px; border-radius: 3px; margin-left: 4px;">웹 호환</span>' : '';
      return `
        <div style="background: var(--bg-card); padding: 8px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; gap: 8px;">
          <div style="min-width: 0; flex: 1;">
            <div style="font-size: 12px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #fff;" title="${c.name}">
              ${c.name} ${webBadge}
            </div>
            <div style="font-size: 11px; color: var(--text-muted);">${sizeMb} MB</div>
          </div>
          <div style="display: flex; gap: 4px; flex-shrink: 0;">
            <button class="btn btn-sm" onclick="window.editorUI.selectSourceByPath('${c.path.replace(/\\/g, '\\\\')}')">불러오기</button>
            <button class="btn btn-sm" style="background: rgba(59, 130, 246, 0.2); border-color: rgba(59, 130, 246, 0.4); color: #93c5fd;" onclick="window.editorUI.encodeWeb('${c.path.replace(/\\/g, '\\\\')}')" title="디스코드/웹용 H.264 MP4로 인코딩">웹용 변환</button>
            <button class="btn btn-sm btn-danger" onclick="window.editorUI.deleteClip('${c.path.replace(/\\/g, '\\\\')}')">삭제</button>
          </div>
        </div>
      `;
    }).join('');
  }

  async encodeWeb(filePath) {
    if (window.app) window.app.showToast('웹 업로드 호환(H.264/AAC) 규격으로 인코딩을 시작합니다...', 'info');
    try {
      const res = await fetch('/api/clips/encode-web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_path: filePath })
      });
      const data = await res.json();
      if (data.success) {
        const sizeMb = (data.size / (1024 * 1024)).toFixed(1);
        if (window.app) window.app.showToast(`'${data.filename}' 웹 호환 인코딩 완료! (${sizeMb} MB)`, 'success');
        this.loadClipsList();
        this.loadSources();
      } else {
        if (window.app) window.app.showToast(data.error || '웹 호환 인코딩 실패', 'error');
      }
    } catch (e) {
      console.error(e);
      if (window.app) window.app.showToast('인코딩 오류', 'error');
    }
  }

  async deleteClip(filePath) {
    if (!confirm('정말로 이 클립을 삭제하시겠습니까?')) return;
    try {
      await fetch('/api/editor/file', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_path: filePath })
      });
      if (window.app) window.app.showToast('클립이 삭제되었습니다.', 'success');
      this.loadClipsList();
      this.loadSources();
    } catch (e) {
      console.error(e);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.editorUI = new VideoEditorUI();
});
