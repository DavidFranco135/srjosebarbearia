import { initializeApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { FirebaseApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDx2p5tkMaeAjL6WrHNxFvK7rKZ77iFZ4w",
  authDomain: "financeiro-a7116.firebaseapp.com",
  projectId: "financeiro-a7116",
  storageBucket: "financeiro-a7116.firebasestorage.app",
  messagingSenderId: "952138197288",
  appId: "1:952138197288:web:11b60ce4a514d346ce081d"
};

// Inicializar app
const app: FirebaseApp = initializeApp(firebaseConfig);

// Inicializar serviços
const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);

// Exportar individualmente
export { app, db, auth };

// Exportar também como default (algumas configurações precisam)
export default { app, db, auth };
