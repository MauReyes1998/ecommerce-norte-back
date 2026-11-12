export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  sortOrder: number;
  parentId: string | null;
  children: Category[];
}
