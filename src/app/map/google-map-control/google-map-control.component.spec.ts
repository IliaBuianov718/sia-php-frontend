import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoogleMapControlComponent } from './google-map-control.component';

describe('GoogleMapControlComponent', () => {
  let component: GoogleMapControlComponent;
  let fixture: ComponentFixture<GoogleMapControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GoogleMapControlComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GoogleMapControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
