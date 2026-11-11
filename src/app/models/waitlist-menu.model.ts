export interface Type {
  id: number;
  name: string;
}

export interface Dish {
  id: number;
  name: string;
  description: string;
  price: number;
  calories: number;
  imageUrl: string;
  category: string;
  types: Type[];
  status?:string;

  // UI-only property
  showDetails?: boolean;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  dishes?: Dish[];
}