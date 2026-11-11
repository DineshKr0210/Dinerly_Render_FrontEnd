import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

import { Subscription } from 'rxjs';

import {
  AdminLocationSummary,
  AdminStaff,
  CreateStaffRequest,
  UpdateStaffRequest,
  StaffPermission,
  UpdateStaffPermissionRequest,
  StaffActivity,
  StaffRole
} from 'src/app/models/admin.model';

import {
  WaitListAdminService
} from 'src/app/services/wait-list-admin.service';

import {
  AdminLocationContextService
} from 'src/app/services/admin-location-context.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit, OnDestroy {

  staff: AdminStaff[] = [];
  allStaff: AdminStaff[] = [];

  locations: AdminLocationSummary[] = [];

  selectedLocation: AdminLocationSummary | null = null;
  selectedLocationId: number | null = null;

  roles: StaffRole[] = [];

  currentPage = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 0;

  isLoading = false;
  isLoadingLocations = false;
  isLoadingRoles = false;
  isSaving = false;
  isLoadingStaffDetails = false;
  isLoadingPermissions = false;
  isSavingPermissions = false;

  processingStaffId: number | null = null;

  showStaffModal = false;
  showActivityModal = false;

  isEditMode = false;

  staffForm!: FormGroup;
  permissionForm!: FormGroup;

  selectedStaff: AdminStaff | null = null;
  selectedPermissions: StaffPermission | null = null;

  activityLog: StaffActivity[] = [];
  isLoadingActivity = false;

  successMessage = '';
  errorMessage = '';
  canManageStaff = true;
  currentUserIsOwner = true;

  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private adminService: WaitListAdminService,
    private locationContext: AdminLocationContextService
  ) { }

  ngOnInit(): void {
    this.createStaffForm();
    this.createPermissionForm();

    this.loadRoles();

    this.subscriptions.add(
      this.locationContext.locations$.subscribe(
        locations => {
          this.locations = locations;
        }
      )
    );

    this.subscriptions.add(
      this.locationContext.isLoadingLocations$.subscribe(
        isLoading => {
          this.isLoadingLocations = isLoading;
        }
      )
    );

    this.subscriptions.add(
      this.locationContext.selectedLocation$.subscribe(
        location => {
          if (!location) {
            this.selectedLocation = null;
            this.selectedLocationId = null;
            this.staff = [];
            this.allStaff = [];
            this.totalElements = 0;
            this.totalPages = 0;
            return;
          }

          const locationChanged =
            this.selectedLocationId !== location.id;

          this.selectedLocation = location;
          this.selectedLocationId = location.id;

          if (locationChanged) {
            this.currentPage = 0;
            this.loadStaff();
          }
        }
      )
    );

    if (
      !this.locationContext.getCurrentLocations().length
    ) {
      this.locationContext.loadLocations();
    }
  }

  createStaffForm(): void {
    this.staffForm = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.maxLength(100)
        ]
      ],

      role: [
        'HOST',
        Validators.required
      ],

      locationId: [
        null,
        Validators.required
      ],

      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],

      status: [
        'INVITED',
        Validators.required
      ]
    });
  }

  createPermissionForm(): void {
    this.permissionForm = this.fb.group({
      canManageOffers: [false],
      canManageStaff: [false],
      canManageRewards: [false],
      canManageSettings: [false],
      canViewReports: [false]
    });
  }

  loadRoles(): void {
    this.isLoadingRoles = true;

    this.adminService
      .getStaffRoles()
      .subscribe({
        next: response => {
          this.isLoadingRoles = false;

          if (!response?.success) {
            this.roles = [];

            this.showError(
              response?.message ||
              'Unable to load staff roles.'
            );

            return;
          }

          this.roles =
            response.data?.roles || [];
        },

        error: error => {
          console.error(
            'Staff roles API error:',
            error
          );

          this.isLoadingRoles = false;
          this.roles = [];

          this.showError(
            error?.error?.message ||
            'Unable to load staff roles.'
          );
        }
      });
  }

  selectLocation(
    location: AdminLocationSummary
  ): void {
    this.locationContext.selectLocation(location);
  }

  loadStaff(): void {
    if (this.selectedLocationId === null) {
      this.staff = [];
      this.allStaff = [];
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    this.adminService
      .getStaff(0, 1000)
      .subscribe({
        next: response => {
          this.isLoading = false;

          if (!response?.success) {
            this.staff = [];
            this.allStaff = [];
            this.totalElements = 0;
            this.totalPages = 0;

            this.showError(
              response?.message ||
              'Unable to load staff.'
            );

            return;
          }

          const allStaff =
            response.data?.content || [];

          this.allStaff =
            allStaff.filter(
              member =>
                Number(member.locationId) ===
                Number(this.selectedLocationId)
            );

          this.mapLocationNames();

          this.totalElements =
            this.allStaff.length;

          this.totalPages =
            Math.ceil(
              this.totalElements /
              this.pageSize
            );

          this.updateStaffPage();
        },

        error: error => {
          console.error(
            'Staff API error:',
            error
          );

          this.isLoading = false;
          this.staff = [];
          this.allStaff = [];
          this.totalElements = 0;
          this.totalPages = 0;

          this.showError(
            error?.error?.message ||
            'Unable to load staff.'
          );
        }
      });
  }

  updateStaffPage(): void {
    const start =
      this.currentPage *
      this.pageSize;

    const end =
      start +
      this.pageSize;

    this.staff =
      this.allStaff.slice(
        start,
        end
      );
  }

  mapLocationNames(): void {
    this.allStaff =
      this.allStaff.map(member => {

        if (member.location) {
          return member;
        }

        const location =
          this.locations.find(
            item =>
              item.id ===
              member.locationId
          );

        return {
          ...member,
          location:
            location?.name ||
            'All locations'
        };
      });
  }

  openAddStaff(): void {
    if (this.isLoadingLocations) {
      return;
    }

    if (!this.selectedLocation) {
      this.showError(
        'Please select a restaurant first.'
      );
      return;
    }

    if (!this.roles.length) {
      this.showError(
        'Staff roles are not available.'
      );
      return;
    }

    this.isEditMode = false;
    this.selectedStaff = null;
    this.selectedPermissions = null;

    this.staffForm.reset({
      name: '',
      role: this.roles[0]?.name || 'HOST',
      locationId: this.selectedLocation.id,
      email: '',
      status: 'INVITED'
    });

    this.permissionForm.reset({
      canManageOffers: false,
      canManageStaff: false,
      canManageRewards: false,
      canManageSettings: false,
      canViewReports: false
    });

    this.clearMessages();

    this.showStaffModal = true;
  }

  canEditStaff(): boolean {
    return this.currentUserIsOwner || this.canManageStaff;
  }

  openEditStaff(member: AdminStaff): void {
    if (!this.canEditStaff()) {
      this.showError(
        'You do not have permission to edit staff.'
      );
      return;
    }

    if (
      this.isLoadingStaffDetails ||
      this.isSaving
    ) {
      return;
    }

    this.isEditMode = true;
    this.selectedStaff = member;

    this.clearMessages();

    this.showStaffModal = true;

    this.isLoadingStaffDetails = true;
    this.isLoadingPermissions = true;

    this.staffForm.reset({
      name: member.name,
      role: this.getRoleName(member.role),
      locationId: member.locationId,
      email: member.email,
      status: member.status
    });

    this.permissionForm.reset({
      canManageOffers: false,
      canManageStaff: false,
      canManageRewards: false,
      canManageSettings: false,
      canViewReports: false
    });

    this.adminService
      .getStaffById(member.id)
      .subscribe({
        next: response => {
          this.isLoadingStaffDetails = false;

          if (
            response?.success &&
            response.data
          ) {
            const staffDetails = response.data;

            this.selectedStaff = staffDetails;

            this.staffForm.patchValue({
              name: staffDetails.name,
              role: this.getRoleName(
                staffDetails.role
              ),
              locationId: staffDetails.locationId,
              email: staffDetails.email,
              status: staffDetails.status
            });
          } else {
            this.showError(
              response?.message ||
              'Unable to load staff details.'
            );
          }
        },
        error: error => {
          console.error(
            'Get staff by ID error:',
            error
          );

          this.isLoadingStaffDetails = false;

          this.showError(
            error?.error?.message ||
            'Unable to load staff details.'
          );
        }
      });

    this.adminService
      .getStaffPermissions(member.id)
      .subscribe({
        next: response => {
          this.isLoadingPermissions = false;

          if (
            response?.success &&
            response.data
          ) {
            this.selectedPermissions =
              response.data;

            this.permissionForm.patchValue({
              canManageOffers:
                !!response.data.canManageOffers,
              canManageStaff:
                !!response.data.canManageStaff,
              canManageRewards:
                !!response.data.canManageRewards,
              canManageSettings:
                !!response.data.canManageSettings,
              canViewReports:
                !!response.data.canViewReports
            });
          } else {
            this.showError(
              response?.message ||
              'Unable to load staff permissions.'
            );
          }
        },
        error: error => {
          console.error(
            'Get staff permissions error:',
            error
          );

          this.isLoadingPermissions = false;

          this.showError(
            error?.error?.message ||
            'Unable to load staff permissions.'
          );
        }
      });
  }

  getRoleName(roleValue: string): string {
    if (!roleValue) {
      return '';
    }

    const role =
      this.roles.find(
        item =>
          item.name.toUpperCase() ===
          roleValue.toUpperCase() ||
          item.displayName.toUpperCase() ===
          roleValue.toUpperCase()
      );

    return role?.name || roleValue;
  }

  closeStaffModal(): void {
    if (
      this.isSaving ||
      this.isSavingPermissions
    ) {
      return;
    }

    this.showStaffModal = false;
    this.isEditMode = false;
    this.selectedStaff = null;
    this.selectedPermissions = null;

    this.staffForm.reset({
      name: '',
      role: this.roles[0]?.name || 'HOST',
      locationId:
        this.selectedLocation?.id || null,
      email: '',
      status: 'INVITED'
    });

    this.permissionForm.reset({
      canManageOffers: false,
      canManageStaff: false,
      canManageRewards: false,
      canManageSettings: false,
      canViewReports: false
    });
  }

  createStaff(): void {
    if (
      this.staffForm.invalid ||
      this.isSaving
    ) {
      this.staffForm.markAllAsTouched();
      return;
    }

    const formValue =
      this.staffForm.getRawValue();

    const request: CreateStaffRequest = {
      name:
        formValue.name.trim(),

      role:
        formValue.role,

      locationId:
        Number(formValue.locationId),

      email:
        formValue.email.trim()
    };

    this.isSaving = true;
    this.clearMessages();

    this.adminService
      .createStaff(request)
      .subscribe({
        next: response => {
          this.isSaving = false;

          if (!response?.success) {
            this.showError(
              response?.message ||
              'Unable to add staff.'
            );

            return;
          }

          this.showStaffModal = false;

          this.staffForm.reset({
            name: '',
            role:
              this.roles[0]?.name ||
              'HOST',
            locationId:
              this.selectedLocation?.id ||
              null,
            email: '',
            status: 'INVITED'
          });

          this.showSuccess(
            response?.message ||
            'Staff added successfully.'
          );

          this.currentPage = 0;
          this.loadStaff();
        },

        error: error => {
          console.error(
            'Create staff error:',
            error
          );

          this.isSaving = false;

          this.showError(
            error?.error?.message ||
            'Unable to add staff.'
          );
        }
      });
  }

  saveStaff(): void {
    if (!this.canEditStaff()) {

      this.showError(

        'You do not have permission to edit staff.'

      );

      return;

    }

    if (

      !this.selectedStaff ||

      this.staffForm.invalid ||

      this.isSaving

    ) {

      this.staffForm.markAllAsTouched();

      return;

    }

    const formValue =
      this.staffForm.getRawValue();

    const request: UpdateStaffRequest = {
      name:
        formValue.name.trim(),

      role:
        formValue.role,

      email:
        formValue.email.trim(),

      locationId:
        Number(formValue.locationId),

      status:
        formValue.status
    };

    this.isSaving = true;
    this.clearMessages();

    this.adminService
      .updateStaff(
        this.selectedStaff.id,
        request
      )
      .subscribe({
        next: response => {
          if (!response?.success) {
            this.isSaving = false;

            this.showError(
              response?.message ||
              'Unable to update staff.'
            );

            return;
          }

          if (response.data) {
            this.updateStaffInList(
              response.data
            );

            this.selectedStaff =
              response.data;
          }

          this.savePermissionsAfterStaffUpdate();
        },

        error: error => {
          console.error(
            'Update staff error:',
            error
          );

          this.isSaving = false;

          this.showError(
            error?.error?.message ||
            'Unable to update staff.'
          );
        }
      });
  }

  private savePermissionsAfterStaffUpdate(): void {
    if (!this.selectedStaff) {
      this.isSaving = false;

      this.closeStaffModal();

      this.showSuccess(
        'Staff updated successfully.'
      );

      this.loadStaff();

      return;
    }

    const permissionRequest:
      UpdateStaffPermissionRequest = {
      canManageOffers:
        !!this.permissionForm.value
          .canManageOffers,

      canManageStaff:
        !!this.permissionForm.value
          .canManageStaff,

      canManageRewards:
        !!this.permissionForm.value
          .canManageRewards,

      canManageSettings:
        !!this.permissionForm.value
          .canManageSettings,

      canViewReports:
        !!this.permissionForm.value
          .canViewReports
    };

    this.isSavingPermissions = true;

    this.adminService
      .updateStaffPermissions(
        this.selectedStaff.id,
        permissionRequest
      )
      .subscribe({
        next: response => {
          this.isSavingPermissions = false;
          this.isSaving = false;

          if (!response?.success) {
            this.showError(
              response?.message ||
              'Staff updated, but permissions could not be updated.'
            );

            return;
          }

          this.showStaffModal = false;
          this.isEditMode = false;

          this.selectedStaff = null;
          this.selectedPermissions = null;

          this.showSuccess(
            'Staff and permissions updated successfully.'
          );

          this.loadStaff();
        },

        error: error => {
          console.error(
            'Update staff permissions error:',
            error
          );

          this.isSavingPermissions = false;
          this.isSaving = false;

          this.showError(
            error?.error?.message ||
            'Staff updated, but permissions could not be updated.'
          );
        }
      });
  }

  updateStaffInList(
    updatedStaff: AdminStaff
  ): void {
    this.allStaff =
      this.allStaff.map(member => {

        if (
          member.id !==
          updatedStaff.id
        ) {
          return member;
        }

        const location =
          this.locations.find(
            item =>
              item.id ===
              updatedStaff.locationId
          );

        return {
          ...updatedStaff,
          location:
            updatedStaff.location ||
            location?.name ||
            'All locations'
        };
      });

    this.updateStaffPage();
  }

  activateOrDeactivate(member: AdminStaff): void {
    if (!this.canEditStaff()) {
      this.showError(
        'You do not have permission to change staff status.'
      );
      return;
    }

    if (this.processingStaffId !== null) {
      return;
    }

    if (
      member.status?.toUpperCase() ===
      'INVITED'
    ) {
      return;
    }

    const isActive =
      member.status?.toUpperCase() === 'ACTIVE';

    const action =
      isActive
        ? 'deactivate'
        : 'activate';

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${member.name}?`
    );

    if (!confirmed) {
      return;
    }

    this.processingStaffId = member.id;
    this.clearMessages();

    const request$ = isActive
      ? this.adminService.deactivateStaff(member.id)
      : this.adminService.activateStaff(member.id);

    request$.subscribe({
      next: response => {
        this.processingStaffId = null;

        if (!response?.success) {
          this.showError(
            response?.message ||
            `Unable to ${action} staff.`
          );
          return;
        }

        this.showSuccess(
          response?.message ||
          `Staff ${action}d successfully.`
        );

        this.loadStaff();
      },
      error: error => {
        console.error(
          `${action} staff error:`,
          error
        );

        this.processingStaffId = null;

        this.showError(
          error?.error?.message ||
          `Unable to ${action} staff.`
        );
      }
    });
  }

  openActivityLog(
    member: AdminStaff
  ): void {

    this.selectedStaff = member;
    this.showActivityModal = true;

    this.activityLog = [];
    this.isLoadingActivity = true;

    this.clearMessages();

    this.adminService
      .getStaffActivityLog(
        member.id,
        0,
        20
      )
      .subscribe({
        next: response => {
          this.isLoadingActivity = false;

          if (
            response?.success &&
            response.data
          ) {
            this.activityLog =
              response.data.content || [];

            return;
          }

          this.showError(
            response?.message ||
            'Unable to load activity log.'
          );
        },

        error: error => {
          console.error(
            'Staff activity log error:',
            error
          );

          this.isLoadingActivity = false;

          this.showError(
            error?.error?.message ||
            'Unable to load activity log.'
          );
        }
      });
  }

  closeActivityLog(): void {
    this.showActivityModal = false;
    this.activityLog = [];
  }

  getStatusClass(
    status: string
  ): string {
    switch (
    status?.toUpperCase()
    ) {
      case 'ACTIVE':
        return 'active';

      case 'INVITED':
        return 'invited';

      case 'INACTIVE':
        return 'inactive';

      default:
        return '';
    }
  }

  getSelectedLocationName(): string {
    const locationId =
      this.staffForm.get(
        'locationId'
      )?.value;

    const location =
      this.locations.find(
        item =>
          item.id ===
          Number(locationId)
      );

    return location?.name || '';
  }

  isInvalid(
    controlName: string
  ): boolean {
    const control =
      this.staffForm.get(
        controlName
      );

    return !!(
      control &&
      control.invalid &&
      control.touched
    );
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
    this.updateStaffPage();
  }

  previousPage(): void {
    if (
      this.currentPage <= 0
    ) {
      return;
    }

    this.currentPage--;
    this.updateStaffPage();
  }

  showSuccess(
    message: string
  ): void {
    this.successMessage =
      message;

    this.errorMessage = '';

    setTimeout(() => {
      this.successMessage = '';
    }, 4000);
  }

  showError(
    message: string
  ): void {
    this.errorMessage =
      message;

    this.successMessage = '';

    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  getRoleDisplayName(roleValue: string): string {
    const role = this.roles.find(
      item =>
        item.name?.toUpperCase() === roleValue?.toUpperCase() ||
        item.displayName?.toUpperCase() === roleValue?.toUpperCase()
    );

    return role?.displayName || roleValue;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}