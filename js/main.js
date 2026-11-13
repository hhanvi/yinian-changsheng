(function () {
  'use strict';
  function boot() {
    if (window.SectUI && typeof window.SectUI.init === 'function') {
      window.SectUI.init();
    } else {
      var app = document.getElementById('app');
      if (app) app.innerHTML = '<div class="noscript">游戏脚本没有正确加载，请刷新页面。</div>';
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
