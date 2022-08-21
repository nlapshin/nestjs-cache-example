import { Injectable } from '@nestjs/common';
import { cacheMethod } from './cache/cacheDecorators';

@Injectable()
export class AppService {
  private callCount = 0;

  @cacheMethod({
    postfixFn: (args: any[]) => args[0].toString(),
    ttl: 5,
  })
  getHello(name: string): Promise<string> {
    return this.dbCall(name);
  }

  private async dbCall(name: string, delayTime = 3000): Promise<string> {
    return new Promise((res) => {
      setTimeout(() => {
        res(`Hello ${name}: ${++this.callCount}`);
      }, delayTime);
    });
  }
}
