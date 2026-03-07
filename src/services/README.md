# Optimized NFT Service

This directory contains the new optimized NFT detection system for Quiztal World.

## Overview

The OptimizedNFTService provides a cleaner, more efficient way to detect and fetch NFTs compared to the previous implementation. It includes:

- Better caching mechanisms
- Improved error handling with retry logic
- Type-safe TypeScript definitions
- Support for multiple IPFS gateways
- Configurable timeouts and retry limits

## Key Features

### 1. Caching
The service implements an in-memory cache with configurable expiration times to reduce redundant blockchain calls.

### 2. Retry Mechanisms
Failed metadata fetches are automatically retried with exponential backoff.

### 3. Concurrent Processing
NFT metadata is fetched concurrently for better performance.

### 4. Type Safety
Comprehensive TypeScript definitions ensure type safety throughout the system.

### 5. Configuration-Driven
NFT collections are defined in a separate configuration file for easy maintenance.

## Usage

The service is integrated into the Web3Service and automatically used when calling `getNFTsData()`.

```typescript
// The Web3Service now uses the optimized service internally
const web3Service = new Web3Service();
const nfts = await web3Service.getNFTsData();
```

## Files

- `OptimizedNFTService.ts` - Main service implementation
- `__tests__/OptimizedNFTService.test.ts` - Unit tests
- `OptimizedNFTService.demo.ts` - Demonstration script
- `../config/nftCollections.ts` - NFT collection configuration

## Benefits Over Previous Implementation

1. **Performance**: Better caching and concurrent processing
2. **Reliability**: Improved error handling and retry mechanisms
3. **Maintainability**: Cleaner separation of concerns
4. **Flexibility**: Configuration-driven approach
5. **Type Safety**: Comprehensive TypeScript definitions

## Testing

Run the demonstration script to see the service in action:

```bash
npx ts-node src/services/OptimizedNFTService.demo.ts
```