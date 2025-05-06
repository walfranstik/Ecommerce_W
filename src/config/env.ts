// src/config/env.ts
import dotenv from "dotenv";
dotenv.config();

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno: ${name}`);
  }
  return value;
}

export const ENV = {
  PORT_DB: parseInt(getEnv("PORT_DB")),
  USER_BD: getEnv("USER_BD"),
  PASSWORD_BD: getEnv("PASSWORD_BD"),
  DATABASE_DB: getEnv("DATABASE_DB"),
};
