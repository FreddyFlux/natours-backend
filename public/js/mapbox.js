/* eslint-disable */

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiZnJlZGR5Zmx1eCIsImEiOiJjbTRtYzN1bG8wNm8yMm1xdTA3c3RteG0yIn0.B4lMpJWu3V1WgBG0IiJHcg';

  const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/freddyflux/cm4s49r0i00c201sb9uab5wxr', // style URL
    scrollZoom: false,
    // center: [-118.327759, 34.098907], // starting position [lng, lat]
    // zoom: 9, // starting zoom
    // interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create Marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add Marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounce
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
