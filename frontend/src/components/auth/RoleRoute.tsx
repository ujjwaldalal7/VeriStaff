import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useAppSelector } from "../../hooks/redux";
import type { UserRole } from "../../types/auth";

interface RoleRouteProps {
  roles: UserRole[];
  children: ReactNode;
}

export default function RoleRoute({
  roles,
  children
}: RoleRouteProps) {
  const user = useAppSelector(
    (state) => state.auth.user
  );

  if (!user || !roles.includes(user.role)) {
    return (
      <Navigate
        to="/profile"
        replace
      />
    );
  }

  return children;
}
