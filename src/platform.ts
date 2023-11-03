import { API, StaticPlatformPlugin, Logger, PlatformConfig, AccessoryPlugin, Service, Characteristic, uuid } from 'homebridge';

import { Connection } from 'knx';

import { WeatherAccessory } from './accessory';


export class WeatherPlatform implements StaticPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
  public readonly uuid: typeof uuid = this.api.hap.uuid;

  public readonly latitude: number;
  public readonly longitude: number;

  public readonly fakeGatoHistoryService;

  public readonly connection: Connection;

  private readonly devices: WeatherAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.latitude = config.latitude;
    this.longitude = config.longitude;

    // connect
    this.connection = new Connection({
      ipAddr: config.ip ?? '224.0.23.12',
      ipPort: config.port ?? 3671,
      handlers: {
        connected: function () {
          log.info('KNX connected');
        },
        error: function (connstatus: unknown) {
          log.error(`KNX status: ${connstatus}`);
        },
      },
    });

    // read devices
    this.devices.push(new WeatherAccessory(this, config));

    log.info('finished initializing!');
  }

  accessories(callback: (foundAccessories: AccessoryPlugin[]) => void): void {
    callback(this.devices);
  }
}
