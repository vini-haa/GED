package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/fadex/ged-api/internal/middleware"
)

type MeHandler struct{}

func NewMeHandler() *MeHandler {
	return &MeHandler{}
}

func (h *MeHandler) Me(c *gin.Context) {
	setor := middleware.GetUserSetor(c)

	resp := gin.H{
		"email": middleware.GetUserEmail(c),
		"nome":  middleware.GetUserName(c),
		"role":  middleware.GetUserRole(c),
	}

	if setor != "" {
		resp["setor"] = setor
	}

	c.JSON(http.StatusOK, gin.H{"data": resp})
}
