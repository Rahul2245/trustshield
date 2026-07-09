export interface ThreatEvent {
    eventId: string;
    eventType: 'ThreatLoginEvent' | 'ThreatRegistrationEvent' | 'ThreatPostEvent' | string;
    userId: string;
    email: string;
    ipAddress: string;
    userAgent: string;
    timestamp: string;
    correlationId: string;
    requestId: string;
    metadata: {
        burstVelocity: number;
        targetRecipientRatio: number;
        uriHyperlinkDensity: number;
        sessionDwellDuration: number;
        payloadText: string;
    };
}
