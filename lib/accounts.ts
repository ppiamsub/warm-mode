// Helper: โหลดรายการบัญชี (memberships) ของผู้ใช้ สำหรับหน้า Hub
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Account, Role } from '@/types';
import { baht } from '@/lib/calc';

export async function loadAccounts(db: SupabaseClient, userId: string): Promise<Account[]> {
  const { data: memberships } = await db
    .from('memberships')
    .select('book_id, role, person_id, books(name)')
    .eq('user_id', userId);

  if (!memberships) return [];

  const accounts: Account[] = [];
  for (const m of memberships as any[]) {
    const bookRel = Array.isArray(m.books) ? m.books[0] : m.books;
    const bookName: string = bookRel?.name ?? 'บัญชี';
    const role: Role = m.role;

    let subtitle: string;
    if (role === 'admin') {
      const { count } = await db
        .from('people')
        .select('id', { count: 'exact', head: true })
        .eq('book_id', m.book_id);
      subtitle = `ผู้ดูแล · ${count ?? 0} สมาชิก`;
    } else if (m.person_id) {
      const { data: entries } = await db.from('entries').select('amount, paid_amount').eq('person_id', m.person_id);
      const remaining = (entries ?? []).reduce(
        (s: number, e: any) => s + Math.max(Number(e.amount) - Number(e.paid_amount), 0),
        0
      );
      subtitle = `สมาชิก · ค้าง ${baht(remaining)}`;
    } else {
      subtitle = 'สมาชิก';
    }

    accounts.push({ bookId: m.book_id, bookName, role, personId: m.person_id ?? undefined, subtitle });
  }
  return accounts;
}
