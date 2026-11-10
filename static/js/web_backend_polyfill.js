/**
 * 더치지직 (The Chzzk) 무백엔드 / 퍼블릭 정적 웹용 가상 백엔드 폴리필
 * - 프로그램 UI(index.html) 100% 그대로 GitHub Pages(퍼블릭) 및 아이폰/타 PC 브라우저에서 실행
 * - 모든 개인 데이터(즐겨찾기, 재생목록, 나중에 볼 영상, 키워드, 시청기록)는 브라우저 localStorage에 독립 저장 (토큰 불필요)
 * - 실시간 치지직/유튜브 API CORS 프록시 자동 처리
 * - 브라우저 MediaRecorder 기반 실시간 방송 녹화 및 파일 다운로드 지원
 */

(function() {
  const originalFetch = window.fetch.bind(window);
  const host = window.location.hostname;
  const isLocalHost = (host === '127.0.0.1' || host === 'localhost') && window.location.protocol !== 'file:';

  // 정적 호스팅(github.io, netlify, vercel, file:) 이거나 강제 플래그가 있으면 즉시 정적 웹 모드 활성화
  window.__IS_STATIC_WEB__ = Boolean(window.__FORCE_STATIC_WEB__ || !isLocalHost);

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

  // CORS 프록시 목록 (실시간 200 OK 검증된 프록시 우선순위)
  const CORS_PROXIES = [
    (u) => `https://api.cors.lol/?url=${encodeURIComponent(u)}`,
    (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`
  ];

  let cachedLivesList = [];
  let cachedLivesTs = 0;
  const channelChatIdMap = {};

  // Live Web MediaRecorder Jobs Map
  const webRecorderJobs = {};
  const webCompletedRecordings = [];

  async function proxyFetchJson(targetUrl) {
    for (let i = 0; i < CORS_PROXIES.length; i++) {
      try {
        const res = await originalFetch(CORS_PROXIES[i](targetUrl), {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined
        });
        if (res.ok) {
          const text = await res.text();
          if (text && text.trim().startsWith('{')) {
            return JSON.parse(text);
          }
        }
      } catch (e) {}
    }
    throw new Error('프록시를 통한 데이터 수신 실패: ' + targetUrl);
  }

  // Invidious CORS 인스턴스 관리 (유튜브 검색, 추천, 댓글)
  let invidiousBase = 'https://yt.chocolatemoo53.com';
  async function invidiousFetchJson(ep) {
    try {
      const res = await originalFetch(`${invidiousBase}${ep}`, {
        signal: AbortSignal.timeout ? AbortSignal.timeout(7000) : undefined
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    // Fallback: instance list lookup
    try {
      const listRes = await originalFetch('https://api.invidious.io/instances.json?sort_by=health', {
        signal: AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined
      });
      if (listRes.ok) {
        const list = await listRes.json();
        for (const [, info] of list) {
          if (info && info.api && info.cors && info.uri && info.uri !== invidiousBase) {
            try {
              const r = await originalFetch(`${info.uri}${ep}`, {
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
    const vid = item.videoId;
    const thumb = (item.videoThumbnails && item.videoThumbnails.length > 0)
      ? (item.videoThumbnails.find(t => t.quality === 'medium' || t.quality === 'high')?.url || item.videoThumbnails[0].url)
      : `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
    return {
      videoId: vid,
      id: vid,
      title: item.title || '',
      channelName: item.author || 'YouTube',
      channelTitle: item.author || 'YouTube',
      channelId: item.authorId || '',
      channelUrl: item.authorUrl || '',
      thumbnail: thumb,
      thumbnails: [{ url: thumb }],
      duration: formatDuration(item.lengthSeconds),
      lengthSeconds: item.lengthSeconds || 0,
      viewCount: item.viewCount ? `${Number(item.viewCount).toLocaleString()}회` : (item.viewCountText || ''),
      publishedTime: item.publishedText || '',
      isLive: Boolean(item.liveNow)
    };
  }

  function jsonResp(obj, status = 200) {
    return new Response(JSON.stringify(obj), {
      status,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }

  // YouTube Ad-Free Embed HTML 생성기 (iframe srcdoc 용)
  function generateYoutubeEmbedHtml(videoId, slotIndex = 0, autoplay = true, startSeconds = 0) {
    const cleanVid = String(videoId).replace(/[^a-zA-Z0-9_-]/g, '');
    const autoplayVal = autoplay ? 1 : 0;
    const startSecVal = (startSeconds && startSeconds > 0) ? parseInt(startSeconds, 10) : 0;
    const origin = (window.location.origin && window.location.origin !== 'null') ? window.location.origin : 'https://www.youtube.com';

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
    var slotIndex = ${slotIndex};
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
          origin: '${origin}'
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

  // API Virtual Router
  async function handleVirtualApi(urlStr, options = {}) {
    const urlObj = new URL(urlStr, window.location.origin);
    const path = urlObj.pathname;
    const method = (options.method || 'GET').toUpperCase();
    let bodyObj = {};
    if (options.body && typeof options.body === 'string') {
      try { bodyObj = JSON.parse(options.body); } catch (e) {}
    }

    // 1. System / Status
    if (path === '/api/health') {
      return jsonResp({ status: 'ok', webMode: true });
    }
    if (path === '/api/system/version') {
      return jsonResp({ version: '1.3.1', webMode: true });
    }
    if (path.startsWith('/api/system/update')) {
      return jsonResp({ success: true, has_update: false, current_version: '1.3.1', latest_version: '1.3.1', webMode: true });
    }
    if (path === '/api/network/config') {
      return jsonResp({ success: true, config: { use_cloudflare: false } });
    }
    if (path.startsWith('/api/user/')) {
      if (path === '/api/user/status') return jsonResp({ loggedIn: false, webMode: true });
      if (path === '/api/user/following-lives') return jsonResp({ success: true, lives: [] });
      if (path === '/api/user/following-channels') return jsonResp({ success: true, channels: [] });
      if (path === '/api/user/following-ids') return jsonResp({ success: true, followingIds: [] });
      if (path === '/api/user/logpower/status') return jsonResp({ success: false, has_cookies: false });
      return jsonResp({ success: true });
    }
    if (path.startsWith('/api/diagnostics')) {
      return jsonResp({ success: true, logs: [] });
    }

    // 2. Chzzk Lives List
    if (path === '/api/lives') {
      const sortType = urlObj.searchParams.get('sortType') || 'POPULAR';
      const keyword = (urlObj.searchParams.get('keyword') || '').toLowerCase();
      const now = Date.now();
      if (cachedLivesList.length > 0 && (now - cachedLivesTs) < 15000 && !keyword) {
        return jsonResp({ success: true, total: cachedLivesList.length, lives: cachedLivesList });
      }
      try {
        let allRaw = [];
        let nextParams = `size=50&sortType=${sortType}`;
        // Fetch up to 3 pages (150 streams) for rapid response in browser
        for (let p = 0; p < 3; p++) {
          const data = await proxyFetchJson(`https://api.chzzk.naver.com/service/v1/lives?${nextParams}`);
          if (!data || data.code !== 200 || !data.content) break;
          const items = data.content.data || [];
          allRaw = allRaw.concat(items);
          const nextObj = data.content.page && data.content.page.next;
          if (!nextObj || items.length < 50) break;
          nextParams = `size=50&sortType=${sortType}&concurrentUserCount=${nextObj.concurrentUserCount}&liveId=${nextObj.liveId}`;
        }
        const seen = new Set();
        let lives = [];
        for (const item of allRaw) {
          const ch = item.channel || {};
          if (!ch.channelId || seen.has(ch.channelId)) continue;
          seen.add(ch.channelId);
          let thumb = item.liveImageUrl || '';
          if (thumb.includes('{type}')) thumb = thumb.replace('{type}', '720');
          lives.push({
            liveId: item.liveId,
            channelId: ch.channelId,
            channelName: ch.channelName || '스트리머',
            channelImageUrl: ch.channelImageUrl || '',
            verifiedMark: Boolean(ch.verifiedMark),
            liveTitle: item.liveTitle || '',
            categoryType: item.liveCategory,
            categoryValue: item.liveCategoryValue || '기타',
            userCount: item.concurrentUserCount || 0,
            thumbUrl: thumb,
            openDate: item.openDate || ''
          });
        }
        cachedLivesList = lives;
        cachedLivesTs = now;
        if (keyword) {
          lives = lives.filter(l =>
            l.channelName.toLowerCase().includes(keyword) ||
            l.liveTitle.toLowerCase().includes(keyword) ||
            l.categoryValue.toLowerCase().includes(keyword)
          );
        }
        return jsonResp({ success: true, total: lives.length, lives });
      } catch (e) {
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
          channelName: ch.channelName || channelId,
          channelImageUrl: ch.channelImageUrl || '',
          title: content.liveTitle || '',
          categoryValue: content.liveCategoryValue || '기타',
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

    // 4. Chzzk Channel Search & Info
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
            channelName: ch.channelName,
            channelImageUrl: ch.channelImageUrl,
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
        const list = (data && data.content && data.content.data) || [];
        return jsonResp({ success: true, clips: list });
      } catch (e) {
        return jsonResp({ success: false, clips: [] });
      }
    }

    if (path.startsWith('/api/channels/') && path.endsWith('/videos')) {
      const cid = path.split('/')[3];
      const size = urlObj.searchParams.get('size') || 24;
      try {
        const data = await proxyFetchJson(`https://api.chzzk.naver.com/service/v1/channels/${cid}/videos?size=${size}`);
        const list = (data && data.content && data.content.data) || [];
        return jsonResp({ success: true, videos: list });
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
          channelName: c.channelName,
          channelImageUrl: c.channelImageUrl,
          followerCount: c.followerCount || 0,
          openLive: Boolean(c.openLive),
          description: c.channelDescription || ''
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
          const packs = c[key] || [];
          for (const p of packs) {
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
            channel_name: bodyObj.channel_name || cid,
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
      const parts = path.split('/');
      const cid = parts[3];
      if (method === 'DELETE') {
        let bms = lsGet('bookmarks', []);
        bms = bms.filter(b => (b.channel_id || b.channelId) !== cid);
        lsSet('bookmarks', bms);
        return jsonResp({ success: true });
      }
      return jsonResp({ success: true, notify: true });
    }

    // 7. YouTube Data & Personal LocalStorage
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
        channelId: c.authorId,
        channelName: c.author,
        thumbnail: (c.authorThumbnails && c.authorThumbnails[0]) ? c.authorThumbnails[0].url : '',
        subscriberCount: c.subCount ? `${Number(c.subCount).toLocaleString()}명` : ''
      })) : [];
      return jsonResp({ success: true, query: q, videos, channels, total: videos.length });
    }
    if (path.startsWith('/api/youtube/related/')) {
      const vid = path.split('/').pop();
      const data = await invidiousFetchJson(`/api/v1/videos/${vid}`);
      const related = (data && Array.isArray(data.recommendedVideos)) ? data.recommendedVideos.map(mapInvidiousVideo) : [];
      return jsonResp({ success: true, videos: related });
    }
    if (path.startsWith('/api/youtube/comments/')) {
      const vid = path.split('/').pop();
      const cont = urlObj.searchParams.get('continuation') || '';
      const ep = `/api/v1/comments/${vid}` + (cont ? `?continuation=${encodeURIComponent(cont)}` : '');
      const data = await invidiousFetchJson(ep);
      const comments = (data && Array.isArray(data.comments)) ? data.comments.map(c => ({
        id: c.commentId,
        author: c.author,
        authorThumb: (c.authorThumbnails && c.authorThumbnails[0]) ? c.authorThumbnails[0].url : '',
        text: c.contentHtml || c.content || '',
        publishedTime: c.publishedText || '',
        likeCount: c.likeCount || 0,
        repliesContinuation: c.replies ? c.replies.continuation : null
      })) : [];
      return jsonResp({ success: true, comments, continuation: data ? data.continuation : null });
    }
    if (path.startsWith('/api/youtube/channel/')) {
      const cid = path.split('/').pop();
      const data = await invidiousFetchJson(`/api/v1/channels/${cid}/videos`);
      const videos = (data && Array.isArray(data.videos)) ? data.videos.map(mapInvidiousVideo) : [];
      return jsonResp({ success: true, videos });
    }
    if (path === '/api/youtube/subtitles/' || path.startsWith('/api/youtube/subtitles/')) {
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
        let list = lsGet('yt_bookmarks', []);
        list = list.filter(x => x.channelId !== cid);
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
        let list = lsGet('yt_video_bookmarks', []);
        list = list.filter(x => x.videoId !== vid);
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
        let list = lsGet('yt_watch_later', []);
        list = list.filter(x => x.videoId !== vid);
        lsSet('yt_watch_later', list);
        return jsonResp({ success: true });
      }
    }
    if (path.startsWith('/api/youtube/custom_playlists')) {
      if (method === 'GET') return jsonResp({ success: true, playlists: lsGet('yt_playlists', [{ id: 'pl_default', name: '내가 좋아하는 영상', items: [] }]) });
      if (method === 'POST') {
        const list = lsGet('yt_playlists', [{ id: 'pl_default', name: '내가 좋아하는 영상', items: [] }]);
        if (bodyObj.name) {
          list.push({ id: 'pl_' + Date.now(), name: bodyObj.name, items: [] });
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
        if (bodyObj.keyword && !kws.includes(bodyObj.keyword)) kws.push(bodyObj.keyword);
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

    // 8. Web MediaRecorder Virtual Backend
    if (path === '/api/recorder/start') {
      const chId = bodyObj.channel_id;
      const chName = bodyObj.channel_name || chId;
      let targetVideo = null;
      if (window.multiview && window.multiview.slots) {
        const slot = window.multiview.slots.find(s => s.active && s.channelId === chId && s.videoEl);
        if (slot) targetVideo = slot.videoEl;
      }
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
        channel_name: chName,
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

      rec.onstop = () => {
        jobObj.status = 'completed';
        const blob = new Blob(chunks, { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);
        // Trigger immediate browser download
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = jobObj.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        webCompletedRecordings.unshift({
          name: jobObj.filename,
          path: blobUrl,
          size: blob.size,
          modified: Date.now() / 1000,
          isBlob: true
        });
        if (window.app) window.app.showToast(`녹화 완료! 다운로드되었습니다: ${jobObj.filename}`, 'success');
      };

      rec.start(1000);
      webRecorderJobs[jobId] = jobObj;
      return jsonResp({ success: true, job_id: jobId, job: jobObj });
    }

    if (path === '/api/recorder/jobs') {
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
      return jsonResp({ recordings: webCompletedRecordings });
    }

    if (path === '/api/clips/files' || path === '/api/captures') {
      return jsonResp({ clips: [], captures: [] });
    }

    // Default fallback response for unhandled virtual APIs
    return jsonResp({ success: true, webMode: true });
  }

  // Override window.fetch cleanly
  window.fetch = async function(input, init) {
    const urlStr = (typeof input === 'string') ? input : (input && input.url ? input.url : '');

    if (urlStr.startsWith('/api/')) {
      if (window.__IS_STATIC_WEB__) {
        return handleVirtualApi(urlStr, init);
      }
      try {
        const res = await originalFetch(input, init);
        // python -m http.server 로 열었을 때 /api/ 요청이 404 or 501 리턴 시 자동 정적 웹 모드로 폴백
        if (res.status === 404 || res.status === 501) {
          window.__IS_STATIC_WEB__ = true;
          return handleVirtualApi(urlStr, init);
        }
        return res;
      } catch (e) {
        window.__IS_STATIC_WEB__ = true;
        return handleVirtualApi(urlStr, init);
      }
    }

    return originalFetch(input, init);
  };

  window.webBackendPolyfill = {
    generateYoutubeEmbedHtml,
    isStaticWeb: () => window.__IS_STATIC_WEB__,
    getWebRecordings: () => webCompletedRecordings
  };
})();
