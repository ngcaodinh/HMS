import { getAllowedRoles } from '../constants/role-policy';

/**
 * @param {string[]} roleCodes Role codes assigned to the requesting principal.
 * @param {string} action Policy action code declared on the route.
 * @returns {boolean} Whether at least one of the principal's roles is allowed to perform the action.
 */
export function isActionAllowed(roleCodes: string[], action: string): boolean {
  const allowedRoles = getAllowedRoles(action);
  return roleCodes.some((role) => allowedRoles.includes(role));
}
