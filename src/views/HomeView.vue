<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Activity, Loader2, Users } from "lucide-vue-next";
import RecentlyPlayedSection from "../components/spotify/RecentlyPlayedSection.vue";
import FeedItemCard from "../components/FeedItem.vue";
import { getActivityFeed } from "../services/activityService";
import { useAuthStore } from "../stores/auth";
import type { ActivityItemDTO } from "../types";

const auth = useAuthStore();

// ─── Feed state ───────────────────────────────────────────────────────────────
const feedItems = ref<ActivityItemDTO[]>([]);
const nextCursor = ref<string | null>(null);
const hasMore = ref(false);
const loading = ref(true);
const loadingMore = ref(false);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    const res = await getActivityFeed({ limit: 20 });
    feedItems.value = res.data;
    nextCursor.value = res.nextCursor;
    hasMore.value = res.hasMore;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Erro ao carregar feed";
  } finally {
    loading.value = false;
  }
});

async function loadMore() {
  if (!hasMore.value || loadingMore.value) return;
  loadingMore.value = true;
  try {
    const res = await getActivityFeed({
      limit: 20,
      cursor: nextCursor.value ?? undefined,
    });
    feedItems.value.push(...res.data);
    nextCursor.value = res.nextCursor;
    hasMore.value = res.hasMore;
  } catch {
    // silently ignore load-more errors
  } finally {
    loadingMore.value = false;
  }
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-8 lg:space-y-10">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-white">
        Olá, {{ auth.user?.name?.split(" ")[0] ?? "bem-vindo" }}! 👋
      </h1>
      <p class="text-muted text-sm mt-1">
        Descubra e avalie seus álbuns favoritos
      </p>
    </div>

    <!-- Ouvido recentemente (Spotify) -->
    <RecentlyPlayedSection />

    <!-- Feed de atividades -->
    <section>
      <div class="flex items-center gap-2 mb-5">
        <Activity class="w-5 h-5 text-primary" />
        <h2 class="text-lg font-bold text-white">Feed de Atividades</h2>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-16">
        <Loader2 class="w-6 h-6 text-primary animate-spin" />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="card p-6 text-center">
        <p class="text-muted text-sm">{{ error }}</p>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="feedItems.length === 0"
        class="card p-8 flex flex-col items-center text-center gap-3"
      >
        <div
          class="w-14 h-14 bg-[var(--color-surface-2)] rounded-3xl flex items-center justify-center"
        >
          <Users class="w-7 h-7 text-muted" />
        </div>
        <p class="text-white font-semibold">Nada por aqui ainda</p>
        <p class="text-muted text-sm">
          Siga outros usuários para ver as atividades deles aqui.
        </p>
      </div>

      <!-- Feed list -->
      <div v-else class="space-y-4">
        <FeedItemCard
          v-for="(item, i) in feedItems"
          :key="
            item.type === 'REVIEW' || item.type === 'RATING'
              ? (item.review?.review.id ?? i)
              : (item.musicShare?.id ?? i)
          "
          :item="item"
          @deleted="
            (id) => {
              feedItems = feedItems.filter(
                (f) => f.review?.review.id !== id && f.musicShare?.id !== id,
              );
            }
          "
        />

        <!-- Load more -->
        <div v-if="hasMore" class="flex justify-center pt-2">
          <button
            @click="loadMore"
            class="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-medium bg-[var(--color-surface-2)] text-muted hover:text-white border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-all"
            :disabled="loadingMore"
          >
            <Loader2 v-if="loadingMore" class="w-4 h-4 animate-spin" />
            {{ loadingMore ? "Carregando..." : "Ver mais" }}
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
