export type User = {
  id: string; name: string; email: string; mobile?: string; status: string; kycStatus: string;
  alternateMobile?: string; dob?: string; gender?: string; occupation?: string;
  occupationId?: string; currentAddress?: string; permanentAddress?: string;
  emergencyName?: string; emergencyMobile?: string;
};
export type Bike = {
  id: string; model: string; registrationNumber: string; chassisNumber: string; status: string;
  battery: number; odometer: number; rangeKm: number; topSpeed: number; rentalPerDay: number;
  extraHourRate: number; totalRentals: number; totalRevenue: number; extraHourRevenue: number; image?: string;
};
export type Rental = {
  id: string; userId: string; bikeId: string; startAt: string; expectedReturnAt: string;
  actualReturnAt?: string|null; durationDays: number; rentalAmount: number; securityDeposit: number;
  extraHours: number; extraCharge: number; damageCharge: number; trafficFine: number; otherCharge: number;
  totalCharges?: number; balance?: number; status: string;
};
