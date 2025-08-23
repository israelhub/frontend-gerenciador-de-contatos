"use client";
import React, { useState } from "react";
import { Sidebar, Navbar, ContactList, AddContactModal, EditContactModal, UnlockModal, ChangePasswordModal } from "@/components/home";
import type { Contact } from "@/components/home/ContactRow/ContactRow";
import styles from "./page.module.css"; // CSS Module específico da página
import { api, tokens } from "@/lib/api/client";
import type { ContactFormData } from "@/schemas";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useMe } from "@/hooks/useMe";
import { useRouter } from "next/navigation";

type ContactData = {
  id?: string;
  nome: string;
  telefone: string;
  email?: string;
  categoria?: string;
  foto?: string;
};

export default function HomePage() {
  const { user } = useMe();
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactData | null>(null);
  const [encryptedContacts, setEncryptedContacts] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState<string>("");
  const [reloadKey, setReloadKey] = useState(0);
  const [visibleContactIds, setVisibleContactIds] = useState<string[]>([]);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlockTarget, setUnlockTarget] = useState<{ type: 'one' | 'all'; id?: string } | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);

  const handleAddContact = () => {
    setIsAddModalOpen(true);
  };

  const handleViewAll = () => {
    setShowAll(true);
    setSearch(''); // Limpa busca
  };

  // Reset showAll quando houver busca ou outras interações
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (value.trim()) {
      setShowAll(false); // Desativa "ver todos" quando há busca
    }
  };

  const handleAlphaInteraction = () => {
    setShowAll(false); // Desativa "ver todos" quando usuário interage com alpha-filter
  };

  const handleEditContact = (contact: Contact) => {
    // Mapear contact.tag para contact.category para compatibilidade com o modal
    const mappedContact: ContactData = {
      id: contact.id,
      nome: contact.name,
      telefone: contact.phone,
      email: contact.email,
      categoria: contact.tag || "",
      foto: contact.avatarUrl
    };
    setEditingContact(mappedContact);
    setIsEditModalOpen(true);
  };

  const requirePasswordThen = (target: { type: 'one' | 'all'; id?: string }) => {
    setUnlockError(null);
    setUnlockTarget(target);
    setUnlockOpen(true);
  };

  const handleToggleContactEncryption = (contactId: string) => {
    setEncryptedContacts(prev => {
      const isEncrypted = prev.has(contactId);
      if (!isEncrypted) {
        // Criptografar livremente
        const next = new Set(prev);
        next.add(contactId);
        return next;
      }
      // Descriptografar requer senha
      requirePasswordThen({ type: 'one', id: contactId });
      return prev;
    });
  };

  const handleToggleAllEncryption = () => {
    const allContactIds = visibleContactIds;
    if (allContactIds.length === 0) return;
    const allAreEncrypted = allContactIds.every(id => encryptedContacts.has(id));
    if (!allAreEncrypted) {
      // Criptografar todos visiveis
      setEncryptedContacts(prev => {
        const next = new Set(prev);
        for (const id of allContactIds) next.add(id);
        return next;
      });
    } else {
      // Descriptografar todos requer senha
      requirePasswordThen({ type: 'all' });
    }
  };
  const allEncrypted = visibleContactIds.length > 0 && visibleContactIds.every(id => encryptedContacts.has(id));

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingContact(null);
  };

  const openSettings = () => {
    setChangePasswordError(null);
    setIsChangePasswordOpen(true);
  };

  const handleChangePassword = async (data: { senhaAtual: string; novaSenha: string }) => {
    try {
      setChangePasswordLoading(true);
      setChangePasswordError(null);
      await api.updatePassword({ senhaAtual: data.senhaAtual, novaSenha: data.novaSenha });
      // Após 204, backend revoga refresh tokens. Vamos limpar tokens locais e enviar para login.
      // Também chamamos logout para encerrar sessão server-side (se necessário), mas ignoramos erros.
  // Limpa tokens localmente primeiro para garantir estado consistente
  tokens.setTokens('', '');
  try { await api.logout(); } catch {}
      setIsChangePasswordOpen(false);
      router.replace('/login');
    } catch (e) {
      const msg = typeof e === 'string' ? e : (e instanceof Error ? e.message : 'Erro ao trocar senha');
      // Mapear mensagens específicas
      if (/401|incorreta|atual/i.test(String(msg))) {
        setChangePasswordError('Senha atual incorreta');
      } else if (/400|inválid|invalid/i.test(String(msg))) {
        setChangePasswordError('Dados inválidos');
      } else {
        setChangePasswordError(String(msg));
      }
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const handleSaveContact = (contact: ContactFormData) => {
    // Envia para API: nome, telefone (só dígitos), categoria, email, foto
    api.createContact({
      nome: contact.nome,
      telefone: (contact.telefone || '').replace(/\D/g, ''),
      categoria: contact.categoria || undefined,
      email: contact.email || undefined,
      foto: contact.foto || undefined,
    })
      .then((createdContact) => {
        console.log('Contact created:', createdContact);
        setReloadKey((k) => k + 1);
      })
      .catch((e) => console.error('Erro ao criar contato:', e));
  };

  const handleSaveEditedContact = (contact: ContactFormData & { id?: string }) => {
    if (!contact.id) return;
    api.updateContact(contact.id, {
      nome: contact.nome,
      telefone: (contact.telefone || '').replace(/\D/g, ''),
      categoria: contact.categoria || undefined,
      email: contact.email || undefined,
      foto: contact.foto || undefined,
    })
      .then(() => setReloadKey((k) => k + 1))
      .catch((e) => console.error('Erro ao atualizar contato:', e));
  };

  const handleConfirmUnlock = async (password: string) => {
    try {
      setUnlockLoading(true);
      setUnlockError(null);
      // Descobrir email atual do usuario e validar senha (login)
      const me = await api.me() as unknown;
      const hasEmail = (v: unknown): v is { email: string } => typeof v === 'object' && v !== null && 'email' in (v as Record<string, unknown>) && typeof (v as Record<string, unknown>).email === 'string';
      const hasUserEmail = (v: unknown): v is { user: { email: string } } => {
        if (typeof v !== 'object' || v === null) return false;
        const r = v as Record<string, unknown>;
        const u = r.user as Record<string, unknown> | undefined;
        return !!u && typeof u.email === 'string';
      };
      const email = hasEmail(me) ? me.email : hasUserEmail(me) ? me.user.email : undefined;
      if (!email) throw new Error('Usuário não encontrado');
      await api.login({ email, senha: password });
      // Se a validação passou, aplicar ação
      if (unlockTarget?.type === 'one' && unlockTarget.id) {
        setEncryptedContacts(prev => {
          const next = new Set(prev);
          next.delete(unlockTarget.id!);
          return next;
        });
      } else if (unlockTarget?.type === 'all') {
        setEncryptedContacts(prev => {
          const next = new Set(prev);
          for (const id of visibleContactIds) next.delete(id);
          return next;
        });
      }
      setUnlockOpen(false);
      setUnlockTarget(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Senha inválida';
      setUnlockError(msg);
    } finally {
      setUnlockLoading(false);
    }
  };

  return (
    <AuthGuard>
      <main className={styles.pageWrap}>
  <Sidebar onOpenSettings={openSettings} />

      <section className={`${styles.contentCard} container`}>
        <Navbar 
          onAdd={handleAddContact} 
          onToggleAllEncryption={handleToggleAllEncryption}
          allEncrypted={allEncrypted}
          searchValue={search}
          onSearchChange={handleSearchChange}
          onViewAll={handleViewAll}
        />
        <ContactList 
          onEditContact={handleEditContact}
          encryptedContacts={encryptedContacts}
          onToggleContactEncryption={handleToggleContactEncryption}
          onVisibleContactIdsChange={setVisibleContactIds}
          search={search}
          reloadTrigger={reloadKey}
          showAll={showAll}
          onAlphaInteraction={handleAlphaInteraction}
        />
      </section>

      {/* Sidebar user para mobile - só aparece em telas pequenas */}
      <div className={styles["mobile-sidebar-user"]}>
        <span className={styles.sidebar__userLabel}>Logado como:</span>
  <span className={styles.sidebar__userEmail}>{user?.email ?? '...'}</span>
      </div>

      <AddContactModal 
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSave={handleSaveContact}
      />

      <EditContactModal 
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveEditedContact}
        initialData={editingContact ? { nome: editingContact.nome || '', telefone: editingContact.telefone || '', categoria: editingContact.categoria || '', email: editingContact.email || '', id: editingContact.id, foto: editingContact.foto } : undefined}
      />

      <UnlockModal
        isOpen={unlockOpen}
        onClose={() => { setUnlockOpen(false); setUnlockError(null); }}
        onConfirm={handleConfirmUnlock}
        loading={unlockLoading}
        error={unlockError}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => { setIsChangePasswordOpen(false); setChangePasswordError(null); }}
        onSave={handleChangePassword}
        loading={changePasswordLoading}
        apiError={changePasswordError}
      />
      </main>
    </AuthGuard>
  );
}
