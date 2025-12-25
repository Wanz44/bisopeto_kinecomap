
export enum UserType {
    CITIZEN = 'citizen',
    BUSINESS = 'business',
    COLLECTOR = 'collector',
    ADMIN = 'admin'
}

export type UserStatus = 'pending' | 'active' | 'suspended';
export type Theme = 'light' | 'dark';
export type Language = 'fr' | 'en' | 'ln'; 

export type UserPermission = 
    | 'manage_users' 
    | 'validate_docs' 
    | 'view_finance' 
    | 'manage_ads' 
    | 'export_data' 
    | 'manage_fleet'
    | 'manage_academy'
    | 'manage_communications'
    | 'manage_pos'
    | 'manage_recovery'    
    | 'manage_marketplace' 
    | 'manage_reports'     
    | 'manage_subscriptions' 
    | 'system_settings'
    | 'view_audit_logs';

export interface AuditLog {
    id: string;
    userId: string;
    action: string;
    entity: string;
    entityId: string;
    timestamp: string;
    metadata?: any;
}

export interface User {
    id?: string; 
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    type: UserType;
    status: UserStatus;
    address: string;
    neighborhood?: string; // Quartier
    points: number;
    collections: number;
    badges: number;
    subscription: 'standard' | 'plus' | 'premium' | 'special';
    companyName?: string;
    companyPhone?: string;
    sector?: string;
    vehicleType?: string;
    zone?: string;
    commune?: string;
    housingType?: string;
    permissions?: UserPermission[];
    totalTonnage?: number;
    co2Saved?: number;
    recyclingRate?: number;
    avatarUrl?: string;
    emailConsent?: boolean; // Consentement communication
}

export interface WasteReport {
    id: string;
    reporterId: string;
    lat: number;
    lng: number;
    imageUrl: string;
    proofUrl?: string; // Photo "Après" prise par le collecteur
    wasteType: string;
    urgency: 'low' | 'medium' | 'high';
    status: 'pending' | 'assigned' | 'resolved' | 'rejected' | 'disputed';
    assignedTo?: string;
    date: string;
    comment: string;
    commune?: string;
}

export interface MarketplaceItem {
    id: string;
    sellerId: string;
    sellerName: string;
    title: string;
    category: 'electronics' | 'metal' | 'plastic' | 'other';
    description: string;
    weight: number;
    price: number;
    imageUrl: string;
    date: string;
    status: 'available' | 'pending_delivery' | 'sold' | 'disputed';
    buyerId?: string;
}

export interface EcoVoucher {
    id: string;
    title: string;
    partnerName: string;
    discountValue: string;
    pointCost: number;
    expiryDate: string;
    code: string;
    category: 'food' | 'service' | 'energy';
}

export enum AppView {
    LANDING = 'LANDING',
    ONBOARDING = 'ONBOARDING',
    DASHBOARD = 'DASHBOARD',
    MAP = 'MAP',
    ACADEMY = 'ACADEMY',
    MARKETPLACE = 'MARKETPLACE',
    PROFILE = 'PROFILE',
    NOTIFICATIONS = 'NOTIFICATIONS',
    SUBSCRIPTION = 'SUBSCRIPTION',
    PLANNING = 'PLANNING',
    SETTINGS = 'SETTINGS',
    REPORTING = 'REPORTING',
    ADMIN_USERS = 'ADMIN_USERS',
    ADMIN_ADS = 'ADMIN_ADS',
    ADMIN_SUBSCRIPTIONS = 'ADMIN_SUBSCRIPTIONS',
    ADMIN_VEHICLES = 'ADMIN_VEHICLES',
    ADMIN_ACADEMY = 'ADMIN_ACADEMY',
    ADMIN_PERMISSIONS = 'ADMIN_PERMISSIONS',
    ADMIN_REPORTS = 'ADMIN_REPORTS',
    ADMIN_MARKETPLACE = 'ADMIN_MARKETPLACE',
    ADMIN_RECOVERY = 'ADMIN_RECOVERY',
    ADMIN_AUDIT = 'ADMIN_AUDIT',
    COLLECTOR_JOBS = 'COLLECTOR_JOBS'
}

export interface Payment {
    id: string;
    userId: string;
    userName: string;
    amountFC: number;
    currency: 'FC' | 'USD';
    method: 'cash' | 'mobile_money' | 'card';
    period: string;
    collectorId: string;
    collectorName: string;
    createdAt: string;
    qrCodeData: string;
    status: 'escrow' | 'released' | 'refunded';
}

export interface SystemSettings {
    maintenanceMode: boolean;
    supportEmail: string;
    appVersion: string;
    force2FA: boolean;
    sessionTimeout: number;
    passwordPolicy: string;
    marketplaceCommission: number;
    exchangeRate: number;
    logoUrl?: string;
}

export interface GlobalImpact {
    digitalization: number;
    recyclingRate: number;
    education: number;
    realTimeCollection: number;
}

export interface DatabaseHealth {
    status: 'healthy' | 'degraded' | 'critical';
    totalSizeKB: number;
    tables: {
        name: string;
        count: number;
        status: 'ok' | 'error';
        sizeKB: number;
    }[];
    supabaseConnected: boolean;
    lastAudit: string;
}

export interface Vehicle {
    id: string;
    name: string;
    type: 'moto' | 'tricycle' | 'pickup' | 'camion' | 'chariot';
    plateNumber: string;
    status: 'active' | 'maintenance' | 'stopped';
    batteryLevel: number;
    lat: number;
    lng: number;
    driverId?: string;
    signalStrength: number;
    gpsId?: string;
    lastUpdate?: string;
    heading?: number;
}

export interface ChatMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    timestamp: Date;
}

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
}

export interface Course {
    id: string;
    title: string;
    description: string;
    progress: number;
    icon: string;
    color: string;
    videoUrl?: string;
}

export interface AdCampaign {
    id: string;
    title: string;
    partner: string;
    status: 'active' | 'paused' | 'ended';
    views: number;
    clicks: number;
    budget: number;
    spent: number;
    startDate: string;
    endDate: string;
    image: string;
}

export interface Partner {
    id: string;
    name: string;
    industry: string;
    contactName: string;
    email: string;
    phone: string;
    activeCampaigns: number;
    totalBudget: number;
    logo: string;
    status: 'active' | 'inactive';
}

export interface NotificationItem {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'alert';
    time: string;
    date?: string; 
    read: boolean;
    targetUserId: string;
}

export interface Collector {
    id: string;
    name: string;
    phone: string;
    zone: string;
    status: 'active' | 'inactive';
}

export interface SubscriptionPlan {
    id: 'standard' | 'plus' | 'premium' | 'special';
    name: string;
    priceUSD: number;
    popular?: boolean;
    schedule: string;
    features: string[];
    isVariable?: boolean;
}
