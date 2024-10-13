import * as dotenv from 'dotenv';
dotenv.config();
export const cluster = process.env.DB_CLUSTER;
export const user = process.env.DB_USER;
export const passwd = process.env.DB_PASSWORD;
export const db = process.env.DB_NAME;
export const secret = process.env.JWT_SECRET;
export const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: 'immune-front-testin.firebaseapp.com',
    projectId: 'immune-front-testin',
    storageBucket: 'immune-front-testin.appspot.com',
    messagingSenderId: '250616408760',
    appId: '1:250616408760:web:1234253a4d935635bc224d',
};
console.log("DB_CLUSTER:", process.env.DB_CLUSTER);