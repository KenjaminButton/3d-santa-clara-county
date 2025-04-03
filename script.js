// Wait for the entire HTML document to be fully loaded and parsed
document.addEventListener('DOMContentLoaded', () => {

  // --- Configuration ---

  // !!! IMPORTANT: Replace this with your actual Mapbox Access Token !!!
  // mapboxgl.accessToken = 'YOUR MAPBOX ACCESS TOKEN HERE';
  mapboxgl.accessToken = MAPBOX_TOKEN;

  // Define the tourist destinations with their coordinates (longitude, latitude)
  // Also adding preferred zoom, pitch (tilt), and bearing (rotation) for flyTo animation
  const destinations = [
      {
          name: "Stanford University",
          coordinates: [-122.1700, 37.4275], // [Longitude, Latitude]
          zoom: 15,
          pitch: 50
      },
      {
          name: "Winchester Mystery House",
          coordinates: [-121.9511, 37.3186],
          zoom: 16.5,
          pitch: 55
      },
      {
          name: "Santana Row",
          coordinates: [-121.9480, 37.3205],
          zoom: 16,
          pitch: 45
      },
      {
          name: "Intel Museum",
          coordinates: [-121.9643, 37.3881],
          zoom: 17,
          pitch: 50,
          bearing: -30 // Example bearing
      },
      {
          name: "California's Great America",
          coordinates: [-121.9740, 37.3978],
          zoom: 15,
          pitch: 40
      },
      {
          name: "Computer History Museum",
          coordinates: [-122.0776, 37.4143],
          zoom: 17,
          pitch: 50
      },
      {
          name: "Levi's Stadium",
          coordinates: [-121.9700, 37.4032],
          zoom: 15.5,
          pitch: 45
      },
      {
          name: "Lick Observatory (Mt. Hamilton)",
          coordinates: [-121.6429, 37.3414],
          zoom: 14, // Zoom out a bit for context
          pitch: 30
      },
       {
          name: "Downtown San Jose",
          coordinates: [-121.8900, 37.3340],
          zoom: 14.5,
          pitch: 45
      },

  ];

  // --- Map Initialization ---

  // Create a new Mapbox GL JS map instance
  const map = new mapboxgl.Map({
      container: 'map', // ID of the div where the map will be rendered
      // Choose a Mapbox style. 'standard' is good for 3D features.
      // Other options: 'mapbox://styles/mapbox/streets-v12', 'satellite-streets-v12'
      style: 'mapbox://styles/mapbox/standard', // Using the newer Standard style
      center: [-121.95, 37.35], // Initial center point (roughly Santa Clara County)
      zoom: 10,                // Initial zoom level
      pitch: 45,               // Initial tilt (0-85 degrees) for a 3D perspective
      bearing: -10             // Initial bearing (rotation)
  });

  // Add navigation controls (zoom buttons, compass) to the map
  map.addControl(new mapboxgl.NavigationControl());

  // Add fullscreen control
  map.addControl(new mapboxgl.FullscreenControl());

  // Add geolocate control to find user's location
  map.addControl(new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true, // Continuously update location
      showUserHeading: true // Show direction user is facing (mobile)
  }));

  // --- 3D Terrain ---

  // Wait for the map style to fully load before adding terrain
  map.on('load', () => {
      console.log("Map style loaded.");

      // Add the Mapbox Terrain Dem source for 3D elevation data
      // 'mapbox-dem' is a tileset provided by Mapbox containing digital elevation model data
      map.addSource('mapbox-dem', {
          'type': 'raster-dem', // Data type is raster digital elevation model
          'url': 'mapbox://mapbox.mapbox-terrain-dem-v1', // URL of the Mapbox terrain tileset
          'tileSize': 512,      // Size of the tiles (pixels)
          'maxzoom': 14         // Max zoom level the terrain data is available at
      });
      console.log("Mapbox DEM source added.");

      // Enable terrain using the added source
      // This tells the map to interpret the elevation data and render the map in 3D
      map.setTerrain({
          'source': 'mapbox-dem',   // Use the source we just added
          'exaggeration': 1.5     // Multiplier for the elevation; 1 is realistic, >1 exaggerates mountains
      });
      console.log("Terrain enabled.");

      // OPTIONAL: Add 3D Buildings (if the style supports it, 'standard' usually does)
      // Find the index of the first symbol layer in the map style
      const layers = map.getStyle().layers;
      let firstSymbolId;
      for (const layer of layers) {
          if (layer.type === 'symbol') {
              firstSymbolId = layer.id;
              break;
          }
      }

      // Check if a symbol layer was found before adding the building layer
      if(firstSymbolId) {
          map.addLayer(
              {
                  'id': '3d-buildings',
                  'source': 'composite', // Source containing building data (often part of default Mapbox styles)
                  'source-layer': 'building', // Specific layer within the source
                  'filter': ['==', 'extrude', 'true'], // Only show buildings with extrusion data
                  'type': 'fill-extrusion', // Type of layer for 3D buildings
                  'minzoom': 14, // Only show buildings at zoom level 14+
                  'paint': {
                      'fill-extrusion-color': '#aaa', // Building color
                      'fill-extrusion-height': [ // Get height from feature properties
                          'interpolate',
                          ['linear'],
                          ['zoom'],
                          14, 0,
                          14.05, ['get', 'height'] // Use actual height property
                      ],
                      'fill-extrusion-base': [ // Get base height from properties (for buildings on hills)
                          'interpolate',
                          ['linear'],
                          ['zoom'],
                          14, 0,
                          14.05, ['get', 'min_height']
                      ],
                      'fill-extrusion-opacity': 0.7 // Slight transparency
                  }
              },
              firstSymbolId // Insert the 3D buildings layer below labels/symbols
          );
          console.log("3D buildings layer added.");
      } else {
          console.log("Could not find a symbol layer to place 3D buildings below.");
      }


      // --- Populate Sidebar & Add Interactivity ---

      // Get the unordered list element from the HTML
      const destinationList = document.getElementById('destination-list');
      destinationList.innerHTML = ''; // Clear the "Loading..." message

      // Loop through each destination in our defined array
      destinations.forEach(destination => {
          // Create a new list item element (<li>)
          const listItem = document.createElement('li');

          // Set the text content of the list item to the destination's name
          listItem.textContent = destination.name;

          // Add an event listener: trigger when the list item is clicked
          listItem.addEventListener('click', () => {
              console.log(`Flying to: ${destination.name}`);

              // Use Mapbox's 'flyTo' function for a smooth animation to the destination
              map.flyTo({
                  center: destination.coordinates, // Target coordinates
                  zoom: destination.zoom || 15,     // Target zoom level (use defined or default)
                  pitch: destination.pitch || 50,    // Target pitch (tilt)
                  bearing: destination.bearing || 0, // Target bearing (rotation)
                  essential: true, // Prioritize this animation if user is interacting
                  duration: 4000   // Animation duration in milliseconds (4 seconds)
              });
          });

          // Append the newly created list item to the destination list in the sidebar
          destinationList.appendChild(listItem);
      });
      console.log("Destination list populated.");
  }); // End of map.on('load')

  // Handle potential map loading errors
  map.on('error', (e) => {
      console.error("Mapbox GL error:", e);
      // You could display a user-friendly message here
      const mapDiv = document.getElementById('map');
      if(mapDiv) {
         mapDiv.innerHTML = '<p style="padding: 20px; text-align: center; color: red;">Could not load map. Please check your internet connection and Mapbox access token.</p>';
      }
  });


}); // End of DOMContentLoaded listener