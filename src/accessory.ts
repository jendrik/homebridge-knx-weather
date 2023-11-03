import { AccessoryPlugin, PlatformConfig, Service } from 'homebridge';

import { Datapoint } from 'knx';

import { PLUGIN_NAME, PLUGIN_VERSION, PLUGIN_DISPLAY_NAME } from './settings';

import { WeatherPlatform } from './platform';

import SunCalc from 'suncalc';


export class WeatherAccessory implements AccessoryPlugin {
  private readonly uuid_base: string;
  private readonly name: string;
  private readonly displayName: string;

  private readonly informationService: Service;

  private readonly morningTwilightSensorService: Service; // nightEnd -> sunrise
  private readonly daySensorService: Service; // sunrise -> sunset
  private readonly eveningTwilightSensorService: Service; // sunset -> night
  private readonly nightSensorService: Service; // night -> nightEnd

  constructor(
    private readonly platform: WeatherPlatform,
    private readonly config: PlatformConfig,
  ) {

    this.name = 'Weather';
    this.uuid_base = platform.uuid.generate(PLUGIN_NAME + '-' + this.name);
    this.displayName = this.uuid_base;

    this.informationService = new platform.Service.AccessoryInformation()
      .setCharacteristic(platform.Characteristic.Name, this.name)
      .setCharacteristic(platform.Characteristic.Identify, this.name)
      .setCharacteristic(platform.Characteristic.Manufacturer, '@jendrik')
      .setCharacteristic(platform.Characteristic.Model, PLUGIN_DISPLAY_NAME)
      .setCharacteristic(platform.Characteristic.SerialNumber, this.displayName)
      .setCharacteristic(platform.Characteristic.FirmwareRevision, PLUGIN_VERSION);

    this.morningTwilightSensorService = new platform.Service.ContactSensor('Morning Twilight', 'Morning Twilight');
    this.daySensorService = new platform.Service.ContactSensor('Day', 'Day');
    this.eveningTwilightSensorService = new platform.Service.ContactSensor('Evening Twilight', 'Evening Twilight');
    this.nightSensorService = new platform.Service.ContactSensor('Night', 'Night');

    // update intervals now and every day
    this.calculateEvents();
    setInterval(
      ()=> {
        this.calculateEvents();
      },
      1000 * 60 * 60 * 24,
    );
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

  calculateEvents(): void {
    const now = new Date();
    const times = SunCalc.getTimes(now, this.platform.latitude, this.platform.longitude);

    this.platform.log.info(`now: ${now}`);
    this.platform.log.info(`sunrise: ${times.sunrise}`);
    this.platform.log.info(`sunriseEnd: ${times.sunriseEnd}`);
    this.platform.log.info(`goldenHourEnd: ${times.goldenHourEnd}`);
    this.platform.log.info(`solarNoon: ${times.solarNoon}`);
    this.platform.log.info(`goldenHour: ${times.goldenHour}`);
    this.platform.log.info(`sunsetStart: ${times.sunsetStart}`);
    this.platform.log.info(`sunset: ${times.sunset}`);
    this.platform.log.info(`dusk: ${times.dusk}`);
    this.platform.log.info(`nauticalDusk: ${times.nauticalDusk}`);
    this.platform.log.info(`night: ${times.night}`);
    this.platform.log.info(`nadir: ${times.nadir}`);
    this.platform.log.info(`nightEnd: ${times.nightEnd}`);
    this.platform.log.info(`nauticalDawn: ${times.nauticalDawn}`);
    this.platform.log.info(`dawn: ${times.dawn}`);

    // morning twilight (nightEnd -> sunrise)
    if (now > times.nightEnd && now < times.sunrise) {
      this.platform.log.info('currently morning twilight');
      this.morningTwilightSensorService.getCharacteristic(this.platform.Characteristic.ContactSensorState)
        .updateValue(this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED);
    } else if (now >= times.sunrise) {
      this.platform.log.info('morning twilight already over');
      this.morningTwilightSensorService.getCharacteristic(this.platform.Characteristic.ContactSensorState)
        .updateValue(this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED);
    }
    if (now < times.nightEnd) {
      setTimeout(() => {
        this.platform.log.info('morning twilight starting');
        this.morningTwilightSensorService.getCharacteristic(this.platform.Characteristic.ContactSensorState)
          .updateValue(this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED);
      }, times.nightEnd.getTime() - now.getTime());
    }
    if (now < times.sunrise) {
      setTimeout(() => {
        this.platform.log.info('morning twilight ending');
        this.morningTwilightSensorService.getCharacteristic(this.platform.Characteristic.ContactSensorState)
          .updateValue(this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED);
      }, times.sunrise.getTime() - now.getTime());
    }

    // day (sunrise -> sunset)
    if (now > times.sunrise && now < times.sunset) {
      this.platform.log.info('currently day');
      this.daySensorService.getCharacteristic(this.platform.Characteristic.ContactSensorState)
        .updateValue(this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED);
    } else if (now >= times.sunset) {
      this.platform.log.info('day already over');
      this.daySensorService.getCharacteristic(this.platform.Characteristic.ContactSensorState)
        .updateValue(this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED);
    }
    if (now < times.sunrise) {
      setTimeout(() => {
        this.platform.log.info('day starting');
        this.daySensorService.getCharacteristic(this.platform.Characteristic.ContactSensorState)
          .updateValue(this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED);
      }, times.sunrise.getTime() - now.getTime());
    }
    if (now < times.sunset) {
      setTimeout(() => {
        this.platform.log.info('day ending');
        this.daySensorService.getCharacteristic(this.platform.Characteristic.ContactSensorState)
          .updateValue(this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED);
      }, times.sunset.getTime() - now.getTime());
    }

    // evening twilight (sunset -> night)
    if (now > times.sunset && now < times.night) {
      this.platform.log.info('currently evening twilight');
      this.eveningTwilightSensorService.getCharacteristic(this.platform.Characteristic.ContactSensorState)
        .updateValue(this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED);
    } else if (now >= times.night) {
      this.platform.log.info('evening twilight already over');
      this.eveningTwilightSensorService.getCharacteristic(this.platform.Characteristic.ContactSensorState)
        .updateValue(this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED);
    }
    if (now < times.sunset) {
      setTimeout(() => {
        this.platform.log.info('evening twilight starting');
        this.eveningTwilightSensorService.getCharacteristic(this.platform.Characteristic.ContactSensorState)
          .updateValue(this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED);
      }, times.sunset.getTime() - now.getTime());
    }
    if (now < times.night) {
      setTimeout(() => {
        this.platform.log.info('evening twilight ending');
        this.eveningTwilightSensorService.getCharacteristic(this.platform.Characteristic.ContactSensorState)
          .updateValue(this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED);
      }, times.night.getTime() - now.getTime());
    }

    // night (night -> nightEnd)
    if (now > times.night) {
      this.platform.log.info('currently night');
      this.nightSensorService.getCharacteristic(this.platform.Characteristic.ContactSensorState)
        .updateValue(this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED);
    } else if (now >= times.nightEnd && now < times.night) {
      this.platform.log.info('night already over');
      this.nightSensorService.getCharacteristic(this.platform.Characteristic.ContactSensorState)
        .updateValue(this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED);
    }
    if (now < times.night) {
      setTimeout(() => {
        this.platform.log.info('night starting');
        this.nightSensorService.getCharacteristic(this.platform.Characteristic.ContactSensorState)
          .updateValue(this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED);
      }, times.night.getTime() - now.getTime());
    }
    if (now < times.nightEnd) {
      setTimeout(() => {
        this.platform.log.info('night ending');
        this.nightSensorService.getCharacteristic(this.platform.Characteristic.ContactSensorState)
          .updateValue(this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED);
      }, times.nightEnd.getTime() - now.getTime());
    }
  }
}
