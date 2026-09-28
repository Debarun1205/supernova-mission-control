import mongoose from 'mongoose';
export declare const Satellite: mongoose.Model<{
    name: string;
    noradId: number;
    tier: "fleet" | "catalogue";
    health: "nominal" | "warning" | "critical" | "no_contact";
    healthScore: number;
    tle1?: string | null;
    tle2?: string | null;
    intlDesignator?: string | null;
    group?: string | null;
    epoch?: NativeDate | null;
    inclination?: number | null;
    period?: number | null;
    apogee?: number | null;
    perigee?: number | null;
    country?: string | null;
    lastSyncedAt?: NativeDate | null;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    name: string;
    noradId: number;
    tier: "fleet" | "catalogue";
    health: "nominal" | "warning" | "critical" | "no_contact";
    healthScore: number;
    tle1?: string | null;
    tle2?: string | null;
    intlDesignator?: string | null;
    group?: string | null;
    epoch?: NativeDate | null;
    inclination?: number | null;
    period?: number | null;
    apogee?: number | null;
    perigee?: number | null;
    country?: string | null;
    lastSyncedAt?: NativeDate | null;
}, {}, mongoose.DefaultSchemaOptions> & {
    name: string;
    noradId: number;
    tier: "fleet" | "catalogue";
    health: "nominal" | "warning" | "critical" | "no_contact";
    healthScore: number;
    tle1?: string | null;
    tle2?: string | null;
    intlDesignator?: string | null;
    group?: string | null;
    epoch?: NativeDate | null;
    inclination?: number | null;
    period?: number | null;
    apogee?: number | null;
    perigee?: number | null;
    country?: string | null;
    lastSyncedAt?: NativeDate | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    name: string;
    noradId: number;
    tier: "fleet" | "catalogue";
    health: "nominal" | "warning" | "critical" | "no_contact";
    healthScore: number;
    tle1?: string | null;
    tle2?: string | null;
    intlDesignator?: string | null;
    group?: string | null;
    epoch?: NativeDate | null;
    inclination?: number | null;
    period?: number | null;
    apogee?: number | null;
    perigee?: number | null;
    country?: string | null;
    lastSyncedAt?: NativeDate | null;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    name: string;
    noradId: number;
    tier: "fleet" | "catalogue";
    health: "nominal" | "warning" | "critical" | "no_contact";
    healthScore: number;
    tle1?: string | null;
    tle2?: string | null;
    intlDesignator?: string | null;
    group?: string | null;
    epoch?: NativeDate | null;
    inclination?: number | null;
    period?: number | null;
    apogee?: number | null;
    perigee?: number | null;
    country?: string | null;
    lastSyncedAt?: NativeDate | null;
}>, {}, mongoose.DefaultSchemaOptions> & mongoose.FlatRecord<{
    name: string;
    noradId: number;
    tier: "fleet" | "catalogue";
    health: "nominal" | "warning" | "critical" | "no_contact";
    healthScore: number;
    tle1?: string | null;
    tle2?: string | null;
    intlDesignator?: string | null;
    group?: string | null;
    epoch?: NativeDate | null;
    inclination?: number | null;
    period?: number | null;
    apogee?: number | null;
    perigee?: number | null;
    country?: string | null;
    lastSyncedAt?: NativeDate | null;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
//# sourceMappingURL=Satellite.d.ts.map