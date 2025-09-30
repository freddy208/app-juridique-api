"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
console.log('DIRECT_URL:', process.env.DIRECT_URL);
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: process.env.DIRECT_URL, // ⚡ Utiliser DIRECT_URL
        },
    },
});
async function main() {
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    const admin = await prisma.utilisateur.create({
        data: {
            prenom: 'Jean',
            nom: 'Dupont',
            email: 'kfreddypatient@gmail.com',
            motDePasse: hashedPassword,
            role: 'ADMIN',
        },
    });
    console.log('✅ Admin créé:', admin);
}
main()
    .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
})
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seen.js.map