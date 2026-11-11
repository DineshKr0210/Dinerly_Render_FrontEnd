import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';

import {
  GuestAccount,
  GuestPortalTab,
  PortalOffer,
  PortalRestaurant
} from 'src/app/models/guest-portal.model';
import { Restaurant, RestaurantResponse } from 'src/app/models/waitlist-api-guest-to-restaurant.model';

import {
  Category,
  Dish
} from 'src/app/models/waitlist-menu.model';

import {
  MenuService
} from 'src/app/services/menu.service';

import {
  UserService
} from 'src/app/services/USER/user.service';



@Component({
  selector: 'app-waitlist-user-home',
  templateUrl: './waitlist-user-home.component.html',
  styleUrls: ['./waitlist-user-home.component.css']
})
export class WaitlistUserHomeComponent implements OnInit {

  @Input()
  waitlistGuest: any = null;

  @Input()
  customerAccount: GuestAccount | null = null;

  @Input()
  hasWaitlistAccess = false;

  @Input()
  hasAccountAccess = false;

  @Input()
  cancelledGuest: any = null;

  @Input()
  restoreRequestSent = false;

  @Output()
  tabChange = new EventEmitter<GuestPortalTab>();

  @Output()
  accountLogin = new EventEmitter<void>();

  @Output()
  guestJoined = new EventEmitter<any>();

  @Output()
  restoreRequested = new EventEmitter<any>();

  selectedCategory = 'All';
  searchText = '';
  locationId = 1;

  isLoadingOffers = false;
  offerErrorMessage = '';

  isLoadingRestaurants = false;
  restaurantErrorMessage = '';

  offers: PortalOffer[] = [];
  restaurants: Restaurant[] = [];

  categories: Category[] = [];
  dishes: Dish[] = [];
  filteredDishes: Dish[] = [];

  nearbyRestaurants: PortalRestaurant[] = [];
  recentRestaurants: PortalRestaurant[] = [];

  constructor(
    private offerService: UserService,
    private menuService: MenuService
  ) { }

  ngOnInit(): void {
    this.loadRestaurantDetails();

    if (this.canAccessAccountFeatures) {
      this.loadOffers();
      this.loadMenuData();
    }
  }

  get canAccessAccountFeatures(): boolean {
    return (
      this.hasWaitlistAccess &&
      this.hasAccountAccess
    );
  }

  loadRestaurantDetails(): void {
    this.isLoadingRestaurants = true;
    this.restaurantErrorMessage = '';

    this.offerService
      .getRestaurantDetails()
      .subscribe({
        next: (response: RestaurantResponse) => {
          if (!response?.success) {
            this.restaurants = [];
            this.nearbyRestaurants = [];
            this.restaurantErrorMessage =
              response?.message ||
              'Unable to load restaurants.';
            this.isLoadingRestaurants = false;
            return;
          }

          this.restaurants =
            response.data || [];

          this.buildRestaurants();

          this.isLoadingRestaurants = false;
        },
        error: error => {
          console.error(
            'Restaurant details API error:',
            error
          );

          this.restaurants = [];
          this.nearbyRestaurants = [];

          this.restaurantErrorMessage =
            error?.error?.message ||
            'Unable to load restaurants.';

          this.isLoadingRestaurants = false;
        }
      });
  }

  private buildRestaurants(): void {
    this.nearbyRestaurants =
      this.restaurants.map(
        (restaurant, index) => ({
          id: restaurant.id,
          name: restaurant.name,
          cuisine: '',
          distance: '',
          rating: 0,
          reviewCount: 0,
          waitTime: 0,
          partiesAhead: 0,
          tableStatus:
            restaurant.totalTables > 0
              ? `${restaurant.totalTables} tables`
              : '',
          imageClass:
            this.getRestaurantClass(index),
          status:
            this.getRestaurantStatus(
              restaurant
            )
        })
      );

    this.recentRestaurants = [];
  }

  private getRestaurantStatus(
    restaurant: Restaurant
  ): 'OPEN' | 'BUSY' | 'NO_WAIT' | 'FULL' {
    if (restaurant.walkInsOnly) {
      return 'FULL';
    }

    if (restaurant.acceptOnlineJoin === false) {
      return 'BUSY';
    }

    return 'OPEN';
  }

  private getRestaurantClass(
    index: number
  ): string {
    const classes = [
      'restaurant-purple',
      'restaurant-gold',
      'restaurant-blue',
      'restaurant-green',
      'restaurant-pink'
    ];

    return classes[
      index % classes.length
    ];
  }

  loadOffers(): void {
    if (!this.canAccessAccountFeatures) {
      this.offers = [];
      return;
    }

    this.isLoadingOffers = true;
    this.offerErrorMessage = '';

    this.offerService
      .getOffers(
        this.locationId,
        'Active',
        0,
        20
      )
      .subscribe({
        next: response => {
          this.offers =
            response?.data?.content ||
            response?.content ||
            [];

          this.isLoadingOffers = false;
        },
        error: error => {
          console.error(
            'Offers API error:',
            error
          );

          this.offers = [];
          this.isLoadingOffers = false;

          this.offerErrorMessage =
            error?.error?.message ||
            'Unable to load offers.';
        }
      });
  }

