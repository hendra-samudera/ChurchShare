import { Component, input } from '@angular/core';
import { SlotCategory, CATEGORY_COLORS } from '@models/slot.model';

@Component({
  selector: 'app-category-tag',
  standalone: true,
  template: `
    <span
      class="category-tag"
      [style.backgroundColor]="getColor()"
      [attr.aria-label]="'Category: ' + category()">
      {{ category() }}
    </span>
  `,
  styles: [`
    .category-tag {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: var(--radius-full);
      font-size: 0.875rem; /* 14px - acceptable for tags */
      font-weight: 500;
      color: white;
      white-space: nowrap;
    }
  `],
})
export class CategoryTagComponent {
  category = input.required<SlotCategory>();

  getColor(): string {
    return CATEGORY_COLORS[this.category()] || '#6b7280';
  }
}
