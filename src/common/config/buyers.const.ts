import { Env } from './env.validation';

export const BUYER_IDS_MAP = {
  vlasnyk: 4,
  legkokbbb: 5,
  taipan: 6,
  onion: 11,
  london: 13,
  pool: 16,
} as const;

export const createBuyerTokensMap = (env: Env) => ({
  vlasnyk: env.VLASNYK_TOKEN,
  legkokbbb: env.LEGKOKBBB_TOKEN,
  taipan: env.TAIPAN_TOKEN,
  onion: env.ONION_TOKEN,
  london: env.LONDON_TOKEN,
  pool: env.POOL_TOKEN,
});
