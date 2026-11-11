import {
  Component,
  HostListener,
  OnDestroy,
  OnInit
} from '@angular/core';
import { Router } from '@angular/router';
import { WaitlistAuthService } from 'src/app/services/waitlist-auth.service';

interface HelpArticle {
  id: number;
  title: string;
  description: string;
}

interface SupportCase {
  issue: string;
  status: 'OPEN' | 'CLOSED' | 'PENDING';
  caseNumber: string;
  lastUpdated: string;
}

interface HelpResource {
  title: string;
  description: string;
  icon: string;
}

interface PendingHelpGuest {
  id: number;
  guestName: string;
  guestPhone: string;
  partySize: number;
  joinedVia: string;
}

@Component({
  selector: 'app-waitlist-help',
  templateUrl: './waitlist-help.component.html',
  styleUrls: ['./waitlist-help.component.css']
})
export class WaitlistHelpComponent implements OnInit, OnDestroy {
  restaurantName = '';
  showRestaurantMenu = false;

  currentTime = '';

  private clockInterval:

    ReturnType<typeof setInterval> | null =

    null;

  latestPendingGuest:

    PendingHelpGuest | null = {

      id: 101,

      guestName: 'Maya Thompson',

      guestPhone: '(204) 555-0184',

      partySize: 2,

      joinedVia: 'QR code'

    };

  popularArticlesLeft:

    HelpArticle[] = [

      {

        id: 1,

        title:

          'Adding and updating your plan or payment method',

        description:

          'Learn how to review your current plan, update payment information and manage billing settings.'

      },

      {

        id: 2,

        title:

          'Setting your max party size and quoted wait times',

        description:

          'Configure the maximum party size and manage the estimated wait times shown to guests.'

      },

      {

        id: 3,

        title:

          'Adding and removing staff members',

        description:

          'Manage restaurant staff access and remove users who no longer need access.'

      }

    ];

  popularArticlesRight:

    HelpArticle[] = [

      {

        id: 4,

        title:

          'Understanding your text message usage',

        description:

          'Review notification usage and learn how outgoing guest messages are calculated.'

      },

      {

        id: 5,

        title:

          'Customizing your table-ready text message',

        description:

          'Customize the message guests receive when their table is almost ready.'

      },

      {

        id: 6,

        title:

          'Updating your restaurant details',

        description:

          'Update your restaurant name, contact details, address and operating hours.'

      }

    ];

  supportCases:

    SupportCase[] = [

      {

        issue:

          'Text message balance question',

        status: 'CLOSED',

        caseNumber: '#741208',

        lastUpdated: '3 days ago'

      },

      {

        issue:

          'Billing charge dispute',

        status: 'CLOSED',

        caseNumber: '#739951',

        lastUpdated: '1 week ago'

      }

    ];

  resources:

    HelpResource[] = [

      {

        title: 'Learning center',

        description:

          'Step-by-step guides to set up your restaurant and manage day-to-day waitlist operations.',

        icon: 'fa-solid fa-layer-group'

      },

      {

        title: 'Video tutorials',

        description:

          'Short walkthrough videos covering setup, the waitlist, and everyday tasks.',

        icon: 'fa-solid fa-clapperboard'

      }

    ];

  showMessagePopup = false;

  supportSubject = '';

  supportMessage = '';

  isSendingSupportMessage = false;

  selectedArticle:

    HelpArticle | null = null;

  showArticlePopup = false;

  constructor(private authService: WaitlistAuthService, private router: Router,) { }
  ngOnInit(): void {
    this.restaurantName =
      this.authService
        .getRestaurantName();

    this.updateCurrentTime();

    this.clockInterval =

      setInterval(() => {

        this.updateCurrentTime();

      }, 1000);

  }

  ngOnDestroy(): void {

    if (this.clockInterval) {

      clearInterval(

        this.clockInterval

      );

    }

  }

  private updateCurrentTime(): void {

    this.currentTime =

      new Date().toLocaleTimeString(

        'en-US',

        {

          hour: 'numeric',

          minute: '2-digit',

          hour12: true

        }

      );

  }

  simulateOnlineJoin(): void {

    alert(

      'Simulate online join clicked'

    );

  }

  addWalkIn(): void {

    alert(

      'Add Walk-in clicked'

    );

  }

  declinePendingGuest(): void {

    if (!this.latestPendingGuest) {

      return;

    }

    const confirmed =

      window.confirm(

        `Decline ${this.latestPendingGuest.guestName}'s request?`

      );

    if (!confirmed) {

      return;

    }

    this.latestPendingGuest = null;

  }

  approvePendingGuest(): void {

    if (!this.latestPendingGuest) {

      return;

    }

    alert(

      `${this.latestPendingGuest.guestName} approved successfully`

    );

    this.latestPendingGuest = null;

  }

  callSupport(): void {

    window.location.href =

      'tel:+12045550199';

  }

  openMessagePopup(): void {

    this.supportSubject = '';

    this.supportMessage = '';

    this.showMessagePopup = true;

  }

  closeMessagePopup(): void {

    if (this.isSendingSupportMessage) {

      return;

    }

    this.showMessagePopup = false;

    this.supportSubject = '';

    this.supportMessage = '';

  }

  sendSupportMessage(): void {

    const subject =

      this.supportSubject.trim();

    const message =

      this.supportMessage.trim();

    if (!subject || !message) {

      alert(

        'Please enter a subject and message.'

      );

      return;

    }

    this.isSendingSupportMessage = true;

    /*

     * Replace this timeout with your support API.

     */

    setTimeout(() => {

      this.isSendingSupportMessage = false;

      alert(

        'Your support request has been sent.'

      );

      this.closeMessagePopup();

    }, 800);

  }

  openArticle(

    article: HelpArticle

  ): void {

    this.selectedArticle = article;

    this.showArticlePopup = true;

  }

  closeArticlePopup(): void {

    this.showArticlePopup = false;

    this.selectedArticle = null;

  }

  openSupportCase(

    supportCase: SupportCase

  ): void {

    alert(

      `${supportCase.issue}\n${supportCase.caseNumber}`

    );

  }

  openResource(

    resource: HelpResource

  ): void {

    alert(

      `${resource.title} selected`

    );

  }

  getSupportStatusClass(

    status: SupportCase['status']

  ): string {

    return (

      'case-status-' +

      status.toLowerCase()

    );

  }

  get restaurantInitial(): string {

    const name =
      this.restaurantName.trim();

    if (!name) {
      return 'R';
    }

    return name
      .charAt(0)
      .toUpperCase();
  }

  @HostListener('document:click')
  closeContactActions(): void {
    this.showRestaurantMenu = false;
  }

  toggleRestaurantMenu(
    event: MouseEvent
  ): void {

    event.stopPropagation();

    this.showRestaurantMenu =
      !this.showRestaurantMenu;
  }



  logoutFromMenu(
    event: MouseEvent
  ): void {

    event.stopPropagation();

    this.logout();
  }

  logout(): void {
    localStorage.removeItem(
      'authToken'
    );

    this.router.navigate([
      '/login'
    ]);
  }
}