  loadMenuData(): void {
    if (!this.canAccessAccountFeatures) {
      this.categories = [];
      this.dishes = [];
      this.filteredDishes = [];
      return;
    }

    const restaurantId =
      Number(
        localStorage.getItem(
          'waitlistRestaurantId'
        )
      );

    if (!restaurantId) {
      this.categories = [];
      this.dishes = [];
      this.filteredDishes = [];
      return;
    }

    this.menuService
      .getCategories(restaurantId)
      .subscribe({
        next: categories => {
          this.categories =
            categories || [];

          this.loadAllMenuDishes(
            restaurantId
          );
        },
        error: error => {
          console.error(
            'Home menu category error:',
            error
          );

          this.categories = [];
          this.dishes = [];
          this.filteredDishes = [];
        }
      });
  }

  private loadAllMenuDishes(
    restaurantId: number
  ): void {
    if (
      !this.canAccessAccountFeatures
    ) {
      this.dishes = [];
      this.filteredDishes = [];
      return;
    }

    if (!this.categories.length) {
      this.dishes = [];
      this.filteredDishes = [];
      return;
    }

    const requests =
      this.categories.map(
        category =>
          this.menuService
            .getDishesByCategory(
              category.name,restaurantId
            )
      );

    let completed = 0;
    const allDishes: Dish[] = [];

    requests.forEach(request => {
      request.subscribe({
        next: response => {
          const activeDishes =
            (response || []).filter(
              dish =>
                String(
                  dish.status || ''
                )
                  .trim()
                  .toLowerCase() ===
                'active'
            );

          allDishes.push(
            ...activeDishes
          );

          completed++;

          if (
            completed ===
            requests.length
          ) {
            this.dishes =
              this.removeDuplicateDishes(
                allDishes
              );

            this.applySearch();
          }
        },
        error: error => {
          console.error(
            'Home menu dishes error:',
            error
          );

          completed++;

          if (
            completed ===
            requests.length
          ) {
            this.dishes =
              this.removeDuplicateDishes(
                allDishes
              );

            this.applySearch();
          }
        }
      });
    });
  }

  private removeDuplicateDishes(
    dishes: Dish[]
  ): Dish[] {
    const map =
      new Map<
        number | string,
        Dish
      >();

    dishes.forEach(dish => {
      const key =
        dish.id ??
        dish.name;

      if (!map.has(key)) {
        map.set(key, dish);
      }
    });

    return Array.from(
      map.values()
    );
  }

  get homeOffers(): PortalOffer[] {
    return this.offers.slice(0, 2);
  }

  get filteredRestaurants(): PortalRestaurant[] {
    const search =
      this.searchText
        .trim()
        .toLowerCase();

    if (!search) {
      return this.nearbyRestaurants;
    }

    return this.nearbyRestaurants.filter(
      restaurant => {
        const name =
          String(
            restaurant.name || ''
          ).toLowerCase();

        const cuisine =
          String(
            restaurant.cuisine || ''
          ).toLowerCase();

        return (
          name.includes(search) ||
          cuisine.includes(search)
        );
      }
    );
  }

  get searchResultsCount(): number {
    return (
      this.filteredRestaurants.length +
      this.filteredDishes.length
    );
  }

  applySearch(): void {
    if (
      !this.canAccessAccountFeatures
    ) {
      this.filteredDishes = [];
      return;
    }

    const search =
      this.searchText
        .trim()
        .toLowerCase();

    if (!search) {
      this.filteredDishes =
        this.dishes;

      return;
    }

    this.filteredDishes =
      this.dishes.filter(
        dish => {
          const dishName =
            String(
              dish.name || ''
            )
              .trim()
              .toLowerCase();

          const category =
            String(
              dish.category || ''
            )
              .trim()
              .toLowerCase();

          return (
            dishName.includes(search) ||
            category.includes(search)
          );
        }
      );
  }

  onSearchChange(): void {
    this.applySearch();
  }

  clearSearch(): void {
    this.searchText = '';
    this.applySearch();
  }

  selectCategory(
    category: string
  ): void {
    this.selectedCategory =
      category;

    if (
      category === 'All' ||
      category === 'Open now' ||
      category === 'No wait'
    ) {
      this.filteredDishes =
        this.dishes;

      return;
    }

    this.filteredDishes =
      this.dishes.filter(
        dish =>
          String(
            dish.category || ''
          )
            .trim()
            .toLowerCase() ===
          category
            .trim()
            .toLowerCase()
      );
  }

  openTab(
    tab: GuestPortalTab
  ): void {
    this.tabChange.emit(tab);
  }

  loginWithEmail(): void {
    this.accountLogin.emit();
  }

  onGuestJoined(
    guest: any
  ): void {
    this.guestJoined.emit(
      guest
    );
  }

  onRestoreRequested(
    guest: any
  ): void {
    this.restoreRequested.emit(
      guest
    );
  }

  joinRestaurantWaitlist(
    restaurant: PortalRestaurant
  ): void {
    const restaurantId =
      restaurant.id;

    localStorage.setItem(
      'waitlistRestaurantId',
      restaurantId.toString()
    );

    this.openTab(
      'WAITLIST'
    );
  }

  viewOffer(
    offer: PortalOffer
  ): void {
    if (
      !this.hasAccountAccess
    ) {
      this.loginWithEmail();
      return;
    }

    this.offerService
      .getOfferById(
        offer.id
      )
      .subscribe({
        next: response => {
          console.log(
            'Offer details:',
            response
          );

          this.openTab(
            'OFFERS'
          );
        },
        error: error => {
          console.error(
            'Offer details error:',
            error
          );
        }
      });
  }

  getImageBackgroundClass(
    index: number
  ): string {
    const classes = [
      'restaurant-purple',
      'restaurant-gold',
      'restaurant-blue',
      'restaurant-green',
      'restaurant-pink'
    ];

    return classes[
      index % classes.length
    ];
  }

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

    return numericPrice.toFixed(2);
  }
}