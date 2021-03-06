var coordinates;
var map;
var infowindow;
var searchResults = [];
var markers = [];
const DEFAULT_RADIUS = 500;
const ALLOW_LOCAL_SEARCH = true;
const SYSTEM_MESSAGES = [
  "SUGGESTION NGA EH!",
  "WAG KANG ASSUMING!",
  "EDI IKAW NA!",
  "PAASA!",
  "BAHALA KA JAN!",
  "KAKAKAIN KO LANG JAN EH!",
  "YAN YAN!",
  "HUWAG MO IPASOK JAN!",
  "AYOKO NG MAKAPAL KASI MAKALAT!",
  "NALIGO NA KAYO?... TARA! LAHAT SABAY",
  "SANA MAGANDA NGA…… (REVEALS CARD) ONGA, MAGANDA AKO",
  "D NA AKO AASA SA SHWARMA MO",
  "KUNG MERON LANG AKONG UNLI BANG, BABANG KITA PALAGI",
  "NAKAKAUBOS NG BRAINCELLS",
  "PANO KA MAGIGING MASAYA, NAKATINGIN KA LANG",
  "BARIL-BARILAN. GUSTO KO YON. DALAWANG PUTOK.",
  "HINDI BA PWEDE MABILIS LANG?",
  "KELANGAN NG DISCARTI PARA TUMIRA SA MAKATEEEE"
];
const SHOULD_SHOW_SYSTEM_MESSAGE = false;


function finishedLoadingGoogleMaps() {
  navigator.geolocation.getCurrentPosition(initMap, geolocationError);
}

function initMap(position) {
  coordinates = {
    lat: position.coords.latitude,
    lng: position.coords.longitude
  };

  map = new google.maps.Map(document.getElementById('map'), {
    center: coordinates,
    zoom: 16
  });

  infowindow = new google.maps.InfoWindow();

  createMarker(coordinates, 'You are here or at least we think you are');
  mapInitialized();
}

function mapInitialized() {
  enableMaghanapButton();
}

function createMarker(coordinates, placeName, icon = null) {
  var marker = new google.maps.Marker({
    map: map,
    position: coordinates,
    icon: icon
  });

  google.maps.event.addListener(marker, 'click', function() {
    infowindow.setContent(placeName);
    infowindow.open(map, this);
  });

  markers.push(marker);
}

function geolocationError() {
  alert('You need to allow your browser to access your location!');
}

function enableMaghanapButton() {
  button = document.getElementById('maghanap-button');
  button.addEventListener('click', searchNearby);
  button.disabled = false;
}

function enablePumiliButton() {
  button = document.getElementById('pumili-button');
  button.addEventListener('click', chooseFromResults);
  button.disabled = false;
}

function chooseFromResults() {
  hideMarkers();
  showRandomMarker();
  if (SHOULD_SHOW_SYSTEM_MESSAGE) {
    addSystemMessage();
  }
}

function addSystemMessage() {
  button = document.getElementById('pumili-button');
  var currentCount = parseInt(button.getAttribute('data-count'));
  if (currentCount >= 1) {
    message = SYSTEM_MESSAGES[Math.floor(Math.random() * SYSTEM_MESSAGES.length)]
    container = document.getElementById('system-message');
    container.innerHTML = message;
  }

  button.setAttribute('data-count', currentCount + 1);
}

function searchNearby() {
  console.log('searching nearby...');

  data = readFromLocalStorage();

  if (data != null && ALLOW_LOCAL_SEARCH) {
    console.log('creating markers from local...');
    createMarkersForPlaces(data.places);
  } else {
    console.log('querying to google...');
    queryToGoogle();
  }

  enablePumiliButton();
}

function createMarkersForPlaces(places) {
  var place;
  for (var i = 0; i < places.length; i++) {
    place = places[i]
    createMarker(place.location, place.name, place.icon);
  }
}

function queryToGoogle() {
  var service = new google.maps.places.PlacesService(map);
  service.nearbySearch({
    location: coordinates,
    radius: DEFAULT_RADIUS,
    type: ['restaurant']
  }, onGoogleQueryFinish);
}

function onGoogleQueryFinish(results, status, pagination) {
  if (status === google.maps.places.PlacesServiceStatus.OK) {
    var place;
    var places = [];

    searchResults = searchResults.concat(results);

    if (pagination.hasNextPage) {
      pagination.nextPage();
    } else {
      for (var i = 0; i < searchResults.length; i++) {
        place = searchResults[i];
        places.push({
          location: place.geometry.location,
          name: place.name,
          icon: place.icon
        });
      }
      createMarkersForPlaces(places);
      saveToLocalStorage(places);
    }
  }
  else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
    alert('Search returned 0 results! Please try a different search parameter.');
  }
}

function readFromLocalStorage() {
  return JSON.parse(window.localStorage.getItem('ikawBahala:' + DEFAULT_RADIUS));
}

function saveToLocalStorage(places) {
  placesHash = {
    createdAt: Date.now(),
    places: places
  };
  window.localStorage.setItem('ikawBahala:' + DEFAULT_RADIUS, JSON.stringify(placesHash));
}

function hideMarkers() {
  for (var i = 1; i < markers.length; i++) {
    markers[i].setMap(null);
  }
}

function showMarkers() {
  for (var i = 1; i < markers.length; i++) {
    markers[i].setMap(map);
  }
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function showRandomMarker() {
  marker = markers[getRandomInt(1, markers.length)];
  marker.setMap(map);
  center = new google.maps.LatLng(marker.position.lat(), marker.position.lng());
  map.panTo(center);
  google.maps.event.trigger(marker, 'click');
}
