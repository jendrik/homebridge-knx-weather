import type { PlatformConfig } from 'homebridge';

const DEFAULT_IP = '224.0.23.12';
const DEFAULT_PORT = 3671;

export interface WeatherConfig {
  ip: string;
  port: number;
  latitude: number;
  longitude: number;
}

export function parseWeatherConfig(config: PlatformConfig): WeatherConfig {
  const ip = config.ip ?? DEFAULT_IP;
  const port = config.port ?? DEFAULT_PORT;
  const { latitude, longitude } = config;

  if (typeof ip !== 'string' || ip.trim() === '') {
    throw new Error('ip must be a non-empty string');
  }

  if (typeof port !== 'number') {
    throw new Error('port must be a number');
  }

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('port must be an integer between 1 and 65535');
  }

  if (typeof latitude !== 'number' || !Number.isFinite(latitude)) {
    throw new Error('latitude must be a finite number');
  }

  if (latitude < -90 || latitude > 90) {
    throw new Error('latitude must be between -90 and 90');
  }

  if (typeof longitude !== 'number' || !Number.isFinite(longitude)) {
    throw new Error('longitude must be a finite number');
  }

  if (longitude < -180 || longitude > 180) {
    throw new Error('longitude must be between -180 and 180');
  }

  return {
    ip,
    port,
    latitude,
    longitude,
  };
}
