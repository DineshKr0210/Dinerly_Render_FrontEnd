import { Component } from '@angular/core';
import { PortalOffer } from 'src/app/models/guest-portal.model';

@Component({
  selector: 'app-waitlist-user-discounts',
  templateUrl: './waitlist-user-discounts.component.html',
  styleUrls: ['./waitlist-user-discounts.component.css']
})
export class WaitlistUserDiscountsComponent {
offers: PortalOffer[] = []
}
