import { useHead } from '@vueuse/head'
import { computed, type MaybeRef, toValue } from 'vue'

export interface SeoMetaOptions {
  title: MaybeRef<string>
  description: MaybeRef<string>
  image?: MaybeRef<string | null>
  url?: MaybeRef<string>
  type?: MaybeRef<string>
  siteName?: string
}

const SITE_NAME = 'Salbum'
const DEFAULT_DESCRIPTION = 'Descubra e avalie seus álbuns de música favoritos. Escreva reviews, compartilhe com amigos e construa sua escuta.'
const DEFAULT_IMAGE = '/salbum_logo.svg'

export function useSeoMeta(options: SeoMetaOptions) {
  const resolved = computed(() => {
    const o = options
    const title = toValue(o.title)
    const description = toValue(o.description)
    const image = toValue(o.image) || DEFAULT_IMAGE
    const url = toValue(o.url) || ''
    const type = toValue(o.type) || 'website'

    return { title, description, image, url, type }
  })

  useHead({
    title: computed(() => resolved.value.title ? `${resolved.value.title} | ${SITE_NAME}` : SITE_NAME),
    meta: [
      {
        name: 'description',
        content: computed(() => resolved.value.description || DEFAULT_DESCRIPTION),
      },
      {
        property: 'og:title',
        content: computed(() => resolved.value.title ? `${resolved.value.title} | ${SITE_NAME}` : SITE_NAME),
      },
      {
        property: 'og:description',
        content: computed(() => resolved.value.description || DEFAULT_DESCRIPTION),
      },
      {
        property: 'og:image',
        content: computed(() => resolved.value.image),
      },
      {
        property: 'og:type',
        content: computed(() => resolved.value.type),
      },
      {
        property: 'og:site_name',
        content: options.siteName || SITE_NAME,
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: computed(() => resolved.value.title ? `${resolved.value.title} | ${SITE_NAME}` : SITE_NAME),
      },
      {
        name: 'twitter:description',
        content: computed(() => resolved.value.description || DEFAULT_DESCRIPTION),
      },
      {
        name: 'twitter:image',
        content: computed(() => resolved.value.image),
      },
      {
        name: 'robots',
        content: 'index, follow',
      },
    ],
    link: computed(() => {
      const links: Record<string, string>[] = []
      if (resolved.value.url) {
        links.push({ rel: 'canonical', href: resolved.value.url })
      }
      return links
    }),
  })
}
