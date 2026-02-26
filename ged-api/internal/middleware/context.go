package middleware

import "github.com/gin-gonic/gin"

const (
	ctxKeyEmail = "user_email"
	ctxKeyName  = "user_name"
	ctxKeyRole  = "user_role"
	ctxKeySetor = "user_setor"

	RoleSuperAdmin = "SUPER_ADMIN"
	RoleAdmin      = "ADMIN"
	RoleUserSetor  = "USER_SETOR"
	RoleViewer     = "VIEWER"
)

func GetUserEmail(c *gin.Context) string {
	return c.GetString(ctxKeyEmail)
}

func GetUserName(c *gin.Context) string {
	return c.GetString(ctxKeyName)
}

func GetUserRole(c *gin.Context) string {
	return c.GetString(ctxKeyRole)
}

func GetUserSetor(c *gin.Context) string {
	return c.GetString(ctxKeySetor)
}

func IsAdmin(c *gin.Context) bool {
	role := GetUserRole(c)
	return role == RoleSuperAdmin || role == RoleAdmin
}

func IsSuperAdmin(c *gin.Context) bool {
	return GetUserRole(c) == RoleSuperAdmin
}
