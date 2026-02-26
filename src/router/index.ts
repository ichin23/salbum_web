import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '../layouts/AppLayout.vue'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        // Auth routes (no layout)
        {
            path: '/login',
            name: 'login',
            component: () => import('../views/auth/LoginView.vue'),
            meta: { guestOnly: true },
        },
        {
            path: '/register',
            name: 'register',
            component: () => import('../views/auth/RegisterView.vue'),
            meta: { guestOnly: true },
        },
        {
            path: '/verify',
            name: 'verify',
            component: () => import('../views/auth/VerifyCodeView.vue'),
            meta: { guestOnly: true },
        },
        {
            // OAuth callback — handles both Google and Spotify
            path: '/auth/callback/:provider',
            name: 'oauth-callback',
            component: () => import('../views/auth/OAuthCallbackView.vue'),
        },
        // App routes (with sidebar layout)
        {
            path: '/',
            component: AppLayout,
            meta: { requiresAuth: true },
            children: [
                {
                    path: '',
                    name: 'home',
                    component: () => import('../views/HomeView.vue'),
                },
                {
                    path: 'search',
                    name: 'search',
                    component: () => import('../views/SearchView.vue'),
                },
                {
                    path: 'album/:id',
                    name: 'album-detail',
                    component: () => import('../views/AlbumDetailView.vue'),
                },
                {
                    path: 'album/:id/review',
                    name: 'write-review',
                    component: () => import('../views/WriteReviewView.vue'),
                },
                {
                    path: 'lists',
                    name: 'listen-list',
                    component: () => import('../views/ListenListView.vue'),
                },
                {
                    path: 'artist/:id',
                    name: 'artist-detail',
                    component: () => import('../views/ArtistDetailView.vue'),
                },
                {
                    path: 'profile',
                    name: 'profile',
                    component: () => import('../views/ProfileView.vue'),
                },
                {
                    path: 'profile/edit',
                    name: 'edit-profile',
                    component: () => import('../views/EditProfileView.vue'),
                },
                {
                    path: 'albums/create',
                    name: 'create-album',
                    component: () => import('../views/CreateAlbumView.vue'),
                },
                {
                    path: 'album/:id/edit',
                    name: 'edit-album',
                    component: () => import('../views/EditAlbumView.vue'),
                },
                {
                    path: 'artists/create',
                    name: 'create-artist',
                    component: () => import('../views/CreateArtistView.vue'),
                },
                {
                    path: 'artist/:id/edit',
                    name: 'edit-artist',
                    component: () => import('../views/EditArtistView.vue'),
                },
            ],
        },
        // Fallback
        { path: '/:pathMatch(.*)*', redirect: '/' },
    ],
})

// ─── Navigation Guards ────────────────────────────────────────────────────────
router.beforeEach((to) => {
    // import dinâmico para evitar import circular (store precisa do Pinia já instalado)
    const token = localStorage.getItem('salbum_access_token')
    const isAuthenticated = !!token

    if (to.meta.requiresAuth && !isAuthenticated) {
        return { name: 'login', query: { redirect: to.fullPath } }
    }

    if (to.meta.guestOnly && isAuthenticated) {
        return { name: 'home' }
    }
})

export default router
