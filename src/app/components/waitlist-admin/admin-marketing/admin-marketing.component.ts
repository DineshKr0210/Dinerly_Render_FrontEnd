import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AdminLocationSummary, MarketingCampaign, MarketingCampaignRequest, MarketingCampaignSendRequest, MarketingCustomer, MarketingSummary, MarketingTemplate, MarketingTemplateRequest, MarketingTemplateUpdateRequest } from 'src/app/models/admin.model';
import { AdminLocationContextService } from 'src/app/services/admin-location-context.service';

import { WaitListAdminService } from 'src/app/services/wait-list-admin.service';

type MarketingTab = 'campaigns' | 'templates';
type CampaignModalMode = 'details' | 'edit' | 'send';

@Component({
  selector: 'app-admin-marketing',
  templateUrl: './admin-marketing.component.html',
  styleUrls: ['./admin-marketing.component.css']
})
export class AdminMarketingComponent implements OnInit {
  locations: AdminLocationSummary[] = [];
  selectedLocationId: number | null = null;

  activeTab: MarketingTab = 'campaigns';

  summary: MarketingSummary | null = null;
  templates: MarketingTemplate[] = [];
  campaigns: MarketingCampaign[] = [];
  customers: MarketingCustomer[] = [];

  selectedStatus = '';
  selectedChannel = '';

  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;

  customerCurrentPage = 0;
  customerPageSize = 20;
  customerTotalPages = 0;
  customerTotalElements = 0;

  loadingLocations = false;
  loadingSummary = false;
  loadingTemplates = false;
  loadingCampaigns = false;
  loadingCampaignDetails = false;
  loadingCustomers = false;

  savingCampaign = false;
  savingTemplate = false;
  deletingTemplate = false;
  publishingCampaign = false;
  sendingCampaign = false;

  errorMessage = '';
  successMessage = '';

  showCampaignModal = false;
  showTemplateModal = false;

  campaignModalMode: CampaignModalMode = 'details';

  selectedCampaign: MarketingCampaign | null = null;
  editingCampaign: MarketingCampaign | null = null;
  editingTemplate: MarketingTemplate | null = null;

  selectedCustomerPhones: string[] = [];
  selectAllCustomers = false;

  private subscriptions = new Subscription();
  isLocationsLoading = false;
  selectedLocation: AdminLocationSummary | null = null;

  campaignForm: MarketingCampaignRequest = {
    name: '',
    channel: 'SMS',
    audience: 'ALL',
    templateId: 0,
    message: '',
    restaurantId: 0,
    scheduledAt: '',
    endDate: '',
    hasRedemptionCode: false,
    redemptionCode: ''
  };

  templateForm: MarketingTemplateRequest = {
    templateType: '',
    messageTemplate: '',
    description: ''
  };



  constructor(
    private marketingService: WaitListAdminService, private locationContext: AdminLocationContextService
  ) { }

  ngOnInit(): void {
    this.loadLocations();
    this.loadTemplates();
    this.loadSummary();
    this.subscriptions.add(
      this.locationContext.locations$.subscribe(locations => {
        this.locations = locations;
        this.isLocationsLoading = false;
      })
    );

    this.subscriptions.add(
      this.locationContext.isLoadingLocations$.subscribe(isLoading => {
        this.isLocationsLoading = isLoading;
      })
    );

    this.subscriptions.add(
      this.locationContext.selectedLocation$.subscribe(location => {
        if (!location) {
          this.selectedLocation = null;
          this.selectedLocationId = null;
          return;
        }

        const locationChanged =
          this.selectedLocationId !== location.id;

        this.selectedLocation = location;
        this.selectedLocationId = location.id;

        if (locationChanged) {
          this.loadCampaigns();
          this.loadSummary();
          this.loadTemplates();
        }
      })
    );

    if (!this.locationContext.getCurrentLocations().length) {
      this.locationContext.loadLocations();
    }
  }

  setActiveTab(tab: MarketingTab): void {
    this.activeTab = tab;
    this.clearMessages();

    if (tab === 'campaigns') {
      this.loadCampaigns();
    }

    if (tab === 'templates' && !this.templates.length) {
      this.loadTemplates();
    }
  }

