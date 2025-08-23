"use client";
import React, { useMemo, useState, useRef, useEffect } from "react";
import { Contact as UiContact, ContactRow } from "../ContactRow/ContactRow";
import { api } from "@/lib/api/client";
import type { Contact as ApiContact } from "@/lib/api/types";
import styles from "./ContactList.module.css";

type ContactListProps = {
  onEditContact?: (contact: UiContact) => void;
  encryptedContacts?: Set<string>;
  onToggleContactEncryption?: (contactId: string) => void;
  search?: string;
  onVisibleContactIdsChange?: (ids: string[]) => void;
  reloadTrigger?: number;
  showAll?: boolean;
  onAlphaInteraction?: () => void;
};

// Conversão de modelo da API -> UI esperada pela tabela
function mapApiToUi(c: ApiContact): UiContact {
  // aplica máscara simples ao exibir; os inputs/modais já aplicam máscara e removem dígitos ao enviar
  const tel = c.telefone;
  const digits = tel.replace(/\D/g, '').slice(0, 11);
  const masked = digits.length > 7
    ? `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`
    : digits.length > 2
      ? `(${digits.slice(0,2)}) ${digits.slice(2)}`
      : digits;
  return {
    id: c.id,
    name: c.nome,
    tag: c.categoria,
    phone: masked,
    email: c.email || '',
    avatarUrl: c.foto,
  };
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// Helpers fora do componente para não criar dependências de hook
const alphaKeyFromName = (name: string): string => {
  const s = (name || '').trim();
  if (!s) return '';
  const first = s[0];
  // Normaliza removendo diacríticos (acentos), ex.: Í -> I, É -> E
  const base = first.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return base.toUpperCase();
};
const isPagination = (v: unknown): v is { data: ApiContact[]; meta?: { total?: number } } => {
  return typeof v === 'object' && v !== null && Object.prototype.hasOwnProperty.call(v, 'data');
};
const isContactsShape = (v: unknown): v is { contacts: ApiContact[]; pagination?: { totalItems?: number | string } } => {
  return typeof v === 'object' && v !== null && Object.prototype.hasOwnProperty.call(v, 'contacts');
};
const parseNumber = (v: unknown): number | undefined => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};
const extract = (v: unknown): { items: ApiContact[]; total?: number } => {
  if (Array.isArray(v)) return { items: v as ApiContact[] };
  if (isPagination(v)) {
    const anyV = v as { data?: ApiContact[]; meta?: { total?: number } };
    return { items: anyV.data ?? [], total: anyV.meta?.total };
  }
  if (isContactsShape(v)) {
    const anyV = v as { contacts?: ApiContact[]; pagination?: { totalItems?: number | string } };
    const items = anyV.contacts ?? [];
    const total = parseNumber(anyV.pagination?.totalItems);
    return { items, total };
  }
  return { items: [] };
};

