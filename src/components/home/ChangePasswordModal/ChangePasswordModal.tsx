"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { FiX } from "react-icons/fi";
import "./ChangePasswordModal.css";
import "../../../styles/ModalShared.css";
import { Input } from "@/components/ui";
import { changePasswordSchema, type ChangePasswordFormData } from "@/schemas";

type ChangePasswordModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { senhaAtual: string; novaSenha: string }) => Promise<void> | void;
  loading?: boolean;
  apiError?: string | null;
};

export function ChangePasswordModal({ isOpen, onClose, onSave, loading = false, apiError = null }: ChangePasswordModalProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ChangePasswordFormData>({
    resolver: yupResolver(changePasswordSchema),
    mode: 'onChange',
  });

  if (!isOpen) return null;

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = handleSubmit(async (data) => {
    await onSave({ senhaAtual: data.senhaAtual, novaSenha: data.novaSenha });
    reset();
  });

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="change-password-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Trocar senha</h2>
          <button className="close-button" onClick={handleClose} type="button" aria-label="Fechar">
            <FiX size={20} color="#5E5E5E" />
          </button>
        </div>

        {/* Divider */}
        <div className="modal-divider" />

        {/* Content */}
        <form className="modal-content" onSubmit={onSubmit}>
          <div className="text-field">
            <Input
              label="Senha atual"
              type="password"
              placeholder="Digite sua senha atual"
              autoComplete="current-password"
              {...register('senhaAtual')}
              error={errors.senhaAtual?.message}
              required
            />
          </div>

          <div className="text-field">
            <Input
              label="Nova senha"
              type="password"
              placeholder="Digite a nova senha"
              autoComplete="new-password"
              {...register('novaSenha')}
              error={errors.novaSenha?.message}
              required
            />
          </div>

          <div className="text-field">
            <Input
              label="Confirmar nova senha"
              type="password"
              placeholder="Repita a nova senha"
              autoComplete="new-password"
              {...register('confirmarNovaSenha')}
              error={errors.confirmarNovaSenha?.message || apiError || undefined}
              required
            />
          </div>
        </form>

        {/* Footer Divider */}
        <div className="modal-divider" />

        {/* Footer */}
        <div className="modal-footer">
          <button className="cancel-button" onClick={handleClose} type="button">
            Cancelar
          </button>
          <button
            className="save-button"
            type="button"
            onClick={onSubmit as unknown as () => void}
            disabled={loading || isSubmitting}
          >
            {loading || isSubmitting ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