  loadLocations(): void {
    this.loadingLocations = true;
    this.errorMessage = '';

    this.marketingService
      .getLocations()
      .pipe(
        finalize(() => {
          this.loadingLocations = false;
        })
      )
      .subscribe({
        next: response => {
          if (!response?.success) {
            this.locations = [];
            this.selectedLocationId = null;
            this.showError(
              response?.message || 'Unable to load locations.'
            );
            return;
          }

          this.locations = response.data?.locations || [];

          if (!this.locations.length) {
            this.selectedLocationId = null;
            this.showError('No locations available.');
            return;
          }

          const existingLocation = this.locations.find(
            location => location.id === this.selectedLocationId
          );

          this.selectedLocationId =
            existingLocation?.id ?? this.locations[0].id;

          this.loadCampaigns();
        },
        error: error => {
          console.error('Location API error:', error);
          this.locations = [];
          this.selectedLocationId = null;
          this.showError(
            error?.error?.message ||
            'Unable to load locations.'
          );
        }
      });
  }

  loadSummary(): void {
    this.loadingSummary = true;

    this.marketingService
      .getMarketingSummary()
      .pipe(
        finalize(() => {
          this.loadingSummary = false;
        })
      )
      .subscribe({
        next: response => {
          if (response?.success) {
            this.summary = response.data;
          } else {
            this.summary = null;
            this.showError(
              response?.message ||
              'Unable to load marketing summary.'
            );
          }
        },
        error: error => {
          console.error('Marketing summary error:', error);
          this.summary = null;
          this.showError(
            error?.error?.message ||
            'Unable to load marketing summary.'
          );
        }
      });
  }

  loadTemplates(): void {
    this.loadingTemplates = true;

    this.marketingService
      .getMarketingTemplates()
      .pipe(
        finalize(() => {
          this.loadingTemplates = false;
        })
      )
      .subscribe({
        next: response => {
          if (response?.success) {
            this.templates = response.data || [];
          } else {
            this.templates = [];
            this.showError(
              response?.message ||
              'Unable to load templates.'
            );
          }
        },
        error: error => {
          console.error(
            'Marketing templates error:',
            error
          );

          this.templates = [];

          this.showError(
            error?.error?.message ||
            'Unable to load templates.'
          );
        }
      });
  }

  loadCampaigns(): void {
    if (this.selectedLocationId === null) {
      this.campaigns = [];
      this.totalPages = 0;
      this.totalElements = 0;
      return;
    }

    this.loadingCampaigns = true;

    this.marketingService
      .getMarketingCampaigns(
        this.selectedLocationId,
        this.selectedStatus,
        this.selectedChannel,
        this.currentPage,
        this.pageSize
      )
      .pipe(
        finalize(() => {
          this.loadingCampaigns = false;
        })
      )
      .subscribe({
        next: response => {
          if (response?.success) {
            this.campaigns =
              response.data?.content || [];

            this.totalPages =
              response.data?.totalPages || 0;

            this.totalElements =
              response.data?.totalElements || 0;
          } else {
            this.campaigns = [];
            this.totalPages = 0;
            this.totalElements = 0;
            this.showError(
              response?.message ||
              'Unable to load campaigns.'
            );
          }
        },
        error: error => {
          console.error(
            'Marketing campaigns error:',
            error
          );

          this.campaigns = [];
          this.totalPages = 0;
          this.totalElements = 0;

          this.showError(
            error?.error?.message ||
            'Unable to load campaigns.'
          );
        }
      });
  }

  onCampaignFilterChange(): void {
    this.currentPage = 0;
    this.loadCampaigns();
  }

  openCampaign(campaign: MarketingCampaign): void {
    this.showCampaignModal = true;
    this.campaignModalMode = 'details';
    this.selectedCampaign = null;
    this.editingCampaign = null;
    this.loadingCampaignDetails = true;
    this.clearMessages();

    this.marketingService
      .getMarketingCampaignById(campaign.id)
      .pipe(
        finalize(() => {
          this.loadingCampaignDetails = false;
        })
      )
      .subscribe({
        next: response => {
          if (!response?.success) {
            this.showError(
              response?.message ||
              'Unable to load campaign details.'
            );
            return;
          }

          this.selectedCampaign = response.data;
        },
        error: error => {
          console.error(
            'Campaign details error:',
            error
          );

          this.showError(
            error?.error?.message ||
            'Unable to load campaign details.'
          );
        }
      });
  }

