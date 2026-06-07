"use client";

/**
 * LocationMap.tsx
 *
 * Leaflet/OpenStreetMap map component for location picking and display.
 * SSR-safe: must be imported with `next/dynamic` and `ssr: false`.
 *
 * Requirements: 9.3 — Leaflet/OSM picker + manual lat/lng fallback
 */

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface LocationMapProps {
  /** Center latitude (defaults to Jakarta) */
  lat?: number;
  /** Center longitude (defaults to Jakarta) */
  lng?: number;
  /** Geofence radius in meters */
  radius?: number;
  /** Called when user clicks the map to select a coordinate (readOnly=false) */
  onCoordinateSelect?: (lat: number, lng: number) => void;
  /** If true, clicking the map won't move the marker */
  readOnly?: boolean;
  /** Height of the map container (CSS value, e.g. "300px") */
  height?: string;
}

// ---------------------------------------------------------------------------
// Default coordinates (Jakarta)
// ---------------------------------------------------------------------------
const DEFAULT_LAT = -6.2088;
const DEFAULT_LNG = 106.8456;
const DEFAULT_ZOOM = 15;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LocationMap({
  lat,
  lng,
  radius = 100,
  onCoordinateSelect,
  readOnly = true,
  height = "300px",
}: LocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Use a ref to hold the Leaflet map instance so we don't re-create it
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const circleRef = useRef<import("leaflet").Circle | null>(null);

  const centerLat = lat ?? DEFAULT_LAT;
  const centerLng = lng ?? DEFAULT_LNG;

  useEffect(() => {
    // Leaflet must only run in the browser
    if (typeof window === "undefined") return;
    if (!containerRef.current) return;

    // Dynamically import Leaflet to avoid SSR issues
    import("leaflet").then((L) => {
      // Fix default icon path issue in webpack/Next.js bundling
      // @ts-expect-error - _getIconUrl is not in the type definitions
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Initialize map only once
      if (!mapRef.current) {
        const map = L.map(containerRef.current!, {
          center: [centerLat, centerLng],
          zoom: DEFAULT_ZOOM,
          zoomControl: true,
          scrollWheelZoom: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        // Add marker
        const marker = L.marker([centerLat, centerLng], {
          draggable: !readOnly,
        }).addTo(map);

        // Add geofence circle
        const circle = L.circle([centerLat, centerLng], {
          radius,
          color: "#6366f1",
          fillColor: "#6366f1",
          fillOpacity: 0.15,
          weight: 2,
        }).addTo(map);

        // Click to pick coordinate (when not readOnly)
        if (!readOnly && onCoordinateSelect) {
          map.on("click", (e: import("leaflet").LeafletMouseEvent) => {
            const { lat: clickLat, lng: clickLng } = e.latlng;
            marker.setLatLng([clickLat, clickLng]);
            circle.setLatLng([clickLat, clickLng]);
            onCoordinateSelect(clickLat, clickLng);
          });

          // Drag end also updates
          marker.on("dragend", () => {
            const pos = marker.getLatLng();
            circle.setLatLng([pos.lat, pos.lng]);
            onCoordinateSelect(pos.lat, pos.lng);
          });
        }

        mapRef.current = map;
        markerRef.current = marker;
        circleRef.current = circle;
      }
    });

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        circleRef.current = null;
      }
    };
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker / circle when lat, lng, or radius change after mount
  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !circleRef.current) return;
    import("leaflet").then(() => {
      markerRef.current!.setLatLng([centerLat, centerLng]);
      circleRef.current!.setLatLng([centerLat, centerLng]);
      circleRef.current!.setRadius(radius);
      mapRef.current!.setView([centerLat, centerLng], DEFAULT_ZOOM, {
        animate: true,
      });
    });
  }, [centerLat, centerLng, radius]);

  return (
    <div
      ref={containerRef}
      style={{ height, width: "100%" }}
      className="rounded-lg overflow-hidden border border-outline-variant z-0"
      role="application"
      aria-label="Peta lokasi — klik untuk memilih koordinat"
    />
  );
}
