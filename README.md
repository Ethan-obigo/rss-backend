<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## 프로젝트 설명

팟캐스트 RSS 피드 생성기 - Spotify, 팟빵, YouTube 콘텐츠를 iTunes 호환 RSS 피드로 변환합니다.

## API 문서

Base URL: `http://localhost:3000` (개발 환경)

### 📻 Spotify

#### Spotify 쇼 처리
Spotify 팟캐스트 쇼를 RSS 피드로 변환합니다.

```http
POST /api/spotify/show
Content-Type: application/json

{
  "showId": "spotify_show_id"
}
```

**응답:**
```json
{
  "rssUrl": "http://localhost:3000/rss/spotify-{showId}"
}
```

#### Spotify 쇼 업데이트
기존 Spotify 쇼의 에피소드를 업데이트합니다.

```http
POST /api/spotify/update/:showId
```

**응답:**
```json
{
  "rssUrl": "http://localhost:3000/rss/spotify-{showId}"
}
```

---

### 🎙️ 팟빵

#### 팟빵 채널 처리
팟빵 팟캐스트 채널을 RSS 피드로 변환합니다.

```http
POST /api/podbbang/channel
Content-Type: application/json

{
  "channelId": "podbbang_channel_id"
}
```

**응답:**
```json
{
  "rssUrl": "http://localhost:3000/rss/podbbang-{channelId}"
}
```

#### 팟빵 채널 업데이트
기존 팟빵 채널의 에피소드를 업데이트합니다.

```http
POST /api/podbbang/update/:channelId
```

**응답:**
```json
{
  "rssUrl": "http://localhost:3000/rss/podbbang-{channelId}"
}
```

---

### 🎥 YouTube

#### YouTube URL 처리
YouTube 비디오, 플레이리스트, 채널을 오디오 추출과 함께 RSS 피드로 변환합니다.

```http
POST /youtube/process
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

또는

```json
{
  "url": "https://www.youtube.com/playlist?list=PLAYLIST_ID"
}
```

**응답:**
```json
{
  "rssUrl": "http://localhost:3000/rss/youtube-{id}"
}
```

**기능:**
- 비디오에서 오디오 추출
- Cloudflare R2에 업로드
- 단일 비디오, 플레이리스트, 채널 지원
- 요청 제한 (비디오 간 2초 딜레이)

---

### 📡 RSS 피드

#### RSS 피드 가져오기
모든 채널의 iTunes 호환 RSS 피드를 가져옵니다.

```http
GET /rss/:channelId
```

**응답:** XML (application/rss+xml)

**예시:**
```http
GET /rss/spotify-abc123
GET /rss/podbbang-xyz789
GET /rss/youtube-PLxxxxxx
```

---

### 📋 채널 관리

#### 모든 채널 조회
등록된 모든 채널 목록을 가져옵니다.

```http
GET /api/channels
```

**응답:**
```json
[
  {
    "id": "spotify-abc123",
    "title": "채널 제목",
    "url": "https://...",
    "thumbnail": "https://...",
    "type": "spotify",
    "videos": [...],
    "addedAt": "2025-12-11T00:00:00.000Z",
    "lastUpdate": "2025-12-11T00:00:00.000Z"
  }
]
```

#### 채널 삭제
채널과 해당 RSS 피드를 삭제합니다.

```http
DELETE /api/channel/:channelId
```

**응답:**
```json
{
  "success": true
}
```

#### 헬스 체크
API 상태를 확인합니다.

```http
GET /api/health
```

**응답:**
```json
{
  "status": "ok"
}
```

---

## 환경 변수

루트 디렉토리에 `.env` 파일을 생성하세요:

```env
# 서버
PORT=3000
BASE_URL=http://localhost:3000

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Cloudflare R2 (YouTube 오디오 저장용)
R2_ENDPOINT=your_r2_endpoint
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=your_public_url

# Spotify API (선택사항, 메타데이터용)
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
```

---

## 사용 예제

### JavaScript/TypeScript (프론트엔드)

```typescript
// YouTube 플레이리스트를 RSS로 변환
const response = await fetch('http://localhost:3000/youtube/process', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://www.youtube.com/playlist?list=PLxxxxxx'
  })
});

const { rssUrl } = await response.json();
console.log('RSS 피드:', rssUrl);
// 출력: http://localhost:3000/rss/youtube-PLxxxxxx
```

### cURL

```bash
# Spotify
curl -X POST http://localhost:3000/api/spotify/show \
  -H "Content-Type: application/json" \
  -d '{"showId": "abc123"}'

# YouTube
curl -X POST http://localhost:3000/youtube/process \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'

# RSS 피드 가져오기
curl http://localhost:3000/rss/youtube-dQw4w9WgXcQ
```

---

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
