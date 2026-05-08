import { forwardRef, Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { RoomService } from 'src/room/room.service';
import { UserService } from 'src/user/user.service';
import { AuthModule } from 'src/auth/auth.module';
import { NotificationModule } from 'src/notification/notification.module';
import { DeviceModule } from 'src/device/device.module';
import { ChatCreatedListener } from './listeners/chat.listener';
import { DeviceAvailabilityListener } from './listeners/device-availability.listener';

import { WatchTogetherModule } from 'src/watch-together/watch-together.module';

@Module({
  imports: [
    AuthModule,
    NotificationModule,
    DeviceModule,
    forwardRef(() => WatchTogetherModule),
  ],
  providers: [
    ChatGateway,
    ChatService,
    RoomService,
    UserService,
    PrismaService,
    ChatCreatedListener,
    DeviceAvailabilityListener,
  ],
  exports: [ChatGateway],
})
export class ChatModule {}
