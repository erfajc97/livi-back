import { Global, Module } from '@nestjs/common';
import { WalletfyService } from './walletfy.service';

/** Global: cualquier módulo puede inyectar WalletfyService sin importar esto. */
@Global()
@Module({
  providers: [WalletfyService],
  exports: [WalletfyService],
})
export class WalletfyModule {}
