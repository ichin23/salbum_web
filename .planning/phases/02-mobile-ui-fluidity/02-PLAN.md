---
wave: 1
depends_on: []
files_modified:
  - index.html
  - src/style.css
  - src/layouts/AppLayout.vue
  - src/components/layout/BottomNav.vue
autonomous: false
requirements: ["Mobile UI & Fluidity"]
---

# Plan: Mobile UI & Fluidity Enhancements

## Objective
Enhance the user experience on mobile devices by making the application feel native. This involves implementing safe areas for modern smartphones (like iPhones with home indicators), smooth transitions between views, and disabling typical browser behaviors (like overscroll bounce and tap highlights).

## Tasks

<task>
<objective>Add native-feel meta tags and global CSS</objective>
<read_first>
- index.html
- src/style.css
</read_first>
<action>
1. In `index.html`, modify the `viewport` meta tag to include `viewport-fit=cover` and `user-scalable=no, maximum-scale=1.0` to prevent zooming and respect safe areas.
2. In `src/style.css`, add the following to the `*` selector: `-webkit-tap-highlight-color: transparent;`.
3. Add `overscroll-behavior-y: none;` and `overscroll-behavior-x: none;` to the `body` selector to prevent the pull-to-refresh rubber-banding effect.
</action>
<acceptance_criteria>
- `index.html` contains `viewport-fit=cover` and `maximum-scale=1.0`.
- `style.css` contains `-webkit-tap-highlight-color: transparent` globally.
- `style.css` contains `overscroll-behavior-y: none` on `body`.
</acceptance_criteria>
</task>

<task>
<objective>Implement safe areas in layout and navigation</objective>
<read_first>
- src/layouts/AppLayout.vue
- src/components/layout/BottomNav.vue
</read_first>
<action>
1. In `src/layouts/AppLayout.vue`, adjust the main content padding. Currently it's `pb-16`. Replace `pb-16` with a dynamic style: `style="padding-bottom: calc(4rem + env(safe-area-inset-bottom));"` on the `<main>` tag.
2. In `src/components/layout/BottomNav.vue`, add safe area padding to the bottom of the navigation bar. You can add `style="padding-bottom: env(safe-area-inset-bottom);"` to the root container to ensure tabs aren't obscured by the home indicator on iOS.
</action>
<acceptance_criteria>
- `AppLayout.vue` uses `env(safe-area-inset-bottom)` for its bottom padding.
- `BottomNav.vue` uses `env(safe-area-inset-bottom)` for its bottom padding.
</acceptance_criteria>
</task>

<task>
<objective>Add smooth view transitions</objective>
<read_first>
- src/layouts/AppLayout.vue
- src/style.css
</read_first>
<action>
1. In `src/layouts/AppLayout.vue`, replace `<RouterView />` with:
```vue
<RouterView v-slot="{ Component }">
  <Transition name="page" mode="out-in">
    <component :is="Component" />
  </Transition>
</RouterView>
```
2. In `src/style.css`, add the transition classes:
```css
/* ─── Page Transitions ─── */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
```
</action>
<acceptance_criteria>
- `AppLayout.vue` wraps the router component in a `<Transition name="page">`.
- `style.css` contains `.page-enter-active` and related classes for the transition.
</acceptance_criteria>
</task>

## Verification
- Test the application in a mobile viewport.
- Verify that clicking elements does not show a blue highlight box.
- Verify that navigating between pages shows a smooth fade and translate transition.
- Check the code to ensure `env(safe-area-inset-bottom)` is correctly applied to both the layout and the bottom nav.

## Must Haves
- Safe areas must be respected to avoid content being hidden by OS UI elements.
- Page transitions must feel smooth and not cause layout shift during the animation.
