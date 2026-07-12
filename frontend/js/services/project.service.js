window.GSE = window.GSE || {};
window.GSE.Services = window.GSE.Services || {};

GSE.Services.ProjectService = (function () {
  var _useMock = true;

  function _envelope(success, data, message) {
    return { success: success, message: message || '', data: data };
  }

  function useMock(val) {
    _useMock = val;
  }

  async function getAll(filters) {
    if (_useMock) {
      return _envelope(true, GSE.Mocks.Project.generateAll(), 'OK');
    }
    try {
      var params = '';
      if (filters) {
        var parts = [];
        for (var key in filters) {
          if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
            parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(filters[key]));
          }
        }
        if (parts.length) params = '?' + parts.join('&');
      }
      var res = await safeFetch(API_BASE + '/api/projects' + params);
      return await res.json();
    } catch (err) {
      return _envelope(false, null, err.message || 'Failed to load projects');
    }
  }

  async function getById(id) {
    if (_useMock) {
      var project = GSE.Mocks.Project.generateById(id);
      return project ? _envelope(true, project, 'OK') : _envelope(false, null, 'Project not found: ' + id);
    }
    try {
      var res = await safeFetch(API_BASE + '/api/projects/' + encodeURIComponent(id));
      return await res.json();
    } catch (err) {
      return _envelope(false, null, err.message || 'Failed to load project');
    }
  }

  async function create(data) {
    if (_useMock) {
      data.id = 'PRJ-' + String(Math.floor(Math.random() * 999)).padStart(3, '0');
      return _envelope(true, data, 'Project created');
    }
    try {
      var res = await safeFetch(API_BASE + '/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (err) {
      return _envelope(false, null, err.message || 'Failed to create project');
    }
  }

  async function update(id, data) {
    if (_useMock) {
      return _envelope(true, data, 'Project updated');
    }
    try {
      var res = await safeFetch(API_BASE + '/api/projects/' + encodeURIComponent(id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (err) {
      return _envelope(false, null, err.message || 'Failed to update project');
    }
  }

  async function updateStage(id, stage) {
    if (_useMock) {
      return _envelope(true, { id: id, status: stage }, 'Stage updated to ' + stage);
    }
    try {
      var res = await safeFetch(API_BASE + '/api/projects/' + encodeURIComponent(id) + '/stage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: stage })
      });
      return await res.json();
    } catch (err) {
      return _envelope(false, null, err.message || 'Failed to update stage');
    }
  }

  async function remove(id) {
    if (_useMock) {
      return _envelope(true, null, 'Project deleted');
    }
    try {
      var res = await safeFetch(API_BASE + '/api/projects/' + encodeURIComponent(id), {
        method: 'DELETE'
      });
      return await res.json();
    } catch (err) {
      return _envelope(false, null, err.message || 'Failed to delete project');
    }
  }

  return {
    useMock: useMock,
    getAll: getAll,
    getById: getById,
    create: create,
    update: update,
    updateStage: updateStage,
    remove: remove
  };
})();
