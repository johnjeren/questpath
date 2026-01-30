"use client";

import { useEffect, useRef, useState } from "react";

interface MapPickerProps {
  latitude: string;
  longitude: string;
  onLocationChange: (lat: number, lng: number) => void;
}

export function MapPicker({ latitude, longitude, onLocationChange }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load Google Maps script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setError("Google Maps API key not configured");
      return;
    }

    // Check if already loaded
    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => setError("Failed to load Google Maps");
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || map) return;

    const lat = parseFloat(latitude) || 40.7128;
    const lng = parseFloat(longitude) || -74.0060;

    const newMap = new google.maps.Map(mapRef.current, {
      center: { lat, lng },
      zoom: latitude && longitude ? 15 : 12,
      mapTypeControl: false,
      streetViewControl: false,
    });

    setMap(newMap);

    // Add marker if coordinates exist
    if (latitude && longitude) {
      const newMarker = new google.maps.Marker({
        position: { lat, lng },
        map: newMap,
        draggable: true,
      });

      newMarker.addListener("dragend", () => {
        const pos = newMarker.getPosition();
        if (pos) {
          onLocationChange(pos.lat(), pos.lng());
        }
      });

      setMarker(newMarker);
    }

    // Click to place marker
    newMap.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        onLocationChange(lat, lng);

        if (marker) {
          marker.setPosition(e.latLng);
        } else {
          const newMarker = new google.maps.Marker({
            position: e.latLng,
            map: newMap,
            draggable: true,
          });

          newMarker.addListener("dragend", () => {
            const pos = newMarker.getPosition();
            if (pos) {
              onLocationChange(pos.lat(), pos.lng());
            }
          });

          setMarker(newMarker);
        }
      }
    });
  }, [isLoaded, map, latitude, longitude, marker, onLocationChange]);

  // Setup search box
  useEffect(() => {
    if (!isLoaded || !map || !searchInputRef.current) return;

    const searchBox = new google.maps.places.SearchBox(searchInputRef.current);

    map.addListener("bounds_changed", () => {
      searchBox.setBounds(map.getBounds() as google.maps.LatLngBounds);
    });

    searchBox.addListener("places_changed", () => {
      const places = searchBox.getPlaces();
      if (!places || places.length === 0) return;

      const place = places[0];
      if (!place.geometry?.location) return;

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      onLocationChange(lat, lng);

      if (marker) {
        marker.setPosition(place.geometry.location);
      } else {
        const newMarker = new google.maps.Marker({
          position: place.geometry.location,
          map: map,
          draggable: true,
        });

        newMarker.addListener("dragend", () => {
          const pos = newMarker.getPosition();
          if (pos) {
            onLocationChange(pos.lat(), pos.lng());
          }
        });

        setMarker(newMarker);
      }

      map.setCenter(place.geometry.location);
      map.setZoom(15);
    });
  }, [isLoaded, map, marker, onLocationChange]);

  // Update marker when coordinates change externally
  useEffect(() => {
    if (!map || !latitude || !longitude) return;

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) return;

    const position = { lat, lng };

    if (marker) {
      marker.setPosition(position);
    } else {
      const newMarker = new google.maps.Marker({
        position,
        map,
        draggable: true,
      });

      newMarker.addListener("dragend", () => {
        const pos = newMarker.getPosition();
        if (pos) {
          onLocationChange(pos.lat(), pos.lng());
        }
      });

      setMarker(newMarker);
    }

    map.setCenter(position);
  }, [latitude, longitude, map, marker, onLocationChange]);

  if (error) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg text-yellow-700 dark:text-yellow-400 text-sm">
        <p className="font-medium mb-1">⚠️ {error}</p>
        <p className="text-xs">
          Add <code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 py-0.5 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your environment variables.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {isLoaded && (
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search for a location..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-secondary/30 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-highlight dark:focus:ring-secondary focus:border-highlight dark:focus:border-secondary bg-white dark:bg-primary/80 text-gray-900 dark:text-white text-sm"
        />
      )}
      <div
        ref={mapRef}
        className="w-full h-64 rounded-lg border border-gray-300 dark:border-secondary/30 bg-gray-100 dark:bg-primary/50"
      />
      <p className="text-xs text-gray-500 dark:text-secondary/60">
        Click on the map or search to set location • Drag marker to adjust
      </p>
    </div>
  );
}
