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

export function calculateSolarPhaseState(now: Date, times: SolarTimes): SolarPhaseStateResult {
  const nowTime = now.getTime();

  return {
    states: {
      morningTwilight: activityBetween(nowTime, times.nightEnd, times.sunrise),
      day: activityBetween(nowTime, times.sunrise, times.sunset),
      eveningTwilight: activityBetween(nowTime, times.sunset, times.night),
      night: activityBetween(nowTime, times.night, times.nextNightEnd),
    },
    nextUpdate: nextUpdateAfter(nowTime, times),
  };
}

function activityBetween(nowTime: number, start: Date, end: Date): ContactSensorActivity {
  return nowTime >= start.getTime() && nowTime < end.getTime()
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

  return boundaries.find((boundary) => boundary.getTime() > nowTime);
}
