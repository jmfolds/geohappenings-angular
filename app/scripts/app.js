var app = angular.module('GeoHappenings', ['leaflet-directive']);
app.controller('MainCtrl', ['$scope', function($scope) {
$scope.selectOnMap = false;
var fb = new Firebase('https://luminous-fire-5575.firebaseio.com/users');
fb.on('value', function (ss) {
	$scope.messages = [];
	$scope.markers = [];
	_.each(ss.val(), function (item) { _.each(item.messages, function (item2) {
			var marker = { lat: parseFloat(item2.lat), lng: parseFloat(item2.lon),
				message: item2.text
			};
			$scope.messages.push(item2);
			$scope.markers.push(marker);
		});
	});
    $scope.$on("leafletDirectiveMap.click", function(evt, args) {
    	if (!$scope.selectOnMap) {
    		console.log('return map click')
    		return;
    	}
    	$scope.userLoc = {lat: args.leafletEvent.latlng.lat, lon: args.leafletEvent.latlng.lng};
			$scope.selectOnMap = false;
   		$('#share-modal').modal('show');
        console.log("Leaflet Event Example #1: click event captured")
    });
	$scope.$broadcast('gotMarkers', $scope.markers) & $scope.initTypeahead();
	$('#search-input').on('typeahead:selected', function (evt, datum, name) {
		$scope.zoomToMsg(datum.lat, datum.lon) & $('#search-modal').modal('hide');
	});
	$scope.messages.sort(function (a, b) { if (a.timeStamp > b.timeStamp) { return 1; }
		if (a.timeStamp < b.timeStamp) { return -1; } return 0;
	}).reverse();//Not sure why we are reversed now...
	_.each($scope.messages, function (msg) {
		var tC = new Date().getTime();
		msg['tE'] = Math.floor((tC - msg.timeStamp) / 1000 / 60);
		msg['timeSince'] = (msg['tE'] > 60) ? Math.floor((msg['tE'] * 60) / 3600)  + 
		' hours ago' :  msg['tE'] + ' minutes ago';
	});
});
$scope.zoomToMsg = function (lat, lng) {
	$scope.$broadcast('updateMap', {lat: lat, lng: lng});
};
$scope.initTypeahead = function () {
	$('#search-input').typeahead('destroy');
	var bloodhound = new Bloodhound({
		datumTokenizer: function(d) { return Bloodhound.tokenizers.whitespace(d.text); },
		queryTokenizer: Bloodhound.tokenizers.whitespace, local: $scope.messages });
	bloodhound.initialize();
    var options = {	displayKey: 'text',	source: bloodhound.ttAdapter(),
		templates: { suggestion: _.template('<strong><%=text%></strong>')}};
    $('#search-input').typeahead(null, options);
};
$scope.getLocation = function () {
	if (navigator.geolocation) {
		$('#loader').modal({show: true, backdrop: false});
		navigator.geolocation.getCurrentPosition(function (p) {
			$scope.userLoc = {};
			$scope.userLoc = {lat: p.coords.latitude, lon: p.coords.longitude};
			$('#loader').modal('hide');
		});
	} else { $('#alert-modal').modal(); }
};
$scope.$watchCollection('[userLoc, msgInput, nameInput]', function(newVals, oldVals) {
	$('#loader').modal('hide');
	if ($('#name-input').val() && $('#message-input').val() && $scope.userLoc) {
	$('.share-message').removeClass('disabled');
	} else { $('.share-message').addClass('disabled') };
   console.log('hey, something has changed!');
});
$scope.mapSelect = function () {
		$scope.selectOnMap = true & $('#share-modal').modal('hide');
};
$scope.saveMsg = function (evt) {
	var loc = $scope.userLoc;
	var exists; var tC = new Date().getTime();
	var name = $scope.nameInput; var text = $scope.msgInput;
	if (!name || !text) { $('#alert-modal').modal(); return; }
	if (!loc || !loc.lat || !loc.lon) {	$('#no-location-modal').modal(); return; };
	fb.on('value', function (ss) {	exists = (ss.val() !== null) });
	if(!exists){ this.fb.child(name).set({text: name}) };
	fb.child(name).child('messages').push({ name: name, text: text,
			lat: loc.lat, lon: loc.lon, timeStamp: tC });
	$('#share-modal').modal('hide'); $('#message-input').val(''); $scope.userLoc = null;
}
}]);
app.controller('MapCtrl', ['$scope', function($scope) {
        angular.extend($scope, {
        	markers: [], center: { lat: 39.226392, lng: -105.488929, zoom: 2 }
        });
		$scope.$on('updateMap', function (evt, obj) {
			$scope.center.lat = parseFloat(obj.lat);
			$scope.center.lng = parseFloat(obj.lng);
			$scope.center.zoom = 15;
			$('#chat-modal').modal('hide');
		});
		$scope.$on('gotMarkers', function (evt, markers) {
			$scope.markers = markers;
		});
    }]
);