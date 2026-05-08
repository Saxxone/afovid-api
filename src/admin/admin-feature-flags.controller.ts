import {
  Body,
  Controller,
  Get,
  Patch,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { IsBoolean, IsString } from 'class-validator';
import { AdminPermission } from '@prisma/client';
import { JwtPayload } from 'src/auth/auth.guard';
import { RequiresFeatureFlag } from 'src/feature-flag/feature-flag.decorator';
import { FeatureFlagGuard } from 'src/feature-flag/feature-flag.guard';
import { FeatureFlagService } from 'src/feature-flag/feature-flag.service';
import { Permissions } from './permissions.decorator';
import { PermissionsGuard } from './permissions.guard';

class PatchFeatureFlagBodyDto {
  @IsString()
  key: string;

  @IsBoolean()
  enabled: boolean;
}

@Controller('admin/feature-flags')
@UseGuards(PermissionsGuard, FeatureFlagGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AdminFeatureFlagsController {
  constructor(private readonly flags: FeatureFlagService) {}

  @Permissions(AdminPermission.FEATURE_FLAGS_MANAGE)
  @RequiresFeatureFlag('admin.featureFlags')
  @Get()
  async list(@Request() req: { user: JwtPayload }) {
    const items = await this.flags.findAllForAdmin();
    return {
      items,
      viewerEmail: req.user.sub,
    };
  }

  @Permissions(AdminPermission.FEATURE_FLAGS_MANAGE)
  @RequiresFeatureFlag('admin.featureFlags')
  @Patch()
  async patch(
    @Request() req: { user: JwtPayload },
    @Body() body: PatchFeatureFlagBodyDto,
  ) {
    await this.flags.patchFlag(body.key, body.enabled, req.user.sub);
    const row = await this.flags.findOneByKey(body.key);
    return row;
  }
}
