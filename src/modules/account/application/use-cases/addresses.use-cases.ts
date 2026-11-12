import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateAddressDto, UpdateAddressDto } from '../dto/address.dto';
import { ADDRESS_REPOSITORY, AddressRepository } from '../../domain/account.repository';

@Injectable()
export class AddressesUseCases {
  constructor(@Inject(ADDRESS_REPOSITORY) private readonly addresses: AddressRepository) {}

  list(userId: string) {
    return this.addresses.findByUser(userId);
  }

  async create(userId: string, dto: CreateAddressDto) {
    const existing = await this.addresses.findByUser(userId);
    // La primera dirección siempre es la predeterminada.
    const isDefault = dto.isDefault || existing.length === 0;
    if (isDefault) await this.addresses.clearDefault(userId);
    return this.addresses.create(userId, { ...dto, intNumber: dto.intNumber ?? null, references: dto.references ?? null, isDefault });
  }

  async update(userId: string, id: string, dto: UpdateAddressDto) {
    if (!(await this.addresses.findOne(userId, id))) throw new NotFoundException('Dirección no encontrada');
    if (dto.isDefault) await this.addresses.clearDefault(userId);
    return this.addresses.update(userId, id, dto);
  }

  async remove(userId: string, id: string) {
    if (!(await this.addresses.findOne(userId, id))) throw new NotFoundException('Dirección no encontrada');
    await this.addresses.remove(userId, id);
  }
}
