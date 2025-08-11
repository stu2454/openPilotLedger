'use client'
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [sites, setSites] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/public/export.json").then(r=>r.json()).then(()=>{});
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: process.env.NEXT_PUBLIC_BASEMAP_STYLE || "https://demotiles.maplibre.org/style.json",
      center: [151.67, -30.51], // Armidale-ish
      zoom: 6
    });
    return () => map.remove();
  }, []);

  return <div ref={mapRef} className="h-[70vh] rounded-2xl border border-slate-800" />;
}
