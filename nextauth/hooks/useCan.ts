import { useContext } from "react"
import { AuthContext } from "../context/AuthContext"
import { validateUserPermissions } from "../utils/validateUserPermissions";

type UseCanProps = {
  permissions?: string[];
  roles?: string[];
}


export function useCan({ permissions = [], roles = [] }: UseCanProps) {
  const { user, isAuthenticated } = useContext(AuthContext);

  if(!isAuthenticated ){
    return false;
  }

  const userHasValidPermissions = validateUserPermissions({
    user,
    permissions,
    roles
  })

  return userHasValidPermissions;
}