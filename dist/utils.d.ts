export declare function toPrettyJSON<T>(input: T): string;
export declare function delay(time: number): Promise<void>;
export declare function objectCopy<T>(input: T): T;
export declare function arrayChunk<T extends any[]>(arr: T, len: number): any[];
export declare function formatNumber(val: number): string;
export declare function capitalizeFirstLetter(string: string): string;
export declare function L(...args: any[]): any[];
export declare function beforeClose(fn: () => void): void;
