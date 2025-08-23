"use client";
import Image from "next/image";
import React from "react";
import profileSvg from "@/assets/icons/sidebar-profile.svg";
import settingsSvg from "@/assets/icons/sidebar-settings.svg";
import logoutSvg from "@/assets/icons/sidebar-logout.svg";
import { api } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import { useMe } from "@/hooks/useMe";
import styles from "./Sidebar.module.css";

type SidebarProps = {
  onOpenSettings?: () => void;
};

export function Sidebar({ onOpenSettings }: SidebarProps) {
  const router = useRouter();
  const { user } = useMe();

  const handleLogout = async () => {
    try {
      await api.logout();
      router.replace('/login');
    } catch (error) {
      console.error('Erro no logout:', error);
      // Mesmo com erro, redireciona para login
      router.replace('/login');
    }
  };
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebar__top}>
        <Image src="/icon.svg" alt="Logo" width={29} height={32} />
      </div>

      <div className={styles.sidebar__mid}>
        <nav className={styles.sidebar__nav} aria-label="Principal">
          <button className={`${styles.sidebar__navBtn} ${styles["sidebar__navBtn--active"]}`} aria-label="Perfil">
            <Image src={profileSvg} alt="Perfil" width={24} height={24} />
          </button>
          <button className={styles.sidebar__navBtn} aria-label="Configurações" onClick={onOpenSettings}>
            <Image src={settingsSvg} alt="Configurações" width={24} height={24} />
          </button>
          <button className={styles.sidebar__navBtn} aria-label="Sair" onClick={handleLogout}>
            <Image src={logoutSvg} alt="Sair" width={24} height={24} />
          </button>
        </nav>
      </div>

      <div className={styles.sidebar__user}>
        <span className={styles.sidebar__userLabel}>Logado como:</span>
  <span className={styles.sidebar__userEmail}>{user?.email ?? '...'}</span>
      </div>
    </aside>
  );
}
