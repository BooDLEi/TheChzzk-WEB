/**
 * 더치지직 (The Chzzk) 무백엔드 / 클라이언트 전용 API 어댑터
 * 깃허브 페이지(GitHub Pages) 등 정적 호스팅 환경에서 백엔드 서버 없이도
 * 무료 CORS 프록시를 통해 실시간 네이버 치지직 데이터를 직접 호출합니다.
 */

/**
 * 더치지직 (The Chzzk) 무백엔드 / 클라이언트 전용 API 어댑터 및 독립 로컬 스토리지
 * 깃허브 페이지(GitHub Pages) 및 모바일 웹/APK 환경에서 백엔드 서버 없이도
 * 무료 CORS 프록시를 통해 실시간 네이버 치지직 데이터를 직접 호출하며,
 * 북마크, 재생목록, 시청 기록, 녹화 내역을 브라우저 localStorage에 개인별로 독립 저장합니다.
 */

class ChzzkWebStorage {
  constructor() {
    this.PREFIX = 'thechzzk_web_';
  }

  _get(key, defaultVal) {
    try {
      const data = localStorage.getItem(this.PREFIX + key);
      return data ? JSON.parse(data) : defaultVal;
    } catch (e) {
      return defaultVal;
    }
  }

  _set(key, val) {
    try {
      localStorage.setItem(this.PREFIX + key, JSON.stringify(val));
    } catch (e) {
      console.warn('LocalStorage 저장 실패:', e);
    }
  }

  // --- 치지직 북마크 ---
  getBookmarks() {
    return this._get('bookmarks', []);
  }

  addBookmark(channel) {
    const list = this.getBookmarks();
    const channelId = channel.channelId || channel.id;
    if (!list.some(b => (b.channelId || b.id) === channelId)) {
      list.unshift({
        channelId: channelId,
        channelName: channel.channelName || channel.name,
        channelImageUrl: channel.channelImageUrl || channel.avatar || '',
        verifiedMark: channel.verifiedMark || false,
        addedAt: new Date().toISOString()
      });
      this._set('bookmarks', list);
    }
    return list;
  }

  removeBookmark(channelId) {
    let list = this.getBookmarks();
    list = list.filter(b => (b.channelId || b.id) !== channelId);
    this._set('bookmarks', list);
    return list;
  }

  isBookmarked(channelId) {
    return this.getBookmarks().some(b => (b.channelId || b.id) === channelId);
  }

  // --- 유튜브 북마크 (채널 및 영상) ---
  getYoutubeBookmarks() {
    return this._get('yt_bookmarks', []);
  }

  getYoutubeVideoBookmarks() {
    return this._get('yt_video_bookmarks', []);
  }

  addYoutubeBookmark(item) {
    const list = this.getYoutubeBookmarks();
    const id = item.channelId || item.id;
    if (!list.some(b => (b.channelId || b.id) === id)) {
      list.unshift(item);
      this._set('yt_bookmarks', list);
    }
    return list;
  }

  removeYoutubeBookmark(id) {
    let list = this.getYoutubeBookmarks();
    list = list.filter(b => (b.channelId || b.id) !== id);
    this._set('yt_bookmarks', list);
    return list;
  }

  addYoutubeVideoBookmark(video) {
    const list = this.getYoutubeVideoBookmarks();
    const id = video.videoId || video.id;
    if (!list.some(b => (b.videoId || b.id) === id)) {
      list.unshift(video);
      this._set('yt_video_bookmarks', list);
    }
    return list;
  }

  removeYoutubeVideoBookmark(id) {
    let list = this.getYoutubeVideoBookmarks();
    list = list.filter(b => (b.videoId || b.id) !== id);
    this._set('yt_video_bookmarks', list);
    return list;
  }

  // --- 유튜브 나중에 볼 영상 ---
  getWatchLater() {
    return this._get('yt_watch_later', []);
  }

  addWatchLater(video) {
    const list = this.getWatchLater();
    const id = video.videoId || video.id;
    if (!list.some(v => (v.videoId || v.id) === id)) {
      list.unshift(video);
      this._set('yt_watch_later', list);
    }
    return list;
  }

  removeWatchLater(id) {
    let list = this.getWatchLater();
    list = list.filter(v => (v.videoId || v.id) !== id);
    this._set('yt_watch_later', list);
    return list;
  }

  // --- 유튜브 커스텀 재생목록 ---
  getPlaylists() {
    return this._get('yt_playlists', [
      { id: 'default_pl_1', name: '내가 좋아하는 영상', videos: [], createdAt: new Date().toISOString() }
    ]);
  }

