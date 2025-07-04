import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { HttpClient } from '@angular/common/http';
import { AstronautDataService } from '../services/astronaut-data.service';
import { CountrySelectionService } from '../services/country-selection.service';
import { LegendFilterService } from '../services/legend-filter.service';

@Component({
  selector: 'app-denmark-map',
  templateUrl: './denmark-map.component.html',
  styleUrls: ['./denmark-map.component.css']
})
export class DenmarkMapComponent implements OnInit {
  private map!: L.Map;
  selectedCountry: string = '';
  private astronautCounts: { [country: string]: number } = {};
  private selectedLayer: L.Layer | null = null;
  private geoJsonLayer!: L.GeoJSON;

  constructor(private http: HttpClient,
    private astronautDataService: AstronautDataService,
    private countrySelectionService: CountrySelectionService,
    private legendFilterService: LegendFilterService
  ) { }

  ngOnInit(): void {
    this.initMap();
    this.astronautDataService.getAstronautCounts().subscribe({
      next: (counts) => {
        console.log('Astronaut counts loaded:', counts);
        this.astronautCounts = counts;
        this.loadGeoJson();
      },
      error: (err) => {
        console.error('Failed to load astronaut counts:', err);
      }
    });

    // Listen for legend filter changes
    this.legendFilterService.selectedRange$.subscribe(range => {
      if (this.geoJsonLayer) {
        this.highlightCountriesByRange(range);
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
          layer.on('click', (e) => {
            // Prevent event from bubbling to map
            L.DomEvent.stopPropagation(e);

            // Clear legend filter when selecting a specific country
            this.legendFilterService.clearFilter();

            // Highlight the selected country
            this.highlightCountry(layer);

            // Set the selected country for the chart
            this.countrySelectionService.setSelectedCountry(name);
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

      this.geoJsonLayer = geoJsonLayer;
      this.geoJsonLayer.addTo(this.map);
      this.map.fitBounds(this.geoJsonLayer.getBounds());

      // Add click handler to map to deselect when clicking on non-country areas
      this.map.on('click', () => {
        this.resetHighlight();
        this.countrySelectionService.setSelectedCountry('');
      });
    });
  }

  private getColor(count: number): string {
    return count > 300 ? '#440154' :  // Dark purple
      count > 100 ? '#31688e' :       // Blue
        count > 50 ? '#35b779' :      // Green
          count > 20 ? '#6ece58' :    // Light green
            count > 10 ? '#b5de2b' :  // Yellow-green
              count > 0 ? '#fde725' : // Yellow
                '#cccccc';            // Light gray
  }

  private highlightCountry(layer: L.Layer): void {
    // Reset previous selection
    this.resetHighlight();

    // Set new selection
    this.selectedLayer = layer;

    // Apply highlight style
    if (layer instanceof L.Path) {
      layer.setStyle({
        weight: 3,
        color: '#ff6b35',
        fillOpacity: 0.9
      });
      layer.bringToFront();
    }
  }

  private resetHighlight(): void {
    if (this.selectedLayer && this.selectedLayer instanceof L.Path) {
      // Reset to original style
      this.geoJsonLayer.resetStyle(this.selectedLayer);
    }
    this.selectedLayer = null;
  }

  private highlightCountriesByRange(range: string): void {
    if (!this.geoJsonLayer) return;

    this.geoJsonLayer.eachLayer((layer: L.Layer) => {
      if (layer instanceof L.Path) {
        const feature = (layer as any).feature;
        const countryName = feature?.properties?.name ?? 'Unknown';
        const count = this.astronautCounts[countryName] || 0;

        if (range === '') {
          // Clear all highlighting
          this.geoJsonLayer.resetStyle(layer);
        } else if (this.astronautDataService.isCountInRange(count, range)) {
          // Highlight countries in the selected range
          layer.setStyle({
            weight: 3,
            color: '#ff6b35',
            fillOpacity: 0.9
          });
          layer.bringToFront();
        } else {
          // Dim countries not in range
          layer.setStyle({
            weight: 1,
            color: 'white',
            fillOpacity: 0.3
          });
        }
      }
    });
  }

}