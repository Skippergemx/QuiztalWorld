/**
 * Types and interfaces for the modular WalletVerificationScene components
 * These types ensure type safety and clear contracts between components
 */

import Phaser from "phaser";
import { NFTData } from '../../types/nft';

// =============================================================================
// Core Scene State Types
// =============================================================================

export interface PlayerData {
    uid: string;
    email?: string;
    displayName?: string;
    walletAddress?: string;
}

export interface SceneConfig {
    width: number;
    height: number;
    isMobile: boolean;
}

// =============================================================================
// UI Component Types
// =============================================================================

export interface ButtonConfig {
    text: string;
    fontSize: string;
    backgroundColor: string;
    color: string;
    padding: { x: number; y: number };
    interactive?: boolean;
    cursor?: boolean;
}

export interface MessageConfig {
    text: string;
    fontSize: string;
    color: string;
    backgroundColor?: string;
    padding?: { x: number; y: number };
    duration?: number;
}

export interface GradientConfig {
    color1: number;
    color2: number;
    alpha?: number;
}

// =============================================================================
// Wallet Connection Types
// =============================================================================

export interface WalletConnectionResult {
    success: boolean;
    message: string;
    address?: string;
}

export interface WalletBindingResult {
    success: boolean;
    message: string;
    needsConfirmation?: boolean;
    existingWallet?: string;
    newWallet?: string;
}

export interface NFTVerificationResult {
    hasNFTs: boolean;
    nfts?: NFTData[];
    error?: string;
}

// =============================================================================
// NFT Display Types
// =============================================================================

export interface NFTGridConfig {
    itemsPerRow: number;
    spacing: number;
    cardWidth: number;
    cardHeight: number;
    topMargin: number;
    bottomMargin: number;
}

export interface ScrollConfig {
    padding: number;
    headerHeight: number;
    viewportHeight: number;
    scrollSpeed: number;
    maxHeight?: number; // Optional property for dynamic height calculation
}

export interface NFTCardDimensions {
    x: number;
    y: number;
    width: number;
    height: number;
}

// =============================================================================
// Mobile Handler Types
// =============================================================================

export interface MobileDetectionResult {
    isMobile: boolean;
    isAndroid?: boolean;
    isIOS?: boolean;
    hasTouch?: boolean;
}

export interface MobileUIConfig {
    showDesktopMessage: boolean;
    showContinueButton: boolean;
    messageText: string;
    buttonText: string;
}

// =============================================================================
// Enhanced Manager Interface Contracts
// =============================================================================

export interface IWalletUIManager {
    // Core UI Creation
    createWalletUI(): void;
    createNoWalletUI(): void;
    createConnectButton(config?: EnhancedButtonConfig): Phaser.GameObjects.Container;
    
    // Enhanced Messaging
    showNotification(config: NotificationConfig): void;
    showSuccessMessage(message: string, options?: Partial<NotificationConfig>): void;
    showErrorMessage(message: string, options?: Partial<NotificationConfig>): void;
    showWarningMessage(message: string, options?: Partial<NotificationConfig>): void;
    showInfoMessage(message: string, options?: Partial<NotificationConfig>): void;
    
    // Progress and Loading
    showLoadingOverlay(config: LoadingOverlayConfig): void;
    hideLoadingOverlay(): void;
    updateProgress(stage: LoadingStage, progress: number, message: string): void;
    
    // Form and Input
    createInputField(config: InputFieldConfig): Phaser.GameObjects.Container;
    validateForm(formState: FormState): boolean;
    
    // Enhanced UI Elements
    createProgressBar(config: ProgressBarConfig): Phaser.GameObjects.Container;
    createModernButton(config: EnhancedButtonConfig): Phaser.GameObjects.Container;
    showContinueButton(config?: EnhancedButtonConfig): void;
    
    // Visual Effects
    drawGradient(config: GradientConfig): void;
    applyGlassMorphism(target: Phaser.GameObjects.Graphics, config: GlassMorphismConfig): void;
    applyNeumorphism(target: Phaser.GameObjects.Graphics, config: NeumorphismConfig): void;
    
    // Interaction and Accessibility
    addTouchFeedback(button: Phaser.GameObjects.GameObject, config?: FeedbackConfig): void;
    addAccessibilitySupport(element: Phaser.GameObjects.GameObject, config: AccessibilityConfig): void;
    enableKeyboardNavigation(): void;
    
    // State Management
    getUIState(): WalletUIState;
    updateUIState(updates: Partial<WalletUIState>): void;
    
    // Cleanup
    cleanup(): void;
}

export interface IMobileHandler {
    detectMobile(): MobileDetectionResult;
    createMobileUI(config: MobileUIConfig): void;
    shouldShowMobileUI(): boolean;
    cleanup(): void;
}

