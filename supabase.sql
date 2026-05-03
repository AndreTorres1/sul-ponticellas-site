create table if not exists events (
  id text primary key,
  title text not null,
  venue text default '',
  city text default '',
  country text default 'España',
  date date not null,
  time text default '',
  price text default '',
  description text default '',
  ticket_url text default '',
  published boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table if not exists inquiries (
  id text primary key,
  intent text default 'Contacto',
  name text not null,
  email text not null,
  event_date text default '',
  event_type text default '',
  phone text default '',
  message text not null,
  created_at timestamptz default now()
);

create table if not exists reviews (
  id text primary key,
  name text not null,
  event text default '',
  rating integer not null check (rating between 1 and 5),
  message text not null,
  approved boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create index if not exists events_published_date_idx on events (published, date);
create index if not exists inquiries_created_at_idx on inquiries (created_at desc);
create index if not exists reviews_approved_created_at_idx on reviews (approved, created_at desc);
