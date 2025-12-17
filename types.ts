
export enum UserType {
    CITIZEN = 'citizen',
    BUSINESS = 'business',
    COLLECTOR = 'collector',
    ADMIN = 'admin'
}

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
    | 'system_settings';

export interface SystemSettings {
    maintenanceMode: boolean;
    supportEmail: string;
    appVersion: string;
    force2FA: boolean;
    sessionTimeout: number;
    passwordPolicy: 'standard' | 'strong' | 'strict';
    marketplaceCommission: number; // Pourcentage (ex: 0.05 pour 5%)
}

export interface SubscriptionPlan {
    id: string;
    name: string;
    priceUSD: number;
    schedule: string;
    features: string[];
    popular?: boolean;
    isVariable?: boolean;
}

export interface User {
    id?: string; 
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    type: UserType;
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
    housingType?: string;
    permissions?: UserPermission[];
}

export interface Collector {
    id: number;
    name: string;
    lat: number;
    lng: number;
    status: 'active' | 'inactive';
    vehicle: string;
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
    correctIndex: number;
}

export interface Course {
    id: string;
    title: string;
    description: string;
    progress: number;
    icon: string;
    color: string;
    videoUrl?: string; 
    status?: 'draft' | 'published';
    author?: string;
    quiz?: QuizQuestion[];
}

export interface Badge {
    id: string;
    title: string;
    description: string;
    icon: string;
    earned: boolean;
}

export interface NotificationItem {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'alert';
    time: string;
    read: boolean;
    targetUserId?: string | 'ADMIN' | 'ALL'; 
}

export type VehicleType = 'moto' | 'tricycle' | 'pickup' | 'camion' | 'chariot';

export interface Vehicle {
    id: string;
    name: string;
    type: VehicleType;
    plateNumber: string;
    gpsId: string;
    status: 'active' | 'maintenance' | 'stopped';
    batteryLevel: number;
    signalStrength: number;
    lat: number;
    lng: number;
    heading: number; // Direction en degrés (0-360)
    driverId?: string;
    lastUpdate: string;
}

export interface MarketplaceItem {
    id: string;
    sellerId: string;
    sellerName: string;
    title: string;
    category: 'electronics' | 'metal' | 'plastic' | 'other';
    description: string;
    weight: number; // kg
    price: number; // FC
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
    website?: string;
    activeCampaigns: number;
    totalBudget: number;
    logo: string;
    status: 'active' | 'inactive';
}

export enum AppView {
    LANDING = 'LANDING',
    ONBOARDING = 'ONBOARDING',
    DASHBOARD = 'DASHBOARD',
    MAP = 'MAP',
    ACADEMY = 'ACADEMY',
    MARKETPLACE = 'MARKETPLACE',
    BADGES = 'BADGES',
    PROFILE = 'PROFILE',
    NOTIFICATIONS = 'NOTIFICATIONS',
    SUBSCRIPTION = 'SUBSCRIPTION',
    PLANNING = 'PLANNING',
    SETTINGS = 'SETTINGS',
    ADMIN_USERS = 'ADMIN_USERS',
    ADMIN_ADS = 'ADMIN_ADS',
    ADMIN_SUBSCRIPTIONS = 'ADMIN_SUBSCRIPTIONS',
    ADMIN_VEHICLES = 'ADMIN_VEHICLES',
    ADMIN_ACADEMY = 'ADMIN_ACADEMY',
    ADMIN_PERMISSIONS = 'ADMIN_PERMISSIONS',
    COLLECTOR_JOBS = 'COLLECTOR_JOBS'
}
