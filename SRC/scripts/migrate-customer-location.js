import fs from 'node:fs/promises';
import {q,transaction,close} from '../backend/src/db.js';
try{const source=await fs.readFile(new URL('../database/009_customer_location.sql',import.meta.url),'utf8');await transaction(null,t=>q(source,{},t));console.log('Customer location migration complete (existing orders preserved).');}finally{await close();}
