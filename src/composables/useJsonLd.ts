import { useHead } from '@vueuse/head'
import { computed, type MaybeRef, toValue } from 'vue'

export interface JsonLdSchema {
  '@context': string
  '@type': string | string[]
  [key: string]: unknown
}

export function useJsonLd(schema: MaybeRef<JsonLdSchema>) {
  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: computed(() => JSON.stringify(toValue(schema))),
      },
    ],
  })
}

export function buildWebSiteSchema(url: string): JsonLdSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Salbum',
    url,
    description: 'Descubra e avalie seus álbuns de música favoritos.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function buildMusicAlbumSchema(album: {
  name: string
  artists: { name: string }[]
  image_url?: string | null
  release_date?: string | null
  genres?: string[]
  rate?: number | null
  spotify_url?: string | null
  url: string
}): JsonLdSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicAlbum',
    name: album.name,
    byArtist: album.artists.map(a => ({
      '@type': 'Person',
      name: a.name,
    })),
    ...(album.image_url && { image: album.image_url }),
    ...(album.release_date && { datePublished: album.release_date }),
    ...(album.genres?.length && { genre: album.genres }),
    ...(album.rate != null && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: album.rate,
        bestRating: 10,
        worstRating: 0,
        ratingCount: 1,
      },
    }),
    ...(album.spotify_url && { sameAs: album.spotify_url }),
    url: album.url,
  }
}

export function buildReviewSchema(review: {
  author: string
  albumName: string
  artists: string[]
  content?: string | null
  score?: number | null
  datePublished: string
  url: string
}): JsonLdSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: review.author,
    },
    itemReviewed: {
      '@type': 'MusicAlbum',
      name: review.albumName,
      byArtist: review.artists.map(name => ({
        '@type': 'Person',
        name,
      })),
    },
    ...(review.content && { reviewBody: review.content }),
    ...(review.score != null && {
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.score,
        bestRating: 100,
        worstRating: 0,
      },
    }),
    datePublished: review.datePublished,
    url: review.url,
  }
}

export function buildPersonSchema(person: {
  name: string
  description?: string | null
  image?: string | null
  url: string
}): JsonLdSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    ...(person.description && { description: person.description }),
    ...(person.image && { image: person.image }),
    url: person.url,
  }
}
