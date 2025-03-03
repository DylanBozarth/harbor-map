import React, { useEffect, useState } from "react";
import {
  APIProvider,
  Map,
  MapCameraChangedEvent,
  AdvancedMarker,
  InfoWindow,
} from "@vis.gl/react-google-maps";
import Control_panel from "./control_panel";
import locationsData from "../locations.json";
import lockerImage from "./images/Locker.png";
interface locationsInterface {
  accessHours: null;
  address1: string;
  address2: string | null;
  city: string;
  country: string;
  description: string | null;
  id: number;
  lat: number;
  lon: number;
  name: string;
  notes: string | null;
  state: string;
  timezone: string;
  zip: string;
}
const fetchLocationsData = async () => {
  try {
    const accessToken = import.meta.env.VITE_SANDBOX_ACCESS_TOKEN;
    const response = await fetch(
      "https://api.sandbox.harborlockers.com/api/v1/locations/?skip=0&limit=1000",
      {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    console.log(result);
  } catch (error) {
    console.log("There was an error fetching ");
    console.log(error);
  }
};

const ImTheMap = () => {
  const [locations, setLocations] = useState<locationsInterface[]>([]);
  const [hoveredLocation, setHoveredLocation] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 39.8283, lng: -98.5795 });
  const [mapZoom, setMapZoom] = useState(5);
  const [zipCode, setZipCode] = useState("");
  const mapRef = React.useRef<google.maps.Map | null>(null);

  const handleMapLoad = (map: google.maps.Map) => {
    mapRef.current = map; 
  };

  const handleZipSearch = () => {
    if (!zipCode || !mapRef.current) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: zipCode }, (results, status) => {
      if (status === "OK" && results?.[0]?.geometry?.location) {
        const location = results[0].geometry.location;
        const map = mapRef.current as google.maps.Map;

        map.setCenter({ lat: location.lat(), lng: location.lng() });
        map.setZoom(13); 
      } else {
        alert("Invalid zip code");
      }
    });
  };

  const fetchLocalLocations = () => {
    fetch("../locations.json")
      .then((response) => response.json())
      .then((data) => setLocations(data))
      .catch((error) => console.error("Error loading locations:", error));
  };

  useEffect(() => {
    fetchLocalLocations();
  }, []);

  return (
    <APIProvider apiKey={`${import.meta.env.VITE_GOOGLE_API_KEY}`}>
      <div style={{ padding: "10px", display: "flex", gap: "10px" }}>
        <input
          type="text"
          placeholder="Enter ZIP code"
          className="zip-box"
          value={zipCode}
          onChange={(e) => setZipCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleZipSearch();
            }
          }}
        />
        <button onClick={handleZipSearch} disabled={!zipCode.trim()}>
          Zoom to ZIP
        </button>
      </div>
      <div style={{ width: "100vw", height: "100vh" }}>
        <Map
          defaultZoom={mapZoom}
          defaultCenter={mapCenter}
          gestureHandling="greedy"
          disableDefaultUI
          mapId="Harbor locations map"
          onTilesLoaded={(e) => handleMapLoad(e.map)}
        >
          {locations.map((location) =>
            location.lat && location.lon ? (
              <React.Fragment key={location.id}>
                <AdvancedMarker
                  position={{ lat: location.lat, lng: location.lon }}
                  onMouseEnter={() => setHoveredLocation(location.id)}
                  key={location.id}
                >
                  <div
                    style={{
                      width: "35px",
                      height: "35px",
                      backgroundImage: `url(${lockerImage})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      borderRadius: "50%",
                      cursor: "pointer",
                    }}
                  />
                </AdvancedMarker>

                {hoveredLocation === location.id && (
                  <InfoWindow
                    position={{ lat: location.lat, lng: location.lon }}
                  >
                    <div className="black-text">
                      <p>{location.name}</p>
                      <p>{location.address1}</p>
                      <p>{location.zip}</p>
                      <p>X Towers available here</p>
                    </div>
                  </InfoWindow>
                )}
              </React.Fragment>
            ) : null
          )}
        </Map>
      </div>
    </APIProvider>
  );
};

export default ImTheMap;
