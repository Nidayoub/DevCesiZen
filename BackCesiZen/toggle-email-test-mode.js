const fs = require('fs');
const path = require('path');

// Path to the .env file
const envPath = path.join(__dirname, '.env');

// Check if .env file exists
if (!fs.existsSync(envPath)) {
  console.error('❌ Fichier .env introuvable. Créez-le d\'abord avec `bun run setup-email`');
  process.exit(1);
}

// Read the current .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

// Check if EMAIL_TEST_MODE is already defined
let found = false;
const newLines = lines.map(line => {
  if (line.startsWith('EMAIL_TEST_MODE=')) {
    found = true;
    const currentValue = line.split('=')[1] === 'true';
    const newValue = !currentValue;
    console.log(`🔄 Mode TEST des emails: ${currentValue ? 'ACTIVÉ' : 'DÉSACTIVÉ'} -> ${newValue ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
    return `EMAIL_TEST_MODE=${newValue}`;
  }
  return line;
});

// If EMAIL_TEST_MODE is not defined, add it
if (!found) {
  console.log('🔄 Mode TEST des emails: DÉSACTIVÉ -> ACTIVÉ');
  newLines.push('EMAIL_TEST_MODE=true');
}

// Write the updated content back to the .env file
fs.writeFileSync(envPath, newLines.join('\n'));

console.log('\n✅ Configuration mise à jour');

// Show appropriate message based on the new value
const isTestMode = newLines.find(line => line.startsWith('EMAIL_TEST_MODE='))?.split('=')[1] === 'true';

if (isTestMode) {
  console.log('\n📬 Mode TEST ACTIVÉ:');
  console.log('  • Les emails ne sont pas réellement envoyés');
  console.log('  • Les informations des emails sont affichées dans la console');
  console.log('  • Parfait pour le développement et les tests');
  console.log('  • Aucune configuration Gmail nécessaire');
} else {
  console.log('\n📨 Mode RÉEL ACTIVÉ:');
  console.log('  • Les emails seront réellement envoyés via Gmail');
  console.log('  • Assurez-vous d\'avoir configuré EMAIL_USER et EMAIL_PASSWORD dans votre .env');
  console.log('  • Vérifiez que vous avez créé un mot de passe d\'application sur https://myaccount.google.com/apppasswords');
}

console.log('\n💡 Pour basculer entre les modes, exécutez à nouveau `bun run toggle-email-test`'); 