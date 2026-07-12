window.GSE = window.GSE || {};

GSE.ModuleRegistry = (function () {
  var _registry = {};

  function register(name, instance) {
    if (!instance) {
      console.warn('ModuleRegistry: Cannot register "' + name + '" - instance is null');
      return;
    }
    if (_registry[name]) {
      console.warn('ModuleRegistry: Overwriting existing module "' + name + '"');
    }
    _registry[name] = instance;
  }

  function get(name) {
    return _registry[name] || null;
  }

  function refresh(name) {
    var mod = _registry[name];
    if (mod && typeof mod.refresh === 'function') {
      mod.refresh();
    }
  }

  function destroy(name) {
    var mod = _registry[name];
    if (mod) {
      if (typeof mod.destroy === 'function') mod.destroy();
      if (typeof mod.unmount === 'function') mod.unmount();
    }
    delete _registry[name];
  }

  function initAll() {
    var names = Object.keys(_registry);
    for (var i = 0; i < names.length; i++) {
      var mod = _registry[names[i]];
      if (typeof mod.init === 'function') mod.init();
    }
  }

  function refreshActive() {
    var activeTab = document.querySelector('.tab-content.active');
    if (!activeTab) return;
    var tabId = activeTab.id.replace('tab-', '');
    var mod = _registry[tabId];
    if (mod && typeof mod.refresh === 'function') {
      mod.refresh();
    }
  }

  return {
    register: register,
    get: get,
    refresh: refresh,
    destroy: destroy,
    initAll: initAll,
    refreshActive: refreshActive
  };
})();