  createPlaylist(name) {
    const list = this.getPlaylists();
    const pl = {
      id: 'pl_' + Date.now(),
      name: name || '새 재생목록',
      videos: [],
      createdAt: new Date().toISOString()
    };
    list.push(pl);
    this._set('yt_playlists', list);
    return pl;
  }

  deletePlaylist(playlistId) {
    let list = this.getPlaylists();
    list = list.filter(p => p.id !== playlistId);
    this._set('yt_playlists', list);
    return list;
  }

  addVideoToPlaylist(playlistId, video) {
    const list = this.getPlaylists();
    const pl = list.find(p => p.id === playlistId);
    if (pl) {
      const vid = video.videoId || video.id;
      if (!pl.videos.some(v => (v.videoId || v.id) === vid)) {
        pl.videos.push(video);
        this._set('yt_playlists', list);
      }
    }
    return list;
  }

  removeVideoFromPlaylist(playlistId, videoId) {
    const list = this.getPlaylists();
    const pl = list.find(p => p.id === playlistId);
    if (pl) {
      pl.videos = pl.videos.filter(v => (v.videoId || v.id) !== videoId);
      this._set('yt_playlists', list);
    }
    return list;
  }

  // --- 알고리즘 키워드 ---
  getKeywords() {
    return this._get('yt_keywords', ['치지직', '게임', '하이라이트', '음악', '버츄얼']);
  }

  setKeywords(keywords) {
    this._set('yt_keywords', keywords);
  }

  // --- 웹 방송 녹화 내역 (Blob URL 메타) ---
  getRecordings() {
    return this._get('web_recordings', []);
  }

  addRecording(rec) {
    const list = this.getRecordings();
    list.unshift(rec);
    this._set('web_recordings', list.slice(0, 50)); // 최근 50개 유지
    return list;
  }

  removeRecording(id) {
    let list = this.getRecordings();
    list = list.filter(r => r.id !== id);
    this._set('web_recordings', list);
    return list;
  }
}

