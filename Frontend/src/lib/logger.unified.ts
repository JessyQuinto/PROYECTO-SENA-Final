/**
 * 🧹 SISTEMA DE LOGGING UNIFICADO
 * Reemplaza todos los console.* dispersos en el código
 */

interface LogLevel {
  DEBUG: 0;
  INFO: 1;
  WARN: 2;
  ERROR: 3;
}

interface LogEntry {
  timestamp: string;
  level: keyof LogLevel;
  message: string;
  context?: Record<string, any>;
  source?: string;
  userId?: string;
}

class UnifiedLogger {
  private static instance: UnifiedLogger;
  private logLevel: keyof LogLevel;
  private isDevelopment: boolean;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 1000;

  private constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.logLevel = this.isDevelopment ? 'DEBUG' : 'WARN';
  }

  static getInstance(): UnifiedLogger {
    if (!UnifiedLogger.instance) {
      UnifiedLogger.instance = new UnifiedLogger();
    }
    return UnifiedLogger.instance;
  }

  private shouldLog(level: keyof LogLevel): boolean {
    const levels: LogLevel = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
    return levels[level] >= levels[this.logLevel];
  }

  private formatMessage(entry: LogEntry): string {
    const emoji = {
      DEBUG: '🔍',
      INFO: 'ℹ️',
      WARN: '⚠️',
      ERROR: '❌'
    };

    return `${emoji[entry.level]} [${entry.timestamp}] ${entry.message}`;
  }

  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }
  }

  debug(message: string, context?: Record<string, any>, source?: string): void {
    if (!this.shouldLog('DEBUG')) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'DEBUG',
      message,
      context,
      source
    };

    this.addToBuffer(entry);
    
    if (this.isDevelopment) {
      console.debug(this.formatMessage(entry), context || '');
    }
  }

  info(message: string, context?: Record<string, any>, source?: string): void {
    if (!this.shouldLog('INFO')) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      context,
      source
    };

    this.addToBuffer(entry);
    console.info(this.formatMessage(entry), context || '');
  }

  warn(message: string, context?: Record<string, any>, source?: string): void {
    if (!this.shouldLog('WARN')) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message,
      context,
      source
    };

    this.addToBuffer(entry);
    console.warn(this.formatMessage(entry), context || '');
  }

  error(message: string, error?: Error, context?: Record<string, any>, source?: string): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      context: {
        ...context,
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : undefined
      },
      source
    };

    this.addToBuffer(entry);
    console.error(this.formatMessage(entry), entry.context || '');
  }

  // Métodos para reemplazar console statements existentes
  group(label: string): void {
    if (this.isDevelopment) {
      console.group(`🗂️ ${label}`);
    }
  }

  groupEnd(): void {
    if (this.isDevelopment) {
      console.groupEnd();
    }
  }

  // Obtener logs para debugging
  getLogs(level?: keyof LogLevel): LogEntry[] {
    if (level) {
      const levels: LogLevel = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
      return this.logBuffer.filter(entry => levels[entry.level] >= levels[level]);
    }
    return [...this.logBuffer];
  }

  clearLogs(): void {
    this.logBuffer = [];
  }

  // Método para reportes de producción
  exportLogs(): string {
    return JSON.stringify(this.logBuffer, null, 2);
  }
}

// Instancia singleton
export const logger = UnifiedLogger.getInstance();

// Helpers para migración gradual
export const logDebug = (message: string, context?: any, source?: string) => 
  logger.debug(message, context, source);

export const logInfo = (message: string, context?: any, source?: string) => 
  logger.info(message, context, source);

export const logWarn = (message: string, context?: any, source?: string) => 
  logger.warn(message, context, source);

export const logError = (message: string, error?: Error, context?: any, source?: string) => 
  logger.error(message, error, context, source);