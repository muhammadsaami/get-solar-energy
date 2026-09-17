window.GSE = window.GSE || {};
window.GSE.Services = window.GSE.Services || {};

GSE.Services.JourneyService = (function () {
  var _useMock = true;

  function _envelope(success, data, message) {
    return { success: success, message: message || '', data: data };
  }

  function useMock(val) {
    _useMock = val;
  }

  async function get() {
    if (_useMock) {
      return _envelope(true, GSE.Mocks.Journey.generate(), 'OK');
    }
    try {
      var res = await safeFetch(API_BASE + '/api/journey');
      return await res.json();
    } catch (err) {
      return _envelope(false, null, err.message || 'Failed to load journey');
    }
  }

  async function update(data) {
    if (_useMock) {
      return _envelope(true, data, 'Journey updated');
    }
    try {
      var res = await safeFetch(API_BASE + '/api/journey', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (err) {
      return _envelope(false, null, err.message || 'Failed to update journey');
    }
  }

  return {
    useMock: useMock,
    get: get,
    update: update
  };
})();
