import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';

/**
 * Legacy Create Slot Component
 * Redirects to the new dashboard-integrated slot creation page.
 * Kept for backward compatibility with old bookmarks/links.
 */
@Component({
  selector: 'app-create-slot',
  standalone: true,
  imports: [SpinnerComponent],
  template: `
    <div class="redirect-container" role="status" aria-live="polite">
      <app-spinner text="Redirecting to Create Slot page..." />
    </div>
  `,
  styles: [`
    .redirect-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background-color: #f8f9fa;
    }
  `],
})
export class CreateSlotComponent implements OnInit {
  private readonly router = inject(Router);

  ngOnInit(): void {
    // Redirect to the new dashboard-integrated route
    this.router.navigate(['/admin/dashboard/new-slot'], { replaceUrl: true });
  }
}
