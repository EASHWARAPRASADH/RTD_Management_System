import { 
  collection, doc, setDoc, deleteDoc, onSnapshot, getDocs, writeBatch
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { 
  Customer, Product, Bill, PaymentRecord, AuditLog, ExcelImportLog, ShopSettings 
} from "../types";

export class FirebaseSyncService {
  /**
   * Seeds default shop settings to Firestore if empty, but leaves data collections clean (0 items).
   */
  static async initializeSeedData(data: {
    shopSettings: ShopSettings;
  }) {
    try {
      const settingsSnap = await getDocs(collection(db, "shop_settings"));
      if (settingsSnap.empty) {
        await setDoc(doc(db, "shop_settings", "general"), data.shopSettings);
      }
    } catch (err) {
      console.warn("Firestore settings init note:", err);
    }
  }

  /**
   * Real-time listeners for Firestore data updates
   */
  static subscribeAll(callbacks: {
    onCustomers?: (customers: Customer[]) => void;
    onProducts?: (products: Product[]) => void;
    onBills?: (bills: Bill[]) => void;
    onPayments?: (payments: PaymentRecord[]) => void;
    onShopSettings?: (settings: ShopSettings) => void;
    onAuditLogs?: (logs: AuditLog[]) => void;
  }) {
    const unsubscribers: (() => void)[] = [];

    if (callbacks.onCustomers) {
      const unsub = onSnapshot(collection(db, "customers"), (snapshot) => {
        const list = snapshot.docs.map(d => d.data() as Customer);
        callbacks.onCustomers?.(list);
      }, (err) => console.warn("Firestore customer snapshot:", err));
      unsubscribers.push(unsub);
    }

    if (callbacks.onProducts) {
      const unsub = onSnapshot(collection(db, "products"), (snapshot) => {
        const list = snapshot.docs.map(d => d.data() as Product);
        callbacks.onProducts?.(list);
      }, (err) => console.warn("Firestore product snapshot:", err));
      unsubscribers.push(unsub);
    }

    if (callbacks.onBills) {
      const unsub = onSnapshot(collection(db, "bills"), (snapshot) => {
        const list = snapshot.docs.map(d => d.data() as Bill);
        // Sort newest first
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callbacks.onBills?.(list);
      }, (err) => console.warn("Firestore bill snapshot:", err));
      unsubscribers.push(unsub);
    }

    if (callbacks.onPayments) {
      const unsub = onSnapshot(collection(db, "payments"), (snapshot) => {
        const list = snapshot.docs.map(d => d.data() as PaymentRecord);
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callbacks.onPayments?.(list);
      }, (err) => console.warn("Firestore payment snapshot:", err));
      unsubscribers.push(unsub);
    }

    if (callbacks.onShopSettings) {
      const unsub = onSnapshot(doc(db, "shop_settings", "general"), (docSnap) => {
        if (docSnap.exists()) {
          callbacks.onShopSettings?.(docSnap.data() as ShopSettings);
        }
      }, (err) => console.warn("Firestore settings snapshot:", err));
      unsubscribers.push(unsub);
    }

    if (callbacks.onAuditLogs) {
      const unsub = onSnapshot(collection(db, "audit_logs"), (snapshot) => {
        const list = snapshot.docs.map(d => d.data() as AuditLog);
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        callbacks.onAuditLogs?.(list);
      }, (err) => console.warn("Firestore audit log snapshot:", err));
      unsubscribers.push(unsub);
    }

    return () => unsubscribers.forEach(u => u());
  }

  // Cloud document operations
  static async saveCustomerDoc(customer: Customer) {
    try {
      await setDoc(doc(db, "customers", customer.id), customer, { merge: true });
    } catch (e) {
      console.error("Firestore saveCustomer error:", e);
    }
  }

  static async deleteCustomerDoc(id: string) {
    try {
      await deleteDoc(doc(db, "customers", id));
    } catch (e) {
      console.error("Firestore deleteCustomer error:", e);
    }
  }

  static async deleteProductDoc(id: string) {
    try {
      await deleteDoc(doc(db, "products", id));
    } catch (e) {
      console.error("Firestore deleteProduct error:", e);
    }
  }

  static async saveProductDoc(product: Product) {
    try {
      await setDoc(doc(db, "products", product.id), product, { merge: true });
    } catch (e) {
      console.error("Firestore saveProduct error:", e);
    }
  }

  static async saveBillDoc(bill: Bill) {
    try {
      await setDoc(doc(db, "bills", bill.id), bill, { merge: true });
    } catch (e) {
      console.error("Firestore saveBill error:", e);
    }
  }

  static async deleteBillDoc(id: string) {
    try {
      await deleteDoc(doc(db, "bills", id));
    } catch (e) {
      console.error("Firestore deleteBill error:", e);
    }
  }

  static async savePaymentDoc(payment: PaymentRecord) {
    try {
      await setDoc(doc(db, "payments", payment.id), payment, { merge: true });
    } catch (e) {
      console.error("Firestore savePayment error:", e);
    }
  }

  static async deletePaymentDoc(id: string) {
    try {
      await deleteDoc(doc(db, "payments", id));
    } catch (e) {
      console.error("Firestore deletePayment error:", e);
    }
  }

  static async saveShopSettingsDoc(settings: ShopSettings) {
    try {
      await setDoc(doc(db, "shop_settings", "general"), settings, { merge: true });
    } catch (e) {
      console.error("Firestore saveShopSettings error:", e);
    }
  }

  static async saveAuditLogDoc(log: AuditLog) {
    try {
      await setDoc(doc(db, "audit_logs", log.id), log, { merge: true });
    } catch (e) {
      console.error("Firestore saveAuditLog error:", e);
    }
  }

  static async clearAllFirestoreData() {
    try {
      const collections = ["customers", "products", "bills", "payments", "audit_logs"];
      for (const colName of collections) {
        const snap = await getDocs(collection(db, colName));
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    } catch (e) {
      console.error("Error clearing Firestore collections:", e);
    }
  }
}
