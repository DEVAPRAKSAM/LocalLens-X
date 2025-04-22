// src/components/LiveMap.js
import React, { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function LiveMap({ search }) {
  useEffect(() => {
    const map = L.map("map").setView([13.0827, 80.2707], 12); // Chennai center

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Dummy issues
    const issues = [
      { id: 1, type: "garbage", desc: "Garbage pile", lat: 13.07, lng: 80.24 },
      { id: 2, type: "pothole", desc: "Big pothole", lat: 13.09, lng: 80.28 },
      { id: 3, type: "light", desc: "Street light not working", lat: 13.08, lng: 80.25 },
    ];

    // Color icons based on type
    const getColor = (type) => {
      switch (type) {
        case "garbage": return "green";
        case "pothole": return "red";
        case "light": return "orange";
        default: return "blue";
      }
    };

    // Add filtered markers
    issues
      .filter((issue) =>
        issue.desc.toLowerCase().includes(search.toLowerCase())
      )
      .forEach((issue) => {
        const icon = L.divIcon({
          className: "custom-icon",
          html: `<div style="background:${getColor(issue.type)};width:15px;height:15px;border-radius:50%;"></div>`,
        });

        L.marker([issue.lat, issue.lng], { icon })
          .addTo(map)
          .bindPopup(`<b>${issue.type.toUpperCase()}</b><br/>${issue.desc}`);
      });

    return () => map.remove(); // Clean on re-render
  }, [search]);

  return <div id="map" style={{ height: "300px", marginTop: "20px" }}></div>;
}

export default LiveMap;
