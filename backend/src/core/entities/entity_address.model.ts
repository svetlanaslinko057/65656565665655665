/**
 * Entity Address Model
 * 
 * Связь между entity и конкретными адресами
 */
import mongoose, { Schema, Document } from 'mongoose';

export type AddressRole = 
  | 'hot'       // Hot wallet
  | 'cold'      // Cold storage
  | 'deposit'   // Deposit contract
  | 'treasury'  // Treasury
  | 'contract'  // Smart contract
  | 'unknown';  // Не определено

export interface IEntityAddress extends Document {
  entityId: string;          // Reference to Entity
  chain: string;             // 'ethereum', 'polygon', etc.
  address: string;           // Wallet/contract address (lowercase)
  
  role: AddressRole;         // Address role
  
  // Activity
  firstSeen: Date;
  lastSeen: Date;
  lastTxHash?: string;       // Last transaction hash
  
  // Attribution confidence (internal, not shown as quality)
  labelConfidence: number;   // 0-100, internal use only
  
  // Metadata
  tags?: string[];           // ['verified', 'high_volume', etc.]
  notes?: string;            // Admin notes
  
  createdAt: Date;
  updatedAt: Date;
}

const EntityAddressSchema = new Schema<IEntityAddress>(
  {
    entityId: { type: String, required: true, index: true },
    chain: { type: String, required: true, index: true },
    address: { type: String, required: true, lowercase: true, index: true },
    
    role: { 
      type: String, 
      enum: ['hot', 'cold', 'deposit', 'treasury', 'contract', 'unknown'],
      default: 'unknown'
    },
    
    firstSeen: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
    lastTxHash: { type: String },
    
    labelConfidence: { type: Number, default: 50, min: 0, max: 100 },
    
    tags: [{ type: String }],
    notes: { type: String },
  },
  { 
    timestamps: true,
    collection: 'entity_addresses'
  }
);

// Compound index for unique address per entity per chain
EntityAddressSchema.index({ entityId: 1, chain: 1, address: 1 }, { unique: true });
EntityAddressSchema.index({ address: 1, chain: 1 });

export const EntityAddressModel = mongoose.model<IEntityAddress>('EntityAddress', EntityAddressSchema);
