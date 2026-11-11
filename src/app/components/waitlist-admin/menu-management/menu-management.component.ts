import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  AdminLocationSummary,
  CategoryRequest,
  Dish,
  DishRequest,
  MenuCategory
} from 'src/app/models/admin.model';
import { WaitListAdminService } from 'src/app/services/wait-list-admin.service';
import { AdminLocationContextService } from 'src/app/services/admin-location-context.service';

@Component({
  selector: 'app-menu-management',
  templateUrl: './menu-management.component.html',
  styleUrls: ['./menu-management.component.css']
})
export class MenuManagementComponent implements OnInit, OnDestroy {
  locations: AdminLocationSummary[] = [];
  selectedLocation: AdminLocationSummary | null = null;
  selectedLocationId: number | null = null;

  categories: MenuCategory[] = [];
  selectedDish: Dish | null = null;
  selectedCategory: MenuCategory | null = null;

  isLocationsLoading = false;
  isMenuLoading = false;
  isSaving = false;

  showDishModal = false;
  showCategoryModal = false;

  isDishEditMode = false;
  isCategoryEditMode = false;

  dishForm!: FormGroup;
  categoryForm!: FormGroup;

  selectedImage: File | null = null;
  imagePreview: string | null = null;

  availableTypes: string[] = ['VEG', 'NON_VEG'];

  successMessage = '';
  errorMessage = '';

