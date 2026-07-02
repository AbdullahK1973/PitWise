import { PermissionsAndroid, Platform } from "react-native";
import type { BleManager, Characteristic, Device } from "react-native-ble-plx";
import { Buffer } from "buffer";

export type BluetoothObdDevice = {
  id: string;
  name: string;
};

type ObdCharacteristics = {
  serviceUUID: string;
  writeUUID: string;
  notifyUUID: string;
  writeWithResponse: boolean;
};

const OBD_NAME_PATTERN = /(obd|elm|veepeak|vlink|v-link|carista|panlong|konnwei|vgate|ble)/i;
const SERVICE_UUIDS = {
  hm10: "ffe0",
  nordic: "6e400001b5a3f393e0a9e50e24dcca9e"
};
const CHARACTERISTIC_UUIDS = {
  hm10: "ffe1",
  nordicWrite: "6e400002b5a3f393e0a9e50e24dcca9e",
  nordicNotify: "6e400003b5a3f393e0a9e50e24dcca9e"
};

function normalizeUuid(uuid: string) {
  return uuid.toLowerCase().replace(/-/g, "");
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64");
}

function decode(value: string) {
  return Buffer.from(value, "base64").toString("utf8");
}

export function looksLikeObdDevice(device: BluetoothObdDevice) {
  return OBD_NAME_PATTERN.test(device.name);
}

export class ObdBluetoothClient {
  private manager: BleManager;
  private connectedDeviceId: string | null = null;

  constructor() {
    this.manager = createBleManager();
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== "android") return true;

