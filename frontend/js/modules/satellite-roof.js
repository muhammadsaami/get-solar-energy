window.GSE = window.GSE || {};
window.GSE.Modules = window.GSE.Modules || {};

GSE.Modules.SatelliteRoof = (function () {

  var TILE_PROVIDERS = {
    street: {
      name: "OpenStreetMap",
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19
    },
    satellite: {
      name: "ESRI World Imagery",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "&copy; ESA",
      maxZoom: 19
    }
  };

  var DEFAULT_CENTER = [20.5937, 78.9629];
  var DEFAULT_ZOOM = 5;
  var CAPTURE_SCALE = 2;

  var _map = null;
  var _streetLayer = null;
  var _satLayer = null;
  var _currentTile = "street";
  var _marker = null;
  var _currentMode = "camera";
  var _selectedLocation = null;
  var _isInitialized = false;
  var _isMounted = false;
  var _searchTimer = null;
  var _captureInProgress = false;

  var _els = {};

  function _q(id) { return document.getElementById(id); }

  function _cacheElements() {
    _els = {
      modeCamera: _q("roofModeCamera"),
      modeSatellite: _q("roofModeSatellite"),
      cameraPanel: _q("roofCameraPanel"),
      satellitePanel: _q("roofSatellitePanel"),
      mapContainer: _q("satelliteMap"),
      addressInput: _q("satelliteAddressInput"),
      addressResults: _q("satelliteAddressResults"),
      captureBtn: _q("satelliteCaptureBtn"),
      toggleStreet: _q("satelliteToggleStreet"),
      toggleSat: _q("satelliteToggleSat"),
      betaBadge: _q("satelliteBetaBadge"),
      infoBanner: _q("satelliteInfoBanner"),
      locationLabel: _q("satelliteLocationLabel"),
      lengthInput: _q("roofLengthInput"),
      widthInput: _q("roofWidthInput"),
      cityInput: _q("roofCityInput")
    };
  }

  function init() {
    if (_isInitialized) return;
    _cacheElements();
    if (!_els.mapContainer) return;

    _bindModeToggle();
    _initMap();
    _bindLayerToggle();
    _bindAddressSearch();
    _bindCapture();
    _setMode("camera");

    _isInitialized = true;
    _isMounted = true;
    GSE.ModuleRegistry.markMounted("satellite-roof");
  }

  function _setMode(mode) {
    _currentMode = mode;
    if (_els.modeCamera) _els.modeCamera.classList.toggle("active", mode === "camera");
    if (_els.modeSatellite) _els.modeSatellite.classList.toggle("active", mode === "satellite");
    if (_els.cameraPanel) _els.cameraPanel.classList.toggle("active", mode === "camera");
    if (_els.satellitePanel) _els.satellitePanel.classList.toggle("active", mode === "satellite");

    if (_els.betaBadge) _els.betaBadge.style.display = mode === "satellite" ? "inline-block" : "none";
    if (_els.infoBanner) _els.infoBanner.style.display = mode === "satellite" ? "block" : "none";

    if (mode === "satellite" && _map) {
      setTimeout(function () { _map.invalidateSize(); }, 100);
    }
    if (mode === "satellite") {
      _updateAnalyzeBtn();
    }
  }

  function _bindModeToggle() {
    if (_els.modeCamera) {
      _els.modeCamera.addEventListener("click", function () { _setMode("camera"); });
    }
    if (_els.modeSatellite) {
      _els.modeSatellite.addEventListener("click", function () { _setMode("satellite"); });
    }
  }

  function _initMap() {
    if (!_els.mapContainer || typeof L === "undefined") return;

    _streetLayer = L.tileLayer(TILE_PROVIDERS.street.url, {
      attribution: TILE_PROVIDERS.street.attribution,
      maxZoom: TILE_PROVIDERS.street.maxZoom
    });

    _satLayer = L.tileLayer(TILE_PROVIDERS.satellite.url, {
      attribution: TILE_PROVIDERS.satellite.attribution,
      maxZoom: TILE_PROVIDERS.satellite.maxZoom
    });

    _map = L.map(_els.mapContainer, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      layers: [_streetLayer],
      zoomControl: true,
      attributionControl: true
    });
  }

  function _setTileLayer(key) {
    if (!_map) return;
    _currentTile = key;
    if (key === "satellite") {
      _map.removeLayer(_streetLayer);
      _map.addLayer(_satLayer);
    } else {
      _map.removeLayer(_satLayer);
      _map.addLayer(_streetLayer);
    }
    if (_els.toggleStreet) _els.toggleStreet.classList.toggle("active", key === "street");
    if (_els.toggleSat) _els.toggleSat.classList.toggle("active", key === "satellite");
  }

  function _bindLayerToggle() {
    if (_els.toggleStreet) {
      _els.toggleStreet.addEventListener("click", function () { _setTileLayer("street"); });
    }
    if (_els.toggleSat) {
      _els.toggleSat.addEventListener("click", function () { _setTileLayer("satellite"); });
    }
  }

  function _flyTo(lat, lng, zoom) {
    if (!_map) return;
    if (_marker) _map.removeLayer(_marker);
    _marker = L.marker([lat, lng]).addTo(_map);
    _map.setView([lat, lng], zoom || 18);
  }

  function _updateAnalyzeBtn() {
    var valid = _selectedLocation && _selectedLocation.lat;
    if (_els.captureBtn) {
      _els.captureBtn.disabled = !valid;
      _els.captureBtn.style.opacity = valid ? "1" : "0.45";
      _els.captureBtn.style.cursor = valid ? "pointer" : "not-allowed";
    }
  }

  function _bindAddressSearch() {
    if (!_els.addressInput) return;

    _els.addressInput.addEventListener("input", function () {
      var val = _els.addressInput.value.trim();
      if (_searchTimer) clearTimeout(_searchTimer);
      if (val.length < 3) {
        if (_els.addressResults) _els.addressResults.style.display = "none";
        return;
      }
      _searchTimer = setTimeout(function () {
        _performSearch(val);
      }, 300);
    });

    document.addEventListener("click", function (e) {
      if (_els.addressResults && !e.target.closest(".satellite-search-wrapper")) {
        _els.addressResults.style.display = "none";
      }
    });

    _els.addressInput.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && _els.addressResults) {
        _els.addressResults.style.display = "none";
      }
    });
  }

  function _performSearch(query) {
    if (!window.GSE || !window.GSE.Services || !window.GSE.Services.Geocoding) return;
    window.GSE.Services.Geocoding.searchAddress(query).then(function (results) {
      _renderAddressResults(results);
    });
  }

  function _renderAddressResults(results) {
    if (!_els.addressResults) return;
    _els.addressResults.innerHTML = "";
    if (!results || results.length === 0) {
      _els.addressResults.style.display = "none";
      return;
    }
    results.forEach(function (r) {
      var item = document.createElement("div");
      item.className = "satellite-address-result-item";
      item.textContent = r.label;
      item.addEventListener("click", function () {
        _selectAddressResult(r);
      });
      _els.addressResults.appendChild(item);
    });
    _els.addressResults.style.display = "block";
  }

  function _selectAddressResult(location) {
    _selectedLocation = location;
    if (_els.addressInput) _els.addressInput.value = location.label.split(",")[0];
    if (_els.addressResults) _els.addressResults.style.display = "none";
    if (_els.locationLabel) _els.locationLabel.textContent = location.label;
    if (_els.cityInput) _els.cityInput.value = location.city;
    if (_els.lengthInput) _els.lengthInput.value = "";
    if (_els.widthInput) _els.widthInput.value = "";
    _flyTo(location.lat, location.lng, 18);
    _updateAnalyzeBtn();
  }

  function _estimateDimensions() {
    if (!_map) return { length: 40, width: 30 };
    var bounds = _map.getBounds();
    var ne = bounds.getNorthEast();
    var sw = bounds.getSouthWest();
    var latDiff = Math.abs(ne.lat - sw.lat) * 111320;
    var lngDiff = Math.abs(ne.lng - sw.lng) * 111320 * Math.cos((ne.lat + sw.lat) / 2 * Math.PI / 180);
    var estLength = Math.max(Math.round(lngDiff * 0.3), 20);
    var estWidth = Math.max(Math.round(latDiff * 0.3), 15);
    return { length: Math.min(estLength, 200), width: Math.min(estWidth, 150) };
  }

  function _bindCapture() {
    if (!_els.captureBtn) return;
    _els.captureBtn.addEventListener("click", function () {
      if (_captureInProgress) return;
      _captureInProgress = true;
      _doCapture();
    });
  }

  function _doCapture() {
    if (!_map || !_els.mapContainer) {
      _captureInProgress = false;
      return;
    }

    var mapEl = _els.mapContainer;
    var originalOverflow = mapEl.style.overflow;
    var originalPosition = mapEl.style.position;

    mapEl.style.overflow = "hidden";
    mapEl.style.position = "relative";

    var controls = mapEl.querySelectorAll(".leaflet-control-zoom, .leaflet-control-attribution");
    controls.forEach(function (c) { c.style.display = "none"; });

    if (typeof html2canvas === "undefined") {
      _captureFallback();
      return;
    }

    html2canvas(mapEl, {
      useCORS: true,
      scale: CAPTURE_SCALE,
      allowTaint: false,
      backgroundColor: "#06111f",
      logging: false
    }).then(function (canvas) {
      controls.forEach(function (c) { c.style.display = ""; });
      mapEl.style.overflow = originalOverflow;
      mapEl.style.position = originalPosition;

      canvas.toBlob(function (blob) {
        if (!blob) {
          _captureInProgress = false;
          return;
        }
        _submitCapture(blob);
      }, "image/png");
    }).catch(function () {
      controls.forEach(function (c) { c.style.display = ""; });
      mapEl.style.overflow = originalOverflow;
      mapEl.style.position = originalPosition;
      _captureFallback();
    });
  }

  function _captureFallback() {
    _captureInProgress = false;
    _showError("Map capture unavailable. Switch to Camera Upload mode.");
  }

  function _submitCapture(blob) {
    var dims = _estimateDimensions();
    var fileName = "satellite-capture-" + Date.now() + ".png";
    var file = new File([blob], fileName, { type: "image/png" });

    if (_els.lengthInput) _els.lengthInput.value = dims.length;
    if (_els.widthInput) _els.widthInput.value = dims.width;

    _captureInProgress = false;

    if (typeof window.triggerRoofAnalyze === "function") {
      window._satelliteCaptureMode = true;
      window._satelliteCaptureFile = file;
      window.triggerRoofAnalyze(file);
    } else {
      _showError("Roof analyzer not available. Please use Camera Upload.");
    }
  }

  function _showError(msg) {
    if (typeof showToast === "function") {
      showToast(msg, "error");
    }
  }

  function destroy() {
    if (_map) {
      _map.remove();
      _map = null;
    }
    _isInitialized = false;
    _isMounted = false;
    GSE.ModuleRegistry.markUnmounted("satellite-roof");
  }

  function getMode() {
    return _currentMode;
  }

  function getSelectedLocation() {
    return _selectedLocation;
  }

  GSE.ModuleRegistry.register({
    id: "satellite-roof",
    title: "Satellite Roof Analysis",
    version: "1.0.0",
    module: {
      init: init,
      destroy: destroy,
      getMode: getMode,
      getSelectedLocation: getSelectedLocation
    }
  });

  return {
    init: init,
    destroy: destroy,
    getMode: getMode,
    getSelectedLocation: getSelectedLocation
  };
})();
