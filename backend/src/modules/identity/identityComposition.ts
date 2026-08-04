import { config } from '../../config/unifiedConfig';
import { prisma } from '../../core/database/prismaClient';
import { PrismaIdentityRepository } from './IdentityRepository';
import { bcryptPort } from './bcryptPort';
import { auditPort, departmentDirectoryPort } from './identityPorts';
import { IdentityService } from './identityService';
import { jwtPort } from './jwtPort';
import { generateTemporaryPassword } from './passwordPolicy';

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
