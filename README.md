# homebridge-knx-weather

Homebridge plugin for KNX weather stations. Exposes solar cycle phases (morning twilight, day, evening twilight, night) as contact sensors in HomeKit, calculated from your geographic coordinates using [SunCalc](https://github.com/mourner/suncalc).

## Features

- **Morning Twilight** sensor — active from nightEnd to sunrise
- **Day** sensor — active from sunrise to sunset
- **Evening Twilight** sensor — active from sunset to night
- **Night** sensor — active from night to nightEnd

Each sensor is exposed as a HomeKit contact sensor. The "contact not detected" state indicates the phase is currently active. Phases are recalculated every 24 hours, and transitions are scheduled using timers for the current day.

## Requirements

- [Homebridge](https://homebridge.io) v1.8.0 or later (including v2.0)
- Node.js v20.18.0, v22.10.0, or v24.0.0 and later
- A KNX IP router or interface

## Installation

### Via Homebridge UI

Search for `@jendrik/homebridge-knx-weather` in the Homebridge UI plugin search and install it.

### Via CLI

```sh
npm install -g @jendrik/homebridge-knx-weather
```

## Configuration

Add the platform to the `platforms` array in your Homebridge `config.json`:

```json
{
  "platforms": [
    {
      "platform": "knx-weather",
      "ip": "224.0.23.12",
      "port": 3671,
      "latitude": 51.790986,
      "longitude": 9.436365
    }
  ]
}
```

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `platform` | string | *required* | Must be `"knx-weather"` |
| `ip` | string | `224.0.23.12` | IP address of your KNX router or interface |
| `port` | number | `3671` | KNX port |
| `latitude` | number | *required* | Latitude of your location |
| `longitude` | number | *required* | Longitude of your location |

You can also configure the plugin through the Homebridge UI settings panel.

## Development

```sh
# Install dependencies
npm install

# Build
npm run build

# Lint
npm run lint

# Watch mode (auto-rebuild + restart Homebridge)
npm run watch
```

## License

[Apache-2.0](LICENSE)
