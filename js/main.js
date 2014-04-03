// default latitude and longitude values - Surrey Street, Norwich, NR1 3UY
var map;
var MY_LATITUDE;
var MY_LONGITUDE;
var GPS = false;
var SEARCH_LATITUDE;
var SEARCH_LONGITUDE;
var MAP_ZOOM = 16;
var HEATMAP_RADIUS = 50;
var searchRadius = 1;

function getCurrentLocation(mapcanvas) {
    if ( navigator.geolocation ) {
        function success(pos) {
            // Location found, show map with these coordinates
            MY_LATITUDE = pos.coords.latitude;
            MY_LONGITUDE = pos.coords.longitude;
            console.log("navigator.geolocation success - coordinates: " + MY_LATITUDE + ", " + MY_LONGITUDE);
            GPS = true;
            SEARCH_LATITUDE = MY_LATITUDE;
            SEARCH_LONGITUDE = MY_LONGITUDE;
            
            var url = 'http://mujtaba-test.apigee.net/v1/parkingrisks/geolocation/latitude/' + SEARCH_LATITUDE +
            	'/longitude/' + SEARCH_LONGITUDE;
            console.log("url: " + url);
		    $.ajax({
		        type: 'GET',
		        url: url,
		        success: function(obj) {
		            console.log("success");
		            //showRiskResult(obj);
		            showMap(mapCanvas);
		        },
		        error: function() {
		            console.log("error getting risk data for coordinates");
		        }
		    });            
            //window.location = "#map-page";
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
            //showRiskResult(obj);
            populateRiskResult(obj.risk);
            showMap('map-canvas-snapshot');
        },
        error: function() {
            console.log("error getting post code data");
        }
    });
});

function showRiskResult(obj) {
	var output = '<h3>Risk</h3>' + 
    	'<p><b>Overall: </b>' + obj.risk.overall + '%</p>' +
    	'<p><b>Overall: </b>' + obj.risk.theft + '%</p>' +
    	'<p><b>Overall: </b>' + obj.risk.vandalism + '%</p>' +
    	'<p><b>Overall: </b>' + obj.risk.otherCrime + '%</p>';
    $('#riskResult').html(output);	
}

function showSampleCrimeMap() {
    SEARCH_LATITUDE = 52.628410;
    SEARCH_LONGITUDE = 1.295111;
    window.location = "#map-page";
}

function getRiskRating(riskValue) {
var result='';
	if(riskValue<=33){
		result = 'LOW';
	}else if(riskValue<=66){
		result = 'MEDIUM';
	}else{
		result = 'HIGH';
	}    
	return result;
}

function populateRiskResult(riskData) {
    overall = getRiskRating(riskData.overall);
	theft = getRiskRating(riskData.theft);
	vandalism = getRiskRating(riskData.vandalism);
	crime = getRiskRating(riskData.otherCrime);

	$('#result').find('#overallRisk').html("Overall parking risk</br></br><strong>"+overall+"</strong>");
	$('#result').find('#overallRisk').removeClass('LOW MEDIUM HIGH').addClass(overall);
	$('#result').find('#theftRisk').html("Theft risk</br></br><strong>"+theft+"</strong>");
	$('#result').find('#theftRisk').removeClass('LOW MEDIUM HIGH').addClass(theft);
	$('#result').find('#vandalismRisk').html("Vandalism risk</br></br><strong>"+vandalism+"</strong>");
	$('#result').find('#vandalismRisk').removeClass('LOW MEDIUM HIGH').addClass(vandalism);
	$('#result').find('#crimeRisk').html("Crime risk</br></br><strong>"+crime+"</strong>");
	$('#result').find('#crimeRisk').removeClass('LOW MEDIUM HIGH').addClass(crime);
	$('#result').show();
		
}

function getCarParkName(str) {
	var newStr = str.split(":");
	return newStr[0];
}

/*
 * Google Maps documentation: https://developers.google.com/maps/documentation/javascript/reference
 */