  openCreateCampaign(): void {
    if (this.selectedLocationId === null) {
      this.showError(
        'Please select a location first.'
      );
      return;
    }

    this.editingCampaign = null;
    this.selectedCampaign = null;

    const template = this.templates[0];

    this.campaignForm = {
      name: '',
      channel: 'SMS',
      audience: 'ALL',
      templateId: template?.id || 0,
      message: template?.messageTemplate || '',
      restaurantId: 0,
      scheduledAt: this.getDefaultScheduledAt(),
      endDate: this.getDefaultEndDate(),
      hasRedemptionCode: false,
      redemptionCode: ''
    };

    this.campaignModalMode = 'edit';
    this.showCampaignModal = true;
    this.clearMessages();
  }

  startEditCampaign(): void {
    if (!this.selectedCampaign) {
      return;
    }

    this.editingCampaign = this.selectedCampaign;

    this.campaignForm = {
      name: this.selectedCampaign.name,
      channel:
        this.selectedCampaign.channels ||
        this.selectedCampaign.channelDisplay ||
        'SMS',
      audience:
        this.selectedCampaign.audience || 'ALL',
      templateId:
        this.selectedCampaign.templateId,
      message:
        this.selectedCampaign.message || '',
      restaurantId:
        this.selectedCampaign.restaurantId,
      scheduledAt:
        this.toDatetimeLocal(
          this.selectedCampaign.scheduledAt
        ),
      endDate:
        this.toDatetimeLocal(
          this.selectedCampaign.endDate
        ),
      hasRedemptionCode:
        this.selectedCampaign.hasRedemptionCode,
      redemptionCode:
        this.selectedCampaign.redemptionCode || ''
    };

    this.campaignModalMode = 'edit';
    this.clearMessages();
  }

  saveCampaign(): void {
    if (!this.campaignForm.name.trim()) {
      this.showError(
        'Please enter campaign name.'
      );
      return;
    }

    if (!this.campaignForm.templateId) {
      this.showError(
        'Please select a template.'
      );
      return;
    }

    if (!this.campaignForm.restaurantId) {
      this.showError(
        'Please enter restaurant ID.'
      );
      return;
    }

    if (!this.campaignForm.message.trim()) {
      this.showError(
        'Please enter campaign message.'
      );
      return;
    }

    if (!this.campaignForm.scheduledAt) {
      this.showError(
        'Please select scheduled date and time.'
      );
      return;
    }

    if (!this.campaignForm.endDate) {
      this.showError(
        'Please select end date.'
      );
      return;
    }

    if (
      this.campaignForm.hasRedemptionCode &&
      !this.campaignForm.redemptionCode.trim()
    ) {
      this.showError(
        'Please enter redemption code.'
      );
      return;
    }

    this.savingCampaign = true;
    this.clearMessages();

    const request: MarketingCampaignRequest = {
      name:
        this.campaignForm.name.trim(),
      channel:
        this.campaignForm.channel,
      audience:
        this.campaignForm.audience,
      templateId:
        Number(this.campaignForm.templateId),
      message:
        this.campaignForm.message.trim(),
      restaurantId:
        Number(this.campaignForm.restaurantId),
      scheduledAt:
        new Date(
          this.campaignForm.scheduledAt
        ).toISOString(),
      endDate:
        new Date(
          this.campaignForm.endDate
        ).toISOString(),
      hasRedemptionCode:
        this.campaignForm.hasRedemptionCode,
      redemptionCode:
        this.campaignForm.hasRedemptionCode
          ? this.campaignForm.redemptionCode.trim()
          : ''
    };

    const request$ = this.editingCampaign
      ? this.marketingService.updateMarketingCampaign(
        this.editingCampaign.id,
        request
      )
      : this.marketingService.createMarketingCampaign(
        request
      );

    request$
      .pipe(
        finalize(() => {
          this.savingCampaign = false;
        })
      )
      .subscribe({
        next: response => {
          if (!response?.success) {
            this.showError(
              response?.message ||
              'Unable to save campaign.'
            );
            return;
          }

          this.showSuccess(
            this.editingCampaign
              ? 'Campaign updated successfully.'
              : 'Campaign created successfully.'
          );

          this.campaignModalMode =
            'details';

          this.editingCampaign = null;

          this.loadCampaigns();
          this.loadSummary();

          if (response.data) {
            this.selectedCampaign =
              response.data;
          } else if (
            this.selectedCampaign
          ) {
            this.openCampaign(
              this.selectedCampaign
            );
          }
        },
        error: error => {
          console.error(
            'Save campaign error:',
            error
          );

          this.showError(
            error?.error?.message ||
            'Unable to save campaign.'
          );
        }
      });
  }