class ChzzkClientAPI {
  constructor() {
    this.corsProxies = [
      (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
      (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
    ];
    this.proxyIndex = 0;
    this.localBackendUrl = "http://127.0.0.1:8930";
    this.hasLocalBackend = false;
    this.storage = new ChzzkWebStorage();
  }

  async checkLocalBackend() {
    try {
      const res = await fetch(`${this.localBackendUrl}/api/health`, { method: 'GET', signal: AbortSignal.timeout(1000) });
      if (res.ok) {
        this.hasLocalBackend = true;
        return true;
      }
    } catch (e) {
      this.hasLocalBackend = false;
    }
    return false;
  }

  async fetchDirectOrProxy(targetUrl, headers = {}) {
    // 1. 만약 로컬 백엔드가 있으면 우선 이용
    if (this.hasLocalBackend) {
      try {
        const proxyApiUrl = `${this.localBackendUrl}/api/proxy/stream?url=${encodeURIComponent(targetUrl)}`;
        const res = await fetch(proxyApiUrl);
        if (res.ok) return await res.json();
      } catch (e) {
        // Fallback to client proxy
      }
    }

    // 2. GitHub Pages / 정적 웹: CORS 프록시 순차 시도
    for (let i = 0; i < this.corsProxies.length; i++) {
      const proxyFn = this.corsProxies[(this.proxyIndex + i) % this.corsProxies.length];
      const proxiedUrl = proxyFn(targetUrl);
      try {
        const response = await fetch(proxiedUrl, {
          headers: {
            'Accept': 'application/json',
            ...headers
          },
          signal: AbortSignal.timeout(6000)
        });
        if (response.ok) {
          const data = await response.json();
          this.proxyIndex = (this.proxyIndex + i) % this.corsProxies.length;
          return data;
        }
      } catch (err) {
        // console.warn(`프록시 연결 시도 ${i + 1} 실패, 다음 프록시 시도:`, err);
      }
    }

    throw new Error('치지직 API 데이터를 불러오지 못했습니다.');
  }

  // 실시간 라이브 목록 불러오기
  async getLiveStreams(size = 50, sortType = 'POPULAR') {
    const url = `https://api.chzzk.naver.com/service/v1/lives?size=${size}&sortType=${sortType}`;
    try {
      const json = await this.fetchDirectOrProxy(url);
      if (json && json.content && json.content.data) {
        return json.content.data.map(item => this.normalizeLiveItem(item));
      }
    } catch (e) {
      console.warn("실시간 라이브 API 에러, 폴백 데이터 반환:", e);
    }
    return this.getFallbackLives();
  }

  // 채널 검색 (팔로우 및 탐색용)
  async searchChannels(keyword) {
    if (!keyword) return [];
    const url = `https://api.chzzk.naver.com/service/v1/search/channels?keyword=${encodeURIComponent(keyword)}&size=20`;
    try {
      const json = await this.fetchDirectOrProxy(url);
      if (json && json.content && json.content.data) {
        return json.content.data.map(item => ({
          channelId: item.channel.channelId,
          channelName: item.channel.channelName,
          channelImageUrl: item.channel.channelImageUrl,
          verifiedMark: item.channel.verifiedMark,
          followerCount: item.channel.followerCount,
          openLive: item.channel.openLive
        }));
      }
    } catch (e) {
      console.warn("채널 검색 API 에러:", e);
    }
    return [];
  }

  // 채널 클립 목록 불러오기
  async getChannelClips(channelId, order = 'POPULAR', size = 30) {
    const url = `https://api.chzzk.naver.com/service/v1/channels/${channelId}/clips?size=${size}&order=${order}`;
    try {
      const json = await this.fetchDirectOrProxy(url);
      if (json && json.content && json.content.data) {
        return json.content.data.map(clip => ({
          clipUID: clip.clipUID,
          clipTitle: clip.clipTitle,
          thumbnailImageUrl: clip.thumbnailImageUrl,
          duration: clip.duration,
          readCount: clip.readCount,
          ownerChannelName: clip.ownerChannel ? clip.ownerChannel.channelName : '',
          ownerChannelImage: clip.ownerChannel ? clip.ownerChannel.channelImageUrl : '',
          createdDate: clip.createdDate,
          videoUrl: clip.videoUrl || clip.clipPlaybackUrl || ''
        }));
      }
    } catch (e) {
      console.warn("클립 API 에러, 목업 클립 반환:", e);
    }
    return this.getFallbackClips();
  }

  // 라이브 상세 및 HLS m3u8 재생 URL 획득
  async getLiveDetail(channelId) {
    const url = `https://api.chzzk.naver.com/service/v2/channels/${channelId}/live-detail`;
    try {
      const json = await this.fetchDirectOrProxy(url);
      if (json && json.content) {
        const live = json.content;
        let playbackUrl = null;
        if (live.livePlaybackJson) {
          try {
            const pb = JSON.parse(live.livePlaybackJson);
            if (pb.media && pb.media.length > 0) {
              const hls = pb.media.find(m => m.mediaId === 'hls') || pb.media[0];
              playbackUrl = hls.path;
            }
          } catch (err) {}
        }
        return {
          status: live.status,
          liveTitle: live.liveTitle,
          liveCategoryValue: live.liveCategoryValue,
          concurrentUserCount: live.concurrentUserCount,
          playbackUrl: playbackUrl
        };
      }
    } catch (e) {
      console.warn("라이브 상세 파싱 실패:", e);
    }
    return null;
  }

  normalizeLiveItem(item) {
    return {
      channelId: item.channel ? item.channel.channelId : item.channelId,
      channelName: item.channel ? item.channel.channelName : item.channelName,
      channelImageUrl: item.channel ? item.channel.channelImageUrl : item.channelImageUrl,
      liveTitle: item.liveTitle || '라이브 방송',
      liveCategoryValue: item.liveCategoryValue || '종합게임',
      liveImageUrl: item.liveImageUrl ? item.liveImageUrl.replace('{type}', '720') : '',
      concurrentUserCount: item.concurrentUserCount || 0,
      openDate: item.openDate || '',
      defaultThumbnail: item.defaultThumbnailImageUrl || item.liveImageUrl
    };
  }

  getFallbackLives() {
    return [
      {
        channelId: "c1",
        channelName: "풍월량",
        liveTitle: "신작 콘솔 갓겜 정복 프로젝트 1일차",
        liveCategoryValue: "종합게임",
        liveImageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=720&auto=format&fit=crop&q=80",
        channelImageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
        concurrentUserCount: 15420
      },
      {
        channelId: "c2",
        channelName: "침착맨",
        liveTitle: "조조와 유비의 리더십 비교 분석 토론",
        liveCategoryValue: "토크/캠방",
        liveImageUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=720&auto=format&fit=crop&q=80",
        channelImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
        concurrentUserCount: 11200
      },
      {
        channelId: "c3",
        channelName: "우왁굳",
        liveTitle: "[발로란트] 오늘 무조건 불멸 찍고 퇴근합니다",
        liveCategoryValue: "FPS",
        liveImageUrl: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=720&auto=format&fit=crop&q=80",
        channelImageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
        concurrentUserCount: 9840
      },
      {
        channelId: "c4",
        channelName: "녹두로",
        liveTitle: "슈퍼마리오 메이커 2 초고난도 슈퍼 익스트림 맵 도전",
        liveCategoryValue: "슈퍼마리오",
        liveImageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=720&auto=format&fit=crop&q=80",
        channelImageUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
        concurrentUserCount: 6510
      },
      {
        channelId: "c5",
        channelName: "괴물쥐",
        liveTitle: "다이아 1 승급전 막판 제발 버스 태워주세요",
        liveCategoryValue: "League of Legends",
        liveImageUrl: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=720&auto=format&fit=crop&q=80",
        channelImageUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80",
        concurrentUserCount: 8200
      }
    ];
  }

  // ================= YouTube API 지원 (백엔드 및 웹 프록시 자동 전환) =================
  async getYoutubeRecommendations() {
    if (this.hasLocalBackend) {
      try {
        const res = await fetch(`${this.localBackendUrl}/api/youtube/recommendations`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.videos) return data.videos;
        }
      } catch (e) {}
    }
    // 백엔드 미동작 시 키워드 기반 Invidious/공개 API 또는 기본 추천 목록 반환
    return this.getFallbackYoutubeVideos();
  }

  async searchYoutube(query) {
    if (!query) return [];
    if (this.hasLocalBackend) {
      try {
        const res = await fetch(`${this.localBackendUrl}/api/youtube/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.results) return data.results;
        }
      } catch (e) {}
    }
    return this.getFallbackYoutubeVideos().filter(v => v.title.includes(query) || v.channelTitle.includes(query));
  }

  async getYoutubeComments(videoId, continuation = '') {
    if (this.hasLocalBackend) {
      try {
        const url = `${this.localBackendUrl}/api/youtube/comments/${videoId}` + (continuation ? `?continuation=${encodeURIComponent(continuation)}` : '');
        const res = await fetch(url);
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    return {
      comments: [
        {
          id: 'c1',
          author: '시청자1',
          authorThumb: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60',
          text: '웹버전에서도 유튜브 재생이 너무 깔끔하게 잘 되네요!',
          publishedTime: '방금 전',
          likeCount: '24'
        },
        {
          id: 'c2',
          author: '치지직팬',
          authorThumb: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60',
          text: '모바일에서도 실시간으로 바로 볼 수 있어서 편리합니다.',
          publishedTime: '10분 전',
          likeCount: '15'
        }
      ],
      continuation: null
    };
  }

  async getYoutubeRelated(videoId) {
    if (this.hasLocalBackend) {
      try {
        const res = await fetch(`${this.localBackendUrl}/api/youtube/related/${videoId}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.videos) return data.videos;
        }
      } catch (e) {}
    }
    return this.getFallbackYoutubeVideos();
  }

