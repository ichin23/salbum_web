<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import {
  ArrowLeft,
  Loader2,
  Check,
  Search,
  X,
  Plus,
  Trash2,
  UserPlus,
} from "lucide-vue-next";
import { createAlbum, type CreateMusicDTO } from "../services/albumService";
import { searchArtists } from "../services/artistService";
import type { ArtistInfoDTO } from "../types";

const router = useRouter();

// ─── Album fields ──────────────────────────────────────────────────────────
const name = ref("");
const albumType = ref("");
const country = ref("");
const release_date = ref("");
const genreInput = ref("");
const genres = ref<string[]>([]);

function addGenre() {
  const g = genreInput.value.trim();
  if (g && !genres.value.includes(g)) genres.value.push(g);
  genreInput.value = "";
}
function removeGenre(g: string) {
  genres.value = genres.value.filter((x) => x !== g);
}
function onGenreKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" || e.key === ",") {
    e.preventDefault();
    addGenre();
  }
}

// ─── Artists ───────────────────────────────────────────────────────────────
const selectedArtists = ref<ArtistInfoDTO[]>([]);
const artistSearch = ref("");
const artistResults = ref<ArtistInfoDTO[]>([]);
const searchingArtists = ref(false);
const artistSearchOpen = ref(false);

let artistDebounce: ReturnType<typeof setTimeout>;
function onArtistInput() {
  clearTimeout(artistDebounce);
  if (!artistSearch.value.trim()) {
    artistResults.value = [];
    return;
  }
  artistDebounce = setTimeout(async () => {
    searchingArtists.value = true;
    try {
      artistResults.value = await searchArtists(artistSearch.value.trim());
    } catch {
      artistResults.value = [];
    } finally {
      searchingArtists.value = false;
    }
  }, 350);
}

function addArtist(a: ArtistInfoDTO) {
  if (!selectedArtists.value.find((x) => x.id === a.id)) {
    selectedArtists.value.push(a);
  }
  artistSearch.value = "";
  artistResults.value = [];
  artistSearchOpen.value = false;
}

function removeArtist(id: string) {
  selectedArtists.value = selectedArtists.value.filter((a) => a.id !== id);
}

// ─── Tracks ────────────────────────────────────────────────────────────────
interface TrackForm {
  name: string;
  length_min: string;
  length_sec: string;
  position: number;
  artistIds: string[];
  artistNames: string[]; // parallel array for display
  artistSearch: string;
  artistResults: ArtistInfoDTO[];
  searching: boolean;
  dropdownOpen: boolean;
}

function newTrack(pos: number): TrackForm {
  return {
    name: "",
    length_min: "",
    length_sec: "",
    position: pos,
    artistIds: [],
    artistNames: [],
    artistSearch: "",
    artistResults: [],
    searching: false,
    dropdownOpen: false,
  };
}

const tracks = ref<TrackForm[]>([newTrack(1)]);

function addTrack() {
  tracks.value.push(newTrack(tracks.value.length + 1));
}

function removeTrack(i: number) {
  tracks.value.splice(i, 1);
  tracks.value.forEach((t, idx) => {
    t.position = idx + 1;
  });
}

const trackDebounces: (ReturnType<typeof setTimeout> | null)[] = [];
function onTrackArtistInput(i: number) {
  const track = tracks.value[i];
  if (!track) return;
  if (trackDebounces[i]) clearTimeout(trackDebounces[i]!);
  if (!track.artistSearch.trim()) {
    track.artistResults = [];
    return;
  }
  trackDebounces[i] = setTimeout(async () => {
    track.searching = true;
    try {
      track.artistResults = await searchArtists(track.artistSearch.trim());
    } catch {
      track.artistResults = [];
    } finally {
      track.searching = false;
    }
  }, 350);
}
function addTrackArtist(i: number, a: ArtistInfoDTO) {
  const track = tracks.value[i];
  if (!track) return;
  if (!track.artistIds.includes(a.id)) {
    track.artistIds.push(a.id);
    track.artistNames.push(a.name);
  }
  track.artistSearch = "";
  track.artistResults = [];
  track.dropdownOpen = false;
}
function removeTrackArtist(i: number, artistId: string) {
  const track = tracks.value[i];
  if (!track) return;
  const idx = track.artistIds.indexOf(artistId);
  if (idx !== -1) {
    track.artistIds.splice(idx, 1);
    track.artistNames.splice(idx, 1);
  }
}

function blurCloseArtistSearch() {
  setTimeout(() => (artistSearchOpen.value = false), 150);
}
function blurCloseTrackSearch(track: TrackForm) {
  setTimeout(() => (track.dropdownOpen = false), 150);
}

