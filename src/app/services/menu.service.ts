import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { Category, Dish } from '../models/waitlist-menu.model';

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  private apiUrl = `${environment.menuApiUrl}/categories`;

  private dishByCategoryUrl = `${environment.menuApiUrl}/dishes/category`

  private dishById = `${environment.menuApiUrl}/dishes`
  constructor(private http: HttpClient) { }

  getCategories(locationId:any): Observable<Category[]> {
    let params = new HttpParams();
    if (locationId) {
      params = params.set('locationId', locationId);
    }
    return this.http.get<Category[]>(this.apiUrl,{params});
  }

  getDishesByCategory(categoryName: string, locationId: any): Observable<Dish[]> {
    let params = new HttpParams();
    if (locationId) {
      params = params.set('locationId', locationId);
    }
    return this.http.get<Dish[]>(
      `${this.dishByCategoryUrl}/${encodeURIComponent(categoryName)}`,
      { params }
    );
  }
  getDishById(id: number) {
    return this.http.get<Dish>(
      `${this.dishById}/${encodeURIComponent(id)}`
    );
  }
}
