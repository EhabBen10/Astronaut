import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { HttpClient } from '@angular/common/http';
import { GeoJsonObject } from 'geojson';
import { AstronautDataService } from '../services/astronaut-data.service';

@Component({
  selector: 'app-denmark-map',
  templateUrl: './denmark-map.component.html',
  styleUrls: ['./denmark-map.component.css']
})
export class DenmarkMapComponent implements OnInit {
  private map!: L.Map;
  private astronautCounts: { [country: string]: number } = {};

  constructor(private http: HttpClient,
    private astronautDataService: AstronautDataService
  ) { }

  ngOnInit(): void {
    this.initMap();
    this.astronautDataService.getAstronautCounts().subscribe({
      next: (counts) => {
        console.log('Astronaut counts loaded:', counts); // 🔍 Check in browser console
        this.astronautCounts = counts;
        this.loadGeoJson();
      },
      error: (err) => {
        console.error('Failed to load astronaut counts:', err); // ❌ See error message
      }
    });
  }

  private initMap(): void {

    this.map = L.map('map', {
      zoomControl: true,
      attributionControl: true,
      dragging: true,
      center: [30, 0], // roughly central globally
      zoom: 3, // zoomed out to show the whole world
      worldCopyJump: true
    });
    this.map.setMinZoom(1.49);

    // this.map.on('zoomend', () => {
    //   const currentZoom = this.map.getZoom();
    //   const minZoom = this.map.getMinZoom();

    //   if (currentZoom === minZoom) {
    //     this.map.setView([56, 10], currentZoom);
    //   }
    // });

    // if (this.map.getMinZoom() === 7.25) {
    //   this.map.setView([56, 10], 6);
    // }
    this.map.setMaxBounds([
      [-60, -180], // southwest corner (limit South Pole)
      [85, 180]    // northeast corner
    ]);
  }

  // Helper to recursively strip 3D -> 2D
  private to2DCoordinates(coords: any): any {
    return Array.isArray(coords)
      ? coords.map(inner => (Array.isArray(inner[0]) ? this.to2DCoordinates(inner) : inner.slice(0, 2)))
      : coords;
  }

  private loadGeoJson(): void {
    this.http.get<any>('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json').subscribe((geoJson) => {
      for (const feature of geoJson.features) {
        if (feature.geometry?.coordinates) {
          feature.geometry.coordinates = this.to2DCoordinates(feature.geometry.coordinates);
        }
      }

      const geoJsonLayer = L.geoJSON(geoJson, {
        onEachFeature: (feature: any, layer: L.Layer) => {
          const name = feature.properties?.name ?? 'Unknown';
          const count = this.astronautCounts[name] || 0;
          // layer.bindPopup(`<strong>${name}</strong><br/>Astronauts: ${count}`);
          // Hover: Show tooltip (instead of popup)
          layer.on('mouseover', () => {
            layer.bindTooltip(`<strong>${name}</strong><br/>Astronauts: ${count}`, {
              sticky: true,
              direction: 'top',
              offset: L.point(0, -10)
            }).openTooltip();
          });

          layer.on('mouseout', () => {
            layer.closeTooltip();
          });
          layer.on('click', () => {
            // Example: Log to console or trigger modal, routing, etc.
            console.log(`Clicked on ${name} with ${count} astronauts`);
            alert(`You clicked on ${name} with ${count} astronauts!`);
          });
        },
        style: (feature: any) => {
          const name = feature.properties?.name ?? 'Unknown';
          const count = this.astronautCounts[name] || 0;
          return {
            fillColor: this.getColor(count),
            weight: 1,
            color: 'white',
            fillOpacity: 0.7
          };
        }
      });

      geoJsonLayer.addTo(this.map);
      this.map.fitBounds(geoJsonLayer.getBounds());
    });
  }

  private getColor(count: number): string {
    return count > 300 ? '#800026' :
      count > 100 ? '#BD0026' :
        count > 50 ? '#E31A1C' :
          count > 20 ? '#FC4E2A' :
            count > 10 ? '#FD8D3C' :
              count > 0 ? '#FEB24C' :
                '#blue';
  }

}