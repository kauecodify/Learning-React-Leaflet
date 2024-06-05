import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const getCoordinates = async (address) => {
  const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json`);
  const data = await response.json();
  if (data.length > 0) {
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } else {
    return null;
  }
};

const initialZones = {
  norte: { center: [-23.490, -46.650], radius: 5000 },
  sul: { center: [-23.650, -46.650], radius: 5000 },
  leste: { center: [-23.550, -46.500], radius: 5000 },
  oeste: { center: [-23.550, -46.800], radius: 5000 },
};

const Mapa = () => {
  const [markers, setMarkers] = useState([]);
  const [zones, setZones] = useState(initialZones);
  const [locationFilter, setLocationFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');

  useEffect(() => {
    const addresses = [
      'Avenida Paulista, 1000, Bela Vista, São Paulo',
      'Rua Augusta, 1500, Consolação, São Paulo',
      'Praça da Sé, Sé, São Paulo',
      'Avenida Brás Leme, 1000, Santana, São Paulo',
      'Avenida Indianópolis, 1000, Moema, São Paulo'
    ];

    const fetchCoordinates = async () => {
      const newMarkers = [];
      for (const address of addresses) {
        const coords = await getCoordinates(address);
        if (coords) {
          newMarkers.push({ address, coords });
        }
      }
      setMarkers(newMarkers);
    };

    fetchCoordinates();
  }, []);

  const updateZoneRadius = (zoneKey, newRadius) => {
    setZones((prevZones) => ({
      ...prevZones,
      [zoneKey]: {
        ...prevZones[zoneKey],
        radius: newRadius,
      },
    }));
  };

  const fetchPointsOfInterest = async (type, zone) => {
    const { center, radius } = zones[zone];
    const response = await fetch(`https://overpass-api.de/api/interpreter?data=[out:json];node[${type}](around:${radius},${center[0]},${center[1]});out;`);
    const data = await response.json();
    return data.elements.map(el => ({
      id: el.id,
      coords: [el.lat, el.lon],
      name: el.tags.name || 'Unknown',
      type,
    }));
  };

  const handleLocationFilterChange = async (e) => {
    const selectedFilter = e.target.value;
    setLocationFilter(selectedFilter);
    const selectedEventFilter = eventFilter !== 'all' ? eventFilter : '';

    if (selectedFilter !== 'all') {
      const pointsOfInterest = await fetchPointsOfInterest(selectedEventFilter || 'amenity', selectedFilter);
      setMarkers(pointsOfInterest);
    } else {
      // Re-fetch original markers or set markers to an empty array
      setMarkers([]);
    }
  };

  const handleEventFilterChange = async (e) => {
    const selectedFilter = e.target.value;
    setEventFilter(selectedFilter);
    const selectedLocationFilter = locationFilter !== 'all' ? locationFilter : '';

    if (selectedFilter !== 'all') {
      const pointsOfInterest = await fetchPointsOfInterest(selectedFilter, selectedLocationFilter);
      setMarkers(pointsOfInterest);
    } else {
      // Re-fetch original markers or set markers to an empty array
      setMarkers([]);
    }
  };

  return (
    <div>
      <MapContainer center={[-23.55052, -46.633308]} zoom={11} style={{ height: '600px' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {Object.keys(zones).map((zoneKey, idx) => (
          <Circle
            key={idx}
            center={zones[zoneKey].center}
            radius={zones[zoneKey].radius}
            color={zoneColor(zoneKey)}
            eventHandlers={{
              dblclick: () => {
                const newRadius = zones[zoneKey].radius + 1000;
                updateZoneRadius(zoneKey, newRadius);
              },
            }}
          />
        ))}
        {markers.map((marker, idx) => (
          <Marker key={idx} position={marker.coords} icon={getIcon(marker.type)}>
            <Popup>{marker.name}</Popup>
          </Marker>
        ))}
      </MapContainer>
      <div style={{ marginTop: '10px' }}>
        <label>Filtrar por Zona: </label>
        <select onChange={handleLocationFilterChange}>
          <option value="all">Todas</option>
          <option value="norte">Zona Norte</option>
          <option value="sul">Zona Sul</option>
          <option value="leste">Zona Leste</option>
          <option value="oeste">Zona Oeste</option>
        </select>
        <label> Filtrar por Evento: </label>
        <select onChange={handleEventFilterChange}>
          <option value="all">Todos</option>
          <option value="theatre">Teatros</option>
          <option value="arts_centre">Centros Culturais</option>
          <option value="sports">Esportes</option>
          <option value="battle_rap">Batalhas de Rima</option>
        </select>
      </div>
    </div>
  );
};

const zoneColor = (zone) => {
  switch (zone) {
    case 'norte': return 'blue';
    case 'sul': return 'green';
    case 'leste': return 'red';
    case 'oeste': return 'yellow';
    default: return 'black';
  }
};

const getIcon = (type) => {
  const iconUrls = {
    theatre: 'https://example.com/path-to-theatre-icon.png',
    arts_centre: 'https://example.com/path-to-arts-centre-icon.png',
    sports: 'https://example.com/path-to-sports-icon.png',
    battle_rap: 'https://example.com/path-to-battle-rap-icon.png',
  };
  return new L.Icon({
    iconUrl: iconUrls[type] || 'https://example.com/path-to-default-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
};

export default Mapa;