export function ContactList({ onEditContact, encryptedContacts = new Set(), onToggleContactEncryption, search, onVisibleContactIdsChange, reloadTrigger, showAll, onAlphaInteraction }: ContactListProps) {
  const [contacts, setContacts] = useState<UiContact[]>([]); // resultados atuais (busca)
  const [allContacts, setAllContacts] = useState<UiContact[]>([]); // baseline completo
  // loading removido da UI
  const [error, setError] = useState<string | null>(null);
  // total removido: não exibimos mais o total na UI
  
  const [activeLetter, setActiveLetter] = useState("A");
  const [alphaInteracted, setAlphaInteracted] = useState(false);
  // pos representa a posição fracionária do índice central (0=A, 1=B, ...)
  const [pos, setPos] = useState<number>(0);
  // step (px entre centros dos itens). Espaçamento reduzido.
  const STEP = 42; // mais espaço vertical para letra ativa maior
  // deslocamento do centro visual (px) para ficar um pouco mais acima
  const CENTER_BIAS_PX = 10;
  const [containerH, setContainerH] = useState<number>(450);
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 1024;
    }
    return false;
  });
  const [touchStartX, setTouchStartX] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);
  // snapTimeout removido em favor de inércia contínua
  const posRef = useRef<number>(0);
  const initializedRef = useRef(false);
  // inércia removida

  // Detectar se é mobile (ajuste responsivo) — inicializa no mount e atualiza no resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // groups baseado na lista da busca (mantido caso precise futuramente)

  const groupsAll = useMemo(() => {
    const map = new Map<string, UiContact[]>();
    for (const c of allContacts) {
      const k = alphaKeyFromName(c.name);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(c);
    }
    return map;
  }, [allContacts]);

  const isSearching = Boolean(search && search.trim());
  const visibleContacts = useMemo(() => {
    if (showAll) {
      // Modo "Ver Todos": mostra todos os contatos ignorando filtros
      return allContacts;
    }
    if (alphaInteracted) {
      // Após interação com o alfa-filter, mostrar por letra ignorando a busca (dinâmico)
      return groupsAll.get(activeLetter) ?? [];
    }
    if (isSearching) {
      // Sem interação no alfa-filter: lista completa dos resultados da busca
      return contacts;
    }
    // Sem busca: por letra usando a lista base
    return groupsAll.get(activeLetter) ?? [];
  }, [showAll, allContacts, isSearching, contacts, activeLetter, groupsAll, alphaInteracted]);

  // Inform parent sobre os IDs atualmente visíveis (útil para ações em lote).
  // Evita loop de render se o pai sempre setar um novo array: comparamos e só notificamos quando houver diferença.
  const prevVisibleIdsRef = useRef<string[] | null>(null);
  useEffect(() => {
    if (typeof onVisibleContactIdsChange !== 'function') return;
    const ids = visibleContacts.map(c => c.id);
    const prev = prevVisibleIdsRef.current;
    const changed = !prev || prev.length !== ids.length || prev.some((v, i) => v !== ids[i]);
    if (changed) {
      prevVisibleIdsRef.current = ids;
      onVisibleContactIdsChange(ids);
    }
  }, [visibleContacts, onVisibleContactIdsChange]);

  // Carrega baseline completo no mount (e quando reloadTrigger mudar)
  useEffect(() => {
    let ignore = false;
    const loadAll = async () => {
      try {
        const res = await api.listContacts({ page: 1, limit: 100 });
        if (ignore) return;
        const normalized = extract(res);
        const items = normalized.items ?? [];
        const mapped = items.map(mapApiToUi);
        setAllContacts(mapped);
        // se não há busca, sincronia contacts com baseline
        if (!isSearching) setContacts(mapped);
        
        // Define letra ativa: preserva a atual se existe, senão primeira letra do primeiro contato ou 'A'
        setActiveLetter(prevLetter => {
          // Se já tem uma letra ativa válida e há contatos com essa letra, mantém ela
          if (prevLetter && LETTERS.includes(prevLetter)) {
            const hasContactsWithLetter = mapped.some(c => alphaKeyFromName(c.name) === prevLetter);
            if (hasContactsWithLetter) {
              return prevLetter;
            }
          }
          
          // Senão, tenta usar a primeira letra do primeiro contato
          const first = items[0]?.nome?.[0]?.toUpperCase();
          if (first && LETTERS.includes(first)) {
            return first;
          }
          
          // Por último, usa 'A' como padrão
          return 'A';
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Erro ao carregar contatos';
        if (!ignore) setError(msg);
      }
    };
    loadAll();
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadTrigger]);

  // Carrega contatos conforme a busca
  useEffect(() => {
    let ignore = false;
    const load = async () => {
  try {
        setError(null);
        if (search && search.trim()) {
          const res = await api.searchContacts({ q: search.trim(), page: 1, limit: 100 });
          if (ignore) return;
          const normalized = extract(res);
          const items = normalized.items ?? [];
          setContacts(items.map(mapApiToUi));
        } else {
          // sem busca: usar baseline já carregado
          if (!ignore) setContacts(allContacts);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Erro ao carregar contatos';
        if (!ignore) setError(msg);
      } finally {
        // no-op
      }
    };
    load();
    return () => { ignore = true; };
  }, [search, allContacts]);

  // Ao alterar a busca, reseta a interação com o alfa-filter para voltar a mostrar a lista completa da busca
  useEffect(() => {
    setAlphaInteracted(false);
  }, [search]);

  const handleDeleteContact = async (id: string) => {
    try {
      await api.deleteContact(id);
  setContacts(prev => prev.filter(c => c.id !== id));
  setAllContacts(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('Erro ao remover contato:', msg);
    }
  };
  // incluir contacts como dependencia

  // Medir altura da área de conteúdo (grid) para sincronizar alphaFilter e evitar gap
  useEffect(() => {
    const observe = () => {
      const area = areaRef.current;
      // fallback para painel direito se área não estiver montada
      const el = area ?? rightRef.current;
      if (!el) return;
      const h = el.getBoundingClientRect().height;
      if (h > 0) setContainerH(h);
    };
    observe();
    const ro = new ResizeObserver(() => observe());
    if (areaRef.current) ro.observe(areaRef.current);
    else if (rightRef.current) ro.observe(rightRef.current);
    window.addEventListener("resize", observe);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", observe);
    };
  }, []);
  // Atualizar posRef sempre que pos muda
  useEffect(() => { posRef.current = pos; }, [pos]);

  const mod = (n: number, m: number) => ((n % m) + m) % m;

  // Loop de inércia da rolagem
  // inércia removida

  // startMomentum guardado em ref para evitar reatribuições
  // inércia removida

  // Animação suave até uma posição alvo (em unidades de índice)
  const animatePosTo = React.useCallback((targetPos: number, duration = 320) => {
    const startTime = performance.now();
    const start = posRef.current;
    // escolher menor caminho circular entre índices [0,26)
    let delta = mod(targetPos - start, 26);
    if (delta > 13) delta -= 26;

    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
  // inércia removida

  const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);
    const frame = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
  const eased = easeOutQuint(t);
      const next = start + delta * eased;
      setPos(next);
      if (t < 1) {
        rafIdRef.current = requestAnimationFrame(frame);
      } else {
        rafIdRef.current = null;
      }
    };
    rafIdRef.current = requestAnimationFrame(frame);
  }, []);

  // inércia removida

  // Scroll por roda do mouse altera posição fracionária
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY;
  // um passo por evento

      // cancelar animação em progresso
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

  const dir = delta > 0 ? 1 : -1;
  const nearest = Math.round(posRef.current);
  animatePosTo(nearest + dir, 180);
    };

    const filter = filterRef.current;
    if (filter) {
      filter.addEventListener("wheel", handleWheel, { passive: false });
      return () => filter.removeEventListener("wheel", handleWheel);
    }
  }, [animatePosTo]);

  // Touch events para mobile (scroll horizontal infinito)
  useEffect(() => {
    if (!isMobile) return;

    const handleTouchStart = (e: TouchEvent) => {
      setTouchStartX(e.touches[0].clientX);
      setIsDragging(true);
      
      // Cancelar qualquer animação em progresso
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      
      e.preventDefault();
      const currentX = e.touches[0].clientX;
      const deltaX = touchStartX - currentX;
      
      // Sensibilidade do scroll - quanto menor, mais sensível
      const sensitivity = 30;
      const steps = Math.round(deltaX / sensitivity);
      
      if (Math.abs(steps) >= 1) {
        const current = mod(posRef.current, LETTERS.length);
        const newPos = current + steps;
        
        // Scroll infinito
        const wrappedPos = mod(newPos, LETTERS.length);
        animatePosTo(wrappedPos, 150);
        
        setTouchStartX(currentX);
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      
      // Snap para a posição mais próxima
      const current = posRef.current;
      const nearest = Math.round(current);
      animatePosTo(mod(nearest, LETTERS.length), 200);
    };

    const filter = filterRef.current;
    if (filter) {
      filter.addEventListener('touchstart', handleTouchStart, { passive: false });
      filter.addEventListener('touchmove', handleTouchMove, { passive: false });
      filter.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        filter.removeEventListener('touchstart', handleTouchStart);
        filter.removeEventListener('touchmove', handleTouchMove);
        filter.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isMobile, isDragging, touchStartX, animatePosTo]);
  
  // Atualiza activeLetter sempre que pos muda
  useEffect(() => {
    const p = mod(pos, LETTERS.length);
    const newLetter = LETTERS[Math.round(p) % LETTERS.length];
    if (newLetter !== activeLetter) setActiveLetter(newLetter);
  }, [pos, activeLetter]);

  const handleLetterClick = (letter: string, e: React.MouseEvent) => {
    e.preventDefault();

      const idx = LETTERS.indexOf(letter);
      if (idx === -1) return;

  // brilho removido; apenas animação fluida

      const current = mod(posRef.current, LETTERS.length);
      // alvo é o índice inteiro dessa letra pelo caminho mais curto
      let delta = mod(idx - Math.round(current), LETTERS.length);
      if (delta > 13) delta -= 26;
      const target = Math.round(current) + delta;
      animatePosTo(target, 220);
      setActiveLetter(letter);
      setAlphaInteracted(true);
      onAlphaInteraction?.(); // Notifica o pai sobre interação
    };

  // Inicializar posição centralizando a letra ativa após medição
  useEffect(() => {
    if (initializedRef.current) return;
    const idx = LETTERS.indexOf(activeLetter);
    setPos(idx);
    initializedRef.current = true;
  }, [activeLetter]);

  return (
  <div className={styles.contentArea} ref={areaRef}>
      <div 
        className={styles.alphaFilter} 
        aria-label="Filtro alfabético"
        ref={filterRef}
      >
        <div className={styles.alphaFilter__wheel}>
          {isMobile ? (
            // Renderização horizontal infinita para mobile
            (() => {
              const p = mod(pos, LETTERS.length);
              const base = Math.floor(p);
              const frac = p - base;
              const nodes: React.ReactNode[] = [];
              
              // Renderizar mais letras para scroll infinito
              const visibleCount = 15; // Quantas letras mostrar
              const half = Math.floor(visibleCount / 2);
              
              for (let j = -half; j <= half; j++) {
                const k = base + j;
                const letterIndex = mod(k, LETTERS.length);
                const letter = LETTERS[letterIndex];
                const isActive = letterIndex === Math.round(p) % LETTERS.length;
                
                // Posição horizontal baseada na posição fracionária
                const offsetX = (j - frac) * 32; // 32px é o espaçamento entre letras
                
                nodes.push(
                  <button
                    key={`${letter}-${k}-mobile`}
                    className={`${styles.alphaFilter__item} ${isActive ? styles['alphaFilter__item--active'] : ''}`}
                    onClick={(e) => handleLetterClick(letter, e)}
                    aria-pressed={isActive}
                    style={{ 
                      position: 'relative',
                      transform: `translateX(${offsetX}px)`,
                      transition: isDragging ? 'none' : 'transform 0.1s ease'
                    }}
                  >
                    {letter}
                  </button>
                );
              }
              return nodes;
            })()
          ) : (
            // Renderização vertical para desktop (código original)
            (() => {
              const p = mod(pos, LETTERS.length);
              const base = Math.floor(p);
              const frac = p - base; // [0,1)
              const centerY = containerH / 2 - CENTER_BIAS_PX;
              const windowSize = Math.max(13, Math.ceil(containerH / STEP) + 3);
              const half = Math.floor(windowSize / 2);
              const activeIdx = Math.round(p) % LETTERS.length;
              const nodes: React.ReactNode[] = [];
              for (let j = -half; j <= half; j++) {
                const k = base + j;
                const letterIndex = mod(k, LETTERS.length);
                const letter = LETTERS[letterIndex];
                const y = centerY + (j - frac) * STEP;
                const isActive = letterIndex === activeIdx && Math.abs(j - frac) < 0.5;
                nodes.push(
                  <button
                    key={`${letter}-${k}`}
                    className={`${styles.alphaFilter__item} ${isActive ? styles['alphaFilter__item--active'] : ''}`}
                    onClick={(e) => handleLetterClick(letter, e)}
                    aria-pressed={isActive}
                    style={{ position: 'absolute', top: `${y}px`, left: '50%', transform: 'translateX(-50%)', opacity: 1 }}
                  >
                    {letter}
                  </button>
                );
              }
              return nodes;
            })()
          )}
        </div>
      </div>

  <div className={styles.contactList} ref={rightRef}>
        <div className={styles.contactList__section}>
          <div className={styles.contactList__sectionHeader}>
            <span className={styles.sectionLetter}>{activeLetter}</span>
            <div className={styles.divider} />
          </div>

          {/* Status */}
          {error && (
            <div className={styles["contactList__status"]}>
              <div className={`${styles.status} ${styles.error}`} role="alert">{error}</div>
            </div>
          )}

          <div className={styles.table}>
            <div className={styles.table__head}>
              <span className={`${styles.th} ${styles['th--name']}`}>Nome</span>
              <span className={`${styles.th} ${styles['th--phone']}`}>Telefone</span>
              <span className={`${styles.th} ${styles['th--email']}`}>Email</span>
              <span className={`${styles.th} ${styles['th--actions']}`} />
            </div>

            <div className={styles.table__body}>
              {visibleContacts.length > 0 ? (
                visibleContacts.map((c) => (
                  <ContactRow
                    key={c.id}
                    contact={c}
                    onEditContact={onEditContact}
                    isEncrypted={encryptedContacts.has(c.id)}
                    onToggleEncryption={onToggleContactEncryption}
                    onDeleteContact={handleDeleteContact}
                  />
                ))
              ) : (
                <div className={styles.table__empty}>
                  <span>
                    {isSearching ? `Nenhum contato encontrado para "${search}"` : `Nenhum contato encontrado para a letra ${activeLetter}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
