/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_FIREBASE_API_KEY: string;
    readonly VITE_QUIZTAL_TOKEN_ADDRESS: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}