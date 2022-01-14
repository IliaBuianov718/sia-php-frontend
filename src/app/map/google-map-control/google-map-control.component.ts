import {Component, ElementRef, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {GoogleMap} from '@angular/google-maps';
import ControlPosition = google.maps.ControlPosition;



@Component({
  selector: 'google-map-control',
  templateUrl: './google-map-control.component.html',
  styleUrls: ['./google-map-control.component.css']
})
export class GoogleMapControlComponent implements OnInit {
  @Input() map!: GoogleMap;
  @Input() style!: Partial<CSSStyleDeclaration>;
  @Input() title!: string;
  @Input() buttonText!: string;
  @Input() textStyle!: Partial<CSSStyleDeclaration>;
  @Input() position!: ControlPosition;
  @Output() click: EventEmitter<MouseEvent> = new EventEmitter<MouseEvent>();
  constructor(
    private el: ElementRef
  ) {

  }

  ngOnInit(): void {
    const controlUI = document.createElement('div');
    Object.keys(this.style).forEach((s: any) => {
      (controlUI.style as any)[s] = this.style[s];
    });
    controlUI.title = this.title;
    this.el.nativeElement.appendChild(controlUI);

    const controlText = document.createElement('div');
    Object.keys(this.style).forEach((s: any) => {
      (controlText.style as any)[s] = this.textStyle[s];
    });
    controlUI.innerHTML = this.buttonText;
    controlUI.appendChild(controlText);

    this.map.controls[this.position || google.maps.ControlPosition.TOP_CENTER].push(this.el.nativeElement);
  }

}
