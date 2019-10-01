export interface ILocalForageConfig{
        description : string;   
        driver      : any; // Force WebSQL; same as using setDriver()
        name        : string;
        size        : number; // Size of database, in bytes. WebSQL-only for now.
        storeName   : string; // Should be alphanumeric, with underscores.
        version     : number;
}
