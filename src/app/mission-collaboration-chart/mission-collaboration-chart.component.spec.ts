import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MissionCollaborationChartComponent } from './mission-collaboration-chart.component';

describe('MissionCollaborationChartComponent', () => {
  let component: MissionCollaborationChartComponent;
  let fixture: ComponentFixture<MissionCollaborationChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissionCollaborationChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MissionCollaborationChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
