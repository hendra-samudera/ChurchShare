import { Component, input } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  template: `
    <div 
      class="progress-container" 
      role="progressbar"
      [attr.aria-valuenow]="progress()"
      [attr.aria-valuemin]="0"
      [attr.aria-valuemax]="100"
      [attr.aria-label]="ariaLabel()">
      <div class="progress-bar" [style.width.%]="progress()"></div>
      @if (showLabel()) {
        <span class="progress-label">{{ progressLabel() || progress() + '%' }}</span>
      }
    </div>
  `,
  styles: [`
    .progress-container {
      width: 100%;
      height: 8px;
      background-color: var(--color-surface);
      border-radius: var(--radius-sm);
      overflow: hidden;
      position: relative;
    }

    .progress-bar {
      height: 100%;
      background-color: var(--color-primary);
      transition: width var(--transition-normal);
      border-radius: var(--radius-sm);
    }

    .progress-label {
      position: absolute;
      top: -24px;
      right: 0;
      font-size: var(--font-size-body);
      color: var(--color-text-primary);
      font-weight: 500;
    }
  `],
})
export class ProgressBarComponent {
  progress = input.required<number>();
  showLabel = input<boolean>(false);
  progressLabel = input<string>('');
  ariaLabel = input<string>('Upload progress');
}
