import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { dump } from 'wtfnode';

@Injectable()
export class HealthService {
  constructor(readonly http: HttpService) {}

  async health() {
    return { message: 'All good!' };
  }

  async version() {
    await Promise.all(
      [1, 2, 3, 4, 5].map(async () => {
        const { data } = await lastValueFrom(
          this.http.get('https://jsonplaceholder.typicode.com/todos/1'),
        );

        console.log(data);
      }),
    );

    dump();

    return { version: '0.1.0' };
  }
}