function parseLengthMs(min: string, sec: string): number | null {
  const m = parseInt(min || "0");
  const s = parseInt(sec || "0");
  if (isNaN(m) && isNaN(s)) return null;
  return ((isNaN(m) ? 0 : m) * 60 + (isNaN(s) ? 0 : s)) * 1000;
}

// ─── Submit ────────────────────────────────────────────────────────────────
const saving = ref(false);
const success = ref(false);
const error = ref<string | null>(null);

function validate(): string | null {
  if (!name.value.trim()) return "Nome do álbum é obrigatório.";
  if (selectedArtists.value.length === 0)
    return "Selecione pelo menos um artista.";
  const emptyTrack = tracks.value.find((t) => !t.name.trim());
  if (tracks.value.length > 0 && emptyTrack)
    return "Todas as faixas precisam ter um nome.";
  return null;
}

async function submit() {
  error.value = null;
  const err = validate();
  if (err) {
    error.value = err;
    return;
  }
  saving.value = true;

  const musics: CreateMusicDTO[] = tracks.value
    .filter((t) => t.name.trim())
    .map((t, i) => ({
      name: t.name.trim(),
      position: i + 1,
      length: parseLengthMs(t.length_min, t.length_sec),
      artistIds:
        t.artistIds.length > 0
          ? t.artistIds
          : selectedArtists.value.map((a) => a.id),
    }));

  try {
    const album = await createAlbum({
      name: name.value.trim(),
      type: albumType.value.trim() || null,
      country: country.value.trim() || null,
      release_date: release_date.value || null,
      artistIds: selectedArtists.value.map((a) => a.id),
      genres: genres.value,
      musics,
    });
    success.value = true;
    setTimeout(
      () => router.push({ name: "album-detail", params: { id: album.id } }),
      800,
    );
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Erro ao criar álbum.";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-20">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <button
        @click="router.back()"
        class="p-2 rounded-xl text-muted hover:text-white hover:bg-[var(--color-surface-2)] transition-colors"
      >
        <ArrowLeft class="w-5 h-5" />
      </button>
      <div>
        <h1 class="text-xl font-bold text-white">Criar álbum</h1>
        <p class="text-xs text-muted mt-0.5">Adicione um álbum ao catálogo</p>
      </div>
    </div>

    <form @submit.prevent="submit" class="space-y-6">
      <!-- ── Informações básicas ──────────────────────────────────────────── -->
      <section class="card p-5 space-y-4">
        <h2 class="text-sm font-semibold text-white">Informações básicas</h2>

        <!-- Name -->
        <div class="space-y-1.5">
          <label
            class="text-xs font-semibold text-muted uppercase tracking-wider"
          >
            Nome <span class="text-red-400">*</span>
          </label>
          <input
            v-model="name"
            type="text"
            placeholder="Nome do álbum"
            class="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] text-white placeholder-muted rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <!-- Type + Country -->
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label
              class="text-xs font-semibold text-muted uppercase tracking-wider"
              >Tipo</label
            >
            <select
              v-model="albumType"
              class="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
            >
              <option value="">Selecionar...</option>
              <option value="album">Álbum</option>
              <option value="single">Single</option>
              <option value="ep">EP</option>
              <option value="compilation">Compilação</option>
              <option value="live">Ao vivo</option>
            </select>
          </div>
          <div class="space-y-1.5">
            <label
              class="text-xs font-semibold text-muted uppercase tracking-wider"
              >País</label
            >
            <select
              v-model="country"
              class="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
            >
              <option value="">Selecionar...</option>
              <option value="BR">Brasil</option>
              <option value="US">Estados Unidos</option>
              <option value="GB">Reino Unido</option>
              <option value="DE">Alemanha</option>
              <option value="FR">França</option>
              <option value="JP">Japão</option>
              <option value="SE">Suécia</option>
              <option value="NO">Noruega</option>
              <option value="IS">Islândia</option>
              <option value="AU">Austrália</option>
              <option value="CA">Canadá</option>
              <option value="IE">Irlanda</option>
              <option value="NZ">Nova Zelândia</option>
              <option value="NG">Nigéria</option>
              <option value="ZA">África do Sul</option>
              <option value="JM">Jamaica</option>
              <option value="CO">Colômbia</option>
              <option value="AR">Argentina</option>
              <option value="MX">México</option>
              <option value="CU">Cuba</option>
              <option value="ES">Espanha</option>
              <option value="IT">Itália</option>
              <option value="PT">Portugal</option>
              <option value="KR">Coreia do Sul</option>
              <option value="NU">Outro</option>
            </select>
          </div>
        </div>

        <!-- Release date -->
        <div class="space-y-1.5">
          <label
            class="text-xs font-semibold text-muted uppercase tracking-wider"
          >
            Data de lançamento
          </label>
          <input
            v-model="release_date"
            type="date"
            class="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] text-white placeholder-muted rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <!-- Genres -->
        <div class="space-y-1.5">
          <label
            class="text-xs font-semibold text-muted uppercase tracking-wider"
            >Gêneros</label
          >
          <div v-if="genres.length" class="flex flex-wrap gap-2 mb-2">
            <span
              v-for="g in genres"
              :key="g"
              class="flex items-center gap-1.5 px-3 py-1 bg-[var(--color-surface-2)] border border-[var(--color-border)] text-white text-xs rounded-full"
            >
              {{ g }}
              <button
                type="button"
                @click="removeGenre(g)"
                class="text-muted hover:text-red-400 transition-colors"
              >
                <X class="w-3 h-3" />
              </button>
            </span>
          </div>
          <div class="flex gap-2">
            <input
              v-model="genreInput"
              @keydown="onGenreKeydown"
              type="text"
              placeholder="Ex: Rock, Jazz, Hip-Hop... (Enter para adicionar)"
              class="flex-1 bg-[var(--color-surface-2)] border border-[var(--color-border)] text-white placeholder-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
            />
            <button
              type="button"
              @click="addGenre"
              class="px-3 py-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-muted hover:text-white transition-colors"
            >
              <Plus class="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <!-- ── Artistas ─────────────────────────────────────────────────────── -->
      <section class="card p-5 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold text-white">
            Artistas <span class="text-red-400">*</span>
          </h2>
          <button
            type="button"
            @click="router.push({ name: 'create-artist' })"
            class="flex items-center gap-1.5 text-xs text-muted hover:text-primary transition-colors"
          >
            <UserPlus class="w-3.5 h-3.5" />
            Criar artista
          </button>
        </div>

        <!-- Selected artists -->
        <div v-if="selectedArtists.length" class="flex flex-wrap gap-2">
          <span
            v-for="a in selectedArtists"
            :key="a.id"
            class="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary text-xs rounded-full"
          >
            {{ a.name }}
            <button
              type="button"
              @click="removeArtist(a.id)"
              class="hover:text-red-400 transition-colors"
            >
              <X class="w-3 h-3" />
            </button>
          </span>
        </div>

        <!-- Artist search -->
        <div class="relative">
          <div class="relative">
            <Search
              class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
            />
            <input
              v-model="artistSearch"
              @input="onArtistInput"
              @focus="artistSearchOpen = true"
              @blur="blurCloseArtistSearch"
              type="text"
              placeholder="Buscar artista..."
              class="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] text-white placeholder-muted rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
            />
            <Loader2
              v-if="searchingArtists"
              class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted animate-spin"
            />
          </div>

          <!-- Dropdown results -->
          <div
            v-if="artistSearchOpen && artistResults.length > 0"
            class="absolute top-full mt-1 left-0 right-0 z-10 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto"
          >
            <button
              v-for="a in artistResults"
              :key="a.id"
              type="button"
              @mousedown="addArtist(a)"
              class="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left hover:bg-[var(--color-surface-2)] transition-colors"
            >
              <img
                v-if="a.image_url"
                :src="a.image_url"
                class="w-7 h-7 rounded-full object-cover flex-shrink-0"
              />
              <div
                v-else
                class="w-7 h-7 rounded-full bg-[var(--color-surface-2)] flex-shrink-0 flex items-center justify-center text-xs text-muted font-bold"
              >
                {{ a.name[0]?.toUpperCase() }}
              </div>
              <span class="text-white">{{ a.name }}</span>
              <span v-if="a.country" class="text-xs text-muted ml-auto">{{
                a.country
              }}</span>
            </button>
          </div>

          <!-- No results -->
          <div
            v-else-if="
              artistSearchOpen &&
              artistSearch.trim() &&
              !searchingArtists &&
              artistResults.length === 0
            "
            class="absolute top-full mt-1 left-0 right-0 z-10 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl p-3 text-xs text-muted text-center"
          >
            Nenhum artista encontrado.
            <button
              type="button"
              @mousedown="router.push({ name: 'create-artist' })"
              class="ml-1 text-primary hover:underline"
            >
              Criar novo
            </button>
          </div>
        </div>
      </section>

      <!-- ── Faixas ───────────────────────────────────────────────────────── -->
      <section class="card p-5 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold text-white">Faixas</h2>
          <span class="text-xs text-muted"
            >{{ tracks.length }} faixa{{ tracks.length !== 1 ? "s" : "" }}</span
          >
        </div>

        <div class="space-y-2">
          <div
            v-for="(track, i) in tracks"
            :key="i"
            class="rounded-xl border border-[var(--color-border)] p-3 space-y-2"
          >
            <div class="flex items-center gap-2">
              <!-- Position -->
              <span
                class="text-xs text-muted w-5 text-right flex-shrink-0 select-none"
                >{{ i + 1 }}.</span
              >

              <!-- Name -->
              <input
                v-model="track.name"
                type="text"
                :placeholder="`Faixa ${i + 1}`"
                class="flex-1 bg-[var(--color-surface-2)] border border-[var(--color-border)] text-white placeholder-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors min-w-0"
              />

              <!-- Duration mm:ss -->
              <div class="flex items-center gap-1 flex-shrink-0">
                <input
                  v-model="track.length_min"
                  type="number"
                  min="0"
                  max="99"
                  placeholder="mm"
                  class="w-12 bg-[var(--color-surface-2)] border border-[var(--color-border)] text-white placeholder-muted rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:border-primary transition-colors"
                />
                <span class="text-muted text-xs">:</span>
                <input
                  v-model="track.length_sec"
                  type="number"
                  min="0"
                  max="59"
                  placeholder="ss"
                  class="w-12 bg-[var(--color-surface-2)] border border-[var(--color-border)] text-white placeholder-muted rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <!-- Remove -->
              <button
                type="button"
                @click="removeTrack(i)"
                class="flex-shrink-0 p-1.5 text-muted hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- Per-track artists -->
            <div class="pl-7 space-y-1.5">
              <!-- chips -->
              <div v-if="track.artistIds.length" class="flex flex-wrap gap-1.5">
                <span
                  v-for="(aid, ai) in track.artistIds"
                  :key="aid"
                  class="flex items-center gap-1 px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary text-xs rounded-full"
                >
                  {{ track.artistNames[ai] }}
                  <button
                    type="button"
                    @click="removeTrackArtist(i, aid)"
                    class="hover:text-red-400"
                  >
                    <X class="w-2.5 h-2.5" />
                  </button>
                </span>
              </div>
              <p v-else class="text-xs text-muted italic">
                Artistas do álbum (padrão)
              </p>

              <!-- search -->
              <div class="relative">
                <Search
                  class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none"
                />
                <input
                  v-model="track.artistSearch"
                  @input="onTrackArtistInput(i)"
                  @focus="track.dropdownOpen = true"
                  @blur="() => blurCloseTrackSearch(track)"
                  type="text"
                  placeholder="Artista específico desta faixa..."
                  class="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] text-white placeholder-muted rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-primary transition-colors"
                />
                <Loader2
                  v-if="track.searching"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted animate-spin"
                />
                <div
                  v-if="track.dropdownOpen && track.artistResults.length"
                  class="absolute top-full mt-1 left-0 right-0 z-20 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl overflow-hidden max-h-36 overflow-y-auto"
                >
                  <button
                    v-for="a in track.artistResults"
                    :key="a.id"
                    type="button"
                    @mousedown="addTrackArtist(i, a)"
                    class="flex items-center gap-2 w-full px-3 py-2 text-xs text-left hover:bg-[var(--color-surface-2)] transition-colors"
                  >
                    <img
                      v-if="a.image_url"
                      :src="a.image_url"
                      class="w-5 h-5 rounded-full object-cover flex-shrink-0"
                    />
                    <div
                      v-else
                      class="w-5 h-5 rounded-full bg-[var(--color-surface-2)] flex-shrink-0 flex items-center justify-center text-xs text-muted font-bold"
                    >
                      {{ a.name[0]?.toUpperCase() }}
                    </div>
                    <span class="text-white">{{ a.name }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          @click="addTrack"
          class="flex items-center gap-2 w-full py-2.5 rounded-xl border border-dashed border-[var(--color-border)] text-muted hover:text-white hover:border-[var(--color-muted)]/50 text-sm transition-colors justify-center"
        >
          <Plus class="w-4 h-4" />
          Adicionar faixa
        </button>
      </section>

      <!-- Error -->
      <p v-if="error" class="text-sm text-red-400 px-1">{{ error }}</p>

      <!-- Submit -->
      <button
        type="submit"
        :disabled="saving || success"
        class="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-60"
        :class="
          success
            ? 'bg-green-500 text-white'
            : 'bg-primary text-white hover:bg-primary/90'
        "
      >
        <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
        <Check v-else-if="success" class="w-4 h-4" />
        {{ success ? "Álbum criado!" : saving ? "Salvando..." : "Criar álbum" }}
      </button>
    </form>
  </div>
</template>
