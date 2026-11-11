import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges
} from '@angular/core';

import {
  Category,
  Dish
} from 'src/app/models/waitlist-menu.model';

import {
  MenuService
} from 'src/app/services/menu.service';


interface MenuRestaurant {
  id: number;
  name: string;
  cuisine: string;
  rating: number;
  distance: string;
  deliveryTime: string;
  priceLevel: string;
  imageClass: string;
}


@Component({
  selector: 'app-waitlist-user-menu',

  templateUrl:
    './waitlist-user-menu.component.html',

  styleUrls: [
    './waitlist-user-menu.component.css'
  ]
})
export class WaitlistUserMenuComponent
  implements OnInit, OnChanges {

  @Input()
  isActive = false;


  /* =====================================================
     SEARCH
  ====================================================== */

  searchText = '';


  /* =====================================================
     EXISTING RESTAURANT DEMO DATA
  ====================================================== */

  selectedCuisine = 'All';
  restaurantId = 1;

  cuisines = [
    'All',
    'Breakfast',
    'Italian',
    'Steakhouse',
    'Sushi',
    'Vegetarian'
  ];


  restaurants:
    MenuRestaurant[] = [
      {
        id: 1,
        name: 'Brothers Café',
        cuisine: 'Breakfast',
        rating: 4.8,
        distance: '0.4 km',
        deliveryTime: '20–30 min',
        priceLevel: '$$',
        imageClass: 'menu-purple'
      },
      {
        id: 2,
        name: 'Trattoria Nove',
        cuisine: 'Italian',
        rating: 4.6,
        distance: '1.1 km',
        deliveryTime: '25–35 min',
        priceLevel: '$$$',
        imageClass: 'menu-gold'
      },
      {
        id: 3,
        name: 'The Copper Grill',
        cuisine: 'Steakhouse',
        rating: 4.9,
        distance: '2.3 km',
        deliveryTime: '30–40 min',
        priceLevel: '$$$',
        imageClass: 'menu-blue'
      },
      {
        id: 4,
        name: 'Kijo Sushi Bar',
        cuisine: 'Sushi',
        rating: 4.7,
        distance: '3 km',
        deliveryTime: '25–30 min',
        priceLevel: '$$',
        imageClass: 'menu-green'
      }
    ];


  /* =====================================================
     MENU STATE
  ====================================================== */

  isLoadingMenu = false;

  isLoadingDishes = false;

  menuErrorMessage = '';

  private menuLoaded = false;


  /* =====================================================
     CATEGORY DATA
  ====================================================== */

  categories: Category[] = [];

  selectedCategoryId:
    number | null = null;

  selectedCategoryName = '';

  isDirectMenuRoute = false;


  /* =====================================================
     DISH DATA
  ====================================================== */

  dishes: Dish[] = [];

  activeDishes: Dish[] = [];


  /* =====================================================
     IMAGE
  ====================================================== */

  fallbackImage =
    'assets/food-placeholder.png';


  constructor(
    private menuService:
      MenuService
  ) {}


  /* =====================================================
     LIFE CYCLE
  ====================================================== */

  ngOnInit(): void {

    console.log(
      'Menu component ngOnInit triggered'
    );

    this.restaurantId = Number(localStorage.getItem('waitlistRestaurantId'));
    this.loadMenuWhenActive();
  }


  ngOnChanges(
    changes: SimpleChanges
  ): void {

    if (
      changes['isActive'] &&
      this.isActive
    ) {

      console.log(
        'Menu tab became active'
      );

      this.loadMenuWhenActive();
    }
  }


  /* =====================================================
     FILTERED RESTAURANTS
  ====================================================== */

  get filteredRestaurants():
    MenuRestaurant[] {

    const search =
      this.searchText
        .trim()
        .toLowerCase();

    return this.restaurants.filter(
      restaurant => {

        const matchesCuisine =
          this.selectedCuisine ===
            'All' ||
          restaurant.cuisine ===
            this.selectedCuisine;

        const matchesSearch =
          !search ||
          restaurant.name
            .toLowerCase()
            .includes(search) ||
          restaurant.cuisine
            .toLowerCase()
            .includes(search);

        return (
          matchesCuisine &&
          matchesSearch
        );
      }
    );
  }


  /* =====================================================
     FILTERED DISHES
  ====================================================== */

  get filteredDishes():
    Dish[] {

    const search =
      this.searchText
        .trim()
        .toLowerCase();

    if (!search) {
      return this.activeDishes;
    }

    return this.activeDishes.filter(
      dish => {

        const dishName =
          String(
            dish.name || ''
          )
            .trim()
            .toLowerCase();

        const categoryName =
          String(
            dish.category ||
            this.selectedCategoryName ||
            ''
          )
            .trim()
            .toLowerCase();

        return (
          dishName.includes(search) ||
          categoryName.includes(search)
        );
      }
    );
  }


  /* =====================================================
     INITIAL MENU LOAD
  ====================================================== */

  private loadMenuWhenActive(): void {

    if (!this.isActive) {
      return;
    }

    if (this.menuLoaded) {
      return;
    }

    this.getMenuMethod();
  }


  getMenuMethod(): void {

    if (this.isLoadingMenu) {
      return;
    }

    this.isLoadingMenu = true;

    this.menuErrorMessage = '';

    this.menuService
      .getCategories(this.restaurantId)
      .subscribe({
        next: response => {

          console.log(
            'Menu category response:',
            response
          );

          this.categories =
            Array.isArray(response)
              ? response
              : [];

          this.menuLoaded = true;

          this.isLoadingMenu = false;

          /*
           * Existing flow remains unchanged:
           * select the first category automatically.
           */
          if (
            this.categories.length > 0
          ) {

            const firstCategory =
              this.categories[0];

            this.onCategorySelect(
              firstCategory.id,
              firstCategory.name
            );
          } else {

            this.selectedCategoryId =
              null;

            this.selectedCategoryName =
              '';

            this.dishes = [];

            this.activeDishes = [];
          }
        },

        error: error => {

          console.error(
            'Menu API error:',
            error
          );

          this.menuLoaded = false;

          this.isLoadingMenu = false;

          this.categories = [];

          this.dishes = [];

          this.activeDishes = [];

          this.menuErrorMessage =
            error?.error?.message ||
            'Unable to load menu.';
        }
      });
  }


  /* =====================================================
     CATEGORY SELECTION
  ====================================================== */

  onCategorySelect(
    categoryId: number,
    categoryName: string
  ): void {

    if (
      this.isLoadingDishes
    ) {
      return;
    }

    this.selectedCategoryId =
      categoryId;

    this.selectedCategoryName =
      categoryName;

    this.menuErrorMessage = '';

    this.isLoadingDishes = true;

    this.menuService
      .getDishesByCategory(
        categoryName,this.restaurantId
      )
      .subscribe({
        next: response => {

          console.log(
            'Menu dishes response:',
            response
          );

          this.isLoadingDishes = false;

          this.dishes =
            Array.isArray(response)
              ? response
              : [];

          /*
           * Existing flow remains unchanged:
           * only active dishes are shown.
           */
          this.activeDishes =
            this.dishes.filter(
              dish =>
                String(
                  dish.status || ''
                )
                  .trim()
                  .toLowerCase() ===
                'active'
            );
        },

        error: error => {

          this.isLoadingDishes = false;

          console.error(
            'Dish API error:',
            error
          );

          this.dishes = [];

          this.activeDishes = [];

          this.menuErrorMessage =
            error?.error?.message ||
            `Unable to load ${categoryName} dishes.`;
        }
      });
  }


  /* =====================================================
     SEARCH
  ====================================================== */

  clearSearch(): void {

    this.searchText = '';
  }


  /* =====================================================
     IMAGE HELPERS
  ====================================================== */

  onImageLoad(
    event: Event
  ): void {

    const image =
      event.target as
        HTMLImageElement;

    image.classList.remove(
      'loading'
    );

    image.classList.add(
      'loaded'
    );
  }


  onImageError(
    event: Event
  ): void {

    const image =
      event.target as
        HTMLImageElement;

    const fallbackUrl =
      this.fallbackImage;

    if (
      image
        .getAttribute('src') ===
      fallbackUrl
    ) {
      image.classList.remove(
        'loading'
      );

      image.classList.add(
        'loaded'
      );

      return;
    }

    image.src =
      fallbackUrl;
  }


  /* =====================================================
     PRICE
  ====================================================== */

  formatPrice(
    price:
      number |
      string |
      null |
      undefined
  ): string {

    const numericPrice =
      Number(price);

    if (
      Number.isNaN(
        numericPrice
      )
    ) {
      return '0.00';
    }

    return numericPrice
      .toFixed(2);
  }


  /* =====================================================
     TRACK BY
  ====================================================== */

  trackByCategory(
    index: number,
    category: Category
  ): number | string {

    return (
      category.id ??
      `${category.name}-${index}`
    );
  }


  trackByDish(
    index: number,
    dish: Dish
  ): number | string {

    return (
      dish.id ??
      `${dish.name}-${index}`
    );
  }


  /* =====================================================
     REFRESH
  ====================================================== */

  refreshMenu(): void {

    this.menuLoaded = false;

    this.categories = [];

    this.dishes = [];

    this.activeDishes = [];

    this.selectedCategoryId =
      null;

    this.selectedCategoryName =
      '';

    this.menuErrorMessage = '';

    this.getMenuMethod();
  }

}