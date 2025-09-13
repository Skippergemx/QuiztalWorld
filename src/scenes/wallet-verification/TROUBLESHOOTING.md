# Wallet Verification System - Troubleshooting Guide

This document provides solutions to common TypeScript compilation errors and development issues encountered in the wallet verification system.

## Recent Fixes (September 2, 2025)

The following errors were recently resolved and should be referenced for similar issues:

1. **Unused MESSAGE_STYLES property**: Removed unused style configuration object
2. **Unused isMobile parameter**: Removed from `createButtonText` method
3. **Unused background variable**: Fixed in notification container creation
4. **Unused createStyledButton method**: Removed legacy button creation method
5. **Unused updateButtonBackground method**: Removed legacy styling method

**Prevention**: These issues occurred during refactoring when old methods and properties were left behind. Always clean up unused code immediately after refactoring.

## Common TypeScript Errors and Solutions

### 1. Unused Variables and Properties

**Error**: `'PropertyName' is declared but its value is never read.`

**Root Cause**: Variables, properties, or method parameters that are declared but not referenced in the code.

**Solution**: 
- Remove unused property declarations
- Remove unused method parameters
- Remove unused local variables
- Remove unused private methods

**Example Fixes**:
```typescript
// Remove unused style objects
// private readonly MESSAGE_STYLES = { ... }; // Remove if not used

// Remove unused parameters
// Instead of:
private createButtonText(config: EnhancedButtonConfig, isMobile: boolean): Phaser.GameObjects.Text {
// Use:
private createButtonText(config: EnhancedButtonConfig): Phaser.GameObjects.Text {

// Remove unused methods entirely
// private createStyledButton() { ... } // Remove if not used
```

### 2. Missing Method in Web3Service

**Error**: `Property 'getChainId' does not exist on type 'Web3Service'.`

**Root Cause**: Attempting to call a method that doesn't exist in the Web3Service class.

**Solution**: 
- Check the Web3Service implementation for available methods
- Use `getNetwork()` instead of `getChainId()` to get network information
- Parse the chainId from the network response: `parseInt(network.chainId, 16)`

**Example Fix**:
```typescript
// Instead of:
const chainId = await this.web3Service.getChainId();

// Use:
const network = await this.web3Service.getNetwork();
const chainIdNumber = parseInt(network.chainId, 16);
```

### 2. Unused Imports and Variables

**Error**: `'ImportName' is declared but its value is never read.`

**Root Cause**: Importing types, interfaces, or variables that are not used in the code.

**Solution**: 
- Remove unused imports from import statements
- Remove unused variable declarations
- Use underscore prefix for intentionally unused parameters: `_parameter`

**Prevention**:
- Regular code cleanup during development
- Use TypeScript strict mode
- Enable ESLint rules for unused variables

### 3. Missing Properties in Class Implementation

**Error**: `Property 'propertyName' does not exist on type 'ClassName'.`

**Root Cause**: Referencing properties that haven't been declared in the class.

**Solutions**:
- Add missing property declarations
- Initialize properties in constructor
- Make properties optional with `?` if appropriate
- Remove references to non-existent properties

**Example Fix**:
```typescript
// Add missing property
private activeMessageTimers: Phaser.Time.TimerEvent[] = [];

// Or initialize in constructor
constructor() {
    this.activeMessageTimers = [];
}
```

### 4. Undefined Type References

**Error**: `Cannot find name 'TypeName'.`

**Root Cause**: Using types that aren't imported or defined.

**Solutions**:
- Define the missing type locally
- Import the type from appropriate module
- Use built-in TypeScript types when available

**Example Fix**:
```typescript
// Define local interface
interface SimpleButtonConfig {
    text: string;
    fontSize: string;
    backgroundColor: string;
    color: string;
    padding: { x: number; y: number };
    cursor?: boolean;
}
```

### 5. Interface Implementation Mismatches

**Error**: `Class 'ClassName' incorrectly implements interface 'InterfaceName'.`

**Root Cause**: Class methods have different visibility than required by interface.

**Solutions**:
- Make methods public if required by interface
- Update interface to match implementation
- Ensure all required methods are implemented

