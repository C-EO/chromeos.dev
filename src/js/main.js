/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* global gtag */
import dynamicImportPolyfill from 'dynamic-import-polyfill';
import { preferences } from 'service-worker-i18n-redirect/preferences';
import { MainNavigation } from './components/nav';
import { CookieDisclaimer } from './components/cookie-disclaimer';

dynamicImportPolyfill.initialize({
  modulePath: '/js/',
});

// Components that are critical to user experience should be loaded on `DomContentLoaded`
window.addEventListener('DOMContentLoaded', async () => {
  new MainNavigation();

  const lang = document.querySelector('#lang');
  const form = document.querySelector('.form');
  const toc = document.querySelector('.toc');
  const search = document.querySelector('.search-results');
  const searchBox = document.querySelector('.search-box-header');
  const navPrimary = document.querySelector('.nav__primary');
  const home = document.querySelector('#home');
  const offlineSearch = document.querySelector('[data-offline-search]');

  // Set default language if no language is set
  const language = await preferences.get('lang');
  if (language === undefined) {
    preferences.set('lang', lang.value);
  }

  // Redirect user if language is changed
  lang.addEventListener('change', e => {
    preferences.set('lang', e.target.value);
    window.location = document.querySelector(`link[rel="alternate"][hreflang="${e.target.value}"]`).href;
  });

  const cookieDialog = document.querySelector('.cookie-disclaimer');
  const logo = document.querySelector('.header__home');
  if (cookieDialog) {
    new CookieDisclaimer(cookieDialog, logo);
  }

  if (offlineSearch && (await preferences.get('offline-search'))) {
    offlineSearch.style.display = 'block';
  }

  if (home) {
    const { Home } = await import('./components/home');
    new Home(home);
  }

  if (form) {
    const { Form } = await import('./components/form');
    new Form(form);
  }

  if (searchBox) {
    const { SearchBox } = await import('./components/search-box');
    new SearchBox(searchBox, navPrimary);
  }

  if (search) {
    const { Search } = await import('./components/search');
    new Search(search, language);
  }

  // Houdini paint worklet
  if (!CSS.paintWorklet) {
    await import('css-paint-polyfill');
  }

  if (CSS.paintWorklet) {
    await CSS.paintWorklet.addModule('/js/worklets/circles.js');
  }

  // Table of Contents
  if (toc) {
    const { TableOfContents } = await import('./components/toc');
    new TableOfContents(toc);
  }
});

// Components not critical to user experience should be loaded on `load`
window.addEventListener('load', async () => {
  const subnav = document.querySelector('.subnav');
  const hero = document.querySelector('.hero-animated');
  const thankYou = document.querySelector('.thank-you');
  const tables = document.querySelectorAll('table');

  if (thankYou) {
    const { ThankYou } = await import('./components/thank-you');
    new ThankYou(thankYou);
  }

  if (subnav) {
    const { Subnav } = await import('./components/subnav');
    new Subnav(subnav);
  }

  if (hero) {
    // Loads the component first to track changes in the HTML elements, then loads the library and the animation data.
    const { HeroAnimated } = await import('./components/hero-animated');
    const heroAnimated = new HeroAnimated(hero);

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const [{ default: lottie }, { animationData }] = await Promise.all([import('lottie-web/build/player/lottie_svg.min.js'), import('./animations/home')]);
      heroAnimated.loadAnimation(lottie, animationData);
    }
  }

  if (tables) {
    const { ResponsiveTable } = await import('./components/responsive-table');

    for (const table of tables) {
      new ResponsiveTable(table);
    }
  }

  const { Tracking } = await import('./lib/tracking');
  new Tracking(gtag);
});

// Manage Service Worker
// eslint-disable-next-line no-constant-condition
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', async () => {
//     try {
//       const registration = await navigator.serviceWorker.register('/sw.js');
//       // log('Service Worker registered! 😎');
//       // log(registration);

//       // Only offer reloads if there is already an active Service Worker
//       if (registration.active) {
//         const { offerServiceWorkerReload } = await import('./lib/offer-service-worker-reload');
//         offerServiceWorkerReload(registration);
//       }
//     } catch (e) {
//       // log('Registration failed 😫');
//       // log(e);
//     }
//   });
// }
