-- =============================================================================
-- Johnny SaaS — support tickets (client + admin)
-- =============================================================================

create type ticket_status as enum ('open', 'answered', 'closed');

create table tickets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles (id) on delete cascade,
  subject    text not null,
  status     ticket_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on tickets (user_id, updated_at desc);
create index on tickets (status, updated_at desc);

create trigger t_tickets_updated
  before update on tickets
  for each row execute procedure moddatetime (updated_at);

create table ticket_messages (
  id         uuid primary key default gen_random_uuid(),
  ticket_id  uuid not null references tickets (id) on delete cascade,
  sender_id  uuid references profiles (id) on delete set null,
  from_admin boolean not null default false,
  body       text not null,
  created_at timestamptz not null default now()
);
create index on ticket_messages (ticket_id, created_at);

alter table tickets enable row level security;
alter table ticket_messages enable row level security;

create policy "tickets: owner or admin select"
  on tickets for select using (user_id = auth.uid() or is_admin());
create policy "tickets: owner insert"
  on tickets for insert with check (user_id = auth.uid());
create policy "tickets: owner or admin update"
  on tickets for update using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid() or is_admin());

create policy "ticket_messages: owner or admin select"
  on ticket_messages for select using (
    is_admin() or exists (
      select 1 from tickets t
      where t.id = ticket_messages.ticket_id and t.user_id = auth.uid()
    )
  );
create policy "ticket_messages: owner or admin insert"
  on ticket_messages for insert with check (
    is_admin() or exists (
      select 1 from tickets t
      where t.id = ticket_messages.ticket_id and t.user_id = auth.uid()
    )
  );
