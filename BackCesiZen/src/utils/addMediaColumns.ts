import { db } from "../data/database";

/**
 * Ajoute les colonnes pour les médias à la table info_resources
 */
export async function addMediaColumns() {
  try {
    console.log('🔄 Vérification des colonnes média...');
    
    // Vérifier si les colonnes existent déjà
    const tableInfo = await db.query(
      "PRAGMA table_info(info_resources)"
    );
    
    const existingColumns = tableInfo.map((col: any) => col.name);
    const mediaColumns = ['media_type', 'media_url', 'media_filename'];
    
    for (const column of mediaColumns) {
      if (!existingColumns.includes(column)) {
        console.log(`➕ Ajout de la colonne ${column}...`);
        
        let columnType = 'TEXT';
        if (column === 'media_type') {
          columnType = 'TEXT CHECK (media_type IN ("image", "video"))';
        }
        
        await db.execute(
          `ALTER TABLE info_resources ADD COLUMN ${column} ${columnType}`
        );
        
        console.log(`✅ Colonne ${column} ajoutée avec succès`);
      } else {
        console.log(`✅ Colonne ${column} existe déjà`);
      }
    }
    
    console.log('✅ Toutes les colonnes média sont prêtes');
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des colonnes média:', error);
    throw error;
  }
} 