# homebridge-knx-weather

Homebridge plugin for KNX weather stations. Exposes solar cycle phases (morning twilight, day, evening twilight, night) as contact sensors in HomeKit, calculated from your geographic coordinates using [SunCalc](https://github.com/mourner/suncalc).

This plugin is HomeKit-only. It does not expose Matter accessories.

## Features

- **Morning Twilight** sensor — active from nightEnd to sunrise
- **Day** sensor — active from sunrise to sunset
- **Evening Twilight** sensor — active from sunset to night
- **Night** sensor — active from night to nightEnd

Each sensor is exposed as a HomeKit contact sensor. Active phase sensors report `CONTACT_NOT_DETECTED`; inactive phase sensors report `CONTACT_DETECTED`. Phases are recalculated every 24 hours, and transitions are scheduled using timers for the current day.

## Requirements

- [Homebridge](https://homebridge.io) 2.x
- Node.js 22.13.0+ or 24.0.0+
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
| `port` | integer | `3671` | KNX port, from `1` to `65535` |
| `latitude` | number | *required* | Latitude of your location, from `-90` to `90` |
| `longitude` | number | *required* | Longitude of your location, from `-180` to `180` |

You can also configure the plugin through the Homebridge UI settings panel.

## Development

```sh
# Install dependencies
npm install

# Build
npm run build

# Lint
npm run lint

# Run tests
npm test
```

## License

[Apache-2.0](LICENSE)
