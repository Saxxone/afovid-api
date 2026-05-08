import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class CreateWatchSessionDto {
  @IsUUID()
  postId!: string;

  @IsOptional()
  @IsBoolean()
  requireHostApproval?: boolean;
}
