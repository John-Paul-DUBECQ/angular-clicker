import { PowerEffect } from '../power-effect.types';

export const VESSEL_RUSH_POWER_ID = 'vessel-rush';
export const VESSEL_RUSH_BASE_COUNT = 10;
export const VESSEL_RUSH_BASE_DURATION_SECONDS = 3;

export const vesselRushEffect: PowerEffect = (context) => {
  context.summonVessels(VESSEL_RUSH_BASE_COUNT, VESSEL_RUSH_BASE_DURATION_SECONDS);
};
