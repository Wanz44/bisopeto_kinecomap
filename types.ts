
export enum UserType {
    CITIZEN = 'citizen',
    BUSINESS = 'business',
    COLLECTOR = 'collector',
    ADMIN = 'admin'
}

export type UserStatus = 'pending' | 'active' | 'suspended';
export type Theme = 'light' | 'dark';
export type Language = 'fr' | 'en';

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
    | 'manage_recovery'    // Nouveau: Encaissement cash
    | 'manage_marketplace' // Nouveau: Modération marketplace
    | 'manage_reports'     // Nouveau: Gestion des signalements SIG
    | 'manage_subscriptions' // Nouveau: Validation abonnements
    | 'system_settings';

export interface User {
    id?: string; 
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    type: UserType;
    status: UserStatus;
    address: string;
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
}

export interface WasteReport {
    id: string;
    reporterId: string;
    lat: number;
    lng: number;
    imageUrl: string;
    wasteType: string;
    urgency: 'low' | 'medium' | 'high';
    status: 'pending' | 'assigned' | 'resolved' | 'rejected';
    assignedTo?: string;
    date: string;
    comment: string;
    commune?: string;
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
    status: 'available' | 'pending_delivery' | 'sold';
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
