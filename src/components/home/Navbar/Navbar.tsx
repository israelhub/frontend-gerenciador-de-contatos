"use client";
import React from "react";
import { FiSearch, FiPlus, FiList } from "react-icons/fi";
import Image from "next/image";
import navbarLock from "@/assets/icons/navbar-lock.svg";
import { DelayedTooltip, Input } from "@/components/ui";
import styles from "./Navbar.module.css";

type NavbarProps = {
  onAdd?: () => void;
  onToggleAllEncryption?: () => void;
  allEncrypted?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onViewAll?: () => void;
};

export function Navbar({ onAdd, onToggleAllEncryption, allEncrypted = false, searchValue = '', onSearchChange, onViewAll }: NavbarProps) {
  return (
    <div className={styles.navbar}>
      <h1 className={styles.navbar__title}>Lista de contatos</h1>

      <div className={styles.navbar__actions}>
        <div className={styles.navbar__search}>
          <FiSearch size={16} color="#777" aria-hidden />
          <Input
            unstyled
            hideLabel
            label="Pesquisar"
            placeholder="Pesquisar"
            aria-label="Pesquisar"
            className={styles.navbar__searchInput}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.currentTarget.value)}
          />
        </div>

        <DelayedTooltip delay={7000} content="Tá esperando o quê? Boraa moeer!! 🚀">
          <button className={styles.navbar__addBtn} onClick={onAdd} type="button">
            <FiPlus size={16} />
            <span>Adicionar contato</span>
          </button>
        </DelayedTooltip>

        <button 
          className={styles.navbar__iconBtn} 
          type="button" 
          aria-label="Ver todos os contatos"
          onClick={onViewAll}
          title="Ver todos os contatos"
        >
          <FiList size={16} />
        </button>

        <button 
          className={styles.navbar__iconBtn} 
          type="button" 
          aria-label={allEncrypted ? "Desbloquear todos" : "Bloquear todos"}
          onClick={onToggleAllEncryption}
        >
          <Image src={navbarLock} alt={allEncrypted ? "Desbloquear todos" : "Bloquear todos"} width={16} height={17} />
        </button>
      </div>
    </div>
  );
}
