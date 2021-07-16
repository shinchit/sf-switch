/// <reference types="node" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly DOMAIN: 'login' | 'test';
    readonly SF_USERNAME: string;
    readonly SF_PASSWORD: string;
  }
}
