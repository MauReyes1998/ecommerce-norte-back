import { ShippingAddress } from '@/modules/orders/domain/entities/order.entity';
import { ProductSummary } from '@/modules/catalog/domain/entities/product.entity';

export interface Address extends ShippingAddress {
  id: string;
  isDefault: boolean;
}

export type NewAddress = Omit<Address, 'id'>;

export interface AddressRepository {
  findByUser(userId: string): Promise<Address[]>;
  findOne(userId: string, id: string): Promise<Address | null>;
  create(userId: string, data: NewAddress): Promise<Address>;
  update(userId: string, id: string, data: Partial<NewAddress>): Promise<Address>;
  remove(userId: string, id: string): Promise<void>;
  clearDefault(userId: string): Promise<void>;
}

export interface FavoriteRepository {
  findByUser(userId: string): Promise<ProductSummary[]>;
  idsByUser(userId: string): Promise<string[]>;
  add(userId: string, productId: string): Promise<void>;
  remove(userId: string, productId: string): Promise<void>;
}

export const ADDRESS_REPOSITORY = Symbol('ADDRESS_REPOSITORY');
export const FAVORITE_REPOSITORY = Symbol('FAVORITE_REPOSITORY');
