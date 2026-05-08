import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeatureFlagGuard } from './feature-flag.guard';
import { FeatureFlagService } from './feature-flag.service';

function mockContext(): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn(),
    switchToWs: jest.fn(),
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    switchToRpc: jest.fn(),
    getType: jest.fn(),
  } as unknown as ExecutionContext;
}

describe('FeatureFlagGuard', () => {
  let guard: FeatureFlagGuard;
  let reflector: Reflector;
  let flags: { assertEnabled: jest.Mock };

  beforeEach(() => {
    flags = { assertEnabled: jest.fn(async () => undefined) };
    reflector = new Reflector();
    guard = new FeatureFlagGuard(
      reflector,
      flags as unknown as FeatureFlagService,
    );
  });

  it('allows routes without metadata', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    await expect(guard.canActivate(mockContext())).resolves.toBe(true);
    expect(flags.assertEnabled).not.toHaveBeenCalled();
  });

  it('asserts each configured flag key', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['a', 'b']);
    await expect(guard.canActivate(mockContext())).resolves.toBe(true);
    expect(flags.assertEnabled).toHaveBeenCalledWith('a');
    expect(flags.assertEnabled).toHaveBeenCalledWith('b');
  });
});
