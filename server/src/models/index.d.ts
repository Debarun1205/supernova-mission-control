import mongoose from 'mongoose';
export declare const Telemetry: mongoose.Model<{
    ts: NativeDate;
    satelliteId: number;
    power?: {
        soc?: number | null;
        solarCurrent?: number | null;
        busVoltage?: number | null;
    } | null;
    thermal?: {
        batteryTemp?: number | null;
        busTemp?: number | null;
        payloadTemp?: number | null;
    } | null;
    comms?: {
        signalStrength?: number | null;
        connectedStation?: string | null;
    } | null;
    adcs?: {
        pointingError?: number | null;
        wheelSpeedRPM?: number | null;
    } | null;
    radiation?: {
        seuCount?: number | null;
    } | null;
    mode?: "nominal" | "safe" | "eclipse" | "contact" | "payload_ops" | null;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    ts: NativeDate;
    satelliteId: number;
    power?: {
        soc?: number | null;
        solarCurrent?: number | null;
        busVoltage?: number | null;
    } | null;
    thermal?: {
        batteryTemp?: number | null;
        busTemp?: number | null;
        payloadTemp?: number | null;
    } | null;
    comms?: {
        signalStrength?: number | null;
        connectedStation?: string | null;
    } | null;
    adcs?: {
        pointingError?: number | null;
        wheelSpeedRPM?: number | null;
    } | null;
    radiation?: {
        seuCount?: number | null;
    } | null;
    mode?: "nominal" | "safe" | "eclipse" | "contact" | "payload_ops" | null;
}, {}, {
    timestamps: false;
}> & {
    ts: NativeDate;
    satelliteId: number;
    power?: {
        soc?: number | null;
        solarCurrent?: number | null;
        busVoltage?: number | null;
    } | null;
    thermal?: {
        batteryTemp?: number | null;
        busTemp?: number | null;
        payloadTemp?: number | null;
    } | null;
    comms?: {
        signalStrength?: number | null;
        connectedStation?: string | null;
    } | null;
    adcs?: {
        pointingError?: number | null;
        wheelSpeedRPM?: number | null;
    } | null;
    radiation?: {
        seuCount?: number | null;
    } | null;
    mode?: "nominal" | "safe" | "eclipse" | "contact" | "payload_ops" | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: false;
}, {
    ts: NativeDate;
    satelliteId: number;
    power?: {
        soc?: number | null;
        solarCurrent?: number | null;
        busVoltage?: number | null;
    } | null;
    thermal?: {
        batteryTemp?: number | null;
        busTemp?: number | null;
        payloadTemp?: number | null;
    } | null;
    comms?: {
        signalStrength?: number | null;
        connectedStation?: string | null;
    } | null;
    adcs?: {
        pointingError?: number | null;
        wheelSpeedRPM?: number | null;
    } | null;
    radiation?: {
        seuCount?: number | null;
    } | null;
    mode?: "nominal" | "safe" | "eclipse" | "contact" | "payload_ops" | null;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    ts: NativeDate;
    satelliteId: number;
    power?: {
        soc?: number | null;
        solarCurrent?: number | null;
        busVoltage?: number | null;
    } | null;
    thermal?: {
        batteryTemp?: number | null;
        busTemp?: number | null;
        payloadTemp?: number | null;
    } | null;
    comms?: {
        signalStrength?: number | null;
        connectedStation?: string | null;
    } | null;
    adcs?: {
        pointingError?: number | null;
        wheelSpeedRPM?: number | null;
    } | null;
    radiation?: {
        seuCount?: number | null;
    } | null;
    mode?: "nominal" | "safe" | "eclipse" | "contact" | "payload_ops" | null;
}>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: false;
}>> & mongoose.FlatRecord<{
    ts: NativeDate;
    satelliteId: number;
    power?: {
        soc?: number | null;
        solarCurrent?: number | null;
        busVoltage?: number | null;
    } | null;
    thermal?: {
        batteryTemp?: number | null;
        busTemp?: number | null;
        payloadTemp?: number | null;
    } | null;
    comms?: {
        signalStrength?: number | null;
        connectedStation?: string | null;
    } | null;
    adcs?: {
        pointingError?: number | null;
        wheelSpeedRPM?: number | null;
    } | null;
    radiation?: {
        seuCount?: number | null;
    } | null;
    mode?: "nominal" | "safe" | "eclipse" | "contact" | "payload_ops" | null;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const Alert: mongoose.Model<{
    satelliteId: number;
    status: "open" | "acknowledged" | "resolved";
    createdAt: NativeDate;
    evidence: any[];
    type?: string | null;
    message?: string | null;
    value?: number | null;
    threshold?: number | null;
    acknowledgedAt?: NativeDate | null;
    resolvedAt?: NativeDate | null;
    incidentId?: mongoose.Types.ObjectId | null;
    severity?: "warning" | "critical" | null;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    satelliteId: number;
    status: "open" | "acknowledged" | "resolved";
    createdAt: NativeDate;
    evidence: any[];
    type?: string | null;
    message?: string | null;
    value?: number | null;
    threshold?: number | null;
    acknowledgedAt?: NativeDate | null;
    resolvedAt?: NativeDate | null;
    incidentId?: mongoose.Types.ObjectId | null;
    severity?: "warning" | "critical" | null;
}, {}, mongoose.DefaultSchemaOptions> & {
    satelliteId: number;
    status: "open" | "acknowledged" | "resolved";
    createdAt: NativeDate;
    evidence: any[];
    type?: string | null;
    message?: string | null;
    value?: number | null;
    threshold?: number | null;
    acknowledgedAt?: NativeDate | null;
    resolvedAt?: NativeDate | null;
    incidentId?: mongoose.Types.ObjectId | null;
    severity?: "warning" | "critical" | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    satelliteId: number;
    status: "open" | "acknowledged" | "resolved";
    createdAt: NativeDate;
    evidence: any[];
    type?: string | null;
    message?: string | null;
    value?: number | null;
    threshold?: number | null;
    acknowledgedAt?: NativeDate | null;
    resolvedAt?: NativeDate | null;
    incidentId?: mongoose.Types.ObjectId | null;
    severity?: "warning" | "critical" | null;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    satelliteId: number;
    status: "open" | "acknowledged" | "resolved";
    createdAt: NativeDate;
    evidence: any[];
    type?: string | null;
    message?: string | null;
    value?: number | null;
    threshold?: number | null;
    acknowledgedAt?: NativeDate | null;
    resolvedAt?: NativeDate | null;
    incidentId?: mongoose.Types.ObjectId | null;
    severity?: "warning" | "critical" | null;
}>, {}, mongoose.DefaultSchemaOptions> & mongoose.FlatRecord<{
    satelliteId: number;
    status: "open" | "acknowledged" | "resolved";
    createdAt: NativeDate;
    evidence: any[];
    type?: string | null;
    message?: string | null;
    value?: number | null;
    threshold?: number | null;
    acknowledgedAt?: NativeDate | null;
    resolvedAt?: NativeDate | null;
    incidentId?: mongoose.Types.ObjectId | null;
    severity?: "warning" | "critical" | null;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const Incident: mongoose.Model<{
    satelliteId: number;
    status: "open" | "resolved";
    createdAt: NativeDate;
    resolvedAt?: NativeDate | null;
    probableCause?: string | null;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    satelliteId: number;
    status: "open" | "resolved";
    createdAt: NativeDate;
    resolvedAt?: NativeDate | null;
    probableCause?: string | null;
}, {}, mongoose.DefaultSchemaOptions> & {
    satelliteId: number;
    status: "open" | "resolved";
    createdAt: NativeDate;
    resolvedAt?: NativeDate | null;
    probableCause?: string | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    satelliteId: number;
    status: "open" | "resolved";
    createdAt: NativeDate;
    resolvedAt?: NativeDate | null;
    probableCause?: string | null;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    satelliteId: number;
    status: "open" | "resolved";
    createdAt: NativeDate;
    resolvedAt?: NativeDate | null;
    probableCause?: string | null;
}>, {}, mongoose.DefaultSchemaOptions> & mongoose.FlatRecord<{
    satelliteId: number;
    status: "open" | "resolved";
    createdAt: NativeDate;
    resolvedAt?: NativeDate | null;
    probableCause?: string | null;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const GroundStation: mongoose.Model<{
    elevationMask: number;
    name?: string | null;
    lat?: number | null;
    lon?: number | null;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    elevationMask: number;
    name?: string | null;
    lat?: number | null;
    lon?: number | null;
}, {}, mongoose.DefaultSchemaOptions> & {
    elevationMask: number;
    name?: string | null;
    lat?: number | null;
    lon?: number | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    elevationMask: number;
    name?: string | null;
    lat?: number | null;
    lon?: number | null;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    elevationMask: number;
    name?: string | null;
    lat?: number | null;
    lon?: number | null;
}>, {}, mongoose.DefaultSchemaOptions> & mongoose.FlatRecord<{
    elevationMask: number;
    name?: string | null;
    lat?: number | null;
    lon?: number | null;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const Satellite: mongoose.Model<{
    name: string;
    noradId: number;
    tier: "fleet" | "catalogue";
    health: "nominal" | "warning" | "critical" | "unknown";
    updatedAt: NativeDate;
    tle1?: string | null;
    tle2?: string | null;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    name: string;
    noradId: number;
    tier: "fleet" | "catalogue";
    health: "nominal" | "warning" | "critical" | "unknown";
    updatedAt: NativeDate;
    tle1?: string | null;
    tle2?: string | null;
}, {}, mongoose.DefaultSchemaOptions> & {
    name: string;
    noradId: number;
    tier: "fleet" | "catalogue";
    health: "nominal" | "warning" | "critical" | "unknown";
    updatedAt: NativeDate;
    tle1?: string | null;
    tle2?: string | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    name: string;
    noradId: number;
    tier: "fleet" | "catalogue";
    health: "nominal" | "warning" | "critical" | "unknown";
    updatedAt: NativeDate;
    tle1?: string | null;
    tle2?: string | null;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    name: string;
    noradId: number;
    tier: "fleet" | "catalogue";
    health: "nominal" | "warning" | "critical" | "unknown";
    updatedAt: NativeDate;
    tle1?: string | null;
    tle2?: string | null;
}>, {}, mongoose.DefaultSchemaOptions> & mongoose.FlatRecord<{
    name: string;
    noradId: number;
    tier: "fleet" | "catalogue";
    health: "nominal" | "warning" | "critical" | "unknown";
    updatedAt: NativeDate;
    tle1?: string | null;
    tle2?: string | null;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const ChatSession: mongoose.Model<{
    createdAt: NativeDate;
    messages: mongoose.Types.DocumentArray<{
        role?: string | null;
        content?: string | null;
        timestamp?: NativeDate | null;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        role?: string | null;
        content?: string | null;
        timestamp?: NativeDate | null;
    }> & {
        role?: string | null;
        content?: string | null;
        timestamp?: NativeDate | null;
    }>;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    createdAt: NativeDate;
    messages: mongoose.Types.DocumentArray<{
        role?: string | null;
        content?: string | null;
        timestamp?: NativeDate | null;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        role?: string | null;
        content?: string | null;
        timestamp?: NativeDate | null;
    }> & {
        role?: string | null;
        content?: string | null;
        timestamp?: NativeDate | null;
    }>;
}, {}, mongoose.DefaultSchemaOptions> & {
    createdAt: NativeDate;
    messages: mongoose.Types.DocumentArray<{
        role?: string | null;
        content?: string | null;
        timestamp?: NativeDate | null;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        role?: string | null;
        content?: string | null;
        timestamp?: NativeDate | null;
    }> & {
        role?: string | null;
        content?: string | null;
        timestamp?: NativeDate | null;
    }>;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    createdAt: NativeDate;
    messages: mongoose.Types.DocumentArray<{
        role?: string | null;
        content?: string | null;
        timestamp?: NativeDate | null;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        role?: string | null;
        content?: string | null;
        timestamp?: NativeDate | null;
    }> & {
        role?: string | null;
        content?: string | null;
        timestamp?: NativeDate | null;
    }>;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    createdAt: NativeDate;
    messages: mongoose.Types.DocumentArray<{
        role?: string | null;
        content?: string | null;
        timestamp?: NativeDate | null;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        role?: string | null;
        content?: string | null;
        timestamp?: NativeDate | null;
    }> & {
        role?: string | null;
        content?: string | null;
        timestamp?: NativeDate | null;
    }>;
}>, {}, mongoose.DefaultSchemaOptions> & mongoose.FlatRecord<{
    createdAt: NativeDate;
    messages: mongoose.Types.DocumentArray<{
        role?: string | null;
        content?: string | null;
        timestamp?: NativeDate | null;
    }, mongoose.Types.Subdocument<mongoose.mongo.BSON.ObjectId, any, {
        role?: string | null;
        content?: string | null;
        timestamp?: NativeDate | null;
    }> & {
        role?: string | null;
        content?: string | null;
        timestamp?: NativeDate | null;
    }>;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
//# sourceMappingURL=index.d.ts.map