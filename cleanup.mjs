#!/usr/bin/env node
/**
 * 🧹 SCRIPT DE LIMPIEZA GLOBAL DEL PROYECTO
 * Elimina código debug, optimiza para producción y aplica mejores prácticas
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CleanupStats {
  filesProcessed: number;
  consoleStatementsRemoved: number;
  debugCodeRemoved: number;
  unusedImportsRemoved: number;
  errors: string[];
}

class ProjectCleaner {
  private stats: CleanupStats = {
    filesProcessed: 0,
    consoleStatementsRemoved: 0,
    debugCodeRemoved: 0,
    unusedImportsRemoved: 0,
    errors: []
  };

  private readonly CONSOLE_PATTERNS = [
    /console\.(log|debug|info|warn|error|group|groupEnd|table|trace)\([^)]*\);?\s*/g,
    /console\.(log|debug|info|warn|error|group|groupEnd|table|trace)\s*\([^;]*\);?\s*$/gm
  ];

  private readonly DEBUG_PATTERNS = [
    /\/\*\s*DEBUG:[\s\S]*?\*\//g,
    /\/\/\s*DEBUG:.*$/gm,
    /\/\*\s*TODO:[\s\S]*?\*\//g,
    /\/\/\s*TODO:.*$/gm,
    /\/\*\s*FIXME:[\s\S]*?\*\//g,
    /\/\/\s*FIXME:.*$/gm,
    /debugger;?\s*/g
  ];

  private readonly PRODUCTION_UNSAFE_PATTERNS = [
    /window\.__DEV_LOGS__\s*=.*$/gm,
    /if\s*\(\s*import\.meta\.env\.DEV\s*\)\s*{[\s\S]*?}/g,
    /__DEV__\s*&&[\s\S]*?;/g
  ];

  async cleanProject(): Promise<void> {
    console.log('🧹 Iniciando limpieza del proyecto...\n');

    const frontendDir = path.join(__dirname, 'Frontend', 'src');
    const backendDir = path.join(__dirname, 'Backend', 'src');

    // Limpiar Frontend
    await this.processDirectory(frontendDir, ['.ts', '.tsx', '.js', '.jsx']);
    
    // Limpiar Backend
    await this.processDirectory(backendDir, ['.ts', '.js']);

    // Eliminar archivos problemáticos
    await this.removeProblematicFiles();

    this.printReport();
  }

  private async processDirectory(dirPath: string, extensions: string[]): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          // Skip node_modules, .git, dist, etc.
          if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) {
            await this.processDirectory(fullPath, extensions);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            await this.processFile(fullPath);
          }
        }
      }
    } catch (error) {
      this.stats.errors.push(`Error processing directory ${dirPath}: ${error.message}`);
    }
  }

  private async processFile(filePath: string): Promise<void> {
    try {
      let content = await fs.readFile(filePath, 'utf-8');
      const originalContent = content;

      // Skip files that already use unified logger
      if (content.includes('logger.unified')) {
        console.log(`⏭️  Skipping ${path.basename(filePath)} (already uses unified logger)`);
        return;
      }

      // Remove console statements
      for (const pattern of this.CONSOLE_PATTERNS) {
        const matches = content.match(pattern);
        if (matches) {
          this.stats.consoleStatementsRemoved += matches.length;
          content = content.replace(pattern, '');
        }
      }

      // Remove debug code
      for (const pattern of this.DEBUG_PATTERNS) {
        const matches = content.match(pattern);
        if (matches) {
          this.stats.debugCodeRemoved += matches.length;
          content = content.replace(pattern, '');
        }
      }

      // Remove production-unsafe patterns
      for (const pattern of this.PRODUCTION_UNSAFE_PATTERNS) {
        content = content.replace(pattern, '');
      }

      // Clean up empty lines and whitespace
      content = content
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Multiple empty lines to double
        .replace(/^\s*\n/gm, '') // Empty lines at start
        .trim(); // Trim file

      // Add unified logger import if file had console statements
      if (originalContent !== content && this.needsLoggerImport(content, filePath)) {
        content = this.addLoggerImport(content, filePath);
      }

      if (originalContent !== content) {
        await fs.writeFile(filePath, content, 'utf-8');
        console.log(`✅ Cleaned ${path.basename(filePath)}`);
        this.stats.filesProcessed++;
      }

    } catch (error) {
      this.stats.errors.push(`Error processing file ${filePath}: ${error.message}`);
    }
  }

  private needsLoggerImport(content: string, filePath: string): boolean {
    const ext = path.extname(filePath);
    return ['.ts', '.tsx'].includes(ext) && 
           !content.includes('import') && 
           !content.includes('logger');
  }

  private addLoggerImport(content: string, filePath: string): string {
    const ext = path.extname(filePath);
    if (!['.ts', '.tsx'].includes(ext)) return content;

    const relativePath = this.getRelativeImportPath(filePath);
    const importStatement = `import { logger } from '${relativePath}/lib/logger.unified';\n\n`;
    
    return importStatement + content;
  }

  private getRelativeImportPath(filePath: string): string {
    const srcIndex = filePath.indexOf('/src/');
    if (srcIndex === -1) return '@';
    
    const relativePart = filePath.substring(srcIndex + 5);
    const depth = relativePart.split('/').length - 1;
    
    return depth === 0 ? '.' : '../'.repeat(depth - 1) + '..';
  }

  private async removeProblematicFiles(): Promise<void> {
    const problematicFiles = [
      'Frontend/public/clear-sw.js',
      'Frontend/public/debug-scripts.js',
      'Backend/debug.log',
      'Backend/error.log'
    ];

    for (const file of problematicFiles) {
      try {
        const fullPath = path.join(__dirname, file);
        await fs.unlink(fullPath);
        console.log(`🗑️  Deleted ${file}`);
      } catch (error) {
        // File doesn't exist, ignore
      }
    }
  }

  private printReport(): void {
    console.log('\n' + '='.repeat(50));
    console.log('📊 REPORTE DE LIMPIEZA');
    console.log('='.repeat(50));
    console.log(`✅ Archivos procesados: ${this.stats.filesProcessed}`);
    console.log(`🔇 Console statements eliminados: ${this.stats.consoleStatementsRemoved}`);
    console.log(`🐛 Líneas de debug eliminadas: ${this.stats.debugCodeRemoved}`);
    console.log(`📦 Imports no usados eliminados: ${this.stats.unusedImportsRemoved}`);
    
    if (this.stats.errors.length > 0) {
      console.log(`\n❌ ERRORES (${this.stats.errors.length}):`);
      this.stats.errors.forEach(error => console.log(`   ${error}`));
    }

    console.log('\n🎯 PRÓXIMOS PASOS RECOMENDADOS:');
    console.log('   1. Ejecutar tests: npm run test');
    console.log('   2. Verificar build: npm run build');  
    console.log('   3. Revisar manualmente archivos modificados');
    console.log('   4. Migrar console statements restantes a unified logger');
    console.log('\n🏆 Proyecto limpiado exitosamente!');
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const cleaner = new ProjectCleaner();
  cleaner.cleanProject().catch(console.error);
}

export default ProjectCleaner;