import { Component, input, output } from '@angular/core';
import { Slot } from '@models/slot.model';
import { SlotCardComponent } from '../slot-card/slot-card.component';

@Component({
  selector: 'app-slot-card-grid',
  standalone: true,
  imports: [SlotCardComponent],
  template: `
    <div class="slot-grid" role="list">
      @for (slot of slots(); track slot.id) {
        <div role="listitem">
          <app-slot-card
            [slot]="slot"
            [isUploading]="uploadingSlotId() === slot.id"
            [uploadProgress]="uploadProgress()"
            (uploadClick)="onUploadClick($event)"
            (previewClick)="onPreviewClick($event)"
            (copyLinkClick)="onCopyLinkClick($event)"
            (menuAction)="onMenuAction($event)" />
        </div>
      }
    </div>
  `,
  styles: [`
    .slot-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    @media (max-width: 1200px) {
      .slot-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .slot-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class SlotCardGridComponent {
  slots = input.required<Slot[]>();
  uploadingSlotId = input<string | null>(null);
  uploadProgress = input<number>(0);

  uploadClick = output<string>();
  previewClick = output<string>();
  copyLinkClick = output<string>();
  menuAction = output<{ action: string; slotId: string }>();

  onUploadClick(slotId: string): void {
    this.uploadClick.emit(slotId);
  }

  onPreviewClick(slug: string): void {
    this.previewClick.emit(slug);
  }

  onCopyLinkClick(url: string): void {
    this.copyLinkClick.emit(url);
  }

  onMenuAction(event: { action: string; slotId: string }): void {
    this.menuAction.emit(event);
  }
}
