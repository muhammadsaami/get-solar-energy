window.GSE = window.GSE || {};
window.GSE.Services = window.GSE.Services || {};

GSE.Services.PlanningService = (function () {
  var _useMock = true;

  function _envelope(success, data, message) {
    return { success: success, message: message || '', data: data };
  }

  function useMock(val) {
    _useMock = val;
  }

  async function get() {
    if (_useMock) {
      return _envelope(true, GSE.Mocks.Planning.generate(), 'OK');
    }
    try {
      var res = await safeFetch(API_BASE + '/api/planning');
      return await res.json();
    } catch (err) {
      return _envelope(false, null, err.message || 'Failed to load planning state');
    }
  }

  async function update(data) {
    if (_useMock) {
      return _envelope(true, data, 'Planning state updated');
    }
    try {
      var res = await safeFetch(API_BASE + '/api/planning', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (err) {
      return _envelope(false, null, err.message || 'Failed to update planning state');
    }
  }

  return {
    useMock: useMock,
    get: get,
    update: update
  };
})();
