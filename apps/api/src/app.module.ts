import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { Reflector } from '@nestjs/core';
import { AuditInterceptor } from './audit.interceptor';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { CareersController } from './careers.controller';
import { CareersService } from './careers.service';
import { CoreController } from './core.controller';
import { DbService } from './db.service';
import { EventsController } from './events.controller';

@Module({
  controllers: [CoreController, CareersController, EventsController],
  providers: [
    DbService,
    AuthService,
    CareersService,
    Reflector,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
