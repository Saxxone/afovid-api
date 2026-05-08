import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class WatchJoinLeaveDto {
  @IsUUID()
  sessionId!: string;
}

export class WatchPlaybackDto {
  @IsUUID()
  sessionId!: string;

  @IsNumber()
  @Min(0)
  position!: number;

  @IsBoolean()
  isPlaying!: boolean;
}

export class WatchStateRequestDto {
  @IsUUID()
  sessionId!: string;
}

export class WatchChatSendDto {
  @IsUUID()
  sessionId!: string;

  @IsString()
  @MaxLength(2000)
  body!: string;
}

export class WatchChatHistoryDto {
  @IsUUID()
  sessionId!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(200)
  take?: number;
}

export class WatchReactDto {
  @IsUUID()
  sessionId!: string;

  @IsString()
  @MaxLength(32)
  emoji!: string;
}
