(function () {
  'use strict';
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { window.XianUI.init(); });
  } else {
    window.XianUI.init();
  }
})();
