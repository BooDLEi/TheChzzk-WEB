/**
 * 더치지직 (The Chzzk) 실시간 라이브 & 클립 클라이언트 API 엔진
 * 실제 치지직 라이브 API(lives, live-detail, clips, play-info)를 실시간 호출합니다.
 * 클립의 경우 play-info와 NeonPlayer VOD API를 거쳐 실제 고화질 MP4 스트림 URL을 자동 추출합니다.
 */

class ChzzkEngine {
  constructor() {
    this.corsProxies = [
      (url) => url, // 1순위: 직접 호출 (Android WebView Native Interceptor)
      (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
      (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
    ];
  }

  async fetchApi(targetUrl) {
    for (let i = 0; i < this.corsProxies.length; i++) {
      const proxyFn = this.corsProxies[i];
      const url = proxyFn(targetUrl);
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 7000) : null;
      try {
        const fetchOptions = {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        };
        if (controller) {
          fetchOptions.signal = controller.signal;
        }
        const response = await fetch(url, fetchOptions);
        if (timeoutId) clearTimeout(timeoutId);
        if (response.ok) {
          const json = await response.json();
          if (json && (json.code === 200 || json.content || json.period)) {
            return json;
          }
        }
      } catch (err) {
        if (timeoutId) clearTimeout(timeoutId);
        // Fallback to next proxy
      }
    }
    throw new Error('API 호출에 실패했습니다: ' + targetUrl);
  }

  // 실시간 실제 온에어 방송 목록 (50개)
  async getLiveStreams(size = 50, sortType = 'POPULAR') {
    const url = `https://api.chzzk.naver.com/service/v1/lives?size=${size}&sortType=${sortType}`;
    try {
      const json = await this.fetchApi(url);
      if (json && json.content && json.content.data) {
        return json.content.data.map(item => ({
          channelId: item.channel.channelId,
          channelName: item.channel.channelName,
          channelImageUrl: item.channel.channelImageUrl || '',
          liveTitle: item.liveTitle || '실시간 방송',
          liveCategoryValue: item.liveCategoryValue || '종합게임',
          liveImageUrl: (item.liveImageUrl || '').replace('{type}', '720'),
          defaultThumbnail: item.defaultThumbnailImageUrl || '',
          concurrentUserCount: item.concurrentUserCount || 0,
          openDate: item.openDate || ''
        }));
      }
    } catch (e) {
      console.warn("실시간 라이브 API 호출 실패:", e);
    }
    return [];
  }

  // 실제 라이브 방송 HLS m3u8 마스터 스트림 URL 획득
  async getLiveDetail(channelId) {
    const url = `https://api.chzzk.naver.com/service/v2/channels/${channelId}/live-detail`;
    try {
      const json = await this.fetchApi(url);
      if (json && json.content) {
        const content = json.content;
        let masterHlsUrl = null;
        let encodingTracks = [];

        if (content.livePlaybackJson) {
          try {
            const pb = JSON.parse(content.livePlaybackJson);
            const mediaList = pb.media || [];
            if (mediaList.length > 0) {
              // 1순위: 표준 HLS 스트림 (재생 안정성 최고)
              const standardHls = mediaList.find(m => m.mediaId === 'HLS');
              const lowLatencyHls = mediaList.find(m => m.mediaId === 'LLHLS' || m.latency === 'lowLatency');
              const primary = standardHls || lowLatencyHls || mediaList[0];

              masterHlsUrl = primary.path;
              encodingTracks = primary.encodingTrack || [];
            }
          } catch (err) {
            console.error("livePlaybackJson 파싱 실패:", err);
          }
        }

        return {
          status: content.status,
          isOnline: content.status === 'OPEN',
          channelId: channelId,
          channelName: content.channel ? content.channel.channelName : '',
          channelImageUrl: content.channel ? content.channel.channelImageUrl : '',
          liveTitle: content.liveTitle || '',
          liveCategoryValue: content.liveCategoryValue || '',
          concurrentUserCount: content.concurrentUserCount || 0,
          masterHlsUrl: masterHlsUrl,
          encodingTracks: encodingTracks
        };
      }
    } catch (e) {
      console.error("live-detail API 실패:", e);
    }
    return null;
  }

  // 클립 실제 고화질 MP4 스트림 URL 추출
  async getClipVideoUrl(clipUID) {
    try {
      const playInfoUrl = `https://api.chzzk.naver.com/service/v1/play-info/clip/${clipUID}`;
      const playInfo = await this.fetchApi(playInfoUrl);
      if (playInfo && playInfo.content) {
        const videoId = playInfo.content.videoId;
        const inKey = playInfo.content.inKey;
        if (videoId && inKey) {
          const neonUrl = `https://apis.naver.com/neonplayer/vodplay/v1/playback/${videoId}?key=${inKey}`;
          const neonData = await this.fetchApi(neonUrl);
          if (neonData && neonData.period && neonData.period[0] && neonData.period[0].adaptationSet) {
            const sets = neonData.period[0].adaptationSet;
            for (const s of sets) {
              if (s.representation && s.representation[0] && s.representation[0].baseURL) {
                const mp4Url = s.representation[0].baseURL[0].value;
                if (mp4Url) return mp4Url;
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn(`클립 ${clipUID} 비디오 URL 추출 실패:`, e);
    }
    return '';
  }

  // 실제 채널 클립 목록 가져오기 + 각 클립 실제 재생 URL 연동
  async getChannelClips(channelId, size = 15) {
    const url = `https://api.chzzk.naver.com/service/v1/channels/${channelId}/clips?size=${size}&order=POPULAR`;
    try {
      const json = await this.fetchApi(url);
      if (json && json.content && json.content.data) {
        const rawClips = json.content.data;
        const result = [];

        for (const c of rawClips.slice(0, 8)) {
          // 각 클립의 실제 MP4 URL 획득
          let realVideoUrl = await this.getClipVideoUrl(c.clipUID);
          result.push({
            clipUID: c.clipUID,
            clipTitle: c.clipTitle,
            thumbnailImageUrl: c.thumbnailImageUrl,
            duration: c.duration,
            readCount: c.readCount,
            ownerChannelName: (c.ownerChannel && c.ownerChannel.channelName) || '스트리머',
            ownerChannelImage: (c.ownerChannel && c.ownerChannel.channelImageUrl) || c.thumbnailImageUrl,
            videoUrl: realVideoUrl
          });
        }
        return result;
      }
    } catch (e) {
      console.warn("클립 API 실패:", e);
    }
    return [];
  }

  // 채널 검색
  async searchChannels(keyword) {
    if (!keyword) return [];
    const url = `https://api.chzzk.naver.com/service/v1/search/channels?keyword=${encodeURIComponent(keyword)}&size=20`;
    try {
      const json = await this.fetchApi(url);
      if (json && json.content && json.content.data) {
        return json.content.data.map(item => ({
          channelId: item.channel.channelId,
          channelName: item.channel.channelName,
          channelImageUrl: item.channel.channelImageUrl,
          followerCount: item.channel.followerCount,
          openLive: item.channel.openLive
        }));
      }
    } catch (e) {
      console.warn("검색 실패:", e);
    }
    return [];
  }
}

window.chzzkEngine = new ChzzkEngine();