  publishSelectedCampaign(): void {
    if (!this.selectedCampaign) {
      return;
    }

    this.publishingCampaign = true;
    this.clearMessages();

    this.marketingService
      .publishMarketingCampaign(
        this.selectedCampaign.id,
        true
      )
      .pipe(
        finalize(() => {
          this.publishingCampaign = false;
        })
      )
      .subscribe({
        next: response => {
          if (!response?.success) {
            this.showError(
              response?.message ||
              'Unable to publish campaign.'
            );
            return;
          }

          this.showSuccess(
            'Campaign published successfully.'
          );

          this.loadCampaigns();
          this.loadSummary();

          this.openCampaign(
            this.selectedCampaign!
          );
        },
        error: error => {
          console.error(
            'Publish campaign error:',
            error
          );

          this.showError(
            error?.error?.message ||
            'Unable to publish campaign.'
          );
        }
      });
  }

  openSendCampaign(): void {
    if (!this.selectedCampaign) {
      return;
    }

    this.campaignModalMode = 'send';
    this.customers = [];
    this.selectedCustomerPhones = [];
    this.selectAllCustomers = false;
    this.customerCurrentPage = 0;
    this.customerTotalPages = 0;
    this.customerTotalElements = 0;

    this.loadCustomers();
  }

  loadCustomers(): void {
    if (!this.selectedCampaign) {
      return;
    }

    this.loadingCustomers = true;

    this.marketingService
      .getMarketingCustomers(
        this.selectedCampaign.restaurantId,
        this.customerCurrentPage,
        this.customerPageSize
      )
      .pipe(
        finalize(() => {
          this.loadingCustomers = false;
        })
      )
      .subscribe({
        next: response => {
          this.customers =
            response?.content || [];

          this.customerTotalPages =
            response?.totalPages || 0;

          this.customerTotalElements =
            response?.totalElements || 0;

          this.updateSelectAllState();
        },
        error: error => {
          console.error(
            'Customers API error:',
            error
          );

          this.customers = [];
          this.showError(
            error?.error?.message ||
            'Unable to load customers.'
          );
        }
      });
  }

  toggleSelectAllCustomers(): void {
    if (this.selectAllCustomers) {
      this.customers.forEach(customer => {
        this.addCustomerPhone(
          customer.contact
        );
      });
    } else {
      this.customers.forEach(customer => {
        this.removeCustomerPhone(
          customer.contact
        );
      });
    }
  }

  toggleCustomer(
    customer: MarketingCustomer
  ): void {
    if (
      this.isCustomerSelected(
        customer.contact
      )
    ) {
      this.removeCustomerPhone(
        customer.contact
      );
    } else {
      this.addCustomerPhone(
        customer.contact
      );
    }

    this.updateSelectAllState();
  }

  isCustomerSelected(
    phone: string
  ): boolean {
    return this.selectedCustomerPhones.includes(
      phone
    );
  }

  addCustomerPhone(
    phone: string
  ): void {
    if (
      !phone ||
      this.selectedCustomerPhones.includes(
        phone
      )
    ) {
      return;
    }

    this.selectedCustomerPhones.push(
      phone
    );
  }

  removeCustomerPhone(
    phone: string
  ): void {
    this.selectedCustomerPhones =
      this.selectedCustomerPhones.filter(
        item => item !== phone
      );
  }

  updateSelectAllState(): void {
    if (!this.customers.length) {
      this.selectAllCustomers = false;
      return;
    }

    this.selectAllCustomers =
      this.customers.every(customer =>
        this.isCustomerSelected(
          customer.contact
        )
      );
  }