function showMap(mapCanvas){
    console.log("latitude: " + SEARCH_LATITUDE + ", longitude: " + SEARCH_LONGITUDE);

    var searchLatlng = new google.maps.LatLng(SEARCH_LATITUDE, SEARCH_LONGITUDE);

    map = new google.maps.Map(document.getElementById(mapCanvas), {
      center: searchLatlng,
      zoom: MAP_ZOOM,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    });
    
    // Create heatmap for showing vehicle claims data
    var heatmapData = plotPointsOnHeatMap();
    var heatmap = new google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        radius: HEATMAP_RADIUS,
        dissipating: true,
        //maxIntensity: 5,
        opacity: 0.5,
    });
    heatmap.setMap(map);
    
    // Place marker at search location
    var myLatlng = new google.maps.LatLng(SEARCH_LATITUDE, SEARCH_LONGITUDE);
    var marker = new google.maps.Marker({
        position: myLatlng,
        map: map,
        title:"My Location!",
        icon: getMyLocationIcon()
    });
        
    // Set min and max zoom values
    var opt = { minZoom: 14, maxZoom: 17 };
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
    
    // when tiles have loaded    
    google.maps.event.addListener(map, 'tilesloaded', function() {
        var currBounds = map.getBounds();
        var currNorthEast = currBounds.getNorthEast();
        console.log("tilesloaded - currNorthEast: " + currNorthEast);
        var currSouthWest = currBounds.getSouthWest();
        console.log("tilesloaded - currSouthWest: " + currSouthWest);    

    	getRiskData(heatmapDataCallback, searchRadius);
    	
    	getPoliceDataPoint(policeDataCallback);
    	
    	//getCarParkDataNorwich(carParkDataCallback); // we probably don't need this to be refreshed ever time the tiles are re-loaded
   
    });
    
    // Listen for the zoom_changed event
    google.maps.event.addListener(map, 'zoom_changed', function() {
        var currBounds = map.getBounds();
        var currNorthEast = currBounds.getNorthEast();
        console.log("zoom - currNorthEast: " + currNorthEast);
        var currSouthWest = currBounds.getSouthWest();
        console.log("zoom - currSouthWest: " + currSouthWest);
	    
	    // Change heatmap settings depending on the zoom	    
	    var currZoom = map.getZoom();
	    console.log("current zoom: " + currZoom);
	    switch (currZoom) {
	    	case 14: 
	    		HEATMAP_RADIUS = 15;
	    		searchRadius = 3;
	    		break;
	    	case 15: 
	    		HEATMAP_RADIUS = 25;
	    		searchRadius = 2;
	    		break;
	    	case 17: 
	    		HEATMAP_RADIUS = 100;
	    		searchRadius = 0.5;
	    		break;    		
	    	default: 
	    		HEATMAP_RADIUS = 50;
	    		searchRadius = 1;
	    }	    
	    
	    // if zooming out then get more data
	    if (currZoom < MAP_ZOOM) {
	    	getRiskData(heatmapDataCallback, searchRadius);
	    	
	    	getPoliceDataPoly(policeDataCallback, currNorthEast, currSouthWest);
	    }
	    
	    // manually amend the heatmap radius
	    heatmap.setOptions({radius: HEATMAP_RADIUS});

	    MAP_ZOOM = currZoom;   
    });

	getCarParkDataNorwich(carParkDataCallback);
		
}

$( document ).on( "pageshow", "#map-page", function() {
    console.log("page loading");
		showMap('map-canvas');
}); 

function heatmapDataCallback(heatmapData) {
	if (typeof heatmapData !== 'undefined' && heatmapData != null) {
		console.log("inside heatmapData");
		heatmap.setOptions({data: heatmapData});
	}
}

