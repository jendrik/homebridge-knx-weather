export enum ContactSensorActivity {
  Active = 'active',
  Inactive = 'inactive',
}

export interface SolarTimes {
  nightEnd: Date;
  sunrise: Date;
  sunset: Date;
  night: Date;
  nextNightEnd: Date;
}

export interface SolarPhaseStates {
  morningTwilight: ContactSensorActivity;
  day: ContactSensorActivity;
  eveningTwilight: ContactSensorActivity;
  night: ContactSensorActivity;
}

export interface SolarPhaseStateResult {
  states: SolarPhaseStates;
  nextUpdate?: Date;
}

function isValidDate(date: Date): boolean {
  return Number.isFinite(date.getTime());
}

function activityBetween(nowTime: number, start: Date, end: Date): ContactSensorActivity {
  return isValidDate(start) && isValidDate(end) && nowTime >= start.getTime() && nowTime < end.getTime()
    ? ContactSensorActivity.Active
    : ContactSensorActivity.Inactive;
}

function nightActivity(nowTime: number, times: SolarTimes): ContactSensorActivity {
  const beforeNightEnd = isValidDate(times.nightEnd) && nowTime < times.nightEnd.getTime();
  const afterNightStart = activityBetween(nowTime, times.night, times.nextNightEnd) === ContactSensorActivity.Active;

  return beforeNightEnd || afterNightStart
    ? ContactSensorActivity.Active
    : ContactSensorActivity.Inactive;
}

function nextUpdateAfter(nowTime: number, times: SolarTimes): Date | undefined {
  const boundaries = [
    times.nightEnd,
    times.sunrise,
    times.sunset,
    times.night,
    times.nextNightEnd,
  ];

  return boundaries
    .filter((boundary) => isValidDate(boundary) && boundary.getTime() > nowTime)
    .sort((left, right) => left.getTime() - right.getTime())[0];
}

export function calculateSolarPhaseState(now: Date, times: SolarTimes): SolarPhaseStateResult {
  const nowTime = now.getTime();

  return {
    states: {
      morningTwilight: activityBetween(nowTime, times.nightEnd, times.sunrise),
      day: activityBetween(nowTime, times.sunrise, times.sunset),
      eveningTwilight: activityBetween(nowTime, times.sunset, times.night),
      night: nightActivity(nowTime, times),
    },
    nextUpdate: nextUpdateAfter(nowTime, times),
  };
}
