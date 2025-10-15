import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createLogger } from './logger';

describe('Logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('createLogger', () => {
    it('should create a logger with default settings', () => {
      const logger = createLogger();
      expect(logger).toBeDefined();
    });

    it('should not log success messages when verbose is false', () => {
      const logger = createLogger(false, false);
      logger.success('test message');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log success messages when verbose is true', () => {
      const logger = createLogger(true, false);
      logger.success('test message');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.anything(),
        'test message'
      );
    });

    it('should not log error messages when quiet is true', () => {
      const logger = createLogger(false, true);
      logger.error('test error');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should log error messages when quiet is false', () => {
      const logger = createLogger(false, false);
      logger.error('test error');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.anything(),
        'test error'
      );
    });

    it('should not log info messages when verbose is false', () => {
      const logger = createLogger(false, false);
      logger.info('test info');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log info messages when verbose is true', () => {
      const logger = createLogger(true, false);
      logger.info('test info');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.anything(),
        'test info'
      );
    });
  });
});
