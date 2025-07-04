import { Component, OnInit, OnDestroy } from '@angular/core';
import { DenmarkMapComponent } from './denmark-map/denmark-map.component';
import { GenderDistributionChartComponent } from './gender-distribution-chart/gender-distribution-chart.component';
import { MissionCollaborationChartComponent } from './mission-collaboration-chart/mission-collaboration-chart.component';
import { HttpClientModule } from '@angular/common/http';
import { CountrySelectionService } from './services/country-selection.service';
import { LegendFilterService } from './services/legend-filter.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [DenmarkMapComponent, GenderDistributionChartComponent, MissionCollaborationChartComponent, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'visulation';
  selectedCountry: string = '';
  selectedRange: string = '';
  private subscription: Subscription = new Subscription();

  constructor(
    private countrySelectionService: CountrySelectionService,
    private legendFilterService: LegendFilterService
  ) { }

  ngOnInit(): void {
    this.subscription.add(
      this.countrySelectionService.selectedCountry$.subscribe(country => {
        this.selectedCountry = country;
        this.updateCountryInfo(country);
      })
    );

    this.subscription.add(
      this.legendFilterService.selectedRange$.subscribe(range => {
        this.selectedRange = range;
        this.updateLegendUI();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onLegendClick(range: string): void {
    this.legendFilterService.setSelectedRange(range);
    // Clear country selection when filtering by range
    if (this.legendFilterService.getSelectedRange()) {
      this.countrySelectionService.setSelectedCountry('');
    }
  }

  private updateCountryInfo(country: string): void {
    const infoElement = document.getElementById('selected-country-info');
    if (infoElement) {
      if (country) {
        infoElement.innerHTML = `<p><strong>Selected:</strong> ${country}</p>`;
      } else {
        infoElement.innerHTML = '';
      }
    }
  }

  private updateLegendUI(): void {
    // Update legend item active states
    const legendItems = document.querySelectorAll('.legend-bar-item');
    legendItems.forEach((item, index) => {
      const ranges = ['300+', '100-299', '50-99', '20-49', '10-19', '1-9', '0'];
      if (ranges[index] === this.selectedRange) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }
}
