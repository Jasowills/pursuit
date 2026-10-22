import { Body, Controller, Get, Post, Put, Req } from '@nestjs/common';
import type { Request } from 'express';
import { authOf } from './ctx';
import { ZodValidationPipe } from './zod.pipe';
import {
  AutopilotService,
  AutopilotSettings,
  AutopilotSettingsInput,
  AutopilotStatus,
} from './autopilot.service';

@Controller('autopilot')
export class AutopilotController {
  constructor(private readonly autopilot: AutopilotService) {}
  @Get() status(@Req() r: Request): Promise<AutopilotStatus> {
    return this.autopilot.status(authOf(r));
  }
  @Put() save(
    @Req() r: Request,
    @Body(new ZodValidationPipe(AutopilotSettings)) body: AutopilotSettingsInput,
  ): Promise<AutopilotStatus> {
    return this.autopilot.save(authOf(r), body);
  }
  @Post('pause') pause(@Req() r: Request): Promise<AutopilotStatus> {
    return this.autopilot.pause(authOf(r));
  }
  @Post('run') run(@Req() r: Request) {
    return this.autopilot.runSoon(authOf(r));
  }
}