**Example Fix**:
```typescript
// Interface requires public method
interface IWalletUIManager {
    createModernButton(config: EnhancedButtonConfig): Phaser.GameObjects.Container;
}

// Implementation must be public
export class WalletUIManager implements IWalletUIManager {
    public createModernButton(config: EnhancedButtonConfig): Phaser.GameObjects.Container {
        // Implementation
    }
}
```

### 6. Parameter Type Inference Issues

**Error**: `Parameter 'paramName' implicitly has an 'any' type.`

**Root Cause**: TypeScript cannot infer parameter type automatically.

**Solutions**:
- Add explicit type annotations
- Use generic constraints
- Enable stricter TypeScript settings

**Example Fix**:
```typescript
// Instead of:
array.forEach(item => item.destroy());

// Use:
array.forEach((item: Phaser.Time.TimerEvent) => item.destroy());
```

## Development Best Practices

### Code Organization

1. **Import Management**
   - Group imports by type (external libraries, internal modules, types)
   - Remove unused imports regularly
   - Use specific imports instead of wildcard imports

2. **Type Safety**
   - Define interfaces for complex objects
   - Use enums for constant values
   - Avoid `any` type whenever possible

3. **Error Handling**
   - Add try-catch blocks for async operations
   - Provide meaningful error messages
   - Log errors with context information

### File Structure Best Practices

```
src/scenes/wallet-verification/
├── types.ts                    # All TypeScript interfaces and types
├── WalletUIManager.ts         # UI components and interactions
├── WalletConnectionManager.ts # Blockchain and wallet logic
├── NFTDisplayManager.ts       # NFT display and management
├── MobileHandler.ts          # Mobile-specific functionality
├── README.md                 # System overview and usage
├── TROUBLESHOOTING.md        # This file
└── wallet-verification-ai-guide.json # AI development guide
```

### Debugging Strategies

1. **TypeScript Errors**
   - Read error messages carefully
   - Check import statements first
   - Verify interface implementations
   - Use TypeScript playground for testing

2. **Runtime Errors**
   - Add console.log statements for debugging
   - Check browser developer tools
   - Verify async operation completion
   - Test error scenarios

## Error Prevention Checklist

### Before Committing Code

- [ ] All TypeScript compilation errors resolved
- [ ] No unused imports or variables
- [ ] All interfaces properly implemented
- [ ] Error handling added for async operations
- [ ] Console errors checked in development
- [ ] Mobile compatibility tested

### Development Workflow

1. **Start Development**
   - Check existing code for patterns
   - Review interfaces before implementation
   - Plan error handling strategy

2. **During Development**
   - Compile frequently to catch errors early
   - Test features immediately after implementation
   - Keep imports clean and organized

3. **Before Completion**
   - Run full TypeScript compilation
   - Test all user flows
   - Review error scenarios
   - Update documentation if needed

## Common Fix Patterns

### Remove Unused Items
```typescript
// Remove from imports
import { UsedType, /* UnusedType */ } from './types';

// Remove unused variables
// const unusedVariable = someValue; // Remove this line

// Remove unused methods
// private unusedMethod() { } // Remove this method
```

### Add Missing Properties
```typescript
// Add to class
private readonly REQUIRED_STYLES = {
    // Configuration object
};

private requiredArray: Type[] = [];
```

### Fix Interface Implementation
```typescript
// Make methods public as required by interface
public methodRequiredByInterface(): ReturnType {
    // Implementation
}
```

### Fix Type Issues
```typescript
// Add explicit types
private handleCallback(callback: (param: ParamType) => void): void {
    // Implementation
}

// Use proper type assertions
const element = container.list[0] as Phaser.GameObjects.Text;
```

## Getting Help

When encountering new errors:

1. **Read the error message completely**
2. **Check this troubleshooting guide first**
3. **Look for similar patterns in existing code**
4. **Check TypeScript documentation**
5. **Test fixes in isolation**
6. **Document new patterns for future reference**

## Updates and Maintenance

This troubleshooting guide should be updated when:
- New error patterns are discovered
- Solutions are improved or simplified
- New development practices are established
- Dependencies are updated or changed

Remember: Prevention is better than fixing. Following TypeScript best practices and maintaining clean code reduces the likelihood of errors.