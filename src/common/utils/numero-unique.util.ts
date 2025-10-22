import { PrismaClient } from '@prisma/client';
//const prisma = new PrismaClient();

// Type pour le client de transaction, plus propre à utiliser
type Tx = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class NumeroUniqueUtil {
  /**
   * Génère un numéro de dossier unique de manière atomique.
   * @param tx - Le client de transaction Prisma pour garantir l'atomicité avec l'opération de création.
   * @param type - Le type de dossier (ex: 'SINISTRE_CORPOREL').
   * @returns Le numéro de dossier généré.
   */
  static async generateNumeroDossier(tx: Tx, type: string): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const prefix = this.getPrefixByType(type);
    const counterKey = `${prefix}${year}${month}${day}`;

    // upsert est une opération atomique : il met à jour si la clé existe, sinon il la crée.
    // L'incrémentation { increment: 1 } est aussi atomique au niveau de la base de données.
    const counterRecord = await tx.counter.upsert({
      where: { key: counterKey },
      update: {
        value: {
          increment: 1,
        },
      },
      create: {
        key: counterKey,
        value: 1,
      },
    });

    const counter = counterRecord.value.toString().padStart(4, '0');
    return `${prefix}${year}${month}${day}-${counter}`;
  }

  /**
   * Génère un numéro de facture unique de manière atomique.
   * @param tx - Le client de transaction Prisma.
   * @returns Le numéro de facture généré.
   */
  static async generateNumeroFacture(tx: Tx): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const counterKey = `F${year}${month}`;
    const counterRecord = await tx.counter.upsert({
      where: { key: counterKey },
      update: {
        value: {
          increment: 1,
        },
      },
      create: {
        key: counterKey,
        value: 1,
      },
    });

    const counter = counterRecord.value.toString().padStart(4, '0');
    return `F${year}${month}-${counter}`;
  }

  private static getPrefixByType(type: string): string {
    const prefixes: Record<string, string> = {
      SINISTRE_CORPOREL: 'SC',
      SINISTRE_MATERIEL: 'SM',
      SINISTRE_MORTEL: 'SMO',
      IMMOBILIER: 'IM',
      SPORT: 'SP',
      CONTRAT: 'CT',
      CONTENTIEUX: 'CO',
      AUTRE: 'AU',
    };
    return prefixes[type] || 'DO';
  }
}
