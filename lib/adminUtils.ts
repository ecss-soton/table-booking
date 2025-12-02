export function isAdmin(sotonId: string): boolean {
    const adminsList = process.env.ADMINS;
    if (!adminsList) return false;
    
    const admins = adminsList.split(',').map(id => id.trim());
    return admins.includes(sotonId);
}

export function getAdminsList(): string[] {
    const adminsList = process.env.ADMINS;
    if (!adminsList) return [];
    
    return adminsList.split(',').map(id => id.trim());
}

export function isBookingOpen(): boolean {
    return process.env.BOOKING_SYSTEM_OPEN === 'true';
}