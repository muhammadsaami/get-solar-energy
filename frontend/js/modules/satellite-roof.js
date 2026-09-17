window.GSE = window.GSE || {};
window.GSE.Modules = window.GSE.Modules || {};

GSE.Modules.SatelliteRoof = (function () {

  var TILE_PROVIDERS = {
    street: {
      name: "OpenStreetMap",
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 20
    },
    satellite: {
      name: "ESRI World Imagery",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "&copy; ESA",
      maxZoom: 20
    }
  };

  var DEFAULT_CENTER = [20.5937, 78.9629];
  var DEFAULT_ZOOM = 5;
  var CAPTURE_ZOOM = 20;
  var MIN_CAPTURE_ZOOM = 17;
  var CAPTURE_SCALE = 2;
  var SEARCH_DEBOUNCE_MS = 350;
  var LOCATION_TIMEOUT_MS = 15000;

  var _map = null;
  var _streetLayer = null;
  var _satLayer = null;
  var _currentTile = "satellite";
  var _marker = null;
  var _currentMode = "camera";
  var _selectedLocation = null;
  var _isInitialized = false;
  var _isMounted = false;
  var _searchTimer = null;
  var _captureInProgress = false;
  var _analysisInProgress = false;
  var _tilesLoaded = false;
  var _tileLoadTimer = null;
  var _capturedBlobUrl = null;
  var _capturedFile = null;

  var _els = {};

  function _q(id) { return document.getElementById(id); }

  function _updateStepIndicator(activeStep) {
    var steps = document.querySelectorAll(".satellite-step");
    var connectors = document.querySelectorAll(".satellite-step-connector");
    steps.forEach(function (s, i) {
      var num = i + 1;
      s.classList.toggle("active", num === activeStep);
      s.classList.toggle("completed", num < activeStep);
    });
    connectors.forEach(function (c, i) {
      c.classList.toggle("completed", i + 1 < activeStep);
    });
  }

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
      analyzeCameraBtn: _q("roofAnalyzeBtn"),
      analyzeSatBtn: _q("roofAnalyzeBtnSatellite"),
      toggleStreet: _q("satelliteToggleStreet"),
      toggleSat: _q("satelliteToggleSat"),
      betaBadge: _q("satelliteBetaBadge"),
      locationLabel: _q("satelliteLocationLabel"),
      captureStatus: _q("satelliteCaptureStatus"),
      previewCard: _q("satellitePreviewCard"),
      previewThumb: _q("satellitePreviewThumb"),
      previewRes: _q("satellitePreviewRes"),
      previewTime: _q("satellitePreviewTime"),
      previewLoc: _q("satellitePreviewLoc"),
      previewStatus: _q("satellitePreviewStatus"),
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
    _bindAnalyzeSatellite();
    _setMode("camera");

    _isInitialized = true;
    _isMounted = true;
    if (GSE.ModuleRegistry && GSE.ModuleRegistry.markMounted) {
      GSE.ModuleRegistry.markMounted("satellite-roof");
    }
  }

  function _setMode(mode) {
    _currentMode = mode;
    var isCamera = mode === "camera";
    var isSatellite = mode === "satellite";

    if (_els.modeCamera) {
      _els.modeCamera.classList.toggle("active", isCamera);
      _els.modeCamera.classList.toggle("btn-primary", isCamera);
      _els.modeCamera.classList.toggle("btn-ghost", !isCamera);
      _els.modeCamera.setAttribute("aria-selected", isCamera ? "true" : "false");
    }
    if (_els.modeSatellite) {
      _els.modeSatellite.classList.toggle("active", isSatellite);
      _els.modeSatellite.classList.toggle("btn-primary", isSatellite);
      _els.modeSatellite.classList.toggle("btn-ghost", !isSatellite);
      _els.modeSatellite.setAttribute("aria-selected", isSatellite ? "true" : "false");
    }
    if (_els.cameraPanel) {
      _els.cameraPanel.classList.toggle("active", isCamera);
    }
    if (_els.satellitePanel) {
      _els.satellitePanel.classList.toggle("active", isSatellite);
    }
    if (_els.betaBadge) {
      _els.betaBadge.style.display = isSatellite ? "inline-flex" : "none";
    }

    if (isSatellite && _map) {
      setTimeout(function () { _map.invalidateSize(); }, 100);
    }
    if (isSatellite) {
      _updateCaptureBtn();
      _updateStepIndicator(1);
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
    if (!_els.mapContainer || typeof L === "undefined") {
      return;
    }

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
      layers: [_satLayer],
      zoomControl: true,
      attributionControl: true
    });

    _currentTile = "satellite";
    if (_els.toggleSat) _els.toggleSat.classList.add("active");
    if (_els.toggleStreet) _els.toggleStreet.classList.remove("active");

    _map.on("tileload", function () {
      _tilesLoaded = true;
      _updateCaptureBtn();
      if (_tileLoadTimer) clearTimeout(_tileLoadTimer);
    });

    _map.on("zoomend", function () {
      _tilesLoaded = false;
      if (_tileLoadTimer) clearTimeout(_tileLoadTimer);
      _tileLoadTimer = setTimeout(function () { _tilesLoaded = true; _updateCaptureBtn(); }, 2000);
      _updateCaptureBtn();
    });

    _map.on("moveend", function () {
      _updateCaptureBtn();
    });
  }

  function _setTileLayer(key) {
    if (!_map) return;
    _currentTile = key;
    _tilesLoaded = false;
    if (key === "satellite") {
      _map.removeLayer(_streetLayer);
      _map.addLayer(_satLayer);
    } else {
      _map.removeLayer(_satLayer);
      _map.addLayer(_streetLayer);
    }
    if (_els.toggleStreet) {
      _els.toggleStreet.classList.toggle("active", key === "street");
      _els.toggleStreet.setAttribute("aria-pressed", key === "street" ? "true" : "false");
    }
    if (_els.toggleSat) {
      _els.toggleSat.classList.toggle("active", key === "satellite");
      _els.toggleSat.setAttribute("aria-pressed", key === "satellite" ? "true" : "false");
    }
    setTimeout(function () { _updateCaptureBtn(); }, 500);
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
    _tilesLoaded = false;
    _map.setView([lat, lng], zoom || CAPTURE_ZOOM, { animate: true, duration: 0.8 });
  }

  function _getZoomLevel() {
    return _map ? _map.getZoom() : 0;
  }

  function _getCaptureValidationMessage() {
    if (!_selectedLocation || !_selectedLocation.lat) {
      return "Search for an address first.";
    }
    if (_captureInProgress) {
      return "Capture already in progress.";
    }
    if (_analysisInProgress) {
      return "Analysis in progress. Please wait.";
    }
    var zoom = _getZoomLevel();
    if (zoom < MIN_CAPTURE_ZOOM) {
      return "Zoom in closer (zoom level " + MIN_CAPTURE_ZOOM + "+) for a usable roof image.";
    }
    if (!_tilesLoaded) {
      return "Map tiles still loading. Please wait.";
    }
    return null;
  }

  function _updateCaptureBtn() {
    if (!_els.captureBtn) return;
    var msg = _getCaptureValidationMessage();
    var disabled = msg !== null;
    _els.captureBtn.disabled = disabled;
    _els.captureBtn.classList.toggle("disabled", disabled);
    if (disabled && _els.captureStatus) {
      _els.captureStatus.textContent = msg;
      _els.captureStatus.style.display = "block";
    } else if (_els.captureStatus) {
      _els.captureStatus.style.display = "none";
    }
  }

  function _bindAddressSearch() {
    if (!_els.addressInput) return;

    _els.addressInput.addEventListener("input", function () {
      var val = _els.addressInput.value.trim();
      if (_searchTimer) clearTimeout(_searchTimer);
      if (val.length < 3) {
        if (_els.addressResults) _els.addressResults.style.display = "none";
        _clearSelection();
        return;
      }
      _searchTimer = setTimeout(function () {
        _performSearch(val);
      }, SEARCH_DEBOUNCE_MS);
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
      if (e.key === "Enter" && _els.addressResults) {
        var first = _els.addressResults.querySelector(".satellite-address-result-item");
        if (first) first.click();
      }
    });
  }

  function _performSearch(query) {
    if (!window.GSE || !window.GSE.Services || !window.GSE.Services.Geocoding) {
      _showToast("Address search unavailable. Enter city manually.", "warning");
      return;
    }
    window.GSE.Services.Geocoding.searchAddress(query)
      .then(function (results) {
        _renderAddressResults(results);
      })
      .catch(function () {
        _showToast("Address search failed. Check your connection and try again.", "error");
      });
  }

  function _renderAddressResults(results) {
    if (!_els.addressResults) return;
    _els.addressResults.innerHTML = "";
    if (!results || results.length === 0) {
      _els.addressResults.style.display = "none";
      if (_els.addressInput && _els.addressInput.value.trim().length >= 3) {
        _showToast("No addresses found. Try a different search term.", "warning");
      }
      return;
    }
    results.forEach(function (r, i) {
      var item = document.createElement("div");
      item.className = "satellite-address-result-item";
      item.textContent = r.label;
      item.setAttribute("role", "option");
      item.setAttribute("tabindex", "0");
      item.addEventListener("click", function () {
        _selectAddressResult(r);
      });
      item.addEventListener("keydown", function (e) {
        if (e.key === "Enter") _selectAddressResult(r);
      });
      _els.addressResults.appendChild(item);
    });
    _els.addressResults.style.display = "block";
  }

  function _clearSelection() {
    _selectedLocation = null;
    _hidePreview();
  }

  function _selectAddressResult(location) {
    _selectedLocation = location;
    if (_els.addressInput) _els.addressInput.value = location.label.split(",")[0];
    if (_els.addressResults) _els.addressResults.style.display = "none";
    if (_els.locationLabel) _els.locationLabel.textContent = location.label;
    if (_els.cityInput) _els.cityInput.value = location.city;
    if (_els.lengthInput) _els.lengthInput.value = "";
    if (_els.widthInput) _els.widthInput.value = "";
    _setTileLayer("satellite");
    _flyTo(location.lat, location.lng, CAPTURE_ZOOM);
    _hidePreview();
    _updateStepIndicator(2);
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
      if (_captureInProgress || _analysisInProgress) return;
      var msg = _getCaptureValidationMessage();
      if (msg) {
        _showToast(msg, "warning");
        return;
      }
      _captureInProgress = true;
      _els.captureBtn.disabled = true;
      _els.captureBtn.textContent = "Capturing...";
      _disableAnalyzeButtons();
      _scheduleTimeout();
      _doCapture();
    });
  }

  function _bindAnalyzeSatellite() {
    if (!_els.analyzeSatBtn) return;
    _els.analyzeSatBtn.addEventListener("click", function () {
      if (_analysisInProgress || !_capturedFile) return;
      _analysisInProgress = true;
      _els.analyzeSatBtn.disabled = true;
      _els.analyzeSatBtn.classList.add("loading");
      _els.analyzeSatBtn.textContent = "Analyzing...";
      _els.captureBtn.disabled = true;
      window._satelliteCaptureMode = true;
      window.triggerRoofAnalyze(_capturedFile);
    });
  }

  function _disableAnalyzeButtons() {
    if (_els.analyzeCameraBtn) { _els.analyzeCameraBtn.disabled = true; }
    if (_els.analyzeSatBtn) { _els.analyzeSatBtn.disabled = true; }
  }

  function _enableAnalyzeButtons() {
    if (_els.analyzeCameraBtn) { _els.analyzeCameraBtn.disabled = false; }
    if (_currentMode === "satellite" && _els.analyzeSatBtn && _capturedFile) {
      _els.analyzeSatBtn.disabled = false;
      _els.analyzeSatBtn.textContent = "Analyze Satellite Capture";
    }
  }

  function _scheduleTimeout() {
    setTimeout(function () {
      if (_captureInProgress) {
        _captureInProgress = false;
        _resetCaptureBtn();
        _enableAnalyzeButtons();
        _showToast("Capture timed out. Please try again.", "error");
      }
    }, LOCATION_TIMEOUT_MS);
  }

  function _resetCaptureBtn() {
    if (_els.captureBtn) {
      _els.captureBtn.disabled = true;
      _els.captureBtn.textContent = "Capture from Satellite";
      _updateCaptureBtn();
    }
  }

  function _doCapture() {
    if (!_map || !_els.mapContainer) {
      _captureInProgress = false;
      _resetCaptureBtn();
      _enableAnalyzeButtons();
      _showToast("Map not available. Switch to Camera Upload.", "error");
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
      controls.forEach(function (c) { c.style.display = ""; });
      mapEl.style.overflow = originalOverflow;
      mapEl.style.position = originalPosition;
      _captureInProgress = false;
      _resetCaptureBtn();
      _enableAnalyzeButtons();
      _showToast("Map capture unavailable. Switch to Camera Upload mode.", "error");
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
          _resetCaptureBtn();
          _enableAnalyzeButtons();
          _showToast("Failed to create image. Try again.", "error");
          return;
        }
        _onCaptureComplete(blob, canvas);
      }, "image/png");
    }).catch(function () {
      controls.forEach(function (c) { c.style.display = ""; });
      mapEl.style.overflow = originalOverflow;
      mapEl.style.position = originalPosition;
      _captureInProgress = false;
      _resetCaptureBtn();
      _enableAnalyzeButtons();
      _showToast("Map capture failed. Switch to Camera Upload mode.", "error");
    });
  }

  function _onCaptureComplete(blob, canvas) {
    var dims = _estimateDimensions();
    var fileName = "satellite-capture-" + Date.now() + ".png";
    _capturedFile = new File([blob], fileName, { type: "image/png" });

    if (_els.lengthInput) _els.lengthInput.value = dims.length;
    if (_els.widthInput) _els.widthInput.value = dims.width;

    _showPreview(canvas, blob);
    _updateStepIndicator(3);
    _captureInProgress = false;
    _resetCaptureBtn();

    if (_els.analyzeSatBtn) {
      _els.analyzeSatBtn.disabled = false;
      _els.analyzeSatBtn.textContent = "Analyze Satellite Capture";
    }
  }

  function _showPreview(canvas, blob) {
    if (!_els.previewCard) return;
    _els.previewCard.style.display = "block";

    if (_els.previewThumb) {
      if (_capturedBlobUrl) URL.revokeObjectURL(_capturedBlobUrl);
      _capturedBlobUrl = URL.createObjectURL(blob);
      _els.previewThumb.src = _capturedBlobUrl;
    }

    if (_els.previewRes) {
      _els.previewRes.textContent = canvas.width + " x " + canvas.height + " px";
    }

    if (_els.previewTime) {
      _els.previewTime.textContent = new Date().toLocaleString();
    }

    if (_els.previewLoc && _selectedLocation) {
      _els.previewLoc.textContent = _selectedLocation.label || _selectedLocation.city || "Unknown";
    }

    if (_els.previewStatus) {
      _els.previewStatus.textContent = "Ready for Analysis";
      _els.previewStatus.className = "badge badge-success badge-sm";
    }
  }

  function _hidePreview() {
    if (_els.previewCard) _els.previewCard.style.display = "none";
    if (_capturedBlobUrl) { URL.revokeObjectURL(_capturedBlobUrl); _capturedBlobUrl = null; }
    _capturedFile = null;
  }

  function onAnalysisComplete() {
    _analysisInProgress = false;
    _resetCaptureBtn();
    _enableAnalyzeButtons();
    if (_els.analyzeSatBtn) {
      _els.analyzeSatBtn.disabled = false;
      _els.analyzeSatBtn.classList.remove("loading");
      _els.analyzeSatBtn.textContent = "Analyze Satellite Capture";
    }
    if (_currentMode === "satellite") _updateCaptureBtn();
  }

  function onAnalysisError() {
    _analysisInProgress = false;
    _resetCaptureBtn();
    _enableAnalyzeButtons();
    if (_els.analyzeSatBtn) {
      _els.analyzeSatBtn.disabled = false;
      _els.analyzeSatBtn.classList.remove("loading");
      _els.analyzeSatBtn.textContent = "Retry Analysis";
    }
    if (_currentMode === "satellite") _updateCaptureBtn();
  }

  function _showToast(msg, type) {
    if (typeof showToast === "function") {
      showToast(msg, type || "info");
    }
  }

  function destroy() {
    if (_map) {
      _map.remove();
      _map = null;
    }
    if (_capturedBlobUrl) {
      URL.revokeObjectURL(_capturedBlobUrl);
      _capturedBlobUrl = null;
    }
    _capturedFile = null;
    _isInitialized = false;
    _isMounted = false;
    if (GSE.ModuleRegistry && GSE.ModuleRegistry.markUnmounted) {
      GSE.ModuleRegistry.markUnmounted("satellite-roof");
    }
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
    version: "3.0.0",
    module: {
      init: init,
      destroy: destroy,
      getMode: getMode,
      getSelectedLocation: getSelectedLocation,
      onAnalysisComplete: onAnalysisComplete,
      onAnalysisError: onAnalysisError
    }
  });

  return {
    init: init,
    destroy: destroy,
    getMode: getMode,
    getSelectedLocation: getSelectedLocation,
    onAnalysisComplete: onAnalysisComplete,
    onAnalysisError: onAnalysisError
  };
})();
