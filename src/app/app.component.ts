import { Component } from '@angular/core';
import { DenmarkMapComponent } from './denmark-map/denmark-map.component';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  imports: [DenmarkMapComponent, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'visulation';
}
