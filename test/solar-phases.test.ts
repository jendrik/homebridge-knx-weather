import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ContactSensorActivity,
  calculateSolarPhaseState,
  type SolarTimes,
} from '../src/solar-phases.js';

const solarTimes: SolarTimes = {
  nightEnd: new Date('2026-05-25T03:00:00.000Z'),
  sunrise: new Date('2026-05-25T04:00:00.000Z'),
  sunset: new Date('2026-05-25T18:00:00.000Z'),
  night: new Date('2026-05-25T21:00:00.000Z'),
  nextNightEnd: new Date('2026-05-26T03:00:00.000Z'),
};

test('morning twilight is active before sunrise', () => {
  const result = calculateSolarPhaseState(new Date('2026-05-25T03:30:00.000Z'), solarTimes);

  assert.equal(result.states.morningTwilight, ContactSensorActivity.Active);
  assert.equal(result.states.day, ContactSensorActivity.Inactive);
  assert.deepEqual(result.nextUpdate, solarTimes.sunrise);
});

test('day is active before sunset', () => {
  const result = calculateSolarPhaseState(new Date('2026-05-25T12:00:00.000Z'), solarTimes);

  assert.equal(result.states.day, ContactSensorActivity.Active);
  assert.equal(result.states.eveningTwilight, ContactSensorActivity.Inactive);
  assert.deepEqual(result.nextUpdate, solarTimes.sunset);
});

test('evening twilight is active before night', () => {
  const result = calculateSolarPhaseState(new Date('2026-05-25T19:00:00.000Z'), solarTimes);

  assert.equal(result.states.eveningTwilight, ContactSensorActivity.Active);
  assert.equal(result.states.night, ContactSensorActivity.Inactive);
  assert.deepEqual(result.nextUpdate, solarTimes.night);
});

test('night is active before next night end', () => {
  const result = calculateSolarPhaseState(new Date('2026-05-26T01:00:00.000Z'), solarTimes);

  assert.equal(result.states.night, ContactSensorActivity.Active);
  assert.equal(result.states.morningTwilight, ContactSensorActivity.Inactive);
  assert.deepEqual(result.nextUpdate, solarTimes.nextNightEnd);
});

test('all phases are inactive before night end', () => {
  const result = calculateSolarPhaseState(new Date('2026-05-25T02:00:00.000Z'), solarTimes);

  assert.deepEqual(result.states, {
    morningTwilight: ContactSensorActivity.Inactive,
    day: ContactSensorActivity.Inactive,
    eveningTwilight: ContactSensorActivity.Inactive,
    night: ContactSensorActivity.Inactive,
  });
  assert.deepEqual(result.nextUpdate, solarTimes.nightEnd);
});
