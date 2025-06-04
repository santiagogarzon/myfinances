declare namespace NodeJS {
  interface ProcessEnv {
    openai?: {
      api_key: string;
    };
    gemini?: {
      api_key: string;
    };
  }
}
