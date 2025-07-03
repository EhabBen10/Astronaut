import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DenmarkMapComponent } from './denmark-map.component';

describe('DenmarkMapComponent', () => {
  let component: DenmarkMapComponent;
  let fixture: ComponentFixture<DenmarkMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DenmarkMapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DenmarkMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
