(function() {
  var Mapping;

  Mapping = (function() {

    function Mapping() {
      if ($('#map').length === 1 && GBrowserIsCompatible()) {
        this.icon = new GIcon(G_DEFAULT_ICON);
        this.mapListing = $('#map-pub-listing');
        this.markers = [];
        this.clustering_on = true;
        this.showMap();
      }
    }

    Mapping.prototype.showMap = function() {
      this.map = new GMap2($('#map')[0]);
      this.map.setCenter(new GLatLng(54, -1), 6);
      this.map.addControl(new GLargeMapControl());
      this.addPubsToMap();
      this.centerToParams();
      return this.addMapListeners();
    };

    Mapping.prototype.addPubsToMap = function() {
      var _this = this;
      return $.getJSON('/pubs.json', function(pubs) {
        var pub, _i, _len;
        for (_i = 0, _len = pubs.length; _i < _len; _i++) {
          pub = pubs[_i];
          _this.addPubToMap(pub);
        }
        return _this.markerCluster = new MarkerClusterer(_this.map, _this.markers, {
          gridSize: 80,
          maxZoom: 14
        });
      });
    };

    Mapping.prototype.addPubToMap = function(json) {
      var location, marker, pub;
      pub = json.pub;
      location = new GLatLng(pub.lat, pub.lng);
      marker = this.createMarker(location, pub.id);
      return this.markers.push(marker);
    };

    Mapping.prototype.centerToParams = function() {
      if ($.query.get('lat') && $.query.get('lng')) {
        return this.map.setCenter(new GLatLng($.query.get('lat'), $.query.get('lng')), 16);
      }
    };

    Mapping.prototype.createMarker = function(location, pubId, number) {
      var icon, marker,
        _this = this;
      if (number) {
        icon = this.numberedIcon(number);
      }
      marker = new GMarker(location, icon);
      GEvent.addListener(marker, "click", function() {
        return _this.openPubMarkerInfo(marker, pubId);
      });
      return marker;
    };

    Mapping.prototype.addMapListeners = function() {
      var _this = this;
      GEvent.addListener(this.map, "zoomend", function() {
        return _this.map.clearOverlays();
      });
      return GEvent.addListener(this.map, "moveend", function(overlay, point) {
        var curzoom;
        curzoom = _this.map.getZoom();
        if (curzoom >= 14) {
          if (_this.clustering_on) {
            _this.markerCluster.turn_off();
            _this.map.clearOverlays();
            _this.clustering_on = false;
          }
          return _this.updateNonClusteredMarkers();
        } else {
          if (!_this.clustering_on) {
            _this.mapListing.html('');
            _this.clustering_on = true;
            return _this.markerCluster.turn_back_on();
          }
        }
      });
    };

    Mapping.prototype.openPubMarkerInfo = function(marker, id) {
      return $.get("/pubs/" + id + "/map_marker_html", function(html) {
        return marker.openInfoWindowHtml(html);
      });
    };

    Mapping.prototype.numberedIcon = function(number) {
      var icon;
      icon = new GIcon();
      icon.image = "/assets/markers/marker" + number + ".png";
      icon.iconSize = new GSize(20, 34);
      icon.iconAnchor = new GPoint(16, 32);
      icon.infoWindowAnchor = new GPoint(16, 0);
      return icon;
    };

    Mapping.prototype.updateNonClusteredMarkers = function() {
      var bounds, northEast, southWest;
      bounds = this.map.getBounds();
      southWest = bounds.getSouthWest();
      northEast = bounds.getNorthEast();
      return $.ajax({
        type: 'GET',
        url: '/pubs.js',
        dataType: 'script',
        data: {
          min_lat: southWest.lat(),
          max_lat: northEast.lat(),
          min_lng: southWest.lng(),
          max_lng: northEast.lng()
        }
      });
    };

    return Mapping;

  })();

  $(document).ready(function() {
    return window.mapping = new Mapping;
  });

}).call(this);
