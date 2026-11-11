import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { Subscription } from 'rxjs';

import {
  RewardSettings,
  RewardTier,
  RewardEarningRule,
  CreateRewardEarningRuleRequest,
  UpdateRewardEarningRuleRequest,
  RewardItem,
  RewardItemRequest,
  AdminLocationSummary
} from 'src/app/models/admin.model';

import { WaitListAdminService } from 'src/app/services/wait-list-admin.service';
import { AdminLocationContextService } from 'src/app/services/admin-location-context.service';

@Component({
  selector: 'app-admin-reward-program',
  templateUrl: './admin-reward-program.component.html',
  styleUrls: ['./admin-reward-program.component.css']
})
export class AdminRewardProgramComponent implements OnInit, OnDestroy {
  tiers: RewardTier[] = [];
  waysToEarn: RewardEarningRule[] = [];
  rewardItems: RewardItem[] = [];

  redemptionSettings: RewardSettings = {
    preventDuplicateRedemptionsWithinVisit: false
  };

  rewardForm!: FormGroup;
  wayToEarnForm!: FormGroup;
  rewardItemForm!: FormGroup;

  selectedLocation: AdminLocationSummary | null = null;
  selectedLocationId: number | null = null;
  locations: AdminLocationSummary[] = [];

  showAddWayModal = false;
  showEditWayModal = false;

  showRewardModal = false;
  showDeleteRewardModal = false;

  selectedEarningRule: RewardEarningRule | null = null;
  selectedRewardItem: RewardItem | null = null;
  deleteRewardTarget: RewardItem | null = null;

  isRewardEditMode = false;

  isLoading = false;
  isTiersLoading = false;
  isWaysLoading = false;
  isRewardItemsLoading = false;

  isSavingWay = false;
  isSavingRewardItem = false;
  isDeletingRewardItem = false;

