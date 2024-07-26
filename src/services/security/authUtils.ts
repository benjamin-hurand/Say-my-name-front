export const getUserRoles = (): string | null => {
    const roles = localStorage.getItem('roles');
    if (roles && roles.startsWith('ROLE_')) {
      return roles.substring(5); // Remove the 'ROLE_' prefix
    }
    return null;
  };
  
  export const hasRole = (requiredRole: string): boolean => {
    const userRoles = getUserRoles();
    return userRoles === requiredRole;
  };