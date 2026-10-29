/* ============================================================================
 * firebase-config.js — COLE AQUI SUAS CREDENCIAIS
 * ----------------------------------------------------------------------------
 * Firebase Console → Configurações do projeto → Seus apps → App da Web (</>)
 * Copie o objeto "firebaseConfig" e substitua os valores abaixo.
 *
 * IMPORTANTE: o campo "databaseURL" é obrigatório para o Realtime Database.
 * Ele aparece em Build → Realtime Database (topo da aba "Dados").
 * ========================================================================== */

export const firebaseConfig = {
  apiKey: 'COLE_SUA_API_KEY_AQUI',
  authDomain: 'SEU-PROJETO.firebaseapp.com',
  databaseURL: 'https://SEU-PROJETO-default-rtdb.firebaseio.com',
  projectId: 'SEU-PROJETO',
  storageBucket: 'SEU-PROJETO.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:0000000000000000',
};

// Usado pelas telas para mostrar um aviso amigável se você esquecer de configurar.
export const firebaseConfigurado = !firebaseConfig.apiKey.startsWith('COLE_');

// Versão do SDK carregada via CDN (sem bundler). Troque aqui se quiser atualizar.
export const FIREBASE_SDK = 'https://www.gstatic.com/firebasejs/10.12.2';