function carParkDataCallback(carParkData) {
	if (typeof carParkData !== 'undefined' && carParkData != null) {
		console.log("inside carParkData");
		$.each(carParkData.d2LogicalModel.payloadPublication.situation, function(i, val) {
    		contentString = '<h4>' + getCarParkName(val.situationRecord.carParkIdentity) + '</h4>' +
    			'<p>Capacity: ' + val.situationRecord.totalCapacity + '</p>' +
    			'<p>Occupancy: ' + val.situationRecord.carParkOccupancy + '%</p>';
    			
    		infowindow = new google.maps.InfoWindow({
    			content: contentString
    		});
    		
	        var latlng = new google.maps.LatLng(val.situationRecord.groupOfLocations.locationContainedInGroup.pointByCoordinates.pointCoordinates.latitude, 
				val.situationRecord.groupOfLocations.locationContainedInGroup.pointByCoordinates.pointCoordinates.longitude);
	        var marker = new google.maps.Marker({
	            position: latlng,
	            map: map,
	            title: getCarParkName(val.situationRecord.carParkIdentity),
	            icon: getCarParkIcon(),
	            html: contentString
	        });  
	        
	        google.maps.event.addListener(marker, 'click', function() {
	        	infowindow.setContent(this.html);
	        	infowindow.open(map, this);
	        });			
		});
    }
}


function policeDataCallback(streetCrimeData) {
	if (typeof streetCrimeData !== 'undefined' && streetCrimeData.length > 0) {
		console.log("inside streetCrimeData");
		$.each(streetCrimeData, function(i, val) {
			if (val.category == "vehicle-crime") {
			    var latlng = new google.maps.LatLng(val.location.latitude, val.location.longitude);
			    var marker = new google.maps.Marker({
			        position: latlng,
			        map: map,
			        title: val.location.street.name,
			        icon: getStreetCrimeIcon()
			    });	   
			}			
		});
	}
}

function getRiskData(callback, searchRadius) {
    /*var url = 'http://mujtaba-test.apigee.net/v1/postcodesWithinDistanceUsingGeo?lat=' + SEARCH_LATITUDE +
    	'&lng=' + SEARCH_LONGITUDE + '&miles=' + searchRadius + '&format=json';*/
    var url = 'http://mujtaba-test.apigee.net/v1/parkingrisks/georadius/latitude/' + SEARCH_LATITUDE +
    	'/longitude/' + SEARCH_LONGITUDE + '/radius/' + searchRadius;
    console.log("url: " + url);
    
    $.ajax({
        type: 'GET',
        url: url,
        dataType: 'json',        
        success: callback,
        error: function() {
            console.log("error getting risk data within radius");
            return;
        }
     });
}

function getCarParkDataNorwich(callback) {
    var url = 'http://mujtaba-test.apigee.net/v1/carparknorwich/content.xml';
    console.log("url: " + url);
    
    $.ajax({
        type: 'GET',
        url: url,
        dataType: 'json',        
        success: callback,
        error: function() {
            console.log("error getting car park data");
        }
    });
    
}

function getPoliceDataPoint(callback) {	
    var url = 'http://data.police.uk/api/crimes-street/all-crime?lat=' + SEARCH_LATITUDE +
    	'&lng=' + SEARCH_LONGITUDE;
    console.log("url: " + url);
    
    $.ajax({
        type: 'GET',
        url: url,
        dataType: 'json',
        success: callback,
        error: function() {
            console.log("error getting police data from point");
        }
    });
}

function getPoliceDataPoly(callback, northEast, southWest) {
	var latNE = northEast.lat();
	var lngNE = northEast.lng();
	var latSW = southWest.lat();
	var lngSW = southWest.lng();	
    var url = 'http://data.police.uk/api/crimes-street/all-crime?poly=' +
    	latNE + ',' + lngSW + ':' + latNE + ',' + lngNE + ':' + latSW + ',' + lngNE;
    console.log("url: " + url);
    
    $.ajax({
        type: 'GET',
        url: url,
        dataType: 'json',
        success: callback,
        error: function() {
            console.log("error getting police data within polygon");
        }
    });
}

