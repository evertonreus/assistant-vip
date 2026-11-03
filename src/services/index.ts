import { mockServices } from "./mock";
import type { Services } from "./types";

/**
 * Single entry point for all data access.
 * To connect the VPS/n8n backend later, implement `Services` with fetch calls
 * to your own API (which holds all credentials server-side) and swap it here.
 * Never put API keys or n8n credentials in frontend code.
 */
export const services: Services = mockServices;

export type { Services } from "./types";
