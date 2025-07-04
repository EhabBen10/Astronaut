import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { AstronautDataService } from '../services/astronaut-data.service';
import { CountrySelectionService } from '../services/country-selection.service';
import { LegendFilterService } from '../services/legend-filter.service';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-mission-collaboration-chart',
  template: `
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h4>{{getChartTitle()}}</h4>
        <button 
          (click)="toggleShowAll()" 
          style="padding: 5px 10px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
          {{showAllCountries ? 'Show Top 10' : 'Show All'}}
        </button>
      </div>
      <svg #chart width="650" height="400"></svg>
    </div>
  `,
  styleUrls: ['./mission-collaboration-chart.component.css']
})
export class MissionCollaborationChartComponent implements OnInit, OnDestroy {
  @ViewChild('chart', { static: true }) chartElement!: ElementRef;
  private subscription: Subscription = new Subscription();
  selectedCountry: string = '';
  selectedRange: string = '';
  private collaborationCache = new Map<string, { [country: string]: number }>();
  showAllCountries: boolean = false; // Toggle for showing all countries

  // Mapping for display names in charts (shorter names)
  private displayNames: { [key: string]: string } = {
    "United States of America": "USA",
    // Add more mappings if needed for long country names
  };

  constructor(
    private astronautService: AstronautDataService,
    private countrySelectionService: CountrySelectionService,
    private legendFilterService: LegendFilterService
  ) { }

  ngOnInit(): void {
    // Load overall collaboration data on startup
    this.loadCollaborationData();

    // Subscribe to country selection changes with debouncing
    this.subscription.add(
      this.countrySelectionService.selectedCountry$.pipe(
        debounceTime(100),
        distinctUntilChanged()
      ).subscribe(country => {
        this.selectedCountry = country;
        // Only update for country selection if no range filter is active
        if (!this.selectedRange) {
          this.loadCollaborationData(country);
        }
      })
    );

    // Subscribe to legend filter changes with debouncing
    this.subscription.add(
      this.legendFilterService.selectedRange$.pipe(
        debounceTime(100),
        distinctUntilChanged()
      ).subscribe(range => {
        this.selectedRange = range;
        if (range) {
          // Clear country selection when filtering by range
          this.selectedCountry = '';
          // For range filtering, show overall collaboration data
          this.loadCollaborationData();
        } else {
          // Return to overall collaboration data when no filter
          this.loadCollaborationData(this.selectedCountry);
        }
      })
    );
  }

  private loadCollaborationData(country?: string): void {
    const cacheKey = country || 'overall';

    // Check cache first
    if (this.collaborationCache.has(cacheKey)) {
      this.drawChart(this.collaborationCache.get(cacheKey)!);
      return;
    }

    // Load from service and cache result
    this.astronautService.getCollaboratingCountries(country).subscribe(data => {
      this.collaborationCache.set(cacheKey, data);
      this.drawChart(data);
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private drawChart(data: { [key: string]: number }): void {
    const svg = d3.select(this.chartElement.nativeElement);
    svg.selectAll('*').remove(); // Clear previous

    const width = 600;
    const margin = { top: 20, right: 20, bottom: 50, left: 120 };

    // Convert data to display names for chart
    const displayData: { [key: string]: number } = {};
    Object.entries(data).forEach(([country, count]) => {
      const displayName = this.displayNames[country] || country;
      displayData[displayName] = count;
    });

    const entries = Object.entries(displayData)
      .filter(([country, count]) => count > 0) // Only show countries with collaborations
      .sort((a, b) => b[1] - a[1])
      .slice(0, this.showAllCountries ? undefined : 10); // Show top 10 or all

    // Dynamic height based on number of entries
    const baseHeight = 100; // Base height for margins and labels
    const barHeight = 25; // Height per bar
    const height = Math.max(300, baseHeight + (entries.length * barHeight));

    // Update SVG height dynamically
    svg.attr('height', height);

    if (entries.length === 0) {
      // Show "No data" message
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('fill', '#666')
        .text('No collaboration data available');
      return;
    }

    const x = d3.scaleLinear()
      .domain([0, d3.max(entries, d => d[1]) || 1])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleBand()
      .domain(entries.map(d => d[0]))
      .range([margin.top, height - margin.bottom])
      .padding(0.1);

    // Add bars
    svg.append('g')
      .selectAll('rect')
      .data(entries)
      .enter()
      .append('rect')
      .attr('x', margin.left)
      .attr('y', d => y(d[0])!)
      .attr('width', d => x(d[1]) - margin.left)
      .attr('height', y.bandwidth())
      .attr('fill', '#3f51b5')
      .attr('stroke', '#333')
      .attr('stroke-width', 1)
      .style('opacity', 0.8);

    // Add value labels
    svg.append('g')
      .selectAll('text')
      .data(entries)
      .enter()
      .append('text')
      .attr('x', d => x(d[1]) + 5)
      .attr('y', d => y(d[0])! + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#333')
      .text(d => d[1]);

    // Add axes
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y))
      .selectAll('text')
      .style('font-size', '12px');

    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5))
      .selectAll('text')
      .style('font-size', '12px');

    // Add axis labels
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('Number of Shared Missions');

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('Collaborating Countries');
  }

  toggleShowAll(): void {
    this.showAllCountries = !this.showAllCountries;
    // Clear cache and reload to reflect the change
    this.collaborationCache.clear();
    this.loadCollaborationData(this.selectedCountry);
  }

  getChartTitle(): string {
    if (this.selectedCountry) {
      // Use display name for the title
      const displayCountry = this.displayNames[this.selectedCountry] || this.selectedCountry;
      return `Countries that shared missions with ${displayCountry}`;
    } else if (this.selectedRange) {
      return `Mission Collaborations (${this.selectedRange} astronauts)`;
    } else {
      return "Countries by Number of Shared Missions";
    }
  }
}