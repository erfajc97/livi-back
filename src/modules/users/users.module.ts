import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AddressesService } from './addresses.service';
import { AddressesController } from './addresses.controller';
import { User } from './entities/user.entity';
import { UserAddress } from './entities/user-address.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserAddress])],
  controllers: [UsersController, AddressesController],
  providers: [UsersService, AddressesService],
  exports: [UsersService],
})
export class UsersModule {}