  fallbackImage = 'assets/food-placeholder.png';

  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private menuService: WaitListAdminService,
    private locationContext: AdminLocationContextService
  ) { }

  ngOnInit(): void {
    this.createDishForm();
    this.createCategoryForm();

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
          this.categories = [];
          return;
        }

        const locationChanged =
          this.selectedLocationId !== location.id;

        this.selectedLocation = location;
        this.selectedLocationId = location.id;

        if (locationChanged) {
          this.loadMenu(location.id);
        }
      })
    );

    if (!this.locationContext.getCurrentLocations().length) {
      this.locationContext.loadLocations();
    }
  }

  createDishForm(): void {
    this.dishForm = this.fb.group({
      dishName: ['', Validators.required],
      categoryName: ['', Validators.required],
      typeName: [[], Validators.required],
      price: [
        0,
        [
          Validators.required,
          Validators.min(0)
        ]
      ],
      locationId: [null, Validators.required],
      calories: [0, Validators.min(0)],
      description: ['', Validators.required],
      image: [null]
    });
  }

  createCategoryForm(): void {
    this.categoryForm = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.maxLength(100)
        ]
      ],
      description: [
        '',
        [
          Validators.required,
          Validators.maxLength(500)
        ]
      ]
    });
  }

  selectLocation(location: AdminLocationSummary): void {
    this.locationContext.selectLocation(location);
  }

  onLocationChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const locationId = Number(select.value);

    const location = this.locations.find(
      item => item.id === locationId
    );

    if (location) {
      this.selectLocation(location);
    }
  }

  loadMenu(locationId: number): void {
    this.isMenuLoading = true;
    this.categories = [];
    this.clearMessages();

    this.menuService.getCategories(locationId).subscribe({
      next: categoryResponse => {
        const responseCategories = categoryResponse || [];

        this.categories = responseCategories.map(
          (category: any) => ({
            id: category.id,
            name: category.name,
            description: category.description || '',
            locationId: category.locationId || locationId,
            location: category.location,
            dishes: [],
            status: category.status || 'ACTIVE'
          })
        );

        if (!this.categories.length) {
          this.isMenuLoading = false;
          return;
        }

        this.loadDishesForCategories(locationId);
      },
      error: error => {
        console.error('Menu categories error:', error);

        this.categories = [];
        this.isMenuLoading = false;

        this.showError(
          error?.error?.message ||
          'Unable to load menu.'
        );
      }
    });
  }

  private loadDishesForCategories(locationId: number): void {
    const requests = this.categories.map(category =>
      this.menuService.getDishesByCategory(category.name, locationId)
    );

    if (!requests.length) {
      this.isMenuLoading = false;
      return;
    }

    let completed = 0;

    requests.forEach((request, index) => {
      request.subscribe({
        next: dishes => {
          this.categories[index].dishes = (dishes || [])
            .filter(dish => dish.locationId === locationId);

          completed++;

          if (completed === requests.length) {
            this.isMenuLoading = false;
          }
        },
        error: error => {
          console.error(
            `Get dishes error for ${this.categories[index].name}:`,
            error
          );

          this.categories[index].dishes = [];

          completed++;

          if (completed === requests.length) {
            this.isMenuLoading = false;
          }
        }
      });
    });
  }

  openAddCategory(): void {
    if (!this.selectedLocation) {
      this.showError('Please select a restaurant first.');
      return;
    }

    this.selectedCategory = null;
    this.isCategoryEditMode = false;

    this.categoryForm.reset({
      name: '',
      description: ''
    });

    this.clearMessages();
    this.showCategoryModal = true;
  }

  editCategory(category: MenuCategory): void {
    if (this.isCategoryInactive(category)) {
      return;
    }

    this.selectedCategory = category;
    this.isCategoryEditMode = true;

    this.categoryForm.reset({
      name: category.name,
      description: category.description || ''
    });

    this.clearMessages();
    this.showCategoryModal = true;
  }

  closeCategoryModal(): void {
    if (this.isSaving) {
      return;
    }

    this.showCategoryModal = false;
    this.selectedCategory = null;
    this.isCategoryEditMode = false;
  }

  createCategory(): void {
    if (!this.selectedLocation) {
      this.showError('Please select a restaurant first.');
      return;
    }

    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const value = this.categoryForm.getRawValue();

    const request: CategoryRequest = {
      name: value.name,
      description: value.description,
      locationId: this.selectedLocation.id
    };

    this.isSaving = true;
    this.clearMessages();

    this.menuService.createCategory(request).subscribe({
      next: response => {
        this.isSaving = false;

        if (response?.success === false) {
          this.showError(
            response.message ||
            'Unable to create category.'
          );
          return;
        }

        this.closeCategoryModal();

        this.showSuccess(
          response?.message ||
          'Category created successfully.'
        );

        this.loadMenu(this.selectedLocation!.id);
      },
      error: error => {
        console.error('Create category error:', error);

        this.isSaving = false;

        this.showError(
          error?.error?.message ||
          'Unable to create category.'
        );
      }
    });
  }

  updateCategory(): void {
    if (!this.selectedCategory || !this.selectedLocation) {
      return;
    }

    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const value = this.categoryForm.getRawValue();

    const request: CategoryRequest = {
      name: value.name,
      description: value.description,
      locationId: this.selectedLocation.id
    };

    this.isSaving = true;
    this.clearMessages();

    this.menuService
      .updateCategory(
        this.selectedCategory.id,
        request
      )
      .subscribe({
        next: response => {
          this.isSaving = false;

          if (response?.success === false) {
            this.showError(
              response.message ||
              'Unable to update category.'
            );
            return;
          }

          this.closeCategoryModal();

          this.showSuccess(
            response?.message ||
            'Category updated successfully.'
          );

          this.loadMenu(
            this.selectedLocation!.id
          );
        },
        error: error => {
          console.error(
            'Update category error:',
            error
          );

          this.isSaving = false;

          this.showError(
            error?.error?.message ||
            'Unable to update category.'
          );
        }
      });
  }

  deleteCategory(category: MenuCategory): void {
    if (!this.selectedLocation) {
      return;
    }

    if (this.isCategoryInactive(category)) {
      return;
    }

    const confirmed = window.confirm(
      `Delete category "${category.name}"?`
    );

    if (!confirmed) {
      return;
    }

    this.isSaving = true;
    this.clearMessages();

    this.menuService
      .deleteCategory(
        category.id,
        this.selectedLocation.id
      )
      .subscribe({
        next: response => {
          this.isSaving = false;

          if (response?.success === false) {
            this.showError(
              response.message ||
              'Unable to delete category.'
            );
            return;
          }

          this.showSuccess(
            response?.message ||
            'Category deleted successfully.'
          );

          this.loadMenu(
            this.selectedLocation!.id
          );
        },
        error: error => {
          console.error(
            'Delete category error:',
            error
          );

          this.isSaving = false;

          this.showError(
            error?.error?.message ||
            'Unable to delete category.'
          );
        }
      });
  }

  restoreCategory(category: MenuCategory): void {
    if (!this.selectedLocation) {
      return;
    }

    if (!this.isCategoryInactive(category)) {
      return;
    }

    this.isSaving = true;
    this.clearMessages();

    this.menuService
      .restoreCategory(
        category.id,
        this.selectedLocation.id
      )
      .subscribe({
        next: response => {
          this.isSaving = false;

          if (response?.success === false) {
            this.showError(
              response.message ||
              'Unable to restore category.'
            );
            return;
          }

          this.showSuccess(
            response?.message ||
            'Category restored successfully.'
          );

          this.loadMenu(
            this.selectedLocation!.id
          );
        },
        error: error => {
          console.error(
            'Restore category error:',
            error
          );

          this.isSaving = false;

          this.showError(
            error?.error?.message ||
            'Unable to restore category.'
          );
        }
      });
  }

  openAddDish(): void {
    if (!this.selectedLocation) {
      this.showError(
        'Please select a restaurant first.'
      );
      return;
    }

    this.isDishEditMode = false;
    this.selectedDish = null;
    this.selectedCategory = null;

    const activeCategory =
      this.categories.find(
        category => !this.isCategoryInactive(category)
      );

    this.dishForm.reset({
      dishName: '',
      categoryName: activeCategory?.name || '',
      typeName: [],
      price: 0,
      calories: 0,
      description: '',
      image: null
    });

    this.selectedImage = null;
    this.imagePreview = null;
    this.clearMessages();
    this.showDishModal = true;
  }

  openAddDishForCategory(category: MenuCategory): void {
    if (!this.selectedLocation) {
      this.showError(
        'Please select a restaurant first.'
      );
      return;
    }

    if (this.isCategoryInactive(category)) {
      return;
    }

    this.isDishEditMode = false;
    this.selectedDish = null;
    this.selectedCategory = category;

    this.dishForm.reset({
      dishName: '',
      categoryName: category.name,
      typeName: '',
      price: 0,
      calories: 0,
      description: '',
      image: null
    });

    this.selectedImage = null;
    this.imagePreview = null;
    this.clearMessages();
    this.showDishModal = true;
  }

  closeDishModal(): void {
    if (this.isSaving) {
      return;
    }

    this.showDishModal = false;
    this.selectedDish = null;
    this.selectedCategory = null;
    this.selectedImage = null;
    this.imagePreview = null;
    this.isDishEditMode = false;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];

    this.selectedImage = file;

    this.dishForm.patchValue({
      image: file
    });

    const reader = new FileReader();

    reader.onload = () => {
      this.imagePreview =
        reader.result as string;
    };

    reader.readAsDataURL(file);
  }

  createDish(): void {
    if (!this.selectedLocation) {
      this.showError(
        'Please select a restaurant first.'
      );
      return;
    }

    if (this.dishForm.invalid) {
      this.dishForm.markAllAsTouched();
      return;
    }

    const value = this.dishForm.getRawValue();

    const typeName =
      typeof value.typeName === 'string'
        ? value.typeName.trim()
        : '';

    if (!typeName) {
      this.showError(
        'Please select a dish type.'
      );
      return;
    }

    const request: DishRequest = {
      dishName: value.dishName,
      locationId: this.selectedLocation.id,
      categoryName: value.categoryName,
      typeNames: [typeName],
      price: Number(value.price),
      calories: Number(value.calories || 0),
      description: value.description,
      image: this.selectedImage
    };

    this.isSaving = true;
    this.clearMessages();

    this.menuService.createDish(request).subscribe({
      next: response => {
        this.isSaving = false;

        if (response?.success === false) {
          this.showError(
            response.message ||
            'Unable to create dish.'
          );
          return;
        }

        this.closeDishModal();

        this.showSuccess(
          response?.message ||
          'Dish created successfully.'
        );

        this.loadMenu(
          this.selectedLocation!.id
        );
      },
      error: error => {
        console.error(
          'Create dish error:',
          error
        );

        this.isSaving = false;

        this.showError(
          error?.error?.message ||
          'Unable to create dish.'
        );
      }
    });
  }

  editDish(
    dish: Dish,
    category: MenuCategory
  ): void {
    if (this.isDishInactive(dish)) {
      return;
    }

    if (this.isCategoryInactive(category)) {
      return;
    }

    this.selectedDish = dish;
    this.selectedCategory = category;
    this.isDishEditMode = true;

    const typeName =
      Array.isArray(dish.types) &&
        dish.types.length > 0
        ? dish.types[0].name
        : '';

    this.dishForm.reset({
      dishName: dish.name,
      categoryName:
        dish.category || category.name,
      typeName,
      price: dish.price,
      calories: dish.calories,
      description: dish.description,
      image: null
    });

    this.selectedImage = null;
    this.imagePreview =
      dish.imageUrl || null;

    this.clearMessages();
    this.showDishModal = true;
  }

  updateDish(): void {
    if (
      !this.selectedDish ||
      !this.selectedLocation
    ) {
      return;
    }

    if (this.dishForm.invalid) {
      this.dishForm.markAllAsTouched();
      return;
    }

    const value = this.dishForm.getRawValue();

    const typeName =
      typeof value.typeName === 'string'
        ? value.typeName.trim()
        : '';

    if (!typeName) {
      this.showError(
        'Please select a dish type.'
      );
      return;
    }

    const request: DishRequest = {
      dishName: value.dishName,
      locationId: this.selectedLocation.id,
      categoryName: value.categoryName,
      typeNames: [typeName],
      price: Number(value.price),
      calories: Number(value.calories || 0),
      description: value.description,
      image: this.selectedImage
    };

    this.isSaving = true;
    this.clearMessages();

    this.menuService
      .updateDish(
        this.selectedDish.id,
        request
      )
      .subscribe({
        next: response => {
          this.isSaving = false;

          if (response?.success === false) {
            this.showError(
              response.message ||
              'Unable to update dish.'
            );
            return;
          }

          this.closeDishModal();

          this.showSuccess(
            response?.message ||
            'Dish updated successfully.'
          );

          this.loadMenu(
            this.selectedLocation!.id
          );
        },
        error: error => {
          console.error(
            'Update dish error:',
            error
          );

          this.isSaving = false;

          this.showError(
            error?.error?.message ||
            'Unable to update dish.'
          );
        }
      });
  }

  deleteDish(dish: Dish): void {
    if (!this.selectedLocation) {
      return;
    }

    if (this.isDishInactive(dish)) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${dish.name}"?`
    );

    if (!confirmed) {
      return;
    }

    this.isSaving = true;
    this.clearMessages();

    this.menuService
      .deleteDish(
        dish.id,
        this.selectedLocation.id
      )
      .subscribe({
        next: response => {
          this.isSaving = false;

          if (response?.success === false) {
            this.showError(
              response.message ||
              'Unable to delete dish.'
            );
            return;
          }

          this.showSuccess(
            response?.message ||
            'Dish deleted successfully.'
          );

          this.loadMenu(
            this.selectedLocation!.id
          );
        },
        error: error => {
          console.error(
            'Delete dish error:',
            error
          );

          this.isSaving = false;

          this.showError(
            error?.error?.message ||
            'Unable to delete dish.'
          );
        }
      });
  }

  restoreDish(dish: Dish): void {
    if (!this.selectedLocation) {
      return;
    }

    if (!this.isDishInactive(dish)) {
      return;
    }

    this.isSaving = true;
    this.clearMessages();

    this.menuService
      .restoreDish(
        dish.id,
        this.selectedLocation.id
      )
      .subscribe({
        next: response => {
          this.isSaving = false;

          if (response?.success === false) {
            this.showError(
              response.message ||
              'Unable to restore dish.'
            );
            return;
          }

          this.showSuccess(
            response?.message ||
            'Dish restored successfully.'
          );

          this.loadMenu(
            this.selectedLocation!.id
          );
        },
        error: error => {
          console.error(
            'Restore dish error:',
            error
          );

          this.isSaving = false;

          this.showError(
            error?.error?.message ||
            'Unable to restore dish.'
          );
        }
      });
  }

  isCategoryInactive(
    category: MenuCategory
  ): boolean {
    return (
      category.status?.toUpperCase() !==
      'ACTIVE'
    );
  }

  isDishInactive(
    dish: Dish
  ): boolean {
    return (
      dish.status?.toUpperCase() !==
      'ACTIVE'
    );
  }

  isInvalid(
    form: FormGroup,
    controlName: string
  ): boolean {
    const control = form.get(controlName);

    return !!(
      control &&
      control.invalid &&
      control.touched
    );
  }

  showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';

    setTimeout(() => {
      this.successMessage = '';
    }, 4000);
  }

  showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';

    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  onImageLoad(event: Event): void {
    const image =
      event.target as HTMLImageElement;

    image.classList.remove('loading');
    image.classList.add('loaded');
  }

  onImageError(event: Event): void {
    const image =
      event.target as HTMLImageElement;

    const fallbackUrl =
      this.fallbackImage;

    if (
      image.getAttribute('src') ===
      fallbackUrl
    ) {
      image.classList.remove('loading');
      image.classList.add('loaded');
      return;
    }

    image.src = fallbackUrl;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}