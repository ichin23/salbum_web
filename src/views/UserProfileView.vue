<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  ArrowLeft,
  Loader2,
  UserCheck,
  UserPlus,
  BarChart2,
  BookOpen,
  Share2,
} from "lucide-vue-next";
import { getUserById, followUser, unfollowUser } from "../services/userService";
import { getUserActivityFeed } from "../services/activityService";
import { useAuthStore } from "../stores/auth";
import type { UserDTO } from "../services/userService";
import type { ActivityItemDTO } from "../types";
import AppImage from "../components/AppImage.vue";
import FeedItemCard from "../components/FeedItem.vue";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const userId = route.params.id as string;

const user = ref<UserDTO | null>(null);
const loadingUser = ref(true);
const loadError = ref<string | null>(null);

const feedItems = ref<ActivityItemDTO[]>([]);
const loadingFeed = ref(false);
const feedError = ref<string | null>(null);

const followLoading = ref(false);

type FilterTab = "all" | "reviews" | "shares";
const activeTab = ref<FilterTab>("all");

function filtered() {
  if (activeTab.value === "reviews")
    return feedItems.value.filter(
      (a) => a.type === "REVIEW" || a.type === "RATING",
    );
  if (activeTab.value === "shares")
    return feedItems.value.filter((a) => a.type === "MUSIC_SHARE");
  return feedItems.value;
}

const reviewCount = () =>
  feedItems.value.filter((a) => a.type === "REVIEW" || a.type === "RATING")
    .length;
const shareCount = () =>
  feedItems.value.filter((a) => a.type === "MUSIC_SHARE").length;

const tabs: { key: FilterTab; label: string; icon: typeof BarChart2 }[] = [
  { key: "all", label: "Tudo", icon: BarChart2 },
  { key: "reviews", label: "Reviews", icon: BookOpen },
  { key: "shares", label: "Shares", icon: Share2 },
];

onMounted(async () => {
  // Se for o próprio usuário, redireciona para o perfil deles
  if (auth.user?.id === userId) {
    router.replace({ name: "profile" });
    return;
  }

  try {
    user.value = await getUserById(userId);
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : "Usuário não encontrado";
  } finally {
    loadingUser.value = false;
  }

  // Buscar feed
  loadingFeed.value = true;
  try {
    feedItems.value = await getUserActivityFeed(userId);
  } catch {
    feedError.value = "Erro ao carregar atividades";
  } finally {
    loadingFeed.value = false;
  }
});

async function toggleFollow() {
  if (!user.value || followLoading.value) return;
  followLoading.value = true;
  try {
    if (user.value.is_following) {
      await unfollowUser(userId);
      user.value.is_following = false;
      user.value.followers_count = Math.max(0, user.value.followers_count - 1);
    } else {
      await followUser(userId);
      user.value.is_following = true;
      user.value.followers_count += 1;
    }
  } finally {
    followLoading.value = false;
  }
}
</script>

