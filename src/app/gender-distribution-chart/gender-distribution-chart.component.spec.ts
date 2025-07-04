import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenderDistributionChartComponent } from './gender-distribution-chart.component';

describe('GenderDistributionChartComponent', () => {
  let component: GenderDistributionChartComponent;
  let fixture: ComponentFixture<GenderDistributionChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenderDistributionChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenderDistributionChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
