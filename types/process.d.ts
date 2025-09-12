declare namespace NodeJS {
  export interface ProcessEnv {
    PORT: string;
    FRONTEND_BASE_URL: string;
    NODE_ENV: 'development' | 'production' | 'staging';
    FIREBASE_PROJECT_ID: string;
    FIREBASE_CLIENT_EMAIL: string;
    FIREBASE_PRIVATE_KEY: string;
    FIREBASE_AUTH_EMULATOR_HOST: boolean;
    PUPPETEER_EXECUTABLE_PATH: string;
  }
}
