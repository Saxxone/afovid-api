import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Public } from 'src/auth/auth.guard';
import { RequiresFeatureFlag } from 'src/feature-flag/feature-flag.decorator';
import { FeatureFlagGuard } from 'src/feature-flag/feature-flag.guard';
import { CoinPurchaseService } from './coin-purchase.service';
import { CoinUnlockService } from './coin-unlock.service';
import { CoinWalletService } from './coin-wallet.service';
import { StripeCheckoutDto } from './dto/stripe-checkout.dto';
import { VerifyAppleDto } from './dto/verify-apple.dto';
import { VerifyGoogleDto } from './dto/verify-google.dto';

@UseGuards(FeatureFlagGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
  }),
)
@Controller('coins')
export class CoinsController {
  constructor(
    private readonly purchase: CoinPurchaseService,
    private readonly unlock: CoinUnlockService,
    private readonly wallet: CoinWalletService,
  ) {}

  @Public()
  @RequiresFeatureFlag('coins.packages')
  @Get('packages')
  async listPackages() {
    return this.purchase.listPackages();
  }

  @RequiresFeatureFlag('coins.wallet')
  @Get('balance')
  async balance(@Request() req: { user: { userId: string } }) {
    const minor = await this.wallet.getBalanceMinor(req.user.userId);
    return { balanceMinor: minor };
  }

  @Public()
  @RequiresFeatureFlag('coins.paidUnlocks')
  @Get('quote/:postId')
  async quote(
    @Param('postId') postId: string,
    @Request() req: { user?: { userId: string } },
  ) {
    return this.unlock.quote(postId, req.user?.userId);
  }

  @RequiresFeatureFlag('coins.paidUnlocks')
  @Post('unlock/:postId')
  async unlockPost(
    @Request() req: { user: { userId: string } },
    @Param('postId') postId: string,
  ) {
    return this.unlock.unlockPost(req.user.userId, postId);
  }

  @RequiresFeatureFlag('coins.stripeCheckout')
  @Post('checkout/stripe')
  async stripeCheckout(
    @Request() req: { user: { userId: string } },
    @Body() body: StripeCheckoutDto,
  ) {
    return this.purchase.createStripeCheckoutSession(
      req.user.userId,
      body.packageId,
      body.client ?? 'web',
    );
  }

  @RequiresFeatureFlag('coins.appleIap')
  @Post('verify/apple')
  async verifyApple(
    @Request() req: { user: { userId: string } },
    @Body() body: VerifyAppleDto,
  ) {
    return this.purchase.creditFromAppleTransaction(
      req.user.userId,
      body.transactionId,
    );
  }

  @RequiresFeatureFlag('coins.googlePlayBilling')
  @Post('verify/google')
  async verifyGoogle(
    @Request() req: { user: { userId: string } },
    @Body() body: VerifyGoogleDto,
  ) {
    return this.purchase.creditFromGooglePurchase(
      req.user.userId,
      body.productId,
      body.purchaseToken,
    );
  }
}