  sendCampaign(): void {
    if (!this.selectedCampaign) {
      return;
    }

    if (
      !this.selectedCustomerPhones.length
    ) {
      this.showError(
        'Please select at least one customer.'
      );
      return;
    }

    const template =
      this.templates.find(
        item =>
          item.id ===
          this.selectedCampaign!.templateId
      );

    const request: MarketingCampaignSendRequest =
    {
      restaurantId:
        this.selectedCampaign.restaurantId,
      templateType:
        template?.templateType ||
        this.selectedCampaign.channelDisplay ||
        'SMS',
      message:
        this.selectedCampaign.message || '',
      phoneNumbers:
        this.selectedCustomerPhones
    };

    this.sendingCampaign = true;
    this.clearMessages();

    this.marketingService
      .sendMarketingCampaign(request)
      .pipe(
        finalize(() => {
          this.sendingCampaign = false;
        })
      )
      .subscribe({
        next: response => {
          if (!response?.success) {
            this.showError(
              response?.message ||
              'Unable to send campaign.'
            );
            return;
          }

          this.showSuccess(
            'Campaign sent successfully.'
          );

          this.campaignModalMode =
            'details';

          this.selectedCustomerPhones = [];
          this.selectAllCustomers = false;

          this.loadCampaigns();
          this.loadSummary();

          if (this.selectedCampaign) {
            this.openCampaign(
              this.selectedCampaign
            );
          }
        },
        error: error => {
          console.error(
            'Send campaign error:',
            error
          );

          this.showError(
            error?.error?.message ||
            'Unable to send campaign.'
          );
        }
      });
  }

  customerNextPage(): void {
    if (
      this.customerCurrentPage + 1 >=
      this.customerTotalPages
    ) {
      return;
    }

    this.customerCurrentPage++;
    this.loadCustomers();
  }

  customerPreviousPage(): void {
    if (
      this.customerCurrentPage <= 0
    ) {
      return;
    }

    this.customerCurrentPage--;
    this.loadCustomers();
  }

  getCustomerPageDisplay(): number {
    return this.customerCurrentPage + 1;
  }

  getCurrentPageDisplay(): number {
    return this.currentPage + 1;
  }

  nextPage(): void {
    if (
      this.currentPage + 1 >=
      this.totalPages
    ) {
      return;
    }

    this.currentPage++;
    this.loadCampaigns();
  }

  previousPage(): void {
    if (
      this.currentPage <= 0
    ) {
      return;
    }

    this.currentPage--;
    this.loadCampaigns();
  }

  openCreateTemplate(): void {
    this.editingTemplate = null;

    this.templateForm = {
      templateType: '',
      messageTemplate: '',
      description: ''
    };

    this.clearMessages();
    this.showTemplateModal = true;
  }

  saveTemplate(): void {
    if (!this.templateForm.templateType.trim()) {
      this.showError(
        'Please enter template type.'
      );
      return;
    }

    if (!this.templateForm.messageTemplate.trim()) {
      this.showError(
        'Please enter template message.'
      );
      return;
    }

    if (!this.templateForm.description.trim()) {
      this.showError(
        'Please enter template description.'
      );
      return;
    }

    this.savingTemplate = true;
    this.clearMessages();

    if (this.editingTemplate) {
      const request: MarketingTemplateUpdateRequest = {
        messageTemplate:
          this.templateForm.messageTemplate.trim(),
        description:
          this.templateForm.description.trim()
      };

      this.marketingService
        .updateMarketingTemplate(
          this.editingTemplate.id,
          request
        )
        .pipe(
          finalize(() => {
            this.savingTemplate = false;
          })
        )
        .subscribe({
          next: response => {
            if (!response?.success) {
              this.showError(
                response?.message ||
                'Unable to update template.'
              );
              return;
            }

            this.showTemplateModal = false;
            this.editingTemplate = null;

            this.showSuccess(
              'Template updated successfully.'
            );

            this.loadTemplates();
          },
          error: error => {
            console.error(
              'Update template error:',
              error
            );

            this.showError(
              error?.error?.message ||
              'Unable to update template.'
            );
          }
        });

      return;
    }

    const request: MarketingTemplateRequest = {
      templateType:
        this.templateForm.templateType.trim(),
      messageTemplate:
        this.templateForm.messageTemplate.trim(),
      description:
        this.templateForm.description.trim()
    };

    this.marketingService
      .createMarketingTemplate(request)
      .pipe(
        finalize(() => {
          this.savingTemplate = false;
        })
      )
      .subscribe({
        next: response => {
          if (!response?.success) {
            this.showError(
              response?.message ||
              'Unable to create template.'
            );
            return;
          }

          this.showTemplateModal = false;
          this.editingTemplate = null;

          this.showSuccess(
            'Template created successfully.'
          );

          this.loadTemplates();
        },
        error: error => {
          console.error(
            'Create template error:',
            error
          );

          this.showError(
            error?.error?.message ||
            'Unable to create template.'
          );
        }
      });
  }