export interface IWalletConnectionManager {
    connectWallet(): Promise<WalletConnectionResult>;
    bindWallet(address: string): Promise<WalletBindingResult>;
    checkExistingWallet(playerData: PlayerData): Promise<string | null>;
    showWalletChangeConfirmation(oldWallet: string, newWallet: string): Promise<boolean>;
    verifyNFTs(): Promise<NFTVerificationResult>;
    cleanup(): void;
}

export interface INFTDisplayManager {
    displayNFTs(nfts: NFTData[]): Promise<void>;
    createNFTGrid(nfts: NFTData[], config: NFTGridConfig, scrollConfig: ScrollConfig): Promise<Phaser.GameObjects.Container>;
    createNFTCard(nft: NFTData, dimensions: NFTCardDimensions): Phaser.GameObjects.Container;
    setupScrolling(container: Phaser.GameObjects.Container, config: ScrollConfig): void;
    showNoNFTMessage(): void;
    cleanup(): void;
}

// =============================================================================
// Event Types
// =============================================================================

export interface WalletVerificationEvents {
    WALLET_CONNECTED: 'walletConnected';
    WALLET_DISCONNECTED: 'walletDisconnected';
    NFTS_VERIFIED: 'nftsVerified';
    ERROR_OCCURRED: 'errorOccurred';
    SCENE_READY: 'sceneReady';
}

export interface WalletEventData {
    address?: string;
    nfts?: NFTData[];
    error?: string;
    message?: string;
    stage?: LoadingStage;
    progress?: number;
    timestamp?: number;
    metadata?: Record<string, any>;
    userAction?: string;
}

// =============================================================================
// Configuration Types
// =============================================================================

export interface WalletVerificationConfig {
    // Core Features
    enableMobileSupport: boolean;
    showNFTDetails: boolean;
    autoCloseNFTViewer: boolean;
    requireWalletBinding: boolean;
    allowSkipWallet: boolean;
    debugMode: boolean;
    
    // Enhanced UX Features
    enableProgressiveLoading: boolean;
    showDetailedProgress: boolean;
    enableHapticFeedback: boolean;
    enableSoundFeedback: boolean;
    autoSaveProgress: boolean;
    
    // Visual Enhancements
    enableGlassMorphism: boolean;
    enableNeumorphism: boolean;
    enableParticleEffects: boolean;
    enableSmoothAnimations: boolean;
    reducedMotion: boolean;
    
    // Accessibility
    enableScreenReader: boolean;
    enableKeyboardNavigation: boolean;
    enableHighContrast: boolean;
    fontSize: 'small' | 'medium' | 'large';
    
    // Performance
    enableLazyLoading: boolean;
    maxConcurrentNFTLoads: number;
    cacheNFTImages: boolean;
    optimizeForLowEnd: boolean;
    
    // Advanced Features
    enableBiometricAuth: boolean;
    enableQRCodeScanning: boolean;
    enableWalletConnect: boolean;
    enableMultiChainSupport: boolean;
    
    // Theming
    theme: 'auto' | 'light' | 'dark' | 'system';
    accentColor?: string;
    customTheme?: any;
}

// =============================================================================
// Error Types
// =============================================================================

export enum WalletErrorType {
    WALLET_NOT_INSTALLED = 'WALLET_NOT_INSTALLED',
    WALLET_CONNECTION_FAILED = 'WALLET_CONNECTION_FAILED',
    NETWORK_MISMATCH = 'NETWORK_MISMATCH',
    NFT_VERIFICATION_FAILED = 'NFT_VERIFICATION_FAILED',
    FIRESTORE_ERROR = 'FIRESTORE_ERROR',
    PLAYER_DATA_NOT_FOUND = 'PLAYER_DATA_NOT_FOUND'
}

export interface WalletError {
    type: WalletErrorType;
    message: string;
    details?: any;
    recoverable: boolean;
}

// =============================================================================
// Enhanced Component State Types
// =============================================================================

export interface ComponentState {
    initialized: boolean;
    visible: boolean;
    interactive: boolean;
    loading: boolean;
}

// Enhanced UI States with Progressive Loading
export enum LoadingStage {
    IDLE = 'idle',
    INITIALIZING = 'initializing',
    CONNECTING = 'connecting',
    AUTHENTICATING = 'authenticating',
    VERIFYING = 'verifying',
    LOADING_NFTS = 'loading_nfts',
    COMPLETE = 'complete',
    ERROR = 'error'
}

export interface ProgressState {
    stage: LoadingStage;
    progress: number; // 0-100
    message: string;
    subMessage?: string;
    canCancel: boolean;
    estimatedTime?: number; // seconds
}

export interface WalletUIState extends ComponentState {
    walletConnected: boolean;
    showingNFTs: boolean;
    buttonText: string;
    progressState: ProgressState;
    showProgressBar: boolean;
    accessibilityEnabled: boolean;
    touchInteractionEnabled: boolean;
    keyboardNavigationActive: boolean;
}