  successMessage = '';
  errorMessage = '';

  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private rewardService: WaitListAdminService,
    private locationContext: AdminLocationContextService
  ) {}

  ngOnInit(): void {
    this.initializeForms();

    this.subscriptions.add(
      this.locationContext.locations$.subscribe(locations => {
        this.locations = locations || [];

        if (!this.locations.length) {
          this.locationContext.loadLocations();
        }
      })
    );

    this.subscriptions.add(
      this.locationContext.selectedLocation$.subscribe(location => {
        const previousLocationId = this.selectedLocationId;

        this.selectedLocation = location;
        this.selectedLocationId = location?.id || null;

        if (!location) {
          this.rewardItems = [];
          return;
        }

        if (previousLocationId !== location.id) {
          this.loadRewardItems();
        }
      })
    );

    this.loadTiers();
    this.loadWaysToEarn();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private initializeForms(): void {
    this.rewardForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      points: [0, [Validators.required, Validators.min(0)]],
      perks: ['', Validators.required]
    });

    this.wayToEarnForm = this.fb.group({
      action: ['', [Validators.required, Validators.maxLength(100)]],
      pointsValue: [0, [Validators.required, Validators.min(0)]],
      description: ['', Validators.maxLength(500)],
    });

    this.rewardItemForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      pointsCost: [0, [Validators.required, Validators.min(0)]],
      category: ['', [Validators.required, Validators.maxLength(50)]],
      available: [true]
    });
  }

  selectLocation(location: AdminLocationSummary): void {
    this.locationContext.selectLocation(location);
  }

  loadTiers(): void {
    this.isTiersLoading = true;
    this.updateOverallLoadingState();

    this.rewardService.getRewardTiers(0, 20).subscribe({
      next: response => {
        this.isTiersLoading = false;

        if (response?.success && response.data) {
          this.tiers = response.data.content || [];
        } else {
          this.tiers = [];
          this.showError(
            response?.message || 'Unable to load reward tiers.'
          );
        }

        this.updateOverallLoadingState();
      },
      error: error => {
        console.error('Get reward tiers error:', error);

        this.isTiersLoading = false;
        this.tiers = [];

        this.showError(
          error?.error?.message || 'Unable to load reward tiers.'
        );

        this.updateOverallLoadingState();
      }
    });
  }

  loadWaysToEarn(): void {
    this.isWaysLoading = true;
    this.updateOverallLoadingState();

    this.rewardService.getRewardEarningRules(0, 20).subscribe({
      next: response => {
        this.isWaysLoading = false;

        if (response?.success && response.data) {
          this.waysToEarn = response.data.content || [];
        } else {
          this.waysToEarn = [];

          this.showError(
            response?.message || 'Unable to load earning rules.'
          );
        }

        this.updateOverallLoadingState();
      },
      error: error => {
        console.error('Get earning rules error:', error);

        this.isWaysLoading = false;
        this.waysToEarn = [];

        this.showError(
          error?.error?.message || 'Unable to load earning rules.'
        );

        this.updateOverallLoadingState();
      }
    });
  }

  loadRewardItems(): void {
    if (!this.selectedLocationId) {
      this.rewardItems = [];
      return;
    }

    this.isRewardItemsLoading = true;
    this.updateOverallLoadingState();

    this.rewardService
      .getRewardItems(
        this.selectedLocationId,
        0,
        20,
        undefined,
        true
      )
      .subscribe({
        next: response => {
          this.isRewardItemsLoading = false;

          if (response?.success && response.data) {
            this.rewardItems = response.data.content || [];
          } else {
            this.rewardItems = [];

            this.showError(
              response?.message ||
              'Unable to load redemption rewards.'
            );
          }

          this.updateOverallLoadingState();
        },
        error: error => {
          console.error(
            'Get reward items error:',
            error
          );

          this.isRewardItemsLoading = false;
          this.rewardItems = [];

          this.showError(
            error?.error?.message ||
            'Unable to load redemption rewards.'
          );

          this.updateOverallLoadingState();
        }
      });
  }

  private updateOverallLoadingState(): void {
    this.isLoading =
      this.isTiersLoading ||
      this.isWaysLoading ||
      this.isRewardItemsLoading;
  }

  openAddWayToEarn(): void {
    this.clearMessages();

    this.wayToEarnForm.reset({
      label: '',
      pointsValue: 0,
      description: '',
      clickable: true,
      imageurl: ''
    });

    this.showAddWayModal = true;
  }

  closeAddWayModal(): void {
    if (this.isSavingWay) {
      return;
    }

    this.showAddWayModal = false;
    this.resetWayToEarnForm();
  }

  createWayToEarn(): void {
    if (
      this.wayToEarnForm.invalid ||
      this.isSavingWay
    ) {
      this.wayToEarnForm.markAllAsTouched();
      return;
    }

    if (!this.selectedLocationId) {
      this.showError(
        'Please select a restaurant before creating an earning rule.'
      );
      return;
    }

    const formValue =
      this.wayToEarnForm.getRawValue();

    const request: CreateRewardEarningRuleRequest = {
      action: String(formValue.action).trim(),
      pointsValue: Number(formValue.pointsValue),
      restaurantId: this.selectedLocationId,
      description: String(
        formValue.description || ''
      ).trim()
    };

    this.isSavingWay = true;
    this.clearMessages();

    this.rewardService
      .createRewardEarningRule(request)
      .subscribe({
        next: response => {
          this.isSavingWay = false;

          if (response?.success === false) {
            this.showError(
              response.message ||
              'Unable to create earning rule.'
            );
            return;
          }

          this.showAddWayModal = false;
          this.resetWayToEarnForm();

          this.showSuccess(
            response?.message ||
            'Earning rule created successfully.'
          );

          this.loadWaysToEarn();
        },
        error: error => {
          console.error(
            'Create earning rule error:',
            error
          );

          this.isSavingWay = false;

          this.showError(
            error?.error?.message ||
            'Unable to create earning rule.'
          );
        }
      });
  }

  editWayToEarn(
    rule: RewardEarningRule
  ): void {
    this.clearMessages();

    this.selectedEarningRule = rule;

    this.wayToEarnForm.reset({
      action: rule.action,
      pointsValue: rule.pointsValue,
      description: rule.description || ''
    });

    this.showEditWayModal = true;
  }

  closeEditWayModal(): void {
    if (this.isSavingWay) {
      return;
    }

    this.showEditWayModal = false;
    this.selectedEarningRule = null;
    this.resetWayToEarnForm();
  }

  saveWayToEarn(): void {
    if (
      !this.selectedEarningRule ||
      this.wayToEarnForm.invalid ||
      this.isSavingWay
    ) {
      this.wayToEarnForm.markAllAsTouched();
      return;
    }

    if (!this.selectedLocationId) {
      this.showError(
        'Please select a restaurant before updating an earning rule.'
      );
      return;
    }

    const formValue =
      this.wayToEarnForm.getRawValue();

    const request: UpdateRewardEarningRuleRequest = {
      action: String(formValue.action).trim(),
      pointsValue: Number(formValue.pointsValue),
      restaurantId: this.selectedLocationId,
      description: String(
        formValue.description || ''
      ).trim()
    };

    this.isSavingWay = true;
    this.clearMessages();

    this.rewardService
      .updateRewardEarningRule(
        this.selectedEarningRule.id,
        request
      )
      .subscribe({
        next: response => {
          this.isSavingWay = false;

          if (response?.success === false) {
            this.showError(
              response.message ||
              'Unable to update earning rule.'
            );
            return;
          }

          this.showEditWayModal = false;
          this.selectedEarningRule = null;
          this.resetWayToEarnForm();

          this.showSuccess(
            response?.message ||
            'Earning rule updated successfully.'
          );

          this.loadWaysToEarn();
        },
        error: error => {
          console.error(
            'Update earning rule error:',
            error
          );

          this.isSavingWay = false;

          this.showError(
            error?.error?.message ||
            'Unable to update earning rule.'
          );
        }
      });
  }

  openAddReward(): void {
    if (!this.selectedLocationId) {
      this.showError(
        'Please select a restaurant before adding a reward.'
      );
      return;
    }

    this.clearMessages();
    this.selectedRewardItem = null;
    this.isRewardEditMode = false;

    this.rewardItemForm.reset({
      title: '',
      description: '',
      pointsCost: 0,
      category: 'beverage',
      available: true
    });

    this.showRewardModal = true;
  }

  editReward(item: RewardItem): void {
    this.clearMessages();

    this.selectedRewardItem = item;
    this.isRewardEditMode = true;

    this.rewardItemForm.reset({
      title: item.title,
      description: item.description || '',
      pointsCost: item.pointsCost,
      category: item.category || '',
      available: item.available
    });

    this.showRewardModal = true;
  }

  closeRewardModal(): void {
    if (this.isSavingRewardItem) {
      return;
    }

    this.showRewardModal = false;
    this.selectedRewardItem = null;
    this.isRewardEditMode = false;

    this.resetRewardItemForm();
  }

  saveRewardItem(): void {
    if (
      this.rewardItemForm.invalid ||
      this.isSavingRewardItem
    ) {
      this.rewardItemForm.markAllAsTouched();
      return;
    }

    if (!this.selectedLocationId) {
      this.showError(
        'Please select a restaurant before saving the reward.'
      );
      return;
    }

    const formValue =
      this.rewardItemForm.getRawValue();

    const request: RewardItemRequest = {
      title: String(formValue.title).trim(),
      description: String(
        formValue.description || ''
      ).trim(),
      pointsCost: Number(formValue.pointsCost),
      restaurantId: this.selectedLocationId,
      category: String(formValue.category).trim(),
      available: Boolean(formValue.available)
    };

    this.isSavingRewardItem = true;
    this.clearMessages();

    if (
      this.isRewardEditMode &&
      this.selectedRewardItem
    ) {
      this.updateRewardItem(
        this.selectedRewardItem.id,
        request
      );
      return;
    }

    this.rewardService
      .createRewardItem(request)
      .subscribe({
        next: response => {
          this.isSavingRewardItem = false;

          if (response?.success === false) {
            this.showError(
              response.message ||
              'Unable to create reward item.'
            );
            return;
          }

          this.showRewardModal = false;
          this.selectedRewardItem = null;
          this.isRewardEditMode = false;
          this.resetRewardItemForm();

          this.showSuccess(
            response?.message ||
            'Reward added successfully.'
          );

          this.loadRewardItems();
        },
        error: error => {
          console.error(
            'Create reward item error:',
            error
          );

          this.isSavingRewardItem = false;

          this.showError(
            error?.error?.message ||
            'Unable to create reward item.'
          );
        }
      });
  }

  private updateRewardItem(
    itemId: number,
    request: RewardItemRequest
  ): void {
    this.rewardService
      .updateRewardItem(itemId, request)
      .subscribe({
        next: response => {
          this.isSavingRewardItem = false;

          if (response?.success === false) {
            this.showError(
              response.message ||
              'Unable to update reward item.'
            );
            return;
          }

          this.showRewardModal = false;
          this.selectedRewardItem = null;
          this.isRewardEditMode = false;
          this.resetRewardItemForm();

          this.showSuccess(
            response?.message ||
            'Reward updated successfully.'
          );

          this.loadRewardItems();
        },
        error: error => {
          console.error(
            'Update reward item error:',
            error
          );

          this.isSavingRewardItem = false;

          this.showError(
            error?.error?.message ||
            'Unable to update reward item.'
          );
        }
      });
  }

  openDeleteRewardModal(
    item: RewardItem
  ): void {
    if (
      this.isDeletingRewardItem ||
      this.isSavingRewardItem
    ) {
      return;
    }

    this.clearMessages();

    this.deleteRewardTarget = item;
    this.showDeleteRewardModal = true;
  }

  closeDeleteRewardModal(): void {
    if (this.isDeletingRewardItem) {
      return;
    }

    this.showDeleteRewardModal = false;
    this.deleteRewardTarget = null;
  }

  confirmDeleteReward(): void {
    if (
      !this.deleteRewardTarget ||
      this.isDeletingRewardItem
    ) {
      return;
    }

    const itemId =
      this.deleteRewardTarget.id;

    this.isDeletingRewardItem = true;
    this.clearMessages();

    this.rewardService
      .deleteRewardItem(itemId)
      .subscribe({
        next: response => {
          this.isDeletingRewardItem = false;

          if (response?.success === false) {
            this.showError(
              response.message ||
              'Unable to delete reward.'
            );
            return;
          }

          this.rewardItems =
            this.rewardItems.filter(
              item => item.id !== itemId
            );

          this.showDeleteRewardModal = false;
          this.deleteRewardTarget = null;

          this.showSuccess(
            response?.message ||
            'Reward deleted successfully.'
          );
        },
        error: error => {
          console.error(
            'Delete reward item error:',
            error
          );

          this.isDeletingRewardItem = false;

          this.showError(
            error?.error?.message ||
            'Unable to delete reward.'
          );
        }
      });
  }

  isRewardInvalid(
    controlName: string
  ): boolean {
    const control =
      this.rewardItemForm.get(controlName);

    return !!control &&
      control.invalid &&
      control.touched;
  }

  isWayInvalid(
    controlName: string
  ): boolean {
    const control =
      this.wayToEarnForm.get(controlName);

    return !!control &&
      control.invalid &&
      control.touched;
  }

  private resetWayToEarnForm(): void {
    this.wayToEarnForm.reset({
      label: '',
      pointsValue: 0,
      description: '',
      clickable: true,
      imageurl: ''
    });
  }

  private resetRewardItemForm(): void {
    this.rewardItemForm.reset({
      title: '',
      description: '',
      pointsCost: 0,
      category: 'beverage',
      available: true
    });
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  private showSuccess(
    message: string
  ): void {
    this.successMessage = message;
    this.errorMessage = '';

    setTimeout(() => {
      this.successMessage = '';
    }, 4000);
  }

  private showError(
    message: string
  ): void {
    this.errorMessage = message;
    this.successMessage = '';

    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }
}