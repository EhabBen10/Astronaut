import { Component, OnInit, OnDestroy, ElementRef } from '@angular/core';
import * as d3 from 'd3';
import { AstronautDataService } from '../services/astronaut-data.service';
import { CountrySelectionService } from '../services/country-selection.service';
import { LegendFilterService } from '../services/legend-filter.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-gender-distribution-chart',
  template: '<div><h4>{{getChartTitle()}}</h4><svg width="550" height="300"></svg></div>',
})
export class GenderDistributionChartComponent implements OnInit, OnDestroy {
  private subscription: Subscription = new Subscription();
  selectedCountry: string = '';
  selectedRange: string = '';

  constructor(
    private el: ElementRef,
    private astronautService: AstronautDataService,
    private countrySelectionService: CountrySelectionService,
    private legendFilterService: LegendFilterService
  ) { }

  ngOnInit(): void {
    // Load overall gender distribution on startup
    this.astronautService.getGenderDistribution().subscribe(data => {
      this.drawChart(data);
    });

    this.subscription.add(
      this.countrySelectionService.selectedCountry$.subscribe(country => {
        this.selectedCountry = country;
        // Only update for country selection if no range filter is active
        if (!this.selectedRange) {
          if (country) {
            this.astronautService.getGenderDistributionByCountry(country).subscribe(data => {
              this.drawChart(data);
            });
          } else {
            this.astronautService.getGenderDistribution().subscribe(data => {
              this.drawChart(data);
            });
          }
        }
      })
    );

    this.subscription.add(
      this.legendFilterService.selectedRange$.subscribe(range => {
        this.selectedRange = range;
        if (range) {
          // Clear country selection when filtering by range
          this.selectedCountry = '';
          this.astronautService.getGenderDistributionByRange(range).subscribe(data => {
            this.drawChart(data);
          });
        } else {
          // Return to overall distribution when no filter
          this.astronautService.getGenderDistribution().subscribe(data => {
            this.drawChart(data);
          });
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private drawChart(data: { male: number, female: number }) {
    const svg = d3.select(this.el.nativeElement).select('svg');
    svg.selectAll('*').remove(); // clear old chart

    const margin = { top: 10, right: 0, bottom: 20, left: 50 };
    const width = +svg.attr('width') - margin.left - margin.right;
    const height = +svg.attr('height') - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const genders = ['Male', 'Female'];
    const counts = [data.male, data.female];
    const maxValue = d3.max(counts) || 0;

    const x = d3.scaleBand()
      .domain(genders)
      .range([0, width])
      .padding(0.25);

    const y = d3.scaleLinear()
      .domain([0, maxValue * 1.1]) // Add 10% padding to top
      .range([height, 0]);

    // Add grid lines
    const yGrid = d3.axisLeft(y).tickSize(-width).tickFormat(null);

    // Add horizontal grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(yGrid as any)
      .selectAll('line')
      .style('stroke', '#e0e0e0')
      .style('stroke-width', '1px')
      .style('opacity', 0.7);



    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('font-size', '12px')
      .style('font-weight', 'bold');

    // Add Y-axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Number of Astronauts');

    // Create bars with better colors
    const colors = ['#4A90E2', '#E24A90']; // Blue for male, Pink for female

    g.selectAll('.bar')
      .data(genders)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d)!)
      .attr('y', d => {
        const value = data[d.toLowerCase() as keyof typeof data];
        return value === 0 ? height : y(value);
      })
      .attr('width', x.bandwidth())
      .attr('height', d => {
        const value = data[d.toLowerCase() as keyof typeof data];
        return value === 0 ? 0 : height - y(value);
      })
      .attr('fill', (d, i) => colors[i])
      .attr('stroke', '#333')
      .attr('stroke-width', 1)
      .style('opacity', 0.8);

    // Add value labels on top of bars
    g.selectAll('.label')
      .data(genders)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('x', d => x(d)! + x.bandwidth() / 2)
      .attr('y', d => {
        const value = data[d.toLowerCase() as keyof typeof data];
        return value === 0 ? height - 5 : y(value) - 5;
      })
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#333')
      .text(d => data[d.toLowerCase() as keyof typeof data]);
  }

  getChartTitle(): string {
    if (this.selectedCountry) {
      return this.selectedCountry;
    } else if (this.selectedRange) {
      return `Countries with ${this.selectedRange} astronauts`;
    } else {
      return "All Countries - Gender Distribution";
    }
  }
}