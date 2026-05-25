import { API, AccessoryPlugin, Characteristic, Logger, PlatformConfig, Service, StaticPlatformPlugin, uuid } from 'homebridge';
import { Connection } from 'knx';

import { parseWeatherConfig, type WeatherConfig } from './config.js';
import { WeatherAccessory } from './accessory.js';

export class WeatherPlatform implements StaticPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;
  public readonly uuid: typeof uuid;

  public readonly weatherConfig: WeatherConfig;
  public readonly connection: Connection;

  private readonly devices: WeatherAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;
    this.uuid = api.hap.uuid;
    this.weatherConfig = parseWeatherConfig(config);

    // connect
    this.connection = new Connection({
      ipAddr: this.weatherConfig.ip,
      ipPort: this.weatherConfig.port,
      handlers: {
        connected: () => {
          log.info('KNX connected');
        },
        error: (connstatus: unknown) => {
          log.error(`KNX status: ${connstatus}`);
        },
      },
    });

    // read devices
    this.devices.push(new WeatherAccessory(this, this.weatherConfig));
    this.api.on('shutdown', () => this.shutdown());

    log.info(`Initialized KNX Weather Station at ${this.weatherConfig.latitude}, ${this.weatherConfig.longitude}`);
  }

  accessories(callback: (foundAccessories: AccessoryPlugin[]) => void): void {
    callback(this.devices);
  }

  private shutdown(): void {
    for (const device of this.devices) {
      device.shutdown();
    }

    this.connection.Disconnect(() => {
      this.log.debug('KNX disconnected');
    });
  }
}
