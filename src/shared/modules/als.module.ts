import { Module } from '@nestjs/common/decorators/modules/module.decorator';
import { AsyncLocalStorage } from 'async_hooks';
import { RequestContext } from '../interfaces/als-request.interface';
import { AsyncContextService } from '../services/context/async-context.service';
import { Global } from '@nestjs/common/decorators/modules/global.decorator';

@Global()
@Module({
  providers: [
    {
      provide: AsyncLocalStorage,
      useValue: new AsyncLocalStorage<RequestContext>(),
    },
    AsyncContextService,
  ],
  exports: [AsyncLocalStorage, AsyncContextService],
})
export class AlsModule {}
