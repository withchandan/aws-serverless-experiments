import { Injectable } from '@nestjs/common';

import wtf from 'wtfnode';

@Injectable()
export class AppService {
  getHello(): string {
    wtf.dump();

    return 'Hello World!';
  }
}
