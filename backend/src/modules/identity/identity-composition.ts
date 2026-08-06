import { config } from '../../config/unified-config';
import { prisma } from '../../core/database/prisma-client';
import { PrismaIdentityRepository } from './identity-repository';
import { bcryptPort } from './bcrypt-port';
import { auditPort, departmentDirectoryPort } from './identity-ports';
import { IdentityService } from './identity-service';
import { jwtPort } from './jwt-port';
import { generateTemporaryPassword } from './password-policy';

/**
 * Composition root của Identity module, gom dependency thật cho runtime Express.
 */
export const identityRepository = new PrismaIdentityRepository(prisma);

export const identityService = new IdentityService({
  auditPort,
  bcrypt: bcryptPort,
  clock: () => new Date(),
  departmentDirectory: departmentDirectoryPort,
  jwt: jwtPort,
  jwtRememberExpiresIn: config.auth.jwtRememberExpiresIn,
  randomPassword: generateTemporaryPassword,
  repository: identityRepository,
});
