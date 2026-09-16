window.GSE = window.GSE || {};
window.GSE.Services = window.GSE.Services || {};

GSE.Services.Geocoding = (function () {
  var PROVIDER = {
    name: "Nominatim",
    baseUrl: "https://nominatim.openstreetmap.org",
    params: {
      format: "json",
      limit: 5,
      "accept-language": "en"
    }
  };

  function encodeParams(obj) {
    var parts = [];
    for (var k in obj) {
      if (obj.hasOwnProperty(k)) {
        parts.push(encodeURIComponent(k) + "=" + encodeURIComponent(obj[k]));
      }
    }
    return parts.join("&");
  }

  function extractCity(result) {
    var addr = result.address || {};
    return addr.city || addr.town || addr.village || addr.county || addr.state || "";
  }

  function searchAddress(query) {
    if (!query || query.trim().length < 3) {
      return Promise.resolve([]);
    }
    var url = PROVIDER.baseUrl + "/search?" + encodeParams({
      q: query.trim(),
      format: PROVIDER.params.format,
      limit: PROVIDER.params.limit,
      "accept-language": PROVIDER.params["accept-language"]
    });
    return fetch(url, {
      headers: { "User-Agent": "GETSolarEnergy/1.0" }
    })
      .then(function (r) {
        if (!r.ok) throw new Error("Geocoding request failed: " + r.status);
        return r.json();
      })
      .then(function (results) {
        if (!Array.isArray(results)) return [];
        return results.map(function (r) {
          return {
            label: r.display_name || "",
            lat: parseFloat(r.lat) || 0,
            lng: parseFloat(r.lon) || 0,
            city: extractCity(r),
            bbox: r.boundingbox || null
          };
        });
      })
      .catch(function (err) {
        console.error("Geocoding error:", err);
        return [];
      });
  }

  return {
    searchAddress: searchAddress
  };
})();
