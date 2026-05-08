jest.mock('src/auth/auth.guard', () => ({
  Public: () => () => {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { StreamMonetizationService } from 'src/coins/stream-monetization.service';
import { FeatureFlagService } from 'src/feature-flag/feature-flag.service';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { R2StorageService } from './r2-storage.service';

describe('FileController', () => {
  let controller: FileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileController],
      providers: [
        {
          provide: FileService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            findForStream: jest.fn(),
            assertStreamAccess: jest.fn(),
          },
        },
        {
          provide: StreamMonetizationService,
          useValue: {
            assertStreamAllowed: jest.fn(),
          },
        },
        {
          provide: R2StorageService,
          useValue: {
            pipeRangedGetObject: jest.fn(),
          },
        },
        {
          provide: FeatureFlagService,
          useValue: {
            assertEnabled: jest.fn(async () => undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<FileController>(FileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
