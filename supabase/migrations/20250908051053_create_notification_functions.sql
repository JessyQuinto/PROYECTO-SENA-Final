-- Create function to add a notification for the current user
create or replace function public.add_notification(
    title text,
    message text,
    type text default 'info',
    link text default null
)
returns uuid
as $$
declare
    notification_id uuid;
begin
    -- Validate input
    if title is null or title = '' then
        raise exception 'Title is required';
    end if;
    
    if message is null or message = '' then
        raise exception 'Message is required';
    end if;
    
    if type is not null and type not in ('info', 'success', 'warning', 'error') then
        raise exception 'Invalid notification type. Must be one of: info, success, warning, error';
    end if;
    
    -- Insert notification for current user
    insert into public.notifications (title, message, type, link, user_id)
    values (title, message, coalesce(type, 'info'), link, auth.uid())
    returning id into notification_id;
    
    return notification_id;
end;
$$ language plpgsql security definer;

-- Create function to mark notification as read
create or replace function public.mark_notification_as_read(
    notification_id uuid
)
returns boolean
as $$
begin
    -- Update notification as read for current user
    update public.notifications
    set read = true
    where id = notification_id
      and user_id = auth.uid();
    
    -- Return true if a row was updated
    return found;
end;
$$ language plpgsql security definer;

-- Create function to mark all notifications as read
create or replace function public.mark_all_notifications_as_read()
returns integer
as $$
declare
    updated_count integer;
begin
    -- Update all notifications as read for current user
    update public.notifications
    set read = true
    where user_id = auth.uid()
      and read = false;
    
    -- Return the number of rows updated
    get diagnostics updated_count = row_count;
    return updated_count;
end;
$$ language plpgsql security definer;