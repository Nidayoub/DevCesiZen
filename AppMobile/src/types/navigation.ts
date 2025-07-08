export type RootStackParamList = {
  // Navigation principale par onglets
  Main: undefined;
  
  // Écrans accessibles depuis les onglets
  Home: undefined;
  Resources: undefined;
  Diagnostic: undefined;
  InfoScreen: undefined;
  Profile: undefined;
  
  // Écrans d'authentification
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  
  // Écrans de détails et modaux
  ResourceDetails: { id: number };
  DiagnosticResult: {
    score: number;
    stressLevel: string;
    interpretation: string;
    selectedEventsCount: number;
  };
  InfoDetails: { id: number };
  
  // Écrans nécessitant une authentification
  Dashboard: undefined;
  DiagnosticHistory: undefined;
  DiagnosticStats: undefined;
  Settings: undefined;
  LikedResources: undefined;
  CreateResource: undefined;
  EditResource: { resourceId: number };
  
  // Écrans légaux
  Terms: undefined;
  Privacy: undefined;
};

// Type pour la navigation par onglets
export type TabParamList = {
  Home: undefined;
  Resources: undefined;
  Diagnostic: undefined;
  Profile?: undefined; // Conditionnel selon l'authentification
}; 