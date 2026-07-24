<template>
<div class="instagram-story">
<div class="frame">
<div class="div">
<div class="image-wrapper">
<img
            class="image album-cover"
            alt="Image"
            src="/public/album_screen.jpg"
          />
</div>
<p class="text-wrapper">No escuro, quem é você?</p>
<div class="text-wrapper-2">Carol Biazin</div>
<img
          class="img logo"
          alt="Frame"
          src="/public/salbum_logo.svg"
        />
</div>
<p class="p">
Trocaria qualquer coisa pra sentir o abraço desse álbum sempre a todo
        momento comigo
      </p>
<div class="frame-2">
<img
          class="rectangle profile-pic"
          alt="Rectangle"
          src="/public/album_screen.jpg"
        />
<div class="text-wrapper-3">- Pedro Manoel</div>
</div>
</div>
<div class="frame-3">
<div class="salbum-logo"></div>
<p class="salbum-salbum-com-br">
<span class="span">Salbum</span>
<span class="text-wrapper-4">&nbsp;</span>
<span class="text-wrapper-5">salbum.com.br</span>
</p>
</div>
<div class="text-wrapper-6">&quot;</div>
</div>
</template>
<script lang="ts">

import { defineComponent } from "vue";

export default defineComponent({
  name: "InstagramStory",
  props: {},
});
</script>
<style>
.instagram-story {
  background: linear-gradient(
    174deg,
    rgba(33, 33, 33, 1) 0%,
    rgba(23, 39, 91, 1) 50%,
    rgba(8, 43, 15, 1) 100%
  );
  min-height: 1920px;
  min-width: 1080px;
  position: relative;
  width: 100%;
}

.instagram-story .frame {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 47px;
  left: 161px;
  position: absolute;
  top: 352px;
  width: 757px;
}

.instagram-story .div {
  -webkit-backdrop-filter: brightness(102%) saturate(100%);
  align-items: center;
  backdrop-filter: brightness(102%) saturate(100%);
  background-color: #00000001;
  border-radius: 30px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    inset 1px 0 0 rgba(255, 255, 255, 0.32),
    inset 0 -1px 1px rgba(0, 0, 0, 0.2),
    inset -1px 0 1px rgba(0, 0, 0, 0.16);
  display: flex;
  flex-direction: column;
  gap: 27px;
  height: 906px;
  padding: 40px 40px 20px;
  position: relative;
  width: 709px;
}

.instagram-story .image-wrapper {
  align-items: center;
  background-color: #234ed8;
  border-radius: 40px;
  display: flex;
  gap: 10px;
  height: 546px;
  justify-content: center;
  padding: 20px;
  position: relative;
  width: 546px;
}

.instagram-story .image {
  align-self: stretch;
  flex: 1;
  flex-grow: 1;
  object-fit: cover;
  position: relative;
}

.instagram-story .text-wrapper {
  color: #ffffff;
  font-family: "Inter-Bold", Helvetica;
  font-size: 48px;
  font-weight: 700;
  letter-spacing: 0;
  line-height: normal;
  position: relative;
  width: fit-content;
}

.instagram-story .text-wrapper-2 {
  color: #666565;
  font-family: "Inter-Medium", Helvetica;
  font-size: 40px;
  font-weight: 500;
  letter-spacing: 0;
  line-height: normal;
  position: relative;
  white-space: nowrap;
  width: fit-content;
}

.instagram-story .img {
  flex: 0 0 auto;
  position: relative;
}

.instagram-story .p {
  align-self: stretch;
  color: #ffffff;
  font-family: "Inter-Regular", Helvetica;
  font-size: 36px;
  font-weight: 400;
  letter-spacing: 0;
  line-height: normal;
  position: relative;
  text-align: center;
}

.instagram-story .frame-2 {
  align-items: center;
  display: inline-flex;
  flex: 0 0 auto;
  gap: 14px;
  position: relative;
}

.instagram-story .rectangle {
  height: 84px;
  position: relative;
  width: 84px;
}

.instagram-story .text-wrapper-3 {
  color: #ffffff;
  font-family: "Inter-Regular", Helvetica;
  font-size: 36px;
  font-weight: 400;
  letter-spacing: 0;
  line-height: normal;
  position: relative;
  text-align: center;
  width: fit-content;
}

.instagram-story .frame-3 {
  align-items: center;
  display: inline-flex;
  gap: 15px;
  left: 352px;
  position: absolute;
  top: 1788px;
}

.instagram-story .salbum-logo {
  background-image: url("./vector.svg");
  background-size: 100% 100%;
  height: 86px;
  position: relative;
  width: 52px;
}

.instagram-story .salbum-salbum-com-br {
  color: #ffffff;
  font-family: "Jersey 25-Regular", Helvetica;
  font-size: 48px;
  font-weight: 400;
  letter-spacing: 0;
  line-height: normal;
  position: relative;
  text-align: center;
  white-space: nowrap;
  width: fit-content;
}

.instagram-story .span {
  color: #ffffff;
  font-family: "Jersey 25-Regular", Helvetica;
  font-size: 48px;
  font-weight: 400;
  letter-spacing: 0;
}

.instagram-story .text-wrapper-4 {
  font-size: 36px;
}

.instagram-story .text-wrapper-5 {
  font-family: "Inter-Regular", Helvetica;
  font-size: 24px;
}

.instagram-story .text-wrapper-6 {
  color: #ffffff;
  font-family: "Jersey 25-Regular", Helvetica;
  font-size: 96px;
  font-weight: 400;
  left: 133px;
  letter-spacing: 0;
  line-height: normal;
  position: absolute;
  text-align: center;
  top: 1288px;
  white-space: nowrap;
}
</style>