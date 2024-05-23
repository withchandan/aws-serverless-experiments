import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class HealthService {
  constructor(readonly http: HttpService) {}

  async health() {
    return { message: 'All good!' };
  }

  async version() {
    const { data } = await lastValueFrom(
      this.http.get(`https://jsonplaceholder.typicode.com/todos/1`),
    );

    console.log(data);

    return { version: '0.1.0' };
  }
}
