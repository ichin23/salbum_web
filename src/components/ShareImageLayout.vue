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

</script>

<template>
  <div style="width:1080px; height:1920px; overflow:hidden; position:relative;">

    <!-- CARTAZ: glass-card model based on TestImage.vue (1080×1920 Instagram Story) -->
    <div
      v-if="background === 'cartaz'"
      style="width:1080px; height:1920px; box-sizing:border-box; position:relative; overflow:hidden;
             font-family:'Inter',system-ui,-apple-system,sans-serif;
             background:linear-gradient(174deg, #212121 0%, #17275b 50%, #082b0f 100%);
             display:flex; flex-direction:column; align-items:center;
             padding:160px 161px 80px;"
    >
      <!-- Frame: glass card + quote + user + extras -->
      <div style="display:flex; flex-direction:column; align-items:center; gap:24px; width:757px; flex:1; min-height:0;">

        <!-- Glass card -->
        <div style="flex-shrink:0; width:709px; height:906px; box-sizing:border-box; border-radius:30px;
                    padding:40px 40px 20px; display:flex; flex-direction:column; align-items:center; gap:27px;
                    background-color:rgba(0,0,0,0.004);
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.4), inset 1px 0 0 rgba(255,255,255,0.32), inset 0 -1px 1px rgba(0,0,0,0.2), inset -1px 0 1px rgba(0,0,0,0.16);
                    -webkit-backdrop-filter: brightness(102%) saturate(100%);
                    backdrop-filter: brightness(102%) saturate(100%);">

          <!-- Cover wrapper 546×546 (primary bg + 20px padding, 40px radius) -->
          <div style="flex-shrink:0; width:546px; height:546px; border-radius:40px; overflow:hidden;
                      background:#234ED8; padding:20px; box-sizing:border-box;
                      display:flex; align-items:center; justify-content:center;">
            <img v-if="coverUrl" :src="coverUrl" alt="Cover" style="width:100%;height:100%;object-fit:cover;display:block;" crossorigin="anonymous"/>
            <div v-else style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#1a1030;font-size:160px;font-weight:700;color:#7c3aed;">{{ fallbackInitial }}</div>
          </div>

          <!-- Title -->
          <div style="font-size:48px; font-weight:700; color:#ffffff; line-height:1.2; text-align:center; width:100%; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;">
            {{ titleText }}
          </div>

          <!-- Artist / subtitle -->
          <div v-if="artistNames || subtitleText" style="font-size:40px; font-weight:500; color:#666565; width:100%; text-align:center; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
            {{ artistNames || subtitleText }}
          </div>

          <!-- Score (review) -->
          <template v-if="postType==='review' && score!=null">
            <div style="display:flex; align-items:baseline; gap:8px;">
              <span style="font-size:84px; font-weight:800; line-height:1; color:#ffffff;">{{ score }}</span>
              <span style="font-size:36px; font-weight:300; color:#6b7280;">/100</span>
            </div>
          </template>

          <!-- Stars (quick review) -->
          <template v-else-if="postType==='quick_review'">
            <div style="display:flex; align-items:center; gap:6px;">
              <div v-for="i in 5" :key="i" style="position:relative;width:50px;height:50px;display:inline-block;flex-shrink:0;">
                <svg width="50" height="50" viewBox="0 0 24 24" style="position:absolute;top:0;left:0;display:block;"><polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" fill="rgba(255,255,255,0.12)"/></svg>
                <div :style="{position:'absolute',top:'0',left:'0',width:starFill(i,qrScore),height:'100%',overflow:'hidden'}">
                  <svg width="50" height="50" viewBox="0 0 24 24" style="display:block;"><polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" fill="#fbbf24"/></svg>
                </div>
              </div>
            </div>
          </template>

          <!-- Mini Salbum logo removed (branding stays at bottom) -->
        </div>

        <!-- Quote text -->
        <p v-if="contentText" style="font-size:36px; font-weight:400; color:#ffffff; line-height:1.45; text-align:center; margin:0; width:100%; display:-webkit-box; -webkit-line-clamp:5; -webkit-box-orient:vertical; overflow:hidden;">
          {{ contentText }}
        </p>

        <!-- User row -->
        <div style="display:flex; align-items:center; gap:14px; flex-wrap:nowrap; max-width:100%;">
          <div style="width:84px; height:84px; border-radius:50%; overflow:hidden; flex-shrink:0; background:#2a1555;">
            <img v-if="user?.imageUrl" :src="user.imageUrl" :alt="user?.username" style="width:100%;height:100%;object-fit:cover;" crossorigin="anonymous"/>
            <div v-else style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:700;color:rgba(255,255,255,0.45);">{{ user?.username?.charAt(0)?.toUpperCase() ?? '?' }}</div>
          </div>
          <span style="font-size:36px; font-weight:400; color:#ffffff; white-space:nowrap;">- {{ user?.name ?? user?.username ?? 'Usuário' }}</span>
          <div v-if="quickReviewSentiment" style="padding:6px 20px; border-radius:100px; font-size:18px; font-weight:500; background:rgba(124,58,237,0.12); border:1px solid rgba(124,58,237,0.25); color:#a78bfa;">{{ quickReviewSentiment }}</div>
        </div>

        <!-- Favorite track (quick review) -->
        <template v-if="quickReviewFavoriteTrack">
          <div style="width:100%; box-sizing:border-box; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:18px; padding:22px 28px;">
            <div style="font-size:18px; font-weight:700; color:rgba(255,255,255,0.32); text-transform:uppercase; letter-spacing:3px; margin-bottom:10px;">Música Favorita</div>
            <div style="display:flex; align-items:center; justify-content:space-between; gap:16px;">
              <div style="flex:1; min-width:0;">
                <div style="font-size:34px; font-weight:600; color:#ffffff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{{ quickReviewFavoriteTrack.name }}</div>
                <div v-if="quickReviewFavoriteTrackComment" style="font-size:22px; color:rgba(255,255,255,0.38); margin-top:4px;">{{ quickReviewFavoriteTrackComment }}</div>
              </div>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="#ef4444" style="flex-shrink:0;"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </div>
          </div>
        </template>

        <!-- Track scores (review) -->
        <template v-if="trackScores && trackScores.length>0">
          <div style="width:100%; box-sizing:border-box; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:18px; padding:20px 24px; max-height:380px; overflow:hidden;">
            <div style="font-size:18px; font-weight:700; color:rgba(255,255,255,0.28); text-transform:uppercase; letter-spacing:2px; margin-bottom:8px;">Faixas</div>
            <div v-for="ts in trackScores.slice(0,8)" :key="ts.trackId" style="display:flex; align-items:center; gap:12px; padding:7px 0; border-bottom:1px solid rgba(255,255,255,0.04);">
              <span style="font-size:20px; color:rgba(255,255,255,0.26); width:28px; text-align:right; flex-shrink:0;">{{ ts.trackNumber }}.</span>
              <span style="font-size:24px; color:rgba(255,255,255,0.75); flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{{ ts.trackName }}</span>
              <span v-if="ts.score!=null" style="font-size:24px; font-weight:700; color:#7c3aed; width:36px; text-align:right; flex-shrink:0;">{{ ts.score }}</span>
            </div>
          </div>
        </template>

        <!-- Branding -->
        <div style="margin-top:auto; flex-shrink:0; display:flex; align-items:center; gap:15px; white-space:nowrap;">
          <img src="/salbum_logo.svg" alt="Salbum" style="width:52px; height:86px;"/>
          <span style="font-size:48px; font-family:'Jersey 25',cursive,system-ui; color:#ffffff; line-height:1;">Salbum</span>
          <span style="font-size:24px; font-family:'Inter',sans-serif; color:#ffffff;">salbum.com.br</span>
        </div>
      </div>

      <!-- Floating quote mark (decorative, TestImage position) -->
      <div v-if="contentText" style="position:absolute; left:133px; top:1130px; font-size:96px; font-family:'Jersey 25',cursive,system-ui; color:#ffffff; line-height:1; pointer-events:none;">"</div>

    </div>


    <!-- FITA: mesma estrutura glass-card, paleta monocromática escura -->
    <div
      v-else-if="background === 'fita'"
      style="width:1080px; height:1920px; box-sizing:border-box; position:relative; overflow:hidden;
             font-family:'Inter',system-ui,-apple-system,sans-serif;
             background:linear-gradient(174deg, #06070b 0%, #0b0c12 50%, #06070b 100%);
             display:flex; flex-direction:column; align-items:center;
             padding:160px 161px 80px;"
    >
      <!-- Frame: glass card + quote + user + extras -->
      <div style="display:flex; flex-direction:column; align-items:center; gap:24px; width:757px; flex:1; min-height:0;">

        <!-- Glass card -->
        <div style="flex-shrink:0; width:709px; height:906px; box-sizing:border-box; border-radius:30px;
                    padding:40px 40px 20px; display:flex; flex-direction:column; align-items:center; gap:27px;
                    background-color:rgba(255,255,255,0.012);
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), inset 1px 0 0 rgba(255,255,255,0.06), inset 0 -1px 1px rgba(0,0,0,0.4), inset -1px 0 1px rgba(0,0,0,0.3);
                    -webkit-backdrop-filter: brightness(102%) saturate(100%);
                    backdrop-filter: brightness(102%) saturate(100%);">

          <!-- Cover wrapper 546×546 -->
          <div style="flex-shrink:0; width:546px; height:546px; border-radius:40px; overflow:hidden;
                      background:#1f1f1f; padding:20px; box-sizing:border-box;
                      display:flex; align-items:center; justify-content:center;">
            <img v-if="coverUrl" :src="coverUrl" alt="Cover" style="width:100%;height:100%;object-fit:cover;display:block;" crossorigin="anonymous"/>
            <div v-else style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#0f1016;font-size:160px;font-weight:200;color:rgba(255,255,255,0.18);">{{ fallbackInitial }}</div>
          </div>

          <!-- Title -->
          <div style="font-size:48px; font-weight:300; color:#ffffff; line-height:1.2; letter-spacing:-1.5px; text-align:center; width:100%; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;">
            {{ titleText }}
          </div>

          <!-- Artist / subtitle -->
          <div v-if="artistNames || subtitleText" style="font-size:40px; font-weight:400; color:#555555; width:100%; text-align:center; letter-spacing:0.5px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
            {{ artistNames || subtitleText }}
          </div>

          <!-- Score (review) -->
          <template v-if="postType==='review' && score!=null">
            <div style="display:flex; align-items:baseline; gap:8px;">
              <span style="font-size:84px; font-weight:200; line-height:1; color:#ffffff; letter-spacing:-3px;">{{ score }}</span>
              <span style="font-size:36px; font-weight:300; color:#2a2a2a;">/100</span>
            </div>
          </template>

          <!-- Stars (quick review) -->
          <template v-else-if="postType==='quick_review'">
            <div style="display:flex; align-items:center; gap:6px;">
              <div v-for="i in 5" :key="i" style="position:relative;width:50px;height:50px;display:inline-block;flex-shrink:0;">
                <svg width="50" height="50" viewBox="0 0 24 24" style="position:absolute;top:0;left:0;display:block;"><polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" fill="rgba(255,255,255,0.07)"/></svg>
                <div :style="{position:'absolute',top:'0',left:'0',width:starFill(i,qrScore),height:'100%',overflow:'hidden'}">
                  <svg width="50" height="50" viewBox="0 0 24 24" style="display:block;"><polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" fill="#ffffff"/></svg>
                </div>
              </div>
            </div>
          </template>

          <!-- Mini Salbum logo removed (branding stays at bottom) -->
        </div>

        <!-- Quote text -->
        <p v-if="contentText" style="font-size:36px; font-weight:300; color:rgba(255,255,255,0.6); line-height:1.55; font-style:italic; text-align:center; margin:0; width:100%; display:-webkit-box; -webkit-line-clamp:5; -webkit-box-orient:vertical; overflow:hidden;">
          {{ contentText }}
        </p>

        <!-- User row -->
        <div style="display:flex; align-items:center; gap:14px; flex-wrap:nowrap; max-width:100%;">
          <div style="width:84px; height:84px; border-radius:50%; overflow:hidden; flex-shrink:0; background:#0f1016;">
            <img v-if="user?.imageUrl" :src="user.imageUrl" :alt="user?.username" style="width:100%;height:100%;object-fit:cover;" crossorigin="anonymous"/>
            <div v-else style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:300;color:rgba(255,255,255,0.18);">{{ user?.username?.charAt(0)?.toUpperCase() ?? '?' }}</div>
          </div>
          <span style="font-size:36px; font-weight:300; color:rgba(255,255,255,0.4); white-space:nowrap;">{{ user?.name ?? user?.username ?? 'Usuário' }}</span>
          <div v-if="quickReviewSentiment" style="padding:6px 20px; border-radius:100px; font-size:18px; font-weight:400; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); color:rgba(255,255,255,0.35); letter-spacing:0.5px;">{{ quickReviewSentiment }}</div>
        </div>

        <!-- Favorite track -->
        <template v-if="quickReviewFavoriteTrack">
          <div style="width:100%; box-sizing:border-box; border-top:1px solid rgba(255,255,255,0.06); padding:22px 0 0;">
            <div style="font-size:18px; font-weight:500; color:rgba(255,255,255,0.18); text-transform:uppercase; letter-spacing:5px; margin-bottom:14px;">Música Favorita</div>
            <div style="display:flex; align-items:center; justify-content:space-between; gap:16px;">
              <div style="flex:1; min-width:0;">
                <div style="font-size:34px; font-weight:300; color:rgba(255,255,255,0.72); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{{ quickReviewFavoriteTrack.name }}</div>
                <div v-if="quickReviewFavoriteTrackComment" style="font-size:22px; color:rgba(255,255,255,0.22); margin-top:6px;">{{ quickReviewFavoriteTrackComment }}</div>
              </div>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="rgba(255,255,255,0.2)" style="flex-shrink:0;"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </div>
          </div>
        </template>

        <!-- Track scores -->
        <template v-if="trackScores && trackScores.length>0">
          <div style="width:100%; box-sizing:border-box; border-top:1px solid rgba(255,255,255,0.04); padding:20px 0 0; max-height:380px; overflow:hidden;">
            <div v-for="ts in trackScores.slice(0,8)" :key="ts.trackId" style="display:flex; align-items:center; gap:12px; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.03);">
              <span style="font-size:20px; color:rgba(255,255,255,0.18); width:28px; text-align:right; flex-shrink:0;">{{ ts.trackNumber }}.</span>
              <span style="font-size:24px; font-weight:300; color:rgba(255,255,255,0.5); flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{{ ts.trackName }}</span>
              <span v-if="ts.score!=null" style="font-size:24px; font-weight:300; color:rgba(255,255,255,0.36); width:36px; text-align:right; flex-shrink:0;">{{ ts.score }}</span>
            </div>
          </div>
        </template>

        <!-- Branding -->
        <div style="margin-top:auto; flex-shrink:0; display:flex; align-items:center; gap:15px; white-space:nowrap;">
          <img src="/salbum_logo.svg" alt="Salbum" style="width:52px; height:86px; opacity:0.18;"/>
          <span style="font-size:48px; font-family:'Jersey 25',cursive,system-ui; color:rgba(255,255,255,0.18); line-height:1; letter-spacing:5px;">SALBUM</span>
          <span style="font-size:24px; font-family:'Inter',sans-serif; color:rgba(255,255,255,0.18);">salbum.com.br</span>
        </div>
      </div>

      <!-- Floating quote mark -->
      <div v-if="contentText" style="position:absolute; left:133px; top:1130px; font-size:96px; font-family:'Jersey 25',cursive,system-ui; color:rgba(255,255,255,0.12); line-height:1; pointer-events:none;">"</div>

    </div>


    <!-- ESTÚDIO: mesma estrutura glass-card, paleta vibrante roxa/azul -->
    <div
      v-else
      style="width:1080px; height:1920px; box-sizing:border-box; position:relative; overflow:hidden;
             font-family:'Inter',system-ui,-apple-system,sans-serif;
             background:linear-gradient(148deg, #100224 0%, #220950 20%, #0e1e56 46%, #0a1e3a 68%, #04100e 100%);
             display:flex; flex-direction:column; align-items:center;
             padding:160px 161px 80px;"
    >
      <!-- Decorative blobs -->
      <div style="position:absolute;top:-280px;left:-220px;width:900px;height:900px;border-radius:50%;background:radial-gradient(circle,rgba(139,92,246,0.18) 0%,transparent 65%);pointer-events:none;z-index:0;"/>
      <div style="position:absolute;bottom:60px;right:-180px;width:760px;height:760px;border-radius:50%;background:radial-gradient(circle,rgba(56,130,246,0.14) 0%,transparent 65%);pointer-events:none;z-index:0;"/>
      <div style="position:absolute;top:46%;left:-100px;width:560px;height:560px;border-radius:50%;background:radial-gradient(circle,rgba(236,72,153,0.08) 0%,transparent 65%);pointer-events:none;z-index:0;"/>
      <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(139,92,246,0.5),rgba(56,130,246,0.4),transparent);pointer-events:none;z-index:0;"/>

      <!-- Frame -->
      <div style="position:relative; z-index:1; display:flex; flex-direction:column; align-items:center; gap:24px; width:757px; flex:1; min-height:0;">

        <!-- Glass card -->
        <div style="flex-shrink:0; width:709px; height:906px; box-sizing:border-box; border-radius:30px;
                    padding:40px 40px 20px; display:flex; flex-direction:column; align-items:center; gap:27px;
                    background-color:rgba(139,92,246,0.025);
                    box-shadow: inset 0 1px 0 rgba(167,139,250,0.25), inset 1px 0 0 rgba(167,139,250,0.18), inset 0 -1px 1px rgba(0,0,0,0.3), inset -1px 0 1px rgba(0,0,0,0.24), 0 0 40px rgba(139,92,246,0.12);
                    -webkit-backdrop-filter: brightness(102%) saturate(100%);
                    backdrop-filter: brightness(102%) saturate(100%);">

          <!-- Cover wrapper 546×546 -->
          <div style="flex-shrink:0; width:546px; height:546px; border-radius:40px; overflow:hidden;
                      background:linear-gradient(135deg,#2d1060,#0f2060); padding:20px; box-sizing:border-box;
                      display:flex; align-items:center; justify-content:center;
                      box-shadow:0 0 0 4px rgba(139,92,246,0.45),0 0 60px rgba(139,92,246,0.35);">
            <img v-if="coverUrl" :src="coverUrl" alt="Cover" style="width:100%;height:100%;object-fit:cover;display:block;" crossorigin="anonymous"/>
            <div v-else style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#2d1060,#0f2060);font-size:160px;font-weight:800;color:rgba(255,255,255,0.35);">{{ fallbackInitial }}</div>
          </div>

          <!-- Title -->
          <div style="font-size:48px; font-weight:800; color:#ffffff; line-height:1.15; letter-spacing:-0.5px; text-align:center; width:100%; text-shadow:0 2px 24px rgba(139,92,246,0.28); display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;">
            {{ titleText }}
          </div>

          <!-- Artist / subtitle -->
          <div v-if="artistNames || subtitleText" style="font-size:40px; font-weight:500; color:rgba(167,139,250,0.68); width:100%; text-align:center; letter-spacing:0.5px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
            {{ artistNames || subtitleText }}
          </div>

          <!-- Score (review) -->
          <template v-if="postType==='review' && score!=null">
            <div style="display:flex; align-items:baseline; gap:8px; background:rgba(139,92,246,0.1); border:1px solid rgba(139,92,246,0.22); padding:8px 32px; border-radius:100px;">
              <span style="font-size:84px; font-weight:800; line-height:1; color:#a78bfa;">{{ score }}</span>
              <span style="font-size:36px; font-weight:400; color:rgba(167,139,250,0.38);">/100</span>
            </div>
          </template>

          <!-- Stars (quick review) -->
          <template v-else-if="postType==='quick_review'">
            <div style="display:flex; align-items:center; gap:6px; background:rgba(250,204,21,0.06); border:1px solid rgba(250,204,21,0.12); padding:8px 20px; border-radius:100px;">
              <div v-for="i in 5" :key="i" style="position:relative;width:50px;height:50px;display:inline-block;flex-shrink:0;">
                <svg width="50" height="50" viewBox="0 0 24 24" style="position:absolute;top:0;left:0;display:block;"><polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" fill="rgba(255,255,255,0.09)"/></svg>
                <div :style="{position:'absolute',top:'0',left:'0',width:starFill(i,qrScore),height:'100%',overflow:'hidden'}">
                  <svg width="50" height="50" viewBox="0 0 24 24" style="display:block;"><polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" fill="#fbbf24"/></svg>
                </div>
              </div>
            </div>
          </template>

          <!-- Mini Salbum logo removed (branding stays at bottom) -->
        </div>

        <!-- Quote text -->
        <p v-if="contentText" style="font-size:36px; font-weight:400; color:rgba(255,255,255,0.8); line-height:1.55; text-align:center; margin:0; width:100%; display:-webkit-box; -webkit-line-clamp:5; -webkit-box-orient:vertical; overflow:hidden;">
          {{ contentText }}
        </p>

        <!-- User row -->
        <div style="display:flex; align-items:center; gap:14px; flex-wrap:nowrap; max-width:100%;">
          <div style="width:84px; height:84px; border-radius:50%; overflow:hidden; flex-shrink:0; background:linear-gradient(135deg,#2d1060,#0f2060); box-shadow:0 0 0 2px rgba(139,92,246,0.5),0 0 20px rgba(139,92,246,0.2);">
            <img v-if="user?.imageUrl" :src="user.imageUrl" :alt="user?.username" style="width:100%;height:100%;object-fit:cover;" crossorigin="anonymous"/>
            <div v-else style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:700;color:rgba(255,255,255,0.45);">{{ user?.username?.charAt(0)?.toUpperCase() ?? '?' }}</div>
          </div>
          <span style="font-size:36px; font-weight:400; color:rgba(255,255,255,0.55); white-space:nowrap;">- {{ user?.name ?? user?.username ?? 'Usuário' }}</span>
          <div v-if="quickReviewSentiment" style="padding:6px 20px; border-radius:100px; font-size:18px; font-weight:500; background:rgba(139,92,246,0.12); border:1px solid rgba(139,92,246,0.25); color:#a78bfa;">{{ quickReviewSentiment }}</div>
        </div>

        <!-- Favorite track -->
        <template v-if="quickReviewFavoriteTrack">
          <div style="width:100%; box-sizing:border-box; background:linear-gradient(135deg,rgba(139,92,246,0.1),rgba(59,130,246,0.07)); border:1px solid rgba(139,92,246,0.22); border-radius:18px; padding:22px 28px;">
            <div style="font-size:18px; font-weight:700; color:rgba(167,139,250,0.45); text-transform:uppercase; letter-spacing:3px; margin-bottom:10px;">Música Favorita</div>
            <div style="display:flex; align-items:center; justify-content:space-between; gap:16px;">
              <div style="flex:1; min-width:0;">
                <div style="font-size:34px; font-weight:700; color:#ffffff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{{ quickReviewFavoriteTrack.name }}</div>
                <div v-if="quickReviewFavoriteTrackComment" style="font-size:22px; color:rgba(167,139,250,0.42); margin-top:4px;">{{ quickReviewFavoriteTrackComment }}</div>
              </div>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="#f43f5e" style="flex-shrink:0; filter:drop-shadow(0 0 10px rgba(244,63,94,0.5));"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </div>
          </div>
        </template>

        <!-- Track scores -->
        <template v-if="trackScores && trackScores.length>0">
          <div style="width:100%; box-sizing:border-box; background:rgba(255,255,255,0.03); border:1px solid rgba(139,92,246,0.1); border-radius:18px; padding:20px 24px; max-height:380px; overflow:hidden;">
            <div style="font-size:18px; font-weight:700; color:rgba(167,139,250,0.38); text-transform:uppercase; letter-spacing:2px; margin-bottom:8px;">Faixas</div>
            <div v-for="ts in trackScores.slice(0,8)" :key="ts.trackId" style="display:flex; align-items:center; gap:12px; padding:7px 0; border-bottom:1px solid rgba(139,92,246,0.06);">
              <span style="font-size:20px; color:rgba(167,139,250,0.28); width:28px; text-align:right; flex-shrink:0;">{{ ts.trackNumber }}.</span>
              <span style="font-size:24px; color:rgba(255,255,255,0.72); flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{{ ts.trackName }}</span>
              <span v-if="ts.score!=null" style="font-size:24px; font-weight:700; color:#a78bfa; width:36px; text-align:right; flex-shrink:0;">{{ ts.score }}</span>
            </div>
          </div>
        </template>

        <!-- Branding -->
        <div style="margin-top:auto; flex-shrink:0; display:flex; align-items:center; gap:15px; white-space:nowrap;">
          <img src="/salbum_logo.svg" alt="Salbum" style="width:52px; height:86px; filter:drop-shadow(0 0 8px rgba(139,92,246,0.5));"/>
          <span style="font-size:48px; font-family:'Jersey 25',cursive,system-ui; color:rgba(255,255,255,0.62); line-height:1; text-shadow:0 0 20px rgba(139,92,246,0.3);">Salbum</span>
          <span style="font-size:24px; font-family:'Inter',sans-serif; color:rgba(255,255,255,0.24);">salbum.com.br</span>
        </div>
      </div>

      <!-- Floating quote mark -->
      <div v-if="contentText" style="position:absolute; left:133px; top:1130px; font-size:96px; font-family:'Jersey 25',cursive,system-ui; color:rgba(139,92,246,0.55); line-height:1; pointer-events:none;">"</div>

    </div>

  </div>
</template>