export interface NFTDisplayState extends ComponentState {
    nftsLoaded: number;
    totalNFTs: number;
    scrollPosition: number;
    selectedNFT?: NFTData;
    gridLayout: 'compact' | 'detailed' | 'list';
    sortOrder: 'date' | 'rarity' | 'name';
    filterActive: boolean;
    loadingMoreNFTs: boolean;
}

export interface MobileHandlerState extends ComponentState {
    mobileDetected: boolean;
    showingMobileUI: boolean;
    touchGesturesEnabled: boolean;
    hapticFeedbackEnabled: boolean;
    deviceOrientation: 'portrait' | 'landscape';
}

// =============================================================================
// Enhanced UI Configuration Types
// =============================================================================

export interface AnimationConfig {
    duration: number;
    easing: string;
    delay?: number;
    repeat?: number;
    yoyo?: boolean;
}

export interface ResponsiveConfig<T> {
    mobile: T;
    tablet?: T;
    desktop: T;
}

export interface AccessibilityConfig {
    ariaLabel?: string;
    ariaDescription?: string;
    tabIndex?: number;
    role?: string;
    keyboardShortcut?: string;
    screenReaderText?: string;
}

export interface InteractionConfig {
    hover?: AnimationConfig;
    click?: AnimationConfig;
    focus?: AnimationConfig;
    disabled?: boolean;
    hapticFeedback?: boolean;
    soundEffect?: string;
}

export interface EnhancedButtonConfig extends ButtonConfig {
    variant: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost';
    size: 'sm' | 'md' | 'lg' | 'xl';
    fullWidth?: boolean;
    icon?: string;
    iconPosition?: 'left' | 'right' | 'top' | 'bottom';
    loading?: boolean;
    disabled?: boolean;
    animation?: InteractionConfig;
    accessibility?: AccessibilityConfig;
    responsive?: ResponsiveConfig<Partial<ButtonConfig>>;
}

// =============================================================================
// Loading and Progress Types
// =============================================================================

export interface LoadingSpinnerConfig {
    type: 'dots' | 'spinner' | 'pulse' | 'bars' | 'custom';
    size: number;
    color: string;
    speed: number;
    customAnimation?: string;
}

export interface ProgressBarConfig {
    width: number;
    height: number;
    backgroundColor: string;
    fillColor: string;
    borderRadius: number;
    showPercentage: boolean;
    animated: boolean;
    glowEffect: boolean;
}

export interface LoadingOverlayConfig {
    background: string;
    opacity: number;
    spinner: LoadingSpinnerConfig;
    progressBar?: ProgressBarConfig;
    message: MessageConfig;
    cancelButton?: EnhancedButtonConfig;
    blur: boolean;
}

// =============================================================================
// Form and Input Types
// =============================================================================

export interface ValidationRule {
    type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
    value?: any;
    message: string;
    validator?: (value: string) => boolean;
}

export interface InputFieldConfig {
    type: 'text' | 'password' | 'email' | 'number' | 'wallet';
    placeholder: string;
    label?: string;
    helpText?: string;
    validation: ValidationRule[];
    appearance: 'outline' | 'filled' | 'standard';
    size: 'sm' | 'md' | 'lg';
    icon?: string;
    maxLength?: number;
    autoComplete?: string;
    accessibility?: AccessibilityConfig;
}

export interface FormState {
    isValid: boolean;
    isSubmitting: boolean;
    errors: Record<string, string>;
    touched: Record<string, boolean>;
    values: Record<string, any>;
}

// =============================================================================
// Notification and Feedback Types
// =============================================================================

export enum NotificationType {
    SUCCESS = 'success',
    ERROR = 'error',
    WARNING = 'warning',
    INFO = 'info',
    LOADING = 'loading'
}

export interface NotificationConfig extends MessageConfig {
    type: NotificationType;
    title?: string;
    icon?: string;
    position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'center';
    dismissible: boolean;
    autoClose: boolean;
    actions?: EnhancedButtonConfig[];
    animation: {
        enter: AnimationConfig;
        exit: AnimationConfig;
    };
}

export interface FeedbackConfig {
    haptic: boolean;
    sound: boolean;
    visual: boolean;
    duration: number;
}

// =============================================================================
// Theme and Styling Enhancement Types
// =============================================================================

export interface GlassMorphismConfig {
    blur: number;
    opacity: number;
    borderOpacity: number;
    gradient: string[];
    border: {
        width: number;
        color: string;
    };
}

export interface NeumorphismConfig {
    lightShadow: string;
    darkShadow: string;
    background: string;
    borderRadius: number;
    inset: boolean;
}

export interface ModernButtonStyle {
    background: GradientConfig | string;
    border?: {
        width: number;
        color: string;
        style: 'solid' | 'dashed' | 'dotted';
    };
    shadow?: string;
    glassMorphism?: GlassMorphismConfig;
    neumorphism?: NeumorphismConfig;
    rippleEffect: boolean;
    glowEffect: boolean;
}