# 더치지직 (The Chzzk) Web Edition
더치지직 PC 프로그램 UI 그대로, 별도 프로그램 설치 없이 아이폰(Safari) 및 모든 컴퓨터 브라우저에서 사용하는 공식 웹 에디션입니다.

## 퍼블릭 배포 보안 구조
- 이 저장소에는 백엔드 소스코드, GitHub 토큰, 개인 쿠키, 즐겨찾기 JSON 파일이 일절 포함되지 않습니다.
- Content-Security-Policy(CSP) 적용 및 외부 프록시 호출 시 쿠키 미전송(`credentials: 'omit'`) 강제.
- 모든 즐겨찾기, 유튜브 재생목록, 나중에 볼 영상, 시청 기록, 알고리즘 키워드는 접속한 사용자의 브라우저 내부(`localStorage`)에만 독립적으로 보관됩니다.
- 웹 전용 로컬 녹화 폴더 지정/스캔(File System Access API) 및 브라우저 내 컷편집 지원.
