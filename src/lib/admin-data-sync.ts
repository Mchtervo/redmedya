/** Admin paneli sekmeleri arasında veri yenileme */
export const ADMIN_DATA_CHANGED = "admin:data-changed";

export function notifyAdminDataChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ADMIN_DATA_CHANGED));
  }
}

/** @deprecated notifyAdminDataChanged kullanın */
export function notifyAdminReservationsChanged() {
  notifyAdminDataChanged();
}
