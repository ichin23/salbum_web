import { ref, computed } from 'vue'
import type { ListenListApiItem } from '../types'
import {
    getListenList,
    addAlbumToList,
    addMusicToList,
    addArtistToList,
    removeFromListenList,
} from '../services/listenListService'

// ─── Singleton state (module-level = shared across all component instances) ───
const entries = ref<ListenListApiItem[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// ─── Hydrate from API ─────────────────────────────────────────────────────────
export async function fetchListenList(): Promise<void> {
    loading.value = true
    error.value = null
    try {
        const data = await getListenList()
        entries.value = Array.isArray(data) ? data : []
    } catch (e) {
        error.value = e instanceof Error ? e.message : 'Erro ao carregar lista'
        console.error('[useListenList] fetchListenList error:', e)
    } finally {
        loading.value = false
    }
}

export function useListenList() {
    // ── Computed views ────────────────────────────────────────────────────────
    const albumEntries = computed(() => entries.value.filter(e => e.album !== null))
    const musicEntries = computed(() => entries.value.filter(e => e.music !== null))
    const artistEntries = computed(() => entries.value.filter(e => e.artist !== null))

    // ── Presence checks ───────────────────────────────────────────────────────
    function hasAlbum(albumId: string): boolean {
        return entries.value.some(e => e.album?.id === albumId)
    }
    function hasMusic(musicId: string): boolean {
        return entries.value.some(e => e.music?.id === musicId)
    }
    function hasArtist(artistId: string): boolean {
        return entries.value.some(e => e.artist?.id === artistId)
    }

    // ── Add ───────────────────────────────────────────────────────────────────
    async function addAlbum(albumId: string): Promise<void> {
        if (hasAlbum(albumId)) return
        // Optimistic placeholder so UI reacts immediately
        const placeholder: ListenListApiItem = {
            id: `optimistic-${albumId}`,
            album: { id: albumId, name: '', type: null, country: null, rate: null, mbid: null, artists: [], release_date: null, spotify_url: null, image_url: null },
            music: null,
            artist: null,
            itemType: 'album',
            createdAt: new Date().toISOString(),
        }
        entries.value.unshift(placeholder)
        try {
            await addAlbumToList(albumId)
            await fetchListenList()   // get real entry id from server
        } catch (e) {
            entries.value = entries.value.filter(e => e.id !== placeholder.id)
            console.error('[useListenList] addAlbum error:', e)
            throw e
        }
    }

    async function addMusic(musicId: string): Promise<void> {
        if (hasMusic(musicId)) return
        const placeholder: ListenListApiItem = {
            id: `optimistic-${musicId}`,
            album: null,
            music: { id: musicId, name: '', length: null, mbid: null, position: null, artists: [], album: null },
            artist: null,
            itemType: 'music',
            createdAt: new Date().toISOString(),
        }
        entries.value.unshift(placeholder)
        try {
            await addMusicToList(musicId)
            await fetchListenList()
        } catch (e) {
            entries.value = entries.value.filter(e => e.id !== placeholder.id)
            console.error('[useListenList] addMusic error:', e)
            throw e
        }
    }

    async function addArtist(artistId: string): Promise<void> {
        if (hasArtist(artistId)) return
        const placeholder: ListenListApiItem = {
            id: `optimistic-${artistId}`,
            album: null,
            music: null,
            artist: { id: artistId, name: '', mbid: null, country: null, image_url: null },
            itemType: 'artist',
            createdAt: new Date().toISOString(),
        }
        entries.value.unshift(placeholder)
        try {
            await addArtistToList(artistId)
            await fetchListenList()
        } catch (e) {
            entries.value = entries.value.filter(e => e.id !== placeholder.id)
            console.error('[useListenList] addArtist error:', e)
            throw e
        }
    }

    // ── Remove ────────────────────────────────────────────────────────────────
    async function remove(entry: ListenListApiItem): Promise<void> {
        entries.value = entries.value.filter(e => e.id !== entry.id)
        try {
            await removeFromListenList(entry.id)
        } catch (e) {
            entries.value = [entry, ...entries.value]
            console.error('[useListenList] remove error:', e)
            throw e
        }
    }

    async function removeAlbum(albumId: string): Promise<void> {
        const entry = entries.value.find(e => e.album?.id === albumId)
        if (entry) await remove(entry)
    }
    async function removeMusic(musicId: string): Promise<void> {
        const entry = entries.value.find(e => e.music?.id === musicId)
        if (entry) await remove(entry)
    }
    async function removeArtist(artistId: string): Promise<void> {
        const entry = entries.value.find(e => e.artist?.id === artistId)
        if (entry) await remove(entry)
    }

    return {
        entries,
        loading,
        error,
        albumEntries,
        musicEntries,
        artistEntries,
        hasAlbum,
        hasMusic,
        hasArtist,
        addAlbum,
        addMusic,
        addArtist,
        remove,
        removeAlbum,
        removeMusic,
        removeArtist,
    }
}
