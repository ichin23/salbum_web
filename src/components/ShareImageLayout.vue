<script setup lang="ts">
import { computed } from 'vue'
import type {
  FullReviewInfoDTO,
  FullQuickReviewDTO,
  FullMusicShareDTO,
} from '../types'

const props = withDefaults(defineProps<{
  postType: 'review' | 'quick_review' | 'music_share'
  review?: FullReviewInfoDTO | null
  quickReview?: FullQuickReviewDTO | null
  musicShare?: FullMusicShareDTO | null
  background?: 'cartaz' | 'fita' | 'estudio'
}>(), {
  background: 'cartaz',
})

const user = computed(() => {
  if (props.postType === 'review') return props.review?.review.user ?? null
  if (props.postType === 'quick_review') return props.quickReview?.quickReview.user ?? null
  if (props.postType === 'music_share') return props.musicShare?.musicShare.user ?? null
  return null
})

const coverUrl = computed(() => {
  if (props.postType === 'review') return props.review?.review.album.image_url ?? null
  if (props.postType === 'quick_review') {
    const qr = props.quickReview?.quickReview
    if (qr?.album) return qr.album.image_url ?? null
    if (qr?.music?.album) return qr.music.album.image_url ?? null
    return null
  }
  if (props.postType === 'music_share') {
    const s = props.musicShare?.musicShare
    if (s?.music?.album?.image_url) return s.music.album.image_url
    if (s?.album?.image_url) return s.album.image_url
    if (s?.artist?.image_url) return s.artist.image_url
    return null
  }
  return null
})

const albumName = computed(() => {
  if (props.postType === 'review') return props.review?.review.album.name ?? ''
  if (props.postType === 'quick_review') return props.quickReview?.quickReview.album?.name ?? ''
  if (props.postType === 'music_share') {
    const s = props.musicShare?.musicShare
    if (s?.music?.album?.name) return s.music.album.name
    if (s?.album?.name) return s.album.name
    if (s?.artist?.name) return s.artist.name
    return ''
  }
  return ''
})

const artistNames = computed(() => {
  if (props.postType === 'review') return props.review?.review.album.artists?.map(a => a.name).join(', ') ?? ''
  if (props.postType === 'quick_review') return props.quickReview?.quickReview.album?.artists?.map(a => a.name).join(', ') ?? ''
  if (props.postType === 'music_share') {
    const s = props.musicShare?.musicShare
    if (s?.music?.artists?.length) return s.music.artists.map(a => a.name).join(', ')
    if (s?.album?.artists?.length) return s.album.artists.map(a => a.name).join(', ')
    return ''
  }
  return ''
})

const contentText = computed(() => {
  if (props.postType === 'review') return props.review?.review.content ?? null
  if (props.postType === 'quick_review') return props.quickReview?.quickReview.considerations ?? null
  if (props.postType === 'music_share') return props.musicShare?.musicShare.comment ?? null
  return null
})

const score = computed(() => {
  if (props.postType === 'review') return props.review?.review.albumScore ?? null
  if (props.postType === 'quick_review') return props.quickReview?.quickReview.score ?? null
  return null
})

const trackScores = computed(() => {
  if (props.postType !== 'review') return null
  return props.review?.review.trackScores ?? null
})

const quickReviewSentiment = computed(() => props.quickReview?.quickReview.sentiment ?? null)
const quickReviewFavoriteTrack = computed(() => props.quickReview?.quickReview.favoriteTrack ?? null)
const quickReviewFavoriteTrackComment = computed(() => props.quickReview?.quickReview.favoriteTrackComment ?? null)

const fallbackInitial = computed(() => albumName.value?.charAt(0)?.toUpperCase() ?? '?')
const qrScore = computed(() => props.quickReview?.quickReview.score ?? 0)

const titleText = computed(() => {
  if (props.postType === 'music_share') {
    const s = props.musicShare?.musicShare
    if (s?.music?.name) return s.music.name
    if (s?.album?.name) return s.album.name
    if (s?.artist?.name) return s.artist.name
    return ''
  }
  return albumName.value
})

const subtitleText = computed(() => {
  if (props.postType === 'music_share') {
    const s = props.musicShare?.musicShare
    if (s?.music?.album?.name) return `${s.music.album.name} • ${artistNames.value}`
    return artistNames.value
  }
  return ''
})