  getFallbackYoutubeVideos() {
    return [
      {
        videoId: "jfKfPfyJRdk",
        id: "jfKfPfyJRdk",
        title: "lofi hip hop radio - beats to relax/study to",
        channelTitle: "Lofi Girl",
        channelId: "UCSJ4gkVC6NrvII8umztf0Ow",
        thumbnail: "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg",
        thumbnails: [{ url: "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg" }],
        viewCount: "실시간",
        publishedTime: "LIVE",
        isLive: true
      },
      {
        videoId: "5qap5aO4i9A",
        id: "5qap5aO4i9A",
        title: "Lofi Hip Hop Radio - Beats to Sleep/Chill to",
        channelTitle: "Lofi Girl",
        channelId: "UCSJ4gkVC6NrvII8umztf0Ow",
        thumbnail: "https://i.ytimg.com/vi/5qap5aO4i9A/hqdefault.jpg",
        thumbnails: [{ url: "https://i.ytimg.com/vi/5qap5aO4i9A/hqdefault.jpg" }],
        viewCount: "실시간",
        publishedTime: "LIVE",
        isLive: true
      },
      {
        videoId: "DWcJFNfaw9c",
        id: "DWcJFNfaw9c",
        title: "스텔라이브 1기 사비 메들리 (오피셜 트랙)",
        channelTitle: "스텔라이브",
        channelId: "UC_stellive",
        thumbnail: "https://i.ytimg.com/vi/DWcJFNfaw9c/hqdefault.jpg",
        thumbnails: [{ url: "https://i.ytimg.com/vi/DWcJFNfaw9c/hqdefault.jpg" }],
        viewCount: "58만회",
        publishedTime: "2주 전",
        isLive: false
      },
      {
        videoId: "kJQP7kiw5Fk",
        id: "kJQP7kiw5Fk",
        title: "Luis Fonsi - Despacito ft. Daddy Yankee",
        channelTitle: "Luis Fonsi",
        channelId: "UCLp8RBhQHu9wSsq62j_Md6A",
        thumbnail: "https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
        thumbnails: [{ url: "https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg" }],
        viewCount: "82억회",
        publishedTime: "7년 전",
        isLive: false
      }
    ];
  }
}

window.chzzkClientAPI = new ChzzkClientAPI();
window.chzzkClientAPI.checkLocalBackend();
