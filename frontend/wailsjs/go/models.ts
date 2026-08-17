export namespace domain {
	
	export class Device {
	    ID: string;
	    Serial: string;
	    State: string;
	    Transport: string;
	    Manufacturer: string;
	    Model: string;
	    Android: string;
	    SDK: number;
	    Architecture: string;
	
	    static createFrom(source: any = {}) {
	        return new Device(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.Serial = source["Serial"];
	        this.State = source["State"];
	        this.Transport = source["Transport"];
	        this.Manufacturer = source["Manufacturer"];
	        this.Model = source["Model"];
	        this.Android = source["Android"];
	        this.SDK = source["SDK"];
	        this.Architecture = source["Architecture"];
	    }
	}
	export class DeviceInfo {
	    ID: string;
	    Serial: string;
	    State: string;
	    Transport: string;
	    Manufacturer: string;
	    Model: string;
	    Android: string;
	    SDK: number;
	    Architecture: string;
	    Brand: string;
	    Board: string;
	    Hardware: string;
	    BuildID: string;
	    SecurityPatch: string;
	    Bootloader: string;
	    SupportedABIs: string;
	    Resolution: string;
	    Density: number;
	    StorageUsedBytes: number;
	    StorageTotalBytes: number;
	    CPUCores: number;
	    TotalRAMBytes: number;
	    UptimeSeconds: number;
	    BatteryLevel: number;
	    BatteryStatus: string;
	    BatteryHealth: string;
	    BatteryPlugged: string;
	    BatteryVoltage: number;
	    BatteryTemperature: number;
	
	    static createFrom(source: any = {}) {
	        return new DeviceInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.Serial = source["Serial"];
	        this.State = source["State"];
	        this.Transport = source["Transport"];
	        this.Manufacturer = source["Manufacturer"];
	        this.Model = source["Model"];
	        this.Android = source["Android"];
	        this.SDK = source["SDK"];
	        this.Architecture = source["Architecture"];
	        this.Brand = source["Brand"];
	        this.Board = source["Board"];
	        this.Hardware = source["Hardware"];
	        this.BuildID = source["BuildID"];
	        this.SecurityPatch = source["SecurityPatch"];
	        this.Bootloader = source["Bootloader"];
	        this.SupportedABIs = source["SupportedABIs"];
	        this.Resolution = source["Resolution"];
	        this.Density = source["Density"];
	        this.StorageUsedBytes = source["StorageUsedBytes"];
	        this.StorageTotalBytes = source["StorageTotalBytes"];
	        this.CPUCores = source["CPUCores"];
	        this.TotalRAMBytes = source["TotalRAMBytes"];
	        this.UptimeSeconds = source["UptimeSeconds"];
	        this.BatteryLevel = source["BatteryLevel"];
	        this.BatteryStatus = source["BatteryStatus"];
	        this.BatteryHealth = source["BatteryHealth"];
	        this.BatteryPlugged = source["BatteryPlugged"];
	        this.BatteryVoltage = source["BatteryVoltage"];
	        this.BatteryTemperature = source["BatteryTemperature"];
	    }
	}

}

