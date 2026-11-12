/** Food database: free sources (Open Food Facts, USDA FoodData Central) behind one service. */
export * from './types';
export { foods, createFoodService, type BarcodeResult, type FoodService } from './service';
export { macrosForGrams, macrosForServings, proteinDensity } from './nutrients';
export { foodToScannedItem, displayName } from './toScan';
