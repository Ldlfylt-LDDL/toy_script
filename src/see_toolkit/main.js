import { makeStore } from './core/store.js';
import { mountPanel } from './core/panel.js';
import { weatherModule } from './modules/weather.js';

(function () {
  'use strict';
  const store = makeStore();
  const weather = weatherModule(store);
  window.fetch = weather.install(window.fetch);

  function start() {
    const panel = mountPanel();
    const view = weather.plan(null).view;
    weather.render(view, panel.section('weather', weather.title));
    console.log('[see-toolkit] active');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(start, 3000));
  else setTimeout(start, 3000);
})();
