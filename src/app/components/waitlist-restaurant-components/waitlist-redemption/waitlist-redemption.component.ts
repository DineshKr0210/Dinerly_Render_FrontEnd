import { Component, OnDestroy, OnInit } from '@angular/core';
import { Html5Qrcode } from 'html5-qrcode';
import { WaitlistApiRestaurantService } from 'src/app/services/waitlist-api-restaurant.service';
import { WaitlistAuthService } from 'src/app/services/waitlist-auth.service';

@Component({
  selector: 'app-waitlist-redemption',
  templateUrl: './waitlist-redemption.component.html',
  styleUrls: ['./waitlist-redemption.component.css']
})
export class WaitlistRedemptionComponent implements OnInit, OnDestroy {
  restaurantId = 1;

  offerCode = '';
  offerGuestPhone = '';
  isValidatingOfferCode = false;
  offerValidationMessage = '';
  offerValidationSuccess = false;

  campaignCode = '';
  isValidatingCampaignCode = false;
  campaignValidationMessage = '';
  campaignValidationSuccess = false;

  offerValidationMode: 'CODE' | 'QR' = 'CODE';
  isScanningOfferQr = false;
  isValidatingOfferQr = false;
  private offerQrScanner: Html5Qrcode | null = null;
  private lastScannedQr = '';

  constructor(
    private waitlistApi: WaitlistApiRestaurantService,
    private auth: WaitlistAuthService
  ) { }

  ngOnInit(): void {
    this.restaurantId = this.auth.getRestaurantId();
  }

  ngOnDestroy(): void {
    void this.stopOfferQrScanner();
  }

  validateOfferCode(): void {
    const code = this.offerCode.trim();

    if (!code) {
      this.offerValidationSuccess = false;
      this.offerValidationMessage = 'Please enter an offer code.';
      return;
    }

    if (this.isValidatingOfferCode) {
      return;
    }

    this.isValidatingOfferCode = true;
    this.offerValidationMessage = '';

    this.waitlistApi.validateOfferCode(this.restaurantId, code).subscribe({
      next: (response: any) => {
        this.isValidatingOfferCode = false;

        if (response?.success === false) {
          this.offerValidationSuccess = false;
          this.offerValidationMessage = response?.message || 'Offer code is not valid.';
          return;
        }

        this.offerValidationSuccess = true;
        this.offerValidationMessage = response?.message || 'Offer code is valid.';
      },
      error: (error: any) => {
        this.isValidatingOfferCode = false;
        this.offerValidationSuccess = false;
        this.offerValidationMessage =
          error?.error?.message ||
          error?.message ||
          'Unable to validate offer code.';
      }
    });
  }

  validateCampaignCode(): void {
    const code = this.campaignCode.trim();
    const guestPhone = this.offerGuestPhone.trim();

    if (!code) {
      this.campaignValidationSuccess = false;
      this.campaignValidationMessage = 'Please enter a campaign code.';
      return;
    }

    if (!guestPhone) {
      this.campaignValidationSuccess = false;
      this.campaignValidationMessage = 'Please enter the guest phone number.';
      return;
    }

    if (this.isValidatingCampaignCode) {
      return;
    }

    this.isValidatingCampaignCode = true;
    this.campaignValidationMessage = '';

    this.waitlistApi.validateCampaignCode(this.restaurantId, code, guestPhone).subscribe({
      next: (response: any) => {
        this.isValidatingCampaignCode = false;

        if (response?.success === false) {
          this.campaignValidationSuccess = false;
          this.campaignValidationMessage = response?.message || 'Campaign code is not valid.';
          return;
        }

        this.campaignValidationSuccess = true;
        this.campaignValidationMessage = response?.message || 'Campaign code is valid.';
      },
      error: (error: any) => {
        this.isValidatingCampaignCode = false;
        this.campaignValidationSuccess = false;
        this.campaignValidationMessage =
          error?.error?.message ||
          error?.message ||
          'Unable to validate campaign code.';
      }
    });
  }

  clearOfferValidation(): void {
    this.offerValidationMessage = '';
  }

  clearCampaignValidation(): void {
    this.campaignValidationMessage = '';
  }

  setOfferValidationMode(mode: 'CODE' | 'QR'): void {
    if (this.offerValidationMode === mode) {
      return;
    }

    this.offerValidationMode = mode;
    this.clearOfferValidation();

    if (mode === 'CODE') {
      void this.stopOfferQrScanner();
    }
  }

  async startOfferQrScanner(): Promise<void> {
    if (this.isScanningOfferQr || this.isValidatingOfferQr) {
      return;
    }

    this.lastScannedQr = '';
    this.isScanningOfferQr = true;

    try {
      this.offerQrScanner = new Html5Qrcode('offer-qr-reader');

      await this.offerQrScanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        decodedText => {
          if (!decodedText || this.lastScannedQr) {
            return;
          }

          this.lastScannedQr = decodedText;
          void this.stopOfferQrScanner();
          this.validateScannedOfferQr(decodedText);
        },
        () => { }
      );
    } catch (error) {
      this.isScanningOfferQr = false;
      this.offerValidationSuccess = false;
      this.offerValidationMessage = 'Unable to access the camera. Check camera permission or try another device.';
      console.error('QR scanner error:', error);
    }
  }

  async stopOfferQrScanner(): Promise<void> {
    const scanner = this.offerQrScanner;
    this.offerQrScanner = null;
    this.isScanningOfferQr = false;

    if (!scanner) {
      return;
    }

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }

      scanner.clear();
    } catch (error) {
      console.warn('Unable to stop QR scanner cleanly:', error);
    }
  }

  private validateScannedOfferQr(code: string): void {
    const trimmedCode = code.trim();

    if (!trimmedCode) {
      this.isValidatingOfferQr = false;
      this.offerValidationSuccess = false;
      this.offerValidationMessage = 'Unable to retrieve a valid code from the scanned QR.';
      return;
    }

    this.isValidatingOfferQr = true;
    this.offerValidationMessage = '';
    this.offerValidationSuccess = false;

    this.waitlistApi.validateOfferCode(this.restaurantId, trimmedCode).subscribe({
      next: (response: any) => {
        this.isValidatingOfferQr = false;

        if (response?.success === false) {
          this.offerValidationSuccess = false;
          this.offerValidationMessage = response?.message || 'Offer code is not valid.';
          return;
        }

        this.offerValidationSuccess = true;
        this.offerValidationMessage = response?.message || 'Offer code is valid.';
      },
      error: (error: any) => {
        this.isValidatingOfferQr = false;
        this.offerValidationSuccess = false;
        this.offerValidationMessage =
          error?.error?.message ||
          error?.message ||
          'Unable to validate scanned offer code.';
        console.error('Offer code validation error:', error);
      }
    });
  }
}