    if (Platform.Version >= 31) {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
      ]);
      return Object.values(result).every((status) => status === PermissionsAndroid.RESULTS.GRANTED);
    }

    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }

  async scan(
    onDevice: (device: BluetoothObdDevice) => void,
    onError: (message: string) => void
  ): Promise<() => void> {
    const permitted = await this.requestPermissions();
    if (!permitted) {
      onError("Bluetooth permission was not granted.");
      return () => undefined;
    }

    const state = await this.manager.state();
    if (state !== "PoweredOn") {
      onError("Turn on Bluetooth, then scan again.");
      return () => undefined;
    }

    this.manager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
      if (error) {
        onError(error.message);
        this.manager.stopDeviceScan();
        return;
      }
      if (!device) return;
      const name = device.name ?? device.localName ?? "Unnamed BLE device";
      onDevice({ id: device.id, name });
    });

    return () => this.manager.stopDeviceScan();
  }

  async readStoredCodes(deviceId: string, onLog: (message: string) => void): Promise<string[]> {
    onLog("Connecting to adapter");
    const device = await this.manager.connectToDevice(deviceId, { timeout: 15000 });
    this.connectedDeviceId = device.id;
    await device.discoverAllServicesAndCharacteristics();

    const characteristics = await this.findObdCharacteristics(device);
    let responseBuffer = "";
    const subscription = this.manager.monitorCharacteristicForDevice(
      device.id,
      characteristics.serviceUUID,
      characteristics.notifyUUID,
      (error, characteristic) => {
        if (error || !characteristic?.value) return;
        responseBuffer += decode(characteristic.value);
      }
    );

    try {
      await delay(300);
      onLog("Initializing ELM327");
      await this.transact(device.id, characteristics, "ATZ", () => responseBuffer, (value) => (responseBuffer = value), 3500);
      await this.transact(device.id, characteristics, "ATE0", () => responseBuffer, (value) => (responseBuffer = value));
      await this.transact(device.id, characteristics, "ATL0", () => responseBuffer, (value) => (responseBuffer = value));
      await this.transact(device.id, characteristics, "ATS0", () => responseBuffer, (value) => (responseBuffer = value));
      await this.transact(device.id, characteristics, "ATH0", () => responseBuffer, (value) => (responseBuffer = value));
      await this.transact(device.id, characteristics, "ATSP0", () => responseBuffer, (value) => (responseBuffer = value), 2500);

      onLog("Reading stored diagnostic trouble codes");
      const response = await this.transact(device.id, characteristics, "03", () => responseBuffer, (value) => (responseBuffer = value), 6000);
      return parseStoredCodes(response);
    } finally {
      subscription.remove();
    }
  }

  async disconnect() {
    if (!this.connectedDeviceId) return;
    await this.manager.cancelDeviceConnection(this.connectedDeviceId).catch(() => undefined);
    this.connectedDeviceId = null;
  }

  destroy() {
    this.manager.stopDeviceScan();
    this.manager.destroy();
  }

  private async transact(
    deviceId: string,
    characteristics: ObdCharacteristics,
    command: string,
    getResponse: () => string,
    setResponse: (value: string) => void,
    timeoutMs = 2200
  ) {
    setResponse("");
    const payload = encode(`${command}\r`);
    if (characteristics.writeWithResponse) {
      await this.manager.writeCharacteristicWithResponseForDevice(deviceId, characteristics.serviceUUID, characteristics.writeUUID, payload);
    } else {
      await this.manager.writeCharacteristicWithoutResponseForDevice(deviceId, characteristics.serviceUUID, characteristics.writeUUID, payload);
    }

    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      await delay(80);
      const response = getResponse();
      if (response.includes(">")) return response;
    }
    return getResponse();
  }

  private async findObdCharacteristics(device: Device): Promise<ObdCharacteristics> {
    const services = await device.services();
    const allCharacteristics: Array<{ serviceUUID: string; characteristic: Characteristic }> = [];

    for (const service of services) {
      const characteristics = await service.characteristics();
      for (const characteristic of characteristics) {
        allCharacteristics.push({ serviceUUID: service.uuid, characteristic });
      }
    }

    const hm10 = allCharacteristics.find(
      (item) => normalizeUuid(item.serviceUUID).endsWith(SERVICE_UUIDS.hm10) && normalizeUuid(item.characteristic.uuid).endsWith(CHARACTERISTIC_UUIDS.hm10)
    );
    if (hm10) {
      return {
        serviceUUID: hm10.serviceUUID,
        writeUUID: hm10.characteristic.uuid,
        notifyUUID: hm10.characteristic.uuid,
        writeWithResponse: Boolean(hm10.characteristic.isWritableWithResponse)
      };
    }

    const nordicWrite = allCharacteristics.find((item) => normalizeUuid(item.characteristic.uuid) === CHARACTERISTIC_UUIDS.nordicWrite);
    const nordicNotify = allCharacteristics.find((item) => normalizeUuid(item.characteristic.uuid) === CHARACTERISTIC_UUIDS.nordicNotify);
    if (nordicWrite && nordicNotify && normalizeUuid(nordicWrite.serviceUUID) === SERVICE_UUIDS.nordic) {
      return {
        serviceUUID: nordicWrite.serviceUUID,
        writeUUID: nordicWrite.characteristic.uuid,
        notifyUUID: nordicNotify.characteristic.uuid,
        writeWithResponse: Boolean(nordicWrite.characteristic.isWritableWithResponse)
      };
    }

    const writable = allCharacteristics.find((item) => item.characteristic.isWritableWithResponse || item.characteristic.isWritableWithoutResponse);
    const notifiable = allCharacteristics.find((item) => item.serviceUUID === writable?.serviceUUID && (item.characteristic.isNotifiable || item.characteristic.isIndicatable));

    if (!writable || !notifiable) {
      throw new Error("No writable/notifiable ELM327 BLE characteristic was found on this device.");
    }

    return {
      serviceUUID: writable.serviceUUID,
      writeUUID: writable.characteristic.uuid,
      notifyUUID: notifiable.characteristic.uuid,
      writeWithResponse: Boolean(writable.characteristic.isWritableWithResponse)
    };
  }
}

function createBleManager(): BleManager {
  try {
    const blePlx = require("react-native-ble-plx") as typeof import("react-native-ble-plx");
    return new blePlx.BleManager();
  } catch {
    throw new Error("Bluetooth scanning requires a development build or production build. It will not run inside Expo Go.");
  }
}

export function parseStoredCodes(response: string): string[] {
  const pairs = response
    .toUpperCase()
    .replace(/SEARCHING|NO DATA|STOPPED|\?|OK|ELM327|AT[A-Z0-9]+|03|>/g, " ")
    .match(/[0-9A-F]{2}/g);

  if (!pairs) return [];
  const firstResponseByte = pairs.indexOf("43");
  if (firstResponseByte < 0) return [];

  const bytes = pairs.slice(firstResponseByte + 1).map((pair) => Number.parseInt(pair, 16));
  const codes: string[] = [];
  const systems = ["P", "C", "B", "U"];

  for (let index = 0; index + 1 < bytes.length; index += 2) {
    const first = bytes[index];
    const second = bytes[index + 1];
    if (first === 0 && second === 0) continue;
    const system = systems[(first & 0xc0) >> 6];
    const firstDigit = (first & 0x30) >> 4;
    const secondDigit = (first & 0x0f).toString(16).toUpperCase();
    const lastDigits = second.toString(16).toUpperCase().padStart(2, "0");
    codes.push(`${system}${firstDigit}${secondDigit}${lastDigits}`);
  }

  return Array.from(new Set(codes));
}
