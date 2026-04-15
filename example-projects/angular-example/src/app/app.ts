import { Component, signal } from '@angular/core';
import { TightsetComponent } from './tightset.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [TightsetComponent, FormsModule],
  template: `
    <div class="wrapper">
      <div class="header">
        <svg viewBox="0 0 400 400" width="40" height="40"><rect x="16" y="16" width="368" height="368" rx="32" fill="#0a0a0a" stroke="#333" stroke-width="2"/><text x="200" y="168" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="107" font-weight="700" fill="#ffffff" letter-spacing="-0.03em">TIGHT</text><text x="200" y="308" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="172" font-weight="900" fill="#ffffff" letter-spacing="-0.03em">SET</text></svg>
        <span class="sep">×</span>
        <svg viewBox="0 0 24 24" width="36" height="36" fill="#DD0031"><path d="M16.712 17.711H7.288l-1.204 2.916L12 24l5.916-3.373-1.204-2.916ZM14.692 0l7.832 16.855.814-12.856L14.692 0ZM9.308 0 .662 3.999l.814 12.856L9.308 0Zm-.405 13.93h6.198L12 6.396 8.903 13.93Z"/></svg>
        <h1>Angular</h1>
      </div>
      <input [(ngModel)]="text" />
      @if (fontsReady()) {
        <tightset
          [text]="text"
          [width]="800"
          [height]="400"
          fontFamily="Inter"
          color="#ffffff"
          background="#0d0d0d"
          [maxWeight]="900"
          [spread]="150"
        />
      }
    </div>
  `,
  styles: [`
    .wrapper {
      min-height: 100vh;
      background: #0a0a0a;
      color: #fff;
      font-family: Inter, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      gap: 2rem;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .sep { font-size: 1.5rem; font-weight: 300; color: #555; }
    h1 { font-weight: 300; color: #666; margin: 0; }
    input {
      width: 400px;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      border: 1px solid #333;
      background: #111;
      color: #fff;
      font-size: 1rem;
      font-family: inherit;
    }
  `],
})
export class App {
  text = 'Every Line Fills The Width';
  fontsReady = signal(false);

  constructor() {
    document.fonts.ready.then(() => this.fontsReady.set(true));
  }
}
