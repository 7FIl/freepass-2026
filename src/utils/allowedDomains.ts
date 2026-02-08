import prisma from './prisma';
import cache, { CACHE_TTL } from './cache';

const CACHE_KEY = 'allowed_email_domains';

/**
 * Get all allowed email domains from database (cached)
 */
export async function getAllowedEmailDomains(): Promise<string[]> {
  return cache.getOrSet(
    CACHE_KEY,
    async () => {
      const domains = await prisma.allowedEmailDomain.findMany({
        select: { domain: true },
      });
      return domains.map(d => d.domain.toLowerCase());
    },
    CACHE_TTL.CANTEENS, // 5 minutes cache
  );
}

/**
 * Check if an email domain is allowed
 */
export async function isEmailDomainAllowed(email: string): Promise<boolean> {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  
  const allowedDomains = await getAllowedEmailDomains();
  return allowedDomains.includes(domain);
}

/**
 * Invalidate the allowed domains cache (call after add/update/delete)
 */
export function invalidateAllowedDomainsCache(): void {
  cache.del(CACHE_KEY);
}
