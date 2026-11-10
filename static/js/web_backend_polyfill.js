/**
 * 더치지직 (The Chzzk) 무백엔드 웹버전 & 안드로이드 APK 네이티브 브릿지 전용 폴리필
 * - GEMINI.md 격리 규칙: 이 파일 내 웹 전용 UI/동작은 오직 window.__IS_STATIC_WEB__ === true 일 때만 활성화되며
 *   PC 클라이언트(TheChzzk.exe) 실행 시에는 단 1픽셀도 영향을 주지 않습니다.
 */

(function() {
  const originalFetch = window.fetch.bind(window);
  const host = window.location.hostname;
  const isLocalHost = (host === '127.0.0.1' || host === 'localhost') && window.location.protocol !== 'file:';
  const hasAndroidBridge = Boolean(window.AndroidChzzk);

  // 정적 호스팅(GitHub Pages 등), file:, Android WebView, 또는 강제 플래그 시 정적 웹/앱 모드 활성화
  window.__IS_STATIC_WEB__ = Boolean(window.__FORCE_STATIC_WEB__ || hasAndroidBridge || !isLocalHost);

  // Android APK 및 터치 모바일 디바이스 클래스 부여 (PC 데스크톱 무영향)
  if (hasAndroidBridge) {
    document.documentElement.classList.add('is-android-apk', 'is-touch-mobile');
  } else if (
    window.matchMedia &&
    (window.matchMedia('(pointer: coarse)').matches || (navigator.maxTouchPoints > 0 && window.innerWidth <= 1024))
  ) {
    document.documentElement.classList.add('is-touch-mobile');
  }

  // 기존 구형 서비스 워커 캐시가 구버전 JS를 서빙하지 않도록 정적 웹 호스팅에서 정리
  if (window.__IS_STATIC_WEB__ && !hasAndroidBridge && window.location.protocol.startsWith('http') && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    }).catch(() => {});
  }

  const LS_PREFIX = 'thechzzk_web_';
  function lsGet(k, def) {
    try {
      const v = localStorage.getItem(LS_PREFIX + k);
      return v ? JSON.parse(v) : def;
    } catch (e) { return def; }
  }
  function lsSet(k, v) {
    try {
      localStorage.setItem(LS_PREFIX + k, JSON.stringify(v));
    } catch (e) {}
  }

  // HTML 엔티티 디코딩 + 줄바꿈 보존 (댓글/설명 내 &apos;, &#39;, <br> 이상 출력 방지)
  function decodeHtmlEntities(str) {
    if (!str) return '';
    let s = String(str)
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '');
    s = s
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;|&#39;|&#x27;/gi, "'")
      .replace(/&nbsp;/gi, ' ')
      .replace(/&#(\d+);/g, (_, n) => {
        const code = parseInt(n, 10);
        return (code > 0 && code < 0x110000) ? String.fromCodePoint(code) : _;
      })
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
        const code = parseInt(hex, 16);
        return (code > 0 && code < 0x110000) ? String.fromCodePoint(code) : _;
      });
    return s;
  }

  // XSS 방어용 텍스트 정제 헬퍼 (외부 API 응답 내 악성 HTML/스크립트 차단)
  function sanitizeText(str) {
    if (!str) return '';
    return decodeHtmlEntities(str);
  }

  // 영문 상대 날짜('2 days ago' 등) 한국어 표기 변환
  function formatKoreanRelativeTime(raw) {
    if (!raw) return '';
    const s = sanitizeText(raw).trim();
    const m = s.match(/^(\d+)\s+(second|seconds|minute|minutes|hour|hours|day|days|week|weeks|month|months|year|years)\s+ago/i);
    if (!m) return s;
    const n = m[1];
    const unit = m[2].toLowerCase();
    if (unit.startsWith('second')) return `${n}초 전`;
    if (unit.startsWith('minute')) return `${n}분 전`;
    if (unit.startsWith('hour')) return `${n}시간 전`;
    if (unit.startsWith('day')) return `${n}일 전`;
    if (unit.startsWith('week')) return `${n}주 전`;
    if (unit.startsWith('month')) return `${n}개월 전`;
    if (unit.startsWith('year')) return `${n}년 전`;
    return s;
  }

  // 안전한 YouTube ID 정제
  function cleanYtId(id) {
    return String(id || '').replace(/[^a-zA-Z0-9_-]/g, '');
  }

  // 구형 브라우저/iOS/Android WebView 호환 타임아웃 fetch 래퍼
  async function fetchWithTimeout(url, options = {}, timeoutMs = 8500) {
    if (typeof AbortController !== 'undefined') {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        return await originalFetch(url, { ...options, signal: ctrl.signal });
      } finally {
        clearTimeout(timer);
      }
    }
    return originalFetch(url, options);
  }

  // 먼저 성공하는 Promise 반환 (구형 브라우저 호환 Promise.any)
  function firstResolved(promises) {
    return new Promise((resolve, reject) => {
      let remaining = promises.length;
      if (remaining === 0) return reject(new Error('empty'));
      promises.forEach(p => {
        Promise.resolve(p).then(resolve, () => {
          remaining--;
          if (remaining === 0) reject(new Error('all failed'));
        });
      });
    });
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = String(reader.result || '');
        const comma = res.indexOf(',');
        resolve(comma !== -1 ? res.slice(comma + 1) : res);
      };
      reader.onerror = () => reject(new Error('blob read failed'));
      reader.readAsDataURL(blob);
    });
  }

  // 캐시 및 상태 저장소 (인플라이트 중복 차단 + SWR + 라이브 상세/채팅 캐시)
  const initCachedLives = lsGet('cached_lives', { ts: 0, lives: [] });
  let cachedLivesList = Array.isArray(initCachedLives.lives) ? initCachedLives.lives : [];
  let cachedLivesTs = initCachedLives.ts || 0;
  let lastManualRefreshClickTs = 0;
  let bgLivesRefreshInFlight = false;
  const inflightProxyMap = {};
  const liveDetailCache = {};
  const chatAccessCache = {};
  const emojiPackCache = {};
  const channelChatIdMap = {};
  const commentTokenVideoMap = {};
  const ytOembedCache = {};
  const webRecorderJobs = {};
  const webCompletedRecordings = []; // 브라우저 녹화 또는 폴더에서 불러온 비디오
  const webLocalCaptures = [];       // 폴더에서 불러온 이미지 또는 캡처
  let selectedDirectoryHandle = null;

  document.addEventListener('click', (e) => {
    if (e.target && typeof e.target.closest === 'function' && e.target.closest('#refreshLivesBtn')) {
      lastManualRefreshClickTs = Date.now();
    }
  }, true);

  function parseJinaJson(txt) {
    if (!txt) return null;
    let startIdx = -1;
    const mdMarker = txt.indexOf('Markdown Content:');
    if (mdMarker !== -1) {
      startIdx = txt.indexOf('{', mdMarker);
    }
    if (startIdx === -1) {
      const nlBrace = txt.indexOf('\n{');
      if (nlBrace !== -1) startIdx = nlBrace + 1;
    }
    if (startIdx === -1) {
      startIdx = txt.indexOf('{');
    }
    if (startIdx === -1) return null;
    const lastBrace = txt.lastIndexOf('}');
    const jsonSlice = (lastBrace > startIdx) ? txt.slice(startIdx, lastBrace + 1) : txt.slice(startIdx);
    const parsed = JSON.parse(jsonSlice);
    if (parsed && parsed.data && typeof parsed.data.content === 'string') {
      return JSON.parse(parsed.data.content);
    }
    return parsed;
  }

  // ================= CORS 프록시 & Android Native Fetch (고속 병렬 헤지 레이스) =================
  async function proxyFetchJson(targetUrl) {
    // 0순위: Android APK 네이티브 자바 HTTP 인터셉터 (CORS 0%, Rate Limit 0%)
    if (window.AndroidChzzk && typeof window.AndroidChzzk.nativeFetch === 'function') {
      try {
        const raw = window.AndroidChzzk.nativeFetch(targetUrl);
        if (raw && raw.trim().startsWith('{')) {
          return JSON.parse(raw);
        }
      } catch (e) {}
    }

    // 동일 URL 중복 동시 요청 방지
    if (inflightProxyMap[targetUrl]) {
      return inflightProxyMap[targetUrl];
    }

    const reqPromise = (async () => {
      const tryJina = async () => {
        const res = await fetchWithTimeout(`https://r.jina.ai/${targetUrl}`, {
          method: 'GET',
          credentials: 'omit',
          referrerPolicy: 'no-referrer'
        }, 5500);
        if (!res.ok) throw new Error('jina status ' + res.status);
        const txt = await res.text();
        const parsed = parseJinaJson(txt);
        if (parsed && (parsed.code === 200 || parsed.content)) {
          return parsed;
        }
        throw new Error('jina invalid payload');
      };

      const enc = encodeURIComponent(targetUrl);
      const tryBackups = () => {
        const backupProxies = [
          { url: `https://api.allorigins.win/raw?url=${enc}`, isGetWrap: false },
          { url: `https://api.allorigins.win/get?url=${enc}`, isGetWrap: true },
          { url: `https://api.codetabs.com/v1/proxy?quest=${enc}`, isGetWrap: false },
          { url: `https://corsproxy.org/?url=${enc}`, isGetWrap: false }
        ];
        return firstResolved(backupProxies.map(async (bp) => {
          const res = await fetchWithTimeout(bp.url, { method: 'GET', credentials: 'omit' }, 6500);
          if (!res.ok) throw new Error('status ' + res.status);
          const txt = await res.text();
          let parsed = JSON.parse(txt);
          if (bp.isGetWrap && parsed && typeof parsed.contents === 'string') {
            parsed = JSON.parse(parsed.contents);
          }
          if (parsed && (parsed.code === 200 || parsed.content)) {
            return parsed;
          }
          throw new Error('invalid payload');
        }));
      };

      // Staggered Hedged Race: Jina 우선 시작, 2.4초 초과 또는 즉시 실패 시 백업 프록시 병렬 경합
      let hedgeTimer = null;
      let triggerBackupsNow = null;
      const delayedBackups = new Promise((resolve, reject) => {
        let settled = false;
        const trigger = () => {
          if (settled) return;
          settled = true;
          tryBackups().then(resolve, reject);
        };
        triggerBackupsNow = () => {
          if (hedgeTimer) { clearTimeout(hedgeTimer); hedgeTimer = null; }
          trigger();
        };
        hedgeTimer = setTimeout(trigger, 2400);
      });

      const fastJina = tryJina().catch((err) => {
        if (triggerBackupsNow) triggerBackupsNow();
        throw err;
      });

      try {
        return await firstResolved([fastJina, delayedBackups]);
      } catch (e) {
        throw new Error('프록시를 통한 데이터 수신 실패: ' + targetUrl);
      } finally {
        if (hedgeTimer) clearTimeout(hedgeTimer);
      }
    })();

    inflightProxyMap[targetUrl] = reqPromise;
    try {
      return await reqPromise;
    } finally {
      delete inflightProxyMap[targetUrl];
    }
  }

  async function fetchLiveDetailCached(channelId) {
    const cid = String(channelId || '').trim();
    if (!cid) return { success: false, isOnline: false, error: '채널 ID 없음' };
    const cached = liveDetailCache[cid];
    if (cached && (Date.now() - cached.ts) < 25000) {
      return cached.data;
    }
    try {
      const data = await proxyFetchJson(`https://api.chzzk.naver.com/service/v2/channels/${cid}/live-detail`);
      const content = data && data.content;
      if (!content || content.status !== 'OPEN') {
        return { success: false, isOnline: false, error: '현재 오프라인 상태입니다.' };
      }
      const pb = JSON.parse(content.livePlaybackJson || '{}');
      const mediaList = pb.media || [];
      const primary = mediaList.find(m => m.mediaId === 'LLHLS' || m.latency === 'lowLatency') || mediaList[0];
      if (!primary) return { success: false, isOnline: true, error: '스트림 경로 없음' };
      const hlsMedia = mediaList.find(m => m.mediaId === 'HLS');
      let thumb = content.liveImageUrl || '';
      if (thumb.includes('{type}')) thumb = thumb.replace('{type}', '720');
      const ch = content.channel || {};
      if (content.chatChannelId) channelChatIdMap[cid] = content.chatChannelId;

      const resObj = {
        success: true,
        isOnline: true,
        channelId: cid,
        channelName: sanitizeText(ch.channelName || cid),
        channelImageUrl: ch.channelImageUrl || './static/img/favicon.png',
        title: sanitizeText(content.liveTitle || ''),
        categoryValue: sanitizeText(content.liveCategoryValue || '기타'),
        userCount: content.concurrentUserCount || 0,
        thumbUrl: thumb,
        masterUrl: primary.path,
        streamUrl: primary.path,
        hlsUrl: hlsMedia ? hlsMedia.path : primary.path,
        encodingTracks: primary.encodingTrack || [],
        chatChannelId: content.chatChannelId || ''
      };
      liveDetailCache[cid] = { ts: Date.now(), data: resObj };
      return resObj;
    } catch (e) {
      return { success: false, isOnline: false, error: '방송 정보를 불러오지 못했습니다.' };
    }
  }

  // 홈/즐겨찾기 카드 터치·클릭 시작 시 백그라운드 선로딩(Pre-warm)으로 멀티뷰 등록 체감 대기시간 단축
  let hoverPrefetchTimer = null;
  document.addEventListener('pointerdown', (e) => {
    if (!window.__IS_STATIC_WEB__) return;
    const card = e.target && typeof e.target.closest === 'function' ? e.target.closest('.live-card[data-channel-id]') : null;
    if (card && card.dataset.channelId) {
      fetchLiveDetailCached(card.dataset.channelId).catch(() => {});
    }
  }, { passive: true, capture: true });

  document.addEventListener('mouseover', (e) => {
    if (!window.__IS_STATIC_WEB__) return;
    const card = e.target && typeof e.target.closest === 'function' ? e.target.closest('.live-card[data-channel-id]') : null;
    if (!card || !card.dataset.channelId) return;
    const cid = card.dataset.channelId;
    if (hoverPrefetchTimer) clearTimeout(hoverPrefetchTimer);
    hoverPrefetchTimer = setTimeout(() => {
      fetchLiveDetailCached(cid).catch(() => {});
    }, 180);
  }, { passive: true });

  // Piped CORS API (한국어 지역/트렌딩 및 댓글 폴백)
  const PIPED_BASES = ['https://api.piped.private.coffee'];
  async function pipedFetchJson(ep) {
    for (const base of PIPED_BASES) {
      if (window.AndroidChzzk && typeof window.AndroidChzzk.nativeFetch === 'function') {
        try {
          const raw = window.AndroidChzzk.nativeFetch(`${base}${ep}`);
          if (raw && (raw.trim().startsWith('{') || raw.trim().startsWith('['))) {
            return JSON.parse(raw);
          }
        } catch (e) {}
      }
      try {
        const res = await fetchWithTimeout(`${base}${ep}`, {
          credentials: 'omit',
          headers: { 'Accept-Language': 'ko-KR,ko;q=0.9' }
        }, 7000);
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    return null;
  }

  // Invidious CORS-enabled API
  let invidiousBase = 'https://yt.chocolatemoo53.com';
  async function invidiousFetchJson(ep) {
    if (window.AndroidChzzk && typeof window.AndroidChzzk.nativeFetch === 'function') {
      try {
        const raw = window.AndroidChzzk.nativeFetch(`${invidiousBase}${ep}`);
        if (raw && (raw.trim().startsWith('{') || raw.trim().startsWith('['))) {
          return JSON.parse(raw);
        }
      } catch (e) {}
    }

    try {
      const res = await fetchWithTimeout(`${invidiousBase}${ep}`, { credentials: 'omit' }, 7000);
      if (res.ok) return await res.json();
    } catch (e) {}

    // Live instance fallback
    try {
      const listRes = await fetchWithTimeout('https://api.invidious.io/instances.json?sort_by=health', { credentials: 'omit' }, 4500);
      if (listRes.ok) {
        const list = await listRes.json();
        for (const [, info] of list) {
          if (info && info.api && info.cors && info.uri && info.uri !== invidiousBase) {
            try {
              const r = await fetchWithTimeout(`${info.uri}${ep}`, { credentials: 'omit' }, 5000);
              if (r.ok) {
                invidiousBase = info.uri;
                return await r.json();
              }
            } catch (err) {}
          }
        }
      }
    } catch (e) {}
    return null;
  }

  function formatDuration(sec) {
    if (!sec || isNaN(sec) || sec < 0) return '';
    const s = Math.floor(sec);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
    return `${m}:${String(r).padStart(2, '0')}`;
  }

  function mapInvidiousVideo(item) {
    const vid = cleanYtId(item.videoId);
    const officialThumb = vid ? `https://i.ytimg.com/vi/${vid}/hqdefault.jpg` : './static/img/favicon.png';
    return {
      videoId: vid,
      id: vid,
      title: sanitizeText(item.title || ''),
      channelName: sanitizeText(item.author || 'YouTube'),
      channelTitle: sanitizeText(item.author || 'YouTube'),
      channelId: cleanYtId(item.authorId || ''),
      channelUrl: item.authorUrl || '',
      thumbnail: officialThumb,
      thumbnails: [{ url: officialThumb }],
      duration: formatDuration(item.lengthSeconds),
      lengthSeconds: item.lengthSeconds || 0,
      viewCount: item.viewCount ? `${Number(item.viewCount).toLocaleString()}회` : sanitizeText(item.viewCountText || ''),
      publishedTime: formatKoreanRelativeTime(item.publishedText || ''),
      isLive: Boolean(item.liveNow)
    };
  }

  function mapPipedVideo(item) {
    let rawUrl = String(item.url || '');
    const m = rawUrl.match(/[?&]v=([\w-]{11})/);
    const vid = cleanYtId(m ? m[1] : rawUrl.split('/').pop());
    const officialThumb = vid ? `https://i.ytimg.com/vi/${vid}/hqdefault.jpg` : './static/img/favicon.png';
    const upUrl = String(item.uploaderUrl || '');
    const cid = cleanYtId(upUrl.startsWith('/channel/') ? upUrl.slice(9) : upUrl.split('/').pop());
    return {
      videoId: vid,
      id: vid,
      title: sanitizeText(item.title || ''),
      channelName: sanitizeText(item.uploaderName || 'YouTube'),
      channelTitle: sanitizeText(item.uploaderName || 'YouTube'),
      channelId: cid,
      channelUrl: upUrl,
      thumbnail: officialThumb,
      thumbnails: [{ url: officialThumb }],
      duration: item.duration > 0 ? formatDuration(item.duration) : '',
      lengthSeconds: item.duration || 0,
      viewCount: (item.views != null && item.views >= 0) ? `${Number(item.views).toLocaleString()}회` : '',
      publishedTime: formatKoreanRelativeTime(item.uploadedDate || ''),
      isLive: Boolean(item.duration === -1 || item.isShort === false && item.uploadedDate == null && item.views >= 0 && !item.duration)
    };
  }

  // 사용자 브라우저의 한국어 환경(ko-KR)에서 공식 YouTube oEmbed로 영문 자동번역 제목을 한국어 원제목으로 복원
  async function fetchYoutubeOembed(vid) {
    if (!vid) return null;
    if (ytOembedCache[vid]) return ytOembedCache[vid];
    const target = `https://www.youtube.com/oembed?url=${encodeURIComponent('https://www.youtube.com/watch?v=' + vid)}&format=json`;
    try {
      if (window.AndroidChzzk && typeof window.AndroidChzzk.nativeFetch === 'function') {
        const raw = window.AndroidChzzk.nativeFetch(target);
        if (raw && raw.trim().startsWith('{')) {
          const d = JSON.parse(raw);
          if (d && d.title) {
            ytOembedCache[vid] = d;
            return d;
          }
        }
      }
      const res = await fetchWithTimeout(target, { credentials: 'omit' }, 2600);
      if (res.ok) {
        const d = await res.json();
        if (d && d.title) {
          ytOembedCache[vid] = d;
          return d;
        }
      }
    } catch (e) {}
    return null;
  }

  async function localizeVideosWithOEmbed(videos, maxCount = 24) {
    if (!Array.isArray(videos) || videos.length === 0) return videos;
    const targets = videos.slice(0, maxCount).filter(v => v && v.videoId);
    await Promise.all(targets.map(async (v) => {
      const oem = await fetchYoutubeOembed(v.videoId);
      if (oem) {
        if (oem.title) v.title = sanitizeText(oem.title);
        if (oem.author_name) {
          v.channelName = sanitizeText(oem.author_name);
          v.channelTitle = v.channelName;
        }
      }
    }));
    return videos;
  }

  function resolveAvatarUrl(c) {
    let rawUrl = '';
    if (Array.isArray(c.authorThumbnails) && c.authorThumbnails.length > 0) {
      rawUrl = c.authorThumbnails[0].url || '';
    } else if (c.authorThumbnail) {
      rawUrl = c.authorThumbnail;
    } else if (c.thumbnail) {
      rawUrl = c.thumbnail;
    }
    if (!rawUrl) return './static/img/favicon.png';
    if (rawUrl.startsWith('//')) return 'https:' + rawUrl;
    if (rawUrl.startsWith('/')) return invidiousBase + rawUrl;
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl;
    return './static/img/favicon.png';
  }

  function jsonResp(obj, status = 200) {
    return new Response(JSON.stringify(obj), {
      status,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }

  // YouTube IFrame Embed HTML 생성기 (iframe srcdoc 용 - 한국어 기본화 + 자동재생/폴백 완비 + Multiview 메시지 규격 100% 일치)
  function generateYoutubeEmbedHtml(videoId, slotIndex = 0, autoplay = true, startSeconds = 0) {
    const cleanVid = cleanYtId(videoId);
    const safeSlot = parseInt(slotIndex, 10) || 0;
    const autoplayVal = autoplay ? 1 : 0;
    const startSecVal = Math.max(0, parseInt(startSeconds, 10) || 0);
    const safeOrigin = (window.location.origin && window.location.origin !== 'null' && !window.location.origin.startsWith('file:'))
      ? window.location.origin
      : 'https://www.youtube.com';

    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; background: #000; overflow: hidden; display: flex; align-items: center; justify-content: center; user-select: none; position: relative; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    #player { width: 100% !important; height: 100% !important; border: none; }
    #tapToPlayOverlay {
      position: absolute; inset: 0; z-index: 20;
      display: none; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
      background: rgba(0, 0, 0, 0.55); cursor: pointer;
    }
    .tap-play-btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 18px; border-radius: 999px; border: 1.5px solid #00ffa3;
      background: rgba(11, 14, 20, 0.92); color: #00ffa3; font-size: 13px; font-weight: 800;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.7);
    }
    #ytFallbackBox {
      position: absolute; inset: 0; z-index: 30;
      display: none; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
      background: #0b0e14; color: #e2e8f0; text-align: center; padding: 16px;
    }
    .yt-fb-btn {
      padding: 8px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);
      background: #ef4444; color: #fff; font-size: 12.5px; font-weight: 700; cursor: pointer; text-decoration: none;
      display: inline-flex; align-items: center; gap: 6px;
    }
  </style>
</head>
<body>
  <div id="player"></div>
  <div id="tapToPlayOverlay">
    <div class="tap-play-btn">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      <span>클릭하여 유튜브 재생</span>
    </div>
  </div>
  <div id="ytFallbackBox"></div>
  <script src="https://www.youtube.com/iframe_api"></script>
  <script>
    var player = null;
    var fallbackVideo = null;
    var slotIndex = ${safeSlot};
    var videoId = '${cleanVid}';
    var isReady = false;
    var isLooping = false;
    var manualPaused = false;
    var timeTimer = null;
    var autoplayWatchdog = null;
    var tapOverlay = document.getElementById('tapToPlayOverlay');

    function postParent(payload) {
      try {
        payload.slotIndex = slotIndex;
        payload.slot = slotIndex;
        if (!payload.videoId) payload.videoId = videoId;
        window.parent.postMessage(payload, '*');
      } catch(e) {}
    }

    function mapHeightToYTQuality(val) {
      var n = parseInt(val, 10);
      if (n >= 1080) return 'hd1080';
      if (n >= 720) return 'hd720';
      if (n >= 480) return 'large';
      if (n >= 360) return 'medium';
      return 'default';
    }

    if (tapOverlay) {
      tapOverlay.addEventListener('click', function() {
        manualPaused = false;
        tapOverlay.style.display = 'none';
        if (player) {
          try {
            player.playVideo();
          } catch(e) {}
        }
      });
    }

    function attemptAutoplay() {
      if (!player || !${autoplayVal}) return;
      try {
        var res = player.playVideo();
        if (res && typeof res.catch === 'function') {
          res.catch(function() {
            try {
              player.mute();
              player.playVideo();
              postParent({ type: 'yt_autoplay_muted' });
            } catch(e2) {}
          });
        }
      } catch(e) {
        try {
          player.mute();
          player.playVideo();
          postParent({ type: 'yt_autoplay_muted' });
        } catch(e2) {}
      }

      if (autoplayWatchdog) clearTimeout(autoplayWatchdog);
      autoplayWatchdog = setTimeout(function() {
        if (!player || manualPaused) return;
        try {
          var st = player.getPlayerState();
          if (st === -1 || st === 5 || st === 2) {
            player.mute();
            player.playVideo();
            postParent({ type: 'yt_autoplay_muted' });
            setTimeout(function() {
              if (!player || manualPaused) return;
              var st2 = player.getPlayerState();
              if ((st2 === -1 || st2 === 5 || st2 === 2) && tapOverlay) {
                tapOverlay.style.display = 'flex';
              }
            }, 1100);
          }
        } catch(e) {}
      }, 650);
    }

    function onYouTubeIframeAPIReady() {
      var pVars = {
        autoplay: ${autoplayVal},
        controls: 0,
        disablekb: 1,
        fs: 1,
        hl: 'ko',
        cc_lang_pref: 'ko',
        modestbranding: 1,
        rel: 0,
        iv_load_policy: 3,
        cc_load_policy: 0,
        playsinline: 1,
        enablejsapi: 1,
        origin: '${safeOrigin}'
      };
      if (${startSecVal} > 0) pVars.start = ${startSecVal};

      player = new YT.Player('player', {
        width: '100%',
        height: '100%',
        host: 'https://www.youtube.com',
        videoId: videoId,
        playerVars: pVars,
        events: {
          onReady: function() {
            isReady = true;
            startTimeTracker();
            postParent({ type: 'yt_ready' });
            attemptAutoplay();
          },
          onStateChange: function(e) {
            var stateName = 'unknown';
            if (e.data === YT.PlayerState.PLAYING) {
              stateName = 'playing';
              manualPaused = false;
              if (tapOverlay) tapOverlay.style.display = 'none';
            } else if (e.data === YT.PlayerState.PAUSED) {
              stateName = 'paused';
            } else if (e.data === YT.PlayerState.BUFFERING) {
              stateName = 'buffering';
              if (tapOverlay) tapOverlay.style.display = 'none';
            } else if (e.data === YT.PlayerState.ENDED) {
              if (isLooping && player) {
                try { player.seekTo(0, true); player.playVideo(); return; } catch(err) {}
              }
              stateName = 'ended';
              postParent({ type: 'yt_ended' });
            }
            var cur = 0, dur = 0;
            try { cur = player.getCurrentTime() || 0; dur = player.getDuration() || 0; } catch(_) {}
            postParent({ type: 'yt_statechange', state: stateName, currentTime: cur, duration: dur });
          },
          onError: function(e) {
            tryPipedStreamFallback(e.data);
          }
        }
      });
    }

    function tryPipedStreamFallback(errCode) {
      if (fallbackVideo) return;
      var fbBox = document.getElementById('ytFallbackBox');
      fetch('https://api.piped.private.coffee/streams/' + encodeURIComponent(videoId), { credentials: 'omit' })
        .then(function(r) { return r.ok ? r.json() : Promise.reject(r.status); })
        .then(function(d) {
          var vs = Array.isArray(d.videoStreams) ? d.videoStreams : [];
          var mp4 = vs.find(function(x) { return !x.videoOnly && x.url && (x.mimeType || '').indexOf('mp4') !== -1; }) || vs.find(function(x) { return !x.videoOnly && x.url; });
          var srcUrl = (mp4 && mp4.url) || d.hls || '';
          if (!srcUrl) throw new Error('no fallback stream');
          document.body.innerHTML = '<video id="fallback-video" autoplay playsinline controls style="width:100%;height:100%;object-fit:contain;background:#000;"></video>';
          fallbackVideo = document.getElementById('fallback-video');
          fallbackVideo.src = srcUrl;
          fallbackVideo.loop = isLooping;
          fallbackVideo.play().catch(function() {
            fallbackVideo.muted = true;
            fallbackVideo.play().catch(function(){});
            postParent({ type: 'yt_autoplay_muted' });
          });
          fallbackVideo.addEventListener('play', function() { postParent({ type: 'yt_statechange', state: 'playing', currentTime: fallbackVideo.currentTime || 0, duration: fallbackVideo.duration || 0 }); });
          fallbackVideo.addEventListener('pause', function() { if (!fallbackVideo.ended) postParent({ type: 'yt_statechange', state: 'paused', currentTime: fallbackVideo.currentTime || 0, duration: fallbackVideo.duration || 0 }); });
          fallbackVideo.addEventListener('ended', function() { postParent({ type: 'yt_statechange', state: 'ended', currentTime: fallbackVideo.duration || 0, duration: fallbackVideo.duration || 0 }); });
          isReady = true;
          startTimeTracker();
          postParent({ type: 'yt_ready' });
        })
        .catch(function() {
          postParent({ type: 'yt_error', code: errCode, errorCode: errCode });
          if (fbBox) {
            fbBox.style.display = 'flex';
            fbBox.innerHTML =
              '<div style="font-size:13px;font-weight:700;">임베드 재생이 제한된 영상입니다. (오류 ' + errCode + ')</div>' +
              '<a class="yt-fb-btn" href="https://www.youtube.com/watch?v=' + encodeURIComponent(videoId) + '" target="_blank" rel="noopener noreferrer">YouTube에서 직접 보기</a>';
          }
        });
    }

    function startTimeTracker() {
      if (timeTimer) clearInterval(timeTimer);
      timeTimer = setInterval(function() {
        try {
          var cur = 0, dur = 0, isLive = false;
          if (fallbackVideo) {
            cur = fallbackVideo.currentTime || 0;
            dur = fallbackVideo.duration || 0;
          } else if (player && typeof player.getCurrentTime === 'function') {
            cur = player.getCurrentTime() || 0;
            dur = player.getDuration() || 0;
            var vData = (typeof player.getVideoData === 'function') ? player.getVideoData() : null;
            isLive = Boolean(vData && vData.isLive) || (dur === 0 && player.getPlayerState() === 1);
          } else {
            return;
          }
          if ((dur > 0 && isFinite(dur)) || isLive) {
            postParent({ type: 'yt_timeupdate', currentTime: cur, duration: isLive ? 0 : dur, isLive: isLive });
          }
        } catch(err) {}
      }, 450);
    }

    window.addEventListener('mousemove', function() { postParent({ type: 'yt_mousemove' }); }, { passive: true });
    window.addEventListener('dblclick', function() { postParent({ type: 'yt_dblclick' }); });

    window.addEventListener('message', function(event) {
      var d = event.data;
      if (!d || typeof d !== 'object' || !d.action) return;
      if (typeof d.slotIndex === 'number') slotIndex = d.slotIndex;

      if (d.action === 'setLoop') { isLooping = !!d.loop; if (fallbackVideo) fallbackVideo.loop = isLooping; return; }
      if (d.action === 'setCaptions') { return; }

      if (fallbackVideo) {
        try {
          if (d.action === 'play') fallbackVideo.play().catch(function(){});
          else if (d.action === 'pause') fallbackVideo.pause();
          else if (d.action === 'togglePlay') { if (fallbackVideo.paused) fallbackVideo.play().catch(function(){}); else fallbackVideo.pause(); }
          else if (d.action === 'mute') fallbackVideo.muted = true;
          else if (d.action === 'unmute') fallbackVideo.muted = false;
          else if (d.action === 'setVolume') {
            var fv = (typeof d.volume === 'number') ? d.volume : d.value;
            if (typeof fv === 'number') { fallbackVideo.volume = Math.max(0, Math.min(1, fv / 100)); if (fv > 0) fallbackVideo.muted = false; }
          } else if (d.action === 'seek' || d.action === 'seekTo') {
            var fs = (typeof d.seconds === 'number') ? d.seconds : d.value;
            if (typeof fs === 'number') fallbackVideo.currentTime = fs;
          }
        } catch(e) {}
        return;
      }

      if (!player) return;
      try {
        if (d.action === 'play') {
          manualPaused = false;
          player.playVideo();
        } else if (d.action === 'pause') {
          manualPaused = true;
          player.pauseVideo();
        } else if (d.action === 'togglePlay') {
          var st = (typeof player.getPlayerState === 'function') ? player.getPlayerState() : -1;
          if (st === YT.PlayerState.PLAYING) { manualPaused = true; player.pauseVideo(); }
          else { manualPaused = false; player.playVideo(); }
        } else if (d.action === 'mute') {
          player.mute();
        } else if (d.action === 'unmute') {
          player.unMute();
        } else if (d.action === 'setVolume') {
          var vol = (typeof d.volume === 'number') ? d.volume : d.value;
          if (typeof vol === 'number') {
            player.setVolume(vol);
            if (vol > 0 && typeof player.isMuted === 'function' && player.isMuted()) player.unMute();
          }
        } else if (d.action === 'seek' || d.action === 'seekTo') {
          var sec = (typeof d.seconds === 'number') ? d.seconds : d.value;
          if (typeof sec === 'number') player.seekTo(sec, true);
        } else if (d.action === 'setQuality' || d.action === 'setPlaybackQuality') {
          var q = mapHeightToYTQuality(d.quality || d.value);
          if (typeof player.setPlaybackQuality === 'function') player.setPlaybackQuality(q);
        } else if (d.action === 'loadVideo' && d.videoId && typeof player.loadVideoById === 'function') {
          videoId = String(d.videoId);
          player.loadVideoById(videoId, d.startSeconds || 0);
        }
      } catch(e) {}
    });
  </script>
</body>
</html>`;
  }

  // ================= API Virtual Router =================
  async function handleVirtualApi(urlStr, options = {}) {
    const urlObj = new URL(urlStr, window.location.origin);
    const path = urlObj.pathname;
    const method = (options.method || 'GET').toUpperCase();
    let bodyObj = {};
    let bodyBlob = null;
    if (options.body) {
      if (typeof options.body === 'string') {
        try { bodyObj = JSON.parse(options.body); } catch (e) {}
      } else if (typeof Blob !== 'undefined' && options.body instanceof Blob) {
        bodyBlob = options.body;
      }
    }

    // 1. System / Status
    if (path === '/api/health') return jsonResp({ status: 'ok', webMode: true });
    if (path === '/api/system/version') return jsonResp({ version: '1.3.3', webMode: true });
    if (path.startsWith('/api/system/update')) {
      return jsonResp({ success: true, has_update: false, current_version: '1.3.3', latest_version: '1.3.3', webMode: true });
    }
    if (path === '/api/network/config') return jsonResp({ success: true, config: { use_cloudflare: false } });
    if (path.startsWith('/api/user/')) {
      if (path === '/api/user/status') return jsonResp({ loggedIn: false, webMode: true });
      if (path === '/api/user/following-lives') return jsonResp({ success: true, lives: [] });
      if (path === '/api/user/following-channels') return jsonResp({ success: true, channels: [] });
      if (path === '/api/user/following-ids') return jsonResp({ success: true, followingIds: [] });
      if (path === '/api/user/logpower/status') return jsonResp({ success: false, has_cookies: false });
      return jsonResp({ success: true });
    }
    if (path.startsWith('/api/diagnostics')) return jsonResp({ success: true, logs: [] });

    // 2. Chzzk Lives List (SWR 즉시 반환 + 백그라운드 최신화, 수동 새로고침 시 즉시 갱신)
    if (path === '/api/lives') {
      const sortType = urlObj.searchParams.get('sortType') || 'POPULAR';
      const keyword = (urlObj.searchParams.get('keyword') || '').toLowerCase();
      const now = Date.now();
      const isManualRefresh = (now - lastManualRefreshClickTs) < 2500 || urlObj.searchParams.get('force') === '1';
      const ageMs = now - cachedLivesTs;

      const parseLiveItems = (items) => {
        const seen = new Set();
        const out = [];
        for (const item of items) {
          const ch = item.channel || {};
          if (!ch.channelId || seen.has(ch.channelId)) continue;
          seen.add(ch.channelId);
          let thumb = item.liveImageUrl || '';
          if (thumb.includes('{type}')) thumb = thumb.replace('{type}', '720');
          out.push({
            liveId: item.liveId,
            channelId: ch.channelId,
            channelName: sanitizeText(ch.channelName || '스트리머'),
            channelImageUrl: ch.channelImageUrl || './static/img/favicon.png',
            verifiedMark: Boolean(ch.verifiedMark),
            liveTitle: sanitizeText(item.liveTitle || ''),
            categoryType: item.liveCategory,
            categoryValue: sanitizeText(item.liveCategoryValue || '기타'),
            userCount: item.concurrentUserCount || 0,
            thumbUrl: thumb,
            openDate: item.openDate || ''
          });
        }
        return out;
      };

      const filterLives = (list) => {
        if (!keyword) return list;
        return list.filter(l =>
          l.channelName.toLowerCase().includes(keyword) ||
          l.liveTitle.toLowerCase().includes(keyword) ||
          l.categoryValue.toLowerCase().includes(keyword)
        );
      };

      // 캐시가 10분 이내이고 수동 새로고침이 아니면 1ms 즉시 반환 + 25초 초과 시 백그라운드 갱신
      if (!isManualRefresh && !keyword && cachedLivesList.length > 0 && ageMs < 600000) {
        if (ageMs >= 25000 && !bgLivesRefreshInFlight) {
          bgLivesRefreshInFlight = true;
          proxyFetchJson(`https://api.chzzk.naver.com/service/v1/lives?size=50&sortType=${sortType}`)
            .then((freshData) => {
              const items = (freshData && freshData.content && freshData.content.data) ? freshData.content.data : [];
              const freshLives = parseLiveItems(items);
              if (freshLives.length > 0) {
                cachedLivesList = freshLives;
                cachedLivesTs = Date.now();
                lsSet('cached_lives', { ts: cachedLivesTs, lives: freshLives.slice(0, 50) });
                if (window.app && !window.app.searchKeyword && !window.app.selectedCategory) {
                  window.app.lives = freshLives;
                  window.app.renderCategoryChips();
                  window.app.filterAndRenderLives();
                }
              }
            })
            .catch(() => {})
            .finally(() => { bgLivesRefreshInFlight = false; });
        }
        return jsonResp({ success: true, total: cachedLivesList.length, lives: cachedLivesList, cached: true });
      }

      try {
        const data = await proxyFetchJson(`https://api.chzzk.naver.com/service/v1/lives?size=50&sortType=${sortType}`);
        const items = (data && data.content && data.content.data) ? data.content.data : [];
        let lives = parseLiveItems(items);
        if (lives.length > 0) {
          cachedLivesList = lives;
          cachedLivesTs = now;
          lsSet('cached_lives', { ts: now, lives: lives.slice(0, 50) });
        }
        lives = filterLives(lives);
        return jsonResp({ success: true, total: lives.length, lives });
      } catch (e) {
        if (cachedLivesList.length > 0) {
          const fallbackLives = filterLives(cachedLivesList);
          return jsonResp({ success: true, total: fallbackLives.length, lives: fallbackLives, cached: true });
        }
        return jsonResp({ success: false, error: '치지직 방송 목록을 불러오지 못했습니다. (잠시 후 새로고침해 주세요)', lives: [] });
      }
    }

    // 3. Chzzk Live Detail (25초 캐시 + 프리페치 히트)
    if (path.startsWith('/api/live/')) {
      const channelId = path.split('/').pop();
      const detail = await fetchLiveDetailCached(channelId);
      return jsonResp(detail);
    }

    // 4. Chzzk Channel Search & Info & Clips & Videos
    if (path === '/api/channels/search') {
      const kw = urlObj.searchParams.get('keyword') || '';
      const size = urlObj.searchParams.get('size') || 25;
      try {
        const data = await proxyFetchJson(`https://api.chzzk.naver.com/service/v1/search/channels?keyword=${encodeURIComponent(kw)}&size=${size}`);
        const raw = (data && data.content && data.content.data) || [];
        const channels = raw.map(item => {
          const ch = item.channel || {};
          return {
            channelId: ch.channelId,
            channelName: sanitizeText(ch.channelName),
            channelImageUrl: ch.channelImageUrl || './static/img/favicon.png',
            verifiedMark: Boolean(ch.verifiedMark),
            followerCount: ch.followerCount || 0,
            openLive: Boolean(ch.openLive)
          };
        });
        return jsonResp({ success: true, channels });
      } catch (e) {
        return jsonResp({ success: false, channels: [] });
      }
    }

    if (path.startsWith('/api/channels/') && path.endsWith('/clips')) {
      const cid = path.split('/')[3];
      const orderType = urlObj.searchParams.get('orderType') || 'POPULAR';
      const size = urlObj.searchParams.get('size') || 24;
      try {
        const data = await proxyFetchJson(`https://api.chzzk.naver.com/service/v1/channels/${cid}/clips?size=${size}&orderType=${orderType}`);
        return jsonResp({ success: true, clips: (data && data.content && data.content.data) || [] });
      } catch (e) {
        return jsonResp({ success: false, clips: [] });
      }
    }

    if (path.startsWith('/api/channels/') && path.endsWith('/videos')) {
      const cid = path.split('/')[3];
      const size = urlObj.searchParams.get('size') || 24;
      try {
        const data = await proxyFetchJson(`https://api.chzzk.naver.com/service/v1/channels/${cid}/videos?size=${size}`);
        return jsonResp({ success: true, videos: (data && data.content && data.content.data) || [] });
      } catch (e) {
        return jsonResp({ success: false, videos: [] });
      }
    }

    if (path.startsWith('/api/channels/')) {
      const cid = path.split('/').pop();
      try {
        const data = await proxyFetchJson(`https://api.chzzk.naver.com/service/v1/channels/${cid}`);
        const c = (data && data.content) || {};
        return jsonResp({
          success: true,
          channelId: c.channelId,
          channelName: sanitizeText(c.channelName),
          channelImageUrl: c.channelImageUrl || './static/img/favicon.png',
          followerCount: c.followerCount || 0,
          openLive: Boolean(c.openLive),
          description: sanitizeText(c.channelDescription || '')
        });
      } catch (e) {
        return jsonResp({ success: false });
      }
    }

    // 5. Chzzk Chat Token & Emoji (토큰 30초 / 이모티콘 5분 캐시)
    if (path.startsWith('/api/chat/') && path.endsWith('/access')) {
      const cid = path.split('/')[3];
      let chatCid = urlObj.searchParams.get('chat_channel_id') || channelChatIdMap[cid];
      const cachedTok = chatAccessCache[cid];
      if (cachedTok && (Date.now() - cachedTok.ts) < 30000) {
        return jsonResp(cachedTok.data);
      }
      try {
        if (!chatCid) {
          const ld = await proxyFetchJson(`https://api.chzzk.naver.com/service/v2/channels/${cid}/live-detail`);
          chatCid = ld && ld.content && ld.content.chatChannelId;
          if (chatCid) channelChatIdMap[cid] = chatCid;
        }
        if (!chatCid) return jsonResp({ success: false, error: '채팅 채널 ID 없음' });
        const tkData = await proxyFetchJson(`https://comm-api.game.naver.com/nng_main/v1/chats/access-token?channelId=${chatCid}&chatType=STREAMING`);
        const content = (tkData && tkData.content) || {};
        const accObj = {
          success: true,
          channelId: cid,
          chatChannelId: chatCid,
          accessToken: content.accessToken,
          extraToken: content.extraToken || ''
        };
        if (accObj.accessToken) chatAccessCache[cid] = { ts: Date.now(), data: accObj };
        return jsonResp(accObj);
      } catch (e) {
        return jsonResp({ success: false, error: '채팅 토큰 발급 실패' });
      }
    }

    if (path.startsWith('/api/chat/') && path.endsWith('/emoji-packs')) {
      const cid = path.split('/')[3];
      const cachedEm = emojiPackCache[cid];
      if (cachedEm && (Date.now() - cachedEm.ts) < 300000) {
        return jsonResp(cachedEm.data);
      }
      try {
        const data = await proxyFetchJson(`https://api.chzzk.naver.com/service/v1/channels/${cid}/emoji-packs`);
        const c = (data && data.content) || {};
        const emojiMap = {};
        for (const key of ['emojiPacks', 'subscriptionEmojiPacks', 'officialEmojiPacks']) {
          for (const p of (c[key] || [])) {
            for (const em of (p.emojis || [])) {
              if (em.emojiId && em.imageUrl) emojiMap[em.emojiId] = em.imageUrl;
            }
          }
        }
        const emObj = { success: true, emojis: emojiMap };
        emojiPackCache[cid] = { ts: Date.now(), data: emObj };
        return jsonResp(emObj);
      } catch (e) {
        return jsonResp({ success: true, emojis: {} });
      }
    }

    // 6. Chzzk Bookmarks (LocalStorage Personal)
    if (path === '/api/bookmarks') {
      if (method === 'GET') {
        const bms = lsGet('bookmarks', []);
        const livesMap = {};
        for (const l of cachedLivesList) livesMap[l.channelId] = l;
        const enriched = bms.map(b => {
          const live = livesMap[b.channel_id || b.channelId];
          return {
            ...b,
            channel_id: b.channel_id || b.channelId,
            channel_name: b.channel_name || b.channelName,
            channel_image_url: b.channel_image_url || b.channelImageUrl,
            is_online: Boolean(live),
            live_title: live ? live.liveTitle : (b.live_title || ''),
            category: live ? live.categoryValue : (b.category || ''),
            user_count: live ? live.userCount : 0,
            thumb_url: live ? live.thumbUrl : ''
          };
        });
        return jsonResp({ bookmarks: enriched });
      } else if (method === 'POST') {
        const bms = lsGet('bookmarks', []);
        const cid = bodyObj.channel_id;
        if (cid && !bms.some(b => (b.channel_id || b.channelId) === cid)) {
          bms.unshift({
            channel_id: cid,
            channel_name: sanitizeText(bodyObj.channel_name || cid),
            channel_image_url: bodyObj.channel_image_url || '',
            notify_enabled: true,
            added_at: new Date().toISOString()
          });
          lsSet('bookmarks', bms);
        }
        return jsonResp({ success: true, bookmarks: bms });
      }
    }
    if (path.startsWith('/api/bookmarks/')) {
      const cid = path.split('/')[3];
      if (method === 'DELETE') {
        let bms = lsGet('bookmarks', []);
        bms = bms.filter(b => (b.channel_id || b.channelId) !== cid);
        lsSet('bookmarks', bms);
        return jsonResp({ success: true });
      }
      return jsonResp({ success: true, notify: true });
    }

    // 7. YouTube Data (한국어 기본화 oEmbed + Piped/Invidious 듀얼 + 댓글/답글/설명 완벽 보정)
    if (path === '/api/youtube/recommendations') {
      const kws = lsGet('yt_keywords', ['치지직', '스텔라이브', '게임']);
      const q = kws[Math.floor(Math.random() * kws.length)] || '치지직';
      let videos = [];
      const rawInv = await invidiousFetchJson(`/api/v1/search?q=${encodeURIComponent(q)}&type=video`);
      if (Array.isArray(rawInv) && rawInv.length > 0) {
        videos = rawInv.filter(x => x.type === 'video' || x.videoId).map(mapInvidiousVideo);
      } else {
        const rawPiped = await pipedFetchJson(`/search?q=${encodeURIComponent(q)}&filter=videos`);
        if (rawPiped && Array.isArray(rawPiped.items)) {
          videos = rawPiped.items.filter(x => x.url).map(mapPipedVideo);
        } else {
          const trend = await pipedFetchJson('/trending?region=KR') || await invidiousFetchJson('/api/v1/trending?region=KR&hl=ko');
          if (Array.isArray(trend)) {
            videos = trend.map(x => x.videoId ? mapInvidiousVideo(x) : mapPipedVideo(x));
          }
        }
      }
      await localizeVideosWithOEmbed(videos, 24);
      return jsonResp({ success: true, videos });
    }
    if (path === '/api/youtube/search') {
      const q = urlObj.searchParams.get('query') || urlObj.searchParams.get('q') || '';
      let raw = await invidiousFetchJson(`/api/v1/search?q=${encodeURIComponent(q)}`);
      let videos = [];
      let channels = [];
      if (Array.isArray(raw) && raw.length > 0) {
        videos = raw.filter(x => x.type === 'video' || x.videoId).map(mapInvidiousVideo);
        channels = raw.filter(x => x.type === 'channel').map(c => ({
          channelId: cleanYtId(c.authorId),
          channelName: sanitizeText(c.author),
          thumbnail: (c.authorThumbnails && c.authorThumbnails[0]) ? c.authorThumbnails[0].url : './static/img/favicon.png',
          subscriberCount: c.subCount ? `${Number(c.subCount).toLocaleString()}명` : ''
        }));
      } else {
        const pData = await pipedFetchJson(`/search?q=${encodeURIComponent(q)}&filter=all`);
        const pItems = (pData && Array.isArray(pData.items)) ? pData.items : [];
        videos = pItems.filter(x => x.type === 'stream' || (x.url && x.url.includes('watch?v='))).map(mapPipedVideo);
        channels = pItems.filter(x => x.type === 'channel').map(c => ({
          channelId: cleanYtId((c.url || '').split('/').pop()),
          channelName: sanitizeText(c.name || ''),
          thumbnail: c.thumbnail || './static/img/favicon.png',
          subscriberCount: (c.subscribers >= 0) ? `${Number(c.subscribers).toLocaleString()}명` : ''
        }));
      }
      await localizeVideosWithOEmbed(videos, 24);
      return jsonResp({ success: true, query: q, videos, channels, total: videos.length });
    }
    if (path.startsWith('/api/youtube/related/')) {
      const vid = cleanYtId(path.split('/').pop());
      let related = [];
      const data = await invidiousFetchJson(`/api/v1/videos/${vid}?hl=ko`);
      if (data && Array.isArray(data.recommendedVideos) && data.recommendedVideos.length > 0) {
        related = data.recommendedVideos.map(mapInvidiousVideo);
      } else {
        const kws = lsGet('yt_keywords', ['치지직', '게임']);
        const fallbackRaw = await invidiousFetchJson(`/api/v1/search?q=${encodeURIComponent(kws[0] || '치지직')}&type=video`) || await pipedFetchJson('/trending?region=KR');
        if (Array.isArray(fallbackRaw)) {
          related = fallbackRaw
            .map(x => x.videoId ? mapInvidiousVideo(x) : mapPipedVideo(x))
            .filter(v => v.videoId && v.videoId !== vid);
        }
      }
      await localizeVideosWithOEmbed(related, 20);
      return jsonResp({ success: true, videos: related });
    }
    if (path.startsWith('/api/youtube/comments/replies')) {
      const token = urlObj.searchParams.get('continuation') || urlObj.searchParams.get('token') || '';
      let vid = cleanYtId(urlObj.searchParams.get('video_id') || '');
      if (!vid && token && commentTokenVideoMap[token]) {
        vid = cleanYtId(commentTokenVideoMap[token]);
      }
      if (!token || !vid) return jsonResp({ success: false, replies: [] });

      let replies = [];
      let nextToken = null;
      const data = await invidiousFetchJson(`/api/v1/comments/${vid}?continuation=${encodeURIComponent(token)}&hl=ko`);
      if (data && Array.isArray(data.comments) && data.comments.length > 0) {
        replies = data.comments.map(c => ({
          id: c.commentId,
          author: sanitizeText(c.author || '익명'),
          avatar: resolveAvatarUrl(c),
          published: formatKoreanRelativeTime(c.publishedText || ''),
          content: sanitizeText(c.content || c.contentHtml || ''),
          likeCount: c.likeCount > 0 ? String(c.likeCount) : ''
        }));
        nextToken = data.continuation || null;
      } else {
        const pRep = await pipedFetchJson(`/nextpage/comments/${vid}?nextpage=${encodeURIComponent(token)}`);
        if (pRep && Array.isArray(pRep.comments)) {
          replies = pRep.comments.map(c => ({
            id: c.commentId,
            author: sanitizeText(c.author || '익명'),
            avatar: resolveAvatarUrl(c),
            published: formatKoreanRelativeTime(c.commentedTime || ''),
            content: sanitizeText(c.commentText || ''),
            likeCount: c.likeCount > 0 ? String(c.likeCount) : ''
          }));
          nextToken = pRep.nextpage || null;
        }
      }
      if (nextToken) commentTokenVideoMap[nextToken] = vid;
      return jsonResp({ success: true, replies, nextToken, continuationToken: nextToken });
    }
    if (path.startsWith('/api/youtube/comments/')) {
      const vid = cleanYtId(path.split('/').pop());
      const cont = urlObj.searchParams.get('continuation') || '';
      const ep = `/api/v1/comments/${vid}?hl=ko` + (cont ? `&continuation=${encodeURIComponent(cont)}` : '');
      const [cData, vData, oemData] = await Promise.all([
        invidiousFetchJson(ep),
        cont ? Promise.resolve(null) : invidiousFetchJson(`/api/v1/videos/${vid}?hl=ko`),
        cont ? Promise.resolve(null) : fetchYoutubeOembed(vid)
      ]);

      let comments = [];
      let nextCont = null;
      if (cData && Array.isArray(cData.comments) && cData.comments.length > 0) {
        comments = cData.comments.map(c => {
          const rTok = c.replies ? (c.replies.continuation || '') : '';
          if (rTok) commentTokenVideoMap[rTok] = vid;
          return {
            id: c.commentId,
            author: sanitizeText(c.author || '익명'),
            avatar: resolveAvatarUrl(c),
            published: formatKoreanRelativeTime(c.publishedText || ''),
            content: sanitizeText(c.content || c.contentHtml || ''),
            likeCount: c.likeCount > 0 ? String(c.likeCount) : '',
            replyToken: rTok,
            replyCount: c.replies ? (c.replies.replyCount || 0) : 0,
            replyLabel: c.replies && c.replies.replyCount ? `답글 ${c.replies.replyCount}개` : '답글'
          };
        });
        nextCont = cData.continuation || null;
      } else {
        // Fallback to Piped comments when Invidious returns 404/empty
        const pEp = cont
          ? `/nextpage/comments/${vid}?nextpage=${encodeURIComponent(cont)}`
          : `/comments/${vid}`;
        const pData = await pipedFetchJson(pEp);
        if (pData && Array.isArray(pData.comments)) {
          comments = pData.comments.map(c => {
            const rTok = c.repliesPage || '';
            if (rTok) commentTokenVideoMap[rTok] = vid;
            return {
              id: c.commentId,
              author: sanitizeText(c.author || '익명'),
              avatar: resolveAvatarUrl(c),
              published: formatKoreanRelativeTime(c.commentedTime || ''),
              content: sanitizeText(c.commentText || ''),
              likeCount: c.likeCount > 0 ? String(c.likeCount) : '',
              replyToken: rTok,
              replyCount: c.replyCount || 0,
              replyLabel: c.replyCount ? `답글 ${c.replyCount}개` : '답글'
            };
          });
          nextCont = pData.nextpage || null;
        }
      }
      if (nextCont) commentTokenVideoMap[nextCont] = vid;

      const videoInfo = vData ? {
        title: sanitizeText((oemData && oemData.title) || vData.title || ''),
        description: sanitizeText(vData.description || ''),
        viewCount: vData.viewCount ? `조회수 ${Number(vData.viewCount).toLocaleString()}회` : '',
        dateText: formatKoreanRelativeTime(vData.publishedText || '')
      } : {};
      return jsonResp({
        success: true,
        comments,
        continuationToken: nextCont,
        hasMore: Boolean(nextCont),
        videoInfo
      });
    }
    if (path.startsWith('/api/youtube/channel/')) {
      const cid = cleanYtId(path.split('/').pop());
      const data = await invidiousFetchJson(`/api/v1/channels/${cid}/videos?hl=ko`);
      let videos = (data && Array.isArray(data.videos)) ? data.videos.map(mapInvidiousVideo) : [];
      if (videos.length === 0) {
        const pCh = await pipedFetchJson(`/channel/${cid}`);
        if (pCh && Array.isArray(pCh.relatedStreams)) {
          videos = pCh.relatedStreams.map(mapPipedVideo);
        }
      }
      await localizeVideosWithOEmbed(videos, 24);
      return jsonResp({ success: true, videos });
    }
    if (path.startsWith('/api/youtube/subtitles/')) {
      return jsonResp({ success: false, cues: [] });
    }

    // YouTube Local Storage CRUD
    if (path.startsWith('/api/youtube/bookmarks')) {
      if (method === 'GET') return jsonResp({ success: true, bookmarks: lsGet('yt_bookmarks', []) });
      if (method === 'POST') {
        const list = lsGet('yt_bookmarks', []);
        if (bodyObj.channelId && !list.some(x => x.channelId === bodyObj.channelId)) {
          list.unshift(bodyObj);
          lsSet('yt_bookmarks', list);
        }
        return jsonResp({ success: true, bookmarks: list });
      }
      if (method === 'DELETE') {
        const cid = path.split('/').pop();
        let list = lsGet('yt_bookmarks', []).filter(x => x.channelId !== cid);
        lsSet('yt_bookmarks', list);
        return jsonResp({ success: true });
      }
    }
    if (path.startsWith('/api/youtube/video_bookmarks')) {
      if (method === 'GET') return jsonResp({ success: true, bookmarks: lsGet('yt_video_bookmarks', []) });
      if (method === 'POST') {
        const list = lsGet('yt_video_bookmarks', []);
        if (bodyObj.videoId && !list.some(x => x.videoId === bodyObj.videoId)) {
          list.unshift(bodyObj);
          lsSet('yt_video_bookmarks', list);
        }
        return jsonResp({ success: true, bookmarks: list });
      }
      if (method === 'DELETE') {
        const vid = path.split('/').pop();
        let list = lsGet('yt_video_bookmarks', []).filter(x => x.videoId !== vid);
        lsSet('yt_video_bookmarks', list);
        return jsonResp({ success: true });
      }
    }
    if (path.startsWith('/api/youtube/watch_later')) {
      if (path.endsWith('/clear')) { lsSet('yt_watch_later', []); return jsonResp({ success: true }); }
      if (method === 'GET') return jsonResp({ success: true, videos: lsGet('yt_watch_later', []) });
      if (method === 'POST') {
        const list = lsGet('yt_watch_later', []);
        if (bodyObj.videoId && !list.some(x => x.videoId === bodyObj.videoId)) {
          list.unshift(bodyObj);
          lsSet('yt_watch_later', list);
        }
        return jsonResp({ success: true, videos: list });
      }
      if (method === 'DELETE') {
        const vid = path.split('/').pop();
        let list = lsGet('yt_watch_later', []).filter(x => x.videoId !== vid);
        lsSet('yt_watch_later', list);
        return jsonResp({ success: true });
      }
    }
    if (path.startsWith('/api/youtube/custom_playlists')) {
      if (method === 'GET') return jsonResp({ success: true, playlists: lsGet('yt_playlists', [{ id: 'pl_default', name: '내가 좋아하는 영상', items: [] }]) });
      if (method === 'POST') {
        const list = lsGet('yt_playlists', [{ id: 'pl_default', name: '내가 좋아하는 영상', items: [] }]);
        if (bodyObj.name) {
          list.push({ id: 'pl_' + Date.now(), name: sanitizeText(bodyObj.name), items: [] });
        } else if (bodyObj.videoId) {
          const pid = path.split('/')[4];
          const pl = list.find(p => p.id === pid);
          if (pl) {
            pl.items = pl.items || [];
            if (!pl.items.some(i => i.videoId === bodyObj.videoId)) pl.items.push(bodyObj);
          }
        }
        lsSet('yt_playlists', list);
        return jsonResp({ success: true, playlists: list });
      }
      if (method === 'DELETE') {
        const parts = path.split('/');
        const pid = parts[4];
        let list = lsGet('yt_playlists', []);
        if (parts.length > 6) {
          const vid = parts[6];
          const pl = list.find(p => p.id === pid);
          if (pl && pl.items) pl.items = pl.items.filter(i => i.videoId !== vid);
        } else {
          list = list.filter(p => p.id !== pid);
        }
        lsSet('yt_playlists', list);
        return jsonResp({ success: true, playlists: list });
      }
    }
    if (path.startsWith('/api/youtube/keywords')) {
      if (path.endsWith('/reset')) { lsSet('yt_keywords', ['치지직', '스텔라이브', '게임']); return jsonResp({ success: true, keywords: ['치지직', '스텔라이브', '게임'] }); }
      if (method === 'GET') return jsonResp({ success: true, keywords: lsGet('yt_keywords', ['치지직', '스텔라이브', '게임']) });
      if (method === 'POST') {
        const kws = lsGet('yt_keywords', []);
        if (bodyObj.keyword && !kws.includes(bodyObj.keyword)) kws.push(sanitizeText(bodyObj.keyword));
        lsSet('yt_keywords', kws);
        return jsonResp({ success: true, keywords: kws });
      }
      if (method === 'DELETE') {
        const kw = decodeURIComponent(path.split('/').pop());
        const kws = lsGet('yt_keywords', []).filter(k => k !== kw);
        lsSet('yt_keywords', kws);
        return jsonResp({ success: true, keywords: kws });
      }
    }
    if (path.startsWith('/api/youtube/history')) {
      if (path.endsWith('/clear')) { lsSet('yt_history', []); return jsonResp({ success: true }); }
      if (method === 'GET') return jsonResp({ success: true, history: lsGet('yt_history', []) });
      if (method === 'POST') {
        const list = lsGet('yt_history', []);
        if (bodyObj.videoId) {
          const filtered = list.filter(x => x.videoId !== bodyObj.videoId);
          filtered.unshift({ ...bodyObj, watched_at: new Date().toISOString() });
          lsSet('yt_history', filtered.slice(0, 100));
        }
        return jsonResp({ success: true });
      }
    }

    // 8. 녹화 & 캡처 엔진 (Android 네이티브 HLS/fMP4 다운로더 우선 + 웹 브라우저 MediaRecorder 폴백)
    if (path === '/api/recorder/start') {
      const chId = bodyObj.channel_id;
      const chName = bodyObj.channel_name || chId || 'Stream';
      const titleStr = bodyObj.title || `${chName} 실시간 방송`;
      const qualityName = bodyObj.quality_name || 'Original';
      let targetSlot = null;
      if (window.multiview && window.multiview.slots) {
        targetSlot = window.multiview.slots.find(s => s.active && s.channelId === chId);
      }

      // Case A: Android APK Native HLS/fMP4 Segment Recorder
      if (window.AndroidChzzk && typeof window.AndroidChzzk.startNativeRecord === 'function') {
        const hlsUrl = (targetSlot && (targetSlot.hlsUrl || targetSlot.streamUrl)) || bodyObj.stream_url || '';
        if (!hlsUrl) {
          return jsonResp({ success: false, error: '스트림 주소를 확인할 수 없습니다. 방송 재생 중 녹화를 눌러주세요.' });
        }
        try {
          const resStr = window.AndroidChzzk.startNativeRecord(hlsUrl, chName, chId);
          const resObj = JSON.parse(resStr);
          if (resObj && resObj.success) {
            if (resObj.job) {
              if (!resObj.job.title) resObj.job.title = titleStr;
              if (!resObj.job.qualityName) resObj.job.qualityName = qualityName;
            }
            if (typeof window.AndroidChzzk.updateNativeJobMeta === 'function' && resObj.job_id) {
              window.AndroidChzzk.updateNativeJobMeta(resObj.job_id, titleStr, qualityName);
            }
            webRecorderJobs[resObj.job_id] = resObj.job;
            return jsonResp(resObj);
          }
          return jsonResp({
            success: false,
            alreadyRecording: Boolean(resObj && resObj.alreadyRecording),
            job_id: resObj && resObj.job_id,
            job: resObj && resObj.job,
            error: (resObj && resObj.error) || '네이티브 녹화 시작 실패'
          });
        } catch (e) {
          return jsonResp({ success: false, error: '안드로이드 녹화 브릿지 오류: ' + e.message });
        }
      }

      // Case B: Browser Web MediaRecorder (중복 녹화 차단 포함)
      const existingWebJob = Object.values(webRecorderJobs).find(
        j => j.channel_id === chId && (j.status === 'recording' || j.status === 'paused')
      );
      if (existingWebJob) {
        return jsonResp({
          success: false,
          alreadyRecording: true,
          job_id: existingWebJob.job_id,
          job: {
            ...existingWebJob,
            jobId: existingWebJob.job_id,
            channelId: existingWebJob.channel_id,
            channelName: existingWebJob.channel_name,
            duration: existingWebJob.elapsed_seconds || 0,
            fileSize: existingWebJob.file_size || 0
          },
          error: '이미 해당 방송을 녹화 중입니다.'
        });
      }

      const targetVideo = targetSlot ? targetSlot.videoEl : null;
      if (!targetVideo) {
        return jsonResp({ success: false, error: '웹버전에서는 현재 멀티뷰 슬롯에서 재생 중인 방송만 녹화할 수 있습니다.' });
      }

      let stream = null;
      try {
        stream = targetVideo.captureStream ? targetVideo.captureStream() : targetVideo.mozCaptureStream();
      } catch (e) {}
      if (!stream) {
        return jsonResp({ success: false, error: '현재 브라우저(또는 iOS 정책)에서 비디오 스트림 캡처를 지원하지 않습니다.' });
      }

      const jobId = 'webrec_' + Date.now();
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm';
      const rec = new MediaRecorder(stream, { mimeType });
      const chunks = [];
      const fname = `TheChzzk_녹화_${chName}_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '_')}.webm`;
      const jobObj = {
        job_id: jobId,
        jobId: jobId,
        channel_id: chId,
        channelId: chId,
        channel_name: sanitizeText(chName),
        channelName: sanitizeText(chName),
        title: sanitizeText(titleStr),
        qualityName: qualityName,
        status: 'recording',
        start_time: Date.now() / 1000,
        elapsed_seconds: 0,
        duration: 0,
        file_size: 0,
        fileSize: 0,
        finalPath: '',
        filename: fname,
        recorder: rec,
        chunks: chunks
      };

      rec.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          chunks.push(ev.data);
          const sz = chunks.reduce((s, c) => s + c.size, 0);
          jobObj.file_size = sz;
          jobObj.fileSize = sz;
        }
      };

      rec.onstop = async () => {
        jobObj.status = 'completed';
        const blob = new Blob(chunks, { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);
        jobObj.finalPath = blobUrl;

        let savedToDir = false;
        if (selectedDirectoryHandle && typeof selectedDirectoryHandle.getFileHandle === 'function') {
          try {
            const fh = await selectedDirectoryHandle.getFileHandle(jobObj.filename, { create: true });
            const writable = await fh.createWritable();
            await writable.write(blob);
            await writable.close();
            savedToDir = true;
          } catch (err) {}
        }

        if (!savedToDir) {
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = jobObj.filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }

        webCompletedRecordings.unshift({
          name: jobObj.filename,
          path: blobUrl,
          size: blob.size,
          modified: Date.now() / 1000,
          isBlob: true
        });
        if (window.recorderUI) window.recorderUI.loadData();
        if (window.app) window.app.showToast(savedToDir ? `지정 폴더에 저장됨: ${jobObj.filename}` : `녹화 완료! 다운로드되었습니다: ${jobObj.filename}`, 'success');
      };

      rec.start(1000);
      webRecorderJobs[jobId] = jobObj;
      return jsonResp({ success: true, job_id: jobId, job: jobObj });
    }

    if (path === '/api/recorder/jobs') {
      if (window.AndroidChzzk && typeof window.AndroidChzzk.getNativeJobs === 'function') {
        try {
          return jsonResp(JSON.parse(window.AndroidChzzk.getNativeJobs()));
        } catch (e) {}
      }
      const now = Date.now() / 1000;
      const list = Object.values(webRecorderJobs).map(j => {
        const dur = j.status === 'recording' ? Math.max(0, Math.floor(now - j.start_time)) : (j.elapsed_seconds || 0);
        return {
          jobId: j.job_id,
          job_id: j.job_id,
          channelId: j.channel_id,
          channel_id: j.channel_id,
          channelName: j.channel_name,
          channel_name: j.channel_name,
          title: j.title || j.channel_name,
          qualityName: j.qualityName || 'Original',
          status: j.status,
          duration: dur,
          elapsed_seconds: dur,
          fileSize: j.file_size || 0,
          file_size: j.file_size || 0,
          finalPath: j.finalPath || '',
          filename: j.filename
        };
      });
      return jsonResp({ jobs: list });
    }

    if (path.startsWith('/api/recorder/pause/')) {
      const jid = path.split('/').pop();
      if (window.AndroidChzzk && typeof window.AndroidChzzk.pauseNativeRecord === 'function') {
        try {
          return jsonResp(JSON.parse(window.AndroidChzzk.pauseNativeRecord(jid)));
        } catch (e) {}
      }
      const job = webRecorderJobs[jid];
      if (job && job.recorder && job.recorder.state === 'recording') {
        job.elapsed_seconds = Math.floor(Date.now() / 1000 - job.start_time);
        if (typeof job.recorder.pause === 'function') job.recorder.pause();
        job.status = 'paused';
        return jsonResp({ success: true });
      }
      return jsonResp({ success: false });
    }

    if (path.startsWith('/api/recorder/resume/')) {
      const jid = path.split('/').pop();
      if (window.AndroidChzzk && typeof window.AndroidChzzk.resumeNativeRecord === 'function') {
        try {
          return jsonResp(JSON.parse(window.AndroidChzzk.resumeNativeRecord(jid)));
        } catch (e) {}
      }
      const job = webRecorderJobs[jid];
      if (job && job.recorder && job.recorder.state === 'paused') {
        job.start_time = Date.now() / 1000 - (job.elapsed_seconds || 0);
        if (typeof job.recorder.resume === 'function') job.recorder.resume();
        job.status = 'recording';
        return jsonResp({ success: true });
      }
      return jsonResp({ success: false });
    }

    if (path.startsWith('/api/recorder/stop/')) {
      const jid = path.split('/').pop();
      if (window.AndroidChzzk && typeof window.AndroidChzzk.stopNativeRecord === 'function') {
        try {
          return jsonResp(JSON.parse(window.AndroidChzzk.stopNativeRecord(jid)));
        } catch (e) {}
      }
      const job = webRecorderJobs[jid];
      if (job && job.recorder && (job.recorder.state === 'recording' || job.recorder.state === 'paused')) {
        if (job.status === 'recording') {
          job.elapsed_seconds = Math.floor(Date.now() / 1000 - job.start_time);
        }
        job.recorder.stop();
        return jsonResp({ success: true });
      }
      return jsonResp({ success: false });
    }

    if (path === '/api/recorder/clear-completed') {
      if (window.AndroidChzzk && typeof window.AndroidChzzk.clearCompletedNativeJobs === 'function') {
        try { window.AndroidChzzk.clearCompletedNativeJobs(); } catch (e) {}
      }
      for (const k of Object.keys(webRecorderJobs)) {
        if (webRecorderJobs[k].status !== 'recording' && webRecorderJobs[k].status !== 'paused') {
          delete webRecorderJobs[k];
        }
      }
      return jsonResp({ success: true });
    }

    if (path.startsWith('/api/recorder/') && method === 'DELETE') {
      const jid = path.split('/').pop();
      if (window.AndroidChzzk && typeof window.AndroidChzzk.deleteNativeJob === 'function') {
        try {
          return jsonResp(JSON.parse(window.AndroidChzzk.deleteNativeJob(jid)));
        } catch (e) {}
      }
      delete webRecorderJobs[jid];
      return jsonResp({ success: true });
    }

    if (path === '/api/recordings') {
      if (window.AndroidChzzk && typeof window.AndroidChzzk.listNativeRecordings === 'function') {
        try {
          return jsonResp(JSON.parse(window.AndroidChzzk.listNativeRecordings()));
        } catch (e) {}
      }
      return jsonResp({ recordings: webCompletedRecordings });
    }

    if (path === '/api/captures') {
      if (window.AndroidChzzk && typeof window.AndroidChzzk.listNativeCaptures === 'function') {
        try {
          return jsonResp(JSON.parse(window.AndroidChzzk.listNativeCaptures()));
        } catch (e) {}
      }
      return jsonResp({ captures: webLocalCaptures });
    }

    if (path === '/api/recordings/save-capture' && method === 'POST') {
      const rawFname = urlObj.searchParams.get('filename') || `capture_${Date.now()}.png`;
      if (!bodyBlob) {
        return jsonResp({ success: false, error: '캡처 이미지 데이터가 비어있습니다.' });
      }
      if (window.AndroidChzzk && typeof window.AndroidChzzk.saveNativeCapture === 'function') {
        try {
          const b64 = await blobToBase64(bodyBlob);
          const resStr = window.AndroidChzzk.saveNativeCapture(rawFname, b64);
          const resObj = JSON.parse(resStr);
          if (window.recorderUI) window.recorderUI.loadCaptures().then(() => window.recorderUI.render());
          return jsonResp(resObj);
        } catch (e) {
          return jsonResp({ success: false, error: '네이티브 캡처 저장 실패: ' + e.message });
        }
      }
      const capBlobUrl = URL.createObjectURL(bodyBlob);
      const cleanName = sanitizeText(rawFname);
      webLocalCaptures.unshift({
        name: cleanName,
        path: capBlobUrl,
        size: bodyBlob.size,
        modified: Date.now() / 1000,
        isBlob: true
      });
      if (window.recorderUI) window.recorderUI.loadCaptures().then(() => window.recorderUI.render());
      return jsonResp({ success: true, filename: cleanName, filePath: capBlobUrl });
    }

    if (path === '/api/recordings/rename' && method === 'POST') {
      const targetPath = bodyObj.file_path || '';
      const newName = bodyObj.new_name || '';
      if (window.AndroidChzzk && typeof window.AndroidChzzk.renameNativeFile === 'function') {
        try {
          return jsonResp(JSON.parse(window.AndroidChzzk.renameNativeFile(targetPath, newName)));
        } catch (e) {}
      }
      const item = webCompletedRecordings.find(x => x.path === targetPath) || webLocalCaptures.find(x => x.path === targetPath);
      if (item && newName) {
        item.name = sanitizeText(newName);
        return jsonResp({ success: true, newName: item.name });
      }
      return jsonResp({ success: false, error: '파일명을 변경할 수 없습니다.' });
    }

    if (path === '/api/editor/file' && method === 'DELETE') {
      const targetPath = bodyObj.file_path || '';
      if (window.AndroidChzzk && typeof window.AndroidChzzk.deleteNativeFile === 'function') {
        try {
          return jsonResp(JSON.parse(window.AndroidChzzk.deleteNativeFile(targetPath)));
        } catch (e) {}
      }
      let removed = false;
      const rIdx = webCompletedRecordings.findIndex(x => x.path === targetPath);
      if (rIdx !== -1) {
        try { if (targetPath.startsWith('blob:')) URL.revokeObjectURL(targetPath); } catch (e) {}
        webCompletedRecordings.splice(rIdx, 1);
        removed = true;
      }
      const cIdx = webLocalCaptures.findIndex(x => x.path === targetPath);
      if (cIdx !== -1) {
        try { if (targetPath.startsWith('blob:')) URL.revokeObjectURL(targetPath); } catch (e) {}
        webLocalCaptures.splice(cIdx, 1);
        removed = true;
      }
      return jsonResp({ success: removed });
    }

    if (path === '/api/clips/files') {
      return jsonResp({ clips: [] });
    }

    if (path === '/api/utils/open-folder') {
      if (window.AndroidChzzk) {
        const info = (typeof window.AndroidChzzk.getStoragePaths === 'function')
          ? window.AndroidChzzk.getStoragePaths()
          : '내부저장소/TheChzzk (recordings / captures)';
        if (window.app) window.app.showToast(`저장 경로: ${info}`, 'info');
      } else if (window.__IS_STATIC_WEB__) {
        pickWebRecordingFolder();
      }
      return jsonResp({ success: true });
    }

    return jsonResp({ success: true, webMode: true });
  }

  // ================= 웹버전 전용: 로컬 녹화 폴더 지정 & 스캔 (PC 클라이언트에 미노출) =================
  async function pickWebRecordingFolder() {
    if (!window.__IS_STATIC_WEB__) return;

    // 1. Chrome/Edge File System Access API
    if (typeof window.showDirectoryPicker === 'function') {
      try {
        const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
        selectedDirectoryHandle = dirHandle;
        await scanDirectoryHandle(dirHandle);
        if (window.app) window.app.showToast(`녹화 폴더('${dirHandle.name}')를 연결하고 영상을 불러왔습니다.`, 'success');
        return;
      } catch (e) {
        if (e.name === 'AbortError') return;
      }
    }

    // 2. Fallback for Safari / Mobile / Unsupported browsers
    let fileInput = document.getElementById('webPolyfillFilePicker');
    if (!fileInput) {
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.id = 'webPolyfillFilePicker';
      fileInput.multiple = true;
      fileInput.accept = 'video/*,image/*';
      fileInput.style.display = 'none';
      fileInput.onchange = (ev) => {
        const files = Array.from(ev.target.files || []);
        ingestLocalFiles(files);
      };
      document.body.appendChild(fileInput);
    }
    fileInput.click();
  }

  async function scanDirectoryHandle(dirHandle) {
    const files = [];
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        const f = await entry.getFile();
        files.push(f);
      }
    }
    ingestLocalFiles(files);
  }

  function ingestLocalFiles(files) {
    const videoExts = /\.(mp4|webm|mkv|ts|mov|m4v|avi)$/i;
    const imgExts = /\.(png|jpg|jpeg|webp|gif)$/i;

    let addedVideos = 0;
    let addedImgs = 0;

    files.forEach(f => {
      const blobUrl = URL.createObjectURL(f);
      if (videoExts.test(f.name) || f.type.startsWith('video/')) {
        if (!webCompletedRecordings.some(r => r.name === f.name && r.size === f.size)) {
          webCompletedRecordings.unshift({
            name: sanitizeText(f.name),
            path: blobUrl,
            size: f.size,
            modified: (f.lastModified || Date.now()) / 1000,
            isBlob: true
          });
          addedVideos++;
        }
      } else if (imgExts.test(f.name) || f.type.startsWith('image/')) {
        if (!webLocalCaptures.some(c => c.name === f.name && c.size === f.size)) {
          webLocalCaptures.unshift({
            name: sanitizeText(f.name),
            path: blobUrl,
            size: f.size,
            modified: (f.lastModified || Date.now()) / 1000,
            isBlob: true
          });
          addedImgs++;
        }
      }
    });

    if (window.recorderUI) window.recorderUI.loadData();
    if (window.editorUI) window.editorUI.loadSources();
    if (window.app && (addedVideos > 0 || addedImgs > 0)) {
      window.app.showToast(`로컬 영상 ${addedVideos}개, 이미지 ${addedImgs}개를 불러왔습니다.`, 'success');
    }
  }

  // 웹버전 전용 DOM 및 프로토타입 패치 (PC 클라이언트에는 전혀 실행되지 않음!)
  function applyWebOnlyEnhancements() {
    if (!window.__IS_STATIC_WEB__) return;

    // 1. 설정 탭 내 민감 UI (네이버 쿠키 / GitHub 토큰 입력란) 숨김 처리 (보안 강화)
    const settingsTab = document.getElementById('settings-tab');
    if (settingsTab) {
      const cookieBox = document.getElementById('cookieInput');
      if (cookieBox && cookieBox.closest('.settings-card, .panel-section')) {
        const card = cookieBox.closest('.settings-card, .panel-section');
        card.innerHTML = `
          <div style="padding: 14px; background: rgba(0,255,163,0.06); border: 1px solid rgba(0,255,163,0.2); border-radius: 8px;">
            <div style="font-weight: 700; color: var(--accent-color); margin-bottom: 6px;">퍼블릭 웹 독립 보안 모드 동작 중</div>
            <div style="font-size: 12.5px; color: var(--text-muted); line-height: 1.5;">
              웹버전은 보안상 네이버 계정 쿠키나 GitHub 토큰을 요구하거나 서버에 저장하지 않습니다.<br>
              즐겨찾기, 재생목록, 알고리즘 키워드 등 모든 개인 데이터는 현재 사용 중인 브라우저 내부(LocalStorage)에만 안전하게 보관됩니다.
            </div>
          </div>
        `;
      }
      const tokenBox = document.getElementById('updateGithubTokenInput');
      if (tokenBox && tokenBox.closest('.settings-card, .panel-section')) {
        tokenBox.closest('.settings-card, .panel-section').style.display = 'none';
      }
    }

    // 2. 녹화 보관함 상단: 웹버전(폴더 스캔) vs APK(내부저장소 경로 안내) 구분 적용
    const openFolderBtn = document.getElementById('openRecordingsFolderBtn');
    if (openFolderBtn) {
      if (window.AndroidChzzk) {
        openFolderBtn.title = '저장 위치: 내부저장소/TheChzzk/recordings 및 captures';
        const spanEl = openFolderBtn.querySelector('span');
        if (spanEl) spanEl.textContent = '저장 위치 확인';
      } else {
        openFolderBtn.title = '내 기기에서 녹화 폴더 지정 또는 로컬 영상 파일 스캔하기 (웹 전용)';
        const spanEl = openFolderBtn.querySelector('span');
        if (spanEl) spanEl.textContent = '녹화 폴더 지정 / 불러오기';
      }
    }

    // 3. 편집기 상단: 웹버전 전용 [탐색기에서 열기] 버튼 동적 주입
    const editorOpenRecBtn = document.getElementById('openRecorderToSelectBtn');
    if (editorOpenRecBtn && editorOpenRecBtn.parentElement && !document.getElementById('webOnlyEditorUploadBtn')) {
      const uploadBtn = document.createElement('button');
      uploadBtn.id = 'webOnlyEditorUploadBtn';
      uploadBtn.className = 'btn btn-sm btn-secondary';
      uploadBtn.style.cssText = 'display: inline-flex; align-items: center; gap: 5px; font-size: 12px; padding: 6px 12px;';
      uploadBtn.title = '내 기기 탐색기에서 영상 파일 직접 불러오기 (웹 전용)';
      uploadBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><span>탐색기에서 열기</span>`;
      uploadBtn.onclick = () => {
        let inp = document.getElementById('webOnlyEditorFileInput');
        if (!inp) {
          inp = document.createElement('input');
          inp.type = 'file';
          inp.id = 'webOnlyEditorFileInput';
          inp.accept = 'video/*';
          inp.style.display = 'none';
          inp.onchange = (e) => {
            if (window.editorUI && typeof window.editorUI.handleLocalFileUpload === 'function') {
              window.editorUI.handleLocalFileUpload(e);
            }
          };
          document.body.appendChild(inp);
        }
        inp.click();
      };
      editorOpenRecBtn.parentElement.insertBefore(uploadBtn, editorOpenRecBtn.nextSibling);
    }

    // 4. RecorderUI 미리보기 & 썸네일: blob: URL 또는 안드로이드 로컬 파일 URL 안전 처리
    if (window.RecorderUI && !window.RecorderUI.prototype._webPatched) {
      const origPreview = window.RecorderUI.prototype.previewFile;
      window.RecorderUI.prototype.previewFile = function(encPath, escName) {
        const filePath = decodeURIComponent(encPath);
        if (filePath.startsWith('blob:') || filePath.startsWith('http') || filePath.startsWith('file://')) {
          this.currentPreviewPath = filePath;
          if (this.recordPreviewFileName) this.recordPreviewFileName.textContent = decodeURIComponent(escName);
          if (this.recordPreviewMeta) this.recordPreviewMeta.textContent = `파일: ${filePath}`;
          if (this.recordPreviewVideo) {
            this.recordPreviewVideo.src = filePath;
            this.recordPreviewVideo.play().catch(() => {});
          }
          if (this.recordPreviewModal) this.recordPreviewModal.classList.add('active');
          return;
        }
        return origPreview.call(this, encPath, escName);
      };

      const origCapture = window.RecorderUI.prototype.openCaptureModal;
      window.RecorderUI.prototype.openCaptureModal = function(filePath, fileName, size, modified) {
        if (filePath && (filePath.startsWith('blob:') || filePath.startsWith('http'))) {
          this.currentCaptureItem = { path: filePath, name: fileName, size, modified };
          if (this.capturePreviewFileName) this.capturePreviewFileName.textContent = fileName || '캡처 이미지';
          if (this.capturePreviewImg) this.capturePreviewImg.src = filePath;
          if (this.capturePreviewMeta) {
            this.capturePreviewMeta.textContent = `${fileName} (${this.formatBytes(size || 0)}) - ${this.formatDate(modified || 0)}`;
          }
          if (this.capturePreviewDownloadLink) {
            this.capturePreviewDownloadLink.href = filePath;
            this.capturePreviewDownloadLink.download = fileName;
          }
          if (this.capturePreviewModal) this.capturePreviewModal.classList.add('active');
          return;
        }
        return origCapture.call(this, filePath, fileName, size, modified);
      };

      const fixBlobMediaMarkup = (html, item) => {
        if (!item || !item.path || !item.path.startsWith('blob:')) return html;
        const enc = encodeURIComponent(item.path);
        return html
          .replace(`/api/media/stream?path=${enc}`, item.path)
          .replace(`/api/media/thumbnail?path=${enc}`, './static/img/favicon.png');
      };

      const origCardHtml = window.RecorderUI.prototype.renderCardHtml;
      window.RecorderUI.prototype.renderCardHtml = function(item) {
        return fixBlobMediaMarkup(origCardHtml.call(this, item), item);
      };

      const origTableHtml = window.RecorderUI.prototype.renderTableRowHtml;
      window.RecorderUI.prototype.renderTableRowHtml = function(item) {
        return fixBlobMediaMarkup(origTableHtml.call(this, item), item);
      };

      window.RecorderUI.prototype._webPatched = true;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(applyWebOnlyEnhancements, 200);
  });

  // Override window.fetch cleanly
  window.fetch = async function(input, init) {
    const urlStr = (typeof input === 'string') ? input : (input && input.url ? input.url : '');

    if (urlStr.startsWith('/api/')) {
      if (window.__IS_STATIC_WEB__) {
        return handleVirtualApi(urlStr, init);
      }
      try {
        const res = await originalFetch(input, init);
        if (res.status === 404 || res.status === 501) {
          window.__IS_STATIC_WEB__ = true;
          applyWebOnlyEnhancements();
          return handleVirtualApi(urlStr, init);
        }
        return res;
      } catch (e) {
        window.__IS_STATIC_WEB__ = true;
        applyWebOnlyEnhancements();
        return handleVirtualApi(urlStr, init);
      }
    }

    return originalFetch(input, init);
  };

  window.webBackendPolyfill = {
    generateYoutubeEmbedHtml,
    isStaticWeb: () => window.__IS_STATIC_WEB__,
    getWebRecordings: () => webCompletedRecordings,
    pickWebRecordingFolder
  };
})();
