import { AccessoryPlugin, Service } from 'homebridge';
import SunCalc from 'suncalc';

import type { WeatherConfig } from './config.js';
import { WeatherPlatform } from './platform.js';
import {
  ContactSensorActivity,
  calculateSolarPhaseState,
  type SolarPhaseStates,
  type SolarTimes,
} from './solar-phases.js';
import { PLUGIN_DISPLAY_NAME, PLUGIN_NAME, PLUGIN_VERSION } from './settings.js';

const MAX_UPDATE_DELAY_MS = 1000 * 60 * 60;
const MIN_UPDATE_DELAY_MS = 1000;

export class WeatherAccessory implements AccessoryPlugin {
  public readonly name = 'Weather';

  private readonly displayName: string;

  private readonly informationService: Service;

  private readonly morningTwilightSensorService: Service;
  private readonly daySensorService: Service;
  private readonly eveningTwilightSensorService: Service;
  private readonly nightSensorService: Service;

  private updateTimer?: NodeJS.Timeout;

  constructor(
    private readonly platform: WeatherPlatform,
    private readonly config: WeatherConfig,
  ) {
    this.displayName = platform.uuid.generate(`${PLUGIN_NAME}-${this.name}`);

    this.informationService = new platform.Service.AccessoryInformation()
      .setCharacteristic(platform.Characteristic.Name, this.name)
      .setCharacteristic(platform.Characteristic.Manufacturer, '@jendrik')
      .setCharacteristic(platform.Characteristic.Model, PLUGIN_DISPLAY_NAME)
      .setCharacteristic(platform.Characteristic.SerialNumber, this.displayName)
      .setCharacteristic(platform.Characteristic.FirmwareRevision, PLUGIN_VERSION);

    this.morningTwilightSensorService = new platform.Service.ContactSensor('Morning Twilight', 'Morning Twilight');
    this.daySensorService = new platform.Service.ContactSensor('Day', 'Day');
    this.eveningTwilightSensorService = new platform.Service.ContactSensor('Evening Twilight', 'Evening Twilight');
    this.nightSensorService = new platform.Service.ContactSensor('Night', 'Night');

    this.update();
  }

  getServices(): Service[] {
    return [
      this.informationService,
      this.morningTwilightSensorService,
      this.daySensorService,
      this.eveningTwilightSensorService,
      this.nightSensorService,
    ];
  }

  identify(): void {
    this.platform.log.info('Identify requested for KNX Weather Station');
  }

  shutdown(): void {
    if (this.updateTimer !== undefined) {
      clearTimeout(this.updateTimer);
      this.updateTimer = undefined;
    }
  }

  private update(): void {
    const now = new Date();
    const times = this.getSolarTimes(now);
    const { states, nextUpdate } = calculateSolarPhaseState(now, times);

    this.platform.log.debug(JSON.stringify({
      now: this.serializeDate(now),
      times: this.serializeSolarTimes(times),
      states,
      nextUpdate: nextUpdate === undefined ? undefined : this.serializeDate(nextUpdate),
    }));

    this.applyStates(states);
    this.scheduleNextUpdate(now, nextUpdate);
  }

  private getSolarTimes(now: Date): SolarTimes {
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    const todayTimes = SunCalc.getTimes(now, this.config.latitude, this.config.longitude);
    const tomorrowTimes = SunCalc.getTimes(tomorrow, this.config.latitude, this.config.longitude);

    return {
      nightEnd: todayTimes.nightEnd,
      sunrise: todayTimes.sunrise,
      sunset: todayTimes.sunset,
      night: todayTimes.night,
      nextNightEnd: tomorrowTimes.nightEnd,
    };
  }

  private applyStates(states: SolarPhaseStates): void {
    this.updateContactSensor(this.morningTwilightSensorService, states.morningTwilight);
    this.updateContactSensor(this.daySensorService, states.day);
    this.updateContactSensor(this.eveningTwilightSensorService, states.eveningTwilight);
    this.updateContactSensor(this.nightSensorService, states.night);
  }

  private updateContactSensor(service: Service, activity: ContactSensorActivity): void {
    const state = activity === ContactSensorActivity.Active
      ? this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED
      : this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED;

    service.getCharacteristic(this.platform.Characteristic.ContactSensorState).updateValue(state);
  }

  private scheduleNextUpdate(now: Date, nextUpdate?: Date): void {
    this.shutdown();

    const delay = this.getUpdateDelay(now, nextUpdate);
    this.updateTimer = setTimeout(() => {
      this.update();
    }, delay);
  }

  private getUpdateDelay(now: Date, nextUpdate?: Date): number {
    const nextUpdateTime = nextUpdate?.getTime();

    if (nextUpdateTime === undefined || !Number.isFinite(nextUpdateTime)) {
      return MAX_UPDATE_DELAY_MS;
    }

    return Math.max(MIN_UPDATE_DELAY_MS, nextUpdateTime - now.getTime());
  }

  private serializeSolarTimes(times: SolarTimes): Record<keyof SolarTimes, string> {
    return {
      nightEnd: this.serializeDate(times.nightEnd),
      sunrise: this.serializeDate(times.sunrise),
      sunset: this.serializeDate(times.sunset),
      night: this.serializeDate(times.night),
      nextNightEnd: this.serializeDate(times.nextNightEnd),
    };
  }

  private serializeDate(date: Date): string {
    return Number.isFinite(date.getTime()) ? date.toISOString() : 'Invalid Date';
  }
}
