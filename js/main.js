// default latitude and longitude values
var latitude = 50.371087;
var longitude = -4.144646;

function getCurrentLocation() {
	if ( navigator.geolocation ) {
		function success(pos) {
			// Location found, show map with these coordinates
			latitude = pos.coords.latitude;
			longitude = pos.coords.longitude;
			console.log("navigator.geolocation success - coordinates: " + latitude + ", " + longitude);
			window.location = "#map-page";
		}
		function fail(error) {
			var errors = {
				1: 'Permission denied - You may need to change your location settings to allow',
				2: 'Position unavailable',
				3: 'Request timeout'
			};
			console.log("Error: " + errors[error.code]);
			$("#errorpopuptext").html(errors[error.code]);
			$("#locationerrorpopup").popup("open");
		}
		// Find the users current position.  Cache the location for 5 minutes, timeout after 6 seconds
		navigator.geolocation.getCurrentPosition(success, fail, {maximumAge: 500000, enableHighAccuracy:false, timeout: 6000});
	} else {
		console.log("navigator.geolocation error");
		$("#errorpopuptext").html("Your device does not appear to have geolocation support");
		$("#locationerrorpopup").popup("open");
	}
}

function showSearchLocation(searchLat, searchLong) {
	latitude = searchLat;
	longitude = searchLong;
	console.log("nshowSearchLocation - coordinates: " + latitude + ", " + longitude);
	window.location = "#map-page";
}

function showDefaultMap() {
	window.location = "#map-page";
}

/*
 * Google Maps documentation: http://code.google.com/apis/maps/documentation/javascript/basics.html
 * Geolocation documentation: http://dev.w3.org/geo/api/spec-source.html
 */
$( document ).on( "pageshow", "#map-page", function() {
	console.log("page loading");
	console.log("latitude: " + latitude + ", longitude: " + longitude);
	/*drawMap(new google.maps.LatLng(latitude, longitude));
	
	function drawMap(currLatLng) {
		var mapOptions = {
			zoom: 7,
			center: currLatLng,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};
		var map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
	}
	*/
	var aviva = new google.maps.LatLng(52.623798, 1.294910);

    map = new google.maps.Map(document.getElementById('map-canvas'), {
      center: aviva,
      zoom: 16,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    });
	
    var heatmapData = [
	  {location: new google.maps.LatLng(52.623798, 1.294910), weight: 20},
      new google.maps.LatLng(52.623798, 1.294910)
    ];

    var heatmap = new google.maps.visualization.HeatmapLayer({
      data: heatmapData
    });
    heatmap.setMap(map);

});	