import MainLayout from '../../components/MainLayout';

export default function CGUPage() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Conditions Générales d&#39;Utilisation (CGU)</h1>
        
        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">1. Objet</h2>
          <p className="text-gray-700">
            Les présentes CGU régissent l&#39;utilisation de l&#39;application CESIZen. En utilisant cette application, vous acceptez pleinement et entièrement ces conditions.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">2. Accès à l&#39;application</h2>
          <p className="text-gray-700">
            L&#39;accès à l&#39;application est réservé aux utilisateurs disposant d&#39;un compte. L&#39;utilisateur est responsable de la confidentialité de ses identifiants.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">3. Propriété intellectuelle</h2>
          <p className="text-gray-700">
            Tous les contenus présents dans l&#39;application (textes, images, logos, etc.) sont la propriété exclusive de CESIZen ou de ses partenaires et sont protégés par les lois sur la propriété intellectuelle.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">4. Responsabilité</h2>
          <p className="text-gray-700">
            CESIZen met tout en œuvre pour fournir des informations exactes et à jour. Cependant, l&#39;application ne saurait être tenue responsable des erreurs ou omissions, ni des dommages directs ou indirects résultant de l&#39;utilisation de l&#39;application.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">5. Modification des CGU</h2>
          <p className="text-gray-700">
            CESIZen se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de ces modifications.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">6. Droit applicable</h2>
          <p className="text-gray-700">
            Les présentes CGU sont soumises au droit français. En cas de litige, les tribunaux français seront seuls compétents.
          </p>
        </section>

        <p className="text-sm text-gray-500 mt-8">
          Date de dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
        </p>
      </div>
    </MainLayout>
  );
} 