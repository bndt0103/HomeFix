import { transaction, close } from '../backend/src/db.js';
import { applyServiceCatalog } from './service-catalog.js';
try {
  console.log('Service catalog migration:', await transaction(null, applyServiceCatalog));
} finally {
  await close();
}
