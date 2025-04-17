"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
} from "@vis.gl/react-google-maps";
import "./map.css";

interface LocationInterface {
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

interface MapProps {
  apiKey?: string;
  width?: string;
  height?: string;
  showSearch?: boolean;
  initialZoom?: number;
  initialCenter?: { lat: number; lng: number };
  className?: string;
  onLocationSelect?: (location: LocationInterface) => void;
}

const MapComponent = ({
  apiKey = import.meta.env.VITE_GOOGLE_API_KEY,
  width = "100%",
  height = "600px",
  showSearch = true,
  initialZoom = 5,
  initialCenter = { lat: 39.8283, lng: -98.5795 },
  className = "",
  onLocationSelect,
}: MapProps) => {
  const [locations, setLocations] = useState<LocationInterface[]>([]);
  const [openInfoWindowId, setOpenInfoWindowId] = useState<number | null>(null);
  const [zipCode, setZipCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef<google.maps.Map | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);
  
  const handleMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
  };

  const handleZipSearch = () => {
    if (!zipCode || !mapRef.current) return;

    setIsLoading(true);
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: zipCode }, (results, status) => {
      setIsLoading(false);
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
  const fetchLocalLocations = async () => {
    setIsLoading(true);
    try {
      const accessToken = import.meta.env.VITE_PROD_ACCESS_TOKEN;
      const clientId = import.meta.env.VITE_PROD_CLIENT;
      const clientSecret = import.meta.env.VITE_PROD_SECRET;
  /*
      const response = await fetch("https://api.harborlockers.com/api/v1/locations/?skip=0&limit=1000", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Client-ID": clientId,
          "X-Client-Secret": clientSecret,
          "Content-Type": "application/json",
        },
      });
  */
      const response = await fetch("prod-locations.json");
      const data = await response.json();
      console.log(data);
      setLocations(data);
    } catch (error) {
      console.error("Error loading locations:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle marker interactions
  const handleMarkerMouseEnter = (locationId: number) => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    // Set the open info window
    setOpenInfoWindowId(locationId);
  };

  const handleMarkerMouseLeave = () => {
    // Set a timeout to close the info window
    hoverTimeoutRef.current = window.setTimeout(() => {
      setOpenInfoWindowId(null);
    }, 2000);
  };

  const handleInfoWindowMouseEnter = () => {
    // Clear the timeout when mouse enters the info window
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handleInfoWindowMouseLeave = () => {
    // Set a timeout to close the info window
    hoverTimeoutRef.current = window.setTimeout(() => {
      setOpenInfoWindowId(null);
    }, 300);
  };

  const handleLocationClick = (location: LocationInterface) => {
    // Toggle the info window
    setOpenInfoWindowId((prevId) =>
      prevId === location.id ? null : location.id
    );

    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };

  useEffect(() => {
    fetchLocalLocations();

    // Clean up any timeouts on unmount
    return () => {
      if (hoverTimeoutRef.current) {
        window.clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`harbor-map-container ${className}`}
      style={{ width, height }}
    >
      {apiKey ? (
        <APIProvider apiKey={apiKey}>
          {showSearch && (
            <div className="harbor-search-container">
              <div className="harbor-search-box">
                <input
                  type="text"
                  placeholder="Enter ZIP code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleZipSearch();
                    }
                  }}
                />
                <button
                  onClick={handleZipSearch}
                  disabled={!zipCode.trim() || isLoading}
                  className="harbor-search-button"
                >
                  {isLoading ? "Searching..." : "Find Lockers"}
                </button>
              </div>
            </div>
          )}
          <div className="harbor-map-wrapper">
            {isLoading && (
              <div className="harbor-loading-overlay">Loading map data...</div>
            )}
            <Map
              defaultZoom={initialZoom}
              defaultCenter={initialCenter}
              gestureHandling="greedy"
              disableDefaultUI={false}
              mapId="Harbor locations map"
              onTilesLoaded={(e) => handleMapLoad(e.map)}
              mapTypeControl={false}
              fullscreenControl={false}
              streetViewControl={false}
              zoomControl={true}
              zoomControlOptions={{
                position: 7, // RIGHT_CENTER
              }}
            >
              {locations.map((location) =>
                location.lat && location.lon ? (
                  <React.Fragment key={location.id}>
                    {/* Use a wrapper div to handle mouse events */}
                    <div
                      className="marker-wrapper"
                      onMouseEnter={() => handleMarkerMouseEnter(location.id)}
                      onMouseLeave={handleMarkerMouseLeave}
                    >
                      <AdvancedMarker
                        position={{ lat: location.lat, lng: location.lon }}
                        onClick={() => handleLocationClick(location)}
                      >
                        <div className="harbor-marker" />
                      </AdvancedMarker>
                    </div>

                    {openInfoWindowId === location.id && (
                      <InfoWindow
                        position={{ lat: location.lat, lng: location.lon }}
                        onCloseClick={() => setOpenInfoWindowId(null)}
                      >
                        <div
                          className="harbor-info-window"
                          onMouseEnter={handleInfoWindowMouseEnter}
                          onMouseLeave={handleInfoWindowMouseLeave}
                        >
                          <h3>{location.name}</h3>
                          <p>{location.address1}</p>
                          {location.address2 && <p>{location.address2}</p>}
                          <p>
                            {location.city}, {location.state} {location.zip}
                          </p>
                          {/*<button
                            className="harbor-info-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Add your view details action here
                              console.log(`View details for ${location.name}`);
                            }}
                          >
                            View Details
                          </button> */}
                        </div>
                      </InfoWindow>
                    )}
                  </React.Fragment>
                ) : null
              )}
            </Map>
          </div>
        </APIProvider>
      ) : (
        <div className="harbor-error-message">
          Something has gone wrong with our map, please try again later
        </div>
      )}
    </div>
  );
};

export default MapComponent;
