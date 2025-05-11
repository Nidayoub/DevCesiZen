import { db } from "../data/database";
import bcrypt from "bcryptjs";

/**
 * Initialisation des données pour les ressources d'information
 */
export async function initInfoResources() {
  try {
    // Vérifier si des ressources existent déjà
    const existingResources = await db.query("SELECT COUNT(*) as count FROM info_resources");
    
    if (existingResources[0].count > 0) {
      console.log('📋 Les ressources d\'information existent déjà dans la base de données');
      return;
    }
    
    console.log('📋 Initialisation des ressources d\'information...');
    
    // Récupérer l'ID admin
    const adminUser = await db.queryOne("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    let adminId = 1; // Par défaut
    
    if (adminUser && adminUser.id) {
      adminId = adminUser.id;
    } else {
      // S'il n'y a pas d'admin, en créer un
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const result = await db.execute(
        "INSERT INTO users (email, password, firstname, lastname, role, is_verified) VALUES (?, ?, ?, ?, ?, ?)",
        ['admin@cesizen.com', hashedPassword, 'Admin', 'CesiZen', 'admin', 1]
      );
      adminId = result.lastInsertId;
    }
    
    // Créer des tags
    const tags = ['stress', 'méditation', 'bien-être', 'sommeil', 'respiration', 'anxiété', 'nutrition', 'exercice'];
    const tagIds = {};
    
    for (const tag of tags) {
      try {
        const result = await db.execute("INSERT INTO tags (name) VALUES (?)", [tag]);
        tagIds[tag] = result.lastInsertId;
      } catch (error) {
        console.log(`Tag ${tag} existe déjà`);
        const existingTag = await db.queryOne("SELECT id FROM tags WHERE name = ?", [tag]);
        if (existingTag) {
          tagIds[tag] = existingTag.id;
        }
      }
    }
    
    // Créer des ressources d'information
    const resources = [
      {
        title: "5 techniques de respiration pour réduire le stress",
        summary: "Découvrez des méthodes de respiration efficaces pour calmer l'anxiété et améliorer votre bien-être quotidien.",
        content: `<h2>Introduction</h2>
          <p>Le stress fait partie de notre quotidien, mais il existe des moyens simples de le gérer efficacement. La respiration est l'un des outils les plus puissants à notre disposition.</p>
          <h2>1. La respiration 4-7-8</h2>
          <p>Inspirez pendant 4 secondes, retenez votre souffle pendant 7 secondes, puis expirez lentement pendant 8 secondes. Cette technique active votre système parasympathique.</p>
          <h2>2. La respiration abdominale</h2>
          <p>Placez une main sur votre ventre et respirez profondément en gonflant l'abdomen. Cette méthode oxygène mieux le corps et calme le système nerveux.</p>
          <h2>3. La respiration alternée</h2>
          <p>Cette technique consiste à alterner les narines pour respirer, ce qui équilibre les deux hémisphères du cerveau et réduit le stress.</p>
          <h2>4. La respiration carrée</h2>
          <p>Inspirez sur 4 temps, retenez sur 4 temps, expirez sur 4 temps, puis attendez 4 temps avant de recommencer. Cette méthode est idéale pour se calmer rapidement.</p>
          <h2>5. La cohérence cardiaque</h2>
          <p>Respirez 6 fois par minute (inspirez 5 secondes, expirez 5 secondes) pendant 5 minutes pour synchroniser votre cœur et votre système nerveux.</p>
          <h2>Conclusion</h2>
          <p>Pratiquez ces techniques quelques minutes par jour pour en ressentir les bénéfices sur votre niveau de stress et votre bien-être général.</p>`,
        category: "Stress",
        reading_time: "5 min",
        level: "débutant",
        tags: ["respiration", "stress", "anxiété"]
      },
      {
        title: "La méditation de pleine conscience : guide pour débutants",
        summary: "Apprenez les bases de la méditation mindfulness et ses effets positifs sur la gestion du stress et de l'anxiété.",
        content: `<h2>Introduction à la pleine conscience</h2>
          <p>La méditation de pleine conscience (mindfulness) est une pratique qui consiste à porter son attention sur le moment présent, sans jugement.</p>
          <h2>Les bienfaits scientifiquement prouvés</h2>
          <p>De nombreuses études ont démontré ses effets sur la réduction du stress, de l'anxiété et même de la douleur chronique.</p>
          <h2>Comment commencer</h2>
          <p>Commencez par de courtes sessions de 5 minutes. Asseyez-vous confortablement, fermez les yeux et concentrez-vous sur votre respiration.</p>
          <h2>Exercice 1 : L'ancrage dans le souffle</h2>
          <p>Portez simplement votre attention sur vos inspirations et expirations, sans chercher à les modifier. Lorsque votre esprit s'égare, ramenez-le doucement à votre respiration.</p>
          <h2>Exercice 2 : Le scan corporel</h2>
          <p>Parcourez mentalement votre corps des pieds à la tête, en prenant conscience des sensations dans chaque partie.</p>
          <h2>Intégrer la pratique au quotidien</h2>
          <p>Essayez d'être pleinement présent lors d'activités simples comme marcher, manger ou se brosser les dents.</p>
          <h2>Conclusion</h2>
          <p>Avec une pratique régulière, même courte, vous commencerez à observer des changements positifs dans votre relation au stress.</p>`,
        category: "Méditation",
        reading_time: "7 min",
        level: "débutant",
        tags: ["méditation", "bien-être", "stress"]
      },
      {
        title: "Améliorer son sommeil naturellement : 7 habitudes efficaces",
        summary: "Découvrez comment optimiser votre qualité de sommeil sans médicaments grâce à des routines simples et naturelles.",
        content: `<h2>L'importance d'un sommeil de qualité</h2>
          <p>Le sommeil est aussi important pour notre santé que l'alimentation et l'exercice physique. Il permet à notre corps de récupérer et à notre cerveau de consolider les apprentissages.</p>
          <h2>1. Respecter son horloge biologique</h2>
          <p>Se coucher et se lever à des heures régulières, même le week-end, permet de synchroniser votre horloge interne.</p>
          <h2>2. Créer un environnement propice</h2>
          <p>Votre chambre doit être fraîche (18-20°C), calme et sombre. Investissez dans une bonne literie si possible.</p>
          <h2>3. Limiter les écrans avant le coucher</h2>
          <p>La lumière bleue des écrans perturbe la production de mélatonine, l'hormone du sommeil. Évitez-les au moins une heure avant de vous coucher.</p>
          <h2>4. Surveiller son alimentation</h2>
          <p>Évitez les repas lourds, l'alcool et la caféine en fin de journée. Une légère collation riche en tryptophane (banane, lait) peut favoriser l'endormissement.</p>
          <h2>5. Pratiquer une activité relaxante</h2>
          <p>Lecture, méditation, bain chaud ou étirements doux sont d'excellentes façons de préparer votre corps au sommeil.</p>
          <h2>6. Faire de l'exercice régulièrement</h2>
          <p>L'activité physique favorise un sommeil profond, mais évitez les exercices intenses dans les 2-3 heures avant le coucher.</p>
          <h2>7. Gérer son stress</h2>
          <p>Notez vos préoccupations sur un carnet avant de vous coucher pour libérer votre esprit. La respiration profonde ou la méditation peuvent également aider.</p>
          <h2>Conclusion</h2>
          <p>En appliquant progressivement ces habitudes, vous pourrez améliorer significativement la qualité de votre sommeil et votre bien-être général.</p>`,
        category: "Sommeil",
        reading_time: "8 min",
        level: "intermédiaire",
        tags: ["sommeil", "bien-être", "stress"]
      }
    ];
    
    // Insérer les ressources
    for (const resource of resources) {
      const result = await db.execute(
        `INSERT INTO info_resources (
          title, summary, content, category, author_id, reading_time, level
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          resource.title,
          resource.summary,
          resource.content,
          resource.category,
          adminId,
          resource.reading_time,
          resource.level
        ]
      );
      
      const resourceId = result.lastInsertId;
      
      // Associer les tags
      for (const tag of resource.tags) {
        if (tagIds[tag]) {
          await db.execute(
            "INSERT INTO info_resources_tags (info_resource_id, tag_id) VALUES (?, ?)",
            [resourceId, tagIds[tag]]
          );
        }
      }
    }
    
    console.log('✅ Ressources d\'information initialisées avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des ressources d\'information:', error);
  }
}
