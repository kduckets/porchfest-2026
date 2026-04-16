"use client";

import { useEffect, useRef } from "react";
import { Band, ZONE_CONFIG, Zone } from "@/lib/bands";

interface Props {
  bands: Band[];
}

export default function LeafletMap({ bands }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamically import leaflet on client only
    import("leaflet").then((L) => {
      // Fix default icon path issue with Next.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapRef.current) return;

      // Center on Somerville
      const map = L.map(mapRef.current, {
        center: [42.3876, -71.1132],
        zoom: 14,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      mapInstanceRef.current = map;

      // Tile layer — CartoDB Positron (light, clean)
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      // Draw route polyline
      if (bands.length > 1) {
        const coords = bands.map((b) => [b.lat, b.lng] as [number, number]);
        L.polyline(coords, {
          color: "#1B7A70",
          weight: 2.5,
          opacity: 0.6,
          dashArray: "6, 5",
        }).addTo(map);
      }

      // Add markers
      bands.forEach((band, i) => {
        const zoneColor = ZONE_CONFIG[band.zone as Zone].color;

        // Custom SVG icon
        const svgIcon = L.divIcon({
          className: "",
          html: `
            <div style="
              width: 32px; height: 32px;
              background: ${zoneColor};
              border: 2.5px solid white;
              border-radius: 50%;
              display: flex; align-items: center; justify-content: center;
              color: white; font-weight: bold; font-size: 12px;
              font-family: 'DM Mono', monospace;
              box-shadow: 0 2px 8px rgba(0,0,0,0.25);
            ">${i + 1}</div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -18],
        });

        const marker = L.marker([band.lat, band.lng], { icon: svgIcon }).addTo(
          map
        );

        marker.bindPopup(`
          <div style="font-family: 'DM Sans', sans-serif; min-width: 180px;">
            <p style="font-family: 'Abril Fatface', serif; font-size: 1rem; font-weight: 400; margin: 0 0 2px;">${band.name}</p>
            <p style="font-size: 0.72rem; color: #888; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 6px;">${band.genre}</p>
            <p style="font-size: 0.78rem; color: #555; margin: 0 0 2px;">📍 ${band.address}</p>
            <p style="font-size: 0.78rem; color: #555; margin: 0 0 8px;">🕐 ${band.time}</p>
            <span style="
              display: inline-block;
              background: ${ZONE_CONFIG[band.zone as Zone].bg};
              color: ${ZONE_CONFIG[band.zone as Zone].text};
              font-size: 0.68rem; padding: 2px 8px; border-radius: 10px;
            ">${ZONE_CONFIG[band.zone as Zone].label}</span>
          </div>
        `);
      });

      // Fit map to markers
      if (bands.length > 0) {
        const bounds = L.latLngBounds(
          bands.map((b) => [b.lat, b.lng] as [number, number])
        );
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    });

    // Inject Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    return () => {
      if (mapInstanceRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapInstanceRef.current as any).remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers if bands change
  useEffect(() => {
    // Re-render handled by key prop in parent
  }, [bands]);

  return <div ref={mapRef} style={{ height: "420px", width: "100%" }} />;
}