function starFill(index: number, s: number): string {
  if (s >= index) return '100%'
  if (s >= index - 0.5) return '50%'
  return '0%'
}

const isPositive = (f: string) => ['EUPHORIC','ENERGIZED','EMPOWERED','HAPPY','NOSTALGIC','INSPIRED','IN_LOVE','HOPEFUL'].includes(f)
const isNegative = (f: string) => ['MELANCHOLIC','ANXIOUS','TENSE','LONELY','DEVASTATED','ANGRY','BORED'].includes(f)
</script>

<template>
  <div style="width:1080px; height:1920px; overflow:hidden; position:relative;">

    <!-- CARTAZ: dark navy/indigo, purple glow, yellow stars (matches reference) -->
    <div
      v-if="background === 'cartaz'"
      style="width:1080px; height:1920px; box-sizing:border-box; position:relative; overflow:hidden;
             font-family:'Inter',system-ui,-apple-system,sans-serif;
             background:linear-gradient(170deg, #0c0c2b 0%, #130840 28%, #091532 60%, #040410 100%);
             display:flex; flex-direction:column;"
    >
      <div style="display:flex; flex-direction:column; align-items:center; flex:1; min-height:0; padding:100px 88px 84px; box-sizing:border-box;">

        <!-- Album cover -->
        <div style="flex-shrink:0; width:520px; height:520px; border-radius:20px; overflow:hidden;
                    box-shadow:0 0 0 6px #7c3aed, 0 0 56px rgba(124,58,237,0.55), 0 0 110px rgba(124,58,237,0.22);">
          <img v-if="coverUrl" :src="coverUrl" alt="Cover" style="width:100%;height:100%;object-fit:cover;display:block;" crossorigin="anonymous"/>
          <div v-else style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#1a1030;font-size:120px;font-weight:700;color:#7c3aed;">{{ fallbackInitial }}</div>
        </div>

        <div style="height:48px;flex-shrink:0;"/>

        <!-- Title + artist -->
        <div style="flex-shrink:0;text-align:center;width:100%;">
          <div style="font-size:58px;font-weight:700;color:#ffffff;line-height:1.2;letter-spacing:-0.5px;">{{ titleText }}</div>
          <div v-if="artistNames||subtitleText" style="font-size:30px;font-weight:400;color:#9ca3af;margin-top:10px;">{{ artistNames || subtitleText }}</div>
        </div>

        <div style="height:28px;flex-shrink:0;"/>

        <!-- Score or Stars -->
        <div style="flex-shrink:0;display:flex;align-items:center;justify-content:center;">
          <template v-if="postType==='review' && score!=null">
            <div style="display:flex;align-items:baseline;gap:8px;">
              <span style="font-size:84px;font-weight:800;line-height:1;color:#ffffff;">{{ score }}</span>
              <span style="font-size:36px;font-weight:300;color:#6b7280;">/100</span>
            </div>
          </template>
          <template v-else-if="postType!=='music_share'">
            <div style="display:flex;align-items:center;gap:6px;">
              <div v-for="i in 5" :key="i" style="position:relative;width:50px;height:50px;display:inline-block;flex-shrink:0;">
                <svg width="50" height="50" viewBox="0 0 24 24" style="position:absolute;top:0;left:0;display:block;"><polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" fill="rgba(255,255,255,0.12)"/></svg>
                <div :style="{position:'absolute',top:'0',left:'0',width:starFill(i,qrScore),height:'100%',overflow:'hidden'}">
                  <svg width="50" height="50" viewBox="0 0 24 24" style="display:block;"><polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" fill="#fbbf24"/></svg>
                </div>
              </div>
            </div>
          </template>
        </div>

        <div style="height:44px;flex-shrink:0;"/>
        <div style="flex-shrink:0;width:100%;height:1px;background:rgba(255,255,255,0.1);"/>
        <div style="height:44px;flex-shrink:0;"/>

        <!-- Quote -->
        <div v-if="contentText" style="flex:1;min-height:0;width:100%;overflow:hidden;display:flex;flex-direction:column;">
          <div style="flex-shrink:0;font-size:120px;line-height:0.65;color:#7c3aed;margin-bottom:18px;font-family:Georgia,'Times New Roman',serif;font-weight:700;">"</div>
          <p style="font-size:36px;font-weight:400;color:rgba(255,255,255,0.82);line-height:1.55;margin:0;overflow:hidden;flex:1;min-height:0;">{{ contentText }}</p>
        </div>
        <div v-else style="flex:1;min-height:0;"/>

        <!-- User -->
        <div style="flex-shrink:0;display:flex;align-items:center;gap:20px;width:100%;margin-top:40px;">
          <div style="width:64px;height:64px;border-radius:50%;overflow:hidden;flex-shrink:0;background:#2a1555;border:2px solid rgba(255,255,255,0.2);">
            <img v-if="user?.imageUrl" :src="user.imageUrl" :alt="user?.username" style="width:100%;height:100%;object-fit:cover;" crossorigin="anonymous"/>
            <div v-else style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:rgba(255,255,255,0.45);">{{ user?.username?.charAt(0)?.toUpperCase() ?? '?' }}</div>
          </div>
          <span style="font-size:30px;font-weight:400;color:rgba(255,255,255,0.58);">- {{ user?.name ?? user?.username ?? 'Usuário' }}</span>
          <div v-if="quickReviewSentiment" style="margin-left:auto;padding:6px 20px;border-radius:100px;font-size:18px;font-weight:500;background:rgba(124,58,237,0.12);border:1px solid rgba(124,58,237,0.25);color:#a78bfa;">{{ quickReviewSentiment }}</div>
        </div>

        <!-- Favorite track -->
        <template v-if="quickReviewFavoriteTrack">
          <div style="height:28px;flex-shrink:0;"/>
          <div style="flex-shrink:0;width:100%;box-sizing:border-box;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:22px 28px;">
            <div style="font-size:18px;font-weight:700;color:rgba(255,255,255,0.32);text-transform:uppercase;letter-spacing:3px;margin-bottom:10px;">Música Favorita</div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;">
              <div style="flex:1;min-width:0;">
                <div style="font-size:34px;font-weight:600;color:#ffffff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ quickReviewFavoriteTrack.name }}</div>
                <div v-if="quickReviewFavoriteTrackComment" style="font-size:22px;color:rgba(255,255,255,0.38);margin-top:4px;">{{ quickReviewFavoriteTrackComment }}</div>
              </div>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="#ef4444" style="flex-shrink:0;"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </div>
          </div>
        </template>

        <!-- Track scores (full review) -->
        <template v-if="trackScores && trackScores.length>0">
          <div style="height:28px;flex-shrink:0;"/>
          <div style="flex-shrink:0;width:100%;box-sizing:border-box;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:18px;padding:20px 24px;max-height:380px;overflow:hidden;">
            <div style="font-size:18px;font-weight:700;color:rgba(255,255,255,0.28);text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">Faixas</div>
            <div v-for="ts in trackScores.slice(0,8)" :key="ts.trackId" style="display:flex;align-items:center;gap:12px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
              <span style="font-size:20px;color:rgba(255,255,255,0.26);width:28px;text-align:right;flex-shrink:0;">{{ ts.trackNumber }}.</span>
              <span style="font-size:24px;color:rgba(255,255,255,0.75);flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ ts.trackName }}</span>
              <span v-if="ts.score!=null" style="font-size:24px;font-weight:700;color:#7c3aed;width:36px;text-align:right;flex-shrink:0;">{{ ts.score }}</span>
            </div>
          </div>
        </template>

        <div style="flex-shrink:0;height:40px;"/>

        <!-- Branding -->
        <div style="flex-shrink:0;display:flex;align-items:center;justify-content:center;gap:12px;">
          <img src="/salbum_logo.svg" alt="Salbum" style="width:36px;height:36px;opacity:0.55;"/>
          <span style="font-size:30px;font-weight:700;color:rgba(255,255,255,0.55);font-family:'Jersey 25',cursive,system-ui;">Salbum</span>
          <span style="font-size:24px;color:rgba(255,255,255,0.22);">salbum.com.br</span>
        </div>
      </div>
    </div>


    <!-- FITA: clean/minimal — preto profundo, sem glow, tipografia leve -->
    <div
      v-else-if="background === 'fita'"
      style="width:1080px; height:1920px; box-sizing:border-box; position:relative; overflow:hidden;
             font-family:'Inter',system-ui,-apple-system,sans-serif;
             background:#06070b;
             display:flex; flex-direction:column;"
    >
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,0.012) 0%,transparent 40%,rgba(255,255,255,0.008) 100%);pointer-events:none;z-index:0;"/>
      <div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;flex:1;min-height:0;padding:100px 88px 84px;box-sizing:border-box;">

        <!-- Album cover -->
        <div style="flex-shrink:0;width:520px;height:520px;border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,0.07);box-shadow:0 28px 90px rgba(0,0,0,0.95),0 6px 20px rgba(0,0,0,0.7);">
          <img v-if="coverUrl" :src="coverUrl" alt="Cover" style="width:100%;height:100%;object-fit:cover;display:block;" crossorigin="anonymous"/>
          <div v-else style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#0f1016;font-size:120px;font-weight:200;color:rgba(255,255,255,0.12);">{{ fallbackInitial }}</div>
        </div>

        <div style="height:52px;flex-shrink:0;"/>

        <!-- Title + artist -->
        <div style="flex-shrink:0;text-align:center;width:100%;">
          <div style="font-size:56px;font-weight:300;color:#ffffff;line-height:1.2;letter-spacing:-1.5px;">{{ titleText }}</div>
          <div v-if="artistNames||subtitleText" style="font-size:28px;font-weight:400;color:#374151;margin-top:12px;letter-spacing:0.5px;">{{ artistNames || subtitleText }}</div>
        </div>

        <div style="height:30px;flex-shrink:0;"/>

        <!-- Score or Stars -->
        <div style="flex-shrink:0;display:flex;align-items:center;justify-content:center;">
          <template v-if="postType==='review' && score!=null">
            <div style="display:flex;align-items:baseline;gap:8px;">
              <span style="font-size:76px;font-weight:200;line-height:1;color:#ffffff;letter-spacing:-3px;">{{ score }}</span>
              <span style="font-size:32px;font-weight:300;color:#1f2937;">/100</span>
            </div>
          </template>
          <template v-else-if="postType!=='music_share'">
            <div style="display:flex;align-items:center;gap:4px;">
              <div v-for="i in 5" :key="i" style="position:relative;width:46px;height:46px;display:inline-block;flex-shrink:0;">
                <svg width="46" height="46" viewBox="0 0 24 24" style="position:absolute;top:0;left:0;display:block;"><polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" fill="rgba(255,255,255,0.07)"/></svg>
                <div :style="{position:'absolute',top:'0',left:'0',width:starFill(i,qrScore),height:'100%',overflow:'hidden'}">
                  <svg width="46" height="46" viewBox="0 0 24 24" style="display:block;"><polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" fill="#ffffff"/></svg>
                </div>
              </div>
            </div>
          </template>
        </div>

        <div style="height:48px;flex-shrink:0;"/>
        <div style="flex-shrink:0;width:100%;height:1px;background:rgba(255,255,255,0.05);"/>
        <div style="height:48px;flex-shrink:0;"/>

        <!-- Quote -->
        <div v-if="contentText" style="flex:1;min-height:0;width:100%;overflow:hidden;display:flex;flex-direction:column;">
          <p style="font-size:36px;font-weight:300;color:rgba(255,255,255,0.52);line-height:1.65;margin:0;font-style:italic;overflow:hidden;flex:1;min-height:0;">{{ contentText }}</p>
        </div>
        <div v-else style="flex:1;min-height:0;"/>

        <!-- User -->
        <div style="flex-shrink:0;display:flex;align-items:center;gap:16px;width:100%;margin-top:44px;">
          <div style="width:56px;height:56px;border-radius:50%;overflow:hidden;flex-shrink:0;background:#0f1016;">
            <img v-if="user?.imageUrl" :src="user.imageUrl" :alt="user?.username" style="width:100%;height:100%;object-fit:cover;" crossorigin="anonymous"/>
            <div v-else style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:300;color:rgba(255,255,255,0.18);">{{ user?.username?.charAt(0)?.toUpperCase() ?? '?' }}</div>
          </div>
          <span style="font-size:26px;font-weight:300;color:rgba(255,255,255,0.3);">{{ user?.name ?? user?.username ?? 'Usuário' }}</span>
          <div v-if="quickReviewSentiment" style="margin-left:auto;padding:5px 18px;border-radius:100px;font-size:16px;font-weight:400;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);color:rgba(255,255,255,0.3);letter-spacing:0.5px;">{{ quickReviewSentiment }}</div>
        </div>

        <!-- Favorite track -->
        <template v-if="quickReviewFavoriteTrack">
          <div style="height:36px;flex-shrink:0;"/>
          <div style="flex-shrink:0;width:100%;box-sizing:border-box;border-top:1px solid rgba(255,255,255,0.06);padding-top:28px;">
            <div style="font-size:15px;font-weight:500;color:rgba(255,255,255,0.18);text-transform:uppercase;letter-spacing:5px;margin-bottom:14px;">Música Favorita</div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;">
              <div style="flex:1;min-width:0;">
                <div style="font-size:32px;font-weight:300;color:rgba(255,255,255,0.72);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ quickReviewFavoriteTrack.name }}</div>
                <div v-if="quickReviewFavoriteTrackComment" style="font-size:20px;color:rgba(255,255,255,0.22);margin-top:6px;">{{ quickReviewFavoriteTrackComment }}</div>
              </div>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="rgba(255,255,255,0.18)" style="flex-shrink:0;"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </div>
          </div>
        </template>

        <!-- Track scores -->
        <template v-if="trackScores && trackScores.length>0">
          <div style="height:36px;flex-shrink:0;"/>
          <div style="flex-shrink:0;width:100%;box-sizing:border-box;border-top:1px solid rgba(255,255,255,0.04);padding-top:20px;max-height:360px;overflow:hidden;">
            <div v-for="ts in trackScores.slice(0,8)" :key="ts.trackId" style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.03);">
              <span style="font-size:18px;color:rgba(255,255,255,0.18);width:28px;text-align:right;flex-shrink:0;">{{ ts.trackNumber }}.</span>
              <span style="font-size:22px;font-weight:300;color:rgba(255,255,255,0.5);flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ ts.trackName }}</span>
              <span v-if="ts.score!=null" style="font-size:22px;font-weight:300;color:rgba(255,255,255,0.36);width:32px;text-align:right;flex-shrink:0;">{{ ts.score }}</span>
            </div>
          </div>
        </template>

        <div style="flex-shrink:0;height:44px;"/>

        <!-- Branding -->
        <div style="flex-shrink:0;display:flex;align-items:center;justify-content:center;gap:10px;">
          <img src="/salbum_logo.svg" alt="Salbum" style="width:28px;height:28px;opacity:0.18;"/>
          <span style="font-size:22px;font-weight:300;color:rgba(255,255,255,0.18);letter-spacing:5px;text-transform:uppercase;">Salbum</span>
        </div>
      </div>
    </div>


    <!-- ESTÚDIO: alegórico — gradiente vibrante, blobs, glow multi-cor -->
    <div
      v-else
      style="width:1080px; height:1920px; box-sizing:border-box; position:relative; overflow:hidden;
             font-family:'Inter',system-ui,-apple-system,sans-serif;
             background:linear-gradient(148deg, #100224 0%, #220950 20%, #0e1e56 46%, #0a1e3a 68%, #04100e 100%);
             display:flex; flex-direction:column;"
    >
      <!-- Decorative blobs -->
      <div style="position:absolute;top:-280px;left:-220px;width:900px;height:900px;border-radius:50%;background:radial-gradient(circle,rgba(139,92,246,0.18) 0%,transparent 65%);pointer-events:none;z-index:0;"/>
      <div style="position:absolute;bottom:60px;right:-180px;width:760px;height:760px;border-radius:50%;background:radial-gradient(circle,rgba(56,130,246,0.14) 0%,transparent 65%);pointer-events:none;z-index:0;"/>
      <div style="position:absolute;top:46%;left:-100px;width:560px;height:560px;border-radius:50%;background:radial-gradient(circle,rgba(236,72,153,0.08) 0%,transparent 65%);pointer-events:none;z-index:0;"/>
      <div style="position:absolute;top:-140px;right:-140px;width:700px;height:700px;border-radius:50%;border:1px solid rgba(139,92,246,0.09);pointer-events:none;z-index:0;"/>
      <div style="position:absolute;bottom:-100px;left:-100px;width:540px;height:540px;border-radius:50%;border:1px solid rgba(56,130,246,0.07);pointer-events:none;z-index:0;"/>
      <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(139,92,246,0.5),rgba(56,130,246,0.4),transparent);pointer-events:none;z-index:0;"/>

      <div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;flex:1;min-height:0;padding:100px 88px 84px;box-sizing:border-box;">

        <!-- Album cover -->
        <div style="flex-shrink:0;width:520px;height:520px;border-radius:24px;overflow:hidden;
                    box-shadow:0 0 0 4px rgba(139,92,246,0.75),0 0 0 10px rgba(139,92,246,0.18),0 0 90px rgba(139,92,246,0.45),0 24px 80px rgba(0,0,0,0.65),-18px -10px 60px rgba(59,130,246,0.15),18px 18px 60px rgba(236,72,153,0.1);">
          <img v-if="coverUrl" :src="coverUrl" alt="Cover" style="width:100%;height:100%;object-fit:cover;display:block;" crossorigin="anonymous"/>
          <div v-else style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#2d1060,#0f2060);font-size:120px;font-weight:800;color:rgba(255,255,255,0.35);">{{ fallbackInitial }}</div>
        </div>

        <div style="height:52px;flex-shrink:0;"/>

        <!-- Title + artist -->
        <div style="flex-shrink:0;text-align:center;width:100%;">
          <div style="font-size:62px;font-weight:800;color:#ffffff;line-height:1.15;letter-spacing:-1px;text-shadow:0 2px 24px rgba(139,92,246,0.28);">{{ titleText }}</div>
          <div v-if="artistNames||subtitleText" style="font-size:30px;font-weight:500;color:rgba(167,139,250,0.68);margin-top:10px;letter-spacing:0.5px;">{{ artistNames || subtitleText }}</div>
        </div>

        <div style="height:28px;flex-shrink:0;"/>

        <!-- Score or Stars -->
        <div style="flex-shrink:0;display:flex;align-items:center;justify-content:center;">
          <template v-if="postType==='review' && score!=null">
            <div style="display:flex;align-items:baseline;gap:8px;background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.22);padding:8px 32px;border-radius:100px;">
              <span style="font-size:76px;font-weight:800;line-height:1;color:#a78bfa;">{{ score }}</span>
              <span style="font-size:32px;font-weight:400;color:rgba(167,139,250,0.38);">/100</span>
            </div>
          </template>
          <template v-else-if="postType!=='music_share'">
            <div style="display:flex;align-items:center;gap:6px;background:rgba(250,204,21,0.06);border:1px solid rgba(250,204,21,0.12);padding:8px 20px;border-radius:100px;">
              <div v-for="i in 5" :key="i" style="position:relative;width:50px;height:50px;display:inline-block;flex-shrink:0;">
                <svg width="50" height="50" viewBox="0 0 24 24" style="position:absolute;top:0;left:0;display:block;"><polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" fill="rgba(255,255,255,0.09)"/></svg>
                <div :style="{position:'absolute',top:'0',left:'0',width:starFill(i,qrScore),height:'100%',overflow:'hidden'}">
                  <svg width="50" height="50" viewBox="0 0 24 24" style="display:block;"><polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" fill="#fbbf24"/></svg>
                </div>
              </div>
            </div>
          </template>
        </div>

        <div style="height:44px;flex-shrink:0;"/>
        <div style="flex-shrink:0;width:100%;height:1px;background:linear-gradient(90deg,transparent,rgba(139,92,246,0.45),rgba(56,130,246,0.3),transparent);"/>
        <div style="height:44px;flex-shrink:0;"/>

        <!-- Quote -->
        <div v-if="contentText" style="flex:1;min-height:0;width:100%;overflow:hidden;display:flex;flex-direction:column;">
          <div style="flex-shrink:0;font-size:110px;line-height:0.62;color:rgba(139,92,246,0.48);margin-bottom:20px;font-family:Georgia,'Times New Roman',serif;font-weight:700;">"</div>
          <p style="font-size:36px;font-weight:400;color:rgba(255,255,255,0.8);line-height:1.55;margin:0;overflow:hidden;flex:1;min-height:0;">{{ contentText }}</p>
        </div>
        <div v-else style="flex:1;min-height:0;"/>

        <!-- User -->
        <div style="flex-shrink:0;display:flex;align-items:center;gap:20px;width:100%;margin-top:40px;">
          <div style="width:68px;height:68px;border-radius:50%;overflow:hidden;flex-shrink:0;background:linear-gradient(135deg,#2d1060,#0f2060);box-shadow:0 0 0 2px rgba(139,92,246,0.5),0 0 20px rgba(139,92,246,0.2);">
            <img v-if="user?.imageUrl" :src="user.imageUrl" :alt="user?.username" style="width:100%;height:100%;object-fit:cover;" crossorigin="anonymous"/>
            <div v-else style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;color:rgba(255,255,255,0.45);">{{ user?.username?.charAt(0)?.toUpperCase() ?? '?' }}</div>
          </div>
          <span style="font-size:30px;font-weight:400;color:rgba(255,255,255,0.52);">- {{ user?.name ?? user?.username ?? 'Usuário' }}</span>
          <div v-if="quickReviewSentiment" style="margin-left:auto;padding:6px 20px;border-radius:100px;font-size:18px;font-weight:500;background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.25);color:#a78bfa;">{{ quickReviewSentiment }}</div>
        </div>

        <!-- Favorite track -->
        <template v-if="quickReviewFavoriteTrack">
          <div style="height:28px;flex-shrink:0;"/>
          <div style="flex-shrink:0;width:100%;box-sizing:border-box;background:linear-gradient(135deg,rgba(139,92,246,0.1),rgba(59,130,246,0.07));border:1px solid rgba(139,92,246,0.22);border-radius:20px;padding:22px 28px;">
            <div style="font-size:18px;font-weight:700;color:rgba(167,139,250,0.45);text-transform:uppercase;letter-spacing:3px;margin-bottom:10px;">Música Favorita</div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;">
              <div style="flex:1;min-width:0;">
                <div style="font-size:34px;font-weight:700;color:#ffffff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ quickReviewFavoriteTrack.name }}</div>
                <div v-if="quickReviewFavoriteTrackComment" style="font-size:22px;color:rgba(167,139,250,0.42);margin-top:4px;">{{ quickReviewFavoriteTrackComment }}</div>
              </div>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="#f43f5e" style="flex-shrink:0;filter:drop-shadow(0 0 10px rgba(244,63,94,0.5));"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </div>
          </div>
        </template>

        <!-- Track scores -->
        <template v-if="trackScores && trackScores.length>0">
          <div style="height:28px;flex-shrink:0;"/>
          <div style="flex-shrink:0;width:100%;box-sizing:border-box;background:rgba(255,255,255,0.03);border:1px solid rgba(139,92,246,0.1);border-radius:18px;padding:20px 24px;max-height:380px;overflow:hidden;">
            <div style="font-size:18px;font-weight:700;color:rgba(167,139,250,0.38);text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">Faixas</div>
            <div v-for="ts in trackScores.slice(0,8)" :key="ts.trackId" style="display:flex;align-items:center;gap:12px;padding:7px 0;border-bottom:1px solid rgba(139,92,246,0.06);">
              <span style="font-size:20px;color:rgba(167,139,250,0.28);width:28px;text-align:right;flex-shrink:0;">{{ ts.trackNumber }}.</span>
              <span style="font-size:24px;color:rgba(255,255,255,0.72);flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ ts.trackName }}</span>
              <span v-if="ts.score!=null" style="font-size:24px;font-weight:700;color:#a78bfa;width:36px;text-align:right;flex-shrink:0;">{{ ts.score }}</span>
            </div>
          </div>
        </template>

        <div style="flex-shrink:0;height:40px;"/>

        <!-- Branding -->
        <div style="flex-shrink:0;display:flex;align-items:center;justify-content:center;gap:14px;">
          <img src="/salbum_logo.svg" alt="Salbum" style="width:40px;height:40px;opacity:0.65;filter:drop-shadow(0 0 8px rgba(139,92,246,0.5));"/>
          <span style="font-size:32px;font-weight:700;color:rgba(255,255,255,0.62);font-family:'Jersey 25',cursive,system-ui;text-shadow:0 0 20px rgba(139,92,246,0.3);">Salbum</span>
          <span style="font-size:22px;color:rgba(255,255,255,0.24);">salbum.com.br</span>
        </div>
      </div>
    </div>

  </div>
</template>
