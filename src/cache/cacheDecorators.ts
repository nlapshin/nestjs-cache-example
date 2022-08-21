import { CACHE_MANAGER, Inject } from '@nestjs/common';

export interface ICacheMethodOptions {
  ttl?: number;
  postfixFn?: (args: any[]) => string;
}

export const cacheMethod = (options?: ICacheMethodOptions) => {
  const promiseCache: {
    [name: string]: Promise<string>;
  } = {};

  const injectCache = Inject(CACHE_MANAGER);

  return function (
    target: any,
    _propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    injectCache(target, 'cache');

    const decoratedMethod = descriptor.value;
    const cacheRoot = `${target.constructor.name}-${decoratedMethod?.name}`;

    descriptor.value = async function (...args: any[]) {
      const cachePostfix = options?.postfixFn
        ? options?.postfixFn(args)
        : args.join('-');
      const cacheKey = `${cacheRoot}-${cachePostfix}`;

      const cacheValue = await this.cache.get(cacheKey);

      if (cacheValue) {
        return cacheValue;
      }

      if (cacheKey in promiseCache) {
        return promiseCache[cacheKey];
      }

      const promise = decoratedMethod.apply(this, args);
      promiseCache[cacheKey] = promise;

      const response = await promiseCache[cacheKey];
      delete promiseCache[cacheKey];
      await this.cache.set(cacheKey, response, { ttl: options?.ttl || 0 });

      return response;
    };
  };
};
