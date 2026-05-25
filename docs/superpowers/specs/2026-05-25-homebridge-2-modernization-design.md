# Homebridge 2 Modernization Design

## Goal

Prepare `@jendrik/homebridge-knx-weather` for a breaking Homebridge 2-only release while keeping the plugin HomeKit-only. Backward compatibility with Homebridge 1.x and older Node.js versions is out of scope.

The release should update the runtime and development dependencies, remove beta Homebridge targeting, improve configuration validation and timer behavior, and add focused automated tests around the plugin's small but user-visible behavior.

## Current State

The plugin is a TypeScript ESM Homebridge platform that exposes one synthetic weather accessory with four contact sensor services:

- Morning Twilight
- Day
- Evening Twilight
- Night

Solar phase boundaries are calculated with `suncalc`. The current package already includes partial Homebridge 2 work, but it still declares Homebridge 1.8 compatibility, depends on a Homebridge 2 beta for development, has no tests, accepts weakly validated config values, logs all solar event times at info level, and schedules multiple daily `setTimeout` calls without explicit cleanup.

## Chosen Approach

Use a focused Homebridge 2 modernization. Keep the current single-accessory HomeKit model and avoid Matter support for this release.

This is preferred over a full dynamic-platform rewrite because the plugin has one synthetic accessory and no discovery lifecycle. A dynamic platform can be introduced later if the plugin grows multiple accessories or persistent Homebridge cache semantics become useful.

## Package And Tooling

- Set `engines.homebridge` to `^2.0.0`.
- Set `engines.node` to the Homebridge 2-supported Node range and current tooling floor: `^22.13.0 || ^24.0.0`.
- Update `homebridge` dev dependency from beta to the current stable Homebridge 2 release.
- Update TypeScript, ESLint, `typescript-eslint`, Node typings, and existing helper tools to compatible current versions.
- Keep ESM output with `module` and `moduleResolution` set to `nodenext`.
- Add a `test` script and include it in `prepublishOnly`.
- Keep `lint` and `build` as release gates.
- Treat this as a breaking plugin release, with the exact version bump decided during implementation closeout.

## Runtime Architecture

Keep the platform as a static platform plugin that returns one `WeatherAccessory`.

Responsibilities:

- `index.ts`: register the platform with Homebridge.
- `settings.ts`: expose constants derived from `package.json`, including the correct scoped package identifier.
- `platform.ts`: validate config, initialize Homebridge HAP references, manage the KNX connection, create the accessory, and own shutdown cleanup.
- `accessory.ts`: own HomeKit services and apply calculated phase states to those services.
- New small pure modules may be added for config parsing and solar phase evaluation if they make testing direct and keep Homebridge-specific code thin.

The plugin should not use Homebridge 2 Matter APIs in this release.

## Configuration

Supported options remain:

- `platform`: must be `knx-weather`.
- `ip`: optional string, default `224.0.23.12`.
- `port`: optional number, default `3671`.
- `latitude`: required finite number in the valid latitude range.
- `longitude`: required finite number in the valid longitude range.

The Homebridge UI schema should declare `port` as a number, mark `latitude` and `longitude` as required, and include numeric constraints where supported.

Invalid config should fail clearly during platform construction. It should not create a partially working accessory with invalid solar calculations.

## Solar Phase Behavior

The user-facing HomeKit model stays unchanged: each phase is represented by a contact sensor, and `CONTACT_NOT_DETECTED` means the phase is active.

Phase rules:

- Morning Twilight is active from `nightEnd` to `sunrise`.
- Day is active from `sunrise` to `sunset`.
- Evening Twilight is active from `sunset` to `night`.
- Night is active from `night` to the next `nightEnd`.

Implementation should compute all four sensor states from one `Date` and one SunCalc time table. The state calculation should be pure enough to test without Homebridge.

Scheduling should avoid stacking timers. After each update, schedule one next update for the next relevant phase boundary or a short fallback refresh if no valid future boundary is available. Timers must be cleared on Homebridge shutdown.

Normal startup should log a concise initialization summary. Full solar event details should be debug-level logging, not info-level noise.

## KNX Connection

The existing KNX dependency and connection defaults stay in place. This modernization does not add KNX group-address behavior because the current plugin's visible HomeKit behavior is calculated from coordinates.

The platform should still create the KNX connection with the configured router/interface address and port. Connection success and errors should continue to be logged.

If implementation discovers that the `knx` package has a newer compatible version, update it within the same modernization. Do not replace the KNX library unless the existing package blocks Node 22/24 or Homebridge 2 operation.

## Testing

Add focused automated tests for:

- Valid config parsing with defaults.
- Invalid latitude, longitude, and port handling.
- Solar phase state calculation at representative times.
- Night behavior across midnight and next-day `nightEnd`.
- Timer/scheduler behavior at a unit level if the scheduling logic is extracted cleanly.

The verification target for implementation is:

- `npm run lint`
- `npm run build`
- `npm test`

CI should run the same gates on Node 22 and Node 24.

## Documentation

Update the README to state:

- Homebridge 2.x is required.
- Node.js 22.13+ or 24+ is required.
- The plugin remains HomeKit-only.
- Active phase sensors report `CONTACT_NOT_DETECTED`.

Update configuration examples and the config schema so `port`, `latitude`, and `longitude` match the validated runtime types.

## Out Of Scope

- Homebridge 1.x compatibility.
- Matter accessory exposure.
- New sensor types or configurable phase definitions.
- KNX group-address reads or writes.
- A dynamic-platform rewrite unless implementation uncovers a concrete Homebridge 2 requirement for it.

## Acceptance Criteria

- The package targets stable Homebridge 2 and the Homebridge 2 Node support range.
- The plugin builds and lints cleanly with updated dependencies.
- Tests cover config validation and phase-state behavior.
- The runtime no longer stacks unbounded daily transition timers.
- Shutdown clears plugin-owned timers.
- README and `config.schema.json` match the Homebridge 2-only runtime contract.
