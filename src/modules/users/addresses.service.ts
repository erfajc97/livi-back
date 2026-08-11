import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAddress } from './entities/user-address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(UserAddress)
    private addressesRepository: Repository<UserAddress>,
  ) {}

  async findAll(userId: number): Promise<UserAddress[]> {
    return this.addressesRepository.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'ASC' },
    });
  }

  async create(
    userId: number,
    createAddressDto: CreateAddressDto,
  ): Promise<UserAddress> {
    const count = await this.addressesRepository.count({
      where: { userId },
    });

    // La primera dirección del usuario siempre queda predeterminada;
    // si viene isDefault=true se desmarcan las demás (solo una por usuario).
    const shouldBeDefault = createAddressDto.isDefault === true || count === 0;

    if (shouldBeDefault && count > 0) {
      await this.unsetDefaults(userId);
    }

    const address = this.addressesRepository.create({
      ...createAddressDto,
      userId,
      isDefault: shouldBeDefault,
    });

    return this.addressesRepository.save(address);
  }

  async update(
    userId: number,
    id: number,
    updateAddressDto: UpdateAddressDto,
  ): Promise<UserAddress> {
    const address = await this.findOwned(userId, id);

    if (updateAddressDto.isDefault === true && !address.isDefault) {
      await this.unsetDefaults(userId);
    }

    Object.assign(address, updateAddressDto);
    return this.addressesRepository.save(address);
  }

  async remove(userId: number, id: number): Promise<void> {
    const address = await this.findOwned(userId, id);
    await this.addressesRepository.remove(address);

    // Si se eliminó la predeterminada, la más antigua restante pasa a serla
    // para que el checkout siempre tenga una dirección preseleccionada.
    if (address.isDefault) {
      const next = await this.addressesRepository.findOne({
        where: { userId },
        order: { createdAt: 'ASC' },
      });
      if (next) {
        next.isDefault = true;
        await this.addressesRepository.save(next);
      }
    }
  }

  async setDefault(userId: number, id: number): Promise<UserAddress> {
    const address = await this.findOwned(userId, id);

    if (!address.isDefault) {
      await this.unsetDefaults(userId);
      address.isDefault = true;
      await this.addressesRepository.save(address);
    }

    return address;
  }

  private async findOwned(userId: number, id: number): Promise<UserAddress> {
    const address = await this.addressesRepository.findOne({
      where: { id, userId },
    });

    if (!address) {
      throw new NotFoundException('Dirección no encontrada');
    }

    return address;
  }

  private async unsetDefaults(userId: number): Promise<void> {
    await this.addressesRepository.update(
      { userId, isDefault: true },
      { isDefault: false },
    );
  }
}
