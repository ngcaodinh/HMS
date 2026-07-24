import { prisma } from '../../core/database/prismaClient';
import { PrismaIdentityRepository } from './IdentityRepository';
import { bcryptPort } from './bcryptPort';
import { auditPort, departmentDirectoryPort } from './identityPorts';
import { IdentityService } from './identityService';
import { jwtPort } from './jwtPort';
import { generateTemporaryPassword } from './passwordPolicy';

export const identityRepository = new PrismaIdentityRepository(prisma);

export const identityService = new IdentityService({
  auditPort,
  bcrypt: bcryptPort,
  clock: () => new Date(),
  departmentDirectory: departmentDirectoryPort,
  jwt: jwtPort,
  randomPassword: generateTemporaryPassword,
  repository: identityRepository,
});
