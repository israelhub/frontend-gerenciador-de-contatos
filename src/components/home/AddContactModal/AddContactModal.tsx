"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { FiX, FiPlus } from "react-icons/fi";
import Image from "next/image";
import accountCircle from "@/assets/icons/account-circle.svg";
import "./AddContactModal.css";
import "@/styles/ModalShared.css";
import { Input } from "@/components/ui";
import { contactSchema, type ContactFormData } from "@/schemas";

type AddContactModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: ContactFormData) => void;
};

export function AddContactModal({ isOpen, onClose, onSave }: AddContactModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue
  } = useForm({
    resolver: yupResolver(contactSchema),
    mode: 'onChange', // Validação em tempo real
    reValidateMode: 'onChange' // Re-valida em tempo real também
  });

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoBase64, setPhotoBase64] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string>('');

  // Registro do telefone para encadear o onChange do RHF com a máscara
  const telefoneRegister = register("telefone");

  const handleTelefoneChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const onlyDigits = e.target.value.replace(/\D/g, '').slice(0, 11);
    let formatted = onlyDigits;
    if (onlyDigits.length > 2) {
      formatted = `(${onlyDigits.slice(0,2)}) ${onlyDigits.slice(2)}`;
    }
    if (onlyDigits.length > 7) {
      formatted = `(${onlyDigits.slice(0,2)}) ${onlyDigits.slice(2,7)}-${onlyDigits.slice(7)}`;
    }
    // Atualiza o valor exibido e chama o onChange do RHF para manter validação em tempo real
    (e.target as HTMLInputElement).value = formatted;
    telefoneRegister.onChange(e);
  };

  if (!isOpen) return null;

  const onSubmitForm = handleSubmit(async (data) => {
    // Prepara os dados para envio
    const sanitized = { 
      ...data, 
      telefone: (data.telefone || '').replace(/\D/g, ''),
      foto: photoBase64 || undefined // Envia o base64 ou undefined
    };
    onSave(sanitized as unknown as ContactFormData);
    reset();
    setPhotoBase64('');
    setPhotoPreview('');
    onClose();
  });

  const handleClose = () => {
    reset();
    setPhotoBase64('');
    setPhotoPreview('');
    onClose();
  };

  const compressImage = (file: File, maxWidth: number = 300, quality: number = 0.7): Promise<{ base64: string; preview: string }> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = document.createElement('img');
      
      img.onload = () => {
        // Calcular dimensões mantendo proporção
        let { width, height } = img;
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width = (width * maxWidth) / height;
            height = maxWidth;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Desenhar e comprimir
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataURL = canvas.toDataURL('image/jpeg', quality);
        const base64 = dataURL.split(',')[1]; // Remove o prefixo "data:image/jpeg;base64,"
        const preview = dataURL; // Mantém o prefixo para preview
        
        resolve({ base64, preview });
      };
      
      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleAddPhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      setUploadingPhoto(true);
      try {
        // Comprimir a imagem antes de converter
        const { base64, preview } = await compressImage(file, 300, 0.7);
        setPhotoBase64(base64);
        setPhotoPreview(preview);
        setValue("foto", "has-photo"); // Marca que tem foto para validação
        setUploadingPhoto(false);
      } catch (error) {
        console.error('Erro ao processar foto:', error);
        setUploadingPhoto(false);
      }
    };
    input.click();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="add-contact-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Adicionar contato</h2>
          <button className="close-button" onClick={handleClose} type="button">
            <FiX size={20} color="#5E5E5E" />
          </button>
        </div>

        {/* Divider */}
        <div className="modal-divider" />

        {/* Content */}
  <form className="modal-content" onSubmit={onSubmitForm}>
          {/* Avatar Section */}
          <div className="avatar-section">
            <div className="avatar-container">
              <div className="avatar-image">
                {photoPreview ? (
                  <Image 
                    src={photoPreview} 
                    alt="Avatar do contato" 
                    width={64} 
                    height={64}
                    style={{ borderRadius: '12px', objectFit: 'cover' }}
                    unoptimized
                  />
                ) : (
                  <Image src={accountCircle} alt="Avatar" width={64} height={64} />
                )}
              </div>
            </div>
            <button 
              className="add-photo-button" 
              type="button" 
              onClick={handleAddPhoto}
              disabled={uploadingPhoto}
            >
              <FiPlus size={12} color="#FFFFFF" />
              <span>{uploadingPhoto ? 'Carregando...' : 'Adicionar foto'}</span>
            </button>
          </div>

          {/* Name Field */}
          <div className="text-field">
            <Input
              label="Nome"
              type="text"
              placeholder="Nome do contato"
              {...register("nome")}
              error={errors.nome?.message}
              required
            />
          </div>

          {/* Category Field */}
          <div className="text-field">
            <Input
              label="Categoria"
              type="text"
              placeholder="Ex: pessoal, trabalho, família..."
              {...register("categoria")}
              error={errors.categoria?.message}
            />
          </div>

          {/* Phone Field */}
          <div className="text-field">
            <Input
              label="Telefone"
              type="tel"
              placeholder="Número de telefone"
              {...telefoneRegister}
              onChange={handleTelefoneChange}
              error={errors.telefone?.message}
            />
          </div>

          {/* Email Field */}
          <div className="text-field">
            <Input
              label="E-mail"
              type="email"
              placeholder="Email do contato"
              {...register("email")}
              error={errors.email?.message}
            />
          </div>

          {/* Foto Field - Hidden input, managed by photo upload */}
          <input type="hidden" {...register("foto")} />

          {/* Footer Divider */}
          <div className="modal-divider" />

          {/* Footer */}
          <div className="modal-footer">
            <button className="cancel-button" onClick={handleClose} type="button">
              Cancelar
            </button>
            <button 
              className="save-button" 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