function plotStreetCrimeData(i, obj) {
    var latlng = new google.maps.LatLng(obj.location.latitude, obj.location.longitude);
    var marker = new google.maps.Marker({
        position: latlng,
        map: map,
        title: obj.location.street.name,
        icon: getStreetCrimeIcon()
    });
    console.log("obj.location.street.name: " + obj.location.street.name);
}

function getMyLocationIcon() {
	return {url: 'http://maps.google.com/mapfiles/kml/pal2/icon47.png'};
}

function getCarParkIcon() {
	return {url: 'http://maps.google.com/mapfiles/kml/pal4/icon7.png'};
}

function getStreetCrimeIcon() {
	return {url: 'http://maps.google.com/mapfiles/kml/pal3/icon33.png'};
}

function plotPointsOnHeatMap() {
    return [
        {location: new google.maps.LatLng(52.62442088, 1.275593115  ), weight: 31},
        {location: new google.maps.LatLng(52.62450981, 1.275954454  ), weight: 44},
        {location: new google.maps.LatLng(52.62457999, 1.275043407  ), weight: 34},
        {location: new google.maps.LatLng(52.62476643, 1.27285527 ), weight:  52},
        {location: new google.maps.LatLng(52.62479009, 1.272324993  ), weight: 49},
        {location: new google.maps.LatLng(52.62496508, 1.276402295  ), weight: 22},
        {location: new google.maps.LatLng(52.62515522, 1.274406549  ), weight: 65},
        {location: new google.maps.LatLng(52.62527756, 1.277135053  ), weight: 50},
        {location: new google.maps.LatLng(52.62543548, 1.272402736  ), weight: 27},
        {location: new google.maps.LatLng(52.62554846, 1.276120761  ), weight:  7},
        {location: new google.maps.LatLng(52.62564596, 1.271295227  ), weight: 52},
        {location: new google.maps.LatLng(52.62566353, 1.273587325  ), weight: 73},
        {location: new google.maps.LatLng(52.6256908,  1.277476316  ), weight: 63},
        {location: new google.maps.LatLng(52.62580137, 1.277055984  ), weight: 59},
        {location: new google.maps.LatLng(52.62589933, 1.274166552  ), weight: 65},
        {location: new google.maps.LatLng(52.6260629,  1.275730611  ), weight:  6},
        {location: new google.maps.LatLng(52.62613798, 1.274317396  ), weight: 73},
        {location: new google.maps.LatLng(52.6262363,  1.272713778  ), weight: 37},
        {location: new google.maps.LatLng(52.6262567,  1.274252367  ), weight: 23},
        {location: new google.maps.LatLng(52.62636393, 1.277526652  ), weight: 66},
        {location: new google.maps.LatLng(52.62647822, 1.273722073  ), weight: 20},
        {location: new google.maps.LatLng(52.62663852, 1.276379596  ), weight: 95},
        {location: new google.maps.LatLng(52.62664914, 1.275670968  ), weight:  9},
        {location: new google.maps.LatLng(52.62678036, 1.279700846  ), weight:  8},
        {location: new google.maps.LatLng(52.62699084, 1.280219108  ), weight: 91},
        {location: new google.maps.LatLng(52.6270231,  1.279704231  ), weight: 42},
        {location: new google.maps.LatLng(52.62703171, 1.278744191  ), weight: 41},
        {location: new google.maps.LatLng(52.62703217, 1.277428827  ), weight: 88},
        {location: new google.maps.LatLng(52.62711544, 1.27507029 ), weight:   2},
        {location: new google.maps.LatLng(52.62711623, 1.276666564  ), weight: 65},
        {location: new google.maps.LatLng(52.6271342,  1.275692442  ), weight: 24},
        {location: new google.maps.LatLng(52.62716807, 1.272192164  ), weight: 21},
        {location: new google.maps.LatLng(52.62720101, 1.278801196  ), weight: 11},
        {location: new google.maps.LatLng(52.62720479, 1.273140813  ), weight:  8},
        {location: new google.maps.LatLng(52.62726802, 1.274431379  ), weight: 13},
        {location: new google.maps.LatLng(52.62729781, 1.274004989  ), weight: 49},
        {location: new google.maps.LatLng(52.62738103, 1.27359737 ), weight:  73},
        {location: new google.maps.LatLng(52.62747073, 1.277180805  ), weight:  8},
        {location: new google.maps.LatLng(52.6275367,  1.279993924  ), weight: 39},
        {location: new google.maps.LatLng(52.62754298, 1.272294055  ), weight: 40},
        {location: new google.maps.LatLng(52.62775952, 1.278443919  ), weight: 39},
        {location: new google.maps.LatLng(52.62785995, 1.271238781  ), weight: 87},
        {location: new google.maps.LatLng(52.62788766, 1.270235808  ), weight: 58},
        {location: new google.maps.LatLng(52.62791787, 1.276297877  ), weight: 78},
        {location: new google.maps.LatLng(52.62795584, 1.272975203  ), weight: 52},
        {location: new google.maps.LatLng(52.6280189,  1.280118693  ), weight: 86},
        {location: new google.maps.LatLng(52.62806028, 1.274076729  ), weight: 67},
        {location: new google.maps.LatLng(52.62826245, 1.280092581  ), weight: 25},
        {location: new google.maps.LatLng(52.62830176, 1.271197858  ), weight: 78},
        {location: new google.maps.LatLng(52.6284054,  1.274930204  ), weight:  2},
        {location: new google.maps.LatLng(52.62848042, 1.269940094  ), weight:  0},
        {location: new google.maps.LatLng(52.6287072,  1.268892835  ), weight: 28},
        {location: new google.maps.LatLng(52.62871096, 1.272011757  ), weight: 17},
        {location: new google.maps.LatLng(52.62886756, 1.277403501  ), weight: 35},
        {location: new google.maps.LatLng(52.62887986, 1.272408656  ), weight: 86},
        {location: new google.maps.LatLng(52.62890138, 1.268700394  ), weight:  3},
        {location: new google.maps.LatLng(52.6289741,  1.274204121  ), weight: 41},
        {location: new google.maps.LatLng(52.62902102, 1.273483386  ), weight: 33},
        {location: new google.maps.LatLng(52.62908135, 1.276828271  ), weight: 82},
        {location: new google.maps.LatLng(52.62909433, 1.268227031  ), weight: 70},
        {location: new google.maps.LatLng(52.62912618, 1.269027549  ), weight: 75},
        {location: new google.maps.LatLng(52.62916664, 1.275371382  ), weight: 13},
        {location: new google.maps.LatLng(52.62919684, 1.274605055  ), weight: 50},
        {location: new google.maps.LatLng(52.62920127, 1.277369336  ), weight: 93},
        {location: new google.maps.LatLng(52.62925984, 1.281098405  ), weight: 84},
        {location: new google.maps.LatLng(52.6293317,  1.280128269  ), weight: 82},
        {location: new google.maps.LatLng(52.62942968, 1.278539302  ), weight: 93},
        {location: new google.maps.LatLng(52.62944891, 1.270041919  ), weight: 19},
        {location: new google.maps.LatLng(52.62952348, 1.279374032  ), weight: 40},
        {location: new google.maps.LatLng(52.62961317, 1.280356266  ), weight: 62},
        {location: new google.maps.LatLng(52.62965904, 1.271225267  ), weight: 52},
        {location: new google.maps.LatLng(52.62982457, 1.278894019  ), weight: 40},
        {location: new google.maps.LatLng(52.62982591, 1.272346274  ), weight: 62},
        {location: new google.maps.LatLng(52.62985971, 1.269496126  ), weight: 61},
        {location: new google.maps.LatLng(52.62998053, 1.273584621  ), weight: 46},
        {location: new google.maps.LatLng(52.63013106, 1.274645301  ), weight: 53},
        {location: new google.maps.LatLng(52.63016834, 1.2814177), weight:   77},
        {location: new google.maps.LatLng(52.63022672, 1.280609125  ), weight: 91},
        {location: new google.maps.LatLng(52.63039008, 1.276660075  ), weight:  0},
        {location: new google.maps.LatLng(52.63048843, 1.27440595 ), weight:  59},
        {location: new google.maps.LatLng(52.63057278, 1.278506574  ), weight: 65},
        {location: new google.maps.LatLng(52.63076784, 1.27665876 ), weight:  87},
        {location: new google.maps.LatLng(52.63079642, 1.271398857  ), weight: 88},
        {location: new google.maps.LatLng(52.63084696, 1.277699348  ), weight: 93},
        {location: new google.maps.LatLng(52.6309176,  1.272546043  ), weight: 60},
        {location: new google.maps.LatLng(52.63092617, 1.27418738 ), weight:  73},
        {location: new google.maps.LatLng(52.63093418, 1.279420477  ), weight:  4},
        {location: new google.maps.LatLng(52.63094369, 1.275829387  ), weight: 93},
        {location: new google.maps.LatLng(52.6310973,  1.2806743), weight:   43},
        {location: new google.maps.LatLng(52.63119703, 1.270896642  ), weight: 66},
        {location: new google.maps.LatLng(52.63120062, 1.278568327  ), weight: 83},
        {location: new google.maps.LatLng(52.6314969,  1.274688242  ), weight: 82},
        {location: new google.maps.LatLng(52.63151342, 1.280587203  ), weight: 72},
        {location: new google.maps.LatLng(52.63156007, 1.277604875  ), weight: 48},
        {location: new google.maps.LatLng(52.63158702, 1.276631325  ), weight: 13},
        {location: new google.maps.LatLng(52.63159636, 1.277917997  ), weight: 79},
        {location: new google.maps.LatLng(52.63164452, 1.277478159  ), weight: 81},
        {location: new google.maps.LatLng(52.6316723,  1.27582473 ), weight:  47},
        {location: new google.maps.LatLng(52.63168252, 1.273830017  ), weight:  0},
        {location: new google.maps.LatLng(52.63168252, 1.273179639  ), weight: 96},
        {location: new google.maps.LatLng(52.63171066, 1.271836641  ), weight: 66},
        {location: new google.maps.LatLng(52.63176656, 1.273067666  ), weight: 76},
        {location: new google.maps.LatLng(52.63181975, 1.281216173  ), weight: 61},
        {location: new google.maps.LatLng(52.63210638, 1.274763353  ), weight: 33},
        {location: new google.maps.LatLng(52.63214672, 1.27720531 ), weight:  53},
        {location: new google.maps.LatLng(52.63215613, 1.270687386  ), weight: 73},
        {location: new google.maps.LatLng(52.63218486, 1.281346983  ), weight: 69},
        {location: new google.maps.LatLng(52.63247598, 1.275382238  ), weight: 22},
        {location: new google.maps.LatLng(52.63249638, 1.271392735  ), weight: 27},
        {location: new google.maps.LatLng(52.63258003, 1.27324668 ), weight:  66},
        {location: new google.maps.LatLng(52.63261348, 1.27398826 ), weight:  82},
        {location: new google.maps.LatLng(52.63267998, 1.272559409  ), weight: 94},
        {location: new google.maps.LatLng(52.63283239, 1.279725138  ), weight: 51},
        {location: new google.maps.LatLng(52.63284535, 1.281204282  ), weight: 42},
        {location: new google.maps.LatLng(52.63291608, 1.278327137  ), weight: 71},
        {location: new google.maps.LatLng(52.63299979, 1.275953535  ), weight: 35},
        {location: new google.maps.LatLng(52.63300426, 1.276766866  ), weight: 68},
        {location: new google.maps.LatLng(52.6331872,  1.281525517  ), weight: 55},
        {location: new google.maps.LatLng(52.63320827, 1.274919612  ), weight: 96},
        {location: new google.maps.LatLng(52.63321381, 1.279916288  ), weight: 62},
        {location: new google.maps.LatLng(52.63326492, 1.277421979  ), weight: 19},
        {location: new google.maps.LatLng(52.63327333, 1.280689401  ), weight: 94},
        {location: new google.maps.LatLng(52.63339146, 1.273174258  ), weight: 42},
        {location: new google.maps.LatLng(52.63341531, 1.280433957  ), weight: 39},
        {location: new google.maps.LatLng(52.63343673, 1.274788868  ), weight: 88},
        {location: new google.maps.LatLng(52.63344138, 1.281115877  ), weight: 58},
        {location: new google.maps.LatLng(52.63351008, 1.277987248  ), weight: 72},
        {location: new google.maps.LatLng(52.63351832, 1.27183858 ), weight:  85},
        {location: new google.maps.LatLng(52.63360231, 1.277255049  ), weight: 50},
        {location: new google.maps.LatLng(52.63361664, 1.272185906  ), weight: 59},
        {location: new google.maps.LatLng(52.63363785, 1.271744031  ), weight: 40},
        {location: new google.maps.LatLng(52.6337344,  1.279304847  ), weight: 48},
        {location: new google.maps.LatLng(52.63375761, 1.280090032  ), weight:  0},
        {location: new google.maps.LatLng(52.63377001, 1.276070248  ), weight:  2},
        {location: new google.maps.LatLng(52.63380877, 1.275644467  ), weight: 44},
        {location: new google.maps.LatLng(52.63382591, 1.275350108  ), weight:  1},
        {location: new google.maps.LatLng(52.63403439, 1.273990956  ), weight:  9},
        {location: new google.maps.LatLng(52.63405542, 1.280053198  ), weight: 31},
        {location: new google.maps.LatLng(52.6341196,  1.27708679 ), weight:  67},
        {location: new google.maps.LatLng(52.63418846, 1.279146662  ), weight: 66},
        {location: new google.maps.LatLng(52.63426671, 1.280542046  ), weight: 20},
        {location: new google.maps.LatLng(52.6342975,  1.27585839 ), weight:  83},
        {location: new google.maps.LatLng(52.63431833, 1.272829596  ), weight: 95},
        {location: new google.maps.LatLng(52.6344855,  1.278163697  ), weight: 36},
        {location: new google.maps.LatLng(52.634519,   1.276628847  ), weight: 88},
        {location: new google.maps.LatLng(52.63451985, 1.271721197  ), weight: 11},
        {location: new google.maps.LatLng(52.63459085, 1.274032535  ), weight: 25},
        {location: new google.maps.LatLng(52.63466579, 1.278798044  ), weight: 80},
        {location: new google.maps.LatLng(52.63467363, 1.275916076  ), weight: 60},
        {location: new google.maps.LatLng(52.63469838, 1.279569166  ), weight: 91},
        {location: new google.maps.LatLng(52.63472381, 1.276052869  ), weight: 28},
        {location: new google.maps.LatLng(52.63475932, 1.275094671  ), weight: 46},
        {location: new google.maps.LatLng(52.6348102,  1.278779287  ), weight: 92},
        {location: new google.maps.LatLng(52.63485153, 1.272085958  ), weight: 59},
        {location: new google.maps.LatLng(52.63493997, 1.277990746  ), weight:  7},
        {location: new google.maps.LatLng(52.63496127, 1.273321094  ), weight: 10},
        {location: new google.maps.LatLng(52.63501102, 1.271196141  ), weight: 61},
        {location: new google.maps.LatLng(52.63511301, 1.275638495  ), weight: 84},
        {location: new google.maps.LatLng(52.63518194, 1.270218475  ), weight: 84},
        {location: new google.maps.LatLng(52.63519091, 1.276398227  ), weight: 82},
        {location: new google.maps.LatLng(52.63519331, 1.277935787  ), weight: 57},
        {location: new google.maps.LatLng(52.63526222, 1.278694852  ), weight: 48},
        {location: new google.maps.LatLng(52.63529171, 1.274055342  ), weight: 53},
        {location: new google.maps.LatLng(52.63535447, 1.269181792  ), weight: 17},
        {location: new google.maps.LatLng(52.63538704, 1.279058974  ), weight: 89},
        {location: new google.maps.LatLng(52.63540541, 1.27872035 ), weight:   3},
        {location: new google.maps.LatLng(52.63546339, 1.277601211  ), weight: 12},
        {location: new google.maps.LatLng(52.63547121, 1.27244267 ), weight:  26},
        {location: new google.maps.LatLng(52.63561506, 1.279593433  ), weight: 34},
        {location: new google.maps.LatLng(52.63566417, 1.271969255  ), weight: 92},
        {location: new google.maps.LatLng(52.63570822, 1.271026454  ), weight: 64},
        {location: new google.maps.LatLng(52.63584886, 1.27862049 ), weight:   4},
        {location: new google.maps.LatLng(52.63585423, 1.269647781  ), weight: 77},
        {location: new google.maps.LatLng(52.63593996, 1.273054208  ), weight: 42},
        {location: new google.maps.LatLng(52.63596768, 1.275303259  ), weight: 32},
        {location: new google.maps.LatLng(52.63600669, 1.27974101 ), weight:  10},
        {location: new google.maps.LatLng(52.63603657, 1.277363216  ), weight: 32},
        {location: new google.maps.LatLng(52.63621929, 1.278559513  ), weight: 95},
        {location: new google.maps.LatLng(52.63628463, 1.276849588  ), weight: 95},
        {location: new google.maps.LatLng(52.63632585, 1.276010047  ), weight:  0},
        {location: new google.maps.LatLng(52.63633997, 1.280046834  ), weight: 68},
        {location: new google.maps.LatLng(52.63638173, 1.276590758  ), weight:  7},
        {location: new google.maps.LatLng(52.63642418, 1.271153822  ), weight: 38},
        {location: new google.maps.LatLng(52.63658978, 1.269717456  ), weight: 74},
        {location: new google.maps.LatLng(52.63666367, 1.27225086 ), weight:   8},
        {location: new google.maps.LatLng(52.63668528, 1.271143749  ), weight: 37},
        {location: new google.maps.LatLng(52.63677087, 1.278127731  ), weight: 77},
        {location: new google.maps.LatLng(52.63680765, 1.276149554  ), weight: 95},
        {location: new google.maps.LatLng(52.63692552, 1.277089703  ), weight: 97},
        {location: new google.maps.LatLng(52.63702674, 1.275057203  ), weight: 72},
        {location: new google.maps.LatLng(52.63704266, 1.271880022  ), weight:  0},
        {location: new google.maps.LatLng(52.63717068, 1.277655018  ), weight: 50},
        {location: new google.maps.LatLng(52.63720082, 1.278839928  ), weight: 99},
        {location: new google.maps.LatLng(52.63720422, 1.272867777  ), weight: 77},
        {location: new google.maps.LatLng(52.63725925, 1.276405072  ), weight: 50},
        {location: new google.maps.LatLng(52.63737879, 1.275985298  ), weight: 52},
        {location: new google.maps.LatLng(52.6378981,  1.27671895 ), weight:  89},
        {location: new google.maps.LatLng(52.6379405,  1.277461294  ), weight: 12},
        {location: new google.maps.LatLng(52.6380654,  1.274573077  ), weight: 30},
        {location: new google.maps.LatLng(52.63828407, 1.272194488  ), weight: 44},
        {location: new google.maps.LatLng(52.63828933, 1.276556026  ), weight: 60},
        {location: new google.maps.LatLng(52.63871853, 1.275021055  ), weight: 10}        
    ];
}
