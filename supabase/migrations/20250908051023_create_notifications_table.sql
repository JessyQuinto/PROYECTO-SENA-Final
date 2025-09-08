-- Create notifications table
create table if not exists public.notifications (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    message text not null,
    type text not null check (type in ('info', 'success', 'warning', 'error')),
    read boolean default false,
    link text,
    user_id uuid references auth.users(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for user_id
create index if not exists idx_notifications_user_id on public.notifications (user_id);

-- Create index for read status
create index if not exists idx_notifications_read on public.notifications (read);

-- Create index for created_at
create index if not exists idx_notifications_created_at on public.notifications (created_at);

-- Set up Row Level Security (RLS)
alter table public.notifications enable row level security;

-- Create policies
create policy "Users can view their own notifications"
    on public.notifications for select
    using ( auth.uid() = user_id );

create policy "Users can update their own notifications"
    on public.notifications for update
    using ( auth.uid() = user_id );

create policy "Users can insert their own notifications"
    on public.notifications for insert
    with check ( auth.uid() = user_id );

create policy "Users can delete their own notifications"
    on public.notifications for delete
    using ( auth.uid() = user_id );

-- Create updated_at trigger
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create trigger update_notifications_updated_at 
    before update on public.notifications 
    for each row 
    execute function public.update_updated_at_column();