import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RequiresFeatureFlag } from 'src/feature-flag/feature-flag.decorator';
import { FeatureFlagGuard } from 'src/feature-flag/feature-flag.guard';
import {
  ClaimKeysDto,
  RegisterDeviceDto,
  UploadOneTimeKeysDto,
} from './dto/device.dto';
import { DeviceService } from './device.service';

interface AuthedRequest {
  user: { userId: string };
}

@Controller('device')
@UseGuards(FeatureFlagGuard)
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  /**
   * Register a new device and upload its initial OTK/fallback-key bundle.
   * Tight throttle since this hits Prisma writes and Ed25519 verify under
   * the request.
   */
  @RequiresFeatureFlag('auth.deviceManagement', 'messaging.e2ee')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post()
  register(@Request() req: AuthedRequest, @Body() dto: RegisterDeviceDto) {
    return this.deviceService.register(req.user.userId, dto);
  }

  @RequiresFeatureFlag('auth.deviceManagement')
  @Get('me')
  list(@Request() req: AuthedRequest) {
    return this.deviceService.listForUser(req.user.userId);
  }

  @RequiresFeatureFlag('auth.deviceManagement')
  @Delete(':id')
  revoke(
    @Request() req: AuthedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.deviceService.revoke(req.user.userId, id);
  }

  /**
   * Claim prekey bundles for every active device of `targetUserId`.
   * Throttled to prevent OTK drain against a specific target.
   */
  @RequiresFeatureFlag('messaging.e2ee')
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  @Post('keys/claim')
  async claim(@Body() dto: ClaimKeysDto) {
    return { bundles: await this.deviceService.claimKeys(dto.targetUserId) };
  }

  /** Uploader-side OTK replenish for `id` (caller must own device). */
  @RequiresFeatureFlag('messaging.e2ee')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @Post(':id/keys/otk')
  uploadOtks(
    @Request() req: AuthedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UploadOneTimeKeysDto,
  ) {
    return this.deviceService.uploadOneTimeKeys(req.user.userId, id, dto);
  }

  @RequiresFeatureFlag('messaging.e2ee')
  @Get(':id/keys/otk-count')
  otkCount(
    @Request() req: AuthedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.deviceService.unclaimedOtkCount(req.user.userId, id);
  }
}
