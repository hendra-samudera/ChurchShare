import { Injectable } from '@angular/core';

export interface WhatsAppShareConfig {
  permanentUrl: string;
  documentTitle: string;
  customMessage?: string;
}

@Injectable({ providedIn: 'root' })
export class WhatsAppShareService {
  /**
   * Generate pre-composed WhatsApp message
   * PRD: Warm, plain language, emphasizes link always works
   */
  generateMessage(config: WhatsAppShareConfig): string {
    const { permanentUrl, documentTitle, customMessage } = config;
    
    if (customMessage) {
      return `${customMessage}\n\n${permanentUrl}`;
    }

    // Default warm message per PRD
    return `📋 ${documentTitle} is ready!\n\n` +
      `Read it here (link always works, even next week):\n` +
      `${permanentUrl}`;
  }

  /**
   * Generate WhatsApp deep link
   * Works on mobile and desktop
   */
  getWhatsAppLink(message: string): string {
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/?text=${encodedMessage}`;
  }

  /**
   * Open WhatsApp share dialog
   * Uses Web Share API if available, falls back to deep link
   */
  async share(config: WhatsAppShareConfig): Promise<void> {
    const message = this.generateMessage(config);

    // Try Web Share API first (mobile native share)
    if (navigator.share) {
      try {
        await navigator.share({
          title: config.documentTitle,
          text: message,
          url: config.permanentUrl,
        });
        return;
      } catch {
        // User cancelled or Web Share not available for WhatsApp
      }
    }

    // Fallback: open WhatsApp deep link in new tab
    const whatsappUrl = this.getWhatsAppLink(message);
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }
}
