import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns service health status', () => {
    const controller = new HealthController();

    const result = controller.check();

    expect(result.status).toBe('ok');
    expect(result.service).toBe('redbook-toolbox-server');
    expect(result.timestamp).toBeDefined();
  });
});
