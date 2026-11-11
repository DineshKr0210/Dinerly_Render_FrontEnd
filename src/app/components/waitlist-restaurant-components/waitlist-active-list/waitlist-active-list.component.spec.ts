import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Router } from '@angular/router';

import { NotificationService } from 'src/app/services/notification.service';
import { ToastService } from 'src/app/services/toast.service';
import { WaitlistApiRestaurantService } from 'src/app/services/waitlist-api-restaurant.service';
import { WaitlistAuthService } from 'src/app/services/waitlist-auth.service';
import { WaitlistRestaurantModalService } from 'src/app/services/waitlist-restaurant-modal.service';

import { WaitlistActiveListComponent } from './waitlist-active-list.component';

describe('WaitlistActiveListComponent', () => {
  let component: WaitlistActiveListComponent;
  let fixture: ComponentFixture<WaitlistActiveListComponent>;

  const mockAuthService = {
    getRestaurantId: () => 1,
    getRestaurantName: () => 'Test Restaurant'
  };

  const mockWaitlistApiService = jasmine.createSpyObj('WaitlistApiRestaurantService', [
    'getDashboardData',
    'getGuestsStatus',
    'getWaitingGuests',
    'getNotifiedGuests',
    'getSeatedGuests',
    'getCancelledGuests',
    'getRestaurantTableslist'
  ]);

  beforeEach(async () => {
    mockWaitlistApiService.getDashboardData.and.returnValue(of({ success: true, data: {} }));
    mockWaitlistApiService.getGuestsStatus.and.returnValue(of({ data: [] }));
    mockWaitlistApiService.getWaitingGuests.and.returnValue(of({ data: [] }));
    mockWaitlistApiService.getNotifiedGuests.and.returnValue(of({ data: [] }));
    mockWaitlistApiService.getSeatedGuests.and.returnValue(of({ data: [] }));
    mockWaitlistApiService.getCancelledGuests.and.returnValue(of({ data: [] }));
    mockWaitlistApiService.getRestaurantTableslist.and.returnValue(of({ data: [] }));

    await TestBed.configureTestingModule({
      declarations: [WaitlistActiveListComponent],
      providers: [
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
        { provide: WaitlistRestaurantModalService, useValue: { open: jasmine.createSpy('open') } },
        { provide: WaitlistApiRestaurantService, useValue: mockWaitlistApiService },
        { provide: NotificationService, useValue: {} },
        { provide: WaitlistAuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: { showSuccess: jasmine.createSpy('showSuccess'), showError: jasmine.createSpy('showError') } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WaitlistActiveListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render seated and cancelled guests when data is present', () => {
    component.seatedGuests = [
      { id: 1, guestName: 'Alice Smith', partySize: 2, status: 'SEATED', seatedAt: '2024-01-01T18:00:00Z' } as any
    ];
    component.cancelledGuests = [
      { id: 2, guestName: 'Bob Jones', partySize: 3, status: 'CANCELLED', cancelledAt: '2024-01-01T18:05:00Z' } as any
    ];

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Alice Smith');
    expect(text).toContain('Bob Jones');
  });
});
