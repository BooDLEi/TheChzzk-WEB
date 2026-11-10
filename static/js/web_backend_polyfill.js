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

  // XSS 방어용 텍스트 정제 헬퍼 (외부 API 응답 내 악성 HTML/스크립트 차단)
  function sanitizeText(str) {
    if (!str) return '';
    return String(str)
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '');
  }

  // 안전한 YouTube ID 정제
  function cleanYtId(id) {
    return String(id || '').replace(/[^a-zA-Z0-9_-]/g, '');
  }

  // 캐시 및 상태 저장소
  let cachedLivesList = [];
  let cachedLivesTs = 0;
  const channelChatIdMap = {};
  const webRecorderJobs = {};
  const webCompletedRecordings = []; // 브라우저 녹화 또는 폴더에서 불러온 비디오
  const webLocalCaptures = [];       // 폴더에서 불러온 이미지
  let selectedDirectoryHandle = null;

  // ================= CORS 프록시 & Android Native Fetch =================
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

    // 1순위: r.jina.ai (Simple GET, no custom headers -> no CORS preflight, 200 OK)
    const proxyList = [
      {
        name: 'jina',
        url: `https://r.jina.ai/${targetUrl}`,
        parse: (txt) => {
          const idx = txt.indexOf('{');
          if (idx === -1) return null;
          const parsed = JSON.parse(txt.slice(idx));
          if (parsed && parsed.data && typeof parsed.data.content === 'string') {
            return JSON.parse(parsed.data.content);
          }
          return parsed;
        }
      },
      {
        name: 'cors.lol',
        url: `https://api.cors.lol/?url=${encodeURIComponent(targetUrl)}`,
        parse: (txt) => JSON.parse(txt)
      },
      {
        name: 'codetabs',
        url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
        parse: (txt) => JSON.parse(txt)
      },
      {
        name: 'allorigins',
        url: `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
        parse: (txt) => JSON.parse(txt)
      }
    ];

    for (const p of proxyList) {
      try {
        const res = await originalFetch(p.url, {
          method: 'GET',
          credentials: 'omit',
          signal: AbortSignal.timeout ? AbortSignal.timeout(9000) : undefined
        });
        if (!res.ok) continue;
        const txt = await res.text();
        if (!txt) continue;
        const parsed = p.parse(txt);
        if (parsed && (parsed.code === 200 || parsed.content)) {
          return parsed;
        }
      } catch (e) {
        // Fallback to next proxy
      }
    }

    throw new Error('프록시를 통한 데이터 수신 실패: ' + targetUrl);
  }

  // Invidious CORS-enabled API
  let invidiousBase = 'https://yt.chocolatemoo53.com';
  async function invidiousFetchJson(ep) {
    // Android 네이티브 브릿지 우선
    if (window.AndroidChzzk && typeof window.AndroidChzzk.nativeFetch === 'function') {
      try {
        const raw = window.AndroidChzzk.nativeFetch(`${invidiousBase}${ep}`);
        if (raw && (raw.trim().startsWith('{') || raw.trim().startsWith('['))) {
          return JSON.parse(raw);
        }
      } catch (e) {}
    }

    try {
      const res = await originalFetch(`${invidiousBase}${ep}`, {
        credentials: 'omit',
        signal: AbortSignal.timeout ? AbortSignal.timeout(7000) : undefined
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    // Live instance fallback
    try {
      const listRes = await originalFetch('https://api.invidious.io/instances.json?sort_by=health', {
        credentials: 'omit',
        signal: AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined
      });
      if (listRes.ok) {
        const list = await listRes.json();
        for (const [, info] of list) {
          if (info && info.api && info.cors && info.uri && info.uri !== invidiousBase) {
            try {
              const r = await originalFetch(`${info.uri}${ep}`, {
                credentials: 'omit',
                signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined
              });
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
    if (!sec || isNaN(sec)) return '';
    const s = Math.floor(sec);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
    return `${m}:${String(r).padStart(2, '0')}`;
  }

  function mapInvidiousVideo(item) {
    const vid = cleanYtId(item.videoId);
    // 썸네일은 깨지는 Invidious 프록시 URL 대신 항상 공식 YouTube i.ytimg.com CDN 사용!
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
      publishedTime: sanitizeText(item.publishedText || ''),
      isLive: Boolean(item.liveNow)
    };
  }

  function resolveAvatarUrl(c) {
    let rawUrl = '';
    if (Array.isArray(c.authorThumbnails) && c.authorThumbnails.length > 0) {
      rawUrl = c.authorThumbnails[0].url || '';
    } else if (c.authorThumbnail) {
      rawUrl = c.authorThumbnail;
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

  // YouTube IFrame Embed HTML 생성기 (iframe srcdoc 용 - Strict Sanitization)
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
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; background: #000; overflow: hidden; display: flex; align-items: center; justify-content: center; user-select: none; }
    #player { width: 100% !important; height: 100% !important; border: none; }
  </style>
</head>
<body>
  <div id="player"></div>
  <script src="https://www.youtube.com/iframe_api"></script>
  <script>
    var player = null;
    var slotIndex = ${safeSlot};
    var timeTimer = null;

    function onYouTubeIframeAPIReady() {
      player = new YT.Player('player', {
        width: '100%',
        height: '100%',
        videoId: '${cleanVid}',
        playerVars: {
          autoplay: ${autoplayVal},
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          cc_load_policy: 0,
          playsinline: 1,
          enablejsapi: 1,
          start: ${startSecVal},
          origin: '${safeOrigin}'
        },
        events: {
          onReady: function(e) {
            if (${autoplayVal}) { e.target.playVideo(); }
            startTimeTracker();
            window.parent.postMessage({ type: 'yt_ready', slot: slotIndex, videoId: '${cleanVid}' }, '*');
          },
          onStateChange: function(e) {
            window.parent.postMessage({ type: 'yt_state', slot: slotIndex, state: e.data }, '*');
            if (e.data === YT.PlayerState.ENDED) {
              window.parent.postMessage({ type: 'yt_ended', slot: slotIndex, videoId: '${cleanVid}' }, '*');
            }
          },
          onError: function(e) {
            window.parent.postMessage({ type: 'yt_error', slot: slotIndex, code: e.data }, '*');
          }
        }
      });
    }

    function startTimeTracker() {
      if (timeTimer) clearInterval(timeTimer);
      timeTimer = setInterval(function() {
        if (!player || typeof player.getCurrentTime !== 'function') return;
        try {
          var cur = player.getCurrentTime() || 0;
          var dur = player.getDuration() || 0;
          var vData = (typeof player.getVideoData === 'function') ? player.getVideoData() : null;
          var isLive = Boolean(vData && vData.isLive) || (dur === 0 && player.getPlayerState() === 1);
          window.parent.postMessage({
            type: 'yt_timeupdate',
            slot: slotIndex,
            currentTime: cur,
            duration: dur,
            isLive: isLive
          }, '*');
        } catch(err) {}
      }, 450);
    }

    window.addEventListener('message', function(event) {
      var d = event.data;
      if (!d || typeof d !== 'object' || !player) return;
      try {
        if (d.action === 'play') player.playVideo();
        else if (d.action === 'pause') player.pauseVideo();
        else if (d.action === 'mute') player.mute();
        else if (d.action === 'unmute') player.unMute();
        else if (d.action === 'setVolume') player.setVolume(d.value);
        else if (d.action === 'seekTo') player.seekTo(d.value, true);
        else if (d.action === 'setPlaybackQuality') player.setPlaybackQuality(d.value);
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
    if (options.body && typeof options.body === 'string') {
      try { bodyObj = JSON.parse(options.body); } catch (e) {}
    }

    // 1. System / Status
    if (path === '/api/health') return jsonResp({ status: 'ok', webMode: true });
    if (path === '/api/system/version') return jsonResp({ version: '1.3.1', webMode: true });
    if (path.startsWith('/api/system/update')) {
      return jsonResp({ success: true, has_update: false, current_version: '1.3.1', latest_version: '1.3.1', webMode: true });
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

    // 2. Chzzk Lives List (1회 50개 요청 + 30초 캐싱으로 Rate Limit 원천 차단)
    if (path === '/api/lives') {
      const sortType = urlObj.searchParams.get('sortType') || 'POPULAR';
      const keyword = (urlObj.searchParams.get('keyword') || '').toLowerCase();
      const now = Date.now();
      if (cachedLivesList.length > 0 && (now - cachedLivesTs) < 30000 && !keyword) {
        return jsonResp({ success: true, total: cachedLivesList.length, lives: cachedLivesList });
      }
      try {
        const data = await proxyFetchJson(`https://api.chzzk.naver.com/service/v1/lives?size=50&sortType=${sortType}`);
        const items = (data && data.content && data.content.data) ? data.content.data : [];
        const seen = new Set();
        let lives = [];
        for (const item of items) {
          const ch = item.channel || {};
          if (!ch.channelId || seen.has(ch.channelId)) continue;
          seen.add(ch.channelId);
          let thumb = item.liveImageUrl || '';
          if (thumb.includes('{type}')) thumb = thumb.replace('{type}', '720');
          lives.push({
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
        if (lives.length > 0) {
          cachedLivesList = lives;
          cachedLivesTs = now;
        }
        if (keyword) {
          lives = lives.filter(l =>
            l.channelName.toLowerCase().includes(keyword) ||
            l.liveTitle.toLowerCase().includes(keyword) ||
            l.categoryValue.toLowerCase().includes(keyword)
          );
        }
        return jsonResp({ success: true, total: lives.length, lives });
      } catch (e) {
        if (cachedLivesList.length > 0) {
          return jsonResp({ success: true, total: cachedLivesList.length, lives: cachedLivesList });
        }
        return jsonResp({ success: false, error: '치지직 방송 목록을 불러오지 못했습니다.', lives: [] });
      }
    }

    // 3. Chzzk Live Detail
    if (path.startsWith('/api/live/')) {
      const channelId = path.split('/').pop();
      try {
        const data = await proxyFetchJson(`https://api.chzzk.naver.com/service/v2/channels/${channelId}/live-detail`);
        const content = data && data.content;
        if (!content || content.status !== 'OPEN') {
          return jsonResp({ success: false, isOnline: false, error: '현재 오프라인 상태입니다.' });
        }
        const pb = JSON.parse(content.livePlaybackJson || '{}');
        const mediaList = pb.media || [];
        const primary = mediaList.find(m => m.mediaId === 'LLHLS' || m.latency === 'lowLatency') || mediaList[0];
        if (!primary) return jsonResp({ success: false, isOnline: true, error: '스트림 경로 없음' });
        const hlsMedia = mediaList.find(m => m.mediaId === 'HLS');
        let thumb = content.liveImageUrl || '';
        if (thumb.includes('{type}')) thumb = thumb.replace('{type}', '720');
        const ch = content.channel || {};
        if (content.chatChannelId) channelChatIdMap[channelId] = content.chatChannelId;

        return jsonResp({
          success: true,
          isOnline: true,
          channelId,
          channelName: sanitizeText(ch.channelName || channelId),
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
        });
      } catch (e) {
        return jsonResp({ success: false, isOnline: false, error: '방송 정보를 불러오지 못했습니다.' });
      }
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

    // 5. Chzzk Chat Token & Emoji
    if (path.startsWith('/api/chat/') && path.endsWith('/access')) {
      const cid = path.split('/')[3];
      let chatCid = urlObj.searchParams.get('chat_channel_id') || channelChatIdMap[cid];
      try {
        if (!chatCid) {
          const ld = await proxyFetchJson(`https://api.chzzk.naver.com/service/v2/channels/${cid}/live-detail`);
          chatCid = ld && ld.content && ld.content.chatChannelId;
          if (chatCid) channelChatIdMap[cid] = chatCid;
        }
        if (!chatCid) return jsonResp({ success: false, error: '채팅 채널 ID 없음' });
        const tkData = await proxyFetchJson(`https://comm-api.game.naver.com/nng_main/v1/chats/access-token?channelId=${chatCid}&chatType=STREAMING`);
        const content = (tkData && tkData.content) || {};
        return jsonResp({
          success: true,
          channelId: cid,
          chatChannelId: chatCid,
          accessToken: content.accessToken,
          extraToken: content.extraToken || ''
        });
      } catch (e) {
        return jsonResp({ success: false, error: '채팅 토큰 발급 실패' });
      }
    }

    if (path.startsWith('/api/chat/') && path.endsWith('/emoji-packs')) {
      const cid = path.split('/')[3];
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
        return jsonResp({ success: true, emojis: emojiMap });
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

    // 7. YouTube Data (Related Thumbnails & Comments 스키마 100% 일치 + 라이브 폴백!)
    if (path === '/api/youtube/recommendations') {
      const kws = lsGet('yt_keywords', ['치지직', '스텔라이브', '게임']);
      const q = kws[Math.floor(Math.random() * kws.length)] || '치지직';
      const raw = await invidiousFetchJson(`/api/v1/search?q=${encodeURIComponent(q)}&type=video`) || await invidiousFetchJson('/api/v1/trending?region=KR');
      const videos = Array.isArray(raw) ? raw.filter(x => x.type === 'video' || x.videoId).map(mapInvidiousVideo) : [];
      return jsonResp({ success: true, videos });
    }
    if (path === '/api/youtube/search') {
      const q = urlObj.searchParams.get('query') || '';
      const raw = await invidiousFetchJson(`/api/v1/search?q=${encodeURIComponent(q)}`);
      const videos = Array.isArray(raw) ? raw.filter(x => x.type === 'video' || x.videoId).map(mapInvidiousVideo) : [];
      const channels = Array.isArray(raw) ? raw.filter(x => x.type === 'channel').map(c => ({
        channelId: cleanYtId(c.authorId),
        channelName: sanitizeText(c.author),
        thumbnail: (c.authorThumbnails && c.authorThumbnails[0]) ? c.authorThumbnails[0].url : './static/img/favicon.png',
        subscriberCount: c.subCount ? `${Number(c.subCount).toLocaleString()}명` : ''
      })) : [];
      return jsonResp({ success: true, query: q, videos, channels, total: videos.length });
    }
    if (path.startsWith('/api/youtube/related/')) {
      const vid = cleanYtId(path.split('/').pop());
      let related = [];
      const data = await invidiousFetchJson(`/api/v1/videos/${vid}`);
      if (data && Array.isArray(data.recommendedVideos) && data.recommendedVideos.length > 0) {
        related = data.recommendedVideos.map(mapInvidiousVideo);
      } else {
        // Fallback when Invidious video detail fails (e.g. live stream)
        const kws = lsGet('yt_keywords', ['치지직', '게임']);
        const fallbackRaw = await invidiousFetchJson(`/api/v1/search?q=${encodeURIComponent(kws[0] || '치지직')}&type=video`) || await invidiousFetchJson('/api/v1/trending?region=KR');
        if (Array.isArray(fallbackRaw)) {
          related = fallbackRaw.filter(x => (x.type === 'video' || x.videoId) && x.videoId !== vid).map(mapInvidiousVideo);
        }
      }
      return jsonResp({ success: true, videos: related });
    }
    if (path.startsWith('/api/youtube/comments/replies')) {
      const token = urlObj.searchParams.get('continuation') || urlObj.searchParams.get('token') || '';
      const vid = cleanYtId(urlObj.searchParams.get('video_id') || '');
      if (!token || !vid) return jsonResp({ success: false, replies: [] });
      const data = await invidiousFetchJson(`/api/v1/comments/${vid}?continuation=${encodeURIComponent(token)}`);
      const replies = (data && Array.isArray(data.comments)) ? data.comments.map(c => ({
        id: c.commentId,
        author: sanitizeText(c.author || '익명'),
        avatar: resolveAvatarUrl(c),
        published: sanitizeText(c.publishedText || ''),
        content: sanitizeText(c.content || ''),
        likeCount: c.likeCount > 0 ? String(c.likeCount) : ''
      })) : [];
      return jsonResp({ success: true, replies, continuationToken: data ? data.continuation : null });
    }
    if (path.startsWith('/api/youtube/comments/')) {
      const vid = cleanYtId(path.split('/').pop());
      const cont = urlObj.searchParams.get('continuation') || '';
      const ep = `/api/v1/comments/${vid}` + (cont ? `?continuation=${encodeURIComponent(cont)}` : '');
      const [cData, vData] = await Promise.all([
        invidiousFetchJson(ep),
        cont ? Promise.resolve(null) : invidiousFetchJson(`/api/v1/videos/${vid}`)
      ]);
      const comments = (cData && Array.isArray(cData.comments)) ? cData.comments.map(c => ({
        id: c.commentId,
        author: sanitizeText(c.author || '익명'),
        avatar: resolveAvatarUrl(c),
        published: sanitizeText(c.publishedText || ''),
        content: sanitizeText(c.content || ''),
        likeCount: c.likeCount > 0 ? String(c.likeCount) : '',
        replyToken: c.replies ? c.replies.continuation : '',
        replyCount: c.replies ? (c.replies.replyCount || 0) : 0,
        replyLabel: c.replies && c.replies.replyCount ? `답글 ${c.replies.replyCount}개` : '답글'
      })) : [];
      const videoInfo = vData ? {
        description: sanitizeText(vData.description || ''),
        viewCount: vData.viewCount ? `조회수 ${Number(vData.viewCount).toLocaleString()}회` : '',
        dateText: sanitizeText(vData.publishedText || '')
      } : {};
      return jsonResp({
        success: true,
        comments,
        continuationToken: cData ? (cData.continuation || null) : null,
        hasMore: Boolean(cData && cData.continuation),
        videoInfo
      });
    }
    if (path.startsWith('/api/youtube/channel/')) {
      const cid = cleanYtId(path.split('/').pop());
      const data = await invidiousFetchJson(`/api/v1/channels/${cid}/videos`);
      const videos = (data && Array.isArray(data.videos)) ? data.videos.map(mapInvidiousVideo) : [];
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

    // 8. 녹화 엔진 (Android 네이티브 HLS 다운로더 우선 + 웹 브라우저 MediaRecorder 폴백)
    if (path === '/api/recorder/start') {
      const chId = bodyObj.channel_id;
      const chName = bodyObj.channel_name || chId;
      let targetSlot = null;
      if (window.multiview && window.multiview.slots) {
        targetSlot = window.multiview.slots.find(s => s.active && s.channelId === chId);
      }

      // Case A: Android APK Native HLS Segment Recorder
      if (window.AndroidChzzk && typeof window.AndroidChzzk.startNativeRecord === 'function') {
        const hlsUrl = (targetSlot && targetSlot.streamUrl) ? targetSlot.streamUrl : '';
        if (!hlsUrl) {
          return jsonResp({ success: false, error: '스트림 주소를 확인할 수 없습니다. 방송 재생 중 녹화를 눌러주세요.' });
        }
        try {
          const resStr = window.AndroidChzzk.startNativeRecord(hlsUrl, chName, chId);
          const resObj = JSON.parse(resStr);
          if (resObj && resObj.success) {
            webRecorderJobs[resObj.job_id] = resObj.job;
            return jsonResp(resObj);
          }
          return jsonResp({ success: false, error: resObj.error || '네이티브 녹화 시작 실패' });
        } catch (e) {
          return jsonResp({ success: false, error: '안드로이드 녹화 브릿지 오류: ' + e.message });
        }
      }

      // Case B: Browser Web MediaRecorder
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
      const jobObj = {
        job_id: jobId,
        channel_id: chId,
        channel_name: sanitizeText(chName),
        status: 'recording',
        start_time: Date.now() / 1000,
        elapsed_seconds: 0,
        file_size: 0,
        filename: `TheChzzk_녹화_${chName}_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '_')}.webm`,
        recorder: rec,
        chunks: chunks
      };

      rec.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          chunks.push(ev.data);
          jobObj.file_size = chunks.reduce((s, c) => s + c.size, 0);
        }
      };

      rec.onstop = async () => {
        jobObj.status = 'completed';
        const blob = new Blob(chunks, { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);

        // 만약 사용자가 웹에서 쓰기 가능한 로컬 녹화 폴더를 지정했다면 폴더 안에 직접 저장 시도
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
      const list = Object.values(webRecorderJobs).map(j => ({
        job_id: j.job_id,
        channel_id: j.channel_id,
        channel_name: j.channel_name,
        status: j.status,
        elapsed_seconds: j.status === 'recording' ? Math.floor(now - j.start_time) : j.elapsed_seconds,
        file_size: j.file_size,
        filename: j.filename
      }));
      return jsonResp({ jobs: list });
    }

    if (path.startsWith('/api/recorder/stop/')) {
      const jid = path.split('/').pop();
      if (window.AndroidChzzk && typeof window.AndroidChzzk.stopNativeRecord === 'function') {
        try {
          return jsonResp(JSON.parse(window.AndroidChzzk.stopNativeRecord(jid)));
        } catch (e) {}
      }
      const job = webRecorderJobs[jid];
      if (job && job.recorder && job.recorder.state === 'recording') {
        job.elapsed_seconds = Math.floor(Date.now() / 1000 - job.start_time);
        job.recorder.stop();
        return jsonResp({ success: true });
      }
      return jsonResp({ success: false });
    }

    if (path === '/api/recorder/clear-completed') {
      for (const k of Object.keys(webRecorderJobs)) {
        if (webRecorderJobs[k].status !== 'recording') delete webRecorderJobs[k];
      }
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
      return jsonResp({ captures: webLocalCaptures });
    }

    if (path === '/api/clips/files') {
      return jsonResp({ clips: [] });
    }

    if (path === '/api/utils/open-folder') {
      // 웹버전에서는 폴더 선택기 다이얼로그 트리거
      if (window.__IS_STATIC_WEB__) {
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

    // 2. 녹화 보관함 상단: 웹버전 전용 [녹화 폴더 지정 / 로컬 영상 불러오기] 버튼 안내 적용
    const openFolderBtn = document.getElementById('openRecordingsFolderBtn');
    if (openFolderBtn) {
      openFolderBtn.title = '내 기기에서 녹화 폴더 지정 또는 로컬 영상 파일 스캔하기 (웹 전용)';
      const spanEl = openFolderBtn.querySelector('span');
      if (spanEl) spanEl.textContent = '녹화 폴더 지정 / 불러오기';
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
        if (filePath.startsWith('blob:') || filePath.startsWith('http')) {
          if (this.capturePreviewImg) this.capturePreviewImg.src = filePath;
          if (this.capturePreviewDownloadLink) {
            this.capturePreviewDownloadLink.href = filePath;
            this.capturePreviewDownloadLink.download = fileName;
          }
          if (this.capturePreviewModal) this.capturePreviewModal.classList.add('active');
          return;
        }
        return origCapture.call(this, filePath, fileName, size, modified);
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
