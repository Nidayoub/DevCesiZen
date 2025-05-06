import { sqlite } from '@elysiajs/sqlite'
import { Elysia } from 'elysia'

// Configuration de la base de données SQLite
export const db = new Elysia()
  .use(sqlite({
    database: 'cesi-zen.db'
  }))

// Initialisation des tables
export async function initDatabase() {
  // Table des utilisateurs
  await db.sql`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      firstname TEXT NOT NULL,
      lastname TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `

  // Table des ressources
  await db.sql`
    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      url TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `

  // Table des catégories
  await db.sql`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `

  // Table de liaison ressources-catégories
  await db.sql`
    CREATE TABLE IF NOT EXISTS resource_categories (
      resource_id INTEGER,
      category_id INTEGER,
      PRIMARY KEY (resource_id, category_id),
      FOREIGN KEY (resource_id) REFERENCES resources(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `

  // Table des favoris
  await db.sql`
    CREATE TABLE IF NOT EXISTS favorites (
      user_id INTEGER,
      resource_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, resource_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (resource_id) REFERENCES resources(id)
    )
  `
} 