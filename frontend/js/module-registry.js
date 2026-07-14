window.GSE = window.GSE || {};

GSE.ModuleRegistry = (function () {
  var _registry = {};
  var _meta = {};

  function register(name, instance) {
    var id, mod, title, version;

    if (typeof name === 'object' && name !== null && name.id) {
      var config = name;
      id = config.id;
      title = config.title || id;
      version = config.version || '1.0.0';
      mod = config.module;
    } else {
      id = name;
      mod = instance;
      title = id;
      version = '1.0.0';
    }

    if (!mod) {
      console.warn('ModuleRegistry: Cannot register "' + id + '" - module is null');
      return;
    }

    if (_registry[id]) {
      console.warn('ModuleRegistry: Overwriting existing module "' + id + '"');
    }

    _registry[id] = mod;
    _meta[id] = {
      id: id,
      title: title,
      version: version,
      initialized: false,
      mounted: false
    };
  }

  function get(name) {
    return _registry[name] || null;
  }

  function getMeta(name) {
    return _meta[name] ? JSON.parse(JSON.stringify(_meta[name])) : null;
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
    delete _meta[name];
  }

  function initAll() {
    var names = Object.keys(_registry);
    for (var i = 0; i < names.length; i++) {
      var mod = _registry[names[i]];
      if (typeof mod.init === 'function') {
        mod.init();
        if (_meta[names[i]]) _meta[names[i]].initialized = true;
      }
    }
  }

  function markMounted(id) {
    if (_meta[id]) _meta[id].mounted = true;
  }

  function markUnmounted(id) {
    if (_meta[id]) _meta[id].mounted = false;
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
    getMeta: getMeta,
    refresh: refresh,
    destroy: destroy,
    initAll: initAll,
    markMounted: markMounted,
    markUnmounted: markUnmounted,
    refreshActive: refreshActive
  };
})();