  openEditTemplate(
    template: MarketingTemplate
  ): void {
    this.editingTemplate = template;

    this.templateForm = {
      templateType:
        template.templateType || '',
      messageTemplate:
        template.messageTemplate || '',
      description:
        template.description || ''
    };

    this.clearMessages();
    this.showTemplateModal = true;
  }


  deleteTemplate(
    template: MarketingTemplate
  ): void {
    const confirmed =
      window.confirm(
        `Delete template "${template.templateType}"?`
      );

    if (!confirmed) {
      return;
    }

    this.deletingTemplate = true;
    this.clearMessages();

    this.marketingService
      .deleteMarketingTemplate(
        template.id
      )
      .pipe(
        finalize(() => {
          this.deletingTemplate = false;
        })
      )
      .subscribe({
        next: response => {
          if (!response?.success) {
            this.showError(
              response?.message ||
              'Unable to delete template.'
            );
            return;
          }

          this.showSuccess(
            'Template deleted successfully.'
          );

          this.loadTemplates();
        },
        error: error => {
          console.error(
            'Delete template error:',
            error
          );

          this.showError(
            error?.error?.message ||
            'Unable to delete template.'
          );
        }
      });
  }

  closeCampaignModal(): void {
    if (
      this.savingCampaign ||
      this.sendingCampaign ||
      this.publishingCampaign
    ) {
      return;
    }

    this.showCampaignModal = false;
    this.selectedCampaign = null;
    this.editingCampaign = null;
    this.campaignModalMode = 'details';
    this.selectedCustomerPhones = [];
    this.selectAllCustomers = false;
  }

  closeTemplateModal(): void {
    if (this.savingTemplate) {
      return;
    }

    this.showTemplateModal = false;
    this.editingTemplate = null;

    this.templateForm = {
      templateType: '',
      messageTemplate: '',
      description: ''
    };
  }

  getSelectedLocation():
    AdminLocationSummary | undefined {
    return this.locations.find(
      location =>
        location.id ===
        this.selectedLocationId
    );
  }

  getTemplateName(
    templateId: number
  ): string {
    const template =
      this.templates.find(
        item =>
          item.id === templateId
      );

    return (
      template?.templateType ||
      `Template #${templateId}`
    );
  }

  getCampaignChannel(
    campaign: MarketingCampaign
  ): string {
    return (
      campaign.channelDisplay ||
      campaign.channels ||
      '-'
    );
  }

  getStatusClass(
    status: string
  ): string {
    return (
      status || ''
    ).toLowerCase();
  }

  getDefaultScheduledAt(): string {
    const date = new Date();

    date.setMinutes(
      date.getMinutes() + 30
    );

    return this.toDatetimeLocal(
      date.toISOString()
    );
  }

  getDefaultEndDate(): string {
    const date = new Date();

    date.setDate(
      date.getDate() + 1
    );

    return this.toDatetimeLocal(
      date.toISOString()
    );
  }

  toDatetimeLocal(
    value: string
  ): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return value;
    }

    const offset =
      date.getTimezoneOffset() *
      60000;

    return new Date(
      date.getTime() - offset
    )
      .toISOString()
      .slice(0, 16);
  }

  formatCurrency(
    value: number | null | undefined
  ): string {
    if (
      value === null ||
      value === undefined
    ) {
      return '—';
    }

    return new Intl.NumberFormat(
      'en-CA',
      {
        style: 'currency',
        currency: 'CAD',
        maximumFractionDigits: 0
      }
    ).format(value);
  }

  formatDate(
    value: string
  ): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }
    );
  }

  formatDateTime(
    value: string
  ): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }
    );
  }

  showSuccess(
    message: string
  ): void {
    this.successMessage = message;
    this.errorMessage = '';

    setTimeout(() => {
      this.successMessage = '';
    }, 4000);
  }

  showError(
    message: string
  ): void {
    this.errorMessage = message;
    this.successMessage = '';

    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}