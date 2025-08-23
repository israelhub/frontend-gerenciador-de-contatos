"use client";
import React, { useState } from "react";
import { FiX } from "react-icons/fi";
import "./UnlockModal.css";
import "../../../styles/ModalShared.css";
import { Input } from "@/components/ui";

type UnlockModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void> | void;
  loading?: boolean;
  error?: string | null;
};

export function UnlockModal({ isOpen, onClose, onConfirm, loading = false, error = null }: UnlockModalProps) {
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!password.trim()) {
      setLocalError("Senha obrigatória");
      return;
    }
    try {
      await onConfirm(password);
      setPassword("");
    } catch (e) {
      // onConfirm deve lançar erro com mensagem adequada se falhar
      const msg = e instanceof Error ? e.message : String(e);
      setLocalError(msg || "Erro ao validar senha");
    }
  };

  const handleClose = () => {
    setPassword("");
    setLocalError(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="unlock-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Visualizar informações</h2>
          <button className="close-button" onClick={handleClose} type="button" aria-label="Fechar">
            <FiX size={20} color="#5E5E5E" />
          </button>
        </div>

        {/* Divider */}
        <div className="modal-divider" />

        {/* Content */}
        <form className="modal-content" onSubmit={handleSubmit}>
          <div className="text-field">
            <Input
              label="Senha"
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              required
              error={localError || error || undefined}
            />
          </div>
        </form>

        {/* Footer Divider */}
        <div className="modal-divider" />

        {/* Footer */}
        <div className="modal-footer">
          <button className="cancel-button" onClick={handleClose} type="button">
            Voltar
          </button>
          <button 
            className="save-button" 
            onClick={handleSubmit as unknown as () => void}
            type="button"
            disabled={loading}
          >
            {loading ? 'Verificando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
