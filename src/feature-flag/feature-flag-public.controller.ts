import { Controller, Get } from '@nestjs/common';
import { Public } from 'src/auth/auth.guard';
import { FeatureFlagService } from './feature-flag.service';

@Controller('feature-flags')
export class FeatureFlagPublicController {
  constructor(private readonly flags: FeatureFlagService) {}

  /** Client-safe flags only (`CLIENT_SAFE` scope). */
  @Public()
  @Get()
  async listPublic(): Promise<{ flags: Record<string, boolean> }> {
    const flags = await this.flags.getPublicFlagMap();
    return { flags };
  }
}
