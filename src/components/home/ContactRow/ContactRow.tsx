"use client";
import React from "react";
import Image from "next/image";
import rowLock from "@/assets/icons/row-lock.svg";
import rowTrash from "@/assets/icons/row-trash.svg";
import editIcon from "@/assets/icons/row-edit.svg";
import { Tooltip } from "@/components/ui";
import styles from "./ContactRow.module.css";

export type Contact = {
  id: string;
  name: string;
  tag?: string;
  phone: string;
  email: string;
  avatarUrl?: string;
};

type ContactRowProps = {
  contact: Contact;
  onEditContact?: (contact: Contact) => void;
  isEncrypted?: boolean;
  onToggleEncryption?: (contactId: string) => void;
  onDeleteContact?: (contactId: string) => void;
};

export function ContactRow({ contact, onEditContact, isEncrypted = false, onToggleEncryption, onDeleteContact }: ContactRowProps) {
  const handleEditClick = () => {
    onEditContact?.(contact);
  };

  const handleToggleEncryption = () => {
    onToggleEncryption?.(contact.id);
  };

  const handleDelete = () => {
    onDeleteContact?.(contact.id);
  };

  const maskText = (text: string, type: 'category' | 'phone' | 'email') => {
    // Retorna quantidade específica de asteriscos baseada no tipo de dado
    switch (type) {
      case 'category':
        return "*".repeat(22);
      case 'phone':
        return "*".repeat(11);
      case 'email':
        return "*".repeat(22);
      default:
        return "*".repeat(15);
    }
  };
  return (
    <div className={styles["table__row"]}>
      <div className={`${styles["table__cell"]} ${styles["table__cell--name"]}`}>
        <div className={styles.avatar} aria-hidden>
          {contact.avatarUrl && (
            <Image 
              src={contact.avatarUrl.startsWith('data:') ? contact.avatarUrl : `data:image/jpeg;base64,${contact.avatarUrl}`} 
              alt={`Foto de ${contact.name}`}
              width={44}
              height={44}
              style={{ borderRadius: '12px', objectFit: 'cover' }}
              unoptimized
            />
          )}
        </div>
        <div className={styles.nameBlock}>
          <Tooltip content={contact.name}>
            <div className={styles["nameBlock__line"]}>{contact.name}</div>
          </Tooltip>
          <Tooltip content={contact.tag ?? ""}>
            <div className={`${styles["nameBlock__line"]} ${styles["nameBlock__line--muted"]}`}>
              {isEncrypted ? (contact.tag ? maskText(contact.tag, 'category') : "") : (contact.tag ?? "")}
            </div>
          </Tooltip>
        </div>
      </div>

      <div className={`${styles["table__cell"]} ${styles["table__cell--phone"]}`}>
        <Tooltip content={contact.phone}>
          <div className={styles.cellLine}>
            {isEncrypted ? maskText(contact.phone, 'phone') : contact.phone}
          </div>
        </Tooltip>
      </div>

      <div className={`${styles["table__cell"]} ${styles["table__cell--email"]}`}>
        <Tooltip content={contact.email}>
          <div className={styles.cellLine}>
            {isEncrypted ? maskText(contact.email, 'email') : contact.email}
          </div>
        </Tooltip>
      </div>

      <div className={`${styles["table__cell"]} ${styles["table__cell--actions"]}`}>
        <button className={`${styles.btn} ${styles["btn--ghost"]}`} onClick={handleEditClick}>
          <Image src={editIcon} alt="Editar" width={12} height={12} />
          Editar
        </button>
        <button className={`${styles.btn} ${styles["btn--icon"]}`} aria-label={isEncrypted ? "Desbloquear" : "Bloquear"} onClick={handleToggleEncryption}>
          <Image src={rowLock} alt={isEncrypted ? "Desbloquear" : "Bloquear"} width={12} height={13} />
        </button>
        <button className={`${styles.btn} ${styles["btn--icon"]}`} aria-label="Remover" onClick={handleDelete}>
          <Image src={rowTrash} alt="Remover" width={12} height={13} />
        </button>
      </div>
    </div>
  );
}
