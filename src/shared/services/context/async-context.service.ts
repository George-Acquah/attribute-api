// src/common/context/async-context.service.ts
import { AsyncLocalStorage } from 'async_hooks';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { RequestContext } from '../../interfaces/als-request.interface';
@Injectable()
export class AsyncContextService {
  constructor(private readonly als: AsyncLocalStorage<RequestContext>) {}

  run<T>(context: RequestContext, callback: () => T) {
    return this.als.run(context, callback);
  }

  get<T extends keyof RequestContext>(key: T): RequestContext[T] | undefined {
    return this.getStore()?.[key];
  }

  set<T extends keyof RequestContext>(key: T, value: RequestContext[T]) {
    const store = this.getStore();
    if (store) {
      store[key] = value;
    }
  }

  getStore(): RequestContext | undefined {
    return this.als.getStore();
  }
}
