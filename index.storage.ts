import * as localForage from "localforage";
import { Logger } from "../logger/index.logger";
import { ErrorHandler } from "../handlers/errorHandler/error.handler";
import { ErrorConstant } from "../handlers/errorHandler/error.constant";
import { CustomError } from "../handlers/errorHandler/error.model";
import { Security } from "../security/security.index";
/* This class provide api for Store information in db*/
export class Storage {
  private storageApi: any;
  private static instance: Storage;
  private security: Security;
  private driverType: string;
  private isEncryption: boolean;
  private encryptedKey: string;
  private constructor() {
    this.security = new Security();
  }

  // tslint:disable-next-line:member-ordering
  public static getInstance(): Storage {
    if (!Storage.instance) {
      Storage.instance = new Storage();
    }
    return Storage.instance;
  }

  public setItem(key: string, value: any): Promise<boolean> {
    return new Promise(resolve => {
      try {
        value = this.getEncryptedValue(value, this.encryptedKey || key);
        const result = this.storageApi.setItem(
          this.getKeyName(key),
          JSON.stringify(value)
        );
        if (result instanceof Promise) {
          result.then(resp => {
            resolve(true);
          });
        } else {
          resolve(true);
        }
      } catch (error) {
        Logger.getInstance().error("key does not exist in storage");
        throw new CustomError("PW001", error);
      }
    });

    return;
  }

  public setDriver(type: string): void {
    localForage.setDriver(this.getDriverByType(type));
  }

  public clearAll(): void {
    this.driverType === "sessionStorage"
      ? sessionStorage.clear()
      : localForage.clear();
  }

  public clear(key: string): void {
    this.driverType === "sessionStorage"
      ? sessionStorage.removeItem(this.getKeyName(key))
      : localForage.removeItem(this.getKeyName(key));
  }

  // tslint:disable-next-line: member-ordering
  public getAllKeys(): Promise<any> {
    let result;
    return new Promise((resolve, reject) => {
      try {
        result =
          this.driverType === "sessionStorage"
            ? Object.keys(sessionStorage)
            : localForage.keys();

        if (result instanceof Promise) {
          result.then(resp => {
            resolve(this.getDecryptedKeyList(resp));
          });
        } else {
          resolve(this.getDecryptedKeyList(result));
        }
      } catch (error) {
        Logger.getInstance().error("key does not exist in storage");
        throw new CustomError("PW001", error);
      }
    });
  }

  public getItemValue(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        const result = this.getItem(key);
        if (result instanceof Promise) {
          result.then(resp => {
            resolve(this.getDecryptedValue(resp, this.encryptedKey || key));
          });
        } else {
          resolve(this.getDecryptedValue(result, this.encryptedKey || key));
        }
      } catch (error) {
        Logger.getInstance().error("key does not exist in storage");
        throw new CustomError("PW001", error);
      }
    });
  }

  public getDriverByType(type: string): any {
    let driver = null;
    switch (type) {
      case "localStorage":
        driver = localForage.LOCALSTORAGE;
        break;
      case "indexDB":
        driver = localForage.INDEXEDDB;
        break;
      case "webSql":
        driver = localForage.WEBSQL;
      default:
        driver = localForage.LOCALSTORAGE;
        break;
    }
    return driver;
  }

  /* this method set the configuration of localforage */
  public setConfiguration(
    driverType: string,
    isEncryption?: boolean,
    encryptedKey?: string,
    size?: number
  ): void {
    if (driverType !== "sessionStorage") {
      localForage.config({
        description: "Setting the Configuration Detail of localForage",
        driver: this.getDriverByType(driverType), // Force WebSQL; same as using setDriver()
        name: "",
        size: size || 4980736, // Size of database, in bytes. WebSQL-only for now.
        storeName: "keyvaluepairs", // Should be alphanumeric, with underscores.
        version: 1.0
      });
      this.setStorageApi();
    } else {
      this.setSessionStorage();
    }
    this.driverType = driverType;
    this.isEncryption = isEncryption;
    this.encryptedKey = encryptedKey;
  }

  private setSessionStorage(): void {
    this.storageApi = sessionStorage;
  }

  private setStorageApi(): void {
    this.storageApi = localForage;
  }

  private getItem(key: string): Promise<string | object | []> {
    return this.storageApi.getItem(this.getKeyName(key));
  }

  private getEncryptedValue(value: any, key: string) {
    return this.isEncryption
      ? this.security.aesEncryption.getEncryption(JSON.stringify(value), key)
      : value;
  }

  private getDecryptedValue(value: any, key: string) {
    if (value) {
      return this.isEncryption
        ? this.security.aesEncryption.getDecryption(JSON.parse(value), key)
        : value;
    }
    return value;
  }

  private getKeyName(key: string): string {
    return this.isEncryption ? btoa(key) : key;
  }

  private getDecryptedKeyList(keyList: []) {
    return this.isEncryption ? keyList.map(value => atob(value)) : keyList;
  }
}
