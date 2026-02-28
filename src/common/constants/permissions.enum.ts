import { Role } from './roles.enum';

export enum Permission {
  // Read permissions
  READ_PRODUCTS = 'read:products',
  READ_CATEGORIES = 'read:categories',
  READ_USERS = 'read:users',
  
  // Write permissions
  CREATE_PRODUCTS = 'create:products',
  UPDATE_PRODUCTS = 'update:products',
  DELETE_PRODUCTS = 'delete:products',
  
  CREATE_CATEGORIES = 'create:categories',
  UPDATE_CATEGORIES = 'update:categories',
  DELETE_CATEGORIES = 'delete:categories',
  
  CREATE_USERS = 'create:users',
  UPDATE_USERS = 'update:users',
  DELETE_USERS = 'delete:users',
  
  // Future permissions
  CREATE_ORDERS = 'create:orders',
  READ_ORDERS = 'read:orders',
}

// Role to permissions mapping
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  [Role.CLIENT]: [
    Permission.READ_PRODUCTS,
    Permission.READ_CATEGORIES,
    Permission.CREATE_ORDERS,
    Permission.READ_ORDERS,
  ],
  [Role.ADMIN]: [
    // Read permissions
    Permission.READ_PRODUCTS,
    Permission.READ_CATEGORIES,
    Permission.READ_USERS,
    Permission.READ_ORDERS,
    // Write permissions
    Permission.CREATE_PRODUCTS,
    Permission.UPDATE_PRODUCTS,
    Permission.DELETE_PRODUCTS,
    Permission.CREATE_CATEGORIES,
    Permission.UPDATE_CATEGORIES,
    Permission.DELETE_CATEGORIES,
    Permission.CREATE_USERS,
    Permission.UPDATE_USERS,
    Permission.DELETE_USERS,
    Permission.CREATE_ORDERS,
  ],
};