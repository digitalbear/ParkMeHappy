// default latitude and longitude values - Surrey Street, Norwich, NR1 3UY
var MY_LATITUDE;
var MY_LONGITUDE;
var GPS = false;
var SEARCH_LATITUDE;
var SEARCH_LONGITUDE;
var CAR_PARK_DATA;
var VEHICLE_CRIME_DATA;

function getCurrentLocation() {
    if ( navigator.geolocation ) {
        function success(pos) {
            // Location found, show map with these coordinates
            MY_LATITUDE = pos.coords.latitude;
            MY_LONGITUDE = pos.coords.longitude;
            console.log("navigator.geolocation success - coordinates: " + MY_LATITUDE + ", " + MY_LONGITUDE);
            GPS = true;
            SEARCH_LATITUDE = MY_LATITUDE;
            SEARCH_LONGITUDE = MY_LONGITUDE;
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
    SEARCH_LATITUDE = searchLat;
    SEARCH_LONGITUDE = searchLong;
    console.log("showSearchLocation - coordinates: " + SEARCH_LATITUDE + ", " + SEARCH_LONGITUDE);
    window.location = "#map-page";
}

function showSampleHeatMap() {
    SEARCH_LATITUDE = 52.63149689873963;
    SEARCH_LONGITUDE = 1.274688242306143;
    window.location = "#map-page";
}

$("#postCodeSearch").submit(function(event) {
    event.preventDefault();
    var $form = $(this),
      postCodeValue = $form.find("input[name='postCode']").val(),
      getUrl = $form.attr("action");
      
    console.log("postCodeValue: " + postCodeValue);
    getUrl += postCodeValue;
    console.log("getUrl: " + getUrl);
    
    $.ajax({
        type: 'GET',
        url: getUrl,
        success: function(obj) {
            console.log("success");
            console.log(JSON.stringify(obj));
            //set global coordinates
            SEARCH_LATITUDE = obj.latitude;
            SEARCH_LONGITUDE = obj.longitude;
            var output = '<h3>Risk</h3>' + 
            	'<p><b>Overall: </b>' + obj.risk.overall + '%</p>' +
            	'<p><b>Overall: </b>' + obj.risk.theft + '%</p>' +
            	'<p><b>Overall: </b>' + obj.risk.vandalism + '%</p>' +
            	'<p><b>Overall: </b>' + obj.risk.otherCrime + '%</p>';
            $('#postCodeResult').html(output);
        },
        error: function() {
            console.log("error getting post code data");
        }
    });
});

function showSampleCrimeMap() {
    SEARCH_LATITUDE = 52.628410;
    SEARCH_LONGITUDE = 1.295111;
    window.location = "#map-page";
}

$("#streetCrime").submit(function(event) {
    event.preventDefault();
    var $form = $(this),
      getUrl = $form.attr("action");

    SEARCH_LATITUDE = 52.628410;
    SEARCH_LONGITUDE = 1.295111;      
    getUrl += '?lat=' + SEARCH_LATITUDE;
    getUrl += '&lng=' + SEARCH_LONGITUDE;
    console.log("getUrl: " + getUrl);
    
    $.ajax({
        type: 'GET',
        url: getUrl,
        success: function(obj) {
            console.log("success");
            STREET_CRIME_DATA = $.grep(obj, function(val, i) {
            	if (val.category == "vehicle-crime") {
            		return true;
            	}
            })
            //console.log(JSON.stringify(STREET_CRIME_DATA));
        },
        error: function() {
            console.log("error getting street crime data");
        }
    });
});

$("#carParkNorwich").submit(function(event) {
    event.preventDefault();
    var $form = $(this),
      getUrl = $form.attr("action");
      
    console.log("getUrl: " + getUrl);
    
    $.ajax({
        type: 'GET',
        url: getUrl,
        success: function(obj) {
            CAR_PARK_DATA = obj.d2LogicalModel.payloadPublication;
        },
        error: function() {
            console.log("error getting car park data");
        }
    });
    
});

function getCarParkName(str) {
	var newStr = str.split(":");
	return newStr[0];
}

function createMarker(latlng, map, title, content) {
	var marker = new google.maps.Marker({
        position: latlng,
        map: map,
        title: title
    });   
	        
    google.maps.event.addListener(marker, 'click', function() {
    	infowindow.setContent(content);
    	infowindow.open(map, this);
    });
    
    return marker;
}

/*
 * Google Maps documentation: https://developers.google.com/maps/documentation/javascript/reference
 */
$( document ).on( "pageshow", "#map-page", function() {
    console.log("page loading");
    console.log("latitude: " + SEARCH_LATITUDE + ", longitude: " + SEARCH_LONGITUDE);

    var searchLatlng = new google.maps.LatLng(SEARCH_LATITUDE, SEARCH_LONGITUDE);

    map = new google.maps.Map(document.getElementById('map-canvas'), {
      center: searchLatlng,
      zoom: 16,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    });
    
    // Create heatmap for showing vehicle claims data
    var heatmapData = plotPointsOnHeatMap();
    var heatmap = new google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        radius: 50,
        dissipating: true,
        maxIntensity: 5,
        opacity: 0.5,
    });
    heatmap.setMap(map);
    
    // Add Car Park Data, if available
    if (typeof CAR_PARK_DATA !== 'undefined' && CAR_PARK_DATA != null) {
    	var latlng;
    	var marker;
    	var infowindow;
    	var contentString;
    	var icon = {url: 'http://maps.google.com/mapfiles/kml/pal4/icon7.png'};
    	$.each(CAR_PARK_DATA.situation, function(i, val) {
    		contentString = '<h4>' + getCarParkName(val.situationRecord.carParkIdentity) + '</h4>' +
    			'<p>Capacity: ' + val.situationRecord.totalCapacity + '</p>' +
    			'<p>Occupancy: ' + val.situationRecord.carParkOccupancy + '%</p>';
    			
    		infowindow = new google.maps.InfoWindow({
    			content: contentString
    		});
    		
	        latlng = new google.maps.LatLng(val.situationRecord.groupOfLocations.locationContainedInGroup.pointByCoordinates.pointCoordinates.latitude, 
				val.situationRecord.groupOfLocations.locationContainedInGroup.pointByCoordinates.pointCoordinates.longitude);
	        marker = new google.maps.Marker({
	            position: latlng,
	            map: map,
	            title: getCarParkName(val.situationRecord.carParkIdentity),
	            icon: icon,
	            html: contentString
	        });  
	        
	        google.maps.event.addListener(marker, 'click', function() {
	        	infowindow.setContent(this.html);
	        	infowindow.open(map, this);
	        });

    	});	
    	
    }
    
    // Add Street Crime Data, if available
    if (typeof STREET_CRIME_DATA !== 'undefined' && STREET_CRIME_DATA != null) {
    	var latlng;
    	var marker;
    	var icon = {url: 'http://maps.google.com/mapfiles/kml/pal3/icon33.png'};
    	$.each(STREET_CRIME_DATA, function(i, val) {
    		
	        latlng = new google.maps.LatLng(val.location.latitude, 
				val.location.longitude);
	        marker = new google.maps.Marker({
	            position: latlng,
	            map: map,
	            title: val.location.street.name,
	            icon: icon
	        });  
    	});
    }    
    
    // Set min and max zoom values
    var opt = { minZoom: 15, maxZoom: 17 };
    map.setOptions(opt);
    
    // Bounds for UK
    var strictBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(48.00, -10.00),
        new google.maps.LatLng(61.00, 2.00)
    );
    
    // Listen for the dragend event
    google.maps.event.addListener(map, 'dragend', function() {
      if (strictBounds.contains(map.getCenter())) return;

      // We're out of bounds - Move the map back within the bounds
      var c = map.getCenter(),
          x = c.lng(),
          y = c.lat(),
          maxX = strictBounds.getNorthEast().lng(),
          maxY = strictBounds.getNorthEast().lat(),
          minX = strictBounds.getSouthWest().lng(),
          minY = strictBounds.getSouthWest().lat();

      if (x < minX) x = minX;
      if (x > maxX) x = maxX;
      if (y < minY) y = minY;
      if (y > maxY) y = maxY;

      map.setCenter(new google.maps.LatLng(y, x));
    });
    
    // Place marker at current GPS position (if GPS known)
    if (GPS) {
        var myLatlng = new google.maps.LatLng(MY_LATITUDE, MY_LONGITUDE);
        var marker = new google.maps.Marker({
            position: myLatlng,
            map: map,
            title:"You are here!"
        });
    }
    
    // Listen for the bounds_changed event
    google.maps.event.addListener(map, 'bounds_changed', function() {
        var currLatlng = map.getBounds();
        var currNorthEast = currLatlng.getNorthEast();
        console.log("currNorthEast: " + currNorthEast);
        var currSouthWest = currLatlng.getSouthWest();
        console.log("currSouthWest: " + currSouthWest);
    });
    
    // Listen for the zoom_changed event
    google.maps.event.addListener(map, 'zoom_changed', function() {
        var currLatlng = map.getBounds();
        var currNorthEast = currLatlng.getNorthEast();
        console.log("zoom - currNorthEast: " + currNorthEast);
        var currSouthWest = currLatlng.getSouthWest();
        console.log("zoom - currSouthWest: " + currSouthWest);
    });

});    

