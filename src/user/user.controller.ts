import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User, User as UserModel } from '@prisma/client';
import { Public } from 'src/auth/auth.guard';
import { RequiresFeatureFlag } from 'src/feature-flag/feature-flag.decorator';
import { FeatureFlagGuard } from 'src/feature-flag/feature-flag.guard';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('user')
@UseGuards(FeatureFlagGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @RequiresFeatureFlag('auth.publicSignup')
  @Post('register')
  async signupUser(
    @Body()
    userData: CreateUserDto,
  ): Promise<UserModel> {
    return this.userService.createUser(userData);
  }

  @RequiresFeatureFlag('social.profiles')
  @Get('/:id')
  async getUserById(@Param('id') id: string): Promise<UserModel> {
    return this.userService.findUser(id);
  }

  @RequiresFeatureFlag('social.exploreSearch')
  @Post('/search')
  async getFilteredUsers(
    @Query('q') search_string: string,
    @Request() req: any,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ): Promise<Partial<UserModel>[]> {
    return this.userService.getMultipleUsers(
      {
        skip: Number(skip) || 0,
        take: Number(take) || 10,
        orderBy: {
          createdAt: 'desc',
        },
        where: {
          OR: [
            {
              name: { contains: search_string.trim(), mode: 'insensitive' },
            },
            {
              username: {
                contains: search_string.trim(),
                mode: 'insensitive',
              },
            },
          ],
        },
      },
      req.user.sub,
    );
  }

  @RequiresFeatureFlag('social.exploreSearch')
  @Post('/global-search')
  async searchUsersAndPosts(
    @Query() query: Record<string, any>,
    @Request() req: any,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ): Promise<Partial<UserModel>[]> {
    return this.userService.getMultipleUsers(
      {
        skip: Number(skip) || 0,
        take: Number(take) || 10,
        orderBy: {
          createdAt: 'desc',
        },
        where: {
          OR: [],
        },
      },
      req.user.sub,
    );
  }

  @RequiresFeatureFlag('social.profiles')
  @Put('update/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() data: Partial<User>,
  ): Promise<UserModel> {
    return this.userService.updateUser({
      where: { id: String(id) },
      data,
    });
  }
}
