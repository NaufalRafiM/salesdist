import { Request, Response } from 'express';
import { db } from '../db/connection';
import fs from 'fs';
import path from 'path';

export const sqlController = {
  // Get database schema DDL
  getSchema: (req: Request, res: Response) => {
    try {
      const schemaPath = path.resolve(process.cwd(), 'backend/db/schema.sql');
      const ddl = fs.readFileSync(schemaPath, 'utf-8');

      // Also get table list and row counts
      const tables = db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name
      `).all() as { name: string }[];

      const tableStats = tables.map((t) => {
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${t.name}`).get() as { count: number };
        return {
          table_name: t.name,
          row_count: count.count
        };
      });

      return res.json({
        engine: 'SQL Relasional (better-sqlite3 / WAL Mode / Foreign Keys ON)',
        ddl,
        tables: tableStats
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Gagal membaca skema database: ' + err.message });
    }
  },

  // Safe read-only SQL query runner for audit inspection
  executeQuery: (req: Request, res: Response) => {
    try {
      const { sql_statement } = req.body;
      if (!sql_statement || typeof sql_statement !== 'string') {
        return res.status(400).json({ error: 'Query SQL tidak boleh kosong.' });
      }

      const trimmed = sql_statement.trim();
      const firstWord = trimmed.split(/\s+/)[0].toUpperCase();

      // Only allow read-only queries for safety through this inspector endpoint
      if (!['SELECT', 'PRAGMA', 'EXPLAIN'].includes(firstWord)) {
        return res.status(403).json({ error: 'Hanya query baca (SELECT / PRAGMA / EXPLAIN) yang diizinkan pada penampil SQL ini.' });
      }

      const results = db.prepare(trimmed).all();
      return res.json({
        query: trimmed,
        row_count: results.length,
        results
      });
    } catch (err: any) {
      return res.status(400).json({ error: 'Eksekusi query gagal: ' + err.message });
    }
  }
};
