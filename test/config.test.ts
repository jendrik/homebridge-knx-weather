import assert from 'node:assert/strict';
import test from 'node:test';

import type { PlatformConfig } from 'homebridge';

import { parseWeatherConfig } from '../src/config.js';

function platformConfig(config: Omit<PlatformConfig, 'platform'>): PlatformConfig {
  return {
    platform: 'KNXWeather',
    ...config,
  };
}

test('valid config with latitude and longitude applies defaults', () => {
  const config = parseWeatherConfig(platformConfig({
    latitude: 52.52,
    longitude: 13.405,
  }));

  assert.deepEqual(config, {
    ip: '224.0.23.12',
    port: 3671,
    latitude: 52.52,
    longitude: 13.405,
  });
});

test('explicit ip and port are accepted', () => {
  const config = parseWeatherConfig(platformConfig({
    ip: '239.255.255.250',
    port: 12345,
    latitude: 48.137,
    longitude: 11.575,
  }));

  assert.deepEqual(config, {
    ip: '239.255.255.250',
    port: 12345,
    latitude: 48.137,
    longitude: 11.575,
  });
});

test('missing latitude throws', () => {
  assert.throws(
    () => parseWeatherConfig(platformConfig({ longitude: 13.405 })),
    /latitude must be a finite number/,
  );
});

test('latitude above 90 throws', () => {
  assert.throws(
    () => parseWeatherConfig(platformConfig({ latitude: 91, longitude: 13.405 })),
    /latitude must be between -90 and 90/,
  );
});

test('longitude above 180 throws', () => {
  assert.throws(
    () => parseWeatherConfig(platformConfig({ latitude: 52.52, longitude: 181 })),
    /longitude must be between -180 and 180/,
  );
});

test('string port throws', () => {
  assert.throws(
    () => parseWeatherConfig(platformConfig({ latitude: 52.52, longitude: 13.405, port: '3671' })),
    /port must be a number/,
  );
});
