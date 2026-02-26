<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import {
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Camera,
} from "lucide-vue-next";
import { useAuthStore } from "../stores/auth";
import AppImage from "../components/AppImage.vue";

const router = useRouter();
const auth = useAuthStore();

const name = ref(auth.user?.name ?? "");
const username = ref(auth.user?.username ?? "");
const bio = ref(auth.user?.bio ?? "");
const image_url = ref(auth.user?.image_url ?? "");

const saving = ref(false);
const success = ref(false);
const error = ref<string | null>(null);

async function save() {
  if (!name.value.trim()) {
    error.value = "Nome não pode ser vazio.";
    return;
  }
  if (!username.value.trim()) {
    error.value = "Username não pode ser vazio.";
    return;
  }

  saving.value = true;
  error.value = null;
  success.value = false;

  try {
    await auth.updateProfile({
      name: name.value.trim(),
      username: username.value.trim(),
      bio: bio.value.trim() || undefined,
      image_url: image_url.value.trim() || null,
    });
    success.value = true;
    setTimeout(() => router.push({ name: "profile" }), 800);
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Erro ao salvar perfil.";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="min-h-full pb-12">
    <!-- Header -->
    <div
      class="flex items-center gap-3 px-4 sm:px-8 pt-6 pb-6 border-b border-[var(--color-border)]"
    >
      <button
        @click="router.back()"
        class="w-9 h-9 flex items-center justify-center rounded-xl text-muted hover:text-white hover:bg-[var(--color-surface)] transition-all"
      >
        <ArrowLeft class="w-5 h-5" />
      </button>
      <h1 class="text-lg font-bold text-white">Editar perfil</h1>
    </div>

    <div class="px-4 sm:px-8 pt-8 max-w-lg">
      <!-- Avatar preview -->
      <div class="flex items-center gap-4 mb-8">
        <div class="relative w-16 h-16 flex-shrink-0 aspect-square group">
          <AppImage
            :src="image_url || auth.user?.image_url || null"
            :alt="auth.user?.username ?? ''"
            :initial="(name[0] ?? '?').toUpperCase()"
            type="artist"
            rounded="full"
            class="w-full h-full"
          />
          <div
            class="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none"
          >
            <Camera class="w-5 h-5 text-white" />
          </div>
        </div>
        <div>
          <p class="text-white font-semibold">{{ name || auth.user?.name }}</p>
          <p class="text-sm text-muted">
            @{{ username || auth.user?.username }}
          </p>
        </div>
      </div>

      <!-- Form -->
      <form @submit.prevent="save" class="space-y-5">
        <!-- Image URL -->
        <div class="space-y-1.5">
          <label
            class="text-xs font-semibold text-muted uppercase tracking-wider"
            >URL da foto de perfil</label
          >
          <input
            v-model="image_url"
            type="url"
            placeholder="https://exemplo.com/foto.jpg"
            class="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
          />
          <p class="text-[11px] text-muted">
            Cole o link de uma imagem pública
          </p>
        </div>

        <!-- Name -->
        <div class="space-y-1.5">
          <label
            class="text-xs font-semibold text-muted uppercase tracking-wider"
            >Nome</label
          >
          <input
            v-model="name"
            type="text"
            placeholder="Seu nome"
            maxlength="80"
            class="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <!-- Username -->
        <div class="space-y-1.5">
          <label
            class="text-xs font-semibold text-muted uppercase tracking-wider"
            >Username</label
          >
          <div class="relative">
            <span
              class="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm select-none"
              >@</span
            >
            <input
              v-model="username"
              type="text"
              placeholder="seu_username"
              maxlength="30"
              class="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl pl-8 pr-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <!-- Bio -->
        <div class="space-y-1.5">
          <label
            class="text-xs font-semibold text-muted uppercase tracking-wider"
            >Bio</label
          >
          <textarea
            v-model="bio"
            placeholder="Conte algo sobre você..."
            maxlength="200"
            rows="3"
            class="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-primary transition-colors resize-none"
          />
          <p class="text-xs text-muted text-right">{{ bio.length }}/200</p>
        </div>

        <!-- Feedback -->
        <div
          v-if="error"
          class="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-2xl px-4 py-3"
        >
          <AlertCircle class="w-4 h-4 flex-shrink-0" />
          {{ error }}
        </div>
        <div
          v-if="success"
          class="flex items-center gap-2 text-secondary text-sm bg-secondary/10 rounded-2xl px-4 py-3"
        >
          <CheckCircle2 class="w-4 h-4 flex-shrink-0" />
          Perfil atualizado!
        </div>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="saving"
          class="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold rounded-2xl py-3 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
          <Save v-else class="w-4 h-4" />
          {{ saving ? "Salvando..." : "Salvar alterações" }}
        </button>
      </form>
    </div>
  </div>
</template>
