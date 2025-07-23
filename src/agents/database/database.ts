import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import { logger } from '../../utils/logger.util';
import { config } from '../../utils/config.util';

// Database connection interface
export interface DatabaseConnection {
  query(sql: string, params?: any[]): Promise<any[]>;
  getSchema(): Promise<string>;
  close(): Promise<void>;
}

// SQLite implementation
export class SQLiteConnection implements DatabaseConnection {
  private db: Database | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    if (this.isConnected && this.db) {
      return;
    }

    try {
      // Extract path from DATABASE_URL (format: sqlite:./data/app.db)
      const dbPath = config.databaseUrl?.replace('sqlite:', '') || './data/app.db';
      
      this.db = await open({
        filename: dbPath,
        driver: sqlite3.Database
      });

      this.isConnected = true;
      logger.info('SQLite database connected', { path: dbPath });

      // Initialize with sample data if database is empty
      await this.initializeSampleData();
    } catch (error) {
      logger.error('Failed to connect to SQLite database:', error);
      throw new Error(`Database connection failed: ${error}`);
    }
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.db || !this.isConnected) {
      await this.connect();
    }

    try {
      const startTime = Date.now();
      const results = await this.db!.all(sql, params);
      const executionTime = Date.now() - startTime;
      
      logger.info('SQL query executed', {
        sql: sql.substring(0, 100) + (sql.length > 100 ? '...' : ''),
        resultCount: results.length,
        executionTime
      });

      return results;
    } catch (error) {
      logger.error('SQL query execution failed', { sql, error });
      throw new Error(`Query execution failed: ${error}`);
    }
  }

  async getSchema(): Promise<string> {
    if (!this.db || !this.isConnected) {
      await this.connect();
    }

    try {
      // Get all tables
      const tables = await this.db!.all(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `);

      let schema = 'Database Schema:\n\n';

      for (const table of tables) {
        schema += `Table: ${table.name}\n`;
        
        // Get table info (columns, types, etc.)
        const columns = await this.db!.all(`PRAGMA table_info(${table.name})`);
        
        for (const column of columns) {
          schema += `  - ${column.name}: ${column.type}`;
          if (column.pk) schema += ' (PRIMARY KEY)';
          if (column.notnull) schema += ' (NOT NULL)';
          if (column.dflt_value) schema += ` (DEFAULT: ${column.dflt_value})`;
          schema += '\n';
        }
        
        // Get row count
        const count = await this.db!.get(`SELECT COUNT(*) as count FROM ${table.name}`);
        schema += `  Rows: ${count.count}\n\n`;
      }

      return schema;
    } catch (error) {
      logger.error('Failed to get database schema:', error);
      throw new Error(`Schema retrieval failed: ${error}`);
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.isConnected = false;
      logger.info('SQLite database connection closed');
    }
  }

  private async initializeSampleData(): Promise<void> {
    try {
      // Check if tables exist
      const tables = await this.db!.all(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `);

      if (tables.length === 0) {
        logger.info('Initializing sample database schema and data');

        // Create sample tables
        await this.db!.exec(`
          -- Users table
          CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            age INTEGER,
            department TEXT,
            salary DECIMAL(10,2),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          -- Orders table
          CREATE TABLE orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            product_name TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'pending',
            FOREIGN KEY (user_id) REFERENCES users (id)
          );

          -- Products table
          CREATE TABLE products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT,
            price DECIMAL(10,2) NOT NULL,
            stock_quantity INTEGER DEFAULT 0,
            description TEXT
          );
        `);

        // Insert sample data
        await this.db!.exec(`
          -- Sample users
          INSERT INTO users (name, email, age, department, salary) VALUES
          ('John Doe', 'john.doe@example.com', 30, 'Engineering', 75000.00),
          ('Jane Smith', 'jane.smith@example.com', 28, 'Marketing', 65000.00),
          ('Bob Johnson', 'bob.johnson@example.com', 35, 'Sales', 70000.00),
          ('Alice Brown', 'alice.brown@example.com', 32, 'Engineering', 80000.00),
          ('Charlie Wilson', 'charlie.wilson@example.com', 29, 'HR', 60000.00);

          -- Sample products
          INSERT INTO products (name, category, price, stock_quantity, description) VALUES
          ('Laptop Pro', 'Electronics', 1299.99, 50, 'High-performance laptop'),
          ('Wireless Mouse', 'Electronics', 29.99, 200, 'Ergonomic wireless mouse'),
          ('Office Chair', 'Furniture', 299.99, 30, 'Comfortable office chair'),
          ('Standing Desk', 'Furniture', 599.99, 15, 'Adjustable standing desk'),
          ('Coffee Mug', 'Office Supplies', 12.99, 100, 'Ceramic coffee mug');

          -- Sample orders
          INSERT INTO orders (user_id, product_name, quantity, price, status) VALUES
          (1, 'Laptop Pro', 1, 1299.99, 'completed'),
          (1, 'Wireless Mouse', 2, 29.99, 'completed'),
          (2, 'Office Chair', 1, 299.99, 'pending'),
          (3, 'Standing Desk', 1, 599.99, 'shipped'),
          (4, 'Coffee Mug', 3, 12.99, 'completed'),
          (5, 'Laptop Pro', 1, 1299.99, 'pending');
        `);

        logger.info('Sample database initialized successfully');
      }
    } catch (error) {
      logger.error('Failed to initialize sample data:', error);
      // Don't throw here, as the database might already be initialized
    }
  }
}

// Database factory
export class DatabaseFactory {
  private static connection: DatabaseConnection | null = null;

  static async getConnection(): Promise<DatabaseConnection> {
    if (!this.connection) {
      const dbType = config.databaseType || 'sqlite';
      
      switch (dbType.toLowerCase()) {
        case 'sqlite':
          this.connection = new SQLiteConnection();
          await (this.connection as SQLiteConnection).connect();
          break;
        default:
          throw new Error(`Unsupported database type: ${dbType}`);
      }
    }

    return this.connection;
  }

  static async closeConnection(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }
}