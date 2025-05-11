import MainLayout from '../../components/MainLayout';

export default function PrivacyPolicyPage() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Politique de Confidentialité</h1>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">1. Collecte des informations</h2>
          <p className="text-gray-700">
            Nous collectons des informations lorsque vous vous inscrivez sur notre application, lorsque vous vous connectez à votre compte, et lorsque vous utilisez certaines fonctionnalités. Les informations collectées incluent votre nom, votre adresse e-mail, et les données relatives à votre utilisation de l'application (par exemple, résultats des diagnostics).
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">2. Utilisation des informations</h2>
          <p className="text-gray-700">
            Toutes les informations que nous recueillons auprès de vous peuvent être utilisées pour :
          </p>
          <ul className="list-disc list-inside text-gray-700 ml-4">
            <li>Personnaliser votre expérience et répondre à vos besoins individuels</li>
            <li>Fournir un contenu publicitaire personnalisé</li>
            <li>Améliorer notre application</li>
            <li>Améliorer le service client et vos besoins de prise en charge</li>
            <li>Vous contacter par e-mail</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">3. Confidentialité des informations</h2>
          <p className="text-gray-700">
            Nous sommes les seuls propriétaires des informations recueillies sur cette application. Vos informations personnelles ne seront pas vendues, échangées, transférées, ou données à une autre société pour n'importe quelle raison, sans votre consentement, en dehors de ce qui est nécessaire pour répondre à une demande et / ou une transaction.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">4. Divulgation à des tiers</h2>
          <p className="text-gray-700">
            Nous ne vendons, n'échangeons et ne transférons pas vos informations personnelles identifiables à des tiers. Cela ne comprend pas les tierces parties de confiance qui nous aident à exploiter notre application ou à mener nos affaires, tant que ces parties conviennent de garder ces informations confidentielles.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">5. Protection des informations</h2>
          <p className="text-gray-700">
            Nous mettons en œuvre une variété de mesures de sécurité pour préserver la sécurité de vos informations personnelles. Nous utilisons un cryptage à la pointe de la technologie pour protéger les informations sensibles transmises en ligne. Nous protégeons également vos informations hors ligne.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">6. Cookies</h2>
          <p className="text-gray-700">
            Nos cookies améliorent l'accès à notre application et identifient les visiteurs réguliers. En outre, nos cookies améliorent l'expérience d'utilisateur grâce au suivi et au ciblage de ses intérêts. Cependant, cette utilisation des cookies n'est en aucune façon liée à des informations personnelles identifiables sur notre application.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">7. Consentement</h2>
          <p className="text-gray-700">
            En utilisant notre application, vous consentez à notre politique de confidentialité.
          </p>
        </section>

        <p className="text-sm text-gray-500 mt-8">
          Date de dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
        </p>
      </div>
    </MainLayout>
  );
} 