import prisma from './prisma';
import cache, { CACHE_TTL } from './cache';

const CACHE_KEY = 'allowed_email_domains';

export async function getAllowedEmailDomains(): Promise<string[]> {
  return cache.getOrSet(
    CACHE_KEY,
    async () => {
      const domains = await prisma.allowedEmailDomain.findMany({
        select: { domain: true },
      });
      return domains.map(d => d.domain.toLowerCase());
    },
    CACHE_TTL.CANTEENS,
  );
}

export async function isEmailDomainAllowed(email: string): Promise<boolean> {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  
  const allowedDomains = await getAllowedEmailDomains();
  return allowedDomains.includes(domain);
}

export function invalidateAllowedDomainsCache(): void {
  cache.del(CACHE_KEY);
}