<template>
  <div class="min-h-full pb-12">
    <!-- Loading inicial -->
    <div v-if="loadingUser" class="flex justify-center py-24">
      <Loader2 class="w-8 h-8 text-muted animate-spin" />
    </div>

    <!-- Erro -->
    <div v-else-if="loadError" class="flex flex-col items-center py-24 gap-3">
      <p class="text-red-400 text-sm">{{ loadError }}</p>
      <button
        @click="router.back()"
        class="text-sm text-muted hover:text-white transition-colors"
      >
        Voltar
      </button>
    </div>

    <template v-else-if="user">
      <!-- ── Hero ──────────────────────────────────────────────────────────── -->
      <div class="relative overflow-hidden">
        <div
          v-if="user.image_url"
          class="absolute inset-0 bg-cover bg-center blur-3xl opacity-20 scale-110"
          :style="{ backgroundImage: `url(${user.image_url})` }"
        />
        <div
          class="absolute inset-0 bg-gradient-to-b from-dark/20 via-dark/70 to-dark"
        />

        <div class="relative px-4 sm:px-8 pt-4 pb-10">
          <!-- Back button -->
          <button
            @click="router.back()"
            class="flex items-center gap-1.5 text-muted hover:text-white transition-colors text-sm mb-6"
          >
            <ArrowLeft class="w-4 h-4" />
            Voltar
          </button>

          <div class="flex flex-col sm:flex-row gap-5 sm:gap-8 sm:items-end">
            <!-- Avatar -->
            <div class="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32">
              <AppImage
                :src="user.image_url"
                :alt="user.name"
                :initial="(user.username?.[0] ?? '?').toUpperCase()"
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
                    {{ user.name }}
                  </h1>
                  <p class="text-sm text-muted mt-1">@{{ user.username }}</p>
                  <p
                    v-if="user.bio"
                    class="text-sm text-[var(--color-text)] mt-2 line-clamp-2"
                  >
                    {{ user.bio }}
                  </p>
                </div>

                <!-- Follow button -->
                <button
                  @click="toggleFollow"
                  :disabled="followLoading"
                  class="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 mt-1 disabled:opacity-60"
                  :class="
                    user.is_following
                      ? 'border-[var(--color-border)] text-muted hover:border-red-500/50 hover:text-red-400'
                      : 'border-primary bg-primary text-white hover:bg-primary/90'
                  "
                >
                  <Loader2
                    v-if="followLoading"
                    class="w-4 h-4 animate-spin"
                  />
                  <UserCheck v-else-if="user.is_following" class="w-4 h-4" />
                  <UserPlus v-else class="w-4 h-4" />
                  {{
                    followLoading
                      ? ""
                      : user.is_following
                        ? "Seguindo"
                        : "Seguir"
                  }}
                </button>
              </div>

              <!-- Stats -->
              <div class="flex flex-wrap gap-4 pt-1">
                <div class="text-center">
                  <p class="text-lg font-black text-white">
                    {{ user.followers_count }}
                  </p>
                  <p class="text-[10px] text-muted uppercase tracking-wider">
                    Seguidores
                  </p>
                </div>
                <div class="text-center">
                  <p class="text-lg font-black text-white">
                    {{ user.following_count }}
                  </p>
                  <p class="text-[10px] text-muted uppercase tracking-wider">
                    Seguindo
                  </p>
                </div>
                <div class="text-center">
                  <p class="text-lg font-black text-white">
                    {{ reviewCount() }}
                  </p>
                  <p class="text-[10px] text-muted uppercase tracking-wider">
                    Reviews
                  </p>
                </div>
                <div class="text-center">
                  <p class="text-lg font-black text-white">
                    {{ shareCount() }}
                  </p>
                  <p class="text-[10px] text-muted uppercase tracking-wider">
                    Shares
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Content ──────────────────────────────────────────────────────── -->
      <div class="px-4 sm:px-8 pt-6 space-y-6">
        <!-- Tab bar -->
        <div
          class="flex gap-1 bg-[var(--color-surface)] rounded-2xl p-1 w-fit"
        >
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
                    ? reviewCount()
                    : shareCount()
              }}
            </span>
          </button>
        </div>

        <!-- Feed loading -->
        <div
          v-if="loadingFeed"
          class="flex items-center justify-center py-16"
        >
          <Loader2 class="w-6 h-6 text-primary animate-spin" />
        </div>

        <!-- Feed error -->
        <div v-else-if="feedError" class="card p-6 text-center">
          <p class="text-muted text-sm">{{ feedError }}</p>
        </div>

        <!-- Feed items -->
        <div v-else-if="filtered().length > 0" class="space-y-3">
          <FeedItemCard
            v-for="(item, i) in filtered()"
            :key="
              item.type === 'REVIEW' || item.type === 'RATING'
                ? (item.review?.review.id ?? i)
                : (item.musicShare?.id ?? i)
            "
            :item="item"
          />
        </div>

        <!-- Empty -->
        <div v-else class="flex flex-col items-center py-16 text-center">
          <div
            class="w-16 h-16 bg-[var(--color-surface)] rounded-3xl flex items-center justify-center mb-4"
          >
            <BarChart2 class="w-8 h-8 text-muted" />
          </div>
          <p class="text-white font-semibold mb-1">Nenhuma atividade</p>
          <p class="text-muted text-sm">
            {{ user.name }} ainda não tem atividade pública.
          </p>
        </div>
      </div>
    </template>
  </div>
</template>
