/**
 * Shared TypeScript types for the macpracs CLI
 */

export interface CommandOptions {
  verbose?: boolean;
  quiet?: boolean;
  json?: boolean;
  config?: string;
}

export interface AWSOptions extends CommandOptions {
  profile?: string;
  region?: string;
  refreshInterval?: number;
}

export interface ExecResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface Config {
  aws?: {
    defaultProfile?: string;
    defaultRegion?: string;
  };
  git?: {
    defaultDonorBranch?: string;
    branchPrefix?: string;
  };
  lastCommand?: string;
}

export interface LogLevel {
  silent: boolean;
  verbose: boolean;
}

export type CommandResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Context configuration for multi-job/project support
 */
export interface Context {
  name: string;
  description?: string;
  mq?: {
    environments: Record<
      string,
      {
        amqpUrlTemplate: string;
        region: string;
      }
    >;
    eventTemplates: Record<
      string,
      {
        exchange: string;
        routingKey: string;
        queueNamePattern?: string;
        event: {
          eventType: string;
          eventTimestamp: string | null;
          payload: Record<string, any>;
        };
      }
    >;
  };
  aws?: {
    defaultProfile?: string;
    defaultRegion?: string;
  };
  git?: {
    defaultDonorBranch?: string;
    branchPrefix?: string;
  };
  github?: {
    username: string;
    hostname: string;
  };
}
