import { AutopilotService } from './autopilot.service';
import { AutopilotController } from './autopilot.controller';
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
import { ConnectionsController } from './connections.controller';
import { ConnectionsService } from './connections.service';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { GmailService } from './gmail.service';
import { DirectGmailService } from './direct-gmail.service';

@Module({
  controllers: [
    AutopilotController,
    CoreController,
    CareersController,
    EventsController,
    ConnectionsController,
    WorkflowController,
  ],
  providers: [
    AutopilotService,
    DbService,
    AuthService,
    CareersService,
    ConnectionsService,
    WorkflowService,
    GmailService,
    DirectGmailService,
    Reflector,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
