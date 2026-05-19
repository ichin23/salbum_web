<script setup lang="ts">
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import { X, Loader2, Users, UserCheck, UserPlus } from "lucide-vue-next";
import { getFollowers, getFollowing, followUser, unfollowUser } from "../../services/userService";
import type { UserDTO } from "../../services/userService";
import { useAuthStore } from "../../stores/auth";
import AppImage from "../AppImage.vue";

const props = defineProps<{
  isOpen: boolean;
  userId: string;
  type: "followers" | "following";
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const router = useRouter();
const auth = useAuthStore();

const users = ref<UserDTO[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const followLoading = ref<Record<string, boolean>>({});

watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    loading.value = true;
    error.value = null;
    try {
      if (props.type === "followers") {
        users.value = await getFollowers(props.userId);
      } else {
        users.value = await getFollowing(props.userId);
      }
    } catch (e) {
      error.value = "Erro ao carregar lista de usuários.";
    } finally {
      loading.value = false;
    }
  } else {
    users.value = [];
  }
});

function goToUser(id: string) {
  emit("close");
  router.push({ name: "user-profile", params: { id } });
}

async function toggleFollow(user: UserDTO, event: Event) {
  event.stopPropagation();
  if (followLoading.value[user.id]) return;
  
  followLoading.value[user.id] = true;
  try {
    if (user.is_following) {
      await unfollowUser(user.id);
      user.is_following = false;
      user.followers_count = Math.max(0, user.followers_count - 1);
    } else {
      await followUser(user.id);
      user.is_following = true;
      user.followers_count += 1;
    }
  } catch (e) {
    console.error("Erro ao alterar status de seguir", e);
  } finally {
    followLoading.value[user.id] = false;
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="$emit('close')" />

    <!-- Modal -->
    <div class="relative w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] flex-shrink-0">
        <h2 class="text-lg font-bold text-white flex items-center gap-2">
          <Users class="w-5 h-5 text-primary" />
          {{ type === 'followers' ? 'Seguidores' : 'Seguindo' }}
        </h2>
        <button
          @click="$emit('close')"
          class="p-2 -mr-2 rounded-xl text-muted hover:text-white hover:bg-[var(--color-surface-2)] transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        <div v-if="loading" class="flex justify-center py-8">
          <Loader2 class="w-6 h-6 text-primary animate-spin" />
        </div>

        <div v-else-if="error" class="text-center text-red-400 text-sm py-4">
          {{ error }}
        </div>

        <div v-else-if="users.length === 0" class="text-center text-muted text-sm py-8">
          Nenhum usuário encontrado.
        </div>

        <div v-else class="space-y-2">
          <button
            v-for="user in users"
            :key="user.id"
            @click="goToUser(user.id)"
            class="w-full flex items-center gap-3 p-3 rounded-2xl bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-2)]/80 transition-colors group cursor-pointer border border-transparent hover:border-[var(--color-border)] text-left"
          >
            <!-- Avatar -->
            <div class="w-11 h-11 shrink-0">
              <AppImage
                :src="user.image_url"
                :alt="user.name"
                :initial="(user.username?.[0] ?? '?').toUpperCase()"
                type="artist"
                rounded="full"
                class="w-full h-full shadow-md"
              />
            </div>
            <!-- Info -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-white truncate group-hover:text-primary transition-colors">
                {{ user.name }}
              </p>
              <p class="text-xs text-muted truncate">@{{ user.username }}</p>
            </div>
            
            <!-- Follow Button -->
            <button
              v-if="user.id !== auth.user?.id"
              @click="toggleFollow(user, $event)"
              :disabled="followLoading[user.id]"
              class="flex-shrink-0 flex items-center justify-center p-2 rounded-xl transition-all duration-200 disabled:opacity-50 border border-transparent"
              :class="
                user.is_following
                  ? 'text-muted border-[var(--color-border)] hover:border-red-500/50 hover:text-red-400'
                  : 'bg-primary text-white border-primary hover:bg-primary/90'
              "
              :title="user.is_following ? 'Deixar de seguir' : 'Seguir'"
            >
              <Loader2 v-if="followLoading[user.id]" class="w-4 h-4 animate-spin" />
              <UserCheck v-else-if="user.is_following" class="w-4 h-4" />
              <UserPlus v-else class="w-4 h-4" />
            </button>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--color-muted);
}
</style>
