<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { BarChart2, BookOpen, Share2, Loader2, Pencil } from "lucide-vue-next";
import { useAuthStore } from "../stores/auth";
import { getUserActivityFeed } from "../services/activityService";
import type { ActivityItemDTO } from "../types";
import FeedItemCard from "../components/FeedItem.vue";
import AppImage from "../components/AppImage.vue";
import { useRouter } from "vue-router";

const auth = useAuthStore();
const router = useRouter();

// ─── Feed state ───────────────────────────────────────────────────────────────
const feedItems = ref<ActivityItemDTO[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

type FilterTab = "all" | "reviews" | "shares";
const activeTab = ref<FilterTab>("all");

const filtered = computed(() => {
  if (activeTab.value === "reviews")
    return feedItems.value.filter(
      (a) => a.type === "REVIEW" || a.type === "RATING",
    );
  if (activeTab.value === "shares")
    return feedItems.value.filter((a) => a.type === "MUSIC_SHARE");
  return feedItems.value;
});

const reviewCount = computed(
  () =>
    feedItems.value.filter((a) => a.type === "REVIEW" || a.type === "RATING")
      .length,
);
const shareCount = computed(
  () => feedItems.value.filter((a) => a.type === "MUSIC_SHARE").length,
);

onMounted(async () => {
  if (!auth.user?.id) {
    loading.value = false;
    return;
  }
  try {
    feedItems.value = await getUserActivityFeed(auth.user.id);
  } catch (e) {
    error.value =
      e instanceof Error ? e.message : "Erro ao carregar atividades";
  } finally {
    loading.value = false;
  }
});

const tabs: { key: FilterTab; label: string; icon: typeof BarChart2 }[] = [
  { key: "all", label: "Tudo", icon: BarChart2 },
  { key: "reviews", label: "Reviews", icon: BookOpen },
  { key: "shares", label: "Shares", icon: Share2 },
];
</script>

<template>
  <div class="min-h-full pb-12">
    <!-- ── Hero ──────────────────────────────────────────────────────────── -->
    <div class="relative overflow-hidden">
      <div
        v-if="auth.user?.image_url"
        class="absolute inset-0 bg-cover bg-center blur-3xl opacity-20 scale-110"
        :style="{ backgroundImage: `url(${auth.user.image_url})` }"
      />
      <div
        class="absolute inset-0 bg-gradient-to-b from-dark/20 via-dark/70 to-dark"
      />

      <div class="relative px-4 sm:px-8 pt-8 pb-10">
        <div class="flex flex-col sm:flex-row gap-5 sm:gap-8 sm:items-end">
          <!-- Avatar -->
          <div class="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32">
            <AppImage
              :src="auth.user?.image_url ?? null"
              :alt="auth.user?.username ?? ''"
              :initial="(auth.user?.username?.[0] ?? '?').toUpperCase()"
              type="artist"
              rounded="3xl"
              class="w-full h-full shadow-2xl ring-2 ring-white/10"
            />
          </div>

          <!-- Details -->
          <div class="space-y-3 pb-1 flex-1 min-w-0">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p
                  class="text-xs font-semibold text-muted uppercase tracking-widest mb-1"
                >
                  Perfil
                </p>
                <h1
                  class="text-3xl sm:text-4xl font-black text-white leading-tight truncate"
                >
                  {{ auth.user?.name }}
                </h1>
                <p class="text-sm text-muted mt-1">
                  @{{ auth.user?.username }}
                </p>
                <p
                  v-if="auth.user?.bio"
                  class="text-sm text-[var(--color-text)] mt-2 line-clamp-2"
                >
                  {{ auth.user.bio }}
                </p>
              </div>
              <button
                @click="router.push({ name: 'edit-profile' })"
                class="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--color-border)] text-xs font-medium text-muted hover:border-primary hover:text-primary transition-colors mt-1"
              >
                <Pencil class="w-3.5 h-3.5" />
                Editar
              </button>
            </div>

            <!-- Stats -->
            <div class="flex flex-wrap gap-4 pt-1">
              <div class="text-center">
                <p class="text-lg font-black text-white">
                  {{ auth.user?.followers_count ?? 0 }}
                </p>
                <p class="text-[10px] text-muted uppercase tracking-wider">
                  Seguidores
                </p>
              </div>
              <div class="text-center">
                <p class="text-lg font-black text-white">
                  {{ auth.user?.following_count ?? 0 }}
                </p>
                <p class="text-[10px] text-muted uppercase tracking-wider">
                  Seguindo
                </p>
              </div>
              <div class="text-center">
                <p class="text-lg font-black text-white">{{ reviewCount }}</p>
                <p class="text-[10px] text-muted uppercase tracking-wider">
                  Reviews
                </p>
              </div>
              <div class="text-center">
                <p class="text-lg font-black text-white">{{ shareCount }}</p>
                <p class="text-[10px] text-muted uppercase tracking-wider">
                  Shares
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Content ────────────────────────────────────────────────────────── -->
    <div class="px-4 sm:px-8 pt-6 space-y-6">
      <!-- Tab bar -->
      <div class="flex gap-1 bg-[var(--color-surface)] rounded-2xl p-1 w-fit">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          class="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
          :class="
            activeTab === tab.key
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted hover:text-white'
          "
        >
          <component :is="tab.icon" class="w-4 h-4" />
          <span class="hidden sm:inline">{{ tab.label }}</span>
          <span
            class="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            :class="
              activeTab === tab.key
                ? 'bg-white/20'
                : 'bg-[var(--color-surface-2)]'
            "
          >
            {{
              tab.key === "all"
                ? feedItems.length
                : tab.key === "reviews"
                  ? reviewCount
                  : shareCount
            }}
          </span>
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-16">
        <Loader2 class="w-6 h-6 text-primary animate-spin" />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="card p-6 text-center">
        <p class="text-muted text-sm">{{ error }}</p>
      </div>

      <!-- Feed -->
      <div v-else-if="filtered.length > 0" class="space-y-3">
        <FeedItemCard
          v-for="(item, i) in filtered"
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
      </div>

      <!-- Empty state -->
      <div v-else class="flex flex-col items-center py-16 text-center">
        <div
          class="w-16 h-16 bg-[var(--color-surface)] rounded-3xl flex items-center justify-center mb-4"
        >
          <BarChart2 class="w-8 h-8 text-muted" />
        </div>
        <p class="text-white font-semibold mb-1">Nenhuma atividade</p>
        <p class="text-muted text-sm">
          Escreva reviews e compartilhe músicas para aparecer aqui.
        </p>
      </div>
    </div>
  </div>
</template>