function plotPointsOnHeatMap() {
    return [
        {location: new google.maps.LatLng(52.63149689873963, 1.274688242306143), weight: 2},
        {location: new google.maps.LatLng(52.632106384806896, 1.2747633526365008), weight: 2},
        {location: new google.maps.LatLng(52.63092617166886, 1.2741873801044639), weight: 2},
        {location: new google.maps.LatLng(52.63168252471119, 1.2738300167172816), weight: 2},
        {location: new google.maps.LatLng(52.63048843283799, 1.2744059496586084), weight: 2},
        {location: new google.maps.LatLng(52.631672302752165, 1.2758247299681036), weight: 2},
        {location: new google.maps.LatLng(52.63247598466557, 1.2753822375263988), weight: 2},
        {location: new google.maps.LatLng(52.630943692758215, 1.275829387461496), weight: 2},
        {location: new google.maps.LatLng(52.6326134808408, 1.2739882604736494), weight: 2},
        {location: new google.maps.LatLng(52.63013106088707, 1.2746453011939305), weight: 2},
        {location: new google.maps.LatLng(52.63168252495933, 1.2731796391419645), weight: 2},
        {location: new google.maps.LatLng(52.63176656371372, 1.2730676657881121), weight: 2},
        {location: new google.maps.LatLng(52.63320827300436, 1.274919611749422), weight: 2},
        {location: new google.maps.LatLng(52.63258002964366, 1.273246680490755), weight: 2},
        {location: new google.maps.LatLng(52.629980530139505, 1.2735846205750612), weight: 2},
        {location: new google.maps.LatLng(52.63158702105536, 1.276631325467833), weight: 2},
        {location: new google.maps.LatLng(52.63343673015237, 1.2747888675569437), weight: 2},
        {location: new google.maps.LatLng(52.63343673015237, 1.2747888675569437), weight: 2},
        {location: new google.maps.LatLng(52.63299978956102, 1.27595353496953), weight: 2},
        {location: new google.maps.LatLng(52.63076784435944, 1.2766587597452208), weight: 2},
        {location: new google.maps.LatLng(52.630917602830266, 1.2725460433170193), weight: 2},
        {location: new google.maps.LatLng(52.630917602830266, 1.2725460433170193), weight: 2},
        {location: new google.maps.LatLng(52.63039007689317, 1.276660075174055), weight: 2},
        {location: new google.maps.LatLng(52.62919684075966, 1.2746050546367262), weight: 2},
        {location: new google.maps.LatLng(52.63339145513776, 1.2731742580375958), weight: 2},
        {location: new google.maps.LatLng(52.63382591237881, 1.2753501076424103), weight: 2},
        {location: new google.maps.LatLng(52.632679976026004, 1.2725594092076915), weight: 2},
        {location: new google.maps.LatLng(52.62916664278407, 1.275371382381641), weight: 2},
        {location: new google.maps.LatLng(52.63380877292019, 1.2756444671515181), weight: 2},
        {location: new google.maps.LatLng(52.6330042567494, 1.276766866108492), weight: 2},
        {location: new google.maps.LatLng(52.62897409926647, 1.2742041208592005), weight: 2},
        {location: new google.maps.LatLng(52.63214671997745, 1.2772053104469065), weight: 2},
        {location: new google.maps.LatLng(52.634034393074494, 1.2739909558269198), weight: 2},
        {location: new google.maps.LatLng(52.633770008132224, 1.2760702478654113), weight: 2},
        {location: new google.maps.LatLng(52.62902101591449, 1.2734833859272225), weight: 2},
        {location: new google.maps.LatLng(52.631644517156836, 1.2774781593667581), weight: 2},
        {location: new google.maps.LatLng(52.63171066318366, 1.271836641315719), weight: 2},
        {location: new google.maps.LatLng(52.62982590853648, 1.2723462739533993), weight: 2},
        {location: new google.maps.LatLng(52.63156006589853, 1.2776048745082254), weight: 2},
        {location: new google.maps.LatLng(52.63156006589853, 1.2776048745082254), weight: 2},
        {location: new google.maps.LatLng(52.634297500027444, 1.2758583901856466), weight: 2},
        {location: new google.maps.LatLng(52.63084695547317, 1.2776993479747731), weight: 2},
        {location: new google.maps.LatLng(52.62840540175278, 1.2749302039941828), weight: 2},
        {location: new google.maps.LatLng(52.634590845328695, 1.2740325348706691), weight: 2},
        {location: new google.maps.LatLng(52.631596362609656, 1.2779179965991303), weight: 2},
        {location: new google.maps.LatLng(52.62908134877424, 1.27682827122959), weight: 2},
        {location: new google.maps.LatLng(52.63326492014753, 1.277421978838969), weight: 2},
        {location: new google.maps.LatLng(52.633616641341796, 1.2721859063420624), weight: 2},
        {location: new google.maps.LatLng(52.634759320189815, 1.2750946708920907), weight: 2},
        {location: new google.maps.LatLng(52.63360230527356, 1.2772550487890535), weight: 2},
        {location: new google.maps.LatLng(52.63079642487282, 1.2713988566255108), weight: 2},
        {location: new google.maps.LatLng(52.634318331356916, 1.2728295960760692), weight: 2},
        {location: new google.maps.LatLng(52.63467363428897, 1.275916076410469), weight: 2},
        {location: new google.maps.LatLng(52.63249638124014, 1.2713927346085303), weight: 2},
        {location: new google.maps.LatLng(52.62887985710229, 1.2724086561512173), weight: 2},
        {location: new google.maps.LatLng(52.63351831976682, 1.2718385796673406), weight: 2},
        {location: new google.maps.LatLng(52.62806027687232, 1.27407672922448), weight: 2},
        {location: new google.maps.LatLng(52.63472380981322, 1.276052868964245), weight: 2},
        {location: new google.maps.LatLng(52.62920127176663, 1.277369335587043), weight: 2},
        {location: new google.maps.LatLng(52.63411959879409, 1.277086789746461), weight: 2},
        {location: new google.maps.LatLng(52.634519001255036, 1.2766288467550877), weight: 2},
        {location: new google.maps.LatLng(52.633637849826385, 1.2717440312460673), weight: 2},
        {location: new google.maps.LatLng(52.634961271848624, 1.2733210936537367), weight: 2},
        {location: new google.maps.LatLng(52.63511300874141, 1.2756384951897064), weight: 2},
        {location: new google.maps.LatLng(52.62886756251937, 1.2774035010135383), weight: 2},
        {location: new google.maps.LatLng(52.63119702870138, 1.2708966421174832), weight: 2},
        {location: new google.maps.LatLng(52.635291714161056, 1.274055341850193), weight: 2},
        {location: new google.maps.LatLng(52.63351008099504, 1.2779872481080565), weight: 2},
        {location: new google.maps.LatLng(52.62871095830847, 1.272011756688829), weight: 2},
        {location: new google.maps.LatLng(52.631200619164076, 1.2785683274609398), weight: 2},
        {location: new google.maps.LatLng(52.63291608365039, 1.2783271370269103), weight: 2},
        {location: new google.maps.LatLng(52.62965903747967, 1.2712252671093878), weight: 2},
        {location: new google.maps.LatLng(52.63057277768135, 1.278506573880252), weight: 2},
        {location: new google.maps.LatLng(52.62791787062523, 1.276297877276282), weight: 2},
        {location: new google.maps.LatLng(52.62795583905701, 1.2729752033722583), weight: 2},
        {location: new google.maps.LatLng(52.63215613090549, 1.2706873857207117), weight: 2},
        {location: new google.maps.LatLng(52.63519091094622, 1.2763982269569865), weight: 2},
        {location: new google.maps.LatLng(52.63451985195365, 1.2717211967109734), weight: 2},
        {location: new google.maps.LatLng(52.63485152511496, 1.2720859575225256), weight: 2},
        {location: new google.maps.LatLng(52.627268023067124, 1.2744313793188018), weight: 2},
        {location: new google.maps.LatLng(52.627297805952324, 1.2740049893712302), weight: 2},
        {location: new google.maps.LatLng(52.627381029665656, 1.2735973704013095), weight: 2},
        {location: new google.maps.LatLng(52.62942968374829, 1.2785393015001205), weight: 2},
        {location: new google.maps.LatLng(52.62711544135658, 1.2750702895959405), weight: 2},
        {location: new google.maps.LatLng(52.62713419829973, 1.2756924419982294), weight: 2},
        {location: new google.maps.LatLng(52.629824569605255, 1.2788940194756548), weight: 2},
        {location: new google.maps.LatLng(52.63596768290096, 1.2753032585099453), weight: 2},
        {location: new google.maps.LatLng(52.63547121431057, 1.2724426704589977), weight: 2},
        {location: new google.maps.LatLng(52.62720479120928, 1.2731408127385537), weight: 2},
        {location: new google.maps.LatLng(52.634485496229374, 1.278163697365527), weight: 2},
        {location: new google.maps.LatLng(52.62754298088135, 1.272294055274193), weight: 2},
        {location: new google.maps.LatLng(52.62830176366087, 1.2711978578218517), weight: 2},
        {location: new google.maps.LatLng(52.62830176366087, 1.2711978578218517), weight: 2},
        {location: new google.maps.LatLng(52.62830176366087, 1.2711978578218517), weight: 2},
        {location: new google.maps.LatLng(52.62830176366087, 1.2711978578218517), weight: 2},
        {location: new google.maps.LatLng(52.62830176366087, 1.2711978578218517), weight: 2},
        {location: new google.maps.LatLng(52.62830176366087, 1.2711978578218517), weight: 2},
        {location: new google.maps.LatLng(52.62830176366087, 1.2711978578218517), weight: 2},
        {location: new google.maps.LatLng(52.62830176366087, 1.2711978578218517), weight: 2},
        {location: new google.maps.LatLng(52.62830176366087, 1.2711978578218517), weight: 2},
        {location: new google.maps.LatLng(52.62830176366087, 1.2711978578218517), weight: 2},
        {location: new google.maps.LatLng(52.62830176366087, 1.2711978578218517), weight: 2},
        {location: new google.maps.LatLng(52.62830176366087, 1.2711978578218517), weight: 2},
        {location: new google.maps.LatLng(52.62830176366087, 1.2711978578218517), weight: 2},
        {location: new google.maps.LatLng(52.62830176366087, 1.2711978578218517), weight: 2},
        {location: new google.maps.LatLng(52.62830176366087, 1.2711978578218517), weight: 2},
        {location: new google.maps.LatLng(52.62830176366087, 1.2711978578218517), weight: 2},
        {location: new google.maps.LatLng(52.62830176366087, 1.2711978578218517), weight: 2},
        {location: new google.maps.LatLng(52.62830176366087, 1.2711978578218517), weight: 2},
        {location: new google.maps.LatLng(52.62830176366087, 1.2711978578218517), weight: 2},
        {location: new google.maps.LatLng(52.62830176366087, 1.2711978578218517), weight: 2},
        {location: new google.maps.LatLng(52.62830176366087, 1.2711978578218517), weight: 2},
        {location: new google.maps.LatLng(52.62830176366087, 1.2711978578218517), weight: 2},
        {location: new google.maps.LatLng(52.62830176366087, 1.2711978578218517), weight: 2},
        {location: new google.maps.LatLng(52.62747072729785, 1.2771808045321167), weight: 2},
        {location: new google.maps.LatLng(52.63593995907444, 1.2730542080167915), weight: 2},
        {location: new google.maps.LatLng(52.630934184358935, 1.2794204772184075), weight: 2},
        {location: new google.maps.LatLng(52.63493996586098, 1.2779907459485287), weight: 2},
        {location: new google.maps.LatLng(52.627116227460434, 1.2766665641362882), weight: 2},
        {location: new google.maps.LatLng(52.63519330853122, 1.2779357872072252), weight: 2},
        {location: new google.maps.LatLng(52.635463387865975, 1.277601210567734), weight: 2},
        {location: new google.maps.LatLng(52.63501102357051, 1.2711961407811672), weight: 2},
        {location: new google.maps.LatLng(52.62664913832726, 1.2756709684421814), weight: 2},
        {location: new google.maps.LatLng(52.635664173428765, 1.2719692550316226), weight: 2},
        {location: new google.maps.LatLng(52.62716806715266, 1.2721921641170846), weight: 2},
        {location: new google.maps.LatLng(52.627859946895676, 1.2712387806430556), weight: 2},
        {location: new google.maps.LatLng(52.636325854002386, 1.2760100468870408), weight: 2},
        {location: new google.maps.LatLng(52.62944891035991, 1.2700419192780803), weight: 2},
        {location: new google.maps.LatLng(52.629523475511455, 1.2793740319192275), weight: 2},
        {location: new google.maps.LatLng(52.63373439795599, 1.2793048474181372), weight: 2},
        {location: new google.maps.LatLng(52.62647822116126, 1.2737220725381257), weight: 2},
        {location: new google.maps.LatLng(52.62663851740862, 1.276379596176578), weight: 2},
        {location: new google.maps.LatLng(52.63466578505291, 1.2787980442466662), weight: 2},
        {location: new google.maps.LatLng(52.632832386362885, 1.2797251383894788), weight: 2},
        {location: new google.maps.LatLng(52.634188460387655, 1.279146662130757), weight: 2},
        {location: new google.maps.LatLng(52.62703216663651, 1.2774288266324199), weight: 2},
        {location: new google.maps.LatLng(52.63638172902518, 1.2765907582177738), weight: 2},
        {location: new google.maps.LatLng(52.634810202211185, 1.2787792865622407), weight: 2},
        {location: new google.maps.LatLng(52.636284627960286, 1.2768495881828161), weight: 2},
        {location: new google.maps.LatLng(52.626256699273206, 1.2742523670310928), weight: 2},
        {location: new google.maps.LatLng(52.63603657416225, 1.2773632164739859), weight: 2},
        {location: new google.maps.LatLng(52.62775951571062, 1.2784439191047114), weight: 2},
        {location: new google.maps.LatLng(52.62613798352225, 1.2743173955597957), weight: 2},
        {location: new google.maps.LatLng(52.6298597059096, 1.269496125793805), weight: 2},
        {location: new google.maps.LatLng(52.633213814455566, 1.2799162883322441), weight: 2},
        {location: new google.maps.LatLng(52.635262220906476, 1.278694852204208), weight: 2},
        {location: new google.maps.LatLng(52.63680764661506, 1.2761495537600196), weight: 2},
        {location: new google.maps.LatLng(52.6260629037119, 1.275730610646208), weight: 2},
        {location: new google.maps.LatLng(52.6370267408656, 1.2750572029529168), weight: 2},
        {location: new google.maps.LatLng(52.635708218509045, 1.2710264539482108), weight: 2},
        {location: new google.maps.LatLng(52.6354054121594, 1.2787203500351432), weight: 2},
        {location: new google.maps.LatLng(52.6354054121594, 1.2787203500351432), weight: 2},
        {location: new google.maps.LatLng(52.6354054121594, 1.2787203500351432), weight: 2},
        {location: new google.maps.LatLng(52.628480416681306, 1.2699400941580896), weight: 2},
        {location: new google.maps.LatLng(52.62623629865379, 1.2727137781713262), weight: 2},
        {location: new google.maps.LatLng(52.62589932946729, 1.274166552450171), weight: 2},
        {location: new google.maps.LatLng(52.636663669717706, 1.2722508600501639), weight: 2},
        {location: new google.maps.LatLng(52.627887663508986, 1.2702358083137089), weight: 2},
        {location: new google.maps.LatLng(52.63518193596904, 1.270218474843467), weight: 2},
        {location: new google.maps.LatLng(52.63469838335225, 1.2795691658437665), weight: 2},
        {location: new google.maps.LatLng(52.62933169681682, 1.2801282689862392), weight: 2},
        {location: new google.maps.LatLng(52.633757609441076, 1.2800900324000375), weight: 2},
        {location: new google.maps.LatLng(52.633757609441076, 1.2800900324000375), weight: 2},
        {location: new google.maps.LatLng(52.63538703815935, 1.279058974438944), weight: 2},
        {location: new google.maps.LatLng(52.63538703815935, 1.279058974438944), weight: 2},
        {location: new google.maps.LatLng(52.63538703815935, 1.279058974438944), weight: 2},
        {location: new google.maps.LatLng(52.63538703815935, 1.279058974438944), weight: 2},
        {location: new google.maps.LatLng(52.63538703815935, 1.279058974438944), weight: 2},
        {location: new google.maps.LatLng(52.63538703815935, 1.279058974438944), weight: 2},
        {location: new google.maps.LatLng(52.635848864432624, 1.2786204904158047), weight: 2},
        {location: new google.maps.LatLng(52.626363931088655, 1.277526652197156), weight: 2},
        {location: new google.maps.LatLng(52.63151341706185, 1.2805872026155591), weight: 2},
        {location: new google.maps.LatLng(52.634055419032926, 1.2800531978405925), weight: 2},
        {location: new google.maps.LatLng(52.62720100880984, 1.2788011955497591), weight: 2},
        {location: new google.maps.LatLng(52.63692551895526, 1.2770897027935875), weight: 2},
        {location: new google.maps.LatLng(52.62566353117218, 1.2735873253272085), weight: 2},
        {location: new google.maps.LatLng(52.62961317337906, 1.2803562660420045), weight: 2},
        {location: new google.maps.LatLng(52.63109729713358, 1.280674299509954), weight: 2},
        {location: new google.maps.LatLng(52.637204215496304, 1.2728677765158638), weight: 2},
        {location: new google.maps.LatLng(52.63725924717922, 1.276405071761715), weight: 2},
        {location: new google.maps.LatLng(52.627031709503036, 1.2787441907317414), weight: 2},
        {location: new google.maps.LatLng(52.627031709503036, 1.2787441907317414), weight: 2},
        {location: new google.maps.LatLng(52.627031709503036, 1.2787441907317414), weight: 2},
        {location: new google.maps.LatLng(52.627031709503036, 1.2787441907317414), weight: 2},
        {location: new google.maps.LatLng(52.63022672384103, 1.2806091254243275), weight: 2},
        {location: new google.maps.LatLng(52.6373787888213, 1.2759852975718802), weight: 2},
        {location: new google.maps.LatLng(52.63341531478883, 1.2804339567690421), weight: 2},
        {location: new google.maps.LatLng(52.63642418487358, 1.2711538216103022), weight: 2},
        {location: new google.maps.LatLng(52.63621929084321, 1.278559513029041), weight: 2},
        {location: new google.maps.LatLng(52.62912618157232, 1.2690275494188246), weight: 2},
        {location: new google.maps.LatLng(52.625548463182696, 1.276120760814655), weight: 2},
        {location: new google.maps.LatLng(52.625801373544455, 1.2770559837814595), weight: 2},
        {location: new google.maps.LatLng(52.63704265765621, 1.271880022045104), weight: 2},
        {location: new google.maps.LatLng(52.633273330808905, 1.2806894007497835), weight: 2},
        {location: new google.maps.LatLng(52.62826244669806, 1.2800925807665386), weight: 2},
        {location: new google.maps.LatLng(52.63668527696332, 1.2711437494446243), weight: 2},
        {location: new google.maps.LatLng(52.6367708653884, 1.2781277310094095), weight: 2},
        {location: new google.maps.LatLng(52.62515521506053, 1.2744065486916036), weight: 2},
        {location: new google.maps.LatLng(52.63561505804225, 1.2795934326793974), weight: 2},
        {location: new google.maps.LatLng(52.63717068053, 1.277655018403587), weight: 2},
        {location: new google.maps.LatLng(52.628707204020614, 1.2688928347501036), weight: 2},
        {location: new google.maps.LatLng(52.628018895644765, 1.2801186927736765), weight: 2},
        {location: new google.maps.LatLng(52.62569080476357, 1.2774763164784944), weight: 2},
        {location: new google.maps.LatLng(52.63426671125804, 1.2805420457700367), weight: 2},
        {location: new google.maps.LatLng(52.62543547586705, 1.272402735756725), weight: 2},
        {location: new google.maps.LatLng(52.62890138399101, 1.2687003936832755), weight: 2},
        {location: new google.maps.LatLng(52.631819752086166, 1.2812161731858178), weight: 2},
        {location: new google.maps.LatLng(52.63806540358728, 1.2745730765578238), weight: 2},
        {location: new google.maps.LatLng(52.62753669861489, 1.2799939240002571), weight: 2},
        {location: new google.maps.LatLng(52.6328453527567, 1.2812042817907707), weight: 2},
        {location: new google.maps.LatLng(52.63585423275985, 1.2696477806439235), weight: 2},
        {location: new google.maps.LatLng(52.63218486352026, 1.2813469834772473), weight: 2},
        {location: new google.maps.LatLng(52.63344138134589, 1.2811158771194302), weight: 2},
        {location: new google.maps.LatLng(52.625277555255465, 1.2771350527118681), weight: 2},
        {location: new google.maps.LatLng(52.63535447019936, 1.2691817924312017), weight: 2},
        {location: new google.maps.LatLng(52.6270230973058, 1.279704230690894), weight: 2},
        {location: new google.maps.LatLng(52.63789809705004, 1.2767189502570224), weight: 2},
        {location: new google.maps.LatLng(52.636006687294966, 1.2797410099517967), weight: 2},
        {location: new google.maps.LatLng(52.624965079305, 1.2764022949982667), weight: 2},
        {location: new google.maps.LatLng(52.62925983882671, 1.2810984047764333), weight: 2},
        {location: new google.maps.LatLng(52.62564596420675, 1.2712952270339137), weight: 2},
        {location: new google.maps.LatLng(52.630168335027065, 1.2814176998291755), weight: 2},
        {location: new google.maps.LatLng(52.629094327442715, 1.2682270308538115), weight: 2},
        {location: new google.maps.LatLng(52.62678036369043, 1.279700846236408), weight: 2},
        {location: new google.maps.LatLng(52.624579990744735, 1.2750434068780234), weight: 2},
        {location: new google.maps.LatLng(52.62476643047576, 1.2728552702470297), weight: 2},
        {location: new google.maps.LatLng(52.6331871977183, 1.2815255171147881), weight: 2},
        {location: new google.maps.LatLng(52.63794049996821, 1.277461293576814), weight: 2},
        {location: new google.maps.LatLng(52.63720081890858, 1.278839928482935), weight: 2},
        {location: new google.maps.LatLng(52.63828933137936, 1.276556026121578), weight: 2},
        {location: new google.maps.LatLng(52.63658978117363, 1.2697174558463218), weight: 2},
        {location: new google.maps.LatLng(52.62450980888322, 1.2759544544281727), weight: 2},
        {location: new google.maps.LatLng(52.62479008674586, 1.2723249934501126), weight: 2},
        {location: new google.maps.LatLng(52.62699084138612, 1.28021910814789), weight: 2},
        {location: new google.maps.LatLng(52.62442088043407, 1.2755931152075846), weight: 2},
        {location: new google.maps.LatLng(52.63633996970848, 1.2800468340696305), weight: 2},
        {location: new google.maps.LatLng(52.63828407228678, 1.2721944876895728), weight: 2},
        {location: new google.maps.LatLng(52.63871853499982, 1.275021055273883), weight: 2}
    ];
}
